import React, { useState, useRef, useEffect } from "react";
import { Menu, Bot } from "lucide-react";
import { useLanguage } from "../hooks/useLanguage";
import ChatBubble from "./ChatBubble";
import VoiceButton from "./VoiceButton";
import ModalExpand from "./ModalExpand";
import { mockMessages } from "../mocks/mokeData";

export default function ChatScreen({ onMenuClick }) {
  const { language, isRTL } = useLanguage();
  const [messages, setMessages] = useState(mockMessages[language]);
  const [expandedMessage, setExpandedMessage] = useState(null);
  const chatEndRef = useRef(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const containerRef = useRef(null);

  useEffect(() => {
    setMessages(mockMessages[language]);
  }, [language]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Swipe gesture detection
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;

    // Check if horizontal swipe is dominant (not vertical scroll)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 80) {
      // Unified: swipe right-to-left (from right edge) opens drawer
      const isFromRightEdge = touchStartX.current > window.innerWidth - 50;

      if (isFromRightEdge && deltaX < -80) {
        onMenuClick();
      }
    }
  };

  const handleSendMessage = (content) => {
    const userMessage = {
      id: Date.now(),
      type: "user",
      content,
      timestamp: new Date().toLocaleTimeString(
        language === "en" ? "en-US" : "he-IL",
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      ),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        type: "ai",
        subtype: "insight",
        content:
          language === "en"
            ? "Analyzing your request... Here are the worker performance metrics for today."
            : "מנתח את בקשתך... הנה מדדי הביצועים של העובדים להיום.",
        timestamp: new Date().toLocaleTimeString(
          language === "en" ? "en-US" : "he-IL",
          {
            hour: "2-digit",
            minute: "2-digit",
          }
        ),
        expandable: {
          title:
            language === "en"
              ? "Worker Performance Today"
              : "ביצועי עובדים היום",
          details:
            language === "en"
              ? "Overall performance is good. Sarah leading in efficiency, Danny needs attention."
              : "ביצועים כלליים טובים. שרה מובילה ביעילות, דני זקוק לתשומת לב.",
          metrics: { current: 87, average: 82, trend: "up" },
        },
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1500);
  };

  return (
    <div
      ref={containerRef}
      className="h-full flex flex-col bg-[#F7F7F9]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="bg-[#0A0F18] px-4 md:px-6 py-4 shadow-lg">
        <div
          className={`flex ${
            isRTL ? "flex-row-reverse" : "flex-row"
          } items-center justify-between`}
        >
          <div
            className={`flex ${
              isRTL ? "flex-row-reverse" : "flex-row"
            } items-center gap-3`}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C1A875] to-[#B09865] flex items-center justify-center">
              <Bot className="w-6 h-6 text-[#0A0F18]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                BOSS
              </h1>
              <p className="text-xs text-gray-400">
                {language === "en" ? "AI Business Assistant" : "עוזר עסקי AI"}
              </p>
            </div>
          </div>
          <button
            onClick={onMenuClick}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center
              transition-colors"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 pb-24">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Message */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#C1A875] to-[#B09865] mb-3">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {language === "en" ? "Welcome to BOSS" : "ברוכים הבאים ל-BOSS"}
            </h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              {language === "en"
                ? "Your AI-powered business assistant is ready. Use voice or text to get insights, alerts, and manage your business."
                : "העוזר העסקי המונע על ידי AI שלך מוכן. השתמש בקול או טקסט כדי לקבל תובנות, התראות ולנהל את העסק שלך."}
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

      {/* Voice Button */}
      <VoiceButton onSendMessage={handleSendMessage} />

      {/* Expanded Modal */}
      {expandedMessage && (
        <ModalExpand
          message={expandedMessage}
          onClose={() => setExpandedMessage(null)}
        />
      )}
    </div>
  );
}
