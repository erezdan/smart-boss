import React from "react";
import { createRoot } from "react-dom/client";
import { Alert, AlertTitle, AlertDescription } from "./alert";
import { X } from "lucide-react";

/**
 * Custom toast based on your Alert component
 * Supports:
 *  toast("message")
 *  toast({ title, description, variant })
 * Includes close (X) button with better spacing and size.
 */
export function toast(options) {
  const toastData =
    typeof options === "string"
      ? { description: options, variant: "default" }
      : options;

  // Create container if not exists
  let container = document.getElementById("custom-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "custom-toast-container";
    container.style.position = "fixed";
    container.style.top = "20px";
    container.style.right = "20px";
    container.style.zIndex = 9999;
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "10px";
    container.style.maxWidth = "400px";
    document.body.appendChild(container);
  }

  // Create individual toast
  const toastElement = document.createElement("div");
  container.appendChild(toastElement);
  const root = createRoot(toastElement);

  const handleClose = () => {
    toastElement.style.transition = "opacity 0.3s ease";
    toastElement.style.opacity = 0;
    setTimeout(() => {
      root.unmount();
      toastElement.remove();
      if (container.children.length === 0) container.remove();
    }, 300);
  };

  root.render(
    <div className="relative">
      <Alert variant={toastData.variant || "default"}>
        {/* Close Button */}
        <button
          onClick={handleClose}
          style={{
            position: "absolute",
            top: "6px",
            right: "6px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "inherit",
            opacity: 0.6,
            marginLeft: "16px", // 🔹 More space between the alert icon and the X
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.6)}
        >
          <X className="w-5 h-5" /> {/* 🔹 Large and clear X icon */}
        </button>

        {toastData.title && (
          <AlertTitle className="font-semibold">{toastData.title}</AlertTitle>
        )}
        <AlertDescription>
          {toastData.description || toastData.title}
        </AlertDescription>
      </Alert>
    </div>
  );
}
