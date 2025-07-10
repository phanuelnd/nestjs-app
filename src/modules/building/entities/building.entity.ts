import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

import { Polygon } from 'geojson';

@Entity('buildings')
export class Building {
      @PrimaryGeneratedColumn()
      id: number;

      @Column({ unique: true })
      building_id: string;

      @Column({ type: 'varchar', length: 255, nullable: true })
      parcel_id: string;
      
      @Column({ type: 'varchar', length: 255, nullable: true })
      permit_id: string;

      @Column({ default: 'pending' })
      status: string;

      @Column({ type: 'geometry', spatialFeatureType: 'Polygon', srid: 4326 })
      footprint: Polygon;
      
      @Column({ type: 'float', nullable: true })
      longitude: number;
  
      @Column({ type: 'float', nullable: true })
      latitude: number;
  
      @Column({ type: 'varchar', length: 255, nullable: true })
      province: string;
  
      @Column({ type: 'varchar', length: 255, nullable: true })
      sector: string;
  
      @Column({ type: 'varchar', length: 255, nullable: true })
      district: string;
  
      @Column({ type: 'varchar', length: 255, nullable: true })
      cell: string;
  
      @Column({ type: 'varchar', length: 255, nullable: true })
      village: string;

      @Column({ type: 'varchar', length: 255, nullable: true, default: 'GEOSPATIAL_FOOTPRINT_FROM_RSA' })
      data_source: string;
          
      @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
      created_at: Date;

      @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
      updated_at: Date;

}
