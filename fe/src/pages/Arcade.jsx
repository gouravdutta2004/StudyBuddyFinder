import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, useTheme, Grid, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BrainCircuit, Keyboard, Hash, Wind, Trophy, Zap,
  ArrowLeft, Star, ChevronRight, Radio, Shuffle, Gamepad2, Palette
} from 'lucide-react';
import MemoryMatch from '../components/arcade/MemoryMatch';
import TypingRacer from '../components/arcade/TypingRacer';
import ZenBreather from '../components/arcade/ZenBreather';
import MathSprint from '../components/arcade/MathSprint';
import WordScramble from '../components/arcade/WordScramble';
import SnakeGame from '../components/arcade/SnakeGame';
import ColorMemory from '../components/arcade/ColorMemory';

/* ─── Game catalogue ─── */
const GAMES = [
  {
    id: 'typing',
    title: 'TYPE RACER',
    short: 'SPEED',
    description: 'Track semantic velocity and precision through academic transcription.',
    tagline: 'SPEED · ACCURACY · FLOW',
    icon: Keyboard,
    component: TypingRacer,
    color: '#38bdf8',   glow: 'rgba(56,189,248,0.35)',
    gradient: 'linear-gradient(135deg,#0c4a6e,#0284c7,#38bdf8)',
    bg: 'rgba(56,189,248,0.07)',
    badge: 'HOT',       stars: 5,
    difficulty: 'HARD',
  },
  {
    id: 'memory',
    title: 'SYNAPSE MATCH',
    short: 'MEMORY',
    description: 'Classic working-memory test. Match academic endpoints at speed.',
    tagline: 'FLIP · MATCH · SCORE',
    icon: BrainCircuit,
    component: MemoryMatch,
    color: '#a78bfa',   glow: 'rgba(167,139,250,0.35)',
    gradient: 'linear-gradient(135deg,#4c1d95,#7c3aed,#a78bfa)',
    bg: 'rgba(167,139,250,0.07)',
    badge: 'CLASSIC',   stars: 4,
    difficulty: 'MEDIUM',
  },
  {
    id: 'snake',
    title: 'PIXEL SNAKE',
    short: 'SNAKE',
    description: 'Guide your snake through the grid. Eat food, grow longer, don\'t die.',
    tagline: 'EAT · GROW · SURVIVE',
    icon: Gamepad2,
    component: SnakeGame,
    color: '#22d3ee',   glow: 'rgba(34,211,238,0.35)',
    gradient: 'linear-gradient(135deg,#0c4a6e,#0891b2,#22d3ee)',
    bg: 'rgba(34,211,238,0.07)',
    badge: 'NEW',       stars: 4,
    difficulty: 'MEDIUM',
  },
  {
    id: 'math',
    title: 'MATH SPRINT',
    short: 'MATH',
    description: 'Engage logical sequencing with 60 seconds of rapid interval arithmetic.',
    tagline: 'THINK · CALCULATE · WIN',
    icon: Hash,
    component: MathSprint,
    color: '#f59e0b',   glow: 'rgba(245,158,11,0.35)',
    gradient: 'linear-gradient(135deg,#78350f,#d97706,#fbbf24)',
    bg: 'rgba(245,158,11,0.07)',
    badge: 'CHALLENGE', stars: 4,
    difficulty: 'HARD',
  },
  {
    id: 'wordscramble',
    title: 'WORD SCRAMBLE',
    short: 'WORDS',
    description: 'Unscramble academic vocabulary as fast as you can before the clock runs out.',
    tagline: 'DECODE · UNSCRAMBLE · SCORE',
    icon: Shuffle,
    component: WordScramble,
    color: '#fbbf24',   glow: 'rgba(251,191,36,0.35)',
    gradient: 'linear-gradient(135deg,#78350f,#b45309,#fbbf24)',
    bg: 'rgba(251,191,36,0.07)',
    badge: 'NEW',       stars: 4,
    difficulty: 'MEDIUM',
  },
  {
    id: 'colormemory',
    title: 'COLOR MEMORY',
    short: 'COLORS',
    description: 'Watch the flashing color sequence and repeat it. Grows harder every round.',
    tagline: 'WATCH · REMEMBER · REPEAT',
    icon: Palette,
    component: ColorMemory,
    color: '#a855f7',   glow: 'rgba(168,85,247,0.35)',
    gradient: 'linear-gradient(135deg,#581c87,#7e22ce,#a855f7)',
    bg: 'rgba(168,85,247,0.07)',
    badge: 'NEW',       stars: 5,
    difficulty: 'HARD',
  },
  {
    id: 'zen',
    title: 'ZEN BREATHER',
    short: 'ZEN',
    description: 'Restore cognitive bandwidth through a 4-7-8 parasympathetic rhythm.',
    tagline: 'BREATHE · RESET · FOCUS',
    icon: Wind,
    component: ZenBreather,
    color: '#34d399',   glow: 'rgba(52,211,153,0.35)',
    gradient: 'linear-gradient(135deg,#064e3b,#059669,#34d399)',
    bg: 'rgba(52,211,153,0.07)',
    badge: 'CHILL',     stars: 3,
    difficulty: 'EASY',
  },
];

