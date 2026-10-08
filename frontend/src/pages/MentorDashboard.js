import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../api/AuthContext';
import MentorshipChatModal from '../components/MentorshipChatModal';

export default function MentorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeChatRequestId, setActiveChatRequestId] = useState(null);

  const loadDashboard = () => {
    api.get('/mentors/dashboard')
      .then(res => setStats(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: 60 }}>
        <p style={{ fontSize: 16, color: '#94a3b8' }}>🎓 Loading mentor dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header Banner */}
      <div
        className="card hero-banner"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span className="role-pill">Mentor Advisor Hub</span>
            {user?.isMentorVerified && <span className="status-badge status-approved">✓ Verified Mentor</span>}
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-main)' }}>
            Welcome, {user?.name || 'Mentor'} 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Overview of incoming startup inquiries, active mentee sessions, and advisory progress.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/mentor-requests">
            <button className="btn-primary" style={{ padding: '10px 18px' }}>
              Review Inquiries ({stats?.pending || 0}) →
            </button>
          </Link>
          <Link to="/profile">
            <button className="btn-secondary" style={{ padding: '10px 18px' }}>
              Edit Mentor Profile
            </button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>⏳</div>
          <div className="stat-card-value">{stats?.pending || 0}</div>
          <div className="stat-card-label">Pending Inquiries</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>🤝</div>
          <div className="stat-card-value">{stats?.accepted || 0}</div>
          <div className="stat-card-label">Active Mentees</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(6, 182, 212, 0.2)', color: '#06b6d4' }}>✅</div>
          <div className="stat-card-value">{stats?.completed || 0}</div>
          <div className="stat-card-label">Completed Sessions</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}>📊</div>
          <div className="stat-card-value">{stats?.total || 0}</div>
          <div className="stat-card-label">Total Inquiries Received</div>
        </div>
      </div>

      {/* Pending Inquiry Notice */}
      {stats?.pending > 0 && (
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(15, 23, 42, 0.9))',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          <div>
            <strong style={{ color: '#fcd34d', fontSize: 15 }}>
              ⚡ You have {stats.pending} pending founder mentorship inquiry waiting for review.
            </strong>
            <p style={{ color: '#cbd5e1', fontSize: 13, marginTop: 4 }}>
              Founders look forward to your domain expertise and tactical feedback.
            </p>
          </div>
          <Link to="/mentor-requests">
            <button style={{ padding: '8px 16px', fontSize: 13 }}>
              View Pending Inquiries →
            </button>
          </Link>
        </div>
      )}

      {/* Active Mentees Section */}
      <div className="card">
        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🤝</span> Active Mentees & Startups
        </h2>

        {!stats?.activeMentees || stats.activeMentees.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: 14, padding: '20px 0' }}>
            No active mentees yet. Accepted founder requests will appear here.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {stats.activeMentees.map((m) => (
              <div
                key={m._id}
                style={{
                  background: 'var(--bg-card-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>{m.founder?.name}</h3>
                    <span className="status-badge status-approved">Active Mentee</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--accent-cyan)', fontWeight: 600, marginTop: 2 }}>
                    {m.founder?.startupName || 'Startup'} • {m.founder?.businessDomain || m.founder?.industry || 'Domain'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                    Stage: {m.founder?.startupStage || 'idea'} • 📍 {m.founder?.location || 'India'}
                  </div>
                </div>

                <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <button
                    className="btn-primary"
                    style={{ fontSize: 12, padding: '6px 14px' }}
                    onClick={() => setActiveChatRequestId(m._id)}
                  >
                    💬 Open Chat →
                  </button>

                  <Link to="/mentor-requests" style={{ fontSize: 12, color: 'var(--primary-light)', fontWeight: 600 }}>
                    Manage Session →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Two-Way Mentorship Chat Modal */}
      {activeChatRequestId && (
        <MentorshipChatModal
          mentorRequestId={activeChatRequestId}
          onClose={() => {
            setActiveChatRequestId(null);
            loadDashboard();
          }}
          onMessageSent={() => loadDashboard()}
        />
      )}
    </div>
  );
}

