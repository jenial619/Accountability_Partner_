import { BrowserRouter, Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPages";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

import Goals from "./pages/Goals";
import Partner from "./pages/Partner";
import Profile from "./pages/Profile";
import CreateGoal from "./pages/CreateGoal";
import EditGoal from "./pages/EditGoal";
function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<LandingPage />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={<Dashboard />} />
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
        <Route
          path="/edit-goal"
          element={<EditGoal />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
