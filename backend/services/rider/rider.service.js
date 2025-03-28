const riderModel = require("../../models/rider/rider.model");
const bcrypt = require("bcryptjs");

module.exports.createUser = async ({ firstName, lastName, email, phone, password, oAuthId, oAuthProvider }) => {
    if (!firstName || !email || !phone || (!password && !oAuthId)) {
        throw new Error("All required fields are missing");
    }

    const userData = {
        fullName: {
            firstName,
            lastName
        },
        email,
        phone
    };

    if (oAuthId && oAuthProvider) {
        // OAuth user (no password needed)
        userData.oAuthId = oAuthId;
        userData.oAuthProvider = oAuthProvider;
        userData.isVerified = true; // OAuth users are typically verified
    } else {
        // Email/password user
        if (!password) 
            throw new Error("Password is required for email/password registration");
        userData.password = password;
        userData.oAuthProvider = "email";
    }

    const user = await riderModel.create(userData);
    return user;
};