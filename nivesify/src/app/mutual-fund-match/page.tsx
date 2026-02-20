"use client";

import AnalysisTabs from "@/components/AnalysisTabs";
import React, { useState, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

type InsightRow = {
  Level: string;
  Category_Name: string | null;
  Sub_Category_Name: string | null;
  Number_of_Schemes: number;
  Avg_Alpha_3Y: number;
  Avg_IR_3Y: number | null;
  Pct_Funds_Beating_Benchmark_3Y: number;
  Avg_3Y_Return: number;
  Avg_5Y_Return: number;
};

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
  Alpha_5Y: number | null;
  IR_3Y: number | null;
  Composite_Score: number;
  Rank_in_SubCategory: number;
  Percentile_in_SubCategory: number;
};

type ETFAnalytics = {
  ETF_Name: string;
  AMC: string | null;
  Benchmark_Name: string;
  Fund_AUM: number;
  Fund_Return_1Y: number | null;
  Fund_Return_3Y: number | null;
  Tracking_Diff_1Y: number | null;
  Tracking_Diff_3Y: number | null;
  ETF_Score: number;
  Rank_within_Benchmark: number;
  Percentile_within_Benchmark: number;
};

type AMFIFund = {
  Report_Date: string;
  Category: string;
  Sub_Category: string;
  schemeName: string;
  benchmark: string;
  dailyAUM: number;
};

type SubCategoryPerformance = {
  subCategoryName: string;
  fundCount: number;
  avgAlpha: number;
  avgBeatRate: number;
  topFundName: string;
  topFundScore: number;
  rank: number;
};

type BoxResult = {
  empty: boolean;
  leadingSubCategory: string | null;
  allConsideredSubCategories: string[];
  candidateSubCategories: SubCategoryPerformance[];
  decision?: "ACTIVE" | "INDEX";
  selectedFund?: FundAnalytics | ETFAnalytics | null;
  fundStats?: {
    return1Y: number | null;
    return3Y: number | null;
    return5Y: number | null;
    alpha3Y: number | null;
    rank: number;
    aum: number;
  };
};

type GridDef = Array<{ label: string; subtitle: string }>;

// ──────────────────────────────────────────────────────────────
// HELPERS (unchanged)
// ──────────────────────────────────────────────────────────────

function getStyle(fund: AMFIFund): number {
  const sub   = (fund.Sub_Category || "").toLowerCase();
  const bench = (fund.benchmark    || "").toLowerCase();
  if (sub.includes("value") || sub.includes("contra") || sub.includes("dividend")) return 0;
  if (bench.includes("value") || bench.includes("contra")) return 0;
  if (bench.includes("momentum")) return 2;
  const sizeSubcats = ["large cap","mid cap","small cap","flexi cap","multi cap","large & mid cap","elss","focused"];
  if (sub !== "index / etf" && sizeSubcats.includes(sub)) return 3;
  return 1;
}

function getSize(fund: AMFIFund): number | null {
  const sub   = (fund.Sub_Category || "").toLowerCase();
  const bench = (fund.benchmark    || "").toLowerCase();
  if (sub === "large cap" || sub === "large & mid cap" || sub === "focused") return 0;
  if (sub === "mid cap") return 1;
  if (sub === "small cap") return 2;
  if (sub === "flexi cap" || sub === "multi cap" || sub === "elss") return 3;
  if (sub === "value" || sub === "contra" || sub === "dividend yield") return 0;
  if (/\bnifty 50\b|sensex|\bnifty 100\b|bse 100/.test(bench)) return 0;
  if (/nifty200 |nifty 200 |nifty200momentum|nifty 200 momentum/.test(bench)) return 0;
  if (/midcap 150|midcap 100|nifty midcap/.test(bench)) return 1;
  if (/midsmallcap|mid small/.test(bench)) return 1;
  if (/smallcap 250|smallcap 100|nifty smallcap/.test(bench)) return 2;
  if (/nifty 500|nifty500|bse 500|bse500|total market|multicap momentum/.test(bench)) return 3;
  if (bench.includes("alpha") && !/midcap|smallcap/.test(bench)) return 3;
  return null;
}

function shouldExclude(fund: AMFIFund): boolean {
  const cat = (fund.Category || "").toLowerCase();
  const sub = (fund.Sub_Category || "").toLowerCase();
  if (cat === "equity") return sub === "solution oriented - children's fund";
  if (cat === "other" && sub === "index / etf") {
    const bench = (fund.benchmark || "").toLowerCase();
    const equityKeywords = ["nifty","sensex","bse","midcap","smallcap","largecap","large cap","flexi","multi cap","momentum","value","alpha","quality","dividend","growth"];
    return !equityKeywords.some(kw => bench.includes(kw));
  }
  return true;
}

// ──────────────────────────────────────────────────────────────
// TWO-TIER SELECTION (unchanged)
// ──────────────────────────────────────────────────────────────

