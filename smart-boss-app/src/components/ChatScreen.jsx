import React, { useState, useRef, useEffect } from "react";
import { Menu, Bot, X } from "lucide-react";
import { useLanguage } from "../hooks/useLanguage";
import ChatBubble from "./ChatBubble";
import ChatInput from "./ChatInput";
import ModalExpand from "./ModalExpand";
import { mockMessages } from "../mocks/mokeData";

export default function ChatScreen({ onMenuClick, desktopMode = false }) {
  const { language, isRTL, t } = useLanguage();
  const [messages, setMessages] = useState(mockMessages[language]);
  const [expandedMessage, setExpandedMessage] = useState(null);
  const chatEndRef = useRef(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const initialRenderRef = useRef(true);

  useEffect(() => {
    setMessages(mockMessages[language]);
  }, [language]);

  useEffect(() => {
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      return; // Skip scrolling on initial render
    }

    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Swipe gesture for mobile ---
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;

    const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
    const isStrong = Math.abs(deltaX) > 80;
    if (!isHorizontal || !isStrong) return;

    if (!isRTL) {
      // ==========================
      // LTR (original behavior)
      // ==========================
      const fromRightEdge = touchStartX.current > window.innerWidth - 50;
      if (fromRightEdge && deltaX < -80) {
        onMenuClick();
      }
    } else {
      // ==========================
      // RTL (mirrored behavior)
      // ==========================
      const fromLeftEdge = touchStartX.current < 50;
      if (fromLeftEdge && deltaX > 80) {
        onMenuClick();
      }
    }
  };

  // --- Send message ---
  const handleSendMessage = (content) => {
    const userMessage = {
      id: Date.now(),
      type: "user",
      content,
      timestamp: new Date().toLocaleTimeString(
        language === "en" ? "en-US" : "he-IL",
        { hour: "2-digit", minute: "2-digit" }
      ),
    };
    setMessages((prev) => [...prev, userMessage]);

    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        type: "ai",
        subtype: "insight",
        content: t("analyzingYourRequest"),
        timestamp: new Date().toLocaleTimeString(
          language === "en" ? "en-US" : "he-IL",
          { hour: "2-digit", minute: "2-digit" }
        ),
        expandable: {
          title: t("workerPerformanceToday"),
          details: t("workerPerformanceDetails"),
          metrics: { current: 87, average: 82, trend: "up" },
        },
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1500);
  };

  return (
    <div
      className={`${
        desktopMode ? "h-full" : "h-screen"
      } flex flex-col bg-[#F7F7F9] relative`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* HEADER – MOBILE (same logic as desktop) */}
      {!desktopMode && (
        <div className="bg-[#0A0F18] px-4 md:px-6 py-4 shadow-lg">
          <div className="flex items-center justify-between">
            {/* === LOGO + TITLE (same as desktop) === */}
            <div
              dir="ltr"
              className={`
          flex items-center gap-4
          ${isRTL ? "justify-end" : "justify-start"}
          flex-row
        `}
            >
              {isRTL ? (
                <>
                  {/* Text FIRST (like desktop RTL) */}
                  <div className="text-right">
                    <h1 className="text-xl font-bold text-white tracking-tight">
                      SMART BOSS
                    </h1>
                    <p className="text-xs text-gray-400">
                      {t("aiBusinessAssistant")}
                    </p>
                  </div>

                  {/* Logo SECOND (like desktop RTL) */}
                  <img
                    src="/images/smart_boss_logo_only-transperent.png"
                    alt="Smart Boss Logo"
                    className="w-8 h-8 object-contain scale-[1.15]"
                  />
                </>
              ) : (
                <>
                  {/* Logo FIRST (like desktop LTR) */}
                  <img
                    src="/images/smart_boss_logo_only-transperent.png"
                    alt="Smart Boss Logo"
                    className="w-8 h-8 object-contain scale-[1.15]"
                  />

                  {/* Text SECOND (like desktop LTR) */}
                  <div className="text-left">
                    <h1 className="text-xl font-bold text-white tracking-tight">
                      SMART BOSS
                    </h1>
                    <p className="text-xs text-gray-400">
                      {t("aiBusinessAssistant")}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Sidebar button */}
            <button
              onClick={onMenuClick}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <Menu className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto px-0 md:px-4 py-6 pb-28">
        <div className="w-full flex justify-center">
          <div
            className={`
        w-full
        ${desktopMode ? "max-w-4xl" : "max-w-[95%]"}
        flex flex-col gap-6
        px-4 md:px-6
        ${isRTL ? "items-end" : "items-start"}
      `}
          >
            {/* Welcome */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#C1A875] to-[#B09865] mb-3">
                <Bot className="w-8 h-8 text-white" />
              </div>

              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {t("welcomeTitle")}
              </h2>

              <p className="text-sm text-gray-500 max-w-md mx-auto">
                {t("analyzingYourRequestShort")}
              </p>
            </div>

            {/* Messages */}
            {messages.map((message) => (
              <ChatBubble
                key={message.id}
                message={message}
                onExpand={setExpandedMessage}
              />
            ))}
            <div ref={chatEndRef} />
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div
        className={`
    ${desktopMode ? "sticky" : "fixed"}
    bottom-0 
    left-0 
    right-0 
    bg-[#ECECEC]
    py-4 md:py-6
    px-4 md:px-8
    flex
    justify-center md:justify-start
    ${desktopMode ? "" : "pb-[env(safe-area-inset-bottom)]"}
    z-50
  `}
      >
        <div
          className={`
      w-full
      max-w-3xl
      md:w-[calc(100%-100px)]
      ${isRTL ? "md:ml-auto md:mr-[100px]" : "md:mr-auto md:ml-[100px]"}
    `}
        >
          <ChatInput onSendMessage={handleSendMessage} />
        </div>
      </div>

      {/* Modal */}
      {expandedMessage && (
        <ModalExpand
          message={expandedMessage}
          onClose={() => setExpandedMessage(null)}
        />
      )}
    </div>
  );
}
