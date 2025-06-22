
const VALID_CITIES = ["chennai", "coimbatore", "madurai", "salem"];

const VALID_RIDE_TYPES = ["economy", "premium", "shared", "auto", "bikeTaxi", "luxury","individual"];

const VALID_MODES = ["sedan", "suv", "hatchback", "bike", "auto"];

const VALID_GENDERS = ["male", "female", "any"];

const CHENNAI_BOUNDS = {
  latMin: 12.9,
  latMax: 13.3,
  longMin: 80.0,
  longMax: 80.4,
};

module.exports = { VALID_CITIES, VALID_RIDE_TYPES, VALID_MODES, VALID_GENDERS, CHENNAI_BOUNDS };