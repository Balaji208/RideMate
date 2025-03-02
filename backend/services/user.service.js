const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');

module.exports.createUser = async ({ firstName, lastName, email, password }) => {
    if (!firstName || !email || !password) {
        throw new Error('All fields are required');
    }

    
    const user = await userModel.create({
        fullName: {
            firstName,
            lastName
        },
        email,
        password: password  
    });

    return user;
};
