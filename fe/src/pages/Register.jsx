import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building, ArrowRight, PersonStanding, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { Box, Button, Container, TextField, Typography, Link, InputAdornment, IconButton, CircularProgress, Autocomplete } from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock, Person } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import Logo from '../components/Logo';

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
  '& .MuiInputLabel-root.Mui-focused': { color: '#10b981' },
  '& .MuiAutocomplete-endAdornment .MuiIconButton-root': { color: 'rgba(255,255,255,0.5)' }
};

export default function Register() {
  const [step, setStep] = useState(1);
  const [joinType, setJoinType] = useState(null); // 'institution' | 'global'
  
  // HipoLabs Async Search
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState(null);
  
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();

  // Search Debounce Effect
  useEffect(() => {
    if (joinType !== 'institution' || searchTerm.length < 3) {
      setOptions([]);
      return;
    }
    
    setSearchLoading(true);
    const delayDebounceFn = setTimeout(() => {
      fetch(`http://universities.hipolabs.com/search?country=India&name=${encodeURIComponent(searchTerm)}`)
        .then(res => res.json())
        .then(data => {
          // Keep only first 20 results to avoid massive lists, and ensure uniqueness
          const uniqueData = Array.from(new Map(data.map(item => [item.name, item])).values()).slice(0, 20);
          setOptions(uniqueData);
          setSearchLoading(false);
        })
        .catch(err => {
          console.error(err);
          setSearchLoading(false);
        });
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, joinType]);


  const handleNextStep = (e) => {
    e.preventDefault();
    if (joinType === 'institution' && !selectedCollege) {
      return toast.error('Please search and select an institution');
    }
    setStep(2);
  };

  const getPayload = () => {
    return {
      isGlobalUser: joinType === 'global',
      collegeData: joinType === 'institution' && selectedCollege ? {
        name: selectedCollege.name,
        domain: selectedCollege.domains[0] || 'Unknown Domain'
      } : undefined
    };
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const payload = { credential: credentialResponse.credential, ...getPayload() };
      const data = await googleLogin(payload);
      if (data.user?.verificationStatus === 'PENDING') {
        toast.error('Account pending manual approval from your institution.');
        navigate('/pending');
      } else {
        toast.success('Account accessed! Welcome to the network.');
        navigate('/onboarding');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google Auth failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        ...getPayload()
      };
      
      const data = await register(payload);
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

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#020617', p: 2, position: 'relative', overflow: 'hidden' }}>
      
      {/* Background Orbs */}
      <Box sx={{ position: 'absolute', top: '10%', right: '-5%', width: 500, height: 500, bgcolor: 'rgba(16, 185, 129, 0.15)', borderRadius: '50%', filter: 'blur(100px)', zIndex: 0 }} />
      <Box sx={{ position: 'absolute', bottom: '-10%', left: '-5%', width: 500, height: 500, bgcolor: 'rgba(99, 102, 241, 0.1)', borderRadius: '50%', filter: 'blur(100px)', zIndex: 0 }} />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 10 }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 120, damping: 20 }}>
          <Box sx={{ 
            p: { xs: 4, sm: 5 }, borderRadius: '32px', backdropFilter: 'blur(24px)', 
            bgcolor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                  <Logo size={64} showText={false} />
                </Box>
              </motion.div>
              <Typography component="h1" variant="h4" sx={{ fontWeight: 900, color: 'white', letterSpacing: '-1px', mb: 1, textAlign: 'center' }}>
                {step === 1 ? 'Choose Your Path' : 'Create Account'}
              </Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.5)" textAlign="center">
                {step === 1 
                  ? 'Join an exclusive Walled Garden or register as a general user.' 
                  : (joinType === 'institution' && selectedCollege ? `Registering for ${selectedCollege.name}` : 'Create your credentials.')
                }
              </Typography>
            </Box>

            {step === 1 && (
              <motion.form variants={staggerContainer} initial="hidden" animate="visible" onSubmit={handleNextStep}>
                
                <Box sx={{ display: 'flex', gap: 2, mb: 4, flexDirection: { xs: 'column', sm: 'row' } }}>
                  {/* Institution Selection */}
                  <Box 
                    onClick={() => { setJoinType('institution'); setSelectedCollege(null); setSearchTerm(''); }}
                    sx={{
                      flex: 1, p: 3, borderRadius: 4, border: '2px solid',
                      borderColor: joinType === 'institution' ? '#10b981' : 'rgba(255,255,255,0.1)',
                      bgcolor: joinType === 'institution' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.02)',
                      cursor: 'pointer', transition: 'all 0.2s ease', 
                      '&:hover': { borderColor: joinType === 'institution' ? '#10b981' : 'rgba(255,255,255,0.3)' }
                    }}
                  >
                    <Building size={32} color={joinType === 'institution' ? '#10b981' : 'rgba(255,255,255,0.5)'} style={{ marginBottom: 12 }} />
                    <Typography variant="subtitle1" fontWeight={700} color="white">Join Institution</Typography>
                    <Typography variant="body2" color="rgba(255,255,255,0.5)">Access your university's exclusive network.</Typography>
                  </Box>
                  
                  {/* Global User Selection */}
                  <Box 
                    onClick={() => setJoinType('global')}
                    sx={{
                      flex: 1, p: 3, borderRadius: 4, border: '2px solid',
                      borderColor: joinType === 'global' ? '#6366f1' : 'rgba(255,255,255,0.1)',
                      bgcolor: joinType === 'global' ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255,255,255,0.02)',
                      cursor: 'pointer', transition: 'all 0.2s ease',
                      '&:hover': { borderColor: joinType === 'global' ? '#6366f1' : 'rgba(255,255,255,0.3)' }
                    }}
                  >
                    <PersonStanding size={32} color={joinType === 'global' ? '#818cf8' : 'rgba(255,255,255,0.5)'} style={{ marginBottom: 12 }} />
                    <Typography variant="subtitle1" fontWeight={700} color="white">General User</Typography>
                    <Typography variant="body2" color="rgba(255,255,255,0.5)">Join the global, open public network.</Typography>
                  </Box>
                </Box>

                <AnimatePresence>
                  {joinType === 'institution' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                      <Autocomplete
                        options={options}
                        getOptionLabel={(option) => option.name}
                        filterOptions={(x) => x} // Disable local filter, API does it
                        loading={searchLoading}
                        value={selectedCollege}
                        onChange={(event, newValue) => setSelectedCollege(newValue)}
                        onInputChange={(event, newInputValue) => setSearchTerm(newInputValue)}
                        noOptionsText={searchTerm.length < 3 ? "Type at least 3 characters..." : "No universities found"}
                        renderOption={(props, option) => (
                          <li {...props} style={{ backgroundColor: '#1e293b', color: 'white', padding: '12px' }}>
                            <Box>
                              <Typography variant="subtitle2">{option.name}</Typography>
                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{option.domains[0]}</Typography>
                            </Box>
                          </li>
                        )}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Search Indian Universities"
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <React.Fragment>
                                  {searchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                  {params.InputProps.endAdornment}
                                </React.Fragment>
                              ),
                              startAdornment: <InputAdornment position="start"><Search size={20} color="rgba(255,255,255,0.5)" /></InputAdornment>
                            }}
                            sx={{ ...inputStyles, mb: 4 }}
                          />
                        )}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div variants={popIn} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit" fullWidth variant="contained" disabled={!joinType || (joinType === 'institution' && !selectedCollege)}
                    endIcon={<ArrowRight />}
                    sx={{ 
                      mb: 4, py: 1.5, fontSize: '1.1rem', textTransform: 'none', fontWeight: 800, borderRadius: '100px',
                      bgcolor: joinType === 'global' ? '#6366f1' : '#10b981', 
                      color: joinType === 'global' ? 'white' : '#020617', 
                      '&:hover': { bgcolor: joinType === 'global' ? '#4f46e5' : '#059669' },
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
              <motion.div variants={staggerContainer} initial="hidden" animate="visible">
                <motion.div variants={popIn}>
                  <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => toast.error('Google Sign-up failed')}
                      theme="filled_black"
                      shape="pill"
                      size="large"
                      text="signup_with"
                      width="310"
                    />
                  </Box>
                </motion.div>
                
                <motion.div variants={popIn}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ flex: 1, height: '1px', bgcolor: 'rgba(255,255,255,0.1)' }} />
                    <Typography sx={{ mx: 2, color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 600 }}>OR</Typography>
                    <Box sx={{ flex: 1, height: '1px', bgcolor: 'rgba(255,255,255,0.1)' }} />
                  </Box>
                </motion.div>

                <form onSubmit={handleSubmit}>
                  {joinType === 'institution' && selectedCollege && (
                    <motion.div variants={popIn}>
                      <Box sx={{ mb: 3, p: 2, borderRadius: '12px', bgcolor: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                        <Typography variant="caption" sx={{ color: '#818cf8', display: 'block' }}>
                          <strong>Tip:</strong> Register with your official college email (e.g. <em>@{selectedCollege.domains[0]}</em>) for instant auto-approval. Personal emails require manual verification.
                        </Typography>
                      </Box>
                    </motion.div>
                  )}

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
                        bgcolor: joinType === 'global' ? '#6366f1' : '#10b981', 
                        color: joinType === 'global' ? 'white' : '#020617', 
                        '&:hover': { bgcolor: joinType === 'global' ? '#4f46e5' : '#059669' },
                        '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }
                      }}
                    >
                      {loading ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </motion.div>
                  
                  <Box sx={{ textAlign: 'center' }}>
                    <Button onClick={() => setStep(1)} sx={{ color: 'rgba(255,255,255,0.6)', textTransform: 'none' }}>
                      &larr; Back to Path select
                    </Button>
                  </Box>
                </form>
              </motion.div>
            )}
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}
