// utils/captain/simulateLocation.js
const captainModel = require('../../models/captain/captain.model');

module.exports.simulateDriverMovement = async (io) => {
  const driverId = 'DRV70303914'; // Driver Anita

  // Check if driver exists, if not stop simulation
  let captain = await captainModel.findOne({ driverId });
  if (!captain) {
    throw new Error('No Driver Found with ID: ' + driverId); // Capitalized Error
  }

  // Simulation loop every 5 seconds
  setInterval(async () => {
    try {
      // Fetch the captain fresh each time to ensure latest data
      captain = await captainModel.findOne({ driverId });
      if (!captain) throw new Error('Captain disappeared during simulation');

      // Update coordinates with random walk
      const lat = captain.currentLocation.coordinates[1]; // Latitude
      const lng = captain.currentLocation.coordinates[0]; // Longitude
      const delta = 0.005; // ~50 meters
      const newLat = lat + (Math.random() > 0.5 ? delta : -delta);
      const newLng = lng + (Math.random() > 0.5 ? delta : -delta);

      // Define bounds (Chennai, India example: adjust as needed)
      const bounds = {
        minLat: 13.00,  // Southern boundary
        maxLat: 13.15,  // Northern boundary
        minLng: 80.15,  // Western boundary
        maxLng: 80.30,  // Eastern boundary
      };
      const boundedLat = Math.min(Math.max(newLat, bounds.minLat), bounds.maxLat);
      const boundedLng = Math.min(Math.max(newLng, bounds.minLng), bounds.maxLng);

      // Update location in the document
      captain.currentLocation.coordinates = [boundedLng, boundedLat];
      await captain.save(); // Save the updated document

      // Emit update via Socket.IO
      io.emit('locationUpdate', {
        driverId: captain.driverId,
        currentLocation: captain.currentLocation,
      });

      console.log(`Updated ${driverId} to [${boundedLng}, ${boundedLat}]`);
    } catch (err) {
      console.error('Simulation error:', err.message);
    }
  }, 5000); // Every 5 seconds
};