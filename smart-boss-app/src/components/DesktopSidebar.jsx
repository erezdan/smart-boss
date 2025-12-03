import React from "react";
import {
  TrendingUp,
  AlertTriangle,
  Camera,
  Users,
  BarChart3,
  Briefcase,
  Settings,
} from "lucide-react";
import { useLanguage } from "../hooks/useLanguage";

export default function DesktopSidebar({ activeSection, onSectionChange }) {
  const { language, isRTL } = useLanguage();

  const sections = [
    {
      id: "insights",
      icon: TrendingUp,
      label: language === "en" ? "Insights" : "תובנות",
    },
    {
      id: "alerts",
      icon: AlertTriangle,
      label: language === "en" ? "Alerts" : "התראות",
    },
    { id: "vision", icon: Camera, label: "Vision AI" },
    {
      id: "workers",
      icon: Users,
      label: language === "en" ? "Workers" : "עובדים",
    },
    {
      id: "queue",
      icon: BarChart3,
      label: language === "en" ? "Queue" : "תור",
    },
    {
      id: "business",
      icon: Briefcase,
      label: language === "en" ? "Business" : "עסקי",
    },
    {
      id: "settings",
      icon: Settings,
      label: language === "en" ? "Settings" : "הגדרות",
    },
  ];

  return (
    <div className="hidden md:flex flex-col w-72 h-full bg-[#0A0F18] border-r border-[#C1A875]/20">
      {/* ===== TOP BAR (דסקטופ בלבד, רק מעל המגירה) ===== */}
      <div
        className={`
          w-full h-[70px]
          flex items-center justify-center
          px-4 border-b border-[#C1A875]/20
          ${isRTL ? "flex-row-reverse" : "flex-row"}
        `}
      >
        <div className="flex items-center gap-3">
          <img
            src="/images/smart_boss_logo_only-transperent.png"
            alt="Smart Boss Logo"
            className="w-8 h-8 object-contain"
          />
          <h1 className="text-white font-bold text-lg">SMART BOSS</h1>
        </div>
      </div>

      {/* ===== NAVIGATION BUTTONS ===== */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = section.id === activeSection;

          return (
            <button
              key={section.id}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all
                ${isRTL ? "flex-row-reverse" : "flex-row"}
                ${
                  isActive
                    ? "bg-[#C1A875]/20 text-[#C1A875]"
                    : "text-gray-300 hover:bg-white/10"
                }
              `}
              onClick={() => onSectionChange(section.id)}
            >
              <Icon className="w-5 h-5" />
              {section.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
