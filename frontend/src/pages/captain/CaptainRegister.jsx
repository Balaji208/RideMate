import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import GoogleIcon from "/Rider/icons/google-icon.png";
import PhoneIcon from "/Rider/icons/phone-icon.png";
import EyeOpenIcon from "/Rider/icons/eye-open.png";
import EyeCloseIcon from "/Rider/icons/eye-close.png";

const CaptainRegister = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="flex justify-center">
      <div className="flex w-full min-h-screen px-4">
        <div className="w-full p-8 bg-white rounded-lg shadow-md">
          <form action="">
            <h3  className="text-4xl font-medium cursor-pointer">
                <NavLink to="/">RideMate</NavLink>
            </h3>
            <h2 className="text-3xl text-center font-semibold mt-4 mb-16">Captain Details</h2>
            
            {/* First Name and Last Name */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="w-full sm:w-1/2">
                <h3 className="text-lg sm:text-xl md:text-xl font-semibold mb-4">
                  What's your first name?
                </h3>
                <input
                  required
                  className="bg-gray-100 mb-7 rounded-xl px-4 py-3 w-full text-lg placeholder:text-base"
                  type="text"
                  placeholder="First Name"
                />
              </div>
              <div className="w-full sm:w-1/2">
                <h3 className="text-lg sm:text-xl md:text-xl font-semibold mb-4">
                  What's your last name?
                </h3>
                <input
                  required
                  className="bg-gray-100 mb-7 rounded-xl px-4 py-3 w-full text-lg placeholder:text-base"
                  type="text"
                  placeholder="Last Name"
                />
              </div>
            </div>

            {/* Email and Phone */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="w-full sm:w-1/2">
                <h3 className="text-lg sm:text-xl md:text-xl font-semibold mb-4">
                  What's your email?
                </h3>
                <input
                  required
                  className="bg-gray-100 mb-7 rounded-xl px-4 py-3 w-full text-lg placeholder:text-base"
                  type="email"
                  placeholder="johndoe@example.com"
                />
              </div>
              <div className="w-full sm:w-1/2">
                <h3 className="text-lg sm:text-xl md:text-xl font-semibold mb-4">
                  Enter your Phone Number
                </h3>
                <input
                  className="bg-gray-100 mb-7 rounded-xl px-4 py-3 w-full text-lg placeholder:text-base"
                  type="tel"
                  placeholder="Eg: +91 343434554"
                />
              </div>
            </div>

            {/* License Number and Vehicle Type */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="w-full sm:w-1/2">
                <h3 className="text-lg sm:text-xl md:text-xl font-semibold mb-4">
                  Enter your License Number
                </h3>
                <input
                  required
                  className="bg-gray-100 mb-7 rounded-xl px-4 py-3 w-full text-lg placeholder:text-base"
                  type="text"
                  placeholder="License Number"
                />
              </div>
              <div className="w-full sm:w-1/2">
                <h3 className="text-lg sm:text-xl md:text-xl font-semibold mb-4">
                  Select Vehicle Type
                </h3>
                <select
                  className="bg-gray-100 mb-7 rounded-xl px-4 py-3 w-full text-lg"
                  required
                > 
                  <option value="">Select Type</option>
                  <option value="sedan">Sedan</option>
                  <option value="suv">SUV</option>
                  <option value="hatchback">Hatchback</option>
                  <option value="pickup">Auto Rickshaw</option>
                  <option value="van">Van</option>
                  <option value="motorcycle">Bike</option>
                  <option value="truck">Luxury Car</option>
                </select>
              </div>
            </div>

            {/* Color and Capacity */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="w-full sm:w-1/2">
                <h3 className="text-lg sm:text-xl md:text-xl font-semibold mb-4">
                  Vehicle Color
                </h3>
                <input
                  required
                  className="bg-gray-100 mb-7 rounded-xl px-4 py-3 w-full text-lg placeholder:text-base"
                  type="text"
                  placeholder="Vehicle Color"
                />
              </div>
              <div className="w-full sm:w-1/2">
                <h3 className="text-lg sm:text-xl md:text-xl font-semibold mb-4">
                  Vehicle Capacity
                </h3>
                <input
                  required
                  className="bg-gray-100 mb-7 rounded-xl px-4 py-3 w-full text-lg placeholder:text-base"
                  type="number"
                  placeholder="Capacity (e.g., 4)"
                />
              </div>
            </div>

            {/* License URL and Vehicle Registration URL */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="w-full sm:w-1/2">
                <h3 className="text-lg sm:text-xl md:text-xl font-semibold mb-4">
                  License Document URL
                </h3>
                <input
                  required
                  className="bg-gray-100 mb-7 rounded-xl px-4 py-3 w-full text-lg placeholder:text-base"
                  type="url"
                  placeholder="https://example.com/license.pdf"
                />
              </div>
              <div className="w-full sm:w-1/2">
                <h3 className="text-lg sm:text-xl md:text-xl font-semibold mb-4">
                  Vehicle Registration URL
                </h3>
                <input
                  required
                  className="bg-gray-100 mb-7 rounded-xl px-4 py-3 w-full text-lg placeholder:text-base"
                  type="url"
                  placeholder="https://example.com/registration.pdf"
                />
              </div>
            </div>

            {/* Insurance URL and Ride Type */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="w-full sm:w-1/2">
                <h3 className="text-lg sm:text-xl md:text-xl font-semibold mb-4">
                  Insurance Document URL
                </h3>
                <input
                  required
                  className="bg-gray-100 mb-7 rounded-xl px-4 py-3 w-full text-lg placeholder:text-base"
                  type="url"
                  placeholder="https://example.com/insurance.pdf"
                />
              </div>
              <div className="w-full sm:w-1/2">
                <h3 className="text-lg sm:text-xl md:text-xl font-semibold mb-4">
                  Ride Types Supported
                </h3>
                <select
                  className="bg-gray-100 mb-7 rounded-xl px-4 py-3 w-full text-lg"
                  required
                >
                  <option value="">Select Ride Type</option>
                  <option value="economy">Economy</option>
                  <option value="premium">Premium</option>
                  <option value="shared">Shared</option>
                  <option value="luxury">Luxury</option>
                  <option value="bikeTaxi">Bike</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
            </div>

            {/* Password and Confirm Password */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="w-full sm:w-1/2">
                <h3 className="text-lg sm:text-xl md:text-xl font-semibold mb-2">
                  Enter your Password
                </h3>
                <div className="relative w-full mb-7">
                  <input
                    className="bg-gray-100 rounded-xl px-4 py-3 pr-12 w-full text-lg placeholder:text-base"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                  />
                  <img
                    src={showPassword ? EyeCloseIcon : EyeOpenIcon}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 cursor-pointer"
                  />
                </div>
              </div>
              <div className="w-full sm:w-1/2">
                <h3 className="text-lg sm:text-xl md:text-xl font-semibold mb-2">
                  Confirm your Password
                </h3>
                <div className="relative w-full mb-7">
                  <input
                    className="bg-gray-100 rounded-xl px-4 py-3 pr-12 w-full text-lg placeholder:text-base"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Password"
                  />
                  <img
                    src={showConfirmPassword ? EyeCloseIcon : EyeOpenIcon}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <button className="bg-white text-black hover:bg-black hover:text-white transition duration-300 mb-7 rounded-xl px-4 py-3 w-full flex justify-center items-center cursor-pointer border border-gray-700">
                <img src={GoogleIcon} className="h-8 w-8 mx-2" />
                <p className="font-semibold text-[16px] mx-2">Send OTP via Email</p>
              </button>
              <button className="bg-white hover:bg-black hover:text-white text-black transition duration-300 mb-7 rounded-xl px-4 py-3 w-full flex justify-center items-center cursor-pointer border border-gray-700">
                <img src={PhoneIcon} className="h-8 w-8 mx-2" />
                <p className="font-semibold text-[16px] mx-2">Send OTP via Phone</p>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CaptainRegister;