import React, { useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import io from "socket.io-client";
import { useSelector, useDispatch } from 'react-redux';
import { reverseGeocode } from '../../utils/reverseGeocode';
import {
  setPickupPos,
  setDropoffPos,
  setRouteCoords,
  setCenter,
  setCaptains,
  updateCaptainLocation,
  setIsLoading,
  setUserLocation,
} from '../../redux/rider/slices/mapSlice';
import { setFromLocation, setToLocation, updateStop } from '../../redux/rider/slices/rideSlice';
import { MapPin, Navigation, ArrowRight, ArrowLeft, ArrowUp, ArrowDown, CornerUpRight, CornerUpLeft } from 'lucide-react';

const socket = io("http://localhost:3001", { reconnection: true });

// Custom SVG Icons
const pickupIcon = L.divIcon({
  html: `
    <svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.373 0 0 5.373 0 12C0 21 12 36 12 36C12 36 24 21 24 12C24 5.373 18.627 0 12 0Z" fill="#22C55E"/>
      <circle cx="12" cy="12" r="6" fill="white"/>
    </svg>
  `,
  className: '',
  iconSize: [24, 36],
  iconAnchor: [12, 36],
  popupAnchor: [0, -36],
});

const dropoffIcon = L.divIcon({
  html: `
    <svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.373 0 0 5.373 0 12C0 21 12 36 12 36C12 36 24 21 24 12C24 5.373 18.627 0 12 0Z" fill="#3B82F6"/>
      <circle cx="12" cy="12" r="6" fill="white"/>
    </svg>
  `,
  className: '',
  iconSize: [24, 36],
  iconAnchor: [12, 36],
  popupAnchor: [0, -36],
});

const stopIcon = (index) => L.divIcon({
  html: `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="12" fill="#6B7280"/>
      <text x="12" y="16" font-size="12" fill="white" text-anchor="middle" font-weight="bold">${index + 1}</text>
    </svg>
  `,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -12],
});

const captainIcon = L.divIcon({
  html: `
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 8H17V6C17 4.9 16.1 4 15 4H9C7.9 4 7 4.9 7 6V8H4C2.9 8 2 8.9 2 10V16C2 17.1 2.9 18 4 18H7V20H9V18H15V20H17V18H20C21.1 18 22 17.1 22 16V10Z" fill="#1F2937"/>
    </svg>
  `,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Error Boundary for Components
class ComponentErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    console.error('[ComponentErrorBoundary] Caught error:', error);
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-red-500 p-2">
          Error in {this.props.componentName}: {this.state.error?.message || 'Unknown error'}
        </div>
      );
    }
    return this.props.children;
  }
}

const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;


const UpdateMapView = ({ positions }) => {
  const map = useMap();

  useEffect(() => {
    try {
      const validPositions = positions.filter(
        pos => Array.isArray(pos) && pos.length === 2 && typeof pos[0] === 'number' && typeof pos[1] === 'number' && !isNaN(pos[0]) && !isNaN(pos[1])
      );
      console.log('[UpdateMapView] Valid positions:', validPositions);

      if (validPositions.length > 0) {
        const bounds = L.latLngBounds(validPositions);
        if (bounds.isValid()) {
          console.log('[UpdateMapView] Fitting bounds:', bounds.toBBoxString());
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        } else {
          console.warn('[UpdateMapView] Invalid bounds:', bounds);
        }
      } else {
        console.warn('[UpdateMapView] No valid positions to fit bounds');
      }
    } catch (error) {
      console.error('[UpdateMapView] Error adjusting map view:', error);
    }
  }, [positions, map]);

  return null;
};

const DraggableMarker = ({ position, setPositionAction, label, icon, stopId }) => {
  const markerRef = useRef(null);
  const dispatch = useDispatch();
  const stops = useSelector(state => state.ride.stops);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.on("dragend", async () => {
        try {
          const newPos = markerRef.current.getLatLng();
          console.log(`[DraggableMarker] ${label} dragged to:`, [newPos.lat, newPos.lng]);
          dispatch(setPositionAction([newPos.lat, newPos.lng]));
          const address = await reverseGeocode(newPos.lat, newPos.lng);
          console.log(`[DraggableMarker] ${label} address:`, address);
          if (label === 'Pickup') {
            dispatch(setFromLocation(address));
          } else if (label === 'Dropoff') {
            dispatch(setToLocation(address));
          } else if (label === 'Stop' && stopId) {
            dispatch(updateStop({ id: stopId, location: address, lat: newPos.lat, lng: newPos.lng }));
          }
        } catch (error) {
          console.error(`[DraggableMarker] Error in dragend for ${label}:`, error);
        }
      });
    }
  }, [dispatch, setPositionAction, label, stopId]);

  if (!position || !Array.isArray(position) || position.length !== 2 || typeof position[0] !== 'number' || typeof position[1] !== 'number' || isNaN(position[0]) || isNaN(position[1])) {
    console.warn(`[DraggableMarker] Invalid position for ${label}:`, position);
    return null;
  }

  const stopIndex = stopId ? stops.findIndex(s => s.id === stopId) : -1;

  return (
    <ComponentErrorBoundary componentName="DraggableMarker">
      <Marker
        ref={markerRef}
        position={position}
        draggable={true}
        icon={icon}
      >
        <Popup className="rounded-lg shadow-lg p-2">
          <div className="font-medium text-gray-800">{label}</div>
          {label === 'Stop' && stopIndex >= 0 && (
            <div className="text-sm text-gray-500">Stop {stopIndex + 1}</div>
          )}
        </Popup>
      </Marker>
    </ComponentErrorBoundary>
  );
};

