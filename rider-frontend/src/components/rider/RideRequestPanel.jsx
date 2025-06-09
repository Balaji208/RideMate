import React from "react";
import RideForm from "./RideForm";
import RideSelection from "./RideSelection";
import FindCaptains from "./FindCaptains";
import ScheduledPickupForm from "./ScheduledPickupForm";
import { useSelector, useDispatch } from "react-redux";
import {
  setIsNarrow,
  setIsRequested,
  setPickUpNowClicked,
  setIsDriverMatched
} from "../../redux/rider/slices/locationSlice";
import MatchedDriverInfo from "./MatchedDriverInfo";

const RideRequestPanel = ({
  riders,
  selectedRider,
  handleSwitchRiderClick,
}) => {
  const dispatch = useDispatch();

  const { isNarrow, isRequested, pickUpNowClicked , isDriverMatched } = useSelector(
    (state) => state.location
  );

  return (
    <>
      {!pickUpNowClicked ? (
        <div
          className={`md:mr-4 md:ml-8 w-full ${
            isNarrow ? "md:w-[400px]" : "md:w-[600px]"
          } flex flex-col p-6 md:p-8 rounded-lg md:shadow-2xl max-h-[calc(100vh-64px)] overflow-y-auto`}
        >
          {isNarrow ? (
            <RideForm
              riders={riders}
              selectedRider={selectedRider}
              handleSwitchRiderClick={handleSwitchRiderClick}
            />
          ) : !isRequested ? (
            <RideSelection />
          ) : (
            !isDriverMatched ? 
            <FindCaptains /> :
            <MatchedDriverInfo/>
          )}
        </div>
      ) : (
        <ScheduledPickupForm
          riders={riders}
          selectedRider={selectedRider}
          handleSwitchRiderClick={handleSwitchRiderClick}
        />
      )}
    </>
  );
};

export default RideRequestPanel;
