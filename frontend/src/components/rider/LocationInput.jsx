import React, { useState, useEffect, useCallback } from 'react';
import { Star, Navigation, MapPin, Plus, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import debounce from 'lodash.debounce';
import { setPickupPos, setDropoffPos } from '../../redux/rider/slices/mapSlice';
import { setFromLocation, setToLocation, updateStop } from '../../redux/rider/slices/rideSlice';
import { reverseGeocode } from '../../utils/reverseGeocode';

// Error Boundary Component
class LocationInputErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    //console.error('[LocationInputErrorBoundary] Caught error:', error);
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-red-500">
          Error in location input: {this.state.error?.message || 'Unknown error'}
        </div>
      );
    }
    return this.props.children;
  }
}

const LocationInput = ({
  icon,
  placeholder,
  addStop,
  stopId,
}) => {
  const dispatch = useDispatch();
  const { pickupPos } = useSelector(state => state.map);
  const { fromLocation, toLocation, stops } = useSelector(state => state.ride);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState('');
  const [dynamicSuggestions, setDynamicSuggestions] = useState([]);
  const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;

  const isPickup = placeholder === 'Pickup location';
  const isDropoff = placeholder === 'Dropoff location';
  const isStop = !!stopId;
  const value = isStop
    ? stops.find((s) => s.id === stopId)?.location || ''
    : isPickup
    ? fromLocation
    : toLocation;
  const setValue = (val) => {
    if (isStop) {
      dispatch(updateStop({ id: stopId, location: val }));
    } else {
      dispatch(isPickup ? setFromLocation(val) : setToLocation(val));
    }
  };

  const staticSuggestions = [
    { id: 'saved', label: 'Saved locations', icon: <Star size={18} key="star" /> },
    { id: 'allow', label: 'Use current location', subLabel: 'Set your current address', icon: <Navigation size={18} key="nav" /> },
    { id: 'map', label: 'Choose on map', icon: <MapPin size={18} key="map-pin" /> },
  ];

  const fetchSuggestions = useCallback(
    debounce(async (query) => {
      if (!query || query.length < 3) {
        setDynamicSuggestions([]);
        //console.log(`[${placeholder}] fetchSuggestions: Query too short or empty (query: "${query}")`);
        return;
      }

      if (!apiKey) {
        setError('API key missing');
        //console.error(`[${placeholder}] fetchSuggestions: Missing API key`);
        return;
      }

      try {
        const params = {
          text: query,
          format: 'json',
          apiKey,
          limit: 5,
        };

        // Apply bias for dropoff or stops near pickup
        if ((isDropoff || isStop) && pickupPos?.[0] && pickupPos?.[1]) {
          const biasLat = pickupPos[0];
          const biasLng = pickupPos[1];
          if (!isNaN(biasLat) && !isNaN(biasLng)) {
            params.bias = `circle:${biasLng},${biasLat},1000`;
            //console.log(`[${placeholder}] fetchSuggestions: Applied bias circle at ${biasLat},${biasLng}`);
          }
        }

        //console.log(`[${placeholder}] fetchSuggestions: Sending request with params`, params);
        const response = await axios.get(
          `https://api.geoapify.com/v1/geocode/autocomplete`,
          { params }
        );

        const suggestions = response.data.results.map((result) => ({
          id: result.place_id,
          label: result.formatted,
          subLabel: result.address_line2 || '',
          icon: <MapPin size={18} key={`pin-${result.place_id}`} />,
          lat: result.lat,
          lng: result.lon,
        }));

        //console.log(`[${placeholder}] fetchSuggestions: Received ${suggestions.length} suggestions`, suggestions);
        setDynamicSuggestions(suggestions);
      } catch (err) {
        //console.error(`[${placeholder}] Autocomplete error:`, err);
        setError('Failed to fetch location suggestions');
        setDynamicSuggestions([]);
      }
    }, 300),
    [apiKey, pickupPos, placeholder, isDropoff, isStop]
  );

  useEffect(() => {
    //console.log(`[${placeholder}] useEffect: isOpen=${isOpen}, value="${value}"`);
    if (!isOpen) {
      setDynamicSuggestions([]);
      //console.log(`[${placeholder}] useEffect: Suggestions cleared (isOpen=false)`);
      return;
    }

    if (value && value.length >= 3) {
      //console.log(`[${placeholder}] useEffect: Triggering fetchSuggestions for value="${value}"`);
      fetchSuggestions(value);
    } else {
      setDynamicSuggestions([]);
      //console.log(`[${placeholder}] useEffect: No suggestions (value too short)`);
    }

    return () => {
      fetchSuggestions.cancel();
      //console.log(`[${placeholder}] useEffect cleanup`);
    };
  }, [value, isOpen, fetchSuggestions]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser.');
      //console.log(`[${placeholder}] Geolocation not supported`);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        //console.log(`[${placeholder}] Geolocation success: lat=${latitude}, lng=${longitude}`);
        reverseGeocode(latitude, longitude).then((address) => {
          setValue(address);
          if (isStop) {
            dispatch(updateStop({ id: stopId, location: address, lat: latitude, lng: longitude }));
          } else {
            dispatch(isPickup ? setPickupPos([latitude, longitude]) : setDropoffPos([latitude, longitude]));
          }
          //console.log(`[${placeholder}] Set address: ${address}`);
          setIsOpen(false);
        });
      },
      (err) => {
        setError('Failed to get location. Please allow permission.');
        //console.error(`[${placeholder}] Geolocation error:`, err);
      }
    );
  };

  const handleSuggestionClick = (suggestion) => {
    if (!suggestion) {
      //console.warn(`[${placeholder}] handleSuggestionClick: Invalid suggestion`);
      return;
    }

    //console.log(`[${placeholder}] Suggestion clicked:`, suggestion);
    if (suggestion.id === 'allow') {
      handleGetLocation();
    } else if (suggestion.id === 'saved' || suggestion.id === 'map') {
      setValue(suggestion.label);
      if (isStop) {
        dispatch(updateStop({ id: stopId, location: suggestion.label }));
      } else {
        dispatch(isPickup ? setPickupPos([0, 0]) : setDropoffPos([0, 0]));
      }
      setIsOpen(false);
    } else {
      setValue(suggestion.label);
      if (suggestion.lat && suggestion.lng) {
        if (isStop) {
          dispatch(updateStop({ id: stopId, location: suggestion.label, lat: suggestion.lat, lng: suggestion.lng }));
        } else {
          dispatch(isPickup ? setPickupPos([suggestion.lat, suggestion.lng]) : setDropoffPos([suggestion.lat, suggestion.lng]));
        }
      }
      setIsOpen(false);
    }
    setDynamicSuggestions([]);
  };

  const handleClear = () => {
    //console.log(`[${placeholder}] Clearing input`);
    setValue('');
    setDynamicSuggestions([]);
    setError('');
    if (isStop) {
      dispatch(updateStop({ id: stopId, location: '', lat: null, lng: null }));
    } else {
      dispatch(isPickup ? setPickupPos([0, 0]) : setDropoffPos([0, 0]));
    }
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    //console.log(`[${placeholder}] Input changed to:`, newValue);
    setValue(newValue);
    setError('');
    if (newValue.length >= 3) {
      setIsOpen(true);
      fetchSuggestions(newValue);
    } else {
      setDynamicSuggestions([]);
    }
  };

  const suggestionsToShow = value && value.length >= 3 ? [...dynamicSuggestions,...staticSuggestions ] : staticSuggestions;

  return (
    <LocationInputErrorBoundary>
      <div className="relative mb-3">
        <div
          onClick={() => {
          //  //console.log(`[${placeholder}] Clicked input, current isOpen:`, isOpen);
            setIsOpen(true);
          }}
          className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-300 focus-within:border-black cursor-pointer"
        >
          <div className="w-6 h-6 flex items-center justify-center rounded-full mr-3">
            {icon || <MapPin size={18} />}
          </div>
          <input
            type="text"
            placeholder={placeholder}
            value={value || ''}
            onChange={handleInputChange}
            onFocus={() => {
             // //console.log(`[${placeholder}] Input focused`);
              setIsOpen(true);
            }}
            className="inter-font w-full bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
            autoComplete="off"
          />
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          )}
          {addStop && (
            <button
              type="button"
              onClick={addStop}
              className="ml-2 text-black hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center"
            >
              <Plus size={18} />
            </button>
          )}
        </div>
        {isOpen && (
          <div className="absolute top-full left-0 w-full bg-white shadow-lg rounded-xl mt-1 z-20 border border-gray-100 overflow-hidden max-h-60 overflow-y-auto">
            {error && (
              <div className="p-3.5 text-red-500 text-sm">{error}</div>
            )}
            <div className="cursor-pointer p-2" onClick={() => setIsOpen(false)}>X</div>
            {suggestionsToShow.length > 0 ? (
              suggestionsToShow.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="flex items-center gap-3 p-3.5 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100">
                    {suggestion.icon}
                  </div>
                  <div className="flex flex-col">
                    <span className="inter-font text-base font-medium">{suggestion.label}</span>
                    {suggestion.subLabel && (
                      <span className="inter-font text-sm text-gray-500">{suggestion.subLabel}</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3.5 text-gray-500 text-sm">No suggestions available</div>
            )}
          </div>
        )}
      </div>
    </LocationInputErrorBoundary>
  );
};

export default LocationInput;