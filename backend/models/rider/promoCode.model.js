const mongoose = require("mongoose");

const promoCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  discount: {
    type: Number, // Percentage or fixed amount
    required: true
  },
  maxUses: {
    type: Number,
    default: null // Unlimited if null
  },
  usedCount: {
    type: Number,
    default: 0
  },
  expiryDate: {
    type: Date,
    required: true
  },
  validFor: [{
    type: String,
    enum: ["all", "newUsers", "specificRideTypes"]
  }]
}, { timestamps: true });

const PromoCode = mongoose.model("PromoCode", promoCodeSchema);
module.exports = PromoCode;