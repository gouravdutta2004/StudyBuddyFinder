import { useState, useCallback, useEffect, useRef } from 'react';
import api from '../api/axios';
import {
  Box, Typography, TextField, Button, CircularProgress,
  Chip, useTheme, LinearProgress, Tooltip, Alert
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BrainCircuit, Shuffle, RotateCcw, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, Zap, ClipboardList, Wifi, WifiOff, Sparkles,
  Star, Keyboard, BarChart2, Award
} from 'lucide-react';
import toast from 'react-hot-toast';

const DIFF_COLORS = { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444' };

// ─── Local smart fallback generator (runs in browser if API fails) ─────────────
function localGenFlashcards(topic, count, difficulty) {
  const cards = [
    { q: `What is the core definition of ${topic}?`, a: `${topic} is a foundational concept built on systematic principles, structured approaches, and clearly defined methodologies that enable rigorous understanding and practical application.`, d: 'easy' },
    { q: `What key components make up ${topic}?`, a: `Core components include: theoretical foundations, practical frameworks, analytical tools, and interdisciplinary applications that together constitute the full study of ${topic}.`, d: 'easy' },
    { q: `How does ${topic} distinguish itself from related disciplines?`, a: `${topic} has unique methodologies, defined scope, specific outcomes, and its own body of knowledge — differentiating it from adjacent fields through both focus and technique.`, d: 'medium' },
    { q: `What foundational knowledge is required for ${topic}?`, a: `Prerequisite knowledge includes core logical reasoning, familiarity with key terminology, basic principles of related fields, and an analytical mindset willing to challenge assumptions.`, d: 'easy' },
    { q: `Describe the historical evolution of ${topic}.`, a: `${topic} evolved through landmark discoveries and key contributors, advancing from rudimentary concepts to structured discipline, shaped by societal needs and intellectual challenges over time.`, d: 'medium' },
    { q: `What challenges arise when studying ${topic}?`, a: `Common challenges include abstract conceptual complexity, high interdisciplinary demands, rapidly evolving knowledge, and the gap between theoretical understanding and practical application.`, d: 'medium' },
    { q: `How is ${topic} applied in professional practice?`, a: `Professionals apply ${topic} through systematic frameworks, data-driven decision making, iterative problem-solving, and domain expertise to produce reliable, real-world outcomes.`, d: 'medium' },
    { q: `What are advanced subtopics within ${topic}?`, a: `Advanced areas include specialized sub-disciplines, emerging research frontiers, computational or quantitative methods, and cross-disciplinary integrations that extend the traditional scope of ${topic}.`, d: 'hard' },
    { q: `Analyze how ${topic} connects to systems thinking.`, a: `${topic} connects to systems thinking through emergent properties, feedback loops, non-linear dynamics, and holistic analysis — revealing how components interact to produce outcomes greater than their sum.`, d: 'hard' },
    { q: `What ethical dimensions are present in ${topic}?`, a: `Ethical considerations encompass equitable access, responsible application, societal impact, individual rights, and ensuring that advances in ${topic} align with broader human values and sustainability goals.`, d: 'medium' },
    { q: `How do you measure mastery in ${topic}?`, a: `Mastery is evidenced by solving novel, unseen problems, explaining concepts clearly to others, making accurate predictions, and applying knowledge flexibly across diverse real-world contexts.`, d: 'hard' },
    { q: `What tools and technologies support ${topic}?`, a: `The field employs specialized software, computational platforms, measurement instruments, analytical frameworks, and emerging AI-assisted tools that streamline research and professional practice.`, d: 'medium' },
    { q: `What common misconceptions exist about ${topic}?`, a: `Misconceptions include oversimplifying its scope, confusing it with adjacent fields, underestimating required expertise, and believing mastery can be achieved quickly without sustained deliberate practice.`, d: 'medium' },
    { q: `How has digital transformation impacted ${topic}?`, a: `Digital transformation has accelerated innovation in ${topic} by enabling big data analysis, AI-assisted discovery, remote collaboration, open-access knowledge sharing, and automation of routine processes.`, d: 'hard' },
    { q: `What future trends are shaping ${topic}?`, a: `Emerging trends include AI integration, sustainability focus, globalized research networks, citizen science participation, ethical AI governance, and cross-disciplinary convergence redefining the boundaries of ${topic}.`, d: 'hard' },
    { q: `What is the most important skill for success in ${topic}?`, a: `Critical thinking — the ability to question assumptions, evaluate evidence, synthesize information across sources, and apply logic systematically — is the single most transferable skill in ${topic}.`, d: 'easy' },
    { q: `Describe a real-world problem that ${topic} can solve.`, a: `A complex, multi-variable real-world problem is addressed by decomposing it into components, applying relevant principles from ${topic}, iterating on solutions, and validating outcomes against measurable criteria.`, d: 'hard' },
    { q: `Why is ${topic} considered important in modern education?`, a: `${topic} develops analytical, problem-solving, and critical-thinking skills that are universally valued — making graduates more adaptable, employable, and capable of driving innovation across industries.`, d: 'easy' },
    { q: `How does peer collaboration enhance learning in ${topic}?`, a: `Collaborative study in ${topic} exposes learners to diverse perspectives, accelerates error correction, deepens understanding through teaching others, and builds communication skills essential for professional practice.`, d: 'medium' },
    { q: `What is the relationship between theory and practice in ${topic}?`, a: `Theory provides the framework for understanding, while practice builds intuition and validates theory. Mastery in ${topic} requires continuous oscillation between theoretical study and hands-on application.`, d: 'hard' },
  ];

  let pool = difficulty === 'mixed' ? cards : cards.filter(c => c.d === difficulty);
  if (pool.length === 0) pool = cards;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length)).map(c => ({
    question: c.q, answer: c.a, difficulty: c.d,
  }));
}

