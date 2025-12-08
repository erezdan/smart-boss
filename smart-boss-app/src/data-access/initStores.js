import { UserStore } from "./UserStore";
//import { db } from "../lib/firebase";
import { getFirestore, terminate } from "firebase/firestore";
//import { collection, addDoc } from "firebase/firestore";
import logger from "../utiles/myLogger.js";

let storesInitialized = false;
let guestInitialized = false;

/**
 * Initialize all Firestore listeners.
 * Global listeners always run (Flights + AppSettings).
 * User-specific listeners start only if uid is provided.
 */
export async function initStores(uid) {
  if (storesInitialized) {
    logger.warning(
      "⚠️ initStores called but listeners already active — skipping."
    );
    return;
  }

  try {
    storesInitialized = true;
    logger.log(
      `🚀 Initializing Firestore listeners${uid ? " for user: " + uid : ""}`
    );

    if (guestInitialized) {
      // Reset guest Flights
      try {
        //FlightsStore.getState().setFlights([]);
      } catch (err) {
        logger.error("❌ GuestMode: Failed to inject flights", err);
      }
    }

    // ✅ replaced direct calls with safeListen wrapper
    //await listenWithRetry("AppsSettings", AppsSettingsStore.getState().listen);
    //await listenWithRetry(
    //  "FlightTemplates"
    //FlightTemplatesStore.getState().listen
    //);

    if (uid) {
      //await listenWithRetry("Flights", FlightsStore.getState().listen);
      //await listenWithRetry(
      //"UserFlights",
      //UserFlightsStore.getState().listen,
      //uid
      //);
      //await listenWithRetry("Bookings", BookingsStore.getState().listen, uid);
      //await listenWithRetry("Payments", PaymentsStore.getState().listen, uid);
    }
    logger.log("✅ All listeners started (non-blocking).");
  } catch (err) {
    storesInitialized = false;
    logger.error("❌ Failed to initialize stores:", err);
  }
}

/**
 * Safely start a Firestore listener with retry and self-healing logic
 * @param {string} label - descriptive name of the store (for logging)
 * @param {Function} listenFn - the store's listen() function
 * @param {string} [uid] - optional user uid (for user-specific stores)
 * @param {number} [maxRetries=3] - how many retry attempts before terminate()
 */
export async function listenWithRetry(label, listenFn, uid, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await listenFn(uid);
      logger.log(`✅ ${label} listener started successfully`);
      return true;
    } catch (err) {
      const code = err?.code || err?.message || "unknown";
      if (code.includes("already-exists")) {
        logger.warn(
          `⚠️ ${label}: listener conflict (attempt ${attempt}/${maxRetries})`
        );
        // exponential backoff
        await new Promise((r) => setTimeout(r, 300 * attempt));
        continue;
      } else {
        logger.error(`❌ ${label}: failed with error:`, err);
        break;
      }
    }
  }

  // all retries failed → terminate Firestore and try one last time
  try {
    logger.warn(`🧹 ${label}: terminating Firestore to recover session...`);
    const db = getFirestore();
    await terminate(db);
    await new Promise((r) => setTimeout(r, 200));
    await listenFn(uid);
    logger.log(
      `✅ ${label}: listener recovered successfully after terminate()`
    );
    return true;
  } catch (fatalErr) {
    logger.error(`💥 ${label}: failed after terminate():`, fatalErr);
    return false;
  }
}

/**
 * Initialize stores for guest mode (no Firestore listeners).
 * Fetches public data once and injects into stores.
 */
export async function initStoresGuest() {
  /*if (guestInitialized) {
    logger.warning(
      "⚠️ initStoresGuest called but guest data already initialized — skipping."
    );
    return;
  }

  try {
    guestInitialized = true;
    logger.log("🚀 Initializing Guest Mode Stores...");

    // === Fetch data from public cloud function ===
    const url = `https://us-central1-flights-6529b.cloudfunctions.net/getPublicData`;

    // for DEBUG
    //const url = "http://127.0.0.1:5001/flights-6529b/us-central1/getPublicData";

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(
        `Failed to fetch guest data: ${res.status} ${res.statusText}`
      );
    }

    const { flights, appSettings, flightTemplates } = await res.json();

    // === Inject into stores ===
    // Inject Flights
    try {
      FlightsStore.getState().setFlights(flights || []);
      logger.log(`✈️ GuestMode: ${flights?.length || 0} flights loaded`);
    } catch (err) {
      logger.error("❌ GuestMode: Failed to inject flights", err);
    }

    // Inject AppSettings
    try {
      AppsSettingsStore.getState().setSettings(appSettings || {});
      logger.log("⚙️ GuestMode: App settings loaded");
    } catch (err) {
      logger.error("❌ GuestMode: Failed to inject app settings", err);
    }

    // Inject Templates (convert array → keyed object like the store)
    try {
      const templatesObj = {};
      (flightTemplates || []).forEach((tpl) => {
        if (!tpl?.id) return;
        const { id, ...data } = tpl;
        templatesObj[id] = data;
      });

      FlightTemplatesStore.getState().setTemplates(templatesObj);
      logger.log(
        `📦 GuestMode: Loaded ${
          Object.keys(templatesObj).length
        } flight templates`
      );
    } catch (err) {
      logger.error("❌ GuestMode: Failed to inject flight templates", err);
    }

    logger.log("✅ Guest Mode Stores initialized successfully");
  } catch (err) {
    guestInitialized = false;
    logger.error("❌ Failed to initialize guest stores:", err);
  }
    */
}

/**
 * Stop all Firestore listeners and reset state.
 * Called on logout, user change, or app unmount.
 */
export function stopStores() {
  try {
    logger.log("🧹 Stopping all Firestore listeners...");

    // Stop all listeners safely
    //UserFlightsStore.getState().stop?.();
    //FlightsStore.getState().stop?.();
    //BookingsStore.getState().stop?.();
    //PaymentsStore.getState().stop?.();
    //AppsSettingsStore.getState().stop?.();
    //FlightTemplatesStore.getState().stop?.();

    // Reset all store states (if implemented)
    UserStore.getState().reset?.();
    //FlightsStore.getState().reset?.();
    //BookingsStore.getState().reset?.();
    //PaymentsStore.getState().reset?.();
    //AppsSettingsStore.getState().reset?.();

    storesInitialized = false;
    logger.log("✅ All listeners stopped and states reset.");
  } catch (err) {
    logger.error("❌ Error while stopping stores:", err);
  }
}
