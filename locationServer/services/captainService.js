const h3 = require('h3-js');
const { redisClient } = require('../config/redis');
const { logger } = require('../config/logger');
const { calculateETA } = require('../services/eta');
const { sendPooledRideNotification } = require('./notify');
const { haversineDistance } = require('../utils/geoUtils');
const { CONFIG } = require('../config/poolingConfig');
const { v4: uuidv4 } = require('uuid');

async function notifyDriverForGroup(DRIVER_ID, group) {
  const sharedRideId = uuidv4();
  console.log( 
    `Notifying driver ${DRIVER_ID} for group: ${group.map(r => r.requestId).join(', ')}, Shared Ride ID: ${sharedRideId}`
  );
  try {
    const cityLower = group[0].city.toLowerCase();
    
    // Aggregate rider information
    const riderInfo = group.map(req => ({
      requestId: req.requestId,
      riderId: req.riderId,
      lat: req.lat,
      long: req.long,
      dropoffLat: req.dropoffLat,
      dropoffLong: req.dropoffLong
    }));
    console.log("Riders Info",riderInfo);
    // Get driver location
    let driverLat, driverLong;
    try {
      const pos = await redisClient.geoPos(`captains:${cityLower}`, DRIVER_ID);
      if (pos && pos[0] && pos[0].latitude && pos[0].longitude) {
        driverLat = parseFloat(pos[0].latitude);
        driverLong = parseFloat(pos[0].longitude);
        console.log(`Driver location: ${DRIVER_ID} at (${driverLat}, ${driverLong})`);
      } else {
        throw new Error('Invalid driver position');
      }
    } catch (err) {
      console.log(`Failed to get driver location for ${DRIVER_ID}: ${err.message}`);
      logger.warn('Failed to get driver location, using first rider as reference', { DRIVER_ID, error: err.message });
      driverLat = group[0].lat;
      driverLong = group[0].long;
    }

    // Find nearest rider
    let nearestRiderId = group[0].riderId;
    let minDistance = Infinity;
    for (const req of group) {
      const distance = haversineDistance(driverLat, driverLong, req.lat, req.long);
      console.log(`Distance to rider ${req.riderId}: ${distance} km`);
      if (distance < minDistance) {
        minDistance = distance;
        nearestRiderId = req.riderId;
      }
    }
    console.log(`Nearest rider: ${nearestRiderId} at ${minDistance} km`);

    // Calculate average distance for the group (using first rider as reference for consistency)
    const avgDistance = group.reduce((sum, req) => 
      sum + haversineDistance(req.lat, req.long, group[0].lat, group[0].long), 0) / group.length;
    
    // Calculate ETA using nearest rider as reference
    const waypoints = group.flatMap(req => [
      { lat: req.lat, long: req.long },
      { lat: req.dropoffLat, long: req.dropoffLong }
    ]);
    const eta = await calculateETA(
      redisClient,
      cityLower,
      nearestRiderId,
      DRIVER_ID,
      waypoints,
      5000
    );

    console.log(`Notification details for shared ride ${sharedRideId}: Average Distance ${avgDistance} km, ETA: ${eta} minutes, Reference Rider: ${nearestRiderId}`);
    
    // Send single pooled ride notification
    await sendPooledRideNotification({
      driverId: DRIVER_ID,
      sharedRequestId: sharedRideId,
      riderInfo,
      message: `Pooled ride request for ${group.length} riders, nearest at (${group.find(r => r.riderId === nearestRiderId).lat}, ${group.find(r => r.riderId === nearestRiderId).long})`
    });
    console.log(`Pooled notification sent for shared ride ${sharedRideId}`);

    // Wait for driver response for the shared ride
    const accepted = await awaitDriverResponse(DRIVER_ID, sharedRideId);
    console.log(`Driver response: ${DRIVER_ID}, Accepted: ${accepted}, Shared Ride ID: ${sharedRideId}`);
    return accepted;
  } catch (err) {
    console.log(`Driver notification failed for ${DRIVER_ID}: ${err.message}`);
    logger.error('Driver notification failed', { DRIVER_ID, error: err.message, stack: err.stack });
    return false;
  }
}

async function awaitDriverResponse(driverId, sharedRequestId) {
  const channel = `responses:${driverId}`;
  console.log(`Subscribing to ${channel} for shared ride: ${sharedRequestId}`);
  let redisSub = null;

  try {
    redisSub = redisClient.duplicate();
    await redisSub.connect();

    return await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log(`Driver response timeout for ${driverId}, shared ride: ${sharedRequestId}`);
        resolve(false);
      }, 15000);

      redisSub.subscribe(channel, (message) => {
        try {
          const response = JSON.parse(message);
          console.log(`Received message on ${channel}:`, response);
          console.log(`verify this ${response.sharedRequestId} == ${sharedRequestId}`);
          if (response.requestId === sharedRequestId) {
            console.log(`Driver response received: ${driverId}, shared ride ${sharedRequestId}, accepted: ${response.accepted}`);
            clearTimeout(timeout);
            resolve(response.accepted === true);
          } else {
            console.log(`Ignoring message for different sharedRequestId: ${response.sharedRequestId}`);
          }
        } catch (err) {
          console.log(`Error parsing response on ${channel}: ${err.message}`);
          logger.error('Error parsing driver response', { driverId, error: err.message, stack: err.stack });
        }
      }, true);
    });
  } catch (err) {
    console.log(`Subscription failed for ${channel}: ${err.message}`);
    logger.error('Subscription failed', { driverId, error: err.message, stack: err.stack });
    return false;
  } finally {
    if (redisSub && redisSub.isOpen) {
      try {
        await redisSub.quit();
        console.log(`Unsubscribed from ${channel}`);
      } catch (err) {
        console.log(`Failed to quit subscription for ${channel}: ${err.message}`);
        logger.error('Failed to quit subscription', { driverId, error: err.message, stack: err.stack });
      }
    }
  }
}

