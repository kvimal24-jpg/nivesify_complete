"use client";

import React, { useState, useEffect, useRef } from "react";
import { fetchCachedJson } from "@/lib/client-data";
import { selectFundsForGoal } from "@/lib/fund-selection-engine";

// ─────────────────────────────────────────────────────────────────────────────
// SHARED HERO NAVIGATION — identical shell used by all 3 planning pages
// ─────────────────────────────────────────────────────────────────────────────

const MF_TABS = [
  { label: "Why Mutual Funds",     href: "/why-mutual-fund",        active: false },
  { label: "Smart Fund Finder",    href: "/mutual-fund-match",      active: true  },
  { label: "MF Industry Analysis", href: "/mutual-fund-analysis",   active: false },
  { label: "Active Funds",         href: "/active-funds",           active: false },
  { label: "Passive Funds",        href: "/index-funds",            active: false },
];

const PLANNING_TOOLS = [
  { label: "Smart Fund Finder", href: "/mutual-fund-match",          emoji: "🔍", desc: "Best fund in every category"  },
  { label: "Quick Goal Picks",  href: "/find-my-fund-quick-picks",   emoji: "⚡", desc: "Fund plan for one goal"        },
  { label: "Lifetime Plan",     href: "/find-my-fund-lifetime-plan", emoji: "🌱", desc: "All goals, one portfolio"      },
];

function MFWorldTabs({ activePage }: { activePage: string }) {
  return (
    <div style={{
      display: "flex", gap: "4px", overflowX: "auto",
      WebkitOverflowScrolling: "touch", scrollbarWidth: "none",
      msOverflowStyle: "none", paddingBottom: "2px",
    }}>
      {MF_TABS.map((tab) => {
        const isActive = tab.href === activePage;
        return (
          <a key={tab.href} href={tab.href} style={{
            flexShrink: 0, textDecoration: "none",
            padding: "6px 14px", borderRadius: "100px",
            fontSize: "12px", fontWeight: isActive ? 700 : 500,
            color: isActive ? "#3B82F6" : "rgba(255,255,255,0.6)",
            background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
            border: isActive ? "1px solid rgba(255,255,255,0.25)" : "1px solid transparent",
            transition: "all 0.2s", whiteSpace: "nowrap", letterSpacing: "0.01em",
          }}
            onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.9)"; (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.07)"; } }}
            onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.6)"; (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; } }}
          >{tab.label}</a>
        );
      })}
    </div>
  );
}

