const Queue = require("bull");
const { logger } = require("./logger");

const matchingQueue = new Queue("match-rides", {
  redis: { host: "localhost", port: 6379 },
});



module.exports = { matchingQueue };