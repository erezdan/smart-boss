import React, { useState, useEffect, useRef } from "react";
import { useLanguage } from "../../hooks/useLanguage";
import ChatScreen from "../ChatScreen";
import SideDrawer from "../Drawer/SideDrawer";
import { UserStore } from "../../data-access/UserStore";

export default function Layout() {
  const { isRTL } = useLanguage();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("insights");
  const [isDesktop, setIsDesktop] = useState(false);

  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const user = UserStore((s) => s.user);
  const swipeRTLRef = useRef(true);

  useEffect(() => {
    swipeRTLRef.current = user?.prefs?.drawer_swipe_rtl ?? true;
  }, [user?.prefs?.drawer_swipe_rtl]);

  const SWIPE_THRESHOLD = 80;
  const EDGE_THRESHOLD = 30;

  const handleTouchStart = (e) => {
    if (isDrawerOpen) return;

    const rawX = e.touches[0].clientX;
    const screenWidth = window.innerWidth;
    const isSwipeRTL = swipeRTLRef.current;

    // Allow gesture only from the correct screen edge
    const validEdge = isSwipeRTL
      ? rawX > screenWidth - EDGE_THRESHOLD // right edge
      : rawX < EDGE_THRESHOLD; // left edge

    if (!validEdge) {
      touchStartX.current = null;
      return;
    }

    touchStartX.current = normalizeX(rawX);
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (isDrawerOpen) return;

    const startX = touchStartX.current;
    if (startX === null) return;

    const endX = normalizeX(e.changedTouches[0].clientX);
    const endY = e.changedTouches[0].clientY;

    const dx = endX - startX;
    const dy = endY - touchStartY.current;

    if (Math.abs(dx) <= Math.abs(dy)) return;

    const isSwipeRTL = swipeRTLRef.current;

    const shouldOpen = isSwipeRTL
      ? dx < -SWIPE_THRESHOLD // RTL
      : dx > SWIPE_THRESHOLD; // LTR

    if (shouldOpen) {
      setIsDrawerOpen(true);
    }
  };
  const normalizeX = (x) => {
    return isRTL ? window.innerWidth - x : x;
  };

  // Detect desktop/mobile
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div className={isRTL ? "direction-rtl" : "direction-ltr"}>
      <div
        className={`
          h-screen w-screen overflow-hidden bg-[#F7F7F9]
          flex
          ${isDesktop ? "flex-row" : "flex-col"}
        `}
      >
        {/* DESKTOP MODE */}
        {isDesktop && (
          <div
            className={`
              flex h-full w-full
              ${isRTL ? "flex-row-reverse" : "flex-row"}
            `}
          >
            {/* Drawer column */}
            <div
              className={`
                w-[30vw] min-w-[420px] h-full bg-[#0A0F18]
                ${isRTL ? "border-l" : "border-r"} border-black/20
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
          </div>
        )}

        {/* MOBILE MODE */}
        {!isDesktop && (
          <>
            <div
              className="flex-1 h-full"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
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
    </div>
  );
}
