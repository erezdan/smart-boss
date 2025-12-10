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
import { signInWithEmailAndPassword } from "firebase/auth";

/**
 * Store the login method in both sessionStorage and localStorage
 * to ensure reliability across all browsers and redirect flows.
 */
export function setLoginMethod(method) {
  try {
    sessionStorage.setItem("loginMethod", method);
  } catch (err) {
    logger.warning("⚠️ Unable to store login method in sessionStorage:", err);
  }

  try {
    localStorage.setItem("loginMethod", method);
  } catch (err) {
    logger.warning("⚠️ Unable to store login method in localStorage:", err);
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
    logger.warning("⚠️ Unable to read login method:", err);
    return null;
  }
}

/**
 * Generic login handler for Google/Apple with dev override.
 * @param {"google" | "apple"} providerType
 */
export async function loginHandler(providerType) {
  const isDev = import.meta.env.MODE === "development";
  const devEmail = import.meta.env.VITE_FIREBASE_DEV_LOCALHOST_USER_EMAIL;
  const devPassword = import.meta.env.VITE_FIREBASE_DEV_LOCALHOST_USER_PASSWORD;

  // ⭐ DEV MODE → login with email/password instead of redirect
  if (isDev) {
    if (!devEmail || !devPassword) {
      logger.warning("Dev login: missing email/password env vars");
      return;
    }

    sessionStorage.setItem("loginMethod", "redirect");
    localStorage.setItem("loginMethod", "redirect");

    try {
      logger.log("🔧 DEV login via email/password");
      await signInWithEmailAndPassword(auth, devEmail, devPassword);
    } catch (e) {
      logger.error("❌ Dev login failed:", e);
      throw e;
    }
  }

  // ⭐ PRODUCTION → real Google / Apple redirect flows
  if (providerType === "google") return loginWithGoogle();
  if (providerType === "apple") return loginWithApple();

  logger.warning("Unknown provider:", providerType);
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
    logger.log("📱 PWA detected → using redirect");
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
    logger.log("User logged in after redirect:", user.uid);

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
          logger.log(`📦 Stored login method (${method}) in Firestore`);
        } else {
          logger.warning("⚠️ updateRefs not ready, skipping user update");
        }
      } catch (e) {
        logger.warning("⚠️ Failed to update user record:", e);
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
    // Remove login method flags
    sessionStorage.removeItem("loginMethod");
    localStorage.removeItem("loginMethod");

    // Sign out from Firebase Auth
    await signOut(auth);

    // Clear user store safely
    const state = UserStore.getState();
    if (state && typeof state.clear === "function") {
      state.clear();
      logger.log("🧹 Cleared local user store");
    }

    logger.log("✅ User successfully signed out");

    // Handle UI redirection unless silent mode
    if (!silent) {
      try {
        if (typeof navigate === "function") {
          navigate("/login", { replace: true });
        } else {
          window.location.href = "/login";
        }
      } catch (navError) {
        logger.warning("Navigation failed, forcing full reload:", navError);
        window.location.href = "/login";
      }
    }

    return true;
  } catch (error) {
    logger.error("❌ Sign-out failed:", error);

    // Last-resort recovery
    if (!silent) {
      setTimeout(() => window.location.reload(), 500);
    }

    return false;
  }
}
