"use client";

import AnalysisTabs from "@/components/AnalysisTabs";
import React, { useState, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES — exact field names from R2 files
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
  Fund_Return_3Y: number | null;
  Fund_Return_5Y: number | null;
  Alpha_3Y: number | null;
  Alpha_5Y: number | null;
  IR_3Y: number | null;
  Composite_Score: number;
  Rank_in_SubCategory: number;
};

type ETFAnalytics = {
  ETF_Name: string;
  AMC: string | null;
  Benchmark_Name: string;
  Fund_AUM: number;
  Fund_Return_3Y: number | null;
  Tracking_Diff_1Y: number | null;
  Tracking_Diff_3Y: number | null;
  ETF_Score: number;
  Rank_within_Benchmark: number;
};

type AMFIFund = {
  Category: string;
  Sub_Category: string;
  schemeName: string;
  benchmark: string;
};

// NEW: Enhanced types for two-tier selection
type SubCategoryPerformance = {
  subCategoryName: string;
  fundCount: number;
  avgAlpha: number;
  avgBeatRate: number;
  topFundName: string;
  topFundScore: number;
};

type BoxResult = {
  empty: boolean;
  leadingSubCategory: string | null;
  candidateSubCategories: SubCategoryPerformance[];
  decision?: "ACTIVE" | "INDEX";
  selectedFund?: FundAnalytics | ETFAnalytics | null;
  audit?: {
    sizeReason: string;
    styleReason: string;
    winnerReason: string;
  };
};

type GridDef = Array<{ label: string; subtitle: string }>;

// ──────────────────────────────────────────────────────────────
// HELPERS — style & size classification (UNCHANGED)
// ──────────────────────────────────────────────────────────────

function getStyle(fund: AMFIFund): number {
  const sub   = (fund.Sub_Category || "").toLowerCase();
  const bench = (fund.benchmark    || "").toLowerCase();

  // Col 0: Value / Contra / Dividend
  if (sub.includes("value") || sub.includes("contra") || sub.includes("dividend")) return 0;
  if (bench.includes("value") || bench.includes("contra"))                          return 0;

  // Col 2: Momentum
  if (bench.includes("momentum") || bench.includes("alpha")) return 2;

  // Col 3: Pure Active
  const sizeSubcats = [
    "large cap", "mid cap", "small cap", "flexi cap",
    "multi cap", "large & mid cap", "elss", "focused",
  ];
  if (sub !== "index / etf" && sizeSubcats.includes(sub)) return 3;

  // Col 1: Growth / Core
  return 1;
}

function getSize(fund: AMFIFund): number | null {
  const sub   = (fund.Sub_Category || "").toLowerCase();
  const bench = (fund.benchmark    || "").toLowerCase();

  if (sub === "large cap" || sub === "large & mid cap" || sub === "focused") return 0;
  if (sub === "mid cap")                                                       return 1;
  if (sub === "small cap")                                                     return 2;
  if (sub === "flexi cap" || sub === "multi cap" || sub === "elss")            return 3;

  // Benchmark-based detection for Index/ETF
  if (/\bnifty 50\b|sensex|\bnifty 100\b|bse 100/.test(bench))         return 0;
  if (/nifty200 |nifty 200 |nifty200momentum|nifty 200 momentum/.test(bench)) return 0;
  if (/midcap 150|midcap 100|nifty midcap/.test(bench))                return 1;
  if (/midsmallcap|mid small/.test(bench))                              return 1;
  if (/smallcap 250|smallcap 100|nifty smallcap/.test(bench))          return 2;
  if (/nifty 500|nifty500|bse 500|bse500|total market|multicap momentum/.test(bench)) return 3;
  if (bench.includes("alpha") && !/midcap|smallcap/.test(bench))       return 3;

  return null;
}

