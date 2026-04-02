import { useState, useCallback } from 'react';
import api from '../api/axios';
import { Box, Typography, TextField, Button, CircularProgress, Chip, useTheme, LinearProgress, Tooltip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Shuffle, RotateCcw, ChevronLeft, ChevronRight, CheckCircle, XCircle, Zap, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';

const DIFF_COLORS = { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444' };

function FlipCard({ card, index, total }) {
  const [flipped, setFlipped] = useState(false);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{ perspective: '1200px', width: '100%', maxWidth: 580, mx: 'auto', userSelect: 'none' }}>
      <Box
        onClick={() => setFlipped(f => !f)}
        sx={{
          position: 'relative', width: '100%', height: 320,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          cursor: 'pointer',
        }}
      >
        {/* Front */}
        <Box sx={{
          position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
          borderRadius: '20px', p: 4, display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center', textAlign: 'center',
          background: isDark
            ? 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)'
            : 'linear-gradient(135deg, #ede9fe 0%, #f0f9ff 100%)',
          border: `2px solid ${isDark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.2)'}`,
          boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.5)' : '0 20px 60px rgba(99,102,241,0.15)',
        }}>
          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.65rem', color: '#6366f1', fontWeight: 800, letterSpacing: 2, mb: 2 }}>
            CARD {index + 1} / {total} · CLICK TO REVEAL
          </Typography>
          <Chip label={card.difficulty?.toUpperCase() || 'MIXED'} size="small"
            sx={{ bgcolor: DIFF_COLORS[card.difficulty] + '22', color: DIFF_COLORS[card.difficulty], fontWeight: 800, fontFamily: 'monospace', mb: 3, border: `1px solid ${DIFF_COLORS[card.difficulty]}44` }} />
          <Typography sx={{ fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.5, color: isDark ? 'white' : '#0f172a' }}>
            {card.question}
          </Typography>
        </Box>

        {/* Back */}
        <Box sx={{
          position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          borderRadius: '20px', p: 4, display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center', textAlign: 'center',
          background: isDark
            ? 'linear-gradient(135deg, #064e3b 0%, #0f172a 100%)'
            : 'linear-gradient(135deg, #d1fae5 0%, #f0fdf4 100%)',
          border: `2px solid ${isDark ? 'rgba(16,185,129,0.4)' : 'rgba(16,185,129,0.3)'}`,
          boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.5)' : '0 20px 60px rgba(16,185,129,0.15)',
        }}>
          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.65rem', color: '#10b981', fontWeight: 800, letterSpacing: 2, mb: 2 }}>
            ANSWER
          </Typography>
          <Typography sx={{ fontSize: '1.05rem', fontWeight: 600, lineHeight: 1.6, color: isDark ? '#d1fae5' : '#064e3b' }}>
            {card.answer}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

