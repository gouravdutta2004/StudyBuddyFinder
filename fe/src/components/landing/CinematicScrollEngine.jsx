import React, { useRef, useLayoutEffect } from 'react';
import { Box, Typography } from '@mui/material';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Target, MessageSquare, Award, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MagneticButton from '../MagneticButton';

gsap.registerPlugin(ScrollTrigger);

export default function CinematicScrollEngine() {
  const containerRef = useRef(null);
  const portalRef = useRef(null);
  const textRef = useRef(null);
  const bentoRef = useRef(null);
  const navigate = useNavigate();

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: '+=4000',
          scrub: 1,
          pin: true,
          anticipatePin: 1
        }
      });

      // 1. Fade out the hero text quickly
      tl.to(textRef.current, { opacity: 0, scale: 0.8, y: -100, duration: 0.5 }, 0);

      // 2. Zoom the "Portal" massively into the camera
      tl.to(portalRef.current, { scale: 40, opacity: 0, duration: 2, ease: "power2.inOut" }, 0);

      // 3. Bento boxes fly past camera from negative Z space
      const cards = gsap.utils.toArray('.bento-card');
      cards.forEach((card, i) => {
        gsap.set(card, { z: -3000, opacity: 0, scale: 0.2, x: (i % 2 === 0 ? -400 : 400), y: (i % 2 !== 0 ? -200 : 200) });

        tl.to(card, {
          z: 800,
          scale: 1.5,
          opacity: 1,
          duration: 1.5,
          ease: "power1.inOut"
        }, 1 + i * 0.3); // Stagger the flybys

        // Fade them out as they pass the camera frame
        tl.to(card, { opacity: 0, scale: 2, duration: 0.3 }, 2.2 + i * 0.3);
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <Box ref={containerRef} sx={{ height: '100vh', width: '100%', position: 'relative', overflow: 'hidden', perspective: '1200px', transformStyle: 'preserve-3d', bgcolor: '#020617' }}>

      {/* Starting Hero Text */}
      <Box ref={textRef} sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
        <Typography variant="body1" fontWeight={800} color="#10b981" sx={{ letterSpacing: 4, textTransform: 'uppercase', mb: 2 }}>STUDYFRIEND</Typography>
        <Typography variant="h1" fontWeight={900} color="white" textAlign="center" sx={{ fontSize: { xs: '3.5rem', md: '7rem' }, letterSpacing: '-3px', lineHeight: 1, textShadow: '0 0 60px rgba(99,102,241,0.5)' }}>
          Find your <br /> Tribe.
        </Typography>
        <Typography variant="h6" color="rgba(255,255,255,0.6)" maxWidth={600} textAlign="center" mt={3} mb={5}>
          Scroll to experience the ultimate study operating system.
        </Typography>
        <MagneticButton onClick={() => navigate('/register')} className="inline-block">
          <Box sx={{ bgcolor: 'white', color: '#020617', px: 5, py: 2.5, borderRadius: '100px', fontWeight: 900, cursor: 'pointer', fontSize: '1.2rem', boxShadow: '0 10px 30px rgba(255,255,255,0.2)' }}>
            Dive In
          </Box>
        </MagneticButton>
      </Box>

      {/* The 3D Tablet Portal */}
      <Box ref={portalRef} sx={{
        position: 'absolute', top: '50%', left: '50%', width: { xs: 340, md: 800 }, height: { xs: 240, md: 500 },
        transform: 'translate(-50%, -50%)', border: '8px solid #1e293b', borderRadius: '32px',
        bgcolor: '#0f172a',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5,
        boxShadow: '0 0 150px rgba(99, 102, 241, 0.4)'
      }}>
        <Box sx={{ width: '96%', height: '94%', bgcolor: '#020617', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', position: 'relative' }}>
          <Box sx={{ position: 'absolute', top: 20, left: 20, right: 20, height: 40, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2 }} />
          <Box sx={{ position: 'absolute', top: 80, left: 20, width: '30%', bottom: 20, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2 }} />
          <Box sx={{ position: 'absolute', top: 80, right: 20, width: '60%', bottom: 20, bgcolor: 'rgba(99,102,241,0.1)', borderRadius: 2 }} />
        </Box>
      </Box>

      {/* Bento Fly-By Elements */}
      <Box ref={bentoRef} sx={{ position: 'absolute', top: '50%', left: '50%', pointerEvents: 'none', transformStyle: 'preserve-3d' }}>
        {[
          { icon: Target, title: "Algorithmic Match", color: '#818cf8', bg: 'rgba(99, 102, 241, 0.1)' },
          { icon: MessageSquare, title: "Whobee AI", color: '#c084fc', bg: 'rgba(192, 132, 252, 0.1)' },
          { icon: Zap, title: "Live Hubs", color: '#f472b6', bg: 'rgba(244, 114, 182, 0.1)' },
          { icon: Award, title: "Velocity", color: '#34d399', bg: 'rgba(52, 211, 153, 0.1)' }
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <Box
              key={i} className="bento-card"
              sx={{
                position: 'absolute', transform: 'translate(-50%, -50%)', // Center relative
                width: 320, height: 220, bgcolor: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.15)', borderRadius: '24px', p: 4,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 30px 60px rgba(0,0,0,0.8)'
              }}
            >
              <Box sx={{ bgcolor: item.bg, p: 2.5, borderRadius: '50%', mb: 2 }}>
                <Icon size={48} color={item.color} />
              </Box>
              <Typography variant="h5" fontWeight={900} color="white">{item.title}</Typography>
            </Box>
          );
        })}
      </Box>

    </Box>
  );
}
