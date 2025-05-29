import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Building } from './entities/building.entity';
import { Parcel } from './entities/parcel.entity';
import { CreateBuildingDto } from './dto/create-building.dto';

@Injectable()
export class BuildingService {
  constructor(
    @InjectRepository(Building)
    private readonly buildingRepository: Repository<Building>,

    @InjectRepository(Parcel)
    private readonly parcelRepository: Repository<Parcel>,
  ) {}

  async create(createBuildingDto: CreateBuildingDto): Promise<Building> {
    const building = await this.buildingRepository.findOne({
      where: { building_id: createBuildingDto.building_id },
    });
    // To avoid many insertion for same building and avoiding unicity constraints on db which can made database crash
    if (!building) {
      const building = this.buildingRepository.create(createBuildingDto);
      return this.buildingRepository.save(building);
    }
    return building;
  }

  async findAll(): Promise<Building[]> {
    return this.buildingRepository.find({ relations: ['parcel', 'permit'] });
  }

  async matchBuildingToParcel(buildingId: number): Promise<string> {
    const building = await this.buildingRepository.findOne({
      where: { id: buildingId },
    });

    if (!building) {
      throw new Error('Building not found');
    }

    const matchedParcel = await this.parcelRepository
      .createQueryBuilder('parcel')
      .where('ST_Within(ST_GeomFromGeoJSON(:footprint), parcel.boundary)', {
        footprint: JSON.stringify(building.footprint),
      })
      .getOne();

    if (!matchedParcel) {
      throw new Error('No matching parcel found for this building');
    }

    // Update the Building's parcel_id
    building.parcel = matchedParcel;
    await this.buildingRepository.save(building);

    return `Building matched to Parcel ID ${matchedParcel.id}`;
  }
  async matchAllBuildingsToParcels(): Promise<string> {
    const buildings = await this.buildingRepository.find();

    let matchedCount = 0;
    let unmatchedCount = 0;

    for (const building of buildings) {
      const matchedParcel = await this.parcelRepository
        .createQueryBuilder('parcel')
        .where('ST_Within(ST_GeomFromGeoJSON(:footprint), parcel.boundary)', {
          footprint: JSON.stringify(building.footprint),
        })
        .getOne();

      if (matchedParcel) {
        building.parcel = matchedParcel;
        await this.buildingRepository.save(building);
        matchedCount++;
      } else {
        unmatchedCount++;
      }
    }

    return `Matched ${matchedCount} buildings to parcels. ${unmatchedCount} buildings had no match.`;
  }
}
