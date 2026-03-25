import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography, Container, InputAdornment, IconButton, CircularProgress } from '@mui/material';
import { Email, Lock, Visibility, VisibilityOff, Security } from '@mui/icons-material';
import { motion } from 'framer-motion';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from './context/AuthContext';

export default function OrgAdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/admin/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      setUser(data.user);
      toast.success('Admin Protocol Authenticated.');
      navigate('/org-admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Access Denied. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0f172a' }}>
      <Container maxWidth="xs">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Box sx={{ p: 4, borderRadius: 4, bgcolor: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
              <Box sx={{ p: 2, borderRadius: '50%', bgcolor: 'rgba(239, 68, 68, 0.1)', mb: 2 }}>
                <Security sx={{ fontSize: 40, color: '#ef4444' }} />
              </Box>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase' }}>
                Institution Portal
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', mt: 1 }}>
                Authorized Organization Admins Only
              </Typography>
            </Box>

            <form onSubmit={handleLogin}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Admin Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Email sx={{ color: 'rgba(255,255,255,0.3)' }} /></InputAdornment>,
                }}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    bgcolor: 'rgba(0,0,0,0.2)',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                    '&.Mui-focused fieldset': { borderColor: '#ef4444' },
                  }
                }}
              />

              <TextField
                fullWidth
                variant="outlined"
                type={showPassword ? 'text' : 'password'}
                placeholder="Secure Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Lock sx={{ color: 'rgba(255,255,255,0.3)' }} /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: 'rgba(255,255,255,0.3)' }}>
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{
                  mb: 4,
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    bgcolor: 'rgba(0,0,0,0.2)',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                    '&.Mui-focused fieldset': { borderColor: '#ef4444' },
                  }
                }}
              />

              <Button
                fullWidth
                type="submit"
                disabled={loading || !email || !password}
                variant="contained"
                disableElevation
                sx={{
                  py: 1.5,
                  bgcolor: '#ef4444',
                  fontWeight: 800,
                  letterSpacing: '1px',
                  '&:hover': { bgcolor: '#dc2626' },
                  '&.Mui-disabled': { bgcolor: 'rgba(239, 68, 68, 0.3)', color: 'rgba(255,255,255,0.3)' }
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'AUTHENTICATE'}
              </Button>
            </form>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}
