import React, { useState } from 'react';
import { Dialog, Box, Typography, Button, IconButton, useTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { X, ChevronRight, ChevronLeft, Trophy, Flame, Target, Star, Play } from 'lucide-react';

export default function WeeklyRecapModal({ open, onClose }) {
  const { user } = useAuth();
  const theme = useTheme();
  const [slide, setSlide] = useState(0);

  const slides = [
    {
      id: 0,
      icon: <Trophy size={64} color="#f59e0b" />,
      title: "Your Weekly Recap",
      subtitle: "Let's review the incredible progress you've made this week in the StudyFriend Matrix.",
      color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
    },
    {
      id: 1,
      icon: <Target size={64} color="#3b82f6" />,
      title: "Goals Crushed",
      subtitle: `You logged ${user?.studyHours || 0} total hours, dominating your study trajectory! Keep the momentum high.`,
      color: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
    },
    {
      id: 2,
      icon: <Flame size={64} color="#ef4444" />,
      title: "Consistency is Key",
      subtitle: `You maintained a solid ${user?.streak || 0}-day streak! Consistency compounds into genius.`,
      color: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
    },
    {
      id: 3,
      icon: <Star size={64} color="#10b981" />,
      title: "Rank & Recognition",
      subtitle: `You earned ${user?.xp || 0} XP, anchoring yourself at Level ${user?.level || 1}. You are a true ${user?.league || 'BRONZE'} League scholar.`,
      color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    }
  ];

  const handleNext = () => setSlide(s => Math.min(slides.length - 1, s + 1));
  const handlePrev = () => setSlide(s => Math.max(0, s - 1));

  return (
    <Dialog open={open} onClose={() => { onClose(); setSlide(0); }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '24px', overflow: 'hidden', bgcolor: 'transparent', boxShadow: 'none' } }}>
      <Box sx={{ position: 'relative', width: '100%', height: 400, bgcolor: theme.palette.background.paper, display: 'flex', flexDirection: 'column' }}>
        
        <IconButton onClick={() => { onClose(); setSlide(0); }} sx={{ position: 'absolute', top: 16, right: 16, zIndex: 10, color: 'white', bgcolor: 'rgba(0,0,0,0.2)', '&:hover': { bgcolor: 'rgba(0,0,0,0.4)' } }}>
          <X size={20} />
        </IconButton>

        <AnimatePresence mode="wait">
          <Box
            component={motion.div}
            key={slide}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4, textAlign: 'center', background: slides[slide].color, color: 'white' }}
          >
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}>
              {slides[slide].icon}
            </motion.div>
            <Typography variant="h3" fontWeight={900} mt={3} mb={1} sx={{ textShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
              {slides[slide].title}
            </Typography>
            <Typography variant="h6" fontWeight={500} sx={{ opacity: 0.9, maxWidth: 400, lineHeight: 1.5 }}>
              {slides[slide].subtitle}
            </Typography>
          </Box>
        </AnimatePresence>

        {/* Controls */}
        <Box sx={{ position: 'absolute', bottom: 0, width: '100%', p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {slides.map((_, i) => (
              <Box key={i} sx={{ width: i === slide ? 24 : 8, height: 8, borderRadius: 4, bgcolor: 'white', opacity: i === slide ? 1 : 0.4, transition: 'all 0.3s' }} />
            ))}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={handlePrev} disabled={slide === 0} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.2)', '&:disabled': { opacity: 0.3 } }}>
              <ChevronLeft size={24} />
            </IconButton>
            <IconButton onClick={handleNext} disabled={slide === slides.length - 1} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.2)', '&:disabled': { opacity: 0.3 } }}>
              <ChevronRight size={24} />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}
