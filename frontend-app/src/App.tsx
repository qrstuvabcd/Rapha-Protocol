import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        {/* Failsafe wildcard route: redirects any broken links to the homepage so the app never crashes */}
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </Router>
  );
}
