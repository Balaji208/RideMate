const express = require("express");
const router = express.Router();
const riderController = require("../../controllers/rider/rider.controller");
const { body } = require("express-validator");
const {authRider} = require("../../middlewares/rider/auth.middleware");
const { registerValidation } = require("../../middlewares/rider/validations/validations.registerValidation");
const { loginValidation } = require("../../middlewares/rider/validations/validations.loginValidation");

// Email/Password Registration and Login
router.post("/register", registerValidation, riderController.registerUser);

router.post("/login",loginValidation, riderController.loginUser);

// Protected route (requires JWT)
router.get("/profile", authRider, riderController.getUserProfile);

// OTP Authentication
router.get("/send-otp",riderController.sendOtp);
router.get("/verify-otp",riderController.verifyOtp);

module.exports = router;