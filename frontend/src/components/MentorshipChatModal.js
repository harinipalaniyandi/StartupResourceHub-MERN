import React, { useState, useEffect, useRef } from 'react';
import api from '../api/api';
import { useAuth } from '../api/AuthContext';
import { useToast } from '../api/ToastContext';

export default function MentorshipChatModal({ mentorRequestId, onClose, onMessageSent }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [mentorRequest, setMentorRequest] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const isFounder = user?.role === 'founder';
  const partner = isFounder ? mentorRequest?.mentor : mentorRequest?.founder;

  // Load conversation & context
  const loadConversation = async (silent = false) => {
    if (!mentorRequestId) return;
    try {
      if (!silent) setLoading(true);
      const res = await api.get(`/mentors/messages/${mentorRequestId}`);
      setMentorRequest(res.data.mentorRequest);
      setMessages(res.data.messages || []);
    } catch (err) {
      if (!silent) showToast(err.response?.data?.message || 'Failed to load conversation', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadConversation();

    // Polling for live updates every 4s
    const pollInterval = setInterval(() => {
      loadConversation(true);
    }, 4000);

    return () => clearInterval(pollInterval);
  }, [mentorRequestId]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when modal opens
  useEffect(() => {
    if (!loading) {
      inputRef.current?.focus();
    }
  }, [loading]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || sending) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const res = await api.post('/mentors/messages', {
        mentorRequestId,
        text: textToSend
      });

      setMessages((prev) => [...prev, res.data.data]);
      if (onMessageSent) onMessageSent();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send message', 'error');
      setInputText(textToSend); // restore on error
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickPrompts = isFounder ? [
    '📅 When would be a good time for a 30-min call?',
    '📊 Here is an update on our progress & prototype demo.',
    '❓ I had a quick question regarding our go-to-market strategy.',
    '🙏 Thank you so much for the valuable advice!'
  ] : [
    '👋 Hi! Let’s schedule a 30-min strategy review call.',
    '📋 Please share your pitch deck or recent metrics before our call.',
    '💡 Feel free to drop your specific questions here anytime.',
    '✅ Looking forward to our mentorship session!'
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        style={{
          maxWidth: 680,
          width: '95%',
          height: '82vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            background: 'var(--bg-card-secondary)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: isFounder
                  ? 'linear-gradient(135deg, var(--accent-purple), var(--primary))'
                  : 'linear-gradient(135deg, var(--accent-cyan), var(--primary))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                color: '#fff',
                fontWeight: 800,
                boxShadow: '0 0 12px var(--primary-glow)'
              }}
            >
              {partner?.name ? partner.name.charAt(0).toUpperCase() : (isFounder ? 'M' : 'F')}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-main)' }}>
                  {partner?.name || (isFounder ? 'Mentor' : 'Founder')}
                </h3>
                <span className="role-pill" style={{ fontSize: 10 }}>
                  {isFounder ? 'Mentor' : 'Founder'}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#10b981',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}></span>
                  Active Channel
                </span>
              </div>

              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {isFounder ? (
                  <>
                    {partner?.mentorDomain || partner?.industry || 'Advisor'} • {partner?.company || 'Industry Veteran'}
                  </>
                ) : (
                  <>
                    {mentorRequest?.startupContext?.startupName || partner?.startupName || 'Startup'} • {mentorRequest?.startupContext?.businessDomain || partner?.businessDomain || 'Early Stage'}
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            style={{ padding: '6px 12px', fontSize: 13, borderRadius: '50%', width: 32, height: 32 }}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Meeting & Notes Context Bar (if set) */}
        {(mentorRequest?.meetingDetails || mentorRequest?.mentorNotes) && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 182, 212, 0.08))',
              borderBottom: '1px solid rgba(16, 185, 129, 0.25)',
              padding: '10px 18px',
              fontSize: 12.5,
              display: 'flex',
              flexDirection: 'column',
              gap: 4
            }}
          >
            {mentorRequest.meetingDetails && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-main)' }}>
                <span>📅</span>
                <strong>Meeting Info:</strong>
                <span style={{ color: 'var(--accent-cyan)' }}>{mentorRequest.meetingDetails}</span>
              </div>
            )}
            {mentorRequest.mentorNotes && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                <span>📝</span>
                <strong>Mentor Notes:</strong>
                <span>{mentorRequest.mentorNotes}</span>
              </div>
            )}
          </div>
        )}

        {/* Message Stream */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            background: 'var(--bg-main)'
          }}
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
              💬 Connecting to mentorship thread...
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🤝</div>
              <strong style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                This is the start of your direct mentorship conversation.
              </strong>
              <p style={{ fontSize: 12, marginTop: 4 }}>
                Send a message to introduce yourself, discuss roadmap milestones, or schedule your 1-on-1 session.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const senderId = (msg.sender?._id || msg.sender)?.toString();
              const currentUserId = user?.id || user?._id;
              const isMe = senderId === currentUserId?.toString();

              return (
                <div
                  key={msg._id}
                  style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '82%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--text-dim)',
                      marginBottom: 3,
                      padding: '0 4px'
                    }}
                  >
                    {isMe ? 'You' : (msg.sender?.name || partner?.name || 'Partner')}
                  </div>

                  <div
                    style={{
                      background: isMe
                        ? 'linear-gradient(135deg, var(--primary), var(--primary-hover))'
                        : 'var(--bg-card-secondary)',
                      color: isMe ? '#ffffff' : 'var(--text-main)',
                      border: isMe ? 'none' : '1px solid var(--border-color)',
                      borderRadius: 16,
                      borderBottomRightRadius: isMe ? 4 : 16,
                      borderBottomLeftRadius: isMe ? 16 : 4,
                      padding: '12px 16px',
                      fontSize: 13.5,
                      lineHeight: 1.5,
                      boxShadow: isMe
                        ? '0 4px 14px var(--primary-glow)'
                        : '0 4px 12px rgba(0, 0, 0, 0.2)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    {msg.text}
                  </div>

                  <div
                    style={{
                      fontSize: 10.5,
                      color: 'var(--text-dim)',
                      marginTop: 3,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '0 4px'
                    }}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isMe && (
                      <span style={{ color: msg.isRead ? 'var(--accent-cyan)' : 'var(--text-dim)' }}>
                        {msg.isRead ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div
          style={{
            padding: '8px 16px',
            background: 'var(--bg-card-subtle)',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            whiteSpace: 'nowrap'
          }}
        >
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              className="btn-secondary"
              style={{
                fontSize: 11,
                padding: '4px 10px',
                borderRadius: 14,
                border: '1px solid var(--border-color)',
                flexShrink: 0
              }}
              onClick={() => setInputText(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSend}
          style={{
            padding: '12px 16px',
            background: 'var(--bg-card-secondary)',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            gap: 10,
            alignItems: 'center'
          }}
        >
          <textarea
            ref={inputRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Press Enter to send)"
            style={{
              flex: 1,
              resize: 'none',
              background: 'var(--input-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              fontSize: 13.5,
              maxHeight: 100,
              minHeight: 42
            }}
          />

          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="btn-primary"
            style={{
              padding: '10px 18px',
              height: 42,
              borderRadius: 'var(--radius-md)',
              flexShrink: 0
            }}
          >
            {sending ? 'Sending...' : 'Send 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
}
