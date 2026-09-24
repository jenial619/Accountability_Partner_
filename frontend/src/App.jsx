import { BrowserRouter, Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPages";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import GoalsPage from "./pages/Goals";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<LandingPage />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/goals" element={<GoalsPage />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;