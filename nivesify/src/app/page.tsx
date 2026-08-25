"use client";

import Link from "next/link";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { fetchCachedJson } from "@/lib/client-data";

/* ─────────────────────────────────────────────────────────────────────────
   DESIGN SYSTEM — Liquid Glass Editorial
   Deep navy ink (#0A0E1C), cream body (#FAF9F6), electric mint (#00C97B),
   new indigo accent (#6366F1). Fraunces (display) + DM Sans (body).
   Glass surfaces: translucent fills + backdrop-blur + inner highlight.
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
    --green2: #00A862;
    --indigo: #6366F1;
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
    50%      { transform: translateY(-8px); }
  }
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
  @keyframes drawLine { to { stroke-dashoffset: 0; } }
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

  /* ── LIQUID GLASS ── */
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

  .path-card { transition: transform .2s, border-color .2s, background .2s; cursor: pointer; }
  .path-card:hover { transform: translateY(-5px); }

  /* ── RANGE SLIDERS ── */
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
    box-shadow: 0 2px 14px rgba(0,201,123,.55), inset 0 0 0 2px rgba(255,255,255,.9);
    cursor: grab; transition: transform .15s ease;
  }
  input[type="range"]::-webkit-slider-thumb:hover { transform: scale(1.15); }
  input[type="range"]::-webkit-slider-thumb:active { cursor: grabbing; transform: scale(1.05); }
  input[type="range"]::-moz-range-thumb {
    width: 22px; height: 22px; border-radius: 50%;
    background: #fff; border: 3.5px solid var(--green);
    box-shadow: 0 2px 14px rgba(0,201,123,.55); cursor: grab;
  }

  /* ── LAYOUT GRIDS ── */
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

  .hero-cols { display:grid; grid-template-columns:1fr; gap:52px; align-items:center; }
  @media(min-width:960px){ .hero-cols { grid-template-columns:1.05fr 0.95fr; gap:64px; } }

  .stats-grid { display:grid; grid-template-columns:1fr 1fr; gap:1px; background:var(--border); }
  @media(min-width:600px){ .stats-grid { grid-template-columns:repeat(4,1fr); } }

  .combined-duo { display:grid; grid-template-columns:1fr; gap:24px; }
  @media(min-width:860px){ .combined-duo { grid-template-columns:1fr 1fr; gap:24px; } }

  /* ── HALL OF FAME TABS (mobile: horizontal snap scroll) ── */
  .hof-tabs { display:flex; gap:8px; overflow-x:auto; scrollbar-width:none; -ms-overflow-style:none;
    padding-bottom:6px; scroll-snap-type:x proximity; -webkit-overflow-scrolling:touch; }
  .hof-tabs::-webkit-scrollbar { display:none; }
  .hof-tab { flex-shrink:0; scroll-snap-align:start; white-space:nowrap; cursor:pointer;
    transition: all .2s ease; user-select:none; -webkit-user-select:none; touch-action: manipulation; }
  .hof-cards { display:grid; grid-template-columns:1fr; gap:14px; }
  @media(min-width:780px){ .hof-cards { grid-template-columns:repeat(3,1fr); } }

  /* ── STICKY MOBILE CTA ── */
  .sticky-cta {
    position: fixed; left:12px; right:12px; bottom:12px; z-index:60;
    display:flex; align-items:center; justify-content:space-between; gap:10px;
    border-radius:18px; padding:11px 12px 11px 17px;
    transform: translateY(120%); transition: transform .38s cubic-bezier(.22,.61,.36,1);
  }
  .sticky-cta.show { transform: translateY(0); }
  @media(min-width:720px){ .sticky-cta { display:none; } }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
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
  return <span ref={ref}>{v.toLocaleString("en-IN")}{suffix}</span>;
}

const fmtL = (n: number) => n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : `₹${(n / 1e5).toFixed(1)} L`;
const fmtAUM = (cr: number) => cr >= 100000 ? `₹${(cr / 100000).toFixed(1)}L Cr` : `₹${Math.round(cr).toLocaleString("en-IN")} Cr`;
const shortName = (n: string) => n.replace(/ Fund$/, "").replace(/ Fund /g, " ");
const num = (v: number | null | undefined, d = 0): number => typeof v === "number" && Number.isFinite(v) ? v : d;
const hasNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

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

/* ══════════════════════════════════════════════════════════════════════════
   LIVE DATA HOOK — real R2 datasets, graceful fallback to curated snapshots
══════════════════════════════════════════════════════════════════════════ */
const FALLBACK_MANIFEST: Manifest = { dateTag: "2026-02-05", reportDate: "05-Feb-2026", counts: { raw: 2006, funds: 1353, etfs: 653 } };

