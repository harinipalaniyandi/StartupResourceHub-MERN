import React, { useState } from 'react';
import api from '../api/api';
import { useToast } from '../api/ToastContext';

export default function Search() {
  const { showToast } = useToast();

  const [mode, setMode] = useState('semantic'); // 'semantic' | 'filter'
  const [semanticQuery, setSemanticQuery] = useState('');
  const [extractedIntent, setExtractedIntent] = useState(null);

  const [filters, setFilters] = useState({
    keyword: '',
    category: '',
    industry: '',
    stage: '',
    location: '',
    fundingType: ''
  });

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  // Natural Language Semantic Search
  const handleSemanticSearch = async (e) => {
    e.preventDefault();
    if (!semanticQuery.trim()) return;

    setError('');
    setLoading(true);
    setExtractedIntent(null);

    try {
      const res = await api.post('/resources/semantic-search', { query: semanticQuery });
      setExtractedIntent(res.data.intent);
      setResults(res.data.results);
    } catch (err) {
      setError(err.response?.data?.message || 'Semantic search failed');
    } finally {
      setLoading(false);
    }
  };

  // Structured Filter Search
  const handleFilterSearch = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setExtractedIntent(null);

    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const res = await api.get('/resources/search', { params });
      setResults(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async (resourceId) => {
    try {
      await api.post('/applications', { resourceId });
      showToast('Added resource to your Application Tracker! 📋');
    } catch (err) {
      showToast('Failed to track resource', 'error');
    }
  };

  const samplePrompts = [
    "I'm starting a handmade e-commerce business in Tamil Nadu and need early-stage funding.",
    "Seed grants for deeptech and agritech prototypes in India.",
    "Fintech mentorship and payment gateway credits for MVP stage.",
    "Government seed funding schemes with zero equity dilution."
  ];

  return (
    <div className="container">
      {/* Header Card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div>
            <span className="role-pill" style={{ marginBottom: 6, display: 'inline-block' }}>Ecosystem Discovery</span>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>Search & Opportunity Intelligence</h1>
            <p style={{ color: '#94a3b8', fontSize: 13 }}>
              Explore funding grants, government schemes, tools, incubators, and mentors.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="tab-nav" style={{ margin: 0 }}>
            <button className={`tab-btn ${mode === 'semantic' ? 'active' : ''}`} onClick={() => setMode('semantic')}>
              ✨ AI Semantic Search
            </button>
            <button className={`tab-btn ${mode === 'filter' ? 'active' : ''}`} onClick={() => setMode('filter')}>
              🔍 Filter Search
            </button>
          </div>
        </div>

        {/* Semantic Search Mode */}
        {mode === 'semantic' ? (
          <div>
            <form onSubmit={handleSemanticSearch} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input
                style={{ flex: 1, minWidth: 280, padding: 14, fontSize: 15 }}
                placeholder="Ask in natural language e.g. 'I need early seed grants for agritech in Tamil Nadu'..."
                value={semanticQuery}
                onChange={(e) => setSemanticQuery(e.target.value)}
                required
              />
              <button type="submit" disabled={loading} style={{ padding: '14px 24px', fontSize: 15 }}>
                {loading ? '🧠 Understanding Intent...' : '✨ Discover Opportunities'}
              </button>
            </form>

            <div style={{ marginTop: 14 }}>
              <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Try queries:</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                {samplePrompts.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    className="btn-secondary"
                    style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20 }}
                    onClick={() => setSemanticQuery(p)}
                  >
                    "{p.slice(0, 45)}..."
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Filter Search Mode */
          <form onSubmit={handleFilterSearch}>
            <div className="auth-field">
              <input
                name="keyword"
                placeholder="Keyword search (e.g. seed grant, AWS credits, DPIIT)"
                value={filters.keyword}
                onChange={handleFilterChange}
              />
            </div>
            <div className="grid-3" style={{ gap: 12, marginBottom: 14 }}>
              <div>
                <label>Category</label>
                <select name="category" value={filters.category} onChange={handleFilterChange}>
                  <option value="">All Categories</option>
                  <option value="Funding">Funding</option>
                  <option value="Government Scheme">Government Scheme</option>
                  <option value="Mentor">Mentor</option>
                  <option value="Tool/Software">Tool/Software</option>
                  <option value="Co-working Space">Co-working Space</option>
                  <option value="Legal/Compliance">Legal/Compliance</option>
                  <option value="Incubator/Accelerator">Incubator/Accelerator</option>
                </select>
              </div>

              <div>
                <label>Domain / Industry</label>
                <input name="industry" placeholder="e.g. Fintech, Agritech, E-commerce" value={filters.industry} onChange={handleFilterChange} />
              </div>

              <div>
                <label>Startup Stage</label>
                <select name="stage" value={filters.stage} onChange={handleFilterChange}>
                  <option value="">All Stages</option>
                  <option value="idea">Idea</option>
                  <option value="mvp">MVP</option>
                  <option value="early_revenue">Early Revenue</option>
                  <option value="scaling">Scaling</option>
                </select>
              </div>

              <div>
                <label>Location</label>
                <input name="location" placeholder="e.g. Tamil Nadu, India, Global" value={filters.location} onChange={handleFilterChange} />
              </div>

              <div>
                <label>Funding Type</label>
                <select name="fundingType" value={filters.fundingType} onChange={handleFilterChange}>
                  <option value="">All Types</option>
                  <option value="Grant">Grant (Non-dilutive)</option>
                  <option value="Equity">Equity</option>
                  <option value="Credits">Credits & Perks</option>
                  <option value="Workspace">Workspace</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button type="submit" disabled={loading} style={{ width: '100%', height: 44 }}>
                  {loading ? 'Searching...' : 'Apply Filters'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      {/* Semantic Intent Breakdown Card */}
      {extractedIntent && (
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(6, 182, 212, 0.12))',
            border: '1px solid rgba(6, 182, 212, 0.3)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 18 }}>🧠</span>
            <strong style={{ fontSize: 14, color: '#38bdf8' }}>AI Extracted Query Intent:</strong>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 13, color: '#cbd5e1' }}>
            <span><strong>Domain:</strong> {extractedIntent.domain || 'All'}</span>
            <span>•</span>
            <span><strong>Location:</strong> {extractedIntent.location || 'All'}</span>
            <span>•</span>
            <span><strong>Stage:</strong> {extractedIntent.stage || 'All'}</span>
            <span>•</span>
            <span><strong>Category:</strong> {extractedIntent.category || 'All'}</span>
          </div>
          {extractedIntent.summary && (
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6, fontStyle: 'italic' }}>
              Target: {extractedIntent.summary}
            </p>
          )}
        </div>
      )}

      {/* Results List */}
      {results && results.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: '#94a3b8', fontSize: 15 }}>No resources found matching your search. Try broadening your keywords or filters.</p>
        </div>
      )}

      {results && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8' }}>
            Found {results.length} verified opportunities:
          </div>

          {results.map((r) => (
            <div className="card resource-card card-hover" key={r._id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                {r.matchScore > 0 && <span className="match-badge">⭐ {r.matchScore}% Relevance</span>}
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
                  ✨ {r.matchReason}
                </div>
              )}

              {/* Eligibility & Required Docs */}
              {r.eligibilityCriteria && (
                <div style={{ fontSize: 13, color: '#94a3b8', margin: '8px 0' }}>
                  <strong>Eligibility:</strong> {r.eligibilityCriteria}
                </div>
              )}

              {r.requiredDocuments && r.requiredDocuments.length > 0 && (
                <div style={{ fontSize: 12, color: '#a5b4fc', margin: '6px 0' }}>
                  <strong>Required Documents:</strong> {r.requiredDocuments.join(', ')}
                </div>
              )}

              <div style={{ margin: '12px 0' }}>
                <span className="tag tag-cyan">{r.category}</span>
                <span className="tag">{r.industryFocus || 'All Domains'}</span>
                <span className="tag">{r.location || 'India'}</span>
                {r.fundingType && <span className="tag tag-purple">{r.fundingType}</span>}
                {r.budgetRange && <span className="tag tag-amber">{r.budgetRange}</span>}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center' }}>
                {r.externalLink && (
                  <a className="link-btn" href={r.externalLink} target="_blank" rel="noreferrer">
                    Apply on Official Portal ↗
                  </a>
                )}
                <button className="btn-secondary" style={{ borderRadius: 8, padding: '8px 14px' }} onClick={() => handleTrack(r._id)}>
                  + Track Application
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
