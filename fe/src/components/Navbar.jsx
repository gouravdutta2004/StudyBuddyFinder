import { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useTheme as useCustomTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Menu as MenuIcon, Sun, Moon, Bell, BellRing, Sparkles } from 'lucide-react';
import api from '../api/axios';
import { AppBar, Toolbar, Typography, Button, IconButton, Badge, Avatar, Box, Menu, MenuItem, useTheme, useMediaQuery } from '@mui/material';

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { theme: currentThemeMode, toggleTheme } = useCustomTheme();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [anchorElNotif, setAnchorElNotif] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);

  useEffect(() => {
    if (user && !user.isAdmin) {
      api.get('/notifications').then(res => setNotifications(res.data)).catch(() => {});
    }
  }, [user]);

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (e) {}
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <AppBar position="sticky" elevation={0} sx={{ bgcolor: currentThemeMode === 'dark' ? 'rgba(2, 6, 23, 0.8)' : 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(12px)', borderBottom: 1, borderColor: currentThemeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'divider' }}>
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: 72 }}>
        
        {/* Mobile Menu & Logo or Search bar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {isMobile && (
            <IconButton edge="start" onClick={onMenuClick} sx={{ color: currentThemeMode === 'dark' ? 'white' : 'text.primary' }}>
              <MenuIcon />
            </IconButton>
          )}
          {!isMobile && (
            <Typography component="div" variant="body1" fontWeight={600} color={currentThemeMode === 'dark' ? 'rgba(255,255,255,0.5)' : 'text.secondary'} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Sparkles size={18} color="#6366f1" /> Welcome back, {user?.name?.split(' ')[0]}
            </Typography>
          )}
        </Box>

        {/* Right Side Icons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 } }}>
          
          <IconButton onClick={(e) => setAnchorElNotif(e.currentTarget)} sx={{ color: currentThemeMode === 'dark' ? 'rgba(255,255,255,0.7)' : 'text.secondary' }}>
            <Badge badgeContent={unreadCount} color="error" overlap="circular">
              {unreadCount > 0 ? <BellRing size={20} className="text-indigo-500" /> : <Bell size={20} />}
            </Badge>
          </IconButton>

          <Menu
            anchorEl={anchorElNotif}
            open={Boolean(anchorElNotif)}
            onClose={() => setAnchorElNotif(null)}
            PaperProps={{ sx: { width: 320, maxHeight: 400, mt: 1.5, borderRadius: 3, bgcolor: currentThemeMode === 'dark' ? '#0f172a' : 'white', border: '1px solid', borderColor: currentThemeMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'divider' } }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
              <Typography component="div" variant="subtitle1" fontWeight={700}>Notifications</Typography>
            </Box>
            {notifications.length === 0 ? (
              <MenuItem disabled sx={{ py: 3, justifyContent: 'center' }}>All caught up!</MenuItem>
            ) : (
              notifications.map(n => (
                <MenuItem key={n._id} onClick={() => markRead(n._id)} sx={{ borderBottom: 1, borderColor: 'divider', py: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', bgcolor: n.read ? 'transparent' : 'action.hover', opacity: n.read ? 0.7 : 1 }}>
                  <Typography component="div" variant="body2" sx={{ whiteSpace: 'normal', fontWeight: n.read ? 400 : 500 }}>{n.message}</Typography>
                </MenuItem>
              ))
            )}
          </Menu>

          <IconButton onClick={toggleTheme} sx={{ color: currentThemeMode === 'dark' ? 'rgba(255,255,255,0.7)' : 'text.secondary' }}>
            {currentThemeMode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </IconButton>

          <Button 
            onClick={(e) => setAnchorElUser(e.currentTarget)} 
            sx={{ textTransform: 'none', color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1, ml: 1, p: 0.5, pr: 1.5, borderRadius: '100px', border: '1px solid', borderColor: currentThemeMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'divider', '&:hover': { bgcolor: currentThemeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' } }}
          >
            <Avatar src={user?.avatar || ''} alt={user?.name} sx={{ width: 32, height: 32, bgcolor: '#6366f1' }}>
              {!user?.avatar && <User size={18} color="white" />}
            </Avatar>
            {!isMobile && <Typography component="div" variant="body2" fontWeight={600} color={currentThemeMode === 'dark' ? 'white' : 'text.primary'}>{user?.name}</Typography>}
          </Button>

          <Menu
            anchorEl={anchorElUser}
            open={Boolean(anchorElUser)}
            onClose={() => setAnchorElUser(null)}
            PaperProps={{ sx: { width: 200, mt: 1.5, borderRadius: 3, bgcolor: currentThemeMode === 'dark' ? '#0f172a' : 'white', border: '1px solid', borderColor: currentThemeMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'divider' } }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem component={RouterLink} to="/profile" onClick={() => setAnchorElUser(null)} sx={{ py: 1.5 }}>
              <User size={18} style={{ marginRight: 12, opacity: 0.7 }} /> Profile
            </MenuItem>
            <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: '#ef4444' }}>
              <LogOut size={18} style={{ marginRight: 12, opacity: 0.7 }} /> Logout
            </MenuItem>
          </Menu>

        </Box>
      </Toolbar>
    </AppBar>
  );
}
