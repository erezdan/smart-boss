import React from "react";

/*
props:
- data: array of queue items
- isRTL: boolean
- t: translation function
*/

export default function SectionQueue({ data, isRTL, t }) {
  return (
    <div className="space-y-3">
      {data.items.map((item, index) => (
        <div
          key={index}
          className="
            bg-[#141B28] rounded-xl p-4
            border border-[#C1A875]/10 
            hover:border-[#C1A875]/30
            transition-colors
          "
        >
          {/* Row: time + metrics */}
          <div
            className={`
              flex items-center justify-between
              ${isRTL ? "flex-row-reverse" : "flex-row"}
            `}
          >
            {/* Time */}
            <span className="text-sm font-medium text-white">{item.time}</span>

            {/* Wait + customers */}
            <div
              className={`
                flex items-center gap-4
                ${isRTL ? "flex-row-reverse" : "flex-row"}
              `}
            >
              {/* Wait */}
              <div className={`${isRTL ? "text-right" : "text-left"}`}>
                <p className="text-xs text-gray-400">{t("wait")}</p>
                <p className="text-sm font-semibold text-amber-400">
                  {item.wait}
                </p>
              </div>

              {/* Customers */}
              <div className={`${isRTL ? "text-right" : "text-left"}`}>
                <p className="text-xs text-gray-400">{t("customers")}</p>
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
}
