import React, { useState, useEffect, useRef } from 'react';
import { Box, Container, Typography, IconButton, Button, Avatar, Paper, Grid, useTheme, AvatarGroup, Tooltip } from '@mui/material';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Coffee, Brain, Users, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const POMODORO = 25 * 60;
const SHORT_BREAK = 5 * 60;

export default function PomodoroFocus() {
  const { user, setUser } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [timeLeft, setTimeLeft] = useState(POMODORO);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('focus'); // 'focus' or 'break'
  const [sessionCount, setSessionCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Mock global scholars
  const [onlineScholars, setOnlineScholars] = useState([
    { _id: '1', name: 'Alex T.', avatar: '', state: 'focus' },
    { _id: '2', name: 'Sarah M.', avatar: '', state: 'break' },
    { _id: '3', name: 'David K.', avatar: '', state: 'focus' },
  ]);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      handleComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleComplete = async () => {
    setIsActive(false);
    if (soundEnabled) {
      const audio = new Audio('/bell.mp3');
      audio.play().catch(() => {});
    }

    if (mode === 'focus') {
      setSessionCount(c => c + 1);
      setMode('break');
      setTimeLeft(SHORT_BREAK);
      toast.success('Focus session complete! Time for a short break.', { icon: '🎉' });
      
      // Log session end for XP and study hours (0.41 hours = 25 mins)
      try {
        const res = await api.post('/gamification/session-end', { hoursStudied: 25 / 60 });
        setUser({ ...user, xp: res.data.xp, studyHours: res.data.studyHours, level: res.data.level });
        toast.success(`+${Math.round((25/60)*100)} XP Earned!`);
      } catch (err) { }
    } else {
      setMode('focus');
      setTimeLeft(POMODORO);
      toast('Break is over! Back to work.', { icon: '⏰' });
    }
  };

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'focus' ? POMODORO : SHORT_BREAK);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(newMode === 'focus' ? POMODORO : SHORT_BREAK);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const totalDuration = mode === 'focus' ? POMODORO : SHORT_BREAK;
  const strokeDashoffset = circumference - (timeLeft / totalDuration) * circumference;

  return (
    <Box sx={{ minHeight: '100vh', pt: 10, pb: 4, bgcolor: mode === 'focus' ? (isDark ? '#020617' : '#f8fafc') : (isDark ? '#064e3b' : '#ecfdf5'), transition: 'background-color 0.5s ease', position: 'relative', overflow: 'hidden' }}>
      
      {/* Background Particles Element */}
      {isActive && mode === 'focus' && (
        <Box sx={{ position: 'absolute', inset: 0, opacity: 0.1, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle at center, #6366f1 1px, transparent 1px)', backgroundSize: '40px 40px', animation: 'drift 20s linear infinite' }}>
          <style>{`@keyframes drift { from { transform: translateY(0); } to { transform: translateY(40px); } }`}</style>
        </Box>
      )}

      <Container maxWidth="lg">
        <Grid container spacing={4} justifyContent="center" alignItems="stretch">
          
          <Grid item xs={12} md={8}>
            <Paper elevation={isDark ? 8 : 2} sx={{ borderRadius: 6, p: { xs: 4, sm: 6 }, textAlign: 'center', bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'white', backdropFilter: 'blur(20px)', border: isDark ? '1px solid rgba(255,255,255,0.05)' : 'none', position: 'relative' }}>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h5" fontWeight={900} display="flex" alignItems="center" gap={1.5} color="text.primary">
                  {mode === 'focus' ? <Brain size={28} color="#6366f1" /> : <Coffee size={28} color="#10b981" />}
                  {mode === 'focus' ? 'Deep Work Sandbox' : 'Rest Sequence'}
                </Typography>
                <IconButton onClick={() => setSoundEnabled(!soundEnabled)} sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                  {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </IconButton>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 6 }}>
                <Button variant={mode === 'focus' ? 'contained' : 'outlined'} onClick={() => switchMode('focus')} sx={{ borderRadius: 10, px: 4, fontWeight: 800, bgcolor: mode === 'focus' ? '#6366f1' : 'transparent', color: mode === 'focus' ? 'white' : 'text.primary', border: mode !== 'focus' ? '1px solid rgba(150,150,150,0.3)' : 'none', '&:hover': { bgcolor: mode === 'focus' ? '#4f46e5' : 'rgba(99,102,241,0.1)', border: 'none' }}}>Pomodoro</Button>
                <Button variant={mode === 'break' ? 'contained' : 'outlined'} onClick={() => switchMode('break')} sx={{ borderRadius: 10, px: 4, fontWeight: 800, bgcolor: mode === 'break' ? '#10b981' : 'transparent', color: mode === 'break' ? 'white' : 'text.primary', border: mode !== 'break' ? '1px solid rgba(150,150,150,0.3)' : 'none', '&:hover': { bgcolor: mode === 'break' ? '#059669' : 'rgba(16,185,129,0.1)', border: 'none' }}}>Short Break</Button>
              </Box>

              <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', my: 4 }}>
                <svg width="300" height="300" viewBox="0 0 300 300" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="150" cy="150" r={radius} fill="none" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} strokeWidth="16" />
                  <motion.circle cx="150" cy="150" r={radius} fill="none" stroke={mode === 'focus' ? "#6366f1" : "#10b981"} strokeWidth="16" strokeLinecap="round" style={{ strokeDasharray: circumference, strokeDashoffset }} transition={{ duration: 1, ease: 'linear' }} />
                </svg>
                <Box sx={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography variant="h1" fontWeight={900} sx={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-2px', color: 'text.primary', fontSize: { xs: '4rem', sm: '5.5rem' } }}>
                    {formatTime(timeLeft)}
                  </Typography>
                  <Typography variant="overline" color="text.secondary" fontWeight={800} letterSpacing={2}>
                    {isActive ? (mode === 'focus' ? 'DO NOT DISTURB' : 'RECHARGING') : 'READY TO INITIALIZE'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 4 }}>
                <IconButton onClick={toggleTimer} sx={{ width: 72, height: 72, bgcolor: isActive ? 'rgba(239,68,68,0.1)' : (mode === 'focus' ? 'rgba(99,102,241,0.1)' : 'rgba(16,185,129,0.1)'), color: isActive ? '#ef4444' : (mode === 'focus' ? '#6366f1' : '#10b981'), '&:hover': { bgcolor: isActive ? '#ef4444' : (mode === 'focus' ? '#6366f1' : '#10b981'), color: 'white' }, transition: 'all 0.2s' }}>
                  {isActive ? <Pause size={32} /> : <Play size={32} style={{ marginLeft: 4 }} />}
                </IconButton>
                <IconButton onClick={resetTimer} sx={{ width: 72, height: 72, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' } }}>
                  <RotateCcw size={32} />
                </IconButton>
              </Box>

            </Paper>
          </Grid>

          {/* Right Column: Multiplayer Metrics */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              
              <Paper elevation={isDark ? 8 : 2} sx={{ borderRadius: 6, p: 3, bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'white', backdropFilter: 'blur(20px)', border: isDark ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <Typography variant="h6" fontWeight={800} display="flex" alignItems="center" gap={1} mb={3}>
                  <Award size={20} color="#f59e0b" /> Today's Yield
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)', p: 2, borderRadius: 3, mb: 2 }}>
                  <Typography variant="body2" fontWeight={700} color="text.secondary">Completed Cycles</Typography>
                  <Typography variant="h5" fontWeight={900} color="primary.main">{sessionCount}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)', p: 2, borderRadius: 3 }}>
                  <Typography variant="body2" fontWeight={700} color="text.secondary">Est. XP Gained</Typography>
                  <Typography variant="h5" fontWeight={900} color="#f59e0b">+{sessionCount * 41}</Typography>
                </Box>
              </Paper>

              <Paper elevation={isDark ? 8 : 2} sx={{ borderRadius: 6, p: 3, bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'white', backdropFilter: 'blur(20px)', border: isDark ? '1px solid rgba(255,255,255,0.05)' : 'none', flex: 1 }}>
                <Typography variant="h6" fontWeight={800} display="flex" alignItems="center" gap={1} mb={1}>
                  <Users size={20} color="#8b5cf6" /> Live Matrix
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  {onlineScholars.length} scholars deeply focusing right now globally.
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <AnimatePresence>
                    {onlineScholars.map(scholar => (
                      <motion.div key={scholar._id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, borderRadius: 3, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                          <Box sx={{ position: 'relative' }}>
                            <Avatar src={scholar.avatar} sx={{ width: 40, height: 40, bgcolor: '#8b5cf6', fontWeight: 700 }}>{scholar.name[0]}</Avatar>
                            <Box sx={{ position: 'absolute', bottom: -2, right: -2, width: 12, height: 12, borderRadius: '50%', bgcolor: scholar.state === 'focus' ? '#ef4444' : '#10b981', border: `2px solid ${isDark ? '#1e293b' : 'white'}` }} />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" fontWeight={700}>{scholar.name}</Typography>
                            <Typography variant="caption" color={scholar.state === 'focus' ? '#ef4444' : '#10b981'} fontWeight={800}>
                              {scholar.state === 'focus' ? 'Deep Work' : 'Recharging'}
                            </Typography>
                          </Box>
                        </Box>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </Box>
              </Paper>

            </Box>
          </Grid>

        </Grid>
      </Container>
    </Box>
  );
}
