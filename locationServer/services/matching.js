// const Queue = require("bull");
// const h3 = require("h3-js");
// const { redisClient } = require("../config/redis");
// const { logger } = require("../config/logger");
// const { calculateETA } = require("./eta");

// const matchingQueue = new Queue("match-rides", {
//   redis: { host: "localhost", port: 6379 },
// });

// // Haversine distance function
// function haversineDistance(lat1, lon1, lat2, lon2) {
//   const R = 6371; // Earth's radius in km
//   const dLat = (lat2 - lat1) * Math.PI / 180;
//   const dLon = (lon2 - lon1) * Math.PI / 180;
//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
//     Math.sin(dLon / 2) * Math.sin(dLon / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c; // Distance in km
// }

// matchingQueue.process(async (job) => {
//   try {
//     const request = job.data;
//     console.log("Processing request:", request);
//     const { requestId, riderId, lat, long, rideType, city } = request;
//     const cityLower = city.toLowerCase();
//     logger.info("Processing ride request", { requestId, riderId, cityLower });

//     // Get H3 cell and nearby cells
//     const riderCell = h3.latLngToCell(lat, long, 8);
//     console.log("H3 cell:", riderCell);
//     const cells = h3.gridDisk(riderCell, 2);
//     console.log("Grid disk cells:", cells);

//     // Collect driver IDs
//     const driverIds = new Set();
//     for (const cell of cells) {
//       const ids = await redisClient.sMembers(`captains:${cityLower}:${cell}`);
//       console.log("Drivers in cell", { cell, ids });
//       ids.forEach((id) => driverIds.add(id));
//     }
//     console.log("Driver IDs collected:", driverIds);
//     logger.info("Driver IDs collected", { driverCount: driverIds.size });

//     if (!driverIds.size) {
//       logger.warn("No drivers available", { requestId });
//       return;
//     }

//     // Filter eligible drivers
//     const now = Date.now();
//     const DISTANCE_THRESHOLD = 3; // km
//     const drivers = [];
//     for (const DRIVER_ID of driverIds) {
//       const details = await redisClient.hGetAll(`captains:${cityLower}:${DRIVER_ID}`);
//       console.log("Driver details:", { DRIVER_ID, details });
//       if (
//         details.isAvailable === "true" &&
//         details.status === "active" &&
//         parseInt(details.lastUpdated || 0) >= now - 300000 // 5 min
//       ) {
//         const pos = await redisClient.geoPos(`captains:${cityLower}`, DRIVER_ID);
//         if (pos && pos[0]) {
//           const distance = haversineDistance(lat, long, pos[0].latitude, pos[0].longitude);
//           if (distance <= DISTANCE_THRESHOLD) {
//             drivers.push({
//               DRIVER_ID,
//               lat: pos[0].latitude,
//               long: pos[0].longitude,
//               distance,
//               rideTypeSupported: JSON.parse(details.rideTypeSupported || "[]"),
//               rating: parseFloat(details.rating || "1"),
//             });
//           }
//         }
//       }
//     }
//     console.log("Filtered drivers within 3 km:", drivers);
//     logger.info("Drivers filtered by proximity", { driverCount: drivers.length });

//     if (!drivers.length) {
//       logger.warn("No eligible drivers within distance threshold", { requestId });
//       // Fallback: Consider all drivers without distance filter
//       for (const DRIVER_ID of driverIds) {
//         const details = await redisClient.hGetAll(`captains:${cityLower}:${DRIVER_ID}`);
//         if (
//           details.isAvailable === "true" &&
//           details.status === "active" &&
//           parseInt(details.lastUpdated || 0) >= now - 300000
//         ) {
//           const pos = await redisClient.geoPos(`captains:${cityLower}`, DRIVER_ID);
//           if (pos && pos[0]) {
//             drivers.push({
//               DRIVER_ID,
//               lat: pos[0].latitude,
//               long: pos[0].longitude,
//               distance: haversineDistance(lat, long, pos[0].latitude, pos[0].longitude),
//               rideTypeSupported: JSON.parse(details.rideTypeSupported || "[]"),
//               rating: parseFloat(details.rating || "1"),
//             });
//           }
//         }
//       }
//       logger.info("Fallback: All eligible drivers", { driverCount: drivers.length });
//     }

//     if (!drivers.length) {
//       logger.warn("No eligible drivers after fallback", { requestId });
//       return;
//     }

//     // Find best match based on rating and ETA
//     let bestMatch = null;
//     let highestRating = -1;
//     let minEta = Infinity;
//     for (const driver of drivers) {
//       if (!driver.rideTypeSupported.includes(rideType)) {
//         console.log("Ride type mismatch:", { DRIVER_ID: driver.DRIVER_ID, rideType });
//         continue;
//       }

//       const eta = await calculateETA(
//         redisClient,
//         cityLower,
//         riderId,
//         driver.DRIVER_ID,
//         driver.lat,
//         driver.long,
//         lat,
//         long
//       );
//       console.log("ETA:", { DRIVER_ID: driver.DRIVER_ID, eta, rating: driver.rating, distance: driver.distance });

