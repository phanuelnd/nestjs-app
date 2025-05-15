import { Controller, Get, Post, Body } from '@nestjs/common';
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
}
