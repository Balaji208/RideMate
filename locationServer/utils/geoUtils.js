function haversineDistance(lat1, lon1, lat2, lon2) {
  console.log(`Calculating haversine distance: (${lat1}, ${lon1}) to (${lat2}, ${lon2})`);
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  console.log(`Haversine distance calculated: ${distance} km`);
  return distance;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

async function validateWaypoints(waypoints) {
  console.log('Validating waypoints:', waypoints);
  const isValid = waypoints.every(w => typeof w.lat === 'number' && typeof w.long === 'number' && !isNaN(w.lat) && !isNaN(w.long));
  console.log(`Waypoints validation result: ${isValid}`);
  return isValid;
}

module.exports = { haversineDistance, toRadians, validateWaypoints };