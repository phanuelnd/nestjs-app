import { Job } from 'bullmq';

import {
  INestApplication,
  Logger,
  NotImplementedException,
} from '@nestjs/common';

export interface TaskContext {
  app: INestApplication;
}

export class BaseTask {
  /**
   * Logic to run for the task
   * @param ctx Utilities to run the task
   * @param job Bullmq Job instance
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async process(ctx: TaskContext, job: Job): Promise<unknown> {
    throw new NotImplementedException();
  }
}