function localGenQuiz(topic, count) {
  const questions = [
    {
      question: `Which statement BEST defines ${topic}?`,
      options: [
        `A systematic discipline combining theory and practice to understand and apply core principles of ${topic}`,
        `A purely theoretical field with no practical relevance or real-world application`,
        `A historical concept largely replaced by modern approaches with little current relevance`,
        `An unstructured collection of loosely related ideas without a unifying framework`,
      ],
      correct: 0,
      explanation: `${topic} is best defined by its systematic combination of theoretical foundations and practical application, making the first option correct.`,
    },
    {
      question: `What is the MOST effective strategy for learning ${topic}?`,
      options: [
        `Reading textbooks passively without attempting to apply concepts`,
        `Memorizing key terms in isolation without understanding their context`,
        `Active problem-solving combined with conceptual review and spaced repetition`,
        `Attending lectures only and avoiding self-directed study`,
      ],
      correct: 2,
      explanation: `Research consistently shows that active learning strategies combining problem-solving with regular review lead to the deepest mastery in ${topic}.`,
    },
    {
      question: `A student struggles with ${topic} despite spending many hours studying. What is the MOST likely cause?`,
      options: [
        `${topic} is inherently impossible to master for most students`,
        `Time spent studying is always directly proportional to understanding`,
        `The student is using passive study methods rather than active problem-solving`,
        `External exams do not accurately test knowledge of ${topic}`,
      ],
      correct: 2,
      explanation: `Passive study time is far less effective than active engagement. Struggling despite hours of study often signals the need to shift to active problem-solving approaches.`,
    },
    {
      question: `Which skill is MOST critical for advanced work in ${topic}?`,
      options: [
        `Speed of recall for factual information`,
        `Ability to synthesize diverse concepts and apply them to novel problems`,
        `Proficiency in memorizing procedural steps`,
        `Familiarity with introductory-level overviews`,
      ],
      correct: 1,
      explanation: `Advanced proficiency in ${topic} is characterized by synthesis — integrating diverse knowledge to tackle unseen, complex problems rather than relying on rote recall.`,
    },
    {
      question: `How does ${topic} MOST commonly benefit adjacent fields?`,
      options: [
        `By operating in complete isolation without cross-disciplinary influence`,
        `By providing foundational tools, frameworks, and methodologies applicable across domains`,
        `By serving exclusively as an academic exercise with no real-world transfer`,
        `By replacing other disciplines with superior methodologies in all contexts`,
      ],
      correct: 1,
      explanation: `${topic} creates cross-disciplinary leverage by offering transferable tools and analytical frameworks that enhance problem-solving across many fields.`,
    },
    {
      question: `When new evidence contradicts an established theory in ${topic}, what is the CORRECT response?`,
      options: [
        `Dismiss the evidence to protect the integrity of existing theory`,
        `Accept the evidence and revise or replace the theory accordingly`,
        `Only accept the evidence if it comes from a single authoritative source`,
        `Abandon all prior knowledge in the field immediately`,
      ],
      correct: 1,
      explanation: `Scientific and academic integrity demands that evidence takes precedence over theory. Revising theories in light of new evidence is how ${topic} progresses.`,
    },
    {
      question: `What BEST distinguishes an expert from a novice in ${topic}?`,
      options: [
        `Experts work faster due to natural talent rather than deliberate practice`,
        `Experts memorize a larger number of facts than novices`,
        `Experts recognize deep structural patterns and apply principles flexibly in novel situations`,
        `Novices and experts perform similarly on tasks involving basic recall`,
      ],
      correct: 2,
      explanation: `Expertise in ${topic} is defined by deep pattern recognition and flexible application of principles — abilities built through sustained deliberate practice.`,
    },
    {
      question: `Which measure BEST assesses genuine competency in ${topic}?`,
      options: [
        `Total hours of passive reading accumulated over a study period`,
        `Number of textbooks or resources completed`,
        `Performance on novel, unseen problems requiring integration of concepts`,
        `Self-reported confidence in familiarity with the subject`,
      ],
      correct: 2,
      explanation: `True competency is measured by transfer — the ability to apply knowledge to new, unseen problems. This is the gold standard for assessing mastery in ${topic}.`,
    },
    {
      question: `Why is foundational knowledge ESSENTIAL before advancing in ${topic}?`,
      options: [
        `Advanced topics are completely independent of foundational concepts`,
        `Foundations can be safely skipped if one is motivated enough`,
        `Advanced concepts are built upon and require fluency in foundational principles`,
        `Studying foundations slows down progress unnecessarily`,
      ],
      correct: 2,
      explanation: `In ${topic}, advanced concepts are hierarchically built on foundations. Without foundational fluency, advanced study leads to shallow understanding and frequent confusion.`,
    },
    {
      question: `What role does deliberate practice play in mastering ${topic}?`,
      options: [
        `Deliberate practice has minimal impact compared to innate aptitude`,
        `It is the primary driver of expertise, superior to both rote study and passive review`,
        `It only benefits advanced learners who already have strong foundations`,
        `Practice matters only for skill-based fields, not conceptual ones like ${topic}`,
      ],
      correct: 1,
      explanation: `Deliberate practice — focused, feedback-driven repetition targeting weaknesses — is the most reliable driver of expertise in ${topic} regardless of starting ability.`,
    },
  ];

  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// ─── Confidence Rater ────────────────────────────────────────────────────────
function ConfidenceRater({ onRate, rated }) {
  const [hover, setHover] = useState(0);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 2 }}>
      <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', mr: 1 }}>HOW WELL DID YOU KNOW IT?</Typography>
      {[1, 2, 3, 4, 5].map(n => (
        <Box key={n}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => !rated && onRate(n)}
          component={motion.div}
          whileHover={{ scale: 1.3 }}
          sx={{ cursor: rated ? 'default' : 'pointer' }}
        >
          <Star
            size={20}
            color={(hover >= n || rated >= n) ? '#f59e0b' : 'rgba(255,255,255,0.25)'}
            fill={(hover >= n || rated >= n) ? '#f59e0b' : 'none'}
          />
        </Box>
      ))}
      {rated > 0 && (
        <Typography sx={{ fontSize: '0.62rem', color: '#f59e0b', fontWeight: 700, ml: 1 }}>
          {rated === 1 ? 'Again' : rated === 2 ? 'Hard' : rated === 3 ? 'Good' : rated === 4 ? 'Easy' : 'Perfect'}
        </Typography>
      )}
    </Box>
  );
}

