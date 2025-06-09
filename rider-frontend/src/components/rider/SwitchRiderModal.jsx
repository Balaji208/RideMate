import React from 'react';
import { User, X } from 'lucide-react';

import { useDispatch } from 'react-redux';
import { setIsSwitchRiderOpen } from '../../redux/rider/slices/locationSlice';
import { setRider } from '../../redux/rider/slices/rideSlice';

const SwitchRiderModal = ({ riders, onSelectRider, onNewRider, onClose }) => {
  const dispatch = useDispatch();

  const handleSelect = (id) => {
    onSelectRider(id);
    dispatch(setRider(riders.find(rider => rider.id === id).name));
  };
  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center z-1000">
      <div className="max-w-md w-full mx-auto bg-white rounded-xl shadow-xl" style={{ maxWidth: '480px' }}>
        <div className="p-4 flex justify-between items-center">
          <h3 className="inter-font text-xl font-bold">Switch rider</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 cursor-pointer">
            <X size={24} />
          </button>
        </div>
        <div className="px-4 py-2">
          {riders.map((rider) => (
            <div
              key={rider.id}
              className="flex items-center py-3 px-2 cursor-pointer"
              onClick={() => handleSelect(rider.id)}
            >
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                {rider.id !== 'me' ? (
                  <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-white font-bold">
                    S1
                  </div>
                ) : (
                  <User className="text-gray-500" size={20} />
                )}
              </div>
              <span className="text-base font-medium flex-grow">{rider.name}</span>
              <div className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center">
                {rider.selected && <div className="w-4 h-4 rounded-full bg-black"></div>}
              </div>
            </div>
          ))}
          <div className="flex items-center py-3 px-2 cursor-pointer" onClick={onNewRider}>
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
              <User className="text-gray-500" size={20} />
            </div>
            <span className="inter-font text-base font-medium">Order ride for someone else</span>
          </div>
        </div>
        <div className="p-4">
          <button
            className="inter-font w-full py-3 bg-black text-white font-medium rounded-md hover:bg-gray-800 transition"
           onClick={() => { onClose(); dispatch(setIsSwitchRiderOpen(false)); }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SwitchRiderModal;