import React, { useState, useRef, useEffect } from "react";
import { Mic, Send } from "lucide-react";
import { useLanguage } from "./LanguageContext";

export default function VoiceButton({ onSendMessage }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [showRipple, setShowRipple] = useState(false);
  const textareaRef = useRef(null);
  const { isRTL, language } = useLanguage();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [textInput]);

  const handleVoicePress = () => {
    // Trigger ripple effect
    setShowRipple(true);
    setTimeout(() => setShowRipple(false), 300);

    setIsRecording(!isRecording);

    // Simulate voice recording and transcription
    if (!isRecording) {
      setTimeout(() => {
        const mockTranscription =
          language === "en"
            ? "Show me worker performance today"
            : "הצג לי ביצועי עובדים היום";
        onSendMessage(mockTranscription);
        setIsRecording(false);
      }, 2000);
    }
  };

  const handleSend = () => {
    if (textInput.trim()) {
      onSendMessage(textInput);
      setTextInput("");
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e) => {
    // Enter creates new line (shift+enter also creates new line)
    // We do NOT send on Enter
    if (e.key === "Enter" && !e.shiftKey) {
      // Allow default behavior (new line)
      return;
    }
  };

  return (
    <>
      {/* Fixed Bottom Input Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#F7F7F9] border-t border-gray-200 z-50">
        <div className="max-w-5xl mx-auto px-4 py-2.5">
          <div
            className={`flex ${
              isRTL ? "flex-row-reverse" : "flex-row"
            } items-end gap-2.5`}
          >
            {/* Text Input Container */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={handleKeyDown}
                placeholder={
                  language === "en" ? "Tap to type..." : "...הקש להקליד"
                }
                className={`w-full px-4 py-2.5 bg-white rounded-3xl border border-gray-300 
                  focus:outline-none focus:border-[#C1A875] focus:ring-2 focus:ring-[#C1A875]/20
                  transition-all resize-none overflow-y-auto scrollbar-hide
                  ${isRTL ? "text-right pr-4" : "text-left pl-4"}
                  ${textInput.trim() ? (isRTL ? "pl-11" : "pr-11") : ""}
                  text-[15px] leading-relaxed`}
                style={{
                  minHeight: "40px",
                  maxHeight: "120px",
                }}
                rows={1}
              />

              {/* Send Button Inside Text Field */}
              {textInput.trim() && (
                <button
                  onClick={handleSend}
                  className={`absolute ${isRTL ? "left-2" : "right-2"} bottom-3 
                    w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-800 
                    flex items-center justify-center
                    transition-all duration-200 active:scale-90
                    shadow-sm`}
                >
                  <Send
                    className={`w-4 h-4 text-white ${
                      isRTL ? "rotate-180" : ""
                    }`}
                  />
                </button>
              )}
            </div>

            {/* Microphone Button - Voice First */}
            <button
              onClick={handleVoicePress}
              className={`relative w-[58px] h-[58px] flex-shrink-0 rounded-full bg-[#0A0F18] border-2 
                flex items-center justify-center shadow-lg
                transition-all duration-200
                ${
                  isRecording
                    ? "border-red-500 ring-4 ring-red-500/30"
                    : "border-[#C1A875] hover:bg-[#141B28]"
                }`}
            >
              {/* Ripple Effect on Press */}
              {showRipple && !isRecording && (
                <div className="absolute inset-0 rounded-full border-2 border-[#C1A875] animate-ping opacity-75" />
              )}

              <Mic
                className={`w-7 h-7 ${
                  isRecording ? "text-red-400" : "text-[#C1A875]"
                }`}
              />
            </button>
          </div>

          {/* Recording Status Indicator */}
          {isRecording && (
            <div className="flex items-center justify-center mt-2 animate-fade-in">
              <div className="bg-red-500 text-white text-xs px-3 py-1 rounded-full shadow-md flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span>{language === "en" ? "Listening..." : "...מאזין"}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
