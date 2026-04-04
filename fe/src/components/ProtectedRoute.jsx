import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence, animate } from 'framer-motion';
import { useEffect, useState } from 'react';
import logoImg from '../assets/logo.png';

/* ─────────────────────────────────────────────────────────────────────────
   Holographic Arc-Reactor Preloader
   Features concentric rotating rings, dynamic SVG drawing, and cinematic reveal.
───────────────────────────────────────────────────────────────────────── */
function Preloader() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Smooth progress from 0 to 100
    const controls = animate(0, 100, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1], // Cinematic ease out
      onUpdate: (value) => {
        setProgress(Math.floor(value));
      }
    });
    return controls.stop;
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        key="app-preloader"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center pointer-events-none"
        style={{ background: '#050508' }}
      >
        {/* --- Ambient Background Glows --- */}
        <div className="absolute inset-0 overflow-hidden flex items-center justify-center">
          <motion.div 
             animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.15, 0.05] }} 
             transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} 
             className="w-[60vh] h-[60vh] rounded-full blur-[100px] bg-indigo-500" 
          />
        </div>

        {/* --- Central Reactor Component --- */}
        <div className="relative flex items-center justify-center w-[300px] h-[300px]">
          
          {/* Outer ring - dashed, rotating slowly clockwise */}
          <motion.svg width="280" height="280" viewBox="0 0 280 280" className="absolute"
            animate={{ rotate: 360 }} transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}>
            <circle cx="140" cy="140" r="130" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="4 8" />
          </motion.svg>

          {/* Middle ring - continuous, rotating counter-clockwise */}
          <motion.svg width="280" height="280" viewBox="0 0 280 280" className="absolute"
            animate={{ rotate: -360 }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}>
            <circle cx="140" cy="140" r="115" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="100 20" />
            <circle cx="140" cy="140" r="115" fill="none" stroke="rgba(16,185,129,0.4)" strokeWidth="2" strokeDasharray="20 400" strokeLinecap="round" />
          </motion.svg>

          {/* Inner ring - The progress bar sweep */}
          <svg width="280" height="280" viewBox="0 0 280 280" className="absolute rotate-[-90deg]">
             {/* Progress Track */}
             <circle cx="140" cy="140" r="100" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
             
             {/* Progress Fill (circumference = 2 * PI * 100 = 628.3) */}
             <circle 
                cx="140" cy="140" r="100" 
                fill="none" stroke="url(#progressGrad)" strokeWidth="4" 
                strokeDasharray="628.3" 
                strokeDashoffset={628.3 - (628.3 * progress) / 100}
                strokeLinecap="round" 
                style={{ transition: 'stroke-dashoffset 0.05s linear' }}
             />
             <defs>
                <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
             </defs>
          </svg>

          {/* --- Nested Center Content --- */}
          <div className="absolute flex flex-col items-center justify-center mt-2">
             <motion.div 
                initial={{ scale: 0.8, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mb-1"
             >
                <img src={logoImg} alt="Logo" style={{ width: 28, height: 28, opacity: 0.9, filter: 'drop-shadow(0 0 8px rgba(99,102,241,0.5))' }} />
             </motion.div>
             
             <div className="flex items-baseline gap-1" style={{ transform: 'translateX(6px)' }}>
                 <h1 style={{ 
                   fontFamily: '"Space Grotesk", sans-serif', 
                   fontSize: '3.8rem', 
                   fontWeight: 800, 
                   color: '#fff', 
                   lineHeight: 1, 
                   letterSpacing: '-0.04em',
                   fontVariantNumeric: 'tabular-nums'
                 }}>
                    {progress}
                 </h1>
                 <span style={{ color: '#10b981', fontWeight: 800, fontSize: '1.2rem' }}>%</span>
             </div>
             
             <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.25em', fontWeight: 700, color: '#64748b', marginTop: '8px' }}>
                 Establishing Link
             </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [minLoadTimeComplete, setMinLoadTimeComplete] = useState(false);

  useEffect(() => {
    // Guarantees the preloader shows for at least 1.5s 
    // to complete the beautiful 0 -> 100 percentage animation fully.
    const timer = setTimeout(() => {
      setMinLoadTimeComplete(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const isAppLoading = loading || !minLoadTimeComplete;

  if (isAppLoading) return <Preloader />;

  if (!user) return <Navigate to="/login" replace />;
  if (user.isAdmin) return <Navigate to="/admin" replace />;
  if (user.verificationStatus === 'PENDING') return <Navigate to="/pending" replace />;
  if (user.role === 'ORG_ADMIN' && !user.isAdmin && location.pathname !== '/org-admin')
    return <Navigate to="/org-admin" replace />;

  // Enforce Onboarding — skip if heading to /kyc as well
  if (!user.isAdmin && user.role === 'USER') {
    const isUnonboarded = !user.subjects?.length || !user.studyProfile?.focusSpan;
    const exemptPaths = ['/onboarding', '/kyc'];
    if (isUnonboarded && !exemptPaths.includes(location.pathname)) {
      return <Navigate to="/onboarding" replace />;
    }
  }

  // Enforce KYC for institutional users (those linked to an organization)
  // Global users (no organization) and admins bypass KYC entirely
  if (!user.isAdmin && user.organization) {
    const kycDone = user.kycStatus === 'VERIFIED';
    const exemptPaths = ['/kyc', '/onboarding'];
    if (!kycDone && !exemptPaths.includes(location.pathname)) {
      return <Navigate to="/kyc" replace />;
    }
  }

  return children;
}
