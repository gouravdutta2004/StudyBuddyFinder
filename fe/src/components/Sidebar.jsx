import React, { useState } from 'react';
import { Box, Tooltip, Avatar, useTheme } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  BookOpen, Search, Users, Trophy, Calendar, Globe,
  MessageCircle, CreditCard, MapPin, Shield, Gamepad2,
  Joystick, ChevronRight, Zap, Network, BrainCircuit, BarChart2, Radio
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

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
          {/* Badge */}
          {unread > 0 && (
            <Box sx={{
              position: 'absolute', top: -4, right: -4,
              width: 15, height: 15, borderRadius: '50%',
              bgcolor: '#ef4444',
              border: `2px solid ${isDark ? '#06090f' : '#f0f2f8'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.5rem', fontWeight: 900, color: 'white',
            }}>
              {unread > 9 ? '9+' : unread}
            </Box>
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
  const location = useLocation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [expanded, setExpanded] = useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    if (!user) return;
    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001', { withCredentials: true });
    socket.emit('setup', user._id);
    socket.on('message_received', (msg) => {
      if (!location.pathname.startsWith('/messages')) {
        setUnreadCount(p => p + 1);
        toast(`New message from ${msg.sender?.name || 'someone'}`, {
          icon: '💬',
          style: { borderRadius: '100px', background: '#1e1b4b', color: '#fff', fontWeight: 'bold' }
        });
      }
    });
    return () => { socket.off('message_received'); socket.disconnect(); };
  }, [user?._id, location.pathname]);

  const railWidth = expanded ? 220 : 72;

  const RailContent = (
    <Box
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      sx={{
        height: '100%', display: 'flex', flexDirection: 'column',
        width: railWidth, transition: 'width 0.25s cubic-bezier(.4,0,.2,1)',
        overflow: 'hidden',
        bgcolor: isDark ? 'rgba(4,6,18,0.96)' : 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(24px)',
        borderRight: '1px solid',
        borderColor: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(0,0,0,0.07)',
        boxShadow: isDark ? '4px 0 32px rgba(0,0,0,0.5)' : '4px 0 20px rgba(0,0,0,0.06)',
        willChange: 'width, background-color',
      }}
    >
      {/* ── Logo / Brand ── */}
      <Box sx={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: expanded ? 'flex-start' : 'center', px: expanded ? 2 : 0, flexShrink: 0, borderBottom: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)' }}>
        <Box sx={{ width: 36, height: 36, borderRadius: '10px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 16px rgba(99,102,241,0.4)', bgcolor: 'white' }}>
          <img src="/logo.png" alt="StudyFriend" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

  if (mobileOpen) return RailContent;

  return (
    <Box sx={{ display: { xs: 'none', md: 'flex' }, height: '100vh', position: 'sticky', top: 0, flexShrink: 0, zIndex: 100, width: railWidth, transition: 'width 0.25s cubic-bezier(.4,0,.2,1)' }}>
      {RailContent}
    </Box>
  );
}
