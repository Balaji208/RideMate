// Importing required dependencies
const Queue = require('bull');
const h3 = require('h3-js');
const axios = require('axios');
const { redisClient } = require('../config/redis');
const { logger } = require('../config/logger');
const { calculateETA } = require('../services/eta');
const { Munkres } = require('munkres-js');
const { validateCoordinates } = require('../utils/validation');
const { sendNotification } = require('./notify');
const { haversineDistance } = require('../utils/geoUtils');

// Initialize Bull queue for ride matching
const matchingQueue = new Queue('match-rides', {
  redis: { host: 'localhost', port: 6379 },
});

// Cache for reverse geocoding results
const locationCache = {};

/**
 * Converts latitude and longitude to a human-readable location name using Nominatim API
 * @param {number} lat - Latitude coordinate
 * @param {number} long - Longitude coordinate
 * @returns {Promise<string>} - Human-readable location name or fallback coordinates
 */
async function reverseGeocode(lat, long) {
  const cacheKey = `${lat},${long}`;
  if (locationCache[cacheKey]) {
    return locationCache[cacheKey];
  }

  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        lat,
        lon: long,
        format: 'json',
        zoom: 16, // Street-level detail
      },
      headers: {
        'User-Agent': 'RideMate/1.0 (server@localhost)',
      },
    });
    const placeName = response.data.display_name || `Unknown location (${lat}, ${long})`;
    locationCache[cacheKey] = placeName;
    return placeName;
  } catch (err) {
    logger.error(`Reverse geocoding failed for (${lat}, ${long})`, { error: err.message });
    return `Unknown location (${lat}, ${long})`;
  }
}

// Utility to convert degrees to radians
Math.toRadians = (degrees) => degrees * (Math.PI / 180);

/**
 * Awaits driver response for a ride request via Redis Pub/Sub
 * @param {string} driverId - Unique driver identifier
 * @param {string} requestId - Unique request identifier
 * @returns {Promise<boolean>} - True if driver accepts, false otherwise
 */
async function awaitDriverResponse(driverId, requestId) {
  const channel = `responses:${driverId}`;
  let redisSub = null;

  try {
    redisSub = redisClient.duplicate();
    await redisSub.connect();

    return await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        logger.warn(`Driver response timeout for ${driverId}`, { requestId });
        resolve(false);
      }, 5000);

      redisSub.subscribe(channel, (message) => {
        try {
          const response = JSON.parse(message);
          if (response.requestId === requestId) {
            clearTimeout(timeout);
            logger.info(`Driver ${driverId} ${response.accepted ? 'accepted' : 'rejected'} request`, { requestId });
            resolve(response.accepted === true);
          }
        } catch (err) {
          logger.error('Error parsing driver response', { driverId, requestId, error: err.message });
        }
      }, true);
    });
  } catch (err) {
    logger.error('Subscription failed', { driverId, requestId, error: err.message });
    return false;
  } finally {
    if (redisSub && redisSub.isOpen) {
      try {
        await redisSub.quit();
      } catch (err) {
        logger.error('Failed to quit subscription', { driverId, requestId, error: err.message });
      }
    }
  }
}

/**
 * Processes ride requests from the Bull queue, batching up to 2 requests
 * @param {Object} job - Bull queue job containing request data
 */
matchingQueue.process(async (job) => {
  try {
    // Collecting requests for batch processing
    const requests = [job.data];
    let attempts = 0;
    const maxAttempts = 20;
    while (attempts < maxAttempts) {
      const waitingJobs = await matchingQueue.getWaiting();
      const delayedJobs = await matchingQueue.getDelayed();
      const activeJobs = await matchingQueue.getActive();
      const allJobs = [...waitingJobs, ...delayedJobs, ...activeJobs];
      for (const waitJob of allJobs) {
        if (!requests.some((r) => r.requestId === waitJob.data.requestId)) {
          requests.push(waitJob.data);
        }
      }
      if (requests.length >= 2) break;
      await new Promise((resolve) => setTimeout(resolve, 500));
      attempts++;
    }
    logger.info('Processing ride request batch', {
      requestIds: requests.map((r) => r.requestId),
      requestCount: requests.length,
    });

    await processBatch(requests);

    // Trigger next batch if jobs remain
    const waitingCount = await matchingQueue.getWaitingCount();
    const delayedCount = await matchingQueue.getDelayedCount();
    const activeCount = await matchingQueue.getActiveCount();
    if (waitingCount > 0 || delayedCount > 0 || activeCount > 0) {
      await matchingQueue.add({ dummy: true }, { priority: 10 });
    }
  } catch (err) {
    logger.error('Batch processing error', { error: err.message });
  }
});