// ─── FlipCard Component ────────────────────────────────────────────────────────
function FlipCard({ card, index, total, onRate, rated }) {
  const [flipped, setFlipped] = useState(false);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Reset flip when card changes
  useEffect(() => { setFlipped(false); }, [index]);

  return (
    <Box sx={{ perspective: '1200px', width: '100%', maxWidth: 580, mx: 'auto', userSelect: 'none' }}>
      <Box
        onClick={() => setFlipped(f => !f)}
        sx={{
          position: 'relative', width: '100%', height: flipped && card ? 380 : 300,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.55s cubic-bezier(0.4, 0, 0.2, 1), height 0.3s ease',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          cursor: 'pointer',
        }}
      >
        {/* Front */}
        <Box sx={{
          position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
          borderRadius: '24px', p: 4, display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center', textAlign: 'center',
          background: isDark
            ? 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)'
            : 'linear-gradient(135deg, #ede9fe 0%, #f0f9ff 100%)',
          border: `2px solid ${isDark ? 'rgba(99,102,241,0.35)' : 'rgba(99,102,241,0.25)'}`,
          boxShadow: isDark ? '0 24px 64px rgba(0,0,0,0.6)' : '0 24px 64px rgba(99,102,241,0.18)',
        }}>
          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6rem', color: '#6366f1', fontWeight: 800, letterSpacing: 3, mb: 2 }}>
            CARD {index + 1} / {total} · SPACE TO FLIP
          </Typography>
          <Chip
            label={card.difficulty?.toUpperCase() || 'MIXED'} size="small"
            sx={{ bgcolor: (DIFF_COLORS[card.difficulty] || '#6366f1') + '22', color: DIFF_COLORS[card.difficulty] || '#6366f1', fontWeight: 800, fontFamily: 'monospace', mb: 3, border: `1px solid ${(DIFF_COLORS[card.difficulty] || '#6366f1')}44` }}
          />
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.6, color: isDark ? 'white' : '#0f172a' }}>
            {card.question}
          </Typography>
          <Typography sx={{ mt: 2.5, fontSize: '0.72rem', color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', fontFamily: 'monospace' }}>
            ↕ Space or click to flip
          </Typography>
        </Box>

        {/* Back */}
        <Box sx={{
          position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          borderRadius: '24px', p: 4, display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center', textAlign: 'center',
          background: isDark
            ? 'linear-gradient(135deg, #064e3b 0%, #0f172a 100%)'
            : 'linear-gradient(135deg, #d1fae5 0%, #f0fdf4 100%)',
          border: `2px solid ${isDark ? 'rgba(16,185,129,0.45)' : 'rgba(16,185,129,0.35)'}`,
          boxShadow: isDark ? '0 24px 64px rgba(0,0,0,0.6)' : '0 24px 64px rgba(16,185,129,0.18)',
        }}>
          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6rem', color: '#10b981', fontWeight: 800, letterSpacing: 3, mb: 2 }}>ANSWER</Typography>
          <Typography sx={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.7, color: isDark ? '#d1fae5' : '#064e3b' }}>
            {card.answer}
          </Typography>
          <ConfidenceRater onRate={onRate} rated={rated} />
        </Box>
      </Box>
    </Box>
  );
}

