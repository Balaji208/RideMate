const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
const passport = require("passport");
const connectToDb = require("./db/db");
const riderRoutes = require("./routes/rider/rider.routes");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const riderModel = require("./models/rider/rider.model");
const riderController = require("./controllers/rider/rider.controller");
// Initialize Express app
const app = express();

// Connect to the database
connectToDb();

// Middleware setup
app.use(cors({
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Configure cookie session for OAuth
app.use(cookieSession({
    name: "session",
    keys: [process.env.COOKIE_KEY || "ridemate"], // Use environment variable for security
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
    clientID: process.env.OAUTH_CLIENT_ID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
    callbackURL: process.env.OAUTH_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Find or create user based on Google profile
        let user = await riderModel.findOne({ oAuthId: profile.id });
        if (!user) {
            // Create new user if not found
            user = await riderModel.create({
                fullName: {
                    firstName: profile.name.givenName || "",
                    lastName: profile.name.familyName || ""
                },
                email: profile.emails[0].value,
                oAuthProvider: "google",
                oAuthId: profile.id,
                isVerified : true // OAuth users are typically verified
            });
        }
        return done(null, user);
    } catch (error) {
        console.error("Error in GoogleStrategy:", error);
        return done(error, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user._id); // Serialize user ID for session
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await riderModel.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// Routes
app.get("/", (req, res) => {
    res.send("Hello World");
});

app.use("/users", riderRoutes);

// Google OAuth routes
app.get("/auth/google", passport.authenticate("google", { scope: ["email", "profile"] , prompt : "consent"}));

app.get("/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    riderController.googleCallback
);

module.exports = app;