const FALLBACK_FUNDS: Record<string, LiveFund[]> = {
  "Flexi Cap": [
    { Fund_Name: "HDFC Flexi Cap Fund", Category: "Equity", Sub_Category: "Flexi Cap", Fund_Return_3Y: 22.7, Alpha_3Y: 5.5, Current_AUM: 98852, Percentile_in_SubCategory: 100, Composite_Score: .99 },
    { Fund_Name: "Bank of India Flexi Cap Fund", Category: "Equity", Sub_Category: "Flexi Cap", Fund_Return_3Y: 23.3, Alpha_3Y: 6.5, Current_AUM: 2188, Percentile_in_SubCategory: 98, Composite_Score: .96 },
    { Fund_Name: "Edelweiss Flexi Cap Fund", Category: "Equity", Sub_Category: "Flexi Cap", Fund_Return_3Y: 20.9, Alpha_3Y: 3.8, Current_AUM: 3162, Percentile_in_SubCategory: 95, Composite_Score: .93 },
  ],
  "Large Cap": [
    { Fund_Name: "Nippon India Large Cap Fund", Category: "Equity", Sub_Category: "Large Cap", Fund_Return_3Y: 19.9, Alpha_3Y: 4.4, Current_AUM: 50970, Percentile_in_SubCategory: 100, Composite_Score: .99 },
    { Fund_Name: "ICICI Prudential Large Cap Fund", Category: "Equity", Sub_Category: "Large Cap", Fund_Return_3Y: 18.7, Alpha_3Y: 3.5, Current_AUM: 78149, Percentile_in_SubCategory: 97, Composite_Score: .96 },
    { Fund_Name: "Invesco India Largecap Fund", Category: "Equity", Sub_Category: "Large Cap", Fund_Return_3Y: 19.4, Alpha_3Y: 4.1, Current_AUM: 1696, Percentile_in_SubCategory: 94, Composite_Score: .93 },
  ],
  "Mid Cap": [
    { Fund_Name: "Edelweiss Mid Cap Fund", Category: "Equity", Sub_Category: "Mid Cap", Fund_Return_3Y: 27.9, Alpha_3Y: 3.2, Current_AUM: 14053, Percentile_in_SubCategory: 100, Composite_Score: .99 },
    { Fund_Name: "Nippon India Growth Mid Cap Fund", Category: "Equity", Sub_Category: "Mid Cap", Fund_Return_3Y: 27.1, Alpha_3Y: 2.5, Current_AUM: 42950, Percentile_in_SubCategory: 97, Composite_Score: .96 },
    { Fund_Name: "Invesco India Mid Cap Fund", Category: "Equity", Sub_Category: "Mid Cap", Fund_Return_3Y: 28.0, Alpha_3Y: 4.5, Current_AUM: 10453, Percentile_in_SubCategory: 94, Composite_Score: .93 },
  ],
  "Small Cap": [
    { Fund_Name: "Bandhan Small Cap Fund", Category: "Equity", Sub_Category: "Small Cap", Fund_Return_3Y: 31.7, Alpha_3Y: 12.2, Current_AUM: 20046, Percentile_in_SubCategory: 100, Composite_Score: .99 },
    { Fund_Name: "Invesco India Smallcap Fund", Category: "Equity", Sub_Category: "Small Cap", Fund_Return_3Y: 25.3, Alpha_3Y: 5.7, Current_AUM: 9356, Percentile_in_SubCategory: 97, Composite_Score: .96 },
    { Fund_Name: "Quant Small Cap Fund", Category: "Equity", Sub_Category: "Small Cap", Fund_Return_3Y: 20.6, Alpha_3Y: -0.3, Current_AUM: 28325, Percentile_in_SubCategory: 94, Composite_Score: .93 },
  ],
  "ELSS": [
    { Fund_Name: "SBI ELSS Tax Saver Fund", Category: "Equity", Sub_Category: "ELSS", Fund_Return_3Y: 24.6, Alpha_3Y: 7.8, Current_AUM: 32240, Percentile_in_SubCategory: 100, Composite_Score: .99 },
    { Fund_Name: "HDFC ELSS Tax saver", Category: "Equity", Sub_Category: "ELSS", Fund_Return_3Y: 21.9, Alpha_3Y: 4.7, Current_AUM: 16939, Percentile_in_SubCategory: 98, Composite_Score: .96 },
    { Fund_Name: "DSP ELSS Tax Saver Fund", Category: "Equity", Sub_Category: "ELSS", Fund_Return_3Y: 21.3, Alpha_3Y: 4.1, Current_AUM: 17375, Percentile_in_SubCategory: 96, Composite_Score: .93 },
  ],
  "Aggressive Hybrid": [
    { Fund_Name: "Aditya Birla Sun Life Equity Hybrid 95 Fund", Category: "Hybrid", Sub_Category: "Aggressive Hybrid", Fund_Return_3Y: 15.5, Alpha_3Y: 2.0, Current_AUM: 7414, Percentile_in_SubCategory: 100, Composite_Score: .99 },
    { Fund_Name: "Axis Aggressive Hybrid Fund", Category: "Hybrid", Sub_Category: "Aggressive Hybrid", Fund_Return_3Y: 13.1, Alpha_3Y: -0.4, Current_AUM: 1520, Percentile_in_SubCategory: 97, Composite_Score: .96 },
    { Fund_Name: "Bandhan Aggressive Hybrid Fund", Category: "Hybrid", Sub_Category: "Aggressive Hybrid", Fund_Return_3Y: 17.7, Alpha_3Y: 4.2, Current_AUM: 1672, Percentile_in_SubCategory: 93, Composite_Score: .93 },
  ],
};

const TICKER_FALLBACK: { name: string; alpha: number }[] = [
  { name: "Nippon India Large Cap", alpha: 4.4 }, { name: "ICICI Pru Dividend Yield", alpha: 7.5 },
  { name: "HSBC Value Fund", alpha: 7.1 }, { name: "SBI ELSS Tax Saver", alpha: 7.8 },
  { name: "Bandhan Small Cap", alpha: 12.2 }, { name: "Bandhan Large & Mid Cap", alpha: 4.5 },
  { name: "HDFC Flexi Cap", alpha: 5.5 }, { name: "ICICI Pru Focused Equity", alpha: 7.6 },
  { name: "Edelweiss Mid Cap", alpha: 3.2 }, { name: "Bank of India Flexi Cap", alpha: 6.5 },
  { name: "Nippon India Value", alpha: 6.1 }, { name: "Nippon India Multicap", alpha: 3.4 },
];

function useLiveData() {
  const [state, setState] = useState<{ funds: LiveFund[] | null; manifest: Manifest | null; loaded: boolean }>({ funds: null, manifest: null, loaded: false });
  useEffect(() => {
    let alive = true;
    Promise.all([
      fetchCachedJson<LiveFund[]>("funds").catch(() => null),
      fetchCachedJson<Manifest>("manifest").catch(() => null),
    ]).then(([funds, manifest]) => {
      if (alive) setState({ funds, manifest, loaded: true });
    });
    return () => { alive = false; };
  }, []);

  const manifest = state.manifest ?? FALLBACK_MANIFEST;
  const topByCategory = (sub: string): LiveFund[] => {
    const live = state.funds
      ?.filter(f => f.Sub_Category === sub && hasNum(f.Fund_Return_3Y) && hasNum(f.Alpha_3Y) && hasNum(f.Percentile_in_SubCategory))
      .sort((a, b) => num(b.Composite_Score) - num(a.Composite_Score))
      .slice(0, 3);
    return live && live.length >= 3 ? live : FALLBACK_FUNDS[sub] ?? [];
  };
  const tickerFunds = (() => {
    const live = state.funds
      ? state.funds.filter((f): f is LiveFund & { Alpha_3Y: number } => hasNum(f.Alpha_3Y) && !!f.Fund_Name)
        .sort((a, b) => num(b.Composite_Score) - num(a.Composite_Score))
        .slice(0, 12)
        .map(f => ({ name: shortName(f.Fund_Name), alpha: f.Alpha_3Y }))
      : null;
    return live && live.length >= 8 ? live : TICKER_FALLBACK;
  })();

  return { manifest, topByCategory, tickerFunds, loaded: state.loaded };
}

