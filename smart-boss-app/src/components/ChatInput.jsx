import React, { useState, useRef, useEffect } from "react";
import { Mic, Send } from "lucide-react";
import { useLanguage } from "../hooks/useLanguage";

export default function ChatInput({ onSendMessage }) {
  const [isRecording, setIsRecording] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [showRipple, setShowRipple] = useState(false);
  const textareaRef = useRef(null);
  const { isRTL, t } = useLanguage();

  // Auto-resize
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
    setShowRipple(true);
    setTimeout(() => setShowRipple(false), 300);

    setIsRecording(!isRecording);

    // mock simulation
    if (!isRecording) {
      setTimeout(() => {
        const mock = t("showMeWorkerPerformanceToday");

        onSendMessage(mock);
        setIsRecording(false);
      }, 2000);
    }
  };

  const handleSend = () => {
    if (!textInput.trim()) return;
    onSendMessage(textInput);
    setTextInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  return (
    <div
      className={`flex ${
        isRTL ? "flex-row-reverse" : "flex-row"
      } items-end gap-3 w-full mb-2`}
    >
      {/* Textarea */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder={t("tapToType")}
          className={`
            w-full 
            px-4 py-3 
            bg-white 
            border border-gray-300
            rounded-xl           /* modern, subtle */
            focus:ring-2 focus:ring-[#C1A875]/30
            focus:border-[#C1A875]
            resize-none 
            overflow-y-auto 
            scrollbar-hide
            text-[15px] leading-relaxed
            ${isRTL ? "text-right pr-4" : "text-left pl-4"}
            ${textInput.trim() ? (isRTL ? "pl-12" : "pr-12") : ""}
          `}
          rows={1}
          style={{ minHeight: "42px", maxHeight: "120px" }}
        />

        {/* Send button */}
        {textInput.trim() && (
          <button
            onClick={handleSend}
            className={`
              absolute
              ${isRTL ? "left-3" : "right-3"}
              bottom-3
              w-9 h-9 rounded-full
              bg-gray-700 hover:bg-gray-800
              flex items-center justify-center
              shadow-sm transition
            `}
          >
            <Send
              className={`w-4 h-4 text-white ${isRTL ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </div>

      {/* Mic */}
      <button
        onClick={handleVoicePress}
        className={`
          relative
          w-[58px] h-[58px]
          flex-shrink-0
          rounded-full
          bg-[#0A0F18]
          border-2
          flex items-center justify-center
          shadow-lg
          transition-all duration-200
          ${
            isRecording
              ? "border-red-500 ring-4 ring-red-500/30"
              : "border-[#C1A875] hover:bg-[#141B28]"
          }
        `}
      >
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
  );
}
