import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Building } from "../../modules/building/entities/building.entity";
import { IntellexGateway } from "../../libs/gateways/intellex.gateway";
import * as Papa from "papaparse";
import wellknown from "wellknown";

export interface ProcessingResult {
    total: number;
    inserted: number;
    skipped: number;
    errors: string[];
}

@Injectable()
export class CsvProcessorService {
    private readonly logger = new Logger(CsvProcessorService.name);
    
    constructor(
        @InjectRepository(Building)
        private readonly buildingRepository: Repository<Building>,
        private readonly intellexGateway: IntellexGateway, // Inject IntellexGateway to use its methods
    ) {}
    
   async processCsv(csvContent: string, startFromRow: number = 1): Promise<ProcessingResult> {
    const result: ProcessingResult = {
        total: 0,
        inserted: 0,
        skipped: 0,
        errors: [],
    };

    try {
        const parsedData = Papa.parse(csvContent, {
            header: true,
            skipEmptyLines: true,
        });

        if (parsedData.errors.length) {
            this.logger.error("CSV parsing errors", parsedData.errors);
            result.errors.push(...parsedData.errors.map(err => err.message));
            return result;
        }

        // Log resume info
        if (startFromRow > 1) {
            this.logger.log(`Resuming CSV processing from row ${startFromRow}`);
        }

        for (const [index, row] of parsedData.data.entries()) {
            const currentRowNumber = index + 1;
            
            // Skip rows before startFromRow
            if (currentRowNumber < startFromRow) {
                result.skipped++;
                continue;
            }
            
            try {
                const building = await this.createBuildingFromRow(row, currentRowNumber);
                if (building) {
                    result.inserted++;
                } else {
                    result.skipped++;
                }
                
                // Log progress every 1000 rows
                if (currentRowNumber % 1000 === 0) {
                    this.logger.log(`Processed ${currentRowNumber} rows - Inserted: ${result.inserted}, Skipped: ${result.skipped}`);
                }
            }
            catch (error) {
                this.logger.error(`Error processing row ${currentRowNumber}: ${error.message}`);
                result.errors.push(`Row ${currentRowNumber}: ${error.message}`);
                result.skipped++;
            }
        }
        
        this.logger.log(`CSV processing complete: ${result.inserted} inserted, ${result.skipped} skipped from ${startFromRow} to ${parsedData.data.length}`);
        result.total = parsedData.data.length;
        return result;

    }
    catch (error) {
        this.logger.error("Error processing CSV", error);
        result.errors.push(`CSV processing error: ${error.message}`);
        return result;
    }
}

    private async checkDuplicateBuilding(lat: number, lng:number): Promise<boolean> {
        const existingBuilding = await this.buildingRepository.findOne({ where: { 
            latitude: lat,
            longitude: lng 
        } });
        return !!existingBuilding; // Returns true if a building with the same coordinates exists
    }

    private async createBuildingFromRow(row: any, rowIndex: number): Promise<Building | null> {
        const buildingID = this.generateBuildingId(row, rowIndex);
        const existingBuilding = await this.buildingRepository.findOne({ where: { building_id: buildingID } });

        // Check for duplicate building based on coordinates
        const hasDuplicateCoordinates = await this.checkDuplicateBuilding(parseFloat(row.latitude), parseFloat(row.longitude));
        if (hasDuplicateCoordinates) {
            this.logger.warn(`Building with coordinates (${row.latitude}, ${row.longitude}) already exists, skipping row ${rowIndex}`);
            return null; // Skip if coordinates already exist
        }
        
        if (existingBuilding) {
            this.logger.warn(`Building with ID ${buildingID} already exists, skipping row ${rowIndex}`);
            return null; // Skip if building already exists
        }
        // Get building's permit ID using IntellexGateway api (sending the UPI)
        
        const permitIdApiCallResult = await this.intellexGateway.getPermitIdByUpi(row.upi);
        const permitId = permitIdApiCallResult ? permitIdApiCallResult.permitId : null;
        const permitSource = permitIdApiCallResult ? permitIdApiCallResult.source : 'Unknown';

        const geometry = wellknown.parse(row.geo);
        const building = this.buildingRepository.create({
            building_id: buildingID,
            status: 'BUILT',
            footprint: geometry,
            longitude: parseFloat(row.longitude),
            latitude: parseFloat(row.latitude),
            province: row.Province || null,
            sector: row.Sector || null,
            district: row.District || null,
            cell: row.Cell || null,
            village: row.Village || null,
            data_source: 'GEOSPATIAL_FOOTPRINT_FROM_RSA',
            parcel_id: row.upi || null,
            permit_id: permitId || undefined, // Use the fetched permit ID
            permit_source: permitSource || undefined, // Use the fetched permit source
        });
        try {
            return await this.buildingRepository.save(building);
        } catch (error) {
            this.logger.error(`Error saving building from row ${rowIndex}: ${error.message}`);
            throw error; // Rethrow to handle in the main processing loop
        }
    }

    private generateBuildingId(row: any, rowIndex: number): string {

        const provinces_map = {
            'City of Kigali': 'KGL',
            'Northern Province': 'NOR',
            'Southern Province': 'SOU',
            'Eastern Province': 'EAS',
            'Western Province': 'WES',
        };
        const province = row.Province ? provinces_map[row.Province] || row.Province : 'Unknown';
        const scaledLatitude = this.scaleCoordinate(parseFloat(row.latitude), true);
        const scaledLongitude = this.scaleCoordinate(parseFloat(row.longitude), false);

        return `RW-${province}-${scaledLatitude}-${scaledLongitude}`; // Unique ID based on province, row index, and timestamp
    }  
    
    private scaleCoordinate(coordinate: number, isLatitude: boolean): string {
        // Scale coordinate by 10^7 and truncate to 7 digits
        const scaled = Math.floor(Math.abs(coordinate) * 1e8);
        const truncated = scaled.toString().padStart(10, '0').substring(0, 10);

        // Determine prefix based on coordinate type and sign
        const prefix = isLatitude
            ? (coordinate >= 0 ? 'N' : 'S')
            : (coordinate >= 0 ? 'E' : 'W');

        return `${prefix}${truncated}`;
    }

}