/* ══════════════════════════════════════════════════════════════════════════
   INTERACTIVE SIP CALCULATOR — sliders drive a live MF-vs-FD projection
══════════════════════════════════════════════════════════════════════════ */
const sipFV = (monthly: number, annualPct: number, years: number) => {
  const r = annualPct / 1200, n = Math.round(years * 12);
  return monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
};

function SIPCalc() {
  const [amt, setAmt] = useState(10000);
  const [yrs, setYrs] = useState(10);

  const invested = amt * yrs * 12;
  const mfV = sipFV(amt, 12, yrs);
  const fdV = sipFV(amt, 7, yrs);
  const gain = mfV - fdV;
  const maxV = Math.max(mfV, invested) * 1.04;

  const W = 340, H = 148, PAD = 10;
  const ptAt = (v: number[], i: number) => {
    const x = PAD + (i / Math.max(v.length - 1, 1)) * (W - PAD * 2);
    const y = H - 20 - (v[i] / maxV) * (H - 46);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  };
  const series = (endV: number) => Array.from({ length: yrs + 1 }, (_, i) => i === yrs ? endV : sipFV(amt, 12, i));
  const mfPts = series(mfV), fdSeries = Array.from({ length: yrs + 1 }, (_, i) => i === yrs ? fdV : sipFV(amt, 7, i));
  const mfPath = mfPts.map((_, i) => `${i ? "L" : "M"}${ptAt(mfPts, i)}`).join(" ");
  const fdPath = fdSeries.map((_, i) => `${i ? "L" : "M"}${ptAt(fdSeries, i)}`).join(" ");

  const setFill = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = e.target, min = parseFloat(t.min), max = parseFloat(t.max);
    t.style.setProperty("--fill", `${(((parseFloat(t.value) - min) / (max - min)) * 100).toFixed(1)}%`);
  };

  return (
    <div className="glass" style={{ borderRadius: 26, padding: "clamp(18px,3vw,26px)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 9.5, fontWeight: 800, color: "rgba(255,255,255,.45)", letterSpacing: ".12em", textTransform: "uppercase" as const, marginBottom: 5 }}>Try it now — drag me</div>
          <div style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: 21, fontWeight: 900, color: "white" }}>What could your SIP become?</div>
        </div>
        <div style={{ width: 34, height: 34, borderRadius: 12, background: "rgba(0,201,123,.16)", border: "1px solid rgba(0,201,123,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>🎛️</div>
      </div>

      {/* Amount slider */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,.55)" }}>Monthly SIP</span>
          <span style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: 16, fontWeight: 900, color: "#00C97B" }}>₹{amt.toLocaleString("en-IN")}</span>
        </div>
        <input type="range" min="1000" max="100000" step="1000" value={amt} aria-label="Monthly SIP amount"
          onChange={e => { setAmt(+e.target.value); setFill(e); }} style={{ ["--fill" as string]: `${((amt - 1000) / 99000 * 100)}%` }} />
      </div>

      {/* Years slider */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,.55)" }}>Time horizon</span>
          <span style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: 16, fontWeight: 900, color: "white" }}>{yrs} yr{yrs !== 1 ? "s" : ""}</span>
        </div>
        <input type="range" min="1" max="25" step="1" value={yrs} aria-label="Investment years"
          onChange={e => { setYrs(+e.target.value); setFill(e); }} style={{ ["--fill" as string]: `${((yrs - 1) / 24 * 100)}%` }} />
      </div>

      {/* Projection chart */}
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block", marginBottom: 14 }} role="img" aria-label="Projected growth of SIP vs FD">
        <defs>
          <linearGradient id="calcMf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00C97B" stopOpacity=".30" />
            <stop offset="100%" stopColor="#00C97B" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="calcFd" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#94A3B8" stopOpacity=".14" />
            <stop offset="100%" stopColor="#94A3B8" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[.3, .58, .86].map((p, i) => <line key={i} x1={PAD} y1={H * p} x2={W - PAD} y2={H * p} stroke="rgba(255,255,255,.06)" strokeWidth="1" />)}
        <path d={`${fdPath} L${W - PAD},${H - 20} L${PAD},${H - 20}Z`} fill="url(#calcFd)" />
        <path d={fdPath} fill="none" stroke="rgba(148,163,184,.65)" strokeWidth="1.6" strokeDasharray="5 4" strokeLinecap="round" />
        <path d={`${mfPath} L${W - PAD},${H - 20} L${PAD},${H - 20}Z`} fill="url(#calcMf)" />
        <path d={mfPath} fill="none" stroke="#00C97B" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
          style={{ filter: "drop-shadow(0 2px 8px rgba(0,201,123,.45))" }} />
        <circle cx={ptAt(mfPts, yrs).split(",")[0]} cy={ptAt(mfPts, yrs).split(",")[1]} r="4.5" fill="#00C97B" style={{ animation: "glowRing 2.4s ease-in-out infinite" }} />
        <text x={PAD} y={H - 6} fontSize="8.5" fill="rgba(255,255,255,.30)" fontFamily="DM Sans,system-ui">Today</text>
        <text x={W - PAD} y={H - 6} fontSize="8.5" fill="rgba(255,255,255,.30)" fontFamily="DM Sans,system-ui" textAnchor="end">{yrs}Y</text>
      </svg>

      {/* Numbers */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
        <div className="glass-soft" style={{ borderRadius: 14, padding: "11px 13px" }}>
          <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: ".08em", color: "rgba(255,255,255,.42)", textTransform: "uppercase" as const, marginBottom: 4 }}>You invest</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "white", fontFamily: "Fraunces,Georgia,serif" }}>{fmtL(invested)}</div>
        </div>
        <div style={{ borderRadius: 14, padding: "11px 13px", background: "rgba(0,201,123,.13)", border: "1px solid rgba(0,201,123,.3)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.12)" }}>
          <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: ".08em", color: "rgba(0,232,162,.85)", textTransform: "uppercase" as const, marginBottom: 4 }}>MF @ 12% p.a.</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#00E8A2", fontFamily: "Fraunces,Georgia,serif" }}>{fmtL(mfV)}</div>
        </div>
      </div>

      {/* Advantage strip */}
      <div style={{ borderRadius: 13, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(99,102,241,.13)", border: "1px solid rgba(99,102,241,.32)", transition: "all .3s ease" }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,.62)" }}>vs FD @ 7% — that&apos;s</span>
        <span style={{ fontSize: 15, fontWeight: 900, color: "#A5B4FC" }}>{fmtL(gain)} more ✨</span>
      </div>
      <p style={{ marginTop: 10, fontSize: 9.5, color: "rgba(255,255,255,.28)", fontStyle: "italic", textAlign: "center" as const }}>Illustrative projections at assumed returns · not guaranteed</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   HALL OF FAME — live top-ranked funds per category from R2 dataset
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

