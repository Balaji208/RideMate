const riderModel = require("../../models/rider/rider.model");
const userService = require("../../services/rider/rider.service");
const { validationResult } = require("express-validator");
const { sendWelcomeEmail } = require("../../utils/rider/sendWelcomeMail");
module.exports.registerUser = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { fullName, phone, email, password, oAuthId, oAuthProvider } = req.body;
    const { firstName, lastName } = fullName || {};

    try {
        if (!phone && !email && !oAuthId) {
            return res.status(400).json({ message: "Either phone, email, or OAuth ID is required." });
        }

        // Check if user already exists (by phone, email, or OAuth)
        const existingUser = await riderModel.findOne({ 
            $or: [{ phone }, { email }, { oAuthId }] 
        });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists." });
        }

        let hashedPassword;
        if (password) {
            hashedPassword = await riderModel.hashPassword(password);
        }

        // Determine authentication type
        const isOAuth = Boolean(oAuthId);
        const isEmailPassword = Boolean(email && password);
        const isPhoneOTP = Boolean(phone && !email && !oAuthId);

        if (!isOAuth && !isEmailPassword && !isPhoneOTP) {
            return res.status(400).json({ message: "Invalid registration method." });
        }

        // Create user
        const user = await userService.createUser({
            firstName,
            lastName,
            phone: phone || null,
            email: email || null,
            password: hashedPassword || null,
            oAuthId: oAuthId || null,
            oAuthProvider: isOAuth ? oAuthProvider || "google" : null,
        });
        if(email)
            await sendWelcomeEmail(email,firstName);
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

        // If user has an OAuth login but NO password set, force them to use OAuth
        if (user.oAuthId && !user.password) {
            return res.status(401).json({ message: "Use your OAuth provider to log in or reset your password." });
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
        
        console.log("rider contoller.js User : ",req.user);
        // Ensure user has oAuthId and oAuthProvider set
        if (!user.oAuthId || !user.oAuthProvider) {
            user.oAuthId = user.id; // Google ID from profile
            user.oAuthProvider = "google";
            user.isVerified = true; // Google-verified users are trusted
            await user.save();
            
            if(user.email){
                console.log("Send mail...",user.email," : ",user.fullName.firstName)
               
            }
        }

        const token = user.generateAuthToken();
        res.cookie("token", token, {
            httpOnly: true,  // Prevents client-side JavaScript access (security)
            secure: false,    // Ensures the cookie is sent over HTTPS (production)
            sameSite: "strict" // Prevents CSRF attacks
        });

        res.redirect(`${process.env.CLIENT_URL}/dashboard`); // Redirect to frontend
    } catch (error) {
        next(error);
    }
};

// Controller to send OTP
module.exports.sendOtp = async (req, res) => {
    const { phone } = req.body;
    try {
        const verification = await otpService.sendOtp(phone);
        res.json({ success: true, status: verification.status });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Controller to verify OTP
module.exports.verifyOtp = async (req, res) => {
    const { phone, code } = req.body;
    try {
        const verificationCheck = await otpService.verifyOtp(phone, code);

        if (verificationCheck.status === "approved") {
            res.json({ success: true, message: "OTP Verified!" });
        } else {
            res.status(400).json({ success: false, message: "Invalid OTP!" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
