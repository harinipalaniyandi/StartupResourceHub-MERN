import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { useToast } from '../api/ToastContext';

const TABS = [
  { id: 'add', label: '➕ Add Resource' },
  { id: 'manage', label: '📁 Manage Resources' },
  { id: 'approvals', label: '✅ Pending Approvals' },
  { id: 'mentor-verify', label: '👨‍🏫 Mentor Verification' },
  { id: 'status', label: '📊 Status & Health' },
  { id: 'notifications', label: '🔔 Broadcasts' },
  { id: 'users', label: '👥 User Management' },
  { id: 'activity', label: '🕒 Activity Log' }
];

export default function Admin() {
  const { showToast } = useToast();
  const [tab, setTab] = useState('add');

  // Stats
  const [stats, setStats] = useState(null);

  // Form for adding resource
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Funding',
    tags: '',
    industryFocus: 'all',
    stageFocus: 'all',
    location: 'India',
    budgetRange: '',
    fundingType: 'Grant',
    externalLink: '',
    eligibilityCriteria: '',
    requiredDocuments: '',
    targetUsers: 'Founders'
  });

  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState([]);
  const [resources, setResources] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [pendingMentors, setPendingMentors] = useState([]);
  const [platformHealth, setPlatformHealth] = useState(null);
  const [users, setUsers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);

  // Broadcast state
  const [broadcast, setBroadcast] = useState({ title: '', message: '', targetRole: 'all' });
  const [broadcasting, setBroadcasting] = useState(false);

  // Feedback state for approvals / mentor verification
  const [approvalFeedback, setApprovalFeedback] = useState({});
  const [mentorReason, setMentorReason] = useState({});

  useEffect(() => {
    loadAllData();
  }, [tab]);

  const loadAllData = async () => {
    try {
      api.get('/admin/stats').then(res => setStats(res.data)).catch(() => {});
      if (tab === 'manage') {
        api.get('/resources').then(res => setResources(res.data)).catch(() => {});
      } else if (tab === 'approvals') {
        api.get('/admin/resources/pending-approval').then(res => setPendingApprovals(res.data)).catch(() => {});
      } else if (tab === 'mentor-verify') {
        api.get('/admin/mentors/pending-verification').then(res => setPendingMentors(res.data)).catch(() => {});
      } else if (tab === 'status') {
        api.get('/admin/platform-health').then(res => setPlatformHealth(res.data)).catch(() => {});
      } else if (tab === 'users') {
        api.get('/admin/users').then(res => setUsers(res.data)).catch(() => {});
      } else if (tab === 'activity') {
        api.get('/admin/activity').then(res => setActivityLogs(res.data)).catch(() => {});
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // AI Auto-Classification for new resource
  const handleAiAutoClassify = async () => {
    if (!form.title || !form.description) {
      showToast('Please enter Title and Description first for AI metadata classification', 'error');
      return;
    }

    setAiSuggesting(true);
    try {
      const res = await api.post('/admin/suggest-metadata', {
        title: form.title,
        description: form.description
      });

      const meta = res.data;
      setForm((prev) => ({
        ...prev,
        category: meta.category || prev.category,
        tags: meta.tags || prev.tags,
        industryFocus: meta.industryFocus || prev.industryFocus,
        stageFocus: meta.stageFocus || prev.stageFocus,
        location: meta.location || prev.location,
        fundingType: meta.fundingType || prev.fundingType,
        eligibilityCriteria: meta.eligibilityCriteria || prev.eligibilityCriteria,
        requiredDocuments: Array.isArray(meta.requiredDocuments) ? meta.requiredDocuments.join(', ') : prev.requiredDocuments,
        targetUsers: meta.targetUsers || prev.targetUsers
      }));

      showToast('AI Auto-Classification complete! Review and save.');
    } catch (err) {
      showToast('AI classification failed', 'error');
    } finally {
      setAiSuggesting(false);
    }
  };

  // Check Duplicates
  const handleCheckDuplicates = async () => {
    if (!form.title) return;
    try {
      const res = await api.post('/admin/check-duplicate', { title: form.title, description: form.description });
      setDuplicateWarning(res.data.duplicates || []);
      if (res.data.duplicates.length === 0) {
        showToast('No duplicates detected! Ready to add.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddResource = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        requiredDocuments: form.requiredDocuments ? form.requiredDocuments.split(',').map(s => s.trim()).filter(Boolean) : []
      };
      await api.post('/resources', payload);
      showToast('Resource created and published successfully! 🚀');
      setForm({
        title: '',
        description: '',
        category: 'Funding',
        tags: '',
        industryFocus: 'all',
        stageFocus: 'all',
        location: 'India',
        budgetRange: '',
        fundingType: 'Grant',
        externalLink: '',
        eligibilityCriteria: '',
        requiredDocuments: '',
        targetUsers: 'Founders'
      });
      setDuplicateWarning([]);
      loadAllData();
    } catch (err) {
      showToast('Failed to create resource', 'error');
    }
  };

  // Approvals Action
  const handleApproveResource = async (id, action) => {
    try {
      await api.post(`/admin/resources/${id}/approve`, {
        action,
        feedback: approvalFeedback[id] || ''
      });
      showToast(`Resource ${action}ed successfully`);
      loadAllData();
    } catch (err) {
      showToast(`Approval failed`, 'error');
    }
  };

  // Mentor Verification Action
  const handleVerifyMentor = async (id, action) => {
    try {
      await api.post(`/admin/mentors/${id}/verify`, {
        action,
        reason: mentorReason[id] || ''
      });
      showToast(`Mentor application ${action}ed`);
      loadAllData();
    } catch (err) {
      showToast('Mentor verification failed', 'error');
    }
  };

  // User Role & Status
  const handleUpdateRole = async (userId, role) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role });
      showToast('User role updated');
      loadAllData();
    } catch (err) {
      showToast('Failed to update user role', 'error');
    }
  };

  const handleToggleUserStatus = async (userId) => {
    try {
      const res = await api.put(`/admin/users/${userId}/status`);
      showToast(res.data.message);
      loadAllData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update user status', 'error');
    }
  };

  // Delete Resource
  const handleDeleteResource = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    try {
      await api.delete(`/resources/${id}`);
      showToast('Resource deleted');
      loadAllData();
    } catch (err) {
      showToast('Failed to delete resource', 'error');
    }
  };

  // Broadcast
  const handleBroadcast = async (e) => {
    e.preventDefault();
    setBroadcasting(true);
    try {
      await api.post('/admin/notifications/broadcast', broadcast);
      showToast(`Broadcast sent to ${broadcast.targetRole} users! 📢`);
      setBroadcast({ title: '', message: '', targetRole: 'all' });
    } catch (err) {
      showToast('Broadcast failed', 'error');
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <div className="container">
      {/* Header Banner */}
      <div className="card">
        <span className="role-pill" style={{ marginBottom: 6, display: 'inline-block' }}>Administration Control Center</span>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>SRH Platform Operations & Governance</h1>
        <p style={{ color: '#94a3b8', fontSize: 13 }}>
          Manage verified grants, mentor verification, AI metadata approval, user roles, broadcasts, and system health.
        </p>

        {stats && (
          <div className="stat-grid" style={{ marginTop: 20, marginBottom: 0 }}>
            <div className="stat-card">
              <div className="stat-card-value">{stats.totalResources}</div>
              <div className="stat-card-label">Total Verified Resources</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value">{stats.totalUsers}</div>
              <div className="stat-card-label">Registered Users ({stats.totalVerifiedUsers} Verified)</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value">{stats.totalViews}</div>
              <div className="stat-card-label">Platform Views ({stats.viewsThisWeek} this week)</div>
            </div>
          </div>
        )}
      </div>

      {/* Admin Tabs */}
      <div className="admin-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`admin-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 1. Add Resource Tab */}
      {tab === 'add' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Add Verified Startup Opportunity</h2>
            <button
              type="button"
              className="btn-primary"
              style={{ background: 'linear-gradient(135deg, #06b6d4, #6366f1)' }}
              disabled={aiSuggesting}
              onClick={handleAiAutoClassify}
            >
              {aiSuggesting ? '🧠 Classifying...' : '🤖 AI Auto-Classify Metadata'}
            </button>
          </div>

          <form onSubmit={handleAddResource}>
            <div className="auth-field">
              <label>Resource Title *</label>
              <input
                name="title"
                placeholder="e.g. Startup India Seed Fund Scheme (SISFS)"
                required
                value={form.title}
                onChange={handleFormChange}
                onBlur={handleCheckDuplicates}
              />
            </div>

            {duplicateWarning.length > 0 && (
              <div style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: 12, borderRadius: 8, marginBottom: 14 }}>
                <strong style={{ color: '#fcd34d', fontSize: 13 }}>⚠️ Potential Duplicate Warning:</strong>
                <p style={{ fontSize: 12, color: '#cbd5e1', marginTop: 4 }}>
                  Found similar resource in database: "{duplicateWarning[0]?.title}" ({duplicateWarning[0]?.matchScore}% similarity).
                </p>
              </div>
            )}

            <div className="auth-field">
              <label>Description *</label>
              <textarea
                name="description"
                rows={3}
                placeholder="Detailed explanation of the grant, funding amount, or mentorship offer..."
                required
                value={form.description}
                onChange={handleFormChange}
              />
            </div>

            <div className="grid-3">
              <div className="auth-field">
                <label>Category *</label>
                <select name="category" value={form.category} onChange={handleFormChange} required>
                  <option value="Funding">Funding</option>
                  <option value="Government Scheme">Government Scheme</option>
                  <option value="Mentor">Mentor</option>
                  <option value="Tool/Software">Tool/Software</option>
                  <option value="Co-working Space">Co-working Space</option>
                  <option value="Legal/Compliance">Legal/Compliance</option>
                  <option value="Incubator/Accelerator">Incubator/Accelerator</option>
                </select>
              </div>

              <div className="auth-field">
                <label>Domain / Industry Focus</label>
                <input name="industryFocus" placeholder="e.g. fintech, agritech or all" value={form.industryFocus} onChange={handleFormChange} />
              </div>

              <div className="auth-field">
                <label>Stage Focus</label>
                <input name="stageFocus" placeholder="e.g. idea, mvp or all" value={form.stageFocus} onChange={handleFormChange} />
              </div>
            </div>

            <div className="grid-3">
              <div className="auth-field">
                <label>Location</label>
                <input name="location" placeholder="e.g. India, Tamil Nadu, Global" value={form.location} onChange={handleFormChange} />
              </div>

              <div className="auth-field">
                <label>Funding Type</label>
                <input name="fundingType" placeholder="e.g. Grant, Equity, Credits" value={form.fundingType} onChange={handleFormChange} />
              </div>

              <div className="auth-field">
                <label>Budget / Grant Range</label>
                <input name="budgetRange" placeholder="e.g. Up to ₹20 Lakhs" value={form.budgetRange} onChange={handleFormChange} />
              </div>
            </div>

            <div className="auth-field">
              <label>Eligibility Criteria</label>
              <input name="eligibilityCriteria" placeholder="e.g. DPIIT recognized startups under 2 years old" value={form.eligibilityCriteria} onChange={handleFormChange} />
            </div>

            <div className="auth-field">
              <label>Required Documents (comma-separated)</label>
              <input name="requiredDocuments" placeholder="e.g. DPIIT Certificate, Pitch Deck, GST, Business Plan" value={form.requiredDocuments} onChange={handleFormChange} />
            </div>

            <div className="grid-2">
              <div className="auth-field">
                <label>Tags (AI comma-separated)</label>
                <input name="tags" placeholder="e.g. funding, seed, grant, sisfs" value={form.tags} onChange={handleFormChange} />
              </div>

              <div className="auth-field">
                <label>Official Application Link URL</label>
                <input name="externalLink" placeholder="https://..." value={form.externalLink} onChange={handleFormChange} />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: 12, padding: '12px 28px' }}>
              ✓ Publish Verified Resource
            </button>
          </form>
        </div>
      )}

      {/* 2. Manage Resources Tab */}
      {tab === 'manage' && (
        <div className="card">
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>All Database Resources ({resources.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {resources.map((r) => (
              <div
                key={r._id}
                style={{
                  background: '#0d1322',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 10,
                  padding: 14,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 10
                }}
              >
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 700 }}>{r.title}</h4>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                    {r.category} • Focus: {r.industryFocus} • Stage: {r.stageFocus} • 📍 {r.location} • 👁️ {r.viewCount} views
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {r.externalLink && (
                    <a href={r.externalLink} target="_blank" rel="noreferrer" className="link-btn" style={{ padding: '4px 10px', fontSize: 11 }}>
                      Portal ↗
                    </a>
                  )}
                  <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: 11, color: '#f87171' }} onClick={() => handleDeleteResource(r._id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Pending Approvals Tab */}
      {tab === 'approvals' && (
        <div className="card">
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>Pending Resource Submissions ({pendingApprovals.length})</h2>
          {pendingApprovals.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>No submissions pending approval.</p>
          ) : (
            pendingApprovals.map((r) => (
              <div key={r._id} style={{ background: '#0d1322', padding: 16, borderRadius: 10, marginBottom: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                <h3>{r.title}</h3>
                <p style={{ fontSize: 13, color: '#cbd5e1', margin: '6px 0' }}>{r.description}</p>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>
                  Category: {r.category} • Submitted by: {r.createdBy?.name || 'User'} ({r.createdBy?.email})
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => handleApproveResource(r._id, 'approve')}>✓ Approve & Publish</button>
                  <button className="btn-secondary" style={{ color: '#f87171' }} onClick={() => handleApproveResource(r._id, 'reject')}>
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 4. Mentor Verification Tab */}
      {tab === 'mentor-verify' && (
        <div className="card">
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>Mentor Verification Queue ({pendingMentors.length})</h2>
          {pendingMentors.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>All mentor profiles verified.</p>
          ) : (
            pendingMentors.map((m) => (
              <div key={m._id} style={{ background: '#0d1322', padding: 16, borderRadius: 10, marginBottom: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>{m.name} ({m.email})</h3>
                  <span className="match-badge" style={{ margin: 0 }}>
                    Score: {m.verificationScore || 70}/100
                  </span>
                </div>
                <div style={{ fontSize: 13, color: '#38bdf8', marginTop: 4 }}>
                  {m.mentorDomain || m.industry || 'Domain'} • {m.experienceYears} Years Exp • {m.company}
                </div>
                {m.bio && <p style={{ fontSize: 13, color: '#cbd5e1', margin: '8px 0' }}>"{m.bio}"</p>}
                {m.linkedinProfile && (
                  <a href={m.linkedinProfile} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#818cf8' }}>
                    LinkedIn Profile ↗
                  </a>
                )}
                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  <button onClick={() => handleVerifyMentor(m._id, 'verify')}>
                    ✓ Verify Mentor
                  </button>
                  <button className="btn-secondary" style={{ color: '#f87171' }} onClick={() => handleVerifyMentor(m._id, 'reject')}>
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 5. Status & Health Tab */}
      {tab === 'status' && platformHealth && (
        <div className="card">
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>Platform Health & System Metrics</h2>
          <div className="grid-3" style={{ gap: 14, marginBottom: 20 }}>
            <div className="stat-card">
              <div className="stat-card-value">{platformHealth.userMetrics?.founders || 0}</div>
              <div className="stat-card-label">Active Founders</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value">{platformHealth.userMetrics?.verifiedMentors || 0}</div>
              <div className="stat-card-label">Verified Mentors</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value">{platformHealth.activityMetrics?.engagementRate || 0}%</div>
              <div className="stat-card-label">Weekly Engagement Rate</div>
            </div>
          </div>

          {platformHealth.systemAlerts && platformHealth.systemAlerts.length > 0 && (
            <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', padding: 14, borderRadius: 10 }}>
              <h4 style={{ color: '#fda4af', marginBottom: 6 }}>System Health Alerts:</h4>
              <ul style={{ paddingLeft: 20, fontSize: 13, color: '#fecdd3' }}>
                {platformHealth.systemAlerts.map((alt, i) => (
                  <li key={i}>{alt.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 6. Broadcast Notifications Tab */}
      {tab === 'notifications' && (
        <div className="card">
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>Send Broadcast Notification</h2>
          <form onSubmit={handleBroadcast}>
            <div className="auth-field">
              <label>Target Audience</label>
              <select
                value={broadcast.targetRole}
                onChange={(e) => setBroadcast({ ...broadcast, targetRole: e.target.value })}
              >
                <option value="all">All Platform Users</option>
                <option value="founder">Founders Only</option>
                <option value="mentor">Mentors Only</option>
              </select>
            </div>

            <div className="auth-field">
              <label>Broadcast Title *</label>
              <input
                placeholder="e.g. New Tamil Nadu Seed Grant Application Window Open!"
                required
                value={broadcast.title}
                onChange={(e) => setBroadcast({ ...broadcast, title: e.target.value })}
              />
            </div>

            <div className="auth-field">
              <label>Message *</label>
              <textarea
                rows={3}
                placeholder="Notification message content..."
                required
                value={broadcast.message}
                onChange={(e) => setBroadcast({ ...broadcast, message: e.target.value })}
              />
            </div>

            <button type="submit" disabled={broadcasting} className="btn-primary" style={{ padding: '10px 24px' }}>
              {broadcasting ? 'Sending...' : '📢 Send Broadcast'}
            </button>
          </form>
        </div>
      )}

      {/* 7. User Management Tab */}
      {tab === 'users' && (
        <div className="card">
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>Platform Users ({users.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {users.map((u) => (
              <div
                key={u._id}
                style={{
                  background: '#0d1322',
                  padding: 12,
                  borderRadius: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 10
                }}
              >
                <div>
                  <strong>{u.name}</strong> ({u.email})
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    Role: <span className="role-pill" style={{ fontSize: 10 }}>{u.role}</span> • Status: {u.isActive !== false ? 'Active' : 'Deactivated'} • Domain: {u.businessDomain || u.industry || 'N/A'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <select
                    value={u.role}
                    onChange={(e) => handleUpdateRole(u._id, e.target.value)}
                    style={{ padding: '4px 8px', fontSize: 12, width: 'auto' }}
                  >
                    <option value="founder">Founder</option>
                    <option value="mentor">Mentor</option>
                    <option value="admin">Admin</option>
                  </select>

                  <button
                    className="btn-secondary"
                    style={{ padding: '4px 10px', fontSize: 11, color: u.isActive !== false ? '#f87171' : '#34d399' }}
                    onClick={() => handleToggleUserStatus(u._id)}
                  >
                    {u.isActive !== false ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. Activity Log Tab */}
      {tab === 'activity' && (
        <div className="card">
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>Real-Time Activity Log ({activityLogs.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {activityLogs.map((log) => (
              <div key={log._id} style={{ background: '#0d1322', padding: 10, borderRadius: 6, fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong>{log.user?.name || 'User'}</strong> ({log.user?.role || 'user'}) performed <code>{log.action}</code> on <em>"{log.resource?.title || 'Resource'}"</em>
                </div>
                <div style={{ fontSize: 11, color: '#64748b' }}>
                  {new Date(log.createdAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
