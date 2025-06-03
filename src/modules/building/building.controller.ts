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
    // The +id attempts to convert a string ID to a number if your primary keys are numeric.
    // If your building_id is a string, you might not need the +.
    // Adjust based on your entity's ID type and service method.
    // const building = await this.buildingService.findOneById(+id); // Or findOneByBuildingId(id)
    
    // Let's assume you have a method in your service like `findOneByStringId`
    // or your `id` param is meant to be the primary key.
    // For now, this is a placeholder. You'll need to ensure your service
    // has a method that matches how you want to look up by ID.
    // For example, if 'id' in @Param('id') refers to the primary key:
    const building = await this.buildingService.findOne(id); // Assuming findOne in service takes PK

    if (!building) {
      throw new NotFoundException(`Building with ID ${id} not found`);
    }
    return building;
  }
} 