function HallOfFame({ topByCategory, loaded, manifest }: { topByCategory: (s: string) => LiveFund[]; loaded: boolean; manifest: Manifest }) {
  const [tab, setTab] = useState(HOF_CATS[0].key);
  const tilt = useTilt();
  const funds = topByCategory(tab);

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
              <span className="live-dot" style={{ width: 6, height: 6, background: "#00A862", borderRadius: "50%" }} />
              <span style={{ fontSize: 10.5, fontWeight: 700, color: "#00A862" }}>
                {loaded ? `Live · ${manifest.counts.funds.toLocaleString("en-IN")} funds scored · ${manifest.reportDate}` : "Loading live data…"}
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

        <SR delay={110}>
          <div className="hof-cards" style={{ marginTop: 16 }}>
            {funds.map((f, i) => (
              <div key={f.Fund_Name} ref={i === 0 ? tilt.ref : undefined}
                onMouseMove={i === 0 ? tilt.onMouseMove : undefined} onMouseLeave={i === 0 ? tilt.onMouseLeave : undefined}
                className={`glass-light card-hover ${i === 0 ? "tilt" : ""}`}
                style={{
                  borderRadius: 22, padding: "20px 20px 18px", position: "relative", overflow: "hidden",
                  borderTop: i === 0 ? "3px solid #00C97B" : i === 1 ? "3px solid #6366F1" : "3px solid #94A3B8",
                }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 13 }}>
                  <div>
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
                    AUM {fmtAUM(num(f.Current_AUM))}
                  </span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: "#4F46E5", background: "rgba(99,102,241,.09)", border: "1px solid rgba(99,102,241,.26)", borderRadius: 100, padding: "4px 10px" }}>
                    beats {num(f.Percentile_in_SubCategory).toFixed(0)}% peers
                  </span>
                </div>
              </div>
            ))}
          </div>
        </SR>

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
   CAS SHOWCASE — glass report-card mock of the Health Check output
══════════════════════════════════════════════════════════════════════════ */
const CAS_FUNDS = [
  { name: "Parag Parikh Flexi Cap", xirr: 18.7, bench: 14.1, alpha: "+4.6%", tag: "HOLD", tc: "#00A862", tb: "rgba(0,201,123,.13)", tbd: "rgba(0,201,123,.32)", pts: [35, 40, 46, 50, 55, 60, 65, 70, 74, 80], c: "#00C97B" },
  { name: "Mirae Large Cap", xirr: 16.2, bench: 14.1, alpha: "+2.1%", tag: "HOLD", tc: "#00A862", tb: "rgba(0,201,123,.13)", tbd: "rgba(0,201,123,.32)", pts: [38, 42, 44, 48, 52, 55, 58, 61, 65, 68], c: "#6366F1" },
  { name: "HDFC Mid Cap Opp.", xirr: 11.3, bench: 14.1, alpha: "-2.8%", tag: "REVIEW", tc: "#D97706", tb: "rgba(245,158,11,.13)", tbd: "rgba(245,158,11,.32)", pts: [50, 48, 46, 44, 47, 43, 45, 44, 44, 42], c: "#F59E0B" },
  { name: "SBI Small Cap", xirr: 9.1, bench: 14.1, alpha: "-5.0%", tag: "EXIT", tc: "#DC2626", tb: "rgba(239,68,68,.13)", tbd: "rgba(239,68,68,.32)", pts: [55, 52, 48, 44, 40, 38, 35, 33, 31, 28], c: "#EF4444" },
];

function XirrRing({ value, size = 118 }: { value: number; size?: number }) {
  const r = size * 0.40, cx = size / 2, cy = size / 2, C = 2 * Math.PI * r;
  const frac = Math.min(value / 20, 1);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,.09)" strokeWidth={size * .10} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#00C97B" strokeWidth={size * .10} strokeLinecap="round"
        strokeDasharray={`${frac * C} ${C}`} style={{ transformOrigin: `${cx}px ${cy}px`, transform: "rotate(-90deg)", filter: "drop-shadow(0 0 8px rgba(0,201,123,.5))" }} />
      <text x={cx} y={cy + 2} textAnchor="middle" fontSize={size * .155} fontWeight="900" fill="white" fontFamily="Fraunces,Georgia,serif">{value}%</text>
      <text x={cx} y={cy + size * .17} textAnchor="middle" fontSize={size * .062} fill="rgba(255,255,255,.42)" fontFamily="DM Sans,system-ui" letterSpacing=".08em">YOUR XIRR</text>
    </svg>
  );
}

