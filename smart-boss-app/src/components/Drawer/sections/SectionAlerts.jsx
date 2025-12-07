import React from "react";

/*
props:
- data: array of alert items
- filters: current filters state
- setFilters: setter for filters
- isRTL: boolean
- t: translation function
*/

export default function SectionAlerts({ data, filters, setFilters, isRTL, t }) {
  // Helper to match original badge colors
  const getSeverityBadge = (sev) => {
    switch (sev) {
      case "critical":
        return "border-red-400 text-red-400";
      case "warning":
        return "border-yellow-400 text-yellow-400";
      default:
        return "border-gray-400 text-gray-400";
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className={`${isRTL ? "text-right" : "text-left"} mb-2`}>
        <div className="flex gap-3 mt-3">
          <button
            onClick={() => setFilters({ ...filters, type: "all" })}
            className={`px-3 py-1 rounded-lg border ${
              filters.type === "all"
                ? "border-[#C1A875] text-[#C1A875]"
                : "border-gray-400 text-gray-400"
            }`}
          >
            {t("all")}
          </button>

          <button
            onClick={() => setFilters({ ...filters, type: "critical" })}
            className={`px-3 py-1 rounded-lg border ${
              filters.type === "critical"
                ? "border-red-400 text-red-400"
                : "border-gray-400 text-gray-400"
            }`}
          >
            {t("critical")}
          </button>
        </div>
      </div>

      {/* Alerts list */}
      <div className="space-y-4">
        {data.items.map((alert, index) => (
          <div
            key={index}
            className="
              bg-[#141B28] rounded-xl overflow-hidden 
              border border-[#C1A875]/10 
              hover:border-[#C1A875]/30 
              transition-colors
            "
          >
            {/* Image */}
            <img
              src={alert.image}
              alt={alert.title}
              className="w-full h-40 object-cover"
            />

            {/* Text block */}
            <div className="p-4">
              {/* Severity + Time */}
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

              {/* Title */}
              <h4
                className={`text-sm font-semibold text-white mb-1 ${
                  isRTL ? "text-right" : "text-left"
                }`}
              >
                {alert.title}
              </h4>

              {/* Description */}
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
    </div>
  );
}
