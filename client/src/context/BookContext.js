import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BookContext = createContext(null);

export function BookProvider({ children }) {
  const [books, setBooks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchBooks = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/books');
      setBooks(data);
    } catch (err) {
      console.error('Failed to fetch books:', err);
    }
  }, []);

  const fetchNotes = useCallback(async (bookId) => {
    try {
      const url = bookId ? `/api/notes?bookId=${bookId}` : '/api/notes';
      const { data } = await axios.get(url);
      setNotes(data);
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    }
  }, []);

  const uploadBook = async (file, title, author) => {
    const formData = new FormData();
    formData.append('pdf', file);
    if (title) formData.append('title', title);
    if (author) formData.append('author', author);

    const { data } = await axios.post('/api/books/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    await fetchBooks();
    return data.book;
  };

  const deleteBook = async (bookId) => {
    await axios.delete(`/api/books/${bookId}`);
    await fetchBooks();
  };

  const addNote = async (noteData) => {
    const { data } = await axios.post('/api/notes', noteData);
    setNotes(prev => [...prev, data.note]);
    return data.note;
  };

  const updateNote = async (noteId, updates) => {
    const { data } = await axios.patch(`/api/notes/${noteId}`, updates);
    setNotes(prev => prev.map(n => n.id === noteId ? data.note : n));
  };

  const deleteNote = async (noteId) => {
    await axios.delete(`/api/notes/${noteId}`);
    setNotes(prev => prev.filter(n => n.id !== noteId));
  };

  const sendChat = async ({ bookId, messages, selectedText, currentPage, mode }) => {
    const { data } = await axios.post('/api/chat', { bookId, messages, selectedText, currentPage, mode });
    return data.reply;
  };

  useEffect(() => {
    fetchBooks();
    fetchNotes();
  }, [fetchBooks, fetchNotes]);

  return (
    <BookContext.Provider value={{
      books, notes, loading,
      fetchBooks, fetchNotes,
      uploadBook, deleteBook,
      addNote, updateNote, deleteNote,
      sendChat
    }}>
      {children}
    </BookContext.Provider>
  );
}

export function useBooks() {
  const ctx = useContext(BookContext);
  if (!ctx) throw new Error('useBooks must be used inside BookProvider');
  return ctx;
}
