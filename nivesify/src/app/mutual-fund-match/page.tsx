"use client";

import AnalysisTabs from "@/components/AnalysisTabs";
import FindMyFundTabs from "@/components/FindMyFundTabs";
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
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F0FDF4', border: '1px solid #A7F3D0', borderRadius: '100px', padding: '4px 12px' }}>
      <span style={{ width: '6px', height: '6px', background: '#10B981', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
      <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>Live · {date}</span>
    </div>
  );
}

function SectionHeader({ num, title, subtitle, reportDate }: { num: string; title: string; subtitle: string; reportDate?: string }) {
  return (
    <div className="flex items-start justify-between flex-wrap gap-3 mb-2">
      <div className="flex items-center gap-3">
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #3B82F6, #2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '16px', flexShrink: 0, boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
          {num}
        </div>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.2 }}>{title}</h2>
          <p style={{ fontSize: '12px', color: '#94A3B8', margin: '2px 0 0', fontWeight: 500 }}>{subtitle}</p>
        </div>
      </div>
      {reportDate && <LiveBadge date={reportDate} />}
    </div>
  );
}

function PlaceholderGrid({ rows, cols }: { rows: GridDef; cols: GridDef }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
      <table className="w-full border-collapse min-w-[480px] text-xs">
        <thead>
          <tr>
            <th className="p-4 w-36 bg-[#F8FAFC] border-b border-r border-[#E2E8F0]" />
            {cols.map((c, i) => (
              <th key={i} className="p-4 text-center border-b border-r border-[#E2E8F0] last:border-r-0" style={{ background: 'linear-gradient(180deg, #EFF6FF, #DBEAFE)' }}>
                <div style={{ fontWeight: 700, color: '#1E40AF', fontSize: '11px' }}>{c.label}</div>
                <div style={{ fontSize: '10px', color: '#93C5FD', marginTop: '2px' }}>{c.subtitle}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#FAFAFA]"}>
              <th className="p-4 text-left bg-[#F8FAFC] border-b border-r border-[#E2E8F0]">
                <div style={{ fontWeight: 700, fontSize: '12px', color: '#374151' }}>{r.label}</div>
                <div style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 400, marginTop: '2px', lineHeight: 1.3 }}>{r.subtitle}</div>
              </th>
              {cols.map((_, j) => (
                <td key={j} className="p-4 border-b border-r border-[#E2E8F0] last:border-r-0">
                  <div className="animate-pulse space-y-2">
                    <div className="h-2.5 bg-[#E5E7EB] rounded-full w-3/4" />
                    <div className="h-2 bg-[#F1F5F9] rounded-full w-1/2" />
                    <div className="h-2 bg-[#F1F5F9] rounded-full w-2/3" />
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
      <div onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 8px', gap: '4px', cursor: 'pointer', color: '#CBD5E1' }}
        className="group hover:text-[#94A3B8] transition-colors">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2"/></svg>
        <span style={{ fontSize: '9px', color: '#CBD5E1' }} className="group-hover:text-[#3B82F6] transition-colors">No data · click for details</span>
      </div>
    );
  }

  const fund = box.selectedFund;
  if (!fund) return null;
  const fundName = 'Fund_Name' in fund ? fund.Fund_Name : fund.ETF_Name;
  const isActive = box.decision === "ACTIVE";
  const stats = box.fundStats;

  return (
    <div onClick={onClick} style={{ cursor: 'pointer' }} className="group">
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
        <span style={{
          fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', letterSpacing: '0.05em',
          background: isActive ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)',
          color: isActive ? '#059669' : '#2563EB',
          border: `1px solid ${isActive ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)'}`,
        }}>
          {isActive ? '● ACTIVE' : '◆ INDEX'}
        </span>
      </div>
      <div style={{ fontSize: '11px', fontWeight: 800, color: '#1E3A5F', lineHeight: 1.3, marginBottom: '3px' }}>
        {box.leadingSubCategory}
      </div>
      <div style={{ fontSize: '10px', color: '#6B7280', lineHeight: 1.4, marginBottom: '5px' }} className="group-hover:text-[#374151] transition-colors">
        {fundName.length > 40 ? fundName.substring(0, 38) + '…' : fundName}
      </div>
      {stats && (
        <div style={{ fontSize: '9px', color: '#94A3B8', lineHeight: 1.7 }}>
          <span style={{ color: stats.alpha3Y && stats.alpha3Y > 0 ? '#10B981' : '#EF4444', fontWeight: 700 }}>
            α{stats.alpha3Y && stats.alpha3Y > 0 ? '+' : ''}{stats.alpha3Y?.toFixed(1)}%
          </span>
          {' · '}3Y {stats.return3Y?.toFixed(1)}%
          {stats.return5Y ? ` · 5Y ${stats.return5Y.toFixed(1)}%` : ''}
          <div>Rank #{stats.rank} · ₹{(stats.aum / 1000).toFixed(0)}K Cr</div>
        </div>
      )}
      <div style={{ fontSize: '9px', color: '#93C5FD', marginTop: '4px', opacity: 0 }} className="group-hover:opacity-100 transition-opacity">
        View full audit →
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// DETAIL MODAL — full data, refined UI
// ──────────────────────────────────────────────────────────────

function DetailModal({ box, onClose }: { box: BoxResult; onClose: () => void }) {
  if (box.empty) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }} onClick={onClose}>
        <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 32px 80px rgba(0,0,0,0.15)', maxWidth: '520px', width: '100%', border: '1px solid #E2E8F0' }} onClick={e => e.stopPropagation()}>
          <div style={{ padding: '24px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontWeight: 700, fontSize: '18px', color: '#0F172A', margin: 0 }}>Why is this cell empty?</h2>
            <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: '#F1F5F9', color: '#64748B', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '20px' }}>
              <p style={{ fontSize: '13px', color: '#92400E', fontWeight: 600, marginBottom: '10px' }}>No fund qualifies because:</p>
              <ul style={{ fontSize: '13px', color: '#78350F', paddingLeft: 0, listStyle: 'none', margin: 0 }}>
                {['Must have 3+ years of performance history', 'Must match both the size and investment style', 'Must have sufficient track record for reliable analysis'].map((s, i) => (
                  <li key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ color: '#F59E0B', flexShrink: 0 }}>•</span>{s}
                  </li>
                ))}
              </ul>
            </div>
            {box.allConsideredSubCategories.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>We still evaluated {box.allConsideredSubCategories.length} sub-categories:</p>
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 32px 80px rgba(0,0,0,0.15)', maxWidth: '860px', width: '100%', maxHeight: '92vh', overflowY: 'auto', border: '1px solid #E2E8F0' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ position: 'sticky', top: 0, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(8px)', padding: '20px 28px', borderBottom: '1px solid #F1F5F9', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{
                  fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '100px', letterSpacing: '0.06em',
                  background: isActive ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)',
                  color: isActive ? '#059669' : '#2563EB',
                  border: `1px solid ${isActive ? 'rgba(16,185,129,0.25)' : 'rgba(59,130,246,0.25)'}`,
                }}>
                  {isActive ? '● ACTIVE FUND' : '◆ INDEX FUND'}
                </span>
                <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>Full Selection Audit</span>
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: '0 0 4px', lineHeight: 1.2 }}>{fundName}</h2>
              <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
                Category: <strong style={{ color: '#374151' }}>{box.leadingSubCategory}</strong>
                {' · '}{box.candidateSubCategories.length} sub-categories evaluated
              </p>
            </div>
            <button onClick={onClose} style={{ width: '36px', height: '36px', borderRadius: '10px', border: 'none', background: '#F1F5F9', color: '#64748B', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
          </div>
        </div>

        <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {/* Stats grid */}
          {box.fundStats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
              {[
                { label: '3Y Return', value: `${box.fundStats.return3Y?.toFixed(2)}%`, color: '#0F172A' },
                { label: '5Y Return', value: box.fundStats.return5Y ? `${box.fundStats.return5Y.toFixed(2)}%` : '—', color: '#0F172A' },
                { label: 'Alpha (3Y)', value: `${box.fundStats.alpha3Y && box.fundStats.alpha3Y > 0 ? '+' : ''}${box.fundStats.alpha3Y?.toFixed(2)}%`, color: box.fundStats.alpha3Y && box.fundStats.alpha3Y > 0 ? '#059669' : '#DC2626' },
                { label: 'Rank in Category', value: `#${box.fundStats.rank}`, color: '#0F172A' },
                { label: 'AUM', value: `₹${(box.fundStats.aum / 1000).toFixed(1)}K Cr`, color: '#0F172A' },
              ].map((s, i) => (
                <div key={i} style={{ background: '#F8FAFC', borderRadius: '12px', padding: '14px 16px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px', fontWeight: 500 }}>{s.label}</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Why this fund */}
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '14px', padding: '18px 20px', display: 'flex', gap: '12px' }}>
            <span style={{ fontSize: '22px', flexShrink: 0 }}>💡</span>
            <div>
              <h3 style={{ fontWeight: 700, color: '#1E40AF', fontSize: '14px', margin: '0 0 6px' }}>Why this fund?</h3>
              <p style={{ fontSize: '13px', color: '#1E3A8A', margin: 0, lineHeight: 1.6 }}>
                Among <strong>{box.candidateSubCategories.length}</strong> competing sub-categories for this cell,{' '}
                <strong>{box.leadingSubCategory}</strong> delivered the highest average alpha against its benchmark.
                Within that sub-category, this fund ranked <strong>#{box.fundStats?.rank}</strong> — making it the data-driven #1 pick with no manual override.
              </p>
            </div>
          </div>

          {/* All sub-categories considered */}
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '12px' }}>
              All {box.allConsideredSubCategories.length} sub-categories mapped to this cell
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
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
            <p style={{ fontSize: '11px', color: '#94A3B8' }}>Blue = had 3+ year performance history and entered the comparison</p>
          </div>

          {/* Head-to-head */}
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '12px' }}>
              Head-to-head: {box.candidateSubCategories.length} categories ranked by Alpha
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[...box.candidateSubCategories].sort((a, b) => b.avgAlpha - a.avgAlpha).map((subCat, i) => {
                const isWinner = subCat.subCategoryName === box.leadingSubCategory;
                return (
                  <div key={i} style={{
                    borderRadius: '12px', padding: '14px 18px', border: `1px solid ${isWinner ? '#A7F3D0' : '#E2E8F0'}`,
                    background: isWinner ? '#ECFDF5' : '#F8FAFC',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '13px', color: '#1F2937' }}>{subCat.subCategoryName}</span>
                        {isWinner && <span style={{ fontSize: '10px', background: '#059669', color: 'white', padding: '2px 8px', borderRadius: '100px', fontWeight: 700 }}>WINNER</span>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>Avg Alpha</div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: subCat.avgAlpha > 0 ? '#059669' : '#DC2626' }}>
                          {subCat.avgAlpha > 0 ? '+' : ''}{subCat.avgAlpha.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: '#64748B' }}>
                      <span>{subCat.fundCount} fund{subCat.fundCount > 1 ? 's' : ''} · 3Y history</span>
                      <span>Beat rate: <strong style={{ color: '#374151' }}>{subCat.avgBeatRate.toFixed(0)}%</strong></span>
                      <span className="hidden sm:inline">Top: <strong style={{ color: '#374151' }}>{subCat.topFundName.substring(0, 32)}{subCat.topFundName.length > 32 ? '…' : ''}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Methodology */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '18px 20px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#374151', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>📐</span> How we selected this fund — 4 steps
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
              {[
                'Filter all funds matching this cell\'s market cap + investment style',
                'Group by sub-category, compute avg 3Y alpha & benchmark beat rate',
                'Select the sub-category with the highest average alpha',
                'Within the winner, pick the best-ranked fund with 3Y+ history',
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
// SECTION PANEL (table renderer)
// ──────────────────────────────────────────────────────────────

function SectionPanel({ rows, cols, boxes, onCellClick }: {
  rows: GridDef; cols: GridDef; boxes: BoxResult[][]; onCellClick: (box: BoxResult) => void;
}) {
  return (
    <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '520px', fontSize: '12px' }}>
        <thead>
          <tr>
            <th style={{ padding: '14px 16px', width: '148px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0' }} />
            {cols.map((c, i) => (
              <th key={i} style={{ padding: '12px 14px', textAlign: 'center', background: 'linear-gradient(180deg, #EFF6FF 0%, #DBEAFE 100%)', borderBottom: '1px solid #BFDBFE', borderRight: i < cols.length - 1 ? '1px solid #DBEAFE' : 'none' }}>
                <div style={{ fontWeight: 800, color: '#1E40AF', fontSize: '11px' }}>{c.label}</div>
                <div style={{ fontSize: '10px', color: '#60A5FA', fontWeight: 500, marginTop: '2px' }}>{c.subtitle}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, rowIdx) => (
            <tr key={rowIdx}>
              <th style={{ padding: '14px 16px', textAlign: 'left', background: '#F8FAFC', borderBottom: rowIdx < rows.length - 1 ? '1px solid #E2E8F0' : 'none', borderRight: '1px solid #E2E8F0', verticalAlign: 'top' }}>
                <div style={{ fontWeight: 800, fontSize: '12px', color: '#374151' }}>{r.label}</div>
                <div style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 400, marginTop: '3px', lineHeight: 1.4 }}>{r.subtitle}</div>
              </th>
              {cols.map((_, colIdx) => (
                <td key={colIdx}
                  style={{ padding: '12px 14px', borderBottom: rowIdx < rows.length - 1 ? '1px solid #F1F5F9' : 'none', borderRight: colIdx < cols.length - 1 ? '1px solid #F1F5F9' : 'none', verticalAlign: 'top', background: 'white', cursor: 'pointer', transition: 'background 0.15s' }}
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
// HERO — premium light theme, storytelling flow
// ──────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section style={{
      background: 'linear-gradient(155deg, #EFF6FF 0%, #F0FDF4 45%, #FFFBEB 100%)',
      borderBottom: '1px solid #E2E8F0',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Dot grid texture */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(59,130,246,0.07) 1px, transparent 0)',
        backgroundSize: '28px 28px',
      }} />
      {/* Soft glow blobs */}
      <div style={{ position: 'absolute', top: '-100px', right: '-60px', width: '420px', height: '420px', background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-80px', left: '5%', width: '320px', height: '320px', background: 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', maxWidth: '1100px', margin: '0 auto', padding: '52px 24px 60px' }}>

        {/* Eyebrow */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(59,130,246,0.09)', border: '1px solid rgba(59,130,246,0.22)', borderRadius: '100px', padding: '5px 14px', marginBottom: '18px' }}>
          <span style={{ width: '6px', height: '6px', background: '#3B82F6', borderRadius: '50%', display: 'inline-block' }} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#1D4ED8', letterSpacing: '0.09em', textTransform: 'uppercase' }}>The Mutual Fund World · Powered by Data</span>
        </div>

        {/* Headline + sub */}
        <h1 style={{ fontSize: 'clamp(1.85rem, 4vw, 2.9rem)', fontWeight: 800, color: '#0F172A', lineHeight: 1.15, letterSpacing: '-0.025em', marginBottom: '14px', maxWidth: '680px' }}>
          One page. Every fund.<br />
          <span style={{ background: 'linear-gradient(90deg, #2563EB 0%, #059669 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Zero guesswork.
          </span>
        </h1>
        <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.7, maxWidth: '540px', marginBottom: '44px' }}>
          A scientific engine that maps 1,500+ Indian mutual funds into clear matrices — and surfaces the single best fund for every risk-style combination, live and fully transparent.
        </p>

        {/* ── HOW THE ENGINE WORKS ── */}
        <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '24px 28px 28px', boxShadow: '0 4px 24px rgba(0,0,0,0.05)', marginBottom: '28px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '20px' }}>
            How the engine works — 3 steps
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0' }}>
            {[
              { step: '01', icon: '🗂️', title: 'Map the universe', desc: 'Every AMFI fund classified by asset class, market cap, and style — Equity, Hybrid, Debt — into a scientific matrix.', tags: ['Equity 4×4', 'Hybrid 7-row', 'Debt 4×3'], c: '#2563EB', bg: '#EFF6FF', bd: '#BFDBFE' },
              { step: '02', icon: '📊', title: 'Find the best category', desc: 'Sub-categories compete on real 3Y alpha and benchmark-beating rate. The winner is purely data-driven — zero hardcoding.', tags: ['3Y Alpha', 'Beat Rate', 'No Bias'], c: '#7C3AED', bg: '#F5F3FF', bd: '#DDD6FE' },
              { step: '03', icon: '🏆', title: 'Surface the #1 fund', desc: "Best-ranked fund in the winning category becomes your pick — with rank, AUM, returns, and a full clickable audit trail.", tags: ['Rank #1', 'Full Audit', 'Live Data'], c: '#059669', bg: '#ECFDF5', bd: '#A7F3D0' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '0 22px', borderRight: i < 2 ? '1px dashed #E2E8F0' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: s.bg, border: `1px solid ${s.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', flexShrink: 0 }}>{s.icon}</div>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: s.c, letterSpacing: '0.1em' }}>STEP {s.step}</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#1F2937', marginBottom: '7px', lineHeight: 1.3 }}>{s.title}</div>
                <p style={{ fontSize: '11.5px', color: '#64748B', lineHeight: 1.65, marginBottom: '10px' }}>{s.desc}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {s.tags.map(t => <span key={t} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '100px', background: s.bg, color: s.c, border: `1px solid ${s.bd}`, fontWeight: 600 }}>{t}</span>)}
                </div>
              </div>
            ))}
          </div>

          {/* Trust bar */}
          <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap', marginTop: '22px', paddingTop: '18px', borderTop: '1px solid #F1F5F9' }}>
            {[
              { v: '1,500+', l: 'Funds analysed', c: '#2563EB' },
              { v: '3', l: 'Asset classes', c: '#7C3AED' },
              { v: '0%', l: 'Bias / hardcoding', c: '#059669' },
              { v: 'Live', l: 'Always updated', c: '#D97706' },
              { v: '3Y+', l: 'Track record required', c: '#0891B2' },
            ].map((m, i) => (
              <div key={i}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: m.c, lineHeight: 1 }}>{m.v}</div>
                <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '3px', fontWeight: 500 }}>{m.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 3 TAB JOURNEY CARDS ── */}
        <div style={{ marginBottom: '4px' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>
            Your 3-tab journey on this page
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '14px' }}>

            {/* Tab 1 */}
            <div style={{ background: 'white', border: '2px solid #BFDBFE', borderRadius: '16px', padding: '20px 22px', position: 'relative', boxShadow: '0 4px 16px rgba(59,130,246,0.08)' }}>
              <div style={{ position: 'absolute', top: -1, left: 18, background: '#2563EB', color: 'white', fontSize: '9px', fontWeight: 800, padding: '3px 10px', borderRadius: '0 0 8px 8px', letterSpacing: '0.07em', textTransform: 'uppercase' }}>You are here</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', marginBottom: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '11px', background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '19px', flexShrink: 0 }}>🔬</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#1E3A8A' }}>Smart Fund Engine</div>
                  <div style={{ fontSize: '10px', color: '#93C5FD', fontWeight: 600 }}>Tab 1 · Browse all matrices</div>
                </div>
              </div>
              <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.6, marginBottom: '12px' }}>
                The full scientific matrix. Browse every cell across Equity, Hybrid, and Debt. See exactly which fund the engine picked and why — with a full audit on every cell.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {['Equity 4×4', 'Hybrid 7-row', 'Debt 4×3', 'Click-through Audit'].map(t => <span key={t} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '100px', background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', fontWeight: 600 }}>{t}</span>)}
              </div>
            </div>

            {/* Tab 2 */}
            <div style={{ background: 'white', border: '1.5px solid #D1FAE5', borderRadius: '16px', padding: '20px 22px', boxShadow: '0 4px 16px rgba(16,185,129,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '11px', background: 'linear-gradient(135deg, #F0FDF4, #D1FAE5)', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '19px', flexShrink: 0 }}>⚡</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#065F46' }}>Quick Fund Picks</div>
                  <div style={{ fontSize: '10px', color: '#6EE7B7', fontWeight: 600 }}>Tab 2 · Personalised shortlist</div>
                </div>
              </div>
              <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.6, marginBottom: '12px' }}>
                Tell us your risk appetite and investment horizon. We map you to the right matrix cells and give you a ready-to-invest shortlist — no complexity, just clarity.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {['Risk Profile', 'Instant Shortlist', 'Curated Picks'].map(t => <span key={t} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '100px', background: '#F0FDF4', color: '#059669', border: '1px solid #A7F3D0', fontWeight: 600 }}>{t}</span>)}
              </div>
            </div>

            {/* Tab 3 */}
            <div style={{ background: 'white', border: '1.5px solid #FDE68A', borderRadius: '16px', padding: '20px 22px', boxShadow: '0 4px 16px rgba(245,158,11,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '11px', background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)', border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '19px', flexShrink: 0 }}>🌱</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#78350F' }}>Lifetime Wealth Plan</div>
                  <div style={{ fontSize: '10px', color: '#FCD34D', fontWeight: 600 }}>Tab 3 · The long game</div>
                </div>
              </div>
              <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.6, marginBottom: '12px' }}>
                A life-stage portfolio blueprint — from first SIP to retirement. Funds sourced from the same engine, evolving as your life does. The full wealth journey in one place.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {['Life Stages', 'SIP Planning', 'Goal Mapping', 'Rebalancing'].map(t => <span key={t} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '100px', background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A', fontWeight: 600 }}>{t}</span>)}
              </div>
            </div>

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
    { label: "Large Cap",          subtitle: "India's biggest & most stable" },
    { label: "Mid Cap",            subtitle: "Fast-growing challengers" },
    { label: "Small Cap",          subtitle: "High-risk, high-reward" },
    { label: "Flexi / Multi Cap",  subtitle: "Manager decides the mix" },
  ];
  const colDefs: GridDef = [
    { label: "Value & Contra",   subtitle: "Buy quality on discount" },
    { label: "Growth / Core",    subtitle: "Steady compounders" },
    { label: "Momentum",         subtitle: "Ride what's winning now" },
    { label: "Pure Active",      subtitle: "Fund manager's best picks" },
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

      {/* MAIN NAV */}
      <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', position: 'relative', zIndex: 30 }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ marginTop: '32px' }}>
              <AnalysisTabs />
            </div>
          </div>
        </div>
      </div>

      {/* HERO */}
      <HeroSection />

      {/* STICKY SUB-TABS */}
      <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 24px' }}>
          <FindMyFundTabs />
        </div>
      </div>

      {/* ── EQUITY MATRIX ── */}
      <section style={{ padding: '36px 24px' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 1px 8px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', padding: '28px 32px' }}>
            <SectionHeader num="1" title="Equity Mutual Funds" subtitle="4×4 matrix · Market Cap × Investment Style" reportDate={reportDate} />
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px', lineHeight: 1.6 }}>
              The full equity matrix — <strong>4 sizes × 4 styles = 16 cells</strong>. Each cell shows the best-fit sub-category and its #1 ranked fund, data-driven. Click any cell for the full audit.
            </p>
            {loading ? <PlaceholderGrid rows={rowDefs} cols={colDefs} /> : (
              <SectionPanel rows={rowDefs} cols={colDefs} boxes={equityBoxes} onCellClick={box => setModalBox(box)} />
            )}
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748B' }}>
                <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '100px', background: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.2)', fontWeight: 700 }}>● ACTIVE</span>
                Actively managed
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748B' }}>
                <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '100px', background: 'rgba(59,130,246,0.1)', color: '#2563EB', border: '1px solid rgba(59,130,246,0.2)', fontWeight: 700 }}>◆ INDEX</span>
                Index / ETF
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>💡 Click any cell to see exactly why that fund was chosen</div>
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
// HYBRID MATRIX
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
    <section style={{ padding: '0 24px 36px' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 1px 8px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', padding: '28px 32px' }}>
          <SectionHeader num="2" title="Hybrid Mutual Funds" subtitle="Best-in-class fund for each hybrid sub-category" reportDate={reportDate} />
          <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px', lineHeight: 1.6 }}>
            Hybrid funds blend equity and debt in varying proportions. The engine picks the #1 fund for each strategy. Click any row for the full audit.
          </p>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[...Array(5)].map((_, i) => <div key={i} style={{ height: '60px', background: '#F1F5F9', borderRadius: '10px', animation: 'pulse 1.5s infinite' }} />)}
            </div>
          ) : (
            <div style={{ borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(90deg, #EFF6FF, #F0FDF4)' }}>
                    {['Hybrid Category', 'Best Fund Selected by Engine', '3Y Return', 'Alpha (3Y)', 'Rank'].map((h, i) => (
                      <th key={i} style={{ padding: '12px 16px', textAlign: i === 0 ? 'left' : i === 1 ? 'left' : 'center', fontSize: '11px', fontWeight: 800, color: i === 0 ? '#1E40AF' : i === 1 ? '#065F46' : '#374151', borderBottom: '1px solid #E2E8F0', width: i === 0 ? '180px' : i === 1 ? 'auto' : '90px' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rowDefs.map((row, idx) => {
                    const box = hybridBoxes[idx];
                    const fund = box?.selectedFund;
                    const fundName = fund ? ('Fund_Name' in fund ? fund.Fund_Name : fund.ETF_Name) : null;
                    const stats = box?.fundStats;
                    return (
                      <tr key={row.label} style={{ borderBottom: idx < rowDefs.length - 1 ? '1px solid #F1F5F9' : 'none', cursor: 'pointer', background: 'white', transition: 'background 0.15s' }}
                        onClick={() => box && setModalBox(box)}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F0F9FF')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                      >
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#374151', fontSize: '13px' }}>{row.label}</td>
                        <td style={{ padding: '14px 16px' }}>
                          {fundName ? (
                            <div>
                              <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '13px' }}>{fundName}</div>
                              {box?.leadingSubCategory && <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>{box.leadingSubCategory}</div>}
                            </div>
                          ) : <span style={{ fontSize: '12px', color: '#CBD5E1' }}>No qualifying fund</span>}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, color: '#1F2937' }}>
                          {stats?.return3Y != null ? `${stats.return3Y.toFixed(1)}%` : '—'}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700 }}>
                          {stats?.alpha3Y != null ? <span style={{ color: stats.alpha3Y > 0 ? '#059669' : '#DC2626' }}>{stats.alpha3Y > 0 ? '+' : ''}{stats.alpha3Y.toFixed(1)}%</span> : '—'}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>{stats?.rank ? `#${stats.rank}` : '—'}</div>
                          <div style={{ fontSize: '9px', color: '#93C5FD', marginTop: '2px' }}>view audit →</div>
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
// DEBT MATRIX
// ──────────────────────────────────────────────────────────────

function DebtMatrixSection({ reportDate }: { reportDate: string }) {
  const rowDefs: GridDef = [
    { label: "Ultra Short (0–1Y)",     subtitle: "Overnight, Liquid, Ultra Short, Money Market" },
    { label: "Short Duration (1–3Y)",  subtitle: "Low Duration, Short Duration, Banking & PSU, Corporate Bond" },
    { label: "Medium Duration (3–5Y)", subtitle: "Corporate Bond, Banking & PSU, Gilt (Medium)" },
    { label: "Long Duration (5Y+)",    subtitle: "Gilt, Long Duration, Dynamic Bond" },
  ];
  const colDefs: GridDef = [
    { label: "High Credit Quality",     subtitle: "AAA, Gilt, PSU" },
    { label: "Medium Credit Risk",      subtitle: "AA Mix, Medium Duration" },
    { label: "Yield / Credit Strategy", subtitle: "Credit Risk, Long Tenor" },
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
    <section style={{ padding: '0 24px 64px' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 1px 8px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', padding: '28px 32px' }}>
          <SectionHeader num="3" title="Debt Mutual Funds" subtitle="4×3 matrix · Interest Rate Risk × Credit Risk" reportDate={reportDate} />
          <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px', lineHeight: 1.6 }}>
            Debt funds mapped across <strong>duration risk × credit risk</strong>. Best fund for each cell, fully data-driven. Click any cell for the selection audit.
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