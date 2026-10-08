import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { useToast } from '../api/ToastContext';
import MentorshipChatModal from '../components/MentorshipChatModal';

export default function MentorRequests() {
  const { showToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending'); // 'pending' | 'accepted' | 'declined' | 'completed'

  const [respondingId, setRespondingId] = useState(null);
  const [meetingDetails, setMeetingDetails] = useState('');
  const [mentorNotes, setMentorNotes] = useState('');
  const [activeChatRequestId, setActiveChatRequestId] = useState(null);

  const loadRequests = async () => {
    try {
      const res = await api.get('/mentors/requests/received');
      setRequests(res.data || []);
    } catch (err) {
      showToast('Failed to load received requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleRespond = async (id, status) => {
    try {
      await api.put(`/mentors/requests/${id}`, {
        status,
        meetingDetails,
        mentorNotes
      });
      showToast(`Request marked as ${status}!`);
      setRespondingId(null);
      setMeetingDetails('');
      setMentorNotes('');
      loadRequests();
    } catch (err) {
      showToast('Failed to update request', 'error');
    }
  };

  const pending = requests.filter(r => r.status === 'pending');
  const accepted = requests.filter(r => r.status === 'accepted');
  const declined = requests.filter(r => r.status === 'declined');
  const completed = requests.filter(r => r.status === 'completed');

  const shown = tab === 'pending'
    ? pending
    : tab === 'accepted'
    ? accepted
    : tab === 'completed'
    ? completed
    : declined;

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: 60 }}>
        <p style={{ fontSize: 16, color: '#94a3b8' }}>📥 Loading your mentorship request inbox...</p>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header Card */}
      <div className="card">
        <span className="role-pill" style={{ marginBottom: 6, display: 'inline-block' }}>Mentor Inbox</span>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Mentorship Inquiries & Two-Way Conversations</h1>
        <p style={{ color: '#94a3b8', fontSize: 13 }}>
          Review founder applications, startup problem statements, and chat directly with founders to advise and coordinate sessions.
        </p>
      </div>

      {/* Tabs */}
      <div className="tab-nav">
        <button className={`tab-btn ${tab === 'pending' ? 'active' : ''}`} onClick={() => setTab('pending')}>
          ⏳ Pending ({pending.length})
        </button>
        <button className={`tab-btn ${tab === 'accepted' ? 'active' : ''}`} onClick={() => setTab('accepted')}>
          🤝 Active Mentees ({accepted.length})
        </button>
        <button className={`tab-btn ${tab === 'completed' ? 'active' : ''}`} onClick={() => setTab('completed')}>
          ✅ Completed ({completed.length})
        </button>
        <button className={`tab-btn ${tab === 'declined' ? 'active' : ''}`} onClick={() => setTab('declined')}>
          ✋ Declined ({declined.length})
        </button>
      </div>

      {/* Requests List */}
      {shown.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: '#94a3b8', fontSize: 15 }}>No requests under this tab.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {shown.map((r) => {
            const founder = r.founder || {};
            const context = r.startupContext || {};

            return (
              <div
                className="card card-hover"
                key={r._id}
                style={{
                  borderLeft: `4px solid ${
                    r.status === 'accepted'
                      ? '#10b981'
                      : r.status === 'pending'
                      ? '#f59e0b'
                      : r.status === 'completed'
                      ? '#38bdf8'
                      : '#f43f5e'
                  }`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700 }}>
                      {founder.name} • <span style={{ color: 'var(--accent-cyan)' }}>{context.startupName || founder.startupName || 'Startup'}</span>
                    </h3>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                      {context.businessDomain || founder.businessDomain || founder.industry || 'Domain'} • Stage: {context.startupStage || founder.startupStage || 'idea'} • 📍 {founder.location || 'India'}
                    </div>
                  </div>

                  <span className={`status-badge status-${r.status === 'accepted' ? 'approved' : r.status === 'declined' ? 'rejected' : 'preparing'}`}>
                    {r.status.toUpperCase()}
                  </span>
                </div>

                {/* Founder's Message */}
                {r.message && (
                  <div style={{ background: 'rgba(99, 102, 241, 0.08)', padding: 12, borderRadius: 8, margin: '12px 0' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary-light)', textTransform: 'uppercase' }}>Founder's Inquiry:</span>
                    <p style={{ fontSize: 13, color: 'var(--text-main)', marginTop: 4, fontStyle: 'italic' }}>
                      "{r.message}"
                    </p>
                  </div>
                )}

                {/* Startup Problem & Challenges Context */}
                {(context.problem || context.currentChallenges || founder.currentChallenges) && (
                  <div className="grid-2" style={{ gap: 12, margin: '10px 0' }}>
                    {context.problem && (
                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Problem Solved:</span>
                        <p style={{ fontSize: 12, color: 'var(--text-main)', marginTop: 2 }}>{context.problem}</p>
                      </div>
                    )}
                    {(context.currentChallenges || founder.currentChallenges) && (
                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-rose)' }}>Key Challenges:</span>
                        <p style={{ fontSize: 12, color: 'var(--text-main)', marginTop: 2 }}>{context.currentChallenges || founder.currentChallenges}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Meeting / Notes details */}
                {r.meetingDetails && (
                  <div style={{ fontSize: 12, color: '#34d399', margin: '8px 0', background: 'rgba(16, 185, 129, 0.12)', padding: '6px 10px', borderRadius: 6 }}>
                    📅 <strong>Meeting / Link:</strong> {r.meetingDetails}
                  </div>
                )}

                {/* Actions */}
                {r.status === 'pending' && (
                  <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border-color)' }}>
                    {respondingId === r._id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <input
                          placeholder="Meeting link or scheduled time (e.g. Google Meet / Calendly link)..."
                          value={meetingDetails}
                          onChange={(e) => setMeetingDetails(e.target.value)}
                        />
                        <textarea
                          rows={2}
                          placeholder="Optional notes or instructions to the founder..."
                          value={mentorNotes}
                          onChange={(e) => setMentorNotes(e.target.value)}
                        />
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button onClick={() => handleRespond(r._id, 'accepted')}>
                            Confirm & Accept
                          </button>
                          <button className="btn-secondary" onClick={() => setRespondingId(null)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button onClick={() => setRespondingId(r._id)}>
                          Accept Request & Set Up Meeting
                        </button>
                        <button
                          className="btn-secondary"
                          style={{ color: '#818cf8' }}
                          onClick={() => setActiveChatRequestId(r._id)}
                        >
                          💬 Chat / Ask Question First
                        </button>
                        <button className="btn-secondary" style={{ color: '#f87171' }} onClick={() => handleRespond(r._id, 'declined')}>
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {r.status === 'accepted' && (
                  <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      className="btn-primary"
                      style={{ fontSize: 13, padding: '8px 16px' }}
                      onClick={() => setActiveChatRequestId(r._id)}
                    >
                      💬 Open Chat with {founder.name} →
                    </button>
                    <button
                      className="btn-secondary"
                      style={{ fontSize: 12, padding: '8px 12px' }}
                      onClick={() => handleRespond(r._id, 'completed')}
                    >
                      ✓ Mark Mentoring as Completed
                    </button>
                  </div>
                )}

                {r.status === 'completed' && (
                  <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
                    <button
                      className="btn-secondary"
                      style={{ fontSize: 12, padding: '6px 12px' }}
                      onClick={() => setActiveChatRequestId(r._id)}
                    >
                      💬 View Past Chat History
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Two-Way Mentorship Chat Modal */}
      {activeChatRequestId && (
        <MentorshipChatModal
          mentorRequestId={activeChatRequestId}
          onClose={() => {
            setActiveChatRequestId(null);
            loadRequests();
          }}
          onMessageSent={() => loadRequests()}
        />
      )}
    </div>
  );
}

