import React from "react";
import { LanguageProvider } from "../context/LanguageContext";
import Layout from "../components/layouts/Layout";

export default function HomePage() {
  return (
    <LanguageProvider>
      <Layout />

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@400;500;600&display=swap");

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: "Inter", sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          overflow: hidden;
        }

        .direction-rtl {
          direction: rtl;
        }

        .direction-ltr {
          direction: ltr;
        }

        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(193, 168, 117, 0.3);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(193, 168, 117, 0.5);
        }

        .scrollbar-hide {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        html,
        body {
          overflow-x: hidden;
        }
      `}</style>
    </LanguageProvider>
  );
}
