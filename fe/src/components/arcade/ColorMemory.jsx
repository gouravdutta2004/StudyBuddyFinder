import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Button, useTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Trophy, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

// 6 distinct named colors
const COLORS = [
  { name: 'RED',    hex: '#ef4444', glow: 'rgba(239,68,68,0.6)' },
  { name: 'BLUE',   hex: '#3b82f6', glow: 'rgba(59,130,246,0.6)' },
  { name: 'GREEN',  hex: '#22c55e', glow: 'rgba(34,197,94,0.6)' },
  { name: 'YELLOW', hex: '#eab308', glow: 'rgba(234,179,8,0.6)' },
  { name: 'PURPLE', hex: '#a855f7', glow: 'rgba(168,85,247,0.6)' },
  { name: 'ORANGE', hex: '#f97316', glow: 'rgba(249,115,22,0.6)' },
];

function generateSequence(length) {
  return Array.from({ length }, () => Math.floor(Math.random() * COLORS.length));
}

// Phases: idle → show → input → correct → wrong → ended
export default function ColorMemory({ onBack }) {
  const { user, setUser } = useAuth();
  const isDark = useTheme().palette.mode === 'dark';
  const [phase, setPhase] = useState('idle');
  const [sequence, setSequence] = useState([]);
  const [showIdx, setShowIdx] = useState(-1);   // which flash is showing
  const [inputIdx, setInputIdx] = useState(0);  // which input we're waiting for
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [activeColor, setActiveColor] = useState(null); // pressed button flash
  const [xpAwarded, setXpAwarded] = useState(false);
  const timeouts = useRef([]);

  const clearAll = () => { timeouts.current.forEach(clearTimeout); timeouts.current = []; };

  const flashSequence = useCallback((seq) => {
    clearAll();
    setPhase('show');
    setShowIdx(-1);
    const speed = Math.max(300, 600 - (seq.length - 1) * 40); // faster as it grows

    seq.forEach((colorIdx, i) => {
      const t1 = setTimeout(() => setShowIdx(colorIdx), i * (speed + 200));
      const t2 = setTimeout(() => setShowIdx(-1), i * (speed + 200) + speed);
      timeouts.current.push(t1, t2);
    });

    const done = setTimeout(() => {
      setShowIdx(-1);
      setInputIdx(0);
      setPhase('input');
    }, seq.length * (speed + 200) + 300);
    timeouts.current.push(done);
  }, []);

  const startRound = useCallback((lvl) => {
    const seq = generateSequence(lvl + 2);
    setSequence(seq);
    setLevel(lvl);
    flashSequence(seq);
  }, [flashSequence]);

  const startGame = () => {
    setLives(3);
    setXpAwarded(false);
    startRound(1);
  };

  const handleColorPress = (colorIdx) => {
    if (phase !== 'input') return;
    setActiveColor(colorIdx);
    setTimeout(() => setActiveColor(null), 200);

    if (colorIdx === sequence[inputIdx]) {
      const next = inputIdx + 1;
      if (next >= sequence.length) {
        // Round cleared!
        setPhase('correct');
        clearAll();
        setTimeout(() => startRound(level + 1), 1200);
      } else {
        setInputIdx(next);
      }
    } else {
      // Wrong
      clearAll();
      const newLives = lives - 1;
      setLives(newLives);
      setPhase('wrong');
      if (newLives <= 0) {
        setTimeout(() => {
          setPhase('ended');
          if (level >= 3 && !xpAwarded) {
            const xp = level >= 8 ? 80 : level >= 5 ? 60 : 40;
            api.post('/gamification/reward', { xp, game: 'ColorMemory' })
              .then(res => { setUser({ ...user, xp: res.data.xp, level: res.data.level }); toast.success(`+${xp} XP!`, { icon: '🎨' }); setXpAwarded(true); })
              .catch(() => {});
          }
        }, 1000);
      } else {
        setTimeout(() => flashSequence(sequence), 1000);
      }
    }
  };

  useEffect(() => () => clearAll(), []);

  const lifeColor = lives >= 3 ? '#22c55e' : lives === 2 ? '#f59e0b' : '#ef4444';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: { xs: 3, md: 5 }, bgcolor: isDark ? 'rgba(5,9,18,0.98)' : '#f8fafc', minHeight: 540 }}>
      {/* Header */}
      <Box sx={{ width: '100%', maxWidth: 520, display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Palette size={20} color="#a855f7" />
          <Typography fontFamily="monospace" fontWeight={900} fontSize="1rem" color={isDark ? 'white' : '#0f172a'} letterSpacing={2}>COLOR MEMORY</Typography>
        </Box>
        {phase !== 'idle' && phase !== 'ended' && (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Typography fontFamily="monospace" fontWeight={900} fontSize="0.85rem" color="#a855f7">LVL {level}</Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {Array.from({ length: 3 }, (_, i) => (
                <Box key={i} sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: i < lives ? lifeColor : 'rgba(255,255,255,0.1)', boxShadow: i < lives ? `0 0 8px ${lifeColor}` : 'none', transition: '0.3s' }} />
              ))}
            </Box>
          </Box>
        )}
      </Box>

      <AnimatePresence mode="wait">
        {phase === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ textAlign: 'center', paddingTop: 40 }}>
            <Box sx={{ width: 88, height: 88, borderRadius: '24px', background: 'linear-gradient(135deg,#581c87,#a855f7,#c084fc)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3, boxShadow: '0 0 48px rgba(168,85,247,0.5)' }}>
              <Palette size={40} color="white" />
            </Box>
            <Typography fontFamily="monospace" fontWeight={900} fontSize="1.4rem" color={isDark ? 'white' : '#0f172a'} mb={1} letterSpacing={2}>COLOR MEMORY</Typography>
            <Typography color="rgba(255,255,255,0.4)" fontSize="0.88rem" mb={4} maxWidth={350} mx="auto" lineHeight={1.6}>Watch the color sequence, then repeat it. Each round adds one more color. How far can you go?</Typography>
            <Button onClick={startGame} sx={{ background: 'linear-gradient(135deg,#581c87,#a855f7)', color: 'white', fontFamily: 'monospace', fontWeight: 900, px: 5, py: 1.5, borderRadius: '10px', fontSize: '0.9rem', letterSpacing: 2, boxShadow: '0 0 24px rgba(168,85,247,0.4)', '&:hover': { opacity: 0.9 } }}>
              START GAME
            </Button>
          </motion.div>
        )}

        {(phase === 'show' || phase === 'input' || phase === 'correct' || phase === 'wrong') && (
          <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ width: '100%', maxWidth: 520 }}>
            {/* Status banner */}
            <AnimatePresence mode="wait">
              <motion.div key={phase} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Box sx={{ textAlign: 'center', mb: 3, py: 1.5, borderRadius: '10px', bgcolor: phase === 'correct' ? 'rgba(34,197,94,0.1)' : phase === 'wrong' ? 'rgba(239,68,68,0.1)' : phase === 'show' ? 'rgba(168,85,247,0.1)' : 'rgba(34,211,238,0.1)', border: `1px solid ${phase === 'correct' ? 'rgba(34,197,94,0.25)' : phase === 'wrong' ? 'rgba(239,68,68,0.25)' : phase === 'show' ? 'rgba(168,85,247,0.25)' : 'rgba(34,211,238,0.25)'}` }}>
                  <Typography fontFamily="monospace" fontWeight={900} fontSize="0.85rem" letterSpacing={3} color={phase === 'correct' ? '#22c55e' : phase === 'wrong' ? '#ef4444' : phase === 'show' ? '#a855f7' : '#22d3ee'}>
                    {phase === 'show' ? `▶ WATCH THE SEQUENCE (${sequence.length} colors)` : phase === 'input' ? `● YOUR TURN — ${sequence.length - inputIdx} LEFT` : phase === 'correct' ? '✓ PERFECT! NEXT LEVEL...' : '✗ WRONG! WATCH AGAIN...'}
                  </Typography>
                </Box>
              </motion.div>
            </AnimatePresence>

            {/* Color buttons — 2×3 grid */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, maxWidth: 480, mx: 'auto' }}>
              {COLORS.map((color, idx) => {
                const isFlashing = showIdx === idx;
                const isPressed = activeColor === idx;
                return (
                  <motion.div
                    key={color.name}
                    whileHover={phase === 'input' ? { scale: 1.06 } : {}}
                    whileTap={phase === 'input' ? { scale: 0.93 } : {}}
                    animate={{ scale: isFlashing || isPressed ? 1.12 : 1, opacity: isFlashing || isPressed ? 1 : (showIdx !== -1 ? 0.35 : 1) }}
                    transition={{ duration: 0.12 }}
                    onClick={() => handleColorPress(idx)}
                    style={{ cursor: phase === 'input' ? 'pointer' : 'default' }}
                  >
                    <Box sx={{
                      aspectRatio: '1', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
                      background: isFlashing || isPressed ? color.hex : `${color.hex}22`,
                      border: `2px solid ${color.hex}`,
                      boxShadow: isFlashing || isPressed ? `0 0 32px ${color.glow}, 0 0 64px ${color.glow}` : `0 0 8px ${color.hex}22`,
                      transition: 'all 0.12s ease',
                    }}>
                      <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: isFlashing || isPressed ? 'rgba(255,255,255,0.8)' : color.hex, boxShadow: isFlashing || isPressed ? '0 0 12px white' : 'none', transition: '0.12s' }} />
                      <Typography fontFamily="monospace" fontWeight={900} fontSize="0.62rem" letterSpacing={1.5} color={isFlashing || isPressed ? 'white' : color.hex}>{color.name}</Typography>
                    </Box>
                  </motion.div>
                );
              })}
            </Box>

            {/* Sequence progress dots */}
            {phase === 'input' && (
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 3 }}>
                {sequence.map((colorIdx, i) => (
                  <Box key={i} sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: i < inputIdx ? COLORS[colorIdx].hex : (i === inputIdx ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.1)'), boxShadow: i < inputIdx ? `0 0 6px ${COLORS[colorIdx].hex}` : 'none', transition: '0.2s' }} />
                ))}
              </Box>
            )}
          </motion.div>
        )}

        {phase === 'ended' && (
          <motion.div key="ended" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', paddingTop: 40 }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.6 }}>
              <Trophy size={64} color="#f59e0b" style={{ margin: '0 auto 16px' }} />
            </motion.div>
            <Typography fontFamily="monospace" fontWeight={900} fontSize="1.8rem" color={isDark ? 'white' : '#0f172a'} mb={0.5}>LEVEL {level} REACHED</Typography>
            <Typography color="rgba(255,255,255,0.5)" mb={4}>{level >= 8 ? '🔥 Memory Master!' : level >= 5 ? '⭐ Excellent recall!' : 'Keep training your memory!'}</Typography>
            <Button onClick={startGame} startIcon={<RefreshCw size={16} />}
              sx={{ background: 'linear-gradient(135deg,#581c87,#a855f7)', color: 'white', fontFamily: 'monospace', fontWeight: 900, px: 4, py: 1.25, borderRadius: '10px', letterSpacing: 2, '&:hover': { opacity: 0.9 } }}>
              PLAY AGAIN
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}
