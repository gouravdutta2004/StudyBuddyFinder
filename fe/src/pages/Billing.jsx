import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Zap, Users, Shield, Star, CreditCard, Download, ArrowUpRight, Sparkles, TrendingUp, Lock, Wallet, RefreshCw, ChevronRight, AlertCircle, Calendar, Clock } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

/* ─── Plan base meta (static, prices overridden from API) ─── */
const PLAN_META = [
  {
    key: 'basic', name: 'Starter', price: 0, priceLabel: '₹0', period: 'forever',
    desc: 'Essential tools to begin your study journey.',
    cta: 'Current Plan', icon: Shield, color: '#64748b', gradient: 'linear-gradient(135deg,#64748b,#475569)',
    features: ['3 active connections','Public study rooms','Basic analytics','Community support','5 AI flashcard sets/month'],
  },
  {
    key: 'pro', name: 'Pro', price: 799, priceLabel: '₹799', period: '/month',
    desc: 'Unlock the full power of collaborative learning.',
    cta: 'Activate Pro', icon: Zap, color: '#6366f1', gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    popular: true,
    features: ['Unlimited connections','Private study rooms','Advanced analytics & insights','Priority support','Unlimited AI flashcard sets','Custom study goals','Export reports as PDF'],
  },
  {
    key: 'squad', name: 'Team', price: 1599, priceLabel: '₹1,599', period: '/month',
    desc: 'Built for high-performance study groups.',
    cta: 'Activate Team', icon: Users, color: '#10b981', gradient: 'linear-gradient(135deg,#10b981,#059669)',
    features: ['Everything in Pro','Up to 50 members per squad','Advanced admin tools','Shared analytics dashboard','Dedicated success manager','API access','Custom branding'],
  },
];

const PAYMENT_METHODS = [
  { label: 'VISA', color: '#1a1f71' }, { label: 'MC', color: '#eb001b' },
  { label: 'UPI', color: '#1a73e8' }, { label: 'RuPay', color: '#10b981' },
];

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

