import { combineReducers  } from "@reduxjs/toolkit";
import rideReducer from '../slices/rideSlice';
import locationReducer from '../slices/locationSlice';
import mapReducer from '../slices/mapSlice';

const rootReducer = combineReducers({
    ride : rideReducer,
    location: locationReducer,
  map: mapReducer,
});

export default rootReducer;