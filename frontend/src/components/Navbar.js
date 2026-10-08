import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../api/AuthContext';
import NotificationBell from './NotificationBell';
import ThemeSelector from './ThemeSelector';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }) => isActive ? 'navbar-active' : undefined;

  return (
    <div className="navbar">
      <div className="brand" onClick={() => navigate(user ? (user.role === 'admin' ? '/admin' : user.role === 'mentor' ? '/mentor-dashboard' : '/dashboard') : '/login')}>
        <span className="brand-icon">🚀</span>
        Startup Resource Hub
      </div>

      <div className="navbar-links">
        {user ? (
          <>
            {/* Admin Navigation */}
            {user.role === 'admin' && (
              <>
                <NavLink to="/admin" className={linkClass}>Admin Panel</NavLink>
                <NavLink to="/search" className={linkClass}>Search</NavLink>
                <NavLink to="/chatbot" className={linkClass}>AI Chat</NavLink>
              </>
            )}

            {/* Founder Navigation */}
            {user.role === 'founder' && (
              <>
                <NavLink to="/dashboard" className={linkClass}>Cockpit</NavLink>
                <NavLink to="/readiness" className={linkClass}>Readiness & Gaps</NavLink>
                <NavLink to="/roadmap" className={linkClass}>Roadmap</NavLink>
                <NavLink to="/search" className={linkClass}>Search</NavLink>
                <NavLink to="/applications" className={linkClass}>My Tracker</NavLink>
                <NavLink to="/mentors" className={linkClass}>Find Mentor</NavLink>
                <NavLink to="/chatbot" className={linkClass}>AI Chat</NavLink>
                <NavLink to="/profile" className={linkClass}>Profile</NavLink>
              </>
            )}

            {/* Mentor Navigation */}
            {user.role === 'mentor' && (
              <>
                <NavLink to="/mentor-dashboard" className={linkClass}>Dashboard</NavLink>
                <NavLink to="/mentor-requests" className={linkClass}>Requests & Mentees</NavLink>
                <NavLink to="/search" className={linkClass}>Search</NavLink>
                <NavLink to="/chatbot" className={linkClass}>AI Chat</NavLink>
                <NavLink to="/profile" className={linkClass}>Profile</NavLink>
              </>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 6 }}>
              <span className="role-pill" style={{ fontSize: 10 }}>{user.role}</span>
              <ThemeSelector />
              <NotificationBell />
              <span className="navbar-divider"></span>
              <span className="link" onClick={handleLogout} style={{ color: '#f87171' }}>Logout</span>
            </div>
          </>
        ) : (
          <>
            <ThemeSelector />
            <NavLink to="/login" className={linkClass}>Login</NavLink>
            <NavLink to="/register" className="navbar-cta">Register Free →</NavLink>
          </>
        )}
      </div>
    </div>
  );
}
