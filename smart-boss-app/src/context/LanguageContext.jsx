import React, { createContext, useState } from "react";
import translations from "./translations";

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState("en"); // 'en' or 'he'

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "he" : "en"));
  };

  const isRTL = language === "he";

  const t = (key) => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, isRTL, t }}>
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className={`min-h-screen ${isRTL ? "font-hebrew" : "font-inter"}`}
      >
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export { LanguageContext };
