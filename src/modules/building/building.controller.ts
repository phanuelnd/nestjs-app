import { Controller, 
  Get, 
  Post,
  Param, 
  Query, 
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards} from '@nestjs/common';

import { BuildingService } from './building.service';
import { Building } from './entities/building.entity';
import { CsvProcessorService, ProcessingResult } from '../../services/csv-process/csv-processor.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { FindBuildingsQueryDto } from './dto/find-buildings-query.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('buildings')
export class BuildingController {
  constructor(private readonly buildingService: BuildingService,
              private readonly csvProcessorService: CsvProcessorService
  ) {}

  @Get('statistics')
  @UseGuards(JwtAuthGuard)
  async getStatistics() {
    return this.buildingService.getStatistics();
  }

  @Get('provinces')
  @UseGuards(JwtAuthGuard)
  async getProvinces() {
    return this.buildingService.getProvinces();
  }

  @Get('districts')
  @UseGuards(JwtAuthGuard)
  async getDistricts(@Query('province') province?: string) {
    return this.buildingService.getDistricts(province);
  }

  @Get('sectors')
  @UseGuards(JwtAuthGuard)
  async getSectors(@Query('district') district?: string) {
    return this.buildingService.getSectors(district);
  }

  @Get('coordinates')
  async findBuildingByCoordinates(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @Query('tolerance') tolerance: string = '0.0001'
  ): Promise<Building> {
    if (!latitude || !longitude) {
      throw new BadRequestException('Both latitude and longitude are required');
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const tol = parseFloat(tolerance);

    if (isNaN(lat) || isNaN(lng) || isNaN(tol)) {
      throw new BadRequestException('Invalid coordinate or tolerance values');
    }

    const building = await this.buildingService.findByCoordinates(lat, lng, tol);
    
    if (!building) {
      throw new NotFoundException('No building found at this location');
    }

    return building;
  }

  @Get('building_id/:building_id')
  async getBuildingByBuildingId(@Param('building_id') building_id: string) {
    return this.buildingService.getBuildingByBuildingId(building_id);
  }

  @Get('parcel')
  async getBuildingsByParcelId(@Query('parcel_id') parcel_id: string) {
    if (!parcel_id) {
      throw new BadRequestException('parcel_id query parameter is required');
    }
    return this.buildingService.getBuildingsByParcelId(parcel_id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Query() query: FindBuildingsQueryDto) {
    return this.buildingService.findAllPaginated(query);
  }

  @Post('import-csv')
  // @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(
    @UploadedFile() file: any,
    @Query('startFromRow') startFromRow?: string): Promise<{ success: boolean; message: string; result: ProcessingResult }> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (file.mimetype !== 'text/csv') {
      throw new BadRequestException('File must be a CSV');
    }

    const csvContent = file.buffer.toString('utf-8');
    const startRow = startFromRow ? parseInt(startFromRow, 10) : 1;  // 👈 Parse the parameter
    const result = await this.csvProcessorService.processCsv(csvContent, startRow);

    return {
      success: true,
      message: 'CSV processing completed',
      result
    };
} 
}