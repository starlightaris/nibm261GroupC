// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { Auth, getAuth } from "firebase/auth";
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD5nfPG1YxSlfJjljfhsqC425F50WkptiQ",
  authDomain: "transportapp-54704.firebaseapp.com",
  projectId: "transportapp-54704",
  storageBucket: "transportapp-54704.firebasestorage.app",
  messagingSenderId: "142515192910",
  appId: "1:142515192910:web:26cb8f06b0a2da910c6f1f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize and export Auth
export const auth: Auth = getAuth(app);