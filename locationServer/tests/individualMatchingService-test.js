
const axios = require('axios');
const { redisClient } = require('../config/redis');
const { matchingQueue } = require('../services/matching');
const { v4: uuidv4 } = require('uuid');
const { simulateDriverResponse } = require('../services/notify');

// Test configuration
const BASE_URL = 'http://localhost:3002';
const CITY = 'chennai';

// Cache for reverse geocoding results
const locationCache = {};

// Reverse geocoding using Nominatim API
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
        'User-Agent': 'RideMateTest/1.0 (test@localhost)',
      },
    });
    const placeName = response.data.display_name || `Unknown location (${lat}, ${long})`;
    locationCache[cacheKey] = placeName;
    return placeName;
  } catch (err) {
    console.error(`Reverse geocoding failed for (${lat}, ${long}): ${err.message}`);
    return `Unknown location (${lat}, ${long})`;
  }
}

// Test data
const DRIVERS = [
  {
    DRIVER_ID: 'DRV001',
    lat: 13.0827,
    long: 80.2707,
    rideTypeSupported: ['shared'],
    mode: 'sedan',
    isAvailable: true,
    status: 'active',
    rating: 4.5,
    city: CITY,
  },
  {
    DRIVER_ID: 'DRV002',
    lat: 13.0830,
    long: 80.2710,
    rideTypeSupported: ['shared'],
    mode: 'sedan',
    isAvailable: true,
    status: 'active',
    rating: 4.0,
    city: CITY,
  },
];

const REQUESTS = [
  {
    requestId: uuidv4(),
    riderId: 'rider1',
    city: CITY,
    lat: 13.0825,
    long: 80.2705,
    dropoffLat: 13.0875,
    dropoffLong: 80.2755,
    rideType: 'shared',
    mode: 'sedan',
    ridePooling: false,
    gender: 'male',
  },
  {
    requestId: uuidv4(),
    riderId: 'rider2',
    city: CITY,
    lat: 13.0835,
    long: 80.2715,
    dropoffLat: 13.0885,
    dropoffLong: 80.2765,
    rideType: 'shared',
    mode: 'sedan',
    ridePooling: false,
    gender: 'male',
  },
];

// Mock calculateETA
const mockCalculateETA = async (redisClient, city, riderId, driverId, waypoints, timeout) => {
  const baseETA = riderId === 'rider1' ? 5 : 7;
  return baseETA;
};

// Apply mock to matching service
const etaModule = require('../services/eta');
etaModule.calculateETA = mockCalculateETA;

async function setupData() {
  try {
    await redisClient.flushDb();
    for (const driver of DRIVERS) {
      await axios.post(`${BASE_URL}/location/captain`, driver);
    }
    for (const request of REQUESTS) {
      await axios.post(`${BASE_URL}/ride`, {
        riderId: request.riderId,
        lat: request.lat,
        long: request.long,
        city: CITY,
      });
    }
  } catch (err) {
    throw new Error(`Setup failed: ${err.response?.data?.error || err.message}`);
  }
}

async function addRequests() {
  try {
    for (const request of REQUESTS) {
      const response = await axios.post(`${BASE_URL}/ride/request`, request);
      request.requestId = response.data.requestId; // Update with API-generated requestId
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (err) {
    throw new Error(`Failed to submit request: ${err.response?.data?.error || err.message}`);
  }
}

async function simulateDriverResponses() {
  await new Promise(resolve => setTimeout(resolve, 2000));
  for (const request of REQUESTS) {
    const driverId = request.riderId === 'rider1' ? 'DRV001' : 'DRV002';
    await simulateDriverResponse(driverId, request.requestId, true);
  }
}

async function verifyResults() {
  let allMatched = true;
  for (const request of REQUESTS) {
    try {
      const riderLocation = await reverseGeocode(request.lat, request.long);
      const response = await axios.get(`${BASE_URL}/ride/match/${request.requestId}`);
      const { status, data } = response.data;
      if (status === 'pending') {
        console.log(`Request ${request.requestId} for rider ${request.riderId} at ${riderLocation} is pending`);
        allMatched = false;
      } else if (status === 'matched' && data.status !== 'no_match') {
        const driverLocation = await reverseGeocode(data.driverLat, data.driverLong);
        console.log(
          `Request ${request.requestId} matched: Rider ${data.riderId} at ${riderLocation} ` +
          `to Driver ${data.DRIVER_ID} at ${driverLocation}, ETA: ${data.eta} min, ` +
          `Distance: ${(data.distance || 0).toFixed(3)} km`
        );
        const driverData = await redisClient.hGetAll(`captains:${CITY.toLowerCase()}:${data.DRIVER_ID}`);
        if (driverData.isAvailable === 'false') {
          console.log(`Driver ${data.DRIVER_ID} correctly marked unavailable`);
        } else {
          console.log(`Error: Driver ${data.DRIVER_ID} still available`);
          allMatched = false;
        }
      } else {
        console.log(`Request ${request.requestId} for rider ${request.riderId} at ${riderLocation} failed: No match`);
        allMatched = false;
      }
    } catch (err) {
      console.error(`Verification failed for request ${request.requestId}: ${err.response?.data?.error || err.message}`);
      allMatched = false;
    }
  }
  console.log(`Test result: ${allMatched ? 'PASS' : 'FAIL'}`);
  return allMatched;
}

async function runTest() {
  try {
    console.log('Starting ride matching test...');
    await setupData();
    await addRequests();
    await simulateDriverResponses();

    let attempts = 0;
    const maxAttempts = 40;
    while (attempts < maxAttempts) {
      const waitingCount = await matchingQueue.getWaitingCount();
      const activeCount = await matchingQueue.getActiveCount();
      const delayedCount = await matchingQueue.getDelayedCount();
      if (waitingCount === 0 && activeCount === 0 && delayedCount === 0) {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }

    if (attempts >= maxAttempts) {
      console.error('Queue processing timed out');
      return;
    }

    await verifyResults();
  } catch (err) {
    console.error(`Test failed: ${err.message}`);
  } finally {
    await matchingQueue.close();
    await redisClient.quit();
    console.log('Test completed.');
  }
}

runTest();