/* ─── Blinking cursor ─── */
function Blink({ children, color = '#6366f1' }) {
  const [v, setV] = useState(true);
  useEffect(() => { const t = setInterval(() => setV(x => !x), 600); return () => clearInterval(t); }, []);
  return <span style={{ color, opacity: v ? 1 : 0 }}>{children}</span>;
}

/* ─── Pixel Grid Background ─── */
function PixelGrid({ color = 'rgba(99,102,241,0.06)' }) {
  return (
    <Box sx={{
      position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
      backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
      backgroundSize: '40px 40px',
    }} />
  );
}

/* ─── CRT Scanlines ─── */
function CRTScanlines() {
  return (
    <Box sx={{
      position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px)',
    }} />
  );
}

/* ─── Marquee ticker ─── */
function Marquee() {
  const items = ['INSERT COIN', 'HIGH SCORE', 'PLAYER ONE', 'ARCADIA', 'XP EARNED', 'STUDY STREAK', 'LEVEL UP', 'PRESS START', '7 GAMES LOADED', 'SNAKE ONLINE', 'WORD SCRAMBLE', 'COLOR MEMORY'];
  return (
    <Box sx={{
      overflow: 'hidden', whiteSpace: 'nowrap', borderTop: '1px solid rgba(99,102,241,0.2)',
      borderBottom: '1px solid rgba(99,102,241,0.2)',
      bgcolor: 'rgba(99,102,241,0.05)', py: 0.6, mb: 5,
    }}>
      <motion.div
        animate={{ x: ['0%', '-50%'] }}
        transition={{ repeat: Infinity, duration: 22, ease: 'linear' }}
        style={{ display: 'inline-flex', gap: 48, willChange: 'transform' }}
      >
        {[...items, ...items].map((item, i) => (
          <Box key={i} sx={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <Typography fontFamily="'Courier New',monospace" fontSize="0.7rem" fontWeight={900}
              color="rgba(99,102,241,0.6)" letterSpacing={4}>
              {item}
            </Typography>
            <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'rgba(99,102,241,0.3)' }} />
          </Box>
        ))}
      </motion.div>
    </Box>
  );
}

/* ─── Game Card ─── */
function GameCard({ game, index, onSelect }) {
  const [hovered, setHovered] = useState(false);
  const Icon = game.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, type: 'spring', stiffness: 260, damping: 24 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(game.id)}
      style={{ cursor: 'pointer', height: '100%' }}
    >
      <Box sx={{
        height: '100%', position: 'relative', overflow: 'hidden',
        borderRadius: '4px 20px 20px 4px',
        bgcolor: 'rgba(8,10,24,0.92)',
        border: '1px solid',
        borderColor: hovered ? game.color + '55' : 'rgba(255,255,255,0.06)',
        borderLeft: `4px solid ${game.color}`,
        boxShadow: hovered
          ? `0 0 40px ${game.glow}, 0 0 0 1px ${game.color}33, inset 0 0 40px rgba(0,0,0,0.2)`
          : '0 2px 12px rgba(0,0,0,0.4)',
        transition: 'all 0.25s ease',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Grid bg */}
        <Box sx={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)`,
          backgroundSize: '20px 20px', zIndex: 0,
        }} />

        {/* Active glow orb */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              style={{
                position: 'absolute', top: 0, right: 0,
                width: 200, height: 200,
                background: `radial-gradient(circle at 100% 0%,${game.glow},transparent 70%)`,
                pointerEvents: 'none', zIndex: 0,
              }}
            />
          )}
        </AnimatePresence>

        <Box sx={{ position: 'relative', zIndex: 1, p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Top row */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.5 }}>
            <Box sx={{
              width: 52, height: 52, borderRadius: '12px',
              background: game.gradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 20px ${game.glow}`, flexShrink: 0,
            }}>
              <Icon size={24} color="white" />
            </Box>
            <Chip label={game.badge} size="small"
              sx={{
                height: 20, borderRadius: '4px', fontFamily: 'monospace',
                bgcolor: game.color + '18', color: game.color,
                fontWeight: 900, fontSize: '0.58rem', letterSpacing: 1.5,
                border: `1px solid ${game.color}33`,
              }}
            />
          </Box>

          {/* Title */}
          <Typography fontFamily="'Courier New',monospace" fontWeight={900} fontSize="1.05rem"
            color="white" letterSpacing={2} mb={0.5}
            sx={{ textShadow: hovered ? `0 0 20px ${game.color}` : 'none', transition: '0.3s' }}>
            {game.title}
          </Typography>

          {/* Tagline */}
          <Typography fontFamily="monospace" fontSize="0.6rem" color={game.color + 'aa'} fontWeight={700}
            letterSpacing={2} mb={1.5}>
            {game.tagline}
          </Typography>

          {/* Description */}
          <Typography fontSize="0.82rem" color="rgba(255,255,255,0.5)" lineHeight={1.6} flex={1} mb={2}>
            {game.description}
          </Typography>

          {/* Footer */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 2, borderTop: `1px solid rgba(255,255,255,0.05)` }}>
            <Box sx={{ display: 'flex', gap: 0.4 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={12}
                  fill={i < game.stars ? game.color : 'transparent'}
                  color={i < game.stars ? game.color : 'rgba(255,255,255,0.15)'}
                />
              ))}
            </Box>
            <Box sx={{
              px: 1.5, py: 0.3, borderRadius: '4px',
              fontFamily: 'monospace', fontSize: '0.6rem', fontWeight: 900,
              letterSpacing: 1.5, color: game.color,
              bgcolor: game.color + '12', border: `1px solid ${game.color}22`,
            }}>
              {game.difficulty}
            </Box>
            <motion.div animate={{ x: hovered ? 4 : 0 }} transition={{ duration: 0.2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: game.color }}>
                <Typography fontFamily="monospace" fontSize="0.68rem" fontWeight={900} letterSpacing={1}>PLAY</Typography>
                <ChevronRight size={14} />
              </Box>
            </motion.div>
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
}

/* ─── Featured Banner ─── */
function FeaturedBanner({ onSelect }) {
  const featured = GAMES[0]; // Type Racer
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
      <Box
        onClick={() => onSelect(featured.id)}
        sx={{
          position: 'relative', overflow: 'hidden', cursor: 'pointer',
          borderRadius: '4px 24px 24px 4px', mb: 4,
          borderLeft: `6px solid ${featured.color}`,
          border: `1px solid ${featured.color}33`,
          bgcolor: 'rgba(8,10,24,0.95)',
          boxShadow: `0 0 60px ${featured.glow}`,
          p: { xs: 3, md: 4 },
          transition: '0.25s',
          '&:hover': { boxShadow: `0 0 80px ${featured.glow}, 0 0 0 1px ${featured.color}44` },
        }}
      >
        <Box sx={{ position: 'absolute', right: 0, top: 0, width: 400, height: '100%', background: `radial-gradient(ellipse at right,${featured.glow},transparent 70%)`, pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)`, backgroundSize: '24px 24px', pointerEvents: 'none' }} />

        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: { xs: 2.5, md: 4 }, flexWrap: 'wrap' }}>
          <Box sx={{
            width: 72, height: 72, borderRadius: '18px', flexShrink: 0,
            background: featured.gradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 32px ${featured.glow}`,
          }}>
            <featured.icon size={34} color="white" />
          </Box>

          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.75 }}>
              <Chip label="★ FEATURED" size="small"
                sx={{ bgcolor: featured.color + '20', color: featured.color, fontFamily: 'monospace', fontWeight: 900, fontSize: '0.6rem', letterSpacing: 2, borderRadius: '4px', border: `1px solid ${featured.color}44` }} />
              <Box component={motion.div} style={{ willChange: 'opacity' }} animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                <Chip label="LIVE" size="small"
                  sx={{ bgcolor: 'rgba(34,197,94,0.15)', color: '#22c55e', fontFamily: 'monospace', fontWeight: 900, fontSize: '0.6rem', letterSpacing: 2, borderRadius: '4px', border: '1px solid rgba(34,197,94,0.3)' }} />
              </Box>
            </Box>
            <Typography fontFamily="'Courier New',monospace" fontWeight={900} fontSize={{ xs: '1.2rem', md: '1.5rem' }}
              color="white" letterSpacing={3} mb={0.5}
              sx={{ textShadow: `0 0 30px ${featured.color}` }}>
              {featured.title}
            </Typography>
            <Typography color="rgba(255,255,255,0.5)" fontSize="0.85rem" lineHeight={1.5}>
              {featured.description}
            </Typography>
          </Box>

          <Box component={motion.div} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            sx={{
              px: 3, py: 1.5, borderRadius: '10px', cursor: 'pointer', flexShrink: 0,
              background: featured.gradient,
              boxShadow: `0 0 24px ${featured.glow}`,
              display: 'flex', alignItems: 'center', gap: 1.5,
            }}>
            <Typography fontFamily="monospace" fontWeight={900} fontSize="0.8rem" color="white" letterSpacing={2}>PLAY NOW</Typography>
            <ChevronRight size={16} color="white" />
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
}

