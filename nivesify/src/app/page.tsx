"use client";

import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";

/* ─────────────────────────────────────────────────────────────────────────
   DESIGN SYSTEM — Editorial Finance
   Dark hero (#0B0F1A), cream body (#FAF9F6), electric green (#00C97B)
   Fraunces (display) + DM Sans (body)
────────────────────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,700;0,9..144,900;1,9..144,300;1,9..144,700&family=DM+Sans:wght@400;500;600;700;800&display=swap');

  :root {
    --ink:    #0B0F1A;
    --ink2:   #1C2333;
    --cream:  #FAF9F6;
    --mist:   #F1EFE9;
    --border: #E4E0D8;
    --green:  #00C97B;
    --green2: #00A862;
    --blue:   #2563EB;
    --amber:  #F59E0B;
    --red:    #EF4444;
    --slate:  #64748B;
    --light:  #94A3B8;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--cream); }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0%   { background-position: -300% center; }
    100% { background-position:  300% center; }
  }
  @keyframes pulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(0,201,123,.4); }
    50%      { box-shadow: 0 0 0 7px rgba(0,201,123,0); }
  }
  @keyframes ticker {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  @keyframes barGrow { from { width: 0; } }
  @keyframes floatY {
    0%,100% { transform: translateY(0); }
    50%      { transform: translateY(-6px); }
  }

  .f1 { animation: fadeUp .6s ease both .05s; }
  .f2 { animation: fadeUp .6s ease both .18s; }
  .f3 { animation: fadeUp .6s ease both .30s; }
  .f4 { animation: fadeUp .6s ease both .42s; }
  .f5 { animation: fadeUp .6s ease both .54s; }

  .shimmer-green {
    background: linear-gradient(90deg,#00C97B,#7FFFD4 40%,#00C97B 70%,#00E8A2);
    background-size: 300% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer 5s linear infinite;
  }
  .live-dot { animation: pulse 2s ease-in-out infinite; }
  .float    { animation: floatY 5s ease-in-out infinite; }

  .ticker-track { display:flex; animation: ticker 38s linear infinite; width: max-content; }
  .ticker-track:hover { animation-play-state: paused; }

  .sr { opacity:0; transform:translateY(20px); transition: opacity .6s ease, transform .6s ease; }
  .sr.in { opacity:1; transform:translateY(0); }

  .card-hover { transition: transform .22s ease, box-shadow .22s ease; }
  .card-hover:hover { transform: translateY(-4px); box-shadow: 0 20px 48px rgba(0,0,0,.12) !important; }

  .btn-green { transition: transform .16s, box-shadow .16s; }
  .btn-green:hover { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(0,201,123,.45) !important; }

  .btn-ghost { transition: transform .16s, background .16s; }
  .btn-ghost:hover { transform: translateY(-2px); background: rgba(255,255,255,.13) !important; }

  .path-card { transition: transform .2s, border-color .2s; cursor: pointer; }
  .path-card:hover { transform: translateY(-4px); }

  .grid-3 { display:grid; grid-template-columns:1fr; gap:12px; }
  @media(min-width:640px){ .grid-3 { grid-template-columns:repeat(3,1fr); } }

  .grid-4 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  @media(min-width:720px){ .grid-4 { grid-template-columns:repeat(4,1fr); } }

  .grid-2 { display:grid; grid-template-columns:1fr; gap:16px; }
  @media(min-width:600px){ .grid-2 { grid-template-columns:1fr 1fr; } }

  .duo { display:grid; grid-template-columns:1fr; gap:40px; align-items:center; }
  @media(min-width:780px){ .duo { grid-template-columns:1fr 1fr; gap:64px; } }
  .duo.flip > :first-child { order:2; }
  .duo.flip > :last-child  { order:1; }
  @media(max-width:779px){
    .duo.flip > :first-child { order:1; }
    .duo.flip > :last-child  { order:2; }
  }

  .hero-cols { display:grid; grid-template-columns:1fr; gap:48px; align-items:center; }
  @media(min-width:960px){ .hero-cols { grid-template-columns:1.1fr 0.9fr; gap:64px; } }
  .hero-right-col { display:none; }
  @media(min-width:960px){ .hero-right-col { display:block; } }

  .stats-grid { display:grid; grid-template-columns:1fr 1fr; gap:1px; background:var(--border); }
  @media(min-width:600px){ .stats-grid { grid-template-columns:repeat(4,1fr); } }

  .combined-duo { display:grid; grid-template-columns:1fr; gap:24px; }
  @media(min-width:860px){ .combined-duo { grid-template-columns:1fr 1fr; gap:24px; } }
`;

/* ── HELPERS ────────────────────────────────────────────────────────────── */
function useReveal(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ob = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setTimeout(() => el.classList.add("in"), delay); ob.disconnect(); }
    }, { threshold: 0.07 });
    ob.observe(el);
    return () => ob.disconnect();
  }, [delay]);
  return ref;
}
function SR({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  return <div ref={useReveal(delay)} className="sr" style={style}>{children}</div>;
}

function Counter({ to, suffix = "", duration = 1800 }: { to: number; suffix?: string; duration?: number }) {
  const [v, setV] = useState(0);
  const [go, setGo] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setGo(true); ob.disconnect(); } }, { threshold: 0.1 });
    if (ref.current) ob.observe(ref.current);
    return () => ob.disconnect();
  }, []);
  useEffect(() => {
    if (!go) return;
    let s: number | null = null;
    const tick = (ts: number) => {
      if (!s) s = ts;
      const p = Math.min((ts - s) / duration, 1);
      setV(Math.floor((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [go, to, duration]);
  return <span ref={ref}>{v.toLocaleString("en-IN")}{suffix}</span>;
}

/* ── DONUT ──────────────────────────────────────────────────────────────── */
const SEGS = [
  { pct: 42, color: "#2563EB", label: "Equity MF", val: "₹19.9L" },
  { pct: 18, color: "#00C97B", label: "Debt MF",   val: "₹8.5L"  },
  { pct: 16, color: "#F59E0B", label: "PF / EPF",  val: "₹7.6L"  },
  { pct: 14, color: "#7C3AED", label: "Gold",       val: "₹6.6L"  },
  { pct: 10, color: "#0891B2", label: "FD / Cash", val: "₹4.7L"  },
];
function Donut({ size = 108 }: { size?: number }) {
  const r = size * 0.36, cx = size / 2, cy = size / 2, C = 2 * Math.PI * r;
  let cum = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      {SEGS.map((s, i) => {
        const dash = (s.pct / 100) * C, off = C - (cum / 100) * C; cum += s.pct;
        return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color}
          strokeWidth={size * 0.14} strokeDasharray={`${dash} ${C - dash}`}
          strokeDashoffset={off} style={{ transformOrigin: `${cx}px ${cy}px`, transform: "rotate(-90deg)" }} />;
      })}
      <circle cx={cx} cy={cy} r={r * 0.52} fill="white" />
      <text x={cx} y={cy - 5} textAnchor="middle" fontSize={size * .092} fontWeight="900" fill="#0B0F1A" fontFamily="Fraunces,Georgia,serif">₹47.3L</text>
      <text x={cx} y={cy + 9} textAnchor="middle" fontSize={size * .078} fill="#00C97B" fontFamily="DM Sans,system-ui">↑18.4%</text>
    </svg>
  );
}

/* ── SPARKLINE ──────────────────────────────────────────────────────────── */
function Spark({ pts, color, w = 50, h = 20 }: { pts: number[]; color: string; w?: number; h?: number }) {
  const mn = Math.min(...pts), rng = Math.max(...pts) - mn || 1;
  const xs = pts.map((_, i) => (i / (pts.length - 1)) * w);
  const ys = pts.map(v => h - ((v - mn) / rng) * (h - 4) - 2);
  const d = xs.map((x, i) => `${i ? "L" : "M"}${x},${ys[i]}`).join(" ");
  const id = `sp${color.replace(/\W/g, "")}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible", flexShrink: 0 }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L${w},${h} L0,${h}Z`} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r="3" fill={color} />
    </svg>
  );
}

