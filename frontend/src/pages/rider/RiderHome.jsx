import React, { useState } from 'react';
import Navbar from '../../components/rider/Navbar';
import { Clock, User, ChevronDown, Plus, X, Star, MapPin, Navigation } from 'lucide-react';
import RideRequestPanel from '../../components/rider/RideRequestPanel';
import SwitchRiderModal from '../../components/rider/SwitchRiderModal';
import NewRiderModal from '../../components/rider/NewRiderModal';
import '../../styles/RiderHome.css';
import RiderMapContainer from '../../components/rider/RiderMapContainer';
import { useSelector, useDispatch } from 'react-redux';
import { setIsPickupOpen, setIsSwitchRiderOpen, setIsNewRiderOpen } from '../../redux/rider/slices/locationSlice';
import { addStop, removeStop, updateStop } from '../../redux/rider/slices/rideSlice';

const RiderHome = () => {
  const dispatch = useDispatch();
  const { isPickupOpen, isSwitchRiderOpen, isNewRiderOpen } = useSelector(state => state.location);
  const [riders, setRiders] = useState([
    { id: 'me', name: 'Me', selected: true },
    { id: 'sample1', name: 'Sample1 123', selected: false },
    { id: 'sample2', name: 'Sample1 123', selected: false },
  ]);
  const [newRider, setNewRider] = useState({ firstName: '', lastName: '', phone: '', countryCode: 'IN' });
  const [selectedRider, setSelectedRider] = useState('me');

  const handlePickupClick = () => {
    dispatch(setIsPickupOpen(!isPickupOpen));
  };

  const handleAddStop = () => {
    dispatch(addStop());
  };

  const handleRemoveStop = (id) => {
    dispatch(removeStop());
  };

  const handleStopChange = (id, value) => {
    dispatch(updateStop({ id, location: value }));
  };

  const handleSwitchRiderClick = () => {
    dispatch(setIsSwitchRiderOpen(true));
  };

  const handleSelectRider = (id) => {
    setSelectedRider(id);
    setRiders(riders.map((rider) => ({ ...rider, selected: rider.id === id })));
  };

  const handleNewRiderClick = () => {
    dispatch(setIsSwitchRiderOpen(false));
    dispatch(setIsNewRiderOpen(true));
  };

  const handleAddRider = () => {
    if (newRider.firstName && newRider.lastName && newRider.phone) {
      const riderId = `r${Date.now()}`;
      setRiders([...riders, { id: riderId, name: `${newRider.firstName} ${newRider.lastName}`, selected: true }]);
      setSelectedRider(riderId);
      setNewRider({ firstName: '', lastName: '', phone: '', countryCode: 'IN' });
      dispatch(setIsNewRiderOpen(false));
      dispatch(setIsSwitchRiderOpen(true));
    }
  };

  const handleCloseModals = () => {
    dispatch(setIsSwitchRiderOpen(false));
    dispatch(setIsNewRiderOpen(false));
  };

  const isModalOpen = isSwitchRiderOpen || isNewRiderOpen;

  return (
    <div className="bg-white h-screen flex flex-col overflow-hidden">
      <Navbar />
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden mt-4">
        <RideRequestPanel
          riders={riders}
          selectedRider={selectedRider}
          handleSwitchRiderClick={handleSwitchRiderClick}
        />
        <RiderMapContainer>
          {isModalOpen && (
            <div
              className="fixed inset-0 bg-black opacity-20 z-30"
              onClick={handleCloseModals}
            ></div>
          )}
          {isSwitchRiderOpen && (
            <SwitchRiderModal
              riders={riders}
              onSelectRider={handleSelectRider}
              onNewRider={handleNewRiderClick}
              onClose={handleCloseModals}
            />
          )}
          {isNewRiderOpen && (
            <NewRiderModal
              newRider={newRider}
              onChange={setNewRider}
              onAddRider={handleAddRider}
              onClose={handleCloseModals}
            />
          )}
        </RiderMapContainer>
      </div>
    </div>
  );
};

export default RiderHome;