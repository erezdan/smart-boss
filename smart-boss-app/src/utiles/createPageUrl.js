// Creates a clean kebab-case URL path from a page name
// Converts only the page name (e.g., "LiveCall" -> "/live-call")
// and safely appends query parameters without altering their keys.
//
// @param {string} pageName - The name of the page (e.g., "LiveCall", "Dashboard")
// @param {object} params - Optional query parameters (e.g., { bookingId: "123", showBackBtn: true })
// @returns {string} The final URL (e.g., "/live-call?bookingId=123&showBackBtn=true")

export function createPageUrl(pageName, params = {}) {
  // Split possible query string if pageName already includes '?'
  const [rawPageName, rawQuery] = pageName.split("?");

  // Convert only the page name to kebab-case (e.g., LiveCall -> live-call)
  const basePath =
    "/" +
    rawPageName
      .replace(/([A-Z])/g, "-$1") // Insert dash before capital letters
      .toLowerCase()
      .replace(/^-/, ""); // Remove leading dash if any

  // If the caller used query params as object, serialize them safely
  const queryFromParams = new URLSearchParams(params).toString();

  // If there was already a query string in pageName, keep it intact
  const finalQuery = [rawQuery, queryFromParams].filter(Boolean).join("&");

  // Combine base path with query string (if any)
  const url = finalQuery ? `${basePath}?${finalQuery}` : basePath;

  return url;
}
