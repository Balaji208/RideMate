import React from 'react';
import { motion } from 'framer-motion';
import Captain from '/Driver.webp';

const AboutCaptain = () => {
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

  // Image variants
  const imageVariants = {
    hidden: {
      opacity: 0,
      x: -50,
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

  // Text section variants
  const textVariants = {
    hidden: {
      opacity: 0,
      x: 50,
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        duration: 0.7,
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

  // Button section variants
  const buttonVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1],
      },
    },
    hover: {
      scale: 1.05,
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
        className="w-full flex flex-row mx-4 mt-24 space-x-20 max-md:flex-col max-md:space-x-0 max-md:space-y-8"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.div
          className="w-1/2 p-4 max-md:w-full"
          variants={imageVariants}
        >
          <img
            src={Captain}
            alt=""
            className="rounded-xl w-full h-auto object-contain"
          />
        </motion.div>
        <motion.div
          className="flex flex-col w-1/2 justify-center items-start max-md:w-full max-md:items-center"
          variants={textVariants}
        >
          <motion.div variants={headerVariants}>
            <h3 className="inter-font text-4xl font-bold max-md:text-2xl max-md:text-center">
              Drive when you want, make what you need
            </h3>
          </motion.div>
          <motion.div
            className="mt-8 pr-4 max-md:mt-4 max-md:pr-0 max-md:text-center"
            variants={textVariants}
          >
            <h1 className="inter-font text-lg max-md:text-base">
              Make money on your schedule with deliveries or rides—or both. You can use your own car or choose a rental through Uber.
            </h1>
          </motion.div>
          <motion.div
            className="flex justify-center mt-8 space-x-8 max-md:mt-6 max-md:flex-col max-md:space-x-0 max-md:space-y-4 max-md:items-center"
            variants={containerVariants}
          >
            <motion.button
              className="h-12 bg-black w-28 rounded cursor-pointer"
              variants={buttonVariants}
              whileHover="hover"
            >
              <p className="text-white font-medium">Get Started</p>
            </motion.button>
            <motion.h1
              className="mt-2 inter-font cursor-pointer underline decoration max-md:mt-0"
              variants={buttonVariants}
            >
              Already have an account? Sign in
            </motion.h1>
          </motion.div>
        </motion.div>
      </motion.div>
    </>
  );
};

export default AboutCaptain;