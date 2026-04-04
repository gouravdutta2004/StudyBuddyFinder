import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  motion, useMotionValue, animate, useInView,
  useScroll, useTransform, useSpring
} from 'framer-motion';
import { Box, Typography, Button, useTheme, Chip, Tooltip, LinearProgress } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  Users, Calendar, Activity, RefreshCw, Zap, MessageCircle,
  ChevronRight, LockKeyhole, BrainCircuit, BarChart2, Clock,
  TrendingUp, Flame, Target, Award, Sparkles, ArrowUpRight,
  BookOpen, Trophy, Layers, Cpu
} from 'lucide-react';

import StudyQuoteWidget     from '../components/dashboard/StudyQuoteWidget';
import AIInsightsWidget     from '../components/dashboard/AIInsightsWidget';
import FocusTimerWidget     from '../components/dashboard/FocusTimerWidget';
import MiniCalendarWidget   from '../components/dashboard/MiniCalendarWidget';
import StudyAnalyticsWidget from '../components/dashboard/StudyAnalyticsWidget';
import BountiesWidget       from '../components/dashboard/BountiesWidget';

/* ─────────────── Animated Counter ─────────────── */
function AnimCount({ target, prefix = '', suffix = '' }) {
  const val = useMotionValue(0);
  const [d, setD] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const c = animate(val, target, { duration: 1.6, ease: [0.22, 1, 0.36, 1] });
    const unsub = val.on('change', v => setD(Math.round(v)));
    return () => { c.stop(); unsub(); };
  }, [target, inView]);

  return <span ref={ref}>{prefix}{d.toLocaleString()}{suffix}</span>;
}

/* ─────────────── Scroll Reveal Wrapper ─────────────── */
function ScrollReveal({ children, delay = 0, y = 40, x = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y, x }}
      animate={inView ? { opacity: 1, y: 0, x: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{ height: '100%' }}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────── Orbital Progress Ring ─────────────── */
function ProgressRing({ value, size = 80, strokeWidth = 7, color = '#6366f1', label, sublabel }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    if (!inView) return;
    const timer = setTimeout(() => {
      setOffset(circumference - (value / 100) * circumference);
    }, 150);
    return () => clearTimeout(timer);
  }, [inView, value, circumference]);

  return (
    <Box ref={ref} sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} fill="none"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ fontFamily: 'monospace', fontWeight: 900, fontSize: size > 70 ? '1.1rem' : '0.85rem', color, lineHeight: 1 }}>
          {label}
        </Typography>
        {sublabel && (
          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.48rem', color: 'rgba(255,255,255,0.35)', letterSpacing: 1, fontWeight: 700, mt: 0.25 }}>
            {sublabel}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

/* ─────────────── Kinetic Stat Card ─────────────── */
function KineticStat({ icon: Icon, label, value, trend, color, onClick, loading, delay = 0 }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [hov, setHov] = useState(false);

  return (
    <ScrollReveal delay={delay} y={30}>
      <motion.div
        onHoverStart={() => setHov(true)}
        onHoverEnd={() => setHov(false)}
        whileHover={{ y: -6, scale: 1.015 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        style={{ height: '100%', cursor: onClick ? 'pointer' : 'default' }}
      >
        <Box sx={{
          position: 'relative', borderRadius: '20px', height: '100%', overflow: 'hidden',
          background: isDark
            ? `linear-gradient(145deg, #0f1424 0%, #0a0e1a 100%)`
            : `linear-gradient(145deg, #ffffff 0%, #f8faff 100%)`,
          border: '1px solid',
          borderColor: hov ? color + '50' : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          boxShadow: hov
            ? `0 20px 60px ${color}20, 0 0 0 1px ${color}30`
            : isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.06)',
          transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
        }}>
          {/* Glow orb background */}
          <Box sx={{
            position: 'absolute', top: -20, right: -20, width: 100, height: 100,
            borderRadius: '50%', bgcolor: color,
            filter: 'blur(40px)',
            opacity: hov ? 0.12 : 0.05,
            transition: 'opacity 0.4s',
            pointerEvents: 'none',
          }} />

          <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <Box sx={{
                width: 42, height: 42, borderRadius: '12px',
                background: `linear-gradient(135deg, ${color}22, ${color}08)`,
                border: `1px solid ${color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 4px 12px ${color}20`,
              }}>
                <Icon size={18} color={color} />
              </Box>
              {trend !== undefined && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                  <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.4,
                    borderRadius: '20px', bgcolor: 'rgba(34,197,94,0.1)',
                    border: '1px solid rgba(34,197,94,0.2)',
                  }}>
                    <TrendingUp size={9} color="#22c55e" />
                    <Typography sx={{ fontSize: '0.58rem', fontWeight: 800, color: '#22c55e', fontFamily: 'monospace' }}>
                      +{trend}%
                    </Typography>
                  </Box>
                </motion.div>
              )}
            </Box>

            <Box>
              <Typography sx={{
                fontFamily: 'monospace', fontWeight: 900, fontSize: '2.2rem',
                color: isDark ? '#ffffff' : '#0f172a', lineHeight: 1, mb: 0.5,
                background: `linear-gradient(135deg, ${isDark ? '#ffffff' : '#0f172a'}, ${color})`,
                backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                {loading ? '—' : <AnimCount target={value} />}
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: color, fontFamily: 'monospace', letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.8 }}>
                {label}
              </Typography>
            </Box>
          </Box>
        </Box>
      </motion.div>
    </ScrollReveal>
  );
}

