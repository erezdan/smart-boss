import React, { useState, createContext, useContext } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from "framer-motion";

const SheetContext = createContext();

/**
 * Root Sheet component
 */
export function Sheet({ children, open, onOpenChange }) {
  const [internalOpen, setInternalOpen] = useState(false);

  // Use external state if provided, otherwise use internal state
  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  return (
    <SheetContext.Provider value={{ open: isOpen, setOpen: setIsOpen }}>
      {children}
    </SheetContext.Provider>
  );
}

/**
 * Trigger element for Sheet
 */
export function SheetTrigger({ children }) {
  const { setOpen } = useContext(SheetContext);

  return (
    <div onClick={() => setOpen(true)} className="cursor-pointer">
      {children}
    </div>
  );
}

/**
 * Side panel content
 */
export function SheetContent({ children, className = "", side = "right" }) {
  const { open, setOpen } = useContext(SheetContext);

  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/60 z-[9999]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />

          {/* Side Panel */}
          <motion.div
            className={`
              fixed top-0 ${side === "right" ? "right-0" : "left-0"}
              h-full w-[60vw] max-w-md flex flex-col shadow-xl z-[10000]
              bg-white text-gray-900
              dark:bg-gray-900 dark:text-gray-100
              backdrop-blur-sm
              ${className}
            `}
            initial={{ x: side === "right" ? "100%" : "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: side === "right" ? "100%" : "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

/**
 * Header section for the Sheet
 */
export function SheetHeader({ children, className = "" }) {
  const { setOpen } = useContext(SheetContext);

  return (
    <div
      className={`flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 ${className}`}
    >
      {children}
      <button
        onClick={() => setOpen(false)}
        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

/**
 * Title for the Sheet
 */
export function SheetTitle({ children, className = "" }) {
  return (
    <h2
      className={`text-lg font-semibold text-gray-900 dark:text-gray-100 ${className}`}
    >
      {children}
    </h2>
  );
}
