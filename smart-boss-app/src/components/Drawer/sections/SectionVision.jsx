import React from "react";

/*
props:
- data: { cameras: [], events: [], lastFrameUrl: string }
- isRTL: boolean
- t: translation function
*/

export default function SectionVision({ data, isRTL }) {
  return (
    <div className="space-y-4">
      {data.items.map((camera, index) => (
        <div
          key={index}
          className="
            bg-[#141B28] rounded-xl overflow-hidden 
            border border-[#C1A875]/10 
            hover:border-[#C1A875]/30 
            transition-colors
          "
        >
          {/* Snapshot */}
          <img
            src={camera.snapshot}
            alt={camera.camera}
            className="w-full h-32 object-cover"
          />

          {/* Info */}
          <div className="p-4">
            {/* Camera name */}
            <h4
              className={`
                text-sm font-semibold text-white mb-2
                ${isRTL ? "text-right" : "text-left"}
              `}
            >
              {camera.camera}
            </h4>

            <div className="space-y-1">
              {/* Activity row */}
              <div
                className={`
                  flex items-center gap-2
                  ${isRTL ? "flex-row-reverse" : "flex-row"}
                `}
              >
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <p className="text-xs text-gray-300">{camera.activity}</p>
              </div>

              {/* Patterns */}
              <p
                className={`
                  text-xs text-gray-400
                  ${isRTL ? "mr-4 text-right" : "ml-4 text-left"}
                `}
              >
                {camera.patterns}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