const RiderMapContainer = ({ children }) => {
  const dispatch = useDispatch();
  const { pickupPos, dropoffPos, routeCoords, captains, isLoading, userLocation } = useSelector(state => state.map);
  const { fromLocation, toLocation, stops } = useSelector(state => state.ride);
  const [routeInfo, setRouteInfo] = React.useState({ distance: null, duration: null });
  const [routeDirections, setRouteDirections] = React.useState([]);

  const handleRecenter = () => {
    if (userLocation) {
      console.log('[RiderMapContainer] Recentering to userLocation:', userLocation);
      dispatch(setCenter([userLocation.lat, userLocation.lng]));
    }
  };

  useEffect(() => {
    let mounted = true;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (mounted) {
            const { latitude, longitude } = position.coords;
            const currentPos = [latitude, longitude];
            console.log('[RiderMapContainer] Geolocation success:', currentPos);
            dispatch(setCenter(currentPos));
            if (!pickupPos[0] || pickupPos[0] === 0) {
              dispatch(setPickupPos(currentPos));
              if (!fromLocation) {
                reverseGeocode(latitude, longitude).then((address) => {
                  if (mounted && !fromLocation) {
                    console.log('[RiderMapContainer] Setting fromLocation:', address);
                    dispatch(setFromLocation(address));
                  }
                }).catch((error) => {
                  console.error('[RiderMapContainer] Reverse geocode error:', error);
                });
              }
            }
            dispatch(setUserLocation({ lat: latitude, lng: longitude }));
            socket?.emit('userLocation', { lat: latitude, lng: longitude });
            dispatch(setIsLoading(false));
          }
        },
        (err) => {
          console.error('[RiderMapContainer] Geolocation error:', err);
          if (mounted) {
            dispatch(setIsLoading(false));
          }
        }
      );
    } else {
      console.warn('[RiderMapContainer] Geolocation not supported');
      if (mounted) {
        dispatch(setIsLoading(false));
      }
    }
    return () => {
      mounted = false;
    };
  }, [dispatch, pickupPos, fromLocation]);

  useEffect(() => {
    if (userLocation) {
      console.log('[RiderMapContainer] Fetching captains for userLocation:', userLocation);
      axios.get(`http://localhost:3001/captains/available?lat=${userLocation.lat}&lng=${userLocation.lng}`)
        .then((response) => {
          dispatch(setCaptains(response.data));
        })
        .catch((err) => console.error('[RiderMapContainer] Error fetching captains:', err));
    }
  }, [userLocation, dispatch]);

  useEffect(() => {
    socket.on("locationUpdate", (data) => {
      console.log('[RiderMapContainer] Captain location update:', data);
      dispatch(updateCaptainLocation(data));
    });
    return () => socket.off("locationUpdate");
  }, [dispatch]);

  const fetchRoute = async () => {
    const validStops = stops.filter(s => s.lat && s.lng && !isNaN(s.lat) && !isNaN(s.lng));
    const waypoints = [
      pickupPos,
      ...validStops.map(s => [s.lat, s.lng]),
      dropoffPos,
    ].filter(pos => pos && Array.isArray(pos) && pos.length === 2 && typeof pos[0] === 'number' && typeof pos[1] === 'number' && !isNaN(pos[0]) && !isNaN(pos[1]));

    if (waypoints.length < 2) {
      console.warn('[RiderMapContainer] Insufficient waypoints for routing:', waypoints);
      dispatch(setRouteCoords([]));
      setRouteInfo({ distance: null, duration: null });
      setRouteDirections([]);
      return;
    }

    try {
      const waypointStr = waypoints.map(pos => `${pos[0]},${pos[1]}`).join('|');
      console.log('[RiderMapContainer] Fetching route with waypoints:', waypointStr);
      const response = await axios.get(
        `https://api.geoapify.com/v1/routing?waypoints=${waypointStr}&mode=drive&details=instruction_details&apiKey=${apiKey}`
      );
      const coords = response.data.features[0].geometry.coordinates[0].map(([lng, lat]) => [lat, lng]);
      const distance = (response.data.features[0].properties.distance / 1000).toFixed(1); // km
      const duration = (response.data.features[0].properties.time / 60).toFixed(0); // minutes

      // Extract directions from legs
      const legs = response.data.features[0].properties.legs || [];
      const directions = [];
      let stepIndex = 1;

      legs.forEach((leg, legIndex) => {
        const legSteps = leg.steps || [];
        legSteps.forEach((step, stepIdx) => {
          const instruction = step.instruction?.text || `Step ${stepIndex}`;
          const stepDistance = (step.distance / 1000).toFixed(1); // km
          directions.push({
            id: `${legIndex}-${stepIdx}`,
            instruction,
            distance: stepDistance,
          });
          stepIndex++;
        });

        // Add waypoint marker (stop or dropoff)
        if (legIndex < waypoints.length - 1) {
          const waypointLabel = legIndex === waypoints.length - 2 ? 'Dropoff' : `Stop ${legIndex + 1}`;
          directions.push({
            id: `waypoint-${legIndex}`,
            instruction: `Arrive at ${waypointLabel}`,
            distance: 0,
            isWaypoint: true,
          });
        }
      });

      console.log('[RiderMapContainer] Route fetched:', { distance, duration, directions });
      dispatch(setRouteCoords(coords));
      setRouteInfo({ distance, duration });
      setRouteDirections(directions);
    } catch (error) {
      console.error('[RiderMapContainer] Routing error:', error);
      dispatch(setRouteCoords([]));
      setRouteInfo({ distance: null, duration: null });
      setRouteDirections([]);
    }
  };

  useEffect(() => {
    console.log('[RiderMapContainer] Triggering fetchRoute with:', { pickupPos, dropoffPos, stops });
    fetchRoute();
  }, [pickupPos, dropoffPos, stops, dispatch]);

  const positions = [
    pickupPos,
    dropoffPos,
    ...stops.map(s => [s.lat, s.lng]),
  ].filter(pos => pos && Array.isArray(pos) && pos.length === 2 && typeof pos[0] === 'number' && typeof pos[1] === 'number' && !isNaN(pos[0]) && !isNaN(pos[1]));

  if (isLoading) {
    return (
      <div className="flex-1 min-h-[400px] flex items-center justify-center bg-gray-100 rounded-xl shadow-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-[400px] md:min-h-0 relative mx-4 my-2 rounded-xl shadow-lg overflow-hidden">
     

      <MapContainer
        center={[0, 0]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          url={`https://maps.geoapify.com/v1/tile/klokantech-basic/{z}/{x}/{y}.png?apiKey=${apiKey}`}
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | Powered by <a href="https://www.geoapify.com/">Geoapify</a>'
        />
        <ComponentErrorBoundary componentName="UpdateMapView">
          <UpdateMapView positions={positions} />
        </ComponentErrorBoundary>
        {pickupPos && Array.isArray(pickupPos) && pickupPos.length === 2 && typeof pickupPos[0] === 'number' && typeof pickupPos[1] === 'number' && !isNaN(pickupPos[0]) && !isNaN(pickupPos[1]) && (
          <DraggableMarker
            position={pickupPos}
            setPositionAction={setPickupPos}
            label="Pickup"
            icon={pickupIcon}
          />
        )}
        {dropoffPos && Array.isArray(dropoffPos) && dropoffPos.length === 2 && typeof dropoffPos[0] === 'number' && typeof dropoffPos[1] === 'number' && !isNaN(dropoffPos[0]) && !isNaN(dropoffPos[1]) && (
          <DraggableMarker
            position={dropoffPos}
            setPositionAction={setDropoffPos}
            label="Dropoff"
            icon={dropoffIcon}
          />
        )}
        {stops.map((stop, index) => stop && stop.lat && stop.lng && typeof stop.lat === 'number' && typeof stop.lng === 'number' && !isNaN(stop.lat) && !isNaN(stop.lng) && (
          <DraggableMarker
            key={stop.id}
            position={[stop.lat, stop.lng]}
            setPositionAction={(pos) => dispatch(updateStop({ id: stop.id, lat: pos[0], lng: pos[1] }))}
            label="Stop"
            icon={stopIcon(index)}
            stopId={stop.id}
          />
        ))}
        {routeCoords.length > 0 && (
          <Polyline positions={routeCoords} color="#3B82F6" weight={5} opacity={0.7} />
        )}
        {captains.map((captain) =>
          captain.currentLocation && captain.currentLocation.coordinates && Array.isArray(captain.currentLocation.coordinates) && captain.currentLocation.coordinates.length === 2 ? (
            <Marker
              key={captain.driverId}
              position={[captain.currentLocation.coordinates[1], captain.currentLocation.coordinates[0]]}
              icon={captainIcon}
            >
              <Popup className="rounded-lg shadow-lg p-2">
                <div className="font-medium text-gray-800">Driver: {captain.driverId}</div>
              </Popup>
            </Marker>
          ) : null
        )}
        {children}
      </MapContainer>

      
      <button
        onClick={handleRecenter}
        className="absolute bottom-4 right-4 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 transition-colors z-[1000]"
        aria-label="Recenter map"
      >
        <Navigation size={20} className="text-black" />
      </button>
    </div>
  );
};

export default RiderMapContainer;