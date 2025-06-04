import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Building } from './entities/building.entity';
import { CreateBuildingDto } from './dto/create-building.dto';
import { FindBuildingsQueryDto } from './building.controller';

@Injectable()
export class BuildingService {
  private readonly logger = new Logger(BuildingService.name);
  constructor(
    @InjectRepository(Building)
    private readonly buildingRepository: Repository<Building>,

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

  // async matchBuildingToParcel(buildingId: number): Promise<string> {
  //   const building = await this.buildingRepository.findOne({
  //     where: { id: buildingId },
  //   });

  //   if (!building) {
  //     throw new Error('Building not found');
  //   }

  //   const matchedParcel = await this.parcelRepository
  //     .createQueryBuilder('parcel')
  //     .where('ST_Within(ST_GeomFromGeoJSON(:footprint), parcel.boundary)', {
  //       footprint: JSON.stringify(building.footprint),
  //     })
  //     .getOne();

  //   if (!matchedParcel) {
  //     throw new Error('No matching parcel found for this building');
  //   }

  //   // Update the Building's parcel_id
  //   building.parcel = matchedParcel;
  //   await this.buildingRepository.save(building);

  //   return `Building matched to Parcel ID ${matchedParcel.id}`;
  // }
  // async matchAllBuildingsToParcels(): Promise<string> {
  //   const buildings = await this.buildingRepository.find();

  //   let matchedCount = 0;
  //   let unmatchedCount = 0;

  //   for (const building of buildings) {
  //     const matchedParcel = await this.parcelRepository
  //       .createQueryBuilder('parcel')
  //       .where('ST_Within(ST_GeomFromGeoJSON(:footprint), parcel.boundary)', {
  //         footprint: JSON.stringify(building.footprint),
  //       })
  //       .getOne();

  //     if (matchedParcel) {
  //       building.parcel = matchedParcel;
  //       await this.buildingRepository.save(building);
  //       matchedCount++;
  //     } else {
  //       unmatchedCount++;
  //     }
  //   }

  //   return `Matched ${matchedCount} buildings to parcels. ${unmatchedCount} buildings had no match.`;
  // }

async countByParcelId(parcelId: string): Promise<number> {
  try {
    const count = await this.buildingRepository
      .createQueryBuilder('building')
      .where('building.parcel_id = :parcelId', { parcelId })
      .getCount();
    
    return count;
  } catch (error) {
    this.logger.error(`Error counting buildings for parcel ${parcelId}: ${error.message}`);
    return 0;
  }
}
async findOne(id: string | number): Promise<Building | null> {
  const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
  if (isNaN(numericId)) {
    throw new Error('Invalid ID');
  }
  return this.buildingRepository.findOne({
    where: { id: numericId },
    // relations: ['parcel', 'permit'], // Removed because relations do not exist
  });
}

async findAllPaginated(query: FindBuildingsQueryDto): Promise<{ data: Building[]; total: number }> {
  const {
    page = 1,
    limit = 20,
    sortBy = 'id',
    sortDirection = 'ASC',
    search,
    statusFilter,
    parcelIdFilter,
    permitIdFilter,
    dateFrom,
    dateTo,
  } = query;

  const qb = this.buildingRepository.createQueryBuilder('building');

  if (search) {
    qb.andWhere('building.building_id ILIKE :search', { search: `%${search}%` });
  }
  if (statusFilter) qb.andWhere('building.status = :status', { status: statusFilter });
  if (parcelIdFilter) qb.andWhere('building.parcel_id = :parcelId', { parcelId: parcelIdFilter });
  if (permitIdFilter) qb.andWhere('building.permit_id = :permitId', { permitId: permitIdFilter });
  if (dateFrom) qb.andWhere('building.created_at >= :dateFrom', { dateFrom });
  if (dateTo) qb.andWhere('building.created_at <= :dateTo', { dateTo });

  qb.orderBy(`building.${sortBy}`, sortDirection)
    .skip((page - 1) * limit)
    .take(limit);

  const [data, total] = await qb.getManyAndCount();
  return { data, total };
}

}


