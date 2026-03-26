import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Calendar, Lightbulb, ChevronRight, CheckCircle2, Sparkles } from 'lucide-react';
import { Box, Typography, Button, TextField, Grid, IconButton, useTheme } from '@mui/material';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import toast from 'react-hot-toast';

function TiltCard({ children, sx, className }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["3deg", "-3deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-3deg", "3deg"]);

  return (
    <motion.div
      className={className}
      style={{ rotateX, rotateY, perspective: 1000, height: '100%' }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - rect.left) / rect.width - 0.5);
        y.set((e.clientY - rect.top) / rect.height - 0.5);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
    >
      <Box sx={{ 
        bgcolor: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.05)', borderRadius: '32px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)', overflow: 'hidden', height: '100%', ...sx 
      }}>
        {children}
      </Box>
    </motion.div>
  );
}

export default function Onboarding() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [subjects, setSubjects] = useState('');
  const [availability, setAvailability] = useState([]);
  const [studyStyle, setStudyStyle] = useState('Mixed');
  const [preferOnline, setPreferOnline] = useState(true);

  const handleNext = () => setStep(s => s + 1);

  const toggleDay = (day) => {
    if (availability.find(a => a.day === day)) {
      setAvailability(availability.filter(a => a.day !== day));
    } else {
      setAvailability([...availability, { day, startTime: '09:00', endTime: '17:00' }]);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const subjectArray = subjects.split(',').map(s => s.trim()).filter(Boolean);
      const res = await api.put('/users/profile', {
        subjects: subjectArray,
        availability,
        studyStyle,
        preferOnline
      });
      updateUser(res.data);
      toast.success('Onboarding complete!');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Failed to save profile details');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { title: 'Subjects', icon: <BookOpen />, id: 1 },
    { title: 'Availability', icon: <Calendar />, id: 2 },
    { title: 'Study Style', icon: <Lightbulb />, id: 3 },
  ];

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4, bgcolor: '#020617', backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.15) 0%, transparent 50%)' }}>
      
      <Box sx={{ width: '100%', maxWidth: 700 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '20px', bgcolor: 'rgba(99, 102, 241, 0.1)', mb: 3 }}>
            <Sparkles size={32} color="#818cf8" />
          </Box>
          <Typography variant="h3" fontWeight="900" color="white" mb={1} sx={{ letterSpacing: '-1px' }}>
            Welcome to StudyFriend
          </Typography>
          <Typography variant="h6" color="rgba(255,255,255,0.5)">
            Let's tune your experience.
          </Typography>
        </Box>

        <TiltCard sx={{ p: { xs: 4, md: 6 } }}>
          {/* Progress Indicators */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 6, position: 'relative' }}>
            <Box sx={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: 2, bgcolor: 'rgba(255,255,255,0.05)', zIndex: 0, transform: 'translateY(-50%)' }} />
            <Box sx={{ position: 'absolute', top: '50%', left: 0, height: 2, bgcolor: '#6366f1', zIndex: 0, transform: 'translateY(-50%)', transition: 'width 0.4s ease', width: `${(step - 1) * 50}%` }} />
            
            {steps.map((s) => (
              <Box key={s.id} sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <Box onClick={() => s.id < step && setStep(s.id)} sx={{ width: 40, height: 40, borderRadius: 'full', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease', cursor: s.id < step ? 'pointer' : 'default', bgcolor: step >= s.id ? '#6366f1' : '#0f172a', border: '2px solid', borderColor: step >= s.id ? '#6366f1' : 'rgba(255,255,255,0.1)', color: step >= s.id ? 'white' : 'rgba(255,255,255,0.3)' }}>
                  {step > s.id ? <CheckCircle2 size={20} /> : <Typography fontWeight="800">{s.id}</Typography>}
                </Box>
                <Typography variant="caption" fontWeight="700" color={step >= s.id ? 'white' : 'rgba(255,255,255,0.3)'}>{s.title}</Typography>
              </Box>
            ))}
          </Box>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <Typography variant="h5" fontWeight="800" color="white" mb={1} display="flex" alignItems="center" gap={1.5}>
                  <BookOpen size={24} color="#6366f1" /> What do you study?
                </Typography>
                <Typography color="rgba(255,255,255,0.5)" mb={4}>Enter your subjects separated by commas. Our AI uses this to match you.</Typography>
                
                <TextField 
                  fullWidth autoFocus placeholder="e.g. Calculus, Physics, Machine Learning..." 
                  value={subjects} onChange={e => setSubjects(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && subjects.trim() && handleNext()}
                  sx={{ 
                    input: { color: 'white', fontSize: '1.1rem', py: 2 }, 
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255,255,255,0.03)', borderRadius: '16px',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                      '&.Mui-focused fieldset': { borderColor: '#6366f1' },
                    }
                  }} 
                />
                
                <Box mt={4} display="flex" justifyContent="flex-end">
                  <Button variant="contained" onClick={handleNext} disabled={!subjects.trim()} sx={{ borderRadius: '100px', px: 4, py: 1.5, bgcolor: '#6366f1', textTransform: 'none', fontWeight: 800, fontSize: '1rem', '&:hover': { bgcolor: '#4f46e5' } }} endIcon={<ChevronRight />}>
                    Continue
                  </Button>
                </Box>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <Typography variant="h5" fontWeight="800" color="white" mb={1} display="flex" alignItems="center" gap={1.5}>
                  <Calendar size={24} color="#10b981" /> When are you available?
                </Typography>
                <Typography color="rgba(255,255,255,0.5)" mb={4}>Select the days you typically dedicate to studying.</Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 5 }}>
                  {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(day => {
                    const active = availability.some(a => a.day === day);
                    return (
                      <Button 
                        key={day} onClick={() => toggleDay(day)}
                        variant={active ? 'contained' : 'outlined'}
                        sx={{ 
                          borderRadius: '100px', textTransform: 'none', fontWeight: 700, px: 3, py: 1,
                          bgcolor: active ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                          color: active ? '#10b981' : 'rgba(255,255,255,0.5)',
                          borderColor: active ? '#10b981' : 'rgba(255,255,255,0.1)',
                          '&:hover': { borderColor: '#10b981', bgcolor: 'rgba(16, 185, 129, 0.05)' }
                        }}
                      >
                        {day}
                      </Button>
                    );
                  })}
                </Box>

                <Typography variant="h6" fontWeight="700" color="white" mb={2}>Session Preference</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {[
                    { label: 'Online First', value: true, desc: 'Virtual rooms' },
                    { label: 'In-Person', value: false, desc: 'Local coffee shops' }
                  ].map((pref) => (
                    <Box 
                      key={pref.label} onClick={() => setPreferOnline(pref.value)}
                      sx={{ 
                        flex: 1, p: 3, borderRadius: '20px', cursor: 'pointer', transition: 'all 0.2s',
                        border: '2px solid', borderColor: preferOnline === pref.value ? '#6366f1' : 'rgba(255,255,255,0.05)',
                        bgcolor: preferOnline === pref.value ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255,255,255,0.02)'
                      }}
                    >
                      <Typography fontWeight="800" color="white">{pref.label}</Typography>
                      <Typography variant="body2" color="rgba(255,255,255,0.5)">{pref.desc}</Typography>
                    </Box>
                  ))}
                </Box>

                <Box mt={5} display="flex" justifyContent="space-between">
                  <Button onClick={() => setStep(1)} sx={{ color: 'rgba(255,255,255,0.5)', textTransform: 'none', fontWeight: 700 }}>Back</Button>
                  <Button variant="contained" onClick={handleNext} sx={{ borderRadius: '100px', px: 4, py: 1.5, bgcolor: '#6366f1', textTransform: 'none', fontWeight: 800, fontSize: '1rem', '&:hover': { bgcolor: '#4f46e5' } }} endIcon={<ChevronRight />}>
                    Continue
                  </Button>
                </Box>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <Typography variant="h5" fontWeight="800" color="white" mb={1} display="flex" alignItems="center" gap={1.5}>
                  <Lightbulb size={24} color="#f59e0b" /> What is your study style?
                </Typography>
                <Typography color="rgba(255,255,255,0.5)" mb={4}>Select the method that works best for your brain.</Typography>
                
                <Grid container spacing={2}>
                  {['Visual', 'Auditory', 'Reading/Writing', 'Kinesthetic', 'Mixed', 'Pomodoro'].map(style => (
                    <Grid item xs={6} sm={4} key={style}>
                      <Box 
                        onClick={() => setStudyStyle(style)}
                        sx={{ 
                          p: 3, textAlign: 'center', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.2s',
                          border: '2px solid', borderColor: studyStyle === style ? '#f59e0b' : 'rgba(255,255,255,0.05)',
                          bgcolor: studyStyle === style ? 'rgba(245, 158, 11, 0.05)' : 'rgba(255,255,255,0.02)',
                          '&:hover': { borderColor: studyStyle === style ? '#f59e0b' : 'rgba(255,255,255,0.2)' }
                        }}
                      >
                        <Typography fontWeight="700" color={studyStyle === style ? '#f59e0b' : 'white'}>{style}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>

                <Box mt={6} display="flex" justifyContent="space-between">
                  <Button onClick={() => setStep(2)} sx={{ color: 'rgba(255,255,255,0.5)', textTransform: 'none', fontWeight: 700 }}>Back</Button>
                  <Button variant="contained" onClick={handleFinish} disabled={loading} sx={{ borderRadius: '100px', px: 4, py: 1.5, bgcolor: '#10b981', color: '#064e3b', textTransform: 'none', fontWeight: 900, fontSize: '1rem', '&:hover': { bgcolor: '#059669', color: 'white' } }} endIcon={<Sparkles />}>
                    {loading ? 'Finalizing...' : 'Complete Profile'}
                  </Button>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
        </TiltCard>
      </Box>
    </Box>
  );
}
