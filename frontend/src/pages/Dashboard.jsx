import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/current_user", {
          withCredentials: true
        });
        if (!response.data) {
          navigate("/"); // Redirect to home if not authenticated
        } else {
          setCurrentUser(response.data);
        }
      } catch (err) {
        console.log("No authenticated user:", err);
        navigate("/");
      }
    };
    fetchCurrentUser();
  }, [navigate]);

  // Handle Logout
  const handleLogout = () => {
    window.location.href = "http://localhost:5000/api/logout"; // Direct redirect
  };

  if (!currentUser) {
    return <div className="text-white text-center p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-8">Dashboard</h1>
      <div className="flex flex-col items-center space-y-4">
        <span className="text-xl">Welcome back, {currentUser.displayName}!</span>
        <span className="text-lg text-gray-300">Email: {currentUser.email}</span>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition duration-300"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Dashboard;