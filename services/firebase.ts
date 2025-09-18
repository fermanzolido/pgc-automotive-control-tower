import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBDrnsoTrh4lHw6q0-wPUPowUI37164vEw",
  authDomain: "autitos-82ad2.firebaseapp.com",
  projectId: "autitos-82ad2",
  storageBucket: "autitos-82ad2.firebasestorage.app",
  messagingSenderId: "1073855461143",
  appId: "1:1073855461143:web:b15858452517829d786952",
  measurementId: "G-LLDF0B72DJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get a reference to the auth service
export const auth = getAuth(app);

// Get a reference to the Firestore service
export const db = getFirestore(app);
