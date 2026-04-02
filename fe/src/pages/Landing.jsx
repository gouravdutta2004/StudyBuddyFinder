import React, { useState, useEffect, useRef } from 'react';
import HeroSection from '../components/landing/HeroSection';
import VideoShowcase from '../components/landing/VideoShowcase';
import CoreFeatures from '../components/landing/CoreFeatures';
import PlayableSandbox from '../components/landing/PlayableSandbox';
import HowItWorks from '../components/landing/HowItWorks';

/* ─── Global Tokens ─── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700;800&display=swap');
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth;-webkit-font-smoothing:antialiased}
body{font-family:'Inter',sans-serif;background:#0b0f1a;color:#f0f0f5;line-height:1.6;overflow-x:hidden}
:root{
  --purple:#7c3aed;--purple2:#a78bfa;--green:#10b981;--green2:#34d399;
  --pink:#ec4899;--blue:#3b82f6;--bg:#0b0f1a;--bg2:#0f1423;--bg3:#141a2e;
  --card:rgba(255,255,255,0.03);--border:rgba(255,255,255,0.06);
  --text:#f0f0f5;--text2:#8b8fa8;--text3:#5a5f7a;
  --font:'Inter',sans-serif;--font-d:'Space Grotesk',sans-serif;
}
.sp-bar{position:fixed;top:0;left:0;width:0;height:3px;background:linear-gradient(135deg,#7c3aed,#5b21b6);z-index:10000;box-shadow:0 0 15px rgba(124,58,237,0.5);transition:width .1s}
.bg-grid{position:fixed;inset:0;background-image:linear-gradient(rgba(124,58,237,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,0.03) 1px,transparent 1px);background-size:80px 80px;z-index:-2;pointer-events:none}
.bg-noise{position:fixed;inset:0;opacity:.018;z-index:-2;pointer-events:none;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
canvas#sf-cv{position:fixed;inset:0;z-index:-1;pointer-events:none}
#sf-loader{position:fixed;inset:0;background:#0b0f1a;display:flex;align-items:center;justify-content:center;z-index:99999;transition:opacity .6s,visibility .6s}
#sf-loader.out{opacity:0;visibility:hidden}
.ll{display:flex;align-items:center;gap:12px;font-family:var(--font-d);font-size:1.4rem;font-weight:700;animation:lp 1.5s ease-in-out infinite}
.lbox{width:44px;height:44px;background:linear-gradient(135deg,#7c3aed,#5b21b6);border-radius:.75rem;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1.1rem;color:#fff}
@keyframes lp{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.96)}}
/* nav */
.sf-nav{position:fixed;top:14px;left:50%;transform:translateX(-50%);width:calc(100% - 2.5rem);max-width:1100px;z-index:1000;background:rgba(15,20,35,0.6);backdrop-filter:blur(24px) saturate(180%);border:1px solid rgba(255,255,255,0.06);border-radius:9999px;padding:.75rem 1.5rem;display:flex;align-items:center;justify-content:space-between;transition:.3s ease}
.sf-nav.sc{background:rgba(11,15,26,0.92);border-color:rgba(124,58,237,0.15);box-shadow:0 4px 30px rgba(0,0,0,0.3)}
.sf-brand{display:flex;align-items:center;gap:10px;font-family:var(--font-d);font-size:1.1rem;font-weight:700;text-decoration:none;color:#f0f0f5}
.sf-bicon{width:34px;height:34px;background:linear-gradient(135deg,#7c3aed,#5b21b6);border-radius:.75rem;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:1rem}
.sf-nl{display:flex;align-items:center;gap:1.75rem}
.sf-nl a{font-size:.875rem;font-weight:500;color:#8b8fa8;text-decoration:none;transition:.2s;position:relative}
.sf-nl a::after{content:'';position:absolute;bottom:-4px;left:0;width:0;height:2px;background:#7c3aed;border-radius:9999px;transition:.3s}
.sf-nl a:hover{color:#f0f0f5}.sf-nl a:hover::after{width:100%}
.sf-na{display:flex;align-items:center;gap:.75rem}
.btn-ghost{padding:.5rem 1rem;color:#8b8fa8;border-radius:9999px;border:none;background:none;font-family:inherit;font-size:.875rem;font-weight:600;cursor:pointer;text-decoration:none;transition:.2s}
.btn-ghost:hover{color:#f0f0f5}
.btn-p{padding:.625rem 1.5rem;background:linear-gradient(135deg,#7c3aed,#5b21b6);color:#fff;border-radius:9999px;font-size:.875rem;font-weight:600;cursor:pointer;border:none;font-family:inherit;text-decoration:none;transition:.3s;box-shadow:0 6px 20px rgba(124,58,237,0.25)}
.btn-p:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(124,58,237,0.35)}
.mob-toggle{display:none;flex-direction:column;gap:5px;width:22px;cursor:pointer;border:none;background:none;padding:0}
.mob-toggle span{width:100%;height:2px;background:#f0f0f5;border-radius:9999px;transition:.3s ease;display:block}
.mob-toggle.open span:nth-child(1){transform:rotate(45deg) translate(5px,5px)}
.mob-toggle.open span:nth-child(2){opacity:0}
.mob-toggle.open span:nth-child(3){transform:rotate(-45deg) translate(5px,-5px)}
.mob-menu{display:none;position:fixed;inset:0;background:rgba(11,15,26,0.97);backdrop-filter:blur(24px);z-index:5500;flex-direction:column;align-items:center;justify-content:center;gap:28px;opacity:0;visibility:hidden;transition:all .35s ease}
.mob-menu.show{opacity:1;visibility:visible}
.mob-menu a{font-family:var(--font-d);font-size:1.6rem;font-weight:600;color:#8b8fa8;text-decoration:none;transition:color .2s}
.mob-menu a:hover{color:#f0f0f5}
/* section */
.sf-s{padding:5.5rem 0;position:relative}
.sf-w{max-width:1180px;margin:0 auto;padding:0 1.5rem}
.sf-sh{text-align:center;max-width:580px;margin:0 auto 3rem}
.sf-sbadge{display:inline-flex;align-items:center;gap:.4rem;padding:.2rem .9rem;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.06);border-radius:9999px;font-size:.65rem;font-weight:700;color:#a78bfa;text-transform:uppercase;letter-spacing:.1em;backdrop-filter:blur(10px);margin-bottom:.75rem}
.sf-dot{width:6px;height:6px;background:#10b981;border-radius:50%;animation:pd 2s ease-in-out infinite}
@keyframes pd{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(1.6)}}
.sf-h2{font-family:var(--font-d);font-size:clamp(2rem,4.5vw,3.25rem);font-weight:800;line-height:1.08;letter-spacing:-.025em;margin-bottom:.75rem}
.sf-p{font-size:1rem;color:#8b8fa8;line-height:1.7}
/* marquee */
.sf-mq{padding:3.5rem 0;border-top:1px solid rgba(255,255,255,0.06);border-bottom:1px solid rgba(255,255,255,0.06);overflow:hidden}
.sf-mlbl{text-align:center;font-size:.72rem;color:#5a5f7a;text-transform:uppercase;letter-spacing:.2em;font-weight:600;margin-bottom:1.5rem}
.sf-mtrack{display:flex;animation:ms 42s linear infinite;width:max-content}
.sf-mtrack:hover{animation-play-state:paused}
.sf-mslide{display:flex;align-items:center;gap:3.5rem;padding:0 1.75rem}
.sf-uni{font-family:var(--font-d);font-size:1.3rem;font-weight:700;color:#5a5f7a;white-space:nowrap;opacity:.3;transition:.3s}
.sf-uni:hover{opacity:.65;color:#8b8fa8}
@keyframes ms{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
/* pricing */
.pricegrid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.25rem;align-items:start;max-width:980px;margin:0 auto}
.pc{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:1.5rem;padding:1.75rem;transition:.3s;position:relative;overflow:hidden}
.pc:hover{transform:translateY(-5px)}
.pc.feat{border-color:rgba(124,58,237,0.5);background:rgba(124,58,237,0.06);transform:scale(1.04);box-shadow:0 20px 60px rgba(0,0,0,0.5),0 0 60px rgba(124,58,237,0.2)}
.pc.feat:hover{transform:scale(1.04) translateY(-5px)}
.ptag{position:absolute;top:0;right:1.25rem;background:linear-gradient(135deg,#7c3aed,#5b21b6);color:#fff;padding:.18rem .7rem;font-size:.62rem;font-weight:700;border-radius:0 0 .5rem .5rem}
.plan{font-family:var(--font-d);font-size:1rem;font-weight:700;margin-bottom:.25rem}
.pldesc{font-size:.78rem;color:#8b8fa8;margin-bottom:1rem}
.pamt{font-family:var(--font-d);font-size:2.6rem;font-weight:800;line-height:1}
.pper{font-size:.82rem;color:#5a5f7a}
.pfeats{display:flex;flex-direction:column;gap:.55rem;margin:1.25rem 0}
.pf{display:flex;align-items:center;gap:.45rem;font-size:.78rem;color:#8b8fa8}
.ck{color:#10b981;font-weight:700}
.tw{display:flex;align-items:center;justify-content:center;gap:.75rem;margin-bottom:2.5rem}
.tl{font-size:.88rem;font-weight:500;color:#8b8fa8}
.tg{width:50px;height:26px;background:#141a2e;border:1px solid rgba(255,255,255,0.06);border-radius:9999px;position:relative;cursor:pointer;transition:.3s}
.tg.on{background:#7c3aed;border-color:#7c3aed}
.tk{width:20px;height:20px;background:#fff;border-radius:50%;position:absolute;top:2px;left:2px;transition:.3s}
.tg.on .tk{left:calc(100% - 22px)}
.sv{background:rgba(16,185,129,0.14);color:#10b981;padding:.15rem .5rem;border-radius:9999px;font-size:.68rem;font-weight:700}
.btn-o{padding:.7rem 1.75rem;border:1.5px solid rgba(255,255,255,0.2);color:#f0f0f5;border-radius:9999px;background:none;font-family:inherit;font-size:.875rem;font-weight:600;cursor:pointer;text-decoration:none;display:inline-block;transition:.3s;text-align:center;width:100%}
.btn-o:hover{border-color:#7c3aed;background:rgba(124,58,237,0.08);transform:translateY(-2px)}
.btn-p-full{padding:.7rem;background:linear-gradient(135deg,#7c3aed,#5b21b6);color:#fff;border-radius:9999px;font-size:.875rem;font-weight:600;cursor:pointer;border:none;font-family:inherit;text-decoration:none;display:inline-block;text-align:center;width:100%;transition:.3s}
.btn-p-full:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(124,58,237,0.35)}
/* cta */
.cta-s{padding:7rem 0;text-align:center;position:relative}
.cta-s::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 80%,rgba(16,185,129,0.08),transparent 60%);pointer-events:none}
.ctatitle{font-family:var(--font-d);font-size:clamp(2.4rem,6vw,4.5rem);font-weight:900;letter-spacing:-.03em;margin-bottom:2rem;line-height:1.05}
.gt{background:linear-gradient(135deg,#f0f0f5 0%,#a78bfa 50%,#7c3aed 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.btn-green{padding:1rem 2.75rem;background:linear-gradient(135deg,#10b981,#059669);color:#0b0f1a;font-size:1.1rem;font-weight:800;border-radius:2rem;border:none;font-family:inherit;cursor:pointer;text-decoration:none;display:inline-block;box-shadow:0 8px 30px rgba(16,185,129,0.3);transition:.3s}
.btn-green:hover{transform:translateY(-3px) scale(1.02);box-shadow:0 16px 50px rgba(16,185,129,0.38)}
footer{padding:2.5rem 0 2rem;border-top:1px solid rgba(255,255,255,0.06);background:rgba(0,0,0,0.18);text-align:center}
.fb2{display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:.6rem;font-family:var(--font-d);font-size:1.05rem;font-weight:700}
.fc2{font-size:.78rem;color:#5a5f7a}
@media(max-width:640px){.sf-nl,.sf-na .btn-ghost{display:none!important}.mob-toggle{display:flex!important}.pricegrid{grid-template-columns:1fr}.pc.feat{transform:scale(1)}}
@media(max-width:900px){.pricegrid{grid-template-columns:1fr 1fr}.pc.feat{grid-column:span 2;max-width:420px;margin:0 auto;transform:scale(1)}}
`;

/* ─── Marquee ─── */
const unis = ['KIIT University, Bhubaneswar','C.V. Raman Global University','IIT Bombay','NIT Rourkela','BITS Pilani','VIT Vellore','SRM Chennai','Delhi University'];

function Marquee() {
  return (
    <div className="sf-mq">
      <div className="sf-mlbl">Trusted by students from</div>
      <div className="sf-mtrack">
        {[0,1].map(k => (
          <div className="sf-mslide" key={k} aria-hidden={k===1}>
            {unis.map(u => <span className="sf-uni" key={u}>{u}</span>)}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Pricing (Billing Ledger Style) ─── */
const PLANS_LANDING = [
  { key:'basic',  name:'PUBLIC INDEX',   price:0,    period:'PERPETUAL',                   desc:'Core matching and public registry access.',       features:['3 Active Connections','Public Squads Only','Basic Ledger','Standard Support'],                    color:'#4b5563' },
  { key:'pro',    name:'PRO LEDGER',     price:699,  period:'MONTHLY / BILLED ANNUALLY',   desc:'Advanced analytics and private vault access.',    features:['Unlimited Connections','Private Squads','Full History Sync','Priority Node Access'],             color:'#7c3aed', popular:true },
  { key:'squad',  name:'GUILD CHARTER',  price:1299, period:'MONTHLY / BILLED ANNUALLY',   desc:'For high-frequency groups and institutions.',     features:['Everything in Pro Ledger','50 Nodes per Squad','Advanced Admin Tooling','Immutable Vault Storage'], color:'#10b981' },
];

function Pricing() {
  const [annual, setAnnual] = useState(true);
  const price = (base) => annual ? base : Math.round(base * 1.15);

  return (
    <section className="sf-s" id="pricing">
      <style>{`
        .ledger-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1.25rem; max-width:980px; margin:0 auto; }
        .ledger-card { display:flex; flex-direction:column; border:1px solid rgba(255,255,255,0.12); background:rgba(255,255,255,0.02); transition:.3s; overflow:hidden; }
        .ledger-card:hover { transform:translateY(-4px); box-shadow:0 20px 50px rgba(0,0,0,0.4); }
        .ledger-tab { border-bottom:1px solid rgba(255,255,255,0.12); padding:.875rem 1.25rem; display:flex; justify-content:space-between; align-items:center; }
        .ledger-name { font-family:monospace; font-weight:900; font-size:.95rem; }
        .ledger-badge { font-family:monospace; font-size:.6rem; font-weight:800; padding:.15rem .5rem; border:1px solid; letter-spacing:.05em; }
        .ledger-body { padding:1.5rem; flex:1; display:flex; flex-direction:column; }
        .ledger-price { font-family:monospace; font-weight:900; font-size:2.4rem; color:#f0f0f5; line-height:1; }
        .ledger-period { font-family:monospace; font-size:.65rem; opacity:.5; margin-bottom:1rem; }
        .ledger-desc { font-family:monospace; font-size:.78rem; color:#8b8fa8; margin-bottom:1.25rem; min-height:36px; }
        .ledger-feats { display:flex; flex-direction:column; gap:.5rem; flex:1; margin-bottom:1.5rem; }
        .ledger-feat { display:flex; align-items:center; gap:.6rem; font-family:monospace; font-size:.78rem; color:#8b8fa8; border-bottom:1px dotted rgba(255,255,255,0.08); padding-bottom:.4rem; }
        .ledger-btn { width:100%; padding:.9rem; font-family:monospace; font-weight:900; font-size:.8rem; cursor:pointer; border:1px solid rgba(255,255,255,0.2); background:rgba(255,255,255,0.05); color:#f0f0f5; text-align:center; text-decoration:none; display:block; transition:.3s; letter-spacing:.05em; }
        .ledger-btn:hover { background:rgba(255,255,255,0.12); border-color:rgba(255,255,255,0.4); }
        @media(max-width:900px){ .ledger-grid{ grid-template-columns:1fr 1fr; } }
        @media(max-width:600px){ .ledger-grid{ grid-template-columns:1fr; } }
      `}</style>
      <div className="sf-w">
        <div className="sf-sh">
          <p style={{fontFamily:'monospace',fontSize:'.72rem',fontWeight:700,letterSpacing:'.2em',textTransform:'uppercase',color:'#a78bfa',marginBottom:'1rem'}}>// SUBSCRIPTION_MANIFEST</p>
          <h2 className="sf-h2" style={{color:'#f0f0f5'}}>Invest in your future.</h2>
        </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'.75rem',marginBottom:'2.5rem'}}>
          <span style={{fontFamily:'monospace',fontSize:'.85rem',color:'#8b8fa8'}}>Monthly</span>
          <div className={`tg${annual?' on':''}`} onClick={()=>setAnnual(!annual)}><div className="tk"/></div>
          <span style={{fontFamily:'monospace',fontSize:'.85rem',color:annual?'#f0f0f5':'#8b8fa8',fontWeight:annual?700:400}}>Annually</span>
          <span className="sv" style={{fontFamily:'monospace'}}>Save 15%</span>
        </div>
        <div className="ledger-grid">
          {PLANS_LANDING.map((plan) => (
            <div className="ledger-card" key={plan.key} style={{borderColor:plan.popular?plan.color:'rgba(255,255,255,0.12)',boxShadow:plan.popular?`0 0 40px ${plan.color}22`:'none'}}>
              <div className="ledger-tab" style={{background:plan.popular?`${plan.color}22`:'transparent',borderBottomColor:plan.popular?plan.color:'rgba(255,255,255,0.12)'}}>
                <span className="ledger-name" style={{color:plan.popular?plan.color:'#f0f0f5'}}>{plan.name}</span>
                {plan.popular && <span className="ledger-badge" style={{borderColor:plan.color,color:plan.color}}>STANDARD</span>}
              </div>
              <div className="ledger-body">
                <div style={{marginBottom:'.25rem'}}>
                  {plan.price===0
                    ? <span className="ledger-price">FREE</span>
                    : <span className="ledger-price">₹{price(plan.price).toLocaleString('en-IN')}</span>
                  }
                </div>
                <div className="ledger-period">REF: {annual?plan.period:'MONTHLY / NO DISCOUNT'}</div>
                <div className="ledger-desc">{plan.desc}</div>
                <div className="ledger-feats">
                  {plan.features.map(f=>(
                    <div className="ledger-feat" key={f}>
                      <svg width="13" height="13" fill="none" stroke={plan.color} strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                      {f}
                    </div>
                  ))}
                </div>
                <a href="/register" className="ledger-btn">
                  {plan.key==='basic'?'GET_STARTED →':`AUTHORIZE_UPGRADE → ${plan.key.toUpperCase()}`}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


/* ─── Nav ─── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);
  return (
    <>
      <nav className={`sf-nav${scrolled?' sc':''}`} id="sf-nav">
        <a href="#top" className="sf-brand"><div className="sf-bicon">S</div><span>StudyFriend</span></a>
        <div className="sf-nl">
          <a href="#features">Features</a>
          <a href="#watch">Demo</a>
          <a href="#how">How It Works</a>
          <a href="#pricing">Pricing</a>
        </div>
        <div className="sf-na">
          <a href="/login" className="btn-ghost">Log In</a>
          <a href="/register" className="btn-p">Start Free</a>
        </div>
        <button className={`mob-toggle${mobile?' open':''}`} onClick={()=>setMobile(!mobile)} aria-label="Menu">
          <span/><span/><span/>
        </button>
      </nav>
      <div className={`mob-menu${mobile?' show':''}`} id="mob-menu">
        <a href="#features" onClick={()=>setMobile(false)}>Features</a>
        <a href="#watch" onClick={()=>setMobile(false)}>Demo</a>
        <a href="#how" onClick={()=>setMobile(false)}>How It Works</a>
        <a href="#pricing" onClick={()=>setMobile(false)}>Pricing</a>
        <a href="/register" className="btn-p" style={{fontSize:'1.1rem',padding:'.9rem 2rem',marginTop:8}}>Start Free</a>
      </div>
    </>
  );
}

/* ─── Main ─── */
export default function Landing() {
  const cvRef = useRef(null);
  const spRef = useRef(null);


  // Loader
  useEffect(() => {
    const t = setTimeout(() => {
      const el = document.getElementById('sf-loader');
      if (el) el.classList.add('out');
    }, 900);
    return () => clearTimeout(t);
  }, []);

  // Scroll progress
  useEffect(() => {
    const h = () => {
      const tot = document.documentElement.scrollHeight - window.innerHeight;
      if (spRef.current) spRef.current.style.width = (window.pageYOffset / tot * 100) + '%';
    };
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  // Particles canvas
  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const rs = () => { cv.width = innerWidth; cv.height = innerHeight; };
    rs(); window.addEventListener('resize', rs);
    const pts = Array.from({length:50}, () => ({
      x: Math.random()*innerWidth, y: Math.random()*innerHeight,
      vx: (Math.random()-.5)*.35, vy: (Math.random()-.5)*.35,
      s: Math.random()*1.6+.4, o: Math.random()*.35+.08
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0,0,cv.width,cv.height);
      pts.forEach(p => {
        p.x+=p.vx; p.y+=p.vy;
        if(p.x>cv.width)p.x=0; if(p.x<0)p.x=cv.width;
        if(p.y>cv.height)p.y=0; if(p.y<0)p.y=cv.height;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.s,0,Math.PI*2);
        ctx.fillStyle=`rgba(124,58,237,${p.o})`; ctx.fill();
      });
      for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++){
        const dx=pts[i].x-pts[j].x, dy=pts[i].y-pts[j].y, d=Math.sqrt(dx*dx+dy*dy);
        if(d<130){ ctx.beginPath(); ctx.strokeStyle=`rgba(124,58,237,${(1-d/130)*.1})`; ctx.lineWidth=.4; ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[j].x,pts[j].y); ctx.stroke(); }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', rs); };
  }, []);

  // Smooth anchor scrolling
  useEffect(() => {
    const h = (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const t = document.querySelector(a.getAttribute('href'));
      if (t) { e.preventDefault(); window.scrollTo({top: t.getBoundingClientRect().top + pageYOffset - 80, behavior:'smooth'}); }
    };
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, []);

  return (
    <>
      <style>{css}</style>

      {/* Loader */}
      <div id="sf-loader"><div className="ll"><div className="lbox">S</div><span>StudyFriend</span></div></div>

      {/* Scroll progress */}
      <div className="sp-bar" ref={spRef}/>

      {/* Background */}
      <div className="bg-grid"/>
      <div className="bg-noise"/>
      <canvas id="sf-cv" ref={cvRef}/>

      {/* Navbar */}
      <Navbar/>

      {/* HERO */}
      <HeroSection/>

      {/* VIDEO DEMO */}
      <VideoShowcase/>

      {/* FEATURES */}
      <CoreFeatures/>

      {/* LIVE DEMO / MATCHMAKER */}
      <PlayableSandbox/>

      {/* MARQUEE */}
      <Marquee/>

      {/* HOW IT WORKS */}
      <HowItWorks/>

      {/* PRICING */}
      <Pricing/>

      {/* CTA */}
      <section className="cta-s">
        <div className="sf-w">
          <h2 className="ctatitle">Ready to <span className="gt">transcend?</span></h2>
          <a href="/register" className="btn-green">Launch Your First Hub</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="sf-w">
          <div className="fb2"><div className="sf-bicon" style={{width:30,height:30,fontSize:'.85rem',borderRadius:'.5rem'}}>S</div><span>StudyFriend</span></div>
          <p className="fc2">© 2026 StudyFriend Inc. · <a href="/login" style={{color:'#a78bfa'}}>Log In</a> · <a href="/register" style={{color:'#a78bfa'}}>Sign Up</a></p>
        </div>
      </footer>
    </>
  );
}
