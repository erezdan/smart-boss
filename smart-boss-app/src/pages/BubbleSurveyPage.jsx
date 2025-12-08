import React, { useState } from "react";
// eslint-disable-next-line
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { useLanguage } from "../hooks/useLanguage";
import { useNavigate } from "react-router-dom";
import { content } from "../context/bubbleSurveyContent";

function BubbleSurveyContent() {
  const navigate = useNavigate();
  const { language, isRTL } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const [selections, setSelections] = useState({
    step1: [],
    step2: [],
    step3: [],
    step4: [],
    step5: [],
  });
  const [showFinal, setShowFinal] = useState(false);

  const t = content[language];
  const totalSteps = t.steps.length;
  const currentStepData = t.steps[currentStep - 1];

  const toggleSelection = (bubble) => {
    const stepKey = `step${currentStep}`;
    const currentSelections = selections[stepKey];

    if (currentSelections.includes(bubble)) {
      setSelections({
        ...selections,
        [stepKey]: currentSelections.filter((item) => item !== bubble),
      });
    } else {
      setSelections({
        ...selections,
        [stepKey]: [...currentSelections, bubble],
      });
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowFinal(true);
    }
  };

  const handleBack = () => {
    if (showFinal) {
      setShowFinal(false);
      return;
    }
    if (currentStep > 1) {
      setShowFinal(false);
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    localStorage.setItem("bubblesSurveyCompleted", "yes");
    navigate("/home", { replace: true });
    ``;
  };

  // -----------------------
  // Summary text builder
  // -----------------------
  const buildSummaryText = () => {
    const map = {
      step1: t.summaryStep1,
      step2: t.summaryStep2,
      step3: t.summaryStep3,
      step4: t.summaryStep4,
      step5: t.summaryStep5,
    };

    let output = `${t.summaryIntro}\n\n`;

    Object.entries(selections).forEach(([step, items]) => {
      output += `• ${map[step]}: `;
      if (!items || items.length === 0) {
        output += `${t.summaryNone}\n`;
      } else {
        output += `${items.join(", ")}\n`;
      }
    });

    return output;
  };

  // -----------------------
  // FINAL SUMMARY PAGE
  // -----------------------
  if (showFinal) {
    const summarySections = [
      { title: t.summaryStep1, items: selections.step1 },
      { title: t.summaryStep2, items: selections.step2 },
      { title: t.summaryStep3, items: selections.step3 },
      { title: t.summaryStep4, items: selections.step4 },
      { title: t.summaryStep5, items: selections.step5 },
    ];

    const summaryText = buildSummaryText();

    return (
      <div className="min-h-screen bg-[#0A0F18] flex flex-col">
        {/* Header */}
        <div className="pt-10 pb-6 px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white leading-snug">
            {t.summaryIntro}
          </h2>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 pb-36 max-w-5xl mx-auto w-full space-y-8">
          {summarySections.map((section, idx) => (
            <div key={idx}>
              <h3 className="text-[#C1A875] text-lg font-semibold mb-3">
                {section.title}
              </h3>

              {section.items.length > 0 ? (
                <ul className="space-y-2 text-base text-gray-200">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#C1A875] text-lg leading-snug">
                        •
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">{t.summaryNone}</p>
              )}
            </div>
          ))}
        </div>

        {/* FIXED FOOTER */}
        <div className="fixed bottom-0 left-0 w-full bg-[#141B28] border-t border-[#C1A875]/10 z-50">
          <div className="max-w-5xl mx-auto px-4 py-6">
            <div
              className={`flex ${
                isRTL ? "flex-row-reverse" : "flex-row"
              } items-center justify-between gap-4`}
            >
              {/* Back */}
              <button
                onClick={handleBack}
                className={`flex ${
                  isRTL ? "flex-row-reverse" : "flex-row"
                } items-center gap-2 px-6 py-3 rounded-full border-2 border-[#C1A875]/30 
                   text-white transition-all duration-300 hover:border-[#C1A875] 
                   hover:bg-[#C1A875]/10`}
              >
                {isRTL ? (
                  <ChevronRight className="w-5 h-5" />
                ) : (
                  <ChevronLeft className="w-5 h-5" />
                )}
                <span className="font-medium">{t.back}</span>
              </button>

              {/* Finish */}
              <button
                onClick={() => handleFinish(summaryText)}
                className={`flex ${
                  isRTL ? "flex-row-reverse" : "flex-row"
                } items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#C1A875] 
                   to-[#B09865] rounded-full text-[#0A0F18] font-bold hover:shadow-lg 
                   hover:shadow-[#C1A875]/30 transition-all duration-300 transform 
                   hover:scale-105`}
              >
                <span>{t.finalButton}</span>
                {isRTL ? (
                  <ChevronLeft className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -----------------------
  // STANDARD SURVEY PAGE
  // -----------------------
  return (
    <div className="min-h-screen bg-[#0A0F18] flex flex-col">
      {/* Progress Bar */}
      <div className="w-full bg-[#141B28] border-b border-[#C1A875]/10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">
              {t.progress} {currentStep}/{totalSteps}
            </span>
            <span className="text-sm text-[#C1A875]">
              {Math.round((currentStep / totalSteps) * 100)}%
            </span>
          </div>

          <div className="w-full h-2 bg-[#0A0F18] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#C1A875] to-[#B09865]"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* Question + bubbles */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 overflow-y-auto pb-40">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-5xl"
          >
            <h2 className="text-2xl md:text-4xl font-bold text-white text-center mb-12 md:mb-16">
              {currentStepData.question}
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {currentStepData.bubbles.map((bubble, index) => {
                const isSelected =
                  selections[`step${currentStep}`].includes(bubble);

                return (
                  <motion.button
                    key={bubble}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: isSelected ? 1.05 : 1,
                    }}
                    transition={{
                      delay: index * 0.05,
                      duration: 0.5,
                      scale: { duration: 0.2 },
                    }}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleSelection(bubble)}
                    className={`relative px-6 py-4 rounded-2xl text-sm md:text-base font-medium
                      transition-all duration-300 border-2
                      ${
                        isSelected
                          ? "bg-gradient-to-br from-[#C1A875] to-[#B09865] text-[#0A0F18] border-[#C1A875] shadow-lg shadow-[#C1A875]/30"
                          : "bg-[#141B28] text-white border-[#C1A875]/20 hover:border-[#C1A875]/50"
                      }`}
                  >
                    {bubble}

                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-[#0A0F18] rounded-full flex items-center justify-center border-2 border-[#C1A875]"
                      >
                        <div className="w-3 h-3 bg-[#C1A875] rounded-full" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation (fixed footer) */}
      <div className="fixed bottom-0 left-0 w-full bg-[#141B28] border-t border-[#C1A875]/10 z-50">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div
            className={`flex ${
              isRTL ? "flex-row-reverse" : "flex-row"
            } items-center justify-between gap-4`}
          >
            {/* Back */}
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`flex ${
                isRTL ? "flex-row-reverse" : "flex-row"
              } items-center gap-2 px-6 py-3 rounded-full border-2 border-[#C1A875]/30 
                text-white transition-all duration-300
                ${
                  currentStep === 1
                    ? "opacity-30 cursor-not-allowed"
                    : "hover:border-[#C1A875] hover:bg-[#C1A875]/10"
                }`}
            >
              {isRTL ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
              <span className="font-medium">{t.back}</span>
            </button>

            {/* Next */}
            <button
              onClick={handleNext}
              className={`flex ${
                isRTL ? "flex-row-reverse" : "flex-row"
              } items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#C1A875] 
                to-[#B09865] rounded-full text-[#0A0F18] font-bold 
                hover:shadow-lg hover:shadow-[#C1A875]/30 transition-all 
                duration-300 transform hover:scale-105`}
            >
              <span>{currentStep === totalSteps ? t.finalButton : t.next}</span>
              {isRTL ? (
                <ChevronLeft className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BubbleSurveyPage() {
  return <BubbleSurveyContent />;
}
