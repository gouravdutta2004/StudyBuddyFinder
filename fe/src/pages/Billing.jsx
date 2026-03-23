import React, { useState } from 'react';
import { Box, Container, Typography, Grid, Button, Chip } from '@mui/material';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Check, CreditCard, Sparkles } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

function TiltCard({ children, sx }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };
  const handleMouseLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      style={{ rotateX, rotateY, perspective: 1000, display: 'flex', height: '100%' }}
      onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
    >
      <Box sx={{ 
        width: '100%', bgcolor: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.05)', borderRadius: '32px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)', overflow: 'hidden', ...sx 
      }}>
        {children}
      </Box>
    </motion.div>
  );
}

const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const fadeUpSpring = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } } };

export default function Billing() {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const currentPlan = user?.subscription?.plan || 'basic';

  const handleUpgrade = async (planKey) => {
    if (planKey === currentPlan) return toast.error('You are already on this plan');
    setLoading(true);
    try {
      const res = await api.post('/billing/upgrade', { plan: planKey });
      toast.success(res.data.message);
      login({ ...user, subscription: res.data.subscription });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upgrade failed');
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    { key: 'basic', name: 'Basic', price: '0', desc: 'Core matching and public squads.', features: ['Up to 3 connections', 'Public squads', 'Basic tracking'], cta: 'Current Plan', color: '#64748b' },
    { key: 'pro', name: 'Pro', price: '799', desc: 'AI assistant and unlimited networks.', features: ['Unlimited connections', 'Private squads', 'Gemini AI Integration', 'Advanced Heatmaps'], cta: 'Upgrade to Pro', color: '#6366f1', popular: true },
    { key: 'squad', name: 'Squad', price: '1599', desc: 'For dedicated, high-performance groups.', features: ['50 members per squad', 'Unlimited Vault storage', 'Admin Moderation Tools'], cta: 'Upgrade to Squad', color: '#10b981' }
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#020617', py: 10 }}>
      <Container maxWidth="lg">
        <motion.div initial="hidden" animate="visible" variants={staggerContainer} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          <Box textAlign="center" mb={8} component={motion.div} variants={fadeUpSpring}>
            <Typography variant="h3" fontWeight={900} color="white" mb={2} display="flex" alignItems="center" justifyContent="center" gap={2}>
              <CreditCard color="#6366f1" size={40} /> Subscription & Billing
            </Typography>
            <Typography variant="h6" color="rgba(255,255,255,0.6)">Manage your StudyBuddy plan and access premium tools.</Typography>
          </Box>

          <Grid container spacing={4} sx={{ mt: 2 }}>
            {plans.map((plan, i) => {
              const isActive = currentPlan === plan.key;
              return (
                <Grid item xs={12} md={4} key={i}>
                  <motion.div variants={fadeUpSpring} style={{ height: '100%' }}>
                    <TiltCard sx={{ 
                      p: 4, pt: 6, display: 'flex', flexDirection: 'column',
                      bgcolor: isActive ? `${plan.color}15` : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isActive ? plan.color : 'rgba(255,255,255,0.05)'}`
                    }}>
                      {plan.popular && !isActive && (
                        <Chip label="RECOMMENDED" sx={{ position: 'absolute', top: 16, right: 16, bgcolor: plan.color, color: 'white', fontWeight: 900, fontSize: '0.7rem' }} size="small" />
                      )}
                      {isActive && (
                        <Chip label="ACTIVE PLAN" sx={{ position: 'absolute', top: 16, right: 16, bgcolor: '#10b981', color: 'black', fontWeight: 900, fontSize: '0.7rem' }} size="small" />
                      )}
                      
                      <Typography variant="h4" fontWeight={900} color="white">{plan.name}</Typography>
                      <Typography variant="body2" color="rgba(255,255,255,0.5)" mt={1} mb={3} sx={{ minHeight: 40 }}>{plan.desc}</Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 4 }}>
                        <Typography variant="h2" fontWeight={900} color="white" sx={{ letterSpacing: '-2px' }}>₹{plan.price}</Typography>
                        <Typography variant="body1" color="rgba(255,255,255,0.4)" fontWeight={600}>/mo</Typography>
                      </Box>

                      <Button 
                        fullWidth disabled={isActive || loading} onClick={() => handleUpgrade(plan.key)}
                        variant="contained"
                        startIcon={plan.key !== 'basic' && !isActive ? <Sparkles size={18} /> : null}
                        sx={{ 
                          borderRadius: '100px', py: 2.5, fontWeight: 900, fontSize: '1rem', mb: 4,
                          bgcolor: isActive ? 'rgba(255,255,255,0.1)' : plan.color,
                          color: isActive ? 'rgba(255,255,255,0.5)' : 'white',
                          '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' },
                          '&:hover': { bgcolor: plan.color, opacity: 0.9 }
                        }}
                      >
                        {isActive ? 'Current Plan' : plan.cta}
                      </Button>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 'auto' }}>
                        {plan.features.map((f, j) => (
                          <Box key={j} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: `${plan.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Check size={14} color={plan.color} strokeWidth={3} />
                            </Box>
                            <Typography variant="body2" color="rgba(255,255,255,0.8)" fontWeight={600}>{f}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </TiltCard>
                  </motion.div>
                </Grid>
              );
            })}
          </Grid>
          
          <Box mt={8} textAlign="center" component={motion.div} variants={fadeUpSpring}>
             <Typography variant="body2" color="rgba(255,255,255,0.4)">*Transactions are mock simulations. No real currency is exchanged in this domain.</Typography>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}
