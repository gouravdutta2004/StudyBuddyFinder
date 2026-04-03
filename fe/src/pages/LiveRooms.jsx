import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Chip, Avatar, AvatarGroup, useTheme, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Users, BookOpen, ArrowRight, Zap, Lock, Globe, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

/* ── Avatar Stack component ── */
function ParticipantStack({ participants = [], max = 4 }) {
  const shown = participants.slice(0, max);
  const overflow = participants.length - max;
  return (
    <AvatarGroup
      max={max + 1}
      sx={{
        '& .MuiAvatar-root': {
          width: 26, height: 26, fontSize: '0.65rem', fontWeight: 800,
          border: '2px solid', borderColor: 'background.paper',
        },
      }}
    >
      {shown.map((p, i) => (
        <Avatar key={i} src={p.avatar || undefined} sx={{ bgcolor: `hsl(${(i * 60 + 200) % 360}, 60%, 45%)` }}>
          {p.name?.[0] || '?'}
        </Avatar>
      ))}
      {overflow > 0 && (
        <Avatar sx={{ bgcolor: 'rgba(99,102,241,0.2)', color: '#818cf8', fontSize: '0.6rem', fontWeight: 900 }}>
          +{overflow}
        </Avatar>
      )}
    </AvatarGroup>
  );
}

/* ── Room Card ── */
function LiveRoomCard({ room, onJoin, index }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const count = room.participants?.length || 0;
  const isPrivate = room.isPrivate;

  const SUBJECT_COLORS = {
    'Mathematics': '#6366f1', 'Physics': '#22d3ee', 'Chemistry': '#10b981',
    'Biology': '#22c55e', 'History': '#f59e0b', 'Computer Science': '#a78bfa',
    'Literature': '#fb7185', 'Economics': '#f97316',
  };
  const subjectColor = SUBJECT_COLORS[room.subject] || '#6366f1';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 300, damping: 28 }}
      whileHover={{ y: -3 }}
    >
      <Box sx={{
        p: 3, borderRadius: '18px',
        bgcolor: isDark ? '#0d1117' : '#ffffff',
        border: '1px solid',
        borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.25)' : '0 4px 16px rgba(0,0,0,0.06)',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: subjectColor + '44',
          boxShadow: `0 8px 32px ${subjectColor}18`,
        },
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Top border accent */}
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, bgcolor: subjectColor, opacity: 0.7, borderRadius: '18px 18px 0 0' }} />

        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          {/* Subject icon */}
          <Box sx={{
            flexShrink: 0, width: 48, height: 48, borderRadius: '12px',
            bgcolor: subjectColor + '18', border: `1px solid ${subjectColor}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BookOpen size={22} color={subjectColor} />
          </Box>

          {/* Info */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Badges row */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75, flexWrap: 'wrap' }}>
              {/* LIVE dot */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, px: 1, py: 0.3, borderRadius: '6px', bgcolor: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)' }}>
                <Box
                  component={motion.div}
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#10b981', boxShadow: '0 0 5px #10b981' }}
                />
                <Typography sx={{ fontFamily: 'monospace', fontSize: '0.58rem', fontWeight: 900, color: '#10b981', letterSpacing: 1 }}>LIVE</Typography>
              </Box>

              {/* Subject chip */}
              <Chip
                label={room.subject || 'General'}
                size="small"
                sx={{ bgcolor: subjectColor + '15', color: subjectColor, fontWeight: 700, fontSize: '0.65rem', height: 22, border: `1px solid ${subjectColor}25` }}
              />

              {/* Private/Public */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
                {isPrivate
                  ? <Lock size={12} color="rgba(156,163,175,0.7)" />
                  : <Globe size={12} color="rgba(156,163,175,0.7)" />
                }
                <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled', fontWeight: 600 }}>
                  {isPrivate ? 'Private' : 'Public'}
                </Typography>
              </Box>
            </Box>

            {/* Title */}
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: isDark ? 'white' : '#0f172a', mb: 0.75, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {room.title || 'Study Room'}
            </Typography>

            {/* Host + participants */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {/* Avatar stack */}
                <ParticipantStack participants={room.participants || []} max={4} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Users size={12} color="rgba(156,163,175,0.7)" />
                  <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', fontWeight: 600 }}>
                    {count} {count === 1 ? 'member' : 'members'}
                  </Typography>
                </Box>
              </Box>

              {/* Join button */}
              <Button
                size="small"
                onClick={() => onJoin(room)}
                endIcon={<LogIn size={13} />}
                sx={{
                  bgcolor: subjectColor, color: 'white',
                  borderRadius: '10px', px: 2, py: 0.75,
                  textTransform: 'none', fontWeight: 700, fontSize: '0.8rem',
                  flexShrink: 0,
                  boxShadow: `0 4px 12px ${subjectColor}44`,
                  '&:hover': { opacity: 0.9, boxShadow: `0 6px 16px ${subjectColor}55` },
                  transition: 'all 0.2s',
                }}
              >
                Join
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Topics row if present */}
        {room.topics?.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.75, mt: 2, pt: 2, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, flexWrap: 'wrap' }}>
            {room.topics.slice(0, 4).map(t => (
              <Box key={t} sx={{ px: 1.25, py: 0.3, borderRadius: '6px', bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}` }}>
                <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: 'text.secondary' }}>#{t}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </motion.div>
  );
}

