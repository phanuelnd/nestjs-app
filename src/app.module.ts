import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';

// Existing imports
import { Building } from './modules/building/entities/building.entity';
import { BuildingModule } from './modules/building/building.module';
import { IntellexGateway } from './libs/gateways/intellex.gateway';
import { CronService } from './services/cron/cron.service';
import { BuildingService } from './modules/building/building.service';

// New auth imports
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './auth/email/email.module';
import { User } from './modules/auth/entities/user.entity';
import { SeederService } from './database/seeders/seeder.service';
import { SuperAdminSeeder } from './database/seeders/super-admin.seeder';

import * as process from 'process';

const entities = [Building, User]; // Add User entity

@Module({
  imports: [
    // Add ConfigModule for environment variables
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: 5432,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: entities, // Use the entities array
      synchronize: true, // TODO DO NOT MAKE true on PROD
      logging: false, // Disable logging for production
    }),
    // Add TypeOrmModule for User entity (needed for seeders)
    TypeOrmModule.forFeature([User]),
    BuildingModule, // Your existing module
    ScheduleModule.forRoot(),
    HttpModule,
    // New auth modules
    AuthModule,
    EmailModule,
  ],
  providers: [
    // Add seeder services
    SeederService,
    SuperAdminSeeder,
  ],
  exports: [HttpModule],
})
export class AppModule {}