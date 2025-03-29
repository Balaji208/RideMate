const riderModel = require("../../models/rider/rider.model");
const bcrypt = require("bcryptjs");

module.exports.createUser = async ({ firstName, lastName, email, phone, password, oAuthId, oAuthProvider }) => {
    if (!firstName || (!phone && !email) || (!password && !oAuthId)) {
        throw new Error("Invalid registration details. Provide phone or email, and either a password or OAuth ID.");
    }

    const userData = {
        fullName: { firstName, lastName },
        email: email || null,
        phone: phone || null,
        isVerified: false, // Default verification status
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
