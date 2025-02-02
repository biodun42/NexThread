import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { collection, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAf2CPbTLLitRKmEJMoVJa6PZ-r-ZYny9U",
  authDomain: "social-hub-a2d2a.firebaseapp.com",
  projectId: "social-hub-a2d2a",
  storageBucket: "social-hub-a2d2a.firebasestorage.app",
  messagingSenderId: "935813998312",
  appId: "1:935813998312:web:5aa6ebac748d2dfae38b5d",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const usersCollection = collection(db, "Users");
export const usersFriendsCollection = collection(db, "UsersFriends");
export const postsCollection = collection(db, "Posts");
export const messagesCollection = collection(db, "Messages");
export const notificationsCollection = collection(db, "Notifications");
export default app;
