"use client";

import AnalysisTabs from "@/components/AnalysisTabs";
import React, { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// SCROLL REVEAL
// ─────────────────────────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } }, { threshold: 0.08 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(28px)", transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`, ...style }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PILLAR CARD
// ─────────────────────────────────────────────────────────────────────────────
function PillarCard({ number, icon, title, subtitle, points, color, bg, border }: { number: string; icon: string; title: string; subtitle: string; points: { icon: string; title: string; body: string }[]; color: string; bg: string; border: string; }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ background: "white", borderRadius: "24px", border: `1.5px solid ${border}`, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.05)", transition: "box-shadow 0.3s, transform 0.3s", display: "flex", flexDirection: "column" }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 48px rgba(0,0,0,0.10)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.05)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}>
      <div style={{ background: bg, padding: "22px 22px 18px", borderBottom: `1px solid ${border}`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -16, right: -12, fontSize: "88px", opacity: 0.06, lineHeight: 1 }}>{number}</div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "white", border: `1.5px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>{icon}</div>
          <div>
            <div style={{ fontSize: "10px", fontWeight: 800, color, letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: "3px" }}>Pillar {number}</div>
            <h3 style={{ fontSize: "clamp(15px,2.5vw,18px)", fontWeight: 800, color: "#0F172A", margin: 0, lineHeight: 1.2 }}>{title}</h3>
            <p style={{ fontSize: "11.5px", color: "#64748B", margin: "3px 0 0", lineHeight: 1.5 }}>{subtitle}</p>
          </div>
        </div>
      </div>
      <div style={{ padding: "18px 22px", flex: 1 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {points.slice(0, expanded ? points.length : 2).map((p, i) => (
            <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: bg, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>{p.icon}</div>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700, color, marginBottom: "2px" }}>{p.title}</div>
                <div style={{ fontSize: "11.5px", color: "#475569", lineHeight: 1.6 }}>{p.body}</div>
              </div>
            </div>
          ))}
        </div>
        {points.length > 2 && (
          <button onClick={() => setExpanded(!expanded)} style={{ marginTop: "12px", width: "100%", background: bg, border: `1px solid ${border}`, borderRadius: "10px", padding: "7px", fontSize: "11px", fontWeight: 700, color, cursor: "pointer", fontFamily: "inherit" }}>
            {expanded ? "▲ Show less" : `▼ ${points.length - 2} more insights`}
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MYTH BUSTER CARD (flip)
// ─────────────────────────────────────────────────────────────────────────────
function MythCard({ myth, truth, delay }: { myth: string; truth: string; delay: number }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <Reveal delay={delay}>
      <div onClick={() => setFlipped(!flipped)} style={{ cursor: "pointer", height: "148px", perspective: "1000px" }}>
        <div style={{ position: "relative", width: "100%", height: "100%", transformStyle: "preserve-3d", transition: "transform 0.6s ease", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}>
          <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden" as const, background: "linear-gradient(135deg, #FEF2F2, #FFF5F5)", border: "1.5px solid #FECACA", borderRadius: "16px", padding: "18px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 800, color: "#DC2626", letterSpacing: "0.09em", textTransform: "uppercase" as const, marginBottom: "7px" }}>❌ Common Myth</div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#7F1D1D", lineHeight: 1.4 }}>{myth}</div>
            </div>
            <div style={{ fontSize: "10px", color: "#DC2626", fontWeight: 600 }}>Tap to see the truth →</div>
          </div>
          <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden" as const, transform: "rotateY(180deg)", background: "linear-gradient(135deg, #ECFDF5, #F0FFF4)", border: "1.5px solid #A7F3D0", borderRadius: "16px", padding: "18px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 800, color: "#059669", letterSpacing: "0.09em", textTransform: "uppercase" as const, marginBottom: "7px" }}>✅ The Truth</div>
              <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#064E3B", lineHeight: 1.55 }}>{truth}</div>
            </div>
            <div style={{ fontSize: "10px", color: "#059669", fontWeight: 600 }}>Tap to flip back →</div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG VISUALS
// ─────────────────────────────────────────────────────────────────────────────

const TaxFreeViz = ({ color }: { color: string }) => (
  <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", justifyContent: "center", width: "100%", paddingBottom: "4px" }}>
    <div style={{ flex: 1, textAlign: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "center", marginBottom: "8px" }}>
        {[55, 70, 52, 65, 60].map((w, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "4px", width: "100%" }}>
            <div style={{ width: `${w}%`, height: "12px", borderRadius: "4px", background: i === 1 || i === 3 ? "#FECACA" : "#E2E8F0", position: "relative", transition: "width 0.4s" }} />
            {(i === 1 || i === 3) && <span style={{ fontSize: "9px", color: "#DC2626", fontWeight: 700, whiteSpace: "nowrap" }}>💸 tax hit</span>}
          </div>
        ))}
      </div>
      <div style={{ fontSize: "10px", fontWeight: 700, color: "#94A3B8" }}>Direct Stocks</div>
      <div style={{ fontSize: "9px", color: "#DC2626", fontWeight: 600, marginTop: "2px" }}>Tax on every switch</div>
    </div>
    <div style={{ fontSize: "16px", fontWeight: 900, color: "#CBD5E1", flexShrink: 0, paddingBottom: "28px" }}>VS</div>
    <div style={{ flex: 1, textAlign: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "center", marginBottom: "8px" }}>
        {[55, 72, 80, 88, 96].map((w, i) => (
          <div key={i} style={{ width: `${Math.min(w, 100)}%`, height: "12px", borderRadius: "4px", background: `${color}${["40","66","88","BB","FF"][i]}` }} />
        ))}
      </div>
      <div style={{ fontSize: "10px", fontWeight: 700, color: "#374151" }}>Mutual Fund</div>
      <div style={{ fontSize: "9px", color, fontWeight: 600, marginTop: "2px" }}>Zero tax internally ✓</div>
    </div>
  </div>
);

const PricingViz = ({ color }: { color: string }) => (
  <div style={{ display: "flex", gap: "16px", alignItems: "center", justifyContent: "center" }}>
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "36px", marginBottom: "5px" }}>🐟</div>
      <div style={{ fontSize: "9px", fontWeight: 700, color: "#94A3B8", marginBottom: "4px" }}>Retail Investor</div>
      <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", padding: "3px 8px", fontSize: "9px", fontWeight: 700, color: "#DC2626" }}>+0.5–1% impact cost</div>
    </div>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
      <div style={{ width: "1px", height: "24px", background: "#E2E8F0" }} />
      <div style={{ fontSize: "9px", fontWeight: 800, color: "#374151", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "6px", padding: "3px 6px", whiteSpace: "nowrap" }}>SAME STOCK</div>
      <div style={{ width: "1px", height: "24px", background: "#E2E8F0" }} />
    </div>
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "36px", marginBottom: "5px" }}>🐋</div>
      <div style={{ fontSize: "9px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>Mutual Fund (QIB)</div>
      <div style={{ background: `${color}18`, border: `1px solid ${color}40`, borderRadius: "8px", padding: "3px 8px", fontSize: "9px", fontWeight: 700, color }}>~0% impact cost</div>
    </div>
  </div>
);

const TrustViz = ({ color }: { color: string }) => (
  <div style={{ textAlign: "center" }}>
    <div style={{ width: "110px", height: "110px", borderRadius: "50%", border: `2px dashed ${color}40`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", position: "relative" }}>
      <div style={{ position: "absolute", top: "-9px", left: "50%", transform: "translateX(-50%)", background: "white", border: `1px solid ${color}30`, borderRadius: "100px", padding: "2px 8px", fontSize: "8px", fontWeight: 700, color, whiteSpace: "nowrap" }}>SEBI Custodian Trust</div>
      <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: `${color}12`, border: `2px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "2px" }}>
        <div style={{ fontSize: "26px" }}>🛡️</div>
        <div style={{ fontSize: "8px", fontWeight: 800, color, lineHeight: 1.2, textAlign: "center" }}>YOUR UNITS</div>
      </div>
    </div>
    <div style={{ fontSize: "10px", color: "#059669", fontWeight: 700, marginTop: "8px" }}>✅ AMC bankruptcy cannot touch your units</div>
  </div>
);

