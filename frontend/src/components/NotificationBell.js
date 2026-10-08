import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const wrapRef = useRef(null);
  const navigate = useNavigate();

  const load = () => {
    api.get('/notifications')
      .then(res => { setNotifications(res.data.notifications); setUnreadCount(res.data.unreadCount); })
      .catch(() => {});
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = async (n) => {
    if (!n.isRead) await api.put(`/notifications/${n._id}/read`).catch(() => {});
    setOpen(false);
    load();
    if (n.link) navigate(n.link);
  };

  const handleMarkAllRead = async () => {
    await api.put('/notifications/read-all').catch(() => {});
    load();
  };

  return (
    <div className="notif-bell-wrap" ref={wrapRef}>
      <span className="notif-bell" onClick={() => setOpen(!open)}>
        🔔
        {unreadCount > 0 && <span className="notif-dot">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </span>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-header">
            <span>Notifications</span>
            {unreadCount > 0 && <a onClick={handleMarkAllRead}>Mark all read</a>}
          </div>
          {notifications.length === 0 && <div className="notif-empty">No notifications yet</div>}
          {notifications.map(n => (
            <div key={n._id} className={`notif-item ${!n.isRead ? 'unread' : ''}`} onClick={() => handleItemClick(n)}>
              {n.message}
              <div className="notif-item-time">{new Date(n.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
