"use client";

import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";

/* ─────────────────────────────────────────────────────────────────────────
   DESIGN SYSTEM
   Theme: Editorial Finance — dark hero, cream body, electric green accent
   Font: Fraunces (display) + DM Sans (body)
   Unforgettable moment: animated compounding counter in hero
────────────────────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,700;0,9..144,900;1,9..144,300;1,9..144,700&family=DM+Sans:wght@400;500;600;700;800&display=swap');

  :root {
    --ink:     #0B0F1A;
    --ink2:    #1C2333;
    --cream:   #FAF9F6;
    --mist:    #F1EFE9;
    --border:  #E4E0D8;
    --green:   #00C97B;
    --green2:  #00A862;
    --blue:    #2563EB;
    --amber:   #F59E0B;
    --red:     #EF4444;
    --slate:   #64748B;
    --light:   #94A3B8;
    --white:   #FFFFFF;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body { background: var(--cream); }

  /* ── HERO ── */
  .hero-inner {
    display: grid;
    grid-template-columns: 1fr;
    gap: 48px;
    align-items: center;
  }
  @media (min-width: 960px) {
    .hero-inner { grid-template-columns: 1.1fr 0.9fr; gap: 72px; }
  }
  .hero-right { display: none; }
  @media (min-width: 960px) { .hero-right { display: flex; flex-direction: column; gap: 12px; } }

  /* ── STAT STRIP ── */
  .stat-strip {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1px;
    background: var(--border);
  }
  @media (min-width: 600px) {
    .stat-strip { grid-template-columns: repeat(4, 1fr); }
  }

  /* ── TOOL CARDS ── */
  .tool-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  @media (min-width: 700px) {
    .tool-grid { grid-template-columns: repeat(4, 1fr); gap: 16px; }
  }

  /* ── STORY SECTIONS ── */
  .story-duo {
    display: grid;
    grid-template-columns: 1fr;
    gap: 36px;
    align-items: center;
  }
  @media (min-width: 760px) {
    .story-duo { grid-template-columns: 1fr 1fr; gap: 64px; }
  }
  .story-duo.flip > div:first-child { order: 2; }
  .story-duo.flip > div:last-child  { order: 1; }
  @media (max-width: 759px) {
    .story-duo.flip > div:first-child { order: 1; }
    .story-duo.flip > div:last-child  { order: 2; }
  }

  /* ── ANIMATIONS ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade-up-1 { animation: fadeUp .7s ease both .1s; }
  .fade-up-2 { animation: fadeUp .7s ease both .25s; }
  .fade-up-3 { animation: fadeUp .7s ease both .4s; }
  .fade-up-4 { animation: fadeUp .7s ease both .55s; }
  .fade-up-5 { animation: fadeUp .7s ease both .70s; }

  @keyframes pulseGreen {
    0%,100% { box-shadow: 0 0 0 0 rgba(0,201,123,.4); }
    50%      { box-shadow: 0 0 0 8px rgba(0,201,123,0); }
  }
  .live-dot { animation: pulseGreen 2s ease-in-out infinite; }

  @keyframes floatY {
    0%,100% { transform: translateY(0); }
    50%      { transform: translateY(-8px); }
  }
  .float { animation: floatY 5s ease-in-out infinite; }

  @keyframes shimmerText {
    0%   { background-position: -300% center; }
    100% { background-position:  300% center; }
  }
  .shimmer-green {
    background: linear-gradient(90deg, var(--green) 0%, #7FFFD4 40%, var(--green) 70%, #00E8A2 100%);
    background-size: 300% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmerText 5s linear infinite;
  }

  @keyframes ticker {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  .ticker-track { display: flex; animation: ticker 36s linear infinite; width: max-content; }
  .ticker-track:hover { animation-play-state: paused; }

  @keyframes countUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .count-anim { animation: countUp .4s ease both; }

  @keyframes barGrow {
    from { width: 0; }
  }

  /* ── HOVER EFFECTS ── */
  .tool-card {
    transition: transform .22s ease, box-shadow .22s ease;
    cursor: pointer;
  }
  .tool-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,.12) !important; }

  .story-card {
    transition: transform .25s ease, box-shadow .25s ease;
  }
  .story-card:hover { transform: translateY(-3px); box-shadow: 0 20px 56px rgba(0,0,0,.10) !important; }

  .cta-main {
    transition: transform .18s, box-shadow .18s, background .18s;
  }
  .cta-main:hover { transform: translateY(-2px); box-shadow: 0 12px 36px rgba(0,201,123,.45) !important; }

  .cta-outline {
    transition: transform .18s, background .18s, color .18s;
  }
  .cta-outline:hover { transform: translateY(-2px); background: rgba(255,255,255,.12) !important; }

  .guide-banner {
    transition: transform .25s ease, box-shadow .25s ease;
  }
  .guide-banner:hover { transform: translateY(-4px); box-shadow: 0 28px 72px rgba(0,0,0,.28) !important; }

  /* ── DIAGONAL DIVIDER ── */
  .diagonal {
    clip-path: polygon(0 0, 100% 4%, 100% 100%, 0 100%);
    margin-top: -3%;
    padding-top: 6%;
  }
  .diagonal-bottom {
    clip-path: polygon(0 0, 100% 0, 100% 96%, 0 100%);
    padding-bottom: 5%;
  }

  /* ── NUMBER HIGHLIGHT ── */
  .num-xl {
    font-family: 'Fraunces', Georgia, serif;
    font-weight: 900;
    letter-spacing: -.04em;
    line-height: 1;
  }

  /* ── SCROLLREVEAL ── */
  .sr { opacity: 0; transform: translateY(24px); transition: opacity .65s ease, transform .65s ease; }
  .sr.visible { opacity: 1; transform: translateY(0); }
