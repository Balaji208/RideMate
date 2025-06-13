const { redisClient } = require("../config/redis");
const { logger } = require("../config/logger");
const Redis = require("ioredis");

const pubClient = new Redis({ host: "localhost", port: 6379 });
const subClient = new Redis({ host: "localhost", port: 6379 });

async function sendNotification(driverId, requestId, riderId, distance,eta,message) {
  try {
    const channel = `notifications:${driverId}`;
    const payload = JSON.stringify({ requestId, riderId,distance,eta, message });
   // console.log("Payload ",payload);
    await pubClient.publish(channel, payload);
    logger.info("Notification published", { driverId, requestId,distance,eta, message });
    // Store notification state
    await redisClient.setEx(`notification:${requestId}:${driverId}`, 10, JSON.stringify({ status: "pending" }));
  } catch (err) {
    logger.error("Notification send error", { driverId, requestId, error: err.message });
    throw err;
  }
}

async function awaitDriverResponse(driverId, requestId) {
  return new Promise((resolve) => {
    const channel = `responses:${driverId}`;
    const timeout = setTimeout(() => {
      subClient.unsubscribe(channel);
      logger.info("Driver response timeout", { driverId, requestId });
      resolve(false); // Timeout = rejection
    }, 5000);

    subClient.subscribe(channel, (err) => {
      if (err) {
        logger.error("Subscription error", { driverId, requestId, error: err.message });
        clearTimeout(timeout);
        resolve(false);
      }
    });

    subClient.on("message", async (ch, message) => {
      if (ch === channel) {
        try {
          const response = JSON.parse(message);
          if (response.requestId === requestId) {
            clearTimeout(timeout);
            subClient.unsubscribe(channel);
            await redisClient.setEx(
              `notification:${requestId}:${driverId}`,
              10,
              JSON.stringify({ status: response.accepted ? "accepted" : "rejected" })
            );
            logger.info("Driver response received", { driverId, requestId, accepted: response.accepted });
            resolve(response.accepted);
          }
        } catch (err) {
          logger.error("Response parse error", { driverId, requestId, error: err.message });
          resolve(false);
        }
      }
    });
  });
}

// Mock driver response simulator for testing
async function simulateDriverResponse(driverId, requestId, accepted = true) {
  const channel = `responses:${driverId}`;
  const payload = JSON.stringify({ requestId, accepted });
  await pubClient.publish(channel, payload);
  logger.info("Simulated driver response", { driverId, requestId, accepted });
}

module.exports = { sendNotification, awaitDriverResponse, simulateDriverResponse };