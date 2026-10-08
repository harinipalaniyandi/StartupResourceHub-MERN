import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { useToast } from '../api/ToastContext';

export default function Roadmap() {
  const { showToast } = useToast();
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadRoadmap = async () => {
    try {
      const res = await api.get('/roadmap');
      setRoadmap(res.data);
    } catch (err) {
      showToast('Failed to load roadmap', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoadmap();
  }, []);

  const handleToggleTask = async (stageNumber, taskId) => {
    try {
      const res = await api.put(`/roadmap/tasks/${stageNumber}/${taskId}`);
      setRoadmap(res.data.roadmap);
      showToast('Milestone progress updated');
    } catch (err) {
      showToast('Failed to update task', 'error');
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/roadmap/generate');
      setRoadmap(res.data.roadmap);
      showToast('AI Roadmap generated successfully based on your profile!');
    } catch (err) {
      showToast('Failed to generate roadmap', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset your roadmap? You can generate it anytime.')) return;
    try {
      await api.delete('/roadmap');
      setRoadmap(null);
      showToast('Roadmap reset successfully');
    } catch (err) {
      showToast('Failed to reset roadmap', 'error');
    }
  };

  const handleTrackResource = async (resourceId) => {
    try {
      await api.post('/applications', { resourceId });
      showToast('Added resource to your tracker');
    } catch (err) {
      showToast('Failed to track resource', 'error');
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: 80, paddingBottom: 80 }}>
        <div style={{ fontSize: 36, marginBottom: 16 }}>🗺️</div>
        <p style={{ fontSize: 16, color: '#94a3b8' }}>Loading roadmap status...</p>
      </div>
    );
  }

  // If no roadmap has been generated yet
  if (!roadmap || !roadmap.stages || roadmap.stages.length === 0) {
    return (
      <div className="container" style={{ maxWidth: 900, paddingTop: 20 }}>
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '48px 32px',
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5)'
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(6, 182, 212, 0.2))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 34,
              margin: '0 auto 20px auto',
              border: '1px solid rgba(99, 102, 241, 0.4)'
            }}
          >
            🗺️
          </div>

          <span className="role-pill" style={{ marginBottom: 12, display: 'inline-block' }}>
            Interactive AI Milestone Planner
          </span>

          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#ffffff', marginBottom: 12 }}>
            Personalized Startup Execution Roadmap
          </h1>

          <p style={{ color: '#94a3b8', fontSize: 15, maxWidth: 640, margin: '0 auto 32px auto', lineHeight: 1.6 }}>
            No roadmap has been generated yet. Click the button below to generate a tailored 5-stage startup roadmap
            customized to your industry domain, startup stage, and funding readiness.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
              marginBottom: 36,
              textAlign: 'left'
            }}
          >
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: 12,
                padding: 18
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 8 }}>🎯</div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>
                Phase-by-Phase Milestones
              </h3>
              <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>
                Problem validation, MVP architecture, and target customer interviews.
              </p>
            </div>

            <div
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: 12,
                padding: 18
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 8 }}>🏛️</div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>
                Legal & DPIIT Compliance
              </h3>
              <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>
                Entity registration (Pvt Ltd / LLP), DPIIT recognition & tax exemptions.
              </p>
            </div>

            <div
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: 12,
                padding: 18
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 8 }}>💰</div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>
                Seed Grants & Mentors
              </h3>
              <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>
                Direct integration with SISFS, TANSEED, and verified platform mentors.
              </p>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-primary"
            style={{
              padding: '14px 32px',
              fontSize: 16,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              cursor: generating ? 'not-allowed' : 'pointer'
            }}
          >
            {generating ? '⚡ Generating AI Roadmap...' : '🚀 Generate AI Roadmap Now'}
          </button>
        </div>
      </div>
    );
  }

  const overallProgress = roadmap?.overallProgress || 0;
  const stages = roadmap?.stages || [];

  return (
    <div className="container">
      {/* Header Banner */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span className="role-pill" style={{ marginBottom: 8, display: 'inline-block' }}>Personalized Execution Plan</span>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>AI Startup Growth Roadmap</h1>
          <p style={{ color: '#94a3b8', fontSize: 14 }}>
            Tailored stage-by-stage tasks, priority milestones, and verified ecosystem resources for{' '}
            <strong style={{ color: '#ffffff' }}>{roadmap?.startupName || 'Your Startup'}</strong> ({roadmap?.businessDomain || 'Tech'}).
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={handleReset}
            className="btn-secondary"
            style={{ padding: '10px 16px', fontSize: 13, borderColor: 'rgba(244,63,94,0.3)', color: '#fda4af' }}
            title="Reset roadmap"
          >
            🗑️ Reset
          </button>
          <button onClick={handleGenerate} disabled={generating} className="btn-primary" style={{ padding: '12px 20px' }}>
            {generating ? '⚡ Regenerating...' : '🔄 Regenerate Roadmap'}
          </button>
        </div>
      </div>

      {/* Progress Bar Card */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(6, 182, 212, 0.12))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#ffffff' }}>Roadmap Execution Progress</span>
          <span style={{ fontSize: 22, fontWeight: 900, color: '#38bdf8' }}>{overallProgress}% Complete</span>
        </div>
        <div style={{ width: '100%', height: 14, background: '#1e293b', borderRadius: 7, overflow: 'hidden' }}>
          <div
            style={{
              width: `${overallProgress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #6366f1, #06b6d4, #10b981)',
              borderRadius: 7,
              transition: 'width 0.4s ease'
            }}
          ></div>
        </div>
      </div>

      {/* Stage Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {stages.map((stage) => {
          const isCompleted = stage.status === 'completed';
          const isInProgress = stage.status === 'in_progress';
          const badgeClass = isCompleted ? 'status-approved' : isInProgress ? 'status-applied' : 'status-saved';

          return (
            <div
              className="card card-hover"
              key={stage.stageNumber}
              style={{
                borderLeft: isCompleted
                  ? '4px solid #10b981'
                  : isInProgress
                  ? '4px solid #6366f1'
                  : '4px solid rgba(255,255,255,0.1)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: '#ffffff' }}>{stage.title}</h2>
                  <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{stage.description}</p>
                </div>
                <span className={`status-badge ${badgeClass}`}>
                  {isCompleted ? '✓ Completed' : isInProgress ? '⏳ In Progress' : 'Not Started'}
                </span>
              </div>

              {/* Tasks List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
                {stage.tasks.map((task) => (
                  <div
                    key={task.id || task._id}
                    style={{
                      background: task.isCompleted ? 'rgba(16, 185, 129, 0.05)' : '#0d1322',
                      border: '1px solid',
                      borderColor: task.isCompleted ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.06)',
                      borderRadius: 10,
                      padding: 14,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <input
                          type="checkbox"
                          checked={task.isCompleted}
                          onChange={() => handleToggleTask(stage.stageNumber, task.id || task._id)}
                          style={{
                            width: 20,
                            height: 20,
                            marginTop: 2,
                            cursor: 'pointer',
                            accentColor: '#10b981'
                          }}
                        />
                        <div>
                          <span
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: task.isCompleted ? '#94a3b8' : '#ffffff',
                              textDecoration: task.isCompleted ? 'line-through' : 'none'
                            }}
                          >
                            {task.title}
                          </span>
                          {task.description && (
                            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{task.description}</p>
                          )}
                          {task.recommendedAction && (
                            <div style={{ fontSize: 12, color: '#38bdf8', marginTop: 4 }}>
                              💡 <em>Action:</em> {task.recommendedAction}
                            </div>
                          )}
                        </div>
                      </div>

                      <span
                        className="tag"
                        style={{
                          fontSize: 10,
                          margin: 0,
                          background:
                            task.priority === 'critical'
                              ? 'rgba(244, 63, 94, 0.2)'
                              : task.priority === 'high'
                              ? 'rgba(245, 158, 11, 0.2)'
                              : 'rgba(99, 102, 241, 0.2)',
                          color:
                            task.priority === 'critical'
                              ? '#fda4af'
                              : task.priority === 'high'
                              ? '#fcd34d'
                              : '#c7d2fe',
                          border: 'none',
                          textTransform: 'uppercase'
                        }}
                      >
                        {task.priority}
                      </span>
                    </div>

                    {/* Linked Resource */}
                    {task.linkedResourceId && (
                      <div
                        style={{
                          marginTop: 6,
                          paddingTop: 8,
                          borderTop: '1px dashed rgba(255,255,255,0.06)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 8
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8' }}>
                          <span>🔗 Linked Resource:</span>
                          <strong style={{ color: '#e2e8f0' }}>{task.linkedResourceId.title || 'Verified Resource'}</strong>
                          <span className="tag tag-cyan" style={{ margin: 0, fontSize: 10 }}>
                            {task.linkedResourceId.category || task.resourceCategory}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {task.linkedResourceId.externalLink && (
                            <a
                              href={task.linkedResourceId.externalLink}
                              target="_blank"
                              rel="noreferrer"
                              className="link-btn"
                              style={{ padding: '3px 10px', fontSize: 11 }}
                            >
                              Open Link ↗
                            </a>
                          )}
                          <button
                            className="btn-secondary"
                            style={{ padding: '3px 10px', fontSize: 11 }}
                            onClick={() => handleTrackResource(task.linkedResourceId._id)}
                          >
                            + Track
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
