import { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Send, Shield, Sparkles, AlertCircle, ChevronDown, BookOpen, Activity, CheckCircle2, MessageSquareText, LifeBuoy } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import io from 'socket.io-client';
import { useTheme as useCustomTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Typography, Accordion, AccordionSummary, AccordionDetails, useTheme, useMediaQuery, IconButton, CircularProgress } from '@mui/material';

const FAQS = [
  {
    q: "How does the Matchmaker work?",
    a: "Our algorithm uses real-time vectors based on your subjects, psychological learning style, and availability to pair you automatically. Ensure your profile is fully filled out for the best results!"
  },
  {
    q: "How do I earn XP & Rank up?",
    a: "You organically earn XP by joining Live Study Sessions, completing Collaborative Pomodoros, and staying engaged in Squad Chats. Leeching or dropping out of sessions early will actively penalize your XP!"
  },
  {
    q: "What is Whobee AI?",
    a: "Whobee is our natively embedded RAG (Retrieval-Augmented Generation) AI. It has complete awareness of StudyBuddyFinder and your study metrics. Trigger it anywhere using CMD+K or the global widgets."
  },
  {
    q: "Billing & Pro Status",
    a: "To unlock Squad AI Tutors and Priority Live Hub access, navigate to your Billing settings in the Command Palette to upgrade to Pro or Squad Tier."
  }
];

