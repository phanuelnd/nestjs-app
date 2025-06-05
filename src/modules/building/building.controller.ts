import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { BuildingService } from './building.service';
import { Building } from './entities/building.entity';

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
  constructor(private readonly buildingService: BuildingService) {}

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
} 