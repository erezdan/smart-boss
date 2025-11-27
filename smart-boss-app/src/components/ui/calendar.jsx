import React, { useState } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
} from "date-fns";
import { he } from "date-fns/locale";
import { useLanguage } from "../../hooks/useLanguage";

export function Calendar({
  selectedDate,
  selected,
  onDateSelect,
  onSelect,
  className = "",
  disabled,
  availableDates,
  disablePastDays = true,
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // ✅ multi-language support
  const { isRTL, language } = useLanguage();
  const locale = language === "he" ? he : undefined;

  // ✅ Hebrew weekday symbols
  const hebrewDays = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];

  const handleSelect = (date) => {
    if (disabled && disabled(date)) return;
    if (onDateSelect) onDateSelect(date);
    if (onSelect) onSelect(date);
  };

  const toYMD = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  const renderHeader = () => (
    <div className="flex justify-between items-center mb-4">
      {/* Previous month button */}
      <button
        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        className="px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
      >
        {/* Right side button always visually points right */}
        <span>{"<"}</span>
      </button>

      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
        {format(currentMonth, "MMMM yyyy", { locale })}
      </h2>

      {/* Next month button */}
      <button
        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        className="px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
      >
        {/* Left side button always visually points left */}
        <span>{">"}</span>
      </button>
    </div>
  );

  const renderDays = () => {
    const dayLabels =
      language === "he"
        ? hebrewDays
        : Array.from({ length: 7 }).map((_, i) =>
            format(addDays(new Date(2023, 0, 1), i), "EEE")
          );

    return (
      <div className="grid grid-cols-7 mb-2">
        {dayLabels.map((day, i) => (
          <div
            key={i}
            className="text-center font-medium text-gray-600 dark:text-gray-300"
          >
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const rows = [];
    let days = [];
    let day = startDate;

    const activeDate = selectedDate || selected;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const isSelected = activeDate && isSameDay(day, activeDate);

        // Disable past days only if flag is on
        const isDisabled =
          availableDates?.length > 0
            ? !availableDates.includes(toYMD(day))
            : disablePastDays
            ? day < today
            : false;

        days.push(
          <div
            key={day}
            onClick={() => !isDisabled && handleSelect(cloneDay)}
            className={`p-2 text-center cursor-pointer rounded-md transition-colors flex items-center justify-center h-12 w-12
            ${
              isDisabled
                ? "text-gray-400 opacity-50 cursor-not-allowed"
                : !isSameMonth(day, monthStart)
                ? "text-gray-400"
                : isSelected
                ? "bg-blue-600 text-white"
                : "hover:bg-blue-100"
            }`}
          >
            {format(day, "d", { locale })}
          </div>
        );
        day = addDays(day, 1);
      }

      rows.push(
        <div className="grid grid-cols-7 gap-1 justify-items-center" key={day}>
          {days}
        </div>
      );
      days = [];
    }

    return <div>{rows}</div>;
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-md p-4 w-80 ${className}`}
      style={{ direction: isRTL ? "rtl" : "ltr" }}
    >
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </div>
  );
}
