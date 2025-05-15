import { Module } from '@nestjs/common';
import { BuildingService } from './building.service';
import { BuildingController } from './building.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Building } from './entities/building.entity';
import { Parcel } from './entities/parcel.entity';
import { Permit } from './entities/permit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Building, Parcel, Permit])],
  controllers: [BuildingController],
  providers: [BuildingService],
})
export class BuildingModule {}
