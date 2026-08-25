"use client";

import Link from "next/link";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { fetchCachedJson } from "@/lib/client-data";

/* ─────────────────────────────────────────────────────────────────────────
   DESIGN SYSTEM — Liquid Glass Editorial
   Deep navy ink (#0A0E1C), cream body (#FAF9F6), electric mint (#00C97B),
   indigo accent (#6366F1). Fraunces (display) + DM Sans (body).
   Every number on this page is computed from the live R2 datasets
   (manifest + fund-analytics + industry-insights). No mock data.
────────────────────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,700;0,9..144,900;1,9..144,300;1,9..144,700&family=DM+Sans:wght@400;500;600;700;800&display=swap');

  :root {
    --ink:    #0A0E1C;
    --ink2:   #131B31;
    --cream:  #FAF9F6;
    --mist:   #F1EFE9;
    --border: #E4E0D8;
    --green:  #00C97B;
    --indigo: #6366F1;
    --blue:   #2563EB;
    --amber:  #F59E0B;
    --red:    #EF4444;
    --slate:  #64748B;
    --light:  #94A3B8;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--cream); }

  @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes shimmer { 0% { background-position:-300% center; } 100% { background-position:300% center; } }
  @keyframes shimmerBg { 0% { background-position:-400px 0; } 100% { background-position:400px 0; } }
  @keyframes pulse { 0%,100% { box-shadow:0 0 0 0 rgba(0,201,123,.4); } 50% { box-shadow:0 0 0 7px rgba(0,201,123,0); } }
  @keyframes ticker { 0% { transform:translateX(0); } 100% { transform:translateX(-50%); } }
  @keyframes floatY { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-8px); } }
  @keyframes auroraA {
    0%,100% { transform: translate(0,0) scale(1); }
    33%     { transform: translate(60px,-40px) scale(1.12); }
    66%     { transform: translate(-40px,30px) scale(.94); }
  }
  @keyframes auroraB {
    0%,100% { transform: translate(0,0) scale(1); }
    50%     { transform: translate(-70px,-50px) scale(1.18); }
  }
  @keyframes auroraC {
    0%,100% { transform: translate(0,0) scale(1); opacity:.85; }
    50%     { transform: translate(50px,45px) scale(1.08); opacity:1; }
  }
  @keyframes glowRing {
    0%,100% { filter: drop-shadow(0 0 6px rgba(0,201,123,.35)); }
    50%     { filter: drop-shadow(0 0 14px rgba(0,201,123,.6)); }
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
  .float    { animation: floatY 6s ease-in-out infinite; }

  .ticker-track { display:flex; animation: ticker 42s linear infinite; width: max-content; }
  .ticker-track:hover { animation-play-state: paused; }

  .sr { opacity:0; transform:translateY(24px); transition: opacity .7s cubic-bezier(.22,.61,.36,1), transform .7s cubic-bezier(.22,.61,.36,1); }
  .sr.in { opacity:1; transform:translateY(0); }

  .glass {
    background: linear-gradient(150deg, rgba(255,255,255,.10) 0%, rgba(255,255,255,.035) 55%, rgba(255,255,255,.06) 100%);
    border: 1px solid rgba(255,255,255,.13);
    -webkit-backdrop-filter: blur(20px) saturate(150%);
    backdrop-filter: blur(20px) saturate(150%);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.16), 0 24px 64px rgba(0,0,0,.35);
  }
  .glass-soft {
    background: linear-gradient(150deg, rgba(255,255,255,.07), rgba(255,255,255,.02));
    border: 1px solid rgba(255,255,255,.10);
    -webkit-backdrop-filter: blur(14px);
    backdrop-filter: blur(14px);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.10);
  }
  .glass-light {
    background: linear-gradient(150deg, rgba(255,255,255,.92), rgba(255,255,255,.62));
    border: 1px solid rgba(10,14,28,.07);
    -webkit-backdrop-filter: blur(16px);
    backdrop-filter: blur(16px);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.9), 0 18px 44px rgba(10,14,28,.08);
  }

  .card-hover { transition: transform .25s cubic-bezier(.22,.61,.36,1), box-shadow .25s ease, border-color .25s ease; }
  .card-hover:hover { transform: translateY(-5px); box-shadow: 0 24px 56px rgba(0,0,0,.14) !important; }
  .card-hover-dark:hover { border-color: rgba(0,201,123,.32) !important; }

  .tilt { transition: transform .18s ease; will-change: transform; }

  .btn-green { transition: transform .16s, box-shadow .16s; }
  .btn-green:hover { transform: translateY(-2px); box-shadow: 0 12px 36px rgba(0,201,123,.5) !important; }
  .btn-green:active { transform: translateY(0) scale(.98); }

  .btn-indigo { transition: transform .16s, box-shadow .16s; }
  .btn-indigo:hover { transform: translateY(-2px); box-shadow: 0 12px 36px rgba(99,102,241,.45) !important; }
  .btn-indigo:active { transform: translateY(0) scale(.98); }

  .btn-ghost { transition: transform .16s, background .16s; }
  .btn-ghost:hover { transform: translateY(-2px); background: rgba(255,255,255,.13) !important; }

  input[type="range"] {
    -webkit-appearance: none; appearance: none;
    width: 100%; height: 6px; border-radius: 100px;
    background: linear-gradient(90deg, var(--green) var(--fill,50%), rgba(255,255,255,.14) var(--fill,50%));
    outline: none; cursor: pointer;
  }
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none; appearance: none;
    width: 24px; height: 24px; border-radius: 50%;
    background: #fff; border: 3.5px solid var(--green);
    box-shadow: 0 2px 14px rgba(0,201,123,.55);
    cursor: grab; transition: transform .15s ease;
  }
  input[type="range"]::-webkit-slider-thumb:hover { transform: scale(1.15); }
  input[type="range"]::-webkit-slider-thumb:active { cursor: grabbing; transform: scale(1.05); }
  input[type="range"]::-moz-range-thumb {
    width: 22px; height: 22px; border-radius: 50%;
    background: #fff; border: 3.5px solid var(--green);
    box-shadow: 0 2px 14px rgba(0,201,123,.55); cursor: grab;
  }

  .skel {
    background: linear-gradient(90deg, rgba(148,163,184,.12) 25%, rgba(148,163,184,.26) 50%, rgba(148,163,184,.12) 75%);
    background-size: 800px 100%;
    animation: shimmerBg 1.4s linear infinite;
    border-radius: 8px;
  }

  .grid-3 { display:grid; grid-template-columns:1fr; gap:12px; }
  @media(min-width:640px){ .grid-3 { grid-template-columns:repeat(3,1fr); } }

  .grid-4 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  @media(min-width:720px){ .grid-4 { grid-template-columns:repeat(4,1fr); } }

  .duo { display:grid; grid-template-columns:1fr; gap:40px; align-items:center; }
  @media(min-width:780px){ .duo { grid-template-columns:1fr 1fr; gap:64px; } }
  .duo.flip > :first-child { order:2; }
  .duo.flip > :last-child  { order:1; }
  @media(max-width:779px){
    .duo.flip > :first-child { order:1; }
    .duo.flip > :last-child  { order:2; }
  }

  .hero-cols { display:grid; grid-template-columns:1fr; gap:52px; align-items:center; }
  @media(min-width:960px){ .hero-cols { grid-template-columns:1.02fr 0.98fr; gap:56px; } }

  .calc-duo { display:grid; grid-template-columns:1fr; gap:20px; }
  @media(min-width:640px){ .calc-duo { grid-template-columns:1.15fr .85fr; gap:20px; align-items:start; } }

  .hof-tabs { display:flex; gap:8px; overflow-x:auto; scrollbar-width:none; -ms-overflow-style:none;
    padding-bottom:6px; scroll-snap-type:x proximity; -webkit-overflow-scrolling:touch; }
  .hof-tabs::-webkit-scrollbar { display:none; }
  .hof-tab { flex-shrink:0; scroll-snap-align:start; white-space:nowrap; cursor:pointer;
    transition: all .2s ease; user-select:none; -webkit-user-select:none; touch-action: manipulation; }
  .hof-cards { display:grid; grid-template-columns:1fr; gap:14px; }
  @media(min-width:780px){ .hof-cards { grid-template-columns:repeat(3,1fr); } }

  .sticky-cta {
    position: fixed; left:12px; right:12px; bottom:12px; z-index:60;
    display:flex; align-items:center; justify-content:space-between; gap:10px;
    border-radius:18px; padding:11px 12px 11px 17px;
    transform: translateY(120%); transition: transform .38s cubic-bezier(.22,.61,.36,1);
  }
  .sticky-cta.show { transform: translateY(0); }
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
    }, { threshold: 0.07 });
    ob.observe(el);
    return () => ob.disconnect();
  }, [delay]);
  return ref;
}
function SR({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  return <div ref={useReveal(delay)} className="sr" style={style}>{children}</div>;
}

function useTilt() {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = useCallback((e: React.MouseEvent) => {
    if (!window.matchMedia("(pointer:fine)").matches) return;
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${(-py * 5).toFixed(2)}deg) rotateY(${(px * 5).toFixed(2)}deg) translateY(-3px)`;
  }, []);
  const onLeave = useCallback(() => {
    const el = ref.current; if (el) el.style.transform = "";
  }, []);
  return { ref, onMouseMove: onMove, onMouseLeave: onLeave };
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
  return <span ref={ref}>{Math.round(v).toLocaleString("en-IN")}{suffix}</span>;
}

const num = (v: number | null | undefined, d = 0): number => typeof v === "number" && Number.isFinite(v) ? v : d;
const hasNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const fmtL = (n: number) => n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : `₹${(n / 1e5).toFixed(1)} L`;
const fmtAUMcr = (cr: number) => cr >= 100000 ? `${(cr / 100000).toFixed(1)}L Cr` : cr >= 1000 ? `${(cr / 1000).toFixed(1)}k Cr` : `${Math.round(cr)} Cr`;
const shortName = (n: string) => n.replace(/ Fund$/, "").replace(/ Fund /g, " ");

function Skel({ h = 60, style = {} }: { h?: number; style?: React.CSSProperties }) {
  return <div className="skel" style={{ height: h, ...style }} />;
}

/* ══════════════════════════════════════════════════════════════════════════
   LIVE DATA — single source of truth. Every section renders from this.
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
    .slice(0, 12)
    .map(f => ({ name: shortName(f.Fund_Name), alpha: f.Alpha_3Y as number }));

  const industry = state.insights?.find(r => r.Level === "Industry") ?? null;
  const category = (name: string) => state.insights?.find(r => r.Level === "Category" && r.Category_Name === name) ?? null;

  return { funds: validFunds, manifest: state.manifest, insights: state.insights, industry, category, topByCategory, tickerFunds, loaded: state.loaded };
}

/* ══════════════════════════════════════════════════════════════════════════
   SPARKLINE
══════════════════════════════════════════════════════════════════════════ */
function Spark({ pts, color, w = 46, h = 18 }: { pts: number[]; color: string; w?: number; h?: number }) {
  const mn = Math.min(...pts), rng = Math.max(...pts) - mn || 1;
  const xs = pts.map((_, i) => (i / (pts.length - 1)) * w);
  const ys = pts.map(v => h - ((v - mn) / rng) * (h - 4) - 2);
  const d = xs.map((x, i) => `${i ? "L" : "M"}${x},${ys[i]}`).join(" ");
  const id = `sp${color.replace(/\W/g, "")}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible", flexShrink: 0 }} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L${w},${h} L0,${h}Z`} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r="3" fill={color} />
    </svg>
  );
}