//       if (eta !== null && eta <= 15) {
//         if (driver.rating > highestRating || (driver.rating === highestRating && eta < minEta)) {
//           highestRating = driver.rating;
//           minEta = eta;
//           bestMatch = {
//             requestId,
//             riderId,
//             DRIVER_ID: driver.DRIVER_ID,
//             eta,
//             driverLat: driver.lat,
//             driverLong: driver.long,
//             rating: driver.rating,
//             distance: driver.distance,
//           };
//         }
//       }
//     }

//     if (!bestMatch) {
//       console.log("No valid match found for request:", requestId);
//       logger.warn("No valid match found", { requestId });
//       return;
//     }

//     console.log("Best match:", bestMatch);
//     logger.info("Best match selected", {
//       requestId,
//       DRIVER_ID: bestMatch.DRIVER_ID,
//       rating: bestMatch.rating,
//       eta: bestMatch.eta,
//       distance: bestMatch.distance
//     });

//     // Store match and update driver
//     await redisClient.setEx(`match:${requestId}`, 300, JSON.stringify(bestMatch));
//     await redisClient.hSet(`captains:${cityLower}:${bestMatch.DRIVER_ID}`, "isAvailable", "false");
//     logger.info("Match stored", { requestId, DRIVER_ID: bestMatch.DRIVER_ID });
//   } catch (err) {
//     console.log("Matching error:", err);
//     logger.error("Matching Error", { error: err.message, stack: err.stack });
//   }
// });

// logger.info("Matching service started");

// module.exports = { matchingQueue };

const Queue = require("bull");
const h3 = require("h3-js");
const { redisClient } = require("../config/redis");
const { logger } = require("../config/logger");
const { calculateETA } = require("./eta");
const { Munkres } = require('munkres-js');

const matchingQueue = new Queue("match-rides", {
  redis: { host: "localhost", port: 6379 },
});

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

  // Build cost matrix
  const costMatrix = [];
  for (const req of requests) {
    const row = [];
    for (const driver of drivers) {
      if (!driver.rideTypeSupported.includes(req.rideType)) {
        row.push(Infinity);
        logger.info("Ride type mismatch", { riderId: req.riderId, DRIVER_ID: driver.DRIVER_ID });
        continue;
      }
      const eta = await calculateETA(
        redisClient, cityLower, req.riderId, driver.DRIVER_ID,
        driver.lat, driver.long, req.lat, req.long
      );
      row.push(eta !== null && eta <= 15 ? eta : Infinity);
      logger.info("ETA calculated for matrix", {
        riderId: req.riderId,
        DRIVER_ID: driver.DRIVER_ID,
        eta
      });
    }
    costMatrix.push(row);
  }
  console.log(costMatrix);
  // Pad matrix if drivers > requests
  while (costMatrix.length < drivers.length) {
    costMatrix.push(new Array(drivers.length).fill(Infinity));
  }

  logger.info("Cost matrix", { costMatrix });

  try {
    // Run Hungarian algorithm
    const munkres = new Munkres();
    const assignments = munkres.compute(costMatrix);
    logger.info("Assignments", { assignments });

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
      const eta = costMatrix[riderIdx][driverIdx];
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
      await redisClient.setEx(`match:${req.requestId}`, 300, JSON.stringify(bestMatch));
      await redisClient.hSet(`captains:${cityLower}:${driver.DRIVER_ID}`, "isAvailable", "false");
      logger.info("Best match selected", {
        requestId: req.requestId,
        riderId: req.riderId,
        DRIVER_ID: bestMatch.DRIVER_ID,
        eta: bestMatch.eta,
        distance: bestMatch.distance
      });
    }
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
    const nearbyCells = h3.gridDisk(riderCell, 2);
    nearbyCells.forEach(cell => cells.add(cell));
  }

  for (const cell of cells) {
    const ids = await redisClient.sMembers(`captains:${cityLower}:${cell}`);
    ids.forEach(id => driverIds.add(id));
  }

  const drivers = [];
  const now = Date.now();
  const DISTANCE_THRESHOLD = 10; // Increased to include DRV2
  for (const DRIVER_ID of driverIds) {
    const details = await redisClient.hGetAll(`captains:${cityLower}:${DRIVER_ID}`);
    if (
      details.isAvailable === "true" &&
      details.status === "active" &&
      parseInt(details.lastUpdated || 0) >= now - 300000
    ) {
      const pos = await redisClient.geoPos(`captains:${cityLower}`, DRIVER_ID);
      if (pos && pos[0]) {
        const isWithinThreshold = requests.some(req =>
          haversineDistance(req.lat, req.long, pos[0].latitude, pos[0].longitude) <= DISTANCE_THRESHOLD
        );
        if (isWithinThreshold) {
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
  }
  return drivers;
}

logger.info("Matching service started");

module.exports = { matchingQueue };