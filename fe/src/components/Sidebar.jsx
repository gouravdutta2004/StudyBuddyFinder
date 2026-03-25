import React from 'react';
import { Box, useTheme, ButtonBase } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { BookOpen, Search, Users, Trophy, Calendar, Globe, MessageCircle, CreditCard, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { to: '/dashboard', icon: BookOpen, label: 'Dashboard' },
  { to: '/browse', icon: Search, label: 'Browse' },
  { to: '/matches', icon: Users, label: 'Matches' },
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

  const content = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: isDark ? '#020617' : '#ffffff', borderRight: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'divider' }}>
      
      {/* Brand Logo */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5, pb: 4 }}>
        <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)' }}>
          <BookOpen size={20} color="white" />
        </Box>
        <Box sx={{ fontWeight: 900, fontSize: '1.25rem', letterSpacing: '-0.5px', color: isDark ? 'white' : 'text.primary' }}>
          StudyBuddy
        </Box>
      </Box>

      {/* Navigation Links */}
      <Box sx={{ px: 2, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ px: 2, mb: 1, color: isDark ? 'rgba(255,255,255,0.4)' : 'text.secondary', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
          Menu
        </Box>
        
        {!user?.isAdmin && navLinks.map(({ to, icon: Icon, label }) => {
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
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <Box sx={{ fontWeight: isActive ? 700 : 500, fontSize: '0.95rem' }}>
                {label}
              </Box>
            </ButtonBase>
          );
        })}
        {user?.role === 'ORG_ADMIN' && (
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
      </Box>

      {/* Upgrade Call to Action */}
      {!user?.isAdmin && (
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
    <Box sx={{ display: { xs: 'none', md: 'block' }, width: 280, flexShrink: 0, height: '100vh', position: 'sticky', top: 0 }}>
      {content}
    </Box>
  );
}
