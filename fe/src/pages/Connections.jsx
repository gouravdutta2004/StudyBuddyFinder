import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, UserCheck, Orbit, UserMinus, MessageCircle, Check, X, Compass } from 'lucide-react';
import toast from 'react-hot-toast';
import ShareSquadStory from '../components/profile/ShareSquadStory';
import { Box, Typography, Avatar, Button, Chip, CircularProgress, Grid, IconButton, Tooltip, useTheme, ButtonBase } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

function CircleNode({ user: u, tab, onAccept, onReject, onDisconnect, navigate, isDark }) {
  // Inner Circle Aesthetic: Soft white/glass bubbles, overlapping ring borders, floating feel
  const ringColor = tab === 'connections' ? '#6366f1' : tab === 'pending' ? '#10b981' : '#f59e0b';
  
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} whileHover={{ y: -8 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} style={{ willChange: 'transform, opacity' }}>
      <Box sx={{
        p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 2,
        bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)',
        borderRadius: '120px 120px 40px 40px', // Teardrop/Bubble shape
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        boxShadow: isDark ? `0 8px 32px ${ringColor}22` : `0 8px 32px ${ringColor}33`,
        position: 'relative', overflow: 'hidden', height: '100%'
      }}>
        {/* Glow behind avatar */}
        <Box sx={{ position: 'absolute', top: 40, left: '50%', transform: 'translate(-50%, -50%)', width: 100, height: 100, bgcolor: ringColor, filter: 'blur(12px)', opacity: 0.15, borderRadius: '50%', pointerEvents: 'none' }} />

        {/* Avatar Ring */}
        <Box component={ButtonBase} onClick={() => navigate(`/user/${u._id}`)} sx={{ borderRadius: '50%', p: 0.5, border: `2px dashed ${ringColor}80`, transition: 'transform 0.5s', '&:hover': { transform: 'rotate(45deg)' } }}>
          <Avatar src={u.avatar} sx={{ width: 80, height: 80, bgcolor: ringColor, fontWeight: 900, fontSize: '2rem', boxShadow: `0 0 20px ${ringColor}40`, transform: 'rotate(-45deg)' /* counter rotation to keep image upright if we rotated parent on hover, but we don't need to overcomplicate, just static rotation effect */ }}>
            {u.name?.[0]}
          </Avatar>
        </Box>

        <Box sx={{ width: '100%' }}>
          <Typography fontWeight={900} fontSize="1.1rem" color={isDark ? 'white' : 'text.primary'} sx={{ letterSpacing: -0.5, lineHeight: 1.2 }}>{u.name}</Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={600} noWrap display="block" sx={{ mt: 0.5 }}>{u.university || 'Independent'}</Typography>
        </Box>

        {u.subjects?.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
            {u.subjects.slice(0, 3).map(s => <Chip key={s} label={s} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, borderRadius: '100px', bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }} />)}
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1, mt: 'auto', width: '100%' }}>
          {tab === 'pending' ? (
            <>
              <IconButton onClick={() => onAccept(u._id)} sx={{ flex: 1, bgcolor: '#10b981', color: 'white', '&:hover': { bgcolor: '#059669' } }}><Check size={20} /></IconButton>
              <IconButton onClick={() => onReject(u._id)} sx={{ flex: 1, bgcolor: 'rgba(239,68,68,0.1)', color: '#ef4444', '&:hover': { bgcolor: 'rgba(239,68,68,0.2)' } }}><X size={20} /></IconButton>
            </>
          ) : tab === 'sent' ? (
            <Chip label="Orbiting..." sx={{ width: '100%', borderRadius: '100px', bgcolor: `${ringColor}20`, color: ringColor, fontWeight: 800 }} />
          ) : (
            <>
              <Button fullWidth variant="contained" onClick={() => navigate('/messages', { state: { openUserId: u._id } })} startIcon={<MessageCircle size={16} />} sx={{ borderRadius: '100px', fontWeight: 800, bgcolor: ringColor, '&:hover': { bgcolor: '#4f46e5' }, textTransform: 'none' }}>Ping</Button>
              <Tooltip title="Sever Link">
                <IconButton onClick={() => onDisconnect(u._id)} sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', color: 'text.secondary', '&:hover': { color: '#ef4444', bgcolor: 'rgba(239,68,68,0.1)' } }}><UserMinus size={18} /></IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </Box>
    </motion.div>
  );
}

