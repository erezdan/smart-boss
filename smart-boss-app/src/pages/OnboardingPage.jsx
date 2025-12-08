import React, { useState } from "react";
import {
  Play,
  CheckCircle2,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
// eslint-disable-next-line
import { motion } from "framer-motion";
import { content } from "../context/onboardingContent";
import { useLanguage } from "../hooks/useLanguage";

function OnboardingContent() {
  const { language, isRTL, toggleLanguage } = useLanguage();
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [currentCase, setCurrentCase] = useState(0);

  const t = content[language];

  const nextCase = () => {
    setCurrentCase((prev) => (prev + 1) % t.studyCases.cases.length);
  };

  const prevCase = () => {
    setCurrentCase(
      (prev) =>
        (prev - 1 + t.studyCases.cases.length) % t.studyCases.cases.length
    );
  };

  const handleGetStarted = () => {
    // Navigate to sign-in flow - implement based on your routing
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-[#0A0F18] text-white overflow-x-hidden">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#0A0F18]/95 backdrop-blur-md border-b border-[#C1A875]/10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div
            className={`flex ${
              isRTL ? "flex-row-reverse" : "flex-row"
            } items-center justify-between`}
          >
            <button
              onClick={handleGetStarted}
              className="text-sm text-[#C1A875] hover:text-[#B09865] transition-colors"
            >
              {t.signIn}
            </button>
            <button
              onClick={toggleLanguage}
              className="text-sm text-gray-400 hover:text-white transition-colors font-medium"
            >
              {t.languageToggle}
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="pt-32 pb-20 px-4 md:px-6"
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-br from-white via-[#C1A875] to-[#B09865] bg-clip-text text-transparent"
          >
            {t.hero.headline}
          </motion.h1>
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-xl md:text-2xl text-gray-300 leading-relaxed"
          >
            {t.hero.subheadline}
          </motion.p>
        </div>
      </motion.section>

      {/* Video Section */}
      <motion.section
        initial={{ y: 50, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="py-16 px-4 md:px-6"
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              {t.videoSection.title}
            </h2>
            <p className="text-gray-400">{t.videoSection.subtitle}</p>
          </div>
          <div className="relative rounded-2xl overflow-hidden bg-[#141B28] border border-[#C1A875]/20 aspect-video">
            {!isVideoPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#141B28] to-[#0A0F18]">
                <button
                  onClick={() => setIsVideoPlaying(true)}
                  className="w-20 h-20 rounded-full bg-[#C1A875] hover:bg-[#B09865] flex items-center justify-center
                            transition-all duration-300 hover:scale-110 shadow-2xl"
                >
                  <Play
                    className="w-10 h-10 text-[#0A0F18] ml-1"
                    fill="currentColor"
                  />
                </button>
              </div>
            )}

            {isVideoPlaying && (
              <iframe
                src="https://player.vimeo.com/video/1142394120?autoplay=1"
                className="absolute inset-0 w-full h-full"
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </div>
      </motion.section>

      {/* How It Works */}
      <section className="py-20 px-4 md:px-6 bg-[#141B28]/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              {t.howItWorks.title}
            </h2>
            <p className="text-gray-400">{t.howItWorks.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.howItWorks.cards.map((card, index) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ y: 50, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  className="bg-[#141B28] rounded-xl p-6 border border-[#C1A875]/10 hover:border-[#C1A875]/30 
                    transition-all duration-300 hover:transform hover:scale-105"
                >
                  <div className="w-12 h-12 rounded-full bg-[#C1A875]/20 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-[#C1A875]" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {card.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Study Cases */}
      <section className="py-20 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              {t.studyCases.title}
            </h2>
            <p className="text-gray-400">{t.studyCases.subtitle}</p>
          </div>
          <div className="relative">
            <motion.div
              key={currentCase}
              initial={{ opacity: 0, x: isRTL ? -50 : 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRTL ? 50 : -50 }}
              transition={{ duration: 0.5 }}
              className="bg-[#141B28] rounded-2xl overflow-hidden border border-[#C1A875]/20"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <img
                  src={t.studyCases.cases[currentCase].image}
                  alt={t.studyCases.cases[currentCase].business}
                  className="w-full h-64 lg:h-full object-cover"
                />
                <div className="p-8 lg:p-10">
                  <div
                    className={`flex ${
                      isRTL ? "flex-row-reverse" : "flex-row"
                    } items-center gap-2 mb-4`}
                  >
                    <h3 className="text-2xl font-bold">
                      {t.studyCases.cases[currentCase].business}
                    </h3>
                    <span className="text-sm text-gray-400">
                      • {t.studyCases.cases[currentCase].location}
                    </span>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-[#C1A875] font-semibold mb-1">
                        {language === "en" ? "Challenge" : "אתגר"}
                      </p>
                      <p className="text-gray-300">
                        {t.studyCases.cases[currentCase].challenge}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-[#C1A875] font-semibold mb-1">
                        {language === "en" ? "Result" : "תוצאה"}
                      </p>
                      <p className="text-gray-300">
                        {t.studyCases.cases[currentCase].result}
                      </p>
                    </div>
                    <div className="pt-4 border-t border-gray-700">
                      <p className="text-gray-400 italic">
                        "{t.studyCases.cases[currentCase].quote}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Navigation Arrows */}
            <div
              className={`flex ${
                isRTL ? "flex-row-reverse" : "flex-row"
              } justify-between mt-6`}
            >
              <button
                onClick={prevCase}
                className="w-12 h-12 rounded-full bg-[#141B28] border border-[#C1A875]/20 
                  hover:border-[#C1A875] flex items-center justify-center transition-all"
              >
                {isRTL ? (
                  <ChevronRight className="w-5 h-5" />
                ) : (
                  <ChevronLeft className="w-5 h-5" />
                )}
              </button>
              <div className="flex gap-2 items-center">
                {t.studyCases.cases.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentCase(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentCase ? "bg-[#C1A875] w-8" : "bg-gray-600"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={nextCase}
                className="w-12 h-12 rounded-full bg-[#141B28] border border-[#C1A875]/20 
                  hover:border-[#C1A875] flex items-center justify-center transition-all"
              >
                {isRTL ? (
                  <ChevronLeft className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 md:px-6 bg-[#141B28]/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            {t.benefits.title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {t.benefits.items.map((item, index) => (
              <motion.div
                key={index}
                initial={{ x: isRTL ? 50 : -50, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className={`flex ${
                  isRTL ? "flex-row-reverse" : "flex-row"
                } items-start gap-4 p-4 
                  rounded-lg bg-[#141B28]/50 border border-[#C1A875]/10`}
              >
                <CheckCircle2 className="w-6 h-6 text-[#C1A875] flex-shrink-0 mt-1" />
                <p className="text-gray-300">{item}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <button
              onClick={handleGetStarted}
              className="group relative px-12 py-5 bg-gradient-to-r from-[#C1A875] to-[#B09865] 
                rounded-full text-[#0A0F18] text-lg font-bold
                hover:shadow-2xl hover:shadow-[#C1A875]/30 transition-all duration-300
                transform hover:scale-105"
            >
              <span
                className={`flex ${
                  isRTL ? "flex-row-reverse" : "flex-row"
                } items-center gap-3`}
              >
                {t.cta.button}
                <ArrowRight
                  className={`w-5 h-5 group-hover:translate-x-1 transition-transform ${
                    isRTL ? "rotate-180" : ""
                  }`}
                />
              </span>
            </button>
            <p className="text-gray-400 mt-6">{t.cta.subtitle}</p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 md:px-6 border-t border-[#C1A875]/10">
        <div className="max-w-6xl mx-auto">
          <div
            className={`flex ${
              isRTL ? "flex-row-reverse" : "flex-row"
            } flex-wrap justify-center gap-8 text-sm text-gray-400`}
          >
            {t.footer.links.map((link, index) => (
              <button
                key={index}
                className="hover:text-[#C1A875] transition-colors"
              >
                {link}
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-gray-500 mt-6">
            © 2024 Smart Boss.{" "}
            {language === "en" ? "All rights reserved." : "כל הזכויות שמורות."}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function OnboardingPage() {
  return <OnboardingContent />;
}
