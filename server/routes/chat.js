const express = require('express');
const { chat } = require('../services/claudeService');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { bookId, messages, selectedText, currentPage, mode } = req.body;
    if (!bookId || !messages) return res.status(400).json({ error: 'bookId and messages required' });

    const reply = await chat({ bookId, messages, selectedText, currentPage, mode });
    res.json({ reply });
  } catch (err) {
    console.error('CHAT ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;