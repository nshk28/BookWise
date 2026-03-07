require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const booksRouter      = require('./routes/books');
const chatRouter       = require('./routes/chat');
const notesRouter      = require('./routes/notes');
const highlightsRouter = require('./routes/highlights');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure upload and data directories exist
const uploadsDir = path.join(__dirname, 'uploads');
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Init data files if they don't exist
const booksFile      = path.join(dataDir, 'books.json');
const notesFile      = path.join(dataDir, 'notes.json');
const highlightsFile = path.join(dataDir, 'highlights.json');
if (!fs.existsSync(booksFile))      fs.writeFileSync(booksFile,      JSON.stringify([]));
if (!fs.existsSync(notesFile))      fs.writeFileSync(notesFile,      JSON.stringify([]));
if (!fs.existsSync(highlightsFile)) fs.writeFileSync(highlightsFile, JSON.stringify([]));

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(uploadsDir));

app.use('/api/books',      booksRouter);
app.use('/api/chat',       chatRouter);
app.use('/api/notes',      notesRouter);
app.use('/api/highlights', highlightsRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'BookWise API running' }));

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`📚 BookWise server running on http://localhost:${PORT}`);
});