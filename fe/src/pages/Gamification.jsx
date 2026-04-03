import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Grid, Avatar, useTheme, Chip, CircularProgress, Tooltip, Button, LinearProgress } from '@mui/material';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { Zap, Flame, Trophy, Shield, Target, CheckCircle2, Circle, Star, TrendingUp, Lock, Unlock, ChevronRight, Award, Cpu, Wifi } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';
import { format, subDays } from 'date-fns';

/* ─── Tier Config ─── */
const TIERS = {
  bronze: {
    label: 'BRONZE',        rank: 1,
    color: '#f59e0b',       glow: 'rgba(245,158,11,0.3)',
    gradient: 'linear-gradient(135deg,#78350f,#f59e0b)',
    bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)',
    ring: ['#f59e0b', '#fcd34d'],
    bars: '#f59e0b',
  },
  silver: {
    label: 'SILVER',        rank: 2,
    color: '#94a3b8',       glow: 'rgba(148,163,184,0.25)',
    gradient: 'linear-gradient(135deg,#334155,#94a3b8)',
    bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.3)',
    ring: ['#94a3b8', '#e2e8f0'],
    bars: '#94a3b8',
  },
  gold: {
    label: 'GOLD',          rank: 3,
    color: '#eab308',       glow: 'rgba(234,179,8,0.35)',
    gradient: 'linear-gradient(135deg,#713f12,#eab308)',
    bg: 'rgba(234,179,8,0.1)',   border: 'rgba(234,179,8,0.4)',
    ring: ['#eab308', '#fef08a'],
    bars: '#eab308',
  },
  diamond: {
    label: 'DIAMOND',       rank: 4,
    color: '#38bdf8',       glow: 'rgba(56,189,248,0.35)',
    gradient: 'linear-gradient(135deg,#0c4a6e,#38bdf8)',
    bg: 'rgba(56,189,248,0.1)',  border: 'rgba(56,189,248,0.4)',
    ring: ['#38bdf8', '#bae6fd'],
    bars: '#38bdf8',
  },
};

function getTier(level) {
  if (level >= 20) return 'diamond';
  if (level >= 10) return 'gold';
  if (level >= 5)  return 'silver';
  return 'bronze';
}

/* ─── Animated Counter ─── */
function AnimatedNumber({ target, suffix = '', fontSize = '2.5rem', color = 'white' }) {
  const val = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(val, target, { duration: 1.6, ease: 'easeOut' });
    val.on('change', v => setDisplay(Math.round(v)));
    return controls.stop;
  }, [target]);

  return (
    <Typography component="span" fontWeight={900} fontSize={fontSize} color={color} fontFamily="'Courier New', monospace" sx={{ letterSpacing: '-1px' }}>
      {display.toLocaleString()}{suffix}
    </Typography>
  );
}

/* ─── Scanline overlay ─── */
function Scanlines() {
  return (
    <Box sx={{
      position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
      mixBlendMode: 'overlay',
    }} />
  );
}

/* ─── HUD Corner Marker ─── */
function HUDCorner({ flip = false }) {
  return (
    <Box sx={{
      position: 'absolute', width: 20, height: 20,
      ...(flip ? { bottom: 0, right: 0, borderBottom: '2px solid', borderRight: '2px solid' } : { top: 0, left: 0, borderTop: '2px solid', borderLeft: '2px solid' }),
      borderColor: 'rgba(99,102,241,0.5)',
    }} />
  );
}

