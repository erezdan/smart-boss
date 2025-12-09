// src/main.jsx

import { auth } from "./lib/firebase";
import { getRedirectResult } from "firebase/auth";

let redirectResult = null;

// 🚀 MUST RUN BEFORE ANYTHING (React, SW, Zustand, App)
try {
  redirectResult = await getRedirectResult(auth);
  console.log("🔄 Redirect result (early):", redirectResult);
} catch (err) {
  console.error("❌ Redirect processing error:", err);
}

(async () => {
  // Load dependencies AFTER handling redirect
  const { StrictMode } = await import("react");
  const { createRoot } = await import("react-dom/client");
  const { BrowserRouter } = await import("react-router-dom");
  const { default: App } = await import("./App.jsx");
  const { LanguageProvider } = await import("./context/LanguageContext.jsx");
  const { registerSW } = await import("virtual:pwa-register");
  await import("./index.css");

  // 🧠 Register Service Worker
  registerSW({
    immediate: false,
    onNeedRefresh() {
      console.log("New service worker available — waiting to activate.");
    },
    onOfflineReady() {
      console.log("App ready to work offline!");
    },
  });

  const isDev = import.meta.env.MODE === "development";

  // 🚀 Start React app with redirectResult passed as prop
  createRoot(document.getElementById("root")).render(
    isDev ? (
      <StrictMode>
        <BrowserRouter>
          <LanguageProvider>
            <App redirectResult={redirectResult} />
          </LanguageProvider>
        </BrowserRouter>
      </StrictMode>
    ) : (
      <BrowserRouter>
        <LanguageProvider>
          <App redirectResult={redirectResult} />
        </LanguageProvider>
      </BrowserRouter>
    )
  );
})();
