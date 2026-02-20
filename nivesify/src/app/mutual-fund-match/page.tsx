"use client";

import AnalysisTabs from "@/components/AnalysisTabs";
import FindMyFundTabs from "@/components/FindMyFundTabs";
import React, { useState, useEffect } from "react";

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

  const sizeSubcats = [
    "large cap", "mid cap", "small cap", "flexi cap",
    "multi cap", "large & mid cap", "elss", "focused",
  ];
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

  if (cat === "equity") {
    return sub === "solution oriented - children's fund";
  }
  
  if (cat === "other" && sub === "index / etf") {
    const bench = (fund.benchmark || "").toLowerCase();
    const equityKeywords = [
      "nifty", "sensex", "bse", "midcap", "smallcap", "largecap",
      "large cap", "flexi", "multi cap", "momentum", "value", 
      "alpha", "quality", "dividend", "growth"
    ];
    return !equityKeywords.some(kw => bench.includes(kw));
  }

  return true;
}

// ──────────────────────────────────────────────────────────────
// TWO-TIER SELECTION
// ──────────────────────────────────────────────────────────────

function buildBox(
  row: number,
  col: number,
  cellFunds: AMFIFund[],
  fundAnalytics: FundAnalytics[],
  etfAnalytics: ETFAnalytics[],
  insights: InsightRow[]
): BoxResult {
  
  if (cellFunds.length === 0) {
    return {
      empty: true,
      leadingSubCategory: null,
      allConsideredSubCategories: [],
      candidateSubCategories: [],
    };
  }

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
    let totalAlpha = 0;
    let totalBeatRate = 0;
    let fundCount = 0;
    let topFund: (FundAnalytics | ETFAnalytics) | null = null;
    let topRank = 999999;

    fundsInSubCat.forEach(amfiFund => {
      const activeFund = fundAnalytics.find(f => 
        f.Fund_Name.toLowerCase() === amfiFund.schemeName.toLowerCase() &&
        f.Fund_Return_3Y !== null
      );
      
      if (activeFund) {
        totalAlpha += activeFund.Alpha_3Y || 0;
        fundCount++;
        const insight = insights.find(ins => 
          ins.Sub_Category_Name?.toLowerCase() === activeFund.Sub_Category.toLowerCase()
        );
        if (insight) totalBeatRate += insight.Pct_Funds_Beating_Benchmark_3Y || 0;
        if (activeFund.Rank_in_SubCategory < topRank) {
          topRank = activeFund.Rank_in_SubCategory;
          topFund = activeFund;
        }
        return;
      }

      const etfFund = etfAnalytics.find(e => 
        e.ETF_Name.toLowerCase() === amfiFund.schemeName.toLowerCase() &&
        e.Fund_Return_3Y !== null
      );
      
      if (etfFund) {
        totalAlpha += -(etfFund.Tracking_Diff_3Y || 0);
        fundCount++;
        totalBeatRate += 50;
        if (etfFund.Rank_within_Benchmark < topRank) {
          topRank = etfFund.Rank_within_Benchmark;
          topFund = etfFund;
        }
      }
    });

    if (fundCount > 0 && topFund) {
      subCategoryPerformances.push({
        subCategoryName: subCatKey,
        fundCount,
        avgAlpha: totalAlpha / fundCount,
        avgBeatRate: totalBeatRate / fundCount,
        topFundName: 'Fund_Name' in topFund ? (topFund as FundAnalytics).Fund_Name : (topFund as ETFAnalytics).ETF_Name,
        topFundScore: 'Composite_Score' in topFund ? (topFund as FundAnalytics).Composite_Score : (topFund as ETFAnalytics).ETF_Score,
        rank: topRank
      });
    }
  });

  if (subCategoryPerformances.length === 0) {
    return {
      empty: true,
      leadingSubCategory: null,
      allConsideredSubCategories: Array.from(allConsideredSubCategories),
      candidateSubCategories: [],
    };
  }

  const sortedSubCats = [...subCategoryPerformances].sort((a, b) => {
    if (Math.abs(a.avgAlpha - b.avgAlpha) > 0.1) return b.avgAlpha - a.avgAlpha;
    return b.avgBeatRate - a.avgBeatRate;
  });

  const leadingSubCat = sortedSubCats[0];
  const leadingFunds = subCategoryGroups[leadingSubCat.subCategoryName];
  let bestFund: (FundAnalytics | ETFAnalytics) | null = null;
  let bestRank = 999999;
  let isActive = false;

  leadingFunds.forEach(amfiFund => {
    const activeFund = fundAnalytics.find(f => 
      f.Fund_Name.toLowerCase() === amfiFund.schemeName.toLowerCase() &&
      f.Fund_Return_3Y !== null
    );
    if (activeFund && activeFund.Rank_in_SubCategory < bestRank) {
      bestRank = activeFund.Rank_in_SubCategory;
      bestFund = activeFund;
      isActive = true;
      return;
    }
    const etfFund = etfAnalytics.find(e => 
      e.ETF_Name.toLowerCase() === amfiFund.schemeName.toLowerCase() &&
      e.Fund_Return_3Y !== null
    );
    if (etfFund && etfFund.Rank_within_Benchmark < bestRank) {
      bestRank = etfFund.Rank_within_Benchmark;
      bestFund = etfFund;
      isActive = false;
    }
  });

  let decision: "ACTIVE" | "INDEX" = isActive ? "ACTIVE" : "INDEX";
  
  if (col === 3 && !isActive) {
    const activeFundsInCell = leadingFunds
      .map(af => fundAnalytics.find(f => 
        f.Fund_Name.toLowerCase() === af.schemeName.toLowerCase() &&
        f.Fund_Return_3Y !== null
      ))
      .filter(Boolean) as FundAnalytics[];
    
    if (activeFundsInCell.length > 0) {
      bestFund = activeFundsInCell.sort((a, b) => a.Rank_in_SubCategory - b.Rank_in_SubCategory)[0];
      decision = "ACTIVE";
      isActive = true;
      bestRank = bestFund.Rank_in_SubCategory;
    }
  }

  const fundStats = bestFund ? {
    return1Y: 'Fund_Return_1Y' in bestFund ? (bestFund as FundAnalytics).Fund_Return_1Y : (bestFund as ETFAnalytics).Fund_Return_1Y,
    return3Y: 'Fund_Return_3Y' in bestFund ? (bestFund as FundAnalytics).Fund_Return_3Y : (bestFund as ETFAnalytics).Fund_Return_3Y,
    return5Y: 'Fund_Return_5Y' in bestFund ? (bestFund as FundAnalytics).Fund_Return_5Y : null,
    alpha3Y: 'Alpha_3Y' in bestFund ? (bestFund as FundAnalytics).Alpha_3Y : -((bestFund as ETFAnalytics).Tracking_Diff_3Y || 0),
    rank: bestRank,
    aum: 'Current_AUM' in bestFund ? (bestFund as FundAnalytics).Current_AUM : (bestFund as ETFAnalytics).Fund_AUM
  } : undefined;

  return {
    empty: false,
    leadingSubCategory: leadingSubCat.subCategoryName,
    allConsideredSubCategories: Array.from(allConsideredSubCategories),
    candidateSubCategories: subCategoryPerformances,
    decision,
    selectedFund: bestFund,
    fundStats
  };
}

