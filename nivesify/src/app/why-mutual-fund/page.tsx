"use client";

import React, { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// SUB-NAV TABS (integrated into hero)
// ─────────────────────────────────────────────────────────────────────────────
const SUB_TABS = [
  { label: "Why Mutual Funds", href: "/why-mutual-fund", active: true },
  { label: "Smart Fund Finder", href: "/mutual-fund-match", active: false },
  { label: "MF Industry Analysis", href: "/mutual-fund-analysis", active: false },
  { label: "Active Funds", href: "/active-funds", active: false },
  { label: "Passive Funds", href: "/index-funds", active: false },
];

function SubNavTabs() {
  const scrollRef = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={scrollRef}
      style={{
        display: "flex",
        gap: "4px",
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        paddingBottom: "2px",
      }}
    >
      {SUB_TABS.map((tab) => (
        <a
          key={tab.href}
          href={tab.href}
          style={{
            flexShrink: 0,
            textDecoration: "none",
            padding: "6px 14px",
            borderRadius: "100px",
            fontSize: "12px",
            fontWeight: tab.active ? 700 : 500,
            color: tab.active ? "#059669" : "rgba(255,255,255,0.6)",
            background: tab.active ? "rgba(255,255,255,0.12)" : "transparent",
            border: tab.active ? "1px solid rgba(255,255,255,0.25)" : "1px solid transparent",
            transition: "all 0.2s",
            whiteSpace: "nowrap",
            letterSpacing: "0.01em",
          }}
          onMouseEnter={(e) => {
            if (!tab.active) {
              (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.9)";
              (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.07)";
            }
          }}
          onMouseLeave={(e) => {
            if (!tab.active) {
              (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.6)";
              (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
            }
          }}
        >
          {tab.label}
        </a>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCROLL REVEAL
// ─────────────────────────────────────────────────────────────────────────────
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
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.07 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(26px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION LABEL
// ─────────────────────────────────────────────────────────────────────────────
function SectionLabel({
  text,
  color = "#059669",
  bg = "rgba(5,150,105,0.08)",
  border = "rgba(5,150,105,0.2)",
}: {
  text: string;
  color?: string;
  bg?: string;
  border?: string;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: "100px",
        padding: "4px 13px",
        marginBottom: "10px",
      }}
    >
      <span
        style={{
          fontSize: "11px",
          fontWeight: 700,
          color,
          letterSpacing: "0.09em",
          textTransform: "uppercase" as const,
        }}
      >
        {text}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FAQ ITEM
// ─────────────────────────────────────────────────────────────────────────────
function FAQItem({ q, a, delay }: { q: string; a: string; delay: number }) {
  const [open, setOpen] = useState(false);
  return (
    <Reveal delay={delay}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          cursor: "pointer",
          background: "white",
          border: "1.5px solid #E2E8F0",
          borderRadius: "14px",
          overflow: "hidden",
          transition: "box-shadow 0.2s",
          boxShadow: open ? "0 4px 20px rgba(0,0,0,0.07)" : "none",
        }}
      >
        <div
          style={{
            padding: "16px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A", lineHeight: 1.4 }}>
            {q}
          </span>
          <span
            style={{
              fontSize: "18px",
              color: "#94A3B8",
              flexShrink: 0,
              transition: "transform 0.3s",
              transform: open ? "rotate(45deg)" : "rotate(0deg)",
            }}
          >
            +
          </span>
        </div>
        {open && (
          <div
            style={{
              padding: "0 18px 16px",
              paddingTop: "12px",
              fontSize: "12.5px",
              color: "#475569",
              lineHeight: 1.7,
              borderTop: "1px solid #F1F5F9",
            }}
          >
            {a}
          </div>
        )}
      </div>
    </Reveal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MYTH FLIP CARD
// ─────────────────────────────────────────────────────────────────────────────
function MythCard({ myth, truth, delay }: { myth: string; truth: string; delay: number }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <Reveal delay={delay}>
      <div
        onClick={() => setFlipped(!flipped)}
        style={{ cursor: "pointer", height: "140px", perspective: "1000px" }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            transformStyle: "preserve-3d",
            transition: "transform 0.55s ease",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden" as const,
              background: "linear-gradient(135deg,#FEF2F2,#FFF5F5)",
              border: "1.5px solid #FECACA",
              borderRadius: "16px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "9.5px",
                  fontWeight: 800,
                  color: "#DC2626",
                  letterSpacing: "0.09em",
                  textTransform: "uppercase" as const,
                  marginBottom: "7px",
                }}
              >
                ❌ Common Myth
              </div>
              <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#7F1D1D", lineHeight: 1.45 }}>
                {myth}
              </div>
            </div>
            <div style={{ fontSize: "9.5px", color: "#DC2626", fontWeight: 600 }}>
              Tap to see the truth →
            </div>
          </div>
          {/* Back */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden" as const,
              transform: "rotateY(180deg)",
              background: "linear-gradient(135deg,#ECFDF5,#F0FFF4)",
              border: "1.5px solid #A7F3D0",
              borderRadius: "16px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "9.5px",
                  fontWeight: 800,
                  color: "#059669",
                  letterSpacing: "0.09em",
                  textTransform: "uppercase" as const,
                  marginBottom: "7px",
                }}
              >
                ✅ The Truth
              </div>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#064E3B", lineHeight: 1.55 }}>
                {truth}
              </div>
            </div>
            <div style={{ fontSize: "9.5px", color: "#059669", fontWeight: 600 }}>Tap to flip back →</div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PILLAR CARD
// ─────────────────────────────────────────────────────────────────────────────
function PillarCard({
  number,
  icon,
  title,
  subtitle,
  points,
  color,
  bg,
  border,
}: {
  number: string;
  icon: string;
  title: string;
  subtitle: string;
  points: { icon: string; title: string; body: string }[];
  color: string;
  bg: string;
  border: string;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      style={{
        background: "white",
        borderRadius: "22px",
        border: `1.5px solid ${border}`,
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        transition: "box-shadow 0.3s,transform 0.3s",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          background: bg,
          padding: "20px 20px 16px",
          borderBottom: `1px solid ${border}`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -14,
            right: -10,
            fontSize: "80px",
            opacity: 0.06,
            lineHeight: 1,
          }}
        >
          {number}
        </div>
        <div style={{ display: "flex", gap: "11px", alignItems: "flex-start" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "11px",
              background: "white",
              border: `1.5px solid ${border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "19px",
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
          <div>
            <div
              style={{
                fontSize: "9.5px",
                fontWeight: 800,
                color,
                letterSpacing: "0.1em",
                textTransform: "uppercase" as const,
                marginBottom: "2px",
              }}
            >
              Pillar {number}
            </div>
            <h3
              style={{
                fontSize: "clamp(14px,2.2vw,17px)",
                fontWeight: 800,
                color: "#0F172A",
                margin: 0,
                lineHeight: 1.25,
              }}
            >
              {title}
            </h3>
            <p style={{ fontSize: "11px", color: "#64748B", margin: "3px 0 0", lineHeight: 1.5 }}>
              {subtitle}
            </p>
          </div>
        </div>
      </div>
      <div style={{ padding: "16px 20px", flex: 1 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
          {points.slice(0, expanded ? points.length : 2).map((p, i) => (
            <div key={i} style={{ display: "flex", gap: "9px", alignItems: "flex-start" }}>
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "8px",
                  background: bg,
                  border: `1px solid ${border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "13px",
                  flexShrink: 0,
                }}
              >
                {p.icon}
              </div>
              <div>
                <div style={{ fontSize: "11.5px", fontWeight: 700, color, marginBottom: "2px" }}>
                  {p.title}
                </div>
                <div style={{ fontSize: "11px", color: "#475569", lineHeight: 1.6 }}>{p.body}</div>
              </div>
            </div>
          ))}
        </div>
        {points.length > 2 && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              marginTop: "11px",
              width: "100%",
              background: bg,
              border: `1px solid ${border}`,
              borderRadius: "9px",
              padding: "6px",
              fontSize: "11px",
              fontWeight: 700,
              color,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {expanded ? "▲ Show less" : `▼ ${points.length - 2} more insights`}
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STRUCTURE CARD
// ─────────────────────────────────────────────────────────────────────────────
function StructureCard({
  icon,
  bigStat,
  statLabel,
  title,
  body,
  color,
  bg,
  border,
  accentGradient,
  visual,
  delay,
}: {
  icon: string;
  bigStat: string;
  statLabel: string;
  title: string;
  body: string;
  color: string;
  bg: string;
  border: string;
  accentGradient: string;
  visual: React.ReactNode;
  delay: number;
}) {
  return (
    <Reveal delay={delay}>
      <div
        style={{
          background: "white",
          borderRadius: "22px",
          border: `1.5px solid ${border}`,
          overflow: "hidden",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          transition: "box-shadow 0.3s,transform 0.3s",
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 14px 52px rgba(0,0,0,0.12)";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-5px)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.06)";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        }}
      >
        <div style={{ height: "4px", background: accentGradient }} />
        <div
          style={{
            background: bg,
            padding: "22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "140px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `radial-gradient(circle at 70% 50%, ${color}10 0%, transparent 60%)`,
            }}
          />
          <div style={{ position: "relative", zIndex: 1, width: "100%" }}>{visual}</div>
        </div>
        <div style={{ padding: "16px 18px 18px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "9px",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "9px",
                background: bg,
                border: `1.5px solid ${border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "15px",
                flexShrink: 0,
              }}
            >
              {icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "12px", fontWeight: 800, color, lineHeight: 1.25, marginBottom: "1px" }}>
                {title}
              </div>
              {bigStat && (
                <div style={{ fontSize: "9.5px", fontWeight: 600, color: "#94A3B8" }}>{statLabel}</div>
              )}
            </div>
            {bigStat && (
              <div
                style={{
                  background: accentGradient,
                  borderRadius: "8px",
                  padding: "3px 9px",
                  fontSize: "11.5px",
                  fontWeight: 900,
                  color: "white",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {bigStat}
              </div>
            )}
          </div>
          <p style={{ fontSize: "11.5px", color: "#475569", lineHeight: 1.7, margin: 0 }}>{body}</p>
        </div>
      </div>
    </Reveal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INLINE SVG VISUALS (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
const TaxFreeViz = ({ color }: { color: string }) => (
  <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", justifyContent: "center", width: "100%" }}>
    <div style={{ flex: 1, textAlign: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "3px", alignItems: "center", marginBottom: "7px" }}>
        {[55, 70, 52, 65, 60].map((w, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "3px", width: "100%" }}>
            <div style={{ width: `${w}%`, height: "11px", borderRadius: "3px", background: i === 1 || i === 3 ? "#FECACA" : "#E2E8F0" }} />
            {(i === 1 || i === 3) && <span style={{ fontSize: "8px", color: "#DC2626", fontWeight: 700, whiteSpace: "nowrap" }}>💸 tax</span>}
          </div>
        ))}
      </div>
      <div style={{ fontSize: "9px", fontWeight: 700, color: "#94A3B8" }}>Direct Stocks</div>
    </div>
    <div style={{ fontSize: "14px", fontWeight: 900, color: "#CBD5E1", paddingBottom: "22px" }}>VS</div>
    <div style={{ flex: 1, textAlign: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "3px", alignItems: "center", marginBottom: "7px" }}>
        {[55, 70, 80, 88, 96].map((w, i) => (
          <div key={i} style={{ width: `${Math.min(w, 100)}%`, height: "11px", borderRadius: "3px", background: `${color}${["44","66","88","BB","FF"][i]}` }} />
        ))}
      </div>
      <div style={{ fontSize: "9px", fontWeight: 700, color: "#374151" }}>Mutual Fund</div>
    </div>
  </div>
);

const PricingViz = ({ color }: { color: string }) => (
  <div style={{ display: "flex", gap: "14px", alignItems: "center", justifyContent: "center" }}>
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "34px", marginBottom: "4px" }}>🐟</div>
      <div style={{ fontSize: "8.5px", fontWeight: 700, color: "#94A3B8", marginBottom: "3px" }}>You (Retail)</div>
      <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "7px", padding: "2px 7px", fontSize: "8.5px", fontWeight: 700, color: "#DC2626" }}>+0.5–1% slippage</div>
    </div>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
      <div style={{ width: "1px", height: "20px", background: "#E2E8F0" }} />
      <div style={{ fontSize: "8.5px", fontWeight: 800, color: "#374151", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "5px", padding: "2px 5px", whiteSpace: "nowrap" }}>SAME STOCK</div>
      <div style={{ width: "1px", height: "20px", background: "#E2E8F0" }} />
    </div>
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "34px", marginBottom: "4px" }}>🐋</div>
      <div style={{ fontSize: "8.5px", fontWeight: 700, color: "#374151", marginBottom: "3px" }}>Fund (QIB)</div>
      <div style={{ background: `${color}18`, border: `1px solid ${color}40`, borderRadius: "7px", padding: "2px 7px", fontSize: "8.5px", fontWeight: 700, color }}>~0% impact</div>
    </div>
  </div>
);

const TrustViz = ({ color }: { color: string }) => (
  <div style={{ textAlign: "center" }}>
    <div style={{ width: "106px", height: "106px", borderRadius: "50%", border: `2px dashed ${color}40`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", position: "relative" }}>
      <div style={{ position: "absolute", top: "-8px", left: "50%", transform: "translateX(-50%)", background: "white", border: `1px solid ${color}30`, borderRadius: "100px", padding: "2px 8px", fontSize: "7.5px", fontWeight: 700, color, whiteSpace: "nowrap" }}>SEBI Custodian Trust</div>
      <div style={{ width: "68px", height: "68px", borderRadius: "50%", background: `${color}12`, border: `2px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1px" }}>
        <div style={{ fontSize: "24px" }}>🛡️</div>
        <div style={{ fontSize: "7.5px", fontWeight: 800, color, lineHeight: 1.2, textAlign: "center" }}>YOUR UNITS</div>
      </div>
    </div>
    <div style={{ fontSize: "9.5px", color: "#059669", fontWeight: 700, marginTop: "7px" }}>✅ Safe even if AMC goes bankrupt</div>
  </div>
);

const SIPViz = ({ color }: { color: string }) => (
  <div style={{ width: "100%" }}>
    <div style={{ position: "relative", height: "60px", marginBottom: "7px" }}>
      <svg viewBox="0 0 280 60" style={{ width: "100%", height: "100%" }}>
        <polyline points="0,42 36,36 60,50 88,18 118,52 150,28 180,46 212,14 244,34 280,20" fill="none" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="0,42 36,36 60,50 88,18 118,52 150,28 180,46 212,14 244,34 280,20" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
        {[[60, 50], [118, 52], [180, 46]].map(([x, y], i) => (
          <g key={i}><circle cx={x} cy={y} r="5.5" fill={color} /><text x={x} y={y - 9} textAnchor="middle" fontSize="7" fill={color} fontWeight="800">SIP ↓</text></g>
        ))}
        <circle cx={88} cy={18} r="5.5" fill="#EF4444" />
        <text x={88} y={10} textAnchor="middle" fontSize="7" fill="#EF4444" fontWeight="800">😱 sell</text>
      </svg>
    </div>
    <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "9px", fontWeight: 700, color }}>
        <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: color }} /> SIP buys on dips
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "9px", fontWeight: 700, color: "#EF4444" }}>
        <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#EF4444" }} /> Panic = locked loss
      </div>
    </div>
  </div>
);

const BetaFloorViz = ({ color }: { color: string }) => (
  <div style={{ width: "100%", textAlign: "center" }}>
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: "7px", height: "74px", marginBottom: "5px" }}>
      {[{ h: 100, label: "Top" }, { h: 78, label: "Good" }, { h: 58, label: "Avg" }, { h: 42, label: "Poor" }].map((b, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", flex: 1 }}>
          <div style={{ fontSize: "7.5px", fontWeight: 700, color: i === 0 ? color : "#94A3B8" }}>{b.label}</div>
          <div style={{ width: "100%", height: `${b.h * 0.68}px`, background: `${color}${["FF", "BB", "77", "44"][i]}`, borderRadius: "5px 5px 0 0", minHeight: "3px" }} />
        </div>
      ))}
    </div>
    <div style={{ height: "2px", background: "#EF4444", borderRadius: "1px", marginBottom: "5px" }} />
    <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "100px", padding: "2px 9px" }}>
      <div style={{ width: "7px", height: "2px", background: "#EF4444", borderRadius: "1px" }} />
      <span style={{ fontSize: "8.5px", fontWeight: 700, color: "#DC2626" }}>Beta Floor — every fund still grows with the economy</span>
    </div>
  </div>
);

