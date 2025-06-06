import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setIsNarrow, setIsRequested, setRequestId ,setIsDriverMatched} from '../../redux/rider/slices/locationSlice';
import { setDriverInfo } from "../../redux/rider/slices/rideSlice";
import axios from 'axios';

const FindCaptains = () => {
  const dispatch = useDispatch();
  const {  fromLocation, toLocation } = useSelector(state => state.ride);
  const { requestId } = useSelector(state=>state.location);
  const [matchStatus, setMatchStatus] = useState('pending');
  const [driverDetails, setDriverDetails] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const checkMatchStatus = async () => {
    console.log('req id : ',requestId);
    if (!requestId) return;
    setLoading(true);
    setError(null);

    try {
      console.log("ride match : ",requestId);
      const response = await axios.get(`http://localhost:3002/ride/match/${requestId}`);
      console.log("ride match : ",response);
      setMatchStatus(response.data.status);
      if (response.data.status === 'matched') {
        dispatch(setIsDriverMatched(true));
        dispatch(setDriverInfo(response.data.data));
        setDriverDetails(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error checking match status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
     checkMatchStatus(); // Initial check
    
      const interval = driverDetails == null ? setInterval(checkMatchStatus, 5000) : null; // Poll every 5 seconds
    return () => clearInterval(interval); // Cleanup
  }, [requestId]);

  const handleCancelRide = async () => {
    setLoading(true);
    setError(null);

    try {
      
      await axios.get('http://localhost:3002/clear-redis');
      dispatch(setIsNarrow(true));
      dispatch(setIsRequested(false));
      dispatch(setRequestId(null));
      setMatchStatus('pending');
      setDriverDetails(null);
    } catch (err) {
      setError('Failed to cancel ride');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white flex flex-col p-4 sm:p-6 inter-font justify-between h-full tracking-wide w-full">
      {/* Header Section */}
      <div className="flex flex-col justify-center items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-center">
          {driverDetails ? 'Driver Found!' : 'Ride requested'}
        </h2>
        <h2 className="text-sm sm:text-base text-gray-500 text-center mt-1">
          {driverDetails ? `Driver ${driverDetails.DRIVER_ID} is on the way` : 'Finding drivers nearby'}
        </h2>
        {/* Progress bar */}
        <div className="w-full mt-4 bg-gray-200 h-1 rounded">
          <div className={`h-1 rounded ${driverDetails ? 'bg-green-500 w-full' : 'bg-blue-500 w-1/3'}`}></div>
        </div>
      </div>

      {/* Location Info */}
      <div className="space-y-6 flex-1">
        {/* Start Location */}
        <div className="flex items-start space-x-4">
          <div className="flex flex-col items-center mt-1">
            <div className="w-3 h-3 bg-black rounded-full"></div>
            <div className="w-[2px] h-8 bg-gray-300 mt-1"></div>
          </div>
          <div>
            <h2 className="font-semibold text-base sm:text-lg text-black">
              {fromLocation || 'Egmore Railway Station'}
            </h2>
            <p className="text-sm text-gray-500">Chennai, Tamil Nadu</p>
          </div>
        </div>

        {/* Destination */}
        <div className="flex flex-row justify-between items-start">
          <div className="flex items-start space-x-4 flex-1">
            <div className="flex flex-col items-center mt-1">
              <div className="w-3 h-3 border-2 border-black bg-white"></div>
            </div>
            <div>
              <h2 className="font-semibold text-base sm:text-lg text-black">
                {toLocation || 'Kotturpuram'}
              </h2>
              <p className="text-sm text-gray-500">Chennai, Tamil Nadu</p>
            </div>
          </div>
          <button className="bg-gray-100 hover:bg-gray-200 transition-colors px-4 py-2 rounded-lg text-sm font-medium tracking-wide ml-4 flex-shrink-0 text-gray-700">
            Change
          </button>
        </div>

        {/* Driver Details (if matched) */}
        {driverDetails && (
          <div className="flex items-start space-x-4 py-4 border-t border-gray-200">
            <div className="flex items-center justify-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
                {driverDetails.DRIVER_ID[0]}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-black">{driverDetails.DRIVER_ID}</h3>
              <p className="text-sm text-gray-500">ETA: {driverDetails.eta} min</p>
              <p className="text-sm text-gray-500">Rating: {driverDetails.rating}</p>
            </div>
          </div>
        )}

        {/* Price and Payment */}
        <div className="flex items-center space-x-4 py-4">
          <div className="flex items-center justify-center">
            <div className="w-6 h-4 bg-black rounded-sm flex items-center justify-center">
              <div className="w-4 h-[2px] bg-white"></div>
            </div>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-black">₹{87.69}</h3>
            <h3 className="text-sm text-gray-500">Cash</h3>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-red-500 text-center">{error}</div>
        )}
      </div>

      {/* Cancel Button */}
      <button
        onClick={handleCancelRide}
        className="w-full p-3 sm:p-4 bg-gray-100 hover:bg-gray-200 text-red-500 rounded-xl font-medium transition-colors mb-8 mt-4"
        disabled={loading}
      >
        {loading ? 'Cancelling...' : 'Cancel ride'}
      </button>
    </div>
  );
};

export default FindCaptains;