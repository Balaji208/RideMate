const express = require("express");
const { redisClient } = require("../config/redis");
const { logger } = require("../config/logger");

const router = express.Router();

router.get("/health", (req, res) => {
  logger.info("GET Health");
  res.json({ status: "ok" });
});

router.get("/clear-redis", async (req, res) => {
  try {
    await redisClient.flushAll();
    logger.info("Redis cleared");
    res.json({ success: true });
  } catch (err) {
    logger.error("Clear Redis Error", { error: err.message });
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;