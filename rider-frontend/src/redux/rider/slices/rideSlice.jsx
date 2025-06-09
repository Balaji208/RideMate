import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  fromLocation: "",
  stops: [],
  toLocation: "",
  isScheduled: false,
  pickUpDate: "",
  pickUpTime: "",
  rider: "",
  driverInfo : null
};

const rideSlice = createSlice({
  name: "ride",
  initialState,
  reducers: {
    setFromLocation: (state, action) => {
      state.fromLocation = action.payload;
    },
    setToLocation: (state, action) => {
      state.toLocation = action.payload;
    },
    addStop(state) {
      state.stops.push({
        id: `stop-${Date.now()}`,
        location: "",
        lat: null,
        lng: null,
      });
    },
    removeStop(state, action) {
      state.stops = state.stops.filter((stop) => stop.id !== action.payload);
    },
    updateStop(state, action) {
      const { id, location, lat, lng } = action.payload;
      const stop = state.stops.find((s) => s.id === id);
      if (stop) {
        stop.location = location;
        stop.lat = lat ?? stop.lat;
        stop.lng = lng ?? stop.lng;
      }
    },
    setIsScheduled: (state, action) => {
      state.isScheduled = action.payload;
    },
    setPickUpDate: (state, action) => {
      state.pickUpDate = action.payload;
    },
    setPickUpTime: (state, action) => {
      state.pickUpTime = action.payload;
    },
    setRider: (state, action) => {
      state.rider = action.payload;
    },
    setDriverInfo: (state,action)=>{
      state.driverInfo = action.payload;
    },
    resetRide: (state) => {
      Object.assign(state, initialState);
    },
  },
});

export const {
  setFromLocation,
  setToLocation,
  addStop,
  removeStop,
  updateStop,
  setIsScheduled,
  setPickUpDate,
  setPickUpTime,
  setRider,
  resetRide,
  setDriverInfo
} = rideSlice.actions;

export default rideSlice.reducer;
