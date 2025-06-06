import React, { useState } from 'react';
import { FaUser, FaTimes } from "react-icons/fa";
import { useSelector, useDispatch } from 'react-redux';
import { setIsNarrow, setIsRequested, setRequestId } from '../../redux/rider/slices/locationSlice';
import axios from 'axios';

const data = [
  {
    "image": "https://d1a3f4spazzrp4.cloudfront.net/car-types/haloProductImages/Cricket_UberGo.png",
    "vehicleName": "Uber Go",
    "ETA": 2,
    "Arrival Time": "8:30 PM",
    "capacity": 4,
    "Quotes": "Affordable compact rides",
    "Price": 200,
    "discount": "20% off",
    "originalPrice": 250,
    "rideType": "economy"
  },
  {
    "image": "https://d1a3f4spazzrp4.cloudfront.net/car-types/haloProductImages/Cricket_Uber_Tuktuk.png",
    "vehicleName": "Auto",
    "ETA": 1,
    "capacity": 3,
    "Arrival Time": "8:49 PM",
    "Quotes": "Pay directly to driver, cash/UPI only",
    "Price": 159.16,
    "rideType": "bikeTaxi"
  },
  {
    "image": "https://d1a3f4spazzrp4.cloudfront.net/car-types/haloProductImages/Cricket_Uber_Moto.png",
    "vehicleName": "Moto",
    "ETA": 2,
    "capacity": 2,
    "Arrival Time": "8:48 PM",
    "Quotes": "Affordable, motorcycle rides",
    "Price": 85.50,
    "rideType": "bikeTaxi"
  },
  {
    "image": "https://d1a3f4spazzrp4.cloudfront.net/car-types/haloProductImages/v1.1/Moto_v1.png",
    "vehicleName": "Moto Saver",
    "ETA": 45,
    "capacity": 2,
    "Arrival Time": "8:45",
    "Quotes": "Auto rides",
    "Price": 60,
    "rideType": "bikeTaxi"
  }
];