export default function Connections() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const [data, setData] = useState({ connections: [], pendingRequests: [], sentRequests: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('connections');

  const fetchConnections = async () => { try { const res = await api.get('/users/connections'); setData(res.data); } catch { toast.error('Connection failed'); } finally { setLoading(false); } };
  useEffect(() => { fetchConnections(); }, []);

  const handleAccept = async (id) => { try { await api.post(`/users/accept/${id}`); toast.success('Added to Inner Circle!'); fetchConnections(); } catch { toast.error('Failed'); } };
  const handleReject = async (id) => { try { await api.post(`/users/reject/${id}`); toast.success('Orbit rejected'); fetchConnections(); } catch { toast.error('Failed'); } };
  const handleDisconnect = async (id) => { if (!window.confirm('Sever link with this node?')) return; try { await api.post(`/users/disconnect/${id}`); toast.success('Link severed'); fetchConnections(); } catch { toast.error('Failed'); } };

  const tabs = [
    { key: 'connections', label: 'Inner Circle', count: data.connections.length, icon: UserCheck, color: '#6366f1' },
    { key: 'pending', label: 'Incoming Orbits', count: data.pendingRequests.length, icon: Orbit, color: '#10b981' },
    { key: 'sent', label: 'Sent Signals', count: data.sentRequests.length, icon: Compass, color: '#f59e0b' },
  ];

  const currentList = tab === 'connections' ? data.connections : tab === 'pending' ? data.pendingRequests : data.sentRequests;

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}><CircularProgress size={56} thickness={4} sx={{ color: '#6366f1' }} /></Box>;

  return (
    <Box sx={{ minHeight: '100vh', py: 6, px: { xs: 2, md: 4 }, position: 'relative', overflow: 'hidden' }}>
      {/* Circle Ambient Geometry */}
      <Box sx={{ position: 'absolute', top: '-10%', left: '-10%', width: '120vw', height: '120vw', border: '1px solid', borderColor: isDark ? 'rgba(99,102,241,0.05)' : 'rgba(99,102,241,0.05)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', top: '10%', left: '10%', width: '80vw', height: '80vw', border: '1px dashed', borderColor: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.1)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none', animation: 'spin 120s linear infinite' }} />
      
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>

      <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 1200, mx: 'auto' }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="h2" fontWeight={900} color={isDark ? 'white' : 'text.primary'} sx={{ letterSpacing: -2, mb: 1 }}>The Circle</Typography>
          <Typography variant="h6" color="text.secondary" fontWeight={500}>Manage your academic network orbit.</Typography>
          {tab === 'connections' && data.connections.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><ShareSquadStory connections={data.connections} /></Box>
          )}
        </Box>

        {/* Circular Pill Tabs */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 8, flexWrap: 'wrap' }}>
          {tabs.map(({ key, label, count, icon: Icon, color }) => {
            const isActive = tab === key;
            return (
              <ButtonBase key={key} onClick={() => setTab(key)}
                sx={{
                  px: 4, py: 2, borderRadius: '100px', display: 'flex', alignItems: 'center', gap: 1.5,
                  bgcolor: isActive ? color : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'),
                  color: isActive ? 'white' : 'text.secondary', fontWeight: isActive ? 900 : 700, fontSize: '0.95rem',
                  boxShadow: isActive ? `0 10px 30px ${color}50` : 'none', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': { bgcolor: isActive ? color : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'), transform: 'translateY(-2px)' }
                }}>
                <Icon size={18} /> {label}
                {count > 0 && <Box sx={{ bgcolor: isActive ? 'rgba(0,0,0,0.2)' : 'rgba(150,150,150,0.2)', color: isActive ? 'white' : 'text.secondary', fontSize: '0.75rem', fontWeight: 900, px: 1.2, py: 0.2, borderRadius: '100px' }}>{count}</Box>}
              </ButtonBase>
            );
          })}
        </Box>

        {currentList.length === 0 ? (
          <Box component={motion.div} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} sx={{ textAlign: 'center', py: 10, maxWidth: 400, mx: 'auto' }}>
            <Box sx={{ width: 120, height: 120, borderRadius: '50%', bgcolor: isDark ? 'rgba(99,102,241,0.05)' : 'rgba(99,102,241,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3, border: '2px dashed #6366f1' }}>
              <Users size={48} color="#6366f1" style={{ opacity: 0.5 }} />
            </Box>
            <Typography variant="h5" fontWeight={900} mb={1}>Empty Orbit</Typography>
            <Typography color="text.secondary" mb={4}>No nodes detected in this quadrant. Expand your inner circle.</Typography>
            {tab === 'connections' && <Button variant="contained" onClick={() => navigate('/browse')} sx={{ borderRadius: '100px', fontWeight: 900, px: 4, py: 1.5, bgcolor: '#6366f1', boxShadow: '0 10px 30px rgba(99,102,241,0.4)', textTransform: 'none', fontSize: '1rem' }}>Scan Network</Button>}
          </Box>
        ) : (
          <Grid container spacing={4} justifyContent="center">
            <AnimatePresence mode="popLayout">
              {currentList.map(u => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={u._id}>
                  <CircleNode user={u} tab={tab} onAccept={handleAccept} onReject={handleReject} onDisconnect={handleDisconnect} navigate={navigate} isDark={isDark} />
                </Grid>
              ))}
            </AnimatePresence>
          </Grid>
        )}
      </Box>
    </Box>
  );
}
