import React, { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { usePWAInstall } from "./hooks/usePWAInstall";
import { logAuthProcess } from "./utiles/logAuthProcess";
import logger from "./utiles/myLogger";
import { clearAppCacheIfVersionChanged } from "./utiles/clearAppCache";
import {
  handleAuthRedirect,
  getAndClearLoginMethod,
} from "./services/authService";
import { auth } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  initStores,
  initStoresGuest,
  stopStores,
} from "../src/data-access/initStores";
import { useLanguage } from "./hooks/useLanguage";
import { UserStore } from "./data-access/UserStore";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import OnboardingPage from "./pages/OnboardingPage";
import BubbleSurveyPage from "./pages/BubbleSurveyPage";

// ✅ Pages that must NOT auto-redirect to login
const PUBLIC_PATHS = ["/login"];

function App({ redirectResult }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isRTL, t } = useLanguage();
  const { initUser, clear } = UserStore.getState();

  const [isAuthLoading, setAuthLoading] = useState(true);
  const [updatingApp, setUpdatingApp] = useState(false);

  // Always call the hook (short-circuits internally)
  usePWAInstall();

  // 🚀 Redirect root based on onboarding state
  useEffect(() => {
    if (location.pathname === "/") {
      const hasOnboarded =
        localStorage.getItem("onboardingCompleted") === "yes";

      const hasCompletedBubblesSurvey =
        localStorage.getItem("bubblesSurveyCompleted") === "yes";

      if (hasOnboarded && hasCompletedBubblesSurvey) {
        navigate("/home", { replace: true });
      } else if (hasOnboarded) {
        navigate("/bubbles-survey", { replace: true });
      } else {
        navigate("/onboarding", { replace: true });
      }
    }
  }, [location.pathname, navigate]);

  // ✅ Handle version upgrade BEFORE auth init
  useEffect(() => {
    logAuthProcess("App component mounted", true);

    const checkVersion = async () => {
      const refreshing = await clearAppCacheIfVersionChanged((state) => {
        if (state === "updating") setUpdatingApp(true);
      });

      // 🛑 Stop here if updating — don't run auth yet
      if (refreshing) return;
    };

    checkVersion();
  }, []);

  // ✅ Handle Firebase Auth state changes
  useEffect(() => {
    let unsub = null;
    let redirectHandled = false; // Prevents double initialization

    logAuthProcess("App.jsx useEffect:init");

    // If redirect login is in progress, show loading screen immediately
    if (localStorage.getItem("loginMethod") === "redirect") {
      setAuthLoading(true);
    }

    const initAuth = async () => {
      try {
        const method = getAndClearLoginMethod();
        logAuthProcess("Retrieved login method: " + method);

        // ---------------------------------------
        // 🔵 STEP 1: Handle redirect login FIRST
        // ---------------------------------------
        if (redirectResult?.user) {
          try {
            redirectHandled = true;

            logAuthProcess("Handling redirectResult user...");
            await handleAuthRedirect(redirectResult, initUser, method);
            logAuthProcess("Redirect flow completed");

            // Stop loading only after redirect handled
            setAuthLoading(false);

            return; // Prevent onAuthStateChanged from running too early
          } catch (err) {
            logger.error("Redirect handling failed:", err);
          }
        }
      } catch (err) {
        logger.error("Redirect handling failed (outer):", err);
      }

      // ---------------------------------------
      // 🔵 STEP 2: Fallback — use onAuthStateChanged
      // ---------------------------------------

      // Ensure loading screen is active until auth is resolved
      setAuthLoading(true);

      unsub = onAuthStateChanged(auth, async (authUser) => {
        try {
          // ---------------------------------------
          // USER LOGGED OUT
          // ---------------------------------------
          if (!authUser) {
            logger.log("🚪 User signed out");

            clear();
            logAuthProcess("UserStore cleared");

            stopStores();
            logAuthProcess("Data stores stopped");

            await initStoresGuest();
            logAuthProcess("Guest stores initialized");

            const isPublic = PUBLIC_PATHS.some((path) =>
              location.pathname.startsWith(path)
            );

            if (!isPublic && !redirectHandled) {
              navigate("/login", { replace: true });
              logAuthProcess("Navigated to login (signed out)");
            }

            return;
          }

          // ---------------------------------------
          // USER LOGGED IN
          // ---------------------------------------

          // Prevent duplicate initialization after redirect handling
          if (redirectHandled) {
            logAuthProcess(
              "Skipping onAuthStateChanged (redirect already handled)"
            );
            return;
          }

          logger.log("✅ User authenticated:", authUser.uid);
          logAuthProcess("onAuthStateChanged: user signed in " + authUser.uid);

          // Init user document in Firestore
          await initUser(authUser);
          logAuthProcess("UserStore initialized");

          // Init all data stores
          await initStores(authUser.uid);
          logAuthProcess("Data stores initialized");

          // Determine redirect destination
          const redirectTo = new URLSearchParams(location.search).get(
            "redirectTo"
          );

          if (
            location.pathname !== "/onboarding" &&
            location.pathname !== "/bubbles-survey"
          ) {
            navigate("/home", { replace: true });
            logAuthProcess(`Navigated after login to ${redirectTo || "/home"}`);
          } else {
            logAuthProcess("Skipping auto-redirect (payment return)");
          }
        } catch (err) {
          logger.error("❌ Auth state handling error:", err);
        } finally {
          // Always remove loading when flow is fully complete
          setAuthLoading(false);
          logAuthProcess("Auth state change handling complete");
        }
      });
    };

    initAuth();

    return () => {
      if (unsub) unsub();
    };
  }, [
    clear,
    initUser,
    location.pathname,
    navigate,
    redirectResult,
    updatingApp,
    location.search,
  ]);

  // ✅ Show "Updating" screen (Smart Boss styling)
  if (updatingApp) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A0F18] text-gray-300">
        {/* Logo */}
        <img
          src="/images/smart_boss_logo_only-transparent.png"
          alt="Smart Boss Logo"
          className="w-20 h-20 mb-6 animate-pulse opacity-90"
        />

        {/* Title */}
        <div className="text-xl font-semibold animate-pulse text-[#C1A875]">
          {t("appUpdatingTitle")}
        </div>

        {/* Subtitle */}
        <div className="text-sm text-gray-400 animate-pulse mt-1">
          {t("appUpdatingSubtitle")}
        </div>
      </div>
    );
  } else if (isAuthLoading) {
    return (
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="flex flex-col items-center justify-center min-h-screen bg-[#0A0F18] text-gray-300"
      >
        <img
          src="/images/smart_boss_logo_only-transparent.png"
          alt="Smart Boss Logo"
          className="w-16 h-16 mb-4 animate-pulse opacity-90"
          draggable="false"
        />

        <span className="text-lg font-medium tracking-wide animate-pulse text-[#C1A875]">
          {t("loadingTitle")}
        </span>

        <span className="text-sm text-gray-400 mt-2 animate-pulse">
          {t("loadingSubtitle")}
        </span>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/bubbles-survey" element={<BubbleSurveyPage />} />

      {/* 404 fallback */}
      <Route path="*" element={<div>Page Not Found</div>} />
    </Routes>
  );
}

export default App;
