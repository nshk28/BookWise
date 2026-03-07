const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const router = express.Router();
const FILE = path.join(__dirname, '../data/highlights.json');

if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, JSON.stringify([]));

function read() {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return [];
  }
}

function write(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

router.get('/', (req, res) => {
  const { bookId } = req.query;
  const all = read();
  res.json(bookId ? all.filter(h => h.bookId === bookId) : all);
});

router.post('/', (req, res) => {

  const {
    bookId,
    page,
    text,
    startOffset,
    endOffset,
    color
  } = req.body;

  if (!bookId || !text) {
    return res.status(400).json({ error: 'bookId and text are required' });
  }

  const highlight = {
    id: crypto.randomUUID(),
    bookId,
    page: Number(page) || 1,
    text: text || "",
    color: color || "yellow",
    createdAt: new Date().toISOString()
  };
  if (startOffset !== undefined) highlight.startOffset = Number(startOffset);
  if (endOffset !== undefined) highlight.endOffset = Number(endOffset);

  const all = read();
  all.push(highlight);
  write(all);

  res.status(201).json({ highlight });
});

router.delete('/:id', (req, res) => {
  const all = read();
  const next = all.filter(h => h.id !== req.params.id);
  write(next);
  res.json({ success: true });
});

module.exports = router;