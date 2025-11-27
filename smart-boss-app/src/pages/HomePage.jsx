import React, { useState } from "react";
import { LanguageProvider } from "../context/LanguageContext";
import ChatScreen from "../components/ChatScreen";
import SideDrawer from "../components/SideDrawer";

export default function HomePage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("insights");

  return (
    <LanguageProvider>
      <div className="h-screen w-screen overflow-hidden bg-[#F7F7F9]">
        <ChatScreen onMenuClick={() => setIsDrawerOpen(true)} />
        <SideDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
      </div>

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap");
        @import url("https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800&display=swap");

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          overflow: hidden;
        }

        .font-inter {
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
        }

        .font-hebrew {
          font-family: "Heebo", -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(193, 168, 117, 0.3);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(193, 168, 117, 0.5);
        }

        /* Hide scrollbar for textarea */
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* Smooth transitions */
        * {
          transition-property: background-color, border-color, color, fill,
            stroke;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 150ms;
        }
      `}</style>
    </LanguageProvider>
  );
}