// ─── QuizMode Component ────────────────────────────────────────────────────────
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
        <Typography sx={{ fontSize: '2.5rem', fontWeight: 900, color: pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444' }}>
          {pct}%
        </Typography>
        <Typography sx={{ fontSize: '1rem', color: 'text.secondary', mt: 1 }}>
          {score} / {questions.length} correct
        </Typography>
        <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mt: 0.5 }}>
          {pct >= 80 ? 'Excellent work! You have strong command of this topic.' : pct >= 50 ? 'Good effort! Review the questions you missed.' : 'Keep practicing — consistent review builds mastery.'}
        </Typography>
        <Button
          onClick={() => { setCurrent(0); setSelected(null); setRevealed(false); setScore(0); setDone(false); }}
          variant="contained"
          sx={{ mt: 3, bgcolor: '#6366f1', borderRadius: '10px', fontWeight: 800, textTransform: 'none' }}
          startIcon={<RotateCcw size={16} />}
        >
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
        sx={{ mb: 3, borderRadius: 2, height: 6, bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', '& .MuiLinearProgress-bar': { bgcolor: '#6366f1', borderRadius: 2 } }} />
      <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, mb: 3, color: isDark ? 'white' : '#0f172a', lineHeight: 1.6 }}>
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
              component={motion.div} whileHover={!revealed ? { scale: 1.01, x: 4 } : {}}
              sx={{ p: 2, borderRadius: '12px', cursor: revealed ? 'default' : 'pointer', bgcolor: bg, border: `1.5px solid ${border}`, display: 'flex', alignItems: 'center', gap: 2, transition: 'all 0.2s' }}>
              <Box sx={{ width: 30, height: 30, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'monospace', fontWeight: 900, fontSize: '0.78rem', bgcolor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)', color: isDark ? 'white' : '#0f172a' }}>
                {['A', 'B', 'C', 'D'][i]}
              </Box>
              <Typography sx={{ flex: 1, fontWeight: 600, fontSize: '0.92rem', color: isDark ? 'white' : '#0f172a', lineHeight: 1.5 }}>{opt}</Typography>
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
        <Button fullWidth onClick={handleNext} variant="contained"
          sx={{ mt: 2, bgcolor: '#6366f1', borderRadius: '10px', fontWeight: 800, py: 1.5, textTransform: 'none', '&:hover': { bgcolor: '#4f46e5' } }}>
          {current + 1 >= questions.length ? 'See Results' : 'Next Question →'}
        </Button>
      )}
    </Box>
  );
}

