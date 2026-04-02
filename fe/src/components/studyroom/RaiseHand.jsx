import { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Avatar, Tooltip } from '@mui/material';
import { Hand, X, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

export default function RaiseHand({ socket, roomId, session, isDark }) {
  const { user } = useAuth();
  const isHost = session?.host?._id === user?._id || session?.host === user?._id;
  const [queue, setQueue] = useState([]); // [{ userId, name, avatar }]
  const [myHandUp, setMyHandUp] = useState(false);

  useEffect(() => {
    if (!socket) return;
    const onRaise = (data) => setQueue(prev => prev.find(p => p.userId === data.userId) ? prev : [...prev, data]);
    const onLower = ({ userId }) => {
      setQueue(prev => prev.filter(p => p.userId !== userId));
      if (userId === user?._id) setMyHandUp(false);
    };
    const onSync = ({ queue: q }) => setQueue(q);
    socket.on('hand:raise', onRaise);
    socket.on('hand:lower', onLower);
    socket.on('hand:sync', onSync);
    return () => { socket.off('hand:raise', onRaise); socket.off('hand:lower', onLower); socket.off('hand:sync', onSync); };
  }, [socket, user]);

  const toggle = () => {
    if (myHandUp) {
      socket?.emit('hand:lower', { roomId, userId: user._id });
      setMyHandUp(false);
    } else {
      const data = { roomId, userId: user._id, name: user.name, avatar: user.avatar };
      socket?.emit('hand:raise', data);
      setMyHandUp(true);
    }
  };

  const dismiss = (userId) => socket?.emit('hand:lower', { roomId, userId });

  const accent = '#f59e0b';
  const bg = isDark ? '#18181b' : '#f4f4f5';

  return (
    <Box sx={{ p: 2, borderRadius: 3, bgcolor: bg, border: `1px solid ${isDark ? '#27272a' : '#e4e4e7'}` }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Hand size={15} color={accent} />
          <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: accent }}>
            Raise Hand {queue.length > 0 && `(${queue.length})`}
          </Typography>
        </Box>
        <Tooltip title={myHandUp ? 'Lower hand' : 'Raise hand'}>
          <IconButton
            size="small" onClick={toggle}
            sx={{
              bgcolor: myHandUp ? `${accent}33` : isDark ? '#27272a' : '#e4e4e7',
              color: myHandUp ? accent : isDark ? '#a1a1aa' : '#71717a',
              animation: myHandUp ? 'handWave 0.6s ease infinite alternate' : 'none',
              '@keyframes handWave': { '0%': { transform: 'rotate(-10deg)' }, '100%': { transform: 'rotate(10deg)' } },
              '&:hover': { bgcolor: `${accent}22` },
            }}
          >
            <Hand size={16} />
          </IconButton>
        </Tooltip>
      </Box>

      <AnimatePresence>
        {queue.length === 0 ? (
          <Typography sx={{ fontSize: '0.65rem', color: isDark ? '#52525b' : '#a1a1aa', textAlign: 'center', py: 1 }}>
            No hands raised
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {queue.map((p, i) => (
              <motion.div key={p.userId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, borderRadius: 2, bgcolor: isDark ? '#27272a' : '#e4e4e7' }}>
                  <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: accent, minWidth: 16 }}>#{i + 1}</Typography>
                  <Avatar src={p.avatar} sx={{ width: 22, height: 22, fontSize: '0.6rem' }}>{p.name?.[0]}</Avatar>
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, flex: 1, color: isDark ? '#f4f4f5' : '#18181b' }} noWrap>{p.name}</Typography>
                  {isHost && (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Call on them"><IconButton size="small" sx={{ color: '#10b981', p: 0.3 }} onClick={() => dismiss(p.userId)}><Volume2 size={13} /></IconButton></Tooltip>
                      <Tooltip title="Dismiss"><IconButton size="small" sx={{ color: '#ef4444', p: 0.3 }} onClick={() => dismiss(p.userId)}><X size={13} /></IconButton></Tooltip>
                    </Box>
                  )}
                </Box>
              </motion.div>
            ))}
          </Box>
        )}
      </AnimatePresence>
    </Box>
  );
}
