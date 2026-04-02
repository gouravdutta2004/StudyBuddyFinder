import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Trophy, Flame, Zap, Crown, Star, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  Box, Typography, Avatar, Chip, CircularProgress, useTheme, LinearProgress
} from '@mui/material';
import { motion } from 'framer-motion';

const RANK_CONFIG = [
  {
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #f97316 100%)',
    glow: 'rgba(251, 191, 36, 0.4)',
    border: '#fbbf24',
    crown: '#f59e0b',
    label: '1ST',
    size: 88,
    zIndex: 3,
    mt: 0,
  },
  {
    gradient: 'linear-gradient(135deg, #94a3b8 0%, #cbd5e1 50%, #94a3b8 100%)',
    glow: 'rgba(148, 163, 184, 0.3)',
    border: '#94a3b8',
    crown: '#94a3b8',
    label: '2ND',
    size: 72,
    zIndex: 2,
    mt: 4,
  },
  {
    gradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #b45309 100%)',
    glow: 'rgba(217, 119, 6, 0.3)',
    border: '#d97706',
    crown: '#d97706',
    label: '3RD',
    size: 72,
    zIndex: 2,
    mt: 4,
  },
];

function PodiumCard({ leader, rank, config, isMe }) {
  if (!leader) return null;
  const order = rank === 1 ? 0 : rank === 2 ? 1 : 2;
  const flexOrder = rank === 1 ? 1 : rank === 2 ? 0 : 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: order * 0.15, type: 'spring', stiffness: 200, damping: 20 }}
      style={{ order: flexOrder, display: 'flex', flexDirection: 'column', alignItems: 'center', flex: rank === 1 ? '0 0 200px' : '0 0 160px' }}
    >
      {/* Crown for 1st */}
      {rank === 1 && (
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ marginBottom: 8 }}
        >
          <Crown size={32} color="#f59e0b" fill="#f59e0b" />
        </motion.div>
      )}

      {/* Avatar */}
      <Box sx={{ position: 'relative', mb: 2, mt: rank !== 1 ? 5 : 0 }}>
        <Avatar
          src={leader.avatar}
          sx={{
            width: config.size, height: config.size,
            border: `3px solid ${config.border}`,
            boxShadow: `0 0 30px ${config.glow}, 0 0 60px ${config.glow}40`,
            fontSize: config.size * 0.4, fontWeight: 800,
            bgcolor: 'rgba(15,23,42,0.8)',
            color: config.border
          }}
        >
          {leader.name?.[0]}
        </Avatar>

        {/* Rank badge */}
        <Box
          sx={{
            position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
            background: config.gradient,
            borderRadius: '100px', px: 1.5, py: 0.3, minWidth: 38,
            fontSize: '0.65rem', fontWeight: 900, color: 'white',
            textAlign: 'center', boxShadow: `0 4px 12px ${config.glow}`,
            whiteSpace: 'nowrap'
          }}
        >
          {config.label}
        </Box>
      </Box>

      {/* Name */}
      <Typography fontWeight={900} fontSize="0.9rem" noWrap maxWidth={rank === 1 ? 180 : 140} textAlign="center" color="white" mt={1.5}>
        {leader.name}
      </Typography>
      {isMe && <Chip label="You" size="small" sx={{ mt: 0.5, height: 18, bgcolor: '#6366f1', color: 'white', fontWeight: 800, fontSize: '0.65rem' }} />}

      {/* XP */}
      <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Zap size={13} color="#8b5cf6" />
        <Typography fontWeight={900} fontSize="0.85rem" color="#8b5cf6">
          {(leader.xp || 0).toLocaleString()} XP
        </Typography>
      </Box>

      {/* Podium block */}
      <Box
        sx={{
          mt: 2, width: '100%',
          height: rank === 1 ? 80 : rank === 2 ? 56 : 40,
          background: config.gradient,
          borderRadius: '16px 16px 0 0',
          opacity: 0.8,
          boxShadow: `0 -4px 20px ${config.glow}`
        }}
      />
    </motion.div>
  );
}

