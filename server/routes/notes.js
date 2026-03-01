const express = require('express');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const dataDir = path.join(__dirname, '../data');

function readNotes() {
  return JSON.parse(fs.readFileSync(path.join(dataDir, 'notes.json'), 'utf8'));
}

function writeNotes(notes) {
  fs.writeFileSync(path.join(dataDir, 'notes.json'), JSON.stringify(notes, null, 2));
}

// GET all notes (optionally filtered by bookId)
router.get('/', (req, res) => {
  try {
    let notes = readNotes();
    if (req.query.bookId) notes = notes.filter(n => n.bookId === req.query.bookId);
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create a note
router.post('/', (req, res) => {
  try {
    const { bookId, bookTitle, content, excerpt, page, type, chapterTag } = req.body;
    if (!bookId || !content) return res.status(400).json({ error: 'bookId and content required' });

    const note = {
      id: uuidv4(),
      bookId,
      bookTitle: bookTitle || 'Unknown Book',
      content,
      excerpt: excerpt || null,      // the selected text that triggered this note
      page: page || null,
      type: type || 'manual',        // 'manual' | 'ai-generated' | 'highlight'
      chapterTag: chapterTag || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const notes = readNotes();
    notes.push(note);
    writeNotes(notes);
    res.json({ success: true, note });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update a note
router.patch('/:id', (req, res) => {
  try {
    const notes = readNotes();
    const idx = notes.findIndex(n => n.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Note not found' });

    notes[idx] = { ...notes[idx], ...req.body, updatedAt: new Date().toISOString() };
    writeNotes(notes);
    res.json({ success: true, note: notes[idx] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a note
router.delete('/:id', (req, res) => {
  try {
    const notes = readNotes();
    const updated = notes.filter(n => n.id !== req.params.id);
    writeNotes(updated);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE all notes for a book
router.delete('/book/:bookId', (req, res) => {
  try {
    const notes = readNotes();
    const updated = notes.filter(n => n.bookId !== req.params.bookId);
    writeNotes(updated);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
