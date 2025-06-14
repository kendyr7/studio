
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
// import { getAuth, type Auth } from "firebase/auth"; // Uncomment if you plan to use Firebase Auth

// Your web app's Firebase configuration
// IMPORTANT: Replace with your actual Firebase project configuration
// It's recommended to store these in environment variables for security
const firebaseConfig = {
  apiKey: "AIzaSyA-Ox5V8CH7ZYJJJLUjw1Ir2plxnetDzY0",
  authDomain: "buildmaster-27b4a.firebaseapp.com",
  projectId: "buildmaster-27b4a",
  storageBucket: "buildmaster-27b4a.firebasestorage.app",
  messagingSenderId: "722399882640",
  appId: "1:722399882640:web:6ac29c87dcb9945958d715",
  // measurementId: "G-59SEZJECVM" // Optional
};

let app: FirebaseApp;
let db: Firestore;
// let auth: Auth; // Uncomment if using Auth

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

db = getFirestore(app);
// auth = getAuth(app); // Uncomment if using Auth

export { db /*, auth */ }; // Export auth if you uncomment its initialization

// Instructions for the user:
// 1. Create a Firebase project at https://console.firebase.google.com/
// 2. In your Firebase project, go to Project settings > General.
// 3. Under "Your apps", click the Web icon (</>) to register a web app.
// 4. Copy the firebaseConfig object provided and paste it above, replacing the placeholder.
// 5. For security, it's best to use environment variables:
//    - Create a .env.local file in your project root.
//    - Add your Firebase config values like:
//      NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
//      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
//      ... and so on for all config properties.
//    - Ensure .env.local is in your .gitignore file.
// 6. If you plan to use Firebase Authentication, uncomment the auth-related lines in this file.