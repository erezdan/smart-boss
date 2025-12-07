import React from "react";

/*
props:
- isRTL: boolean
- t: translation function
- activeSection: string
- sections: array of { id, label }
*/
export default function DrawerHeader({ isRTL, t, activeSection, sections }) {
  const title = sections.find((s) => s.id === activeSection)?.label || "";

  return (
    <div className="bg-gradient-to-r from-[#0A0F18] to-[#141B28] px-5 py-4 border-b border-[#C1A875]/20">
      {/* Header row: Logo + Title + Section Label */}
      <div
        className={`
          max-w-4xl mx-auto 
          flex items-center justify-between
        `}
      >
        {/* ---------------------------------------- */}
        {/* LEFT / RIGHT BLOCK — Logo + App Name     */}
        {/* mirrors your original working RTL logic   */}
        {/* ---------------------------------------- */}
        <div
          className={`flex items-center gap-3 ${
            isRTL ? "flex-row-reverse" : "flex-row"
          }`}
        >
          {/* RTL swaps order manually — perfect control */}
          {isRTL ? (
            <>
              {/* Text block */}
              <div className="text-right">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  SMART BOSS
                </h1>
                <p className="text-xs text-gray-400">
                  {t("aiBusinessAssistant")}
                </p>
              </div>

              {/* Logo */}
              <img
                src="/images/smart_boss_logo_only-transperent.png"
                alt="Smart Boss Logo"
                className="w-8 h-8 object-contain scale-[1.15]"
              />
            </>
          ) : (
            <>
              {/* Logo */}
              <img
                src="/images/smart_boss_logo_only-transperent.png"
                alt="Smart Boss Logo"
                className="w-8 h-8 object-contain scale-[1.15]"
              />

              {/* Text block */}
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

        {/* ---------------------------------------- */}
        {/* SECTION TITLE — moves to opposite side    */}
        {/* ---------------------------------------- */}
        <div
          className={`
    mt-2 text-white text-base font-semibold
    ${isRTL ? "text-right" : "text-left"}
  `}
        >
          {title}
        </div>
      </div>
    </div>
  );
}
