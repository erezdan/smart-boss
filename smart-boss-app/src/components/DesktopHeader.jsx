import React from "react";
import { useLanguage } from "../hooks/useLanguage";

export default function DesktopHeader() {
  const { t, isRTL, toggleLanguage } = useLanguage();

  return (
    <div
      className={`
        hidden md:flex 
        w-full h-[70px]
        items-center justify-between
        px-6
        bg-[#0A0F18] 
        border-b border-gray-800
        fixed top-0 left-0 right-0 z-40
      `}
    >
      {/* Left side / Right side depends on RTL */}
      <div
        className={`flex items-center gap-3 ${
          isRTL ? "flex-row-reverse" : "flex-row"
        }`}
      >
        <img
          src="/images/smartboss_logo.png"
          alt="Smart Boss Logo"
          className="w-10 h-10 object-contain"
        />
        <h1 className="text-white font-semibold text-lg">SMART BOSS</h1>
      </div>

      {/* Language toggle */}
      <button
        onClick={toggleLanguage}
        className="px-4 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition"
      >
        {t("languageToggle")}
      </button>
    </div>
  );
}
