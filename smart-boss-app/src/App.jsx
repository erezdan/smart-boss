// src/App.jsx
import React, { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { getRedirectResult, onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";

import { UserStore } from "./data-access/UserStore";
import {
  initStores,
  initStoresGuest,
  stopStores,
} from "./data-access/initStores";

import { clearAppCacheIfVersionChanged } from "./utiles/clearAppCache";
import { useLanguage } from "./hooks/useLanguage";
import { logAuthProcess } from "./utiles/logAuthProcess";
import logger from "./utiles/myLogger";

import ErrorBoundary from "./components/ErrorBoundary";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import OnboardingPage from "./pages/OnboardingPage";
import BubbleSurveyPage from "./pages/BubbleSurveyPage";

const PUBLIC_PATHS = ["/login", "/onboarding", "/bubbles-survey"];

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, isRTL } = useLanguage();

  const initUser = UserStore.getState().initUser;
  const clear = UserStore.getState().clear;

  const [loadingAuth, setLoadingAuth] = useState(true);
  const [updatingApp, setUpdatingApp] = useState(false);

  // ------------------------------------------------------
  // 1. Version check
  // ------------------------------------------------------
  useEffect(() => {
    async function checkVersion() {
      try {
        const refreshing = await clearAppCacheIfVersionChanged((state) => {
          if (state === "updating") setUpdatingApp(true);
        });

        if (refreshing) {
          logAuthProcess("App: version change detected, refreshing", true);
          return;
        }
      } catch (err) {
        logger.error("checkVersion error:", err);
        setUpdatingApp(false);
      }
    }

    checkVersion();
  }, []);

  // ------------------------------------------------------
  // 2. Auth handling (same structure as Flyter)
  // ------------------------------------------------------
  useEffect(() => {
    let unsub;

    async function startAuthFlow() {
      logAuthProcess("App: startAuthFlow", true);
      setLoadingAuth(true);

      try {
        // Step A: redirect result
        const redirect = await getRedirectResult(auth);

        if (redirect?.user) {
          const u = redirect.user;
          logAuthProcess("App: redirect user " + u.uid, true);

          await initUser(u);
          await initStores(u.uid);

          setLoadingAuth(false);
          return;
        }

        // Step B: standard listener
        unsub = onAuthStateChanged(auth, async (authUser) => {
          try {
            if (!authUser) {
              logAuthProcess("onAuthStateChanged: signed out", true);

              clear();
              stopStores();
              await initStoresGuest();

              setLoadingAuth(false);
              return;
            }

            logAuthProcess(
              "onAuthStateChanged: signed in " + authUser.uid,
              true
            );

            await initUser(authUser);
            await initStores(authUser.uid);

            setLoadingAuth(false);
          } catch (err) {
            logger.error("onAuthStateChanged error:", err);
            clear();
            stopStores();
            await initStoresGuest();
            setLoadingAuth(false);
          }
        });
      } catch (err) {
        logger.error("startAuthFlow error:", err);
        clear();
        stopStores();
        await initStoresGuest();
        setLoadingAuth(false);
      }
    }

    startAuthFlow();

    return () => {
      if (unsub) unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------------------------------------------------
  // 3. Post-auth routing logic (fixed, no Hebrew in code)
  // ------------------------------------------------------
  useEffect(() => {
    if (loadingAuth) return;

    const currentUser = auth.currentUser;
    const path = location.pathname;

    const hasOnboarded = localStorage.getItem("onboardingCompleted") === "yes";
    const hasCompletedBubbles =
      localStorage.getItem("bubblesSurveyCompleted") === "yes";

    // -----------------------------------------
    // A: no user logged in
    // -----------------------------------------
    if (!currentUser) {
      // First: onboarding
      if (!hasOnboarded && path !== "/onboarding") {
        navigate("/onboarding", { replace: true });
        return;
      }

      // Second: bubble survey
      if (hasOnboarded && !hasCompletedBubbles && path !== "/bubbles-survey") {
        navigate("/bubbles-survey", { replace: true });
        return;
      }

      // After both — only public pages allowed while logged out
      const allowed = PUBLIC_PATHS.some((p) => path.startsWith(p));

      if (!allowed) {
        navigate("/login", { replace: true });
      }

      return;
    }

    // -----------------------------------------
    // B: user IS logged in
    // -----------------------------------------

    // Still need onboarding?
    if (!hasOnboarded && path !== "/onboarding") {
      navigate("/onboarding", { replace: true });
      return;
    }

    // Need bubble survey?
    if (hasOnboarded && !hasCompletedBubbles && path !== "/bubbles-survey") {
      navigate("/bubbles-survey", { replace: true });
      return;
    }

    // If logged in and on login or root → go home
    if (path === "/" || path === "/login") {
      navigate("/home", { replace: true });
      return;
    }
  }, [loadingAuth, location.pathname, navigate]);

  // ------------------------------------------------------
  // 4. Render gates
  // ------------------------------------------------------
  if (updatingApp) {
    return (
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="flex flex-col items-center justify-center min-h-screen bg-[#0A0F18] text-gray-300"
      >
        <img
          src="/images/smart_boss_logo_only-transparent.png"
          className="w-20 h-20 mb-6 animate-pulse opacity-90"
        />
        <div className="text-xl font-semibold text-[#C1A875] animate-pulse">
          {t("appUpdatingTitle")}
        </div>
        <div className="text-sm text-gray-400 animate-pulse mt-1">
          {t("appUpdatingSubtitle")}
        </div>
      </div>
    );
  }

  if (loadingAuth) {
    return (
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="flex flex-col items-center justify-center min-h-screen bg-[#0A0F18] text-gray-300"
      >
        <img
          src="/images/smart_boss_logo_only-transparent.png"
          className="w-16 h-16 mb-4 animate-pulse opacity-90"
        />
        <div className="text-lg font-medium text-[#C1A875] animate-pulse">
          {t("loadingTitle")}
        </div>
        <div className="text-sm text-gray-400 animate-pulse mt-2">
          {t("loadingSubtitle")}
        </div>
      </div>
    );
  }

  // ------------------------------------------------------
  // 5. Routes
  // ------------------------------------------------------
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/home" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/bubbles-survey" element={<BubbleSurveyPage />} />

        <Route path="/" element={<Navigate to="/home" replace />} />

        <Route path="*" element={<div>Page Not Found</div>} />
      </Routes>
    </ErrorBoundary>
  );
}
