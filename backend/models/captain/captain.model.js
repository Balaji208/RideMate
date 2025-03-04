const mongoose = require("mongoose");

const captainSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true
  },
  vehicle: {
    type: String, // e.g., "Toyota Camry", "Auto Rickshaw"
    required: true
  },
  vehicleNumber: {
    type: String,
    required: true,
    unique: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  rideTypeSupported: [{
    type: String,
    enum: ["economy", "premium", "luxury", "shared", "auto", "bikeTaxi"]
  }],
  isPetFriendly: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const Captain = mongoose.model("Captain", captainSchema);
module.exports = Captain;