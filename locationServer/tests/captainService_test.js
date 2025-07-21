const { notifyDriverForGroup } = require('../services/captainService'); // <- update this path
const { redisClient } = require('../config/redis');

(async () => {
  // Mock data for group
 const group = [ 
  {
    requestId: 'REQ1',
    riderId: 'R001',
    lat: 13.0412,         // T. Nagar
    long: 80.2337,
    dropoffLat: 13.0488,   // Saidapet
    dropoffLong: 80.2288,
    city: 'chennai',
    rideType: 'pool',
    mode: 'sedan'
  },
  {
    requestId: 'REQ2',
    riderId: 'R002',
    lat: 13.0506,         // Kodambakkam
    long: 80.2333,
    dropoffLat: 13.0542,   // Nungambakkam
    dropoffLong: 80.2395,
    city: 'chennai',
    rideType: 'pool',
    mode: 'sedan'
  },
  {
    requestId: 'REQ3',
    riderId: 'R003',
    lat: 13.0604,         // Nungambakkam High Rd
    long: 80.2412,
    dropoffLat: 13.0670,   // Egmore
    dropoffLong: 80.2533,
    city: 'chennai',
    rideType: 'pool',
    mode: 'sedan'
  },
  {
    requestId: 'REQ4',
    riderId: 'R004',
    lat: 13.0446,         // West Mambalam
    long: 80.2183,
    dropoffLat: 13.0342,   // Ashok Nagar
    dropoffLong: 80.2125,
    city: 'chennai',
    rideType: 'pool',
    mode: 'sedan'
  },
  {
    requestId: 'REQ5',
    riderId: 'R005',
    lat: 13.0460,         // T. Nagar Bus Stand
    long: 80.2274,
    dropoffLat: 13.0510,   // CIT Nagar
    dropoffLong: 80.2230,
    city: 'chennai',
    rideType: 'pool',
    mode: 'sedan'
  },
  {
    requestId: 'REQ6',
    riderId: 'R006',
    lat: 12.6303,         // Mahabalipuram outskirts (far away)
    long: 80.1928,
    dropoffLat: 12.6147,   // East Coast Rd (ECR)
    dropoffLong: 80.1944,
    city: 'chennai',
    rideType: 'pool',
    mode: 'sedan'
  }
];

  const driverId = 'DRIVER123';

  // Setup mock data in Redis
  await redisClient.geoAdd('captains:chennai', {
    latitude: 13.0455,     // Pondy Bazaar, T. Nagar
  longitude: 80.2330,
    member: driverId
  });

  await redisClient.hSet(`captains:chennai:${driverId}`, {
    isAvailable: 'true',
    status: 'active',
    rideTypeSupported: JSON.stringify(['pool']),
    mode: 'sedan',
    rating: '4.8'
  });

  // Run function
  const accepted = await notifyDriverForGroup(driverId, group);
  console.log('Driver accepted:', accepted);

  // Cleanup
  await redisClient.del(`captains:chennai:${driverId}`);
  await redisClient.zRem('captains:chennai', driverId);
  process.exit(0);
})();
