import React from "react";
import DesktopSidebar from "./DesktopSidebar";
import SideDrawer from "./SideDrawer";
import DesktopHeader from "./DesktopHeader";

export default function AppLayout({
  children,
  activeSection,
  onSectionChange,
  isDrawerOpen,
  setIsDrawerOpen,
}) {
  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#F7F7F9]">
      {/* ===== GLOBAL DESKTOP HEADER ===== */}
      <DesktopHeader />

      {/* ===== SIDEBAR (Desktop Only) ===== */}
      <div className="hidden md:flex">
        <DesktopSidebar
          activeSection={activeSection}
          onSectionChange={onSectionChange}
        />
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div
        className={`
          flex-1 relative h-full overflow-hidden
          ${"md:mt-[70px]"}  /* pushes everything down under header */
        `}
      >
        {children}
      </div>

      {/* ===== MOBILE DRAWER ===== */}
      <SideDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeSection={activeSection}
        onSectionChange={onSectionChange}
      />
    </div>
  );
}