const ElasticityViz = ({ color }: { color: string }) => (
  <div style={{ width: "100%" }}>
    <div style={{ display: "flex", gap: "3px", alignItems: "center", justifyContent: "center" }}>
      {[
        { emoji: "📈", label: "Equity", bg: "#EFF6FF", bd: "#BFDBFE", tc: "#2563EB" },
        { arrow: true, color: "#059669" },
        { emoji: "🏦", label: "Debt", bg: "#FFFBEB", bd: "#FDE68A", tc: "#D97706" },
        { arrow: true, color: "#059669" },
        { emoji: "🥇", label: "Gold", bg: "#FEF2F2", bd: "#FECACA", tc: "#DC2626" },
      ].map((item: any, i) =>
        item.arrow ? (
          <div key={i} style={{ fontSize: "16px", color: "#059669", fontWeight: 900, padding: "0 1px" }}>→</div>
        ) : (
          <div key={i} style={{ textAlign: "center", background: item.bg, border: `1.5px solid ${item.bd}`, borderRadius: "10px", padding: "7px 5px", minWidth: "50px" }}>
            <div style={{ fontSize: "19px" }}>{item.emoji}</div>
            <div style={{ fontSize: "7.5px", fontWeight: 700, color: item.tc, marginTop: "2px" }}>{item.label}</div>
          </div>
        )
      )}
    </div>
    <div style={{ textAlign: "center", marginTop: "9px" }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: `${color}14`, border: `1px solid ${color}35`, borderRadius: "100px", padding: "3px 11px", fontSize: "9.5px", fontWeight: 700, color }}>
        💸 Zero capital gains tax on every internal shift
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// POOLING DIAGRAM
// ─────────────────────────────────────────────────────────────────────────────
const PoolingDiagram = () => (
  <div style={{ width: "100%", display: "flex", alignItems: "center", gap: "clamp(8px,2vw,20px)", justifyContent: "center", flexWrap: "wrap" }}>
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "center" }}>
      {[{ emoji: "👨‍💼", label: "₹1,000" }, { emoji: "👩‍🏫", label: "₹5,000" }, { emoji: "👨‍🔧", label: "₹500" }, { emoji: "👩‍⚕️", label: "₹10,000" }].map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "5px 10px", fontSize: "12px" }}>
          <span>{p.emoji}</span><span style={{ fontSize: "10px", fontWeight: 700, color: "#374151" }}>{p.label}</span>
        </div>
      ))}
      <div style={{ fontSize: "9px", color: "#94A3B8", fontWeight: 600 }}>Many investors</div>
    </div>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
      <div style={{ fontSize: "22px", color: "#10B981" }}>→</div>
      <div style={{ fontSize: "8.5px", color: "#059669", fontWeight: 700 }}>Pool money</div>
    </div>
    <div style={{ background: "linear-gradient(135deg,#EFF6FF,#F5F3FF)", border: "2px solid #BFDBFE", borderRadius: "16px", padding: "12px 14px", textAlign: "center", minWidth: "90px" }}>
      <div style={{ fontSize: "26px", marginBottom: "4px" }}>🏦</div>
      <div style={{ fontSize: "10px", fontWeight: 800, color: "#1E40AF" }}>Mutual Fund</div>
      <div style={{ fontSize: "8.5px", color: "#64748B", marginTop: "2px" }}>Managed by expert</div>
    </div>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
      <div style={{ fontSize: "22px", color: "#10B981" }}>→</div>
      <div style={{ fontSize: "8.5px", color: "#059669", fontWeight: 700 }}>Invests in</div>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: "5px", alignItems: "flex-start" }}>
      {[
        { emoji: "🏭", label: "Company stocks", c: "#2563EB", bg: "#EFF6FF", bd: "#BFDBFE" },
        { emoji: "📄", label: "Govt bonds", c: "#059669", bg: "#ECFDF5", bd: "#A7F3D0" },
        { emoji: "🥇", label: "Gold / other", c: "#D97706", bg: "#FFFBEB", bd: "#FDE68A" },
      ].map((a, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", background: a.bg, border: `1px solid ${a.bd}`, borderRadius: "8px", padding: "5px 10px" }}>
          <span style={{ fontSize: "13px" }}>{a.emoji}</span>
          <span style={{ fontSize: "10px", fontWeight: 700, color: a.c }}>{a.label}</span>
        </div>
      ))}
      <div style={{ fontSize: "9px", color: "#94A3B8", fontWeight: 600 }}>Diversified basket</div>
    </div>
  </div>
);

