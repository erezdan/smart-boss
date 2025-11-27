import logger from "./myLogger";
import { getFirestore, onSnapshot } from "firebase/firestore";

/**
 * Generic, safe Firestore listener helper for Zustand stores.
 * Automatically handles unsubscribe, reattach, and optional "isListening" state flag.
 *
 * @param {Function} set - Zustand set() function
 * @param {Function} get - Zustand get() function
 * @param {Function} createQuery - Function returning a Firestore query or ref
 * @param {Function} handleSnapshot - Function handling Firestore snapshot updates
 * @param {Function} handleError - Optional error handler function
 * @param {Object} [options]
 * @param {string} [options.logPrefix="listener"] - Optional log prefix for debug clarity
 */
export async function safeListen(
  set,
  get,
  createQuery,
  handleSnapshot,
  handleError,
  options = {}
) {
  const { logPrefix = "listener" } = options;

  try {
    await new Promise((resolve, reject) => {
      const run = async () => {
        const state = get();

        // 🟡 Check if store defines "isListening" and skip duplicate listeners if active
        if ("isListening" in state && state.isListening === true) {
          logger.warning(`⚠️ ${logPrefix}: listener already active — skipping`);
          return resolve();
        }

        // 🧹 Safely unsubscribe from any previous listener
        const prevUnsubscribe = state.unsubscribe;
        if (typeof prevUnsubscribe === "function") {
          try {
            prevUnsubscribe();
            // Wait a short delay to allow Firestore to release the connection
            await new Promise((r) => setTimeout(r, 300));
            logger.log(`🧹 ${logPrefix}: previous listener unsubscribed`);
          } catch (unsubErr) {
            logger.warn(`⚠️ ${logPrefix}: failed to unsubscribe`, unsubErr);
          }
        }

        // 🚀 Create and attach a new listener
        const db = getFirestore();
        const queryOrRef = createQuery(db);

        const unsubscribe = onSnapshot(
          queryOrRef,
          (snapshot) => {
            try {
              handleSnapshot(snapshot);
              if ("isListening" in state) set({ isListening: true });
              set({ unsubscribe });
              resolve(); // ✅ Listener successfully attached
            } catch (err) {
              reject(err);
            }
          },
          (error) => {
            logger.error(`❌ ${logPrefix}: onSnapshot failed`, error);
            handleError?.(error);
            set({ unsubscribe: null });
            if ("isListening" in state) set({ isListening: false });
            reject(error);
          }
        );
      };

      // Execute async logic inside a non-async Promise executor
      run().catch(reject);
    });
  } catch (err) {
    // 🔴 Catch any unexpected errors and reset listener flags
    logger.error(`❌ ${logPrefix}: listen() failed`, err);
    set({ unsubscribe: null });
    const state = get();
    if ("isListening" in state) set({ isListening: false });
    throw err;
  }
}
