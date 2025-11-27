import React, { useState, createContext, useContext } from "react";

const TabsContext = createContext();

/**
 * Root Tabs container
 */
export function Tabs({ defaultValue, children, className = "" }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

/**
 * List of tab triggers
 */
export function TabsList({ children, className = "" }) {
  return (
    <div
      className={`flex space-x-2 border-b border-gray-200 dark:border-gray-700 pb-2 ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Single tab trigger
 */
export function TabsTrigger({ value, children, className = "" }) {
  const { value: active, setValue } = useContext(TabsContext);
  const isActive = active === value;

  return (
    <button
      onClick={() => setValue(value)}
      className={`
        text-sm px-4 py-2 rounded-t-md transition-colors
        ${
          isActive
            ? "bg-white text-blue-600 font-semibold border border-b-0 border-gray-200 dark:bg-gray-800 dark:text-blue-400 dark:border-gray-700"
            : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
        }
        ${className}
      `}
    >
      {children}
    </button>
  );
}

/**
 * Content for the active tab
 */
export function TabsContent({ value, children, className = "" }) {
  const { value: active } = useContext(TabsContext);
  if (value !== active) return null;
  return <div className={`pt-4 ${className}`}>{children}</div>;
}
