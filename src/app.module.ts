import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsModule } from './projects/projects.module';
import { Project } from './projects/entities/project.entity'; // Import the entity

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'lena',  //  your database username
      password: 'Passcode', //  your password
      database: 'project_crud_db',
      entities: [Project],
      synchronize: true, // only for development!
      logging: true, // optional: shows SQL queries in console
    }),
    ProjectsModule,
  ],
})
export class AppModule {}
