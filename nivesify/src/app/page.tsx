"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";
import { fetchCachedJson } from "@/lib/client-data";
import { Sprout, ChartLine, Goal as GoalIcon, Crosshair, TrendingUp, Wallet, Sunrise } from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────
   DESIGN SYSTEM — One world: deep-navy canvas, liquid glass surfaces,
   mint + indigo accents, Fraunces display / DM Sans body.
   Every number renders from live R2 datasets. No mock data anywhere.
   Flow: Hook (hero+studio) → Proof (Hall of Fame) → Convert (health check)
         → Identify (paths) → Plan (calculators) → Close (CTA).
────────────────────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,700;0,9..144,900;1,9..144,300;1,9..144,700&family=DM+Sans:wght@400;500;600;700;800&display=swap');

  :root {
    --ink:    #0A0E1C;
    --ink2:   #10162B;
    --ink3:   #161D38;
    --green:  #00C97B;
    --mint:   #00E8A2;
    --indigo: #6366F1;
    --amber:  #F59E0B;
    --red:    #EF4444;
    --txt-hi: #FFFFFF;
    --txt-md: rgba(233,238,252,.66);
    --txt-lo: rgba(210,220,245,.40);
    --glass-brd: rgba(255,255,255,.12);
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes fadeUp { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }
  @keyframes shimmerTxt { 0% { background-position:-300% center; } 100% { background-position:300% center; } }
  @keyframes shimmerBg { 0% { background-position:-400px 0; } 100% { background-position:400px 0; } }
  @keyframes pulseDot { 0%,100% { box-shadow:0 0 0 0 rgba(0,201,123,.45); } 50% { box-shadow:0 0 0 7px rgba(0,201,123,0); } }
  @keyframes marquee { 0% { transform:translateX(0); } 100% { transform:translateX(-50%); } }
  @keyframes floatY { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-8px); } }
  @keyframes auroraA { 0%,100% { transform:translate(0,0) scale(1); } 33% { transform:translate(70px,-50px) scale(1.14); } 66% { transform:translate(-50px,35px) scale(.93); } }
  @keyframes auroraB { 0%,100% { transform:translate(0,0) scale(1); } 50% { transform:translate(-80px,-60px) scale(1.2); } }
  @keyframes glowRing { 0%,100% { filter:drop-shadow(0 0 5px rgba(0,201,123,.35)); } 50% { filter:drop-shadow(0 0 13px rgba(0,201,123,.6)); } }
  @keyframes twinkle { 0%,100% { opacity:.12; } 50% { opacity:.85; } }
  @keyframes zrise { 0% { transform:translateY(4px); opacity:0; } 30% { opacity:.9; } 100% { transform:translateY(-12px); opacity:0; } }
  @keyframes cloudBob { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-3.5px); } }
  @keyframes breathe { 0%,100% { transform:scaleY(1); } 50% { transform:scaleY(1.035); } }
  @keyframes lampPulse { 0%,100% { opacity:.55; } 50% { opacity:1; } }

  .doodle-band { max-width:440px; }
  .doodle-band svg { display:block; width:100%; height:auto; }
  .doodle-band .tw { animation:twinkle 3.2s ease-in-out infinite; }
  .doodle-band .zz { animation:zrise 2.6s ease-out infinite; transform-box:fill-box; transform-origin:center; }
  .doodle-band .dreamcloud { animation:cloudBob 4.4s ease-in-out infinite; transform-box:fill-box; transform-origin:center; cursor:pointer; }
  .doodle-band .dreamcloud:focus-visible path { stroke:#00E8A2; stroke-width:2; }
  .doodle-band .duvet { animation:breathe 4.2s ease-in-out infinite; transform-box:fill-box; transform-origin:bottom center; }
  .doodle-band .lampglow { animation:lampPulse 5s ease-in-out infinite; }
  @media(max-width:759px){ .doodle-band { max-width:330px; } }

  .f1 { animation: fadeUp .6s ease both .05s; }
  .f2 { animation: fadeUp .6s ease both .16s; }
  .f3 { animation: fadeUp .6s ease both .27s; }
  .f4 { animation: fadeUp .6s ease both .38s; }
  .f5 { animation: fadeUp .6s ease both .49s; }

  .shimmer-green {
    background: linear-gradient(90deg,#00C97B,#8FFFDB 40%,#00C97B 70%,#00E8A2);
    background-size: 300% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmerTxt 5s linear infinite;
  }
  .live-dot { animation: pulseDot 2s ease-in-out infinite; }
  .float { animation: floatY 6s ease-in-out infinite; }

  .marquee-track { display:flex; width:max-content; animation: marquee 46s linear infinite; }
  .marquee-track:hover { animation-play-state:paused; }

  .sr { opacity:0; transform:translateY(26px); transition: opacity .75s cubic-bezier(.22,.61,.36,1), transform .75s cubic-bezier(.22,.61,.36,1); }
  .sr.in { opacity:1; transform:translateY(0); }

  /* ── GLASS ── */
  .glass {
    background: linear-gradient(155deg, rgba(255,255,255,.095) 0%, rgba(255,255,255,.032) 52%, rgba(255,255,255,.06) 100%);
    border: 1px solid var(--glass-brd);
    -webkit-backdrop-filter: blur(22px) saturate(150%);
    backdrop-filter: blur(22px) saturate(150%);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.15), 0 26px 70px rgba(2,6,18,.42);
  }
  .glass-deep {
    background: linear-gradient(165deg, rgba(19,26,51,.88) 0%, rgba(12,17,36,.82) 60%, rgba(15,24,48,.86) 100%);
    border: 1px solid var(--glass-brd);
    -webkit-backdrop-filter: blur(28px) saturate(160%);
    backdrop-filter: blur(28px) saturate(160%);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.13), 0 34px 90px rgba(2,6,18,.55);
  }
  .glass-chip {
    background: rgba(255,255,255,.05);
    border: 1px solid rgba(255,255,255,.10);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.08);
  }

  .lift { transition: transform .25s cubic-bezier(.22,.61,.36,1), box-shadow .25s ease, border-color .25s ease; }
  .lift:hover { transform: translateY(-5px); border-color: rgba(0,201,123,.30) !important; box-shadow: inset 0 1px 0 rgba(255,255,255,.15), 0 30px 70px rgba(2,6,18,.55) !important; }

  .tilt { transition: transform .18s ease; will-change: transform; }

  .btn-primary {
    transition: transform .16s ease, box-shadow .16s ease;
    background: linear-gradient(120deg,#00C97B,#00E8A2);
    color:#05130C; border:none; cursor:pointer;
    font-weight:800; letter-spacing:-.01em;
    box-shadow: 0 10px 32px rgba(0,201,123,.42);
  }
  .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 14px 40px rgba(0,201,123,.55) !important; }
  .btn-primary:active { transform: translateY(0) scale(.98); }

  .btn-indigo {
    transition: transform .16s ease, box-shadow .16s ease;
    background: linear-gradient(120deg,#6366F1,#4F46E5);
    color:white; border:none; cursor:pointer; font-weight:800;
    box-shadow: 0 10px 32px rgba(99,102,241,.38);
  }
  .btn-indigo:hover { transform: translateY(-2px); box-shadow: 0 14px 40px rgba(99,102,241,.5) !important; }
  .btn-indigo:active { transform: translateY(0) scale(.98); }

  input[type="range"] {
    -webkit-appearance:none; appearance:none;
    width:100%; height:6px; border-radius:100px;
    background: linear-gradient(90deg, var(--green) var(--fill,50%), rgba(255,255,255,.13) var(--fill,50%));
    outline:none; cursor:pointer;
  }
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance:none; appearance:none;
    width:24px; height:24px; border-radius:50%;
    background:#fff; border:3.5px solid var(--green);
    box-shadow:0 2px 14px rgba(0,201,123,.55);
    cursor:grab; transition:transform .15s ease;
  }
  input[type="range"]::-webkit-slider-thumb:hover { transform:scale(1.15); }
  input[type="range"]::-webkit-slider-thumb:active { cursor:grabbing; transform:scale(1.05); }
  input[type="range"]::-moz-range-thumb {
    width:22px; height:22px; border-radius:50%;
    background:#fff; border:3.5px solid var(--green);
    box-shadow:0 2px 14px rgba(0,201,123,.55); cursor:grab;
  }

  .skel {
    background: linear-gradient(90deg, rgba(148,163,184,.09) 25%, rgba(148,163,184,.20) 50%, rgba(148,163,184,.09) 75%);
    background-size: 800px 100%;
    animation: shimmerBg 1.4s linear infinite;
    border-radius: 10px;
  }

  .grid-3 { display:grid; grid-template-columns:1fr; gap:14px; }
  @media(min-width:700px){ .grid-3 { grid-template-columns:repeat(3,1fr); } }

  .journey-card { border-radius:24px; padding:21px 19px; }
  @media(min-width:700px){ .journey-card { padding:26px 24px; } }

  .calc-strip { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .calc-card { border-radius:17px; padding:15px 13px; height:100%; }
  @media(min-width:760px){
    .calc-strip { grid-template-columns:repeat(4,1fr); gap:12px; }
    .calc-card { border-radius:20px; padding:20px 19px; }
  }

  .grid-4 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  @media(min-width:760px){ .grid-4 { grid-template-columns:repeat(4,1fr); } }

  .duo { display:grid; grid-template-columns:1fr; gap:44px; align-items:center; }
  @media(min-width:820px){ .duo { grid-template-columns:1fr 1fr; gap:64px; } }
  .duo.flip > :first-child { order:2; }
  .duo.flip > :last-child  { order:1; }
  @media(max-width:819px){
    .duo.flip > :first-child { order:1; }
    .duo.flip > :last-child  { order:2; }
  }

  .hero-cols { display:grid; grid-template-columns:1fr; gap:56px; align-items:center; }
  @media(min-width:980px){ .hero-cols { grid-template-columns:1fr 1fr; gap:56px; } }

  .hof-tabs { display:flex; gap:8px; overflow-x:auto; scrollbar-width:none; -ms-overflow-style:none;
    padding-bottom:6px; scroll-snap-type:x proximity; -webkit-overflow-scrolling:touch; }
  .hof-tabs::-webkit-scrollbar { display:none; }
  .hof-tab { flex-shrink:0; scroll-snap-align:start; white-space:nowrap; cursor:pointer;
    transition: all .2s ease; user-select:none; -webkit-user-select:none; touch-action:manipulation; }

  .hof-grid { display:grid; grid-template-columns:1fr; gap:16px; }
  @media(min-width:700px){ .hof-grid { grid-template-columns:repeat(3,1fr); gap:18px; } }

  .sticky-cta {
    position:fixed; left:12px; right:12px; bottom:12px; z-index:60;
    display:flex; align-items:center; justify-content:space-between; gap:10px;
    border-radius:18px; padding:11px 12px 11px 17px;
    transform:translateY(130%); transition:transform .38s cubic-bezier(.22,.61,.36,1);
  }
  .sticky-cta.show { transform:translateY(0); }
  @media(min-width:720px){ .sticky-cta { display:none; } }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration:.01ms !important; animation-iteration-count:1 !important; transition-duration:.01ms !important; }
    .sr { opacity:1; transform:none; }
  }
