import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building, PersonStanding, ArrowRight, Eye, EyeOff, Mail, Lock, User, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import InstitutionSelect from '../components/InstitutionSelect';
import FloatingBackground from '../components/FloatingBackground';
import MagneticButton from '../components/MagneticButton';

/* ─── Input field ─── */
const GlassInput = ({ icon: Icon, label, hint, ...props }) => (
  <div>
    <label className="block text-sm text-slate-300 font-medium mb-1.5">{label}</label>
    <div className="relative">
      {Icon && (
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
          <Icon size={16} />
        </span>
      )}
      <input
        className={`w-full px-4 py-3 ${Icon ? 'pl-10' : ''} bg-white/5 border border-white/10 rounded-xl
          text-white placeholder:text-slate-500 text-sm
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
          transition-all duration-200`}
        {...props}
      />
      {hint && (
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500 text-xs font-semibold">
          {hint}
        </span>
      )}
    </div>
  </div>
);

/* ─── Step dot ─── */
const StepDot = ({ n, label, active, done }) => (
  <div className="flex flex-col items-center gap-1">
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-2
      ${done || active
        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
        : 'border-white/10 bg-white/5 text-slate-500'}`}>
      {done
        ? <svg width="14" height="14" fill="none" stroke="#10b981" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
        : n}
    </div>
    <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300
      ${active ? 'text-emerald-400' : 'text-slate-600'}`}>{label}</span>
  </div>
);

