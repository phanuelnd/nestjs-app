import { Injectable, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class CronStateService {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async getState(key: string): Promise<any> {
    return this.cacheManager.get(key);
  }

  async setState(key: string, value: any, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async delState(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }
}