// NAV analogy diagram
const NAVDiagram = () => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px", width: "100%" }}>
    {[
      { icon: "🍕", title: "Pizza Analogy", desc: "1 large pizza (the fund) sliced into many pieces (units). You buy as many slices as your budget allows.", color: "#D97706", bg: "#FFFBEB", bd: "#FDE68A" },
      { icon: "📈", title: "NAV goes up", desc: "Pizza value rises (stocks perform) → your slices are worth more. You profit proportionally.", color: "#059669", bg: "#ECFDF5", bd: "#A7F3D0" },
      { icon: "📉", title: "NAV goes down", desc: "Markets fall → slice value drops temporarily. Stay invested — the pizza always recovers its value over time.", color: "#2563EB", bg: "#EFF6FF", bd: "#BFDBFE" },
    ].map((c, i) => (
      <div key={i} style={{ background: c.bg, border: `1.5px solid ${c.bd}`, borderRadius: "12px", padding: "12px", textAlign: "center" }}>
        <div style={{ fontSize: "24px", marginBottom: "5px" }}>{c.icon}</div>
        <div style={{ fontSize: "10.5px", fontWeight: 800, color: c.color, marginBottom: "4px" }}>{c.title}</div>
        <div style={{ fontSize: "10px", color: "#475569", lineHeight: 1.55 }}>{c.desc}</div>
      </div>
    ))}
  </div>
);

