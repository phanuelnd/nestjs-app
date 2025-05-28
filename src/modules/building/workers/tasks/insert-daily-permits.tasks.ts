import { Job } from 'bullmq';
import { BaseTask, TaskContext } from '../../../../libs/worker/task.base';
import { Logger } from '@nestjs/common';

export class FetchAndInsertBuildingsBasedOnPermitsTask extends BaseTask {
  async process(ctx: TaskContext, job: Job): Promise<void> {
    const taskRequest = job.data;
    // Call the provider to make the insertion
  }
  catch(error) {
    Logger.error(
      `An error occurred when trying to generate a client secret | clientId `,
    );
    // To avoid crashing the worker
    return;
  }
}
