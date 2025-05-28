import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('permits')
export class Permit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  permit_number: string;

  @Column({ type: 'date', nullable: true })
  issued_date: Date;

  @Column({ nullable: true })
  building_use: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
