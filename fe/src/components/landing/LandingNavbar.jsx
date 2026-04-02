import React, { useState, useEffect } from 'react';
import { Box, Button, IconButton, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from '../Logo';

export default function LandingNavbar() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Demo', href: '#demo' },
    { label: 'How It Works', href: '#how' },
    { label: 'Pricing', href: '#pricing' },
  ];

  return (
    <>
      <motion.div 
        initial={{ y: -100 }} animate={{ y: 0 }} transition={{ type: "spring", stiffness: 100, damping: 20 }}
        style={{ position: 'fixed', top: 14, left: 0, right: 0, zIndex: 1000, padding: '0 24px' }}
      >
        <Box sx={{ 
          maxWidth: 1100, mx: 'auto',
          bgcolor: scrolled ? 'rgba(11, 15, 26, 0.92)' : 'rgba(15, 20, 35, 0.6)', 
          backdropFilter: 'blur(24px) saturate(180%)', 
          border: '1px solid',
          borderColor: scrolled ? 'rgba(124, 58, 237, 0.15)' : 'rgba(255, 255, 255, 0.06)', 
          borderRadius: '100px', px: 3, py: 1.5, 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          boxShadow: scrolled ? '0 4px 30px rgba(0, 0, 0, 0.3)' : 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }} onClick={() => window.scrollTo(0, 0)}>
            <Logo size={28} textColor="white" />
          </Box>
          
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 4, alignItems: 'center' }}>
            {navLinks.map((link) => (
              <Box 
                key={link.label} component="a" href={link.href}
                sx={{ 
                  color: '#8b8fa8', fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none',
                  position: 'relative', transition: '0.2s',
                  '&:hover': { color: '#f0f0f5' },
                  '&::after': {
                    content: '""', position: 'absolute', bottom: -4, left: 0, width: 0, height: 2,
                    bgcolor: '#7c3aed', borderRadius: 4, transition: '0.3s'
                  },
                  '&:hover::after': { width: '100%' }
                }}
              >
                {link.label}
              </Box>
            ))}
          </Box>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1.5, alignItems: 'center' }}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="text" onClick={() => navigate('/login')} sx={{ color: '#8b8fa8', fontWeight: 600, textTransform: 'none', borderRadius: 8, px: 2, '&:hover': { color: 'white' } }}>
                Log In
              </Button>
            </motion.div>
            <motion.div whileHover={{ translateY: -2, boxShadow: '0 12px 32px rgba(124,58,237,0.35)' }} whileTap={{ scale: 0.95 }}>
              <Button variant="contained" onClick={() => navigate('/register')} sx={{ 
                background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', color: 'white', borderRadius: 8, textTransform: 'none', px: 3, py: 1, fontWeight: 600,
                boxShadow: '0 6px 20px rgba(124,58,237,0.25)', border: 'none'
              }}>
                Start Free
              </Button>
            </motion.div>
          </Box>

          <IconButton onClick={() => setMobileOpen(true)} sx={{ display: { md: 'none' }, color: 'white' }}>
            <Menu />
          </IconButton>
        </Box>
      </motion.div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ 
              position: 'fixed', inset: 0, zIndex: 5500, display: 'flex', flexDirection: 'column', 
              alignItems: 'center', justifyContent: 'center', gap: '28px',
              background: 'rgba(11, 15, 26, 0.97)', backdropFilter: 'blur(24px)'
            }}
          >
            <IconButton onClick={() => setMobileOpen(false)} sx={{ position: 'absolute', top: 24, right: 24, color: 'white' }}>
              <X size={32} />
            </IconButton>
            
            {navLinks.map((link, i) => (
              <motion.a 
                key={link.label} href={link.href} onClick={() => setMobileOpen(false)}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
                style={{ 
                  color: '#8b8fa8', textDecoration: 'none', fontSize: '1.6rem', fontWeight: 600, fontFamily: '"Space Grotesk", sans-serif'
                }}
                onMouseOver={(e) => e.target.style.color = 'white'}
                onMouseOut={(e) => e.target.style.color = '#8b8fa8'}
              >
                {link.label}
              </motion.a>
            ))}
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Button onClick={() => navigate('/register')} sx={{ 
                background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', color: 'white', borderRadius: 8, textTransform: 'none', px: 4, py: 1.5, fontSize: '1.1rem', fontWeight: 600, mt: 2
              }}>
                Start Free
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
