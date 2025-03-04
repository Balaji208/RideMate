const mongoose = require("mongoose");

const rideSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver", 
    default: null
  },
  pickUpLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SavedLocation",
    required: true
  },
  dropOffLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SavedLocation",
    required: true
  },
  multipleStops: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "SavedLocation"
  }],
  rideType: {
    type: String,
    enum: ["economy", "premium", "luxury", "shared", "auto", "bikeTaxi"],
    required: true
  },
  fare: {
    type: Number,
    required: true
  },
  estimatedFare: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "inProgress", "completed", "cancelled"],
    default: "pending"
  },
  scheduledTime: {
    type: Date,
    default: null
  },
  startTime: {
    type: Date,
    default: null
  },
  endTime: {
    type: Date,
    default: null
  },
  isSharedRide: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  rideForOthers: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null 
  }
}, { timestamps: true });

const Ride = mongoose.model("Ride", rideSchema);
module.exports = Ride;