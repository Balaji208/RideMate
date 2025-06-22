const CONFIG = {
  MAX_POOL_SIZE: 4,
  MAX_DETOUR_MINUTES: 30,
  MAX_PROXIMITY_KM: 5,
  TIME_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_ETA_MINUTES: 60,
  RETRY_ATTEMPTS: 3,
  ETA_CACHE_TTL: 300,
  GENDER_STRICT_MATCH: false,
  BATCH_TIMEOUT_MS: 30000, // 30 seconds
};

const QUEUE_CONFIG = {
  redis: {
    host: 'localhost',
    port: 6379,
    maxRetriesPerRequest: 3,
    connectTimeout: 10000,
  },
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: true,
    delay: 5000,
    attempts: 3,
    backoff: { type: 'fixed', delay: 1000 },
  },
  settings: {
    maxStalledCount: 3,
    stallInterval: 5000,
    lockDuration: 30000,
    lockRenewTime: 15000,
  },
};

module.exports = { CONFIG, QUEUE_CONFIG };