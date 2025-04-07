import React, { useState } from "react";
import GoogleIcon from "/Rider/icons/google-icon.png";
import PhoneIcon from "/Rider/icons/phone-icon.png";
import EyeOpenIcon from "/Rider/icons/eye-open.png";
import EyeCloseIcon from "/Rider/icons/eye-close.png";
import { NavLink, useNavigate } from "react-router-dom";
const RiderLogin = () => {
  const navigate = useNavigate();
  const [showPassword,setShowPassword] = useState(false);
  const handleGoogleSignIn = async () => {
    window.location.href = "http://localhost:3001/auth/google";
  };
  return (
    <div className="flex justify-center items-center min-h-screen px-4 ">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md ">
        <form action="">
          <h3  className="text-4xl font-medium cursor-pointer">
                          <NavLink to="/">RideMate</NavLink>
                      </h3>
          <h3 className="text-xl font-semibold mt-12 mb-4">
            {" "}
            What's your email ?
          </h3>
          <input
            required
            className="bg-gray-100 mb-7 rounded-xl px-4 py-3  w-full text-lg placeholder:text-base"
            type="email"
            placeholder="johndoe@example.com"
          />
          <h3 className="text-lg font-semibold  mb-2">Enter your Password</h3>
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
          <NavLink to="rider/home" className="cursor-pointer">
            <button className="bg-[#111] cursor-pointer text-white font-semibold mb-7 rounded-xl px-4 py-3 border w-full text-xl ">
              Login
            </button>
          </NavLink>
          <div className="flex justify-between p-1">
            <p className="font-medium text-gray-600 ">Are you a new rider ?</p>
            <a
              className="px-4 font-medium underline cursor-pointer text-gray-900"
              onClick={() => {
                navigate("/rider/register");
              }}
            >
              {" "}
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
              className="bg-gray-100 mb-7 rounded-xl px-4 py-3  w-full  flex justify-center cursor-pointer"
            >
              <img src={GoogleIcon} className="h-8 w-8 mx-2 text-xl" />
              <p className="text-[#111] font-semibold text-xl mx-2 ">
                Continue with Google
              </p>
            </button>
          
            <button 
            onClick={()=>{navigate("/rider/phoneSignUp")}}
            className="bg-gray-100 mb-7 rounded-xl px-4 py-3  w-full  flex justify-center cursor-pointer">
              <img src={PhoneIcon} className="h-8 w-8 mx-2 text-xl" />
              <p className="text-[#111] font-semibold text-xl mx-2 ">
                Continue with Phone
              </p>
            </button>
          <p className="text-gray-400 text-sm px-2">
            By proceeding, you consent to get calls, WhatsApp or SMS/RCS
            messages, including by automated means, from Uber and its affiliates
            to the number provided.
          </p>
        </form>
      </div>
    </div>
  );
};

export default RiderLogin;
