import { initializeApp } from "firebase/app";
import { 
  getAuth 
} from "firebase/auth";

import {
  getFirestore
} from "firebase/firestore";


const firebaseConfig = {

  apiKey: "AIzaSyD5nfPG1YxSlfJjljfhsqC425F50WkptiQ",

  authDomain:
  "transportapp-54704.firebaseapp.com",

  projectId:
  "transportapp-54704",

  storageBucket:
  "transportapp-54704.firebasestorage.app",

  messagingSenderId:
  "142515192910",

  appId:
  "1:142515192910:web:26cb8f06b0a2da910c6f1f"

};



const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);

export const db = getFirestore(app);