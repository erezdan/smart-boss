import React, { useState, useRef } from "react";
import {
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Camera,
  Users,
  BarChart3,
  Briefcase,
  Settings as SettingsIcon,
  Globe,
} from "lucide-react";
import { useLanguage } from "../hooks/useLanguage";
import { drawerData } from "../mocks/mokeData";
import FilterPanel from "./FilterPanel";
import { APP_VERSION } from "../version";

export default function SideDrawer({
  isOpen,
  onClose,
  activeSection,
  onSectionChange,
  desktopMode = false,
}) {
  const { isRTL, language, toggleLanguage } = useLanguage();
  const data = drawerData[language];

  const [alertFilters, setAlertFilters] = useState({});
  const [businessFilters, setBusinessFilters] = useState({});

  // Swipe only for mobile (desktopMode === false)
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = (e) => {
    if (desktopMode) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (desktopMode) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;

    // Horizontal swipe dominant → close (left-to-right)
    if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 80) {
      onClose();
    }
  };

  // Sections list
  const sections = [
    {
      id: "insights",
      icon: TrendingUp,
      label: language === "en" ? "Daily Insights" : "תובנות יומיות",
    },
    {
      id: "alerts",
      icon: AlertTriangle,
      label: language === "en" ? "Alerts" : "התראות",
    },
    {
      id: "vision",
      icon: Camera,
      label: language === "en" ? "Vision AI" : "Vision AI",
    },
    {
      id: "workers",
      icon: Users,
      label: language === "en" ? "Workers" : "עובדים",
    },
    {
      id: "queue",
      icon: BarChart3,
      label: language === "en" ? "Queue Metrics" : "מדדי תור",
    },
    {
      id: "business",
      icon: Briefcase,
      label: language === "en" ? "Business" : "עסק",
    },
    {
      id: "settings",
      icon: SettingsIcon,
      label: language === "en" ? "Settings" : "הגדרות",
    },
  ];

  const getTrendIcon = (trend) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-3 h-3 text-green-400" />;
      case "down":
        return <TrendingDown className="w-3 h-3 text-red-400" />;
      default:
        return <Minus className="w-3 h-3 text-gray-400" />;
    }
  };

  const getSeverityBadge = (severity) => {
    const colors = {
      high: "bg-red-500/20 text-red-300 border-red-500/30",
      medium: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      low: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    };
    return colors[severity] || colors.low;
  };

  // Content per section
  const renderContent = () => {
    switch (activeSection) {
      case "insights":
        return (
          <div className="space-y-4">
            {data.insights.items.map((item, index) => (
              <div
                key={index}
                className="bg-[#141B28] rounded-xl p-4 border border-[#C1A875]/10 hover:border-[#C1A875]/30 transition-colors"
              >
                <div
                  className={`flex ${
                    isRTL ? "flex-row-reverse" : "flex-row"
                  } items-start justify-between mb-2`}
                >
                  <h4 className="text-sm font-medium text-gray-300">
                    {item.label}
                  </h4>
                  {getTrendIcon(item.trend)}
                </div>
                <p className="text-2xl font-bold text-white mb-1">
                  {item.value}
                </p>
                <p className="text-xs text-gray-400">{item.details}</p>
              </div>
            ))}
          </div>
        );

      case "alerts":
        return (
          <div className="space-y-4">
            <FilterPanel
              filters={alertFilters}
              onFilterChange={setAlertFilters}
            />
            {data.alerts.items.map((alert, index) => (
              <div
                key={index}
                className="bg-[#141B28] rounded-xl overflow-hidden border border-[#C1A875]/10 hover:border-[#C1A875]/30 transition-colors"
              >
                <img
                  src={alert.image}
                  alt={alert.title}
                  className="w-full h-40 object-cover"
                />
                <div className="p-4">
                  <div
                    className={`flex ${
                      isRTL ? "flex-row-reverse" : "flex-row"
                    } items-center justify-between mb-2`}
                  >
                    <span
                      className={`text-xs px-2 py-1 rounded-full border ${getSeverityBadge(
                        alert.severity
                      )}`}
                    >
                      {alert.severity}
                    </span>
                    <span className="text-xs text-gray-400">{alert.time}</span>
                  </div>
                  <h4
                    className={`text-sm font-semibold text-white mb-1 ${
                      isRTL ? "text-right" : "text-left"
                    }`}
                  >
                    {alert.title}
                  </h4>
                  <p
                    className={`text-xs text-gray-400 ${
                      isRTL ? "text-right" : "text-left"
                    }`}
                  >
                    {alert.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        );

      case "vision":
        return (
          <div className="space-y-4">
            {data.vision.items.map((camera, index) => (
              <div
                key={index}
                className="bg-[#141B28] rounded-xl overflow-hidden border border-[#C1A875]/10"
              >
                <img
                  src={camera.snapshot}
                  alt={camera.camera}
                  className="w-full h-32 object-cover"
                />
                <div className="p-4">
                  <h4
                    className={`text-sm font-semibold text-white mb-2 ${
                      isRTL ? "text-right" : "text-left"
                    }`}
                  >
                    {camera.camera}
                  </h4>
                  <div className="space-y-1">
                    <div
                      className={`flex ${
                        isRTL ? "flex-row-reverse" : "flex-row"
                      } items-center gap-2`}
                    >
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <p className="text-xs text-gray-300">{camera.activity}</p>
                    </div>
                    <p className="text-xs text-gray-400 ml-4">
                      {camera.patterns}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case "workers":
        return (
          <div className="space-y-3">
            {data.workers.items.map((worker, index) => (
              <div
                key={index}
                className="bg-[#141B28] rounded-xl p-4 border border-[#C1A875]/10"
              >
                <div
                  className={`flex ${
                    isRTL ? "flex-row-reverse" : "flex-row"
                  } items-start justify-between mb-3`}
                >
                  <div>
                    <h4
                      className={`text-base font-semibold text-white ${
                        isRTL ? "text-right" : "text-left"
                      }`}
                    >
                      {worker.name}
                    </h4>
                    <p className="text-xs text-gray-400">{worker.role}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      worker.status === "On duty" || worker.status === "בתפקיד"
                        ? "bg-green-500/20 text-green-300"
                        : "bg-amber-500/20 text-amber-300"
                    }`}
                  >
                    {worker.status}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div
                    className={`flex ${
                      isRTL ? "flex-row-reverse" : "flex-row"
                    } justify-between text-gray-400`}
                  >
                    <span>{language === "en" ? "Location" : "מיקום"}</span>
                    <span className="text-gray-300">{worker.location}</span>
                  </div>
                  <div
                    className={`flex ${
                      isRTL ? "flex-row-reverse" : "flex-row"
                    } justify-between text-gray-400`}
                  >
                    <span>{language === "en" ? "Shift" : "משמרת"}</span>
                    <span className="text-gray-300">{worker.shift}</span>
                  </div>
                  <p
                    className={`text-gray-400 mt-2 pt-2 border-t border-gray-700 ${
                      isRTL ? "text-right" : "text-left"
                    }`}
                  >
                    {worker.notes}
                  </p>
                </div>
              </div>
            ))}
          </div>
        );

      case "queue":
        return (
          <div className="space-y-3">
            {data.queue.items.map((item, index) => (
              <div
                key={index}
                className="bg-[#141B28] rounded-xl p-4 border border-[#C1A875]/10"
              >
                <div
                  className={`flex ${
                    isRTL ? "flex-row-reverse" : "flex-row"
                  } items-center justify-between`}
                >
                  <span className="text-sm font-medium text-white">
                    {item.time}
                  </span>
                  <div
                    className={`flex ${
                      isRTL ? "flex-row-reverse" : "flex-row"
                    } items-center gap-4`}
                  >
                    <div className="text-right">
                      <p className="text-xs text-gray-400">
                        {language === "en" ? "Wait" : "המתנה"}
                      </p>
                      <p className="text-sm font-semibold text-amber-400">
                        {item.wait}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">
                        {language === "en" ? "Customers" : "לקוחות"}
                      </p>
                      <p className="text-sm font-semibold text-blue-400">
                        {item.customers}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case "business":
        return (
          <div className="space-y-4">
            <FilterPanel
              filters={businessFilters}
              onFilterChange={setBusinessFilters}
            />
            {data.business.sections.map((section, index) => (
              <div
                key={index}
                className="bg-[#141B28] rounded-xl p-4 border border-[#C1A875]/10"
              >
                <h4
                  className={`text-sm font-semibold text-white mb-3 ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                >
                  {section.title}
                </h4>
                <div className="space-y-2">
                  {section.items.map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex ${
                        isRTL ? "flex-row-reverse" : "flex-row"
                      } items-start gap-2`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-[#C1A875] mt-1.5 flex-shrink-0" />
                      <p className="text-xs text-gray-300">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case "settings":
        return (
          <div className="space-y-4">
            <div className="bg-[#141B28] rounded-xl p-4 border border-[#C1A875]/10">
              <div
                className={`flex ${
                  isRTL ? "flex-row-reverse" : "flex-row"
                } items-center justify-between mb-2`}
              >
                <div
                  className={`flex ${
                    isRTL ? "flex-row-reverse" : "flex-row"
                  } items-center gap-3`}
                >
                  <Globe className="w-5 h-5 text-[#C1A875]" />
                  <span className="text-sm font-medium text-white">
                    {language === "en" ? "Language" : "שפה"}
                  </span>
                </div>
                <button
                  onClick={toggleLanguage}
                  className="px-4 py-2 bg-[#C1A875] text-[#0A0F18] rounded-lg text-sm font-medium hover:bg-[#B09865] transition-colors"
                >
                  {language === "en" ? "עברית" : "English"}
                </button>
              </div>
            </div>

            <div className="bg-[#141B28] rounded-xl p-4 border border-[#C1A875]/10">
              <h4
                className={`text-sm font-semibold text-white mb-3 ${
                  isRTL ? "text-right" : "text-left"
                }`}
              >
                {language === "en" ? "User Profile" : "פרופיל משתמש"}
              </h4>
              <div className="space-y-2 text-xs">
                <div
                  className={`flex ${
                    isRTL ? "flex-row-reverse" : "flex-row"
                  } justify-between`}
                >
                  <span className="text-gray-400">
                    {language === "en" ? "Name" : "שם"}
                  </span>
                  <span className="text-gray-300">David Cohen</span>
                </div>

                <div
                  className={`flex ${
                    isRTL ? "flex-row-reverse" : "flex-row"
                  } justify-between`}
                >
                  <span className="text-gray-400">
                    {language === "en" ? "Business" : "עסק"}
                  </span>
                  <span className="text-gray-300">Coffee Shop</span>
                </div>

                <div
                  className={`flex ${
                    isRTL ? "flex-row-reverse" : "flex-row"
                  } justify-between`}
                >
                  <span className="text-gray-400">
                    {language === "en" ? "Role" : "תפקיד"}
                  </span>
                  <span className="text-gray-300">
                    {language === "en" ? "Owner" : "בעלים"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#141B28] rounded-xl p-4 border border-[#C1A875]/10">
              <h4
                className={`text-sm font-semibold text-white mb-3 ${
                  isRTL ? "text-right" : "text-left"
                }`}
              >
                {language === "en" ? "Notifications" : "התראות"}
              </h4>
              <div className="space-y-3">
                {[
                  "High Priority Alerts",
                  "Worker Updates",
                  "Daily Summary",
                ].map((item, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      isRTL ? "flex-row-reverse" : "flex-row"
                    } items-center justify-between`}
                  >
                    <span className="text-xs text-gray-300">{item}</span>
                    <div className="w-10 h-5 bg-[#C1A875] rounded-full relative cursor-pointer">
                      <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* App Version */}
            <div className="w-full text-center mt-8 mb-2">
              <span className="mt-20 text-center text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                {"App Version"}: {APP_VERSION}
              </span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ---------- RENDER ----------

  // Desktop mode – no fixed, no backdrop, no X
  if (desktopMode) {
    return (
      <div className="h-full w-full bg-[#0A0F18] flex flex-col">
        {/* === DESKTOP HEADER === */}
        <div className="relative bg-gradient-to-r from-[#0A0F18] to-[#141B28] px-6 py-4 border-b border-[#C1A875]/20">
          {/* Container matching drawer width */}
          <div
            dir="ltr"
            className={`
                        max-w-4xl mx-auto 
                        flex items-center gap-4
                        ${isRTL ? "justify-end" : "justify-start"}
                        flex-row
                      `}
          >
            {isRTL ? (
              <>
                {/* Text */}
                <div className="text-right">
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    SMART BOSS
                  </h1>
                  <p className="text-xs text-gray-400">
                    {language === "en"
                      ? "AI Business Assistant"
                      : "עוזר עסקי AI"}
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

                {/* Text */}
                <div className="text-left">
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    SMART BOSS
                  </h1>
                  <p className="text-xs text-gray-400">
                    {language === "en"
                      ? "AI Business Assistant"
                      : "עוזר עסקי AI"}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* CENTERED SECONDARY TITLE */}
          <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2">
            <h2 className="text-lg font-semibold text-white whitespace-nowrap">
              {sections.find((s) => s.id === activeSection)?.label}
            </h2>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto px-4 py-5 pb-24">
          {renderContent()}
        </div>

        {/* Bottom navigation – centered in desktop */}
        <div
          className="relative w-full bg-[#0C0F14] backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.5)]"
          style={{ paddingBottom: "max(14px, env(safe-area-inset-bottom))" }}
        >
          <div
            className={`h-[56px] overflow-x-auto scrollbar-hide flex items-center gap-1 px-2
              ${isRTL ? "flex-row-reverse" : "flex-row"} justify-center`}
          >
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => onSectionChange(section.id)}
                  className={`relative flex-shrink-0 px-4 py-2.5 flex flex-col items-center justify-center 
                    transition-all duration-200 rounded-lg
                    ${isActive ? "bg-[#C7A96A]/15" : "hover:bg-white/5"}`}
                  title={section.label}
                >
                  <Icon
                    className={`w-[26px] h-[26px] transition-colors duration-200 ${
                      isActive ? "text-[#C7A96A]" : "text-[#A6A7AA]"
                    }`}
                    strokeWidth={1.75}
                  />
                  {isActive && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-5 h-[2.5px] bg-[#C7A96A] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Mobile mode – overlay, slide-in, X button
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Drawer panel */}
      <div
        className={`
          fixed top-0 bottom-0 ${isRTL ? "left-0" : "right-0"}
          w-full bg-[#0A0F18] z-50 transform transition-transform duration-300 ease-out
          ${
            isOpen
              ? "translate-x-0"
              : isRTL
              ? "-translate-x-full"
              : "translate-x-full"
          }
        `}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0A0F18] to-[#141B28] px-5 py-4 border-b border-[#C1A875]/20">
            <div
              className={`flex ${
                isRTL ? "flex-row-reverse" : "flex-row"
              } items-center justify-between`}
            >
              <div>
                <p className="text-xs text-gray-500 mb-0.5">
                  {language === "en"
                    ? "SMART BOSS Analytics"
                    : "SMART BOSS אנליטיקה"}
                </p>
                <h2 className="text-lg font-bold text-white">
                  {sections.find((s) => s.id === activeSection)?.label}
                </h2>
              </div>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg:white/10 bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-5 pb-24">
            {renderContent()}
          </div>

          {/* Bottom navigation – scrollable on mobile, left/right aligned */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-[#0C0F14] backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.5)]"
            style={{ paddingBottom: "max(14px, env(safe-area-inset-bottom))" }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <div
              className={`h-[56px] overflow-x-auto scrollbar-hide flex items-center gap-1 px-2 ${
                isRTL ? "flex-row-reverse" : "flex-row"
              } justify-start`}
            >
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => onSectionChange(section.id)}
                    className={`relative flex-shrink-0 px-4 py-2.5 flex flex-col items-center justify-center 
                      transition-all duration-200 rounded-lg
                      ${isActive ? "bg-[#C7A96A]/15" : "hover:bg-white/5"}`}
                    title={section.label}
                  >
                    <Icon
                      className={`w-[26px] h-[26px] transition-colors duration-200 ${
                        isActive ? "text-[#C7A96A]" : "text-[#A6A7AA]"
                      }`}
                      strokeWidth={1.75}
                    />
                    {isActive && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-5 h-[2.5px] bg-[#C7A96A] rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
