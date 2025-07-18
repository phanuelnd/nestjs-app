import { Injectable } from '@nestjs/common';
import { SuperAdminSeeder } from './super-admin.seeder';

@Injectable()
export class SeederService {
  constructor(private readonly superAdminSeeder: SuperAdminSeeder) {}

  async seedAll(): Promise<void> {
    await this.superAdminSeeder.seed();
  }
}

// docker exec -e SUPER_ADMIN_EMAIL="superadmin@mininfra.com" -e SUPER_ADMIN_PASSWORD="23455!" -it buildings-backend pnpm run seed