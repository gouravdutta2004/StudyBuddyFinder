import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Send, MessageCircle, User, ArrowLeft, MoreVertical, Search, CheckCheck, Check, SmilePlus, Paperclip } from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import io from 'socket.io-client';
import { Box, Typography, Button, IconButton, TextField, Avatar, Grid, useTheme, useMediaQuery, InputAdornment, Tooltip } from '@mui/material';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';

// --- Premium Shared Component ---
function TiltCard({ children, sx, overrideHeight }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["2deg", "-2deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-2deg", "2deg"]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const xPct = (e.clientX - rect.left) / width - 0.5;
    const yPct = (e.clientY - rect.top) / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };
  const handleMouseLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      style={{ rotateX, rotateY, perspective: 1200, display: 'flex', height: overrideHeight || '100%', width: '100%' }}
      onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
    >
      <Box sx={{ 
        width: '100%', 
        height: '100%',
        bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.8)', 
        backdropFilter: 'blur(20px)',
        border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)', 
        borderRadius: '24px',
        boxShadow: isDark ? '0 10px 40px rgba(0, 0, 0, 0.3)' : '0 10px 40px rgba(0, 0, 0, 0.05)', 
        overflow: 'hidden', ...sx 
      }}>
        {children}
      </Box>
    </motion.div>
  );
}

