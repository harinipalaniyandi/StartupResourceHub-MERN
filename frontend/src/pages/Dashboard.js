import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../api/AuthContext';
import { useToast } from '../api/ToastContext';

export default function Dashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [recommendations, setRecommendations] = useState([]);
  const [readiness, setReadiness] = useState(null);
  const [deadlines, setDeadlines] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [mentorMatches, setMentorMatches] = useState([]);
  const [trackedApps, setTrackedApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [recRes, readyRes, deadRes, roadRes, mentorRes, appRes] = await Promise.all([
          api.get('/resources/recommendations').catch(() => ({ data: [] })),
          api.get('/intelligence/readiness').catch(() => ({ data: null })),
          api.get('/intelligence/deadlines').catch(() => ({ data: null })),
          api.get('/roadmap').catch(() => ({ data: null })),
          api.get('/mentors/match').catch(() => ({ data: [] })),
          api.get('/applications').catch(() => ({ data: [] }))
        ]);

        setRecommendations(recRes.data || []);
        setReadiness(readyRes.data);
        setDeadlines(deadRes.data);
        setRoadmap(roadRes.data);
        setMentorMatches((mentorRes.data || []).slice(0, 3));
        setTrackedApps(appRes.data || []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleTrack = async (resourceId) => {
    try {
      await api.post('/applications', { resourceId });
      showToast('Added to your Application Tracker! 📋');
      const appRes = await api.get('/applications');
      setTrackedApps(appRes.data || []);
    } catch (err) {
      showToast('Failed to track resource', 'error');
    }
  };

  const isTracked = (resId) => trackedApps.some(a => a.resource?._id === resId || a.resource === resId);

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: 60 }}>
        <p style={{ fontSize: 16, color: '#94a3b8' }}>🚀 Assembling your Startup Intelligence Feed...</p>
      </div>
    );
  }

  const readinessScore = readiness?.overallScore || 45;
  const readinessLevel = readiness?.readinessLevel || 'Idea Validation';
  const urgentDeadlines = deadlines?.urgent || [];
  const opportunityGaps = readiness?.opportunityGaps || [];
  const roadmapProgress = roadmap?.overallProgress || 0;

  return (
    <div className="container">
      {/* Hero Welcome Banner */}
      <div
        className="card hero-banner"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 20
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span className="role-pill">Founder Cockpit</span>
            {user?.businessDomain && <span className="tag tag-cyan" style={{ margin: 0 }}>{user.businessDomain}</span>}
            {user?.startupStage && <span className="tag tag-purple" style={{ margin: 0 }}>Stage: {user.startupStage}</span>}
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-main)' }}>
            Welcome, {user?.name || 'Founder'} 👋 {user?.startupName ? `• ${user.startupName}` : ''}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 640 }}>
            Here is your live opportunity feed, startup readiness rating, and AI-recommended milestones for today.
          </p>
        </div>

        {/* Readiness Score Gauge */}
        <div
          style={{
            background: 'var(--bg-card-secondary)',
            padding: '14px 22px',
            borderRadius: 14,
            border: '1px solid var(--border-color)',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
            Startup Readiness Score
          </div>
          <div style={{ fontSize: 36, fontWeight: 900, color: readinessScore > 70 ? 'var(--accent-emerald)' : readinessScore > 45 ? 'var(--accent-cyan)' : 'var(--accent-amber)' }}>
            {readinessScore}<span style={{ fontSize: 18, color: 'var(--text-dim)' }}>/100</span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary-light)' }}>{readinessLevel}</div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stat-grid">
        <Link to="/readiness" className="stat-card card-hover" style={{ textDecoration: 'none' }}>
          <div className="stat-card-icon" style={{ color: 'var(--primary)' }}>🧠</div>
          <div className="stat-card-value">{readinessScore}%</div>
          <div className="stat-card-label">Readiness Maturity →</div>
        </Link>

        <Link to="/readiness" className="stat-card card-hover" style={{ textDecoration: 'none' }}>
          <div className="stat-card-icon" style={{ background: 'rgba(244, 63, 94, 0.2)', color: '#f87171' }}>⚠️</div>
          <div className="stat-card-value">{opportunityGaps.length}</div>
          <div className="stat-card-label">Opportunity Gaps Detected →</div>
        </Link>

        <Link to="/applications" className="stat-card card-hover" style={{ textDecoration: 'none' }}>
          <div className="stat-card-icon" style={{ background: 'rgba(6, 182, 212, 0.2)', color: '#38bdf8' }}>📋</div>
          <div className="stat-card-value">{trackedApps.length}</div>
          <div className="stat-card-label">Tracked Applications →</div>
        </Link>

        <Link to="/roadmap" className="stat-card card-hover" style={{ textDecoration: 'none' }}>
          <div className="stat-card-icon" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>🗺️</div>
          <div className="stat-card-value">{roadmap ? `${roadmapProgress}%` : 'Not Set'}</div>
          <div className="stat-card-label">{roadmap ? 'Roadmap Milestones →' : 'Generate Roadmap →'}</div>
        </Link>
      </div>

      {/* Urgent Deadline Alerts Banner (if any) */}
      {urgentDeadlines.length > 0 && (
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.12), rgba(15, 23, 42, 0.9))',
            border: '1px solid rgba(244, 63, 94, 0.3)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 20 }}>⏰</span>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fda4af' }}>
              Urgent Application Deadlines Closing Soon ({urgentDeadlines.length})
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {urgentDeadlines.map((item) => (
              <div
                key={item._id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(0,0,0,0.3)',
                  padding: '10px 16px',
                  borderRadius: 8,
                  flexWrap: 'wrap',
                  gap: 10
                }}
              >
                <div>
                  <strong style={{ color: '#ffffff' }}>{item.title}</strong>
                  <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 10 }}>{item.category} • {item.budgetRange}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="deadline-pill deadline-urgent">⏳ Closes in {item.daysLeft} days</span>
                  <a href={item.externalLink} target="_blank" rel="noreferrer" className="link-btn" style={{ padding: '4px 10px', fontSize: 12 }}>
                    Apply ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Recommended Resources + Side Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Left Column: AI Recommended Resources */}
        <div style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🌟</span> Top AI-Matched Opportunities
            </h2>
            <Link to="/search" style={{ fontSize: 13, color: '#818cf8', fontWeight: 600 }}>Browse All Resources →</Link>
          </div>

          {recommendations.length === 0 ? (
            <div className="card"><p style={{ color: '#94a3b8' }}>No recommendations found yet. Update your profile to get matches.</p></div>
          ) : (
            recommendations.map((r) => (
              <div className="card resource-card card-hover" key={r._id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <span className="match-badge">⭐ {r.matchScore}% Match</span>
                  {r.deadline && (
                    <span className="deadline-pill deadline-upcoming">
                      📅 Deadline: {new Date(r.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: 18, fontWeight: 700, margin: '6px 0' }}>{r.title}</h3>
                <p style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.5 }}>{r.description}</p>

                {r.matchReason && (
                  <div className="match-reason-box">
                    ✨ <strong>Why it matches:</strong> {r.matchReason}
                  </div>
                )}

                <div style={{ margin: '12px 0' }}>
                  <span className="tag tag-cyan">{r.category}</span>
                  <span className="tag">{r.industryFocus || 'All Domains'}</span>
                  <span className="tag">{r.stageFocus || 'All Stages'}</span>
                  {r.fundingType && <span className="tag tag-purple">{r.fundingType}</span>}
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                  {r.externalLink && (
                    <a className="link-btn" href={r.externalLink} target="_blank" rel="noreferrer">
                      Official Portal ↗
                    </a>
                  )}
                  {isTracked(r._id) ? (
                    <span className="status-badge status-applied">✓ Tracking</span>
                  ) : (
                    <button className="btn-secondary" style={{ borderRadius: 8, padding: '8px 14px' }} onClick={() => handleTrack(r._id)}>
                      + Add to Tracker
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Column: AI Mentors & Opportunity Gaps Widget */}
        <div>
          {/* Top Mentors Widget */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>🎓</span> Top AI Mentor Matches
              </h3>
              <Link to="/mentors" style={{ fontSize: 12, color: '#818cf8', fontWeight: 600 }}>View All</Link>
            </div>

            {mentorMatches.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: 13 }}>No mentor matches yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {mentorMatches.map((m) => (
                  <div
                    key={m._id}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      padding: 12,
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.06)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: 14, color: '#ffffff' }}>{m.name}</strong>
                      <span className="match-badge" style={{ fontSize: 10, padding: '2px 8px', margin: 0 }}>
                        {m.matchScore}% Match
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#38bdf8', marginTop: 2 }}>
                      {m.mentorDomain || m.industry || 'Domain Expert'} • {m.experienceYears} yrs exp
                    </div>
                    {m.whyRecommended && (
                      <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, fontStyle: 'italic' }}>
                        {m.whyRecommended}
                      </p>
                    )}
                    <Link to="/mentors" style={{ display: 'inline-block', marginTop: 6, fontSize: 12, color: '#818cf8', fontWeight: 600 }}>
                      Connect with {m.name.split(' ')[0]} →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick AI Assistant Card */}
          <div
            className="card"
            style={{
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(99, 102, 241, 0.12))',
              border: '1px solid rgba(6, 182, 212, 0.3)'
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>💬</span> AI Resource Advisor
            </h3>
            <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.5, marginBottom: 14 }}>
              Ask anything about government grant eligibility, seed pitch decks, or finding mentors in your sector.
            </p>
            <Link to="/chatbot">
              <button style={{ width: '100%', padding: 10, fontSize: 13 }}>
                Open AI Chatbot →
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
