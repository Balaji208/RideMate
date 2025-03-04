const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
        match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number in E.164 format']
    },
    email: {
        type: String,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    relationship: {
        type: String,
        required: true,
        enum: ["parent", "spouse", "sibling", "friend", "other"]
    },
    priority: {
        type: Number,
        default: 1,
        min: 1
    },
    isVerified: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });
const EmergencyContact = mongoose.model("EmergencyContact", emergencyContactSchema);
module.exports = EmergencyContact;
