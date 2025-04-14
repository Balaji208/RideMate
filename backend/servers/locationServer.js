const express = require("express");
const redis = require("redis");
const h3 = require("h3-js");
const axios = require("axios");
const app = express();
app.use(express.json());

const PORT = 3002;

const redisClient = redis.createClient({ url: "redis://localhost:6379" });
redisClient.on("error", (err) => console.error("Redis Error:", err));
redisClient.connect();

// H3 queue (in-memory)
const h3Queue = [];
setInterval(async () => {
  if (!h3Queue.length) return;
  const updates = h3Queue.splice(0, h3Queue.length);
  for (const { DRIVER_ID, long, lat, oldCell, city } of updates) {
    try {
      const newCell = h3.latLngToCell(lat, long, 8);
      console.log(`H3 Sync: ${DRIVER_ID}, Cell: ${newCell}`);
      if (newCell !== oldCell) {
        if (oldCell)
          await redisClient.sRem(`captains:${city}:${oldCell}`, DRIVER_ID);
        await redisClient.sAdd(`captains:${city}:${newCell}`, DRIVER_ID);
      }
    } catch (err) {
      console.error(`H3 Sync Error for ${DRIVER_ID}:`, err.message);
    }
  }
}, 30 * 1000);

// POST /location/captain
app.post("/location/captain", async (req, res) => {
  try {
    const {
      DRIVER_ID,
      long,
      lat,
      rideTypeSupported,
      isAvailable,
      status,
      rating,
      city,
    } = req.body;
    if (
      !DRIVER_ID ||
      typeof lat !== "number" ||
      typeof long !== "number" ||
      !city
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const cityLower = city.toLowerCase();
    if (!["chennai", "coimbatore", "madurai", "salem"].includes(cityLower)) {
      return res.status(400).json({ error: "Invalid city" });
    }
    if (
      cityLower === "chennai" &&
      (lat < 12.9 || lat > 13.3 || long < 80.0 || long > 80.4)
    ) {
      return res.status(400).json({ error: "Invalid Chennai coordinates" });
    }
    if (
      cityLower === "coimbatore" &&
      (lat < 10.9 || lat > 11.3 || long < 76.7 || long > 77.1)
    ) {
      return res.status(400).json({ error: "Invalid Coimbatore coordinates" });
    }
    if (
      cityLower === "madurai" &&
      (lat < 9.8 || lat > 10.2 || long < 78.0 || long > 78.4)
    ) {
      return res.status(400).json({ error: "Invalid Madurai coordinates" });
    }
    if (
      cityLower === "salem" &&
      (lat < 11.5 || lat > 11.9 || long < 78.0 || long > 78.4)
    ) {
      return res.status(400).json({ error: "Invalid Salem coordinates" });
    }
    if (
      !Array.isArray(rideTypeSupported) ||
      typeof isAvailable !== "boolean" ||
      status !== "active" ||
      typeof rating !== "number" ||
      rating < 1 ||
      rating > 5
    ) {
      return res.status(400).json({ error: "Invalid captain details" });
    }
    await redisClient.geoAdd(`captains:${cityLower}`, {
      longitude: long,
      latitude: lat,
      member: DRIVER_ID,
    });
    await redisClient.hSet(`captains:${cityLower}:${DRIVER_ID}`, {
      rideTypeSupported: JSON.stringify(rideTypeSupported),
      isAvailable: isAvailable ? "true" : "false",
      status,
      rating: rating.toString(),
    });
    await redisClient.expire(`captains:${cityLower}:${DRIVER_ID}`, 30);
    const oldCell =
      h3Queue.find((u) => u.DRIVER_ID === DRIVER_ID)?.oldCell || null;
    h3Queue.push({ DRIVER_ID, lat, long, oldCell, city: cityLower });
    res.json({ success: true });
  } catch (err) {
    console.error("Captain Location Update Error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /location/rider
app.post("/location/rider", async (req, res) => {
  try {
    const { riderId, long, lat, city } = req.body;
    if (
      !riderId ||
      typeof lat !== "number" ||
      typeof long !== "number" ||
      !city
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const cityLower = city.toLowerCase();
    if (!["chennai", "coimbatore", "madurai", "salem"].includes(cityLower)) {
      return res.status(400).json({ error: "Invalid city" });
    }
    if (
      cityLower === "chennai" &&
      (lat < 12.9 || lat > 13.3 || long < 80.0 || long > 80.4)
    ) {
      return res.status(400).json({ error: "Invalid Chennai coordinates" });
    }
    if (
      cityLower === "coimbatore" &&
      (lat < 10.9 || lat > 11.3 || long < 76.7 || long > 77.1)
    ) {
      return res.status(400).json({ error: "Invalid Coimbatore coordinates" });
    }
    if (
      cityLower === "madurai" &&
      (lat < 9.8 || lat > 10.2 || long < 78.0 || long > 78.4)
    ) {
      return res.status(400).json({ error: "Invalid Madurai coordinates" });
    }
    if (
      cityLower === "salem" &&
      (lat < 11.5 || lat > 11.9 || long < 78.0 || long > 78.4)
    ) {
      return res.status(400).json({ error: "Invalid Salem coordinates" });
    }
    await redisClient.geoAdd(`riders:${cityLower}`, {
      longitude: long,
      latitude: lat,
      member: riderId,
    });
    await redisClient.expire(`riders:${cityLower}:${riderId}`, 60);
    res.json({ success: true, data: "Rider location updated successfully" });
  } catch (err) {
    console.error("Rider Location Update Error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /captains/nearby
app.get("/captains/nearby", async (req, res) => {
  try {
    const { lat, long, type, city, riderId } = req.query;
    const cityLower = city?.toLowerCase();
    if (!lat || !long || !type || !cityLower || !riderId) {
      return res.status(400).json({ error: "Missing required query parameters" });
    }
    const latNum = parseFloat(lat),
      longNum = parseFloat(long);
    if (isNaN(latNum) || isNaN(longNum)) {
      return res.status(400).json({ error: "Invalid coordinates" });
    }
    if (!["chennai", "coimbatore", "madurai", "salem"].includes(cityLower)) {
      return res.status(400).json({ error: "Invalid city" });
    }
    if (
      cityLower === "chennai" &&
      (latNum < 12.9 || latNum > 13.3 || longNum < 80.0 || longNum > 80.4)
    ) {
      return res.status(400).json({ error: "Invalid Chennai coordinates" });
    }
    if (
      cityLower === "coimbatore" &&
      (latNum < 10.9 || latNum > 11.3 || longNum < 76.7 || longNum > 77.1)
    ) {
      return res.status(400).json({ error: "Invalid Coimbatore coordinates" });
    }
    if (
      cityLower === "madurai" &&
      (latNum < 9.8 || latNum > 10.2 || longNum < 78.0 || longNum > 78.4)
    ) {
      return res.status(400).json({ error: "Invalid Madurai coordinates" });
    }
    if (
      cityLower === "salem" &&
      (latNum < 11.5 || latNum > 11.9 || longNum < 78.0 || longNum > 78.4)
    ) {
      return res.status(400).json({ error: "Invalid Salem coordinates" });
    }
    if (
      !["economy", "premium", "shared", "auto", "bikeTaxi", "luxury"].includes(type)
    ) {
      return res.status(400).json({ error: "Invalid ride type" });
    }

    const riderCell = h3.latLngToCell(latNum, longNum, 8);
    console.log(`Rider Cell: ${riderCell}`);
    const cells = h3.gridDisk(riderCell, 2); // Fixed: kRing -> gridDisk
    console.log(`Cells: ${cells}`);

    let driverIds = [];
    for (const cell of cells) {
      const ids = await redisClient.sMembers(`captains:${cityLower}:${cell}`);
      driverIds.push(...ids);
    }
    driverIds = [...new Set(driverIds)];
    if (!driverIds.length) {
      return res.json([]);
    }

    const captains = [];
    for (const DRIVER_ID of driverIds.slice(0, 50)) {
      const details = await redisClient.hGetAll(`captains:${cityLower}:${DRIVER_ID}`);
      if (
        details.isAvailable === "true" &&
        details.status === "active" &&
        JSON.parse(details.rideTypeSupported || "[]").includes(type)
      ) {
        const pos = await redisClient.geoPos(`captains:${cityLower}`, DRIVER_ID);
        if (pos && pos[0]) {
          captains.push({
            DRIVER_ID,
            lat: pos[0].latitude,
            long: pos[0].longitude,
            rating: parseFloat(details.rating || "1")
          });
        }
      }
    }
    if (!captains.length) {
      return res.json([]);
    }

    const captainsWithETA = [];
    const GEOAPIFY_KEY = process.env.GEOAPIFY_KEY || "your_geoapify_key";
    for (const captain of captains.slice(0, 20)) {
      const cacheKey = `captains:${cityLower}:eta:${riderId}:${captain.DRIVER_ID}`;
      let eta = await redisClient.get(cacheKey);
      if (!eta) {
        try {
          const response = await axios.get("https://api.geoapify.com/v1/routing", {
            params: {
              waypoints: `${captain.lat},${captain.long}|${latNum},${longNum}`,
              mode: "drive",
              apiKey: GEOAPIFY_KEY,
            },
          });
          eta = Math.round(response.data.features[0].properties.time / 60);
          console.log(captain.DRIVER_ID," : " , eta)
          await redisClient.setEx(cacheKey, 60, eta.toString());
        } catch (err) {
          console.error(`GeoApify Error for ${captain.DRIVER_ID}:`, err.message);
          continue;
        }
      } else {
        console.log(captain.DRIVER_ID," : " , eta)
        eta = parseInt(eta);
      }
      if (eta <= 15) {
        captainsWithETA.push({ ...captain, eta });
      }
    }
    if (!captainsWithETA.length) {
      return res.json([]);
    }

    captainsWithETA.sort((a, b) => a.eta - b.eta);
    const topCaptains = captainsWithETA
      .slice(0, 10)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 3);

    res.json(
      topCaptains.map((c) => ({
        DRIVER_ID: c.DRIVER_ID,
        lat: c.lat,
        long: c.long,
        eta: c.eta,
        rating: c.rating,
      }))
    );
  } catch (err) {
    console.error("Nearby Captains Error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => console.log(`Location Server on :${PORT}`));