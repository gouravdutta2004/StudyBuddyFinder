import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Grid, Button, Chip, CircularProgress, Table, TableBody, TableCell, TableHead, TableRow, useTheme, Divider } from '@mui/material';
import { motion } from 'framer-motion';
import { Check, Zap, Users, Shield, Star, CreditCard, Download, Clock, ChevronRight } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const PLANS = [
  {
    key: 'basic',
    name: 'Free',
    price: 0,
    priceLabel: '₹0',
    desc: 'Everything you need to get started.',
    cta: 'Current Plan',
    icon: Shield,
    color: '#6b7280',
    features: [
      '3 active connections',
      'Public study rooms',
      'Basic analytics',
      'Community support',
      '5 AI flashcard sets/month',
    ],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: 799,
    priceLabel: '₹799',
    period: '/month',
    desc: 'For serious learners who want more.',
    cta: 'Upgrade to Pro',
    icon: Zap,
    color: '#6366f1',
    popular: true,
    features: [
      'Unlimited connections',
      'Private study rooms',
      'Advanced analytics & insights',
      'Priority support',
      'Unlimited AI flashcard sets',
      'Custom study goals',
      'Export reports as PDF',
    ],
  },
  {
    key: 'squad',
    name: 'Team',
    price: 1599,
    priceLabel: '₹1,599',
    period: '/month',
    desc: 'Built for study groups and institutions.',
    cta: 'Upgrade to Team',
    icon: Users,
    color: '#10b981',
    features: [
      'Everything in Pro',
      'Up to 50 members per squad',
      'Advanced admin tools',
      'Shared analytics dashboard',
      'Dedicated success manager',
      'API access',
      'Custom branding',
    ],
  },
];

