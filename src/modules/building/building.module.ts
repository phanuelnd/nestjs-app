import { Module } from '@nestjs/common';
import { BuildingService } from './building.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Building } from './entities/building.entity';
import { IntellexGateway } from '../../libs/gateways/intellex.gateway';
import { CronService } from '../../services/cron/cron.service';
import { HttpModule } from '@nestjs/axios';
import { CronStateService } from '../../services/cron/cron-state.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import { BuildingController } from './building.controller';
import { CsvProcessorService } from '../../services/csv-process/csv-processor.service';

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
    CsvProcessorService
  ],
})
export class BuildingModule {}
