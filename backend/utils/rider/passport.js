const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const riderModel = require("../../models/rider/rider.model");
const { sendWelcomeEmail } = require("./sendWelcomeMail");

passport.use(new GoogleStrategy(
    {
        clientID: process.env.OAUTH_CLIENT_ID,
        clientSecret: process.env.OAUTH_CLIENT_SECRET,
        callbackURL: process.env.OAUTH_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
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
                    isVerified: true // OAuth users are typically verified
                });
                await sendWelcomeEmail(user.email,user.fullName.firstName);
            }
            return done(null, user);
        } catch (error) {
            console.error("❌ Error in GoogleStrategy:", error);
            return done(error, null);
        }
    }
));

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

module.exports = passport;