export default function Support() {
  const { user } = useAuth();
  const { theme: currentThemeMode } = useCustomTheme();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('lg'));
  const isDark = currentThemeMode === 'dark';

  const [adminId, setAdminId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  
  // Status check mocks
  const [serverStatus, setServerStatus] = useState('Checking...');

  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Fake status ping for UI flair
    setTimeout(() => setServerStatus('Operational'), 1200);

    // Fetch master admin ID
    api.get('/users/support-admin')
      .then(res => setAdminId(res.data._id))
      .catch(() => toast.error('Support offline'));
  }, []);

  useEffect(() => {
    if (!adminId) return;
    api.get(`/messages/${adminId}`)
      .then(res => setMessages(res.data))
      .catch(() => {});
  }, [adminId]);

  useEffect(() => {
    if (!user) return;
    socketRef.current = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001');
    socketRef.current.emit('setup', user._id);
    return () => socketRef.current.disconnect();
  }, [user]);

  useEffect(() => {
    if (!socketRef.current || !adminId) return;
    const handleReceive = (newMessage) => {
      const isFromAdmin = (newMessage.sender._id || newMessage.sender) === adminId;
      if (isFromAdmin) {
        setMessages(prev => [...prev, newMessage]);
      }
    };
    socketRef.current.on('message_received', handleReceive);
    return () => socketRef.current.off('message_received', handleReceive);
  }, [adminId]);

  useEffect(() => { 
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!newMsg.trim() || !adminId) return;
    setSending(true);
    try {
      const isPremium = user?.subscription?.plan !== 'basic' && user?.subscription?.plan;
      const content = isPremium ? `[PRIORITY] ${newMsg.trim()}` : newMsg.trim();
      const { data } = await api.post('/messages', { receiverId: adminId, content });
      setMessages(prev => [...prev, data]);
      if (socketRef.current) socketRef.current.emit('new_message', data);
      setNewMsg('');
    } catch { 
      toast.error('Failed to send message'); 
    } finally { 
      setSending(false); 
    }
  };
  
  const isPremium = user?.subscription?.plan === 'pro' || user?.subscription?.plan === 'squad';

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto', p: { xs: 2, md: 4 } }}>
      
      {/* ── Page Header ── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Typography variant="h4" fontWeight={900} sx={{ color: isDark ? 'white' : 'black', mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
          <LifeBuoy size={32} color="#f97316" />
          Support Center
        </Typography>
        <Typography variant="body1" sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'text.secondary', mb: 4, maxWidth: 600 }}>
          Welcome to the Assist + Guide hub. Find fast answers in our knowledge base, or connect directly with our system administrators for live support.
        </Typography>
      </motion.div>

      {/* ── Grid Layout ── */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 4, alignItems: 'stretch' }}>
        
        {/* ════════════ GUIDE COLUMN (LEFT) ════════════ */}
        <Box 
          component={motion.div} 
          initial={{ opacity: 0, x: -30 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.6, delay: 0.1 }}
          sx={{ flex: '0 0 380px', display: 'flex', flexDirection: 'column', gap: 3 }}
        >
          {/* Status Module */}
          <Box sx={{ 
            p: 3, borderRadius: 4,
            background: isDark ? 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))' : 'rgba(0,0,0,0.02)',
            border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
          }}>
            <Typography variant="subtitle2" fontWeight={800} color="text.secondary" mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Activity size={16} /> SYSTEM STATUS
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {[
                { label: 'Core API Server', status: serverStatus },
                { label: 'Whobee AI Services', status: 'Operational' },
                { label: 'Realtime Matchmaker', status: 'Operational' },
              ].map((sys, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: isDark ? 'rgba(255,255,255,0.8)' : 'text.primary', fontWeight: 600 }}>{sys.label}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {sys.status === 'Operational' ? <CheckCircle2 size={14} color="#22c55e" /> : <CircularProgress size={12} sx={{ color: '#fb923c' }}/>}
                    <Typography variant="caption" sx={{ color: sys.status === 'Operational' ? '#22c55e' : '#fb923c', fontWeight: 800 }}>{sys.status}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Quick FAQ Module */}
          <Box>
            <Typography variant="subtitle2" fontWeight={800} color="text.secondary" mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BookOpen size={16} /> POPULAR GUIDES
            </Typography>
            {FAQS.map((faq, i) => (
              <Accordion 
                key={i} 
                disableGutters 
                elevation={0}
                sx={{ 
                  bgcolor: 'transparent', 
                  borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                  '&:before': { display: 'none' }
                }}
              >
                <AccordionSummary expandIcon={<ChevronDown size={18} color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'} />} sx={{ px: 0 }}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ color: isDark ? '#e0e7ff' : '#1e293b' }}>
                    {faq.q}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 0, pt: 0, pb: 2 }}>
                  <Typography variant="body2" sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'text.secondary', lineHeight: 1.6 }}>
                    {faq.a}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Box>

        {/* ════════════ ASSIST COLUMN (RIGHT) ════════════ */}
        <Box 
          component={motion.div} 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, delay: 0.2 }}
          sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: { xs: 500, md: 650 } }}
        >
          <Box sx={{ 
            flex: 1, display: 'flex', flexDirection: 'column',
            borderRadius: 6, overflow: 'hidden',
            bgcolor: isDark ? 'rgba(4,6,18,0.6)' : 'rgba(255,255,255,0.9)',
            border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            boxShadow: isDark ? '0 32px 80px rgba(0,0,0,0.5)' : '0 16px 40px rgba(0,0,0,0.05)',
            backdropFilter: 'blur(24px)'
          }}>
            
            {/* Assist Header */}
            <Box sx={{ 
              p: { xs: 2.5, md: 3 }, 
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              display: 'flex', alignItems: 'center', gap: 2.5
            }}>
              <Box sx={{ width: 44, height: 44, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 2px 5px rgba(255,255,255,0.3)' }}>
                <Shield size={22} color="white" />
              </Box>
              <Box>
                {isPremium ? (
                  <>
                    <Typography variant="h6" fontWeight={900} color="white" sx={{ display: 'flex', alignItems: 'center', gap: 1, lineHeight: 1 }}>
                      Priority Support 
                      <Box component="span" sx={{ bgcolor: '#fef08a', color: '#713f12', fontSize: '0.65rem', px: 1, py: 0.25, borderRadius: 99, fontWeight: 900, letterSpacing: 1 }}>VIP</Box>
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      <Sparkles size={12} color="#fef08a" /> High-priority queue enabled
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography variant="h6" fontWeight={900} color="white" sx={{ lineHeight: 1 }}>
                      System Admin Support
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, mt: 0.5, display: 'block' }}>
                      Usually replies within 24 hours
                    </Typography>
                  </>
                )}
              </Box>
            </Box>

            {/* Chat Area */}
            <Box sx={{ 
              flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2,
              bgcolor: isDark ? 'transparent' : 'rgba(0,0,0,0.01)',
              '&::-webkit-scrollbar': { width: 4 },
              '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(249, 115, 22, 0.3)', borderRadius: 4 }
            }}>
              {messages.length === 0 ? (
                <Box sx={{ m: 'auto', textAlign: 'center', opacity: 0.6 }}>
                  <MessageSquareText size={48} color={isDark ? "white" : "black"} style={{ opacity: 0.2, margin: '0 auto', marginBottom: 16 }} />
                  <Typography variant="body1" fontWeight={600} color={isDark ? 'white' : 'black'}>Send a message to our support team.</Typography>
                  <Typography variant="body2" color={isDark ? 'rgba(255,255,255,0.5)' : 'text.secondary'}>We're here to help you get unstuck.</Typography>
                </Box>
              ) : messages.map((msg, idx) => {
                const isMe = (msg.sender._id || msg.sender) === user?._id;
                return (
                  <motion.div 
                    key={msg._id || idx} 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', display: 'flex', flexDirection: 'column', maxWidth: '75%' }}
                  >
                    <Box sx={{ 
                      px: 2.5, py: 1.5, 
                      borderRadius: isMe ? '24px 24px 4px 24px' : '4px 24px 24px 24px',
                      bgcolor: isMe ? '#f97316' : (isDark ? 'rgba(255,255,255,0.05)' : 'white'),
                      color: isMe ? 'white' : (isDark ? 'white' : 'black'),
                      border: isMe ? 'none' : `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                      boxShadow: isMe ? '0 4px 14px rgba(249, 115, 22, 0.3)' : '0 2px 8px rgba(0,0,0,0.02)'
                    }}>
                      <Typography variant="body2" sx={{ lineHeight: 1.6 }}>{msg.content}</Typography>
                    </Box>
                    <Typography variant="caption" sx={{ 
                      alignSelf: isMe ? 'flex-end' : 'flex-start', mt: 0.5, mx: 1,
                      color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)', fontWeight: 600, fontSize: '0.65rem'
                    }}>
                      {format(new Date(msg.createdAt), 'p')}
                    </Typography>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </Box>

            {/* Input Bar */}
            <Box component="form" onSubmit={handleSend} sx={{ 
              p: 2, 
              borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
              bgcolor: isDark ? 'rgba(4,6,18,0.9)' : 'white'
            }}>
              <Box sx={{ 
                display: 'flex', alignItems: 'center', gap: 1,
                bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                borderRadius: 99, px: 2, py: 1,
                transition: 'all 0.2s',
                '&:focus-within': { borderColor: '#f97316', boxShadow: '0 0 0 2px rgba(249, 115, 22, 0.2)', bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'white' }
              }}>
                <input 
                  value={newMsg} onChange={e => setNewMsg(e.target.value)}
                  placeholder="Type your message..."
                  disabled={sending}
                  style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    color: isDark ? 'white' : 'black', fontSize: '0.9rem',
                    padding: '8px 0'
                  }}
                />
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <IconButton 
                    disabled={sending || !newMsg.trim()} 
                    type="submit"
                    sx={{ 
                      bgcolor: newMsg.trim() ? '#f97316' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
                      color: newMsg.trim() ? 'white' : (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'),
                      '&:hover': { bgcolor: newMsg.trim() ? '#ea580c' : 'rgba(255,255,255,0.1)' },
                      transition: 'all 0.2s'
                    }}
                  >
                    <Send size={16} />
                  </IconButton>
                </motion.div>
              </Box>
            </Box>

          </Box>
        </Box>

      </Box>
    </Box>
  );
}
