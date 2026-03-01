import React from 'react';
import './SelectionPopup.css';

const HIGHLIGHT_COLORS = {
  yellow: { bg: 'rgba(255, 220, 50, 0.45)', label: '🟡' },
  green:  { bg: 'rgba(80, 200, 100, 0.4)',  label: '🟢' },
  pink:   { bg: 'rgba(255, 100, 150, 0.4)', label: '🩷' },
  blue:   { bg: 'rgba(80, 160, 255, 0.4)',  label: '🔵' },
  orange: { bg: 'rgba(255, 160, 50, 0.45)', label: '🟠' },
};

const BOOKMARKS = [
  { id: 'ribbon',    emoji: '🎀', label: 'Ribbon' },
  { id: 'star',      emoji: '⭐', label: 'Star' },
  { id: 'heart',     emoji: '❤️', label: 'Heart' },
  { id: 'fire',      emoji: '🔥', label: 'Fire' },
  { id: 'gem',       emoji: '💎', label: 'Gem' },
  { id: 'leaf',      emoji: '🍃', label: 'Leaf' },
  { id: 'moon',      emoji: '🌙', label: 'Moon' },
  { id: 'lightning', emoji: '⚡', label: 'Lightning' },
];

export default function SelectionPopup({
  selection, onAction, onClose,
  onHighlight, onBookmark,
  currentPage, bookId
}) {
  const [subMenu, setSubMenu] = React.useState(null); // 'highlight' | 'bookmark' | null

  if (!selection) return null;

  const actions = [
    { key: 'explain',   icon: '💡', label: 'Explain' },
    { key: 'discuss',   icon: '💬', label: 'Discuss' },
    { key: 'note',      icon: '📝', label: 'Add Note' },
    { key: 'highlight', icon: '🖊️', label: 'Highlight' },
    { key: 'bookmark',  icon: '🔖', label: 'Bookmark' },
  ];

  const handleAction = (key) => {
    if (key === 'highlight') {
      setSubMenu(subMenu === 'highlight' ? null : 'highlight');
      return;
    }
    if (key === 'bookmark') {
      setSubMenu(subMenu === 'bookmark' ? null : 'bookmark');
      return;
    }
    onAction(key);
    onClose();
  };

  const handleHighlightColor = (color) => {
    onHighlight && onHighlight(color);
    onClose();
  };

  const handleBookmarkPick = (bm) => {
    onBookmark && onBookmark(bm);
    onClose();
  };

  return (
    <>
      <div className="popup-backdrop" onClick={onClose} />
      <div
        className="selection-popup fade-in"
        style={{
          left: Math.max(10, selection.position.x - 150),
          top: Math.max(10, selection.position.y - 56)
        }}
      >
        <div className="popup-excerpt">
          "{selection.text.length > 60
            ? selection.text.substring(0, 60) + '…'
            : selection.text}"
        </div>

        {/* Main actions */}
        <div className="popup-actions">
          {actions.map(a => (
            <button
              key={a.key}
              className={`popup-btn ${subMenu === a.key ? 'active' : ''}`}
              onClick={() => handleAction(a.key)}
            >
              <span>{a.icon}</span>
              <span>{a.label}</span>
            </button>
          ))}
        </div>

        {/* Highlight color submenu */}
        {subMenu === 'highlight' && (
          <div className="popup-submenu fade-in">
            <p className="submenu-label">Pick a color</p>
            <div className="color-swatches">
              {Object.entries(HIGHLIGHT_COLORS).map(([key, val]) => (
                <button
                  key={key}
                  className="color-swatch"
                  style={{ background: val.bg }}
                  onClick={() => handleHighlightColor(key)}
                  title={key}
                >
                  {val.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bookmark submenu */}
        {subMenu === 'bookmark' && (
          <div className="popup-submenu fade-in">
            <p className="submenu-label">Choose your bookmark</p>
            <div className="bookmark-grid">
              {BOOKMARKS.map(bm => (
                <button
                  key={bm.id}
                  className="bookmark-choice"
                  onClick={() => handleBookmarkPick(bm)}
                  title={bm.label}
                >
                  <span className="bm-emoji">{bm.emoji}</span>
                  <span className="bm-label">{bm.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}