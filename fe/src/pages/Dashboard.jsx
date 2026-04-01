import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, useMotionValue, animate } from 'framer-motion';
import { Box, Typography, Button, useTheme, Chip, Tooltip, Divider, LinearProgress } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  Users, Calendar, Activity, RefreshCw, Zap, MessageCircle,
  ChevronRight, LockKeyhole, BrainCircuit, BarChart2, Clock,
  GitBranch, TrendingUp, ArrowUpRight, Flame, Target, Award,
  Terminal, Network, Database, Command
} from 'lucide-react';

import StudyQuoteWidget     from '../components/dashboard/StudyQuoteWidget';
import AIInsightsWidget     from '../components/dashboard/AIInsightsWidget';
import FocusTimerWidget     from '../components/dashboard/FocusTimerWidget';
import MiniCalendarWidget   from '../components/dashboard/MiniCalendarWidget';
import StudyAnalyticsWidget from '../components/dashboard/StudyAnalyticsWidget';
import BountiesWidget       from '../components/dashboard/BountiesWidget';

/* ── Animated counter ── */
function AnimCount({ target }) {
  const val = useMotionValue(0);
  const [d, setD] = useState(0);
  useEffect(() => {
    const c = animate(val, target, { duration: 1.4, ease: 'easeOut' });
    val.on('change', v => setD(Math.round(v)));
    return c.stop;
  }, [target]);
  return <>{d.toLocaleString()}</>;
}

/* ── Clarity Card — clean, airy container ── */
function CCard({ children, onClick, accent, sx = {} }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [hov, setHov] = useState(false);
  return (
    <Box
      component={motion.div}
      onHoverStart={() => setHov(true)}
      onHoverEnd={() => setHov(false)}
      whileHover={{ y: -2 }}
      onClick={onClick}
      sx={{
        position: 'relative', borderRadius: '16px', height: '100%',
        bgcolor: isDark ? '#0d1117' : '#ffffff',
        border: '1px solid',
        borderColor: hov && accent
          ? accent + '55'
          : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
        boxShadow: isDark
          ? hov ? '0 8px 32px rgba(0,0,0,0.4)' : '0 1px 8px rgba(0,0,0,0.3)'
          : hov ? '0 8px 32px rgba(0,0,0,0.08)' : '0 1px 4px rgba(0,0,0,0.05)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        overflow: 'hidden',
        ...(accent && {
          '&::before': {
            content: '""', position: 'absolute',
            top: 0, left: 0, right: 0, height: '2px',
            background: `linear-gradient(90deg, ${accent}, transparent)`,
            opacity: hov ? 1 : 0.5, transition: 'opacity 0.2s',
          }
        }),
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

/* ── Command label ── */
function CmdLabel({ children, color = '#6366f1' }) {
  return (
    <Typography
      component="span"
      sx={{
        fontFamily: "'Courier New', monospace",
        fontSize: '0.6rem', fontWeight: 800,
        color, letterSpacing: 2, textTransform: 'uppercase',
        display: 'flex', alignItems: 'center', gap: 0.5,
      }}
    >
      <span style={{ opacity: 0.5 }}>▸</span> {children}
    </Typography>
  );
}

/* ── Status dot ── */
function StatusDot({ color = '#22c55e', pulse = false }) {
  return (
    <Box
      component={pulse ? motion.div : 'div'}
      animate={pulse ? { opacity: [1, 0.3, 1] } : undefined}
      transition={pulse ? { repeat: Infinity, duration: 2 } : undefined}
      sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: color, boxShadow: `0 0 6px ${color}`, flexShrink: 0, willChange: pulse ? 'opacity' : 'auto' }}
    />
  );
}

/* ── Stat cell ── */
function StatCell({ icon: Icon, label, value, trend, color, onClick, loading }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <CCard accent={color} onClick={onClick} sx={{ minHeight: 120 }}>
      <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ p: 1, borderRadius: '8px', bgcolor: color + '12', display: 'flex' }}>
            <Icon size={16} color={color} />
          </Box>
          {trend !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, px: 1, py: 0.25, borderRadius: '6px', bgcolor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
              <TrendingUp size={10} color="#22c55e" />
              <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: '#22c55e', fontFamily: 'monospace' }}>+{trend}%</Typography>
            </Box>
          )}
        </Box>
        <Box>
          <Typography sx={{ fontFamily: "'Courier New',monospace", fontWeight: 900, fontSize: '2rem', color: isDark ? 'white' : '#0f172a', lineHeight: 1, mb: 0.25 }}>
            {loading ? '—' : <AnimCount target={value} />}
          </Typography>
          <CmdLabel color={color}>{label}</CmdLabel>
        </Box>
      </Box>
    </CCard>
  );
}

