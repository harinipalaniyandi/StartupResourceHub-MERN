import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/api';

export default function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState('founder'); // 'founder' | 'mentor'

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    // Founder
    startupName: '',
    businessDomain: '',
    startupStage: 'idea',
    location: '',
    needs: '',
    // Mentor
    mentorDomain: '',
    expertise: '',
    experienceYears: 0,
    bio: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const dataToSend = {
        name: form.name,
        email: form.email,
        password: form.password,
        role,
        ...(role === 'founder'
          ? {
              startupName: form.startupName,
              businessDomain: form.businessDomain,
              startupStage: form.startupStage,
              location: form.location,
              needs: form.needs
            }
          : {
              mentorDomain: form.mentorDomain,
              expertise: form.expertise,
              experienceYears: form.experienceYears,
              bio: form.bio
            })
      };

      const res = await api.post('/auth/register', dataToSend);
      navigate('/verify-otp', { state: { email: res.data.email } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left Brand Panel */}
      <div className="auth-brand-panel">
        <div className="auth-brand-logo">🚀 STARTUP RESOURCE HUB</div>
        <h2>Stop searching.<br />Start matching.</h2>
        <p>Tell us your stage, domain and needs once — our AI ranks verified government grants, seed funding, and mentors tailored for you.</p>
        <div className="auth-feature-list">
          <div className="auth-feature-item"><span className="auth-feature-dot"></span> AI match % on every verified resource</div>
          <div className="auth-feature-item"><span className="auth-feature-dot"></span> 8-dimension startup readiness analyzer</div>
          <div className="auth-feature-item"><span className="auth-feature-dot"></span> Personalized step-by-step roadmap</div>
          <div className="auth-feature-item"><span className="auth-feature-dot"></span> Free to join, no credit card required</div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="auth-form-panel">
        <div className="auth-form-box" style={{ maxWidth: 460 }}>
          <h1>Create your account</h1>
          <p className="auth-subtitle">Join as a Founder or Mentor to access AI startup intelligence.</p>

          {error && <div className="error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label>I want to join as</label>
              <div className="role-card-grid">
                <div
                  className={`role-card ${role === 'founder' ? 'selected' : ''}`}
                  onClick={() => setRole('founder')}
                >
                  <div className="role-card-icon">🚀</div>
                  <div className="role-card-title">Founder</div>
                  <div className="role-card-desc">Discover grants, roadmaps & mentors</div>
                </div>

                <div
                  className={`role-card ${role === 'mentor' ? 'selected' : ''}`}
                  onClick={() => setRole('mentor')}
                >
                  <div className="role-card-icon">🎓</div>
                  <div className="role-card-title">Mentor</div>
                  <div className="role-card-desc">Advise & guide emerging founders</div>
                </div>
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="name">Full Name *</label>
              <input id="name" name="name" placeholder="Your full name" required value={form.name} onChange={handleChange} autoComplete="name" />
            </div>

            <div className="auth-field">
              <label htmlFor="email">Email Address *</label>
              <input id="email" name="email" type="email" placeholder="you@startup.com" required value={form.email} onChange={handleChange} autoComplete="email" />
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password *</label>
              <input id="password" name="password" type="password" placeholder="At least 6 characters" required minLength={6} value={form.password} onChange={handleChange} autoComplete="new-password" />
            </div>

            {/* Founder Specific Fields */}
            {role === 'founder' && (
              <>
                <div className="grid-2">
                  <div className="auth-field">
                    <label htmlFor="startupName">Startup Name</label>
                    <input id="startupName" name="startupName" placeholder="e.g. AgriSense" value={form.startupName} onChange={handleChange} />
                  </div>
                  <div className="auth-field">
                    <label htmlFor="businessDomain">Primary Domain</label>
                    <select id="businessDomain" name="businessDomain" value={form.businessDomain} onChange={handleChange}>
                      <option value="">Select Domain</option>
                      <option value="Agritech">Agritech</option>
                      <option value="Fintech">Fintech</option>
                      <option value="Healthtech">Healthtech</option>
                      <option value="E-commerce">E-commerce</option>
                      <option value="EdTech">EdTech</option>
                      <option value="SaaS">SaaS</option>
                      <option value="Deeptech">Deeptech</option>
                      <option value="Cleantech">Cleantech</option>
                      <option value="General">General</option>
                    </select>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="auth-field">
                    <label htmlFor="startupStage">Current Stage</label>
                    <select id="startupStage" name="startupStage" value={form.startupStage} onChange={handleChange}>
                      <option value="idea">Idea / Concept</option>
                      <option value="mvp">MVP / Prototype</option>
                      <option value="early_revenue">Early Revenue</option>
                      <option value="scaling">Scaling</option>
                    </select>
                  </div>
                  <div className="auth-field">
                    <label htmlFor="location">Location</label>
                    <input id="location" name="location" placeholder="e.g. Chennai / Remote" value={form.location} onChange={handleChange} />
                  </div>
                </div>

                <div className="auth-field">
                  <label htmlFor="needs">What is your primary need right now?</label>
                  <textarea id="needs" name="needs" placeholder="e.g. seed funding, legal compliance, domain mentor, cloud credits" rows={2} value={form.needs} onChange={handleChange} />
                </div>
              </>
            )}

            {/* Mentor Specific Fields */}
            {role === 'mentor' && (
              <>
                <div className="grid-2">
                  <div className="auth-field">
                    <label htmlFor="mentorDomain">Primary Mentorship Domain</label>
                    <input id="mentorDomain" name="mentorDomain" placeholder="e.g. Fintech, Agritech" value={form.mentorDomain} onChange={handleChange} />
                  </div>
                  <div className="auth-field">
                    <label htmlFor="experienceYears">Years of Experience</label>
                    <input id="experienceYears" type="number" min="0" name="experienceYears" value={form.experienceYears} onChange={handleChange} />
                  </div>
                </div>

                <div className="auth-field">
                  <label htmlFor="expertise">Core Expertise (comma-separated)</label>
                  <input id="expertise" name="expertise" placeholder="e.g. fundraising, product management, rbi compliance" value={form.expertise} onChange={handleChange} />
                </div>

                <div className="auth-field">
                  <label htmlFor="bio">Short Bio</label>
                  <textarea id="bio" name="bio" placeholder="Brief overview of your advisory track record..." rows={2} value={form.bio} onChange={handleChange} />
                </div>
              </>
            )}

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Creating account...' : 'Register & Send 6-Digit OTP →'}
            </button>
          </form>

          <div className="auth-divider">ALREADY A MEMBER</div>

          <p className="auth-footer-text">
            Have an account? <Link to="/login">Log in instead</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
