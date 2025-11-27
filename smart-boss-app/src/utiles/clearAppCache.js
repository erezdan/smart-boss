import { getFirestore, terminate } from "firebase/firestore";
import { APP_CACHE_VERSION } from "../version";
import logger from "../utiles/myLogger";

// Prevent double execution in-memory
let isClearing = false;

/**
 * Clears Firestore, IndexedDB and browser caches
 * when APP_CACHE_VERSION changes.
 * This should only be incremented when data structure changes
 * require a full cache reset.
 */
export async function clearAppCacheIfVersionChanged(onStateChange) {
  try {
    // Prevent infinite refresh loop
    if (sessionStorage.getItem("updating_cache_version") === "true") {
      console.warn("⚠️ Already updating — skipping refresh cycle");
      return true;
    }

    if (isClearing) {
      console.warn("⚠️ Cache clear already running — skip");
      return false;
    }

    const currentCacheVersion = APP_CACHE_VERSION;
    const savedCacheVersion = localStorage.getItem("app_cache_version");

    if (savedCacheVersion !== currentCacheVersion) {
      isClearing = true;

      console.log(
        "🧹 Detected new cache version:",
        currentCacheVersion,
        "→ clearing cache"
      );

      sessionStorage.setItem("updating_cache_version", "true");
      if (typeof onStateChange === "function") onStateChange("updating");

      // Terminate Firestore
      try {
        const db = getFirestore();
        await terminate(db);
        console.log("✅ Firestore terminated successfully");
      } catch (e) {
        console.warn(
          "⚠️ Firestore not initialized or already terminated:",
          e?.message
        );
      }

      // Delete IndexedDB (skip Auth DBs)
      try {
        const dbs = await window.indexedDB?.databases();
        if (dbs?.length) {
          await Promise.allSettled(
            dbs
              .filter(
                (db) =>
                  db.name?.startsWith("firestore/") ||
                  db.name?.includes("flights-6529b")
              )
              .map((db) => window.indexedDB.deleteDatabase(db.name))
          );
        }
        console.log("✅ Cleaned IndexedDB safely");
      } catch (e) {
        console.warn("⚠️ IndexedDB cleanup warning:", e?.message);
      }

      // Delete caches
      try {
        const cacheNames = await caches.keys();
        await Promise.allSettled(cacheNames.map((name) => caches.delete(name)));
        console.log("✅ Browser caches cleared");
      } catch (e) {
        console.warn("⚠️ Cache cleanup warning:", e?.message);
      }

      // Save new cache version
      try {
        localStorage.setItem("app_cache_version", currentCacheVersion);
      } catch (e) {
        console.warn("⚠️ Could not save app_cache_version:", e?.message);
      }

      console.info(
        `✅ App cache version ${currentCacheVersion} active and clean.`
      );

      if (localStorage.getItem("loginMethod") !== "redirect") {
        setTimeout(() => {
          try {
            const cleanupFn = () =>
              sessionStorage.removeItem("updating_cache_version");
            window.addEventListener("beforeunload", cleanupFn);
            window.location.reload();
          } catch (reloadError) {
            console.warn("⚠️ Reload failed, redirecting to root:", reloadError);
            window.location.href = "/";
          }
        }, 250);
      }

      return true;
    }
  } catch (err) {
    logger.error("Cache cleanup failed:", err);
  } finally {
    if (isClearing) {
      isClearing = false;
      setTimeout(() => {
        sessionStorage.removeItem("updating_cache_version");
      }, 2000);
    }
  }

  return false;
}
