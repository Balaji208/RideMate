const mongoose = require("mongoose");
const bcrypt = require("bcryptjs")

const cityBounds = {
  chennai: { minLng: 80.15, maxLng: 80.35, minLat: 12.95, maxLat: 13.15, centroid: [80.25, 13.05] },
  coimbatore: { minLng: 76.90, maxLng: 77.10, minLat: 10.90, maxLat: 11.10, centroid: [77.00, 11.00] },
  salem: { minLng: 78.00, maxLng: 78.20, minLat: 11.60, maxLat: 11.80, centroid: [78.10, 11.70] },
  madurai: { minLng: 78.00, maxLng: 78.20, minLat: 9.80, maxLat: 10.00, centroid: [78.10, 9.90] },
};

const captainSchema = new mongoose.Schema(
  {
    fullName: {
      firstName: {
        type: String,
        trim: true,
        required: [true, 'First name is required'],
        validate: {
          validator: function (value) {
            return value.length >= 3;
          },
          message: 'First name must be at least 3 characters long.',
        },
      },
      lastName: {
        type: String,
        trim: true,
        validate: {
          validator: function (value) {
            return !value || (value && value.length >= 1);
          },
          message: 'Last name must be at least 1 character long.',
        },
      },
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: {
        values: ['male', 'female', 'other'], // lowercase values
        message: 'Invalid gender',
      },
      lowercase: true, // auto-convert input to lowercase
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^[\w+.-]+@([\w-]+\.)+[\w-]{2,}$/, 'Please provide a valid email address'],
      sparse: true,
    },
    password: {
      type: String,
      required: function () {
        return this.oAuthProvider === 'email';
      },
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      match: [/^\+[1-9]\d{1,14}$/, 'Phone number must be in E.164 format (e.g., +919876543210)'],
    },
    driverId: {
      type: String,
      required: [true, 'Driver ID is required'],
      unique: true,
      trim: true,
      match: [/^DRV\d{8}$/, 'Driver ID must be in the format DRV12345678'],
    },
    licenseNumber: {
      type: String,
      required: [true, 'License number is required'],
      unique: true,
      trim: true,
      minlength: [5, 'License number must be at least 5 characters long'],
      maxlength: [20, 'License number cannot exceed 20 characters'],
    },
    vehicle: {
      type: {
        type: String,
        required: [true, 'Vehicle type is required'],
        trim: true,
        enum: {
          values: ['Sedan', 'SUV', 'Hatchback', 'Auto Rickshaw', 'Bike', 'Van', 'Luxury Car'],
          message: 'Invalid vehicle type',
        },
      },
      vehicleNumber: {
        type: String,
        required: [true, 'Vehicle number is required'],
        unique: true,
        trim: true,
        match: [/^[A-Z0-9-]{5,15}$/, 'Vehicle number must be 5-15 characters long and contain only letters, numbers, or hyphens'],
      },
      color: {
        type: String,
        required: [true, 'Vehicle color is required'],
        trim: true,
        maxlength: [20, 'Vehicle color cannot exceed 20 characters'],
      },
      capacity: {
        type: Number,
        required: [true, 'Vehicle capacity is required'],
        min: [1, 'Vehicle capacity must be at least 1'],
        max: [20, 'Vehicle capacity cannot exceed 20'],
      },
    },
    documents: {
      license: { type: String, trim: true, required: false }, // Optional for simulation
      vehicleRegistration: { type: String, trim: true, required: false },
      insurance: { type: String, trim: true, required: false },
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be more than 5'],
    },
    ratingCount: {
      type: Number,
      default: 0,
      min: [0, 'Rating count cannot be negative'],
    },
    rideTypeSupported: [
      {
        type: String,
        enum: {
          values: ['economy', 'premium', 'luxury', 'shared', 'auto', 'bikeTaxi'],
          message: 'Invalid ride type',
        },
        required: [true, 'Ride type is required'],
      },
    ],
    isPetFriendly: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'inactive'],
        message: 'Status must be active, inactive, or on-ride',
      },
      default: 'inactive',
    },
    isAvailable: {
      type: Boolean,
      default: false,
    },
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        validate: {
          validator: function ([lng, lat]) {
            const bounds = cityBounds[this.city];
            return bounds
              ? lng >= bounds.minLng && lng <= bounds.maxLng && lat >= bounds.minLat && lat <= bounds.maxLat
              : true; // Allow if city not set yet
          },
          message: 'Coordinates must be within city bounds',
        },
        default: [0, 0],
      },
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      enum: {
        values: ['Chennai', 'Coimbatore', 'Salem', 'Madurai'],
        message: 'City must be chennai, coimbatore, salem, or madurai',
      },
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    geohash: {
      type: String,
      trim: true,
      maxlength: [12, 'GeoHash cannot exceed 12 characters'],
      default: null,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    totalRides: {
      type: Number,
      default: 0,
      min: [0, 'Total rides cannot be negative'],
    },
    totalEarnings: {
      type: Number,
      default: 0,
      min: [0, 'Total earnings cannot be negative'],
    },
    oAuthId: {
      type: String,
      required: [true, 'OAuth ID is required'],
      unique: true,
      sparse: true,
    },
    oAuthProvider: {
      type: String,
      enum: ['google', 'phone', 'email'],
      required: [true, 'OAuth provider is required'],
    },
  },
  {
    timestamps: true,
  }
);
// Add indexes




captainSchema.index({ currentLocation: "2dsphere" });
captainSchema.index({ city: 1, 'vehicle.type': 1, isAvailable: 1 });
captainSchema.index({ geohash: 1 });

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

// Method to make driver active
captainSchema.methods.setStatus = async function (status){
  this.status = status;
  await this.save();
}

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