function CasShowcase() {
  const [go, setGo] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setGo(true); ob.disconnect(); } }, { threshold: .15 });
    if (ref.current) ob.observe(ref.current);
    return () => ob.disconnect();
  }, []);

  return (
    <div ref={ref} className="glass" style={{ borderRadius: 26, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,.45)" }}>
      <div style={{ height: 3, background: "linear-gradient(90deg,#00C97B,#6366F1,#00C97B)" }} />

      {/* Card header */}
      <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid rgba(255,255,255,.08)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" as const }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: 10, background: "rgba(0,201,123,.15)", border: "1px solid rgba(0,201,123,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✓</div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: "white" }}>CAS parsed successfully</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,.38)", fontWeight: 600 }}>Consolidated Account Statement · 7 folios · 12 schemes</div>
          </div>
        </div>
        <span style={{ fontSize: 9.5, fontWeight: 800, color: "#00C97B", background: "rgba(0,201,123,.12)", border: "1px solid rgba(0,201,123,.28)", borderRadius: 100, padding: "4px 11px", letterSpacing: ".06em" }}>ANALYSIS READY</span>
      </div>

      <div style={{ padding: "18px 20px 20px" }}>
        {/* Ring + summary */}
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 18, flexWrap: "wrap" as const }}>
          <div className="float"><XirrRing value={14.2} /></div>
          <div style={{ flex: 1, minWidth: 170, display: "grid", gap: 8 }}>
            {[
              ["Benchmark XIRR", "11.6%", "+2.6% ahead", true],
              ["Funds beating benchmark", "7 of 12", "58% beat rate", true],
              ["Portfolio health score", "84/100", "Good shape", true],
            ].map(([l, v, n, pos], i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,.045)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 12, padding: "8px 12px" }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.52)" }}>{l}</span>
                <span style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 900, color: "white" }}>{v}</span>
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: pos ? "#00C97B" : "#EF4444" }}>{n}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Per-fund verdicts */}
        <div style={{ fontSize: 9.5, fontWeight: 800, color: "rgba(255,255,255,.32)", letterSpacing: ".1em", textTransform: "uppercase" as const, marginBottom: 8 }}>Verdict per fund</div>
        {CAS_FUNDS.map((f, i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "minmax(0,1fr) 48px 44px 56px", gap: 8, alignItems: "center", padding: "9px 0",
            borderBottom: i < CAS_FUNDS.length - 1 ? "1px solid rgba(255,255,255,.05)" : "none",
            opacity: go ? 1 : 0, transform: go ? "translateX(0)" : "translateX(-14px)",
            transition: `opacity .5s ease ${300 + i * 130}ms, transform .5s ease ${300 + i * 130}ms`,
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,.86)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{f.name}</div>
              <div style={{ fontSize: 9.5, fontWeight: 600, color: f.xirr >= f.bench ? "#00C97B" : "#EF4444", marginTop: 2 }}>XIRR {f.xirr}% · {f.alpha} vs bench</div>
            </div>
            <Spark pts={f.pts} color={f.c} w={44} h={18} />
            <div style={{ fontSize: 11.5, fontWeight: 800, color: f.xirr >= f.bench ? "#00C97B" : "#EF4444" }}>{f.xirr}%</div>
            <div style={{ fontSize: 9, fontWeight: 800, padding: "4px 6px", borderRadius: 100, background: f.tb, border: `1px solid ${f.tbd}`, color: f.tc, textAlign: "center" as const }}>{f.tag}</div>
          </div>
        ))}

        <div style={{ marginTop: 14, display: "flex", gap: 7, flexWrap: "wrap" as const, alignItems: "center" }}>
          <span style={{ fontSize: 9.5, fontWeight: 800, color: "rgba(255,255,255,.30)" }}>Every rupee explained.</span>
          <span style={{ fontSize: 9.5, fontWeight: 700, color: "rgba(255,255,255,.42)" }}>No spreadsheet required. 🎉</span>
        </div>
      </div>
    </div>
  );
}

