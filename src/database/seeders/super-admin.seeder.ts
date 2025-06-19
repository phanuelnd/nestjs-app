import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus } from '../../modules/auth/entities/user.entity';

@Injectable()
export class SuperAdminSeeder {
  private readonly logger = new Logger(SuperAdminSeeder.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async seed(): Promise<void> {
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@example.com';
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!';

    // Check if super admin already exists
    const existingSuperAdmin = await this.userRepository.findOne({
      where: { email: superAdminEmail }
    });

    if (existingSuperAdmin) {
      this.logger.log('Super admin already exists');
      return;
    }

    // Create super admin
    const hashedPassword = await bcrypt.hash(superAdminPassword, 10);
    
    const superAdmin = this.userRepository.create({
      email: superAdminEmail,
      password: hashedPassword,
      first_name: 'Super',
      last_name: 'Admin',
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      is_first_login: false,
    });

    await this.userRepository.save(superAdmin);
    this.logger.log(`Super admin created with email: ${superAdminEmail}`);
    this.logger.log(`Super admin password: ${superAdminPassword}`);
    this.logger.warn('Please change the super admin password after first login!');
  }
}