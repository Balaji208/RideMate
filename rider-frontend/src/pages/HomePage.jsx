import React from "react";
import { NavLink } from "react-router-dom";
import HomeNavBar from "../components/HomeNavBar";
import HeroSection from "../components/rider/HeroSection";
import Suggestions from "../components/rider/Suggestions";
import ReserveRide from "../components/rider/ReserveRide";
import AboutBusiness from "../components/AboutBusiness";
import AboutRental from "../components/AboutRental";
import AboutCaptain from "../components/AboutCaptain";
import Footer from "../components/Footer";
import AboutRider from "../components/AboutRider";
const HomePage = () => {


  return (
    <>
      <HomeNavBar />
      <div className="md:mx-12 sm:mx-6 mx-4">
        <div className="mt-8 h-28 w-full"></div>
        <HeroSection />

        {/* Sugesstions Field */}

        <Suggestions/>

        {/* Reserve Ride */}
        <AboutRider/>
        <ReserveRide/>
        <AboutCaptain />
        <AboutBusiness />
        <AboutRental />
      </div>
      <Footer/>
    </>
  );
};

export default HomePage;
