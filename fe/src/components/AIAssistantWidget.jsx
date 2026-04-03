import React, { useState, useEffect, useRef } from 'react';
import { Box, IconButton, Typography, TextField, CircularProgress, useTheme as useMuiTheme, Paper, Avatar, Button } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, User, Bot, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', content: "Hi! I'm your AI StudyFriend. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  
  const isBasic = user?.subscription?.plan === 'basic';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Listen for navbar trigger
  useEffect(() => {
    const handler = () => setIsOpen(prev => !prev);
    window.addEventListener('open-ai-widget', handler);
    return () => window.removeEventListener('open-ai-widget', handler);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      // Send the entire conversation history along with the new prompt
      // We pass the previous history excluding the very first greeting if desired, or all.
      const historyPayload = messages.map(m => ({ role: m.role, content: m.content }));
      
      const res = await api.post('/ai/chat', { prompt: userMsg, history: historyPayload });
      
      setMessages(prev => [...prev, { role: 'model', content: res.data.text }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', content: "I'm sorry, I'm having trouble connecting to my brain right now. Please tell the admin to check my API keys!" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Click-outside backdrop */}
            <Box
              onClick={() => setIsOpen(false)}
              sx={{
                position: 'fixed', inset: 0, zIndex: 9998,
                bgcolor: 'transparent',
              }}
            />
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            sx={{
              position: 'fixed',
              bottom: 164,
              right: 24,
              width: 380,
              height: 550,
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: theme === 'dark' ? '0 20px 50px rgba(0,0,0,0.5)' : '0 20px 50px rgba(100,100,111,0.2)',
              borderRadius: 4,
              overflow: 'hidden',
              bgcolor: theme === 'dark' ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid',
              borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            }}
          >
            {/* Header */}
            <Box sx={{ 
              p: 2, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              color: 'white'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 36, height: 36 }}>
                  <Sparkles size={20} />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} lineHeight={1}>AI StudyFriend</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>Powered by Gemini</Typography>
                </Box>
              </Box>
              <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
                <X size={20} />
              </IconButton>
            </Box>

            {/* Chat Area */}
            <Box sx={{ flex: 1, p: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2, position: 'relative' }}>
              {isBasic && (
                <Box sx={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  bgcolor: theme === 'dark' ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(4px)',
                  zIndex: 2, display: 'flex', flexDirection: 'column', 
                  alignItems: 'center', justifyContent: 'center', p: 3, textAlign: 'center'
                }}>
                  <Avatar sx={{ bgcolor: 'rgba(99,102,241,0.1)', color: '#6366f1', width: 64, height: 64, mb: 2 }}>
                    <Sparkles size={32} />
                  </Avatar>
                  <Typography variant="h6" fontWeight={800} mb={1}>Pro Feature</Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Upgrade to Pro to unlock Gemini AI Study Tutor. Get instant help, summaries, and quizzes!
                  </Typography>
                  <Button 
                    onClick={() => { setIsOpen(false); navigate('/billing'); }}
                    sx={{
                      bgcolor: '#6366f1', color: 'white', px: 3, py: 1, borderRadius: '100px',
                      fontSize: '0.9rem', fontWeight: 700,
                      '&:hover': { bgcolor: '#4f46e5' }
                    }}
                  >
                    Upgrade Now
                  </Button>
                </Box>
              )}
              {messages.map((msg, idx) => (
                <Box key={idx} sx={{ display: 'flex', gap: 1.5, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                  <Avatar sx={{ 
                    width: 32, height: 32, 
                    bgcolor: msg.role === 'user' ? 'primary.main' : 'secondary.main' 
                  }}>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </Avatar>
                  
                  <Box sx={{ 
                    maxWidth: '80%', 
                    p: 1.5, 
                    borderRadius: 2,
                    bgcolor: msg.role === 'user' ? 'primary.main' : (theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                    color: msg.role === 'user' ? 'white' : 'text.primary',
                    borderTopRightRadius: msg.role === 'user' ? 4 : 16,
                    borderTopLeftRadius: msg.role === 'model' ? 4 : 16,
                  }}>
                    {msg.role === 'user' ? (
                       <Typography variant="body2">{msg.content}</Typography>
                    ) : (
                       <Box sx={{ 
                         '& p': { m: 0, mb: 1, fontSize: '0.875rem' }, 
                         '& p:last-child': { mb: 0 },
                         '& code': { bgcolor: theme === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)', px: 0.5, borderRadius: 1, fontFamily: 'monospace' },
                         '& pre': { p: 1, borderRadius: 1, bgcolor: theme === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)', overflowX: 'auto', '& code': { bgcolor: 'transparent', px: 0 } },
                         '& ul': { mt: 0, pl: 2, fontSize: '0.875rem' },
                         '& ol': { mt: 0, pl: 2, fontSize: '0.875rem' }
                       }}>
                         <ReactMarkdown>{msg.content || ''}</ReactMarkdown>
                       </Box>
                    )}
                  </Box>
                </Box>
              ))}
              
              {loading && (
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                    <Bot size={16} />
                  </Avatar>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', display: 'flex', gap: 1 }}>
                     <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}><Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'text.secondary' }} /></motion.div>
                     <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}><Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'text.secondary' }} /></motion.div>
                     <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}><Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'text.secondary' }} /></motion.div>
                  </Box>
                </Box>
              )}
              <div ref={messagesEndRef} />
            </Box>

            {/* Input Area */}
            <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: theme === 'dark' ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.95)' }}>
              <TextField
                fullWidth
                multiline
                maxRows={3}
                placeholder="Ask your studyfriend..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                variant="outlined"
                size="small"
                disabled={loading || isBasic}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    pr: 1,
                    bgcolor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <IconButton 
                      color="primary" 
                      onClick={handleSend} 
                      disabled={!input.trim() || loading}
                      sx={{ 
                        bgcolor: input.trim() ? 'primary.main' : 'transparent',
                        color: input.trim() ? 'white !important' : 'action.disabled',
                        '&:hover': { bgcolor: 'primary.dark' },
                        transition: 'all 0.2s',
                        width: 32, height: 32
                      }}
                    >
                      <Send size={16} style={{ marginLeft: 2 }} />
                    </IconButton>
                  ),
                }}
              />
            </Box>
          </Box>
          </>
        )}
      </AnimatePresence>

      {/* FAB hidden — triggered from Navbar */}
    </>
  );
}