/* ── SIP VISUALIZER ─────────────────────────────────────────────────────── */
function SIPViz() {
  const [idx, setIdx] = useState(0);
  const steps = [
    { yr: 0,  mf: 0,    fd: 0,    inv: 0    },
    { yr: 2,  mf: 2.6,  fd: 2.4,  inv: 2.4  },
    { yr: 5,  mf: 8.2,  fd: 6.2,  inv: 6.0  },
    { yr: 8,  mf: 17.4, fd: 10.4, inv: 9.6  },
    { yr: 10, mf: 26.2, fd: 14.0, inv: 12.0 },
  ];
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % steps.length), 2200);
    return () => clearInterval(t);
  }, []);
  const s = steps[idx];
  return (
    <div style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 20, padding: "22px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.4)", letterSpacing: ".10em", textTransform: "uppercase" as const, marginBottom: 5 }}>₹10,000 / month SIP</div>
          <div style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: 28, fontWeight: 900, color: "white", lineHeight: 1 }}>
            After <span style={{ color: "#00C97B" }}>{s.yr} yr{s.yr !== 1 ? "s" : ""}</span>
          </div>
        </div>
        <div style={{ background: "rgba(0,201,123,.14)", border: "1px solid rgba(0,201,123,.28)", borderRadius: 10, padding: "5px 12px", textAlign: "center" as const }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#00C97B", textTransform: "uppercase" as const, letterSpacing: ".08em" }}>Invested</div>
          <div style={{ fontSize: 15, fontWeight: 900, color: "white" }}>₹{s.inv}L</div>
        </div>
      </div>
      {[
        { label: "Equity Mutual Fund", val: s.mf, color: "#00C97B", barBg: "linear-gradient(90deg,#00C97B,#00E8A2)", textOpacity: ".82" },
        { label: "Fixed Deposit",       val: s.fd, color: "#64748B", barBg: "rgba(100,116,139,.45)",                 textOpacity: ".40" },
      ].map((row, i) => (
        <div key={i} style={{ marginBottom: i === 0 ? 14 : 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ width: 7, height: 7, borderRadius: 2, background: row.color }} />
              <span style={{ fontSize: 11.5, fontWeight: 600, color: `rgba(255,255,255,${row.textOpacity})` }}>{row.label}</span>
            </div>
            <span style={{ fontSize: 13.5, fontWeight: 900, color: row.color }}>₹{row.val}L</span>
          </div>
          <div style={{ height: 9, background: "rgba(255,255,255,.07)", borderRadius: 100, overflow: "hidden" }}>
            <div key={`${idx}-${i}`} style={{ height: "100%", width: `${(row.val / 32) * 100}%`, background: row.barBg, borderRadius: 100, animation: "barGrow .85s ease" }} />
          </div>
        </div>
      ))}
      <div style={{ background: s.yr > 0 ? "rgba(0,201,123,.11)" : "transparent", border: s.yr > 0 ? "1px solid rgba(0,201,123,.22)" : "1px solid transparent", borderRadius: 10, padding: "9px 13px", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all .3s" }}>
        {s.yr > 0
          ? <><span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.60)" }}>MF advantage</span><span style={{ fontSize: 14, fontWeight: 900, color: "#00C97B" }}>+₹{(s.mf - s.fd).toFixed(1)}L more 🚀</span></>
          : <span style={{ fontSize: 11, color: "rgba(255,255,255,.30)", fontStyle: "italic", width: "100%", textAlign: "center" as const }}>Watch the gap widen...</span>
        }
      </div>
    </div>
  );
}

