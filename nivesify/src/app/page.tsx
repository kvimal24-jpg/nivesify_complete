"use client";

import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";

/* ─────────────────────────────────────────────────────────────────────────────
   RESPONSIVE CSS — mobile-first, no inline media queries
   Breakpoints: sm=480px  md=700px  lg=960px
   ───────────────────────────────────────────────────────────────────────── */
const CSS = `
  *, *::before, *::after { box-sizing: border-box; }

  /* ── HERO GRID ── */
  .hero-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 32px;
    align-items: center;
  }
  @media (min-width: 960px) {
    .hero-grid { grid-template-columns: 1fr 1.05fr; gap: 56px; }
  }

  /* ── HERO PREVIEW (right panel) — hide on mobile/tablet ── */
  .hero-preview { display: none; }
  @media (min-width: 960px) { .hero-preview { display: block; } }

  /* ── NAV STRIP — 2-col mobile, 4-col desktop ── */
  .nav-strip {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  @media (min-width: 700px) {
    .nav-strip { grid-template-columns: repeat(4, 1fr); }
  }

  /* ── FEATURE CARDS — 1-col mobile, 2-col tablet+ ── */
  .feature-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
  }
  @media (min-width: 600px) {
    .feature-grid { grid-template-columns: repeat(2, 1fr); }
  }

  /* ── PROBLEM ── */
  .problem-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
  }
  @media (min-width: 700px) {
    .problem-grid { grid-template-columns: 1fr 1fr; gap: 36px; align-items: center; }
  }

  /* ── STEPS ── */
  .steps-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  @media (min-width: 700px) {
    .steps-grid { grid-template-columns: repeat(4, 1fr); gap: 12px; }
  }

  /* ── WEALTH CHART ── */
  .wealth-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;
  }
  @media (min-width: 700px) {
    .wealth-grid { grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; }
  }

  /* ── WHY MF BANNER ── */
  .whymf-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0;
  }
  @media (min-width: 700px) {
    .whymf-grid { grid-template-columns: 1fr auto; gap: 32px; align-items: center; }
  }
  .whymf-book { display: none; }
  @media (min-width: 700px) { .whymf-book { display: block; } }

  /* ── PHILOSOPHY ── */
  .philosophy-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 32px;
  }
  @media (min-width: 700px) {
    .philosophy-grid { grid-template-columns: 1fr 1fr; gap: 52px; align-items: start; }
  }

  /* ── QUICKLINKS ── */
  .quicklinks-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 9px;
  }
  @media (min-width: 480px) {
    .quicklinks-grid { grid-template-columns: repeat(3, 1fr); }
  }

  /* ── HOVER EFFECTS ── */
  .card-lift { transition: box-shadow 0.28s ease, transform 0.28s ease; }
  .card-lift:hover {
    box-shadow: 0 18px 56px rgba(0,0,0,0.11) !important;
    transform: translateY(-4px) !important;
  }
  .link-lift { transition: box-shadow 0.22s ease, transform 0.22s ease; }
  .link-lift:hover {
    box-shadow: 0 6px 20px rgba(0,0,0,0.09) !important;
    transform: translateY(-2px) !important;
  }
  .nav-card-lift { transition: box-shadow 0.22s ease, transform 0.22s ease, background 0.22s ease; }
  .nav-card-lift:hover {
    box-shadow: 0 10px 30px rgba(0,0,0,0.10) !important;
    transform: translateY(-3px) !important;
  }
  .cta-green { transition: transform 0.18s, box-shadow 0.18s; }
  .cta-green:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(5,150,105,0.42) !important; }
  .cta-white { transition: transform 0.18s, box-shadow 0.18s; }
  .cta-white:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.10) !important; }
  .dark-lift { transition: transform 0.28s ease, box-shadow 0.28s ease; }
  .dark-lift:hover { transform: translateY(-3px); box-shadow: 0 20px 56px rgba(0,0,0,0.24) !important; }
`;

/* ── SCROLL REVEAL ─────────────────────────────────────────────────────── */
function Reveal({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); ob.disconnect(); } }, { threshold: 0.04 });
    if (ref.current) ob.observe(ref.current);
    return () => ob.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(20px)", transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`, ...style }}>
      {children}
    </div>
  );
}

/* ── SPARKLINE ─────────────────────────────────────────────────────────── */
function Spark({ pts, color, w = 56, h = 22 }: { pts: number[]; color: string; w?: number; h?: number }) {
  const mn = Math.min(...pts), mx = Math.max(...pts), rng = mx - mn || 1;
  const xs = pts.map((_, i) => (i / (pts.length - 1)) * w);
  const ys = pts.map(v => h - ((v - mn) / rng) * (h - 5) - 2);
  const line = xs.map((x, i) => `${i ? "L" : "M"}${x},${ys[i]}`).join(" ");
  const uid = `s${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible", flexShrink: 0 }}>
      <defs><linearGradient id={uid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.22" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <path d={`${line} L${w},${h} L0,${h} Z`} fill={`url(#${uid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r="3" fill={color} />
    </svg>
  );
}

