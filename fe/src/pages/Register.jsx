import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Globe, Building, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { Box, Button, Container, TextField, Typography, Link, InputAdornment, IconButton, MenuItem, CircularProgress } from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock, Person } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import api from '../api/axios';

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
};

const popIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

const inputStyles = {
  '& .MuiOutlinedInput-root': { 
    bgcolor: 'rgba(255,255,255,0.02)', color: 'white', borderRadius: 4, 
    '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
    '&.Mui-focused fieldset': { borderColor: '#10b981', borderWidth: 2 } 
  },
  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#10b981' }
};

export default function Register() {
  const [step, setStep] = useState(1);
  const [organizations, setOrganizations] = useState([]);
  const [orgLoading, setOrgLoading] = useState(true);
  
  const [form, setForm] = useState({ organizationId: '', name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/auth/organizations')
      .then(res => setOrganizations(res.data))
      .catch(err => toast.error('Failed to load institutions'))
      .finally(() => setOrgLoading(false));
  }, []);

  const handleNextStep = (e) => {
    e.preventDefault();
    if (!form.organizationId) return toast.error('Please select an institution');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const data = await register(form.name, form.email, form.password, form.organizationId);
      if (data.user?.verificationStatus === 'PENDING') {
        toast.error('Account pending approval by organization admin.');
        navigate('/pending');
      } else {
        toast.success('Account created! Welcome to the network.');
        navigate('/onboarding');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const selectedOrgObj = organizations.find(o => o._id === form.organizationId);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#020617', p: 2, position: 'relative', overflow: 'hidden' }}>
      
      {/* Background Orbs */}
      <Box sx={{ position: 'absolute', top: '10%', right: '-5%', width: 500, height: 500, bgcolor: 'rgba(16, 185, 129, 0.15)', borderRadius: '50%', filter: 'blur(100px)', zIndex: 0 }} />
      <Box sx={{ position: 'absolute', bottom: '-10%', left: '-5%', width: 500, height: 500, bgcolor: 'rgba(99, 102, 241, 0.1)', borderRadius: '50%', filter: 'blur(100px)', zIndex: 0 }} />

      <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 10 }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 120, damping: 20 }}>
          <Box sx={{ 
            p: { xs: 4, sm: 5 }, borderRadius: '32px', backdropFilter: 'blur(24px)', 
            bgcolor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
                <Box sx={{ width: 56, height: 56, borderRadius: '20px', bgcolor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                  <Globe size={32} color="#34d399" />
                </Box>
              </motion.div>
              <Typography component="h1" variant="h4" sx={{ fontWeight: 900, color: 'white', letterSpacing: '-1px', mb: 1 }}>
                {step === 1 ? 'Select Institution' : 'Create account'}
              </Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.5)" textAlign="center">
                {step === 1 
                  ? 'Join your exclusive Walled Garden network.' 
                  : (selectedOrgObj ? `Registering for ${selectedOrgObj.name}` : 'Create your credentials.')
                }
              </Typography>
            </Box>

            {step === 1 && (
              <motion.form variants={staggerContainer} initial="hidden" animate="visible" onSubmit={handleNextStep}>
                <motion.div variants={popIn}>
                  {orgLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                      <CircularProgress sx={{ color: '#10b981' }} />
                    </Box>
                  ) : (
                    <TextField
                      select margin="dense" required fullWidth id="organizationId" label="Choose Your Organization"
                      value={form.organizationId} onChange={e => setForm({ ...form, organizationId: e.target.value })}
                      InputProps={{ startAdornment: <InputAdornment position="start"><Building size={20} color="rgba(255,255,255,0.5)" /></InputAdornment> }}
                      sx={{ ...inputStyles, mb: 4 }}
                    >
                      {organizations.map((org) => (
                        <MenuItem key={org._id} value={org._id}>
                          {org.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                </motion.div>

                <motion.div variants={popIn} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit" fullWidth variant="contained" disabled={orgLoading}
                    endIcon={<ArrowRight />}
                    sx={{ 
                      mb: 4, py: 1.5, fontSize: '1.1rem', textTransform: 'none', fontWeight: 800, borderRadius: '100px',
                      bgcolor: '#10b981', color: '#020617', '&:hover': { bgcolor: '#059669' },
                      '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }
                    }}
                  >
                    Continue
                  </Button>
                </motion.div>
                
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="rgba(255,255,255,0.5)">
                    Already have an account?{' '}
                    <Link component={RouterLink} to="/login" sx={{ fontWeight: 700, color: '#818cf8', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                      Sign in
                    </Link>
                  </Typography>
                </Box>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form variants={staggerContainer} initial="hidden" animate="visible" onSubmit={handleSubmit}>
                <motion.div variants={popIn}>
                  <Box sx={{ mb: 3, p: 2, borderRadius: '12px', bgcolor: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                    <Typography variant="caption" sx={{ color: '#818cf8', display: 'block' }}>
                      <strong>Tip:</strong> Register with your official college email (e.g. <em>@{selectedOrgObj?.domain}</em>) for instant auto-approval. Personal emails require manual verification.
                    </Typography>
                  </Box>
                </motion.div>

                <motion.div variants={popIn}>
                  <TextField
                    margin="dense" required fullWidth id="name" label="Full Name" name="name"
                    autoComplete="name" autoFocus value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ color: 'rgba(255,255,255,0.5)' }} /></InputAdornment> }}
                    sx={{ ...inputStyles, mb: 2 }}
                  />
                </motion.div>
                
                <motion.div variants={popIn}>
                  <TextField
                    margin="dense" required fullWidth id="email" label="Email Address" name="email"
                    autoComplete="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ color: 'rgba(255,255,255,0.5)' }} /></InputAdornment> }}
                    sx={{ ...inputStyles, mb: 2 }}
                  />
                </motion.div>
                
                <motion.div variants={popIn}>
                  <TextField
                    margin="dense" required fullWidth name="password" label="Password"
                    type={showPassword ? 'text' : 'password'} id="password" autoComplete="new-password"
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><Lock sx={{ color: 'rgba(255,255,255,0.5)' }} /></InputAdornment>,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton aria-label="toggle password visibility" onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    sx={{ ...inputStyles, mb: 2 }}
                  />
                </motion.div>
                
                <motion.div variants={popIn}>
                  <TextField
                    margin="dense" required fullWidth name="confirmPassword" label="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'} id="confirmPassword"
                    value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><Lock sx={{ color: 'rgba(255,255,255,0.5)' }} /></InputAdornment>,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton aria-label="toggle password visibility" onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    sx={{ ...inputStyles, mb: 4 }}
                  />
                </motion.div>

                <motion.div variants={popIn} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit" fullWidth variant="contained" disabled={loading}
                    sx={{ 
                      mb: 2, py: 1.5, fontSize: '1.1rem', textTransform: 'none', fontWeight: 800, borderRadius: '100px',
                      bgcolor: '#10b981', color: '#020617', '&:hover': { bgcolor: '#059669' },
                      '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }
                    }}
                  >
                    {loading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </motion.div>
                
                <Box sx={{ textAlign: 'center' }}>
                  <Button onClick={() => setStep(1)} sx={{ color: 'rgba(255,255,255,0.6)', textTransform: 'none' }}>
                    &larr; Back to Institution select
                  </Button>
                </Box>
              </motion.form>
            )}
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}
