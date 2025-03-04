const riderModel = require('../../models/rider/rider.model');
const bcrypt = require('bcryptjs');

module.exports.createUser = async ({ firstName, lastName, email, phone, password }) => {
    if (!firstName || !email || !password || !phone) {
        throw new Error('All fields are required');
    }

    
    const user = await riderModel.create({
        fullName: {
            firstName,
            lastName
        },
        email,
        password: password ,
        phone : phone 
    });

    return user;
};
