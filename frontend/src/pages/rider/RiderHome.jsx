import React, { useState } from 'react';
import Navbar from '../../components/rider/Navbar';
import { Clock, User, ChevronDown, Plus, X, Star, MapPin, Navigation } from 'lucide-react';
import RideRequestPanel from '../../components/rider/RideRequestPanel';
import MapContainer from '../../components/rider/MapContainer';
import SwitchRiderModal from '../../components/rider/SwitchRiderModal';
import NewRiderModal from '../../components/rider/NewRiderModal';
import '../../styles/RiderHome.css'

const RiderHome = () => {
  const [isPickupOpen, setIsPickupOpen] = useState(false);
  const [stops, setStops] = useState([]);
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [isSwitchRiderOpen, setIsSwitchRiderOpen] = useState(false);
  const [isNewRiderOpen, setIsNewRiderOpen] = useState(false);
  const [riders, setRiders] = useState([
    { id: 'me', name: 'Me', selected: true },
    { id: 'sample1', name: 'Sample1 123', selected: false },
    { id: 'sample2', name: 'Sample1 123', selected: false },
  ]);
  const [newRider, setNewRider] = useState({ firstName: '', lastName: '', phone: '', countryCode: 'IN' });
  const [selectedRider, setSelectedRider] = useState('me');

  const handlePickupClick = () => {
    setIsPickupOpen(!isPickupOpen);
  };

  const handleAddStop = () => {
    setStops([...stops, { id: Date.now(), location: '' }]);
  };

  const handleRemoveStop = (id) => {
    setStops(stops.filter((stop) => stop.id !== id));
  };

  const handleStopChange = (id, value) => {
    setStops(stops.map((stop) => (stop.id === id ? { ...stop, location: value } : stop)));
  };

  const handleSwitchRiderClick = () => {
    setIsSwitchRiderOpen(true);
  };

  const handleSelectRider = (id) => {
    setSelectedRider(id);
    setRiders(riders.map((rider) => ({ ...rider, selected: rider.id === id })));
  };

  const handleNewRiderClick = () => {
    setIsSwitchRiderOpen(false);
    setIsNewRiderOpen(true);
  };

  const handleAddRider = () => {
    if (newRider.firstName && newRider.lastName && newRider.phone) {
      const riderId = `r${Date.now()}`;
      setRiders([...riders, { id: riderId, name: `${newRider.firstName} ${newRider.lastName}`, selected: true }]);
      setSelectedRider(riderId);
      setNewRider({ firstName: '', lastName: '', phone: '', countryCode: 'IN' });
      setIsNewRiderOpen(false);
      setIsSwitchRiderOpen(true);
    }
  };

  const handleCloseModals = () => {
    setIsSwitchRiderOpen(false);
    setIsNewRiderOpen(false);
  };

  // Determine if any modal is open to show the overlay
  const isModalOpen = isSwitchRiderOpen || isNewRiderOpen;

  return (
    <div className="bg-white h-screen flex flex-col overflow-hidden">
      <Navbar />
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        <RideRequestPanel
          pickupLocation={pickupLocation}
          setPickupLocation={setPickupLocation}
          isPickupOpen={isPickupOpen}
          setIsPickupOpen={setIsPickupOpen}
          stops={stops}
          handleAddStop={handleAddStop}
          handleRemoveStop={handleRemoveStop}
          handleStopChange={handleStopChange}
          dropoffLocation={dropoffLocation}
          setDropoffLocation={setDropoffLocation}
          handleSwitchRiderClick={handleSwitchRiderClick}
          riders={riders}
          selectedRider={selectedRider}
        />
        <MapContainer>
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
        </MapContainer>
      </div>
    </div>
  );
};

export default RiderHome;