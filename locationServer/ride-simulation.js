const io = require('socket.io-client');
const axios = require('axios');

const socket = io('http://localhost:3002', { reconnection: true });
const geoapifyKey = process.env.GEOAPIFY_API_KEY || '35c449a868924a36a9a95c7f7a7af69b';

// Fallback route (straight line) if Geoapify fails
function generateFallbackRoute(start, end, steps = 10) {
  const path = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    path.push([
      start[0] + t * (end[0] - start[0]),
      start[1] + t * (end[1] - start[1]),
    ]);
  }
  console.log(`[getRoute] Generated fallback route: ${path.length} points`);
  return path;
}

// Fetch Geoapify route
async function getRoute(start, end, mode = 'drive') {
  if (!geoapifyKey) {
    console.error('Geoapify API key missing. Set GEOAPIFY_API_KEY in .env');
    process.exit(1);
  }
  // Round coordinates to 5 decimals
  const startRounded = [start[0].toFixed(5), start[1].toFixed(5)];
  const endRounded = [end[0].toFixed(5), end[1].toFixed(5)];
  try {
    const url = `https://api.geoapify.com/v1/routing?waypoints=${startRounded[0]},${startRounded[1]}|${endRounded[0]},${endRounded[1]}&mode=${mode}&apiKey=${geoapifyKey}`;
    console.log(`[getRoute] Fetching ${mode} route: ${url}`);
    const response = await axios.get(url);
    if (!response.data?.features?.length) {
      console.error('[getRoute] No features in response:', JSON.stringify(response.data));
      return generateFallbackRoute(start, end, mode === 'walk' ? 5 : 20);
    }
    const coords = response.data.features[0].geometry.coordinates[0].map(([lng, lat]) => [parseFloat(lat.toFixed(5)), parseFloat(lng.toFixed(5))]);
    console.log(`[getRoute] Route fetched (${mode}): ${coords.length} points, first: ${JSON.stringify(coords[0])}`);
    return coords;
  } catch (err) {
    console.error(`[getRoute] Geoapify error for ${mode} route (${startRounded} to ${endRounded}):`, err.message, err.response?.data || '');
    return generateFallbackRoute(start, end, mode === 'walk' ? 5 : 20);
  }
}

// Simulate driver movement
async function simulateDriver() {
  console.log('Simulating DRV001 movement...');

  // Phase 1: Driver to pickup
  const driverStart = [13.0208, 80.2412]; // Near Kotturpuram
  const pickup = [13.0213, 80.2417]; // Kotturpuram
  const driverToPickup = await getRoute(driverStart, pickup, 'drive');
  for (const [i, pos] of driverToPickup.entries()) {
    socket.emit('captainLocation', {
      DRIVER_ID: 'DRV001',
      lat: pos[0],
      long: pos[1],
      city: 'Chennai',
      rideTypeSupported: ['economy'],
      isAvailable: true,
      status: 'active',
      rating: 4.0,
      vehicle: { capacity: 4, type: 'sedan' },
    });
    console.log(`DRV001 to pickup ${i+1}:`, pos);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Phase 2: Driver to dropoff
  const dropoff = [13.0778, 80.2619]; // Chennai Egmore
  const driverToDropoff = await getRoute(pickup, dropoff, 'drive');
  for (const [i, pos] of driverToDropoff.entries()) {
    socket.emit('captainLocation', {
      DRIVER_ID: 'DRV001',
      lat: pos[0],
      long: pos[1],
      city: 'Chennai',
      rideTypeSupported: ['economy'],
      isAvailable: false,
      status: 'active',
      rating: 4.0,
      vehicle: { capacity: 4, type: 'sedan' },
    });
    console.log(`DRV001 to Egmore ${i+1}:`, pos);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

// Simulate rider movement
async function simulateRider() {
  console.log('Simulating user1 movement...');

  // Phase 1: Rider walking near Kotturpuram
  const riderStart = [13.0213, 80.2417]; // Kotturpuram
  const riderWalk = [13.0218, 80.2422]; // ~100m
  const walkPath = await getRoute(riderStart, riderWalk, 'walk');
  for (const [i, pos] of walkPath.entries()) {
    socket.emit('userLocation', {
      riderId: 'user1',
      lat: pos[0],
      long: pos[1],
      city: 'Chennai',
    });
    console.log(`user1 walking ${i+1}:`, pos);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Phase 2: Rider with driver to Egmore
  const pickup = [13.0213, 80.2417];
  const dropoff = [13.0778, 80.2619];
  const ridePath = await getRoute(pickup, dropoff, 'drive');
  for (const [i, pos] of ridePath.entries()) {
    socket.emit('userLocation', {
      riderId: 'user1',
      lat: pos[0],
      long: pos[1],
      city: 'Chennai',
    });
    console.log(`user1 to Egmore ${i+1}:`, pos);
    await new Promise(resolve => setTimeout(resolve, 200)); // Faster for rider
  }
}

// Send ride request
async function sendRideRequest() {
  console.log('Sending ride request for user1...');
  await new Promise(resolve => setTimeout(resolve, 6000));
  socket.emit('rideRequest', {
    riderId: 'user1',
    lat: 13.0213,
    long: 80.2417,
    rideType: 'economy',
    city: 'Chennai',
  });
}

// Run simulation
async function runSimulation() {
  socket.on('connect', () => console.log('Connected to locationServer'));

  try {
    await Promise.all([
      simulateDriver(),
      simulateRider().then(sendRideRequest),
    ]);
  } catch (err) {
    console.error('Simulation error:', err);
  }
}

runSimulation();