export default function Messages() {
  const { user } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [searchParams] = useSearchParams();
  const [inbox, setInbox] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize Socket.io Connection
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';
    socketRef.current = io(wsUrl);
    
    if (user) {
      socketRef.current.emit('setup', user._id);
    }
    
    // Cleanup on unmount
    return () => socketRef.current.disconnect();
  }, [user]);

  // Master Socket Event Listener
  useEffect(() => {
    if (!socketRef.current) return;
    
    const handleReceive = (newMessage) => {
      const isFocused = activeUser && (activeUser._id === newMessage.sender._id || activeUser._id === newMessage.sender);
      if (isFocused) {
        setMessages(prev => [...prev, newMessage]);
        // Refresh Inbox sequence to bump them to top quietly
        loadInboxQuietly();
      } else {
        toast.success(`New Message from ${newMessage.sender.name || 'someone'}`);
        loadInboxQuietly();
      }
    };

    const handleTyping = (data) => {
      // Only set typing if it's from the person we are currently looking at
      if (activeUser && activeUser._id === data.senderId) {
        setIsTyping(true);
      }
    };

    const handleStopTyping = (data) => {
      if (activeUser && activeUser._id === data.senderId) {
        setIsTyping(false);
      }
    };

    socketRef.current.on('message_received', handleReceive);
    socketRef.current.on('typing', handleTyping);
    socketRef.current.on('stop_typing', handleStopTyping);

    return () => {
      socketRef.current.off('message_received', handleReceive);
      socketRef.current.off('typing', handleTyping);
      socketRef.current.off('stop_typing', handleStopTyping);
    };
  }, [activeUser]);

  // Initial Data Fetching
  useEffect(() => {
    fetchInboxData();
    const withId = searchParams.get('with');
    if (withId) {
      api.get(`/users/${withId}`).then(res => setActiveUser(res.data)).catch(() => {});
    }
  }, []);

  // Fetch Conversation History
  useEffect(() => {
    if (activeUser) {
      setIsTyping(false);
      fetchConversation(activeUser._id);
    }
  }, [activeUser]);

  // Auto-scroller
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const loadInboxQuietly = async () => {
    try {
      const res = await api.get('/messages/inbox');
      setInbox(res.data);
    } catch (err) {}
  };

  const fetchInboxData = async () => {
    try {
      const res = await api.get('/messages/inbox');
      setInbox(res.data);
    } catch (err) {
      toast.error('Failed to decrypt Inbox Matrix');
    }
  };

  const fetchConversation = async (id) => {
    try {
      const res = await api.get(`/messages/${id}`);
      setMessages(res.data);
    } catch (err) {
      toast.error('Failed to decrypt conversation history');
    }
  };

  const handleTypingEvent = (e) => {
    setNewMsg(e.target.value);

    // Emit Typing
    if (socketRef.current && activeUser) {
      socketRef.current.emit('typing', { senderId: user._id, receiver: activeUser._id });
      
      // Clear timeout if user is typing
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      // Stop typing if idle for 2 seconds
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit('stop_typing', { senderId: user._id, receiver: activeUser._id });
      }, 2000);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !activeUser) return;
    
    setSending(true);
    socketRef.current.emit('stop_typing', { senderId: user._id, receiver: activeUser._id });

    try {
      const { data } = await api.post('/messages', { receiverId: activeUser._id, content: newMsg.trim() });
      setMessages(prev => [...prev, data]);
      if (socketRef.current) socketRef.current.emit('new_message', data);
      setNewMsg('');
      loadInboxQuietly(); // bump active to top
    } catch { 
      toast.error('Transmission failed.'); 
    } finally { 
      setSending(false); 
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    const toastId = toast.loading('Uploading attachment...');

    try {
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const wsUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';
      const absUrl = `${wsUrl}${data.url}`;
      const markdownInjection = file.type.startsWith('image/') ? `![attachment](${absUrl})` : `[Download Attachment](${absUrl})`;
      setNewMsg(prev => prev ? `${prev}\n${markdownInjection}` : markdownInjection);
      toast.success('Attached successfully', { id: toastId });
    } catch(err) {
      toast.error('Upload failed', { id: toastId });
    } finally {
      e.target.value = null;
    }
  };

  const getOtherUser = (msg) => {
    if (!msg.sender || !msg.receiver) return null;
    return msg.sender._id === user?._id ? msg.receiver : msg.sender;
  };

  const filteredInbox = inbox.filter(msg => {
    const other = getOtherUser(msg);
    if (!other || other.isAdmin) return false;
    if (searchFilter && !other.name.toLowerCase().includes(searchFilter.toLowerCase())) return false;
    return true;
  });

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', py: { xs: 2, md: 4 }, px: { xs: 1, md: 2 }, position: 'relative', overflow: 'hidden' }}>
      {/* Dynamic Ambient Background */}
      <Box sx={{ position: 'fixed', top: '-10%', left: '-5%', width: 500, height: 500, bgcolor: 'rgba(56, 189, 248, 0.05)', borderRadius: '50%', filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none' }} />
      <Box sx={{ position: 'fixed', bottom: '-10%', right: '-5%', width: 500, height: 500, bgcolor: 'rgba(99, 102, 241, 0.05)', borderRadius: '50%', filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none' }} />

      <Box sx={{ width: '100%', maxWidth: 1200, position: 'relative', zIndex: 1, height: '80vh' }}>
        <TiltCard overrideHeight="80vh">
          <Grid container sx={{ height: '100%', m: 0 }}>
            
            {/* INBOX SIDEBAR */}
            <Grid item xs={12} md={4} sx={{ height: '100%', borderRight: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)', display: (!activeUser || !isMobile) ? 'flex' : 'none', flexDirection: 'column', bgcolor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)' }}>
              
              <Box sx={{ p: 3, borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)' }}>
                <Typography variant="h5" fontWeight={900} color={isDark ? "white" : "#0f172a"} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <MessageCircle size={24} color="#38bdf8" /> Direct Messages
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Search connections..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  variant="outlined"
                  size="small"
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Search size={16} color={isDark ? "#94a3b8" : "#64748b"}/></InputAdornment>,
                    sx: { bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'white', borderRadius: 3, color: isDark ? 'white' : 'black', '& fieldset': { border: 'none' } }
                  }}
                />
              </Box>

              <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                {filteredInbox.length === 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', h: '100%', py: 8, color: isDark ? 'rgba(255,255,255,0.4)': 'rgba(0,0,0,0.4)' }}>
                    <MessageCircle size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                    <Typography fontWeight={700}>Inbox Empty</Typography>
                    <Typography variant="body2" mt={0.5}>Connect with Study Buddies first!</Typography>
                  </Box>
                ) : (
                  filteredInbox.map(msg => {
                    const other = getOtherUser(msg);
                    const isActive = activeUser?._id === other._id;
                    const isUnread = !msg.read && (msg.receiver?._id || msg.receiver) === user?._id;
                    return (
                      <Box
                        key={msg._id}
                        component={motion.div}
                        whileHover={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}
                        onClick={() => setActiveUser(other)}
                        sx={{
                          p: 3, display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer',
                          borderBottom: isDark ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(0,0,0,0.03)',
                          bgcolor: isActive ? (isDark ? 'rgba(56, 189, 248, 0.1)' : 'rgba(56, 189, 248, 0.05)') : 'transparent',
                          transition: '0.2s', position: 'relative'
                        }}
                      >
                        <Box sx={{ position: 'relative' }}>
                          <Avatar src={other.avatar} sx={{ width: 48, height: 48, bgcolor: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
                            {other.name?.charAt(0) || 'U'}
                          </Avatar>
                          {isUnread && (
                            <Box sx={{ position: 'absolute', top: 0, right: 0, width: 14, height: 14, bgcolor: '#38bdf8', borderRadius: '50%', border: '2px solid', borderColor: isDark ? '#1e293b' : 'white', boxShadow: '0 0 10px rgba(56,189,248,0.5)' }} />
                          )}
                        </Box>
                        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                          <Typography variant="subtitle2" fontWeight={800} color={isDark ? "white" : "#0f172a"} noWrap>{other.name}</Typography>
                          <Typography variant="body2" color={isUnread ? (isDark ? 'white' : 'black') : (isActive ? '#38bdf8' : (isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"))} fontWeight={isUnread ? 800 : 500} noWrap>
                            {msg.content}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })
                )}
              </Box>
            </Grid>

            {/* ACTIVE CHAT AREA */}
            <Grid item xs={12} md={8} sx={{ height: '100%', display: (!activeUser && isMobile) ? 'none' : 'flex', flexDirection: 'column' }}>
              
              {activeUser ? (
                <>
                  {/* Chat Header */}
                  <Box sx={{ p: 2, borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.5)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {isMobile && (
                        <IconButton onClick={() => setActiveUser(null)} sx={{ color: isDark ? 'white' : 'black' }}>
                          <ArrowLeft size={20} />
                        </IconButton>
                      )}
                      <Avatar src={activeUser.avatar} sx={{ width: 40, height: 40, bgcolor: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>{activeUser.name.charAt(0)}</Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={900} color={isDark ? "white" : "#0f172a"}>{activeUser.name}</Typography>
                        <Typography variant="caption" fontWeight={600} color={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"}>
                          {activeUser.university || 'Active Now'}
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                      <MoreVertical size={20} />
                    </IconButton>
                  </Box>

                  {/* Messages Stream */}
                  <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <AnimatePresence>
                      {messages.map((msg, index) => {
                        const isMe = (msg.sender._id || msg.sender) === user?._id;
                        const showAvatar = index === messages.length - 1 || (messages[index + 1]?.sender?._id !== msg.sender?._id);
                        
                        return (
                          <Box key={msg._id} component={motion.div} initial={{ opacity: 0, scale: 0.9, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }} sx={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 1 }}>
                            
                            {!isMe && showAvatar && (
                              <Avatar src={activeUser.avatar} sx={{ width: 28, height: 28 }} />
                            )}
                            {!isMe && !showAvatar && <Box sx={{ width: 28 }} />}

                            <Box sx={{
                              maxWidth: '75%',
                              p: 2,
                              borderRadius: isMe ? '24px 24px 4px 24px' : '24px 24px 24px 4px',
                              bgcolor: isMe ? '#6366f1' : (isDark ? 'rgba(255,255,255,0.05)' : 'white'),
                              color: isMe ? 'white' : (isDark ? 'white' : '#0f172a'),
                              boxShadow: isMe ? '0 10px 20px rgba(99, 102, 241, 0.2)' : '0 10px 20px rgba(0,0,0,0.02)',
                              border: isMe ? 'none' : (isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)'),
                              '& p': { m: 0, mb: 1, fontSize: '0.95rem', fontWeight: 500, lineHeight: 1.5, wordBreak: 'break-word' },
                              '& p:last-child': { mb: 0 },
                              '& code': { bgcolor: isMe ? 'rgba(0,0,0,0.2)' : (isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)'), px: 0.5, py: 0.2, borderRadius: 1, fontFamily: 'monospace', fontSize: '0.85rem' },
                              '& pre': { p: 1.5, borderRadius: 2, bgcolor: isMe ? 'rgba(0,0,0,0.3)' : (isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.05)'), overflowX: 'auto', '& code': { bgcolor: 'transparent', px: 0 } },
                              '& ul, & ol': { mt: 0, mb: 1, pl: 2, fontSize: '0.95rem' }
                            }}>
                              <ReactMarkdown>{msg.content || ''}</ReactMarkdown>
                              
                              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, mt: 0.5, opacity: isMe ? 0.9 : 0.5, fontWeight: 700, fontSize: '0.65rem' }}>
                                {format(new Date(msg.createdAt), 'h:mm a')}
                                {isMe && (msg.read ? <CheckCheck size={14} color="#38bdf8" /> : <Check size={14} />)}
                              </Typography>
                            </Box>

                          </Box>
                        );
                      })}
                    </AnimatePresence>
                    
                    {/* Live Typing Indicator Overlay */}
                    {isTyping && (
                      <Box component={motion.div} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', gap: 1 }}>
                        <Avatar src={activeUser.avatar} sx={{ width: 28, height: 28 }} />
                        <Box sx={{ p: 1.5, px: 2, borderRadius: '24px 24px 24px 4px', bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'white', display: 'flex', gap: 1 }}>
                          <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} style={{ width: 6, height: 6, backgroundColor: '#8b5cf6', borderRadius: '50%' }} />
                          <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} style={{ width: 6, height: 6, backgroundColor: '#8b5cf6', borderRadius: '50%' }} />
                          <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} style={{ width: 6, height: 6, backgroundColor: '#8b5cf6', borderRadius: '50%' }} />
                        </Box>
                      </Box>
                    )}
                    <div ref={messagesEndRef} />
                  </Box>

                  {/* Quick-Emoji Toolbar */}
                  <Box sx={{ px: 2, py: 1, display: 'flex', gap: 1, borderTop: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)', bgcolor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)' }}>
                    <IconButton size="small" onClick={() => fileInputRef.current?.click()} sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                      <Paperclip size={18} />
                    </IconButton>
                    <input type="file" hidden ref={fileInputRef} onChange={handleFileUpload} />
                    {['👍', '🔥', '🚀', '💡', '📚', '😂'].map(emoji => (
                      <motion.div key={emoji} whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                        <Button 
                          onClick={() => setNewMsg(prev => prev + emoji)}
                          sx={{ minWidth: 0, p: 0.5, fontSize: '1.2rem', borderRadius: '50%', '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' } }}
                        >
                          {emoji}
                        </Button>
                      </motion.div>
                    ))}
                    <Tooltip title={<Typography variant="caption">Format with **bold**, *italic*, `code`, or - list</Typography>}>
                      <IconButton size="small" sx={{ ml: 'auto', color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}><SmilePlus size={16} /></IconButton>
                    </Tooltip>
                  </Box>

                  {/* Input Form */}
                  <form onSubmit={handleSend} style={{ padding: '16px', paddingTop: '8px', backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)' }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <TextField
                        fullWidth
                        placeholder="Transmit message..."
                        value={newMsg}
                        onChange={handleTypingEvent}
                        variant="outlined"
                        multiline
                        maxRows={4}
                        sx={{
                          '& .MuiInputBase-root': { bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'white', borderRadius: '24px', color: isDark ? 'white' : 'black', px: 3, py: 1.5 },
                          '& fieldset': { border: 'none' }
                        }}
                      />
                      <IconButton 
                        type="submit" 
                        disabled={sending || !newMsg.trim()}
                        sx={{ 
                          width: 56, height: 56, bgcolor: '#6366f1', color: 'white', borderRadius: '50%', flexShrink: 0,
                          '&:hover': { bgcolor: '#4f46e5', transform: 'scale(1.05)' }, transition: '0.2s',
                          '&.Mui-disabled': { bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', color: 'rgba(255,255,255,0.3)' }
                        }}
                      >
                        <Send size={20} />
                      </IconButton>
                    </Box>
                  </form>
                </>
              ) : (
                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', p: 4 }}>
                  <MessageCircle size={80} style={{ opacity: 0.2, marginBottom: 24 }} />
                  <Typography variant="h4" fontWeight={900} color={isDark ? "white" : "#0f172a"}>Your Messages Matrix</Typography>
                  <Typography variant="body1" fontWeight={500} mt={1} textAlign="center">
                    Select an active connection from the left sidebar to decrypt a conversation.
                  </Typography>
                </Box>
              )}

            </Grid>
          </Grid>
        </TiltCard>
      </Box>
    </Box>
  );
}
