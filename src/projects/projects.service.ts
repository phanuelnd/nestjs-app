import { Injectable, NotFoundException } from '@nestjs/common';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  private projects: Project[] = [];
  private nextId = 1;

  create(createProjectDto: CreateProjectDto): Project {
    const project: Project = {
      id: this.nextId++,
      title: createProjectDto.title,
      description: createProjectDto.description,
      createdAt: new Date(),
    };
    this.projects.push(project);
    return project;
  }

  findAll(): Project[] {
    return this.projects;
  }

  findOne(id: number): Project {
    const project = this.projects.find(p => p.id === id);
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found.`);
    }
    return project;
  }

  update(id: number, updateProjectDto: UpdateProjectDto): Project {
    const project = this.findOne(id);
    if (updateProjectDto.title) {
      project.title = updateProjectDto.title;
    }
    if (updateProjectDto.description) {
      project.description = updateProjectDto.description;
    }
    return project;
  }

  remove(id: number): void {
    const index = this.projects.findIndex(p => p.id === id);
    if (index === -1) {
      throw new NotFoundException(`Project with ID ${id} not found.`);
    }
    this.projects.splice(index, 1);
  }
}