/* ── DONUT ─────────────────────────────────────────────────────────────── */
function Donut({ segs, size = 96 }: { segs: { pct: number; color: string }[]; size?: number }) {
  const r = size * 0.37, cx = size / 2, cy = size / 2, C = 2 * Math.PI * r;
  let cum = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      {segs.map((s, i) => {
        const dash = (s.pct / 100) * C, off = C - (cum / 100) * C; cum += s.pct;
        return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={size * 0.14} strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={off} style={{ transformOrigin: `${cx}px ${cy}px`, transform: "rotate(-90deg)" }} />;
      })}
      <circle cx={cx} cy={cy} r={r * 0.58} fill="white" />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize={size * 0.10} fontWeight="800" fill="#0F172A" fontFamily="DM Sans,system-ui">₹47.3L</text>
      <text x={cx} y={cy + 11} textAnchor="middle" fontSize={size * 0.085} fill="#059669" fontFamily="DM Sans,system-ui">↑18.4%</text>
    </svg>
  );
}

/* ── NET WORTH PREVIEW ─────────────────────────────────────────────────── */
const SEGS = [
  { pct: 42, color: "#2563EB", label: "Equity MF", val: "₹19.9L" },
  { pct: 18, color: "#059669", label: "Debt MF",   val: "₹8.5L"  },
  { pct: 16, color: "#D97706", label: "PF/EPF",    val: "₹7.6L"  },
  { pct: 14, color: "#7C3AED", label: "Gold",       val: "₹6.6L"  },
  { pct: 10, color: "#0891B2", label: "FD/Cash",   val: "₹4.7L"  },
];
function NetWorthPreview() {
  return (
    <div>
      <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 10 }}>
        <Donut segs={SEGS} size={96} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {SEGS.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
              <div style={{ width: 7, height: 7, borderRadius: 2, background: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: "#374151", fontWeight: 600, flex: 1, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{s.label}</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: s.color }}>{s.val}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 7, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: "#0F172A" }}>Total Net Worth</span>
        <span style={{ fontSize: 13, fontWeight: 900, color: "#059669" }}>₹47.3L ↑ 18.4%</span>
      </div>
    </div>
  );
}

/* ── FUND TABLE ─────────────────────────────────────────────────────────── */
const FUNDS = [
  { name: "Mirae Asset Large Cap",  xirr: 16.2, bench: 14.1, alpha: "+2.1%", rating: "HOLD"   as const, pts: [38,40,43,41,47,50,52,55,57,62], color: "#059669" },
  { name: "Parag Parikh Flexi Cap", xirr: 18.7, bench: 14.1, alpha: "+4.6%", rating: "HOLD"   as const, pts: [35,38,43,46,44,50,55,57,62,67], color: "#2563EB" },
  { name: "HDFC Mid Cap Opp.",      xirr: 11.3, bench: 14.1, alpha: "-2.8%", rating: "REVIEW" as const, pts: [50,48,51,46,44,47,43,45,44,44], color: "#D97706" },
  { name: "SBI Small Cap",          xirr:  9.1, bench: 14.1, alpha: "-5.0%", rating: "EXIT"   as const, pts: [55,52,48,44,40,42,38,35,33,31], color: "#DC2626" },
];
const RS = {
  HOLD:   { c: "#059669", bg: "#ECFDF5", bd: "#A7F3D0" },
  REVIEW: { c: "#D97706", bg: "#FFFBEB", bd: "#FDE68A" },
  EXIT:   { c: "#DC2626", bg: "#FEF2F2", bd: "#FECACA" },
};
function FundRow({ f, animate, delay }: { f: typeof FUNDS[0]; animate: boolean; delay: number }) {
  const rs = RS[f.rating];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 48px 40px 48px", gap: 7, alignItems: "center", padding: "8px 0", borderBottom: "1px solid #F1F5F9", opacity: animate ? 1 : 0, transform: animate ? "translateX(0)" : "translateX(-8px)", transition: `opacity 0.45s ease ${delay}ms, transform 0.45s ease ${delay}ms` }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: "#0F172A", lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{f.name}</div>
        <div style={{ fontSize: 9, color: f.xirr >= f.bench ? "#059669" : "#DC2626", fontWeight: 600 }}>XIRR {f.xirr}% · {f.alpha}</div>
      </div>
      <Spark pts={f.pts} color={f.color} w={44} h={20} />
      <div style={{ fontSize: 10, fontWeight: 700, color: f.xirr >= f.bench ? "#059669" : "#DC2626" }}>{f.xirr}%</div>
      <div style={{ fontSize: 8.5, fontWeight: 800, padding: "2px 5px", borderRadius: 100, background: rs.bg, border: `1px solid ${rs.bd}`, color: rs.c, textAlign: "center" as const, whiteSpace: "nowrap" as const }}>{f.rating}</div>
    </div>
  );
}

