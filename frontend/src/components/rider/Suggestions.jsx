import React from 'react';
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

    return (
        <>
            <div className="flex flex-col mt-20 mb-8 px-4 max-w-7xl mx-auto">
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-8">
                    Suggestions
                </h3>
                <div className="mt-4 flex flex-wrap gap-4 sm:gap-6 justify-center md:justify-start">
                    {data.map((item, index) => (
                        <div
                            className="flex bg-[#f2f2f2] rounded-xl w-full sm:w-[calc(50%-1rem)] md:w-[23rem] 
                            min-h-[170px] max-w-[350px] overflow-hidden"
                            key={index}
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
                            <div className="w-2/5 p-2 flex items-center justify-center">
                                <img 
                                    src={item.img} 
                                    alt={item.header}
                                    className="max-h-[160px] sm:max-h-[180px] w-full object-contain"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default Suggestions;