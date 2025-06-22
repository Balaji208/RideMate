const { redisClient } = require('../config/redis');
const { logger } = require('../config/logger');
const { CONFIG } = require('../config/poolingConfig');
const { haversineDistance, validateWaypoints } = require('../utils/geoUtils');
const { getCachedETA, setCachedETA } = require('../utils/cacheUtils');
const { calculateETA } = require('../services/eta');
const { assignDriverToGroup } = require('./captainService');
const { v4: uuidv4 } = require('uuid');

async function storeRequest(cityLower, req) {
  const reqData = {
    ...req,
    ridePooling: req.ridePooling.toString(),
    timestamp: req.timestamp.toString(),
    lat: req.lat.toString(),
    long: req.long.toString(),
    dropoffLat: req.dropoffLat.toString(),
    dropoffLong: req.dropoffLong.toString(),
  };
  try {
    await redisClient.hSet(`ride:requests:${cityLower}:${req.requestId}`, reqData);
    await redisClient.geoAdd(`ride:requests:${cityLower}`, {
      longitude: parseFloat(req.long),
      latitude: parseFloat(req.lat),
      member: req.requestId,
    });
    await redisClient.expire(`ride:requests:${cityLower}:${req.requestId}`, 300);
    console.log(`Stored request: ${req.requestId}`);
  } catch (err) {
    logger.error('Failed to store request', { requestId: req.requestId, error: err.message, stack: err.stack });
  }
}

