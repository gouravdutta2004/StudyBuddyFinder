import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Chip, useTheme, CircularProgress } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Users, BookOpen, ArrowRight, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

function LiveRoomCard({ room, onJoin, index }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const count = room.participants?.length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      layout
    >
      <Box sx={{
        p: 3, borderRadius: '16px',
        bgcolor: isDark ? '#0d1117' : '#ffffff',
        border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.06)',
        display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, gap: 2,
        position: 'relative', overflow: 'hidden',
        transition: 'all 0.2s',
        '&:hover': { borderColor: 'rgba(16,185,129,0.3)', boxShadow: isDark ? '0 4px 24px rgba(16,185,129,0.15)' : '0 4px 24px rgba(16,185,129,0.12)' },
        '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #10b981, transparent)' },
      }}>
        {/* Subject Icon */}
        <Box sx={{ flexShrink: 0, width: 52, height: 52, borderRadius: '12px', background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BookOpen size={22} color="#10b981" />
        </Box>

        {/* Info */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75 }}>
            {/* Pulsing LIVE badge */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, px: 1, py: 0.3, borderRadius: '6px', bgcolor: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)' }}>
              <Box component={motion.div} animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
                sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10b981', boxShadow: '0 0 6px #10b981' }} />
              <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6rem', fontWeight: 900, color: '#10b981', letterSpacing: 1 }}>LIVE</Typography>
            </Box>
            <Chip label={room.subject || 'General'} size="small"
              sx={{ bgcolor: 'rgba(99,102,241,0.1)', color: '#818cf8', fontWeight: 700, fontFamily: 'monospace', fontSize: '0.65rem' }} />
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: isDark ? 'white' : '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {room.title || 'Study Room'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Users size={12} color="rgba(156,163,175,0.8)" />
            <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', fontFamily: 'monospace', fontWeight: 600 }}>
              {count} {count === 1 ? 'scholar' : 'scholars'} active
            </Typography>
          </Box>
        </Box>

        {/* Join Button */}
        <Button
          variant="contained"
          onClick={() => onJoin(room.roomId)}
          endIcon={<ArrowRight size={14} />}
          sx={{
            flexShrink: 0, bgcolor: '#10b981', color: '#022c22', fontWeight: 800,
            borderRadius: '10px', px: 2.5, py: 1, textTransform: 'none', fontSize: '0.85rem',
            boxShadow: '0 4px 12px rgba(16,185,129,0.35)',
            '&:hover': { bgcolor: '#34d399', boxShadow: '0 4px 16px rgba(16,185,129,0.5)' },
            transition: 'all 0.2s',
          }}
        >
          Join Now
        </Button>
      </Box>
    </motion.div>
  );
}

export default function LiveRooms() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initial fetch
  useEffect(() => {
    api.get('/rooms/live')
      .then(r => setRooms(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Real-time updates
  useEffect(() => {
    if (!socket) return;
    const handler = (updatedRooms) => setRooms(updatedRooms || []);
    socket.on('live_rooms_update', handler);
    return () => socket.off('live_rooms_update', handler);
  }, [socket]);

  const handleJoin = async (roomId) => {
    try {
      await api.post(`/sessions/${roomId}/join`);
      toast.success('Joining study room...');
    } catch {
      // Already a member or auto-join will handle it
    }
    navigate(`/study-room/${roomId}`);
  };

  const surf = isDark ? '#080c14' : '#f6f8fa';
  const card = isDark ? '#0d1117' : '#ffffff';
  const border = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: surf, color: isDark ? '#e5e7eb' : '#111827', fontFamily: "'Inter', sans-serif", pb: 8 }}>
      <Box sx={{ maxWidth: 900, mx: 'auto', px: { xs: 2, md: 4 }, pt: 4 }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.65rem', color: '#10b981', fontWeight: 800, letterSpacing: 3, mb: 0.5 }}>
              ▸ LIVE · DISCOVERY
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: '12px', background: 'linear-gradient(135deg, #059669, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(16,185,129,0.35)' }}>
                <Radio size={22} color="white" />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '1.8rem', fontWeight: 900, color: isDark ? 'white' : '#0f172a', lineHeight: 1, letterSpacing: -1 }}>
                  Live Study Rooms
                </Typography>
                <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mt: 0.25 }}>
                  {rooms.length} {rooms.length === 1 ? 'room' : 'rooms'} active now — join one and study together
                </Typography>
              </Box>
            </Box>
          </Box>
        </motion.div>

        {/* Live Stats Banner */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Box sx={{ mb: 4, p: 2.5, borderRadius: '14px', bgcolor: card, border: `1px solid rgba(16,185,129,0.2)`, display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap', boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.06)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box component={motion.div} animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
                sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10b981', boxShadow: '0 0 8px #10b981' }} />
              <Typography sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.75rem', color: '#10b981' }}>REAL-TIME FEED</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Radio size={14} color="rgba(156,163,175,0.8)" />
              <Typography sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'text.secondary', fontWeight: 600 }}>
                {rooms.length} ACTIVE ROOMS
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Users size={14} color="rgba(156,163,175,0.8)" />
              <Typography sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'text.secondary', fontWeight: 600 }}>
                {rooms.reduce((a, r) => a + (r.participants?.length || 0), 0)} SCHOLARS STUDYING
              </Typography>
            </Box>
            <Box sx={{ ml: 'auto' }}>
              <Button onClick={() => navigate('/sessions')} variant="outlined" size="small"
                sx={{ borderRadius: '8px', fontWeight: 800, textTransform: 'none', borderColor: 'rgba(16,185,129,0.3)', color: '#10b981', '&:hover': { borderColor: '#10b981', bgcolor: 'rgba(16,185,129,0.05)' } }}
                startIcon={<Zap size={12} />}>
                Create Session
              </Button>
            </Box>
          </Box>
        </motion.div>

        {/* Room List */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#10b981' }} />
          </Box>
        ) : rooms.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <Box sx={{ textAlign: 'center', py: 12 }}>
              <Box component={motion.div} animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                sx={{ mb: 3, display: 'inline-block' }}>
                <Radio size={64} color="rgba(16,185,129,0.2)" />
              </Box>
              <Typography sx={{ fontSize: '1.3rem', fontWeight: 900, color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)', letterSpacing: -0.5, mb: 1 }}>
                No Live Sessions
              </Typography>
              <Typography sx={{ fontSize: '0.88rem', color: 'text.disabled', mb: 3 }}>
                No one is studying live right now. Start a session and others can join!
              </Typography>
              <Button onClick={() => navigate('/sessions')} variant="contained"
                sx={{ bgcolor: '#10b981', color: '#022c22', borderRadius: '10px', fontWeight: 800, px: 3, py: 1.25, textTransform: 'none', boxShadow: '0 4px 12px rgba(16,185,129,0.35)', '&:hover': { bgcolor: '#34d399' } }}
                startIcon={<Zap size={16} />}>
                Start a Study Session
              </Button>
            </Box>
          </motion.div>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <AnimatePresence mode="popLayout">
              {rooms.map((room, i) => (
                <LiveRoomCard key={room.roomId} room={room} index={i} onJoin={handleJoin} />
              ))}
            </AnimatePresence>
          </Box>
        )}
      </Box>
    </Box>
  );
}
