//import { useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  //useNavigate,
  //useLocation,
} from "react-router-dom";

import HomePage from "./pages/HomePage";
import OnboardingPage from "./pages/OnboardingPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />

      {/* 404 fallback */}
      <Route path="*" element={<div>Page Not Found</div>} />
    </Routes>
  );
}

export default App;