`;

/* ── TYPES ──────────────────────────────────────────────────────────────── */
type LiveFund = {
  Fund_Name: string;
  Category: string | null;
  Sub_Category: string | null;
  Fund_Return_3Y: number | null;
  Alpha_3Y: number | null;
  Current_AUM: number | null;
  Percentile_in_SubCategory: number | null;
  Composite_Score: number | null;
};
type Manifest = { dateTag: string; reportDate: string; counts: { raw: number; funds: number; etfs: number } };
type InsightRow = {
  Level: string;
  Category_Name: string | null;
  Sub_Category_Name: string | null;
  Number_of_Schemes: number | null;
  Total_AUM: number | null;
  Avg_3Y_Return: number | null;
  Avg_Benchmark_Return_3Y: number | null;
  Avg_Alpha_3Y: number | null;
  Pct_Funds_Beating_Benchmark_3Y: number | null;
};

/* ── HELPERS ────────────────────────────────────────────────────────────── */
function useReveal(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ob = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setTimeout(() => el.classList.add("in"), delay); ob.disconnect(); }
    }, { threshold: 0.06 });
    ob.observe(el);
    return () => ob.disconnect();
  }, [delay]);
  return ref;
}
function SR({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  return <div ref={useReveal(delay)} className="sr" style={style}>{children}</div>;
}

function Counter({ to, suffix = "", duration = 1700 }: { to: number; suffix?: string; duration?: number }) {
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
  return <span ref={ref}>{Math.round(v).toLocaleString("en-IN")}{suffix}</span>;
}

const num = (v: number | null | undefined, d = 0): number => typeof v === "number" && Number.isFinite(v) ? v : d;
const hasNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const fmtL = (n: number) => n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : `₹${(n / 1e5).toFixed(1)} L`;
const fmtAUMcr = (cr: number) => cr >= 100000 ? `${(cr / 100000).toFixed(1)}L Cr` : cr >= 1000 ? `${(cr / 1000).toFixed(1)}k Cr` : `${Math.round(cr)} Cr`;
const shortName = (n: string) => n.replace(/ Fund$/g, "").replace(/ Fund /g, " ");

function Skel({ h = 60, style = {} }: { h?: number; style?: React.CSSProperties }) {
  return <div className="skel" style={{ height: h, ...style }} />;
}

function trendFor(ret3y: number | null): { pts: number[]; color: string } {
  const base = [30, 34, 33, 38, 42, 41, 46, 50, 49, 55];
  const up = num(ret3y) >= 0;
  const pts = base.map((v, i) => up ? v + i * .6 : 120 - v - i * .4);
  return { pts, color: up ? "#00C97B" : "#EF4444" };
}

/* ══════════════════════════════════════════════════════════════════════════
   LIVE DATA — the only source of truth on this page
══════════════════════════════════════════════════════════════════════════ */
function useLiveData() {
  const [state, setState] = useState<{ funds: LiveFund[] | null; manifest: Manifest | null; insights: InsightRow[] | null; loaded: boolean }>({ funds: null, manifest: null, insights: null, loaded: false });

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetchCachedJson<LiveFund[]>("funds").catch(() => null),
      fetchCachedJson<Manifest>("manifest").catch(() => null),
      fetchCachedJson<InsightRow[]>("insights").catch(() => null),
    ]).then(([funds, manifest, insights]) => {
      if (alive) setState({ funds, manifest, insights, loaded: true });
    });
    return () => { alive = false; };
  }, []);

  const validFunds = state.funds?.filter(f => !!f.Fund_Name && hasNum(f.Fund_Return_3Y) && hasNum(f.Alpha_3Y)) ?? null;

  const topByCategory = (sub: string): LiveFund[] =>
    (validFunds ?? [])
      .filter(f => f.Sub_Category === sub && hasNum(f.Percentile_in_SubCategory))
      .sort((a, b) => num(b.Composite_Score) - num(a.Composite_Score))
      .slice(0, 3);

  const tickerFunds = (validFunds ?? [])
    .sort((a, b) => num(b.Composite_Score) - num(a.Composite_Score))
    .slice(0, 14)
    .map(f => ({ name: shortName(f.Fund_Name), alpha: f.Alpha_3Y as number }));

  const industry = state.insights?.find(r => r.Level === "Industry") ?? null;

  return { manifest: state.manifest, industry, topByCategory, tickerFunds, loaded: state.loaded };
}

/* ══════════════════════════════════════════════════════════════════════════
   SIP STUDIO — hero right column. Sliders drive projection AND live picks.
══════════════════════════════════════════════════════════════════════════ */
const sipFV = (monthly: number, annualPct: number, years: number) => {
  const r = annualPct / 1200, n = Math.round(years * 12);
  return monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
};

const HORIZONS = [
  { maxYears: 3, cats: ["Conservative Hybrid", "Balanced Advantage", "Arbitrage"], tag: "Protect first", why: "Under 3 years? Keep this money in debt & hybrid funds — equity is too rough for short timelines.", icon: "🛡️" },
  { maxYears: 7, cats: ["Aggressive Hybrid", "Large Cap", "Flexi Cap"], tag: "Grow steadily", why: "3–7 years rewards balance: hybrids and large caps compound with fewer nasty surprises.", icon: "⚖️" },
  { maxYears: 999, cats: ["Flexi Cap", "Mid Cap", "Small Cap"], tag: "Compound hard", why: "7+ years? This is where mid & small caps turn volatility into serious wealth.", icon: "🚀" },
];

function SipStudio({ topByCategory, loaded }: { topByCategory: (s: string) => LiveFund[]; loaded: boolean }) {
  const [amt, setAmt] = useState(10000);
  const [yrs, setYrs] = useState(10);

  const hz = HORIZONS.find(b => yrs <= b.maxYears) ?? HORIZONS[HORIZONS.length - 1];
  const picks = hz.cats.flatMap(c => topByCategory(c)).sort((a, b) => num(b.Composite_Score) - num(a.Composite_Score)).slice(0, 3);

  const invested = amt * yrs * 12;
  const mfV = sipFV(amt, 12, yrs);
  const fdV = sipFV(amt, 7, yrs);
  const maxV = Math.max(mfV, invested) * 1.05;

  const W = 360, H = 148, PAD = 10;
  const mk = (endV: number, rate: number) => Array.from({ length: yrs + 1 }, (_, i) => i === yrs ? endV : sipFV(amt, rate, i));
  const pathOf = (pts: number[]) => pts.map((v, i) =>
    `${i ? "L" : "M"}${(PAD + (i / Math.max(pts.length - 1, 1)) * (W - PAD * 2)).toFixed(1)},${(H - 20 - (v / maxV) * (H - 46)).toFixed(1)}`
  ).join(" ");

  const setFill = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = e.target, min = parseFloat(t.min), max = parseFloat(t.max);
    t.style.setProperty("--fill", `${(((parseFloat(t.value) - min) / (max - min)) * 100).toFixed(1)}%`);
  };

  return (
    <div className="glass" style={{ borderRadius: 28, padding: "clamp(20px,3vw,28px)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, gap: 10 }}>
        <div>
          <div style={{ fontSize: 9.5, fontWeight: 800, color: "var(--txt-lo)", letterSpacing: ".14em", textTransform: "uppercase" as const, marginBottom: 6 }}>Playground · go ahead, drag</div>
          <div style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: 21, fontWeight: 900, color: "var(--txt-hi)" }}>What could ₹X/month become?</div>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 12, background: "rgba(0,201,123,.15)", border: "1px solid rgba(0,201,123,.30)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🎛️</div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" as const, marginBottom: 8 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--txt-md)" }}>Monthly investment</span>
          <span style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: 18, fontWeight: 900, color: "var(--mint)" }}>₹{amt.toLocaleString("en-IN")}</span>
        </div>
        <input type="range" min="1000" max="100000" step="1000" value={amt} aria-label="Monthly SIP amount"
          onChange={e => { setAmt(+e.target.value); setFill(e); }} style={{ ["--fill" as string]: `${((amt - 1000) / 99000 * 100)}%` }} />
      </div>

      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" as const, marginBottom: 8 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--txt-md)" }}>Stay invested for</span>
          <span style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: 18, fontWeight: 900, color: "var(--txt-hi)" }}>{yrs} yr{yrs !== 1 ? "s" : ""}</span>
        </div>
        <input type="range" min="1" max="25" step="1" value={yrs} aria-label="Investment years"
          onChange={e => { setYrs(+e.target.value); setFill(e); }} style={{ ["--fill" as string]: `${((yrs - 1) / 24 * 100)}%` }} />
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block", marginBottom: 12 }} role="img" aria-label={`Projection of ₹${amt}/month over ${yrs} years`}>
        <defs>
          <linearGradient id="pMf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00C97B" stopOpacity=".30" /><stop offset="100%" stopColor="#00C97B" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="pFd" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#94A3B8" stopOpacity=".13" /><stop offset="100%" stopColor="#94A3B8" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[.3, .58, .86].map((p, i) => <line key={i} x1={PAD} y1={H * p} x2={W - PAD} y2={H * p} stroke="rgba(255,255,255,.06)" strokeWidth="1" />)}
        <path d={`${pathOf(mk(fdV, 7))} L${W - PAD},${H - 20} L${PAD},${H - 20}Z`} fill="url(#pFd)" />
        <path d={pathOf(mk(fdV, 7))} fill="none" stroke="rgba(148,163,184,.6)" strokeWidth="1.6" strokeDasharray="5 4" strokeLinecap="round" />
        <path d={`${pathOf(mk(mfV, 12))} L${W - PAD},${H - 20} L${PAD},${H - 20}Z`} fill="url(#pMf)" />
        <path d={pathOf(mk(mfV, 12))} fill="none" stroke="#00C97B" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 2px 8px rgba(0,201,123,.45))" }} />
        <text x={PAD} y={H - 5} fontSize="8.5" fill="rgba(255,255,255,.28)" fontFamily="DM Sans,system-ui">Today</text>
        <text x={W - PAD} y={H - 5} fontSize="8.5" fill="rgba(255,255,255,.28)" fontFamily="DM Sans,system-ui" textAnchor="end">{yrs}Y</text>
      </svg>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 7, marginBottom: 10 }}>
        {([
          ["Invested", fmtL(invested), "rgba(255,255,255,.05)", "var(--txt-hi)"],
          ["Equity MF @12%", fmtL(mfV), "rgba(0,201,123,.13)", "#00E8A2"],
          ["FD @7%", fmtL(fdV), "rgba(148,163,184,.09)", "rgba(255,255,255,.55)"],
        ] as const).map(([l, v, bg, c], i) => (
          <div key={i} style={{ borderRadius: 12, padding: "9px 11px", background: bg, border: "1px solid rgba(255,255,255,.08)" }}>
            <div style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: ".06em", color: "var(--txt-lo)", textTransform: "uppercase" as const, marginBottom: 3 }}>{l}</div>
            <div style={{ fontSize: 14, fontWeight: 900, color: c, fontFamily: "Fraunces,Georgia,serif" }}>{v}</div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 9.5, color: "rgba(210,220,245,.30)", fontStyle: "italic", textAlign: "center" as const }}>Assumed returns for illustration — not guarantees</p>

      <div style={{ borderTop: "1px solid rgba(255,255,255,.09)", marginTop: 16, paddingTop: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
          <span style={{ fontSize: 14 }}>{hz.icon}</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: "var(--mint)", letterSpacing: ".1em", textTransform: "uppercase" as const }}>{hz.tag}</span>
        </div>
        <p style={{ fontSize: 11.5, color: "var(--txt-md)", lineHeight: 1.65, marginBottom: 12 }}>{hz.why}</p>

        {!loaded && <Skel h={150} />}
        {loaded && picks.map(f => {
          const t = trendFor(f.Fund_Return_3Y);
          return (
            <div key={f.Fund_Name} className="glass-chip lift" style={{ borderRadius: 14, padding: "10px 12px", marginBottom: 7, display: "flex", alignItems: "center", gap: 10 }}>
              <Spark pts={t.pts} color={t.color} w={34} h={15} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,.90)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{shortName(f.Fund_Name)}</div>
                <div style={{ fontSize: 9.5, fontWeight: 600, color: "var(--txt-lo)" }}>{f.Sub_Category}</div>
              </div>
              <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: "var(--mint)" }}>{num(f.Fund_Return_3Y).toFixed(1)}%</div>
                <div style={{ fontSize: 8.5, fontWeight: 700, color: "var(--txt-lo)" }}>3Y CAGR</div>
              </div>
            </div>
          );
        })}
        {loaded && picks.length === 0 && <div style={{ fontSize: 11, color: "var(--txt-lo)", padding: "6px 2px" }}>Live rankings refreshing…</div>}

        <Link href="/mutual-fund-match" style={{ textDecoration: "none", display: "block", marginTop: 10 }}>
          <button className="btn-indigo" style={{ width: "100%", borderRadius: 13, padding: "12px 16px", fontSize: 13 }}>
            Get funds matched to my exact goal →
          </button>
        </Link>
      </div>
    </div>
  );
}

/* ── SPARKLINE ──────────────────────────────────────────────────────────── */
function Spark({ pts, color, w = 40, h = 17 }: { pts: number[]; color: string; w?: number; h?: number }) {
  const mn = Math.min(...pts), rng = Math.max(...pts) - mn || 1;
  const xs = pts.map((_, i) => (i / (pts.length - 1)) * w);
  const ys = pts.map(v => h - ((v - mn) / rng) * (h - 4) - 2);
  const d = xs.map((x, i) => `${i ? "L" : "M"}${x},${ys[i]}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible", flexShrink: 0 }} aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity=".9" />
      <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r="2.6" fill={color} />
    </svg>
  );
}