export default function Billing() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { user, updateUser } = useAuth();
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const currentPlan = status?.plan || user?.subscription?.plan || 'basic';
  const activeUntil = status?.activeUntil;
  const isRealGateway = status?.isRealGateway;

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, []);

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
      } catch {
        setStatus({ plan: user?.subscription?.plan || 'basic', activeUntil: user?.subscription?.activeUntil });
      } finally {
        setStatusLoading(false);
      }
    };
    fetchStatus();
  }, [user?.subscription]);

  const handleUpgrade = async (planKey) => {
    if (planKey === currentPlan) return toast('You are already on this plan.', { icon: 'ℹ️' });
    if (planKey === 'basic') return toast.error('Use Cancel Subscription to downgrade.');
    setLoading(true);
    try {
      const { data } = await api.post('/billing/create-order', { plan: planKey });
      const { orderId, amount, currency, key_id, isMock } = data;

      if (isMock) {
        const verifyRes = await api.post('/billing/verify', {
          razorpay_order_id: orderId, razorpay_payment_id: `demo_${Date.now()}`,
          razorpay_signature: 'mock_sig', plan: planKey, isMock: true,
        });
        toast.success('Plan upgraded successfully!');
        updateUser({ ...user, subscription: verifyRes.data.subscription });
        setStatus(prev => ({ ...prev, plan: planKey, activeUntil: verifyRes.data.subscription.activeUntil }));
        setLoading(false);
        return;
      }

      const options = {
        key: key_id, amount, currency, name: 'StudyBuddy', description: `Upgrade to ${planKey}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            const verifyRes = await api.post('/billing/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: planKey, isMock: false,
            });
            toast.success('Plan upgraded successfully!');
            updateUser({ ...user, subscription: verifyRes.data.subscription });
            setStatus(prev => ({ ...prev, plan: planKey, activeUntil: verifyRes.data.subscription.activeUntil }));
            const h = await api.get('/billing/history');
            setHistory(h.data || []);
          } catch { toast.error('Payment verification failed.'); }
        },
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#6366f1' },
        modal: { ondismiss: () => setLoading(false) },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => { toast.error('Payment failed.'); setLoading(false); });
      rzp.open();
    } catch { toast.error('Could not initiate payment.'); } finally { setLoading(false); }
  };

  const handleCancel = async () => {
    if (currentPlan === 'basic') return toast('You are on the free plan.', { icon: 'ℹ️' });
    if (!window.confirm('Are you sure you want to cancel your subscription?')) return;
    setCancelling(true);
    try {
      const { data } = await api.post('/billing/cancel');
      toast.success('Subscription cancelled.');
      updateUser({ ...user, subscription: data.subscription });
      setStatus(prev => ({ ...prev, plan: 'basic', activeUntil: null }));
    } catch { toast.error('Cancellation failed.'); } finally { setCancelling(false); }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

  const bg = isDark ? '#0f172a' : '#f8fafc';
  const cardBg = isDark ? '#0d1117' : '#ffffff';
  const borderC = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
  const textPrimary = isDark ? 'white' : '#0f172a';
  const textSecondary = isDark ? 'rgba(255,255,255,0.55)' : '#6b7280';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: bg, py: { xs: 5, md: 8 } }}>
      <Container maxWidth="lg">

        {/* Page Header */}
        <Box sx={{ mb: 8, textAlign: 'center' }}>
          <Typography sx={{ fontWeight: 900, fontSize: { xs: '2rem', md: '2.6rem' }, color: textPrimary, letterSpacing: -1, lineHeight: 1.15, mb: 1.5 }}>
            Simple, transparent pricing
          </Typography>
          <Typography sx={{ fontSize: '1.05rem', color: textSecondary, maxWidth: 480, mx: 'auto', lineHeight: 1.6 }}>
            Choose the plan that best fits your study goals. Upgrade or cancel at any time.
          </Typography>

          {/* Current plan indicator */}
          {!statusLoading && (
            <Box sx={{ mt: 3, display: 'inline-flex', alignItems: 'center', gap: 1.5, px: 3, py: 1.25, borderRadius: '12px', bgcolor: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.8)' }} />
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#6366f1' }}>
                Current plan: <strong>{PLANS.find(p => p.key === currentPlan)?.name || 'Free'}</strong>
                {activeUntil && ` · Renews ${fmt(activeUntil)}`}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Plan Cards */}
        <Grid container spacing={2.5} sx={{ mb: 8 }} alignItems="stretch">
          {PLANS.map((plan, i) => {
            const isActive = currentPlan === plan.key;
            const Icon = plan.icon;

            return (
              <Grid item xs={12} md={4} key={plan.key} sx={{ display: 'flex' }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  style={{ width: '100%' }}
                >
                  <Box sx={{
                    height: '100%', display: 'flex', flexDirection: 'column',
                    borderRadius: '20px', overflow: 'hidden',
                    bgcolor: cardBg,
                    border: `1.5px solid ${isActive ? plan.color + '55' : (plan.popular ? plan.color + '33' : borderC)}`,
                    boxShadow: plan.popular
                      ? `0 0 0 1px ${plan.color}22, 0 8px 32px ${plan.color}18, ${isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.07)'}`
                      : isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 16px rgba(0,0,0,0.06)',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: `0 8px 40px ${plan.color}22, ${isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.1)'}`,
                      transform: 'translateY(-2px)',
                    },
                    position: 'relative',
                  }}>
                    {/* Most Popular badge */}
                    {plan.popular && (
                      <Box sx={{
                        position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
                        px: 2, py: 0.5,
                        background: `linear-gradient(135deg, ${plan.color}, #8b5cf6)`,
                        borderRadius: '0 0 10px 10px',
                        display: 'flex', alignItems: 'center', gap: 0.75,
                      }}>
                        <Star size={10} color="white" fill="white" />
                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: 'white', letterSpacing: 0.5 }}>
                          MOST POPULAR
                        </Typography>
                      </Box>
                    )}

                    {/* Card content */}
                    <Box sx={{ p: 3.5, pt: plan.popular ? 4.5 : 3.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                      {/* Icon + Name */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                        <Box sx={{
                          width: 40, height: 40, borderRadius: '10px',
                          bgcolor: plan.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: `1px solid ${plan.color}25`,
                        }}>
                          <Icon size={20} color={plan.color} />
                        </Box>
                        <Box>
                          <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: textPrimary }}>
                            {plan.name}
                          </Typography>
                          {isActive && (
                            <Chip
                              label="Active"
                              size="small"
                              sx={{
                                height: 18, fontSize: '0.6rem', fontWeight: 800,
                                bgcolor: plan.color + '18', color: plan.color,
                                border: `1px solid ${plan.color}33`,
                              }}
                            />
                          )}
                        </Box>
                      </Box>

                      {/* Price */}
                      <Box sx={{ mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                          <Typography sx={{ fontWeight: 900, fontSize: '2.2rem', color: textPrimary, letterSpacing: -1 }}>
                            {plan.priceLabel}
                          </Typography>
                          {plan.period && (
                            <Typography sx={{ fontSize: '0.85rem', color: textSecondary, fontWeight: 500 }}>
                              {plan.period}
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      {/* Desc */}
                      <Typography sx={{ fontSize: '0.85rem', color: textSecondary, mb: 2.5, lineHeight: 1.5 }}>
                        {plan.desc}
                      </Typography>

                      {/* Divider */}
                      <Divider sx={{ borderColor: borderC, mb: 2.5 }} />

                      {/* Features */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, flex: 1, mb: 3 }}>
                        {plan.features.map(f => (
                          <Box key={f} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
                            <Box sx={{
                              width: 18, height: 18, borderRadius: '5px', flexShrink: 0, mt: 0.1,
                              bgcolor: plan.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Check size={11} color={plan.color} strokeWidth={3} />
                            </Box>
                            <Typography sx={{ fontSize: '0.85rem', color: textSecondary, lineHeight: 1.4 }}>{f}</Typography>
                          </Box>
                        ))}
                      </Box>

                      {/* CTA */}
                      <Button
                        fullWidth
                        onClick={() => handleUpgrade(plan.key)}
                        disabled={isActive || loading || statusLoading}
                        variant={plan.popular ? 'contained' : 'outlined'}
                        endIcon={!isActive && <ChevronRight size={15} />}
                        sx={plan.popular
                          ? {
                            background: `linear-gradient(135deg, ${plan.color}, #8b5cf6)`,
                            color: 'white', borderRadius: '12px', py: 1.4, fontWeight: 700,
                            textTransform: 'none', fontSize: '0.9rem',
                            boxShadow: `0 4px 16px ${plan.color}40`,
                            '&:hover': { opacity: 0.92, boxShadow: `0 6px 20px ${plan.color}55` },
                            '&.Mui-disabled': { bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', color: 'text.disabled', boxShadow: 'none' },
                          }
                          : {
                            borderRadius: '12px', py: 1.4, fontWeight: 700, textTransform: 'none', fontSize: '0.9rem',
                            borderColor: isActive ? plan.color + '44' : borderC,
                            color: isActive ? plan.color : textSecondary,
                            '&:hover': { borderColor: plan.color, color: plan.color, bgcolor: plan.color + '06' },
                            '&.Mui-disabled': { borderColor: borderC, color: 'text.disabled' },
                          }
                        }
                      >
                        {loading && !isActive ? '...' : isActive ? 'Current Plan' : plan.cta}
                      </Button>
                    </Box>
                  </Box>
                </motion.div>
              </Grid>
            );
          })}
        </Grid>

        {/* Payment Method Row */}
        <Box sx={{
          p: 3, borderRadius: '16px', bgcolor: cardBg,
          border: `1px solid ${borderC}`,
          display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 6,
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 16px rgba(0,0,0,0.05)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(99,102,241,0.2)' }}>
              <CreditCard size={20} color="#6366f1" />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: textPrimary }}>Payment Method</Typography>
              <Typography sx={{ fontSize: '0.78rem', color: textSecondary }}>Powered by Razorpay · UPI, Cards, Net Banking accepted</Typography>
            </Box>
          </Box>
          <Box sx={{ ml: 'auto', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {['Visa', 'Mastercard', 'UPI', 'RuPay'].map(m => (
              <Box key={m} sx={{ px: 1.5, py: 0.5, borderRadius: '6px', bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', border: `1px solid ${borderC}` }}>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: textSecondary }}>{m}</Typography>
              </Box>
            ))}
          </Box>
          {currentPlan !== 'basic' && (
            <Button
              variant="text"
              size="small"
              onClick={handleCancel}
              disabled={cancelling}
              sx={{ color: '#ef4444', fontWeight: 600, fontSize: '0.78rem', textTransform: 'none', '&:hover': { bgcolor: 'rgba(239,68,68,0.06)' } }}
            >
              {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
            </Button>
          )}
        </Box>

        {/* Billing History */}
        {history.length > 0 && (
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: textPrimary, mb: 2 }}>
              Billing History
            </Typography>
            <Box sx={{
              borderRadius: '16px', border: `1px solid ${borderC}`, overflow: 'hidden',
              bgcolor: cardBg, boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 16px rgba(0,0,0,0.05)',
            }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                    {['Date', 'Plan', 'Amount', 'Status', 'Invoice'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.78rem', color: textSecondary, borderColor: borderC, py: 1.5 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((item) => (
                    <TableRow key={item.id} sx={{ '& td': { borderColor: borderC, py: 1.5 }, '&:last-child td': { borderBottom: 'none' } }}>
                      <TableCell sx={{ fontSize: '0.85rem', color: textSecondary }}>{fmt(item.date)}</TableCell>
                      <TableCell>
                        <Chip label={item.plan} size="small" sx={{ bgcolor: 'rgba(99,102,241,0.1)', color: '#818cf8', fontWeight: 700, fontSize: '0.7rem', textTransform: 'capitalize' }} />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.87rem', color: textPrimary }}>₹{item.amount?.toLocaleString('en-IN')}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#22c55e' }} />
                          <Typography sx={{ fontSize: '0.82rem', color: '#22c55e', fontWeight: 600 }}>Paid</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Button size="small" startIcon={<Download size={12} />}
                          sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 600, color: textSecondary, '&:hover': { color: '#6366f1' } }}>
                          PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Box>
        )}

      </Container>
    </Box>
  );
}
