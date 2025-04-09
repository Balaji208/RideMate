import React from 'react';
import { X } from 'lucide-react';

const ReservationTermsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0  flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 relative">
          {/* Close button */}
          <button 
            onClick={onClose} 
            className="absolute right-6 top-6 text-gray-700 hover:text-gray-900"
            aria-label="Close"
          >
            <X size={24} />
          </button>

          {/* Modal header */}
          <h2 className="inter-font text-xl font-bold mb-6">Reservations Terms and Conditions</h2>

          {/* Modal content */}
          <div className="inter-font space-y-6 text-gray-800">
            <p>
              Trips booked with Reservations are subject to the following 
              terms and conditions, which supplement other T&Cs you have 
              agreed with Uber.
            </p>

            <p>
              Reservations made in advance may be subject to a Cancel Fee. 
              Refer to the list below for more information on the cancellation 
              charges which apply to your reservation.
            </p>

            <p>
              Once your driver arrives at your requested pickup location, you 
              or your guest rider should meet the driver to begin the trip within 
              the "wait time" period specified below. That wait time is included 
              in your estimated fare. After the wait time, additional wait time 
              charges may apply to your trip.
            </p>

            <p>
              However, if your driver is expected to be significantly late, we'll 
              let you know in advance, and you'll have 10 minutes from that 
              notice to cancel at no charge.
            </p>
          </div>

          {/* OK button */}
          <div className="mt-8">
            <button 
              onClick={onClose}
              className="w-full py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              Ok
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationTermsModal;

// Example usage:
// const [isModalOpen, setIsModalOpen] = useState(false);
// 
// <button onClick={() => setIsModalOpen(true)}>Show Terms</button>
// <ReservationTermsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />