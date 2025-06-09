import React from "react";

import { motion } from "framer-motion";
import { Calendar, Clock, X } from "lucide-react";
import PlanImg from "/uber-illustration-2.png";

const ReserveRide = () => {
  // Container variants for orchestrating children
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  // Header variants
  const headerVariants = {
    hidden: {
      opacity: 0,
      y: -30,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 120,
        damping: 15,
        duration: 0.6,
      },
    },
  };

  // Image variants
  const imageVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      x: -50,
    },
    visible: {
      opacity: 1,
      scale: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 80,
        damping: 15,
        duration: 0.8,
      },
    },
  };

  // Benefits container variants
  const benefitsContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  // Benefit item variants
  const benefitItemVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
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

  return (
    <>
      <motion.div
        className="mt-28 flex-col mx-4"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.div variants={headerVariants}>
          <h3 className="text-4xl font-semibold max-md:text-2xl">
            Plan for later
          </h3>
        </motion.div>
        <div className="flex flex-row mt-4 max-md:flex-col">
          <motion.div
            className="w-2/3 rounded-2xl p-4 max-md:w-full"
            variants={imageVariants}
          >
            <img
              src={PlanImg}
              alt=""
              className="object-contain rounded-lg w-full h-auto"
            />
          </motion.div>
          <motion.div
            className="w-1/3 flex-col space-y-2 shadow-xs p-4 mt-4 rounded-xl h-full max-md:w-full"
            variants={benefitsContainerVariants}
          >
            <motion.div variants={benefitItemVariants}>
              <h3 className="text-xl font-bold h-16 max-md:h-auto max-md:text-lg">
                Benefits
              </h3>
            </motion.div>
            <motion.div
              className="flex flex-row justify-center space-x-4 h-16 max-md:h-auto max-md:space-x-2 max-md:items-start"
              variants={benefitItemVariants}
              whileHover="hover"
            >
              <div className="w-10 p-2 max-md:w-8 max-md:p-1">
                <Calendar />
              </div>
              <h2 className="inter-font text-[16px] max-md:text-sm">
                Choose your exact pickup time up to 90 days in advance. Gurumoorthi
              </h2>
            </motion.div>
            <motion.div
              className="flex flex-row justify-center space-x-4 h-16 max-md:h-auto max-md:space-x-2 max-md:items-start"
              variants={benefitItemVariants}
              whileHover="hover"
            >
              <div className="w-10 p-2 max-md:w-8 max-md:p-1">
                <Clock />
              </div>
              <h2 className="inter-font text-[16px] max-md:text-sm">
                Extra wait time included to meet your ride.
              </h2>
            </motion.div>
            <motion.div
              className="flex flex-row justify-center space-x-4 h-16 max-md:h-auto max-md:space-x-2 max-md:items-start"
              variants={benefitItemVariants}
              whileHover="hover"
            >
              <div className="w-10 p-2 max-md:w-8 max-md:p-1">
                <X />
              </div>
              <h2 className="inter-font text-[16px] max-md:text-sm">
                Cancel at no charge up to 60 minutes in advance
              </h2>
            </motion.div>
            <motion.div variants={benefitItemVariants}>
              <h3 className="inter-font font-light underline decoration-dotted max-md:text-sm">
                See terms
              </h3>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
};

export default ReserveRide;