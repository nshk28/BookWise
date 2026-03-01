const express = require('express');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const dataDir = path.join(__dirname, '../data');
const highlightsFile = path.join(dataDir, 'highlights.json');

if (!fs.existsSync(highlightsFile)) fs.writeFileSync(highlightsFile, JSON.stringify([]));

function readHighlights() {
  return JSON.parse(fs.readFileSync(highlightsFile, 'utf8'));
}
function writeHighlights(data) {
  fs.writeFileSync(highlightsFile, JSON.stringify(data, null, 2));
}

// GET highlights for a book+page
router.get('/', (req, res) => {
  try {
    let h = readHighlights();
    if (req.query.bookId) h = h.filter(x => x.bookId === req.query.bookId);
    if (req.query.page) h = h.filter(x => x.page === parseInt(req.query.page));
    res.json(h);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST save a highlight
router.post('/', (req, res) => {
  try {
    const { bookId, page, text, color } = req.body;
    if (!bookId || !text) return res.status(400).json({ error: 'bookId and text required' });
    const highlight = {
      id: uuidv4(),
      bookId, page: page || 1,
      text, color: color || 'yellow',
      createdAt: new Date().toISOString()
    };
    const all = readHighlights();
    all.push(highlight);
    writeHighlights(all);
    res.json({ success: true, highlight });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE a highlight
router.delete('/:id', (req, res) => {
  try {
    const all = readHighlights();
    writeHighlights(all.filter(h => h.id !== req.params.id));
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;