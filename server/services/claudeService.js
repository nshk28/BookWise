require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const Groq = require('groq-sdk');
const path = require('path');
const fs = require('fs');

console.log('Groq Service - API Key present:', !!process.env.GROQ_API_KEY);

let client = null;
function getClient() {
  if (!client) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY environment variable is not set. Please add it in Railway Variables tab.');
    }
    client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return client;
}

const dataDir = path.join(__dirname, '../data');

function readBooks() {
  return JSON.parse(fs.readFileSync(path.join(dataDir, 'books.json'), 'utf8'));
}

function readNotes() {
  return JSON.parse(fs.readFileSync(path.join(dataDir, 'notes.json'), 'utf8'));
}

function getContextChunk(fullText, selectedText, windowSize = 3000) {
  if (!selectedText || !fullText) return fullText ? fullText.substring(0, windowSize) : '';
  const idx = fullText.indexOf(selectedText);
  if (idx === -1) return fullText.substring(0, windowSize);
  const start = Math.max(0, idx - windowSize / 2);
  const end = Math.min(fullText.length, idx + selectedText.length + windowSize / 2);
  return fullText.substring(start, end);
}

async function chat({ bookId, messages, selectedText, currentPage, mode }) {
  console.log('Chat called - bookId:', bookId, 'mode:', mode);

  const books = readBooks();
  const book = books.find(b => b.id === bookId);
  if (!book) throw new Error('Book not found');

  const bookNotes = readNotes().filter(n => n.bookId === bookId);
  const notesContext = bookNotes.length > 0
    ? `\n\nNotes taken so far:\n${bookNotes.map(n => `- [Page ${n.page || '?'}] ${n.content}`).join('\n')}`
    : '';

  const contextChunk = selectedText
    ? getContextChunk(book.fullText, selectedText)
    : book.fullText ? book.fullText.substring(0, 4000) : '';

  const systemPrompt = `You are BookWise, an intelligent and enthusiastic reading companion for "${book.title}" by ${book.author}.

The reader is currently on page ${currentPage || '?'} of ${book.totalPages}.
${selectedText ? `The reader has selected this text:\n"${selectedText}"\n` : ''}

Relevant book context:
---
${contextChunk}
---
${notesContext}

Your role:
- Explain concepts clearly when asked, using simple english language and analogies and examples when helpful
- Discuss themes, ideas, and implications thoughtfully
- Share your perspective on selected passages
- Connect ideas to other concepts or books when relevant
- Be conversational, warm, and intellectually engaging and natural tone like human would (avoid sounding like an AI)
- If mode is 'note', start your response with "NOTE:" followed by the note content

Current mode: ${mode || 'chat'}`;

  try {
    const response = await getClient().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ]
    });
    console.log('Groq API success');
    return response.choices[0].message.content;
  } catch (err) {
    console.error('Groq API Error:', err.message);
    throw err;
  }
}

module.exports = { chat };