// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDiOL4dwXtT3KxN_5XvpotxWMQqsHZwzL4",
  authDomain: "task-manager-46133.firebaseapp.com",
  projectId: "task-manager-46133",
  storageBucket: "task-manager-46133.firebasestorage.app",
  messagingSenderId: "1002931781391",
  appId: "1:1002931781391:web:94799cfe4afdd74f83887a",
  measurementId: "G-S7GH571P24"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
 export const auth = getAuth(app);