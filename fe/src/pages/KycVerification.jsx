import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Shield, Upload, CheckCircle2, XCircle, RefreshCw, Lock, Eye, Zap, AlertTriangle } from 'lucide-react';

/* ─────────────── helpers ─────────────── */
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

/* ─────────────── sub-components ─────────────── */

// Glowing neon scan line sweep animation
function ScanEffect({ imageUrl }) {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden" style={{ maxHeight: 260 }}>
      <img src={imageUrl} alt="ID Preview" className="w-full object-cover rounded-2xl" style={{ maxHeight: 260 }} />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40 rounded-2xl" />
      {/* Scan line */}
      <motion.div
        initial={{ top: 0 }}
        animate={{ top: ['0%', '100%', '0%'] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: 3,
          background: 'linear-gradient(90deg, transparent, #6366f1, #22d3ee, #6366f1, transparent)',
          boxShadow: '0 0 20px 6px rgba(99,102,241,0.7)',
        }}
      />
      {/* Grid overlay for "scanning" effect */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, #6366f1 0px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, #6366f1 0px, transparent 1px, transparent 20px)',
          backgroundSize: '20px 20px',
        }}
      />
      {/* Status badge */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-indigo-500/80 backdrop-blur-sm border border-indigo-400/40">
        <p className="text-xs font-bold text-white tracking-widest uppercase flex items-center gap-2">
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-cyan-400 inline-block"
          />
          AI Vision Scanning…
        </p>
      </div>
    </div>
  );
}

// Success state
function SuccessState({ result }) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 16 }}
      className="flex flex-col items-center gap-5 py-4 text-center"
    >
      {/* Animated shield */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1] }}
        transition={{ duration: 0.6, times: [0, 0.7, 1] }}
        className="w-24 h-24 rounded-full flex items-center justify-center"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.2), transparent)', border: '2px solid #10b981' }}
      >
        <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.5, delay: 0.5 }}>
          <CheckCircle2 size={52} className="text-emerald-400" strokeWidth={1.5} />
        </motion.div>
      </motion.div>

      {/* Particle burst */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-emerald-400"
          initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          animate={{
            opacity: 0,
            x: Math.cos((i / 8) * Math.PI * 2) * 70,
            y: Math.sin((i / 8) * Math.PI * 2) * 70,
            scale: 0,
          }}
          transition={{ duration: 0.9, delay: 0.4 }}
          style={{ top: '50%', left: '50%', translateX: '-50%', translateY: '-50%' }}
        />
      ))}

      <div>
        <h2 className="text-2xl font-black text-white mb-1">Verified! 🎉</h2>
        <p className="text-emerald-400 font-bold text-sm">{result.extractedInstitution}</p>
        <p className="text-slate-500 text-xs mt-1">Student: {result.extractedName}</p>
      </div>

      <div className="w-full p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 text-left space-y-1">
        <p><span className="font-bold">Institution:</span> {result.extractedInstitution}</p>
        {result.expiryDate && <p><span className="font-bold">Valid until:</span> {result.expiryDate}</p>}
        <p className="text-emerald-400/60 text-[10px] mt-2">Your ID was verified and immediately discarded from our systems.</p>
      </div>

      <p className="text-slate-400 text-xs">Redirecting you to the dashboard…</p>
    </motion.div>
  );
}

// Rejection state
function RejectionState({ reason, onRetry, onSkip }) {
  const isQuota = reason?.toLowerCase().includes('quota') || reason?.toLowerCase().includes('exhausted');
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 16 }}
      className="flex flex-col items-center gap-5 py-4 text-center"
    >
      <motion.div
        animate={{ rotate: [0, -5, 5, -5, 5, 0] }}
        transition={{ duration: 0.5 }}
        className="w-24 h-24 rounded-full flex items-center justify-center"
        style={{ background: `radial-gradient(circle, ${isQuota ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'}, transparent)`, border: `2px solid ${isQuota ? '#f59e0b' : '#ef4444'}` }}
      >
        {isQuota
          ? <AlertTriangle size={52} className="text-amber-400" strokeWidth={1.5} />
          : <XCircle size={52} className="text-red-400" strokeWidth={1.5} />}
      </motion.div>

      <div>
        <h2 className="text-2xl font-black text-white mb-1">
          {isQuota ? 'AI Temporarily Busy' : 'Verification Failed'}
        </h2>
        <p className="text-slate-400 text-sm">
          {isQuota ? 'Our AI is taking a short break — quota limit reached.' : 'We could not verify your Student ID'}
        </p>
      </div>

      <div className={`w-full p-4 rounded-xl text-left ${isQuota ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
        <p className={`text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5 ${isQuota ? 'text-amber-400' : 'text-red-400'}`}>
          <AlertTriangle size={12} /> {isQuota ? 'What happened' : 'Rejection Reason'}
        </p>
        <p className={`text-sm ${isQuota ? 'text-amber-200' : 'text-red-200'}`}>{reason}</p>
      </div>

      <button
        onClick={onRetry}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-sm
          bg-gradient-to-r from-indigo-600 to-violet-600 text-white
          shadow-[0_8px_24px_rgba(99,102,241,0.35)] hover:shadow-[0_12px_32px_rgba(99,102,241,0.5)]
          transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
      >
        <RefreshCw size={16} />
        Try Again
      </button>

      {isQuota && (
        <button
          onClick={onSkip}
          className="w-full text-center text-sm text-slate-500 hover:text-slate-300 font-medium transition-colors py-2"
        >
          Continue to dashboard without KYC →
        </button>
      )}
    </motion.div>
  );
}

/* ─────────────── Main Component ─────────────── */
export default function KycVerification() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [phase, setPhase] = useState('idle'); // idle | scanning | success | rejected
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const processFile = useCallback(async (file) => {
    if (!file || !ACCEPTED.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or WebP image of your student ID.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image exceeds the 10MB size limit.');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setPhase('scanning');

    const formData = new FormData();
    formData.append('idCard', file);

    try {
      const { data } = await api.post('/kyc/verify', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResult(data);
      setPhase('success');
      // Hard-refresh user from server so kycStatus is accurate in context
      if (refreshUser) await refreshUser();
      toast.success('Student ID Verified! Welcome aboard.');

      // Auto-redirect after 3 seconds
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (err) {
      const errorData = err.response?.data;
      const reason = errorData?.rejectionReason || errorData?.message || 'Verification failed. Please try again.';
      setRejectionReason(reason);
      setPhase('rejected');
      URL.revokeObjectURL(objectUrl);
    }
  }, [navigate, refreshUser]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleRetry = () => {
    setPhase('idle');
    setPreview(null);
    setResult(null);
    setRejectionReason('');
    if (preview) URL.revokeObjectURL(preview);
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden"
      style={{ background: '#07080f' }}
    >
      {/* ── Ambient glows ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.18, 0.08] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute w-[600px] h-[600px] rounded-full blur-[120px] bg-indigo-600"
          style={{ top: '-10%', left: '-10%' }}
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.06, 0.12, 0.06] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute w-[400px] h-[400px] rounded-full blur-[100px] bg-cyan-500"
          style={{ bottom: '-5%', right: '-5%' }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          {/* Security badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Student KYC Verification
          </div>

          <div className="flex justify-center mb-4">
            <motion.div
              animate={{ boxShadow: ['0 0 20px rgba(99,102,241,0.3)', '0 0 50px rgba(99,102,241,0.6)', '0 0 20px rgba(99,102,241,0.3)'] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(34,211,238,0.1))', border: '1px solid rgba(99,102,241,0.4)' }}
            >
              <Shield size={32} className="text-indigo-400" strokeWidth={1.5} />
            </motion.div>
          </div>

          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Verify Your Identity</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Unlock full platform access with a quick Student ID scan.
          </p>
        </motion.div>

        {/* ── Main Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full p-7 rounded-3xl"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          }}
        >
          <AnimatePresence mode="wait">
            {/* ── IDLE: Drop Zone ── */}
            {phase === 'idle' && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer"
                >
                  <motion.div
                    animate={isDragging ? { scale: 1.02 } : { scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="flex flex-col items-center justify-center gap-4 py-10 px-4 rounded-2xl border-dashed border-2 transition-colors duration-200"
                    style={{
                      borderColor: isDragging ? 'rgba(99,102,241,0.7)' : 'rgba(255,255,255,0.15)',
                      background: isDragging ? 'rgba(99,102,241,0.07)' : 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <motion.div
                      animate={{ y: isDragging ? -8 : 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)' }}
                    >
                      <Upload size={26} className="text-indigo-400" strokeWidth={1.5} />
                    </motion.div>
                    <div className="text-center">
                      <p className="font-bold text-white text-base mb-1">
                        {isDragging ? 'Drop it here!' : 'Drop your Student ID here'}
                      </p>
                      <p className="text-slate-500 text-sm">or <span className="text-indigo-400 font-semibold">click to browse</span></p>
                      <p className="text-slate-600 text-xs mt-2">JPG, PNG, WebP — Max 10MB</p>
                    </div>
                  </motion.div>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  hidden
                  accept="image/*"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = null; }}
                />

                {/* Privacy guarantee row */}
                <div className="mt-5 flex flex-col gap-2">
                  {[
                    { icon: Eye, text: 'Instant AI verification — results in seconds' },
                    { icon: Lock, text: 'We do not store your ID card. Ever.' },
                    { icon: Zap, text: 'Image is discarded from memory after analysis' },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2.5 text-xs text-slate-500">
                      <Icon size={13} className="text-indigo-400 shrink-0" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── SCANNING ── */}
            {phase === 'scanning' && (
              <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                {preview && <ScanEffect imageUrl={preview} />}
                <div className="text-center">
                  <p className="font-bold text-white text-base mb-1">Sending to AI Vision Engine…</p>
                  <p className="text-slate-500 text-xs">Gemini 1.5 Flash is analyzing your Student ID</p>
                </div>
              </motion.div>
            )}

            {/* ── SUCCESS ── */}
            {phase === 'success' && result && (
              <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <SuccessState result={result} />
              </motion.div>
            )}

            {/* ── REJECTED ── */}
            {phase === 'rejected' && (
              <motion.div key="rejected" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <RejectionState reason={rejectionReason} onRetry={handleRetry} onSkip={handleSkip} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Skip link for global users */}
        {phase === 'idle' && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center mt-5 text-xs text-slate-600"
          >
            Not a student?{' '}
            <button
              onClick={() => navigate('/dashboard')}
              className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
            >
              Skip for now →
            </button>
          </motion.p>
        )}
      </div>
    </div>
  );
}
