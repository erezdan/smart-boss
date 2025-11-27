import React, { createContext, useState } from "react";

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState("en"); // 'en' or 'he'

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "he" : "en"));
  };

  const isRTL = language === "he";

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, isRTL }}>
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
