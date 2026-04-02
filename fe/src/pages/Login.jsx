import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Box, Button, Container, TextField, Typography, Link,
  InputAdornment, IconButton, Divider,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock, Security } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';

/* ─── animated key SVG ─── */
const KeyIcon = () => (
  <svg viewBox="0 0 120 120" width="64" height="64">
    <defs>
      <linearGradient id="kg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a78bfa" />
        <stop offset="100%" stopColor="#7c3aed" />
      </linearGradient>
    </defs>
    <motion.circle cx="48" cy="48" r="28" fill="none" stroke="url(#kg)" strokeWidth="8"
      animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2.5, repeat: Infinity }} />
    <motion.circle cx="48" cy="48" r="10" fill="rgba(139,92,246,0.25)"
      animate={{ r: [10, 12, 10] }} transition={{ duration: 2, repeat: Infinity }} />
    <rect x="70" y="44" width="44" height="8" rx="4" fill="url(#kg)" />
    <rect x="96" y="52" width="8" height="14" rx="3" fill="url(#kg)" />
    <rect x="108" y="52" width="8" height="11" rx="3" fill="url(#kg)" />
  </svg>
);

const inputSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: 'rgba(255,255,255,0.03)', color: 'white', borderRadius: '14px',
    '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
    '&:hover fieldset': { borderColor: 'rgba(139,92,246,0.4)' },
    '&.Mui-focused fieldset': { borderColor: '#7c3aed', borderWidth: 2 },
  },
  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.45)' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#a78bfa' },
  mb: 2,
};

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      if (data.user?.verificationStatus === 'PENDING') {
        toast.error('Your account is pending organizational approval.');
        navigate('/pending');
      } else {
        toast.success('Access granted. Welcome back.');
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Authentication failed');
    } finally { setLoading(false); }
  };

  const handleGoogle = async (cr) => {
    setLoading(true);
    try {
      const data = await googleLogin({ credential: cr.credential });
      if (data.user?.verificationStatus === 'PENDING') {
        toast.error('Pending approval.'); navigate('/pending');
      } else {
        toast.success('Access granted.'); navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google auth failed');
    } finally { setLoading(false); }
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', bgcolor: '#07080f',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Ambient glows */}
      <Box sx={{ position: 'absolute', top: '10%', right: '15%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,58,237,0.18),transparent 70%)', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', bottom: '10%', left: '5%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(16,185,129,0.07),transparent 70%)', pointerEvents: 'none' }} />
      {/* grid */}
      <Box sx={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(124,58,237,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,0.03) 1px,transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none', zIndex: 0 }} />

      {/* LEFT PANEL */}
      <Box sx={{ display: { xs: 'none', lg: 'flex' }, flex: '0 0 44%', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 6, position: 'relative', zIndex: 1, borderRight: '1px solid rgba(255,255,255,0.04)' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <Box sx={{ textAlign: 'center', maxWidth: 380 }}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                <KeyIcon />
              </motion.div>
            </Box>
            <Typography sx={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 'clamp(1.8rem,3vw,2.8rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', mb: 2 }}>
              <Box component="span" sx={{ background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Unlock</Box>
              {' '}your<br />study network.
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.95rem', lineHeight: 1.7, mb: 4 }}>
              Every session, every connection, every breakthrough — waiting on the other side.
            </Typography>
            {['50,000+ active students', 'AI-matched study partners', 'Real-time collaboration'].map((t) => (
              <Box key={t} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: 'rgba(16,185,129,0.15)', border: '1px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="10" height="10" fill="none" stroke="#10b981" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
                </Box>
                <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.88rem' }}>{t}</Typography>
              </Box>
            ))}
          </Box>
        </motion.div>
      </Box>

      {/* RIGHT PANEL — form */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, position: 'relative', zIndex: 1 }}>
        <Container maxWidth="xs">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>

            {/* step badge */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 0.6, borderRadius: 9999, bgcolor: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', mb: 2 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10b981', animation: 'pulse 2s infinite' }} />
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#a78bfa', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Step 1 of 3 — Unlock</Typography>
              </Box>
              <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(1.5)}}`}</style>
              <Typography variant="h4" sx={{ fontWeight: 900, color: 'white', letterSpacing: '-0.03em', mb: 1 }}>Welcome back</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem' }}>Re-enter the network. Your study squads await.</Typography>
            </Box>

            {/* card */}
            <Box sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '24px', p: { xs: 3, sm: 4 }, backdropFilter: 'blur(24px)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>

              {/* Google */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2.5 }}>
                <GoogleLogin onSuccess={handleGoogle} onError={() => toast.error('Google Sign In failed')}
                  theme="filled_black" shape="pill" size="large" text="continue_with" width="320" />
              </Box>

              <Divider sx={{ mb: 2.5, '&::before,&::after': { borderColor: 'rgba(255,255,255,0.08)' } }}>
                <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600, px: 1 }}>OR</Typography>
              </Divider>

              <form onSubmit={handleSubmit}>
                <TextField fullWidth required label="Email address" type="email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 18 }} /></InputAdornment> }}
                  sx={inputSx} />

                <TextField fullWidth required label="Password" type={showPwd ? 'text' : 'password'} value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Lock sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 18 }} /></InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPwd(!showPwd)} edge="end" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                          {showPwd ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={inputSx} />

                <Box sx={{ textAlign: 'right', mt: -1, mb: 3 }}>
                  <Link component={RouterLink} to="/forgot-password"
                    sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#a78bfa', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                    Forgot password?
                  </Link>
                </Box>

                <Button type="submit" fullWidth disabled={loading} variant="contained"
                  sx={{ py: 1.6, borderRadius: '14px', fontWeight: 800, fontSize: '1rem', textTransform: 'none', mb: 2.5, background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', boxShadow: '0 8px 24px rgba(124,58,237,0.35)', '&:hover': { background: 'linear-gradient(135deg,#6d28d9,#4c1d95)', boxShadow: '0 12px 32px rgba(124,58,237,0.45)' }, '&.Mui-disabled': { opacity: 0.5 } }}>
                  {loading ? 'Authenticating...' : 'Unlock Access →'}
                </Button>
              </form>

              <Typography sx={{ textAlign: 'center', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
                No account?{' '}
                <Link component={RouterLink} to="/register" sx={{ fontWeight: 700, color: '#10b981', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                  Create one free
                </Link>
              </Typography>
            </Box>

            {/* Institution login */}
            <Box sx={{ textAlign: 'center', mt: 2.5 }}>
              <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                <Security sx={{ fontSize: 13 }} />
                Institution Admin?{' '}
                <Link component={RouterLink} to="/org-admin-login" sx={{ fontWeight: 600, color: '#f87171', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                  Access Portal
                </Link>
              </Typography>
            </Box>
          </motion.div>
        </Container>
      </Box>
    </Box>
  );
}
