import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  Send, MessageSquare, ArrowLeft, Search, CheckCheck, Check,
  Paperclip, Reply, X, MoreHorizontal, Phone, Video, Info,
  SmilePlus, Circle
} from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { format, isToday, isYesterday } from 'date-fns';
import io from 'socket.io-client';
import {
  Box, Typography, Button, IconButton, TextField, Avatar,
  useTheme, useMediaQuery, InputAdornment, Tooltip
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

function formatMsgDate(date) {
  const d = new Date(date);
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return `Yesterday ${format(d, 'h:mm a')}`;
  return format(d, 'MMM d, h:mm a');
}

function groupByDate(messages) {
  const groups = [];
  let lastDate = null;
  messages.forEach(msg => {
    const d = new Date(msg.createdAt);
    const label = isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'MMMM d, yyyy');
    if (label !== lastDate) { groups.push({ type: 'date', label }); lastDate = label; }
    groups.push(msg);
  });
  return groups;
}

export default function Messages() {
  const { user } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [inbox, setInbox] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);

  /* ── Socket ── */
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';
    socketRef.current = io(wsUrl, { withCredentials: true });
    if (user) socketRef.current.emit('setup', user._id);
    socketRef.current.on('user_online', id => setOnlineUsers(p => new Set([...p, id])));
    socketRef.current.on('user_offline', id => setOnlineUsers(p => { const s = new Set(p); s.delete(id); return s; }));
    return () => socketRef.current.disconnect();
  }, [user]);

  useEffect(() => {
    if (location.state?.openUserId) api.get(`/users/${location.state.openUserId}`).then(r => setActiveUser(r.data)).catch(() => {});
    const withId = searchParams.get('with');
    if (withId) api.get(`/users/${withId}`).then(r => setActiveUser(r.data)).catch(() => {});
  }, [location.state, searchParams]);

  useEffect(() => {
    if (!socketRef.current) return;
    const handleReceive = (msg) => {
      if (activeUser && (activeUser._id === msg.sender._id || activeUser._id === msg.sender)) {
        setMessages(p => [...p, msg]); loadInboxQuietly();
      } else {
        toast(`${msg.sender?.name}: ${msg.content?.slice(0, 40)}`, {
          duration: 3000,
          icon: '💬',
        });
        loadInboxQuietly();
      }
    };
    const handleTyping = (d) => { if (activeUser?._id === d.senderId) setIsTyping(true); };
    const handleStop = (d) => { if (activeUser?._id === d.senderId) setIsTyping(false); };
    socketRef.current.on('message_received', handleReceive);
    socketRef.current.on('typing', handleTyping);
    socketRef.current.on('stop_typing', handleStop);
    return () => {
      socketRef.current.off('message_received', handleReceive);
      socketRef.current.off('typing', handleTyping);
      socketRef.current.off('stop_typing', handleStop);
    };
  }, [activeUser]);

  useEffect(() => { fetchInboxData(); }, []);
  useEffect(() => { if (activeUser) { setIsTyping(false); setReplyTo(null); fetchConversation(activeUser._id); } }, [activeUser]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  const loadInboxQuietly = async () => { try { const r = await api.get('/messages/inbox'); setInbox(r.data); } catch {} };
  const fetchInboxData = async () => { try { const r = await api.get('/messages/inbox'); setInbox(r.data); } catch { toast.error('Could not load messages'); } };
  const fetchConversation = async (id) => { try { const r = await api.get(`/messages/${id}`); setMessages(r.data); } catch {} };

  const handleTypingEvent = (e) => {
    setNewMsg(e.target.value);
    if (socketRef.current && activeUser) {
      socketRef.current.emit('typing', { senderId: user._id, receiver: activeUser._id });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit('stop_typing', { senderId: user._id, receiver: activeUser._id });
      }, 2000);
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!newMsg.trim() || !activeUser) return;
    setSending(true);
    socketRef.current?.emit('stop_typing', { senderId: user._id, receiver: activeUser._id });
    try {
      const content = replyTo
        ? `> *↩ ${replyTo.content.slice(0, 60)}${replyTo.content.length > 60 ? '…' : ''}*\n\n${newMsg.trim()}`
        : newMsg.trim();
      const { data } = await api.post('/messages', { receiverId: activeUser._id, content });
      setMessages(p => [...p, data]);
      socketRef.current?.emit('new_message', data);
      setNewMsg('');
      setReplyTo(null);
      loadInboxQuietly();
    } catch { toast.error('Failed to send'); } finally { setSending(false); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    const tid = toast.loading('Uploading…');
    try {
      const { data } = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const wsUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';
      const url = `${wsUrl}${data.url}`;
      const md = file.type.startsWith('image/') ? `![img](${url})` : `[${file.name}](${url})`;
      setNewMsg(p => p ? `${p}\n${md}` : md);
      toast.success('File attached', { id: tid });
    } catch { toast.error('Upload failed', { id: tid }); } finally { e.target.value = null; }
  };

  const getOtherUser = (msg) => {
    if (!msg.sender || !msg.receiver) return null;
    return msg.sender._id === user?._id ? msg.receiver : msg.sender;
  };

  const filteredInbox = inbox.filter(msg => {
    const other = getOtherUser(msg);
    if (!other || other.isAdmin) return false;
    if (searchFilter && !other.name?.toLowerCase().includes(searchFilter.toLowerCase())) return false;
    return true;
  });

  const grouped = groupByDate(messages);
  const isOnline = activeUser && onlineUsers.has(activeUser._id);

  /* ── Colors ── */
  const bg = isDark ? '#0f172a' : '#f8fafc';
  const sideBg = isDark ? '#0a0f1c' : '#ffffff';
  const chatBg = isDark ? '#111827' : '#f9fafb';
  const borderC = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const myBubble = isDark ? '#4f46e5' : '#6366f1';
  const theirBubble = isDark ? '#1e293b' : '#ffffff';

  return (
    <Box sx={{
      height: 'calc(100vh - 32px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      px: { xs: 0, md: 2 }, py: { xs: 0, md: 2 },
      bgcolor: bg,
    }}>
      <Box sx={{
        width: '100%', maxWidth: 1200, height: '100%',
        display: 'flex',
        borderRadius: { xs: 0, md: '16px' },
        overflow: 'hidden',
        border: '1px solid', borderColor: borderC,
        boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.1)',
        bgcolor: sideBg,
      }}>

        {/* ── Sidebar ── */}
        <Box sx={{
          width: { xs: '100%', md: 300 },
          flexShrink: 0,
          display: (!activeUser || !isMobile) ? 'flex' : 'none',
          flexDirection: 'column',
          borderRight: '1px solid', borderColor: borderC,
          bgcolor: sideBg,
        }}>
          {/* Sidebar Header */}
          <Box sx={{ px: 2.5, py: 2.5, borderBottom: '1px solid', borderColor: borderC }}>
            <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: isDark ? 'white' : '#0f172a', mb: 1.5 }}>
              Messages
            </Typography>
            <TextField
              fullWidth size="small"
              placeholder="Search conversations..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search size={14} color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'} /></InputAdornment>,
                endAdornment: searchFilter ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchFilter('')}>
                      <X size={12} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                  '& fieldset': { borderColor: 'transparent' },
                  '&:hover fieldset': { borderColor: borderC },
                  '&.Mui-focused fieldset': { borderColor: '#6366f1', borderWidth: 1 },
                },
              }}
            />
          </Box>

          {/* Conversation list */}
          <Box sx={{ flex: 1, overflowY: 'auto', py: 1, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: borderC, borderRadius: 2 } }}>
            {filteredInbox.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8, color: 'text.disabled' }}>
                <MessageSquare size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>No conversations yet</Typography>
              </Box>
            ) : filteredInbox.map(msg => {
              const other = getOtherUser(msg);
              if (!other) return null;
              const isActive = activeUser?._id === other._id;
              const isUnread = !msg.read && (msg.receiver?._id || msg.receiver) === user?._id;
              const isOnlineUser = onlineUsers.has(other._id);

              return (
                <Box
                  key={msg._id}
                  onClick={() => setActiveUser(other)}
                  component={motion.div}
                  whileHover={{ x: 2 }}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    px: 2, py: 1.5, mx: 1, borderRadius: '12px',
                    cursor: 'pointer',
                    bgcolor: isActive
                      ? isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)'
                      : 'transparent',
                    '&:hover': {
                      bgcolor: isActive
                        ? undefined
                        : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                    },
                    transition: 'all 0.15s',
                  }}
                >
                  {/* Avatar + online dot */}
                  <Box sx={{ position: 'relative', flexShrink: 0 }}>
                    <Avatar
                      src={other.avatar}
                      sx={{ width: 42, height: 42, fontSize: '0.9rem', fontWeight: 700, bgcolor: '#6366f1' }}
                    >
                      {other.name?.[0]}
                    </Avatar>
                    <Box sx={{
                      position: 'absolute', bottom: 0, right: 0,
                      width: 11, height: 11, borderRadius: '50%',
                      bgcolor: isOnlineUser ? '#22c55e' : (isDark ? '#374151' : '#d1d5db'),
                      border: `2px solid ${sideBg}`,
                    }} />
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.25 }}>
                      <Typography sx={{
                        fontWeight: isUnread ? 800 : 600, fontSize: '0.875rem',
                        color: isDark ? 'white' : '#0f172a',
                      }} noWrap>
                        {other.name}
                      </Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', flexShrink: 0, ml: 1 }}>
                        {msg.createdAt ? format(new Date(msg.createdAt), 'h:mm a') : ''}
                      </Typography>
                    </Box>
                    <Typography sx={{
                      fontSize: '0.78rem', color: isUnread ? (isDark ? 'rgba(255,255,255,0.7)' : '#374151') : 'text.secondary',
                      fontWeight: isUnread ? 600 : 400,
                    }} noWrap>
                      {msg.sender?._id === user?._id ? 'You: ' : ''}{msg.content?.slice(0, 35)}
                    </Typography>
                  </Box>

                  {isUnread && (
                    <Box sx={{
                      width: 8, height: 8, borderRadius: '50%',
                      bgcolor: '#6366f1', flexShrink: 0,
                    }} />
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* ── Chat Area ── */}
        <Box sx={{
          flex: 1,
          display: (!activeUser && isMobile) ? 'none' : 'flex',
          flexDirection: 'column',
          bgcolor: chatBg,
        }}>
          {activeUser ? (
            <>
              {/* Chat Header */}
              <Box sx={{
                px: 3, py: 1.75,
                display: 'flex', alignItems: 'center', gap: 2,
                borderBottom: '1px solid', borderColor: borderC,
                bgcolor: sideBg,
                boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.2)' : '0 1px 4px rgba(0,0,0,0.04)',
              }}>
                {isMobile && (
                  <IconButton onClick={() => setActiveUser(null)} size="small">
                    <ArrowLeft size={18} />
                  </IconButton>
                )}

                {/* Avatar */}
                <Box sx={{ position: 'relative' }}>
                  <Avatar
                    src={activeUser.avatar}
                    sx={{ width: 40, height: 40, bgcolor: '#6366f1', fontSize: '0.9rem', fontWeight: 700 }}
                  >
                    {activeUser.name?.[0]}
                  </Avatar>
                  <Box sx={{
                    position: 'absolute', bottom: 0, right: 0,
                    width: 11, height: 11, borderRadius: '50%',
                    bgcolor: isOnline ? '#22c55e' : (isDark ? '#374151' : '#d1d5db'),
                    border: `2px solid ${sideBg}`,
                  }} />
                </Box>

                {/* Name + status */}
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: isDark ? 'white' : '#0f172a', lineHeight: 1.2 }}>
                    {activeUser.name}
                  </Typography>
                  <Typography sx={{ fontSize: '0.72rem', color: isOnline ? '#22c55e' : 'text.disabled' }}>
                    {isOnline ? 'Active now' : 'Offline'}
                  </Typography>
                </Box>

                {/* Actions */}
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title="Voice Call">
                    <IconButton size="small" sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', '&:hover': { color: '#6366f1', bgcolor: 'rgba(99,102,241,0.08)' }, borderRadius: '8px' }}>
                      <Phone size={17} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Video Call">
                    <IconButton size="small" sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', '&:hover': { color: '#6366f1', bgcolor: 'rgba(99,102,241,0.08)' }, borderRadius: '8px' }}>
                      <Video size={17} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Profile Info">
                    <IconButton size="small" sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', '&:hover': { color: '#6366f1', bgcolor: 'rgba(99,102,241,0.08)' }, borderRadius: '8px' }}>
                      <Info size={17} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* Messages feed */}
              <Box sx={{
                flex: 1, overflowY: 'auto',
                px: { xs: 2, md: 3 }, py: 2,
                display: 'flex', flexDirection: 'column', gap: 0,
                '&::-webkit-scrollbar': { width: 4 },
                '&::-webkit-scrollbar-thumb': { bgcolor: borderC, borderRadius: 2 },
              }}>
                <AnimatePresence initial={false}>
                  {grouped.map((item, idx) => {
                    if (item.type === 'date') {
                      return (
                        <Box key={`date-${idx}`} sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 2.5 }}>
                          <Box sx={{ flex: 1, height: '1px', bgcolor: borderC }} />
                          <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.disabled', px: 1 }}>
                            {item.label}
                          </Typography>
                          <Box sx={{ flex: 1, height: '1px', bgcolor: borderC }} />
                        </Box>
                      );
                    }

                    const msg = item;
                    const isMe = (msg.sender?._id || msg.sender) === user?._id;
                    const nextMsg = grouped[idx + 1];
                    const isLastInGroup = !nextMsg || nextMsg.type === 'date' ||
                      (nextMsg.sender?._id || nextMsg.sender) !== (msg.sender?._id || msg.sender);

                    return (
                      <Box
                        key={msg._id}
                        component={motion.div}
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        sx={{
                          display: 'flex',
                          justifyContent: isMe ? 'flex-end' : 'flex-start',
                          mb: isLastInGroup ? 2 : 0.4,
                          alignItems: 'flex-end', gap: 1,
                        }}
                      >
                        {/* Their avatar */}
                        {!isMe && (
                          <Avatar
                            src={activeUser.avatar}
                            sx={{
                              width: 28, height: 28, fontSize: '0.65rem', fontWeight: 700,
                              bgcolor: '#6366f1', flexShrink: 0,
                              opacity: isLastInGroup ? 1 : 0,
                            }}
                          >
                            {activeUser.name?.[0]}
                          </Avatar>
                        )}

                        <Box sx={{ maxWidth: '70%' }}>
                          {/* Bubble */}
                          <Box
                            sx={{
                              px: 2, py: 1.25,
                              borderRadius: isMe
                                ? isLastInGroup ? '18px 18px 4px 18px' : '18px 4px 4px 18px'
                                : isLastInGroup ? '18px 18px 18px 4px' : '4px 18px 18px 4px',
                              bgcolor: isMe ? myBubble : theirBubble,
                              color: isMe ? 'white' : (isDark ? 'rgba(255,255,255,0.9)' : '#0f172a'),
                              boxShadow: isDark
                                ? isMe ? '0 1px 4px rgba(99,102,241,0.3)' : '0 1px 4px rgba(0,0,0,0.2)'
                                : isMe ? '0 1px 4px rgba(99,102,241,0.2)' : '0 1px 4px rgba(0,0,0,0.07)',
                              border: isMe ? 'none' : `1px solid ${borderC}`,
                              cursor: 'default',
                              '& p': { m: 0, wordBreak: 'break-word', fontSize: '0.88rem', lineHeight: 1.55 },
                              '& blockquote': { m: 0, mb: 0.75, pl: 1.5, borderLeft: `2px solid ${isMe ? 'rgba(255,255,255,0.4)' : 'rgba(99,102,241,0.4)'}`, opacity: 0.75, fontSize: '0.78rem' },
                            }}
                            onDoubleClick={() => { setReplyTo(msg); inputRef.current?.focus(); }}
                          >
                            <ReactMarkdown>{msg.content || ''}</ReactMarkdown>
                          </Box>

                          {/* Timestamp + read receipt */}
                          {isLastInGroup && (
                            <Box sx={{
                              display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.4,
                              justifyContent: isMe ? 'flex-end' : 'flex-start',
                            }}>
                              <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled' }}>
                                {formatMsgDate(msg.createdAt)}
                              </Typography>
                              {isMe && (
                                msg.read
                                  ? <CheckCheck size={12} color="#6366f1" />
                                  : <Check size={12} color={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'} />
                              )}
                            </Box>
                          )}
                        </Box>
                      </Box>
                    );
                  })}
                </AnimatePresence>

                {/* Typing indicator */}
                <AnimatePresence>
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, mb: 2 }}>
                        <Avatar src={activeUser.avatar} sx={{ width: 28, height: 28, bgcolor: '#6366f1', fontSize: '0.65rem' }}>
                          {activeUser.name?.[0]}
                        </Avatar>
                        <Box sx={{
                          px: 2, py: 1.25, borderRadius: '18px 18px 18px 4px',
                          bgcolor: theirBubble, border: `1px solid ${borderC}`,
                          display: 'flex', gap: 0.5, alignItems: 'center',
                        }}>
                          {[0, 1, 2].map(i => (
                            <motion.div
                              key={i}
                              animate={{ y: [0, -4, 0] }}
                              transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                            >
                              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'text.disabled' }} />
                            </motion.div>
                          ))}
                        </Box>
                      </Box>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
              </Box>

              {/* Reply banner */}
              <AnimatePresence>
                {replyTo && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                    <Box sx={{
                      px: 3, py: 1.25,
                      borderTop: '1px solid', borderColor: borderC,
                      bgcolor: isDark ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.04)',
                      display: 'flex', gap: 1.5, alignItems: 'center',
                    }}>
                      <Reply size={14} color="#6366f1" />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#6366f1', mb: 0.25 }}>
                          Replying to {replyTo.sender?._id === user?._id ? 'yourself' : activeUser.name}
                        </Typography>
                        <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }} noWrap>
                          {replyTo.content}
                        </Typography>
                      </Box>
                      <IconButton size="small" onClick={() => setReplyTo(null)}>
                        <X size={14} />
                      </IconButton>
                    </Box>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input Bar */}
              <Box sx={{
                px: 2.5, py: 2,
                borderTop: '1px solid', borderColor: borderC,
                bgcolor: sideBg,
              }}>
                <Box
                  component="form"
                  onSubmit={handleSend}
                  sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end' }}
                >
                  <Tooltip title="Attach file">
                    <IconButton
                      onClick={() => fileInputRef.current?.click()}
                      sx={{
                        color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                        '&:hover': { color: '#6366f1', bgcolor: 'rgba(99,102,241,0.08)' },
                        borderRadius: '10px', p: 1,
                      }}
                    >
                      <Paperclip size={18} />
                    </IconButton>
                  </Tooltip>
                  <input type="file" hidden ref={fileInputRef} onChange={handleFileUpload} />

                  <TextField
                    inputRef={inputRef}
                    fullWidth
                    multiline
                    maxRows={5}
                    placeholder="Message..."
                    value={newMsg}
                    onChange={handleTypingEvent}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '14px',
                        fontSize: '0.88rem',
                        bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                        '& fieldset': { borderColor: 'transparent' },
                        '&:hover fieldset': { borderColor: borderC },
                        '&.Mui-focused fieldset': { borderColor: '#6366f1', borderWidth: 1.5 },
                      },
                      '& textarea': { lineHeight: 1.5 },
                    }}
                  />

                  <IconButton
                    type="submit"
                    disabled={sending || !newMsg.trim()}
                    sx={{
                      width: 40, height: 40,
                      bgcolor: newMsg.trim() ? '#6366f1' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
                      color: newMsg.trim() ? 'white' : 'text.disabled',
                      borderRadius: '12px', flexShrink: 0,
                      '&:hover': { bgcolor: newMsg.trim() ? '#4f46e5' : undefined },
                      '&.Mui-disabled': { bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', color: 'text.disabled' },
                      transition: 'all 0.15s',
                    }}
                  >
                    <Send size={16} />
                  </IconButton>
                </Box>
                <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled', mt: 0.75, textAlign: 'center' }}>
                  Press Enter to send · Shift+Enter for new line · Double-click to reply
                </Typography>
              </Box>
            </>
          ) : (
            <Box sx={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', p: 4,
            }}>
              <Box sx={{
                width: 72, height: 72, borderRadius: '20px',
                bgcolor: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2,
              }}>
                <MessageSquare size={32} color="#6366f1" opacity={0.6} />
              </Box>
              <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)', mb: 0.5 }}>
                Your messages
              </Typography>
              <Typography sx={{ fontSize: '0.82rem', color: 'text.disabled', textAlign: 'center' }}>
                Select a conversation from the sidebar to start messaging
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