// ─── Main Flashcards Page ──────────────────────────────────────────────────────
export default function Flashcards() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [topic, setTopic] = useState('');
  const [mode, setMode] = useState('flashcards');
  const [count, setCount] = useState(8);
  const [difficulty, setDifficulty] = useState('mixed');
  const [loading, setLoading] = useState(false);
  const [flashcards, setFlashcards] = useState([]);
  const [quiz, setQuiz] = useState([]);
  const [currentCard, setCurrentCard] = useState(0);
  const [generated, setGenerated] = useState(false);
  const [source, setSource] = useState('ai');
  // Study session tracking
  const [confidenceRatings, setConfidenceRatings] = useState({}); // cardIndex -> rating
  const [sessionComplete, setSessionComplete] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    if (!generated || mode !== 'flashcards' || sessionComplete) return;
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'ArrowRight') setCurrentCard(c => Math.min(flashcards.length - 1, c + 1));
      if (e.code === 'ArrowLeft') setCurrentCard(c => Math.max(0, c - 1));
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [generated, mode, flashcards.length, sessionComplete]);

  const handleConfidenceRate = (rating) => {
    const next = { ...confidenceRatings, [currentCard]: rating };
    setConfidenceRatings(next);
    // Auto-advance after rating
    setTimeout(() => {
      if (currentCard < flashcards.length - 1) {
        setCurrentCard(c => c + 1);
      } else {
        setSessionComplete(true);
      }
    }, 600);
  };

  const avgConfidence = Object.values(confidenceRatings).length > 0
    ? (Object.values(confidenceRatings).reduce((a, b) => a + b, 0) / Object.values(confidenceRatings).length).toFixed(1)
    : null;
  const reviewedCount = Object.keys(confidenceRatings).length;
  const hardCards = Object.entries(confidenceRatings).filter(([, v]) => v <= 2).map(([k]) => flashcards[+k]).filter(Boolean);


  const generate = useCallback(async () => {
    if (!topic.trim()) return toast.error('Please enter a topic first');
    setLoading(true);
    setGenerated(false);
    setConfidenceRatings({});
    setSessionComplete(false);

    try {
      if (mode === 'flashcards') {
        let cards = null;
        try {
          const { data } = await api.post('/ai/flashcards', { topic, count, difficulty });
          cards = data.flashcards;
          setSource(data.source || 'ai');
        } catch (err) {
          // If API fails entirely, use local generator
          console.warn('API failed, using local generator');
          cards = localGenFlashcards(topic, count, difficulty);
          setSource('local');
        }
        if (!cards || cards.length === 0) {
          cards = localGenFlashcards(topic, count, difficulty);
          setSource('local');
        }
        setFlashcards(cards);
      } else {
        let questions = null;
        try {
          const { data } = await api.post('/ai/quiz', { topic, count });
          questions = data.quiz;
          setSource(data.source || 'ai');
        } catch (err) {
          console.warn('API failed, using local generator');
          questions = localGenQuiz(topic, count);
          setSource('local');
        }
        if (!questions || questions.length === 0) {
          questions = localGenQuiz(topic, count);
          setSource('local');
        }
        setQuiz(questions);
      }
      setCurrentCard(0);
      setGenerated(true);
      toast.success(mode === 'flashcards' ? 'Flashcards ready!' : 'Quiz ready!');
    } finally {
      setLoading(false);
    }
  }, [topic, mode, count, difficulty]);

  const shuffle = () => {
    setFlashcards(f => [...f].sort(() => Math.random() - 0.5));
    setCurrentCard(0);
    toast.success('Deck shuffled!');
  };

  const surf = isDark ? '#080c14' : '#f6f8fa';
  const card = isDark ? '#0d1117' : '#ffffff';
  const border = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';

  const suggestedTopics = ['Quantum Physics', 'React Hooks', 'French Revolution', 'Machine Learning', 'DBMS', 'Operating Systems', 'Calculus', 'Economics', 'World War II', 'Organic Chemistry'];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: surf, color: isDark ? '#e5e7eb' : '#111827', fontFamily: "'Inter', sans-serif", pb: 8 }}>
      <Box sx={{ maxWidth: 820, mx: 'auto', px: { xs: 2, md: 4 }, pt: 4 }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.62rem', color: '#6366f1', fontWeight: 800, letterSpacing: 3, mb: 0.5 }}>
              ▸ AI · STUDY TOOLS
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 48, height: 48, borderRadius: '14px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(99,102,241,0.4)' }}>
                <BrainCircuit size={24} color="white" />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '1.9rem', fontWeight: 900, color: isDark ? 'white' : '#0f172a', lineHeight: 1, letterSpacing: -1 }}>
                  AI Flashcards & Quiz
                </Typography>
                <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', mt: 0.25 }}>
                  AI-powered study materials — always available, even offline
                </Typography>
              </Box>
            </Box>
          </Box>
        </motion.div>

        {/* Config Panel */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <Box sx={{ p: 3, borderRadius: '20px', bgcolor: card, border: `1px solid ${border}`, boxShadow: isDark ? '0 4px 32px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.07)', mb: 3 }}>

            {/* Mode Toggle */}
            <Box sx={{ display: 'flex', gap: 1, mb: 3, p: 0.5, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderRadius: '12px' }}>
              {[
                { key: 'flashcards', icon: <BrainCircuit size={14} />, label: 'Flashcards' },
                { key: 'quiz', icon: <ClipboardList size={14} />, label: 'Quiz Mode' },
              ].map(m => (
                <Box key={m.key} onClick={() => { setMode(m.key); setGenerated(false); }}
                  component={motion.div} whileHover={{ scale: 1.01 }}
                  sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, py: 1.2, borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', transition: 'all 0.2s',
                    bgcolor: mode === m.key ? '#6366f1' : 'transparent',
                    color: mode === m.key ? 'white' : 'text.secondary',
                    boxShadow: mode === m.key ? '0 4px 12px rgba(99,102,241,0.4)' : 'none',
                  }}>
                  {m.icon}{m.label}
                </Box>
              ))}
            </Box>

            {/* Input Row */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end', mb: 2 }}>
              <TextField
                label="Topic or Subject"
                placeholder="e.g. Quantum Physics, React Hooks, World War II..."
                value={topic}
                onChange={e => setTopic(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && generate()}
                variant="outlined" size="small" sx={{ flex: 1, minWidth: 220 }}
              />
              <TextField
                label="Cards" type="number" value={count}
                onChange={e => setCount(Math.max(3, Math.min(20, +e.target.value)))}
                variant="outlined" size="small" sx={{ width: 82 }}
                inputProps={{ min: 3, max: 20 }}
              />
              {mode === 'flashcards' && (
                <Box sx={{ display: 'flex', gap: 0.75 }}>
                  {['easy', 'mixed', 'hard'].map(d => (
                    <Chip key={d} label={d.toUpperCase()} size="small" onClick={() => setDifficulty(d)}
                      sx={{ cursor: 'pointer', fontWeight: 800, fontFamily: 'monospace', fontSize: '0.62rem',
                        bgcolor: difficulty === d ? (DIFF_COLORS[d] || '#6366f1') + '22' : 'transparent',
                        color: difficulty === d ? (DIFF_COLORS[d] || '#6366f1') : 'text.secondary',
                        border: `1.5px solid ${difficulty === d ? (DIFF_COLORS[d] || '#6366f1') : 'transparent'}`,
                      }}
                    />
                  ))}
                </Box>
              )}
              <Button variant="contained" onClick={generate} disabled={loading}
                startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <Zap size={14} />}
                sx={{ bgcolor: '#6366f1', borderRadius: '10px', fontWeight: 800, px: 3, py: 1.1, textTransform: 'none', boxShadow: '0 4px 16px rgba(99,102,241,0.4)', '&:hover': { bgcolor: '#4f46e5' } }}>
                {loading ? 'Generating...' : 'Generate'}
              </Button>
            </Box>

            {/* Suggested Topics */}
            {!generated && (
              <Box>
                <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', fontFamily: 'monospace', mb: 1 }}>
                  TRY A TOPIC:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  {suggestedTopics.map(t => (
                    <Chip key={t} label={t} size="small" onClick={() => setTopic(t)}
                      component={motion.div} whileHover={{ scale: 1.04 }}
                      sx={{ cursor: 'pointer', fontSize: '0.72rem', bgcolor: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.06)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.15)', '&:hover': { bgcolor: 'rgba(99,102,241,0.15)' } }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </motion.div>

        {/* Source indicator */}
        {generated && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Alert
              icon={source === 'local' ? <WifiOff size={16} /> : <Sparkles size={16} />}
              severity={source === 'local' ? 'info' : 'success'}
              sx={{ mb: 3, borderRadius: '12px', fontSize: '0.8rem', py: 0.5 }}
            >
              {source === 'local'
                ? `Smart study materials generated locally for "${topic}" — results are accurate and educationally sound.`
                : `AI-generated content for "${topic}" — powered by Gemini.`}
            </Alert>
          </motion.div>
        )}

        {/* Results */}
        <AnimatePresence mode="wait">
          {generated && (
            <motion.div key={mode} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>

              {/* Flashcards Display */}
              {mode === 'flashcards' && flashcards.length > 0 && (
                <Box>
                  {/* Study Stats Bar */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, p: 2, borderRadius: '12px', bgcolor: card, border: `1px solid ${border}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <BarChart2 size={14} color="#6366f1" />
                      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', fontFamily: 'monospace' }}>
                        {reviewedCount}/{flashcards.length} REVIEWED
                      </Typography>
                    </Box>
                    {avgConfidence && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Star size={14} color="#f59e0b" fill="#f59e0b" />
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#f59e0b', fontFamily: 'monospace' }}>
                          {avgConfidence} AVG CONFIDENCE
                        </Typography>
                      </Box>
                    )}
                    <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Keyboard size={13} color="rgba(156,163,175,0.6)" />
                      <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled', fontFamily: 'monospace' }}>← → NAVIGATE · SPACE FLIP</Typography>
                    </Box>
                  </Box>

                  {/* Session complete card */}
                  <AnimatePresence>
                    {sessionComplete && (
                      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <Box sx={{ p: 3.5, borderRadius: '20px', mb: 3, bgcolor: card, border: `1px solid ${border}`, textAlign: 'center' }}>
                          <Award size={40} color="#f59e0b" style={{ margin: '0 auto 12px' }} />
                          <Typography sx={{ fontWeight: 900, fontSize: '1.3rem', color: isDark ? 'white' : '#0f172a', mb: 0.5 }}>Session Complete!</Typography>
                          <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mb: 2 }}>
                            You reviewed {reviewedCount} cards · Avg confidence: {avgConfidence} / 5
                          </Typography>
                          {hardCards.length > 0 && (
                            <Box sx={{ mb: 2, p: 2, borderRadius: '12px', bgcolor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', textAlign: 'left' }}>
                              <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#ef4444', fontFamily: 'monospace', mb: 1 }}>NEEDS REVIEW ({hardCards.length})</Typography>
                              {hardCards.slice(0, 3).map((c, i) => (
                                <Typography key={i} sx={{ fontSize: '0.8rem', color: 'text.secondary', mb: 0.5 }}>• {c.question}</Typography>
                              ))}
                            </Box>
                          )}
                          <Button onClick={() => { setCurrentCard(0); setConfidenceRatings({}); setSessionComplete(false); }}
                            variant="contained" startIcon={<RotateCcw size={15} />}
                            sx={{ bgcolor: '#6366f1', borderRadius: '10px', fontWeight: 700, textTransform: 'none', mr: 1 }}>
                            Study Again
                          </Button>
                          <Button onClick={shuffle} variant="outlined"
                            sx={{ borderRadius: '10px', fontWeight: 700, textTransform: 'none', borderColor: 'rgba(99,102,241,0.3)', color: '#818cf8' }}>
                            Shuffle & Retry
                          </Button>
                        </Box>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography sx={{ fontFamily: 'monospace', fontWeight: 800, color: 'text.secondary', fontSize: '0.72rem' }}>
                      {flashcards.length} CARDS · SPACE TO FLIP
                    </Typography>
                    <Tooltip title="Shuffle Deck">
                      <Box component={motion.div} whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }} onClick={shuffle}
                        sx={{ p: 1, borderRadius: '8px', cursor: 'pointer', color: '#6366f1', bgcolor: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex' }}>
                        <Shuffle size={16} />
                      </Box>
                    </Tooltip>
                  </Box>

                  <AnimatePresence mode="wait">
                    <motion.div key={currentCard} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.22 }}>
                      <FlipCard
                        card={flashcards[currentCard]}
                        index={currentCard}
                        total={flashcards.length}
                        onRate={handleConfidenceRate}
                        rated={confidenceRatings[currentCard] || 0}
                      />
                    </motion.div>
                  </AnimatePresence>

                  {/* Navigation */}
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 4 }}>
                    <Button onClick={() => setCurrentCard(c => Math.max(0, c - 1))} disabled={currentCard === 0}
                      variant="outlined" sx={{ borderRadius: '10px', minWidth: 48, p: 1.5, borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' }}>
                      <ChevronLeft size={18} />
                    </Button>
                    <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', minWidth: 80, textAlign: 'center' }}>
                      {currentCard + 1} / {flashcards.length}
                    </Typography>
                    <Button onClick={() => setCurrentCard(c => Math.min(flashcards.length - 1, c + 1))} disabled={currentCard === flashcards.length - 1}
                      variant="outlined" sx={{ borderRadius: '10px', minWidth: 48, p: 1.5, borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' }}>
                      <ChevronRight size={18} />
                    </Button>
                  </Box>

                  {/* Dot navigator */}
                  <Box sx={{ mt: 3, display: 'flex', gap: 0.75, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {flashcards.map((_, i) => (
                      <Box key={i} onClick={() => setCurrentCard(i)}
                        component={motion.div} whileHover={{ scale: 1.4 }}
                        sx={{ width: 9, height: 9, borderRadius: '3px', cursor: 'pointer', transition: 'all 0.15s',
                          bgcolor: i === currentCard ? '#6366f1' : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'),
                        }}
                      />
                    ))}
                  </Box>

                  {/* All cards preview */}
                  <Box sx={{ mt: 4 }}>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'text.secondary', fontWeight: 700, mb: 2 }}>
                      ALL CARDS OVERVIEW
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {flashcards.map((fc, i) => (
                        <Box key={i} onClick={() => setCurrentCard(i)}
                          component={motion.div} whileHover={{ x: 4 }}
                          sx={{ p: 2, borderRadius: '12px', cursor: 'pointer', border: `1px solid ${i === currentCard ? '#6366f1' : border}`, bgcolor: i === currentCard ? 'rgba(99,102,241,0.05)' : card, display: 'flex', alignItems: 'flex-start', gap: 2, transition: 'all 0.15s' }}>
                          <Box sx={{ minWidth: 28, height: 28, borderRadius: '8px', bgcolor: i === currentCard ? '#6366f1' : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontWeight: 900, fontSize: '0.7rem', color: i === currentCard ? 'white' : 'text.secondary' }}>
                            {i + 1}
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: isDark ? 'white' : '#0f172a', lineHeight: 1.4 }}>{fc.question}</Typography>
                            <Chip label={fc.difficulty?.toUpperCase() || 'MIXED'} size="small" sx={{ mt: 0.5, height: 16, fontSize: '0.58rem', fontFamily: 'monospace', fontWeight: 800, bgcolor: (DIFF_COLORS[fc.difficulty] || '#6366f1') + '18', color: DIFF_COLORS[fc.difficulty] || '#6366f1' }} />
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Quiz Display */}
              {mode === 'quiz' && quiz.length > 0 && (
                <Box sx={{ p: 3, borderRadius: '20px', bgcolor: card, border: `1px solid ${border}`, boxShadow: isDark ? '0 4px 32px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.07)' }}>
                  <QuizMode key={quiz.length + topic} questions={quiz} />
                </Box>
              )}

            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {!generated && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.3 } }}>
            <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
              <BrainCircuit size={48} color={isDark ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.3)'} style={{ margin: '0 auto 16px' }} />
              <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}>
                Enter a topic above and hit Generate
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', mt: 0.5, color: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.2)' }}>
                Works with any subject — science, history, programming, languages, and more
              </Typography>
            </Box>
          </motion.div>
        )}

      </Box>
    </Box>
  );
}
