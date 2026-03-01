# 📚 BookWise — Your AI Reading Companion

BookWise is a full-stack web app that lets you upload PDFs and read them alongside an AI companion powered by Claude. Select any text to get explanations, discuss ideas, or auto-generate notes.

---

## ✨ Features

- **📖 PDF Reader** — Upload any PDF and read it in the browser with zoom and page navigation
- **🖱️ Text Selection** — Select any word, sentence, or paragraph to get instant actions
- **💡 Explain** — Get clear explanations of confusing passages
- **💬 Discuss** — Talk through ideas and themes with the AI
- **📝 Add Note** — Generate AI-powered notes from selected text
- **🗂️ Notes Library** — All notes organized by book, with search and editing
- **🔄 Progress Tracking** — Your page position is saved automatically

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- An Anthropic API key ([get one here](https://console.anthropic.com))

### 1. Clone / Open the project in VS Code

Open the `bookwise` folder in VS Code.

### 2. Set up the server

```bash
cd server
cp .env.example .env
```

Edit `.env` and add your Anthropic API key:
```
ANTHROPIC_API_KEY=sk-ant-...your-key-here...
PORT=5000
```

### 3. Install dependencies

From the root `bookwise` folder:
```bash
# Install root deps
npm install

# Install server deps
cd server && npm install && cd ..

# Install client deps
cd client && npm install && cd ..
```

Or all at once:
```bash
npm run install:all
```

### 4. Run the app

**Option A: Run both together (recommended)**
```bash
# From the root bookwise folder
npm run dev
```

**Option B: Run separately**
```bash
# Terminal 1 - Server
cd server && npm run dev

# Terminal 2 - Client
cd client && npm start
```

### 5. Open the app

Navigate to **http://localhost:3000** in your browser.

---

## 📁 Project Structure

```
bookwise/
├── client/                  # React frontend
│   └── src/
│       ├── components/
│       │   ├── Layout.jsx         # App layout with navigation
│       │   ├── PDFViewer.jsx      # PDF rendering with pdfjs
│       │   ├── SelectionPopup.jsx # Popup when text is selected
│       │   ├── ChatPanel.jsx      # AI chat interface
│       │   └── NotesDrawer.jsx    # Notes panel in reader
│       ├── pages/
│       │   ├── Library.jsx        # Book library & upload
│       │   ├── Reader.jsx         # Main reading experience
│       │   └── Notes.jsx          # Full notes management
│       └── context/
│           └── BookContext.js     # Global state management
│
└── server/                  # Node.js backend
    ├── routes/
    │   ├── books.js          # Book upload & management
    │   ├── chat.js           # AI chat endpoint
    │   └── notes.js          # Notes CRUD
    ├── services/
    │   └── claudeService.js  # Anthropic Claude integration
    ├── data/                 # JSON data storage (auto-created)
    ├── uploads/              # PDF files (auto-created)
    └── index.js              # Express server
```

---

## 🎯 How to Use

1. **Upload a Book** — Drag & drop a PDF on the Library page, or click "Add Book"
2. **Start Reading** — Click "Continue Reading" on any book
3. **Select Text** — Highlight any text in the PDF to see the action popup
4. **Choose an Action:**
   - **Explain** — Get a clear explanation of the selected text
   - **Discuss** — Have a deeper conversation about the ideas
   - **Add Note** — AI generates a structured note from the selection
   - **Summarize** — Summarize your reading progress
5. **Save Notes** — Manual notes via the Notes panel, or auto-saved AI notes
6. **Browse Notes** — Go to "My Notes" in the sidebar to see all notes by book

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router 6 |
| PDF Rendering | pdf.js (pdfjs-dist) |
| Backend | Node.js, Express |
| PDF Parsing | pdf-parse |
| AI | Anthropic Claude API |
| Storage | JSON files (easily swap for PostgreSQL) |
| Styling | Custom CSS with CSS variables |

---

## 🔧 Upgrading Storage to PostgreSQL

The JSON file storage is great for getting started. To upgrade to PostgreSQL:

1. Install `pg`: `npm install pg --prefix server`
2. Replace the `readBooks()`/`writeBooks()` helpers in `routes/books.js` with SQL queries
3. Same for `routes/notes.js`
4. Add `DATABASE_URL` to your `.env`

---

## 💡 Tips

- For large PDFs, the initial upload may take a moment while text is extracted
- The AI has context of your full book + all notes taken so far
- Use Ctrl+Enter (or Cmd+Enter) in the note input to save quickly
- Click page numbers on notes to jump back to that page

---

## 📄 License

MIT — feel free to extend and customize!
