import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Box, Typography, CircularProgress, useTheme, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Tooltip as RTooltip,
  XAxis, YAxis, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { BarChart2, Flame, Award, Users, Clock, Zap, Target, TrendingUp } from 'lucide-react';

const COLORS = ['#6366f1', '#22d3ee', '#10b981', '#f59e0b', '#a78bfa', '#fb7185'];


function StatCard({ icon: Icon, label, value, unit = '', color = '#6366f1', delay = 0 }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Box sx={{
        p: 3, borderRadius: '16px', height: '100%',
        bgcolor: isDark ? '#0d1117' : '#ffffff',
        border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.06)',
        '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${color}, transparent)`, borderRadius: '16px 16px 0 0' },
        position: 'relative', overflow: 'hidden',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1.25, borderRadius: '10px', bgcolor: color + '15', display: 'flex' }}>
            <Icon size={18} color={color} />
          </Box>
          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6rem', fontWeight: 800, color: 'text.secondary', letterSpacing: 1.5, textTransform: 'uppercase' }}>
            {label}
          </Typography>
        </Box>
        <Typography sx={{ fontFamily: "'Courier New', monospace", fontWeight: 900, fontSize: '2.2rem', color: isDark ? 'white' : '#0f172a', mt: 2, lineHeight: 1 }}>
          {value}<Box component="span" sx={{ fontSize: '1rem', color, ml: 0.5 }}>{unit}</Box>
        </Typography>
      </Box>
    </motion.div>
  );
}

function ActivityHeatmap({ activityLog }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Build last 52 weeks × 7 days grid
  const today = new Date();
  const cells = [];
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    const count = (activityLog || []).filter(a => new Date(a).toISOString().split('T')[0] === ds).length;
    cells.push({ date: ds, count, month: d.getMonth(), day: d.getDay() });
  }

  const intensity = (count) => {
    if (count === 0) return isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    if (count === 1) return isDark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.25)';
    if (count <= 3) return 'rgba(99,102,241,0.55)';
    return '#6366f1';
  };


  const weeks = [];
  for (let w = 0; w < 53; w++) weeks.push(cells.slice(w * 7, w * 7 + 7));


  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 0.35, overflowX: 'auto', pb: 1, position: 'relative' }}>
        {weeks.map((week, wi) => (
          <Box key={wi} sx={{ display: 'flex', flexDirection: 'column', gap: 0.35, flexShrink: 0 }}>
            {week.map((cell, di) => (
              <Box key={di} title={`${cell.date}: ${cell.count} activities`}
                sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: intensity(cell.count), cursor: 'default', transition: 'opacity 0.2s', '&:hover': { opacity: 0.7 } }} />
            ))}
          </Box>
        ))}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
        <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled', fontFamily: 'monospace' }}>Less</Typography>
        {[0, 1, 2, 4, 6].map(c => (
          <Box key={c} sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: intensity(c) }} />
        ))}
        <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled', fontFamily: 'monospace' }}>More</Typography>
      </Box>
    </Box>
  );
}

