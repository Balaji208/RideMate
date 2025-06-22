const Queue = require("bull");
const h3 = require("h3-js");
const { redisClient } = require("../config/redis");
const { logger } = require("../config/logger");
const { calculateETA } = require("../services/eta");
const { Munkres } = require("munkres-js");
const { validateCoordinates } = require("../utils/validation");
const { sendNotification } = require("./notify");
const { haversineDistance } = require("../utils/geoUtils");
const matchingQueue = new Queue("match-rides", {
  redis: { host: "localhost", port: 6379 },
});

Math.toRadians = (degrees) => degrees * (Math.PI / 180);

async function awaitDriverResponse(driverId, requestId) {
  const channel = `responses:${driverId}`;
  console.log(`Subscribing to ${channel} for request: ${requestId}`);
  let redisSub = null;

  try {
    redisSub = redisClient.duplicate();
    console.log(`Connecting Redis subscriber for ${channel}`);
    await redisSub.connect();
    console.log(`Connected to ${channel}`);

    return await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log(`Driver response timeout for ${driverId}, request: ${requestId}`);
        resolve(false);
      }, 5000); // Reduced timeout for debugging

      redisSub.subscribe(channel, (message) => {
        try {
          const response = JSON.parse(message);
          console.log(`Received message on ${channel}:`, response);
          console.log(`Comparing response.requestId ${response.requestId} with requestId ${requestId}`);
          if (response.requestId === requestId) {
            console.log(`Driver response received: ${driverId}, request ${requestId}, accepted: ${response.accepted}`);
            clearTimeout(timeout);
            resolve(response.accepted === true);
          } else {
            console.log(`Ignoring message for different requestId: ${response.requestId}`);
          }
        } catch (err) {
          console.log(`Error parsing response on ${channel}: ${err.message}`);
          logger.error("Error parsing driver response", {
            driverId,
            error: err.message,
            stack: err.stack,
          });
        }
      }, true);
    });
  } catch (err) {
    console.log(`Subscription failed for ${channel}: ${err.message}`);
    logger.error("Subscription failed", {
      driverId,
      error: err.message,
      stack: err.stack,
    });
    return false;
  } finally {
    if (redisSub && redisSub.isOpen) {
      try {
        await redisSub.quit();
        console.log(`Unsubscribed from ${channel}`);
      } catch (err) {
        console.log(`Failed to quit subscription for ${channel}: ${err.message}`);
        logger.error("Failed to quit subscription", {
          driverId,
          error: err.message,
          stack: err.stack,
        });
      }
    }
  }
}

