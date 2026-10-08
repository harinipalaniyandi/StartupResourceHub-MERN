import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { useToast } from '../api/ToastContext';

const STATUS_CONFIG = {
  saved: { label: 'Saved', color: '#94a3b8' },
  interested: { label: 'Interested', color: '#38bdf8' },
  preparing: { label: 'Preparing Docs', color: '#fbbf24' },
  applied: { label: 'Applied', color: '#818cf8' },
  under_review: { label: 'Under Review', color: '#c084fc' },
  accepted: { label: 'Accepted 🎉', color: '#34d399' },
  rejected: { label: 'Rejected', color: '#f87171' }
};

const STATUS_KEYS = Object.keys(STATUS_CONFIG);

export default function MyApplications() {
  const { showToast } = useToast();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [editingNotesId, setEditingNotesId] = useState(null);
  const [tempNotes, setTempNotes] = useState('');

  const loadApplications = async () => {
    try {
      const res = await api.get('/applications');
      setApps(res.data);
    } catch (err) {
      showToast('Failed to load applications', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/applications/${id}`, { status });
      showToast(`Status updated to ${STATUS_CONFIG[status]?.label || status}`);
      loadApplications();
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleToggleChecklist = async (app, itemIdx) => {
    try {
      const updatedChecklist = [...app.checklist];
      updatedChecklist[itemIdx].completed = !updatedChecklist[itemIdx].completed;

      await api.put(`/applications/${app._id}`, { checklist: updatedChecklist });
      showToast('Checklist item updated');
      loadApplications();
    } catch (err) {
      showToast('Failed to update checklist', 'error');
    }
  };

  const handleSaveNotes = async (id) => {
    try {
      await api.put(`/applications/${id}`, { notes: tempNotes });
      showToast('Application notes saved');
      setEditingNotesId(null);
      loadApplications();
    } catch (err) {
      showToast('Failed to save notes', 'error');
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Remove this resource from your tracker?')) return;
    try {
      await api.delete(`/applications/${id}`);
      showToast('Removed from tracker');
      loadApplications();
    } catch (err) {
      showToast('Failed to remove application', 'error');
    }
  };

  const filteredApps = activeFilter === 'all'
    ? apps
    : apps.filter(a => a.status === activeFilter);

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: 60 }}>
        <p style={{ fontSize: 16, color: '#94a3b8' }}>📋 Loading your opportunity tracker...</p>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header Card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <span className="role-pill" style={{ marginBottom: 6, display: 'inline-block' }}>Pipeline Management</span>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>Opportunity & Application Tracker</h1>
            <p style={{ color: '#94a3b8', fontSize: 13 }}>
              Track funding grants, accelerator submissions, and compliance milestones with interactive document checklists.
            </p>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#38bdf8', background: 'rgba(6,182,212,0.1)', padding: '8px 16px', borderRadius: 20 }}>
            Tracking {apps.length} Opportunities
          </div>
        </div>
      </div>

      {/* Pipeline Status Filter Bar */}
      <div className="tab-nav">
        <button className={`tab-btn ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')}>
          All ({apps.length})
        </button>
        {STATUS_KEYS.map(st => {
          const count = apps.filter(a => a.status === st).length;
          return (
            <button
              key={st}
              className={`tab-btn ${activeFilter === st ? 'active' : ''}`}
              onClick={() => setActiveFilter(st)}
            >
              {STATUS_CONFIG[st].label} ({count})
            </button>
          );
        })}
      </div>

      {/* Applications List */}
      {filteredApps.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: '#94a3b8', fontSize: 15 }}>No opportunities in this stage. Browse Search or Dashboard to add resources.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {filteredApps.map((app) => {
            const res = app.resource || {};
            const completedCount = (app.checklist || []).filter(c => c.completed).length;
            const totalCount = (app.checklist || []).length;
            const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

            return (
              <div
                className="card card-hover"
                key={app._id}
                style={{ borderLeft: `4px solid ${STATUS_CONFIG[app.status]?.color || '#6366f1'}` }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700 }}>{res.title || 'Opportunity'}</h3>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                      <span className="tag tag-cyan" style={{ margin: 0 }}>{res.category}</span>
                      {res.budgetRange && <span className="tag tag-amber" style={{ margin: 0 }}>{res.budgetRange}</span>}
                      {app.deadline && (
                        <span className="deadline-pill deadline-upcoming" style={{ fontSize: 11 }}>
                          📅 Deadline: {new Date(app.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stage Selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <label style={{ margin: 0, fontSize: 12 }}>Stage:</label>
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusChange(app._id, e.target.value)}
                      style={{ padding: '6px 12px', fontSize: 13, width: 'auto', background: '#0d1322', borderColor: STATUS_CONFIG[app.status]?.color }}
                    >
                      {STATUS_KEYS.map((k) => (
                        <option key={k} value={k}>{STATUS_CONFIG[k].label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <p style={{ fontSize: 13, color: '#cbd5e1', margin: '10px 0', lineHeight: 1.5 }}>
                  {res.description}
                </p>

                {/* Document Checklist */}
                {app.checklist && app.checklist.length > 0 && (
                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: 14, borderRadius: 10, margin: '12px 0', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                        Document & Submission Checklist ({completedCount}/{totalCount})
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8' }}>{progress}%</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {app.checklist.map((item, idx) => (
                        <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0, cursor: 'pointer', fontSize: 13 }}>
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => handleToggleChecklist(app, idx)}
                            style={{ width: 16, height: 16, accentColor: '#10b981' }}
                          />
                          <span style={{ color: item.completed ? '#94a3b8' : '#ffffff', textDecoration: item.completed ? 'line-through' : 'none' }}>
                            {item.task}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes Section */}
                <div style={{ marginTop: 10 }}>
                  {editingNotesId === app._id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <textarea
                        rows={2}
                        placeholder="Add notes e.g. Submitted pitch deck on portal, scheduled call for next Tuesday..."
                        value={tempNotes}
                        onChange={(e) => setTempNotes(e.target.value)}
                      />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => handleSaveNotes(app._id)}>
                          Save Notes
                        </button>
                        <button className="btn-secondary" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => setEditingNotesId(null)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#94a3b8' }}>
                      <span>
                        📝 <strong>Notes:</strong> {app.notes || 'No notes added yet.'}
                      </span>
                      <button
                        className="btn-secondary"
                        style={{ padding: '3px 8px', fontSize: 11, borderRadius: 4 }}
                        onClick={() => {
                          setEditingNotesId(app._id);
                          setTempNotes(app.notes || '');
                        }}
                      >
                        Edit Notes
                      </button>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    Updated: {new Date(app.updatedAt).toLocaleDateString()}
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {res.externalLink && (
                      <a className="link-btn" href={res.externalLink} target="_blank" rel="noreferrer" style={{ padding: '4px 10px', fontSize: 12 }}>
                        Official Portal ↗
                      </a>
                    )}
                    <button
                      className="btn-secondary"
                      style={{ padding: '4px 10px', fontSize: 12, color: '#f87171' }}
                      onClick={() => handleRemove(app._id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
