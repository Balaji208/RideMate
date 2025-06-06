const h3 = require("h3-js");

const h3Queue = [];

setInterval(async (redisClient, logger) => {
  if (!h3Queue.length) return;

  const updates = h3Queue.splice(0, h3Queue.length);
  for (const { DRIVER_ID, long, lat, oldCell, city } of updates) {
    try {
      const newCell = h3.latLngToCell(lat, long, 8);
      logger.info("H3 Sync", { DRIVER_ID, newCell });
      if (newCell !== oldCell) {
        if (oldCell) {
          await redisClient.sRem(`captains:${city}:${oldCell}`, DRIVER_ID);
          logger.info("Removed from old cell", { DRIVER_ID, oldCell });
        }
        await redisClient.sAdd(`captains:${city}:${newCell}`, DRIVER_ID);
        logger.info("Added to new cell", { DRIVER_ID, newCell });
      }
    } catch (err) {
      logger.error("H3 Sync Error", { DRIVER_ID, error: err.message });
    }
  }
}, 30 * 1000, require("../config/redis").redisClient, require("../config/logger").logger);

async function forceH3Sync(h3Queue, redisClient, logger) {
  const updates = h3Queue.splice(0, h3Queue.length);
  for (const { DRIVER_ID, long, lat, oldCell, city } of updates) {
    try {
      const newCell = h3.latLngToCell(lat, long, 8);
      logger.info("Force Sync", { DRIVER_ID, newCell });
      if (newCell !== oldCell) {
        if (oldCell) {
          await redisClient.sRem(`captains:${city}:${oldCell}`, DRIVER_ID);
          logger.info("Removed from old cell", { DRIVER_ID, oldCell });
        }
        await redisClient.sAdd(`captains:${city}:${newCell}`, DRIVER_ID);
        logger.info("Added to new cell", { DRIVER_ID, newCell });
      }
    } catch (err) {
      logger.error("Force Sync Error", { DRIVER_ID, error: err.message });
    }
  }
}

module.exports = { forceH3Sync, h3Queue };