"use client";

import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";

/* ─────────────────────────────────────────────────────────────────────────────
   DESIGN SYSTEM — matches WhyMutualFunds inner page exactly
   Font: DM Sans (already loaded globally)
   Colors: #2563EB blue · #059669 green · #7C3AED purple · #D97706 amber
           #DC2626 red · #0891B2 cyan · #0F172A near-black · #475569 body
   ───────────────────────────────────────────────────────────────────────── */

/* ── SCROLL REVEAL ─────────────────────────────────────────────────────── */
function Reveal({
  children,
  delay = 0,
  style = {},
}: {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const ob = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); ob.disconnect(); } },
      { threshold: 0.06 }
    );
    if (ref.current) ob.observe(ref.current);
    return () => ob.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ── SPARKLINE SVG ─────────────────────────────────────────────────────── */
function Spark({
  pts,
  color,
  w = 72,
  h = 28,
}: {
  pts: number[];
  color: string;
  w?: number;
  h?: number;
}) {
  const mn = Math.min(...pts), mx = Math.max(...pts);
  const rng = mx - mn || 1;
  const xs = pts.map((_, i) => (i / (pts.length - 1)) * w);
  const ys = pts.map((v) => h - ((v - mn) / rng) * (h - 6) - 3);
  const line = xs.map((x, i) => `${i ? "L" : "M"}${x},${ys[i]}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const uid = color.replace(/[^a-z0-9]/gi, "");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`sp-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sp-${uid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r="3" fill={color} />
    </svg>
  );
}

/* ── DONUT CHART ───────────────────────────────────────────────────────── */
function Donut({ segments, size = 120 }: { segments: { pct: number; color: string; label: string }[]; size?: number }) {
  const r = size * 0.38;
  const cx = size / 2, cy = size / 2;
  const C = 2 * Math.PI * r;
  let cum = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segments.map((s, i) => {
        const dash = (s.pct / 100) * C;
        const offset = C - (cum / 100) * C;
        cum += s.pct;
        return (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth={size * 0.145}
            strokeDasharray={`${dash} ${C - dash}`}
            strokeDashoffset={offset}
            style={{ transformOrigin: `${cx}px ${cy}px`, transform: "rotate(-90deg)" }} />
        );
      })}
      <circle cx={cx} cy={cy} r={r * 0.62} fill="white" />
      <text x={cx} y={cy - 5} textAnchor="middle" fontSize={size * 0.09} fontWeight="800" fill="#0F172A" fontFamily="DM Sans,system-ui">Net Worth</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize={size * 0.085} fill="#64748B" fontFamily="DM Sans,system-ui">₹47.3L</text>
    </svg>
  );
}

