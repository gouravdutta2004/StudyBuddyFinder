import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Button, useTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const CELL = 20; // px per grid cell
const COLS = 20;
const ROWS = 18;
const DIRS = { ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 } };

function randFood(snake) {
  let pos;
  do { pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }; }
  while (snake.some(s => s.x === pos.x && s.y === pos.y));
  return pos;
}

export default function SnakeGame({ onBack }) {
  const { user, setUser } = useAuth();
  const isDark = useTheme().palette.mode === 'dark';
  const canvasRef = useRef(null);
  const stateRef = useRef({ snake: [], dir: { x: 1, y: 0 }, food: null, score: 0, running: false, raf: null });
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('idle'); // idle | playing | dead
  const [xpAwarded, setXpAwarded] = useState(false);

  // Keyboard
  useEffect(() => {
    const handler = (e) => {
      const newDir = DIRS[e.key];
      if (!newDir) return;
      e.preventDefault();
      const s = stateRef.current;
      // Prevent 180° reversal
      if (newDir.x !== -s.dir.x || newDir.y !== -s.dir.y) s.dir = newDir;
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { snake, food } = stateRef.current;
    const w = COLS * CELL, h = ROWS * CELL;

    // Background
    ctx.fillStyle = isDark ? '#050912' : '#f0f4ff';
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = isDark ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, h); ctx.stroke(); }
    for (let y = 0; y <= ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(w, y * CELL); ctx.stroke(); }

    // Food
    if (food) {
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#ef4444';
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Snake
    snake.forEach((seg, i) => {
      const isHead = i === 0;
      const alpha = isHead ? 1 : Math.max(0.3, 1 - i * 0.04);
      ctx.shadowBlur = isHead ? 16 : 0;
      ctx.shadowColor = '#22d3ee';
      const grad = ctx.createLinearGradient(seg.x * CELL, seg.y * CELL, (seg.x + 1) * CELL, (seg.y + 1) * CELL);
      grad.addColorStop(0, isHead ? '#38bdf8' : `rgba(34,211,238,${alpha})`);
      grad.addColorStop(1, isHead ? '#6366f1' : `rgba(99,102,241,${alpha})`);
      ctx.fillStyle = grad;
      const r = isHead ? 6 : 4;
      ctx.beginPath();
      ctx.roundRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2, r);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }, [isDark]);

  const tick = useCallback(() => {
    const s = stateRef.current;
    if (!s.running) return;

    const head = { x: (s.snake[0].x + s.dir.x + COLS) % COLS, y: (s.snake[0].y + s.dir.y + ROWS) % ROWS };

    // Self collision
    if (s.snake.some(seg => seg.x === head.x && seg.y === head.y)) {
      s.running = false;
      setGameState('dead');
      return;
    }

    const ateFood = s.food && head.x === s.food.x && head.y === s.food.y;
    const newSnake = [head, ...s.snake.slice(0, ateFood ? undefined : -1)];
    s.snake = newSnake;

    if (ateFood) {
      s.score += 10;
      s.food = randFood(newSnake);
      setScore(s.score);
    }

    draw();
    s.raf = setTimeout(tick, 120);
  }, [draw]);

  const startGame = useCallback(() => {
    const snake = [{ x: 10, y: 9 }, { x: 9, y: 9 }, { x: 8, y: 9 }];
    stateRef.current = { snake, dir: { x: 1, y: 0 }, food: randFood(snake), score: 0, running: true };
    setScore(0);
    setXpAwarded(false);
    setGameState('playing');
    requestAnimationFrame(() => { draw(); stateRef.current.raf = setTimeout(tick, 200); });
  }, [draw, tick]);

  // Award XP on death
  useEffect(() => {
    if (gameState === 'dead' && stateRef.current.score >= 30 && !xpAwarded) {
      const xp = stateRef.current.score >= 100 ? 80 : stateRef.current.score >= 50 ? 60 : 40;
      api.post('/gamification/reward', { xp, game: 'SnakeGame' })
        .then(res => { setUser({ ...user, xp: res.data.xp, level: res.data.level }); toast.success(`+${xp} XP earned!`, { icon: '🐍' }); setXpAwarded(true); })
        .catch(() => {});
    }
  }, [gameState]);

  // Cleanup on unmount
  useEffect(() => () => { stateRef.current.running = false; clearTimeout(stateRef.current.raf); }, []);

  // Redraw on mount/theme change
  useEffect(() => { if (gameState === 'idle') { const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d'); ctx.fillStyle = isDark ? '#050912' : '#f0f4ff'; ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL); } }, [isDark, gameState]);

  // D-pad for mobile
  const swipe = (dir) => { const s = stateRef.current; const newDir = DIRS[`Arrow${dir}`]; if (newDir && (newDir.x !== -s.dir.x || newDir.y !== -s.dir.y)) s.dir = newDir; };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: { xs: 2, md: 4 }, bgcolor: isDark ? 'rgba(5,9,18,0.98)' : '#f8fafc', minHeight: 520 }}>
      {/* Header */}
      <Box sx={{ width: '100%', maxWidth: COLS * CELL, display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <span style={{ fontSize: 20 }}>🐍</span>
          <Typography fontFamily="monospace" fontWeight={900} fontSize="1rem" color={isDark ? 'white' : '#0f172a'} letterSpacing={2}>SNAKE</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography fontFamily="monospace" fontWeight={900} fontSize="1.2rem" color="#22d3ee">SCORE: {score}</Typography>
          {gameState === 'playing' && (
            <Box onClick={() => { stateRef.current.running = false; clearTimeout(stateRef.current.raf); setGameState('idle'); }}
              sx={{ cursor: 'pointer', px: 1.5, py: 0.5, borderRadius: '6px', bgcolor: 'rgba(239,68,68,0.1)', color: '#ef4444', fontFamily: 'monospace', fontWeight: 800, fontSize: '0.7rem', border: '1px solid rgba(239,68,68,0.2)' }}>
              QUIT
            </Box>
          )}
        </Box>
      </Box>

      {/* Canvas area */}
      <Box sx={{ position: 'relative', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 0 40px rgba(34,211,238,0.1)' }}>
        <canvas ref={canvasRef} width={COLS * CELL} height={ROWS * CELL} style={{ display: 'block' }} />

        {/* Overlays */}
        <AnimatePresence>
          {gameState === 'idle' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,9,18,0.85)', backdropFilter: 'blur(4px)' }}>
              <span style={{ fontSize: 48, marginBottom: 12 }}>🐍</span>
              <Typography fontFamily="monospace" fontWeight={900} fontSize="1.6rem" color="white" mb={1} letterSpacing={3}>SNAKE</Typography>
              <Typography color="rgba(255,255,255,0.4)" fontSize="0.85rem" mb={4} textAlign="center" px={4}>Use arrow keys to move. Eat food to grow. Don't bite yourself!</Typography>
              <Button onClick={startGame} sx={{ background: 'linear-gradient(135deg,#0c4a6e,#38bdf8)', color: 'white', fontFamily: 'monospace', fontWeight: 900, px: 5, py: 1.5, borderRadius: '10px', letterSpacing: 2, boxShadow: '0 0 20px rgba(56,189,248,0.4)', '&:hover': { opacity: 0.9 } }}>
                START GAME
              </Button>
            </motion.div>
          )}

          {gameState === 'dead' && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,9,18,0.92)', backdropFilter: 'blur(6px)' }}>
              <motion.div animate={{ rotate: [0, -15, 15, 0] }} transition={{ duration: 0.5 }}>
                <Trophy size={56} color="#f59e0b" style={{ marginBottom: 12 }} />
              </motion.div>
              <Typography fontFamily="monospace" fontWeight={900} fontSize="1.6rem" color="white" mb={0.5}>GAME OVER</Typography>
              <Typography fontFamily="monospace" fontSize="1.1rem" color="#22d3ee" mb={3}>SCORE: {score}</Typography>
              <Button onClick={startGame} startIcon={<RefreshCw size={16} />}
                sx={{ background: 'linear-gradient(135deg,#0c4a6e,#38bdf8)', color: 'white', fontFamily: 'monospace', fontWeight: 900, px: 4, borderRadius: '10px', letterSpacing: 2, '&:hover': { opacity: 0.9 } }}>
                PLAY AGAIN
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      {/* Mobile D-pad */}
      <Box sx={{ mt: 3, display: { xs: 'grid', md: 'none' }, gridTemplateColumns: 'repeat(3, 52px)', gridTemplateRows: 'repeat(3, 52px)', gap: 0.5 }}>
        {[['', 'Up', ''], ['Left', '', 'Right'], ['', 'Down', '']].flat().map((d, i) =>
          d ? (
            <Box key={i} onClick={() => swipe(d)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: '10px', bgcolor: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)', cursor: 'pointer', userSelect: 'none', color: '#22d3ee', fontSize: 22, '&:active': { bgcolor: 'rgba(34,211,238,0.25)' } }}>
              {d === 'Up' ? '↑' : d === 'Down' ? '↓' : d === 'Left' ? '←' : '→'}
            </Box>
          ) : <Box key={i} />
        )}
      </Box>
      {gameState === 'playing' && <Typography fontFamily="monospace" fontSize="0.65rem" color="rgba(255,255,255,0.2)" mt={1.5} letterSpacing={2}>USE ARROW KEYS TO CONTROL</Typography>}
    </Box>
  );
}
