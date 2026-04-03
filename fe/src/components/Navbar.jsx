import { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useTheme as useCustomTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Menu as MenuIcon, Sun, Moon, Bell, BellRing, BellOff, Sparkles, ChevronDown, MessageCircle, LifeBuoy } from 'lucide-react';
import api from '../api/axios';
import { Avatar, Box, Menu, MenuItem, Tooltip, useTheme, useMediaQuery, Badge, Typography, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Select, TextField, Button, FormControl, InputLabel } from '@mui/material';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Anchor Nav items (used for the active indicator) ─── */
const ANCHORS = [
  { to: '/dashboard', label: 'Home' },
  { to: '/browse',    label: 'Browse' },
  { to: '/sessions',  label: 'Sessions' },
  { to: '/groups',    label: 'Squads' },
  { to: '/messages',  label: 'Messages' },
];

/* ─── Anchor link with animated underline ─── */
function AnchorLink({ to, label, isActive, isDark }) {
  return (
    <Box
      component={RouterLink}
      to={to}
      sx={{
        position: 'relative', textDecoration: 'none',
        px: 1, py: 0.5,
        fontSize: '0.82rem', fontWeight: isActive ? 700 : 500,
        color: isActive
          ? (isDark ? '#e0e7ff' : '#4f46e5')
          : isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
        transition: 'color 0.2s',
        '&:hover': { color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.8)' },
      }}
    >
      {label}
      <AnimatePresence>
        {isActive && (
          <motion.div
            layoutId="anchor-indicator"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ scaleX: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 40 }}
            style={{
              position: 'absolute', bottom: -2, left: 0, right: 0, margin: '0 auto',
              width: '70%', height: 2, borderRadius: 2,
              background: 'linear-gradient(90deg,#6366f1,#22d3ee)',
              boxShadow: '0 0 8px rgba(99,102,241,0.8)',
            }}
          />
        )}
      </AnimatePresence>
    </Box>
  );
}

