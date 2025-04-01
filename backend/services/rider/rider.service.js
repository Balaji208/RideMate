const riderModel = require("../../models/rider/rider.model");
const bcrypt = require("bcryptjs");
const twilio = require('twilio');
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

module.exports.createUser = async ({ firstName, lastName, email, phone, password, oAuthId, oAuthProvider }) => {
    if (!firstName || (!phone && !email) || (!password && !oAuthId)) {
        throw new Error("Invalid registration details. Provide phone or email, and either a password or OAuth ID.");
    }

    const userData = {
        fullName: { firstName, lastName },
        email: email || null,
        phone: phone || null,
        isVerified: false, 
    };

    if (oAuthId && oAuthProvider) {
        // OAuth User (Google, etc.)
        userData.oAuthId = oAuthId;
        userData.oAuthProvider = oAuthProvider;
        userData.isVerified = true; // OAuth users are typically verified
    } else if (email && password) {
        // Email & Password User
        userData.password = password;
        userData.oAuthProvider = "email";
    } else if (phone) {
        // Phone-based registration (OTP)
        userData.oAuthProvider = "phone";
    } else {
        throw new Error("Invalid registration method. Provide valid authentication details.");
    }

    const user = await riderModel.create(userData);
    return user;
};


// Service to send OTP
const sendOtp = async (phone) => {
    try {
        const verification = await client.verify.v2
            .services(process.env.TWILIO_VERIFY_SID)
            .verifications.create({ to: phone, channel: "sms" });
        return verification;
    } catch (error) {
        throw new Error(`Error sending OTP: ${error.message}`);
    }
};

// Service to verify OTP
const verifyOtp = async (phone, code) => {
    try {
        const verificationCheck = await client.verify.v2
            .services(process.env.TWILIO_VERIFY_SID)
            .verificationChecks.create({ to: phone, code });
        return verificationCheck;
    } catch (error) {
        throw new Error(`Error verifying OTP: ${error.message}`);
    }
};

module.exports = {
    sendOtp,
    verifyOtp
};
