const axios = require('axios');
const { logger } = require('../config/logger');
require('dotenv').config();
async function calculateETA(redisClient, cityLower, riderId, clientId, waypoints, timeoutMs) {
  console.log(`Calculating ETA for ${cityLower}, riderId: ${riderId}, clientId: ${clientId}, waypoints:`, waypoints);
  const cacheKey = `eta:${cityLower}:${riderId}:${clientId}:${waypoints.map(p => `${p.lat},${p.long}`).join('|')}`;
  let eta = await redisClient.get(cacheKey);

  if (eta) {
    eta = parseInt(eta);
    console.log(`Cached ETA retrieved: ${eta} minutes`);
    logger.info('Cached ETA', { riderId, clientId, eta });
    return eta;
  }

  // Check for identical waypoints
  const uniqueWaypoints = [...new Set(waypoints.map(p => `${p.lat},${p.long}`))];
  if (uniqueWaypoints.length === 1) {
    console.log('Identical waypoints detected, returning minimum ETA');
    eta = 5; // Minimum ETA for zero-distance routes
    await redisClient.setEx(cacheKey, 60, eta.toString());
    logger.info('Minimum ETA for identical waypoints', { riderId, clientId, eta });
    return eta;
  }

  try {
const key = process.env.GEOAPIFY_API_KEY || '35c449a868924a36a9a95c7f7a7af69b';
    if (!key) {
      console.log(process.env.GEOAPIFY_API_KEY)
      throw new Error('GEOAPIFY_API_KEY is not defined');
    }
    if (!waypoints || waypoints.length < 2) {
      throw new Error('Invalid waypoints');
    }

    const waypointStr = waypoints.map(p => `${p.lat},${p.long}`).join('|');
    const url = `https://api.geoapify.com/v1/routing?waypoints=${encodeURIComponent(waypointStr)}&mode=drive&traffic=approximated&type=short&apiKey=${process.env.GEOAPIFY_API_KEY}`;
    console.log(`Fetching ETA from GeoApify: ${url}`);
    logger.info('GeoApify Request', { clientId, waypoints: waypointStr });

    const response = await axios.get(url, { timeout: timeoutMs || 2000 });
    if (response?.data?.features?.length > 0) {
      const durationSeconds = response.data.features[0].properties.time || 0;
      if (durationSeconds <= 0) {
        throw new Error('Invalid duration from GeoApify');
      }
      eta = Math.ceil(durationSeconds / 60);
      await redisClient.setEx(cacheKey, 60, eta.toString());
      console.log(`ETA calculated: ${eta} minutes`);
      logger.info('ETA calculated', { clientId, eta });
      return eta;
    } else {
      throw new Error('GeoApify empty response');
    }
  } catch (err) {
    console.log(`GeoApify request failed: ${err.message}`);
    logger.warn('GeoApify fallback', { clientId, error: err.message });

    // Fallback ETA calculation
    const distance = waypoints.reduce((sum, p, i) => {
      if (i === 0) return sum;
      const prev = waypoints[i - 1];
      const dx = (p.lat - prev.lat) * 111; // Approx km per degree latitude
      const dy = (p.long - prev.long) * 111 * Math.cos(p.lat * Math.PI / 180); // Adjust for longitude
      return sum + Math.sqrt(dx * dx + dy * dy);
    }, 0);
    eta = Math.max(Math.round((distance / 40) * 60), 5); // Assume 40 km/h, minimum 5 min
    console.log(`Fallback ETA calculated: ${eta} minutes`);
    logger.info('Fallback ETA', { clientId, eta, distance });

    await redisClient.setEx(cacheKey, 60, eta.toString());
    return eta;
  }
}

module.exports = { calculateETA };