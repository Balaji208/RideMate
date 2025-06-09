import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";

const PhoneOTP = () => {
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const inputRefs = useRef([]);
  const [resendEnabled, setResendEnabled] = useState(false);
  const [timer, setTimer] = useState(15);
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const phone = queryParams.get("phone"); // Phone number from query param
  
  // Timer Effect for Resend Button
  useEffect(() => {
    let interval;
    if (!resendEnabled) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev === 1) {
            clearInterval(interval);
            setResendEnabled(true);
            return 15;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendEnabled]);

  // Resend OTP
  const handleResendOtp = async () => {
    if (!resendEnabled || !phone) return;
    try {
      await axios.post("http://localhost:3001/send-otp", { phone });
      toast.success("OTP Resent!");
      setResendEnabled(false);
      setTimer(15);
      setOtp(new Array(6).fill("")); // Clear OTP fields on resend
    } catch (error) {
      console.log(error);
      toast.error("Failed to resend OTP");
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    const finalOtp = otp.join("");
    if (!finalOtp || finalOtp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP.");
      return;
    }
    try {
      const response = await axios.post("http://localhost:3001/verify-otp", {
        phone,
        code: finalOtp,
      });
      toast.success("OTP Verified!");
      setOtp(new Array(6).fill(""));
      navigate("/rider/home");
    } catch (error) {
      toast.error("Invalid OTP");
    }
  };

  const handleChange = (element, index) => {
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);
    if (element.value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
        <h3 className="text-2xl font-semibold mb-6 text-center">
          Verify Your Phone
        </h3>
        <h4 className="font-medium text-center text-xl mb-4">
          Enter the 6-digit OTP sent to <span className="font-bold">{phone || "your phone"}</span>
        </h4>
        <div className="flex justify-center gap-3 mb-4">
          {otp.map((value, index) => (
            <input
              key={index}
              type="text"
              maxLength="1"
              value={value}
              onChange={(e) => handleChange(e.target, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              ref={(el) => (inputRefs.current[index] = el)}
              className="w-12 h-14 text-center text-2xl bg-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          ))}
        </div>
        <div className="mt-16">
          <button
            onClick={handleVerifyOtp}
            className="h-14 w-full bg-green-600 text-white font-bold text-xl rounded-xl hover:bg-green-700 transition cursor-pointer"
          >
            Verify OTP
          </button>
          <button
            onClick={handleResendOtp}
            disabled={!resendEnabled}
            className={`mt-4 h-14 w-full rounded-xl text-xl cursor-pointer font-bold transition ${
              resendEnabled
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-600 cursor-not-allowed"
            }`}
          >
            {resendEnabled ? "Resend OTP" : `Resend OTP in ${timer}s`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhoneOTP;