import React, { useEffect, useRef, useState, useCallback } from 'react';
import './PDFViewer.css';

let pdfjsLib = null;

async function loadPdfJs() {
  if (pdfjsLib) return pdfjsLib;
  pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  return pdfjsLib;
}

const HIGHLIGHT_COLORS = {
  yellow: 'rgba(255, 220, 50, 0.55)',
  green:  'rgba(80, 200, 100, 0.5)',
  pink:   'rgba(255, 100, 150, 0.5)',
  blue:   'rgba(80, 160, 255, 0.5)',
  orange: 'rgba(255, 160, 50, 0.55)',
};

function buildTextLayer(textContent, viewport, container, pageHighlights,onHighlight) {
  container.innerHTML = '';
  container.style.width = `${viewport.width}px`;
  container.style.height = `${viewport.height}px`;

  textContent.items.forEach((item) => {
    if (!item.str) return;
    const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
    const fontHeight = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]);
    const divWidth = item.width * viewport.scale;

    const span = document.createElement('span');
    span.textContent = item.str;
    span.style.position = 'absolute';
    span.style.left = `${tx[4]}px`;
    span.style.top = `${tx[5] - fontHeight}px`;
    span.style.fontSize = `${fontHeight}px`;
    span.style.width = `${divWidth}px`;
    span.style.fontFamily = item.fontName || 'sans-serif';
    span.style.whiteSpace = 'pre';
    span.style.cursor = 'text';
    span.style.userSelect = 'text';
    span.style.webkitUserSelect = 'text';
    span.style.transformOrigin = '0% 0%';

    // Check if this span's text is part of any saved highlight
    const matchedHighlight = pageHighlights.find(h =>
      h.text && h.text.includes(item.str.trim()) && item.str.trim().length > 2
    );

    if (matchedHighlight) {
  span.style.color = 'transparent';
  span.style.backgroundColor = HIGHLIGHT_COLORS[matchedHighlight.color] || HIGHLIGHT_COLORS.yellow;
  span.style.borderRadius = '2px';
  span.style.cursor = 'pointer';
  span.dataset.highlightId = matchedHighlight.id;
  span.title = 'Click to remove highlight';

  span.addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.confirm('Remove this highlight?')) {
      onHighlight({ type: 'delete', id: matchedHighlight.id });
    }
  });
} else {
  span.style.color = 'transparent';
}

    container.appendChild(span);
  });
}

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

