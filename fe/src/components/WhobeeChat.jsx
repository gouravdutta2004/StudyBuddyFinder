import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';

/* ─── Whobee mascot SVG icon ──────────────────────────────────────────────── */
function WhobeeIcon({ size = 24, glow = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none"
      style={glow ? { filter: 'drop-shadow(0 0 8px rgba(129,140,248,0.8))' } : {}}>
      {/* Body */}
      <rect x="10" y="18" width="28" height="22" rx="8" fill="url(#wbGrad)" />
      {/* Head */}
      <rect x="13" y="6" width="22" height="16" rx="7" fill="url(#wbGrad)" />
      {/* Eyes */}
      <circle cx="19" cy="14" r="3.5" fill="white" />
      <circle cx="29" cy="14" r="3.5" fill="white" />
      <circle cx="20" cy="14.5" r="1.8" fill="#1e1b4b" />
      <circle cx="30" cy="14.5" r="1.8" fill="#1e1b4b" />
      {/* Shine */}
      <circle cx="21" cy="13.5" r="0.7" fill="white" opacity="0.8" />
      <circle cx="31" cy="13.5" r="0.7" fill="white" opacity="0.8" />
      {/* Antenna */}
      <rect x="22.5" y="2" width="3" height="6" rx="1.5" fill="#818cf8" />
      <circle cx="24" cy="2" r="2" fill="#a78bfa" />
      {/* Mouth / speaker grill */}
      <rect x="18" y="26" width="12" height="2" rx="1" fill="rgba(255,255,255,0.2)" />
      <rect x="18" y="30" width="8" height="2" rx="1" fill="rgba(255,255,255,0.15)" />
      {/* Arms */}
      <rect x="3" y="22" width="8" height="4" rx="2" fill="url(#wbGrad)" />
      <rect x="37" y="22" width="8" height="4" rx="2" fill="url(#wbGrad)" />
      <defs>
        <linearGradient id="wbGrad" x1="10" y1="6" x2="38" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ─── Typing indicator dots ───────────────────────────────────────────────── */
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '10px 14px' }}>
      {[0, 1, 2].map(i => (
        <motion.div key={i}
          animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }}
          style={{ width: 6, height: 6, borderRadius: '50%', background: '#818cf8' }}
        />
      ))}
    </div>
  );
}

