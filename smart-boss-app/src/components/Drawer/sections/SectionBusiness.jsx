import React from "react";
import FilterPanel from "../../FilterPanel"; // adjust path if needed

/*
props:
- data: { sections: [...] }
- filters: object
- setFilters: function
- isRTL: boolean
- t: translation function
*/

export default function SectionBusiness({ data, filters, setFilters, isRTL }) {
  return (
    <div className="space-y-4">
      {/* Filters */}
      <FilterPanel filters={filters} onFilterChange={setFilters} />

      {/* Business Sections */}
      {data.sections.map((section, index) => (
        <div
          key={index}
          className="
            bg-[#141B28] rounded-xl p-4
            border border-[#C1A875]/10
            hover:border-[#C1A875]/30
            transition-colors
          "
        >
          {/* Title */}
          <h4
            className={`
              text-sm font-semibold text-white mb-3
              ${isRTL ? "text-right" : "text-left"}
            `}
          >
            {section.title}
          </h4>

          {/* Items */}
          <div className="space-y-2">
            {section.items.map((item, idx) => (
              <div
                key={idx}
                className={`
                  flex items-start gap-2
                  ${isRTL ? "flex-row-reverse" : "flex-row"}
                `}
              >
                {/* Bullet */}
                <div className="w-1.5 h-1.5 rounded-full bg-[#C1A875] mt-1.5" />

                {/* Text */}
                <p className="text-xs text-gray-300">{item}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
