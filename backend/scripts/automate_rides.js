const axios = require('axios');
const { coimbatoreEndPoints, chennaiEndPoints, salemEndPoints, maduraiEndPoints } = require('../constants/endPoints');

const allEndPoints = {
  //coimbatore: coimbatoreEndPoints,
 // chennai: chennaiEndPoints,
  //salem: salemEndPoints,
  madurai: maduraiEndPoints,
};
const cities = Object.keys(allEndPoints);

function generateTimestamp() {
  const daysBack = Math.floor(Math.random() * 90);
  const baseDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
  const isPeak = Math.random() < 0.6;
  let hour;
  if (isPeak) {
    const peakPeriod = Math.random() < 0.5 ? 0 : 1;
    hour = peakPeriod === 0 ? Math.floor(Math.random() * 4) + 7 : Math.floor(Math.random() * 5) + 17;
  } else {
    const offPeakHours = [0, 1, 2, 3, 4, 5, 6, 11, 12, 13, 14, 15, 16, 22, 23];
    hour = offPeakHours[Math.floor(Math.random() * offPeakHours.length)];
  }
  baseDate.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
  return baseDate;
}

async function simulateRide() {
  const city = cities[Math.floor(Math.random() * cities.length)];
  const endPoints = allEndPoints[city];
  const pickup = endPoints[Math.floor(Math.random() * endPoints.length)];
  const dropoff = endPoints[Math.floor(Math.random() * endPoints.length)];
  const timestamp = generateTimestamp();
  const vehicleTypes = ['Sedan', 'SUV', 'Hatchback', 'Auto Rickshaw', 'Bike', 'Van', 'Luxury Car'];
  const rideTypes = ['economy', 'premium', 'luxury', 'shared', 'auto', 'bikeTaxi'];
  const vehicleType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
  const rideType = rideTypes[Math.floor(Math.random() * rideTypes.length)];

  try {
    const response = await axios.get('http://localhost:3001/captains/predict-fare', {
      params: {
        pickupLat: pickup[1],
        pickupLng: pickup[0],
        dropoffLat: dropoff[1],
        dropoffLng: dropoff[0],
        timestamp: timestamp.toISOString(),
        vehicleType,
        rideType,
      },
    });
    return { ...response.data, city };
  } catch (err) {
    throw new Error(`Simulation failed for ${city}: ${err.message}`);
  }
}

async function automateRides() {
  const totalRides = 20000;
  const batchSize = 100;
  const existingRides = 4916;
  const ridesToGenerate = totalRides - existingRides;
  let failedRides = 0;

  console.log(`Starting simulation to add ${ridesToGenerate} rides across 4 cities (target: ${totalRides})...`);

  for (let batch = 0; batch < Math.ceil(ridesToGenerate / batchSize); batch++) {
    const batchPromises = [];
    const ridesInBatch = Math.min(batchSize, ridesToGenerate - batch * batchSize);

    for (let i = 0; i < ridesInBatch; i++) {
      const rideIndex = existingRides + batch * batchSize + i + 1;
      batchPromises.push(
        simulateRide()
          .then(ride => {
            console.log(`Ride ${rideIndex}/${totalRides}: ₹${ride.totalFare.toFixed(2)} (ID: ${ride.rideId}, City: ${ride.city})`);
          })
          .catch(err => {
            failedRides++;
            console.error(`Ride ${rideIndex} failed: ${err.message}`);
          })
      );
    }

    await Promise.all(batchPromises);
    console.log(`Batch ${batch + 1}/${Math.ceil(ridesToGenerate / batchSize)} completed. Failed rides so far: ${failedRides}`);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Increased to 2 seconds
  }

  console.log(`Simulation complete! Added ${ridesToGenerate - failedRides} rides, ${failedRides} failed, total ~${existingRides + ridesToGenerate - failedRides}.`);
}

automateRides();