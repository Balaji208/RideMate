const Queue = require("bull");
const h3 = require("h3-js");
const { redisClient } = require("../config/redis");
const { logger } = require("../config/logger");
const { calculateETA } = require("../services/eta");
const { Munkres } = require("munkres-js");
const { validateCoordinates } = require("../utils/validation");
const { sendNotification, awaitDriverResponse } = require("./notify");

const matchingQueue = new Queue("match-rides", {
  redis: { host: "localhost", port: 6379 },
});

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = Math.toRadians(lat2 - lat1);
  const dLon = Math.toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

Math.toRadians = degrees => degrees * (Math.PI / 180);

// Function need to verify batched matching

// function generatePermutations(requests, drivers) {
//   const permutations = [];
//   const usedDrivers = new Set();

//   function permute(riderIdx, current) {
//     if (riderIdx === requests.length) {
//       permutations.push([...current]);
//       return;
//     }
//     for (let driverIdx = 0; driverIdx < drivers.length; driverIdx++) {
//       if (!usedDrivers.has(driverIdx)) {
//         usedDrivers.add(driverIdx);
//         current.push({ riderIdx, driverIdx });
//         permute(riderIdx + 1, current);
//         current.pop();
//         usedDrivers.delete(driverIdx);
//       }
//     }
//   }

//   permute(0, []);
//   return permutations;
// }

