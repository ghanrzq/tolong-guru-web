import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Ganti nilai di bawah dengan data dari Firebase Console Anda
const firebaseConfig = {
  apiKey: "AIzaSyD0cgGVaS7ythrn3slFfU2IKz2fOtLpz7U",
  authDomain: "tolong-guru.firebaseapp.com",
  projectId: "tolong-guru",
  storageBucket: "tolong-guru.firebasestorage.app",
  messagingSenderId: "518663644102",
  appId: "1:518663644102:web:8df1cb7375ae001f3648c7"
};

// Inisialisasi Firebase dan Firestore
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);