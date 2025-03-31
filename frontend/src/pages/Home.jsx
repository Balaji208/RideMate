import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// 🔥 Google OAuth Client ID
const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID";

const App = () => {
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [user, setUser] = useState(null);

    // 📌 Send OTP
    const handleSendOtp = async () => {
        try {
            await axios.post("http://localhost:3001/send-otp", { phone });
            toast.success("OTP Sent!");
        } catch (error) {
            toast.error("Failed to send OTP");
        }
    };

    // 📌 Verify OTP
    const handleVerifyOtp = async () => {
        try {
            await axios.post("http://localhost:3001/verify-otp", { phone, code: otp });
            toast.success("OTP Verified!");
        } catch (error) {
            toast.error("Invalid OTP");
        }
    };

    // 🔥 Google Sign-In
    const handleGoogleSignIn = async () => {
        window.location.href = "http://localhost:3001/auth/google";
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 py-8">
            <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
                <h2 className="text-3xl font-semibold text-center text-indigo-600 mb-6">
                    OTP Authentication & Google Sign-In
                </h2>

                {/* OTP Authentication */}
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Enter Phone Number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                        onClick={handleSendOtp}
                        className="w-full mt-3 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition duration-200"
                    >
                        Send OTP
                    </button>
                </div>

                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Enter OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                        onClick={handleVerifyOtp}
                        className="w-full mt-3 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition duration-200"
                    >
                        Verify OTP
                    </button>
                </div>

                {/* Google Sign-In */}
                <div className="flex justify-center mb-6">
                    <button
                        onClick={handleGoogleSignIn}
                        className="flex items-center justify-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
                    >
                        <span className="mr-2">Sign in with Google</span>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                            className="w-5 h-5"
                        >
                            <path
                                d="M9.197 3.333c0-.707-.057-1.32-.173-1.878H5.84v3.561h1.864c-1.246 2.455-3.61 2.253-4.275 1.726V5.6h-2.88v6.243h2.87v-3.38c0-2.517 1.825-3.494 3.773-3.494 2.085 0 3.384 1.215 3.384 3.351v3.389h-2.886c0 0 .116-1.003 1.29-2.226s1.122-.228 1.122-.228"
                            />
                        </svg>
                    </button>
                </div>

                {user && (
                    <div className="mt-4 text-center">
                        <h3 className="text-xl font-semibold text-gray-800">
                            Welcome, {user.name}
                        </h3>
                        <img
                            src={user.picture}
                            alt="User Profile"
                            className="mx-auto rounded-full mt-3 w-32 h-32 object-cover"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;
