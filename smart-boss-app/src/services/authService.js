// authService.js

import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithRedirect,
  signOut,
} from "firebase/auth";
import { serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { UserStore } from "../data-access/UserStore";
import logger from "../utiles/myLogger";

/**
 * Store the login method in both sessionStorage and localStorage
 * to ensure reliability across all browsers and redirect flows.
 */
export function setLoginMethod(method) {
  try {
    sessionStorage.setItem("loginMethod", method);
  } catch (err) {
    console.warn("⚠️ Unable to store login method in sessionStorage:", err);
  }

  try {
    localStorage.setItem("loginMethod", method);
  } catch (err) {
    console.warn("⚠️ Unable to store login method in localStorage:", err);
  }
}

/**
 * Retrieve and clear the stored login method.
 * Checks sessionStorage first, then localStorage.
 * Returns null if nothing is found.
 */
export function getAndClearLoginMethod() {
  try {
    let method =
      sessionStorage.getItem("loginMethod") ||
      localStorage.getItem("loginMethod");

    if (method) {
      sessionStorage.removeItem("loginMethod");
      localStorage.removeItem("loginMethod");
    }

    return method || null;
  } catch (err) {
    console.warn("⚠️ Unable to read login method:", err);
    return null;
  }
}

/**
 * Handle Google Sign-in.
 * Chooses between popup and redirect based on environment.
 * Always asks user to choose an account (even if only one exists).
 */
export async function loginWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();

    // ✅ Always ask the user to choose account (prevents auto-login confusion)
    provider.setCustomParameters({
      prompt: "select_account", // forces Google account picker
    });

    console.log("📱 PWA detected → using redirect");
    setLoginMethod("redirect");
    await signInWithRedirect(auth, provider);
  } catch (error) {
    logger.error("❌ Google login failed:", error);
  }
}

/**
 * Handle Apple Sign-in.
 * Chooses between popup and redirect based on environment.
 */
export async function loginWithApple() {
  const provider = new OAuthProvider("apple.com");
  provider.addScope("email");
  provider.addScope("name");

  try {
    console.log("📱 PWA detected → using redirect");
    setLoginMethod("redirect");
    await signInWithRedirect(auth, provider);
  } catch (error) {
    logger.error("❌ Apple login failed:", error);
  }
}

/**
 * Handle redirect result for both Google & Apple.
 * Should be called once after app initialization.
 * If login method is provided, updates user's record in Firestore.
 */
export async function handleAuthRedirect(redirectResult, initUser, method) {
  try {
    if (!redirectResult?.user) return;

    const user = redirectResult.user;
    console.log("User logged in after redirect:", user.uid);

    // Initialize user in the app
    if (initUser) await initUser(user);

    // Update Firestore user preferences (only if method exists)
    if (method && db && user?.uid) {
      try {
        const { updateRefs } = UserStore.getState();
        if (typeof updateRefs === "function") {
          await updateRefs({
            prefs: {
              last_login_method: method,
              last_login_time: serverTimestamp(),
            },
          });
          console.log(`📦 Stored login method (${method}) in Firestore`);
        } else {
          console.warn("⚠️ updateRefs not ready, skipping user update");
        }
      } catch (e) {
        console.warn("⚠️ Failed to update user record:", e);
      }
    }
  } catch (error) {
    logger.error("❌ Redirect result error:", error);
  }
}

/**
 * Handles user sign-out and performs full cleanup.
 * Ensures both Firebase and local app state are reset properly,
 * with fallback mechanisms for PWA and Service Worker environments.
 *
 * @param {boolean} [silent=false] - If true, does not trigger navigation or reload after logout.
 * @param {function} [navigate] - Optional React Router navigate() function for smooth redirects.
 * @returns {Promise<boolean>} - True if logout succeeded, false otherwise.
 */
export async function logout(silent = false, navigate) {
  try {
    // 🧹 Step 1: Clear stored login method flags
    sessionStorage.removeItem("loginMethod");
    localStorage.removeItem("loginMethod");

    // 🔐 Step 2: Sign out from Firebase
    await signOut(auth);

    // 🧠 Step 3: Clear Zustand store if available
    const { clear } = UserStore.getState?.() || {};
    if (typeof clear === "function") {
      clear();
      console.log("🧹 Cleared local user store");
    }

    console.log("✅ User successfully signed out");

    // 🚪 Step 4: Redirect user (unless silent mode)
    if (!silent) {
      try {
        if (typeof navigate === "function") {
          // Prefer React Router navigation if available
          console.log("🔁 Redirecting via React Router...");
          navigate("/home", { replace: true });
        } else {
          // Fallback: full reload for PWA/Service Worker consistency
          console.log("🔁 Redirecting via window.location...");
          window.location.href = "/home";
        }
      } catch (navError) {
        console.warn("⚠️ Navigation failed, forcing full reload:", navError);
        window.location.href = "/home";
      }
    }

    return true;
  } catch (error) {
    logger.error("❌ Sign-out failed:", error);

    // 🧯 Step 5: Last-resort fallback for stale sessions
    if (!silent) {
      console.warn("⚠️ Forcing reload to clear stale auth state...");
      setTimeout(() => window.location.reload(), 500);
    }

    return false;
  }
}