/* ─── Footer ─── */
function ArcadeFooter({ onLeaderboard }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
      <Box sx={{
        mt: 5, pt: 4,
        borderTop: '1px solid rgba(99,102,241,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1, borderRadius: '8px', bgcolor: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.15)' }}>
            <Trophy size={16} color="#eab308" />
            <Typography fontFamily="monospace" fontSize="0.72rem" fontWeight={800} color="rgba(234,179,8,0.8)" letterSpacing={1}>XP EARNED IS TRACKED GLOBALLY</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, borderRadius: '8px', bgcolor: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
            <Radio size={14} color="#6366f1" />
            <Typography fontFamily="monospace" fontSize="0.72rem" fontWeight={800} color="rgba(99,102,241,0.8)" letterSpacing={1}>{GAMES.length} GAMES ONLINE</Typography>
          </Box>
        </Box>
        <Button variant="outlined" onClick={onLeaderboard} startIcon={<Trophy size={15} />}
          sx={{ borderRadius: '10px', fontFamily: 'monospace', fontWeight: 900, fontSize: '0.72rem', letterSpacing: 2, borderColor: 'rgba(99,102,241,0.3)', color: '#818cf8', textTransform: 'none', px: 2.5, py: 1, '&:hover': { borderColor: '#6366f1', bgcolor: 'rgba(99,102,241,0.08)', boxShadow: '0 0 16px rgba(99,102,241,0.2)' } }}>
          LEADERBOARD
        </Button>
      </Box>
    </motion.div>
  );
}

