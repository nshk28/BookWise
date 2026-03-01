import React, { useEffect, useRef, useState, useCallback } from 'react';
import './PDFViewer.css';

let pdfjsLib = null;

async function loadPdfJs() {
  if (pdfjsLib) return pdfjsLib;
  pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  return pdfjsLib;
}

function buildTextLayer(textContent, viewport, container) {
  container.innerHTML = '';
  container.style.width = `${viewport.width}px`;
  container.style.height = `${viewport.height}px`;

  textContent.items.forEach((item) => {
    if (!item.str) return;

    const tx = pdfjsLib.Util.transform(
      viewport.transform,
      item.transform
    );

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
    span.style.color = 'transparent';
    span.style.whiteSpace = 'pre';
    span.style.cursor = 'text';
    span.style.transformOrigin = '0% 0%';
    span.style.userSelect = 'text';
    span.style.webkitUserSelect = 'text';

    // Scale text to match actual rendered width
    if (item.width > 0 && divWidth > 0) {
      const scaleX = divWidth / (span.textContent.length * fontHeight * 0.5 + 0.01);
      // Only apply scale if significantly off
    }

    container.appendChild(span);
  });
}

export default function PDFViewer({ bookId, currentPage, totalPages, onPageChange, onTextSelect }) {
  const canvasRef = useRef();
  const textLayerRef = useRef();
  const wrapperRef = useRef();
  const [pdfDoc, setPdfDoc] = useState(null);
  const [rendering, setRendering] = useState(false);
  const [scale, setScale] = useState(1.4);
  const renderTaskRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const pdfjs = await loadPdfJs();
        const doc = await pdfjs.getDocument(`/api/books/${bookId}/pdf`).promise;
        if (!cancelled) setPdfDoc(doc);
      } catch (err) {
        console.error('Failed to load PDF:', err);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [bookId]);

  const renderPage = useCallback(async (pageNum) => {
    if (!pdfDoc || !canvasRef.current) return;
    if (renderTaskRef.current) {
      try { renderTaskRef.current.cancel(); } catch (e) {}
    }
    setRendering(true);
    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      // 1. Render canvas
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      const renderTask = page.render({ canvasContext: ctx, viewport });
      renderTaskRef.current = renderTask;
      await renderTask.promise;

      // 2. Build text layer manually
      const textContent = await page.getTextContent();
      if (textLayerRef.current) {
        buildTextLayer(textContent, viewport, textLayerRef.current);
      }
    } catch (err) {
      if (err.name !== 'RenderingCancelledException') console.error('Render error:', err);
    } finally {
      setRendering(false);
    }
  }, [pdfDoc, scale]);

  useEffect(() => {
    if (pdfDoc) renderPage(currentPage);
  }, [pdfDoc, currentPage, renderPage]);

  // Selection handler
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
      </div>
    </div>
  );
}