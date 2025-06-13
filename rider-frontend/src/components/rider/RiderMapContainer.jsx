
import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import io from 'socket.io-client';
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
import { MapPin, Navigation } from 'lucide-react';

const socket = io('http://localhost:3002', { reconnection: true, transports: ['websocket', 'polling'] });

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

const captainIcon = (rotation = 0) => L.divIcon({
  html: `
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="transform: rotate(${rotation}deg)">
      <path d="M20 8H17V6C17 4.9 16.1 4 15 4H9C7.9 4 7 4.9 7 6V8H4C2.9 8 2 8.9 2 10V16C2 17.1 2.9 18 4 18H7V20H9V18H15V20H17V18H20C21.1 18 22 17.1 22 16V10Z" fill="#1F2937"/>
    </svg>
  `,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const riderIcon = L.divIcon({
  html: `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#22C55E"/>
      <circle cx="12" cy="12" r="6" fill="white"/>
    </svg>
  `,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Error Boundary
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

const UpdateMapView = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    try {
      if (center && Array.isArray(center) && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
        console.log('[UpdateMapView] Centering on:', center);
        map.setView(center, 15, { animate: true });
      }
    } catch (error) {
      console.error('[UpdateMapView] Error updating map view:', error);
    }
  }, [center, map]);
  return null;
};

const DraggableMarker = ({ position, setPositionAction, label, icon, stopId }) => {
  const markerRef = useRef(null);
  const dispatch = useDispatch();
  const stops = useSelector(state => state.ride.stops);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.on('dragend', async () => {
        try {
          const newPos = markerRef.current.getLatLng();
          console.log(`[DraggableMarker] ${label} dragged to:`, [newPos.lat, newPos.lng]);
          dispatch(setPositionAction([newPos.lat, newPos.lng]));
          const address = await reverseGeocode(newPos.lat, newPos.lng);
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

  if (!position || !Array.isArray(position) || position.length !== 2 || isNaN(position[0]) || isNaN(position[1])) {
    console.warn(`[DraggableMarker] Invalid position for ${label}:`, position);
    return null;
  }

  const stopIndex = stopId ? stops.findIndex(s => s.id === stopId) : -1;

  return (
    <ComponentErrorBoundary componentName="DraggableMarker">
      <Marker position={position} draggable={true} icon={icon} ref={markerRef}>
        <Popup className="rounded-lg shadow-lg p-2">
          <div className="font-medium text-gray-800">{label}</div>
          {label === 'Stop' && stopIndex >= 0 && (
            <div className="text-sm text-gray-500">Stop ${stopIndex + 1}</div>
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
  const [driverPaths, setDriverPaths] = useState({});
  const [riderPath, setRiderPath] = useState([]);
  const [driverPosition, setDriverPosition] = useState(null);
  const [riderPosition, setRiderPosition] = useState(null);
  const [driverRotation, setDriverRotation] = useState(0);
  const animationRef = useRef(null);

  // Initialize simulation
  useEffect(() => {
    dispatch(setPickupPos([13.0213, 80.6717]));
    dispatch(setDropoffPos([13.0778, 80.2619]));
    dispatch(setCenter([13.0213, 80.6717]));
    console.log('[RiderMapContainer] Initialized pickup:', [13.0213, 80.6717], 'dropoff:', [13.0778, 80.2619]);
  }, [dispatch]);

  // WebSocket updates
  useEffect(() => {
    socket.on('connect', () => console.log('[RiderMapContainer] WebSocket connected to 3002'));
    socket.on('connect_error', (err) => console.error('[RiderMapContainer] WebSocket error:', err.message));

    socket.on('locationUpdate', (data) => {
      console.log('[RiderMapContainer] Location update:', data);
      if (!data.driverId || !data.currentLocation?.coordinates) {
        console.warn('[RiderMapContainer] Invalid locationUpdate data:', data);
        return;
      }
      const [lng, lat] = data.currentLocation.coordinates;
      dispatch(updateCaptainLocation({
        driverId: data.driverId,
        currentLocation: { coordinates: [lng, lat] },
      }));
      setDriverPosition([lat, lng]);
      setDriverPaths(prev => {
        const newPath = [...(prev[data.driverId] || []), [lat, lng]].slice(-100);
        console.log(`[RiderMapContainer] Updated driver path for ${data.driverId}:`, newPath);
        return { ...prev, [data.driverId]: newPath };
      });

      // Calculate rotation based on previous position
      const prevPath = driverPaths[data.driverId] || [];
      if (prevPath.length > 0) {
        const prevPos = prevPath[prevPath.length - 1];
        const angle = Math.atan2(lng - prevPos[1], lat - prevPos[0]) * (180 / Math.PI);
        setDriverRotation(angle);
      }
    });

    socket.on('userLocation', (data) => {
      console.log('[RiderMapContainer] User location:', data);
      if (!data.riderId || !data.lat || !data.long) {
        console.warn('[RiderMapContainer] Invalid userLocation data:', data);
        return;
      }
      dispatch(setUserLocation({ lat: data.lat, lng: data.long }));
      setRiderPosition([data.lat, data.long]);
      setRiderPath(prev => {
        const newPath = [...prev, [data.lat, data.long]].slice(-100);
        console.log(`[RiderMapContainer] Updated rider path for ${data.riderId}:`, newPath);
        return newPath;
      });
    });

    socket.on('rideRequest', (data) => {
      console.log('[RiderMapContainer] Ride request received:', data);
      // Update UI or state as needed
    });

    return () => {
      socket.off('locationUpdate');
      socket.off('userLocation');
      socket.off('rideRequest');
      socket.off('connect');
      socket.off('connect_error');
    };
  }, [dispatch, driverPaths]);

  // Fetch nearby captains
  useEffect(() => {
    if (userLocation) {
      axios.get(`http://localhost:3002/captains/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}`)
        .then(response => {
          dispatch(setCaptains(response.data));
          console.log('[RiderMapContainer] Fetched captains:', response.data);
        })
        .catch(err => console.error('[RiderMapContainer] Error fetching captains:', err));
    }
  }, [userLocation, dispatch]);

  // Geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          dispatch(setUserLocation({ lat: latitude, lng: longitude }));
          if (!fromLocation) {
            reverseGeocode(latitude, longitude).then(address => {
              dispatch(setFromLocation(address));
            });
          }
          socket.emit('userLocation', { lat: latitude, lng: longitude, riderId: 'user1', city: 'Chennai' });
          dispatch(setIsLoading(false));
        },
        err => {
          console.error('[RiderMapContainer] Geolocation error:', err);
          dispatch(setIsLoading(false));
        }
      );
    } else {
      dispatch(setIsLoading(false));
    }
  }, [dispatch, fromLocation]);

  // Routing
  const fetchRoute = async () => {
    const validStops = stops.filter(s => s.lat && s.lng);
    const waypoints = [pickupPos, ...validStops.map(s => [s.lat, s.lng]), dropoffPos].filter(
      pos => pos && Array.isArray(pos) && pos.length === 2 && !isNaN(pos[0]) && !isNaN(pos[1])
    );
    if (waypoints.length < 2) {
      dispatch(setRouteCoords([]));
      return;
    }
    try {
      const waypointStr = waypoints.map(pos => `${pos[0]},${pos[1]}`).join('|');
      const response = await axios.get(
        `https://api.geoapify.com/v1/routing?waypoints=${waypointStr}&mode=drive&details=instruction_details&apiKey=${apiKey}`
      );
      const coords = response.data.features[0].geometry.coordinates[0].map(([lng, lat]) => [lat, lng]);
      dispatch(setRouteCoords(coords));
      console.log('[RiderMapContainer] Fetched route:', coords);
    } catch (error) {
      console.error('[RiderMapContainer] Routing error:', error);
      dispatch(setRouteCoords([]));
    }
  };

  useEffect(() => {
    fetchRoute();
  }, [pickupPos, dropoffPos, stops]);

  const positions = [
    pickupPos,
    dropoffPos,
    ...stops.map(s => [s.lat, s.lng]),
    ...captains.map(c => c.currentLocation?.coordinates ? [c.currentLocation.coordinates[1], c.currentLocation.coordinates[0]] : null),
    driverPosition,
    riderPosition,
    ...Object.values(driverPaths).flat(),
    ...riderPath,
  ].filter(pos => pos && Array.isArray(pos) && pos.length === 2 && !isNaN(pos[0]) && !isNaN(pos[1]));

  if (isLoading) {
    return (
      <div className="flex-1 min-h-[400px] flex items-center justify-center bg-gray-100 rounded-xl shadow-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  console.log('[RiderMapContainer] Rendering - captains:', captains, 'driverPaths:', driverPaths, 'riderPath:', riderPath, 'positions:', positions);

  return (
    <div className="flex-1 min-h-[400px] relative mx-4 my-2 rounded-xl shadow-lg overflow-hidden">
      <MapContainer
        center={[13.0213, 80.6717]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          url={`https://maps.geoapify.com/v1/tile/klokantech-basic/{z}/{x}/{y}.png?apiKey=${apiKey}`}
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | Powered by <a href="https://www.geoapify.com/">Geoapify</a>'
        />
        <UpdateMapView center={driverPosition || riderPosition || pickupPos} />
        {pickupPos[0] && pickupPos[1] && (
          <DraggableMarker position={pickupPos} setPositionAction={setPickupPos} label="Pickup" icon={pickupIcon} />
        )}
        {dropoffPos[0] && dropoffPos[1] && (
          <DraggableMarker position={dropoffPos} setPositionAction={setDropoffPos} label="Dropoff" icon={dropoffIcon} />
        )}
        {stops.map((stop, index) => stop.lat && stop.lng && (
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
        {driverPosition && (
          <Marker position={driverPosition} icon={captainIcon(driverRotation)}>
            <Popup className="rounded-lg shadow-lg p-2">
              <div className="font-medium text-gray-800">Driver: DRV001</div>
            </Popup>
          </Marker>
        )}
        {riderPosition && (
          <Marker position={riderPosition} icon={riderIcon}>
            <Popup className="rounded-lg shadow-lg p-2">
              <div className="font-medium text-gray-800">Rider: user1</div>
            </Popup>
          </Marker>
        )}
        {Object.entries(driverPaths).map(([driverId, path]) => path.length > 1 && (
          <Polyline key={driverId} positions={path} color="#FF0000" weight={3} opacity={0.6} />
        ))}
        {riderPath.length > 1 && (
          <Polyline positions={riderPath} color="#22C55E" weight={3} opacity={0.6} />
        )}
        {children}
      </MapContainer>
      <button
        onClick={() => dispatch(setCenter(driverPosition || riderPosition || pickupPos))}
        className="absolute bottom-4 right-4 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 transition-colors z-[1000]"
        aria-label="Recenter map"
      >
        <Navigation size={20} className="text-black" />
      </button>
    </div>
  );
};

export default RiderMapContainer;