import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SeederService } from './seeders/seeder.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seederService = app.get(SeederService);
  
  try {
    await seederService.seedAll();
    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await app.close();
  }
}

bootstrap();