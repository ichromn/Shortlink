import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCRaQnnOXe3_JaQSSXkt0j3ONNhOmrULkw",
  authDomain: "omega-axe-jn50x.firebaseapp.com",
  projectId: "omega-axe-jn50x",
  storageBucket: "omega-axe-jn50x.firebasestorage.app",
  messagingSenderId: "144357890472",
  appId: "1:144357890472:web:885f53bc59dd898212259d"
};

const databaseId = "ai-studio-3d913c48-4d18-4d30-8b77-04ddc04b2f65";

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with explicit database ID
const db = getFirestore(app, databaseId);

// Initialize Auth
const auth = getAuth(app);

export { app, db, auth };
