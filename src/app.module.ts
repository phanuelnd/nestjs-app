import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Building } from './building/entities/building.entity';
import { Parcel } from './building/entities/parcel.entity';
import { Permit } from './building/entities/permit.entity';
import { BuildingModule } from './building/building.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',   // postgres user
      password: 'Passcode',   // postgres password
      database: 'project_crud_db', // database name
      entities: [Building, Parcel, Permit],
      synchronize: true, // makes tables match entities automatically
      logging: true,
    }),
    BuildingModule, // import Building module
  ],
})
export class AppModule {}
