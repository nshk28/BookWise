import React, { useState } from 'react';
import { useBooks } from '../context/BookContext';
import './NotesDrawer.css';

export default function NotesDrawer({ bookId, bookTitle, currentPage, onJumpToPage }) {
  const { notes, addNote, deleteNote, updateNote } = useBooks();
  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  const bookNotes = notes
    .filter(n => n.bookId === bookId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const handleAdd = async () => {
    if (!newNote.trim()) return;
    setSaving(true);
    try {
      await addNote({
        bookId,
        bookTitle,
        content: newNote.trim(),
        page: currentPage,
        type: 'manual'
      });
      setNewNote('');
    } catch (err) {
      alert('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

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
    <div className="notes-drawer">
      <div className="notes-drawer-header">
        <span className="notes-title">📝 Notes</span>
        <span className="notes-count">{bookNotes.length} note{bookNotes.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Add note */}
      <div className="add-note-area">
        <textarea
          className="note-input"
          placeholder={`Add a note for page ${currentPage}...`}
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          rows={3}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAdd();
          }}
        />
        <button
          className="btn btn-primary add-note-btn"
          onClick={handleAdd}
          disabled={!newNote.trim() || saving}
        >
          {saving ? <span className="spinner" /> : 'Save Note'}
        </button>
      </div>

      {/* Notes list */}
      <div className="notes-list">
        {bookNotes.length === 0 ? (
          <div className="notes-empty">
            <p>No notes yet. Select text and click "Add Note", or write one above.</p>
          </div>
        ) : (
          bookNotes.map(note => (
            <div key={note.id} className="note-card fade-in">
              <div className="note-card-header">
                <div className="note-meta">
                  {note.page && (
                    <button
                      className="page-tag"
                      onClick={() => onJumpToPage(note.page)}
                    >p.{note.page}</button>
                  )}
                  <span className={`type-tag ${note.type}`}>
                    {note.type === 'ai-generated' ? '🤖 AI' : '✍️ Manual'}
                  </span>
                </div>
                <div className="note-actions">
                  <button
                    className="note-action-btn"
                    onClick={() => { setEditingId(note.id); setEditContent(note.content); }}
                    title="Edit"
                  >✏️</button>
                  <button
                    className="note-action-btn danger"
                    onClick={() => handleDelete(note.id)}
                    title="Delete"
                  >🗑</button>
                </div>
              </div>

              {note.excerpt && (
                <div className="note-excerpt">"{note.excerpt.substring(0, 100)}{note.excerpt.length > 100 ? '…' : ''}"</div>
              )}

              {editingId === note.id ? (
                <div className="note-edit">
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    rows={4}
                    autoFocus
                  />
                  <div className="note-edit-actions">
                    <button className="btn btn-ghost" onClick={() => setEditingId(null)}>Cancel</button>
                    <button className="btn btn-primary" onClick={() => handleEdit(note.id)}>Save</button>
                  </div>
                </div>
              ) : (
                <p className="note-content">{note.content}</p>
              )}

              <div className="note-date">
                {new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
