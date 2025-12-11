// src/components/ErrorBoundary.jsx
import React from "react";
import { useLanguage } from "../hooks/useLanguage";

// Functional wrapper to inject language context into class component
/* eslint-disable no-unused-vars */
function withLanguage(Component) {
  return function Wrapper(props) {
    const { t, isRTL } = useLanguage();
    return <Component {...props} t={t} isRTL={isRTL} />;
  };
}

class ErrorBoundaryInner extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      const { t, isRTL } = this.props;

      return (
        <div
          dir={isRTL ? "rtl" : "ltr"}
          style={{
            background: "#0A0F18",
            color: "white",
            padding: "40px",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: isRTL ? "right" : "left",
          }}
        >
          <h1 style={{ color: "#C1A875", marginBottom: "16px" }}>
            {t("errorBoundaryTitle")}
          </h1>

          <p style={{ maxWidth: "500px", marginBottom: "24px" }}>
            {t("errorBoundarySubtitle")}
          </p>

          {this.state.error && (
            <pre
              style={{
                background: "#1A1F2B",
                padding: "16px",
                borderRadius: "8px",
                maxWidth: "90%",
                overflowX: "auto",
                textAlign: "left",
                direction: "ltr",
                color: "#ffcccc",
                border: "1px solid #333",
                fontSize: "14px",
              }}
            >
              {String(this.state.error)}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

const ErrorBoundary = withLanguage(ErrorBoundaryInner);
export default ErrorBoundary;
