const h3 = require('h3-js');
const { redisClient } = require('../config/redis');
const { logger } = require('../config/logger');
const { CONFIG } = require('../config/poolingConfig');
const { haversineDistance, validateWaypoints } = require('../utils/geoUtils');
const { getCachedETA, setCachedETA } = require('../utils/cacheUtils');
const { calculateETA } = require('../services/eta');

async function findPoolableRiders(request) {
  const cityLower = request.city.toLowerCase();
  console.log(`Finding poolable riders for ${request.requestId} in ${cityLower}`);
  const riderCell = h3.latLngToCell(request.lat, request.long, 8);
  const cells = h3.gridDisk(riderCell, 2);
  console.log(`H3 cells for rider search: ${cells}`);
  const pendingRequests = [];

  try {
    const nearbyMembers = await redisClient.geoSearch(
      `ride:requests:${cityLower}`,
      { latitude: request.lat, longitude: request.long },
      { radius: CONFIG.MAX_PROXIMITY_KM, unit: 'km' }
    );
    console.log(`GeoSearch results: ${nearbyMembers.length} members`, nearbyMembers);
    for (const member of nearbyMembers) {
      console.log(`Fetching request: ${member}`);
      const req = await redisClient.hGetAll(`ride:requests:${cityLower}:${member}`);
      if (Object.keys(req).length) {
        console.log(`Parsed request: ${member}`, req);
        if (req.requestId !== request.requestId && req.ridePooling === 'true' && req.rideType === 'shared') {
          pendingRequests.push({
            ...req,
            lat: parseFloat(req.lat),
            long: parseFloat(req.long),
            dropoffLat: parseFloat(req.dropoffLat),
            dropoffLong: parseFloat(req.dropoffLong),
            timestamp: parseInt(req.timestamp),
            ridePooling: req.ridePooling === 'true',
          });
          console.log(`Added pending request: ${req.requestId}`);
        }
      }
    }
  } catch (err) {
    console.log(`GeoSearch failed: ${err.message}`);
    logger.error('GeoSearch failed', { error: err.message, stack: err.stack });
    return [];
  }

  console.log(`Pending requests: ${pendingRequests.length}`, pendingRequests.map(r => r.requestId));
  const poolable = [];
  for (const req of pendingRequests) {
    console.log(`Checking poolability for ${req.requestId}`);
    const isGenderCompatible =
      CONFIG.GENDER_STRICT_MATCH
        ? request.gender === 'any' || req.gender === 'any' || request.gender === req.gender
        : true;

    const proximityCheck = haversineDistance(request.lat, request.long, req.lat, req.long) <= CONFIG.MAX_PROXIMITY_KM;
    const dropoffCheck =
      haversineDistance(request.dropoffLat, request.dropoffLong, req.dropoffLat, req.dropoffLong) <=
      CONFIG.MAX_PROXIMITY_KM;
    const timeCheck = Math.abs(request.timestamp - req.timestamp) <= CONFIG.TIME_WINDOW_MS;
    const modeCheck = req.mode === request.mode;

    console.log(`Poolability checks for ${req.requestId}:`, {
      gender: isGenderCompatible,
      proximity: proximityCheck,
      dropoff: dropoffCheck,
      time: timeCheck,
      mode: modeCheck,
    });

    if (modeCheck && isGenderCompatible && timeCheck && proximityCheck && dropoffCheck) {
      const waypoints = [
        { lat: request.lat, long: request.long },
        { lat: req.lat, long: req.long },
        { lat: request.dropoffLat, long: request.dropoffLong },
        { lat: req.dropoffLat, long: req.dropoffLong },
      ];

      if (!await validateWaypoints(waypoints)) {
        console.log(`Invalid waypoints in findPoolableRiders: ${req.requestId}`);
        continue;
      }

      const cacheKey = `eta:${cityLower}:pool:${waypoints.map(w => `${w.lat},${w.long}`).join('|')}`;
      console.log(`Checking ETA cache: ${cacheKey}`);
      let eta = await getCachedETA(cacheKey);
      if (eta === null) {
        console.log(`Calculating ETA for ${cacheKey}`);
        eta = await calculateETA(redisClient, cityLower, request.riderId, 'pool', waypoints, 5000);
        await setCachedETA(cacheKey, eta);
        console.log(`ETA calculated: ${eta} minutes`);
      }

      const individualCacheKey1 = `eta:${cityLower}:individual:${request.riderId}`;
      const individualCacheKey2 = `eta:${cityLower}:individual:${req.riderId}`;
      let individualEta1 = await getCachedETA(individualCacheKey1);
      let individualEta2 = await getCachedETA(individualCacheKey2);

      if (individualEta1 === null) {
        const waypoints1 = [
          { lat: request.lat, long: request.long },
          { lat: request.dropoffLat, long: request.dropoffLong },
        ];
        console.log(`Calculating individual ETA for ${request.riderId}`);
        individualEta1 = await calculateETA(redisClient, cityLower, request.riderId, 'pool', waypoints1, 5000);
        await setCachedETA(individualCacheKey1, individualEta1);
        console.log(`Individual ETA for ${request.riderId}: ${individualEta1} minutes`);
      }

      if (individualEta2 === null) {
        const waypoints2 = [
          { lat: req.lat, long: req.long },
          { lat: req.dropoffLat, long: req.dropoffLong },
        ];
        console.log(`Calculating individual ETA for ${req.riderId}`);
        individualEta2 = await calculateETA(redisClient, cityLower, req.riderId, 'pool', waypoints2, 5000);
        await setCachedETA(individualCacheKey2, individualEta2);
        console.log(`Individual ETA for ${req.riderId}: ${individualEta2} minutes`);
      }

      console.log(`Poolable ETA check for ${req.requestId}:`, {
        eta,
        individualEta1,
        individualEta2,
        detourLimit1: individualEta1 + CONFIG.MAX_DETOUR_MINUTES,
        detourLimit2: individualEta2 + CONFIG.MAX_DETOUR_MINUTES,
      });

      if (
        eta !== null &&
        individualEta1 !== null &&
        individualEta2 !== null &&
        eta <= individualEta1 + CONFIG.MAX_DETOUR_MINUTES &&
        eta <= individualEta2 + CONFIG.MAX_DETOUR_MINUTES
      ) {
        poolable.push(req);
        console.log(`Request ${req.requestId} is poolable`);
      }
    }
  }

  console.log(`Poolable riders found: ${poolable.length}`, poolable.map(r => r.requestId));
  return poolable;
}

module.exports = { findPoolableRiders };