matchingQueue.process(async (job) => {
  try {
    const requests = [job.data];
    const startTime = Date.now();
    while (Date.now() - startTime < 60000) {
      const waitingJobs = await matchingQueue.getWaiting();
      for (const waitJob of waitingJobs) {
        if (!requests.some(r => r.requestId === waitJob.data.requestId)) {
          requests.push(waitJob.data);
        }
      }
      if (requests.length >= 2) break;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    logger.info("Batch processing", {
      requestIds: requests.map(r => r.requestId),
      requestCount: requests.length,
    });

    await processBatch(requests);
  } catch (err) {
    logger.error("Batch processing error", { error: err.message, stack: err.stack });
  }
});

async function processBatch(requests) {
  if (!requests.length) {
    logger.warn("No requests to process");
    return;
  }

  const cityLower = requests[0].city.toLowerCase();
  const MAX_REJECTIONS = 4;
  const MAX_RADIUS = 10;
  let gridDiskRadius = 2;

  while (gridDiskRadius <= MAX_RADIUS) {
    const drivers = await getAvailableDrivers(cityLower, requests, gridDiskRadius);
    logger.info("Available drivers", {
      gridDiskRadius,
      driverIds: drivers.map(d => d.DRIVER_ID),
    });

    if (!drivers.length) {
      logger.warn("No drivers found, increasing radius", { gridDiskRadius });
      gridDiskRadius++;
      continue;
    }

    const costMatrix = [];
    const etaMatrix = [];
    for (const req of requests) {
      const costRow = [];
      const etaRow = [];
      for (const driver of drivers) {
        if (!driver.rideTypeSupported.includes(req.rideType)) {
          costRow.push(Infinity);
          etaRow.push(Infinity);
          logger.info("Ride type mismatch", { riderId: req.riderId, DRIVER_ID: driver.DRIVER_ID });
          continue;
        }
        const eta = await calculateETA(
          redisClient, cityLower, req.riderId, driver.DRIVER_ID,
          driver.lat, driver.long, parseFloat(req.lat), parseFloat(req.long)
        );
        etaRow.push(eta !== null && eta <= 15 ? eta : Infinity);
        if (eta === null || eta > 15) {
          costRow.push(Infinity);
          logger.info("Invalid ETA", { riderId: req.riderId, DRIVER_ID: driver.DRIVER_ID, eta });
          continue;
        }
        const ratingPenalty = (5 - driver.rating) * 0.01;
        const cost = eta + ratingPenalty;
        costRow.push(cost);
        logger.info("Cost calculated for matrix", {
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
      costMatrix.push(new Array(drivers.length).fill(Infinity));
      etaMatrix.push(new Array(drivers.length).fill(Infinity));
    }

    logger.info("Cost matrix", { costMatrix });
    logger.info("ETA matrix", { etaMatrix });

    // Log all possible assignments
    // if (drivers.length >= requests.length) {
    //   const permutations = generatePermutations(requests, drivers);
    //   logger.info(`All possible driver-rider assignments for batch (requests: ${requests.length}, drivers: ${drivers.length}):`);
    //   for (const perm of permutations) {
    //     let totalETA = 0;
    //     let valid = true;
    //     const assignmentDetails = [];
    //     for (const { riderIdx, driverIdx } of perm) {
    //       const eta = etaMatrix[riderIdx][driverIdx];
    //       if (eta === Infinity) {
    //         valid = false;
    //         break;
    //       }
    //       totalETA += eta;
    //       assignmentDetails.push({
    //         riderId: requests[riderIdx].riderId,
    //         driverId: drivers[driverIdx].DRIVER_ID,
    //         eta,
    //         rating: drivers[driverIdx].rating,
    //       });
    //     }
    //     if (valid) {
    //       logger.info(`Assignment: ${JSON.stringify(assignmentDetails)}, Total ETA: ${totalETA} minutes`);
    //     }
    //   }
    // } else {
    //   logger.info("Not enough drivers for all requests, skipping permutation calculation.");
    // }

    try {
      const munkres = new Munkres();
      const assignments = munkres.compute(costMatrix);
      logger.info("Assignments", { assignments });

      let totalBestETA = 0;
      const bestMatches = [];
      const remainingRequests = [...requests];
      let availableDrivers = [...drivers];

      for (const [riderIdx, driverIdx] of assignments) {
        if (riderIdx >= requests.length || costMatrix[riderIdx][driverIdx] === Infinity) {
          const req = requests[riderIdx];
          if (req) {
            logger.warn("No valid match for request", { requestId: req.requestId });
            await redisClient.setEx(`match:${req.requestId}`, 300, JSON.stringify({ status: "no_match" }));
          }
          continue;
        }

        const req = requests[riderIdx];
        const driver = drivers[driverIdx];
        const rejectionsKey = `match:${req.requestId}:rejections`;
        let rejections = parseInt(await redisClient.get(rejectionsKey) || "0");
        const eta = await calculateETA(
            redisClient, cityLower, req.riderId, driver.DRIVER_ID,
            driver.lat, driver.long, parseFloat(req.lat), parseFloat(req.long)
          );
        // Send notification to driver
        const distance = haversineDistance(parseFloat(req.lat), parseFloat(req.long), driver.lat, driver.long);
        await sendNotification(
          driver.DRIVER_ID,
          req.requestId,
          req.riderId,
          distance,
          eta,
          `New ride request from ${req.riderId} at (${req.lat}, ${req.long})`
        );

        const accepted = await awaitDriverResponse(driver.DRIVER_ID, req.requestId);
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
              distance: distance,
            };
            bestMatches.push(bestMatch);
            await redisClient.setEx(`match:${req.requestId}`, 300, JSON.stringify(bestMatch));
            await redisClient.hSet(`captains:${cityLower}:${driver.DRIVER_ID}`, "isAvailable", "false");
            await redisClient.del(rejectionsKey);
            logger.info("Best match selected", {
              requestId: req.requestId,
              riderId: req.riderId,
              DRIVER_ID: bestMatch.DRIVER_ID,
              eta: bestMatch.eta,
              rating: bestMatch.rating,
              distance: bestMatch.distance,
            });
            remainingRequests.splice(remainingRequests.indexOf(req), 1);
            availableDrivers = availableDrivers.filter(d => d.DRIVER_ID !== driver.DRIVER_ID);
          } else {
            logger.warn("Invalid ETA after acceptance", { riderId: req.riderId, DRIVER_ID: driver.DRIVER_ID, eta });
            rejections++;
            await redisClient.setEx(rejectionsKey, 300, rejections.toString());
          }
        } else {
          logger.info("Driver rejected ride", { riderId: req.riderId, DRIVER_ID: driver.DRIVER_ID });
          rejections++;
          await redisClient.setEx(rejectionsKey, 300, rejections.toString());
          availableDrivers = availableDrivers.filter(d => d.DRIVER_ID !== driver.DRIVER_ID);
        }

        if (rejections >= MAX_REJECTIONS) {
          logger.warn("Max rejections reached, increasing radius or no-match", {
            requestId: req.requestId,
            rejections,
          });
          await redisClient.del(rejectionsKey);
          gridDiskRadius++;
          break;
        }
      }

      if (bestMatches.length === requests.length) {
        logger.info("All requests matched", { requestCount: requests.length });
        logger.info(`Best Matches for Batch (requestCount: ${requests.length}):`);
        logger.info(JSON.stringify(bestMatches));
        logger.info(`Total ETA for Best Matches: ${totalBestETA} minutes`);
        return;
      }

      if (remainingRequests.length > 0 && gridDiskRadius < MAX_RADIUS) {
        logger.info("Retrying with remaining requests", {
          remainingRequestIds: remainingRequests.map(r => r.requestId),
          newRadius: gridDiskRadius,
        });
        requests.splice(0, requests.length, ...remainingRequests);
        continue;
      }

      // No matches after max radius
      for (const req of remainingRequests) {
        logger.warn("No match after max radius", { requestId: req.requestId });
        await redisClient.setEx(`match:${req.requestId}`, 300, JSON.stringify({ status: "no_match" }));
      }

      if (bestMatches.length > 0) {
        logger.info("Partial matches found", { requestCount: bestMatches.length });
        logger.info(`Best Matches for Batch (requestCount: ${requests.length}):`);
        logger.info(JSON.stringify(bestMatches));
        logger.info(`Total ETA for Best Matches: ${totalBestETA} minutes`);
      }
      return;

    } catch (err) {
      logger.error("Hungarian algorithm error", { error: err.message, stack: err.stack });
      gridDiskRadius++;
      if (gridDiskRadius > MAX_RADIUS) {
        for (const req of requests) {
          await redisClient.setEx(`match:${req.requestId}`, 300, JSON.stringify({ status: "no_match" }));
        }
        return;
      }
    }
  }

  // Exhausted all radii
  for (const req of requests) {
    logger.warn("No match after exhausting radii", { requestId: req.requestId });
    await redisClient.setEx(`match:${req.requestId}`, 300, JSON.stringify({ status: "no_match" }));
  }
}

async function getAvailableDrivers(cityLower, requests, gridDiskRadius) {
  const driverIds = new Set();
  const cells = new Set();
  for (const req of requests) {
    const riderCell = h3.latLngToCell(parseFloat(req.lat), parseFloat(req.long), 8);
    const nearbyCells = h3.gridDisk(riderCell, gridDiskRadius);
    nearbyCells.forEach(cell => {
      const [lat, long] = h3.cellToLatLng(cell);
      if (validateCoordinates(cityLower, lat, long)) {
        cells.add(cell);
      }
    });
    logger.info(`Rider ${req.riderId} cell: ${riderCell}, nearby cells: ${[...nearbyCells].join(",")}`);
  }
  logger.info(`Total H3 cells searched: ${[...cells].join(",")}`);

  for (const cell of cells) {
    const ids = await redisClient.sMembers(`captains:${cityLower}:${cell}`);
    logger.info(`Drivers in cell ${cell}: ${ids.join(",") || "none"}`);
    ids.forEach(id => driverIds.add(id));
  }
  logger.info(`Unique driver IDs found: ${[...driverIds].join(",") || "none"}`);

  const drivers = [];
  const now = Date.now();
  const DISTANCE_THRESHOLD = 20; // km
  for (const DRIVER_ID of driverIds) {
    const details = await redisClient.hGetAll(`captains:${cityLower}:${DRIVER_ID}`);
    logger.info(`Driver ${DRIVER_ID} details: ${JSON.stringify(details)}`);
    if (
      details.isAvailable === "true" &&
      details.status === "active" &&
      parseInt(details.lastUpdated || 0) >= now - 300000
    ) {
      const pos = await redisClient.geoPos(`captains:${cityLower}`, DRIVER_ID);
      logger.info(`Driver ${DRIVER_ID} position: ${JSON.stringify(pos)}`);
      if (pos && pos[0]) {
        const isWithinThreshold = requests.some(req =>
          haversineDistance(parseFloat(req.lat), parseFloat(req.long), parseFloat(pos[0].latitude), parseFloat(pos[0].longitude)) <= DISTANCE_THRESHOLD
        );
        logger.info(`Driver ${DRIVER_ID} within threshold: ${isWithinThreshold}`);
        if (isWithinThreshold) {
          drivers.push({
            DRIVER_ID,
            lat: parseFloat(pos[0].latitude),
            long: parseFloat(pos[0].longitude),
            rideTypeSupported: JSON.parse(details.rideTypeSupported || "[]"),
            rating: parseFloat(details.rating || 1),
          });
        }
      }
    }
  }
  logger.info(`Final available drivers: ${drivers.map(d => d.DRIVER_ID).join(",") || "none"}`);
  return drivers;
}

logger.info("Matching service started");

module.exports = { matchingQueue };