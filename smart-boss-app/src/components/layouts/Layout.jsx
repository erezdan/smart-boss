import React, { useState, useEffect } from "react";
import { useLanguage } from "../../hooks/useLanguage";
import ChatScreen from "../ChatScreen";
import SideDrawer from "../SideDrawer";

export default function Layout() {
  const { isRTL } = useLanguage();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("insights");
  const [isDesktop, setIsDesktop] = useState(false);

  // Detect desktop/mobile
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div
      className={`
        h-screen w-screen overflow-hidden bg-[#F7F7F9]
        flex
        ${isDesktop ? (isRTL ? "flex-row-reverse" : "flex-row") : "flex-col"}
      `}
    >
      {/* DESKTOP MODE */}
      {isDesktop && (
        <>
          {/* Drawer column */}
          <div
            className={`
              w-[30vw] min-w-[420px] h-full bg-[#0A0F18]
              ${isRTL ? "border-r" : "border-l"} border-black/20
            `}
          >
            <SideDrawer
              isOpen={true}
              onClose={() => {}}
              activeSection={activeSection}
              onSectionChange={setActiveSection}
              desktopMode={true}
            />
          </div>

          {/* Chat column */}
          <div className="flex-1 h-full">
            <ChatScreen onMenuClick={() => {}} desktopMode={true} />
          </div>
        </>
      )}

      {/* MOBILE MODE */}
      {!isDesktop && (
        <>
          <div className="flex-1 h-full">
            <ChatScreen
              onMenuClick={() => setIsDrawerOpen(true)}
              desktopMode={false}
            />
          </div>

          <SideDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            desktopMode={false}
          />
        </>
      )}
    </div>
  );
}
