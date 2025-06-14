
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

// Your web app's Firebase configuration
// IMPORTANT: Replace with your actual Firebase project configuration
// It's recommended to store these in environment variables for security
const firebaseConfig = {
  apiKey: "AIzaSyCCHd9ZjinR6xGWu47edvpCvbGDK1wsfKo",
  authDomain: "buildmaster-jszoc.firebaseapp.com",
  projectId: "buildmaster-jszoc",
  storageBucket: "buildmaster-jszoc.firebasestorage.app",
  messagingSenderId: "4228702072",
  appId: "1:4228702072:web:2ac888b52d209f47e6328d"
};

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

db = getFirestore(app);
auth = getAuth(app);

export { db, auth };

// Instructions for the user:
// 1. Create a Firebase project at https://console.firebase.google.com/
// 2. In your Firebase project, go to Project settings > General.
// 3. Under "Your apps", click the Web icon (</>) to register a web app.
// 4. Copy the firebaseConfig object provided and paste it above, replacing the placeholder.
// 5. Go to Firebase Console > Authentication > Sign-in method and enable "Email/Password".
// 6. Update Firestore Security Rules to use `request.auth.uid` for secure data access. Example:
//    rules_version = '2';
//    service cloud.firestore {
//      match /databases/{database}/documents {
//        match /buildLists/{listId} {
//          allow read, update, delete: if request.auth.uid == resource.data.userId;
//          allow create: if request.auth.uid == request.resource.data.userId;
//          match /items/{itemId} {
//            allow read, write: if get(/databases/$(database)/documents/buildLists/$(listId)).data.userId == request.auth.uid;
//          }
//        }
//      }
//    }