/* ── Join Confirm Dialog ── */
function JoinDialog({ room, open, onClose, onConfirm }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  if (!room) return null;

  return (
    <Dialog
      open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{
        sx: {
          borderRadius: '20px',
          bgcolor: isDark ? '#0d1117' : '#ffffff',
          border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, fontSize: '1.1rem', color: isDark ? 'white' : '#0f172a', pb: 1 }}>
        Join Study Room
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: isDark ? 'white' : '#0f172a' }}>
            {room.title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip label={room.subject || 'General'} size="small" sx={{ bgcolor: 'rgba(99,102,241,0.1)', color: '#818cf8', fontWeight: 700, fontSize: '0.7rem' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Users size={13} color="rgba(156,163,175,0.7)" />
              <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{room.participants?.length || 0} members active</Typography>
            </Box>
          </Box>
          <ParticipantStack participants={room.participants || []} max={6} />
          <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', lineHeight: 1.6 }}>
            You're about to join this live study session. You can leave at any time.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={onClose} sx={{ borderRadius: '10px', textTransform: 'none', color: 'text.secondary', fontWeight: 600 }}>
          Cancel
        </Button>
        <Button onClick={onConfirm} variant="contained"
          sx={{ borderRadius: '10px', bgcolor: '#10b981', color: 'white', textTransform: 'none', fontWeight: 700, px: 3, boxShadow: '0 4px 12px rgba(16,185,129,0.4)', '&:hover': { bgcolor: '#059669' } }}
          startIcon={<LogIn size={15} />}
        >
          Join Room
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ── Main Page ── */
export default function LiveRooms() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [filterSubject, setFilterSubject] = useState('All');

  useEffect(() => {
    api.get('/rooms/live')
      .then(r => setRooms(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = (updatedRooms) => setRooms(updatedRooms || []);
    socket.on('live_rooms_update', handler);
    return () => socket.off('live_rooms_update', handler);
  }, [socket]);

  const handleJoinRoom = (room) => setSelectedRoom(room);

  const handleConfirmJoin = async () => {
    if (!selectedRoom) return;
    try {
      await api.post(`/sessions/${selectedRoom.roomId}/join`);
    } catch { /* already joined */ }
    navigate(`/study-room/${selectedRoom.roomId}`);
  };

  // Subject filter
  const subjects = ['All', ...new Set(rooms.map(r => r.subject).filter(Boolean))];
  const filtered = filterSubject === 'All' ? rooms : rooms.filter(r => r.subject === filterSubject);

  const totalParticipants = rooms.reduce((a, r) => a + (r.participants?.length || 0), 0);

  const surf = isDark ? '#080c14' : '#f6f8fa';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: surf, pb: 8 }}>
      <Box sx={{ maxWidth: 900, mx: 'auto', px: { xs: 2, md: 4 }, pt: 4 }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: '12px', background: 'linear-gradient(135deg, #059669, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(16,185,129,0.35)' }}>
                <Radio size={22} color="white" />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '1.8rem', fontWeight: 900, color: isDark ? 'white' : '#0f172a', lineHeight: 1, letterSpacing: -1 }}>
                  Live Study Rooms
                </Typography>
                <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mt: 0.25 }}>
                  Browse active rooms · Join and study together in real-time
                </Typography>
              </Box>
            </Box>
          </Box>
        </motion.div>

        {/* Stats banner */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Box sx={{ mb: 3, p: 2.5, borderRadius: '14px', bgcolor: isDark ? '#0d1117' : '#ffffff', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap', boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.25)' : '0 4px 16px rgba(0,0,0,0.06)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box component={motion.div} animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
                sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10b981', boxShadow: '0 0 8px #10b981' }} />
              <Typography sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.75rem', color: '#10b981' }}>REAL-TIME</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Radio size={14} color="rgba(156,163,175,0.8)" />
              <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 700 }}>
                <strong>{rooms.length}</strong> active rooms
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Users size={14} color="rgba(156,163,175,0.8)" />
              <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 700 }}>
                <strong>{totalParticipants}</strong> studying now
              </Typography>
            </Box>
            <Box sx={{ ml: 'auto' }}>
              <Button onClick={() => navigate('/sessions')} variant="outlined" size="small"
                startIcon={<Zap size={13} />}
                sx={{ borderRadius: '10px', fontWeight: 700, textTransform: 'none', borderColor: 'rgba(16,185,129,0.3)', color: '#10b981', '&:hover': { borderColor: '#10b981', bgcolor: 'rgba(16,185,129,0.05)' } }}>
                Create Session
              </Button>
            </Box>
          </Box>
        </motion.div>

        {/* Subject filter pills */}
        {!loading && rooms.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
              {subjects.map(s => (
                <Chip
                  key={s} label={s} size="small"
                  onClick={() => setFilterSubject(s)}
                  sx={{
                    cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', transition: 'all 0.15s',
                    bgcolor: filterSubject === s ? '#10b981' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                    color: filterSubject === s ? '#022c22' : 'text.secondary',
                    border: `1px solid ${filterSubject === s ? '#10b981' : 'transparent'}`,
                    '&:hover': { bgcolor: filterSubject === s ? '#059669' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)') },
                  }}
                />
              ))}
            </Box>
          </motion.div>
        )}

        {/* Room list */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress sx={{ color: '#10b981' }} />
          </Box>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Box sx={{ textAlign: 'center', py: 12 }}>
              <Box component={motion.div} animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }} sx={{ mb: 3, display: 'inline-block' }}>
                <Radio size={60} color="rgba(16,185,129,0.2)" />
              </Box>
              <Typography sx={{ fontSize: '1.3rem', fontWeight: 900, color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)', letterSpacing: -0.5, mb: 1 }}>
                No Live Rooms {filterSubject !== 'All' ? `for ${filterSubject}` : ''}
              </Typography>
              <Typography sx={{ fontSize: '0.88rem', color: 'text.disabled', mb: 3 }}>
                Be the first to start a study session!
              </Typography>
              <Button onClick={() => navigate('/sessions')} variant="contained"
                sx={{ bgcolor: '#10b981', color: '#022c22', borderRadius: '12px', fontWeight: 700, px: 3, py: 1.25, textTransform: 'none', boxShadow: '0 4px 12px rgba(16,185,129,0.35)', '&:hover': { bgcolor: '#059669' } }}
                startIcon={<Zap size={16} />}>
                Start a Session
              </Button>
            </Box>
          </motion.div>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <AnimatePresence mode="popLayout">
              {filtered.map((room, i) => (
                <LiveRoomCard key={room.roomId} room={room} index={i} onJoin={handleJoinRoom} />
              ))}
            </AnimatePresence>
          </Box>
        )}
      </Box>

      {/* Join confirmation dialog */}
      <JoinDialog
        room={selectedRoom}
        open={!!selectedRoom}
        onClose={() => setSelectedRoom(null)}
        onConfirm={handleConfirmJoin}
      />
    </Box>
  );
}
