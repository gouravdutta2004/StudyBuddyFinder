import React from 'react';

const features = [
  {
    name: 'Algorithmic Match',
    desc: 'Our AI pairs you with perfect study partners based on courses, schedule, and learning style.',
    color: '#7c3aed', bg: 'rgba(124,58,237,0.18)',
    icon: (
      <svg fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24" width="30" height="30">
        <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/>
        <line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/><line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/>
        <line x1="14.83" y1="9.17" x2="19.07" y2="4.93"/><line x1="4.93" y1="19.07" x2="9.17" y2="14.83"/>
      </svg>
    )
  },
  {
    name: 'Live Hubs',
    desc: 'Jump into live study rooms, share screens, collaborate and stay focused together in real-time.',
    color: '#ec4899', bg: 'rgba(236,72,153,0.18)',
    icon: (
      <svg fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24" width="30" height="30">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    )
  },
  {
    name: 'Velocity',
    desc: 'Track streaks, earn XP, climb leaderboards and build unstoppable momentum.',
    color: '#10b981', bg: 'rgba(16,185,129,0.18)',
    icon: (
      <svg fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24" width="30" height="30">
        <path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/>
      </svg>
    )
  },
  {
    name: 'Smart Notes',
    desc: 'AI-powered note sharing with summaries, flashcards, and study guides from group sessions.',
    color: '#3b82f6', bg: 'rgba(59,130,246,0.18)',
    icon: (
      <svg fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24" width="30" height="30">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    )
  },
  {
    name: 'Focus Timer',
    desc: 'Pomodoro sessions synced with your study group. Stay accountable with shared focus blocks.',
    color: '#a78bfa', bg: 'rgba(167,139,250,0.18)',
    icon: (
      <svg fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24" width="30" height="30">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    )
  },
  {
    name: 'Study Analytics',
    desc: 'Deep insights into your habits, weak spots, and progress. Know exactly where to focus next.',
    color: '#34d399', bg: 'rgba(52,211,153,0.18)',
    icon: (
      <svg fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24" width="30" height="30">
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>
      </svg>
    )
  },
];

export default function CoreFeatures() {
  return (
    <section id="features" style={{ padding: '5.5rem 0', position: 'relative', zIndex: 10 }}>
      <style>{`
        .cf-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1.25rem; max-width: 1000px; margin: 0 auto; }
        .cf-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 1.5rem; padding: 2.25rem 1.75rem; text-align: center; transition: .3s cubic-bezier(0.4,0,0.2,1); position: relative; overflow: hidden; cursor: default; }
        .cf-card::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(124,58,237,0.06),rgba(16,185,129,0.03)); opacity:0; transition:.3s; }
        .cf-card:hover { border-color: rgba(124,58,237,0.25); transform: translateY(-7px); box-shadow: 0 16px 40px rgba(0,0,0,0.3), 0 0 60px rgba(124,58,237,0.2); }
        .cf-card:hover::before { opacity: 1; }
        .cf-card:hover .cf-icon { transform: scale(1.1); }
        .cf-icon { width:68px; height:68px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 1.25rem; transition:.3s; position:relative; z-index:1; }
        .cf-name { font-family:'Space Grotesk',sans-serif; font-size:1.15rem; font-weight:700; margin-bottom:.4rem; position:relative; z-index:1; color:#f0f0f5; }
        .cf-desc { font-size:.82rem; color:#8b8fa8; line-height:1.6; position:relative; z-index:1; }
        @media(max-width:900px){ .cf-grid{ grid-template-columns:repeat(2,1fr); } }
        @media(max-width:600px){ .cf-grid{ grid-template-columns:1fr; max-width:360px; } }
      `}</style>
      <div className="sf-w">
        <div className="sf-sh" style={{ marginBottom: '3rem' }}>
          <div className="sf-sbadge"><span className="sf-dot"/>&nbsp;Core Features</div>
          <h2 className="sf-h2" style={{ color: '#f0f0f5' }}>
            Everything to study <span className="gt">smarter</span>
          </h2>
          <p className="sf-p">Powered by algorithms, built for students.</p>
        </div>
        <div className="cf-grid">
          {features.map((f, i) => (
            <div className="cf-card" key={i}>
              <div className="cf-icon" style={{ background: f.bg, boxShadow: `0 0 28px ${f.color}33` }}>
                {f.icon}
              </div>
              <div className="cf-name">{f.name}</div>
              <p className="cf-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
