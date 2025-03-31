const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const passport = require("./utils/rider/passport");
const connectToDb = require("./db/db");
const riderRoutes = require("./routes/rider/rider.routes");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const riderModel = require("./models/rider/rider.model");
const riderController = require("./controllers/rider/rider.controller");
const twilio = require("twilio");



// Initialize Express app
const app = express();

// Connect to the database
connectToDb();

// Middleware setup
app.use(cors({
    origin: process.env.CLIENT_URL,  // Allows requests only from this frontend URL
    methods: ["GET", "POST", "PUT", "DELETE"],  // Only these HTTP methods are allowed
    credentials: true  // Allows cookies and authentication headers
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Configure cookie session for OAuth

app.use(session({
    secret: process.env.SESSION_SECRET || "ridemate", // Use a strong secret
    resave: false,  // Don't save session if nothing changed
    saveUninitialized: false, // Don't create session until something is stored
    cookie: {
        secure: process.env.NODE_ENV === "PRODUCTION", // Secure only in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.get("/", (req, res) => {
    res.send("Hello World");
});

app.use("/users", riderRoutes); // riders mounted with /users

// Google OAuth routes
app.get("/auth/google", passport.authenticate(
    "google",
     { scope: ["email", "profile"] , prompt : "consent"}
));

app.get("/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    riderController.googleCallback
);

// OTP Verfication
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
app.post("/send-otp", async (req, res) => {
    const { phone } = req.body;
    try {
        const verification = await client.verify.v2
            .services(process.env.TWILIO_VERIFY_SID)
            .verifications.create({ to: phone, channel: "sms" });

        res.json({ success: true, status: verification.status });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post("/verify-otp", async (req, res) => {
    const { phone, code } = req.body;
    try {
        const verificationCheck = await client.verify.v2
            .services(process.env.TWILIO_VERIFY_SID)
            .verificationChecks.create({ to: phone, code });

        if (verificationCheck.status === "approved") {
            res.json({ success: true, message: "OTP Verified!" });
        } else {
            res.status(400).json({ success: false, message: "Invalid OTP!" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = app;