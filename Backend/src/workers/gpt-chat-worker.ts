// worker/emailWorker.ts
import { Worker, Job, WorkerOptions } from 'bullmq';
import IORedis from 'ioredis';

import { processGptChat } from './gpt-chat-process';
import logger from '../logger';

export class GptChatWorker {
  private gptChatWorker: Worker;
  private connection: IORedis;
  private workerOptions: WorkerOptions;
  private workerName: string;
  private initialized = false;

  constructor(gptChatQueueRedis: IORedis, workerName:  string) {
    this.connection = gptChatQueueRedis;
    this.workerName = workerName;
    this.workerOptions = {
      connection: this.connection,
      concurrency: 10, // Process 10 emails concurrently
      limiter: {
        max: 100, // Max 100 emails per second per worker
        duration: 1000
      }
    };

    // Create worker for gpt chat queue
    this.gptChatWorker = new Worker(this.workerName, async (job) => {
      logger.info(`Pocessing gpt chat job: ${job.name} - ${job.id}`);

      const { prompt, userId, type, timestamp } = job.data;
      try {

        switch (type) {
          case 'gpt-chat-process': {
            await processGptChat(prompt, userId);
            break;
          }

          default:
            logger.warn(`Unknown worker type: ${type}`);
            throw new Error(`Unknown worker type: ${type}`);
        }
      } catch (err: any) {
        logger.error(`Worker error: ${type}: ${err}`);
      }
    }, this.workerOptions);
  }

  async init() {
    if (this.initialized) return;
    this.initialized = true;

    this.setupWorkerEvents(this.gptChatWorker);
  }

  private setupWorkerEvents (worker: Worker): void {
    worker.on('ready', () => {
      logger.info('👷 Worker ready and waiting for jobs');
    });

    worker.on('active', (job: Job) => {
      logger.info(`▶️ Worker started job ${job.id} (${job.name})`);
    });

    worker.on('completed', async(job: Job, result: any) => {
      logger.debug(`✅ Worker completed job ${job.id} (${job.name})`);
    });

    worker.on('failed', async(job: Job | undefined, err: Error) => {
      logger.debug(`✅ Worker completed job ${job?.id} (${job?.name})`);
    });

    worker.on('error', (error: Error) => {
      logger.error({ err: error }, `🚨 Worker error: ${error.message}`);
    });

    worker.on('stalled', (jobId: string) => {
      logger.warn(`⚠️ Worker detected stalled job ${jobId}`);
    });

    worker.on('closing', () => {
      logger.info('🔒 Worker closing...');
    });

    worker.on('closed', () => {
      logger.info('🔐 Worker closed');
    });

    worker.on('drained', () => {
      logger.debug('💧 Worker drained all jobs');
    });
  };

  public async closeGptChatWorker() {
    logger.info('✅ Closing gpt chat queue worker...');  //First log what is doing

    if (!this.gptChatWorker) {   // Ensure the object exists
      logger.info('✅ Worker for gpt chat queue not running...');
      return;
    }

    try {      
      await this.gptChatWorker.close();   // If exists then do action
      logger.info('✅ Worker closed for gpt chat queue');
    } catch (err: any) {
        logger.error({ err }, '❌ Failed to close worker for gpt chat queue'); 
        throw err;   
    }
  };
 
}