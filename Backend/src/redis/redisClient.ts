// src/redis/client.ts
import IORedis from 'ioredis';
import { Queue, Job } from 'bullmq';
import dotenv from 'dotenv';

import logger from '../logger';


const envFile: string = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';

dotenv.config({ path: envFile });

export class RedisClientInfra {
  public readonly redis: IORedis;
  // public readonly apiUserActionsQueue: Queue;
  private initialized: boolean;
  private redisName: string;

  constructor(redisName: string) {
    this.redis = new IORedis({
      host: process.env.REDIS_HOST1 || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      
      // Connection options
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      enableOfflineQueue: true,

      // Socket options (CRITICAL for preventing ECONNABORTED)
      retryStrategy: (times: number) => {
        logger.info(`Redis connection attempt(${redisName}) ${times}`);
        if (times > 10) {
          logger.info(`Too many redis connection attempts(${redisName})`);
          return null;
        }
        const delay = Math.min(times * 50, 2000);
        return delay;
      },

      // Timeout settings
      connectTimeout: 10000, // 10 seconds to connect
      commandTimeout: 30000, // 30 seconds for commands

      reconnectOnError: (err: any) => {
        // Reconnect on network errors but not on command errors
        const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
        return targetErrors.some(error => err.message.includes(error));
      },

    }); 
    
    this.initialized = false;
    this.redisName = redisName;

    /*
    // Create a new queue for API service
    this.apiUserActionsQueue = new Queue('api-user-actions-queue', {
      connection: this.apiRedis, // Pass connection object

      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential', // Options: 'fixed' | 'exponential
          delay: 3000          // Delay in ms
        },
        removeOnComplete: {
          count: 1000,         // Keep last 1000 completed jobs
          age: 24 * 3600       // OR keep for 24 hours (optional)
        },
        removeOnFail: {
          count: 6000,         // Keep last 5000 failed jobs
          age: 72 * 3600       // OR keep for 72 hours (optional)
        },
      }
    }); */
  }

  async init() {
    if (this.initialized) return;
    this.initialized = true;

    this.setupRedisEventListeners();
    // this.setupUserActionsQueueEventListeners();
  }

  // Handle connection events
  private setupRedisEventListeners(): void {
    this.redis.on('connect', () => {
      logger.info(`✅ Redis Connected (${this.redisName})`);
    });   

    this.redis.on('ready', () => {
      logger.info(`🟢 Redis ready (${this.redisName})`);
    });

    this.redis.on('error', (err: any) => {
      logger.error({ err }, `❌ Redis connection error (${this.redisName}): ${err.message}`);
    });

    this.redis.on('close', () => {
      logger.info(`⚠️  Redis connection closed (${this.redisName})`);
    });

    this.redis.on('reconnecting', (delay: number) => {
      logger.info(`🔄 Redis reconnecting in ${delay}ms (${this.redisName})`);
    });

    this.redis.on('end', () => {
      logger.info(`🔴 Redis connection ended (${this.redisName})`);
    });

  }

  /*private setupApiUserActionsQueueEventListeners(): void {
    // The callback receives a Job object directly, not an args object
    this.apiUserActionsQueue.on('waiting', (job: Job) => {
      logger.info(`📥 Job ${job.id} is waiting`);
      logger.info(`Job data: ${job.data}`);
    });

    this.apiUserActionsQueue.on('error', (err: Error) => {
      logger.error({ err }, `❌ Queue error: ${err.message}`);
    });

    this.apiUserActionsQueue.on('progress', (job: string, progress: any) => {
      logger.debug(`📊 Job ${job} progress: ${progress}`);
    });

    // Other available events:
    this.apiUserActionsQueue.on('paused', () => {
      logger.info('⏸️ Queue paused');
    });

    this.apiUserActionsQueue.on('resumed', () => {
      logger.info('▶️ Queue resumed');
    });

    this.apiUserActionsQueue.on('cleaned', (jobs: string[], type: string) => {
      logger.debug(`🧹 Cleaned ${jobs.length} ${type} jobs`);
    });

    this.apiUserActionsQueue.on('removed', (job: string) => {
      logger.debug(`🗑️ Job ${job} removed`);
    });

    // Redis-specific events
    this.apiUserActionsQueue.on('ioredis:close', () => {
      logger.info('🔌 Redis connection closed(API redis)');
    });
  } */
  
  // Test connection on startup
  public async testRedisConnection() {
    try {
      await this.redis.ping();
      logger.info(`✅ Redis connection test passed(${this.redisName})`);
    } catch (err: any) {
        logger.error({err}, `❌ Redis connection test failed(${this.redisName}): ${err.message}`);
    }
  }

  async redisGracefulShutdown(): Promise<void> {
    logger.info(`⏳ Closing Redis connection for ${this.redisName}...`);

    if(!this.redis) {
      logger.info(`✅ Redis connection for ${this.redisName} is not active`);
      return;   
    }

    try {
      await this.redis.quit(); // Graceful Redis shutdown
      logger.info(`✅ Redis connection closed for ${this.redisName}`);
    } catch (err: any) {
        logger.error({ err }, `❌ Failed to close redis connection for ${this.redisName}`);
        throw err; // propagate to main shutdown  
    }
  }

}


/*
If age exceeded → delete
OR
If count exceeded → delete
*/