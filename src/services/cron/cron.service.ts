import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { IntellexGateway } from '../../libs/gateways/intellex.gateway';
import { BuildingService } from '../../modules/building/building.service';
import { CronStateService } from './cron-state.service';
import moment from 'moment';

@Injectable()
export class CronService implements OnModuleInit {
  private readonly logger = new Logger(CronService.name);
  private isOldPermitsCompleted = false;

  constructor(
    private readonly intellexGateway: IntellexGateway,
    private readonly buildingService: BuildingService,
    private readonly cronStateService: CronStateService,
  ) {}

  async onModuleInit() {
    // Check if old permits processing is already complete
    const state = await this.cronStateService.getState('oldPermitsStatus');
    this.isOldPermitsCompleted = state === 'COMPLETED';
  }

  
  async handleMonthlyNewBuildingsTask() {
    this.logger.debug('Starting monthly buildings processing...');
  
  }
}