async function processPoolingBatch(requests) {
  console.log(`Processing pooling batch: ${requests.length} requests`, requests);
  if (!requests.length) {
    console.log('No requests to pool');
    logger.warn('No requests to pool', { timestamp: Date.now() });
    return;
  }

  const cityLower = requests[0].city.toLowerCase();
  console.log(`City: ${cityLower}`);
  const poolableRequests = requests
    .filter(r => r.ridePooling && r.rideType === 'shared' && r.riderId && r.requestId)
    .sort((a, b) => a.timestamp - b.timestamp);
  const individualRequests = requests.filter(r => !r.ridePooling);

  console.log(`Poolable requests: ${poolableRequests.length}`, poolableRequests.map(r => r.requestId));
  console.log(`Individual requests: ${individualRequests.length}`, individualRequests.map(r => r.requestId));

  for (const req of individualRequests) {
    console.log(`Storing individual request: ${req.requestId}`);
    await storeRequest(cityLower, req);
  }

  const groups = [];
  const usedRequests = new Set();
  for (const req1 of poolableRequests) {
    if (usedRequests.has(req1.requestId)) continue;
    const group = [req1];
    usedRequests.add(req1.requestId);
    console.log(`Forming group for request: ${req1.requestId}`);

    for (const req2 of poolableRequests) {
      if (req1.requestId === req2.requestId || usedRequests.has(req2.requestId)) continue;

      console.log(`Checking compatibility: ${req1.requestId} with ${req2.requestId}`);
      const isGenderCompatible =
        CONFIG.GENDER_STRICT_MATCH
          ? req1.gender === 'any' || req2.gender === 'any' || req1.gender === req2.gender
          : true;

      const proximityCheck = haversineDistance(req1.lat, req1.long, req2.lat, req2.long) <= CONFIG.MAX_PROXIMITY_KM;
      const dropoffCheck =
        haversineDistance(req1.dropoffLat, req1.dropoffLong, req2.dropoffLat, req2.dropoffLong) <=
        CONFIG.MAX_PROXIMITY_KM;
      const timeCheck = Math.abs(req1.timestamp - req2.timestamp) <= CONFIG.TIME_WINDOW_MS;
      const modeCheck = req1.mode === req2.mode;
      const rideTypeCheck = req1.rideType === req2.rideType;

      console.log(`Compatibility checks:`, {
        req1: req1.requestId,
        req2: req2.requestId,
        gender: isGenderCompatible,
        proximity: proximityCheck,
        dropoff: dropoffCheck,
        time: timeCheck,
        mode: modeCheck,
        rideType: rideTypeCheck,
      });

      if (modeCheck && rideTypeCheck && isGenderCompatible && timeCheck && proximityCheck && dropoffCheck) {
        const waypoints = [
          { lat: req1.lat, long: req1.long },
          { lat: req2.lat, long: req2.long },
          { lat: req1.dropoffLat, long: req1.dropoffLong },
          { lat: req2.dropoffLat, long: req2.dropoffLong },
        ];

        if (!await validateWaypoints(waypoints)) {
          console.log(`Invalid waypoints for pooling: ${req1.requestId}, ${req2.requestId}`);
          continue;
        }

        const cacheKey = `eta:${cityLower}:pool:${waypoints.map(w => `${w.lat},${w.long}`).join('|')}`;
        console.log(`Checking ETA cache: ${cacheKey}`);
        let eta = await getCachedETA(cacheKey);
        if (eta === null) {
          console.log(`Calculating ETA for ${cacheKey}`);
          eta = await calculateETA(redisClient, cityLower, req1.riderId, 'pool', waypoints, 5000);
          await setCachedETA(cacheKey, eta);
          console.log(`ETA calculated: ${eta} minutes`);
        }

        const individualCacheKey1 = `eta:${cityLower}:individual:${req1.riderId}`;
        const individualCacheKey2 = `eta:${cityLower}:individual:${req2.riderId}`;
        let individualEta1 = await getCachedETA(individualCacheKey1);
        let individualEta2 = await getCachedETA(individualCacheKey2);

        if (individualEta1 === null) {
          const waypoints1 = [
            { lat: req1.lat, long: req1.long },
            { lat: req1.dropoffLat, long: req1.dropoffLong },
          ];
          console.log(`Calculating individual ETA for ${req1.riderId}`);
          individualEta1 = await calculateETA(redisClient, cityLower, req1.riderId, 'pool', waypoints1, 5000);
          await setCachedETA(individualCacheKey1, individualEta1);
          console.log(`Individual ETA for ${req1.riderId}: ${individualEta1} minutes`);
        }

        if (individualEta2 === null) {
          const waypoints2 = [
            { lat: req2.lat, long: req2.long },
            { lat: req2.dropoffLat, long: req2.dropoffLong },
          ];
          console.log(`Calculating individual ETA for ${req2.riderId}`);
          individualEta2 = await calculateETA(redisClient, cityLower, req2.riderId, 'pool', waypoints2, 5000);
          await setCachedETA(individualCacheKey2, individualEta2);
          console.log(`Individual ETA for ${req2.riderId}: ${individualEta2} minutes`);
        }

        console.log(`ETA comparison:`, {
          sharedEta: eta,
          individualEta1,
          individualEta2,
          detourLimit1: individualEta1 + CONFIG.MAX_DETOUR_MINUTES,
          detourLimit2: individualEta2 + CONFIG.MAX_DETOUR_MINUTES,
          req1: req1.requestId,
          req2: req2.requestId,
        });

        if (
          eta !== null &&
          individualEta1 !== null &&
          individualEta2 !== null &&
          eta <= individualEta1 + CONFIG.MAX_DETOUR_MINUTES &&
          eta <= individualEta2 + CONFIG.MAX_DETOUR_MINUTES
        ) {
          group.push(req2);
          usedRequests.add(req2.requestId);
          console.log(`Added ${req2.requestId} to group with ${req1.requestId}`);
        }
      }
      if (group.length >= CONFIG.MAX_POOL_SIZE) {
        console.log(`Max pool size reached: ${group.length}`);
        break;
      }
    }

    if (group.length > 1) {
      groups.push(group);
      console.log(`Group formed:`, group.map(r => r.requestId));
    } else {
      console.log(`No group formed for ${req1.requestId}, storing as individual`);
      await storeRequest(cityLower, req1);
    }
  }

  console.log(`Pooling groups formed: ${groups.length} groups`, groups.map(g => g.map(r => r.requestId)));

  for (const group of groups) {
    const sharedRideId = uuidv4();
    console.log(`Assigning driver for group: ${group.map(r => r.requestId).join(', ')}, Shared Ride ID: ${sharedRideId}`);
    let driver = null;
    for (let attempt = 1; attempt <= CONFIG.RETRY_ATTEMPTS; attempt++) {
      console.log(`Driver assignment attempt ${attempt} for group: ${group.map(r => r.requestId).join(', ')}`);
      driver = await assignDriverToGroup(cityLower, group);
      if (driver) {
        console.log(`Driver assigned: ${driver.DRIVER_ID}`);
        break;
      }
      console.log(`Driver assignment failed, retrying`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (driver) {
      console.log(`Driver ${driver.DRIVER_ID} assigned for shared ride: ${sharedRideId}`);
      try {
        await redisClient.sAdd(`ride:pool:${sharedRideId}`, group.map(r => r.requestId));
        for (const req of group) {
          console.log(`Processing match for request: ${req.requestId}`);
          const eta = await calculateETA(
            redisClient,
            cityLower,
            req.riderId,
            driver.DRIVER_ID,
            [
              { lat: driver.lat, long: driver.long },
              { lat: req.lat, long: req.long },
            ],
            5000
          );
          const match = {
            requestId: req.requestId,
            riderId: req.riderId,
            DRIVER_ID: driver.DRIVER_ID,
            sharedRideId,
            eta: eta.toString(),
          };
          await redisClient.setEx(`match:${req.requestId}`, 300, JSON.stringify(match));
          await redisClient.del(`ride:requests:${cityLower}:${req.requestId}`);
          await redisClient.zRem(`ride:requests:${cityLower}`, req.requestId);
          console.log(`Stored match for ${req.requestId}, deleted request`);
        }
        await redisClient.hSet(`captains:${cityLower}:${driver.DRIVER_ID}`, { isAvailable: 'false' });
        console.log(`Set driver ${driver.DRIVER_ID} as unavailable`);
      } catch (err) {
        logger.error('Failed to process driver assignment', { sharedRideId, error: err.message, stack: err.stack });
      }
    } else {
      console.log(`No driver assigned for group: ${group.map(r => r.requestId).join(', ')}`);
      for (const req of group) {
        console.log(`Storing unassigned request: ${req.requestId}`);
        await storeRequest(cityLower, req);
      }
    }
  }

  const remainingRequests = poolableRequests.filter(r => !usedRequests.has(r.requestId));
  console.log(`Remaining requests: ${remainingRequests.length}`, remainingRequests.map(r => r.requestId));
  for (const request of remainingRequests) {
    console.log(`Storing remaining request: ${request.requestId}`);
    await storeRequest(cityLower, request);
  }
}

module.exports = { processPoolingBatch };