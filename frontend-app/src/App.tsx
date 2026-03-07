
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import HospitalPortal from './pages/HospitalPortal';
import PatientPortal from './pages/PatientPortal';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/hospital" element={<HospitalPortal />} />
        <Route path="/patient" element={<PatientPortal />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </Router>
  );
}