function QuizMode({ questions }) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const q = questions[current];

  const handleSelect = (idx) => {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    if (idx === q.correct) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (current + 1 >= questions.length) { setDone(true); return; }
    setCurrent(c => c + 1);
    setSelected(null);
    setRevealed(false);
  };

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography sx={{ fontSize: '4rem', mb: 1 }}>{pct >= 80 ? '🏆' : pct >= 50 ? '💪' : '📚'}</Typography>
        <Typography sx={{ fontSize: '2rem', fontWeight: 900, color: pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444' }}>
          {pct}%
        </Typography>
        <Typography sx={{ fontSize: '1rem', color: 'text.secondary', mt: 1 }}>
          {score} / {questions.length} questions correct
        </Typography>
        <Button onClick={() => { setCurrent(0); setSelected(null); setRevealed(false); setScore(0); setDone(false); }}
          variant="contained" sx={{ mt: 3, bgcolor: '#6366f1', borderRadius: '10px', fontWeight: 800 }} startIcon={<RotateCcw size={16} />}>
          Retry Quiz
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'text.secondary', fontWeight: 700 }}>
          Q {current + 1} / {questions.length}
        </Typography>
        <Chip label={`Score: ${score}`} size="small" sx={{ bgcolor: 'rgba(99,102,241,0.1)', color: '#6366f1', fontWeight: 800, fontFamily: 'monospace' }} />
      </Box>
      <LinearProgress variant="determinate" value={(current / questions.length) * 100}
        sx={{ mb: 3, borderRadius: 2, height: 6, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', '& .MuiLinearProgress-bar': { bgcolor: '#6366f1', borderRadius: 2 } }} />
      <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, mb: 3, color: isDark ? 'white' : '#0f172a', lineHeight: 1.5 }}>
        {q.question}
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {q.options.map((opt, i) => {
          const isCorrect = i === q.correct;
          const isSelected = i === selected;
          let bg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
          let border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
          if (revealed) {
            if (isCorrect) { bg = 'rgba(16,185,129,0.12)'; border = '#10b981'; }
            else if (isSelected) { bg = 'rgba(239,68,68,0.12)'; border = '#ef4444'; }
          }
          return (
            <Box key={i} onClick={() => handleSelect(i)}
              component={motion.div} whileHover={!revealed ? { scale: 1.01 } : {}}
              sx={{ p: 2, borderRadius: '12px', cursor: revealed ? 'default' : 'pointer', bgcolor: bg, border: `1.5px solid ${border}`, display: 'flex', alignItems: 'center', gap: 2, transition: 'all 0.2s' }}>
              <Box sx={{ width: 28, height: 28, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'monospace', fontWeight: 900, fontSize: '0.8rem', bgcolor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)', color: isDark ? 'white' : '#0f172a' }}>
                {['A','B','C','D'][i]}
              </Box>
              <Typography sx={{ flex: 1, fontWeight: 600, fontSize: '0.92rem', color: isDark ? 'white' : '#0f172a' }}>{opt}</Typography>
              {revealed && isCorrect && <CheckCircle size={18} color="#10b981" />}
              {revealed && isSelected && !isCorrect && <XCircle size={18} color="#ef4444" />}
            </Box>
          );
        })}
      </Box>
      {revealed && (
        <Box sx={{ mt: 3, p: 2, borderRadius: '10px', bgcolor: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <Typography sx={{ fontSize: '0.85rem', color: '#a5b4fc', fontWeight: 600 }}>
            💡 {q.explanation}
          </Typography>
        </Box>
      )}
      {revealed && (
        <Button fullWidth onClick={handleNext} variant="contained" sx={{ mt: 2, bgcolor: '#6366f1', borderRadius: '10px', fontWeight: 800, py: 1.5 }}>
          {current + 1 >= questions.length ? 'See Results' : 'Next Question →'}
        </Button>
      )}
    </Box>
  );
}

export default function Flashcards() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [topic, setTopic] = useState('');
  const [mode, setMode] = useState('flashcards'); // 'flashcards' | 'quiz'
  const [count, setCount] = useState(8);
  const [difficulty, setDifficulty] = useState('mixed');
  const [loading, setLoading] = useState(false);
  const [flashcards, setFlashcards] = useState([]);
  const [quiz, setQuiz] = useState([]);
  const [currentCard, setCurrentCard] = useState(0);
  const [generated, setGenerated] = useState(false);

  const generate = useCallback(async () => {
    if (!topic.trim()) return toast.error('Enter a topic first');
    setLoading(true);
    setGenerated(false);
    try {
      if (mode === 'flashcards') {
        const { data } = await api.post('/ai/flashcards', { topic, count, difficulty });
        setFlashcards(data.flashcards || []);
      } else {
        const { data } = await api.post('/ai/quiz', { topic, count });
        setQuiz(data.quiz || []);
      }
      setCurrentCard(0);
      setGenerated(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed. Retry.');
    } finally {
      setLoading(false);
    }
  }, [topic, mode, count, difficulty]);

  const shuffle = () => {
    setFlashcards(f => [...f].sort(() => Math.random() - 0.5));
    setCurrentCard(0);
  };

  const surf = isDark ? '#080c14' : '#f6f8fa';
  const card = isDark ? '#0d1117' : '#ffffff';
  const border = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: surf, color: isDark ? '#e5e7eb' : '#111827', fontFamily: "'Inter', sans-serif", pb: 8 }}>
      <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 2, md: 4 }, pt: 4 }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.65rem', color: '#6366f1', fontWeight: 800, letterSpacing: 3, mb: 0.5 }}>
              ▸ AI · STUDY TOOLS
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: '12px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(99,102,241,0.35)' }}>
                <BrainCircuit size={22} color="white" />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '1.8rem', fontWeight: 900, color: isDark ? 'white' : '#0f172a', lineHeight: 1, letterSpacing: -1 }}>
                  AI Flashcards & Quiz
                </Typography>
                <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mt: 0.25 }}>
                  Powered by Gemini AI — Generate study materials in seconds
                </Typography>
              </Box>
            </Box>
          </Box>
        </motion.div>

        {/* Config Panel */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <Box sx={{ p: 3, borderRadius: '16px', bgcolor: card, border: `1px solid ${border}`, boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.06)', mb: 4 }}>
            {/* Mode Toggle */}
            <Box sx={{ display: 'flex', gap: 1, mb: 3, p: 0.5, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderRadius: '10px' }}>
              {[{ key: 'flashcards', icon: <BrainCircuit size={14} />, label: 'Flashcards' }, { key: 'quiz', icon: <ClipboardList size={14} />, label: 'Quiz Mode' }].map(m => (
                <Box key={m.key} onClick={() => { setMode(m.key); setGenerated(false); }}
                  sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, py: 1, borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', transition: 'all 0.2s',
                    bgcolor: mode === m.key ? (isDark ? '#6366f1' : '#6366f1') : 'transparent',
                    color: mode === m.key ? 'white' : 'text.secondary',
                    boxShadow: mode === m.key ? '0 2px 8px rgba(99,102,241,0.4)' : 'none',
                  }}>
                  {m.icon}{m.label}
                </Box>
              ))}
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <TextField label="Topic or Subject" placeholder="e.g. Quantum Physics, React Hooks, The French Revolution..."
                value={topic} onChange={e => setTopic(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && generate()}
                variant="outlined" size="small" sx={{ flex: 1, minWidth: 240 }} />
              <TextField label="Count" type="number" value={count}
                onChange={e => setCount(Math.max(3, Math.min(20, +e.target.value)))}
                variant="outlined" size="small" sx={{ width: 90 }} inputProps={{ min: 3, max: 20 }} />
              {mode === 'flashcards' && (
                <Box sx={{ display: 'flex', gap: 0.75 }}>
                  {['easy', 'mixed', 'hard'].map(d => (
                    <Chip key={d} label={d.toUpperCase()} size="small" onClick={() => setDifficulty(d)}
                      sx={{ cursor: 'pointer', fontWeight: 800, fontFamily: 'monospace', fontSize: '0.65rem',
                        bgcolor: difficulty === d ? (DIFF_COLORS[d] + '22') : 'transparent',
                        color: difficulty === d ? DIFF_COLORS[d] : 'text.secondary',
                        border: `1.5px solid ${difficulty === d ? DIFF_COLORS[d] : 'transparent'}`,
                      }} />
                  ))}
                </Box>
              )}
              <Button variant="contained" onClick={generate} disabled={loading} startIcon={loading ? <CircularProgress size={14} /> : <Zap size={14} />}
                sx={{ bgcolor: '#6366f1', borderRadius: '10px', fontWeight: 800, px: 3, py: 1, textTransform: 'none', boxShadow: '0 4px 12px rgba(99,102,241,0.35)', '&:hover': { bgcolor: '#4f46e5' } }}>
                {loading ? 'Generating...' : 'Generate'}
              </Button>
            </Box>
          </Box>
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {generated && (
            <motion.div key={mode} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              {mode === 'flashcards' && flashcards.length > 0 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography sx={{ fontFamily: 'monospace', fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem' }}>
                      {flashcards.length} CARDS GENERATED — CLICK TO FLIP
                    </Typography>
                    <Tooltip title="Shuffle Deck">
                      <Box component={motion.div} whileHover={{ rotate: 180 }} onClick={shuffle}
                        sx={{ p: 1, borderRadius: '8px', cursor: 'pointer', color: '#6366f1', bgcolor: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex' }}>
                        <Shuffle size={16} />
                      </Box>
                    </Tooltip>
                  </Box>
                  <FlipCard card={flashcards[currentCard]} index={currentCard} total={flashcards.length} />
                  {/* Navigation */}
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 4 }}>
                    <Button onClick={() => setCurrentCard(c => Math.max(0, c - 1))} disabled={currentCard === 0}
                      variant="outlined" sx={{ borderRadius: '10px', minWidth: 48, p: 1.5, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                      <ChevronLeft size={18} />
                    </Button>
                    <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', minWidth: 80, textAlign: 'center' }}>
                      {currentCard + 1} / {flashcards.length}
                    </Typography>
                    <Button onClick={() => setCurrentCard(c => Math.min(flashcards.length - 1, c + 1))} disabled={currentCard === flashcards.length - 1}
                      variant="outlined" sx={{ borderRadius: '10px', minWidth: 48, p: 1.5, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                      <ChevronRight size={18} />
                    </Button>
                  </Box>
                  {/* All cards grid summary */}
                  <Box sx={{ mt: 4, display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {flashcards.map((_, i) => (
                      <Box key={i} onClick={() => setCurrentCard(i)} sx={{ width: 10, height: 10, borderRadius: '3px', cursor: 'pointer', bgcolor: i === currentCard ? '#6366f1' : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'), transition: 'all 0.15s' }} />
                    ))}
                  </Box>
                </Box>
              )}
              {mode === 'quiz' && quiz.length > 0 && (
                <Box sx={{ p: 3, borderRadius: '16px', bgcolor: card, border: `1px solid ${border}`, boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.06)' }}>
                  <QuizMode key={quiz.length} questions={quiz} />
                </Box>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </Box>
  );
}
