import { Injectable } from '@nestjs/common';
import { SuperAdminSeeder } from './super-admin.seeder';

@Injectable()
export class SeederService {
  constructor(private readonly superAdminSeeder: SuperAdminSeeder) {}

  async seedAll(): Promise<void> {
    await this.superAdminSeeder.seed();
  }
}