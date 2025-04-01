const mongoose = require("mongoose");
const bcrypt = require("bcryptjs")

const captainSchema = new mongoose.Schema(
  {
    // Driver's email (unique, lowercase for consistency)
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
        "Please provide a valid email address",
      ],
    },
    password: {
      type: String,
      required: function() { return this.oAuthProvider === "email"; }, 
      minlength: [8, "Password must be at least 8 characters long."],
      select: false
  },
    // Driver's phone number (with country code, e.g., +919876543210)
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
      match: [
        /^\+[1-9]\d{1,14}$/,
        "Phone number must be in E.164 format (e.g., +919876543210)",
      ],
    },

    // Unique driver ID (e.g., "DRV123456789")
    driverId: {
      type: String,
      required: [true, "Driver ID is required"],
      unique: true,
      trim: true,
      match: [/^DRV\d{9}$/, "Driver ID must be in the format DRV12345"],
    },

    // Driver's license number (unique)
    licenseNumber: {
      type: String,
      required: [true, "License number is required"],
      unique: true,
      trim: true,
      minlength: [5, "License number must be at least 5 characters long"],
      maxlength: [20, "License number cannot exceed 20 characters"],
    },

    // Vehicle details
    vehicle: {
      // Vehicle type (e.g., "Toyota Camry", "Auto Rickshaw", "Yamaha FZ")
      type: {
        type: String,
        required: [true, "Vehicle type is required"],
        trim: true,
        enum: {
          values: [
            "Sedan",
            "SUV",
            "Hatchback",
            "Auto Rickshaw",
            "Bike",
            "Van",
            "Luxury Car",
          ],
          message: "Invalid vehicle type",
        },
      },
      // Vehicle number (e.g., registration/plate number)
      vehicleNumber: {
        type: String,
        required: [true, "Vehicle number is required"],
        unique: true,
        trim: true,
        match: [
          /^[A-Z0-9-]{5,15}$/,
          "Vehicle number must be 5-15 characters long and contain only letters, numbers, or hyphens",
        ],
      },
      // Vehicle color
      color: {
        type: String,
        required: [true, "Vehicle color is required"],
        trim: true,
        maxlength: [20, "Vehicle color cannot exceed 20 characters"],
      },
      // Vehicle capacity (number of passengers)
      capacity: {
        type: Number,
        required: [true, "Vehicle capacity is required"],
        min: [1, "Vehicle capacity must be at least 1"],
        max: [20, "Vehicle capacity cannot exceed 20"],
      },
    },

    // Documents (URLs to uploaded files, e.g., on Firebase Storage or S3)
    documents: {
      license: {
        type: String,
        required: [true, "License document is required"],
        trim: true,
      },
      vehicleRegistration: {
        type: String,
        required: [true, "Vehicle registration document is required"],
        trim: true,
      },
      insurance: {
        type: String,
        required: [true, "Insurance document is required"],
        trim: true,
      },
    },

    // Verification status (e.g., after admin verifies documents)
    isVerified: {
      type: Boolean,
      default: false,
    },

    // Driver's rating (0 to 5)
    rating: {
      type: Number,
      default: 0,
      min: [0, "Rating cannot be less than 0"],
      max: [5, "Rating cannot be more than 5"],
    },

    // Number of ratings (to calculate average rating)
    ratingCount: {
      type: Number,
      default: 0,
      min: [0, "Rating count cannot be negative"],
    },

    // Ride types supported by the driver
    rideTypeSupported: [
      {
        type: String,
        enum: {
          values: ["economy", "premium", "luxury", "shared", "auto", "bikeTaxi"],
          message: "Invalid ride type",
        },
        required: [true, "Ride type is required"],
      },
    ],

    // Whether the driver allows pets
    isPetFriendly: {
      type: Boolean,
      default: false,
    },

    // Driver's status (active/inactive)
    status: {
      type: String,
      enum: {
        values: ["active", "inactive"],
        message: "Status must be either 'active' or 'inactive'",
      },
      default: "inactive",
    },

    // Driver's availability (e.g., for ride assignment)
    isAvailable: {
      type: Boolean,
      default: false,
    },

    // Current location (for real-time tracking and ride assignment)
    currentLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },

    // Date the driver joined
    joinedAt: {
      type: Date,
      default: Date.now,
    },

    // Total rides completed
    totalRides: {
      type: Number,
      default: 0,
      min: [0, "Total rides cannot be negative"],
    },

    // Total earnings (in your app's currency)
    totalEarnings: {
      type: Number,
      default: 0,
      min: [0, "Total earnings cannot be negative"],
    },
    oAuthId: {
      type: String,
      unique: true,
      sparse: true // Allows null for non-OAuth users
  },
  oAuthProvider: {
      type: String,
      enum: ["google", "twitter", "facebook", "email"],
      default: "email"
  },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Add indexes for frequently queried fields
captainSchema.index({ driverId: 1 }); // Index for driverId
captainSchema.index({ email: 1 }); // Index for email
captainSchema.index({ phone: 1 }); // Index for phone
captainSchema.index({ "vehicle.vehicleNumber": 1 }); // Index for vehicle number
captainSchema.index({ currentLocation: "2dsphere" }); // Geospatial index for location


// generate auth token 
captainSchema.methods.generateAuthToken = function(){
  const token = jwt.sign({_id : this._id},process.env.JWT_SECRET,{expiresIn : '24h'});
  return token;
}

// compare passwords
captainSchema.methods.comparePasswords = async function (password){
  return await bcrypt.compare(password,this.password);
}

// password hashing
captainSchema.methods.hashPassword = async function(password){
  return await bcrypt.hash(password,10);
}
// Middleware to update rating average
captainSchema.pre("save", function (next) {
  if (this.ratingCount > 0) {
    this.rating = this.rating / this.ratingCount;
  }
  next();
});

// Method to update driver's location
captainSchema.methods.updateLocation = async function (longitude, latitude) {
  this.currentLocation.coordinates = [longitude, latitude];
  await this.save();
};

// Method to update driver's availability
captainSchema.methods.setAvailability = async function (isAvailable) {
  this.isAvailable = isAvailable;
  await this.save();
};

// Method to add a rating
captainSchema.methods.addRating = async function (newRating) {
  if (newRating < 0 || newRating > 5) {
    throw new Error("Rating must be between 0 and 5");
  }
  this.ratingCount += 1;
  this.rating = ((this.rating * (this.ratingCount - 1)) + newRating) / this.ratingCount;
  await this.save();
};

// Create the Captain model
const captainModel = mongoose.model("captain", captainSchema);

module.exports = captainModel;