/* ─── Path option card ─── */
const PathCard = ({ type, Icon, label, sub, color, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex-1 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-250 text-left
      ${active
        ? `border-[${color}] bg-[${color}]/10`
        : 'border-white/10 bg-white/5 hover:border-white/25'}`}
    style={{
      borderColor: active ? color : undefined,
      backgroundColor: active ? `${color}15` : undefined,
    }}
  >
    <Icon size={28} color={active ? color : 'rgba(255,255,255,0.35)'} className="mb-3" />
    <p className="font-bold text-white text-sm mb-1">{label}</p>
    <p className="text-xs text-slate-500">{sub}</p>
  </button>
);

export default function Register() {
  const [step, setStep] = useState(1);
  const [joinType, setJoinType] = useState(null);
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();

  const canProceed = joinType && (joinType === 'global' || selectedCollege);

  const getPayload = () => ({
    isGlobalUser: joinType === 'global',
    collegeData: joinType === 'institution' && selectedCollege
      ? { name: selectedCollege.name, domain: selectedCollege.domains?.[0] || 'Unknown' }
      : undefined,
  });

  const handleGoogle = async (cr) => {
    if (!joinType) return toast.error('Please choose your path first');
    setLoading(true);
    try {
      const data = await googleLogin({ credential: cr.credential, ...getPayload() });
      if (data.user?.verificationStatus === 'PENDING') { toast.error('Pending approval.'); navigate('/pending'); }
      else { toast.success('Account created! Welcome.'); navigate('/onboarding'); }
    } catch (err) { toast.error(err.response?.data?.message || 'Google auth failed'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const email = (joinType === 'institution' && selectedCollege?.domains?.[0])
        ? `${form.email.replace(/@.*/, '')}@${selectedCollege.domains[0]}`
        : form.email;
      const data = await register({ name: form.name, email, password: form.password, ...getPayload() });
      if (data.user?.verificationStatus === 'PENDING') { toast.error('Pending approval.'); navigate('/pending'); }
      else { toast.success('Account created!'); navigate('/onboarding'); }
    } catch (err) { toast.error(err.response?.data?.message || 'Registration failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden text-white">
      {/* Animated orb background */}
      <FloatingBackground />

      <div className="w-full max-w-lg flex flex-col gap-4">

        {/* ─── Header badge ─── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Step {step} of 2 — {step === 1 ? 'Choose Path' : 'Set Credentials'}
          </span>
        </motion.div>

        {/* ─── Glass card ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          className="w-full p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-2xl shadow-2xl"
        >
          {/* Title */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-1">
              {step === 1 ? 'Join the Network' : 'Create Account'}
            </h1>
            <p className="text-slate-400 text-sm">
              {step === 1 ? 'Choose how you want to connect with your campus.' : 'One last step — lock in your credentials.'}
            </p>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-2 mb-7">
            <StepDot n={1} label="Path" active={step === 1} done={step > 1} />
            <div className={`flex-1 h-0.5 rounded-full transition-all duration-500 ${step > 1 ? 'bg-emerald-500' : 'bg-white/10'}`} />
            <StepDot n={2} label="Creds" active={step === 2} done={false} />
          </div>

          <AnimatePresence mode="wait">

            {/* ── STEP 1: Choose path ── */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-5">
                <div className="flex gap-3">
                  <PathCard type="institution" Icon={Building} label="Join Institution" sub="University walled garden" color="#10b981"
                    active={joinType === 'institution'} onClick={() => { setJoinType('institution'); setSelectedCollege(null); }} />
                  <PathCard type="global" Icon={PersonStanding} label="General User" sub="Open public network" color="#6366f1"
                    active={joinType === 'global'} onClick={() => { setJoinType('global'); setSelectedCollege(null); }} />
                </div>

                <AnimatePresence>
                  {joinType === 'institution' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                      <InstitutionSelect
                        value={selectedCollege}
                        onChange={setSelectedCollege}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: 'rgba(255,255,255,0.05)', color: 'white', borderRadius: '14px',
                            '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                            '&:hover fieldset': { borderColor: 'rgba(16,185,129,0.4)' },
                            '&.Mui-focused fieldset': { borderColor: '#10b981' },
                          },
                          '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.4)' },
                          '& .MuiInputLabel-root.Mui-focused': { color: '#10b981' },
                          '& .MuiAutocomplete-endAdornment .MuiIconButton-root': { color: 'rgba(255,255,255,0.5)' },
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <MagneticButton width="100%">
                  <button
                    type="button"
                    disabled={!canProceed}
                    onClick={() => canProceed && setStep(2)}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-sm
                      bg-gradient-to-r from-emerald-500 to-emerald-600 text-white
                      shadow-[0_8px_24px_rgba(16,185,129,0.3)] hover:shadow-[0_12px_32px_rgba(16,185,129,0.4)]
                      disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Continue <ArrowRight size={16} />
                  </button>
                </MagneticButton>

                <p className="text-center text-sm text-slate-500">
                  Already have an account?{' '}
                  <RouterLink to="/login" className="font-bold text-indigo-400 hover:underline">Sign in</RouterLink>
                </p>
              </motion.div>
            )}

            {/* ── STEP 2: Credentials ── */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-5">
                {/* Google */}
                <div className="flex justify-center">
                  <GoogleLogin onSuccess={handleGoogle} onError={() => toast.error('Google sign-up failed')}
                    theme="filled_black" shape="pill" size="large" text="signup_with" width="340" />
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-xs font-semibold text-slate-600 px-1">OR</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Domain tip */}
                {joinType === 'institution' && selectedCollege?.domains?.[0] && (
                  <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300">
                    <strong>Tip:</strong> Use <em>@{selectedCollege.domains[0]}</em> email for instant approval. If you are the first student from your campus, you will automatically be granted Org Admin rights.
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <GlassInput icon={User} label="Full name" type="text" required placeholder="Your full name"
                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

                  <GlassInput
                    icon={Mail}
                    label={joinType === 'institution' && selectedCollege?.domains?.[0] ? 'Email prefix' : 'Email address'}
                    type="email" required
                    placeholder={joinType === 'institution' && selectedCollege?.domains?.[0] ? 'your.name' : 'you@example.com'}
                    hint={joinType === 'institution' && selectedCollege?.domains?.[0] ? `@${selectedCollege.domains[0]}` : undefined}
                    value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />

                  {/* Password */}
                  <div>
                    <label className="block text-sm text-slate-300 font-medium mb-1.5">Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      <input type={showPwd ? 'text' : 'password'} required placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                      <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label className="block text-sm text-slate-300 font-medium mb-1.5">Confirm password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      <input type={showConfirm ? 'text' : 'password'} required placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-1">
                    <MagneticButton width="100%">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm
                          bg-gradient-to-r from-emerald-500 to-emerald-600 text-white
                          shadow-[0_8px_24px_rgba(16,185,129,0.3)] hover:shadow-[0_12px_32px_rgba(16,185,129,0.4)]
                          disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        {loading ? 'Creating account…' : 'Create My Account →'}
                      </button>
                    </MagneticButton>
                  </div>
                </form>

                <button type="button" onClick={() => setStep(1)}
                  className="w-full text-center text-sm text-slate-500 hover:text-slate-300 font-medium transition-colors">
                  ← Back to path select
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Institution admin link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-slate-600 flex items-center justify-center gap-1.5"
        >
          <Shield size={12} />
          Institution Admin?{' '}
          <RouterLink to="/org-admin-login" className="font-semibold text-red-400 hover:underline">
            Access Portal
          </RouterLink>
        </motion.p>
      </div>
    </div>
  );
}