/* ─────────────── Evolve Card (container) ─────────────── */
function EvolveCard({ children, accent, onClick, sx = {}, glow = false }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [hov, setHov] = useState(false);

  return (
    <motion.div
      onHoverStart={() => setHov(true)}
      onHoverEnd={() => setHov(false)}
      whileHover={{ y: -3 }}
      onClick={onClick}
      style={{ height: '100%', cursor: onClick ? 'pointer' : 'default' }}
    >
      <Box sx={{
        position: 'relative', borderRadius: '24px', height: '100%', overflow: 'hidden',
        background: isDark
          ? 'linear-gradient(145deg, #0d1224 0%, #080d1a 100%)'
          : 'linear-gradient(145deg, #ffffff 0%, #f5f7ff 100%)',
        border: '1px solid',
        borderColor: hov && accent
          ? accent + '45'
          : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
        boxShadow: glow && hov
          ? `0 24px 80px ${accent}18, 0 8px 32px rgba(0,0,0,0.3)`
          : isDark ? '0 4px 24px rgba(0,0,0,0.5)' : '0 4px 24px rgba(0,0,0,0.07)',
        transition: 'all 0.35s cubic-bezier(0.22,1,0.36,1)',
        ...(accent && {
          '&::before': {
            content: '""', position: 'absolute',
            top: 0, left: 0, right: 0, height: '2px',
            background: `linear-gradient(90deg, ${accent}, ${accent}00)`,
            opacity: hov ? 1 : 0.5, transition: 'opacity 0.3s',
          }
        }),
        ...sx,
      }}>
        {/* Ambient glow */}
        {accent && (
          <Box sx={{
            position: 'absolute', top: -40, left: -20, width: 160, height: 160,
            borderRadius: '50%', bgcolor: accent,
            filter: 'blur(60px)', opacity: hov ? 0.08 : 0.03,
            transition: 'opacity 0.4s', pointerEvents: 'none',
          }} />
        )}
        {children}
      </Box>
    </motion.div>
  );
}

/* ─────────────── Section Label ─────────────── */
function SectionTag({ color = '#6366f1', children }) {
  return (
    <Typography sx={{
      fontFamily: 'monospace', fontSize: '0.58rem', fontWeight: 900,
      color, letterSpacing: 2.5, textTransform: 'uppercase',
      display: 'flex', alignItems: 'center', gap: 0.75,
    }}>
      <Box component="span" sx={{ width: 14, height: 1.5, bgcolor: color, borderRadius: 1, opacity: 0.7 }} />
      {children}
    </Typography>
  );
}

/* ─────────────── Pulse Dot ─────────────── */
function PulseDot({ color = '#22c55e' }) {
  return (
    <Box sx={{ position: 'relative', width: 8, height: 8, flexShrink: 0 }}>
      <motion.div
        style={{ position: 'absolute', inset: 0, borderRadius: '50%', backgroundColor: color, opacity: 0.3 }}
        animate={{ scale: [1, 2.2], opacity: [0.3, 0] }}
        transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut' }}
      />
      <Box sx={{ position: 'absolute', inset: 1.5, borderRadius: '50%', bgcolor: color }} />
    </Box>
  );
}

