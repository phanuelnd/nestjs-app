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

// Define a basic DTO for query parameters if you don't have one yet.
// For a real app, this should be more robust and potentially in its own file.
export class FindBuildingsQueryDto {
  page?: number = 1;
  limit?: number = 20;
  sortBy?: string = 'id';
  sortDirection?: 'ASC' | 'DESC' = 'ASC';
  search?: string;
  statusFilter?: string;
  parcelIdFilter?: string;
  permitIdFilter?: string;
  dateFrom?: string;
  dateTo?: string;
}

@Controller('buildings')
export class BuildingController {
  constructor(private readonly buildingService: BuildingService,
              private readonly csvProcessorService: CsvProcessorService
  ) {}

  @Get()
  async findAll(@Query() query: FindBuildingsQueryDto) {
    return this.buildingService.findAllPaginated(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Building> {
    const building = await this.buildingService.findOne(id); // Assuming findOne in service takes PK

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