async function assignDriverToGroup(cityId, group) {
  console.log(`Assigning driver for group: ${group.map(r => r.requestId).join(', ')}`);
  const riderCell = h3.latLngToCell(group[0].lat, group[0].long, 8);
  const cells = h3.gridDisk(riderCell, 8);
  console.log(`H3 cells for driver search: ${cells}`);
  let driverIds = [];
  for (const cell of cells) {
    console.log(`Fetching drivers in cell: ${cell}`);
    try {
      const ids = await redisClient.sMembers(`captains:${cityId}:${cell}`);
      console.log(`Drivers in cell ${cell}: ${ids}`);
      driverIds.push(...ids);
    } catch (err) {
      logger.error('Failed to fetch drivers in cell', { cell, error: err.message, stack: err.stack });
    }
  }
  driverIds = [...new Set(driverIds)];
  console.log(`Unique driver IDs: ${driverIds}`);

  const drivers = [];
  for (const DRIVER_ID of driverIds) {
    console.log(`Processing driver: ${DRIVER_ID}`);
    try {
      const details = await redisClient.hGetAll(`captains:${cityId}:${DRIVER_ID}`);
      console.log(`Driver details: ${DRIVER_ID}`, details);

      const isAvailable = details.isAvailable === 'true';
      const isActive = details.status === 'active';
      let supportsRideType = false;
      try {
        const rideTypes = JSON.parse(details.rideTypeSupported || '[]');
        supportsRideType = rideTypes.includes(group[0].rideType);
        console.log(`Ride type check: ${DRIVER_ID} supports ${group[0].rideType}: ${supportsRideType}`);
      } catch (e) {
        console.log(`Failed to parse rideTypeSupported for ${DRIVER_ID}: ${e.message}`);
        continue;
      }
      const modeMatches = details.mode
        ? details.mode.toLowerCase() === group[0].mode.toLowerCase()
        : group[0].mode.toLowerCase() === 'sedan';
      console.log(`Mode check: ${DRIVER_ID}, mode ${details.mode} matches ${group[0].mode}: ${modeMatches}`);

      if (isAvailable && isActive && supportsRideType && modeMatches) {
        const pos = await redisClient.geoPos(`captains:${cityId}`, DRIVER_ID);
        console.log(`Driver geoPos: ${DRIVER_ID}`, pos);
        if (pos && pos[0] && pos[0].latitude && pos[0].longitude) {
          const driverLat = parseFloat(pos[0].latitude);
          const driverLong = parseFloat(pos[0].longitude);
          const avgDistance =
            group.reduce((sum, req) => sum + haversineDistance(req.lat, req.long, driverLat, driverLong), 0) /
            group.length;
          console.log(`Average distance for ${DRIVER_ID}: ${avgDistance} km`);
          drivers.push({
            DRIVER_ID,
            lat: driverLat,
            long: driverLong,
            rating: parseFloat(details.rating || 1),
            avgDistance,
          });
        }
      }
    } catch (err) {
      logger.error('Failed to process driver', { DRIVER_ID, error: err.message, stack: err.stack });
    }
  }

  if (!drivers.length) {
    console.log(`No eligible drivers found for group: ${group.map(r => r.requestId).join(', ')}`);
    return null;
  }

  console.log(`Eligible drivers: ${drivers.length}`, drivers.map(d => d.DRIVER_ID));

  const scoredDrivers = await Promise.all(
    drivers.map(async driver => {
      console.log(`Scoring driver: ${driver.DRIVER_ID}`);
      const etas = await Promise.all(
        group.map(async req => {
          try {
            const eta = await calculateETA(
              redisClient,
              cityId,
              req.riderId,
              driver.DRIVER_ID,
              [
                { lat: driver.lat, long: driver.long },
                { lat: req.lat, long: req.long },
              ],
              5000
            );
            return eta || 10; // Default to 10 if ETA is invalid
          } catch (err) {
            logger.error('Failed to calculate ETA for driver scoring', { DRIVER_ID: driver.DRIVER_ID, requestId: req.requestId, error: err.message, stack: err.stack });
            return 10;
          }
        })
      );
      console.log(`ETAs for ${driver.DRIVER_ID}: ${etas}`);
      const avgETA = etas.reduce((sum, eta) => sum + eta, 0) / etas.length;
      const score = avgETA + (5 - driver.rating) * 0.1 + driver.avgDistance * 0.05;
      console.log(`Score for ${driver.DRIVER_ID}: ${score}, Avg ETA: ${avgETA}`);
      return { ...driver, score, avgETA };
    })
  );

  scoredDrivers.sort((a, b) => a.score - b.score);
  console.log(`Sorted drivers:`, scoredDrivers.map(d => ({ id: d.DRIVER_ID, score: d.score })));

  for (const driver of scoredDrivers) {
    if (driver.avgETA <= 15) {
      console.log(`Notifying driver: ${driver.DRIVER_ID}`);
      const accepted = await notifyDriverForGroup(driver.DRIVER_ID, group);
      if (accepted) {
        console.log(`Driver ${driver.DRIVER_ID} accepted`);
        return driver;
      }
      console.log(`Driver ${driver.DRIVER_ID} did not accept`);
    }
  }

  console.log(`No driver accepted for group: ${group.map(r => r.requestId).join(', ')}`);
  return null;
}

module.exports = { assignDriverToGroup, notifyDriverForGroup };