/* deterministic trend shape derived from a fund's own returns (visual only) */
function trendFor(ret3y: number | null, ret1y: number | null): { pts: number[]; color: string } {
  const base = [30, 34, 33, 38, 42, 41, 46, 50, 49, 55];
  const drift = ((num(ret3y) - num(ret1y)) / Math.max(Math.abs(num(ret3y)), 6)) * 8;
  const pts = base.map((v, i) => v + drift * (i / base.length));
  const up = num(ret3y) >= 0;
  const shifted = pts.map(v => up ? v : 100 - v + 20);
  return { pts: shifted, color: up ? "#00C97B" : "#EF4444" };
}

/* ══════════════════════════════════════════════════════════════════════════
   SIP STUDIO — showstopper #1. Sliders drive projection AND live fund picks.
══════════════════════════════════════════════════════════════════════════ */
const sipFV = (monthly: number, annualPct: number, years: number) => {
  const r = annualPct / 1200, n = Math.round(years * 12);
  return monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
};

const HORIZON_BUCKETS = [
  { maxYears: 3, cats: ["Conservative Hybrid", "Balanced Advantage", "Arbitrage"], label: "Stability first", why: "Under 3 years? Debt & hybrid funds keep short-term goals safe from equity swings.", icon: "🛡️" },
  { maxYears: 7, cats: ["Aggressive Hybrid", "Large Cap", "Flexi Cap"], label: "Balanced growth", why: "3–7 years is the sweet spot for hybrid and large cap funds to compound steadily.", icon: "⚖️" },
  { maxYears: 999, cats: ["Flexi Cap", "Mid Cap", "Small Cap"], label: "Wealth compounding", why: "7+ years lets equity ride out volatility — mid & small caps shine over long horizons.", icon: "🚀" },
];