function RankRow({ leader, rank, isMe, isDark }) {
  const maxXp = 5000;
  const pct = Math.min(((leader.xp || 0) / maxXp) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: (rank - 4) * 0.06, type: 'spring', stiffness: 200, damping: 25 }}
    >
      <Box
        sx={{
          display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2.5 }, p: { xs: 2, sm: 2.5 },
          borderRadius: '18px', mb: 1.5,
          bgcolor: isMe
            ? (isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.07)')
            : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'),
          border: '1px solid',
          borderColor: isMe ? 'rgba(99,102,241,0.35)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: 'rgba(99,102,241,0.25)',
            bgcolor: isDark ? 'rgba(99,102,241,0.07)' : 'rgba(99,102,241,0.04)'
          }
        }}
      >
        {/* Rank */}
        <Typography fontWeight={900} fontSize="1rem" color="text.secondary" sx={{ width: { xs: 28, sm: 36 }, textAlign: 'center', flexShrink: 0 }}>
          {rank}
        </Typography>

        {/* Avatar */}
        <Avatar
          src={leader.avatar}
          sx={{ width: 44, height: 44, bgcolor: 'rgba(99,102,241,0.15)', color: '#818cf8', fontWeight: 800, fontSize: 18, flexShrink: 0 }}
        >
          {leader.name?.[0]}
        </Avatar>

        {/* Name & stats */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography fontWeight={800} fontSize="0.95rem" color={isDark ? 'white' : 'text.primary'} noWrap>
              {leader.name}
            </Typography>
            {isMe && <Chip label="You" size="small" sx={{ height: 18, bgcolor: '#6366f1', color: 'white', fontWeight: 800, fontSize: '0.6rem' }} />}
          </Box>
          {/* XP bar */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <LinearProgress
              variant="determinate"
              value={pct}
              sx={{
                flex: 1, height: 5, borderRadius: 3,
                bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                  borderRadius: 3
                }
              }}
            />
            <Chip label={`Lv ${leader.level || 1}`} size="small" sx={{ height: 18, bgcolor: 'rgba(56,189,248,0.1)', color: '#38bdf8', fontWeight: 800, fontSize: '0.65rem', flexShrink: 0 }} />
          </Box>
        </Box>

        {/* Streak */}
        <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
            <Flame size={14} color="#f97316" />
            <Typography fontWeight={900} fontSize="0.9rem" color="#f97316">{leader.streak || 0}</Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600} fontSize="0.65rem">streak</Typography>
        </Box>

        {/* XP */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, minWidth: { xs: 64, sm: 80 } }}>
          <Typography fontWeight={900} fontSize="0.95rem" color="#8b5cf6" sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
            <Zap size={14} /> {(leader.xp || 0).toLocaleString()}
          </Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={600} fontSize="0.65rem">total XP</Typography>
        </Box>
      </Box>
    </motion.div>
  );
}

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  useEffect(() => {
    api.get('/users/leaderboard')
      .then(res => setLeaders(res.data))
      .catch(() => toast.error('Failed to load leaderboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress size={56} thickness={4} sx={{ color: '#8b5cf6' }} />
      </Box>
    );
  }

  const top3 = leaders.slice(0, 3);
  const rest = leaders.slice(3);
  const myRank = leaders.findIndex(l => l._id === user?._id) + 1;

  return (
    <Box sx={{ minHeight: '100vh', py: 4, px: { xs: 2, md: 4 }, position: 'relative', overflow: 'hidden' }}>
      {/* Ambient BG */}
      <Box sx={{ position: 'absolute', top: '-10%', left: '30%', width: 700, height: 700, background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', bottom: '-5%', right: '10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(56,189,248,0.07) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />

      <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 800, mx: 'auto' }}>

        {/* Hero Header */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
            <Box
              sx={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 80, height: 80, borderRadius: '24px', mb: 3,
                background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(251,191,36,0.2))',
                border: '1px solid rgba(139,92,246,0.3)',
                boxShadow: '0 0 40px rgba(139,92,246,0.2)'
              }}
            >
              <Trophy size={40} color="#fbbf24" fill="rgba(251,191,36,0.3)" />
            </Box>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Typography variant="h2" fontWeight={900} color={isDark ? 'white' : 'text.primary'} sx={{ letterSpacing: '-2px', mb: 1 }}>
              Rankings
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" fontWeight={500} maxWidth={480} mx="auto">
              Climb the global XP matrix by completing quests, focus sessions, and daily streaks.
            </Typography>
          </motion.div>

          {/* My rank pill */}
          {myRank > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, mt: 3, px: 3, py: 1, borderRadius: '100px', bgcolor: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)' }}>
                <TrendingUp size={16} color="#6366f1" />
                <Typography fontWeight={800} color="#6366f1" fontSize="0.9rem">
                  Your Rank: #{myRank}
                </Typography>
              </Box>
            </motion.div>
          )}
        </Box>

        {leaders.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Trophy size={64} style={{ margin: '0 auto 16px', opacity: 0.15 }} />
            <Typography fontWeight={800} color="text.secondary">No active players yet.</Typography>
            <Typography color="text.secondary" mt={0.5}>Complete quests to appear on the board!</Typography>
          </Box>
        ) : (
          <>
            {/* ── Podium Section ── */}
            {top3.length > 0 && (
              <Box
                sx={{
                  mb: 6, p: { xs: 3, sm: 4 }, borderRadius: '32px',
                  background: isDark
                    ? 'linear-gradient(180deg, rgba(30,20,60,0.8) 0%, rgba(15,23,42,0.6) 100%)'
                    : 'linear-gradient(180deg, rgba(245,243,255,0.9) 0%, rgba(255,255,255,0.6) 100%)',
                  backdropFilter: 'blur(24px)',
                  border: '1px solid', borderColor: isDark ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.1)',
                  boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.4)' : '0 20px 60px rgba(0,0,0,0.06)'
                }}
              >
                {/* Stars decoration */}
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 4 }}>
                  {[...Array(5)].map((_, i) => (
                    <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3], scale: [0.9, 1.1, 0.9] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}>
                      <Star size={14} color="#fbbf24" fill="#fbbf24" />
                    </motion.div>
                  ))}
                </Box>

                {/* Podium Cards */}
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: { xs: 1, sm: 3 } }}>
                  {top3.map((leader, i) => {
                    const rank = i + 1;
                    return (
                      <PodiumCard
                        key={leader._id}
                        leader={leader}
                        rank={rank}
                        config={RANK_CONFIG[i]}
                        isMe={user?._id === leader._id}
                      />
                    );
                  })}
                </Box>
              </Box>
            )}

            {/* ── Rest of Rankings ── */}
            {rest.length > 0 && (
              <Box>
                <Typography variant="overline" fontWeight={800} color="text.secondary" letterSpacing={2} display="block" mb={2} ml={1}>
                  Rankings #{4}–#{leaders.length}
                </Typography>
                {rest.map((leader, i) => (
                  <RankRow
                    key={leader._id}
                    leader={leader}
                    rank={i + 4}
                    isMe={user?._id === leader._id}
                    isDark={isDark}
                  />
                ))}
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}
