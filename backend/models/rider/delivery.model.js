const mongoose = require("mongoose");

const deliverySchema = new mongoose.Schema({
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
  packageDescription: {
    type: String,
    required: true
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
  status: {
    type: String,
    enum: ["pending", "inTransit", "delivered", "cancelled"],
    default: "pending"
  }
}, { timestamps: true });

const Delivery = mongoose.model("Delivery", deliverySchema);
module.exports = Delivery;