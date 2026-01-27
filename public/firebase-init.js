// Firebase initialization (loaded as module)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, setPersistence, browserSessionPersistence } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { getFirestore, collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, serverTimestamp, enableMultiTabIndexedDbPersistence, getCountFromServer } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';
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

// Secondary app for creating client accounts without logging out admin
const secondaryApp = initializeApp(firebaseConfig, "Secondary");
const secondaryAuth = getAuth(secondaryApp);
// IMPORTANT: Set persistence to session or none for secondary auth to avoid clobbering main auth
setPersistence(secondaryAuth, browserSessionPersistence).catch(e => console.error("Secondary Auth persistence failed", e));
window.secondaryAuth = secondaryAuth;

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
  serverTimestamp,
  getCountFromServer
};

// Enable offline persistence (IndexedDB) with multi-tab support
try {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time (standard)
      // or multi-tab failed for some reason.
      console.warn('Multi-tab persistence failed-precondition, likely multiple tabs fighting for lock.');
    } else if (err.code === 'unimplemented') {
      // The current browser doesn't support all of the features required to enable persistence
      console.warn('The current browser does not support persistence.');
    } else {
      console.warn('Firestore persistence error:', err);
    }
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
