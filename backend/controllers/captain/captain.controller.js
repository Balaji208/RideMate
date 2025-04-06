const captainModel = require('../../models/captain/captain.model');
const captainService = require('../../services/captain/captain.service');
const { validationResult } = require('express-validator');

module.exports.registerCaptain = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() }); // Bad Request
    }
  
    const {
      fullName,
      email,
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
    const { type ,vehicleNumber,color,capacity} = vehicle;
    const { license,vehicleRegistration,insurance} = documents;
    // console.log(req.body)
    try {
      const captain = await captainService.createCaptain({
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
      });
  
      res.status(201).json({
        message: "Captain registered successfully",
        captain,
      });
    } catch (err) {
      next(err);
    }
  };