matchingQueue.process(async (job) => {
  try {
    console.log("Processing job:", job.data.requestId);
    const requests = [job.data];
    const startTime = Date.now();
    while (Date.now() - startTime < 6000) {
      const waitingJobs = await matchingQueue.getWaiting();
      console.log(`Waiting jobs: ${waitingJobs.length}`);
      for (const waitJob of waitingJobs) {
        if (!requests.some((r) => r.requestId === waitJob.data.requestId)) {
          requests.push(waitJob.data);
          console.log(`Added request to batch: ${waitJob.data.requestId}`);
        }
      }
      if (requests.length >= 2) break;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    logger.info("Batch processing", {
      requestIds: requests.map((r) => r.requestId),
      requestCount: requests.length,
    });
    console.log("Starting batch processing", {
      requestIds: requests.map((r) => r.requestId),
    });

    await processBatch(requests);
    console.log("Batch processing completed");
  } catch (err) {
    console.error("Batch processing error:", err.message);
    logger.error("Batch processing error", {
      error: err.message,
      stack: err.stack,
    });
  }
});

async function processBatch(requests) {
  if (!requests.length) {
    logger.warn("No requests to process");
    console.log("No requests to process");
    return;
  }
  console.log("Individual queue batch processing started");
  const cityLower = requests[0].city.toLowerCase();
  const MAX_REJECTIONS = 4;
  const MAX_RADIUS = 10;
  let gridDiskRadius = 2;

  while (gridDiskRadius <= MAX_RADIUS) {
    console.log(`Searching drivers with radius: ${gridDiskRadius}`);
    const drivers = await getAvailableDrivers(cityLower, requests, gridDiskRadius);
    logger.info("Available drivers", {
      gridDiskRadius,
      driverIds: drivers.map((d) => d.DRIVER_ID),
    });
    console.log("Available drivers", {
      gridDiskRadius,
      driverIds: drivers.map((d) => d.DRIVER_ID),
    });

    if (!drivers.length) {
      logger.warn("No drivers found, increasing radius", { gridDiskRadius });
      console.log("No drivers found, increasing radius to", gridDiskRadius + 1);
      gridDiskRadius++;
      continue;
    }

    const costMatrix = [];
    const etaMatrix = [];
    for (const req of requests) {
      const costRow = [];
      const etaRow = [];
      console.log(`Calculating costs for rider: ${req.riderId}`);
      for (const driver of drivers) {
        if (!driver.rideTypeSupported.includes(req.rideType) || driver.mode !== req.mode) {
          costRow.push(Infinity);
          etaRow.push(Infinity);
          console.log("Ride type or mode mismatch", {
            riderId: req.riderId,
            DRIVER_ID: driver.DRIVER_ID,
            riderRideType: req.rideType,
            driverRideType: driver.rideTypeSupported,
            riderMode: req.mode,
            driverMode: driver.mode,
          });
          continue;
        }
        console.log(`Calculating ETA for ${req.riderId} to ${driver.DRIVER_ID}`);
        const eta = await calculateETA(redisClient, cityLower, req.riderId, driver.DRIVER_ID, [
          { lat: driver.lat, long: driver.long },
          { lat: req.lat, long: req.long },
        ]);
        console.log(`ETA result: ${eta} minutes`);
        etaRow.push(eta !== null && eta <= 15 ? eta : Infinity);
        if (eta === null || eta > 15) {
          costRow.push(Infinity);
          console.log("Invalid ETA", {
            riderId: req.riderId,
            DRIVER_ID: driver.DRIVER_ID,
            eta,
          });
          continue;
        }
        const ratingPenalty = (5 - driver.rating) * 0.01;
        const cost = eta + ratingPenalty;
        costRow.push(cost);
        console.log("Cost calculated", {
          riderId: req.riderId,
          DRIVER_ID: driver.DRIVER_ID,
          eta,
          rating: driver.rating,
          ratingPenalty,
          cost,
        });
      }
      costMatrix.push(costRow);
      etaMatrix.push(etaRow);
    }

    while (costMatrix.length < drivers.length) {
      costMatrix.push(new Array(drivers.length).fill(1e9));
      etaMatrix.push(new Array(drivers.length).fill(1e9));
      console.log("Padded cost matrix to match driver count");
    }

    logger.info("Cost matrix", { costMatrix });
    logger.info("ETA matrix", { etaMatrix });
    console.log("Cost Matrix:", JSON.stringify(costMatrix));
    console.log("ETA Matrix:", JSON.stringify(etaMatrix));

    try {
      console.log("Filtering cost matrix for finite values");
      const filteredCostMatrix = costMatrix.filter((row) => row.some((value) => isFinite(value)));
      console.log("Filtered Cost Matrix:", JSON.stringify(filteredCostMatrix));

      const munkres = new Munkres();
      console.log("Running Munkres algorithm");
      const assignments = munkres.compute(filteredCostMatrix);
      logger.info("Assignments", { assignments });
      console.log("Assignments:", assignments);

      let totalBestETA = 0;
      const bestMatches = [];
      const remainingRequests = [...requests];
      let availableDrivers = [...drivers];
      console.log(`Processing ${assignments.length} assignments`);

      for (const [riderIdx, driverIdx] of assignments) {
        console.log(`Processing assignment: riderIdx=${riderIdx}, driverIdx=${driverIdx}`);
        if (riderIdx >= requests.length || costMatrix[riderIdx][driverIdx] === Infinity) {
          const req = requests[riderIdx];
          if (req) {
            logger.warn("No valid match for request", { requestId: req.requestId });
            console.log(`No valid match for request: ${req.requestId}`);
            await redisClient.setEx(`match:${req.requestId}`, 300, JSON.stringify({ status: "no_match" }));
          }
          continue;
        }

        const req = requests[riderIdx];
        const driver = drivers[driverIdx];
        console.log(`Matching rider ${req.riderId} with driver ${driver.DRIVER_ID}`);
        if (!driver.DRIVER_ID) {
          console.error(`Error: driver.DRIVER_ID is undefined for rider=${req.riderId}, request=${req.requestId}`);
          logger.error("Invalid driver ID", { requestId: req.requestId, riderId: req.riderId });
          continue;
        }
        const rejectionsKey = `match:${req.requestId}:rejections`;
        let rejections = parseInt((await redisClient.get(rejectionsKey)) || "0");
        console.log(`Rejections for ${req.requestId}: ${rejections}`);

        console.log(`Recalculating ETA for confirmation`);
        const eta = await calculateETA(redisClient, cityLower, req.riderId, driver.DRIVER_ID, [
          { lat: driver.lat, long: driver.long },
          { lat: req.lat, long: req.long },
        ]);
        console.log(`Confirmation ETA: ${eta} minutes`);

        const distance = haversineDistance(parseFloat(req.lat), parseFloat(req.long), driver.lat, driver.long);
        console.log(`Distance to driver: ${distance} km`);
        //console.log('Driver Check : ',driver);
        console.log(`Sending notification to ${driver.DRIVER_ID} for request ${req.requestId}`);
        await sendNotification({
  driverId: driver.DRIVER_ID,
  requestId: req.requestId,
  riderId: req.riderId,
  distance: distance,
  eta: eta,
  message: `New ride request from ${req.riderId} at (${req.lat}, ${req.long})`
});

        console.log(`Notification sent to ${driver.DRIVER_ID}`);

        console.log(`Awaiting driver response for ${driver.DRIVER_ID}`);
        const accepted = await awaitDriverResponse(driver.DRIVER_ID, req.requestId);
        console.log(`Driver response for ${driver.DRIVER_ID}: accepted=${accepted}`);

        if (accepted) {
          if (eta !== null && eta <= 15) {
            totalBestETA += eta;
            const bestMatch = {
              requestId: req.requestId,
              riderId: req.riderId,
              DRIVER_ID: driver.DRIVER_ID,
              eta,
              driverLat: driver.lat,
              driverLong: driver.long,
              rating: driver.rating,
              distance,
            };
            bestMatches.push(bestMatch);
            console.log(`Saving match for ${req.requestId}`);
            await redisClient.setEx(`match:${req.requestId}`, 300, JSON.stringify(bestMatch));
            console.log(`Marking driver ${driver.DRIVER_ID} as unavailable`);
            await redisClient.hSet(`captains:${cityLower}:${driver.DRIVER_ID}`, "isAvailable", "false");
            console.log(`Deleting rejections for ${req.requestId}`);
            await redisClient.del(rejectionsKey);
            logger.info("Best match selected", {
              requestId: req.requestId,
              riderId: req.riderId,
              DRIVER_ID: bestMatch.DRIVER_ID,
              eta: bestMatch.eta,
              rating: bestMatch.rating,
              distance: bestMatch.distance,
            });
            console.log(`Match saved:`, bestMatch);
            remainingRequests.splice(remainingRequests.indexOf(req), 1);
            availableDrivers = availableDrivers.filter((d) => d.DRIVER_ID !== driver.DRIVER_ID);
            console.log(`Remaining requests: ${remainingRequests.length}`);
          } else {
            logger.warn("Invalid ETA after acceptance", {
              riderId: req.riderId,
              DRIVER_ID: driver.DRIVER_ID,
              eta,
            });
            console.log(`Invalid ETA after acceptance: ${eta}`);
            rejections++;
            console.log(`Incrementing rejections to ${rejections}`);
            await redisClient.setEx(rejectionsKey, 300, rejections.toString());
          }
        } else {
          logger.info("Driver rejected ride", {
            riderId: req.riderId,
            DRIVER_ID: driver.DRIVER_ID,
          });
          console.log(`Driver ${driver.DRIVER_ID} rejected ride`);
          rejections++;
          console.log(`Incrementing rejections to ${rejections}`);
          await redisClient.setEx(rejectionsKey, 300, rejections.toString());
          availableDrivers = availableDrivers.filter((d) => d.DRIVER_ID !== driver.DRIVER_ID);
          console.log(`Remaining drivers: ${availableDrivers.length}`);
        }

        if (rejections >= MAX_REJECTIONS) {
          logger.warn("Max rejections reached, increasing radius or no-match", {
            requestId: req.requestId,
            rejections,
          });
          console.log(`Max rejections (${rejections}) reached for ${req.requestId}`);
          await redisClient.del(rejectionsKey);
          gridDiskRadius++;
          break;
        }
      }
      console.log("Best matches:", bestMatches);

      if (bestMatches.length === requests.length) {
        logger.info("All requests matched", { requestCount: requests.length });
        console.log(`All ${requests.length} requests matched`);
        logger.info(`Best Matches for Batch (requestCount: ${requests.length}):`);
        logger.info(JSON.stringify(bestMatches));
        logger.info(`Total ETA for Best Matches: ${totalBestETA} minutes`);
        console.log(`Total ETA: ${totalBestETA} minutes`);
        return;
      }

      if (remainingRequests.length > 0 && gridDiskRadius < MAX_RADIUS) {
        logger.info("Retrying with remaining requests", {
          remainingRequestIds: remainingRequests.map((r) => r.requestId),
          newRadius: gridDiskRadius,
        });
        console.log(`Retrying with ${remainingRequests.length} remaining requests, radius: ${gridDiskRadius}`);
        requests.splice(0, requests.length, ...remainingRequests);
        continue;
      }

      for (const req of remainingRequests) {
        logger.warn("No match after max radius", { requestId: req.requestId });
        console.log(`No match for ${req.requestId} after max radius`);
        await redisClient.setEx(`match:${req.requestId}`, 300, JSON.stringify({ status: "no_match" }));
      }

      if (bestMatches.length > 0) {
        logger.info("Partial matches found", { requestCount: bestMatches.length });
        console.log(`Partial matches found: ${bestMatches.length}`);
        logger.info(`Best Matches for Batch (requestCount: ${requests.length}):`);
        logger.info(JSON.stringify(bestMatches));
        logger.info(`Total ETA for Best Matches: ${totalBestETA} minutes`);
        console.log(`Total ETA: ${totalBestETA} minutes`);
      }
      return;
    } catch (err) {
      logger.error("Hungarian algorithm error", {
        error: err.message,
        stack: err.stack,
      });
      console.error("Hungarian algorithm error:", err.message);
      gridDiskRadius++;
      if (gridDiskRadius > MAX_RADIUS) {
        for (const req of requests) {
          console.log(`Setting no match for ${req.requestId} after max radius`);
          await redisClient.setEx(`match:${req.requestId}`, 300, JSON.stringify({ status: "no_match" }));
        }
        return;
      }
    }
  }

  for (const req of requests) {
    logger.warn("No match after exhausting radii", { requestId: req.requestId });
    console.log(`No match for ${req.requestId} after exhausting all radii`);
    await redisClient.setEx(`match:${req.requestId}`, 300, JSON.stringify({ status: "no_match" }));
  }
}

async function getAvailableDrivers(cityLower, requests, gridDiskRadius) {
  console.log(`Getting available drivers for ${cityLower}, radius: ${gridDiskRadius}`);
  const driverIds = new Set();
  const cells = new Set();
  for (const req of requests) {
    const riderCell = h3.latLngToCell(parseFloat(req.lat), parseFloat(req.long), 8);
    const nearbyCells = h3.gridDisk(riderCell, gridDiskRadius);
    nearbyCells.forEach((cell) => {
      const [lat, long] = h3.cellToLatLng(cell);
      if (validateCoordinates(cityLower, lat, long)) {
        cells.add(cell);
      }
    });
    logger.info(`Rider ${req.riderId} cell: ${riderCell}, nearby cells: ${[...nearbyCells].join(",")}`);
    console.log(`Rider ${req.riderId} cell: ${riderCell}, nearby cells: ${[...nearbyCells]}`);
  }
  logger.info(`Total H3 cells searched: ${[...cells].join(",")}`);
  console.log(`Total H3 cells searched: ${[...cells]}`);

  for (const cell of cells) {
    const ids = await redisClient.sMembers(`captains:${cityLower}:${cell}`);
    logger.info(`Drivers in cell ${cell}: ${ids.join(",") || "none"}`);
    console.log(`Drivers in cell ${cell}: ${ids.join(",") || "none"}`);
    ids.forEach((id) => driverIds.add(id));
  }
  logger.info(`Unique driver IDs found: ${[...driverIds].join(",") || "none"}`);
  console.log(`Unique driver IDs found: ${[...driverIds]}`);

  const drivers = [];
  const now = Date.now();
  const DISTANCE_THRESHOLD = 20;
  for (const DRIVER_ID of driverIds) {
    console.log(`Checking driver ${DRIVER_ID}`);
    const details = await redisClient.hGetAll(`captains:${cityLower}:${DRIVER_ID}`);
    logger.info(`Driver ${DRIVER_ID} details: ${JSON.stringify(details)}`);
    console.log(`Driver ${DRIVER_ID} details:`, details);
    if (
      details.isAvailable === "true" &&
      details.status === "active" &&
      parseInt(details.lastUpdated || 0) >= now - 300000
    ) {
      const pos = await redisClient.geoPos(`captains:${cityLower}`, DRIVER_ID);
      logger.info(`Driver ${DRIVER_ID} position: ${JSON.stringify(pos)}`);
      console.log(`Driver ${DRIVER_ID} position:`, pos);
      if (pos && pos[0]) {
        const isWithinThreshold = requests.some((req) =>
          haversineDistance(
            parseFloat(req.lat),
            parseFloat(req.long),
            parseFloat(pos[0].latitude),
            parseFloat(pos[0].longitude)
          ) <= DISTANCE_THRESHOLD
        );
        logger.info(`Driver ${DRIVER_ID} within threshold: ${isWithinThreshold}`);
        console.log(`Driver ${DRIVER_ID} within threshold: ${isWithinThreshold}`);
        if (isWithinThreshold) {
          drivers.push({
            DRIVER_ID,
            lat: parseFloat(pos[0].latitude),
            long: parseFloat(pos[0].longitude),
            rideTypeSupported: JSON.parse(details.rideTypeSupported || "[]"),
            mode: details.mode,
            rating: parseFloat(details.rating || 1),
          });
          console.log(`Added driver ${DRIVER_ID} to available list`);
        }
      }
    }
  }
  logger.info(`Final available drivers: ${drivers.map((d) => d.DRIVER_ID).join(",") || "none"}`);
  console.log(`Final available drivers: ${drivers.map((d) => d.DRIVER_ID).join(",") || "none"}`);
  return drivers;
}

logger.info("Matching service started");
console.log("Matching service started");

module.exports = { matchingQueue };