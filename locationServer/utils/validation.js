const { VALID_CITIES, VALID_RIDE_TYPES, CHENNAI_BOUNDS } = require("./constants");

function validateCaptain(body) {
  const {
    DRIVER_ID,
    long,
    lat,
    rideTypeSupported,
    isAvailable,
    status,
    rating,
    city,
  } = body;

  if (
    !DRIVER_ID ||
    typeof lat !== "number" ||
    typeof long !== "number" ||
    !city
  ) {
    return { valid: false, error: "Missing required fields" };
  }

  if (!VALID_CITIES.includes(city.toLowerCase())) {
    return { valid: false, error: "Invalid city" };
  }

  if (
    !Array.isArray(rideTypeSupported) ||
    rideTypeSupported.length === 0 ||
    !rideTypeSupported.every((type) => VALID_RIDE_TYPES.includes(type)) ||
    typeof isAvailable !== "boolean" ||
    status !== "active" ||
    typeof rating !== "number" ||
    rating < 1 ||
    rating > 5
  ) {
  //console.log(!Array.isArray(rideTypeSupported),rideTypeSupported.length==0,!rideTypeSupported.every((type) => VALID_RIDE_TYPES.includes(type)) ,typeof isAvailable,
  // typeof rating,rating)
    return { valid: false, error: "Invalid captain details" };
  }

  return { valid: true };
}

function validateRider(body) {
  const { riderId, long, lat, city } = body;

  if (
    !riderId ||
    typeof lat !== "number" ||
    typeof long !== "number" ||
    !city
  ) {
    return { valid: false, error: "Missing required fields" };
  }

  if (!VALID_CITIES.includes(city.toLowerCase())) {
    return { valid: false, error: "Invalid city" };
  }

  return { valid: true };
}

function validateRideRequest(body) {
  const { riderId, lat, long, rideType, city } = body;

  if (
    !riderId ||
    typeof lat !== "number" ||
    typeof long !== "number" ||
    !rideType ||
    !city
  ) {
    return { valid: false, error: "Missing required fields" };
  }

  if (!VALID_CITIES.includes(city.toLowerCase())) {
    return { valid: false, error: "Invalid city" };
  }

  if (!VALID_RIDE_TYPES.includes(rideType)) {
    return { valid: false, error: "Invalid ride type" };
  }

  return { valid: true };
}

function validateNearbyQuery(query) {
  const { lat, long, type, city, riderId } = query;

  if (!lat || !long || !type || !city || !riderId) {
    return { valid: false, error: "Missing required query parameters" };
  }

  const latNum = parseFloat(lat);
  const longNum = parseFloat(long);
  if (isNaN(latNum) || isNaN(longNum)) {
    return { valid: false, error: "Invalid coordinates" };
  }

  if (!VALID_CITIES.includes(city.toLowerCase())) {
    return { valid: false, error: "Invalid city" };
  }

  if (!VALID_RIDE_TYPES.includes(type)) {
    return { valid: false, error: "Invalid ride type" };
  }

  return { valid: true };
}

function validateCoordinates(cityLower, lat, long) {
  if (cityLower === "chennai") {
    return (
      lat >= CHENNAI_BOUNDS.latMin &&
      lat <= CHENNAI_BOUNDS.latMax &&
      long >= CHENNAI_BOUNDS.longMin &&
      long <= CHENNAI_BOUNDS.longMax
    );
  }
  return true; // Add bounds for other cities as needed
}

module.exports = {
  validateCaptain,
  validateRider,
  validateRideRequest,
  validateNearbyQuery,
  validateCoordinates,
};