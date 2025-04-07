import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import RiderSignUp from "/Rider/signup.jpg";
import GoogleIcon from "/Rider/icons/google-icon.png";
import PhoneIcon from "/Rider/icons/phone-icon.png";
import EyeOpenIcon from "/Rider/icons/eye-open.png";
import EyeCloseIcon from "/Rider/icons/eye-close.png";
const RiderRegister = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  return (
    <div className="flex  justify-between">
      <div className="flex w-full lg:w-1/2 min-h-screen px-4 ">
        <div className="w-full  p-8 bg-white rounded-lg shadow-md ">
          <form action="">
            <h3  className="text-4xl font-medium cursor-pointer">
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
                />
              </div>

              <div className="w-full sm:w-1/2 sm:pl-2">
                <h3 className="text-lg mt-0 sm:text-xl md:text-xl font-semibold  sm:mt-12 mb-4">
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

            <h3 className="text-lg sm:text-xl md:text-xl font-semibold   mb-4">
              {" "}
              What's your email ?
            </h3>
            <input
              required
              className="bg-gray-100 mb-7 rounded-xl px-4 py-3  w-full text-lg placeholder:text-base"
              type="email"
              placeholder="johndoe@example.com"
            />
            <h3 className="text-lg sm:text-xl md:text-xl font-semibold  mb-2">
              Enter your Phone Number
            </h3>
            <input
              className="bg-gray-100 mb-7 rounded-xl px-4 py-3  w-full text-lg placeholder:text-base"
              type="phone"
              placeholder="Eg :+91 343434554"
            />
            <h3 className="text-lg sm:text-xl md:text-xl font-semibold  mb-2">
              Enter your Password
            </h3>
            <div className="relative w-full mb-7">
              <input
                className="bg-gray-100 rounded-xl px-4 py-3 pr-12 w-full text-lg placeholder:text-base"
                type = {showPassword ? "text" : "password"}
                placeholder="Password"
              />
              <img
                src={showPassword ? EyeCloseIcon : EyeOpenIcon} 
                onClick={()=>(setShowPassword(!showPassword))}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 cursor-pointer"
              />
            </div>
            <h3 className="text-lg sm:text-xl md:text-xl font-semibold  mb-2">
              Confirm your Password
            </h3>
            <div className="relative w-full mb-7">
              <input
                className="bg-gray-100 rounded-xl px-4 py-3 pr-12 w-full text-lg placeholder:text-base"
                type = {showConfirmPassword ? "text" : "password"}
                placeholder="Password"
              />
              <img
                src={showConfirmPassword ? EyeCloseIcon : EyeOpenIcon}
                onClick={()=>(setShowConfirmPassword(!showConfirmPassword))}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 cursor-pointer"
              />
            </div>

            <NavLink>
              <button className="bg-white text-black hover:bg-black hover:text-white transition duration-300 mb-7 rounded-xl px-4 py-3 mt-8 w-full flex justify-center items-center cursor-pointer border border-gray-700">
                <img src={GoogleIcon} className="h-8 w-8 mx-2" />
                <p className="font-semibold text-[16px] mx-2">Send OTP via Email</p>
              </button>
            </NavLink>

            <NavLink>
              <button className="bg-white  hover:bg-black hover:text-white text-black transition duration-300 mb-7 rounded-xl px-4 py-3 w-full flex justify-center items-center cursor-pointer border border-gray-700">
                <img src={PhoneIcon} className="h-8 w-8 mx-2" />
                <p className="font-semibold text-[16px] mx-2">Send OTP via Phone</p>
              </button>
            </NavLink>
          </form>
        </div>
      </div>
      <div className="hidden lg:block w-1/2 rounded-2xl m-2 min-h-screen">
        <img
          src={RiderSignUp}
          alt=""
          className="w-full h-full object-cover rounded-2xl shadow-md"
        />
      </div>
    </div>
  );
};

export default RiderRegister;