function PlanningToolsStrip({ activeTool }: { activeTool: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
      <span style={{
        fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.35)",
        letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap",
      }}>Fund Planning Tools</span>
      <div style={{ width: "1px", height: "14px", background: "rgba(255,255,255,0.12)" }} />
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {PLANNING_TOOLS.map((tool) => {
          const isActive = tool.href === activeTool;
          return (
            <a key={tool.href} href={tool.href} style={{
              display: "flex", alignItems: "center", gap: "6px",
              textDecoration: "none", padding: "5px 12px", borderRadius: "100px",
              fontSize: "11px", fontWeight: isActive ? 700 : 500,
              color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.55)",
              background: isActive ? "rgba(59,130,246,0.25)" : "rgba(255,255,255,0.05)",
              border: isActive ? "1px solid rgba(59,130,246,0.45)" : "1px solid rgba(255,255,255,0.1)",
              transition: "all 0.2s", whiteSpace: "nowrap",
            }}
              onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.85)"; (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.1)"; } }}
              onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.55)"; (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.05)"; } }}
            >
              <span style={{ fontSize: "12px" }}>{tool.emoji}</span>
              {tool.label}
              {isActive && (
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#3B82F6" }} />
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
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
// HELPERS
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
// TWO-TIER SELECTION
// ──────────────────────────────────────────────────────────────

function buildBox(
  row: number, col: number, cellFunds: AMFIFund[],
  fundAnalytics: FundAnalytics[], etfAnalytics: ETFAnalytics[], insights: InsightRow[]
): BoxResult {
  return selectFundsForGoal(row, col, cellFunds, fundAnalytics, etfAnalytics, insights);

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
          <h2 style={{ fontSize: 'clamp(15px, 2.5vw, 20px)', fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.2 }}>{title}</h2>
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
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '380px', fontSize: '12px' }}>
        <thead>
          <tr>
            <th style={{ padding: '12px', width: '110px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0' }} />
            {cols.map((c, i) => (
              <th key={i} style={{ padding: '10px 12px', textAlign: 'center', background: 'linear-gradient(180deg, #EFF6FF, #DBEAFE)', borderBottom: '1px solid #BFDBFE', borderRight: i < cols.length - 1 ? '1px solid #DBEAFE' : 'none', minWidth: '110px' }}>
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
      <div style={{ fontSize: '10px', fontWeight: 800, color: '#1E3A5F', lineHeight: 1.3, marginBottom: '3px' }}>{box.leadingSubCategory}</div>
      <div style={{ fontSize: '9px', color: '#6B7280', lineHeight: 1.4, marginBottom: '4px' }}>{fundName.length > 36 ? fundName.substring(0, 34) + '…' : fundName}</div>
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
      <div style={{ fontSize: '9px', color: '#93C5FD', marginTop: '3px' }}>Tap to see why →</div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// DETAIL MODAL
// ──────────────────────────────────────────────────────────────

function DetailModal({ box, onClose }: { box: BoxResult; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (box.empty) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50, padding: '0' }}
        onClick={onClose}>
        <div style={{ background: 'white', borderRadius: '20px 20px 0 0', boxShadow: '0 -8px 40px rgba(0,0,0,0.15)', width: '100%', maxWidth: '560px', border: '1px solid #E2E8F0', maxHeight: '85vh', overflowY: 'auto', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
            <div style={{ width: '40px', height: '4px', background: '#E2E8F0', borderRadius: '2px' }} />
          </div>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontWeight: 700, fontSize: '16px', color: '#0F172A', margin: 0 }}>Why is nothing showing here?</h2>
            <button onClick={onClose} style={{ width: '44px', height: '44px', borderRadius: '10px', border: 'none', background: '#F1F5F9', color: '#64748B', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '16px' }}>
              <p style={{ fontSize: '13px', color: '#92400E', fontWeight: 600, marginBottom: '10px' }}>No fund qualifies for this slot because:</p>
              <ul style={{ fontSize: '13px', color: '#78350F', paddingLeft: 0, listStyle: 'none', margin: 0 }}>
                {['The fund must have a real track record — we only consider funds with at least some performance history to compare', 'It must genuinely fit this type (company size + investment style)', 'Without a real track record, any recommendation would just be guesswork'].map((s, i) => (
                  <li key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}><span style={{ color: '#F59E0B', flexShrink: 0 }}>•</span>{s}</li>
                ))}
              </ul>
            </div>
            {box.allConsideredSubCategories.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>We still looked at {box.allConsideredSubCategories.length} fund types for this slot:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {box.allConsideredSubCategories.map((cat, i) => <span key={i} style={{ fontSize: '11px', padding: '2px 9px', borderRadius: '100px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#64748B' }}>{cat}</span>)}
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50 }}
      onClick={onClose}>
      <div style={{ background: 'white', borderRadius: '20px 20px 0 0', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)', width: '100%', maxWidth: '860px', maxHeight: '92vh', overflowY: 'auto', border: '1px solid #E2E8F0', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0', position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
          <div style={{ width: '40px', height: '4px', background: '#E2E8F0', borderRadius: '2px' }} />
        </div>

        <div style={{ position: 'sticky', top: '24px', background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(8px)', padding: '12px 20px 14px', borderBottom: '1px solid #F1F5F9', zIndex: 9 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '10px', fontWeight: 700, padding: '2px 9px', borderRadius: '100px', letterSpacing: '0.05em', whiteSpace: 'nowrap',
                  background: isActive ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)',
                  color: isActive ? '#059669' : '#2563EB',
                  border: `1px solid ${isActive ? 'rgba(16,185,129,0.25)' : 'rgba(59,130,246,0.25)'}`,
                }}>{isActive ? '● Actively managed' : '◆ Index / ETF'}</span>
                <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>Why we picked this fund</span>
              </div>
              <h2 style={{ fontSize: 'clamp(14px, 3vw, 18px)', fontWeight: 800, color: '#0F172A', margin: '0 0 3px', lineHeight: 1.2 }}>{fundName}</h2>
              <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>
                Type: <strong style={{ color: '#374151' }}>{box.leadingSubCategory}</strong>
                {' · '}{box.candidateSubCategories.length} fund types compared
              </p>
            </div>
            <button onClick={onClose} style={{ width: '44px', height: '44px', borderRadius: '10px', border: 'none', background: '#F1F5F9', color: '#64748B', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
          </div>
        </div>

        <div style={{ padding: 'clamp(14px, 4vw, 24px)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {box.fundStats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px' }}>
              {[
                { label: '3-Year Returns', value: `${box.fundStats.return3Y?.toFixed(2)}%`, color: '#0F172A', help: 'How much ₹100 grew over 3 years' },
                { label: '5-Year Returns', value: box.fundStats.return5Y ? `${box.fundStats.return5Y.toFixed(2)}%` : '—', color: '#0F172A', help: 'How much ₹100 grew over 5 years' },
                { label: 'Extra vs Index', value: `${box.fundStats.alpha3Y && box.fundStats.alpha3Y > 0 ? '+' : ''}${box.fundStats.alpha3Y?.toFixed(2)}%`, color: box.fundStats.alpha3Y && box.fundStats.alpha3Y > 0 ? '#059669' : '#DC2626', help: 'How much more (or less) it earned vs benchmark' },
                { label: 'Category Rank', value: `#${box.fundStats.rank}`, color: '#0F172A', help: 'Ranked against all similar funds' },
                { label: 'AUM', value: `₹${(box.fundStats.aum / 1000).toFixed(1)}K Cr`, color: '#0F172A', help: 'Total investor money in this fund' },
              ].map((s, i) => (
                <div key={i} style={{ background: '#F8FAFC', borderRadius: '12px', padding: '11px 12px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '10px', color: '#94A3B8', marginBottom: '3px', fontWeight: 500, lineHeight: 1.3 }}>{s.label}</div>
                  <div style={{ fontSize: 'clamp(16px, 3vw, 20px)', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: '9px', color: '#CBD5E1', marginTop: '3px', lineHeight: 1.3 }}>{s.help}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '14px', padding: '14px 16px', display: 'flex', gap: '10px' }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>💡</span>
            <div>
              <h3 style={{ fontWeight: 700, color: '#1E40AF', fontSize: '13px', margin: '0 0 5px' }}>Why did we pick this fund?</h3>
              <p style={{ fontSize: '12.5px', color: '#1E3A8A', margin: 0, lineHeight: 1.65 }}>
                We compared <strong>{box.candidateSubCategories.length}</strong> types of funds for this slot.{' '}
                <strong>{box.leadingSubCategory}</strong> consistently delivered the best extra returns above the market benchmark.
                Within that type, this fund ranked <strong>#{box.fundStats?.rank}</strong> — the top pick, chosen purely by numbers, no human bias.
              </p>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '10px' }}>
              All fund types evaluated ({box.allConsideredSubCategories.length} total)
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
                  }}>{hasData ? '✓ ' : ''}{cat}</span>
                );
              })}
            </div>
            <p style={{ fontSize: '11px', color: '#94A3B8' }}>Blue ticked = had enough history · Grey = skipped (not enough data)</p>
          </div>

          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '10px' }}>Head-to-head: which type gave better returns?</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[...box.candidateSubCategories].sort((a, b) => b.avgAlpha - a.avgAlpha).map((subCat, i) => {
                const isWinner = subCat.subCategoryName === box.leadingSubCategory;
                return (
                  <div key={i} style={{ borderRadius: '12px', padding: '12px 14px', border: `1px solid ${isWinner ? '#A7F3D0' : '#E2E8F0'}`, background: isWinner ? '#ECFDF5' : '#F8FAFC' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px', flexWrap: 'wrap', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '12px', color: '#1F2937' }}>{subCat.subCategoryName}</span>
                        {isWinner && <span style={{ fontSize: '9px', background: '#059669', color: 'white', padding: '2px 7px', borderRadius: '100px', fontWeight: 700 }}>WINNER</span>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '10px', color: '#94A3B8' }}>Avg extra vs index</div>
                        <div style={{ fontSize: 'clamp(15px, 3vw, 18px)', fontWeight: 800, color: subCat.avgAlpha > 0 ? '#059669' : '#DC2626' }}>
                          {subCat.avgAlpha > 0 ? '+' : ''}{subCat.avgAlpha.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '14px', fontSize: '11px', color: '#64748B', flexWrap: 'wrap' }}>
                      <span>{subCat.fundCount} fund{subCat.fundCount > 1 ? 's' : ''} compared</span>
                      <span>Beat index: <strong style={{ color: '#374151' }}>{subCat.avgBeatRate.toFixed(0)}% of the time</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '14px 16px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#374151', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>📐</span> How we shortlisted this fund
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {['We gathered every fund that fits this slot — right company size, right investment style', 'We grouped them by type and measured how much extra return each type gave over the years', 'The type that consistently beat the market the most got selected', 'Within that winning type, the highest-ranked fund with real performance history became your pick'].map((s, i) => (
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
// SECTION PANEL (grid table)
// ──────────────────────────────────────────────────────────────

function SectionPanel({ rows, cols, boxes, onCellClick }: {
  rows: GridDef; cols: GridDef; boxes: BoxResult[][]; onCellClick: (box: BoxResult) => void;
}) {
  return (
    <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #E2E8F0', WebkitOverflowScrolling: 'touch', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '380px', fontSize: '11px' }}>
          <thead>
            <tr>
              <th style={{ padding: '11px 10px', width: '100px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0', fontSize: '10px', color: '#94A3B8', fontWeight: 600, textAlign: 'left' }}>Size ↓</th>
              {cols.map((c, i) => (
                <th key={i} style={{ padding: '10px 10px', textAlign: 'center', background: 'linear-gradient(180deg, #EFF6FF 0%, #DBEAFE 100%)', borderBottom: '1px solid #BFDBFE', borderRight: i < cols.length - 1 ? '1px solid #DBEAFE' : 'none', minWidth: '120px' }}>
                  <div style={{ fontWeight: 800, color: '#1E40AF', fontSize: '10px' }}>{c.label}</div>
                  <div style={{ fontSize: '9px', color: '#60A5FA', fontWeight: 500, marginTop: '2px' }}>{c.subtitle}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, rowIdx) => (
              <tr key={rowIdx}>
                <th style={{ padding: '11px 10px', textAlign: 'left', background: '#F8FAFC', borderBottom: rowIdx < rows.length - 1 ? '1px solid #E2E8F0' : 'none', borderRight: '1px solid #E2E8F0', verticalAlign: 'top' }}>
                  <div style={{ fontWeight: 800, fontSize: '10px', color: '#374151' }}>{r.label}</div>
                  <div style={{ fontSize: '8px', color: '#9CA3AF', fontWeight: 400, marginTop: '3px', lineHeight: 1.4 }}>{r.subtitle}</div>
                </th>
                {cols.map((_, colIdx) => (
                  <td key={colIdx}
                    style={{ padding: '10px 10px', borderBottom: rowIdx < rows.length - 1 ? '1px solid #F1F5F9' : 'none', borderRight: colIdx < cols.length - 1 ? '1px solid #F1F5F9' : 'none', verticalAlign: 'top', background: 'white', cursor: 'pointer', transition: 'background 0.15s' }}
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
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// HERO — UPDATED with unified nav pattern
// ──────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section style={{
      background: 'linear-gradient(155deg, #0F172A 0%, #1E3A5F 55%, #0C4A2E 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* dot grid */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)', backgroundSize: '28px 28px' }} />
      <div style={{ position: 'absolute', top: '-80px', right: '-40px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(59,130,246,0.14) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-60px', left: '5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', maxWidth: '1100px', margin: '0 auto', padding: 'clamp(28px, 5vw, 52px) clamp(16px, 4vw, 24px) clamp(24px, 4vw, 40px)' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <a href="/" style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Nivesify</a>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>/</span>
          <a href="/mutual-fund-match" style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Mutual Fund World</a>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>/</span>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Smart Fund Finder</span>
        </div>

        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '100px', padding: '5px 13px', marginBottom: '14px' }}>
          <span style={{ fontSize: '13px' }}>🔍</span>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#93C5FD', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Smart Fund Finder</span>
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: 'clamp(1.6rem, 5vw, 2.9rem)', fontWeight: 800, color: 'white', lineHeight: 1.1, letterSpacing: '-0.025em', marginBottom: '10px', maxWidth: '680px' }}>
          Stop guessing which fund.<br />
          <span style={{ background: 'linear-gradient(90deg, #60A5FA 0%, #34D399 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            We've done the homework.
          </span>
        </h1>
        <p style={{ fontSize: 'clamp(12px, 2vw, 14px)', color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, maxWidth: '520px', marginBottom: '22px' }}>
          Our engine looks at every mutual fund in India, scores them on real performance, and shows you the best one in each category — live, unbiased, explained in full.
        </p>

        {/* Row 1: MF World tabs */}
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '6px 8px', display: 'inline-block', width: '100%', maxWidth: 'fit-content', boxSizing: 'border-box', marginBottom: '10px' }}>
          <MFWorldTabs activePage="/mutual-fund-match" />
        </div>

        {/* Row 2: Fund Planning Tools strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '6px' }}>
          <PlanningToolsStrip activeTool="/mutual-fund-match" />
        </div>

        {/* Trust stats */}
        <div style={{ display: 'flex', gap: 'clamp(16px, 3vw, 32px)', flexWrap: 'wrap', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {[
            { v: '1,500+', l: 'Funds analysed', c: '#60A5FA' },
            { v: '3',      l: 'Asset classes',  c: '#34D399' },
            { v: '0%',     l: 'Human bias',     c: '#A78BFA' },
            { v: 'Live',   l: 'Always updated', c: '#FCD34D' },
          ].map((m, i) => (
            <div key={i}>
              <div style={{ fontSize: 'clamp(15px, 2.5vw, 18px)', fontWeight: 800, color: m.c, lineHeight: 1 }}>{m.v}</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', marginTop: '3px', fontWeight: 500 }}>{m.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────
// HOW IT WORKS STRIP
// ──────────────────────────────────────────────────────────────

function HowItWorksStrip() {
  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: 'clamp(16px, 3vw, 28px) clamp(12px, 3vw, 24px) 0' }}>
      <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #E2E8F0', padding: 'clamp(16px, 3vw, 24px) clamp(16px, 3vw, 28px)', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: '16px' }}>
          How it works — 3 simple steps
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          {[
            { step: '01', icon: '🗂️', title: 'Sort every fund', desc: 'All mutual funds in India sorted by what they invest in — company size and investment style.', tags: ['Shares', 'Balanced', 'Bonds'], c: '#2563EB', bg: '#EFF6FF', bd: '#BFDBFE' },
            { step: '02', icon: '📊', title: 'Find who performs best', desc: 'Compare fund types on how much extra return above the market — real numbers, not opinions.', tags: ['Real returns', 'Vs market', 'No guesswork'], c: '#7C3AED', bg: '#F5F3FF', bd: '#DDD6FE' },
            { step: '03', icon: '🏆', title: 'Surface the #1 fund', desc: 'Top-ranked fund in the winning category becomes your pick. Tap any slot for full transparency.', tags: ['Top ranked', 'Full audit', 'Live data'], c: '#059669', bg: '#ECFDF5', bd: '#A7F3D0' },
          ].map((s, i) => (
            <div key={i} style={{ paddingRight: i < 2 ? 'clamp(0px, 2vw, 20px)' : '0', borderRight: i < 2 ? '1px dashed #E2E8F0' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: s.bg, border: `1px solid ${s.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0 }}>{s.icon}</div>
                <span style={{ fontSize: '10px', fontWeight: 800, color: s.c, letterSpacing: '0.1em' }}>STEP {s.step}</span>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#1F2937', marginBottom: '5px', lineHeight: 1.3 }}>{s.title}</div>
              <p style={{ fontSize: '11.5px', color: '#64748B', lineHeight: 1.6, marginBottom: '8px' }}>{s.desc}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {s.tags.map(t => <span key={t} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '100px', background: s.bg, color: s.c, border: `1px solid ${s.bd}`, fontWeight: 600 }}>{t}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// PLANNING TOOLS CTA STRIP — new, links to quick-goal + lifetime
// ──────────────────────────────────────────────────────────────

function PlanningToolsCTA() {
  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 clamp(12px, 3vw, 24px)' }}>
      <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 60%, #0C4A2E 100%)', borderRadius: '20px', padding: 'clamp(20px, 3vw, 28px) clamp(20px, 3vw, 32px)', position: 'relative', overflow: 'hidden' }}>
        {/* bg decoration */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }}>Fund Planning Tools</div>
            <div style={{ fontSize: 'clamp(15px, 2.5vw, 18px)', fontWeight: 800, color: 'white', marginBottom: '4px' }}>Know your goal? Build your fund plan.</div>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.65, maxWidth: '420px' }}>
              The matrix shows what's best in each category. These tools turn that into a personalised plan for your specific goal — one fund or a lifetime portfolio.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {/* Quick Goal */}
            <a href="/find-my-fund-quick-picks" style={{
              display: 'flex', flexDirection: 'column', gap: '4px',
              background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: '16px', padding: '14px 18px', textDecoration: 'none',
              minWidth: '160px', transition: 'all 0.2s', cursor: 'pointer',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(16,185,129,0.2)'; (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(16,185,129,0.12)'; (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '2px' }}>
                <span style={{ fontSize: '18px' }}>⚡</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#34D399' }}>Quick Goal Picks</span>
              </div>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>Tell us one goal — car, home, education. Get a fund plan in seconds.</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#34D399', marginTop: '4px' }}>Build my fund plan →</span>
            </a>

            {/* Lifetime Plan */}
            <a href="/find-my-fund-lifetime-plan" style={{
              display: 'flex', flexDirection: 'column', gap: '4px',
              background: 'rgba(217,119,6,0.12)', border: '1px solid rgba(217,119,6,0.3)',
              borderRadius: '16px', padding: '14px 18px', textDecoration: 'none',
              minWidth: '160px', transition: 'all 0.2s', cursor: 'pointer',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(217,119,6,0.2)'; (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(217,119,6,0.12)'; (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '2px' }}>
                <span style={{ fontSize: '18px' }}>🌱</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#FCD34D' }}>Lifetime Plan</span>
              </div>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>All your goals — car, home, retirement — one portfolio, one SIP.</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#FCD34D', marginTop: '4px' }}>Build my lifetime plan →</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// MAIN PAGE
// ──────────────────────────────────────────────────────────────

export default function FindMyFundPage() {
  const rowDefs: GridDef = [
    { label: "Large Companies",     subtitle: "India's biggest, most stable" },
    { label: "Mid-sized Companies", subtitle: "Growing fast, more opportunity" },
    { label: "Small Companies",     subtitle: "High risk, high reward potential" },
    { label: "Any Mix",             subtitle: "Manager picks the combination" },
  ];
  const colDefs: GridDef = [
    { label: "Value / Bargain",     subtitle: "Buy good businesses cheap" },
    { label: "Steady Growth",       subtitle: "Reliable long-term compounders" },
    { label: "Momentum",            subtitle: "Ride what the market favours" },
    { label: "Manager's Best Bets", subtitle: "Full freedom to the manager" },
  ];

  const [loading, setLoading]         = useState(true);
  const [equityBoxes, setEquityBoxes] = useState<BoxResult[][]>([]);
  const [modalBox, setModalBox]       = useState<BoxResult | null>(null);
  const [reportDate, setReportDate]   = useState<string>("");

  useEffect(() => {
    async function load() {
      try {
        const [amfiRaw, fundAnalytics, etfAnalytics, insights] = await Promise.all([
          fetchCachedJson<AMFIFund[]>("amfiRaw"),
          fetchCachedJson<FundAnalytics[]>("funds"),
          fetchCachedJson<ETFAnalytics[]>("etfs"),
          fetchCachedJson<InsightRow[]>("insights"),
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
    <div style={{ minHeight: '100vh', background: '#F8FAFC', color: '#1F2937', fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif" }}>

      {/* HERO with unified nav */}
      <HeroSection />

      {/* How it works */}
      <HowItWorksStrip />

      {/* Planning Tools CTA — NEW */}
      <div style={{ padding: 'clamp(16px, 3vw, 24px) 0 0' }}>
        <PlanningToolsCTA />
      </div>

      {/* ── SHARE FUNDS (Equity) ── */}
      <section style={{ padding: 'clamp(16px, 4vw, 28px) clamp(12px, 3vw, 24px)' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 1px 8px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', padding: 'clamp(16px, 3vw, 28px) clamp(14px, 3vw, 28px)' }}>
            <SectionHeader num="1" title="Share Funds (Equity)" subtitle="Invests in company shares · Higher risk, higher potential over the long run" reportDate={reportDate} />
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '14px', lineHeight: 1.6 }}>
              Each slot shows the best fund for that combination of <strong>company size</strong> and <strong>investment approach</strong>. Tap any slot to see why it was picked.
            </p>
            {loading ? <PlaceholderGrid rows={rowDefs} cols={colDefs} /> : (
              <SectionPanel rows={rowDefs} cols={colDefs} boxes={equityBoxes} onCellClick={box => setModalBox(box)} />
            )}
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748B' }}>
                <span style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '100px', background: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.2)', fontWeight: 700 }}>● ACTIVE</span>
                Fund manager picks stocks
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748B' }}>
                <span style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '100px', background: 'rgba(59,130,246,0.1)', color: '#2563EB', border: '1px solid rgba(59,130,246,0.2)', fontWeight: 700 }}>◆ INDEX</span>
                Tracks the market automatically
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>💡 Tap any slot to understand why</div>
            </div>
          </div>
        </div>
      </section>

      {modalBox && <DetailModal box={modalBox} onClose={() => setModalBox(null)} />}

      <HybridMatrixSection reportDate={reportDate} />
      <DebtMatrixSection reportDate={reportDate} />

      {/* Disclaimer */}
      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 clamp(12px, 3vw, 24px) clamp(32px, 5vw, 56px)' }}>
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px 18px', fontSize: '10.5px', color: '#94A3B8', lineHeight: 1.6, textAlign: 'center' }}>
          <strong style={{ color: '#64748B' }}>Important Disclaimer:</strong> Mutual fund investments are subject to market risks. Past performance is not indicative of future returns. Please read all scheme-related documents carefully before investing.
        </div>
      </div>

      <style>{`
        * { -ms-overflow-style: none; scrollbar-width: none; box-sizing: border-box; }
        *::-webkit-scrollbar { display: none; }
        html { scroll-behavior: smooth; }
        img, iframe, table { max-width: 100%; }
        @media (max-width: 640px) { section { padding-left: 12px !important; padding-right: 12px !important; } }
        @media (max-width: 480px) { th, td { font-size: 10px !important; padding: 8px 7px !important; } }
      `}</style>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// BALANCED FUNDS (Hybrid) — unchanged from original
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
        fetchCachedJson<AMFIFund[]>("amfiRaw"),
        fetchCachedJson<FundAnalytics[]>("funds"),
        fetchCachedJson<ETFAnalytics[]>("etfs"),
        fetchCachedJson<InsightRow[]>("insights"),
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
    <section style={{ padding: '0 clamp(12px, 3vw, 24px) clamp(16px, 3vw, 24px)' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 1px 8px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', padding: 'clamp(16px, 3vw, 28px) clamp(14px, 3vw, 28px)' }}>
          <SectionHeader num="2" title="Balanced Funds" subtitle="Mix of shares and bonds · Lower swings, steadier journey" reportDate={reportDate} />
          <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '14px', lineHeight: 1.6 }}>
            These funds blend shares and bonds in different proportions. Great if you want growth without the full ups-and-downs of a pure share fund.
          </p>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[...Array(5)].map((_, i) => <div key={i} style={{ height: '52px', background: '#F1F5F9', borderRadius: '10px' }} />)}
            </div>
          ) : (
            <div style={{ borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '380px' }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(90deg, #EFF6FF, #F0FDF4)' }}>
                      <th style={{ padding: '11px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 800, color: '#1E40AF', borderBottom: '1px solid #E2E8F0', minWidth: '130px' }}>Fund Type</th>
                      <th style={{ padding: '11px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 800, color: '#065F46', borderBottom: '1px solid #E2E8F0' }}>Best Fund</th>
                      <th style={{ padding: '11px 12px', textAlign: 'center', fontSize: '11px', fontWeight: 800, color: '#374151', borderBottom: '1px solid #E2E8F0', width: '80px' }}>3Y</th>
                      <th style={{ padding: '11px 12px', textAlign: 'center', fontSize: '11px', fontWeight: 800, color: '#374151', borderBottom: '1px solid #E2E8F0', width: '80px' }}>vs Market</th>
                      <th style={{ padding: '11px 12px', textAlign: 'center', fontSize: '11px', fontWeight: 800, color: '#374151', borderBottom: '1px solid #E2E8F0', width: '65px' }}>Rank</th>
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
                          <td style={{ padding: '12px 12px', fontWeight: 700, color: '#374151', fontSize: '12px' }}>{row.label}</td>
                          <td style={{ padding: '12px 12px' }}>
                            {fundName ? (
                              <div>
                                <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '12px', lineHeight: 1.3 }}>{fundName}</div>
                                {box?.leadingSubCategory && <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>{box.leadingSubCategory}</div>}
                              </div>
                            ) : <span style={{ fontSize: '12px', color: '#CBD5E1' }}>No qualifying fund yet</span>}
                          </td>
                          <td style={{ padding: '12px 12px', textAlign: 'center', fontWeight: 700, color: '#1F2937', fontSize: '12px' }}>
                            {stats?.return3Y != null ? `${stats.return3Y.toFixed(1)}%` : '—'}
                          </td>
                          <td style={{ padding: '12px 12px', textAlign: 'center', fontWeight: 700, fontSize: '12px' }}>
                            {stats?.alpha3Y != null ? <span style={{ color: stats.alpha3Y > 0 ? '#059669' : '#DC2626' }}>{stats.alpha3Y > 0 ? '+' : ''}{stats.alpha3Y.toFixed(1)}%</span> : '—'}
                          </td>
                          <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>{stats?.rank ? `#${stats.rank}` : '—'}</div>
                            <div style={{ fontSize: '9px', color: '#93C5FD', marginTop: '1px' }}>see why →</div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {modalBox && <DetailModal box={modalBox} onClose={() => setModalBox(null)} />}
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────
// BOND FUNDS (Debt) — unchanged from original
// ──────────────────────────────────────────────────────────────

function DebtMatrixSection({ reportDate }: { reportDate: string }) {
  const rowDefs: GridDef = [
    { label: "Very Short Term",  subtitle: "Park money safely, days to months" },
    { label: "1–3 Year Term",    subtitle: "Short period, stable returns" },
    { label: "3–5 Year Term",    subtitle: "Medium-term, slightly higher returns" },
    { label: "5 Years+",         subtitle: "Long-term bonds, rate sensitive" },
  ];
  const colDefs: GridDef = [
    { label: "Safest",        subtitle: "Govt bonds, AAA-rated" },
    { label: "Balanced Risk", subtitle: "Mix of high & mid-rated" },
    { label: "Higher Yield",  subtitle: "Lower-rated, higher returns" },
  ];

  const [loading, setLoading]     = React.useState(true);
  const [debtBoxes, setDebtBoxes] = React.useState<BoxResult[][]>([]);
  const [modalBox, setModalBox]   = React.useState<BoxResult | null>(null);

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      const [amfiRaw, fundAnalytics, etfAnalytics, insights] = await Promise.all([
        fetchCachedJson<AMFIFund[]>("amfiRaw"),
        fetchCachedJson<FundAnalytics[]>("funds"),
        fetchCachedJson<ETFAnalytics[]>("etfs"),
        fetchCachedJson<InsightRow[]>("insights"),
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
    <section style={{ padding: '0 clamp(12px, 3vw, 24px) clamp(24px, 4vw, 48px)' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 1px 8px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', padding: 'clamp(16px, 3vw, 28px) clamp(14px, 3vw, 28px)' }}>
          <SectionHeader num="3" title="Bond Funds (Debt)" subtitle="Invests in govt & corporate bonds · Stable, lower-risk income" reportDate={reportDate} />
          <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '14px', lineHeight: 1.6 }}>
            Bond funds lend your money to the government or companies in exchange for regular interest. How long you lend (term) and who you lend to (safety) determines the return.
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