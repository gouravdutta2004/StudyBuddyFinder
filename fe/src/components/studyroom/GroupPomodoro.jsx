import { useState, useEffect, useRef } from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { Play, Pause, RotateCcw, Timer, Coffee } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const FOCUS = 25 * 60;
const BREAK = 5 * 60;

export default function GroupPomodoro({ socket, roomId, session, isDark }) {
  const { user } = useAuth();
  const isHost = session?.host?._id === user?._id || session?.host === user?._id;

  const [timeLeft, setTimeLeft] = useState(FOCUS);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState('focus'); // 'focus' | 'break'
  const intervalRef = useRef(null);

  const bg = isDark ? '#18181b' : '#f4f4f5';
  const accent = mode === 'focus' ? '#6366f1' : '#10b981';
  const total = mode === 'focus' ? FOCUS : BREAK;
  const pct = ((total - timeLeft) / total) * 100;

  const fmt = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // Socket listeners
  useEffect(() => {
    if (!socket) return;
    const onSync = ({ timeLeft: t, running: r, mode: m }) => {
      setTimeLeft(t); setRunning(r); setMode(m);
    };
    const onTick = ({ timeLeft: t }) => setTimeLeft(t);
    socket.on('pomodoro:sync', onSync);
    socket.on('pomodoro:tick', onTick);
    return () => { socket.off('pomodoro:sync', onSync); socket.off('pomodoro:tick', onTick); };
  }, [socket]);

  // Host-only: tick interval
  useEffect(() => {
    if (!isHost) return;
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const next = prev - 1;
          socket?.emit('pomodoro:tick', { roomId, timeLeft: next });
          if (next <= 0) {
            clearInterval(intervalRef.current);
            const nextMode = mode === 'focus' ? 'break' : 'focus';
            const nextTime = nextMode === 'focus' ? FOCUS : BREAK;
            setMode(nextMode); setRunning(false); setTimeLeft(nextTime);
            socket?.emit('pomodoro:sync', { roomId, timeLeft: nextTime, running: false, mode: nextMode });
            try { new Audio('/bell.mp3').play(); } catch {}
          }
          return next;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, isHost, mode, roomId, socket]);

  const broadcast = (newRunning, newMode = mode, newTime = timeLeft) => {
    socket?.emit('pomodoro:sync', { roomId, timeLeft: newTime, running: newRunning, mode: newMode });
  };

  const toggle = () => { const r = !running; setRunning(r); broadcast(r); };
  const reset = () => {
    clearInterval(intervalRef.current);
    setRunning(false); setTimeLeft(FOCUS); setMode('focus');
    broadcast(false, 'focus', FOCUS);
  };

  return (
    <Box sx={{ p: 2, borderRadius: 3, bgcolor: bg, border: `1px solid ${isDark ? '#27272a' : '#e4e4e7'}` }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {mode === 'focus' ? <Timer size={15} color={accent} /> : <Coffee size={15} color={accent} />}
          <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: accent }}>
            {mode === 'focus' ? 'Group Focus' : 'Group Break'}
          </Typography>
        </Box>
        {!isHost && (
          <Typography sx={{ fontSize: '0.58rem', color: isDark ? '#52525b' : '#a1a1aa', fontWeight: 600 }}>HOST CONTROLS</Typography>
        )}
      </Box>

      {/* Progress ring */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', my: 1 }}>
        <Box sx={{ position: 'relative', width: 80, height: 80 }}>
          <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="40" cy="40" r="34" fill="none" stroke={isDark ? '#27272a' : '#e4e4e7'} strokeWidth="6" />
            <motion.circle
              cx="40" cy="40" r="34" fill="none" stroke={accent} strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 34}
              strokeDashoffset={2 * Math.PI * 34 * (1 - pct / 100)}
              transition={{ duration: 0.8 }}
            />
          </svg>
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ fontWeight: 900, fontSize: '0.9rem', fontVariantNumeric: 'tabular-nums', color: isDark ? '#f4f4f5' : '#18181b' }}>
              {fmt(timeLeft)}
            </Typography>
          </Box>
        </Box>
      </Box>

      {isHost && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
          <Tooltip title={running ? 'Pause' : 'Start'}>
            <IconButton size="small" onClick={toggle} sx={{ bgcolor: `${accent}22`, color: accent, '&:hover': { bgcolor: `${accent}44` } }}>
              {running ? <Pause size={16} /> : <Play size={16} />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Reset">
            <IconButton size="small" onClick={reset} sx={{ bgcolor: isDark ? '#27272a' : '#e4e4e7', color: isDark ? '#a1a1aa' : '#71717a', '&:hover': { bgcolor: isDark ? '#3f3f46' : '#d4d4d8' } }}>
              <RotateCcw size={16} />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
}
