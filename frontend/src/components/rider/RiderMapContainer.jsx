// src/components/rider/RiderMapContainer.jsx
import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import io from "socket.io-client";

const socket = io("http://localhost:3001", { reconnection: true });

const pickupIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
const dropoffIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
const captainIcon = L.icon({
  iconUrl: "/Captain/sedan.png",
  iconSize: [50, 50],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;

const UpdateMapView = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
};

const DraggableMarker = ({ position, setPosition, label, icon }) => {
  const markerRef = useRef(null);
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.on("dragend", () => {
        const newPos = markerRef.current.getLatLng();
        setPosition([newPos.lat, newPos.lng]);
        reverseGeocode(newPos.lat, newPos.lng).then((address) =>
          console.log(`${label} updated to: ${address}`)
        );
      });
    }
  }, [position, setPosition, label]);
  return (
    <Marker ref={markerRef} position={position} draggable={true} icon={icon}>
      <Popup>{label}</Popup>
    </Marker>
  );
};

const reverseGeocode = async (lat, lng) => {
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

const RiderMapContainer = ({ pickupLocation, setPickupLocation, dropoffLocation, setDropoffLocation, children }) => {
  const [pickupPos, setPickupPos] = useState([20.5937, 78.9629]);
  const [dropoffPos, setDropoffPos] = useState([20.5937, 78.9629]);
  const [routeCoords, setRouteCoords] = useState([]);
  const [center, setCenter] = useState([20.5937, 78.9629]);
  const [isLoading, setIsLoading] = useState(true);
  const [captains, setCaptains] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  // Get user's location and send to backend
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const currentPos = [latitude, longitude];
          setCenter(currentPos);
          setPickupPos(currentPos);
          setDropoffPos(currentPos);
          setUserLocation({ lat: latitude, lng: longitude });
          socket.emit('userLocation', { lat: latitude, lng: longitude }); // Send to backend
          reverseGeocode(latitude, longitude).then((address) => {
            if (typeof setPickupLocation === "function") setPickupLocation(address);
          });
          setIsLoading(false);
        },
        (err) => {
          console.error("Geolocation error:", err);
          setIsLoading(false);
        }
      );
    } else {
      setIsLoading(false);
    }
  }, [setPickupLocation, setDropoffLocation]);

  // Fetch captains within 10 km
  useEffect(() => {
    if (userLocation) {
      axios
        .get(`http://localhost:3001/captains/available?lat=${userLocation.lat}&lng=${userLocation.lng}`)
        .then((response) => {
          setCaptains(response.data);
          if (response.data.length > 0) {
            setCenter([
              response.data[0].currentLocation.coordinates[1],
              response.data[0].currentLocation.coordinates[0],
            ]);
          }
        })
        .catch((err) => console.error("Error fetching captains:", err));
    }
  }, [userLocation]);

  // Listen for captain updates
  useEffect(() => {
    socket.on("locationUpdate", (data) => {
      setCaptains((prev) =>
        prev.map((captain) =>
          captain.driverId === data.driverId
            ? { ...captain, currentLocation: data.currentLocation }
            : captain
        )
      );
    });
    return () => socket.off("locationUpdate");
  }, []);

  // Update pickup/dropoff addresses
  useEffect(() => {
    if (pickupPos[0] && pickupPos[1] && typeof setPickupLocation === "function") {
      reverseGeocode(pickupPos[0], pickupPos[1]).then((addr) => setPickupLocation(addr));
    }
    if (dropoffPos[0] && dropoffPos[1] && typeof setDropoffLocation === "function") {
      reverseGeocode(dropoffPos[0], dropoffPos[1]).then((addr) => setDropoffLocation(addr));
    }
  }, [pickupPos, dropoffPos, setPickupLocation, setDropoffLocation]);

  // Fetch route
  const fetchRoute = async () => {
    if (!pickupPos || !dropoffPos || pickupPos.some((v) => v === undefined) || dropoffPos.some((v) => v === undefined)) {
      return;
    }
    try {
      const response = await axios.get(
        `https://api.geoapify.com/v1/routing?waypoints=${pickupPos[0]},${pickupPos[1]}|${dropoffPos[0]},${dropoffPos[1]}&mode=drive&apiKey=${apiKey}`
      );
      const coords = response.data.features[0].geometry.coordinates[0].map(([lng, lat]) => [lat, lng]);
      setRouteCoords(coords);
    } catch (error) {
      console.error("Routing error:", error);
    }
  };

  useEffect(() => {
    fetchRoute();
  }, [pickupPos, dropoffPos]);

  if (isLoading) {
    return <div>Loading map...</div>;
  }

  return (
    <div className="flex-1 min-h-[400px] md:min-h-0 relative mx-5 z-50">
      <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }} className="z-0">
        <TileLayer
          url={`https://maps.geoapify.com/v1/tile/klokantech-basic/{z}/{x}/{y}.png?apiKey=${apiKey}`}
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <UpdateMapView center={center} />
        <DraggableMarker position={pickupPos} setPosition={setPickupPos} label="Pickup" icon={pickupIcon} />
        <DraggableMarker position={dropoffPos} setPosition={setDropoffPos} label="Dropoff" icon={dropoffIcon} />
        {routeCoords.length > 0 && <Polyline positions={routeCoords} color="blue" />}
        {captains.map((captain) =>
          captain.currentLocation && captain.currentLocation.coordinates ? (
            <Marker
              key={captain.driverId}
              position={[captain.currentLocation.coordinates[1], captain.currentLocation.coordinates[0]]}
              icon={captainIcon}
            >
              <Popup>Driver: {captain.driverId}</Popup>
            </Marker>
          ) : null
        )}
        {children}
      </MapContainer>
    </div>
  );
};

export default RiderMapContainer;