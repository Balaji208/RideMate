import React, { useEffect, useState } from "react";
import { ArrowLeft, Calendar, Clock, CalendarDays, Hourglass, X } from "lucide-react";
import InfoItem from "./InfoItem";
import ReservationTermsModal from "../../pages/rider/ReservationTermsModal";

const ScheduledPickupForm = ({
  setPickUpNowClicked,
  pickUpData,
  setPickUpData,
  riders,
  selectedRider,
  handleSwitchRiderClick,
}) => {
  const currentRider = riders.find((rider) => rider.id === selectedRider);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [timeOptions, setTimeOptions] = useState([]);
  const [isTCOpen, setIsTCOpen] = useState(false);

  const generateTimeSlots = (filterCurrentTime = false) => {
    const slots = [];
    const today = new Date();
    const currentHour = today.getHours();
    const currentMinute = today.getMinutes();

    // Round current minute up to the nearest 10
    const roundedCurrentMinute = Math.ceil(currentMinute / 10) * 10;
    const startTimeToday = new Date(today);
    startTimeToday.setHours(currentHour, roundedCurrentMinute, 0, 0);

    // Add "Now" option if today is selected
    if (filterCurrentTime) {
      slots.push({ value: "now", label: "Now" });
    }

    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 10) {
        const timeObj = new Date();
        timeObj.setHours(hour, minute, 0, 0);

        // Skip times in the past if filtering for today
        if (filterCurrentTime && timeObj < startTimeToday) {
          continue;
        }

        const hourDisplay = hour % 12 === 0 ? 12 : hour % 12;
        const amPm = hour < 12 ? "am" : "pm";
        const minuteDisplay = minute.toString().padStart(2, "0");
        const timeValue = `${hour.toString().padStart(2, "0")}:${minuteDisplay}`;
        const timeLabel = `${hourDisplay}:${minuteDisplay} ${amPm}`;

        slots.push({ value: timeValue, label: timeLabel });
      }
    }
    return slots;
  };

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    if (selectedDate === today) {
      setTimeOptions(generateTimeSlots(true));
    } else {
      setTimeOptions(generateTimeSlots(false));
    }
  }, [selectedDate]);

  const handleClear = () => {
    setSelectedDate("");
    setSelectedTime("");
    setPickUpData("");
  };

  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    const today = new Date().toISOString().split("T")[0];
    if (date === today) {
      setTimeOptions(generateTimeSlots(true));
      setSelectedTime("");
    } else {
      setTimeOptions(generateTimeSlots(false));
      setSelectedTime("");
    }
  };

  const handlePickUpForm = (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) {
      alert("Please select both date and time.");
      return;
    }
    const fullDate = new Date(`${selectedDate} ${selectedTime}`);
    const formatted = fullDate.toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    setPickUpData(formatted);
    setPickUpNowClicked(false);
  };

  return (
    <div className="mx-4 w-full md:w-96 flex flex-col p-6 md:p-10 rounded-xl shadow-2xl z-10 bg-white max-h-[calc(100vh-64px)] overflow-y-auto">
      <div className="flex flex-row justify-between items-center mb-6">
        <div
          className="cursor-pointer hover:bg-gray-100 p-2 rounded-full transition-colors"
          onClick={() => setPickUpNowClicked(false)}
        >
          <ArrowLeft size={20} />
        </div>
        <button
          className="inter-font cursor-pointer font-semibold text-sm py-2 px-3 rounded-md hover:bg-gray-100 transition-colors"
          onClick={handleClear}
        >
          Clear
        </button>
      </div>

      <div className="mb-6">
        <h3 className="font-bold text-xl text-gray-800 inter-font">
          When do you want to be picked up?
        </h3>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <div className="w-full h-12 bg-gray-100 rounded-xl flex flex-row items-center border border-gray-300">
            <Calendar className="mx-3 text-gray-500" size={20} />
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="inter-font h-full w-full bg-transparent outline-none pr-4"
              aria-label="Select pickup date"
            />
          </div>
        </div>

        <div className="relative">
          <div className="w-full h-12 bg-gray-100 rounded-xl flex flex-row items-center border border-gray-300">
            <Clock className="mx-3 text-gray-500" size={20} />
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="inter-font h-full w-full bg-transparent outline-none pr-4 appearance-none cursor-pointer"
              aria-label="Select pickup time"
            >
              <option value="">Select time</option>
              {timeOptions.map((option, index) => (
                <option key={index} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4">
              <svg
                className="fill-current h-4 w-4 text-gray-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <InfoItem icon={<CalendarDays size={18} />} text="Choose your pickup time up to 90 days in advance" />
        <InfoItem icon={<Hourglass size={18} />} text="Extra wait time included to meet your ride" />
        <InfoItem icon={<X size={18} />} text="Cancel at any time before your ride arrives" />
      </div>

      <button
        onClick={() => setIsTCOpen(!isTCOpen)}
        className="inter-font mt-6 text-sm cursor-pointer text-gray-800 underline hover:text-gray-600 self-start"
      >
        See terms
      </button>
      <button
        className="inter-font mt-2 rounded-lg bg-black text-white h-14 cursor-pointer w-full font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
        onClick={handlePickUpForm}
        disabled={!selectedDate || !selectedTime}
      >
        Next
      </button>
      {isTCOpen && (
        <div
          className="fixed inset-0 bg-black opacity-25 z-30"
          onClick={() => setIsTCOpen(false)}
        ></div>
      )}
      {isTCOpen && <ReservationTermsModal isOpen={isTCOpen} onClose={() => setIsTCOpen(false)} />}
    </div>
  );
};

export default ScheduledPickupForm;