const express = require("express");
const { redisClient } = require("./config/redis");
const { logger } = require("./config/logger");
const captainRoutes = require("./routes/captain");
const riderRoutes = require("./routes/rider");
const healthRoutes = require("./routes/health");
const { matchingQueue } = require("./services/matching"); // calls and runs immediately
const cors = require('cors');

logger.info("Starting server setup");

logger.info("Loading express module");
const app = express();
const port = 3002;
app.use(cors());
logger.info("Configuring middleware");
app.use(express.json());

logger.info("Mounting routes");
app.use("/location/captain", captainRoutes);
logger.info("Mounting /location/captain");
app.use("/location/rider", riderRoutes);
logger.info("Mounting /location/rider");
app.use("/ride", riderRoutes);
logger.info("Mounting /ride");
app.use("/captains", captainRoutes);
logger.info("Mounting /captains");
app.use("/", healthRoutes);
logger.info("Mounting /");

logger.info("Setting up 404 handler");
app.use((req, res) => {
  res.status(404).send("Not Found");
});

logger.info("Starting server");
app.listen(port, () => {
  logger.info(`Location Server on :${port}`);
});

redisClient.on("connect", () => {
  logger.info("Redis Connected");
});

redisClient.on("error", (err) => {
  logger.error("Redis Connection Error", { error: err.message });
});

process.on("SIGINT", async () => {
  logger.info("Shutting down server");
  await redisClient.quit();
  await matchingQueue.close();
  process.exit(0);
});