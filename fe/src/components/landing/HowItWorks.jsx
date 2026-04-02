import React from 'react';

const steps = [
  { num: '01', title: 'Sign Up',      desc: 'Create your profile with your major, courses, and schedule.' },
  { num: '02', title: 'Get Matched',  desc: 'Our algorithm finds your ideal study partners instantly.' },
  { num: '03', title: 'Join a Hub',   desc: 'Enter live study rooms, share notes, and collaborate.' },
  { num: '04', title: 'Level Up',     desc: 'Track progress, earn streaks, and crush your exams.' },
];

export default function HowItWorks() {
  return (
    <section id="how" style={{ padding:'5.5rem 0', position:'relative', zIndex:10 }}>
      <style>{`
        .hiw-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:1.5rem; max-width:980px; margin:0 auto; position:relative; }
        .hiw-grid::before { content:''; position:absolute; top:43px; left:12%; width:76%; height:2px; background:linear-gradient(90deg,rgba(255,255,255,0.06),#7c3aed,#10b981,rgba(255,255,255,0.06)); z-index:0; }
        .hiw-step { text-align:center; position:relative; z-index:1; }
        .hiw-num { width:86px; height:86px; background:#0f1423; border:2px solid rgba(255,255,255,0.06); border-radius:50%; display:flex; align-items:center; justify-content:center; font-family:'"Space Grotesk",sans-serif'; font-size:1.4rem; font-weight:800; color:#7c3aed; margin:0 auto 1.1rem; transition:all 0.5s cubic-bezier(0.34,1.56,0.64,1); cursor:default; }
        .hiw-step:hover .hiw-num { background:linear-gradient(135deg,#7c3aed,#5b21b6); border-color:transparent; color:#fff; transform:scale(1.15); box-shadow:0 0 60px rgba(124,58,237,0.2); }
        .hiw-title { font-family:'"Space Grotesk",sans-serif'; font-size:1rem; font-weight:700; margin-bottom:.35rem; color:#f0f0f5; }
        .hiw-desc { font-size:.78rem; color:#8b8fa8; line-height:1.5; }
        @media(max-width:900px){ .hiw-grid{ grid-template-columns:repeat(2,1fr); } .hiw-grid::before{display:none;} }
        @media(max-width:500px){ .hiw-grid{ grid-template-columns:1fr; max-width:280px; } }
      `}</style>

      <div className="sf-w">
        <div className="sf-sh" style={{marginBottom:'3rem'}}>
          <div className="sf-sbadge"><span className="sf-dot"/>&nbsp;How It Works</div>
          <h2 className="sf-h2" style={{color:'#f0f0f5'}}>
            From signup to <span className="gt">study squad</span>
          </h2>
          <p className="sf-p">Get matched and start studying in under 2 minutes.</p>
        </div>

        <div className="hiw-grid">
          {steps.map((s,i) => (
            <div className="hiw-step" key={i}>
              <div className="hiw-num" style={{fontFamily:'"Space Grotesk",sans-serif'}}>{s.num}</div>
              <div className="hiw-title" style={{fontFamily:'"Space Grotesk",sans-serif'}}>{s.title}</div>
              <p className="hiw-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
