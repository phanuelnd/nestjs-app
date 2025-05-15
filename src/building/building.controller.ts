import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { BuildingService } from './building.service';
import { CreateBuildingDto } from './dto/create-building.dto';
import { Building } from './entities/building.entity';

@Controller('buildings')
export class BuildingController {
  constructor(private readonly buildingService: BuildingService) {}

  @Post()
  async create(@Body() createBuildingDto: CreateBuildingDto): Promise<Building> {
    return this.buildingService.create(createBuildingDto);
  }

  @Get()
  async findAll(): Promise<Building[]> {
    return this.buildingService.findAll();
  }

  @Post(':id/match-parcel')
  async matchParcel(@Param('id') id: string): Promise<string> {
    const buildingId = parseInt(id, 10);
    return this.buildingService.matchBuildingToParcel(buildingId);
  }

  @Post('match-all-parcels')
  async matchAllParcels(): Promise<string> {
    return this.buildingService.matchAllBuildingsToParcels();
  }
}
