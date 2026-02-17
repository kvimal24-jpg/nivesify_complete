"use client";

import Link from "next/link";
import AnalysisTabs from "@/components/AnalysisTabs";
import React, { useState, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES  — field names match EXACTLY what is in the R2 JSON files
// ─────────────────────────────────────────────────────────────────────────────

type InsightRow = {
  Level: string;                             // "Sub-Category" (with hyphen)
  Category_Name: string | null;
  Sub_Category_Name: string | null;
  Number_of_Schemes: number;
  Avg_Alpha_3Y: number;                      // ONLY alpha field available
  Avg_IR_3Y: number | null;
  Pct_Funds_Beating_Benchmark_3Y: number;    // beat rate field
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
  IR_5Y: number | null;
  Composite_Score: number;                   // 0–1 scale, higher = better
  Rank_in_SubCategory: number;
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
  ETF_Score: number;                         // 0–1 scale, higher = better
  Rank_within_Benchmark: number;
};

type AMFIFund = {
  Category: string;
  Sub_Category: string;
  schemeName: string;
  benchmark: string;
  dailyAUM: number | null;
  return3YearDirect: number | null;
  return5YearDirect: number | null;
};

type Candidate = {
  name: string;
  fundCount: number;
  avgAlpha: number;
  beatRate: number;
  score: number;
  winner: boolean;
};

type BoxResult = {
  empty: boolean;
  candidates: Candidate[];
  winner?: Candidate;
  decision?: "ACTIVE" | "INDEX";
  selectedFund?: FundAnalytics | ETFAnalytics | null;
  alternatives?: (FundAnalytics | ETFAnalytics)[];
  audit?: {
    styleReason: string;
    sizeReason: string;
    winnerReason: string;
    decisionReason: string;
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// GRID LABELS
// ─────────────────────────────────────────────────────────────────────────────

const EQ_ROWS = [
  { key: "large", label: "Large Cap",        desc: "India's biggest & most stable" },
  { key: "mid",   label: "Mid Cap",           desc: "Fast-growing challengers"      },
  { key: "small", label: "Small Cap",         desc: "High-risk, high-reward"         },
  { key: "flexi", label: "Flexi / Multi Cap", desc: "Manager decides the mix"        },
];

const EQ_COLS = [
  { key: "value",    label: "Value & Contra", desc: "Buy quality on discount"   },
  { key: "growth",   label: "Growth / Core",  desc: "Steady compounders"         },
  { key: "momentum", label: "Momentum",        desc: "Ride what's winning now"   },
  { key: "active",   label: "Pure Active",     desc: "Fund manager's best picks"  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CLASSIFICATION  — STYLE FIRST, then SIZE  (fixes all column-4 and bleed bugs)
// ─────────────────────────────────────────────────────────────────────────────

function getStyle(fund: AMFIFund): number {
  const sub   = (fund.Sub_Category || "").toLowerCase();
  const bench = (fund.benchmark    || "").toLowerCase();

  // Col 0 — Value / Contra / Dividend
  if (
    sub.includes("value") || sub.includes("contra") || sub.includes("dividend") ||
    bench.includes("value") || bench.includes("contra")
  ) return 0;

  // Col 2 — Momentum (benchmark keyword only — fund names never say "momentum")
  if (bench.includes("momentum") || bench.includes("alpha")) return 2;

  // Col 3 — Pure Active: an active (non-ETF) fund with a size-based sub-category
  const sizeSubcats = [
    "large cap", "mid cap", "small cap", "flexi cap",
    "multi cap", "large & mid cap", "elss", "focused",
  ];
  if (sub !== "index / etf" && sizeSubcats.includes(sub)) return 3;

  // Col 1 — Growth / Core (all index/ETF funds and anything else)
  return 1;
}

function getSize(fund: AMFIFund): number | null {
  const sub   = (fund.Sub_Category || "").toLowerCase();
  const bench = (fund.benchmark    || "").toLowerCase();

  // Use Sub_Category as primary signal — exact match, no scheme-name heuristics
  if (sub === "large cap" || sub === "large & mid cap" || sub === "focused") return 0;
  if (sub === "mid cap")                                                       return 1;
  if (sub === "small cap")                                                     return 2;
  if (sub === "flexi cap" || sub === "multi cap" || sub === "elss")            return 3;

  // For Index / ETF — use benchmark to determine size
  if (sub === "index / etf") {
    if (/\bnifty 50\b|sensex|\bnifty 100\b|bse 100/.test(bench))  return 0;
    if (/midcap 150|midcap 100|nifty midcap/.test(bench))          return 1;
    if (/smallcap 250|smallcap 100|nifty smallcap/.test(bench))    return 2;
    if (/nifty 500|bse 500/.test(bench))                           return 3;
  }

  return null; // Cannot classify — exclude from grid
}

function shouldExclude(fund: AMFIFund): boolean {
  const cat = (fund.Category     || "").toLowerCase();
  const sub = (fund.Sub_Category || "").toLowerCase();
  if (cat !== "equity") return true;
  if (sub.includes("sectoral") || sub.includes("thematic"))    return true;
  if (sub === "retirement fund" || sub === "children's fund")  return true;
  if (sub.includes("overseas"))                                 return true;
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// BOX BUILDER — uses correct R2 field names throughout
// ─────────────────────────────────────────────────────────────────────────────

function buildBox(
  amfiFunds: AMFIFund[],
  insights:  InsightRow[],
  fundAnalytics: FundAnalytics[],
  etfAnalytics:  ETFAnalytics[],
  row: number,
  col: number
): BoxResult {
  // Group funds in this box by sub-category
  const bySub: Record<string, AMFIFund[]> = {};
  for (const f of amfiFunds) {
    const sc = f.Sub_Category || "Unknown";
    if (!bySub[sc]) bySub[sc] = [];
    bySub[sc].push(f);
  }

  // Score each sub-category using REAL field names from industry-and-category-insights.json
  const candidates: Candidate[] = [];

  for (const [subcat, group] of Object.entries(bySub)) {
    const ins = insights.find(
      (i) =>
        i.Level === "Sub-Category" &&                              // hyphen — not underscore
        (i.Sub_Category_Name || "").toLowerCase() === subcat.toLowerCase()
    );
    if (!ins) continue;

    const alpha    = ins.Avg_Alpha_3Y;                             // capital A — only 3Y exists
    const beatRate = ins.Pct_Funds_Beating_Benchmark_3Y;           // full real field name

    if (alpha == null) continue;

    // Score = Alpha × 70%  +  BeatRate × 30%
    const score = alpha * 0.7 + beatRate * 0.3;

    candidates.push({
      name:      subcat,
      fundCount: group.length,
      avgAlpha:  alpha,
      beatRate,
      score,
      winner:    false,
    });
  }

  if (!candidates.length) return { empty: true, candidates: [] };

  candidates.sort((a, b) => b.score - a.score);
  candidates[0].winner = true;
  const winner = candidates[0];

  // Decide active vs index based on category performance
  const decision: "ACTIVE" | "INDEX" =
    winner.avgAlpha > 0.5 && winner.beatRate > 50 ? "ACTIVE" : "INDEX";

  // ── Audit strings ─────────────────────────────────────────────────────────
  const colLabel = EQ_COLS[col]?.label ?? col.toString();
  const rowLabel = EQ_ROWS[row]?.label ?? row.toString();
  const styleReason = `Column "${colLabel}" detected from Sub_Category / benchmark keywords`;
  const sizeReason  = `Row "${rowLabel}" detected using Sub_Category field (benchmark used only for Index/ETF)`;
  const winnerReason =
    candidates.length > 1
      ? `"${winner.name}" scored ${winner.score.toFixed(1)} vs "${candidates[1].name}" (${candidates[1].score.toFixed(1)}) — Formula: Alpha×0.7 + BeatRate×0.3`
      : `Only sub-category in this grid position`;
  const decisionReason =
    decision === "ACTIVE"
      ? `Alpha ${winner.avgAlpha.toFixed(2)}% > 0.5% AND Beat Rate ${winner.beatRate.toFixed(1)}% > 50% — active managers are adding real value`
      : `Alpha ${winner.avgAlpha.toFixed(2)}% or Beat Rate ${winner.beatRate.toFixed(1)}% below thresholds — index fund is the smarter choice`;

  // ── Select winning fund ───────────────────────────────────────────────────
  let selectedFund: FundAnalytics | ETFAnalytics | null = null;
  let alternatives: (FundAnalytics | ETFAnalytics)[] = [];

  if (decision === "ACTIVE") {
    // Pick from fund-analytics by Composite_Score (DESC)
    const pool = fundAnalytics
      .filter((f) => f.Sub_Category.toLowerCase() === winner.name.toLowerCase())
      .sort((a, b) => (b.Composite_Score ?? 0) - (a.Composite_Score ?? 0));
    selectedFund = pool[0] ?? null;
    alternatives = pool.slice(1, 3);
  } else {
    // Pick from etf-analytics by ETF_Score DESC (not Expense_Ratio — that field doesn't exist)
    const pool = etfAnalytics
      .filter((e) => {
        const b = (e.Benchmark_Name || "").toLowerCase();
        const n = (e.ETF_Name       || "").toLowerCase();
        // Match size
        const sizeMatch =
          row === 0 ? /\bnifty 50\b|sensex|\bnifty 100\b|bse 100/.test(b) :
          row === 1 ? /midcap 150|midcap 100|nifty midcap/.test(b)         :
          row === 2 ? /smallcap 250|smallcap 100|nifty smallcap/.test(b)   :
          row === 3 ? /nifty 500|bse 500/.test(b)                          : false;
        if (!sizeMatch) return false;
        // Match style within size
        if (col === 0) return b.includes("value")    || n.includes("value");
        if (col === 2) return b.includes("momentum") || b.includes("alpha");
        // Col 1 (growth) — exclude value and momentum ETFs
        return !b.includes("value") && !b.includes("momentum") && !b.includes("alpha");
      })
      .sort((a, b) => (b.ETF_Score ?? 0) - (a.ETF_Score ?? 0)); // ETF_Score DESC — higher is better

    selectedFund = pool[0] ?? null;
    alternatives = pool.slice(1, 3);
  }

  return {
    empty: false,
    candidates,
    winner,
    decision,
    selectedFund,
    alternatives,
    audit: { styleReason, sizeReason, winnerReason, decisionReason },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function isFund(f: FundAnalytics | ETFAnalytics | null | undefined): f is FundAnalytics {
  return !!f && "Fund_Name" in f;
}
function isETF(f: FundAnalytics | ETFAnalytics | null | undefined): f is ETFAnalytics {
  return !!f && "ETF_Name" in f;
}
function displayName(f: FundAnalytics | ETFAnalytics | null): string {
  if (!f) return "";
  return isFund(f) ? f.Fund_Name : (f as ETFAnalytics).ETF_Name;
}
function fmt(n: number | null | undefined, decimals = 2, suffix = "%"): string {
  if (n == null) return "—";
  return `${n.toFixed(decimals)}${suffix}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT MODAL
// ─────────────────────────────────────────────────────────────────────────────

function AuditModal({
  box, rowLabel, colLabel, onClose,
}: {
  box: BoxResult; rowLabel: string; colLabel: string; onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#DDE6F3] px-6 py-4 flex items-start justify-between rounded-t-2xl z-10">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#7A8FA6] font-semibold">
              Audit Trail
            </p>
            <h3 className="font-serif text-lg font-bold text-[#1F2937] mt-0.5">
              {rowLabel} × {colLabel}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="ml-4 mt-0.5 w-8 h-8 rounded-full bg-[#F5F8FF] text-[#6B7C93] text-xl leading-none flex items-center justify-center hover:bg-[#DDE6F3]"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5 space-y-6 text-sm text-[#374151]">

          {/* 1. Classification */}
          <div>
            <SectionLabel n={1} label="How we identified this category" />
            <div className="bg-[#F5F8FF] rounded-xl p-4 space-y-2">
              <p><span className="font-semibold text-[#2F5D7C]">Style → </span>{box.audit?.styleReason}</p>
              <p><span className="font-semibold text-[#2F5D7C]">Size  → </span>{box.audit?.sizeReason}</p>
            </div>
          </div>

          {/* 2. Sub-category competition */}
          <div>
            <SectionLabel n={2} label="Which sub-category won this position" />
            <div className="bg-[#F5F8FF] rounded-xl p-4">
              <div className="space-y-2">
                {box.candidates.map((c, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between gap-3 py-2
                      ${i < box.candidates.length - 1 ? "border-b border-[#DDE6F3]" : ""}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {c.winner
                        ? <span className="text-green-600 font-bold shrink-0">✓</span>
                        : <span className="text-[#C5D0DC] shrink-0">·</span>}
                      <span className={`truncate font-medium ${c.winner ? "text-[#1F2937]" : "text-[#6B7C93]"}`}>
                        {c.name}
                      </span>
                      <span className="text-xs text-[#9BA8B5] shrink-0">({c.fundCount})</span>
                    </div>
                    <div className="text-xs text-[#6B7C93] shrink-0 text-right space-x-2">
                      <span>α {c.avgAlpha.toFixed(2)}%</span>
                      <span>Beat {c.beatRate.toFixed(0)}%</span>
                      <span className={`font-semibold ${c.winner ? "text-[#2F5D7C]" : ""}`}>
                        {c.score.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-[#6B7C93]">{box.audit?.winnerReason}</p>
              <p className="mt-1 text-[10px] text-[#9BA8B5]">Scoring: Alpha × 70%  +  Beat Rate × 30%</p>
            </div>
          </div>

          {/* 3. Active vs Index */}
          <div>
            <SectionLabel n={3} label="Active fund or index fund?" />
            <div className={`rounded-xl p-4 flex gap-3 items-start
              ${box.decision === "ACTIVE" ? "bg-emerald-50 border border-emerald-200" : "bg-blue-50 border border-blue-200"}`}
            >
              <span className="text-2xl mt-0.5">{box.decision === "ACTIVE" ? "🎯" : "📊"}</span>
              <div>
                <p className="font-bold text-[#1F2937]">
                  {box.decision === "ACTIVE" ? "Active Fund" : "Index / ETF Fund"}
                </p>
                <p className="text-xs text-[#6B7C93] mt-1">{box.audit?.decisionReason}</p>
              </div>
            </div>
          </div>

          {/* 4. Winning fund */}
          {box.selectedFund && (
            <div>
              <SectionLabel n={4} label="The winning fund" />
              <div className="bg-[#F5F8FF] rounded-xl p-4">
                <p className="font-bold text-[#1F2937] text-base mb-3 leading-snug">
                  {displayName(box.selectedFund)}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {isFund(box.selectedFund) && <>
                    <Stat label="Composite Score" value={fmt(box.selectedFund.Composite_Score, 4, "")} accent />
                    <Stat label="5Y Alpha"         value={fmt(box.selectedFund.Alpha_5Y)} green />
                    <Stat label="3Y Return"        value={fmt(box.selectedFund.Fund_Return_3Y)} />
                    <Stat label="AUM"              value={`₹${((box.selectedFund.Current_AUM||0)/1000).toFixed(0)}k Cr`} />
                    <Stat label="IR 3Y"            value={fmt(box.selectedFund.IR_3Y, 3, "")} />
                    <Stat label="Sub-Category Rank" value={`#${box.selectedFund.Rank_in_SubCategory}`} />
                  </>}
                  {isETF(box.selectedFund) && <>
                    <Stat label="ETF Score"           value={fmt(box.selectedFund.ETF_Score, 3, "")} accent />
                    <Stat label="Benchmark Rank"      value={`#${box.selectedFund.Rank_within_Benchmark}`} />
                    <Stat label="Tracking Diff 3Y"   value={fmt(box.selectedFund.Tracking_Diff_3Y)} />
                    <Stat label="3Y Return"           value={fmt(box.selectedFund.Fund_Return_3Y)} />
                    <Stat label="AUM"                 value={`₹${((box.selectedFund.Fund_AUM||0)/1000).toFixed(1)}k Cr`} />
                  </>}
                </div>

                {!!box.alternatives?.length && (
                  <div className="mt-4 pt-3 border-t border-[#DDE6F3]">
                    <p className="text-xs text-[#9BA8B5] mb-2">Also considered</p>
                    {box.alternatives.map((a, i) => (
                      <p key={i} className="text-xs text-[#6B7C93] py-0.5">
                        • {displayName(a)}
                        {isFund(a) && ` — Score ${a.Composite_Score?.toFixed(4)}`}
                        {isETF(a)  && ` — ETF Score ${a.ETF_Score?.toFixed(3)}`}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. Data source */}
          <div>
            <SectionLabel n={5} label="Data source" />
            <div className="bg-[#F5F8FF] rounded-xl p-4 text-xs text-[#6B7C93] space-y-1">
              <p className="font-medium text-[#1F2937]">mf-data-bucket/data/latest/</p>
              <p>• amfi_raw.json — fund universe &amp; classification</p>
              <p>• industry-and-category-insights.json — alpha &amp; beat rates</p>
              <p>• fund-analytics.json — composite scores (active picks)</p>
              <p>• etf-analytics.json — ETF scores &amp; tracking data</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="w-5 h-5 rounded-full bg-[#2F5D7C] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
        {n}
      </span>
      <p className="text-xs font-semibold uppercase tracking-wider text-[#2F5D7C]">{label}</p>
    </div>
  );
}

function Stat({
  label, value, accent, green,
}: {
  label: string; value: string; accent?: boolean; green?: boolean;
}) {
  return (
    <div className="bg-white rounded-lg p-2.5">
      <p className="text-[10px] text-[#9BA8B5]">{label}</p>
      <p className={`font-bold text-sm mt-0.5 ${accent ? "text-[#2F5D7C]" : green ? "text-emerald-600" : "text-[#1F2937]"}`}>
        {value}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GRID CELL
// ─────────────────────────────────────────────────────────────────────────────

function GridCell({
  box, rowLabel, colLabel, onClick,
}: {
  box: BoxResult; rowLabel: string; colLabel: string; onClick: () => void;
}) {
  if (box.empty) {
    return (
      <div
        className="relative h-full min-h-[140px] rounded-xl border border-dashed border-[#DDE6F3] bg-[#FAFBFC] flex flex-col items-center justify-center cursor-pointer group hover:border-[#9BA8B5] transition-all"
        onClick={onClick}
      >
        <p className="text-[11px] text-[#C5D0DC] font-medium">No funds match</p>
        <p className="text-[10px] text-[#D1D9E0] mt-1">{rowLabel} × {colLabel}</p>
      </div>
    );
  }

  const isActive = box.decision === "ACTIVE";

  return (
    <div
      className={`
        relative h-full min-h-[140px] rounded-xl border cursor-pointer group
        flex flex-col p-3.5 transition-all duration-200
        ${isActive
          ? "bg-emerald-50/70 border-emerald-200 hover:border-emerald-400 hover:shadow-md hover:shadow-emerald-100"
          : "bg-blue-50/70 border-blue-200 hover:border-blue-400 hover:shadow-md hover:shadow-blue-100"
        }
      `}
      onClick={onClick}
    >
      {/* Audit "i" button — top right */}
      <div className="absolute top-2.5 right-2.5 w-[18px] h-[18px] rounded-full border border-[#DDE6F3] bg-white/80 text-[9px] text-[#6B7C93] flex items-center justify-center group-hover:bg-[#2F5D7C] group-hover:text-white group-hover:border-[#2F5D7C] transition-all">
        i
      </div>

      {/* Badge */}
      <span className={`
        self-start inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mb-2.5
        ${isActive ? "bg-emerald-600 text-white" : "bg-blue-600 text-white"}
      `}>
        {isActive ? "🎯 Active" : "📊 Index"}
      </span>

      {/* Fund name */}
      <p className="text-[11px] font-bold text-[#1F2937] leading-snug line-clamp-2 flex-1 mb-2">
        {displayName(box.selectedFund ?? null)}
      </p>

      {/* Quick stats */}
      {box.winner && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[10px] font-medium ${box.winner.avgAlpha > 0 ? "text-emerald-700" : "text-red-500"}`}>
            α {box.winner.avgAlpha.toFixed(1)}%
          </span>
          <span className="text-[#D1D9E0] text-[9px]">·</span>
          <span className="text-[10px] text-[#6B7C93]">
            Beat {box.winner.beatRate.toFixed(0)}%
          </span>
        </div>
      )}

      {/* CTA */}
      <p className="text-[10px] text-[#2F5D7C] mt-2 opacity-60 group-hover:opacity-100 transition-opacity">
        Full analysis →
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMING SOON PLACEHOLDER GRID (Hybrid / Debt)
// ─────────────────────────────────────────────────────────────────────────────

type GridDef = { label: string; desc: string }[];

function PlaceholderGrid({
  rows, cols,
}: {
  rows: GridDef; cols: GridDef;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs min-w-[480px]">
        <thead>
          <tr>
            <th className="p-3 w-36" />
            {cols.map((c, i) => (
              <th key={i} className="p-3 text-center">
                <p className="font-bold text-[#9BA8B5]">{c.label}</p>
                <p className="text-[10px] text-[#C5D0DC] font-normal mt-0.5">{c.desc}</p>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri}>
              <td className="p-3">
                <p className="font-bold text-[#9BA8B5]">{r.label}</p>
                <p className="text-[10px] text-[#C5D0DC] mt-0.5">{r.desc}</p>
              </td>
              {cols.map((_, ci) => (
                <td key={ci} className="p-2">
                  <div className="h-[100px] rounded-xl border border-dashed border-[#E8ECF2] bg-[#FAFBFC] flex flex-col items-center justify-center gap-1">
                    <span className="text-[10px] text-[#D1D9E0]">Coming soon</span>
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

// ─────────────────────────────────────────────────────────────────────────────
// SECTION PANEL WRAPPER
// ─────────────────────────────────────────────────────────────────────────────

function SectionPanel({
  icon, title, badge, badgeColor, desc, children, headerColor,
}: {
  icon: string; title: string; badge: string; badgeColor: string;
  desc: string; children: React.ReactNode; headerColor: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#DDE6F3] shadow-sm overflow-hidden">
      {/* Section header strip */}
      <div className={`${headerColor} px-6 py-4`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-xl font-bold text-white">{title}</h2>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${badgeColor}`}>
                  {badge}
                </span>
              </div>
              <p className="text-xs text-white/70 mt-0.5 max-w-lg">{desc}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function FindMyFundPage() {
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [gridResults, setGridResults] = useState<BoxResult[][]>([]);
  const [modal, setModal]           = useState<{ row: number; col: number } | null>(null);
  const [activeTab, setActiveTab]   = useState<"equity" | "hybrid" | "debt">("equity");

  useEffect(() => {
    async function loadData() {
      try {
        const [amfiRaw, fundAnalytics, etfAnalytics, insights] = await Promise.all([
          fetch("/api/amfi-raw").then((r) => r.json()),
          fetch("/api/funds").then((r)    => r.json()),
          fetch("/api/etfs").then((r)     => r.json()),
          fetch("/api/insights").then((r) => r.json()),
        ]);

        // Classify every fund into the 4×4 grid
        const gridMap: AMFIFund[][][] = Array.from({ length: 4 }, () =>
          Array.from({ length: 4 }, () => [])
        );

        for (const fund of amfiRaw as AMFIFund[]) {
          if (shouldExclude(fund)) continue;
          const col = getStyle(fund);
          const row = getSize(fund);
          if (row !== null) gridMap[row][col].push(fund);
        }

        // Build final box results
        const results: BoxResult[][] = gridMap.map((rowArr, ri) =>
          rowArr.map((cellFunds, ci) =>
            buildBox(cellFunds, insights, fundAnalytics, etfAnalytics, ri, ci)
          )
        );

        setGridResults(results);
      } catch {
        setError("Failed to load fund data. Please refresh.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // ── Tab configuration ──────────────────────────────────────────────────────
  const tabs = [
    { id: "equity", icon: "🚀", label: "Equity Funds",  sub: "Growth"   },
    { id: "hybrid", icon: "⚖️", label: "Hybrid Funds",  sub: "Balanced" },
    { id: "debt",   icon: "💧", label: "Debt Funds",    sub: "Safety"   },
  ] as const;

  const hybridRows: GridDef = [
    { label: "Conservative", desc: "10–35% equity" },
    { label: "Aggressive",   desc: "65–80% equity" },
  ];
  const hybridCols: GridDef = [
    { label: "Equity + Debt",    desc: "Classic balanced"    },
    { label: "Multi Asset",      desc: "Adds gold & silver"  },
    { label: "Special Strategy", desc: "BAF, Arbitrage"      },
  ];
  const debtRows: GridDef = [
    { label: "Ultra Short",   desc: "0–3 months"     },
    { label: "Short–Medium",  desc: "3 months–3 years" },
    { label: "Long Duration", desc: "3 years+"        },
  ];
  const debtCols: GridDef = [
    { label: "Government", desc: "Gilt, Overnight"        },
    { label: "Corporate",  desc: "AAA bonds, Banking & PSU" },
    { label: "Dynamic",    desc: "Floater, Dynamic Bond"  },
  ];

  return (
    <div className="min-h-screen bg-[#F5F8FF] text-[#1F2937]">

      {/* ── TOP NAV ───────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-[#F5F8FF]/95 backdrop-blur-md border-b border-[#DDE6F3]">
        <div className="max-w-7xl mx-auto">
          <AnalysisTabs />
        </div>
      </div>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pt-14 pb-10">
        {/* Ambient background glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-0 h-[360px] w-[560px] rounded-full bg-[#2F5D7C]/8 blur-[110px]" />
          <div className="absolute bottom-0 right-1/4 h-[280px] w-[400px] rounded-full bg-[#9BB4D6]/15 blur-[90px]" />
        </div>

        {/* Compass ring decoration */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#2F5D7C]/20 opacity-40">
          <div className="absolute inset-7 rounded-full border border-[#2F5D7C]/15" />
          <div className="absolute left-1/2 top-0 h-full w-px bg-[#2F5D7C]/25" />
          <div className="absolute left-0 top-1/2 h-px w-full bg-[#2F5D7C]/25" />
          <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#9BB4D6]/60" />
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          <p className="mb-4 text-[10px] uppercase tracking-[0.35em] text-[#7A8FA6] font-semibold">
            Powered by Nivesify Analytics
          </p>

          <h1 className="font-serif text-4xl md:text-5xl font-bold leading-[1.06] text-[#1F2937] mb-4">
            Find My Fund
            <br />
            <span className="text-[#2F5D7C]">Stop guessing.</span>{" "}
            <span className="text-[#9BB4D6]">Start investing smart.</span>
          </h1>

          <p className="mx-auto mb-8 max-w-xl text-[15px] text-[#4A5568] leading-relaxed">
            Every mutual fund in India, ranked by real data. We surface the single best pick
            for each category — across equity, hybrid, and debt.
          </p>

          {/* Stat pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {[
              { label: "2,006 funds analysed", icon: "🔍" },
              { label: "Data from AMFI & R2",  icon: "📊" },
              { label: "Zero opinions",         icon: "✓"  },
            ].map((p) => (
              <span
                key={p.label}
                className="flex items-center gap-1.5 rounded-full border border-[#DDE6F3] bg-white px-4 py-1.5 text-xs text-[#4A5568] font-medium shadow-sm"
              >
                <span>{p.icon}</span>
                {p.label}
              </span>
            ))}
          </div>

          {/* Timeline guide */}
          <div className="mx-auto grid max-w-lg grid-cols-3 gap-3">
            {[
              { icon: "💧", label: "0–3 years",  title: "Debt",   color: "text-slate-600"  },
              { icon: "⚖️", label: "3–5 years",  title: "Hybrid", color: "text-amber-600"  },
              { icon: "🚀", label: "5+ years",   title: "Equity", color: "text-[#2F5D7C]"  },
            ].map((g) => (
              <div
                key={g.title}
                className="rounded-xl border border-[#DDE6F3] bg-white/80 px-3 py-3 text-center shadow-sm"
              >
                <span className="text-xl">{g.icon}</span>
                <p className={`font-serif font-bold text-sm mt-1 ${g.color}`}>{g.title}</p>
                <p className="text-[10px] text-[#9BA8B5] mt-0.5">{g.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-4 pb-24 space-y-8">

        {/* Section tabs */}
        <div className="flex items-center gap-2 border-b border-[#DDE6F3] pb-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`
                flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all
                ${activeTab === t.id
                  ? "border-[#2F5D7C] text-[#2F5D7C]"
                  : "border-transparent text-[#6B7C93] hover:text-[#1F2937]"
                }
              `}
            >
              <span>{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden">{t.sub}</span>
            </button>
          ))}
        </div>

        {/* ── EQUITY TAB ────────────────────────────────────────────────── */}
        {activeTab === "equity" && (
          <SectionPanel
            icon="🚀"
            title="Equity Funds"
            badge="GROWTH"
            badgeColor="bg-white/20 text-white"
            desc="Best for goals 5+ years away. We score every equity fund by company size and investment style, then pick the single best using 3-year alpha, beat rate, and composite performance score."
            headerColor="bg-gradient-to-r from-[#2F5D7C] to-[#1a3a52]"
          >
            {loading ? (
              <div className="flex h-56 items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-[#2F5D7C] border-t-transparent" />
                  <p className="text-xs text-[#6B7C93]">Analysing 2,006 funds…</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex h-56 items-center justify-center">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-[640px]">
                    <thead>
                      <tr>
                        {/* Corner cell */}
                        <th className="w-36 p-3 text-left">
                          <span className="text-[10px] text-[#9BA8B5] font-medium">
                            Size ↓ &nbsp; Style →
                          </span>
                        </th>
                        {EQ_COLS.map((c) => (
                          <th key={c.key} className="p-3 text-center">
                            <p className="text-sm font-bold text-[#1F2937]">{c.label}</p>
                            <p className="mt-0.5 text-[10px] text-[#9BA8B5] font-normal">{c.desc}</p>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {EQ_ROWS.map((row, ri) => (
                        <tr key={row.key}>
                          <td className="p-3 align-top">
                            <p className="text-sm font-bold text-[#1F2937]">{row.label}</p>
                            <p className="mt-0.5 text-[10px] text-[#9BA8B5]">{row.desc}</p>
                          </td>
                          {EQ_COLS.map((col, ci) => {
                            const box = gridResults?.[ri]?.[ci];
                            if (!box) {
                              return (
                                <td key={col.key} className="p-2 align-top">
                                  <div className="h-[140px] rounded-xl border border-dashed border-[#DDE6F3] bg-[#FAFBFC]" />
                                </td>
                              );
                            }
                            return (
                              <td key={col.key} className="p-2 align-top">
                                <GridCell
                                  box={box}
                                  rowLabel={row.label}
                                  colLabel={col.label}
                                  onClick={() => setModal({ row: ri, col: ci })}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Legend */}
                <div className="mt-4 flex flex-wrap items-center gap-5 text-xs text-[#6B7C93]">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                    Active — managers beating index
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                    Index / ETF — lowest tracking error
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#DDE6F3] bg-white text-[9px] font-bold text-[#6B7C93]">i</span>
                    Click any cell to see full audit trail
                  </span>
                </div>
              </>
            )}
          </SectionPanel>
        )}

        {/* ── HYBRID TAB ────────────────────────────────────────────────── */}
        {activeTab === "hybrid" && (
          <SectionPanel
            icon="⚖️"
            title="Hybrid Funds"
            badge="BALANCED"
            badgeColor="bg-white/20 text-white"
            desc="Best for goals 3–5 years away. A carefully balanced mix of equity and debt — some also include gold and silver for additional diversification."
            headerColor="bg-gradient-to-r from-amber-500 to-orange-600"
          >
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <span className="text-xl">🔧</span>
              <div>
                <p className="text-sm font-semibold text-amber-800">Analysis coming soon</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  We're building the hybrid fund scoring model. The grid structure is ready — data is being validated.
                </p>
              </div>
            </div>
            <PlaceholderGrid rows={hybridRows} cols={hybridCols} />
          </SectionPanel>
        )}

        {/* ── DEBT TAB ──────────────────────────────────────────────────── */}
        {activeTab === "debt" && (
          <SectionPanel
            icon="💧"
            title="Debt Funds"
            badge="SAFETY"
            badgeColor="bg-white/20 text-white"
            desc="Best for goals under 3 years. Steady, predictable returns. We match funds by investment duration and rank by expense ratio — the only metric that truly matters for debt."
            headerColor="bg-gradient-to-r from-slate-500 to-slate-700"
          >
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="text-xl">🔧</span>
              <div>
                <p className="text-sm font-semibold text-slate-700">Analysis coming soon</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Debt fund scoring uses duration-matching and expense ratios. Grid structure is finalised — data pipeline in progress.
                </p>
              </div>
            </div>
            <PlaceholderGrid rows={debtRows} cols={debtCols} />
          </SectionPanel>
        )}

        {/* ── BOTTOM: OVERVIEW CARDS ────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              id: "equity", icon: "🚀", title: "Equity Funds",
              desc: "4 sizes × 4 styles = 16 categories", timeline: "Goals 5+ years",
              gradient: "from-[#2F5D7C] to-[#1a3a52]", live: true,
            },
            {
              id: "hybrid", icon: "⚖️", title: "Hybrid Funds",
              desc: "2 allocations × 3 strategies = 6 categories", timeline: "Goals 3–5 years",
              gradient: "from-amber-500 to-orange-600", live: false,
            },
            {
              id: "debt", icon: "💧", title: "Debt Funds",
              desc: "3 durations × 3 types = 9 categories", timeline: "Goals under 3 years",
              gradient: "from-slate-500 to-slate-700", live: false,
            },
          ].map((card) => (
            <button
              key={card.id}
              onClick={() => setActiveTab(card.id as any)}
              className={`
                relative rounded-xl bg-gradient-to-br ${card.gradient} p-5 text-left text-white
                transition-all hover:scale-[1.02] hover:shadow-lg
                ${activeTab === card.id ? "ring-2 ring-white ring-offset-2 ring-offset-[#F5F8FF]" : ""}
              `}
            >
              <span className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-bold
                ${card.live ? 'bg-green-400/30 text-green-200' : 'bg-white/20 text-white/60'}">
                {card.live ? "Live" : "Soon"}
              </span>
              <span className="text-2xl">{card.icon}</span>
              <p className="mt-2 font-serif text-base font-bold">{card.title}</p>
              <p className="mt-1 text-[11px] text-white/65">{card.desc}</p>
              <p className="mt-2 text-[11px] font-semibold text-white/85">{card.timeline}</p>
            </button>
          ))}
        </div>

      </main>

      {/* ── AUDIT MODAL ───────────────────────────────────────────────────── */}
      {modal && gridResults?.[modal.row]?.[modal.col] && (
        <AuditModal
          box={gridResults[modal.row][modal.col]}
          rowLabel={EQ_ROWS[modal.row]?.label ?? ""}
          colLabel={EQ_COLS[modal.col]?.label ?? ""}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}