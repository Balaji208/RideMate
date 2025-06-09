import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MdCall } from "react-icons/md";
import { AiOutlineSafety } from "react-icons/ai";
import { FaShareAlt,FaInfoCircle  } from "react-icons/fa";
import {
  setIsNarrow,
  setIsRequested,
  setRequestId,
  setIsDriverMatched,
} from "../../redux/rider/slices/locationSlice";
import { setDriverInfo } from "../../redux/rider/slices/rideSlice";
import axios from "axios";

const MatchedDriverInfo = () => {
  const dispatch = useDispatch();
  const { fromLocation, toLocation } = useSelector((state) => state.ride);
  const { requestId } = useSelector((state) => state.location);
  const [matchStatus, setMatchStatus] = useState("pending");
  const [driverDetails, setDriverDetails] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { driverInfo } = useSelector((state) => state.ride);
  console.log("infor ", driverInfo);

  const handleCancelRide = async () => {
    setLoading(true);
    setError(null);

    try {
      await axios.get("http://localhost:3002/clear-redis");
      dispatch(setIsNarrow(true));
      dispatch(setIsRequested(true));
      dispatch(setRequestId(null));
      setMatchStatus("pending");
      setDriverDetails(null);
    } catch (err) {
      setError("Failed to cancel ride");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inter-font flex flex-col p-4 sm:p-6 space-y-6">
      {/* Share PIN Section */}
      <div className="text-center text-2xl font-semibold">Pick up in {driverInfo.eta} mins</div>
      {/* Divider */}
      <div className="border-t border-gray-200" />
      <div className="mt-8 flex items-center justify-between">
        <div className="flex">
            <h2 className="inter-font font-medium  tracking-wide text-black ">
          Share PIN with Driver 

        </h2>
            <div className="ml-2 mt-1"><FaInfoCircle /></div>
        </div>
        

        <div className="flex space-x-1">
          {[1, 2, 3, 4].map((digit) => (
            <div
              key={digit}
              className="w-8 h-8 flex items-center justify-center bg-blue-500 rounded-sm text-white font-medium"
            >
              {digit}
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200" />

      {/* Driver Info Section */}
      <div className="flex items-center justify-between">
        <h2 className="uppercase font-medium text-base sm:text-lg text-black">
          Name
        </h2>
        <div className="flex flex-col items-end">
          <h2 className="text-base sm:text-lg font-medium text-black">
            TN-1234433
          </h2>
          <p className="text-sm text-gray-500">Vehicle Name</p>
        </div>
      </div>

      {/* Message and Call Buttons */}
      <div className="flex space-x-3">
        <button className="flex-1 p-3 bg-gray-200 rounded-xl font-medium text-black text-center hover:bg-gray-300 transition-colors">
          Send a message
        </button>
        <button className="w-12 h-12 flex items-center justify-center bg-gray-200 rounded-xl hover:bg-gray-300 transition-colors">
          <MdCall className="text-black text-xl" />
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200" />

      {/* Location Info */}
      <div className="space-y-6">
        {/* Start Location */}
        <div className="flex items-start space-x-4">
          <div className="flex flex-col items-center mt-1">
            <div className="w-3 h-3 bg-black rounded-full"></div>
            <div className="w-[2px] h-8 bg-gray-300 mt-1"></div>
          </div>
          <div>
            <h2 className="font-medium text-base sm:text-lg text-black">
              {fromLocation || "Egmore Railway Station"}
            </h2>
            <p className="text-sm text-gray-500">Chennai, Tamil Nadu</p>
          </div>
        </div>

        {/* Destination */}
        <div className="flex items-start space-x-4">
          <div className="flex flex-col items-center mt-1">
            <div className="w-3 h-3 border-2 border-black bg-white rounded-full"></div>
          </div>
          <div className="flex-1">
            <h2 className="font-medium text-base sm:text-lg text-black">
              {toLocation || "Kotturpuram"}
            </h2>
            <p className="text-sm text-gray-500">Chennai, Tamil Nadu</p>
          </div>
          <button className="bg-gray-100 hover:bg-gray-200 transition-colors px-4 py-2 rounded-lg text-sm font-medium text-gray-700">
            Change
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200" />

      {/* Price and Payment */}
      <div className="flex items-center space-x-4">
        <div className="w-6 h-4 bg-black rounded-sm flex items-center justify-center">
          <div className="w-4 h-[2px] bg-white"></div>
        </div>
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-black">₹87.69</h3>
          <p className="text-sm text-gray-500">Cash</p>
        </div>
      </div>

      {/* Safety */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <AiOutlineSafety className="text-xl text-black" />
          <p className="inter-font font-medium text-lg text-black">Safety</p>
        </div>
        <button className="bg-gray-100 hover:bg-gray-200 transition-colors px-4 py-2 rounded-lg text-sm font-medium text-gray-700">
          Safety
        </button>
      </div>

      {/* Share Trip */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FaShareAlt className="text-xl text-black" />
          <p className="inter-font font-medium text-lg text-black">Share my trip</p>
        </div>
        <button className="bg-gray-100 hover:bg-gray-200 transition-colors px-4 py-2 rounded-lg text-sm font-medium text-gray-700">
          Share
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200" />

      {/* Cancel Button */}
      <button
        onClick={handleCancelRide}
        className="w-full p-3 bg-gray-100 hover:bg-gray-200 text-red-500 rounded-xl font-medium transition-colors"
        disabled={loading}
      >
        {loading ? "Cancelling..." : "Cancel ride"}
      </button>

      {/* Error Message */}
      {error && (
        <p className="text-red-500 text-sm text-center mt-2">{error}</p>
      )}
    </div>
  );
};

export default MatchedDriverInfo;