function SipStudio({ topByCategory, loaded }: { topByCategory: (s: string) => LiveFund[]; loaded: boolean }) {
  const [amt, setAmt] = useState(10000);
  const [yrs, setYrs] = useState(10);

  const bucket = HORIZON_BUCKETS.find(b => yrs <= b.maxYears) ?? HORIZON_BUCKETS[HORIZON_BUCKETS.length - 1];
  const suggestions = bucket.cats.flatMap(c => topByCategory(c)).sort((a, b) => num(b.Composite_Score) - num(a.Composite_Score)).slice(0, 3);

  const invested = amt * yrs * 12;
  const mfV = sipFV(amt, 12, yrs);
  const fdV = sipFV(amt, 7, yrs);
  const maxV = Math.max(mfV, invested) * 1.05;

  const W = 360, H = 150, PAD = 10;
  const mkSeries = (endV: number, rate: number) => Array.from({ length: yrs + 1 }, (_, i) => i === yrs ? endV : sipFV(amt, rate, i));
  const mfPts = mkSeries(mfV, 12), fdPts = mkSeries(fdV, 7);
  const pathOf = (pts: number[]) => pts.map((v, i) =>
    `${i ? "L" : "M"}${(PAD + (i / Math.max(pts.length - 1, 1)) * (W - PAD * 2)).toFixed(1)},${(H - 20 - (v / maxV) * (H - 46)).toFixed(1)}`
  ).join(" ");

  const setFill = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = e.target, min = parseFloat(t.min), max = parseFloat(t.max);
    t.style.setProperty("--fill", `${(((parseFloat(t.value) - min) / (max - min)) * 100).toFixed(1)}%`);
  };

  return (
    <div className="glass" style={{ borderRadius: 26, padding: "clamp(18px,3vw,26px)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 10 }}>
        <div>
          <div style={{ fontSize: 9.5, fontWeight: 800, color: "rgba(255,255,255,.45)", letterSpacing: ".12em", textTransform: "uppercase" as const, marginBottom: 5 }}>Live playground — drag the sliders</div>
          <div style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: 21, fontWeight: 900, color: "white" }}>Plan it. See it. Fund it.</div>
        </div>
        <div style={{ width: 34, height: 34, borderRadius: 12, background: "rgba(0,201,123,.16)", border: "1px solid rgba(0,201,123,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>🎛️</div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,.55)" }}>Monthly SIP</span>
          <span style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: 17, fontWeight: 900, color: "#00C97B" }}>₹{amt.toLocaleString("en-IN")}</span>
        </div>
        <input type="range" min="1000" max="100000" step="1000" value={amt} aria-label="Monthly SIP amount"
          onChange={e => { setAmt(+e.target.value); setFill(e); }} style={{ ["--fill" as string]: `${((amt - 1000) / 99000 * 100)}%` }} />
      </div>

      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,.55)" }}>Time horizon</span>
          <span style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: 17, fontWeight: 900, color: "white" }}>{yrs} yr{yrs !== 1 ? "s" : ""}</span>
        </div>
        <input type="range" min="1" max="25" step="1" value={yrs} aria-label="Investment years"
          onChange={e => { setYrs(+e.target.value); setFill(e); }} style={{ ["--fill" as string]: `${((yrs - 1) / 24 * 100)}%` }} />
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block", marginBottom: 12 }} role="img" aria-label={`Projected growth of ₹${amt} monthly SIP over ${yrs} years versus a fixed deposit`}>
        <defs>
          <linearGradient id="stMf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00C97B" stopOpacity=".30" />
            <stop offset="100%" stopColor="#00C97B" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="stFd" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#94A3B8" stopOpacity=".14" />
            <stop offset="100%" stopColor="#94A3B8" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[.3, .58, .86].map((p, i) => <line key={i} x1={PAD} y1={H * p} x2={W - PAD} y2={H * p} stroke="rgba(255,255,255,.06)" strokeWidth="1" />)}
        <path d={`${pathOf(fdPts)} L${W - PAD},${H - 20} L${PAD},${H - 20}Z`} fill="url(#stFd)" />
        <path d={pathOf(fdPts)} fill="none" stroke="rgba(148,163,184,.65)" strokeWidth="1.6" strokeDasharray="5 4" strokeLinecap="round" />
        <path d={`${pathOf(mfPts)} L${W - PAD},${H - 20} L${PAD},${H - 20}Z`} fill="url(#stMf)" />
        <path d={pathOf(mfPts)} fill="none" stroke="#00C97B" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 2px 8px rgba(0,201,123,.45))" }} />
        <text x={PAD} y={H - 6} fontSize="8.5" fill="rgba(255,255,255,.30)" fontFamily="DM Sans,system-ui">Today</text>
        <text x={W - PAD} y={H - 6} fontSize="8.5" fill="rgba(255,255,255,.30)" fontFamily="DM Sans,system-ui" textAnchor="end">{yrs}Y</text>
      </svg>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 7, marginBottom: 10 }}>
        {[
          ["You invest", fmtL(invested), "rgba(255,255,255,.06)", "white"],
          ["MF @ 12% p.a.", fmtL(mfV), "rgba(0,201,123,.13)", "#00E8A2"],
          ["FD @ 7% p.a.", fmtL(fdV), "rgba(148,163,184,.10)", "rgba(255,255,255,.55)"],
        ].map(([l, v, bg, c], i) => (
          <div key={i} style={{ borderRadius: 12, padding: "9px 11px", background: bg as string, border: "1px solid rgba(255,255,255,.08)" }}>
            <div style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: ".07em", color: "rgba(255,255,255,.40)", textTransform: "uppercase" as const, marginBottom: 3 }}>{l}</div>
            <div style={{ fontSize: 14.5, fontWeight: 900, color: c as string, fontFamily: "Fraunces,Georgia,serif" }}>{v}</div>
          </div>
        ))}
      </div>
      <p style={{ marginBottom: 16, fontSize: 9.5, color: "rgba(255,255,255,.28)", fontStyle: "italic", textAlign: "center" as const }}>Illustrative projections at assumed returns · not guaranteed</p>

      {/* Live fund suggestions driven by the horizon slider */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,.09)", paddingTop: 15 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 14 }}>{bucket.icon}</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#00C97B", letterSpacing: ".09em", textTransform: "uppercase" as const }}>{bucket.label}</span>
        </div>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,.44)", lineHeight: 1.6, marginBottom: 11 }}>{bucket.why}</p>
        {!loaded && <Skel h={54} />}
        {loaded && suggestions.map(f => (
          <div key={f.Fund_Name} className="glass-soft card-hover-dark" style={{ borderRadius: 13, padding: "9px 12px", marginBottom: 7, display: "flex", alignItems: "center", gap: 10, transition: "all .25s ease" }}>
            <Spark pts={trendFor(f.Fund_Return_3Y, null).pts} color={num(f.Alpha_3Y) >= 0 ? "#00C97B" : "#EF4444"} w={36} h={16} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,.88)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{shortName(f.Fund_Name)}</div>
              <div style={{ fontSize: 9.5, fontWeight: 600, color: "rgba(255,255,255,.38)" }}>{f.Sub_Category}</div>
            </div>
            <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: "#00C97B" }}>{num(f.Fund_Return_3Y).toFixed(1)}%</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,.35)" }}>3Y CAGR</div>
            </div>
          </div>
        ))}
        {loaded && suggestions.length === 0 && (
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", padding: "8px 2px" }}>Live rankings refreshing…</div>
        )}
        <Link href="/mutual-fund-match" style={{ textDecoration: "none", display: "block", marginTop: 4 }}>
          <button className="btn-indigo" style={{ width: "100%", background: "linear-gradient(120deg,#6366F1,#4F46E5)", color: "white", border: "none", borderRadius: 12, padding: "11px 16px", fontSize: 13, fontWeight: 800, cursor: "pointer", boxShadow: "0 6px 22px rgba(99,102,241,.35)" }}>
            Match funds to my exact profile →
          </button>
        </Link>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   CAS SHOWCASE — showstopper #2, built entirely from live insights + funds.
   The ring shows the real share of India's funds beating their benchmark;
   the rows are today's actual top funds with verdicts derived from alpha.