/* ── FUND TABLE ─────────────────────────────────────────────────────────── */
const FUNDS = [
  { name: "Parag Parikh Flexi Cap", xirr: 18.7, bench: 14.1, alpha: "+4.6%", tag: "HOLD",   tc: "#00A862", tb: "#ECFDF5", tbd: "#A7F3D0", pts: [35,40,46,50,55,60,65,70,74,80], c: "#00C97B" },
  { name: "Mirae Large Cap",        xirr: 16.2, bench: 14.1, alpha: "+2.1%", tag: "HOLD",   tc: "#00A862", tb: "#ECFDF5", tbd: "#A7F3D0", pts: [38,42,44,48,52,55,58,61,65,68], c: "#2563EB" },
  { name: "HDFC Mid Cap Opp.",      xirr: 11.3, bench: 14.1, alpha: "-2.8%", tag: "REVIEW", tc: "#B45309", tb: "#FFFBEB", tbd: "#FDE68A", pts: [50,48,46,44,47,43,45,44,44,42], c: "#F59E0B" },
  { name: "SBI Small Cap",          xirr:  9.1, bench: 14.1, alpha: "-5.0%", tag: "EXIT",   tc: "#B91C1C", tb: "#FEF2F2", tbd: "#FECACA", pts: [55,52,48,44,40,38,35,33,31,28], c: "#EF4444" },
];

