import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// REPLACE WITH YOUR FIREBASE PROJECT CONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyCvsxyMtSFXyWK7qd5_4Vzvs8bh1-l9Bss",
  authDomain: "temporary-e32e1.firebaseapp.com",
  projectId: "temporary-e32e1",
  storageBucket: "temporary-e32e1.firebasestorage.app",
  messagingSenderId: "54911297371",
  appId: "1:54911297371:web:85b85a7a50d4ec2be91c7e",
  measurementId: "G-SFJ6DZB8XE"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
