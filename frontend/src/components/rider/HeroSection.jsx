import React from 'react';
import { motion } from 'framer-motion';
import Travel from "/Rider/travel.webp";
import { Send, CircleDot } from "lucide-react";

const HeroSection = () => {
  // Container variants for orchestrating children
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  // Header variants
  const headerVariants = {
    hidden: {
      opacity: 0,
      y: -40,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        duration: 0.7,
      },
    },
  };

  // Form container variants
  const formContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  // Form item variants (text, inputs, buttons)
  const formItemVariants = {
    hidden: {
      opacity: 0,
      y: 30,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 90,
        damping: 15,
        duration: 0.6,
      },
    },
    hover: {
      scale: 1.02,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20,
      },
    },
  };

  // Image variants
  const imageVariants = {
    hidden: {
      opacity: 0,
      x: 50,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 80,
        damping: 15,
        duration: 0.8,
      },
    },
  };

  return (
    <>
      <motion.div
        className="w-full flex flex-row max-md:flex-col"
        variants={containerVariants}
        initial="hidden"
        animate="visible" // Using animate instead of whileInView since it's a hero section
      >
        <motion.div
          className="w-4/6 p-2 flex flex-col justify-center max-md:w-full"
          variants={containerVariants}
        >
          <motion.h1
            className="font-bold text-5xl tracking-wide max-md:text-3xl"
            variants={headerVariants}
          >
            Request a ride for now or later
          </motion.h1>
          <motion.div
            className="mt-12 flex flex-col space-y-3 w-5/6 max-md:w-full max-md:mt-6"
            variants={formContainerVariants}
          >
            <motion.h1
              className="inter-font"
              variants={formItemVariants}
            >
              Add your trip details, hop in, and go.
            </motion.h1>
            <motion.div
              className="flex items-center w-full h-12 bg-[#F5F5F5] rounded-md px-3"
              variants={formItemVariants}
              whileHover="hover"
            >
              <CircleDot className="w-4 h-4 text-black mr-2" />
              <input
                type="text"
                className="flex-1 bg-transparent focus:outline-none text-gray-700 placeholder-gray-500"
                placeholder="Enter location"
              />
              <Send className="w-4 h-4 text-black ml-2" />
            </motion.div>

            <motion.div
              className="flex items-center w-full h-12 bg-[#F5F5F5] rounded-md px-3"
              variants={formItemVariants}
              whileHover="hover"
            >
              <CircleDot className="w-4 h-4 text-black mr-2" />
              <input
                type="text"
                className="flex-1 bg-transparent focus:outline-none text-gray-700 placeholder-gray-500"
                placeholder="Enter destination"
              />
            </motion.div>

            <motion.div
              className="flex space-x-10 mt-4 max-md:space-x-4 max-md:flex-col max-md:space-y-3 max-md:mt-6"
              variants={formContainerVariants}
            >
              <motion.button
                className="w-40 h-12 bg-black inter-font text-white font-medium rounded-xl cursor-pointer max-md:w-full"
                variants={formItemVariants}
                whileHover="hover"
              >
                See Prices
              </motion.button>
              <motion.button
                className="w-44 h-12 inter-font bg-[#e8e4e4] text-black font-medium rounded-xl cursor-pointer max-md:w-full"
                variants={formItemVariants}
                whileHover="hover"
              >
                Schedule for later
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
        <motion.div
          className="w-full max-w-[550px] h-auto mx-12 max-md:hidden"
          variants={imageVariants}
        >
          <img
            src={Travel}
            alt="Travel"
            className="w-full h-auto object-contain"
          />
        </motion.div>
      </motion.div>
    </>
  );
};

export default HeroSection;