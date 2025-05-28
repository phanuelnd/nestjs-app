import { BaseWorker } from '../../../libs/worker/worker.base';
import { BaseTask } from '../../../libs/worker/task.base';
import { FetchAndInsertBuildingsBasedOnPermitsTask } from './tasks/insert-daily-permits.tasks';

export class FetchAndInsertBuildingsBasedOnPermitsWorker extends BaseWorker {
  public queueName: string = 'insert-permits';

  public concurrency = 10;

  protected jobNameTaskMap: { [key: string]: typeof BaseTask } = {
    'insert:permits': FetchAndInsertBuildingsBasedOnPermitsTask,
  };
}