function buildBox(
  row: number, col: number, cellFunds: AMFIFund[],
  fundAnalytics: FundAnalytics[], etfAnalytics: ETFAnalytics[], insights: InsightRow[]
): BoxResult {
  if (cellFunds.length === 0) return { empty: true, leadingSubCategory: null, allConsideredSubCategories: [], candidateSubCategories: [] };

  const allConsideredSubCategories = new Set<string>();
  const subCategoryGroups: Record<string, AMFIFund[]> = {};
  cellFunds.forEach(fund => {
    const isPassive = fund.Sub_Category.toLowerCase() === "index / etf";
    const key = isPassive ? fund.benchmark : fund.Sub_Category;
    allConsideredSubCategories.add(key);
    if (!subCategoryGroups[key]) subCategoryGroups[key] = [];
    subCategoryGroups[key].push(fund);
  });

  const subCategoryPerformances: SubCategoryPerformance[] = [];
  Object.keys(subCategoryGroups).forEach(subCatKey => {
    const fundsInSubCat = subCategoryGroups[subCatKey];
    let totalAlpha = 0, totalBeatRate = 0, fundCount = 0;
    let topFund: (FundAnalytics | ETFAnalytics) | null = null;
    let topRank = 999999;
    fundsInSubCat.forEach(amfiFund => {
      const activeFund = fundAnalytics.find(f => f.Fund_Name.toLowerCase() === amfiFund.schemeName.toLowerCase() && f.Fund_Return_3Y !== null);
      if (activeFund) {
        totalAlpha += activeFund.Alpha_3Y || 0; fundCount++;
        const insight = insights.find(ins => ins.Sub_Category_Name?.toLowerCase() === activeFund.Sub_Category.toLowerCase());
        if (insight) totalBeatRate += insight.Pct_Funds_Beating_Benchmark_3Y || 0;
        if (activeFund.Rank_in_SubCategory < topRank) { topRank = activeFund.Rank_in_SubCategory; topFund = activeFund; }
        return;
      }
      const etfFund = etfAnalytics.find(e => e.ETF_Name.toLowerCase() === amfiFund.schemeName.toLowerCase() && e.Fund_Return_3Y !== null);
      if (etfFund) {
        totalAlpha += -(etfFund.Tracking_Diff_3Y || 0); fundCount++; totalBeatRate += 50;
        if (etfFund.Rank_within_Benchmark < topRank) { topRank = etfFund.Rank_within_Benchmark; topFund = etfFund; }
      }
    });
    if (fundCount > 0 && topFund) subCategoryPerformances.push({
      subCategoryName: subCatKey, fundCount, avgAlpha: totalAlpha / fundCount, avgBeatRate: totalBeatRate / fundCount,
      topFundName: 'Fund_Name' in topFund ? (topFund as FundAnalytics).Fund_Name : (topFund as ETFAnalytics).ETF_Name,
      topFundScore: 'Composite_Score' in topFund ? (topFund as FundAnalytics).Composite_Score : (topFund as ETFAnalytics).ETF_Score,
      rank: topRank
    });
  });

  if (subCategoryPerformances.length === 0) return { empty: true, leadingSubCategory: null, allConsideredSubCategories: Array.from(allConsideredSubCategories), candidateSubCategories: [] };

  const sortedSubCats = [...subCategoryPerformances].sort((a, b) => Math.abs(a.avgAlpha - b.avgAlpha) > 0.1 ? b.avgAlpha - a.avgAlpha : b.avgBeatRate - a.avgBeatRate);
  const leadingSubCat = sortedSubCats[0];
  const leadingFunds = subCategoryGroups[leadingSubCat.subCategoryName];
  let bestFund: (FundAnalytics | ETFAnalytics) | null = null, bestRank = 999999, isActive = false;

  leadingFunds.forEach(amfiFund => {
    const activeFund = fundAnalytics.find(f => f.Fund_Name.toLowerCase() === amfiFund.schemeName.toLowerCase() && f.Fund_Return_3Y !== null);
    if (activeFund && activeFund.Rank_in_SubCategory < bestRank) { bestRank = activeFund.Rank_in_SubCategory; bestFund = activeFund; isActive = true; return; }
    const etfFund = etfAnalytics.find(e => e.ETF_Name.toLowerCase() === amfiFund.schemeName.toLowerCase() && e.Fund_Return_3Y !== null);
    if (etfFund && etfFund.Rank_within_Benchmark < bestRank) { bestRank = etfFund.Rank_within_Benchmark; bestFund = etfFund; isActive = false; }
  });

  let decision: "ACTIVE" | "INDEX" = isActive ? "ACTIVE" : "INDEX";
  if (col === 3 && !isActive) {
    const activeFundsInCell = leadingFunds.map(af => fundAnalytics.find(f => f.Fund_Name.toLowerCase() === af.schemeName.toLowerCase() && f.Fund_Return_3Y !== null)).filter(Boolean) as FundAnalytics[];
    if (activeFundsInCell.length > 0) { bestFund = activeFundsInCell.sort((a, b) => a.Rank_in_SubCategory - b.Rank_in_SubCategory)[0]; decision = "ACTIVE"; isActive = true; bestRank = bestFund.Rank_in_SubCategory; }
  }

  const fundStats = bestFund ? {
    return1Y: 'Fund_Return_1Y' in bestFund ? (bestFund as FundAnalytics).Fund_Return_1Y : (bestFund as ETFAnalytics).Fund_Return_1Y,
    return3Y: 'Fund_Return_3Y' in bestFund ? (bestFund as FundAnalytics).Fund_Return_3Y : (bestFund as ETFAnalytics).Fund_Return_3Y,
    return5Y: 'Fund_Return_5Y' in bestFund ? (bestFund as FundAnalytics).Fund_Return_5Y : null,
    alpha3Y: 'Alpha_3Y' in bestFund ? (bestFund as FundAnalytics).Alpha_3Y : -((bestFund as ETFAnalytics).Tracking_Diff_3Y || 0),
    rank: bestRank,
    aum: 'Current_AUM' in bestFund ? (bestFund as FundAnalytics).Current_AUM : (bestFund as ETFAnalytics).Fund_AUM
  } : undefined;

  return { empty: false, leadingSubCategory: leadingSubCat.subCategoryName, allConsideredSubCategories: Array.from(allConsideredSubCategories), candidateSubCategories: subCategoryPerformances, decision, selectedFund: bestFund, fundStats };
}

// ──────────────────────────────────────────────────────────────
// SHARED PRIMITIVES
// ──────────────────────────────────────────────────────────────

function LiveBadge({ date }: { date: string }) {
  if (!date) return null;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F0FDF4', border: '1px solid #A7F3D0', borderRadius: '100px', padding: '4px 12px', flexShrink: 0 }}>
      <span style={{ width: '6px', height: '6px', background: '#10B981', borderRadius: '50%', display: 'inline-block' }} />
      <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600, whiteSpace: 'nowrap' }}>Live · {date}</span>
    </div>
  );
}

function SectionHeader({ num, title, subtitle, reportDate }: { num: string; title: string; subtitle: string; reportDate?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #3B82F6, #2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '16px', flexShrink: 0, boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
          {num}
        </div>
        <div>
          <h2 style={{ fontSize: 'clamp(16px, 2.5vw, 20px)', fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.2 }}>{title}</h2>
          <p style={{ fontSize: '12px', color: '#94A3B8', margin: '2px 0 0', fontWeight: 500 }}>{subtitle}</p>
        </div>
      </div>
      {reportDate && <LiveBadge date={reportDate} />}
    </div>
  );
}

