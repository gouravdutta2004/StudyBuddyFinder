import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Box, Typography, CircularProgress, useTheme, Chip } from '@mui/material';
import { motion, Reorder } from 'framer-motion';
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, Tooltip as RTooltip,
  XAxis, YAxis, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { BarChart2, Clock, Hash, Target, TrendingUp, TrendingDown, Minus, GripHorizontal } from 'lucide-react';

const COLORS = ['#6366f1', '#22d3ee', '#10b981', '#f59e0b', '#a78bfa', '#fb7185'];

/* ── KPI Card ── */
function KPICard({ label, value, unit = '', delta, color, icon: Icon, delay = 0 }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const cardBg = isDark ? '#0d1117' : '#ffffff';
  const borderC = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';

  const deltaPositive = delta > 0;
  const deltaZero = delta === 0 || delta === undefined;
  const DeltaIcon = deltaZero ? Minus : deltaPositive ? TrendingUp : TrendingDown;
  const deltaColor = deltaZero ? '#6b7280' : deltaPositive ? '#22c55e' : '#ef4444';

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Box sx={{
        p: 3, borderRadius: '16px',
        bgcolor: cardBg,
        border: `1px solid ${borderC}`,
        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.25)' : '0 4px 16px rgba(0,0,0,0.06)',
        position: 'relative', overflow: 'hidden',
        height: '100%',
      }}>
        {/* Top accent line */}
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${color}, transparent)`, borderRadius: '16px 16px 0 0' }} />

        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.5 }}>
          <Box sx={{ p: 1.25, borderRadius: '10px', bgcolor: color + '18', display: 'flex' }}>
            <Icon size={18} color={color} />
          </Box>
          {/* Delta badge */}
          {!deltaZero && (
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 0.5,
              px: 1, py: 0.4, borderRadius: '8px',
              bgcolor: deltaColor + '14',
              border: `1px solid ${deltaColor}25`,
            }}>
              <DeltaIcon size={11} color={deltaColor} />
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: deltaColor }}>
                {deltaPositive ? '+' : ''}{delta}%
              </Typography>
            </Box>
          )}
        </Box>

        <Typography sx={{ fontWeight: 900, fontSize: '2rem', color: isDark ? 'white' : '#0f172a', lineHeight: 1, mb: 0.75, letterSpacing: -1 }}>
          {value}<Box component="span" sx={{ fontSize: '1rem', color, ml: 0.5, fontWeight: 600 }}>{unit}</Box>
        </Typography>
        <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
          {label}
        </Typography>
        {!deltaZero && (
          <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled', mt: 0.5 }}>
            {deltaPositive ? '↑' : '↓'} vs. last week
          </Typography>
        )}
      </Box>
    </motion.div>
  );
}

/* ── Activity Heatmap ── */
function ActivityHeatmap({ activityLog }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
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
      <Box sx={{ display: 'flex', gap: 0.35, overflowX: 'auto', pb: 1 }}>
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
        <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled' }}>Less</Typography>
        {[0, 1, 2, 4, 6].map(c => (
          <Box key={c} sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: intensity(c) }} />
        ))}
        <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled' }}>More</Typography>
      </Box>
    </Box>
  );
}

/* ── Section Card ── */
function SectionCard({ title, icon: Icon, color, chip, children, delay }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const cardBg = isDark ? '#0d1117' : '#ffffff';
  const borderC = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Box sx={{ p: 3, borderRadius: '16px', bgcolor: cardBg, border: `1px solid ${borderC}`, boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.25)' : '0 4px 16px rgba(0,0,0,0.06)', height: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <Icon size={16} color={color} />
          <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', color: isDark ? 'white' : '#0f172a' }}>{title}</Typography>
          {chip && <Box sx={{ ml: 'auto' }}><Chip label={chip} size="small" sx={{ bgcolor: color + '15', color, fontWeight: 800, fontSize: '0.62rem', fontFamily: 'monospace' }} /></Box>}
        </Box>
        {children}
      </Box>
    </motion.div>
  );
}

/* ── Empty chart placeholder ── */
function EmptyChart({ icon: Icon, msg }) {
  return (
    <Box sx={{ height: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'text.disabled', gap: 1 }}>
      <Icon size={28} opacity={0.3} />
      <Typography sx={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{msg}</Typography>
    </Box>
  );
}

export default function Analytics() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState(['kpis', 'charts', 'bottom']);

  useEffect(() => {
    api.get('/users/analytics/me').then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const surf = isDark ? '#080c14' : '#f6f8fa';
  const cardBg = isDark ? '#0d1117' : '#ffffff';
  const borderC = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const txt = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', bgcolor: surf }}>
      <CircularProgress sx={{ color: '#6366f1' }} />
    </Box>
  );

  const d = data || { totalStudyHours: 0, streak: 0, badgeCount: 0, connectionCount: 0, xp: 0, level: 1, sessionsByWeek: [], hoursByDay: [], topSubjects: [], activityLog: [] };

  /* Compute deltas (week-over-week from hoursByDay) */
  const days = d.hoursByDay || [];
  const thisWeekHours = days.slice(-7).reduce((s, x) => s + (x.hours || 0), 0);
  const lastWeekHours = days.slice(-14, -7).reduce((s, x) => s + (x.hours || 0), 0);
  const hoursDelta = lastWeekHours > 0 ? Math.round(((thisWeekHours - lastWeekHours) / lastWeekHours) * 100) : 0;

  const sessions = d.sessionsByWeek || [];
  const thisWeekSessions = sessions[sessions.length - 1]?.sessions || 0;
  const lastWeekSessions = sessions[sessions.length - 2]?.sessions || 0;
  const sessionsDelta = lastWeekSessions > 0 ? Math.round(((thisWeekSessions - lastWeekSessions) / lastWeekSessions) * 100) : 0;

  const avgFocusHours = days.length > 0 ? (days.reduce((s, x) => s + (x.hours || 0), 0) / days.filter(x => x.hours > 0).length || 0).toFixed(1) : 0;
  const prevAvgFocus = days.length > 14 ? (days.slice(-14, -7).reduce((s, x) => s + (x.hours || 0), 0) / 7).toFixed(1) : 0;
  const focusDelta = prevAvgFocus > 0 ? Math.round(((avgFocusHours - prevAvgFocus) / prevAvgFocus) * 100) : 0;

  return (
    <Box sx={{ bgcolor: surf, color: isDark ? '#e5e7eb' : '#111827', pb: 8 }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, pt: 4 }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <Box sx={{ mb: 5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: '12px', background: 'linear-gradient(135deg, #4f46e5, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(99,102,241,0.35)' }}>
                <BarChart2 size={22} color="white" />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '1.8rem', fontWeight: 900, color: isDark ? 'white' : '#0f172a', lineHeight: 1, letterSpacing: -1 }}>
                  Study Analytics
                </Typography>
                <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mt: 0.25 }}>
                  Your personal study performance overview
                </Typography>
              </Box>
            </Box>
          </Box>
        </motion.div>

        <Reorder.Group axis="y" values={sections} onReorder={setSections} style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {sections.map(sec => (
            <Reorder.Item key={sec} value={sec} style={{ position: 'relative', cursor: 'grab' }} whileDrag={{ cursor: 'grabbing', scale: 1.02, zIndex: 1 }}>
              
              <Box sx={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', borderRadius: '10px', px: 2, py: 0.25, opacity: 0, transition: 'opacity 0.2s', '&:hover': { opacity: 1 }, ...(!isDark && { boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }) }} className="drag-handle-show-on-hover">
                <GripHorizontal size={14} color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'} />
              </Box>

              <style>{`.drag-handle-show-on-hover { opacity: 0; } :hover > .drag-handle-show-on-hover { opacity: 1; }`}</style>
              
              {sec === 'kpis' && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2.5 }}>
                  <KPICard icon={Clock} label="Total Hours" value={d.totalStudyHours} unit="h" delta={hoursDelta} color="#6366f1" delay={0} />
                  <KPICard icon={Hash} label="Sessions" value={thisWeekSessions} unit="" delta={sessionsDelta} color="#22d3ee" delay={0.06} />
                  <KPICard icon={Target} label="Avg. Focus / Day" value={isNaN(avgFocusHours) ? 0 : avgFocusHours} unit="h" delta={!isNaN(focusDelta) ? focusDelta : 0} color="#10b981" delay={0.12} />
                </Box>
              )}

              {sec === 'charts' && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5 }}>
                  <SectionCard title="Sessions Per Week" icon={TrendingUp} color="#22d3ee" chip="8 WEEKS" delay={0.18}>
                    {d.sessionsByWeek.length > 0 ? (
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={d.sessionsByWeek} margin={{ top: 0, right: 0, left: -22, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} vertical={false} />
                          <XAxis dataKey="week" tick={{ fontSize: 10, fill: txt }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: txt }} axisLine={false} tickLine={false} />
                          <RTooltip contentStyle={{ background: cardBg, border: `1px solid ${borderC}`, borderRadius: 10, fontSize: 12 }} />
                          <Bar dataKey="sessions" fill="#22d3ee" radius={[6, 6, 0, 0]} maxBarSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <EmptyChart icon={BarChart2} msg="Start sessions to see data" />}
                  </SectionCard>

                  <SectionCard title="Hours Studied" icon={Clock} color="#6366f1" chip="30 DAYS" delay={0.22}>
                    {d.hoursByDay.length > 0 ? (
                      <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={d.hoursByDay} margin={{ top: 0, right: 0, left: -22, bottom: 0 }}>
                          <defs>
                            <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} vertical={false} />
                          <XAxis dataKey="date" tick={{ fontSize: 9, fill: txt }} tickFormatter={v => v.slice(5)} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: txt }} axisLine={false} tickLine={false} />
                          <RTooltip contentStyle={{ background: cardBg, border: `1px solid ${borderC}`, borderRadius: 10, fontSize: 12 }} />
                          <Area type="monotone" dataKey="hours" stroke="#6366f1" fill="url(#hoursGrad)" strokeWidth={2.5} dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : <EmptyChart icon={Clock} msg="Log study time to see data" />}
                  </SectionCard>
                </Box>
              )}

              {sec === 'bottom' && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '300px 1fr' }, gap: 2.5 }}>
                  <SectionCard title="Top Subjects" icon={Target} color="#a78bfa" delay={0.26}>
                    {d.topSubjects.length > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height={160}>
                          <PieChart>
                            <Pie data={d.topSubjects} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                              {d.topSubjects.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <RTooltip contentStyle={{ background: cardBg, border: `1px solid ${borderC}`, borderRadius: 10, fontSize: 12 }} />
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
                    ) : <EmptyChart icon={Target} msg="Join sessions to see subjects" />}
                  </SectionCard>

                  <SectionCard title="Activity Heatmap" icon={BarChart2} color="#10b981" chip="365 DAYS" delay={0.3}>
                    <ActivityHeatmap activityLog={d.activityLog} />
                  </SectionCard>
                </Box>
              )}
            </Reorder.Item>
          ))}
        </Reorder.Group>

      </Box>
    </Box>
  );
}
