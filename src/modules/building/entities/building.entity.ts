import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Parcel } from './parcel.entity';
import { Permit } from './permit.entity';
import { Geometry } from 'geojson';

@Entity('buildings')
export class Building {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  building_id: string;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Polygon',
    srid: 4326,
    nullable: true,
  })
  footprint: Geometry;

  @ManyToOne(() => Parcel, { nullable: true })
  @JoinColumn({ name: 'parcel_id' })
  parcel: Parcel;

  @ManyToOne(() => Permit, { nullable: true })
  @JoinColumn({ name: 'permit_id' })
  permit: Permit;

  @Column({ default: 'pending' })
  status: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
