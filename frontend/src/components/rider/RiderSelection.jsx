import React from 'react';
import { User, ChevronDown } from 'lucide-react';

const RiderSelection = ({ onClick, currentRiderName }) => {
  return (
    <div className="mb-5">
      <div
        onClick={onClick}
        className="inline-flex items-center px-4 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-full border border-gray-300 cursor-pointer"
      >
        <User className="mr-2 text-black" size={16} fill='black' />
        <span className="inter-font text-sm font-medium mr-1">For {currentRiderName}</span>
        <ChevronDown className="text-gray-500" size={14} />
      </div>
    </div>
  );
};

export default RiderSelection; 