══════════════════════════════════════════════════════════════════════════ */
function verdictFor(alpha: number): { tag: string; tc: string; tb: string; tbd: string } {
  if (alpha >= 1.5) return { tag: "HOLD", tc: "#00A862", tb: "rgba(0,201,123,.13)", tbd: "rgba(0,201,123,.32)" };
  if (alpha >= 0) return { tag: "REVIEW", tc: "#D97706", tb: "rgba(245,158,11,.13)", tbd: "rgba(245,158,11,.32)" };
  return { tag: "EXIT", tc: "#DC2626", tb: "rgba(239,68,68,.13)", tbd: "rgba(239,68,68,.32)" };
}

function CasShowcase({ industry, topByCategory }: { industry: InsightRow | null; topByCategory: (s: string) => LiveFund[] }) {
  const [go, setGo] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setGo(true); ob.disconnect(); } }, { threshold: .15 });
    if (ref.current) ob.observe(ref.current);
    return () => ob.disconnect();
  }, []);

  const pctBeat = num(industry?.Pct_Funds_Beating_Benchmark_3Y);
  const rows = [
    topByCategory("Flexi Cap")[0],
    topByCategory("Large Cap")[0],
    topByCategory("Mid Cap")[0],
    (topByCategory("Small Cap").slice().reverse().find(f => num(f.Alpha_3Y) < 0)) ?? topByCategory("Small Cap")[0],
  ].filter((f): f is LiveFund => !!f);

  const R = 52, CIRC = 2 * Math.PI * R;

  return (
    <div ref={ref} className="glass" style={{ borderRadius: 26, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,.45)" }}>
      <div style={{ height: 3, background: "linear-gradient(90deg,#00C97B,#6366F1,#00C97B)" }} />
      <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid rgba(255,255,255,.08)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" as const }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: 10, background: "rgba(0,201,123,.15)", border: "1px solid rgba(0,201,123,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✓</div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: "white" }}>What your CAS reveals</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,.40)", fontWeight: 600 }}>The signal behind every fund you own</div>
          </div>
        </div>
        <span style={{ fontSize: 9.5, fontWeight: 800, color: "#00C97B", background: "rgba(0,201,123,.12)", border: "1px solid rgba(0,201,123,.28)", borderRadius: 100, padding: "4px 11px", letterSpacing: ".06em" }}>LIVE MARKET SNAPSHOT</span>
      </div>

      <div style={{ padding: "18px 20px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 18, flexWrap: "wrap" as const }}>
          <div className="float" style={{ position: "relative", width: 128, height: 128 }}>
            <svg width={128} height={128} viewBox="0 0 128 128">
              <circle cx="64" cy="64" r={R} fill="none" stroke="rgba(255,255,255,.09)" strokeWidth={11} />
              <circle cx="64" cy="64" r={R} fill="none" stroke="#00C97B" strokeWidth={11} strokeLinecap="round"
                strokeDasharray={`${(pctBeat / 100) * CIRC} ${CIRC}`} style={{ transformOrigin: "64px 64px", transform: "rotate(-90deg)", filter: "drop-shadow(0 0 8px rgba(0,201,123,.5))" }} />
              <text x="64" y="62" textAnchor="middle" fontSize="26" fontWeight="900" fill="white" fontFamily="Fraunces,Georgia,serif">{pctBeat.toFixed(0)}%</text>
              <text x="64" y="80" textAnchor="middle" fontSize="8" fill="rgba(255,255,255,.42)" fontFamily="DM Sans,system-ui" letterSpacing=".06em">OF FUNDS BEAT</text>
              <text x="64" y="91" textAnchor="middle" fontSize="8" fill="rgba(255,255,255,.42)" fontFamily="DM Sans,system-ui" letterSpacing=".06em">BENCHMARK (3Y)</text>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 170, display: "grid", gap: 8 }}>
            {[
              ["Avg fund 3Y return", `${num(industry?.Avg_3Y_Return).toFixed(1)}%`],
              ["Avg benchmark 3Y", `${num(industry?.Avg_Benchmark_Return_3Y).toFixed(1)}%`],
              ["Funds analysed", num(industry?.Number_of_Schemes).toLocaleString("en-IN")],
            ].map(([l, v], i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,.045)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 12, padding: "8px 12px" }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.52)" }}>{l}</span>
                <span style={{ fontSize: 13.5, fontWeight: 900, color: "white" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 9.5, fontWeight: 800, color: "rgba(255,255,255,.32)", letterSpacing: ".1em", textTransform: "uppercase" as const, marginBottom: 8 }}>Today&apos;s verdicts — real funds, real alpha</div>
        {!loadedPlaceholder(rows.length)}
        {rows.map((f, i) => {
          const v = verdictFor(num(f.Alpha_3Y));
          const t = trendFor(f.Fund_Return_3Y, null);
          return (
            <div key={f.Fund_Name} style={{
              display: "grid", gridTemplateColumns: "minmax(0,1fr) 46px 44px 56px", gap: 8, alignItems: "center", padding: "9px 0",
              borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,.05)" : "none",
              opacity: go ? 1 : 0, transform: go ? "translateX(0)" : "translateX(-14px)",
              transition: `opacity .5s ease ${120 + i * 130}ms, transform .5s ease ${120 + i * 130}ms`,
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,.86)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{shortName(f.Fund_Name)}</div>
                <div style={{ fontSize: 9.5, fontWeight: 600, color: num(f.Alpha_3Y) >= 0 ? "#00C97B" : "#EF4444", marginTop: 2 }}>{num(f.Fund_Return_3Y).toFixed(1)}% · {num(f.Alpha_3Y) >= 0 ? "+" : ""}{num(f.Alpha_3Y).toFixed(1)}% vs benchmark</div>
              </div>
              <Spark pts={t.pts} color={t.color} w={42} h={17} />
              <div style={{ fontSize: 11.5, fontWeight: 800, color: num(f.Alpha_3Y) >= 0 ? "#00C97B" : "#EF4444" }}>{num(f.Fund_Return_3Y).toFixed(1)}%</div>
              <div style={{ fontSize: 9, fontWeight: 800, padding: "4px 6px", borderRadius: 100, background: v.tb, border: `1px solid ${v.tbd}`, color: v.tc, textAlign: "center" as const }}>{v.tag}</div>
            </div>
          );
        })}

        <div style={{ marginTop: 14, display: "flex", gap: 7, flexWrap: "wrap" as const, alignItems: "center" }}>
          <span style={{ fontSize: 9.5, fontWeight: 700, color: "rgba(255,255,255,.42)" }}>Your portfolio gets this treatment — per fund you own.</span>
          <span style={{ fontSize: 9.5 }}>🎯</span>
        </div>
      </div>
    </div>
  );
}

function loadedPlaceholder(count: number): React.ReactNode {
  return count === 0 ? <Skel h={140} /> : null;
}