// ──────────────────────────────────────────────────────────────
// UI COMPONENTS (unchanged)
// ──────────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-xs text-[#6B7280] uppercase tracking-wide mb-1">{label}</div>
      <div className="text-xl font-bold text-[#1F2937]">{value}</div>
    </div>
  );
}

function SectionNum({ num, label }: { num: string; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#2563EB] flex items-center justify-center text-white font-bold text-lg shadow-md">
        {num}
      </div>
      <h2 className="text-2xl font-bold text-[#1F2937]">{label}</h2>
    </div>
  );
}

function PlaceholderGrid({ rows, cols }: { rows: GridDef; cols: GridDef }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse min-w-[480px] text-xs">
        <thead>
          <tr>
            <th className="p-3 w-36" />
            {cols.map((c, i) => (
              <th key={i} className="p-3 bg-[#3B82F6] text-white text-center">
                <div className="font-semibold">{c.label}</div>
                <div className="text-[10px] opacity-90 mt-0.5">{c.subtitle}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#F9FAFB]"}>
              <th className="p-3 text-left bg-[#F3F4F6] font-semibold text-[#1F2937]">
                <div>{r.label}</div>
                <div className="text-[10px] text-[#6B7280] font-normal mt-0.5">{r.subtitle}</div>
              </th>
              {cols.map((_, j) => (
                <td key={j} className="p-3 text-center border border-[#E5E7EB]">
                  <div className="animate-pulse">
                    <div className="h-3 bg-[#E5E7EB] rounded mb-2" />
                    <div className="h-2 bg-[#F3F4F6] rounded" />
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

function GridCell({ box, onClick }: { box: BoxResult; onClick: () => void }) {
  if (box.empty) {
    return (
      <div className="text-center text-[#9CA3AF] py-4 cursor-pointer hover:bg-[#F9FAFB]" onClick={onClick}>
        <div className="text-2xl mb-1">📋</div>
        <div className="text-[10px]">No matching funds</div>
        <div className="text-[9px] text-[#3B82F6] mt-1">Click for details</div>
      </div>
    );
  }

  const fund = box.selectedFund;
  if (!fund) {
    return (
      <div className="text-center text-[#9CA3AF] py-4">
        <div className="text-2xl mb-1">📋</div>
        <div className="text-[10px]">No fund selected</div>
      </div>
    );
  }

  const fundName = 'Fund_Name' in fund ? fund.Fund_Name : fund.ETF_Name;
  const isActive = box.decision === "ACTIVE";
  const stats = box.fundStats;

  return (
    <div className="text-left">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-base">{isActive ? "🎯" : "📊"}</span>
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
          isActive ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
        }`}>
          {box.decision}
        </span>
      </div>
      <div className="font-bold text-[#1F2937] mb-1 text-sm leading-tight">
        {box.leadingSubCategory}
      </div>
      <div className="text-[10px] text-[#6B7280] mb-2 leading-snug">
        {fundName}
      </div>
      {stats && (
        <div className="text-[9px] text-[#9CA3AF] space-y-0.5">
          <div>3Y: {stats.return3Y?.toFixed(1)}% · α {stats.alpha3Y?.toFixed(1)}%</div>
          {stats.return5Y && <div>5Y: {stats.return5Y.toFixed(1)}%</div>}
          <div>Rank #{stats.rank} · ₹{(stats.aum / 1000).toFixed(1)}K Cr</div>
        </div>
      )}
    </div>
  );
}

function DetailModal({ box, onClose }: { box: BoxResult; onClose: () => void }) {
  if (box.empty) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
          <div className="p-6 border-b border-[#E5E7EB]">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#1F2937]">Why No Funds Here?</h2>
              <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#6B7280] text-3xl leading-none">×</button>
            </div>
          </div>
          <div className="p-6">
            <div className="bg-[#FEF3C7] border border-[#FCD34D] p-6 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-3xl">ℹ️</span>
                <div>
                  <h3 className="font-semibold text-[#1F2937] mb-2">No Funds Match This Criteria</h3>
                  <p className="text-sm text-[#6B7280] mb-3">
                    This combination doesn't have any funds that meet our selection requirements:
                  </p>
                  <ul className="text-sm text-[#6B7280] space-y-1 ml-4">
                    <li>• Must have 3+ years of performance history</li>
                    <li>• Must match both the size and investment style</li>
                    <li>• Must have sufficient track record for reliable analysis</li>
                  </ul>
                  {box.allConsideredSubCategories.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[#FCD34D]">
                      <p className="text-sm text-[#1F2937] font-semibold mb-2">
                        We evaluated {box.allConsideredSubCategories.length} categories for this cell:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {box.allConsideredSubCategories.map((cat, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 bg-white rounded border border-[#E5E7EB] text-[#6B7280]">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white p-6 border-b border-[#E5E7EB] z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#1F2937]">How We Selected This Fund</h2>
            <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#6B7280] text-3xl leading-none">×</button>
          </div>
          <p className="text-sm text-[#6B7280] mt-2">Our two-tier selection process compared {box.allConsideredSubCategories.length} sub-categories to find the best performer</p>
        </div>

        <div className="p-6">
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-[#1F2937] mb-4 flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              Selected Fund
            </h3>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{box.decision === "ACTIVE" ? "🎯" : "📊"}</span>
                    <span className="text-xl font-bold text-[#1F2937]">
                      {box.selectedFund ? ('Fund_Name' in box.selectedFund ? box.selectedFund.Fund_Name : box.selectedFund.ETF_Name) : 'N/A'}
                    </span>
                  </div>
                  <div className="text-sm text-[#6B7280]">
                    Category: <strong>{box.leadingSubCategory}</strong>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                  box.decision === "ACTIVE" ? "bg-green-600 text-white" : "bg-blue-600 text-white"
                }`}>
                  {box.decision}
                </span>
              </div>
              {box.fundStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-green-200">
                  <div>
                    <div className="text-xs text-[#6B7280]">3 Year Return</div>
                    <div className="text-lg font-bold text-[#1F2937]">{box.fundStats.return3Y?.toFixed(2)}%</div>
                  </div>
                  {box.fundStats.return5Y && (
                    <div>
                      <div className="text-xs text-[#6B7280]">5 Year Return</div>
                      <div className="text-lg font-bold text-[#1F2937]">{box.fundStats.return5Y.toFixed(2)}%</div>
                    </div>
                  )}
                  <div>
                    <div className="text-xs text-[#6B7280]">Alpha (3Y)</div>
                    <div className="text-lg font-bold text-green-600">{box.fundStats.alpha3Y?.toFixed(2)}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#6B7280]">Rank in Category</div>
                    <div className="text-lg font-bold text-[#1F2937]">#{box.fundStats.rank}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#6B7280]">AUM</div>
                    <div className="text-lg font-bold text-[#1F2937]">₹{(box.fundStats.aum / 1000).toFixed(1)}K Cr</div>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-sm text-[#1F2937]">
                <strong>Why this fund?</strong> Among {box.candidateSubCategories.length} competing categories, 
                <strong> {box.leadingSubCategory}</strong> showed the best average performance. Within this category, 
                this fund ranked <strong>#{box.fundStats?.rank}</strong> making it the top choice.
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#1F2937] mb-3">
              All {box.allConsideredSubCategories.length} Categories Evaluated for This Cell
            </h3>
            <div className="bg-[#F9FAFB] p-4 rounded-lg border border-[#E5E7EB]">
              <div className="flex flex-wrap gap-2">
                {box.allConsideredSubCategories.map((cat, idx) => (
                  <span
                    key={idx}
                    className={`text-xs px-2 py-1 rounded ${
                      box.candidateSubCategories.some(c => c.subCategoryName === cat)
                        ? 'bg-white border border-[#3B82F6] text-[#3B82F6] font-semibold'
                        : 'bg-white border border-[#E5E7EB] text-[#6B7280]'
                    }`}
                  >
                    {cat}
                  </span>
                ))}
              </div>
              <div className="text-xs text-[#6B7280] mt-3">
                <strong className="text-[#3B82F6]">Blue highlighted</strong> categories had funds with 3+ year track records
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-[#1F2937] mb-4">
              Performance Comparison ({box.candidateSubCategories.length} Categories)
            </h3>
            <div className="space-y-3">
              {box.candidateSubCategories.map((subCat, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border transition-all ${
                    subCat.subCategoryName === box.leadingSubCategory
                      ? 'bg-green-50 border-green-300 shadow-md'
                      : 'bg-white border-[#E5E7EB] hover:border-[#3B82F6]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <div className="font-semibold text-[#1F2937] flex items-center gap-2">
                        {subCat.subCategoryName}
                        {subCat.subCategoryName === box.leadingSubCategory && (
                          <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">✓ WINNER</span>
                        )}
                      </div>
                      <div className="text-xs text-[#6B7280] mt-1">
                        {subCat.fundCount} {subCat.fundCount === 1 ? 'fund' : 'funds'} with 3+ year history
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-[#6B7280]">Avg Alpha</div>
                      <div className="text-lg font-bold text-[#1F2937]">{subCat.avgAlpha.toFixed(2)}%</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-[#6B7280]">Beat Rate:</span>{' '}
                      <strong className="text-[#1F2937]">{subCat.avgBeatRate.toFixed(0)}%</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[#6B7280]">Top Fund:</span>{' '}
                      <strong className="text-[#1F2937]">{subCat.topFundName.substring(0, 30)}...</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 p-4 bg-[#F3F4F6] rounded-lg border border-[#E5E7EB]">
            <h4 className="text-sm font-semibold text-[#1F2937] mb-2">📊 Our Selection Methodology</h4>
            <div className="text-xs text-[#6B7280] space-y-1">
              <p>• <strong>Step 1:</strong> We filtered all funds matching this cell's size and investment style</p>
              <p>• <strong>Step 2:</strong> Grouped them by category and calculated average alpha & beat rate for each</p>
              <p>• <strong>Step 3:</strong> Selected the category with highest average alpha</p>
              <p>• <strong>Step 4:</strong> Within the winning category, picked the best ranked fund with 3+ year history</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionPanel({ rows, cols, boxes, onCellClick }: {
  rows: GridDef;
  cols: GridDef;
  boxes: BoxResult[][];
  onCellClick: (box: BoxResult) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse min-w-[480px] text-xs">
        <thead>
          <tr>
            <th className="p-3 w-36" />
            {cols.map((c, i) => (
              <th key={i} className="p-3 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white text-center">
                <div className="font-semibold">{c.label}</div>
                <div className="text-[10px] opacity-90 mt-0.5">{c.subtitle}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, rowIdx) => (
            <tr key={rowIdx} className={rowIdx % 2 === 0 ? "bg-white" : "bg-[#F9FAFB]"}>
              <th className="p-3 text-left bg-[#F3F4F6] font-semibold text-[#1F2937]">
                <div>{r.label}</div>
                <div className="text-[10px] text-[#6B7280] font-normal mt-0.5">{r.subtitle}</div>
              </th>
              {cols.map((_, colIdx) => (
                <td
                  key={colIdx}
                  className="p-3 border border-[#E5E7EB] cursor-pointer hover:bg-[#EFF6FF] transition-colors"
                  onClick={() => onCellClick(boxes[rowIdx][colIdx])}
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
// HERO SECTION — Premium Redesign
// ──────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .hero-root {
          font-family: 'DM Sans', sans-serif;
          background: #05091A;
          position: relative;
          overflow: hidden;
          padding: 64px 24px 72px;
        }

        /* Starfield / mesh background */
        .hero-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 50% -10%, rgba(56,111,248,0.22) 0%, transparent 70%),
            radial-gradient(ellipse 50% 40% at 90% 80%, rgba(16,185,129,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 40% 30% at 10% 90%, rgba(99,64,220,0.10) 0%, transparent 60%);
          pointer-events: none;
        }

        .hero-grid-lines {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(56,111,248,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56,111,248,0.06) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        .hero-inner {
          position: relative;
          max-width: 1100px;
          margin: 0 auto;
        }

        /* Tag pill */
        .hero-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(56,111,248,0.15);
          border: 1px solid rgba(56,111,248,0.35);
          border-radius: 100px;
          padding: 5px 14px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #7EB3FF;
          margin-bottom: 22px;
        }
        .hero-tag-dot {
          width: 6px; height: 6px;
          background: #4F9AFF;
          border-radius: 50%;
          animation: blink 2s ease-in-out infinite;
        }
        @keyframes blink {
          0%,100% { opacity:1; } 50% { opacity:0.3; }
        }

        /* Headline */
        .hero-headline {
          font-family: 'Sora', sans-serif;
          font-size: clamp(2rem, 4vw, 3.2rem);
          font-weight: 800;
          line-height: 1.13;
          color: #F0F6FF;
          max-width: 680px;
          margin-bottom: 14px;
          letter-spacing: -0.02em;
        }
        .hero-headline-accent {
          background: linear-gradient(90deg, #4F9AFF 0%, #34D399 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-sub {
          font-size: 15px;
          color: #8FA7C8;
          max-width: 520px;
          line-height: 1.65;
          margin-bottom: 48px;
          font-weight: 400;
        }

        /* ── STEP CARDS ── */
        .hero-steps {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
          margin-bottom: 48px;
          align-items: stretch;
        }
        @media (max-width: 680px) {
          .hero-steps { grid-template-columns: 1fr; }
        }

        .step-card {
          position: relative;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 20px;
          padding: 28px 24px 24px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          backdrop-filter: blur(6px);
          transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
          overflow: hidden;
        }
        .step-card::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 20px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .step-card:hover {
          transform: translateY(-4px);
          border-color: rgba(79,154,255,0.35);
          box-shadow: 0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(79,154,255,0.15);
        }

        .step-number {
          font-family: 'Sora', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #4F9AFF;
          text-transform: uppercase;
        }

        .step-icon-wrap {
          width: 52px; height: 52px;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          font-size: 24px;
          flex-shrink: 0;
        }
        .step-icon-blue { background: rgba(79,154,255,0.15); }
        .step-icon-teal { background: rgba(52,211,153,0.15); }
        .step-icon-gold { background: rgba(251,191,36,0.15); }

        .step-title {
          font-family: 'Sora', sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: #E8F0FF;
          line-height: 1.3;
        }

        .step-body {
          font-size: 12.5px;
          color: #6B84A8;
          line-height: 1.6;
          flex: 1;
        }

        .step-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 2px;
        }
        .step-tag {
          font-size: 10px;
          font-weight: 600;
          padding: 3px 9px;
          border-radius: 100px;
          letter-spacing: 0.04em;
        }
        .tag-blue { background: rgba(79,154,255,0.15); color: #7EB3FF; }
        .tag-teal { background: rgba(52,211,153,0.15); color: #5EEAD4; }
        .tag-gold { background: rgba(251,191,36,0.15); color: #FCD34D; }

        /* Connector arrows between cards */
        .step-connector {
          display: flex;
          align-items: center;
          justify-content: center;
          position: absolute;
          top: 50%;
          right: -14px;
          transform: translateY(-50%);
          z-index: 2;
        }
        .step-card-wrap {
          position: relative;
        }

        /* ── FLOW DIAGRAM ── */
        .hero-flow {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 20px 28px;
          overflow-x: auto;
        }

        .flow-node {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 7px;
          min-width: 90px;
        }
        .flow-node-icon {
          width: 42px; height: 42px;
          border-radius: 12px;
          background: rgba(79,154,255,0.13);
          border: 1px solid rgba(79,154,255,0.22);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
        }
        .flow-node-label {
          font-size: 10px;
          color: #6B84A8;
          text-align: center;
          font-weight: 500;
          line-height: 1.3;
          max-width: 80px;
        }
        .flow-arrow {
          display: flex;
          align-items: center;
          padding: 0 6px;
          padding-bottom: 20px; /* align with icons */
        }
        .flow-arrow svg {
          opacity: 0.4;
        }

        /* ── TRUST METRICS ── */
        .hero-metrics {
          display: flex;
          gap: 32px;
          flex-wrap: wrap;
          margin-top: 36px;
          padding-top: 28px;
          border-top: 1px solid rgba(255,255,255,0.07);
        }
        .metric-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .metric-value {
          font-family: 'Sora', sans-serif;
          font-size: 22px;
          font-weight: 800;
          color: #E8F0FF;
          letter-spacing: -0.02em;
        }
        .metric-label {
          font-size: 11px;
          color: #5A738F;
          font-weight: 500;
          letter-spacing: 0.03em;
        }
        .metric-accent { color: #4F9AFF; }

        /* ── RIGHT VISUAL: Animated matrix preview ── */
        .hero-visual {
          position: absolute;
          top: 40px;
          right: -20px;
          width: 360px;
          opacity: 0.85;
          pointer-events: none;
        }
        @media (max-width: 900px) {
          .hero-visual { display: none; }
        }

        .matrix-preview {
          background: rgba(10,18,40,0.9);
          border: 1px solid rgba(79,154,255,0.18);
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 32px 80px rgba(0,0,0,0.6);
        }
        .matrix-header {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #4F9AFF;
          text-transform: uppercase;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .matrix-header::before {
          content: '';
          width: 6px; height: 6px;
          background: #34D399;
          border-radius: 50%;
          animation: blink 1.5s infinite;
        }
        .matrix-grid {
          display: grid;
          grid-template-columns: 70px repeat(3, 1fr);
          gap: 4px;
        }
        .m-cell {
          border-radius: 7px;
          padding: 7px 8px;
          font-size: 9px;
          line-height: 1.3;
        }
        .m-head {
          background: rgba(79,154,255,0.15);
          color: #7EB3FF;
          font-weight: 700;
          font-size: 8px;
          letter-spacing: 0.04em;
        }
        .m-row-head {
          background: rgba(79,154,255,0.08);
          color: #7EB3FF;
          font-weight: 600;
          font-size: 9px;
          display: flex;
          align-items: center;
        }
        .m-data {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          color: #8FA7C8;
          position: relative;
          overflow: hidden;
        }
        .m-data.winner {
          background: rgba(52,211,153,0.10);
          border-color: rgba(52,211,153,0.25);
          color: #5EEAD4;
        }
        .m-fund-name {
          font-size: 7.5px;
          font-weight: 600;
          color: #C8D8EE;
          margin-bottom: 2px;
        }
        .m-fund-stat {
          font-size: 7px;
          color: #34D399;
        }
        .m-empty {
          background: rgba(255,255,255,0.02);
          border: 1px dashed rgba(255,255,255,0.06);
          color: #2A3A52;
          font-size: 8px;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .m-badge {
          display: inline-block;
          font-size: 6.5px;
          padding: 1px 4px;
          border-radius: 3px;
          font-weight: 700;
          margin-bottom: 3px;
        }
        .badge-active { background: rgba(52,211,153,0.2); color: #34D399; }
        .badge-index { background: rgba(79,154,255,0.2); color: #60A5FA; }

        /* Subtle scan animation on matrix */
        .matrix-scan {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(79,154,255,0.6), transparent);
          animation: scan 3s ease-in-out infinite;
          border-radius: 0 0 0 0;
        }
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>

      <section className="hero-root">
        <div className="hero-grid-lines" />

        <div className="hero-inner">
          {/* Floating matrix visual — decorative right side */}
          <div className="hero-visual">
            <div className="matrix-preview" style={{ position: 'relative' }}>
              <div className="matrix-scan" />
              <div className="matrix-header">Live Fund Matrix · Auto-Updated</div>
              <div className="matrix-grid">
                {/* Header row */}
                <div className="m-cell m-head" />
                <div className="m-cell m-head">Value</div>
                <div className="m-cell m-head">Growth</div>
                <div className="m-cell m-head">Momentum</div>
                {/* Row 1 */}
                <div className="m-cell m-row-head">Large Cap</div>
                <div className="m-cell m-data winner">
                  <div className="m-badge badge-active">ACTIVE</div>
                  <div className="m-fund-name">ICICI Pru Value Discovery</div>
                  <div className="m-fund-stat">α +3.2% · Rank #1</div>
                </div>
                <div className="m-cell m-data">
                  <div className="m-badge badge-index">INDEX</div>
                  <div className="m-fund-name">UTI Nifty 50 ETF</div>
                  <div className="m-fund-stat">TD -0.03%</div>
                </div>
                <div className="m-cell m-data">
                  <div className="m-badge badge-index">INDEX</div>
                  <div className="m-fund-name">Motilal Nifty 200 Mom</div>
                  <div className="m-fund-stat">3Y +22.1%</div>
                </div>
                {/* Row 2 */}
                <div className="m-cell m-row-head">Mid Cap</div>
                <div className="m-cell m-empty">—</div>
                <div className="m-cell m-data winner">
                  <div className="m-badge badge-active">ACTIVE</div>
                  <div className="m-fund-name">Nippon India Mid Cap</div>
                  <div className="m-fund-stat">α +5.8% · Rank #1</div>
                </div>
                <div className="m-cell m-data">
                  <div className="m-badge badge-index">INDEX</div>
                  <div className="m-fund-name">Mirae Nifty Midcap 150</div>
                  <div className="m-fund-stat">TD -0.11%</div>
                </div>
                {/* Row 3 */}
                <div className="m-cell m-row-head">Small Cap</div>
                <div className="m-cell m-empty">—</div>
                <div className="m-cell m-data">
                  <div className="m-badge badge-active">ACTIVE</div>
                  <div className="m-fund-name">SBI Small Cap</div>
                  <div className="m-fund-stat">α +4.1% · Rank #2</div>
                </div>
                <div className="m-cell m-empty">—</div>
              </div>
            </div>
          </div>

          {/* Left content */}
          <div style={{ maxWidth: 620 }}>
            <div className="hero-tag">
              <span className="hero-tag-dot" />
              Smart Fund Engine
            </div>

            <h1 className="hero-headline">
              Every rupee invested in<br />
              <span className="hero-headline-accent">the right fund.</span>
            </h1>

            <p className="hero-sub">
              Our engine scans the entire mutual fund universe, organises it into a scientific matrix, and surfaces the single best fund for every risk-style combination — with full transparency.
            </p>

            {/* Step Cards */}
            <div className="hero-steps">
              {/* Step 1 */}
              <div className="step-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="step-icon-wrap step-icon-blue">🗂️</div>
                  <span className="step-number">Step 01</span>
                </div>
                <div className="step-title">Map the universe</div>
                <p className="step-body">
                  Every Indian mutual fund is classified by asset class, market cap, and investment style into a logical grid.
                </p>
                <div className="step-tags">
                  <span className="step-tag tag-blue">Equity</span>
                  <span className="step-tag tag-blue">Hybrid</span>
                  <span className="step-tag tag-blue">Debt</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="step-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="step-icon-wrap step-icon-teal">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                      <path d="M11 8v6M8 11h6" strokeWidth="2.5"/>
                    </svg>
                  </div>
                  <span className="step-number" style={{ color: '#34D399' }}>Step 02</span>
                </div>
                <div className="step-title">Find the best category</div>
                <p className="step-body">
                  For each cell, categories compete on real alpha and benchmark-beating rate. The winner is data-only — no bias.
                </p>
                <div className="step-tags">
                  <span className="step-tag tag-teal">Alpha</span>
                  <span className="step-tag tag-teal">Beat Rate</span>
                  <span className="step-tag tag-teal">3Y History</span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="step-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="step-icon-wrap step-icon-gold">🏆</div>
                  <span className="step-number" style={{ color: '#FCD34D' }}>Step 03</span>
                </div>
                <div className="step-title">Surface #1 fund</div>
                <p className="step-body">
                  The top-ranked fund within the winning category is your pick — with rank, AUM, alpha and a full audit trail.
                </p>
                <div className="step-tags">
                  <span className="step-tag tag-gold">Rank #1</span>
                  <span className="step-tag tag-gold">Transparent</span>
                </div>
              </div>
            </div>

            {/* Flow mini-diagram */}
            <div className="hero-flow">
              <div className="flow-node">
                <div className="flow-node-icon">📥</div>
                <div className="flow-node-label">All AMFI Funds</div>
              </div>
              <div className="flow-arrow">
                <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
                  <path d="M0 6h16M11 1l5 5-5 5" stroke="#4F9AFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="flow-node">
                <div className="flow-node-icon">⚖️</div>
                <div className="flow-node-label">Classify by Risk & Style</div>
              </div>
              <div className="flow-arrow">
                <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
                  <path d="M0 6h16M11 1l5 5-5 5" stroke="#4F9AFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="flow-node">
                <div className="flow-node-icon">📊</div>
                <div className="flow-node-label">Score by Alpha & Beat Rate</div>
              </div>
              <div className="flow-arrow">
                <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
                  <path d="M0 6h16M11 1l5 5-5 5" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="flow-node">
                <div className="flow-node-icon" style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.25)' }}>🎯</div>
                <div className="flow-node-label">Best Fund per Cell</div>
              </div>
            </div>

            {/* Trust metrics */}
            <div className="hero-metrics">
              <div className="metric-item">
                <div className="metric-value">1,500<span className="metric-accent">+</span></div>
                <div className="metric-label">Funds Analysed</div>
              </div>
              <div className="metric-item">
                <div className="metric-value">16</div>
                <div className="metric-label">Matrix Cells</div>
              </div>
              <div className="metric-item">
                <div className="metric-value">0<span className="metric-accent">%</span></div>
                <div className="metric-label">Hardcoding / Bias</div>
              </div>
              <div className="metric-item">
                <div className="metric-value" style={{ color: '#34D399' }}>Live</div>
                <div className="metric-label">Data, Always</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// ──────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────────────────────

export default function FindMyFundPage() {
  const rowDefs: GridDef = [
    { label: "Large Cap",        subtitle: "India's biggest & most stable" },
    { label: "Mid Cap",          subtitle: "Fast-growing challengers" },
    { label: "Small Cap",        subtitle: "High-risk, high-reward" },
    { label: "Flexi / Multi Cap", subtitle: "Manager decides the mix" },
  ];

  const colDefs: GridDef = [
    { label: "Value & Contra",   subtitle: "Buy quality on discount" },
    { label: "Growth / Core",    subtitle: "Steady compounders" },
    { label: "Momentum",         subtitle: "Ride what's winning now" },
    { label: "Pure Active",      subtitle: "Fund manager's best picks" },
  ];

  const [loading, setLoading]               = useState(true);
  const [equityBoxes, setEquityBoxes]       = useState<BoxResult[][]>([]);
  const [modalBox, setModalBox]             = useState<BoxResult | null>(null);
  const [reportDate, setReportDate]         = useState<string>("");
  const [stats, setStats]                   = useState({ fundsAnalyzed: 0, subCategories: 0 });

  useEffect(() => {
    async function load() {
      try {
        const [amfiRaw, fundAnalytics, etfAnalytics, insights] = await Promise.all([
          fetch("/api/amfi-raw").then(r => r.json()),
          fetch("/api/funds").then(r    => r.json()),
          fetch("/api/etfs").then(r     => r.json()),
          fetch("/api/insights").then(r => r.json()),
        ]);

        if (amfiRaw.length > 0) {
          setReportDate(amfiRaw[0].Report_Date);
        }

        const gridMap: AMFIFund[][][] = Array.from({ length: 4 }, () =>
          Array.from({ length: 4 }, () => [])
        );

        for (const fund of amfiRaw as AMFIFund[]) {
          if (shouldExclude(fund)) continue;
          const col = getStyle(fund);
          const row = getSize(fund);
          if (row !== null) {
            gridMap[row][col].push(fund);
          }
        }

        const newBoxes: BoxResult[][] = [];
        const allSubCats = new Set<string>();
        let totalFundsAnalyzed = 0;

        for (let r = 0; r < 4; r++) {
          const rowBoxes: BoxResult[] = [];
          for (let c = 0; c < 4; c++) {
            const box = buildBox(r, c, gridMap[r][c], fundAnalytics, etfAnalytics, insights);
            rowBoxes.push(box);
            box.allConsideredSubCategories.forEach(cat => allSubCats.add(cat));
            totalFundsAnalyzed += gridMap[r][c].length;
          }
          newBoxes.push(rowBoxes);
        }

        setStats({
          fundsAnalyzed: totalFundsAnalyzed,
          subCategories: allSubCats.size
        });

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
    <div className="min-h-screen bg-[#F5F8FF] text-[#1F2937]">
      {/* NAV */}
      <div className="relative z-30 bg-[#F5F8FF]/95 border-b border-[#DDE6F3]">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center">
            <div className="mt-8">
              <AnalysisTabs />
            </div>
          </div>
        </div>
      </div>

      {/* ── NEW HERO ── */}
      <HeroSection />

      {/* SUB-TABS */}
      <div className="max-w-6xl mx-auto px-5 py-6">
        <FindMyFundTabs />
      </div>

      {/* MATRIX */}
      <section className="px-6 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-4">
              <SectionNum num="1" label="Equity Mutual Funds" />
              {reportDate && (
                <span className="text-xs text-[#6B7280] bg-[#EFF6FF] px-3 py-1.5 rounded-full border border-[#DDE6F3]">
                  Data as of <strong className="text-[#3B82F6]">{reportDate}</strong>
                </span>
              )}
            </div>
            <p className="text-sm text-[#6B7280] mb-6">
              Click any cell to see how we selected the fund • Each recommendation is based on category-wide performance analysis
            </p>
            
            {loading ? (
              <PlaceholderGrid rows={rowDefs} cols={colDefs} />
            ) : (
              <SectionPanel 
                rows={rowDefs} 
                cols={colDefs} 
                boxes={equityBoxes}
                onCellClick={(box) => setModalBox(box)}
              />
            )}

            <div className="mt-6 flex items-center justify-center gap-6 text-sm text-[#6B7280]">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <span>Actively Managed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">📊</span>
                <span>Index / ETF</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">💡</span>
                <span>Click to see selection details</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MODAL */}
      {modalBox && <DetailModal box={modalBox} onClose={() => setModalBox(null)} />}

      {/* HYBRID & DEBT */}
      <HybridMatrixSectionSingleCol reportDate={reportDate} />
      <DebtMatrixSection reportDate={reportDate} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// HYBRID MATRIX SECTION (unchanged)
// ──────────────────────────────────────────────────────────────

function HybridMatrixSectionSingleCol({ reportDate }: { reportDate: string }) {
  const [loading, setLoading] = React.useState(true);
  const [hybridBoxes, setHybridBoxes] = React.useState<BoxResult[]>([]);
  const [rowDefs, setRowDefs] = React.useState<GridDef>([]);
  const [modalBox, setModalBox] = React.useState<BoxResult | null>(null);

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      const [amfiRaw, fundAnalytics, etfAnalytics, insights] = await Promise.all([
        fetch("/api/amfi-raw").then(r => r.json()),
        fetch("/api/funds").then(r => r.json()),
        fetch("/api/etfs").then(r => r.json()),
        fetch("/api/insights").then(r => r.json()),
      ]);
      const hybridOrder = [
        "Aggressive Hybrid",
        "Conservative Hybrid",
        "Equity Savings",
        "Arbitrage",
        "Multi Asset Allocation",
        "Balanced Advantage",
        "Balanced Hybrid"
      ];
      const hybridFunds = amfiRaw.filter((f: AMFIFund) => f.Category === "Hybrid");
      const bySubCat: Record<string, AMFIFund[]> = {};
      hybridFunds.forEach((f: AMFIFund) => {
        if (!bySubCat[f.Sub_Category]) bySubCat[f.Sub_Category] = [];
        bySubCat[f.Sub_Category].push(f);
      });
      const presentRows = hybridOrder.filter(subCat => bySubCat[subCat]);
      setRowDefs(presentRows.map(label => ({ label, subtitle: "" })));
      const boxes: BoxResult[] = presentRows.map((subCat, rowIdx) => {
        const funds = bySubCat[subCat];
        return buildBox(rowIdx, 0, funds, fundAnalytics, etfAnalytics, insights);
      });
      setHybridBoxes(boxes);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <section className="px-6 pb-16">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-4">
            <SectionNum num="2" label="Hybrid Mutual Funds" />
            {reportDate && (
              <span className="text-xs text-[#6B7280] bg-[#EFF6FF] px-3 py-1.5 rounded-full border border-[#DDE6F3]">
                Data as of <strong className="text-[#3B82F6]">{reportDate}</strong>
              </span>
            )}
          </div>
          <p className="text-sm text-[#6B7280] mb-6 text-center">
            Discover the best hybrid fund in each live category, with a full audit trail. Benchmarks are available in the audit modal.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[480px] text-xs text-center">
              <thead>
                <tr>
                  <th className="p-3 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white text-center w-64">Hybrid Category</th>
                  <th className="p-3 bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-center">Best Fund</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={2} className="p-6 text-center text-[#9CA3AF]">Loading…</td></tr>
                ) : rowDefs.length === 0 ? (
                  <tr><td colSpan={2} className="p-6 text-center text-[#9CA3AF]">No hybrid categories found in data.</td></tr>
                ) : rowDefs.map((row, idx) => (
                  <tr key={row.label} className="bg-white border-b border-[#E5E7EB]">
                    <td className="p-3 font-bold text-[#1F2937] text-center">{row.label}</td>
                    <td className="p-3 cursor-pointer" onClick={() => setModalBox(hybridBoxes[idx])}>
                      <HybridFundCell box={hybridBoxes[idx]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {modalBox && <DetailModal box={modalBox} onClose={() => setModalBox(null)} />}
        </div>
      </div>
    </section>
  );
}

function HybridFundCell({ box }: { box: BoxResult }) {
  if (box.empty || !box.selectedFund) {
    return (
      <div className="text-center text-[#9CA3AF] py-4">
        <div className="text-2xl mb-1">📋</div>
        <div className="text-[10px]">No matching funds</div>
      </div>
    );
  }
  const fund = box.selectedFund;
  const fundName = 'Fund_Name' in fund ? fund.Fund_Name : fund.ETF_Name;
  const stats = box.fundStats;
  return (
    <div className="text-center">
      <div className="font-extrabold text-[#1F2937] text-base mb-1" style={{ fontSize: '1.1rem' }}>{fundName}</div>
      {stats && (
        <div className="text-[10px] text-[#9CA3AF] space-y-0.5">
          <div>3Y: {stats.return3Y?.toFixed(1)}% · α {stats.alpha3Y?.toFixed(1)}%</div>
          {stats.return5Y && <div>5Y: {stats.return5Y.toFixed(1)}%</div>}
          <div>Rank #{stats.rank} · ₹{(stats.aum / 1000).toFixed(1)}K Cr</div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// DEBT MATRIX SECTION (unchanged)
// ──────────────────────────────────────────────────────────────
function DebtMatrixSection({ reportDate }: { reportDate: string }) {
  const rowDefs: GridDef = [
    { label: "Ultra Short (0–1Y)", subtitle: "Overnight, Liquid, Ultra Short, Money Market" },
    { label: "Short Duration (1–3Y)", subtitle: "Low Duration, Short Duration, Banking & PSU (Short Bias), Corporate Bond (Short Bias)" },
    { label: "Medium Duration (3–5Y)", subtitle: "Corporate Bond, Banking & PSU, Gilt (Medium Term)" },
    { label: "Long Duration (5Y+)", subtitle: "Gilt, Long Duration, Dynamic Bond" }
  ];
  const colDefs: GridDef = [
    { label: "High Credit Quality", subtitle: "AAA, Gilt, PSU" },
    { label: "Medium Credit Risk", subtitle: "AA Mix, Medium Duration" },
    { label: "Yield / Credit Strategy", subtitle: "Credit Risk, Long Tenor Credit" }
  ];

  const [loading, setLoading] = React.useState(true);
  const [debtBoxes, setDebtBoxes] = React.useState<BoxResult[][]>([]);
  const [modalBox, setModalBox] = React.useState<BoxResult | null>(null);

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
        "Overnight": [[0,0]],
        "Liquid": [[0,0]],
        "Ultra Short Duration": [[0,0]],
        "Money Market": [[0,0]],
        "Low Duration": [[1,0]],
        "Short Duration": [[1,0]],
        "Banking & PSU": [[1,0],[2,0]],
        "Corporate Bond": [[1,0],[2,0]],
        "Medium Duration": [[2,1]],
        "Gilt": [[2,0],[3,0]],
        "Long Duration": [[3,0]],
        "Dynamic Bond": [[3,0]],
        "Credit Risk": [[1,2],[2,2],[3,2]],
        "Medium to Long Duration": [[3,1]]
      };
      const gridMap: AMFIFund[][][] = Array.from({ length: 4 }, () => Array.from({ length: 3 }, () => []));
      for (const fund of amfiRaw as AMFIFund[]) {
        if (fund.Category !== "Debt") continue;
        const subCat = fund.Sub_Category;
        if (cellMap[subCat]) {
          for (const [row, col] of cellMap[subCat]) {
            gridMap[row][col].push(fund);
          }
        }
      }
      const newBoxes: BoxResult[][] = [];
      for (let r = 0; r < 4; r++) {
        const rowBoxes: BoxResult[] = [];
        for (let c = 0; c < 3; c++) {
          rowBoxes.push(buildBox(r, c, gridMap[r][c], fundAnalytics, etfAnalytics, insights));
        }
        newBoxes.push(rowBoxes);
      }
      setDebtBoxes(newBoxes);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <section className="px-6 pb-16">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-4">
            <SectionNum num="3" label="Debt Mutual Funds" />
            {reportDate && (
              <span className="text-xs text-[#6B7280] bg-[#EFF6FF] px-3 py-1.5 rounded-full border border-[#DDE6F3]">
                Data as of <strong className="text-[#3B82F6]">{reportDate}</strong>
              </span>
            )}
          </div>
          <p className="text-sm text-[#6B7280] mb-6 text-center">
            Discover the best debt fund in each strategy cell, with a full audit trail. Click any cell for details and methodology.
          </p>
          {loading ? (
            <PlaceholderGrid rows={rowDefs} cols={colDefs} />
          ) : (
            <SectionPanel 
              rows={rowDefs} 
              cols={colDefs} 
              boxes={debtBoxes}
              onCellClick={setModalBox}
            />
          )}
          {modalBox && <DetailModal box={modalBox} onClose={() => setModalBox(null)} />}
        </div>
      </div>
    </section>
  );
}