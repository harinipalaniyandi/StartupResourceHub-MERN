import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { useToast } from '../api/ToastContext';
import MentorshipChatModal from '../components/MentorshipChatModal';

const AVAILABILITY_LABELS = {
  available: 'Available for Mentoring',
  limited: 'Limited Slots',
  unavailable: 'Not Available'
};

export default function Mentors() {
  const { showToast } = useToast();
  const [mentors, setMentors] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Request Modal State
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Active Chat State
  const [activeChatRequestId, setActiveChatRequestId] = useState(null);

  const loadData = async () => {
    try {
      const [mentorRes, reqRes] = await Promise.all([
        api.get('/mentors/match').catch(() => ({ data: [] })),
        api.get('/mentors/requests/sent').catch(() => ({ data: [] }))
      ]);
      setMentors(mentorRes.data || []);
      setSentRequests(reqRes.data || []);
    } catch (err) {
      showToast('Failed to load mentor matching data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getSentRequest = (mentorId) => {
    return sentRequests.find(r => r.mentor?._id === mentorId || r.mentor === mentorId);
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!selectedMentor) return;

    setSending(true);
    try {
      await api.post('/mentors/request', {
        mentorId: selectedMentor._id,
        message: requestMessage
      });
      showToast(`Mentorship request sent to ${selectedMentor.name}! 🎓`);
      setSelectedMentor(null);
      setRequestMessage('');
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send request', 'error');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: 60 }}>
        <p style={{ fontSize: 16, color: '#94a3b8' }}>🎓 Finding and ranking top mentors for your startup...</p>
      </div>
    );
  }

  const acceptedRequests = sentRequests.filter(r => r.status === 'accepted');

  return (
    <div className="container">
      {/* Header Banner */}
      <div className="card">
        <span className="role-pill" style={{ marginBottom: 6, display: 'inline-block' }}>Ecosystem Network</span>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>AI-Matched Startup Mentors & Direct Messaging</h1>
        <p style={{ color: '#94a3b8', fontSize: 13 }}>
          Connect directly with industry leaders, investors, and domain experts. When a mentor accepts your request, you can chat, schedule sessions, and share milestone updates.
        </p>
      </div>

      {/* Active Mentorship Conversations (if any) */}
      {acceptedRequests.length > 0 && (
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(15, 23, 42, 0.9))',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            marginBottom: 24
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>💬</span>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-main)' }}>
                Active Mentorship Connections ({acceptedRequests.length})
              </h2>
            </div>
            <span className="status-badge status-approved">Two-Way Messaging Active</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
            {acceptedRequests.map((r) => {
              const mentor = r.mentor || {};
              return (
                <div
                  key={r._id}
                  style={{
                    background: 'var(--bg-card-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <strong style={{ fontSize: 16, color: 'var(--text-main)' }}>{mentor.name}</strong>
                      <span className="status-badge status-approved" style={{ fontSize: 10 }}>Connected</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--accent-cyan)', marginTop: 2 }}>
                      {mentor.mentorDomain || mentor.industry || 'Domain Expert'} • {mentor.company || 'Advisor'}
                    </div>

                    {r.meetingDetails && (
                      <div style={{ fontSize: 12, color: 'var(--accent-emerald)', background: 'var(--bg-card)', padding: '6px 10px', borderRadius: 6, marginTop: 8, border: '1px solid var(--border-color)' }}>
                        📅 <strong>Session:</strong> {r.meetingDetails}
                      </div>
                    )}
                  </div>

                  <button
                    className="btn-primary"
                    style={{ marginTop: 12, width: '100%', padding: '9px 14px', fontSize: 13 }}
                    onClick={() => setActiveChatRequestId(r._id)}
                  >
                    💬 Open Chat with {mentor.name} →
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mentor Cards Grid */}
      <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 14, color: 'var(--text-main)' }}>
        Explore & Connect with Mentors
      </h2>

      {mentors.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>No verified mentors currently available. Check back soon.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
          {mentors.map((m) => {
            const request = getSentRequest(m._id);
            const isAvail = m.availability === 'available';

            return (
              <div
                className="card card-hover"
                key={m._id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: `3px solid ${m.matchScore > 80 ? 'var(--accent-emerald)' : 'var(--primary)'}`
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <span className="match-badge">⭐ {m.matchScore}% Match</span>
                    <span className={`status-badge ${isAvail ? 'status-approved' : 'status-preparing'}`} style={{ fontSize: 10 }}>
                      {AVAILABILITY_LABELS[m.availability] || 'Available'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)' }}>{m.name}</h3>
                  <div style={{ fontSize: 13, color: 'var(--accent-cyan)', fontWeight: 600, marginTop: 2 }}>
                    {m.mentorDomain || m.industry || 'Domain Expert'} • {m.company || 'Advisor'}
                  </div>

                  {m.whyRecommended && (
                    <div className="match-reason-box" style={{ margin: '12px 0' }}>
                      💡 <strong>Why Recommended:</strong> {m.whyRecommended}
                    </div>
                  )}

                  {m.bio && (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, margin: '10px 0' }}>
                      "{m.bio}"
                    </p>
                  )}

                  {/* Expertise Tags */}
                  {m.expertise && (
                    <div style={{ margin: '10px 0' }}>
                      {m.expertise.split(',').map((skill, i) => (
                        <span className="tag tag-cyan" key={i} style={{ fontSize: 11 }}>
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{ fontSize: 12, color: 'var(--text-dim)', margin: '8px 0' }}>
                    📍 {m.location || 'Remote'} • ⏳ {m.experienceYears || 0} Years Experience
                  </div>
                </div>

                {/* Bottom Action / Request Status */}
                <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border-color)' }}>
                  {request ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                      <div>
                        <span style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block' }}>Status</span>
                        <span className={`status-badge status-${request.status === 'accepted' ? 'approved' : request.status === 'declined' ? 'rejected' : 'applied'}`}>
                          {request.status.toUpperCase()}
                        </span>
                      </div>

                      {request.status === 'accepted' ? (
                        <button
                          className="btn-primary"
                          style={{ padding: '8px 14px', fontSize: 13 }}
                          onClick={() => setActiveChatRequestId(request._id)}
                        >
                          💬 Chat with Mentor →
                        </button>
                      ) : request.status === 'pending' ? (
                        <button
                          className="btn-secondary"
                          style={{ padding: '8px 12px', fontSize: 12 }}
                          onClick={() => setActiveChatRequestId(request._id)}
                        >
                          ✉️ View Message Thread
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        style={{ width: '100%', padding: '10px 14px' }}
                        onClick={() => setSelectedMentor(m)}
                        disabled={m.availability === 'unavailable'}
                      >
                        Request Mentorship Guidance →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Request Modal */}
      {selectedMentor && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedMentor(null)}
        >
          <div
            className="modal-card"
            style={{ maxWidth: 520 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: 'var(--text-main)' }}>
              Request Mentorship from {selectedMentor.name}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              A snapshot of your startup profile and current challenges will be shared with the mentor. You can chat and discuss milestones once accepted.
            </p>

            <form onSubmit={handleSendRequest}>
              <div className="auth-field">
                <label>Your Message / Specific Question:</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Introduce your startup and describe what specific guidance or feedback you'd like..."
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button type="button" className="btn-secondary" onClick={() => setSelectedMentor(null)}>
                  Cancel
                </button>
                <button type="submit" disabled={sending}>
                  {sending ? 'Sending...' : 'Send Request 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Two-Way Mentorship Chat Modal */}
      {activeChatRequestId && (
        <MentorshipChatModal
          mentorRequestId={activeChatRequestId}
          onClose={() => {
            setActiveChatRequestId(null);
            loadData();
          }}
          onMessageSent={() => loadData()}
        />
      )}
    </div>
  );
}

