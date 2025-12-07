import React, { useState } from "react";
import { Globe } from "lucide-react";
/*
props:
- isRTL: boolean
- t: translation function
- toggleLanguage: function
- APP_VERSION: string
*/

export default function SectionSettings({
  isRTL,
  t,
  toggleLanguage,
  APP_VERSION,
}) {
  const [notificationSettings, setNotificationSettings] = useState({
    high: true,
    worker: false,
    summary: true,
  });

  const toggleSetting = (key) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="space-y-4">
      {/* LANGUAGE BLOCK */}
      <div className="bg-[#141B28] rounded-xl p-4 border border-[#C1A875]/10 hover:border-[#C1A875]/30 transition-colors">
        <div
          className={`
            flex items-center justify-between mb-2
            ${isRTL ? "flex-row-reverse" : "flex-row"}
          `}
        >
          {/* Icon + Label */}
          <div
            className={`
              flex items-center gap-3
              ${isRTL ? "flex-row-reverse" : "flex-row"}
            `}
          >
            <Globe className="w-5 h-5 text-[#C1A875]" />
            <span className="text-sm font-medium text-white">
              {t("language")}
            </span>
          </div>

          {/* Toggle Button */}
          <button
            onClick={toggleLanguage}
            className="
              px-4 py-2 bg-[#C1A875] text-[#0A0F18] rounded-lg
              text-sm font-medium hover:bg-[#B09865] transition-colors
            "
          >
            {t("languageToggle")}
          </button>
        </div>
      </div>

      {/* USER PROFILE */}
      <div className="bg-[#141B28] rounded-xl p-4 border border-[#C1A875]/10 hover:border-[#C1A875]/30 transition-colors">
        <h4
          className={`text-sm font-semibold text-white mb-3 ${
            isRTL ? "text-right" : "text-left"
          }`}
        >
          {t("userProfile")}
        </h4>

        <div className="space-y-2 text-xs">
          {/* Name */}
          <div
            className={`
              flex justify-between
              ${isRTL ? "flex-row-reverse" : "flex-row"}
            `}
          >
            <span className="text-gray-400">{t("name")}</span>
            <span className="text-gray-300">David Cohen</span>
          </div>

          {/* Business */}
          <div
            className={`
              flex justify-between
              ${isRTL ? "flex-row-reverse" : "flex-row"}
            `}
          >
            <span className="text-gray-400">{t("business")}</span>
            <span className="text-gray-300">Coffee Shop</span>
          </div>

          {/* Role */}
          <div
            className={`
              flex justify-between
              ${isRTL ? "flex-row-reverse" : "flex-row"}
            `}
          >
            <span className="text-gray-400">{t("role")}</span>
            <span className="text-gray-300">{t("owner")}</span>
          </div>
        </div>
      </div>

      {/* NOTIFICATIONS */}
      <div className="bg-[#141B28] rounded-xl p-4 border border-[#C1A875]/10 hover:border-[#C1A875]/30 transition-colors">
        <h4
          className={`text-sm font-semibold text-white mb-3 ${
            isRTL ? "text-right" : "text-left"
          }`}
        >
          {t("notifications")}
        </h4>

        <div className="space-y-3">
          {[
            { key: "high", label: "High Priority Alerts" },
            { key: "worker", label: "Worker Updates" },
            { key: "summary", label: "Daily Summary" },
          ].map((item) => (
            <div
              key={item.key}
              className={`flex items-center justify-between ${
                isRTL ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <span className="text-xs text-gray-300">{item.label}</span>

              {/* Toggle */}
              <div
                onClick={() => toggleSetting(item.key)}
                className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${
                  notificationSettings[item.key]
                    ? "bg-[#C1A875]"
                    : "bg-gray-500"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                    notificationSettings[item.key]
                      ? isRTL
                        ? "translate-x-0"
                        : "translate-x-[20px]"
                      : isRTL
                      ? "translate-x-[20px]"
                      : "translate-x-0"
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* VERSION */}
      <div className="w-full text-center mt-8 mb-2">
        <span className="text-gray-500 text-sm">
          {t("appVersion")}: {APP_VERSION}
        </span>
      </div>
    </div>
  );
}
