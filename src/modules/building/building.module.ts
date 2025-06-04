import { Module } from '@nestjs/common';
import { BuildingService } from './building.service';
// import { BuildingController } from './building.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Building } from './entities/building.entity';
// import { Parcel } from './entities/parcel.entity';
// import { Permit } from './entities/permit.entity';
import { IntellexGateway } from '../../libs/gateways/intellex.gateway';
import { CronService } from '../../cron/cron.service';
import { HttpModule } from '@nestjs/axios';
import { CronStateService } from '../../cron/cron-state.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import { BuildingController } from './building.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Building]),
    HttpModule,
    CacheModule.register({
      store: redisStore,
      port: 6379,
      ttl: 0, // Items never expire
    }),
  ],
  controllers: [BuildingController],
  providers: [
    BuildingService,
    IntellexGateway,
    CronService,
    BuildingService,

    CronStateService,
  ],
})
export class BuildingModule {}
