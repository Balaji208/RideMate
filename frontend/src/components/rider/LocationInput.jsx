import React, { useState } from 'react';
import { Star, Navigation, MapPin, Plus, X } from 'lucide-react';

const LocationInput = ({
  icon,
  placeholder,
  value,
  setValue,
  onChange,
  isOpen,
  setIsOpen,
  addStop,
}) => {
  const [suggestions] = useState([
    { id: 'saved', label: 'Saved places', icon: <Star size={18} /> },
    { id: 'allow', label: 'Allow location access', subLabel: 'It provides your pickup address', icon: <Navigation size={18} /> },
    { id: 'map', label: 'Set location on map', icon: <MapPin size={18} /> },
    { id: 'example', label: '28 Blossom Rd', subLabel: 'Bakerton, Springs', icon: <MapPin size={18} /> },
  ]);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState('');

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        
        setError('');
      },
      (err) => {
        setError('Failed to get location. Please allow permission.');
        console.error(err);
      }
    );
  };
  const handleSuggestionClick = (suggestion) => {
    if (suggestion.id === 'allow') {
        handleGetLocation();
        console.log(location);
      setValue(location); // Mock current location
    } else if (suggestion.id !== 'map') {
      setValue(suggestion.label);
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    setValue('');
  };

  return (
    <div className="relative mb-3">
      <div
        onClick={() => setIsOpen && setIsOpen(!isOpen)}
        className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-300 focus-within:border-black cursor-pointer"
      >
        <div className="w-6 h-6 flex items-center justify-center rounded-full mr-3">{icon}</div>
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="inter-font w-full bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
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
        <div className="absolute top-full left-0 w-full bg-white shadow-lg rounded-xl mt-1 z-20 border border-gray-100 overflow-hidden">
          {suggestions.map((suggestion) => (
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
                {suggestion.subLabel && <span className="inter-font text-sm text-gray-500">{suggestion.subLabel}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationInput;