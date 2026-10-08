import React from 'react';

export default function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmLabel = 'Delete', danger = true }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p style={{ color: '#666', fontSize: 14 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn-secondary" style={{ flex: 1, borderRadius: 9 }} onClick={onCancel}>Cancel</button>
          <button
            className={danger ? 'admin-btn-delete' : 'admin-btn-edit'}
            style={{ flex: 1, borderRadius: 9, padding: '11px 0', fontSize: 14 }}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
