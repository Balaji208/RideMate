import React from "react";
import { Clock, ChevronDown } from "lucide-react";
import { useSelector, useDispatch } from 'react-redux';
import { setPickUpNowClicked } from '../../redux/rider/slices/locationSlice';

const PickupToggle = () => {
  const dispatch = useDispatch();
  const { isScheduled, pickUpDate, pickUpTime } = useSelector(state => state.ride);

  const handleToggleClick = () => {
    dispatch(setPickUpNowClicked(true));
  };

  // Format pickup time for display
  const displayPickupTime = () => {
    if (isScheduled && pickUpDate && pickUpTime) {
      const date = new Date(`${pickUpDate}T${pickUpTime}`);
      return date.toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }
    return "Pick up now";
  };

  return (
    <div className="mb-3">
      <div
        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-300 cursor-pointer"
        onClick={handleToggleClick}
      >
        <div className="flex items-center cursor-pointer">
          <Clock className="mr-3 text-black" size={18} />
          <span className="inter-font text-base font-medium">
            {displayPickupTime()}
          </span>
        </div>
        <ChevronDown className="text-gray-500" size={18} />
      </div>
    </div>
  );
};

export default PickupToggle;