import { useState, useEffect } from 'react';
import { Box, Typography, Button, Chip, Avatar } from '@mui/material';
import { BarChart2, Clock, MessageSquare, Hand, Trophy, Zap, Share2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

export default function SessionReport({ socket, roomId, session, isDark, onClose }) {
  const { user } = useAuth();
  const [stats, setStats] = useState({ messages: 0, handRaises: 0, pollVotes: 0, pomoCycles: 0, xpEarned: 0, minutesFocused: 0, joinTime: Date.now() });

  const bg = isDark ? '#18181b' : '#ffffff';
  const border = isDark ? '#27272a' : '#e4e4e7';
  const text = isDark ? '#f4f4f5' : '#18181b';
  const muted = isDark ? '#71717a' : '#a1a1aa';

  useEffect(() => {
    if (!socket) return;
    socket.on('room_message', msg => { if (msg.senderId === user?._id) setStats(s => ({ ...s, messages: s.messages + 1, xpEarned: s.xpEarned + 5 })); });
    socket.on('hand:raise', d => { if (d.userId === user?._id) setStats(s => ({ ...s, handRaises: s.handRaises + 1, xpEarned: s.xpEarned + 10 })); });
    socket.on('poll:vote', d => { if (d.userId === user?._id) setStats(s => ({ ...s, pollVotes: s.pollVotes + 1, xpEarned: s.xpEarned + 15 })); });
    socket.on('pomodoro:sync', d => { if (!d.running && d.mode === 'break') setStats(s => ({ ...s, pomoCycles: s.pomoCycles + 1, minutesFocused: s.minutesFocused + 25, xpEarned: s.xpEarned + 42 })); });
  }, [socket, user]);

  const elapsed = Math.round((Date.now() - stats.joinTime) / 60000);

  const ITEMS = [
    { icon: <Clock size={16} color="#6366f1" />, label: 'Time in Room', val: `${elapsed}m`, color: '#6366f1' },
    { icon: <MessageSquare size={16} color="#3b82f6" />, label: 'Messages', val: stats.messages, color: '#3b82f6' },
    { icon: <Hand size={16} color="#f59e0b" />, label: 'Hand Raises', val: stats.handRaises, color: '#f59e0b' },
    { icon: <BarChart2 size={16} color="#8b5cf6" />, label: 'Poll Votes', val: stats.pollVotes, color: '#8b5cf6' },
    { icon: <Clock size={16} color="#10b981" />, label: 'Focus Cycles', val: stats.pomoCycles, color: '#10b981' },
    { icon: <Zap size={16} color="#f97316" />, label: 'XP Earned', val: `+${stats.xpEarned}`, color: '#f97316' },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      >
        <Box sx={{ width: 360, bgcolor: bg, borderRadius: 4, border: `1px solid ${border}`, boxShadow: '0 24px 64px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
          {/* Header */}
          <Box sx={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', p: 3, position: 'relative' }}>
            <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
              <Button size="small" onClick={onClose} sx={{ minWidth: 0, p: 0.5, color: 'rgba(255,255,255,0.7)' }}><X size={16} /></Button>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}><Trophy size={24} color="white" /></Avatar>
              <Box>
                <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Session Complete</Typography>
                <Typography sx={{ color: 'white', fontWeight: 900, fontSize: '1.1rem' }}>{session?.title}</Typography>
              </Box>
            </Box>
          </Box>

          {/* Stats grid */}
          <Box sx={{ p: 2.5, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            {ITEMS.map(item => (
              <Box key={item.label} sx={{ p: 1.5, borderRadius: 3, bgcolor: isDark ? '#27272a' : '#f4f4f5', border: `1px solid ${border}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                  {item.icon}
                  <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.label}</Typography>
                </Box>
                <Typography sx={{ fontSize: '1.4rem', fontWeight: 900, color: item.color, lineHeight: 1 }}>{item.val}</Typography>
              </Box>
            ))}
          </Box>

          {/* Footer */}
          <Box sx={{ px: 2.5, pb: 2.5, display: 'flex', gap: 1 }}>
            <Button fullWidth variant="contained" startIcon={<Share2 size={14} />} size="small"
              onClick={() => { if (navigator.share) navigator.share({ title: 'My Study Session', text: `Studied for ${elapsed} min and earned +${stats.xpEarned} XP on StudyBuddy!` }); }}
              sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, borderRadius: 2, textTransform: 'none', fontSize: '0.72rem', fontWeight: 700 }}>
              Share
            </Button>
            <Button fullWidth variant="outlined" size="small" onClick={onClose}
              sx={{ borderColor: border, color: text, borderRadius: 2, textTransform: 'none', fontSize: '0.72rem' }}>
              Close
            </Button>
          </Box>
        </Box>
      </motion.div>
    </AnimatePresence>
  );
}
