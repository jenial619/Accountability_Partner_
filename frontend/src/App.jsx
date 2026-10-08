<<<<<<< HEAD
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import * as LandingMod from './pages/LandingPages.jsx';
import * as LoginMod from './pages/Login.jsx';
import * as RegisterMod from './pages/Register.jsx';
import * as DashMod from './pages/Dashboard.jsx';
import * as GoalsMod from './pages/Goals.jsx';
import * as CreateGoalMod from './pages/CreateGoal.jsx';
import * as EditGoalMod from './pages/EditGoal.jsx';
import * as PartnerMod from './pages/Partner.jsx';
import * as ProfileMod from './pages/Profile.jsx';
import * as WorkspaceMod from './pages/WorkspacePages.jsx';

const getComp = (m) => m.default || Object.values(m).find(v => typeof v === 'function') || (() => <div>Page Ready</div>);

const LandingPage = getComp(LandingMod);
const Login = getComp(LoginMod);
const Register = getComp(RegisterMod);
const Dashboard = getComp(DashMod);
const Goals = getComp(GoalsMod);
const CreateGoal = getComp(CreateGoalMod);
const EditGoal = getComp(EditGoalMod);
const Partner = getComp(PartnerMod);
const Profile = getComp(ProfileMod);
const WorkspacePages = getComp(WorkspaceMod);

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<LandingPage />} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/dashboard' element={<Dashboard />} />
        <Route path='/goals' element={<Goals />} />
        <Route path='/goal' element={<Goals />} />
        <Route path='/create-goal' element={<CreateGoal />} />
        <Route path='/edit-goal' element={<EditGoal />} />
        <Route path='/partner' element={<Partner />} />
        <Route path='/partners' element={<Partner />} />
        <Route path='/profile' element={<Profile />} />
        <Route path='/workspace' element={<WorkspacePages />} />
        <Route path='/workspaces' element={<WorkspacePages />} />
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </Router>
  );
}
=======
import { BrowserRouter, Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPages";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import GoalsPage from "./pages/Goals";

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
        <Route path="/edit-goal/:id" element={<EditGoal />} />

        <Route path="/goals" element={<GoalsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
>>>>>>> user/sarah
