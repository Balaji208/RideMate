const Queue = require('bull');
const { logger } = require('../config/logger');
const { QUEUE_CONFIG } = require('../config/poolingConfig');
const { processPoolingBatch } = require('./requestProcessor');
const { CONFIG } = require('../config/poolingConfig');

const poolingQueue = new Queue('pool-rides', QUEUE_CONFIG);

async function printJobs() {
  try {
    console.log('=== Waiting Jobs ===');
    const waiting = await poolingQueue.getWaiting();
    waiting.forEach(job => console.log(`Job ID: ${job.id}`, job.data));

    console.log('=== Active Jobs ===');
    const active = await poolingQueue.getActive();
    active.forEach(job => console.log(`Job ID: ${job.id}`, job.data));

    console.log('=== Completed Jobs ===');
    const completed = await poolingQueue.getCompleted();
    completed.forEach(job => console.log(`Job ID: ${job.id}`, job.data));

    console.log('=== Failed Jobs ===');
    const failed = await poolingQueue.getFailed();
    failed.forEach(job => console.log(`Job ID: ${job.id}`, job.data));

    console.log('=== Delayed Jobs ===');
    const delayed = await poolingQueue.getDelayed();
    delayed.forEach(job => console.log(`Job ID: ${job.id}`, job.data));
  } catch (err) {
    console.error('Error printing jobs:', err);
    logger.error('Error printing jobs', { error: err.message, stack: err.stack });
  }
}

function setupQueue() {
  poolingQueue.on('error', err => {
    console.log(`Bull queue error: ${err.message}`);
    logger.error('Bull queue error', { error: err.message, stack: err.stack });
  });

  poolingQueue.on('stalled', jobId => {
    console.log(`Bull job stalled: Job ID ${jobId}`);
    logger.warn('Bull job stalled', { jobId });
  });

  poolingQueue.on('waiting', jobId => {
    console.log(`Bull job waiting: Job ID ${jobId}`);
    logger.info('Bull job waiting', { jobId });
  });

  poolingQueue.on('active', job => {
    console.log(`Bull job active: Job ID ${job.id}, Request ID ${job.data.requestId}`);
    logger.info('Bull job active', { jobId: job.id, requestId: job.data.requestId });
  });

  poolingQueue.on('completed', job => {
    console.log(`Bull job completed: Job ID ${job.id}, Request ID ${job.data.requestId}`);
    logger.info('Bull job completed', { jobId: job.id, requestId: job.data.requestId });
  });

  poolingQueue.on('failed', (job, err) => {
    console.log(`Bull job failed: Job ID ${job.id}, Request ID ${job.data.requestId}, Error: ${err.message}`);
    logger.error('Bull job failed', { jobId: job.id, requestId: job.data.requestId, error: err.message, stack: err.stack });
  });

  poolingQueue.process(1, async job => {
    console.log(`Starting job processing: Job ID ${job.id}, Request ID ${job.data.requestId}`);
    try {
      logger.info('Processing job', { jobId: job.id, requestId: job.data.requestId });
      if (!job.data.requestId || !job.data.riderId || !job.data.city) {
        throw new Error('Invalid job data');
      }
      const requests = [job.data];
      const startTime = Date.now();
      while (Date.now() - startTime < CONFIG.BATCH_TIMEOUT_MS && requests.length < CONFIG.MAX_POOL_SIZE) {
        const waitingJobs = await poolingQueue.getWaiting();
        console.log('Collecting jobs', {
          waitingCount: waitingJobs.length,
          currentCount: requests.length,
          jobIds: waitingJobs.map(j => j.id),
          elapsedTime: Date.now() - startTime,
        });
        for (const waitJob of waitingJobs) {
          if (
            waitJob.data &&
            waitJob.data.requestId &&
            !requests.some(r => r.requestId === waitJob.data.requestId)
          ) {
            console.log(`Adding waiting job to batch: Job ID ${waitJob.id}, Request ID ${waitJob.data.requestId}`);
            requests.push(waitJob.data);
            console.log(`Job included in batch: Job ID ${waitJob.id}`);
          }
        }
        if (requests.length >= 2) {
          console.log(`Batch size reached: ${requests.length} requests`);
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      console.log(`Batch processing started: ${requests.length} requests`, requests.map(r => r.requestId));
      await processPoolingBatch(requests);
      console.log(`Batch processing completed for requests: ${requests.map(r => r.requestId).join(', ')}`);
    } catch (err) {
      console.log(`Batch processing failed: Job ID ${job.id}, Error: ${err.message}`);
      logger.error('Pooling batch processing failed', {
        error: err.message,
        stack: err.stack,
        jobId: job.id,
        requestId: job.data.requestId,
      });
      throw err;
    }
  });

  printJobs().catch(err => console.error('Error printing jobs:', err));
}

module.exports = { poolingQueue, setupQueue };