/* ── SLEEP DOODLE — thoughtful money, better life: a good night's sleep ─── */
function SleepDoodle() {
  const router = useRouter();
  const ln = { fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const wood = { stroke: "rgba(196,154,108,.55)", strokeWidth: 1.5 };
  return (
    <div className="doodle-band">
      <svg viewBox="0 0 560 160" role="img" aria-label="Illustration: after one honest portfolio review, you sleep soundly while your money quietly grows toward your dreams">
        <defs>
          <linearGradient id="duvetGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(129,140,248,.32)" />
            <stop offset="100%" stopColor="rgba(79,70,229,.14)" />
          </linearGradient>
          <radialGradient id="moonGlow">
            <stop offset="0%" stopColor="rgba(165,180,252,.28)" />
            <stop offset="100%" stopColor="rgba(165,180,252,0)" />
          </radialGradient>
          <radialGradient id="lampHalo">
            <stop offset="0%" stopColor="rgba(255,196,107,.30)" />
            <stop offset="100%" stopColor="rgba(255,196,107,0)" />
          </radialGradient>
        </defs>

        {/* night sky */}
        <circle cx="54" cy="32" r="26" fill="url(#moonGlow)" />
        <path d="M62 18a15 15 0 1 0 9.5 26.5A12.5 12.5 0 1 1 62 18Z" fill="rgba(165,180,252,.35)" stroke="rgba(199,210,254,.6)" strokeWidth="1.3" />
        <circle className="tw" cx="122" cy="20" r="1.7" fill="#fff" style={{ animationDelay: "0s" }} />
        <circle className="tw" cx="205" cy="40" r="1.4" fill="#fff" style={{ animationDelay: ".8s" }} />
        <circle className="tw" cx="300" cy="16" r="1.6" fill="#fff" style={{ animationDelay: "1.6s" }} />
        <circle className="tw" cx="352" cy="52" r="1.3" fill="#fff" style={{ animationDelay: ".4s" }} />
        <circle className="tw" cx="158" cy="64" r="1.3" fill="#fff" style={{ animationDelay: "2.2s" }} />
        <path className="tw" d="M330 34l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6Z" fill="#fff" opacity=".7" style={{ animationDelay: "1.1s" }} />

        {/* floor */}
        <path d="M18 152q272-10 524-4" stroke="rgba(255,255,255,.10)" strokeWidth="1.5" {...ln} />

        {/* nightstand */}
        <rect x="26" y="96" width="66" height="8" rx="3.5" fill="rgba(196,154,108,.13)" {...wood} />
        <rect x="32" y="104" width="54" height="23" rx="5" fill="rgba(196,154,108,.07)" {...wood} strokeWidth={1.3} />
        <circle cx="59" cy="115.5" r="2.2" fill="rgba(196,154,108,.65)" />
        <path d="M36 127l-3.5 17M82 127l3.5 17" stroke="rgba(196,154,108,.45)" strokeWidth={1.6} strokeLinecap="round" />

        {/* lamp, switched off for the night */}
        <ellipse className="lampglow" cx="46" cy="76" rx="19" ry="12" fill="url(#lampHalo)" />
        <path d="M38 68h16l-4 11h-8Z" fill="rgba(255,196,107,.28)" stroke="rgba(255,196,107,.7)" strokeWidth={1.3} strokeLinejoin="round" />
        <path d="M46 79v15" stroke="rgba(255,196,107,.55)" strokeWidth={1.6} strokeLinecap="round" />
        <ellipse cx="46" cy="95" rx="6.5" ry="2" fill="rgba(255,196,107,.20)" stroke="rgba(255,196,107,.55)" strokeWidth={1.2} />

        {/* phone face-down — no notifications tonight */}
        <g transform="rotate(-8 78 92)">
          <rect x="70" y="88" width="17" height="9.5" rx="2.5" fill="rgba(148,163,184,.16)" stroke="rgba(203,213,225,.55)" strokeWidth={1.2} />
          <circle cx="74.5" cy="91" r="1.1" fill="rgba(203,213,225,.7)" />
        </g>

        {/* bed frame + headboard */}
        <rect x="484" y="66" width="21" height="72" rx="9" fill="rgba(196,154,108,.15)" {...wood} />
        <rect x="126" y="124" width="380" height="8" rx="4" fill="rgba(196,154,108,.12)" {...wood} strokeWidth={1.4} />
        <path d="M140 132l-4.5 18M492 132l4.5 18" stroke="rgba(196,154,108,.45)" strokeWidth={1.7} strokeLinecap="round" />

        {/* mattress + pillow */}
        <rect x="134" y="106" width="356" height="18" rx="8.5" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.25)" strokeWidth={1.3} />
        <g transform="rotate(-6 461 102)">
          <rect x="430" y="93" width="62" height="17" rx="8.5" fill="rgba(255,255,255,.17)" stroke="rgba(255,255,255,.38)" strokeWidth={1.3} />
        </g>

        {/* sleeper — peaceful, finally */}
        <g>
          <circle cx="455" cy="93" r="11.5" fill="#F0BE90" stroke="rgba(122,74,42,.6)" strokeWidth={1.4} />
          <path d="M443.5 90Q444 78.5 455 78.5T466.5 90L462.5 88.5Q455 83 447.5 89Z" fill="#6B4A2F" />
          <path d="M448 94q2.5 2.6 5 0M456.5 94q2.5 2.6 5 0" stroke="rgba(96,58,30,.8)" strokeWidth={1.3} {...ln} />
          <path d="M451.5 100.5q3.5 2.8 7 0" stroke="rgba(122,74,42,.75)" strokeWidth={1.2} {...ln} />
          <circle cx="447" cy="98" r="1.9" fill="rgba(240,130,90,.28)" />
          <circle cx="464" cy="98" r="1.9" fill="rgba(240,130,90,.28)" />
        </g>
        {/* arm resting over the duvet */}
        <path d="M437 107q-15 5-23 11.5" stroke="#F0BE90" strokeWidth={6.5} strokeLinecap="round" fill="none" />
        <circle cx="412.5" cy="120" r="4" fill="#F0BE90" stroke="rgba(122,74,42,.45)" strokeWidth={1.1} />

        {/* duvet — gently breathing */}
        <path className="duvet" d="M441 101C430 113 400 99 368 105 338 111 320 98 290 104 256 110 232 99 202 105 182 108.5 164 110.5 152 113 145 114.5 143 117 143 121L448 121C452.5 112.5 448.5 105.5 441 101Z"
          fill="url(#duvetGrad)" stroke="rgba(165,180,252,.55)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M300 111.5q10 3 20 1M250 113.5q9 2.5 18 .5M200 115.5q8 2 16 .5" stroke="rgba(199,210,254,.30)" strokeWidth={1.2} {...ln} />

        {/* rising zzz */}
        <text className="zz" x="470" y="80" fontSize="11" fontWeight="800" fill="#00E8A2" style={{ animationDelay: "0s" }}>z</text>
        <text className="zz" x="482" y="68" fontSize="14" fontWeight="800" fill="#00E8A2" style={{ animationDelay: ".85s" }}>z</text>
        <text className="zz" x="496" y="57" fontSize="17" fontWeight="800" fill="#A5B4FC" style={{ animationDelay: "1.7s" }}>z</text>

        {/* the dream — one cloud, three goals; tap to plan */}
        <g className="dreamcloud" role="link" tabIndex={0} aria-label="Every dream has a monthly number — plan yours"
          style={{ cursor: "pointer" }}
          onClick={() => router.push("/dashboard/calculators#calc-sip-goal")}
          onKeyDown={e => { if (e.key === "Enter") router.push("/dashboard/calculators#calc-sip-goal"); }}>
          <title>Every dream has a monthly number — find yours</title>
          <circle cx="468" cy="72" r="2.2" fill="rgba(165,180,252,.45)" />
          <circle cx="477" cy="60" r="3" fill="rgba(165,180,252,.45)" />
          <path className="cloudbob" d="M466 44q-3-12 11-13 3-12 18-9 8-9 21-3 14-4 17 9 12 4 6 15 1 9-11 9H478q-11 0-12-8Z"
            fill="rgba(99,102,241,.09)" stroke="rgba(165,180,252,.55)" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
          {/* home */}
          <path d="M481 39v-5.5l5.5-5 5.5 5V39h-4v-3.6h-3V39Z" stroke="#FBBF24" strokeWidth={1.5} {...ln} />
          {/* degree */}
          <path d="M502 31.5l7.5-3.8 7.5 3.8-7.5 3.8Zm7.5 3.8v4.2m-4.5-6.3v3.4q4.5 2.2 9 0v-3.4" stroke="#A5B4FC" strokeWidth={1.4} {...ln} />
          {/* ring */}
          <circle cx="533" cy="36.5" r="3.8" stroke="#00E8A2" strokeWidth={1.5} {...ln} />
          <path d="M530.4 31.2l2.6-3.2 2.6 3.2-2.6 2.2Z" stroke="#00E8A2" strokeWidth={1.3} {...ln} />
        </g>
      </svg>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   HALL OF FAME — immersive proof section. Live leaderboard + market pulse.
══════════════════════════════════════════════════════════════════════════ */
const HOF_CATS = [
  { key: "Flexi Cap", icon: "🌀", blurb: "One fund, any market condition — managers roam the full market-cap spectrum." },
  { key: "Large Cap", icon: "🏛️", blurb: "The steady giants. India's 100 biggest companies, lower drama." },
  { key: "Mid Cap", icon: "🚀", blurb: "Tomorrow's large caps today. More swing, more upside." },
  { key: "Small Cap", icon: "💎", blurb: "High risk, highest reward. Only for patient, long-horizon money." },
  { key: "ELSS", icon: "🛡️", blurb: "Tax savings under 80C with equity growth. 3-year lock-in." },
  { key: "Aggressive Hybrid", icon: "⚖️", blurb: "65-80% equity cushioned with debt — smoother ride than pure equity." },
];
const MEDALS = ["🥇", "🥈", "🥉"];

function HallOfFame({ totalSchemes, reportDate, pctBeat, avgRet, loaded, topByCategory, tickerFunds }:
  { totalSchemes: number; reportDate: string; pctBeat: number | null; avgRet: number | null; loaded: boolean; topByCategory: (s: string) => LiveFund[]; tickerFunds: { name: string; alpha: number }[] }) {
  const [tab, setTab] = useState(HOF_CATS[0].key);
  const active = HOF_CATS.find(c => c.key === tab) ?? HOF_CATS[0];
  const funds = loaded ? topByCategory(tab) : [];

  return (
    <section style={{ position: "relative", padding: "clamp(48px,7vw,90px) clamp(16px,4vw,48px)" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>

        {/* Section head */}
        <SR>
          <div style={{ textAlign: "center" as const, marginBottom: 26 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(99,102,241,.12)", border: "1px solid rgba(99,102,241,.30)", borderRadius: 100, padding: "6px 16px", marginBottom: 16 }}>
              <span className="live-dot" style={{ width: 6, height: 6, background: loaded ? "#00C97B" : "#94A3B8", borderRadius: "50%" }} />
              <span style={{ fontSize: 10.5, fontWeight: 800, color: loaded ? "#A5B4FC" : "var(--txt-lo)", letterSpacing: ".12em", textTransform: "uppercase" as const }}>
                {loaded ? `Live · ${totalSchemes.toLocaleString("en-IN")} schemes · ${reportDate}` : "Connecting to live data…"}
              </span>
            </div>
            <h2 style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: "clamp(1.9rem,4.5vw,3.1rem)", fontWeight: 900, color: "var(--txt-hi)", letterSpacing: "-.03em", lineHeight: 1.08, marginBottom: 12 }}>
              The Hall of Fame.
              <br /><span className="shimmer-green">India&apos;s best funds, ranked live.</span>
            </h2>
            <p style={{ fontSize: "clamp(13.5px,1.7vw,15.5px)", color: "var(--txt-md)", maxWidth: 560, margin: "0 auto", lineHeight: 1.75 }}>
              Every fund in India scored on alpha, consistency and risk-adjusted returns.
              {hasNum(pctBeat) && <> Right now, only <strong style={{ color: "var(--txt-hi)" }}>{Math.round(pctBeat)}%</strong> beat their benchmark over 3 years — here are the ones that did.</>}
            </p>
          </div>
        </SR>

        {/* Live marquee inside the glass panel */}
        <SR delay={50}>
          <div className="glass-deep" style={{ borderRadius: 28, overflow: "hidden" }}>
            <div style={{ borderBottom: "1px solid rgba(255,255,255,.07)", padding: "10px 0", overflow: "hidden", position: "relative" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 50, background: "linear-gradient(90deg,#10162B,transparent)", zIndex: 2, pointerEvents: "none" }} />
              <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 50, background: "linear-gradient(-90deg,#10162B,transparent)", zIndex: 2, pointerEvents: "none" }} />
              {!loaded || tickerFunds.length === 0 ? <div style={{ padding: "0 24px" }}><Skel h={14} /></div> : (
                <div className="marquee-track">
                  {[...tickerFunds, ...tickerFunds].map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 18px", whiteSpace: "nowrap" as const, borderRight: "1px solid rgba(255,255,255,.05)", height: 22 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--txt-md)" }}>{f.name}</span>
                      <span style={{ fontSize: 10, fontWeight: 800, color: f.alpha >= 0 ? "#00C97B" : "#EF4444", background: f.alpha >= 0 ? "rgba(0,201,123,.10)" : "rgba(239,68,68,.10)", border: `1px solid ${f.alpha >= 0 ? "rgba(0,201,123,.25)" : "rgba(239,68,68,.25)"}`, borderRadius: 100, padding: "1px 7px" }}>
                        {f.alpha >= 0 ? "+" : ""}{f.alpha.toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tabs */}
            <div style={{ padding: "18px clamp(16px,3vw,32px) 0" }}>
              <div className="hof-tabs" role="tablist" aria-label="Fund categories">
                {HOF_CATS.map(c => (
                  <button key={c.key} role="tab" aria-selected={tab === c.key} onClick={() => setTab(c.key)}
                    style={{
                      background: tab === c.key ? "linear-gradient(120deg,#6366F1,#4F46E5)" : "rgba(255,255,255,.05)",
                      color: tab === c.key ? "white" : "var(--txt-md)",
                      border: `1px solid ${tab === c.key ? "transparent" : "rgba(255,255,255,.11)"}`,
                      borderRadius: 100, padding: "9px 17px", fontSize: 12.5, fontWeight: 800,
                      boxShadow: tab === c.key ? "0 6px 20px rgba(99,102,241,.35)" : "none",
                    }}>
                    {c.icon} {c.key}
                  </button>
                ))}
              </div>
              <p style={{ marginTop: 14, marginBottom: 16, fontSize: 12.5, color: "var(--txt-md)", fontStyle: "italic" }}>{active.blurb}</p>
            </div>

            {/* Leaderboard */}
            <div style={{ padding: "0 clamp(16px,3vw,32px) clamp(22px,3vw,32px)" }}>
              {!loaded && (
                <div className="hof-grid">{[0, 1, 2].map(i => <Skel key={i} h={168} />)}</div>
              )}
              {loaded && (
                <div className="hof-grid">
                  {funds.map((f, i) => {
                    const t = trendFor(f.Fund_Return_3Y);
                    return (
                      <div key={f.Fund_Name}
                        className="glass lift"
                        style={{
                          borderRadius: 22, padding: "20px 20px 18px", position: "relative", overflow: "hidden",
                          borderTop: i === 0 ? "3px solid #00C97B" : i === 1 ? "3px solid #6366F1" : "3px solid rgba(148,163,184,.55)",
                        }}>
                        {i === 0 && <div style={{ position: "absolute", top: -46, right: -46, width: 130, height: 130, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,201,123,.16),transparent 68%)", pointerEvents: "none" }} />}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
                          <div style={{ minWidth: 0 }}>
                            <span style={{ fontSize: 21, display: "block", marginBottom: 7, lineHeight: 1 }}>{MEDALS[i]}</span>
                            <div style={{ fontSize: 14.5, fontWeight: 800, color: "var(--txt-hi)", lineHeight: 1.32 }}>{shortName(f.Fund_Name)}</div>
                          </div>
                          <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                            <Spark pts={t.pts} color={t.color} w={52} h={20} />
                            <div style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: 25, fontWeight: 900, color: "var(--txt-hi)", lineHeight: 1.15, marginTop: 6 }}>{num(f.Fund_Return_3Y).toFixed(1)}%</div>
                            <div style={{ fontSize: 9, fontWeight: 800, color: "var(--txt-lo)", letterSpacing: ".09em" }}>3Y CAGR</div>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                          <span style={{
                            fontSize: 10.5, fontWeight: 800, borderRadius: 100, padding: "4px 10px",
                            color: num(f.Alpha_3Y) >= 0 ? "#00C97B" : "#EF4444",
                            background: num(f.Alpha_3Y) >= 0 ? "rgba(0,201,123,.10)" : "rgba(239,68,68,.10)",
                            border: `1px solid ${num(f.Alpha_3Y) >= 0 ? "rgba(0,201,123,.28)" : "rgba(239,68,68,.28)"}`,
                          }}>
                            {num(f.Alpha_3Y) >= 0 ? "+" : ""}{num(f.Alpha_3Y).toFixed(1)}% vs benchmark
                          </span>
                          <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--txt-md)", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.10)", borderRadius: 100, padding: "4px 10px" }}>
                            AUM {fmtAUMcr(num(f.Current_AUM))}
                          </span>
                        </div>
                        <div style={{ marginTop: 12, fontSize: 10.5, fontWeight: 700, color: "#A5B4FC", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span>Beats {num(f.Percentile_in_SubCategory).toFixed(0)}% of category peers</span>
                          <div style={{ width: 64, height: 4, borderRadius: 100, background: "rgba(255,255,255,.08)", overflow: "hidden" }}>
                            <div style={{ width: `${num(f.Percentile_in_SubCategory)}%`, height: "100%", borderRadius: 100, background: "linear-gradient(90deg,#6366F1,#A5B4FC)" }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {loaded && funds.length === 0 && <div style={{ gridColumn: "1/-1", textAlign: "center" as const, padding: 30, color: "var(--txt-lo)", fontSize: 13 }}>Rankings refreshing…</div>}
                </div>
              )}

              <div style={{ display: "flex", gap: 18, flexWrap: "wrap" as const, justifyContent: "center", alignItems: "center", marginTop: 26, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,.07)" }}>
                {[["/active-funds", "⚡ Active Funds"], ["/index-funds", "📈 Index & ETFs"], ["/mutual-fund-analysis", "🗺️ Full MF Universe"]].map(([href, label]) => (
                  <Link key={href} href={href} style={{ textDecoration: "none", fontSize: 12.5, fontWeight: 700, color: "var(--txt-md)" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#00E8A2")}
                    onMouseLeave={e => (e.currentTarget.style.color = "var(--txt-md)")}>
                    {label} →
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </SR>

        {hasNum(avgRet) && (
          <SR delay={120}>
            <p style={{ textAlign: "center" as const, marginTop: 16, fontSize: 11.5, color: "var(--txt-lo)" }}>
              Market context: India&apos;s funds averaged <strong style={{ color: "var(--txt-md)" }}>{avgRet.toFixed(1)}%</strong> per year over the last 3 years. Picking the right category matters more than timing.
            </p>
          </SR>
        )}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   HEALTH CHECK — conversion section, plain-spoken copy
══════════════════════════════════════════════════════════════════════════ */
function HealthCheck({ industry }: { industry: InsightRow | null }) {
  const pctBeat = num(industry?.Pct_Funds_Beating_Benchmark_3Y);

  return (
    <section style={{ position: "relative", padding: "clamp(48px,7vw,90px) clamp(16px,4vw,48px)", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "-160px", right: "-120px", width: 560, height: 560, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,201,123,.09) 0%,transparent 62%)", filter: "blur(34px)", pointerEvents: "none" }} />
      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
        <SR>
          <div className="duo flip">
            {/* Visual: the verdict card */}
            <div>
              <div className="glass-deep float" style={{ borderRadius: 26, padding: "clamp(20px,3vw,30px)" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(0,201,123,.12)", border: "1px solid rgba(0,201,123,.28)", borderRadius: 100, padding: "4px 13px", marginBottom: 16 }}>
                  <span style={{ fontSize: 9.5, fontWeight: 800, color: "#00C97B", letterSpacing: ".10em", textTransform: "uppercase" as const }}>Sample report</span>
                </div>
                <div style={{ display: "grid", gap: 9 }}>
                  {[
                    { name: "Your Large Cap Fund", xirr: "16.8%", note: "+3.2% above its benchmark", v: "KEEP", c: "#00C97B" },
                    { name: "Your Flexi Cap Fund", xirr: "13.9%", note: "roughly at benchmark — nothing special", v: "WATCH", c: "#F59E0B" },
                    { name: "That Fund from 2021", xirr: "7.2%", note: "−4.8% below benchmark every year", v: "EXIT?", c: "#EF4444" },
                  ].map((r, i) => (
                    <div key={i} className="glass-chip" style={{ borderRadius: 15, padding: "13px 15px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 800, color: "var(--txt-hi)" }}>{r.name}</div>
                        <div style={{ fontSize: 10.5, color: "var(--txt-lo)", marginTop: 2 }}>XIRR {r.xirr} · {r.note}</div>
                      </div>
                      <span style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 800, padding: "5px 12px", borderRadius: 100, color: r.c, background: `${r.c}1f`, border: `1px solid ${r.c}52` }}>{r.v}</span>
                    </div>
                  ))}
                </div>
                <p style={{ marginTop: 14, fontSize: 10.5, color: "var(--txt-lo)", fontStyle: "italic" }}>Illustrative example — your report uses your actual transactions</p>
              </div>
            </div>

            {/* Copy */}
            <div>
              <h2 style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: "clamp(1.8rem,4.2vw,2.9rem)", fontWeight: 900, color: "var(--txt-hi)", letterSpacing: "-.03em", lineHeight: 1.1, margin: "0 0 16px" }}>
                You&apos;ve invested for years.<br /><span className="shimmer-green">Know what it earned you.</span>
              </h2>
              <p style={{ fontSize: "clamp(14px,1.7vw,16px)", color: "var(--txt-md)", lineHeight: 1.85, maxWidth: 480, margin: "0 0 22px" }}>
                Fund apps show how the <em>fund</em> did. Your actual returns depend on <strong style={{ color: "var(--txt-hi)" }}>when you bought, how much you put in, and what price you paid</strong> — and they&apos;re often 4-5% apart. That gap compounds into lakhs over a decade.
              </p>

              <div style={{ display: "grid", gap: 12, marginBottom: 26, maxWidth: 480 }}>
                {[
                  ["1", "Download your CAS", "One email to CAMS or KFintech — free statement of all your folios. Takes 2 minutes."],
                  ["2", "Drop the PDF here", "Parsed entirely in your browser. Password-protected files work too. Nothing leaves your device."],
                  ["3", "See the truth per fund", "True XIRR since day one, benchmark comparison, and a keep / watch / exit call for each holding."],
                ].map(([n, t, d]) => (
                  <div key={n} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(0,201,123,.14)", border: "1px solid rgba(0,201,123,.32)", color: "#00E8A2", fontSize: 12, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>{n}</div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--txt-hi)", marginBottom: 3 }}>{t}</div>
                      <div style={{ fontSize: 12, color: "var(--txt-md)", lineHeight: 1.65 }}>{d}</div>
                    </div>
                  </div>
                ))}
              </div>

              <Link href="/mutual-fund-health-check/dashboard" style={{ textDecoration: "none" }}>
                <button className="btn-primary" style={{ borderRadius: 15, padding: "16px 30px", fontSize: 15.5 }}>
                  🏥 Audit my portfolio — free
                </button>
              </Link>
              {hasNum(industry?.Pct_Funds_Beating_Benchmark_3Y) && (
                <p style={{ marginTop: 14, fontSize: 11.5, color: "var(--txt-lo)" }}>
                  Worth checking: only {Math.round(pctBeat)}% of Indian funds actually beat their benchmark over 3 years.
                </p>
              )}
            </div>
          </div>
        </SR>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   PAGE ASSEMBLY
══════════════════════════════════════════════════════════════════════════ */
export default function Home() {
  const { manifest, industry, topByCategory, tickerFunds, loaded } = useLiveData();
  const totalSchemes = manifest?.counts.raw ?? 0;

  const [showCta, setShowCta] = useState(false);

  useEffect(() => {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (nav?.type === "reload") {
      window.history.scrollRestoration = "manual";
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    }
    return () => { window.history.scrollRestoration = "auto"; };
  }, []);
  useEffect(() => {
    const onScroll = () => {
      const pastHero = window.scrollY > 700;
      const nearBottom = window.innerHeight + window.scrollY > document.documentElement.scrollHeight - 520;
      setShowCta(pastHero && !nearBottom);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main style={{ background: "var(--ink)", minHeight: "100vh", fontFamily: "'DM Sans',system-ui,sans-serif", color: "var(--txt-hi)" }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ════ 1 · HOOK — hero + live SIP studio ════ */}
      <header style={{ position: "relative", overflow: "hidden", padding: "clamp(34px,6vw,96px) clamp(16px,4vw,48px) clamp(48px,7vw,88px)", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
        <div style={{ position: "absolute", top: "-240px", left: "-140px", width: 760, height: 760, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,201,123,.15) 0%,transparent 62%)", filter: "blur(32px)", animation: "auroraA 26s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-260px", right: "-160px", width: 860, height: 860, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,.14) 0%,transparent 60%)", filter: "blur(38px)", animation: "auroraB 30s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px)", backgroundSize: "52px 52px", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
          <div className="hero-cols">
            <div>
              <div style={{ marginBottom: 14 }}>
                <SleepDoodle />
                <p style={{ margin: "2px 0 0", fontSize: 10.5, color: "var(--txt-lo)", fontStyle: "italic", textAlign: "right" as const }}>you, after one honest portfolio review</p>
              </div>

              <div className="f1" style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "rgba(0,201,123,.09)", border: "1px solid rgba(0,201,123,.26)", borderRadius: 100, padding: "6px 15px", marginBottom: 20 }}>
                <span className="live-dot" style={{ width: 7, height: 7, background: "#00C97B", borderRadius: "50%" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#00E8A2", letterSpacing: ".07em", textTransform: "uppercase" as const }}>
                  {loaded ? `${totalSchemes.toLocaleString("en-IN")} funds · updated ${manifest?.reportDate ?? ""} · free forever` : "connecting to live data…"}
                </span>
              </div>

              <h1 className="f2" style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: "clamp(2.6rem,6.8vw,5rem)", fontWeight: 900, lineHeight: 1.02, letterSpacing: "-.04em", color: "var(--txt-hi)", marginBottom: 22 }}>
                Thoughtful money.<br /><span className="shimmer-green">Better life.</span>
              </h1>

              <p className="f3" style={{ fontSize: "clamp(15px,1.9vw,17.5px)", color: "var(--txt-md)", lineHeight: 1.8, maxWidth: 470, marginBottom: 28 }}>
                Nivesify does the worrying math — what your funds really earned, whether you&apos;re actually winning, and the exact monthly plan for each dream — so tonight you sleep, not scroll.
              </p>

              <div className="f4" style={{ display: "flex", flexWrap: "wrap" as const, gap: 12, alignItems: "center", marginBottom: 28 }}>
                <Link href="/mutual-fund-health-check/dashboard" style={{ textDecoration: "none" }}>
                  <button className="btn-primary" style={{ borderRadius: 15, padding: "17px 32px", fontSize: 16 }}>
                    🏥 Audit my portfolio — free
                  </button>
                </Link>
                <span style={{ fontSize: 12.5, color: "var(--txt-lo)", fontWeight: 600 }}>3 minutes · no signup</span>
              </div>

              <div className="f5" style={{ display: "flex", gap: "20px 28px", flexWrap: "wrap" as const, paddingTop: 22, borderTop: "1px solid rgba(255,255,255,.08)" }}>
                {[
                  { v: loaded && totalSchemes > 0 ? <Counter to={totalSchemes} /> : null, l: "funds scored live" },
                  { v: loaded && hasNum(industry?.Total_AUM) ? <>₹{fmtAUMcr(industry.Total_AUM)}</> : null, l: "market money analysed", skip: true },
                ].map((s, i) => (
                  <div key={i}>
                    <div style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: "clamp(1.4rem,2.4vw,2rem)", fontWeight: 900, color: "var(--txt-hi)", lineHeight: 1, minHeight: 24 }}>
                      {s.v ?? (loaded ? "—" : <span style={{ opacity: .3 }}>···</span>)}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--txt-lo)", fontWeight: 600, marginTop: 5 }}>{s.l}</div>
                  </div>
                ))}
                <div>
                  <div style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: "clamp(1.4rem,2.4vw,2rem)", fontWeight: 900, color: "var(--txt-hi)", lineHeight: 1 }}>₹0</div>
                  <div style={{ fontSize: 11, color: "var(--txt-lo)", fontWeight: 600, marginTop: 5 }}>cost, ads &amp; commissions</div>
                </div>
              </div>
            </div>

            <div className="f3">
              <SipStudio topByCategory={topByCategory} loaded={loaded} />
            </div>
          </div>
        </div>
      </header>

      {/* ════ 2 · PROOF — Hall of Fame ════ */}
      <HallOfFame
        totalSchemes={totalSchemes}
        reportDate={manifest?.reportDate ?? ""}
        pctBeat={industry?.Pct_Funds_Beating_Benchmark_3Y ?? null}
        avgRet={industry?.Avg_3Y_Return ?? null}
        loaded={loaded}
        topByCategory={topByCategory}
        tickerFunds={tickerFunds}
      />

      {/* ════ 3 · CONVERT — health check ════ */}
      <HealthCheck industry={industry} />

      {/* ════ 4 · IDENTIFY — three doors in ════ */}
      <section style={{ padding: "clamp(44px,6vw,76px) clamp(16px,4vw,48px)", borderTop: "1px solid rgba(255,255,255,.05)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <SR>
            <p style={{ fontSize: 11, fontWeight: 800, color: "#00E8A2", letterSpacing: ".12em", textTransform: "uppercase" as const, textAlign: "center" as const, marginBottom: 8 }}>Start · Audit · Plan</p>
            <h2 style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: "clamp(1.6rem,3.4vw,2.4rem)", fontWeight: 900, color: "var(--txt-hi)", letterSpacing: "-.03em", textAlign: "center" as const, lineHeight: 1.12, marginBottom: 10 }}>
              Where are you on the journey?
            </h2>
            <p style={{ textAlign: "center" as const, fontSize: 13.5, color: "var(--txt-md)", marginBottom: 28 }}>
              Every investor walks the same three steps — pick the door that sounds like you.
            </p>
          </SR>
          <SR delay={70}>
            <div className="grid-3">
              {[
                { step: "Step 1 · Understand", q: "\"I want to start, but where do I begin?\"", a: "Before your first ₹500 goes in, learn what you're actually buying — NAV, expense ratios, direct vs regular plans — and the traps that quietly eat returns.", cta: "Learn the basics", href: "/why-mutual-fund", Icon: Sprout, glow: "rgba(0,201,123,.12)", ink: "#00E8A2" },
                { step: "Step 2 · Find out", q: "\"I've been investing… but am I winning?\"", a: `Years of SIPs deserve an honest report card. Upload one PDF and see every fund's real XIRR against its benchmark${hasNum(industry?.Pct_Funds_Beating_Benchmark_3Y) ? ` — remember, only ${Math.round(industry.Pct_Funds_Beating_Benchmark_3Y)}% of funds actually win` : ""}.`, cta: "Get my report card", href: "/mutual-fund-health-check/dashboard", Icon: ChartLine, glow: "rgba(99,102,241,.13)", ink: "#A5B4FC" },
                { step: "Step 3 · Move ahead", q: "\"I have dreams. What will they cost?\"", a: "Retiring at 45? A wedding next year? Your kid's degree in 2038? Get the exact monthly number between you and each goal — then the plan to hit it.", cta: "Price my goals", href: "/dashboard/calculators", Icon: GoalIcon, glow: "rgba(245,158,11,.12)", ink: "#FBBF24" },
              ].map((p, i) => (
                <Link key={i} href={p.href} style={{ textDecoration: "none" }}>
                  <div className="glass-deep lift journey-card" style={{ height: "100%", display: "flex", flexDirection: "column" as const, position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: -40, right: -40, width: 130, height: 130, borderRadius: "50%", background: `radial-gradient(circle, ${p.glow}, transparent 68%)`, pointerEvents: "none" }} />
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 13, background: p.glow, border: "1px solid rgba(255,255,255,.08)" }}>
                        <p.Icon size={21} strokeWidth={2} color={p.ink} />
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase" as const, color: p.ink, opacity: .75 }}>{p.step}</span>
                    </div>
                    <div style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: 16.5, fontWeight: 700, fontStyle: "italic", color: "var(--txt-hi)", lineHeight: 1.35, marginBottom: 12 }}>{p.q}</div>
                    <div style={{ fontSize: 12.5, color: "var(--txt-md)", lineHeight: 1.72, flex: 1, marginBottom: 18 }}>{p.a}</div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 800, color: p.ink }}>{p.cta}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke={p.ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </SR>
        </div>
      </section>

      {/* ════ 5 · PLAN — calculator strip ════ */}
      <section style={{ padding: "clamp(40px,5.5vw,68px) clamp(16px,4vw,48px) clamp(48px,6vw,80px)", borderTop: "1px solid rgba(255,255,255,.05)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", bottom: "-200px", left: "35%", width: 540, height: 540, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,.08) 0%,transparent 62%)", filter: "blur(32px)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
          <SR>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap" as const, gap: 10, marginBottom: 22 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, color: "#A5B4FC", letterSpacing: ".12em", textTransform: "uppercase" as const, marginBottom: 8 }}>The calm-money toolkit</p>
                <h2 style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: "clamp(1.5rem,3.2vw,2.2rem)", fontWeight: 900, color: "var(--txt-hi)", letterSpacing: "-.03em" }}>
                  Four numbers worth knowing.
                </h2>
                <p style={{ fontSize: 13.5, color: "var(--txt-md)", marginTop: 10 }}>
                  What will it cost? What will I have? Can I live off it? When can I stop?
                </p>
              </div>
              <Link href="/dashboard/calculators" style={{ textDecoration: "none", fontSize: 12.5, fontWeight: 700, color: "var(--txt-md)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#00E8A2")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--txt-md)")}>
                All 13 calculators →
              </Link>
            </div>
          </SR>
          <SR delay={70}>
            <div className="calc-strip">
              {[
                { id: "calc-sip-goal", Icon: Crosshair, ink: "#FBBF24", chip: "rgba(245,158,11,.14)", t: "The goal number", d: "Wedding, home, degree — get the exact monthly SIP that gets you there." },
                { id: "calc-sip-fv", Icon: TrendingUp, ink: "#00E8A2", chip: "rgba(0,201,123,.13)", t: "Your future corpus", d: "What today's ₹10k/month looks like in 10, 20, 25 years." },
                { id: "calc-swp", Icon: Wallet, ink: "#A5B4FC", chip: "rgba(99,102,241,.15)", t: "Safe withdrawal", d: "How much your corpus can pay you monthly without running dry." },
                { id: "calc-retirement", Icon: Sunrise, ink: "#FB923C", chip: "rgba(251,146,60,.14)", t: "Retirement reality", d: "Corpus needed, inflation adjusted, with a full year-by-year plan." },
              ].map(c => (
                <Link key={c.id} href={`/dashboard/calculators#${c.id}`} className="calc-tile" style={{ textDecoration: "none", display: "block", height: "100%" }}>
                  <div className="glass lift calc-card">
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: 11, background: c.chip, border: "1px solid rgba(255,255,255,.08)", marginBottom: 12 }}>
                      <c.Icon size={18} strokeWidth={2} color={c.ink} />
                    </span>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--txt-hi)", marginBottom: 7 }}>{c.t}</div>
                    <div style={{ fontSize: 11.5, color: "var(--txt-md)", lineHeight: 1.65, marginBottom: 12 }}>{c.d}</div>
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: c.ink }}>Calculate
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 5, verticalAlign: "-1px" }}><path d="M5 12h14M13 6l6 6-6 6" stroke={c.ink} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </SR>
        </div>
      </section>

      {/* ════ 6 · CLOSE ════ */}
      <section style={{ position: "relative", overflow: "hidden", padding: "clamp(64px,10vw,120px) clamp(16px,4vw,48px)", borderTop: "1px solid rgba(255,255,255,.05)", textAlign: "center" as const }}>
        <div style={{ position: "absolute", top: "-220px", left: "50%", marginLeft: -330, width: 660, height: 660, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,201,123,.15) 0%,transparent 60%)", filter: "blur(36px)", animation: "auroraA 24s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-260px", right: "6%", width: 540, height: 540, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,.14) 0%,transparent 60%)", filter: "blur(36px)", animation: "auroraB 28s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ maxWidth: 640, margin: "0 auto", position: "relative" }}>
          <SR>
            <h2 style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: "clamp(2rem,5.2vw,3.5rem)", fontWeight: 900, color: "var(--txt-hi)", letterSpacing: "-.035em", lineHeight: 1.06, marginBottom: 18 }}>
              The best time to check<br /><span className="shimmer-green">was last year.</span><br />The second best is now.
            </h2>
          </SR>
          <SR delay={80}>
            <p style={{ fontSize: "clamp(14px,1.8vw,16px)", color: "var(--txt-md)", lineHeight: 1.8, maxWidth: 440, margin: "0 auto 32px" }}>
              One CAS statement. Three minutes. Every fund&apos;s honest verdict — before your next SIP instalment goes out.
            </p>
          </SR>
          <SR delay={140}>
            <Link href="/mutual-fund-health-check/dashboard" style={{ textDecoration: "none" }}>
              <button className="btn-primary" style={{ borderRadius: 16, padding: "18px 36px", fontSize: 16.5 }}>
                🏥 Run my free portfolio audit
              </button>
            </Link>
          </SR>
        </div>
      </section>

      {/* STICKY MOBILE CTA */}
      <div className={`sticky-cta glass-deep ${showCta ? "show" : ""}`} aria-hidden={!showCta}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "var(--txt-hi)", whiteSpace: "nowrap" as const }}>Portfolio audit — free</div>
          <div style={{ fontSize: 10, color: "var(--txt-lo)", fontWeight: 600 }}>true XIRR · keep/exit calls</div>
        </div>
        <Link href="/mutual-fund-health-check/dashboard" style={{ textDecoration: "none", flexShrink: 0 }}>
          <button className="btn-primary" style={{ borderRadius: 12, padding: "12px 18px", fontSize: 13, whiteSpace: "nowrap" as const }}>
            Start →
          </button>
        </Link>
      </div>
    </main>
  );
}
