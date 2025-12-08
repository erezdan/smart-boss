import { create } from "zustand";

export const PWAStore = create((set) => ({
  deferredPrompt: null,
  setDeferredPrompt: (value) => set({ deferredPrompt: value }),
}));
