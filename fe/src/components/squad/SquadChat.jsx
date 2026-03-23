import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, Button, Typography, Paper, CircularProgress, IconButton } from '@mui/material';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';
import ReactMarkdown from 'react-markdown';

export default function SquadChat({ groupId, subject, name }) {
  const [messages, setMessages] = useState([{
    id: 'msg-1',
    sender: 'ai',
    text: `Hi squad! I'm Gemini, your AI Study Tutor. Ask me to explain concepts, summarize notes, or generate quizzes about ${subject}!`
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { id: Date.now().toString(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/squad-tutor', {
        prompt: userMsg.text,
        squadName: name,
        subject: subject
      });
      setMessages(prev => [...prev, { id: Date.now().toString() + 'ai', sender: 'ai', text: res.data.text }]);
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now().toString() + 'err', sender: 'ai', text: 'Sorry, I failed to process that request. The neural link might be down.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ height: '600px', display: 'flex', flexDirection: 'column', bgcolor: '#020617', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
      
      <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'rgba(255,255,255,0.02)' }}>
        <Box sx={{ width: 40, height: 40, borderRadius: '12px', bgcolor: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={20} color="#818cf8" />
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight="800" color="white">Gemini Tutor</Typography>
          <Typography variant="caption" color="rgba(255,255,255,0.5)">Always active in {name}</Typography>
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <AnimatePresence>
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                layout
                style={{ 
                  display: 'flex', 
                  alignSelf: isUser ? 'flex-end' : 'flex-start', 
                  maxWidth: '85%', 
                  gap: '12px',
                  flexDirection: isUser ? 'row-reverse' : 'row'
                }}
              >
                {!isUser && (
                  <Box sx={{ width: 32, height: 32, borderRadius: '10px', bgcolor: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 1 }}>
                    <Bot size={18} color="#60a5fa" />
                  </Box>
                )}
                <Box sx={{ 
                  p: 2.5, 
                  bgcolor: isUser ? '#6366f1' : 'rgba(255,255,255,0.05)', 
                  color: 'white', 
                  borderRadius: '24px', 
                  borderTopRightRadius: isUser ? 4 : 24, 
                  borderTopLeftRadius: !isUser ? 4 : 24,
                  border: isUser ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  boxShadow: isUser ? '0 10px 20px -10px rgba(99, 102, 241, 0.5)' : 'none'
                }}>
                   <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none" components={{ p: ({node, ...props}) => <Typography variant="body2" sx={{ lineHeight: 1.6 }} {...props} /> }}>
                     {msg.text || ''}
                   </ReactMarkdown>
                </Box>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', alignSelf: 'flex-start', gap: '12px' }}>
            <Box sx={{ width: 32, height: 32, borderRadius: '10px', bgcolor: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
              <Bot size={18} color="#60a5fa" />
            </Box>
            <Box sx={{ p: 2, borderRadius: '24px', borderTopLeftRadius: 4, bgcolor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center' }}>
              <CircularProgress size={20} thickness={5} sx={{ color: '#8b5cf6' }} />
            </Box>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </Box>

      <Box component="form" onSubmit={handleSend} sx={{ p: 2, display: 'flex', gap: 1, bgcolor: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <TextField 
          fullWidth size="small" 
          placeholder="Ask Gemini something..." 
          value={input} onChange={e => setInput(e.target.value)} 
          autoComplete="off"
          sx={{ 
            input: { color: 'white' }, 
            '& .MuiOutlinedInput-root': {
              bgcolor: 'rgba(255,255,255,0.05)',
              borderRadius: '100px',
              '& fieldset': { borderColor: 'transparent' },
              '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
              '&.Mui-focused fieldset': { borderColor: '#818cf8' },
            }
          }} 
        />
        <Button 
          type="submit" variant="contained" 
          disabled={loading || !input.trim()}
          sx={{ 
            borderRadius: '100px', minWidth: '48px', width: '48px', height: '48px', p: 0,
            bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' },
            '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }
          }}
        >
          <Send size={18} />
        </Button>
      </Box>
    </Box>
  );
}
