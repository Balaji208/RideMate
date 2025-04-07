const captainModel = require("../../models/captain/captain.model");
const bcrypt = require("bcryptjs");
const twilio = require("twilio");
const generateUniqueDriverId = require("../../utils/captain/generateUniqueId");
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
 
module.exports.createCaptain = async ({
    firstname,
    lastname,
    password,
    email,
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
  }) => {
    // Validation
    if (
      !phone || // Required for all
      !licenseNumber ||
      !type ||
      !vehicleNumber ||
      !color ||
      !capacity ||
      !license ||
      !vehicleRegistration ||
      !insurance ||
      !rideTypeSupported ||
      rideTypeSupported.length === 0
    ) {
      
      throw new Error("Invalid registration details. All required fields must be provided.");
    }
  
    // Validate email if provided
    if (email && !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      throw new Error("Please provide a valid email address");
    }
  
    // Validate phone format
    if (!/^\+[1-9]\d{1,14}$/.test(phone)) {
      throw new Error("Phone number must be in E.164 format (e.g., +919876543210)");
    }
  
    // Validate vehicle type
    const validVehicleTypes = ["Sedan", "SUV", "Hatchback", "Auto Rickshaw", "Bike", "Van", "Luxury Car"];
    if (!validVehicleTypes.includes(type)) {
      throw new Error(`Invalid vehicle type. Must be one of: ${validVehicleTypes.join(", ")}`);
    }
  
    // Validate capacity
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 20) {
      throw new Error("Vehicle capacity must be a number between 1 and 20");
    }
  
    // Validate ride types
    const validRideTypes = ["economy", "premium", "luxury", "shared", "auto", "bikeTaxi"];
    const invalidRideTypes = rideTypeSupported.filter((type) => !validRideTypes.includes(type));
    if (invalidRideTypes.length > 0) {
      throw new Error(`Invalid ride types: ${invalidRideTypes.join(", ")}`);
    }
  
   
  
    // Validate oAuthProvider
    if (!oAuthId || !oAuthProvider || !["google", "phone"].includes(oAuthProvider)) {
      throw new Error("Invalid registration method. OAuth ID and provider (google or phone) are required.");
    }
  
    // Generate unique driverId
    const driverId = await generateUniqueDriverId();
  
    // Construct captainData
    const captainData = {
      fullname :{
        firstname,
        lastname
      },
      email: email || null,
      password,
      phone,
      driverId,
      licenseNumber,
      vehicle: {
        type,
        vehicleNumber,
        color,
        capacity,
      },
      documents: {
        license,
        vehicleRegistration,
        insurance,
      },
      rideTypeSupported,
      isPetFriendly: isPetFriendly || false,
      joinedAt: Date.now(),
      isVerified: true, // Verified via Firebase
      status: "inactive",
      isAvailable: false,
      oAuthId,
      oAuthProvider,
    };
  
    try {
      const captain = await captainModel.create(captainData);
      return captain;
    } catch (error) {
      if (error.name === "MongoServerError" && error.code === 11000) {
        throw new Error("Duplicate key error: " + JSON.stringify(error.keyValue));
      }
      throw new Error("Error creating captain: " + error.message);
    }
  };