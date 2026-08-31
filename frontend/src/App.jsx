import { BrowserRouter, Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPages";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import { Goals, Partners, Profile } from "./pages/WorkspacePages";

import Goals from "./pages/Goals";
import Partner from "./pages/Partner";
import Profile from "./pages/Profile";
import CreateGoal from "./pages/CreateGoal";
function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<LandingPage />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/partners" element={<Partners />} />
        <Route path="/profile" element={<Profile />} />

        <Route
          path="/goals"
          element={<Goals />}
        />

        <Route
          path="/partners"
          element={<Partner />}
        />

        <Route
          path="/profile"
          element={<Profile />}
        />

        <Route
          path="/create-goal"
          element={<CreateGoal />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