/* ─── XP Orb Ring ─── */
function XPRing({ pct, tier }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <Box sx={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
      <svg width="140" height="140" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
        {/* Track */}
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        {/* Progress */}
        <motion.circle
          cx="70" cy="70" r={r} fill="none"
          stroke={tier.color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 2, ease: 'easeOut', delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 8px ${tier.glow})` }}
        />
        {/* Outer glow ring */}
        <circle cx="70" cy="70" r={r + 6} fill="none" stroke={tier.color} strokeWidth="1" opacity="0.2" />
      </svg>
      {/* Center level number */}
      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Typography fontWeight={900} fontSize="0.55rem" color={tier.color} sx={{ textTransform: 'uppercase', letterSpacing: 2, mb: 0.25 }}>LEVEL</Typography>
        <Typography fontWeight={900} fontSize="2.5rem" color="white" lineHeight={1} fontFamily="'Courier New', monospace">
          {'{LVL}'}
        </Typography>
      </Box>
    </Box>
  );
}

/* ─── Quest State Logic ───
   state: 'done' | 'inprogress' | 'auto'
   - done:       isCompleted === true
   - inprogress: progress > 0 && !isCompleted
   - auto:       progress === 0 && !isCompleted (will auto-trigger on action)
─────────────────────────── */
function QuestCard({ quest, index, isDark }) {
  const state = quest.isCompleted ? 'done'
              : (quest.progress > 0 ? 'inprogress' : 'auto');

  const progress = Math.min(quest.progress || 0, 100);

  const STATE = {
    done:       { color: '#22c55e', bg: 'rgba(34,197,94,0.07)',  border: 'rgba(34,197,94,0.28)',  leftBar: '#22c55e',  label: 'Completed',    labelColor: '#22c55e'  },
    inprogress: { color: '#f59e0b', bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.28)', leftBar: '#f59e0b',  label: 'In Progress',  labelColor: '#f59e0b'  },
    auto:       { color: '#a78bfa', bg: 'rgba(167,139,250,0.06)', border: 'rgba(167,139,250,0.22)', leftBar: '#a78bfa', label: 'Auto',         labelColor: '#a78bfa'  },
  }[state];

  const BADGE_STATE = {
    done:       { text: 'DONE',        bg: 'rgba(34,197,94,0.12)',   color: '#22c55e',  border: 'rgba(34,197,94,0.25)'   },
    inprogress: { text: 'IN PROGRESS', bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b',  border: 'rgba(245,158,11,0.25)'  },
    auto:       { text: 'AUTO',        bg: 'rgba(167,139,250,0.12)', color: '#a78bfa',  border: 'rgba(167,139,250,0.25)' },
  }[state];

  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 300, damping: 28 }}
    >
      <Box sx={{
        position: 'relative', overflow: 'hidden',
        px: 2.5, py: 2,
        bgcolor: STATE.bg,
        border: '1px solid', borderColor: STATE.border,
        borderRadius: '2px 14px 14px 2px',
        borderLeft: `3px solid ${STATE.leftBar}`,
        transition: 'all 0.2s ease',
        display: 'flex', flexDirection: 'column', gap: 1,
      }}>
        {/* Top row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* State icon */}
          <Box sx={{ flexShrink: 0 }}>
            {state === 'done' && <CheckCircle2 size={22} color="#22c55e" />}
            {state === 'inprogress' && (
              <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                <Target size={22} color="#f59e0b" />
              </motion.div>
            )}
            {state === 'auto' && (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}>
                <Cpu size={22} color="#a78bfa" style={{ willChange: 'transform' }} />
              </motion.div>
            )}
          </Box>

          {/* Task text */}
          <Box sx={{ flex: 1 }}>
            <Typography fontWeight={700} fontSize="0.88rem"
              color={state === 'done' ? '#22c55e' : (isDark ? 'rgba(255,255,255,0.88)' : '#1e293b')}
              sx={{ textDecoration: state === 'done' ? 'line-through' : 'none', lineHeight: 1.35 }}>
              {quest.task}
            </Typography>
            {state !== 'done' && (
              <Typography variant="caption" color="text.disabled" fontWeight={600} fontSize="0.67rem">
                {state === 'auto' ? '🤖 Triggers automatically when you complete the action'
                                  : `${progress}% complete — keep going!`}
              </Typography>
            )}
          </Box>

          {/* State badge */}
          <Box sx={{ px: 1.25, py: 0.35, borderRadius: '7px', bgcolor: BADGE_STATE.bg, border: `1px solid ${BADGE_STATE.border}`, flexShrink: 0 }}>
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 900, color: BADGE_STATE.color, letterSpacing: 1 }}>
              {BADGE_STATE.text}
            </Typography>
          </Box>
        </Box>

        {/* Progress bar — only for inprogress */}
        {state === 'inprogress' && (
          <Box sx={{ pl: 4.5 }}>
            <Box sx={{ height: 5, borderRadius: '3px', bgcolor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: index * 0.06 + 0.2 }}
                style={{ height: '100%', background: 'linear-gradient(90deg,#f59e0b,#fbbf24)', borderRadius: 3 }}
              />
            </Box>
            <Typography variant="caption" color="text.disabled" fontSize="0.62rem" fontFamily="monospace" fontWeight={700}>
              {progress}% — {quest.target ? `${Math.round((progress / 100) * quest.target)}/${quest.target}` : 'In progress'}
            </Typography>
          </Box>
        )}
      </Box>
    </motion.div>
  );
}

/* ─── Streak Cell ─── */
function StreakCell({ i, isActive, isToday, day, streak }) {
  const intensity = isActive ? Math.min(0.15 + (i / 28) * 0.85, 1) : 0;
  return (
    <Tooltip title={`${format(day, 'MMM d')}${isActive ? ' — ✓' : ''}`} arrow>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: i * 0.02, type: 'spring', stiffness: 300 }}
        whileHover={{ scale: 1.3, zIndex: 1 }}
        style={{ position: 'relative' }}
      >
        <Box sx={{
          width: { xs: 24, sm: 30 }, height: { xs: 24, sm: 30 },
          borderRadius: '4px',
          bgcolor: isActive ? `rgba(99,102,241,${intensity})` : 'rgba(255,255,255,0.04)',
          border: '1px solid',
          borderColor: isActive ? `rgba(99,102,241,${intensity + 0.2})` : 'rgba(255,255,255,0.06)',
          boxShadow: isToday ? '0 0 10px rgba(99,102,241,0.6)' : isActive ? `0 0 6px rgba(99,102,241,${intensity * 0.5})` : 'none',
          transition: '0.15s', cursor: 'default',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isActive && <Box sx={{ width: 6, height: 6, borderRadius: '1px', bgcolor: `rgba(165,180,252,${0.5 + intensity * 0.5})`, transform: 'rotate(45deg)' }} />}
          {isToday && !isActive && <Box sx={{ width: 4, height: 4, borderRadius: '1px', bgcolor: 'rgba(99,102,241,0.5)', transform: 'rotate(45deg)' }} />}
        </Box>
      </motion.div>
    </Tooltip>
  );
}

/* ════════════════ MAIN COMPONENT ════════════════ */
export default function Gamification() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pRes, qRes] = await Promise.all([api.get('/users/profile'), api.get('/gamification/quests')]);
      setProfile(pRes.data);
      setQuests(qRes.data);
    } catch { toast.error('Failed to load mission data'); }
    finally { setLoading(false); }
  };

  // Quests auto-complete via backend events; we just poll every 60s to refresh
  useEffect(() => {
    const interval = setInterval(() => {
      api.get('/gamification/quests').then(r => setQuests(r.data)).catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !profile) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', gap: 2 }}>
        <motion.div style={{ willChange: 'transform' }} animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}>
          <Cpu size={48} color="#6366f1" />
        </motion.div>
        <Typography fontWeight={800} color="text.secondary" sx={{ letterSpacing: 4, textTransform: 'uppercase', fontSize: '0.8rem' }}>
          Loading Mission Data…
        </Typography>
      </Box>
    );
  }

  /* ─ Compute values ─ */
  const currentXP    = profile.xp || 0;
  const currentLevel = profile.level || 1;
  const xpBase       = (currentLevel - 1) * 1000;
  const xpInto       = currentXP - xpBase;
  const xpPct        = Math.min((xpInto / 1000) * 100, 100);
  const tier         = TIERS[getTier(currentLevel)];
  const done         = quests.filter(q => q.isCompleted).length;
  const total        = quests.length;
  const questPct     = total > 0 ? (done / total) * 100 : 0;

  const BADGE_EMOJI = { 'Bronze Scholar': '🥉', 'Silver Scholar': '🥈', 'Gold Scholar': '🥇', '7-Day Star': '⭐', 'Session King': '👑' };

  return (
    <Box sx={{ minHeight: '100vh', py: { xs: 2, md: 3 }, px: { xs: 2, sm: 3, md: 4 }, position: 'relative',
      bgcolor: isDark ? '#050914' : '#f0f4ff',
    }}>
      <Scanlines />

      {/* Ambient glows */}
      <Box sx={{ position: 'fixed', top: '5%',   left: '10%', width: 600, height: 600, background: 'radial-gradient(circle,rgba(99,102,241,0.1) 0%,transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />
      <Box sx={{ position: 'fixed', bottom: '5%',right: '5%', width: 500, height: 500, background: 'radial-gradient(circle,rgba(139,92,246,0.07) 0%,transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />
      <Box sx={{ position: 'fixed', top: '40%', right: '15%', width: 300, height: 300, background: `radial-gradient(circle,${tier.glow} 0%,transparent 70%)`, zIndex: 0, pointerEvents: 'none' }} />

      <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 1280, mx: 'auto' }}>

        {/* ── System Header ── */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Box
                component={motion.div}
                animate={{ opacity: [1, 0.6, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22c55e', boxShadow: '0 0 8px rgba(34,197,94,0.7)', willChange: 'opacity' }}
              />
              <Typography variant="caption" fontWeight={800} color="#22c55e" sx={{ letterSpacing: 3, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                System Online
              </Typography>
            </Box>
            <Typography variant="h2" fontWeight={900} color={isDark ? 'white' : '#0f172a'}
              sx={{ letterSpacing: '-2px', lineHeight: 1, textShadow: isDark ? `0 0 40px ${tier.glow}` : 'none' }}>
              EVOLVE
            </Typography>
            <Typography color="text.secondary" fontWeight={600} fontSize="0.9rem" letterSpacing={1}>
              Mission Control · Level {currentLevel} Scholar
            </Typography>
          </Box>

          {/* HUD status */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Box sx={{ px: 2, py: 1, borderRadius: '8px', bgcolor: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Wifi size={14} color="#6366f1" />
              <Typography variant="caption" fontWeight={800} color="#6366f1" letterSpacing={1}>CONNECTED</Typography>
            </Box>
            <Box sx={{ px: 2, py: 1, borderRadius: '8px', background: tier.gradient, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Shield size={14} color="white" />
              <Typography variant="caption" fontWeight={900} color="white" letterSpacing={2}>{tier.label}</Typography>
            </Box>
          </Box>
        </Box>

        <Grid container spacing={2.5}>

          {/* ════ Col 1: Player Card ════ */}
          <Grid item xs={12} lg={5}>

            {/* ── Main Player Card ── */}
            <Box
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              sx={{
                position: 'relative', overflow: 'hidden', p: 2.5, borderRadius: '20px', mb: 2,
                background: isDark
                  ? `linear-gradient(135deg, rgba(10,12,30,0.97) 0%, rgba(20,16,50,0.95) 100%)`
                  : 'white',
                border: '1px solid', borderColor: tier.border,
                boxShadow: `0 0 60px ${tier.glow}, inset 0 0 60px rgba(99,102,241,0.03)`,
              }}
            >
              <HUDCorner />
              <HUDCorner flip />

              {/* Grid lines bg */}
              <Box sx={{
                position: 'absolute', inset: 0, opacity: 0.03, zIndex: 0,
                backgroundImage: 'linear-gradient(rgba(99,102,241,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }} />

              <Box sx={{ position: 'relative', zIndex: 1 }}>
                {/* Avatar + ring */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 2 }}>
                  <Box sx={{ position: 'relative', flexShrink: 0 }}>
                    {/* Animated ring */}
                    <Box
                      component={motion.div}
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                      sx={{
                        position: 'absolute', inset: -6, borderRadius: '50%',
                        border: '2px dashed', borderColor: tier.color + '44',
                        willChange: 'transform'
                      }}
                    />
                    <Avatar
                      src={profile.avatar}
                      sx={{
                        width: 80, height: 80, fontWeight: 900, fontSize: 28,
                        border: '3px solid', borderColor: tier.color,
                        boxShadow: `0 0 24px ${tier.glow}`,
                        bgcolor: tier.bg, color: tier.color,
                      }}
                    >
                      {profile.name?.[0]}
                    </Avatar>
                    {/* Level bubble */}
                    <Box sx={{
                      position: 'absolute', bottom: -4, right: -4,
                      width: 26, height: 26, borderRadius: '6px',
                      background: tier.gradient,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '2px solid', borderColor: isDark ? '#050914' : 'white',
                      fontSize: '0.65rem', fontWeight: 900, color: 'white',
                      fontFamily: 'monospace', boxShadow: `0 0 10px ${tier.glow}`,
                    }}>
                      {currentLevel}
                    </Box>
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Typography fontWeight={900} fontSize="1.25rem" color={isDark ? 'white' : '#0f172a'} letterSpacing={-0.5} mb={0.5}>
                      {profile.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip icon={<Flame size={11} style={{ color: '#f97316' }} />} label={`${profile.streak || 0}d streak`}
                        size="small" sx={{ height: 22, bgcolor: 'rgba(249,115,22,0.1)', color: '#f97316', fontWeight: 800, fontSize: '0.68rem', borderRadius: '6px' }} />
                      <Chip icon={<TrendingUp size={11} style={{ color: '#22c55e' }} />} label="Active"
                        size="small" sx={{ height: 22, bgcolor: 'rgba(34,197,94,0.1)', color: '#22c55e', fontWeight: 800, fontSize: '0.68rem', borderRadius: '6px' }} />
                    </Box>
                  </Box>
                </Box>

                {/* XP Bar */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
                    <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ letterSpacing: 2, textTransform: 'uppercase' }}>
                      Experience Points
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                      <Typography fontWeight={900} fontSize="1.2rem" color={tier.color} fontFamily="monospace">
                        {xpInto.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>/ 1,000</Typography>
                    </Box>
                  </Box>

                  {/* Custom XP bar */}
                  <Box sx={{ position: 'relative', height: 14, borderRadius: '4px', bgcolor: 'rgba(255,255,255,0.06)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${xpPct}%` }}
                      transition={{ duration: 2, ease: 'easeOut', delay: 0.5 }}
                      style={{ height: '100%', background: `linear-gradient(90deg,${tier.color},${tier.ring[1]})`, position: 'relative' }}
                    >
                      {/* shimmer */}
                      <Box sx={{
                        position: 'absolute', inset: 0,
                        backgroundImage: 'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.3) 50%,transparent 100%)',
                        backgroundSize: '200% 100%',
                        '@keyframes xpShimmer': { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
                        animation: 'xpShimmer 2s linear infinite',
                      }} />
                    </motion.div>
                    {/* Segment markers */}
                    {[25, 50, 75].map(p => (
                      <Box key={p} sx={{ position: 'absolute', top: 0, bottom: 0, left: `${p}%`, width: '1px', bgcolor: 'rgba(0,0,0,0.3)' }} />
                    ))}
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.75 }}>
                    <Typography variant="caption" color="text.disabled" fontWeight={700} fontFamily="monospace" fontSize="0.65rem">
                      LVL {currentLevel}
                    </Typography>
                    <Typography variant="caption" color="text.disabled" fontWeight={700} fontFamily="monospace" fontSize="0.65rem">
                      {(1000 - xpInto).toLocaleString()} XP TO NEXT
                    </Typography>
                    <Typography variant="caption" color="text.disabled" fontWeight={700} fontFamily="monospace" fontSize="0.65rem">
                      LVL {currentLevel + 1}
                    </Typography>
                  </Box>
                </Box>

                {/* Stat Grid — 4 boxes */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                  {[
                    { icon: <Zap size={16} />,       label: 'TOTAL XP',    val: currentXP,         color: '#a78bfa', mono: true },
                    { icon: <Flame size={16} />,      label: 'STREAK',      val: `${profile.streak || 0}D`, color: '#f97316', mono: true },
                    { icon: <Target size={16} />,     label: 'FOCUS HRS',   val: `${(profile.studyHours || 0).toFixed(1)}H`, color: '#38bdf8', mono: true },
                    { icon: <Trophy size={16} />,     label: 'BADGES',      val: profile.badges?.length || 0, color: '#eab308', mono: false },
                  ].map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + i * 0.08 }}>
                      <Box sx={{
                        p: 1.75, borderRadius: '12px',
                        bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                        border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                        display: 'flex', flexDirection: 'column', gap: 0.5,
                        transition: '0.2s', '&:hover': { borderColor: s.color + '44', bgcolor: s.color + '08' },
                        position: 'relative', overflow: 'hidden',
                      }}>
                        <Box sx={{ color: s.color, opacity: 0.8 }}>{s.icon}</Box>
                        <Typography fontWeight={900} fontSize="1.4rem" color={isDark ? 'white' : '#0f172a'} lineHeight={1}
                          fontFamily={s.mono ? "'Courier New', monospace" : 'inherit'}>
                          {typeof s.val === 'number' && s.mono ? s.val.toLocaleString() : s.val}
                        </Typography>
                        <Typography variant="caption" fontWeight={800} color="text.disabled" fontSize="0.58rem" letterSpacing={1.5}>
                          {s.label}
                        </Typography>
                      </Box>
                    </motion.div>
                  ))}
                </Box>
              </Box>
            </Box>

            {/* ── Badge Showcase ── */}
            <Box
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              sx={{
                p: 2.5, borderRadius: '20px',
                bgcolor: isDark ? 'rgba(10,12,30,0.97)' : 'white',
                border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
                boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.06)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography fontWeight={900} fontSize="0.85rem" color={isDark ? 'rgba(255,255,255,0.7)' : '#475569'} sx={{ letterSpacing: 2, textTransform: 'uppercase' }}>
                  Achievements
                </Typography>
                {profile.badges?.length > 0 && (
                  <Chip label={`${profile.badges.length} unlocked`} size="small"
                    sx={{ bgcolor: 'rgba(234,179,8,0.1)', color: '#eab308', fontWeight: 800, fontSize: '0.65rem', borderRadius: '6px', border: '1px solid rgba(234,179,8,0.2)' }} />
                )}
              </Box>

              {(!profile.badges || profile.badges.length === 0) ? (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  <Lock size={36} style={{ opacity: 0.15, margin: '0 auto 10px' }} />
                  <Typography fontWeight={700} fontSize="0.88rem">No achievements unlocked</Typography>
                  <Typography variant="caption">Complete missions and quests to earn badges</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(60px,1fr))', gap: 1 }}>
                  {profile.badges.map((badge, i) => (
                    <motion.div key={i} initial={{ opacity: 0, scale: 0.6, rotate: -10 }} animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      transition={{ delay: i * 0.07, type: 'spring', stiffness: 300 }} whileHover={{ scale: 1.1, y: -4 }}>
                      <Tooltip title={badge} arrow placement="top">
                        <Box sx={{
                          aspectRatio: '1', borderRadius: '12px', display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'center', gap: 0.5, cursor: 'default',
                          bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                          border: '1px solid', borderColor: isDark ? 'rgba(234,179,8,0.15)' : 'rgba(234,179,8,0.2)',
                          '&:hover': { bgcolor: 'rgba(234,179,8,0.08)', borderColor: 'rgba(234,179,8,0.35)', boxShadow: '0 0 16px rgba(234,179,8,0.15)' },
                          transition: '0.2s',
                        }}>
                          <Typography fontSize="1.6rem" lineHeight={1}>{BADGE_EMOJI[badge] || '🏅'}</Typography>
                          <Typography variant="caption" fontWeight={800} color="text.secondary" textAlign="center" fontSize="0.55rem" lineHeight={1.2} px={0.5}>
                            {badge.split(' ')[0]}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </motion.div>
                  ))}
                </Box>
              )}
            </Box>
          </Grid>

          {/* ════ Col 2: Missions + Heatmap ════ */}
          <Grid item xs={12} lg={7} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

            {/* ── Mission Board ── */}
            <Box
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              sx={{
                p: 2.5, borderRadius: '20px', position: 'relative', overflow: 'hidden',
                bgcolor: isDark ? 'rgba(10,12,30,0.97)' : 'white',
                border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
                boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.06)',
              }}
            >
              <HUDCorner />
              <HUDCorner flip />

              {/* Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                  <Typography variant="caption" fontWeight={800} color="#6366f1" sx={{ letterSpacing: 3, textTransform: 'uppercase', fontSize: '0.68rem' }}>
                    Daily Operations
                  </Typography>
                  <Typography fontWeight={900} fontSize="1.2rem" color={isDark ? 'white' : '#0f172a'} letterSpacing={-0.5}>
                    Mission Board
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" fontWeight={800} color="text.secondary" fontSize="0.65rem" letterSpacing={1} display="block">PROGRESS</Typography>
                    <Typography fontWeight={900} color={isDark ? 'white' : '#0f172a'} fontFamily="monospace" fontSize="1.1rem">
                      {done}/{total}
                    </Typography>
                  </Box>
                  {/* Quest progress ring */}
                  <Box sx={{ position: 'relative', width: 48, height: 48, flexShrink: 0 }}>
                    <svg width="48" height="48" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
                      <circle cx="24" cy="24" r="19" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                      <motion.circle cx="24" cy="24" r="19" fill="none" stroke="#6366f1" strokeWidth="4"
                        strokeLinecap="round" strokeDasharray={2 * Math.PI * 19}
                        initial={{ strokeDashoffset: 2 * Math.PI * 19 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 19 * (1 - questPct / 100) }}
                        transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
                        style={{ filter: 'drop-shadow(0 0 6px rgba(99,102,241,0.6))' }}
                      />
                    </svg>
                    <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography fontWeight={900} fontSize="0.65rem" color="#818cf8" fontFamily="monospace">
                        {Math.round(questPct)}%
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Quest legend */}
              <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
                {[
                  { label: 'Auto', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', desc: 'Triggers automatically' },
                  { label: 'In Progress', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', desc: 'Action detected' },
                  { label: 'Done', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', desc: 'Completed' },
                ].map(s => (
                  <Box key={s.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 1.25, py: 0.5, borderRadius: '8px', bgcolor: s.bg }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: s.color, boxShadow: `0 0 6px ${s.color}` }} />
                    <Typography variant="caption" fontWeight={800} color={s.color} fontSize="0.65rem" letterSpacing={0.5}>{s.label}</Typography>
                  </Box>
                ))}
              </Box>
              {/* Quest list */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                <AnimatePresence>
                  {total === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                      <Target size={44} style={{ opacity: 0.12, margin: '0 auto 12px' }} />
                      <Typography fontWeight={700}>No quests available</Typography>
                      <Typography variant="caption">Check back tomorrow</Typography>
                    </Box>
                  ) : quests.map((q, i) => (
                    <QuestCard key={q._id} quest={q} index={i} isDark={isDark} />
                  ))}
                </AnimatePresence>
              </Box>
            </Box>

            {/* ── Streak Heatmap ── */}
            <Box
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              sx={{
                p: 2.5, borderRadius: '20px', position: 'relative', overflow: 'hidden',
                bgcolor: isDark ? 'rgba(10,12,30,0.97)' : 'white',
                border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
                boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.06)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Box>
                  <Typography variant="caption" fontWeight={800} color="#6366f1" sx={{ letterSpacing: 3, textTransform: 'uppercase', fontSize: '0.68rem' }}>
                    Activity Log
                  </Typography>
                  <Typography fontWeight={900} fontSize="1.2rem" color={isDark ? 'white' : '#0f172a'} letterSpacing={-0.5}>
                    28-Day Matrix
                  </Typography>
                </Box>
                <Chip
                  icon={<Flame size={13} style={{ color: '#f97316' }} />}
                  label={`${profile.streak || 0} day streak`}
                  size="small"
                  sx={{ bgcolor: 'rgba(249,115,22,0.1)', color: '#f97316', fontWeight: 900, borderRadius: '8px', border: '1px solid rgba(249,115,22,0.2)', fontSize: '0.72rem' }}
                />
              </Box>

              {/* Month labels */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: { xs: '6px', sm: '8px' } }}>
                {Array.from({ length: 28 }, (_, i) => {
                  const day = subDays(new Date(), 27 - i);
                  const isToday = i === 27;
                  const daysAgo = 27 - i;
                  const isActive = daysAgo < (profile.streak || 0);
                  return <StreakCell key={i} i={i} isActive={isActive} isToday={isToday} day={day} streak={profile.streak} />;
                })}
              </Box>

              {/* Legend */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)' }}>
                <Typography variant="caption" color="text.disabled" fontWeight={700} letterSpacing={1} fontSize="0.65rem">LESS</Typography>
                {[0.07, 0.25, 0.45, 0.65, 0.9].map(op => (
                  <Box key={op} sx={{ width: 14, height: 14, borderRadius: '3px', bgcolor: `rgba(99,102,241,${op})`, border: '1px solid', borderColor: `rgba(99,102,241,${op + 0.1})` }} />
                ))}
                <Typography variant="caption" color="text.disabled" fontWeight={700} letterSpacing={1} fontSize="0.65rem">MORE</Typography>
                <Typography variant="caption" color="text.disabled" fontWeight={700} fontSize="0.65rem" sx={{ ml: 'auto', letterSpacing: 1 }}>
                  LAST 28 DAYS
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
