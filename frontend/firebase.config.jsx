// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, RecaptchaVerifier, signInWithPhoneNumber, signInWithPopup } from "firebase/auth";


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA0pe3KucPPqgRNiojJIf1JGDo7U3XQA2o",
  authDomain: "ridemate-9a0bd.firebaseapp.com",
  projectId: "ridemate-9a0bd",
  storageBucket: "ridemate-9a0bd.firebasestorage.app",
  messagingSenderId: "742648586553",
  appId: "1:742648586553:web:3871d3e9ad038f220908e8",
  measurementId: "G-K2NHTQM31K"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google Auth Provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export { auth, googleProvider, RecaptchaVerifier, signInWithPhoneNumber, signInWithPopup };