const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver",
    required: true
  },
  ride: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ride",
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    default: ""
  }
}, { timestamps: true });

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;