import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  Auth,
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD5nfPG1YxSlfJjljfhsqC425F50WkptiQ",
  authDomain: "transportapp-54704.firebaseapp.com",
  projectId: "transportapp-54704",
  storageBucket: "transportapp-54704.firebasestorage.app",
  messagingSenderId: "142515192910",
  appId: "1:142515192910:web:26cb8f06b0a2da910c6f1f",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore
export const db = getFirestore(app);

// Initialize Auth with persistent storage so the session survives app restarts.
// initializeAuth throws if Auth was already initialized (e.g. fast refresh),
// so fall back to getAuth in that case.
let authInstance: Auth;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
} catch {
  authInstance = getAuth(app);
}

export const auth: Auth = authInstance;