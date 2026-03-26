import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Grid, Button, Chip, Divider,
  CircularProgress, Table, TableBody, TableCell, TableHead, TableRow, Paper
} from '@mui/material';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Check, CreditCard, Sparkles, ShieldCheck, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

// ── Tilt Card ───────────────────────────────────────────────
function TiltCard({ children, sx }) {
  const x = useMotionValue(0), y = useMotionValue(0);
  const rotateX = useTransform(useSpring(y), [-0.5, 0.5], ['5deg', '-5deg']);
  const rotateY = useTransform(useSpring(x), [-0.5, 0.5], ['-5deg', '5deg']);
  const handleMouseMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
  };
  return (
    <motion.div
      style={{ rotateX, rotateY, perspective: 1000, display: 'flex', height: '100%' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
    >
      <Box sx={{
        width: '100%', borderRadius: '28px', overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)', ...sx
      }}>
        {children}
      </Box>
    </motion.div>
  );
}

const fade = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 90, damping: 14 } } };
const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };

const PLANS = [
  {
    key: 'basic', name: 'Basic', price: 0, period: 'Free forever',
    desc: 'Core matching and public squads.',
    features: ['Up to 3 connections', 'Public squads only', 'Basic study tracking', 'Push notifications'],
    color: '#64748b', gradient: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
  },
  {
    key: 'pro', name: 'Pro', price: 799, period: '/month (billed annually)',
    desc: 'AI assistant, unlimited networks, and advanced analytics.',
    features: ['Unlimited connections', 'Private squads', 'Gemini AI Tutor', 'Advanced heatmaps', 'Priority support'],
    color: '#6366f1', gradient: 'linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)', popular: true
  },
  {
    key: 'squad', name: 'Squad', price: 1599, period: '/month (billed annually)',
    desc: 'For high-performance groups and institutions.',
    features: ['Everything in Pro', '50 members per squad', 'Unlimited Vault storage', 'Admin moderation', 'Analytics dashboard'],
    color: '#10b981', gradient: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)'
  }
];

export default function Billing() {
  const { user, updateUser } = useAuth();
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const currentPlan = status?.plan || user?.subscription?.plan || 'basic';
  const activeUntil = status?.activeUntil;
  const isRealGateway = status?.isRealGateway;

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, []);

  // Fetch billing status + history on mount
  useEffect(() => {
    const fetchStatus = async () => {
      setStatusLoading(true);
      try {
        const [statusRes, historyRes] = await Promise.all([
          api.get('/billing/status'),
          api.get('/billing/history'),
        ]);
        setStatus(statusRes.data);
        setHistory(historyRes.data || []);
      } catch (e) {
        // Fallback to user object from auth
        setStatus({ plan: user?.subscription?.plan || 'basic', activeUntil: user?.subscription?.activeUntil });
      } finally {
        setStatusLoading(false);
      }
    };
    fetchStatus();
  }, []);

  const handleUpgrade = async (planKey) => {
    if (planKey === currentPlan) return toast('You are already on this plan', { icon: 'ℹ️' });
    if (planKey === 'basic') return toast.error('Use the cancel button to downgrade to Basic.');
    setLoading(true);
    try {
      const { data } = await api.post('/billing/create-order', { plan: planKey });
      const { orderId, amount, currency, key_id, isMock } = data;

      if (isMock) {
        // Dev / demo flow — simulate payment without real card
        const verifyRes = await api.post('/billing/verify', {
          razorpay_order_id: orderId,
          razorpay_payment_id: `pay_demo_${Date.now()}`,
          razorpay_signature: 'mock_signature',
          plan: planKey,
          isMock: true,
        });
        toast.success(verifyRes.data.message);
        // ✅ Use updateUser (not login) — keeps JWT intact
        updateUser({ ...user, subscription: verifyRes.data.subscription });
        setStatus(prev => ({ ...prev, plan: planKey, activeUntil: verifyRes.data.subscription.activeUntil }));
        setLoading(false);
        return;
      }

      // Real Razorpay checkout
      const options = {
        key: key_id,
        amount,
        currency,
        name: 'StudyFriend',
        description: `Upgrade to ${planKey.toUpperCase()}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            const verifyRes = await api.post('/billing/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: planKey,
              isMock: false,
            });
            toast.success(verifyRes.data.message);
            // ✅ Use updateUser — preserves the session token
            updateUser({ ...user, subscription: verifyRes.data.subscription });
            setStatus(prev => ({ ...prev, plan: planKey, activeUntil: verifyRes.data.subscription.activeUntil }));
            // Refresh history
            const h = await api.get('/billing/history');
            setHistory(h.data || []);
          } catch (err) {
            toast.error(err?.response?.data?.message || 'Payment verification failed');
          }
        },
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#6366f1' },
        modal: { ondismiss: () => setLoading(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (r) => {
        toast.error(r.error?.description || 'Payment failed');
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not initiate payment');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (currentPlan === 'basic') return toast('Already on the free plan.', { icon: 'ℹ️' });
    setCancelling(true);
    try {
      const { data } = await api.post('/billing/cancel');
      toast.success(data.message);
      updateUser({ ...user, subscription: data.subscription });
      setStatus(prev => ({ ...prev, plan: 'basic', activeUntil: null }));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not cancel subscription');
    } finally {
      setCancelling(false);
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#020617', py: { xs: 6, md: 10 } }}>
      <Container maxWidth="lg">
        <motion.div initial="hidden" animate="visible" variants={stagger}>

          {/* ── Header ── */}
          <Box textAlign="center" mb={8} component={motion.div} variants={fade}>
            <Typography variant="h3" fontWeight={900} color="white" mb={1.5}
              display="flex" alignItems="center" justifyContent="center" gap={2}>
              <CreditCard color="#6366f1" size={40} /> Subscription &amp; Billing
            </Typography>
            <Typography variant="h6" color="rgba(255,255,255,0.5)">
              Manage your plan and unlock premium StudyFriend tools.
            </Typography>

            {/* Gateway mode indicator */}
            {!statusLoading && (
              <Chip
                icon={isRealGateway ? <ShieldCheck size={14} /> : <AlertCircle size={14} />}
                label={isRealGateway ? 'Live Payments (Razorpay)' : 'Demo Mode — No real payment'}
                size="small"
                sx={{
                  mt: 2,
                  bgcolor: isRealGateway ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                  color: isRealGateway ? '#10b981' : '#f59e0b',
                  fontWeight: 700, border: '1px solid',
                  borderColor: isRealGateway ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)',
                }}
              />
            )}
          </Box>

          {/* ── Active Plan Banner ── */}
          {!statusLoading && currentPlan !== 'basic' && (
            <Box component={motion.div} variants={fade}
              sx={{ mb: 6, p: 3, borderRadius: '20px', bgcolor: 'rgba(99,102,241,0.08)',
                    border: '1px solid rgba(99,102,241,0.2)', display: 'flex',
                    alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <ShieldCheck color="#6366f1" size={32} />
                <Box>
                  <Typography color="white" fontWeight={800} fontSize={18}>
                    Active: {currentPlan.toUpperCase()} Plan
                  </Typography>
                  {activeUntil && (
                    <Typography color="rgba(255,255,255,0.5)" variant="body2" display="flex" alignItems="center" gap={0.5}>
                      <Clock size={13} /> Renews {fmt(activeUntil)}
                    </Typography>
                  )}
                </Box>
              </Box>
              <Button
                size="small" variant="outlined" onClick={handleCancel} disabled={cancelling}
                startIcon={cancelling ? <CircularProgress size={14} color="inherit" /> : null}
                sx={{ borderColor: '#ef4444', color: '#ef4444', borderRadius: '10px', fontWeight: 700,
                      '&:hover': { bgcolor: 'rgba(239,68,68,0.1)' } }}
              >
                Cancel Subscription
              </Button>
            </Box>
          )}

          {/* ── Plans Grid ── */}
          <Grid container spacing={4}>
            {PLANS.map((plan) => {
              const isActive = currentPlan === plan.key;
              return (
                <Grid item xs={12} md={4} key={plan.key}>
                  <motion.div variants={fade} style={{ height: '100%' }}>
                    <TiltCard sx={{
                      background: isActive ? plan.gradient : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isActive ? plan.color : 'rgba(255,255,255,0.06)'}`,
                      p: 4, pt: 5, display: 'flex', flexDirection: 'column',
                      position: 'relative'
                    }}>
                      {plan.popular && !isActive && (
                        <Chip label="RECOMMENDED" size="small" sx={{
                          position: 'absolute', top: 16, right: 16,
                          bgcolor: plan.color, color: 'white', fontWeight: 900, fontSize: '0.65rem'
                        }} />
                      )}
                      {isActive && (
                        <Chip label="✓ ACTIVE" size="small" sx={{
                          position: 'absolute', top: 16, right: 16,
                          bgcolor: '#10b981', color: 'white', fontWeight: 900, fontSize: '0.65rem'
                        }} />
                      )}

                      <Typography variant="h5" fontWeight={900} color="white">{plan.name}</Typography>
                      <Typography variant="body2" color="rgba(255,255,255,0.5)" mt={0.5} mb={3} sx={{ minHeight: 36 }}>
                        {plan.desc}
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 1 }}>
                        {plan.price === 0 ? (
                          <Typography variant="h3" fontWeight={900} color="white">Free</Typography>
                        ) : (
                          <>
                            <Typography variant="caption" color="rgba(255,255,255,0.5)" fontWeight={700} fontSize={18} mt={1}>₹</Typography>
                            <Typography variant="h3" fontWeight={900} color="white" sx={{ letterSpacing: '-2px' }}>
                              {plan.price.toLocaleString('en-IN')}
                            </Typography>
                          </>
                        )}
                      </Box>
                      <Typography variant="caption" color="rgba(255,255,255,0.4)" fontWeight={600} mb={3} display="block">
                        {plan.period}
                      </Typography>

                      <Button
                        fullWidth variant="contained"
                        disabled={isActive || loading || statusLoading}
                        onClick={() => handleUpgrade(plan.key)}
                        startIcon={plan.key !== 'basic' && !isActive ? <Sparkles size={16} /> : null}
                        sx={{
                          borderRadius: '100px', py: 2, fontWeight: 900, fontSize: '0.95rem', mb: 4,
                          bgcolor: isActive ? 'rgba(255,255,255,0.1)' : plan.color,
                          color: isActive ? 'rgba(255,255,255,0.5)' : 'white',
                          boxShadow: isActive ? 'none' : `0 4px 20px ${plan.color}60`,
                          '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' },
                          '&:hover': { bgcolor: plan.color, opacity: 0.85 },
                        }}
                      >
                        {loading && !isActive ? <CircularProgress size={20} color="inherit" /> :
                         isActive ? '✓ Current Plan' :
                         plan.key === 'basic' ? 'Downgrade to Basic' :
                         `Upgrade to ${plan.name}`}
                      </Button>

                      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 3 }} />

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 'auto' }}>
                        {plan.features.map((f) => (
                          <Box key={f} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ width: 22, height: 22, borderRadius: '50%',
                              bgcolor: `${plan.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Check size={13} color={plan.color} strokeWidth={3} />
                            </Box>
                            <Typography variant="body2" color="rgba(255,255,255,0.75)" fontWeight={600}>{f}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </TiltCard>
                  </motion.div>
                </Grid>
              );
            })}
          </Grid>

          {/* ── Payment History ── */}
          <Box component={motion.div} variants={fade} mt={8}>
            <Typography variant="h5" fontWeight={800} color="white" mb={3}
              display="flex" alignItems="center" gap={1.5}>
              <RefreshCw size={22} color="#6366f1" /> Payment History
            </Typography>

            {history.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center', borderRadius: '16px',
                bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <Typography color="rgba(255,255,255,0.4)" fontWeight={600}>
                  No transactions yet. Upgrade to see your history.
                </Typography>
              </Box>
            ) : (
              <Paper sx={{ borderRadius: '16px', overflow: 'hidden', bgcolor: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ '& th': { color: 'rgba(255,255,255,0.5)', fontWeight: 700, borderColor: 'rgba(255,255,255,0.06)', bgcolor: 'rgba(255,255,255,0.02)' } }}>
                      <TableCell>Date</TableCell>
                      <TableCell>Plan</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {history.map((item) => (
                      <TableRow key={item.id} sx={{ '& td': { color: 'white', borderColor: 'rgba(255,255,255,0.04)' } }}>
                        <TableCell>{fmt(item.date)}</TableCell>
                        <TableCell>
                          <Chip label={item.plan?.toUpperCase()} size="small"
                            sx={{ bgcolor: 'rgba(99,102,241,0.15)', color: '#6366f1', fontWeight: 700 }} />
                        </TableCell>
                        <TableCell fontWeight={700}>₹{item.amount?.toLocaleString('en-IN')}</TableCell>
                        <TableCell>
                          <Chip label="Paid" size="small"
                            sx={{ bgcolor: 'rgba(16,185,129,0.15)', color: '#10b981', fontWeight: 700 }} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            )}
          </Box>

          {/* Footer note */}
          <Box mt={6} textAlign="center" component={motion.div} variants={fade}>
            <Typography variant="caption" color="rgba(255,255,255,0.25)">
              {isRealGateway
                ? 'All payments are securely processed by Razorpay. We do not store your card details.'
                : 'Running in demo mode. Add your Razorpay test keys to enable real payments.'}
            </Typography>
          </Box>

        </motion.div>
      </Container>
    </Box>
  );
}