const SIPViz = ({ color }: { color: string }) => (
  <div style={{ width: "100%" }}>
    <div style={{ position: "relative", height: "64px", marginBottom: "8px" }}>
      <svg viewBox="0 0 280 64" style={{ width: "100%", height: "100%" }}>
        <polyline points="0,42 36,36 60,50 88,18 118,52 150,28 180,46 212,14 244,34 280,20" fill="none" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="0,42 36,36 60,50 88,18 118,52 150,28 180,46 212,14 244,34 280,20" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
        {[[60,50],[118,52],[180,46]].map(([x,y],i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="6" fill={color} opacity="0.95" />
            <text x={x} y={y-10} textAnchor="middle" fontSize="7.5" fill={color} fontWeight="800">SIP ↓</text>
          </g>
        ))}
        <circle cx={88} cy={18} r="6" fill="#EF4444" opacity="0.9" />
        <text x={88} y={10} textAnchor="middle" fontSize="7.5" fill="#EF4444" fontWeight="800">😱 sell</text>
      </svg>
    </div>
    <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "9px", fontWeight: 700, color }}>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color }} /> SIP auto-buys on dips
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "9px", fontWeight: 700, color: "#EF4444" }}>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#EF4444" }} /> Panic exit = locked loss
      </div>
    </div>
  </div>
);

