import React from "react";
import DrawerSectionItem from "./DrawerSectionItem";

/*
props:
- sections: array of { id, label, icon }
- activeSection: string
- onSectionChange: function
- isRTL: boolean
- desktopMode: boolean
*/
export default function DrawerSectionList({
  sections,
  activeSection,
  onSectionChange,
  isRTL,
  desktopMode,
}) {
  return (
    <div
      className={`
        w-full bg-[#0C0F14] backdrop-blur-md
        shadow-[0_-4px_20px_rgba(0,0,0,0.5)]
        ${desktopMode ? "" : "absolute bottom-0 left-0 right-0"}
      `}
      style={{ paddingBottom: "max(14px, env(safe-area-inset-bottom))" }}
    >
      <div
        className={`
          h-[56px] overflow-x-auto scrollbar-hide
          flex items-center gap-1 px-2
          ${isRTL ? "flex-row-reverse" : "flex-row"}
          ${desktopMode ? "justify-center" : "justify-start"}
        `}
      >
        {sections.map((s) => (
          <DrawerSectionItem
            key={s.id}
            id={s.id}
            label={s.label}
            Icon={s.icon}
            isActive={activeSection === s.id}
            isRTL={isRTL}
            onClick={onSectionChange}
          />
        ))}
      </div>
    </div>
  );
}
