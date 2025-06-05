import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Building } from "src/modules/building/entities/building.entity";
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
    ) {}
    
    async processCsv(csvContent: string): Promise<ProcessingResult> {
        
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

            for (const [index, row] of parsedData.data.entries()) {
                
                try{
                    const building = await this.createBuildingFromRow(row, index+1);
                    if (building) {
                        result.inserted++;
                    } else {
                        result.skipped++;
                    }
                }
                catch (error) {
                    this.logger.error(`Error processing row ${index + 1}: ${error.message}`);
                    result.errors.push(`Row ${index + 1}: ${error.message}`);
                    result.skipped++;
                }
               
            }
            this.logger.log(`CSV processing complete: ${result.inserted} inserted, ${result.skipped} skipped`);
            result.total = parsedData.data.length;
            return result;

        }
        catch (error) {
            this.logger.error("Error processing CSV", error);
            result.errors.push(`CSV processing error: ${error.message}`);
            return result;
        }
    }

    private async createBuildingFromRow(row: any, rowIndex: number): Promise<Building | null> {
        const buildingID = this.generateBuildingId(row, rowIndex);
        const existingBuilding = await this.buildingRepository.findOne({ where: { building_id: buildingID } });
        if (existingBuilding) {
            this.logger.warn(`Building with ID ${buildingID} already exists, skipping row ${rowIndex}`);
            return null; // Skip if building already exists
        }
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


