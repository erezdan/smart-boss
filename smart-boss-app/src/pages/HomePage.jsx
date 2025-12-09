import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase"; // Firebase auth
import Layout from "../components/layouts/Layout";

export default function HomePage() {
  const navigate = useNavigate();

  useEffect(() => {
    // 1) Block access if user is NOT logged in
    if (!auth.currentUser) {
      navigate("/login", { replace: true });
      return;
    }

    // 2) Block if onboarding not completed
    const hasOnboarding = localStorage.getItem("onboardingCompleted") === "yes";

    if (!hasOnboarding) {
      navigate("/onboarding", { replace: true });
      return;
    }

    // 3) Block if bubble-survey not completed
    const hasSurvey = localStorage.getItem("bubblesSurveyCompleted") === "yes";

    if (!hasSurvey) {
      navigate("/bubbles-survey", { replace: true });
      return;
    }
  }, [navigate]);

  return <Layout />;
}
