const mongoose = require("mongoose");

const safetyEventSchema = new mongoose.Schema({
  ride: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ride",
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  type: {
    type: String,
    enum: ["sos", "liveShare", "audioRecording"],
    required: true
  },
  details: {
    type: String, // e.g., SOS message, shared location URL, audio file URL
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  emergencyContactsNotified: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "EmergencyContact"
  }]
}, { timestamps: true });

const SafetyEvent = mongoose.model("SafetyEvent", safetyEventSchema);
module.exports = SafetyEvent;