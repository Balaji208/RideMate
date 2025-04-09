import React, { createContext, useState } from "react";
export const RiderDataContext = createContext();
const RiderContext = ({ children }) => {
    const [ rider , setRider ] = useState({
        email : '',
        fullName :{
            firstName : '',
            lastName : ''
        },
        phone : '',
    })
  return (
    <div>
        <RiderDataContext.Provider value={{rider , setRider}}>
            {children}
        </RiderDataContext.Provider>
    </div>
  );
};

export default RiderContext;
