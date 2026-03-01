import React, { useState, useRef, useEffect } from 'react';
import { useBooks } from '../context/BookContext';
import './ChatPanel.css';

function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`message ${isUser ? 'user' : 'assistant'} fade-in`}>
      {!isUser && <div className="msg-avatar">📚</div>}
      <div className="msg-bubble">
        {msg.excerpt && (
          <div className="msg-excerpt">
            <span className="excerpt-label">Re: </span>
            "{msg.excerpt.length > 80 ? msg.excerpt.substring(0, 80) + '…' : msg.excerpt}"
          </div>
        )}
        <div className="msg-text">{msg.content}</div>
        {msg.isNote && (
          <div className="msg-saved-badge">✓ Saved to notes</div>
        )}
      </div>
      {isUser && <div className="msg-avatar user-avatar">👤</div>}
    </div>
  );
}

export default function ChatPanel({ book, currentPage, pendingAction, onNoteCreated, onClearPending }) {
  const { sendChat, addNote } = useBooks();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();
  const inputRef = useRef();

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Handle pending action from selection popup
  useEffect(() => {
    if (!pendingAction) return;
    const { mode, text } = pendingAction;

    const promptMap = {
      explain: `Explain this to me: "${text}"`,
      discuss: `Let's discuss this passage: "${text}"`,
      note: `Create a note for this: "${text}"`,
      summarize: `Summarize what we've covered so far on page ${currentPage}`,
    };

    handleSend(promptMap[mode] || text, text, mode);
    onClearPending();
    // eslint-disable-next-line
  }, [pendingAction]);

  const handleSend = async (messageText, excerpt, mode) => {
    const text = messageText || input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text, excerpt: excerpt || null };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // Build messages array for API (just role + content)
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));

      const reply = await sendChat({
        bookId: book.id,
        messages: apiMessages,
        selectedText: excerpt,
        currentPage,
        mode: mode || 'chat'
      });

      // Check if it's a note response
      const isNote = reply.startsWith('NOTE:');
      const noteContent = isNote ? reply.replace(/^NOTE:\s*/i, '').trim() : null;

      const assistantMsg = {
        role: 'assistant',
        content: reply,
        isNote: false
      };
      setMessages(prev => [...prev, assistantMsg]);

      // Auto-save if it was a note request
      if (isNote && noteContent) {
        await addNote({
          bookId: book.id,
          bookTitle: book.title,
          content: noteContent,
          excerpt: excerpt || null,
          page: currentPage,
          type: 'ai-generated'
        });
        setMessages(prev => {
          const last = [...prev];
          last[last.length - 1] = { ...last[last.length - 1], isNote: true };
          return last;
        });
        onNoteCreated?.();
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Something went wrong. Please check your API key and try again.'
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className="chat-header-left">
          <span className="chat-icon">🤖</span>
          <div>
            <div className="chat-title">BookWise AI</div>
            <div className="chat-subtitle">Your reading companion</div>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            className="btn btn-ghost clear-btn"
            onClick={() => setMessages([])}
          >Clear</button>
        )}
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <div className="chat-empty-icon">💬</div>
            <p>Select any text in the PDF to get started, or ask me anything about the book!</p>
            <div className="chat-suggestions">
              <button className="suggestion" onClick={() => handleSend(`Give me a brief overview of what this book "${book.title}" is about`)}>
                What's this book about?
              </button>
              <button className="suggestion" onClick={() => handleSend(`What are the key themes in "${book.title}"?`)}>
                Key themes?
              </button>
              <button className="suggestion" onClick={() => handleSend(`I'm on page ${currentPage}. What should I pay attention to?`)}>
                What to look for here?
              </button>
            </div>
          </div>
        )}

        {messages.map((msg, i) => <Message key={i} msg={msg} />)}

        {loading && (
          <div className="message assistant fade-in">
            <div className="msg-avatar">📚</div>
            <div className="msg-bubble typing">
              <span /><span /><span />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="chat-input-area">
        <textarea
          ref={inputRef}
          className="chat-input"
          placeholder="Ask anything about what you're reading..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          rows={1}
        />
        <button
          className="btn btn-primary send-btn"
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
        >
          {loading ? <span className="spinner" /> : '↑'}
        </button>
      </div>
    </div>
  );
}
