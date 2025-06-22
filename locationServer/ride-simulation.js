
const io = require('socket.io-client');
const axios = require('axios');

const socket = io('http://localhost:3002', { reconnection: true });
const geoapifyKey = process.env.GEOAPIFY_API_KEY || '';

async function getRoute(start, end, mode = 'drive') {
  if (!geoapifyKey) {
    console.error('Geoapify API key missing. Set GEOAPIFY_API_KEY in .env');
    process.exit(1);
  }
  const startRounded = [start[0].toFixed(5), start[1].toFixed(5)];
  const endRounded = [end[0].toFixed(5), end[1].toFixed(5)];
  try {
    const url = `https://api.geoapify.com/v1/routing?waypoints=${startRounded[0]},${startRounded[1]}|${endRounded[0]},${endRounded[1]}&mode=${mode}&apiKey=${geoapifyKey}`;
    console.log(`[getRoute] Fetching ${mode} route: ${url}`);
    const response = await axios.get(url);
    if (!response.data?.features?.length) {
      console.error('[getRoute] No features in response:', JSON.stringify(response.data));
      return [];
    }
    const coords = response.data.features[0].geometry.coordinates[0].map(([lng, lat]) => [parseFloat(lat.toFixed(5)), parseFloat(lng.toFixed(5))]);
    console.log(`[getRoute] Route fetched (${mode}): ${coords.length} points, first: ${JSON.stringify(coords[0])}`);
    return coords;
  } catch (err) {
    console.error(`[getRoute] Geoapify error for ${mode} route (${startRounded} to ${endRounded}):`, err.message, err.response?.data || '');
    return [];
  }
}

async function simulateDriver() {
  console.log('Simulating DRV001 movement...');
  const driverStart = [13.0208, 80.2412];
  const pickup1 = [13.0213, 80.2417];
  const driverToPickup = await getRoute(driverStart, pickup1, 'drive');
  for (const [i, pos] of driverToPickup.entries()) {
    socket.emit('captainLocation', {
      DRIVER_ID: 'DRV001',
      lat: pos[0],
      long: pos[1],
      city: 'Chennai',
      rideTypeSupported: ['economy', 'shared'],
      mode: 'sedan',
      isAvailable: true,
      status: 'active',
      rating: 4.0,
    });
    console.log(`DRV001 to pickup ${i+1}:`, pos);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  const dropoff = [13.0778, 80.2619];
  const driverToDropoff = await getRoute(pickup1, dropoff, 'drive');
  for (const [i, pos] of driverToDropoff.entries()) {
    socket.emit('captainLocation', {
      DRIVER_ID: 'DRV001',
      lat: pos[0],
      long: pos[1],
      city: 'Chennai',
      rideTypeSupported: ['economy', 'shared'],
      mode: 'sedan',
      isAvailable: false,
      status: 'active',
      rating: 4.0,
    });
    console.log(`DRV001 to Egmore ${i+1}:`, pos);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

async function simulateRider(riderId, pickup, dropoff, ridePooling, gender) {
  console.log(`Simulating ${riderId} movement...`);
  const riderStart = pickup;
  const riderWalk = [pickup[0] + 0.0005, pickup[1] + 0.0005];
  const walkPath = await getRoute(riderStart, riderWalk, 'walk');
  for (const [i, pos] of walkPath.entries()) {
    socket.emit('userLocation:${riderId}', {
      riderId: riderId,
      lat: pos[0],
      long: pos[1],
      city: 'Chennai',
    });
    console.log(`${riderId} walking ${i+1}:`, pos);
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  const ridePath = await getRoute(riderStart, dropoff, 'drive');
  for (const [i, pos] of ridePath.entries()) {
    socket.emit('userLocation:${riderId}', {
      riderId: riderId,
      lat: pos[0],
      long: pos[1],
      city: 'Chennai',
    });
    console.log(`${riderId} to Egmore ${i+1}:`, pos);
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return {
    riderId,
    lat: pickup[0],
    long: pickup[1],
    dropoffLat: dropoff[0],
    dropoffLong: dropoff[1],
    rideType: 'shared',
    mode: 'rider',
    ridePooling,
    gender,
    city: 'Chennai',
  };
}

async function sendRideRequest(request) {
  console.log(`Sending ride request for ${request.riderId}`);
  await new Promise(resolve => setTimeout(resolve, 6000));
  socket.emit('rideRequest', request);
}

async function runSimulation() {
  socket.on('connect', () => console.log('Connected to locationServer'));

  try {
    const user1Request = await simulateRider(
      'user1',
      [13.0213, 80.2417],
      [13.0778, 80.2619],
      true,
      'male'
    );
    const user2Request = await simulateRider(
      'user2',
      [13.0215, 80.2418],
      [13.078, 80.2620],
      true,
      'male'
    );

    await Promise.all([
      simulateDriver(),
      sendRideRequest(user1Request),
      sendRideRequest(user2Request),
    ]);
  } catch (err) {
    console.error('Simulation error:', err);
  }
}

runSimulation();
