const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    fullName: {
        firstName: {
            type: String,
            required: 'First name cannot be left blank.',
            minlength : [3,'First name must be at least 3 characters long.']
        },
        lastName: {
            type: String,
            minlength : [3,'Last name must be at least 3 characters long.']
        },
    },
    email :{
        type: String,
        required: 'Email cannot be left blank.',
        unique: true

    },
    password :{
        type: String,
        required: 'Password cannot be left blank.',
        minlength : [6,'Password must be at least 6 characters long.']
    },
    socketID :{
        type: String
    },

});

userSchema.methods.generateAuthToken = function(){
    const user = this;
    const token = jwt.sign({_id: user._id}, process.env.JWT_SECRET);
    return token;
}

userSchema.methods.comparePassword = async function(password){
    const user = this;
    return await bcrypt.compare(password, user.password);
}

userSchema.statics.hashPassword = async function(password){
    return await bcrypt.hash(password, 10);
}

const userModel = mongoose.model('user', userSchema);

module.exports = userModel;