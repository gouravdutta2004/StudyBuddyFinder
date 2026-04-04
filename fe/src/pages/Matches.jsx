import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Avatar, Chip, IconButton, CircularProgress, useTheme } from '@mui/material';
import { Check, X, Sparkles, MapPin, BookOpen, Clock, Activity, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { DottedSurface } from '../components/ui/DottedSurface';

export default function Matches() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const { user } = useAuth();
  const navigate = useNavigate();

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users/matches');
      setMatches(res.data);
    } catch (err) {
      toast.error('Failed to calibrate the Discovery Engine.');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action, direction) => {
    if (actionLoading) return;
    
    // Check subscription limits before dispatching connection
    if (action === 'connect') {
      const isBasic = user?.subscription?.plan === 'basic';
      const connectionCount = user?.connections?.length || 0;
      
      if (isBasic && connectionCount >= 3) {
        toast((t) => (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body2" fontWeight={800}>Free limit reached! 🔒</Typography>
            <Typography variant="caption">You have 3 connections. Upgrade to Pro for unlimited networking!</Typography>
            <Button size="small" variant="contained" color="primary" onClick={() => { toast.dismiss(t.id); navigate('/billing'); }}>
              Upgrade Now
            </Button>
          </Box>
        ), { duration: 5000 });
        return; // Prevent swipe / action
      }
    }

    setActionLoading(true);
    
    // Optimistic UI Removal
    const processedMatch = matches.find(m => m._id === id);
    setMatches(prev => prev.filter(m => m._id !== id));

    try {
      if (action === 'connect') {
        await api.post(`/users/connect/${id}`);
        toast.success(`Connection request transmitted to ${processedMatch.name}!`, { icon: '✨' });
      } else {
        await api.post(`/users/matches/${id}/skip`);
        // Just quietly skip
      }
    } catch (err) {
      toast.error(`Action failed: ${err.response?.data?.message || 'Network error'}`);
      // Rollback
      setMatches(prev => [processedMatch, ...prev]);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress size={60} thickness={4} sx={{ color: '#8b5cf6' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, px: 2, position: 'relative', overflow: 'hidden', minHeight: '100vh' }}>
      {/* Dynamic Background */}
      <DottedSurface className="opacity-30" />
      <Box sx={{ position: 'fixed', top: '10%', left: '-10%', width: 500, height: 500, bgcolor: 'rgba(139, 92, 246, 0.1)', borderRadius: '50%', filter: 'blur(120px)', zIndex: 0, pointerEvents: 'none' }} />
      <Box sx={{ position: 'fixed', bottom: '-10%', right: '-10%', width: 500, height: 500, bgcolor: 'rgba(16, 185, 129, 0.05)', borderRadius: '50%', filter: 'blur(120px)', zIndex: 0, pointerEvents: 'none' }} />

      <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" fontWeight={900} color={isDark ? "white" : "#0f172a"} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, letterSpacing: '-1px' }}>
          <Sparkles color="#8b5cf6" size={36} /> Discovery Deck
        </Typography>
        <Typography variant="subtitle1" color={isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)"} fontWeight={500} mt={1}>
          Algorithmic matchmaking based on subjects, goals, and institutional alignment.
        </Typography>
      </Box>

      {/* Deck Container */}
      <Box sx={{ position: 'relative', width: '100%', maxWidth: 450, height: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
        
        {matches.length === 0 && (
          <Box component={motion.div} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} sx={{ textAlign: 'center', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
            <Box sx={{ p: 4, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', borderRadius: '50%', mb: 3, display: 'inline-block' }}>
              {user?.subscription?.plan === 'basic' ? <Briefcase size={48} color="#ef4444" /> : <Sparkles size={48} color={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"} />}
            </Box>
            {user?.subscription?.plan === 'basic' ? (
              <>
                <Typography variant="h5" fontWeight={800} color={isDark ? "white" : "#0f172a"}>Daily Limit Reached</Typography>
                <Typography variant="body1" mt={1} mb={3}>You've exhausted your free match pool. Upgrade to Pro to unlock unlimited Discovery and connect with high-consistency students.</Typography>
                <Button variant="contained" onClick={() => navigate('/billing')} sx={{ bgcolor: '#8b5cf6', fontWeight: 800 }}>Unlock Serious Mode</Button>
              </>
            ) : (
              <>
                <Typography variant="h5" fontWeight={800} color={isDark ? "white" : "#0f172a"}>You've seen everyone!</Typography>
                <Typography variant="body1" mt={1}>Expand your subjects or check back later for new prospective Study Buddies.</Typography>
              </>
            )}
          </Box>
        )}

        <AnimatePresence>
          {matches.slice(0, 3).reverse().map((u, index) => {
            const isTop = index === matches.slice(0, 3).length - 1;
            const isSent = user?.sentRequests?.some(r => typeof r === 'string' ? r === u._id : r._id === u._id) || user?.connections?.includes(u._id);

            return (
              <Box
                key={u._id}
                component={motion.div}
                drag={isTop ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={1}
                onDragEnd={(e, { offset, velocity }) => {
                  const swipe = offset.x;
                  if (swipe < -100) {
                    handleAction(u._id, 'skip', 'left');
                  } else if (swipe > 100) {
                    handleAction(u._id, 'connect', 'right');
                  }
                }}
                initial={{ scale: 0.95, y: -20, opacity: 0 }}
                animate={{ scale: isTop ? 1 : 1 - (matches.slice(0, 3).length - 1 - index) * 0.05, y: isTop ? 0 : (matches.slice(0, 3).length - 1 - index) * -20, opacity: isTop ? 1 : 0.8 }}
                exit={{ x: actionLoading ? 0 : (window.innerWidth / 2), opacity: 0, rotate: actionLoading ? 0 : 5, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                sx={{
                  position: 'absolute', width: '100%', height: '100%',
                  bgcolor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '32px',
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
                  boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.5)' : '0 20px 40px rgba(0,0,0,0.1)',
                  overflow: 'hidden',
                  cursor: isTop ? 'grab' : 'auto',
                  touchAction: "none"
                }}
                whileTap={isTop ? { cursor: "grabbing" } : {}}
              >
                {/* Match Overlay */}
                <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
                  
                  {/* Algorithmic Match Score Indicator */}
                  <Box sx={{ position: 'absolute', top: 24, right: 24, bgcolor: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', color: '#8b5cf6', borderRadius: '100px', px: 2, py: 0.5, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 900 }}>
                    <Activity size={16} /> {u.matchPercentage}% Match
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 3 }}>
                    <Avatar src={u.avatar} sx={{ width: 140, height: 140, border: '4px solid #8b5cf6', boxShadow: '0 0 30px rgba(139, 92, 246, 0.3)' }}>
                      {u.name.charAt(0)}
                    </Avatar>
                  </Box>

                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography variant="h4" fontWeight={900} color={isDark ? "white" : "#0f172a"}>{u.name}</Typography>
                    {u.major && <Typography variant="h6" color="#8b5cf6" fontWeight={700}><Briefcase size={16} style={{ verticalAlign: 'middle', marginRight: 4 }}/>{u.major}</Typography>}
                    {u.university && <Typography variant="body1" color={isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)"} fontWeight={600} mt={0.5}><MapPin size={16} style={{ verticalAlign: 'middle', marginRight: 4 }}/>{u.university}</Typography>}
                  </Box>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1, mb: 4 }}>
                    {(u.subjects || []).slice(0, 5).map(sub => (
                      <Chip key={sub} label={sub} size="small" sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: isDark ? 'white' : '#0f172a', fontWeight: 600, border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)' }} icon={<BookOpen size={12} />} />
                    ))}
                  </Box>

                  {/* Swipe Action Buttons */}
                  {isTop && (
                    <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 4, pb: 2 }}>
                      {isSent ? (
                        <Button
                          disabled
                          variant="contained"
                          sx={{ 
                            height: 64, px: 4, borderRadius: '32px',
                            bgcolor: 'rgba(139, 92, 246, 0.2)', color: '#8b5cf6',
                            fontWeight: 900, textTransform: 'none', fontSize: '1.1rem',
                            border: '1px solid rgba(139, 92, 246, 0.5)',
                            '&.Mui-disabled': { color: '#8b5cf6', bgcolor: 'rgba(139, 92, 246, 0.1)' }
                          }}
                        >
                          Request Sent ✨
                        </Button>
                      ) : (
                        <>
                          <IconButton 
                            onClick={() => handleAction(u._id, 'skip', 'left')}
                            sx={{ width: 64, height: 64, bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', transition: '0.2s', '&:hover': { bgcolor: '#ef4444', color: 'white', transform: 'scale(1.1)' } }}
                          >
                            <X size={32} />
                          </IconButton>
                          <IconButton 
                            onClick={() => handleAction(u._id, 'connect', 'right')}
                            sx={{ width: 64, height: 64, bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', transition: '0.2s', '&:hover': { bgcolor: '#10b981', color: 'white', transform: 'scale(1.1)' } }}
                          >
                            <Check size={32} />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  )}
                </Box>
              </Box>
            );
          })}
        </AnimatePresence>
      </Box>

      {/* Guide text */}
      {matches.length > 0 && (
         <Typography variant="body2" color={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"} fontWeight={600} mt={4}>
           Swipe Right to connect, Left to pass.
         </Typography>
      )}
    </Box>
  );
}
