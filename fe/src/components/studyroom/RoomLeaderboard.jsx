import { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Chip } from '@mui/material';
import { Trophy, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

export default function RoomLeaderboard({ socket, roomId, isDark }) {
  const { user } = useAuth();
  const [board, setBoard] = useState({}); // { userId: { name, avatar, xp, rank } }

  const bg = isDark ? '#18181b' : '#f4f4f5';
  const border = isDark ? '#27272a' : '#e4e4e7';
  const text = isDark ? '#f4f4f5' : '#18181b';
  const muted = isDark ? '#52525b' : '#a1a1aa';
  const accent = '#f59e0b';

  useEffect(() => {
    if (!socket) return;
    // Earn XP from chat messages
    socket.on('room_message', (msg) => {
      setBoard(prev => ({
        ...prev,
        [msg.senderId]: {
          name: msg.sender,
          xp: ((prev[msg.senderId]?.xp) || 0) + 5,
          rank: 0,
        }
      }));
    });
    socket.on('leaderboard:update', (data) => setBoard(data));
    // Earn XP for raising hand, voting, etc
    socket.on('hand:raise', (data) => {
      setBoard(prev => ({
        ...prev,
        [data.userId]: { ...prev[data.userId], name: data.name, xp: ((prev[data.userId]?.xp) || 0) + 10 }
      }));
    });
    socket.on('poll:vote', (data) => {
      if (data.userId === user?._id) {
        setBoard(prev => ({
          ...prev,
          [user._id]: { ...prev[user._id], name: user.name, xp: ((prev[user._id]?.xp) || 0) + 15 }
        }));
      }
    });
  }, [socket, user]);

  // Periodically broadcast board (host only — but we'll just compute locally)
  const sorted = Object.entries(board)
    .map(([id, d]) => ({ id, ...d }))
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 5);

  const MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

  return (
    <Box sx={{ p: 2, borderRadius: 3, bgcolor: bg, border: `1px solid ${border}` }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Trophy size={15} color={accent} />
        <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: accent }}>
          Session XP
        </Typography>
        <TrendingUp size={11} color={accent} style={{ marginLeft: 'auto' }} />
      </Box>

      {sorted.length === 0 ? (
        <Typography sx={{ fontSize: '0.65rem', color: muted, textAlign: 'center', py: 1 }}>
          Chat, vote & raise hands to earn XP!
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          <AnimatePresence>
            {sorted.map((p, i) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              >
                <Box sx={{
                  display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.75,
                  borderRadius: 2,
                  bgcolor: p.id === user?._id ? (isDark ? '#1c1917' : '#fef3c7') : (isDark ? '#27272a' : '#fff'),
                  border: `1px solid ${p.id === user?._id ? '#f59e0b44' : border}`,
                }}>
                  <Typography sx={{ fontSize: '0.75rem', minWidth: 20 }}>{MEDALS[i]}</Typography>
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, flex: 1, color: text }} noWrap>
                    {p.id === user?._id ? 'You' : p.name}
                  </Typography>
                  <Chip
                    label={`+${p.xp} XP`}
                    size="small"
                    sx={{ height: 18, fontSize: '0.58rem', fontWeight: 800, bgcolor: `${accent}22`, color: accent, '& .MuiChip-label': { px: 0.75 } }}
                  />
                </Box>
              </motion.div>
            ))}
          </AnimatePresence>
        </Box>
      )}
    </Box>
  );
}
