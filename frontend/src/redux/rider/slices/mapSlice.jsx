import { createSlice  } from "@reduxjs/toolkit";

const initialState = {
    pickupPos : [20.5937,78.9629],
    dropoffPos : [20.5937,78.9629],
    routeCoords : [],
    center : [20.5937,78.9629],
    captains :[],
    isLoading :true,
    userLocation : null
}

const mapSlice  = createSlice({
    name : 'map',
    initialState,
    reducers : {
        setPickupPos: (state, action) => {
      state.pickupPos = action.payload;
    },
    setDropoffPos: (state, action) => {
      state.dropoffPos = action.payload;
    },
    setRouteCoords: (state, action) => {
      state.routeCoords = action.payload;
    },
    setCenter: (state, action) => {
      state.center = action.payload;
    },
    setCaptains: (state, action) => {
      state.captains = action.payload;
    },
    updateCaptainLocation: (state, action) => {
      const { driverId, currentLocation } = action.payload;
      state.captains = state.captains.map(captain =>
        captain.driverId === driverId ? { ...captain, currentLocation } : captain
      );
    },
    setIsLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setUserLocation: (state, action) => {
      state.userLocation = action.payload;
    },
    }
});

export const {
  setPickupPos,
  setDropoffPos,
  setRouteCoords,
  setCenter,
  setCaptains,
  updateCaptainLocation,
  setIsLoading,
  setUserLocation,
} = mapSlice.actions;
export default mapSlice.reducer;