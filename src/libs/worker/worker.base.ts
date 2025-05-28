import { Job, JobsOptions } from 'bullmq';

import { BaseTask, TaskContext } from './task.base';
import { Logger } from '@nestjs/common';

export interface WorkerJobConfig {
  name: string; // Job name
  data: unknown;
  options?: JobsOptions;
}

type JobTaskMap = {
  [key: string]: typeof BaseTask;
};

export class BaseWorker {
  /**
   * Name of queue that worker is listening
   * @property
   */
  public queueName: string;
  /**
   * Number of tasks that the worker can process concurrently
   * @property
   */
  public concurrency: number;
  /**
   * Key value mapping the jobName to a TaskClass
   * @property
   */
  protected jobNameTaskMap: JobTaskMap;

  constructor(readonly nodeName: string) {}

  /**
   * Contains the logic for the worker execution
   * @param ctx Utilities to run the tasks
   * @param job Job that need to be executed
   */
  async execute(ctx: TaskContext, job: Job): Promise<void> {
    const TaskCls: typeof BaseTask = this.jobNameTaskMap[job.name];
    if (TaskCls) {
      const logContext = { ...(job.data ?? {}), jobName: job.name };
      Logger.debug(`Start running ${TaskCls.name}`, logContext);
      const task = new TaskCls();
      await task.process(ctx, job);
      Logger.debug(`${job.name} has been processed successfully`, logContext);
    } else {
      Logger.warn(`Unknown job=${job.name}`, { jobData: job.data });
      await job.remove();
    }
  }
}
