import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard'; // Make sure this matches your actual dashboard filename

import './App.css';

// 1. Clever wrappers to keep your old switch buttons working perfectly
function LoginRoute() {
  const navigate = useNavigate();
  return <Login onSwitchToRegister={() => navigate('/register')} />;
}

function RegisterRoute() {
  const navigate = useNavigate();
  return <Register onSwitchToLogin={() => navigate('/login')} />;
}

// 2. The Security Guard: Prevents logged-out users from seeing the dashboard
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  // Show a loading spinner while checking authentication status
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // If they aren't logged in, kick them back to the login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If they are logged in, let them through
  return children;
}

// 3. The Main App Router
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes (Anyone can see these) */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/register" element={<RegisterRoute />} />

          {/* Protected Route (Must be logged in) */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />

          {/* Catch-All Route: Redirects any unknown URLs back to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}