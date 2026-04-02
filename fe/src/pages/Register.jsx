import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building, PersonStanding, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Box, Button, Container, TextField, Typography, Link,
  InputAdornment, IconButton, Divider,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock, Person } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import InstitutionSelect from '../components/InstitutionSelect';

const inputSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: 'rgba(255,255,255,0.03)', color: 'white', borderRadius: '14px',
    '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
    '&:hover fieldset': { borderColor: 'rgba(16,185,129,0.4)' },
    '&.Mui-focused fieldset': { borderColor: '#10b981', borderWidth: 2 },
  },
  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.45)' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#10b981' },
  mb: 2,
};

/* compass SVG for Create panel */
const CompassIcon = () => (
  <svg viewBox="0 0 120 120" width="64" height="64">
    <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(16,185,129,0.2)" strokeWidth="2" strokeDasharray="8 4" />
    <motion.circle cx="60" cy="60" r="38" fill="none" stroke="rgba(16,185,129,0.3)" strokeWidth="3"
      animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 2.5, repeat: Infinity }} />
    <defs>
      <linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34d399" /><stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    <motion.polygon points="60,16 66,54 60,60 54,54" fill="url(#cg)"
      animate={{ rotate: [0, 5, 0, -5, 0] }} transition={{ duration: 3.5, repeat: Infinity }}
      style={{ originX: '60px', originY: '60px' }} />
    <motion.polygon points="60,104 54,66 60,60 66,66" fill="#f97316" opacity="0.8"
      animate={{ rotate: [0, 5, 0, -5, 0] }} transition={{ duration: 3.5, repeat: Infinity }}
      style={{ originX: '60px', originY: '60px' }} />
    <circle cx="60" cy="60" r="7" fill="url(#cg)" />
  </svg>
);

const StepDot = ({ n, label, active, done, color }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
    <Box sx={{
      width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      bgcolor: done || active ? `${color}20` : 'rgba(255,255,255,0.04)',
      border: `2px solid ${done || active ? color : 'rgba(255,255,255,0.1)'}`,
      color: done || active ? color : 'rgba(255,255,255,0.3)', fontWeight: 800, fontSize: '0.85rem', transition: 'all .3s',
    }}>
      {done ? <svg width="14" height="14" fill="none" stroke={color} strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg> : n}
    </Box>
    <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: active ? color : 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</Typography>
  </Box>
);

