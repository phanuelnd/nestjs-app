import { Controller, 
  Get, 
  Post,
  Param, 
  Query, 
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  BadRequestException} from '@nestjs/common';

import { BuildingService } from './building.service';
import { Building } from './entities/building.entity';
import { CsvProcessorService, ProcessingResult } from '../../services/csv-process/csv-processor.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { FindBuildingsQueryDto } from './dto/find-buildings-query.dto';

@Controller('buildings')
export class BuildingController {
  constructor(private readonly buildingService: BuildingService,
              private readonly csvProcessorService: CsvProcessorService
  ) {}

  @Get('statistics')
  async getStatistics() {
    return this.buildingService.getStatistics();
  }

  @Get('provinces')
  async getProvinces() {
    return this.buildingService.getProvinces();
  }

  @Get('districts')
  async getDistricts(@Query('province') province?: string) {
    return this.buildingService.getDistricts(province);
  }

  @Get('sectors')
  async getSectors(@Query('district') district?: string) {
    return this.buildingService.getSectors(district);
  }

  @Get('building_id/:building_id')
  async getBuildingByBuildingId(@Param('building_id') building_id: string) {
    return this.buildingService.getBuildingByBuildingId(building_id);
  }

  @Get()
  async findAll(@Query() query: FindBuildingsQueryDto) {
    return this.buildingService.findAllPaginated(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Building> {
    const building = await this.buildingService.findOne(id); //  findOne in service takes PK

    if (!building) {
      throw new NotFoundException(`Building with ID ${id} not found`);
    }
    return building;
  }

  @Post('import-csv')
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(@UploadedFile() file: any): Promise<{ success: boolean; message: string; result: ProcessingResult }> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (file.mimetype !== 'text/csv') {
      throw new BadRequestException('File must be a CSV');
    }

    const csvContent = file.buffer.toString('utf-8');
    const result = await this.csvProcessorService.processCsv(csvContent);

    return {
      success: true,
      message: 'CSV processing completed',
      result
    };
} 
}