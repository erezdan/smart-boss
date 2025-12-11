import { create } from "zustand";
import { doc, setDoc, getFirestore, serverTimestamp } from "firebase/firestore";
import { userModel } from "../models/user-model";
import logger from "../utiles/myLogger";
import { logAuthProcess } from "../utiles/logAuthProcess";
import { safeListen } from "../utiles/safeListen";

export const UserStore = create((set, get) => ({
  user: null,
  unsubscribe: null,

  /**
   * Initialize and attach user listener.
   * Never fails, never blocks auth, supports new users, refresh, logout/login, and account switch.
   * No getDoc used — always real-time, cache-friendly, offline-safe.
   */
  initUser: async (authUser) => {
    try {
      logAuthProcess("initUser:start");

      const db = getFirestore();
      const uid = authUser.uid;
      const userRef = doc(db, "users", uid);

      console.log("UserStore: initUser for uid:", uid, authUser.email);

      // 1) Prevent duplicate init for same user
      const currentUser = get().user;
      if (currentUser?.auth_data?.uid === uid) {
        return;
      }

      // 2) Stop previous listener (account switch / logout)
      const prevUnsub = get().unsubscribe;
      if (typeof prevUnsub === "function") {
        prevUnsub();
      }
      set({ unsubscribe: null });

      let firstSnapshotHandled = false;

      const unsubscribe = await safeListen(
        set,
        get,

        () => userRef,

        async (docSnap) => {
          try {
            if (!firstSnapshotHandled) {
              firstSnapshotHandled = true;

              // Create missing document
              if (!docSnap.exists()) {
                const initialData = {
                  ...userModel,
                  auth_data: {
                    ...userModel.auth_data,
                    uid,
                    email: authUser.email ?? null,
                    displayName: authUser.displayName ?? "",
                    emailVerified: authUser.emailVerified ?? false,
                    photoURL: authUser.photoURL ?? null,
                  },
                  data: {
                    ...userModel.data,
                    full_name:
                      authUser.email ===
                      import.meta.env.VITE_FIREBASE_DEV_LOCALHOST_USER_EMAIL
                        ? "developer"
                        : authUser.displayName ?? "",
                    email: authUser.email ?? "",
                    created_at: serverTimestamp(),
                  },
                };

                await setDoc(userRef, initialData);
                return; // Firestore sends the new document automatically
              }
            }

            // Merge Firestore doc with userModel to ensure structure completeness
            if (docSnap.exists()) {
              const data = docSnap.data();

              // Ignore incomplete or partial snapshots (prevents blank user state)
              if (!data?.auth_data?.uid) {
                logger.warn("UserStore: ignoring incomplete snapshot");
                return;
              }

              set({ user: { ...userModel, ...data } });
            } else {
              logger.warn(
                "UserStore: snapshot missing — keeping previous state"
              );
            }
          } catch (err) {
            logger.error("UserStore snapshot error:", err);
          }
        },

        (err) => {
          logger.error("UserStore listener error:", err);
        },

        { logPrefix: "UserStore" }
      );

      set({ unsubscribe });

      logAuthProcess("initUser complete (listener active)");
    } catch (err) {
      logger.error("initUser error (ignored):", err);
    }
  },

  /**
   * Clear user data and stop listener.
   * Safe on logout, refresh, or account switch.
   */
  clear: () => {
    try {
      const unsub = get().unsubscribe;
      if (typeof unsub === "function") {
        unsub();
        set({ unsubscribe: null });
      }

      set({ user: null, unsubscribe: null });

      logger.log("UserStore cleared (listener stopped)");
    } catch (err) {
      logger.error("UserStore.clear error:", err);
      set({ user: null, unsubscribe: null });
    }
  },

  /**
   * Update a section inside user document (data, prefs, auth_data).
   */
  updateSection: async (section, updates) => {
    try {
      const db = getFirestore();
      const currentUser = get().user;

      if (!currentUser?.auth_data?.uid) {
        console.warn("updateSection called before user initialized");
        return false;
      }

      const userRef = doc(db, "users", currentUser.auth_data.uid);
      const currentSection = currentUser[section] || {};

      await setDoc(
        userRef,
        { [section]: { ...currentSection, ...updates } },
        { merge: true }
      );

      // Optimistic UI update
      set((state) => ({
        user: {
          ...state.user,
          [section]: { ...currentSection, ...updates },
        },
      }));

      return true;
    } catch (err) {
      logger.error("updateSection failed:", err);
      return false;
    }
  },

  updateData: (updates) => get().updateSection("data", updates),
  updatePrefs: (updates) => get().updateSection("prefs", updates),
}));
