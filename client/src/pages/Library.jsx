import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooks } from '../context/BookContext';
import './Library.css';

export default function Library() {
  const { books, uploadBook, deleteBook } = useBooks();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [titleInput, setTitleInput] = useState('');
  const [authorInput, setAuthorInput] = useState('');
  const fileRef = useRef();
  const navigate = useNavigate();

  const handleFileSelect = (file) => {
    if (!file || file.type !== 'application/pdf') return;
    setSelectedFile(file);
    setTitleInput(file.name.replace('.pdf', ''));
    setShowModal(true);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const book = await uploadBook(selectedFile, titleInput, authorInput);
      setShowModal(false);
      setSelectedFile(null);
      navigate(`/read/${book.id}`);
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (e, bookId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this book and all its notes?')) return;
    try {
      await deleteBook(bookId);
    } catch (err) {
      alert('Delete failed');
    }
  };

  return (
    <div className="library">
      <div className="library-header">
        <div>
          <h1 className="library-title">My Library</h1>
          <p className="library-subtitle">{books.length} book{books.length !== 1 ? 's' : ''} in your collection</p>
        </div>
        <button className="btn btn-primary" onClick={() => fileRef.current.click()}>
          + Add Book
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          style={{ display: 'none' }}
          onChange={e => handleFileSelect(e.target.files[0])}
        />
      </div>

      {books.length === 0 ? (
        <div
          className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files[0]); }}
          onClick={() => fileRef.current.click()}
        >
          <div className="upload-zone-icon">📖</div>
          <h3>Drop a PDF here to start reading</h3>
          <p>or click to browse your files</p>
          <span className="btn btn-ghost" style={{ marginTop: 16 }}>Choose PDF</span>
        </div>
      ) : (
        <>
          <div
            className={`upload-zone-compact ${dragOver ? 'drag-over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files[0]); }}
          >
            <span>📎</span> Drop a PDF here to add to library
          </div>

          <div className="books-grid">
            {books.map((book, i) => (
              <div
                key={book.id}
                className="book-card fade-in"
                style={{ animationDelay: `${i * 0.05}s` }}
                onClick={() => navigate(`/read/${book.id}`)}
              >
                <div className="book-spine" style={{ background: spinePalette[i % spinePalette.length] }}>
                  <span className="book-spine-title">{book.title}</span>
                </div>
                <div className="book-info">
                  <h3 className="book-title">{book.title}</h3>
                  <p className="book-author">{book.author}</p>
                  <div className="book-meta">
                    <span>{book.totalPages} pages</span>
                    <span>Page {book.currentPage}</span>
                  </div>
                  <div className="book-progress">
                    <div
                      className="book-progress-bar"
                      style={{ width: `${(book.currentPage / book.totalPages) * 100}%` }}
                    />
                  </div>
                  <div className="book-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => navigate(`/read/${book.id}`)}>
                      Continue Reading
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={e => handleDelete(e, book.id)}>
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Add Book Details</h2>
            <p className="modal-file">{selectedFile?.name}</p>

            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={titleInput}
                onChange={e => setTitleInput(e.target.value)}
                placeholder="Book title"
              />
            </div>
            <div className="form-group">
              <label>Author</label>
              <input
                type="text"
                value={authorInput}
                onChange={e => setAuthorInput(e.target.value)}
                placeholder="Author name (optional)"
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpload} disabled={uploading}>
                {uploading ? <><span className="spinner" /> Uploading...</> : 'Upload & Start Reading'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const spinePalette = [
  'linear-gradient(135deg, #8B4513, #A0522D)',
  'linear-gradient(135deg, #2F4F4F, #3D6B6B)',
  'linear-gradient(135deg, #722F37, #9B3A3A)',
  'linear-gradient(135deg, #1a3a5c, #2a5a8c)',
  'linear-gradient(135deg, #4a4a2a, #6a6a3a)',
  'linear-gradient(135deg, #4a2a4a, #7a3a7a)',
];