/* ─────────────── Floating particle bg ─────────────── */
function ParticleBg({ color }) {
  return (
    <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: 'inherit' }}>
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            width: 4 + i * 2, height: 4 + i * 2,
            borderRadius: '50%',
            backgroundColor: color,
            left: `${10 + i * 15}%`,
            bottom: `${10 + (i % 3) * 20}%`,
            opacity: 0.07,
          }}
          animate={{
            y: [0, -18, 0],
            opacity: [0.07, 0.15, 0.07],
          }}
          transition={{
            duration: 3 + i * 0.7,
            delay: i * 0.4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </Box>
  );
}

/* ═══════════════════ MAIN DASHBOARD ═══════════════════ */
export default function Dashboard() {
  const { user } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();

  const [stats, setStats] = useState({ connections: 0, sessions: 0, pending: 0 });
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [time, setTime] = useState(new Date());

  // Scroll parallax for hero section
  const containerRef = useRef(null);
  const { scrollY } = useScroll();
  const heroParallax = useTransform(scrollY, [0, 300], [0, -40]);
  const heroOpacityScroll = useTransform(scrollY, [0, 250], [1, 0.7]);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [c, s] = await Promise.all([api.get('/users/connections'), api.get('/sessions/my')]);
        setStats({
          connections: c.data.connections.length,
          sessions: s.data.length,
          pending: c.data.pendingRequests.length,
        });
        setLastUpdated(new Date());
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, [user, refreshKey]);

  const xpPct = Math.min(((user?.xp || 0) % 100), 100);
  const level = user?.level || 1;
  const greet = time.getHours() < 12 ? 'Good morning' : time.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  const ACTIONS = [
    { label: 'Browse Scholars', icon: Users,       to: '/browse',       color: '#6366f1' },
    { label: 'New Session',     icon: Calendar,    to: '/sessions',     color: '#22d3ee' },
    { label: 'Messages',        icon: MessageCircle,to: '/messages',    color: '#a78bfa' },
    { label: 'Quest Hub',       icon: Trophy,      to: '/gamification', color: '#f59e0b' },
    { label: 'Flashcards',      icon: BrainCircuit,to: '/flashcards',  color: '#34d399' },
    { label: 'Analytics',       icon: BarChart2,   to: '/analytics',    color: '#f43f5e' },
  ];

  return (
    <Box ref={containerRef} sx={{
      py: { xs: 3, md: 4 }, pb: 10,
      bgcolor: isDark ? '#05080f' : '#f0f2f8',
      color: isDark ? '#e5e7eb' : '#111827',
      fontFamily: "'Inter', sans-serif",
      position: 'relative',
    }}>

      {/* ── Global ambient glow layer ── */}
      {isDark && (
        <Box sx={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
          <motion.div style={{ y: heroParallax }}>
            <Box sx={{ position: 'absolute', top: -200, left: '10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', filter: 'blur(60px)' }} />
            <Box sx={{ position: 'absolute', top: 0, right: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 70%)', filter: 'blur(50px)' }} />
            <Box sx={{ position: 'absolute', top: '40%', left: '40%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.05) 0%, transparent 70%)', filter: 'blur(40px)' }} />
          </motion.div>
        </Box>
      )}

      <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, pt: 3, position: 'relative', zIndex: 1 }}>

        {/* ══════════════ HERO HEADER ══════════════ */}
        <motion.div
          style={{ y: heroParallax, opacity: heroOpacityScroll }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <Box sx={{
            position: 'relative', borderRadius: '28px', mb: 4, overflow: 'hidden',
            background: isDark
              ? 'linear-gradient(135deg, #0f1830 0%, #0a0d1a 50%, #0d1424 100%)'
              : 'linear-gradient(135deg, #eef0ff 0%, #f8f9ff 50%, #eff4ff 100%)',
            border: '1px solid',
            borderColor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.12)',
            boxShadow: isDark ? '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.08)' : '0 24px 60px rgba(99,102,241,0.1)',
          }}>
            {/* Animated mesh gradient overlay */}
            <motion.div
              animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: isDark
                  ? 'radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(34,211,238,0.08) 0%, transparent 50%)'
                  : 'radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(34,211,238,0.06) 0%, transparent 50%)',
                backgroundSize: '200% 200%',
              }}
            />

            <Box sx={{ position: 'relative', p: { xs: 3, md: 4 }, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 3 }}>
              {/* Left: greeting */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <PulseDot />
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '0.62rem', fontWeight: 800, color: '#22c55e', letterSpacing: 2 }}>
                    SYSTEM ONLINE · {time.toLocaleTimeString('en-US', { hour12: false })}
                  </Typography>
                </Box>

                <Typography sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 800, fontSize: { xs: '1.5rem', md: '2rem' }, lineHeight: 1.1, mb: 0.5 }}>
                  {greet},{' '}
                  <Box component="span" sx={{
                    background: 'linear-gradient(90deg, #6366f1, #22d3ee, #a78bfa)',
                    backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    backgroundSize: '200%',
                  }}>
                    <motion.span
                      animate={{ backgroundPosition: ['0%', '100%', '0%'] }}
                      transition={{ duration: 5, repeat: Infinity }}
                    >
                      {user?.name?.split(' ')[0] || 'Scholar'}
                    </motion.span>
                  </Box>
                </Typography>

                <Typography sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '0.85rem', color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)', fontWeight: 500 }}>
                  Keep the momentum going · Your streak is{' '}
                  <Box component="span" sx={{ color: '#f97316', fontWeight: 800 }}>{user?.streak || 0} days</Box>{' 🔥'}
                </Typography>
              </Box>

              {/* Right: level ring + quick stats */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <ProgressRing
                  value={xpPct}
                  size={88}
                  strokeWidth={7}
                  color="#6366f1"
                  label={`Lv${level}`}
                  sublabel="SCHOLAR"
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {[
                    { icon: Flame,  val: `${user?.streak || 0}d`, label: 'Streak',   color: '#f97316' },
                    { icon: Target, val: user?.xp || 0,           label: 'Total XP', color: '#a78bfa' },
                    { icon: Award,  val: user?.badges?.length || 0, label: 'Badges', color: '#eab308' },
                  ].map((s, i) => (
                    <motion.div
                      key={s.label}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 28, height: 28, borderRadius: '8px', background: `${s.color}18`, border: `1px solid ${s.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <s.icon size={13} color={s.color} />
                        </Box>
                        <Box>
                          <Typography sx={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '0.9rem', color: s.color, lineHeight: 1 }}>{s.val}</Typography>
                          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.5rem', color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)', letterSpacing: 1, fontWeight: 700 }}>{s.label.toUpperCase()}</Typography>
                        </Box>
                      </Box>
                    </motion.div>
                  ))}
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    component={RouterLink} to="/gamification"
                    variant="contained"
                    size="small"
                    sx={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', borderRadius: '12px', fontWeight: 700, textTransform: 'none', fontSize: '0.78rem', px: 2, py: 1, boxShadow: '0 8px 24px rgba(99,102,241,0.4)', '&:hover': { background: 'linear-gradient(135deg, #818cf8, #6366f1)' } }}
                  >
                    <Sparkles size={13} style={{ marginRight: 6 }} /> Quest Hub
                  </Button>
                  <Tooltip title="Refresh data">
                    <Box
                      component={motion.div}
                      whileHover={{ rotate: 180, scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ duration: 0.35 }}
                      onClick={() => setRefreshKey(k => k + 1)}
                      sx={{ p: 1, borderRadius: '10px', cursor: 'pointer', color: '#6366f1', bgcolor: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <RefreshCw size={15} />
                    </Box>
                  </Tooltip>
                </Box>
              </Box>
            </Box>

            {/* XP progress bar */}
            <Box sx={{ px: { xs: 3, md: 4 }, pb: 3, pt: 0 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                <Typography sx={{ fontFamily: 'monospace', fontSize: '0.62rem', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontWeight: 700, letterSpacing: 1 }}>
                  XP PROGRESS TO LEVEL {level + 1}
                </Typography>
                <Typography sx={{ fontFamily: 'monospace', fontSize: '0.62rem', color: '#6366f1', fontWeight: 800 }}>
                  {user?.xp || 0} / {level * 100}
                </Typography>
              </Box>
              <Box sx={{ height: 4, borderRadius: '2px', bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', overflow: 'hidden', position: 'relative' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPct}%` }}
                  transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                  style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #4f46e5, #6366f1, #22d3ee)',
                    borderRadius: 2,
                    boxShadow: '0 0 12px rgba(99,102,241,0.6)',
                  }}
                />
              </Box>
            </Box>
          </Box>
        </motion.div>

        {/* ══════════════ STAT CARDS ══════════════ */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2.5, mb: 3 }}>
          <KineticStat icon={Users}    label="Connections" value={stats.connections} color="#6366f1" trend={12} onClick={() => navigate('/connections')} loading={loading} delay={0} />
          <KineticStat icon={Calendar} label="Sessions"    value={stats.sessions}    color="#22d3ee" trend={8}  onClick={() => navigate('/sessions')}    loading={loading} delay={0.06} />
          <KineticStat icon={Activity} label="Pending"     value={stats.pending}     color="#a78bfa" trend={5}  onClick={() => navigate('/connections')} loading={loading} delay={0.12} />
        </Box>

        {/* ══════════════ QUICK ACTIONS ROW ══════════════ */}
        <ScrollReveal delay={0.05} y={20}>
          <Box sx={{ mb: 3 }}>
            <SectionTag color="#6366f1">Quick Actions</SectionTag>
            <Box sx={{ display: 'flex', gap: 1.5, mt: 1.5, flexWrap: 'wrap' }}>
              {ACTIONS.map((a, i) => (
                <motion.div
                  key={a.to}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -3, scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(a.to)}
                >
                  <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer',
                    px: 2, py: 1.25, borderRadius: '14px',
                    background: isDark ? `linear-gradient(135deg, ${a.color}10, transparent)` : `linear-gradient(135deg, ${a.color}08, ${a.color}03)`,
                    border: `1px solid ${a.color}25`,
                    boxShadow: `0 4px 16px ${a.color}10`,
                    '&:hover': {
                      background: isDark ? `linear-gradient(135deg, ${a.color}18, ${a.color}06)` : `linear-gradient(135deg, ${a.color}15, ${a.color}05)`,
                      boxShadow: `0 8px 24px ${a.color}20`,
                      borderColor: `${a.color}45`,
                    },
                    transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
                  }}>
                    <a.icon size={15} color={a.color} />
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: isDark ? 'rgba(255,255,255,0.8)' : '#1e293b' }}>
                      {a.label}
                    </Typography>
                  </Box>
                </motion.div>
              ))}
            </Box>
          </Box>
        </ScrollReveal>

        {/* ══════════════ MAIN GRID ══════════════ */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(12, 1fr)' }, gap: 3 }}>

          {/* ── Study Analytics (8 col) ── */}
          <Box sx={{ gridColumn: { xs: 'span 1', lg: 'span 8' } }}>
            <ScrollReveal delay={0.0} y={35}>
              <EvolveCard accent="#6366f1" glow onClick={(e) => { if (e.target.closest('button')) return; navigate('/profile'); }} sx={{ minHeight: 400 }}>
                <ParticleBg color="#6366f1" />
                <Box sx={{ p: 3.5, height: '100%', position: 'relative' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box>
                      <SectionTag color="#6366f1">Performance · Analytics</SectionTag>
                      <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: isDark ? '#ffffff' : '#0f172a', mt: 0.75 }}>
                        Study Analytics
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <PulseDot color="#6366f1" />
                      <Box sx={{ px: 1.5, py: 0.5, borderRadius: '8px', bgcolor: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6rem', fontWeight: 800, color: '#6366f1' }}>LIVE</Typography>
                      </Box>
                    </Box>
                  </Box>
                  <StudyAnalyticsWidget />
                </Box>
              </EvolveCard>
            </ScrollReveal>
          </Box>

          {/* ── Bounties (4 col) ── */}
          <Box sx={{ gridColumn: { xs: 'span 1', lg: 'span 4' } }}>
            <ScrollReveal delay={0.08} y={35}>
              <EvolveCard accent="#22d3ee" glow onClick={(e) => { if (e.target.closest('button')) return; navigate('/gamification'); }} sx={{ minHeight: 400 }}>
                <ParticleBg color="#22d3ee" />
                <Box sx={{ p: 3.5, height: '100%', position: 'relative' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box>
                      <SectionTag color="#22d3ee">Missions · Active</SectionTag>
                      <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: isDark ? '#ffffff' : '#0f172a', mt: 0.75 }}>
                        Bounties
                      </Typography>
                    </Box>
                    <Zap size={18} color="#22d3ee" />
                  </Box>
                  <BountiesWidget />
                </Box>
              </EvolveCard>
            </ScrollReveal>
          </Box>

          {/* ── AI Insights (6 col) ── */}
          <Box sx={{ gridColumn: { xs: 'span 1', lg: 'span 6' } }}>
            <ScrollReveal delay={0.05} y={35}>
              <EvolveCard accent="#a78bfa" glow sx={{ minHeight: 360 }}>
                <ParticleBg color="#a78bfa" />
                <Box sx={{ p: 3.5, height: '100%', position: 'relative' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box>
                      <SectionTag color="#a78bfa">AI · Intelligence Feed</SectionTag>
                      <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: isDark ? '#ffffff' : '#0f172a', mt: 0.75 }}>
                        AI Insights
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PulseDot color="#a78bfa" />
                      <Cpu size={16} color="#a78bfa" />
                    </Box>
                  </Box>
                  <AIInsightsWidget />
                </Box>
              </EvolveCard>
            </ScrollReveal>
          </Box>

          {/* ── Focus Timer + Community (6 col stacked) ── */}
          <Box sx={{ gridColumn: { xs: 'span 1', lg: 'span 6' }, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <ScrollReveal delay={0.1} y={35}>
              <EvolveCard accent="#8b5cf6" glow
                onClick={(e) => { if (e.target.closest('button') || e.target.closest('input')) return; navigate('/focus'); }}
                sx={{ minHeight: 230, flex: 1 }}>
                <ParticleBg color="#8b5cf6" />
                <Box sx={{ p: 3.5, height: '100%', position: 'relative' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                    <Box>
                      <SectionTag color="#8b5cf6">Pomodoro · Focus Node</SectionTag>
                      <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: isDark ? '#ffffff' : '#0f172a', mt: 0.75 }}>
                        Focus Timer
                      </Typography>
                    </Box>
                    <Clock size={18} color="#8b5cf6" />
                  </Box>
                  <FocusTimerWidget />
                </Box>
              </EvolveCard>
            </ScrollReveal>

            <ScrollReveal delay={0.14} y={35}>
              <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.99 }} onClick={() => navigate('/browse')} style={{ cursor: 'pointer' }}>
                <Box sx={{
                  borderRadius: '20px', overflow: 'hidden', position: 'relative',
                  background: isDark
                    ? 'linear-gradient(135deg, #0f2418 0%, #071a10 100%)'
                    : 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
                  border: '1px solid rgba(20,184,166,0.2)',
                  boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 24px rgba(20,184,166,0.1)',
                  p: 3,
                  '&:hover': { border: '1px solid rgba(20,184,166,0.4)', boxShadow: isDark ? '0 16px 48px rgba(0,0,0,0.5)' : '0 16px 48px rgba(20,184,166,0.15)' },
                  transition: 'all 0.3s',
                }}>
                  <Box sx={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', bgcolor: '#14b8a6', filter: 'blur(35px)', opacity: 0.12, pointerEvents: 'none' }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, position: 'relative' }}>
                    <Box sx={{ width: 48, height: 48, borderRadius: '14px', background: 'linear-gradient(135deg, rgba(20,184,166,0.2), rgba(20,184,166,0.08))', border: '1px solid rgba(20,184,166,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <MessageCircle size={22} color="#14b8a6" />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <SectionTag color="#14b8a6">Network · Community</SectionTag>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: isDark ? '#ffffff' : '#0f172a', mt: 0.5, mb: 0.25 }}>
                        Network Clear
                      </Typography>
                      <Typography sx={{ fontSize: '0.78rem', color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)' }}>
                        All requests processed · Inbox zero
                      </Typography>
                    </Box>
                    <motion.div whileHover={{ x: 4 }}>
                      <ChevronRight size={18} color="#14b8a6" opacity={0.6} />
                    </motion.div>
                  </Box>
                </Box>
              </motion.div>
            </ScrollReveal>
          </Box>

          {/* ── Bottom row: Calendar + Quote + Heatmap ── */}
          <Box sx={{ gridColumn: { xs: 'span 1', lg: 'span 4' } }}>
            <ScrollReveal delay={0.0} y={40}>
              <EvolveCard accent="#38bdf8" onClick={(e) => { if (e.target.closest('button')) return; navigate('/sessions'); }} sx={{ minHeight: 320 }}>
                <Box sx={{ p: 3.5, height: '100%', position: 'relative' }}>
                  <Box sx={{ mb: 2.5 }}>
                    <SectionTag color="#38bdf8">Timeline · Session Grid</SectionTag>
                    <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: isDark ? '#ffffff' : '#0f172a', mt: 0.75 }}>Calendar</Typography>
                  </Box>
                  <MiniCalendarWidget />
                </Box>
              </EvolveCard>
            </ScrollReveal>
          </Box>

          <Box sx={{ gridColumn: { xs: 'span 1', lg: 'span 4' } }}>
            <ScrollReveal delay={0.07} y={40}>
              <EvolveCard accent="#f59e0b" sx={{ minHeight: 320 }}>
                <Box sx={{ p: 3.5, height: '100%', position: 'relative' }}>
                  <Box sx={{ mb: 2.5 }}>
                    <SectionTag color="#f59e0b">Signal · Daily Brief</SectionTag>
                    <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: isDark ? '#ffffff' : '#0f172a', mt: 0.75 }}>Study Quote</Typography>
                  </Box>
                  <StudyQuoteWidget />
                </Box>
              </EvolveCard>
            </ScrollReveal>
          </Box>

          {/* ── Locked Heatmap Premium Upsell ── */}
          <Box sx={{ gridColumn: { xs: 'span 1', lg: 'span 4' } }}>
            <ScrollReveal delay={0.14} y={40}>
              <motion.div
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => navigate('/billing')}
                style={{ height: '100%', cursor: 'pointer' }}
              >
                <Box sx={{
                  borderRadius: '24px', minHeight: 320, height: '100%', overflow: 'hidden', position: 'relative',
                  background: isDark
                    ? 'linear-gradient(145deg, #120f2b 0%, #0a0817 100%)'
                    : 'linear-gradient(145deg, #f5f3ff 0%, #ede9fe 100%)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  boxShadow: isDark ? '0 8px 40px rgba(99,102,241,0.08)' : '0 8px 32px rgba(99,102,241,0.1)',
                  '&:hover': {
                    border: '1px solid rgba(99,102,241,0.4)',
                    boxShadow: isDark ? '0 20px 60px rgba(99,102,241,0.15)' : '0 20px 60px rgba(99,102,241,0.18)',
                  },
                  transition: 'all 0.35s',
                }}>
                  {/* Animated cosmic bg */}
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                    style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, pointerEvents: 'none' }}
                  >
                    <Box sx={{ width: '100%', height: '100%', borderRadius: '50%', background: 'conic-gradient(from 0deg, rgba(99,102,241,0.15), rgba(167,139,250,0.08), rgba(99,102,241,0.15))', filter: 'blur(20px)' }} />
                  </motion.div>

                  <Box sx={{ p: 3.5, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 2, position: 'relative' }}>
                    <SectionTag color="#818cf8">Heatmap · Neural Grid</SectionTag>

                    {/* Blurred preview grid */}
                    <Box sx={{ width: '100%', height: 70, borderRadius: '12px', overflow: 'hidden', position: 'relative', border: '1px solid rgba(99,102,241,0.12)' }}>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(26,1fr)', gap: '2px', p: 1, filter: 'blur(4px)', opacity: 0.35 }}>
                        {Array.from({ length: 52 }).map((_, i) => (
                          <Box key={i} sx={{ aspectRatio: '1', borderRadius: '2px', bgcolor: `rgba(99,102,241,${0.05 + Math.random() * 0.85})` }} />
                        ))}
                      </Box>
                      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 0.75, borderRadius: '8px', bgcolor: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}>
                          <LockKeyhole size={13} color="#818cf8" />
                          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6rem', fontWeight: 800, color: '#818cf8', letterSpacing: 1 }}>
                            PRO LOCKED
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Box>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: isDark ? '#ffffff' : '#0f172a', mb: 0.5 }}>
                        Analytics Heatmap
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)', mb: 2, lineHeight: 1.5 }}>
                        Unlock global study heatmaps,<br />deep performance insights & more
                      </Typography>
                      <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                        <Button
                          variant="contained"
                          size="small"
                          sx={{
                            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                            color: 'white', fontWeight: 700, borderRadius: '10px',
                            textTransform: 'none', fontSize: '0.78rem', px: 2.5, py: 0.9,
                            boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
                            '&:hover': { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
                          }}
                        >
                          <Sparkles size={13} style={{ marginRight: 6 }} />
                          Unlock Premium
                        </Button>
                      </motion.div>
                    </Box>
                  </Box>
                </Box>
              </motion.div>
            </ScrollReveal>
          </Box>

        </Box>
      </Box>
    </Box>
  );
}