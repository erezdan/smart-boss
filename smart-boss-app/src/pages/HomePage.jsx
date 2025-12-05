import React from "react";
import { LanguageProvider } from "../context/LanguageContext";
import Layout from "../components/layouts/Layout";

export default function HomePage() {
  return (
    <LanguageProvider>
      <Layout />
    </LanguageProvider>
  );
}
