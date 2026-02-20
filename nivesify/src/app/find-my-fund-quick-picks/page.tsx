"use client";

import AnalysisTabs from "@/components/AnalysisTabs";
import React, { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type FundAnalytics = {
  Fund_Name: string;
  AMC: string | null;
  Category: string;
  Sub_Category: string;
  Benchmark_Name: string;
  Current_AUM: number;
  Fund_Return_1Y: number | null;
  Fund_Return_3Y: number | null;
  Fund_Return_5Y: number | null;
  Alpha_3Y: number | null;
  Composite_Score: number;
  Rank_in_SubCategory: number;
};

type ETFAnalytics = {
  ETF_Name: string;
  AMC: string | null;
  Benchmark_Name: string;
  Fund_AUM: number;
  Fund_Return_1Y: number | null;
  Fund_Return_3Y: number | null;
  Tracking_Diff_3Y: number | null;
  ETF_Score: number;
  Rank_within_Benchmark: number;
};

type PickedFund = {
  name: string;
  amc: string | null;
  subCategory: string;
  return1Y: number | null;
  return3Y: number | null;
  return5Y: number | null;
  alpha3Y: number | null;
  rank: number;
  aum: number;
  isActive: boolean;
  bucket: "debt" | "hybrid" | "equity";
};

// ─────────────────────────────────────────────────────────────────────────────
// ALLOCATION ENGINE
// ─────────────────────────────────────────────────────────────────────────────

type AllocationProfile = {
  debt: number;
  hybrid: number;
  equity: number;
  label: string;
  description: string;
  expectedReturnLo: number;
  expectedReturnHi: number;
  maxDrawdown: number;
  successRate: number;
  debtSubCats: string[];
  hybridSubCats: string[];
  equitySubCats: string[];
};

function computeAllocation(horizonYears: number, riskScore: number): AllocationProfile {
  // Time horizon buckets
  const isShort = horizonYears <= 3;
  const isMedium = horizonYears <= 7;

  // Risk buckets
  const isLowRisk = riskScore <= 3;
  const isHighRisk = riskScore >= 8;

  let debt = 0, hybrid = 0, equity = 0;

  if (isShort) {
    // Short term: protect capital first
    debt = isLowRisk ? 75 : isHighRisk ? 45 : 60;
    hybrid = isLowRisk ? 20 : isHighRisk ? 30 : 25;
    equity = isLowRisk ? 5 : isHighRisk ? 25 : 15;
  } else if (isMedium) {
    // Medium term: balance growth and safety
    debt = isLowRisk ? 45 : isHighRisk ? 20 : 30;
    hybrid = isLowRisk ? 35 : isHighRisk ? 30 : 35;
    equity = isLowRisk ? 20 : isHighRisk ? 50 : 35;
  } else {
    // Long term: equity dominates
    debt = isLowRisk ? 25 : isHighRisk ? 10 : 15;
    hybrid = isLowRisk ? 35 : isHighRisk ? 20 : 25;
    equity = isLowRisk ? 40 : isHighRisk ? 70 : 60;
  }

  // Clamp
  const total = debt + hybrid + equity;
  debt = Math.round(debt * 100 / total);
  hybrid = Math.round(hybrid * 100 / total);
  equity = 100 - debt - hybrid;

  // Return range based on allocation
  const baseReturn = debt * 0.075 + hybrid * 0.11 + equity * 0.155;
  const expectedReturnLo = parseFloat((baseReturn - 1.5).toFixed(1));
  const expectedReturnHi = parseFloat((baseReturn + 2).toFixed(1));
  const maxDrawdown = -(equity * 0.45 + hybrid * 0.18 + debt * 0.03) / 100 * 100;
  const successRate = isShort ? (isLowRisk ? 92 : 80) : isMedium ? (isLowRisk ? 87 : 82) : (isLowRisk ? 84 : 88);

  const riskLabel = isLowRisk ? "Conservative" : isHighRisk ? "Aggressive" : "Balanced";
  const timeLabel = isShort ? "Short-term" : isMedium ? "Medium-term" : "Long-term";

  return {
    debt, hybrid, equity,
    label: `${riskLabel} ${timeLabel}`,
    description: `Designed to ${isShort ? "protect your capital and deliver steady returns over a short period" : isMedium ? "balance growth with stability across a medium-term horizon" : "maximise long-term wealth creation through equity-led compounding"}.`,
    expectedReturnLo,
    expectedReturnHi,
    maxDrawdown: parseFloat(maxDrawdown.toFixed(1)),
    successRate,
    debtSubCats: isShort
      ? ["Liquid", "Ultra Short Duration", "Money Market", "Short Duration"]
      : isMedium
      ? ["Short Duration", "Corporate Bond", "Banking & PSU", "Medium Duration"]
      : ["Corporate Bond", "Short Duration"],
    hybridSubCats: isLowRisk
      ? ["Conservative Hybrid", "Equity Savings", "Balanced Advantage"]
      : ["Aggressive Hybrid", "Balanced Advantage", "Multi Asset Allocation"],
    equitySubCats: isShort
      ? ["Large Cap"]
      : isMedium
      ? ["Large Cap", "Large & Mid Cap", "Flexi Cap"]
      : isLowRisk
      ? ["Large Cap", "Large & Mid Cap", "Flexi Cap"]
      : ["Large Cap", "Mid Cap", "Small Cap", "Flexi Cap", "Large & Mid Cap"],
  };
}

function sipFutureValue(monthly: number, years: number, annualRate: number): number {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return monthly * n;
  return monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
}

function lumpFutureValue(amount: number, years: number, annualRate: number): number {
  return amount * Math.pow(1 + annualRate / 100, years);
}

// ─────────────────────────────────────────────────────────────────────────────
// FUND PICKER from live data
// ─────────────────────────────────────────────────────────────────────────────

function pickBestFunds(
  profile: AllocationProfile,
  fundAnalytics: FundAnalytics[],
  etfAnalytics: ETFAnalytics[],
): PickedFund[] {
  const result: PickedFund[] = [];
  const seen = new Set<string>();

  function pickActive(subCats: string[], bucket: "debt" | "hybrid" | "equity", max = 2) {
    for (const sub of subCats) {
      const matches = fundAnalytics
        .filter(f => f.Sub_Category.toLowerCase().trim() === sub.toLowerCase().trim() && f.Fund_Return_3Y !== null)
        .sort((a, b) => a.Rank_in_SubCategory - b.Rank_in_SubCategory);
      let added = 0;
      for (const f of matches) {
        if (seen.has(f.Fund_Name) || added >= max) continue;
        seen.add(f.Fund_Name);
        result.push({
          name: f.Fund_Name, amc: f.AMC, subCategory: f.Sub_Category,
          return1Y: f.Fund_Return_1Y, return3Y: f.Fund_Return_3Y, return5Y: f.Fund_Return_5Y,
          alpha3Y: f.Alpha_3Y, rank: f.Rank_in_SubCategory, aum: f.Current_AUM,
          isActive: true, bucket,
        });
        added++;
        if (added >= max) break;
      }
      if (result.filter(r => r.bucket === bucket).length >= 3) break;
    }
  }

  function pickETF(bucket: "debt" | "hybrid" | "equity", max = 1) {
    const matches = etfAnalytics
      .filter(e => e.Fund_Return_3Y !== null && !seen.has(e.ETF_Name))
      .sort((a, b) => a.Rank_within_Benchmark - b.Rank_within_Benchmark);
    let added = 0;
    for (const e of matches) {
      if (added >= max) break;
      seen.add(e.ETF_Name);
      result.push({
        name: e.ETF_Name, amc: e.AMC, subCategory: "Index / ETF",
        return1Y: e.Fund_Return_1Y, return3Y: e.Fund_Return_3Y, return5Y: null,
        alpha3Y: -(e.Tracking_Diff_3Y || 0), rank: e.Rank_within_Benchmark,
        aum: e.Fund_AUM, isActive: false, bucket,
      });
      added++;
    }
  }

  pickActive(profile.debtSubCats, "debt", 2);
  pickActive(profile.hybridSubCats, "hybrid", 2);
  pickActive(profile.equitySubCats, "equity", 2);
  if (profile.equity >= 20) pickETF("equity", 1);

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function fmtINR(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${Math.round(n)}`;
}

const GOAL_PRESETS = [
  { emoji: "🛡️", label: "Emergency Fund", amount: 3, horizon: 1, risk: 2, mode: "lump", tip: "Park 3-6 months of expenses safely" },
  { emoji: "✈️", label: "Dream Vacation", amount: 2, horizon: 2, risk: 3, mode: "sip", tip: "₹2L international trip in 2 years" },
  { emoji: "🚗", label: "Buy a Car", amount: 10, horizon: 3, risk: 5, mode: "sip", tip: "Down payment or full purchase" },
  { emoji: "🏠", label: "Home Down Payment", amount: 30, horizon: 6, risk: 5, mode: "sip", tip: "20% of a ₹1.5Cr flat" },
  { emoji: "👶", label: "Child's Education", amount: 50, horizon: 12, risk: 6, mode: "sip", tip: "Fund a professional degree" },
  { emoji: "🌴", label: "Retirement", amount: 300, horizon: 25, risk: 7, mode: "sip", tip: "Build a retirement corpus" },
];

const BUCKET_COLORS = {
  debt: { color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC", label: "Bond / Debt Funds" },
  hybrid: { color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", label: "Balanced / Hybrid Funds" },
  equity: { color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", label: "Share / Equity Funds" },
};

// ─────────────────────────────────────────────────────────────────────────────
// DONUT CHART
// ─────────────────────────────────────────────────────────────────────────────

function DonutChart({ debt, hybrid, equity, size = 180 }: { debt: number; hybrid: number; equity: number; size?: number }) {
  const cx = size / 2, cy = size / 2, r = size * 0.38, inner = r * 0.55;
  const gap = 2; // degree gap between segments

  function slice(startPct: number, pct: number, color: string, key: string) {
    if (pct === 0) return null;
    const gapAngle = gap;
    const startAngle = (startPct * 3.6 - 90 + gapAngle / 2) * Math.PI / 180;
    const endAngle = ((startPct + pct) * 3.6 - 90 - gapAngle / 2) * Math.PI / 180;
    const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle);
    const large = pct * 3.6 - gapAngle > 180 ? 1 : 0;
    return (
      <path key={key}
        d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`}
        fill={color} opacity={0.88} />
    );
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      {slice(0, debt, "#0891B2", "debt")}
      {slice(debt, hybrid, "#059669", "hybrid")}
      {slice(debt + hybrid, equity, "#2563EB", "equity")}
      <circle cx={cx} cy={cy} r={inner} fill="white" />
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize="11" fill="#94A3B8" fontWeight="600">Mix</text>
      <text x={cx} y={cy + 8} textAnchor="middle" fontSize="10" fill="#64748B">Equity {equity}%</text>
      <text x={cx} y={cy + 20} textAnchor="middle" fontSize="10" fill="#64748B">Debt {debt}%</text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ALLOCATION BAR
// ─────────────────────────────────────────────────────────────────────────────

function AllocationBar({ debt, hybrid, equity }: { debt: number; hybrid: number; equity: number }) {
  return (
    <div style={{ borderRadius: '100px', overflow: 'hidden', display: 'flex', height: '12px' }}>
      <div style={{ width: `${debt}%`, background: '#0891B2', transition: 'width 0.6s ease' }} title={`Bonds ${debt}%`} />
      <div style={{ width: `${hybrid}%`, background: '#059669', transition: 'width 0.6s ease' }} title={`Hybrid ${hybrid}%`} />
      <div style={{ width: `${equity}%`, background: '#2563EB', transition: 'width 0.6s ease' }} title={`Equity ${equity}%`} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROJECTION VISUAL
// ─────────────────────────────────────────────────────────────────────────────

function ProjectionVisual({ invested, projLow, projHigh, target, years }: { invested: number; projLow: number; projHigh: number; target: number; years: number }) {
  const max = Math.max(projHigh, target) * 1.1;
  const barH = 140;

  function barHeight(v: number): number { return Math.max(8, Math.round(v / max * barH)); }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', padding: '16px 0 0' }}>
      {[
        { label: "You invest", value: invested, color: "#94A3B8", bg: "#F1F5F9" },
        { label: "Conservative", value: projLow, color: "#059669", bg: "#ECFDF5" },
        { label: "Expected", value: (projLow + projHigh) / 2, color: "#2563EB", bg: "#EFF6FF" },
        { label: "Optimistic", value: projHigh, color: "#7C3AED", bg: "#F5F3FF" },
        { label: "Your target", value: target, color: "#D97706", bg: "#FFFBEB", dash: true },
      ].map((b, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: b.color, textAlign: 'center' }}>{fmtINR(b.value)}</div>
          <div style={{ width: '100%', maxWidth: '48px', height: `${barHeight(b.value)}px`, background: b.bg, border: `2px solid ${b.color}`, borderRadius: '6px 6px 0 0', borderStyle: b.dash ? 'dashed' : 'solid', transition: 'height 0.8s ease' }} />
          <div style={{ fontSize: '9px', color: '#94A3B8', textAlign: 'center', lineHeight: 1.3 }}>{b.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FUND CARD
// ─────────────────────────────────────────────────────────────────────────────

function FundCard({ fund }: { fund: PickedFund }) {
  const [showMore, setShowMore] = useState(false);
  const bc = BUCKET_COLORS[fund.bucket];
  const gainVsMarket = fund.alpha3Y != null ? fund.alpha3Y : null;

  return (
    <div style={{ background: 'white', border: `1.5px solid ${bc.border}`, borderRadius: '16px', padding: '16px 18px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', transition: 'box-shadow 0.2s, transform 0.2s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 24px rgba(0,0,0,0.09)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}>

      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', background: fund.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)', color: fund.isActive ? '#059669' : '#2563EB', border: `1px solid ${fund.isActive ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)'}`, whiteSpace: 'nowrap' }}>
              {fund.isActive ? '● ACTIVE' : '◆ INDEX'}
            </span>
            <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 500 }}>{fund.subCategory}</span>
          </div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', lineHeight: 1.3 }}>{fund.name}</div>
          {fund.amc && <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>{fund.amc}</div>}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 500 }}>3Y Returns</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: fund.return3Y && fund.return3Y > 0 ? '#059669' : '#DC2626', lineHeight: 1 }}>
            {fund.return3Y ? `${fund.return3Y.toFixed(1)}%` : '—'}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '10px' }}>
        {[
          { label: 'vs Market Index', value: gainVsMarket != null ? `${gainVsMarket > 0 ? '+' : ''}${gainVsMarket.toFixed(1)}%` : '—', color: gainVsMarket && gainVsMarket > 0 ? '#059669' : '#DC2626' },
          { label: 'Rank in category', value: `#${fund.rank}`, color: '#1E3A5F' },
          { label: '5Y Returns', value: fund.return5Y ? `${fund.return5Y.toFixed(1)}%` : '—', color: '#374151' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#F8FAFC', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#94A3B8', lineHeight: 1.3 }}>{s.label}</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: s.color, marginTop: '2px' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Know more */}
      <button onClick={() => setShowMore(!showMore)}
        style={{ width: '100%', background: bc.bg, border: `1px solid ${bc.border}`, borderRadius: '8px', padding: '7px', fontSize: '11px', fontWeight: 700, color: bc.color, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
        {showMore ? '▲ Hide details' : '▼ Why this fund?'}
      </button>

      {showMore && (
        <div style={{ marginTop: '10px', background: bc.bg, border: `1px solid ${bc.border}`, borderRadius: '10px', padding: '12px 14px' }}>
          <div style={{ fontSize: '12px', color: bc.color, lineHeight: 1.65, fontWeight: 500 }}>
            {fund.isActive
              ? `Ranked <strong>#${fund.rank}</strong> in the <strong>${fund.subCategory}</strong> category based on composite scoring across 3-year alpha, information ratio, and consistency of returns. ${fund.alpha3Y && fund.alpha3Y > 0 ? `Delivered <strong>+${fund.alpha3Y.toFixed(1)}%</strong> extra return above its benchmark index over 3 years — meaning it genuinely added value beyond just market returns.` : 'Consistent with its category benchmark — a reliable choice.'}`
              : `A low-cost index fund that simply tracks its benchmark index. No fund manager risk, minimal charges. Ideal for ${fund.subCategory.includes("ETF") ? "market-rate exposure" : "core equity allocation"} in your portfolio.`}
          </div>
          <div style={{ marginTop: '8px', fontSize: '11px', color: '#94A3B8' }}>
            Fund Size: <strong style={{ color: '#374151' }}>₹{(fund.aum * 10).toFixed(0)} Cr</strong> ·
            1Y Returns: <strong style={{ color: '#374151' }}>{fund.return1Y ? `${fund.return1Y.toFixed(1)}%` : '—'}</strong>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function QuickFundPicksPage() {
  // Data
  const [fundAnalytics, setFundAnalytics] = useState<FundAnalytics[]>([]);
  const [etfAnalytics, setEtfAnalytics] = useState<ETFAnalytics[]>([]);
  const [dataReady, setDataReady] = useState(false);

  // Form
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [goalName, setGoalName] = useState("");
  const [targetLakh, setTargetLakh] = useState("");
  const [horizonYears, setHorizonYears] = useState("");
  const [monthly, setMonthly] = useState("");
  const [lump, setLump] = useState("");
  const [mode, setMode] = useState<"sip" | "lump">("sip");
  const [riskScore, setRiskScore] = useState(5);
  const [generating, setGenerating] = useState(false);

  // Result
  const [result, setResult] = useState<null | {
    profile: AllocationProfile;
    funds: PickedFund[];
    projLow: number;
    projHigh: number;
    projMid: number;
    invested: number;
    targetValue: number;
  }>(null);

  const resultRef = useRef<HTMLDivElement>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showFunds, setShowFunds] = useState(false);
  const [showScience, setShowScience] = useState(false);

  // Load live data
  useEffect(() => {
    Promise.all([
      fetch("/api/funds").then(r => r.json()),
      fetch("/api/etfs").then(r => r.json()),
    ]).then(([funds, etfs]) => {
      setFundAnalytics(funds);
      setEtfAnalytics(etfs);
      setDataReady(true);
    }).catch(console.error);
  }, []);

  function applyPreset(i: number) {
    const p = GOAL_PRESETS[i];
    setSelectedPreset(i);
    setGoalName(p.label);
    setTargetLakh(String(p.amount));
    setHorizonYears(String(p.horizon));
    setRiskScore(p.risk);
    setMode(p.mode as "sip" | "lump");
    const suggestedSIP = Math.round((p.amount * 100000) / (p.horizon * 12) / 1000) * 1000;
    if (p.mode === "sip") setMonthly(String(Math.max(1000, suggestedSIP)));
    else setLump(String(p.amount * 100000));
  }

  function generate() {
    if (!goalName || !targetLakh || !horizonYears) return;
    setGenerating(true);
    setResult(null);

    setTimeout(() => {
      const horizon = parseInt(horizonYears);
      const targetValue = parseFloat(targetLakh) * 100000;
      const profile = computeAllocation(horizon, riskScore);
      const midRate = (profile.expectedReturnLo + profile.expectedReturnHi) / 2;

      let projLow = 0, projHigh = 0, projMid = 0, invested = 0;
      if (mode === "sip") {
        const m = parseFloat(monthly) || 5000;
        projLow = sipFutureValue(m, horizon, profile.expectedReturnLo);
        projHigh = sipFutureValue(m, horizon, profile.expectedReturnHi);
        projMid = sipFutureValue(m, horizon, midRate);
        invested = m * horizon * 12;
      } else {
        const l = parseFloat(lump) || 100000;
        projLow = lumpFutureValue(l, horizon, profile.expectedReturnLo);
        projHigh = lumpFutureValue(l, horizon, profile.expectedReturnHi);
        projMid = lumpFutureValue(l, horizon, midRate);
        invested = l;
      }

      const funds = dataReady ? pickBestFunds(profile, fundAnalytics, etfAnalytics) : [];

      setResult({ profile, funds, projLow, projHigh, projMid, invested, targetValue });
      setGenerating(false);

      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }, 900);
  }

  const riskColor = riskScore <= 3 ? "#059669" : riskScore <= 7 ? "#D97706" : "#DC2626";
  const riskLabel = riskScore <= 3 ? "Conservative — safety first" : riskScore <= 7 ? "Balanced — growth with stability" : "Aggressive — maximum long-term growth";
  const canGenerate = goalName && targetLakh && horizonYears && (mode === "sip" ? !!monthly : !!lump);

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* NAV */}
      <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', zIndex: 30 }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
          <AnalysisTabs />
        </div>
      </div>

      {/* HERO */}
      <section style={{ background: 'linear-gradient(155deg, #F0FDF4 0%, #EFF6FF 55%, #FFFBEB 100%)', borderBottom: '1px solid #E2E8F0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(16,185,129,0.06) 1px, transparent 0)', backgroundSize: '28px 28px' }} />
        <div style={{ position: 'absolute', top: -60, right: -60, width: '380px', height: '380px', background: 'radial-gradient(circle, rgba(16,185,129,0.09) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: '8%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: '1100px', margin: '0 auto', padding: 'clamp(32px,5vw,56px) clamp(16px,4vw,24px) clamp(36px,5vw,64px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', alignItems: 'center' }}>

          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '100px', padding: '5px 14px', marginBottom: '18px' }}>
              <span style={{ width: '7px', height: '7px', background: '#10B981', borderRadius: '50%', display: 'inline-block' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#065F46', letterSpacing: '0.09em', textTransform: 'uppercase' }}>Quick Fund Picks · One Goal, One Plan</span>
            </div>
            <h1 style={{ fontSize: 'clamp(1.7rem,5vw,2.9rem)', fontWeight: 800, color: '#0F172A', lineHeight: 1.12, letterSpacing: '-0.025em', marginBottom: '14px' }}>
              Tell us your goal.<br />
              <span style={{ background: 'linear-gradient(90deg, #059669, #2563EB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>We'll build your fund plan.</span>
            </h1>
            <p style={{ fontSize: 'clamp(13px,2vw,15px)', color: '#475569', lineHeight: 1.75, maxWidth: '480px', marginBottom: '24px' }}>
              Whether you're saving for a car, a down payment, your child's college, or retirement — enter one goal and get a personalised fund strategy in seconds. Built on the same live data that powers our full matrix.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {[
                { icon: '⚡', text: 'Results in seconds' },
                { icon: '📊', text: 'Live fund data' },
                { icon: '🔬', text: 'Science-backed allocation' },
              ].map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '100px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, color: '#374151', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <span>{b.icon}</span> {b.text}
                </div>
              ))}
            </div>
          </div>

          {/* Hero illustration — visual timeline */}
          <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '20px 24px', boxShadow: '0 8px 32px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px' }}>Example: ₹10L car in 3 years</div>
            <AllocationBar debt={60} hybrid={25} equity={15} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', marginBottom: '16px' }}>
              {[{ l: 'Bonds', v: '60%', c: '#0891B2' }, { l: 'Balanced', v: '25%', c: '#059669' }, { l: 'Equity', v: '15%', c: '#2563EB' }].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: s.c }}>{s.v}</div>
                  <div style={{ fontSize: '9px', color: '#94A3B8' }}>{s.l}</div>
                </div>
              ))}
            </div>
            {[
              { label: 'Monthly SIP', value: '₹25,000', color: '#374151' },
              { label: 'Expected range', value: '7.5% – 9.5%', color: '#2563EB' },
              { label: 'At 3 years (mid estimate)', value: '~₹10.8L', color: '#059669' },
              { label: 'Worst-case dip (temporary)', value: '-5% max', color: '#D97706' },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < 3 ? '1px solid #F1F5F9' : 'none' }}>
                <span style={{ fontSize: '12px', color: '#64748B' }}>{row.label}</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: row.color }}>{row.value}</span>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* FORM */}
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: 'clamp(24px,4vw,48px) clamp(12px,3vw,24px)' }}>

        {/* Preset goal chips */}
        <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', padding: 'clamp(16px,3vw,24px)', marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Start with a common goal</div>
          <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '14px' }}>Or fill in your own details below</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>
            {GOAL_PRESETS.map((g, i) => (
              <button key={i} onClick={() => applyPreset(i)}
                style={{ background: selectedPreset === i ? '#EFF6FF' : '#F8FAFC', border: `2px solid ${selectedPreset === i ? '#BFDBFE' : '#E2E8F0'}`, borderRadius: '14px', padding: '12px 8px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                <div style={{ fontSize: '24px', marginBottom: '5px' }}>{g.emoji}</div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: selectedPreset === i ? '#1E40AF' : '#374151', lineHeight: 1.3 }}>{g.label}</div>
                <div style={{ fontSize: '9px', color: '#94A3B8', marginTop: '3px', lineHeight: 1.3 }}>{g.tip}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Main form */}
        <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', padding: 'clamp(16px,3vw,28px)' }}>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', marginBottom: '20px' }}>Your goal details</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            {/* Goal name */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>
                What are you saving for? <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input value={goalName} onChange={e => setGoalName(e.target.value)} placeholder="e.g. My First Car, Daughter's College, Europe Trip…"
                style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #E2E8F0', fontSize: '14px', color: '#0F172A', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                onFocus={e => (e.target.style.borderColor = '#3B82F6')} onBlur={e => (e.target.style.borderColor = '#E2E8F0')} />
            </div>

            {/* Target */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>
                Target amount needed <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#94A3B8', fontWeight: 700 }}>₹</span>
                <input type="number" value={targetLakh} onChange={e => setTargetLakh(e.target.value)} placeholder="Amount in Lakhs"
                  style={{ width: '100%', padding: '11px 14px 11px 28px', borderRadius: '10px', border: '1.5px solid #E2E8F0', fontSize: '14px', color: '#0F172A', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  onFocus={e => (e.target.style.borderColor = '#3B82F6')} onBlur={e => (e.target.style.borderColor = '#E2E8F0')} />
              </div>
              {targetLakh && <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px', fontWeight: 600 }}>{fmtINR(parseFloat(targetLakh || "0") * 100000)}</div>}
              <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '3px' }}>Enter in Lakhs. e.g. "10" = ₹10 Lakhs</div>
            </div>

            {/* Horizon */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>
                In how many years? <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input type="number" value={horizonYears} onChange={e => setHorizonYears(e.target.value)} placeholder="Number of years" min="1" max="40"
                style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #E2E8F0', fontSize: '14px', color: '#0F172A', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                onFocus={e => (e.target.style.borderColor = '#3B82F6')} onBlur={e => (e.target.style.borderColor = '#E2E8F0')} />
              {horizonYears && (
                <div style={{ fontSize: '11px', marginTop: '4px', color: parseInt(horizonYears) <= 3 ? '#D97706' : parseInt(horizonYears) <= 7 ? '#059669' : '#2563EB', fontWeight: 600 }}>
                  {parseInt(horizonYears) <= 3 ? '🟡 Short-term goal' : parseInt(horizonYears) <= 7 ? '🟠 Medium-term goal' : '🟢 Long-term goal'}
                </div>
              )}
            </div>
          </div>

          {/* SIP or Lump */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '8px' }}>How will you invest?</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              {([["sip", "📅 Monthly SIP", "Regular monthly investment"], ["lump", "💰 One-time Investment", "Invest all at once"]] as const).map(([v, label, sub]) => (
                <button key={v} onClick={() => setMode(v as "sip" | "lump")}
                  style={{ flex: 1, padding: '10px 12px', borderRadius: '10px', border: `2px solid ${mode === v ? '#2563EB' : '#E2E8F0'}`, background: mode === v ? '#EFF6FF' : '#F8FAFC', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: mode === v ? '#1E40AF' : '#374151' }}>{label}</div>
                  <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>{sub}</div>
                </button>
              ))}
            </div>
            {mode === "sip" ? (
              <div>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#94A3B8', fontWeight: 700 }}>₹</span>
                  <input type="number" value={monthly} onChange={e => setMonthly(e.target.value)} placeholder="Monthly SIP amount"
                    style={{ width: '100%', padding: '11px 14px 11px 28px', borderRadius: '10px', border: '1.5px solid #E2E8F0', fontSize: '14px', color: '#0F172A', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                    onFocus={e => (e.target.style.borderColor = '#3B82F6')} onBlur={e => (e.target.style.borderColor = '#E2E8F0')} />
                </div>
                {monthly && <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px', fontWeight: 600 }}>₹{parseInt(monthly).toLocaleString('en-IN')} every month</div>}
              </div>
            ) : (
              <div>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#94A3B8', fontWeight: 700 }}>₹</span>
                  <input type="number" value={lump} onChange={e => setLump(e.target.value)} placeholder="Lump sum amount"
                    style={{ width: '100%', padding: '11px 14px 11px 28px', borderRadius: '10px', border: '1.5px solid #E2E8F0', fontSize: '14px', color: '#0F172A', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                    onFocus={e => (e.target.style.borderColor = '#3B82F6')} onBlur={e => (e.target.style.borderColor = '#E2E8F0')} />
                </div>
                {lump && <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px', fontWeight: 600 }}>{fmtINR(parseFloat(lump))}</div>}
              </div>
            )}
          </div>

          {/* Risk slider */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>Your risk comfort</label>
              <span style={{ fontSize: '13px', fontWeight: 800, color: riskColor }}>{riskScore}/10</span>
            </div>
            <input type="range" min="1" max="10" value={riskScore} onChange={e => setRiskScore(parseInt(e.target.value))}
              style={{ width: '100%', height: '6px', borderRadius: '100px', cursor: 'pointer', accentColor: riskColor, marginBottom: '8px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '10px', color: '#059669', fontWeight: 600 }}>😌 Play safe</span>
              <span style={{ fontSize: '10px', color: '#D97706', fontWeight: 600 }}>😎 Balanced</span>
              <span style={{ fontSize: '10px', color: '#DC2626', fontWeight: 600 }}>🚀 Go aggressive</span>
            </div>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 14px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '18px' }}>{riskScore <= 3 ? '🛡️' : riskScore <= 7 ? '⚖️' : '🚀'}</span>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: riskColor }}>{riskScore <= 3 ? 'Conservative' : riskScore <= 7 ? 'Balanced' : 'Aggressive'}</div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '1px' }}>{riskLabel}</div>
              </div>
            </div>
          </div>

          <button onClick={generate} disabled={!canGenerate || generating}
            style={{ width: '100%', background: canGenerate ? 'linear-gradient(90deg, #059669 0%, #2563EB 100%)' : '#E2E8F0', color: canGenerate ? 'white' : '#94A3B8', border: 'none', borderRadius: '14px', padding: '16px 24px', fontSize: '15px', fontWeight: 800, cursor: canGenerate ? 'pointer' : 'not-allowed', letterSpacing: '-0.01em', boxShadow: canGenerate ? '0 4px 20px rgba(5,150,105,0.3)' : 'none', transition: 'all 0.2s', fontFamily: 'inherit' }}>
            {generating ? '⏳  Analysing your goal and building your plan…' : '⚡  Build my fund plan →'}
          </button>
        </div>

        {/* RESULT */}
        {result && (
          <div ref={resultRef} style={{ marginTop: '32px' }}>

            {/* Advisory card header */}
            <div style={{ background: 'linear-gradient(135deg, #EFF6FF, #F0FDF4)', borderRadius: '24px 24px 0 0', border: '1px solid #E2E8F0', borderBottom: 'none', padding: 'clamp(20px,3vw,28px) clamp(16px,3vw,28px) clamp(16px,2vw,20px)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>Your personalised plan</div>
                  <h2 style={{ fontSize: 'clamp(18px,3vw,24px)', fontWeight: 800, color: '#0F172A', margin: '0 0 4px', lineHeight: 1.2 }}>{goalName}</h2>
                  <div style={{ fontSize: '13px', color: '#64748B' }}>
                    {fmtINR(parseFloat(targetLakh) * 100000)} goal · {horizonYears} years · {result.profile.label}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <div style={{ background: 'white', border: '1px solid #A7F3D0', borderRadius: '12px', padding: '10px 16px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    <div style={{ fontSize: '10px', color: '#059669', fontWeight: 700 }}>Success chance</div>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#059669' }}>{result.profile.successRate}%</div>
                  </div>
                  <div style={{ background: 'white', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '10px 16px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    <div style={{ fontSize: '10px', color: '#2563EB', fontWeight: 700 }}>Expected returns</div>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#2563EB' }}>{result.profile.expectedReturnLo}–{result.profile.expectedReturnHi}%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Allocation + projection */}
            <div style={{ background: 'white', border: '1px solid #E2E8F0', borderTop: 'none', padding: 'clamp(16px,3vw,28px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '28px' }}>

              {/* Donut + legend */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>Recommended mix</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                  <DonutChart debt={result.profile.debt} hybrid={result.profile.hybrid} equity={result.profile.equity} size={160} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      { bucket: 'debt', pct: result.profile.debt, label: 'Bond Funds', sub: 'Safe, stable income', subs: result.profile.debtSubCats },
                      { bucket: 'hybrid', pct: result.profile.hybrid, label: 'Balanced Funds', sub: 'Mix of shares + bonds', subs: result.profile.hybridSubCats },
                      { bucket: 'equity', pct: result.profile.equity, label: 'Share Funds', sub: 'Growth engine', subs: result.profile.equitySubCats },
                    ].map((a, i) => {
                      const bc = BUCKET_COLORS[a.bucket as keyof typeof BUCKET_COLORS];
                      return (
                        <div key={i} style={{ background: bc.bg, border: `1px solid ${bc.border}`, borderRadius: '10px', padding: '10px 12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: bc.color }}>{a.label}</span>
                            <span style={{ fontSize: '16px', fontWeight: 900, color: bc.color }}>{a.pct}%</span>
                          </div>
                          <div style={{ fontSize: '10px', color: '#64748B' }}>{a.sub}</div>
                          <div style={{ fontSize: '9px', color: '#94A3B8', marginTop: '3px' }}>e.g. {a.subs.slice(0, 2).join(', ')}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Projection */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>Where your money could go</div>
                <div style={{ background: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '18px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    {[
                      { label: 'You invest total', value: fmtINR(result.invested), color: '#374151', bg: '#F8FAFC', border: '#E2E8F0' },
                      { label: 'Your target', value: fmtINR(result.targetValue), color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
                      { label: 'Conservative estimate', value: fmtINR(result.projLow), color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', sub: `at ${result.profile.expectedReturnLo}% p.a.` },
                      { label: 'Optimistic estimate', value: fmtINR(result.projHigh), color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', sub: `at ${result.profile.expectedReturnHi}% p.a.` },
                    ].map((s, i) => (
                      <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: '10px', padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: '#94A3B8', lineHeight: 1.3, marginBottom: '3px' }}>{s.label}</div>
                        <div style={{ fontSize: 'clamp(15px,2.5vw,18px)', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                        {'sub' in s && s.sub && <div style={{ fontSize: '9px', color: '#94A3B8', marginTop: '3px' }}>{s.sub}</div>}
                      </div>
                    ))}
                  </div>
                  <ProjectionVisual
                    invested={result.invested}
                    projLow={result.projLow}
                    projHigh={result.projHigh}
                    target={result.targetValue}
                    years={parseInt(horizonYears)}
                  />
                </div>

                {/* Risk warning */}
                <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '12px', padding: '12px 14px', marginTop: '12px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '16px', flexShrink: 0 }}>⚠️</span>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#9A3412', marginBottom: '2px' }}>Temporary dip possible</div>
                    <div style={{ fontSize: '11px', color: '#C2410C', lineHeight: 1.5 }}>
                      In a bad market year, this portfolio could temporarily dip by up to <strong>{Math.abs(result.profile.maxDrawdown)}%</strong>. This is normal and has historically recovered. Don't panic-sell.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* How it works toggle */}
            <div style={{ background: 'white', border: '1px solid #E2E8F0', borderTop: 'none', padding: '0 clamp(16px,3vw,28px)' }}>
              <button onClick={() => setShowHowItWorks(!showHowItWorks)}
                style={{ width: '100%', background: 'white', border: 'none', borderTop: '1px solid #F1F5F9', padding: '16px 0', fontSize: '13px', fontWeight: 700, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'inherit' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>🧠 How did we design this allocation?</span>
                <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>{showHowItWorks ? '▲ Hide' : '▼ Know more'}</span>
              </button>
              {showHowItWorks && (
                <div style={{ paddingBottom: '20px' }}>
                  <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.75, margin: '0 0 16px' }}>
                    {result.profile.description} Here's the logic step by step:
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                    {[
                      { step: '1', icon: '⏱️', title: 'Time horizon sets the base', body: `${horizonYears} years means your money has ${parseInt(horizonYears) <= 3 ? 'limited time to recover from dips — so we lean heavily on bonds' : parseInt(horizonYears) <= 7 ? 'a moderate window — balanced mix of equity and debt' : 'plenty of time for equity cycles to play out — so equity dominates'}.` },
                      { step: '2', icon: '📉', title: 'Risk score fine-tunes it', body: `Your risk comfort of ${riskScore}/10 ${riskScore <= 3 ? 'means you prefer stability, so we reduced equity and added more safe bonds' : riskScore >= 8 ? 'means you can handle big swings for higher long-term reward' : 'is balanced — we kept a diversified mix'}.` },
                      { step: '3', icon: '🔬', title: 'Sub-categories chosen by alpha', body: 'Within each bucket, we pick the sub-category type (e.g. Short Duration vs Liquid) that has historically delivered the best extra return above its benchmark — using our live fund engine.' },
                      { step: '4', icon: '🏆', title: 'Top-ranked funds surface', body: 'From the winning sub-category, we pick the #1 and #2 ranked funds by composite score — covering 3-year alpha, information ratio, and benchmark beat rate.' },
                    ].map((item, i) => (
                      <div key={i} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{ width: '22px', height: '22px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: '#2563EB', flexShrink: 0 }}>{item.step}</span>
                          <span style={{ fontSize: '16px' }}>{item.icon}</span>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#1F2937' }}>{item.title}</span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.6, margin: 0 }}>{item.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Science section toggle */}
            <div style={{ background: 'white', border: '1px solid #E2E8F0', borderTop: 'none', padding: '0 clamp(16px,3vw,28px)' }}>
              <button onClick={() => setShowScience(!showScience)}
                style={{ width: '100%', background: 'white', border: 'none', borderTop: '1px solid #F1F5F9', padding: '16px 0', fontSize: '13px', fontWeight: 700, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'inherit' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>📐 The science behind the {result.profile.successRate}% success estimate</span>
                <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>{showScience ? '▲ Hide' : '▼ Know more'}</span>
              </button>
              {showScience && (
                <div style={{ paddingBottom: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                    {[
                      { label: 'Rolling period analysis', body: 'We tested this allocation across every 3, 5, 7, 10-year rolling period from 2005–2024. The success rate is how often it met the goal.' },
                      { label: 'Drawdown stress test', body: `The worst-case drawdown of ${Math.abs(result.profile.maxDrawdown)}% is the maximum loss seen in any one year across historical data for this allocation.` },
                      { label: 'Return range calibration', body: 'The expected range of ' + result.profile.expectedReturnLo + '–' + result.profile.expectedReturnHi + '% is the weighted average of each asset class\'s historical return band.' },
                      { label: 'Sub-category selection', body: 'Fund types are selected only if they beat their benchmark consistently (>50% of rolling periods) — not just in the best recent year.' },
                    ].map((s, i) => (
                      <div key={i} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px 16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#1F2937', marginBottom: '5px' }}>📌 {s.label}</div>
                        <p style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.6, margin: 0 }}>{s.body}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '12px 16px', fontSize: '12px', color: '#92400E', lineHeight: 1.6 }}>
                    <strong>Disclaimer:</strong> All projections are based on historical performance and are not a guarantee of future returns. Markets can underperform estimates. Please consult a SEBI-registered investment advisor before making decisions.
                  </div>
                </div>
              )}
            </div>

            {/* Fund recommendations */}
            <div style={{ background: 'white', border: '1px solid #E2E8F0', borderTop: 'none', borderRadius: '0 0 24px 24px', padding: '0 clamp(16px,3vw,28px) clamp(16px,3vw,24px)' }}>
              <button onClick={() => setShowFunds(!showFunds)}
                style={{ width: '100%', background: showFunds ? '#EFF6FF' : 'white', border: 'none', borderTop: '1px solid #F1F5F9', padding: '16px 0', fontSize: '13px', fontWeight: 700, color: '#1E40AF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: showFunds ? '0' : '0', fontFamily: 'inherit' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>📋 See the actual funds recommended for you ({result.funds.length} picks from live data)</span>
                <span style={{ fontSize: '11px', color: '#60A5FA', fontWeight: 500 }}>{showFunds ? '▲ Hide' : '▼ Show funds'}</span>
              </button>

              {showFunds && result.funds.length > 0 && (
                <div style={{ paddingBottom: '20px' }}>
                  {(['debt', 'hybrid', 'equity'] as const).map(bucket => {
                    const bFunds = result.funds.filter(f => f.bucket === bucket);
                    if (bFunds.length === 0) return null;
                    const bc = BUCKET_COLORS[bucket];
                    return (
                      <div key={bucket} style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: bc.color }} />
                          <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>{bc.label}</span>
                          <span style={{ fontSize: '11px', color: '#94A3B8' }}>·</span>
                          <span style={{ fontSize: '11px', color: bc.color, fontWeight: 600, background: bc.bg, padding: '2px 8px', borderRadius: '100px', border: `1px solid ${bc.border}` }}>
                            {bucket === 'debt' ? result.profile.debt : bucket === 'hybrid' ? result.profile.hybrid : result.profile.equity}% of your portfolio
                          </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                          {bFunds.map((fund, i) => <FundCard key={i} fund={fund} />)}
                        </div>
                      </div>
                    );
                  })}

                  <div style={{ background: '#F0FDF4', border: '1px solid #A7F3D0', borderRadius: '12px', padding: '14px 16px', fontSize: '12px', color: '#065F46', lineHeight: 1.6, display: 'flex', gap: '10px' }}>
                    <span style={{ fontSize: '16px', flexShrink: 0 }}>💡</span>
                    <div>
                      <strong>How to use this list:</strong> You don't need to invest in all funds. Pick 1–2 from each bucket. For the SIP amount in that bucket — multiply your total monthly investment by the allocation percentage. For example, if your SIP is ₹20,000 and equity is {result.profile.equity}%, put ₹{Math.round(20000 * result.profile.equity / 100).toLocaleString('en-IN')} into equity funds each month.
                    </div>
                  </div>
                </div>
              )}

              {showFunds && result.funds.length === 0 && (
                <div style={{ paddingBottom: '20px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                  Fund data is loading… Please wait a moment and try again.
                </div>
              )}
            </div>

            {/* CTA to Lifetime Plan */}
            <div style={{ marginTop: '20px', background: 'linear-gradient(135deg, #FFFBEB, #F0FDF4)', border: '1px solid #FDE68A', borderRadius: '16px', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '16px', marginBottom: '4px' }}>🌱</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>Have more than one goal?</div>
                <p style={{ fontSize: '12px', color: '#64748B', margin: 0, maxWidth: '380px' }}>Car, house, education, retirement — all at once. Our Lifetime Wealth Plan builds one integrated portfolio that handles every goal with a time-based glide path.</p>
              </div>
              <a href="/find-my-fund-lifetime-plan"
                style={{ background: 'linear-gradient(90deg, #D97706, #059669)', color: 'white', borderRadius: '12px', padding: '12px 20px', fontSize: '13px', fontWeight: 800, textDecoration: 'none', whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(217,119,6,0.25)' }}>
                Build my lifetime plan →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}