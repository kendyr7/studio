
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
// import { getAuth, type Auth } from "firebase/auth"; // Uncomment if you plan to use Firebase Auth

// Your web app's Firebase configuration
// IMPORTANT: Replace with your actual Firebase project configuration
// It's recommended to store these in environment variables for security
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
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
