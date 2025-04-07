import React, { useRef, useState, useEffect } from "react";
import ReactPhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const SignUpViaPhone = () => {
  const [phone, setPhone] = useState("");
  const [isClicked, setIsClicked] = useState(false);
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const inputRefs = useRef([]);
  const [resendEnabled, setResendEnabled] = useState(false);
  const [timer, setTimer] = useState(15);
  const navigate = useNavigate();
  // 📌 Timer Effect for Resend Button
  useEffect(() => {
    let interval;
    if (!resendEnabled && isClicked) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev === 1) {
            clearInterval(interval);
            setResendEnabled(true);
            return 10;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendEnabled, isClicked]);

  // 📌 Send OTP
  const handleSendOtp = async () => {
    try {
      await axios.post("http://localhost:3001/send-otp", { phone });
      toast.success("OTP Sent!");
      setIsClicked(true);
      setResendEnabled(false); // disable resend initially
      setTimer(15); // reset timer
    } catch (error) {
        console.log(error)
      toast.error("Failed to send OTP");
    }
  };

  // 📌 Resend OTP
  const handleResendOtp = async () => {
    if (!resendEnabled) return;
    handleSendOtp(); // Resends OTP
  };

  // 📌 Verify OTP
  const handleVerifyOtp = async () => {
    try {
      const finalOtp = otp.join("");
      await axios.post("http://localhost:3001/verify-otp", {
        phone,
        code: finalOtp,
      });
      toast.success("OTP Verified!");

      setIsClicked(false);
      setOtp(new Array(6).fill(""));
      navigate("/rider/home")
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
          Enter Your Phone Number
        </h3>

        <ReactPhoneInput
          placeholder="Enter phone number"
          value={phone}
          onChange={setPhone}
          defaultCountry="IN"
          className="mb-6 text-lg font-bold"
          style={{
            backgroundColor: "#E5E7EB",
            borderRadius: "0.75rem",
            padding: "0.75rem 1rem",
            fontSize: "1.125rem",
            width: "100%",
            height: "3rem",
          }}
        />

        <button
          onClick={handleSendOtp}
          className="h-14 w-full cursor-pointer bg-black rounded-xl text-xl text-white font-bold transition duration-300 hover:bg-gray-800"
        >
          Send OTP
        </button>

        {isClicked && (
          <>
            <h4 className="font-medium text-center text-xl mt-16 mb-4">
              Enter the 6-digit OTP sent to <span className="font-bold">{phone}</span>
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
            
          </>
        )}
      </div>
    </div>
  );
};

export default SignUpViaPhone;
