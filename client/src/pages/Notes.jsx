import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useBooks } from '../context/BookContext';
import './Notes.css';

export default function Notes() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { books, notes, fetchNotes, deleteNote, updateNote } = useBooks();

  const [selectedBook, setSelectedBook] = useState(bookId || null);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  useEffect(() => {
    if (bookId) setSelectedBook(bookId);
  }, [bookId]);

  // Group notes by book
  const notesByBook = notes.reduce((acc, note) => {
    if (!acc[note.bookId]) acc[note.bookId] = { bookTitle: note.bookTitle, notes: [] };
    acc[note.bookId].notes.push(note);
    return acc;
  }, {});

  const filteredNotes = (() => {
    let n = selectedBook ? (notesByBook[selectedBook]?.notes || []) : notes;
    if (search) n = n.filter(note =>
      note.content.toLowerCase().includes(search.toLowerCase()) ||
      (note.excerpt || '').toLowerCase().includes(search.toLowerCase())
    );
    return n.sort((a, b) => (a.page || 0) - (b.page || 0));
  })();

  const handleEdit = async (noteId) => {
    if (!editContent.trim()) return;
    await updateNote(noteId, { content: editContent.trim() });
    setEditingId(null);
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm('Delete this note?')) return;
    await deleteNote(noteId);
  };

  return (
    <div className="notes-page">
      {/* Sidebar with book folders */}
      <div className="notes-sidebar">
        <div className="notes-sidebar-header">
          <h2>📚 Book Folders</h2>
        </div>
        <div className="book-folders">
          <button
            className={`folder-btn ${!selectedBook ? 'active' : ''}`}
            onClick={() => { setSelectedBook(null); navigate('/notes'); }}
          >
            <span className="folder-icon">📂</span>
            <span className="folder-name">All Notes</span>
            <span className="folder-count">{notes.length}</span>
          </button>

          {Object.entries(notesByBook).map(([bId, { bookTitle, notes: bNotes }]) => (
            <button
              key={bId}
              className={`folder-btn ${selectedBook === bId ? 'active' : ''}`}
              onClick={() => { setSelectedBook(bId); navigate(`/notes/${bId}`); }}
            >
              <span className="folder-icon">📖</span>
              <span className="folder-name">{bookTitle}</span>
              <span className="folder-count">{bNotes.length}</span>
            </button>
          ))}

          {Object.keys(notesByBook).length === 0 && (
            <p className="no-folders">No notes yet. Start reading to add notes!</p>
          )}
        </div>
      </div>

      {/* Main notes area */}
      <div className="notes-main">
        <div className="notes-main-header">
          <div>
            <h1 className="notes-page-title">
              {selectedBook ? notesByBook[selectedBook]?.bookTitle || 'Notes' : 'All Notes'}
            </h1>
            <p className="notes-page-subtitle">{filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''}</p>
          </div>

          <div className="notes-header-actions">
            {selectedBook && (
              <button
                className="btn btn-primary"
                onClick={() => navigate(`/read/${selectedBook}`)}
              >
                Continue Reading →
              </button>
            )}
            <input
              type="text"
              className="search-input"
              placeholder="Search notes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {filteredNotes.length === 0 ? (
          <div className="notes-empty-state">
            <div style={{ fontSize: 64, marginBottom: 16 }}>📝</div>
            <h3>No notes here yet</h3>
            <p>Select text while reading and click "Add Note", or type notes in the reader panel.</p>
            {books.length > 0 && (
              <Link to={`/read/${books[0].id}`} className="btn btn-primary" style={{ marginTop: 20 }}>
                Start Reading
              </Link>
            )}
          </div>
        ) : (
          <div className="notes-grid">
            {filteredNotes.map((note, i) => (
              <div key={note.id} className="note-full-card fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
                <div className="note-full-header">
                  <div className="note-full-meta">
                    {!selectedBook && (
                      <span className="book-badge">{note.bookTitle}</span>
                    )}
                    {note.page && (
                      <Link to={`/read/${note.bookId}`} className="page-badge">
                        Page {note.page}
                      </Link>
                    )}
                    <span className={`type-badge ${note.type}`}>
                      {note.type === 'ai-generated' ? '🤖 AI Generated' : '✍️ Manual'}
                    </span>
                  </div>
                  <div className="note-full-actions">
                    <button
                      onClick={() => { setEditingId(note.id); setEditContent(note.content); }}
                      className="icon-btn" title="Edit"
                    >✏️</button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="icon-btn danger" title="Delete"
                    >🗑</button>
                  </div>
                </div>

                {note.excerpt && (
                  <blockquote className="note-full-excerpt">
                    {note.excerpt}
                  </blockquote>
                )}

                {editingId === note.id ? (
                  <div className="inline-edit">
                    <textarea
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      rows={4}
                      autoFocus
                    />
                    <div className="inline-edit-actions">
                      <button className="btn btn-ghost" onClick={() => setEditingId(null)}>Cancel</button>
                      <button className="btn btn-primary" onClick={() => handleEdit(note.id)}>Save</button>
                    </div>
                  </div>
                ) : (
                  <p className="note-full-content">{note.content}</p>
                )}

                <div className="note-full-date">
                  {new Date(note.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
