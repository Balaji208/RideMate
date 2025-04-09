import React, { useState } from "react";
import GoogleIcon from "/Rider/icons/google-icon.png";
import PhoneIcon from "/Rider/icons/phone-icon.png";
import EyeOpenIcon from "/Rider/icons/eye-open.png";
import EyeCloseIcon from "/Rider/icons/eye-close.png";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import ReactPhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const RiderLogin = () => {
  const [userData, setUserData] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    window.location.href = "http://localhost:3001/auth/google";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log(userData);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}`, userData);
      if (response.status === 201) {
        navigate("/rider/home"); // Adjust route as needed
      }
    } catch (error) {
      console.error("Login failed:", error);
      toast.error("Login failed. Please try again.");
    }
  };

  const handleSendOtp = async () => {
    if (!phone || !phone.match(/^\+\d{1,4}\d{6,14}$/)) {
      toast.error("Please enter a valid phone number with country code.");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:3001/send-otp", { phone });
      toast.success("OTP sent successfully! Please verify.");
      // Navigate with the phone number in E.164 format
      navigate(`/rider/phone-otp?phone=${encodeURIComponent(phone)}`);
    } catch (error) {
      console.error("Failed to send OTP:", error);
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen px-4">
      <ToastContainer />
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <form action="" onSubmit={handleLogin}>
          <h3 className="text-4xl font-medium cursor-pointer">
            <NavLink to="/">RideMate</NavLink>
          </h3>
          <h3 className="text-xl font-semibold mt-12 mb-4"> What's your email ?</h3>
          <input
            required
            className="bg-gray-100 mb-7 rounded-xl px-4 py-3 w-full text-lg placeholder:text-base"
            type="email"
            placeholder="johndoe@example.com"
            name="email"
            onChange={handleChange}
          />
          <h3 className="text-lg font-semibold mb-2">Enter your Password</h3>
          <div className="relative w-full mb-7">
            <input
              className="bg-gray-100 rounded-xl px-4 py-3 pr-12 w-full text-lg placeholder:text-base"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              name="password"
              onChange={handleChange}
            />
            <img
              src={showPassword ? EyeCloseIcon : EyeOpenIcon}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 cursor-pointer"
            />
          </div>
          <button
            type="submit"
            className="bg-[#111] cursor-pointer text-white font-semibold mb-7 rounded-xl px-4 py-3 border w-full text-xl"
            disabled={loading}
          >
            {loading ? "Loading..." : "Login"}
          </button>
          <div className="flex justify-between p-1">
            <p className="font-medium text-gray-600">Are you a new rider ?</p>
            <a
              className="px-4 font-medium underline cursor-pointer text-gray-900"
              onClick={() => {
                navigate("/rider/register");
              }}
            >
              Create New Account
            </a>
          </div>
          <div className="flex items-center mb-3">
            <div className="flex-grow h-px bg-gray-300"></div>
            <span className="mx-2 text-gray-400">or</span>
            <div className="flex-grow h-px bg-gray-300"></div>
          </div>
          <button
            onClick={handleGoogleSignIn}
            className="bg-gray-100 mb-7 rounded-xl px-4 py-3 w-full flex justify-center cursor-pointer"
            disabled={loading}
          >
            <img src={GoogleIcon} className="h-8 w-8 mx-2 text-xl" />
            <p className="text-[#111] font-semibold text-xl mx-2">Continue with Google</p>
          </button>
          {!showPhoneInput ? (
            <button
              onClick={() => setShowPhoneInput(true)}
              className="bg-gray-100 mb-7 rounded-xl px-4 py-3 w-full flex justify-center cursor-pointer"
              disabled={loading}
            >
              <img src={PhoneIcon} className="h-8 w-8 mx-2 text-xl" />
              <p className="text-[#111] font-semibold text-xl mx-2">Continue with Phone</p>
            </button>
          ) : (
            <>
              <h3 className="text-lg font-semibold mb-2">Enter your Phone Number</h3>
              <ReactPhoneInput
                placeholder="Enter phone number"
                value={phone}
                onChange={setPhone}
                defaultCountry="IN"
                international
                countryCallingCodeEditable={false}
                className="mb-6 text-lg font-bold"
                style={{
                  backgroundColor: "#E5E7EB",
                  borderRadius: "0.75rem",
                  padding: "0.75rem 1rem",
                  fontSize: "1.125rem",
                  width: "100%",
                  height: "3rem",
                }}
                disabled={loading}
              />
              <button
                onClick={handleSendOtp}
                className="bg-green-600 text-white cursor-pointer font-bold text-xl rounded-xl py-3 w-full hover:bg-green-700 transition"
                disabled={loading}
              >
                {loading ? "Sending..." : "Submit"}
              </button>
            </>
          )}
          <p className="text-gray-400 text-sm px-2">
            By proceeding, you consent to get calls, WhatsApp or SMS/RCS messages,
            including by automated means, from Uber and its affiliates to the
            number provided.
          </p>
        </form>
      </div>
    </div>
  );
};

export default RiderLogin;