function shouldExclude(fund: AMFIFund): boolean {
  const cat = (fund.Category     || "").toLowerCase();
  const sub = (fund.Sub_Category || "").toLowerCase();

  // Allow equity + Index/ETF (Other category)
  if (cat === "equity") {
    return sub === "solution oriented - children's fund";
  }
  
  // EXPANDED: Include "Other" category IF it has equity benchmark
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
// NEW: Two-Tier Selection Logic
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
      candidateSubCategories: [],
    };
  }

  // STEP 1: Group funds by Sub_Category (or benchmark for passive)
  const subCategoryGroups: Record<string, AMFIFund[]> = {};
  
  cellFunds.forEach(fund => {
    const isPassive = fund.Sub_Category.toLowerCase() === "index / etf";
    const key = isPassive ? fund.benchmark : fund.Sub_Category;
    if (!subCategoryGroups[key]) subCategoryGroups[key] = [];
    subCategoryGroups[key].push(fund);
  });

  // STEP 2: Calculate performance for each sub-category
  const subCategoryPerformances: SubCategoryPerformance[] = [];

  Object.keys(subCategoryGroups).forEach(subCatKey => {
    const fundsInSubCat = subCategoryGroups[subCatKey];
    
    // Get alpha and beat rate for each fund in this sub-category
    let totalAlpha = 0;
    let totalBeatRate = 0;
    let fundCount = 0;
    let topFund: (FundAnalytics | ETFAnalytics) | null = null;
    let topScore = -1;

    fundsInSubCat.forEach(amfiFund => {
      // Try to find in fund analytics
      const activeFund = fundAnalytics.find(f => 
        f.Fund_Name.toLowerCase() === amfiFund.schemeName.toLowerCase()
      );
      
      if (activeFund) {
        totalAlpha += activeFund.Alpha_3Y || 0;
        fundCount++;
        
        // Get beat rate from insights
        const insight = insights.find(ins => 
          ins.Sub_Category_Name?.toLowerCase() === activeFund.Sub_Category.toLowerCase()
        );
        if (insight) {
          totalBeatRate += insight.Pct_Funds_Beating_Benchmark_3Y || 0;
        }
        
        if (activeFund.Composite_Score > topScore) {
          topScore = activeFund.Composite_Score;
          topFund = activeFund;
        }
        return;
      }

      // Try to find in ETF analytics
      const etfFund = etfAnalytics.find(e => 
        e.ETF_Name.toLowerCase() === amfiFund.schemeName.toLowerCase()
      );
      
      if (etfFund) {
        // For ETFs, use tracking diff as proxy for alpha (negative is better)
        totalAlpha += -(etfFund.Tracking_Diff_3Y || 0);
        fundCount++;
        
        // ETFs don't have beat rate concept, use 50% default
        totalBeatRate += 50;
        
        if (etfFund.ETF_Score > topScore) {
          topScore = etfFund.ETF_Score;
          topFund = etfFund;
        }
      }
    });

    if (fundCount > 0) {
      subCategoryPerformances.push({
        subCategoryName: subCatKey,
        fundCount: fundCount,
        avgAlpha: totalAlpha / fundCount,
        avgBeatRate: totalBeatRate / fundCount,
        topFundName: topFund ? ('Fund_Name' in topFund ? (topFund as FundAnalytics).Fund_Name : (topFund as ETFAnalytics).ETF_Name) : '',
        topFundScore: topScore
      });
    }
  });

  // STEP 3: Select leading sub-category (highest avg alpha, then beat rate)
  if (subCategoryPerformances.length === 0) {
    return {
      empty: true,
      leadingSubCategory: null,
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
  let bestScore = -1;
  let isActive = false;

  leadingFunds.forEach(amfiFund => {
    const activeFund = fundAnalytics.find(f => 
      f.Fund_Name.toLowerCase() === amfiFund.schemeName.toLowerCase()
    );
    
    if (activeFund && activeFund.Composite_Score > bestScore) {
      bestScore = activeFund.Composite_Score;
      bestFund = activeFund;
      isActive = true;
      return;
    }

    const etfFund = etfAnalytics.find(e => 
      e.ETF_Name.toLowerCase() === amfiFund.schemeName.toLowerCase()
    );
    
    if (etfFund && etfFund.ETF_Score > bestScore) {
      bestScore = etfFund.ETF_Score;
      bestFund = etfFund;
      isActive = false;
    }
  });

  // STEP 5: Decide ACTIVE vs INDEX (for non-Pure-Active columns)
  let decision: "ACTIVE" | "INDEX" = isActive ? "ACTIVE" : "INDEX";
  
  // For Pure Active column (col 3), force active
  if (col === 3 && !isActive) {
    // Try to find an active fund instead
    const activeFundsInCell = leadingFunds
      .map(af => fundAnalytics.find(f => f.Fund_Name.toLowerCase() === af.schemeName.toLowerCase()))
      .filter(Boolean) as FundAnalytics[];
    
    if (activeFundsInCell.length > 0) {
      bestFund = activeFundsInCell.sort((a, b) => b.Composite_Score - a.Composite_Score)[0];
      decision = "ACTIVE";
      isActive = true;
    }
  }

  return {
    empty: false,
    leadingSubCategory: leadingSubCat.subCategoryName,
    candidateSubCategories: subCategoryPerformances,
    decision,
    selectedFund: bestFund,
    audit: {
      sizeReason: `Row ${row}: Size match`,
      styleReason: `Col ${col}: Style match`,
      winnerReason: `Best ${decision} fund in leading sub-category "${leadingSubCat.subCategoryName}"`
    }
  };
}

// ──────────────────────────────────────────────────────────────
// UI COMPONENTS (UNCHANGED)
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

function GridCell({ box }: { box: BoxResult }) {
  if (box.empty) {
    return (
      <div className="text-center text-[#9CA3AF] py-4">
        <div className="text-2xl mb-1">📋</div>
        <div className="text-[10px]">No funds match</div>
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
  const alpha = 'Alpha_3Y' in fund ? (fund.Alpha_3Y || 0) : -((fund as ETFAnalytics).Tracking_Diff_3Y || 0);
  const isActive = box.decision === "ACTIVE";

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
      
      {/* SUB-CATEGORY NAME - PROMINENT */}
      <div className="font-bold text-[#1F2937] mb-1 text-sm leading-tight">
        {box.leadingSubCategory}
      </div>
      
      {/* FUND NAME - SMALLER */}
      <div className="text-[10px] text-[#6B7280] mb-2 leading-snug">
        {fundName}
      </div>
      
      <div className="text-[9px] text-[#9CA3AF]">
        α {alpha.toFixed(1)}%
      </div>
    </div>
  );
}

function AuditModal({ box, onClose }: { box: BoxResult; onClose: () => void }) {
  if (box.empty) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        
        <div className="p-6 border-b border-[#E5E7EB]">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#1F2937]">Selection Audit Trail</h2>
            <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#6B7280] text-3xl leading-none">×</button>
          </div>
        </div>

        <div className="p-6">
          {/* Selected Fund */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#1F2937] mb-3">Selected Fund</h3>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{box.decision === "ACTIVE" ? "🎯" : "📊"}</span>
                <span className="font-bold text-[#1F2937]">
                  {box.selectedFund ? ('Fund_Name' in box.selectedFund ? box.selectedFund.Fund_Name : box.selectedFund.ETF_Name) : 'N/A'}
                </span>
              </div>
              <div className="text-sm text-[#6B7280]">
                Sub-Category: <strong>{box.leadingSubCategory}</strong>
              </div>
              <div className="text-sm text-[#6B7280] mt-1">
                Decision: <strong>{box.decision}</strong>
              </div>
            </div>
          </div>

          {/* All Evaluated Sub-Categories */}
          <div>
            <h3 className="text-lg font-semibold text-[#1F2937] mb-3">
              All Evaluated Sub-Categories
            </h3>
            <div className="space-y-3">
              {box.candidateSubCategories.map((subCat, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${
                    subCat.subCategoryName === box.leadingSubCategory
                      ? 'bg-green-50 border-green-300'
                      : 'bg-[#F9FAFB] border-[#E5E7EB]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-[#1F2937]">
                      {subCat.subCategoryName}
                      {subCat.subCategoryName === box.leadingSubCategory && (
                        <span className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded">
                          WINNER
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#6B7280]">
                      {subCat.fundCount} funds
                    </div>
                  </div>
                  <div className="text-sm text-[#6B7280]">
                    Avg Alpha: <strong>{subCat.avgAlpha.toFixed(2)}%</strong> | 
                    Avg Beat Rate: <strong>{subCat.avgBeatRate.toFixed(0)}%</strong>
                  </div>
                  <div className="text-xs text-[#9CA3AF] mt-1">
                    Top Fund: {subCat.topFundName}
                  </div>
                </div>
              ))}
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
                  <GridCell box={boxes[rowIdx][colIdx]} />
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
  const [activeTab, setActiveTab]           = useState<"equity" | "hybrid" | "debt">("equity");

  useEffect(() => {
    async function load() {
      try {
        const [amfiRaw, fundAnalytics, etfAnalytics, insights] = await Promise.all([
          fetch("/api/amfi-raw").then(r => r.json()),
          fetch("/api/funds").then(r    => r.json()),
          fetch("/api/etfs").then(r     => r.json()),
          fetch("/api/insights").then(r => r.json()),
        ]);

        // Build the 4×4 classification grid
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

        // Build boxes with two-tier logic
        const newBoxes: BoxResult[][] = [];
        for (let r = 0; r < 4; r++) {
          const rowBoxes: BoxResult[] = [];
          for (let c = 0; c < 4; c++) {
            rowBoxes.push(buildBox(r, c, gridMap[r][c], fundAnalytics, etfAnalytics, insights));
          }
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
    <div className="min-h-screen bg-[#F5F8FF] text-[#1F2937]">

      {/* NAV */}
      <div className="sticky top-0 z-30 bg-[#F5F8FF]/95 backdrop-blur-md border-b border-[#DDE6F3]">
        <div className="max-w-7xl mx-auto"><AnalysisTabs /></div>
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
            We analyze <strong>558+ equity funds</strong> and equity-linked passive funds to find 
            <strong> leading sub-categories</strong> and <strong>top performers</strong>.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-8">
            <Stat label="Funds Analyzed" value="558+" />
            <Stat label="Sub-Categories" value="16" />
            <Stat label="Data Points" value="10K+" />
          </div>
        </div>
      </section>

      {/* MATRIX SECTION */}
      <section className="px-6 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <SectionNum num="1" label="Equity Matrix" />
            
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
                <span>Active — managers beating index</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">📊</span>
                <span>Index / ETF — lowest tracking error</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">ℹ️</span>
                <span>Click any cell for full audit trail</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AUDIT MODAL */}
      {modalBox && <AuditModal box={modalBox} onClose={() => setModalBox(null)} />}
    </div>
  );
}