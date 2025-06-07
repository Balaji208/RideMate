const axios = require("axios");
const { logger } = require("../config/logger");

async function calculateETA(redisClient, cityLower, riderId, DRIVER_ID, driverLat, driverLong, riderLat, riderLong) {
  const cacheKey = `captains:${cityLower}:eta:${riderId}:${DRIVER_ID}`;
  let eta = await redisClient.get(cacheKey);

  if (!eta) {
    try {
      const GEOAPIFY_KEY = process.env.GEOAPIFY_API_KEY || "your_geoapify_key";
      logger.info("GeoApify Request", {
        DRIVER_ID,
        driverLat,
        driverLong,
        riderLat,
        riderLong,
      });
      const response = await axios.get(
        `https://api.geoapify.com/v1/routing?waypoints=${driverLat},${driverLong}|${riderLat},${riderLong}&mode=drive&traffic=approximated&type=short&apiKey=${GEOAPIFY_KEY}`,
        { timeout: 2000 }
      );
      if (response?.data?.features?.length > 0) {
        eta = Math.round(response.data.features[0].properties.time / 60);
        await redisClient.setEx(cacheKey, 60, eta.toString());
        logger.info("ETA calculated", { DRIVER_ID, eta });
      } else {
        logger.warn("GeoApify empty response", { DRIVER_ID });
        return null;
      }
    } catch (err) {
      logger.warn("GeoApify fallback", { DRIVER_ID, error: err.message });
      const dx = (driverLat - riderLat) * 111;
      const dy = (driverLong - riderLong) * 111;
      const distance = Math.sqrt(dx * dx + dy * dy);
      eta = Math.round((distance / 40) * 60);
    }
  } else {
    eta = parseInt(eta);
    logger.info("Cached ETA", { DRIVER_ID, eta });
  }

  return eta;
}


module.exports = { calculateETA };