/* ─── Wallet Card ─── */
function WalletCard({ currentPlan, activeUntil, billingCycle, statusLoading }) {
  const plan = PLAN_META.find(p => p.key === currentPlan) || PLAN_META[0];
  const cardRef = useRef(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const onMove = (e) => {
      const r = card.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - 0.5) * 18;
      const y = ((e.clientY - r.top) / r.height - 0.5) * 12;
      card.style.transform = `perspective(800px) rotateX(${-y}deg) rotateY(${x}deg) scale(1.02)`;
    };
    const onLeave = () => { card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)'; };
    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', onLeave);
    return () => { card.removeEventListener('mousemove', onMove); card.removeEventListener('mouseleave', onLeave); };
  }, []);

  return (
    <div ref={cardRef} style={{
      position: 'relative', borderRadius: 28, padding: '2rem 2.25rem',
      background: plan.gradient, color: '#fff',
      boxShadow: `0 20px 60px ${plan.color}55, 0 4px 20px rgba(0,0,0,0.4)`,
      overflow: 'hidden', transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)',
      willChange: 'transform', cursor: 'default', minHeight: 200,
    }}>
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(145deg,rgba(255,255,255,0.18) 0%,transparent 55%)', borderRadius:28, pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:-60, right:-60, width:220, height:220, borderRadius:'50%', background:'rgba(255,255,255,0.07)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:-40, left:-40, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,0.05)', pointerEvents:'none' }} />

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem', position:'relative', zIndex:1 }}>
        <div>
          <div style={{ fontSize:'0.68rem', fontWeight:700, letterSpacing:'0.18em', opacity:0.7, textTransform:'uppercase', marginBottom:4 }}>StudyFriend</div>
          <div style={{ fontSize:'1.4rem', fontWeight:900, letterSpacing:'-0.5px' }}>{plan.name} Plan</div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end' }}>
          <div style={{ background:'rgba(255,255,255,0.18)', backdropFilter:'blur(10px)', borderRadius:12, padding:'6px 12px', display:'flex', alignItems:'center', gap:6, border:'1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:'#4ade80', boxShadow:'0 0 8px #4ade80' }} />
            <span style={{ fontSize:'0.7rem', fontWeight:700 }}>ACTIVE</span>
          </div>
          {plan.price > 0 && billingCycle && (
            <div style={{ background:'rgba(255,255,255,0.12)', backdropFilter:'blur(10px)', borderRadius:8, padding:'4px 10px', border:'1px solid rgba(255,255,255,0.15)' }}>
              <span style={{ fontSize:'0.62rem', fontWeight:800, letterSpacing:'0.08em', textTransform:'uppercase' }}>
                {billingCycle === 'annual' ? '📅 Annual' : '🗓️ Monthly'}
              </span>
            </div>
          )}
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1.5rem', position:'relative', zIndex:1 }}>
        <plan.icon size={36} strokeWidth={1.5} />
        <div>
          <div style={{ fontSize:'0.72rem', opacity:0.65, marginBottom:2 }}>Current Cycle</div>
          <div style={{ fontSize:'1rem', fontWeight:800 }}>
            {activeUntil ? `Renews ${fmt(activeUntil)}` : plan.price === 0 ? 'No expiry · Free forever' : '—'}
          </div>
        </div>
      </div>

      <div style={{ display:'flex', gap:8, position:'relative', zIndex:1 }}>
        {PAYMENT_METHODS.map(m => (
          <div key={m.label} style={{ background:'rgba(255,255,255,0.15)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:6, padding:'3px 9px', fontSize:'0.62rem', fontWeight:800, letterSpacing:'0.05em' }}>
            {m.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Stat Pill ─── */
function StatPill({ icon: Icon, label, value, color }) {
  return (
    <div style={{ flex:1, minWidth:120, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:'1rem 1.25rem', display:'flex', flexDirection:'column', gap:8 }}>
      <div style={{ width:34, height:34, borderRadius:10, background:color+'20', border:`1px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Icon size={16} color={color} />
      </div>
      <div style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.45)', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>{label}</div>
      <div style={{ fontSize:'1.15rem', fontWeight:900, color:'#f0f0f5' }}>{value}</div>
    </div>
  );
}

/* ─── Billing Toggle ─── */
function BillingToggle({ billingCycle, onChange, annualDiscount }) {
  const isAnnual = billingCycle === 'annual';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.6rem 1rem', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, width:'fit-content' }}>
      <button
        onClick={() => onChange('monthly')}
        style={{
          padding:'0.45rem 1rem', borderRadius:10, border:'none', cursor:'pointer', fontFamily:'inherit', fontWeight:700, fontSize:'0.8rem', transition:'all 0.2s',
          background: !isAnnual ? 'rgba(99,102,241,0.25)' : 'transparent',
          color: !isAnnual ? '#818cf8' : 'rgba(255,255,255,0.4)',
          outline:'none',
        }}
      >
        <Clock size={12} style={{ marginRight:4, verticalAlign:'middle' }} />
        Monthly
      </button>
      <button
        onClick={() => onChange('annual')}
        style={{
          padding:'0.45rem 1rem', borderRadius:10, border:'none', cursor:'pointer', fontFamily:'inherit', fontWeight:700, fontSize:'0.8rem', transition:'all 0.2s', display:'flex', alignItems:'center', gap:6,
          background: isAnnual ? 'rgba(16,185,129,0.2)' : 'transparent',
          color: isAnnual ? '#34d399' : 'rgba(255,255,255,0.4)',
          outline:'none',
        }}
      >
        <Calendar size={12} />
        Annual
        {annualDiscount > 0 && (
          <span style={{ background:'linear-gradient(135deg,#10b981,#059669)', color:'white', borderRadius:9999, padding:'1px 7px', fontSize:'0.6rem', fontWeight:900, letterSpacing:'0.05em' }}>
            -{annualDiscount}%
          </span>
        )}
      </button>
    </div>
  );
}

/* ─── Plan Card ─── */
function PlanCard({ plan, isActive, loading, statusLoading, onUpgrade, billingCycle }) {
  const Icon = plan.icon;
  const isAnnual = billingCycle === 'annual';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      style={{
        flex: 1, minWidth: 260,
        background: isActive ? `${plan.color}10` : 'rgba(255,255,255,0.03)',
        border: `1.5px solid ${isActive ? plan.color + '55' : plan.popular ? plan.color + '30' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 24, padding: '1.75rem',
        display: 'flex', flexDirection: 'column',
        position: 'relative', overflow: 'hidden',
        boxShadow: plan.popular ? `0 0 40px ${plan.color}20` : 'none',
        cursor: 'default',
      }}
    >
      {plan.popular && (
        <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', background:plan.gradient, borderRadius:'0 0 12px 12px', padding:'4px 14px', display:'flex', alignItems:'center', gap:5 }}>
          <Star size={9} fill="white" color="white" />
          <span style={{ fontSize:'0.6rem', fontWeight:800, color:'white', letterSpacing:1 }}>MOST POPULAR</span>
        </div>
      )}
      <div style={{ position:'absolute', top:-40, right:-40, width:150, height:150, borderRadius:'50%', background:`radial-gradient(circle, ${plan.color}18, transparent 70%)`, pointerEvents:'none' }} />

      <div style={{ paddingTop: plan.popular ? '1.25rem' : 0, position:'relative', zIndex:1, display:'flex', flexDirection:'column', flex:1 }}>
        {/* Icon + name */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:'1rem' }}>
          <div style={{ width:42, height:42, borderRadius:12, background:plan.gradient, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 6px 16px ${plan.color}40` }}>
            <Icon size={20} color="white" />
          </div>
          <div>
            <div style={{ fontWeight:800, fontSize:'1rem', color:'#f0f0f5' }}>{plan.name}</div>
            {isActive && (
              <div style={{ display:'inline-flex', alignItems:'center', gap:4, marginTop:2, background:plan.color+'20', border:`1px solid ${plan.color}40`, borderRadius:9999, padding:'1px 8px' }}>
                <div style={{ width:5, height:5, borderRadius:'50%', background:plan.color }} />
                <span style={{ fontSize:'0.58rem', fontWeight:800, color:plan.color }}>ACTIVE</span>
              </div>
            )}
          </div>
        </div>

        {/* Price */}
        {plan.key === 'basic' ? (
          <div style={{ marginBottom:'0.75rem' }}>
            <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
              <span style={{ fontWeight:900, fontSize:'2.1rem', color:'#f0f0f5', letterSpacing:'-1px', fontFamily:'Space Grotesk, sans-serif' }}>₹0</span>
              <span style={{ fontSize:'0.82rem', color:'rgba(255,255,255,0.4)', fontWeight:500 }}>forever</span>
            </div>
            <div style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.45)', marginTop:4 }}>{plan.desc}</div>
          </div>
        ) : (
          <div style={{ marginBottom:'0.75rem' }}>
            <div style={{ display:'flex', alignItems:'baseline', gap:6, flexWrap:'wrap' }}>
              {/* Strikethrough: show original monthly when annual, or promo original */}
              {isAnnual && plan.annualOriginalMonthly && (
                <span style={{ fontWeight:600, fontSize:'1rem', color:'rgba(255,255,255,0.3)', textDecoration:'line-through', fontFamily:'Space Grotesk, sans-serif' }}>
                  ₹{plan.annualOriginalMonthly.toLocaleString('en-IN')}
                </span>
              )}
              {!isAnnual && plan.originalPriceLabel && (
                <span style={{ fontWeight:600, fontSize:'1rem', color:'rgba(255,255,255,0.3)', textDecoration:'line-through', fontFamily:'Space Grotesk, sans-serif' }}>
                  {plan.originalPriceLabel}
                </span>
              )}
              <span style={{ fontWeight:900, fontSize:'2.1rem', color:'#f0f0f5', letterSpacing:'-1px', fontFamily:'Space Grotesk, sans-serif' }}>
                {isAnnual ? `₹${plan.annualMonthly?.toLocaleString('en-IN') ?? plan.priceLabel}` : plan.priceLabel}
              </span>
              <span style={{ fontSize:'0.82rem', color:'rgba(255,255,255,0.4)', fontWeight:500 }}>/month</span>
            </div>

            {/* Annual total badge */}
            {isAnnual && plan.annualTotal && (
              <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4, flexWrap:'wrap' }}>
                <span style={{ fontSize:'0.7rem', background:'linear-gradient(135deg,#10b981,#059669)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontWeight:800 }}>
                  📅 ₹{plan.annualTotal?.toLocaleString('en-IN')} billed annually
                </span>
                {plan.annualDiscount > 0 && (
                  <span style={{ background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:9999, padding:'1px 7px', fontSize:'0.6rem', fontWeight:800, color:'#34d399' }}>
                    Save {plan.annualDiscount}%
                  </span>
                )}
              </div>
            )}

            {!isAnnual && plan.originalPriceLabel && (
              <div style={{ fontSize:'0.7rem', color:'#10b981', fontWeight:700, marginTop:2 }}>🏷️ Special Discount Applied</div>
            )}
            <div style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.45)', marginTop:4 }}>{plan.desc}</div>
          </div>
        )}

        <div style={{ height:1, background:'rgba(255,255,255,0.07)', margin:'1rem 0' }} />

        <div style={{ display:'flex', flexDirection:'column', gap:10, flex:1, marginBottom:'1.5rem' }}>
          {plan.features.map(f => (
            <div key={f} style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
              <div style={{ width:18, height:18, borderRadius:6, background:plan.color+'22', flexShrink:0, marginTop:1, display:'flex', alignItems:'center', justifyContent:'center', border:`1px solid ${plan.color}35` }}>
                <Check size={10} color={plan.color} strokeWidth={3} />
              </div>
              <span style={{ fontSize:'0.82rem', color:'rgba(255,255,255,0.55)', lineHeight:1.45 }}>{f}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => onUpgrade(plan.key)}
          disabled={isActive || loading || statusLoading}
          style={{
            width:'100%', padding:'0.85rem', borderRadius:14,
            background: isActive ? 'rgba(255,255,255,0.06)' : plan.popular ? plan.gradient : `rgba(${plan.color === '#64748b' ? '100,116,139' : plan.color === '#10b981' ? '16,185,129' : '99,102,241'},0.15)`,
            color: isActive ? 'rgba(255,255,255,0.3)' : 'white',
            fontWeight:700, fontSize:'0.88rem', cursor: isActive ? 'default' : 'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            transition:'all 0.2s',
            boxShadow: plan.popular && !isActive ? `0 6px 20px ${plan.color}50` : 'none',
            outline:'none', fontFamily:'inherit',
            border: !plan.popular && !isActive ? `1px solid ${plan.color}40` : 'none',
          }}
        >
          {loading && !isActive ? <RefreshCw size={14} style={{ animation:'spin 1s linear infinite' }} /> : null}
          {isActive ? 'Current Plan' : plan.cta}
          {!isActive && !loading && <ChevronRight size={14} />}
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Transaction Row ─── */
function TxRow({ item }) {
  return (
    <motion.div
      initial={{ opacity:0, x:-10 }}
      animate={{ opacity:1, x:0 }}
      style={{ display:'flex', alignItems:'center', gap:14, padding:'0.9rem 1.25rem', borderBottom:'1px solid rgba(255,255,255,0.05)', transition:'background 0.15s' }}
      whileHover={{ background:'rgba(255,255,255,0.025)' }}
    >
      <div style={{ width:38, height:38, borderRadius:12, background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <TrendingUp size={16} color="#6366f1" />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:700, fontSize:'0.85rem', color:'#f0f0f5', textTransform:'capitalize' }}>
          {item.plan} Plan Upgrade
          {item.billingCycle && <span style={{ marginLeft:6, fontSize:'0.65rem', background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.25)', borderRadius:6, padding:'1px 6px', color:'#818cf8', fontWeight:800 }}>{item.billingCycle}</span>}
        </div>
        <div style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.4)', marginTop:2 }}>{fmt(item.date)}</div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginRight:8 }}>
        <div style={{ width:6, height:6, borderRadius:'50%', background:'#4ade80' }} />
        <span style={{ fontSize:'0.72rem', color:'#4ade80', fontWeight:700 }}>Paid</span>
      </div>
      <div style={{ fontWeight:800, fontSize:'0.95rem', color:'#f0f0f5', marginRight:12, fontFamily:'Space Grotesk, monospace' }}>
        ₹{item.amount?.toLocaleString('en-IN')}
      </div>
      <button
        style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'5px 10px', cursor:'pointer', display:'flex', alignItems:'center', gap:4, color:'rgba(255,255,255,0.5)', fontSize:'0.7rem', fontWeight:700, transition:'all 0.15s', fontFamily:'inherit' }}
        onMouseEnter={e => { e.currentTarget.style.background='rgba(99,102,241,0.15)'; e.currentTarget.style.color='#6366f1'; }}
        onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.color='rgba(255,255,255,0.5)'; }}
      >
        <Download size={11} /> PDF
      </button>
    </motion.div>
  );
}

/* ─── Main Billing Page ─── */
export default function Billing() {
  const { user, updateUser } = useAuth();
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [activeTab, setActiveTab] = useState('plans');
  const [livePricing, setLivePricing] = useState({});
  const [billingCycle, setBillingCycle] = useState('monthly');

  // Merge live admin pricing into plan definitions for selected cycle
  const PLANS = PLAN_META.map(p => {
    if (p.key === 'basic') return p;
    const live = livePricing[p.key];
    if (!live) return p;
    return {
      ...p,
      price: live.effectivePrice,
      priceLabel: `₹${live.effectivePrice.toLocaleString('en-IN')}`,
      originalPrice: live.originalPrice || null,
      originalPriceLabel: live.originalPrice ? `₹${live.originalPrice.toLocaleString('en-IN')}` : null,
      annualDiscount: live.annualDiscount || 0,
      annualMonthly: live.annualMonthly,
      annualTotal: live.annualTotal,
      annualOriginalMonthly: live.annualOriginalMonthly,
    };
  });

  const currentPlan = status?.plan || user?.subscription?.plan || 'basic';
  const activeUntil = status?.activeUntil;
  const currentBillingCycle = status?.billingCycle || 'monthly';

  // Determine max annual discount across plans to show in toggle
  const maxAnnualDiscount = Math.max(...Object.values(livePricing).map(p => p.annualDiscount || 0), 0);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      setStatusLoading(true);
      try {
        const [sRes, hRes, pRes] = await Promise.all([
          api.get('/billing/status'),
          api.get('/billing/history'),
          api.get('/billing/pricing').catch(() => ({ data: {} })),
        ]);
        setStatus(sRes.data);
        setHistory(hRes.data || []);
        setLivePricing(pRes.data || {});
      } catch {
        setStatus({ plan: user?.subscription?.plan || 'basic', activeUntil: user?.subscription?.activeUntil, billingCycle: 'monthly' });
      } finally { setStatusLoading(false); }
    };
    fetchAll();
  }, [user?.subscription]);

  const handleUpgrade = async (planKey) => {
    if (planKey === currentPlan) return toast('You are already on this plan.', { icon: 'ℹ️' });
    if (planKey === 'basic') return toast.error('Use Cancel Subscription to downgrade.');
    setLoading(true);
    try {
      const { data } = await api.post('/billing/create-order', { plan: planKey, billingCycle });
      const { orderId, amount, currency, key_id, isMock } = data;
      if (isMock) {
        const vRes = await api.post('/billing/verify', {
          razorpay_order_id: orderId, razorpay_payment_id: `demo_${Date.now()}`,
          razorpay_signature: 'mock_sig', plan: planKey, isMock: true, billingCycle,
        });
        toast.success(`Plan upgraded! (${billingCycle})`);
        updateUser({ ...user, subscription: vRes.data.subscription });
        setStatus(p => ({ ...p, plan: planKey, activeUntil: vRes.data.subscription.activeUntil, billingCycle }));
        setLoading(false); return;
      }
      const cycleLabel = billingCycle === 'annual' ? ' (Annual)' : ' (Monthly)';
      const options = {
        key: key_id, amount, currency, name: 'StudyFriend',
        description: `Upgrade to ${planKey}${cycleLabel}`, order_id: orderId,
        handler: async (response) => {
          try {
            const vRes = await api.post('/billing/verify', { ...response, plan: planKey, isMock: false, billingCycle });
            toast.success(`Plan upgraded! (${billingCycle})`);
            updateUser({ ...user, subscription: vRes.data.subscription });
            setStatus(p => ({ ...p, plan: planKey, activeUntil: vRes.data.subscription.activeUntil, billingCycle }));
            const h = await api.get('/billing/history');
            setHistory(h.data || []);
          } catch { toast.error('Verification failed.'); }
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
    if (!window.confirm('Cancel your subscription?')) return;
    setCancelling(true);
    try {
      const { data } = await api.post('/billing/cancel');
      toast.success('Subscription cancelled.');
      updateUser({ ...user, subscription: data.subscription });
      setStatus(p => ({ ...p, plan: 'basic', activeUntil: null, billingCycle: 'monthly' }));
    } catch { toast.error('Cancellation failed.'); } finally { setCancelling(false); }
  };

  const totalSpent = history.reduce((acc, h) => acc + (h.amount || 0), 0);

  return (
    <div style={{ minHeight:'100vh', background:'#080c14', padding:'2.5rem 1.5rem 4rem', fontFamily:'Inter, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>

      <div style={{ maxWidth:1100, margin:'0 auto' }}>

        {/* Page header */}
        <div style={{ marginBottom:'2.5rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
            <Wallet size={22} color="#6366f1" />
            <h1 style={{ margin:0, fontFamily:'Space Grotesk, sans-serif', fontWeight:900, fontSize:'1.75rem', color:'#f0f0f5', letterSpacing:'-0.5px' }}>Billing & Wallet</h1>
          </div>
          <p style={{ margin:0, fontSize:'0.9rem', color:'rgba(255,255,255,0.4)' }}>Manage your subscription, payments, and invoices.</p>
        </div>

        {/* Top layout: Wallet card + Stats */}
        <div style={{ display:'flex', gap:'1.5rem', flexWrap:'wrap', marginBottom:'2rem' }}>
          <div style={{ flex:'1 1 320px', minWidth:300 }}>
            <WalletCard currentPlan={currentPlan} activeUntil={activeUntil} billingCycle={currentBillingCycle} statusLoading={statusLoading} />
          </div>
          <div style={{ flex:'1 1 280px', display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div style={{ display:'flex', gap:'0.85rem', flexWrap:'wrap', flex:1 }}>
              <StatPill icon={TrendingUp} label="Total Spent" value={`₹${totalSpent.toLocaleString('en-IN')}`} color="#6366f1" />
              <StatPill icon={Sparkles} label="Transactions" value={history.length} color="#10b981" />
              <StatPill icon={Lock} label="Secure Gateway" value="Razorpay" color="#f59e0b" />
            </div>
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'1rem 1.25rem', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
              <CreditCard size={16} color="rgba(255,255,255,0.5)" />
              <span style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.45)', fontWeight:600, flex:1 }}>Accepted payments</span>
              {PAYMENT_METHODS.map(m => (
                <div key={m.label} style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, padding:'2px 9px', fontSize:'0.65rem', fontWeight:800, color:'rgba(255,255,255,0.6)', letterSpacing:'0.05em' }}>{m.label}</div>
              ))}
            </div>
            {currentPlan !== 'basic' && (
              <button
                onClick={handleCancel} disabled={cancelling}
                style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:12, padding:'0.7rem 1rem', color:'#f87171', fontWeight:700, fontSize:'0.82rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6, transition:'all 0.2s', fontFamily:'inherit', outline:'none' }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.14)'; }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(239,68,68,0.08)'; }}
              >
                <AlertCircle size={14} /> {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:6, marginBottom:'1.5rem', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:5, width:'fit-content' }}>
          {[{ id:'plans', label:'Plans' }, { id:'history', label:'Transaction History' }].map(tab => (
            <button
              key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ background: activeTab===tab.id?'rgba(99,102,241,0.22)':'transparent', border: activeTab===tab.id?'1px solid rgba(99,102,241,0.35)':'1px solid transparent', borderRadius:10, padding:'0.5rem 1.1rem', color: activeTab===tab.id?'#818cf8':'rgba(255,255,255,0.4)', fontWeight:700, fontSize:'0.82rem', cursor:'pointer', transition:'all 0.2s', fontFamily:'inherit', outline:'none' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'plans' && (
            <motion.div key="plans" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.3 }}>

              {/* ── Billing Cycle Toggle ── */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem', marginBottom:'1.5rem' }}>
                <BillingToggle billingCycle={billingCycle} onChange={setBillingCycle} annualDiscount={maxAnnualDiscount} />
                {billingCycle === 'annual' && maxAnnualDiscount > 0 && (
                  <motion.div
                    initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'0.5rem 1rem', background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:12 }}
                  >
                    <span style={{ fontSize:'0.75rem', color:'#34d399', fontWeight:700 }}>
                      🎉 You save up to {maxAnnualDiscount}% with annual billing!
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Plan cards */}
              <div style={{ display:'flex', gap:'1.25rem', flexWrap:'wrap' }}>
                {PLANS.map(plan => (
                  <PlanCard key={plan.key} plan={plan} isActive={currentPlan === plan.key} loading={loading} statusLoading={statusLoading} onUpgrade={handleUpgrade} billingCycle={billingCycle} />
                ))}
              </div>

              {/* Info strip */}
              <div style={{ marginTop:'1.5rem', background:'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.15)', borderRadius:14, padding:'1rem 1.25rem', display:'flex', alignItems:'center', gap:10 }}>
                <Lock size={14} color="#6366f1" />
                <span style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.45)' }}>
                  All payments secured via Razorpay. {billingCycle === 'annual' ? 'Annual plans are billed as a single upfront payment.' : 'You can cancel anytime from the wallet panel.'}
                </span>
                <ArrowUpRight size={14} color="rgba(99,102,241,0.5)" style={{ marginLeft:'auto', flexShrink:0 }} />
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.3 }}>
              <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20, overflow:'hidden' }}>
                <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:8 }}>
                  <TrendingUp size={16} color="#6366f1" />
                  <span style={{ fontWeight:800, fontSize:'0.9rem', color:'#f0f0f5' }}>Transaction Ledger</span>
                  <span style={{ marginLeft:'auto', background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.25)', borderRadius:8, padding:'2px 10px', fontSize:'0.68rem', fontWeight:800, color:'#818cf8' }}>{history.length} records</span>
                </div>
                {history.length === 0 ? (
                  <div style={{ padding:'3rem', textAlign:'center', color:'rgba(255,255,255,0.3)' }}>
                    <CreditCard size={32} style={{ marginBottom:12, opacity:0.4 }} />
                    <div style={{ fontSize:'0.875rem', fontWeight:600 }}>No transactions yet</div>
                    <div style={{ fontSize:'0.78rem', marginTop:4 }}>Upgrade your plan to see payment history.</div>
                  </div>
                ) : (
                  history.map(item => <TxRow key={item.id} item={item} />)
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
