import React from 'react';
import { motion } from 'framer-motion';
import Courier from "/Courier.png";
import Reserve from "/Reserve.png";
import Rentals from "/Rentals.png";
import Ride from "/Ride.png";

const Suggestions = () => {
    const data = [
        {
          header: "Ride",
          content: "Go anywhere with RideMate. Request a ride, hop in, and go",
          img: Ride,
        },
        {
            header: "Reserve",
            content: "Reserve your ride in advance so you can relax on the day of your trip",
            img: Reserve,
        },
        {
            header: "Courier",
            content: "RideMate makes same-day item delivery easier than ever",
            img: Courier,
        },
        {
            header: "Rentals",
            content: "Request a trip for a block of time and make multiple stops",
            img: Rentals,
        },
    ];

    // Container variants for orchestrating children
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.3,
            },
        },
    };

    // Card variants with scale and shadow
    const cardVariants = {
        hidden: {
            opacity: 0,
            y: 40,
            scale: 0.95,
        },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 15,
                mass: 0.8,
                duration: 0.7,
            },
        },
        hover: {
            scale: 1.02,
            boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.1)",
            transition: {
                type: "spring",
                stiffness: 200,
                damping: 20,
            },
        },
    };

    // Header variants with subtle bounce
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

    // Image variants for subtle zoom
    const imageVariants = {
        hidden: {
            opacity: 0,
            scale: 0.9,
        },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                duration: 0.8,
                ease: [0.4, 0, 0.2, 1], // Custom cubic-bezier for smooth easing
            },
        },
    };

    return (
        <>
            <div className="flex flex-col mt-20 mb-8 px-4 max-w-7xl mx-auto">
                <motion.h3
                    className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-8"
                    variants={headerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.5 }}
                >
                    Suggestions
                </motion.h3>
                <motion.div
                    className="mt-4 flex flex-wrap gap-4 sm:gap-6 justify-center md:justify-start"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                >
                    {data.map((item, index) => (
                        <motion.div
                            className="flex bg-[#f2f2f2] rounded-xl w-full sm:w-[calc(50%-1rem)] md:w-[23rem] 
                            min-h-[170px] max-w-[350px] overflow-hidden"
                            key={index}
                            variants={cardVariants}
                            initial="hidden"
                            whileInView="visible"
                            whileHover="hover"
                            viewport={{ once: true, amount: 0.2 }}
                        >
                            <div className="flex flex-col w-2/3 p-4">
                                <h2 className="inter-font text-sm sm:text-base md:text-[16px] font-medium">
                                    {item.header}
                                </h2>
                                <p className="mt-2 text-xs sm:text-[12px] inter-font flex-grow line-clamp-3 tracking-wide text-gray-800 md:font-thin">
                                    {item.content}
                                </p>
                                <button className="text-xs sm:text-sm inter-font mt-3 w-20 h-8 bg-white 
                                rounded-2xl font-medium cursor-pointer hover:bg-gray-200 transition duration-300">
                                    Details
                                </button>
                            </div>
                            <motion.div
                                className="w-2/5 p-2 flex items-center justify-center"
                                variants={imageVariants}
                            >
                                <img 
                                    src={item.img} 
                                    alt={item.header}
                                    className="max-h-[160px] sm:max-h-[180px] w-full object-contain"
                                />
                            </motion.div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </>
    );
};

export default Suggestions;