import React from 'react'


const PaymentModal = ({ isOpen, onClose, selectedPayment, onPaymentSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/30  bg-opacity-50 flex items-center justify-center z-150">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-black">Payment options</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FaTimes size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Uber Cash Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600 text-lg">Uber Cash: ₹0.00</span>
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                />
                <div className="w-12 h-6 bg-black rounded-full flex items-center">
                  <div className="w-5 h-5 bg-white rounded-full ml-1 shadow-sm"></div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-6 bg-black rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">uber</span>
              </div>
              <span className="text-gray-800 font-medium">Uber Cash: ₹0.00</span>
            </div>
          </div>

          {/* Payment Method Section */}
          <div className="mb-8">
            <h3 className="text-gray-600 text-lg mb-4">Payment method</h3>
            
            {/* Cash Option */}
            <div 
              className="flex items-center justify-between p-4 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => onPaymentSelect('cash')}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                  <span className="text-green-600 text-lg">💵</span>
                </div>
                <span className="text-black font-medium">Cash</span>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedPayment === 'cash' 
                  ? 'border-black bg-black' 
                  : 'border-gray-300'
              }`}>
                {selectedPayment === 'cash' && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
            </div>

            {/* UPI Option */}
            <div className="flex items-center justify-between p-4 rounded-lg opacity-50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                  <span className="text-orange-600 text-xs font-bold">UPI</span>
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

        {/* Save Button */}
        <div className="p-6 border-t border-gray-100">
          <button 
            onClick={onClose}
            className="w-full bg-black text-white py-4 rounded-lg font-medium text-lg hover:bg-gray-800 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;