import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAwexfSWiMzCiNKPVqnFVMTkFPzGLGCCwU",
  authDomain: "fragrancemarket-f9b90.firebaseapp.com",
  projectId: "fragrancemarket-f9b90",
  storageBucket: "fragrancemarket-f9b90.firebasestorage.app",
  messagingSenderId: "474378507598",
  appId: "1:474378507598:web:92a605e00638449e73fa1f",
  measurementId: "G-R1G8Q662M0",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize analytics only on client side
if (typeof window !== "undefined") {
  import("firebase/analytics").then(({ getAnalytics }) => {
    getAnalytics(app);
  });
}
