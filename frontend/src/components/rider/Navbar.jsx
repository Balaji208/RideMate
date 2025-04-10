// App.jsx or Navbar.jsx
import React, { useState } from 'react';
import { CarFront ,Package , History} from 'lucide-react';
import carRental from '/Rider/icons/car-rentals.png'
import profile from '/profile.jpeg'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white  ">
      {/* Desktop Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <span className="text-2xl font-bold text-black">RideMate</span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex md:space-x-8">
            <a href="#" className="inter-font flex items-center px-3 py-2 text-black hover:text-gray-900">
              <span className="mr-2"><CarFront/></span> Ride
            </a>
            <a href="#" className="inter-font flex items-center px-3 py-2 text-black hover:text-gray-900">
              <span className="mr-2"><Package/> </span> Courier
            </a>
            <a href="#" className="inter-font flex items-center px-3 py-2 text-black hover:text-gray-900">
              <span className="mr-2">
                <img src={carRental} alt="" />
                </span> Rentals
            </a>
          </div>

          {/* Right Side (Activity and Profile) */}
          <div className="hidden md:flex items-center space-x-4">
            
            <button className= "inter-font bg-gray-200 text-black px-4 py-2 rounded-full hover:bg-gray-300">
                
              Activity
            </button>
            <div className="flex items-center cursor-pointer">
              <span className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <img src={profile} alt="" className='rounded-full' />
              </span>
              <svg
                className="w-4 h-4 ml-1 text-black"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-black hover:text-gray-900 focus:outline-none"
            >
              <svg
                className={`${isOpen ? 'hidden' : 'block'} h-6 w-6`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              </svg>
              <svg
                className={`${isOpen ? 'block' : 'hidden'} h-6 w-6`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

          </div>
        </div>
        <div className="line h-1 w-full bg-gray-200"></div>
      </div>

      {/* Mobile Menu */}
      <div className={`${isOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <a href="#" className="inter-font block px-3 py-2 text-black hover:bg-gray-100">
            <span className="mr-2">🚗</span> Ride
          </a>
          <a href="#" className="inter-font block px-3 py-2 text-black hover:bg-gray-100">
            <span className="mr-2">📦</span> Courier
          </a>
          <a href="#" className="inter-font block px-3 py-2 text-black hover:bg-gray-100">
            <span className="mr-2">🏠</span> Rentals
          </a>
          <button className="inter-font w-full text-left px-3 py-2 text-black hover:bg-gray-100">
            Activity
          </button>
          <a href="#" className="inter-font block px-3 py-2 text-black hover:bg-gray-100 flex items-center">
            <span className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-2">
              👤
            </span>
            Profile
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;