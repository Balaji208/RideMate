const Queue = require("bull");
const h3 = require("h3-js");
const { redisClient } = require("../config/redis");
const { logger } = require("../config/logger");
const { calculateETA } = require("./eta");

const matchingQueue = new Queue("match-rides", {
  redis: { host: "localhost", port: 6379 },
});

matchingQueue.process(async (job) => {
  try {
    const request = job.data;
    console.log("Processing request:", request);
    const { requestId, riderId, lat, long, rideType, city } = request;
    const cityLower = city.toLowerCase();
    logger.info("Processing ride request", { requestId, riderId, cityLower });

    // Get H3 cell and nearby cells
    const riderCell = h3.latLngToCell(lat, long, 8);
    console.log("H3 cell:", riderCell);
    const cells = h3.gridDisk(riderCell, 2);
    console.log("Grid disk cells:", cells);

    // Collect driver IDs
    const driverIds = new Set();
    for (const cell of cells) {
      const ids = await redisClient.sMembers(`captains:${cityLower}:${cell}`);
      console.log("Drivers in cell", { cell, ids });
      ids.forEach((id) => driverIds.add(id));
    }
    console.log("Driver IDs collected:", driverIds);
    logger.info("Driver IDs collected", { driverCount: driverIds.size });

    if (!driverIds.size) {
      logger.warn("No drivers available", { requestId });
      return;
    }

    // Filter eligible drivers
    const now = Date.now();
    const drivers = [];
    for (const DRIVER_ID of driverIds) {
      const details = await redisClient.hGetAll(`captains:${cityLower}:${DRIVER_ID}`);
      console.log("Driver details:", { DRIVER_ID, details });
      if (
        details.isAvailable === "true" &&
        details.status === "active" &&
        parseInt(details.lastUpdated || 0) >= now - 300000 // 5min
      ) {
        const pos = await redisClient.geoPos(`captains:${cityLower}`, DRIVER_ID);
        if (pos && pos[0]) {
          drivers.push({
            DRIVER_ID,
            lat: pos[0].latitude,
            long: pos[0].longitude,
            rideTypeSupported: JSON.parse(details.rideTypeSupported || "[]"),
            rating: parseFloat(details.rating || "1"),
          });
        }
      }
    }
    console.log("Filtered drivers:", drivers);
    logger.info("Drivers filtered", { driverCount: drivers.length });

    if (!drivers.length) {
      logger.warn("No eligible drivers after filtering", { requestId });
      return;
    }

    // Find best match
    let bestMatch = null;
    let minEta = Infinity;
    for (const driver of drivers) {
      if (!driver.rideTypeSupported.includes(rideType)) {
        console.log("Ride type mismatch:", { DRIVER_ID: driver.DRIVER_ID, rideType });
        continue;
      }

      const eta = await calculateETA(
        redisClient,
        cityLower,
        riderId,
        driver.DRIVER_ID,
        driver.lat,
        driver.long,
        lat,
        long
      );
      console.log("ETA:", { DRIVER_ID: driver.DRIVER_ID, eta });

      if (eta !== null && eta <= 15 && eta < minEta) {
        minEta = eta;
        bestMatch = {
          requestId,
          riderId,
          DRIVER_ID: driver.DRIVER_ID,
          eta,
          driverLat: driver.lat,
          driverLong: driver.long,
          rating: driver.rating,
        };
      }
    }

    if (!bestMatch) {
      console.log("No valid match found for request:", requestId);
      logger.warn("No valid match found", { requestId });
      return;
    }

    console.log("Best match:", bestMatch);
    // Store match and update driver
    await redisClient.setEx(`match:${requestId}`, 300, JSON.stringify(bestMatch));
    await redisClient.hSet(`captains:${cityLower}:${bestMatch.DRIVER_ID}`, "isAvailable", "false");
    logger.info("Match stored", { requestId, DRIVER_ID: bestMatch.DRIVER_ID });
  } catch (err) {
    console.log("Matching error:", err);
    logger.error("Matching Error", { error: err.message, stack: err.stack });
  }
});

logger.info("Matching service started");

module.exports = { matchingQueue };