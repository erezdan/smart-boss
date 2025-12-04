import React, { useState } from "react";
import { Filter, X, Search, Calendar } from "lucide-react";
import { useLanguage } from "../hooks/useLanguage";

export default function FilterPanel({ onFilterChange, filters }) {
  const { isRTL, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(
    filters || {
      dateFrom: "",
      dateTo: "",
      timeFrom: "",
      timeTo: "",
      searchText: "",
    }
  );

  const handleApply = () => {
    onFilterChange(localFilters);
  };

  const handleClear = () => {
    const cleared = {
      dateFrom: "",
      dateTo: "",
      timeFrom: "",
      timeTo: "",
      searchText: "",
    };
    setLocalFilters(cleared);
    onFilterChange(cleared);
  };

  const hasActiveFilters =
    localFilters.dateFrom ||
    localFilters.dateTo ||
    localFilters.timeFrom ||
    localFilters.timeTo ||
    localFilters.searchText;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
          transition-all duration-200 ${
            hasActiveFilters
              ? "bg-[#C1A875] text-[#0A0F18]"
              : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300"
          }`}
      >
        <Filter className="w-4 h-4" />
        <span>{t("filters")}</span>
        {hasActiveFilters && (
          <span className="w-2 h-2 rounded-full bg-[#0A0F18]" />
        )}
      </button>

      {isOpen && (
        <div className="mt-3 bg-[#0D1320] rounded-xl p-4 border border-[#C1A875]/20 animate-scale-in">
          {/* Search Field */}
          <div className="mb-4">
            <label
              className={`block text-xs text-gray-400 mb-1.5 ${
                isRTL ? "text-right" : "text-left"
              }`}
            >
              {t("search")}
            </label>
            <div className="relative">
              <Search
                className={`absolute ${
                  isRTL ? "right-3" : "left-3"
                } top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500`}
              />
              <input
                type="text"
                value={localFilters.searchText}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    searchText: e.target.value,
                  })
                }
                placeholder={t("searchAlerts")}
                className={`w-full bg-[#141B28] border border-[#C1A875]/20 rounded-lg py-2 
                  ${isRTL ? "pr-10 pl-3 text-right" : "pl-10 pr-3 text-left"}
                  text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#C1A875]/50`}
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label
                className={`block text-xs text-gray-400 mb-1.5 ${
                  isRTL ? "text-right" : "text-left"
                }`}
              >
                {t("fromDate")}
              </label>
              <input
                type="date"
                value={localFilters.dateFrom}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, dateFrom: e.target.value })
                }
                className={`w-full bg-[#141B28] border border-[#C1A875]/20 rounded-lg py-2 px-3
                  text-sm text-white focus:outline-none focus:border-[#C1A875]/50 ${
                    isRTL ? "text-right" : "text-left"
                  }`}
              />
            </div>
            <div>
              <label
                className={`block text-xs text-gray-400 mb-1.5 ${
                  isRTL ? "text-right" : "text-left"
                }`}
              >
                {t("toDate")}
              </label>
              <input
                type="date"
                value={localFilters.dateTo}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, dateTo: e.target.value })
                }
                className={`w-full bg-[#141B28] border border-[#C1A875]/20 rounded-lg py-2 px-3
                  text-sm text-white focus:outline-none focus:border-[#C1A875]/50 ${
                    isRTL ? "text-right" : "text-left"
                  }`}
              />
            </div>
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label
                className={`block text-xs text-gray-400 mb-1.5 ${
                  isRTL ? "text-right" : "text-left"
                }`}
              >
                {t("fromTime")}
              </label>
              <input
                type="time"
                value={localFilters.timeFrom}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, timeFrom: e.target.value })
                }
                className={`w-full bg-[#141B28] border border-[#C1A875]/20 rounded-lg py-2 px-3
                  text-sm text-white focus:outline-none focus:border-[#C1A875]/50 ${
                    isRTL ? "text-right" : "text-left"
                  }`}
              />
            </div>
            <div>
              <label
                className={`block text-xs text-gray-400 mb-1.5 ${
                  isRTL ? "text-right" : "text-left"
                }`}
              >
                {t("toTime")}
              </label>
              <input
                type="time"
                value={localFilters.timeTo}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, timeTo: e.target.value })
                }
                className={`w-full bg-[#141B28] border border-[#C1A875]/20 rounded-lg py-2 px-3
                  text-sm text-white focus:outline-none focus:border-[#C1A875]/50 ${
                    isRTL ? "text-right" : "text-left"
                  }`}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div
            className={`flex ${isRTL ? "flex-row-reverse" : "flex-row"} gap-2`}
          >
            <button
              onClick={handleApply}
              className="flex-1 py-2 bg-[#C1A875] text-[#0A0F18] rounded-lg text-sm font-medium
                hover:bg-[#B09865] transition-colors"
            >
              {t("apply")}
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-white/5 text-gray-400 rounded-lg text-sm font-medium
                hover:bg-white/10 transition-colors"
            >
              {t("clear")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
