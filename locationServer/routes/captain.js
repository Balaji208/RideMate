const express = require("express");
const { redisClient } = require("../config/redis");
const { logger } = require("../config/logger");
const { validateCaptain, validateNearbyQuery, validateCoordinates } = require("../utils/validation");
const { forceH3Sync } = require("../services/h3Sync");
const { calculateETA } = require("../services/eta");
const h3 = require("h3-js");

const router = express.Router();

const h3Queue = [];

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
    logger.info("POST Captain", { body: req.body });

    const validation = validateCaptain(req.body);
    if (!validation.valid) {
      logger.warn("Validation failed", { error: validation.error, body: req.body });
      return res.status(400).json({ error: validation.error });
    }

    const cityLower = city.toLowerCase();
    if (!validateCoordinates(cityLower, lat, long)) {
      logger.warn("Invalid coordinates", { city: cityLower, lat, long });
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
    await pipeline.exec();
    logger.info("Redis updated", { DRIVER_ID, geoAdd: true, hSet: true });

    const oldCell = h3Queue.find((u) => u.DRIVER_ID === DRIVER_ID)?.oldCell || null;
    h3Queue.push({ DRIVER_ID, lat, long, oldCell, city: cityLower });
    await forceH3Sync(h3Queue, redisClient, logger);

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
    for (const cell of cells) {
      const ids = await redisClient.sMembers(`captains:${cityLower}:${cell}`);
      logger.info("Cell members", { cell, ids });
      driverIds.push(...ids);
    }
    driverIds = [...new Set(driverIds)];
    logger.info("Driver IDs", { driverIds });

    if (!driverIds.length) {
      logger.info("No drivers found");
      return res.json([]);
    }

    const captains = [];
    for (const DRIVER_ID of driverIds.slice(0, 50)) {
      const details = await redisClient.hGetAll(`captains:${cityLower}:${DRIVER_ID}`);
      logger.info("Captain details", { DRIVER_ID, details });
      if (
        details.isAvailable === "true" &&
        details.status === "active" &&
        JSON.parse(details.rideTypeSupported || "[]").includes(type)
      ) {
        const pos = await redisClient.geoPos(`captains:${cityLower}`, DRIVER_ID);
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
      const eta = await calculateETA(
        redisClient,
        cityLower,
        riderId,
        captain.DRIVER_ID,
        captain.lat,
        captain.long,
        latNum,
        longNum
      );
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
    logger.error("Nearby Captains Error", { error: err.message });
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;