`;

/* ── SCROLL REVEAL HOOK ─────────────────────────────────────────────────── */
function useReveal(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ob = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setTimeout(() => el.classList.add("visible"), delay);
        ob.disconnect();
      }
    }, { threshold: 0.06 });
    ob.observe(el);
    return () => ob.disconnect();
  }, [delay]);
  return ref;
}
function SR({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useReveal(delay);
  return <div ref={ref} className="sr" style={style}>{children}</div>;
}

/* ── ANIMATED COUNTER ───────────────────────────────────────────────────── */
function Counter({ target, prefix = "", suffix = "", duration = 2200 }: { target: number; prefix?: string; suffix?: string; duration?: number }) {
  const [val, setVal] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStarted(true); ob.disconnect(); } }, { threshold: 0.1 });
    if (ref.current) ob.observe(ref.current);
    return () => ob.disconnect();
  }, []);
  useEffect(() => {
    if (!started) return;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(ease * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);
  return <span ref={ref}>{prefix}{val.toLocaleString("en-IN")}{suffix}</span>;
}

/* ── DONUT CHART ────────────────────────────────────────────────────────── */
const SEGS = [
  { pct: 42, color: "#2563EB", label: "Equity MF",  val: "₹19.9L" },
  { pct: 18, color: "#00C97B", label: "Debt MF",    val: "₹8.5L"  },
  { pct: 16, color: "#F59E0B", label: "PF / EPF",   val: "₹7.6L"  },
  { pct: 14, color: "#7C3AED", label: "Gold",        val: "₹6.6L"  },
  { pct: 10, color: "#0891B2", label: "FD / Cash",  val: "₹4.7L"  },
];
function Donut({ size = 110 }: { size?: number }) {
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
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize={size * .095} fontWeight="900" fill="#0B0F1A" fontFamily="Fraunces,Georgia,serif">₹47.3L</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize={size * .082} fill="#00C97B" fontFamily="DM Sans,system-ui">↑ 18.4%</text>
    </svg>
  );
}

/* ── SPARKLINE ──────────────────────────────────────────────────────────── */
function Spark({ pts, color, w = 52, h = 22 }: { pts: number[]; color: string; w?: number; h?: number }) {
  const mn = Math.min(...pts), mx = Math.max(...pts), rng = mx - mn || 1;
  const xs = pts.map((_, i) => (i / (pts.length - 1)) * w);
  const ys = pts.map(v => h - ((v - mn) / rng) * (h - 4) - 2);
  const d = xs.map((x, i) => `${i ? "L" : "M"}${x},${ys[i]}`).join(" ");
  const uid = `g${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible", flexShrink: 0 }}>
      <defs><linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity=".25" />
        <stop offset="100%" stopColor={color} stopOpacity="0" />
      </linearGradient></defs>
      <path d={`${d} L${w},${h} L0,${h} Z`} fill={`url(#${uid})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r="3.5" fill={color} />
    </svg>
  );
}

/* ── WEALTH LINE CHART ──────────────────────────────────────────────────── */
function WealthChart() {
  const W = 300, H = 140;
  const fd = [10, 10.7, 11.5, 12.3, 13.2, 14.2, 15.2, 16.3, 17.5, 18.8];
  const mf = [10, 11.4, 13.1, 15.0, 17.3, 19.8, 22.8, 26.2, 30.1, 34.6];
  const tx = (i: number) => 10 + (i / 9) * (W - 20);
  const ty = (v: number) => H - 14 - ((v - 8) / 30) * (H - 30);
  const fdP = fd.map((v, i) => `${i ? "L" : "M"}${tx(i)},${ty(v)}`).join(" ");
  const mfP = mf.map((v, i) => `${i ? "L" : "M"}${tx(i)},${ty(v)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <linearGradient id="gmf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00C97B" stopOpacity=".22" />
          <stop offset="100%" stopColor="#00C97B" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[.28, .56, .84].map((p, i) => <line key={i} x1="10" y1={H * p} x2={W - 10} y2={H * p} stroke="#F1EFE9" strokeWidth="1" />)}
      <path d={`${fdP} L${tx(9)},${H} L${tx(0)},${H} Z`} fill="rgba(148,163,184,.08)" />
      <path d={fdP} fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="5 3" />
      <path d={`${mfP} L${tx(9)},${H} L${tx(0)},${H} Z`} fill="url(#gmf)" />
      <path d={mfP} fill="none" stroke="#00C97B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={tx(9)} cy={ty(mf[9])} r="5" fill="#00C97B" />
      <rect x={tx(9) - 58} y={ty(mf[9]) - 12} width={54} height={18} rx="5" fill="#00C97B" />
      <text x={tx(9) - 31} y={ty(mf[9]) + 3} textAnchor="middle" fontSize="9" fontWeight="800" fill="white" fontFamily="DM Sans,system-ui">₹34.6L MF</text>
      <circle cx={tx(9)} cy={ty(fd[9])} r="3.5" fill="#94A3B8" />
      <text x={tx(9) - 6} y={ty(fd[9]) + 12} textAnchor="end" fontSize="8" fill="#94A3B8" fontFamily="DM Sans,system-ui">₹18.8L FD</text>
      {["Y1", "", "Y3", "", "Y5", "", "Y7", "", "", "Y10"].map((l, i) => l &&
        <text key={i} x={tx(i)} y={H + 3} fontSize="7.5" fill="#CBD5E1" fontFamily="DM Sans,system-ui" textAnchor="middle">{l}</text>
      )}
    </svg>
  );
}