/* ── Kbd shortcut chip ── */
function Kbd({ keys }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Box sx={{ display: 'flex', gap: 0.4 }}>
      {keys.map(k => (
        <Box key={k} sx={{
          px: 0.75, py: 0.2, borderRadius: '5px', fontFamily: 'monospace', fontSize: '0.6rem', fontWeight: 700,
          bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
          color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
          boxShadow: `0 1px 0 ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
        }}>{k}</Box>
      ))}
    </Box>
  );
}

/* ════════════════ MAIN ════════════════ */
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

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [c, s] = await Promise.all([api.get('/users/connections'), api.get('/sessions/my')]);
        setStats({ connections: c.data.connections.length, sessions: s.data.length, pending: c.data.pendingRequests.length });
        setLastUpdated(new Date());
      } catch {}
      finally { setLoading(false); }
    })();
  }, [user, refreshKey]);

  const xpPct = Math.min((user?.xp || 0) % 100, 100);

  const QUICK_ACTIONS = [
    { label: 'Browse Scholars', keys: ['⌘', 'B'], to: '/browse',       color: '#6366f1' },
    { label: 'New Session',     keys: ['⌘', 'N'], to: '/sessions',      color: '#22d3ee' },
    { label: 'Messages',        keys: ['⌘', 'M'], to: '/messages',      color: '#a78bfa' },
    { label: 'Quest Hub',       keys: ['⌘', 'Q'], to: '/gamification',  color: '#f59e0b' },
    { label: 'Leaderboard',     keys: ['⌘', 'L'], to: '/leaderboard',   color: '#34d399' },
  ];

  return (
    <Box sx={{
      minHeight: '100vh', pb: 8,
      bgcolor: isDark ? '#080c14' : '#f6f8fa',
      color: isDark ? '#e5e7eb' : '#111827',
      fontFamily: "'Inter', sans-serif",
    }}>
      <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, pt: 2 }}>

        {/* ══ COMMAND HEADER ══ */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 2, mb: 4, px: 3, py: 2, borderRadius: '14px',
            bgcolor: isDark ? '#0d1117' : '#ffffff',
            border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
            boxShadow: isDark ? '0 1px 8px rgba(0,0,0,0.4)' : '0 1px 4px rgba(0,0,0,0.05)',
          }}>
            {/* Left: greeting */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 34, height: 34, borderRadius: '9px', background: 'linear-gradient(135deg,#4f46e5,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 12px rgba(99,102,241,0.35)' }}>
                <Command size={16} color="white" />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: isDark ? 'white' : '#0f172a', lineHeight: 1 }}>
                  {time.getHours() < 12 ? 'Good morning' : time.getHours() < 17 ? 'Good afternoon' : 'Good evening'},{' '}
                  <Box component="span" sx={{ background: 'linear-gradient(90deg,#6366f1,#22d3ee)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {user?.name?.split(' ')[0]}
                  </Box>
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                  <StatusDot pulse />
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6rem', color: '#22c55e', fontWeight: 700, letterSpacing: 1 }}>SYSTEM ONLINE</Typography>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'text.disabled', letterSpacing: 1 }}>·</Typography>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'text.disabled', letterSpacing: 1 }}>
                    {time.toLocaleTimeString('en-US', { hour12: false })}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Right: actions */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Tooltip title="Sync data">
                <Box
                  component={motion.div}
                  whileHover={{ rotate: 180 }} whileTap={{ scale: 0.9 }}
                  onClick={() => setRefreshKey(k => k + 1)}
                  sx={{ p: 1, borderRadius: '8px', cursor: 'pointer', color: '#6366f1', bgcolor: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', display: 'flex' }}
                >
                  <RefreshCw size={15} />
                </Box>
              </Tooltip>
              {lastUpdated && (
                <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'text.disabled', letterSpacing: 1 }}>
                  synced {lastUpdated.toLocaleTimeString()}
                </Typography>
              )}
            </Box>
          </Box>
        </motion.div>

        {/* ══ STAT ROW ══ */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
            <StatCell icon={Users}    label="Connections"  value={stats.connections} color="#6366f1" trend={12} onClick={() => navigate('/connections')} loading={loading} />
            <StatCell icon={Calendar} label="Sessions"     value={stats.sessions}    color="#22d3ee" trend={8}  onClick={() => navigate('/sessions')}    loading={loading} />
            <StatCell icon={Activity} label="Pending"      value={stats.pending}     color="#a78bfa" trend={5}  onClick={() => navigate('/connections')} loading={loading} />
          </Box>
        </motion.div>

        {/* ══ XP / COMMAND STRIP ══ */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <CCard accent="#6366f1" onClick={(e) => { if (e.target.closest('a') || e.target.closest('button')) return; navigate('/gamification'); }} sx={{ mb: 3 }}>
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: { xs: 2, md: 4 }, flexWrap: 'wrap' }}>
              {/* Level badge */}
              <Box sx={{ flexShrink: 0, width: 52, height: 52, borderRadius: '12px', bgcolor: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1.3rem', color: '#6366f1', lineHeight: 1 }}>{user?.level || 1}</Typography>
                <Typography sx={{ fontFamily: 'monospace', fontSize: '0.5rem', color: 'rgba(99,102,241,0.6)', letterSpacing: 1, fontWeight: 700 }}>LVL</Typography>
              </Box>
              {/* Progress */}
              <Box sx={{ flex: 1, minWidth: 160 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: isDark ? 'white' : '#0f172a' }}>Level {user?.level || 1} Scholar</Typography>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#6366f1', fontWeight: 800 }}>{user?.xp || 0} / {((user?.level || 1) * 100)} XP</Typography>
                </Box>
                <Box sx={{ height: 6, borderRadius: '3px', bgcolor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${xpPct}%` }} transition={{ duration: 1.6, ease: 'easeOut', delay: 0.4 }}
                    style={{ height: '100%', background: 'linear-gradient(90deg,#6366f1,#22d3ee)', borderRadius: 3 }} />
                </Box>
                <Typography sx={{ fontFamily: 'monospace', fontSize: '0.58rem', color: 'text.disabled', mt: 0.5, letterSpacing: 1 }}>{100 - xpPct}% TO NEXT LEVEL</Typography>
              </Box>
              {/* Quick stats */}
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                {[
                  { icon: Flame, val: `${user?.streak || 0}d`, label: 'STREAK', color: '#f97316' },
                  { icon: Target, val: user?.xp || 0, label: 'TOTAL XP', color: '#a78bfa' },
                  { icon: Award, val: user?.badges?.length || 0, label: 'BADGES', color: '#eab308' },
                ].map(s => (
                  <Box key={s.label} sx={{ px: 2, py: 1, borderRadius: '10px', bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)', textAlign: 'center' }}>
                    <Typography sx={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1rem', color: s.color }}>{s.val}</Typography>
                    <CmdLabel color={s.color}>{s.label}</CmdLabel>
                  </Box>
                ))}
              </Box>
              <Button component={RouterLink} to="/gamification"
                sx={{ bgcolor: 'rgba(99,102,241,0.08)', color: '#6366f1', fontWeight: 700, borderRadius: '10px', px: 2.5, py: 1, textTransform: 'none', border: '1px solid rgba(99,102,241,0.2)', flexShrink: 0, '&:hover': { bgcolor: 'rgba(99,102,241,0.15)' }, fontSize: '0.82rem' }}>
                Quest Hub →
              </Button>
            </Box>
          </CCard>
        </motion.div>

        {/* ══ QUICK ACTIONS COMMAND ROW ══ */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 1 }}>
              <Terminal size={13} color={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'} />
              <Typography sx={{ fontFamily: 'monospace', fontSize: '0.62rem', color: 'text.disabled', letterSpacing: 1, fontWeight: 700 }}>QUICK COMMANDS</Typography>
            </Box>
            {QUICK_ACTIONS.map(a => (
              <Box
                key={a.to}
                component={motion.div}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(a.to)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer',
                  px: 2, py: 1, borderRadius: '10px', textDecoration: 'none',
                  bgcolor: isDark ? '#0d1117' : '#ffffff',
                  border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
                  boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
                  '&:hover': { borderColor: a.color + '44', boxShadow: `0 0 12px ${a.color}22` },
                  transition: 'all 0.15s',
                }}
              >
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.7)' : '#374151' }}>{a.label}</Typography>
                <Kbd keys={a.keys} />
              </Box>
            ))}
          </Box>
        </motion.div>

        {/* ══ MAIN GRID ══ */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(12,1fr)' }, gap: 3 }}>

          {/* Analytics 8-col */}
          <Box sx={{ gridColumn: { xs: 'span 1', lg: 'span 8' } }}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} style={{ height: '100%' }}>
              <CCard accent="#6366f1" onClick={(e) => { if (e.target.closest('button')) return; navigate('/profile'); }} sx={{ minHeight: 380 }}>
                <Box sx={{ p: 3, height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                    <Box>
                      <CmdLabel color="#6366f1">analytics · performance</CmdLabel>
                      <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: isDark ? 'white' : '#0f172a', mt: 0.5 }}>Study Analytics</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <StatusDot pulse color="#6366f1" />
                      <Kbd keys={['⌘', 'A']} />
                    </Box>
                  </Box>
                  <StudyAnalyticsWidget />
                </Box>
              </CCard>
            </motion.div>
          </Box>

          {/* Bounties 4-col */}
          <Box sx={{ gridColumn: { xs: 'span 1', lg: 'span 4' } }}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ height: '100%' }}>
              <CCard accent="#22d3ee" onClick={(e) => { if (e.target.closest('button')) return; navigate('/gamification'); }} sx={{ minHeight: 380 }}>
                <Box sx={{ p: 3, height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                    <Box>
                      <CmdLabel color="#22d3ee">missions · active</CmdLabel>
                      <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: isDark ? 'white' : '#0f172a', mt: 0.5 }}>Bounties</Typography>
                    </Box>
                    <Kbd keys={['⌘', 'Q']} />
                  </Box>
                  <BountiesWidget />
                </Box>
              </CCard>
            </motion.div>
          </Box>

          {/* AI 6-col */}
          <Box sx={{ gridColumn: { xs: 'span 1', lg: 'span 6' } }}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} style={{ height: '100%' }}>
              <CCard accent="#a78bfa" sx={{ minHeight: 340 }}>
                <Box sx={{ p: 3, height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                    <Box>
                      <CmdLabel color="#a78bfa">ai · intelligence feed</CmdLabel>
                      <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: isDark ? 'white' : '#0f172a', mt: 0.5 }}>AI Insights</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <StatusDot pulse color="#a78bfa" />
                      <Kbd keys={['⌘', 'I']} />
                    </Box>
                  </Box>
                  <AIInsightsWidget />
                </Box>
              </CCard>
            </motion.div>
          </Box>

          {/* Focus 4-col + Community 2-col stacked */}
          <Box sx={{ gridColumn: { xs: 'span 1', lg: 'span 6' }, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Focus timer */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} style={{ flex: 1 }}>
              <CCard accent="#8b5cf6" onClick={(e) => { if (e.target.closest('button') || e.target.closest('input')) return; navigate('/focus'); }} sx={{ minHeight: 200 }}>
                <Box sx={{ p: 3, height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box>
                      <CmdLabel color="#8b5cf6">pomodoro · focus node</CmdLabel>
                      <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: isDark ? 'white' : '#0f172a', mt: 0.5 }}>Focus Timer</Typography>
                    </Box>
                    <Kbd keys={['⌘', 'F']} />
                  </Box>
                  <FocusTimerWidget />
                </Box>
              </CCard>
            </motion.div>
            {/* Community */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
              <CCard accent="#14b8a6" onClick={() => navigate('/browse')} sx={{ minHeight: 130 }}>
                <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.15)', flexShrink: 0 }}>
                    <MessageCircle size={22} color="#14b8a6" />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <CmdLabel color="#14b8a6">network · community sync</CmdLabel>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: isDark ? 'white' : '#0f172a', mt: 0.5, mb: 0.25 }}>Network Clear</Typography>
                    <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>All requests processed · Inbox zero</Typography>
                  </Box>
                  <ChevronRight size={16} color="rgba(99,102,241,0.4)" />
                </Box>
              </CCard>
            </motion.div>
          </Box>

          {/* Calendar 4 + Quote 4 + Heatmap 4 */}
          <Box sx={{ gridColumn: { xs: 'span 1', lg: 'span 4' } }}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ height: '100%' }}>
              <CCard accent="#38bdf8" onClick={(e) => { if (e.target.closest('button')) return; navigate('/sessions'); }} sx={{ minHeight: 300 }}>
                <Box sx={{ p: 3, height: '100%' }}>
                  <Box sx={{ mb: 2 }}>
                    <CmdLabel color="#38bdf8">timeline · session grid</CmdLabel>
                    <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: isDark ? 'white' : '#0f172a', mt: 0.5 }}>Calendar</Typography>
                  </Box>
                  <MiniCalendarWidget />
                </Box>
              </CCard>
            </motion.div>
          </Box>

          <Box sx={{ gridColumn: { xs: 'span 1', lg: 'span 4' } }}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }} style={{ height: '100%' }}>
              <CCard accent="#f59e0b" sx={{ minHeight: 300 }}>
                <Box sx={{ p: 3, height: '100%' }}>
                  <Box sx={{ mb: 2 }}>
                    <CmdLabel color="#f59e0b">signal · daily brief</CmdLabel>
                    <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: isDark ? 'white' : '#0f172a', mt: 0.5 }}>Study Quote</Typography>
                  </Box>
                  <StudyQuoteWidget />
                </Box>
              </CCard>
            </motion.div>
          </Box>

          {/* Locked heatmap */}
          <Box sx={{ gridColumn: { xs: 'span 1', lg: 'span 4' } }}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }} style={{ height: '100%' }}>
              <CCard accent="#6366f1" onClick={() => navigate('/billing')} sx={{ minHeight: 300 }}>
                <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 2 }}>
                  <CmdLabel color="#6366f1">heatmap · neural grid</CmdLabel>
                  {/* Blurred mini preview */}
                  <Box sx={{ width: '100%', height: 60, borderRadius: '8px', overflow: 'hidden', position: 'relative', border: '1px solid rgba(99,102,241,0.15)' }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(24,1fr)', gap: '2px', p: 0.75, filter: 'blur(3px)', opacity: 0.4 }}>
                      {Array.from({ length: 48 }).map((_, i) => (
                        <Box key={i} sx={{ aspectRatio: '1', borderRadius: '2px', bgcolor: `rgba(99,102,241,${0.1 + Math.random() * 0.8})` }} />
                      ))}
                    </Box>
                    <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <LockKeyhole size={18} color="#818cf8" />
                    </Box>
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: isDark ? 'white' : '#0f172a', mb: 0.5 }}>Analytics Locked</Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 1.5 }}>Upgrade to PRO to unlock global study heatmaps</Typography>
                    <Button variant="contained" size="small"
                      sx={{ background: 'linear-gradient(90deg,#4f46e5,#7c3aed)', color: 'white', fontWeight: 700, borderRadius: '8px', textTransform: 'none', fontSize: '0.75rem', px: 2, '&:hover': { opacity: 0.9 } }}>
                      Unlock Premium
                    </Button>
                  </Box>
                </Box>
              </CCard>
            </motion.div>
          </Box>

        </Box>
      </Box>
    </Box>
  );
}