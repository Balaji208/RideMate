import React, { useEffect, useState } from "react";
import LocationInput from "./LocationInput";
import StopField from "./StopField";
import RiderSelection from "./RiderSelection";
import PickupToggle from "./PickupToggle";
import ScheduledPickupForm from "./ScheduledPickupForm";
import { ChevronDown, Clock } from "lucide-react";

const RideRequestPanel = ({
  pickupLocation,
  setPickupLocation,
  isPickupOpen,
  setIsPickupOpen,
  stops,
  handleAddStop,
  handleRemoveStop,
  handleStopChange,
  dropoffLocation,
  setDropoffLocation,
  handleSwitchRiderClick,
  riders,
  selectedRider,
}) => {
  const currentRider = riders.find((rider) => rider.id === selectedRider);
  const [pickUpNowClicked, setPickUpNowClicked] = useState(false);

  return (
    <>
      {pickUpNowClicked ? (
        <div className="mx-4 w-full md:w-96 flex flex-col p-6 md:p-10 rounded-xl shadow-2xl z-10 max-h-[calc(100vh-64px)] overflow-y-auto">
          <h1 className="text-2xl font-extrabold mb-6 text-black ">Get a ride</h1>
          <form>
            <LocationInput
              icon={<div className="w-2 h-2 rounded-full bg-black"></div>}
              placeholder="Pickup location"
              value={pickupLocation}
              setValue={setPickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              isOpen={isPickupOpen}
              setIsOpen={setIsPickupOpen}
            />
            {stops.map((stop) => (
              <StopField
                key={stop.id}
                stop={stop}
                onChange={(value) => handleStopChange(stop.id, value)}
                onRemove={() => handleRemoveStop(stop.id)}
              />
            ))}
            <LocationInput
              icon={<div className="w-2 h-2 rounded-full bg-black"></div>}
              placeholder="Dropoff location"
              value={dropoffLocation}
              setValue={setDropoffLocation}
              onChange={(e) => setDropoffLocation(e.target.value)}
              isOpen={false} // No dropdown for dropoff in this view
              setIsOpen={() => {}}
              addStop={handleAddStop}
            />
            <PickupToggle
              pickUpData=""
              onClick={() => setPickUpNowClicked(!pickUpNowClicked)}
            />
            <RiderSelection
              onClick={handleSwitchRiderClick}
              currentRiderName={currentRider ? currentRider.name : "Me"}
            />
            <button
              type="button"
              className="w-full py-3.5 bg-black text-white font-medium text-lg rounded-xl inter-font mt-4"
            >
              Search
            </button>
          </form>
        </div>
      ) : (
        <ScheduledPickupForm
          setPickUpNowClicked={setPickUpNowClicked}
          riders={riders}
          selectedRider={selectedRider}
          handleSwitchRiderClick={handleSwitchRiderClick}
        />
      )}
    </>
  );
};

export default RideRequestPanel;