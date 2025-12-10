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
import { handleAuthRedirect } from "./services/authService";
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

function App({ redirectResult }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isRTL, t } = useLanguage();
  const initUser = UserStore.getState().initUser;
  const clear = UserStore.getState().clear;
  const { user, isReady } = UserStore();

  const [isAuthLoading, setAuthLoading] = useState(true);
  const [updatingApp, setUpdatingApp] = useState(false);

  // Always call the hook (short-circuits internally)
  usePWAInstall();

  // 🚀 Redirect root based on onboarding state
  useEffect(() => {
    if (!user || !isReady) return;

    const hasOnboarded = localStorage.getItem("onboardingCompleted") === "yes";

    const hasCompletedBubbles =
      localStorage.getItem("bubblesSurveyCompleted") === "yes";

    let target = "/home";

    if (!hasOnboarded) target = "/onboarding";
    else if (!hasCompletedBubbles) target = "/bubbles-survey";

    if (location.pathname !== target) {
      navigate(target, { replace: true });
    }
  }, [user, isReady, navigate, location.pathname]);

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

    const method =
      sessionStorage.getItem("loginMethod") ||
      localStorage.getItem("loginMethod");

    // If redirect login is in progress, show loading screen immediately
    if (method === "redirect") {
      setAuthLoading(true);
    }

    const initAuth = async () => {
      try {
        // ---------------------------------------
        // 🔵 STEP 1: Handle redirect login FIRST
        // ---------------------------------------
        if (redirectResult?.user) {
          try {
            redirectHandled = true;

            logAuthProcess("Handling redirectResult user...");
            await handleAuthRedirect(redirectResult, initUser, method);
            logAuthProcess("Redirect flow completed");

            sessionStorage.removeItem("loginMethod");
            localStorage.removeItem("loginMethod");

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
          if (redirectHandled) {
            logAuthProcess(
              "Skipping onAuthStateChanged because redirect already handled"
            );
            return;
          }

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

            return;
          }

          // ---------------------------------------
          // USER LOGGED IN
          // ---------------------------------------
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

          if (redirectTo) {
            logAuthProcess("Redirecting to: " + redirectTo);
            navigate(redirectTo, { replace: true });
          } else if (
            location.pathname === "/onboarding" ||
            location.pathname === "/bubbles-survey"
          ) {
            logAuthProcess("Skipping auto-redirect (onboarding flow)");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clear, initUser, navigate, redirectResult]);

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
