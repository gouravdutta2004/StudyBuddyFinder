import React, { useEffect, useRef } from 'react';

const S = {
  hero: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden', padding:'130px 0 60px', textAlign:'center', background:'radial-gradient(ellipse at 50% 0%,rgba(124,58,237,0.14) 0%,rgba(16,185,129,0.05) 40%,transparent 70%)' },
  inner: { position:'relative', zIndex:1, width:'100%', maxWidth:1100, margin:'0 auto', padding:'0 1.5rem' },
  cardWrap: { perspective:1200 },
  card: { width:'100%', maxWidth:960, margin:'0 auto', background:'#0f1423', border:'1.5px solid rgba(124,58,237,0.18)', borderRadius:32, boxShadow:'0 20px 60px rgba(0,0,0,0.5),0 0 60px rgba(124,58,237,0.2),inset 0 1px 0 rgba(255,255,255,0.05)', overflow:'hidden', position:'relative', transformStyle:'preserve-3d', transition:'transform .6s cubic-bezier(0.34,1.56,0.64,1)' },
  bbar: { display:'flex', alignItems:'center', gap:7, padding:'13px 18px', background:'rgba(0,0,0,0.28)', borderBottom:'1px solid rgba(255,255,255,0.06)' },
  dotR: { width:11, height:11, borderRadius:'50%', background:'#ff5f57' },
  dotY: { width:11, height:11, borderRadius:'50%', background:'#febc2e' },
  dotG: { width:11, height:11, borderRadius:'50%', background:'#28c840' },
  burl: { flex:1, marginLeft:10, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:9999, padding:'5px 14px', fontSize:'0.72rem', color:'#5a5f7a' },
  blive: { fontSize:'0.7rem', padding:'4px 10px', background:'rgba(16,185,129,0.12)', color:'#10b981', border:'1px solid rgba(16,185,129,0.22)', borderRadius:9999, fontWeight:700 },
  hcontent: { padding:'3rem 3rem 3.5rem' },
  badge: { fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', color:'#10b981', marginBottom:'1.25rem', display:'inline-block' },
  htitle: { fontFamily:'"Space Grotesk",sans-serif', fontSize:'clamp(2.8rem,8vw,5.5rem)', fontWeight:900, lineHeight:.98, letterSpacing:'-.03em', marginBottom:'1.25rem', color:'#f0f0f5' },
  gt: { background:'linear-gradient(135deg,#f0f0f5 0%,#a78bfa 50%,#7c3aed 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' },
  hsub: { fontSize:'1.05rem', color:'#8b8fa8', maxWidth:500, margin:'0 auto 2rem', lineHeight:1.7 },
  ctas: { display:'flex', alignItems:'center', justifyContent:'center', gap:'1rem', flexWrap:'wrap' },
  btnP: { display:'inline-flex', alignItems:'center', gap:'.5rem', padding:'.9rem 2rem', background:'linear-gradient(135deg,#7c3aed,#5b21b6)', color:'#fff', borderRadius:9999, fontWeight:600, fontSize:'1rem', cursor:'pointer', border:'none', fontFamily:'inherit', boxShadow:'0 6px 20px rgba(124,58,237,0.25)', transition:'all .3s', textDecoration:'none' },
  btnO: { display:'inline-flex', alignItems:'center', gap:'.5rem', padding:'.9rem 1.75rem', border:'1.5px solid rgba(255,255,255,0.2)', color:'#f0f0f5', borderRadius:9999, fontWeight:600, fontSize:'1rem', cursor:'pointer', background:'none', fontFamily:'inherit', transition:'all .3s', textDecoration:'none' },
  stats: { display:'flex', justifyContent:'center', gap:'2.5rem', marginTop:'2.5rem', flexWrap:'wrap' },
  statVal: { fontFamily:'"Space Grotesk",sans-serif', fontSize:'1.8rem', fontWeight:800, lineHeight:1 },
  statLbl: { fontSize:'0.72rem', color:'#5a5f7a', marginTop:4 },
  sdiv: { width:1, height:34, background:'rgba(255,255,255,0.06)', alignSelf:'center' },
  scrollHint: { position:'absolute', bottom:28, left:'50%', transform:'translateX(-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:8, color:'#5a5f7a', fontSize:'.68rem', opacity:0, animation:'fiu .8s ease 2.4s forwards', pointerEvents:'none' },
  orb1: { position:'absolute', borderRadius:'50%', filter:'blur(120px)', width:700, height:700, background:'rgba(124,58,237,0.08)', top:-250, right:-150, animation:'orbF 25s ease-in-out infinite' },
  orb2: { position:'absolute', borderRadius:'50%', filter:'blur(120px)', width:500, height:500, background:'rgba(16,185,129,0.06)', bottom:-200, left:-100, animation:'orbF 32s ease-in-out infinite reverse' },
  orb3: { position:'absolute', borderRadius:'50%', filter:'blur(120px)', width:400, height:400, background:'rgba(124,58,237,0.05)', top:'50%', left:'55%', animation:'orbF 38s ease-in-out infinite 5s' },
};

export default function HeroSection() {
  const cardRef = useRef(null);
  const countersInit = useRef(false);

  useEffect(() => {
    // Tilt
    const el = cardRef.current;
    if (!el) return;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const rx = (e.clientY - r.top - r.height/2) / 26;
      const ry = (r.width/2 - (e.clientX - r.left)) / 26;
      el.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-5px)`;
    };
    const onLeave = () => { el.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)'; };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave); };
  }, []);

  useEffect(() => {
    if (countersInit.current) return;
    countersInit.current = true;
    const counters = document.querySelectorAll('.hero-counter');
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target; const t = +el.dataset.t; const s = performance.now();
        const tick = (now) => {
          const p = Math.min((now - s) / 2000, 1);
          const v = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(t * v).toLocaleString();
          if (p < 1) requestAnimationFrame(tick); else el.textContent = t.toLocaleString();
        };
        requestAnimationFrame(tick);
        obs.unobserve(el);
      });
    }, { threshold: .5 });
    counters.forEach(c => obs.observe(c));
    return () => obs.disconnect();
  }, []);

  const magOver = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.transform = `translate(${(e.clientX - r.left - r.width/2) * 0.22}px,${(e.clientY - r.top - r.height/2) * 0.22}px)`;
  };
  const magOut = (e) => { e.currentTarget.style.transform = ''; };

  return (
    <section style={S.hero} id="top">
      <style>{`
        @keyframes orbF{0%,100%{transform:translate(0,0) scale(1)}25%{transform:translate(50px,-40px) scale(1.1)}50%{transform:translate(-40px,50px) scale(.9)}75%{transform:translate(30px,60px) scale(1.05)}}
        @keyframes fiu{from{opacity:0;transform:translate(-50%,28px)}to{opacity:1;transform:translate(-50%,0)}}
        @keyframes scrollBounce{0%,100%{transform:translateX(-50%) translateY(0);opacity:1}50%{transform:translateX(-50%) translateY(10px);opacity:.25}}
        .hero-btn-p:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(124,58,237,0.35)!important}
        .hero-btn-o:hover{border-color:#7c3aed!important;background:rgba(124,58,237,0.08)!important;transform:translateY(-2px)}
      `}</style>
      <div style={S.orb1} /><div style={S.orb2} /><div style={S.orb3} />
      <div style={S.inner}>
        <div style={S.cardWrap}>
          <div ref={cardRef} style={S.card}>
            <div style={S.bbar}>
              <div style={S.dotR}/><div style={S.dotY}/><div style={S.dotG}/>
              <div style={S.burl}>studyfriend.app</div>
              <div style={S.blive}>● Live</div>
            </div>
            <div style={S.hcontent}>
              <div style={S.badge}>✦ STUDYFRIEND</div>
              <h1 style={S.htitle}>Find your<br/><span style={S.gt}>Tribe.</span></h1>
              <p style={S.hsub}>The ultimate study operating system. Match with perfect study partners, join live hubs, and accelerate your learning.</p>
              <div style={S.ctas}>
                <a href="/register" className="hero-btn-p" style={S.btnP} onMouseMove={magOver} onMouseLeave={magOut}>
                  Start Free
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </a>
                <a href="#watch" className="hero-btn-o" style={S.btnO} onMouseMove={magOver} onMouseLeave={magOut}>
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21"/></svg>
                  Watch Demo
                </a>
              </div>
              <div style={S.stats}>
                <div style={{textAlign:'center'}}><div className="hero-counter" data-t="2500" style={S.statVal}>0</div><div style={S.statLbl}>Active Students</div></div>
                <div style={S.sdiv}/>
                <div style={{textAlign:'center'}}><div className="hero-counter" data-t="15" style={S.statVal}>0</div><div style={S.statLbl}>Universities</div></div>
                <div style={S.sdiv}/>
                <div style={{textAlign:'center'}}><div className="hero-counter" data-t="98" style={S.statVal}>0</div><div style={S.statLbl}>Match Rate %</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div style={S.scrollHint}>
        <div style={{width:22,height:36,border:'2px solid rgba(255,255,255,0.12)',borderRadius:11,position:'relative'}}>
          <div style={{content:'""',width:3,height:7,background:'#7c3aed',borderRadius:9999,position:'absolute',top:6,left:'50%',animation:'scrollBounce 2s ease-in-out infinite'}}/>
        </div>
        <span>Scroll to explore</span>
      </div>
    </section>
  );
}
