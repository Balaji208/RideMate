const axios = require('axios');
const captainModel = require('../../models/captain/captain.model');
const captainService = require('../../services/captain/captain.service');
const { validationResult } = require('express-validator');
const Ride = require('../../models/rider/rideInfo.model'); // Adjusted to match your rideInfo.js; verify path
const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY;

module.exports.registerCaptain = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() }); // Bad Request
  }

  const {
    fullName,
    gender,
    email,
    password,
    phone,
    licenseNumber,
    vehicle,
    // documents,
    city,
    rideTypeSupported,
    isPetFriendly,
    oAuthId,
    oAuthProvider,
  } = req.body;
  //console.log(req.body);
  const { type, vehicleNumber, color, capacity } = vehicle;
  //const { license, vehicleRegistration, insurance } = documents; // commented for test data registrations
  const { firstName, lastName } = fullName;
  let hashedPassword;
  if (password) {
    hashedPassword = await captainModel.hashPassword(password);
  }
  // console.log(req.body)
  try {
    const captain = await captainService.createCaptain({
      firstName,
      lastName,
      gender,
      email,
      password: hashedPassword,
      phone,
      licenseNumber,
      type,
      vehicleNumber,
      color,
      capacity,
      city,
      // license,
      // vehicleRegistration,
      // insurance,
      rideTypeSupported,
      isPetFriendly,
      oAuthId,
      oAuthProvider,
    });

    res.status(201).json({
      message: "Captain registered successfully",
      captain,
    });
  } catch (err) {
    next(err);
  }
};

module.exports.getCaptains = async (req, res) => {
  try {
    const { lat, lng } = req.query; // User's location from query params
    if (!lat || !lng) {
      return res
        .status(400)
        .json({ message: "User location (lat, lng) required" });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    if (isNaN(userLat) || isNaN(userLng)) {
      return res.status(400).json({ message: "Invalid latitude or longitude" });
    }

    // 10 km radius in radians (Earth radius = 6371 km)
    const radiusInRadians = 10 / 6371;

    const captains = await captainModel.find({
      isAvailable: true,
      currentLocation: {
        $geoWithin: {
          $centerSphere: [[userLng, userLat], radiusInRadians], // [lng, lat] order for MongoDB
        },
      },
    });

    if (captains.length === 0) {
      return res
        .status(404)
        .json({ message: "No captains available within 10 km" });
    }

    res.json(captains); // Returns array of captains within 10 km
  } catch (error) {
    console.error("Error fetching captains:", error);
    res
      .status(500)
      .json({ message: "Error fetching captains", error: error.message });
  }
};

async function fetchRoute(pickupLat, pickupLng, dropoffLat, dropoffLng, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(
        `https://api.geoapify.com/v1/routing?waypoints=${pickupLat},${pickupLng}|${dropoffLat},${dropoffLng}&mode=drive&traffic=approximated&type=short&apiKey=${GEOAPIFY_API_KEY}`,
        { timeout: 10000 } // Increased to 10 seconds
      );
      const routeData = response.data?.features?.[0]?.properties?.legs?.[0];
      if (!routeData) throw new Error('Invalid Geoapify response format');
      return { distance: routeData.distance / 1000, eta: routeData.time / 60 };
    } catch (error) {
      if (attempt === retries) throw error; // Last attempt failed
      console.warn(`Geoapify attempt ${attempt}/${retries} failed: ${error.message}. Retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff: 1s, 2s, 3s
    }
  }
}

module.exports.predictFare = async (req, res) => {
  try {
    const { pickupLat, pickupLng, dropoffLat, dropoffLng, timestamp, vehicleType, rideType } = req.query;

    // Input validation (unchanged from previous enhancement)
    const params = { pickupLat, pickupLng, dropoffLat, dropoffLng, timestamp, vehicleType, rideType };
    if (Object.values(params).some(v => v === undefined || v === null || v === '')) {
      return res.status(400).json({ message: 'All parameters required' });
    }
    const latLngFields = { pickupLat, pickupLng, dropoffLat, dropoffLng };
    for (const [key, value] of Object.entries(latLngFields)) {
      const num = parseFloat(value);
      if (isNaN(num) || num < -180 || num > 180) {
        return res.status(400).json({ message: `${key} must be a valid number between -180 and 180` });
      }
    }
    const date = new Date(timestamp);
    if (isNaN(date.getTime()) || date > new Date()) {
      return res.status(400).json({ message: 'Invalid or future timestamp' });
    }
    const validVehicleTypes = ['Sedan', 'SUV', 'Hatchback', 'Auto Rickshaw', 'Bike', 'Van', 'Luxury Car'];
    const validRideTypes = ['economy', 'premium', 'luxury', 'shared', 'auto', 'bikeTaxi'];
    if (!validVehicleTypes.includes(vehicleType) || !validRideTypes.includes(rideType.toLowerCase())) {
      return res.status(400).json({ message: 'Invalid vehicleType or rideType' });
    }

    // Geoapify routing with retries
    if (!GEOAPIFY_API_KEY) return res.status(503).json({ message: 'Geoapify API key not configured' });
    const { distance, eta } = await fetchRoute(pickupLat, pickupLng, dropoffLat, dropoffLng);
    if (distance <= 0 || eta <= 0) {
      return res.status(400).json({ message: 'Invalid route: distance or ETA is zero or negative' });
    }

    // Time features
    const hour = date.getHours();
    const dayOfWeek = date.getDay();
    const isPeak = [7, 8, 9, 10, 17, 18, 19, 20, 21].includes(hour) ? 1 : 0;
    const timeFactor = isPeak ? 1.2 : 1;

    // Demand simulation
    const captains = Math.floor(Math.random() * 10) + 1;
    const requests = Math.floor(Math.random() * 15);
    const demandFactor = requests / (captains || 1);
    const surge = Math.min(1.5, Math.max(1, 1 + demandFactor));

    // Fare calculation
    const vehicleTypeMultiplier = {
      Sedan: 11, SUV: 8, Hatchback: 20, 'Auto Rickshaw': 18, Bike: 4, Van: 17, 'Luxury Car': 40,
    };
    const rideTypeMultipliers = { economy: 1, premium: 1.5, luxury: 2, shared: 0.7, auto: 1.2, bikeTaxi: 0.8 };
    const vehicleRate = vehicleTypeMultiplier[vehicleType] || 10;
    const rideFactor = rideTypeMultipliers[rideType.toLowerCase()] || 1;
    const adjustedBaseFare = 20 + distance * vehicleRate + eta * 1;
    const totalFare = Math.max(20, adjustedBaseFare * timeFactor * surge * rideFactor);

    // Log ride asynchronously
    const ride = new Ride({
      user: null,
      driver: null,
      pickUpLocation: { type: 'Point', coordinates: [parseFloat(pickupLng), parseFloat(pickupLat)] },
      dropOffLocation: { type: 'Point', coordinates: [parseFloat(dropoffLng), parseFloat(dropoffLat)] },
      rideType: rideType.toLowerCase(),
      fare: totalFare,
      estimatedFare: totalFare,
      status: 'completed',
      scheduledTime: date,
      distance,
      eta,
      hour,
      dayOfWeek,
      isPeak,
      demandFactor,
      vehicleType,
    });
    ride.save().catch(err => console.error('Failed to save ride:', err.message));

    res.json({ rideId: ride._id, distance, eta, surge, vehicleType, rideType, totalFare });
  } catch (error) {
    console.error('Fare prediction error:', error);
    res.status(500).json({ message: 'Internal server error predicting fare', error: error.message });
  }
};