/**
 * Processes a batch of ride requests, matching them to drivers
 * @param {Array<Object>} requests - Array of ride request objects
 */
async function processBatch(requests) {
  if (!requests.length) {
    logger.warn('No requests to process');
    return;
  }
  const cityLower = requests[0].city.toLowerCase();
  const MAX_REJECTIONS = 4;
  const MAX_RADIUS = 10;
  let gridDiskRadius = 2;

  // Iterating through increasing search radii
  while (gridDiskRadius <= MAX_RADIUS) {
    const drivers = await getAvailableDrivers(cityLower, requests, gridDiskRadius);
    logger.info('Found available drivers', {
      gridDiskRadius,
      driverIds: drivers.map((d) => d.DRIVER_ID),
    });

    if (!drivers.length) {
      logger.warn('No drivers found, increasing search radius', { gridDiskRadius });
      gridDiskRadius++;
      continue;
    }

    // Building cost and ETA matrices for matching
    const costMatrix = [];
    const etaMatrix = [];
    for (const req of requests) {
      const costRow = [];
      const etaRow = [];
      const riderLocation = await reverseGeocode(req.lat, req.long);
      for (const driver of drivers) {
        if (!driver.rideTypeSupported.includes(req.rideType) || driver.mode !== req.mode) {
          costRow.push(Infinity);
          etaRow.push(Infinity);
          continue;
        }
        const driverLocation = await reverseGeocode(driver.lat, driver.long);
        const eta = await calculateETA(redisClient, cityLower, req.riderId, driver.DRIVER_ID, [
          { lat: driver.lat, long: driver.long },
          { lat: req.lat, long: req.long },
        ]);
        etaRow.push(eta !== null && eta <= 15 ? eta : Infinity);
        if (eta === null || eta > 15) {
          costRow.push(Infinity);
          logger.warn('Invalid ETA for driver', {
            riderId: req.riderId,
            riderLocation,
            driverId: driver.DRIVER_ID,
            driverLocation,
            eta,
          });
          continue;
        }
        const ratingPenalty = (5 - driver.rating) * 0.01;
        const cost = eta + ratingPenalty;
        costRow.push(cost);
        logger.info('Calculated cost for match', {
          riderId: req.riderId,
          riderLocation,
          driverId: driver.DRIVER_ID,
          driverLocation,
          eta,
          rating: driver.rating,
          cost,
        });
      }
      costMatrix.push(costRow);
      etaMatrix.push(etaRow);
    }

    // Padding matrices if needed
    while (costMatrix.length < drivers.length) {
      costMatrix.push(new Array(drivers.length).fill(1e9));
      etaMatrix.push(new Array(drivers.length).fill(1e9));
    }

    logger.info('Generated matrices', { costMatrix, etaMatrix });

    try {
      // Running Hungarian algorithm for optimal matching
      const filteredCostMatrix = costMatrix.filter((row) => row.some((value) => isFinite(value)));
      const munkres = new Munkres();
      const assignments = munkres.compute(filteredCostMatrix);
      logger.info('Computed assignments', { assignments });

      let totalBestETA = 0;
      const bestMatches = [];
      const remainingRequests = [...requests];
      let availableDrivers = [...drivers];

      // Processing driver assignments
      for (const [riderIdx, driverIdx] of assignments) {
        if (riderIdx >= requests.length || costMatrix[riderIdx][driverIdx] === Infinity) {
          const req = requests[riderIdx];
          if (req) {
            const riderLocation = await reverseGeocode(req.lat, req.long);
            logger.warn('No valid match for request', { requestId: req.requestId, riderLocation });
            await redisClient.setEx(`match:${req.requestId}`, 300, JSON.stringify({ status: 'no_match' }));
          }
          continue;
        }

        const req = requests[riderIdx];
        const driver = drivers[driverIdx];
        const riderLocation = await reverseGeocode(req.lat, req.long);
        const driverLocation = await reverseGeocode(driver.lat, driver.long);
        if (!driver.DRIVER_ID) {
          logger.error('Invalid driver ID', { requestId: req.requestId, riderId: req.riderId, riderLocation });
          continue;
        }
        const rejectionsKey = `match:${req.requestId}:rejections`;
        let rejections = parseInt((await redisClient.get(rejectionsKey)) || '0');

        const eta = await calculateETA(redisClient, cityLower, req.riderId, driver.DRIVER_ID, [
          { lat: driver.lat, long: driver.long },
          { lat: req.lat, long: req.long },
        ]);

        const distance = haversineDistance(parseFloat(req.lat), parseFloat(req.long), driver.lat, driver.long);

        await sendNotification({
          driverId: driver.DRIVER_ID,
          requestId: req.requestId,
          riderId: req.riderId,
          distance: distance,
          eta: eta,
          message: `New ride request from ${req.riderId} at ${riderLocation}`,
        });

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
              distance,
            };
            bestMatches.push(bestMatch);
            await redisClient.setEx(`match:${req.requestId}`, 300, JSON.stringify(bestMatch));
            await redisClient.hSet(`captains:${cityLower}:${driver.DRIVER_ID}`, 'isAvailable', 'false');
            await redisClient.del(rejectionsKey);
            logger.info('Matched rider to driver', {
              requestId: req.requestId,
              riderId: req.riderId,
              riderLocation,
              driverId: driver.DRIVER_ID,
              driverLocation,
              eta,
              distance: distance.toFixed(3),
            });
            remainingRequests.splice(remainingRequests.indexOf(req), 1);
            availableDrivers = availableDrivers.filter((d) => d.DRIVER_ID !== driver.DRIVER_ID);
          } else {
            logger.warn('Invalid ETA after driver acceptance', {
              riderId: req.riderId,
              riderLocation,
              driverId: driver.DRIVER_ID,
              driverLocation,
              eta,
            });
            rejections++;
            await redisClient.setEx(rejectionsKey, 300, rejections.toString());
          }
        } else {
          logger.info('Driver rejected ride request', {
            riderId: req.riderId,
            riderLocation,
            driverId: driver.DRIVER_ID,
            driverLocation,
          });
          rejections++;
          await redisClient.setEx(rejectionsKey, 300, rejections.toString());
          availableDrivers = availableDrivers.filter((d) => d.DRIVER_ID !== driver.DRIVER_ID);
        }

        if (rejections >= MAX_REJECTIONS) {
          logger.warn('Max rejections reached for request', {
            requestId: req.requestId,
            riderLocation,
            rejections,
          });
          await redisClient.del(rejectionsKey);
          gridDiskRadius++;
          break;
        }
      }

      if (bestMatches.length === requests.length) {
        const matchSummary = await Promise.all(
          bestMatches.map(async (match) => ({
            requestId: match.requestId,
            riderId: match.riderId,
            riderLocation: await reverseGeocode(match.riderLat || match.lat, match.riderLong || match.long),
            driverId: match.DRIVER_ID,
            driverLocation: await reverseGeocode(match.driverLat, match.driverLong),
            eta: match.eta,
            distance: match.distance.toFixed(3),
          }))
        );
        logger.info('All requests successfully matched', {
          requestCount: requests.length,
          matches: matchSummary,
          totalETA: totalBestETA,
        });
        return;
      }

      if (remainingRequests.length > 0 && gridDiskRadius < MAX_RADIUS) {
        logger.info('Retrying unmatched requests with increased radius', {
          remainingRequestIds: remainingRequests.map((r) => r.requestId),
          newRadius: gridDiskRadius,
        });
        requests.splice(0, requests.length, ...remainingRequests);
        continue;
      }

      for (const req of remainingRequests) {
        const riderLocation = await reverseGeocode(req.lat, req.long);
        logger.warn('No match found after max radius', { requestId: req.requestId, riderLocation });
        await redisClient.setEx(`match:${req.requestId}`, 300, JSON.stringify({ status: 'no_match' }));
      }

      if (bestMatches.length > 0) {
        const matchSummary = await Promise.all(
          bestMatches.map(async (match) => ({
            requestId: match.requestId,
            riderId: match.riderId,
            riderLocation: await reverseGeocode(match.riderLat || match.lat, match.riderLong || match.long),
            driverId: match.DRIVER_ID,
            driverLocation: await reverseGeocode(match.driverLat, match.driverLong),
            eta: match.eta,
            distance: match.distance.toFixed(3),
          }))
        );
        logger.info('Partial matches found', {
          requestCount: bestMatches.length,
          matches: matchSummary,
          totalETA: totalBestETA,
        });
      }
      return;
    } catch (err) {
      logger.error('Hungarian algorithm error', { error: err.message });
      gridDiskRadius++;
      if (gridDiskRadius > MAX_RADIUS) {
        for (const req of requests) {
          const riderLocation = await reverseGeocode(req.lat, req.long);
          logger.warn('No match found after exhausting radii', { requestId: req.requestId, riderLocation });
          await redisClient.setEx(`match:${req.requestId}`, 300, JSON.stringify({ status: 'no_match' }));
        }
        return;
      }
    }
  }

  // Handling requests that couldn't be matched
  for (const req of requests) {
    const riderLocation = await reverseGeocode(req.lat, req.long);
    logger.warn('No match found after exhausting radii', { requestId: req.requestId, riderLocation });
    await redisClient.setEx(`match:${req.requestId}`, 300, JSON.stringify({ status: 'no_match' }));
  }
}

