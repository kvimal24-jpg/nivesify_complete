"use client";

import AnalysisTabs from "@/components/AnalysisTabs";
import React, { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED COUNTER
// ─────────────────────────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = "", prefix = "", duration = 2000 }: { target: number; suffix?: string; prefix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = Date.now();
        const animate = () => {
          const elapsed = Date.now() - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.round(eased * target));
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{prefix}{count.toLocaleString('en-IN')}{suffix}</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCROLL REVEAL WRAPPER
// ─────────────────────────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(32px)',
      transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      ...style
    }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PILLAR CARD
// ─────────────────────────────────────────────────────────────────────────────
function PillarCard({ number, icon, title, subtitle, points, color, bg, border }: {
  number: string; icon: string; title: string; subtitle: string;
  points: { icon: string; title: string; body: string }[];
  color: string; bg: string; border: string;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ background: 'white', borderRadius: '24px', border: `1.5px solid ${border}`, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.05)', transition: 'box-shadow 0.3s, transform 0.3s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 48px rgba(0,0,0,0.1)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 24px rgba(0,0,0,0.05)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}>
      {/* Header */}
      <div style={{ background: bg, padding: '24px 24px 20px', borderBottom: `1px solid ${border}`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, fontSize: '100px', opacity: 0.06, lineHeight: 1 }}>{number}</div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'white', border: `1.5px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>{icon}</div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 800, color: color, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '4px' }}>Pillar {number}</div>
            <h3 style={{ fontSize: 'clamp(16px,2.5vw,20px)', fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.2 }}>{title}</h3>
            <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 0', lineHeight: 1.5 }}>{subtitle}</p>
          </div>
        </div>
      </div>
      {/* Points */}
      <div style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {points.slice(0, expanded ? points.length : 2).map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>{p.icon}</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: color, marginBottom: '3px' }}>{p.title}</div>
                <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.65 }}>{p.body}</div>
              </div>
            </div>
          ))}
        </div>
        {points.length > 2 && (
          <button onClick={() => setExpanded(!expanded)} style={{ marginTop: '14px', width: '100%', background: bg, border: `1px solid ${border}`, borderRadius: '10px', padding: '8px', fontSize: '12px', fontWeight: 700, color: color, cursor: 'pointer', fontFamily: 'inherit', transition: 'opacity 0.2s' }}>
            {expanded ? '▲ Show less' : `▼ Show ${points.length - 2} more insights`}
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPARISON TABLE ROW
// ─────────────────────────────────────────────────────────────────────────────
function CompRow({ feature, mf, fd, stocks, gold }: { feature: string; mf: string; fd: string; stocks: string; gold: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr 1fr 1fr', gap: '0', borderBottom: '1px solid #F1F5F9' }}>
      <div style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center' }}>{feature}</div>
      <div style={{ padding: '12px 10px', fontSize: '12px', fontWeight: 700, color: '#059669', background: 'rgba(16,185,129,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', borderLeft: '1px solid #F1F5F9' }}>{mf}</div>
      <div style={{ padding: '12px 10px', fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', borderLeft: '1px solid #F1F5F9' }}>{fd}</div>
      <div style={{ padding: '12px 10px', fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', borderLeft: '1px solid #F1F5F9' }}>{stocks}</div>
      <div style={{ padding: '12px 10px', fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', borderLeft: '1px solid #F1F5F9' }}>{gold}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MYTH BUSTER CARD
// ─────────────────────────────────────────────────────────────────────────────
function MythCard({ myth, truth, delay }: { myth: string; truth: string; delay: number }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <Reveal delay={delay}>
      <div onClick={() => setFlipped(!flipped)} style={{ cursor: 'pointer', height: '160px', perspective: '1000px' }}>
        <div style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d', transition: 'transform 0.6s ease', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
          {/* Front — Myth */}
          <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', background: 'linear-gradient(135deg, #FEF2F2, #FFF5F5)', border: '1.5px solid #FECACA', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#DC2626', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>❌ Common Myth</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#7F1D1D', lineHeight: 1.4 }}>{myth}</div>
            </div>
            <div style={{ fontSize: '10px', color: '#DC2626', fontWeight: 600 }}>Tap to see the truth →</div>
          </div>
          {/* Back — Truth */}
          <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: 'linear-gradient(135deg, #ECFDF5, #F0FFF4)', border: '1.5px solid #A7F3D0', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#059669', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>✅ The Truth</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#064E3B', lineHeight: 1.5 }}>{truth}</div>
            </div>
            <div style={{ fontSize: '10px', color: '#059669', fontWeight: 600 }}>Tap to flip back →</div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOUNDING VISUALIZER
// ─────────────────────────────────────────────────────────────────────────────
function CompoundingViz() {
  const [monthly, setMonthly] = useState(5000);
  const [years, setYears] = useState(20);
  const rate = 12;
  const r = rate / 100 / 12;
  const n = years * 12;
  const fv = monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  const invested = monthly * n;
  const gain = fv - invested;
  const gainPct = Math.round((gain / invested) * 100);

  const barMax = fv;
  const investedW = Math.round((invested / barMax) * 100);
  const gainW = Math.round((gain / barMax) * 100);

  function fmtL(n: number) {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    return `₹${Math.round(n / 1000)}K`;
  }

  return (
    <div style={{ background: 'white', borderRadius: '24px', border: '1.5px solid #E2E8F0', padding: 'clamp(20px,3vw,32px)', boxShadow: '0 4px 32px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
        <span style={{ fontSize: '24px' }}>🧮</span>
        <h3 style={{ fontSize: 'clamp(16px,2.5vw,20px)', fontWeight: 800, color: '#0F172A', margin: 0 }}>The Compounding Magic — See It Yourself</h3>
      </div>
      <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '24px', lineHeight: 1.6 }}>Move the sliders. Watch what disciplined investing does to your wealth over time.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {[
          { label: 'Monthly SIP', value: monthly, setter: setMonthly, min: 500, max: 50000, step: 500, fmt: (v: number) => `₹${v.toLocaleString('en-IN')}` },
          { label: 'Investment Horizon', value: years, setter: setYears, min: 3, max: 40, step: 1, fmt: (v: number) => `${v} years` },
        ].map((s, i) => (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>{s.label}</label>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#2563EB' }}>{s.fmt(s.value)}</span>
            </div>
            <input type="range" min={s.min} max={s.max} step={s.step} value={s.value} onChange={e => s.setter(parseInt(e.target.value))}
              style={{ width: '100%', height: '6px', borderRadius: '100px', cursor: 'pointer', accentColor: '#2563EB' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94A3B8', marginTop: '4px' }}>
              <span>{s.fmt(s.min)}</span><span>{s.fmt(s.max)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Visual bar */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', borderRadius: '12px', overflow: 'hidden', height: '40px', marginBottom: '8px' }}>
          <div style={{ width: `${investedW}%`, background: '#BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#1E40AF', transition: 'width 0.5s ease', minWidth: investedW > 15 ? '60px' : '0' }}>
            {investedW > 20 ? 'Invested' : ''}
          </div>
          <div style={{ width: `${gainW}%`, background: 'linear-gradient(90deg, #34D399, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: 'white', transition: 'width 0.5s ease' }}>
            {gainW > 15 ? 'Market Magic ✨' : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', background: '#BFDBFE', borderRadius: '2px' }} />
            <span style={{ fontSize: '11px', color: '#64748B' }}>Your money in: <strong style={{ color: '#1E40AF' }}>{fmtL(invested)}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', background: '#10B981', borderRadius: '2px' }} />
            <span style={{ fontSize: '11px', color: '#64748B' }}>Market's gift: <strong style={{ color: '#059669' }}>{fmtL(gain)}</strong></span>
          </div>
        </div>
      </div>

      {/* Big numbers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {[
          { label: 'You Invest', value: fmtL(invested), color: '#1E40AF', bg: '#EFF6FF', bd: '#BFDBFE' },
          { label: 'Market Adds', value: fmtL(gain), color: '#059669', bg: '#ECFDF5', bd: '#A7F3D0' },
          { label: 'Total Wealth', value: fmtL(fv), color: '#7C3AED', bg: '#F5F3FF', bd: '#DDD6FE' },
        ].map((k, i) => (
          <div key={i} style={{ background: k.bg, border: `1.5px solid ${k.bd}`, borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600, marginBottom: '4px' }}>{k.label}</div>
            <div style={{ fontSize: 'clamp(16px,3vw,22px)', fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.value}</div>
          </div>
        ))}
      </div>
      {gainPct > 0 && (
        <div style={{ marginTop: '14px', background: 'linear-gradient(90deg, #ECFDF5, #EFF6FF)', border: '1px solid #A7F3D0', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: '#065F46', fontWeight: 600, textAlign: 'center' }}>
          🎯 The market creates {gainPct}% extra wealth on top of your own savings — for free, just for staying invested!
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function WhyMutualFundsPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "structure" | "selection" | "exit">("overview");

  const pillars = [
    {
      number: "1",
      icon: "🗂️",
      title: "Strategic Diversification & Style Balance",
      subtitle: "True diversification is about different return drivers — not just different fund names",
      color: "#2563EB",
      bg: "#EFF6FF",
      border: "#BFDBFE",
      points: [
        { icon: "⚠️", title: "The Overlap Trap", body: "Owning 5 large-cap funds sounds diversified but they all hold the same 30 stocks — HDFC Bank, Reliance, Infosys. You're paying 5x fees for 1x exposure. Always check portfolio overlap before adding a new fund." },
        { icon: "🔺", title: "Core & Satellite Architecture (The 90% Rule)", body: "90% of your returns come from asset allocation — not stock selection. Build a Passive Core (~70%) for market returns at near-zero cost. Add Active Satellites (~30%) for potential alpha in areas where managers genuinely add value." },
        { icon: "📊", title: "The Style Box Matrix", body: "Real diversification means covering different styles — Value, Core, Momentum — and different sizes — Large, Mid, Small. Each style performs well in different market cycles. A proper portfolio has exposure across the style box." },
        { icon: "🌐", title: "The Passive Spectrum", body: "Beyond plain vanilla Nifty 50, there are smart-beta strategies — Low Volatility, Quality, Value 20 — that target specific outcomes mechanically at low cost. These are rule-based satellites that don't depend on a fund manager's skill." },
        { icon: "🏆", title: "The All-Weather Portfolio Example", body: "A 35-year wealth-building portfolio needs: 40% Passive Broad Market (Anchor), 25% Active Flexi-Cap (Stable Growth), 15% Active Mid-Cap (Growth Booster), 10% Active Small-Cap (High Growth), 10% Factor ETF (Smart Satellite). This is genuinely diversified." },
      ],
    },
    {
      number: "2",
      icon: "🔬",
      title: "The Selection Framework & Quality Filters",
      subtitle: "How to pick funds that win by skill, not just luck",
      color: "#059669",
      bg: "#ECFDF5",
      border: "#A7F3D0",
      points: [
        { icon: "📐", title: "Information Ratio (IR) — The Skill Metric", body: "IR = (Portfolio Return − Benchmark Return) ÷ Tracking Error. An IR above 0.5 means the manager consistently generates alpha above benchmark risk taken. This separates genuine skill from lucky one-year spikes. Don't trust 1-year returns alone." },
        { icon: "🐟", title: "The AUM Trap for Mid/Small Cap Funds", body: "A ₹30,000 Cr small-cap fund cannot buy the same nimble stocks it bought at ₹3,000 Cr. Too much money chases too few good stocks. The fund becomes a 'closet index fund' — similar returns to the index, but you're paying active fees. Watch for AUM bloat." },
        { icon: "🏁", title: "Tracking Difference (TD) — The True Cost of Passive Funds", body: "For index funds, the real cost isn't the expense ratio — it's the Tracking Difference. TD = Fund Return − Index Return. A Nifty 50 fund with 0.2% expense ratio but -0.4% TD is worse than a fund with 0.1% expense ratio and -0.1% TD. Lower TD = better." },
        { icon: "🛤️", title: "Tracking Error (TE) — The Consistency Check", body: "TE measures daily volatility of the fund vs its index. Low TE means the fund smoothly mirrors the index day-by-day. High TE in a passive fund signals operational issues. Goal: choose index funds with both low TD and low TE." },
        { icon: "👨‍🍳", title: "Skin in the Game — The DNA Check", body: "Does the fund manager invest their own wealth in the scheme they manage? SEBI now requires AMCs to disclose this. A manager who has their own money at stake thinks and acts differently. Always check if the fund manager has meaningful personal investment in their fund." },
      ],
    },
    {
      number: "3",
      icon: "🚪",
      title: "The Exit Protocol & Discipline Filter",
      subtitle: "Exit with a plan — not an emotion. This is where most investors lose.",
      color: "#D97706",
      bg: "#FFFBEB",
      border: "#FDE68A",
      points: [
        { icon: "📅", title: "Goal-Based Exit (The Right Reason to Sell)", body: "Your life milestones should dictate sell orders — not news headlines. A 10% market dip is completely irrelevant for a 20-year retirement goal. The right time to gradually sell equity is 2–3 years before you actually need the money — move into safer debt funds then." },
        { icon: "📰", title: "Market-Based Exit (The Wrong Reason)", body: "Selling because markets fell 15%, or because some TV anchor said 'correction coming', or because your neighbour panicked — this is guaranteed wealth destruction. Reactive selling locks in losses and means you miss the recovery. Markets always recover. Panic never helps." },
        { icon: "⚖️", title: "The Rebalancing Trigger — Sell High, Stay Balanced", body: "If equity markets run hard and your equity grows from 60% to 75% of your portfolio, that 15% excess should be sold and moved to debt. This automatically 'locks in profits' and reduces risk. This is disciplined rebalancing — not emotional selling. Do this annually." },
        { icon: "🚦", title: "Underperformance vs Style Drift — The Traffic Light", body: "WAIT (Yellow Light): Fund underperforms because Value style is out of fashion right now. Style-driven underperformance is normal and will rotate back. Stay. EXIT (Red Light): Fund consistently lags benchmark AND peers for 18+ months, OR the manager has changed core strategy. This is style drift — now exit." },
        { icon: "🌉", title: "The Exit Rule — Plan Beats Emotion Every Time", body: "A successful exit is a pre-determined bridge to a real-world goal. If the goal hasn't arrived and the fund's DNA hasn't changed, stay the course. Don't let short-term taxes or market noise derail 20+ years of compounding. The bridge is your plan — follow it." },
      ],
    },
  ];

  const myths = [
    { myth: "Mutual funds are only for rich people or market experts.", truth: "You can start with ₹100/month via SIP. Professionals manage the portfolio — you just invest. SEBI regulates everything strictly." },
    { myth: "Mutual funds are like gambling — you can lose everything.", truth: "A diversified equity fund holds 50–100 stocks across sectors. No single company collapse can destroy your portfolio. The Beta Floor always holds." },
    { myth: "FD is safer — at least it gives guaranteed returns.", truth: "FD at 7% after 30% tax = 4.9%. Inflation at 6% = you're losing real wealth every year. Equity MFs have given 12–14% CAGR over 15+ years." },
    { myth: "I need to time the market to make money in mutual funds.", truth: "SIPs automate 'buy low' behavior. When markets fall, your SIP buys more units. When they rise, your NAV increases. Time in market beats timing the market." },
    { myth: "High NAV funds are expensive — low NAV ones are better value.", truth: "NAV is just a price label. A fund at NAV ₹500 is not more expensive than one at ₹10 — what matters is future growth percentage, not the starting number." },
    { myth: "Mutual funds have too many hidden charges.", truth: "SEBI caps expense ratios — 1.05% max for large active funds, 0.1-0.5% for index funds. All costs are disclosed daily. Compare this to PMS (2%+ flat) or stocks (brokerage + STT + GST per trade)." },
  ];

  const advantages = [
    { icon: "⚡", title: "Frictionless Compounding", body: "Internal portfolio rebalancing inside a mutual fund is TAX-FREE. When the fund manager switches stocks, you pay zero capital gains tax. This saves ~1.5% annually vs doing the same yourself with individual stocks.", color: "#2563EB", bg: "#EFF6FF", bd: "#BFDBFE" },
    { icon: "💸", title: "Institutional Wholesale Pricing", body: "Mutual funds buy stocks in crores — they get QIB (Qualified Institutional Buyer) status with near-zero market impact costs. A retail investor buying the same stocks individually pays 0.5–1% per transaction in slippage alone.", color: "#7C3AED", bg: "#F5F3FF", bd: "#DDD6FE" },
    { icon: "🔄", title: "Asset-Class Elasticity", body: "Move between equity, debt, and gold inside a multi-asset fund — ZERO tax event, zero exit load. Doing this yourself means triggering capital gains tax every time. The mutual fund wrapper makes tax-efficient shifting effortless.", color: "#059669", bg: "#ECFDF5", bd: "#A7F3D0" },
    { icon: "🔒", title: "Fiduciary Trust Structure", body: "Your money is legally separate from the AMC's money. Even if HDFC AMC or SBI Mutual Fund goes bankrupt, your units are 100% safe — held in a separate custodian trust. SEBI mandates this separation. You cannot lose money to AMC bankruptcy.", color: "#D97706", bg: "#FFFBEB", bd: "#FDE68A" },
    { icon: "🤖", title: "Automated Behavioral Guardrails (SIP)", body: "SIPs eliminate the biggest wealth destroyer — your own emotions. Auto-debiting ₹5,000 on the 5th of every month means you automatically buy more units when markets crash and fewer when they're expensive. This 'behavioral alpha' is worth 1–3% extra annual returns vs manual investing.", color: "#DC2626", bg: "#FEF2F2", bd: "#FECACA" },
    { icon: "🛡️", title: "The Beta Floor — Even a Bad Fund Wins", body: "Even if you pick a below-average fund, you still capture the market's underlying growth (GDP + corporate earnings growth). SEBI mandates category-appropriate investing, preventing catastrophic divergence from benchmarks. The structure saves you from your own fund selection mistakes.", color: "#0891B2", bg: "#ECFEFF", bd: "#A5F3FC" },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif", color: '#1F2937' }}>

      {/* NAV */}
      <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', zIndex: 30, position: 'sticky', top: 0 }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
          <AnalysisTabs />
        </div>
      </div>

      {/* ── HERO ── */}
      <section style={{ background: 'linear-gradient(155deg, #F0FDF4 0%, #EFF6FF 55%, #FFF7ED 100%)', borderBottom: '1px solid #E2E8F0', position: 'relative', overflow: 'hidden' }}>
        {/* Grid texture */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(16,185,129,0.07) 1px, transparent 0)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />
        {/* Glow orbs */}
        <div style={{ position: 'absolute', top: -100, right: -60, width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: '1100px', margin: '0 auto', padding: 'clamp(40px,6vw,72px) clamp(16px,4vw,32px) clamp(40px,6vw,64px)' }}>
          <Reveal>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '100px', padding: '5px 16px', marginBottom: '20px' }}>
              <span style={{ width: '7px', height: '7px', background: '#10B981', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#065F46', letterSpacing: '0.08em', textTransform: 'uppercase' }}>The Iron-Clad Framework · For Every Indian Investor</span>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <h1 style={{ fontSize: 'clamp(2rem,6vw,3.8rem)', fontWeight: 900, color: '#0F172A', lineHeight: 1.05, letterSpacing: '-0.04em', marginBottom: '20px', maxWidth: '800px' }}>
              Why Mutual Funds?<br />
              <span style={{ background: 'linear-gradient(90deg, #059669 0%, #2563EB 60%, #7C3AED 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'block' }}>
                The Smartest Financial Vehicle Ever Built.
              </span>
            </h1>
          </Reveal>

          <Reveal delay={200}>
            <p style={{ fontSize: 'clamp(14px,2vw,17px)', color: '#475569', lineHeight: 1.8, maxWidth: '600px', marginBottom: '36px' }}>
              Not because of SEBI ads. Not because your bank told you to. But because of <strong>structural advantages</strong> built into the very DNA of mutual funds — advantages that protect, compound, and grow your wealth even when you're asleep.
            </p>
          </Reveal>

          {/* Stat strip */}
          <Reveal delay={300}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', maxWidth: '700px' }}>
              {[
                { value: 10, suffix: 'Cr+', label: 'Indian SIP investors', color: '#2563EB', bg: '#EFF6FF', bd: '#BFDBFE' },
                { value: 68, suffix: 'L Cr', label: 'Total MF AUM in India', color: '#059669', bg: '#ECFDF5', bd: '#A7F3D0' },
                { value: 100, suffix: '', prefix: '₹', label: 'Minimum to start SIP', color: '#D97706', bg: '#FFFBEB', bd: '#FDE68A' },
                { value: 14, suffix: '%', label: 'Avg 15Y equity MF CAGR', color: '#7C3AED', bg: '#F5F3FF', bd: '#DDD6FE' },
              ].map((s, i) => (
                <div key={i} style={{ background: s.bg, border: `1.5px solid ${s.bd}`, borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 'clamp(22px,4vw,30px)', fontWeight: 900, color: s.color, lineHeight: 1 }}>
                    <AnimatedCounter target={s.value} suffix={s.suffix} prefix={s.prefix || ''} />
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', lineHeight: 1.3 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── THE STORY SECTION ── */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(32px,5vw,60px) clamp(16px,4vw,32px)' }}>

        {/* The Problem First */}
        <Reveal>
          <div style={{ background: 'linear-gradient(135deg, #FFF7ED, #FEF2F2)', border: '1.5px solid #FDE68A', borderRadius: '24px', padding: 'clamp(24px,4vw,40px)', marginBottom: '40px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -30, right: -30, fontSize: '120px', opacity: 0.06 }}>🤔</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '100px', padding: '4px 12px', marginBottom: '14px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#DC2626', letterSpacing: '0.08em', textTransform: 'uppercase' }}>The Problem Every Indian Faces</span>
            </div>
            <h2 style={{ fontSize: 'clamp(18px,3vw,26px)', fontWeight: 800, color: '#0F172A', margin: '0 0 12px', lineHeight: 1.2 }}>Your money is slowly dying in your savings account.</h2>
            <p style={{ fontSize: 'clamp(13px,2vw,15px)', color: '#475569', lineHeight: 1.8, marginBottom: '20px', maxWidth: '700px' }}>
              A savings account gives you 3.5%. Your bank FD gives you 7%. But inflation in India runs at 5–6%. After paying 30% income tax on your FD interest, your <strong>real post-inflation, post-tax return is barely positive — or even negative.</strong> Your money is losing purchasing power every single year, silently.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
              {[
                { icon: '🏦', label: 'Savings A/C at 3.5%', sub: 'After 6% inflation: -2.5% real return', bad: true },
                { icon: '📜', label: 'FD at 7% (30% tax)', sub: 'After tax: 4.9%. After inflation: -1.1%', bad: true },
                { icon: '🥇', label: 'Gold — volatile', sub: 'Zero cash flow, storage costs, no compounding', bad: true },
                { icon: '📈', label: 'Equity MF at 12–14%', sub: 'After inflation: 6–8% real wealth growth', bad: false },
              ].map((s, i) => (
                <div key={i} style={{ background: s.bad ? '#FEF2F2' : '#ECFDF5', border: `1px solid ${s.bad ? '#FECACA' : '#A7F3D0'}`, borderRadius: '12px', padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '20px', flexShrink: 0 }}>{s.icon}</span>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: s.bad ? '#991B1B' : '#065F46' }}>{s.label}</div>
                    <div style={{ fontSize: '11px', color: s.bad ? '#DC2626' : '#059669', marginTop: '2px', lineHeight: 1.4 }}>{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Comparison Table */}
        <Reveal delay={100}>
          <div style={{ marginBottom: '40px' }}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '100px', padding: '4px 12px', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#1D4ED8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Head-to-Head Comparison</span>
              </div>
              <h2 style={{ fontSize: 'clamp(18px,3vw,26px)', fontWeight: 800, color: '#0F172A', margin: 0 }}>Mutual Funds vs Everything Else</h2>
            </div>
            <div style={{ background: 'white', borderRadius: '20px', border: '1.5px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr 1fr 1fr', background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                <div style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Feature</div>
                {['🏆 Mutual Funds', '🏦 FD', '📊 Direct Stocks', '🥇 Gold'].map((h, i) => (
                  <div key={i} style={{ padding: '12px 10px', fontSize: '11px', fontWeight: 800, color: i === 0 ? '#059669' : '#64748B', textAlign: 'center', borderLeft: '1px solid #E2E8F0', background: i === 0 ? 'rgba(16,185,129,0.05)' : 'transparent' }}>{h}</div>
                ))}
              </div>
              <CompRow feature="Min. investment" mf="₹100 SIP" fd="₹1,000–10,000" stocks="1 share price" gold="~₹5,000/gm" />
              <CompRow feature="Professional management" mf="✅ Expert team" fd="❌ None" stocks="❌ DIY only" gold="❌ None" />
              <CompRow feature="Diversification" mf="✅ 50–100 stocks" fd="❌ Zero" stocks="⚠️ Limited by capital" gold="❌ Single asset" />
              <CompRow feature="Liquidity (exit in)" mf="✅ 1–3 working days" fd="❌ Penalty on early exit" stocks="✅ Same day" gold="⚠️ Days to weeks" />
              <CompRow feature="Tax efficiency (LTCG)" mf="✅ 12.5% after 1Y" fd="❌ 30% slab rate always" stocks="✅ 12.5% after 1Y" gold="⚠️ 20% after 3Y" />
              <CompRow feature="Inflation-beating history" mf="✅ Yes (12–14% 15Y avg)" fd="❌ No (4.9% post-tax)" stocks="✅ Yes (but risky)" gold="⚠️ Partially" />
              <CompRow feature="Regulatory protection" mf="✅ SEBI + Custodian" fd="✅ DICGC up to ₹5L" stocks="⚠️ Limited" gold="⚠️ Storage risk" />
              <CompRow feature="Auto-investment (SIP)" mf="✅ Monthly auto-debit" fd="❌ Not possible" stocks="❌ Manual only" gold="⚠️ Gold MF only" />
            </div>
          </div>
        </Reveal>

        {/* Compounding Calculator */}
        <Reveal delay={100}>
          <div style={{ marginBottom: '48px' }}>
            <CompoundingViz />
          </div>
        </Reveal>

        {/* ── STRUCTURAL ADVANTAGES ── */}
        <Reveal>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '100px', padding: '4px 12px', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#7C3AED', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Built-in Advantages</span>
            </div>
            <h2 style={{ fontSize: 'clamp(18px,3vw,28px)', fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>The Iron-Clad Structure: Engineered to Win</h2>
            <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.7, maxWidth: '600px', margin: '0 0 24px' }}>Mutual funds aren't just a product — they're a vehicle with structural advantages baked into their DNA by SEBI regulation, that individual investors cannot replicate.</p>
          </div>
        </Reveal>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px', marginBottom: '48px' }}>
          {advantages.map((a, i) => (
            <Reveal key={i} delay={i * 60}>
              <div style={{ background: 'white', border: `1.5px solid ${a.bd}`, borderRadius: '20px', padding: '22px', height: '100%', boxSizing: 'border-box', transition: 'box-shadow 0.25s, transform 0.25s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.09)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = ''; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: a.bg, border: `1px solid ${a.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>{a.icon}</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: a.color, marginBottom: '5px' }}>{a.title}</div>
                    <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.7, margin: 0 }}>{a.body}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* ── THE 3 PILLARS ── */}
        <Reveal>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.2)', borderRadius: '100px', padding: '4px 12px', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669', letterSpacing: '0.08em', textTransform: 'uppercase' }}>The Iron-Clad Framework</span>
            </div>
            <h2 style={{ fontSize: 'clamp(18px,3vw,28px)', fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>3 Pillars of Long-Term Wealth Building</h2>
            <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.7, maxWidth: '600px', margin: '0 0 28px' }}>Knowing why to invest in mutual funds is step one. These 3 pillars tell you exactly <em>how</em> to do it right — diversify smartly, pick by skill, and exit by plan.</p>
          </div>
        </Reveal>

        {/* Pillar progress connector */}
        <div style={{ display: 'none' }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '48px' }}>
          {pillars.map((p, i) => (
            <Reveal key={i} delay={i * 120}>
              <PillarCard {...p} />
            </Reveal>
          ))}
        </div>

        {/* ── MYTH BUSTERS ── */}
        <Reveal>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '100px', padding: '4px 12px', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#DC2626', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Myth Busters</span>
            </div>
            <h2 style={{ fontSize: 'clamp(18px,3vw,28px)', fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>6 Things Your Neighbour Got Wrong About Mutual Funds</h2>
            <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.7, margin: '0 0 24px' }}>👆 Tap each card to flip and reveal the truth</p>
          </div>
        </Reveal>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '48px' }}>
          {myths.map((m, i) => (
            <MythCard key={i} myth={m.myth} truth={m.truth} delay={i * 80} />
          ))}
        </div>

        {/* ── JOURNEY MAP ── */}
        <Reveal>
          <div style={{ background: 'white', borderRadius: '24px', border: '1.5px solid #E2E8F0', padding: 'clamp(24px,4vw,40px)', marginBottom: '48px', boxShadow: '0 4px 24px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '100px', padding: '4px 12px', marginBottom: '14px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#1D4ED8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Your Journey</span>
            </div>
            <h2 style={{ fontSize: 'clamp(17px,3vw,24px)', fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>The Typical Indian Investor's Path to Wealth</h2>
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '28px', lineHeight: 1.6 }}>A story that mirrors millions of Indians — and how the Iron-Clad Framework changes everything.</p>

            <div style={{ position: 'relative' }}>
              {/* Connector line — hidden on mobile */}
              <div style={{ position: 'absolute', top: '28px', left: '28px', right: '28px', height: '2px', background: 'linear-gradient(90deg, #A7F3D0, #BFDBFE, #DDD6FE, #FDE68A)', borderRadius: '100px', zIndex: 0 }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', position: 'relative', zIndex: 1 }}>
                {[
                  { age: '22–25', icon: '😅', title: 'The Starter', body: 'Parks salary in savings account. Hears "mutual funds are risky". Misses 3 years of compounding.', color: '#DC2626', bg: '#FEF2F2', bd: '#FECACA' },
                  { age: '25–30', icon: '🌱', title: 'The Awakening', body: 'Starts ₹5,000/month SIP in a large-cap fund. Panics in 2020 crash but stays invested. Portfolio grows.', color: '#D97706', bg: '#FFFBEB', bd: '#FDE68A' },
                  { age: '30–40', icon: '📈', title: 'The Accelerator', body: 'Increases SIP to ₹25,000/month. Uses style box to diversify. Adds mid-cap and flexi-cap.', color: '#2563EB', bg: '#EFF6FF', bd: '#BFDBFE' },
                  { age: '40–55', icon: '🏗️', title: 'The Builder', body: 'Rebalances annually. Shifts equity gains to debt as goals approach. Portfolio crosses ₹2 Cr.', color: '#7C3AED', bg: '#F5F3FF', bd: '#DDD6FE' },
                  { age: '55+', icon: '🌴', title: 'The Harvest', body: 'Goal-based SWP (Systematic Withdrawal Plan). Tax-efficient monthly income. Financial freedom achieved.', color: '#059669', bg: '#ECFDF5', bd: '#A7F3D0' },
                ].map((s, i) => (
                  <div key={i} style={{ background: s.bg, border: `1.5px solid ${s.bd}`, borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'white', border: `2px solid ${s.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', margin: '0 auto 10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>{s.icon}</div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: s.color, letterSpacing: '0.06em', marginBottom: '4px' }}>{s.age}</div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>{s.title}</div>
                    <p style={{ fontSize: '11px', color: '#475569', lineHeight: 1.6, margin: 0 }}>{s.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        {/* ── CONCLUSION BANNER ── */}
        <Reveal>
          <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 60%, #065F46 100%)', borderRadius: '28px', padding: 'clamp(28px,5vw,52px)', marginBottom: '32px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -40, left: -40, width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '100px', padding: '5px 14px', marginBottom: '18px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#A7F3D0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>The Conclusion</span>
              </div>
              <h2 style={{ fontSize: 'clamp(20px,4vw,34px)', fontWeight: 900, color: 'white', margin: '0 0 14px', lineHeight: 1.15, maxWidth: '700px' }}>
                Invest in the Structure.<br />Not Just the Manager.
              </h2>
              <p style={{ fontSize: 'clamp(13px,2vw,16px)', color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, maxWidth: '600px', marginBottom: '28px' }}>
                The Mutual Fund vehicle is engineered to survive mistakes and capitalize on time. Even if your fund selection is imperfect, the structure itself — SEBI regulation, fiduciary trust, SIP discipline, tax efficiency — provides a powerful, resilient path to long-term wealth. You don't need to be perfect. You need to stay invested.
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {['✅ Start with ₹100/month', '✅ Professionals manage it', '✅ SEBI protects you', '✅ Compounding works for you'].map((point, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '100px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{point}</div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        {/* ── CTA ── */}
        <Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            <a href="/find-my-fund" style={{ textDecoration: 'none', background: 'linear-gradient(90deg, #059669 0%, #2563EB 100%)', borderRadius: '20px', padding: 'clamp(20px,3vw,28px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', boxShadow: '0 8px 32px rgba(5,150,105,0.3)', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 16px 48px rgba(5,150,105,0.4)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 8px 32px rgba(5,150,105,0.3)'; }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: '4px' }}>Ready to start?</div>
                <div style={{ fontSize: 'clamp(16px,2.5vw,20px)', fontWeight: 900, color: 'white', lineHeight: 1.2 }}>Build My Fund Plan →</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '5px' }}>Goal-based · Live data · Free</div>
              </div>
              <span style={{ fontSize: '40px', flexShrink: 0 }}>⚡</span>
            </a>

            <a href="/find-my-fund-lifetime-plan" style={{ textDecoration: 'none', background: 'linear-gradient(135deg, #FFFBEB, #F0FDF4)', border: '1.5px solid #FDE68A', borderRadius: '20px', padding: 'clamp(20px,3vw,28px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 8px 32px rgba(217,119,6,0.15)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = ''; }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#92400E', marginBottom: '4px' }}>Multiple goals?</div>
                <div style={{ fontSize: 'clamp(16px,2.5vw,20px)', fontWeight: 900, color: '#0F172A', lineHeight: 1.2 }}>My Lifetime Plan →</div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '5px' }}>Car · Home · Education · Retirement</div>
              </div>
              <span style={{ fontSize: '40px', flexShrink: 0 }}>🌱</span>
            </a>
          </div>
        </Reveal>

        {/* Disclaimer */}
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px 18px', fontSize: '11px', color: '#94A3B8', lineHeight: 1.6, textAlign: 'center' }}>
          <strong style={{ color: '#64748B' }}>Important:</strong> Mutual fund investments are subject to market risks. Past performance is not indicative of future returns. Historical return figures are illustrative. Please read all scheme-related documents carefully. Consult a SEBI-registered investment advisor before investing. This page is for educational purposes only.
        </div>
      </div>

      {/* Global pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}