/* ══════════════════════════════════════════════════════════════════════════
   HALL OF FAME — showstopper #3. Live top-3 per category by composite score.
══════════════════════════════════════════════════════════════════════════ */
const HOF_CATS = [
  { key: "Flexi Cap", icon: "🌀" },
  { key: "Large Cap", icon: "🏛️" },
  { key: "Mid Cap", icon: "🚀" },
  { key: "Small Cap", icon: "💎" },
  { key: "ELSS", icon: "🛡️" },
  { key: "Aggressive Hybrid", icon: "⚖️" },
];
const MEDALS = ["🥇", "🥈", "🥉"];

function HallOfFame({ totalSchemes, reportDate, loaded, topByCategory }: { totalSchemes: number; reportDate: string; loaded: boolean; topByCategory: (s: string) => LiveFund[] }) {
  const [tab, setTab] = useState(HOF_CATS[0].key);
  const tilt = useTilt();
  const funds = loaded ? topByCategory(tab) : [];

  return (
    <section style={{ background: "var(--cream)", padding: "clamp(52px,8vw,96px) clamp(16px,4vw,48px)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SR>
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 12, alignItems: "flex-end", justifyContent: "space-between", marginBottom: 22 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, color: "var(--indigo)", letterSpacing: ".12em", textTransform: "uppercase" as const, marginBottom: 8 }}>🏆 Hall of Fame — live rankings</p>
              <h2 style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: "clamp(1.6rem,3.4vw,2.4rem)", fontWeight: 900, color: "var(--ink)", letterSpacing: "-.03em", lineHeight: 1.1 }}>
                The top funds in India, right now.
              </h2>
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(0,201,123,.09)", border: "1px solid rgba(0,201,123,.25)", borderRadius: 100, padding: "5px 13px" }}>
              <span className={`live-dot ${loaded ? "" : ""}`} style={{ width: 6, height: 6, background: loaded ? "#00A862" : "#94A3B8", borderRadius: "50%" }} />
              <span style={{ fontSize: 10.5, fontWeight: 700, color: loaded ? "#00A862" : "#94A3B8" }}>
                {loaded ? `Live · ${totalSchemes.toLocaleString("en-IN")} schemes scored · ${reportDate}` : "Connecting to live data…"}
              </span>
            </div>
          </div>
        </SR>

        <SR delay={60}>
          <div className="hof-tabs" role="tablist" aria-label="Fund categories">
            {HOF_CATS.map(c => (
              <button key={c.key} role="tab" aria-selected={tab === c.key} onClick={() => setTab(c.key)}
                style={{
                  background: tab === c.key ? "var(--ink)" : "white",
                  color: tab === c.key ? "white" : "var(--slate)",
                  border: `1.5px solid ${tab === c.key ? "var(--ink)" : "var(--border)"}`,
                  borderRadius: 100, padding: "8px 16px", fontSize: 12, fontWeight: 800,
                  boxShadow: tab === c.key ? "0 6px 18px rgba(10,14,28,.25)" : "none",
                }}>
                {c.icon} {c.key}
              </button>
            ))}
          </div>
        </SR>

        {!loaded && (
          <div className="hof-cards" style={{ marginTop: 16 }}>
            {[0, 1, 2].map(i => <Skel key={i} h={150} />)}
          </div>
        )}

        {loaded && funds.length > 0 && (
          <SR delay={110}>
            <div className="hof-cards" style={{ marginTop: 16 }}>
              {funds.map((f, i) => (
                <div key={f.Fund_Name}
                  ref={i === 0 ? tilt.ref : undefined}
                  onMouseMove={i === 0 ? tilt.onMouseMove : undefined} onMouseLeave={i === 0 ? tilt.onMouseLeave : undefined}
                  className={`glass-light card-hover ${i === 0 ? "tilt" : ""}`}
                  style={{
                    borderRadius: 22, padding: "20px 20px 18px", position: "relative", overflow: "hidden",
                    borderTop: i === 0 ? "3px solid #00C97B" : i === 1 ? "3px solid #6366F1" : "3px solid #94A3B8",
                  }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 13 }}>
                    <div style={{ minWidth: 0, paddingRight: 8 }}>
                      <div style={{ fontSize: 20, marginBottom: 6, lineHeight: 1 }}>{MEDALS[i]}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)", lineHeight: 1.3 }}>{shortName(f.Fund_Name)}</div>
                    </div>
                    <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                      <div style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: 23, fontWeight: 900, color: "var(--ink)", lineHeight: 1 }}>{num(f.Fund_Return_3Y).toFixed(1)}%</div>
                      <div style={{ fontSize: 9.5, fontWeight: 700, color: "var(--slate)", marginTop: 3 }}>3Y CAGR</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap" as const }}>
                    <span style={{
                      fontSize: 10.5, fontWeight: 800, borderRadius: 100, padding: "4px 10px",
                      color: num(f.Alpha_3Y) >= 0 ? "#00A862" : "#DC2626",
                      background: num(f.Alpha_3Y) >= 0 ? "rgba(0,201,123,.10)" : "rgba(239,68,68,.09)",
                      border: `1px solid ${num(f.Alpha_3Y) >= 0 ? "rgba(0,201,123,.28)" : "rgba(239,68,68,.28)"}`,
                    }}>
                      {num(f.Alpha_3Y) >= 0 ? "+" : ""}{num(f.Alpha_3Y).toFixed(1)}% alpha
                    </span>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--slate)", background: "rgba(10,14,28,.045)", border: "1px solid rgba(10,14,28,.08)", borderRadius: 100, padding: "4px 10px" }}>
                      AUM {fmtAUMcr(num(f.Current_AUM))}
                    </span>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: "#4F46E5", background: "rgba(99,102,241,.09)", border: "1px solid rgba(99,102,241,.26)", borderRadius: 100, padding: "4px 10px" }}>
                      beats {num(f.Percentile_in_SubCategory).toFixed(0)}% peers
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </SR>
        )}

        <SR delay={160}>
          <div style={{ textAlign: "center" as const, marginTop: 26 }}>
            <Link href="/mutual-fund-match" style={{ textDecoration: "none" }}>
              <button className="btn-indigo" style={{ background: "linear-gradient(120deg,#6366F1,#4F46E5)", color: "white", border: "none", borderRadius: 13, padding: "13px 26px", fontSize: 14, fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 8px 28px rgba(99,102,241,.35)" }}>
                🔬 Find funds matched to me — free
              </button>
            </Link>
          </div>
        </SR>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   PAGE
   Narrative order: HOOK (hero + live SIP studio) → PROOF (ticker, CAS
   showcase, Hall of Fame) → NAVIGATE (who are you) → PLAN (calculators)
   → LEARN (guide + explorers) → ACT (final CTA).
══════════════════════════════════════════════════════════════════════════ */
export default function Home() {
  const { manifest, industry, topByCategory, tickerFunds, loaded } = useLiveData();

  const totalSchemes = manifest?.counts.raw ?? 0;
  const reportDate = manifest?.reportDate ?? "";

  const [showCta, setShowCta] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const pastHero = window.scrollY > 650;
      const nearBottom = window.innerHeight + window.scrollY > document.documentElement.scrollHeight - 500;
      setShowCta(pastHero && !nearBottom);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const heroTilt = useTilt();
  const casTilt = useTilt();

  return (
    <main style={{ background: "var(--cream)", minHeight: "100vh", fontFamily: "'DM Sans',system-ui,sans-serif", color: "var(--ink)" }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ════════ 1 · HERO + LIVE SIP STUDIO (showstopper) ════════ */}
      <section style={{ background: "var(--ink)", position: "relative", overflow: "hidden", padding: "clamp(52px,9vw,108px) clamp(16px,4vw,48px) clamp(60px,10vw,120px)" }}>
        <div style={{ position: "absolute", top: "-220px", left: "-140px", width: 720, height: 720, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,201,123,.16) 0%,transparent 62%)", filter: "blur(30px)", animation: "auroraA 26s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-240px", right: "-160px", width: 820, height: 820, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,.14) 0%,transparent 60%)", filter: "blur(36px)", animation: "auroraB 32s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "30%", left: "42%", width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle,rgba(37,99,235,.10) 0%,transparent 60%)", filter: "blur(40px)", animation: "auroraC 24s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
          <div className="hero-cols">
            <div>
              <div className="f1" style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "rgba(0,201,123,.10)", border: "1px solid rgba(0,201,123,.28)", borderRadius: 100, padding: "5px 15px", marginBottom: 26, backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
                <span className="live-dot" style={{ width: 7, height: 7, background: "#00C97B", borderRadius: "50%", flexShrink: 0, display: "block" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#00C97B", letterSpacing: ".08em", textTransform: "uppercase" as const }}>
                  {loaded ? `${totalSchemes.toLocaleString("en-IN")} funds tracked · updated ${reportDate} · Free forever` : "Connecting to live data…"}
                </span>
              </div>

              <h1 className="f2" style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: "clamp(2.5rem,6.5vw,4.8rem)", fontWeight: 900, color: "white", lineHeight: 1.03, letterSpacing: "-.04em", marginBottom: 20 }}>
                Your money,<br />finally making<br /><span className="shimmer-green">sense.</span>
              </h1>

              <p className="f3" style={{ fontSize: "clamp(15px,1.9vw,17px)", color: "rgba(255,255,255,.58)", lineHeight: 1.82, maxWidth: 460, marginBottom: 32 }}>
                A free toolkit for salaried Indians with SIPs, FDs &amp; PF — track every rupee, audit your funds against all {totalSchemes ? totalSchemes.toLocaleString("en-IN") : ""} live-scored funds in India, and plan your goals. No jargon. No ads. No commission.
              </p>

              <div className="f4" style={{ marginBottom: 36, display: "flex", flexWrap: "wrap" as const, gap: 12, alignItems: "center" }}>
                <Link href="/mutual-fund-health-check/dashboard" style={{ textDecoration: "none" }}>
                  <button className="btn-green" style={{ background: "linear-gradient(120deg,#00C97B,#00E8A2)", color: "#06130D", border: "none", borderRadius: 14, padding: "15px 28px", fontSize: 15.5, fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 9, boxShadow: "0 8px 30px rgba(0,201,123,.4)" }}>
                    🏥 Check My Portfolio — Free
                  </button>
                </Link>
                <Link href="/dashboard" style={{ textDecoration: "none" }}>
                  <button className="btn-ghost" style={{ background: "rgba(255,255,255,.07)", color: "white", border: "1px solid rgba(255,255,255,.16)", borderRadius: 14, padding: "15px 24px", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
                    See My Net Worth →
                  </button>
                </Link>
              </div>

              <div className="f5" style={{ display: "flex", gap: 28, flexWrap: "wrap" as const, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,.08)" }}>
                {[
                  { n: totalSchemes, suffix: "", label: "Live-scored funds", ready: loaded },
                  { n: 0, suffix: "", label: "Ads ever", ready: true },
                  { n: 100, suffix: "%", label: "India-specific", ready: true },
                ].map((s, i) => (
                  <div key={i}>
                    <div style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: "clamp(1.5rem,2.5vw,2.1rem)", fontWeight: 900, color: "white", lineHeight: 1 }}>
                      {s.ready && s.n > 0 ? <Counter to={s.n} suffix={s.suffix} /> : s.ready ? <>0</> : <span style={{ opacity: .35 }}>—</span>}
                    </div>
                    <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.38)", fontWeight: 600, marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="f3" ref={heroTilt.ref}>
              <div onMouseMove={heroTilt.onMouseMove} onMouseLeave={heroTilt.onMouseLeave} className="tilt">
                <SipStudio topByCategory={topByCategory} loaded={loaded} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ 2 · LIVE TICKER ════════ */}
      <div style={{ overflow: "hidden", background: "var(--ink2)", borderBottom: "1px solid rgba(255,255,255,.06)", padding: "11px 0", position: "relative" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 60, background: "linear-gradient(90deg,var(--ink2),transparent)", zIndex: 2, pointerEvents: "none" }} />
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 60, background: "linear-gradient(-90deg,var(--ink2),transparent)", zIndex: 2, pointerEvents: "none" }} />
        {!loaded || tickerFunds.length === 0 ? (
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}><Skel h={16} /></div>
        ) : (
          <div className="ticker-track">
            {[...tickerFunds, ...tickerFunds].map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 20px", whiteSpace: "nowrap" as const, borderRight: "1px solid rgba(255,255,255,.06)", height: 24 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,.72)" }}>{f.name}</span>
                <span style={{ fontSize: 10.5, fontWeight: 800, color: f.alpha >= 0 ? "#00C97B" : "#EF4444", background: f.alpha >= 0 ? "rgba(0,201,123,.10)" : "rgba(239,68,68,.10)", border: `1px solid ${f.alpha >= 0 ? "rgba(0,201,123,.25)" : "rgba(239,68,68,.25)"}`, borderRadius: 100, padding: "1.5px 8px" }}>
                  {f.alpha >= 0 ? "+" : ""}{f.alpha.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ════════ 3 · CAS HEALTH CHECK SHOWCASE (showstopper) ════════ */}
      <section style={{ background: "var(--ink)", padding: "clamp(52px,8vw,96px) clamp(16px,4vw,48px)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -120, right: -100, width: 620, height: 620, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,201,123,.10) 0%,transparent 62%)", filter: "blur(30px)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
          <SR>
            <div className="duo flip">
              <div ref={casTilt.ref} onMouseMove={casTilt.onMouseMove} onMouseLeave={casTilt.onMouseLeave}>
                <div className="tilt"><CasShowcase industry={industry} topByCategory={topByCategory} /></div>
              </div>

              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(0,201,123,.11)", border: "1px solid rgba(0,201,123,.26)", borderRadius: 100, padding: "4px 13px", marginBottom: 16 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: "#00C97B", letterSpacing: ".08em", textTransform: "uppercase" as const }}>Fund Health Check</span>
                </div>
                <h2 style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: "clamp(1.7rem,4vw,3rem)", fontWeight: 700, fontStyle: "italic", color: "white", lineHeight: 1.1, letterSpacing: "-.03em", margin: "0 0 18px" }}>
                  Your fund says 18%.<br />Does yours?
                </h2>
                <p style={{ fontSize: "clamp(14px,1.6vw,15.5px)", color: "rgba(255,255,255,.54)", lineHeight: 1.85, maxWidth: 440, margin: "0 0 12px" }}>
                  A fund&apos;s published returns are not yours. Your real XIRR depends on when you invested, how much, and at what NAV — and it&apos;s often very different.
                </p>
                <p style={{ fontSize: "clamp(14px,1.6vw,15.5px)", color: "rgba(255,255,255,.88)", fontWeight: 700, lineHeight: 1.75, maxWidth: 440, margin: "0 0 28px" }}>
                  Upload your CAS from CAMS or KFintech. Get your true XIRR, a benchmark comparison, and a clear Hold / Review / Exit signal for every fund you own. In 3 minutes.
                </p>
                <Link href="/mutual-fund-health-check/dashboard" style={{ textDecoration: "none" }}>
                  <button className="btn-green" style={{ background: "linear-gradient(120deg,#00C97B,#00E8A2)", color: "#06130D", border: "none", borderRadius: 13, padding: "13px 24px", fontSize: 14, fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 8px 28px rgba(0,201,123,.38)" }}>
                    🏥 Check My Portfolio — Upload CAS
                  </button>
                </Link>
              </div>
            </div>
          </SR>
        </div>
      </section>

      {/* ════════ 4 · HALL OF FAME (showstopper) ════════ */}
      <HallOfFame totalSchemes={totalSchemes} reportDate={reportDate} loaded={loaded} topByCategory={topByCategory} />

      {/* ════════ 5 · WHO ARE YOU? (navigate) ════════ */}
      <section style={{ background: "var(--mist)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "clamp(36px,5vw,56px) clamp(16px,4vw,48px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <SR>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--slate)", letterSpacing: ".10em", textTransform: "uppercase" as const, textAlign: "center" as const, marginBottom: 18 }}>
              Pick what describes you — we&apos;ll show you where to start.
            </p>
          </SR>
          <SR delay={60}>
            <div className="grid-3">
              {[
                { icon: "🌱", label: "I'm new to investing", desc: "Why mutual funds beat FDs long-term, and how to start your first SIP the right way.", cta: "Learn the basics", href: "/why-mutual-fund", color: "#00A862" },
                { icon: "📊", label: "I already have SIPs", desc: "True XIRR, benchmark comparison, and a keep-or-exit signal for every fund you own.", cta: "Analyse my portfolio", href: "/mutual-fund-health-check/dashboard", color: "#4F46E5" },
                { icon: "🔥", label: "I'm planning my future", desc: "Retirement corpus, child's education, FIRE date — real projections with real numbers.", cta: "Open calculators", href: "/dashboard/calculators", color: "#D97706" },
              ].map((p, i) => (
                <Link key={i} href={p.href} style={{ textDecoration: "none" }}>
                  <div className="path-card card-hover" style={{ background: "white", border: "1.5px solid var(--border)", borderRadius: 18, padding: "22px 20px", height: "100%", display: "flex", flexDirection: "column" as const }}>
                    <div style={{ fontSize: 28, marginBottom: 12 }}>{p.icon}</div>
                    <div style={{ fontSize: 14.5, fontWeight: 800, color: "var(--ink)", marginBottom: 8, lineHeight: 1.3 }}>{p.label}</div>
                    <div style={{ fontSize: 12.5, color: "var(--slate)", lineHeight: 1.7, marginBottom: 18, flex: 1 }}>{p.desc}</div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 800, color: p.color }}>{p.cta} →</div>
                  </div>
                </Link>
              ))}
            </div>
          </SR>
        </div>
      </section>

      {/* ════════ 6 · CALCULATOR HUB (plan — curated, below the showstoppers) ════════ */}
      <section style={{ background: "white", padding: "clamp(44px,6vw,72px) clamp(16px,4vw,48px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <SR>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--light)", letterSpacing: ".10em", textTransform: "uppercase" as const, marginBottom: 8 }}>Plan with numbers</p>
            <h2 style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: "clamp(1.5rem,3vw,2.2rem)", fontWeight: 900, color: "var(--ink)", letterSpacing: "-.03em", lineHeight: 1.1, marginBottom: 22 }}>
              The four calculators that matter most.
            </h2>
          </SR>
          <div className="grid-4">
            {[
              { id: "calc-sip-goal", icon: "🎯", title: "Goal → Monthly SIP", desc: "Tell us the goal & deadline; get the exact monthly investment needed." },
              { id: "calc-sip-fv", icon: "📈", title: "SIP Future Value", desc: "Already investing? See what your monthly SIP grows into, year by year." },
              { id: "calc-swp", icon: "💸", title: "Monthly Withdrawals", desc: "How much can your corpus safely pay you every month via SWP?" },
              { id: "calc-retirement", icon: "🏖️", title: "Full Retirement Plan", desc: "Corpus, inflation, withdrawals — the complete retirement readiness check." },
            ].map((c, i) => (
              <SR key={c.id} delay={i * 70}>
                <Link href={`/dashboard/calculators#${c.id}`} style={{ textDecoration: "none", display: "block", height: "100%" }}>
                  <div className="card-hover" style={{ background: "var(--cream)", border: "1.5px solid var(--border)", borderRadius: 18, padding: "18px 17px", height: "100%", display: "flex", flexDirection: "column" as const }}>
                    <div style={{ fontSize: 22, marginBottom: 9 }}>{c.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)", lineHeight: 1.3, marginBottom: 7, flex: 1 }}>{c.title}</div>
                    <div style={{ fontSize: 11.5, color: "var(--slate)", lineHeight: 1.65, marginBottom: 13 }}>{c.desc}</div>
                    <div style={{ fontSize: 11.5, fontWeight: 800, color: "var(--indigo)" }}>Try it →</div>
                  </div>
                </Link>
              </SR>
            ))}
          </div>
          <SR delay={280}>
            <div style={{ textAlign: "center" as const, marginTop: 18 }}>
              <Link href="/dashboard/calculators" style={{ fontSize: 12.5, fontWeight: 700, color: "var(--slate)", textDecoration: "underline", textUnderlineOffset: 3 }}>
                Or explore all 13 calculators →
              </Link>
            </div>
          </SR>
        </div>
      </section>

      {/* ════════ 7 · LIVE MARKET PULSE (computed from insights) ════════ */}
      <section style={{ background: "var(--ink)", padding: "clamp(36px,5vw,56px) clamp(16px,4vw,48px)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", bottom: -180, left: "30%", width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,.09) 0%,transparent 62%)", filter: "blur(30px)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
          <SR>
            <div className="grid-4" style={{ gap: 1, background: "rgba(255,255,255,.07)", borderRadius: 16, overflow: "hidden" }}>
              {[
                { v: loaded && industry?.Number_of_Schemes ? <Counter to={industry.Number_of_Schemes} duration={1500} /> : null, l: "Schemes scored every refresh", c: "#00C97B" },
                { v: loaded && hasNum(industry?.Pct_Funds_Beating_Benchmark_3Y) ? <><Counter to={Math.round(num(industry.Pct_Funds_Beating_Benchmark_3Y))} suffix="%" duration={1500} /></> : null, l: "Funds actually beat benchmark (3Y)", c: "#F59E0B" },
                { v: loaded && hasNum(industry?.Avg_3Y_Return) ? <>{num(industry.Avg_3Y_Return).toFixed(1)}%</> : null, l: "Avg fund return, 3Y CAGR", c: "#6366F1" },
                { v: loaded && hasNum(industry?.Total_AUM) ? <>₹{fmtAUMcr(industry.Total_AUM as number)}</> : null, l: "Investor money analysed", c: "#2563EB" },
              ].map((s, i) => (
                <div key={i} style={{ background: "var(--ink2)", padding: "clamp(16px,2.5vw,26px) clamp(14px,2vw,20px)" }}>
                  <div style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: "clamp(1.55rem,3vw,2.35rem)", fontWeight: 900, color: s.c, lineHeight: 1.05, marginBottom: 6, minHeight: "1.2em" }}>
                    {s.v ?? (loaded ? "—" : <Skel h={26} />)}
                  </div>
                  <div style={{ fontSize: "clamp(10.5px,1.2vw,12px)", fontWeight: 700, color: "rgba(255,255,255,.62)" }}>{s.l}</div>
                </div>
              ))}
            </div>
          </SR>
        </div>
      </section>

      {/* ════════ 8 · LEARN & EXPLORE ════════ */}
      <section style={{ background: "white", padding: "clamp(44px,6vw,72px) clamp(16px,4vw,48px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <SR>
            <Link href="/why-mutual-fund" style={{ textDecoration: "none", display: "block", marginBottom: 16 }}>
              <div className="card-hover" style={{ background: "linear-gradient(120deg,#0A0E1C 0%,#141B3D 55%,#05271C 100%)", borderRadius: 22, padding: "clamp(24px,3.5vw,40px) clamp(20px,3.5vw,40px)", position: "relative", overflow: "hidden", boxShadow: "0 6px 28px rgba(0,0,0,.14)" }}>
                <div style={{ position: "absolute", top: -60, right: -60, width: 360, height: 360, background: "radial-gradient(circle,rgba(0,201,123,.13) 0%,transparent 68%)", pointerEvents: "none" }} />
                <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 18, flexWrap: "wrap" as const }}>
                  <div style={{ maxWidth: 520 }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(0,201,123,.12)", border: "1px solid rgba(0,201,123,.25)", borderRadius: 100, padding: "4px 13px", marginBottom: 12 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: "#00C97B", letterSpacing: ".08em", textTransform: "uppercase" as const }}>📖 New to investing?</span>
                    </div>
                    <h3 style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: "clamp(1.25rem,2.6vw,1.9rem)", fontWeight: 900, color: "white", lineHeight: 1.15, letterSpacing: "-.03em", margin: "0 0 8px" }}>
                      The Complete Guide to Mutual Funds
                    </h3>
                    <p style={{ fontSize: "clamp(12px,1.5vw,13.5px)", color: "rgba(255,255,255,.5)", lineHeight: 1.7, margin: 0 }}>
                      NAV, SIP vs lumpsum, real costs — plain English, free forever.
                    </p>
                  </div>
                  <span style={{ fontSize: 26, color: "#00C97B", flexShrink: 0 }}>→</span>
                </div>
              </div>
            </Link>
          </SR>
          <div className="grid-3">
            {[
              { href: "/active-funds", icon: "⚡", label: "Active Funds Explorer", desc: "Screened by alpha, consistency & composite score." },
              { href: "/index-funds", icon: "📈", label: "Index Funds Explorer", desc: `Trackers compared by tracking difference & cost.` },
              { href: "/mutual-fund-analysis", icon: "🗺️", label: "MF Universe Analysis", desc: "Every category mapped: AUM, returns, alpha leaders." },
            ].map((c, i) => (
              <SR key={c.href} delay={i * 70}>
                <Link href={c.href} style={{ textDecoration: "none", display: "block", height: "100%" }}>
                  <div className="card-hover" style={{ background: "var(--cream)", border: "1.5px solid var(--border)", borderRadius: 18, padding: "clamp(18px,2.5vw,24px)", height: "100%", display: "flex", flexDirection: "column" as const }}>
                    <div style={{ fontSize: 24, marginBottom: 10 }}>{c.icon}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)", marginBottom: 7, lineHeight: 1.25 }}>{c.label}</div>
                    <div style={{ fontSize: 12, color: "var(--slate)", lineHeight: 1.65, flex: 1, marginBottom: 13 }}>{c.desc}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--indigo)" }}>Explore →</div>
                  </div>
                </Link>
              </SR>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ 9 · FINAL CTA ════════ */}
      <section style={{ background: "var(--ink)", padding: "clamp(60px,9vw,110px) clamp(16px,4vw,48px)", position: "relative", overflow: "hidden", textAlign: "center" as const }}>
        <div style={{ position: "absolute", top: "-200px", left: "50%", marginLeft: -320, width: 640, height: 640, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,201,123,.14) 0%,transparent 60%)", filter: "blur(34px)", animation: "auroraC 22s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-260px", right: "8%", width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,.13) 0%,transparent 60%)", filter: "blur(34px)", animation: "auroraB 30s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ maxWidth: 680, margin: "0 auto", position: "relative" }}>
          <SR>
            <h2 style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: "clamp(1.9rem,5vw,3.4rem)", fontWeight: 900, color: "white", letterSpacing: "-.035em", lineHeight: 1.08, marginBottom: 16 }}>
              Three minutes.<br /><span className="shimmer-green">Total clarity.</span>
            </h2>
          </SR>
          <SR delay={70}>
            <p style={{ fontSize: "clamp(14px,1.8vw,16px)", color: "rgba(255,255,255,.55)", lineHeight: 1.8, maxWidth: 460, margin: "0 auto 30px" }}>
              Your CAS already knows the truth about your portfolio. Upload it and see every fund&apos;s real performance — free, private, no signup walls.
            </p>
          </SR>
          <SR delay={130}>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" as const }}>
              <Link href="/mutual-fund-health-check/dashboard" style={{ textDecoration: "none" }}>
                <button className="btn-green" style={{ background: "linear-gradient(120deg,#00C97B,#00E8A2)", color: "#06130D", border: "none", borderRadius: 15, padding: "16px 32px", fontSize: 16, fontWeight: 800, cursor: "pointer", boxShadow: "0 10px 36px rgba(0,201,123,.42)" }}>
                  🏥 Start My Free Health Check
                </button>
              </Link>
            </div>
            <p style={{ marginTop: 16, fontSize: 11.5, color: "rgba(255,255,255,.32)", fontWeight: 600 }}>
              Parsed in your browser · nothing stored without your consent
            </p>
          </SR>
        </div>
      </section>

      {/* STICKY MOBILE CTA */}
      <div className={`sticky-cta glass ${showCta ? "show" : ""}`} aria-hidden={!showCta}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "white", whiteSpace: "nowrap" as const }}>Free portfolio health check</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,.45)", fontWeight: 600 }}>True XIRR · 3 mins · no signup</div>
        </div>
        <Link href="/mutual-fund-health-check/dashboard" style={{ textDecoration: "none", flexShrink: 0 }}>
          <button className="btn-green" style={{ background: "linear-gradient(120deg,#00C97B,#00E8A2)", color: "#06130D", border: "none", borderRadius: 12, padding: "11px 18px", fontSize: 13, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" as const }}>
            Check Now →
          </button>
        </Link>
      </div>
    </main>
  );
}