/**
 * Retrieves available drivers within a given radius for the specified city
 * @param {string} cityLower - Lowercase city name
 * @param {Array<Object>} requests - Array of ride request objects
 * @param {number} gridDiskRadius - H3 grid search radius
 * @returns {Promise<Array<Object>>} - Array of available driver objects
 */
async function getAvailableDrivers(cityLower, requests, gridDiskRadius) {
  const driverIds = new Set();
  const cells = new Set();
  // Collecting H3 cells for rider locations
  for (const req of requests) {
    const riderCell = h3.latLngToCell(parseFloat(req.lat), parseFloat(req.long), 8);
    const nearbyCells = h3.gridDisk(riderCell, gridDiskRadius);
    nearbyCells.forEach((cell) => {
      const [lat, long] = h3.cellToLatLng(cell);
      if (validateCoordinates(cityLower, lat, long)) {
        cells.add(cell);
      }
    });
    const riderLocation = await reverseGeocode(req.lat, req.long);
    logger.info('Processed rider location', {
      riderId: req.riderId,
      riderLocation,
      h3Cell: riderCell,
      nearbyCells: [...nearbyCells],
    });
  }
  logger.info('Searched H3 cells', { cells: [...cells] });

  // Fetching driver IDs from H3 cells
  for (const cell of cells) {
    const ids = await redisClient.sMembers(`captains:${cityLower}:${cell}`);
    logger.info('Drivers in H3 cell', { cell, driverIds: ids });
    ids.forEach((id) => driverIds.add(id));
  }
  logger.info('Found unique drivers', { driverIds: [...driverIds] });

  // Filtering available drivers within distance threshold
  const drivers = [];
  const now = Date.now();
  const DISTANCE_THRESHOLD = 20;
  for (const DRIVER_ID of driverIds) {
    const details = await redisClient.hGetAll(`captains:${cityLower}:${DRIVER_ID}`);
    logger.info('Retrieved driver details', { driverId: DRIVER_ID, details });
    if (
      details.isAvailable === 'true' &&
      details.status === 'active' &&
      parseInt(details.lastUpdated || 0) >= now - 300000
    ) {
      const pos = await redisClient.geoPos(`captains:${cityLower}`, DRIVER_ID);
      logger.info('Retrieved driver position', { driverId: DRIVER_ID, position: pos });
      if (pos && pos[0]) {
        const isWithinThreshold = requests.some((req) =>
          haversineDistance(
            parseFloat(req.lat),
            parseFloat(req.long),
            parseFloat(pos[0].latitude),
            parseFloat(pos[0].longitude)
          ) <= DISTANCE_THRESHOLD
        );
        logger.info('Checked driver distance threshold', { driverId: DRIVER_ID, isWithinThreshold });
        if (isWithinThreshold) {
          const driverLocation = await reverseGeocode(parseFloat(pos[0].latitude), parseFloat(pos[0].longitude));
          drivers.push({
            DRIVER_ID,
            lat: parseFloat(pos[0].latitude),
            long: parseFloat(pos[0].longitude),
            rideTypeSupported: JSON.parse(details.rideTypeSupported || '[]'),
            mode: details.mode,
            rating: parseFloat(details.rating || 1),
            location: driverLocation,
          });
        }
      }
    }
  }
  logger.info('Final available drivers', { driverIds: drivers.map((d) => d.DRIVER_ID) });
  return drivers;
}

// Initialize matching service
logger.info('Matching service started');

module.exports = { matchingQueue };