/* ── WEALTH COMPARISON CHART (hero right panel) ────────────────────────── */
function WealthChart() {
  const w = 300, h = 130;
  const fd = [10, 10.7, 11.5, 12.3, 13.2, 14.2, 15.2, 16.3, 17.5, 18.8];
  const mf = [10, 11.4, 13.1, 15.0, 17.3, 19.8, 22.8, 26.2, 30.1, 34.6];
  const mn = 8, mx = 37;
  const toX = (i: number) => 10 + (i / 9) * (w - 20);
  const toY = (v: number) => h - 12 - ((v - mn) / (mx - mn)) * (h - 28);
  const fdPath = fd.map((v, i) => `${i ? "L" : "M"}${toX(i)},${toY(v)}`).join(" ");
  const mfPath = mf.map((v, i) => `${i ? "L" : "M"}${toX(i)},${toY(v)}`).join(" ");
  const mfArea = `${mfPath} L${toX(9)},${h} L${toX(0)},${h} Z`;
  const fdArea = `${fdPath} L${toX(9)},${h} L${toX(0)},${h} Z`;
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <defs>
          <linearGradient id="wm" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#059669" stopOpacity="0.20" /><stop offset="100%" stopColor="#059669" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="wf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#94A3B8" stopOpacity="0.12" /><stop offset="100%" stopColor="#94A3B8" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.3, 0.6].map((p, i) => (
          <line key={i} x1="10" y1={h * p} x2={w - 10} y2={h * p} stroke="#F1F5F9" strokeWidth="1" />
        ))}
        <path d={fdArea} fill="url(#wf)" />
        <path d={fdPath} fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="4 3" />
        <path d={mfArea} fill="url(#wm)" />
        <path d={mfPath} fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* End labels */}
        <circle cx={toX(9)} cy={toY(mf[9])} r="4" fill="#059669" />
        <rect x={toX(9) + 6} y={toY(mf[9]) - 9} width="46" height="16" rx="4" fill="#059669" />
        <text x={toX(9) + 10} y={toY(mf[9]) + 3} fontSize="8.5" fontWeight="800" fill="white" fontFamily="DM Sans,system-ui">₹34.6L MF</text>
        <circle cx={toX(9)} cy={toY(fd[9])} r="3" fill="#94A3B8" />
        <text x={toX(9) + 6} y={toY(fd[9]) + 4} fontSize="8" fill="#94A3B8" fontFamily="DM Sans,system-ui">₹18.8L FD</text>
        {/* Year axis */}
        {["Y1","","Y3","","Y5","","Y7","","","Y10"].map((l, i) => l && (
          <text key={i} x={toX(i)} y={h} fontSize="7.5" fill="#CBD5E1" fontFamily="DM Sans,system-ui" textAnchor="middle">{l}</text>
        ))}
      </svg>
      <div style={{ display:"flex", gap:"14px", justifyContent:"center", marginTop:"6px" }}>
        {[{color:"#059669",label:"Equity MF (~14% CAGR)",dash:false},{color:"#CBD5E1",label:"FD (post-tax ~5%)",dash:true}].map((l,i)=>(
          <div key={i} style={{ display:"flex", alignItems:"center", gap:"5px" }}>
            <div style={{ width:"18px", height:"2px", background: l.dash ? "none" : l.color, backgroundImage: l.dash ? `repeating-linear-gradient(90deg,${l.color} 0,${l.color} 4px,transparent 4px,transparent 7px)` : "none", borderRadius:"1px" }} />
            <span style={{ fontSize:"10px", color:"#64748B", fontWeight:600 }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── FUND TABLE (health check preview) ─────────────────────────────────── */
const funds = [
  { name:"Mirae Asset Large Cap", cat:"Large Cap", xirr:16.2, bench:14.1, alpha:"+2.1%", rating:"HOLD"  as const, pts:[38,40,43,41,47,50,52,55,57,62], color:"#059669" },
  { name:"Parag Parikh Flexi Cap", cat:"Flexi Cap",  xirr:18.7, bench:14.1, alpha:"+4.6%", rating:"HOLD"  as const, pts:[35,38,43,46,44,50,55,57,62,67], color:"#2563EB" },
  { name:"HDFC Mid Cap Opp.",      cat:"Mid Cap",    xirr:11.3, bench:14.1, alpha:"-2.8%", rating:"REVIEW" as const, pts:[50,48,51,46,44,47,43,45,44,44], color:"#D97706" },
  { name:"SBI Small Cap",          cat:"Small Cap",  xirr:9.1,  bench:14.1, alpha:"-5.0%", rating:"EXIT"   as const, pts:[55,52,48,44,40,42,38,35,33,31], color:"#DC2626" },
];
const ratingStyle = {
  HOLD:   { c:"#059669", bg:"#ECFDF5", bd:"#A7F3D0" },
  REVIEW: { c:"#D97706", bg:"#FFFBEB", bd:"#FDE68A" },
  EXIT:   { c:"#DC2626", bg:"#FEF2F2", bd:"#FECACA" },
};

function FundRow({ fund, animate, delay }: { fund: typeof funds[0]; animate: boolean; delay: number }) {
  const rs = ratingStyle[fund.rating];
  return (
    <div style={{
      display:"grid", gridTemplateColumns:"1fr 56px 48px 52px",
      gap:"8px", alignItems:"center",
      padding:"9px 0", borderBottom:"1px solid #F1F5F9",
      opacity: animate ? 1 : 0,
      transform: animate ? "translateX(0)" : "translateX(-10px)",
      transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
    }}>
      <div>
        <div style={{ fontSize:"11px", fontWeight:700, color:"#0F172A", lineHeight:1.3 }}>{fund.name}</div>
        <div style={{ fontSize:"9.5px", color: fund.xirr >= fund.bench ? "#059669" : "#DC2626", fontWeight:600, marginTop:"1px" }}>
          XIRR {fund.xirr}% · {fund.alpha} alpha
        </div>
      </div>
      <Spark pts={fund.pts} color={fund.color} w={52} h={22} />
      <div style={{ fontSize:"10px", fontWeight:700, color: fund.xirr >= fund.bench ? "#059669" : "#DC2626" }}>
        {fund.xirr}%
      </div>
      <div style={{ fontSize:"9px", fontWeight:800, padding:"2px 6px", borderRadius:"100px", background:rs.bg, border:`1px solid ${rs.bd}`, color:rs.c, textAlign:"center", whiteSpace:"nowrap" as const }}>
        {fund.rating}
      </div>
    </div>
  );
}

/* ── STYLE BOX GRID (MF World preview) ─────────────────────────────────── */
function StyleBox() {
  const cols = ["Value","Blend","Momentum","Best Ideas"];
  const rows = ["Large","Mid","Small","Flexi"];
  const filled: Record<string,{color:string;label:string}> = {
    "0-0":{color:"#2563EB",label:"Nifty 50 ETF"}, "0-1":{color:"#7C3AED",label:"UTI Nifty"}, "0-3":{color:"#059669",label:"PP Flexi"},
    "1-1":{color:"#D97706",label:"HDFC MidCap"}, "1-2":{color:"#0891B2",label:"Axis MidCap"},
    "2-0":{color:"#DC2626",label:"SBI SmCap"},  "2-1":{color:"#D97706",label:"Nippon SmCap"},
    "3-1":{color:"#059669",label:"Mirae Flexi"}, "3-3":{color:"#7C3AED",label:"PPFAS"},
  };
  return (
    <div>
      <div style={{ fontSize:"10px", fontWeight:700, color:"#94A3B8", letterSpacing:"0.08em", textTransform:"uppercase" as const, marginBottom:"8px" }}>Live Fund Style Matrix</div>
      <div style={{ display:"grid", gridTemplateColumns:"40px repeat(4,1fr)", gap:"3px" }}>
        <div />
        {cols.map((c,i) => <div key={i} style={{ fontSize:"7.5px", fontWeight:700, color:"#64748B", textAlign:"center", padding:"2px 0" }}>{c}</div>)}
        {rows.map((row,ri) => [
          <div key={`lbl-${ri}`} style={{ fontSize:"8.5px", fontWeight:700, color:"#94A3B8", display:"flex", alignItems:"center" }}>{row}</div>,
          ...cols.map((_,ci) => {
            const k = `${ri}-${ci}`, h = filled[k];
            return (
              <div key={k} style={{ height:"24px", borderRadius:"5px", background: h ? `${h.color}1E` : "#F8FAFC", border:`1.5px solid ${h ? h.color+"55" : "#E2E8F0"}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                {h && <span style={{ fontSize:"6.5px", fontWeight:800, color:h.color, textAlign:"center", lineHeight:1.1, padding:"0 2px" }}>{h.label}</span>}
              </div>
            );
          })
        ])}
      </div>
    </div>
  );
}

/* ── FIRE CALCULATOR VISUAL ─────────────────────────────────────────────── */
function FireViz() {
  const milestones = [
    { label:"Car", yr:"2Y",  val:"₹8L",   pct:82, color:"#2563EB" },
    { label:"Home",yr:"8Y",  val:"₹60L",  pct:42, color:"#7C3AED" },
    { label:"Edu", yr:"12Y", val:"₹25L",  pct:28, color:"#D97706" },
    { label:"FIRE",yr:"20Y", val:"₹3Cr",  pct:14, color:"#059669" },
  ];
  return (
    <div>
      <div style={{ fontSize:"10px", fontWeight:700, color:"#94A3B8", letterSpacing:"0.08em", textTransform:"uppercase" as const, marginBottom:"10px" }}>Life Goal Planner</div>
      <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
        {milestones.map((m,i) => (
          <div key={i}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"3px" }}>
              <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
                <span style={{ fontSize:"10px", fontWeight:700, color:m.color }}>{m.label}</span>
                <span style={{ fontSize:"9px", color:"#94A3B8", fontWeight:600 }}>in {m.yr}</span>
              </div>
              <span style={{ fontSize:"10px", fontWeight:800, color:m.color }}>{m.val}</span>
            </div>
            <div style={{ height:"7px", background:"#F1F5F9", borderRadius:"100px", overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${m.pct}%`, background:`linear-gradient(90deg, ${m.color}, ${m.color}99)`, borderRadius:"100px", transition:"width 1s ease" }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop:"12px", background:"#ECFDF5", border:"1px solid #A7F3D0", borderRadius:"9px", padding:"7px 10px", fontSize:"10px", fontWeight:700, color:"#059669" }}>
        🎯 On track for FIRE at 47 · ₹3.2Cr corpus projected
      </div>
    </div>
  );
}

/* ── NET WORTH TREND (dashboard preview) ───────────────────────────────── */
function NetWorthViz() {
  const segs = [
    { pct:42, color:"#2563EB", label:"Equity MF",  val:"₹19.9L" },
    { pct:18, color:"#059669", label:"Debt MF",    val:"₹8.5L"  },
    { pct:16, color:"#D97706", label:"PF / EPF",   val:"₹7.6L"  },
    { pct:14, color:"#7C3AED", label:"Gold",        val:"₹6.6L"  },
    { pct:10, color:"#0891B2", label:"FD / Cash",  val:"₹4.7L"  },
  ];
  return (
    <div style={{ display:"flex", gap:"16px", alignItems:"center" }}>
      <div style={{ flexShrink:0 }}>
        <Donut segments={segs} size={110} />
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:"9px", color:"#94A3B8", fontWeight:600, marginBottom:"4px", textTransform:"uppercase" as const, letterSpacing:"0.07em" }}>Allocation Breakdown</div>
        {segs.map((s,i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"4px" }}>
            <div style={{ width:"8px", height:"8px", borderRadius:"2px", background:s.color, flexShrink:0 }} />
            <span style={{ fontSize:"10.5px", color:"#374151", fontWeight:600, flex:1 }}>{s.label}</span>
            <span style={{ fontSize:"10.5px", fontWeight:800, color:s.color }}>{s.val}</span>
          </div>
        ))}
        <div style={{ marginTop:"6px", borderTop:"1px solid #F1F5F9", paddingTop:"6px", display:"flex", justifyContent:"space-between" }}>
          <span style={{ fontSize:"11px", fontWeight:800, color:"#0F172A" }}>Total</span>
          <span style={{ fontSize:"11px", fontWeight:900, color:"#059669" }}>₹47.3L ↑18.4%</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN PAGE
   ───────────────────────────────────────────────────────────────────────── */
export default function Home() {
  /* hero entrance */
  const [entered, setEntered] = useState(false);
  useEffect(() => { const t = setTimeout(() => setEntered(true), 60); return () => clearTimeout(t); }, []);

  /* fund table animation trigger */
  const tableRef = useRef<HTMLDivElement>(null);
  const [tableVis, setTableVis] = useState(false);
  useEffect(() => {
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setTableVis(true); ob.disconnect(); } }, { threshold: 0.2 });
    if (tableRef.current) ob.observe(tableRef.current);
    return () => ob.disconnect();
  }, []);

  const ease = (delay: number) => ({
    opacity: entered ? 1 : 0,
    transform: entered ? "translateY(0)" : "translateY(20px)",
    transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
  });

  return (
    <main style={{ background:"#F8FAFC", minHeight:"100vh", fontFamily:"'DM Sans', system-ui, -apple-system, sans-serif", color:"#1F2937" }}>

      {/* ═══════════════════════════════════════════════════════════════════
          HERO — two-column: left = copy + CTAs, right = live product preview
          ═══════════════════════════════════════════════════════════════════ */}
      <section style={{
        background:"linear-gradient(150deg, #F0FDF4 0%, #EFF6FF 50%, #FFF7ED 100%)",
        borderBottom:"1px solid #E2E8F0",
        position:"relative", overflow:"hidden",
        minHeight:"clamp(520px, 78vh, 720px)",
        display:"flex", alignItems:"center",
      }}>
        {/* Dot grid */}
        <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle at 1px 1px, rgba(16,185,129,0.07) 1px, transparent 0)", backgroundSize:"28px 28px", pointerEvents:"none" }} />
        {/* Glow blobs */}
        <div style={{ position:"absolute", top:-100, right:-80, width:"600px", height:"600px", background:"radial-gradient(circle,rgba(59,130,246,0.09) 0%,transparent 65%)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-80, left:-60, width:"500px", height:"500px", background:"radial-gradient(circle,rgba(16,185,129,0.08) 0%,transparent 65%)", pointerEvents:"none" }} />

        <div style={{
          maxWidth:"1160px", margin:"0 auto", width:"100%",
          padding:"clamp(48px,7vw,88px) clamp(16px,4vw,32px) clamp(40px,6vw,64px)",
          display:"grid", gridTemplateColumns:"1fr 1.05fr",
          gap:"clamp(24px,5vw,60px)", alignItems:"center",
        }}>

          {/* ── LEFT: headline + value props + CTAs ── */}
          <div>
            {/* Badge */}
            <div style={ease(60)}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:"8px", background:"rgba(16,185,129,0.10)", border:"1px solid rgba(16,185,129,0.25)", borderRadius:"100px", padding:"5px 14px", marginBottom:"22px" }}>
                <span style={{ width:"7px", height:"7px", background:"#10B981", borderRadius:"50%" }} />
                <span style={{ fontSize:"11px", fontWeight:700, color:"#065F46", letterSpacing:"0.08em", textTransform:"uppercase" as const }}>Built for Indian Investors · Free to use</span>
              </div>
            </div>

            {/* H1 */}
            <div style={ease(120)}>
              <h1 style={{ fontSize:"clamp(2.2rem,5vw,3.8rem)", fontWeight:900, color:"#0F172A", lineHeight:1.05, letterSpacing:"-0.04em", margin:"0 0 18px" }}>
                Stop guessing
                <br />about your money.
                <br />
                <span style={{ background:"linear-gradient(90deg,#059669 0%,#2563EB 55%,#7C3AED 100%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                  Start knowing.
                </span>
              </h1>
            </div>

            {/* Subhead */}
            <div style={ease(200)}>
              <p style={{ fontSize:"clamp(14px,2vw,16.5px)", color:"#475569", lineHeight:1.8, maxWidth:"440px", marginBottom:"28px" }}>
                One platform to track your entire net worth, see how every mutual fund is really performing, and plan the life you actually want — with numbers, not hope.
              </p>
            </div>

            {/* Value props — horizontal chips */}
            <div style={{ ...ease(260), display:"flex", flexWrap:"wrap", gap:"8px", marginBottom:"28px" }}>
              {[
                {icon:"📊", text:"Full net worth view"},
                {icon:"🏥", text:"Fund health signals"},
                {icon:"🗺️", text:"Live style matrix"},
                {icon:"🧮", text:"FIRE calculator"},
              ].map((p,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:"6px", background:"white", border:"1.5px solid #E2E8F0", borderRadius:"100px", padding:"5px 12px", fontSize:"11.5px", fontWeight:700, color:"#374151", boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
                  <span>{p.icon}</span>{p.text}
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div style={{ ...ease(320), display:"flex", gap:"12px", flexWrap:"wrap" }}>
              <Link href="/mutual-fund-match" style={{ textDecoration:"none" }}>
                <div style={{ background:"linear-gradient(90deg,#059669,#2563EB)", color:"white", borderRadius:"14px", padding:"13px 22px", fontSize:"14px", fontWeight:800, boxShadow:"0 4px 20px rgba(5,150,105,0.28)", display:"flex", alignItems:"center", gap:"7px", cursor:"pointer", transition:"transform 0.2s,box-shadow 0.2s" }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform="translateY(-2px)";(e.currentTarget as HTMLDivElement).style.boxShadow="0 8px 32px rgba(5,150,105,0.38)";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform="translateY(0)";(e.currentTarget as HTMLDivElement).style.boxShadow="0 4px 20px rgba(5,150,105,0.28)";}}>
                  Explore Mutual Funds ⚡
                </div>
              </Link>
              <Link href="/mutual-fund-health-check/dashboard" style={{ textDecoration:"none" }}>
                <div style={{ background:"white", color:"#0F172A", borderRadius:"14px", padding:"13px 22px", fontSize:"14px", fontWeight:700, border:"1.5px solid #E2E8F0", boxShadow:"0 2px 8px rgba(0,0,0,0.05)", display:"flex", alignItems:"center", gap:"7px", cursor:"pointer", transition:"transform 0.2s,box-shadow 0.2s" }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform="translateY(-2px)";(e.currentTarget as HTMLDivElement).style.boxShadow="0 6px 20px rgba(0,0,0,0.09)";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform="translateY(0)";(e.currentTarget as HTMLDivElement).style.boxShadow="0 2px 8px rgba(0,0,0,0.05)";}}>
                  Check My Portfolio →
                </div>
              </Link>
            </div>
          </div>

          {/* ── RIGHT: product preview card ── */}
          <div style={ease(380)}>
            <div style={{ background:"white", borderRadius:"24px", border:"1.5px solid #E2E8F0", boxShadow:"0 24px 80px rgba(0,0,0,0.09)", overflow:"hidden" }}>
              {/* Card chrome bar */}
              <div style={{ background:"#F8FAFC", borderBottom:"1px solid #F1F5F9", padding:"10px 16px", display:"flex", alignItems:"center", gap:"6px" }}>
                {["#FC5F57","#FEBC2E","#27C840"].map((c,i)=><div key={i} style={{ width:"11px", height:"11px", borderRadius:"50%", background:c }} />)}
                <div style={{ flex:1, background:"#F1F5F9", borderRadius:"6px", height:"18px", marginLeft:"8px", display:"flex", alignItems:"center", paddingLeft:"8px" }}>
                  <span style={{ fontSize:"9px", color:"#94A3B8", fontWeight:600 }}>nivesify.com/dashboard</span>
                </div>
              </div>

              {/* Tabs inside preview */}
              <div style={{ borderBottom:"1px solid #F1F5F9", padding:"0 16px", display:"flex", gap:"0" }}>
                {["Overview","Health Check","Fund World"].map((t,i)=>(
                  <div key={i} style={{ padding:"9px 12px", fontSize:"10.5px", fontWeight: i===0 ? 800 : 600, color: i===0 ? "#2563EB" : "#94A3B8", borderBottom: i===0 ? "2px solid #2563EB" : "2px solid transparent", cursor:"default" }}>{t}</div>
                ))}
              </div>

              {/* Preview content */}
              <div style={{ padding:"16px 18px" }}>
                {/* Net worth header */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"14px" }}>
                  <div>
                    <div style={{ fontSize:"10px", color:"#94A3B8", fontWeight:600 }}>Total Net Worth</div>
                    <div style={{ fontSize:"26px", fontWeight:900, color:"#0F172A", lineHeight:1 }}>₹47.3L</div>
                    <div style={{ fontSize:"11px", color:"#059669", fontWeight:700, marginTop:"3px" }}>↑ +18.4% this year · ₹7.3L gain</div>
                  </div>
                  <div style={{ background:"#ECFDF5", border:"1px solid #A7F3D0", borderRadius:"10px", padding:"6px 10px", textAlign:"center" }}>
                    <div style={{ fontSize:"10px", color:"#059669", fontWeight:700 }}>Portfolio Score</div>
                    <div style={{ fontSize:"20px", fontWeight:900, color:"#059669" }}>84/100</div>
                  </div>
                </div>
                <NetWorthViz />
              </div>
            </div>
          </div>

        </div>

        {/* Mobile responsive collapse */}
        <style>{`@media(max-width:720px){section>div[style*="grid-template-columns:1fr 1.05fr"]{grid-template-columns:1fr !important;}}`}</style>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          PROBLEM STRIP — two-column pain points
          ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ maxWidth:"1160px", margin:"0 auto", padding:"clamp(40px,6vw,64px) clamp(16px,4vw,32px)" }}>
        <Reveal>
          <div style={{ background:"linear-gradient(135deg,#FFF7ED,#FEF2F2)", border:"1.5px solid #FDE68A", borderRadius:"24px", padding:"clamp(22px,4vw,40px)", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"clamp(20px,4vw,52px)", alignItems:"center", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:-24, right:-18, fontSize:"96px", opacity:0.05, pointerEvents:"none" }}>🤔</div>

            <div>
              <div style={{ display:"inline-flex", alignItems:"center", gap:"6px", background:"rgba(220,38,38,0.10)", border:"1px solid rgba(220,38,38,0.20)", borderRadius:"100px", padding:"4px 13px", marginBottom:"12px" }}>
                <span style={{ fontSize:"10.5px", fontWeight:700, color:"#DC2626", letterSpacing:"0.08em", textTransform:"uppercase" as const }}>The Problem</span>
              </div>
              <h2 style={{ fontSize:"clamp(18px,3vw,26px)", fontWeight:800, color:"#0F172A", margin:"0 0 10px", lineHeight:1.2 }}>
                Most Indian investors<br />fly completely blind.
              </h2>
              <p style={{ fontSize:"13.5px", color:"#475569", lineHeight:1.8, margin:0, maxWidth:"400px" }}>
                No idea how their funds compare to benchmarks. No clear view of total net worth. No plan for the life they want. Nivesify fixes that — in minutes.
              </p>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:"9px" }}>
              {[
                {icon:"❓", text:"Don't know if their funds beat benchmarks — most don't",            color:"#DC2626"},
                {icon:"💸", text:"Paying 1.5–2% fees on funds that underperform index funds",        color:"#D97706"},
                {icon:"🗂️", text:"No unified view of net worth across MF, PF, gold, FD",           color:"#7C3AED"},
                {icon:"😰", text:"Making emotional buy/sell decisions without a data-backed plan",   color:"#2563EB"},
              ].map((p,i)=>(
                <div key={i} style={{ display:"flex", gap:"10px", alignItems:"flex-start", background:"white", border:"1px solid #F1F5F9", borderRadius:"12px", padding:"10px 13px", boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
                  <span style={{ fontSize:"15px", flexShrink:0 }}>{p.icon}</span>
                  <span style={{ fontSize:"11.5px", color:"#374151", lineHeight:1.55, fontWeight:500 }}>{p.text}</span>
                </div>
              ))}
            </div>

            <style>{`@media(max-width:640px){.problem-grid{grid-template-columns:1fr !important}}`}</style>
          </div>
        </Reveal>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FEATURE CARDS — 2×2 grid, each with live data preview inside
          ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ maxWidth:"1160px", margin:"0 auto", padding:"0 clamp(16px,4vw,32px) clamp(40px,6vw,64px)" }}>
        <Reveal>
          <div style={{ marginBottom:"28px" }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:"6px", background:"rgba(37,99,235,0.08)", border:"1px solid rgba(37,99,235,0.20)", borderRadius:"100px", padding:"4px 13px", marginBottom:"10px" }}>
              <span style={{ fontSize:"11px", fontWeight:700, color:"#1D4ED8", letterSpacing:"0.08em", textTransform:"uppercase" as const }}>Everything in one place</span>
            </div>
            <h2 style={{ fontSize:"clamp(20px,3.5vw,32px)", fontWeight:900, color:"#0F172A", margin:0, letterSpacing:"-0.02em" }}>
              A complete home for your financial life.
            </h2>
          </div>
        </Reveal>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"16px" }}>

          {/* ── Card 1: Money Dashboard ── */}
          <Reveal delay={0}>
            <Link href="/dashboard" style={{ textDecoration:"none", display:"block", height:"100%" }}>
              <div style={{ background:"white", borderRadius:"24px", border:"1.5px solid #E2E8F0", overflow:"hidden", height:"100%", display:"flex", flexDirection:"column", boxShadow:"0 4px 20px rgba(0,0,0,0.05)", transition:"box-shadow 0.3s,transform 0.3s" }}
                onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow="0 20px 60px rgba(0,0,0,0.10)";(e.currentTarget as HTMLDivElement).style.transform="translateY(-4px)";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow="0 4px 20px rgba(0,0,0,0.05)";(e.currentTarget as HTMLDivElement).style.transform="translateY(0)";}}>
                <div style={{ height:"4px", background:"linear-gradient(90deg,#2563EB,#7C3AED)" }} />
                {/* Visual panel */}
                <div style={{ background:"linear-gradient(135deg,#EFF6FF,#F5F3FF)", padding:"20px 20px 14px", borderBottom:"1px solid #F1F5F9", position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle at 80% 40%, #2563EB14 0%,transparent 60%)" }} />
                  <div style={{ position:"relative" }}><NetWorthViz /></div>
                </div>
                {/* Text */}
                <div style={{ padding:"16px 18px 18px", flex:1, display:"flex", flexDirection:"column" }}>
                  <div style={{ display:"flex", gap:"9px", alignItems:"flex-start", marginBottom:"7px" }}>
                    <div style={{ width:"34px", height:"34px", borderRadius:"9px", background:"#EFF6FF", border:"1.5px solid #BFDBFE", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px", flexShrink:0 }}>📊</div>
                    <div>
                      <h3 style={{ fontSize:"15px", fontWeight:800, color:"#0F172A", margin:0, lineHeight:1.2 }}>My Money Dashboard</h3>
                      <div style={{ fontSize:"10px", color:"#94A3B8", fontWeight:600, marginTop:"2px", fontStyle:"italic" }}>Know where you stand</div>
                    </div>
                  </div>
                  <p style={{ fontSize:"12px", color:"#475569", lineHeight:1.7, margin:"0 0 12px", flex:1 }}>Add all your investments — mutual funds, PF, FDs, gold, cash. See your complete net worth, allocation breakdown, and year-on-year growth in one unified view.</p>
                  <div style={{ fontSize:"12px", fontWeight:700, color:"#2563EB" }}>Open Dashboard →</div>
                </div>
              </div>
            </Link>
          </Reveal>

          {/* ── Card 2: Fund Health Check ── */}
          <Reveal delay={80}>
            <Link href="/mutual-fund-health-check/dashboard" style={{ textDecoration:"none", display:"block", height:"100%" }}>
              <div ref={tableRef} style={{ background:"white", borderRadius:"24px", border:"1.5px solid #E2E8F0", overflow:"hidden", height:"100%", display:"flex", flexDirection:"column", boxShadow:"0 4px 20px rgba(0,0,0,0.05)", transition:"box-shadow 0.3s,transform 0.3s" }}
                onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow="0 20px 60px rgba(0,0,0,0.10)";(e.currentTarget as HTMLDivElement).style.transform="translateY(-4px)";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow="0 4px 20px rgba(0,0,0,0.05)";(e.currentTarget as HTMLDivElement).style.transform="translateY(0)";}}>
                <div style={{ height:"4px", background:"linear-gradient(90deg,#059669,#0891B2)" }} />
                {/* Visual panel */}
                <div style={{ background:"linear-gradient(135deg,#ECFDF5,#ECFEFF)", padding:"16px 18px 12px", borderBottom:"1px solid #F1F5F9", position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle at 80% 40%, #05996914 0%,transparent 60%)" }} />
                  <div style={{ position:"relative" }}>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 56px 46px 52px", gap:"8px", padding:"4px 0 8px", borderBottom:"1px solid #E2E8F0", marginBottom:"2px" }}>
                      {["Fund","Trend","XIRR","Signal"].map((h,i)=><div key={i} style={{ fontSize:"9px", fontWeight:700, color:"#94A3B8", textTransform:"uppercase" as const, letterSpacing:"0.06em" }}>{h}</div>)}
                    </div>
                    {funds.map((f,i)=><FundRow key={i} fund={f} animate={tableVis} delay={i*80} />)}
                  </div>
                </div>
                <div style={{ padding:"16px 18px 18px", flex:1, display:"flex", flexDirection:"column" }}>
                  <div style={{ display:"flex", gap:"9px", alignItems:"flex-start", marginBottom:"7px" }}>
                    <div style={{ width:"34px", height:"34px", borderRadius:"9px", background:"#ECFDF5", border:"1.5px solid #A7F3D0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px", flexShrink:0 }}>🏥</div>
                    <div>
                      <h3 style={{ fontSize:"15px", fontWeight:800, color:"#0F172A", margin:0, lineHeight:1.2 }}>Mutual Fund Health Check</h3>
                      <div style={{ fontSize:"10px", color:"#94A3B8", fontWeight:600, marginTop:"2px", fontStyle:"italic" }}>Let returns justify effort</div>
                    </div>
                  </div>
                  <p style={{ fontSize:"12px", color:"#475569", lineHeight:1.7, margin:"0 0 12px", flex:1 }}>Upload your CAS. Get fund-level XIRR, benchmark comparison, alpha tracking, and clear action signals — Hold, Review, or Exit — for every fund you own.</p>
                  <div style={{ fontSize:"12px", fontWeight:700, color:"#059669" }}>Check Portfolio →</div>
                </div>
              </div>
            </Link>
          </Reveal>

          {/* ── Card 3: MF World ── */}
          <Reveal delay={160}>
            <Link href="/mutual-fund-match" style={{ textDecoration:"none", display:"block", height:"100%" }}>
              <div style={{ background:"white", borderRadius:"24px", border:"1.5px solid #E2E8F0", overflow:"hidden", height:"100%", display:"flex", flexDirection:"column", boxShadow:"0 4px 20px rgba(0,0,0,0.05)", transition:"box-shadow 0.3s,transform 0.3s" }}
                onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow="0 20px 60px rgba(0,0,0,0.10)";(e.currentTarget as HTMLDivElement).style.transform="translateY(-4px)";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow="0 4px 20px rgba(0,0,0,0.05)";(e.currentTarget as HTMLDivElement).style.transform="translateY(0)";}}>
                <div style={{ height:"4px", background:"linear-gradient(90deg,#7C3AED,#2563EB)" }} />
                <div style={{ background:"linear-gradient(135deg,#F5F3FF,#EFF6FF)", padding:"20px 20px 14px", borderBottom:"1px solid #F1F5F9", position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle at 80% 40%, #7C3AED14 0%,transparent 60%)" }} />
                  <div style={{ position:"relative" }}><StyleBox /></div>
                </div>
                <div style={{ padding:"16px 18px 18px", flex:1, display:"flex", flexDirection:"column" }}>
                  <div style={{ display:"flex", gap:"9px", alignItems:"flex-start", marginBottom:"7px" }}>
                    <div style={{ width:"34px", height:"34px", borderRadius:"9px", background:"#F5F3FF", border:"1.5px solid #DDD6FE", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px", flexShrink:0 }}>🗺️</div>
                    <div>
                      <h3 style={{ fontSize:"15px", fontWeight:800, color:"#0F172A", margin:0, lineHeight:1.2 }}>The Mutual Fund World</h3>
                      <div style={{ fontSize:"10px", color:"#94A3B8", fontWeight:600, marginTop:"2px", fontStyle:"italic" }}>Discover, analyse, decide</div>
                    </div>
                  </div>
                  <p style={{ fontSize:"12px", color:"#475569", lineHeight:1.7, margin:"0 0 12px", flex:1 }}>Explore India's full mutual fund universe through our live style-box matrix. Compare active vs passive, filter by alpha and IR, and find the right fund for every slot in your portfolio.</p>
                  <div style={{ fontSize:"12px", fontWeight:700, color:"#7C3AED" }}>Explore Fund World →</div>
                </div>
              </div>
            </Link>
          </Reveal>

          {/* ── Card 4: Life Calculators ── */}
          <Reveal delay={240}>
            <Link href="/dashboard/calculators" style={{ textDecoration:"none", display:"block", height:"100%" }}>
              <div style={{ background:"white", borderRadius:"24px", border:"1.5px solid #E2E8F0", overflow:"hidden", height:"100%", display:"flex", flexDirection:"column", boxShadow:"0 4px 20px rgba(0,0,0,0.05)", transition:"box-shadow 0.3s,transform 0.3s" }}
                onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow="0 20px 60px rgba(0,0,0,0.10)";(e.currentTarget as HTMLDivElement).style.transform="translateY(-4px)";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow="0 4px 20px rgba(0,0,0,0.05)";(e.currentTarget as HTMLDivElement).style.transform="translateY(0)";}}>
                <div style={{ height:"4px", background:"linear-gradient(90deg,#D97706,#DC2626)" }} />
                <div style={{ background:"linear-gradient(135deg,#FFFBEB,#FEF2F2)", padding:"20px 20px 14px", borderBottom:"1px solid #F1F5F9", position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle at 80% 40%, #D9770614 0%,transparent 60%)" }} />
                  <div style={{ position:"relative" }}><FireViz /></div>
                </div>
                <div style={{ padding:"16px 18px 18px", flex:1, display:"flex", flexDirection:"column" }}>
                  <div style={{ display:"flex", gap:"9px", alignItems:"flex-start", marginBottom:"7px" }}>
                    <div style={{ width:"34px", height:"34px", borderRadius:"9px", background:"#FFFBEB", border:"1.5px solid #FDE68A", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px", flexShrink:0 }}>🧮</div>
                    <div>
                      <h3 style={{ fontSize:"15px", fontWeight:800, color:"#0F172A", margin:0, lineHeight:1.2 }}>Life Calculators</h3>
                      <div style={{ fontSize:"10px", color:"#94A3B8", fontWeight:600, marginTop:"2px", fontStyle:"italic" }}>Decide with clarity</div>
                    </div>
                  </div>
                  <p style={{ fontSize:"12px", color:"#475569", lineHeight:1.7, margin:"0 0 12px", flex:1 }}>Retirement, FIRE, education, sabbaticals, big purchases — model real life decisions with numbers, not guesswork. Build a plan for the life you want, working backwards from the goal.</p>
                  <div style={{ fontSize:"12px", fontWeight:700, color:"#D97706" }}>Open Calculators →</div>
                </div>
              </div>
            </Link>
          </Reveal>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          HOW IT WORKS — 4 steps
          ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ background:"white", borderTop:"1px solid #E2E8F0", borderBottom:"1px solid #E2E8F0", padding:"clamp(40px,6vw,64px) clamp(16px,4vw,32px)" }}>
        <div style={{ maxWidth:"1160px", margin:"0 auto" }}>
          <Reveal>
            <div style={{ textAlign:"center", marginBottom:"32px" }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:"6px", background:"rgba(124,58,237,0.08)", border:"1px solid rgba(124,58,237,0.2)", borderRadius:"100px", padding:"4px 13px", marginBottom:"10px" }}>
                <span style={{ fontSize:"11px", fontWeight:700, color:"#7C3AED", letterSpacing:"0.08em", textTransform:"uppercase" as const }}>How it works</span>
              </div>
              <h2 style={{ fontSize:"clamp(20px,3.5vw,30px)", fontWeight:900, color:"#0F172A", margin:0, letterSpacing:"-0.02em" }}>From confusion to clarity in minutes.</h2>
            </div>
          </Reveal>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"12px" }}>
            {[
              {step:"01", icon:"📤", title:"Upload your CAS",      desc:"Import your consolidated account statement — or manually add investments across all asset classes.", color:"#2563EB", bg:"#EFF6FF", bd:"#BFDBFE"},
              {step:"02", icon:"⚡", title:"Instant analysis",      desc:"We calculate XIRR, benchmark alpha, information ratio, and portfolio health score — automatically.", color:"#059669", bg:"#ECFDF5", bd:"#A7F3D0"},
              {step:"03", icon:"🚦", title:"Clear signals",         desc:"Every fund gets a Hold, Review, or Exit rating. No jargon. Just what to do next.", color:"#7C3AED", bg:"#F5F3FF", bd:"#DDD6FE"},
              {step:"04", icon:"🚀", title:"Act with confidence",   desc:"Explore better alternatives, build a new plan, track net worth — all in one calm, clutter-free space.", color:"#D97706", bg:"#FFFBEB", bd:"#FDE68A"},
            ].map((s,i) => (
              <Reveal key={i} delay={i*80}>
                <div style={{ background:s.bg, border:`1.5px solid ${s.bd}`, borderRadius:"18px", padding:"20px 16px", position:"relative", height:"100%", boxSizing:"border-box" }}>
                  <div style={{ position:"absolute", top:"10px", right:"12px", fontSize:"11px", fontWeight:900, color:s.color, opacity:0.25 }}>{s.step}</div>
                  <div style={{ fontSize:"28px", marginBottom:"10px" }}>{s.icon}</div>
                  <div style={{ fontSize:"13px", fontWeight:800, color:s.color, marginBottom:"5px" }}>{s.title}</div>
                  <p style={{ fontSize:"11.5px", color:"#475569", lineHeight:1.65, margin:0 }}>{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          WEALTH COMPARISON SECTION — visual-first
          ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ maxWidth:"1160px", margin:"0 auto", padding:"clamp(40px,6vw,64px) clamp(16px,4vw,32px)" }}>
        <Reveal>
          <div style={{ background:"white", borderRadius:"24px", border:"1.5px solid #E2E8F0", padding:"clamp(22px,4vw,40px)", boxShadow:"0 4px 24px rgba(0,0,0,0.05)", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"clamp(20px,4vw,48px)", alignItems:"center" }}>
            <div>
              <div style={{ display:"inline-flex", alignItems:"center", gap:"6px", background:"rgba(5,150,105,0.08)", border:"1px solid rgba(5,150,105,0.2)", borderRadius:"100px", padding:"4px 13px", marginBottom:"12px" }}>
                <span style={{ fontSize:"11px", fontWeight:700, color:"#059669", letterSpacing:"0.08em", textTransform:"uppercase" as const }}>The real gap</span>
              </div>
              <h2 style={{ fontSize:"clamp(18px,3vw,26px)", fontWeight:800, color:"#0F172A", margin:"0 0 10px", lineHeight:1.2, letterSpacing:"-0.02em" }}>
                ₹10L invested for 10 years.<br />
                <span style={{ color:"#059669" }}>One decision. Massive difference.</span>
              </h2>
              <p style={{ fontSize:"13px", color:"#475569", lineHeight:1.8, maxWidth:"380px", marginBottom:"20px" }}>
                Equity mutual funds held patiently have outperformed FDs significantly over 10-year periods — after accounting for taxation. The chart shows why staying invested in the right vehicle matters more than chasing the highest rate.
              </p>
              <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
                {[
                  {label:"Equity MF", val:"₹34.6L", note:"~14% CAGR", color:"#059669", bg:"#ECFDF5", bd:"#A7F3D0"},
                  {label:"FD (post-tax)", val:"₹18.8L", note:"~5% real return", color:"#94A3B8", bg:"#F8FAFC", bd:"#E2E8F0"},
                ].map((s,i)=>(
                  <div key={i} style={{ background:s.bg, border:`1.5px solid ${s.bd}`, borderRadius:"14px", padding:"12px 16px" }}>
                    <div style={{ fontSize:"10px", fontWeight:600, color:"#64748B", marginBottom:"2px" }}>{s.label} · {s.note}</div>
                    <div style={{ fontSize:"22px", fontWeight:900, color:s.color }}>{s.val}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:"14px", background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:"10px", padding:"9px 13px", fontSize:"11.5px", color:"#991B1B", fontWeight:600 }}>
                ⚠️ Past performance is not a guarantee of future returns.
              </div>
            </div>
            <div>
              <WealthChart />
            </div>
          </div>
        </Reveal>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          WHY MUTUAL FUNDS TEASER
          ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ maxWidth:"1160px", margin:"0 auto", padding:"0 clamp(16px,4vw,32px) clamp(40px,6vw,64px)" }}>
        <Reveal>
          <Link href="/why-mutual-fund" style={{ textDecoration:"none", display:"block" }}>
            <div style={{ background:"linear-gradient(135deg,#0F172A 0%,#1E3A8A 55%,#065F46 100%)", borderRadius:"28px", padding:"clamp(26px,5vw,44px)", display:"grid", gridTemplateColumns:"1fr auto", gap:"clamp(16px,4vw,44px)", alignItems:"center", position:"relative", overflow:"hidden", cursor:"pointer", transition:"transform 0.3s,box-shadow 0.3s" }}
              onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform="translateY(-3px)";(e.currentTarget as HTMLDivElement).style.boxShadow="0 20px 60px rgba(0,0,0,0.25)";}}
              onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform="translateY(0)";(e.currentTarget as HTMLDivElement).style.boxShadow="none";}}>
              <div style={{ position:"absolute", top:-60, right:-60, width:"300px", height:"300px", background:"radial-gradient(circle,rgba(16,185,129,0.18) 0%,transparent 70%)", pointerEvents:"none" }} />
              <div style={{ position:"relative" }}>
                <div style={{ display:"inline-flex", alignItems:"center", gap:"8px", background:"rgba(255,255,255,0.10)", border:"1px solid rgba(255,255,255,0.20)", borderRadius:"100px", padding:"4px 13px", marginBottom:"14px" }}>
                  <span style={{ fontSize:"10.5px", fontWeight:700, color:"#A7F3D0", letterSpacing:"0.08em", textTransform:"uppercase" as const }}>New to investing?</span>
                </div>
                <h2 style={{ fontSize:"clamp(18px,3.5vw,26px)", fontWeight:900, color:"white", margin:"0 0 10px", lineHeight:1.2 }}>
                  Why Mutual Funds? Complete Guide →
                </h2>
                <p style={{ fontSize:"12.5px", color:"rgba(255,255,255,0.65)", margin:"0 0 14px", lineHeight:1.7, maxWidth:"500px" }}>
                  From what a mutual fund is, to how NAV works, benefits, risks, costs, the 3-pillar investment framework, and how to start — all in one place.
                </p>
                <div style={{ display:"flex", gap:"7px", flexWrap:"wrap" }}>
                  {["What is a MF","How NAV works","Benefits & Risks","The Iron-Clad Structure","3 Pillars","How to Start","FAQs"].map((tag,i)=>(
                    <div key={i} style={{ background:"rgba(255,255,255,0.10)", border:"1px solid rgba(255,255,255,0.18)", borderRadius:"100px", padding:"3px 10px", fontSize:"10.5px", fontWeight:600, color:"rgba(255,255,255,0.85)" }}>{tag}</div>
                  ))}
                </div>
              </div>
              <div style={{ background:"rgba(255,255,255,0.10)", border:"1px solid rgba(255,255,255,0.20)", borderRadius:"18px", padding:"20px 22px", textAlign:"center", flexShrink:0 }}>
                <div style={{ fontSize:"36px", marginBottom:"8px" }}>📖</div>
                <div style={{ fontSize:"13px", fontWeight:800, color:"white", marginBottom:"3px" }}>Read the Guide</div>
                <div style={{ fontSize:"10px", color:"rgba(255,255,255,0.55)" }}>Free · No sign-up</div>
              </div>
            </div>
          </Link>
        </Reveal>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          PHILOSOPHY + QUICK LINKS
          ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ background:"white", borderTop:"1px solid #E2E8F0", padding:"clamp(40px,6vw,64px) clamp(16px,4vw,32px)" }}>
        <div style={{ maxWidth:"1160px", margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"clamp(24px,5vw,60px)", alignItems:"center" }}>

          <Reveal>
            <div>
              <div style={{ display:"inline-flex", alignItems:"center", gap:"6px", background:"rgba(5,150,105,0.08)", border:"1px solid rgba(5,150,105,0.2)", borderRadius:"100px", padding:"4px 13px", marginBottom:"14px" }}>
                <span style={{ fontSize:"11px", fontWeight:700, color:"#059669", letterSpacing:"0.08em", textTransform:"uppercase" as const }}>Our philosophy</span>
              </div>
              <h2 style={{ fontSize:"clamp(18px,3vw,26px)", fontWeight:900, color:"#0F172A", margin:"0 0 14px", lineHeight:1.2, letterSpacing:"-0.02em" }}>
                "Enough is not a number.
                <br />It's the moment money stops
                <br />interfering with life."
              </h2>
              <p style={{ fontSize:"13px", color:"#64748B", lineHeight:1.8, maxWidth:"400px", marginBottom:"22px" }}>
                Nivesify is a calm, non-transactional space for Indian investors. We don't sell products. We don't run ads. We just help you understand your money — clearly and honestly.
              </p>
              <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
                {["✅ No ads", "✅ No product selling", "✅ No spam", "✅ Just clarity"].map((t,i)=>(
                  <div key={i} style={{ background:"#ECFDF5", border:"1px solid #A7F3D0", borderRadius:"100px", padding:"4px 12px", fontSize:"11.5px", fontWeight:700, color:"#059669" }}>{t}</div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
              {[
                {href:"/dashboard",                         icon:"📊", label:"Money Dashboard",    desc:"Net worth · all assets"},
                {href:"/mutual-fund-health-check/dashboard",icon:"🏥", label:"Fund Health Check",   desc:"XIRR · alpha · signals"},
                {href:"/mutual-fund-match",                 icon:"🗺️", label:"MF World",            desc:"Style matrix · live data"},
                {href:"/why-mutual-fund",                   icon:"📖", label:"Why Mutual Funds",    desc:"Complete beginner guide"},
                {href:"/dashboard/calculators",             icon:"🧮", label:"Life Calculators",    desc:"FIRE · retirement · goals"},
                {href:"/mutual-fund-match",                 icon:"🔬", label:"Fund Comparison",     desc:"Side-by-side analysis"},
              ].map((l,i)=>(
                <Link key={i} href={l.href} style={{ textDecoration:"none" }}>
                  <div style={{ background:"#F8FAFC", border:"1.5px solid #E2E8F0", borderRadius:"14px", padding:"13px 14px", transition:"box-shadow 0.2s,transform 0.2s", cursor:"pointer" }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow="0 6px 20px rgba(0,0,0,0.08)";(e.currentTarget as HTMLDivElement).style.transform="translateY(-2px)";}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow="none";(e.currentTarget as HTMLDivElement).style.transform="translateY(0)";}}>
                    <div style={{ fontSize:"20px", marginBottom:"5px" }}>{l.icon}</div>
                    <div style={{ fontSize:"11.5px", fontWeight:800, color:"#0F172A", marginBottom:"2px" }}>{l.label}</div>
                    <div style={{ fontSize:"10px", color:"#94A3B8", fontWeight:600 }}>{l.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </Reveal>

        </div>
      </section>

      
    </main>
  );
}