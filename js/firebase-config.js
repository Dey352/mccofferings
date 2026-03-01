/* =====================================================
   DATABASE CONFIGURATION
   =====================================================
   
   Currently using localStorage for offline storage.
   To switch to Firebase, uncomment the Firebase section
   below and add your config.

   ===================================================== */

// ============ LOCAL STORAGE MODE (default) ============

const DB_MODE = 'local'; // Change to 'firebase' when ready

// Fake Firestore-like API using localStorage
const localDB = {
   _get(key) {
      try { return JSON.parse(localStorage.getItem(key)) || []; }
      catch { return []; }
   },
   _set(key, data) {
      localStorage.setItem(key, JSON.stringify(data));
   },
   _genId() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
   }
};

// Collection wrapper that mimics Firestore API
function createLocalCollection(name) {
   return {
      async add(data) {
         const items = localDB._get(name);
         const id = localDB._genId();
         items.push({ ...data, id });
         localDB._set(name, items);
         return { id };
      },
      doc(id) {
         return {
            async update(data) {
               const items = localDB._get(name);
               const i = items.findIndex(x => x.id === id);
               if (i !== -1) { items[i] = { ...items[i], ...data }; localDB._set(name, items); }
            },
            async delete() {
               let items = localDB._get(name);
               items = items.filter(x => x.id !== id);
               localDB._set(name, items);
            },
            async get() {
               const items = localDB._get(name);
               const item = items.find(x => x.id === id);
               return { exists: !!item, data: () => item || {} };
            },
            async set(data, options) {
               const items = localDB._get(name);
               const i = items.findIndex(x => x.id === id);
               if (i !== -1) {
                  items[i] = options?.merge ? { ...items[i], ...data } : { ...data, id };
                  localDB._set(name, items);
               } else {
                  items.push({ ...data, id });
                  localDB._set(name, items);
               }
            }
         };
      },
      async get() {
         const items = localDB._get(name);
         return { docs: items.map(item => ({ id: item.id, ref: { id: item.id }, data: () => item })) };
      },
      orderBy() { return this; },
      onSnapshot(callback) {
         // Trigger immediately with current data
         const items = localDB._get(name);
         callback({ docs: items.map(item => ({ id: item.id, data: () => item })) });
         // No real-time updates in localStorage, but the function exists so code doesn't break
         return () => { };
      }
   };
}

// Create fake db.batch() for import/clear
const db = {
   collection(name) { return createLocalCollection(name); },
   batch() {
      const ops = [];
      return {
         set(ref, data) { ops.push({ type: 'set', ref, data }); },
         delete(ref) { ops.push({ type: 'delete', ref }); },
         async commit() {
            for (const op of ops) {
               if (op.type === 'delete') {
                  // handled by clear logic
               }
            }
         }
      };
   }
};

// Collection references (same variable names as Firebase version)
const offeringsCollection = db.collection('offerings');
const expensesCollection_ref = db.collection('expenses');
const settingsDoc = db.collection('appSettings').doc('churchInfo');

console.log('Database ready (localStorage mode)');


/* ============ FIREBASE MODE (uncomment when ready) ============

// 1. Uncomment the lines below
// 2. Paste your Firebase config
// 3. Change DB_MODE to 'firebase' above

const firebaseConfig = {
   apiKey: "YOUR_API_KEY_HERE",
   authDomain: "YOUR_PROJECT.firebaseapp.com",
   projectId: "YOUR_PROJECT_ID",
   storageBucket: "YOUR_PROJECT.appspot.com",
   messagingSenderId: "YOUR_SENDER_ID",
   appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const offeringsCollection = db.collection('offerings');
const settingsDoc = db.collection('appSettings').doc('churchInfo');

============================================================== */
