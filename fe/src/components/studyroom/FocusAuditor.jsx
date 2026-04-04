/**
 * FocusAuditor — Local AI Focus Monitor for Study Rooms
 *
 * 100% client-side. No audio or transcript leaves the device.
 * Uses Web Speech API to score on-topic conversation.
 * Fires XP penalty via socket when focus drops for >5 min.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, AlertTriangle, CheckCircle, Mic, MicOff, TrendingDown } from 'lucide-react';
import { notifyWarning, notifyError } from '../ui/PremiumToast';

const FONT = "'Plus Jakarta Sans','Inter',sans-serif";

// Subject → keyword expansion map
const SUBJECT_KEYWORDS = {
  'react': ['component', 'hook', 'state', 'props', 'jsx', 'useEffect', 'useState', 'render', 'redux', 'context', 'ref', 'virtual dom', 'lifecycle', 'effect', 'callback'],
  'javascript': ['function', 'async', 'await', 'promise', 'closure', 'prototype', 'event', 'loop', 'class', 'module', 'export', 'import', 'array', 'object', 'variable', 'let', 'const', 'var'],
  'python': ['def', 'class', 'list', 'dict', 'tuple', 'loop', 'import', 'function', 'lambda', 'pandas', 'numpy', 'flask', 'django', 'pip', 'module', 'iterator'],
  'calculus': ['derivative', 'integral', 'limit', 'function', 'chain rule', 'differentiation', 'integration', 'convergence', 'series', 'gradient', 'partial', 'vector', 'slope', 'tangent'],
  'physics': ['force', 'velocity', 'acceleration', 'momentum', 'energy', 'field', 'quantum', 'wave', 'particle', 'relativity', 'Newton', 'gravity', 'electric', 'magnetic', 'thermodynamics'],
  'biology': ['cell', 'DNA', 'RNA', 'protein', 'gene', 'evolution', 'organism', 'chromosome', 'mitosis', 'meiosis', 'enzyme', 'membrane', 'nucleus', 'photosynthesis', 'respiration'],
  'chemistry': ['molecule', 'atom', 'bond', 'reaction', 'element', 'compound', 'periodic', 'acid', 'base', 'pH', 'oxidation', 'reduction', 'stoichiometry', 'enthalpy', 'orbital'],
  'mathematics': ['equation', 'proof', 'theorem', 'matrix', 'vector', 'set', 'function', 'graph', 'algorithm', 'probability', 'statistics', 'geometric', 'algebraic', 'number theory'],
  'machine learning': ['model', 'training', 'neural', 'network', 'loss', 'gradient', 'dataset', 'feature', 'classification', 'regression', 'overfitting', 'backprop', 'epoch', 'tensor', 'layer'],
  'economics': ['demand', 'supply', 'market', 'equilibrium', 'GDP', 'inflation', 'elasticity', 'marginal', 'fiscal', 'monetary', 'trade', 'utility', 'cost', 'revenue'],
  'history': ['revolution', 'empire', 'war', 'treaty', 'civilization', 'colonialism', 'dynasty', 'reform', 'enlightenment', 'industrial', 'century', 'culture', 'movement', 'period'],
  'law': ['statute', 'precedent', 'jurisdiction', 'plaintiff', 'defendant', 'contract', 'tort', 'criminal', 'constitutional', 'legislation', 'court', 'liability', 'evidence', 'motion'],
  'medicine': ['diagnosis', 'treatment', 'anatomy', 'pathology', 'pharmacology', 'clinical', 'symptom', 'disease', 'organ', 'surgery', 'patient', 'prognosis', 'therapy', 'immune'],
};

// Generic academic words (always count as on-topic)
const GENERIC_ACADEMIC = [
  'explain', 'understand', 'concept', 'problem', 'solution', 'method', 'approach', 'result',
  'formula', 'theory', 'practice', 'example', 'question', 'answer', 'definition', 'principle',
  'algorithm', 'analysis', 'compare', 'difference', 'similar', 'important', 'key', 'step',
  'process', 'calculate', 'derive', 'prove', 'solve', 'implement', 'apply',
];

function getKeywordsForSubject(subject = '') {
  const lc = subject.toLowerCase();
  const keys = new Set(GENERIC_ACADEMIC);
  // Add subject-specific keywords
  Object.entries(SUBJECT_KEYWORDS).forEach(([key, words]) => {
    if (lc.includes(key)) words.forEach(w => keys.add(w.toLowerCase()));
  });
  // Add individual subject words themselves
  lc.split(/[\s,]+/).forEach(word => { if (word.length > 3) keys.add(word); });
  return keys;
}

function computeOnTopicScore(transcript, keywords) {
  if (!transcript || transcript.length < 5) return 100; // Silence = no penalty yet
  const words = transcript.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  if (words.length < 3) return 100;
  const hits = words.filter(w => {
    for (const kw of keywords) {
      if (w.includes(kw) || kw.includes(w)) return true;
    }
    return false;
  }).length;
  return Math.round((hits / words.length) * 100);
}

export default function FocusAuditor({ session, socket, userId }) {
  const [score, setScore] = useState(100);
  const [isActive, setIsActive] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [penaltyCountdown, setPenaltyCountdown] = useState(60);
  const [penaltyApplied, setPenaltyApplied] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  const transcriptBufferRef = useRef('');
  const lowScoreStartRef = useRef(null);  // timestamp when score went below 20%
  const recognitionRef = useRef(null);
  const warningTimerRef = useRef(null);
  const countdownRef = useRef(null);
  const keywordsRef = useRef(new Set());

  const subject = session?.subject || '';

  // Build keyword set from session subject
  useEffect(() => {
    keywordsRef.current = getKeywordsForSubject(subject);
  }, [subject]);

  // Listen for XP deducted events from server
  useEffect(() => {
    if (!socket) return;
    const handleXPDeducted = ({ penalty, newXp, reason }) => {
      notifyError('Focus Penalty Applied', `−${penalty} XP: ${reason}. New XP: ${newXp}`);
    };
    socket.on('xp_deducted', handleXPDeducted);
    return () => socket.off('xp_deducted', handleXPDeducted);
  }, [socket]);

  const applyPenalty = useCallback(() => {
    if (penaltyApplied || !socket) return;
    setPenaltyApplied(true);
    setShowWarning(false);
    clearInterval(countdownRef.current);
    socket.emit('focus_penalty', { userId, roomId: session?._id, penalty: 50 });
  }, [penaltyApplied, socket, userId, session]);

  const dismissWarning = useCallback(() => {
    setShowWarning(false);
    clearInterval(countdownRef.current);
    lowScoreStartRef.current = null; // Reset the timer
    transcriptBufferRef.current = ''; // Clear buffer for fresh start
    setPenaltyCountdown(60);
  }, []);

  // Start Speech Recognition
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setIsSupported(false); return; }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      let finalSegment = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalSegment += event.results[i][0].transcript + ' ';
        }
      }
      if (finalSegment) {
        // Keep a rolling 5-minute transcript window (~500 words max)
        transcriptBufferRef.current = (transcriptBufferRef.current + ' ' + finalSegment)
          .split(' ').slice(-500).join(' ');
      }
    };

    recognition.onerror = (e) => {
      if (e.error === 'no-speech') return; // Ignore silence events
    };

    recognition.onend = () => {
      // Auto-restart to maintain continuous monitoring
      if (recognitionRef.current) {
        try { recognitionRef.current.start(); } catch {}
      }
    };

    try {
      recognition.start();
      setIsActive(true);
    } catch { setIsSupported(false); }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
      clearInterval(countdownRef.current);
      clearTimeout(warningTimerRef.current);
    };
  }, []);

  // Score evaluation loop — every 30 seconds
  useEffect(() => {
    if (!isActive || !isSupported) return;

    const interval = setInterval(() => {
      const currentScore = computeOnTopicScore(transcriptBufferRef.current, keywordsRef.current);
      setScore(currentScore);

      if (currentScore < 20) {
        if (!lowScoreStartRef.current) {
          lowScoreStartRef.current = Date.now();
        }
        // 5 minutes of continuous low score = warning
        const elapsed = Date.now() - lowScoreStartRef.current;
        if (elapsed >= 5 * 60 * 1000 && !showWarning && !penaltyApplied) {
          setShowWarning(true);
          setPenaltyCountdown(60);
          // Start 60-second countdown
          let cd = 60;
          countdownRef.current = setInterval(() => {
            cd -= 1;
            setPenaltyCountdown(cd);
            if (cd <= 0) {
              clearInterval(countdownRef.current);
              applyPenalty();
            }
          }, 1000);
        }
      } else {
        // Score recovered — reset strike
        lowScoreStartRef.current = null;
        if (!showWarning) setPenaltyApplied(false);
      }
    }, 30000); // Check every 30s

    return () => clearInterval(interval);
  }, [isActive, isSupported, showWarning, penaltyApplied, applyPenalty]);

  // Score colour
  const scoreColor = score >= 60 ? '#10b981' : score >= 30 ? '#f59e0b' : '#ef4444';

  if (!isSupported) return null; // Gracefully absent if browser doesn't support SR

  return (
    <>
      {/* Mini HUD badge (always visible in room) */}
      <div style={{
        position: 'fixed', bottom: 24, left: 24, zIndex: 200,
        background: 'rgba(10,15,28,0.92)', backdropFilter: 'blur(16px)',
        border: `1px solid ${scoreColor}44`,
        borderRadius: 999, padding: '6px 12px 6px 8px',
        display: 'flex', alignItems: 'center', gap: 7,
        boxShadow: `0 4px 16px rgba(0,0,0,0.3), 0 0 0 1px ${scoreColor}22`,
        fontFamily: FONT, cursor: 'default',
        transition: 'border-color 0.4s, box-shadow 0.4s',
      }}>
        {isActive
          ? <Mic size={12} color={scoreColor} />
          : <MicOff size={12} color="rgba(255,255,255,0.3)" />
        }
        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)', letterSpacing: 0.5 }}>
          FOCUS
        </span>
        <span style={{ fontSize: '0.75rem', fontWeight: 900, color: scoreColor }}>
          {score}%
        </span>
        {/* Mini bar */}
        <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ width: `${score}%`, height: '100%', background: scoreColor, borderRadius: 99, transition: 'width 0.5s ease, background 0.5s ease' }} />
        </div>
      </div>

      {/* Focus Warning Modal */}
      <AnimatePresence>
        {showWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: FONT,
            }}
          >
            <motion.div
              initial={{ scale: 0.85, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 30 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              style={{
                width: 400, maxWidth: '90vw',
                background: 'rgba(10,15,28,0.98)',
                border: '1px solid rgba(245,158,11,0.5)',
                borderRadius: 20,
                boxShadow: '0 0 0 1px rgba(245,158,11,0.1), 0 32px 80px rgba(0,0,0,0.6)',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* Amber top accent */}
              <div style={{ height: 3, background: 'linear-gradient(90deg,transparent,#f59e0b,transparent)' }} />

              {/* Countdown ring */}
              <div style={{ position: 'absolute', top: 16, right: 16 }}>
                <svg width={48} height={48} viewBox="0 0 48 48">
                  <circle cx={24} cy={24} r={20} fill="none" stroke="rgba(245,158,11,0.15)" strokeWidth={3} />
                  <circle cx={24} cy={24} r={20} fill="none" stroke="#f59e0b" strokeWidth={3}
                    strokeDasharray={125.6} strokeDashoffset={125.6 * (1 - penaltyCountdown / 60)}
                    strokeLinecap="round" transform="rotate(-90 24 24)"
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                  <text x={24} y={29} textAnchor="middle" fill="#f59e0b" fontSize={13} fontWeight={900} fontFamily={FONT}>
                    {penaltyCountdown}
                  </text>
                </svg>
              </div>

              <div style={{ padding: '24px 24px 20px' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 14,
                    background: 'rgba(245,158,11,0.12)',
                    border: '1px solid rgba(245,158,11,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <AlertTriangle size={22} color="#f59e0b" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: '1rem', color: 'white' }}>
                      Focus Check ⚠️
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700 }}>
                      Off-topic for 5+ minutes
                    </div>
                  </div>
                </div>

                {/* Score display */}
                <div style={{
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 12, padding: '12px 16px', marginBottom: 16,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <TrendingDown size={14} color="#ef4444" />
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fca5a5', textTransform: 'uppercase', letterSpacing: 1 }}>
                      Your Topic Score
                    </span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 900, color: '#ef4444', marginLeft: 'auto' }}>
                      {score}%
                    </span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: `${score}%`, height: '100%', background: '#ef4444', borderRadius: 99, transition: 'width 0.8s ease' }} />
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
                    Studying: <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{subject || 'your subject'}</strong>
                  </div>
                </div>

                <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 20 }}>
                  Your conversation doesn't appear to be on-topic.
                  Confirm you're still studying or <strong style={{ color: '#ef4444' }}>−50 XP</strong> will be deducted from your Accountability Contract in <strong style={{ color: '#f59e0b' }}>{penaltyCountdown}s</strong>.
                </p>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={dismissWarning}
                    style={{
                      flex: 1, padding: '11px 0',
                      background: 'linear-gradient(135deg,#10b981,#059669)',
                      border: 'none', borderRadius: 12, cursor: 'pointer',
                      color: 'white', fontWeight: 800, fontSize: '0.84rem', fontFamily: FONT,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
                    }}
                  >
                    <CheckCircle size={15} />
                    Yes, I'm Studying!
                  </button>
                  <button
                    onClick={applyPenalty}
                    style={{
                      flex: 1, padding: '11px 0',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 12, cursor: 'pointer',
                      color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: '0.84rem',
                      fontFamily: FONT,
                    }}
                  >
                    Take the penalty
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
