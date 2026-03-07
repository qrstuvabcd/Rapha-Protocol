
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import HospitalPortal from './pages/HospitalPortal';
import PatientPortal from './pages/PatientPortal';
import { LegacyLandingPage } from './pages/LegacyLandingPage';
import { Whitepaper } from './pages/Whitepaper';
import AIResearchPortal from './pages/AIResearchPortal';
import { KeeperDashboard } from './pages/KeeperDashboard';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/hospital" element={<HospitalPortal />} />
        <Route path="/patient" element={<PatientPortal />} />
        <Route path="/legacy" element={<LegacyLandingPage />} />
        <Route path="/whitepaper" element={<Whitepaper />} />
        <Route path="/research" element={<AIResearchPortal />} />
        <Route path="/keeper" element={<KeeperDashboard />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </Router>
  );
}
