import React from "react";

/*
props:
- data: array of workers
- isRTL: boolean
- t: translation function
*/

export default function SectionWorkers({ data, isRTL, t }) {
  return (
    <div className="space-y-3">
      {data.items.map((worker, index) => (
        <div
          key={index}
          className="
            bg-[#141B28] rounded-xl p-4 
            border border-[#C1A875]/10 
            hover:border-[#C1A875]/30 
            transition-colors
          "
        >
          {/* Name + Status */}
          <div
            className={`
              flex items-start justify-between mb-3
              ${isRTL ? "flex-row-reverse" : "flex-row"}
            `}
          >
            {/* Name + Role */}
            <div>
              <h4
                className={`
                  text-base font-semibold text-white
                  ${isRTL ? "text-right" : "text-left"}
                `}
              >
                {worker.name}
              </h4>

              <p className="text-xs text-gray-400">{worker.role}</p>
            </div>

            {/* Status badge */}
            <span
              className={`
                text-xs px-2 py-1 rounded-full
                ${
                  worker.status === "On duty" || worker.status === "בתפקיד"
                    ? "bg-green-500/20 text-green-300"
                    : "bg-amber-500/20 text-amber-300"
                }
              `}
            >
              {worker.status}
            </span>
          </div>

          {/* Details: Location, Shift, Notes */}
          <div className="space-y-1.5 text-xs">
            {/* Location */}
            <div
              className={`
                flex justify-between text-gray-400
                ${isRTL ? "flex-row-reverse" : "flex-row"}
              `}
            >
              <span>{t("location")}</span>
              <span className="text-gray-300">{worker.location}</span>
            </div>

            {/* Shift */}
            <div
              className={`
                flex justify-between text-gray-400
                ${isRTL ? "flex-row-reverse" : "flex-row"}
              `}
            >
              <span>{t("shift")}</span>
              <span className="text-gray-300">{worker.shift}</span>
            </div>

            {/* Notes */}
            <p
              className={`
                text-gray-400 mt-2 pt-2 border-t border-gray-700
                ${isRTL ? "text-right" : "text-left"}
              `}
            >
              {worker.notes}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