// HOW TO START
const HowToStartSteps = () => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
    {[
      { step: "1", icon: "🎯", title: "Set your goal", desc: "Emergency fund? Vacation? House? Pick one.", color: "#2563EB", bg: "#EFF6FF", bd: "#BFDBFE" },
      { step: "2", icon: "🆔", title: "Complete KYC", desc: "Aadhaar + PAN online. Takes ~5 minutes.", color: "#7C3AED", bg: "#F5F3FF", bd: "#DDD6FE" },
      { step: "3", icon: "🏦", title: "Choose a platform", desc: "MF Central, Groww, Zerodha, or directly from AMC.", color: "#059669", bg: "#ECFDF5", bd: "#A7F3D0" },
      { step: "4", icon: "📋", title: "Pick a fund", desc: "Index fund for starters. Match to your goal & horizon.", color: "#D97706", bg: "#FFFBEB", bd: "#FDE68A" },
      { step: "5", icon: "⚡", title: "Start SIP", desc: "Set a monthly auto-debit. As low as ₹100/month.", color: "#DC2626", bg: "#FEF2F2", bd: "#FECACA" },
      { step: "6", icon: "⏳", title: "Stay patient", desc: "Review annually. Don't panic on dips. Let time work.", color: "#0891B2", bg: "#ECFEFF", bd: "#A5F3FC" },
    ].map((s, i) => (
      <div key={i} style={{ background: s.bg, border: `1.5px solid ${s.bd}`, borderRadius: "14px", padding: "14px 12px", textAlign: "center", position: "relative" }}>
        <div style={{ position: "absolute", top: "8px", right: "10px", fontSize: "9px", fontWeight: 900, color: s.color, opacity: 0.35 }}>0{s.step}</div>
        <div style={{ fontSize: "24px", marginBottom: "6px" }}>{s.icon}</div>
        <div style={{ fontSize: "11px", fontWeight: 800, color: s.color, marginBottom: "4px" }}>{s.title}</div>
        <div style={{ fontSize: "10.5px", color: "#475569", lineHeight: 1.55 }}>{s.desc}</div>
      </div>
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function WhyMutualFundsPage() {
  const structureCards = [
    { icon: "⚡", bigStat: "~1.5%", statLabel: "saved annually vs direct stocks", title: "Tax-Free Internal Compounding", body: "When the fund manager switches stocks, you pay zero capital gains tax. Do this yourself with direct stocks → you're taxed 12.5–20% every time. This 'tax drag' silently destroys compounding over decades.", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", accentGradient: "linear-gradient(90deg,#2563EB,#7C3AED)", visual: <TaxFreeViz color="#2563EB" /> },
    { icon: "🐋", bigStat: "~0%", statLabel: "market impact cost at QIB scale", title: "Institutional Buying Power", body: "Funds buy stocks in hundreds of crores as Qualified Institutional Buyers — near-zero market impact cost. A retail investor buying the same stock pays 0.5–1% slippage per trade. You get whale power on a fish budget.", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", accentGradient: "linear-gradient(90deg,#7C3AED,#2563EB)", visual: <PricingViz color="#7C3AED" /> },
    { icon: "🔒", bigStat: "100%", statLabel: "safe even if AMC goes bankrupt", title: "Legal Asset Separation", body: "Your money sits in a legally separate custodian trust — isolated from the AMC's balance sheet. Even if your AMC shuts down, your units are untouched. SEBI mandates this. No FD offers this protection above ₹5L.", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", accentGradient: "linear-gradient(90deg,#059669,#0891B2)", visual: <TrustViz color="#059669" /> },
    { icon: "🤖", bigStat: "1–3%", statLabel: "extra returns from discipline", title: "SIP Automates Good Behavior", body: "Auto-debit on the 5th every month means you buy more units when markets crash — automatically. This 'behavioral alpha' is one of the most underrated edges in investing. No willpower needed.", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", accentGradient: "linear-gradient(90deg,#D97706,#DC2626)", visual: <SIPViz color="#D97706" /> },
    { icon: "🛡️", bigStat: "Even bad picks", statLabel: "still capture market growth", title: "The Beta Floor Safety Net", body: "Even a below-average fund still captures the economy's underlying growth. SEBI mandates category-appropriate investing, preventing catastrophic divergence from benchmarks. You don't need to be perfect — just invested.", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", accentGradient: "linear-gradient(90deg,#DC2626,#D97706)", visual: <BetaFloorViz color="#DC2626" /> },
    { icon: "🔄", bigStat: "Zero tax", statLabel: "on internal asset-class shifts", title: "Tax-Free Asset Rebalancing", body: "Switch between equity, debt, and gold inside a multi-asset fund → zero capital gains tax. Do the same with direct investments → taxable event every time. This frictionless rebalancing saves ~1% per year in friction.", color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC", accentGradient: "linear-gradient(90deg,#0891B2,#059669)", visual: <ElasticityViz color="#0891B2" /> },
  ];

  const pillars = [
    { number: "1", icon: "🗂️", title: "Diversify Smart, Not Just Wide", subtitle: "Different return drivers — not just different fund names", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", points: [{ icon: "⚠️", title: "The Overlap Trap", body: "5 large-cap funds all hold the same 30 stocks. You pay 5× fees for 1× exposure. Always check portfolio overlap first." }, { icon: "🔺", title: "Core & Satellite (90% Rule)", body: "90% of returns come from asset allocation. Passive Core (~70%) for low-cost returns + Active Satellites (~30%) for alpha." }, { icon: "📊", title: "The Style Box", body: "Cover Value, Core, and Momentum styles across Large, Mid, and Small cap — each thrives in different market cycles." }, { icon: "🏆", title: "All-Weather Portfolio", body: "Broad Market Index (Anchor) + Flexi-Cap + Mid-Cap + Small-Cap + Factor ETF = genuinely diversified across return drivers." }] },
    { number: "2", icon: "🔬", title: "Select by Skill, Not Returns", subtitle: "Pick funds that win consistently — not just last year", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", points: [{ icon: "📐", title: "Information Ratio", body: "IR = (Fund Return − Benchmark) ÷ Tracking Error. IR above 0.5 = consistent alpha. Never trust 1-year returns alone." }, { icon: "🐟", title: "AUM Trap for Small/Mid Cap", body: "A bloated small-cap fund can't buy nimble stocks anymore. Too much AUM = closet index fund. Watch for AUM bloat." }, { icon: "🏁", title: "Tracking Difference", body: "For index funds, real cost is TD = Fund Return − Index Return. Lower TD = genuinely better performance." }, { icon: "👨‍🍳", title: "Skin in the Game", body: "Does the manager invest their own money in their fund? SEBI now mandates disclosure. Owners think differently than managers." }] },
    { number: "3", icon: "🚪", title: "Exit by Plan, Not by Panic", subtitle: "Most wealth is destroyed by exiting at the wrong time", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", points: [{ icon: "📅", title: "Goal-Based Exit", body: "Life milestones dictate sell orders — not news headlines. A 10% dip is irrelevant for a 20-year goal." }, { icon: "📰", title: "Never Exit on Noise", body: "Reactive selling locks in losses and misses the recovery that always follows. Market noise is not a sell signal." }, { icon: "⚖️", title: "Rebalance Annually", body: "If equity grows from 60% to 75% of portfolio, sell the 15% excess into debt. Mechanical, not emotional." }, { icon: "🚦", title: "Style Drift vs Underperformance", body: "WAIT if Value style is out of fashion. EXIT only if fund lags peers for 18+ months or manager changes core strategy." }] },
  ];

  const faqs = [
    { q: "Is my money safe in a mutual fund?", a: "Your money is held in a legally separate custodian trust regulated by SEBI. Even if the AMC shuts down, your units remain safe. However, the value of your investment can go up or down based on market performance — that's different from safety of your units." },
    { q: "What is NAV and why does it change every day?", a: "NAV (Net Asset Value) is the per-unit price of a mutual fund — like a stock price. It changes daily because the underlying stocks and bonds in the portfolio change in value. A higher NAV doesn't mean expensive; it just reflects cumulative growth." },
    { q: "Can I lose all my money in a mutual fund?", a: "Losing everything is extremely unlikely in a diversified mutual fund. To lose 100%, every single company in the fund's portfolio (often 50–100 companies) would need to go bankrupt simultaneously — which has never happened for a broad market fund. You can, however, see temporary value drops." },
    { q: "What is the difference between direct and regular plans?", a: "Regular plans are bought through distributors/agents who earn a commission — this is baked into a higher expense ratio. Direct plans are bought directly from the AMC or through direct platforms. Direct plans have lower expense ratios (typically 0.5–1% less) and hence give better long-term returns." },
    { q: "How are mutual fund returns taxed?", a: "Equity funds: gains held over 1 year are taxed at 12.5% (LTCG above ₹1.25L). Gains within 1 year are taxed at 20% (STCG). Debt funds: gains are added to your income and taxed at your income slab rate regardless of holding period. ELSS funds offer ₹1.5L deduction under Section 80C." },
    { q: "What is SIP and how is it different from lumpsum?", a: "SIP (Systematic Investment Plan) means investing a fixed amount every month — like an auto-debit. Lumpsum means investing a large amount all at once. SIP is recommended for salaried investors as it automates discipline and averages out market entry price over time (called rupee cost averaging)." },
    { q: "How do I choose my first mutual fund?", a: "For most beginners: start with a simple Nifty 50 or Nifty 500 index fund from a large AMC (HDFC, SBI, ICICI, Nippon, Mirae). Low expense ratio (~0.1%), no fund manager risk, instant diversification across India's top companies. Once comfortable, you can explore flexi-cap or mid-cap funds." },
  ];

  const myths = [
    { myth: "Mutual funds are only for experts or the wealthy.", truth: "You can start with ₹100/month SIP. No expertise needed — experts manage it for you." },
    { myth: "You can lose everything in a mutual fund.", truth: "A diversified fund holds 50–100 stocks. All of them would need to go to zero simultaneously — that's never happened." },
    { myth: "FD is safer. At least returns are guaranteed.", truth: "FD interest is taxed as income. After tax + inflation, real returns are often negative. MFs beat inflation over 10+ years." },
    { myth: "You need to time the market to make money.", truth: "SIPs automate 'buy more when cheap'. Time in the market beats timing the market every time." },
    { myth: "High NAV funds are expensive — low NAV is better.", truth: "NAV is just a price label, like a stock price. What matters is future growth %, not the starting number." },
    { myth: "Mutual funds have too many hidden charges.", truth: "SEBI mandates full daily disclosure. Index funds cost as little as 0.1%. Far less than direct stock trading fees." },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F8FAFC",
        fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
        color: "#1F2937",
      }}
    >
      {/* ── HERO with embedded sub-nav ── */}
      <section
        style={{
          background: "linear-gradient(155deg,#0F172A 0%,#1E3A5F 55%,#065F46 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* dot grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)",
            backgroundSize: "28px 28px",
            pointerEvents: "none",
          }}
        />
        {/* glow */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -60,
            width: "500px",
            height: "500px",
            background: "radial-gradient(circle,rgba(16,185,129,0.15) 0%,transparent 65%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "relative",
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "clamp(32px,5vw,56px) clamp(16px,4vw,32px) clamp(28px,4vw,44px)",
          }}
        >
          {/* Breadcrumb / page context */}
          <Reveal>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: "20px",
                flexWrap: "wrap",
              }}
            >
              <a
                href="/"
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.45)",
                  textDecoration: "none",
                  letterSpacing: "0.03em",
                }}
              >
                Nivesify
              </a>
              <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "11px" }}>/</span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.45)",
                  letterSpacing: "0.03em",
                }}
              >
                Mutual Fund World
              </span>
            </div>
          </Reveal>

          {/* Title */}
          <Reveal delay={60}>
            <h1
              style={{
                fontSize: "clamp(1.75rem,5vw,3.2rem)",
                fontWeight: 900,
                color: "white",
                lineHeight: 1.08,
                letterSpacing: "-0.03em",
                marginBottom: "10px",
                maxWidth: "720px",
              }}
            >
              Mutual Funds —{" "}
              <span
                style={{
                  background: "linear-gradient(90deg,#34D399 0%,#60A5FA 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Simply, Clearly, Completely.
              </span>
            </h1>
          </Reveal>

          <Reveal delay={120}>
            <p
              style={{
                fontSize: "clamp(13px,1.8vw,15px)",
                color: "rgba(255,255,255,0.62)",
                lineHeight: 1.75,
                maxWidth: "500px",
                marginBottom: "28px",
              }}
            >
              What they are, how they work, their real benefits and risks, what they cost, and exactly
              how to get started — all in one place.
            </p>
          </Reveal>

          {/* ── SUB-NAV TABS ── */}
          <Reveal delay={180}>
            <div
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "14px",
                padding: "6px 8px",
                display: "block",
                width: "100%",
                maxWidth: "fit-content",
                boxSizing: "border-box",
                overflow: "hidden",
              }}
            >
              <SubNavTabs />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── BODY ── */}
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "clamp(28px,5vw,56px) clamp(16px,4vw,32px)",
        }}
      >
        {/* SECTION 1 */}
        <Reveal>
          <div
            style={{
              background: "white",
              borderRadius: "24px",
              border: "1.5px solid #E2E8F0",
              padding: "clamp(20px,4vw,36px)",
              marginBottom: "40px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.05)",
            }}
          >
            <SectionLabel text="Section 1 · Definition" />
            <h2 style={{ fontSize: "clamp(18px,3vw,26px)", fontWeight: 800, color: "#0F172A", margin: "0 0 8px" }}>
              What is a Mutual Fund?
            </h2>
            <p style={{ fontSize: "clamp(13px,1.8vw,15px)", color: "#475569", lineHeight: 1.8, maxWidth: "680px", marginBottom: "28px" }}>
              A mutual fund <strong>pools money from many investors</strong> to buy a diversified basket of
              stocks, bonds, or other assets. A professional fund manager makes all investment decisions.
              You own a proportional share — called <strong>units</strong> — of the entire pool.
            </p>
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "16px", padding: "clamp(14px,3vw,28px)", marginBottom: "24px", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase" as const, letterSpacing: "0.08em", textAlign: "center", marginBottom: "18px" }}>
                How the Pool Works
              </div>
              <PoolingDiagram />
            </div>
            <div style={{ background: "linear-gradient(90deg,#ECFDF5,#EFF6FF)", border: "1.5px solid #A7F3D0", borderRadius: "12px", padding: "14px 18px", display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "24px", flexShrink: 0 }}>💡</span>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#0F172A", margin: 0, lineHeight: 1.6 }}>
                Think of it like a <strong>group buying club</strong>. Alone you can only afford one share of
                one company. Together, the pool buys hundreds of companies — and you own a small piece of all of them.
              </p>
            </div>
          </div>
        </Reveal>

        {/* SECTION 2 */}
        <Reveal>
          <div style={{ background: "white", borderRadius: "24px", border: "1.5px solid #E2E8F0", padding: "clamp(20px,4vw,36px)", marginBottom: "40px", boxShadow: "0 4px 24px rgba(0,0,0,0.05)" }}>
            <SectionLabel text="Section 2 · How It Works" color="#2563EB" bg="rgba(37,99,235,0.08)" border="rgba(37,99,235,0.2)" />
            <h2 style={{ fontSize: "clamp(18px,3vw,26px)", fontWeight: 800, color: "#0F172A", margin: "0 0 8px" }}>
              How Do Mutual Funds Actually Work?
            </h2>
            <p style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.7, maxWidth: "620px", marginBottom: "24px" }}>
              Three concepts explain everything: NAV (unit price), Units (your ownership), and SIP (how you invest regularly).
            </p>
            <NAVDiagram />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginTop: "18px" }}>
              {[
                { term: "NAV", full: "Net Asset Value", explain: "The per-unit price of the fund. Calculated daily. Buy low, accumulate units, sell when higher. Simple.", icon: "💹", color: "#2563EB", bg: "#EFF6FF", bd: "#BFDBFE" },
                { term: "Units", full: "Your ownership stake", explain: "When you invest ₹5,000 at NAV ₹50, you get 100 units. As NAV rises to ₹80, your 100 units = ₹8,000.", icon: "🎫", color: "#7C3AED", bg: "#F5F3FF", bd: "#DDD6FE" },
                { term: "SIP", full: "Systematic Investment Plan", explain: "Auto-debit a fixed amount monthly. Buys more units when cheap, fewer when expensive — automatically averaging your cost.", icon: "🔁", color: "#059669", bg: "#ECFDF5", bd: "#A7F3D0" },
              ].map((c, i) => (
                <div key={i} style={{ background: c.bg, border: `1.5px solid ${c.bd}`, borderRadius: "14px", padding: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <span style={{ fontSize: "20px" }}>{c.icon}</span>
                    <div>
                      <span style={{ fontSize: "14px", fontWeight: 900, color: c.color }}>{c.term}</span>
                      <span style={{ fontSize: "10px", color: "#64748B", fontWeight: 600, marginLeft: "6px" }}>{c.full}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: "11.5px", color: "#475569", lineHeight: 1.65, margin: 0 }}>{c.explain}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* SECTION 3 — PROS & CONS */}
        <Reveal>
          <div style={{ marginBottom: "40px" }}>
            <SectionLabel text="Section 3 · Pros & Cons" color="#D97706" bg="rgba(217,119,6,0.08)" border="rgba(217,119,6,0.2)" />
            <h2 style={{ fontSize: "clamp(18px,3vw,26px)", fontWeight: 800, color: "#0F172A", margin: "0 0 6px" }}>
              The Honest Picture — Benefits & Risks
            </h2>
            <p style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.7, maxWidth: "560px", marginBottom: "20px" }}>
              No investment is perfect. Here's exactly what mutual funds do well — and where you need to be aware.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
              {/* Pros */}
              <div style={{ background: "linear-gradient(135deg,#ECFDF5,#F0FFF4)", border: "1.5px solid #A7F3D0", borderRadius: "20px", padding: "20px 22px" }}>
                <div style={{ fontSize: "13px", fontWeight: 800, color: "#059669", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ background: "#059669", color: "white", borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>✓</span>
                  Benefits
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {[
                    { icon: "🗂️", title: "Instant diversification", body: "Own 50–100 companies from day one — even with ₹500." },
                    { icon: "👨‍💼", title: "Professional management", body: "Expert fund managers research and decide so you don't have to." },
                    { icon: "💧", title: "High liquidity", body: "Redeem any time. Money credited in 1–3 working days." },
                    { icon: "🔢", title: "Low minimum investment", body: "Start SIPs from ₹100/month. No large lumpsum required." },
                    { icon: "🛡️", title: "SEBI regulated", body: "Strict oversight, mandatory disclosure, and legal asset protection." },
                    { icon: "💰", title: "Tax efficiency", body: "Long-term equity gains taxed at just 12.5%. Internal rebalancing is tax-free." },
                  ].map((p, i) => (
                    <div key={i} style={{ display: "flex", gap: "9px", alignItems: "flex-start" }}>
                      <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "rgba(5,150,105,0.12)", border: "1px solid #A7F3D0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", flexShrink: 0 }}>{p.icon}</div>
                      <div>
                        <div style={{ fontSize: "11.5px", fontWeight: 700, color: "#065F46" }}>{p.title}</div>
                        <div style={{ fontSize: "11px", color: "#475569", lineHeight: 1.55 }}>{p.body}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Cons */}
              <div style={{ background: "linear-gradient(135deg,#FEF2F2,#FFF5F5)", border: "1.5px solid #FECACA", borderRadius: "20px", padding: "20px 22px" }}>
                <div style={{ fontSize: "13px", fontWeight: 800, color: "#DC2626", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ background: "#DC2626", color: "white", borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>!</span>
                  Risks & Limitations
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {[
                    { icon: "📉", title: "Market risk", body: "Returns are not guaranteed. Equity funds can fall 20–40% in bad years." },
                    { icon: "🏦", title: "Fund manager risk", body: "Active funds depend on manager skill. A manager change can hurt performance." },
                    { icon: "💸", title: "Costs reduce returns", body: "Expense ratios of 0.1–2% are deducted daily. Higher costs = lower net returns." },
                    { icon: "🔒", title: "Lock-in for ELSS", body: "ELSS tax-saving funds have a mandatory 3-year lock-in period." },
                    { icon: "⏰", title: "Returns take time", body: "Equity mutual funds need 5+ years to reliably beat inflation. Not for short-term goals." },
                    { icon: "🎰", title: "No guaranteed income", body: "Unlike FDs, there's no fixed interest. Dividends are not assured either." },
                  ].map((p, i) => (
                    <div key={i} style={{ display: "flex", gap: "9px", alignItems: "flex-start" }}>
                      <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "rgba(220,38,38,0.1)", border: "1px solid #FECACA", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", flexShrink: 0 }}>{p.icon}</div>
                      <div>
                        <div style={{ fontSize: "11.5px", fontWeight: 700, color: "#991B1B" }}>{p.title}</div>
                        <div style={{ fontSize: "11px", color: "#475569", lineHeight: 1.55 }}>{p.body}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* SECTION 4 — IRON-CLAD STRUCTURE */}
        <Reveal>
          <SectionLabel text="Section 4 · Why the Vehicle Wins" color="#7C3AED" bg="rgba(124,58,237,0.08)" border="rgba(124,58,237,0.2)" />
          <h2 style={{ fontSize: "clamp(18px,3vw,28px)", fontWeight: 900, color: "#0F172A", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
            The Iron-Clad Structure:{" "}
            <span style={{ background: "linear-gradient(90deg,#7C3AED,#059669)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Engineered to Win
            </span>
          </h2>
          <p style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.7, maxWidth: "560px", margin: "0 0 20px" }}>
            Beyond the basic benefits — the mutual fund <strong>vehicle itself</strong> has structural advantages that no other investment product offers.
          </p>
        </Reveal>

        <Reveal delay={80}>
          <div style={{ background: "linear-gradient(135deg,#0F172A 0%,#1E3A8A 55%,#065F46 100%)", borderRadius: "22px", padding: "clamp(18px,4vw,36px)", marginBottom: "16px", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", gap: "clamp(14px,4vw,36px)", flexWrap: "wrap" }}>
            <div style={{ position: "absolute", top: -50, right: -50, width: "280px", height: "280px", background: "radial-gradient(circle,rgba(16,185,129,0.18) 0%,transparent 70%)", pointerEvents: "none" }} />
            <div style={{ flex: "1 1 220px", position: "relative" }}>
              <div style={{ fontSize: "clamp(13px,2.5vw,17px)", fontWeight: 900, color: "white", lineHeight: 1.3, marginBottom: "8px" }}>"Invest in the Structure, Not Just the Manager."</div>
              <p style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.68)", lineHeight: 1.75, margin: 0, maxWidth: "380px" }}>Even an average fund pick is protected by the mutual fund wrapper — legal safeguards, SIP discipline, tax efficiency, and the market's economic growth floor.</p>
            </div>
            <div style={{ flex: "0 0 auto", display: "flex", gap: "7px", flexWrap: "wrap", justifyContent: "center" }}>
              {[{ icon: "⚡", label: "Tax Free" }, { icon: "🔒", label: "Legal Safety" }, { icon: "🤖", label: "SIP Auto" }, { icon: "🛡️", label: "Beta Floor" }, { icon: "🔄", label: "Free Rebalance" }, { icon: "🐋", label: "Wholesale" }].map((b, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "9px", padding: "7px 9px", textAlign: "center", minWidth: "58px" }}>
                  <div style={{ fontSize: "16px", marginBottom: "2px" }}>{b.icon}</div>
                  <div style={{ fontSize: "8px", fontWeight: 700, color: "rgba(255,255,255,0.8)", lineHeight: 1.2 }}>{b.label}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px", marginBottom: "48px" }}>
          {structureCards.map((card, i) => <StructureCard key={i} {...card} delay={i * 60} />)}
        </div>

        {/* SECTION 5 — COSTS */}
        <Reveal>
          <div style={{ background: "white", borderRadius: "24px", border: "1.5px solid #E2E8F0", padding: "clamp(20px,4vw,34px)", marginBottom: "40px", boxShadow: "0 4px 24px rgba(0,0,0,0.05)" }}>
            <SectionLabel text="Section 5 · What Does It Cost?" color="#D97706" bg="rgba(217,119,6,0.08)" border="rgba(217,119,6,0.2)" />
            <h2 style={{ fontSize: "clamp(17px,3vw,24px)", fontWeight: 800, color: "#0F172A", margin: "0 0 8px" }}>Understanding Mutual Fund Costs</h2>
            <p style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.7, maxWidth: "600px", marginBottom: "20px" }}>Costs directly reduce your returns. Knowing them helps you make smarter choices.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "20px" }}>
              {[
                { icon: "📊", term: "Expense Ratio", explain: "Annual fee charged to manage the fund. Deducted daily from NAV automatically. Index funds: 0.1–0.5%. Active funds: 0.5–2%.", range: "0.1% – 2%", rangeLabel: "annual fee", color: "#2563EB", bg: "#EFF6FF", bd: "#BFDBFE" },
                { icon: "🚪", term: "Exit Load", explain: "A penalty for exiting too early — typically 1% if you redeem within 1 year of investing. Encourages long-term holding. Most index funds have 0% exit load.", range: "0–1%", rangeLabel: "early exit penalty", color: "#D97706", bg: "#FFFBEB", bd: "#FDE68A" },
                { icon: "↔️", term: "Direct vs Regular", explain: "Regular plans have a distributor commission embedded in a higher expense ratio. Direct plans skip the middleman — the same fund, but cheaper by 0.5–1% annually.", range: "0.5–1%", rangeLabel: "cheaper in Direct", color: "#059669", bg: "#ECFDF5", bd: "#A7F3D0" },
              ].map((c, i) => (
                <div key={i} style={{ background: c.bg, border: `1.5px solid ${c.bd}`, borderRadius: "14px", padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "7px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                      <span style={{ fontSize: "19px" }}>{c.icon}</span>
                      <span style={{ fontSize: "12.5px", fontWeight: 800, color: c.color }}>{c.term}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "13px", fontWeight: 900, color: c.color }}>{c.range}</div>
                      <div style={{ fontSize: "8.5px", color: "#94A3B8", fontWeight: 600 }}>{c.rangeLabel}</div>
                    </div>
                  </div>
                  <p style={{ fontSize: "11px", color: "#475569", lineHeight: 1.65, margin: 0 }}>{c.explain}</p>
                </div>
              ))}
            </div>
            <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "12px", padding: "12px 16px", fontSize: "12px", color: "#92400E", lineHeight: 1.65 }}>
              💡 <strong>Rule of thumb:</strong> For passive/index funds, always pick the lowest expense ratio. For active funds, focus on alpha after fees — not just returns. A fund that earns 14% but charges 2% is worse than one that earns 13% and charges 0.5%.
            </div>
          </div>
        </Reveal>

        {/* SECTION 6 — 3 PILLARS */}
        <Reveal>
          <SectionLabel text="Section 6 · The Iron-Clad Framework" color="#059669" />
          <h2 style={{ fontSize: "clamp(18px,3vw,26px)", fontWeight: 800, color: "#0F172A", margin: "0 0 6px" }}>3 Pillars for Serious Long-Term Investors</h2>
          <p style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.7, maxWidth: "540px", margin: "0 0 22px" }}>Once you understand the basics, these 3 pillars are how experienced investors build wealth systematically.</p>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px", marginBottom: "48px" }}>
          {pillars.map((p, i) => <Reveal key={i} delay={i * 100}><PillarCard {...p} /></Reveal>)}
        </div>

        {/* SECTION 7 — HOW TO START */}
        <Reveal>
          <div style={{ background: "white", borderRadius: "24px", border: "1.5px solid #E2E8F0", padding: "clamp(20px,4vw,34px)", marginBottom: "40px", boxShadow: "0 4px 24px rgba(0,0,0,0.05)" }}>
            <SectionLabel text="Section 7 · How to Start" color="#2563EB" bg="rgba(37,99,235,0.08)" border="rgba(37,99,235,0.2)" />
            <h2 style={{ fontSize: "clamp(17px,3vw,24px)", fontWeight: 800, color: "#0F172A", margin: "0 0 6px" }}>Start Investing in 6 Simple Steps</h2>
            <p style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.7, maxWidth: "540px", marginBottom: "22px" }}>From zero to first SIP — here's exactly what to do.</p>
            <HowToStartSteps />
            <div style={{ marginTop: "18px", background: "linear-gradient(90deg,#EFF6FF,#F5F3FF)", border: "1.5px solid #BFDBFE", borderRadius: "12px", padding: "13px 16px", fontSize: "12.5px", color: "#1E40AF", lineHeight: 1.65, display: "flex", gap: "10px" }}>
              <span style={{ fontSize: "18px", flexShrink: 0 }}>🎯</span>
              <div><strong>First fund recommendation for beginners:</strong> A Nifty 50 or Nifty 500 index fund from a large AMC (HDFC, SBI, ICICI, Nippon, Mirae Asset). Low expense ratio, no fund manager risk, instant diversification across India's top companies.</div>
            </div>
          </div>
        </Reveal>

        {/* MYTH BUSTERS */}
        <Reveal>
          <SectionLabel text="Myth Busters" color="#DC2626" bg="rgba(220,38,38,0.08)" border="rgba(220,38,38,0.2)" />
          <h2 style={{ fontSize: "clamp(17px,3vw,24px)", fontWeight: 800, color: "#0F172A", margin: "0 0 4px" }}>6 Things Your Neighbour Got Wrong</h2>
          <p style={{ fontSize: "12px", color: "#64748B", margin: "0 0 18px" }}>👆 Tap each card to reveal the truth</p>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px", marginBottom: "48px" }}>
          {myths.map((m, i) => <MythCard key={i} myth={m.myth} truth={m.truth} delay={i * 60} />)}
        </div>

        {/* SECTION 8 — FAQs */}
        <Reveal>
          <SectionLabel text="Section 8 · FAQs" color="#7C3AED" bg="rgba(124,58,237,0.08)" border="rgba(124,58,237,0.2)" />
          <h2 style={{ fontSize: "clamp(17px,3vw,24px)", fontWeight: 800, color: "#0F172A", margin: "0 0 6px" }}>Frequently Asked Questions</h2>
          <p style={{ fontSize: "12.5px", color: "#64748B", margin: "0 0 18px" }}>Tap any question to expand the answer.</p>
        </Reveal>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "52px" }}>
          {faqs.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} delay={i * 50} />)}
        </div>

        {/* CONCLUSION BANNER */}
        <Reveal>
          <div style={{ background: "linear-gradient(135deg,#0F172A 0%,#1E3A8A 60%,#065F46 100%)", borderRadius: "26px", padding: "clamp(24px,5vw,46px)", marginBottom: "22px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -50, right: -50, width: "280px", height: "280px", background: "radial-gradient(circle,rgba(16,185,129,0.15) 0%,transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "relative" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "100px", padding: "4px 13px", marginBottom: "14px" }}>
                <span style={{ fontSize: "10.5px", fontWeight: 700, color: "#A7F3D0", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>The Conclusion</span>
              </div>
              <h2 style={{ fontSize: "clamp(18px,4vw,30px)", fontWeight: 900, color: "white", margin: "0 0 10px", lineHeight: 1.15, maxWidth: "560px" }}>
                Invest in the Structure. Not Just the Manager.
              </h2>
              <p style={{ fontSize: "clamp(12px,1.8vw,13.5px)", color: "rgba(255,255,255,0.7)", lineHeight: 1.8, maxWidth: "520px", marginBottom: "20px" }}>
                Legal protection, tax efficiency, SIP discipline, and market participation — all in one wrapper, starting at ₹100/month. You don't need to be perfect. You just need to stay invested.
              </p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {["✅ Start with ₹100/month", "✅ Professionally managed", "✅ SEBI regulated", "✅ Compounding works for you"].map((point, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: "100px", padding: "4px 11px", fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>{point}</div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        {/* CTAs */}
        <Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px", marginBottom: "20px" }}>
            <a href="/find-my-fund" style={{ textDecoration: "none", background: "linear-gradient(90deg,#059669 0%,#2563EB 100%)", borderRadius: "18px", padding: "clamp(16px,3vw,24px)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", boxShadow: "0 8px 28px rgba(5,150,105,0.3)", transition: "transform 0.2s,box-shadow 0.2s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 14px 44px rgba(5,150,105,0.4)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 8px 28px rgba(5,150,105,0.3)"; }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.78)", marginBottom: "3px" }}>Ready to start?</div>
                <div style={{ fontSize: "clamp(15px,2.5vw,19px)", fontWeight: 900, color: "white", lineHeight: 1.2 }}>Build My Fund Plan →</div>
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.65)", marginTop: "3px" }}>Goal-based · Live data · Free</div>
              </div>
              <span style={{ fontSize: "34px", flexShrink: 0 }}>⚡</span>
            </a>
            <a href="/find-my-fund-lifetime-plan" style={{ textDecoration: "none", background: "linear-gradient(135deg,#FFFBEB,#F0FDF4)", border: "1.5px solid #FDE68A", borderRadius: "18px", padding: "clamp(16px,3vw,24px)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", transition: "transform 0.2s,box-shadow 0.2s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 8px 28px rgba(217,119,6,0.15)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = ""; }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#92400E", marginBottom: "3px" }}>Multiple goals?</div>
                <div style={{ fontSize: "clamp(15px,2.5vw,19px)", fontWeight: 900, color: "#0F172A", lineHeight: 1.2 }}>My Lifetime Plan →</div>
                <div style={{ fontSize: "10px", color: "#64748B", marginTop: "3px" }}>Car · Home · Education · Retirement</div>
              </div>
              <span style={{ fontSize: "34px", flexShrink: 0 }}>🌱</span>
            </a>
          </div>
        </Reveal>

        {/* Disclaimer */}
        <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "12px 18px", fontSize: "10.5px", color: "#94A3B8", lineHeight: 1.6, textAlign: "center" }}>
          <strong style={{ color: "#64748B" }}>Important Disclaimer:</strong> Mutual fund investments are subject to market risks. Past performance is not indicative of future returns. Returns shown are illustrative and based on historical data — not guaranteed. Please read all scheme-related documents carefully before investing. Consult a SEBI-registered investment advisor for personalised advice.
        </div>
      </div>

      <style>{`
        * { -ms-overflow-style: none; scrollbar-width: none; box-sizing: border-box; }
        *::-webkit-scrollbar { display: none; }
        html { scroll-behavior: smooth; }
        img, iframe, table { max-width: 100%; }
        @media (max-width: 480px) {
          h1 { letter-spacing: -0.02em !important; }
          /* Myth flip cards: ensure full height on small screens */
          .myth-card { height: 160px !important; }
          /* FAQ items: bigger tap target */
          .faq-item { padding: 18px !important; }
        }
        @media (max-width: 640px) {
          section { padding-left: 14px !important; padding-right: 14px !important; }
        }
      `}</style>
    </div>
  );
}