function PlaceholderGrid({ rows, cols }: { rows: GridDef; cols: GridDef }) {
  return (
    <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #E2E8F0', WebkitOverflowScrolling: 'touch' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '420px', fontSize: '12px' }}>
        <thead>
          <tr>
            <th style={{ padding: '12px', width: '110px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0' }} />
            {cols.map((c, i) => (
              <th key={i} style={{ padding: '10px 12px', textAlign: 'center', background: 'linear-gradient(180deg, #EFF6FF, #DBEAFE)', borderBottom: '1px solid #BFDBFE', borderRight: i < cols.length - 1 ? '1px solid #DBEAFE' : 'none' }}>
                <div style={{ fontWeight: 700, color: '#1E40AF', fontSize: '10px' }}>{c.label}</div>
                <div style={{ fontSize: '9px', color: '#93C5FD', marginTop: '2px' }}>{c.subtitle}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#FAFAFA' }}>
              <th style={{ padding: '12px', textAlign: 'left', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0' }}>
                <div style={{ fontWeight: 700, fontSize: '11px', color: '#374151' }}>{r.label}</div>
                <div style={{ fontSize: '9px', color: '#9CA3AF', fontWeight: 400, marginTop: '2px', lineHeight: 1.3 }}>{r.subtitle}</div>
              </th>
              {cols.map((_, j) => (
                <td key={j} style={{ padding: '12px', borderBottom: '1px solid #E2E8F0', borderRight: j < cols.length - 1 ? '1px solid #E2E8F0' : 'none' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ height: '10px', background: '#E5E7EB', borderRadius: '100px', width: '75%' }} />
                    <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '100px', width: '50%' }} />
                    <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '100px', width: '65%' }} />
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// GRID CELL
// ──────────────────────────────────────────────────────────────

function GridCell({ box, onClick }: { box: BoxResult; onClick: () => void }) {
  if (box.empty) {
    return (
      <div onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 6px', gap: '4px', cursor: 'pointer', color: '#CBD5E1', minHeight: '60px' }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2"/></svg>
        <span style={{ fontSize: '9px', color: '#CBD5E1', textAlign: 'center' }}>No data yet</span>
      </div>
    );
  }

  const fund = box.selectedFund;
  if (!fund) return null;
  const fundName = 'Fund_Name' in fund ? fund.Fund_Name : fund.ETF_Name;
  const isActive = box.decision === "ACTIVE";
  const stats = box.fundStats;

  return (
    <div onClick={onClick} style={{ cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '5px' }}>
        <span style={{
          fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '100px', letterSpacing: '0.04em',
          background: isActive ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)',
          color: isActive ? '#059669' : '#2563EB',
          border: `1px solid ${isActive ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)'}`,
          whiteSpace: 'nowrap',
        }}>
          {isActive ? '● ACTIVE' : '◆ INDEX'}
        </span>
      </div>
      <div style={{ fontSize: '10px', fontWeight: 800, color: '#1E3A5F', lineHeight: 1.3, marginBottom: '3px' }}>
        {box.leadingSubCategory}
      </div>
      <div style={{ fontSize: '9px', color: '#6B7280', lineHeight: 1.4, marginBottom: '4px' }}>
        {fundName.length > 36 ? fundName.substring(0, 34) + '…' : fundName}
      </div>
      {stats && (
        <div style={{ fontSize: '9px', color: '#94A3B8', lineHeight: 1.6 }}>
          <span style={{ color: stats.alpha3Y && stats.alpha3Y > 0 ? '#10B981' : '#EF4444', fontWeight: 700 }}>
            α{stats.alpha3Y && stats.alpha3Y > 0 ? '+' : ''}{stats.alpha3Y?.toFixed(1)}%
          </span>
          {' · '}3Y {stats.return3Y?.toFixed(1)}%
          {stats.return5Y ? ` · 5Y ${stats.return5Y.toFixed(1)}%` : ''}
          <div>Rank #{stats.rank} · ₹{(stats.aum / 1000).toFixed(0)}K Cr</div>
        </div>
      )}
      <div style={{ fontSize: '9px', color: '#93C5FD', marginTop: '3px' }}>
        Tap to see why →
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// DETAIL MODAL (full data, unchanged logic)
// ──────────────────────────────────────────────────────────────

function DetailModal({ box, onClose }: { box: BoxResult; onClose: () => void }) {
  if (box.empty) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }} onClick={onClose}>
        <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 32px 80px rgba(0,0,0,0.15)', maxWidth: '520px', width: '100%', border: '1px solid #E2E8F0', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontWeight: 700, fontSize: '17px', color: '#0F172A', margin: 0 }}>Why is nothing showing here?</h2>
            <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: '#F1F5F9', color: '#64748B', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
          </div>
          <div style={{ padding: '20px 24px' }}>
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '18px' }}>
              <p style={{ fontSize: '13px', color: '#92400E', fontWeight: 600, marginBottom: '10px' }}>No fund qualifies for this slot because:</p>
              <ul style={{ fontSize: '13px', color: '#78350F', paddingLeft: 0, listStyle: 'none', margin: 0 }}>
                {[
                  'The fund must have a real track record — we only consider funds with at least some performance history to compare',
                  'It must genuinely fit this type (company size + investment style)',
                  'Without a real track record, any recommendation would just be guesswork',
                ].map((s, i) => (
                  <li key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ color: '#F59E0B', flexShrink: 0 }}>•</span>{s}
                  </li>
                ))}
              </ul>
            </div>
            {box.allConsideredSubCategories.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>We still looked at {box.allConsideredSubCategories.length} fund types for this slot:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {box.allConsideredSubCategories.map((cat, i) => (
                    <span key={i} style={{ fontSize: '11px', padding: '2px 9px', borderRadius: '100px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#64748B' }}>{cat}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const fund = box.selectedFund;
  const fundName = fund ? ('Fund_Name' in fund ? fund.Fund_Name : fund.ETF_Name) : 'N/A';
  const isActive = box.decision === "ACTIVE";

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '12px' }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 32px 80px rgba(0,0,0,0.15)', maxWidth: '860px', width: '100%', maxHeight: '94vh', overflowY: 'auto', border: '1px solid #E2E8F0' }} onClick={e => e.stopPropagation()}>

        {/* Sticky header */}
        <div style={{ position: 'sticky', top: 0, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(8px)', padding: '16px 20px', borderBottom: '1px solid #F1F5F9', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '10px', fontWeight: 700, padding: '2px 9px', borderRadius: '100px', letterSpacing: '0.05em', whiteSpace: 'nowrap',
                  background: isActive ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)',
                  color: isActive ? '#059669' : '#2563EB',
                  border: `1px solid ${isActive ? 'rgba(16,185,129,0.25)' : 'rgba(59,130,246,0.25)'}`,
                }}>
                  {isActive ? '● Actively managed' : '◆ Index / ETF'}
                </span>
                <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>Why we picked this fund</span>
              </div>
              <h2 style={{ fontSize: 'clamp(14px, 3vw, 19px)', fontWeight: 800, color: '#0F172A', margin: '0 0 3px', lineHeight: 1.2 }}>{fundName}</h2>
              <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
                Type: <strong style={{ color: '#374151' }}>{box.leadingSubCategory}</strong>
                {' · '}{box.candidateSubCategories.length} fund types compared
              </p>
            </div>
            <button onClick={onClose} style={{ width: '34px', height: '34px', borderRadius: '10px', border: 'none', background: '#F1F5F9', color: '#64748B', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
          </div>
        </div>

        <div style={{ padding: 'clamp(16px, 4vw, 28px)', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Stats */}
          {box.fundStats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
              {[
                { label: '3-Year Returns', value: `${box.fundStats.return3Y?.toFixed(2)}%`, color: '#0F172A', help: 'How much ₹100 grew over 3 years' },
                { label: '5-Year Returns', value: box.fundStats.return5Y ? `${box.fundStats.return5Y.toFixed(2)}%` : '—', color: '#0F172A', help: 'How much ₹100 grew over 5 years' },
                { label: 'Extra Returns vs Index', value: `${box.fundStats.alpha3Y && box.fundStats.alpha3Y > 0 ? '+' : ''}${box.fundStats.alpha3Y?.toFixed(2)}%`, color: box.fundStats.alpha3Y && box.fundStats.alpha3Y > 0 ? '#059669' : '#DC2626', help: 'How much more (or less) it earned vs the benchmark' },
                { label: 'Rank in its Category', value: `#${box.fundStats.rank}`, color: '#0F172A', help: 'Ranked against all similar funds' },
                { label: 'Total Money Managed', value: `₹${(box.fundStats.aum / 1000).toFixed(1)}K Cr`, color: '#0F172A', help: 'Total investor money in this fund' },
              ].map((s, i) => (
                <div key={i} style={{ background: '#F8FAFC', borderRadius: '12px', padding: '12px 14px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '10px', color: '#94A3B8', marginBottom: '3px', fontWeight: 500, lineHeight: 1.3 }}>{s.label}</div>
                  <div style={{ fontSize: 'clamp(18px, 3vw, 22px)', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: '9px', color: '#CBD5E1', marginTop: '3px', lineHeight: 1.3 }}>{s.help}</div>
                </div>
              ))}
            </div>
          )}

          {/* Why this fund */}
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '14px', padding: '16px 18px', display: 'flex', gap: '12px' }}>
            <span style={{ fontSize: '20px', flexShrink: 0 }}>💡</span>
            <div>
              <h3 style={{ fontWeight: 700, color: '#1E40AF', fontSize: '14px', margin: '0 0 5px' }}>Why did we pick this fund?</h3>
              <p style={{ fontSize: '13px', color: '#1E3A8A', margin: 0, lineHeight: 1.65 }}>
                We compared <strong>{box.candidateSubCategories.length}</strong> types of funds for this slot.{' '}
                <strong>{box.leadingSubCategory}</strong> consistently delivered the best extra returns above the market benchmark.
                Within that type, this fund ranked <strong>#{box.fundStats?.rank}</strong> — the top pick, chosen purely by numbers, no human bias.
              </p>
            </div>
          </div>

          {/* All fund types evaluated */}
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '10px' }}>
              All fund types we evaluated for this slot ({box.allConsideredSubCategories.length} total)
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
              {box.allConsideredSubCategories.map((cat, i) => {
                const hasData = box.candidateSubCategories.some(c => c.subCategoryName === cat);
                return (
                  <span key={i} style={{
                    fontSize: '11px', padding: '3px 10px', borderRadius: '100px', fontWeight: hasData ? 600 : 400,
                    background: hasData ? '#EFF6FF' : '#F8FAFC',
                    border: `1px solid ${hasData ? '#BFDBFE' : '#E2E8F0'}`,
                    color: hasData ? '#2563EB' : '#94A3B8',
                  }}>
                    {hasData ? '✓ ' : ''}{cat}
                  </span>
                );
              })}
            </div>
            <p style={{ fontSize: '11px', color: '#94A3B8' }}>Blue ticked = had enough history to be fairly compared · Grey = skipped (not enough data)</p>
          </div>

          {/* Head to head */}
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '10px' }}>
              Head-to-head comparison — who gave better returns above market?
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[...box.candidateSubCategories].sort((a, b) => b.avgAlpha - a.avgAlpha).map((subCat, i) => {
                const isWinner = subCat.subCategoryName === box.leadingSubCategory;
                return (
                  <div key={i} style={{
                    borderRadius: '12px', padding: '12px 16px', border: `1px solid ${isWinner ? '#A7F3D0' : '#E2E8F0'}`,
                    background: isWinner ? '#ECFDF5' : '#F8FAFC',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px', flexWrap: 'wrap', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '13px', color: '#1F2937' }}>{subCat.subCategoryName}</span>
                        {isWinner && <span style={{ fontSize: '10px', background: '#059669', color: 'white', padding: '2px 8px', borderRadius: '100px', fontWeight: 700 }}>WINNER</span>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '10px', color: '#94A3B8' }}>Avg extra return vs index</div>
                        <div style={{ fontSize: 'clamp(16px, 3vw, 18px)', fontWeight: 800, color: subCat.avgAlpha > 0 ? '#059669' : '#DC2626' }}>
                          {subCat.avgAlpha > 0 ? '+' : ''}{subCat.avgAlpha.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: '#64748B', flexWrap: 'wrap' }}>
                      <span>{subCat.fundCount} fund{subCat.fundCount > 1 ? 's' : ''} compared</span>
                      <span>Beat the index: <strong style={{ color: '#374151' }}>{subCat.avgBeatRate.toFixed(0)}% of the time</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Methodology */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px 18px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#374151', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>📐</span> How we shortlisted this fund — in plain English
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
              {[
                'We gathered every fund that fits this slot — right company size, right investment style',
                'We grouped them by type and measured how much extra return each type gave over the years',
                'The type that consistently beat the market the most got selected',
                'Within that winning type, the highest-ranked fund with real performance history became your pick',
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', fontSize: '12px', color: '#64748B' }}>
                  <span style={{ color: '#3B82F6', fontWeight: 800, flexShrink: 0 }}>{i + 1}.</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// SECTION PANEL
// ──────────────────────────────────────────────────────────────

function SectionPanel({ rows, cols, boxes, onCellClick }: {
  rows: GridDef; cols: GridDef; boxes: BoxResult[][]; onCellClick: (box: BoxResult) => void;
}) {
  return (
    <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #E2E8F0', WebkitOverflowScrolling: 'touch' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '380px', fontSize: '11px' }}>
        <thead>
          <tr>
            <th style={{ padding: '12px', width: '110px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0', fontSize: '10px', color: '#94A3B8', fontWeight: 600, textAlign: 'left' }}>Company Size ↓</th>
            {cols.map((c, i) => (
              <th key={i} style={{ padding: '10px 12px', textAlign: 'center', background: 'linear-gradient(180deg, #EFF6FF 0%, #DBEAFE 100%)', borderBottom: '1px solid #BFDBFE', borderRight: i < cols.length - 1 ? '1px solid #DBEAFE' : 'none', minWidth: '130px' }}>
                <div style={{ fontWeight: 800, color: '#1E40AF', fontSize: '11px' }}>{c.label}</div>
                <div style={{ fontSize: '9px', color: '#60A5FA', fontWeight: 500, marginTop: '2px' }}>{c.subtitle}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, rowIdx) => (
            <tr key={rowIdx}>
              <th style={{ padding: '12px', textAlign: 'left', background: '#F8FAFC', borderBottom: rowIdx < rows.length - 1 ? '1px solid #E2E8F0' : 'none', borderRight: '1px solid #E2E8F0', verticalAlign: 'top' }}>
                <div style={{ fontWeight: 800, fontSize: '11px', color: '#374151' }}>{r.label}</div>
                <div style={{ fontSize: '9px', color: '#9CA3AF', fontWeight: 400, marginTop: '3px', lineHeight: 1.4 }}>{r.subtitle}</div>
              </th>
              {cols.map((_, colIdx) => (
                <td key={colIdx}
                  style={{ padding: '10px 12px', borderBottom: rowIdx < rows.length - 1 ? '1px solid #F1F5F9' : 'none', borderRight: colIdx < cols.length - 1 ? '1px solid #F1F5F9' : 'none', verticalAlign: 'top', background: 'white', cursor: 'pointer', transition: 'background 0.15s' }}
                  onClick={() => onCellClick(boxes[rowIdx][colIdx])}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F0F9FF')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                >
                  <GridCell box={boxes[rowIdx][colIdx]} onClick={() => onCellClick(boxes[rowIdx][colIdx])} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// HERO
// ──────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section style={{
      background: 'linear-gradient(155deg, #EFF6FF 0%, #F0FDF4 45%, #FFFBEB 100%)',
      borderBottom: '1px solid #E2E8F0',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Dot grid */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(59,130,246,0.07) 1px, transparent 0)', backgroundSize: '28px 28px' }} />
      <div style={{ position: 'absolute', top: '-100px', right: '-60px', width: '420px', height: '420px', background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-80px', left: '5%', width: '320px', height: '320px', background: 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', maxWidth: '1100px', margin: '0 auto', padding: 'clamp(32px, 5vw, 52px) clamp(16px, 4vw, 24px) clamp(36px, 5vw, 60px)' }}>

        {/* Eyebrow */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(59,130,246,0.09)', border: '1px solid rgba(59,130,246,0.22)', borderRadius: '100px', padding: '5px 14px', marginBottom: '16px' }}>
          <span style={{ width: '6px', height: '6px', background: '#3B82F6', borderRadius: '50%', display: 'inline-block' }} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#1D4ED8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>The Mutual Fund World · Built for every investor</span>
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: 'clamp(1.6rem, 5vw, 2.9rem)', fontWeight: 800, color: '#0F172A', lineHeight: 1.15, letterSpacing: '-0.025em', marginBottom: '12px', maxWidth: '680px' }}>
          Stop guessing which fund to pick.<br />
          <span style={{ background: 'linear-gradient(90deg, #2563EB 0%, #059669 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            We've done the homework.
          </span>
        </h1>
        <p style={{ fontSize: 'clamp(13px, 2vw, 15px)', color: '#475569', lineHeight: 1.7, maxWidth: '540px', marginBottom: '36px' }}>
          Our engine looks at every mutual fund available in India, groups them sensibly, scores them on real performance, and shows you the best one in each category — live, unbiased, and explained in full.
        </p>

        {/* How the engine works */}
        <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #E2E8F0', padding: 'clamp(16px, 3vw, 24px) clamp(16px, 3vw, 28px)', boxShadow: '0 4px 24px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '18px' }}>
            How it works — 3 simple steps
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            {[
              { step: '01', icon: '🗂️', title: 'Sort every fund', desc: 'We take all mutual funds in India and sort them by what type of company they invest in (big companies, mid-sized, small, mixed) and the investment style they use.', tags: ['Shares', 'Balanced', 'Bonds'], c: '#2563EB', bg: '#EFF6FF', bd: '#BFDBFE' },
              { step: '02', icon: '📊', title: 'Find who performs best', desc: 'For each slot, we compare fund types on how much extra return they delivered over the market — using real numbers, not opinions.', tags: ['Real returns', 'Vs market', 'No guesswork'], c: '#7C3AED', bg: '#F5F3FF', bd: '#DDD6FE' },
              { step: '03', icon: '🏆', title: 'Surface the #1 fund', desc: "The top-ranked fund in the winning category becomes your pick. Tap any slot to see exactly why it was chosen — full transparency.", tags: ['Top ranked', 'Full audit', 'Live data'], c: '#059669', bg: '#ECFDF5', bd: '#A7F3D0' },
            ].map((s, i) => (
              <div key={i} style={{ paddingRight: i < 2 ? 'clamp(0px, 2vw, 20px)' : '0', borderRight: i < 2 ? '1px dashed #E2E8F0' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: s.bg, border: `1px solid ${s.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>{s.icon}</div>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: s.c, letterSpacing: '0.1em' }}>STEP {s.step}</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#1F2937', marginBottom: '6px', lineHeight: 1.3 }}>{s.title}</div>
                <p style={{ fontSize: '11.5px', color: '#64748B', lineHeight: 1.65, marginBottom: '10px' }}>{s.desc}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {s.tags.map(t => <span key={t} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '100px', background: s.bg, color: s.c, border: `1px solid ${s.bd}`, fontWeight: 600 }}>{t}</span>)}
                </div>
              </div>
            ))}
          </div>

          {/* Trust bar */}
          <div style={{ display: 'flex', gap: 'clamp(16px, 3vw, 28px)', flexWrap: 'wrap', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #F1F5F9' }}>
            {[
              { v: '1,500+', l: 'Funds checked', c: '#2563EB' },
              { v: '3', l: 'Asset types covered', c: '#7C3AED' },
              { v: '0%', l: 'Human bias', c: '#059669' },
              { v: 'Live', l: 'Always up to date', c: '#D97706' },
              { v: 'All', l: 'Available history used', c: '#0891B2' },
            ].map((m, i) => (
              <div key={i}>
                <div style={{ fontSize: 'clamp(16px, 2.5vw, 18px)', fontWeight: 800, color: m.c, lineHeight: 1 }}>{m.v}</div>
                <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '3px', fontWeight: 500 }}>{m.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 3 clickable tab journey cards */}
        <div>
          <p style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
            Three ways to use this page
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>

            {/* Card 1 — Smart Fund Engine → /mutual-fund-match */}
            <a href="/mutual-fund-match" style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{ background: 'white', border: '2px solid #BFDBFE', borderRadius: '16px', padding: '18px 20px', position: 'relative', boxShadow: '0 4px 16px rgba(59,130,246,0.08)', cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 28px rgba(59,130,246,0.18)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(59,130,246,0.08)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}>
                <div style={{ position: 'absolute', top: -1, left: 18, background: '#2563EB', color: 'white', fontSize: '9px', fontWeight: 800, padding: '3px 10px', borderRadius: '0 0 8px 8px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>You are here</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px', marginBottom: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>🔬</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#1E3A8A' }}>Browse the full fund map</div>
                    <div style={{ fontSize: '10px', color: '#93C5FD', fontWeight: 600 }}>See every fund category, ranked</div>
                  </div>
                </div>
                <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.6, marginBottom: '10px' }}>
                  See the entire mutual fund universe organised into a clear map — shares, balanced, and bond funds — with the best pick highlighted in every slot. Tap any slot to understand why.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {['Share funds', 'Balanced funds', 'Bond funds', 'Full transparency'].map(t => <span key={t} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '100px', background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', fontWeight: 600 }}>{t}</span>)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <span style={{ fontSize: '11px', color: '#2563EB', fontWeight: 700 }}>Explore now →</span>
                </div>
              </div>
            </a>

            {/* Card 2 — Quick Fund Picks */}
            <a href="/find-my-fund-quick-picks" style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{ background: 'white', border: '1.5px solid #D1FAE5', borderRadius: '16px', padding: '18px 20px', boxShadow: '0 4px 16px rgba(16,185,129,0.06)', cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 28px rgba(16,185,129,0.14)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(16,185,129,0.06)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #F0FDF4, #D1FAE5)', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>⚡</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#065F46' }}>Find funds for your goal</div>
                    <div style={{ fontSize: '10px', color: '#6EE7B7', fontWeight: 600 }}>Tell us your situation, get a shortlist</div>
                  </div>
                </div>
                <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.6, marginBottom: '10px' }}>
                  Not sure what to look at? Tell us your risk comfort and how long you want to invest — and we'll pull out just the funds that make sense for you. No jargon, just a clean list.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {['Your risk level', 'Your timeline', 'Ready shortlist'].map(t => <span key={t} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '100px', background: '#F0FDF4', color: '#059669', border: '1px solid #A7F3D0', fontWeight: 600 }}>{t}</span>)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>Get my picks →</span>
                </div>
              </div>
            </a>

            {/* Card 3 — Lifetime Wealth Plan */}
            <a href="/find-my-fund-lifetime-plan" style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{ background: 'white', border: '1.5px solid #FDE68A', borderRadius: '16px', padding: '18px 20px', boxShadow: '0 4px 16px rgba(245,158,11,0.06)', cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 28px rgba(245,158,11,0.14)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(245,158,11,0.06)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)', border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>🌱</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#78350F' }}>Build a plan for life</div>
                    <div style={{ fontSize: '10px', color: '#FCD34D', fontWeight: 600 }}>From first SIP to a comfortable retirement</div>
                  </div>
                </div>
                <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.6, marginBottom: '10px' }}>
                  A portfolio that evolves with you — starting out, buying a home, having kids, retiring. Funds are drawn from the same engine and shift as your life stage changes.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {['Life stages', 'Monthly SIPs', 'Long-term growth'].map(t => <span key={t} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '100px', background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A', fontWeight: 600 }}>{t}</span>)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <span style={{ fontSize: '11px', color: '#B45309', fontWeight: 700 }}>Plan my wealth →</span>
                </div>
              </div>
            </a>

          </div>
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────
// MAIN PAGE
// ──────────────────────────────────────────────────────────────

export default function FindMyFundPage() {
  const rowDefs: GridDef = [
    { label: "Large Companies",    subtitle: "India's biggest, most stable businesses" },
    { label: "Mid-sized Companies", subtitle: "Growing fast, more opportunity" },
    { label: "Small Companies",    subtitle: "High risk, high reward potential" },
    { label: "Any Mix",            subtitle: "Fund manager picks the combination" },
  ];
  const colDefs: GridDef = [
    { label: "Value / Bargain",    subtitle: "Buy good businesses at a discount" },
    { label: "Steady Growth",      subtitle: "Reliable long-term compounders" },
    { label: "Momentum",           subtitle: "Ride what the market is favouring now" },
    { label: "Manager's Best Bets", subtitle: "Full freedom to the fund manager" },
  ];

  const [loading, setLoading]         = useState(true);
  const [equityBoxes, setEquityBoxes] = useState<BoxResult[][]>([]);
  const [modalBox, setModalBox]       = useState<BoxResult | null>(null);
  const [reportDate, setReportDate]   = useState<string>("");

  useEffect(() => {
    async function load() {
      try {
        const [amfiRaw, fundAnalytics, etfAnalytics, insights] = await Promise.all([
          fetch("/api/amfi-raw").then(r => r.json()),
          fetch("/api/funds").then(r => r.json()),
          fetch("/api/etfs").then(r => r.json()),
          fetch("/api/insights").then(r => r.json()),
        ]);
        if (amfiRaw.length > 0) setReportDate(amfiRaw[0].Report_Date);

        const gridMap: AMFIFund[][][] = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => []));
        for (const fund of amfiRaw as AMFIFund[]) {
          if (shouldExclude(fund)) continue;
          const col = getStyle(fund);
          const row = getSize(fund);
          if (row !== null) gridMap[row][col].push(fund);
        }

        const newBoxes: BoxResult[][] = [];
        for (let r = 0; r < 4; r++) {
          const rowBoxes: BoxResult[] = [];
          for (let c = 0; c < 4; c++) rowBoxes.push(buildBox(r, c, gridMap[r][c], fundAnalytics, etfAnalytics, insights));
          newBoxes.push(rowBoxes);
        }
        setEquityBoxes(newBoxes);
        setLoading(false);
      } catch (err) {
        console.error("Error loading data:", err);
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', color: '#1F2937' }}>

      {/* TOP NAV — matches AnalysisTabs pattern */}
      <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', position: 'relative', zIndex: 30 }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
          <AnalysisTabs />
        </div>
      </div>

      {/* HERO */}
      <HeroSection />

      {/* ── SHARE FUNDS (Equity) ── */}
      <section style={{ padding: 'clamp(20px, 4vw, 36px) clamp(12px, 3vw, 24px)' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 1px 8px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', padding: 'clamp(16px, 3vw, 28px) clamp(16px, 3vw, 32px)' }}>
            <SectionHeader num="1" title="Share Funds (Equity)" subtitle="Invests in company shares · Higher risk, higher potential over the long run" reportDate={reportDate} />
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px', lineHeight: 1.6 }}>
              Each slot below shows the best fund for that combination of <strong>company size</strong> and <strong>investment approach</strong>. Tap any slot to see why that fund was picked.
            </p>
            {loading ? <PlaceholderGrid rows={rowDefs} cols={colDefs} /> : (
              <SectionPanel rows={rowDefs} cols={colDefs} boxes={equityBoxes} onCellClick={box => setModalBox(box)} />
            )}
            <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748B' }}>
                <span style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '100px', background: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.2)', fontWeight: 700 }}>● ACTIVE</span>
                Fund manager picks stocks
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748B' }}>
                <span style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '100px', background: 'rgba(59,130,246,0.1)', color: '#2563EB', border: '1px solid rgba(59,130,246,0.2)', fontWeight: 700 }}>◆ INDEX</span>
                Tracks the market automatically
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>💡 Tap any slot to understand why that fund was chosen</div>
            </div>
          </div>
        </div>
      </section>

      {modalBox && <DetailModal box={modalBox} onClose={() => setModalBox(null)} />}

      <HybridMatrixSection reportDate={reportDate} />
      <DebtMatrixSection reportDate={reportDate} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// BALANCED FUNDS (Hybrid)
// ──────────────────────────────────────────────────────────────

function HybridMatrixSection({ reportDate }: { reportDate: string }) {
  const [loading, setLoading]         = React.useState(true);
  const [hybridBoxes, setHybridBoxes] = React.useState<BoxResult[]>([]);
  const [rowDefs, setRowDefs]         = React.useState<GridDef>([]);
  const [modalBox, setModalBox]       = React.useState<BoxResult | null>(null);

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      const [amfiRaw, fundAnalytics, etfAnalytics, insights] = await Promise.all([
        fetch("/api/amfi-raw").then(r => r.json()),
        fetch("/api/funds").then(r => r.json()),
        fetch("/api/etfs").then(r => r.json()),
        fetch("/api/insights").then(r => r.json()),
      ]);
      const hybridOrder = ["Aggressive Hybrid","Conservative Hybrid","Equity Savings","Arbitrage","Multi Asset Allocation","Balanced Advantage","Balanced Hybrid"];
      const hybridFunds = amfiRaw.filter((f: AMFIFund) => f.Category === "Hybrid");
      const bySubCat: Record<string, AMFIFund[]> = {};
      hybridFunds.forEach((f: AMFIFund) => { if (!bySubCat[f.Sub_Category]) bySubCat[f.Sub_Category] = []; bySubCat[f.Sub_Category].push(f); });
      const presentRows = hybridOrder.filter(s => bySubCat[s]);
      setRowDefs(presentRows.map(label => ({ label, subtitle: '' })));
      setHybridBoxes(presentRows.map((subCat, idx) => buildBox(idx, 0, bySubCat[subCat], fundAnalytics, etfAnalytics, insights)));
      setLoading(false);
    }
    load();
  }, []);

  return (
    <section style={{ padding: '0 clamp(12px, 3vw, 24px) clamp(20px, 4vw, 36px)' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 1px 8px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', padding: 'clamp(16px, 3vw, 28px) clamp(16px, 3vw, 32px)' }}>
          <SectionHeader num="2" title="Balanced Funds" subtitle="Mix of shares and bonds · Lower swings, steadier journey" reportDate={reportDate} />
          <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px', lineHeight: 1.6 }}>
            These funds blend shares and bonds in different proportions. Great if you want growth without the full ups-and-downs of a pure share fund. Tap any row for the full picture.
          </p>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[...Array(5)].map((_, i) => <div key={i} style={{ height: '56px', background: '#F1F5F9', borderRadius: '10px' }} />)}
            </div>
          ) : (
            <div style={{ borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '420px' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(90deg, #EFF6FF, #F0FDF4)' }}>
                    <th style={{ padding: '11px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 800, color: '#1E40AF', borderBottom: '1px solid #E2E8F0', width: '160px' }}>Fund Type</th>
                    <th style={{ padding: '11px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 800, color: '#065F46', borderBottom: '1px solid #E2E8F0' }}>Best Fund</th>
                    <th style={{ padding: '11px 14px', textAlign: 'center', fontSize: '11px', fontWeight: 800, color: '#374151', borderBottom: '1px solid #E2E8F0', width: '80px' }}>3Y Returns</th>
                    <th style={{ padding: '11px 14px', textAlign: 'center', fontSize: '11px', fontWeight: 800, color: '#374151', borderBottom: '1px solid #E2E8F0', width: '80px' }}>vs Market</th>
                    <th style={{ padding: '11px 14px', textAlign: 'center', fontSize: '11px', fontWeight: 800, color: '#374151', borderBottom: '1px solid #E2E8F0', width: '70px' }}>Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {rowDefs.map((row, idx) => {
                    const box = hybridBoxes[idx];
                    const fund = box?.selectedFund;
                    const fundName = fund ? ('Fund_Name' in fund ? fund.Fund_Name : fund.ETF_Name) : null;
                    const stats = box?.fundStats;
                    return (
                      <tr key={row.label}
                        style={{ borderBottom: idx < rowDefs.length - 1 ? '1px solid #F1F5F9' : 'none', cursor: 'pointer', background: 'white', transition: 'background 0.15s' }}
                        onClick={() => box && setModalBox(box)}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F0F9FF')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                      >
                        <td style={{ padding: '13px 14px', fontWeight: 700, color: '#374151', fontSize: '12px' }}>{row.label}</td>
                        <td style={{ padding: '13px 14px' }}>
                          {fundName ? (
                            <div>
                              <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '13px', lineHeight: 1.3 }}>{fundName}</div>
                              {box?.leadingSubCategory && <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>{box.leadingSubCategory}</div>}
                            </div>
                          ) : <span style={{ fontSize: '12px', color: '#CBD5E1' }}>No qualifying fund yet</span>}
                        </td>
                        <td style={{ padding: '13px 14px', textAlign: 'center', fontWeight: 700, color: '#1F2937', fontSize: '13px' }}>
                          {stats?.return3Y != null ? `${stats.return3Y.toFixed(1)}%` : '—'}
                        </td>
                        <td style={{ padding: '13px 14px', textAlign: 'center', fontWeight: 700, fontSize: '13px' }}>
                          {stats?.alpha3Y != null ? <span style={{ color: stats.alpha3Y > 0 ? '#059669' : '#DC2626' }}>{stats.alpha3Y > 0 ? '+' : ''}{stats.alpha3Y.toFixed(1)}%</span> : '—'}
                        </td>
                        <td style={{ padding: '13px 14px', textAlign: 'center' }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>{stats?.rank ? `#${stats.rank}` : '—'}</div>
                          <div style={{ fontSize: '9px', color: '#93C5FD', marginTop: '1px' }}>see why →</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {modalBox && <DetailModal box={modalBox} onClose={() => setModalBox(null)} />}
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────
// BOND FUNDS (Debt)
// ──────────────────────────────────────────────────────────────

function DebtMatrixSection({ reportDate }: { reportDate: string }) {
  const rowDefs: GridDef = [
    { label: "Very Short Term",    subtitle: "Park money safely for a few days to months" },
    { label: "1–3 Year Term",      subtitle: "Short investment period, stable returns" },
    { label: "3–5 Year Term",      subtitle: "Medium-term, slightly higher returns" },
    { label: "5 Years & Beyond",   subtitle: "Long-term bonds, more sensitive to interest rates" },
  ];
  const colDefs: GridDef = [
    { label: "Safest",             subtitle: "Govt bonds, AAA-rated companies" },
    { label: "Balanced Risk",      subtitle: "Mix of high and mid-rated bonds" },
    { label: "Higher Yield",       subtitle: "Lower-rated bonds, higher returns but more risk" },
  ];

  const [loading, setLoading]     = React.useState(true);
  const [debtBoxes, setDebtBoxes] = React.useState<BoxResult[][]>([]);
  const [modalBox, setModalBox]   = React.useState<BoxResult | null>(null);

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      const [amfiRaw, fundAnalytics, etfAnalytics, insights] = await Promise.all([
        fetch("/api/amfi-raw").then(r => r.json()),
        fetch("/api/funds").then(r => r.json()),
        fetch("/api/etfs").then(r => r.json()),
        fetch("/api/insights").then(r => r.json()),
      ]);
      const cellMap: Record<string, [number, number][]> = {
        "Overnight": [[0,0]], "Liquid": [[0,0]], "Ultra Short Duration": [[0,0]], "Money Market": [[0,0]],
        "Low Duration": [[1,0]], "Short Duration": [[1,0]], "Banking & PSU": [[1,0],[2,0]], "Corporate Bond": [[1,0],[2,0]],
        "Medium Duration": [[2,1]], "Gilt": [[2,0],[3,0]], "Long Duration": [[3,0]], "Dynamic Bond": [[3,0]],
        "Credit Risk": [[1,2],[2,2],[3,2]], "Medium to Long Duration": [[3,1]],
      };
      const gridMap: AMFIFund[][][] = Array.from({ length: 4 }, () => Array.from({ length: 3 }, () => []));
      for (const fund of amfiRaw as AMFIFund[]) {
        if (fund.Category !== "Debt") continue;
        if (cellMap[fund.Sub_Category]) cellMap[fund.Sub_Category].forEach(([r, c]) => gridMap[r][c].push(fund));
      }
      const newBoxes: BoxResult[][] = [];
      for (let r = 0; r < 4; r++) {
        const row: BoxResult[] = [];
        for (let c = 0; c < 3; c++) row.push(buildBox(r, c, gridMap[r][c], fundAnalytics, etfAnalytics, insights));
        newBoxes.push(row);
      }
      setDebtBoxes(newBoxes);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <section style={{ padding: '0 clamp(12px, 3vw, 24px) clamp(40px, 6vw, 64px)' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 1px 8px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', padding: 'clamp(16px, 3vw, 28px) clamp(16px, 3vw, 32px)' }}>
          <SectionHeader num="3" title="Bond Funds (Debt)" subtitle="Invests in government & corporate bonds · Stable, lower-risk income" reportDate={reportDate} />
          <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px', lineHeight: 1.6 }}>
            Bond funds lend your money to the government or companies in exchange for regular interest. How long you lend (term) and who you lend to (safety) determines the return. Tap any slot for details.
          </p>
          {loading ? <PlaceholderGrid rows={rowDefs} cols={colDefs} /> : (
            <SectionPanel rows={rowDefs} cols={colDefs} boxes={debtBoxes} onCellClick={box => setModalBox(box)} />
          )}
          {modalBox && <DetailModal box={modalBox} onClose={() => setModalBox(null)} />}
        </div>
      </div>
    </section>
  );
}