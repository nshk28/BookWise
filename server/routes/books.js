const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const dataDir = path.join(__dirname, '../data');
const uploadsDir = path.join(__dirname, '../uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${uuidv4()}-${file.originalname}`)
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files allowed'), false);
  },
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

function readBooks() {
  return JSON.parse(fs.readFileSync(path.join(dataDir, 'books.json'), 'utf8'));
}

function writeBooks(books) {
  fs.writeFileSync(path.join(dataDir, 'books.json'), JSON.stringify(books, null, 2));
}

// GET all books
router.get('/', (req, res) => {
  try {
    const books = readBooks();
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST upload a new book
router.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const dataBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(dataBuffer);

    const book = {
      id: uuidv4(),
      title: req.body.title || req.file.originalname.replace('.pdf', ''),
      author: req.body.author || 'Unknown',
      filename: req.file.filename,
      originalName: req.file.originalname,
      totalPages: pdfData.numpages,
      uploadedAt: new Date().toISOString(),
      currentPage: 1,
      // Store full text for Claude context (chunked by pages approximation)
      fullText: pdfData.text,
      textLength: pdfData.text.length
    };

    const books = readBooks();
    books.push(book);
    writeBooks(books);

    // Don't send fullText back in response (too large)
    const { fullText, ...bookMeta } = book;
    res.json({ success: true, book: bookMeta });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET single book
router.get('/:id', (req, res) => {
  try {
    const books = readBooks();
    const book = books.find(b => b.id === req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    const { fullText, ...bookMeta } = book;
    res.json(bookMeta);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET book PDF file
router.get('/:id/pdf', (req, res) => {
  try {
    const books = readBooks();
    const book = books.find(b => b.id === req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    const filePath = path.join(uploadsDir, book.filename);
    res.sendFile(filePath);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update current page
router.patch('/:id/page', (req, res) => {
  try {
    const books = readBooks();
    const idx = books.findIndex(b => b.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Book not found' });
    books[idx].currentPage = req.body.page;
    writeBooks(books);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a book
router.delete('/:id', (req, res) => {
  try {
    const books = readBooks();
    const book = books.find(b => b.id === req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });

    // Delete file
    const filePath = path.join(uploadsDir, book.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    const updated = books.filter(b => b.id !== req.params.id);
    writeBooks(updated);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
