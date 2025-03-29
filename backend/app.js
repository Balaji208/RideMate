const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
const passport = require("./utils/rider/passport");
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
    origin: process.env.CLIENT_URL,  // Allows requests only from this frontend URL
    methods: ["GET", "POST", "PUT", "DELETE"],  // Only these HTTP methods are allowed
    credentials: true  // Allows cookies and authentication headers
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Configure cookie session for OAuth
app.use(cookieSession({
    name: "session",  // The name of the cookie that will store the session
    keys: [process.env.COOKIE_KEY || "ridemate"], // Key for encrypting the cookie
    maxAge: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
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
    passport.authenticate("google", { failureRedirect: "/login" }),
    riderController.googleCallback
);

module.exports = app;