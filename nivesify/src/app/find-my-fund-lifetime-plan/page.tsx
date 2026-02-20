"use client";

import AnalysisTabs from "@/components/AnalysisTabs";
import React, { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES — identical to single-goal page
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

type ExposureBlockType =
  | "Capital Safety"
  | "Stability"
  | "Balanced Equity"
  | "Core Equity"
  | "High Growth"
  | "Tactical";

type MatrixCell = {
  matrix: "equity" | "hybrid" | "debt";
  row: number;
  col: number;
  label: string;
  allocationPct: number;
};

type ExposureBlock = {
  type: ExposureBlockType;
  pct: number;
  emoji: string;
  description: string;
  color: string;
  bg: string;
  border: string;
  cells: MatrixCell[];
};

type AllocationPlan = {
  timeBucket: "0-2Y" | "2-5Y" | "5-10Y" | "10Y+";
  riskIntensity: "Conservative" | "Balanced" | "Growth" | "Aggressive";
  blocks: ExposureBlock[];
  label: string;
  plainEnglish: string;
  expectedReturnLo: number;
  expectedReturnHi: number;
  maxDrawdown: number;
  successRate: number;
  suggestedMonthlySIP: number;
};

type ResolvedFundSlot = {
  exposureBlock: ExposureBlockType;
  blockColor: string;
  blockBg: string;
  blockBorder: string;
  blockPct: number;
  cellLabel: string;
  cellAllocationPct: number;
  box: BoxResult;
  fundName: string;
  isActive: boolean;
  subCategory: string | null;
  stats: BoxResult["fundStats"];
};

// ─────────────────────────────────────────────────────────────────────────────
// MULTI-GOAL TYPES
// ─────────────────────────────────────────────────────────────────────────────

type GoalInput = {
  id: string;
  emoji: string;
  label: string;
  targetLakh: string;
  horizonYears: string;
  riskScore: number;
  priority: "essential" | "important" | "aspirational";
};

type GoalStatus = "active" | "achieved" | "upcoming";

type YearSnapshot = {
  year: number;
  activeGoals: string[];  // goal ids still active
  achievedGoals: string[]; // goal ids just achieved this year
  totalSIP: number;
  blocks: ExposureBlock[];
  equityPct: number;
  debtPct: number;
  hybridPct: number;
  label: string;
};

type LifetimePlan = {
  goals: GoalInput[];
  totalYears: number;
  timeline: YearSnapshot[];
  totalMonthlySIP: number;
  phaseDescriptions: PhaseDescription[];
  resolvedFundsByPhase: Map<string, ResolvedFundSlot[]>;
};

type PhaseDescription = {
  fromYear: number;
  toYear: number;
  label: string;
  description: string;
  activeGoalLabels: string[];
  plan: AllocationPlan;
  totalSIP: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// GOAL PRESETS
// ─────────────────────────────────────────────────────────────────────────────

const GOAL_TEMPLATES = [
  { emoji: "🛡️", label: "Emergency Fund",    targetLakh: "5",   horizonYears: "1",  riskScore: 2, priority: "essential"    as const, tip: "3-6 months of expenses parked safely" },
  { emoji: "✈️", label: "Dream Vacation",     targetLakh: "3",   horizonYears: "2",  riskScore: 3, priority: "aspirational" as const, tip: "International trip you've been planning" },
  { emoji: "🚗", label: "Buy a Car",           targetLakh: "10",  horizonYears: "3",  riskScore: 4, priority: "important"    as const, tip: "Down payment or full purchase" },
  { emoji: "💒", label: "Wedding Fund",        targetLakh: "20",  horizonYears: "4",  riskScore: 4, priority: "important"    as const, tip: "A wedding you'll always remember" },
  { emoji: "🏠", label: "Home Down Payment",   targetLakh: "30",  horizonYears: "6",  riskScore: 5, priority: "essential"    as const, tip: "20% of a ₹1.5Cr flat" },
  { emoji: "👶", label: "Child's Education",   targetLakh: "50",  horizonYears: "12", riskScore: 6, priority: "essential"    as const, tip: "Fund a professional degree" },
  { emoji: "💍", label: "Child's Wedding",     targetLakh: "40",  horizonYears: "18", riskScore: 5, priority: "important"    as const, tip: "A gift they'll never forget" },
  { emoji: "🌴", label: "Retirement",          targetLakh: "500", horizonYears: "25", riskScore: 6, priority: "essential"    as const, tip: "Build a comfortable retirement corpus" },
  { emoji: "🏖️", label: "Second Home",        targetLakh: "80",  horizonYears: "10", riskScore: 6, priority: "aspirational" as const, tip: "A holiday home or rental property" },
  { emoji: "🎓", label: "Higher Education",    targetLakh: "15",  horizonYears: "5",  riskScore: 5, priority: "important"    as const, tip: "MBA or professional certification" },
];

const PRIORITY_CONFIG = {
  essential:    { label: "Essential",    color: "#DC2626", bg: "#FEF2F2", border: "#FECACA",  desc: "Must achieve — plan built around this" },
  important:    { label: "Important",    color: "#D97706", bg: "#FFFBEB", border: "#FDE68A",  desc: "High priority — significant trade-offs made" },
  aspirational: { label: "Aspirational", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", desc: "Nice to have — first to reduce if SIP is stretched" },
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE HELPERS — copied exactly from single-goal page
// ─────────────────────────────────────────────────────────────────────────────

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

const DEBT_CELL_MAP: Record<string, [number, number][]> = {
  "Overnight": [[0,0]], "Liquid": [[0,0]], "Ultra Short Duration": [[0,0]], "Money Market": [[0,0]],
  "Low Duration": [[1,0]], "Short Duration": [[1,0]], "Banking & PSU": [[1,0],[2,0]], "Corporate Bond": [[1,0],[2,0]],
  "Medium Duration": [[2,1]], "Gilt": [[2,0],[3,0]], "Long Duration": [[3,0]], "Dynamic Bond": [[3,0]],
  "Credit Risk": [[1,2],[2,2],[3,2]], "Medium to Long Duration": [[3,1]],
};

const HYBRID_ORDER = ["Aggressive Hybrid","Conservative Hybrid","Equity Savings","Arbitrage","Multi Asset Allocation","Balanced Advantage","Balanced Hybrid"];

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
    let topFund: (FundAnalytics | ETFAnalytics) | null = null; let topRank = 999999;
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
      rank: topRank,
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
    aum: 'Current_AUM' in bestFund ? (bestFund as FundAnalytics).Current_AUM : (bestFund as ETFAnalytics).Fund_AUM,
  } : undefined;
  return { empty: false, leadingSubCategory: leadingSubCat.subCategoryName, allConsideredSubCategories: Array.from(allConsideredSubCategories), candidateSubCategories: subCategoryPerformances, decision, selectedFund: bestFund, fundStats };
}

// ─────────────────────────────────────────────────────────────────────────────
// SINGLE-GOAL ENGINE — same as quick-picks page
// ─────────────────────────────────────────────────────────────────────────────

function computeAllocationPlan(horizonYears: number, riskScore: number, targetAmount: number): AllocationPlan {
  const timeBucket: AllocationPlan["timeBucket"] =
    horizonYears <= 2 ? "0-2Y" : horizonYears <= 5 ? "2-5Y" : horizonYears <= 10 ? "5-10Y" : "10Y+";
  const riskIntensity: AllocationPlan["riskIntensity"] =
    riskScore <= 3 ? "Conservative" : riskScore <= 5 ? "Balanced" : riskScore <= 7 ? "Growth" : "Aggressive";

  let blocks: ExposureBlock[] = [];

  if (timeBucket === "0-2Y") {
    if (riskIntensity === "Conservative") {
      blocks = [
        { type: "Capital Safety", pct: 70, emoji: "🛡️", description: "Most of your money in high-quality short-term bond funds.", color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC", cells: [{ matrix:"debt",row:0,col:0,label:"Overnight / Liquid",allocationPct:40 },{ matrix:"debt",row:1,col:0,label:"Short Duration Bonds",allocationPct:30 }]},
        { type: "Stability", pct: 25, emoji: "⚓", description: "Conservative hybrids to add modest return above pure debt.", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", cells: [{ matrix:"hybrid",row:1,col:0,label:"Conservative Hybrid",allocationPct:25 }]},
        { type: "Core Equity", pct: 5, emoji: "📈", description: "Minimal equity to marginally beat inflation.", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", cells: [{ matrix:"equity",row:0,col:1,label:"Large Cap Core",allocationPct:5 }]},
      ];
    } else if (riskIntensity === "Balanced") {
      blocks = [
        { type: "Capital Safety", pct: 55, emoji: "🛡️", description: "More than half in safe short-term debt.", color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC", cells: [{ matrix:"debt",row:0,col:0,label:"Liquid / Ultra Short",allocationPct:30 },{ matrix:"debt",row:1,col:0,label:"Short Duration Bonds",allocationPct:25 }]},
        { type: "Stability", pct: 30, emoji: "⚓", description: "Conservative and balanced hybrid for some upside.", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", cells: [{ matrix:"hybrid",row:1,col:0,label:"Conservative Hybrid",allocationPct:15 },{ matrix:"hybrid",row:5,col:0,label:"Balanced Advantage Fund",allocationPct:15 }]},
        { type: "Core Equity", pct: 15, emoji: "📈", description: "Large-cap for mild growth participation.", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", cells: [{ matrix:"equity",row:0,col:1,label:"Large Cap Core",allocationPct:15 }]},
      ];
    } else {
      blocks = [
        { type: "Capital Safety", pct: 40, emoji: "🛡️", description: "Base safety layer in liquid funds.", color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC", cells: [{ matrix:"debt",row:0,col:0,label:"Liquid / Money Market",allocationPct:20 },{ matrix:"debt",row:1,col:0,label:"Short Duration Bonds",allocationPct:20 }]},
        { type: "Balanced Equity", pct: 35, emoji: "⚖️", description: "Balanced and aggressive hybrid for growth-safety balance.", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", cells: [{ matrix:"hybrid",row:5,col:0,label:"Balanced Advantage Fund",allocationPct:20 },{ matrix:"hybrid",row:0,col:0,label:"Aggressive Hybrid",allocationPct:15 }]},
        { type: "Core Equity", pct: 25, emoji: "📈", description: "Large-cap equity for market participation.", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", cells: [{ matrix:"equity",row:0,col:1,label:"Large Cap Core",allocationPct:15 },{ matrix:"equity",row:0,col:0,label:"Large Cap Value",allocationPct:10 }]},
      ];
    }
  } else if (timeBucket === "2-5Y") {
    if (riskIntensity === "Conservative") {
      blocks = [
        { type: "Stability", pct: 45, emoji: "⚓", description: "Conservative and equity savings for steady income.", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", cells: [{ matrix:"hybrid",row:1,col:0,label:"Conservative Hybrid",allocationPct:25 },{ matrix:"hybrid",row:2,col:0,label:"Equity Savings Fund",allocationPct:20 }]},
        { type: "Capital Safety", pct: 30, emoji: "🛡️", description: "Medium-term bond funds for predictable returns.", color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC", cells: [{ matrix:"debt",row:1,col:0,label:"Corporate Bond / Banking PSU",allocationPct:30 }]},
        { type: "Core Equity", pct: 25, emoji: "📈", description: "Large-cap core and value for managed equity risk.", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", cells: [{ matrix:"equity",row:0,col:1,label:"Large Cap Core",allocationPct:15 },{ matrix:"equity",row:0,col:0,label:"Large Cap Value",allocationPct:10 }]},
      ];
    } else if (riskIntensity === "Balanced") {
      blocks = [
        { type: "Balanced Equity", pct: 40, emoji: "⚖️", description: "Balanced advantage and aggressive hybrid as growth-safety bridge.", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", cells: [{ matrix:"hybrid",row:5,col:0,label:"Balanced Advantage Fund",allocationPct:25 },{ matrix:"hybrid",row:0,col:0,label:"Aggressive Hybrid",allocationPct:15 }]},
        { type: "Stability", pct: 25, emoji: "⚓", description: "Corporate bonds as stability anchor.", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", cells: [{ matrix:"debt",row:1,col:0,label:"Corporate Bond / Short Duration",allocationPct:25 }]},
        { type: "Core Equity", pct: 35, emoji: "📈", description: "Diversified equity across large, flexi and value styles.", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", cells: [{ matrix:"equity",row:0,col:1,label:"Large Cap Core",allocationPct:15 },{ matrix:"equity",row:3,col:1,label:"Flexi Cap",allocationPct:12 },{ matrix:"equity",row:0,col:0,label:"Large Cap Value",allocationPct:8 }]},
      ];
    } else if (riskIntensity === "Growth") {
      blocks = [
        { type: "Core Equity", pct: 45, emoji: "📈", description: "Broad equity diversification across size and style.", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", cells: [{ matrix:"equity",row:0,col:1,label:"Large Cap Core",allocationPct:20 },{ matrix:"equity",row:3,col:1,label:"Flexi Cap",allocationPct:15 },{ matrix:"equity",row:0,col:0,label:"Large Cap Value",allocationPct:10 }]},
        { type: "Balanced Equity", pct: 30, emoji: "⚖️", description: "Multi-asset and aggressive hybrid for flexibility.", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", cells: [{ matrix:"hybrid",row:4,col:0,label:"Multi Asset Allocation",allocationPct:15 },{ matrix:"hybrid",row:0,col:0,label:"Aggressive Hybrid",allocationPct:15 }]},
        { type: "Stability", pct: 25, emoji: "⚓", description: "Corporate bonds as ballast.", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", cells: [{ matrix:"debt",row:1,col:0,label:"Corporate Bond / Banking PSU",allocationPct:25 }]},
      ];
    } else {
      blocks = [
        { type: "Core Equity", pct: 40, emoji: "📈", description: "Large and flexi cap for core equity exposure.", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", cells: [{ matrix:"equity",row:0,col:1,label:"Large Cap Core",allocationPct:20 },{ matrix:"equity",row:3,col:1,label:"Flexi Cap",allocationPct:20 }]},
        { type: "High Growth", pct: 25, emoji: "🚀", description: "Mid-cap for higher return potential.", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", cells: [{ matrix:"equity",row:1,col:1,label:"Mid Cap",allocationPct:25 }]},
        { type: "Tactical", pct: 20, emoji: "⚡", description: "Momentum and aggressive hybrid for tactical alpha.", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", cells: [{ matrix:"equity",row:0,col:2,label:"Momentum",allocationPct:10 },{ matrix:"hybrid",row:0,col:0,label:"Aggressive Hybrid",allocationPct:10 }]},
        { type: "Stability", pct: 15, emoji: "⚓", description: "Short-duration bonds as safety cushion.", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", cells: [{ matrix:"debt",row:1,col:0,label:"Short Duration Bonds",allocationPct:15 }]},
      ];
    }
  } else if (timeBucket === "5-10Y") {
    if (riskIntensity === "Conservative") {
      blocks = [
        { type: "Core Equity", pct: 40, emoji: "📈", description: "Diversified large, value and flexi — equity over 5 years has strong historical record.", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", cells: [{ matrix:"equity",row:0,col:1,label:"Large Cap Core",allocationPct:20 },{ matrix:"equity",row:0,col:0,label:"Large Cap Value",allocationPct:10 },{ matrix:"equity",row:3,col:1,label:"Flexi Cap",allocationPct:10 }]},
        { type: "Balanced Equity", pct: 25, emoji: "⚖️", description: "Balanced advantage dynamically manages equity-debt ratio.", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", cells: [{ matrix:"hybrid",row:5,col:0,label:"Balanced Advantage Fund",allocationPct:15 },{ matrix:"hybrid",row:1,col:0,label:"Conservative Hybrid",allocationPct:10 }]},
        { type: "Stability", pct: 35, emoji: "⚓", description: "Medium-duration bonds provide predictable returns.", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", cells: [{ matrix:"debt",row:1,col:0,label:"Corporate Bond",allocationPct:20 },{ matrix:"debt",row:2,col:0,label:"Medium Duration Bonds",allocationPct:15 }]},
      ];
    } else if (riskIntensity === "Balanced") {
      blocks = [
        { type: "Core Equity", pct: 50, emoji: "📈", description: "Diversified equity across three styles.", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", cells: [{ matrix:"equity",row:0,col:1,label:"Large Cap Core",allocationPct:20 },{ matrix:"equity",row:3,col:1,label:"Flexi Cap",allocationPct:18 },{ matrix:"equity",row:0,col:0,label:"Large Cap Value",allocationPct:12 }]},
        { type: "Balanced Equity", pct: 25, emoji: "⚖️", description: "Multi-asset and balanced advantage for tactical balance.", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", cells: [{ matrix:"hybrid",row:4,col:0,label:"Multi Asset Allocation",allocationPct:15 },{ matrix:"hybrid",row:5,col:0,label:"Balanced Advantage Fund",allocationPct:10 }]},
        { type: "Stability", pct: 25, emoji: "⚓", description: "Corporate bonds to anchor the portfolio.", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", cells: [{ matrix:"debt",row:1,col:0,label:"Corporate Bond / Banking PSU",allocationPct:25 }]},
      ];
    } else if (riskIntensity === "Growth") {
      blocks = [
        { type: "Core Equity", pct: 45, emoji: "📈", description: "Style-diversified equity across large, value, and flexi cap.", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", cells: [{ matrix:"equity",row:0,col:1,label:"Large Cap Core",allocationPct:18 },{ matrix:"equity",row:3,col:1,label:"Flexi Cap",allocationPct:17 },{ matrix:"equity",row:0,col:0,label:"Large Cap Value",allocationPct:10 }]},
        { type: "High Growth", pct: 20, emoji: "🚀", description: "Mid-cap for meaningful return premium.", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", cells: [{ matrix:"equity",row:1,col:1,label:"Mid Cap",allocationPct:20 }]},
        { type: "Tactical", pct: 15, emoji: "⚡", description: "Momentum and multi-asset for alpha generation.", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", cells: [{ matrix:"equity",row:0,col:2,label:"Momentum",allocationPct:8 },{ matrix:"hybrid",row:4,col:0,label:"Multi Asset Allocation",allocationPct:7 }]},
        { type: "Stability", pct: 20, emoji: "⚓", description: "Corporate bonds as stability anchor.", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", cells: [{ matrix:"debt",row:1,col:0,label:"Corporate Bond",allocationPct:20 }]},
      ];
    } else {
      blocks = [
        { type: "Core Equity", pct: 40, emoji: "📈", description: "Large and flexi cap — the foundation.", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", cells: [{ matrix:"equity",row:0,col:1,label:"Large Cap Core",allocationPct:20 },{ matrix:"equity",row:3,col:1,label:"Flexi Cap",allocationPct:20 }]},
        { type: "High Growth", pct: 30, emoji: "🚀", description: "Mid and small cap for high-conviction upside.", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", cells: [{ matrix:"equity",row:1,col:1,label:"Mid Cap",allocationPct:18 },{ matrix:"equity",row:2,col:1,label:"Small Cap",allocationPct:12 }]},
        { type: "Tactical", pct: 20, emoji: "⚡", description: "Momentum and aggressive hybrid for return boosting.", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", cells: [{ matrix:"equity",row:0,col:2,label:"Momentum",allocationPct:12 },{ matrix:"hybrid",row:0,col:0,label:"Aggressive Hybrid",allocationPct:8 }]},
        { type: "Stability", pct: 10, emoji: "⚓", description: "Minimal debt buffer.", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", cells: [{ matrix:"debt",row:1,col:0,label:"Corporate Bond",allocationPct:10 }]},
      ];
    }
  } else {
    if (riskIntensity === "Conservative") {
      blocks = [
        { type: "Core Equity", pct: 50, emoji: "📈", description: "Compounding engine — diversified large, value, and flexi cap.", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", cells: [{ matrix:"equity",row:0,col:1,label:"Large Cap Core",allocationPct:22 },{ matrix:"equity",row:3,col:1,label:"Flexi Cap",allocationPct:18 },{ matrix:"equity",row:0,col:0,label:"Large Cap Value",allocationPct:10 }]},
        { type: "Balanced Equity", pct: 25, emoji: "⚖️", description: "Balanced advantage and multi-asset as path-smoother.", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", cells: [{ matrix:"hybrid",row:5,col:0,label:"Balanced Advantage Fund",allocationPct:15 },{ matrix:"hybrid",row:4,col:0,label:"Multi Asset Allocation",allocationPct:10 }]},
        { type: "Stability", pct: 25, emoji: "⚓", description: "Medium-duration bonds for stability.", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", cells: [{ matrix:"debt",row:1,col:0,label:"Corporate Bond",allocationPct:15 },{ matrix:"debt",row:2,col:0,label:"Medium Duration",allocationPct:10 }]},
      ];
    } else if (riskIntensity === "Balanced") {
      blocks = [
        { type: "Core Equity", pct: 55, emoji: "📈", description: "Three-style equity diversification — the long-term compounding core.", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", cells: [{ matrix:"equity",row:0,col:1,label:"Large Cap Core",allocationPct:22 },{ matrix:"equity",row:3,col:1,label:"Flexi Cap",allocationPct:20 },{ matrix:"equity",row:0,col:0,label:"Large Cap Value",allocationPct:13 }]},
        { type: "High Growth", pct: 20, emoji: "🚀", description: "Mid-cap for long-horizon return premium.", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", cells: [{ matrix:"equity",row:1,col:1,label:"Mid Cap",allocationPct:20 }]},
        { type: "Stability", pct: 25, emoji: "⚓", description: "Corporate and medium-duration bonds to reduce volatility.", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", cells: [{ matrix:"debt",row:1,col:0,label:"Corporate Bond",allocationPct:15 },{ matrix:"debt",row:2,col:0,label:"Medium Duration",allocationPct:10 }]},
      ];
    } else if (riskIntensity === "Growth") {
      blocks = [
        { type: "Core Equity", pct: 45, emoji: "📈", description: "Broad equity — style diversification reduces factor concentration risk.", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", cells: [{ matrix:"equity",row:0,col:1,label:"Large Cap Core",allocationPct:18 },{ matrix:"equity",row:3,col:1,label:"Flexi Cap",allocationPct:17 },{ matrix:"equity",row:0,col:0,label:"Large Cap Value",allocationPct:10 }]},
        { type: "High Growth", pct: 30, emoji: "🚀", description: "Mid + small cap for long-term compounding upside.", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", cells: [{ matrix:"equity",row:1,col:1,label:"Mid Cap",allocationPct:18 },{ matrix:"equity",row:2,col:1,label:"Small Cap",allocationPct:12 }]},
        { type: "Tactical", pct: 10, emoji: "⚡", description: "Momentum as a return booster.", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", cells: [{ matrix:"equity",row:0,col:2,label:"Momentum",allocationPct:10 }]},
        { type: "Stability", pct: 15, emoji: "⚓", description: "Small bond allocation for volatility dampening.", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", cells: [{ matrix:"debt",row:1,col:0,label:"Corporate Bond",allocationPct:15 }]},
      ];
    } else {
      blocks = [
        { type: "Core Equity", pct: 40, emoji: "📈", description: "Large and flexi cap — foundational equity.", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", cells: [{ matrix:"equity",row:0,col:1,label:"Large Cap Core",allocationPct:20 },{ matrix:"equity",row:3,col:1,label:"Flexi Cap",allocationPct:20 }]},
        { type: "High Growth", pct: 35, emoji: "🚀", description: "Mid + small cap for maximum compounding over 10+ years.", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", cells: [{ matrix:"equity",row:1,col:1,label:"Mid Cap",allocationPct:20 },{ matrix:"equity",row:2,col:1,label:"Small Cap",allocationPct:15 }]},
        { type: "Tactical", pct: 15, emoji: "⚡", description: "Momentum + manager's best bets for alpha-seeking exposure.", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", cells: [{ matrix:"equity",row:0,col:2,label:"Momentum",allocationPct:8 },{ matrix:"equity",row:3,col:3,label:"Manager's Best Bets",allocationPct:7 }]},
        { type: "Stability", pct: 10, emoji: "⚓", description: "Minimal debt buffer for liquidity.", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", cells: [{ matrix:"debt",row:1,col:0,label:"Corporate Bond",allocationPct:10 }]},
      ];
    }
  }

  const blockReturnMap: Record<ExposureBlockType, { lo: number; hi: number }> = {
    "Capital Safety":  { lo: 5.5, hi: 7.5 },
    "Stability":       { lo: 7.0, hi: 9.0 },
    "Balanced Equity": { lo: 9.0, hi: 12.0 },
    "Core Equity":     { lo: 11.0, hi: 15.0 },
    "High Growth":     { lo: 13.0, hi: 18.0 },
    "Tactical":        { lo: 12.0, hi: 17.0 },
  };

  let lo = 0, hi = 0;
  blocks.forEach(b => { lo += (b.pct/100)*blockReturnMap[b.type].lo; hi += (b.pct/100)*blockReturnMap[b.type].hi; });

  const equityPct = blocks.filter(b => ["Core Equity","High Growth","Tactical"].includes(b.type)).reduce((s,b) => s+b.pct, 0);
  const hybridPct = blocks.filter(b => b.type === "Balanced Equity").reduce((s,b) => s+b.pct, 0);
  const maxDrawdown = -Math.round(equityPct*0.42 + hybridPct*0.18);

  const successRate = timeBucket==="0-2Y" ? (riskIntensity==="Conservative" ? 94 : 85)
    : timeBucket==="2-5Y" ? (riskIntensity==="Conservative" ? 88 : riskIntensity==="Balanced" ? 84 : 80)
    : timeBucket==="5-10Y" ? (riskIntensity==="Conservative" ? 86 : riskIntensity==="Aggressive" ? 89 : 85)
    : riskIntensity==="Aggressive" ? 91 : 88;

  const midRate = (lo + hi) / 2;
  const r = midRate / 100 / 12;
  const n = horizonYears * 12;
  const sipFV = r===0 ? 0 : ((Math.pow(1+r,n)-1)/r)*(1+r);
  const suggestedMonthlySIP = sipFV > 0 ? Math.ceil(targetAmount/sipFV/100)*100 : Math.ceil(targetAmount/n/100)*100;

  const label = `${riskIntensity} ${timeBucket==="0-2Y"?"Short-term":timeBucket==="2-5Y"?"Medium-term":timeBucket==="5-10Y"?"Growth-horizon":"Long-term"}`;
  const plainEnglish = "";

  return { timeBucket, riskIntensity, blocks, label, plainEnglish, expectedReturnLo: parseFloat(lo.toFixed(1)), expectedReturnHi: parseFloat(hi.toFixed(1)), maxDrawdown: parseFloat(maxDrawdown.toFixed(1)), successRate, suggestedMonthlySIP };
}

function resolveAllFunds(
  plan: AllocationPlan, amfiRaw: AMFIFund[], fundAnalytics: FundAnalytics[], etfAnalytics: ETFAnalytics[], insights: InsightRow[]
): ResolvedFundSlot[] {
  const results: ResolvedFundSlot[] = [];
  const seenFunds = new Set<string>();
  const equityGridMap: AMFIFund[][][] = Array.from({length:4},()=>Array.from({length:4},()=>[]));
  for (const fund of amfiRaw) {
    if (shouldExclude(fund)) continue;
    const col = getStyle(fund); const row = getSize(fund);
    if (row !== null) equityGridMap[row][col].push(fund);
  }
  const hybridFunds = amfiRaw.filter(f => f.Category === "Hybrid");
  const hybridBySubCat: Record<string, AMFIFund[]> = {};
  hybridFunds.forEach(f => { if (!hybridBySubCat[f.Sub_Category]) hybridBySubCat[f.Sub_Category]=[]; hybridBySubCat[f.Sub_Category].push(f); });
  const debtGridMap: AMFIFund[][][] = Array.from({length:4},()=>Array.from({length:3},()=>[]));
  for (const fund of amfiRaw) {
    if (fund.Category !== "Debt") continue;
    if (DEBT_CELL_MAP[fund.Sub_Category]) DEBT_CELL_MAP[fund.Sub_Category].forEach(([r,c]) => debtGridMap[r][c].push(fund));
  }
  for (const block of plan.blocks) {
    for (const cell of block.cells) {
      let cellFunds: AMFIFund[] = [];
      if (cell.matrix==="equity") cellFunds = equityGridMap[cell.row]?.[cell.col] || [];
      else if (cell.matrix==="hybrid") { const subCatName=HYBRID_ORDER[cell.row]; cellFunds=hybridBySubCat[subCatName]||[]; }
      else if (cell.matrix==="debt") cellFunds = debtGridMap[cell.row]?.[cell.col] || [];
      const box = buildBox(cell.row,cell.col,cellFunds,fundAnalytics,etfAnalytics,insights);
      if (!box.empty && box.selectedFund) {
        const fundName = 'Fund_Name' in box.selectedFund ? box.selectedFund.Fund_Name : (box.selectedFund as ETFAnalytics).ETF_Name;
        if (seenFunds.has(fundName)) continue;
        seenFunds.add(fundName);
        results.push({ exposureBlock:block.type, blockColor:block.color, blockBg:block.bg, blockBorder:block.border, blockPct:block.pct, cellLabel:cell.label, cellAllocationPct:cell.allocationPct, box, fundName, isActive:box.decision==="ACTIVE", subCategory:box.leadingSubCategory, stats:box.fundStats });
      }
    }
  }
  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// MULTI-GOAL LIFETIME ENGINE
// ─────────────────────────────────────────────────────────────────────────────

function buildLifetimePlan(goals: GoalInput[], amfiRaw: AMFIFund[], fundAnalytics: FundAnalytics[], etfAnalytics: ETFAnalytics[], insights: InsightRow[]): LifetimePlan {
  const sortedGoals = [...goals].sort((a, b) => parseInt(a.horizonYears) - parseInt(b.horizonYears));
  const totalYears = Math.max(...goals.map(g => parseInt(g.horizonYears)));

  // Build timeline snapshots at key transition years
  const transitionYears = Array.from(new Set([0, ...goals.map(g => parseInt(g.horizonYears))])).sort((a,b)=>a-b);

  const timeline: YearSnapshot[] = [];
  const phases: PhaseDescription[] = [];
  const resolvedFundsByPhase = new Map<string, ResolvedFundSlot[]>();

  // For each phase between transitions
  for (let i = 0; i < transitionYears.length; i++) {
    const year = transitionYears[i];

    // Which goals are still active at this year (not yet achieved)
    const activeGoalIds = goals.filter(g => parseInt(g.horizonYears) > year).map(g => g.id);
    const achievedThisYear = goals.filter(g => parseInt(g.horizonYears) === year).map(g => g.id);
    const activeGoals = goals.filter(g => activeGoalIds.includes(g.id));

    if (activeGoals.length === 0 && year > 0) {
      // All goals achieved
      timeline.push({
        year, activeGoals: [], achievedGoals: achievedThisYear,
        totalSIP: 0, blocks: [], equityPct: 0, debtPct: 0, hybridPct: 0,
        label: "All goals achieved 🎉",
      });
      break;
    }

    // Weighted risk: essential goals dominate, aspirational goals reduce weight
    const priorityWeights = { essential: 1.5, important: 1.0, aspirational: 0.6 };
    let weightedRisk = 0, totalWeight = 0;
    activeGoals.forEach(g => {
      const w = priorityWeights[g.priority];
      weightedRisk += g.riskScore * w;
      totalWeight += w;
    });
    const blendedRisk = totalWeight > 0 ? weightedRisk / totalWeight : 5;

    // Horizon is the SHORTEST remaining active goal (most conservative wins for portfolio safety)
    const minHorizon = Math.min(...activeGoals.map(g => parseInt(g.horizonYears) - year));
    // But temper: if min horizon is short but there are long-horizon goals, average them
    const avgHorizon = activeGoals.reduce((s, g) => s + (parseInt(g.horizonYears) - year), 0) / activeGoals.length;
    // Use weighted blend: 60% min (safety) + 40% avg (opportunity)
    const effectiveHorizon = Math.max(1, Math.round(minHorizon * 0.6 + avgHorizon * 0.4));

    // Compute per-goal SIPs, then sum
    let totalSIP = 0;
    activeGoals.forEach(g => {
      const remaining = parseInt(g.horizonYears) - year;
      const target = parseFloat(g.targetLakh) * 100000;
      const plan = computeAllocationPlan(remaining, g.riskScore, target);
      // Weight by priority
      const priorityMultiplier = g.priority === "essential" ? 1.0 : g.priority === "important" ? 0.9 : 0.8;
      totalSIP += plan.suggestedMonthlySIP * priorityMultiplier;
    });
    totalSIP = Math.ceil(totalSIP / 100) * 100;

    // Compute blended allocation plan
    const blendedPlan = computeAllocationPlan(effectiveHorizon, Math.round(blendedRisk), 100000);

    // Calculate aggregate bucket percentages for visualisation
    const equityPct = blendedPlan.blocks.filter(b => ["Core Equity","High Growth","Tactical"].includes(b.type)).reduce((s,b)=>s+b.pct,0);
    const hybridPct = blendedPlan.blocks.filter(b => b.type==="Balanced Equity").reduce((s,b)=>s+b.pct,0);
    const debtPct   = blendedPlan.blocks.filter(b => ["Capital Safety","Stability"].includes(b.type)).reduce((s,b)=>s+b.pct,0);

    timeline.push({
      year, activeGoals: activeGoalIds, achievedGoals: achievedThisYear,
      totalSIP, blocks: blendedPlan.blocks, equityPct, debtPct, hybridPct,
      label: blendedPlan.label,
    });

    // Build phase: from this year to next transition
    const nextYear = transitionYears[i+1] ?? totalYears;
    if (nextYear > year) {
      const phaseKey = `${year}-${nextYear}`;
      const funds = resolveAllFunds(blendedPlan, amfiRaw, fundAnalytics, etfAnalytics, insights);
      resolvedFundsByPhase.set(phaseKey, funds);

      phases.push({
        fromYear: year, toYear: nextYear,
        label: year === 0 ? "Starting Phase" : `After Year ${year}`,
        description: blendedPlan.label,
        activeGoalLabels: activeGoals.map(g => `${g.emoji} ${g.label}`),
        plan: blendedPlan,
        totalSIP,
      });
    }
  }

  const totalMonthlySIP = timeline[0]?.totalSIP ?? 0;

  return { goals: sortedGoals, totalYears, timeline, totalMonthlySIP, phaseDescriptions: phases, resolvedFundsByPhase };
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function fmtINR(n: number): string {
  if (n >= 10000000) return `₹${(n/10000000).toFixed(1)} Cr`;
  if (n >= 100000) return `₹${(n/100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n/1000).toFixed(0)}K`;
  return `₹${Math.round(n)}`;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// ─────────────────────────────────────────────────────────────────────────────
// FUND DETAIL MODAL
// ─────────────────────────────────────────────────────────────────────────────

function FundDetailModal({ slot, onClose }: { slot: ResolvedFundSlot; onClose: () => void }) {
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(15,23,42,0.55)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:'16px' }} onClick={onClose}>
      <div style={{ background:'white',borderRadius:'24px',maxWidth:'680px',width:'100%',maxHeight:'90vh',overflowY:'auto',boxShadow:'0 40px 100px rgba(0,0,0,0.2)',border:'1px solid #E2E8F0' }} onClick={e=>e.stopPropagation()}>
        <div style={{ position:'sticky',top:0,background:'rgba(255,255,255,0.97)',backdropFilter:'blur(8px)',padding:'16px 20px',borderBottom:'1px solid #F1F5F9',zIndex:10 }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'12px' }}>
            <div style={{ minWidth:0 }}>
              <div style={{ display:'flex',gap:'6px',marginBottom:'5px',flexWrap:'wrap',alignItems:'center' }}>
                <span style={{ fontSize:'10px',padding:'2px 9px',borderRadius:'100px',background:slot.isActive?'rgba(16,185,129,0.1)':'rgba(59,130,246,0.1)',color:slot.isActive?'#059669':'#2563EB',border:`1px solid ${slot.isActive?'rgba(16,185,129,0.25)':'rgba(59,130,246,0.25)'}`,fontWeight:700 }}>{slot.isActive?'● ACTIVE':'◆ INDEX'}</span>
                <span style={{ fontSize:'11px',padding:'2px 9px',borderRadius:'100px',background:slot.blockBg,color:slot.blockColor,border:`1px solid ${slot.blockBorder}`,fontWeight:700 }}>{slot.exposureBlock}</span>
              </div>
              <h3 style={{ fontSize:'clamp(14px,3vw,17px)',fontWeight:800,color:'#0F172A',margin:0,lineHeight:1.2 }}>{slot.fundName}</h3>
              <p style={{ fontSize:'12px',color:'#64748B',margin:'3px 0 0' }}>Type: <strong>{slot.subCategory}</strong></p>
            </div>
            <button onClick={onClose} style={{ width:'32px',height:'32px',borderRadius:'8px',border:'none',background:'#F1F5F9',color:'#64748B',fontSize:'18px',cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center' }}>×</button>
          </div>
        </div>
        <div style={{ padding:'18px 20px',display:'flex',flexDirection:'column',gap:'16px' }}>
          {slot.stats && (
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(90px,1fr))',gap:'8px' }}>
              {[
                { label:'3Y Returns',value:`${slot.stats.return3Y?.toFixed(2)}%`,color:'#0F172A' },
                { label:'5Y Returns',value:slot.stats.return5Y?`${slot.stats.return5Y.toFixed(2)}%`:'—',color:'#0F172A' },
                { label:'Extra vs Index',value:`${slot.stats.alpha3Y&&slot.stats.alpha3Y>0?'+':''}${slot.stats.alpha3Y?.toFixed(2)}%`,color:slot.stats.alpha3Y&&slot.stats.alpha3Y>0?'#059669':'#DC2626' },
                { label:'Category Rank',value:`#${slot.stats.rank}`,color:'#0F172A' },
                { label:'Fund Size',value:`₹${(slot.stats.aum/1000).toFixed(0)}K Cr`,color:'#0F172A' },
              ].map((s,i)=>(
                <div key={i} style={{ background:'#F8FAFC',borderRadius:'10px',padding:'10px 12px',border:'1px solid #E2E8F0' }}>
                  <div style={{ fontSize:'10px',color:'#94A3B8',marginBottom:'3px' }}>{s.label}</div>
                  <div style={{ fontSize:'18px',fontWeight:800,color:s.color,lineHeight:1 }}>{s.value}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:'12px',padding:'14px 16px',display:'flex',gap:'10px' }}>
            <span style={{ fontSize:'18px',flexShrink:0 }}>💡</span>
            <div>
              <h4 style={{ fontWeight:700,color:'#1E40AF',fontSize:'13px',margin:'0 0 4px' }}>Why this fund?</h4>
              <p style={{ fontSize:'12px',color:'#1E3A8A',margin:0,lineHeight:1.65 }}>
                We compared <strong>{slot.box.candidateSubCategories.length}</strong> sub-categories for this slot.
                <strong> {slot.subCategory}</strong> delivered the highest average alpha above its benchmark.
                Within that, this fund ranks <strong>#{slot.stats?.rank}</strong> — the top pick by composite score.
                {slot.stats?.alpha3Y&&slot.stats.alpha3Y>0&&` It delivered +${slot.stats.alpha3Y.toFixed(1)}% extra returns above the market index over 3 years.`}
              </p>
            </div>
          </div>
          {slot.box.candidateSubCategories.length > 1 && (
            <div>
              <h4 style={{ fontSize:'13px',fontWeight:700,color:'#0F172A',marginBottom:'8px' }}>Sub-categories compared</h4>
              <div style={{ display:'flex',flexDirection:'column',gap:'6px' }}>
                {[...slot.box.candidateSubCategories].sort((a,b)=>b.avgAlpha-a.avgAlpha).map((sc,i)=>{
                  const isWinner=sc.subCategoryName===slot.subCategory;
                  return (
                    <div key={i} style={{ padding:'9px 12px',borderRadius:'10px',border:`1px solid ${isWinner?'#A7F3D0':'#E2E8F0'}`,background:isWinner?'#ECFDF5':'#F8FAFC',display:'flex',justifyContent:'space-between',alignItems:'center',gap:'8px' }}>
                      <div style={{ display:'flex',alignItems:'center',gap:'6px' }}>
                        <span style={{ fontSize:'12px',fontWeight:700,color:'#1F2937' }}>{sc.subCategoryName}</span>
                        {isWinner&&<span style={{ fontSize:'9px',background:'#059669',color:'white',padding:'1px 7px',borderRadius:'100px',fontWeight:700 }}>WINNER</span>}
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontSize:'9px',color:'#94A3B8' }}>Avg alpha</div>
                        <div style={{ fontSize:'14px',fontWeight:800,color:sc.avgAlpha>0?'#059669':'#DC2626' }}>{sc.avgAlpha>0?'+':''}{sc.avgAlpha.toFixed(2)}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GOAL CARD (editable)
// ─────────────────────────────────────────────────────────────────────────────

function GoalCard({ goal, onChange, onRemove, index }: {
  goal: GoalInput; onChange: (g: GoalInput) => void; onRemove: () => void; index: number;
}) {
  const pc = PRIORITY_CONFIG[goal.priority];
  const riskColor = goal.riskScore <= 3 ? "#059669" : goal.riskScore <= 5 ? "#0891B2" : goal.riskScore <= 7 ? "#D97706" : "#DC2626";

  return (
    <div style={{ background:'white',border:`2px solid ${pc.border}`,borderRadius:'18px',padding:'18px 20px',position:'relative',boxShadow:'0 2px 12px rgba(0,0,0,0.04)',transition:'box-shadow 0.2s' }}>
      {/* Header row */}
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px',flexWrap:'wrap',gap:'8px' }}>
        <div style={{ display:'flex',alignItems:'center',gap:'10px' }}>
          <span style={{ fontSize:'26px' }}>{goal.emoji}</span>
          <div>
            <input value={goal.label} onChange={e=>onChange({...goal,label:e.target.value})}
              style={{ fontSize:'14px',fontWeight:800,color:'#0F172A',border:'none',outline:'none',background:'transparent',fontFamily:'inherit',width:'100%',padding:0 }}
              placeholder="Goal name" />
            <div style={{ fontSize:'10px',color:pc.color,fontWeight:700,marginTop:'1px' }}>{pc.label} goal · {pc.desc}</div>
          </div>
        </div>
        <div style={{ display:'flex',gap:'6px',alignItems:'center' }}>
          <select value={goal.priority} onChange={e=>onChange({...goal,priority:e.target.value as GoalInput["priority"]})}
            style={{ fontSize:'10px',fontWeight:700,color:pc.color,background:pc.bg,border:`1px solid ${pc.border}`,borderRadius:'100px',padding:'3px 8px',cursor:'pointer',outline:'none',fontFamily:'inherit' }}>
            <option value="essential">Essential</option>
            <option value="important">Important</option>
            <option value="aspirational">Aspirational</option>
          </select>
          <button onClick={onRemove} style={{ width:'26px',height:'26px',borderRadius:'8px',border:'none',background:'#FEF2F2',color:'#DC2626',fontSize:'14px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>×</button>
        </div>
      </div>

      {/* Inputs */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:'10px',marginBottom:'12px' }}>
        <div>
          <label style={{ fontSize:'10px',fontWeight:700,color:'#374151',display:'block',marginBottom:'4px' }}>Target amount</label>
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',fontSize:'12px',color:'#94A3B8',fontWeight:700 }}>₹</span>
            <input type="number" value={goal.targetLakh} onChange={e=>onChange({...goal,targetLakh:e.target.value})} placeholder="Lakhs"
              style={{ width:'100%',padding:'8px 10px 8px 22px',borderRadius:'8px',border:'1.5px solid #E2E8F0',fontSize:'13px',color:'#0F172A',outline:'none',boxSizing:'border-box',fontFamily:'inherit' }}
              onFocus={e=>e.target.style.borderColor='#3B82F6'} onBlur={e=>e.target.style.borderColor='#E2E8F0'} />
          </div>
          {goal.targetLakh && <div style={{ fontSize:'10px',color:'#059669',marginTop:'3px',fontWeight:600 }}>{fmtINR(parseFloat(goal.targetLakh)*100000)}</div>}
        </div>
        <div>
          <label style={{ fontSize:'10px',fontWeight:700,color:'#374151',display:'block',marginBottom:'4px' }}>In how many years?</label>
          <input type="number" value={goal.horizonYears} onChange={e=>onChange({...goal,horizonYears:e.target.value})} placeholder="Years" min="1" max="40"
            style={{ width:'100%',padding:'8px 10px',borderRadius:'8px',border:'1.5px solid #E2E8F0',fontSize:'13px',color:'#0F172A',outline:'none',boxSizing:'border-box',fontFamily:'inherit' }}
            onFocus={e=>e.target.style.borderColor='#3B82F6'} onBlur={e=>e.target.style.borderColor='#E2E8F0'} />
          {goal.horizonYears && (
            <div style={{ fontSize:'10px',marginTop:'3px',fontWeight:600,color:parseInt(goal.horizonYears)<=2?'#DC2626':parseInt(goal.horizonYears)<=5?'#D97706':parseInt(goal.horizonYears)<=10?'#059669':'#2563EB' }}>
              {parseInt(goal.horizonYears)<=2?'🔴 Short-term':parseInt(goal.horizonYears)<=5?'🟡 Medium-term':parseInt(goal.horizonYears)<=10?'🟢 Growth-horizon':'🔵 Long-term'}
            </div>
          )}
        </div>
        <div>
          <div style={{ display:'flex',justifyContent:'space-between',marginBottom:'4px' }}>
            <label style={{ fontSize:'10px',fontWeight:700,color:'#374151' }}>Risk comfort</label>
            <span style={{ fontSize:'11px',fontWeight:800,color:riskColor }}>{goal.riskScore}/10</span>
          </div>
          <input type="range" min="1" max="10" value={goal.riskScore} onChange={e=>onChange({...goal,riskScore:parseInt(e.target.value)})}
            style={{ width:'100%',height:'5px',borderRadius:'100px',cursor:'pointer',accentColor:riskColor }} />
          <div style={{ fontSize:'10px',color:riskColor,fontWeight:600,marginTop:'3px' }}>
            {goal.riskScore<=3?'😌 Conservative':goal.riskScore<=5?'⚖️ Balanced':goal.riskScore<=7?'📈 Growth':'🚀 Aggressive'}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TIMELINE VISUAL
// ─────────────────────────────────────────────────────────────────────────────

function TimelineVisual({ plan, goals, selectedPhaseIdx, onSelectPhase }: {
  plan: LifetimePlan; goals: GoalInput[]; selectedPhaseIdx: number; onSelectPhase: (i: number) => void;
}) {
  const totalYears = plan.totalYears;
  const goalMap = new Map(goals.map(g => [g.id, g]));
  const snapshots = plan.timeline;

  return (
    <div style={{ position:'relative',padding:'8px 0 0' }}>
      {/* Timeline track */}
      <div style={{ position:'relative',height:'60px',marginBottom:'12px' }}>
        {/* Background bar */}
        <div style={{ position:'absolute',top:'24px',left:0,right:0,height:'8px',background:'#F1F5F9',borderRadius:'100px' }} />

        {/* Phase segments */}
        {plan.phaseDescriptions.map((phase, i) => {
          const left  = `${(phase.fromYear / totalYears) * 100}%`;
          const width = `${((phase.toYear - phase.fromYear) / totalYears) * 100}%`;
          const equityPct = phase.plan.blocks.filter(b=>["Core Equity","High Growth","Tactical"].includes(b.type)).reduce((s,b)=>s+b.pct,0);
          const color = equityPct >= 60 ? '#2563EB' : equityPct >= 35 ? '#7C3AED' : '#059669';
          const isSelected = selectedPhaseIdx === i;
          return (
            <div key={i} onClick={() => onSelectPhase(i)}
              style={{ position:'absolute',top:'20px',left,width,height:'16px',background:color,opacity:isSelected?1:0.55,borderRadius:'4px',cursor:'pointer',transition:'opacity 0.2s',zIndex:2 }}
              title={phase.label} />
          );
        })}

        {/* Goal markers */}
        {snapshots.filter(s => s.achievedGoals.length > 0).map((snapshot, i) => {
          const left = `${(snapshot.year / totalYears) * 100}%`;
          const goalsHere = snapshot.achievedGoals.map(id => goalMap.get(id)).filter(Boolean);
          return (
            <div key={i} style={{ position:'absolute',top:0,left,transform:'translateX(-50%)',display:'flex',flexDirection:'column',alignItems:'center',zIndex:10 }}>
              <div style={{ display:'flex',gap:'2px',marginBottom:'3px' }}>
                {goalsHere.map((g,j) => <span key={j} style={{ fontSize:'14px' }}>{g!.emoji}</span>)}
              </div>
              <div style={{ width:'2px',height:'32px',background:'#94A3B8' }} />
              <div style={{ fontSize:'9px',color:'#64748B',fontWeight:700,marginTop:'2px',whiteSpace:'nowrap' }}>Yr {snapshot.year}</div>
            </div>
          );
        })}
      </div>

      {/* Year labels */}
      <div style={{ display:'flex',justifyContent:'space-between',fontSize:'10px',color:'#94A3B8',fontWeight:600,padding:'0 2px' }}>
        <span>Now</span>
        {[...Array(Math.min(5, totalYears))].map((_,i) => {
          const yr = Math.round((i+1) * totalYears / Math.min(5, totalYears));
          return <span key={i}>Yr {yr}</span>;
        })}
      </div>

      {/* Phase selector tabs */}
      <div style={{ display:'flex',gap:'6px',flexWrap:'wrap',marginTop:'14px' }}>
        {plan.phaseDescriptions.map((phase, i) => {
          const equityPct = phase.plan.blocks.filter(b=>["Core Equity","High Growth","Tactical"].includes(b.type)).reduce((s,b)=>s+b.pct,0);
          const color = equityPct>=60?'#2563EB':equityPct>=35?'#7C3AED':'#059669';
          const isSelected = selectedPhaseIdx === i;
          return (
            <button key={i} onClick={() => onSelectPhase(i)}
              style={{ padding:'6px 12px',borderRadius:'100px',border:`1.5px solid ${isSelected?color:'#E2E8F0'}`,background:isSelected?color:'white',color:isSelected?'white':'#374151',fontSize:'11px',fontWeight:700,cursor:'pointer',transition:'all 0.15s',fontFamily:'inherit',whiteSpace:'nowrap' }}>
              {phase.label}
              
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE DETAIL PANEL
// ─────────────────────────────────────────────────────────────────────────────

function PhaseDetailPanel({ phase, phaseKey, resolvedFunds, goals, onFundDetail }: {
  phase: PhaseDescription; phaseKey: string; resolvedFunds: ResolvedFundSlot[]; goals: GoalInput[]; onFundDetail: (s: ResolvedFundSlot) => void;
}) {
  const [showFunds, setShowFunds] = useState(false);
  const equityPct = phase.plan.blocks.filter(b=>["Core Equity","High Growth","Tactical"].includes(b.type)).reduce((s,b)=>s+b.pct,0);
  const hybridPct = phase.plan.blocks.filter(b=>b.type==="Balanced Equity").reduce((s,b)=>s+b.pct,0);
  const debtPct   = phase.plan.blocks.filter(b=>["Capital Safety","Stability"].includes(b.type)).reduce((s,b)=>s+b.pct,0);

  return (
    <div style={{ background:'white',border:'1px solid #E2E8F0',borderRadius:'16px',overflow:'hidden' }}>
      {/* Phase header */}
      <div style={{ background:'linear-gradient(135deg,#EFF6FF,#F0FDF4)',padding:'16px 18px',borderBottom:'1px solid #E2E8F0' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'10px' }}>
          <div>
            <div style={{ fontSize:'11px',fontWeight:700,color:'#94A3B8',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:'4px' }}>
              {phase.fromYear===0?'From today':phase.fromYear===phase.toYear?`Year ${phase.fromYear}`:`Year ${phase.fromYear} → Year ${phase.toYear}`}
            </div>
            <h3 style={{ fontSize:'16px',fontWeight:800,color:'#0F172A',margin:'0 0 4px' }}>{phase.description}</h3>
            <div style={{ display:'flex',gap:'6px',flexWrap:'wrap' }}>
              {phase.activeGoalLabels.map((lbl,i) => (
                <span key={i} style={{ fontSize:'11px',padding:'2px 8px',borderRadius:'100px',background:'#F8FAFC',border:'1px solid #E2E8F0',color:'#374151',fontWeight:600 }}>{lbl}</span>
              ))}
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:'11px',color:'#94A3B8',marginBottom:'2px' }}>Monthly SIP needed</div>
            <div style={{ fontSize:'24px',fontWeight:900,color:'#2563EB' }}>₹{phase.totalSIP.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      {/* Allocation bar */}
      <div style={{ padding:'14px 18px',borderBottom:'1px solid #F1F5F9' }}>
        <div style={{ fontSize:'11px',fontWeight:700,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'8px' }}>Exposure breakdown</div>
        <div style={{ display:'flex',borderRadius:'10px',overflow:'hidden',height:'12px',marginBottom:'8px' }}>
          {phase.plan.blocks.map((b,i) => (
            <div key={i} style={{ width:`${b.pct}%`,background:b.color,opacity:0.85 }} title={`${b.type} ${b.pct}%`} />
          ))}
        </div>
        <div style={{ display:'flex',flexWrap:'wrap',gap:'10px' }}>
          {[
            { label:'Equity-type', pct:equityPct, color:'#2563EB' },
            { label:'Hybrid-type', pct:hybridPct, color:'#7C3AED' },
            { label:'Debt-type',   pct:debtPct,   color:'#059669' },
          ].map((s,i) => (
            <div key={i} style={{ display:'flex',alignItems:'center',gap:'5px' }}>
              <div style={{ width:'8px',height:'8px',borderRadius:'2px',background:s.color }} />
              <span style={{ fontSize:'11px',color:'#64748B',fontWeight:600 }}>{s.label} <strong style={{ color:s.color }}>{s.pct}%</strong></span>
            </div>
          ))}
        </div>
      </div>

      {/* Expected return range */}
      <div style={{ padding:'12px 18px',borderBottom:'1px solid #F1F5F9',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))',gap:'8px' }}>
        {[
          { label:'Return range',  value:`${phase.plan.expectedReturnLo}–${phase.plan.expectedReturnHi}%`, color:'#2563EB' },
          { label:'Risk level',    value:phase.plan.riskIntensity, color:'#D97706' },
          { label:'Time bucket',   value:phase.plan.timeBucket, color:'#059669' },
          { label:'Success rate',  value:`${phase.plan.successRate}%`, color:'#0F172A' },
        ].map((s,i) => (
          <div key={i} style={{ background:'#F8FAFC',borderRadius:'8px',padding:'8px 10px',border:'1px solid #F1F5F9' }}>
            <div style={{ fontSize:'10px',color:'#94A3B8',marginBottom:'2px' }}>{s.label}</div>
            <div style={{ fontSize:'14px',fontWeight:800,color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Fund list toggle */}
      <div style={{ padding:'0 18px' }}>
        <button onClick={() => setShowFunds(!showFunds)}
          style={{ width:'100%',background:showFunds?'#EFF6FF':'white',border:'none',borderTop:'none',padding:'14px 0',fontSize:'12px',fontWeight:700,color:'#1E40AF',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'space-between',fontFamily:'inherit' }}>
          <span style={{ display:'flex',alignItems:'center',gap:'6px' }}>📋 Funds for this phase ({resolvedFunds.length} picks)</span>
          <span style={{ fontSize:'10px',color:'#60A5FA' }}>{showFunds?'▲ Hide':'▼ Show'}</span>
        </button>

        {showFunds && (
          <div style={{ paddingBottom:'16px' }}>
            {phase.plan.blocks.map(block => {
              const blockFunds = resolvedFunds.filter(f => f.exposureBlock === block.type);
              if (blockFunds.length === 0) return null;
              return (
                <div key={block.type} style={{ marginBottom:'16px' }}>
                  <div style={{ display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px' }}>
                    <span style={{ fontSize:'14px' }}>{block.emoji}</span>
                    <span style={{ fontSize:'12px',fontWeight:800,color:'#0F172A' }}>{block.type} Exposure</span>
                    <span style={{ fontSize:'10px',color:block.color,fontWeight:700,background:block.bg,border:`1px solid ${block.border}`,padding:'1px 8px',borderRadius:'100px' }}>{block.pct}%</span>
                    <span style={{ fontSize:'10px',color:'#94A3B8' }}>≈ ₹{Math.round(phase.totalSIP*block.pct/100/100)*100}/mo</span>
                  </div>
                  <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:'8px' }}>
                    {blockFunds.map((slot,i) => {
                      const slotSIP = Math.round(phase.totalSIP*slot.cellAllocationPct/100/100)*100;
                      return (
                        <div key={i} style={{ background:'white',border:`1.5px solid ${slot.blockBorder}`,borderRadius:'12px',padding:'12px 14px' }}>
                          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'6px' }}>
                            <div style={{ flex:1,minWidth:0 }}>
                              <div style={{ display:'flex',gap:'4px',marginBottom:'4px',flexWrap:'wrap' }}>
                                <span style={{ fontSize:'9px',fontWeight:700,padding:'2px 6px',borderRadius:'100px',background:slot.isActive?'rgba(16,185,129,0.1)':'rgba(59,130,246,0.1)',color:slot.isActive?'#059669':'#2563EB',border:`1px solid ${slot.isActive?'rgba(16,185,129,0.2)':'rgba(59,130,246,0.2)'}` }}>
                                  {slot.isActive?'● ACTIVE':'◆ INDEX'}
                                </span>
                                <span style={{ fontSize:'9px',color:'#94A3B8',alignSelf:'center' }}>{slot.subCategory}</span>
                              </div>
                              <div style={{ fontSize:'11px',fontWeight:800,color:'#0F172A',lineHeight:1.3 }}>{slot.fundName}</div>
                            </div>
                            {slotSIP>0 && <div style={{ fontSize:'10px',fontWeight:700,color:slot.blockColor,background:slot.blockBg,border:`1px solid ${slot.blockBorder}`,borderRadius:'100px',padding:'2px 8px',flexShrink:0,marginLeft:'6px' }}>₹{slotSIP.toLocaleString('en-IN')}/mo</div>}
                          </div>
                          {slot.stats && (
                            <div style={{ display:'flex',gap:'6px',marginBottom:'8px' }}>
                              {[
                                { v:`${slot.stats.return3Y?.toFixed(1)}%`,l:'3Y',c:'#059669' },
                                { v:`${slot.stats.alpha3Y&&slot.stats.alpha3Y>0?'+':''}${slot.stats.alpha3Y?.toFixed(1)}%`,l:'α',c:slot.stats.alpha3Y&&slot.stats.alpha3Y>0?'#059669':'#DC2626' },
                                { v:`#${slot.stats.rank}`,l:'Rank',c:'#1E3A5F' },
                              ].map((s,j) => (
                                <div key={j} style={{ flex:1,background:'#F8FAFC',borderRadius:'6px',padding:'5px',textAlign:'center',border:'1px solid #F1F5F9' }}>
                                  <div style={{ fontSize:'9px',color:'#94A3B8' }}>{s.l}</div>
                                  <div style={{ fontSize:'12px',fontWeight:800,color:s.c }}>{s.v}</div>
                                </div>
                              ))}
                            </div>
                          )}
                          <button onClick={() => onFundDetail(slot)}
                            style={{ width:'100%',background:slot.blockBg,border:`1px solid ${slot.blockBorder}`,borderRadius:'7px',padding:'6px',fontSize:'10px',fontWeight:700,color:slot.blockColor,cursor:'pointer',fontFamily:'inherit' }}>
                            Why this fund? →
                          </button>
                        </div>
                      );
                    })}
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

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function LifetimePlanPage() {
  // Data
  const [amfiRaw,       setAmfiRaw]       = useState<AMFIFund[]>([]);
  const [fundAnalytics, setFundAnalytics] = useState<FundAnalytics[]>([]);
  const [etfAnalytics,  setEtfAnalytics]  = useState<ETFAnalytics[]>([]);
  const [insights,      setInsights]      = useState<InsightRow[]>([]);
  const [dataReady,     setDataReady]     = useState(false);

  // Goals
  const [goals, setGoals] = useState<GoalInput[]>([]);

  // Results
  const [lifetimePlan,   setLifetimePlan]   = useState<LifetimePlan | null>(null);
  const [generating,     setGenerating]     = useState(false);
  const [selectedPhaseIdx, setSelectedPhaseIdx] = useState(0);
  const [selectedFundSlot, setSelectedFundSlot] = useState<ResolvedFundSlot | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/amfi-raw").then(r => r.json()),
      fetch("/api/funds").then(r => r.json()),
      fetch("/api/etfs").then(r => r.json()),
      fetch("/api/insights").then(r => r.json()),
    ]).then(([amfi, funds, etfs, ins]) => {
      setAmfiRaw(amfi); setFundAnalytics(funds); setEtfAnalytics(etfs); setInsights(ins); setDataReady(true);
    }).catch(console.error);
  }, []);

  function addGoalFromTemplate(template: typeof GOAL_TEMPLATES[0]) {
    setGoals(prev => [...prev, { id: generateId(), emoji: template.emoji, label: template.label, targetLakh: template.targetLakh, horizonYears: template.horizonYears, riskScore: template.riskScore, priority: template.priority }]);
  }

  function addBlankGoal() {
    setGoals(prev => [...prev, { id: generateId(), emoji: "🎯", label: "My Goal", targetLakh: "10", horizonYears: "5", riskScore: 5, priority: "important" }]);
  }

  function updateGoal(id: string, updated: GoalInput) {
    setGoals(prev => prev.map(g => g.id === id ? updated : g));
  }

  function removeGoal(id: string) {
    setGoals(prev => prev.filter(g => g.id !== id));
  }

  function generate() {
    if (goals.length === 0) return;
    setGenerating(true);
    setLifetimePlan(null);
    setSelectedPhaseIdx(0);

    setTimeout(() => {
      const plan = buildLifetimePlan(goals, amfiRaw, fundAnalytics, etfAnalytics, insights);
      setLifetimePlan(plan);
      setGenerating(false);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    }, 1200);
  }

  const canGenerate = goals.length >= 1 && goals.every(g => g.label && g.targetLakh && g.horizonYears);
  const selectedPhase = lifetimePlan?.phaseDescriptions[selectedPhaseIdx];
  const selectedPhaseKey = selectedPhase ? `${selectedPhase.fromYear}-${selectedPhase.toYear}` : "";
  const selectedFunds = selectedPhaseKey ? (lifetimePlan?.resolvedFundsByPhase.get(selectedPhaseKey) ?? []) : [];

  // Totals for summary
  const totalTargetLakh = goals.reduce((s,g) => s + (parseFloat(g.targetLakh)||0), 0);
  const maxHorizon = goals.length > 0 ? Math.max(...goals.map(g => parseInt(g.horizonYears)||0)) : 0;

  return (
    <div style={{ minHeight:'100vh',background:'#F8FAFC',fontFamily:"'DM Sans', system-ui, -apple-system, sans-serif",color:'#1F2937' }}>

      {/* NAV */}
      <div style={{ background:'white',borderBottom:'1px solid #E2E8F0',zIndex:30,position:'sticky',top:0 }}>
        <div style={{ maxWidth:'1152px',margin:'0 auto' }}><AnalysisTabs /></div>
      </div>

      {/* HERO */}
      <section style={{ background:'linear-gradient(155deg,#FFFBEB 0%,#F0FDF4 50%,#EFF6FF 100%)',borderBottom:'1px solid #E2E8F0',position:'relative',overflow:'hidden' }}>
        <div style={{ position:'absolute',inset:0,backgroundImage:'radial-gradient(circle at 1px 1px, rgba(217,119,6,0.06) 1px, transparent 0)',backgroundSize:'28px 28px',pointerEvents:'none' }} />
        <div style={{ position:'absolute',top:-80,right:-60,width:'380px',height:'380px',background:'radial-gradient(circle, rgba(217,119,6,0.08) 0%, transparent 70%)',pointerEvents:'none' }} />
        <div style={{ position:'absolute',bottom:-60,left:'8%',width:'320px',height:'320px',background:'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)',pointerEvents:'none' }} />
        <div style={{ position:'relative',maxWidth:'1100px',margin:'0 auto',padding:'clamp(32px,5vw,52px) clamp(16px,4vw,24px) clamp(36px,5vw,56px)' }}>
          <div style={{ display:'inline-flex',alignItems:'center',gap:'8px',background:'rgba(217,119,6,0.1)',border:'1px solid rgba(217,119,6,0.25)',borderRadius:'100px',padding:'5px 14px',marginBottom:'16px' }}>
            <span style={{ width:'7px',height:'7px',background:'#D97706',borderRadius:'50%' }} />
            <span style={{ fontSize:'11px',fontWeight:700,color:'#78350F',letterSpacing:'0.08em',textTransform:'uppercase' }}>Lifetime Wealth Plan · All Goals, One Portfolio</span>
          </div>
          <h1 style={{ fontSize:'clamp(1.8rem,5vw,3rem)',fontWeight:800,color:'#0F172A',lineHeight:1.1,letterSpacing:'-0.03em',marginBottom:'14px',maxWidth:'720px' }}>
            Every goal you have,<br />
            <span style={{ background:'linear-gradient(90deg,#D97706 0%,#059669 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }}>
              one plan that grows with you.
            </span>
          </h1>
          <p style={{ fontSize:'clamp(13px,2vw,15px)',color:'#475569',lineHeight:1.75,maxWidth:'540px',marginBottom:'24px' }}>
            Car in 3 years. Home in 6. Child's college in 12. Retirement in 25. Most people invest in silos — one fund for this, another for that. We build a single living portfolio that covers all your goals, shifts as each one is achieved, and is always backed by live fund data.
          </p>

          {/* How it's different */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'10px',maxWidth:'700px' }}>
            {[
              { icon:'🔀', title:'Goals change the mix', desc:'As each goal is achieved, the portfolio automatically shifts to serve the remaining ones.' },
              { icon:'📊', title:'Same live engine', desc:'Every fund pick uses the identical alpha-based engine powering our full matrix.' },
              { icon:'⚖️', title:'Priorities respected', desc:'Essential goals protect capital first. Aspirational goals take more risk for higher returns.' },
            ].map((b,i) => (
              <div key={i} style={{ background:'rgba(255,255,255,0.7)',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,0.8)',borderRadius:'14px',padding:'14px 16px',boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize:'20px',marginBottom:'6px' }}>{b.icon}</div>
                <div style={{ fontSize:'12px',fontWeight:800,color:'#1F2937',marginBottom:'3px' }}>{b.title}</div>
                <div style={{ fontSize:'11px',color:'#64748B',lineHeight:1.5 }}>{b.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FORM */}
      <div style={{ maxWidth:'900px',margin:'0 auto',padding:'clamp(24px,4vw,44px) clamp(12px,3vw,24px)' }}>

        {/* Goal templates */}
        <div style={{ background:'white',borderRadius:'20px',border:'1px solid #E2E8F0',boxShadow:'0 1px 6px rgba(0,0,0,0.04)',padding:'clamp(16px,3vw,22px)',marginBottom:'14px' }}>
          <div style={{ fontSize:'13px',fontWeight:700,color:'#0F172A',marginBottom:'4px' }}>Add goals to your plan</div>
          <div style={{ fontSize:'12px',color:'#94A3B8',marginBottom:'14px' }}>Tap any goal below, then customise the amount, years, and risk. Add as many as you like.</div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(105px,1fr))',gap:'8px' }}>
            {GOAL_TEMPLATES.map((t,i) => {
              const alreadyAdded = goals.some(g => g.label === t.label);
              return (
                <button key={i} onClick={() => addGoalFromTemplate(t)} disabled={alreadyAdded}
                  style={{ background:alreadyAdded?'#F8FAFC':'white',border:`2px solid ${alreadyAdded?'#E2E8F0':PRIORITY_CONFIG[t.priority].border}`,borderRadius:'14px',padding:'10px 6px',cursor:alreadyAdded?'default':'pointer',textAlign:'center',transition:'all 0.15s',fontFamily:'inherit',opacity:alreadyAdded?0.5:1 }}>
                  <div style={{ fontSize:'22px',marginBottom:'4px' }}>{t.emoji}</div>
                  <div style={{ fontSize:'10px',fontWeight:700,color:alreadyAdded?'#94A3B8':PRIORITY_CONFIG[t.priority].color,lineHeight:1.3 }}>{t.label}</div>
                  {alreadyAdded && <div style={{ fontSize:'9px',color:'#94A3B8',marginTop:'2px' }}>Added ✓</div>}
                </button>
              );
            })}
            <button onClick={addBlankGoal}
              style={{ background:'#F8FAFC',border:'2px dashed #E2E8F0',borderRadius:'14px',padding:'10px 6px',cursor:'pointer',textAlign:'center',fontFamily:'inherit' }}>
              <div style={{ fontSize:'22px',marginBottom:'4px' }}>➕</div>
              <div style={{ fontSize:'10px',fontWeight:700,color:'#64748B',lineHeight:1.3 }}>Custom goal</div>
            </button>
          </div>
        </div>

        {/* Goal cards */}
        {goals.length > 0 && (
          <div style={{ display:'flex',flexDirection:'column',gap:'12px',marginBottom:'14px' }}>
            {goals.map((g, i) => (
              <GoalCard key={g.id} goal={g} index={i} onChange={updated => updateGoal(g.id, updated)} onRemove={() => removeGoal(g.id)} />
            ))}
          </div>
        )}

        {/* Goals summary before generate */}
        {goals.length > 0 && (
          <div style={{ background:'white',borderRadius:'16px',border:'1px solid #E2E8F0',padding:'16px 20px',marginBottom:'14px',display:'flex',flexWrap:'wrap',gap:'16px',alignItems:'center',justifyContent:'space-between' }}>
            <div style={{ display:'flex',flexWrap:'wrap',gap:'16px' }}>
              {[
                { label:'Goals added', value:`${goals.length}`, color:'#2563EB' },
                { label:'Total target', value:fmtINR(totalTargetLakh*100000), color:'#059669' },
                { label:'Plan duration', value:`${maxHorizon} years`, color:'#D97706' },
                { label:'Essential goals', value:`${goals.filter(g=>g.priority==='essential').length}`, color:'#DC2626' },
              ].map((s,i) => (
                <div key={i}>
                  <div style={{ fontSize:'10px',color:'#94A3B8',fontWeight:600 }}>{s.label}</div>
                  <div style={{ fontSize:'18px',fontWeight:800,color:s.color,lineHeight:1.1 }}>{s.value}</div>
                </div>
              ))}
            </div>
            <button onClick={generate} disabled={!canGenerate || generating}
              style={{ background:canGenerate?'linear-gradient(90deg,#D97706 0%,#059669 100%)':'#E2E8F0',color:canGenerate?'white':'#94A3B8',border:'none',borderRadius:'14px',padding:'14px 24px',fontSize:'14px',fontWeight:800,cursor:canGenerate?'pointer':'not-allowed',letterSpacing:'-0.01em',boxShadow:canGenerate?'0 4px 20px rgba(217,119,6,0.3)':'none',transition:'all 0.2s',fontFamily:'inherit',whiteSpace:'nowrap' }}>
              {generating ? '⏳  Building your lifetime plan…' : '🌱  Build my lifetime plan →'}
            </button>
          </div>
        )}

        {goals.length === 0 && (
          <div style={{ background:'white',borderRadius:'16px',border:'2px dashed #E2E8F0',padding:'32px',textAlign:'center',color:'#94A3B8' }}>
            <div style={{ fontSize:'36px',marginBottom:'12px' }}>🌱</div>
            <div style={{ fontSize:'14px',fontWeight:700,color:'#374151',marginBottom:'6px' }}>Start adding your goals above</div>
            <div style={{ fontSize:'12px',lineHeight:1.6 }}>Pick from common goals or create a custom one. You can add as many as you like — we'll build one plan that covers them all.</div>
          </div>
        )}

        {/* ── RESULTS ── */}
        {lifetimePlan && (
          <div ref={resultRef} style={{ marginTop:'32px',display:'flex',flexDirection:'column',gap:'16px' }}>

            {/* ── PLAN OVERVIEW ── */}
            <div style={{ background:'linear-gradient(135deg,#FFFBEB,#F0FDF4)',borderRadius:'20px',border:'1px solid #E2E8F0',padding:'clamp(18px,3vw,26px)' }}>
              <div style={{ fontSize:'11px',fontWeight:700,color:'#94A3B8',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:'8px' }}>Your lifetime wealth plan</div>
              <h2 style={{ fontSize:'clamp(18px,3vw,24px)',fontWeight:800,color:'#0F172A',margin:'0 0 6px' }}>
                {goals.length} goal{goals.length>1?'s':''} · {lifetimePlan.totalYears}-year journey · ₹{lifetimePlan.totalMonthlySIP.toLocaleString('en-IN')}/month to start
              </h2>
              <p style={{ fontSize:'13px',color:'#475569',margin:'0 0 16px',lineHeight:1.6,maxWidth:'600px' }}>
                Your portfolio will pass through <strong>{lifetimePlan.phaseDescriptions.length} distinct phases</strong> as goals are achieved. Each phase below shows the allocation and fund picks that apply during that window.
              </p>

              {/* Goal roadmap pills */}
              <div style={{ display:'flex',flexWrap:'wrap',gap:'8px',marginBottom:'16px' }}>
                {[...lifetimePlan.goals].sort((a,b)=>parseInt(a.horizonYears)-parseInt(b.horizonYears)).map((g,i) => {
                  const pc = PRIORITY_CONFIG[g.priority];
                  return (
                    <div key={g.id} style={{ display:'flex',alignItems:'center',gap:'6px',background:'white',border:`1.5px solid ${pc.border}`,borderRadius:'100px',padding:'5px 12px',boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
                      <span style={{ fontSize:'14px' }}>{g.emoji}</span>
                      <div>
                        <div style={{ fontSize:'11px',fontWeight:800,color:'#1F2937',lineHeight:1.1 }}>{g.label}</div>
                        <div style={{ fontSize:'9px',color:pc.color,fontWeight:600 }}>Year {g.horizonYears} · {fmtINR(parseFloat(g.targetLakh)*100000)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Timeline visual */}
              <TimelineVisual plan={lifetimePlan} goals={goals} selectedPhaseIdx={selectedPhaseIdx} onSelectPhase={setSelectedPhaseIdx} />
            </div>

            {/* ── PHASE DETAIL ── */}
            {selectedPhase && (
              <PhaseDetailPanel
                phase={selectedPhase}
                phaseKey={selectedPhaseKey}
                resolvedFunds={selectedFunds}
                goals={goals}
                onFundDetail={setSelectedFundSlot}
              />
            )}

            {/* ── ALL PHASES SUMMARY ── */}
            <div style={{ background:'white',borderRadius:'16px',border:'1px solid #E2E8F0',overflow:'hidden' }}>
              <div style={{ padding:'16px 18px',borderBottom:'1px solid #F1F5F9',display:'flex',alignItems:'center',gap:'10px' }}>
                <span style={{ fontSize:'16px' }}>🗂️</span>
                <div>
                  <div style={{ fontSize:'14px',fontWeight:800,color:'#0F172A' }}>All phases at a glance</div>
                  <div style={{ fontSize:'11px',color:'#94A3B8',marginTop:'1px' }}>How your portfolio shifts as each goal is achieved</div>
                </div>
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%',borderCollapse:'collapse',fontSize:'12px',minWidth:'500px' }}>
                  <thead>
                    <tr style={{ background:'#F8FAFC' }}>
                      {['Phase','Active goals','Monthly SIP','Equity','Hybrid','Debt','Expected returns'].map((h,i) => (
                        <th key={i} style={{ padding:'10px 14px',textAlign:'left',fontWeight:700,color:'#374151',borderBottom:'1px solid #E2E8F0',whiteSpace:'nowrap',fontSize:'11px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lifetimePlan.phaseDescriptions.map((phase,i) => {
                      const equityPct = phase.plan.blocks.filter(b=>["Core Equity","High Growth","Tactical"].includes(b.type)).reduce((s,b)=>s+b.pct,0);
                      const hybridPct = phase.plan.blocks.filter(b=>b.type==="Balanced Equity").reduce((s,b)=>s+b.pct,0);
                      const debtPct   = phase.plan.blocks.filter(b=>["Capital Safety","Stability"].includes(b.type)).reduce((s,b)=>s+b.pct,0);
                      const isSelected = selectedPhaseIdx===i;
                      return (
                        <tr key={i} onClick={() => { setSelectedPhaseIdx(i); resultRef.current?.scrollIntoView({behavior:'smooth',block:'start'}); }}
                          style={{ borderBottom:'1px solid #F1F5F9',cursor:'pointer',background:isSelected?'#EFF6FF':'white',transition:'background 0.15s' }}
                          onMouseEnter={e => { if(!isSelected) (e.currentTarget as HTMLTableRowElement).style.background='#F8FAFC'; }}
                          onMouseLeave={e => { if(!isSelected) (e.currentTarget as HTMLTableRowElement).style.background='white'; }}>
                          <td style={{ padding:'11px 14px',fontWeight:700,color:'#374151' }}>{phase.label}</td>
                          <td style={{ padding:'11px 14px' }}>
                            <div style={{ display:'flex',gap:'3px',flexWrap:'wrap' }}>
                              {phase.activeGoalLabels.map((l,j) => <span key={j} style={{ fontSize:'11px',color:'#6B7280' }}>{l}</span>)}
                            </div>
                          </td>
                          <td style={{ padding:'11px 14px',fontWeight:800,color:'#2563EB' }}>₹{phase.totalSIP.toLocaleString('en-IN')}</td>
                          <td style={{ padding:'11px 14px',fontWeight:700,color:'#2563EB' }}>{equityPct}%</td>
                          <td style={{ padding:'11px 14px',fontWeight:700,color:'#7C3AED' }}>{hybridPct}%</td>
                          <td style={{ padding:'11px 14px',fontWeight:700,color:'#059669' }}>{debtPct}%</td>
                          <td style={{ padding:'11px 14px',fontWeight:700,color:'#374151' }}>{phase.plan.expectedReturnLo}–{phase.plan.expectedReturnHi}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── HOW IT WORKS ── */}
            <div style={{ background:'white',borderRadius:'16px',border:'1px solid #E2E8F0',padding:'18px 20px' }}>
              <div style={{ fontSize:'14px',fontWeight:800,color:'#0F172A',marginBottom:'12px',display:'flex',alignItems:'center',gap:'8px' }}>
                <span>🧠</span> How we built this plan — in plain English
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'10px' }}>
                {[
                  { step:'1',icon:'📋',color:'#2563EB',bg:'#EFF6FF',bd:'#BFDBFE',title:'Goals prioritised',body:`We sort your ${goals.length} goal${goals.length>1?'s':''} by time horizon (shortest first). Essential goals anchor the safety of the portfolio. Aspirational goals accept more risk for higher upside.` },
                  { step:'2',icon:'⏱️',color:'#7C3AED',bg:'#F5F3FF',bd:'#DDD6FE',title:'Horizon blend',body:'For each phase, we blend your shortest remaining goal (60% weight, for safety) with the average remaining horizon (40%). This produces a realistic time bucket that balances capital protection and growth.' },
                  { step:'3',icon:'🎚️',color:'#D97706',bg:'#FFFBEB',bd:'#FDE68A',title:'Weighted risk',body:'Your risk scores are averaged with priority weights: essential goals count 1.5×, important goals 1.0×, aspirational 0.6×. This ensures safety-focused goals drive the overall risk posture.' },
                  { step:'4',icon:'🔬',color:'#059669',bg:'#ECFDF5',bd:'#A7F3D0',title:'Same fund engine',body:'The blended time bucket + risk intensity feeds into the exact same 4-layer exposure block engine as our single-goal page. Within each phase, every fund is chosen by alpha-based sub-category comparison — zero human bias.' },
                  { step:'5',icon:'🔀',color:'#DC2626',bg:'#FEF2F2',bd:'#FECACA',title:'Phase transitions',body:'When a goal matures, it exits the portfolio. The remaining SIP is redistributed across the remaining goals. The allocation updates automatically — the portfolio becomes more growth-oriented as near-term obligations are cleared.' },
                  { step:'6',icon:'💡',color:'#0891B2',bg:'#ECFEFF',bd:'#A5F3FC',title:'SIP redistribution',body:'Your starting SIP reflects all goals running simultaneously. As each goal is achieved, you can reduce your SIP or redirect it — the plan tells you the new required amount for each phase.' },
                ].map((item,i) => (
                  <div key={i} style={{ background:item.bg,border:`1px solid ${item.bd}`,borderRadius:'12px',padding:'14px 16px' }}>
                    <div style={{ display:'flex',alignItems:'center',gap:'8px',marginBottom:'6px' }}>
                      <span style={{ width:'22px',height:'22px',background:'white',border:`1px solid ${item.bd}`,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',fontWeight:800,color:item.color,flexShrink:0 }}>{item.step}</span>
                      <span style={{ fontSize:'14px' }}>{item.icon}</span>
                      <span style={{ fontSize:'12px',fontWeight:800,color:item.color }}>{item.title}</span>
                    </div>
                    <p style={{ fontSize:'12px',color:'#475569',lineHeight:1.65,margin:0 }}>{item.body}</p>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:'14px',background:'#FFFBEB',border:'1px solid #FDE68A',borderRadius:'12px',padding:'12px 16px',fontSize:'12px',color:'#92400E',lineHeight:1.6 }}>
                <strong>Disclaimer:</strong> All projections are based on historical performance and are not a guarantee of future returns. Please consult a SEBI-registered investment advisor before making investment decisions.
              </div>
            </div>

            {/* CTA back to single goal */}
            <div style={{ background:'linear-gradient(135deg,#EFF6FF,#F0FDF4)',border:'1px solid #BFDBFE',borderRadius:'16px',padding:'20px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'16px' }}>
              <div>
                <div style={{ fontSize:'16px',marginBottom:'4px' }}>⚡</div>
                <div style={{ fontSize:'14px',fontWeight:800,color:'#0F172A',marginBottom:'4px' }}>Only have one goal right now?</div>
                <p style={{ fontSize:'12px',color:'#64748B',margin:0,maxWidth:'380px',lineHeight:1.6 }}>Use our quick fund picks tool for a single goal. Same live engine, simpler output — funds in seconds.</p>
              </div>
              <a href="/find-my-fund-quick-picks" style={{ background:'linear-gradient(90deg,#059669,#2563EB)',color:'white',borderRadius:'12px',padding:'12px 20px',fontSize:'13px',fontWeight:800,textDecoration:'none',whiteSpace:'nowrap',boxShadow:'0 4px 16px rgba(5,150,105,0.2)' }}>
                Single goal plan →
              </a>
            </div>
          </div>
        )}
      </div>

      {selectedFundSlot && <FundDetailModal slot={selectedFundSlot} onClose={() => setSelectedFundSlot(null)} />}
    </div>
  );
}