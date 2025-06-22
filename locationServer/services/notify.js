const { redisClient } = require("../config/redis");
const { logger } = require("../config/logger");
const Redis = require("ioredis");

const pubClient = new Redis({ host: "localhost", port: 6379 });
const subClient = new Redis({ host: "localhost", port: 6379 });

  async function sendNotification({ driverId, requestId, riderId, distance, eta, message }) {
    try {
      console.log('Received driver id : ',driverId);
    const channel = `notifications:${driverId}`;
    const payload = JSON.stringify({ requestId, riderId, distance, eta, message });
    console.log(`Publishing notification to ${channel}: ${payload}`);
    await pubClient.publish(channel, payload);
    logger.info(`Notification published ${message}`, { driverId, requestId, distance, eta });
    // Store notification state
    await redisClient.setEx(`notification:${requestId}:${driverId}`, 10, JSON.stringify({ status: "pending" }));
    // Simulate driver response after a short delay
    setTimeout(() => {
      simulateDriverResponse(driverId, requestId, true);
    }, 100);
  } catch (err) {
    console.log(`Notification send error: ${err.message}`);
    logger.error("Notification send error", { driverId, requestId, error: err.message });
    throw err;
  }
}
async function sendPooledRideNotification({ driverId, sharedRequestId, riderInfo, message }) {
  try {
    const channel = `notifications:${driverId}`;
    const payload = JSON.stringify({ driverId, sharedRequestId, riderInfo, message });
    console.log(`Publishing notification to ${channel}: ${payload}`);
    await redisClient.publish(channel, payload);
    logger.info(`Notification published ${message}`, { driverId, sharedRequestId, riderInfo, message });
    await redisClient.setEx(`notification:${sharedRequestId}:${driverId}`, 10, JSON.stringify({ status: "pending" }));
    setTimeout(() => {
      simulateDriverResponse(driverId, sharedRequestId, true);
    }, 100);
  } catch (err) {
    console.log(`Notification send error: ${err.message}`);
    logger.error("Notification send error", { driverId, sharedRequestId, error: err.message });
    throw err;
  }
}



async function simulateDriverResponse(driverId, requestId, accepted = true) {
  const channel = `responses:${driverId}`;
  console.log("Channel : ",channel);
  const payload = JSON.stringify({ requestId, accepted });
  console.log(`Simulating driver response on ${channel}: ${payload}`);
  await pubClient.publish(channel, payload);
  logger.info("Simulated driver response", { driverId, requestId, accepted });
}

module.exports = { sendNotification, simulateDriverResponse ,sendPooledRideNotification};