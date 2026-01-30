// Firebase initialization (loaded as module)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, setPersistence, browserSessionPersistence } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, limit, serverTimestamp, getCountFromServer } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';
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

// Use modern cache settings to avoid deprecation warning
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});
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
  limit,
  serverTimestamp,
  getCountFromServer
};

// Diagnostic wrapper: replace `doc` with a wrapper that logs suspicious calls (helps find invalid refs)
try {
  const _origDoc = window.dbFuncs.doc;
  window.dbFuncs.doc = function(...args) {
    try {
      // args typically: (db, 'collection', 'docId', ...)
      if (args.length === 2 && typeof args[1] === 'string') {
        // Likely a call like doc(db, 'appointments') — invalid (missing id)
        console.error('Diagnostic: doc() called with single path segment', args[1], '\nCall stack:', new Error().stack);
      }
    } catch (e) { console.warn('doc wrapper diagnostics failed', e); }
    return _origDoc.apply(this, args);
  };
} catch (e) { console.warn('Could not wrap doc for diagnostics', e); }

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