const PaymentModal = ({ isOpen, onClose, selectedPayment, onPaymentSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/30 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-black">Payment options</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-50 cursor-pointer">
            <FaTimes size={20} className="text-gray-600 cursor-pointer" />
          </button>
        </div>
        <div className="p-6">
          <div className="mb-8">
            <div className="flex items-center-between mb-4">
              <span className="text-lg text-gray-600">Uber Cash: ₹0.00</span>
              <div className="relative">
                <input type="checkbox" className="sr-only" />
                <div className="w-12 h-6 bg-gray-200 rounded-full flex items-center">
                  <div className="w-5 h-5 bg-white rounded-full ml-1 cursor-pointer"></div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-6 bg-black rounded flex items-center justify-items-center">
                <span className="text-white text-xs font-bold">uber</span>
              </div>
              <span className="text-gray-800 font-medium">Uber Cash: ₹0.00</span>
            </div>
          </div>
          <div className="mb-8">
            <h3 className="text-gray-600 text-lg mb-4">Payment method</h3>
            <div
              className="flex items-center justify-between p-4 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => onPaymentSelect('cash')}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-lg">💵</span>
                </div>
                <span className="text-black font-medium">Cash</span>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedPayment === 'cash' ? 'border-black bg-black' : 'border-gray-300'
              }`}>
                {selectedPayment === 'cash' && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg opacity-50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                  <span className="text-orange-600 text-xs text-bold">UPI</span>
                </div>
                <div>
                  <span className="text-black font-medium block">UPI</span>
                  <span className="text-red-500 text-sm">Unavailable</span>
                </div>
              </div>
              <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full bg-black text-white py-4 rounded-lg font-medium text-lg cursor-pointer hover:bg-gray-800 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const RideSelection = () => {
  const [selectedRide, setSelectedRide] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();
  const { fromLocation, toLocation, isNarrow, isRequested } = useSelector(state => state.ride);

  const handleClick = () => {
    dispatch(setIsNarrow(true));
  };

  const handleRequest = async () => {
    setLoading(true);
    setError(null);

    const riderId = "user123"; // Replace with auth user ID
    const pickupLat = 13.0777; // Chennai Egmore Railway Station
    const pickupLong = 80.2618;
    const city = "Chennai";
    const rideType = data[selectedRide].rideType;

    try {
      // Register rider location
      console.log("rider location sent : ",riderId,pickupLat,pickupLong,city);
      await axios.post('http://localhost:3002/location/rider/', {
        riderId,
        lat: pickupLat,
        long: pickupLong,
        city
      });

      // Request ride
      const response = await axios.post('http://localhost:3002/ride/request', {
        riderId,
        lat: pickupLat,
        long: pickupLong,
        rideType,
        city
      });

      if (response.data.success) {
        dispatch(setRequestId(response.data.requestId));
        dispatch(setIsRequested(true));
      } else {
        setError('Failed to request ride');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  const handleRideSelect = (index) => {
    setSelectedRide(index);
  };

  const handlePaymentClick = () => {
    setShowPaymentModal(true);
  };

  const handlePaymentSelect = (paymentType) => {
    setSelectedPayment(paymentType);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
  };

  if (isRequested) {
    return null; // Render FindCaptains via parent component
  }

  return (
    <div className="w-full bg-white p-4">
      <div className="mb-6">
        <h1 className="font-bold text-4xl mb-4">Choose a ride</h1>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
          <div className="flex items-center text-black font-medium mb-1">
            <span>{fromLocation || "Egmore Railway Station"}</span>
            <span className="mx-2">→</span>
            <span>{toLocation || "Kotturpuram"}</span>
          </div>
          <div
            onClick={handleClick}
            className="cursor-pointer bg-gray-300 text-sm rounded-xl p-2 w-32 text-center"
          >
            Leave Now
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 text-red-500 text-center">{error}</div>
      )}

      <div className="space-y-4">
        {data.map((ride, index) => (
          <div
            key={index}
            onClick={() => handleRideSelect(index)}
            className={`w-full border-2 p-4 rounded-xl cursor-pointer transition-colors hover:shadow-md ${
              selectedRide === index ? 'border-black bg-white' : 'border-transparent bg-gray-50'
            }`}
          >
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <div className="w-28 h-28 flex-shrink-0">
                  <img
                    src={ride.image}
                    alt={ride.vehicleName}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-2xl font-extrabold text-black">{ride.vehicleName}</h3>
                    <div className="flex items-center">
                      <FaUser size={16} color="black" />
                      <span className="ml-1">{ride.capacity}</span>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-600 text-sm mb-1">
                    <span>{ride.ETA} min</span>
                    <span className="mx-1">•</span>
                    <span>{ride["Arrival Time"]}</span>
                  </div>
                  <p className="text-gray-600 text-sm">{ride.Quotes}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                {ride.discount && (
                  <div className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full mb-1 inline-block">
                    {ride.discount}
                  </div>
                )}
                <div className="font-extrabold text-xl text-black">
                  ₹{ride.Price.toFixed(0)}
                </div>
                {ride.originalPrice && (
                  <div className="text-gray-400 text-sm line-through">
                    ₹{ride.originalPrice.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 w-full flex items-center justify-between">
        <div
          className="flex items-center space-x-2 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={handlePaymentClick}
        >
          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-green-600 text-sm">₹</span>
          </div>
          <span className="font-medium">{selectedPayment === 'cash' ? 'Cash' : 'UPI'}</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19l7-7-7-7" />
          </svg>
        </div>

        <button
          onClick={handleRequest}
          className="cursor-pointer bg-black text-white px-8 py-3 rounded-lg font-medium"
          disabled={loading}
        >
          {loading ? 'Requesting...' : `Request ${data[selectedRide]?.vehicleName || "Ride"}`}
        </button>
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={closePaymentModal}
        selectedPayment={selectedPayment}
        onPaymentSelect={handlePaymentSelect}
      />
    </div>
  );
};

export default RideSelection;