export default function PDFViewer({
  bookId, currentPage, totalPages,
  onPageChange, onTextSelect,
  highlights = [], onHighlight
}) {
  const canvasRef = useRef();
  const textLayerRef = useRef();
  const wrapperRef = useRef();
  const [pdfDoc, setPdfDoc] = useState(null);
  const [rendering, setRendering] = useState(false);
  const [scale, setScale] = useState(1.4);
  const renderTaskRef = useRef(null);

  // Bookmark — persisted in localStorage
  const [bookmark, setBookmark] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`bookmark_${bookId}`)) || null; }
    catch { return null; }
  });
  const [showBookmarkPicker, setShowBookmarkPicker] = useState(false);

  // Load PDF
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const pdfjs = await loadPdfJs();
        const doc = await pdfjs.getDocument(`/api/books/${bookId}/pdf`).promise;
        if (!cancelled) setPdfDoc(doc);
      } catch (err) { console.error('Failed to load PDF:', err); }
    }
    load();
    return () => { cancelled = true; };
  }, [bookId]);

  // Render page + text layer with highlights baked in
  const renderPage = useCallback(async (pageNum) => {
    if (!pdfDoc || !canvasRef.current) return;
    if (renderTaskRef.current) {
      try { renderTaskRef.current.cancel(); } catch (e) {}
    }
    setRendering(true);
    try {
      const pdfjs = await loadPdfJs();
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderTask = page.render({ canvasContext: ctx, viewport });
      renderTaskRef.current = renderTask;
      await renderTask.promise;

      const textContent = await page.getTextContent();
      const pageHighlights = highlights.filter(h => h.page === pageNum);
      if (textLayerRef.current) {
        buildTextLayer(textContent, viewport, textLayerRef.current, pageHighlights, onHighlight);
      }

      if (wrapperRef.current) wrapperRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      if (err.name !== 'RenderingCancelledException') console.error('Render error:', err);
    } finally { setRendering(false); }
  }, [pdfDoc, scale, highlights]);

  useEffect(() => {
    if (pdfDoc) renderPage(currentPage);
  }, [pdfDoc, currentPage, renderPage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') onPageChange(currentPage + 1);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') onPageChange(currentPage - 1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentPage, onPageChange]);

  // Text selection
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const handleMouseUp = () => {
      setTimeout(() => {
        const selection = window.getSelection();
        const text = selection?.toString().trim();
        if (text && text.length > 1) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          const wrapperRect = wrapper.getBoundingClientRect();
          onTextSelect({
            text,
            position: {
              x: rect.left - wrapperRect.left + rect.width / 2,
              y: rect.top - wrapperRect.top - 10
            }
          });
        } else {
          onTextSelect(null);
        }
      }, 20);
    };
    wrapper.addEventListener('mouseup', handleMouseUp);
    return () => wrapper.removeEventListener('mouseup', handleMouseUp);
  }, [onTextSelect]);

  const saveBookmark = (bm) => {
    const newBm = { ...bm, page: currentPage };
    setBookmark(newBm);
    localStorage.setItem(`bookmark_${bookId}`, JSON.stringify(newBm));
    setShowBookmarkPicker(false);
  };

  const removeBookmark = () => {
    setBookmark(null);
    localStorage.removeItem(`bookmark_${bookId}`);
  };

  return (
    <div className="pdf-viewer">
      <div className="pdf-toolbar">
        <div className="pdf-nav">
          <button className="btn btn-ghost nav-btn" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1 || rendering}>‹</button>
          <span className="page-indicator">
            <span className="current-page">{currentPage}</span>
            <span className="page-sep"> / </span>
            <span className="total-pages">{totalPages}</span>
          </span>
          <button className="btn btn-ghost nav-btn" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages || rendering}>›</button>
        </div>

        <div className="pdf-zoom">
          <button className="btn btn-ghost zoom-btn" onClick={() => setScale(s => Math.max(0.7, s - 0.2))}>−</button>
          <span className="zoom-level">{Math.round(scale * 100)}%</span>
          <button className="btn btn-ghost zoom-btn" onClick={() => setScale(s => Math.min(2.5, s + 0.2))}>+</button>
        </div>

        {/* Bookmark in toolbar */}
        <div className="bookmark-wrap">
          {bookmark ? (
            <div className="active-bookmark">
              <button
                className="bookmark-icon-btn"
                onClick={() => onPageChange(bookmark.page)}
                title={`Jump to bookmark — page ${bookmark.page}`}
              >
                <span className="bookmark-emoji">{bookmark.emoji}</span>
                <span className="bookmark-page">p.{bookmark.page}</span>
              </button>
              <button className="remove-bookmark-btn" onClick={removeBookmark} title="Remove bookmark">×</button>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <button
                className="btn toolbar-icon-btn"
                onClick={() => setShowBookmarkPicker(p => !p)}
                title="Bookmark this page"
              >🔖 Bookmark p.{currentPage}</button>

              {showBookmarkPicker && (
                <div className="bookmark-picker">
                  <p className="picker-label">Choose your bookmark</p>
                  <div className="bookmark-grid">
                    {BOOKMARKS.map(bm => (
                      <button key={bm.id} className="bookmark-choice" onClick={() => saveBookmark(bm)}>
                        <span className="bm-emoji">{bm.emoji}</span>
                        <span className="bm-label">{bm.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="canvas-wrapper" ref={wrapperRef}>
        {rendering && <div className="render-overlay"><div className="spinner" /></div>}
        <div className="pdf-page-container">
          <canvas ref={canvasRef} className="pdf-canvas" />
          <div ref={textLayerRef} className="pdf-text-layer" />
        </div>
      </div>

      <div className="pdf-footer">
        <div className="page-jump">
          <span>Go to page</span>
          <input
            type="number" min={1} max={totalPages}
            defaultValue={currentPage} key={currentPage}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const p = parseInt(e.target.value);
                if (p >= 1 && p <= totalPages) onPageChange(p);
              }
            }}
          />
        </div>
        <div className="reading-progress">
          <div className="reading-progress-bar" style={{ width: `${(currentPage / totalPages) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}