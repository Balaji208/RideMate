import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const DRIVER_ID = 'DRV001';

const Home = () => {
  const [rideRequest, setRideRequest] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const rejectedRequestIds = useRef(new Set());

  useEffect(() => {
    socketRef.current = io('http://localhost:3003', {
      query: { driverId: DRIVER_ID },
      transports: ['websocket'],
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server:', reason);
      setIsConnected(false);
    });

    socket.on('notification', (data) => {
      try {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        const { requestId, riderId, distance, eta, message } = parsed;

        if (rejectedRequestIds.current.has(requestId)) {
          console.log(`Ignored rejected request: ${requestId}`);
          return;
        }

        setRideRequest({ requestId, riderId, distance, eta, message });
        console.log('Ride request received:', parsed);
      } catch (err) {
        console.error('Error parsing notification:', err);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleResponse = (accepted) => {
    if (!rideRequest || !socketRef.current) return;

    if (!accepted) {
      rejectedRequestIds.current.add(rideRequest.requestId);
    }

    const response = { requestId: rideRequest.requestId, accepted };
    socketRef.current.emit('response', response);
    console.log('Response sent:', response);
    setRideRequest(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex flex-col items-center justify-center p-6">
      <div className="bg-white shadow-lg rounded-xl p-8 max-w-xl w-full text-center">
        <h1 className="text-4xl font-extrabold text-blue-800 mb-4">🚖 Driver App</h1>
        <p className="text-lg text-gray-700 mb-2 font-medium">
          ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{DRIVER_ID}</span>
        </p>
        <p className="text-md text-gray-600">
          Connection Status: <span className={isConnected ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>
            {isConnected ? '✅ Connected' : '❌ Disconnected'}
          </span>
        </p>
      </div>

      {rideRequest && (
        <div className="fixed inset-0 bg-white/70  bg-opacity-1 bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📍 New Ride Request</h2>
            <div className="text-left space-y-2">
              <p><strong>Rider:</strong> {rideRequest.riderId}</p>
              <p><strong>Distance:</strong> {rideRequest.distance?.toFixed(2)} km</p>
              <p><strong>ETA:</strong> {rideRequest.eta} mins</p>
              <p><strong>Details:</strong> {rideRequest.message}</p>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => handleResponse(true)}
                className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded shadow transition"
              >
                Accept
              </button>
              <button
                onClick={() => handleResponse(false)}
                className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded shadow transition"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
