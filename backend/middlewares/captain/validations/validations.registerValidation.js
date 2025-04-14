const { body, validationResult } = require('express-validator');
const captainModel = require('../../../models/captain/captain.model');

// City bounds (for reference, used in schema/seeding, not registration)
const cityBounds = {
  chennai: { minLng: 80.15, maxLng: 80.35, minLat: 12.95, maxLat: 13.15 },
  coimbatore: { minLng: 76.90, maxLng: 77.10, minLat: 10.90, maxLat: 11.10 },
  salem: { minLng: 78.00, maxLng: 78.20, minLat: 11.60, maxLat: 11.80 },
  madurai: { minLng: 78.00, maxLng: 78.20, minLat: 9.80, maxLat: 10.00 },
};

const registerValidation = [
  // First name validation
  body('fullName.firstName')
    .notEmpty()
    .withMessage('First name is required')
    .trim()
    .isLength({ min: 3 })
    .withMessage('First name must be at least 3 characters long.'),

  // Last name validation (optional)
  body('fullName.lastName')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Last name must be at least 1 character long.'),

  // Email validation (optional, unique)
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .trim()
    .normalizeEmail()
    .custom(async (value) => {
      const existingCaptain = await captainModel.findOne({ email: value });
      if (existingCaptain) {
        throw new Error('Email is already registered');
      }
      return true;
    }),

  // Phone number validation
  body('phone')
    .isString()
    .withMessage('Phone number must be a string')
    .matches(/^\+[1-9]\d{1,14}$/)
    .withMessage('Phone number must be in E.164 format (e.g., +919876543210)')
    .custom(async (value) => {
      const existingCaptain = await captainModel.findOne({ phone: value });
      if (existingCaptain) {
        throw new Error('Phone number is already registered');
      }
      return true;
    }),

  // License number validation
  body('licenseNumber')
    .isString()
    .withMessage('License number must be a string')
    .isLength({ min: 5, max: 20 })
    .withMessage('License number must be between 5 and 20 characters')
    .trim()
    .custom(async (value) => {
      const existingCaptain = await captainModel.findOne({ licenseNumber: value });
      if (existingCaptain) {
        throw new Error('License number is already registered');
      }
      return true;
    }),

  // Vehicle validation
  body('vehicle').notEmpty().withMessage('Vehicle details are required'),

  body('vehicle.type')
    .isString()
    .withMessage('Vehicle type must be a string')
    .isIn(['Sedan', 'SUV', 'Hatchback', 'Auto Rickshaw', 'Bike', 'Van', 'Luxury Car'])
    .withMessage('Invalid vehicle type'),

  body('vehicle.vehicleNumber')
    .isString()
    .withMessage('Vehicle number must be a string')
    .matches(/^[A-Z0-9-]{5,15}$/)
    .withMessage('Vehicle number must be 5-15 characters long and contain only letters, numbers, or hyphens')
    .trim()
    .custom(async (value) => {
      const existingCaptain = await captainModel.findOne({ 'vehicle.vehicleNumber': value });
      if (existingCaptain) {
        throw new Error('Vehicle number is already registered');
      }
      return true;
    }),

  body('vehicle.color')
    .isString()
    .withMessage('Vehicle color must be a string')
    .isLength({ max: 20 })
    .withMessage('Vehicle color cannot exceed 20 characters')
    .trim(),

  body('vehicle.capacity')
    .isInt({ min: 1, max: 20 })
    .withMessage('Vehicle capacity must be a number between 1 and 20'),

  // Documents validation (optional)
  body('documents')
    .optional()
    .isObject()
    .withMessage('Documents must be an object'),

  body('documents.license')
    .optional()
    .isString()
    .withMessage('License document URL must be a string')
    .trim(),

  body('documents.vehicleRegistration')
    .optional()
    .isString()
    .withMessage('Vehicle registration document URL must be a string')
    .trim(),

  body('documents.insurance')
    .optional()
    .isString()
    .withMessage('Insurance document URL must be a string')
    .trim(),

  // Ride types supported validation
  body('rideTypeSupported').custom((value) => {
    const validRideTypes = ['economy', 'premium', 'luxury', 'shared', 'auto', 'bikeTaxi'];
    let rideTypes = value;
    if (typeof value === 'string') {
      try {
        rideTypes = JSON.parse(value);
      } catch (e) {
        rideTypes = [value];
      }
    }
    if (!Array.isArray(rideTypes) || rideTypes.length === 0) {
      throw new Error('At least one ride type must be supported');
    }
    const invalidRideTypes = rideTypes.filter((type) => !validRideTypes.includes(type));
    if (invalidRideTypes.length > 0) {
      throw new Error(`Invalid ride types: ${invalidRideTypes.join(', ')}`);
    }
    return true;
  }),

  // City validation
  body('city')
    .notEmpty()
    .withMessage('City is required')
    .isIn(['Chennai', 'Coimbatore', 'Salem', 'Madurai'])
    .withMessage('City must be chennai, coimbatore, salem, or madurai'),

  // OAuth validation
  body('oAuthId')
    .notEmpty()
    .withMessage('OAuth ID is required')
    .isString()
    .withMessage('OAuth ID must be a string')
    .custom(async (value) => {
      const existingCaptain = await captainModel.findOne({ oAuthId: value });
      if (existingCaptain) {
        throw new Error('OAuth ID is already registered');
      }
      return true;
    }),

  body('oAuthProvider')
    .notEmpty()
    .withMessage('OAuth provider is required')
    .isIn(['google', 'phone', 'email'])
    .withMessage('OAuth provider must be google, phone, or email'),

  // Optional fields
  body('isPetFriendly')
    .optional()
    .isBoolean()
    .withMessage('isPetFriendly must be a boolean'),

  // Validation error middleware
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

module.exports = { registerValidation };