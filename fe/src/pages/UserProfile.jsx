import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  User, MapPin, GraduationCap, BookOpen, MessageCircle, UserPlus,
  Pencil, UserMinus, Trophy, Flame, Clock, Star, Github, Linkedin,
  Instagram, BadgeCheck, Globe, Target, Zap, Shield, Award,
  TrendingUp, Brain, Heart, Users, ChevronRight, Download,
  Twitter, Youtube, Facebook, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import ActivityHeatmap from '../components/profile/ActivityHeatmap';
import MindMapModal from '../components/profile/MindMapModal';
import { Container, Box, Avatar, Typography, Button, Chip, Grid, LinearProgress, useTheme, IconButton, Tooltip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

/* ══════ SKELETON ══════ */
const pulse = {
  '@keyframes skPulse': { '0%': { opacity: 1 }, '50%': { opacity: 0.4 }, '100%': { opacity: 1 } },
  animation: 'skPulse 1.6s ease-in-out infinite',
};
const shimmer = {
  backgroundImage: 'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.06) 50%,transparent 100%)',
  backgroundSize: '200% 100%',
  '@keyframes shimmerX': { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
  animation: 'shimmerX 1.8s linear infinite',
};
function Bone({ width = '100%', height = 16, radius = 8, sx = {} }) {
  const { palette: { mode } } = useTheme();
  return <Box sx={{ width, height, borderRadius: radius, bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)', ...pulse, ...sx }} />;
}
function ProfileSkeleton() {
  const { palette: { mode } } = useTheme();
  const dark = mode === 'dark';
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ borderRadius: '24px', overflow: 'hidden', bgcolor: dark ? '#0d1117' : '#fff', border: '1px solid', borderColor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' }}>
        <Box sx={{ height: 240, bgcolor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', position: 'relative', ...shimmer }} />
        <Box sx={{ px: { xs: 3, md: 6 }, pt: 2, pb: 5, display: 'grid', gridTemplateColumns: { md: '220px 1fr' }, gap: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mt: -10 }}>
            <Bone width={140} height={140} radius="50%" />
            <Bone width={120} height={32} radius={8} />
            <Bone width={90} height={20} radius={6} />
            {[1,2,3].map(i => <Bone key={i} width="100%" height={14} radius={6} />)}
          </Box>
          <Box sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Bone width="45%" height={38} radius={10} />
            <Box sx={{ display: 'flex', gap: 1.5 }}>{[160,120,90].map(w => <Bone key={w} width={w} height={16} radius={6} />)}</Box>
            <Box sx={{ display: 'flex', gap: 1 }}>{[1,2,3].map(i => <Bone key={i} width={90} height={30} radius={8} />)}</Box>
            <Bone width="100%" height={80} radius={12} sx={{ mt: 1 }} />
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1.5, mt: 1 }}>
              {[1,2,3,4].map(i => <Bone key={i} width="100%" height={80} radius={12} />)}
            </Box>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}

/* ══════ BADGE DEFINITIONS ══════ */
const BADGE_META = {
  'Study Starter':   { emoji: '🌱', color: '#22c55e',  desc: 'First 5 study sessions',      tier: 'BRONZE'  },
  'Knowledge Seeker':{ emoji: '📚', color: '#6366f1',  desc: 'Read 10+ subjects',             tier: 'SILVER'  },
  'Streak Master':   { emoji: '🔥', color: '#f97316',  desc: '7+ day study streak',           tier: 'SILVER'  },
  'Top Scholar':     { emoji: '🏆', color: '#eab308',  desc: 'Reached top 10 leaderboard',   tier: 'GOLD'    },
  'Early Adopter':   { emoji: '⚡', color: '#a78bfa',  desc: 'Joined in the beta phase',      tier: 'BRONZE'  },
  'Connector':       { emoji: '🤝', color: '#22d3ee',  desc: '10+ connections made',          tier: 'SILVER'  },
  'Verified Scholar':{ emoji: '✅', color: '#3b82f6',  desc: 'Institutional verification',    tier: 'GOLD'    },
  'Night Owl':       { emoji: '🦉', color: '#818cf8',  desc: 'Studied past midnight',         tier: 'BRONZE'  },
  'Speed Runner':    { emoji: '💨', color: '#34d399',  desc: 'Completed 5+ sessions in a day',tier: 'SILVER'  },
  'Legend':          { emoji: '⭐', color: '#f59e0b',  desc: 'Reached XP level 50+',          tier: 'LEGEND'  },
};
const TIER_COLORS = { BRONZE: '#cd7f32', SILVER: '#a8a9ad', GOLD: '#eab308', LEGEND: '#a78bfa' };

function BadgeCard({ name, earned }) {
  const meta = BADGE_META[name] || { emoji: '🎖️', color: '#6366f1', desc: name, tier: 'BRONZE' };
  const { palette: { mode } } = useTheme();
  const dark = mode === 'dark';
  return (
    <Tooltip title={meta.desc} arrow placement="top">
      <Box
        component={motion.div}
        whileHover={{ y: -4, scale: 1.04 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        sx={{
          position: 'relative', borderRadius: '16px', p: 2, textAlign: 'center',
          bgcolor: earned ? (dark ? '#0d1117' : '#fff') : dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
          border: '1px solid',
          borderColor: earned ? meta.color + '44' : dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          boxShadow: earned ? `0 4px 20px ${meta.color}22` : 'none',
          opacity: earned ? 1 : 0.45,
          filter: earned ? 'none' : 'grayscale(1)',
          cursor: 'default', overflow: 'hidden',
        }}
        style={{ willChange: 'transform' }}
      >
        {earned && (
          <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg,transparent,${meta.color},transparent)` }} />
        )}
        <Typography sx={{ fontSize: '1.8rem', lineHeight: 1, mb: 0.75 }}>{meta.emoji}</Typography>
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 900, lineHeight: 1.2, color: earned ? (dark ? 'white' : '#0f172a') : 'text.disabled' }}>{name}</Typography>
        <Box sx={{ mt: 0.75, px: 0.75, py: 0.15, borderRadius: '5px', bgcolor: TIER_COLORS[meta.tier] + '22', border: `1px solid ${TIER_COLORS[meta.tier]}33`, display: 'inline-block' }}>
          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.5rem', fontWeight: 800, color: TIER_COLORS[meta.tier], letterSpacing: 1 }}>{meta.tier}</Typography>
        </Box>
      </Box>
    </Tooltip>
  );
}

/* ─── Social Accounts Grid ─── */
const SOCIAL_PLATFORMS = [
  { key: 'linkedin',  label: 'LinkedIn',    Icon: Linkedin,  color: '#0a66c2', bg: 'rgba(10,102,194,0.1)',   href: (v) => `https://linkedin.com/in/${v}`,   placeholder: 'e.g. reidhoffman' },
  { key: 'github',    label: 'GitHub',      Icon: Github,    color: '#e5e7eb', bg: 'rgba(255,255,255,0.06)', href: (v) => `https://github.com/${v}`,        placeholder: 'e.g. torvalds' },
  { key: 'twitter',   label: 'X (Twitter)', Icon: Twitter,   color: '#1da1f2', bg: 'rgba(29,161,242,0.1)',  href: (v) => `https://x.com/${v}`,             placeholder: 'e.g. elonmusk' },
  { key: 'instagram', label: 'Instagram',   Icon: Instagram, color: '#e1306c', bg: 'rgba(225,48,108,0.1)',  href: (v) => `https://instagram.com/${v}`,     placeholder: 'e.g. zuck' },
  { key: 'facebook',  label: 'Facebook',    Icon: Facebook,  color: '#1877f2', bg: 'rgba(24,119,242,0.1)',  href: (v) => `https://facebook.com/${v}`,      placeholder: 'e.g. zuckerberg' },
  { key: 'youtube',   label: 'YouTube',     Icon: Youtube,   color: '#ff0000', bg: 'rgba(255,0,0,0.1)',     href: (v) => `https://youtube.com/@${v}`,      placeholder: 'e.g. mkbhd' },
];

function SocialAccountsGrid({ socialLinks = {}, isDark, isSelf = false, onSave }) {
  const [editing, setEditing]   = useState(null); // platform key being edited
  const [inputVal, setInputVal] = useState('');
  const [saving, setSaving]     = useState(false);

  const connectedCount = SOCIAL_PLATFORMS.filter(p => socialLinks[p.key]).length;

  const openEdit = (key, currentVal) => {
    setEditing(key);
    setInputVal(currentVal || '');
  };

  const closeEdit = () => { setEditing(null); setInputVal(''); };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const updated = { ...socialLinks, [editing]: inputVal.trim().replace(/^@/, '') };
      const { data } = await api.put('/users/profile', { socialLinks: updated });
      onSave && onSave(data);
      toast.success(`${SOCIAL_PLATFORMS.find(p => p.key === editing)?.label} updated!`);
      closeEdit();
    } catch {
      toast.error('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const updated = { ...socialLinks, [editing]: '' };
      const { data } = await api.put('/users/profile', { socialLinks: updated });
      onSave && onSave(data);
      toast.success('Link removed.');
      closeEdit();
    } catch {
      toast.error('Failed to remove link.');
    } finally {
      setSaving(false);
    }
  };

  const activePlatform = SOCIAL_PLATFORMS.find(p => p.key === editing);

  return (
    <Box sx={{
      borderRadius: '18px', p: 3,
      bgcolor: isDark ? '#0d1117' : '#fff',
      border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
      boxShadow: isDark ? '0 1px 8px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.05)',
    }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
        <Box>
          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6rem', fontWeight: 800, color: '#6366f1', letterSpacing: 2, mb: 0.5 }}>▸ SOCIAL / ACCOUNTS</Typography>
          <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: isDark ? 'white' : '#0f172a' }}>Online Presence</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {connectedCount > 0 && (
            <Box sx={{ px: 1.25, py: 0.4, borderRadius: '8px', bgcolor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}>
              <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: '#22c55e', fontFamily: 'monospace' }}>
                {connectedCount} CONNECTED
              </Typography>
            </Box>
          )}
          {isSelf && (
            <Tooltip title="Edit social links in your profile settings" arrow>
              <Box sx={{ px: 1.25, py: 0.4, borderRadius: '8px', bgcolor: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', cursor: 'default' }}>
                <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: '#818cf8', fontFamily: 'monospace' }}>CLICK TO ADD</Typography>
              </Box>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Platform grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.25 }}>
        {SOCIAL_PLATFORMS.map(({ key, label, Icon, color, bg, href, placeholder }) => {
          const val = socialLinks[key];
          const isConnected = Boolean(val);
          const url = isConnected ? href(val) : null;
          const canEdit = isSelf;

          // Only render if connected, or if viewing own profile (to allow connection)
          if (!isConnected && !canEdit) return null;

          return (
            <Box
              key={key}
              component={isConnected && !canEdit ? 'a' : 'div'}
              href={isConnected && !canEdit ? url : undefined}
              target={isConnected && !canEdit ? '_blank' : undefined}
              rel="noopener noreferrer"
              onClick={() => {
                if (canEdit) { openEdit(key, val); return; }
                if (isConnected && url) window.open(url, '_blank');
              }}
              sx={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                p: 2, borderRadius: '14px', textDecoration: 'none', position: 'relative',
                bgcolor: isConnected ? bg : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'),
                border: '1px solid',
                borderColor: isConnected ? color + '33' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
                cursor: (canEdit || isConnected) ? 'pointer' : 'default',
                transition: 'all 0.2s',
                '&:hover': (canEdit || isConnected) ? {
                  transform: 'translateY(-3px)',
                  boxShadow: `0 6px 20px ${color}22`,
                  borderColor: color + '55',
                } : {},
              }}
            >
              {/* Connected indicator */}
              {isConnected && (
                <Box sx={{
                  position: 'absolute', top: 10, right: 10,
                  width: 8, height: 8, borderRadius: '50%', bgcolor: '#22c55e',
                  boxShadow: '0 0 6px rgba(34,197,94,0.7)',
                }} />
              )}

              {/* Edit "+" indicator for own unconnected profiles */}
              {!isConnected && canEdit && (
                <Box sx={{
                  position: 'absolute', top: 8, right: 8,
                  width: 18, height: 18, borderRadius: '50%',
                  bgcolor: 'rgba(99,102,241,0.18)',
                  border: '1px solid rgba(99,102,241,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 900, color: '#818cf8',
                  lineHeight: 1,
                }}>+</Box>
              )}

              <Icon
                size={24}
                color={isConnected ? color : (isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)')}
              />
              <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: isConnected ? (isDark ? 'white' : '#0f172a') : 'text.disabled', lineHeight: 1 }}>
                {label}
              </Typography>
              <Box component="span" sx={{ fontSize: '0.6rem', color: isConnected ? color : (canEdit ? '#818cf8' : 'text.disabled'), fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                {isConnected ? (
                  <><ExternalLink size={9} />@{val.slice(0, 12)}{val.length > 12 ? '…' : ''}</>
                ) : canEdit ? 'Tap to add' : 'Not connected'}
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Inline Edit Modal */}
      <AnimatePresence>
        {editing && activePlatform && (
          <Box
            sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2 }}
            onClick={closeEdit}
          >
            <Box
              component={motion.div}
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={e => e.stopPropagation()}
              sx={{
                width: '100%', maxWidth: 420,
                bgcolor: isDark ? '#0d1117' : '#fff',
                border: `1px solid ${activePlatform.color}40`,
                borderRadius: '20px',
                boxShadow: `0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px ${activePlatform.color}20`,
                overflow: 'hidden',
              }}
            >
              {/* Modal header */}
              <Box sx={{ px: 3, pt: 3, pb: 2, display: 'flex', alignItems: 'center', gap: 2, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: activePlatform.bg, border: `1px solid ${activePlatform.color}30`, display: 'flex' }}>
                  <activePlatform.Icon size={20} color={activePlatform.color} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: isDark ? 'white' : '#0f172a' }}>
                    {socialLinks[editing] ? 'Edit' : 'Connect'} {activePlatform.label}
                  </Typography>
                  <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
                    Enter your {activePlatform.label} username
                  </Typography>
                </Box>
                <IconButton size="small" onClick={closeEdit} sx={{ color: 'text.secondary' }}>
                  <Box component="span" sx={{ fontSize: '1.2rem', lineHeight: 1 }}>×</Box>
                </IconButton>
              </Box>

              {/* Input */}
              <Box sx={{ px: 3, py: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0, borderRadius: '12px', overflow: 'hidden', border: `1.5px solid ${activePlatform.color}60`, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', '&:focus-within': { borderColor: activePlatform.color } }}>
                  <Box sx={{ px: 1.5, py: 1.5, bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`, display: 'flex', alignItems: 'center' }}>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '0.85rem', color: activePlatform.color, fontWeight: 700 }}>@</Typography>
                  </Box>
                  <input
                    autoFocus
                    value={inputVal}
                    onChange={e => setInputVal(e.target.value.replace(/^@/, ''))}
                    onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') closeEdit(); }}
                    placeholder={activePlatform.placeholder.replace('e.g. ', '')}
                    style={{
                      flex: 1, border: 'none', outline: 'none', background: 'transparent',
                      padding: '12px 14px', fontSize: '0.95rem', fontWeight: 600,
                      color: isDark ? 'white' : '#0f172a', fontFamily: 'inherit',
                    }}
                  />
                </Box>

                {inputVal && (
                  <Box sx={{ mt: 1.5, px: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <ExternalLink size={11} color="text.secondary" />
                    <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary', fontFamily: 'monospace' }}>
                      {activePlatform.href(inputVal)}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Actions */}
              <Box sx={{ px: 3, pb: 3, display: 'flex', gap: 1.5 }}>
                <Box
                  component="button"
                  onClick={handleSave}
                  disabled={saving || !inputVal.trim()}
                  sx={{
                    flex: 1, py: 1.4, borderRadius: '10px', border: 'none',
                    background: saving || !inputVal.trim()
                      ? (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)')
                      : `linear-gradient(135deg, ${activePlatform.color}, ${activePlatform.color}cc)`,
                    color: saving || !inputVal.trim() ? 'text.disabled' : 'white',
                    fontWeight: 700, fontSize: '0.88rem', cursor: saving || !inputVal.trim() ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: !saving && inputVal.trim() ? `0 4px 14px ${activePlatform.color}44` : 'none',
                  }}
                >
                  {saving ? 'Saving…' : 'Save Link'}
                </Box>
                {socialLinks[editing] && (
                  <Box
                    component="button"
                    onClick={handleRemove}
                    disabled={saving}
                    sx={{
                      px: 2, py: 1.4, borderRadius: '10px', border: '1px solid rgba(239,68,68,0.3)',
                      bgcolor: 'rgba(239,68,68,0.07)', color: '#ef4444',
                      fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                      '&:hover': { bgcolor: 'rgba(239,68,68,0.14)' },
                    }}
                  >
                    Remove
                  </Box>
                )}
                <Box
                  component="button"
                  onClick={closeEdit}
                  sx={{
                    px: 2, py: 1.4, borderRadius: '10px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                    bgcolor: 'transparent', color: 'text.secondary',
                    fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
                  }}
                >
                  Cancel
                </Box>
              </Box>
            </Box>
          </Box>
        )}
      </AnimatePresence>
    </Box>
  );
}


/* ── Persona stat pill ── */
function StatPill({ icon: Icon, value, label, color }) {
  const { palette: { mode } } = useTheme();
  const dark = mode === 'dark';
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, px: 2.5, py: 2, borderRadius: '14px', bgcolor: dark ? '#0d1117' : '#fff', border: '1px solid', borderColor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)', boxShadow: dark ? '0 1px 6px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.05)', flex: 1 }}>
      <Icon size={18} color={color} />
      <Typography sx={{ fontWeight: 900, fontSize: '1.5rem', color: dark ? 'white' : '#0f172a', lineHeight: 1 }}>{value}</Typography>
      <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Typography>
    </Box>
  );
}

/* ── League ring ── */
const LEAGUES = { BRONZE: { color: '#cd7f32', glow: '#cd7f3244', label: 'Bronze' }, SILVER: { color: '#a8a9ad', glow: '#a8a9ad44', label: 'Silver' }, GOLD: { color: '#eab308', glow: '#eab30844', label: 'Gold' }, PLATINUM: { color: '#22d3ee', glow: '#22d3ee44', label: 'Platinum' }, DIAMOND: { color: '#818cf8', glow: '#818cf844', label: 'Diamond' }, LEGEND: { color: '#a78bfa', glow: '#a78bfa55', label: 'Legend' } };
function LeagueRing({ league = 'BRONZE', size = 148 }) {
  const l = LEAGUES[league] || LEAGUES.BRONZE;
  const r = size / 2 - 5;
  const circ = 2 * Math.PI * r;
  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0 }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={l.color+'22'} strokeWidth={4} />
        <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={l.color} strokeWidth={4}
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: circ * 0.15 }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
          style={{ transform: 'rotate(-90deg)', transformOrigin: `${size/2}px ${size/2}px`, willChange: 'transform, stroke-dashoffset' }}
        />
      </svg>
      <Box sx={{ position: 'absolute', bottom: -2, left: '50%', transform: 'translateX(-50%)', bgcolor: l.color, px: 1, py: 0.15, borderRadius: '6px', zIndex: 2 }}>
        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.52rem', fontWeight: 900, color: 'white', letterSpacing: 1 }}>{l.label.toUpperCase()}</Typography>
      </Box>
    </Box>
  );
}

/* ══════ MAIN ══════ */
export default function UserProfile() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const targetId = id || me?._id;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [ratings, setRatings] = useState({ average: 0, count: 0 });
  const [endorsements, setEndorsements] = useState([]);
  const [mapOpen, setMapOpen] = useState(false);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  useEffect(() => {
    if (!targetId) return;
    Promise.all([
      api.get(`/users/${targetId}`),
      api.get(`/ratings/${targetId}`),
      api.get(`/gamification/endorsements/${targetId}`),
    ]).then(([p, r, e]) => {
      setProfile(p.data); setRatings(r.data); setEndorsements(e.data);
    }).catch(() => toast.error('User not found'))
      .finally(() => setLoading(false));
  }, [targetId]);

  const handleConnect    = async () => { setConnecting(true); try { await api.post(`/users/connect/${id}`); toast.success('Request sent!'); } catch (e) { toast.error(e.response?.data?.message || 'Failed'); } finally { setConnecting(false); } };
  const handleDisconnect = async () => { if (!window.confirm('Disconnect?')) return; try { await api.post(`/users/disconnect/${id}`); toast.success('Disconnected'); window.location.reload(); } catch (e) { toast.error('Failed'); } };

  if (loading) return <ProfileSkeleton />;
  if (!profile) return <Box textAlign="center" py={10}><Typography fontWeight={700} color="text.secondary">User not found</Typography></Box>;

  const isConnected  = me?.connections?.includes(id);
  const sentRequest  = me?.sentRequests?.includes(id);
  const isSelf       = targetId === me?._id;
  const completeness = (() => {
    const f = [profile.avatar, profile.bio, profile.subjects?.length > 0, profile.university, profile.location, profile.studyStyle];
    return Math.round(f.filter(Boolean).length / f.length * 100);
  })();
  const ALL_BADGES   = Object.keys(BADGE_META);
  const earnedSet    = new Set(profile.badges || []);

  /* ── Cover gradient based on league ── */
  const leagueGradients = {
    BRONZE: 'linear-gradient(135deg,#1c0a00 0%,#3d1f00 50%,#251206 100%)',
    SILVER: 'linear-gradient(135deg,#0a0a0f 0%,#1a1a2e 50%,#111127 100%)',
    GOLD:   'linear-gradient(135deg,#1a0f00 0%,#3d2e00 50%,#231900 100%)',
    PLATINUM: 'linear-gradient(135deg,#001a1f 0%,#002d36 50%,#001518 100%)',
    DIAMOND: 'linear-gradient(135deg,#0d0a2e 0%,#1a1052 50%,#0f0b33 100%)',
    LEGEND: 'linear-gradient(135deg,#150a2e 0%,#2d1052 50%,#1a0940 100%)',
  };
  const league = (profile.league || 'BRONZE').toUpperCase();
  const coverBg = isDark ? (leagueGradients[league] || leagueGradients.BRONZE) : 'linear-gradient(135deg,#4f46e5,#6366f1,#8b5cf6)';
  const leagueColor = LEAGUES[league]?.color || '#cd7f32';

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 }, pb: 10 }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

        {/* ══ COVER + PERSONA HEADER ══ */}
        <Box sx={{ borderRadius: '24px', overflow: 'hidden', mb: 3, bgcolor: isDark ? '#0d1117' : '#fff', border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)', boxShadow: isDark ? '0 4px 32px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.08)' }}>
          {/* Cover */}
          <Box sx={{ height: { xs: 160, sm: 220 }, background: coverBg, position: 'relative', overflow: 'hidden' }}>
            {/* Particle-like dots */}
            {[...Array(8)].map((_, i) => (
              <motion.div key={i}
                animate={{ y: [0, -12, 0], opacity: [0.3, 0.8, 0.3] }}
                transition={{ repeat: Infinity, duration: 3 + i * 0.4, delay: i * 0.3 }}
                style={{ position: 'absolute', width: 4, height: 4, borderRadius: '50%', background: leagueColor, left: `${10 + i * 11}%`, top: `${20 + (i % 3) * 25}%`, willChange: 'transform, opacity' }}
              />
            ))}
            {/* League glow overlay */}
            <Box sx={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 30% 50%,${leagueColor}22,transparent 60%)`, pointerEvents: 'none' }} />
            {/* Bottom fade */}
            <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(to top,rgba(0,0,0,0.4),transparent)' }} />
          </Box>

          {/* Persona row — Flexbox, responsive, no absolute overlap */}
          <Box sx={{ px: { xs: 3, md: 5 }, pb: 4 }}>
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'center', sm: 'flex-start' },
              gap: { xs: 2, md: 4 },
              mt: { xs: '-56px', sm: '-64px' },
              position: 'relative',
              zIndex: 2,
              width: '100%',
            }}>
              {/* Avatar inside league ring */}
              <Box sx={{ position: 'relative', flexShrink: 0 }}>
                <LeagueRing league={league} size={148} />
                <Avatar src={profile.avatar || undefined}
                  sx={{ width: 120, height: 120, position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-54%)', border: `3px solid ${isDark ? '#0d1117' : '#fff'}`, bgcolor: 'rgba(99,102,241,0.2)', zIndex: 2, fontSize: 40 }}>
                  {!profile.avatar && <User size={44} />}
                </Avatar>
              </Box>

              {/* Identity */}
              <Box sx={{ flex: 1, minWidth: 220, pt: { xs: 0, sm: 2 }, mt: { xs: 2, sm: 0 } }}>
                {/* Name + verified */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mt: '8px' }}>
                  <Typography sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 900, fontSize: { xs: '1.6rem', md: '2rem' }, color: isDark ? 'white' : '#0f172a', lineHeight: 1, letterSpacing: -1 }}>
                    {profile.name}
                  </Typography>
                  {profile.isVerified && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.3, borderRadius: '7px', bgcolor: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)' }}>
                      <BadgeCheck size={13} color="#3b82f6" />
                      <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: '#3b82f6', letterSpacing: 0.5 }}>Verified</Typography>
                    </Box>
                  )}
                </Box>

                {/* Meta row */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1, alignItems: 'center' }}>
                  {profile.university && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><GraduationCap size={14} color="#6366f1" /><Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', fontWeight: 600 }}>{profile.university}</Typography></Box>}
                  {profile.location   && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><MapPin size={14} color="#f97316" /><Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', fontWeight: 600 }}>{profile.location}</Typography></Box>}
                  {profile.timezone   && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Globe size={14} color="#22d3ee" /><Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', fontWeight: 600 }}>{profile.timezone}</Typography></Box>}
                  {ratings.count > 0  && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Star size={14} color="#eab308" fill="#eab308" /><Typography sx={{ fontSize: '0.82rem', color: '#eab308', fontWeight: 700 }}>{ratings.average} <Typography component="span" sx={{ color: 'text.disabled', fontWeight: 500 }}>({ratings.count})</Typography></Typography></Box>}
                </Box>

                {/* Social links */}
                {profile.socialLinks && (
                  <Box sx={{ display: 'flex', gap: 1, mt: 1.5, alignItems: 'center' }}>
                    {profile.socialLinks.github    && <IconButton size="small" component="a" href={`https://github.com/${profile.socialLinks.github}`} target="_blank" sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderRadius: '8px', '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' } }}><Github size={16} /></IconButton>}
                    {profile.socialLinks.linkedin  && <IconButton size="small" component="a" href={`https://linkedin.com/in/${profile.socialLinks.linkedin}`} target="_blank" sx={{ bgcolor: 'rgba(10,102,194,0.1)', borderRadius: '8px', '&:hover': { bgcolor: 'rgba(10,102,194,0.2)' } }}><Linkedin size={16} color="#0a66c2" /></IconButton>}
                    {profile.socialLinks.instagram && <IconButton size="small" component="a" href={`https://instagram.com/${profile.socialLinks.instagram}`} target="_blank" sx={{ bgcolor: 'rgba(225,48,108,0.08)', borderRadius: '8px', '&:hover': { bgcolor: 'rgba(225,48,108,0.15)' } }}><Instagram size={16} color="#e1306c" /></IconButton>}
                  </Box>
                )}
              </Box>

              {/* Action buttons */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', mt: { xs: 0, sm: 3 } }}>
                <Button onClick={async () => {
                  const toastId = toast.loading('Generating…');
                  try {
                    const { jsPDF } = await import('jspdf');
                    const doc = new jsPDF();
                    doc.setFont('helvetica','bold'); doc.setFontSize(22);
                    doc.text(`${profile.name} — Academic Portfolio`, 20, 20);
                    doc.setFontSize(11); doc.setFont('helvetica','normal');
                    doc.text(`University: ${profile.university||'N/A'}`, 20, 35);
                    doc.text(`Location: ${profile.location||'N/A'}`, 20, 45);
                    doc.text(`Study Hours: ${profile.studyHours||0}hrs`, 20, 55);
                    doc.text(`Streak: ${profile.streak||0} days`, 20, 65);
                    doc.text(`League: ${profile.league||'BRONZE'}`, 20, 75);
                    doc.text(`Subjects: ${profile.subjects?.join(', ')||'None'}`, 20, 85);
                    doc.text(`Badges: ${profile.badges?.join(', ')||'None'}`, 20, 95);
                    doc.save(`${profile.name.replace(/\s+/g,'_')}_Academic_Resume.pdf`);
                    toast.success('Exported!', { id: toastId });
                  } catch { toast.error('Failed', { id: toastId }); }
                }}
                  startIcon={<Download size={15} />}
                  sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', color: isDark ? 'rgba(255,255,255,0.7)' : '#374151', border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', borderRadius: '10px', fontWeight: 700, textTransform: 'none', fontSize: '0.82rem', '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.07)' } }}>
                  Resume
                </Button>

                {isSelf && (
                  <Button startIcon={<Pencil size={15} />} onClick={() => navigate('/profile/edit')}
                    sx={{ bgcolor: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px', fontWeight: 700, textTransform: 'none', fontSize: '0.82rem', '&:hover': { bgcolor: 'rgba(99,102,241,0.18)' } }}>
                    Edit Profile
                  </Button>
                )}

                {!isSelf && isConnected && <>
                  <Button startIcon={<MessageCircle size={15} />} onClick={() => navigate(`/messages?with=${id}`)}
                    sx={{ background: 'linear-gradient(135deg,#4f46e5,#6366f1)', color: 'white', borderRadius: '10px', fontWeight: 700, textTransform: 'none', fontSize: '0.82rem', boxShadow: '0 0 16px rgba(99,102,241,0.3)', '&:hover': { opacity: 0.9 } }}>
                    Message
                  </Button>
                  <Button startIcon={<UserMinus size={15} />} onClick={handleDisconnect}
                    sx={{ bgcolor: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', fontWeight: 700, textTransform: 'none', fontSize: '0.82rem', '&:hover': { bgcolor: 'rgba(239,68,68,0.14)' } }}>
                    Disconnect
                  </Button>
                </>}
                {!isSelf && !isConnected && (
                  <Button startIcon={sentRequest ? null : <UserPlus size={15} />} onClick={!sentRequest ? handleConnect : undefined} disabled={connecting || sentRequest}
                    sx={{ background: sentRequest ? 'transparent' : 'linear-gradient(135deg,#4f46e5,#6366f1)', color: sentRequest ? 'text.disabled' : 'white', border: sentRequest ? '1px solid rgba(255,255,255,0.1)' : 'none', borderRadius: '10px', fontWeight: 700, textTransform: 'none', fontSize: '0.82rem', boxShadow: sentRequest ? 'none' : '0 0 16px rgba(99,102,241,0.3)', '&:hover': { opacity: 0.9 } }}>
                    {connecting ? 'Sending…' : sentRequest ? 'Pending…' : 'Connect'}
                  </Button>
                )}
              </Box>
            </Box>

            {/* ── Stat pills ── */}
            <Box sx={{ display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap' }}>
              <StatPill icon={Clock}       value={profile.studyHours || 0}           label="Hours"   color="#6366f1" />
              <StatPill icon={Flame}       value={profile.streak || 0}               label="Streak"  color="#f97316" />
              <StatPill icon={Zap}         value={profile.xp || 0}                   label="XP"      color="#a78bfa" />
              <StatPill icon={Users}       value={profile.connections?.length || 0}  label="Network" color="#22d3ee" />
              <StatPill icon={Award}       value={profile.badges?.length || 0}       label="Badges"  color="#eab308" />
              {ratings.count > 0 && <StatPill icon={Star} value={ratings.average} label="Rating" color="#f59e0b" />}
            </Box>
          </Box>
        </Box>

        {/* ══ TWO-COL BODY ══ */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 340px' }, gap: 3 }}>

          {/* LEFT COL */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

            {/* Bio */}
            {profile.bio && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Box sx={{ borderRadius: '18px', p: 3, bgcolor: isDark ? '#0d1117' : '#fff', border: '1px solid', borderColor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.12)', boxShadow: isDark ? '0 1px 8px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.05)', borderLeft: `3px solid #6366f1` }}>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6rem', fontWeight: 800, color: '#6366f1', letterSpacing: 2, mb: 1.5 }}>▸ ABOUT / PERSONA</Typography>
                  <Typography sx={{ fontSize: '0.95rem', lineHeight: 1.75, color: isDark ? 'rgba(255,255,255,0.75)' : '#374151' }}>{profile.bio}</Typography>
                </Box>
              </motion.div>
            )}

            {/* Completeness */}
            {isSelf && completeness < 100 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
                <Box sx={{ borderRadius: '18px', p: 3, bgcolor: isDark ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6rem', fontWeight: 800, color: '#6366f1', letterSpacing: 2 }}>▸ PERSONA COMPLETENESS</Typography>
                    <Typography sx={{ fontFamily: 'monospace', fontWeight: 900, color: '#6366f1', fontSize: '0.9rem' }}>{completeness}%</Typography>
                  </Box>
                  <Box sx={{ height: 8, borderRadius: '4px', bgcolor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${completeness}%` }} transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }}
                      style={{ height: '100%', background: 'linear-gradient(90deg,#6366f1,#22d3ee)', borderRadius: 4 }} />
                  </Box>
                  <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled', mt: 1 }}>Complete your profile for better AI match suggestions</Typography>
                </Box>
              </motion.div>
            )}

            {/* Academic Mastery */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
              <Box sx={{ borderRadius: '18px', p: 3, bgcolor: isDark ? '#0d1117' : '#fff', border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)', boxShadow: isDark ? '0 1px 8px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.05)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                  <Box>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6rem', fontWeight: 800, color: '#a78bfa', letterSpacing: 2 }}>▸ ACADEMIC / MASTERY</Typography>
                    <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: isDark ? 'white' : '#0f172a', mt: 0.5 }}>Subjects & Skills</Typography>
                  </Box>
                  <Button size="small" onClick={() => setMapOpen(true)}
                    sx={{ bgcolor: 'rgba(167,139,250,0.1)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.2)', borderRadius: '8px', fontWeight: 700, textTransform: 'none', fontSize: '0.72rem', '&:hover': { bgcolor: 'rgba(167,139,250,0.18)' } }}>
                    🧠 Mind Map
                  </Button>
                </Box>
                {profile.subjects?.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {profile.subjects.map((s, i) => (
                      <motion.div key={s} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 + i * 0.04 }}>
                        <Box sx={{ px: 1.5, py: 0.6, borderRadius: '8px', bgcolor: isDark ? 'rgba(167,139,250,0.1)' : 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.2)', fontSize: '0.8rem', fontWeight: 700, color: '#a78bfa' }}>{s}</Box>
                      </motion.div>
                    ))}
                  </Box>
                ) : <Typography sx={{ fontSize: '0.82rem', color: 'text.disabled', fontStyle: 'italic' }}>No subjects added yet</Typography>}

                {/* Endorsements */}
                <Box sx={{ mt: 3, pt: 2.5, borderTop: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6rem', fontWeight: 800, color: '#22d3ee', letterSpacing: 2 }}>▸ PEER ENDORSEMENTS</Typography>
                    {!isSelf && (
                      <Button size="small" onClick={() => {
                        const skill = window.prompt('Endorse for which skill?');
                        if (!skill) return;
                        api.post(`/gamification/endorse/${targetId}`, { skill })
                          .then(r => { toast.success(`Endorsed for ${skill}!`); setEndorsements(p => [...p, { ...r.data, endorserId: me }]); })
                          .catch(() => toast.error('Already endorsed or failed'));
                      }}
                        sx={{ bgcolor: 'rgba(34,211,238,0.08)', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.2)', borderRadius: '8px', fontWeight: 700, textTransform: 'none', fontSize: '0.72rem', '&:hover': { bgcolor: 'rgba(34,211,238,0.14)' } }}>
                        + Endorse
                      </Button>
                    )}
                  </Box>
                  {endorsements.length === 0
                    ? <Typography sx={{ fontSize: '0.78rem', color: 'text.disabled' }}>No endorsements yet</Typography>
                    : <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {Object.entries(endorsements.reduce((a, c) => { a[c.skill] = (a[c.skill]||0)+1; return a; }, {})).map(([s, n]) => (
                          <Box key={s} sx={{ px: 1.5, py: 0.6, borderRadius: '8px', bgcolor: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.18)', fontSize: '0.78rem', fontWeight: 700, color: '#22d3ee', display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            {s} {n > 1 && <Box component="span" sx={{ fontFamily: 'monospace', fontSize: '0.6rem', bgcolor: 'rgba(34,211,238,0.15)', px: 0.75, py: 0.1, borderRadius: '5px' }}>×{n}</Box>}
                          </Box>
                        ))}
                      </Box>
                  }
                </Box>
              </Box>
            </motion.div>

            {/* Study Info table */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
              <Box sx={{ borderRadius: '18px', p: 3, bgcolor: isDark ? '#0d1117' : '#fff', border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)', boxShadow: isDark ? '0 1px 8px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.05)' }}>
                <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6rem', fontWeight: 800, color: '#f59e0b', letterSpacing: 2, mb: 2 }}>▸ PERSONA / ATTRIBUTES</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {[
                    { label: 'Education Tier',  value: profile.educationLevel,   color: '#6366f1' },
                    { label: 'Cognitive Style', value: profile.studyStyle,        color: '#a78bfa' },
                    { label: 'Session Format',  value: profile.preferOnline ? 'Digital Online' : 'Physical Local',  color: '#22d3ee' },
                    { label: 'Network Size',    value: `${profile.connections?.length||0} Connections`, color: '#34d399' },
                    { label: 'Avg Rating',      value: ratings.count > 0 ? `${ratings.average} ★ (${ratings.count})` : 'No ratings yet', color: '#f59e0b' },
                  ].filter(r => r.value).map(row => (
                    <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1.25, borderRadius: '10px', bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                      <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: 'text.secondary' }}>{row.label}</Typography>
                      <Box sx={{ px: 1.25, py: 0.3, borderRadius: '7px', bgcolor: row.color+'12', border: `1px solid ${row.color}22` }}>
                        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.72rem', fontWeight: 800, color: row.color }}>{row.value || '—'}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </motion.div>

            {/* Weekly Goals */}
            {profile.weeklyGoals?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
                <Box sx={{ borderRadius: '18px', p: 3, bgcolor: isDark ? '#0d1117' : '#fff', border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)', boxShadow: isDark ? '0 1px 8px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.05)' }}>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6rem', fontWeight: 800, color: '#ec4899', letterSpacing: 2, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>▸ WEEKLY MASTER GOALS</Typography>
                  <Grid container spacing={2}>
                    {profile.weeklyGoals.map((goal, i) => {
                      const pct = Math.min(((goal.currentHours||0)/goal.targetHours)*100, 100) || 0;
                      return (
                        <Grid item xs={12} sm={6} key={i}>
                          <Box sx={{ p: 2, borderRadius: '12px', bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: isDark ? 'white' : '#0f172a' }}>{goal.title}</Typography>
                              <Typography sx={{ fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 800, color: pct >= 100 ? '#22c55e' : '#f59e0b' }}>{goal.currentHours||0}/{goal.targetHours}h</Typography>
                            </Box>
                            <Box sx={{ height: 6, borderRadius: '3px', bgcolor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.2, ease: 'easeOut' }}
                                style={{ height: '100%', background: pct >= 100 ? '#22c55e' : 'linear-gradient(90deg,#ec4899,#8b5cf6)', borderRadius: 3 }} />
                            </Box>
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              </motion.div>
            )}

            {/* Activity Heatmap */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}>
              <Box sx={{ borderRadius: '18px', p: 3, bgcolor: isDark ? '#0d1117' : '#fff', border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)', boxShadow: isDark ? '0 1px 8px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.05)' }}>
                <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6rem', fontWeight: 800, color: '#22c55e', letterSpacing: 2, mb: 2 }}>▸ ACTIVITY / CONTRIBUTION MAP</Typography>
                <ActivityHeatmap userId={targetId} />
              </Box>
            </motion.div>

            {/* Social Accounts Grid */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <SocialAccountsGrid
                socialLinks={profile.socialLinks || {}}
                isDark={isDark}
                isSelf={isSelf}
                onSave={(updatedUser) => setProfile(prev => ({ ...prev, socialLinks: updatedUser.socialLinks }))}
              />
            </motion.div>
          </Box>

          {/* RIGHT COL — Badge Wall */}
          <Box>
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <Box sx={{ borderRadius: '18px', p: 3, bgcolor: isDark ? '#0d1117' : '#fff', border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)', boxShadow: isDark ? '0 1px 8px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.05)', position: 'sticky', top: 80 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                  <Box>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6rem', fontWeight: 800, color: '#eab308', letterSpacing: 2 }}>▸ BADGE / COLLECTION</Typography>
                    <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: isDark ? 'white' : '#0f172a', mt: 0.5 }}>Achievement Wall</Typography>
                  </Box>
                  <Box sx={{ px: 1.5, py: 0.4, borderRadius: '8px', bgcolor: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)' }}>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '0.65rem', fontWeight: 900, color: '#eab308' }}>{earnedSet.size}/{ALL_BADGES.length}</Typography>
                  </Box>
                </Box>

                {/* Completion bar */}
                <Box sx={{ height: 5, borderRadius: '3px', bgcolor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)', overflow: 'hidden', mb: 3 }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(earnedSet.size/ALL_BADGES.length)*100}%` }} transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }}
                    style={{ height: '100%', background: 'linear-gradient(90deg,#eab308,#f97316)', borderRadius: 3 }} />
                </Box>

                {/* Badge grid */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.25 }}>
                  {ALL_BADGES.map((name, i) => (
                    <motion.div key={name} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.22 + i * 0.05 }}>
                      <BadgeCard name={name} earned={earnedSet.has(name)} />
                    </motion.div>
                  ))}
                </Box>

                {/* League section */}
                <Box sx={{ mt: 3, pt: 2.5, borderTop: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6rem', fontWeight: 800, color: leagueColor, letterSpacing: 2, mb: 2 }}>▸ CURRENT LEAGUE</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: '12px', bgcolor: leagueColor+'0a', border: `1px solid ${leagueColor}22` }}>
                    <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: leagueColor+'18', border: `1px solid ${leagueColor}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trophy size={22} color={leagueColor} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 900, fontSize: '1rem', color: leagueColor, lineHeight: 1, letterSpacing: -0.5 }}>{LEAGUES[league]?.label} League</Typography>
                      <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'text.disabled', letterSpacing: 1 }}>RANK · {league}</Typography>
                    </Box>
                    <Box sx={{ ml: 'auto', fontFamily: 'monospace', fontWeight: 900, color: leagueColor, fontSize: '1.1rem' }}>Lv {profile.level || 1}</Box>
                  </Box>
                </Box>
              </Box>
            </motion.div>
          </Box>
        </Box>
      </motion.div>

      <MindMapModal open={mapOpen} onClose={() => setMapOpen(false)} user={profile} />
    </Container>
  );
}
