import React from "react";
import { useLanguage } from "./LanguageContext";
import {
  AlertCircle,
  TrendingUp,
  Camera,
  CheckCircle,
  BarChart3,
} from "lucide-react";

export default function ChatBubble({ message, onExpand }) {
  const { isRTL } = useLanguage();
  const isUser = message.type === "user";
  const isAI = message.type === "ai";

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "high":
        return "border-red-500/30 bg-red-50/50";
      case "medium":
        return "border-amber-500/30 bg-amber-50/50";
      case "low":
        return "border-blue-500/30 bg-blue-50/50";
      default:
        return "";
    }
  };

  const getIcon = () => {
    switch (message.subtype) {
      case "alert":
        return <AlertCircle className="w-4 h-4 text-amber-600" />;
      case "insight":
        return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case "vision":
        return <Camera className="w-4 h-4 text-purple-600" />;
      case "task":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "report":
        return <BarChart3 className="w-4 h-4 text-indigo-600" />;
      default:
        return null;
    }
  };

  if (isUser) {
    return (
      <div
        className={`flex ${
          isRTL ? "flex-row-reverse" : "flex-row"
        } justify-end mb-4 animate-fade-in`}
      >
        <div className="max-w-[80%] md:max-w-[60%]">
          <div className="bg-[#0A0F18] text-white rounded-2xl px-5 py-3 shadow-lg">
            <p className="text-[15px] leading-relaxed">{message.content}</p>
          </div>
          <p
            className={`text-xs text-gray-400 mt-1 ${
              isRTL ? "text-right mr-3" : "text-left ml-3"
            }`}
          >
            {message.timestamp}
          </p>
        </div>
      </div>
    );
  }

  if (isAI) {
    return (
      <div
        className={`flex ${
          isRTL ? "flex-row-reverse" : "flex-row"
        } justify-start mb-4 animate-fade-in`}
      >
        <div className="max-w-[85%] md:max-w-[70%]">
          <div
            onClick={() => message.expandable && onExpand(message)}
            className={`bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm transition-all duration-300 
              ${message.severity ? getSeverityColor(message.severity) : ""} 
              ${
                message.expandable
                  ? "cursor-pointer hover:shadow-md hover:border-[#C1A875]/40"
                  : ""
              }`}
          >
            {/* Header with icon and type */}
            {message.subtype && (
              <div
                className={`flex ${
                  isRTL ? "flex-row-reverse" : "flex-row"
                } items-center gap-2 mb-2`}
              >
                {getIcon()}
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {message.subtype}
                </span>
              </div>
            )}

            {/* Image if present */}
            {message.image && (
              <div className="mb-3 rounded-xl overflow-hidden">
                <img
                  src={message.image}
                  alt="AI Vision"
                  className="w-full h-48 object-cover"
                />
              </div>
            )}

            {/* Content */}
            <p className="text-[15px] leading-relaxed text-gray-800">
              {message.content}
            </p>

            {/* Chart indicator */}
            {message.chart && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <BarChart3 className="w-3 h-3" />
                  <span>Tap to view detailed chart</span>
                </div>
              </div>
            )}

            {/* Expandable indicator */}
            {message.expandable && (
              <div
                className={`mt-3 pt-3 border-t border-gray-100 flex ${
                  isRTL ? "flex-row-reverse" : "flex-row"
                } items-center justify-between`}
              >
                <span className="text-xs text-[#C1A875] font-medium">
                  {isRTL ? "הקש לפרטים נוספים" : "Tap for more details"}
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-[#C1A875] animate-pulse" />
              </div>
            )}
          </div>
          <p
            className={`text-xs text-gray-400 mt-1 ${
              isRTL ? "text-right mr-3" : "text-left ml-3"
            }`}
          >
            {message.timestamp}
          </p>
        </div>
      </div>
    );
  }

  return null;
}
