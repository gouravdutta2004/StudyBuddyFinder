import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Button, TextField, Chip, useTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, Trophy, RefreshCw, CheckCircle, XCircle, SkipForward } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const WORD_LIST = [
  { word: 'BIOLOGY', hint: 'Study of living organisms' },
  { word: 'ALGEBRA', hint: 'Branch of mathematics with variables' },
  { word: 'PHYSICS', hint: 'Science of matter and energy' },
  { word: 'HISTORY', hint: 'Study of past events' },
  { word: 'GRAMMAR', hint: 'Rules of language' },
  { word: 'QUANTUM', hint: 'Smallest discrete unit of energy' },
  { word: 'CALCULUS', hint: 'Math: derivatives and integrals' },
  { word: 'SYNONYM', hint: 'A word with similar meaning' },
  { word: 'CHEMICAL', hint: 'Related to chemistry' },
  { word: 'GEOMETRY', hint: 'Study of shapes and space' },
  { word: 'FORMULA', hint: 'Mathematical rule or equation' },
  { word: 'NUCLEUS', hint: 'Center of an atom or cell' },
  { word: 'THEOREM', hint: 'Proven mathematical statement' },
  { word: 'ISOTOPE', hint: 'Variant form of a chemical element' },
  { word: 'NEURON', hint: 'Brain nerve cell' },
  { word: 'OSMOSIS', hint: 'Water movement through membranes' },
  { word: 'PRISM', hint: 'Splits white light into spectrum' },
  { word: 'PLANET', hint: 'Orbits a star in space' },
  { word: 'ENZYME', hint: 'Biological catalyst' },
  { word: 'MATRIX', hint: 'Rectangular array of numbers' },
];

function scramble(word) {
  const arr = word.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const result = arr.join('');
  return result === word ? scramble(word) : result;
}

