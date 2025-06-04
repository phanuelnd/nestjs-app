import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { IntellexGateway } from '../libs/gateways/intellex.gateway';
import { BuildingService } from '../modules/building/building.service';
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

  // Runs daily at midnight (Cairo time)
  @Cron('0 0 * * *', { timeZone: 'Africa/Cairo' })
  async handleDailyNewPermitsFetchingTask() {
    this.logger.debug('Starting daily permits processing...');

    const stateKey = 'dailyPermits';
    let lastProcessedDate = await this.cronStateService.getState(stateKey);
    const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');

    // Initial processing (May 1-31, 2025) - only on first run
    if (!lastProcessedDate) {
      lastProcessedDate = moment('2025-05-01')
        .add(30, 'days') // 30 days straight, supposing that we will deploy on May 31st
        .format('YYYY-MM-DD');
      await this.processDateRange('2025-05-01', lastProcessedDate, 'new');
      await this.cronStateService.setState(stateKey, lastProcessedDate);
      
      // If we're caught up to yesterday after initial processing, process yesterday too
      if (moment(lastProcessedDate).isBefore(yesterday)) {
        const nextDay = moment(lastProcessedDate).add(1, 'days').format('YYYY-MM-DD');
        await this.processDateRange(nextDay, yesterday, 'new');
        await this.cronStateService.setState(stateKey, yesterday);
      }
      return;
    }

    // Always process yesterday's permits (last 24 hours)
    const nextDate = moment(lastProcessedDate).add(1, 'days');
    
    if (nextDate.isSameOrBefore(yesterday)) {
      // Process all missing days up to yesterday
      const start = nextDate.format('YYYY-MM-DD');
      await this.processDateRange(start, yesterday, 'new');
      await this.cronStateService.setState(stateKey, yesterday);
      
      this.logger.log(`Processed permits from ${start} to ${yesterday}`);
    } else {
      this.logger.debug('No new permits to process - already up to date');
    }
  }

  // Runs every minute until old permits are completed
  @Cron('* * * * *') // Every minute
  async handleOldPermitsFetchingTask() {
    if (this.isOldPermitsCompleted) {
      this.logger.debug('Skipping old permits - already completed');
      return;
    }

    this.logger.debug('Processing old permits batch...');
    const stateKey = 'oldPermits';
    let state = (await this.cronStateService.getState(stateKey)) || {
      currentStart: '2012-01-01',
      batchSize: 30, // 30 (1 month) days per batch
    };

    const batchEnd = moment(state.currentStart).add(state.batchSize, 'days');
    const cutoffDate = moment('2025-05-01');

    // Stop if we've reached the cutoff
    if (moment(state.currentStart).isSameOrAfter(cutoffDate)) {
      this.isOldPermitsCompleted = true;
      await this.cronStateService.setState('oldPermitsStatus', 'COMPLETED');
      this.logger.log('Old permits processing completed');
      return;
    }

    // Adjust batch end if it exceeds cutoff
    const endDate = batchEnd.isAfter(cutoffDate)
      ? '2025-05-01'
      : batchEnd.format('YYYY-MM-DD');

    await this.processDateRange(state.currentStart, endDate, 'old');

    // Prepare next batch
    const nextStart = moment(endDate).add(1, 'days').format('YYYY-MM-DD');
    const newState = {
      currentStart: nextStart,
      batchSize: state.batchSize,
    };

    await this.cronStateService.setState(stateKey, newState);

    // Check if completed
    if (nextStart >= '2025-05-01') {
      this.isOldPermitsCompleted = true;
      await this.cronStateService.setState('oldPermitsStatus', 'COMPLETED');
      this.logger.log('Old permits processing completed');
    }
  }

  private async processDateRange(
    start: string,
    end: string,
    type: 'new' | 'old',
  ) {
    this.logger.log(`Processing ${type} permits from ${start} to ${end}`);

    const response =
      type === 'new'
        ? await this.intellexGateway.fetchNewPermits(start, end)
        : await this.intellexGateway.fetchOldPermits(start, end);

    for (const permit of response) {
      try {
        if (type === 'new') {
            const parcelId = permit['application_upi'];
            // Fetch count of existing buildings for this parcel_id
            const existingCount = await this.buildingService.countByParcelId(parcelId);
            const suffix = (existingCount + 1).toString().padStart(3, '0');
            const buildingId = `${parcelId}/${suffix}`;

          await this.buildingService.create({
            building_id: buildingId,
            parcel_id: parcelId,
            status: 'PLANNED',
            permit_id: permit['application_id'],
          });
        } else {
            const parcelId = permit['Plot_No'];
            // Fetch count of existing buildings for this parcel_id
            const existingCount = await this.buildingService.countByParcelId(parcelId);
            const suffix = (existingCount + 1).toString().padStart(3, '0');
            const buildingId = `${parcelId}/${suffix}`;
          await this.buildingService.create({
            building_id: buildingId,
            parcel_id: parcelId,
            status: 'PLANNED',
            permit_id: permit['id'],
          });
        }
      } catch (error) {
        const permitId = type === 'new' ? permit['application_id'] : permit['id'];
        this.logger.error(
          `Error processing permit ${permitId}: ${error.message}`,
        );
      }
    }

    this.logger.log(`Processed ${response.length} ${type} permits`);
  }
}





