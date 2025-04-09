import React from 'react';
import { X } from 'lucide-react';

const NewRiderModal = ({ newRider, onChange, onAddRider, onClose }) => {
  return (
    <div className="fixed inset-0 bg-blur flex items-center justify-center z-50">
      <div className="max-w-md w-full mx-auto bg-white rounded-xl shadow-xl" style={{ maxWidth: '480px' }}>
        <div className="p-4 flex justify-between items-center">
          <h3 className="inter-font text-xl font-bold">New rider</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-black cursor-pointer">
            <X size={24} />
          </button>
        </div>
        <div className="p-4">
          <p className="inter-font text-sm text-black mb-4">Drivers will see this name.</p>
          <div className="space-y-4 mb-4">
            <input
              type="text"
              placeholder="First name"
              value={newRider.firstName}
              onChange={(e) => onChange({ ...newRider, firstName: e.target.value })}
              className="w-full p-3.5 bg-gray-50 rounded-lg border border-gray-300 focus:outline-none focus:border-black text-gray-700 inter-font"
            />
            <input
              type="text"
              placeholder="Last name"
              value={newRider.lastName}
              onChange={(e) => onChange({ ...newRider, lastName: e.target.value })}
              className="inter-font w-full p-3.5 bg-gray-50 rounded-lg border border-gray-300 focus:outline-none focus:border-black text-gray-700"
            />
            <div className="flex items-center">
              <select
                value={newRider.countryCode}
                onChange={(e) => onChange({ ...newRider, countryCode: e.target.value })}
                className="inter-font p-3.5 bg-gray-50 rounded-l-lg border border-gray-300 border-r-0 focus:outline-none text-black w-20"
              >
                <option value="IN">IN</option>
                <option value="US">US</option>
              </select>
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Phone number"
                  value={newRider.phone}
                  onChange={(e) => onChange({ ...newRider, phone: e.target.value })}
                  className="inter-font w-full p-3.5 bg-gray-50 rounded-r-lg border border-gray-300 focus:outline-none focus:border-black text-gray-700"
                />
                {newRider.phone && (
                  <button
                    onClick={() => onChange({ ...newRider, phone: '' })}
                    className="cursor-pointer absolute right-3 top-1/2 transform -translate-y-1/2 text-black hover:text-gray-600"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
          <p className="inter-font text-sm text-black mb-4">
            RideMate won't share this phone number with drivers
          </p>
        </div>
        <div className="p-4">
          <button
            className="inter-font w-full py-3 bg-black text-white font-medium rounded-md hover:bg-gray-800 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
            onClick={onAddRider}
            disabled={!newRider.firstName || !newRider.lastName || !newRider.phone}
          >
            Add rider
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewRiderModal;