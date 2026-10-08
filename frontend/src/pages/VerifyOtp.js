import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../api/api';
import { useToast } from '../api/ToastContext';

export default function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    if (otp.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setError('');
    setMessage('');
    setLoading(true);

    try {
      await api.post('/auth/verify-otp', { email, otp });
      showToast('Email verified successfully! You can now log in.');
      navigate('/login', { state: { message: 'Email verified! Please log in to your account.' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }

    setError('');
    setMessage('');

    try {
      await api.post('/auth/resend-otp', { email, purpose: 'verification' });
      setMessage(`A fresh 6-digit verification code has been sent to ${email}`);
      showToast('New verification code sent');
      setCooldown(60);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code');
    }
  };

  return (
    <div className="auth-page">
      {/* Brand panel */}
      <div className="auth-brand-panel">
        <div className="auth-brand-logo">🚀 STARTUP RESOURCE HUB</div>
        <h2>One step away from<br />your AI cockpit.</h2>
        <p>We verify every email so founders, mentors, and program partners can connect in a trusted, secure startup community.</p>
        <div className="auth-feature-list">
          <div className="auth-feature-item"><span className="auth-feature-dot"></span> Single-use 6-digit cryptographic OTP</div>
          <div className="auth-feature-item"><span className="auth-feature-dot"></span> 5-minute validity window</div>
          <div className="auth-feature-item"><span className="auth-feature-dot"></span> Resend cooldown rate limiting</div>
        </div>
      </div>

      {/* Form panel */}
      <div className="auth-form-panel">
        <div className="auth-form-box">
          <h1>Verify your email</h1>
          <p className="auth-subtitle">
            {email ? (
              <>We've sent a 6-digit code to <strong>{email}</strong></>
            ) : (
              'Enter your email and the 6-digit verification code sent to you.'
            )}
          </p>

          {error && <div className="error">{error}</div>}
          {message && <div className="success">{message}</div>}

          <form onSubmit={handleVerify}>
            {!location.state?.email && (
              <div className="auth-field">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@startup.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="otp">6-Digit Code</label>
              <input
                id="otp"
                type="text"
                placeholder="000000"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                style={{
                  letterSpacing: 8,
                  fontSize: 22,
                  textAlign: 'center',
                  fontFamily: 'monospace',
                  fontWeight: 800
                }}
              />
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Email & Continue →'}
            </button>
          </form>

          <div className="auth-divider">DIDN'T RECEIVE IT?</div>

          <p className="auth-footer-text">
            {cooldown > 0 ? (
              <span style={{ color: '#94a3b8' }}>Resend available in {cooldown}s</span>
            ) : (
              <span style={{ color: '#818cf8', cursor: 'pointer', fontWeight: 600 }} onClick={handleResend}>
                Resend verification code
              </span>
            )}
          </p>

          <p className="auth-footer-text" style={{ marginTop: 12 }}>
            Wrong email? <Link to="/register">Create account again</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
