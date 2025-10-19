import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';

// Import dashboard components
import Dashboard from './pages/Dashboard.tsx';
import Credentials from './pages/Credentials.tsx';
import Accounts from './pages/Accounts.tsx';
import Audit from './pages/Audit.tsx';
import Settings from './pages/Settings.tsx';
import Layout from './components/Layout.tsx';

function App() {
  // Mock user for demo
  const mockUser = {
    username: 'demo@vaultpilot.com',
    attributes: {
      email: 'demo@vaultpilot.com'
    }
  };

  const mockSignOut = () => {
    alert('Sign out functionality requires Cognito setup');
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Layout user={mockUser} signOut={mockSignOut}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/credentials" element={<Credentials />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/audit" element={<Audit />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </div>
    </Router>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);