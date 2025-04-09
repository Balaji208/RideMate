import React from "react";
import { Clock, ChevronDown } from "lucide-react";

const PickupToggle = ({ pickUpData, onClick }) => {
  return (
    <div className="mb-3">
      <div
        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-300 cursor-pointer"
        onClick={onClick}
      >
        <div className="flex items-center cursor-pointer">
          <Clock className="mr-3 text-black" size={18} />
          <span className="inter-font text-base font-medium">
            {pickUpData.length > 0 ? pickUpData : "Pick up now"}
          </span>
        </div>
        <ChevronDown className="text-gray-500" size={18} />
      </div>
    </div>
  );
};

export default PickupToggle;