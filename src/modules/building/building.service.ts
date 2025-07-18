import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Building } from './entities/building.entity';
import { CreateBuildingDto } from './dto/create-building.dto';
import { FindBuildingsQueryDto } from './dto/find-buildings-query.dto';
import { Raw } from 'typeorm';


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
    // To avoid many insertion for same building and avoiding unicity constraints on db which can make database crash
    if (!building) {
      const building = this.buildingRepository.create(createBuildingDto);
      return this.buildingRepository.save(building);
    }
    return building;
  }

 async findAll(): Promise<Building[]> {
  return this.buildingRepository.find(); // Remove non-existent relations
}

async getStatistics() {
  const total = await this.buildingRepository.count();
  const statusCounts = await this.buildingRepository.createQueryBuilder('building')
    .select('building.status', 'status')
    .addSelect('COUNT(*)', 'count')
    .groupBy('building.status')
    .getRawMany();
  return {
    total,
    byStatus: statusCounts.reduce((acc, cur) => {
      acc[cur.status] = Number(cur.count);
      return acc;
    }, {} as Record<string, number>),
  };
}

async getBuildingByBuildingId(building_id: string) {
  return this.buildingRepository.findOne({
    where: { building_id },
  });
}

async getBuildingsByParcelId(parcel_id: string): Promise<Building[]> {
  return this.buildingRepository.find({
    where: { parcel_id },
  });
}

async getProvinces() {
  const provinces = await this.buildingRepository.createQueryBuilder('building')
    .select('DISTINCT building.province', 'province')
    .where('building.province IS NOT NULL')
    .orderBy('province', 'ASC')
    .getRawMany();
  return provinces.map(p => p.province).filter(Boolean);
}

async getDistricts(province?: string) {
  const qb = this.buildingRepository.createQueryBuilder('building')
    .select('DISTINCT building.district', 'district')
    .where('building.district IS NOT NULL');
  if (province) qb.andWhere('building.province = :province', { province });
  const districts = await qb.orderBy('district', 'ASC').getRawMany();
  return districts.map(d => d.district).filter(Boolean);
}

async getSectors(district?: string) {
  const qb = this.buildingRepository.createQueryBuilder('building')
    .select('DISTINCT building.sector', 'sector')
    .where('building.sector IS NOT NULL');
  if (district) qb.andWhere('building.district = :district', { district });
  const sectors = await qb.orderBy('sector', 'ASC').getRawMany();
  return sectors.map(s => s.sector).filter(Boolean);
}


async getBuildingsByCoordinates(latitude: string, longitude: string): Promise<Building | null> {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  
  if (isNaN(lat) || isNaN(lng)) {
    return null;
  }

  const point = `POINT(${lng} ${lat})`;
  
  // First attempt: Find building that exactly contains the clicked point
  const exactMatch = await this.buildingRepository
    .createQueryBuilder('building')
    .where(
      'ST_Contains(building.footprint, ST_GeomFromText(:point, 4326))',
      { point }
    )
    .getOne();

  if (exactMatch) {
    return exactMatch;
  }

  // Fallback: Find closest building within small tolerance, ordered by distance
  const nearbyMatch = await this.buildingRepository
    .createQueryBuilder('building')
    .where(
      'ST_DWithin(building.footprint, ST_GeomFromText(:point, 4326), :tolerance)',
      { 
        point,
        tolerance: 0.0001 // Small tolerance for nearby search
      }
    )
    .orderBy('ST_Distance(building.footprint, ST_GeomFromText(:point, 4326))', 'ASC')
    .setParameter('point', point)
    .getOne();

  return nearbyMatch;
}

async findAllPaginated(query: FindBuildingsQueryDto): Promise<{ data: Building[]; meta: { total: number; currentPage: number; totalPages: number } }> {
  const {
    page = 1,
    limit = 20,
    sortBy = 'id',
    sortDirection = 'ASC',
    search,
    statusFilter,
    statusFilters,
    parcelIdFilter,
    permitIdFilter,
    dateFrom,
    dateTo,
    province,
    district,
    sector,
  } = query;

  const qb = this.buildingRepository.createQueryBuilder('building');

  if (search) {
    qb.andWhere(
      '(building.building_id ILIKE :search OR building.province ILIKE :search OR building.district ILIKE :search OR building.sector ILIKE :search OR building.cell ILIKE :search OR building.village ILIKE :search)',
      { search: `%${search}%` },
    );
  }
  if (statusFilters && statusFilters.length > 0) {
    qb.andWhere('building.status IN (:...statusFilters)', { statusFilters });
  } else if (statusFilter) {
    qb.andWhere('building.status = :status', { status: statusFilter });
  }
  if (parcelIdFilter) qb.andWhere('building.parcel_id = :parcelId', { parcelId: parcelIdFilter });
  if (permitIdFilter) qb.andWhere('building.permit_id = :permitId', { permitId: permitIdFilter });
  if (dateFrom) qb.andWhere('building.created_at >= :dateFrom', { dateFrom });
  if (dateTo) qb.andWhere('building.created_at <= :dateTo', { dateTo });
  if (province) qb.andWhere('building.province = :province', { province });
  if (district) qb.andWhere('building.district = :district', { district });
  if (sector) qb.andWhere('building.sector = :sector', { sector });

  qb.orderBy(`building.${sortBy}`, sortDirection)
    .skip((page - 1) * limit)
    .take(limit);

  const [data, total] = await qb.getManyAndCount();
  const totalPages = Math.ceil(total / limit);
  return { data, meta: { total, currentPage: page, totalPages } };
}

async findByCoordinates(latitude: number, longitude: number, tolerance: number): Promise<Building | null> {
  return this.buildingRepository
    .createQueryBuilder('building')
    .where(
      'ST_DWithin(building.footprint, ST_GeomFromText(:point, 4326), :tolerance)',
      {
        point: `POINT(${longitude} ${latitude})`,
        tolerance
      }
    )
    .getOne();
}

}


