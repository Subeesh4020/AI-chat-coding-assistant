import { Queue, QueueEvents, Job } from 'bullmq';
import IORedis from 'ioredis';
import logger from '../logger';

// Gpt Chat service class
export class GptChatQueueService {

  private queue: Queue;
  private queueEvents: QueueEvents; // ONLY for listening to events
  private connection: IORedis;
  private queueEventsRegistry: Map<string, QueueEvents> = new Map();
  private queueName: string;

  constructor(gptChatQueueRedis: IORedis, queue: Queue, queueName: string) {
    this.queueName = queueName;
    this.queue = queue;
    this.connection = gptChatQueueRedis;
    this.queueEvents = new QueueEvents(queueName, {
      connection: this.connection
    });

    this.queueEventsRegistry.set(queueName, this.queueEvents); // Register queue events for later use, e.g., when shut down etc.

    this.setupEventListeners();
  }

  // Setup all event listeners
  private setupEventListeners(): void {

    // Job started processing
    this.queueEvents.on('active', async({ jobId }: { jobId: string }) => {
      logger.debug(`Job ${jobId} started processing: ${this.queueName}`);
    });

    // Job completed
    this.queueEvents.on('completed', async({ jobId }: { jobId: string }) => {
      logger.debug(`Job ${jobId} completed: ${this.queueName}`);
    });

    // Job failed
    this.queueEvents.on('failed', async({ jobId, failedReason }: { jobId: string, failedReason: string }) => {
      logger.error({failedReason}, `Job ${jobId} failed: ${this.queueName}`);
    });

    // Job progress
    // this.queueEvents.on('progress', ({ jobId, data }: { jobId: string, data: number }) => {
    //   logger.info(`Job ${jobId} progress: ${data}%`);
    //   this.updateProgress(jobId, data);
    // });

    // Stalled job
    // this.queueEvents.on('stalled', ({ jobId }: { jobId: string }) => {
    //   logger.warn(`Job ${jobId} stalled`);
    //   this.infoJobStatus(jobId, 'stalled');
    // });

    // Removed job
    this.queueEvents.on('removed', ({ jobId }: { jobId: string }) => {
      logger.debug(`Job ${jobId} removed: ${this.queueName}`);
    });

    // Error in queue
    this.queueEvents.on('error', (error: Error) => {
      logger.error({err: error}, `QueueEvents error: ${this.queueName}`);
    });
  }

  // Queue gpt chat prompt
  async queueGptChatPrompt(
    prompt: string,
    msgSession: string,
    userId: string, 
    priority = 1
  ) {
    return this.queue.add('gpt-chat-process', {
      prompt,
      msgSession,
      userId,
      type: 'gpt-chat-process',
      queuedAt: new Date().toISOString()
    }, {
      priority,
      delay: 100
    });
  }

  // Get queue metrics
  async getQueueMetrics() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount()
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed
    };
  }

  // Clean old jobs
  async cleanOldJobs(olderThanHours = 24) {
    const timestamp = Date.now() - (olderThanHours * 60 * 60 * 1000);
    
    // Clean completed jobs
    await this.queue.clean(timestamp, 1000, 'completed');
    
    // Clean failed jobs (keep for longer)
    const failedTimestamp = Date.now() - (olderThanHours * 3 * 60 * 60 * 1000);
    await this.queue.clean(failedTimestamp, 1000, 'failed');
  }


  async closeQueueEvents(): Promise<void> {
    
    if (!this.queueEventsRegistry || this.queueEventsRegistry.size === 0) {
      logger.info(`✅ No active QueueEvents: ${this.queueName}`);
      return;
    }

    logger.info(`Closing ${this.queueEventsRegistry.size} ${this.queueEventsRegistry.size > 1 ? 'QueueEvents...' : 'QueueEvent...'}`);

    await Promise.allSettled(
      Array.from(this.queueEventsRegistry.entries()).map(async ([name, queue]) => {
        try {
          // logger.info(`Closing QueueEvents: ${name}`);
          await queue.close();
          logger.info(`✅ Closed QueueEvents: ${name}`);
        } catch (err: any) {
            logger.error({ err }, `❌ Failed closing QueueEvents: ${name}`);
          throw err;
        }
      })
    );

    this.queueEventsRegistry.clear();
    logger.info('✅ All QueueEvents closed');
  }

}