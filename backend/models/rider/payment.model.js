const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
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
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ["credit", "debit", "upi", "wallet", "cash"],
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed", "refunded"],
    default: "pending"
  },
  transactionId: {
    type: String,
    unique: true,
    required: true
  },
  splitWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  promoCode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PromoCode",
    default: null
  },
  surgeMultiplier: {
    type: Number,
    default: 1.0
  }
}, { timestamps: true });

const Payment = mongoose.model("Payment", paymentSchema);
module.exports = Payment;