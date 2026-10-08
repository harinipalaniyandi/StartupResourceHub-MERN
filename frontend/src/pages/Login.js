import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../api/AuthContext';
import { useToast } from '../api/ToastContext';

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message] = useState(location.state?.message || '');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', form);
      login(res.data.token, res.data.user);
      showToast(`Welcome back, ${res.data.user.name}! 🚀`);

      if (res.data.user.role === 'admin') navigate('/admin');
      else if (res.data.user.role === 'mentor') navigate('/mentor-dashboard');
      else navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.needsVerification) {
        showToast('Please verify your email address to continue.', 'error');
        navigate('/verify-otp', { state: { email: err.response.data.email } });
        return;
      }
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left branding panel */}
      <div className="auth-brand-panel">
        <div className="auth-brand-logo">🚀 STARTUP RESOURCE HUB</div>
        <h2>Every opportunity your<br />startup needs, matched<br />by AI.</h2>
        <p>Verified government grants, seed funds, mentors, tools, and compliance intelligence — ranked specifically for your stage and domain.</p>

        <div className="auth-feature-list">
          <div className="auth-feature-item"><span className="auth-feature-dot"></span> AI-powered match scoring for every opportunity</div>
          <div className="auth-feature-item"><span className="auth-feature-dot"></span> 8-dimension readiness & opportunity gap detector</div>
          <div className="auth-feature-item"><span className="auth-feature-dot"></span> Verified grants with upcoming deadline intelligence</div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-form-panel">
        <div className="auth-form-box">
          <h1>Welcome back</h1>
          <p className="auth-subtitle">Log in to your Startup Resource Hub dashboard.</p>

          {error && <div className="error">{error}</div>}
          {message && <div className="success">{message}</div>}

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@startup.com"
                required
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>

            <div className="auth-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label htmlFor="password" style={{ margin: 0 }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: 12, color: '#818cf8', fontWeight: 600 }}>
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                required
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Log in to SRH →'}
            </button>
          </form>

          <div className="auth-divider">NEW HERE</div>

          <p className="auth-footer-text">
            Don't have an account? <Link to="/register">Create one for free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
