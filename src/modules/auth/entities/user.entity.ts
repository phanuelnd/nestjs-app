import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
    SUPER_ADMIN = 'super_admin',
    ADMIN = 'admin',
    VISITOR = 'visitor',

}

export enum UserStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    PENDING = 'pending'
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255, nullable: true })
    email: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    password: string;

    @Column({ type: 'varchar', length: 255, nullable: false })
    first_name: string;

    @Column({ type: 'varchar', length: 255, nullable: false })
    last_name: string;
    
    @Column({ type: 'enum', enum: UserRole, default: UserRole.VISITOR })
    role: UserRole;

    @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
    status: UserStatus;
    
    @Column({ nullable: true })
    last_login_at: Date;

    @Column({ default: false })
    is_first_login: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}