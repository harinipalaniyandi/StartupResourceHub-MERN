import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../api/AuthContext';
import { useToast } from '../api/ToastContext';

export default function Chatbot() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Conversations & History State
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [activeTitle, setActiveTitle] = useState('New Chat');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Chat State
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('auto');
  const [editingConvId, setEditingConvId] = useState(null);
  const [editTitleInput, setEditTitleInput] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const chatScrollRef = useRef(null);
  const textareaRef = useRef(null);

  // Fetch all user conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/chatbot/conversations');
      setConversations(res.data || []);
    } catch (err) {
      console.warn('Could not load chat history:', err.message);
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Load a specific conversation
  const handleSelectConversation = async (convId) => {
    if (convId === activeConvId) return;
    setLoading(true);
    try {
      const res = await api.get(`/chatbot/conversations/${convId}`);
      setActiveConvId(res.data._id);
      setActiveTitle(res.data.title || 'Conversation');
      setSelectedLanguage(res.data.language || 'auto');

      const loadedMessages = (res.data.messages || []).map(m => ({
        sender: m.sender,
        text: m.text,
        matches: m.matchedResourcesData || m.matches || [],
        mentors: m.matchedMentorsData || [],
        timestamp: m.timestamp
      }));

      setMessages(loadedMessages);
    } catch (err) {
      showToast('Failed to load conversation history', 'error');
    } finally {
      setLoading(false);
      if (window.innerWidth < 768) setSidebarOpen(false);
    }
  };

  // Start fresh new chat
  const handleNewChat = () => {
    setActiveConvId(null);
    setActiveTitle('New Chat');
    setMessages([]);
    setInput('');
    if (textareaRef.current) textareaRef.current.focus();
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  // Rename Conversation
  const handleSaveRename = async (convId, e) => {
    if (e) e.stopPropagation();
    if (!editTitleInput.trim()) {
      setEditingConvId(null);
      return;
    }
    try {
      await api.put(`/chatbot/conversations/${convId}/rename`, { title: editTitleInput.trim() });
      setConversations(prev =>
        prev.map(c => (c._id === convId ? { ...c, title: editTitleInput.trim() } : c))
      );
      if (activeConvId === convId) {
        setActiveTitle(editTitleInput.trim());
      }
      showToast('Chat renamed');
    } catch (err) {
      showToast('Failed to rename chat', 'error');
    } finally {
      setEditingConvId(null);
    }
  };

  // Delete single conversation
  const handleDeleteConversation = async (convId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Delete this conversation?')) return;
    try {
      await api.delete(`/chatbot/conversations/${convId}`);
      setConversations(prev => prev.filter(c => c._id !== convId));
      if (activeConvId === convId) {
        handleNewChat();
      }
      showToast('Chat deleted');
    } catch (err) {
      showToast('Failed to delete chat', 'error');
    }
  };

  // Clear all conversations
  const handleClearAll = async () => {
    try {
      await api.delete('/chatbot/conversations');
      setConversations([]);
      handleNewChat();
      setShowClearConfirm(false);
      showToast('All chat history cleared');
    } catch (err) {
      showToast('Failed to clear conversations', 'error');
    }
  };

  // Send message
  const handleSend = async (customText) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || loading) return;

    // Append user message immediately
    const userMsg = { sender: 'user', text: textToSend, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chatbot', {
        message: textToSend,
        conversationId: activeConvId,
        language: selectedLanguage
      });

      const botMsg = {
        sender: 'bot',
        text: res.data.reply,
        matches: res.data.matches || [],
        mentors: res.data.mentors || [],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMsg]);

      // If backend created/updated conversation, sync ID & title
      if (res.data.conversationId) {
        setActiveConvId(res.data.conversationId);
        if (res.data.conversationTitle) {
          setActiveTitle(res.data.conversationTitle);
        }
        fetchConversations();
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: 'Sorry, I encountered an issue connecting with the intelligence server. Please try asking again.',
          matches: [],
          mentors: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Track resource in application tracker
  const handleTrackResource = async (resourceId) => {
    try {
      await api.post('/applications', { resourceId });
      showToast('Resource added to your Application Tracker! 📋');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to track resource', 'error');
    }
  };

  // Copy message text to clipboard
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard! 📋');
  };

  // Auto-resize textarea
  const handleTextareaChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
  };

  // Handle Enter key (Shift+Enter for newline)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group conversations by time category
  const getGroupedConversations = () => {
    const filtered = conversations.filter(c =>
      (c.title || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const sevenDaysAgo = today - 7 * 86400000;

    const groups = {
      Today: [],
      Yesterday: [],
      'Previous 7 Days': [],
      Older: []
    };

    filtered.forEach(conv => {
      const convTime = new Date(conv.updatedAt || conv.createdAt).getTime();
      if (convTime >= today) {
        groups.Today.push(conv);
      } else if (convTime >= yesterday) {
        groups.Yesterday.push(conv);
      } else if (convTime >= sevenDaysAgo) {
        groups['Previous 7 Days'].push(conv);
      } else {
        groups.Older.push(conv);
      }
    });

    return groups;
  };

  // Welcome prompt suggestions
  const welcomePrompts = [
    {
      icon: '💡',
      title: 'Idea Assessment & Strategy',
      desc: 'Pitch any idea (handcrafted goods, agritech, SaaS, D2C). Get deep analysis, target segments & USP improvements.',
      prompt: 'bro naa plastic wire craft pannuren, idha startup business-ah panna epdi irukkum? What products and customers should I target?'
    },
    {
      icon: '🌾',
      title: 'Platform & Marketplace Models',
      desc: 'Brainstorm equipment sharing, rental workflows, booking systems, and revenue mechanics.',
      prompt: 'Enakku agriculture resource sharing platform idea irukku. Farmers equipment share pannalam. Idhu nalla idea-va? Improve panna enna add pannalam?'
    },
    {
      icon: '💰',
      title: 'Funding & Seed Grants',
      desc: 'Discover seed grants, TANSEED, SISFS, and government startup funding options tailored to your stage.',
      prompt: 'En startup-ku funding venum - what government schemes and seed grants fit my current stage?'
    },
    {
      icon: '👨‍🏫',
      title: 'Connect with Mentors',
      desc: 'Find verified domain mentors in tech, marketing, agriculture, operations, and fundraising.',
      prompt: 'I need an experienced mentor for marketing and investor pitching.'
    },
    {
      icon: '🗺️',
      title: 'Execution Roadmap',
      desc: 'Generate a structured 6-phase startup execution roadmap with milestone tasks and validation steps.',
      prompt: 'Create a comprehensive 6-phase startup roadmap from idea validation to launch.'
    },
    {
      icon: '📊',
      title: 'Startup Readiness Audit',
      desc: 'Evaluate product, market, team, legal, and financial readiness bottlenecks before fundraising.',
      prompt: 'Analyze my startup readiness and identify key bottlenecks I need to fix.'
    }
  ];

  const quickChips = [
    '💡 Plastic Wire Craft Idea',
    '🌾 Agri Equipment Sharing Platform',
    '💰 Funding Schemes for Idea Stage (SISFS/TANSEED)',
    '🗺️ 6-Phase Startup Roadmap',
    '📊 Startup Readiness Audit',
    '👨‍🏫 Find Domain Mentors',
    '⚖️ DPIIT Startup India Registration'
  ];

  // Helper to format bot markdown text cleanly
  const renderFormattedText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Heading level 3 or 4
      if (line.startsWith('### ') || line.startsWith('#### ')) {
        return (
          <h4 key={idx} style={{ fontSize: 15, fontWeight: 700, margin: '12px 0 4px', color: 'var(--primary-light)' }}>
            {line.replace(/^#+\s*/, '')}
          </h4>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h3 key={idx} style={{ fontSize: 16, fontWeight: 800, margin: '16px 0 6px', color: '#ffffff' }}>
            {line.replace(/^##\s*/, '')}
          </h3>
        );
      }
      // Section highlights with emojis (like 💡, 🎯, 📦, 💰, ✨, 🚀, ⚠️, 📌, ❓)
      if (/^[💡🎯📦💰✨🚀⚠️📌❓]\s/.test(line.trim())) {
        return (
          <div key={idx} style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--accent-cyan)', margin: '14px 0 4px', letterSpacing: '0.2px' }}>
            <span dangerouslySetInnerHTML={{ __html: formatBold(line) }} />
          </div>
        );
      }
      // Bullet points
      if (line.trim().startsWith('•') || line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const content = line.trim().replace(/^([•\-*])\s*/, '');
        return (
          <div key={idx} style={{ display: 'flex', gap: 8, margin: '3px 0', paddingLeft: 6 }}>
            <span style={{ color: 'var(--primary-light)', fontWeight: 700 }}>•</span>
            <span dangerouslySetInnerHTML={{ __html: formatBold(content) }} />
          </div>
        );
      }
      // Numbered list
      if (/^\d+\.\s/.test(line.trim())) {
        return (
          <div key={idx} style={{ margin: '4px 0', paddingLeft: 6 }}>
            <span dangerouslySetInnerHTML={{ __html: formatBold(line) }} />
          </div>
        );
      }
      // Empty line
      if (!line.trim()) {
        return <div key={idx} style={{ height: 6 }} />;
      }
      return (
        <p key={idx} style={{ margin: '3px 0' }} dangerouslySetInnerHTML={{ __html: formatBold(line) }} />
      );
    });
  };

  const formatBold = (str) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code style="background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 12.5px;">$1</code>');
  };

  const groupedHistory = getGroupedConversations();

  return (
    <div className="ai-chat-wrapper">
      {/* 1. LEFT SIDEBAR (ChatGPT Style) */}
      <aside className={`ai-sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
        <div className="ai-sidebar-header">
          <div className="ai-sidebar-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>✨</span>
              <span style={{ fontWeight: 800, fontSize: 15, color: '#ffffff' }}>Startup AI</span>
            </div>
            <button
              className="ai-history-btn"
              onClick={() => setSidebarOpen(false)}
              title="Collapse Sidebar"
              style={{ fontSize: 14 }}
            >
              ✕
            </button>
          </div>

          <button className="btn-new-chat" onClick={handleNewChat}>
            <span>+</span> New Chat
          </button>

          <div className="ai-search-box">
            <span className="ai-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* History Grouped List */}
        <div className="ai-history-list">
          {Object.entries(groupedHistory).map(([groupName, items]) => {
            if (items.length === 0) return null;
            return (
              <div key={groupName}>
                <div className="ai-history-group-title">{groupName}</div>
                {items.map((conv) => {
                  const isActive = conv._id === activeConvId;
                  const isEditing = conv._id === editingConvId;

                  return (
                    <div
                      key={conv._id}
                      className={`ai-history-item ${isActive ? 'active' : ''}`}
                      onClick={() => handleSelectConversation(conv._id)}
                    >
                      <div className="ai-history-title-wrap">
                        <span style={{ fontSize: 13, opacity: 0.8 }}>💬</span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editTitleInput}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setEditTitleInput(e.target.value)}
                            onBlur={(e) => handleSaveRename(conv._id, e)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(conv._id, e);
                              if (e.key === 'Escape') setEditingConvId(null);
                            }}
                            style={{
                              background: 'var(--bg-main)',
                              border: '1px solid var(--primary)',
                              borderRadius: 4,
                              color: '#fff',
                              padding: '2px 6px',
                              fontSize: 12,
                              width: '100%'
                            }}
                          />
                        ) : (
                          <span title={conv.title} style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {conv.title || 'Conversation'}
                          </span>
                        )}
                      </div>

                      {!isEditing && (
                        <div className="ai-history-actions">
                          <button
                            className="ai-history-btn"
                            title="Rename"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingConvId(conv._id);
                              setEditTitleInput(conv.title || '');
                            }}
                          >
                            ✏️
                          </button>
                          <button
                            className="ai-history-btn"
                            title="Delete"
                            onClick={(e) => handleDeleteConversation(conv._id, e)}
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {conversations.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 12, padding: '24px 8px' }}>
              No chat history yet.<br />Start a conversation below!
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="ai-sidebar-footer">
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            👤 {user?.name ? user.name.split(' ')[0] : 'Founder'}
          </div>
          {conversations.length > 0 && (
            <button
              className="ai-history-btn"
              onClick={() => setShowClearConfirm(true)}
              style={{ fontSize: 11, color: 'var(--accent-rose)' }}
            >
              🧹 Clear All
            </button>
          )}
        </div>
      </aside>

      {/* 2. MAIN CHAT AREA */}
      <main className="ai-main">
        {/* Chat Top Header */}
        <header className="ai-chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {!sidebarOpen && (
              <button
                className="btn-secondary"
                style={{ padding: '6px 10px', fontSize: 13 }}
                onClick={() => setSidebarOpen(true)}
                title="Open Sidebar"
              >
                ☰ History
              </button>
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)' }}>
                  {activeTitle}
                </h2>
                <span className="role-pill" style={{ fontSize: 10, padding: '2px 8px' }}>
                  ✨ Startup AI Assistant
                </span>
              </div>
            </div>
          </div>

          {/* Quick Sub-module Navigation Pills & Language Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="ai-nav-pills">
              <button className="ai-nav-pill active" onClick={handleNewChat}>
                💬 Chat & Strategy
              </button>
              <button className="ai-nav-pill" onClick={() => navigate('/search?category=Funding')}>
                💰 Funding
              </button>
              <button className="ai-nav-pill" onClick={() => navigate('/mentors')}>
                👨‍🏫 Mentors
              </button>
              <button className="ai-nav-pill" onClick={() => navigate('/readiness')}>
                📊 Readiness
              </button>
              <button className="ai-nav-pill" onClick={() => navigate('/roadmap')}>
                🗺️ Roadmap
              </button>
            </div>

            {/* Language Selector */}
            <select
              className="ai-lang-select"
              value={selectedLanguage}
              onChange={(e) => {
                setSelectedLanguage(e.target.value);
                showToast(`Language set to: ${e.target.options[e.target.selectedIndex].text}`);
              }}
              title="Select AI Response Language"
            >
              <option value="auto">🌐 Auto Detect</option>
              <option value="en">🇺🇸 English</option>
              <option value="ta">🇮🇳 தமிழ் (Tamil)</option>
              <option value="tanglish">⚡ Tanglish</option>
            </select>
          </div>
        </header>

        {/* Messages Stream Scroll Area */}
        <div className="ai-messages-scroll" ref={chatScrollRef}>
          {/* Welcome Screen when no messages */}
          {messages.length === 0 && (
            <div className="ai-welcome-container">
              <div className="ai-welcome-hero">
                <div style={{ fontSize: 38, marginBottom: 8 }}>🚀</div>
                <h1>Startup AI Advisor & Virtual Co-Founder</h1>
                <p>
                  Analyze any business idea, brainstorm customer segments & pricing models, build execution roadmaps, and discover verified seed grants & mentors.
                </p>
              </div>

              {/* 6 Category Interactive Prompt Cards */}
              <div className="ai-prompt-grid">
                {welcomePrompts.map((item, idx) => (
                  <div
                    key={idx}
                    className="ai-prompt-card"
                    onClick={() => handleSend(item.prompt)}
                  >
                    <div className="ai-prompt-card-icon">{item.icon}</div>
                    <div className="ai-prompt-card-title">{item.title}</div>
                    <div className="ai-prompt-card-desc">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Render Active Messages */}
          {messages.map((m, i) => (
            <div key={i} className={`ai-msg-row ${m.sender}`}>
              <div className={`ai-avatar ${m.sender}`}>
                {m.sender === 'user' ? (user?.name ? user.name[0].toUpperCase() : 'U') : '✨'}
              </div>

              <div className="ai-msg-body">
                <div className={`ai-msg-bubble ${m.sender}`}>
                  {m.sender === 'bot' ? renderFormattedText(m.text) : m.text}
                </div>

                {/* Bot Actions: Copy text */}
                {m.sender === 'bot' && (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 2, paddingLeft: 4 }}>
                    <button
                      className="ai-history-btn"
                      onClick={() => handleCopy(m.text)}
                      style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      📋 Copy
                    </button>
                    {m.language && m.language !== 'auto' && (
                      <span style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                        🌐 {m.language}
                      </span>
                    )}
                  </div>
                )}

                {/* Verified Database Resource Matches */}
                {m.matches && m.matches.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      ⚡ Verified Database Resources ({m.matches.length})
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
                      {m.matches.map((res) => (
                        <div
                          key={res._id}
                          style={{
                            background: 'var(--bg-card-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-sm)',
                            padding: 12,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: 10
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>{res.title}</div>
                            <div style={{ fontSize: 11, color: 'var(--accent-cyan)', marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              <span>📂 {res.category}</span>
                              <span>📍 {res.location || 'India'}</span>
                              <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>
                                ⭐ {res.matchScore || 88}% Match
                              </span>
                            </div>
                            {res.description && (
                              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, lineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {res.description}
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                            {res.externalLink && (
                              <a
                                href={res.externalLink}
                                target="_blank"
                                rel="noreferrer"
                                className="link-btn"
                                style={{ padding: '4px 10px', fontSize: 11 }}
                              >
                                Portal ↗
                              </a>
                            )}
                            <button
                              className="btn-secondary"
                              style={{ padding: '4px 10px', fontSize: 11 }}
                              onClick={() => handleTrackResource(res._id)}
                            >
                              + Track
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Mentors */}
                {m.mentors && m.mentors.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      🎓 Recommended Verified Mentors ({m.mentors.length})
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
                      {m.mentors.map((mentor, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: 'var(--bg-card-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-sm)',
                            padding: 12,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: 8
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>
                              👨‍🏫 {mentor.name}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--accent-purple)', marginTop: 2 }}>
                              {mentor.mentorDomain || mentor.industry} • {mentor.experienceYears || '5+'} yrs exp
                            </div>
                            {mentor.expertise && (
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                                💡 <em>{mentor.expertise}</em>
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-emerald)' }}>
                              ⭐ {mentor.matchScore || 90}% Match
                            </span>
                            <button
                              className="btn-primary"
                              style={{ padding: '3px 9px', fontSize: 11 }}
                              onClick={() => navigate('/mentors')}
                            >
                              Connect →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {loading && (
            <div className="ai-msg-row">
              <div className="ai-avatar bot">✨</div>
              <div className="ai-msg-body">
                <div className="ai-msg-bubble bot" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ animation: 'spin 1s linear infinite' }}>🧠</span>
                  <span>Synthesizing startup knowledge, database resources & mentors...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. FLOATING INPUT SECTION */}
        <div className="ai-input-section">
          {/* Quick Follow-up Chips */}
          <div className="ai-chips-bar">
            {quickChips.map((chip, idx) => (
              <button
                key={idx}
                className="ai-chip"
                onClick={() => handleSend(chip)}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="ai-input-box"
          >
            <textarea
              ref={textareaRef}
              className="ai-textarea"
              rows={1}
              placeholder="Ask anything (e.g. 'En startup-ku funding venum', 'Build a roadmap', 'Recommend mentors')..."
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />

            <button
              type="submit"
              className="ai-send-btn"
              disabled={loading || !input.trim()}
            >
              <span>Send</span> →
            </button>
          </form>

          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
            Startup Resource Hub AI is grounded in verified platform grants, mentors, and roadmap data.
          </div>
        </div>
      </main>

      {/* Clear History Confirmation Modal */}
      {showClearConfirm && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: '#ffffff' }}>
              Clear All Chat History?
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
              This will permanently delete all your conversation history and generated guidance. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn-secondary" onClick={() => setShowClearConfirm(false)}>
                Cancel
              </button>
              <button className="btn-danger" onClick={handleClearAll}>
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
