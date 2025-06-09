import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "../pages/HomePage";
import RiderLogin from "../pages/rider/RiderLogin";
import RiderRegister from "../pages/rider/RiderRegister";
import RiderHome from "../pages/rider/RiderHome";
import CaptainLogin from "../pages/captain/CaptainLogin";
import CaptainRegister from "../pages/captain/CaptainRegister";
import PhoneOTP from "../pages/rider/PhoneOTP";

const AllRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/rider/login" element={<RiderLogin/>}/>
      <Route path="/rider/register" element={<RiderRegister/>}/>
      <Route path="/rider/phone-otp" element={<PhoneOTP/>}/>
      <Route path="/rider/home" element={<RiderHome/>}/>
      <Route path="/captain/login" element={<CaptainLogin/>}/>
      <Route path="/captain/register" element={<CaptainRegister/>}/>
    </Routes>
  );
};

export default AllRoutes;
