import React, { useState } from 'react';

const majors = ['Computer Science','Engineering','Business','Pre-Med','Psychology','Mathematics','Design'];
const needs  = ['Data Structures','Calculus','Organic Chemistry','Statistics','Physics','Writing'];
const teaches = ['Programming','Linear Algebra','Biology','Economics','History','Design'];

const matchData = [
  { init: 'AK', name: 'Anika K.', info: 'Computer Science • Senior', match: '97% Match' },
  { init: 'RJ', name: 'Rahul J.', info: 'Engineering • Junior',       match: '94% Match', green: true },
  { init: 'SP', name: 'Sarah P.', info: 'Mathematics • Sophomore',    match: '91% Match', pink: true },
];

export default function PlayableSandbox() {
  const [major,   setMajor]   = useState('');
  const [need,    setNeed]    = useState('');
  const [teach,   setTeach]   = useState('');
  const [ran,     setRan]     = useState(false);

  const handleRun = () => { if (major || need || teach) setRan(true); };

  return (
    <section id="demo" style={{ padding:'5.5rem 0', position:'relative', zIndex:10, background:'radial-gradient(ellipse at center,rgba(124,58,237,0.05),transparent 70%)' }}>
      <style>{`
        .demo-card { background:#0f1423; border:1.5px solid rgba(124,58,237,0.14); border-radius:2rem; box-shadow:0 20px 60px rgba(0,0,0,0.5),0 0 60px rgba(124,58,237,0.1); overflow:hidden; position:relative; max-width:860px; margin:0 auto; }
        .demo-controls { display:flex; align-items:center; justify-content:center; gap:.85rem; flex-wrap:wrap; padding:1.25rem 2rem; }
        .dsel { background:rgba(0,0,0,0.3); border:1.5px solid rgba(255,255,255,0.15); border-radius:9999px; padding:.75rem 2.5rem .75rem 1.25rem; color:#8b8fa8; font-size:.875rem; font-family:inherit; min-width:175px; appearance:none; background-image:url("data:image/svg+xml,%3Csvg width='12' height='8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%238b8fa8' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 14px center; cursor:pointer; transition:.2s; }
        .dsel:focus { outline:none; border-color:#7c3aed; box-shadow:0 0 0 3px rgba(124,58,237,0.2); }
        .dsel option { background:#141a2e; color:#f0f0f5; }
        .drun { padding:.8rem 1.75rem; background:linear-gradient(135deg,#7c3aed,#5b21b6); border:none; border-radius:9999px; color:#fff; font-weight:700; font-size:.95rem; font-family:inherit; cursor:pointer; transition:.3s; white-space:nowrap; }
        .drun:hover { transform:translateY(-2px); box-shadow:0 0 60px rgba(124,58,237,0.2); }
        .dresults { padding:0 2rem 2.5rem; min-height:100px; }
        .dempty { text-align:center; color:#5a5f7a; font-size:.82rem; padding:1.5rem; border:1px dashed rgba(255,255,255,0.06); border-radius:1rem; background:rgba(0,0,0,0.1); }
        .mgrid { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; }
        .mc { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:1rem; padding:1.25rem; transition:.3s; animation: mci .45s ease forwards; opacity:0; }
        .mc:nth-child(2){animation-delay:.13s}.mc:nth-child(3){animation-delay:.26s}
        .mc:hover{border-color:rgba(124,58,237,0.25);transform:translateY(-4px)}
        @keyframes mci{to{opacity:1;transform:translateY(0)}}
        .mav{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.78rem;color:#fff;margin-bottom:.7rem}
        .mn{font-weight:700;font-size:.9rem;margin-bottom:.2rem;color:#f0f0f5}
        .mi{font-size:.72rem;color:#5a5f7a}
        .ms{display:inline-block;margin-top:.5rem;padding:.18rem .55rem;background:rgba(16,185,129,0.14);border-radius:9999px;font-size:.68rem;font-weight:700;color:#10b981}
        @media(max-width:640px){.demo-controls{flex-direction:column;align-items:stretch}.dsel{min-width:unset;width:100%}.mgrid{grid-template-columns:1fr}}
      `}</style>

      <div className="sf-w">
        <div className="sf-sh" style={{marginBottom:'2.5rem'}}>
          <div className="sf-sbadge"><span className="sf-dot"/>&nbsp;Live Demo</div>
          <h2 className="sf-h2" style={{color:'#f0f0f5'}}>Try the <span className="gt">Algorithm.</span></h2>
          <p className="sf-p">Experience our smart matchmaking right here. Select your parameters below.</p>
        </div>

        <div className="demo-card">
          <div style={{textAlign:'center',padding:'2.5rem 1.5rem 1rem'}}>
            <h3 style={{fontFamily:'"Space Grotesk",sans-serif',fontSize:'clamp(1.5rem,3.5vw,2.5rem)',fontWeight:900,marginBottom:'.4rem',color:'#f0f0f5'}}>
              Run the <span className="gt">Matchmaker.</span>
            </h3>
            <p style={{fontSize:'.9rem',color:'#8b8fa8'}}>Select your preferences and see matched students instantly.</p>
          </div>

          <div className="demo-controls">
            <select className="dsel" value={major} onChange={e=>setMajor(e.target.value)}>
              <option value="" disabled>My Major</option>
              {majors.map(m=><option key={m}>{m}</option>)}
            </select>
            <select className="dsel" value={need} onChange={e=>setNeed(e.target.value)}>
              <option value="" disabled>I need help with</option>
              {needs.map(n=><option key={n}>{n}</option>)}
            </select>
            <select className="dsel" value={teach} onChange={e=>setTeach(e.target.value)}>
              <option value="" disabled>I can teach</option>
              {teaches.map(t=><option key={t}>{t}</option>)}
            </select>
            <button className="drun" onClick={handleRun}>Run Matchmaker</button>
          </div>

          <div className="dresults">
            {!ran ? (
              <div className="dempty">Select your preferences and hit "Run Matchmaker" to see your matches.</div>
            ) : (
              <div className="mgrid">
                {matchData.map((m,i)=>(
                  <div className="mc" key={i}>
                    <div className="mav" style={{background: m.green ? 'linear-gradient(135deg,#10b981,#059669)' : m.pink ? 'linear-gradient(135deg,#ec4899,#be185d)' : 'linear-gradient(135deg,#7c3aed,#5b21b6)'}}>{m.init}</div>
                    <div className="mn">{m.name}</div>
                    <div className="mi">{m.info}</div>
                    <span className="ms">{m.match}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
