import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  Send, MessageSquare, ArrowLeft, Search, CheckCheck, Check,
  Paperclip, Reply, X, Phone, Video, Info, Plus, Mic,
  Handshake, Circle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { format, isToday, isYesterday } from 'date-fns';
import io from 'socket.io-client';
import { Avatar, Tooltip, useMediaQuery, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import MessagesCallOverlay from '../components/MessagesCallOverlay';
import { BackgroundPaths } from '../components/ui/BackgroundPaths';

/* ── Helpers ─────────────────────────────────────────────── */
function fmtDate(date) {
  const d = new Date(date);
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return `Yesterday`;
  return format(d, 'MMM d');
}
function fmtFull(date) {
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

/* ── Typing dots ──────────────────────────────────────────── */
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '4px 2px' }}>
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.18, ease: 'easeInOut' }}
          style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(148,163,184,0.8)' }}
        />
      ))}
    </div>
  );
}

/* ── Unread pulse dot ─────────────────────────────────────── */
function UnreadDot() {
  return (
    <motion.div
      animate={{ scale: [1, 1.25, 1], opacity: [0.8, 1, 0.8] }}
      transition={{ repeat: Infinity, duration: 1.8 }}
      style={{ width: 9, height: 9, borderRadius: '50%', background: '#6366f1', flexShrink: 0, boxShadow: '0 0 8px rgba(99,102,241,0.7)' }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════ */
export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isMobile = useMediaQuery('(max-width:768px)');

  /* State */
  const [inbox, setInbox] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [contractModal, setContractModal] = useState(false);
  const [contractDate, setContractDate] = useState('');
  const [contractStakes, setContractStakes] = useState(500);

  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);

  /* ── Socket setup ── */
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    socketRef.current = io(wsUrl, { withCredentials: true });
    if (user) socketRef.current.emit('setup', user._id);
    socketRef.current.on('user_online', id => setOnlineUsers(p => new Set([...p, id])));
    socketRef.current.on('user_offline', id => setOnlineUsers(p => { const s = new Set(p); s.delete(id); return s; }));
    return () => socketRef.current?.disconnect();
  }, [user]);

  /* ── Deep-link open from SOS / navigate state ── */
  useEffect(() => {
    const openId = location.state?.openUserId || searchParams.get('with');
    if (openId) api.get(`/users/${openId}`).then(r => setActiveUser(r.data)).catch(() => {});
  }, [location.state, searchParams]);

  /* ── Message socket events ── */
  useEffect(() => {
    if (!socketRef.current) return;
    const handleReceive = (msg) => {
      if (activeUser && (activeUser._id === msg.sender?._id || activeUser._id === msg.sender)) {
        setMessages(p => [...p, msg]);
        loadInboxQuietly();
      } else {
        const senderName = msg.sender?.name || 'Someone';
        toast(`${senderName}: ${msg.content?.slice(0, 40)}`, { duration: 3000, icon: '💬' });
        loadInboxQuietly();
      }
    };
    const handleTyping = (d) => { if (activeUser?._id === d.senderId) setIsTyping(true); };
    const handleStop   = (d) => { if (activeUser?._id === d.senderId) setIsTyping(false); };
    socketRef.current.on('message_received', handleReceive);
    socketRef.current.on('typing', handleTyping);
    socketRef.current.on('stop_typing', handleStop);
    return () => {
      socketRef.current?.off('message_received', handleReceive);
      socketRef.current?.off('typing', handleTyping);
      socketRef.current?.off('stop_typing', handleStop);
    };
  }, [activeUser]);

  useEffect(() => { fetchInboxData(); }, []);
  useEffect(() => {
    if (activeUser) { setIsTyping(false); setReplyTo(null); fetchConversation(activeUser._id); }
  }, [activeUser]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const loadInboxQuietly = useCallback(async () => {
    try { const r = await api.get('/messages/inbox'); setInbox(r.data); } catch {}
  }, []);
  const fetchInboxData = async () => {
    try { const r = await api.get('/messages/inbox'); setInbox(r.data); } catch { toast.error('Could not load messages'); }
  };
  const fetchConversation = async (id) => {
    try { const r = await api.get(`/messages/${id}`); setMessages(r.data); } catch {}
  };

  const handleTypingEvent = (e) => {
    setNewMsg(e.target.value);
    if (socketRef.current && activeUser) {
      socketRef.current.emit('typing', { senderId: user._id, receiver: activeUser._id });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit('stop_typing', { senderId: user._id, receiver: activeUser._id });
      }, 2000);
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!newMsg.trim() || !activeUser || sending) return;
    setSending(true);
    socketRef.current?.emit('stop_typing', { senderId: user._id, receiver: activeUser._id });
    const content = replyTo
      ? `> *↩ ${replyTo.content.slice(0, 60)}${replyTo.content.length > 60 ? '…' : ''}*\n\n${newMsg.trim()}`
      : newMsg.trim();
    setNewMsg('');
    setReplyTo(null);
    try {
      const { data } = await api.post('/messages', { receiverId: activeUser._id, content });
      setMessages(p => [...p, data]);
      socketRef.current?.emit('new_message', data);
      loadInboxQuietly();
    } catch {
      toast.error('Failed to send message');
    } finally { setSending(false); }
  };

  const handleProposeContract = async () => {
    if (!contractDate) return toast.error('Please select a time');
    try {
      await api.post('/contracts/propose', { targetUserId: activeUser._id, scheduledTime: contractDate, stakes: Number(contractStakes) });
      toast.success('Contract proposed!');
      setContractModal(false);
      const msg = `> *🤝 Accountability Contract Proposed*\n\nCommit to study at ${fmtFull(contractDate)}. Stake: **${contractStakes} XP**.`;
      await api.post('/messages', { receiverId: activeUser._id, content: msg });
      loadInboxQuietly(); fetchConversation(activeUser._id);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to propose contract'); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    const tid = toast.loading('Uploading…');
    try {
      const { data } = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const md = file.type.startsWith('image/') ? `![img](${data.url})` : `[${file.name}](${data.url})`;
      setNewMsg(p => p ? `${p}\n${md}` : md);
      toast.success('File attached', { id: tid });
    } catch { toast.error('Upload failed', { id: tid }); } finally { e.target.value = null; }
  };

  const getOtherUser = (msg) => {
    if (!msg.sender || !msg.receiver) return null;
    return msg.sender._id === user?._id ? msg.receiver : msg.sender;
  };

  const triggerCall = (withVideo) => {
    window.dispatchEvent(new CustomEvent('initiate_webrtc_call', { detail: { withVideo, targetUser: activeUser } }));
  };

  const filteredInbox = inbox.filter(msg => {
    const other = getOtherUser(msg);
    if (!other || other.isAdmin) return false;
    if (searchFilter && !other.name?.toLowerCase().includes(searchFilter.toLowerCase())) return false;
    return true;
  });

  const onlineInbox = filteredInbox.filter(msg => {
    const other = getOtherUser(msg);
    return other && onlineUsers.has(other._id);
  });

  const grouped = groupByDate(messages);
  const isOnline = activeUser && onlineUsers.has(activeUser._id);

  /* ── CSS vars ── */
  const GLS = 'rgba(15,23,42,0.82)';   // glassmorphic sidebar/main bg
  const BDR = 'rgba(255,255,255,0.07)'; // border colour

  /* ── Responsive: on mobile, show either sidebar or chat ── */
  const showSidebar = !isMobile || !activeUser;
  const showChat    = !isMobile || !!activeUser;

  return (
    <>
      {/* Global font */}
      <style>{`
        .msgs-root * { font-family: 'Plus Jakarta Sans', 'Inter', sans-serif !important; }
        .msgs-root ::-webkit-scrollbar { width: 3px; height: 3px; }
        .msgs-root ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
        .msgs-root ::-webkit-scrollbar-track { background: transparent; }
        @keyframes onlinePulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
          60%      { box-shadow: 0 0 0 5px rgba(34,197,94,0); }
        }
        @keyframes storiesRing {
          0%,100% { box-shadow: 0 0 0 2px rgba(99,102,241,0.6); }
          50%      { box-shadow: 0 0 0 3px rgba(99,102,241,1); }
        }
      `}</style>

      {/* WebRTC overlay */}
      <MessagesCallOverlay socket={socketRef.current} user={user} activeUser={activeUser} />

      {/* Contract modal */}
      <Dialog open={contractModal} onClose={() => setContractModal(false)}
        PaperProps={{ style: { background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, color: 'white', minWidth: 340 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontFamily: 'Plus Jakarta Sans' }}>🤝 Propose Study Contract</DialogTitle>
        <DialogContent>
          <p style={{ fontSize: '0.84rem', color: 'rgba(255,255,255,0.55)', marginBottom: 16 }}>
            Commit to a session. No-shows lose staked XP.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <TextField fullWidth type="datetime-local" size="small" value={contractDate} onChange={e => setContractDate(e.target.value)}
              InputLabelProps={{ shrink: true }} sx={{ input: { color: 'white' }, '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' } }} />
            <TextField fullWidth type="number" label="XP Stakes" size="small" value={contractStakes} onChange={e => setContractStakes(e.target.value)}
              sx={{ input: { color: 'white' }, label: { color: 'rgba(255,255,255,0.5)' }, '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' } }} />
          </div>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setContractModal(false)} sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>Cancel</Button>
          <Button onClick={handleProposeContract} variant="contained" sx={{ bgcolor: '#6366f1', fontWeight: 800, borderRadius: '10px' }}>Propose</Button>
        </DialogActions>
      </Dialog>

      {/* ══ ROOT ══ */}
      <div className="msgs-root" style={{
        height: 'calc(100vh - 72px)', display: 'flex', position: 'relative',
        overflow: 'hidden', background: 'transparent',
      }}>
        {/* Animated background */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <BackgroundPaths title="" />
        </div>

        {/* ══ Two-pane shell ══ */}
        <div style={{
          position: 'relative', zIndex: 1, flex: 1,
          display: 'flex', margin: isMobile ? 0 : '12px',
          borderRadius: isMobile ? 0 : 20,
          overflow: 'hidden',
          border: `1px solid ${BDR}`,
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          background: GLS,
          backdropFilter: 'blur(32px)',
        }}>

          {/* ══ LEFT: Inbox Sidebar ══ */}
          <AnimatePresence initial={false}>
            {showSidebar && (
              <motion.div
                key="sidebar"
                initial={isMobile ? { x: -300, opacity: 0 } : false}
                animate={{ x: 0, opacity: 1 }}
                exit={isMobile ? { x: -300, opacity: 0 } : {}}
                transition={{ type: 'spring', stiffness: 380, damping: 36 }}
                style={{
                  width: isMobile ? '100%' : '35%',
                  minWidth: isMobile ? undefined : 300,
                  maxWidth: isMobile ? undefined : 380,
                  flexShrink: 0,
                  display: 'flex', flexDirection: 'column',
                  borderRight: isMobile ? 'none' : `1px solid ${BDR}`,
                  background: 'rgba(2,6,23,0.5)',
                }}
              >
                {/* Sidebar header */}
                <div style={{ padding: '20px 20px 14px', borderBottom: `1px solid ${BDR}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <span style={{ fontWeight: 900, fontSize: '1.15rem', color: 'white', letterSpacing: -0.5 }}>
                      Messages
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', fontWeight: 700, background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: 8 }}>
                      {filteredInbox.length} chats
                    </span>
                  </div>
                  {/* Search */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'rgba(255,255,255,0.05)', borderRadius: 12,
                    border: `1px solid ${BDR}`, padding: '8px 12px',
                  }}>
                    <Search size={14} color="rgba(255,255,255,0.35)" />
                    <input
                      value={searchFilter} onChange={e => setSearchFilter(e.target.value)}
                      placeholder="Search conversations..."
                      style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'white', fontSize: '0.84rem' }}
                    />
                    {searchFilter && (
                      <button onClick={() => setSearchFilter('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex' }}>
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* ── Active Now (Instagram Stories row) ── */}
                {onlineInbox.length > 0 && (
                  <div style={{ padding: '12px 20px 10px', borderBottom: `1px solid ${BDR}` }}>
                    <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>
                      Active Now
                    </p>
                    <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
                      {onlineInbox.map(msg => {
                        const other = getOtherUser(msg);
                        if (!other) return null;
                        return (
                          <button key={other._id} onClick={() => setActiveUser(other)}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                            <div style={{ position: 'relative' }}>
                              <div style={{
                                width: 52, height: 52, borderRadius: '50%',
                                animation: 'storiesRing 2s ease-in-out infinite',
                                padding: 2,
                                background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
                              }}>
                                <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '2px solid #0a0f1c', overflow: 'hidden' }}>
                                  {other.avatar
                                    ? <img src={other.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <div style={{ width: '100%', height: '100%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '1.1rem' }}>{other.name?.[0]}</div>
                                  }
                                </div>
                              </div>
                              {/* Green dot */}
                              <div style={{
                                position: 'absolute', bottom: 1, right: 1,
                                width: 12, height: 12, borderRadius: '50%',
                                background: '#22c55e', border: '2px solid #0a0f1c',
                                animation: 'onlinePulse 2s infinite',
                              }} />
                            </div>
                            <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.65)', fontWeight: 600, maxWidth: 52, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {other.name?.split(' ')[0]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Conversation list ── */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {filteredInbox.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 24px', color: 'rgba(255,255,255,0.25)' }}>
                      <MessageSquare size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                      <p style={{ fontWeight: 700, fontSize: '0.88rem' }}>No conversations yet</p>
                      <p style={{ fontSize: '0.78rem', marginTop: 4 }}>Connect with study buddies to start messaging</p>
                    </div>
                  ) : filteredInbox.map(msg => {
                    const other = getOtherUser(msg);
                    if (!other) return null;
                    const isActive = activeUser?._id === other._id;
                    const isUnread = !msg.read && (msg.receiver?._id || msg.receiver) === user?._id;
                    const isOnlineU = onlineUsers.has(other._id);

                    return (
                      <motion.button
                        key={msg._id}
                        onClick={() => setActiveUser(other)}
                        whileHover={{ x: 3, backgroundColor: 'rgba(255,255,255,0.04)' }}
                        transition={{ duration: 0.12 }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                          padding: '11px 20px', background: isActive ? 'rgba(99,102,241,0.1)' : 'transparent',
                          border: 'none', cursor: 'pointer', textAlign: 'left',
                          borderLeft: isActive ? '3px solid #6366f1' : '3px solid transparent',
                          transition: 'all 0.15s',
                        }}
                      >
                        {/* Avatar block */}
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <div style={{ width: 46, height: 46, borderRadius: '50%', overflow: 'hidden', border: `1.5px solid ${isActive ? '#6366f1' : 'rgba(255,255,255,0.1)'}` }}>
                            {other.avatar
                              ? <img src={other.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <div style={{ width: '100%', height: '100%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '1rem' }}>{other.name?.[0]}</div>
                            }
                          </div>
                          <div style={{
                            position: 'absolute', bottom: 1, right: 1,
                            width: 11, height: 11, borderRadius: '50%',
                            background: isOnlineU ? '#22c55e' : '#374151',
                            border: '2px solid #0a0f1c',
                            ...(isOnlineU ? { animation: 'onlinePulse 2.5s infinite' } : {}),
                          }} />
                        </div>

                        {/* Text */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                            <span style={{ fontWeight: isUnread ? 800 : 600, fontSize: '0.875rem', color: isUnread ? 'white' : 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
                              {other.name}
                            </span>
                            <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', flexShrink: 0, marginLeft: 4 }}>
                              {msg.createdAt ? fmtDate(msg.createdAt) : ''}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.78rem', color: isUnread ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.35)', fontWeight: isUnread ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 6 }}>
                              {msg.sender?._id === user?._id ? 'You: ' : ''}{msg.content?.slice(0, 32)}
                            </span>
                            {isUnread && <UnreadDot />}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ══ RIGHT: Chat Panel ══ */}
          <AnimatePresence initial={false}>
            {showChat && (
              <motion.div
                key="chatpanel"
                initial={isMobile && activeUser ? { x: 300, opacity: 0 } : false}
                animate={{ x: 0, opacity: 1 }}
                exit={isMobile ? { x: 300, opacity: 0 } : {}}
                transition={{ type: 'spring', stiffness: 380, damping: 36 }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'rgba(2,6,23,0.3)' }}
              >
                {activeUser ? (
                  <>
                    {/* ── Chat Header (sticky) ── */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '14px 20px',
                      borderBottom: `1px solid ${BDR}`,
                      background: 'rgba(10,15,28,0.7)',
                      backdropFilter: 'blur(24px)',
                      flexShrink: 0,
                    }}>
                      {/* Back button mobile */}
                      {isMobile && (
                        <button onClick={() => setActiveUser(null)}
                          style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${BDR}`, borderRadius: 10, padding: '6px 10px', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                          <ArrowLeft size={16} />
                        </button>
                      )}

                      {/* Avatar + info */}
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{ width: 42, height: 42, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${isOnline ? '#22c55e' : 'rgba(255,255,255,0.1)'}`, boxShadow: isOnline ? '0 0 12px rgba(34,197,94,0.35)' : 'none' }}>
                          {activeUser.avatar
                            ? <img src={activeUser.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <div style={{ width: '100%', height: '100%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '1rem' }}>{activeUser.name?.[0]}</div>
                          }
                        </div>
                        {isOnline && (
                          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, borderRadius: '50%', background: '#22c55e', border: '2px solid #0a0f1c', animation: 'onlinePulse 2s infinite' }} />
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <button onClick={() => navigate(`/profile/${activeUser._id}`)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'block', textAlign: 'left' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'white', display: 'block' }}>{activeUser.name}</span>
                        </button>
                        <span style={{ fontSize: '0.72rem', color: isOnline ? '#22c55e' : 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
                          {isOnline ? '● Active now' : '○ Offline'}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        {[
                          { icon: Handshake, label: 'Propose Contract', action: () => setContractModal(true), color: '#a78bfa' },
                          { icon: Phone, label: 'Voice Call', action: () => triggerCall(false), color: '#22c55e' },
                          { icon: Video, label: 'Video Call', action: () => triggerCall(true), color: '#6366f1' },
                          { icon: Info, label: 'Profile Info', action: () => navigate(`/profile/${activeUser._id}`), color: '#38bdf8' },
                        ].map(({ icon: Icon, label, action, color }) => (
                          <Tooltip key={label} title={label} arrow placement="bottom">
                            <button onClick={action}
                              style={{
                                background: 'rgba(255,255,255,0.05)', border: `1px solid rgba(255,255,255,0.08)`,
                                borderRadius: 10, padding: '7px 9px', cursor: 'pointer',
                                color: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center',
                                transition: 'all 0.15s',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.color = color; e.currentTarget.style.background = color + '1A'; e.currentTarget.style.borderColor = color + '44'; }}
                              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}>
                              <Icon size={17} />
                            </button>
                          </Tooltip>
                        ))}
                      </div>
                    </div>

                    {/* ── Message feed ── */}
                    <div style={{
                      flex: 1, overflowY: 'auto',
                      padding: '20px 20px 8px',
                      display: 'flex', flexDirection: 'column', gap: 0,
                    }}>
                      <AnimatePresence initial={false}>
                        {grouped.map((item, idx) => {
                          if (item.type === 'date') return (
                            <div key={`d-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
                              <div style={{ flex: 1, height: 1, background: BDR }} />
                              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', padding: '0 4px' }}>{item.label}</span>
                              <div style={{ flex: 1, height: 1, background: BDR }} />
                            </div>
                          );

                          const msg = item;
                          const isMe = (msg.sender?._id || msg.sender) === user?._id;
                          const nextMsg = grouped[idx + 1];
                          const isLast = !nextMsg || nextMsg.type === 'date' ||
                            (nextMsg.sender?._id || nextMsg.sender) !== (msg.sender?._id || msg.sender);

                          return (
                            <motion.div
                              key={msg._id}
                              initial={{ opacity: 0, y: 12, scale: 0.97 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                              style={{
                                display: 'flex',
                                justifyContent: isMe ? 'flex-end' : 'flex-start',
                                marginBottom: isLast ? 14 : 3,
                                alignItems: 'flex-end',
                                gap: 8,
                              }}
                              onDoubleClick={() => { setReplyTo(msg); inputRef.current?.focus(); }}
                            >
                              {/* Their avatar */}
                              {!isMe && (
                                <div style={{ width: 30, height: 30, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '1.5px solid rgba(255,255,255,0.1)', opacity: isLast ? 1 : 0 }}>
                                  {activeUser.avatar
                                    ? <img src={activeUser.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <div style={{ width: '100%', height: '100%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '0.7rem' }}>{activeUser.name?.[0]}</div>
                                  }
                                </div>
                              )}

                              <div style={{ maxWidth: '75%', minWidth: 0 }}>
                                {/* Bubble */}
                                <div style={{
                                  padding: '10px 14px',
                                  borderRadius: isMe
                                    ? (isLast ? '18px 18px 4px 18px' : '18px 4px 4px 18px')
                                    : (isLast ? '18px 18px 18px 4px' : '4px 18px 18px 4px'),
                                  background: isMe
                                    ? 'linear-gradient(135deg, #4f46e5, #6366f1)'
                                    : 'rgba(30,41,59,0.85)',
                                  backdropFilter: 'blur(12px)',
                                  color: isMe ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.88)',
                                  border: isMe ? '1px solid rgba(255,255,255,0.12)' : `1px solid ${BDR}`,
                                  boxShadow: isMe ? '0 4px 16px rgba(99,102,241,0.3)' : '0 2px 12px rgba(0,0,0,0.25)',
                                  fontSize: '0.875rem',
                                  lineHeight: 1.55,
                                  wordBreak: 'break-word',
                                  cursor: 'default',
                                }}>
                                  <div style={{ margin: 0 }}>
                                    <ReactMarkdown
                                      components={{
                                        p: ({children}) => <p style={{ margin: 0 }}>{children}</p>,
                                        blockquote: ({children}) => <blockquote style={{ margin: '0 0 6px', paddingLeft: 10, borderLeft: `2px solid ${isMe ? 'rgba(255,255,255,0.35)' : 'rgba(99,102,241,0.4)'}`, opacity: 0.75, fontSize: '0.8rem' }}>{children}</blockquote>,
                                        a: ({href, children}) => <a href={href} target="_blank" rel="noreferrer" style={{ color: isMe ? '#c7d2fe' : '#818cf8' }}>{children}</a>,
                                        img: ({src, alt}) => <img src={src} alt={alt} style={{ maxWidth: '100%', borderRadius: 8, marginTop: 4, display: 'block' }} />,
                                      }}
                                    >{msg.content || ''}</ReactMarkdown>
                                  </div>
                                </div>
                                {/* Timestamp + read receipt */}
                                {isLast && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                                    <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.28)' }}>{fmtFull(msg.createdAt)}</span>
                                    {isMe && (msg.read
                                      ? <CheckCheck size={11} color="#6366f1" />
                                      : <Check size={11} color="rgba(255,255,255,0.25)" />
                                    )}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>

                      {/* Typing indicator */}
                      <AnimatePresence>
                        {isTyping && (
                          <motion.div
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 14 }}
                          >
                            <div style={{ width: 30, height: 30, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '1.5px solid rgba(255,255,255,0.1)' }}>
                              {activeUser.avatar
                                ? <img src={activeUser.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <div style={{ width: '100%', height: '100%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '0.7rem' }}>{activeUser.name?.[0]}</div>
                              }
                            </div>
                            <div style={{ padding: '10px 14px', borderRadius: '18px 18px 18px 4px', background: 'rgba(30,41,59,0.85)', border: `1px solid ${BDR}` }}>
                              <TypingDots />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div ref={messagesEndRef} />
                    </div>

                    {/* ── Reply banner ── */}
                    <AnimatePresence>
                      {replyTo && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          style={{ overflow: 'hidden', flexShrink: 0 }}
                        >
                          <div style={{ padding: '10px 20px', borderTop: `1px solid ${BDR}`, background: 'rgba(99,102,241,0.06)', display: 'flex', gap: 10, alignItems: 'center' }}>
                            <Reply size={14} color="#6366f1" />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#818cf8', marginBottom: 2 }}>
                                Replying to {replyTo.sender?._id === user?._id ? 'yourself' : activeUser.name}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {replyTo.content?.slice(0, 80)}
                              </div>
                            </div>
                            <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex' }}>
                              <X size={14} />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* ── Input pill ── */}
                    <div style={{ padding: '12px 16px 16px', flexShrink: 0, borderTop: `1px solid ${BDR}` }}>
                      <form onSubmit={handleSend}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          background: 'rgba(30,41,59,0.7)',
                          border: `1px solid ${newMsg.trim() ? 'rgba(99,102,241,0.4)' : BDR}`,
                          borderRadius: 999,
                          padding: '8px 8px 8px 16px',
                          backdropFilter: 'blur(12px)',
                          transition: 'border-color 0.2s, box-shadow 0.2s',
                          boxShadow: newMsg.trim() ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
                        }}>
                          {/* Plus / attachment */}
                          <label style={{ display: 'flex', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', flexShrink: 0, transition: 'color 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#6366f1'}
                            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>
                            <Plus size={19} />
                            <input type="file" hidden ref={fileInputRef} onChange={handleFileUpload} />
                          </label>

                          {/* Text input */}
                          <input
                            ref={inputRef}
                            value={newMsg}
                            onChange={handleTypingEvent}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            placeholder={`Message ${activeUser.name?.split(' ')[0]}...`}
                            style={{
                              flex: 1, background: 'transparent', border: 'none', outline: 'none',
                              color: 'white', fontSize: '0.88rem', lineHeight: 1.4,
                              fontFamily: 'Plus Jakarta Sans, Inter, sans-serif',
                            }}
                          />

                          {/* Mic icon (placeholder UX) */}
                          {!newMsg.trim() && (
                            <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex', flexShrink: 0, transition: 'color 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>
                              <Mic size={18} />
                            </button>
                          )}

                          {/* Send button */}
                          <motion.button
                            type="submit"
                            disabled={sending || !newMsg.trim()}
                            whileTap={{ scale: 0.9 }}
                            whileHover={newMsg.trim() ? { scale: 1.08 } : {}}
                            style={{
                              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                              background: newMsg.trim() ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'rgba(255,255,255,0.08)',
                              border: 'none', cursor: newMsg.trim() ? 'pointer' : 'default',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: newMsg.trim() ? 'white' : 'rgba(255,255,255,0.25)',
                              boxShadow: newMsg.trim() ? '0 4px 14px rgba(99,102,241,0.4)' : 'none',
                              transition: 'all 0.2s',
                            }}
                          >
                            <Send size={15} style={{ transform: 'translateX(1px)' }} />
                          </motion.button>
                        </div>

                        <p style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 6 }}>
                          Enter to send · Shift+Enter for newline · Double-click message to reply
                        </p>
                      </form>
                    </div>
                  </>
                ) : (
                  /* ── Empty state ── */
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
                    <motion.div
                      animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}
                    >
                      <MessageSquare size={36} color="#6366f1" style={{ opacity: 0.7 }} />
                    </motion.div>
                    <p style={{ fontWeight: 800, fontSize: '1.1rem', color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>Your Messages</p>
                    <p style={{ fontSize: '0.84rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center', maxWidth: 240 }}>
                      Select a conversation from the sidebar to start chatting
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
