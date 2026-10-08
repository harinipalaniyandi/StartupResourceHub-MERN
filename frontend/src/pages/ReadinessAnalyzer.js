import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { useToast } from '../api/ToastContext';

const DIMENSION_CONFIG = {
  productReadiness: { label: 'Product & MVP Readiness', icon: '🛠️', color: '#6366f1' },
  marketReadiness: { label: 'Market & Customer Validation', icon: '🎯', color: '#06b6d4' },
  businessModelReadiness: { label: 'Business Model & Unit Economics', icon: '📈', color: '#10b981' },
  teamReadiness: { label: 'Team & Advisory Readiness', icon: '👥', color: '#a855f7' },
  legalReadiness: { label: 'Legal & Entity Compliance', icon: '⚖️', color: '#f59e0b' },
  financialReadiness: { label: 'Financial & Runway Readiness', icon: '💰', color: '#14b8a6' },
  fundingReadiness: { label: 'Funding & Investment Readiness', icon: '🚀', color: '#ec4899' },
  technologyReadiness: { label: 'Technology & Cloud Architecture', icon: '⚡', color: '#3b82f6' }
};

export default function ReadinessAnalyzer() {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('dimensions'); // 'dimensions' | 'gaps'

  const loadData = async () => {
    try {
      const res = await api.get('/intelligence/readiness');
      setData(res.data);
    } catch (err) {
      showToast('Failed to load readiness analysis', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReanalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await api.post('/intelligence/readiness/reanalyze');
      setData(res.data);
      showToast('AI Readiness analysis refreshed successfully');
    } catch (err) {
      showToast('Failed to re-analyze readiness', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleTrackResource = async (resourceId) => {
    try {
      await api.post('/applications', { resourceId });
      showToast('Added resource to your Application Tracker');
    } catch (err) {
      showToast('Failed to track resource', 'error');
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: 60 }}>
        <p style={{ fontSize: 16, color: '#94a3b8' }}>🧠 Running 8-dimension AI Readiness Analysis...</p>
      </div>
    );
  }

  const dimensions = data?.dimensions || {};
  const opportunityGaps = data?.opportunityGaps || [];
  const score = data?.overallScore || 0;

  return (
    <div className="container">
      {/* Header Banner */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span className="role-pill" style={{ marginBottom: 8, display: 'inline-block' }}>AI Opportunity Intelligence</span>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Startup Readiness & Gap Intelligence</h1>
          <p style={{ color: '#94a3b8', fontSize: 14 }}>
            Comprehensive evaluation of your startup's product, market, legal, and funding maturity.
          </p>
        </div>
        <button onClick={handleReanalyze} disabled={analyzing} className="btn-primary" style={{ padding: '12px 20px' }}>
          {analyzing ? '⚡ Analyzing...' : '🔄 Re-Analyze with AI'}
        </button>
      </div>

      {/* Overall Score Overview */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(6, 182, 212, 0.15))' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>
            Overall Readiness Score
          </div>
          <div style={{ fontSize: 48, fontWeight: 900, color: score > 70 ? '#34d399' : score > 45 ? '#38bdf8' : '#fbbf24', letterSpacing: -1 }}>
            {score}<span style={{ fontSize: 24, color: '#64748b' }}>/100</span>
          </div>
          <div style={{ marginTop: 6, fontSize: 13, fontWeight: 600, color: '#cbd5e1' }}>
            Current Level: <strong style={{ color: '#38bdf8' }}>{data?.readinessLevel || 'Idea Validation'}</strong>
          </div>
        </div>

        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h3 style={{ fontSize: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>💡</span> Strategic AI Insights
          </h3>
          <ul style={{ paddingLeft: 20, color: '#cbd5e1', fontSize: 13, lineHeight: 1.8 }}>
            {data?.aiInsights && data.aiInsights.map((insight, idx) => (
              <li key={idx} style={{ marginBottom: 6 }}>{insight}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="tab-nav">
        <button className={`tab-btn ${activeTab === 'dimensions' ? 'active' : ''}`} onClick={() => setActiveTab('dimensions')}>
          📊 8-Dimension Readiness Breakdown
        </button>
        <button className={`tab-btn ${activeTab === 'gaps' ? 'active' : ''}`} onClick={() => setActiveTab('gaps')}>
          🔍 AI Opportunity Gaps ({opportunityGaps.length})
        </button>
      </div>

      {/* View 1: 8-Dimension Readiness */}
      {activeTab === 'dimensions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {Object.entries(DIMENSION_CONFIG).map(([key, config]) => {
            const dim = dimensions[key] || { score: 0, status: 'Needs Attention', gaps: [], recommendedActions: [], relevantResources: [] };
            const statusColor = dim.status === 'Strong' ? '#10b981' : dim.status === 'Moderate' ? '#06b6d4' : dim.status === 'Critical Gap' ? '#f43f5e' : '#f59e0b';

            return (
              <div className="card card-hover" key={key} style={{ borderLeft: `4px solid ${config.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 24 }}>{config.icon}</span>
                    <div>
                      <h3 style={{ fontSize: 17, fontWeight: 700 }}>{config.label}</h3>
                      <span style={{ fontSize: 12, fontWeight: 700, color: statusColor, textTransform: 'uppercase' }}>
                        ● {dim.status || 'Needs Attention'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 140, height: 10, background: '#1e293b', borderRadius: 5, overflow: 'hidden' }}>
                      <div style={{ width: `${dim.score}%`, height: '100%', background: `linear-gradient(90deg, ${config.color}, #38bdf8)`, borderRadius: 5 }}></div>
                    </div>
                    <span style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', minWidth: 45, textAlign: 'right' }}>{dim.score}%</span>
                  </div>
                </div>

                <div className="grid-2" style={{ gap: 16, marginTop: 12 }}>
                  {/* Identified Gaps */}
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: 14, borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)' }}>
                    <h4 style={{ fontSize: 13, color: '#f87171', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>⚠️</span> Identified Gaps & Missing Data
                    </h4>
                    <ul style={{ paddingLeft: 16, fontSize: 12, color: '#cbd5e1', lineHeight: 1.6 }}>
                      {dim.gaps && dim.gaps.length > 0 ? (
                        dim.gaps.map((g, i) => <li key={i}>{g}</li>)
                      ) : (
                        <li style={{ color: '#6ee7b7' }}>No critical gaps identified in this area.</li>
                      )}
                      {dim.missingInfo && dim.missingInfo.map((m, i) => (
                        <li key={`m-${i}`} style={{ color: '#fbbf24' }}>Missing Info: {m}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommended Next Actions */}
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: 14, borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)' }}>
                    <h4 style={{ fontSize: 13, color: '#34d399', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>✅</span> Recommended Next Steps
                    </h4>
                    <ul style={{ paddingLeft: 16, fontSize: 12, color: '#cbd5e1', lineHeight: 1.6 }}>
                      {dim.recommendedActions && dim.recommendedActions.length > 0 ? (
                        dim.recommendedActions.map((act, i) => <li key={i}>{act}</li>)
                      ) : (
                        <li>Continue maintaining current operational milestones.</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Grounded Real Resources */}
                {dim.relevantResources && dim.relevantResources.length > 0 && (
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      🔗 Verified Database Resources to Bridge this Gap:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      {dim.relevantResources.map(res => (
                        <div key={res._id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1e293b', padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{res.title}</span>
                          <span className="tag tag-cyan" style={{ margin: 0, fontSize: 10 }}>{res.category}</span>
                          <button className="btn-secondary" style={{ padding: '3px 8px', fontSize: 11, borderRadius: 4 }} onClick={() => handleTrackResource(res._id)}>
                            + Track
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* View 2: Opportunity Gaps */}
      {activeTab === 'gaps' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {opportunityGaps.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
              <p style={{ color: '#6ee7b7', fontSize: 16, fontWeight: 600 }}>🎉 Excellent! No critical opportunity gaps detected for your current profile.</p>
            </div>
          ) : (
            opportunityGaps.map((gap, idx) => (
              <div className="card card-hover" key={idx} style={{ borderLeft: gap.urgency === 'critical' ? '4px solid #f43f5e' : '4px solid #f59e0b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{gap.urgency === 'critical' ? '🚨' : '⚠️'}</span>
                    <h3 style={{ fontSize: 17, fontWeight: 700 }}>{gap.title}</h3>
                  </div>
                  <span className={`status-badge status-${gap.urgency === 'critical' ? 'rejected' : 'preparing'}`}>
                    {gap.urgency.toUpperCase()} URGENCY
                  </span>
                </div>

                <div className="grid-2" style={{ gap: 14, margin: '12px 0' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>What Startup Has:</span>
                    <p style={{ fontSize: 13, color: '#cbd5e1', marginTop: 4 }}>{gap.whatStartupHas || 'Concept phase'}</p>
                  </div>
                  <div style={{ background: 'rgba(244, 63, 94, 0.05)', padding: 12, borderRadius: 8, border: '1px solid rgba(244,63,94,0.15)' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#f87171', textTransform: 'uppercase' }}>What Is Missing:</span>
                    <p style={{ fontSize: 13, color: '#fda4af', marginTop: 4 }}>{gap.whatIsMissing}</p>
                  </div>
                </div>

                <div style={{ background: 'rgba(99, 102, 241, 0.08)', padding: 12, borderRadius: 8, marginBottom: 14 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase' }}>Recommended Next Step:</span>
                  <p style={{ fontSize: 13, color: '#c7d2fe', marginTop: 4 }}>{gap.recommendedAction}</p>
                </div>

                {gap.linkedResources && gap.linkedResources.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase' }}>
                      Verified Solutions in Database:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      {gap.linkedResources.map(res => (
                        <div key={res._id || res} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#1e293b', padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>{res.title || 'Resource'}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{res.category} • {res.location || 'India'}</div>
                          </div>
                          <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => handleTrackResource(res._id || res)}>
                            + Track
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
