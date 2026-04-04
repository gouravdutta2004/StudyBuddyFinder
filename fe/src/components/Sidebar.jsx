import React, { useState } from 'react';
import { Box, Tooltip, Avatar, useTheme } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  BookOpen, Search, Users, Trophy, Calendar, Globe,
  MessageCircle, CreditCard, MapPin, Shield, Gamepad2,
  Joystick, ChevronRight, Zap, Network, BrainCircuit, BarChart2, Radio
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { io } from 'socket.io-client';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';
import { LifeBuoy } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import logoImg from '../assets/logo.png';

/* ─── Nav items ─── */
const NAV = [
  { to: '/dashboard',    icon: BookOpen,       label: 'Dashboard',     color: '#6366f1' },
  { to: '/browse',       icon: Search,         label: 'Browse',        color: '#22d3ee' },
  { to: '/matches',      icon: Users,          label: 'Matches',       color: '#34d399' },
  { to: '/gamification', icon: Gamepad2,       label: 'Quests & XP',   color: '#a78bfa' },
  { to: '/arcade',       icon: Joystick,       label: 'Arcade',        color: '#f59e0b' },
  { to: '/leaderboard',  icon: Trophy,         label: 'Leaderboard',   color: '#eab308' },
  { to: '/sessions',     icon: Calendar,       label: 'Sessions',      color: '#38bdf8' },
  { to: '/live',         icon: Radio,          label: 'Live Rooms',    color: '#10b981' },
  { to: '/groups',       icon: Globe,          label: 'Squads',        color: '#059669' },
  { to: '/flashcards',   icon: BrainCircuit,   label: 'Flashcards',    color: '#8b5cf6' },
  { to: '/analytics',    icon: BarChart2,      label: 'Analytics',     color: '#06b6d4' },
  { to: '/map',          icon: MapPin,         label: 'Nearby Map',    color: '#f97316' },
  { to: '/messages',     icon: MessageCircle,  label: 'Messages',      color: '#818cf8' },
  { to: '/connections',  icon: Users,          label: 'Connections',   color: '#06b6d4' },
  { to: '/billing',      icon: CreditCard,     label: 'Billing',       color: '#f43f5e' },
];

const SECTION_BREAKS = [3, 6, 11];

/* ─── Rail item ─── */
function RailItem({ to, icon: Icon, label, color, isActive, expanded, unread, onClick, isDark }) {
  return (
    <Tooltip title={!expanded ? label : ''} placement="right" arrow>
      <Box
        component={RouterLink}
        to={to}
        onClick={onClick}
        sx={{
          display: 'flex', alignItems: 'center',
          gap: expanded ? 1.5 : 0,
          px: expanded ? 1.5 : 0,
          justifyContent: expanded ? 'flex-start' : 'center',
          width: '100%', height: 44,
          borderRadius: '12px', textDecoration: 'none',
          position: 'relative', overflow: 'hidden',
          bgcolor: isActive ? `${color}18` : 'transparent',
          transition: 'all 0.2s cubic-bezier(.4,0,.2,1)',
          '&:hover': {
            bgcolor: isActive ? `${color}22` : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
          },
        }}
      >
        {/* Active pill indicator */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 24, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{
                position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                width: 3, borderRadius: '0 3px 3px 0',
                background: color,
                boxShadow: `0 0 8px ${color}`,
              }}
            />
          )}
        </AnimatePresence>

        {/* Icon */}
        <Box sx={{ position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28 }}>
          <Icon
            size={19}
            strokeWidth={isActive ? 2.5 : 1.8}
            color={isActive ? color : (isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)')}
            style={{ transition: 'all 0.2s' }}
          />
          {/* Phase 3 FIX: Pulsing red dot instead of count badge */}
          {unread > 0 && (
            <Box
              component={motion.div}
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              sx={{
                position: 'absolute', top: -3, right: -3,
                width: 9, height: 9, borderRadius: '50%',
                bgcolor: '#ef4444',
                border: `2px solid ${isDark ? '#06090f' : '#f0f2f8'}`,
                boxShadow: '0 0 6px rgba(239,68,68,0.8)',
              }}
            />
          )}
        </Box>

        {/* Label — slides in when expanded */}
        <AnimatePresence>
          {expanded && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              style={{
                fontSize: '0.82rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? color : (isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)'),
                whiteSpace: 'nowrap',
                letterSpacing: 0.2,
              }}
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </Box>
    </Tooltip>
  );
}

