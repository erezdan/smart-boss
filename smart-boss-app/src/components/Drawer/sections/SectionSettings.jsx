import React from "react";
import { Globe } from "lucide-react";
import { UserStore } from "../../../data-access/UserStore";
import { logout } from "../../../services/authService";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const user = UserStore((s) => s.user);
  const { updatePrefs, updateNotifications, updateData } = UserStore.getState();

  const drawerSwipeRTL = user?.prefs?.drawer_swipe_rtl ?? true;
  const notifications = user?.notifications || {
    high: false,
    worker: false,
    summary: false,
  };

  const updateUserSection = async (section, updates) => {
    switch (section) {
      case "prefs":
        return updatePrefs(updates);

      case "notifications":
        return updateNotifications(updates);

      case "data":
        return updateData(updates);

      default:
        console.warn("Unknown user section:", section);
        return false;
    }
  };

  const toggleDrawerSwipe = async () => {
    await updateUserSection("prefs", {
      drawer_swipe_rtl: !drawerSwipeRTL,
    });
  };

  const toggleNotifications = async (key) => {
    await updateUserSection("notifications", {
      [key]: !notifications[key],
    });
  };

  const updateBusinessName = async (businessName) => {
    await updateUserSection("data", {
      business_name: businessName,
    });
  };

  const updateRole = async (role) => {
    await updateUserSection("data", {
      role,
    });
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
          {/* Full Name */}
          <div
            className={`flex justify-between ${
              isRTL ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <span className="text-gray-400">{t("name")}</span>
            <span className="text-gray-300">{user?.data?.full_name || ""}</span>
          </div>

          {/* Business Name */}
          <div
            className={`flex justify-between ${
              isRTL ? "flex-row-reverse" : "flex-row"
            }`}
            onClick={updateBusinessName}
          >
            <span className="text-gray-400">{t("business")}</span>
            <span className="text-gray-300">
              {user?.data?.business_name || ""}
            </span>
          </div>

          {/* Role */}
          <div
            onClick={updateRole}
            className={`flex justify-between ${
              isRTL ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <span className="text-gray-400">{t("role")}</span>
            <span className="text-gray-300">{t(user?.data?.role) || ""}</span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={() => {
            logout(false, navigate);
          }}
          className="
                      w-full mt-4 py-2
                      text-xs font-semibold
                      rounded-lg
                      bg-red-500/20 text-red-300
                      hover:bg-red-500/30 hover:text-red-200
                      transition-colors
                    "
        >
          {t("logout")}
        </button>
      </div>

      {/* PREFERENCES */}
      <div className="bg-[#141B28] rounded-xl p-4 border border-[#C1A875]/10 hover:border-[#C1A875]/30 transition-colors">
        <h4
          className={`text-sm font-semibold text-white mb-3 ${
            isRTL ? "text-right" : "text-left"
          }`}
        >
          {t("preferences")}
        </h4>

        <div
          className={`flex items-center justify-between ${
            isRTL ? "flex-row-reverse" : "flex-row"
          }`}
        >
          <span className="text-xs text-gray-300">
            {t("drawerSwipeDirection")}
          </span>

          {/* Toggle */}
          <div
            onClick={toggleDrawerSwipe}
            className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${
              drawerSwipeRTL ? "bg-[#C1A875]" : "bg-gray-600"
            }`}
          >
            <div
              className={`
                          absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all
                          ${
                            drawerSwipeRTL
                              ? "right-0.5 left-auto"
                              : "left-0.5 right-auto"
                          }
                        `}
            />
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
                onClick={() => toggleNotifications(item.key)}
                className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${
                  notifications[item.key] ? "bg-[#C1A875]" : "bg-gray-600"
                }`}
              >
                <div
                  className={`
              absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all
              ${
                isRTL
                  ? notifications[item.key]
                    ? "left-0.5 right-auto"
                    : "right-0.5 left-auto"
                  : notifications[item.key]
                  ? "right-0.5 left-auto"
                  : "left-0.5 right-auto"
              }
            `}
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
