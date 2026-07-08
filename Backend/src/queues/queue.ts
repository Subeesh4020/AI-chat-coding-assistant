import IORedis from 'ioredis';
import { Queue, Job } from 'bullmq';
import dotenv from 'dotenv';

import logger from '../logger';
// import { workerRedis } from './workerRedis';

const envFile: string = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';

dotenv.config({ path: envFile });

export class QueueInfra {
  public readonly queueRedis: IORedis;
  public readonly queue: Queue;
  private initialized = false;
  private queueName: string;

  constructor(queueRedis: IORedis, queueName: string) { 
    this.queueRedis = queueRedis;
    this.queueName = queueName;

    // Create the queue for email related tasks
    this.queue = new Queue(queueName, {
      connection: this.queueRedis,  // Pass connection object
      
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',  // Options: 'fixed' | 'exponential'
          delay: 3000           // Delay in ms
        },
        removeOnComplete: {
          count: 1000,          // Keep last 1000 completed jobs
          age: 24 * 3600        // OR keep for 24 hours (optional)
        },
        removeOnFail: {
          count: 6000,          // Keep last 5000 failed jobs
          age: 72 * 3600        // OR keep for 72 hours (optional)
        },
      
        // Timeouts are handled at worker level
      }
    });

  }

  async init() {
    if (this.initialized) return;
    this.initialized = true;

    // this.setupRedisEventListeners();
    this.setupQueueEventListeners();
  }

  /*private setupRedisEventListeners(): void {
    // Add event handlers
    this.emailQueueRedis.on('connect', () => {
      logger.info('✅ Redis connected (Email queue redis)');
    });

    this.emailQueueRedis.on('ready', () => {
      logger.info('✅ Redis ready (Email queue redis)');
    });

    this.emailQueueRedis.on('error', (err) => {
      logger.error({ err }, `❌ Redis connection error (Email queue redis): ${err.message}`);
      // Don't crash the app on Redis errors
    });

    this.emailQueueRedis.on('close', () => {
      logger.info('⚠️  Redis connection closed (Email queue redis)');
    });

    this.emailQueueRedis.on('reconnecting', (delay: number) => {
      logger.info(`🔄 Redis reconnecting in ${delay}ms (email queue redis)`);
    });

    this.emailQueueRedis.on('end', () => {
      logger.info('🔴 Redis connection ended (email queue redis)');
    });
  } */

  private setupQueueEventListeners(): void {
    // The callback receives a Job object directly, not an args object
    this.queue.on('waiting', (job: Job) => {
      logger.info(`📥 Job ${job.id} is waiting: ${this.queueName}`);
      logger.info(`Job data: ${job.data}: ${this.queueName}`);
    });

    this.queue.on('error', (err: Error) => {
      logger.error({ err }, `❌ Queue error: ${err.message}: ${this.queueName}`);
    });

    this.queue.on('progress', (job: string, progress: any) => {
      logger.debug(`📊 Job ${job} progress: ${progress} : ${this.queueName}`);
    });

    // Other available events:
    this.queue.on('paused', () => {
      logger.info(`⏸️ Queue paused: ${this.queueName}`);
    });

    this.queue.on('resumed', () => {
      logger.info(`▶️ Queue resumed: ${this.queueName}`);
    });

    this.queue.on('cleaned', (jobs: string[], type: string) => {
      logger.debug(`🧹 Cleaned ${jobs.length} ${type} jobs: ${this.queueName}`);
    });

    this.queue.on('removed', (job: string) => {
      logger.debug(`🗑️ Job ${job} removed: ${this.queueName}`);
    });

    // Redis-specific events
    this.queue.on('ioredis:close', () => {
      logger.info(`🔌 Redis connection closed: ${this.queueName}`);
    });
  }
  
  // Test connection on startup
  public async testQueueRedisConnection() {
    try {
      await this.queueRedis.ping();
      logger.info(`✅ Redis connection test passed: ${this.queueName}`);
    } catch (err: any) {
        logger.error({err}, `❌ Redis connection test failed: ${err.message}: ${this.queueName}`);
    }
  }

  public async closeQueue() {
    logger.info(`⏳ Closing ${this.queueName}...`);
    if (!this.queue) {
      logger.info(`✅ ${this.queueName} is not active.`);
      return;
    }

    try {
      await this.queue.close();
      logger.info(`✅ ${this.queueName} closed`);
    } catch (err: any) {
        logger.error({ err }, `❌ Failed to close ${this.queueName}`);
        throw err; // propagate to main shutdown  
    }
  }
  
  public async closeQueueRedis() {
    logger.info(`⏳ Closing Redis connection: ${this.queueName}...`);

    if(!this.queueRedis) {
      logger.info(`✅ Redis connection: ${this.queueName} is not active`);
      return;   
    }

    try {
      await this.queueRedis.quit(); // Graceful Redis shutdown
      logger.info(`✅ Redis connection closed: ${this.queueName} `);
    } catch (err: any) {
        logger.error({ err }, `❌ Failed to close Redis connection: ${this.queueName}`);
        throw err; // propagate to main shutdown  
    }
  }

};


/*
Never do:

try {
   everything
}

Always do:

START log
if exists
   try risky close
SUCCESS log
FAIL log

This is architecturally correct


*/