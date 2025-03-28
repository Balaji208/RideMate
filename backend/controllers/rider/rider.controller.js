const riderModel = require("../../models/rider/rider.model");
const userService = require("../../services/rider/rider.service");
const { validationResult } = require("express-validator");

module.exports.registerUser = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { fullName, email, password, phone } = req.body;
    const { firstName, lastName } = fullName;

    try {
        const hashedPassword = password ? await riderModel.hashPassword(password) : undefined;
        const user = await userService.createUser({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            phone,
            oAuthId: null, // Default for email/password registration
            oAuthProvider: "email" // Default for email/password
        });

        const token = user.generateAuthToken();
        res.status(201).json({ user, token });
    } catch (error) {
        next(error);
    }
};

module.exports.loginUser = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    try {
        const user = await riderModel.findOne({ email }).select("+password");
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        if (user.oAuthProvider !== "email") {
            return res.status(401).json({ message: "Use your OAuth provider to log in" });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const token = user.generateAuthToken();
        res.status(200).json({ user, token });
    } catch (error) {
        next(error);
    }
};

module.exports.getUserProfile = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        res.status(200).json({ user: req.user });
    } catch (error) {
        next(error);
    }
};

module.exports.googleCallback = async (req, res, next) => {
    try {
        const user = req.user; // User object from Passport.js after Google auth
        if (!user) {
            return res.status(401).json({ message: "Authentication failed" });
        }

        // Ensure user has oAuthId and oAuthProvider set
        if (!user.oAuthId || !user.oAuthProvider) {
            user.oAuthId = user.id; // Google ID from profile
            user.oAuthProvider = "google";
            user.isVerified = true; // Google-verified users are trusted
            await user.save();
        }

        const token = user.generateAuthToken();
        res.cookie("token", token, {
            httpOnly: true,
            secure: true, // Use HTTPS in production
            sameSite: "strict"
        });
        res.redirect("http://localhost:3001/dashboard"); // Redirect to frontend
    } catch (error) {
        next(error);
    }
};