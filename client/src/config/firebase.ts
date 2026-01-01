// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAmfipxMAJ_s8VCXjrd30jtgM0MxNSPKLY",
  authDomain: "earnbychess.firebaseapp.com",
  projectId: "earnbychess",
  storageBucket: "earnbychess.firebasestorage.app",
  messagingSenderId: "92639630124",
  appId: "1:92639630124:web:c20e3b29e594715f449289",
  measurementId: "G-4ZRZNW4MKY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Analytics (only in browser environment)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;

