const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const riderSchema = new mongoose.Schema(
    {
      fullName: {
        firstName: {
          type: String,
          trim: true,
          validate: {
            validator: function (value) {
              return !value || (value && value.length >= 3); // Allow empty but enforce min length if provided
            },
            message: "First name must be at least 3 characters long.",
          },
        },
        lastName: {
          type: String,
          trim: true,
          validate: {
            validator: function (value) {
              return !value || (value && value.length >= 1); // Allow empty but enforce min length if provided
            },
            message: "Last name must be at least 1 characters long.",
          },
        },
      },
      email: {
        type: String,
        lowercase: true,
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please fill a valid email address"],
        required: function () {
          return this.oAuthProvider === "email"; // Required only for email/password
        },
        sparse: true, // Allows null values while enforcing uniqueness
        index: true,
      },
      phone: {
        type: String,
        required: function () { return this.oAuthProvider === "phone"; },
        unique: true,
        trim: true,
        match: [/^\+[1-9]\d{1,14}$/, "Phone number must be in E.164 format (e.g., +919876543210)"],
        index: true,
        sparse : true
      },
      password: {
        type: String,
        required: function () {
          return this.oAuthProvider === "email"; // Required only for email/password
        },
        minlength: [6, "Password must be at least 6 characters long"],
        select: false, // Don't return password by default
      },
      oAuthId: {
        type: String,
        required: function () {
          return ["google", "phone"].includes(this.oAuthProvider); // Required only for Google/phone
        },
        unique: true,
        sparse: true,
        index: true,
      },
      oAuthProvider: {
        type: String,
        enum: ["google", "phone", "email"], // Add email for password-based auth
        required: [true, "OAuth provider is required"],
      },
      profilePic: {
        type: String,
        default: "https://default-profile-pic-url.com/default.jpg",
        match: [/^https?:\/\/[^\s/$.?#].[^\s]*$/i, "Please enter a valid URL for the profile picture"],
        trim: true,
      },
      walletBalance: {
        type: Number,
        default: 0,
        min: [0, "Wallet balance cannot be negative"],
      },
      rewardCoins: {
        type: Number,
        default: 0,
        min: [0, "Reward coins cannot be negative"],
      },
      referralCode: {
        type: String,
        unique: true,
        default: function () {
          return uuidv4().slice(0, 8);
        },
      },
      referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      preferredLanguage: {
        type: String,
        default: "en",
        enum: ["en", "es", "fr", "hi", "ta"],
        trim: true,
      },
      isVerified: {
        type: Boolean,
        default: function () {
          return ["google", "phone"].includes(this.oAuthProvider); // True for Google/phone, false for email
        },
      },
      savedLocations: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SavedLocation",
        },
      ],
      emergencyContacts: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "EmergencyContact",
        },
      ],
    },
    { timestamps: true }
  );
  
  // Hash password before saving for email/password users
  riderSchema.pre("save", async function (next) {
    if (this.isModified("password") && this.password && this.oAuthProvider === "email") {
      this.password = await bcrypt.hash(this.password, 10);
    }
    next();
  });
riderSchema.methods.generateAuthToken = function () {
    return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

riderSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
}

riderSchema.statics.hashPassword = async function (password) {
    return await bcrypt.hash(password, 10);
}

const riderModel = mongoose.model('Rider', riderSchema);
module.exports = riderModel;
