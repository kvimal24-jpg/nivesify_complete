"use client";

import React, { useState, useEffect, useRef } from "react";
import { fetchCachedJson } from "@/lib/client-data";
import { selectFundsForGoal } from "@/lib/fund-selection-engine";

// ─────────────────────────────────────────────────────────────────────────────
// SHARED HERO NAVIGATION — identical shell to fund-match page
// ─────────────────────────────────────────────────────────────────────────────

const MF_TABS = [
  { label: "Why Mutual Funds",     href: "/why-mutual-fund",        active: false },
  { label: "Smart Fund Finder",    href: "/mutual-fund-match",      active: false },
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
              background: isActive ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.05)",
              border: isActive ? "1px solid rgba(16,185,129,0.45)" : "1px solid rgba(255,255,255,0.1)",
              transition: "all 0.2s", whiteSpace: "nowrap",
            }}
              onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.85)"; (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.1)"; } }}
              onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.55)"; (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.05)"; } }}
            >
              <span style={{ fontSize: "12px" }}>{tool.emoji}</span>
              {tool.label}
              {isActive && (
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#10B981" }} />
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO SECTION — dark, aligned with fund-match page
// ─────────────────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section style={{
      background: "linear-gradient(155deg, #0F172A 0%, #1E3A5F 55%, #064E3B 100%)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* dot grid */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)", backgroundSize: "28px 28px" }} />
      <div style={{ position: "absolute", top: "-80px", right: "-40px", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(16,185,129,0.14) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-60px", left: "5%", width: "300px", height: "300px", background: "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", maxWidth: "1100px", margin: "0 auto", padding: "clamp(28px, 5vw, 52px) clamp(16px, 4vw, 24px) clamp(24px, 4vw, 40px)" }}>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px", flexWrap: "wrap" }}>
          <a href="/" style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>Nivesify</a>
          <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "11px" }}>/</span>
          <a href="/mutual-fund-match" style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>Mutual Fund World</a>
          <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "11px" }}>/</span>
          <span style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Quick Goal Picks</span>
        </div>

        {/* Badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: "7px", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "100px", padding: "5px 13px", marginBottom: "14px" }}>
          <span style={{ fontSize: "13px" }}>⚡</span>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#6EE7B7", letterSpacing: "0.06em", textTransform: "uppercase" }}>Quick Goal Picks</span>
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: "clamp(1.6rem, 5vw, 2.9rem)", fontWeight: 800, color: "white", lineHeight: 1.1, letterSpacing: "-0.025em", marginBottom: "10px", maxWidth: "680px" }}>
          Tell us your goal.<br />
          <span style={{ background: "linear-gradient(90deg, #34D399 0%, #60A5FA 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            We'll build your fund plan.
          </span>
        </h1>
        <p style={{ fontSize: "clamp(12px, 2vw, 14px)", color: "rgba(255,255,255,0.6)", lineHeight: 1.75, maxWidth: "520px", marginBottom: "22px" }}>
          Enter any financial goal — car, home, retirement, or anything else. We use the same live engine that powers our full matrix to build a science-backed, diversified fund plan in seconds.
        </p>

        {/* Row 1: MF World tabs */}
        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", padding: "6px 8px", display: "inline-block", width: "100%", maxWidth: "fit-content", boxSizing: "border-box", marginBottom: "10px" }}>
          <MFWorldTabs activePage="/mutual-fund-match" />
        </div>

        {/* Row 2: Fund Planning Tools strip */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: "6px" }}>
          <PlanningToolsStrip activeTool="/find-my-fund-quick-picks" />
        </div>

        {/* Trust stats */}
        <div style={{ display: "flex", gap: "clamp(16px, 3vw, 32px)", flexWrap: "wrap", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          {[
            { v: "1,500+", l: "Funds analysed",    c: "#34D399" },
            { v: "6",      l: "Goal presets",       c: "#60A5FA" },
            { v: "4",      l: "Risk profiles",      c: "#A78BFA" },
            { v: "Live",   l: "Always updated",     c: "#FCD34D" },
          ].map((m, i) => (
            <div key={i}>
              <div style={{ fontSize: "clamp(15px, 2.5vw, 18px)", fontWeight: 800, color: m.c, lineHeight: 1 }}>{m.v}</div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.45)", marginTop: "3px", fontWeight: 500 }}>{m.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
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
  suggestedLumpsum: number;
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
// MAIN PAGE HELPERS (copied exactly from main page)
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

// ─────────────────────────────────────────────────────────────────────────────
// buildBox — EXACTLY as in main page
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// DEBT GRID MAP (same as main page)
// ─────────────────────────────────────────────────────────────────────────────
const DEBT_CELL_MAP: Record<string, [number, number][]> = {
  "Overnight": [[0,0]], "Liquid": [[0,0]], "Ultra Short Duration": [[0,0]], "Money Market": [[0,0]],
  "Low Duration": [[1,0]], "Short Duration": [[1,0]], "Banking & PSU": [[1,0],[2,0]], "Corporate Bond": [[1,0],[2,0]],
  "Medium Duration": [[2,1]], "Gilt": [[2,0],[3,0]], "Long Duration": [[3,0]], "Dynamic Bond": [[3,0]],
  "Credit Risk": [[1,2],[2,2],[3,2]], "Medium to Long Duration": [[3,1]],
};

const HYBRID_ORDER = ["Aggressive Hybrid","Conservative Hybrid","Equity Savings","Arbitrage","Multi Asset Allocation","Balanced Advantage","Balanced Hybrid"];

// ─────────────────────────────────────────────────────────────────────────────
// 4-LAYER ALLOCATION ENGINE
// ─────────────────────────────────────────────────────────────────────────────

function computeAllocationPlan(horizonYears: number, riskScore: number, targetAmount: number): AllocationPlan {
  const timeBucket: AllocationPlan["timeBucket"] =
    horizonYears <= 2 ? "0-2Y" :
    horizonYears <= 5 ? "2-5Y" :
    horizonYears <= 10 ? "5-10Y" : "10Y+";

  const riskIntensity: AllocationPlan["riskIntensity"] =
    riskScore <= 3 ? "Conservative" :
    riskScore <= 5 ? "Balanced" :
    riskScore <= 7 ? "Growth" : "Aggressive";

  let blocks: ExposureBlock[] = [];

  if (timeBucket === "0-2Y") {
    if (riskIntensity === "Conservative") {
      blocks = [
        { type: "Capital Safety", pct: 70, emoji: "🛡️", description: "Park most of your money in high-quality short-term bond funds. Capital protection is the priority.", color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC",
          cells: [
            { matrix: "debt", row: 0, col: 0, label: "Overnight / Liquid Funds", allocationPct: 40 },
            { matrix: "debt", row: 1, col: 0, label: "Short Duration Bonds", allocationPct: 30 },
          ]},
        { type: "Stability", pct: 25, emoji: "⚓", description: "A small slice of conservative hybrids to add modest return above pure debt.", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0",
          cells: [
            { matrix: "hybrid", row: 1, col: 0, label: "Conservative Hybrid", allocationPct: 25 },
          ]},
        { type: "Core Equity", pct: 5, emoji: "📈", description: "Minimal equity exposure to beat inflation marginally.", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE",
          cells: [
            { matrix: "equity", row: 0, col: 1, label: "Large Cap Core", allocationPct: 5 },
          ]},
      ];
    } else if (riskIntensity === "Balanced") {
      blocks = [
        { type: "Capital Safety", pct: 55, emoji: "🛡️", description: "More than half in safe short-term debt to protect your capital.", color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC",
          cells: [
            { matrix: "debt", row: 0, col: 0, label: "Liquid / Ultra Short Funds", allocationPct: 30 },
            { matrix: "debt", row: 1, col: 0, label: "Short Duration Bonds", allocationPct: 25 },
          ]},
        { type: "Stability", pct: 25, emoji: "⚓", description: "Conservative and balanced hybrid funds to add some upside without much volatility.", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0",
          cells: [
            { matrix: "hybrid", row: 1, col: 0, label: "Conservative Hybrid", allocationPct: 15 },
            { matrix: "hybrid", row: 5, col: 0, label: "Balanced Advantage Fund", allocationPct: 10 },
          ]},
        { type: "Core Equity", pct: 20, emoji: "📈", description: "Large-cap exposure for mild growth participation.", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE",
          cells: [
            { matrix: "equity", row: 0, col: 1, label: "Large Cap Core", allocationPct: 12 },
            { matrix: "equity", row: 0, col: 0, label: "Large Cap Value", allocationPct: 8 },
          ]},
      ];
    } else if (riskIntensity === "Growth") {
      blocks = [
        { type: "Capital Safety", pct: 35, emoji: "🛡️", description: "Safety anchor — liquid and short-term bonds to protect principal over a short horizon.", color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC",
          cells: [
            { matrix: "debt", row: 0, col: 0, label: "Liquid / Money Market", allocationPct: 20 },
            { matrix: "debt", row: 1, col: 0, label: "Short Duration Bonds", allocationPct: 15 },
          ]},
        { type: "Balanced Equity", pct: 30, emoji: "⚖️", description: "Balanced advantage dynamically shifts equity-debt ratio — captures upside while managing short-term risk.", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE",
          cells: [
            { matrix: "hybrid", row: 5, col: 0, label: "Balanced Advantage Fund", allocationPct: 18 },
            { matrix: "hybrid", row: 0, col: 0, label: "Aggressive Hybrid", allocationPct: 12 },
          ]},
        { type: "Core Equity", pct: 35, emoji: "📈", description: "Diversified large-cap equity — quality companies that hold up better in short-term volatility.", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE",
          cells: [
            { matrix: "equity", row: 0, col: 1, label: "Large Cap Core", allocationPct: 20 },
            { matrix: "equity", row: 0, col: 0, label: "Large Cap Value", allocationPct: 15 },
          ]},
      ];
    } else {
      blocks = [
        { type: "Capital Safety", pct: 20, emoji: "🛡️", description: "Minimal safety buffer. Liquid funds for liquidity needs.", color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC",
          cells: [
            { matrix: "debt", row: 0, col: 0, label: "Liquid / Money Market", allocationPct: 20 },
          ]},
        { type: "Balanced Equity", pct: 35, emoji: "⚖️", description: "Aggressive and balanced hybrid — captures equity upside with built-in risk management for 2yr timeframe.", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE",
          cells: [
            { matrix: "hybrid", row: 0, col: 0, label: "Aggressive Hybrid", allocationPct: 20 },
            { matrix: "hybrid", row: 5, col: 0, label: "Balanced Advantage Fund", allocationPct: 15 },
          ]},
        { type: "Core Equity", pct: 45, emoji: "📈", description: "Large-cap equity across core and value styles — high equity tilt for an aggressive short-horizon investor.", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE",
          cells: [
            { matrix: "equity", row: 0, col: 1, label: "Large Cap Core", allocationPct: 25 },
            { matrix: "equity", row: 0, col: 0, label: "Large Cap Value", allocationPct: 12 },
            { matrix: "equity", row: 3, col: 1, label: "Flexi Cap", allocationPct: 8 },
          ]},
      ];
    }

  } else if (timeBucket === "2-5Y") {
    if (riskIntensity === "Conservative") {
      blocks = [
        { type: "Stability", pct: 45, emoji: "⚓", description: "Conservative and equity savings funds provide steady income with low volatility.", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0",
          cells: [
            { matrix: "hybrid", row: 1, col: 0, label: "Conservative Hybrid", allocationPct: 25 },
            { matrix: "hybrid", row: 2, col: 0, label: "Equity Savings Fund", allocationPct: 20 },
          ]},
        { type: "Capital Safety", pct: 30, emoji: "🛡️", description: "Medium-term bond funds providing predictable returns.", color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC",
          cells: [
            { matrix: "debt", row: 1, col: 0, label: "Corporate Bond / Banking PSU", allocationPct: 30 },
          ]},
        { type: "Core Equity", pct: 25, emoji: "📈", description: "Diversified across large-cap core and value styles to manage equity risk.", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE",
          cells: [
            { matrix: "equity", row: 0, col: 1, label: "Large Cap Core", allocationPct: 15 },
            { matrix: "equity", row: 0, col: 0, label: "Large Cap Value", allocationPct: 10 },
          ]},
      ];
    } else if (riskIntensity === "Balanced") {
      blocks = [
        { type: "Balanced Equity", pct: 40, emoji: "⚖️", description: "Balanced advantage and aggressive hybrid form the growth-safety bridge.", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE",
          cells: [
            { matrix: "hybrid", row: 5, col: 0, label: "Balanced Advantage Fund", allocationPct: 25 },
            { matrix: "hybrid", row: 0, col: 0, label: "Aggressive Hybrid", allocationPct: 15 },
          ]},
        { type: "Stability", pct: 25, emoji: "⚓", description: "Medium-term corporate bonds for stability anchor.", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0",
          cells: [
            { matrix: "debt", row: 1, col: 0, label: "Corporate Bond / Short Duration", allocationPct: 25 },
          ]},
        { type: "Core Equity", pct: 35, emoji: "📈", description: "Diversified equity across large, large-mid and flexi cap styles.", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE",
          cells: [
            { matrix: "equity", row: 0, col: 1, label: "Large Cap Core", allocationPct: 15 },
            { matrix: "equity", row: 3, col: 1, label: "Flexi Cap", allocationPct: 12 },
            { matrix: "equity", row: 0, col: 0, label: "Large Cap Value", allocationPct: 8 },
          ]},
      ];
    } else if (riskIntensity === "Growth") {
      blocks = [
        { type: "Core Equity", pct: 45, emoji: "📈", description: "Broad equity diversification across size and style.", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE",
          cells: [
            { matrix: "equity", row: 0, col: 1, label: "Large Cap Core", allocationPct: 20 },
            { matrix: "equity", row: 3, col: 1, label: "Flexi Cap", allocationPct: 15 },
            { matrix: "equity", row: 0, col: 0, label: "Large Cap Value", allocationPct: 10 },
          ]},
        { type: "High Growth", pct: 20, emoji: "🚀", description: "Mid-cap for meaningful return premium over 3-5 year horizon.", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA",
          cells: [
            { matrix: "equity", row: 1, col: 1, label: "Mid Cap", allocationPct: 20 },
          ]},
        { type: "Balanced Equity", pct: 15, emoji: "⚖️", description: "Multi-asset allocation for tactical flexibility.", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE",
          cells: [
            { matrix: "hybrid", row: 4, col: 0, label: "Multi Asset Allocation", allocationPct: 15 },
          ]},
        { type: "Stability", pct: 20, emoji: "⚓", description: "Corporate bonds as a ballast against equity volatility.", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0",
          cells: [
            { matrix: "debt", row: 1, col: 0, label: "Corporate Bond / Banking PSU", allocationPct: 20 },
          ]},
      ];
    } else {
      blocks = [
        { type: "Core Equity", pct: 40, emoji: "📈", description: "Large and flexi cap for broad equity foundation.", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE",
          cells: [
            { matrix: "equity", row: 0, col: 1, label: "Large Cap Core", allocationPct: 20 },
            { matrix: "equity", row: 3, col: 1, label: "Flexi Cap", allocationPct: 20 },
          ]},
        { type: "High Growth", pct: 30, emoji: "🚀", description: "Mid-cap exposure for aggressive return target over medium horizon.", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA",
          cells: [
            { matrix: "equity", row: 1, col: 1, label: "Mid Cap", allocationPct: 30 },
          ]},
        { type: "Tactical", pct: 10, emoji: "⚡", description: "Limited tactical allocation — just enough to capture factor alpha without outsized short-term risk.", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A",
          cells: [
            { matrix: "hybrid", row: 0, col: 0, label: "Aggressive Hybrid", allocationPct: 10 },
          ]},
        { type: "Stability", pct: 20, emoji: "⚓", description: "Short-duration bonds as a crucial safety cushion for a medium-horizon aggressive portfolio.", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0",
          cells: [
            { matrix: "debt", row: 1, col: 0, label: "Short Duration Bonds", allocationPct: 20 },
          ]},
      ];
    }

  } else if (timeBucket === "5-10Y") {
    if (riskIntensity === "Conservative") {
      blocks = [
        { type: "Core Equity", pct: 40, emoji: "📈", description: "Diversified across large, value and flexi styles — equity over 5 years has strong historical record.", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE",
          cells: [
            { matrix: "equity", row: 0, col: 1, label: "Large Cap Core", allocationPct: 20 },
            { matrix: "equity", row: 0, col: 0, label: "Large Cap Value", allocationPct: 10 },
            { matrix: "equity", row: 3, col: 1, label: "Flexi Cap", allocationPct: 10 },
          ]},
        { type: "Balanced Equity", pct: 25, emoji: "⚖️", description: "Balanced advantage dynamically manages equity-debt ratio based on market valuations.", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE",
          cells: [
            { matrix: "hybrid", row: 5, col: 0, label: "Balanced Advantage Fund", allocationPct: 15 },
            { matrix: "hybrid", row: 1, col: 0, label: "Conservative Hybrid", allocationPct: 10 },
          ]},
        { type: "Stability", pct: 35, emoji: "⚓", description: "Medium-duration corporate bonds provide predictable returns and reduce overall volatility.", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0",
          cells: [
            { matrix: "debt", row: 1, col: 0, label: "Corporate Bond", allocationPct: 20 },
            { matrix: "debt", row: 2, col: 0, label: "Medium Duration Bonds", allocationPct: 15 },
          ]},
      ];
    } else if (riskIntensity === "Balanced") {
      blocks = [
        { type: "Core Equity", pct: 50, emoji: "📈", description: "Diversified equity across three styles — core, value, and flexi — for broad market participation.", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE",
          cells: [
            { matrix: "equity", row: 0, col: 1, label: "Large Cap Core", allocationPct: 20 },
            { matrix: "equity", row: 3, col: 1, label: "Flexi Cap", allocationPct: 18 },
            { matrix: "equity", row: 0, col: 0, label: "Large Cap Value", allocationPct: 12 },
          ]},
        { type: "Balanced Equity", pct: 25, emoji: "⚖️", description: "Multi-asset and balanced advantage for tactical balance.", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE",
          cells: [
            { matrix: "hybrid", row: 4, col: 0, label: "Multi Asset Allocation", allocationPct: 15 },
            { matrix: "hybrid", row: 5, col: 0, label: "Balanced Advantage Fund", allocationPct: 10 },
          ]},
        { type: "Stability", pct: 25, emoji: "⚓", description: "Corporate bonds to anchor the portfolio during market downturns.", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0",
          cells: [
            { matrix: "debt", row: 1, col: 0, label: "Corporate Bond / Banking PSU", allocationPct: 25 },
          ]},
      ];
    } else if (riskIntensity === "Growth") {
      blocks = [
        { type: "Core Equity", pct: 45, emoji: "📈", description: "Style-diversified equity across large, value, and flexi cap.", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE",
          cells: [
            { matrix: "equity", row: 0, col: 1, label: "Large Cap Core", allocationPct: 18 },
            { matrix: "equity", row: 3, col: 1, label: "Flexi Cap", allocationPct: 17 },
            { matrix: "equity", row: 0, col: 0, label: "Large Cap Value", allocationPct: 10 },
          ]},
        { type: "High Growth", pct: 20, emoji: "🚀", description: "Mid-cap allocation for meaningful return premium over large cap.", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA",
          cells: [
            { matrix: "equity", row: 1, col: 1, label: "Mid Cap", allocationPct: 20 },
          ]},
        { type: "Tactical", pct: 15, emoji: "⚡", description: "Momentum and multi-asset for alpha generation — 5yr+ horizon allows factor premium to play out.", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A",
          cells: [
            { matrix: "equity", row: 0, col: 2, label: "Momentum", allocationPct: 8 },
            { matrix: "hybrid", row: 4, col: 0, label: "Multi Asset Allocation", allocationPct: 7 },
          ]},
        { type: "Stability", pct: 20, emoji: "⚓", description: "Corporate bonds as stability anchor.", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0",
          cells: [
            { matrix: "debt", row: 1, col: 0, label: "Corporate Bond", allocationPct: 20 },
          ]},
      ];
    } else {
      blocks = [
        { type: "Core Equity", pct: 40, emoji: "📈", description: "Large and flexi cap — the foundation.", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE",
          cells: [
            { matrix: "equity", row: 0, col: 1, label: "Large Cap Core", allocationPct: 20 },
            { matrix: "equity", row: 3, col: 1, label: "Flexi Cap", allocationPct: 20 },
          ]},
        { type: "High Growth", pct: 30, emoji: "🚀", description: "Mid and small cap for high-conviction long-horizon upside.", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA",
          cells: [
            { matrix: "equity", row: 1, col: 1, label: "Mid Cap", allocationPct: 18 },
            { matrix: "equity", row: 2, col: 1, label: "Small Cap", allocationPct: 12 },
          ]},
        { type: "Tactical", pct: 20, emoji: "⚡", description: "Momentum and aggressive hybrid for tactical return boosting.", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A",
          cells: [
            { matrix: "equity", row: 0, col: 2, label: "Momentum", allocationPct: 12 },
            { matrix: "hybrid", row: 0, col: 0, label: "Aggressive Hybrid", allocationPct: 8 },
          ]},
        { type: "Stability", pct: 10, emoji: "⚓", description: "Minimal debt buffer.", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0",
          cells: [
            { matrix: "debt", row: 1, col: 0, label: "Corporate Bond", allocationPct: 10 },
          ]},
      ];
    }

  } else {
    if (riskIntensity === "Conservative") {
      blocks = [
        { type: "Core Equity", pct: 50, emoji: "📈", description: "Compounding engine — diversified large, value, and flexi cap.", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE",
          cells: [
            { matrix: "equity", row: 0, col: 1, label: "Large Cap Core", allocationPct: 22 },
            { matrix: "equity", row: 3, col: 1, label: "Flexi Cap", allocationPct: 18 },
            { matrix: "equity", row: 0, col: 0, label: "Large Cap Value", allocationPct: 10 },
          ]},
        { type: "Balanced Equity", pct: 25, emoji: "⚖️", description: "Balanced advantage and multi-asset as path-smoother.", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE",
          cells: [
            { matrix: "hybrid", row: 5, col: 0, label: "Balanced Advantage Fund", allocationPct: 15 },
            { matrix: "hybrid", row: 4, col: 0, label: "Multi Asset Allocation", allocationPct: 10 },
          ]},
        { type: "Stability", pct: 25, emoji: "⚓", description: "Medium-duration bonds for stability and predictable returns.", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0",
          cells: [
            { matrix: "debt", row: 1, col: 0, label: "Corporate Bond", allocationPct: 15 },
            { matrix: "debt", row: 2, col: 0, label: "Medium Duration", allocationPct: 10 },
          ]},
      ];
    } else if (riskIntensity === "Balanced") {
      blocks = [
        { type: "Core Equity", pct: 55, emoji: "📈", description: "Three-style equity diversification — the long-term compounding core.", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE",
          cells: [
            { matrix: "equity", row: 0, col: 1, label: "Large Cap Core", allocationPct: 22 },
            { matrix: "equity", row: 3, col: 1, label: "Flexi Cap", allocationPct: 20 },
            { matrix: "equity", row: 0, col: 0, label: "Large Cap Value", allocationPct: 13 },
          ]},
        { type: "High Growth", pct: 20, emoji: "🚀", description: "Mid-cap for long-horizon return premium.", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA",
          cells: [
            { matrix: "equity", row: 1, col: 1, label: "Mid Cap", allocationPct: 20 },
          ]},
        { type: "Stability", pct: 25, emoji: "⚓", description: "Corporate and medium-duration bonds to reduce portfolio-level volatility.", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0",
          cells: [
            { matrix: "debt", row: 1, col: 0, label: "Corporate Bond", allocationPct: 15 },
            { matrix: "debt", row: 2, col: 0, label: "Medium Duration", allocationPct: 10 },
          ]},
      ];
    } else if (riskIntensity === "Growth") {
      blocks = [
        { type: "Core Equity", pct: 45, emoji: "📈", description: "Broad equity — style diversification reduces factor concentration risk.", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE",
          cells: [
            { matrix: "equity", row: 0, col: 1, label: "Large Cap Core", allocationPct: 18 },
            { matrix: "equity", row: 3, col: 1, label: "Flexi Cap", allocationPct: 17 },
            { matrix: "equity", row: 0, col: 0, label: "Large Cap Value", allocationPct: 10 },
          ]},
        { type: "High Growth", pct: 30, emoji: "🚀", description: "Mid + small cap for long-term compounding upside.", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA",
          cells: [
            { matrix: "equity", row: 1, col: 1, label: "Mid Cap", allocationPct: 18 },
            { matrix: "equity", row: 2, col: 1, label: "Small Cap", allocationPct: 12 },
          ]},
        { type: "Tactical", pct: 10, emoji: "⚡", description: "Momentum as a return booster for long horizons.", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A",
          cells: [
            { matrix: "equity", row: 0, col: 2, label: "Momentum", allocationPct: 10 },
          ]},
        { type: "Stability", pct: 15, emoji: "⚓", description: "Small bond allocation for volatility dampening.", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0",
          cells: [
            { matrix: "debt", row: 1, col: 0, label: "Corporate Bond", allocationPct: 15 },
          ]},
      ];
    } else {
      blocks = [
        { type: "Core Equity", pct: 40, emoji: "📈", description: "Large and flexi cap — foundational equity.", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE",
          cells: [
            { matrix: "equity", row: 0, col: 1, label: "Large Cap Core", allocationPct: 20 },
            { matrix: "equity", row: 3, col: 1, label: "Flexi Cap", allocationPct: 20 },
          ]},
        { type: "High Growth", pct: 35, emoji: "🚀", description: "Mid + small cap for maximum compounding over 10+ years.", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA",
          cells: [
            { matrix: "equity", row: 1, col: 1, label: "Mid Cap", allocationPct: 20 },
            { matrix: "equity", row: 2, col: 1, label: "Small Cap", allocationPct: 15 },
          ]},
        { type: "Tactical", pct: 15, emoji: "⚡", description: "Momentum + manager's best bets for alpha-seeking exposure.", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A",
          cells: [
            { matrix: "equity", row: 0, col: 2, label: "Momentum", allocationPct: 8 },
            { matrix: "equity", row: 3, col: 3, label: "Manager's Best Bets", allocationPct: 7 },
          ]},
        { type: "Stability", pct: 10, emoji: "⚓", description: "Minimal debt buffer for liquidity.", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0",
          cells: [
            { matrix: "debt", row: 1, col: 0, label: "Corporate Bond", allocationPct: 10 },
          ]},
      ];
    }
  }

  const blockReturnMap: Record<ExposureBlockType, { lo: number; hi: number }> = {
    "Capital Safety": { lo: 5.5, hi: 7.5 },
    "Stability": { lo: 7.0, hi: 9.0 },
    "Balanced Equity": { lo: 9.0, hi: 12.0 },
    "Core Equity": { lo: 11.0, hi: 15.0 },
    "High Growth": { lo: 13.0, hi: 18.0 },
    "Tactical": { lo: 12.0, hi: 17.0 },
  };

  let expectedReturnLo = 0, expectedReturnHi = 0;
  blocks.forEach(b => {
    expectedReturnLo += (b.pct / 100) * blockReturnMap[b.type].lo;
    expectedReturnHi += (b.pct / 100) * blockReturnMap[b.type].hi;
  });

  const equityPct = blocks.filter(b => ["Core Equity","High Growth","Tactical"].includes(b.type)).reduce((s, b) => s + b.pct, 0);
  const hybridPct = blocks.filter(b => ["Balanced Equity"].includes(b.type)).reduce((s, b) => s + b.pct, 0);
  const maxDrawdown = -Math.round(equityPct * 0.42 + hybridPct * 0.18) / 100 * 100;

  const successRate = timeBucket === "0-2Y"
    ? riskIntensity === "Conservative" ? 94 : 85
    : timeBucket === "2-5Y"
    ? riskIntensity === "Conservative" ? 88 : riskIntensity === "Balanced" ? 84 : 80
    : timeBucket === "5-10Y"
    ? riskIntensity === "Conservative" ? 86 : riskIntensity === "Aggressive" ? 89 : 85
    : riskIntensity === "Aggressive" ? 91 : 88;

  const midRate = (expectedReturnLo + expectedReturnHi) / 2;
  const r = midRate / 100 / 12;
  const n = horizonYears * 12;
  const sipFV = r === 0 ? 0 : ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  const suggestedMonthlySIP = sipFV > 0 ? Math.ceil(targetAmount / sipFV / 100) * 100 : Math.ceil(targetAmount / n / 100) * 100;
  const suggestedLumpsum = Math.ceil(targetAmount / Math.pow(1 + midRate / 100, horizonYears) / 1000) * 1000;

  const riskLabel = riskIntensity;
  const timeLabel = timeBucket === "0-2Y" ? "Short-term" : timeBucket === "2-5Y" ? "Medium-term" : timeBucket === "5-10Y" ? "Growth-horizon" : "Long-term";
  const label = `${riskLabel} ${timeLabel}`;

  const plainEnglishMap: Record<string, string> = {
    "Conservative 0-2Y": "You're keeping your money safe — like a careful saver who wants to sleep well at night. Almost everything goes into bonds and conservative funds.",
    "Balanced 0-2Y": "A cautious investor who wants slightly more than a savings account. Mostly bonds, with a small equity boost.",
    "Growth 0-2Y": "You're willing to accept some short-term swings for better returns. Balanced hybrids bridge growth and safety — no reckless bets on a 2yr horizon.",
    "Aggressive 0-2Y": "High equity tilt for a short horizon — large-cap quality over speculation. Hybrids provide built-in risk management while keeping equity exposure high.",
    "Conservative 2-5Y": "Think of this as a balanced parent saving for a child's near-term goal. Safety comes first, with some equity upside.",
    "Balanced 2-5Y": "A seasoned investor diversifying sensibly — hybrid funds bridge safety and growth, equity adds long-term punch.",
    "Growth 2-5Y": "Growth-focused with medium-term discipline. Equity leads with mid-cap kicker, multi-asset adds flexibility, bonds cushion volatility.",
    "Aggressive 2-5Y": "Confident investor with high equity conviction. Mid-cap leads the charge, but a meaningful bond buffer acknowledges the 5yr ceiling — no momentum bets yet.",
    "Conservative 5-10Y": "A thoughtful investor letting time do the work. Equity takes the lead with a safety net of bonds.",
    "Balanced 5-10Y": "A classic 5-year investor — equity-led growth, balanced by hybrids and bonds.",
    "Growth 5-10Y": "Growth-mode with disciplined diversification. Mid-caps add meaningful return premium. Tactical overlay kicks in — horizon is long enough for momentum to work.",
    "Aggressive 5-10Y": "Swinging for long-term wealth creation. High equity across all caps with tactical alpha overlay. Small-cap enters — the 5yr+ horizon justifies the volatility.",
    "Conservative 10Y+": "Long-term wealth builder playing it steady. Time is your biggest asset — let compounding do the work.",
    "Balanced 10Y+": "A wealth-building plan for life. Equity-led with mid-cap kicker and bonds for smoother ride.",
    "Growth 10Y+": "Serious long-term investor. Full equity diversification with mid + small cap for compounding power.",
    "Aggressive 10Y+": "Maximum compounding mode. High equity across all caps, tactical momentum overlay, minimal bonds.",
  };

  const plainEnglish = plainEnglishMap[`${riskIntensity} ${timeBucket}`] || "A well-diversified portfolio designed for your horizon and risk comfort.";

  return {
    timeBucket, riskIntensity, blocks, label, plainEnglish,
    expectedReturnLo: parseFloat(expectedReturnLo.toFixed(1)),
    expectedReturnHi: parseFloat(expectedReturnHi.toFixed(1)),
    maxDrawdown: parseFloat(maxDrawdown.toFixed(1)),
    successRate,
    suggestedMonthlySIP,
    suggestedLumpsum,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// RESOLVE FUNDS FROM LIVE DATA using same buildBox logic
// ─────────────────────────────────────────────────────────────────────────────

function resolveAllFunds(
  plan: AllocationPlan,
  amfiRaw: AMFIFund[],
  fundAnalytics: FundAnalytics[],
  etfAnalytics: ETFAnalytics[],
  insights: InsightRow[]
): ResolvedFundSlot[] {
  const results: ResolvedFundSlot[] = [];
  const seenFunds = new Set<string>();

  const equityGridMap: AMFIFund[][][] = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => []));
  for (const fund of amfiRaw) {
    if (shouldExclude(fund)) continue;
    const col = getStyle(fund);
    const row = getSize(fund);
    if (row !== null) equityGridMap[row][col].push(fund);
  }

  const hybridFunds = amfiRaw.filter(f => f.Category === "Hybrid");
  const hybridBySubCat: Record<string, AMFIFund[]> = {};
  hybridFunds.forEach(f => { if (!hybridBySubCat[f.Sub_Category]) hybridBySubCat[f.Sub_Category] = []; hybridBySubCat[f.Sub_Category].push(f); });

  const debtGridMap: AMFIFund[][][] = Array.from({ length: 4 }, () => Array.from({ length: 3 }, () => []));
  for (const fund of amfiRaw) {
    if (fund.Category !== "Debt") continue;
    if (DEBT_CELL_MAP[fund.Sub_Category]) DEBT_CELL_MAP[fund.Sub_Category].forEach(([r, c]) => debtGridMap[r][c].push(fund));
  }

  for (const block of plan.blocks) {
    for (const cell of block.cells) {
      let cellFunds: AMFIFund[] = [];

      if (cell.matrix === "equity") {
        cellFunds = equityGridMap[cell.row]?.[cell.col] || [];
      } else if (cell.matrix === "hybrid") {
        const subCatName = HYBRID_ORDER[cell.row];
        cellFunds = hybridBySubCat[subCatName] || [];
      } else if (cell.matrix === "debt") {
        cellFunds = debtGridMap[cell.row]?.[cell.col] || [];
      }

      const box = buildBox(cell.row, cell.col, cellFunds, fundAnalytics, etfAnalytics, insights);

      if (!box.empty && box.selectedFund) {
        const fundName = 'Fund_Name' in box.selectedFund ? box.selectedFund.Fund_Name : (box.selectedFund as ETFAnalytics).ETF_Name;
        if (seenFunds.has(fundName)) continue;
        seenFunds.add(fundName);

        results.push({
          exposureBlock: block.type,
          blockColor: block.color,
          blockBg: block.bg,
          blockBorder: block.border,
          blockPct: block.pct,
          cellLabel: cell.label,
          cellAllocationPct: cell.allocationPct,
          box,
          fundName,
          isActive: box.decision === "ACTIVE",
          subCategory: box.leadingSubCategory,
          stats: box.fundStats,
        });
      }
    }
  }

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function fmtINR(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${Math.round(n)}`;
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

const GOAL_PRESETS = [
  { emoji: "🛡️", label: "Emergency Fund", amount: 5, horizon: 1, risk: 2, tip: "3-6 months expenses, safely parked" },
  { emoji: "✈️", label: "Dream Vacation", amount: 3, horizon: 2, risk: 3, tip: "₹3L international trip in 2 years" },
  { emoji: "🚗", label: "Buy a Car", amount: 10, horizon: 3, risk: 5, tip: "₹10L car down payment" },
  { emoji: "🏠", label: "Home Down Payment", amount: 30, horizon: 6, risk: 5, tip: "20% of a ₹1.5Cr flat" },
  { emoji: "👶", label: "Child's Education", amount: 50, horizon: 12, risk: 6, tip: "Fund a professional degree" },
  { emoji: "🌴", label: "Retirement", amount: 500, horizon: 25, risk: 7, tip: "Build a retirement corpus" },
];

// ─────────────────────────────────────────────────────────────────────────────
// FUND DETAIL MODAL
// ─────────────────────────────────────────────────────────────────────────────

function FundDetailModal({ slot, onClose }: { slot: ResolvedFundSlot; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: '24px', maxWidth: '700px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 40px 100px rgba(0,0,0,0.2)', border: '1px solid #E2E8F0' }} onClick={e => e.stopPropagation()}>

        <div style={{ position: 'sticky', top: 0, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(8px)', padding: '18px 22px', borderBottom: '1px solid #F1F5F9', zIndex: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', padding: '2px 9px', borderRadius: '100px', background: slot.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)', color: slot.isActive ? '#059669' : '#2563EB', border: `1px solid ${slot.isActive ? 'rgba(16,185,129,0.25)' : 'rgba(59,130,246,0.25)'}`, fontWeight: 700 }}>
                  {slot.isActive ? '● ACTIVE' : '◆ INDEX'}
                </span>
                <span style={{ fontSize: '11px', padding: '2px 9px', borderRadius: '100px', background: slot.blockBg, color: slot.blockColor, border: `1px solid ${slot.blockBorder}`, fontWeight: 700 }}>{slot.exposureBlock}</span>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>{slot.cellAllocationPct}% of portfolio</span>
              </div>
              <h3 style={{ fontSize: 'clamp(14px,3vw,18px)', fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.2 }}>{slot.fundName}</h3>
              <p style={{ fontSize: '12px', color: '#64748B', margin: '3px 0 0' }}>Type: <strong>{slot.subCategory}</strong> · {slot.box.candidateSubCategories.length} fund types compared</p>
            </div>
            <button onClick={onClose} style={{ width: '34px', height: '34px', borderRadius: '10px', border: 'none', background: '#F1F5F9', color: '#64748B', fontSize: '18px', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>
        </div>

        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {slot.stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px' }}>
              {[
                { label: '3Y Returns', value: `${slot.stats.return3Y?.toFixed(2)}%`, color: '#0F172A' },
                { label: '5Y Returns', value: slot.stats.return5Y ? `${slot.stats.return5Y.toFixed(2)}%` : '—', color: '#0F172A' },
                { label: 'Extra vs Index', value: `${slot.stats.alpha3Y && slot.stats.alpha3Y > 0 ? '+' : ''}${slot.stats.alpha3Y?.toFixed(2)}%`, color: slot.stats.alpha3Y && slot.stats.alpha3Y > 0 ? '#059669' : '#DC2626' },
                { label: 'Category Rank', value: `#${slot.stats.rank}`, color: '#0F172A' },
                { label: 'Fund Size', value: `₹${(slot.stats.aum / 1000).toFixed(0)}K Cr`, color: '#0F172A' },
              ].map((s, i) => (
                <div key={i} style={{ background: '#F8FAFC', borderRadius: '10px', padding: '10px 12px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '10px', color: '#94A3B8', marginBottom: '3px' }}>{s.label}</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '14px 16px', display: 'flex', gap: '10px' }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>💡</span>
            <div>
              <h4 style={{ fontWeight: 700, color: '#1E40AF', fontSize: '13px', margin: '0 0 4px' }}>Why this fund?</h4>
              <p style={{ fontSize: '12px', color: '#1E3A8A', margin: 0, lineHeight: 1.65 }}>
                We compared <strong>{slot.box.candidateSubCategories.length}</strong> sub-categories in this slot.
                <strong> {slot.subCategory}</strong> delivered the highest average alpha above its benchmark.
                Within that, this fund ranks <strong>#{slot.stats?.rank}</strong> — the top pick by composite score.
                {slot.stats?.alpha3Y && slot.stats.alpha3Y > 0 && ` It delivered +${slot.stats.alpha3Y.toFixed(1)}% extra returns above the market index over 3 years.`}
              </p>
            </div>
          </div>

          {slot.box.candidateSubCategories.length > 1 && (
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>Sub-categories compared for this slot</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[...slot.box.candidateSubCategories].sort((a, b) => b.avgAlpha - a.avgAlpha).map((sc, i) => {
                  const isWinner = sc.subCategoryName === slot.subCategory;
                  return (
                    <div key={i} style={{ padding: '10px 14px', borderRadius: '10px', border: `1px solid ${isWinner ? '#A7F3D0' : '#E2E8F0'}`, background: isWinner ? '#ECFDF5' : '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#1F2937' }}>{sc.subCategoryName}</span>
                        {isWinner && <span style={{ fontSize: '9px', background: '#059669', color: 'white', padding: '1px 7px', borderRadius: '100px', fontWeight: 700 }}>WINNER</span>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '9px', color: '#94A3B8' }}>Avg alpha (extra return)</div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: sc.avgAlpha > 0 ? '#059669' : '#DC2626' }}>{sc.avgAlpha > 0 ? '+' : ''}{sc.avgAlpha.toFixed(2)}%</div>
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
// FUND SLOT CARD
// ─────────────────────────────────────────────────────────────────────────────

function FundSlotCard({ slot, sipAmount, onDetail }: { slot: ResolvedFundSlot; sipAmount: number; onDetail: () => void }) {
  const slotSIP = Math.round(sipAmount * slot.cellAllocationPct / 100 / 100) * 100;

  return (
    <div style={{ background: 'white', border: `1.5px solid ${slot.blockBorder}`, borderRadius: '16px', padding: '16px', position: 'relative', transition: 'box-shadow 0.2s, transform 0.2s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 24px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = ''; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}>

      {slotSIP > 0 && (
        <div style={{ position: 'absolute', top: 12, right: 12, background: slot.blockBg, border: `1px solid ${slot.blockBorder}`, borderRadius: '100px', padding: '3px 10px', fontSize: '10px', fontWeight: 700, color: slot.blockColor }}>
          ₹{slotSIP.toLocaleString('en-IN')}/mo
        </div>
      )}

      <div style={{ display: 'flex', gap: '5px', marginBottom: '8px', flexWrap: 'wrap', paddingRight: slotSIP > 0 ? '90px' : '0' }}>
        <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '100px', background: slot.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)', color: slot.isActive ? '#059669' : '#2563EB', border: `1px solid ${slot.isActive ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)'}` }}>
          {slot.isActive ? '● ACTIVE' : '◆ INDEX'}
        </span>
        <span style={{ fontSize: '9px', color: '#94A3B8', fontWeight: 500, alignSelf: 'center' }}>{slot.subCategory}</span>
      </div>

      <div style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A', lineHeight: 1.3, marginBottom: '10px' }}>{slot.fundName}</div>

      {slot.stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px', marginBottom: '10px' }}>
          {[
            { label: '3Y Returns', value: `${slot.stats.return3Y?.toFixed(1)}%`, color: '#059669' },
            { label: 'vs Index', value: `${slot.stats.alpha3Y && slot.stats.alpha3Y > 0 ? '+' : ''}${slot.stats.alpha3Y?.toFixed(1)}%`, color: slot.stats.alpha3Y && slot.stats.alpha3Y > 0 ? '#059669' : '#DC2626' },
            { label: `Rank`, value: `#${slot.stats.rank}`, color: '#1E3A5F' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#F8FAFC', borderRadius: '8px', padding: '7px 8px', textAlign: 'center', border: '1px solid #F1F5F9' }}>
              <div style={{ fontSize: '9px', color: '#94A3B8', lineHeight: 1.2, marginBottom: '2px' }}>{s.label}</div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <button onClick={onDetail} style={{ width: '100%', background: slot.blockBg, border: `1px solid ${slot.blockBorder}`, borderRadius: '8px', padding: '7px', fontSize: '11px', fontWeight: 700, color: slot.blockColor, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontFamily: 'inherit' }}>
        Why this fund? →
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ALLOCATION VISUAL
// ─────────────────────────────────────────────────────────────────────────────

function ExposureBar({ blocks }: { blocks: ExposureBlock[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', borderRadius: '12px', overflow: 'hidden', height: '16px' }}>
        {blocks.map((b, i) => (
          <div key={i} style={{ width: `${b.pct}%`, background: b.color, opacity: 0.85, transition: 'width 0.6s ease' }} title={`${b.type} ${b.pct}%`} />
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {blocks.map((b, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: b.color }} />
            <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 600 }}>{b.type} {b.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function QuickFundPicksPage() {
  const [amfiRaw, setAmfiRaw] = useState<AMFIFund[]>([]);
  const [fundAnalytics, setFundAnalytics] = useState<FundAnalytics[]>([]);
  const [etfAnalytics, setEtfAnalytics] = useState<ETFAnalytics[]>([]);
  const [insights, setInsights] = useState<InsightRow[]>([]);
  const [dataReady, setDataReady] = useState(false);

  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [goalName, setGoalName] = useState("");
  const [targetLakh, setTargetLakh] = useState("");
  const [horizonYears, setHorizonYears] = useState("");
  const [riskScore, setRiskScore] = useState(5);
  const [generating, setGenerating] = useState(false);

  const [plan, setPlan] = useState<AllocationPlan | null>(null);
  const [resolvedFunds, setResolvedFunds] = useState<ResolvedFundSlot[]>([]);
  const [projections, setProjections] = useState<{ low: number; mid: number; high: number; invested: number } | null>(null);
  const [selectedFundSlot, setSelectedFundSlot] = useState<ResolvedFundSlot | null>(null);

  const [showFunds, setShowFunds] = useState(true);
  const [showAllocation, setShowAllocation] = useState(true);
  const [showHowItWorks, setShowHowItWorks] = useState(true);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetchCachedJson<AMFIFund[]>("amfiRaw"),
      fetchCachedJson<FundAnalytics[]>("funds"),
      fetchCachedJson<ETFAnalytics[]>("etfs"),
      fetchCachedJson<InsightRow[]>("insights"),
    ]).then(([amfi, funds, etfs, ins]) => {
      setAmfiRaw(amfi);
      setFundAnalytics(funds);
      setEtfAnalytics(etfs);
      setInsights(ins);
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
  }

  function generate() {
    if (!goalName || !targetLakh || !horizonYears) return;
    setGenerating(true);
    setPlan(null);
    setResolvedFunds([]);
    setShowFunds(true);
    setShowAllocation(true);
    setShowHowItWorks(true);

    setTimeout(() => {
      const horizon = parseInt(horizonYears);
      const targetAmount = parseFloat(targetLakh) * 100000;
      const newPlan = computeAllocationPlan(horizon, riskScore, targetAmount);

      const midRate = (newPlan.expectedReturnLo + newPlan.expectedReturnHi) / 2;
      const sipProjLow = sipFutureValue(newPlan.suggestedMonthlySIP, horizon, newPlan.expectedReturnLo);
      const sipProjMid = sipFutureValue(newPlan.suggestedMonthlySIP, horizon, midRate);
      const sipProjHigh = sipFutureValue(newPlan.suggestedMonthlySIP, horizon, newPlan.expectedReturnHi);
      const sipInvested = newPlan.suggestedMonthlySIP * horizon * 12;

      setProjections({ low: sipProjLow, mid: sipProjMid, high: sipProjHigh, invested: sipInvested });

      const funds = dataReady ? resolveAllFunds(newPlan, amfiRaw, fundAnalytics, etfAnalytics, insights) : [];
      setPlan(newPlan);
      setResolvedFunds(funds);
      setGenerating(false);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    }, 1000);
  }

  const canGenerate = !!goalName && !!targetLakh && !!horizonYears;
  const riskColor = riskScore <= 3 ? "#059669" : riskScore <= 5 ? "#0891B2" : riskScore <= 7 ? "#D97706" : "#DC2626";
  const riskLabel = riskScore <= 3 ? "Conservative — safety first" : riskScore <= 5 ? "Balanced — steady growth" : riskScore <= 7 ? "Growth — equity-led" : "Aggressive — maximum returns";

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif", color: '#1F2937' }}>

      <HeroSection />

      {/* FORM */}
      <div style={{ maxWidth: '820px', margin: '0 auto', padding: 'clamp(24px,4vw,44px) clamp(12px,3vw,24px)' }}>

        {/* Preset chips */}
        <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 1px 6px rgba(0,0,0,0.04)', padding: 'clamp(16px,3vw,22px)', marginBottom: '14px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Pick a common goal to start</div>
          <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '14px' }}>Or fill in your own details below</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px' }}>
            {GOAL_PRESETS.map((g, i) => (
              <button key={i} onClick={() => applyPreset(i)}
                style={{ background: selectedPreset === i ? '#EFF6FF' : '#F8FAFC', border: `2px solid ${selectedPreset === i ? '#BFDBFE' : '#E2E8F0'}`, borderRadius: '14px', padding: '12px 8px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s', fontFamily: 'inherit' }}>
                <div style={{ fontSize: '22px', marginBottom: '5px' }}>{g.emoji}</div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: selectedPreset === i ? '#1E40AF' : '#374151', lineHeight: 1.3 }}>{g.label}</div>
                <div style={{ fontSize: '9px', color: '#94A3B8', marginTop: '3px', lineHeight: 1.3 }}>{g.tip}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Main form */}
        <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 1px 6px rgba(0,0,0,0.04)', padding: 'clamp(16px,3vw,28px)' }}>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', marginBottom: '20px' }}>Your goal details</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>What are you saving for? <span style={{ color: '#DC2626' }}>*</span></label>
              <input value={goalName} onChange={e => setGoalName(e.target.value)} placeholder="e.g. My First Car, Daughter's College, Europe Trip…"
                style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #E2E8F0', fontSize: '14px', color: '#0F172A', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                onFocus={e => (e.target.style.borderColor = '#3B82F6')} onBlur={e => (e.target.style.borderColor = '#E2E8F0')} />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>Target amount needed <span style={{ color: '#DC2626' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#94A3B8', fontWeight: 700 }}>₹</span>
                <input type="number" value={targetLakh} onChange={e => setTargetLakh(e.target.value)} placeholder="Amount in Lakhs"
                  style={{ width: '100%', padding: '11px 14px 11px 26px', borderRadius: '10px', border: '1.5px solid #E2E8F0', fontSize: '14px', color: '#0F172A', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  onFocus={e => (e.target.style.borderColor = '#3B82F6')} onBlur={e => (e.target.style.borderColor = '#E2E8F0')} />
              </div>
              {targetLakh && <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px', fontWeight: 600 }}>{fmtINR(parseFloat(targetLakh) * 100000)}</div>}
              <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '3px' }}>Enter in Lakhs. "10" = ₹10 Lakhs</div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>In how many years? <span style={{ color: '#DC2626' }}>*</span></label>
              <input type="number" value={horizonYears} onChange={e => setHorizonYears(e.target.value)} placeholder="Years" min="1" max="40"
                style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #E2E8F0', fontSize: '14px', color: '#0F172A', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                onFocus={e => (e.target.style.borderColor = '#3B82F6')} onBlur={e => (e.target.style.borderColor = '#E2E8F0')} />
              {horizonYears && (
                <div style={{ fontSize: '11px', marginTop: '4px', fontWeight: 600, color: parseInt(horizonYears) <= 2 ? '#DC2626' : parseInt(horizonYears) <= 5 ? '#D97706' : parseInt(horizonYears) <= 10 ? '#059669' : '#2563EB' }}>
                  {parseInt(horizonYears) <= 2 ? '🔴 Short-term (0–2Y)' : parseInt(horizonYears) <= 5 ? '🟡 Medium-term (2–5Y)' : parseInt(horizonYears) <= 10 ? '🟢 Growth horizon (5–10Y)' : '🔵 Long-term (10Y+)'}
                </div>
              )}
            </div>
          </div>

          {/* Risk slider */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>How much risk can you handle?</label>
              <span style={{ fontSize: '13px', fontWeight: 800, color: riskColor }}>{riskScore}/10</span>
            </div>
            <input type="range" min="1" max="10" value={riskScore} onChange={e => setRiskScore(parseInt(e.target.value))}
              style={{ width: '100%', height: '6px', borderRadius: '100px', cursor: 'pointer', accentColor: riskColor, marginBottom: '8px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '10px', color: '#059669', fontWeight: 600 }}>😌 Play safe</span>
              <span style={{ fontSize: '10px', color: '#D97706', fontWeight: 600 }}>⚖️ Balanced</span>
              <span style={{ fontSize: '10px', color: '#DC2626', fontWeight: 600 }}>🚀 Aggressive</span>
            </div>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 14px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '18px' }}>{riskScore <= 3 ? '🛡️' : riskScore <= 5 ? '⚖️' : riskScore <= 7 ? '📈' : '🚀'}</span>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: riskColor }}>{riskScore <= 3 ? 'Conservative' : riskScore <= 5 ? 'Balanced' : riskScore <= 7 ? 'Growth' : 'Aggressive'}</div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>{riskLabel}</div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <button onClick={generate} disabled={!canGenerate || generating}
            style={{ width: '100%', background: canGenerate ? 'linear-gradient(90deg, #059669 0%, #2563EB 100%)' : '#E2E8F0', color: canGenerate ? 'white' : '#94A3B8', border: 'none', borderRadius: '14px', padding: '16px 24px', fontSize: '15px', fontWeight: 800, cursor: canGenerate ? 'pointer' : 'not-allowed', letterSpacing: '-0.01em', boxShadow: canGenerate ? '0 4px 20px rgba(5,150,105,0.3)' : 'none', transition: 'all 0.2s', fontFamily: 'inherit' }}>
            {generating ? '⏳  Building your personalised plan…' : '⚡  Build my fund plan →'}
          </button>
        </div>

        {/* ── RESULTS ── */}
        {plan && projections && (
          <div ref={resultRef} style={{ marginTop: '32px' }}>

            {/* ── RESULT HEADER ── */}
            <div style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%)', borderRadius: '24px 24px 0 0', border: '1px solid #E2E8F0', borderBottom: 'none', padding: 'clamp(20px,3vw,28px) clamp(16px,3vw,28px) 20px' }}>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '100px', padding: '4px 12px', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#1D4ED8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{plan.label}</span>
              </div>

              <h2 style={{ fontSize: 'clamp(18px,3vw,24px)', fontWeight: 800, color: '#0F172A', margin: '0 0 6px', lineHeight: 1.2 }}>{goalName}</h2>
              <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 16px', lineHeight: 1.6, maxWidth: '600px', fontStyle: 'italic' }}>"{plan.plainEnglish}"</p>

              {/* 4 headline KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                {[
                  { label: 'Invest each month', value: `₹${plan.suggestedMonthlySIP.toLocaleString('en-IN')}`, sub: 'Suggested SIP to reach your goal', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
                  { label: 'Expected return range', value: `${plan.expectedReturnLo}–${plan.expectedReturnHi}%`, sub: 'Annual return estimate', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
                  { label: 'Plan success rate', value: `${plan.successRate}%`, sub: 'Based on historical rolling periods', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
                  { label: 'Max temporary dip', value: `${Math.abs(plan.maxDrawdown)}%`, sub: 'Worst-case single year — will recover', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
                ].map((k, i) => (
                  <div key={i} style={{ background: k.bg, border: `1px solid ${k.border}`, borderRadius: '14px', padding: '14px 16px' }}>
                    <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600, marginBottom: '4px' }}>{k.label}</div>
                    <div style={{ fontSize: 'clamp(18px,3vw,22px)', fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.value}</div>
                    <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px', lineHeight: 1.3 }}>{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* Projection traffic light */}
              <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '16px 18px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                  Where your ₹{plan.suggestedMonthlySIP.toLocaleString('en-IN')}/month SIP could reach in {horizonYears} years
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '10px' }}>
                  {[
                    { label: '🔴 Worst case', value: fmtINR(projections.low), sub: `at ${plan.expectedReturnLo}% p.a.`, color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
                    { label: '🟡 Likely outcome', value: fmtINR(projections.mid), sub: `at ~${((plan.expectedReturnLo + plan.expectedReturnHi) / 2).toFixed(1)}% p.a.`, color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
                    { label: '🟢 Best case', value: fmtINR(projections.high), sub: `at ${plan.expectedReturnHi}% p.a.`, color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
                  ].map((s, i) => (
                    <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '4px', lineHeight: 1.3 }}>{s.label}</div>
                      <div style={{ fontSize: 'clamp(16px,3vw,20px)', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                      <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px' }}>{s.sub}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94A3B8', padding: '8px 0 0', borderTop: '1px solid #F1F5F9', flexWrap: 'wrap', gap: '4px' }}>
                  <span>You invest: <strong style={{ color: '#374151' }}>{fmtINR(projections.invested)}</strong> total</span>
                  <span>Your goal: <strong style={{ color: '#374151' }}>{fmtINR(parseFloat(targetLakh) * 100000)}</strong></span>
                </div>
                {projections.mid >= parseFloat(targetLakh) * 100000 ? (
                  <div style={{ marginTop: '8px', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#065F46', fontWeight: 600 }}>
                    ✅ At the expected return rate, this SIP comfortably meets your ₹{targetLakh}L goal.
                  </div>
                ) : (
                  <div style={{ marginTop: '8px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#991B1B', fontWeight: 600 }}>
                    ⚠️ You may need to increase your SIP or extend the horizon to comfortably hit ₹{targetLakh}L. Consider ₹{Math.ceil(plan.suggestedMonthlySIP * (parseFloat(targetLakh) * 100000) / projections.mid / 100) * 100 > plan.suggestedMonthlySIP ? fmtINR(Math.ceil(plan.suggestedMonthlySIP * (parseFloat(targetLakh) * 100000) / projections.mid / 100) * 100) : fmtINR(plan.suggestedMonthlySIP * 1.2)}/month.
                  </div>
                )}
              </div>
            </div>

            {/* ── EXPOSURE ALLOCATION SECTION ── */}
            <div style={{ background: 'white', border: '1px solid #E2E8F0', borderTop: 'none', padding: '0 clamp(16px,3vw,28px)' }}>
              <button onClick={() => setShowAllocation(!showAllocation)}
                style={{ width: '100%', background: 'white', border: 'none', borderTop: '1px solid #F1F5F9', padding: '16px 0', fontSize: '13px', fontWeight: 700, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'inherit' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>🗂️ Your exposure blocks — how the {plan.blocks.length} allocations are split</span>
                <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>{showAllocation ? '▲ Hide' : '▼ See breakdown'}</span>
              </button>

              {showAllocation && (
                <div style={{ paddingBottom: '24px' }}>
                  <ExposureBar blocks={plan.blocks} />
                  <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                    {plan.blocks.map((block, i) => (
                      <div key={i} style={{ background: block.bg, border: `1.5px solid ${block.border}`, borderRadius: '14px', padding: '14px 16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                          <div>
                            <span style={{ fontSize: '16px', marginRight: '6px' }}>{block.emoji}</span>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: block.color }}>{block.type}</span>
                          </div>
                          <span style={{ fontSize: '22px', fontWeight: 900, color: block.color, lineHeight: 1 }}>{block.pct}%</span>
                        </div>
                        <p style={{ fontSize: '11.5px', color: '#475569', lineHeight: 1.6, margin: '0 0 8px' }}>{block.description}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {block.cells.map((cell, j) => (
                            <div key={j} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                              <span style={{ color: '#64748B' }}>→ {cell.label}</span>
                              <span style={{ color: block.color, fontWeight: 700 }}>{cell.allocationPct}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── RECOMMENDED FUNDS ── */}
            <div style={{ background: 'white', border: '1px solid #E2E8F0', borderTop: 'none', padding: '0 clamp(16px,3vw,28px) clamp(16px,3vw,24px)' }}>
              <button onClick={() => setShowFunds(!showFunds)}
                style={{ width: '100%', background: showFunds ? '#EFF6FF' : 'white', border: 'none', borderTop: '1px solid #F1F5F9', padding: '16px 0', fontSize: '13px', fontWeight: 700, color: '#1E40AF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'inherit' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>📋 Recommended funds ({resolvedFunds.length} picks from live data)</span>
                <span style={{ fontSize: '11px', color: '#60A5FA', fontWeight: 500 }}>{showFunds ? '▲ Hide funds' : '▼ Show funds'}</span>
              </button>

              {showFunds && (
                <div style={{ paddingBottom: '20px' }}>
                  {resolvedFunds.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: '#94A3B8', fontSize: '13px' }}>Fund data is still loading. Please try again in a moment.</div>
                  ) : (
                    <>
                      {plan.blocks.map(block => {
                        const blockFunds = resolvedFunds.filter(f => f.exposureBlock === block.type);
                        if (blockFunds.length === 0) return null;
                        return (
                          <div key={block.type} style={{ marginBottom: '22px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', paddingTop: '4px' }}>
                              <span style={{ fontSize: '18px' }}>{block.emoji}</span>
                              <span style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>{block.type} Exposure</span>
                              <span style={{ fontSize: '12px', color: block.color, fontWeight: 700, background: block.bg, border: `1px solid ${block.border}`, padding: '2px 10px', borderRadius: '100px' }}>{block.pct}% of portfolio</span>
                              <span style={{ fontSize: '11px', color: '#94A3B8' }}>≈ ₹{Math.round(plan.suggestedMonthlySIP * block.pct / 100 / 100) * 100}/mo</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                              {blockFunds.map((slot, i) => (
                                <FundSlotCard key={i} slot={slot} sipAmount={plan.suggestedMonthlySIP} onDetail={() => setSelectedFundSlot(slot)} />
                              ))}
                            </div>
                          </div>
                        );
                      })}

                      <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '14px 16px', fontSize: '12px', color: '#1E3A8A', lineHeight: 1.65, display: 'flex', gap: '10px' }}>
                        <span style={{ fontSize: '16px', flexShrink: 0 }}>💡</span>
                        <div>
                          <strong>How to split your SIP:</strong> Your suggested total SIP is ₹{plan.suggestedMonthlySIP.toLocaleString('en-IN')}/month. Each fund card shows the recommended monthly amount based on its allocation weight. You don't need all funds — 1–2 from each exposure block is enough for proper diversification. Every fund here is chosen by the same live engine that powers our full matrix.
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* ── HOW WE DESIGNED THIS ── */}
            <div style={{ background: 'white', border: '1px solid #E2E8F0', borderTop: 'none', borderRadius: '0 0 24px 24px', padding: '0 clamp(16px,3vw,28px) clamp(16px,3vw,24px)' }}>
              <button onClick={() => setShowHowItWorks(!showHowItWorks)}
                style={{ width: '100%', background: 'white', border: 'none', borderTop: '1px solid #F1F5F9', padding: '16px 0', fontSize: '13px', fontWeight: 700, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'inherit' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>🧠 How did we design this allocation?</span>
                <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>{showHowItWorks ? '▲ Hide' : '▼ Know more'}</span>
              </button>

              {showHowItWorks && (
                <div style={{ paddingBottom: '24px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                    {[
                      {
                        step: '1', icon: '⏱️', color: '#2563EB', bg: '#EFF6FF', bd: '#BFDBFE',
                        title: 'Time Bucket',
                        body: `Your ${horizonYears}-year horizon places you in the "${plan.timeBucket}" bucket. ${plan.timeBucket === "0-2Y" ? "Capital protection dominates — there's no time to recover from equity losses. Even aggressive profiles avoid momentum/tactical here." : plan.timeBucket === "2-5Y" ? "A balanced approach — enough time for some equity. Tactical exposure is capped for shorter horizons; momentum needs 5yr+ to reliably express the factor premium." : plan.timeBucket === "5-10Y" ? "Equity can lead — 5+ years is enough for market cycles to play out. Tactical exposure becomes appropriate here." : "Equity compounding is your superpower. Time eliminates most risk — full spectrum including small-cap and momentum."}`
                      },
                      {
                        step: '2', icon: '🎚️', color: '#7C3AED', bg: '#F5F3FF', bd: '#DDD6FE',
                        title: 'Risk Intensity',
                        body: `Your risk score of ${riskScore}/10 maps to "${plan.riskIntensity}". ${plan.riskIntensity === "Conservative" ? "We keep equity low and use conservative hybrids and bonds to dampen swings." : plan.riskIntensity === "Balanced" ? "A blend of growth and safety — equity is meaningful but bonds/hybrids cushion volatility." : plan.riskIntensity === "Growth" ? "Equity leads the portfolio. Mid-caps and tactical exposure added for return premium where the horizon supports it." : "Maximum equity concentration — but always respecting the horizon. Short-horizon aggressive profiles use large-cap quality, not speculation."}`
                      },
                      {
                        step: '3', icon: '🗂️', color: '#D97706', bg: '#FFFBEB', bd: '#FDE68A',
                        title: 'Exposure Blocks',
                        body: `We don't pick individual sub-categories. We first define ${plan.blocks.length} exposure blocks: ${plan.blocks.map(b => `${b.type} (${b.pct}%)`).join(', ')}. This prevents over-concentration in any one style or category.`
                      },
                      {
                        step: '4', icon: '🔬', color: '#059669', bg: '#ECFDF5', bd: '#A7F3D0',
                        title: 'Matrix Cells & Funds',
                        body: `Each block maps to specific cells in our equity, hybrid, or debt matrix. Within each cell, our engine compares all sub-categories by average alpha (extra return above benchmark) — the winner sub-category's top-ranked fund by composite score becomes the pick. Same logic as the full fund matrix page.`
                      },
                    ].map((item, i) => (
                      <div key={i} style={{ background: item.bg, border: `1px solid ${item.bd}`, borderRadius: '12px', padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{ width: '22px', height: '22px', background: 'white', border: `1px solid ${item.bd}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: item.color, flexShrink: 0 }}>{item.step}</span>
                          <span style={{ fontSize: '14px' }}>{item.icon}</span>
                          <span style={{ fontSize: '12px', fontWeight: 800, color: item.color }}>{item.title}</span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.65, margin: 0 }}>{item.body}</p>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '12px 16px', fontSize: '12px', color: '#92400E', lineHeight: 1.6 }}>
                    <strong>Note:</strong> All return projections are based on historical performance data and are not guarantees of future returns. Please consult a SEBI-registered investment advisor before making investment decisions.
                  </div>
                </div>
              )}
            </div>

            {/* CTA to Lifetime Plan */}
            <div style={{ marginTop: '20px', background: 'linear-gradient(135deg, #FFFBEB, #F0FDF4)', border: '1px solid #FDE68A', borderRadius: '16px', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '16px', marginBottom: '4px' }}>🌱</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>Have more than one goal?</div>
                <p style={{ fontSize: '12px', color: '#64748B', margin: 0, maxWidth: '380px', lineHeight: 1.6 }}>Car, house, education, retirement — all at once. Our Lifetime Wealth Plan builds one integrated portfolio across every life stage.</p>
              </div>
              <a href="/find-my-fund-lifetime-plan" style={{ background: 'linear-gradient(90deg, #D97706, #059669)', color: 'white', borderRadius: '12px', padding: '12px 20px', fontSize: '13px', fontWeight: 800, textDecoration: 'none', whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(217,119,6,0.2)' }}>
                Build my lifetime plan →
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Fund Detail Modal */}
      {selectedFundSlot && <FundDetailModal slot={selectedFundSlot} onClose={() => setSelectedFundSlot(null)} />}
    </div>
  );
}