// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, RecaptchaVerifier, signInWithPhoneNumber, signInWithPopup } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB1GRcJow_muUKXr8_BTCypOaK62NbKWs8",
  authDomain: "ridemate-e13f9.firebaseapp.com",
  projectId: "ridemate-e13f9",
  storageBucket: "ridemate-e13f9.firebasestorage.app",
  messagingSenderId: "469690387372",
  appId: "1:469690387372:web:e5c724ae50486d8fbd4809",
  measurementId: "G-FLKL8DTSPK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider, RecaptchaVerifier, signInWithPhoneNumber, signInWithPopup };