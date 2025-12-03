/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],

  // ⭐ Added for Scoped Dark Mode
  darkMode: ["class", '[data-theme="dark"]'],

  theme: {
    extend: {
      keyframes: {
        // --- Smart Boss PWA Install Animation ---
        slideInUp: {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "60%": { transform: "translateY(-6%)", opacity: "1" },
          "80%": { transform: "translateY(3%)" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideOutDown: {
          "0%": { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(100%)", opacity: "0" },
        },
        softPulse: {
          "0%, 100%": { boxShadow: "0 -4px 10px rgba(0, 0, 0, 0.1)" },
          "50%": { boxShadow: "0 -8px 20px rgba(0, 0, 0, 0.18)" },
        },
      },
      animation: {
        // smooth bounce-in when opening
        slideInUp: "slideInUp 0.55s cubic-bezier(0.25, 0.8, 0.25, 1) forwards",
        // smooth slide-down fade-out when closing
        slideOutDown:
          "slideOutDown 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards",
        softPulse: "softPulse 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
