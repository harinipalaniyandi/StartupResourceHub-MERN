import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './api/AuthContext';
import { ToastProvider } from './api/ToastContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import ReadinessAnalyzer from './pages/ReadinessAnalyzer';
import Roadmap from './pages/Roadmap';
import Search from './pages/Search';
import Chatbot from './pages/Chatbot';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import MyApplications from './pages/MyApplications';
import Mentors from './pages/Mentors';
import MentorRequests from './pages/MentorRequests';
import MentorDashboard from './pages/MentorDashboard';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Founder Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/readiness" element={<ProtectedRoute><ReadinessAnalyzer /></ProtectedRoute>} />
            <Route path="/roadmap" element={<ProtectedRoute><Roadmap /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
            <Route path="/applications" element={<ProtectedRoute><MyApplications /></ProtectedRoute>} />
            <Route path="/mentors" element={<ProtectedRoute><Mentors /></ProtectedRoute>} />
            <Route path="/chatbot" element={<ProtectedRoute><Chatbot /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            {/* Mentor Routes */}
            <Route path="/mentor-dashboard" element={<ProtectedRoute><MentorDashboard /></ProtectedRoute>} />
            <Route path="/mentor-requests" element={<ProtectedRoute><MentorRequests /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