/* ── COMPOUNDING VISUALIZER (hero right panel) ──────────────────────────── */
function CompoundViz() {
  const [year, setYear] = useState(0);
  const years = [0, 2, 5, 8, 10];
  const sipVals = [0, 2.6, 8.2, 17.4, 26.2];   // MF SIP ₹10k/mo
  const fdVals  = [0, 2.4, 6.2, 10.4, 14.0];    // FD
  const totalSip = [0, 2.4, 6.0, 9.6, 12.0];    // invested

  useEffect(() => {
    const t = setInterval(() => setYear(y => (y + 1) % years.length), 2000);
    return () => clearInterval(t);
  }, []);

  const mf = sipVals[year], fd = fdVals[year], inv = totalSip[year];
  const maxBar = 30;

  return (
    <div style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 20, padding: 24, backdropFilter: "blur(8px)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.45)", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 4 }}>₹10,000/month SIP</div>
          <div style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 32, fontWeight: 900, color: "white", lineHeight: 1 }}>
            After <span style={{ color: "#00C97B" }}>{years[year]} yr{years[year] !== 1 ? "s" : ""}</span>
          </div>
        </div>
        <div style={{ background: "rgba(0,201,123,.15)", border: "1px solid rgba(0,201,123,.3)", borderRadius: 10, padding: "6px 12px", textAlign: "center" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#00C97B", textTransform: "uppercase", letterSpacing: ".08em" }}>Invested</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: "white" }}>₹{inv}L</div>
        </div>
      </div>

      {/* MF bar */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: "#00C97B" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,.80)" }}>Equity Mutual Fund</span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 900, color: "#00C97B" }}>₹{mf}L</span>
        </div>
        <div style={{ height: 10, background: "rgba(255,255,255,.08)", borderRadius: 100, overflow: "hidden" }}>
          <div key={year + "mf"} style={{ height: "100%", width: `${(mf / maxBar) * 100}%`, background: "linear-gradient(90deg,#00C97B,#00E8A2)", borderRadius: 100, animation: "barGrow .8s ease" }} />
        </div>
      </div>

      {/* FD bar */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: "#64748B" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,.50)" }}>Fixed Deposit</span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 900, color: "#64748B" }}>₹{fd}L</span>
        </div>
        <div style={{ height: 10, background: "rgba(255,255,255,.08)", borderRadius: 100, overflow: "hidden" }}>
          <div key={year + "fd"} style={{ height: "100%", width: `${(fd / maxBar) * 100}%`, background: "rgba(100,116,139,.5)", borderRadius: 100, animation: "barGrow .8s ease" }} />
        </div>
      </div>

      {year > 0 && (
        <div style={{ background: "rgba(0,201,123,.12)", border: "1px solid rgba(0,201,123,.25)", borderRadius: 10, padding: "9px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.70)" }}>MF advantage</span>
          <span style={{ fontSize: 15, fontWeight: 900, color: "#00C97B" }}>+₹{(mf - fd).toFixed(1)}L more 🚀</span>
        </div>
      )}
      {year === 0 && (
        <div style={{ textAlign: "center", padding: "9px 0" }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,.40)", fontStyle: "italic" }}>Watch the gap open up...</span>
        </div>
      )}
    </div>
  );
}

