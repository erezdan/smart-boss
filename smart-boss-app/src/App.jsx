//import { useState } from "react";
import "./App.css";

import HomePage from "./pages/HomePage";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/boss" replace />} />
        <Route path="/boss" element={<HomePage />} />

        {/* 404 fallback */}
        <Route path="*" element={<div>Page Not Found</div>} />
      </Routes>
    </Layout>
  );
}

export default App;
