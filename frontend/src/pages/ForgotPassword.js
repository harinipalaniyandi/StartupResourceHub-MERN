import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/api';
import { useToast } from '../api/ToastContext';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [step, setStep] = useState(1); // 1 = enter email, 2 = enter OTP & new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Step 1: Send Reset OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.data.message || 'Reset code sent to your email.');
      setStep(2);
      showToast('Reset OTP sent to your email');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP & Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email,
        otp,
        newPassword
      });
      showToast('Password reset successful! Please log in.');
      navigate('/login', { state: { message: 'Password reset successful! Please log in with your new password.' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setMessage('');
    try {
      await api.post('/auth/resend-otp', { email, purpose: 'password_reset' });
      setMessage('A new password reset code has been sent to your email.');
      showToast('New code sent');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code');
    }
  };

  return (
    <div className="auth-page">
      {/* Brand Panel */}
      <div className="auth-brand-panel">
        <div className="auth-brand-logo">🚀 STARTUP RESOURCE HUB</div>
        <h2>Account Recovery & Security.</h2>
        <p>Regain access to your founder dashboard, AI roadmap, and verified startup opportunities securely.</p>
        <div className="auth-feature-list">
          <div className="auth-feature-item"><span className="auth-feature-dot"></span> Secure single-use OTP verification</div>
          <div className="auth-feature-item"><span className="auth-feature-dot"></span> 5-minute code expiration protection</div>
          <div className="auth-feature-item"><span className="auth-feature-dot"></span> 12-round bcrypt password encryption</div>
        </div>
      </div>

      {/* Form Panel */}
      <div className="auth-form-panel">
        <div className="auth-form-box">
          <h1>{step === 1 ? 'Forgot your password?' : 'Set new password'}</h1>
          <p className="auth-subtitle">
            {step === 1
              ? 'Enter your registered email address to receive a secure recovery code.'
              : `Enter the 6-digit code sent to ${email} and choose a new password.`}
          </p>

          {error && <div className="error">{error}</div>}
          {message && <div className="success">{message}</div>}

          {step === 1 ? (
            <form onSubmit={handleSendOtp}>
              <div className="auth-field">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@startup.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? 'Sending code...' : 'Send Recovery Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword}>
              <div className="auth-field">
                <label htmlFor="otp">6-Digit Recovery Code</label>
                <input
                  id="otp"
                  type="text"
                  placeholder="6-digit code"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  style={{ letterSpacing: 6, fontSize: 18, textAlign: 'center', fontFamily: 'monospace' }}
                />
              </div>

              <div className="auth-field">
                <label htmlFor="newPassword">New Password</label>
                <input
                  id="newPassword"
                  type="password"
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="auth-field">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter your password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? 'Updating password...' : 'Reset Password & Log In'}
              </button>

              <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: '#94a3b8' }}>
                Didn't get the email?{' '}
                <span style={{ color: '#818cf8', cursor: 'pointer', fontWeight: 600 }} onClick={handleResend}>
                  Resend code
                </span>
              </p>
            </form>
          )}

          <div className="auth-divider">OR</div>

          <p className="auth-footer-text">
            Remember your password? <Link to="/login">Back to log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
