import React, { useContext, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import RiderSignUp from "/Rider/signup.jpg";
import GoogleIcon from "/Rider/icons/google-icon.png";
import PhoneIcon from "/Rider/icons/phone-icon.png";
import EyeOpenIcon from "/Rider/icons/eye-open.png";
import EyeCloseIcon from "/Rider/icons/eye-close.png";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";

const RiderRegister = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [riderData, setRiderData] = useState({
    fullName: { firstName: "", lastName: "" },
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  // const { rider, setRider } = useContext(RiderContext);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "firstName" || name === "lastName") {
      setRiderData((prevData) => ({
        ...prevData,
        fullName: {
          ...prevData.fullName,
          [name]: value,
        },
      }));
    } else {
      setRiderData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const handleOTPSend = async (provider) => {
    if (loading) return;

    // Basic client-side validation
    if (!riderData.fullName.firstName || riderData.fullName.firstName.length < 3) {
      toast.error("First name must be at least 3 characters long.");
      return;
    }
    if (!riderData.fullName.lastName || riderData.fullName.lastName.length < 3) {
      toast.error("Last name must be at least 3 characters long.");
      return;
    }
    if (provider === "email" && !riderData.email) {
      toast.error("Email is required for email OTP.");
      return;
    }
    if (provider === "phone" && !riderData.phone) {
      toast.error("Phone number is required for phone OTP.");
      return;
    }
    if (riderData.password && riderData.password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    if (riderData.password !== riderData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    const oAuthId = Math.random().toString(36).substring(2, 15); // Placeholder OTP token

    try {
      // console.log('Data : ',riderData);
      const riderDetails =  {
        fullName: {
          firstName: riderData.fullName.firstName,
          lastName: riderData.fullName.lastName,
        },
        email: provider === "email" ? riderData.email : null,
        phone: provider === "phone" ? riderData.phone : null,
        oAuthId,
        oAuthProvider: provider,
        password: riderData.password || null,
      }
      console.log(riderDetails);
      const response = await axios.post("http://localhost:3001/riders/register",riderDetails);

      toast.success("OTP sent successfully! Please verify.");
      if (provider === "phone") {
        navigate(`/rider/phoneSignUp?phone=${riderData.phone}&userId=${response.data.user._id}`);
      } else {
        navigate(`/verify-otp?userId=${response.data.user._id}&provider=${provider}`);
      }
    } catch (error) {
      toast.error(`Registration failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-between">
      <Toaster toastOptions={{ duration: 4000 }} />
      <div className="flex w-full lg:w-1/2 min-h-screen px-4">
        <div className="w-full p-8 bg-white rounded-lg shadow-md">
          <form>
            <h3 className="text-4xl font-medium cursor-pointer">
              <NavLink to="/">RideMate</NavLink>
            </h3>
            <div className="flex flex-col sm:flex-row justify-between">
              <div className="w-full sm:w-1/2 sm:pr-2">
                <h3 className="text-lg sm:text-xl md:text-xl font-semibold mt-8 sm:mt-12 mb-4">
                  What's your first name?
                </h3>
                <input
                  required
                  className="bg-gray-100 mb-7 rounded-xl px-4 py-3 w-full text-lg placeholder:text-base"
                  type="text"
                  placeholder="First Name"
                  name="firstName"
                  value={riderData.fullName.firstName}
                  onChange={handleInputChange}
                />
              </div>

              <div className="w-full sm:w-1/2 sm:pl-2">
                <h3 className="text-lg mt-0 sm:text-xl md:text-xl font-semibold sm:mt-12 mb-4">
                  What's your last name?
                </h3>
                <input
                  required
                  className="bg-gray-100 mb-7 rounded-xl px-4 py-3 w-full text-lg placeholder:text-base"
                  type="text"
                  placeholder="Last Name"
                  name="lastName"
                  value={riderData.fullName.lastName}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <h3 className="text-lg sm:text-xl md:text-xl font-semibold mb-4">
              What's your email?
            </h3>
            <input
              required
              className="bg-gray-100 mb-7 rounded-xl px-4 py-3 w-full text-lg placeholder:text-base"
              type="email"
              placeholder="johndoe@example.com"
              name="email"
              value={riderData.email}
              onChange={handleInputChange}
            />
            <h3 className="text-lg sm:text-xl md:text-xl font-semibold mb-2">
              Enter your Phone Number
            </h3>
            <input
              className="bg-gray-100 mb-7 rounded-xl px-4 py-3 w-full text-lg placeholder:text-base"
              type="tel"
              placeholder="Eg: +91 343434554"
              name="phone"
              value={riderData.phone}
              onChange={handleInputChange}
            />
            <h3 className="text-lg sm:text-xl md:text-xl font-semibold mb-2">
              Enter your Password
            </h3>
            <div className="relative w-full mb-7">
              <input
                className="bg-gray-100 rounded-xl px-4 py-3 pr-12 w-full text-lg placeholder:text-base"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                name="password"
                value={riderData.password}
                onChange={handleInputChange}
              />
              <img
                src={showPassword ? EyeCloseIcon : EyeOpenIcon}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 cursor-pointer"
              />
            </div>
            <h3 className="text-lg sm:text-xl md:text-xl font-semibold mb-2">
              Confirm your Password
            </h3>
            <div className="relative w-full mb-7">
              <input
                className="bg-gray-100 rounded-xl px-4 py-3 pr-12 w-full text-lg placeholder:text-base"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                name="confirmPassword"
                value={riderData.confirmPassword}
                onChange={handleInputChange}
              />
              <img
                src={showConfirmPassword ? EyeCloseIcon : EyeOpenIcon}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={() => handleOTPSend("email")}
              className="bg-white text-black hover:bg-black hover:text-white transition duration-300 mb-7 rounded-xl px-4 py-3 mt-8 w-full flex justify-center items-center cursor-pointer border border-gray-700"
              disabled={loading}
            >
              {loading && <span className="mr-2">Loading...</span>}
              <img src={GoogleIcon} className="h-8 w-8 mx-2" />
              <p className="font-semibold text-[16px] mx-2">Send OTP via Email</p>
            </button>

            <button
              type="button"
              onClick={() => handleOTPSend("phone")}
              className="bg-white text-black hover:bg-black hover:text-white transition duration-300 mb-7 rounded-xl px-4 py-3 w-full flex justify-center items-center cursor-pointer border border-gray-700"
              disabled={loading}
            >
              {loading && <span className="mr-2">Loading...</span>}
              <img src={PhoneIcon} className="h-8 w-8 mx-2" />
              <p className="font-semibold text-[16px] mx-2">Send OTP via Phone</p>
            </button>
          </form>
        </div>
      </div>
      <div className="hidden lg:block w-1/2 rounded-2xl m-2 min-h-screen">
        <img
          src={RiderSignUp}
          alt="Signup"
          className="w-full h-full object-cover rounded-2xl shadow-md"
        />
      </div>
    </div>
  );
};

export default RiderRegister;