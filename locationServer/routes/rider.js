
const express = require("express");
const Queue = require("bull");
const { redisClient } = require("../config/redis");
const { logger } = require("../config/logger");
const { validateRider, validateRideRequest } = require("../utils/validation");
const { validateCoordinates } = require("../utils/validation");
const { v4: uuidv4 } = require("uuid");
const { poolingQueue, findPoolableRiders } = require("../services/pooling");
const { matchingQueue } = require("../services/matching");

const router = express.Router();

logger.info("Initializing rider routes");

router.post("/", async (req, res) => {
  try {
    logger.info("Handling POST /location/rider");
    const { riderId, long, lat, city } = req.body;
    logger.info("POST Rider", { body: req.body });

    const validation = validateRider(req.body);
    if (!validation.valid) {
      logger.warn("Validation failed", { error: validation.error, body: req.body });
      return res.status(400).json({ error: validation.error });
    }

    const cityLower = city.toLowerCase();
    if (!validateCoordinates(cityLower, lat, long)) {
      logger.warn("Invalid coordinates", { city: cityLower, lat, long });
      return res.status(400).json({ error: "Invalid coordinates for city" });
    }

    await redisClient.geoAdd(`riders:${cityLower}`, {
      longitude: long,
      latitude: lat,
      member: riderId,
    });
    logger.info("GEOADD riders", { riderId, cityLower, lat, long });

    res.json({ success: true, data: "Rider location updated successfully" });
  } catch (err) {
    logger.error("Rider Location Update Error", { error: err.message });
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/request", async (req, res) => {
  try {
    logger.info("Handling POST /ride/request");
    const { riderId, lat, long, dropoffLat, dropoffLong, rideType, mode, ridePooling, gender, city } = req.body;
    logger.info("POST Ride Request", { body: req.body });

    const validation = validateRideRequest(req.body);
    if (!validation.valid) {
      logger.warn("Validation failed", { error: validation.error, body: req.body });
      return res.status(400).json({ error: validation.error });
    }

    const cityLower = city.toLowerCase();
    if (!validateCoordinates(cityLower, lat, long) || !validateCoordinates(cityLower, dropoffLat, dropoffLong)) {
      logger.warn("Invalid coordinates", { city: cityLower, lat, long, dropoffLat, dropoffLong });
      return res.status(400).json({ error: "Invalid coordinates for city" });
    }

    const requestId = uuidv4();
    const request = {
      requestId,
      riderId,
      lat,
      long,
      dropoffLat,
      dropoffLong,
      rideType,
      mode,
      ridePooling,
      gender,
      city: cityLower,
      timestamp: Date.now(),
    };

    if (ridePooling && rideType === "shared") {
      await poolingQueue.add(request);
      console.log("Added to Pool Queue ",{ requestId, riderId, cityLower });
      logger.info("Pooled ride request queued", { requestId, riderId, cityLower });
    } else {
      console.log("Added to individual Queue ",{ requestId, riderId, cityLower });
      await matchingQueue.add(request);
      logger.info("Individual ride request queued", { requestId, riderId, cityLower });
    }

    res.json({ success: true, requestId });
  } catch (err) {
    logger.error("Ride Request Error", { error: err.message });
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/match/:requestId", async (req, res) => {
  try {
    logger.info("Handling GET /ride/match/:requestId");
    const { requestId } = req.params;
    logger.info("GET Ride Match", { requestId });

    const match = await redisClient.get(`match:${requestId}`);
    if (!match) {
      logger.info("Match not found or pending", { requestId });
      return res.json({ status: "pending" });
    }

    logger.info("Match found", { requestId, match });
    res.json({ status: "matched", data: JSON.parse(match) });
  } catch (err) {
    logger.error("Ride Match Error", { requestId, error: err.message });
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/pool", async (req, res) => {
  try {
    logger.info("Handling POST /ride/pool");
    const { riderId, requestId, lat, long, dropoffLat, dropoffLong, rideType, mode, gender, city } = req.body;
    logger.info("POST Pool Request", { body: req.body });

    const validation = validateRideRequest({ riderId, lat, long, dropoffLat, dropoffLong, rideType, mode, ridePooling: true, gender, city });
    if (!validation.valid) {
      logger.warn("Validation failed", { error: validation.error, body: req.body });
      return res.status(400).json({ error: validation.error });
    }

    const cityLower = city.toLowerCase();
    if (!validateCoordinates(cityLower, lat, long) || !validateCoordinates(cityLower, dropoffLat, dropoffLong)) {
      logger.warn("Invalid coordinates", { city: cityLower, lat, long, dropoffLat, dropoffLong });
      return res.status(400).json({ error: "Invalid coordinates for city" });
    }

    const request = { requestId, riderId, lat, long, dropoffLat, dropoffLong, rideType, mode, gender, city: cityLower, timestamp: Date.now() };
    const poolable = await findPoolableRiders(cityLower, request);
    logger.info("Poolable riders found", { requestId, poolable: poolable.map(r => r.requestId) });

    res.json(poolable.map(r => ({
      requestId: r.requestId,
      riderId: r.riderId,
      lat: r.lat,
      long: r.long,
      dropoffLat: r.dropoffLat,
      dropoffLong: r.dropoffLong,
    })));
  } catch (err) {
    logger.error("Pool Request Error", { error: err.message });
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
