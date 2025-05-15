import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Building } from './entities/building.entity';
import { CreateBuildingDto } from './dto/create-building.dto';

@Injectable()
export class BuildingService {
  constructor(
    @InjectRepository(Building)
    private readonly buildingRepository: Repository<Building>,
  ) {}

  async create(createBuildingDto: CreateBuildingDto): Promise<Building> {
    const { parcel_id, permit_id, ...buildingData } = createBuildingDto;
    
    const building = this.buildingRepository.create(buildingData);
    
    if (parcel_id) {
      building.parcel = { id: Number(parcel_id) } as any;
    }
    
    if (permit_id) {
      building.permit = { id: Number(permit_id) } as any;
    }
    
    return await this.buildingRepository.save(building);
  }

  async findAll(): Promise<Building[]> {
    return this.buildingRepository.find({ relations: ['parcel', 'permit'] });
  }
}
