// Firebase initialization (loaded as module)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { getFirestore, collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, serverTimestamp, enableIndexedDbPersistence } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';
// Storage removed per user request

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyCnKPW18wREUTZm9qdWD7rovTb1iE8kAvA",
  authDomain: "notary-public-crm.firebaseapp.com",
  projectId: "notary-public-crm",
  messagingSenderId: "802930505627",
  appId: "1:802930505627:web:cdaf0c37839b5b4014533e",
  measurementId: "G-HJ9MHEFZB1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let analytics;
try { analytics = getAnalytics(app); } catch (e) { /* analytics may fail in non-https or local env */ }
const auth = getAuth(app);
const db = getFirestore(app);
// Expose to non-module scripts (like app.js)
window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseDB = db;
window.firebaseAnalytics = analytics;

// Firestore helper functions for non-module scripts
window.dbFuncs = {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp
};

// Enable offline persistence (IndexedDB) when available
try {
  enableIndexedDbPersistence(db).catch((err) => {
    // fallback: multiple tabs or unsupported environment
    console.warn('IndexedDB persistence not enabled:', err && err.message ? err.message : err);
  });
} catch (e) {
  console.warn('Could not enable persistence', e);
}

// Storage helpers
// Auth helpers
window.authFuncs = {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
};

console.info('Firebase initialized and helpers exposed');
