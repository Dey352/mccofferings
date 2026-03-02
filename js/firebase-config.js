/* =====================================================
   FIREBASE CLOUD DATABASE CONFIGURATION
   =====================================================
   Connected to: mccofferings (Firebase Firestore)
   ===================================================== */

const firebaseConfig = {
   apiKey: "AIzaSyCFiRgtxi5hcbaqQWyqM4V5toNQ1BIOXeE",
   authDomain: "mccofferings.firebaseapp.com",
   projectId: "mccofferings",
   storageBucket: "mccofferings.firebasestorage.app",
   messagingSenderId: "1041592209356",
   appId: "1:1041592209356:web:9857aec5c89a28e1d05769",
   measurementId: "G-WR9GM070TF"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Collection references (used throughout app.js)
const offeringsCollection = db.collection('offerings');
const expensesCollection_ref = db.collection('expenses');
const settingsDoc = db.collection('appSettings').doc('churchInfo');

console.log('✅ Database ready (Firebase Cloud mode)');
