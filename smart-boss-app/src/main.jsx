// src/main.jsx
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

  // 🚀 Start React app with passed as prop
  createRoot(document.getElementById("root")).render(
    isDev ? (
      <StrictMode>
        <BrowserRouter>
          <LanguageProvider>
            <App />
          </LanguageProvider>
        </BrowserRouter>
      </StrictMode>
    ) : (
      <BrowserRouter>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </BrowserRouter>
    )
  );
})();
