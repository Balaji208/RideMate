const Queue = require("bull");
const { logger } = require("./logger");

const matchingQueue = new Queue("ride-matching", {
  redis: { host: "localhost", port: 6379 },
});

// Schedule batch processing every 3 seconds
setInterval(() => {
  matchingQueue.add({}, { repeat: { every: 3000 } });
}, 3000);

module.exports = { matchingQueue };