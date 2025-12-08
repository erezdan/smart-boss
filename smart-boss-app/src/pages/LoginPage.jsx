// src/pages/Login.jsx

import React, { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { useLanguage } from "../hooks/useLanguage";
import { auth } from "../lib/firebase";
import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { Plane, Loader2 } from "lucide-react";
import { UserStore } from "../data-access/UserStore";
import { loginWithGoogle, loginWithApple } from "../services/authService";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { t, isRTL } = useLanguage();
  const { initUser } = UserStore.getState();
  const navigate = useNavigate();

  const [authenticating, setAuthenticating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // === DEVELOPMENT AUTO LOGIN ===
  useEffect(() => {
    const isDev = import.meta.env.MODE === "development";
    const devEmail = import.meta.env.VITE_FIREBASE_DEV_LOCALHOST_USER_EMAIL;
    const devPassword = import.meta.env
      .VITE_FIREBASE_DEV_LOCALHOST_USER_PASSWORD;

    if (!isDev || auth.currentUser || !devEmail || !devPassword) {
      return;
    }

    const runAutoLogin = async () => {
      try {
        console.log("🔧 Dev mode: auto-login in progress...");
        setAuthenticating(true);

        const res = await signInWithEmailAndPassword(
          auth,
          devEmail,
          devPassword
        );

        console.log("✅ Dev user logged in:", res.user.uid);
        await initUser(res.user);

        if (location.pathname === "/login") {
          navigate("/home", { replace: true });
        }
      } catch (err) {
        console.warn("⚠️ Dev auto-login failed:", err.message);
        setErrorMsg(t("loginErrorGeneric"));
      } finally {
        setAuthenticating(false);
      }
    };

    runAutoLogin();
  }, [initUser, navigate, t]);

  useEffect(() => {
    // Scroll to top on login page mount
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div
      className="
    min-h-screen
    flex flex-col items-center
    sm:justify-center justify-start
    pt-32 sm:pt-0
    bg-[#0A0F18] px-4
  "
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div
        className="
      flex flex-col items-center gap-6
      px-4 py-8
      bg-[#141B28]/20 backdrop-blur-xl
      rounded-2xl shadow-2xl
      border border-[#C1A875]/10
    "
      >
        {/* Logo */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md"
          style={{ backgroundColor: "#141B28" }}
        >
          <Plane className="w-8 h-8 text-[#C1A875]" />
        </div>

        <h1 className="text-2xl font-bold text-white">{t("loginTitle")}</h1>
        <p className="text-gray-400 text-sm text-center max-w-xs">
          {t("loginSubtitle")}
        </p>

        {errorMsg && (
          <div className="bg-red-900/30 text-red-300 border border-red-500/40 text-sm rounded-md px-3 py-2 mt-2 max-w-xs text-center">
            {errorMsg}
          </div>
        )}

        {/* Buttons */}
        <div className="mt-6 flex flex-col gap-3 w-64">
          <Button
            onClick={loginWithGoogle}
            disabled={authenticating}
            className="bg-[#C1A875] hover:bg-[#B09865] text-[#0A0F18] font-semibold shadow-xl rounded-xl flex items-center gap-2"
          >
            {authenticating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <img
                  src="/icons/google-icon.webp"
                  alt="Google"
                  className="w-5 h-5 bg-white/90 rounded-full p-[2px]"
                />
                <span>{t("loginWithGoogle")}</span>
              </>
            )}
          </Button>

          <Button
            onClick={loginWithApple}
            disabled={authenticating}
            className="bg-[#C1A875] hover:bg-[#B09865] text-[#0A0F18] font-semibold shadow-xl rounded-xl flex items-center gap-2"
          >
            {authenticating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <img
                  src="/icons/apple-icon.webp"
                  alt="Apple"
                  className="w-5 h-5 invert opacity-90"
                />
                <span>{t("loginWithApple")}</span>
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-gray-400 mt-4 text-center max-w-xs">
          {t("loginSafeText")}
        </p>
      </div>
    </div>
  );
}
