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

type Goal = {
  id: string;
  emoji: string;
  name: string;
  targetLakh: string;
  horizonYears: string;
};

type BucketAllocation = {
  debt: number;
  hybrid: number;
  equity: number;
  label: string;
  yearStart: number;
  yearEnd: number;
  goals: Goal[];
  debtSubCats: string[];
  hybridSubCats: string[];
  equitySubCats: string[];
  expectedReturn: [number, number];
  maxDrawdown: number;
};

type LiveFund = {
  name: string;
  amc: string | null;
  subCategory: string;
  return3Y: number | null;
  return5Y: number | null;
  alpha3Y: number | null;
  rank: number;
  aum: number;
  isActive: boolean;
  bucket: "debt" | "hybrid" | "equity";
  phase: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// GLIDE-PATH ENGINE
// ─────────────────────────────────────────────────────────────────────────────

function buildGlidePath(goals: Goal[], riskScore: number): BucketAllocation[] {
  const sorted = [...goals]
    .filter(g => g.horizonYears && g.targetLakh)
    .sort((a, b) => parseInt(a.horizonYears) - parseInt(b.horizonYears));

  if (sorted.length === 0) return [];

  const maxYear = Math.max(...sorted.map(g => parseInt(g.horizonYears)));
  const riskMult = riskScore <= 3 ? 0.8 : riskScore >= 8 ? 1.2 : 1;

  // Create time breakpoints from goal milestones
  const breakpoints = [0, ...sorted.map(g => parseInt(g.horizonYears))].filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);

  const phases: BucketAllocation[] = [];

  for (let i = 0; i < breakpoints.length - 1; i++) {
    const yearStart = breakpoints[i];
    const yearEnd = breakpoints[i + 1];
    const midYear = (yearStart + yearEnd) / 2;
    const yearsRemaining = maxYear - midYear;

    // Base allocation by years-to-longest-goal
    let equity = 0, hybrid = 0, debt = 0;
    if (yearsRemaining <= 2) { debt = 70; hybrid = 20; equity = 10; }
    else if (yearsRemaining <= 4) { debt = 50; hybrid = 30; equity = 20; }
    else if (yearsRemaining <= 7) { debt = 30; hybrid = 35; equity = 35; }
    else if (yearsRemaining <= 12) { debt = 20; hybrid = 30; equity = 50; }
    else { debt = 10; hybrid = 20; equity = 70; }

    // Risk-adjust equity portion
    const equityAdj = Math.min(85, Math.max(5, Math.round(equity * riskMult)));
    const debtAdj = Math.max(5, Math.round(debt / riskMult));
    const hybridAdj = 100 - equityAdj - debtAdj;

    const phaseGoals = sorted.filter(g => parseInt(g.horizonYears) > yearStart && parseInt(g.horizonYears) <= yearEnd);

    const baseReturn = debtAdj * 0.075 + hybridAdj * 0.11 + equityAdj * 0.155;

    phases.push({
      debt: debtAdj,
      hybrid: Math.max(5, hybridAdj),
      equity: equityAdj,
      label: `Phase ${i + 1}: Year ${yearStart}–${yearEnd}`,
      yearStart,
      yearEnd,
      goals: phaseGoals,
      debtSubCats: yearsRemaining <= 3
        ? ["Liquid", "Ultra Short Duration", "Money Market", "Short Duration"]
        : yearsRemaining <= 7
        ? ["Short Duration", "Corporate Bond", "Banking & PSU"]
        : ["Corporate Bond", "Short Duration"],
      hybridSubCats: yearsRemaining <= 4
        ? ["Conservative Hybrid", "Equity Savings", "Balanced Advantage"]
        : ["Aggressive Hybrid", "Balanced Advantage", "Multi Asset Allocation"],
      equitySubCats: yearsRemaining <= 3
        ? ["Large Cap"]
        : yearsRemaining <= 7
        ? ["Large Cap", "Large & Mid Cap", "Flexi Cap"]
        : ["Large Cap", "Mid Cap", "Small Cap", "Flexi Cap", "Large & Mid Cap"],
      expectedReturn: [parseFloat((baseReturn - 1.5).toFixed(1)), parseFloat((baseReturn + 2.5).toFixed(1))],
      maxDrawdown: parseFloat((-(equityAdj * 0.4 + hybridAdj * 0.15) / 100 * 100).toFixed(1)),
    });
  }

  return phases;
}

function pickPhaseFunds(
  phase: BucketAllocation,
  phaseIndex: number,
  fundAnalytics: FundAnalytics[],
  etfAnalytics: ETFAnalytics[],
): LiveFund[] {
  const result: LiveFund[] = [];
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
          return3Y: f.Fund_Return_3Y, return5Y: f.Fund_Return_5Y,
          alpha3Y: f.Alpha_3Y, rank: f.Rank_in_SubCategory, aum: f.Current_AUM,
          isActive: true, bucket, phase: phaseIndex,
        });
        added++;
        if (result.filter(r => r.bucket === bucket && r.phase === phaseIndex).length >= 2) break;
      }
      if (result.filter(r => r.bucket === bucket && r.phase === phaseIndex).length >= 2) break;
    }
  }

  pickActive(phase.debtSubCats, "debt", 2);
  pickActive(phase.hybridSubCats, "hybrid", 2);
  pickActive(phase.equitySubCats, "equity", 2);

  // Add one ETF for equity-heavy phases
  if (phase.equity >= 40) {
    const etf = etfAnalytics.filter(e => !seen.has(e.ETF_Name) && e.Fund_Return_3Y !== null)
      .sort((a, b) => a.Rank_within_Benchmark - b.Rank_within_Benchmark)[0];
    if (etf) {
      seen.add(etf.ETF_Name);
      result.push({
        name: etf.ETF_Name, amc: etf.AMC, subCategory: "Index / ETF",
        return3Y: etf.Fund_Return_3Y, return5Y: null,
        alpha3Y: -(etf.Tracking_Diff_3Y || 0), rank: etf.Rank_within_Benchmark,
        aum: etf.Fund_AUM, isActive: false, bucket: "equity", phase: phaseIndex,
      });
    }
  }

  return result;
}