/* ══════════════ RAIL SIDEBAR ══════════════ */
export default function Sidebar({ mobileOpen = false, setMobileOpen = () => {} }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const location = useLocation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [expanded, setExpanded] = useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);
  
  // SOS State
  const [sosModal, setSosModal] = useState(false);
  const [sosSubject, setSosSubject] = useState('');
  const [sosTopic, setSosTopic] = useState('');

  React.useEffect(() => {
    if (!socket || !user) return;
    const msgHandler = () => {
      if (!location.pathname.startsWith('/messages')) {
        setUnreadCount(p => p + 1);
      }
    };
    socket.on('message_received', msgHandler);
    return () => { socket.off('message_received', msgHandler); };
  }, [socket, user, location.pathname]);

  // Phase 3 FIX: Reset unread count when user visits /messages
  React.useEffect(() => {
    if (location.pathname.startsWith('/messages')) {
      setUnreadCount(0);
    }
  }, [location.pathname]);

  const handleTriggerSOS = () => {
    if (!sosSubject.trim()) return toast.error('Subject is required');
    if (!socket?.connected) return toast.error('Not connected to server. Please refresh.');
    socket.emit('trigger_sos', {
      subject: sosSubject.trim(),
      topic:   sosTopic.trim(),
      userId:  user._id,
      userName: user.name,
    });
    // Toast is handled by SocketContext (sos_broadcast_count event)
    setSosModal(false);
    setSosSubject('');
    setSosTopic('');
  };

  const railWidth = expanded ? 220 : 72;

  const RailContent = (
    <Box
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      sx={{
        height: '100%', display: 'flex', flexDirection: 'column',
        width: railWidth, transition: 'width 0.25s cubic-bezier(.4,0,.2,1)',
        overflow: 'hidden',
        bgcolor: isDark ? 'rgba(4,6,18,0.97)' : 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(24px)',
        border: '1px solid',
        borderColor: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(0,0,0,0.07)',
        boxShadow: isDark ? '0 4px 32px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.06)',
        borderRadius: { xs: 0, md: '20px' },
        willChange: 'width, background-color',
      }}
    >
      {/* ── Logo / Brand ── */}
      <Box sx={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: expanded ? 'flex-start' : 'center', px: expanded ? 2 : 0, flexShrink: 0, borderBottom: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)' }}>
        <Box sx={{ width: 36, height: 36, borderRadius: '10px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 16px rgba(99,102,241,0.4)', bgcolor: 'white' }}>
          <img src={logoImg} alt="StudyFriend" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </Box>
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.18 }}>
              <Box sx={{ ml: 1.5 }}>
                <Box sx={{ fontWeight: 900, fontSize: '1rem', color: isDark ? '#ffffff' : '#0f172a', lineHeight: 1, letterSpacing: -0.5, fontFamily: "'Inter',sans-serif" }}>StudyFriend</Box>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      {/* ── User Avatar ── */}
      <Box sx={{ py: 2, display: 'flex', alignItems: 'center', justifyContent: expanded ? 'flex-start' : 'center', px: expanded ? 2 : 'auto', gap: expanded ? 1.5 : 0, flexShrink: 0, transition: 'all 0.25s' }}>
        <Avatar
          src={user?.avatar}
          sx={{ width: 36, height: 36, flexShrink: 0, border: '2px solid', borderColor: '#6366f1', bgcolor: 'rgba(99,102,241,0.2)', fontSize: 14, fontWeight: 800, boxShadow: '0 0 10px rgba(99,102,241,0.3)', color: '#818cf8' }}
        >
          {user?.name?.[0]}
        </Avatar>
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.16 }} style={{ overflow: 'hidden' }}>
              <Box sx={{ fontSize: '0.78rem', fontWeight: 700, color: isDark ? 'white' : '#0f172a', whiteSpace: 'nowrap' }}>{user?.name?.split(' ')[0]}</Box>
              <Box sx={{ fontFamily: 'monospace', fontSize: '0.55rem', color: '#6366f1', letterSpacing: 1, fontWeight: 700 }}>LVL {user?.level || 1} · {user?.xp || 0} XP</Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      {/* ── Nav Items ── */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', px: 1, pb: 1,
        '&::-webkit-scrollbar': { display: 'none' },
      }}>
        {NAV.map(({ to, icon, label, color }, i) => {
          const isActive = location.pathname.startsWith(to);
          return (
            <React.Fragment key={to}>
              {SECTION_BREAKS.includes(i) && (
                <Box sx={{ my: 1, mx: expanded ? 1 : 'auto', height: '1px', width: expanded ? 'auto' : 28, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)', transition: 'all 0.25s' }} />
              )}
              <RailItem
                to={to} icon={icon} label={label} color={color}
                isActive={isActive} expanded={expanded} isDark={isDark}
                unread={to === '/messages' ? unreadCount : 0}
                onClick={() => setMobileOpen(false)}
              />
            </React.Fragment>
          );
        })}

        {/* Admin items */}
        {(user?.role === 'ORG_ADMIN' || user?.isAdmin) && (
          <>
            <Box sx={{ my: 1, mx: expanded ? 1 : 'auto', height: '1px', bgcolor: 'rgba(99,102,241,0.15)', transition: 'all 0.25s' }} />
            <RailItem to="/org-admin" icon={Shield} label="Org Admin" color="#ec4899" isActive={location.pathname.startsWith('/org-admin')} expanded={expanded} isDark={isDark} onClick={() => setMobileOpen(false)} />
          </>
        )}
        {user?.isAdmin && (
          <RailItem to="/admin" icon={Shield} label="Super Admin" color="#f43f5e" isActive={location.pathname.startsWith('/admin')} expanded={expanded} isDark={isDark} onClick={() => setMobileOpen(false)} />
        )}
      </Box>

      {/* ── SOS Panic Button ── */}
      <Box sx={{ p: 1, flexShrink: 0, mt: 'auto' }}>
        <Tooltip title={!expanded ? 'Trigger SOS' : ''} placement="right" arrow>
          <Box
            onClick={() => setSosModal(true)}
            sx={{
              display: 'flex', alignItems: 'center', gap: expanded ? 1.5 : 0,
              justifyContent: expanded ? 'flex-start' : 'center',
              px: expanded ? 1.5 : 0, height: 44, borderRadius: '12px',
              cursor: 'pointer', overflow: 'hidden',
              bgcolor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
              transition: 'all 0.25s',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              '&:hover': { bgcolor: 'rgba(239,68,68,0.25)', boxShadow: '0 0 16px rgba(239,68,68,0.4)' },
              '@keyframes pulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.6 } }
            }}
          >
            <LifeBuoy size={18} color="#ef4444" style={{ flexShrink: 0 }} />
            <AnimatePresence>
              {expanded && (
                <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>
                  <Box sx={{ fontSize: '0.8rem', fontWeight: 800, color: '#f87171', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: 1 }}>I'm Stuck (SOS)</Box>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        </Tooltip>
      </Box>

      {/* ── PRO upgrade ── */}
      {!user?.isAdmin && user?.role !== 'ORG_ADMIN' && (
        <Box sx={{ p: 1, flexShrink: 0, borderTop: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)' }}>
          <Tooltip title={!expanded ? 'Upgrade to Pro' : ''} placement="right" arrow>
            <Box
              component={RouterLink} to="/billing"
              sx={{
                display: 'flex', alignItems: 'center', gap: expanded ? 1.5 : 0,
                justifyContent: expanded ? 'flex-start' : 'center',
                px: expanded ? 1.5 : 0, height: 44, borderRadius: '12px',
                textDecoration: 'none', overflow: 'hidden',
                bgcolor: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                transition: 'all 0.25s',
                '&:hover': { bgcolor: 'rgba(99,102,241,0.18)', boxShadow: '0 0 16px rgba(99,102,241,0.2)' },
              }}
            >
              <Zap size={16} color="#6366f1" style={{ flexShrink: 0 }} />
              <AnimatePresence>
                {expanded && (
                  <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>
                    <Box sx={{ fontSize: '0.78rem', fontWeight: 800, color: '#818cf8', whiteSpace: 'nowrap' }}>Upgrade to Pro</Box>
                  </motion.div>
                )}
              </AnimatePresence>
            </Box>
          </Tooltip>
        </Box>
      )}
    </Box>
  );

  return (
    <>
    {/* SOS Dialog */}
    <Dialog open={sosModal} onClose={() => setSosModal(false)}
      PaperProps={{ style: { backgroundColor: isDark ? '#040612' : '#ffffff', color: isDark ? 'white' : 'black', borderRadius: 16 } }}>
      <DialogTitle sx={{ fontWeight: 900, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 1 }}>
        <LifeBuoy /> Emergency Broadcast
      </DialogTitle>
      <DialogContent>
          <Box sx={{ fontSize: '0.85rem', mb: 3, color: 'text.secondary' }}>
            Instantly ping all online experts for help. Provide a subject and brief description of where you are stuck.
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField fullWidth label="Subject (e.g. Calculus)" size="small" value={sosSubject} onChange={e => setSosSubject(e.target.value)} sx={{ input: { color: isDark ? 'white' : 'inherit' } }} />
            <TextField fullWidth label="What are you stuck on?" size="small" value={sosTopic} onChange={e => setSosTopic(e.target.value)} sx={{ input: { color: isDark ? 'white' : 'inherit' } }} />
          </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSosModal(false)} color="inherit" sx={{ fontWeight: 700 }}>Cancel</Button>
          <Button onClick={handleTriggerSOS} variant="contained" sx={{ bgcolor: '#ef4444', fontWeight: 800, '&:hover': { bgcolor: '#dc2626' } }}>Deploy SOS</Button>
      </DialogActions>
    </Dialog>

  {mobileOpen ? RailContent : (
    <Box sx={{
      display: { xs: 'none', md: 'flex' },
      height: '100%',
      flexShrink: 0,
      zIndex: 100,
      width: railWidth,
      transition: 'width 0.25s cubic-bezier(.4,0,.2,1)',
    }}>
      {RailContent}
    </Box>
  )}
  </>
  );
}
