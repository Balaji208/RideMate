const mongoose = require("mongoose");

const rideInfoSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // Allow null for automation
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },
    pickUpLocation: {
      type: { type: String, enum: ["Point"] },
      coordinates: [Number],
    }, // Direct Point for now
    dropOffLocation: {
      type: { type: String, enum: ["Point"] },
      coordinates: [Number],
    },
    multipleStops: [
      { type: mongoose.Schema.Types.ObjectId, ref: "SavedLocation" },
    ],
    rideType: {
      type: String,
      enum: ["economy", "premium", "luxury", "shared", "auto", "bikeTaxi"],
      required: true,
    },
    fare: { type: Number, required: true },
    estimatedFare: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "inProgress", "completed", "cancelled"],
      default: "pending",
    },
    scheduledTime: { type: Date, default: null },
    startTime: { type: Date, default: null },
    endTime: { type: Date, default: null },
    isSharedRide: { type: Boolean, default: false },
    sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: "rider" }],
    rideForOthers: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "rider",
      default: null,
    },
    // Added for ML training
    distance: { type: Number },
    eta: { type: Number },
    hour: { type: Number },
    dayOfWeek: { type: Number },
    isPeak: { type: Number },
    demandFactor: { type: Number },
    vehicleType: { type: String },
  },
  { timestamps: true }
);

rideInfoSchema.index({ pickUpLocation: "2dsphere" });
module.exports = mongoose.model("rideInfo", rideInfoSchema);
