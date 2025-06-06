import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    isPickupOpen : false,
    isNarrow : true,
    isRequested : true,
    pickUpNowClicked : false,
    isSwitchRiderOpen : false,
    isNewRiderOpen : false,
    requestId: null,
    isDriverMatched : false,
}

const locationSlice = createSlice({
    name : 'location',
    initialState,
    reducers :{
        setIsPickupOpen: (state, action) => {
      state.isPickupOpen = action.payload;
    },
    setIsNarrow: (state, action) => {
      state.isNarrow = action.payload;
    },
    setIsRequested: (state, action) => {
      state.isRequested = action.payload;
    },
    setPickUpNowClicked: (state, action) => {
      state.pickUpNowClicked = action.payload;
    },
    setIsSwitchRiderOpen: (state, action) => {
      state.isSwitchRiderOpen = action.payload;
    },
    setIsNewRiderOpen: (state, action) => {
      state.isNewRiderOpen = action.payload;
    },
    setRequestId(state, action) {
      state.requestId = action.payload;
    },
    setIsDriverMatched(state,action){
      state.isDriverMatched = action.payload;
    }
    }
})

export const {
  setIsPickupOpen,
setIsNarrow,
  setIsRequested,
  setPickUpNowClicked,
  setIsSwitchRiderOpen,
  setIsNewRiderOpen,
  setRequestId,
  setIsDriverMatched
} = locationSlice.actions;
export default locationSlice.reducer;