/* ══════════════ ANCHOR NAVBAR ══════════════ */
export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { theme: currentThemeMode, toggleTheme } = useCustomTheme();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const isDark = currentThemeMode === 'dark';
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [anchorElNotif, setAnchorElNotif] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [messengerUnread, setMessengerUnread] = useState(0);

  const { permission, isSubscribed, loading: pushLoading, subscribe, unsubscribe, autoSubscribeIfPermitted } = usePushNotifications();

  // Track messenger unread count from the widget
  useEffect(() => {
    const handler = (e) => setMessengerUnread(e.detail?.count ?? 0);
    window.addEventListener('messenger-unread-update', handler);
    return () => window.removeEventListener('messenger-unread-update', handler);
  }, []);

  // Scroll detection — listen on both window and the inner main scroll container
  useEffect(() => {
    const getScrolled = () => {
      const mainEl = document.querySelector('main');
      return (window.scrollY > 10) || (mainEl ? mainEl.scrollTop > 10 : false);
    };
    const h = () => setScrolled(getScrolled());
    window.addEventListener('scroll', h, { passive: true });
    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.addEventListener('scroll', h, { passive: true });
    return () => {
      window.removeEventListener('scroll', h);
      if (mainEl) mainEl.removeEventListener('scroll', h);
    };
  }, []);

  useEffect(() => {
    if (user && !user.isAdmin) {
      api.get('/notifications').then(r => setNotifications(r.data)).catch(() => {});
      autoSubscribeIfPermitted();
    }
  }, [user, autoSubscribeIfPermitted]);

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(p => p.map(n => n._id === id ? { ...n, read: true } : n));
    } catch {}
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState('Feature Request');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  const triggerLogoutSequence = () => { 
    setAnchorElUser(null);
    setShowFeedbackModal(true); 
  };
  
  const finishLogout = () => { logout(); navigate('/login'); };
  
  const submitFeedbackAndLogout = async () => {
    if (!feedbackContent.trim()) return finishLogout();
    setFeedbackSubmitting(true);
    try {
      await api.post('/users/feedback', { type: feedbackType, content: feedbackContent });
    } catch (err) { console.error('Feedback submission failed', err); }
    finishLogout();
  };

  /* ── Icon button style (theme-aware) ── */
  const iconBtnSx = {
    width: 36, height: 36, borderRadius: '10px', display: 'flex',
    alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
    flexShrink: 0,
    bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
    border: '1px solid',
    borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
    transition: 'all 0.2s',
    '&:hover': {
      bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
      color: isDark ? 'white' : '#0f172a',
      borderColor: 'rgba(99,102,241,0.3)',
    },
  };

  return (
    <Box
      component={motion.div}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      sx={{
        position: 'sticky', top: 0, zIndex: 99,
        /* Anchor bar — slim, pill-shaped */
        mx: { xs: 0, md: 2 }, mt: { xs: 0, md: 1.5 }, mb: { xs: 1, md: 2 },
        px: { xs: 2, md: 3 }, py: 0,
        height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2,
        bgcolor: isDark ? 'rgba(4,6,18,0.88)' : 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(24px)',
        borderRadius: { xs: 0, md: '16px' },
        border: '1px solid',
        borderColor: isDark
          ? scrolled ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)'
          : scrolled ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.06)',
        boxShadow: scrolled
          ? (isDark ? '0 8px 40px rgba(0,0,0,0.5),0 0 0 1px rgba(99,102,241,0.1)' : '0 8px 32px rgba(0,0,0,0.1)')
          : (isDark ? '0 2px 16px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.05)'),
        transition: 'all 0.3s ease',
      }}
    >
      {/* ── Left: hamburger (mobile) + greeting ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
        {isMobile && (
          <Box onClick={onMenuClick} sx={{ ...iconBtnSx }}>
            <MenuIcon size={18} />
          </Box>
        )}

        {!isMobile && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Live dot */}
            <Box
              component={motion.div}
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.8)', flexShrink: 0 }}
            />
            <Typography
              component="span"
              sx={{ fontSize: '0.82rem', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.5)' : 'text.secondary', fontFamily: "'Inter',sans-serif" }}
            >
              Welcome back, <Box component="span" sx={{ color: isDark ? 'rgba(255,255,255,0.85)' : '#0f172a', fontWeight: 700 }}>{user?.name?.split(' ')[0]}</Box>
            </Typography>
          </Box>
        )}
      </Box>

      {/* ── Center: Anchor nav links (desktop only) ── */}
      {!isMobile && (
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1,
          px: 2.5, py: 0.75, borderRadius: '12px',
          bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
          border: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          position: 'relative',
        }}>
          {ANCHORS.map(({ to, label }) => (
            <AnchorLink
              key={to} to={to} label={label}
              isActive={location.pathname.startsWith(to)}
              isDark={isDark}
            />
          ))}
        </Box>
      )}

      {/* ── Right: action icons ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: isMobile ? 1 : 'none', justifyContent: 'flex-end' }}>

        {/* ── Widget trigger circles ── */}
        {user && !user.isAdmin && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>

            {/* AI Assistant */}
            <Tooltip title="Whobee AI" arrow>
              <Box
                component={motion.div}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => window.dispatchEvent(new CustomEvent('open-ai-widget'))}
                sx={{
                  width: 34, height: 34, borderRadius: '50%', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: isDark ? '0 4px 14px rgba(139,92,246,0.45)' : '0 4px 14px rgba(99,102,241,0.3)',
                  border: '2px solid',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(99,102,241,0.25)',
                  flexShrink: 0,
                }}
              >
                <Sparkles size={15} color="#fff" />
              </Box>
            </Tooltip>

            {/* Messenger */}
            <Tooltip title="Quick Messages" arrow>
              <Box
                component={motion.div}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => window.dispatchEvent(new CustomEvent('open-messenger-widget'))}
                sx={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}
              >
                <Box sx={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: isDark ? '0 4px 14px rgba(59,130,246,0.45)' : '0 4px 14px rgba(59,130,246,0.25)',
                  border: '2px solid',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(59,130,246,0.25)',
                }}>
                  <MessageCircle size={15} color="#fff" />
                </Box>
                {messengerUnread > 0 && (
                  <Box sx={{
                    position: 'absolute', top: -3, right: -3,
                    width: 16, height: 16, borderRadius: '50%',
                    bgcolor: '#ef4444',
                    border: `2px solid ${isDark ? '#040612' : '#f0f2f8'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.5rem', fontWeight: 900, color: 'white',
                    lineHeight: 1,
                  }}>
                    {messengerUnread > 9 ? '9+' : messengerUnread}
                  </Box>
                )}
              </Box>
            </Tooltip>

            {/* Support */}
            <Tooltip title="Support Chat" arrow>
              <Box
                component={motion.div}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => navigate('/support')}
                sx={{
                  width: 34, height: 34, borderRadius: '50%', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: isDark ? '0 4px 14px rgba(16,185,129,0.45)' : '0 4px 14px rgba(16,185,129,0.25)',
                  border: '2px solid',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(16,185,129,0.25)',
                  flexShrink: 0,
                }}
              >
                <LifeBuoy size={15} color="#fff" />
              </Box>
            </Tooltip>

          </Box>
        )}

        {/* Notifications */}
        <Tooltip title="Notifications" arrow>
          <Box onClick={e => setAnchorElNotif(e.currentTarget)} sx={{ ...iconBtnSx, position: 'relative' }}>
            {unreadCount > 0 ? <BellRing size={17} color="#6366f1" /> : <Bell size={17} />}
            {unreadCount > 0 && (
              <Box sx={{
                position: 'absolute', top: 5, right: 5,
                width: 8, height: 8, borderRadius: '50%',
                bgcolor: '#ef4444', border: `2px solid ${isDark ? '#040612' : 'white'}`,
              }} />
            )}
          </Box>
        </Tooltip>

        {/* Notifications dropdown */}
        <Menu
          anchorEl={anchorElNotif}
          open={Boolean(anchorElNotif)}
          onClose={() => setAnchorElNotif(null)}
          PaperProps={{
            sx: {
              width: 320, maxHeight: 400, mt: 1.5, borderRadius: '16px',
              bgcolor: isDark ? '#060912' : 'white',
              border: '1px solid', borderColor: isDark ? 'rgba(99,102,241,0.15)' : 'divider',
              boxShadow: isDark ? '0 16px 48px rgba(0,0,0,0.6)' : '0 16px 48px rgba(0,0,0,0.1)',
            }
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography fontWeight={800} fontSize="0.9rem" color={isDark ? 'white' : '#0f172a'}>Notifications</Typography>
            {unreadCount > 0 && <Box sx={{ px: 1, py: 0.25, borderRadius: '6px', bgcolor: 'rgba(99,102,241,0.15)', fontSize: '0.65rem', fontWeight: 800, color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)', fontFamily: 'monospace' }}>{unreadCount} new</Box>}
          </Box>
          {notifications.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary', fontSize: '0.88rem' }}>All caught up ✓</Box>
          ) : (
            notifications.slice(0, 8).map(n => (
              <MenuItem key={n._id} onClick={() => markRead(n._id)}
                sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', alignItems: 'flex-start', gap: 1.5 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: n.read ? 'transparent' : '#6366f1', mt: 0.75, flexShrink: 0 }} />
                <Typography fontSize="0.8rem" color={isDark ? 'rgba(255,255,255,0.7)' : 'text.primary'} fontWeight={n.read ? 400 : 600} sx={{ whiteSpace: 'normal' }}>
                  {n.message}
                </Typography>
              </MenuItem>
            ))
          )}
        </Menu>

        {/* Push toggle */}
        {user && !user.isAdmin && (
          <Tooltip title={isSubscribed ? 'Disable push' : 'Enable push'} arrow>
            <Box
              onClick={!pushLoading && permission !== 'denied' ? (isSubscribed ? unsubscribe : subscribe) : undefined}
              sx={{ ...iconBtnSx, opacity: permission === 'denied' ? 0.4 : 1, color: isSubscribed ? '#6366f1' : undefined }}
            >
              {isSubscribed ? <BellRing size={16} /> : <BellOff size={16} />}
            </Box>
          </Tooltip>
        )}

        {/* Theme toggle */}
        <Tooltip title={isDark ? 'Light mode' : 'Dark mode'} arrow>
          <Box onClick={toggleTheme} sx={iconBtnSx}>
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </Box>
        </Tooltip>

        {/* ── Avatar menu ── */}
        <Box
          onClick={e => setAnchorElUser(e.currentTarget)}
          sx={{
            display: 'flex', alignItems: 'center', gap: 1,
            pl: 1, pr: 1.25, py: 0.5, borderRadius: '12px', cursor: 'pointer',
            bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
            border: '1px solid',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
            transition: 'all 0.2s',
            '&:hover': { bgcolor: 'rgba(99,102,241,0.1)', borderColor: 'rgba(99,102,241,0.25)' },
          }}
        >
          <Avatar src={user?.avatar} sx={{ width: 28, height: 28, bgcolor: 'rgba(99,102,241,0.3)', fontSize: 12, fontWeight: 800, border: '1.5px solid rgba(99,102,241,0.4)', color: '#818cf8' }}>
            {!user?.avatar && <User size={14} />}
          </Avatar>
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography fontSize="0.78rem" fontWeight={700} color={isDark ? 'rgba(255,255,255,0.85)' : '#0f172a'}>
                {user?.name?.split(' ')[0]}
              </Typography>
              <ChevronDown size={13} color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)'} />
            </Box>
          )}
        </Box>

        <Menu
          anchorEl={anchorElUser}
          open={Boolean(anchorElUser)}
          onClose={() => setAnchorElUser(null)}
          PaperProps={{
            sx: {
              width: 200, mt: 1.5, borderRadius: '16px',
              bgcolor: isDark ? '#060912' : 'white',
              border: '1px solid', borderColor: isDark ? 'rgba(99,102,241,0.15)' : 'divider',
              boxShadow: isDark ? '0 16px 48px rgba(0,0,0,0.6)' : '0 16px 48px rgba(0,0,0,0.1)',
              overflow: 'visible',
            }
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {/* Mini user header */}
          <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'divider' }}>
            <Typography fontWeight={800} fontSize="0.88rem" color={isDark ? 'white' : '#0f172a'}>{user?.name}</Typography>
            <Typography fontFamily="monospace" fontSize="0.58rem" color="#6366f1" letterSpacing={1.5} fontWeight={700}>
              LVL {user?.level || 1} · {user?.xp || 0} XP
            </Typography>
          </Box>
          <MenuItem component={RouterLink} to="/profile" onClick={() => setAnchorElUser(null)}
            sx={{ px: 2.5, py: 1.5, gap: 1.5, color: isDark ? 'rgba(255,255,255,0.75)' : 'text.primary', fontSize: '0.82rem', fontWeight: 600, '&:hover': { bgcolor: 'rgba(99,102,241,0.08)', color: '#818cf8' } }}>
            <User size={15} style={{ opacity: 0.7 }} /> Profile
          </MenuItem>
          <MenuItem onClick={triggerLogoutSequence}
            sx={{ px: 2.5, py: 1.5, gap: 1.5, color: '#ef4444', fontSize: '0.82rem', fontWeight: 600, '&:hover': { bgcolor: 'rgba(239,68,68,0.08)' } }}>
            <LogOut size={15} style={{ opacity: 0.7 }} /> Logout
          </MenuItem>
        </Menu>
      </Box>

      {/* Logout Feedback Interceptor Modal */}
      <Dialog 
        open={showFeedbackModal} 
        onClose={finishLogout}
        maxWidth="sm" fullWidth
        PaperProps={{ 
          sx: { 
            borderRadius: '24px', 
            bgcolor: isDark ? '#040612' : '#ffffff',
            backgroundImage: isDark ? 'linear-gradient(to bottom right, rgba(99,102,241,0.05), transparent)' : 'none',
            border: '1px solid', borderColor: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(0,0,0,0.1)'
          } 
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, pb: 1, color: isDark ? 'white' : 'black', fontWeight: 800 }}>
          <MessageCircle size={22} color="#6366f1" /> Before you go...
        </DialogTitle>
        <DialogContent sx={{ pb: 3 }}>
          <Typography variant="body2" sx={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'text.secondary', mb: 3 }}>
            Help us improve StudyFriend! Do you have any quick feedback or bug reports?
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : undefined }}>Topic</InputLabel>
            <Select
              value={feedbackType} onChange={e => setFeedbackType(e.target.value)}
              label="Topic"
              sx={{ 
                color: isDark ? 'white' : 'black', 
                '.MuiOutlinedInput-notchedOutline': { borderColor: isDark ? 'rgba(255,255,255,0.2)' : undefined },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: isDark ? 'rgba(255,255,255,0.3)' : undefined },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1' }
              }}
            >
              <MenuItem value="Feature Request">💡 Feature Request</MenuItem>
              <MenuItem value="Bug">🐛 Bug Report</MenuItem>
              <MenuItem value="Report User">🛡️ Report a User</MenuItem>
              <MenuItem value="Other">💬 Other Feedback</MenuItem>
            </Select>
          </FormControl>
          <TextField
            multiline rows={3} fullWidth
            placeholder="Tell us about your experience..."
            value={feedbackContent} onChange={e => setFeedbackContent(e.target.value)}
            InputProps={{
              sx: { 
                color: isDark ? 'white' : 'black', 
                '& fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.2)' : undefined },
                '&:hover fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.3)' : undefined },
                '&.Mui-focused fieldset': { borderColor: '#6366f1' }
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={finishLogout} sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'text.secondary', fontWeight: 600 }}>
            Skip & Logout
          </Button>
          <Button 
            variant="contained" 
            onClick={submitFeedbackAndLogout} 
            disabled={feedbackSubmitting || !feedbackContent.trim()}
            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: '12px', fontWeight: 700, px: 3, boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)' }}
          >
            {feedbackSubmitting ? 'Sending...' : 'Submit & Logout'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