/* ── STYLE BOX ─────────────────────────────────────────────────────────── */
function StyleBox() {
  const cols = ["Value", "Blend", "Growth", "Best Ideas"];
  const rows = ["Large", "Mid", "Small", "Flexi"];
  const filled: Record<string, { color: string; label: string }> = {
    "0-0": { color: "#2563EB", label: "Nifty 50" }, "0-1": { color: "#7C3AED", label: "UTI Nifty" }, "0-3": { color: "#059669", label: "PP Flexi" },
    "1-1": { color: "#D97706", label: "HDFC Mid" }, "1-2": { color: "#0891B2", label: "Axis Mid" },
    "2-0": { color: "#DC2626", label: "SBI Sm." },  "2-1": { color: "#D97706", label: "Nippon Sm." },
    "3-1": { color: "#059669", label: "Mirae Fl." }, "3-3": { color: "#7C3AED", label: "PPFAS" },
  };
  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.07em", textTransform: "uppercase" as const, marginBottom: 7 }}>Fund Style Matrix</div>
      <div style={{ display: "grid", gridTemplateColumns: "34px repeat(4,1fr)", gap: 3 }}>
        <div />
        {cols.map((c, i) => <div key={i} style={{ fontSize: 7, fontWeight: 700, color: "#64748B", textAlign: "center" as const }}>{c}</div>)}
        {rows.map((row, ri) => [
          <div key={`r${ri}`} style={{ fontSize: 8, fontWeight: 700, color: "#94A3B8", display: "flex", alignItems: "center" }}>{row}</div>,
          ...cols.map((_, ci) => {
            const k = `${ri}-${ci}`, h = filled[k];
            return <div key={k} style={{ height: 22, borderRadius: 4, background: h ? `${h.color}1E` : "#F8FAFC", border: `1.5px solid ${h ? h.color + "55" : "#E2E8F0"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {h && <span style={{ fontSize: 6, fontWeight: 800, color: h.color, textAlign: "center" as const, lineHeight: 1.1, padding: "0 1px" }}>{h.label}</span>}
            </div>;
          })
        ])}
      </div>
    </div>
  );
}

/* ── FIRE VIZ ───────────────────────────────────────────────────────────── */
function FireViz() {
  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.07em", textTransform: "uppercase" as const, marginBottom: 9 }}>Life Goal Tracker</div>
      {[
        { label: "Car",  yr: "2Y",  val: "₹8L",  pct: 82, color: "#2563EB" },
        { label: "Home", yr: "8Y",  val: "₹60L", pct: 42, color: "#7C3AED" },
        { label: "Edu",  yr: "12Y", val: "₹25L", pct: 28, color: "#D97706" },
        { label: "FIRE", yr: "20Y", val: "₹3Cr", pct: 14, color: "#059669" },
      ].map((g, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: g.color }}>{g.label}</span>
              <span style={{ fontSize: 9, color: "#94A3B8" }}>in {g.yr}</span>
            </div>
            <span style={{ fontSize: 10, fontWeight: 800, color: g.color }}>{g.val}</span>
          </div>
          <div style={{ height: 6, background: "#F1F5F9", borderRadius: 100, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${g.pct}%`, background: `linear-gradient(90deg,${g.color},${g.color}99)`, borderRadius: 100 }} />
          </div>
        </div>
      ))}
      <div style={{ marginTop: 10, background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 8, padding: "6px 10px", fontSize: 10, fontWeight: 700, color: "#059669" }}>
        🎯 FIRE at 47 — ₹3.2Cr corpus projected
      </div>
    </div>
  );
}

/* ── WEALTH CHART ───────────────────────────────────────────────────────── */
function WealthChart() {
  const W = 300, H = 140;
  const fd = [10, 10.7, 11.5, 12.3, 13.2, 14.2, 15.2, 16.3, 17.5, 18.8];
  const mf = [10, 11.4, 13.1, 15.0, 17.3, 19.8, 22.8, 26.2, 30.1, 34.6];
  const toX = (i: number) => 10 + (i / 9) * (W - 20);
  const toY = (v: number) => H - 14 - ((v - 8) / 30) * (H - 30);
  const fdP = fd.map((v, i) => `${i ? "L" : "M"}${toX(i)},${toY(v)}`).join(" ");
  const mfP = mf.map((v, i) => `${i ? "L" : "M"}${toX(i)},${toY(v)}`).join(" ");
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <defs>
          <linearGradient id="wm3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#059669" stopOpacity="0.2" /><stop offset="100%" stopColor="#059669" stopOpacity="0" /></linearGradient>
          <linearGradient id="wf3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#94A3B8" stopOpacity="0.12" /><stop offset="100%" stopColor="#94A3B8" stopOpacity="0" /></linearGradient>
        </defs>
        {[0.3, 0.6].map((p, i) => <line key={i} x1="10" y1={H * p} x2={W - 10} y2={H * p} stroke="#F1F5F9" strokeWidth="1" />)}
        <path d={`${fdP} L${toX(9)},${H} L${toX(0)},${H} Z`} fill="url(#wf3)" />
        <path d={fdP} fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="4 3" />
        <path d={`${mfP} L${toX(9)},${H} L${toX(0)},${H} Z`} fill="url(#wm3)" />
        <path d={mfP} fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={toX(9)} cy={toY(mf[9])} r="4" fill="#059669" />
        <rect x={toX(9) + 6} y={toY(mf[9]) - 9} width={52} height={16} rx="4" fill="#059669" />
        <text x={toX(9) + 10} y={toY(mf[9]) + 3} fontSize="8.5" fontWeight="800" fill="white" fontFamily="DM Sans,system-ui">₹34.6L MF</text>
        <circle cx={toX(9)} cy={toY(fd[9])} r="3" fill="#94A3B8" />
        <text x={toX(9) + 6} y={toY(fd[9]) + 4} fontSize="8" fill="#94A3B8" fontFamily="DM Sans,system-ui">₹18.8L FD</text>
        {["Y1","","Y3","","Y5","","Y7","","","Y10"].map((l, i) => l && <text key={i} x={toX(i)} y={H + 1} fontSize="7.5" fill="#CBD5E1" fontFamily="DM Sans,system-ui" textAnchor="middle">{l}</text>)}
      </svg>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 7, flexWrap: "wrap" }}>
        {[{ color: "#059669", label: "Equity MF (~14% CAGR)", dash: false }, { color: "#CBD5E1", label: "FD post-tax (~5%)", dash: true }].map((l, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 16, height: 2, background: l.dash ? "none" : l.color, backgroundImage: l.dash ? `repeating-linear-gradient(90deg,${l.color} 0,${l.color} 4px,transparent 4px,transparent 7px)` : "none", borderRadius: 1 }} />
            <span style={{ fontSize: 10, color: "#64748B", fontWeight: 600 }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN PAGE
   ───────────────────────────────────────────────────────────────────────── */
export default function Home() {
  const [entered, setEntered] = useState(false);
  useEffect(() => { const t = setTimeout(() => setEntered(true), 50); return () => clearTimeout(t); }, []);

  const tableRef = useRef<HTMLDivElement>(null);
  const [tableVis, setTableVis] = useState(false);
  useEffect(() => {
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setTableVis(true); ob.disconnect(); } }, { threshold: 0.1 });
    if (tableRef.current) ob.observe(tableRef.current);
    return () => ob.disconnect();
  }, []);

  const fade = (delay: number): React.CSSProperties => ({
    opacity: entered ? 1 : 0,
    transform: entered ? "translateY(0)" : "translateY(18px)",
    transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
  });

  /* 4 primary nav destinations */
  const NAV = [
    { href: "/dashboard",                          icon: "📊", label: "Money Dashboard",  desc: "Net worth · all assets",         color: "#2563EB", bg: "#EFF6FF", bd: "#BFDBFE", bar: "linear-gradient(90deg,#2563EB,#7C3AED)" },
    { href: "/mutual-fund-health-check/dashboard", icon: "🏥", label: "Fund Health Check", desc: "XIRR · benchmark · signals",      color: "#059669", bg: "#ECFDF5", bd: "#A7F3D0", bar: "linear-gradient(90deg,#059669,#0891B2)" },
    { href: "/mutual-fund-match",                  icon: "🗺️", label: "MF World",          desc: "Explore & compare all funds",     color: "#7C3AED", bg: "#F5F3FF", bd: "#DDD6FE", bar: "linear-gradient(90deg,#7C3AED,#2563EB)" },
    { href: "/dashboard/calculators",              icon: "🧮", label: "Life Calculators",  desc: "FIRE · retirement · goals",       color: "#D97706", bg: "#FFFBEB", bd: "#FDE68A", bar: "linear-gradient(90deg,#D97706,#DC2626)" },
  ];

  return (
    <main style={{ background: "#F8FAFC", minHeight: "100vh", fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif", color: "#1F2937" }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ═══════════════════════════════════════════════════════════════════
          ① NAV STRIP — first thing the user sees after the global header
             Permanent fixture: 4 large tappable cards linking everywhere
          ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: "white", borderBottom: "1.5px solid #E2E8F0", padding: "clamp(14px,2.5vw,20px) clamp(14px,4vw,32px)" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.10em", textTransform: "uppercase" as const, marginBottom: 11, textAlign: "center" as const }}>
            Where do you want to go?
          </div>
          <div className="nav-strip">
            {NAV.map((c, i) => (
              <Link key={i} href={c.href} style={{ textDecoration: "none", display: "block" }}>
                <div className="nav-card-lift" style={{ background: "white", border: `1.5px solid ${c.bd}`, borderRadius: 16, padding: "clamp(12px,2vw,16px) clamp(12px,2vw,14px)", display: "flex", flexDirection: "column" as const, gap: 6, position: "relative", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.04)", minHeight: 100 }}>
                  {/* Accent bar */}
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: c.bar, borderRadius: "16px 16px 0 0" }} />
                  {/* Icon */}
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: c.bg, border: `1px solid ${c.bd}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginTop: 4, flexShrink: 0 }}>
                    {c.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: "clamp(12px,2vw,13px)", fontWeight: 800, color: "#0F172A", lineHeight: 1.2, marginBottom: 2 }}>{c.label}</div>
                    <div style={{ fontSize: "clamp(10px,1.6vw,11px)", color: "#64748B", lineHeight: 1.4 }}>{c.desc}</div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: c.color, marginTop: "auto" }}>Open →</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          ② HERO — headline + tagline + CTAs | right panel (desktop only)
          ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: "linear-gradient(150deg,#F0FDF4 0%,#EFF6FF 50%,#FFF7ED 100%)", borderBottom: "1px solid #E2E8F0", position: "relative", overflow: "hidden", padding: "clamp(36px,6vw,72px) clamp(14px,4vw,32px) clamp(32px,5vw,60px)" }}>
        {/* Background texture */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 1px 1px, rgba(16,185,129,0.07) 1px, transparent 0)", backgroundSize: "28px 28px", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: -100, right: -80, width: 580, height: 580, background: "radial-gradient(circle,rgba(59,130,246,0.09) 0%,transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -80, left: -60, width: 480, height: 480, background: "radial-gradient(circle,rgba(16,185,129,0.07) 0%,transparent 65%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1160, margin: "0 auto", position: "relative" }}>
          <div className="hero-grid">

            {/* ── LEFT: copy ── */}
            <div>
              {/* Badge */}
              <div style={fade(60)}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 100, padding: "5px 14px", marginBottom: 18 }}>
                  <span style={{ width: 7, height: 7, background: "#10B981", borderRadius: "50%", flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#065F46", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>Built for Indian Investors · Free to use</span>
                </div>
              </div>

              {/* H1 */}
              <div style={fade(110)}>
                <h1 style={{ fontSize: "clamp(1.9rem,5.5vw,3.6rem)", fontWeight: 900, color: "#0F172A", lineHeight: 1.06, letterSpacing: "-0.04em", margin: "0 0 10px" }}>
                  Stop guessing
                  <br />about your money.
                  <br />
                  <span style={{ background: "linear-gradient(90deg,#059669 0%,#2563EB 55%,#7C3AED 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    Start knowing.
                  </span>
                </h1>
              </div>

              {/* ★ TAGLINE — prominent, right under H1 ★ */}
              <div style={fade(175)}>
                <p style={{ fontSize: "clamp(15px,2.2vw,19px)", color: "#059669", fontWeight: 700, fontStyle: "italic", margin: "0 0 14px", letterSpacing: "-0.01em" }}>
                  Thoughtful Money, Better Life.
                </p>
              </div>

              {/* Subline */}
              <div style={fade(230)}>
                <p style={{ fontSize: "clamp(13px,1.9vw,15.5px)", color: "#475569", lineHeight: 1.8, maxWidth: 440, marginBottom: 26 }}>
                  One platform to track your complete net worth, see how every mutual fund is truly performing, and plan the life you want — with data, not guesswork.
                </p>
              </div>

              {/* CTAs */}
              <div style={{ ...fade(290), display: "flex", gap: 11, flexWrap: "wrap" }}>
                <Link href="/mutual-fund-match" style={{ textDecoration: "none" }}>
                  <div className="cta-green" style={{ background: "linear-gradient(90deg,#059669,#2563EB)", color: "white", borderRadius: 14, padding: "13px 22px", fontSize: 14, fontWeight: 800, boxShadow: "0 4px 20px rgba(5,150,105,0.28)", display: "flex", alignItems: "center", gap: 7, cursor: "pointer", minHeight: 48 }}>
                    Explore Funds ⚡
                  </div>
                </Link>
                <Link href="/mutual-fund-health-check/dashboard" style={{ textDecoration: "none" }}>
                  <div className="cta-white" style={{ background: "white", color: "#0F172A", borderRadius: 14, padding: "13px 22px", fontSize: 14, fontWeight: 700, border: "1.5px solid #E2E8F0", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: 7, cursor: "pointer", minHeight: 48 }}>
                    Check My Portfolio →
                  </div>
                </Link>
              </div>
            </div>

            {/* ── RIGHT: product preview — desktop only via CSS ── */}
            <div className="hero-preview">
              <div style={{ background: "white", borderRadius: 24, border: "1.5px solid #E2E8F0", boxShadow: "0 24px 80px rgba(0,0,0,0.09)", overflow: "hidden" }}>
                {/* Browser chrome */}
                <div style={{ background: "#F8FAFC", borderBottom: "1px solid #F1F5F9", padding: "9px 14px", display: "flex", alignItems: "center", gap: 6 }}>
                  {["#FC5F57","#FEBC2E","#27C840"].map((c, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
                  <div style={{ flex: 1, background: "#F1F5F9", borderRadius: 5, height: 16, marginLeft: 8, display: "flex", alignItems: "center", paddingLeft: 8 }}>
                    <span style={{ fontSize: 8.5, color: "#94A3B8", fontWeight: 600 }}>nivesify.com/dashboard</span>
                  </div>
                </div>
                {/* Tabs */}
                <div style={{ borderBottom: "1px solid #F1F5F9", padding: "0 14px", display: "flex" }}>
                  {["Overview","Health Check","Fund World"].map((t, i) => (
                    <div key={i} style={{ padding: "8px 11px", fontSize: 10, fontWeight: i === 0 ? 800 : 600, color: i === 0 ? "#2563EB" : "#94A3B8", borderBottom: i === 0 ? "2px solid #2563EB" : "2px solid transparent" }}>{t}</div>
                  ))}
                </div>
                {/* Content */}
                <div style={{ padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 9.5, color: "#94A3B8", fontWeight: 600 }}>Total Net Worth</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: "#0F172A", lineHeight: 1 }}>₹47.3L</div>
                      <div style={{ fontSize: 10.5, color: "#059669", fontWeight: 700, marginTop: 2 }}>↑ +18.4% · ₹7.3L gain</div>
                    </div>
                    <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 10, padding: "6px 10px", textAlign: "center" as const }}>
                      <div style={{ fontSize: 9.5, color: "#059669", fontWeight: 700 }}>Score</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: "#059669" }}>84/100</div>
                    </div>
                  </div>
                  <NetWorthPreview />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          ③ FEATURE CARDS — 2×2, each with live preview visual
          ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ maxWidth: 1160, margin: "0 auto", padding: "clamp(28px,5vw,52px) clamp(14px,4vw,32px)" }}>
        <Reveal>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.20)", borderRadius: 100, padding: "4px 12px", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#1D4ED8", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>Everything in one place</span>
            </div>
            <h2 style={{ fontSize: "clamp(18px,3.5vw,28px)", fontWeight: 900, color: "#0F172A", margin: 0, letterSpacing: "-0.02em" }}>A complete home for your financial life.</h2>
          </div>
        </Reveal>

        <div className="feature-grid">

          {/* Dashboard */}
          <Reveal delay={0}>
            <Link href="/dashboard" style={{ textDecoration: "none", display: "block", height: "100%" }}>
              <div className="card-lift" style={{ background: "white", borderRadius: 20, border: "1.5px solid #E2E8F0", overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" as const, boxShadow: "0 4px 18px rgba(0,0,0,0.05)" }}>
                <div style={{ height: 4, background: "linear-gradient(90deg,#2563EB,#7C3AED)" }} />
                <div style={{ background: "linear-gradient(135deg,#EFF6FF,#F5F3FF)", padding: "16px 16px 12px", borderBottom: "1px solid #F1F5F9" }}>
                  <NetWorthPreview />
                </div>
                <div style={{ padding: "13px 15px 15px", flex: 1, display: "flex", flexDirection: "column" as const }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#EFF6FF", border: "1.5px solid #BFDBFE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>📊</div>
                    <div><h3 style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", margin: 0, lineHeight: 1.2 }}>My Money Dashboard</h3><div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600, marginTop: 1 }}>Know where you stand</div></div>
                  </div>
                  <p style={{ fontSize: 11.5, color: "#475569", lineHeight: 1.7, margin: "0 0 10px", flex: 1 }}>All your investments — mutual funds, PF, FDs, gold, cash. One unified net worth view with allocation breakdown and annual growth.</p>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: "#2563EB" }}>Open Dashboard →</div>
                </div>
              </div>
            </Link>
          </Reveal>

          {/* Health Check */}
          <Reveal delay={80}>
            <Link href="/mutual-fund-health-check/dashboard" style={{ textDecoration: "none", display: "block", height: "100%" }}>
              <div ref={tableRef} className="card-lift" style={{ background: "white", borderRadius: 20, border: "1.5px solid #E2E8F0", overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" as const, boxShadow: "0 4px 18px rgba(0,0,0,0.05)" }}>
                <div style={{ height: 4, background: "linear-gradient(90deg,#059669,#0891B2)" }} />
                <div style={{ background: "linear-gradient(135deg,#ECFDF5,#ECFEFF)", padding: "12px 14px 8px", borderBottom: "1px solid #F1F5F9" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 46px 38px 46px", gap: 7, padding: "2px 0 7px", borderBottom: "1px solid #E2E8F0", marginBottom: 1 }}>
                    {["Fund","Trend","XIRR","Signal"].map((h, i) => <div key={i} style={{ fontSize: 8, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{h}</div>)}
                  </div>
                  {FUNDS.map((f, i) => <FundRow key={i} f={f} animate={tableVis} delay={i * 80} />)}
                </div>
                <div style={{ padding: "13px 15px 15px", flex: 1, display: "flex", flexDirection: "column" as const }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ECFDF5", border: "1.5px solid #A7F3D0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>🏥</div>
                    <div><h3 style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", margin: 0, lineHeight: 1.2 }}>Fund Health Check</h3><div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600, marginTop: 1 }}>Let returns justify effort</div></div>
                  </div>
                  <p style={{ fontSize: 11.5, color: "#475569", lineHeight: 1.7, margin: "0 0 10px", flex: 1 }}>Upload your CAS. Get XIRR, benchmark comparison, and clear Hold / Review / Exit signals for every fund you own.</p>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: "#059669" }}>Check Portfolio →</div>
                </div>
              </div>
            </Link>
          </Reveal>

          {/* MF World */}
          <Reveal delay={120}>
            <Link href="/mutual-fund-match" style={{ textDecoration: "none", display: "block", height: "100%" }}>
              <div className="card-lift" style={{ background: "white", borderRadius: 20, border: "1.5px solid #E2E8F0", overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" as const, boxShadow: "0 4px 18px rgba(0,0,0,0.05)" }}>
                <div style={{ height: 4, background: "linear-gradient(90deg,#7C3AED,#2563EB)" }} />
                <div style={{ background: "linear-gradient(135deg,#F5F3FF,#EFF6FF)", padding: "16px 16px 12px", borderBottom: "1px solid #F1F5F9" }}>
                  <StyleBox />
                </div>
                <div style={{ padding: "13px 15px 15px", flex: 1, display: "flex", flexDirection: "column" as const }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#F5F3FF", border: "1.5px solid #DDD6FE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>🗺️</div>
                    <div><h3 style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", margin: 0, lineHeight: 1.2 }}>The Mutual Fund World</h3><div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600, marginTop: 1 }}>Discover, analyse, decide</div></div>
                  </div>
                  <p style={{ fontSize: 11.5, color: "#475569", lineHeight: 1.7, margin: "0 0 10px", flex: 1 }}>India's full MF universe via live style-box matrix. Compare active vs passive, filter by alpha, find the right fund for every portfolio slot.</p>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: "#7C3AED" }}>Explore Fund World →</div>
                </div>
              </div>
            </Link>
          </Reveal>

          {/* Calculators */}
          <Reveal delay={160}>
            <Link href="/dashboard/calculators" style={{ textDecoration: "none", display: "block", height: "100%" }}>
              <div className="card-lift" style={{ background: "white", borderRadius: 20, border: "1.5px solid #E2E8F0", overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" as const, boxShadow: "0 4px 18px rgba(0,0,0,0.05)" }}>
                <div style={{ height: 4, background: "linear-gradient(90deg,#D97706,#DC2626)" }} />
                <div style={{ background: "linear-gradient(135deg,#FFFBEB,#FEF2F2)", padding: "16px 16px 12px", borderBottom: "1px solid #F1F5F9" }}>
                  <FireViz />
                </div>
                <div style={{ padding: "13px 15px 15px", flex: 1, display: "flex", flexDirection: "column" as const }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#FFFBEB", border: "1.5px solid #FDE68A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>🧮</div>
                    <div><h3 style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", margin: 0, lineHeight: 1.2 }}>Life Calculators</h3><div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600, marginTop: 1 }}>Decide with clarity</div></div>
                  </div>
                  <p style={{ fontSize: 11.5, color: "#475569", lineHeight: 1.7, margin: "0 0 10px", flex: 1 }}>FIRE, retirement, education, big purchases — model real life decisions with numbers. Work backwards from your goal to today's SIP.</p>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: "#D97706" }}>Open Calculators →</div>
                </div>
              </div>
            </Link>
          </Reveal>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          ④ HOW IT WORKS
          ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: "white", borderTop: "1px solid #E2E8F0", borderBottom: "1px solid #E2E8F0", padding: "clamp(28px,5vw,52px) clamp(14px,4vw,32px)" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center" as const, marginBottom: 24 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 100, padding: "4px 12px", marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>How it works</span>
              </div>
              <h2 style={{ fontSize: "clamp(17px,3.5vw,27px)", fontWeight: 900, color: "#0F172A", margin: 0, letterSpacing: "-0.02em" }}>From confusion to clarity in minutes.</h2>
            </div>
          </Reveal>
          <div className="steps-grid">
            {[
              { step: "01", icon: "📤", title: "Upload CAS",          desc: "Import your consolidated account statement or add investments manually across all asset classes.", color: "#2563EB", bg: "#EFF6FF", bd: "#BFDBFE" },
              { step: "02", icon: "⚡", title: "Instant analysis",     desc: "We calculate XIRR, benchmark alpha, information ratio, and portfolio health score automatically.", color: "#059669", bg: "#ECFDF5", bd: "#A7F3D0" },
              { step: "03", icon: "🚦", title: "Clear signals",        desc: "Every fund gets Hold, Review, or Exit. No jargon. Just the next action to take.", color: "#7C3AED", bg: "#F5F3FF", bd: "#DDD6FE" },
              { step: "04", icon: "🚀", title: "Act with confidence",  desc: "Explore better funds, build a plan, track your net worth — in one calm, clutter-free space.", color: "#D97706", bg: "#FFFBEB", bd: "#FDE68A" },
            ].map((s, i) => (
              <Reveal key={i} delay={i * 70}>
                <div style={{ background: s.bg, border: `1.5px solid ${s.bd}`, borderRadius: 15, padding: "clamp(14px,2vw,18px) clamp(12px,2vw,16px)", position: "relative", height: "100%", boxSizing: "border-box" as const }}>
                  <div style={{ position: "absolute", top: 10, right: 12, fontSize: 10, fontWeight: 900, color: s.color, opacity: 0.22 }}>{s.step}</div>
                  <div style={{ fontSize: "clamp(22px,3vw,26px)", marginBottom: 9 }}>{s.icon}</div>
                  <div style={{ fontSize: "clamp(11.5px,1.8vw,13px)", fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.title}</div>
                  <p style={{ fontSize: "clamp(10.5px,1.5vw,11.5px)", color: "#475569", lineHeight: 1.65, margin: 0 }}>{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          ⑤ WEALTH COMPARISON
          ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ maxWidth: 1160, margin: "0 auto", padding: "clamp(28px,5vw,52px) clamp(14px,4vw,32px)" }}>
        <Reveal>
          <div style={{ background: "white", borderRadius: 22, border: "1.5px solid #E2E8F0", padding: "clamp(18px,4vw,34px)", boxShadow: "0 4px 22px rgba(0,0,0,0.05)" }}>
            <div className="wealth-grid">
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(5,150,105,0.08)", border: "1px solid rgba(5,150,105,0.2)", borderRadius: 100, padding: "4px 11px", marginBottom: 10 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: "#059669", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>The real gap</span>
                </div>
                <h2 style={{ fontSize: "clamp(16px,3vw,23px)", fontWeight: 800, color: "#0F172A", margin: "0 0 9px", lineHeight: 1.2, letterSpacing: "-0.02em" }}>
                  ₹10L invested for 10 years.<br />
                  <span style={{ color: "#059669" }}>One decision. Massive difference.</span>
                </h2>
                <p style={{ fontSize: "clamp(12px,1.7vw,13px)", color: "#475569", lineHeight: 1.8, maxWidth: 360, marginBottom: 14 }}>
                  Equity mutual funds held patiently have significantly outperformed FDs over 10 years, after tax. Staying invested in the right vehicle matters more than chasing rates.
                </p>
                <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginBottom: 11 }}>
                  {[
                    { label: "Equity MF", val: "₹34.6L", note: "~14% CAGR", color: "#059669", bg: "#ECFDF5", bd: "#A7F3D0" },
                    { label: "FD post-tax", val: "₹18.8L", note: "~5% real", color: "#94A3B8", bg: "#F8FAFC", bd: "#E2E8F0" },
                  ].map((s, i) => (
                    <div key={i} style={{ background: s.bg, border: `1.5px solid ${s.bd}`, borderRadius: 12, padding: "9px 13px" }}>
                      <div style={{ fontSize: 9, fontWeight: 600, color: "#64748B", marginBottom: 1 }}>{s.label} · {s.note}</div>
                      <div style={{ fontSize: 19, fontWeight: 900, color: s.color }}>{s.val}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 9, padding: "7px 11px", fontSize: 11, color: "#991B1B", fontWeight: 600 }}>
                  ⚠️ Past performance is not a guarantee of future returns.
                </div>
              </div>
              <div><WealthChart /></div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          ⑥ WHY MUTUAL FUNDS TEASER
          ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ maxWidth: 1160, margin: "0 auto", padding: "0 clamp(14px,4vw,32px) clamp(28px,5vw,52px)" }}>
        <Reveal>
          <Link href="/why-mutual-fund" style={{ textDecoration: "none", display: "block" }}>
            <div className="dark-lift whymf-grid" style={{ background: "linear-gradient(135deg,#0F172A 0%,#1E3A8A 55%,#065F46 100%)", borderRadius: 22, padding: "clamp(20px,4vw,38px)", position: "relative", overflow: "hidden", cursor: "pointer" }}>
              <div style={{ position: "absolute", top: -60, right: -60, width: 280, height: 280, background: "radial-gradient(circle,rgba(16,185,129,0.17) 0%,transparent 70%)", pointerEvents: "none" }} />
              <div style={{ position: "relative" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.17)", borderRadius: 100, padding: "4px 12px", marginBottom: 11 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: "#A7F3D0", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>New to investing?</span>
                </div>
                <h2 style={{ fontSize: "clamp(16px,3.5vw,23px)", fontWeight: 900, color: "white", margin: "0 0 8px", lineHeight: 1.2 }}>
                  Why Mutual Funds? Complete Guide →
                </h2>
                <p style={{ fontSize: "clamp(11.5px,1.7vw,12.5px)", color: "rgba(255,255,255,0.60)", margin: "0 0 12px", lineHeight: 1.7, maxWidth: 480 }}>
                  From what a mutual fund is, to NAV, pros &amp; cons, costs, the Iron-Clad Framework, and how to start — all in one place.
                </p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {["What is a MF","How NAV works","Pros & Cons","Iron-Clad Structure","3 Pillars","How to Start","FAQs"].map((tag, i) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 100, padding: "3px 9px", fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.80)" }}>{tag}</div>
                  ))}
                </div>
              </div>
              <div className="whymf-book" style={{ background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.17)", borderRadius: 16, padding: "18px 20px", textAlign: "center" as const, flexShrink: 0, position: "relative" }}>
                <div style={{ fontSize: 32, marginBottom: 7 }}>📖</div>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: "white", marginBottom: 3 }}>Read the Guide</div>
                <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.50)" }}>Free · No sign-up</div>
              </div>
            </div>
          </Link>
        </Reveal>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          ⑦ PHILOSOPHY + QUICK LINKS
          ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: "white", borderTop: "1px solid #E2E8F0", padding: "clamp(28px,5vw,52px) clamp(14px,4vw,32px)" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div className="philosophy-grid">

            <Reveal>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(5,150,105,0.08)", border: "1px solid rgba(5,150,105,0.2)", borderRadius: 100, padding: "4px 12px", marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#059669", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>Our philosophy</span>
                </div>
                {/* ★ Tagline again — anchors the philosophy section ★ */}
                <h2 style={{ fontSize: "clamp(17px,3vw,24px)", fontWeight: 900, color: "#0F172A", margin: "0 0 4px", lineHeight: 1.2, letterSpacing: "-0.02em" }}>
                  Thoughtful Money,<br />Better Life.
                </h2>
                <blockquote style={{ fontSize: "clamp(12.5px,1.8vw,14px)", color: "#475569", fontStyle: "italic", borderLeft: "3px solid #A7F3D0", paddingLeft: 14, margin: "10px 0 14px", lineHeight: 1.7 }}>
                  "Enough is not a number. It's the moment money stops interfering with life."
                </blockquote>
                <p style={{ fontSize: "clamp(12px,1.6vw,13px)", color: "#64748B", lineHeight: 1.8, maxWidth: 400, marginBottom: 16 }}>
                  Nivesify is a calm, non-transactional space for Indian investors. No ads. No product push. No spam. Just clear, honest help with your money.
                </p>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                  {["✅ No ads","✅ No product push","✅ No spam","✅ Just clarity"].map((t, i) => (
                    <div key={i} style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 100, padding: "3px 11px", fontSize: 11, fontWeight: 700, color: "#059669" }}>{t}</div>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.09em", textTransform: "uppercase" as const, marginBottom: 11 }}>Quick access</div>
                <div className="quicklinks-grid">
                  {[
                    { href: "/dashboard",                          icon: "📊", label: "Dashboard",      desc: "Net worth" },
                    { href: "/mutual-fund-health-check/dashboard", icon: "🏥", label: "Health Check",    desc: "XIRR · signals" },
                    { href: "/mutual-fund-match",                  icon: "🗺️", label: "MF World",        desc: "Explore funds" },
                    { href: "/why-mutual-fund",                    icon: "📖", label: "Why MF?",         desc: "Beginner guide" },
                    { href: "/dashboard/calculators",              icon: "🧮", label: "Calculators",     desc: "FIRE · goals" },
                    { href: "/mutual-fund-match",                  icon: "🔬", label: "Compare Funds",   desc: "Side by side" },
                  ].map((l, i) => (
                    <Link key={i} href={l.href} style={{ textDecoration: "none" }}>
                      <div className="link-lift" style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "clamp(10px,1.5vw,12px)", cursor: "pointer", minHeight: 76 }}>
                        <div style={{ fontSize: 18, marginBottom: 4 }}>{l.icon}</div>
                        <div style={{ fontSize: "clamp(10.5px,1.4vw,11.5px)", fontWeight: 800, color: "#0F172A", marginBottom: 1 }}>{l.label}</div>
                        <div style={{ fontSize: "clamp(9px,1.2vw,10px)", color: "#94A3B8", fontWeight: 600 }}>{l.desc}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </Reveal>

          </div>
        </div>
      </section>

    </main>
  );
}