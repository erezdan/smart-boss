// components/Drawer/sections/SectionInsights.jsx
import React from "react";

export default function SectionInsights({ data, isRTL }) {
  let items = [];

  try {
    if (!data || !Array.isArray(data.items)) return null;
    items = data.items;
  } catch (err) {
    console.error("SectionInsights data error:", err);
    return (
      <div className="text-red-400 text-sm p-4">
        Failed to load insights section.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div
          key={index}
          className="bg-[#141B28] rounded-xl p-4 border border-[#C1A875]/10 hover:border-[#C1A875]/30 transition-colors"
        >
          {/* Title + Trend Icon */}
          <div
            className={`flex ${
              isRTL ? "flex-row-reverse" : "flex-row"
            } items-start justify-between mb-2`}
          >
            <h4 className="text-sm font-medium text-gray-300">{item.label}</h4>

            {/* Trend Icon */}
            <div>{item.trendIcon}</div>
          </div>

          {/* Value */}
          <p className="text-2xl font-bold text-white mb-1">{item.value}</p>

          {/* Details */}
          <p className="text-xs text-gray-400">{item.details}</p>
        </div>
      ))}
    </div>
  );
}
