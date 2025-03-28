import React, { useEffect, useState } from "react";
import axios from "axios";

const Home = () => {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/current_user", {
          withCredentials: true
        });
        setCurrentUser(response.data);
      } catch (err) {
        console.log("No authenticated user:", err);
      }
    };
    fetchCurrentUser();
  }, []);

  const handleGoogleSignIn = () => {
    window.location.href = "http://localhost:5000/auth/google";
  };

  const handleLogout = () => {
    window.location.href = "http://localhost:5000/api/logout"; // Direct redirect
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-8">MERN OAuth2 Demo</h1>
      {currentUser ? (
        <div className="flex flex-col items-center space-y-4">
          <span className="text-xl">Welcome, {currentUser.displayName}!</span>
          <span className="text-lg text-gray-300">Email: {currentUser.email}</span>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition duration-300"
          >
            Logout
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-4">
          <p className="text-lg">Please sign in to continue</p>
          <button
            onClick={handleGoogleSignIn}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            Sign in with Google
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;