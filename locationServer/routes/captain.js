const express = require("express");
const { redisClient } = require("../config/redis");
const { logger } = require("../config/logger");
const { validateCaptain, validateNearbyQuery, validateCoordinates } = require("../utils/validation");
const { calculateETA } = require("../services/eta");
const h3 = require("h3-js");

const router = express.Router();

const h3Queue = [];

async function forceH3Sync(queue, redisClient, logger) {
  try {
    const pipeline = redisClient.multi();
    for (const update of queue) {
      const { DRIVER_ID, lat, long, oldCell, city } = update;
      const newCell = h3.latLngToCell(lat, long, 8);
      logger.info("H3 Sync for driver", { DRIVER_ID, lat, long, newCell, oldCell, city });

      if (oldCell && oldCell !== newCell) {
        pipeline.sRem(`captains:${city}:${oldCell}`, DRIVER_ID);
        logger.info("Removing driver from old cell", { DRIVER_ID, oldCell });
      }

      pipeline.sAdd(`captains:${city}:${newCell}`, DRIVER_ID);
      logger.info("Adding driver to new cell", { DRIVER_ID, newCell });

      update.oldCell = newCell;
    }

    const results = await pipeline.exec();
    logger.info("H3 Sync pipeline executed", {
      results: results.map((result, index) => result[0] ? { error: result[0].message } : { success: true, value: result[1] })
    });
    queue.length = 0; // Clear queue on success
  } catch (err) {
    console.error("H3 Sync Error", { error: err.message, stack: err.stack });
    logger.error("H3 Sync Error", { error: err.message });
  }
}

