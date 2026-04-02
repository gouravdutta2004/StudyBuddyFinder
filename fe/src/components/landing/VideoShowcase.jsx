import React, { useRef, useEffect } from 'react';
import { Box, Typography, Container, Chip } from '@mui/material';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Target, Zap } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function VideoShowcase() {
  const containerRef = useRef(null);
  
  // 3D Tilt properties
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 100, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 100, damping: 20 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["3deg", "-3deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-3deg", "3deg"]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };
  const handleMouseLeave = () => {
    x.set(0); y.set(0);
  };

  useEffect(() => {
    // Parallax element fade up effect
    let ctx = gsap.context(() => {
      gsap.fromTo(containerRef.current, { y: 100, opacity: 0 }, {
        y: 0, opacity: 1, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: containerRef.current, start: 'top 80%' }
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <Box id="watch" sx={{ py: 10, position: 'relative', zIndex: 10 }}>
      <Container maxWidth="lg" ref={containerRef}>
        <Box sx={{ textAlign: 'center', mb: 6, maxWidth: 600, mx: 'auto' }}>
          <Chip label="Product Demo" size="small" icon={<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10b981', ml: 1 }} />} sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: '#a78bfa', border: '1px solid rgba(255,255,255,0.06)', mb: 2, fontWeight: 700, px: 1 }} />
          <Typography variant="h2" fontFamily='"Space Grotesk", sans-serif' fontWeight={800} color="white" mb={2} sx={{ fontSize: { xs: '2rem', md: '3.25rem' }, letterSpacing: '-1px' }}>
            See StudyFriend <span style={{ background: 'linear-gradient(135deg, #f0f0f5, #a78bfa, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>in action</span>
          </Typography>
          <Typography variant="body1" color="#8b8fa8" fontSize="1rem">
            Watch how students find perfect study partners and join live collaborative sessions.
          </Typography>
        </Box>

        <Box sx={{ perspective: '1200px', display: 'flex', justifyContent: 'center' }}>
          <motion.div
            style={{ rotateX, rotateY, transformStyle: 'preserve-3d', position: 'relative', width: '100%', maxWidth: '960px' }}
            onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
            whileHover={{ y: -8, scale: 1.01, boxShadow: '0 0 100px rgba(124,58,237,0.25)' }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Box sx={{ 
              borderRadius: '24px', position: 'relative',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015))',
              border: '1.5px solid rgba(124,58,237,0.2)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', overflow: 'hidden'
            }}>
              {/* Browser Bar */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.5, bgcolor: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <Box sx={{ width: 11, height: 11, borderRadius: '50%', bgcolor: '#ff5f57' }} />
                <Box sx={{ width: 11, height: 11, borderRadius: '50%', bgcolor: '#febc2e' }} />
                <Box sx={{ width: 11, height: 11, borderRadius: '50%', bgcolor: '#28c840' }} />
                <Box sx={{ flex: 1, ml: 1, px: 2, py: 0.5, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: '100px', fontSize: '0.75rem', color: '#5a5f7a', border: '1px solid rgba(255,255,255,0.06)' }}>
                  studyfriend.app — Live Product Demo
                </Box>
                <Box sx={{ fontSize: '0.7rem', px: 1.5, py: 0.5, bgcolor: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.22)', borderRadius: '100px', fontWeight: 700 }}>
                  ● Recording
                </Box>
              </Box>

              {/* Video Area */}
              <Box sx={{ position: 'relative', aspectRatio: '16/9', bgcolor: '#060810' }}>
                <video autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}>
                  <source src="/studyfriend-demo.mp4" type="video/mp4" />
                </video>
                <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(transparent, rgba(6,8,16,0.5))', pointerEvents: 'none' }} />
                <Box sx={{ position: 'absolute', bottom: 16, left: 16, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {['Algorithmic Match', 'Live Hubs', 'Velocity XP'].map(tag => (
                   <Box key={tag} sx={{ px: 1.5, py: 0.5, bgcolor: 'rgba(6,8,16,0.78)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '100px', fontSize: '0.75rem', backdropFilter: 'blur(10px)' }}>
                     {tag}
                   </Box>
                  ))}
                </Box>
              </Box>
            </Box>

            {/* Floating Badges */}
            <Box 
              component={motion.div}
              animate={{ y: [0, -18, 0] }} transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
              sx={{ position: 'absolute', top: '22%', left: -36, background: 'rgba(11,15,26,0.88)', backdropFilter: 'blur(18px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 3, p: 2, display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1.5, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', zIndex: 4 }}
            >
              <Box sx={{ width: 38, height: 38, borderRadius: 2, background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Target size={18} color="white" />
              </Box>
              <Box>
                <Typography variant="body2" fontWeight={700} color="white">Smart Match</Typography>
                <Typography variant="caption" color="#5a5f7a">97% Accuracy</Typography>
              </Box>
            </Box>

            <Box 
              component={motion.div}
              animate={{ y: [0, -18, 0] }} transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 3.5 }}
              sx={{ position: 'absolute', bottom: '22%', right: -36, background: 'rgba(11,15,26,0.88)', backdropFilter: 'blur(18px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 3, p: 2, display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1.5, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', zIndex: 4 }}
            >
              <Box sx={{ width: 38, height: 38, borderRadius: 2, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={18} color="white" />
              </Box>
              <Box>
                <Typography variant="body2" fontWeight={700} color="white">Study Streak</Typography>
                <Typography variant="caption" color="#5a5f7a">14 Days 🔥</Typography>
              </Box>
            </Box>
          </motion.div>
        </Box>
      </Container>
    </Box>
  );
}