/* For testing purposes only, uncomment the code below to run the cron service.
 * This code is not meant for production use and should be removed or commented out
/*
// import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
// import { Cron } from '@nestjs/schedule';
// import { IntellexGateway } from '../libs/gateways/intellex.gateway';
// import { BuildingService } from '../modules/building/building.service';
// import { CronStateService } from './cron-state.service';
// import moment from 'moment';

// @Injectable()
// export class CronService implements OnModuleInit {
//   private readonly logger = new Logger(CronService.name);
//   private isOldPermitsCompleted = false;

//   constructor(
//     private readonly intellexGateway: IntellexGateway,
//     private readonly buildingService: BuildingService,
//     private readonly cronStateService: CronStateService,
//   ) {}

//   async onModuleInit() {
//     // Check if old permits processing is already complete
//     const state = await this.cronStateService.getState('oldPermitsStatus');
//     this.isOldPermitsCompleted = state === 'COMPLETED';
//   }

//   // TESTING: Runs every 5 minutes for local testing
//   @Cron('* 5 * * * *') // Every 5 minutes
//   // PRODUCTION: Uncomment this line for production deployment
//   // @Cron('0 0 * * *', { timeZone: 'Africa/Cairo' }) // Daily at midnight Cairo time
//   async handleDailyNewPermitsFetchingTask() {
//     this.logger.debug('Starting daily permits processing...');

//     const stateKey = 'dailyPermits';
//     let lastProcessedDate = await this.cronStateService.getState(stateKey);
//     const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');

//     // TESTING: Small date range for local testing (3 days)
//     if (!lastProcessedDate) {
//       lastProcessedDate = moment('2025-05-29') // Start from May 29, 2025
//         .add(2, 'days') // Process only 3 days (May 29-31)
//         .format('YYYY-MM-DD');
//       await this.processDateRange('2025-05-29', lastProcessedDate, 'new');
//       await this.cronStateService.setState(stateKey, lastProcessedDate);

//     // PRODUCTION: Uncomment this block for production deployment
//     // if (!lastProcessedDate) {
//     //   lastProcessedDate = moment('2025-05-01')
//     //     .add(30, 'days') // 30 days straight, supposing that we will deploy on May 31st
//     //     .format('YYYY-MM-DD');
//     //   await this.processDateRange('2025-05-01', lastProcessedDate, 'new');
//     //   await this.cronStateService.setState(stateKey, lastProcessedDate);
      
//       // If we're caught up to yesterday after initial processing, process yesterday too
//       if (moment(lastProcessedDate).isBefore(yesterday)) {
//         const nextDay = moment(lastProcessedDate).add(1, 'days').format('YYYY-MM-DD');
//         await this.processDateRange(nextDay, yesterday, 'new');
//         await this.cronStateService.setState(stateKey, yesterday);
//       }
//       return;
//     }

//     // Always process yesterday's permits (last 24 hours)
//     const nextDate = moment(lastProcessedDate).add(1, 'days');
    
//     if (nextDate.isSameOrBefore(yesterday)) {
//       // Process all missing days up to yesterday
//       const start = nextDate.format('YYYY-MM-DD');
//       await this.processDateRange(start, yesterday, 'new');
//       await this.cronStateService.setState(stateKey, yesterday);
      
//       this.logger.log(`Processed permits from ${start} to ${yesterday}`);
//     } else {
//       this.logger.debug('No new permits to process - already up to date');
//     }
//   }

//   // TESTING: Runs every 2 minutes for local testing
//   @Cron('*1 * * * *') // Every 1 minutes
//   // PRODUCTION: Uncomment this line for production deployment
//   // @Cron('0 * * * *') // Every hour
//   async handleOldPermitsFetchingTask() {
//     if (this.isOldPermitsCompleted) {
//       this.logger.debug('Skipping old permits - already completed');
//       return;
//     }

//     this.logger.debug('Processing old permits batch...');
//     const stateKey = 'oldPermits';
    
//     // TESTING: Small date range and batch size for local testing
//     let state = (await this.cronStateService.getState(stateKey)) || {
//       currentStart: '2024-12-01', // Start from December 1, 2024
//       batchSize: 3, // Process only 3 days per batch
//     };

//     // PRODUCTION: Uncomment this block for production deployment
//     // let state = (await this.cronStateService.getState(stateKey)) || {
//     //   currentStart: '2012-01-01',
//     //   batchSize: 30, // 30 (1 month) days per batch
//     // };

//     const batchEnd = moment(state.currentStart).add(state.batchSize, 'days');
    
//     // TESTING: Small cutoff date for local testing
//     const cutoffDate = moment('2025-01-01'); // Stop at January 1, 2025
    
//     // PRODUCTION: Uncomment this line for production deployment
//     // const cutoffDate = moment('2025-05-01');

//     // Stop if we've reached the cutoff
//     if (moment(state.currentStart).isSameOrAfter(cutoffDate)) {
//       this.isOldPermitsCompleted = true;
//       await this.cronStateService.setState('oldPermitsStatus', 'COMPLETED');
//       this.logger.log('Old permits processing completed');
//       return;
//     }

//     // Adjust batch end if it exceeds cutoff
//     const endDate = batchEnd.isAfter(cutoffDate)
//       ? cutoffDate.format('YYYY-MM-DD')
//       : batchEnd.format('YYYY-MM-DD');

//     await this.processDateRange(state.currentStart, endDate, 'old');

//     // Prepare next batch
//     const nextStart = moment(endDate).add(1, 'days').format('YYYY-MM-DD');
//     const newState = {
//       currentStart: nextStart,
//       batchSize: state.batchSize,
//     };

//     await this.cronStateService.setState(stateKey, newState);

//     // TESTING: Check if completed with test cutoff date
//     if (nextStart >= cutoffDate.format('YYYY-MM-DD')) {
//       this.isOldPermitsCompleted = true;
//       await this.cronStateService.setState('oldPermitsStatus', 'COMPLETED');
//       this.logger.log('Old permits processing completed');
//     }

//     // PRODUCTION: Uncomment this block for production deployment
//     // if (nextStart >= '2025-05-01') {
//     //   this.isOldPermitsCompleted = true;
//     //   await this.cronStateService.setState('oldPermitsStatus', 'COMPLETED');
//     //   this.logger.log('Old permits processing completed');
//     // }
//   }

//   private async processDateRange(
//     start: string,
//     end: string,
//     type: 'new' | 'old',
//   ) {
//     this.logger.log(`Processing ${type} permits from ${start} to ${end}`);

//     const response =
//       type === 'new'
//         ? await this.intellexGateway.fetchNewPermits(start, end)
//         : await this.intellexGateway.fetchOldPermits(start, end);
    
//         // Log the response for debugging
//     this.logger.debug(`Fetched ${response.length} ${type} permits`, {
//       start,
//       end,
//       type,
//       permits: response,
//     });

//     for (const permit of response) {
//       try {
//         if (type === 'new') {
//             const parcelId = permit['application_upi'];
//             // Fetch count of existing buildings for this parcel_id
//             const existingCount = await this.buildingService.countByParcelId(parcelId);
//             const suffix = (existingCount + 1).toString().padStart(3, '0');
//             const buildingId = `${parcelId}/${suffix}`;

          
//           await this.buildingService.create({
//             building_id: buildingId,
//             parcel_id: parcelId,
//             status: 'PLANNED',
//             permit_id: permit['application_id'],
//           });
//         } else {
//             const parcelId = permit['Plot_No'];
//             // Fetch count of existing buildings for this parcel_id
//             const existingCount = await this.buildingService.countByParcelId(parcelId);
//             const suffix = (existingCount + 1).toString().padStart(3, '0');
//             const buildingId = `${parcelId}/${suffix}`;
          
//           await this.buildingService.create({
//             building_id: buildingId,
//             parcel_id: parcelId,
//             status: 'PLANNED',
//             permit_id: permit['id'],
//           });
//         }
//       } catch (error) {
//         this.logger.error(
//           `Error processing permit ${permit.id}: ${error.message}`,
//         );
//       }
//     }

//     this.logger.log(`Processed ${response.length} ${type} permits`);
//   }
// } */