/* ── WEALTH CHART ───────────────────────────────────────────────────────── */
function WealthChart() {
  const W = 320, H = 150;
  const fd = [10,10.7,11.5,12.3,13.2,14.2,15.2,16.3,17.5,18.8];
  const mf = [10,11.4,13.1,15.0,17.3,19.8,22.8,26.2,30.1,34.6];
  const tx = (i: number) => 12 + (i / 9) * (W - 24);
  const ty = (v: number) => H - 16 - ((v - 8) / 30) * (H - 32);
  const fdP = fd.map((v,i) => `${i?"L":"M"}${tx(i)},${ty(v)}`).join(" ");
  const mfP = mf.map((v,i) => `${i?"L":"M"}${tx(i)},${ty(v)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height:"auto", display:"block" }}>
      <defs>
        <linearGradient id="gmf2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00C97B" stopOpacity=".2" />
          <stop offset="100%" stopColor="#00C97B" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[.28,.56,.84].map((p,i) => <line key={i} x1="12" y1={H*p} x2={W-12} y2={H*p} stroke="#F1EFE9" strokeWidth="1" />)}
      <path d={`${fdP} L${tx(9)},${H} L${tx(0)},${H}Z`} fill="rgba(148,163,184,.07)" />
      <path d={fdP} fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="5 3" />
      <path d={`${mfP} L${tx(9)},${H} L${tx(0)},${H}Z`} fill="url(#gmf2)" />
      <path d={mfP} fill="none" stroke="#00C97B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={tx(9)} cy={ty(mf[9])} r="5" fill="#00C97B" />
      <rect x={tx(9)-60} y={ty(mf[9])-13} width={56} height={18} rx="5" fill="#00C97B" />
      <text x={tx(9)-32} y={ty(mf[9])+3} textAnchor="middle" fontSize="9" fontWeight="800" fill="white" fontFamily="DM Sans,system-ui">₹34.6L MF</text>
      <circle cx={tx(9)} cy={ty(fd[9])} r="3.5" fill="#94A3B8" />
      <text x={tx(9)-7} y={ty(fd[9])+13} textAnchor="end" fontSize="8" fill="#94A3B8" fontFamily="DM Sans,system-ui">₹18.8L FD</text>
      {["Y1","","Y3","","Y5","","Y7","","","Y10"].map((l,i) => l && <text key={i} x={tx(i)} y={H+2} fontSize="7.5" fill="#CBD5E1" fontFamily="DM Sans,system-ui" textAnchor="middle">{l}</text>)}
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════════════════ */
export default function Home() {
  const [fundsVisible, setFundsVisible] = useState(false);
  const fundsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setFundsVisible(true); ob.disconnect(); } }, { threshold: .08 });
    if (fundsRef.current) ob.observe(fundsRef.current);
    return () => ob.disconnect();
  }, []);

  const TICKER_ITEMS = ["📊 Net Worth Tracker","🏥 True XIRR","⚡ Fund Health Check","🔥 FIRE Calculator","🗺️ MF Universe","🎯 Goal Planner","🔬 Fund Comparison","📈 SIP Tracker","🏖️ Retirement Planner","💡 Alpha Screener","📉 Benchmark vs Your Returns"];

  return (
    <main style={{ background: "var(--cream)", minHeight: "100vh", fontFamily: "'DM Sans',system-ui,sans-serif", color: "var(--ink)" }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ════════════════════════════════════════════════════════════════
          SECTION 1 — HERO
          What is Nivesify, for whom, one primary action.
      ════════════════════════════════════════════════════════════════ */}
      <section style={{ background: "var(--ink)", position: "relative", overflow: "hidden", padding: "clamp(52px,9vw,108px) clamp(16px,4vw,48px) clamp(60px,10vw,120px)" }}>
        <div style={{ position:"absolute", top:-180, left:-100, width:700, height:700, background:"radial-gradient(circle,rgba(0,201,123,.12) 0%,transparent 65%)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-180, right:-120, width:800, height:800, background:"radial-gradient(circle,rgba(37,99,235,.09) 0%,transparent 60%)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px)", backgroundSize:"48px 48px", pointerEvents:"none" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
          <div className="hero-cols">

            <div>
              {/* Badge */}
              <div className="f1" style={{ display:"inline-flex", alignItems:"center", gap:9, background:"rgba(0,201,123,.11)", border:"1px solid rgba(0,201,123,.26)", borderRadius:100, padding:"5px 15px", marginBottom:26 }}>
                <span className="live-dot" style={{ width:7, height:7, background:"#00C97B", borderRadius:"50%", flexShrink:0, display:"block" }} />
                <span style={{ fontSize:11, fontWeight:700, color:"#00C97B", letterSpacing:".09em", textTransform:"uppercase" as const }}>Free · For Indian investors · No ads, ever</span>
              </div>

              {/* Headline */}
              <h1 className="f2" style={{ fontFamily:"Fraunces,Georgia,serif", fontSize:"clamp(2.5rem,6.5vw,4.8rem)", fontWeight:900, color:"white", lineHeight:1.03, letterSpacing:"-.04em", marginBottom:20 }}>
                Your money,<br />finally making<br /><span className="shimmer-green">sense.</span>
              </h1>

              {/* Sub */}
              <p className="f3" style={{ fontSize:"clamp(15px,1.9vw,17px)", color:"rgba(255,255,255,.56)", lineHeight:1.82, maxWidth:460, marginBottom:32 }}>
                A free toolkit for salaried Indians with SIPs, FDs & PF — to track every rupee, audit your funds, and plan your goals. No jargon. No ads. No commission.
              </p>

              {/* Primary CTA */}
              <div className="f4" style={{ marginBottom:36 }}>
                <Link href="/mutual-fund-health-check/dashboard" style={{ textDecoration:"none" }}>
                  <button className="btn-green" style={{ background:"#00C97B", color:"#0B0F1A", border:"none", borderRadius:14, padding:"15px 30px", fontSize:15.5, fontWeight:800, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:9, boxShadow:"0 6px 24px rgba(0,201,123,.35)", letterSpacing:"-.01em" }}>
                    🏥 Check My Portfolio — Free
                  </button>
                </Link>
                <span style={{ display:"inline-block", marginLeft:14, fontSize:13, color:"rgba(255,255,255,.32)", fontWeight:500 }}>
                  or{" "}<Link href="/dashboard" style={{ color:"rgba(255,255,255,.52)", fontWeight:600, textDecoration:"none" }}>See My Net Worth →</Link>
                </span>
              </div>

              {/* Trust */}
              <div className="f5" style={{ display:"flex", gap:28, flexWrap:"wrap" as const, paddingTop:24, borderTop:"1px solid rgba(255,255,255,.08)" }}>
                {[["25+","Free tools"],["0","Ads ever"],["100%","India-specific"]].map(([n,l],i) => (
                  <div key={i}>
                    <div style={{ fontFamily:"Fraunces,Georgia,serif", fontSize:"clamp(1.5rem,2.5vw,2.1rem)", fontWeight:900, color:"white", lineHeight:1 }}>{n}</div>
                    <div style={{ fontSize:11.5, color:"rgba(255,255,255,.36)", fontWeight:600, marginTop:4 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — SIP viz */}
            <div className="hero-right-col">
              <div className="float"><SIPViz /></div>
              <p style={{ textAlign:"center" as const, fontSize:11, color:"rgba(255,255,255,.26)", fontStyle:"italic", marginTop:10 }}>₹10k/mo SIP simulation · illustrative only</p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 2 — WHO IS THIS FOR?
          Immediate self-identification. 3 user types, each routes
          directly to the most relevant starting point.
      ════════════════════════════════════════════════════════════════ */}
      <section style={{ background:"var(--ink2)", borderBottom:"1px solid rgba(255,255,255,.06)", padding:"clamp(28px,4vw,44px) clamp(16px,4vw,48px)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <SR>
            <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,.30)", letterSpacing:".10em", textTransform:"uppercase" as const, textAlign:"center" as const, marginBottom:18 }}>
              Pick what describes you — we'll show you where to start.
            </p>
          </SR>
          <SR delay={60}>
            <div className="grid-3">
              {[
                { icon:"🌱", label:"I'm new to investing", desc:"Learn how mutual funds work, why they beat FDs long-term, and how to start your first SIP the right way.", cta:"Start with the basics", href:"/why-mutual-fund",                  color:"#00A862", bg:"rgba(0,201,123,.08)",   border:"rgba(0,201,123,.22)"   },
                { icon:"📊", label:"I already have SIPs",  desc:"Find out your real XIRR, compare against benchmarks, and get a clear signal on which funds to keep or exit.", cta:"Analyse my portfolio",  href:"/mutual-fund-health-check/dashboard", color:"#3B82F6", bg:"rgba(59,130,246,.08)", border:"rgba(59,130,246,.22)"  },
                { icon:"🔥", label:"I'm planning my future",desc:"Calculate your retirement corpus, child's education fund, home purchase — or your financial independence date.", cta:"Plan my future",          href:"/dashboard/calculators",              color:"#F59E0B", bg:"rgba(245,158,11,.08)", border:"rgba(245,158,11,.22)"  },
              ].map((p,i) => (
                <Link key={i} href={p.href} style={{ textDecoration:"none" }}>
                  <div className="path-card" style={{ background:p.bg, border:`1.5px solid ${p.border}`, borderRadius:18, padding:"22px 20px", height:"100%", display:"flex", flexDirection:"column" as const }}>
                    <div style={{ fontSize:28, marginBottom:12 }}>{p.icon}</div>
                    <div style={{ fontSize:14.5, fontWeight:800, color:"white", marginBottom:8, lineHeight:1.3 }}>{p.label}</div>
                    <div style={{ fontSize:12.5, color:"rgba(255,255,255,.46)", lineHeight:1.72, marginBottom:18, flex:1 }}>{p.desc}</div>
                    <div style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:12, fontWeight:700, color:p.color }}>{p.cta} →</div>
                  </div>
                </Link>
              ))}
            </div>
          </SR>
        </div>
      </section>

      {/* Ticker */}
      <div style={{ overflow:"hidden", background:"var(--ink2)", borderBottom:"1px solid rgba(255,255,255,.05)", padding:"10px 0" }}>
        <div className="ticker-track">
          {[...TICKER_ITEMS,...TICKER_ITEMS].map((item,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", padding:"0 22px", whiteSpace:"nowrap" as const, borderRight:"1px solid rgba(255,255,255,.05)", height:24 }}>
              <span style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,.36)" }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 3 — THE 4-STEP JOURNEY
          Show users the logical flow through the product.
          Numbered so the sequence is unmistakable.
      ════════════════════════════════════════════════════════════════ */}
      <section style={{ background:"var(--cream)", padding:"clamp(44px,6vw,72px) clamp(16px,4vw,48px)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <SR style={{ marginBottom:30 }}>
            <p style={{ fontSize:11, fontWeight:700, color:"var(--light)", letterSpacing:".10em", textTransform:"uppercase" as const, marginBottom:8 }}>The Nivesify journey</p>
            <h2 style={{ fontFamily:"Fraunces,Georgia,serif", fontSize:"clamp(1.5rem,3vw,2.2rem)", fontWeight:900, color:"var(--ink)", letterSpacing:"-.03em", lineHeight:1.1 }}>
              Four steps to total financial clarity.
            </h2>
          </SR>
          <div className="grid-4">
            {[
              { n:"01", icon:"📊", title:"See your full picture",   body:"Add all your assets — MF, PF, FD, stocks, gold. One real net worth number.",        cta:"Open Dashboard →",   href:"/dashboard",                          color:"#2563EB", bg:"#EFF6FF", bd:"#BFDBFE", top:"linear-gradient(90deg,#2563EB,#7C3AED)" },
              { n:"02", icon:"🏥", title:"Audit your funds",        body:"Upload your CAS. Get true XIRR, benchmark comparison, and a Hold/Review/Exit signal.", cta:"Health Check →",      href:"/mutual-fund-health-check/dashboard", color:"#00A862", bg:"#ECFDF5", bd:"#A7F3D0", top:"linear-gradient(90deg,#00C97B,#0891B2)" },
              { n:"03", icon:"🗺️", title:"Explore better funds",    body:"Browse 500+ active and index funds. Screened by alpha, category, and expense ratio.",  cta:"Explore MF World →",  href:"/mutual-fund-match",                  color:"#7C3AED", bg:"#F5F3FF", bd:"#DDD6FE", top:"linear-gradient(90deg,#7C3AED,#2563EB)" },
              { n:"04", icon:"🔥", title:"Plan your future goals",  body:"FIRE, retirement, home, education — run real projections with real numbers.",          cta:"Open Calculators →",  href:"/dashboard/calculators",              color:"#B45309", bg:"#FFFBEB", bd:"#FDE68A", top:"linear-gradient(90deg,#F59E0B,#EF4444)" },
            ].map((s,i) => (
              <SR key={i} delay={i * 70}>
                <Link href={s.href} style={{ textDecoration:"none", display:"block", height:"100%" }}>
                  <div className="card-hover" style={{ background:"white", border:`1.5px solid ${s.bd}`, borderRadius:20, overflow:"hidden", height:"100%", display:"flex", flexDirection:"column" as const, boxShadow:"0 2px 12px rgba(0,0,0,.05)" }}>
                    <div style={{ height:3, background:s.top }} />
                    <div style={{ padding:"18px 18px 20px", flex:1, display:"flex", flexDirection:"column" as const }}>
                      <div style={{ display:"inline-flex", alignItems:"center", gap:5, background:s.bg, border:`1px solid ${s.bd}`, borderRadius:100, padding:"2px 9px", marginBottom:12, alignSelf:"flex-start" as const }}>
                        <span style={{ fontSize:9.5, fontWeight:800, color:s.color, letterSpacing:".07em", textTransform:"uppercase" as const }}>Step {s.n}</span>
                      </div>
                      <div style={{ fontSize:22, marginBottom:9 }}>{s.icon}</div>
                      <div style={{ fontSize:13.5, fontWeight:800, color:"var(--ink)", lineHeight:1.25, marginBottom:7, flex:1 }}>{s.title}</div>
                      <div style={{ fontSize:11.5, color:"var(--slate)", lineHeight:1.65, marginBottom:14 }}>{s.body}</div>
                      <div style={{ fontSize:12, fontWeight:700, color:s.color }}>{s.cta}</div>
                    </div>
                  </div>
                </Link>
              </SR>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 4 — FUND HEALTH CHECK (flagship feature)
          Dark background. Animated fund table. The killer feature.
      ════════════════════════════════════════════════════════════════ */}
      <section style={{ background:"var(--ink)", padding:"clamp(52px,8vw,96px) clamp(16px,4vw,48px)", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-80, right:-80, width:520, height:520, background:"radial-gradient(circle,rgba(0,201,123,.08) 0%,transparent 65%)", pointerEvents:"none" }} />
        <div style={{ maxWidth:1200, margin:"0 auto", position:"relative" }}>
          <SR>
            <div className="duo flip">

              {/* Fund table mock */}
              <div ref={fundsRef}>
                <div className="card-hover" style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.09)", borderRadius:22, overflow:"hidden", boxShadow:"0 8px 40px rgba(0,0,0,.28)" }}>
                  <div style={{ height:3, background:"linear-gradient(90deg,#00C97B,#0891B2)" }} />
                  <div style={{ padding:"16px 20px" }}>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 48px 40px 54px", gap:8, paddingBottom:10, borderBottom:"1px solid rgba(255,255,255,.07)", marginBottom:4 }}>
                      {["Fund","Trend","XIRR","Signal"].map((h,i) => (
                        <div key={i} style={{ fontSize:9, fontWeight:700, color:"rgba(255,255,255,.28)", textTransform:"uppercase" as const, letterSpacing:".07em" }}>{h}</div>
                      ))}
                    </div>
                    {FUNDS.map((f,i) => (
                      <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 48px 40px 54px", gap:8, alignItems:"center", padding:"10px 0", borderBottom: i < FUNDS.length-1 ? "1px solid rgba(255,255,255,.05)" : "none", opacity: fundsVisible?1:0, transform: fundsVisible?"translateX(0)":"translateX(-10px)", transition:`opacity .45s ease ${i*90}ms, transform .45s ease ${i*90}ms` }}>
                        <div>
                          <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,.84)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>{f.name}</div>
                          <div style={{ fontSize:9.5, fontWeight:600, color: f.xirr>=f.bench?"#00C97B":"#EF4444", marginTop:2 }}>XIRR {f.xirr}% · {f.alpha} vs bench</div>
                        </div>
                        <Spark pts={f.pts} color={f.c} w={44} h={18} />
                        <div style={{ fontSize:11, fontWeight:800, color: f.xirr>=f.bench?"#00C97B":"#EF4444" }}>{f.xirr}%</div>
                        <div style={{ fontSize:9, fontWeight:800, padding:"3px 6px", borderRadius:100, background:f.tb, border:`1px solid ${f.tbd}`, color:f.tc, textAlign:"center" as const }}>{f.tag}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding:"12px 20px 16px", borderTop:"1px solid rgba(255,255,255,.06)", display:"flex", gap:7, flexWrap:"wrap" as const, alignItems:"center" }}>
                    {[["HOLD","#00A862","rgba(0,201,123,.11)","rgba(0,201,123,.28)"],["REVIEW","#D97706","rgba(245,158,11,.11)","rgba(245,158,11,.28)"],["EXIT","#DC2626","rgba(239,68,68,.11)","rgba(239,68,68,.28)"]].map(([l,c,bg,bd],i) => (
                      <div key={i} style={{ background:bg, border:`1px solid ${bd}`, borderRadius:100, padding:"3px 9px", fontSize:9.5, fontWeight:800, color:c as string }}>{l}</div>
                    ))}
                    <span style={{ fontSize:10, color:"rgba(255,255,255,.26)", fontWeight:600 }}>— clear verdict per fund</span>
                  </div>
                </div>
              </div>

              {/* Copy */}
              <div>
                <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(0,201,123,.11)", border:"1px solid rgba(0,201,123,.26)", borderRadius:100, padding:"4px 13px", marginBottom:16 }}>
                  <span style={{ fontSize:10.5, fontWeight:700, color:"#00C97B", letterSpacing:".08em", textTransform:"uppercase" as const }}>Fund Health Check</span>
                </div>
                <h2 style={{ fontFamily:"Fraunces,Georgia,serif", fontSize:"clamp(1.7rem,4vw,3rem)", fontWeight:700, fontStyle:"italic", color:"white", lineHeight:1.1, letterSpacing:"-.03em", margin:"0 0 18px" }}>
                  Your fund says 18%.<br />Does yours?
                </h2>
                <p style={{ fontSize:"clamp(14px,1.6vw,15.5px)", color:"rgba(255,255,255,.52)", lineHeight:1.85, maxWidth:440, margin:"0 0 12px" }}>
                  A fund's published returns are not yours. Your real XIRR depends on when you invested, how much, and at what NAV — and it's often very different.
                </p>
                <p style={{ fontSize:"clamp(14px,1.6vw,15.5px)", color:"rgba(255,255,255,.82)", fontWeight:700, lineHeight:1.75, maxWidth:440, margin:"0 0 28px" }}>
                  Upload your CAS from CAMS or KFintech. Get your true XIRR, a benchmark comparison, and a clear Hold / Review / Exit signal for every fund. In 3 minutes.
                </p>
                <div style={{ display:"flex", flexDirection:"column" as const, gap:9, marginBottom:28 }}>
                  {[["📤","Upload CAS from CAMS / KFintech — free"],["⚡","Get true XIRR & alpha vs benchmark instantly"],["🚦","Hold, Review or Exit — clear signal per fund"]].map(([ic,tx],i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontSize:14, flexShrink:0 }}>{ic}</span>
                      <span style={{ fontSize:12.5, color:"rgba(255,255,255,.48)", fontWeight:600 }}>{tx}</span>
                    </div>
                  ))}
                </div>
                <Link href="/mutual-fund-health-check/dashboard" style={{ textDecoration:"none" }}>
                  <button className="btn-green" style={{ background:"#00C97B", color:"var(--ink)", border:"none", borderRadius:13, padding:"13px 24px", fontSize:14, fontWeight:800, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:8, boxShadow:"0 6px 24px rgba(0,201,123,.32)" }}>
                    🏥 Check My Portfolio — Upload CAS
                  </button>
                </Link>
              </div>
            </div>
          </SR>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 5 — MONEY DASHBOARD
          Light section. The net worth / all-assets view.
      ════════════════════════════════════════════════════════════════ */}
      <section style={{ background:"white", padding:"clamp(52px,8vw,96px) clamp(16px,4vw,48px)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <SR>
            <div className="duo">
              <div>
                <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:100, padding:"4px 13px", marginBottom:16 }}>
                  <span style={{ fontSize:10.5, fontWeight:700, color:"#1D4ED8", letterSpacing:".08em", textTransform:"uppercase" as const }}>Money Dashboard</span>
                </div>
                <h2 style={{ fontFamily:"Fraunces,Georgia,serif", fontSize:"clamp(1.7rem,4vw,3rem)", fontWeight:700, fontStyle:"italic", color:"var(--ink)", lineHeight:1.1, letterSpacing:"-.03em", margin:"0 0 18px" }}>
                  Where exactly<br />is all your money?
                </h2>
                <p style={{ fontSize:"clamp(14px,1.6vw,15.5px)", color:"var(--slate)", lineHeight:1.85, maxWidth:440, margin:"0 0 12px" }}>
                  SIPs. PF that auto-deducts. An FD your dad suggested. Maybe gold ETFs. Separately, each feels small. Together, it's your real financial picture.
                </p>
                <p style={{ fontSize:"clamp(14px,1.6vw,15.5px)", color:"var(--ink)", fontWeight:700, lineHeight:1.75, maxWidth:440, margin:"0 0 24px" }}>
                  The Money Dashboard adds it all up — every rupee, every account, one real net worth number.
                </p>
                {["All asset classes in one view","Annual growth & allocation tracked","Portfolio health score at a glance"].map((f,i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:9 }}>
                    <div style={{ width:19, height:19, borderRadius:"50%", background:"#ECFDF5", border:"1.5px solid #A7F3D0", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <span style={{ fontSize:9.5, color:"#00A862" }}>✓</span>
                    </div>
                    <span style={{ fontSize:13, color:"var(--slate)", fontWeight:500 }}>{f}</span>
                  </div>
                ))}
                <Link href="/dashboard" style={{ textDecoration:"none", display:"inline-block", marginTop:24 }}>
                  <button style={{ background:"var(--ink)", color:"white", border:"none", borderRadius:13, padding:"12px 22px", fontSize:13.5, fontWeight:700, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:8, transition:"transform .16s", boxShadow:"0 4px 16px rgba(0,0,0,.18)" }}>
                    📊 Open Money Dashboard
                  </button>
                </Link>
              </div>

              {/* Net worth mock */}
              <div>
                <div className="card-hover" style={{ background:"white", borderRadius:24, border:"1.5px solid var(--border)", overflow:"hidden", boxShadow:"0 8px 40px rgba(0,0,0,.08)" }}>
                  <div style={{ height:4, background:"linear-gradient(90deg,#2563EB,#7C3AED,#00C97B)" }} />
                  <div style={{ padding:"20px 22px 15px", background:"linear-gradient(135deg,#EFF6FF,#F5F3FF)" }}>
                    <div style={{ fontSize:10, color:"var(--light)", fontWeight:600, marginBottom:4, textTransform:"uppercase" as const, letterSpacing:".08em" }}>Total Net Worth</div>
                    <div style={{ fontFamily:"Fraunces,Georgia,serif", fontSize:"clamp(2rem,4vw,2.8rem)", fontWeight:900, color:"var(--ink)", lineHeight:1 }}>₹47.3L</div>
                    <div style={{ fontSize:12, color:"#00A862", fontWeight:700, marginTop:5 }}>↑ +18.4% · ₹7.3L gain this year</div>
                  </div>
                  <div style={{ padding:"16px 22px 20px" }}>
                    <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:14 }}>
                      <Donut size={98} />
                      <div style={{ flex:1, minWidth:0 }}>
                        {SEGS.map((s,i) => (
                          <div key={i} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                            <div style={{ width:7, height:7, borderRadius:2, background:s.color, flexShrink:0 }} />
                            <span style={{ fontSize:10.5, color:"#374151", fontWeight:600, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>{s.label}</span>
                            <span style={{ fontSize:10.5, fontWeight:800, color:s.color }}>{s.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ borderTop:"1px solid var(--border)", paddingTop:11, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontSize:12, fontWeight:800, color:"var(--ink)" }}>Portfolio Health Score</span>
                      <div style={{ background:"#ECFDF5", border:"1px solid #A7F3D0", borderRadius:100, padding:"3px 11px" }}>
                        <span style={{ fontSize:12.5, fontWeight:900, color:"#00A862" }}>84 / 100</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SR>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 6 — STATS + FD vs MF (combined, compact)
          4 stats left · wealth gap chart right. One tight section.
      ════════════════════════════════════════════════════════════════ */}
      <section style={{ background:"var(--ink)", padding:"clamp(36px,5vw,56px) clamp(16px,4vw,48px)", borderTop:"1px solid rgba(255,255,255,.06)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <SR>
            <div className="combined-duo" style={{ alignItems:"start" }}>
              {/* @media handled inline — on desktop: two columns */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1px", background:"rgba(255,255,255,.07)", borderRadius:16, overflow:"hidden", alignSelf:"start" as const }}>
                {[
                  { val:"9.1",  suf:"%",    label:"Avg XIRR in bad funds",        note:"vs 14%+ benchmark",        color:"#EF4444" },
                  { val:"15.8", suf:"L",    label:"Extra wealth, right vehicle",   note:"10 yrs · ₹10k/mo SIP",     color:"#00C97B" },
                  { val:"73",   suf:"%",    label:"Investors with no fund clarity", note:"SIPs on autopilot",        color:"#F59E0B" },
                  { val:"3",    suf:" min", label:"To see your full picture",       note:"upload CAS → done",        color:"#2563EB" },
                ].map((s,i) => (
                  <div key={i} style={{ background:"rgba(255,255,255,.04)", padding:"clamp(16px,2.5vw,24px) clamp(14px,2vw,20px)" }}>
                    <div style={{ fontFamily:"Fraunces,Georgia,serif", fontSize:"clamp(1.7rem,3.5vw,2.6rem)", fontWeight:900, color:s.color, lineHeight:1, marginBottom:5 }}>
                      <Counter to={parseFloat(s.val)} suffix={s.suf} />
                    </div>
                    <div style={{ fontSize:"clamp(11px,1.3vw,12.5px)", fontWeight:700, color:"rgba(255,255,255,.75)", marginBottom:2 }}>{s.label}</div>
                    <div style={{ fontSize:"clamp(9.5px,1.1vw,11px)", color:"rgba(255,255,255,.32)" }}>{s.note}</div>
                  </div>
                ))}
              </div>

              {/* FD vs MF — compact horizontal card */}
              <div style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.09)", borderRadius:16, padding:"clamp(18px,2.5vw,26px)", alignSelf:"start" as const }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14, flexWrap:"wrap" as const, gap:8 }}>
                  <div>
                    <div style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,.32)", letterSpacing:".09em", textTransform:"uppercase" as const, marginBottom:4 }}>Cost of staying in FDs</div>
                    <div style={{ fontFamily:"Fraunces,Georgia,serif", fontSize:"clamp(1.1rem,2.2vw,1.5rem)", fontWeight:900, color:"white", lineHeight:1.15 }}>
                      ₹10L · 10 years · <span style={{ color:"#00C97B" }}>one choice.</span>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:10, flexShrink:0 }}>
                    <div style={{ textAlign:"center" as const }}>
                      <div style={{ fontFamily:"Fraunces,Georgia,serif", fontSize:"clamp(1.2rem,2vw,1.6rem)", fontWeight:900, color:"#00C97B" }}>₹34.6L</div>
                      <div style={{ fontSize:9.5, fontWeight:700, color:"rgba(255,255,255,.40)", marginTop:2 }}>Equity MF</div>
                    </div>
                    <div style={{ width:1, background:"rgba(255,255,255,.10)", alignSelf:"stretch" as const }} />
                    <div style={{ textAlign:"center" as const }}>
                      <div style={{ fontFamily:"Fraunces,Georgia,serif", fontSize:"clamp(1.2rem,2vw,1.6rem)", fontWeight:900, color:"rgba(255,255,255,.40)" }}>₹18.8L</div>
                      <div style={{ fontSize:9.5, fontWeight:700, color:"rgba(255,255,255,.28)", marginTop:2 }}>FD</div>
                    </div>
                    <div style={{ background:"rgba(0,201,123,.15)", border:"1px solid rgba(0,201,123,.28)", borderRadius:8, padding:"4px 10px", display:"flex", alignItems:"center" }}>
                      <span style={{ fontSize:11, fontWeight:800, color:"#00C97B", whiteSpace:"nowrap" as const }}>+₹15.8L 🚀</span>
                    </div>
                  </div>
                </div>
                <WealthChart />
                <div style={{ marginTop:10, fontSize:10, color:"rgba(255,255,255,.22)", fontWeight:500, textAlign:"center" as const }}>
                  ⚠️ Past performance is illustrative only. Mutual fund investments are subject to market risk.
                </div>
              </div>
            </div>
          </SR>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 8 — MF WORLD: LEARN & EXPLORE
          Educational + fund exploration entry points.
      ════════════════════════════════════════════════════════════════ */}
      <section style={{ background:"var(--mist)", borderTop:"1px solid var(--border)", padding:"clamp(52px,7vw,88px) clamp(16px,4vw,48px)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <SR style={{ marginBottom:30 }}>
            <p style={{ fontSize:11, fontWeight:700, color:"var(--light)", letterSpacing:".10em", textTransform:"uppercase" as const, marginBottom:8 }}>Mutual Fund World</p>
            <h2 style={{ fontFamily:"Fraunces,Georgia,serif", fontSize:"clamp(1.5rem,3vw,2.2rem)", fontWeight:900, color:"var(--ink)", letterSpacing:"-.03em", lineHeight:1.1 }}>
              Learn. Explore. Decide.
            </h2>
          </SR>
          <div style={{ display:"grid", gap:16 }}>
            {/* Learn banner */}
            <SR delay={40}>
              <Link href="/why-mutual-fund" style={{ textDecoration:"none", display:"block" }}>
                <div className="card-hover" style={{ background:"linear-gradient(120deg,#0B0F1A 0%,#0F2052 55%,#053322 100%)", borderRadius:22, padding:"clamp(26px,4vw,44px) clamp(22px,4vw,44px)", position:"relative", overflow:"hidden", boxShadow:"0 6px 28px rgba(0,0,0,.14)" }}>
                  <div style={{ position:"absolute", top:-60, right:-60, width:360, height:360, background:"radial-gradient(circle,rgba(0,201,123,.13) 0%,transparent 68%)", pointerEvents:"none" }} />
                  <div style={{ position:"relative", maxWidth:580 }}>
                    <div style={{ display:"inline-flex", alignItems:"center", gap:7, background:"rgba(0,201,123,.12)", border:"1px solid rgba(0,201,123,.25)", borderRadius:100, padding:"4px 13px", marginBottom:14 }}>
                      <span style={{ fontSize:10.5, fontWeight:700, color:"#00C97B", letterSpacing:".08em", textTransform:"uppercase" as const }}>📖 New to investing?</span>
                    </div>
                    <h3 style={{ fontFamily:"Fraunces,Georgia,serif", fontSize:"clamp(1.3rem,3vw,2.1rem)", fontWeight:900, color:"white", lineHeight:1.15, letterSpacing:"-.03em", margin:"0 0 10px" }}>
                      The Complete Guide to Mutual Funds →
                    </h3>
                    <p style={{ fontSize:"clamp(12px,1.5vw,13.5px)", color:"rgba(255,255,255,.48)", lineHeight:1.75, margin:"0 0 16px" }}>
                      What is a mutual fund? How does NAV work? SIP vs lumpsum? Real costs? All covered in plain English. Free, forever.
                    </p>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" as const }}>
                      {["What is a MF","How NAV works","Pros & Cons","3 Pillars","How to Start","FAQs"].map((t,i) => (
                        <div key={i} style={{ background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.11)", borderRadius:100, padding:"3px 10px", fontSize:10.5, fontWeight:600, color:"rgba(255,255,255,.64)" }}>{t}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            </SR>

            {/* Explore cards */}
            <div className="grid-2">
              {[
                { href:"/active-funds",  icon:"⚡", label:"Active Funds Explorer", desc:"Screened by alpha, consistency & composite score. Funds that genuinely beat their benchmark.", color:"#00A862", bg:"linear-gradient(135deg,#ECFDF5,#D1FAE5)", bd:"#A7F3D0" },
                { href:"/index-funds",   icon:"📈", label:"Index Funds Explorer",  desc:"Compare trackers by benchmark fit, tracking difference, expense ratio, and liquidity.",        color:"#2563EB", bg:"linear-gradient(135deg,#EFF6FF,#DBEAFE)", bd:"#BFDBFE" },
              ].map((c,i) => (
                <SR key={i} delay={i*80}>
                  <Link href={c.href} style={{ textDecoration:"none", display:"block", height:"100%" }}>
                    <div className="card-hover" style={{ background:c.bg, border:`1.5px solid ${c.bd}`, borderRadius:18, padding:"clamp(18px,2.5vw,26px)", height:"100%", display:"flex", flexDirection:"column" as const }}>
                      <div style={{ fontSize:24, marginBottom:10 }}>{c.icon}</div>
                      <div style={{ fontSize:14, fontWeight:800, color:"var(--ink)", marginBottom:7, lineHeight:1.25 }}>{c.label}</div>
                      <div style={{ fontSize:12, color:"var(--slate)", lineHeight:1.65, flex:1, marginBottom:14 }}>{c.desc}</div>
                      <div style={{ fontSize:12, fontWeight:700, color:c.color }}>Explore →</div>
                    </div>
                  </Link>
                </SR>
              ))}
            </div>
          </div>
        </div>
      </section>


    </main>
  );
}
