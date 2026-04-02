import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  Box, Button, TextField, Typography, Grid, Chip,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronRight, Sparkles, BookOpen, Calendar, Lightbulb } from 'lucide-react';
import toast from 'react-hot-toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const STYLES = [
  { key: 'Visual', emoji: '👁️', desc: 'Diagrams & mind maps' },
  { key: 'Auditory', emoji: '🎧', desc: 'Lectures & podcasts' },
  { key: 'Reading/Writing', emoji: '📝', desc: 'Notes & summaries' },
  { key: 'Kinesthetic', emoji: '🤲', desc: 'Hands-on projects' },
  { key: 'Mixed', emoji: '⚡', desc: 'Flexible combo' },
  { key: 'Pomodoro', emoji: '🍅', desc: 'Focused sprints' },
];
const QUICK_SUBJECTS = ['Mathematics', 'Physics', 'CS', 'Chemistry', 'Biology', 'Economics', 'History', 'Design'];

const STEP_COLORS = ['#f97316', '#f59e0b', '#10b981'];
const STEP_META = [
  { label: 'Subjects', icon: BookOpen, tagline: 'Feed the flame', sub: 'What fuels your learning?' },
  { label: 'Schedule', icon: Calendar, tagline: 'Own the clock', sub: 'When do you study best?' },
  { label: 'Style', icon: Lightbulb, tagline: 'Ignite the squad', sub: 'How do you learn?' },
];

function FlameArt({ step }) {
  const color = STEP_COLORS[step - 1] || '#f97316';
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
      <motion.div animate={{ scaleY: [1, 1.08, 1] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}>
        <svg viewBox="0 0 80 96" width="52" height="64" style={{ filter: `drop-shadow(0 0 16px ${color}80)` }}>
          <defs>
            <radialGradient id={`fg${step}`} cx="50%" cy="80%" r="60%">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </radialGradient>
          </defs>
          <path d="M40 90 C15 78 5 62 10 48 C15 34 25 40 25 28 C25 14 32 4 40 0 C48 4 55 14 55 28 C55 40 65 34 70 48 C75 62 65 78 40 90 Z"
            fill={`url(#fg${step})`} />
          <path d="M40 84 C25 76 17 63 21 51 C25 40 31 46 31 36 C31 26 36 18 40 12 C44 18 49 26 49 36 C49 46 55 40 59 51 C63 63 55 76 40 84 Z"
            fill={color} opacity="0.55" />
        </svg>
      </motion.div>
    </Box>
  );
}