export default function WordScramble({ onBack }) {
  const { user, setUser } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const inputRef = useRef(null);

  const [gameState, setGameState] = useState('idle'); // idle | playing | ended
  const [wordIndex, setWordIndex] = useState(0);
  const [scrambled, setScrambled] = useState('');
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [skipsLeft, setSkipsLeft] = useState(3);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong'
  const [xpAwarded, setXpAwarded] = useState(false);

  const TOTAL_TIME = 90;
  const shuffled = useRef([]);

  const loadWord = useCallback((idx) => {
    const w = shuffled.current[idx];
    setScrambled(scramble(w.word));
    setInput('');
    setFeedback(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const startGame = useCallback(() => {
    shuffled.current = [...WORD_LIST].sort(() => Math.random() - 0.5);
    setWordIndex(0);
    setScore(0);
    setTimeLeft(TOTAL_TIME);
    setSkipsLeft(3);
    setFeedback(null);
    setXpAwarded(false);
    setGameState('playing');
    loadWord(0);
  }, [loadWord]);

  // Timer
  useEffect(() => {
    if (gameState !== 'playing') return;
    if (timeLeft <= 0) { setGameState('ended'); return; }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [gameState, timeLeft]);

  // Award XP on end
  useEffect(() => {
    if (gameState === 'ended' && score >= 3 && !xpAwarded) {
      const xp = score >= 10 ? 70 : score >= 5 ? 50 : 30;
      api.post('/gamification/reward', { xp, game: 'WordScramble' })
        .then(res => {
          setUser({ ...user, xp: res.data.xp, level: res.data.level });
          toast.success(`+${xp} XP earned!`, { icon: '🔤' });
          setXpAwarded(true);
        }).catch(() => {});
    }
  }, [gameState]);

  const handleInput = (e) => {
    const val = e.target.value.toUpperCase();
    setInput(val);
    const target = shuffled.current[wordIndex]?.word;
    if (val === target) {
      setFeedback('correct');
      setScore(s => s + 1);
      setTimeout(() => {
        const next = wordIndex + 1;
        if (next >= shuffled.current.length) { setGameState('ended'); return; }
        setWordIndex(next);
        loadWord(next);
      }, 600);
    }
  };

  const skip = () => {
    if (skipsLeft <= 0) return;
    setSkipsLeft(s => s - 1);
    const next = wordIndex + 1;
    if (next >= shuffled.current.length) { setGameState('ended'); return; }
    setWordIndex(next);
    loadWord(next);
  };

  const timerPct = (timeLeft / TOTAL_TIME) * 100;
  const timerColor = timeLeft <= 10 ? '#ef4444' : timeLeft <= 30 ? '#f59e0b' : '#22d3ee';

  return (
    <Box sx={{ minHeight: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', p: { xs: 3, md: 5 }, bgcolor: isDark ? 'rgba(5,9,18,0.98)' : '#f8fafc' }}>

      {/* Header */}
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Shuffle size={20} color="#f59e0b" />
          <Box>
            <Typography fontFamily="monospace" fontWeight={900} fontSize="1.1rem" color={isDark ? 'white' : '#0f172a'} letterSpacing={2}>WORD SCRAMBLE</Typography>
            <Typography fontFamily="monospace" fontSize="0.6rem" color="rgba(255,255,255,0.3)" letterSpacing={2}>DECODE · UNSCRAMBLE · SCORE</Typography>
          </Box>
        </Box>
        {gameState === 'playing' && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Chip label={`SCORE: ${score}`} size="small" sx={{ bgcolor: 'rgba(34,211,238,0.1)', color: '#22d3ee', fontFamily: 'monospace', fontWeight: 900, letterSpacing: 1 }} />
            <Chip label={`SKIP ×${skipsLeft}`} size="small" sx={{ bgcolor: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontFamily: 'monospace', fontWeight: 900, letterSpacing: 1 }} />
          </Box>
        )}
      </Box>

      <AnimatePresence mode="wait">
        {gameState === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ textAlign: 'center', width: '100%', paddingTop: 60 }}>
            <Box sx={{ width: 80, height: 80, borderRadius: '20px', background: 'linear-gradient(135deg,#78350f,#d97706,#fbbf24)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3, boxShadow: '0 0 40px rgba(245,158,11,0.4)' }}>
              <Shuffle size={36} color="white" />
            </Box>
            <Typography fontFamily="monospace" fontWeight={900} fontSize="1.4rem" color={isDark ? 'white' : '#0f172a'} mb={1} letterSpacing={2}>WORD SCRAMBLE</Typography>
            <Typography color="rgba(255,255,255,0.4)" fontSize="0.9rem" mb={4} maxWidth={380} mx="auto">Unscramble study vocabulary words as fast as you can. You have 90 seconds and 3 skips.</Typography>
            <Button onClick={startGame} sx={{ background: 'linear-gradient(135deg,#78350f,#fbbf24)', color: 'white', fontFamily: 'monospace', fontWeight: 900, px: 5, py: 1.5, borderRadius: '10px', fontSize: '0.9rem', letterSpacing: 2, boxShadow: '0 0 24px rgba(245,158,11,0.4)', '&:hover': { opacity: 0.9 } }}>
              START GAME
            </Button>
          </motion.div>
        )}

        {gameState === 'playing' && (
          <motion.div key="playing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ width: '100%', maxWidth: 500 }}>
            {/* Timer bar */}
            <Box sx={{ width: '100%', height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.06)', mb: 4, overflow: 'hidden' }}>
              <motion.div animate={{ width: `${timerPct}%` }} transition={{ duration: 0.5 }} style={{ height: '100%', background: timerColor, borderRadius: 3, boxShadow: `0 0 10px ${timerColor}` }} />
            </Box>

            {/* Timer + hint */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography fontFamily="monospace" fontWeight={900} fontSize="2rem" color={timerColor} sx={{ textShadow: `0 0 20px ${timerColor}` }}>{timeLeft}s</Typography>
              <Typography fontSize="0.8rem" color="rgba(255,255,255,0.35)" fontStyle="italic" textAlign="right" maxWidth={200} lineHeight={1.4}>
                💡 {shuffled.current[wordIndex]?.hint}
              </Typography>
            </Box>

            {/* Scrambled word */}
            <AnimatePresence mode="wait">
              <motion.div key={wordIndex} initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10 }}>
                <Box sx={{ textAlign: 'center', mb: 4, p: 3, borderRadius: '16px', bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', border: '1px solid rgba(245,158,11,0.15)' }}>
                  {scrambled.split('').map((ch, i) => (
                    <motion.span key={i} initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.06 }}
                      style={{ display: 'inline-block', fontFamily: "'Courier New', monospace", fontSize: '2.2rem', fontWeight: 900, color: '#fbbf24', letterSpacing: 12, textShadow: '0 0 20px rgba(251,191,36,0.6)' }}>
                      {ch}
                    </motion.span>
                  ))}
                </Box>
              </motion.div>
            </AnimatePresence>

            {/* Input */}
            <TextField
              inputRef={inputRef}
              value={input}
              onChange={handleInput}
              placeholder="Type the word..."
              autoComplete="off"
              fullWidth
              inputProps={{ style: { textTransform: 'uppercase', textAlign: 'center', fontFamily: 'monospace', fontWeight: 900, fontSize: '1.4rem', letterSpacing: 8, color: feedback === 'correct' ? '#22c55e' : (isDark ? 'white' : '#0f172a') } }}
              sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', '& fieldset': { borderColor: feedback === 'correct' ? '#22c55e' : 'rgba(245,158,11,0.3)', borderWidth: 2 }, '&:hover fieldset': { borderColor: '#fbbf24' }, '&.Mui-focused fieldset': { borderColor: '#fbbf24' } } }}
            />

            {/* Skip */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button onClick={skip} disabled={skipsLeft <= 0} startIcon={<SkipForward size={16} />}
                sx={{ fontFamily: 'monospace', fontWeight: 800, color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#f59e0b' }, '&:disabled': { color: 'rgba(255,255,255,0.15)' } }}>
                SKIP ({skipsLeft} left)
              </Button>
            </Box>
          </motion.div>
        )}

        {gameState === 'ended' && (
          <motion.div key="ended" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', paddingTop: 40 }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.6 }}>
              <Trophy size={64} color="#f59e0b" style={{ margin: '0 auto 16px' }} />
            </motion.div>
            <Typography fontFamily="monospace" fontWeight={900} fontSize="1.8rem" color={isDark ? 'white' : '#0f172a'} mb={1}>{score} WORDS SOLVED</Typography>
            <Typography color="rgba(255,255,255,0.4)" mb={4}>{score >= 10 ? '🔥 Word Master!' : score >= 5 ? '⭐ Great effort!' : 'Keep practising!'}</Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button onClick={startGame} startIcon={<RefreshCw size={16} />}
                sx={{ background: 'linear-gradient(135deg,#78350f,#fbbf24)', color: 'white', fontFamily: 'monospace', fontWeight: 900, px: 4, py: 1.25, borderRadius: '10px', letterSpacing: 2, '&:hover': { opacity: 0.9 } }}>
                PLAY AGAIN
              </Button>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}
