import React from 'react';
import './SelectionPopup.css';

export default function SelectionPopup({ selection, onAction, onClose }) {
  if (!selection) return null;

  const actions = [
    { key: 'explain', icon: '💡', label: 'Explain' },
    { key: 'discuss', icon: '💬', label: 'Discuss' },
    { key: 'note', icon: '📝', label: 'Add Note' },
    { key: 'summarize', icon: '📋', label: 'Summarize' },
  ];

  return (
    <>
      <div className="popup-backdrop" onClick={onClose} />
      <div
        className="selection-popup fade-in"
        style={{
          left: Math.max(10, selection.position.x - 120),
          top: Math.max(10, selection.position.y - 56)
        }}
      >
        <div className="popup-excerpt">
          "{selection.text.length > 60 ? selection.text.substring(0, 60) + '…' : selection.text}"
        </div>
        <div className="popup-actions">
          {actions.map(a => (
            <button
              key={a.key}
              className="popup-btn"
              onClick={() => { onAction(a.key); onClose(); }}
            >
              <span>{a.icon}</span>
              <span>{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