/* ── FUND SIGNALS CARD ──────────────────────────────────────────────────── */
const FUNDS = [
  { name: "Parag Parikh Flexi Cap", xirr: 18.7, bench: 14.1, alpha: "+4.6%", tag: "HOLD",   tc: "#00A862", tb: "#ECFDF5", tbd: "#A7F3D0", pts: [35,40,46,50,55,60,65,70,74,80], color: "#00C97B" },
  { name: "Mirae Large Cap",        xirr: 16.2, bench: 14.1, alpha: "+2.1%", tag: "HOLD",   tc: "#00A862", tb: "#ECFDF5", tbd: "#A7F3D0", pts: [38,42,44,48,52,55,58,61,65,68], color: "#2563EB" },
  { name: "HDFC Mid Cap Opp.",      xirr: 11.3, bench: 14.1, alpha: "-2.8%", tag: "REVIEW", tc: "#B45309", tb: "#FFFBEB", tbd: "#FDE68A", pts: [50,48,46,44,47,43,45,44,44,42], color: "#F59E0B" },
  { name: "SBI Small Cap",          xirr:  9.1, bench: 14.1, alpha: "-5.0%", tag: "EXIT",   tc: "#B91C1C", tb: "#FEF2F2", tbd: "#FECACA", pts: [55,52,48,44,40,38,35,33,31,28], color: "#EF4444" },
];

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function Home() {
  const [fundsVis, setFundsVis] = useState(false);
  const fundsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setFundsVis(true); ob.disconnect(); } }, { threshold: .08 });
    if (fundsRef.current) ob.observe(fundsRef.current);
    return () => ob.disconnect();
  }, []);

  const TOOLS = [
    { href: "/dashboard",                          icon: "📊", label: "Money Dashboard",  sub: "Net worth · all assets",    color: "#2563EB", bg: "#EFF6FF", bd: "#BFDBFE", top: "linear-gradient(90deg,#2563EB,#7C3AED)" },
    { href: "/mutual-fund-health-check/dashboard", icon: "🏥", label: "Fund Health Check", sub: "XIRR · signals · alpha",   color: "#00A862", bg: "#ECFDF5", bd: "#A7F3D0", top: "linear-gradient(90deg,#00C97B,#0891B2)" },
    { href: "/mutual-fund-match",                  icon: "🗺️", label: "MF World",          sub: "Explore & compare funds",  color: "#7C3AED", bg: "#F5F3FF", bd: "#DDD6FE", top: "linear-gradient(90deg,#7C3AED,#2563EB)" },
    { href: "/dashboard/calculators",              icon: "🧮", label: "Life Calculators",  sub: "FIRE · goals · retirement",color: "#B45309", bg: "#FFFBEB", bd: "#FDE68A", top: "linear-gradient(90deg,#F59E0B,#EF4444)" },
  ];

  const TICKER = ["📊 Net Worth Tracker","🏥 True XIRR","⚡ Fund Health Check","🔥 FIRE Calculator","🗺️ MF Universe","🎯 Goal Planner","🔬 Fund Comparison","📈 SIP Tracker","🏖️ Retirement Planner","💡 Alpha Screener","📉 Benchmark vs Your Returns"];

  return (
    <main style={{ background: "var(--cream)", minHeight: "100vh", fontFamily: "'DM Sans', system-ui, sans-serif", color: "var(--ink)" }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ══════════════════════════════════════════════════════════════════
          HERO — dark, editorial, with animated compounding visualizer
          Target emotion: "wait, this is free? I need this."
      ══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: "var(--ink)", position: "relative", overflow: "hidden", padding: "clamp(48px,8vw,100px) clamp(16px,4vw,48px) clamp(56px,9vw,112px)" }}>

        {/* Atmospheric glow blobs */}
        <div style={{ position: "absolute", top: -160, left: -120, width: 700, height: 700, background: "radial-gradient(circle, rgba(0,201,123,.13) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -200, right: -150, width: 800, height: 800, background: "radial-gradient(circle, rgba(37,99,235,.10) 0%, transparent 60%)", pointerEvents: "none" }} />
        {/* Subtle grid texture */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
          <div className="hero-inner">

            {/* LEFT COPY */}
            <div>
              {/* Live badge */}
              <div className="fade-up-1" style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "rgba(0,201,123,.12)", border: "1px solid rgba(0,201,123,.28)", borderRadius: 100, padding: "6px 16px", marginBottom: 28 }}>
                <span className="live-dot" style={{ width: 8, height: 8, background: "#00C97B", borderRadius: "50%", flexShrink: 0, display: "block" }} />
                <span style={{ fontSize: 11.5, fontWeight: 700, color: "#00C97B", letterSpacing: ".09em", textTransform: "uppercase" as const }}>Free · Built for Indian Investors</span>
              </div>

              {/* BIG HEADLINE */}
              <div className="fade-up-2">
                <h1 style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: "clamp(2.4rem,6.5vw,4.6rem)", fontWeight: 900, color: "white", lineHeight: 1.04, letterSpacing: "-.04em", margin: "0 0 6px" }}>
                  Your money,
                  <br />finally making
                  <br /><span className="shimmer-green">sense.</span>
                </h1>
              </div>

              {/* SUBHEAD */}
              <div className="fade-up-3">
                <p style={{ fontSize: "clamp(15px,2vw,18px)", color: "rgba(255,255,255,.62)", lineHeight: 1.75, maxWidth: 480, margin: "20px 0 30px", fontWeight: 400 }}>
                  Track every rupee you own. Know if your mutual funds are truly working. Plan your FIRE date, your home, your child's education — with real data, not a spreadsheet guess.
                </p>
              </div>

              {/* CTAs */}
              <div className="fade-up-4" style={{ display: "flex", gap: 12, flexWrap: "wrap" as const, marginBottom: 40 }}>
                <Link href="/mutual-fund-health-check/dashboard" style={{ textDecoration: "none" }}>
                  <button className="cta-main" style={{ background: "#00C97B", color: "#0B0F1A", border: "none", borderRadius: 14, padding: "14px 26px", fontSize: 15, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 6px 24px rgba(0,201,123,.35)", minHeight: 50, letterSpacing: "-.01em" }}>
                    Check My Funds — Free 🏥
                  </button>
                </Link>
                <Link href="/dashboard" style={{ textDecoration: "none" }}>
                  <button className="cta-outline" style={{ background: "rgba(255,255,255,.07)", color: "rgba(255,255,255,.85)", border: "1.5px solid rgba(255,255,255,.18)", borderRadius: 14, padding: "14px 24px", fontSize: 15, fontWeight: 600, cursor: "pointer", minHeight: 50, letterSpacing: "-.01em" }}>
                    See My Net Worth →
                  </button>
                </Link>
              </div>

              {/* Social proof / trust row */}
              <div className="fade-up-5" style={{ display: "flex", gap: 24, flexWrap: "wrap" as const, paddingTop: 28, borderTop: "1px solid rgba(255,255,255,.09)" }}>
                {[
                  { num: "25+", label: "Free tools" },
                  { num: "0", label: "Ads. Ever." },
                  { num: "100%", label: "India-specific" },
                ].map((s, i) => (
                  <div key={i}>
                    <div style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: "clamp(1.4rem,2.5vw,2rem)", fontWeight: 900, color: "white", lineHeight: 1 }}>{s.num}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,.40)", fontWeight: 600, marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: Animated Compounding Visualizer */}
            <div className="hero-right">
              <div className="float">
                <CompoundViz />
              </div>
              {/* Mini tagline below the card */}
              <div style={{ textAlign: "center" as const, padding: "8px 0" }}>
                <span style={{ fontSize: 11.5, color: "rgba(255,255,255,.35)", fontStyle: "italic" }}>
                  Simulating ₹10,000/mo SIP · past returns, illustrative only
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── TICKER STRIP ── */}
      <div style={{ overflow: "hidden", background: "var(--ink2)", borderBottom: "1px solid rgba(255,255,255,.06)", padding: "11px 0" }}>
        <div className="ticker-track">
          {[...TICKER, ...TICKER].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 24px", whiteSpace: "nowrap" as const, borderRight: "1px solid rgba(255,255,255,.07)", height: 26 }}>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: "rgba(255,255,255,.45)" }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          STAT STRIP — 4 numbers that hit hard
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{ background: "var(--cream)", borderBottom: "1px solid var(--border)" }}>
        <div className="stat-strip" style={{ maxWidth: 1200, margin: "0 auto" }}>
          {[
            { label: "Average XIRR found in bad funds", val: "9.1", suffix: "%", note: "vs 14%+ benchmark", color: "#EF4444" },
            { label: "Extra wealth from right vehicle", val: "15.8", suffix: "L", note: "over 10 yrs on ₹10k/mo", color: "#00C97B" },
            { label: "Investors with no fund clarity", val: "73", suffix: "%", note: "hold underperforming funds", color: "#F59E0B" },
            { label: "Time to see your full picture", val: "3", suffix: " min", note: "upload CAS → full analysis", color: "#2563EB" },
          ].map((s, i) => (
            <div key={i} style={{ background: "white", padding: "clamp(18px,3vw,28px) clamp(14px,2.5vw,24px)" }}>
              <div style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: "clamp(1.8rem,4vw,3rem)", fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: 6 }}>
                <Counter target={parseFloat(s.val)} suffix={s.suffix} duration={1800} />
              </div>
              <div style={{ fontSize: "clamp(11px,1.4vw,13px)", fontWeight: 700, color: "var(--ink)", marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontSize: "clamp(10px,1.2vw,11px)", color: "var(--light)" }}>{s.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          4 TOOL CARDS — compact, scannable
      ══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: "var(--mist)", borderBottom: "1px solid var(--border)", padding: "clamp(24px,4vw,36px) clamp(16px,4vw,48px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <SR delay={0}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--light)", letterSpacing: ".10em", textTransform: "uppercase" as const, textAlign: "center" as const, marginBottom: 16 }}>
              Everything you need · nothing you don't
            </p>
          </SR>
          <div className="tool-grid">
            {TOOLS.map((t, i) => (
              <SR key={i} delay={i * 60}>
                <Link href={t.href} style={{ textDecoration: "none", display: "block" }}>
                  <div className="tool-card" style={{ background: "white", border: `1.5px solid ${t.bd}`, borderRadius: 18, padding: "clamp(14px,2vw,20px) clamp(12px,1.8vw,18px)", position: "relative", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,.05)" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: t.top, borderRadius: "18px 18px 0 0" }} />
                    <div style={{ fontSize: "clamp(22px,2.8vw,28px)", marginBottom: 10, marginTop: 4 }}>{t.icon}</div>
                    <div style={{ fontSize: "clamp(12px,1.7vw,13.5px)", fontWeight: 800, color: "var(--ink)", lineHeight: 1.2, marginBottom: 4 }}>{t.label}</div>
                    <div style={{ fontSize: "clamp(10px,1.3vw,11px)", color: "var(--slate)", lineHeight: 1.45, marginBottom: 12 }}>{t.sub}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: t.color }}>Open →</div>
                  </div>
                </Link>
              </SR>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          STORY 1 — "Do you know your real net worth?"
          BIG number left, donut card right
      ══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: "white", padding: "clamp(48px,7vw,96px) clamp(16px,4vw,48px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <SR>
            <div className="story-duo">
              {/* Copy */}
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 100, padding: "4px 13px", marginBottom: 16 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#1D4ED8", letterSpacing: ".08em", textTransform: "uppercase" as const }}>Start with clarity</span>
                </div>

                {/* Editorial big question */}
                <h2 style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: "clamp(1.6rem,4vw,3rem)", fontWeight: 700, fontStyle: "italic", color: "var(--ink)", lineHeight: 1.12, letterSpacing: "-.03em", margin: "0 0 20px" }}>
                  Where exactly<br />is all your money?
                </h2>

                <p style={{ fontSize: "clamp(14px,1.7vw,16px)", color: "var(--slate)", lineHeight: 1.85, maxWidth: 440, margin: "0 0 14px" }}>
                  You have a few SIPs. Some PF that auto-deducts. An FD your dad opened. Maybe some gold ETFs. Separately, each feels small. Together?
                </p>
                <p style={{ fontSize: "clamp(14px,1.7vw,16px)", color: "var(--ink)", fontWeight: 700, lineHeight: 1.75, maxWidth: 440, margin: "0 0 32px" }}>
                  The Money Dashboard adds it all up — every rupee, every account, one real number. Finally.
                </p>

                {/* Mini feature list */}
                {["All investments in one view","Annual growth tracked","Allocation breakdown with donut chart"].map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#ECFDF5", border: "1.5px solid #A7F3D0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 10, color: "#00A862" }}>✓</span>
                    </div>
                    <span style={{ fontSize: "clamp(12px,1.5vw,13.5px)", color: "var(--slate)", fontWeight: 500 }}>{f}</span>
                  </div>
                ))}

                <Link href="/dashboard" style={{ textDecoration: "none", display: "inline-block", marginTop: 24 }}>
                  <div className="cta-outline" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--ink)", color: "white", borderRadius: 13, padding: "12px 22px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", transition: "transform .18s, box-shadow .18s" }}>
                    📊 Open Money Dashboard
                  </div>
                </Link>
              </div>

              {/* Net worth card */}
              <div>
                <div className="story-card" style={{ background: "white", borderRadius: 24, border: "1.5px solid var(--border)", overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,.08)" }}>
                  {/* Card header */}
                  <div style={{ height: 5, background: "linear-gradient(90deg,#2563EB,#7C3AED,#00C97B)" }} />
                  <div style={{ padding: "20px 22px 16px", background: "linear-gradient(135deg,#EFF6FF,#F5F3FF)" }}>
                    <div style={{ fontSize: 10.5, color: "var(--light)", fontWeight: 600, marginBottom: 5, textTransform: "uppercase" as const, letterSpacing: ".08em" }}>Total Net Worth</div>
                    <div style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: "clamp(2rem,4vw,2.8rem)", fontWeight: 900, color: "var(--ink)", lineHeight: 1 }}>₹47.3L</div>
                    <div style={{ fontSize: 12, color: "#00A862", fontWeight: 700, marginTop: 6 }}>↑ +18.4% · ₹7.3L gain this year</div>
                  </div>
                  <div style={{ padding: "18px 22px 20px" }}>
                    <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
                      <Donut size={100} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {SEGS.map((s, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
                            <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 10.5, color: "#374151", fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{s.label}</span>
                            <span style={{ fontSize: 10.5, fontWeight: 800, color: s.color }}>{s.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "var(--ink)" }}>Portfolio Health Score</span>
                      <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 100, padding: "3px 12px" }}>
                        <span style={{ fontSize: 13, fontWeight: 900, color: "#00A862" }}>84 / 100</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SR>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          STORY 2 — "Are your funds actually earning?" — dark bg, flipped
      ══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: "var(--ink)", padding: "clamp(48px,7vw,96px) clamp(16px,4vw,48px)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -100, right: -80, width: 500, height: 500, background: "radial-gradient(circle,rgba(0,201,123,.09) 0%,transparent 65%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
          <SR>
            <div className="story-duo flip">
              {/* Fund signals card */}
              <div ref={fundsRef}>
                <div className="story-card" style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.10)", borderRadius: 24, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,.3)" }}>
                  <div style={{ height: 4, background: "linear-gradient(90deg,#00C97B,#0891B2)" }} />
                  <div style={{ padding: "16px 20px 10px", borderBottom: "1px solid rgba(255,255,255,.07)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 50px 40px 52px", gap: 8, paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,.07)" }}>
                      {["Fund", "Trend", "XIRR", "Signal"].map((h, i) => (
                        <div key={i} style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,.3)", textTransform: "uppercase" as const, letterSpacing: ".07em" }}>{h}</div>
                      ))}
                    </div>
                    {FUNDS.map((fu, i) => (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 50px 40px 52px", gap: 8, alignItems: "center", padding: "10px 0", borderBottom: i < FUNDS.length - 1 ? "1px solid rgba(255,255,255,.05)" : "none", opacity: fundsVis ? 1 : 0, transform: fundsVis ? "translateX(0)" : "translateX(-12px)", transition: `opacity .5s ease ${i * 100}ms, transform .5s ease ${i * 100}ms` }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.85)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{fu.name}</div>
                          <div style={{ fontSize: 9.5, fontWeight: 600, color: fu.xirr >= fu.bench ? "#00C97B" : "#EF4444" }}>XIRR {fu.xirr}% · {fu.alpha} vs bench</div>
                        </div>
                        <Spark pts={fu.pts} color={fu.color} w={46} h={20} />
                        <div style={{ fontSize: 11, fontWeight: 800, color: fu.xirr >= fu.bench ? "#00C97B" : "#EF4444" }}>{fu.xirr}%</div>
                        <div style={{ fontSize: 9, fontWeight: 800, padding: "3px 6px", borderRadius: 100, background: fu.tb, border: `1px solid ${fu.tbd}`, color: fu.tc, textAlign: "center" as const, whiteSpace: "nowrap" as const }}>{fu.tag}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", gap: 7, flexWrap: "wrap" as const, alignItems: "center" }}>
                      {[["HOLD", "#00A862", "rgba(0,201,123,.12)", "rgba(0,201,123,.3)"], ["REVIEW", "#D97706", "rgba(245,158,11,.12)", "rgba(245,158,11,.3)"], ["EXIT", "#DC2626", "rgba(239,68,68,.12)", "rgba(239,68,68,.3)"]].map(([l, c, bg, bd], i) => (
                        <div key={i} style={{ background: bg, border: `1px solid ${bd}`, borderRadius: 100, padding: "3px 10px", fontSize: 9.5, fontWeight: 800, color: c as string }}>{l}</div>
                      ))}
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,.30)", fontWeight: 600 }}>— clear verdict for every fund</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Copy */}
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(0,201,123,.12)", border: "1px solid rgba(0,201,123,.28)", borderRadius: 100, padding: "4px 13px", marginBottom: 16 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#00C97B", letterSpacing: ".08em", textTransform: "uppercase" as const }}>The hard truth</span>
                </div>
                <h2 style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: "clamp(1.6rem,4vw,3rem)", fontWeight: 700, fontStyle: "italic", color: "white", lineHeight: 1.12, letterSpacing: "-.03em", margin: "0 0 20px" }}>
                  Your fund says<br />18%. Yours says?
                </h2>
                <p style={{ fontSize: "clamp(14px,1.7vw,16px)", color: "rgba(255,255,255,.58)", lineHeight: 1.85, maxWidth: 440, margin: "0 0 14px" }}>
                  A fund's published returns aren't yours. Your actual XIRR depends on exactly when you invested, how much, and at what NAV — and it's often shockingly different.
                </p>
                <p style={{ fontSize: "clamp(14px,1.7vw,16px)", color: "rgba(255,255,255,.85)", fontWeight: 700, lineHeight: 1.75, maxWidth: 440, margin: "0 0 32px" }}>
                  Fund Health Check calculates your real XIRR, compares it to the benchmark, and tells you clearly: Hold, Review, or Exit. No jargon.
                </p>
                <Link href="/mutual-fund-health-check/dashboard" style={{ textDecoration: "none" }}>
                  <button className="cta-main" style={{ background: "#00C97B", color: "var(--ink)", border: "none", borderRadius: 13, padding: "13px 22px", fontSize: 14, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 6px 24px rgba(0,201,123,.35)" }}>
                    🏥 Check My Portfolio — Upload CAS
                  </button>
                </Link>
                {/* Crisp 3-step process — inline, no separate section needed */}
                <div style={{ marginTop: 20, display: "flex", flexDirection: "column" as const, gap: 8 }}>
                  {[
                    ["📤", "Upload CAS from CAMS / KFintech"],
                    ["⚡", "Get true XIRR, alpha & health score instantly"],
                    ["🚦", "Hold, Review or Exit — clear signal per fund"],
                  ].map(([ic, tx], i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <span style={{ fontSize: 14, flexShrink: 0 }}>{ic}</span>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,.50)", fontWeight: 600 }}>{tx}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SR>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          STORY 3 — The wealth gap. Cream bg, chart, no fluff.
      ══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: "white", padding: "clamp(48px,7vw,96px) clamp(16px,4vw,48px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <SR>
            <div style={{ textAlign: "center" as const, marginBottom: 52 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 100, padding: "4px 13px", marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#92400E", letterSpacing: ".08em", textTransform: "uppercase" as const }}>The real cost of staying in FDs</span>
              </div>
              <h2 style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: "clamp(1.6rem,4vw,2.8rem)", fontWeight: 900, color: "var(--ink)", lineHeight: 1.12, letterSpacing: "-.03em" }}>
                ₹10 lakhs. 10 years.<br />
                <span style={{ color: "#00A862" }}>One choice changed everything.</span>
              </h2>
            </div>
          </SR>

          <SR delay={100}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 32, maxWidth: 900, margin: "0 auto" }}>
              {/* Big visual comparison */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[
                  { label: "Equity Mutual Fund", val: "₹34.6L", sub: "~14% CAGR · after tax", color: "#00A862", bg: "linear-gradient(135deg,#ECFDF5,#D1FAE5)", bd: "#A7F3D0", grow: true },
                  { label: "Fixed Deposit",       val: "₹18.8L", sub: "~5% real return · after tax", color: "#94A3B8", bg: "linear-gradient(135deg,#F8FAFC,#F1F5F9)", bd: "#E2E8F0", grow: false },
                ].map((s, i) => (
                  <div key={i} style={{ background: s.bg, border: `2px solid ${s.bd}`, borderRadius: 20, padding: "clamp(18px,3vw,28px)", textAlign: "center" as const }}>
                    <div style={{ fontSize: "clamp(10px,1.3vw,11.5px)", fontWeight: 700, color: s.grow ? "#00A862" : "#94A3B8", textTransform: "uppercase" as const, letterSpacing: ".09em", marginBottom: 10 }}>{s.label}</div>
                    <div className="num-xl" style={{ fontSize: "clamp(1.8rem,4vw,3rem)", color: s.color, marginBottom: 6 }}>{s.val}</div>
                    <div style={{ fontSize: "clamp(10px,1.3vw,11.5px)", color: "var(--slate)" }}>{s.sub}</div>
                    {s.grow && <div style={{ marginTop: 12, background: "#00A862", borderRadius: 100, padding: "4px 14px", display: "inline-block", fontSize: 11, fontWeight: 800, color: "white" }}>+₹15.8L more 🚀</div>}
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div style={{ background: "var(--mist)", borderRadius: 20, padding: "clamp(18px,3vw,28px)", border: "1px solid var(--border)" }}>
                <WealthChart />
              </div>

              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "10px 16px", fontSize: 11.5, color: "#991B1B", fontWeight: 600, textAlign: "center" as const }}>
                ⚠️ Past performance is illustrative only and does not guarantee future returns. Mutual fund investments are subject to market risk.
              </div>
            </div>
          </SR>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          WHY MF GUIDE — dark editorial banner
      ══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: "white", padding: "clamp(40px,6vw,72px) clamp(16px,4vw,48px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <SR>
            <Link href="/why-mutual-fund" style={{ textDecoration: "none", display: "block" }}>
              <div className="guide-banner" style={{ background: "linear-gradient(125deg,#0B0F1A 0%,#0F2052 50%,#053322 100%)", borderRadius: 28, padding: "clamp(28px,5vw,52px) clamp(24px,4vw,52px)", position: "relative", overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,.14)" }}>
                <div style={{ position: "absolute", top: -80, right: -80, width: 400, height: 400, background: "radial-gradient(circle,rgba(0,201,123,.15) 0%,transparent 70%)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: -60, left: -40, width: 300, height: 300, background: "radial-gradient(circle,rgba(37,99,235,.12) 0%,transparent 70%)", pointerEvents: "none" }} />

                <div style={{ position: "relative", display: "flex", flexDirection: "column" as const, gap: 14, maxWidth: 640 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,201,123,.12)", border: "1px solid rgba(0,201,123,.28)", borderRadius: 100, padding: "5px 14px", width: "fit-content" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#00C97B", letterSpacing: ".09em", textTransform: "uppercase" as const }}>📖 New to investing?</span>
                  </div>
                  <h2 style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: "clamp(1.4rem,3.5vw,2.4rem)", fontWeight: 900, color: "white", lineHeight: 1.15, letterSpacing: "-.03em", margin: 0 }}>
                    The Complete Guide to Mutual Funds →
                  </h2>
                  <p style={{ fontSize: "clamp(12.5px,1.6vw,14px)", color: "rgba(255,255,255,.55)", lineHeight: 1.78, margin: 0 }}>
                    What is a mutual fund? How does NAV work? What's SIP vs lumpsum? What are the real costs? We cover all of it — in plain Hindi-friendly English. Free, forever.
                  </p>
                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap" as const, paddingTop: 4 }}>
                    {["What is a MF", "How NAV works", "Pros & Cons", "Iron-Clad Framework", "3 Pillars", "How to Start", "FAQs"].map((tag, i) => (
                      <div key={i} style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.13)", borderRadius: 100, padding: "4px 11px", fontSize: 10.5, fontWeight: 600, color: "rgba(255,255,255,.72)" }}>{tag}</div>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          </SR>
        </div>
      </section>

    </main>
  );
}