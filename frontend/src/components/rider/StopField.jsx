import React from 'react';
import { X } from 'lucide-react';

const StopField = ({ stop, onChange, onRemove }) => {
  return (
    <div className="mb-3">
      <div className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-300">
        <div className="w-6 h-6 flex items-center justify-center rounded-full mr-3">
          <div className="w-2 h-2 rounded-full bg-gray-500"></div>
        </div>
        <input
          type="text"
          placeholder="Add a stop"
          value={stop.location}
          onChange={(e) => onChange(e.target.value)}
          className="inter-font w-full bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
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