import { useEffect, useState, useRef, useCallback } from 'react';
import api from '../api/axios';
import {
  Search, SlidersHorizontal, UserPlus, BookOpen, MapPin, Zap, X,
  GraduationCap, Brain, ChevronLeft, ChevronRight, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Select, MenuItem, FormControl, InputLabel,
  Button, Avatar, Chip, CircularProgress, InputAdornment, useTheme,
  IconButton, Collapse
} from '@mui/material';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';

const LEVELS = ['High School', 'Undergraduate', 'Graduate', 'PhD', 'Self-Learner', 'Other'];
const STYLES = ['Visual', 'Auditory', 'Reading/Writing', 'Kinesthetic', 'Mixed'];

const STYLE_META = {
  Visual:            { color: '#818cf8', bg: 'rgba(99,102,241,0.14)',  gradient: 'linear-gradient(135deg,#6366f1,#818cf8)' },
  Auditory:          { color: '#34d399', bg: 'rgba(16,185,129,0.14)',  gradient: 'linear-gradient(135deg,#059669,#34d399)' },
  'Reading/Writing': { color: '#60a5fa', bg: 'rgba(59,130,246,0.14)',  gradient: 'linear-gradient(135deg,#2563eb,#60a5fa)' },
  Kinesthetic:       { color: '#fbbf24', bg: 'rgba(245,158,11,0.14)',  gradient: 'linear-gradient(135deg,#d97706,#fbbf24)' },
  Mixed:             { color: '#a78bfa', bg: 'rgba(139,92,246,0.14)',   gradient: 'linear-gradient(135deg,#7c3aed,#a78bfa)' },
};
const DEFAULT_STYLE = { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', gradient: 'linear-gradient(135deg,#475569,#94a3b8)' };

/* ─── Individual Card ─── */
function UserCard({ u, isActive, onConnect, alreadySent, navigate, isDark }) {
  const style = STYLE_META[u.studyStyle] || DEFAULT_STYLE;

  return (
    <Box
      sx={{
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column',
        borderRadius: '28px', overflow: 'hidden',
        bgcolor: isDark ? 'rgba(15,23,42,0.92)' : '#fff',
        border: '1px solid',
        borderColor: isActive
          ? style.color + '55'
          : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'),
        boxShadow: isActive
          ? `0 24px 60px ${style.color}22, 0 0 0 1px ${style.color}33`
          : (isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.06)'),
        transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {/* Gradient header */}
      <Box
        sx={{
          height: 110, flexShrink: 0, position: 'relative',
          background: style.gradient,
          display: 'flex', alignItems: 'flex-end', px: 3, pb: 2,
        }}
      >
        {/* Abstract pattern overlay */}
        <Box sx={{
          position: 'absolute', inset: 0, opacity: 0.15,
          backgroundImage: 'radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }} />
        <Avatar
          src={u.avatar}
          sx={{
            width: 64, height: 64, border: '3px solid white',
            fontSize: 26, fontWeight: 900,
            bgcolor: style.bg, color: style.color,
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            position: 'relative',
          }}
        >
          {u.name?.[0]}
        </Avatar>
      </Box>

      {/* Body */}
      <Box sx={{ flex: 1, p: 3, display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Name */}
        <Box sx={{ height: 52, mb: 0.5 }}>
          <Typography fontWeight={900} fontSize="1.05rem" color={isDark ? '#f1f5f9' : '#0f172a'} noWrap>
            {u.name}
          </Typography>
          {u.university && (
            <Typography variant="caption" color="text.secondary" fontWeight={600}
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }} noWrap>
              <MapPin size={10} /> {u.university}
            </Typography>
          )}
        </Box>

        {/* Subjects — fixed height */}
        <Box sx={{ height: 64, mb: 1 }}>
          <Typography variant="caption" fontWeight={800} color="text.disabled"
            sx={{ textTransform: 'uppercase', letterSpacing: 0.7, display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
            <BookOpen size={9} /> Subjects
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
            {u.subjects?.length > 0
              ? u.subjects.slice(0, 4).map(s => (
                  <Chip key={s} label={s} size="small"
                    sx={{ height: 20, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', fontWeight: 600, fontSize: '0.67rem', borderRadius: '6px' }}
                  />
                ))
              : <Typography variant="caption" color="text.disabled" fontStyle="italic" fontSize="0.72rem">No subjects listed</Typography>
            }
          </Box>
        </Box>

        {/* Tags — fixed height */}
        <Box sx={{ height: 28, display: 'flex', gap: 0.75, alignItems: 'center', mb: 2 }}>
          {u.studyStyle && (
            <Chip icon={<Brain size={9} style={{ color: style.color }} />} label={u.studyStyle} size="small"
              sx={{ height: 22, bgcolor: style.bg, color: style.color, fontWeight: 700, fontSize: '0.67rem', borderRadius: '7px' }}
            />
          )}
          {u.educationLevel && (
            <Chip icon={<GraduationCap size={9} style={{ color: '#f59e0b' }} />} label={u.educationLevel} size="small"
              sx={{ height: 22, bgcolor: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontWeight: 700, fontSize: '0.67rem', borderRadius: '7px' }}
            />
          )}
        </Box>

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1.25, pt: 2, borderTop: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
          <Button fullWidth variant="outlined" size="small"
            onClick={() => navigate(`/user/${u._id}`)}
            sx={{
              borderRadius: '12px', textTransform: 'none', fontWeight: 700, fontSize: '0.82rem', py: 0.9,
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)',
              color: isDark ? 'rgba(255,255,255,0.6)' : '#475569',
              '&:hover': { borderColor: style.color, color: style.color, bgcolor: style.bg },
            }}
          >
            Profile
          </Button>
          <Button fullWidth variant="contained" size="small"
            disabled={alreadySent}
            startIcon={alreadySent ? null : <UserPlus size={13} />}
            onClick={() => onConnect(u._id)}
            sx={{
              borderRadius: '12px', textTransform: 'none', fontWeight: 800, fontSize: '0.82rem', py: 0.9,
              background: alreadySent ? 'rgba(99,102,241,0.2)' : style.gradient,
              color: alreadySent ? '#818cf8' : 'white',
              boxShadow: alreadySent ? 'none' : `0 0 20px ${style.color}55`,
              '&:hover': { opacity: 0.88 },
              '&.Mui-disabled': { color: '#818cf8' },
            }}
          >
            {alreadySent ? '✓ Sent' : 'Connect'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

/* ─── Main Page ─── */
export default function Browse() {
  const { user } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ name: '', subject: '', location: '', educationLevel: '', studyStyle: '' });
  const [sentReqs, setSentReqs] = useState(new Set());

  const VISIBLE = 3; // cards visible at once
  const CARD_W = 300;
  const GAP = 24;

  const search = async (f = filters) => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(f).filter(([, v]) => v));
      const { data } = await api.get('/users/search', { params });
      setUsers(data);
      setActiveIdx(0);
    } catch { toast.error('Search failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { search({ ...filters, _limit: 8 }); }, []); // eslint-disable-line
  useEffect(() => {
    if (user?.sentRequests) setSentReqs(new Set(user.sentRequests.map(r => r._id || r)));
  }, [user]);

  const handleConnect = async (userId) => {
    try {
      await api.post(`/users/connect/${userId}`);
      setSentReqs(prev => new Set([...prev, userId]));
      toast.success('Request sent!', { icon: '✨' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const resetFilter = (key) => {
    const next = { ...filters, [key]: '' };
    setFilters(next); search(next);
  };

  const prev = useCallback(() => setActiveIdx(i => Math.max(0, i - 1)), []);
  const next = useCallback(() => setActiveIdx(i => Math.min(users.length - 1, i + 1)), [users.length]);

  // Drag support
  const dragX = useMotionValue(0);

  const handleDragEnd = (_, info) => {
    if (info.offset.x < -60) next();
    else if (info.offset.x > 60) prev();
    dragX.set(0);
  };

  // ── Keyboard arrow navigation ──
  useEffect(() => {
    const handleKey = (e) => {
      // Don't hijack when typing in an input / select / textarea
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      }
    };

    // Attach to the scrollable <main> container and window for broader coverage
    window.addEventListener('keydown', handleKey);
    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.addEventListener('keydown', handleKey);

    return () => {
      window.removeEventListener('keydown', handleKey);
      if (mainEl) mainEl.removeEventListener('keydown', handleKey);
    };
  }, [next, prev]);

  const activeCount = Object.values(filters).filter(Boolean).length;

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'white',
      borderRadius: '14px',
      '& fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)' },
      '&:hover fieldset': { borderColor: 'rgba(99,102,241,0.4)' },
      '&.Mui-focused fieldset': { borderColor: '#6366f1', borderWidth: 2 },
    },
  };

  return (
    <Box sx={{ py: { xs: 3, md: 5 }, px: { xs: 2, sm: 3, md: 4 }, position: 'relative', overflow: 'hidden' }}>
      {/* Ambient */}
      <Box sx={{ position: 'fixed', top: '10%', left: '5%', width: 700, height: 700, background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />
      <Box sx={{ position: 'fixed', bottom: '10%', right: '5%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />

      <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 1280, mx: 'auto' }}>

        {/* ── Header ── */}
        <Box sx={{ mb: 5 }}>
          <Typography variant="h2" fontWeight={900} color={isDark ? 'white' : '#0f172a'}
            sx={{ letterSpacing: '-1.5px', lineHeight: 1, mb: 0.75 }}>
            Suggested Peers
          </Typography>
          <Typography color="text.secondary" fontWeight={500} fontSize="1rem">
            Curated study buddies — swipe or click arrows to connect.
          </Typography>
        </Box>

        {/* ── Search Row ── */}
        <Box sx={{ display: 'flex', gap: 1.5, mb: 3, alignItems: 'center' }}>
          <TextField
            fullWidth
            placeholder="Search by name, university or subject…"
            value={filters.name}
            onChange={e => setFilters(f => ({ ...f, name: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && search()}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search size={17} style={{ color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)' }} /></InputAdornment>,
              endAdornment: filters.name
                ? <InputAdornment position="end"><IconButton size="small" onClick={() => resetFilter('name')}><X size={13} /></IconButton></InputAdornment>
                : null,
            }}
            sx={{ ...inputSx, '& .MuiOutlinedInput-root': { ...inputSx['& .MuiOutlinedInput-root'], borderRadius: '16px' } }}
          />
          <Button variant="contained" onClick={() => search()} disabled={loading}
            startIcon={loading ? <CircularProgress size={15} color="inherit" /> : <Search size={17} />}
            sx={{ borderRadius: '14px', px: 3, py: 1.45, fontWeight: 800, textTransform: 'none', bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, boxShadow: '0 0 20px rgba(99,102,241,0.35)', flexShrink: 0, minWidth: 120 }}>
            {loading ? 'Searching…' : 'Search'}
          </Button>
          <IconButton onClick={() => setShowFilters(v => !v)}
            sx={{
              flexShrink: 0, borderRadius: '12px', p: 1.6,
              bgcolor: showFilters ? 'rgba(99,102,241,0.15)' : (isDark ? 'rgba(255,255,255,0.05)' : 'white'),
              border: '1px solid', borderColor: showFilters ? 'rgba(99,102,241,0.4)' : (isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)'),
              color: showFilters ? '#6366f1' : 'text.secondary', position: 'relative',
            }}>
            <SlidersHorizontal size={18} />
            {activeCount > 0 && <Box sx={{ position: 'absolute', top: 5, right: 5, width: 8, height: 8, borderRadius: '50%', bgcolor: '#6366f1' }} />}
          </IconButton>
        </Box>

        {/* ── Filter Panel ── */}
        <Collapse in={showFilters}>
          <Box sx={{ mb: 3, p: 3, borderRadius: '20px', bgcolor: isDark ? 'rgba(15,23,42,0.85)' : 'white', border: '1px solid', borderColor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.12)', display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            {[{ label: 'Subject', key: 'subject', placeholder: 'e.g. Mathematics' }, { label: 'Location', key: 'location', placeholder: 'City or country' }].map(f => (
              <TextField key={f.key} label={f.label} size="small" value={filters[f.key]}
                placeholder={f.placeholder} sx={{ ...inputSx, minWidth: 160 }}
                onChange={e => setFilters(p => ({ ...p, [f.key]: e.target.value }))} />
            ))}
            <FormControl size="small" sx={{ ...inputSx, minWidth: 160 }}>
              <InputLabel>Education</InputLabel>
              <Select label="Education" value={filters.educationLevel} onChange={e => setFilters(p => ({ ...p, educationLevel: e.target.value }))}>
                <MenuItem value="">All</MenuItem>
                {LEVELS.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ ...inputSx, minWidth: 160 }}>
              <InputLabel>Study Style</InputLabel>
              <Select label="Study Style" value={filters.studyStyle} onChange={e => setFilters(p => ({ ...p, studyStyle: e.target.value }))}>
                <MenuItem value="">All</MenuItem>
                {STYLES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
            <Button size="small" variant="text" onClick={() => { const r = { name: '', subject: '', location: '', educationLevel: '', studyStyle: '' }; setFilters(r); search(r); }}
              sx={{ textTransform: 'none', fontWeight: 700, color: 'text.secondary', borderRadius: '10px', '&:hover': { color: '#ef4444' } }}>
              Reset
            </Button>
          </Box>
        </Collapse>

        {/* Active chips */}
        {activeCount > 0 && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
            {Object.entries(filters).filter(([, v]) => v).map(([k, v]) => (
              <Chip key={k} label={`${k}: ${v}`} size="small" onDelete={() => resetFilter(k)}
                sx={{ bgcolor: 'rgba(99,102,241,0.1)', color: '#6366f1', fontWeight: 700, borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)' }} />
            ))}
          </Box>
        )}

        {/* ══ CAROUSEL ══ */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 480 }}>
            <CircularProgress size={56} thickness={4} sx={{ color: '#6366f1' }} />
          </Box>
        ) : users.length === 0 ? (
          <Box component={motion.div} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            sx={{ textAlign: 'center', py: 16, borderRadius: '28px', border: '1px dashed', borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' }}>
            <Search size={56} style={{ opacity: 0.12, margin: '0 auto 14px' }} />
            <Typography variant="h6" fontWeight={800} color={isDark ? 'white' : 'text.primary'}>No scholars found</Typography>
            <Typography color="text.secondary" mt={0.75}>Try broadening your search or clearing filters.</Typography>
          </Box>
        ) : (
          <Box>
            {/* Count + navigation */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="body2" color="text.secondary" fontWeight={700}>
                <Typography component="span" fontWeight={900} color={isDark ? 'white' : '#0f172a'} fontSize="1.1rem">
                  {activeIdx + 1}
                </Typography>
                {' '}/ {users.length} peers
              </Typography>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton onClick={prev} disabled={activeIdx === 0}
                  sx={{
                    width: 44, height: 44, borderRadius: '14px',
                    bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'white',
                    border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)',
                    '&:hover:not(:disabled)': { bgcolor: 'rgba(99,102,241,0.12)', borderColor: '#6366f1', color: '#6366f1' },
                    '&.Mui-disabled': { opacity: 0.3 },
                    transition: '0.2s',
                  }}>
                  <ChevronLeft size={20} />
                </IconButton>
                <IconButton onClick={next} disabled={activeIdx === users.length - 1}
                  sx={{
                    width: 44, height: 44, borderRadius: '14px',
                    bgcolor: '#6366f1', color: 'white',
                    border: '1px solid rgba(99,102,241,0.3)',
                    boxShadow: '0 0 16px rgba(99,102,241,0.35)',
                    '&:hover:not(:disabled)': { bgcolor: '#4f46e5' },
                    '&.Mui-disabled': { opacity: 0.3, bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0', color: isDark ? 'rgba(255,255,255,0.3)' : '#94a3b8', boxShadow: 'none' },
                    transition: '0.2s',
                  }}>
                  <ChevronRight size={20} />
                </IconButton>
              </Box>
            </Box>

            {/* ── Carousel Track ── */}
            <Box
              sx={{ position: 'relative', overflow: 'hidden', cursor: 'grab', '&:active': { cursor: 'grabbing' } }}
            >
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={handleDragEnd}
                style={{ display: 'flex', gap: `${GAP}px`, userSelect: 'none' }}
                animate={{ x: -activeIdx * (CARD_W + GAP) + (typeof window !== 'undefined' ? Math.max(0, (window.innerWidth - 300 - 128) / 2 - (CARD_W * 0.5)) : 0) }}
                transition={{ type: 'spring', stiffness: 300, damping: 35 }}
              >
                {users.map((u, i) => {
                  const isActive = i === activeIdx;
                  const dist = Math.abs(i - activeIdx);
                  const scale = isActive ? 1 : dist === 1 ? 0.88 : 0.78;
                  const opacity = isActive ? 1 : dist === 1 ? 0.7 : 0.4;

                  return (
                    <motion.div
                      key={u._id}
                      animate={{ scale, opacity, y: isActive ? 0 : 20 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      onClick={() => !isActive && setActiveIdx(i)}
                      style={{
                        width: CARD_W, minWidth: CARD_W, height: 460,
                        flexShrink: 0, cursor: isActive ? 'default' : 'pointer',
                        transformOrigin: 'center bottom',
                      }}
                    >
                      <motion.div
                        animate={{ y: isActive ? [0, -12, 0] : 0 }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ height: '100%' }}
                      >
                        <UserCard u={u} isActive={isActive} onConnect={handleConnect} navigate={navigate} isDark={isDark}
                          alreadySent={sentReqs.has(u._id) || user?.connections?.includes(u._id)} />
                      </motion.div>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Left / Right gradient fades */}
              <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 80, background: isDark ? 'linear-gradient(90deg, rgba(10,10,25,0.95), transparent)' : 'linear-gradient(90deg, rgba(245,245,255,0.95), transparent)', pointerEvents: 'none', zIndex: 2 }} />
              <Box sx={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, background: isDark ? 'linear-gradient(270deg, rgba(10,10,25,0.95), transparent)' : 'linear-gradient(270deg, rgba(245,245,255,0.95), transparent)', pointerEvents: 'none', zIndex: 2 }} />
            </Box>

            {/* ── Dot Indicators ── */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 4 }}>
              {users.map((_, i) => (
                <Box
                  key={i}
                  component={motion.div}
                  animate={{
                    width: i === activeIdx ? 28 : 8,
                    bgcolor: i === activeIdx ? '#6366f1' : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'),
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  onClick={() => setActiveIdx(i)}
                  sx={{
                    height: 8, borderRadius: '100px', cursor: 'pointer',
                    bgcolor: i === activeIdx ? '#6366f1' : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'),
                    width: i === activeIdx ? 28 : 8,
                    boxShadow: i === activeIdx ? '0 0 10px rgba(99,102,241,0.5)' : 'none',
                    transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                    '&:hover': { bgcolor: '#818cf8' },
                  }}
                />
              ))}
            </Box>

            {/* ── Quick-View Strip (full list) ── */}
            <Box sx={{ mt: 5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography fontWeight={800} color={isDark ? 'rgba(255,255,255,0.6)' : '#475569'} fontSize="0.85rem" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                  Suggested Users
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>{users.length} total</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { height: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', borderRadius: 2 } }}>
                {users.map((u, i) => {
                  const style = STYLE_META[u.studyStyle] || DEFAULT_STYLE;
                  const isActive = i === activeIdx;
                  return (
                    <Box
                      key={u._id}
                      component={motion.div}
                      whileHover={{ y: -4 }}
                      onClick={() => setActiveIdx(i)}
                      sx={{
                        flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75,
                        p: 1.5, borderRadius: '16px', cursor: 'pointer', minWidth: 72,
                        bgcolor: isActive ? style.bg : 'transparent',
                        border: '1px solid', borderColor: isActive ? style.color + '44' : 'transparent',
                        transition: '0.2s',
                      }}
                    >
                      <Avatar src={u.avatar}
                        sx={{
                          width: 44, height: 44, fontWeight: 800, fontSize: 16,
                          bgcolor: style.bg, color: style.color,
                          border: '2px solid', borderColor: isActive ? style.color : 'transparent',
                          boxShadow: isActive ? `0 0 12px ${style.color}44` : 'none',
                        }}>
                        {u.name?.[0]}
                      </Avatar>
                      <Typography variant="caption" fontWeight={700} color={isDark ? 'rgba(255,255,255,0.7)' : '#475569'} noWrap
                        sx={{ maxWidth: 64, fontSize: '0.62rem', textAlign: 'center' }}>
                        {u.name?.split(' ')[0]}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
