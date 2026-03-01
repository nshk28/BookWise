import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useBooks } from '../context/BookContext';
import PDFViewer from '../components/PDFViewer';
import ChatPanel from '../components/ChatPanel';
import SelectionPopup from '../components/SelectionPopup';
import NotesDrawer from '../components/NotesDrawer';
import './Reader.css';

export default function Reader() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { books, fetchNotes } = useBooks();

  const [book, setBook] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selection, setSelection] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [showNotes, setShowNotes] = useState(false);
  const [activePanel, setActivePanel] = useState('chat'); // 'chat' | 'notes'

  useEffect(() => {
    const b = books.find(b => b.id === bookId);
    if (b) {
      setBook(b);
      setCurrentPage(b.currentPage || 1);
      fetchNotes(bookId);
    }
  }, [bookId, books, fetchNotes]);

  const handlePageChange = useCallback(async (page) => {
    if (!book || page < 1 || page > book.totalPages) return;
    setCurrentPage(page);
    setSelection(null);
    try {
      await axios.patch(`/api/books/${bookId}/page`, { page });
    } catch (err) {}
  }, [book, bookId]);

  const handleTextSelect = useCallback((sel) => {
    setSelection(sel);
  }, []);

  const handleSelectionAction = useCallback((mode) => {
    if (!selection) return;
    setPendingAction({ mode, text: selection.text });
    setSelection(null);
    setActivePanel('chat');
  }, [selection]);

  if (!book) {
    return (
      <div className="reader-loading">
        <div className="spinner" style={{ width: 32, height: 32 }} />
        <p>Loading book...</p>
      </div>
    );
  }

  return (
    <div className="reader">
      {/* Top bar */}
      <div className="reader-topbar">
        <button className="btn btn-ghost back-btn" onClick={() => navigate('/')}>
          ← Library
        </button>
        <div className="book-info-bar">
          <span className="book-title-bar">{book.title}</span>
          <span className="book-author-bar">by {book.author}</span>
        </div>
        <div className="topbar-actions">
          <button
            className={`btn topbar-tab ${activePanel === 'chat' ? 'active' : 'btn-ghost'}`}
            onClick={() => setActivePanel('chat')}
          >
            💬 Chat
          </button>
          <button
            className={`btn topbar-tab ${activePanel === 'notes' ? 'active' : 'btn-ghost'}`}
            onClick={() => setActivePanel('notes')}
          >
            📝 Notes
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="reader-body">
        {/* PDF area */}
        <div className="reader-pdf-area" style={{ position: 'relative' }}>
          <PDFViewer
            bookId={bookId}
            currentPage={currentPage}
            totalPages={book.totalPages}
            onPageChange={handlePageChange}
            onTextSelect={handleTextSelect}
          />

          {/* Selection popup rendered inside pdf area */}
          {selection && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
              <div style={{ pointerEvents: 'all' }}>
                <SelectionPopup
                  selection={selection}
                  onAction={handleSelectionAction}
                  onClose={() => setSelection(null)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="reader-side-panel">
          {activePanel === 'chat' && (
            <ChatPanel
              book={book}
              currentPage={currentPage}
              pendingAction={pendingAction}
              onClearPending={() => setPendingAction(null)}
              onNoteCreated={() => fetchNotes(bookId)}
            />
          )}
          {activePanel === 'notes' && (
            <NotesDrawer
              bookId={bookId}
              bookTitle={book.title}
              currentPage={currentPage}
              onJumpToPage={handlePageChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}
