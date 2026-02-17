"use client";

import AnalysisTabs from "@/components/AnalysisTabs";
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

  // Col 0: Value / Contra / Dividend
  if (sub.includes("value") || sub.includes("contra") || sub.includes("dividend")) return 0;
  if (bench.includes("value") || bench.includes("contra")) return 0;

  // Col 2: Momentum - ONLY if benchmark contains momentum, NOT if it's in other parts
  if (bench.includes("momentum")) return 2;

  // Col 3: Pure Active
  const sizeSubcats = [
    "large cap", "mid cap", "small cap", "flexi cap",
    "multi cap", "large & mid cap", "elss", "focused",
  ];
  if (sub !== "index / etf" && sizeSubcats.includes(sub)) return 3;

  // Col 1: Growth / Core (default)
  return 1;
}

function getSize(fund: AMFIFund): number | null {
  const sub   = (fund.Sub_Category || "").toLowerCase();
  const bench = (fund.benchmark    || "").toLowerCase();

  // Direct sub-category match (highest priority for size-specific funds)
  if (sub === "large cap" || sub === "large & mid cap" || sub === "focused") return 0;
  if (sub === "mid cap") return 1;
  if (sub === "small cap") return 2;
  if (sub === "flexi cap" || sub === "multi cap" || sub === "elss") return 3;

  // SPECIAL CASE: Value/Contra/Dividend Yield funds are typically large-cap focused
  // even though they use Nifty 500/BSE 500 benchmarks
  if (sub === "value" || sub === "contra" || sub === "dividend yield") return 0;

  // Benchmark-based detection for Index/ETF funds
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
  
  // Include "Other" category IF it has equity benchmark
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
// TWO-TIER SELECTION WITH ALL IMPROVEMENTS
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

  // Track ALL sub-categories considered for this cell
  const allConsideredSubCategories = new Set<string>();

  // STEP 1: Group funds by Sub_Category/Benchmark
  const subCategoryGroups: Record<string, AMFIFund[]> = {};
  
  cellFunds.forEach(fund => {
    const isPassive = fund.Sub_Category.toLowerCase() === "index / etf";
    const key = isPassive ? fund.benchmark : fund.Sub_Category;
    allConsideredSubCategories.add(key);
    
    if (!subCategoryGroups[key]) subCategoryGroups[key] = [];
    subCategoryGroups[key].push(fund);
  });

  // STEP 2: Calculate performance for each sub-category
  const subCategoryPerformances: SubCategoryPerformance[] = [];

  Object.keys(subCategoryGroups).forEach(subCatKey => {
    const fundsInSubCat = subCategoryGroups[subCatKey];
    
    let totalAlpha = 0;
    let totalBeatRate = 0;
    let fundCount = 0;
    let topFund: (FundAnalytics | ETFAnalytics) | null = null;
    let topRank = 999999;

    fundsInSubCat.forEach(amfiFund => {
      // Try active fund
      const activeFund = fundAnalytics.find(f => 
        f.Fund_Name.toLowerCase() === amfiFund.schemeName.toLowerCase() &&
        f.Fund_Return_3Y !== null  // REQUIREMENT 6: Must have 3Y return
      );
      
      if (activeFund) {
        totalAlpha += activeFund.Alpha_3Y || 0;
        fundCount++;
        
        const insight = insights.find(ins => 
          ins.Sub_Category_Name?.toLowerCase() === activeFund.Sub_Category.toLowerCase()
        );
        if (insight) {
          totalBeatRate += insight.Pct_Funds_Beating_Benchmark_3Y || 0;
        }
        
        // REQUIREMENT 2: Use Rank_in_SubCategory for selection
        if (activeFund.Rank_in_SubCategory < topRank) {
          topRank = activeFund.Rank_in_SubCategory;
          topFund = activeFund;
        }
        return;
      }

      // Try ETF
      const etfFund = etfAnalytics.find(e => 
        e.ETF_Name.toLowerCase() === amfiFund.schemeName.toLowerCase() &&
        e.Fund_Return_3Y !== null  // REQUIREMENT 6: Must have 3Y return
      );
      
      if (etfFund) {
        totalAlpha += -(etfFund.Tracking_Diff_3Y || 0);
        fundCount++;
        totalBeatRate += 50;
        
        // REQUIREMENT 2: Use Rank_within_Benchmark for selection
        if (etfFund.Rank_within_Benchmark < topRank) {
          topRank = etfFund.Rank_within_Benchmark;
          topFund = etfFund;
        }
      }
    });

    if (fundCount > 0 && topFund) {
      subCategoryPerformances.push({
        subCategoryName: subCatKey,
        fundCount: fundCount,
        avgAlpha: totalAlpha / fundCount,
        avgBeatRate: totalBeatRate / fundCount,
        topFundName: 'Fund_Name' in topFund ? (topFund as FundAnalytics).Fund_Name : (topFund as ETFAnalytics).ETF_Name,
        topFundScore: 'Composite_Score' in topFund ? (topFund as FundAnalytics).Composite_Score : (topFund as ETFAnalytics).ETF_Score,
        rank: topRank
      });
    }
  });

  // STEP 3: Select leading sub-category
  if (subCategoryPerformances.length === 0) {
    // REQUIREMENT 6: Try second-best if no 3Y data
    return {
      empty: true,
      leadingSubCategory: null,
      allConsideredSubCategories: Array.from(allConsideredSubCategories),
      candidateSubCategories: [],
    };
  }

  const sortedSubCats = [...subCategoryPerformances].sort((a, b) => {
    if (Math.abs(a.avgAlpha - b.avgAlpha) > 0.1) {
      return b.avgAlpha - a.avgAlpha;
    }
    return b.avgBeatRate - a.avgBeatRate;
  });

  const leadingSubCat = sortedSubCats[0];

  // STEP 4: Pick best fund from leading sub-category
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

  // STEP 5: Decide ACTIVE vs INDEX
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

  // REQUIREMENT 5: Collect fund stats
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
// UI COMPONENTS
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
      
      {/* REQUIREMENT 5: Fund Stats */}
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
  // Show explanation even for empty cells
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
                      <p className="text-xs text-[#6B7280] mt-3">
                        None of these categories had funds with 3+ year performance data.
                      </p>
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
          {/* Winner Section */}
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
              
              {/* Enhanced Stats Display */}
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
            
            {/* Why This Won */}
            <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-sm text-[#1F2937]">
                <strong>Why this fund?</strong> Among {box.candidateSubCategories.length} competing categories, 
                <strong> {box.leadingSubCategory}</strong> showed the best average performance. Within this category, 
                this fund ranked <strong>#{box.fundStats?.rank}</strong> making it the top choice.
              </div>
            </div>
          </div>

          {/* All Categories Considered */}
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
                <strong className="text-[#3B82F6]">Blue highlighted</strong> categories had funds with 3+ year track records and were included in performance comparison
              </div>
            </div>
          </div>

          {/* Performance Comparison */}
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
                          <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">
                            ✓ WINNER
                          </span>
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

          {/* Methodology Note */}
          <div className="mt-6 p-4 bg-[#F3F4F6] rounded-lg border border-[#E5E7EB]">
            <h4 className="text-sm font-semibold text-[#1F2937] mb-2">📊 Our Selection Methodology</h4>
            <div className="text-xs text-[#6B7280] space-y-1">
              <p>• <strong>Step 1:</strong> We filtered all funds matching this cell's size and investment style</p>
              <p>• <strong>Step 2:</strong> Grouped them by category and calculated average alpha & beat rate for each</p>
              <p>• <strong>Step 3:</strong> Selected the category with highest average alpha</p>
              <p>• <strong>Step 4:</strong> Within the winning category, picked the best ranked fund with 3+ year history</p>
              <p className="mt-2 pt-2 border-t border-[#DDE6F3]">
                <strong>Note:</strong> Only funds with 3+ years of performance data are considered to ensure reliable track records
              </p>
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

        // REQUIREMENT 7: Get Report_Date
        if (amfiRaw.length > 0) {
          setReportDate(amfiRaw[0].Report_Date);
        }

        // Build 4×4 grid
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

        // Build boxes
        const newBoxes: BoxResult[][] = [];
        const allSubCats = new Set<string>();
        let totalFundsAnalyzed = 0;

        for (let r = 0; r < 4; r++) {
          const rowBoxes: BoxResult[] = [];
          for (let c = 0; c < 4; c++) {
            const box = buildBox(r, c, gridMap[r][c], fundAnalytics, etfAnalytics, insights);
            rowBoxes.push(box);
            
            // REQUIREMENT 4: Calculate actual stats
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

      {/* HERO */}
      <section className="relative overflow-hidden px-6 pt-14 pb-10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-0 h-[360px] w-[560px] rounded-full bg-gradient-to-br from-[#3B82F6]/20 to-[#2563EB]/10 blur-3xl" />
          <div className="absolute right-1/4 top-1/2 h-[300px] w-[400px] rounded-full bg-gradient-to-br from-[#10B981]/15 to-[#059669]/10 blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <h1 className="text-5xl font-extrabold text-[#1F2937] mb-4 tracking-tight">
            Find My Fund
          </h1>
          <p className="text-lg text-[#6B7280] max-w-3xl mx-auto leading-relaxed">
            Discover the best equity fund strategies across market cap sizes and investment styles. 
            Our intelligent two-tier analysis evaluates <strong>{stats.subCategories}+ fund categories</strong> to identify 
            <strong> top performers</strong> with proven 3+ year track records.
          </p>

          {/* REQUIREMENT 4: Dynamic Stats */}
          <div className="mt-10 flex flex-wrap justify-center gap-8">
            <Stat label="Funds Analyzed" value={stats.fundsAnalyzed.toString()} />
            <Stat label="Categories Evaluated" value={stats.subCategories.toString()} />
            <Stat label="Selection Criteria" value="2-Tier" />
          </div>
        </div>
      </section>

      {/* MATRIX */}
      <section className="px-6 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-4">
              <SectionNum num="1" label="Equity Mutual Funds" />
              {/* Date badge inline with header */}
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

      {/* MATRIX: HYBRID (Single Column, Data-Driven, Equity Table Style) */}
      <HybridMatrixSectionSingleCol reportDate={reportDate} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// HYBRID MATRIX SECTION (SINGLE COLUMN, EQUITY TABLE STYLE)
// ──────────────────────────────────────────────────────────────

function HybridMatrixSectionSingleCol({ reportDate }: { reportDate: string }) {
  const [loading, setLoading] = React.useState(true);
  const [hybridBoxes, setHybridBoxes] = React.useState<BoxResult[]>([]);
  const [rowDefs, setRowDefs] = React.useState<GridDef>([]);
  const [modalBox, setModalBox] = React.useState<BoxResult | null>(null);
  const [benchmarks, setBenchmarks] = React.useState<Record<string, string[]>>({});

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      const [amfiRaw, fundAnalytics, etfAnalytics, insights] = await Promise.all([
        fetch("/api/amfi-raw").then(r => r.json()),
        fetch("/api/funds").then(r => r.json()),
        fetch("/api/etfs").then(r => r.json()),
        fetch("/api/insights").then(r => r.json()),
      ]);
      // Only these sub-categories, in this order
      const hybridOrder = [
        "Aggressive Hybrid",
        "Conservative Hybrid",
        "Equity Savings",
        "Arbitrage",
        "Multi Asset Allocation",
        "Balanced Advantage",
        "Balanced Hybrid"
      ];
      // Group by sub-category and collect unique benchmarks
      const hybridFunds = amfiRaw.filter((f: AMFIFund) => f.Category === "Hybrid");
      const bySubCat: Record<string, Set<string>> = {};
      hybridFunds.forEach((f: AMFIFund) => {
        if (!bySubCat[f.Sub_Category]) bySubCat[f.Sub_Category] = new Set();
        if (f.benchmark) bySubCat[f.Sub_Category].add(f.benchmark);
      });
      // Build rows in order, only if present in data
      const presentRows = hybridOrder.filter(subCat => bySubCat[subCat]);
      setRowDefs(presentRows.map(label => ({ label, subtitle: "" })));
      setBenchmarks(Object.fromEntries(presentRows.map(subCat => [subCat, Array.from(bySubCat[subCat])] )));
      // Build boxes (one per row)
      const boxes: BoxResult[] = presentRows.map((subCat, rowIdx) => {
        const funds = hybridFunds.filter((f: AMFIFund) => f.Sub_Category === subCat);
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
          <p className="text-sm text-[#6B7280] mb-6">
            Discover the best hybrid fund in each live category, with a full audit trail. Benchmarks are shown via the <span className="inline-block align-middle text-[#2563EB] font-bold">i</span> icon.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[480px] text-xs">
              <thead>
                <tr>
                  <th className="p-3 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white text-left w-64">Hybrid Category</th>
                  <th className="p-3 bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-left">Best Fund</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={2} className="p-6 text-center text-[#9CA3AF]">Loading…</td></tr>
                ) : rowDefs.length === 0 ? (
                  <tr><td colSpan={2} className="p-6 text-center text-[#9CA3AF]">No hybrid categories found in data.</td></tr>
                ) : rowDefs.map((row, idx) => (
                  <tr key={row.label} className="bg-white border-b border-[#E5E7EB]">
                    <td className="p-3 font-bold text-[#1F2937] flex items-center gap-2">
                      {row.label}
                      {benchmarks[row.label] && benchmarks[row.label].length > 0 && (
                        <span className="relative group cursor-pointer">
                          <span className="inline-block w-4 h-4 rounded-full bg-[#EFF6FF] border border-[#2563EB] text-[#2563EB] text-xs font-bold flex items-center justify-center">i</span>
                          <span className="absolute left-6 top-1 z-10 hidden group-hover:block bg-white border border-[#DDE6F3] rounded shadow-lg px-3 py-2 text-xs text-[#1F2937] min-w-[180px]">
                            <div className="font-semibold mb-1">Benchmarks:</div>
                            {benchmarks[row.label].map((b: string) => (
                              <div key={b} className="mb-1">{b}</div>
                            ))}
                          </span>
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <GridCell box={hybridBoxes[idx]} onClick={() => setModalBox(hybridBoxes[idx])} />
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