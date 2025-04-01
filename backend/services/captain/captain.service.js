const captainModel = require("../../models/captain/captain.model");
const bcrypt = require("bcryptjs");
const twilio = require("twilio");
const generateUniqueDriverId = require("../../utils/captain/generateUniqueId");
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

module.exports.createCaptain = async({
  email,
  password,
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
}) =>{
    if (
        !userId ||
        !email ||
        !phone ||
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
        throw new Error("Invalid registration details. All fields are required.");
      }

    const driverId = await generateUniqueDriverId();
    const captainData = {
        email : email,
        password :password,
        phone : phone,
        driverId : driverId ,
        licenseNumber : licenseNumber,
        vechicle :{
            type : type,
            vehicleNumber : vehicleNumber,
            color : color,
            capacity : capacity,
        },
        documents : {
            license : license,
            vehicleRegistration : vehicleRegistration,
            insurance : insurance,
        },
        rideTypeSupported : rideTypeSupported,
        isPetFriendly : isPetFriendly || false,
        joinedAt : Date.now(),
        isVerified: false,
        status: "inactive",
        isAvailable: false,

    }
    if (oAuthId && oAuthProvider) {
        // OAuth User (Google, etc.)
        captainData.oAuthId = oAuthId;
        captainData.oAuthProvider = oAuthProvider;
        captainData.isVerified = true; // OAuth users are typically verified
    }
    else if (email && password) {
        // Email & Password User
        captainData.password = password;
        captainData.oAuthProvider = "email";
    } else if (phone) {
        // Phone-based registration (OTP)
        captainData.oAuthProvider = "phone";
    } else {
        throw new Error("Invalid registration method. Provide valid authentication details.");
    }
    try {
        const captain = await Captain.create(captainData);
            return captain;
    } 
    catch (error) {
        if (error.name === "MongoServerError" && error.code === 11000) {
          throw new Error("Duplicate key error: " + JSON.stringify(error.keyValue));
        }
        throw new Error("Error creating captain: " + error.message);
    }
};
