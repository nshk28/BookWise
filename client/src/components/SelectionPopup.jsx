import React, { useState } from 'react';
import './SelectionPopup.css';

const HIGHLIGHT_COLORS = [
  { key:'yellow', label:'🟡 Yellow', bg:'rgba(255,220,50,0.50)'  },
  { key:'green',  label:'🟢 Green',  bg:'rgba(80,200,100,0.45)' },
  { key:'pink',   label:'🩷 Pink',   bg:'rgba(255,100,150,0.45)'},
  { key:'blue',   label:'🔵 Blue',   bg:'rgba(80,160,255,0.45)' },
  { key:'orange', label:'🟠 Orange', bg:'rgba(255,160,50,0.50)' },
];

export default function SelectionPopup({ selection, onAction, onClose, onHighlight }) {
  const [showColors, setShowColors] = useState(false);

  if (!selection) return null;

  // ── THE KEY FIX ────────────────────────────────────────────────────────────
  // Every button uses onMouseDown={noFocus} instead of letting the browser
  // give focus to the button.  When a button receives focus the text layer
  // loses focus → browser clears or greys the selection highlight.
  // e.preventDefault() on mousedown stops the browser from moving focus
  // at all, so the text layer keeps focus and the amber selection stays visible.
  const noFocus = (e) => e.preventDefault();

  const actions = [
    { key:'explain',   icon:'💡', label:'Explain'   },
    { key:'discuss',   icon:'💬', label:'Discuss'   },
    { key:'note',      icon:'📝', label:'Add Note'  },
    { key:'summarize', icon:'📋', label:'Summarize' },
  ];

  const handleAction = (key) => {
    onAction(key);
    onClose();
  };

  const handleHighlight = (colorKey) => {
    onHighlight && onHighlight(colorKey);
    onClose();
  };

  return (
    <>
      {/* Backdrop — also uses onMouseDown noFocus so clicking it doesn't
          flicker the selection before onClose fires */}
      <div
        className="popup-backdrop"
        onMouseDown={noFocus}
        onClick={onClose}
      />

      <div
        className="selection-popup fade-in"
        onMouseDown={noFocus}
        style={{
          left: Math.max(10, selection.position.x - 150),
          top:  Math.max(10, selection.position.y - 56),
        }}
      >
        {/* Selected text preview */}
        <div className="popup-excerpt">
          "{selection.text.length > 60
            ? selection.text.substring(0, 60) + '…'
            : selection.text}"
        </div>

        {/* Action buttons */}
        <div className="popup-actions">
          {actions.map(a => (
            <button
              key={a.key}
              className="popup-btn"
              onMouseDown={noFocus}
              onClick={() => handleAction(a.key)}
            >
              <span>{a.icon}</span>
              <span>{a.label}</span>
            </button>
          ))}

          {/* Highlight button — toggles colour picker */}
          <button
            className={`popup-btn highlight-btn ${showColors ? 'active' : ''}`}
            onMouseDown={noFocus}
            onClick={() => setShowColors(s => !s)}
          >
            <span>🖊️</span>
            <span>Highlight</span>
          </button>
        </div>

        {/* Colour picker — only shown after clicking Highlight */}
        {showColors && (
          <div className="color-row fade-in">
            {HIGHLIGHT_COLORS.map(c => (
              <button
                key={c.key}
                className="color-chip"
                title={c.label}
                onMouseDown={noFocus}
                onClick={() => handleHighlight(c.key)}
                style={{ background: c.bg }}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
