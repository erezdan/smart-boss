// firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  enableNetwork,
} from "firebase/firestore";
import logger from "../utiles/myLogger";

/* 
⚠️ FIREBASE CONFIGURATION
Use environment variables for sensitive keys (handled via Vite).
Do NOT hardcode private keys or secrets here.
Changing projectId, storageBucket, or authDomain may break login and Firestore access.
*/
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);

// Comment: Lazy-load Analytics after app boot
let analytics = null;

setTimeout(async () => {
  try {
    const { isSupported, getAnalytics, logEvent } = await import(
      "firebase/analytics"
    );

    const supported = await isSupported();

    if (!supported) {
      console.log("Analytics not supported");
      return;
    }

    analytics = getAnalytics(app);
    console.log("Analytics enabled (lazy)");
    logEvent(analytics, "app_opened");
  } catch (err) {
    console.log("Analytics failed to initialize", err);
  }
}, 1500);

// --- Authentication setup ---
const auth = getAuth(app);

/* 
Persistent login configuration
⚠️ Do NOT remove or change browserLocalPersistence
or users will be logged out every refresh.
*/
setPersistence(auth, browserLocalPersistence).catch((err) =>
  logger.error("Auth persistence error:", err)
);

// --- Firestore setup ---
/*
Using persistent local cache for offline support and multi-tab sync.
⚠️ Keep both persistentLocalCache() and persistentMultipleTabManager()
for stable multi-tab usage.
*/
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

/*
Enable network manually to ensure Firestore syncs online.
Do NOT disable this — it’s required for proper real-time updates.
*/
enableNetwork(db).catch((err) => logger.error("enableNetwork failed:", err));

// --- Export Firebase instances ---
export { app, auth, db, analytics };
