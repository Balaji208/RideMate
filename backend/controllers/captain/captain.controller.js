const captainModel = require("../../models/captain/captain.model");
const captainService = require("../../services/captain/captain.service");
const { validationResult } = require("express-validator");

module.exports.registerCaptain = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() }); // Bad Request
  }

  const {
    fullName,
    email,
    password,
    phone,
    licenseNumber,
    vehicle,
    documents,
    rideTypeSupported,
    isPetFriendly,
    oAuthId,
    oAuthProvider,
  } = req.body;
  //console.log(req.body);
  const { type, vehicleNumber, color, capacity } = vehicle;
  const { license, vehicleRegistration, insurance } = documents;
  const { firstname, lastname } = fullName;
  let hashedPassword;
  if (password) {
    hashedPassword = await captainModel.hashPassword(password);
  }
  // console.log(req.body)
  try {
    const captain = await captainService.createCaptain({
      firstname,
      lastname,
      email,
      password: hashedPassword,
      phone,
      licenseNumber,
      type,
      vehicleNumber,
      color,
      capacity,
      license,
      vehicleRegistration,
      insurance,
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
      return res.status(400).json({ message: "User location (lat, lng) required" });
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
      return res.status(404).json({ message: "No captains available within 10 km" });
    }

    res.json(captains); // Returns array of captains within 10 km
  } catch (error) {
    console.error("Error fetching captains:", error);
    res.status(500).json({ message: "Error fetching captains", error: error.message });
  }
};