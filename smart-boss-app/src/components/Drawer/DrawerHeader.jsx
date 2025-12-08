import React from "react";
import { X } from "lucide-react";

/*
props:
- isRTL: boolean
- t: translation function
- activeSection: string
- sections: array of { id, label }
*/
export default function DrawerHeader({
  isRTL,
  t,
  activeSection,
  sections,
  desktopMode = false,
}) {
  const title = sections.find((s) => s.id === activeSection)?.label || "";

  return (
    <div className="bg-gradient-to-r from-[#0A0F18] to-[#141B28] px-5 py-4 border-b border-[#C1A875]/20">
      {/* Header row: Logo + (optional X) */}
      <div
        className={`
          max-w-4xl mx-auto 
          flex items-center justify-between
        `}
      >
        {/* ----------------------------- */}
        {/* Logo + App Name  */}
        {/* ----------------------------- */}
        <div
          className={`flex items-center gap-3 ${
            isRTL ? "flex-row-reverse" : "flex-row"
          }`}
        >
          {isRTL ? (
            <>
              <div className="text-right">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  SMART BOSS
                </h1>
                <p className="text-xs text-gray-400">
                  {t("aiBusinessAssistant")}
                </p>
              </div>

              <img
                src="/images/smart_boss_logo_only-transparent.png"
                alt="Smart Boss Logo"
                className="w-8 h-8 object-contain scale-[1.15]"
              />
            </>
          ) : (
            <>
              <img
                src="/images/smart_boss_logo_only-transparent.png"
                alt="Smart Boss Logo"
                className="w-8 h-8 object-contain scale-[1.15]"
              />

              <div className="text-left">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  SMART BOSS
                </h1>
                <p className="text-xs text-gray-400">
                  {t("aiBusinessAssistant")}
                </p>
              </div>
            </>
          )}
        </div>

        {/* ----------------------------- */}
        {/* TITLE — desktop only          */}
        {/* ----------------------------- */}
        {desktopMode && (
          <div
            className={`mt-2 text-white text-base font-semibold ${
              isRTL ? "text-right" : "text-left"
            }`}
          >
            {title}
          </div>
        )}
      </div>
    </div>
  );
}
