import React, {
  useState,
  useRef,
  Suspense,
  lazy,
  useMemo,
  useCallback,
} from "react";
import { X } from "lucide-react";
import {
  AlertTriangle,
  Camera,
  Users,
  BarChart3,
  Briefcase,
  TrendingUp,
  TrendingDown,
  Settings as SettingsIcon,
  Minus,
} from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage";
import { drawerData } from "../../mocks/mokeData";
import { APP_VERSION } from "../../version";
import { UserStore } from "../../data-access/UserStore";

// New sub components
import DrawerHeader from "./DrawerHeader";
import DrawerSectionList from "./DrawerSectionList";

/* Lazy load all sections */
const SectionInsights = lazy(() => import("./sections/SectionInsights"));
const SectionAlerts = lazy(() => import("./sections/SectionAlerts"));
const SectionVision = lazy(() => import("./sections/SectionVision"));
const SectionWorkers = lazy(() => import("./sections/SectionWorkers"));
const SectionQueue = lazy(() => import("./sections/SectionQueue"));
const SectionBusiness = lazy(() => import("./sections/SectionBusiness"));
const SectionSettings = lazy(() => import("./sections/SectionSettings"));

const SWIPE_THRESHOLD = 80;

export default function SideDrawer({
  isOpen,
  onClose,
  activeSection,
  onSectionChange,
  desktopMode = false,
}) {
  const { isRTL, language, t, toggleLanguage } = useLanguage();
  const data = drawerData[language];
  const user = UserStore((s) => s.user);

  const [alertFilters, setAlertFilters] = useState({});
  const [businessFilters, setBusinessFilters] = useState({});

  /* Touch for mobile */
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const getTrendIcon = (trend) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const isSwipeRTL = user?.prefs?.drawer_swipe_rtl ?? true;

  const handleTouchStart = (e) => {
    if (desktopMode) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (desktopMode) return;
    if (!isOpen) return; // Guard: drawer closed → ignore

    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;

    // Ignore vertical swipes
    if (Math.abs(dx) <= Math.abs(dy)) return;

    const isSwipeRTL = user?.prefs?.drawer_swipe_rtl ?? true;

    const shouldClose = isSwipeRTL
      ? dx > SWIPE_THRESHOLD // RTL: close L → R
      : dx < -SWIPE_THRESHOLD; // LTR: close R → L

    if (shouldClose) {
      onClose();
    }
  };

  /* Build sections list */
  const sections = useMemo(
    () => [
      { id: "insights", icon: TrendingUp, label: t("dailyInsights") },
      { id: "alerts", icon: AlertTriangle, label: t("alerts") },
      { id: "vision", icon: Camera, label: t("visionAI") },
      { id: "workers", icon: Users, label: t("workers") },
      { id: "queue", icon: BarChart3, label: t("queueMetrics") },
      { id: "business", icon: Briefcase, label: t("business") },
      { id: "settings", icon: SettingsIcon, label: t("settings") },
    ],
    [t]
  );

  /* Render content */
  const renderContent = useCallback(() => {
    try {
      switch (activeSection) {
        case "insights":
          return (
            <SectionInsights
              data={{
                ...data.insights,
                items: data.insights.items.map((item) => ({
                  ...item,
                  trendIcon: getTrendIcon(item.trend),
                })),
              }}
              isRTL={isRTL}
              t={t}
            />
          );

        case "alerts":
          return (
            <SectionAlerts
              data={data.alerts}
              filters={alertFilters}
              setFilters={setAlertFilters}
              isRTL={isRTL}
              t={t}
            />
          );

        case "vision":
          return <SectionVision data={data.vision} isRTL={isRTL} t={t} />;

        case "workers":
          return <SectionWorkers data={data.workers} isRTL={isRTL} t={t} />;

        case "queue":
          return <SectionQueue data={data.queue} isRTL={isRTL} t={t} />;

        case "business":
          return (
            <SectionBusiness
              data={data.business}
              filters={businessFilters}
              setFilters={setBusinessFilters}
              isRTL={isRTL}
              t={t}
            />
          );

        case "settings":
          return (
            <SectionSettings
              isRTL={isRTL}
              t={t}
              toggleLanguage={toggleLanguage}
              APP_VERSION={APP_VERSION}
            />
          );

        default:
          return null;
      }
    } catch (err) {
      console.error("SideDrawer renderContent error:", err);
      return <div className="text-red-400 p-4">Failed to load section.</div>;
    }
  }, [
    activeSection,
    data,
    isRTL,
    t,
    toggleLanguage,
    alertFilters,
    businessFilters,
  ]);

  /* ===========================================================
     ======================= DESKTOP MODE =======================
     =========================================================== */
  if (desktopMode) {
    return (
      <div className="h-full w-full bg-[#0A0F18] flex flex-col">
        {/* Header */}
        <DrawerHeader
          isRTL={isRTL}
          t={t}
          activeSection={activeSection}
          sections={sections}
          desktopMode={true}
        />

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-5 pb-24">
          <Suspense fallback={<div className="text-white">Loading…</div>}>
            {renderContent()}
          </Suspense>
        </div>

        {/* Bottom navigation */}
        <DrawerSectionList
          sections={sections}
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          isRTL={isRTL}
          desktopMode={true}
        />
      </div>
    );
  }

  /* ===========================================================
   ======================== MOBILE MODE =======================
   =========================================================== */
  return (
    <>
      {!desktopMode && isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      <div
        className={`
        fixed top-0 bottom-0 ${isSwipeRTL ? "right-0" : "left-0"}
        w-full bg-[#0A0F18] z-50 transform transition-transform duration-300
        ${
          isOpen
            ? "translate-x-0"
            : isSwipeRTL
            ? "translate-x-full" // hide to the right in RTL
            : "-translate-x-full" // hide to the left in LTR
        }
      `}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="h-full flex flex-col">
          {/* ============================
            1) DrawerHeader – Logo only
           ============================ */}
          <DrawerHeader
            isRTL={isRTL}
            t={t}
            activeSection={activeSection}
            sections={sections}
            desktopMode={false}
          />

          {/* ============================
            2) TITLE – mobile
           ============================ */}
          <div
            className={`
                        flex items-center justify-between
                        px-4 pt-5 pb-1
                        ${isRTL ? "flex-row-reverse" : "flex-row"}
                      `}
          >
            <div
              className={`
                          text-white text-base font-semibold
                          ${isRTL ? "text-right" : "text-left"}
                        `}
            >
              {sections.find((s) => s.id === activeSection)?.label}
            </div>

            {/* ----------------------------- */}
            {/* X BUTTON — only mobile        */}
            {/* ----------------------------- */}
            {!desktopMode && (
              <button
                onClick={onClose}
                className="
              w-10 h-10 rounded-full bg-white/10 hover:bg-white/20
              flex items-center justify-center transition-colors
            "
              >
                <X className="w-5 h-5 text-white" />
              </button>
            )}
          </div>

          {/* ============================
            3) Drawer content
           ============================ */}
          <div className="flex-1 overflow-y-auto px-4 py-5 pb-24">
            <Suspense fallback={<div className="text-white">Loading…</div>}>
              {renderContent()}
            </Suspense>
          </div>

          {/* ============================
            4) Bottom navigation
           ============================ */}
          <DrawerSectionList
            sections={sections}
            activeSection={activeSection}
            onSectionChange={onSectionChange}
            isRTL={isRTL}
            desktopMode={false}
          />
        </div>
      </div>
    </>
  );
}