/* ─── Single chat bubble ──────────────────────────────────────────────────── */
function ChatBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        gap: 8,
        alignItems: 'flex-end',
        marginBottom: 4,
      }}
    >
      {!isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginBottom: 2,
          background: 'linear-gradient(135deg,#818cf8,#6d28d9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <WhobeeIcon size={16} />
        </div>
      )}
      <div style={{
        maxWidth: '82%',
        padding: isUser ? '9px 14px' : '10px 14px',
        borderRadius: isUser ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
        background: isUser
          ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
          : 'rgba(255,255,255,0.06)',
        border: isUser ? 'none' : '1px solid rgba(255,255,255,0.08)',
        color: '#f0f4ff',
        fontSize: '0.85rem',
        lineHeight: 1.6,
      }}>
        {isUser ? (
          <span>{msg.content}</span>
        ) : (
          <div className="whobee-markdown">
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Quick prompt chips ──────────────────────────────────────────────────── */
const QUICK_PROMPTS = [
  'How do I get more XP? 🎮',
  'What happens if I ghost a session?',
  'How does matching work?',
  'Tell me about the SOS feature',
];

/* ─── Main Whobee Chat Widget ─────────────────────────────────────────────── */
export default function WhobeeChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hey! I'm **Whobee** 🤖✨ Your StudyFriend AI assistant.\n\nAsk me anything about the platform — matching, XP, sessions, or features!",
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasGlow, setHasGlow] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Global event listener to open from Navbar
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-ai-widget', handleOpen);
    return () => window.removeEventListener('open-ai-widget', handleOpen);
  }, []);

  // Stop glow after first open
  useEffect(() => {
    if (isOpen) setHasGlow(false);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  const sendMessage = useCallback(async (text) => {
    const userText = (text || input).trim();
    if (!userText || isStreaming) return;
    setInput('');

    const userMsg = { role: 'user', content: userText };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setIsStreaming(true);

    // Placeholder for streaming assistant response
    let assistantContent = '';
    setMessages(prev => [...prev, { role: 'assistant', content: '', _streaming: true }]);

    try {
      // Use native fetch with SSE streaming
      const wsUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';
      const response = await fetch(`${wsUrl}/api/whobee/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newHistory }),
        signal: abortRef.current?.signal,
      });

      if (!response.ok) throw new Error(`Server error ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              assistantContent += parsed.text;
              // Stream into the last message
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantContent, _streaming: true };
                return updated;
              });
            }
          } catch (_) {}
        }
      }

      // Finalize — remove _streaming flag
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: assistantContent || "I'm having trouble responding right now. Please try again!" };
        return updated;
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        const rawErr = err.message;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: `⚠️ I ran into a connection issue: **${rawErr}**`,
          };
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
    }
  }, [input, messages, isStreaming]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* ── Markdown styles ── */}
      <style>{`
        .whobee-markdown p { margin: 0 0 6px; }
        .whobee-markdown p:last-child { margin-bottom: 0; }
        .whobee-markdown ul, .whobee-markdown ol { margin: 4px 0 6px 16px; }
        .whobee-markdown li { margin-bottom: 2px; }
        .whobee-markdown strong { color: #a78bfa; font-weight: 700; }
        .whobee-markdown code { background: rgba(0,0,0,0.3); padding: 2px 5px; border-radius: 4px; font-size: 0.8em; }
        .whobee-markdown a { color: #818cf8; }
        .whobee-custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .whobee-custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .whobee-custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(129,140,248,0.3); border-radius: 99px; }
      `}</style>

      {/* ── FAB Toggle Button ── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="whobee-fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.93 }}
            onClick={() => setIsOpen(true)}
            style={{
              position: 'fixed',
              bottom: 28,
              right: 28,
              zIndex: 9990,
              width: 60,
              height: 60,
              borderRadius: '50%',
              border: 'none',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: hasGlow
                ? '0 0 0 6px rgba(129,140,248,0.2), 0 0 30px rgba(139,92,246,0.5), 0 8px 32px rgba(0,0,0,0.4)'
                : '0 0 20px rgba(99,102,241,0.4), 0 8px 24px rgba(0,0,0,0.3)',
            }}
          >
            {hasGlow && (
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  background: 'rgba(129,140,248,0.3)',
                  zIndex: -1,
                }}
              />
            )}
            <WhobeeIcon size={32} glow />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat Window ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="whobee-window"
            initial={{ opacity: 0, scale: 0.88, y: 20, originX: 1, originY: 1 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 16 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            style={{
              position: 'fixed',
              bottom: 28,
              right: 28,
              zIndex: 9990,
              width: 380,
              height: 560,
              borderRadius: 24,
              background: 'rgba(8, 9, 18, 0.92)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(129,140,248,0.15)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* ── Header ── */}
            <div style={{
              padding: '14px 18px',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.1) 100%)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <motion.div
                  animate={{ rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#818cf8,#6d28d9)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 12px rgba(129,140,248,0.5)',
                  }}
                >
                  <WhobeeIcon size={24} />
                </motion.div>
                <div>
                  <div style={{ color: '#f0f4ff', fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
                    Whobee
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <motion.div
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', flexShrink: 0 }}
                    />
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', fontWeight: 600 }}>
                      StudyFriend AI · RAG Powered
                    </span>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', gap: 6 }}>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => {
                  setMessages([{
                    role: 'assistant',
                    content: "Memory cleared! 🧹 Ask me anything new about StudyFriend.",
                  }]);
                }} style={{
                  width: 30, height: 30, borderRadius: '50%', border: 'none',
                  background: 'rgba(255,255,255,0.06)', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem',
                }} title="Clear chat">
                  🗑️
                </motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsOpen(false)} style={{
                  width: 30, height: 30, borderRadius: '50%', border: 'none',
                  background: 'rgba(255,255,255,0.06)', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem',
                }} title="Close">
                  ×
                </motion.button>
              </div>
            </div>

            {/* ── Messages Area ── */}
            <div
              className="whobee-custom-scrollbar"
              style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}
            >
              {messages.map((msg, i) => (
                <ChatBubble key={i} msg={msg} />
              ))}

              {isStreaming && messages[messages.length - 1]?.content === '' && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 4 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg,#818cf8,#6d28d9)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <WhobeeIcon size={16} />
                  </div>
                  <div style={{
                    borderRadius: '4px 18px 18px 18px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}>
                    <TypingDots />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Quick Prompts (only shown with initial state) ── */}
            {messages.length <= 1 && (
              <div style={{
                padding: '0 14px 10px',
                display: 'flex',
                gap: 6,
                flexWrap: 'wrap',
                flexShrink: 0,
              }}>
                {QUICK_PROMPTS.map((prompt) => (
                  <motion.button key={prompt}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => sendMessage(prompt)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 99,
                      border: '1px solid rgba(129,140,248,0.3)',
                      background: 'rgba(99,102,241,0.08)',
                      color: '#a5b4fc',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {prompt}
                  </motion.button>
                ))}
              </div>
            )}

            {/* ── Input Area ── */}
            <div style={{
              padding: '12px 14px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              flexShrink: 0,
              background: 'rgba(0,0,0,0.2)',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 8,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 16,
                padding: '8px 10px 8px 14px',
              }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Whobee anything…"
                  rows={1}
                  disabled={isStreaming}
                  style={{
                    flex: 1,
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    color: '#f0f4ff',
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                    resize: 'none',
                    maxHeight: 80,
                    overflow: 'auto',
                    fontFamily: 'inherit',
                  }}
                />
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isStreaming}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    border: 'none',
                    background: input.trim() && !isStreaming
                      ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                      : 'rgba(255,255,255,0.06)',
                    cursor: input.trim() && !isStreaming ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.2s',
                    boxShadow: input.trim() && !isStreaming ? '0 4px 12px rgba(99,102,241,0.4)' : 'none',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={input.trim() ? '#fff' : 'rgba(255,255,255,0.3)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </motion.button>
              </div>
              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.65rem', marginTop: 6 }}>
                Powered by Gemini 1.5 Flash + Pinecone RAG
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
