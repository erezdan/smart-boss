import React from "react";
import { X, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useLanguage } from "../hooks/useLanguage";

export default function ModalExpand({ message, onClose }) {
  const { isRTL, t } = useLanguage();

  if (!message?.expandable) return null;

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

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      {/* Modal container (flex column so footer stays fixed) */}
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden animate-scale-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0A0F18] to-[#141B28] px-6 py-5 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">
            {message.expandable.title}
          </h3>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Scrollable content area */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Image */}
          {message.image && (
            <div className="mb-6 rounded-2xl overflow-hidden">
              <img
                src={message.image}
                alt="Detail"
                className="w-full h-64 object-cover"
              />
            </div>
          )}

          {/* Description */}
          <div className="mb-6">
            <p
              className={`text-gray-700 leading-relaxed text-base ${
                isRTL ? "text-right" : "text-left"
              }`}
            >
              {message.expandable.details}
            </p>
          </div>

          {/* Metrics summary */}
          {message.expandable.metrics && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">{t("current")}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {message.expandable.metrics.current}
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">{t("average")}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {message.expandable.metrics.average}
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 text-center flex flex-col items-center justify-center">
                <p className="text-xs text-gray-500 mb-2">{t("trend")}</p>
                {getTrendIcon(message.expandable.metrics.trend)}
              </div>
            </div>
          )}

          {/* Timeline section */}
          {message.expandable.timeline && (
            <div className="mb-6">
              <h4
                className={`text-sm font-semibold text-gray-700 mb-3 ${
                  isRTL ? "text-right" : "text-left"
                }`}
              >
                {t("timeline")}
              </h4>

              <div className="space-y-2">
                {message.expandable.timeline.map((item, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      isRTL ? "flex-row-reverse" : "flex-row"
                    } items-center gap-3 bg-gray-50 rounded-lg px-4 py-3`}
                  >
                    <div className="w-2 h-2 rounded-full bg-[#C1A875]" />
                    <p className="text-sm text-gray-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Breakdown section */}
          {message.expandable.breakdown && (
            <div className="mb-6">
              <h4
                className={`text-sm font-semibold text-gray-700 mb-3 ${
                  isRTL ? "text-right" : "text-left"
                }`}
              >
                {t("breakdown")}
              </h4>

              <div className="grid grid-cols-3 gap-3">
                {Object.entries(message.expandable.breakdown).map(
                  ([key, value]) => (
                    <div
                      key={key}
                      className="bg-gradient-to-br from-[#0A0F18] to-[#141B28] rounded-xl p-4 text-center"
                    >
                      <p className="text-xs text-[#C1A875] mb-1 capitalize">
                        {key}
                      </p>
                      <p className="text-xl font-bold text-white">${value}</p>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Recommendation box */}
          {message.expandable.recommendation && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h4
                className={`text-sm font-semibold text-amber-800 mb-2 ${
                  isRTL ? "text-right" : "text-left"
                }`}
              >
                {t("recommendation")}
              </h4>

              <p
                className={`text-sm text-amber-700 ${
                  isRTL ? "text-right" : "text-left"
                }`}
              >
                {message.expandable.recommendation}
              </p>
            </div>
          )}

          {/* Assigned to */}
          {message.expandable.assignedTo && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-gray-500">{t("assignedTo")}</span>
              <span className="text-sm font-medium text-gray-700">
                {message.expandable.assignedTo}
              </span>
            </div>
          )}
        </div>

        {/* Footer - always visible */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end bg-white">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#0A0F18] text-white rounded-xl font-medium hover:bg-[#141B28] transition-colors"
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
}
