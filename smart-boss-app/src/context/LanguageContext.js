import React, { createContext, useContext, useState } from "react";

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};

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
