// utils/formatPrice.js
import React from "react";
import { getCurrencySymbol } from "./currencySymbol";
import { getStatusColor } from "../utiles/utiles";

/**
 * Returns a formatted JSX fragment for displaying a price.
 * Automatically adjusts order for RTL/LTR languages and VAT text.
 *
 * @param {number} amount - The numeric price value.
 * @param {string} currency - Currency code (e.g., "USD", "ILS").
 * @param {boolean} isPriceIncludesVAT - Whether the price includes VAT.
 * @param {boolean} isRTL - Whether the language direction is RTL.
 * @param {function} t - Translation function (e.g., from useLanguage()).
 * @returns {JSX.Element} JSX fragment with formatted price.
 */
export function formatPrice(
  amount,
  currency = "ILS",
  isPriceIncludesVAT = true,
  bookingStatus = null,
  isRTL = false,
  t = (x) => x
) {
  const price = Number(amount || 0).toLocaleString(isRTL ? "he-IL" : "en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  const symbol = getCurrencySymbol(currency);

  const vatElement = !isPriceIncludesVAT ? (
    <span
      style={{
        fontSize: "0.75em",
        fontWeight: 400,
        whiteSpace: "nowrap",
        marginInlineStart: "0.25em",
      }}
    >
      + {t("plusVAT")}
    </span>
  ) : null;

  const statusElement = bookingStatus ? (
    <span
      className={`${getStatusColor(
        bookingStatus
      )} border rounded-full px-2 py-[1px] text-[0.7em] font-medium ml-2`}
      style={{
        direction: isRTL ? "rtl" : "ltr",
        marginInlineStart: "0.5em",
      }}
    >
      {t(bookingStatus?.toLowerCase() === "confirmed" ? "paid" : bookingStatus)}
    </span>
  ) : null;

  return (
    <span
      style={{
        fontSize: "0.9em",
        display: "inline-flex",
        alignItems: "baseline",
        flexWrap: "wrap",
        lineHeight: "1.1",
        direction: isRTL ? "rtl" : "ltr",
      }}
    >
      {symbol}
      {price}
      {vatElement}
      {statusElement}
    </span>
  );
}
