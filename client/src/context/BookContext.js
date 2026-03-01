import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BookContext = createContext(null);

export function BookProvider({ children }) {
  const [books, setBooks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [highlights, setHighlights] = useState([]);

  const fetchBooks = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/books');
      setBooks(data);
    } catch (err) { console.error(err); }
  }, []);

  const fetchNotes = useCallback(async (bookId) => {
    try {
      const url = bookId ? `/api/notes?bookId=${bookId}` : '/api/notes';
      const { data } = await axios.get(url);
      setNotes(data);
    } catch (err) { console.error(err); }
  }, []);

  const fetchHighlights = useCallback(async (bookId) => {
    try {
      const url = bookId ? `/api/highlights?bookId=${bookId}` : '/api/highlights';
      const { data } = await axios.get(url);
      setHighlights(data);
    } catch (err) { console.error(err); }
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

  const addHighlight = async (highlightData) => {
    const { data } = await axios.post('/api/highlights', highlightData);
    setHighlights(prev => [...prev, data.highlight]);
    return data.highlight;
  };

  const deleteHighlight = async (highlightId) => {
    await axios.delete(`/api/highlights/${highlightId}`);
    setHighlights(prev => prev.filter(h => h.id !== highlightId));
  };

  const saveProgress = async (bookId, page) => {
    try {
      await axios.patch(`/api/books/${bookId}/page`, { page });
    } catch (err) { console.error(err); }
  };

  const sendChat = async ({ bookId, messages, selectedText, currentPage, mode }) => {
    const { data } = await axios.post('/api/chat', { bookId, messages, selectedText, currentPage, mode });
    return data.reply;
  };

  useEffect(() => {
    fetchBooks();
    fetchNotes();
    fetchHighlights();
  }, [fetchBooks, fetchNotes, fetchHighlights]);

  return (
    <BookContext.Provider value={{
      books, notes, highlights,
      fetchBooks, fetchNotes, fetchHighlights,
      uploadBook, deleteBook,
      addNote, updateNote, deleteNote,
      addHighlight, deleteHighlight,
      saveProgress, sendChat
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