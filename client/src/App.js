import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { BookProvider } from './context/BookContext';
import Library from './pages/Library';
import Reader from './pages/Reader';
import Notes from './pages/Notes';
import Layout from './components/Layout';

export default function App() {
  return (
    <BrowserRouter>
      <BookProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Library />} />
            <Route path="read/:bookId" element={<Reader />} />
            <Route path="notes" element={<Notes />} />
            <Route path="notes/:bookId" element={<Notes />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        </Routes>
      </BookProvider>
    </BrowserRouter>
  );
}
