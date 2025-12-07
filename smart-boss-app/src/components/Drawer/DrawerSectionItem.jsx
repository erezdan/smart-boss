import React from "react";

/*
props:
- id: string
- label: string
- Icon: component
- isActive: boolean
- isRTL: boolean
- onClick: function
*/
export default function DrawerSectionItem({
  id,
  label,
  Icon,
  isActive,
  isRTL,
  onClick,
}) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`
        relative flex-shrink-0 px-4 py-2.5
        flex flex-col items-center justify-center
        transition-all duration-200 rounded-lg
        ${isActive ? "bg-[#C7A96A]/15" : "hover:bg-white/5"}
      `}
      title={label}
    >
      {/* Icon */}
      <Icon
        className={`
          w-[26px] h-[26px] transition-colors duration-200
          ${isActive ? "text-[#C7A96A]" : "text-[#A6A7AA]"}
        `}
        strokeWidth={1.75}
      />

      {/* Bottom highlight */}
      {isActive && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-5 h-[2.5px] bg-[#C7A96A] rounded-full" />
      )}
    </button>
  );
}