const BetaFloorViz = ({ color }: { color: string }) => (
  <div style={{ width: "100%", textAlign: "center" }}>
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: "8px", height: "80px", marginBottom: "6px" }}>
      {[{ h: 100, label: "Top", c: color }, { h: 78, label: "Good", c: `${color}BB` }, { h: 58, label: "Avg", c: `${color}77` }, { h: 42, label: "Poor", c: `${color}44` }].map((b, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", flex: 1 }}>
          <div style={{ fontSize: "8px", fontWeight: 700, color: i === 0 ? color : "#94A3B8" }}>{b.label}</div>
          <div style={{ width: "100%", height: `${b.h * 0.72}px`, background: b.c, borderRadius: "6px 6px 0 0", minHeight: "4px" }} />
        </div>
      ))}
    </div>
    <div style={{ height: "2px", background: "#EF4444", borderRadius: "1px", marginBottom: "6px" }} />
    <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "100px", padding: "3px 10px" }}>
      <div style={{ width: "8px", height: "2px", background: "#EF4444", borderRadius: "1px" }} />
      <span style={{ fontSize: "9px", fontWeight: 700, color: "#DC2626" }}>Beta Floor — worst fund still captures market growth</span>
    </div>
  </div>
);

const ElasticityViz = ({ color }: { color: string }) => (
  <div style={{ width: "100%" }}>
    <div style={{ display: "flex", gap: "4px", alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
      {[{ emoji: "📈", label: "Equity", bg: "#EFF6FF", bd: "#BFDBFE", tc: "#2563EB" }, { emoji: "→", label: "", bg: "transparent", bd: "transparent", tc: "#059669" }, { emoji: "🏦", label: "Debt", bg: "#FFFBEB", bd: "#FDE68A", tc: "#D97706" }, { emoji: "→", label: "", bg: "transparent", bd: "transparent", tc: "#059669" }, { emoji: "🥇", label: "Gold", bg: "#FEF2F2", bd: "#FECACA", tc: "#DC2626" }].map((item, i) => (
        item.label === "" ? (
          <div key={i} style={{ fontSize: "16px", color: "#059669", fontWeight: 900 }}>{item.emoji}</div>
        ) : (
          <div key={i} style={{ textAlign: "center", background: item.bg, border: `1.5px solid ${item.bd}`, borderRadius: "10px", padding: "8px 6px", minWidth: "52px" }}>
            <div style={{ fontSize: "20px" }}>{item.emoji}</div>
            <div style={{ fontSize: "8px", fontWeight: 700, color: item.tc, marginTop: "2px" }}>{item.label}</div>
          </div>
        )
      ))}
    </div>
    <div style={{ textAlign: "center", marginTop: "10px" }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: `${color}14`, border: `1px solid ${color}35`, borderRadius: "100px", padding: "4px 12px", fontSize: "10px", fontWeight: 700, color }}>
        💸 Zero capital gains tax on every shift
      </div>
    </div>
  </div>
);

const DividendViz = ({ color }: { color: string }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px" }}>
    <div style={{ position: "relative", width: "100px", height: "100px", flexShrink: 0 }}>
      <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}>
        <circle cx="50" cy="50" r="42" fill="none" stroke={`${color}22`} strokeWidth="7" />
        <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="7" strokeDasharray="176 88" strokeLinecap="round" strokeDashoffset="0" />
        <polygon points="50,4 46,13 54,13" fill={color} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: "22px" }}>🔄</div>
        <div style={{ fontSize: "8px", fontWeight: 800, color, textAlign: "center", lineHeight: 1.2 }}>100%<br/>Reinvested</div>
      </div>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      {["Dividend earned", "→ Reinvested at NAV", "→ More units held", "→ More dividend ✨"].map((step, i) => (
        <div key={i} style={{ fontSize: "10px", fontWeight: i === 3 ? 700 : 500, color: i === 3 ? color : "#475569" }}>{step}</div>
      ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// STRUCTURE CARD — visual-first design
// ─────────────────────────────────────────────────────────────────────────────
function StructureCard({ icon, bigStat, statLabel, title, body, color, bg, border, accentGradient, visual, delay }: {
  icon: string; bigStat: string; statLabel: string; title: string; body: string;
  color: string; bg: string; border: string; accentGradient: string; visual: React.ReactNode; delay: number;
}) {
  return (
    <Reveal delay={delay}>
      <div style={{ background: "white", borderRadius: "24px", border: `1.5px solid ${border}`, overflow: "hidden", boxShadow: "0 4px 28px rgba(0,0,0,0.06)", transition: "box-shadow 0.3s, transform 0.3s", display: "flex", flexDirection: "column", height: "100%" }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 16px 56px rgba(0,0,0,0.12)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-5px)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 28px rgba(0,0,0,0.06)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}>
        {/* Accent bar */}
        <div style={{ height: "4px", background: accentGradient }} />
        {/* Visual panel */}
        <div style={{ background: bg, padding: "24px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "148px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(circle at 70% 50%, ${color}10 0%, transparent 60%)` }} />
          <div style={{ position: "relative", zIndex: 1, width: "100%" }}>{visual}</div>
        </div>
        {/* Text */}
        <div style={{ padding: "18px 20px 20px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "9px" }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: bg, border: `1.5px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>{icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "12.5px", fontWeight: 800, color, lineHeight: 1.2, marginBottom: "2px" }}>{title}</div>
              {bigStat && <div style={{ fontSize: "10px", fontWeight: 600, color: "#94A3B8" }}>{statLabel}</div>}
            </div>
            {bigStat && (
              <div style={{ background: accentGradient, borderRadius: "8px", padding: "3px 9px", fontSize: "12px", fontWeight: 900, color: "white", whiteSpace: "nowrap", flexShrink: 0 }}>{bigStat}</div>
            )}
          </div>
          <p style={{ fontSize: "11.5px", color: "#475569", lineHeight: 1.7, margin: 0 }}>{body}</p>
        </div>
      </div>
    </Reveal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function WhyMutualFundsPage() {

  const structureCards = [
    {
      icon: "⚡", bigStat: "~1.5%", statLabel: "saved annually vs direct stocks",
      title: "Frictionless Compounding — Internal Tax Neutrality",
      body: "When a fund manager switches stocks inside a mutual fund, you pay zero capital gains tax. Do the same yourself with direct stocks and you're hit with 12.5–20% tax every time — a silent drag that destroys compounding over decades.",
      color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE",
      accentGradient: "linear-gradient(90deg, #2563EB, #7C3AED)",
      visual: <TaxFreeViz color="#2563EB" />,
    },
    {
      icon: "🐋", bigStat: "~0%", statLabel: "market impact cost at QIB scale",
      title: "Institutional Wholesale Pricing",
      body: "Mutual funds buy stocks in hundreds of crores as Qualified Institutional Buyers — near-zero market impact cost. A retail investor buying the same stock individually pays 0.5–1% slippage per trade. The fund gives you whale-scale buying power on a fish-scale budget.",
      color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE",
      accentGradient: "linear-gradient(90deg, #7C3AED, #2563EB)",
      visual: <PricingViz color="#7C3AED" />,
    },
    {
      icon: "🔒", bigStat: "100%", statLabel: "safe even if AMC goes bankrupt",
      title: "Fiduciary Trust Structure — Legal Asset Separation",
      body: "Your money is held in a legally separate custodian trust — completely isolated from the AMC's own balance sheet. If your AMC shuts down tomorrow, your units are untouched. SEBI mandates this. No bank FD offers this protection beyond ₹5 Lakh.",
      color: "#059669", bg: "#ECFDF5", border: "#A7F3D0",
      accentGradient: "linear-gradient(90deg, #059669, #0891B2)",
      visual: <TrustViz color="#059669" />,
    },
    {
      icon: "🤖", bigStat: "1–3%", statLabel: "extra returns from behavioral discipline",
      title: "Automated Behavioral Guardrails — The SIP Superpower",
      body: "SIPs remove the biggest wealth destroyer: your own emotions. Auto-debit on the 5th of every month means you buy more units when markets crash — automatically. This 'behavioral alpha' is estimated to add meaningful extra returns vs investors who try to time markets manually.",
      color: "#D97706", bg: "#FFFBEB", border: "#FDE68A",
      accentGradient: "linear-gradient(90deg, #D97706, #DC2626)",
      visual: <SIPViz color="#D97706" />,
    },
    {
      icon: "🛡️", bigStat: "Even bad picks", statLabel: "still capture market growth",
      title: "The Beta Floor — The Wrong Selection Safety Net",
      body: "Even if you pick a below-average fund, you still capture the market's underlying economic growth. SEBI mandates category-appropriate investing, preventing catastrophic benchmark divergence. The structure ensures you don't need to be perfect — just invested.",
      color: "#DC2626", bg: "#FEF2F2", border: "#FECACA",
      accentGradient: "linear-gradient(90deg, #DC2626, #D97706)",
      visual: <BetaFloorViz color="#DC2626" />,
    },
    {
      icon: "🔄", bigStat: "Zero tax", statLabel: "on internal asset-class shifts",
      title: "Asset-Class Elasticity — Tax-Free Rebalancing",
      body: "Move between equity, debt, and gold inside a multi-asset fund — zero capital gains tax triggered. Do the same with direct investments and every shift is a taxable event. This frictionless rebalancing saves roughly 1% per year in friction costs, staying fully compounded.",
      color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC",
      accentGradient: "linear-gradient(90deg, #0891B2, #059669)",
      visual: <ElasticityViz color="#0891B2" />,
    },
  ];

  const pillars = [
    {
      number: "1", icon: "🗂️", title: "Strategic Diversification & Style Balance", subtitle: "Different return drivers — not just different fund names",
      color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE",
      points: [
        { icon: "⚠️", title: "The Overlap Trap", body: "Owning 5 large-cap funds sounds diversified — but they hold the same 30 stocks. You pay 5× fees for 1× exposure. Always check portfolio overlap first." },
        { icon: "🔺", title: "Core & Satellite (The 90% Rule)", body: "90% of returns come from asset allocation. Build a Passive Core (~70%) for low-cost market returns. Add Active Satellites (~30%) for alpha in areas managers genuinely add value." },
        { icon: "📊", title: "The Style Box Matrix", body: "Real diversification means covering Value, Core, and Momentum styles across Large, Mid, and Small cap sizes — each thriving in different market cycles." },
        { icon: "🏆", title: "The All-Weather Portfolio", body: "Broad Market Passive (Anchor) + Active Flexi-Cap (Stable) + Active Mid-Cap (Growth) + Small-Cap (High Growth) + Factor ETF (Smart Satellite)." },
      ],
    },
    {
      number: "2", icon: "🔬", title: "The Selection Framework & Quality Filters", subtitle: "Pick funds by skill — not by recent performance",
      color: "#059669", bg: "#ECFDF5", border: "#A7F3D0",
      points: [
        { icon: "📐", title: "Information Ratio — The Skill Metric", body: "IR = (Fund Return − Benchmark) ÷ Tracking Error. An IR above 0.5 signals consistent alpha — not lucky spikes. Never trust 1-year returns alone." },
        { icon: "🐟", title: "The AUM Trap for Mid/Small Cap", body: "A bloated small-cap fund can't buy nimble stocks anymore. Too much AUM forces it to become a 'closet index fund' — active fees, passive returns." },
        { icon: "🏁", title: "Tracking Difference — True Passive Cost", body: "For index funds, the real cost is TD = Fund Return − Index Return. Lower TD means genuinely better performance — regardless of headline expense ratio." },
        { icon: "👨‍🍳", title: "Skin in the Game", body: "Does the fund manager invest their own wealth in their scheme? SEBI now mandates disclosure. A manager with personal stakes thinks like an owner, not a salesperson." },
      ],
    },
    {
      number: "3", icon: "🚪", title: "The Exit Protocol & Discipline Filter", subtitle: "Exit by plan — not by panic. This is where most investors fail.",
      color: "#D97706", bg: "#FFFBEB", border: "#FDE68A",
      points: [
        { icon: "📅", title: "Goal-Based Exit (The Right Reason)", body: "Life milestones dictate sell orders — not news. A 10% dip is irrelevant for a 20-year goal. Start moving to safer debt 2–3 years before you need the money." },
        { icon: "📰", title: "Never Exit on Market Noise", body: "Selling because markets fell or a TV anchor panicked guarantees wealth destruction. Reactive selling locks in losses and misses the recovery that always follows." },
        { icon: "⚖️", title: "Rebalancing — Sell High Automatically", body: "If equity grows from 60% to 75% of portfolio, sell the 15% excess into debt. This mechanically locks profits and reduces risk — not emotionally." },
        { icon: "🚦", title: "Underperformance vs Style Drift", body: "WAIT if Value style is just out of fashion. EXIT only if the fund lags peers for 18+ months or the manager changes core strategy. Know the difference." },
      ],
    },
  ];

  const myths = [
    { myth: "Mutual funds are only for market experts or the wealthy.", truth: "You can start with ₹100/month via SIP. Professionals manage the portfolio. No expertise needed — just a bank account and a goal." },
    { myth: "Mutual funds are like gambling. You can lose everything.", truth: "A diversified fund holds 50–100 stocks across sectors. No single stock collapse can destroy your portfolio. The Beta Floor always holds." },
    { myth: "FD is safer. At least returns are guaranteed.", truth: "FD interest is taxed as income. After tax and inflation, real returns are often negative. Equity MFs have consistently beaten inflation over 10+ year periods." },
    { myth: "You need to time the market to profit from mutual funds.", truth: "SIPs automate the 'buy more when cheap' behavior. Time in the market always beats timing the market. Discipline is your only required skill." },
    { myth: "High NAV funds are expensive — low NAV ones are better.", truth: "NAV is just a price label. What matters is future growth percentage — not the starting number. A ₹500 NAV fund can grow faster than a ₹10 one." },
    { myth: "Mutual funds have too many hidden charges.", truth: "SEBI caps expense ratios and mandates full daily disclosure. Index funds cost as little as 0.1%. Compare this to direct stock trading: brokerage + STT + GST on every trade." },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif", color: "#1F2937" }}>

      {/* NAV */}
      <div style={{ background: "white", borderBottom: "1px solid #E2E8F0", zIndex: 30, position: "sticky", top: 0 }}>
        <div style={{ maxWidth: "1152px", margin: "0 auto" }}>
          <AnalysisTabs />
        </div>
      </div>

      {/* ── HERO ── */}
      <section style={{ background: "linear-gradient(155deg, #F0FDF4 0%, #EFF6FF 55%, #FFF7ED 100%)", borderBottom: "1px solid #E2E8F0", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 1px 1px, rgba(16,185,129,0.07) 1px, transparent 0)", backgroundSize: "32px 32px", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: -100, right: -60, width: "500px", height: "500px", background: "radial-gradient(circle, rgba(59,130,246,0.09) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: "400px", height: "400px", background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: "1100px", margin: "0 auto", padding: "clamp(40px,6vw,72px) clamp(16px,4vw,32px) clamp(40px,6vw,64px)" }}>
          <Reveal>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "100px", padding: "5px 16px", marginBottom: "20px" }}>
              <span style={{ width: "7px", height: "7px", background: "#10B981", borderRadius: "50%" }} />
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#065F46", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>The Iron-Clad Framework · For Every Indian Investor</span>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <h1 style={{ fontSize: "clamp(2rem,6vw,3.8rem)", fontWeight: 900, color: "#0F172A", lineHeight: 1.05, letterSpacing: "-0.04em", marginBottom: "20px", maxWidth: "800px" }}>
              Why Mutual Funds?<br />
              <span style={{ background: "linear-gradient(90deg, #059669 0%, #2563EB 60%, #7C3AED 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", display: "block" }}>
                The Smartest Financial Vehicle Ever Built.
              </span>
            </h1>
          </Reveal>
          <Reveal delay={200}>
            <p style={{ fontSize: "clamp(14px,2vw,17px)", color: "#475569", lineHeight: 1.8, maxWidth: "560px" }}>
              Not because SEBI told you to. Because of <strong>structural advantages</strong> built into the DNA of mutual funds — advantages that protect, compound, and grow your wealth even while you sleep.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── BODY ── */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "clamp(32px,5vw,60px) clamp(16px,4vw,32px)" }}>

        {/* ── PROBLEM BLOCK ── */}
        <Reveal>
          <div style={{ background: "linear-gradient(135deg, #FFF7ED, #FEF2F2)", border: "1.5px solid #FDE68A", borderRadius: "24px", padding: "clamp(20px,4vw,34px)", marginBottom: "52px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -20, right: -16, fontSize: "90px", opacity: 0.06 }}>🤔</div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "100px", padding: "4px 12px", marginBottom: "12px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#DC2626", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>The Problem Every Indian Faces</span>
            </div>
            <h2 style={{ fontSize: "clamp(16px,3vw,22px)", fontWeight: 800, color: "#0F172A", margin: "0 0 10px", lineHeight: 1.2 }}>Your money is quietly losing value — even in an FD.</h2>
            <p style={{ fontSize: "clamp(12px,1.8vw,13.5px)", color: "#475569", lineHeight: 1.8, marginBottom: "20px", maxWidth: "660px" }}>
              A savings account gives ~3.5%. FDs give ~7% — but after 30% income tax, that's ~4.9%. With inflation at 5–6%, your <strong>real post-tax return is barely positive or even negative.</strong> You're saving diligently and still falling behind. Equity mutual funds, held patiently, have been the answer for millions who figured this out.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px" }}>
              {[
                { icon: "🏦", label: "Savings Account", sub: "After inflation: real wealth declines", bad: true },
                { icon: "📜", label: "FD (post-tax)", sub: "After tax + inflation: barely positive", bad: true },
                { icon: "🥇", label: "Gold", sub: "Volatile, no cash flow, storage costs", bad: true },
                { icon: "📈", label: "Equity Mutual Fund", sub: "Real wealth creation over 10+ years", bad: false },
              ].map((s, i) => (
                <div key={i} style={{ background: s.bad ? "#FEF2F2" : "#ECFDF5", border: `1px solid ${s.bad ? "#FECACA" : "#A7F3D0"}`, borderRadius: "12px", padding: "12px 13px", display: "flex", gap: "9px", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "18px", flexShrink: 0 }}>{s.icon}</span>
                  <div>
                    <div style={{ fontSize: "11.5px", fontWeight: 700, color: s.bad ? "#991B1B" : "#065F46" }}>{s.label}</div>
                    <div style={{ fontSize: "10.5px", color: s.bad ? "#DC2626" : "#059669", marginTop: "2px", lineHeight: 1.4 }}>{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* ── IRON-CLAD STRUCTURE ── */}
        <Reveal>
          <div style={{ marginBottom: "14px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: "100px", padding: "4px 12px", marginBottom: "10px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#7C3AED", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>Why the Vehicle Wins</span>
            </div>
            <h2 style={{ fontSize: "clamp(18px,3vw,30px)", fontWeight: 900, color: "#0F172A", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
              The Iron-Clad Structure:{" "}
              <span style={{ background: "linear-gradient(90deg, #7C3AED, #059669)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Engineered to Win</span>
            </h2>
            <p style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.7, maxWidth: "560px", margin: "0 0 24px" }}>
              Mutual funds aren't just a product — the <strong>vehicle itself</strong> has structural advantages baked in by design and SEBI regulation. Even if you pick an average fund, the structure keeps compounding in your favour.
            </p>
          </div>
        </Reveal>

        {/* Dark intro banner */}
        <Reveal delay={80}>
          <div style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E3A8A 55%, #065F46 100%)", borderRadius: "24px", padding: "clamp(22px,4vw,38px)", marginBottom: "18px", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", gap: "clamp(16px,4vw,40px)", flexWrap: "wrap" }}>
            <div style={{ position: "absolute", top: -60, right: -60, width: "300px", height: "300px", background: "radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ flex: "1 1 240px", position: "relative" }}>
              <div style={{ fontSize: "clamp(14px,2.5vw,18px)", fontWeight: 900, color: "white", lineHeight: 1.3, marginBottom: "10px" }}>
                "Invest in the Structure,<br />Not Just the Manager."
              </div>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", lineHeight: 1.75, margin: 0, maxWidth: "400px" }}>
                Even an average fund selection is protected by the mutual fund wrapper — legal safeguards, SIP discipline, tax efficiency, and the market's underlying economic growth.
              </p>
            </div>
            <div style={{ flex: "0 0 auto", display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
              {[{ icon: "⚡", label: "Tax Free" }, { icon: "🔒", label: "Legal Safety" }, { icon: "🤖", label: "SIP Auto" }, { icon: "🛡️", label: "Beta Floor" }, { icon: "🔄", label: "Free Rebalance" }, { icon: "🐋", label: "Wholesale" }].map((b, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", padding: "8px 10px", textAlign: "center", minWidth: "64px" }}>
                  <div style={{ fontSize: "17px", marginBottom: "3px" }}>{b.icon}</div>
                  <div style={{ fontSize: "8.5px", fontWeight: 700, color: "rgba(255,255,255,0.8)", lineHeight: 1.2 }}>{b.label}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Structure cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px", marginBottom: "52px" }}>
          {structureCards.map((card, i) => (
            <StructureCard key={i} {...card} delay={i * 65} />
          ))}
        </div>

        {/* Structure conclusion bar */}
        <Reveal>
          <div style={{ background: "linear-gradient(90deg, #ECFDF5 0%, #EFF6FF 100%)", border: "1.5px solid #A7F3D0", borderRadius: "16px", padding: "18px 22px", marginBottom: "56px", display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "26px", flexShrink: 0 }}>🏗️</span>
            <div>
              <div style={{ fontSize: "13.5px", fontWeight: 800, color: "#0F172A", marginBottom: "2px" }}>The structure is the moat.</div>
              <p style={{ fontSize: "12px", color: "#475569", margin: 0, lineHeight: 1.65, maxWidth: "660px" }}>
                No other investment vehicle combines tax-free internal compounding, legal asset separation, institutional buying power, behavioral automation, and regulatory protection — all in one wrapper, starting at ₹100/month.
              </p>
            </div>
          </div>
        </Reveal>

        {/* ── THE 3 PILLARS ── */}
        <Reveal>
          <div style={{ marginBottom: "14px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(5,150,105,0.08)", border: "1px solid rgba(5,150,105,0.2)", borderRadius: "100px", padding: "4px 12px", marginBottom: "10px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#059669", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>The Iron-Clad Framework</span>
            </div>
            <h2 style={{ fontSize: "clamp(18px,3vw,28px)", fontWeight: 800, color: "#0F172A", margin: "0 0 6px" }}>3 Pillars: Diversify → Select → Exit</h2>
            <p style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.7, maxWidth: "520px", margin: "0 0 24px" }}>
              The vehicle wins — now these 3 pillars tell you exactly <em>how</em> to use it right.
            </p>
          </div>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", marginBottom: "52px" }}>
          {pillars.map((p, i) => (
            <Reveal key={i} delay={i * 110}>
              <PillarCard {...p} />
            </Reveal>
          ))}
        </div>

        {/* ── MYTH BUSTERS ── */}
        <Reveal>
          <div style={{ marginBottom: "14px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "100px", padding: "4px 12px", marginBottom: "10px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#DC2626", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>Myth Busters</span>
            </div>
            <h2 style={{ fontSize: "clamp(17px,3vw,26px)", fontWeight: 800, color: "#0F172A", margin: "0 0 4px" }}>6 Things Your Neighbour Got Wrong</h2>
            <p style={{ fontSize: "12px", color: "#64748B", margin: "0 0 20px" }}>👆 Tap each card to reveal the truth</p>
          </div>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px", marginBottom: "52px" }}>
          {myths.map((m, i) => <MythCard key={i} myth={m.myth} truth={m.truth} delay={i * 65} />)}
        </div>

        {/* ── JOURNEY MAP ── */}
        <Reveal>
          <div style={{ background: "white", borderRadius: "24px", border: "1.5px solid #E2E8F0", padding: "clamp(20px,4vw,34px)", marginBottom: "48px", boxShadow: "0 4px 24px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: "100px", padding: "4px 12px", marginBottom: "12px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#1D4ED8", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>Your Journey</span>
            </div>
            <h2 style={{ fontSize: "clamp(16px,3vw,22px)", fontWeight: 800, color: "#0F172A", margin: "0 0 4px" }}>The Typical Indian Investor's Path</h2>
            <p style={{ fontSize: "12px", color: "#64748B", marginBottom: "22px", lineHeight: 1.6 }}>A story that mirrors millions of Indians — and how the Iron-Clad Framework changes everything.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px" }}>
              {[
                { age: "Age 22–25", icon: "😅", title: "The Starter", body: "Parks salary in savings. Misses the early compounding years.", color: "#DC2626", bg: "#FEF2F2", bd: "#FECACA" },
                { age: "Age 25–30", icon: "🌱", title: "The Awakening", body: "Starts SIP. Panics in a correction but stays invested.", color: "#D97706", bg: "#FFFBEB", bd: "#FDE68A" },
                { age: "Age 30–40", icon: "📈", title: "The Accelerator", body: "SIP increased. Mid-cap and flexi-cap added for diversification.", color: "#2563EB", bg: "#EFF6FF", bd: "#BFDBFE" },
                { age: "Age 40–55", icon: "🏗️", title: "The Builder", body: "Annual rebalancing. Equity gains shift to debt as goals approach.", color: "#7C3AED", bg: "#F5F3FF", bd: "#DDD6FE" },
                { age: "Age 55+", icon: "🌴", title: "The Harvest", body: "SWP delivers tax-efficient monthly income. Financial freedom.", color: "#059669", bg: "#ECFDF5", bd: "#A7F3D0" },
              ].map((s, i) => (
                <div key={i} style={{ background: s.bg, border: `1.5px solid ${s.bd}`, borderRadius: "16px", padding: "14px", textAlign: "center" }}>
                  <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "white", border: `2px solid ${s.bd}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "19px", margin: "0 auto 7px" }}>{s.icon}</div>
                  <div style={{ fontSize: "9px", fontWeight: 700, color: s.color, letterSpacing: "0.05em", marginBottom: "3px" }}>{s.age}</div>
                  <div style={{ fontSize: "11.5px", fontWeight: 800, color: "#0F172A", marginBottom: "4px" }}>{s.title}</div>
                  <p style={{ fontSize: "10.5px", color: "#475569", lineHeight: 1.5, margin: 0 }}>{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* ── CONCLUSION BANNER ── */}
        <Reveal>
          <div style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E3A8A 60%, #065F46 100%)", borderRadius: "28px", padding: "clamp(26px,5vw,48px)", marginBottom: "24px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -50, right: -50, width: "300px", height: "300px", background: "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "relative" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "100px", padding: "5px 14px", marginBottom: "14px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#A7F3D0", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>The Conclusion</span>
              </div>
              <h2 style={{ fontSize: "clamp(20px,4vw,32px)", fontWeight: 900, color: "white", margin: "0 0 12px", lineHeight: 1.15, maxWidth: "600px" }}>
                Invest in the Structure.<br />Not Just the Manager.
              </h2>
              <p style={{ fontSize: "clamp(12px,1.8vw,14px)", color: "rgba(255,255,255,0.72)", lineHeight: 1.8, maxWidth: "540px", marginBottom: "22px" }}>
                Legal protection, tax efficiency, SIP discipline, and market participation — all in one wrapper. You don't need to be perfect. You just need to stay invested.
              </p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {["✅ Start with ₹100/month", "✅ Professionally managed", "✅ SEBI regulated", "✅ Compounding works for you"].map((point, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "100px", padding: "5px 12px", fontSize: "11.5px", fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>{point}</div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        {/* ── CTA ── */}
        <Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "14px", marginBottom: "22px" }}>
            <a href="/find-my-fund" style={{ textDecoration: "none", background: "linear-gradient(90deg, #059669 0%, #2563EB 100%)", borderRadius: "20px", padding: "clamp(18px,3vw,26px)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", boxShadow: "0 8px 32px rgba(5,150,105,0.3)", transition: "transform 0.2s, box-shadow 0.2s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 16px 48px rgba(5,150,105,0.4)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 8px 32px rgba(5,150,105,0.3)"; }}>
              <div>
                <div style={{ fontSize: "11.5px", fontWeight: 700, color: "rgba(255,255,255,0.8)", marginBottom: "4px" }}>Ready to start?</div>
                <div style={{ fontSize: "clamp(16px,2.5vw,20px)", fontWeight: 900, color: "white", lineHeight: 1.2 }}>Build My Fund Plan →</div>
                <div style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.7)", marginTop: "4px" }}>Goal-based · Live data · Free</div>
              </div>
              <span style={{ fontSize: "36px", flexShrink: 0 }}>⚡</span>
            </a>
            <a href="/find-my-fund-lifetime-plan" style={{ textDecoration: "none", background: "linear-gradient(135deg, #FFFBEB, #F0FDF4)", border: "1.5px solid #FDE68A", borderRadius: "20px", padding: "clamp(18px,3vw,26px)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", transition: "transform 0.2s, box-shadow 0.2s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 8px 32px rgba(217,119,6,0.15)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = ""; }}>
              <div>
                <div style={{ fontSize: "11.5px", fontWeight: 700, color: "#92400E", marginBottom: "4px" }}>Multiple goals?</div>
                <div style={{ fontSize: "clamp(16px,2.5vw,20px)", fontWeight: 900, color: "#0F172A", lineHeight: 1.2 }}>My Lifetime Plan →</div>
                <div style={{ fontSize: "10.5px", color: "#64748B", marginTop: "4px" }}>Car · Home · Education · Retirement</div>
              </div>
              <span style={{ fontSize: "36px", flexShrink: 0 }}>🌱</span>
            </a>
          </div>
        </Reveal>

        {/* Disclaimer */}
        <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "12px 18px", fontSize: "10.5px", color: "#94A3B8", lineHeight: 1.6, textAlign: "center" }}>
          <strong style={{ color: "#64748B" }}>Important:</strong> Mutual fund investments are subject to market risks. Past performance is not indicative of future returns. This page is for educational purposes only. Please consult a SEBI-registered investment advisor before investing.
        </div>
      </div>
    </div>
  );
}