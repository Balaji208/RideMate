const express = require("express");
const router = express.Router();
const riderController = require("../../controllers/rider/rider.controller");
const { body } = require("express-validator");
const {authRider} = require("../../middlewares/rider/auth.middleware");

// Email/Password Registration and Login
router.post("/register", [
    body("email").isEmail().withMessage("Invalid Email Address"),
    body("fullName.firstName").isLength({ min: 3 }).withMessage(
        "First name must be at least 3 characters long."
    ),
    body("phone").isLength({ min: 10 }).withMessage(
        "Phone number must be at least 10 characters long."
    ),
    body("password").if(body("oAuthId").not().exists()).isLength({ min: 6 }).withMessage(
        "Password must be at least 6 characters long."
    ) // Only validate password if no oAuthId
], riderController.registerUser);

router.post("/login", [
    body("email").isEmail().withMessage("Invalid Email Address"),
    body("password").if(body("oAuthId").not().exists()).isLength({ min: 6 }).withMessage(
        "Password must be at least 6 characters long."
    ) // Only validate password if no oAuthId
], riderController.loginUser);

// Protected route (requires JWT)
router.get("/profile", authRider, riderController.getUserProfile);

// Google OAuth routes
router.get("/auth/google", riderController.googleCallback); // Simplified for this example (use Passport in app.js)

module.exports = router;