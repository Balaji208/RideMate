const axios = require('axios');
const { redisClient } = require('../config/redis');
const { matchingQueue } = require('../services/matching');
const { v4: uuidv4 } = require('uuid');
const { simulateDriverResponse } = require('../services/notify');

// Test configuration
const BASE_URL = 'http://localhost:3002';
const CITY = 'chennai';
const DRIVERS = [
    
  {
    DRIVER_ID: 'DRV001',
    lat: 13.0827,
    long: 80.2707,
    rideTypeSupported: ['shared'],
    mode : 'sedan',
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
    mode : 'sedan',
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
  console.log(`Mock ETA for ${riderId} to ${driverId}: ${baseETA} minutes`);
  return baseETA;
};
require('../services/eta').calculateETA = mockCalculateETA;


async function setupData() {
  console.log('Setting up test data...');
  // Clear Redis
  await redisClient.flushDb();
  console.log('Redis cleared.');

  // Register drivers via API
  for (const driver of DRIVERS) {
    try {
      const response = await axios.post(`${BASE_URL}/location/captain`, driver);
      console.log(`Registered driver ${driver.DRIVER_ID}:`, response.data);
    } catch (err) {
      console.error(`Failed to register driver ${driver.DRIVER_ID}:`, err.response?.data || err.message);
      throw err;
    }
  }

  // Set rider locations via API
  for (const request of REQUESTS) {
    try {
      const response = await axios.post(`${BASE_URL}/ride`, {
        riderId: request.riderId,
        lat: request.lat,
        long: request.long,
        city: CITY,
      });
      console.log(`Set location for rider ${request.riderId}:`, response.data);
    } catch (err) {
      console.error(`Failed to set location for rider ${request.riderId}:`, err.response?.data || err.message);
      throw err;
    }
  }

  console.log('Test data setup complete.');
}

async function addRequests() {
  console.log('Submitting ride requests...');
  for (const request of REQUESTS) {
    try {
      const response = await axios.post(`${BASE_URL}/ride/request`, request);
      console.log(`Submitted request ${request.requestId} for ${request.riderId}:`, response.data);
    } catch (err) {
      console.error(`Failed to submit request ${request.requestId}:`, err.response?.data || err.message);
      throw err;
    }
  }
}

async function simulateDriverResponses() {
  console.log('Simulating driver responses...');
  for (const request of REQUESTS) {
    const driverId = request.riderId === 'rider1' ? 'DRV001' : 'DRV002';
    // console.log("Simulation Req : "request);
    await simulateDriverResponse(driverId, request.requestId, true);
    console.log(`Simulated response for ${driverId} on request ${request.requestId}`);
  }
}

async function verifyResults() {
  console.log('Verifying results...');
  let allMatched = true;
  for (const request of REQUESTS) {
    try {
      const response = await axios.get(`${BASE_URL}/ride/match/${request.requestId}`);
      const { status, data } = response.data;
      if (status === 'pending') {
        console.log(`Request ${request.requestId} is pending`);
        allMatched = false;
      } else if (status === 'matched' && data.status !== 'no_match') {
        console.log(`Request ${request.requestId} matched:`, {
          riderId: data.riderId,
          DRIVER_ID: data.DRIVER_ID,
          eta: data.eta,
          distance: data.distance,
        });
        // Verify driver availability in Redis
        const driverData = await redisClient.hGetAll(`captains:${CITY.toLowerCase()}:${data.DRIVER_ID}`);
        if (driverData.isAvailable === 'false') {
          console.log(`Driver ${data.DRIVER_ID} correctly marked unavailable`);
        } else {
          console.log(`Error: Driver ${data.DRIVER_ID} still available`);
          allMatched = false;
        }
      } else {
        console.log(`Request ${request.requestId} failed: No match`);
        allMatched = false;
      }
    } catch (err) {
      console.error(`Failed to verify request ${request.requestId}:`, err.response?.data || err.message);
      allMatched = false;
    }
  }
  console.log(`Test result: ${allMatched ? 'PASS' : 'FAIL'}`);
  return allMatched;
}

async function runTest() {
  let server;
  try {
    console.log('Starting matching test...');
    await setupData();
    await addRequests();
    await simulateDriverResponses();

    // Wait for queue processing (up to 10 seconds)
    let attempts = 0;
    const maxAttempts = 100;
    while (attempts < maxAttempts) {
      const waitingCount = await matchingQueue.getWaitingCount();
      const activeCount = await matchingQueue.getActiveCount();
      if (waitingCount === 0 && activeCount === 0) {
        console.log('Queue processing complete.');
        break;
      }
      console.log(`Waiting for queue to process... (waiting: ${waitingCount}, active: ${activeCount})`);
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }

    if (attempts >= maxAttempts) {
      console.log('Error: Queue processing timed out');
      return;
    }

    await verifyResults();
  } catch (err) {
    console.error('Test failed:', err.message);
  } finally {
    if (server) {
      server.close(() => console.log('Test server stopped'));
    }
    await matchingQueue.close();
    await redisClient.quit();
    console.log('Test complete.');
  }
}

runTest();