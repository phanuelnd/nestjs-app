import { Module } from '@nestjs/common';
import { BuildingService } from './building.service';
import { BuildingController } from './building.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Building } from './entities/building.entity';
import { Parcel } from './entities/parcel.entity';
import { Permit } from './entities/permit.entity';
import { IntellexGateway } from '../../libs/gateways/intellex.gateway';
import { CronService } from '../../cron/cron.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [TypeOrmModule.forFeature([Building, Parcel, Permit]), HttpModule],
  controllers: [BuildingController],
  providers: [BuildingService, IntellexGateway, CronService, BuildingService],
})
export class BuildingModule {}