function sipFV(m: number, y: number, r: number) {
  const mr = r / 100 / 12; const n = y * 12;
  if (mr === 0) return m * n;
  return m * ((Math.pow(1 + mr, n) - 1) / mr) * (1 + mr);
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

const BUCKET_COLORS = {
  debt: { color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC", light: "#E0F2FE" },
  hybrid: { color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", light: "#D1FAE5" },
  equity: { color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", light: "#DBEAFE" },
};

const GOAL_EMOJIS: Record<string, string> = {
  car: "🚗", bike: "🏍️", house: "🏠", home: "🏠", flat: "🏠",
  education: "🎓", college: "🎓", school: "📚", child: "👶",
  retirement: "🌴", wedding: "💍", marriage: "💍", travel: "✈️",
  vacation: "✈️", business: "💼", emergency: "🛡️", health: "🏥",
};

function getEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const [k, v] of Object.entries(GOAL_EMOJIS)) if (lower.includes(k)) return v;
  return "🎯";
}

const SUGGESTED_GOALS = [
  { emoji: "🚗", name: "Buy a Car", amount: 10, horizon: 3 },
  { emoji: "🏠", name: "Home Down Payment", amount: 30, horizon: 6 },
  { emoji: "🎓", name: "Child's Education", amount: 50, horizon: 12 },
  { emoji: "🌴", name: "Retirement", amount: 300, horizon: 25 },
];

// ─────────────────────────────────────────────────────────────────────────────
// STACKED AREA CHART (SVG)
// ─────────────────────────────────────────────────────────────────────────────

function StackedAreaChart({ phases }: { phases: BucketAllocation[] }) {
  if (phases.length === 0) return null;
  const W = 600, H = 180, PAD = 20;
  const years = [0, ...phases.map(p => p.yearEnd)];
  const maxYear = Math.max(...years);
  const totalW = W - PAD * 2;

  function xPos(year: number) { return PAD + (year / maxYear) * totalW; }

  // Build data points at each year boundary
  const pts = phases.reduce<Array<{ x: number; d: number; h: number; e: number }>>((acc, p) => {
    if (acc.length === 0) acc.push({ x: xPos(p.yearStart), d: p.debt, h: p.hybrid, e: p.equity });
    acc.push({ x: xPos(p.yearEnd), d: p.debt, h: p.hybrid, e: p.equity });
    return acc;
  }, []);

  function mkPath(vals: number[], offset: number): string {
    const top = pts.map((pt, i) => {
      const pct = (vals[i] + offset) / 100;
      return `${pt.x},${H - pct * (H - PAD * 2) - PAD}`;
    });
    const bot = pts.map((pt, i) => {
      const pct = offset / 100;
      return `${pt.x},${H - pct * (H - PAD * 2) - PAD}`;
    }).reverse();
    return `M ${top.join(' L ')} L ${bot.join(' L ')} Z`;
  }

  const debts = pts.map(p => p.d);
  const hybrids = pts.map(p => p.h);
  const equities = pts.map(p => p.e);
  const debtPath = mkPath(debts, 0);
  const hybridPath = mkPath(hybrids.map((h, i) => h), debts[0]);
  const eqPath = mkPath(equities.map((e, i) => e), debts[0] + hybrids[0]);

  // Year labels
  const goalYears = phases.flatMap(p => p.goals.map(g => ({ year: parseInt(g.horizonYears), label: g.emoji || getEmoji(g.name) })));

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H + 30}`} style={{ width: '100%', maxWidth: `${W}px`, height: 'auto', display: 'block' }}>
        {/* Areas */}
        <path d={debtPath} fill="#0891B2" opacity={0.75} />
        {/* Hybrid needs proper offset calc */}
        {pts.map((pt, i) => null)}
        <path d={hybridPath} fill="#059669" opacity={0.75} />
        <path d={eqPath} fill="#2563EB" opacity={0.75} />

        {/* Goal markers */}
        {goalYears.map((g, i) => (
          <g key={i}>
            <line x1={xPos(g.year)} y1={PAD} x2={xPos(g.year)} y2={H} stroke="white" strokeWidth="1.5" strokeDasharray="3 2" opacity={0.7} />
            <text x={xPos(g.year)} y={H + 16} textAnchor="middle" fontSize="14">{g.label}</text>
            <text x={xPos(g.year)} y={H + 28} textAnchor="middle" fontSize="9" fill="#94A3B8">Y{g.year}</text>
          </g>
        ))}

        {/* Today marker */}
        <text x={PAD} y={H + 16} textAnchor="middle" fontSize="10" fill="#64748B">Now</text>

        {/* Legend */}
        {[
          { c: "#0891B2", l: "Bonds" },
          { c: "#059669", l: "Balanced" },
          { c: "#2563EB", l: "Equity" },
        ].map((item, i) => (
          <g key={i}>
            <rect x={PAD + i * 80} y={H + 6} width="10" height="10" fill={item.c} rx="2" opacity={0.8} />
            <text x={PAD + i * 80 + 14} y={H + 15} fontSize="10" fill="#64748B">{item.l}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TIMELINE BAR (horizontal)
// ─────────────────────────────────────────────────────────────────────────────

function TimelineBar({ goals, maxYear }: { goals: Goal[]; maxYear: number }) {
  if (maxYear === 0) return null;
  const sorted = [...goals].filter(g => g.horizonYears).sort((a, b) => parseInt(a.horizonYears) - parseInt(b.horizonYears));

  return (
    <div style={{ position: 'relative', padding: '20px 0 48px' }}>
      {/* Track */}
      <div style={{ height: '4px', background: 'linear-gradient(90deg, #BFDBFE, #A7F3D0)', borderRadius: '100px', position: 'relative', margin: '0 20px' }}>
        {/* Today dot */}
        <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translate(-50%, -50%)', width: '12px', height: '12px', background: '#1E40AF', borderRadius: '50%', border: '2px solid white', boxShadow: '0 0 0 3px rgba(30,64,175,0.2)' }} />
        <div style={{ position: 'absolute', left: 0, top: '-28px', transform: 'translateX(-50%)', fontSize: '10px', color: '#64748B', fontWeight: 600, whiteSpace: 'nowrap' }}>Today</div>

        {sorted.map((g, i) => {
          const pct = parseInt(g.horizonYears) / maxYear * 100;
          const emoji = g.emoji || getEmoji(g.name);
          return (
            <React.Fragment key={g.id}>
              <div style={{ position: 'absolute', left: `${pct}%`, top: '50%', transform: 'translate(-50%, -50%)', width: '16px', height: '16px', background: '#FFFFFF', borderRadius: '50%', border: '2.5px solid #2563EB', boxShadow: '0 2px 8px rgba(37,99,235,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', zIndex: 2 }}>
                {emoji}
              </div>
              <div style={{ position: 'absolute', left: `${pct}%`, top: i % 2 === 0 ? '-44px' : '14px', transform: 'translateX(-50%)', textAlign: 'center', minWidth: '70px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#1E3A5F', lineHeight: 1.3 }}>{g.name}</div>
                <div style={{ fontSize: '9px', color: '#94A3B8' }}>Year {g.horizonYears}</div>
                {g.targetLakh && <div style={{ fontSize: '9px', color: '#2563EB', fontWeight: 700 }}>₹{g.targetLakh}L</div>}
              </div>
            </React.Fragment>
          );
        })}

        {/* End dot */}
        <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translate(50%, -50%)', width: '12px', height: '12px', background: '#059669', borderRadius: '50%', border: '2px solid white', boxShadow: '0 0 0 3px rgba(5,150,105,0.2)' }} />
        <div style={{ position: 'absolute', right: 0, top: '-28px', transform: 'translateX(50%)', fontSize: '10px', color: '#64748B', fontWeight: 600, whiteSpace: 'nowrap' }}>Year {maxYear}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE CARD
// ─────────────────────────────────────────────────────────────────────────────

function PhaseCard({ phase, phaseIndex, funds, sipPerMonth }: { phase: BucketAllocation; phaseIndex: number; funds: LiveFund[]; sipPerMonth: number }) {
  const [showFunds, setShowFunds] = useState(false);
  const [showLogic, setShowLogic] = useState(false);
  const phaseFunds = funds.filter(f => f.phase === phaseIndex);
  const years = phase.yearEnd - phase.yearStart;
  const midRate = (phase.expectedReturn[0] + phase.expectedReturn[1]) / 2;
  const projected = sipFV(sipPerMonth * (years / (phase.yearEnd || 1)), years, midRate);

  return (
    <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
      {/* Phase header */}
      <div style={{ background: 'linear-gradient(90deg, #EFF6FF, #F0FDF4)', padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ background: '#2563EB', color: 'white', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>{phaseIndex + 1}</div>
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>Year {phase.yearStart}–{phase.yearEnd}</span>
              {phase.goals.map(g => <span key={g.id} style={{ fontSize: '16px' }}>{g.emoji || getEmoji(g.name)}</span>)}
            </div>
            {phase.goals.length > 0 && (
              <div style={{ fontSize: '12px', color: '#64748B' }}>
                Goals unlocking: {phase.goals.map(g => <strong key={g.id} style={{ color: '#1E40AF' }}>{g.name} </strong>)}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ background: 'white', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '8px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: '#60A5FA', fontWeight: 600 }}>Expected returns</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#1E40AF' }}>{phase.expectedReturn[0]}–{phase.expectedReturn[1]}%</div>
            </div>
            <div style={{ background: 'white', border: '1px solid #FED7AA', borderRadius: '10px', padding: '8px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: '#F97316', fontWeight: 600 }}>Max dip</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#C2410C' }}>{phase.maxDrawdown}%</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {/* Allocation stacked bar */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>Portfolio mix for this phase</span>
          </div>
          <div style={{ borderRadius: '8px', overflow: 'hidden', height: '10px', display: 'flex', marginBottom: '8px' }}>
            <div style={{ width: `${phase.debt}%`, background: '#0891B2', transition: 'width 0.6s ease' }} />
            <div style={{ width: `${phase.hybrid}%`, background: '#059669', transition: 'width 0.6s ease' }} />
            <div style={{ width: `${phase.equity}%`, background: '#2563EB', transition: 'width 0.6s ease' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            {[
              { label: 'Bonds', pct: phase.debt, ...BUCKET_COLORS.debt, desc: 'Safe & stable' },
              { label: 'Balanced', pct: phase.hybrid, ...BUCKET_COLORS.hybrid, desc: 'Growth buffer' },
              { label: 'Shares', pct: phase.equity, ...BUCKET_COLORS.equity, desc: 'Wealth engine' },
            ].map((s, i) => (
              <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '15px', fontWeight: 900, color: s.color }}>{s.pct}%</div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#374151' }}>{s.label}</div>
                <div style={{ fontSize: '9px', color: '#94A3B8' }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Why this phase — logic toggle */}
        <button onClick={() => setShowLogic(!showLogic)}
          style={{ width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '9px 14px', fontSize: '12px', fontWeight: 600, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', fontFamily: 'inherit' }}>
          <span>🧠 Why this mix for Year {phase.yearStart}–{phase.yearEnd}?</span>
          <span style={{ fontSize: '10px', color: '#94A3B8' }}>{showLogic ? '▲' : '▼'}</span>
        </button>
        {showLogic && (
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px 14px', marginBottom: '10px', fontSize: '12px', color: '#374151', lineHeight: 1.7 }}>
            {phase.yearEnd - phase.yearStart <= 3
              ? `This is a short phase with goals maturing soon. We're shifting heavily into bonds (${phase.debt}%) to protect the money you'll need to withdraw. Equity would be too risky here — a 20% market dip right before you need the money would hurt.`
              : phase.equity >= 60
              ? `This phase has ${phase.yearEnd - phase.yearStart} years of runway — enough for equity markets to recover from dips and compound strongly. We lean heavily on share funds (${phase.equity}%) here because time is your biggest asset.`
              : `This is a transition phase. You have medium-term goals approaching and long-term goals still compounding. The ${phase.equity}% equity + ${phase.hybrid}% balanced mix balances growth with the need to progressively protect near-term goal money.`}
          </div>
        )}

        {/* Fund recommendations */}
        <button onClick={() => setShowFunds(!showFunds)}
          style={{ width: '100%', background: showFunds ? '#EFF6FF' : 'white', border: `1.5px solid ${showFunds ? '#BFDBFE' : '#E2E8F0'}`, borderRadius: '10px', padding: '9px 14px', fontSize: '12px', fontWeight: 700, color: '#1E40AF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'inherit' }}>
          <span>📋 Funds for this phase ({phaseFunds.length} recommendations)</span>
          <span style={{ fontSize: '10px', color: '#60A5FA' }}>{showFunds ? '▲ Hide' : '▼ See funds'}</span>
        </button>

        {showFunds && phaseFunds.length > 0 && (
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(['debt', 'hybrid', 'equity'] as const).map(bucket => {
              const bf = phaseFunds.filter(f => f.bucket === bucket);
              if (bf.length === 0) return null;
              const bc = BUCKET_COLORS[bucket];
              return (
                <div key={bucket}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: bc.color, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: bc.color }} />
                    {bucket === 'debt' ? 'Bond Funds' : bucket === 'hybrid' ? 'Balanced Funds' : 'Share / Equity Funds'} — {bucket === 'debt' ? phase.debt : bucket === 'hybrid' ? phase.hybrid : phase.equity}%
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                    {bf.map((fund, fi) => (
                      <MiniPhaseCard key={fi} fund={fund} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function MiniPhaseCard({ fund }: { fund: LiveFund }) {
  const [open, setOpen] = useState(false);
  const bc = BUCKET_COLORS[fund.bucket];
  return (
    <div style={{ background: bc.bg, border: `1px solid ${bc.border}`, borderRadius: '12px', padding: '12px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', gap: '5px', marginBottom: '3px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '100px', background: fund.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.12)', color: fund.isActive ? '#059669' : '#2563EB' }}>
              {fund.isActive ? '● ACTIVE' : '◆ INDEX'}
            </span>
          </div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#0F172A', lineHeight: 1.3 }}>{fund.name}</div>
          <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>{fund.subCategory}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '9px', color: '#94A3B8' }}>3Y</div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: fund.return3Y && fund.return3Y > 0 ? '#059669' : '#374151' }}>
            {fund.return3Y ? `${fund.return3Y.toFixed(1)}%` : '—'}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '6px', fontSize: '10px', color: bc.color }}>
        {fund.alpha3Y != null && <span>α {fund.alpha3Y > 0 ? '+' : ''}{fund.alpha3Y.toFixed(1)}%</span>}
        <span>· Rank #{fund.rank}</span>
      </div>
      <button onClick={() => setOpen(!open)} style={{ marginTop: '7px', width: '100%', background: 'rgba(255,255,255,0.6)', border: `1px solid ${bc.border}`, borderRadius: '6px', padding: '4px', fontSize: '10px', fontWeight: 600, color: bc.color, cursor: 'pointer', fontFamily: 'inherit' }}>
        {open ? '▲ less' : '▼ why this fund?'}
      </button>
      {open && (
        <div style={{ marginTop: '7px', fontSize: '11px', color: bc.color, lineHeight: 1.6 }}>
          {fund.isActive
            ? `#${fund.rank} in ${fund.subCategory}${fund.alpha3Y && fund.alpha3Y > 0 ? `, with +${fund.alpha3Y.toFixed(1)}% extra returns above market` : ', consistently top-ranked'}.`
            : `Low-cost index fund — tracks the market, no manager risk.`}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GOAL INPUT ROW
// ─────────────────────────────────────────────────────────────────────────────

function GoalRow({ goal, onUpdate, onRemove }: {
  goal: Goal;
  onUpdate: (field: keyof Goal, val: string) => void;
  onRemove: () => void;
}) {
  const emoji = goal.emoji || getEmoji(goal.name);
  return (
    <div style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '14px', padding: '14px 16px', display: 'grid', gridTemplateColumns: 'auto 1fr auto auto auto', gap: '10px', alignItems: 'center' }}>
      <span style={{ fontSize: '24px', width: '36px', textAlign: 'center' }}>{emoji}</span>
      <input value={goal.name} onChange={e => onUpdate('name', e.target.value)} placeholder="Goal name (e.g. Buy a Car)"
        style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #E2E8F0', fontSize: '13px', fontWeight: 600, color: '#0F172A', outline: 'none', fontFamily: 'inherit', minWidth: 0 }}
        onFocus={e => (e.target.style.borderColor = '#3B82F6')} onBlur={e => (e.target.style.borderColor = '#E2E8F0')} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 700 }}>₹</span>
        <input type="number" value={goal.targetLakh} onChange={e => onUpdate('targetLakh', e.target.value)} placeholder="Lakhs"
          style={{ width: '80px', padding: '8px 10px', borderRadius: '8px', border: '1.5px solid #E2E8F0', fontSize: '13px', fontWeight: 700, color: '#0F172A', outline: 'none', fontFamily: 'inherit' }}
          onFocus={e => (e.target.style.borderColor = '#3B82F6')} onBlur={e => (e.target.style.borderColor = '#E2E8F0')} />
        <span style={{ fontSize: '11px', color: '#94A3B8' }}>L</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <input type="number" value={goal.horizonYears} onChange={e => onUpdate('horizonYears', e.target.value)} placeholder="Yrs" min="1" max="50"
          style={{ width: '60px', padding: '8px 10px', borderRadius: '8px', border: '1.5px solid #E2E8F0', fontSize: '13px', fontWeight: 700, color: '#0F172A', outline: 'none', fontFamily: 'inherit' }}
          onFocus={e => (e.target.style.borderColor = '#3B82F6')} onBlur={e => (e.target.style.borderColor = '#E2E8F0')} />
        <span style={{ fontSize: '11px', color: '#94A3B8' }}>yrs</span>
      </div>
      <button onClick={onRemove} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'inherit' }}>×</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

