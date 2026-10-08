import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { useAuth } from '../api/AuthContext';
import { useToast } from '../api/ToastContext';

export default function Profile() {
  const { user, login } = useAuth();
  const { showToast } = useToast();
  const isMentor = user?.role === 'mentor';

  const [form, setForm] = useState({
    name: '',
    email: '',
    // Founder Profile Fields
    startupName: '',
    businessDomain: '',
    startupStage: 'idea',
    location: '',
    problem: '',
    productService: '',
    mvpStatus: 'not_started',
    teamSize: '1-5',
    targetCustomers: 'B2B',
    marketValidation: 'none',
    revenueStatus: 'pre_revenue',
    businessRegistration: 'unregistered',
    fundingRequirement: 'none',
    fundingStage: 'bootstrapped',
    requiredExpertise: '',
    currentChallenges: '',
    startupGoals: '',
    needs: '',
    // Mentor Fields
    expertise: '',
    mentorDomain: '',
    experienceYears: 0,
    company: '',
    linkedinProfile: '',
    supportedStages: 'idea,mvp,early_revenue',
    availability: 'available',
    bio: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('basic'); // 'basic' | 'product' | 'funding' | 'goals'

  useEffect(() => {
    api.get('/profile')
      .then((res) => {
        const u = res.data;
        setForm({
          name: u.name || '',
          email: u.email || '',
          startupName: u.startupName || '',
          businessDomain: u.businessDomain || u.industry || '',
          startupStage: u.startupStage || 'idea',
          location: u.location || '',
          problem: u.problem || '',
          productService: u.productService || '',
          mvpStatus: u.mvpStatus || 'not_started',
          teamSize: u.teamSize || '1-5',
          targetCustomers: u.targetCustomers || 'B2B',
          marketValidation: u.marketValidation || 'none',
          revenueStatus: u.revenueStatus || 'pre_revenue',
          businessRegistration: u.businessRegistration || 'unregistered',
          fundingRequirement: u.fundingRequirement || 'none',
          fundingStage: u.fundingStage || 'bootstrapped',
          requiredExpertise: u.requiredExpertise || '',
          currentChallenges: u.currentChallenges || '',
          startupGoals: u.startupGoals || '',
          needs: u.needs || '',
          expertise: u.expertise || '',
          mentorDomain: u.mentorDomain || u.industry || '',
          experienceYears: u.experienceYears || 0,
          company: u.company || '',
          linkedinProfile: u.linkedinProfile || '',
          supportedStages: u.supportedStages || 'idea,mvp,early_revenue',
          availability: u.availability || 'available',
          bio: u.bio || ''
        });
      })
      .catch(() => showToast('Failed to load profile', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/profile', form);
      if (res.data.user) {
        login(localStorage.getItem('srh_token'), res.data.user);
      }
      showToast('Profile updated successfully! AI intelligence refreshed.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: 60 }}>
        <p style={{ fontSize: 16, color: '#94a3b8' }}>👤 Loading your profile details...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 900 }}>
      {/* Header */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <span className="role-pill" style={{ marginBottom: 6, display: 'inline-block' }}>
              {isMentor ? 'Mentor Profile' : 'Founder Startup Profile'}
            </span>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>
              {isMentor ? '🎓 Edit Your Mentor Credentials' : '🚀 Complete Startup Profile'}
            </h1>
            <p style={{ color: '#94a3b8', fontSize: 13 }}>
              {isMentor
                ? 'Keep your domain experience, company, and mentoring focus up to date for founders.'
                : 'Our AI uses these 17 profile parameters to detect readiness gaps, match grants, and generate roadmaps.'}
            </p>
          </div>
          <button type="submit" form="profile-form" disabled={saving} className="btn-primary" style={{ padding: '10px 22px' }}>
            {saving ? 'Saving...' : '💾 Save Profile'}
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs for Founders */}
      {!isMentor && (
        <div className="tab-nav">
          <button type="button" className={`tab-btn ${activeSection === 'basic' ? 'active' : ''}`} onClick={() => setActiveSection('basic')}>
            🏢 1. Startup & Domain
          </button>
          <button type="button" className={`tab-btn ${activeSection === 'product' ? 'active' : ''}`} onClick={() => setActiveSection('product')}>
            🛠️ 2. Product & Market
          </button>
          <button type="button" className={`tab-btn ${activeSection === 'funding' ? 'active' : ''}`} onClick={() => setActiveSection('funding')}>
            💰 3. Financial & Legal
          </button>
          <button type="button" className={`tab-btn ${activeSection === 'goals' ? 'active' : ''}`} onClick={() => setActiveSection('goals')}>
            🎯 4. Goals & Challenges
          </button>
        </div>
      )}

      {/* Form */}
      <form id="profile-form" onSubmit={handleSubmit}>
        {/* Founder Form Sections */}
        {!isMentor && (
          <>
            {/* Section 1: Basic & Domain */}
            {activeSection === 'basic' && (
              <div className="card">
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Startup & Domain Overview</h3>
                <div className="grid-2">
                  <div className="auth-field">
                    <label>Founder Full Name *</label>
                    <input name="name" value={form.name} onChange={handleChange} required />
                  </div>
                  <div className="auth-field">
                    <label>Startup Name *</label>
                    <input name="startupName" placeholder="e.g. AgriSense Technologies" value={form.startupName} onChange={handleChange} required />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="auth-field">
                    <label>Business Domain / Sector *</label>
                    <select name="businessDomain" value={form.businessDomain} onChange={handleChange} required>
                      <option value="">Select Primary Domain</option>
                      <option value="Agritech">Agritech</option>
                      <option value="Fintech">Fintech</option>
                      <option value="Healthtech">Healthtech</option>
                      <option value="E-commerce">E-commerce / D2C</option>
                      <option value="EdTech">EdTech</option>
                      <option value="SaaS">SaaS & Enterprise</option>
                      <option value="Deeptech">Deeptech & AI</option>
                      <option value="Cleantech">Cleantech & Energy</option>
                      <option value="General">General / Other</option>
                    </select>
                  </div>
                  <div className="auth-field">
                    <label>Startup Stage *</label>
                    <select name="startupStage" value={form.startupStage} onChange={handleChange} required>
                      <option value="idea">Idea / Concept Phase</option>
                      <option value="mvp">MVP / Prototyping</option>
                      <option value="early_revenue">Early Revenue / Pilot Traction</option>
                      <option value="scaling">Scaling / Growth</option>
                    </select>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="auth-field">
                    <label>Headquarters Location</label>
                    <input name="location" placeholder="e.g. Chennai, Tamil Nadu / Bangalore" value={form.location} onChange={handleChange} />
                  </div>
                  <div className="auth-field">
                    <label>Team Size</label>
                    <select name="teamSize" value={form.teamSize} onChange={handleChange}>
                      <option value="Solo Founder">Solo Founder (1)</option>
                      <option value="2-5">2 - 5 members</option>
                      <option value="6-10">6 - 10 members</option>
                      <option value="11-25">11 - 25 members</option>
                      <option value="25+">25+ members</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
                  <button type="button" onClick={() => setActiveSection('product')}>
                    Next: Product & Market →
                  </button>
                </div>
              </div>
            )}

            {/* Section 2: Product & Market */}
            {activeSection === 'product' && (
              <div className="card">
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Product, MVP & Market Validation</h3>

                <div className="auth-field">
                  <label>Core Problem Statement *</label>
                  <textarea
                    name="problem"
                    rows={3}
                    placeholder="Describe the specific pain point or bottleneck your startup solves for customers..."
                    value={form.problem}
                    onChange={handleChange}
                  />
                </div>

                <div className="auth-field">
                  <label>Product or Service Description *</label>
                  <textarea
                    name="productService"
                    rows={3}
                    placeholder="Describe your solution, workflow, or technology architecture..."
                    value={form.productService}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid-3">
                  <div className="auth-field">
                    <label>MVP Status</label>
                    <select name="mvpStatus" value={form.mvpStatus} onChange={handleChange}>
                      <option value="not_started">Not Started (Concept only)</option>
                      <option value="in_development">In Development</option>
                      <option value="mvp_ready">MVP Ready (Internal testing)</option>
                      <option value="live_with_users">Live with Active Pilot Users</option>
                    </select>
                  </div>

                  <div className="auth-field">
                    <label>Target Customers</label>
                    <select name="targetCustomers" value={form.targetCustomers} onChange={handleChange}>
                      <option value="B2B">B2B (Businesses)</option>
                      <option value="B2C">B2C (Consumers)</option>
                      <option value="B2B2C">B2B2C</option>
                      <option value="D2C">D2C (Direct to Consumer)</option>
                      <option value="Enterprise">Enterprise</option>
                    </select>
                  </div>

                  <div className="auth-field">
                    <label>Market Validation</label>
                    <select name="marketValidation" value={form.marketValidation} onChange={handleChange}>
                      <option value="none">None / Unvalidated</option>
                      <option value="surveys_done">User Surveys Conducted</option>
                      <option value="pilot_users">Free Pilot Trials Active</option>
                      <option value="paying_customers">Paying Customers Onboard</option>
                      <option value="loi_signed">Letters of Intent (LOIs) Signed</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
                  <button type="button" className="btn-secondary" onClick={() => setActiveSection('basic')}>
                    ← Previous
                  </button>
                  <button type="button" onClick={() => setActiveSection('funding')}>
                    Next: Financial & Legal →
                  </button>
                </div>
              </div>
            )}

            {/* Section 3: Financial & Legal */}
            {activeSection === 'funding' && (
              <div className="card">
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Financial, Legal & Capital Status</h3>

                <div className="grid-2">
                  <div className="auth-field">
                    <label>Business Legal Registration</label>
                    <select name="businessRegistration" value={form.businessRegistration} onChange={handleChange}>
                      <option value="unregistered">Unregistered Entity</option>
                      <option value="sole_proprietorship">Sole Proprietorship</option>
                      <option value="partnership">Partnership Firm</option>
                      <option value="llp">Limited Liability Partnership (LLP)</option>
                      <option value="private_limited">Private Limited Company (Pvt Ltd)</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="auth-field">
                    <label>Revenue Status</label>
                    <select name="revenueStatus" value={form.revenueStatus} onChange={handleChange}>
                      <option value="pre_revenue">Pre-Revenue ($0)</option>
                      <option value="early_revenue">Early Revenue (Generating Sales)</option>
                      <option value="break_even">Break-Even</option>
                      <option value="profitable">Profitable</option>
                    </select>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="auth-field">
                    <label>Current Funding Stage</label>
                    <select name="fundingStage" value={form.fundingStage} onChange={handleChange}>
                      <option value="bootstrapped">Bootstrapped / Self-Funded</option>
                      <option value="seeking_grants">Actively Seeking Govt Grants</option>
                      <option value="seeking_angels">Seeking Pre-Seed / Angels</option>
                      <option value="seeking_vc">Seeking Seed / Series A VC</option>
                      <option value="funded">Institutionally Funded</option>
                    </select>
                  </div>

                  <div className="auth-field">
                    <label>Funding Requirement</label>
                    <select name="fundingRequirement" value={form.fundingRequirement} onChange={handleChange}>
                      <option value="none">None (Self-sustaining)</option>
                      <option value="grant_seeking">Government Grants (Up to ₹20L)</option>
                      <option value="pre_seed">Pre-Seed (₹20L - ₹1 Cr)</option>
                      <option value="seed">Seed Capital (₹1 Cr - ₹5 Cr)</option>
                      <option value="series_a">Series A (₹5 Cr+)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
                  <button type="button" className="btn-secondary" onClick={() => setActiveSection('product')}>
                    ← Previous
                  </button>
                  <button type="button" onClick={() => setActiveSection('goals')}>
                    Next: Goals & Challenges →
                  </button>
                </div>
              </div>
            )}

            {/* Section 4: Goals & Challenges */}
            {activeSection === 'goals' && (
              <div className="card">
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Goals, Bottlenecks & Required Expertise</h3>

                <div className="auth-field">
                  <label>Required Advisor / Mentor Expertise</label>
                  <input
                    name="requiredExpertise"
                    placeholder="e.g. fundraising, compliance, enterprise sales, cloud architecture"
                    value={form.requiredExpertise}
                    onChange={handleChange}
                  />
                </div>

                <div className="auth-field">
                  <label>Current Operational Challenges & Bottlenecks</label>
                  <textarea
                    name="currentChallenges"
                    rows={3}
                    placeholder="e.g. Finding pilot customers in Tamil Nadu, drafting grant applications, unit economics..."
                    value={form.currentChallenges}
                    onChange={handleChange}
                  />
                </div>

                <div className="auth-field">
                  <label>6 to 12 Month Startup Goals</label>
                  <textarea
                    name="startupGoals"
                    rows={3}
                    placeholder="e.g. Launch MVP, reach ₹10L monthly recurring revenue, apply for SISFS seed grant..."
                    value={form.startupGoals}
                    onChange={handleChange}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
                  <button type="button" className="btn-secondary" onClick={() => setActiveSection('funding')}>
                    ← Previous
                  </button>
                  <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '10px 24px' }}>
                    {saving ? 'Saving Profile...' : '✓ Complete Profile & Update AI'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Mentor Form */}
        {isMentor && (
          <div className="card">
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Mentor Profile & Credentials</h3>

            <div className="grid-2">
              <div className="auth-field">
                <label>Full Name *</label>
                <input name="name" value={form.name} onChange={handleChange} required />
              </div>
              <div className="auth-field">
                <label>Primary Mentorship Domain *</label>
                <input name="mentorDomain" placeholder="e.g. Fintech, Agritech, SaaS" value={form.mentorDomain} onChange={handleChange} required />
              </div>
            </div>

            <div className="grid-2">
              <div className="auth-field">
                <label>Company / Organization</label>
                <input name="company" placeholder="e.g. FinLeap Ventures / Independent Advisor" value={form.company} onChange={handleChange} />
              </div>
              <div className="auth-field">
                <label>Years of Industry Experience</label>
                <input type="number" min="0" name="experienceYears" value={form.experienceYears} onChange={handleChange} />
              </div>
            </div>

            <div className="grid-2">
              <div className="auth-field">
                <label>LinkedIn Profile URL</label>
                <input name="linkedinProfile" placeholder="https://linkedin.com/in/yourprofile" value={form.linkedinProfile} onChange={handleChange} />
              </div>
              <div className="auth-field">
                <label>Location</label>
                <input name="location" placeholder="e.g. Bangalore / Remote" value={form.location} onChange={handleChange} />
              </div>
            </div>

            <div className="auth-field">
              <label>Expertise / Core Advisory Skills (comma-separated)</label>
              <input
                name="expertise"
                placeholder="e.g. seed fundraising, rbi compliance, product architecture, gtm strategy"
                value={form.expertise}
                onChange={handleChange}
              />
            </div>

            <div className="grid-2">
              <div className="auth-field">
                <label>Supported Startup Stages</label>
                <input name="supportedStages" placeholder="e.g. idea, mvp, early_revenue" value={form.supportedStages} onChange={handleChange} />
              </div>
              <div className="auth-field">
                <label>Availability Status</label>
                <select name="availability" value={form.availability} onChange={handleChange}>
                  <option value="available">Available (Accepting Mentees)</option>
                  <option value="limited">Limited Slots</option>
                  <option value="unavailable">Currently Unavailable</option>
                </select>
              </div>
            </div>

            <div className="auth-field">
              <label>Mentor Bio & Value Proposition for Founders</label>
              <textarea
                name="bio"
                rows={4}
                placeholder="Share your track record, past startups advised, and how you assist early-stage founders..."
                value={form.bio}
                onChange={handleChange}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '12px 28px' }}>
                {saving ? 'Saving...' : 'Save Mentor Profile'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
