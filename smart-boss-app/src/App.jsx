import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
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
import logger from "./utiles/myLogger";

import ErrorBoundary from "./components/ErrorBoundary";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import OnboardingPage from "./pages/OnboardingPage";
import BubbleSurveyPage from "./pages/BubbleSurveyPage";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, isRTL } = useLanguage();

  const initUser = UserStore.getState().initUser;
  const clear = UserStore.getState().clear;

  const [loading, setLoading] = useState(true);
  const [updatingApp, setUpdatingApp] = useState(false);

  // ------------------------------------------------------
  // 1. Check app version
  // ------------------------------------------------------
  useEffect(() => {
    async function checkVersion() {
      try {
        const refreshing = await clearAppCacheIfVersionChanged((state) => {
          if (state === "updating") setUpdatingApp(true);
        });

        if (!refreshing) return;
      } catch {
        setUpdatingApp(false);
      }
    }

    checkVersion();
  }, []);

  // ------------------------------------------------------
  // 2. Authentication handling
  // ------------------------------------------------------
  useEffect(() => {
    let unsub;

    async function startAuthFlow() {
      setLoading(true);

      try {
        // Step A: Try redirect result
        const redirect = await getRedirectResult(auth);

        if (redirect?.user) {
          const u = redirect.user;
          await initUser(u);
          await initStores(u.uid);
          setLoading(false);
          return;
        }

        // Step B: Standard auth listener
        unsub = onAuthStateChanged(auth, async (authUser) => {
          try {
            if (!authUser) {
              // guest mode
              clear();
              stopStores();
              await initStoresGuest();
              setLoading(false);
              return;
            }

            await initUser(authUser);
            await initStores(authUser.uid);
            setLoading(false);
          } catch (err) {
            logger.error("onAuthStateChanged error:", err);
            clear();
            stopStores();
            await initStoresGuest();
            setLoading(false);
          }
        });
      } catch (err) {
        logger.error("startAuthFlow error:", err);
        clear();
        stopStores();
        await initStoresGuest();
        setLoading(false);
      }
    }

    startAuthFlow();
    return () => unsub && unsub();
  }, [initUser, clear]);

  // ------------------------------------------------------
  // 3. Routing logic AFTER auth resolved
  // ------------------------------------------------------
  useEffect(() => {
    if (loading) return; // do nothing until auth is resolved

    const currentUser = auth.currentUser;

    // Case 1: user is not authenticated
    if (!currentUser) {
      navigate("/login", { replace: true });
      return;
    }

    // Case 2: user logged in but at "/"
    if (location.pathname === "/") {
      navigate("/home", { replace: true });
      return;
    }

    // Case 3: onboarding
    const hasOnboarded = localStorage.getItem("onboardingCompleted") === "yes";

    if (!hasOnboarded && location.pathname !== "/onboarding") {
      navigate("/onboarding", { replace: true });
      return;
    }

    // Case 4: bubble survey
    const hasCompletedBubbles =
      localStorage.getItem("bubblesSurveyCompleted") === "yes";

    if (!hasCompletedBubbles && location.pathname !== "/bubbles-survey") {
      navigate("/bubbles-survey", { replace: true });
      return;
    }

    // Everything OK → allow page to render normally
  }, [loading, location.pathname, navigate]);

  // ------------------------------------------------------
  // 4. Render control (no flashes!)
  // ------------------------------------------------------

  // Case A: App is updating → block UI
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

  // Case B: Auth not resolved → block UI (no blank screen)
  if (loading) {
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
  // 5. Actual content
  // ------------------------------------------------------
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/home" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/bubbles-survey" element={<BubbleSurveyPage />} />

        <Route path="*" element={<div>Page Not Found</div>} />
      </Routes>
    </ErrorBoundary>
  );
}
