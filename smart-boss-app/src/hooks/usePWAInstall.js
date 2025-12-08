// usePWAInstall.js
import { useEffect } from "react";
import { PWAStore } from "../data-access/PWAStore";

export function usePWAInstall() {
  const setDeferredPrompt = PWAStore((state) => state.setDeferredPrompt);

  useEffect(() => {
    // 🧩 Skip if we’re inside Firebase Auth redirect flow
    if (window.location.pathname.startsWith("/__/auth")) {
      console.log(
        "⏭️ Skipping PWA install setup during Firebase Auth redirect"
      );
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      console.log("✅ beforeinstallprompt captured");
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [setDeferredPrompt]);
}
