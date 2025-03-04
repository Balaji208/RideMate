const savedLocationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: {
        type: String,
        required: true
    },
    address: {
        type: String,
        default: ""
    },
    locationType: {
        type: String,
        default: "favorite",
        enum: ["home", "work", "favorite"]
    },
    location: {
        type: {
            type: String,
            default: "Point"
        },
        coordinates: [Number] // [longitude, latitude]
    }
}, { timestamps: true });

// Geospatial index
savedLocationSchema.index({ location: "2dsphere" });