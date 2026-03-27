import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { logger } from '../utils/logger';

// Redis connection configuration - only connect if env vars are set
let redisConnection: any = null;

if (process.env.REDIS_HOST && process.env.REDIS_PORT) {
  redisConnection = new Redis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    }
  });

  redisConnection.on('error', (err: Error) => {
    logger.error('Redis Client Error:', err);
  });

  redisConnection.on('connect', () => {
    logger.info('Redis connected successfully');
  });
} else {
  logger.warn('Redis not configured: REDIS_HOST and REDIS_PORT missing. Queues will not work.');
}

// Queue names
export const QUEUE_NAMES = {
  EMAIL: 'email-queue',
  CAMPAIGN: 'campaign-queue',
  WEBHOOK: 'webhook-queue',
  ANALYTICS: 'analytics-queue'
};

// Create queues only if Redis is available
const shouldUseQueues = !!redisConnection;

export const emailQueue = shouldUseQueues
  ? new Queue(QUEUE_NAMES.EMAIL, {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 60000 // 1 minute
        },
        removeOnComplete: {
          count: 1000,
          age: 24 * 60 * 60 * 1000 // 24 hours
        },
        removeOnFail: {
          count: 1000,
          age: 24 * 60 * 60 * 1000
        }
      }
    })
  : {
      add: async (name: string, data: any, opts?: any) => {
        logger.warn(`Queue not available - job ${name} not queued`);
        return { id: 'no-queue' };
      },
      removeByPrefix: async (prefix: string) => {
        logger.warn(`Queue not available - cannot remove jobs with prefix ${prefix}`);
      },
      close: async () => {}
    } as any;

export const campaignQueue = shouldUseQueues
  ? new Queue(QUEUE_NAMES.CAMPAIGN, {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 60000
        }
      }
    })
  : {
      add: async (name: string, data: any, opts?: any) => {
        logger.warn(`Queue not available - job ${name} not queued`);
        return { id: 'no-queue' };
      },
      removeByPrefix: async (prefix: string) => {
        logger.warn(`Queue not available - cannot remove jobs with prefix ${prefix}`);
      },
      close: async () => {}
    } as any;

export const webhookQueue = shouldUseQueues
  ? new Queue(QUEUE_NAMES.WEBHOOK, {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 30000
        }
      }
    })
  : {
      add: async (name: string, data: any, opts?: any) => {
        logger.warn(`Queue not available - job ${name} not queued`);
        return { id: 'no-queue' };
      },
      removeByPrefix: async (prefix: string) => {
        logger.warn(`Queue not available - cannot remove jobs with prefix ${prefix}`);
      },
      close: async () => {}
    } as any;

// Worker for email sending (only if Redis available)
export const emailWorker = shouldUseQueues
  ? new Worker(
      QUEUE_NAMES.EMAIL,
      async (job: Job) => {
        const { name, data } = job;

        switch (name) {
          case 'SEND_EMAIL':
            await sendEmailJob(data);
            break;
          case 'SEND_CAMPAIGN_EMAIL':
            await sendCampaignEmailJob(data);
            break;
          case 'PROCESS_REPLY':
            await processReplyJob(data);
            break;
          default:
            logger.warn(`Unknown job type: ${name}`);
        }
      },
      { connection: redisConnection }
    )
  : null as any;

if (emailWorker) {
  emailWorker.on('completed', (job: Job) => {
    logger.info(`Job ${job.id} completed`);
  });

  emailWorker.on('failed', (job: Job | undefined, err: Error) => {
    logger.error(`Job ${job?.id} failed:`, err);
  });

  emailWorker.on('error', (err: Error) => {
    logger.error('Email worker error:', err);
  });
}

// Worker for campaign management (only if Redis available)
export const campaignWorker = shouldUseQueues
  ? new Worker(
      QUEUE_NAMES.CAMPAIGN,
      async (job: Job) => {
        const { name, data } = job;

        switch (name) {
          case 'START_CAMPAIGN':
            await startCampaignJob(data);
            break;
          case 'PAUSE_CAMPAIGN':
            await pauseCampaignJob(data);
            break;
          case 'RESUME_CAMPAIGN':
            await resumeCampaignJob(data);
            break;
          case 'SCHEDULE_EMAIL':
            await scheduleEmailJob(data);
            break;
          default:
            logger.warn(`Unknown campaign job type: ${name}`);
        }
      },
      { connection: redisConnection }
    )
  : null as any;

if (campaignWorker) {
  campaignWorker.on('completed', (job: Job) => {
    logger.info(`Campaign job ${job.id} completed`);
  });

  campaignWorker.on('failed', (job: Job | undefined, err: Error) => {
    logger.error(`Campaign job ${job?.id} failed:`, err);
  });
}

// Job handlers (implement in separate files)
async function sendEmailJob(data: any) {
  // Will be implemented in email-service.ts
  logger.info('sendEmailJob:', data);
}

async function sendCampaignEmailJob(data: any) {
  // Will be implemented in campaign-service.ts
  logger.info('sendCampaignEmailJob:', data);
}

async function processReplyJob(data: any) {
  // Will be implemented in reply-service.ts
  logger.info('processReplyJob:', data);
}

async function startCampaignJob(data: any) {
  logger.info('startCampaignJob:', data);
}

async function pauseCampaignJob(data: any) {
  logger.info('pauseCampaignJob:', data);
}

async function resumeCampaignJob(data: any) {
  logger.info('resumeCampaignJob:', data);
}

async function scheduleEmailJob(data: any) {
  logger.info('scheduleEmailJob:', data);
}

// Cleanup on shutdown
process.on('SIGTERM', async () => {
  if (emailWorker) await emailWorker.close();
  if (campaignWorker) await campaignWorker.close();
  if (emailQueue?.close) await emailQueue.close();
  if (campaignQueue?.close) await campaignQueue.close();
  if (redisConnection) await redisConnection.quit();
});

process.on('SIGINT', async () => {
  if (emailWorker) await emailWorker.close();
  if (campaignWorker) await campaignWorker.close();
  if (emailQueue?.close) await emailQueue.close();
  if (campaignQueue?.close) await campaignQueue.close();
  if (redisConnection) await redisConnection.quit();
});

export default { emailQueue, campaignQueue };
