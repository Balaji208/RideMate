const Queue = require("bull");
const h3 = require("h3-js");
const { redisClient } = require("../config/redis");
const { logger } = require("../config/logger");
const { calculateETA } = require("./eta");
const { Munkres } = require('munkres-js');

const matchingQueue = new Queue("match-rides", {
  redis: { host: "localhost", port: 6379 },
});
const h3Index = '89283082803ffff'; // Example H3 index
const resolution = h3.getResolution(h3Index);

// //console.log(resolution);
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function generatePermutations(requests, drivers) {
  const permutations = [];
  const usedDrivers = new Set();

  function permute(riderIdx, current) {
    if (riderIdx === requests.length) {
      permutations.push([...current]);
      return;
    }
    for (let driverIdx = 0; driverIdx < drivers.length; driverIdx++) {
      if (!usedDrivers.has(driverIdx)) {
        usedDrivers.add(driverIdx);
        current.push([riderIdx, driverIdx]);
        permute(riderIdx + 1, current);
        current.pop();
        usedDrivers.delete(driverIdx);
      }
    }
  }

  permute(0, []);
  return permutations;
}

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
      requestCount: requests.length
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
  const drivers = await getAvailableDrivers(cityLower, requests);
  if (!drivers.length) {
    for (const req of requests) {
      logger.warn("No drivers available", { requestId: req.requestId });
      await redisClient.setEx(`match:${req.requestId}`, 300, JSON.stringify({ status: "no_match" }));
    }
    return;
  }

  logger.info("Available drivers", { driverIds: drivers.map(d => d.DRIVER_ID) });

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
        driver.lat, driver.long, req.lat, req.long
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
        cost
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

  if (drivers.length >= requests.length) {
    const permutations = generatePermutations(requests, drivers);
    //console.log(`All possible driver-rider assignments for batch (requests: ${requests.length}, drivers: ${drivers.length}):`);
    for (const perm of permutations) {
      let totalETA = 0;
      let valid = true;
      const assignmentDetails = [];
      for (const [riderIdx, driverIdx] of perm) {
        const eta = etaMatrix[riderIdx][driverIdx];
        if (eta === Infinity) {
          valid = false;
          break;
        }
        totalETA += eta;
        assignmentDetails.push({
          riderId: requests[riderIdx].riderId,
          driverId: drivers[driverIdx].DRIVER_ID,
          eta,
          rating: drivers[driverIdx].rating
        });
      }
      if (valid) {
        console.log(`Assignment: ${JSON.stringify(assignmentDetails, null, 2)}, Total ETA: ${totalETA} minutes`);
      }
    }
  } else {
    console.log("Not enough drivers for all requests, skipping permutation calculation.");
  }

  try {
    const munkres = new Munkres();
    const assignments = munkres.compute(costMatrix);
    logger.info("Assignments", { assignments });

    let totalBestETA = 0;
    const bestMatches = [];
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
      const eta = await calculateETA(
        redisClient, cityLower, req.riderId, driver.DRIVER_ID,
        driver.lat, driver.long, req.lat, req.long
      );
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
          distance: haversineDistance(req.lat, req.long, driver.lat, driver.long),
        };
        bestMatches.push(bestMatch);
        await redisClient.setEx(`match:${req.requestId}`, 300, JSON.stringify(bestMatch));
        await redisClient.hSet(`captains:${cityLower}:${driver.DRIVER_ID}`, "isAvailable", "false");
        logger.info("Best match selected", {
          requestId: req.requestId,
          riderId: req.riderId,
          DRIVER_ID: bestMatch.DRIVER_ID,
          eta: bestMatch.eta,
          rating: bestMatch.rating,
          distance: bestMatch.distance
        });
      } else {
        logger.warn("Invalid ETA for best match", { riderId: req.riderId, DRIVER_ID: driver.DRIVER_ID, eta });
        await redisClient.setEx(`match:${req.requestId}`, 300, JSON.stringify({ status: "no_match" }));
      }
    }

    //console.log(`Best Matches for Batch (requestCount: ${requests.length}):`);
    console.log(JSON.stringify(bestMatches, null, 2));
    console.log(`Total ETA for Best Matches: ${totalBestETA} minutes`);

  } catch (err) {
    logger.error("Hungarian algorithm error", { error: err.message, stack: err.stack });
    for (const req of requests) {
      await redisClient.setEx(`match:${req.requestId}`, 300, JSON.stringify({ status: "no_match" }));
    }
  }
}

async function getAvailableDrivers(cityLower, requests) {
  const driverIds = new Set();
  const cells = new Set();
  for (const req of requests) {
    const riderCell = h3.latLngToCell(req.lat, req.long, 8);
    const nearbyCells = h3.gridDisk(riderCell, 10);
    nearbyCells.forEach(cell => cells.add(cell));
    //console.log(`Rider ${req.riderId} cell: ${riderCell}, nearby cells: ${[...nearbyCells].join(",")}`);
  }
  //console.log(`Total H3 cells searched: ${[...cells].join(",")}`);

  for (const cell of cells) {
    const ids = await redisClient.sMembers(`captains:${cityLower}:${cell}`);
    //console.log(`Drivers in cell ${cell}: ${ids.join(",")}`);
    ids.forEach(id => driverIds.add(id));
  }
  //console.log(`Unique driver IDs found: ${[...driverIds].join(",")}`);

  const drivers = [];
  const now = Date.now();
  const DISTANCE_THRESHOLD = 20;
  for (const DRIVER_ID of driverIds) {
    const details = await redisClient.hGetAll(`captains:${cityLower}:${DRIVER_ID}`);
    //console.log(`Driver ${DRIVER_ID} details:`, details);
    if (
      details.isAvailable === "true" &&
      details.status === "active" &&
      parseInt(details.lastUpdated || 0) >= now - 300000
    ) {
      const pos = await redisClient.geoPos(`captains:${cityLower}`, DRIVER_ID);
      //console.log(`Driver ${DRIVER_ID} position:`, pos);
      if (pos && pos[0]) {
        const isWithinThreshold = requests.some(req =>
          haversineDistance(req.lat, req.long, pos[0].latitude, pos[0].longitude) <= DISTANCE_THRESHOLD
        );
        //console.log(`Driver ${DRIVER_ID} within threshold: ${isWithinThreshold}`);
        if (isWithinThreshold) {
          drivers.push({
            DRIVER_ID,
            lat: pos[0].latitude,
            long: pos[0].longitude,
            rideTypeSupported: JSON.parse(details.rideTypeSupported || "[]"),
            rating: parseFloat(details.rating || 1),
          });
        }
      }
    }
  }
  //console.log(`Final available drivers: ${drivers.map(d => d.DRIVER_ID).join(",")}`);
  return drivers;
}

logger.info("Matching service started");

module.exports = { matchingQueue };