import React from "react";

/**
 * Checkbox component
 * Supports controlled & uncontrolled modes.
 * Neutral by default, themeable with className.
 */
export function Checkbox({ id, checked, onChange, label }) {
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-2 cursor-pointer text-sm text-gray-700"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="
          appearance-auto
          h-4 w-4 rounded border-gray-300
          accent-blue-600
          focus:ring-2 focus:ring-blue-500
          transition-transform duration-150 active:scale-95
        "
      />
      {label}
    </label>
  );
}
