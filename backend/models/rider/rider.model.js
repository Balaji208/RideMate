const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const riderSchema = new mongoose.Schema({
    fullName: {
        firstName: {
            type: String,
            required: 'First name cannot be left blank.',
            minlength: [3, 'First name must be at least 3 characters long.']
        },
        lastName: {
            type: String,
            minlength: [3, 'Last name must be at least 3 characters long.']
        },
    },
    email: {
        type: String,
        required: 'Email cannot be left bl ank.',
        unique: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    phone: {
        type: String,
        required: 'Phone number cannot be left blank.',
        unique: true,
        minlength : 10
    },
    password: {
        type: String,
        required: 'Password cannot be left blank.',
        minlength: [6, 'Password must be at least 6 characters long.'],
        select: false
    },
    profilePic: {
        type: String,
        default: "https://default-profile-pic-url.com/default.jpg",
        match: [/^https?:\/\/[^\s/$.?#].[^\s]*$/i, 'Please enter a valid URL for the profile picture']
    },
    walletBalance: {
        type: Number,
        default: 0
    },
    rewardCoins: {
        type: Number,
        default: 0
    },
    referralCode: {
        type: String,
        unique: true,
        default: function() {
            return uuidv4().slice(0, 8);
        }
    },
    referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    preferredLanguage: {
        type: String,
        default: "en",
        enum: ["en", "es", "fr", "hi", "ta"]
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    savedLocations: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "SavedLocation"
    }],
    emergencyContacts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "EmergencyContact"
    }]
}, { timestamps: true });



riderSchema.methods.generateAuthToken = function () {
    return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

riderSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
}

riderSchema.statics.hashPassword = async function (password) {
    return await bcrypt.hash(password, 10);
}

const riderModel = mongoose.model('Rider', riderSchema);
module.exports = riderModel;
