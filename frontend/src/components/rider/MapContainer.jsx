import React from 'react';

const MapContainer = ({ children }) => {
  return (
    <div className="flex-1 min-h-[400px] md:min-h-0 relative">
      <img
        className="h-full w-full"
        src="https://miro.medium.com/v2/resize:fit:1400/0*gwMx05pqII5hbfmX.gif"
        alt="Map view"
      />
      {children}
    </div>
  );
};

export default MapContainer;