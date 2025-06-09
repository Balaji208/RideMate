import React, { useState } from "react";
import LocationInput from "./LocationInput";
import StopField from "./StopField";
import RiderSelection from "./RiderSelection";
import PickupToggle from "./PickupToggle";
import { useSelector, useDispatch } from 'react-redux';
import { setIsNarrow, setPickUpNowClicked,setIsRequested } from '../../redux/rider/slices/locationSlice';
import { setFromLocation, setToLocation, addStop, removeStop, updateStop } from '../../redux/rider/slices/rideSlice';

const RideForm = ({
  riders,
  selectedRider,
  handleSwitchRiderClick,
  
}) => {
  const dispatch = useDispatch();
  const { fromLocation, toLocation, stops } = useSelector(state => state.ride);
  const [isPickupOpen, setIsPickupOpen] = useState(false);
  const [isDropoffOpen, setIsDropoffOpen] = useState(false);

  const handleRideRequest = () => {
    dispatch(setIsNarrow(false));
    dispatch(setIsRequested(false));
    console.log("Clicked")
  };

  const handleAddStop = () => {
    dispatch(addStop());
  };

  const handleRemoveStop = (id) => {
    dispatch(removeStop(id));
  };

  return (
    <>
      <h1 className="text-2xl font-extrabold mb-6 text-black">Get a ride</h1>
      <form>
        <LocationInput
          icon={<div className="w-2 h-2 rounded-full bg-black"></div>}
          placeholder="Pickup location"
          isOpen={isPickupOpen}
          setIsOpen={setIsPickupOpen}
        />
        {stops.map((stop) => (
          <StopField
            key={stop.id}
            stop={stop}
            onRemove={() => handleRemoveStop(stop.id)}
          />
        ))}
        <LocationInput
          icon={<div className="w-2 h-2 rounded-full bg-black"></div>}
          placeholder="Dropoff location"
          isOpen={isDropoffOpen}
          setIsOpen={setIsDropoffOpen}
          addStop={handleAddStop}
        />
        <PickupToggle
          onClick={() => dispatch(setPickUpNowClicked(true))}
        />
        <RiderSelection
          onClick={handleSwitchRiderClick}
          currentRiderName={riders.find((rider) => rider.id === selectedRider)?.name || "Me"}
        />
        <button
          disabled={!fromLocation?.trim() || !toLocation?.trim()}
          onClick={handleRideRequest}
          type="button"
          className="w-full py-3.5 bg-black text-white font-medium text-lg rounded-xl inter-font mt-4 cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Search
        </button>
      </form>
    </>
  );
};

export default RideForm;