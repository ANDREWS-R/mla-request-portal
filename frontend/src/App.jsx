import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import theme from './theme';
import PublicHome from './pages/PublicHome';
import DetailedAnalytics from './pages/DetailedAnalytics';
import CitizenDashboard from './pages/CitizenDashboard';
import Login from './pages/Login';
import DashboardPortal from './pages/DashboardPortal';
import apiService from './services/api';

// Route Protection component
const ProtectedRoute = ({ children, allowedRole }) => {
  const user = apiService.getCurrentUser();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRole && user.role !== allowedRole) {
    if (user.role === 'MLA') {
      return <Navigate to="/mla/dashboard" replace />;
    } else if (user.role === 'STAFF') {
      return <Navigate to="/staff/dashboard" replace />;
    } else {
      return <Navigate to="/citizen/dashboard" replace />;
    }
  }
  
  return children;
};

export default function App() {
  const handleLogout = () => {
    apiService.logout();
    window.location.href = '/login';
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<PublicHome />} />
          <Route path="/analytics" element={<DetailedAnalytics />} />
          <Route path="/login" element={<Login />} />
          
          {/* Protected Dashboard Routes */}
          <Route 
            path="/citizen/dashboard" 
            element={
              <ProtectedRoute allowedRole="CITIZEN">
                <CitizenDashboard onLogout={handleLogout} />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/mla/dashboard" 
            element={
              <ProtectedRoute allowedRole="MLA">
                <DashboardPortal onLogout={handleLogout} />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/staff/dashboard" 
            element={
              <ProtectedRoute allowedRole="STAFF">
                <DashboardPortal onLogout={handleLogout} />
              </ProtectedRoute>
            } 
          />
          
          {/* Wildcard Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
