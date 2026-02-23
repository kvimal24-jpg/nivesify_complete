"use client";

import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";

const CSS = `
  *, *::before, *::after { box-sizing: border-box; }

  .hero-grid {
    display: grid; grid-template-columns: 1fr; gap: 40px; align-items: center;
  }
  @media (min-width: 900px) { .hero-grid { grid-template-columns: 1fr 1fr; gap: 64px; } }
  .hero-visual { display: none; }
  @media (min-width: 900px) { .hero-visual { display: block; } }

  .tool-cards {
    display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
  }
  @media (min-width: 600px) { .tool-cards { grid-template-columns: repeat(4,1fr); gap: 12px; } }

  .story-row {
    display: grid; grid-template-columns: 1fr; gap: 32px; align-items: center;
  }
  @media (min-width: 700px) { .story-row { grid-template-columns: 1fr 1fr; gap: 56px; } }

  .story-flip > *:first-child { order: 1; }
  @media (min-width: 700px) {
    .story-flip > *:first-child { order: 2; }
    .story-flip > *:last-child  { order: 1; }
  }

  .steps-row {
    display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
  }
  @media (min-width: 600px) { .steps-row { grid-template-columns: repeat(4,1fr); gap: 14px; } }

  .card-lift { transition: box-shadow .25s, transform .25s; }
  .card-lift:hover { box-shadow: 0 16px 48px rgba(0,0,0,.11) !important; transform: translateY(-4px) !important; }

  .tool-lift { transition: box-shadow .2s, transform .2s; }
  .tool-lift:hover { box-shadow: 0 8px 24px rgba(0,0,0,.10) !important; transform: translateY(-3px) !important; }

  .cta-p { transition: transform .18s, box-shadow .18s; }
  .cta-p:hover { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(5,150,105,.40) !important; }

  .cta-g { transition: transform .18s, box-shadow .18s; }
  .cta-g:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,.08) !important; }

  .banner-lift { transition: transform .25s, box-shadow .25s; }
  .banner-lift:hover { transform: translateY(-3px); box-shadow: 0 20px 56px rgba(0,0,0,.22) !important; }

  @keyframes float {
    0%,100% { transform: translateY(0); } 50% { transform: translateY(-7px); }
  }
  .float { animation: float 4.5s ease-in-out infinite; }

  @keyframes blink {
    0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.45; transform:scale(1.6); }
  }
  .blink { animation: blink 2s ease-in-out infinite; }

  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  .shine {
    background: linear-gradient(90deg,#059669 0%,#10b981 35%,#2563EB 65%,#059669 100%);
    background-size: 200% auto;
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    animation: shimmer 4s linear infinite;
  }

  @keyframes tick { 0% { transform:translateX(0); } 100% { transform:translateX(-50%); } }
  .tick { display:flex; animation: tick 32s linear infinite; width:max-content; }
  .tick:hover { animation-play-state:paused; }
`;

function Reveal({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); ob.disconnect(); } }, { threshold: 0.05 });
    if (ref.current) ob.observe(ref.current);
    return () => ob.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ opacity: v?1:0, transform: v?"translateY(0)":"translateY(22px)", transition:`opacity .65s ease ${delay}ms, transform .65s ease ${delay}ms`, ...style }}>
      {children}
    </div>
  );
}

const SEGS = [
  { pct:42, color:"#2563EB", label:"Equity MF",  val:"₹19.9L" },
  { pct:18, color:"#059669", label:"Debt MF",    val:"₹8.5L"  },
  { pct:16, color:"#D97706", label:"PF / EPF",   val:"₹7.6L"  },
  { pct:14, color:"#7C3AED", label:"Gold",        val:"₹6.6L"  },
  { pct:10, color:"#0891B2", label:"FD / Cash",  val:"₹4.7L"  },
];

function Donut({ size = 96 }: { size?: number }) {
  const r = size * 0.36, cx = size/2, cy = size/2, C = 2*Math.PI*r; let cum = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink:0 }}>
      {SEGS.map((s,i)=>{ const dash=(s.pct/100)*C, off=C-(cum/100)*C; cum+=s.pct;
        return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={size*.14} strokeDasharray={`${dash} ${C-dash}`} strokeDashoffset={off} style={{ transformOrigin:`${cx}px ${cy}px`, transform:"rotate(-90deg)" }}/>;
      })}
      <circle cx={cx} cy={cy} r={r*.55} fill="white"/>
      <text x={cx} y={cy-5} textAnchor="middle" fontSize={size*.10} fontWeight="900" fill="#0F172A" fontFamily="DM Sans,system-ui">₹47.3L</text>
      <text x={cx} y={cy+10} textAnchor="middle" fontSize={size*.085} fill="#059669" fontFamily="DM Sans,system-ui">↑18.4%</text>
    </svg>
  );
}

