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
  const { isReady } = UserStore();

  const [loading, setLoading] = useState(true);
  const [updatingApp, setUpdatingApp] = useState(false);

  // -----------------------------------------
  // 1. CHECK APP VERSION BEFORE EVERYTHING
  // -----------------------------------------
  useEffect(() => {
    async function checkVersion() {
      const refreshing = await clearAppCacheIfVersionChanged((state) => {
        if (state === "updating") setUpdatingApp(true);
      });

      if (!refreshing) return;
    }
    checkVersion();
  }, []);

  // ----------------------------------------------------
  // 2. AUTHENTICATION FLOW (redirectResult → authState)
  // ----------------------------------------------------
  useEffect(() => {
    let unsub;

    async function initAuth() {
      setLoading(true);

      // TRY REDIRECT RESULT FIRST
      const redirect = await getRedirectResult(auth);

      if (redirect?.user) {
        const u = redirect.user;

        await initUser(u);
        await initStores(u.uid);

        setLoading(false);
        return;
      }

      // THEN FALLBACK TO NORMAL onAuthStateChanged
      unsub = onAuthStateChanged(auth, async (authUser) => {
        if (!authUser) {
          clear();
          stopStores();
          await initStoresGuest();
          setLoading(false);
          return;
        }

        await initUser(authUser);
        await initStores(authUser.uid);
        setLoading(false);
      });
    }

    initAuth();
    return () => unsub && unsub();
  }, [clear, initUser]);

  // ------------------------------------------------------
  // 3. POST-AUTH ROUTING (XOR: onboarding | bubbles | home)
  // ------------------------------------------------------
  useEffect(() => {
    if (loading) return;
    if (!isReady) return;

    const currentUser = auth.currentUser;

    if (!currentUser) {
      if (location.pathname !== "/login") {
        navigate("/login", { replace: true });
      }
      return;
    }

    const hasOnboarded = localStorage.getItem("onboardingCompleted") === "yes";
    const hasCompletedBubbles =
      localStorage.getItem("bubblesSurveyCompleted") === "yes";

    let target = "/home";

    if (!hasOnboarded) target = "/onboarding";
    else if (!hasCompletedBubbles) target = "/bubbles-survey";

    if (location.pathname !== target) {
      navigate(target, { replace: true });
    }
  }, [loading, isReady, location.pathname, navigate]);

  // ------------------------------------------------------
  // 4. RENDER SCREENS
  // ------------------------------------------------------
  if (updatingApp) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A0F18] text-gray-300">
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

  return (
    <Routes>
      <Route path="/home" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/bubbles-survey" element={<BubbleSurveyPage />} />

      <Route path="*" element={<div>Page Not Found</div>} />
    </Routes>
  );
}
