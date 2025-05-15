import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Geometry } from 'geojson';

@Entity('parcels')
export class Parcel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  parcel_number: string;

  @Column({ nullable: true })
  owner_name: string;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Polygon',
    srid: 4326,
    nullable: true,
  })
  boundary: Geometry;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