export default function Register() {
  const [step, setStep] = useState(1);
  const [joinType, setJoinType] = useState(null);
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();

  const canProceed = joinType && (joinType === 'global' || selectedCollege);

  const getPayload = () => ({
    isGlobalUser: joinType === 'global',
    collegeData: joinType === 'institution' && selectedCollege
      ? { name: selectedCollege.name, domain: selectedCollege.domains?.[0] || 'Unknown' }
      : undefined,
  });

  const handleGoogle = async (cr) => {
    if (!joinType) return toast.error('Please choose your path first');
    setLoading(true);
    try {
      const data = await googleLogin({ credential: cr.credential, ...getPayload() });
      if (data.user?.verificationStatus === 'PENDING') { toast.error('Pending approval.'); navigate('/pending'); }
      else { toast.success('Account created! Welcome.'); navigate('/onboarding'); }
    } catch (err) { toast.error(err.response?.data?.message || 'Google auth failed'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const email = (joinType === 'institution' && selectedCollege?.domains?.[0])
        ? `${form.email.replace(/@.*/, '')}@${selectedCollege.domains[0]}`
        : form.email;
      const data = await register({ name: form.name, email, password: form.password, ...getPayload() });
      if (data.user?.verificationStatus === 'PENDING') { toast.error('Pending approval.'); navigate('/pending'); }
      else { toast.success('Account created!'); navigate('/onboarding'); }
    } catch (err) { toast.error(err.response?.data?.message || 'Registration failed'); }
    finally { setLoading(false); }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: '#07080f', position: 'relative', overflow: 'hidden' }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(1.5)}}`}</style>

      {/* glows */}
      <Box sx={{ position: 'absolute', top: '-10%', right: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(16,185,129,0.12),transparent 70%)', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', bottom: '5%', left: '5%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.08),transparent 70%)', pointerEvents: 'none' }} />
      <Box sx={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(16,185,129,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(16,185,129,0.02) 1px,transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none', zIndex: 0 }} />

      {/* LEFT */}
      <Box sx={{ display: { xs: 'none', lg: 'flex' }, flex: '0 0 44%', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 6, position: 'relative', zIndex: 1, borderRight: '1px solid rgba(255,255,255,0.04)' }}>
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
          <Box sx={{ textAlign: 'center', maxWidth: 360 }}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
              <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
                <CompassIcon />
              </motion.div>
            </Box>
            <Typography sx={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 'clamp(1.8rem,3vw,2.8rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', color: 'white', mb: 2 }}>
              <Box component="span" sx={{ background: 'linear-gradient(135deg,#34d399,#059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Create</Box>
              {' '}your<br />identity here.
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem', lineHeight: 1.7, mb: 4 }}>
              Your network, your rules. Build a study identity that matches your ambition.
            </Typography>

            {/* step indicators */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <StepDot n={1} label="Path" active={step === 1} done={step > 1} color="#10b981" />
              <Box sx={{ flex: 1, height: 2, maxWidth: 60, borderRadius: 99, bgcolor: step > 1 ? '#10b981' : 'rgba(255,255,255,0.08)', transition: 'all .5s' }} />
              <StepDot n={2} label="Creds" active={step === 2} done={false} color="#10b981" />
            </Box>
          </Box>
        </motion.div>
      </Box>

      {/* RIGHT */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, position: 'relative', zIndex: 1 }}>
        <Container maxWidth="sm">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>

            {/* badge */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 0.6, borderRadius: 9999, bgcolor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', mb: 2 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10b981', animation: 'pulse 2s infinite' }} />
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#34d399', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Step 2 of 3 — Create</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 900, color: 'white', letterSpacing: '-0.03em', mb: 0.5 }}>
                {step === 1 ? 'Choose your path' : 'Set your credentials'}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.88rem' }}>
                {step === 1 ? "Join an institution's walled garden or go global." : 'One last step — secure your account.'}
              </Typography>
            </Box>

            <Box sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '24px', p: { xs: 3, sm: 4 }, backdropFilter: 'blur(24px)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
              <AnimatePresence mode="wait">

                {/* STEP 1 */}
                {step === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
                      {[
                        { type: 'institution', Icon: Building, label: 'Join Institution', sub: 'University walled garden', color: '#10b981' },
                        { type: 'global', Icon: PersonStanding, label: 'General User', sub: 'Open public network', color: '#6366f1' },
                      ].map(({ type, Icon, label, sub, color }) => (
                        <Box key={type} onClick={() => { setJoinType(type); setSelectedCollege(null); }}
                          sx={{ flex: 1, p: 2.5, borderRadius: '20px', border: '2px solid', cursor: 'pointer', transition: 'all .25s',
                            borderColor: joinType === type ? color : 'rgba(255,255,255,0.08)',
                            bgcolor: joinType === type ? `${color}10` : 'rgba(255,255,255,0.02)',
                            '&:hover': { borderColor: color, transform: 'translateY(-3px)' },
                          }}>
                          <Icon size={28} color={joinType === type ? color : 'rgba(255,255,255,0.4)'} style={{ marginBottom: 10 }} />
                          <Typography fontWeight={800} color="white" fontSize="0.95rem" mb={0.4}>{label}</Typography>
                          <Typography fontSize="0.78rem" color="rgba(255,255,255,0.4)">{sub}</Typography>
                        </Box>
                      ))}
                    </Box>

                    <AnimatePresence>
                      {joinType === 'institution' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                          <Box sx={{ mb: 3 }}>
                            <InstitutionSelect value={selectedCollege} onChange={setSelectedCollege} sx={{
                              '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.04)', color: 'white', borderRadius: '14px',
                                '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                                '&:hover fieldset': { borderColor: 'rgba(16,185,129,0.4)' },
                                '&.Mui-focused fieldset': { borderColor: '#10b981' } },
                              '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.4)' },
                              '& .MuiInputLabel-root.Mui-focused': { color: '#10b981' },
                              '& .MuiAutocomplete-endAdornment .MuiIconButton-root': { color: 'rgba(255,255,255,0.5)' },
                            }} />
                          </Box>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Button fullWidth disabled={!canProceed} onClick={() => canProceed && setStep(2)} variant="contained" endIcon={<ArrowRight size={18} />}
                      sx={{ py: 1.6, borderRadius: '14px', fontWeight: 800, textTransform: 'none', fontSize: '1rem', mb: 2.5,
                        background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 8px 24px rgba(16,185,129,0.3)',
                        '&:hover': { background: 'linear-gradient(135deg,#059669,#047857)' },
                        '&.Mui-disabled': { opacity: 0.4 } }}>
                      Continue
                    </Button>

                    <Typography sx={{ textAlign: 'center', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
                      Already have an account?{' '}
                      <Link component={RouterLink} to="/login" sx={{ fontWeight: 700, color: '#a78bfa', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>Sign in</Link>
                    </Typography>
                  </motion.div>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                  <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2.5 }}>
                      <GoogleLogin onSuccess={handleGoogle} onError={() => toast.error('Google sign-up failed')}
                        theme="filled_black" shape="pill" size="large" text="signup_with" width="340" />
                    </Box>

                    <Divider sx={{ mb: 2.5, '&::before,&::after': { borderColor: 'rgba(255,255,255,0.08)' } }}>
                      <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600, px: 1 }}>OR</Typography>
                    </Divider>

                    {joinType === 'institution' && selectedCollege?.domains?.[0] && (
                      <Box sx={{ mb: 2.5, p: 1.5, borderRadius: '12px', bgcolor: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                        <Typography sx={{ fontSize: '0.78rem', color: '#a78bfa' }}>
                          <strong>Tip:</strong> Use <em>@{selectedCollege.domains[0]}</em> email for instant approval.
                        </Typography>
                      </Box>
                    )}

                    <form onSubmit={handleSubmit}>
                      <TextField fullWidth required label="Full name" value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 18 }} /></InputAdornment> }}
                        sx={inputSx} />
                      <TextField fullWidth required
                        label={joinType === 'institution' && selectedCollege?.domains?.[0] ? 'Email prefix' : 'Email address'}
                        value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><Email sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 18 }} /></InputAdornment>,
                          endAdornment: joinType === 'institution' && selectedCollege?.domains?.[0]
                            ? <InputAdornment position="end"><Typography sx={{ color: 'rgba(16,185,129,0.7)', fontSize: '0.78rem', fontWeight: 600 }}>@{selectedCollege.domains[0]}</Typography></InputAdornment>
                            : null,
                        }}
                        sx={inputSx} />
                      <TextField fullWidth required label="Password" type={showPwd ? 'text' : 'password'} value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><Lock sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 18 }} /></InputAdornment>,
                          endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPwd(!showPwd)} edge="end" sx={{ color: 'rgba(255,255,255,0.4)' }}>{showPwd ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}</IconButton></InputAdornment>,
                        }}
                        sx={inputSx} />
                      <TextField fullWidth required label="Confirm password" type={showConfirm ? 'text' : 'password'} value={form.confirm}
                        onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><Lock sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 18 }} /></InputAdornment>,
                          endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowConfirm(!showConfirm)} edge="end" sx={{ color: 'rgba(255,255,255,0.4)' }}>{showConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}</IconButton></InputAdornment>,
                        }}
                        sx={{ ...inputSx, mb: 3 }} />

                      <Button type="submit" fullWidth disabled={loading} variant="contained"
                        sx={{ py: 1.6, borderRadius: '14px', fontWeight: 800, textTransform: 'none', fontSize: '1rem', mb: 2,
                          background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 8px 24px rgba(16,185,129,0.3)',
                          '&:hover': { background: 'linear-gradient(135deg,#059669,#047857)' }, '&.Mui-disabled': { opacity: 0.4 } }}>
                        {loading ? 'Creating account...' : 'Create My Account →'}
                      </Button>
                    </form>

                    <Button onClick={() => setStep(1)} sx={{ color: 'rgba(255,255,255,0.45)', textTransform: 'none', fontSize: '0.83rem', fontWeight: 600 }}>
                      ← Back to path select
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </Box>
          </motion.div>
        </Container>
      </Box>
    </Box>
  );
}