export default function Analytics() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/analytics/me').then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const surf = isDark ? '#080c14' : '#f6f8fa';
  const card = isDark ? '#0d1117' : '#ffffff';
  const border = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const txt = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', bgcolor: surf }}>
      <CircularProgress sx={{ color: '#6366f1' }} />
    </Box>
  );

  // Fallback empty data
  const d = data || { totalStudyHours: 0, streak: 0, badgeCount: 0, connectionCount: 0, xp: 0, level: 1, sessionsByWeek: [], hoursByDay: [], topSubjects: [], activityLog: [] };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: surf, color: isDark ? '#e5e7eb' : '#111827', fontFamily: "'Inter', sans-serif", pb: 8 }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, pt: 4 }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.65rem', color: '#6366f1', fontWeight: 800, letterSpacing: 3, mb: 0.5 }}>
              ▸ PERSONAL · ANALYTICS
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: '12px', background: 'linear-gradient(135deg, #4f46e5, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(99,102,241,0.35)' }}>
                <BarChart2 size={22} color="white" />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '1.8rem', fontWeight: 900, color: isDark ? 'white' : '#0f172a', lineHeight: 1, letterSpacing: -1 }}>
                  Study Analytics
                </Typography>
                <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mt: 0.25 }}>
                  Your personal performance dashboard — all time
                </Typography>
              </Box>
            </Box>
          </Box>
        </motion.div>

        {/* Stat Cards Row */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' }, gap: 2, mb: 4 }}>
          <StatCard icon={Clock} label="Study Hours" value={d.totalStudyHours} unit="h" color="#6366f1" delay={0} />
          <StatCard icon={Flame} label="Streak" value={d.streak} unit="d" color="#f97316" delay={0.04} />
          <StatCard icon={Award} label="Badges" value={d.badgeCount} color="#eab308" delay={0.08} />
          <StatCard icon={Users} label="Connections" value={d.connectionCount} color="#22d3ee" delay={0.12} />
          <StatCard icon={Zap} label="XP Earned" value={d.xp} color="#a78bfa" delay={0.16} />
          <StatCard icon={Target} label="Level" value={d.level} color="#10b981" delay={0.2} />
        </Box>

        {/* Charts Row */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3, mb: 3 }}>

          {/* Sessions per Week */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
            <Box sx={{ p: 3, borderRadius: '16px', bgcolor: card, border: `1px solid ${border}`, boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.06)', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <TrendingUp size={16} color="#22d3ee" />
                <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: isDark ? 'white' : '#0f172a' }}>Sessions Per Week</Typography>
                <Chip label="8 WEEKS" size="small" sx={{ ml: 'auto', bgcolor: 'rgba(34,211,238,0.1)', color: '#22d3ee', fontFamily: 'monospace', fontWeight: 800, fontSize: '0.6rem' }} />
              </Box>
              {d.sessionsByWeek.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={d.sessionsByWeek} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                    <XAxis dataKey="week" tick={{ fontSize: 10, fill: txt, fontFamily: 'monospace' }} />
                    <YAxis tick={{ fontSize: 10, fill: txt, fontFamily: 'monospace' }} />
                    <RTooltip contentStyle={{ background: card, border: `1px solid ${border}`, borderRadius: 8, fontFamily: 'monospace', fontSize: 12 }} />

                    <Bar dataKey="sessions" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.disabled', flexDirection: 'column', gap: 1 }}>
                  <BarChart2 size={32} opacity={0.3} />
                  <Typography sx={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>No sessions yet</Typography>
                </Box>
              )}
            </Box>
          </motion.div>

          {/* Study Hours per Day */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
            <Box sx={{ p: 3, borderRadius: '16px', bgcolor: card, border: `1px solid ${border}`, boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.06)', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Clock size={16} color="#6366f1" />
                <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: isDark ? 'white' : '#0f172a' }}>Hours Studied</Typography>
                <Chip label="30 DAYS" size="small" sx={{ ml: 'auto', bgcolor: 'rgba(99,102,241,0.1)', color: '#6366f1', fontFamily: 'monospace', fontWeight: 800, fontSize: '0.6rem' }} />
              </Box>
              {d.hoursByDay.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={d.hoursByDay} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: txt, fontFamily: 'monospace' }} tickFormatter={v => v.slice(5)} />
                    <YAxis tick={{ fontSize: 10, fill: txt, fontFamily: 'monospace' }} />
                    <RTooltip contentStyle={{ background: card, border: `1px solid ${border}`, borderRadius: 8, fontFamily: 'monospace', fontSize: 12 }} />
                    <Area type="monotone" dataKey="hours" stroke="#6366f1" fill="url(#hoursGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.disabled', flexDirection: 'column', gap: 1 }}>
                  <Clock size={32} opacity={0.3} />
                  <Typography sx={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>Log study time to see data</Typography>
                </Box>
              )}
            </Box>
          </motion.div>
        </Box>

        {/* Top Subjects + Activity Heatmap */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '340px 1fr' }, gap: 3 }}>

          {/* Pie chart — Top Subjects */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
            <Box sx={{ p: 3, borderRadius: '16px', bgcolor: card, border: `1px solid ${border}`, boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.06)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Target size={16} color="#a78bfa" />
                <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: isDark ? 'white' : '#0f172a' }}>Top Subjects</Typography>
              </Box>
              {d.topSubjects.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={d.topSubjects} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                        {d.topSubjects.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <RTooltip contentStyle={{ background: card, border: `1px solid ${border}`, borderRadius: 8, fontFamily: 'monospace', fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mt: 1 }}>
                    {d.topSubjects.map((s, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: COLORS[i % COLORS.length], flexShrink: 0 }} />
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isDark ? 'white' : '#374151' }}>{s.name}</Typography>
                        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 800, color: COLORS[i % COLORS.length] }}>{s.value}</Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              ) : (
                <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.disabled', flexDirection: 'column', gap: 1 }}>
                  <Target size={32} opacity={0.3} />
                  <Typography sx={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>Join sessions to see subjects</Typography>
                </Box>
              )}
            </Box>
          </motion.div>

          {/* Activity Heatmap */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}>
            <Box sx={{ p: 3, borderRadius: '16px', bgcolor: card, border: `1px solid ${border}`, boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.06)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <BarChart2 size={16} color="#10b981" />
                <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: isDark ? 'white' : '#0f172a' }}>Activity Heatmap</Typography>
                <Chip label="365 DAYS" size="small" sx={{ ml: 'auto', bgcolor: 'rgba(16,185,129,0.1)', color: '#10b981', fontFamily: 'monospace', fontWeight: 800, fontSize: '0.6rem' }} />
              </Box>
              <ActivityHeatmap activityLog={d.activityLog} />
            </Box>
          </motion.div>
        </Box>
      </Box>
    </Box>
  );
}
