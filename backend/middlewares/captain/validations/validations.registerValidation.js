const { body, validationResult } = require("express-validator");
const captainModel = require("../../../models/captainModel/captainModel.model");

const registerValidation = [
  // Email validation
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .trim()
    .normalizeEmail()
    .custom(async (value) => {
      const existingcaptainModel = await captainModel.findOne({ email: value });
      if (existingcaptainModel) {
        throw new Error("Email is already registered");
      }
      return true;
    }),

  // Phone number validation
  body("phone")
    .isString()
    .withMessage("Phone number must be a string")
    .matches(/^\+[1-9]\d{1,14}$/)
    .withMessage("Phone number must be in E.164 format (e.g., +919876543210)")
    .custom(async (value) => {
      const existingcaptainModel = await captainModel.findOne({ phone: value });
      if (existingcaptainModel) {
        throw new Error("Phone number is already registered");
      }
      return true;
    }),

  // License number validation
  body("licenseNumber")
    .isString()
    .withMessage("License number must be a string")
    .isLength({ min: 5, max: 20 })
    .withMessage("License number must be between 5 and 20 characters")
    .trim()
    .custom(async (value) => {
      const existingcaptainModel = await captainModel.findOne({
        licenseNumber: value,
      });
      if (existingcaptainModel) {
        throw new Error("License number is already registered");
      }
      return true;
    }),

  // Vehicle validation (nested object)
  body("vehicle").notEmpty().withMessage("Vehicle details are required"),

  body("vehicle.type")
    .isString()
    .withMessage("Vehicle type must be a string")
    .isIn([
      "Sedan",
      "SUV",
      "Hatchback",
      "Auto Rickshaw",
      "Bike",
      "Van",
      "Luxury Car",
    ])
    .withMessage("Invalid vehicle type"),

  body("vehicle.vehicleNumber")
    .isString()
    .withMessage("Vehicle number must be a string")
    .matches(/^[A-Z0-9-]{5,15}$/)
    .withMessage(
      "Vehicle number must be 5-15 characters long and contain only letters, numbers, or hyphens"
    )
    .trim()
    .custom(async (value) => {
      const existingcaptainModel = await captainModel.findOne({
        "vehicle.vehicleNumber": value,
      });
      if (existingcaptainModel) {
        throw new Error("Vehicle number is already registered");
      }
      return true;
    }),

  body("vehicle.color")
    .isString()
    .withMessage("Vehicle color must be a string")
    .isLength({ max: 20 })
    .withMessage("Vehicle color cannot exceed 20 characters")
    .trim(),

  body("vehicle.capacity")
    .isInt({ min: 1, max: 20 })
    .withMessage("Vehicle capacity must be a number between 1 and 20"),

  // Documents validation
  body("documents").notEmpty().withMessage("Documents are required"),

  body("documents.license")
    .isString()
    .withMessage("License document URL must be a string")
    .trim(),
  body("documents.vehicleRegistration")
    .isString()
    .withMessage("Vehicle registration document URL must be a string")
    .trim(),
  body("documents.insurance")
    .isString()
    .withMessage("Insurance document URL must be a string")
    .trim(),

  // Ride types supported validation
  body("rideTypeSupported")
    .isArray({ min: 1 })
    .withMessage("At least one ride type must be supported")
    .custom((value) => {
      const validRideTypes = [
        "economy",
        "premium",
        "luxury",
        "shared",
        "auto",
        "bikeTaxi",
      ];
      const invalidRideTypes = value.filter(
        (type) => !validRideTypes.includes(type)
      );
      if (invalidRideTypes.length > 0) {
        throw new Error(`Invalid ride types: ${invalidRideTypes.join(", ")}`);
      }
      return true;
    }),

  // Optional fields
  body("isPetFriendly")
    .optional()
    .isBoolean()
    .withMessage("isPetFriendly must be a boolean"),

  // Middleware to handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

module.exports = registerValidation;
