import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function useTimeGreeting() {
  const [greeting, setGreeting] = useState('');
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 5) setGreeting("Late night coding?");
    else if (hour < 12) setGreeting("Morning grind?");
    else if (hour < 17) setGreeting("Afternoon review?");
    else setGreeting("Evening sprint?");
  }, []);
  return greeting;
}

function MagneticButton({ children, onClick }) {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e) => {
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.2, y: middleY * 0.2 });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
  };

  const { x, y } = position;
  return (
    <motion.div
      style={{ position: "relative", zIndex: 50 }}
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x, y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
    >
      <Button 
        variant="contained" 
        onClick={onClick}
        sx={{ 
          bgcolor: 'white', color: '#020617', borderRadius: '100px', px: 6, py: 2.5, 
          fontSize: '1.2rem', fontWeight: 800, textTransform: 'none',
          boxShadow: '0 20px 40px -10px rgba(255,255,255,0.3)',
          display: 'flex', alignItems: 'center', gap: 1.5,
          '&:hover': { bgcolor: '#f1f5f9' }
        }}
      >
        {children} <ArrowRight size={20} />
      </Button>
    </motion.div>
  );
}

export default function ReactiveHero() {
  const greeting = useTimeGreeting();
  const navigate = useNavigate();
  
  // Fluid Mouse-Tracking Background
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 200 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const handleMouseMove = ({ clientX, clientY }) => {
    mouseX.set(clientX);
    mouseY.set(clientY);
  };

  const orbX = useTransform(smoothX, x => x - 400);
  const orbY = useTransform(smoothY, y => y - 400);

  return (
    <Box 
      onMouseMove={handleMouseMove}
      sx={{ 
        pt: 24, pb: { xs: 15, md: 30 }, px: 2, 
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', 
        position: 'relative', overflow: 'hidden', minHeight: '80vh'
      }}
    >
      {/* Interactive Cursor Orb */}
      <motion.div
        style={{
          position: 'absolute', left: 0, top: 0,
          width: 800, height: 800,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, rgba(0,0,0,0) 70%)',
          filter: 'blur(100px)',
          translateX: orbX,
          translateY: orbY,
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />
      
      {/* Static Glow Backups */}
      <Box sx={{ position: 'absolute', top: '-10%', right: '-10%', width: 600, height: 600, bgcolor: 'rgba(139, 92, 246, 0.15)', borderRadius: '50%', filter: 'blur(120px)', zIndex: 0 }} />

      <Box sx={{ position: 'relative', zIndex: 10, maxWidth: 900, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Typography variant="body1" fontWeight={800} sx={{ letterSpacing: 2, textTransform: 'uppercase', color: '#10b981', mb: 3 }}>
            {greeting}
          </Typography>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}>
          <Typography variant="h1" fontWeight={900} sx={{ fontSize: { xs: '3.5rem', md: '6.5rem' }, lineHeight: 1.05, mb: 4, color: 'white', letterSpacing: '-2px' }}>
            Find your <br/>
            <Box component="span" sx={{ background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Study Tribe
            </Box>
          </Typography>
        </motion.div>
        
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.3 }}>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.6)', mb: 8, maxWidth: 640, fontWeight: 400, fontSize: { xs: '1.1rem', md: '1.25rem' }, lineHeight: 1.6 }}>
            Connect with peers, create live study hubs, leverage Gemini AI, and track your velocity. The complete operating system for modern students.
          </Typography>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", delay: 0.5 }}>
          <MagneticButton onClick={() => navigate('/register')}>
            Find a Buddy
          </MagneticButton>
        </motion.div>
      </Box>
    </Box>
  );
}
