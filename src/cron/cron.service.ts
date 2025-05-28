import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IntellexGateway } from '../libs/gateways/intellex.gateway';
import { BuildingService } from '../modules/building/building.service';
import moment from 'moment';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private readonly intellexGateway: IntellexGateway,
    private readonly buildingService: BuildingService,
  ) {}

  // Runs daily at 12:00 AM (midnight)
  // @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
  //   timeZone: 'Africa/Cairo',
  // })
  @Cron('*/20 * * * * *') // Runs every second (for testing only)
  async handleDailyPermitsFetchingTask() {
    this.logger.debug('Running daily task...');
    // Call the provider to make the insertion
    const response = await this.intellexGateway.fetchNewPermits(
      moment().format('YYYY-MM-DD'),
      moment().subtract(1, 'days').format('YYYY-MM-DD'),
    );
    Logger.log(JSON.stringify(response));
    // Map api response and start inserting building into the database
  }
}
