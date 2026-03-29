import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, IconButton, Avatar, TextField, InputAdornment, Tooltip, Badge, Fab, Button } from '@mui/material';
import { MessageCircle, X, Search, MoreVertical, ArrowLeft, Send, CheckCheck, Check, SmilePlus, Paperclip } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';

export default function GlobalMessengerWidget() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [open, setOpen] = useState(false);
  
  const [inbox, setInbox] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [unreadTotal, setUnreadTotal] = useState(0);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  // Deep Link Listener for opening specific chats
  useEffect(() => {
    const handleOpenMessenger = async (e) => {
      setOpen(true);
      if (e.detail?.userId) {
        try {
          const res = await api.get(`/users/${e.detail.userId}`);
          setActiveUser(res.data);
        } catch(err) { console.error('Failed to load user for dm'); }
      }
    };
    window.addEventListener('open-messenger', handleOpenMessenger);
    return () => window.removeEventListener('open-messenger', handleOpenMessenger);
  }, []);

  // Sync Inbox
  useEffect(() => {
    if (user && open) {
      loadInbox();
    }
  }, [user, open]);

  // Sync Global Unread (Even when closed)
  useEffect(() => {
    if (user) {
      const fetchSilentUnread = async () => {
        try {
          const res = await api.get('/messages/inbox');
          const count = res.data.filter(msg => !msg.read && msg.receiver === user._id).length;
          setUnreadTotal(count);
          setInbox(res.data);
        } catch(err) {}
      };
      fetchSilentUnread();
    }
  }, [user]);

  // Socket Listener
  useEffect(() => {
    if (!socket || !user) return;

    const handleReceive = (newMessage) => {
      const isFocused = activeUser && (activeUser._id === newMessage.sender._id || activeUser._id === newMessage.sender);
      if (isFocused && open) {
        setMessages(prev => [...prev, newMessage]);
        loadInboxQuietly(); // mark as read happens below visually, server needs ping ideally
      } else {
        setUnreadTotal(prev => prev + 1);
        loadInboxQuietly();
      }
    };

    const handleTyping = (data) => {
      if (activeUser && activeUser._id === data.senderId) setIsTyping(true);
    };

    const handleStopTyping = (data) => {
      if (activeUser && activeUser._id === data.senderId) setIsTyping(false);
    };

    socket.on('message_received', handleReceive);
    socket.on('typing', handleTyping);
    socket.on('stop_typing', handleStopTyping);

    return () => {
      socket.off('message_received', handleReceive);
      socket.off('typing', handleTyping);
      socket.off('stop_typing', handleStopTyping);
    };
  }, [socket, activeUser, open, user]);

  // Load Active Chat
  useEffect(() => {
    if (activeUser && open) {
      setIsTyping(false);
      fetchConversation(activeUser._id);
    }
  }, [activeUser, open]);

  // Auto-scroll Down
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, open]);

  const loadInbox = async () => {
    try {
      const res = await api.get('/messages/inbox');
      setInbox(res.data);
      const count = res.data.filter(msg => !msg.read && (msg.receiver?._id || msg.receiver) === user._id).length;
      setUnreadTotal(count);
    } catch(err) {}
  };

  const loadInboxQuietly = async () => {
    try {
      const res = await api.get('/messages/inbox');
      setInbox(res.data);
    } catch(err) {}
  };

  const fetchConversation = async (id) => {
    try {
      const res = await api.get(`/messages/${id}`);
      setMessages(res.data);
      loadInboxQuietly(); // Updates Inbox unread state silently since server marked them read
      setUnreadTotal(prev => Math.max(0, prev - 1)); 
    } catch(err) {}
  };

  const handleTypingEvent = (e) => {
    setNewMsg(e.target.value);
    if (socket && activeUser) {
      socket.emit('typing', { senderId: user._id, receiver: activeUser._id });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', { senderId: user._id, receiver: activeUser._id });
      }, 2000);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !activeUser) return;
    setSending(true);
    if(socket) socket.emit('stop_typing', { senderId: user._id, receiver: activeUser._id });

    try {
      const { data } = await api.post('/messages', { receiverId: activeUser._id, content: newMsg.trim() });
      setMessages(prev => [...prev, data]);
      if (socket) socket.emit('new_message', data);
      setNewMsg('');
      loadInboxQuietly(); 
    } catch { 
      toast.error('Transmission failed.'); 
    } finally { setSending(false); }
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
      // Append markdown directly to the textbox
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

  if (!user) return null;

  return (
    <>
      <Box sx={{ position: 'fixed', bottom: 24, right: 104, zIndex: 9999 }}>
        <Badge badgeContent={unreadTotal} color="error" overlap="circular" sx={{ '& .MuiBadge-badge': { fontWeight: 900, height: 24, minWidth: 24, borderRadius: 12 } }}>
          <Fab 
            color="primary" 
            aria-label="messages" 
            onClick={() => setOpen(!open)}
            sx={{ bgcolor: '#3b82f6', width: 64, height: 64, boxShadow: '0 8px 32px rgba(59, 130, 246, 0.5)', '&:hover': { bgcolor: '#2563eb', transform: 'scale(1.05)' }, transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
          >
            {open ? <X size={28} /> : <MessageCircle size={28} />}
          </Fab>
        </Badge>
      </Box>

      <AnimatePresence>
        {open && (
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            sx={{
              position: 'fixed', bottom: 100, right: 24, width: 380, height: 600, 
              maxHeight: 'calc(100vh - 120px)', zIndex: 9998,
              bgcolor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(24px)',
              borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)', overflow: 'hidden',
              display: 'flex', flexDirection: 'column'
            }}
          >
            {!activeUser ? (
              // INBOX VIEW
              <>
                <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <Typography variant="h6" fontWeight={900} color="white" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <MessageCircle size={20} color="#38bdf8" /> Messenger
                  </Typography>
                  <TextField
                    fullWidth placeholder="Search connections..." value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} size="small"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><Search size={16} color="#94a3b8"/></InputAdornment>,
                      sx: { bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 3, color: 'white', '& fieldset': { border: 'none' } }
                    }}
                  />
                </Box>
                <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                  {filteredInbox.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                      <Typography variant="body2">No conversations found.</Typography>
                    </Box>
                  ) : (
                    filteredInbox.map(msg => {
                      const other = getOtherUser(msg);
                      const isUnread = !msg.read && (msg.receiver?._id || msg.receiver) === user._id;
                      return (
                        <Box key={msg._id} onClick={() => setActiveUser(other)} sx={{ p: 2.5, display: 'flex', gap: 2, cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)', '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}>
                          <Badge color="info" variant="dot" invisible={!isUnread} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
                            <Avatar src={other.avatar} sx={{ width: 44, height: 44 }}>{other.name?.charAt(0)}</Avatar>
                          </Badge>
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography variant="subtitle2" fontWeight={800} color="white" noWrap>{other.name}</Typography>
                            <Typography variant="body2" color={isUnread ? "white" : "rgba(255,255,255,0.5)"} fontWeight={isUnread ? 700 : 400} noWrap>
                              {msg.content}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })
                  )}
                </Box>
              </>
            ) : (
              // ACTIVE CHAT VIEW
              <>
                <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'rgba(255,255,255,0.02)' }}>
                  <IconButton size="small" onClick={() => setActiveUser(null)} sx={{ color: 'white' }}><ArrowLeft size={18} /></IconButton>
                  <Avatar src={activeUser.avatar} sx={{ width: 36, height: 36 }}>{activeUser.name.charAt(0)}</Avatar>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight={800} color="white" noWrap>{activeUser.name}</Typography>
                    <Typography variant="caption" color="rgba(255,255,255,0.5)" noWrap>{activeUser.university || 'Active'}</Typography>
                  </Box>
                </Box>

                <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <AnimatePresence>
                    {messages.map((msg, index) => {
                      const isMe = (msg.sender._id || msg.sender) === user._id;
                      return (
                        <Box key={msg._id} component={motion.div} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} sx={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                          <Box sx={{ 
                            maxWidth: '85%', p: 1.5, px: 2, borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                            bgcolor: isMe ? '#6366f1' : 'rgba(255,255,255,0.08)', color: 'white',
                            '& p': { m: 0, fontWeight: 500, fontSize: '0.9rem', wordBreak: 'break-word' },
                            '& img': { maxWidth: '100%', borderRadius: 8, mt: 1 }
                          }}>
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </Box>
                          <Typography variant="caption" sx={{ mt: 0.5, color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {format(new Date(msg.createdAt), 'h:mm a')}
                            {isMe && (msg.read ? <CheckCheck size={12} color="#38bdf8" /> : <Check size={12} />)}
                          </Typography>
                        </Box>
                      );
                    })}
                  </AnimatePresence>
                  {isTyping && (
                    <Box sx={{ alignSelf: 'flex-start', bgcolor: 'rgba(255,255,255,0.05)', p: 1.5, borderRadius: '16px', display: 'flex', gap: 0.5 }}>
                      <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} style={{ width: 4, height: 4, backgroundColor: '#8b5cf6', borderRadius: '50%' }} />
                      <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} style={{ width: 4, height: 4, backgroundColor: '#8b5cf6', borderRadius: '50%' }} />
                      <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} style={{ width: 4, height: 4, backgroundColor: '#8b5cf6', borderRadius: '50%' }} />
                    </Box>
                  )}
                  <div ref={messagesEndRef} />
                </Box>

                <form onSubmit={handleSend} style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  {/* Toolbar */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 1, px: 1 }}>
                    <IconButton size="small" onClick={() => fileInputRef.current?.click()} sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      <Paperclip size={18} />
                    </IconButton>
                    <input type="file" hidden ref={fileInputRef} onChange={handleFileUpload} />
                    {['👍', '🔥', '😂'].map(emoji => (
                      <Button key={emoji} onClick={() => setNewMsg(prev => prev + emoji)} sx={{ minWidth: 0, p: 0.5, fontSize: '1.2rem', borderRadius: '50%' }}>{emoji}</Button>
                    ))}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField fullWidth placeholder="Message..." value={newMsg} onChange={handleTypingEvent} variant="outlined" multiline maxRows={3}
                      sx={{ '& .MuiInputBase-root': { bgcolor: 'rgba(255,255,255,0.05)', borderRadius: '20px', color: 'white', px: 2, py: 1 }, '& fieldset': { border: 'none' } }}
                    />
                    <IconButton type="submit" disabled={sending || !newMsg.trim()} sx={{ width: 44, height: 44, bgcolor: '#6366f1', color: 'white', borderRadius: '50%', '&:hover': { bgcolor: '#4f46e5' }, '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' } }}>
                      <Send size={18} />
                    </IconButton>
                  </Box>
                </form>
              </>
            )}
          </Box>
        )}
      </AnimatePresence>
    </>
  );
}
