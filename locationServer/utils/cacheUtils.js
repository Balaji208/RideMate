const { redisClient } = require('../config/redis');
const { logger } = require('../config/logger');
const { CONFIG } = require('../config/poolingConfig');

async function getCachedETA(cacheKey) {
  console.log(`Getting cached ETA for key: ${cacheKey}`);
  try {
    const cached = await redisClient.get(cacheKey);
    const eta = cached ? parseFloat(cached) : null;
    console.log(`Cached ETA retrieved: ${eta}`);
    return eta;
  } catch (err) {
    console.log(`Redis get ETA cache failed: ${cacheKey}, Error: ${err.message}`);
    logger.error('Redis get ETA cache failed', { cacheKey, error: err.message, stack: err.stack });
    return null;
  }
}

async function setCachedETA(cacheKey, eta) {
  console.log(`Setting cached ETA: ${cacheKey} = ${eta}`);
  if (eta !== null && !isNaN(eta)) {
    try {
      await redisClient.setEx(cacheKey, CONFIG.ETA_CACHE_TTL, eta.toString());
      console.log(`Cached ETA set successfully: ${cacheKey}`);
    } catch (err) {
      console.log(`Redis set ETA cache failed: ${cacheKey}, Error: ${err.message}`);
      logger.error('Redis set ETA cache failed', { cacheKey, error: err.message, stack: err.stack });
    }
  }
}

module.exports = { getCachedETA, setCachedETA };