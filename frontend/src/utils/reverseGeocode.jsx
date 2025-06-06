import axios from 'axios';

const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;

export const reverseGeocode = async (lat, lng) => {
  try {
    const response = await axios.get(
      `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${apiKey}`
    );
    const { features } = response.data;
    return features.length > 0 ? features[0].properties.formatted : "Unknown location";
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return "Unable to geocode";
  }
};