function Spark({ pts, color, w=56, h=20 }: { pts:number[]; color:string; w?:number; h?:number }) {
  const mn=Math.min(...pts), mx=Math.max(...pts), rng=mx-mn||1;
  const xs=pts.map((_,i)=>(i/(pts.length-1))*w);
  const ys=pts.map(v=>h-((v-mn)/rng)*(h-4)-2);
  const d=xs.map((x,i)=>`${i?"L":"M"}${x},${ys[i]}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow:"visible", flexShrink:0 }}>
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={xs[xs.length-1]} cy={ys[ys.length-1]} r="3" fill={color}/>
    </svg>
  );
}

function WealthChart() {
  const W=280, H=128;
  const fd=[10,10.7,11.5,12.3,13.2,14.2,15.2,16.3,17.5,18.8];
  const mf=[10,11.4,13.1,15.0,17.3,19.8,22.8,26.2,30.1,34.6];
  const tx=(i:number)=>8+(i/9)*(W-16);
  const ty=(v:number)=>H-12-((v-8)/30)*(H-28);
  const fdP=fd.map((v,i)=>`${i?"L":"M"}${tx(i)},${ty(v)}`).join(" ");
  const mfP=mf.map((v,i)=>`${i?"L":"M"}${tx(i)},${ty(v)}`).join(" ");
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height:"auto", display:"block" }}>
        <defs><linearGradient id="gm2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#059669" stopOpacity=".18"/><stop offset="100%" stopColor="#059669" stopOpacity="0"/></linearGradient></defs>
        {[.3,.6].map((p,i)=><line key={i} x1="8" y1={H*p} x2={W-8} y2={H*p} stroke="#F1F5F9" strokeWidth="1"/>)}
        <path d={`${fdP} L${tx(9)},${H} L${tx(0)},${H} Z`} fill="rgba(148,163,184,.08)"/>
        <path d={fdP} fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="4 3"/>
        <path d={`${mfP} L${tx(9)},${H} L${tx(0)},${H} Z`} fill="url(#gm2)"/>
        <path d={mfP} fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx={tx(9)} cy={ty(mf[9])} r="4" fill="#059669"/>
        <rect x={tx(9)+6} y={ty(mf[9])-10} width={54} height={18} rx="4" fill="#059669"/>
        <text x={tx(9)+10} y={ty(mf[9])+3} fontSize="9" fontWeight="800" fill="white" fontFamily="DM Sans,system-ui">₹34.6L MF</text>
        <circle cx={tx(9)} cy={ty(fd[9])} r="3" fill="#94A3B8"/>
        <text x={tx(9)+6} y={ty(fd[9])+4} fontSize="8" fill="#94A3B8" fontFamily="DM Sans,system-ui">₹18.8L FD</text>
        {["Y1","","Y3","","Y5","","Y7","","","Y10"].map((l,i)=>l&&<text key={i} x={tx(i)} y={H+2} fontSize="7.5" fill="#CBD5E1" fontFamily="DM Sans,system-ui" textAnchor="middle">{l}</text>)}
      </svg>
      <div style={{ display:"flex", gap:14, justifyContent:"center", marginTop:10, flexWrap:"wrap" as const }}>
        {[{c:"#059669",l:"Equity MF (~14% CAGR)",dash:false},{c:"#CBD5E1",l:"FD post-tax (~5%)",dash:true}].map((i2,i)=>(
          <div key={i} style={{ display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ width:16, height:2, background:i2.dash?"none":i2.c, backgroundImage:i2.dash?`repeating-linear-gradient(90deg,${i2.c} 0,${i2.c} 4px,transparent 4px,transparent 7px)`:"none", borderRadius:1 }}/>
            <span style={{ fontSize:10, color:"#64748B", fontWeight:600 }}>{i2.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const FUNDS = [
  { name:"Parag Parikh Flexi Cap", xirr:18.7, alpha:"+4.6%", tag:"HOLD",   tc:"#059669", tb:"#ECFDF5", tbd:"#A7F3D0", pts:[35,38,43,46,50,55,57,62,67,72], color:"#2563EB" },
  { name:"HDFC Mid Cap Opp.",      xirr:11.3, alpha:"-2.8%", tag:"REVIEW", tc:"#D97706", tb:"#FFFBEB", tbd:"#FDE68A", pts:[50,48,46,44,47,43,45,44,44,42], color:"#D97706" },
  { name:"SBI Small Cap",          xirr: 9.1, alpha:"-5.0%", tag:"EXIT",   tc:"#DC2626", tb:"#FEF2F2", tbd:"#FECACA", pts:[55,52,48,44,40,38,35,33,31,28], color:"#DC2626" },
];

const TOOLS = [
  { href:"/dashboard",                          icon:"📊", label:"Money Dashboard",  sub:"Net worth · all assets",    color:"#2563EB", bg:"#EFF6FF", bd:"#BFDBFE", bar:"linear-gradient(90deg,#2563EB,#7C3AED)" },
  { href:"/mutual-fund-health-check/dashboard", icon:"🏥", label:"Fund Health Check", sub:"XIRR · signals · alpha",   color:"#059669", bg:"#ECFDF5", bd:"#A7F3D0", bar:"linear-gradient(90deg,#059669,#0891B2)" },
  { href:"/mutual-fund-match",                  icon:"🗺️", label:"MF World",          sub:"Explore & compare funds",  color:"#7C3AED", bg:"#F5F3FF", bd:"#DDD6FE", bar:"linear-gradient(90deg,#7C3AED,#2563EB)" },
  { href:"/dashboard/calculators",              icon:"🧮", label:"Life Calculators",  sub:"FIRE · goals · retirement",color:"#D97706", bg:"#FFFBEB", bd:"#FDE68A", bar:"linear-gradient(90deg,#D97706,#DC2626)" },
];

const TICK = ["📊 Net Worth","🏥 Fund Health Check","⚡ True XIRR","🔥 FIRE Planner","🗺️ MF Style Matrix","🎯 Goal Tracker","🔬 Fund Comparison","📈 SIP Tracker","🏖️ Retirement","💡 Alpha Screener"];

export default function Home() {
  const [on, setOn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setOn(true), 60); return () => clearTimeout(t); }, []);

  const [fv, setFv] = useState(false);
  const fref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setFv(true); ob.disconnect(); } }, { threshold:.1 });
    if (fref.current) ob.observe(fref.current);
    return () => ob.disconnect();
  }, []);

  const fi = (d:number):React.CSSProperties => ({
    opacity: on?1:0, transform: on?"translateY(0)":"translateY(20px)",
    transition: `opacity .65s ease ${d}ms, transform .65s ease ${d}ms`,
  });

  return (
    <main style={{ background:"#F8FAFC", minHeight:"100vh", fontFamily:"'DM Sans',system-ui,-apple-system,sans-serif", color:"#1F2937" }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ━━━━━━━ 1. HERO ━━━━━━━ */}
      <section style={{ background:"linear-gradient(155deg,#F0FDF4 0%,#EFF6FF 55%,#FFF7ED 100%)", borderBottom:"1px solid #E2E8F0", position:"relative", overflow:"hidden", padding:"clamp(44px,7vw,88px) clamp(16px,4vw,32px) clamp(40px,6vw,72px)" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle at 1px 1px,rgba(16,185,129,.07) 1px,transparent 0)", backgroundSize:"28px 28px", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", top:-120, right:-100, width:600, height:600, background:"radial-gradient(circle,rgba(59,130,246,.08) 0%,transparent 65%)", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", bottom:-80, left:-80, width:500, height:500, background:"radial-gradient(circle,rgba(16,185,129,.07) 0%,transparent 65%)", pointerEvents:"none" }}/>

        <div style={{ maxWidth:1120, margin:"0 auto", position:"relative" }}>
          <div className="hero-grid">
            <div>
              <div style={fi(50)}>
                <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(16,185,129,.10)", border:"1px solid rgba(16,185,129,.25)", borderRadius:100, padding:"5px 14px", marginBottom:22 }}>
                  <span className="blink" style={{ width:7, height:7, background:"#10B981", borderRadius:"50%", display:"block", flexShrink:0 }}/>
                  <span style={{ fontSize:11, fontWeight:700, color:"#065F46", letterSpacing:".08em", textTransform:"uppercase" as const }}>Free · Built for Indian Investors</span>
                </div>
              </div>
              <div style={fi(100)}>
                <h1 style={{ fontSize:"clamp(2rem,5.8vw,3.8rem)", fontWeight:900, color:"#0F172A", lineHeight:1.06, letterSpacing:"-.04em", margin:"0 0 18px" }}>
                  Your complete<br/>financial picture.<br/><span className="shine">Finally clear.</span>
                </h1>
              </div>
              <div style={fi(160)}>
                <p style={{ fontSize:"clamp(14px,1.9vw,17px)", color:"#334155", lineHeight:1.8, maxWidth:460, margin:"0 0 8px", fontWeight:500 }}>
                  Track <strong style={{ color:"#0F172A" }}>all your investments</strong> in one place. Know if your <strong style={{ color:"#0F172A" }}>mutual funds are actually earning</strong>. Plan every <strong style={{ color:"#0F172A" }}>big life goal</strong> with real numbers — not guesswork.
                </p>
              </div>
              <div style={fi(195)}>
                <p style={{ fontSize:"clamp(12px,1.5vw,13px)", color:"#059669", fontWeight:700, fontStyle:"italic", margin:"0 0 28px" }}>
                  For salaried Indians with MFs, PF, FDs &amp; life goals.
                </p>
              </div>
              <div style={{ ...fi(245), display:"flex", gap:10, flexWrap:"wrap" as const, marginBottom:24 }}>
                <Link href="/mutual-fund-health-check/dashboard" style={{ textDecoration:"none" }}>
                  <button className="cta-p" style={{ background:"linear-gradient(90deg,#059669,#2563EB)", color:"white", border:"none", borderRadius:13, padding:"13px 22px", fontSize:14, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", gap:7, boxShadow:"0 4px 20px rgba(5,150,105,.28)", minHeight:48 }}>
                    Check My Funds 🏥
                  </button>
                </Link>
                <Link href="/dashboard" style={{ textDecoration:"none" }}>
                  <button className="cta-g" style={{ background:"white", color:"#0F172A", border:"1.5px solid #E2E8F0", borderRadius:13, padding:"13px 22px", fontSize:14, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:7, boxShadow:"0 2px 8px rgba(0,0,0,.05)", minHeight:48 }}>
                    See My Net Worth →
                  </button>
                </Link>
              </div>
              <div style={{ ...fi(295), display:"flex", gap:20, flexWrap:"wrap" as const }}>
                {[["🔒","No login to explore"],["✅","No ads, ever"],["🇮🇳","India-specific data"]].map(([ic,tx],i)=>(
                  <span key={i} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11.5, fontWeight:600, color:"#64748B" }}><span>{ic}</span>{tx}</span>
                ))}
              </div>
            </div>

            <div className="hero-visual">
              <div className="float" style={{ background:"white", borderRadius:22, border:"1.5px solid #E2E8F0", boxShadow:"0 28px 80px rgba(0,0,0,.10)", overflow:"hidden" }}>
                <div style={{ background:"#F8FAFC", borderBottom:"1px solid #F1F5F9", padding:"9px 14px", display:"flex", alignItems:"center", gap:6 }}>
                  {["#FC5F57","#FEBC2E","#27C840"].map((c,i)=><div key={i} style={{ width:10, height:10, borderRadius:"50%", background:c }}/>)}
                  <div style={{ flex:1, background:"#F1F5F9", borderRadius:5, height:16, marginLeft:8, display:"flex", alignItems:"center", paddingLeft:8 }}>
                    <span style={{ fontSize:8.5, color:"#94A3B8", fontWeight:600 }}>nivesify.com/dashboard</span>
                  </div>
                </div>
                <div style={{ padding:18 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
                    <div>
                      <div style={{ fontSize:10, color:"#94A3B8", fontWeight:600, marginBottom:2 }}>Total Net Worth</div>
                      <div style={{ fontSize:24, fontWeight:900, color:"#0F172A", lineHeight:1 }}>₹47.3L</div>
                      <div style={{ fontSize:11, color:"#059669", fontWeight:700, marginTop:3 }}>↑ +18.4% · ₹7.3L gain this year</div>
                    </div>
                    <div style={{ background:"#ECFDF5", border:"1px solid #A7F3D0", borderRadius:10, padding:"7px 12px", textAlign:"center" as const }}>
                      <div style={{ fontSize:9.5, color:"#059669", fontWeight:700 }}>Health Score</div>
                      <div style={{ fontSize:22, fontWeight:900, color:"#059669" }}>84/100</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:12 }}>
                    <Donut size={92}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      {SEGS.map((s,i)=>(
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:5, marginBottom:5 }}>
                          <div style={{ width:7, height:7, borderRadius:2, background:s.color, flexShrink:0 }}/>
                          <span style={{ fontSize:10, color:"#374151", fontWeight:600, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>{s.label}</span>
                          <span style={{ fontSize:10, fontWeight:800, color:s.color }}>{s.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ borderTop:"1px solid #F1F5F9", paddingTop:8, display:"flex", justifyContent:"space-between" }}>
                    <span style={{ fontSize:11, fontWeight:800, color:"#0F172A" }}>Total Net Worth</span>
                    <span style={{ fontSize:13, fontWeight:900, color:"#059669" }}>₹47.3L ↑ 18.4%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━ TICKER ━━━━━━━ */}
      <div style={{ overflow:"hidden", borderBottom:"1px solid #E2E8F0", background:"#F8FAFC", padding:"10px 0" }}>
        <div className="tick">
          {[...TICK,...TICK].map((item,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:6, padding:"0 22px", whiteSpace:"nowrap" as const, borderRight:"1px solid #E2E8F0", height:26 }}>
              <span style={{ fontSize:11, fontWeight:700, color:"#475569" }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ━━━━━━━ 2. TOOL CARDS ━━━━━━━ */}
      <section style={{ background:"white", borderBottom:"1px solid #E2E8F0", padding:"clamp(18px,3vw,26px) clamp(16px,4vw,32px)" }}>
        <div style={{ maxWidth:1120, margin:"0 auto" }}>
          <div className="tool-cards">
            {TOOLS.map((t,i)=>(
              <Reveal key={i} delay={i*55}>
                <Link href={t.href} style={{ textDecoration:"none", display:"block" }}>
                  <div className="tool-lift" style={{ background:t.bg, border:`1.5px solid ${t.bd}`, borderRadius:15, padding:"clamp(13px,2vw,17px) clamp(12px,1.8vw,15px)", position:"relative", overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,.04)" }}>
                    <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:t.bar, borderRadius:"15px 15px 0 0" }}/>
                    <div style={{ fontSize:"clamp(20px,2.5vw,24px)", marginBottom:7, marginTop:3 }}>{t.icon}</div>
                    <div style={{ fontSize:"clamp(11.5px,1.7vw,13px)", fontWeight:800, color:"#0F172A", lineHeight:1.2, marginBottom:3 }}>{t.label}</div>
                    <div style={{ fontSize:"clamp(9.5px,1.3vw,11px)", color:"#64748B", lineHeight:1.4, marginBottom:8 }}>{t.sub}</div>
                    <div style={{ fontSize:11, fontWeight:700, color:t.color }}>Open →</div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━ 3. KNOW YOUR NET WORTH ━━━━━━━ */}
      <section style={{ maxWidth:1120, margin:"0 auto", padding:"clamp(40px,6vw,72px) clamp(16px,4vw,32px)" }}>
        <Reveal>
          <div className="story-row">
            <div>
              <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(37,99,235,.08)", border:"1px solid rgba(37,99,235,.20)", borderRadius:100, padding:"4px 12px", marginBottom:12 }}>
                <span style={{ fontSize:11, fontWeight:700, color:"#1D4ED8", letterSpacing:".08em", textTransform:"uppercase" as const }}>Start here</span>
              </div>
              <h2 style={{ fontSize:"clamp(1.3rem,3.5vw,2rem)", fontWeight:900, color:"#0F172A", lineHeight:1.15, letterSpacing:"-.03em", margin:"0 0 14px" }}>
                Do you actually know<br/>how much you're worth?
              </h2>
              <p style={{ fontSize:"clamp(13px,1.7vw,15px)", color:"#475569", lineHeight:1.85, maxWidth:420, margin:"0 0 12px" }}>
                Most people have money spread across mutual funds, PF, FDs, gold, and savings accounts — with no single view of the full picture. Just a rough guess.
              </p>
              <p style={{ fontSize:"clamp(13px,1.7vw,15px)", color:"#0F172A", fontWeight:700, lineHeight:1.75, maxWidth:420, margin:"0 0 26px" }}>
                The Money Dashboard pulls everything together — one number, one screen, total clarity.
              </p>
              <Link href="/dashboard" style={{ textDecoration:"none" }}>
                <div className="cta-g" style={{ display:"inline-flex", alignItems:"center", gap:7, background:"white", border:"1.5px solid #BFDBFE", borderRadius:12, padding:"11px 18px", fontSize:13, fontWeight:700, color:"#2563EB", cursor:"pointer", boxShadow:"0 2px 8px rgba(0,0,0,.05)" }}>
                  📊 Open Money Dashboard →
                </div>
              </Link>
            </div>

            <div>
              <div className="card-lift" style={{ background:"white", borderRadius:20, border:"1.5px solid #E2E8F0", overflow:"hidden", boxShadow:"0 6px 28px rgba(0,0,0,.07)" }}>
                <div style={{ height:4, background:"linear-gradient(90deg,#2563EB,#7C3AED)" }}/>
                <div style={{ padding:"18px 18px 14px", background:"linear-gradient(135deg,#EFF6FF,#F5F3FF)" }}>
                  <div style={{ fontSize:10, color:"#94A3B8", fontWeight:600, marginBottom:4 }}>Total Net Worth</div>
                  <div style={{ fontSize:26, fontWeight:900, color:"#0F172A", lineHeight:1 }}>₹47.3L</div>
                  <div style={{ fontSize:11, color:"#059669", fontWeight:700, marginTop:4 }}>↑ +18.4% · ₹7.3L gain this year</div>
                </div>
                <div style={{ padding:"16px 18px 18px" }}>
                  <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:14 }}>
                    <Donut size={84}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      {SEGS.map((s,i)=>(
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:5, marginBottom:5 }}>
                          <div style={{ width:7, height:7, borderRadius:2, background:s.color, flexShrink:0 }}/>
                          <span style={{ fontSize:10, color:"#374151", fontWeight:600, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>{s.label}</span>
                          <span style={{ fontSize:10, fontWeight:800, color:s.color }}>{s.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ borderTop:"1px solid #F1F5F9", paddingTop:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:12, fontWeight:800, color:"#0F172A" }}>Total Net Worth</span>
                    <span style={{ fontSize:14, fontWeight:900, color:"#059669" }}>₹47.3L ↑ 18.4%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ━━━━━━━ 4. FUND HEALTH — flipped layout ━━━━━━━ */}
      <section style={{ background:"white", borderTop:"1px solid #E2E8F0", borderBottom:"1px solid #E2E8F0" }}>
        <div style={{ maxWidth:1120, margin:"0 auto", padding:"clamp(40px,6vw,72px) clamp(16px,4vw,32px)" }}>
          <Reveal>
            <div className="story-row story-flip">
              {/* Visual — shows second on mobile, first on desktop */}
              <div ref={fref}>
                <div className="card-lift" style={{ background:"white", borderRadius:20, border:"1.5px solid #E2E8F0", overflow:"hidden", boxShadow:"0 6px 28px rgba(0,0,0,.07)" }}>
                  <div style={{ height:4, background:"linear-gradient(90deg,#059669,#0891B2)" }}/>
                  <div style={{ padding:"14px 16px", background:"linear-gradient(135deg,#ECFDF5,#ECFEFF)", borderBottom:"1px solid #F1F5F9" }}>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 44px 36px 46px", gap:6, paddingBottom:8, borderBottom:"1px solid #D1FAE5", marginBottom:2 }}>
                      {["Fund","Trend","XIRR","Signal"].map((h,i)=>(
                        <div key={i} style={{ fontSize:8.5, fontWeight:700, color:"#6EE7B7", textTransform:"uppercase" as const, letterSpacing:".05em" }}>{h}</div>
                      ))}
                    </div>
                    {FUNDS.map((fu,i)=>(
                      <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 44px 36px 46px", gap:6, alignItems:"center", padding:"9px 0", borderBottom:i<FUNDS.length-1?"1px solid #F1F5F9":"none", opacity:fv?1:0, transform:fv?"translateX(0)":"translateX(-10px)", transition:`opacity .45s ease ${i*90}ms, transform .45s ease ${i*90}ms` }}>
                        <div>
                          <div style={{ fontSize:10.5, fontWeight:700, color:"#0F172A", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>{fu.name}</div>
                          <div style={{ fontSize:9, fontWeight:600, color:fu.xirr>=14?"#059669":"#DC2626" }}>XIRR {fu.xirr}% · {fu.alpha}</div>
                        </div>
                        <Spark pts={fu.pts} color={fu.color} w={40} h={18}/>
                        <div style={{ fontSize:10, fontWeight:700, color:fu.xirr>=14?"#059669":"#DC2626" }}>{fu.xirr}%</div>
                        <div style={{ fontSize:8.5, fontWeight:800, padding:"2px 5px", borderRadius:100, background:fu.tb, border:`1px solid ${fu.tbd}`, color:fu.tc, textAlign:"center" as const, whiteSpace:"nowrap" as const }}>{fu.tag}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding:"12px 16px" }}>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" as const, alignItems:"center" }}>
                      {[["HOLD","#059669","#ECFDF5","#A7F3D0"],["REVIEW","#D97706","#FFFBEB","#FDE68A"],["EXIT","#DC2626","#FEF2F2","#FECACA"]].map(([l,c,bg,bd],i)=>(
                        <div key={i} style={{ background:bg, border:`1px solid ${bd}`, borderRadius:100, padding:"3px 9px", fontSize:9.5, fontWeight:800, color:c }}>{l}</div>
                      ))}
                      <span style={{ fontSize:10, color:"#94A3B8", fontWeight:600 }}>— every fund gets a clear verdict</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Text */}
              <div>
                <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(5,150,105,.08)", border:"1px solid rgba(5,150,105,.20)", borderRadius:100, padding:"4px 12px", marginBottom:12 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:"#059669", letterSpacing:".08em", textTransform:"uppercase" as const }}>The hard truth</span>
                </div>
                <h2 style={{ fontSize:"clamp(1.3rem,3.5vw,2rem)", fontWeight:900, color:"#0F172A", lineHeight:1.15, letterSpacing:"-.03em", margin:"0 0 14px" }}>
                  Are your mutual funds<br/>actually earning for you?
                </h2>
                <p style={{ fontSize:"clamp(13px,1.7vw,15px)", color:"#475569", lineHeight:1.85, maxWidth:420, margin:"0 0 12px" }}>
                  A fund's brochure might say 18% returns. But your actual XIRR — accounting for every SIP date and amount — is often very different. And if it's below its benchmark, you're losing ground silently.
                </p>
                <p style={{ fontSize:"clamp(13px,1.7vw,15px)", color:"#0F172A", fontWeight:700, lineHeight:1.75, maxWidth:420, margin:"0 0 26px" }}>
                  Fund Health Check gives every fund a clear signal: Hold, Review, or Exit. No jargon needed.
                </p>
                <Link href="/mutual-fund-health-check/dashboard" style={{ textDecoration:"none" }}>
                  <div className="cta-g" style={{ display:"inline-flex", alignItems:"center", gap:7, background:"white", border:"1.5px solid #A7F3D0", borderRadius:12, padding:"11px 18px", fontSize:13, fontWeight:700, color:"#059669", cursor:"pointer", boxShadow:"0 2px 8px rgba(0,0,0,.05)" }}>
                    🏥 Check My Portfolio →
                  </div>
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ━━━━━━━ 5. THE REAL GAP ━━━━━━━ */}
      <section style={{ maxWidth:1120, margin:"0 auto", padding:"clamp(36px,6vw,68px) clamp(16px,4vw,32px)" }}>
        <Reveal>
          <div style={{ background:"white", borderRadius:22, border:"1.5px solid #E2E8F0", padding:"clamp(20px,4vw,38px)", boxShadow:"0 4px 22px rgba(0,0,0,.05)" }}>
            <div className="story-row">
              <div>
                <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(5,150,105,.08)", border:"1px solid rgba(5,150,105,.20)", borderRadius:100, padding:"4px 11px", marginBottom:12 }}>
                  <span style={{ fontSize:10.5, fontWeight:700, color:"#059669", letterSpacing:".08em", textTransform:"uppercase" as const }}>The real gap</span>
                </div>
                <h2 style={{ fontSize:"clamp(1.2rem,3vw,1.7rem)", fontWeight:800, color:"#0F172A", margin:"0 0 10px", lineHeight:1.2, letterSpacing:"-.02em" }}>
                  ₹10L. 10 years.<br/><span style={{ color:"#059669" }}>One choice. Massive difference.</span>
                </h2>
                <p style={{ fontSize:"clamp(12px,1.6vw,14px)", color:"#475569", lineHeight:1.85, maxWidth:360, margin:"0 0 18px" }}>
                  Equity mutual funds, held patiently, have significantly outperformed FDs after tax. The investment vehicle matters as much as the discipline.
                </p>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap" as const, marginBottom:14 }}>
                  {[{label:"Equity MF",val:"₹34.6L",note:"~14% CAGR",color:"#059669",bg:"#ECFDF5",bd:"#A7F3D0"},{label:"FD post-tax",val:"₹18.8L",note:"~5% real",color:"#94A3B8",bg:"#F8FAFC",bd:"#E2E8F0"}].map((s,i)=>(
                    <div key={i} style={{ background:s.bg, border:`1.5px solid ${s.bd}`, borderRadius:12, padding:"10px 14px" }}>
                      <div style={{ fontSize:9.5, fontWeight:600, color:"#64748B", marginBottom:2 }}>{s.label} · {s.note}</div>
                      <div style={{ fontSize:22, fontWeight:900, color:s.color }}>{s.val}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:9, padding:"7px 11px", fontSize:11, color:"#991B1B", fontWeight:600, maxWidth:300 }}>
                  ⚠️ Past performance is not a guarantee of future returns.
                </div>
              </div>
              <WealthChart/>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ━━━━━━━ 6. HOW IT WORKS ━━━━━━━ */}
      <section style={{ background:"white", borderTop:"1px solid #E2E8F0", borderBottom:"1px solid #E2E8F0", padding:"clamp(28px,5vw,52px) clamp(16px,4vw,32px)" }}>
        <div style={{ maxWidth:1120, margin:"0 auto" }}>
          <Reveal>
            <div style={{ textAlign:"center" as const, marginBottom:28 }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(124,58,237,.08)", border:"1px solid rgba(124,58,237,.20)", borderRadius:100, padding:"4px 12px", marginBottom:10 }}>
                <span style={{ fontSize:11, fontWeight:700, color:"#7C3AED", letterSpacing:".08em", textTransform:"uppercase" as const }}>How it works</span>
              </div>
              <h2 style={{ fontSize:"clamp(17px,3.5vw,26px)", fontWeight:900, color:"#0F172A", margin:0, letterSpacing:"-.02em" }}>From confusion to clarity in minutes.</h2>
            </div>
          </Reveal>
          <div className="steps-row">
            {[
              {n:"01",icon:"📤",title:"Upload CAS",body:"Import your consolidated account statement or add investments manually.",color:"#2563EB",bg:"#EFF6FF",bd:"#BFDBFE"},
              {n:"02",icon:"⚡",title:"Instant analysis",body:"True XIRR, benchmark alpha, and a portfolio health score — automatically.",color:"#059669",bg:"#ECFDF5",bd:"#A7F3D0"},
              {n:"03",icon:"🚦",title:"Clear signals",body:"Hold, Review, or Exit for every fund. No jargon — just what to do next.",color:"#7C3AED",bg:"#F5F3FF",bd:"#DDD6FE"},
              {n:"04",icon:"🚀",title:"Act with confidence",body:"Explore better funds, plan goals, track net worth — all in one calm place.",color:"#D97706",bg:"#FFFBEB",bd:"#FDE68A"},
            ].map((s,i)=>(
              <Reveal key={i} delay={i*70}>
                <div style={{ background:s.bg, border:`1.5px solid ${s.bd}`, borderRadius:16, padding:"clamp(15px,2.5vw,20px)", position:"relative", height:"100%", boxSizing:"border-box" as const }}>
                  <div style={{ position:"absolute", top:10, right:12, fontSize:10, fontWeight:900, color:s.color, opacity:.18 }}>{s.n}</div>
                  <div style={{ fontSize:"clamp(22px,3vw,26px)", marginBottom:10 }}>{s.icon}</div>
                  <div style={{ fontSize:"clamp(12px,1.8vw,13.5px)", fontWeight:800, color:s.color, marginBottom:6 }}>{s.title}</div>
                  <p style={{ fontSize:"clamp(11px,1.5vw,12px)", color:"#475569", lineHeight:1.7, margin:0 }}>{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━ 7. WHY MF GUIDE ━━━━━━━ */}
      <section style={{ maxWidth:1120, margin:"0 auto", padding:"clamp(28px,5vw,52px) clamp(16px,4vw,32px)" }}>
        <Reveal>
          <Link href="/why-mutual-fund" style={{ textDecoration:"none", display:"block" }}>
            <div className="banner-lift" style={{ background:"linear-gradient(135deg,#0F172A 0%,#1E3A8A 55%,#065F46 100%)", borderRadius:22, padding:"clamp(24px,4vw,44px)", position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:-60, right:-60, width:300, height:300, background:"radial-gradient(circle,rgba(16,185,129,.18) 0%,transparent 70%)", pointerEvents:"none" }}/>
              <div style={{ position:"relative", maxWidth:560 }}>
                <div style={{ display:"inline-flex", alignItems:"center", gap:7, background:"rgba(255,255,255,.10)", border:"1px solid rgba(255,255,255,.18)", borderRadius:100, padding:"4px 13px", marginBottom:14 }}>
                  <span style={{ fontSize:10.5, fontWeight:700, color:"#A7F3D0", letterSpacing:".08em", textTransform:"uppercase" as const }}>New to investing?</span>
                </div>
                <h2 style={{ fontSize:"clamp(16px,3.5vw,24px)", fontWeight:900, color:"white", margin:"0 0 10px", lineHeight:1.2 }}>
                  Why Mutual Funds? Read the Complete Guide →
                </h2>
                <p style={{ fontSize:"clamp(12px,1.6vw,13px)", color:"rgba(255,255,255,.60)", margin:"0 0 16px", lineHeight:1.75 }}>
                  What a mutual fund is, how NAV works, pros &amp; cons, the Iron-Clad Framework, and how to start — all in one place. Free, no sign-up.
                </p>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" as const }}>
                  {["What is a MF","How NAV works","Pros & Cons","Iron-Clad Structure","How to Start","FAQs"].map((tag,i)=>(
                    <div key={i} style={{ background:"rgba(255,255,255,.09)", border:"1px solid rgba(255,255,255,.15)", borderRadius:100, padding:"3px 10px", fontSize:10, fontWeight:600, color:"rgba(255,255,255,.80)" }}>{tag}</div>
                  ))}
                </div>
              </div>
            </div>
          </Link>
        </Reveal>
      </section>

      {/* ━━━━━━━ 8. PHILOSOPHY ━━━━━━━ */}
      <section style={{ background:"white", borderTop:"1px solid #E2E8F0", padding:"clamp(28px,5vw,52px) clamp(16px,4vw,32px)" }}>
        <div style={{ maxWidth:1120, margin:"0 auto" }}>
          <Reveal>
            <div style={{ maxWidth:540 }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(5,150,105,.08)", border:"1px solid rgba(5,150,105,.20)", borderRadius:100, padding:"4px 12px", marginBottom:12 }}>
                <span style={{ fontSize:11, fontWeight:700, color:"#059669", letterSpacing:".08em", textTransform:"uppercase" as const }}>Our philosophy</span>
              </div>
              <h2 style={{ fontSize:"clamp(1.2rem,3vw,1.7rem)", fontWeight:900, color:"#0F172A", margin:"0 0 4px", lineHeight:1.2, letterSpacing:"-.02em" }}>
                Thoughtful Money, Better Life.
              </h2>
              <blockquote style={{ fontSize:"clamp(12.5px,1.8vw,14px)", color:"#475569", fontStyle:"italic", borderLeft:"3px solid #A7F3D0", paddingLeft:14, margin:"12px 0 14px", lineHeight:1.75 }}>
                "Enough is not a number. It's the moment money stops interfering with life."
              </blockquote>
              <p style={{ fontSize:"clamp(12px,1.5vw,13px)", color:"#64748B", lineHeight:1.85, marginBottom:18 }}>
                Nivesify is a calm, non-transactional space. No ads. No product push. No spam. Just clear, honest help with your money.
              </p>
              <div style={{ display:"flex", gap:7, flexWrap:"wrap" as const }}>
                {["✅ No ads","✅ No product push","✅ No spam","✅ Just clarity"].map((t,i)=>(
                  <div key={i} style={{ background:"#ECFDF5", border:"1px solid #A7F3D0", borderRadius:100, padding:"4px 12px", fontSize:11, fontWeight:700, color:"#059669" }}>{t}</div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

    </main>
  );
}