/* ── WEALTH CHART (FD vs MF, static illustrative) ───────────────────────── */
function WealthChart() {
  const W = 320, H = 150;
  const fd = [10, 10.7, 11.5, 12.3, 13.2, 14.2, 15.2, 16.3, 17.5, 18.8];
  const mf = [10, 11.4, 13.1, 15.0, 17.3, 19.8, 22.8, 26.2, 30.1, 34.6];
  const tx = (i: number) => 12 + (i / 9) * (W - 24);
  const ty = (v: number) => H - 16 - ((v - 8) / 30) * (H - 32);
  const fdP = fd.map((v, i) => `${i ? "L" : "M"}${tx(i)},${ty(v)}`).join(" ");
  const mfP = mf.map((v, i) => `${i ? "L" : "M"}${tx(i)},${ty(v)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <linearGradient id="gmf2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00C97B" stopOpacity=".2" />
          <stop offset="100%" stopColor="#00C97B" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[.28, .56, .84].map((p, i) => <line key={i} x1="12" y1={H * p} x2={W - 12} y2={H * p} stroke="rgba(255,255,255,.06)" strokeWidth="1" />)}
      <path d={`${fdP} L${tx(9)},${H} L${tx(0)},${H}Z`} fill="rgba(148,163,184,.07)" />
      <path d={fdP} fill="none" stroke="rgba(203,213,225,.6)" strokeWidth="1.5" strokeDasharray="5 3" />
      <path d={`${mfP} L${tx(9)},${H} L${tx(0)},${H}Z`} fill="url(#gmf2)" />
      <path d={mfP} fill="none" stroke="#00C97B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={tx(9)} cy={ty(mf[9])} r="5" fill="#00C97B" />
      <rect x={tx(9) - 60} y={ty(mf[9]) - 13} width={56} height={18} rx="5" fill="#00C97B" />
      <text x={tx(9) - 32} y={ty(mf[9]) + 3} textAnchor="middle" fontSize="9" fontWeight="800" fill="white" fontFamily="DM Sans,system-ui">₹34.6L MF</text>
      <circle cx={tx(9)} cy={ty(fd[9])} r="3.5" fill="#94A3B8" />
      <text x={tx(9) - 7} y={ty(fd[9]) + 13} textAnchor="end" fontSize="8" fill="#94A3B8" fontFamily="DM Sans,system-ui">₹18.8L FD</text>
      {["Y1", "", "Y3", "", "Y5", "", "Y7", "", "", "Y10"].map((l, i) => l && <text key={i} x={tx(i)} y={H + 2} fontSize="7.5" fill="rgba(203,213,225,.5)" fontFamily="DM Sans,system-ui" textAnchor="middle">{l}</text>)}
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════════════════ */
export default function Home() {
  const { manifest, topByCategory, tickerFunds, loaded } = useLiveData();

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

      {/* ══════════════════════════════════════════════════════════════
          SECTION 1 — HERO (aurora + liquid glass + live counter)
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ background: "var(--ink)", position: "relative", overflow: "hidden", padding: "clamp(52px,9vw,108px) clamp(16px,4vw,48px) clamp(60px,10vw,120px)" }}>
        <div style={{ position: "absolute", top: "-220px", left: "-140px", width: 720, height: 720, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,201,123,.16) 0%,transparent 62%)", filter: "blur(30px)", animation: "auroraA 26s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-240px", right: "-160px", width: 820, height: 820, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,.14) 0%,transparent 60%)", filter: "blur(36px)", animation: "auroraB 32s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "30%", left: "42%", width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle,rgba(37,99,235,.10) 0%,transparent 60%)", filter: "blur(40px)", animation: "auroraC 24s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
          <div className="hero-cols">

            <div>
              {/* Live badge */}
              <div className="f1" style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "rgba(0,201,123,.10)", border: "1px solid rgba(0,201,123,.28)", borderRadius: 100, padding: "5px 15px", marginBottom: 26, backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
                <span className="live-dot" style={{ width: 7, height: 7, background: "#00C97B", borderRadius: "50%", flexShrink: 0, display: "block" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#00C97B", letterSpacing: ".08em", textTransform: "uppercase" as const }}>
                  {manifest.counts.funds.toLocaleString("en-IN")} funds tracked · updated {loaded && manifest !== FALLBACK_MANIFEST ? manifest.reportDate : "Feb 2026"} · Free forever
                </span>
              </div>

              {/* Headline */}
              <h1 className="f2" style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: "clamp(2.5rem,6.5vw,4.8rem)", fontWeight: 900, color: "white", lineHeight: 1.03, letterSpacing: "-.04em", marginBottom: 20 }}>
                Your money,<br />finally making<br /><span className="shimmer-green">sense.</span>
              </h1>

              {/* Sub */}
              <p className="f3" style={{ fontSize: "clamp(15px,1.9vw,17px)", color: "rgba(255,255,255,.58)", lineHeight: 1.82, maxWidth: 460, marginBottom: 32 }}>
                A free toolkit for salaried Indians with SIPs, FDs &amp; PF — to track every rupee, audit your funds against {manifest.counts.funds.toLocaleString("en-IN")}+ live-scored funds, and plan your goals. No jargon. No ads. No commission.
              </p>

              {/* CTAs */}
              <div className="f4" style={{ marginBottom: 36, display: "flex", flexWrap: "wrap" as const, gap: 12, alignItems: "center" }}>
                <Link href="/mutual-fund-health-check/dashboard" style={{ textDecoration: "none" }}>
                  <button className="btn-green" style={{ background: "linear-gradient(120deg,#00C97B,#00E8A2)", color: "#06130D", border: "none", borderRadius: 14, padding: "15px 28px", fontSize: 15.5, fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 9, boxShadow: "0 8px 30px rgba(0,201,123,.4)", letterSpacing: "-.01em" }}>
                    🏥 Check My Portfolio — Free
                  </button>
                </Link>
                <Link href="/dashboard" style={{ textDecoration: "none" }}>
                  <button className="btn-ghost" style={{ background: "rgba(255,255,255,.07)", color: "white", border: "1px solid rgba(255,255,255,.16)", borderRadius: 14, padding: "15px 24px", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
                    See My Net Worth →
                  </button>
                </Link>
              </div>

              {/* Trust */}
              <div className="f5" style={{ display: "flex", gap: 28, flexWrap: "wrap" as const, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,.08)" }}>
                {([
                  { n: manifest.counts.funds + manifest.counts.etfs, suffix: "+", label: "Live-scored funds", count: true },
                  { n: 0, suffix: "", label: "Ads ever", count: false },
                  { n: "100%", suffix: "", label: "India-specific", count: false },
                ] as const).map((s, i) => (
                  <div key={i}>
                    <div style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: "clamp(1.5rem,2.5vw,2.1rem)", fontWeight: 900, color: "white", lineHeight: 1 }}>
                      {s.count ? <Counter to={s.n as number} suffix={s.suffix} /> : <>{s.n}{s.suffix}</>}
                    </div>
                    <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.38)", fontWeight: 600, marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive SIP calculator — visible on ALL screens incl. mobile */}
            <div className="f3" ref={heroTilt.ref}>
              <div onMouseMove={heroTilt.onMouseMove} onMouseLeave={heroTilt.onMouseLeave} className="tilt">
                <SIPCalc />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          LIVE TICKER — real top-alpha funds from R2
      ══════════════════════════════════════════════════════════════ */}
      <div style={{ overflow: "hidden", background: "var(--ink2)", borderBottom: "1px solid rgba(255,255,255,.06)", padding: "11px 0", position: "relative" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 60, background: "linear-gradient(90deg,var(--ink2),transparent)", zIndex: 2, pointerEvents: "none" }} />
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 60, background: "linear-gradient(-90deg,var(--ink2),transparent)", zIndex: 2, pointerEvents: "none" }} />
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
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 2 — WHO IS THIS FOR?
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ background: "var(--ink)", borderBottom: "1px solid rgba(255,255,255,.06)", padding: "clamp(28px,4vw,44px) clamp(16px,4vw,48px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <SR>
            <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.32)", letterSpacing: ".10em", textTransform: "uppercase" as const, textAlign: "center" as const, marginBottom: 18 }}>
              Pick what describes you — we&apos;ll show you where to start.
            </p>
          </SR>
          <SR delay={60}>
            <div className="grid-3">
              {[
                { icon: "🌱", label: "I'm new to investing", desc: "Learn how mutual funds work, why they beat FDs long-term, and how to start your first SIP the right way.", cta: "Start with the basics", href: "/why-mutual-fund", color: "#00C97B" },
                { icon: "📊", label: "I already have SIPs", desc: "Find out your real XIRR, compare against benchmarks, and get a clear signal on which funds to keep or exit.", cta: "Analyse my portfolio", href: "/mutual-fund-health-check/dashboard", color: "#6366F1" },
                { icon: "🔥", label: "I'm planning my future", desc: "Calculate your retirement corpus, child's education fund, home purchase — or your financial independence date.", cta: "Plan my future", href: "/dashboard/calculators", color: "#F59E0B" },
              ].map((p, i) => (
                <Link key={i} href={p.href} style={{ textDecoration: "none" }}>
                  <div className="path-card glass-soft card-hover-dark" style={{ borderRadius: 20, padding: "22px 20px", height: "100%", display: "flex", flexDirection: "column" as const }}>
                    <div style={{ fontSize: 28, marginBottom: 12 }}>{p.icon}</div>
                    <div style={{ fontSize: 14.5, fontWeight: 800, color: "white", marginBottom: 8, lineHeight: 1.3 }}>{p.label}</div>
                    <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.48)", lineHeight: 1.72, marginBottom: 18, flex: 1 }}>{p.desc}</div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 800, color: p.color }}>{p.cta} →</div>
                  </div>
                </Link>
              ))}
            </div>
          </SR>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 3 — HALL OF FAME (live R2 data, tabbed)
      ══════════════════════════════════════════════════════════════ */}
      <HallOfFame topByCategory={topByCategory} loaded={loaded} manifest={manifest} />

      {/* ══════════════════════════════════════════════════════════════
          SECTION 4 — FUND HEALTH CHECK (glass CAS showcase)
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ background: "var(--ink)", padding: "clamp(52px,8vw,96px) clamp(16px,4vw,48px)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -120, right: -100, width: 620, height: 620, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,201,123,.10) 0%,transparent 62%)", filter: "blur(30px)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
          <SR>
            <div className="duo flip">

              <div ref={casTilt.ref} onMouseMove={casTilt.onMouseMove} onMouseLeave={casTilt.onMouseLeave}>
                <div className="tilt"><CasShowcase /></div>
              </div>

              {/* Copy */}
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
                  Upload your CAS from CAMS or KFintech. Get your true XIRR, a benchmark comparison, and a clear Hold / Review / Exit signal for every fund. In 3 minutes.
                </p>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 9, marginBottom: 28 }}>
                  {[["📤", "Upload CAS from CAMS / KFintech — free"], ["⚡", "Get true XIRR & alpha vs benchmark instantly"], ["🚦", "Hold, Review or Exit — clear signal per fund"]].map(([ic, tx], i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 14, flexShrink: 0 }}>{ic}</span>
                      <span style={{ fontSize: 12.5, color: "rgba(255,255,255,.52)", fontWeight: 600 }}>{tx}</span>
                    </div>
                  ))}
                </div>
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

      {/* ══════════════════════════════════════════════════════════════
          SECTION 5 — MONEY DASHBOARD
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ background: "white", padding: "clamp(52px,8vw,96px) clamp(16px,4vw,48px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <SR>
            <div className="duo">
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(99,102,241,.09)", border: "1px solid rgba(99,102,241,.28)", borderRadius: 100, padding: "4px 13px", marginBottom: 16 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: "#4F46E5", letterSpacing: ".08em", textTransform: "uppercase" as const }}>Money Dashboard</span>
                </div>
                <h2 style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: "clamp(1.7rem,4vw,3rem)", fontWeight: 700, fontStyle: "italic", color: "var(--ink)", lineHeight: 1.1, letterSpacing: "-.03em", margin: "0 0 18px" }}>
                  Where exactly<br />is all your money?
                </h2>
                <p style={{ fontSize: "clamp(14px,1.6vw,15.5px)", color: "var(--slate)", lineHeight: 1.85, maxWidth: 440, margin: "0 0 12px" }}>
                  SIPs. PF that auto-deducts. An FD your dad suggested. Maybe gold ETFs. Separately, each feels small. Together, it&apos;s your real financial picture.
                </p>
                <p style={{ fontSize: "clamp(14px,1.6vw,15.5px)", color: "var(--ink)", fontWeight: 700, lineHeight: 1.75, maxWidth: 440, margin: "0 0 24px" }}>
                  The Money Dashboard adds it all up — every rupee, every account, one real net worth number.
                </p>
                {["All asset classes in one view", "Annual growth & allocation tracked", "Portfolio health score at a glance"].map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}>
                    <div style={{ width: 19, height: 19, borderRadius: "50%", background: "#ECFDF5", border: "1.5px solid #A7F3D0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 9.5, color: "#00A862" }}>✓</span>
                    </div>
                    <span style={{ fontSize: 13, color: "var(--slate)", fontWeight: 500 }}>{f}</span>
                  </div>
                ))}
                <Link href="/dashboard" style={{ textDecoration: "none", display: "inline-block", marginTop: 24 }}>
                  <button className="btn-indigo" style={{ background: "linear-gradient(120deg,var(--ink),#1a2340)", color: "white", border: "none", borderRadius: 13, padding: "12px 22px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 6px 20px rgba(10,14,28,.25)" }}>
                    📊 Open Money Dashboard
                  </button>
                </Link>
              </div>

              {/* Net worth mock */}
              <div>
                <div className="card-hover" style={{ background: "white", borderRadius: 24, border: "1.5px solid var(--border)", overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,.08)" }}>
                  <div style={{ height: 4, background: "linear-gradient(90deg,#2563EB,#6366F1,#00C97B)" }} />
                  <div style={{ padding: "20px 22px 15px", background: "linear-gradient(135deg,#EEF2FF,#ECFDF5)" }}>
                    <div style={{ fontSize: 10, color: "var(--slate)", fontWeight: 700, marginBottom: 4, textTransform: "uppercase" as const, letterSpacing: ".08em" }}>Total Net Worth</div>
                    <div style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: "clamp(2rem,4vw,2.8rem)", fontWeight: 900, color: "var(--ink)", lineHeight: 1 }}>₹47.3L</div>
                    <div style={{ fontSize: 12, color: "#00A862", fontWeight: 700, marginTop: 5 }}>↑ +18.4% · ₹7.3L gain this year</div>
                  </div>
                  <div style={{ padding: "16px 22px 20px" }}>
                    <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
                      <Donut size={98} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {SEGS.map((s, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                            <div style={{ width: 7, height: 7, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 10.5, color: "#374151", fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{s.label}</span>
                            <span style={{ fontSize: 10.5, fontWeight: 800, color: s.color }}>{s.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: 11, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "var(--ink)" }}>Portfolio Health Score</span>
                      <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 100, padding: "3px 11px" }}>
                        <span style={{ fontSize: 12.5, fontWeight: 900, color: "#00A862" }}>84 / 100</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SR>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 6 — STATS + FD vs MF
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ background: "var(--ink)", padding: "clamp(36px,5vw,56px) clamp(16px,4vw,48px)", borderTop: "1px solid rgba(255,255,255,.06)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", bottom: -180, left: "30%", width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,.09) 0%,transparent 62%)", filter: "blur(30px)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
          <SR>
            <div className="combined-duo" style={{ alignItems: "start" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "rgba(255,255,255,.07)", borderRadius: 16, overflow: "hidden", alignSelf: "start" as const }}>
                {[
                  { val: "9.1", suf: "%", label: "Avg XIRR in bad funds", note: "vs 14%+ benchmark", color: "#EF4444" },
                  { val: 15.8, suf: "L", label: "Extra wealth, right vehicle", note: "10 yrs · ₹10k/mo SIP", color: "#00C97B" },
                  { val: 73, suf: "%", label: "Investors with no fund clarity", note: "SIPs on autopilot", color: "#F59E0B" },
                  { val: 3, suf: " min", label: "To see your full picture", note: "upload CAS → done", color: "#6366F1" },
                ].map((s, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,.04)", padding: "clamp(16px,2.5vw,24px) clamp(14px,2vw,20px)" }}>
                    <div style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: "clamp(1.7rem,3.5vw,2.6rem)", fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: 5 }}>
                      {typeof s.val === "number" ? <Counter to={s.val} suffix={s.suf} duration={1400} /> : <><Counter to={parseFloat(s.val)} suffix={s.suf} duration={1400} /></>}
                    </div>
                    <div style={{ fontSize: "clamp(11px,1.3vw,12.5px)", fontWeight: 700, color: "rgba(255,255,255,.78)", marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontSize: "clamp(9.5px,1.1vw,11px)", color: "rgba(255,255,255,.34)" }}>{s.note}</div>
                  </div>
                ))}
              </div>

              <div className="glass-soft" style={{ borderRadius: 18, padding: "clamp(18px,2.5vw,26px)", alignSelf: "start" as const }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap" as const, gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.36)", letterSpacing: ".09em", textTransform: "uppercase" as const, marginBottom: 4 }}>Cost of staying in FDs</div>
                    <div style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: "clamp(1.1rem,2.2vw,1.5rem)", fontWeight: 900, color: "white", lineHeight: 1.15 }}>
                      ₹10L · 10 years · <span style={{ color: "#00C97B" }}>one choice.</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                    <div style={{ textAlign: "center" as const }}>
                      <div style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: "clamp(1.2rem,2vw,1.6rem)", fontWeight: 900, color: "#00C97B" }}>₹34.6L</div>
                      <div style={{ fontSize: 9.5, fontWeight: 700, color: "rgba(255,255,255,.44)", marginTop: 2 }}>Equity MF</div>
                    </div>
                    <div style={{ width: 1, background: "rgba(255,255,255,.10)", alignSelf: "stretch" as const }} />
                    <div style={{ textAlign: "center" as const }}>
                      <div style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: "clamp(1.2rem,2vw,1.6rem)", fontWeight: 900, color: "rgba(255,255,255,.44)" }}>₹18.8L</div>
                      <div style={{ fontSize: 9.5, fontWeight: 700, color: "rgba(255,255,255,.32)", marginTop: 2 }}>FD</div>
                    </div>
                    <div style={{ background: "rgba(0,201,123,.15)", border: "1px solid rgba(0,201,123,.28)", borderRadius: 8, padding: "4px 10px", display: "flex", alignItems: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#00C97B", whiteSpace: "nowrap" as const }}>+₹15.8L 🚀</span>
                    </div>
                  </div>
                </div>
                <WealthChart />
                <div style={{ marginTop: 10, fontSize: 10, color: "rgba(255,255,255,.26)", fontWeight: 500, textAlign: "center" as const }}>
                  ⚠️ Past performance is illustrative only. Mutual fund investments are subject to market risk.
                </div>
              </div>
            </div>
          </SR>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 7 — MF WORLD: LEARN & EXPLORE
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ background: "var(--mist)", borderTop: "1px solid var(--border)", padding: "clamp(52px,7vw,88px) clamp(16px,4vw,48px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <SR style={{ marginBottom: 30 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--slate)", letterSpacing: ".10em", textTransform: "uppercase" as const, marginBottom: 8 }}>Mutual Fund World</p>
            <h2 style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: "clamp(1.5rem,3vw,2.2rem)", fontWeight: 900, color: "var(--ink)", letterSpacing: "-.03em", lineHeight: 1.1 }}>
              Learn. Explore. Decide.
            </h2>
          </SR>
          <div style={{ display: "grid", gap: 16 }}>
            <SR delay={40}>
              <Link href="/why-mutual-fund" style={{ textDecoration: "none", display: "block" }}>
                <div className="card-hover" style={{ background: "linear-gradient(120deg,#0A0E1C 0%,#141B3D 55%,#05271C 100%)", borderRadius: 22, padding: "clamp(26px,4vw,44px) clamp(22px,4vw,44px)", position: "relative", overflow: "hidden", boxShadow: "0 6px 28px rgba(0,0,0,.14)" }}>
                  <div style={{ position: "absolute", top: -60, right: -60, width: 360, height: 360, background: "radial-gradient(circle,rgba(0,201,123,.13) 0%,transparent 68%)", pointerEvents: "none" }} />
                  <div style={{ position: "relative", maxWidth: 580 }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(0,201,123,.12)", border: "1px solid rgba(0,201,123,.25)", borderRadius: 100, padding: "4px 13px", marginBottom: 14 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: "#00C97B", letterSpacing: ".08em", textTransform: "uppercase" as const }}>📖 New to investing?</span>
                    </div>
                    <h3 style={{ fontFamily: "Fraunces,Georgia,serif", fontSize: "clamp(1.3rem,3vw,2.1rem)", fontWeight: 900, color: "white", lineHeight: 1.15, letterSpacing: "-.03em", margin: "0 0 10px" }}>
                      The Complete Guide to Mutual Funds →
                    </h3>
                    <p style={{ fontSize: "clamp(12px,1.5vw,13.5px)", color: "rgba(255,255,255,.5)", lineHeight: 1.75, margin: "0 0 16px" }}>
                      What is a mutual fund? How does NAV work? SIP vs lumpsum? Real costs? All covered in plain English. Free, forever.
                    </p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                      {["What is a MF", "How NAV works", "Pros & Cons", "3 Pillars", "How to Start", "FAQs"].map((t, i) => (
                        <div key={i} style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.11)", borderRadius: 100, padding: "3px 10px", fontSize: 10.5, fontWeight: 600, color: "rgba(255,255,255,.66)" }}>{t}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            </SR>

            <div className="grid-2">
              {[
                { href: "/active-funds", icon: "⚡", label: "Active Funds Explorer", desc: "Screened by alpha, consistency & composite score. Funds that genuinely beat their benchmark.", color: "#00A862", bg: "linear-gradient(135deg,#ECFDF5,#D1FAE5)", bd: "#A7F3D0" },
                { href: "/index-funds", icon: "📈", label: "Index Funds Explorer", desc: `Compare trackers by benchmark fit, tracking difference, expense ratio, and liquidity. ${manifest.counts.etfs} ETFs scored.`, color: "#4F46E5", bg: "linear-gradient(135deg,#EEF2FF,#E0E7FF)", bd: "#C7D2FE" },
              ].map((c, i) => (
                <SR key={i} delay={i * 80}>
                  <Link href={c.href} style={{ textDecoration: "none", display: "block", height: "100%" }}>
                    <div className="card-hover" style={{ background: c.bg, border: `1.5px solid ${c.bd}`, borderRadius: 18, padding: "clamp(18px,2.5vw,26px)", height: "100%", display: "flex", flexDirection: "column" as const }}>
                      <div style={{ fontSize: 24, marginBottom: 10 }}>{c.icon}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)", marginBottom: 7, lineHeight: 1.25 }}>{c.label}</div>
                      <div style={{ fontSize: 12, color: "var(--slate)", lineHeight: 1.65, flex: 1, marginBottom: 14 }}>{c.desc}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: c.color }}>Explore →</div>
                    </div>
                  </Link>
                </SR>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 8 — FINAL CTA
      ══════════════════════════════════════════════════════════════ */}
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
              Your CAS already knows the truth about your portfolio. Upload it, and see every fund&apos;s real performance in minutes — free, private, no signup walls.
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
