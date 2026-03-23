import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Container, Grid, Switch, Chip, useTheme as useMuiTheme } from '@mui/material';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Users, Zap, MessageSquare, Target, Check, ArrowRight, Shield, Globe, Award, Sparkles } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import Lenis from 'lenis';

// Modular dynamic components
import ReactiveHero from '../components/landing/ReactiveHero';
import PlayableSandbox from '../components/landing/PlayableSandbox';
import VelocityMarquee from '../components/landing/VelocityMarquee';

// --- Shared Framer Motion Variants ---
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const fadeUpSpring = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, y: 0, 
    transition: { type: "spring", stiffness: 100, damping: 15 } 
  }
};

// --- Component: 3D Tilt Card ---
function TiltCard({ children, sx }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

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

  return (
    <motion.div
      style={{ rotateX, rotateY, perspective: 1000, display: 'flex', height: '100%' }}
      onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
    >
      <Box sx={{ 
        width: '100%', bgcolor: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)', overflow: 'hidden', ...sx 
      }}>
        {children}
      </Box>
    </motion.div>
  );
}

// --- Component: Custom Navbar ---
function LandingNavbar() {
  const navigate = useNavigate();
  return (
    <motion.div 
      initial={{ y: -100 }} animate={{ y: 0 }} transition={{ type: "spring", stiffness: 100, damping: 20 }}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, padding: '16px 24px' }}
    >
      <Box sx={{ 
        maxWidth: 1200, mx: 'auto',
        bgcolor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.1)', 
        borderRadius: '100px', px: 3, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)'
      }}>
        <Typography variant="h6" fontWeight={800} sx={{ color: 'white', display: 'flex', alignItems: 'center', gap: 1, letterSpacing: '-0.5px' }}>
          <Globe size={20} color="#6366f1" /> StudyBuddyFinder
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="text" onClick={() => navigate('/login')} sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, textTransform: 'none', borderRadius: 8, px: 3 }}>
              Log In
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="contained" onClick={() => navigate('/register')} sx={{ 
              bgcolor: '#6366f1', color: 'white', borderRadius: 8, textTransform: 'none', px: 3, fontWeight: 700,
              boxShadow: '0 8px 20px -6px rgba(99, 102, 241, 0.6)', '&:hover': { bgcolor: '#4f46e5' }
            }}>
              Start Free
            </Button>
          </motion.div>
        </Box>
      </Box>
    </motion.div>
  );
}

