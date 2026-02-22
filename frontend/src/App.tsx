import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import ServerView from './pages/ServerView';
import CustomerView from './pages/CustomerView';
import OwnerDashboard from './pages/owner/OwnerDashboard';

const AppContent: React.FC = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login' || location.pathname === '/';
  const isOwnerDash = location.pathname.startsWith('/owner');
  const hideNavbar = isLoginPage || isOwnerDash;

  return (
    <div className="app-container">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#ffffff',
            color: '#1a1a1a',
            borderRadius: '16px',
            boxShadow: '0 15px 30px rgba(0,0,0,0.1)',
            fontWeight: '600',
            fontFamily: 'Outfit, sans-serif',
            border: '1px solid rgba(212, 34, 32, 0.1)',
            padding: '16px 24px',
          },
          success: {
            iconTheme: {
              primary: '#d42220',
              secondary: '#fff',
            },
          }
        }}
      />
      {!hideNavbar && <Navbar />}
      <main className={hideNavbar ? "" : "main-content"}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/server" element={<ServerView />} />
          <Route path="/customer/:sessionId" element={<CustomerView />} />
          <Route path="/owner" element={<OwnerDashboard />} />
        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
