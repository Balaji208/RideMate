import React, { useEffect, useState } from 'react'

// Custom Hook to Handle Map Center and Geolocation
const useMapCenter = (initialPosition, setPickupLocation, setDropoffLocation) => {
    const map = useMap();
    const [center, setCenter] = useState(initialPosition);
  
    useEffect(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            setCenter([latitude, longitude]);
            map.setView([latitude, longitude], 13);
            reverseGeocode(latitude, longitude).then((address) =>
              setPickupLocation(address)
            );
          },
          (err) => console.error("Geolocation error:", err)
        );
      }
    }, [map, setPickupLocation]);
  
    return center;
  };
export default useMapCenter