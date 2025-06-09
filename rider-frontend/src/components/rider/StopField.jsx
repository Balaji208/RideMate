import React from 'react';
import { X } from 'lucide-react';
import LocationInput from './LocationInput';

const StopField = ({ stop, onRemove }) => {
  return (
    <div className="mb-3">
      <div className="flex items-center">
        <LocationInput
          icon={<div className="w-2 h-2 rounded-full bg-gray-500"></div>}
          placeholder="Add a stop"
          stopId={stop.id}
        />
        <button
          type="button"
          onClick={onRemove}
          className="ml-2 text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default StopField;