/* ════════════════ MAIN ════════════════ */
export default function Arcade() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === 'dark';
  const [activeGame, setActiveGame] = useState(null);

  const activeData = GAMES.find(g => g.id === activeGame);
  // ✅ FIX: read component from the GAMES config (was reading activeData?.component which was undefined)
  const ActiveComponent = activeData?.component;

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: isDark ? '#050912' : '#f0f4ff',
      position: 'relative',
      py: { xs: 3, md: 4 },
      px: { xs: 2, sm: 3, md: 5 },
    }}>
      <PixelGrid color={isDark ? 'rgba(99,102,241,0.05)' : 'rgba(99,102,241,0.06)'} />
      <CRTScanlines />

      {/* Ambient orbs */}
      <Box sx={{ position: 'fixed', top: '5%', left: '0%', width: 500, height: 500, background: 'radial-gradient(circle,rgba(99,102,241,0.1) 0%,transparent 65%)', zIndex: 0, pointerEvents: 'none' }} />
      <Box sx={{ position: 'fixed', bottom: '10%', right: '0%', width: 400, height: 400, background: 'radial-gradient(circle,rgba(167,139,250,0.08) 0%,transparent 65%)', zIndex: 0, pointerEvents: 'none' }} />

      <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 1280, mx: 'auto' }}>
        <AnimatePresence mode="wait">

          {/* ══ LOBBY ══ */}
          {!activeGame && (
            <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.98 }}>

              {/* ── Header ── */}
              <Box sx={{ mb: 4, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.75 }}>
                    <Box
                      component={motion.div}
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ repeat: Infinity, duration: 1.8 }}
                      sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22c55e', boxShadow: '0 0 10px rgba(34,197,94,0.8)', willChange: 'opacity' }}
                    />
                    <Typography fontFamily="monospace" fontSize="0.68rem" fontWeight={800} color="#22c55e" letterSpacing={3}>ARCADE ONLINE</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
                    <Typography fontFamily="'Courier New',monospace" fontWeight={900} fontSize={{ xs: '2.8rem', md: '4rem' }}
                      color={isDark ? 'white' : '#0f172a'} letterSpacing={{ xs: -1, md: -2 }} lineHeight={1}
                      sx={{ textShadow: isDark ? '0 0 60px rgba(99,102,241,0.5)' : 'none' }}>
                      ARCADIA
                    </Typography>
                    <Typography fontFamily="monospace" fontSize="1rem" color="#6366f1" fontWeight={900} pb={0.5}>
                      <Blink color="#6366f1">_</Blink>
                    </Typography>
                  </Box>
                  <Typography fontFamily="monospace" color="rgba(255,255,255,0.3)" fontSize="0.72rem" letterSpacing={3} mt={0.5}>
                    RECESS ARCADE · {GAMES.length} MODULES LOADED
                  </Typography>
                </Box>

                {/* Stats */}
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  {[
                    { label: 'GAMES', val: GAMES.length, color: '#38bdf8' },
                    { label: 'XP ENABLED', val: '✓', color: '#22c55e' },
                  ].map(s => (
                    <Box key={s.label} sx={{
                      px: 2, py: 1.25, borderRadius: '10px', textAlign: 'center',
                      bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)',
                      border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                    }}>
                      <Typography fontFamily="monospace" fontWeight={900} fontSize="1.1rem" color={s.color}>{s.val}</Typography>
                      <Typography fontFamily="monospace" fontSize="0.55rem" color="rgba(255,255,255,0.3)" letterSpacing={2} fontWeight={700}>{s.label}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* ── Marquee ── */}
              <Marquee />

              {/* ── Featured Game ── */}
              <FeaturedBanner onSelect={setActiveGame} />

              {/* ── All Games Grid ── */}
              <Typography fontFamily="monospace" fontSize="0.68rem" letterSpacing={4} fontWeight={800}
                color={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
                sx={{ textTransform: 'uppercase', mb: 2 }}>
                ALL GAMES — {GAMES.length} TITLES
              </Typography>

              <Grid container spacing={2.5}>
                {GAMES.map((game, i) => (
                  <Grid item xs={12} sm={6} lg={4} key={game.id} sx={{ display: 'flex' }}>
                    <Box sx={{ width: '100%' }}>
                      <GameCard game={game} index={i} onSelect={setActiveGame} />
                    </Box>
                  </Grid>
                ))}
              </Grid>

              {/* ── Footer ── */}
              <ArcadeFooter onLeaderboard={() => navigate('/leaderboard')} />

            </motion.div>
          )}

          {/* ══ ACTIVE GAME ══ */}
          {activeGame && (
            <motion.div key={activeGame} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>

              {/* Game header bar */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, pb: 2.5, borderBottom: `1px solid ${activeData?.color}22` }}>
                <motion.button
                  whileHover={{ scale: 1.05, x: -3 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveGame(null)}
                  style={{
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10, padding: '8px 16px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.7)',
                    fontFamily: 'monospace', fontWeight: 800, fontSize: '0.72rem', letterSpacing: 2,
                  }}
                >
                  <ArrowLeft size={14} />
                  LOBBY
                </motion.button>

                <Box sx={{ flex: 1 }}>
                  <Typography fontFamily="'Courier New',monospace" fontWeight={900}
                    fontSize="1.1rem" color={activeData?.color} letterSpacing={2}
                    sx={{ textShadow: `0 0 20px ${activeData?.glow}` }}>
                    {activeData?.title}
                  </Typography>
                  <Typography fontFamily="monospace" fontSize="0.6rem" color="rgba(255,255,255,0.3)" letterSpacing={2}>
                    {activeData?.tagline}
                  </Typography>
                </Box>

                <Box sx={{
                  px: 2, py: 0.75, borderRadius: '8px',
                  background: activeData?.gradient,
                  boxShadow: `0 0 16px ${activeData?.glow}`,
                  display: 'flex', alignItems: 'center', gap: 1,
                }}>
                  {activeData && <activeData.icon size={14} color="white" />}
                  <Typography fontFamily="monospace" fontSize="0.65rem" fontWeight={900} color="white" letterSpacing={2}>IN SESSION</Typography>
                </Box>
              </Box>

              {/* Game component — ✅ FIXED: ActiveComponent is now properly set from game.component */}
              <Box sx={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${activeData?.color}22`, boxShadow: `0 0 40px ${activeData?.glow}` }}>
                {ActiveComponent
                  ? <ActiveComponent onBack={() => setActiveGame(null)} />
                  : (
                    <Box sx={{ p: 8, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                      <Typography fontFamily="monospace" fontWeight={700}>Game component not found.</Typography>
                    </Box>
                  )
                }
              </Box>

            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </Box>
  );
}
