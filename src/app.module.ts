import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Building } from './modules/building/entities/building.entity';
import { Parcel } from './modules/building/entities/parcel.entity';
import { Permit } from './modules/building/entities/permit.entity';
import { BuildingModule } from './modules/building/building.module';
import { IntellexGateway } from './libs/gateways/intellex.gateway';
import * as process from 'process';
import { ScheduleModule } from '@nestjs/schedule';
import { CronService } from './cron/cron.service';
import { HttpModule, HttpService } from '@nestjs/axios';
import { BuildingService } from './modules/building/building.service';

const entities = [Building];
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: 5432,
      username: process.env.DB_USERNAME, // postgres user
      password: process.env.DB_PASSWORD, // postgres password
      database: process.env.DB_NAME, // database name
      entities: [Building, Parcel, Permit],
      synchronize: true, // TODO DO NOT MAKE true on PROD
      logging: true,
    }),
    BuildingModule, // import Building module
    ScheduleModule.forRoot(),
    HttpModule,
  ],
  providers: [],
  exports: [HttpModule],
})
export class AppModule {}
