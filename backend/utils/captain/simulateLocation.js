// utils/captain/simulateLocation.js
const captainModel = require('../../models/captain/captain.model');
const axios = require('axios');

const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY;

// Haversine formula to calculate distance between two points (in km)
const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const toRadians = (deg) => deg * (Math.PI / 180);
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

module.exports.simulateDriverMovement = async (io, userLocation) => {
  if (!userLocation || !userLocation.lat || !userLocation.lng) {
    throw new Error('User location (lat, lng) required');
  }
  const userLat = userLocation.lat;
  const userLng = userLocation.lng;

  const captains = await captainModel.find({ isAvailable: true });
  if (captains.length === 0) {
    throw new Error('No available captains found');
  }

  // List of endpoints around Chennai
  const endPoints = [
    [80.15189145680105, 12.967964951081374],
    [80.19674068833834, 13.120679180633934],
    [80.2159955588963, 12.9096978907913],
    [80.25127161864232, 13.077639215421886],
    [80.26711239968445, 13.067129428817271],
    [80.28438284725043, 13.014427753037731],
    [80.10767828483968, 13.065960047440297],
    [80.20344447027553, 13.102577324456218],
    [80.2613602739559, 13.069345578071989],
    [80.18986359195758, 12.982719999020793],
    [80.14928235558563, 12.960869732521747],
    [80.28594135753956, 13.149205329561344],
    [80.10626672747894, 13.100986248852564],
    [80.19586790297377, 13.075726985919022],
    [80.19659903228583, 13.104413563733756],
    [80.1471906604401, 13.047154927135065],
    [80.11152047644688, 13.060329192731281],
    [80.10099116056114, 13.09364419101896],
    [80.18586900082647, 12.919573139556165],
    [80.18359096359185, 13.1227316678711],
    [80.13371649660168, 13.073768431491477],
    [80.16416898012854, 12.939630496669816],
    [80.20961066104181, 13.140059497190236],
    [80.10551313427975, 13.041974703077392],
    [80.26833195273623, 13.077672572035505],
    [80.27825323665566, 12.90210359647597],
    [80.20444671173513, 12.9811349583933],
    [80.11643120005775, 12.923190549673674],
    [80.15917458835834, 13.102583745516672],
    [80.12534183816535, 12.92077612762581],
    [80.1225448889606, 12.930545552662647],
    [80.16217871822874, 13.05777857543899],
    [80.24377416565517, 13.00747622720143],
    [80.2917844883294, 13.013752197548177],
    [80.24131646632259, 13.055851600755938],
    [80.22901551210815, 13.02175973915076],
    [80.12763694153224, 12.964942318757995],
    [80.1254151636076, 13.05965024441179],
    [80.10126504265442, 12.957981303345182],
    [80.26765763353534, 13.072338430747626],
  ];

  const simulations = new Map(); // Store interval IDs

  // Fetch routes for all captains with random endpoints
  const routePromises = captains.map(async (captain) => {
    const startPoint = captain.currentLocation.coordinates; // [lng, lat]
    // Randomly select an endpoint from the list
    const endPoint = endPoints[Math.floor(Math.random() * endPoints.length)];
    try {
      const response = await axios.get(
        `https://api.geoapify.com/v1/routing?waypoints=${startPoint[1]},${startPoint[0]}|${endPoint[1]},${endPoint[0]}&mode=drive&traffic=approximated&type=short&details=instruction_details,route_details,elevation&apiKey=${GEOAPIFY_API_KEY}`
      );
      const routeCoords = response.data.features[0].geometry.coordinates[0].map(([lng, lat]) => [lat, lng]);
      const totalTime = response.data.features[0].properties.time;
      return {
        driverId: captain.driverId,
        routeCoords,
        totalTime,
        vehicleType: captain.vehicle?.type || 'Unknown', // Fallback if vehicle.type is missing
      };
    } catch (err) {
      console.error(`Failed to fetch route for ${captain.driverId}: ${err.message}`);
      return null;
    }
  });

  const routes = (await Promise.all(routePromises)).filter((route) => route !== null);
  console.log(`Fetched routes for ${routes.length} captains`);

  // Simulate each captain
  routes.forEach(({ driverId, routeCoords, totalTime, vehicleType }) => {
    const numPoints = routeCoords.length;
    const intervalMs = Math.round((totalTime * 1000) / numPoints); // Time per step
    let currentIndex = 0;

    const simulation = setInterval(async () => {
      try {
        const captain = await captainModel.findOne({ driverId });
        if (!captain) {
          clearInterval(simulation);
          simulations.delete(driverId);
          console.error(`Captain ${driverId} not found`);
          return;
        }

        if (currentIndex < numPoints) {
          const [lat, lng] = routeCoords[currentIndex];
          captain.currentLocation.coordinates = [lng, lat];
          await captain.save();

          // Check if captain is within 10 km of user
          const distance = haversineDistance(userLat, userLng, lat, lng);
          if (distance <= 10) {
            io.emit('locationUpdate', {
              driverId: captain.driverId,
              currentLocation: captain.currentLocation,
              vehicleType: vehicleType, // Include vehicle type in update
            });
            console.log(
              `Updated ${driverId} (${vehicleType}) to [${lng}, ${lat}] (distance: ${distance.toFixed(2)} km)`
            );
          }

          currentIndex++;
        } else {
          console.log(`${driverId} (${vehicleType}) reached destination`);
          clearInterval(simulation);
          simulations.delete(driverId);
          // Optional: Restart with a new random endpoint
          // const newEndPoint = endPoints[Math.floor(Math.random() * endPoints.length)];
          // (Re-fetch route and restart simulation here if desired)
        }
      } catch (err) {
        console.error(`Simulation error for ${driverId}: ${err.message}`);
        clearInterval(simulation);
        simulations.delete(driverId);
      }
    }, intervalMs);

    simulations.set(driverId, simulation);
  });

  return simulations;
};