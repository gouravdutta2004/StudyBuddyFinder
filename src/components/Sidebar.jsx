import React from 'react';
import { Box, useTheme, ButtonBase } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { BookOpen, Search, Users, Trophy, Calendar, Globe, MessageCircle, CreditCard, MapPin, Shield, Gamepad2, Joystick } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const navLinks = [
  { to: '/dashboard', icon: BookOpen, label: 'Dashboard' },
  { to: '/browse', icon: Search, label: 'Browse' },
  { to: '/matches', icon: Users, label: 'Matches' },
  { to: '/gamification', icon: Gamepad2, label: 'Quests & XP' },
  { to: '/arcade', icon: Joystick, label: 'Recess Arcade' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/sessions', icon: Calendar, label: 'Sessions' },
  { to: '/groups', icon: Globe, label: 'Squads' },
  { to: '/map', icon: MapPin, label: 'Nearby Map' },
  { to: '/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/connections', icon: Users, label: 'Connections' },
  { to: '/billing', icon: CreditCard, label: 'Billing' },
];

export default function Sidebar({ mobileOpen = false, setMobileOpen = () => {} }) {
  const { user } = useAuth();
  const location = useLocation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    if (!user) return;
    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001', {
      withCredentials: true
    });
    
    socket.emit('setup', user._id);
    
    socket.on('message_received', (newMessage) => {
      if (!location.pathname.startsWith('/messages')) {
        setUnreadCount(prev => prev + 1);
        toast(`New message from ${newMessage.sender?.name || 'someone'}`, {
          icon: '💬',
          style: { borderRadius: '100px', background: '#333', color: '#fff', fontWeight: 'bold' }
        });
      }
    });

    return () => socket.disconnect();
  }, [user, location.pathname]);

  const content = (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      bgcolor: isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255, 255, 255, 0.5)', 
      backdropFilter: 'blur(16px)',
      border: '1px solid', 
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
      borderRadius: { xs: 0, md: '24px' },
      boxShadow: isDark ? '0 4px 30px rgba(0, 0, 0, 0.5)' : '0 4px 30px rgba(0, 0, 0, 0.03)',
      overflow: 'hidden'
    }}>
      
      {/* Brand Logo */}
      <Box sx={{ p: 3, pb: 4 }}>
        <Logo size={36} textColor={isDark ? 'white' : 'text.primary'} />
      </Box>

        {/* Navigation Links */}
        <Box sx={{ px: 2, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {(!user || user.role !== 'ORG_ADMIN' || user.isAdmin) && (
            <Box sx={{ px: 2, mb: 1, color: isDark ? 'rgba(255,255,255,0.4)' : 'text.secondary', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Menu
            </Box>
          )}
          
          {(!user || user.role !== 'ORG_ADMIN' || user.isAdmin) && navLinks.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname.startsWith(to);
          return (
            <ButtonBase
              component={RouterLink}
              to={to}
              key={to}
              onClick={() => setMobileOpen(false)}
              sx={{
                justifyContent: 'flex-start',
                width: '100%',
                mb: 0.5,
                p: 1.5,
                borderRadius: '12px',
                color: isActive ? '#6366f1' : (isDark ? 'rgba(255,255,255,0.6)' : 'text.secondary'),
                bgcolor: isActive ? (isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)') : 'transparent',
                '&:hover': {
                  bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                  color: isDark ? 'white' : 'text.primary'
                },
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}
            >
              <Box sx={{ position: 'relative' }}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {to === '/messages' && unreadCount > 0 && (
                  <Box sx={{
                    position: 'absolute', top: -5, right: -5,
                    bgcolor: '#ef4444', color: 'white', fontSize: '0.65rem',
                    fontWeight: 800, minWidth: 16, height: 16,
                    borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Box>
                )}
              </Box>
              <Box sx={{ fontWeight: isActive ? 700 : 500, fontSize: '0.95rem' }}>
                {label}
              </Box>
            </ButtonBase>
          );
        })}
        {(user?.role === 'ORG_ADMIN' || user?.isAdmin) && (
          <ButtonBase
            component={RouterLink}
            to="/org-admin"
            onClick={() => setMobileOpen(false)}
            sx={{
              justifyContent: 'flex-start', width: '100%', mb: 0.5, p: 1.5, borderRadius: '12px',
              color: location.pathname.startsWith('/org-admin') ? '#6366f1' : (isDark ? 'rgba(255,255,255,0.6)' : 'text.secondary'),
              bgcolor: location.pathname.startsWith('/org-admin') ? (isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)') : 'transparent',
              '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', color: isDark ? 'white' : 'text.primary' },
              transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: 2
            }}
          >
            <Users size={20} strokeWidth={location.pathname.startsWith('/org-admin') ? 2.5 : 2} />
            <Box sx={{ fontWeight: location.pathname.startsWith('/org-admin') ? 700 : 500, fontSize: '0.95rem' }}>
              Org Admin
            </Box>
          </ButtonBase>
        )}

        {user?.isAdmin && (
          <ButtonBase
            component={RouterLink}
            to="/admin"
            onClick={() => setMobileOpen(false)}
            sx={{
              justifyContent: 'flex-start', width: '100%', mb: 0.5, p: 1.5, borderRadius: '12px',
              color: location.pathname.startsWith('/admin') ? '#ec4899' : (isDark ? 'rgba(255,255,255,0.6)' : 'text.secondary'),
              bgcolor: location.pathname.startsWith('/admin') ? (isDark ? 'rgba(236, 72, 153, 0.1)' : 'rgba(236, 72, 153, 0.05)') : 'transparent',
              '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', color: isDark ? 'white' : 'text.primary' },
              transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: 2
            }}
          >
            <Shield size={20} strokeWidth={location.pathname.startsWith('/admin') ? 2.5 : 2} />
            <Box sx={{ fontWeight: location.pathname.startsWith('/admin') ? 700 : 500, fontSize: '0.95rem' }}>
              Super Admin
            </Box>
          </ButtonBase>
        )}
      </Box>

      {/* Upgrade Call to Action */}
      {(!user?.isAdmin && user?.role !== 'ORG_ADMIN') && (
        <Box sx={{ p: 3, m: 2, borderRadius: '16px', bgcolor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)', border: '1px solid', borderColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)' }}>
          <Box sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#6366f1', mb: 0.5 }}>Upgrade to Pro</Box>
          <Box sx={{ fontSize: '0.75rem', color: isDark ? 'rgba(255,255,255,0.6)' : 'text.secondary', display: 'block', mb: 2 }}>Unlock AI Tutor & unlimited Vaults.</Box>
          <ButtonBase component={RouterLink} to="/billing" sx={{ width: '100%', p: 1, borderRadius: '8px', bgcolor: '#6366f1', color: 'white', fontWeight: 600, fontSize: '0.875rem' }}>
            View Plans
          </ButtonBase>
        </Box>
      )}
    </Box>
  );

  if (mobileOpen) {
    return content;
  }

  return (
    <Box sx={{ display: { xs: 'none', md: 'block' }, width: 280, flexShrink: 0, height: 'calc(100vh - 32px)', position: 'sticky', top: 16 }}>
      {content}
    </Box>
  );
}