// --- Component: Bento Box Features Section ---
function BentoFeatures() {
  return (
    <Container maxWidth="lg" sx={{ py: 20, position: 'relative', zIndex: 10 }}>
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
        <Box textAlign="center" mb={10}>
          <motion.div variants={fadeUpSpring}><Typography variant="subtitle2" color="#818cf8" fontWeight={800} sx={{ letterSpacing: 2, textTransform: 'uppercase', mb: 2 }}>The Framework</Typography></motion.div>
          <motion.div variants={fadeUpSpring}><Typography variant="h2" fontWeight={900} color="white" sx={{ fontSize: { xs: '2.5rem', md: '4rem' }, letterSpacing: '-1px' }}>Engineered for Focus.</Typography></motion.div>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gridTemplateRows: { xs: 'auto', md: 'repeat(2, 300px)' }, gap: 3 }}>
          {/* Matchmaking Card */}
          <Box sx={{ gridColumn: { md: 'span 2' }, gridRow: 'span 1' }}>
            <motion.div variants={fadeUpSpring} style={{ height: '100%' }}>
              <TiltCard sx={{ p: 5, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Box sx={{ width: 64, height: 64, borderRadius: '20px', bgcolor: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                  <Target size={32} color="#818cf8" />
                </Box>
                <Typography variant="h4" fontWeight={800} color="white" mb={2}>Algorithmic Matching</Typography>
                <Typography variant="h6" color="rgba(255,255,255,0.6)" fontWeight={400}>Instantly map attributes like availability, major, and goals to pair you with the top 1% of compatible study partners worldwide.</Typography>
              </TiltCard>
            </motion.div>
          </Box>
          {/* AI Assist Card */}
          <Box sx={{ gridColumn: { md: 'span 1' }, gridRow: 'span 1' }}>
             <motion.div variants={fadeUpSpring} style={{ height: '100%' }}>
              <TiltCard sx={{ p: 5, background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(139, 92, 246, 0.1) 100%)' }}>
                <MessageSquare size={32} color="#c084fc" style={{ marginBottom: 24 }} />
                <Typography variant="h5" fontWeight={800} color="white" mb={2}>Gemini Integrated</Typography>
                <Typography variant="body1" color="rgba(255,255,255,0.6)">Your own AI tutor lives inside every squad hub to explain, summarize, and assist 24/7.</Typography>
              </TiltCard>
            </motion.div>
          </Box>
          {/* Gamification Card */}
          <Box sx={{ gridColumn: { md: 'span 1' }, gridRow: 'span 1' }}>
             <motion.div variants={fadeUpSpring} style={{ height: '100%' }}>
              <TiltCard sx={{ p: 5 }}>
                <Award size={32} color="#10b981" style={{ marginBottom: 24 }} />
                <Typography variant="h5" fontWeight={800} color="white" mb={2}>Velocity Tracking</Typography>
                <Typography variant="body1" color="rgba(255,255,255,0.6)">Earn XP, unlock badges, and analyze deep metric heatmaps of your study habits.</Typography>
              </TiltCard>
            </motion.div>
          </Box>
          {/* Real-time Hubs Card */}
          <Box sx={{ gridColumn: { md: 'span 2' }, gridRow: 'span 1' }}>
             <motion.div variants={fadeUpSpring} style={{ height: '100%' }}>
              <TiltCard sx={{ p: 5, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Box sx={{ width: 64, height: 64, borderRadius: '20px', bgcolor: 'rgba(236, 72, 153, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                  <Zap size={32} color="#ec4899" />
                </Box>
                <Typography variant="h4" fontWeight={800} color="white" mb={2}>Real-Time Squad Hubs</Typography>
                <Typography variant="h6" color="rgba(255,255,255,0.6)" fontWeight={400}>No more disconnected tools. Chat, share resources in the vault, and track group tasks on Kanban boards—all in singular, synchronized spaces.</Typography>
              </TiltCard>
            </motion.div>
          </Box>
        </Box>
      </motion.div>
    </Container>
  );
}

// --- Component: Pricing Section ---
function Pricing() {
  const [annual, setAnnual] = useState(true);
  const navigate = useNavigate();

  const plans = [
    { name: 'Basic', price: '0', desc: 'Core matching and public squads.', features: ['Up to 3 connections', 'Public squads', 'Basic tracking'], cta: 'Start Free' },
    { name: 'Pro', price: annual ? '699' : '799', desc: 'AI assistant and unlimited networks.', features: ['Unlimited connections', 'Private squads', 'Gemini AI Integration', 'Advanced Heatmaps'], cta: 'Get Pro', popular: true },
    { name: 'Squad', price: annual ? '1299' : '1599', desc: 'For dedicated, high-performance groups.', features: ['50 members per squad', 'Unlimited Vault storage', 'Admin Moderation Tools'], cta: 'Get Squad Plan' }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 15, mb: 10, position: 'relative', zIndex: 10 }}>
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <motion.div variants={fadeUpSpring}><Typography variant="subtitle2" color="#818cf8" fontWeight={800} sx={{ letterSpacing: 2, textTransform: 'uppercase', mb: 2 }}>Pricing</Typography></motion.div>
        <motion.div variants={fadeUpSpring}><Typography variant="h2" fontWeight={900} color="white" mb={4} sx={{ fontSize: { xs: '2.5rem', md: '4rem' }, letterSpacing: '-1px' }}>Invest in your future.</Typography></motion.div>
        
        <motion.div variants={fadeUpSpring}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 2, bgcolor: 'rgba(255,255,255,0.03)', p: 1, borderRadius: '100px', border: '1px solid rgba(255,255,255,0.1)', mb: 10 }}>
            <Typography variant="body1" color={!annual ? 'white' : 'rgba(255,255,255,0.5)'} fontWeight={700} sx={{ pl: 3, cursor: 'pointer' }} onClick={() => setAnnual(false)}>Monthly</Typography>
            <Switch checked={annual} onChange={() => setAnnual(!annual)} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#6366f1' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#6366f1' } }} />
            <Typography variant="body1" color={annual ? 'white' : 'rgba(255,255,255,0.5)'} fontWeight={700} sx={{ pr: 3, cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => setAnnual(true)}>
              Annually <Chip label="Save 20%" size="small" sx={{ ml: 1.5, bgcolor: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontWeight: 800, borderRadius: 2 }} />
            </Typography>
          </Box>
        </motion.div>

        <Grid container spacing={4}>
          {plans.map((plan, i) => (
            <Grid item xs={12} md={4} key={i}>
              <motion.div variants={fadeUpSpring} style={{ height: '100%' }}>
                <Box sx={{ 
                  bgcolor: plan.popular ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255,255,255,0.02)', 
                  backdropFilter: 'blur(20px)', border: `1px solid ${plan.popular ? 'rgba(99, 102, 241, 0.5)' : 'rgba(255,255,255,0.05)'}`,
                  borderRadius: '32px', p: 4, pt: 6, position: 'relative', height: '100%', display: 'flex', flexDirection: 'column'
                }}>
                  {plan.popular && (
                    <Chip label="MOST POPULAR" sx={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', bgcolor: '#6366f1', color: 'white', fontWeight: 900, borderRadius: '100px', px: 2, py: 2.5, fontSize: '0.8rem', letterSpacing: 1 }} />
                  )}
                  <Typography variant="h5" fontWeight={800} color="white" mb={1}>{plan.name}</Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.5)" mb={4} sx={{ minHeight: 40, fontSize: '1rem' }}>{plan.desc}</Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 4 }}>
                    <Typography variant="h2" fontWeight={900} color="white" sx={{ letterSpacing: '-2px' }}>₹{plan.price}</Typography>
                    <Typography variant="body1" color="rgba(255,255,255,0.4)" fontWeight={600}>/mo</Typography>
                  </Box>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ marginBottom: 32 }}>
                    <Button 
                      fullWidth variant={plan.popular ? "contained" : "outlined"} onClick={() => navigate('/register')}
                      sx={{ 
                        borderRadius: '100px', py: 2, fontWeight: 800, fontSize: '1rem', textTransform: 'none',
                        bgcolor: plan.popular ? '#6366f1' : 'transparent', color: 'white',
                        borderColor: plan.popular ? 'transparent' : 'rgba(255,255,255,0.2)',
                        '&:hover': { bgcolor: plan.popular ? '#4f46e5' : 'rgba(255,255,255,0.05)', borderColor: 'white' }
                      }}
                    >
                      {plan.cta}
                    </Button>
                  </motion.div>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 'auto' }}>
                    {plan.features.map((f, j) => (
                      <Box key={j} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Check size={16} color="#818cf8" strokeWidth={3} />
                        </Box>
                        <Typography variant="body1" color="rgba(255,255,255,0.8)" fontWeight={500}>{f}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </motion.div>
    </Container>
  );
}

function Footer() {
  return (
    <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.05)', pt: 8, pb: 4, mt: 10, textAlign: 'center', bgcolor: 'rgba(0,0,0,0.2)', position: 'relative', zIndex: 10 }}>
      <Typography variant="h6" fontWeight={800} color="white" mb={2} display="flex" alignItems="center" justifyContent="center" gap={1}>
        <Globe size={20} color="#6366f1" /> StudyBuddyFinder
      </Typography>
      <Typography variant="body2" color="rgba(255,255,255,0.3)" fontWeight={500}>
        © 2026 StudyBuddyFinder Inc. Crafted for excellence.
      </Typography>
    </Box>
  );
}

export default function Landing() {
  useEffect(() => {
    const lenis = new Lenis({ smoothTouch: true, lerp: 0.1, duration: 1.5 });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  return (
    <Box sx={{ bgcolor: '#020617', minHeight: '100vh', width: '100%', overflowX: 'hidden', fontFamily: '"Inter", sans-serif' }}>
      <LandingNavbar />
      
      {/* Dynamic & Iterative Modules */}
      <ReactiveHero />
      
      {/* Playable sandbox embedded before Marquee */}
      <PlayableSandbox />
      
      <VelocityMarquee baseVelocity={-2} />
      
      <BentoFeatures />
      
      <Pricing />
      
      {/* Final Premium CTA Set */}
      <Box sx={{ textAlign: 'center', py: 15, position: 'relative', zIndex: 10 }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
           <motion.div variants={fadeUpSpring}>
            <Typography variant="h2" fontWeight={900} color="white" mb={4} sx={{ fontSize: { xs: '3rem', md: '5rem' }, letterSpacing: '-2px' }}>
              Ready to transcend?
            </Typography>
          </motion.div>
          <motion.div variants={fadeUpSpring} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to="/register" style={{ textDecoration: 'none' }}>
              <Button variant="contained" sx={{ 
                bgcolor: '#10b981', color: '#020617', borderRadius: '100px', px: 6, py: 3, 
                fontSize: '1.2rem', fontWeight: 900, textTransform: 'none', 
                boxShadow: '0 20px 40px -10px rgba(16, 185, 129, 0.4)',
                '&:hover': { bgcolor: '#059669' } 
              }}>
                Launch Your First Hub
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </Box>

      <Footer />
    </Box>
  );
}
