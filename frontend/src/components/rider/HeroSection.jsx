import React from 'react'


import Travel from "/Rider/travel.webp";
import { Send, CircleDot } from "lucide-react";
const HeroSection = () => {
  return (
    <>
    <div className="w-full  flex flex-row">
        <div className="w-4/6 p-2  flex flex-col justify-center ">
          <h1 className="font-bold text-5xl tracking-wide">
            Request a ride for now or later
          </h1>
          <div className="mt-12 flex flex-col space-y-3 w-5/6">
            <h1 className='inter-font'>Add your trip details, hop in, and go.</h1>
            <div className="flex items-center w-full h-12 bg-[#F5F5F5] rounded-md px-3">
              {/* Left Icon */}
              <CircleDot className="w-4 h-4 text-black mr-2" />

              {/* Input */}
              <input
                type="text"
                className="flex-1 bg-transparent focus:outline-none text-gray-700 placeholder-gray-500"
                placeholder="Enter location"
              />

              {/* Right Icon */}
              <Send className="w-4 h-4 text-black ml-2" />
            </div>

            <div className="flex items-center w-full h-12 bg-[#F5F5F5] rounded-md px-3">
              {/* Left Icon */}
              <CircleDot className="w-4 h-4 text-black mr-2" />

              {/* Input */}
              <input
                type="text"
                className="flex-1 bg-transparent focus:outline-none text-gray-700 placeholder-gray-500"
                placeholder="Enter destination"
              />
            </div>

            <div className="flex space-x-10 mt-4 ">
              <button className="w-40 h-12 bg-black inter-font text-white font-medium rounded-xl cursor-pointer">
                See Prices
              </button>
              <button className="w-44 h-12 inter-font bg-[#e8e4e4] text-black font-medium rounded-xl cursor-pointer  ">
                Schedule for later
              </button>
            </div>
          </div>
        </div>
        <div className="w-full max-w-[550px] h-auto mx-12">
          <img
            src={Travel}
            alt="Travel"
            className="w-full h-auto object-contain"
          />
        </div>
      </div>
    </>
  )
}

export default HeroSection;