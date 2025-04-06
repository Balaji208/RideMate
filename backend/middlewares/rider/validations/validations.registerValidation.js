const { body } = require("express-validator");
const riderModel = require('../../../models/rider/rider.model')
const registerValidation = [
    // Email validation (required for email OTP)
    body("email")
      .custom((value, { req }) => {
        if (req.body.oAuthProvider === "email" && !value) {
          throw new Error("Email is required for email OTP authentication");
        }
        return true;
      })
      .optional({ nullable: true })
      .isEmail()
      .withMessage("Please provide a valid email address")
      .trim()
      .normalizeEmail()
      .custom(async (value, { req }) => {
        if (value) {
          const existingRider = await riderModel.findOne({ email: value });
          if (existingRider) {
            throw new Error("Email is already registered");
          }
        }
        return true;
      }),
  
    // Phone number validation (required for phone OTP)
    body("phone")
      .custom((value, { req }) => {
        if (req.body.oAuthProvider === "phone" && !value) {
          throw new Error("Phone number is required for phone OTP authentication");
        }
        return true;
      })
      .optional({ nullable: true })
      .isLength({ min: 10, max: 15 })
      .withMessage("Phone number must be between 10 to 15 digits")
      .matches(/^\+[1-9]\d{9,14}$/)
      .withMessage("Phone number must be in E.164 format (e.g., +919876543210)")
      .custom(async (value, { req }) => {
        if (value) {
          const existingRider = await riderModel.findOne({ phone: value });
          if (existingRider) {
            throw new Error("Phone number is already registered");
          }
        }
        return true;
      })
      .trim(),
  
    // OAuth ID validation (required for email/phone OTP, e.g., OTP token)
    body("oAuthId")
      .custom((value, { req }) => {
        if (["email", "phone"].includes(req.body.oAuthProvider) && !value) {
          throw new Error("OAuth ID (OTP token) is required for email or phone authentication");
        }
        return true;
      })
      .optional({ nullable: true })
      .trim()
      .custom(async (value) => {
        if (value) {
          const existingRider = await riderModel.findOne({ oAuthId: value });
          if (existingRider) {
            throw new Error("OTP token is already registered");
          }
        }
        return true;
      }),
  
    // OAuth provider validation (required, restricted to email/phone)
    body("oAuthProvider")
      .notEmpty()
      .withMessage("OAuth provider is required")
      .isIn(["email", "phone"])
      .withMessage("OAuth provider must be 'email' or 'phone'"),
  
    // First name validation (required, enforce length)
    body("fullName.firstName")
      .notEmpty()
      .withMessage("First name is required")
      .trim()
      .isLength({ min: 3 })
      .withMessage("First name must be at least 3 characters long."),
  
    // Last name validation (required, enforce length)
    body("fullName.lastName")
      .notEmpty()
      .withMessage("Last name is required")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Last name must be at least 1 characters long."),
  
   
    
  ];
module.exports = { registerValidation };
  