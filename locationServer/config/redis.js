const redis = require("redis");
const { logger } = require("./logger");

const redisClient = redis.createClient({
  url: "redis://localhost:6379",
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
  },
});

redisClient.on("error", (err) => logger.error("Redis Error:", { error: err.message }));
redisClient.connect().then(() => logger.info("Redis Connected"));

module.exports = { redisClient };