export default function Onboarding() {
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [subjects, setSubjects] = useState('');
  const [subjectTags, setSubjectTags] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [preferOnline, setPreferOnline] = useState(true);
  const [studyStyle, setStudyStyle] = useState('Mixed');

  const addSubject = () => {
    const trimmed = subjects.trim();
    if (!trimmed) return;
    const news = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
    setSubjectTags((prev) => [...new Set([...prev, ...news])]);
    setSubjects('');
  };

  const toggleDay = (day) => {
    setAvailability((prev) =>
      prev.some((a) => a.day === day)
        ? prev.filter((a) => a.day !== day)
        : [...prev, { day, startTime: '09:00', endTime: '17:00' }]
    );
  };

  const handleFinish = async () => {
    const typedExtras = subjects.split(',').map((s) => s.trim()).filter(Boolean);
    const allSubs = [...new Set([...subjectTags, ...typedExtras])];
    if (allSubs.length === 0) {
      toast.error('Please add at least one subject before igniting your profile.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.put('/users/profile', { subjects: allSubs, availability, studyStyle, preferOnline });
      updateUser(res.data);
      toast.success('🔥 Profile ignited! Welcome to the network.');
      navigate('/dashboard');
    } catch (err) {
      console.error('Onboarding error:', err.response?.data || err);
      toast.error(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const current = STEP_META[step - 1];
  const color = STEP_COLORS[step - 1];

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', p: { xs: 2, md: 4 },
      bgcolor: '#07080f',
      backgroundImage: `radial-gradient(circle at 60% 0%, ${color}14 0%, transparent 50%)`,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* grid */}
      <Box sx={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(249,115,22,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(249,115,22,0.02) 1px,transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />
      <Box sx={{ position: 'fixed', top: '-15%', right: '-5%', width: 500, height: 500, borderRadius: '50%', background: `radial-gradient(circle,${color}10,transparent 70%)`, pointerEvents: 'none', transition: 'all 1s' }} />

      <Box sx={{ width: '100%', maxWidth: 560, position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 0.6, borderRadius: 9999, bgcolor: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', mb: 2 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: color, animation: 'sbpulse 2s infinite' }} />
              <style>{`@keyframes sbpulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(1.5)}}`}</style>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Step 3 of 3 — Ignite</Typography>
            </Box>

            <FlameArt step={step} />

            <Typography sx={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 'clamp(1.6rem,4vw,2.2rem)', fontWeight: 800, color: 'white', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              <Box component="span" sx={{ background: `linear-gradient(135deg,${color},${step === 1 ? '#ef4444' : step === 2 ? '#f97316' : '#059669'})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {current.tagline}
              </Box>
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.88rem', mt: 0.5 }}>{current.sub}</Typography>
          </Box>
        </motion.div>

        {/* Progress bar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 3 }}>
          {STEP_META.map((s, i) => {
            const c = STEP_COLORS[i];
            const done = step > i + 1;
            const active = step === i + 1;
            return (
              <React.Fragment key={s.label}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .3s', bgcolor: done || active ? `${c}20` : 'rgba(255,255,255,0.04)', border: `2px solid ${done || active ? c : 'rgba(255,255,255,0.1)'}`, color: done || active ? c : 'rgba(255,255,255,0.25)', fontWeight: 800, fontSize: '0.82rem' }}>
                    {done ? <CheckCircle2 size={16} /> : i + 1}
                  </Box>
                  <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: active ? c : 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</Typography>
                </Box>
                {i < STEP_META.length - 1 && (
                  <Box sx={{ flex: 1, height: 2, borderRadius: 9999, bgcolor: step > i + 1 ? STEP_COLORS[i] : 'rgba(255,255,255,0.08)', transition: 'all .5s', mb: 2.2, mx: 0.5 }} />
                )}
              </React.Fragment>
            );
          })}
        </Box>

        {/* Card */}
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.28 }}>
            <Box sx={{
              bgcolor: 'rgba(255,255,255,0.02)', border: `1px solid ${color}20`,
              borderRadius: '24px', p: { xs: 3, md: 4 }, backdropFilter: 'blur(24px)',
              boxShadow: `0 24px 64px rgba(0,0,0,0.5), 0 0 40px ${color}10`,
            }}>

              {/* ── STEP 1 — Subjects ── */}
              {step === 1 && (
                <Box>
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.88rem', mb: 2.5, lineHeight: 1.6 }}>
                    Enter subjects you study — our AI uses this to find your perfect match.
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                    <TextField fullWidth placeholder="e.g. Calculus, Machine Learning..." value={subjects}
                      onChange={(e) => setSubjects(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubject(); } }}
                      sx={{
                        '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.04)', color: 'white', borderRadius: '14px',
                          '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                          '&:hover fieldset': { borderColor: `${color}50` },
                          '&.Mui-focused fieldset': { borderColor: color } },
                        '& input::placeholder': { color: 'rgba(255,255,255,0.25)' },
                      }} />
                    <Button onClick={addSubject} variant="contained" sx={{ borderRadius: '14px', minWidth: 72, bgcolor: color, '&:hover': { bgcolor: STEP_COLORS[1] }, fontWeight: 800, textTransform: 'none', flexShrink: 0 }}>+ Add</Button>
                  </Box>

                  {subjectTags.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2.5 }}>
                      {subjectTags.map((tag) => (
                        <Chip key={tag} label={tag} onDelete={() => setSubjectTags(subjectTags.filter((t) => t !== tag))}
                          sx={{ bgcolor: 'rgba(249,115,22,0.12)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.25)', fontWeight: 700, fontSize: '0.78rem', '& .MuiChip-deleteIcon': { color: 'rgba(249,115,22,0.5)' } }} />
                      ))}
                    </Box>
                  )}

                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1.5 }}>Quick picks</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                    {QUICK_SUBJECTS.map((s) => {
                      const sel = subjectTags.includes(s);
                      return (
                        <Box key={s} onClick={() => !sel ? setSubjectTags([...subjectTags, s]) : setSubjectTags(subjectTags.filter((t) => t !== s))}
                          sx={{ px: 1.8, py: 0.6, borderRadius: 9999, border: '1px solid', cursor: 'pointer', transition: 'all .2s', fontSize: '0.78rem', fontWeight: 600,
                            borderColor: sel ? color : 'rgba(255,255,255,0.1)', bgcolor: sel ? `${color}15` : 'rgba(255,255,255,0.03)', color: sel ? color : 'rgba(255,255,255,0.5)', '&:hover': { borderColor: color } }}>
                          {s}
                        </Box>
                      );
                    })}
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button variant="contained" endIcon={<ChevronRight size={18} />}
                      onClick={() => { if (subjectTags.length === 0 && subjects.trim()) { addSubject(); } setStep(2); }}
                      disabled={subjectTags.length === 0 && !subjects.trim()}
                      sx={{ borderRadius: '14px', px: 3.5, py: 1.4, fontWeight: 800, textTransform: 'none', fontSize: '0.95rem', bgcolor: color, '&:hover': { bgcolor: STEP_COLORS[1] }, '&.Mui-disabled': { opacity: 0.4 } }}>
                      Continue
                    </Button>
                  </Box>
                </Box>
              )}

              {/* ── STEP 2 — Schedule ── */}
              {step === 2 && (
                <Box>
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.88rem', mb: 2.5, lineHeight: 1.6 }}>
                    Pick your go-to study days. We'll match you with people who share your rhythm.
                  </Typography>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.2, mb: 3 }}>
                    {DAYS.map((day) => {
                      const active = availability.some((a) => a.day === day);
                      return (
                        <Button key={day} onClick={() => toggleDay(day)} variant={active ? 'contained' : 'outlined'}
                          sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, px: 2, py: 0.8,
                            ...(active ? { bgcolor: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1.5px solid #f59e0b', '&:hover': { bgcolor: 'rgba(245,158,11,0.25)' } }
                              : { borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)', '&:hover': { borderColor: '#f59e0b', bgcolor: 'rgba(245,158,11,0.05)' } }) }}>
                          {day.slice(0, 3)}
                        </Button>
                      );
                    })}
                  </Box>

                  <Typography sx={{ fontWeight: 700, color: 'white', fontSize: '0.9rem', mb: 1.5 }}>Session preference</Typography>
                  <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
                    {[{ label: 'Online First', icon: '🌐', val: true }, { label: 'In-Person', icon: '📍', val: false }].map((p) => (
                      <Box key={String(p.val)} onClick={() => setPreferOnline(p.val)}
                        sx={{ flex: 1, p: 2.5, borderRadius: '16px', border: '2px solid', cursor: 'pointer', transition: 'all .2s', textAlign: 'center',
                          borderColor: preferOnline === p.val ? '#f59e0b' : 'rgba(255,255,255,0.08)',
                          bgcolor: preferOnline === p.val ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.02)',
                          '&:hover': { borderColor: '#f59e0b' } }}>
                        <Typography sx={{ fontSize: '1.4rem', mb: 0.8 }}>{p.icon}</Typography>
                        <Typography sx={{ fontWeight: 800, color: preferOnline === p.val ? '#fbbf24' : 'rgba(255,255,255,0.6)', fontSize: '0.88rem' }}>{p.label}</Typography>
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button onClick={() => setStep(1)} sx={{ color: 'rgba(255,255,255,0.45)', textTransform: 'none', fontWeight: 700 }}>← Back</Button>
                    <Button variant="contained" endIcon={<ChevronRight size={18} />} onClick={() => setStep(3)}
                      sx={{ borderRadius: '14px', px: 3.5, py: 1.4, fontWeight: 800, textTransform: 'none', fontSize: '0.95rem', bgcolor: color, '&:hover': { bgcolor: STEP_COLORS[2] } }}>
                      Continue
                    </Button>
                  </Box>
                </Box>
              )}

              {/* ── STEP 3 — Study Style ── */}
              {step === 3 && (
                <Box>
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.88rem', mb: 2.5, lineHeight: 1.6 }}>
                    Pick the method that sets your brain on fire.
                  </Typography>

                  <Grid container spacing={1.5} sx={{ mb: 3 }}>
                    {STYLES.map((s) => {
                      const sel = studyStyle === s.key;
                      return (
                        <Grid item xs={6} sm={4} key={s.key}>
                          <Box onClick={() => setStudyStyle(s.key)}
                            sx={{ p: 2, borderRadius: '16px', border: '2px solid', cursor: 'pointer', transition: 'all .2s', textAlign: 'center',
                              borderColor: sel ? '#10b981' : 'rgba(255,255,255,0.08)',
                              bgcolor: sel ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)',
                              '&:hover': { borderColor: '#10b981', transform: 'translateY(-2px)' } }}>
                            <Typography sx={{ fontSize: '1.4rem', mb: 0.8 }}>{s.emoji}</Typography>
                            <Typography sx={{ fontWeight: 800, color: sel ? '#34d399' : 'white', fontSize: '0.82rem', mb: 0.3 }}>{s.key}</Typography>
                            <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.35)' }}>{s.desc}</Typography>
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>

                  {/* social proof nudge */}
                  <Box sx={{ bgcolor: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '16px', p: 2, mb: 3, textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '1.2rem', mb: 0.5 }}>🔥</Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem', lineHeight: 1.5 }}>
                      You're about to join <strong style={{ color: '#34d399' }}>50,000+</strong> students already in the network.
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button onClick={() => setStep(2)} sx={{ color: 'rgba(255,255,255,0.45)', textTransform: 'none', fontWeight: 700 }}>← Back</Button>
                    <Button variant="contained" disabled={loading} onClick={handleFinish} endIcon={<Sparkles size={18} />}
                      sx={{ borderRadius: '14px', px: 3.5, py: 1.4, fontWeight: 800, textTransform: 'none', fontSize: '0.95rem',
                        bgcolor: '#10b981', boxShadow: '0 8px 24px rgba(16,185,129,0.3)',
                        '&:hover': { bgcolor: '#059669' }, '&.Mui-disabled': { opacity: 0.4 } }}>
                      {loading ? 'Igniting...' : '🔥 Ignite My Profile'}
                    </Button>
                  </Box>
                </Box>
              )}

            </Box>
          </motion.div>
        </AnimatePresence>

        <Typography sx={{ textAlign: 'center', mt: 2.5, fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)' }}>
          You can update these anytime from your profile settings.
        </Typography>
      </Box>
    </Box>
  );
}