let goalIdCounter = 1;
function newGoal(overrides: Partial<Goal> = {}): Goal {
  return { id: String(goalIdCounter++), emoji: '', name: '', targetLakh: '', horizonYears: '', ...overrides };
}

export default function LifetimeWealthPlanPage() {
  // Data
  const [fundAnalytics, setFundAnalytics] = useState<FundAnalytics[]>([]);
  const [etfAnalytics, setEtfAnalytics] = useState<ETFAnalytics[]>([]);
  const [dataReady, setDataReady] = useState(false);

  // Form
  const [goals, setGoals] = useState<Goal[]>([
    newGoal({ emoji: '🚗', name: 'Buy a Car', targetLakh: '10', horizonYears: '3' }),
    newGoal({ emoji: '🏠', name: 'Home Down Payment', targetLakh: '30', horizonYears: '6' }),
    newGoal({ emoji: '🎓', name: "Child's Education", targetLakh: '50', horizonYears: '12' }),
    newGoal({ emoji: '🌴', name: 'Retirement', targetLakh: '300', horizonYears: '25' }),
  ]);
  const [monthlySIP, setMonthlySIP] = useState("30000");
  const [riskScore, setRiskScore] = useState(6);
  const [generating, setGenerating] = useState(false);

  // Result
  const [phases, setPhases] = useState<BucketAllocation[]>([]);
  const [allFunds, setAllFunds] = useState<LiveFund[]>([]);
  const [generated, setGenerated] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  // Toggles
  const [showHowEngine, setShowHowEngine] = useState(false);
  const [showScience, setShowScience] = useState(false);

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

  function addGoal() {
    setGoals(gs => [...gs, newGoal()]);
  }

  function addSuggested(s: typeof SUGGESTED_GOALS[0]) {
    setGoals(gs => [...gs, newGoal({ emoji: s.emoji, name: s.name, targetLakh: String(s.amount), horizonYears: String(s.horizon) })]);
  }

  function updateGoal(id: string, field: keyof Goal, val: string) {
    setGoals(gs => gs.map(g => g.id === id ? { ...g, [field]: val } : g));
  }

  function removeGoal(id: string) {
    setGoals(gs => gs.filter(g => g.id !== id));
  }

  function generate() {
    setGenerating(true);
    setGenerated(false);
    setTimeout(() => {
      const glidePath = buildGlidePath(goals, riskScore);
      const sip = parseFloat(monthlySIP) || 30000;
      const funds: LiveFund[] = [];
      if (dataReady) {
        glidePath.forEach((phase, i) => {
          const pf = pickPhaseFunds(phase, i, fundAnalytics, etfAnalytics);
          funds.push(...pf);
        });
      }
      setPhases(glidePath);
      setAllFunds(funds);
      setGenerated(true);
      setGenerating(false);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    }, 1200);
  }

  const validGoals = goals.filter(g => g.name && g.targetLakh && g.horizonYears);
  const maxYear = validGoals.length > 0 ? Math.max(...validGoals.map(g => parseInt(g.horizonYears))) : 0;
  const totalTarget = validGoals.reduce((s, g) => s + parseFloat(g.targetLakh || "0") * 100000, 0);
  const riskColor = riskScore <= 3 ? "#059669" : riskScore <= 7 ? "#D97706" : "#DC2626";

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* NAV */}
      <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', zIndex: 30 }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
          <AnalysisTabs />
        </div>
      </div>

      {/* HERO */}
      <section style={{ background: 'linear-gradient(155deg, #FFFBEB 0%, #F0FDF4 40%, #EFF6FF 100%)', borderBottom: '1px solid #E2E8F0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(217,119,6,0.06) 1px, transparent 0)', backgroundSize: '28px 28px' }} />
        <div style={{ position: 'absolute', top: -60, right: -60, width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(217,119,6,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: '8%', width: '320px', height: '320px', background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: '1100px', margin: '0 auto', padding: 'clamp(32px,5vw,56px) clamp(16px,4vw,24px) clamp(36px,5vw,64px)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', alignItems: 'center' }}>

            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.25)', borderRadius: '100px', padding: '5px 14px', marginBottom: '18px' }}>
                <span style={{ width: '7px', height: '7px', background: '#D97706', borderRadius: '50%', display: 'inline-block' }} />
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#78350F', letterSpacing: '0.09em', textTransform: 'uppercase' }}>Lifetime Wealth Plan · All Your Goals, One Portfolio</span>
              </div>
              <h1 style={{ fontSize: 'clamp(1.7rem,5vw,2.9rem)', fontWeight: 800, color: '#0F172A', lineHeight: 1.12, letterSpacing: '-0.025em', marginBottom: '14px' }}>
                Every goal.<br />One master plan.<br />
                <span style={{ background: 'linear-gradient(90deg, #D97706, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>That evolves with life.</span>
              </h1>
              <p style={{ fontSize: 'clamp(13px,2vw,15px)', color: '#475569', lineHeight: 1.75, maxWidth: '480px', marginBottom: '24px' }}>
                Add all your goals — car, house, child's education, retirement. We build one integrated portfolio with a <strong>smart glide path</strong> that automatically shifts between equity and bonds as your goals get closer, using the same live fund data from our matrix.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {[
                  { emoji: '🗓️', text: 'Time-bucket strategy' },
                  { emoji: '📈', text: 'Dynamic glide path' },
                  { emoji: '🔁', text: 'Automatic rebalancing logic' },
                  { emoji: '🏆', text: 'Live top-ranked funds' },
                ].map((b, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '100px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, color: '#374151', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    <span>{b.emoji}</span> {b.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Hero visual — example glide path preview */}
            <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '20px 24px', boxShadow: '0 8px 32px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px' }}>How a 25-year plan evolves</div>
              {[
                { label: 'Year 0–3', sub: 'Car goal near', d: 60, h: 25, e: 15 },
                { label: 'Year 3–6', sub: 'House goal approaching', d: 35, h: 30, e: 35 },
                { label: 'Year 6–12', sub: 'Education goal compounding', d: 20, h: 30, e: 50 },
                { label: 'Year 12–25', sub: 'Retirement — full growth', d: 10, h: 20, e: 70 },
              ].map((row, i) => (
                <div key={i} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#374151' }}>{row.label}</span>
                      <span style={{ fontSize: '10px', color: '#94A3B8', marginLeft: '6px' }}>{row.sub}</span>
                    </div>
                    <span style={{ fontSize: '10px', color: '#2563EB', fontWeight: 700 }}>Equity {row.e}%</span>
                  </div>
                  <div style={{ height: '8px', borderRadius: '100px', overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${row.d}%`, background: '#0891B2', opacity: 0.8 }} />
                    <div style={{ width: `${row.h}%`, background: '#059669', opacity: 0.8 }} />
                    <div style={{ width: `${row.e}%`, background: '#2563EB', opacity: 0.8 }} />
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
                {[{ c: '#0891B2', l: 'Bonds' }, { c: '#059669', l: 'Balanced' }, { c: '#2563EB', l: 'Equity' }].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.c }} />
                    <span style={{ fontSize: '10px', color: '#64748B' }}>{item.l}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FORM + RESULT */}
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: 'clamp(24px,4vw,48px) clamp(12px,3vw,24px) 80px' }}>

        {/* Goals input */}
        <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', padding: 'clamp(16px,3vw,28px)', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>Your life goals</div>
              <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>Add each goal with a target amount and how many years away it is</div>
            </div>
            {validGoals.length > 0 && (
              <div style={{ background: '#F0FDF4', border: '1px solid #A7F3D0', borderRadius: '10px', padding: '8px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#059669', fontWeight: 600 }}>Total you're planning for</div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#059669' }}>{fmtINR(totalTarget)}</div>
              </div>
            )}
          </div>

          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto auto', gap: '10px', padding: '0 0 6px', marginBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
            <div style={{ width: '36px' }} />
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Goal name</div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', width: '110px' }}>Target (Lakhs)</div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', width: '80px' }}>Years away</div>
            <div style={{ width: '28px' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
            {goals.map(goal => (
              <GoalRow key={goal.id} goal={goal} onUpdate={(f, v) => updateGoal(goal.id, f, v)} onRemove={() => removeGoal(goal.id)} />
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={addGoal}
              style={{ background: '#EFF6FF', border: '1.5px dashed #BFDBFE', borderRadius: '10px', padding: '8px 16px', fontSize: '12px', fontWeight: 700, color: '#2563EB', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit' }}>
              + Add another goal
            </button>
            <span style={{ fontSize: '11px', color: '#94A3B8', alignSelf: 'center' }}>Or add a common one:</span>
            {SUGGESTED_GOALS.map((s, i) => (
              <button key={i} onClick={() => addSuggested(s)}
                style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '6px 12px', fontSize: '11px', fontWeight: 600, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'inherit' }}>
                {s.emoji} {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* SIP + Risk */}
        <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', padding: 'clamp(16px,3vw,24px)', marginBottom: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>
              How much can you invest every month? <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#94A3B8', fontWeight: 700 }}>₹</span>
              <input type="number" value={monthlySIP} onChange={e => setMonthlySIP(e.target.value)} placeholder="e.g. 30000"
                style={{ width: '100%', padding: '11px 14px 11px 28px', borderRadius: '10px', border: '1.5px solid #E2E8F0', fontSize: '14px', fontWeight: 700, color: '#0F172A', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                onFocus={e => (e.target.style.borderColor = '#3B82F6')} onBlur={e => (e.target.style.borderColor = '#E2E8F0')} />
            </div>
            {monthlySIP && <div style={{ fontSize: '11px', color: '#059669', marginTop: '5px', fontWeight: 600 }}>₹{parseInt(monthlySIP).toLocaleString('en-IN')} / month total — distributed across buckets</div>}
            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '3px' }}>This total gets split proportionally across all goal buckets</div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>Your overall risk comfort</label>
              <span style={{ fontSize: '13px', fontWeight: 800, color: riskColor }}>{riskScore}/10</span>
            </div>
            <input type="range" min="1" max="10" value={riskScore} onChange={e => setRiskScore(parseInt(e.target.value))}
              style={{ width: '100%', height: '6px', borderRadius: '100px', cursor: 'pointer', accentColor: riskColor, marginBottom: '8px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '10px', color: '#059669', fontWeight: 600 }}>😌 Safe</span>
              <span style={{ fontSize: '10px', color: '#D97706', fontWeight: 600 }}>😎 Balanced</span>
              <span style={{ fontSize: '10px', color: '#DC2626', fontWeight: 600 }}>🚀 Aggressive</span>
            </div>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '9px 12px', fontSize: '12px', color: '#64748B' }}>
              {riskScore <= 3 ? '🛡️ Conservative — we\'ll protect capital more, even in long phases' : riskScore >= 8 ? '🚀 Aggressive — more equity in every phase for maximum long-term growth' : '⚖️ Balanced — optimised mix based on each goal\'s time horizon'}
            </div>
          </div>
        </div>

        {/* Generate button */}
        <button onClick={generate} disabled={validGoals.length < 1 || !monthlySIP || generating}
          style={{ width: '100%', background: validGoals.length >= 1 ? 'linear-gradient(90deg, #D97706 0%, #059669 100%)' : '#E2E8F0', color: validGoals.length >= 1 ? 'white' : '#94A3B8', border: 'none', borderRadius: '16px', padding: '18px 24px', fontSize: '16px', fontWeight: 800, cursor: validGoals.length >= 1 ? 'pointer' : 'not-allowed', letterSpacing: '-0.01em', boxShadow: validGoals.length >= 1 ? '0 4px 24px rgba(217,119,6,0.3)' : 'none', transition: 'all 0.2s', marginBottom: '32px', fontFamily: 'inherit' }}>
          {generating ? '⏳  Building your lifetime plan across all goals…' : `🌱  Build my lifetime wealth plan →  (${validGoals.length} goal${validGoals.length !== 1 ? 's' : ''})`}
        </button>

        {/* RESULTS */}
        {generated && phases.length > 0 && (
          <div ref={resultRef}>

            {/* Lifetime summary */}
            <div style={{ background: 'linear-gradient(135deg, #FFFBEB, #F0FDF4, #EFF6FF)', border: '1px solid #FDE68A', borderRadius: '24px', padding: 'clamp(16px,3vw,28px)', marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>Your Lifetime Plan Summary</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                {[
                  { label: 'Total you\'re planning for', value: fmtINR(totalTarget), color: '#D97706', bg: 'white', border: '#FDE68A' },
                  { label: 'Monthly investment', value: `₹${parseInt(monthlySIP).toLocaleString('en-IN')}`, color: '#059669', bg: 'white', border: '#A7F3D0' },
                  { label: 'Number of goals', value: `${validGoals.length} goals`, color: '#2563EB', bg: 'white', border: '#BFDBFE' },
                  { label: 'Plan horizon', value: `${maxYear} years`, color: '#7C3AED', bg: 'white', border: '#DDD6FE' },
                  { label: 'Portfolio phases', value: `${phases.length} phases`, color: '#0891B2', bg: 'white', border: '#A5F3FC' },
                ].map((s, i) => (
                  <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: '12px', padding: '12px 14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#94A3B8', lineHeight: 1.3, marginBottom: '4px' }}>{s.label}</div>
                    <div style={{ fontSize: 'clamp(14px,2.5vw,18px)', fontWeight: 900, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Timeline */}
              <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '20px 24px', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>Your goal timeline</div>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '12px' }}>Each marker is a goal unlocking — as you hit it, funds from that bucket get freed up</div>
                <TimelineBar goals={validGoals} maxYear={maxYear} />
              </div>

              {/* Stacked area chart */}
              <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '20px 24px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>How your portfolio mix shifts over time</div>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '12px' }}>As goals get closer, equity reduces and bonds increase — protecting what you've built</div>
                {/* Visual glide path bars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {phases.map((p, i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#374151' }}>{p.label}</span>
                        <div style={{ display: 'flex', gap: '10px', fontSize: '10px', color: '#94A3B8' }}>
                          <span style={{ color: '#0891B2' }}>Bonds {p.debt}%</span>
                          <span style={{ color: '#059669' }}>Balanced {p.hybrid}%</span>
                          <span style={{ color: '#2563EB' }}>Equity {p.equity}%</span>
                        </div>
                      </div>
                      <div style={{ height: '10px', borderRadius: '8px', overflow: 'hidden', display: 'flex', transition: 'all 0.4s' }}>
                        <div style={{ width: `${p.debt}%`, background: '#0891B2', opacity: 0.8 }} />
                        <div style={{ width: `${p.hybrid}%`, background: '#059669', opacity: 0.8 }} />
                        <div style={{ width: `${p.equity}%`, background: '#2563EB', opacity: 0.8 }} />
                      </div>
                      {p.goals.length > 0 && (
                        <div style={{ fontSize: '10px', color: '#059669', marginTop: '3px', display: 'flex', gap: '6px' }}>
                          {p.goals.map(g => <span key={g.id}>🎯 {g.name} unlocks (₹{g.targetLakh}L)</span>)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* How the engine thinks toggle */}
            <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '16px', marginBottom: '16px', overflow: 'hidden' }}>
              <button onClick={() => setShowHowEngine(!showHowEngine)}
                style={{ width: '100%', background: 'white', border: 'none', padding: '18px 24px', fontSize: '14px', fontWeight: 700, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'inherit' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ fontSize: '20px' }}>🧠</span> How does the engine design a lifetime portfolio?</span>
                <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>{showHowEngine ? '▲ Hide' : '▼ Know more'}</span>
              </button>
              {showHowEngine && (
                <div style={{ padding: '0 24px 24px', borderTop: '1px solid #F1F5F9' }}>
                  <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.75, margin: '16px 0' }}>
                    Instead of treating each goal in isolation, we look at them together and build a <strong>time-bucketed glide path</strong>. Here's the exact logic:
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
                    {[
                      { step: '1', icon: '📅', title: 'Goals ranked by time', body: 'We sort all your goals by how soon you need the money. Short-term goals get protective allocations first.' },
                      { step: '2', icon: '🪣', title: 'Time buckets created', body: `Your ${maxYear}-year timeline is split into ${phases.length} phases — one for each gap between goal milestones.` },
                      { step: '3', icon: '⚖️', title: 'Each bucket gets a mix', body: 'Near-term buckets get more bonds. Far-off buckets get more equity. Risk score fine-tunes each bucket.' },
                      { step: '4', icon: '💰', title: 'SIP split proportionally', body: `Your ₹${parseInt(monthlySIP).toLocaleString('en-IN')}/month is distributed across buckets weighted by goal size and urgency.` },
                      { step: '5', icon: '📉', title: 'Glide path auto-shifts', body: 'As years pass and goals unlock, the freed-up allocation from shorter buckets flows into longer-term growth buckets.' },
                      { step: '6', icon: '🏆', title: 'Top-ranked funds selected', body: 'For each bucket, we run the same algorithm from our Smart Fund Engine — picking #1-ranked funds per sub-category from live data.' },
                    ].map((item, i) => (
                      <div key={i} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{ width: '22px', height: '22px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: '#2563EB', flexShrink: 0 }}>{item.step}</span>
                          <span style={{ fontSize: '18px' }}>{item.icon}</span>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#1F2937' }}>{item.title}</span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.6, margin: 0 }}>{item.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Scientific credibility */}
            <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '16px', marginBottom: '24px', overflow: 'hidden' }}>
              <button onClick={() => setShowScience(!showScience)}
                style={{ width: '100%', background: 'white', border: 'none', padding: '18px 24px', fontSize: '14px', fontWeight: 700, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'inherit' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ fontSize: '20px' }}>📐</span> The science powering this plan</span>
                <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>{showScience ? '▲ Hide' : '▼ Know more'}</span>
              </button>
              {showScience && (
                <div style={{ padding: '0 24px 24px', borderTop: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', margin: '16px 0' }}>
                    {[
                      { icon: '📊', title: 'Allocation based on horizon', body: 'Every allocation % is derived from historical rolling return analysis. The equity/debt split for each time bucket is what has delivered best risk-adjusted outcomes.' },
                      { icon: '📉', title: 'Drawdown stress-tested', body: 'Each phase shows a max drawdown — the worst 1-year loss historically for that allocation. We never hide downside risk from you.' },
                      { icon: '🔬', title: 'Sub-category by alpha rank', body: 'Fund types are chosen by their 3-year average alpha over benchmark — only categories that consistently beat the index qualify.' },
                      { icon: '🔄', title: 'Rebalancing designed in', body: 'The glide path tells you when to shift allocations. After each goal unlocks, rebalance from that bucket into longer-duration equity funds.' },
                    ].map((s, i) => (
                      <div key={i} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px 16px' }}>
                        <div style={{ fontSize: '20px', marginBottom: '6px' }}>{s.icon}</div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#1F2937', marginBottom: '4px' }}>{s.title}</div>
                        <p style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.6, margin: 0 }}>{s.body}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '12px 16px', fontSize: '12px', color: '#92400E', lineHeight: 1.6 }}>
                    <strong>Disclaimer:</strong> Projections are based on historical returns and are not a guarantee. Investment involves risk. Please consult a SEBI-registered financial advisor before making investment decisions.
                  </div>
                </div>
              )}
            </div>

            {/* Phase-by-phase plans */}
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📋</span> Your portfolio phase by phase
              <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>{phases.length} phases · each with its own fund recommendations</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
              {phases.map((phase, i) => (
                <PhaseCard
                  key={i}
                  phase={phase}
                  phaseIndex={i}
                  funds={allFunds}
                  sipPerMonth={parseFloat(monthlySIP) || 30000}
                />
              ))}
            </div>

            {/* Rebalancing guide */}
            <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '20px', padding: 'clamp(16px,3vw,24px)', marginBottom: '24px' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🔁</span> When and how to rebalance
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '16px' }}>You don't need to check this every day. Here's a simple schedule:</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                {[
                  { trigger: 'Every year', action: 'Review if allocation has drifted >5% from target. Rebalance by pausing SIPs in the over-allocated bucket and redirecting to the under-allocated one.', icon: '📅', color: '#2563EB' },
                  { trigger: 'When a goal is 2 years away', action: 'Start moving that bucket\'s equity into short-duration bonds. Protect what you\'ve built — don\'t risk it in the final stretch.', icon: '⏱️', color: '#D97706' },
                  { trigger: 'After a goal unlocks', action: 'Withdraw what you need. Move the freed SIP capacity to the next-longest goal bucket. Let compounding work longer.', icon: '🎯', color: '#059669' },
                  { trigger: 'If markets fall >20%', action: 'Don\'t panic-sell. This is temporary. If anything, increase your SIP — you\'re buying at a discount for future goals.', icon: '📉', color: '#DC2626' },
                ].map((item, i) => (
                  <div key={i} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '18px' }}>{item.icon}</span>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: item.color }}>{item.trigger}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.6, margin: 0 }}>{item.action}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA back to quick picks */}
            <div style={{ background: 'linear-gradient(135deg, #EFF6FF, #F0FDF4)', border: '1px solid #BFDBFE', borderRadius: '16px', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>Need to plan just one goal quickly?</div>
                <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>Go back to Quick Fund Picks for a fast single-goal plan.</p>
              </div>
              <a href="/find-my-fund-quick-picks"
                style={{ background: 'linear-gradient(90deg, #059669, #2563EB)', color: 'white', borderRadius: '12px', padding: '11px 20px', fontSize: '13px', fontWeight: 800, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                Quick Fund Picks →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}