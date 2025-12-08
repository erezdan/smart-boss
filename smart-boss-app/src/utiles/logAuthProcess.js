import logger from "./myLogger";
//import { AppsSettingsStore } from "../data-access/AppsSettingsStore";

// === Auth process logger ===
let lastLogTime = performance.now();

export function logAuthProcess(step, resetLogTime = false) {
  const { trace_auth_process } = true; //AppsSettingsStore.getState();
  if (!trace_auth_process) return;

  if (resetLogTime) {
    lastLogTime = performance.now();
  }

  const now = performance.now();
  const diff = (now - lastLogTime).toFixed(2); // ms
  lastLogTime = now;

  // Log formatted time gap
  logger.trace(
    `%c[AUTH TIMING] ${step} +${diff}ms`,
    "color: #0a7; font-weight: bold;"
  );
}
