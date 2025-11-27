//import { useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  //useNavigate,
  //useLocation,
} from "react-router-dom";

import HomePage from "./pages/HomePage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<HomePage />} />

      {/* 404 fallback */}
      <Route path="*" element={<div>Page Not Found</div>} />
    </Routes>
  );
}

export default App;
