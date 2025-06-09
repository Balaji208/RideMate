import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { NavLink } from "react-router-dom";

const HomeNavBar = () => {
  const [isOpen, setIsOpen] = useState(false); // Mobile menu toggle
  const [isAboutOpen, setIsAboutOpen] = useState(false); // About dropdown toggle
  const [isScrolled, setIsScrolled] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const toggleAboutMenu = () => {
    setIsAboutOpen(!isAboutOpen);
  };

  // Handle scroll effect for sticky navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Dropdown animation variants
  const dropdownVariants = {
    hidden: { opacity: 0, y: "-100%", transition: { duration: 0.3 } },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeInOut" } },
  };

  const aboutDropdownVariants = {
    hidden: { opacity: 0, height: 0, transition: { duration: 0.2 } },
    visible: { opacity: 1, height: "auto", transition: { duration: 0.2, ease: "easeInOut" } },
  };

  return (
    <motion.nav
      className={`fixed w-full top-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-black shadow-lg" : "bg-transparent"
      }`}
      initial={{ y: 0 }}
      animate={{ y: 0 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-black">
        <div className="flex justify-between h-16 items-center">
          {/* Left Section: Logo and Menu */}
          <div className="flex items-center space-x-6">
            {/* Logo */}
            <div className="flex-shrink-0">
              <a href="/" className="text-2xl font-bold text-white">
                RideMate
              </a>
            </div>

            {/* Desktop Menu (Left-aligned) */}
            <div className="hidden sm:flex sm:items-center sm:space-x-6">
              <a
                href="#ride"
                className="text-white hover:text-gray-300 hover:underline px-3 py-2 text-base font-medium transition duration-200"
              >
                Ride
              </a>
              <a
                href="#drive"
                className="text-white hover:text-gray-300 hover:underline px-3 py-2 text-base font-medium transition duration-200"
              >
                Drive
              </a>
              <a
                href="#business"
                className="text-white hover:text-gray-300 hover:underline px-3 py-2 text-base font-medium transition duration-200"
              >
                Business
              </a>
              {/* About Dropdown */}
              <div className="relative">
                <div className="flex items-center">
                  <button
                    onClick={toggleAboutMenu}
                    className="text-white hover:text-gray-300 hover:underline px-3 py-2 text-base font-medium transition duration-200 focus:outline-none cursor-pointer"
                  >
                    About
                  </button>
                  <button onClick={toggleAboutMenu} className="focus:outline-none cursor-pointer">
                    {isAboutOpen ? (
                      <ChevronUp className="w-4 h-4 text-white" strokeWidth={3} />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-white" strokeWidth={3} />
                    )}
                  </button>
                </div>
                <AnimatePresence>
                  {isAboutOpen && (
                    <motion.div
                      className="absolute left-0 top-full mt-2 w-48 bg-black text-white rounded-md shadow-lg z-10"
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      variants={aboutDropdownVariants}
                    >
                      <a
                        href="#team"
                        className="block px-4 py-2 text-sm hover:bg-gray-800 transition duration-200"
                      >
                        Team
                      </a>
                      <a
                        href="#mission"
                        className="block px-4 py-2 text-sm hover:bg-gray-800 transition duration-200"
                      >
                        Mission
                      </a>
                      <a
                        href="#careers"
                        className="block px-4 py-2 text-sm hover:bg-gray-800 transition duration-200"
                      >
                        Careers
                      </a>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Right Section: Login and Signup */}
          <div className="hidden sm:flex sm:items-center sm:space-x-6">
            <NavLink
              to="/rider/login"
              className="text-white hover:text-gray-300 px-3 py-2 text-base font-medium transition duration-200"
            >
              Log in
            </NavLink>
            <NavLink
              to="/rider/register"
              className="bg-white text-black px-4 py-2 rounded-full text-base font-medium hover:bg-gray-800 hover:text-white transition duration-200"
            >
              Sign up
            </NavLink>
          </div>

          {/* Hamburger Button (Mobile) */}
          <div className="flex items-center sm:hidden">
            <motion.button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu (Dropdown) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="sm:hidden fixed inset-0 bg-black text-white z-40"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={dropdownVariants}
          >
            <div className="flex flex-col h-full px-4 py-6">
              {/* Close Button */}
              <div className="flex justify-end">
                <motion.button
                  onClick={closeMenu}
                  className="p-2 text-white hover:text-gray-300 focus:outline-none"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </motion.button>
              </div>

              {/* Menu Items */}
              <div className="space-y-4 mt-4">
                <a
                  href="#ride"
                  className="text-white hover:text-gray-300 block px-3 py-2 text-lg font-medium transition duration-200"
                >
                  Ride
                </a>
                <a
                  href="#drive"
                  className="text-white hover:text-gray-300 block px-3 py-2 text-lg font-medium transition duration-200"
                >
                  Drive or deliver
                </a>
                <a
                  href="#business"
                  className="text-white hover:text-gray-300 block px-3 py-2 text-lg font-medium transition duration-200"
                >
                  Business
                </a>
                {/* About Dropdown (Mobile) */}
                <div>
                  <div className="flex items-center">
                    <button
                      onClick={toggleAboutMenu}
                      className="text-white hover:text-gray-300 block px-3 py-2 text-lg font-medium transition duration-200 focus:outline-none"
                    >
                      About
                    </button>
                    <button onClick={toggleAboutMenu} className="focus:outline-none">
                      {isAboutOpen ? (
                        <ChevronUp className="w-5 h-5 text-white" strokeWidth={3} />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-white" strokeWidth={3} />
                      )}
                    </button>
                  </div>
                  <AnimatePresence>
                    {isAboutOpen && (
                      <motion.div
                        className="pl-6 space-y-2"
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={aboutDropdownVariants}
                      >
                        <a
                          href="#team"
                          className="text-white hover:text-gray-300 block px-3 py-2 text-base font-medium transition duration-200"
                        >
                          Team
                        </a>
                        <a
                          href="#mission"
                          className="text-white hover:text-gray-300 block px-3 py-2 text-base font-medium transition duration-200"
                        >
                          Mission
                        </a>
                        <a
                          href="#careers"
                          className="text-white hover:text-gray-300 block px-3 py-2 text-base font-medium transition duration-200"
                        >
                          Careers
                        </a>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="mt-auto space-y-4">
                <a
                  href="#login"
                  className="bg-white text-center rounded-full text-black hover:text-gray-800 block px-3 py-2 text-lg font-medium transition duration-200"
                >
                  Log in
                </a>
                <a
                  href="#signup"
                  className="bg-white text-black block px-3 py-2 rounded-full text-lg font-medium text-center hover:bg-gray-800 hover:text-white transition duration-200"
                >
                  Sign up
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default HomeNavBar;