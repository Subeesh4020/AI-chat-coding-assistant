
import IORedis from 'ioredis';
import { Queue } from 'bullmq';

export class APIRedisService {
  // public connection: IORedis;
  // public userActionsQueue: Queue;

  constructor(
    private readonly connection: IORedis,/*private readonly userActionsQueue: Queue*/) {
    // this.connection = redis;
    // this.userActionsQueue = queue;
  }

  async set(key: string, value: any, ttlSeconds?: number) {
    const data = JSON.stringify(value);

    if (ttlSeconds) {
      await this.connection.set(key, data, 'EX', ttlSeconds);
    } else {
        await this.connection.set(key, data);
    }
  }


  async get<T = any>(key: string): Promise<T | null> {
    const data = await this.connection.get(key);
    return data ? JSON.parse(data) : null;
  }


  async del(key: string) {
    await this.connection.del(key);
  }
}
