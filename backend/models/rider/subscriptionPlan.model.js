const mongoose = require("mongoose");

const subscriptionPlanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  planType: {
    type: String,
    enum: ["monthlyPass", "discountPlan"],
    required: true
  },
  ridesAllowed: {
    type: Number,
    required: true
  },
  discountPercentage: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ["active", "expired", "cancelled"],
    default: "active"
  }
}, { timestamps: true });

const SubscriptionPlan = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
module.exports = SubscriptionPlan;