router.post("/", async (req, res) => {
  try {
    const {
      DRIVER_ID,
      long,
      lat,
      rideTypeSupported,
      isAvailable,
      status,
      rating,
      city,
    } = req.body;
    logger.info("POST Captain", { DRIVER_ID, lat, long, rideTypeSupported, isAvailable, rating, city });

    const validation = validateCaptain(req.body);
    if (!validation.valid) {
      logger.warn("Validation failed", { error: validation.error, body: req.body });
      return res.status(400).json({ error: validation.error });
    }

    const cityLower = city.toLowerCase();
    if (!validateCoordinates(cityLower, lat, long)) {
      logger.warn("Invalid coordinates", { cityLower, lat, long });
      return res.status(400).json({ error: "Invalid coordinates for city" });
    }

    const pipeline = redisClient.multi();
    pipeline.geoAdd(`captains:${cityLower}`, {
      longitude: long,
      latitude: lat,
      member: DRIVER_ID,
    });
    pipeline.hSet(`captains:${cityLower}:${DRIVER_ID}`, {
      rideTypeSupported: JSON.stringify(rideTypeSupported),
      isAvailable: isAvailable ? "true" : "false",
      status,
      rating: rating.toString(),
      lastUpdated: Date.now().toString(),
    });
    const geoResults = await pipeline.exec();
    logger.info("Redis updated", { DRIVER_ID, geoAdd: !geoResults[0][0], hSet: !geoResults[1][0] });

    const oldCell = h3Queue.find((u) => u.DRIVER_ID === DRIVER_ID)?.oldCell || null;
    h3Queue.push({ DRIVER_ID, lat, long, oldCell, city: cityLower });
    await forceH3Sync(h3Queue, redisClient, logger);

    // Debug: Verify Redis state
    const cell = h3.latLngToCell(lat, long, 8);
    const members = await redisClient.sMembers(`captains:${cityLower}:${cell}`);
    const details = await redisClient.hGetAll(`captains:${cityLower}:${DRIVER_ID}`);
    console.log(`Post-registration for ${DRIVER_ID}: Cell ${cell} members: ${members.join(",")}`);
    console.log(`Post-registration for ${DRIVER_ID}: Details:`, details);

    res.json({ success: true });
  } catch (err) {
    logger.error("Captain Location Update Error", { error: err.message });
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/nearby", async (req, res) => {
  try {
    const { lat, long, type, city, riderId } = req.query;
    logger.info("GET Nearby", { query: req.query });

    const validation = validateNearbyQuery(req.query);
    if (!validation.valid) {
      logger.warn("Validation failed", { error: validation.error, query: req.query });
      return res.status(400).json({ error: validation.error });
    }

    const latNum = parseFloat(lat);
    const longNum = parseFloat(long);
    const cityLower = city.toLowerCase();

    if (!validateCoordinates(cityLower, latNum, longNum)) {
      logger.warn("Invalid coordinates", { city: cityLower, lat: latNum, long: longNum });
      return res.status(400).json({ error: "Invalid coordinates for city" });
    }

    const riderCell = h3.latLngToCell(latNum, longNum, 8);
    logger.info("Rider Cell", { riderCell });
    const cells = h3.gridDisk(riderCell, 2);
    logger.info("Cells", { cells: cells.join(",") });

    let driverIds = [];
    try {
      for (const cell of cells) {
        const ids = await redisClient.sMembers(`captains:${cityLower}:${cell}`);
        logger.info("Cell members", { cell, ids });
        driverIds.push(...ids);
      }
    } catch (err) {
      logger.error("Error fetching cell members", { error: err.message });
      throw err;
    }
    driverIds = [...new Set(driverIds)];
    logger.info("Driver IDs", { driverIds });

    if (!driverIds.length) {
      logger.info("No drivers found");
      return res.json([]);
    }

    const captains = [];
    for (const DRIVER_ID of driverIds.slice(0, 50)) {
      let details;
      try {
        details = await redisClient.hGetAll(`captains:${cityLower}:${DRIVER_ID}`);
        logger.info("Captain details", { DRIVER_ID, details });
      } catch (err) {
        logger.error("Error fetching captain details", { DRIVER_ID, error: err.message });
        continue;
      }
      if (
        details.isAvailable === "true" &&
        details.status === "active" &&
        JSON.parse(details.rideTypeSupported || "[]").includes(type)
      ) {
        let pos;
        try {
          pos = await redisClient.geoPos(`captains:${cityLower}`, DRIVER_ID);
        } catch (err) {
          logger.error("Error fetching geo position", { DRIVER_ID, error: err.message });
          continue;
        }
        if (pos && pos[0]) {
          captains.push({
            DRIVER_ID,
            lat: pos[0].latitude,
            long: pos[0].longitude,
            rating: parseFloat(details.rating || "1"),
          });
        }
      }
    }
    logger.info("Filtered Captains", { captains });

    if (!captains.length) {
      logger.info("No captains after filtering");
      return res.json([]);
    }

    const captainsWithETA = [];
    for (const captain of captains.slice(0, 20)) {
      let eta;
      try {
        eta = await calculateETA(
          redisClient,
          cityLower,
          riderId,
          captain.DRIVER_ID,
          captain.lat,
          captain.long,
          latNum,
          longNum
        );
      } catch (err) {
        logger.error("Error calculating ETA", { DRIVER_ID: captain.DRIVER_ID, riderId, error: err.message });
        continue;
      }
      if (eta !== null && eta <= 15) {
        captainsWithETA.push({ ...captain, eta });
      }
    }
    logger.info("Captains with ETA", { captainsWithETA });

    if (!captainsWithETA.length) {
      logger.info("No captains with valid ETA");
      return res.json([]);
    }

    captainsWithETA.sort((a, b) => a.eta - b.eta);
    const topCaptains = captainsWithETA
      .slice(0, 10)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 3);

    logger.info("Response", { topCaptains });
    res.json(
      topCaptains.map((c) => ({
        DRIVER_ID: c.DRIVER_ID,
        lat: c.lat,
        long: c.long,
        eta: c.eta,
        rating: c.rating,
      }))
    );
  } catch (err) {
    logger.error("Nearby Captains Error", { error: err.message, stack: err.stack });
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;