import { useState } from "react";
import { BsFillShieldLockFill, BsTelephoneFill } from "react-icons/bs";
import { CgSpinner } from "react-icons/cg";
import { FcGoogle } from "react-icons/fc";

import OtpInput from "otp-input-react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { toast, Toaster } from "react-hot-toast";

import { auth, RecaptchaVerifier, signInWithPhoneNumber,  } from "../../firebase.config";

const Home = () => {
  const [otp, setOtp] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [user, setUser] = useState(null);
  
  // Google Sign-In
  const handleGoogleSignIn = async () => {
    window.location.href = "http://localhost:3001/auth/google"
  };

  // Phone Number Login
  function onCaptchVerify() {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        "recaptcha-container",
        {
          size: "invisible",
          callback: () => onSignup(),
        },
        auth
      );
    }
  }

  function onSignup() {
    setLoading(true);
    onCaptchVerify();

    const appVerifier = window.recaptchaVerifier;
    const formattedPhone = `+${phone}`;

    signInWithPhoneNumber(auth, formattedPhone, appVerifier)
      .then((confirmationResult) => {
        window.confirmationResult = confirmationResult;
        setLoading(false);
        setShowOTP(true);
        toast.success("OTP Sent Successfully!");
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
        toast.error("Failed to Send OTP!");
      });
  }

  function onOTPVerify() {
    setLoading(true);
    window.confirmationResult
      .confirm(otp)
      .then((res) => {
        setUser(res.user);
        setLoading(false);
        toast.success("Phone Authentication Successful!");
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
        toast.error("OTP Verification Failed!");
      });
  }

  return (
    <section className="bg-gray-100 flex items-center justify-center min-h-screen p-4">
      <div className="bg-white shadow-md rounded-lg p-6 max-w-sm w-full text-center">
        <Toaster toastOptions={{ duration: 4000 }} />
        <div id="recaptcha-container"></div>

        {user ? (
          <h2 className="text-xl font-semibold text-green-600">✅ Login Successful!</h2>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-6">Welcome to RideMate</h1>

            {/* Google Sign-In */}
            <button
              onClick={handleGoogleSignIn}
              className="flex items-center justify-center bg-white border border-gray-300 rounded-lg px-4 py-2 w-full mb-4 shadow-sm hover:shadow-md transition"
            >
              <FcGoogle size={24} className="mr-2" />
              <span className="font-semibold text-gray-700">Sign in with Google</span>
            </button>

            {/* Phone Sign-In */}
            {!showOTP ? (
              <>
                <div className="flex justify-center items-center bg-green-500 text-white w-12 h-12 rounded-full mx-auto mb-4">
                  <BsTelephoneFill size={24} />
                </div>
                <label className="text-gray-600 font-semibold">Verify your phone number</label>
                <PhoneInput country={"in"} value={phone} onChange={setPhone} className="mt-2" />
                <button
                  onClick={onSignup}
                  className="bg-green-600 w-full text-white font-semibold rounded-lg py-2 mt-4 transition hover:bg-green-700 flex justify-center items-center"
                >
                  {loading && <CgSpinner size={20} className="animate-spin mr-2" />}
                  Send OTP
                </button>
              </>
            ) : (
              <>
                <div className="flex justify-center items-center bg-blue-500 text-white w-12 h-12 rounded-full mx-auto mb-4">
                  <BsFillShieldLockFill size={24} />
                </div>
                <label className="text-gray-600 font-semibold">Enter OTP</label>
                <OtpInput
                  value={otp}
                  onChange={setOtp}
                  OTPLength={6}
                  otpType="number"
                  className="mt-2"
                />
                <button
                  onClick={onOTPVerify}
                  className="bg-blue-600 w-full text-white font-semibold rounded-lg py-2 mt-4 transition hover:bg-blue-700 flex justify-center items-center"
                >
                  {loading && <CgSpinner size={20} className="animate-spin mr-2" />}
                  Verify OTP
                </button>
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default Home;
