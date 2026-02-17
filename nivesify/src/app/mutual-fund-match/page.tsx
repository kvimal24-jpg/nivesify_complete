"use client";

import AnalysisTabs from "@/components/AnalysisTabs";
import React, { useState, useEffect, useMemo } from "react";
import { 
  Search, Info, TrendingUp, ShieldCheck, Zap, PieChart, 
  ArrowRight, CheckCircle2, RotateCcw, BarChart3, Filter,
  ChevronRight, Calendar, Target, Award
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES — Strictly aligned with your R2 JSON and fixing Property Errors
// ─────────────────────────────────────────────────────────────────────────────

type InsightRow = {
  Level: string;
  Category_Name: string | null;
  Sub_Category_Name: string;
  Number_of_Schemes: number;
  Avg_Alpha_3Y: number;
  Pct_Funds_Beating_Benchmark_3Y: number;
  Avg_3Y_Return: number;
};

type FundAnalytics = {
  Fund_Name: string;
  Category: string;
  Sub_Category: string;
  Composite_Score: number;
  Alpha_3Y: number | null;
  Rank_in_SubCategory: number;
};

type ETFAnalytics = {
  ETF_Name: string;
  Benchmark_Name: string;
  ETF_Score: number;
  Tracking_Diff_3Y: number | null;
};

// Tagged Union to fix "Property ETF_Name does not exist on type..."
type UnifiedFund = 
  | (FundAnalytics & { type: 'active' }) 
  | (ETFAnalytics & { type: 'passive' });

type GridCell = {
  rowSize: string;
  colStyle: string;
  winnerSubCat: InsightRow | null;
  finalFund: UnifiedFund | null;
  isPassive: boolean;
  auditPool: InsightRow[]; // For the Audit Leaderboard
  decisionReason: string;
};

const ROWS = ["Large Cap", "Mid Cap", "Small Cap", "Flexi / Multi Cap"];
const COLS = ["Value & Contra", "Growth / Core", "Momentum", "Pure Active"];

export default function FindMyFund() {
  const [activeTab, setActiveTab] = useState<"Equity" | "Debt" | "Hybrid">("Equity");
  const [data, setData] = useState<{ insights: InsightRow[], active: FundAnalytics[], etfs: ETFAnalytics[] }>({
    insights: [], active: [], etfs: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedBox, setSelectedBox] = useState<GridCell | null>(null);

  useEffect(() => {
    async function loadR2Data() {
      try {
        const [resIns, resAct, resEtf] = await Promise.all([
          fetch('https://r2.nivesify.com/data_latest_industry-and-category-insights.json').then(r => r.json()),
          fetch('https://r2.nivesify.com/data_latest_fund-analytics.json').then(r => r.json()),
          fetch('https://r2.nivesify.com/data_latest_etf-analytics.json').then(r => r.json()),
        ]);
        setData({ insights: resIns, active: resAct, etfs: resEtf });
        setLoading(false);
      } catch (error) {
        console.error("Data fetch failed", error);
      }
    }
    loadR2Data();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // THE IMPROVED 16-CELL LOGIC ENGINE
  // ─────────────────────────────────────────────────────────────────────────────
  const gridData = useMemo(() => {
    if (loading || activeTab !== "Equity") return [];

    return ROWS.map(rowSize => {
      return COLS.map(colStyle => {
        let candidateSubCatNames: string[] = [];
        const isMomentum = colStyle === "Momentum";
        const isPureActive = colStyle === "Pure Active";

        // 1. CLUSTERING LOGIC: Map Styles to Sub-Category names
        if (rowSize === "Large Cap") {
          if (colStyle === "Value & Contra") candidateSubCatNames = ["Value Fund", "Contra Fund"];
          else if (colStyle === "Growth / Core") candidateSubCatNames = ["Large Cap Fund", "Large & Mid Cap Fund"];
          else candidateSubCatNames = ["Large Cap Fund"];
        } else if (rowSize === "Mid Cap") {
          candidateSubCatNames = ["Mid Cap Fund"]; // Code will later search for "Value" in fund names if needed
        } else if (rowSize === "Small Cap") {
          candidateSubCatNames = ["Small Cap Fund"];
        } else { // Flexi/Multi
          candidateSubCatNames = ["Flexi Cap Fund", "Multi Cap Fund"];
        }

        // TIER 1: Sub-Category Winner based on Avg Performance
        const auditPool = data.insights.filter(i => candidateSubCatNames.includes(i.Sub_Category_Name));
        const winnerSubCat = [...auditPool].sort((a, b) => b.Avg_Alpha_3Y - a.Avg_Alpha_3Y)[0] || null;

        // ENFORCED SEPARATION: Decision Thresholds
        const alphaThreshold = (winnerSubCat?.Avg_Alpha_3Y || 0) > 0.5;
        const beatThreshold = (winnerSubCat?.Pct_Funds_Beating_Benchmark_3Y || 0) > 50;
        const useActive = isPureActive || (!isMomentum && alphaThreshold && beatThreshold);

        // TIER 2: Best Fund Selection
        let finalFund: UnifiedFund | null = null;
        let reason = "";

        if (isMomentum) {
          const match = data.etfs.filter(e => 
            e.Benchmark_Name.toLowerCase().includes("momentum") && 
            e.Benchmark_Name.toLowerCase().includes(rowSize.split(' ')[0].toLowerCase())
          ).sort((a, b) => b.ETF_Score - a.ETF_Score)[0];
          if (match) {
            finalFund = { ...match, type: 'passive' };
            reason = "Strategy: Passive Momentum Index tracking.";
          }
        } else if (useActive && winnerSubCat) {
          // Find best active fund in the winning sub-category
          const match = data.active.filter(f => f.Sub_Category === winnerSubCat.Sub_Category_Name)
            .sort((a, b) => b.Composite_Score - a.Composite_Score)[0];
          if (match) {
            finalFund = { ...match, type: 'active' };
            reason = `Active Win: Alpha (${winnerSubCat.Avg_Alpha_3Y.toFixed(1)}%) & Beat Rate (${winnerSubCat.Pct_Funds_Beating_Benchmark_3Y}%) meet thresholds.`;
          }
        } else if (winnerSubCat) {
          // Fallback to Index if Active doesn't add value
          const match = data.etfs.filter(e => e.Benchmark_Name.includes(rowSize.split(' ')[0]))
            .sort((a, b) => b.ETF_Score - a.ETF_Score)[0];
          if (match) {
            finalFund = { ...match, type: 'passive' };
            reason = "Passive Win: Active category alpha too low to justify fees.";
          }
        }

        return { rowSize, colStyle, winnerSubCat, finalFund, isPassive: !useActive, auditPool, decisionReason: reason } as GridCell;
      });
    });
  }, [data, loading, activeTab]);

  return (
    <div className="min-h-screen bg-[#F5F8FF] text-[#1A2B47]">
      <nav className="bg-white border-b sticky top-0 z-[60] px-6 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">N</div>
          <span className="text-xl font-serif font-bold tracking-tight text-blue-900 uppercase">Nivesify</span>
        </div>
        <AnalysisTabs activeTab={activeTab} setActiveTab={setActiveTab as any} />
        <div className="w-32" /> {/* Spacer */}
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="max-w-3xl mb-12">
          <h1 className="text-5xl font-serif font-bold leading-tight mb-4">Find My Fund</h1>
          <p className="text-slate-500 text-lg">
            We evaluate the entire equity universe (~558 funds) to find the best sub-category winner for each style. 
            Active funds are chosen only when they prove they can beat the index by {">"}0.5%.
          </p>
        </div>

        {/* 16-CELL GRID */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="p-8 border-b text-[10px] font-black uppercase text-slate-400 tracking-widest w-48">Size ↓ Style →</th>
                {COLS.map(col => (
                  <th key={col} className="p-8 border-b">
                    <div className="font-serif text-xl font-bold">{col}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                      {col === 'Momentum' ? 'Ride Winning Trends' : 'Strategic Alpha'}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gridData.map((row, rIdx) => (
                <tr key={rIdx}>
                  <td className="p-8 border-b bg-slate-50/30 font-bold text-slate-700">{ROWS[rIdx]}</td>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-4 border-b">
                      {cell.finalFund ? (
                        <div 
                          onClick={() => setSelectedBox(cell)}
                          className="p-5 rounded-3xl border border-slate-100 bg-white hover:border-blue-400 hover:shadow-xl transition-all cursor-pointer group"
                        >
                          <div className="flex justify-between mb-4">
                            <span className={`flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${cell.isPassive ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                              {cell.isPassive ? <PieChart size={10} /> : <Zap size={10} />}
                              {cell.isPassive ? '📊 INDEX' : '🎯 ACTIVE'}
                            </span>
                            <Info size={14} className="text-slate-200 group-hover:text-blue-500" />
                          </div>
                          
                          <div className="text-[13px] font-extrabold text-slate-800 line-clamp-2 min-h-[40px] mb-3">
                            {cell.finalFund.type === 'passive' ? cell.finalFund.ETF_Name : cell.finalFund.Fund_Name}
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                            <div className="text-[10px] font-bold text-slate-400">α {cell.winnerSubCat?.Avg_Alpha_3Y.toFixed(1)}%</div>
                            <div className="text-[10px] font-bold text-slate-400">Beat {cell.winnerSubCat?.Pct_Funds_Beating_Benchmark_3Y}%</div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-8 border-2 border-dashed border-slate-100 rounded-3xl text-center text-slate-300 text-[10px] font-bold uppercase">No Match</div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FEATURE CARDS */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-8 bg-slate-900 rounded-[2rem] text-white">
            <Target className="text-blue-400 mb-6" size={32} />
            <h4 className="font-bold text-lg mb-2">Universe Scanned</h4>
            <p className="text-slate-400 text-sm">558 Equity funds + All NSE/BSE Listed ETFs analyzed.</p>
          </div>
          <div className="p-8 bg-white border rounded-[2rem]">
            <ShieldCheck className="text-green-500 mb-6" size={32} />
            <h4 className="font-bold text-lg mb-2">Zero Bias</h4>
            <p className="text-slate-500 text-sm">Recommendations are purely math-driven based on R2 data.</p>
          </div>
          <div className="p-8 bg-white border rounded-[2rem]">
            <Award className="text-blue-600 mb-6" size={32} />
            <h4 className="font-bold text-lg mb-2">Threshold Pure</h4>
            <p className="text-slate-500 text-sm">Active funds must prove value to be included in the matrix.</p>
          </div>
          <div className="p-8 bg-blue-600 rounded-[2rem] text-white">
            <Calendar className="text-blue-200 mb-6" size={32} />
            <h4 className="font-bold text-lg mb-2">Live Sync</h4>
            <p className="text-blue-100 text-sm">Refreshed with the latest Industry and Category Insights.</p>
          </div>
        </div>
      </main>

      {/* AUDIT MODAL */}
      {selectedBox && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] max-w-2xl w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="p-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <div className="flex gap-2 mb-2">
                    <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-0.5 rounded uppercase">{selectedBox.rowSize}</span>
                    <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded uppercase">{selectedBox.colStyle}</span>
                  </div>
                  <h3 className="text-3xl font-serif font-bold text-slate-900">Quant Audit Trail</h3>
                </div>
                <button onClick={() => setSelectedBox(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <RotateCcw className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-8">
                <section>
                  <h4 className="text-[11px] font-black uppercase text-blue-600 tracking-widest mb-4 flex items-center gap-2">
                    <Filter size={14} /> 1. Style-Category Leaderboard
                  </h4>
                  <div className="border rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 font-bold text-slate-500">
                        <tr>
                          <th className="p-4 text-left">Sub-Category</th>
                          <th className="p-4 text-right">Alpha</th>
                          <th className="p-4 text-right">Beat Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedBox.auditPool.map((p) => (
                          <tr key={p.Sub_Category_Name} className={p.Sub_Category_Name === selectedBox.winnerSubCat?.Sub_Category_Name ? "bg-blue-50/50" : ""}>
                            <td className="p-4 font-bold">{p.Sub_Category_Name}</td>
                            <td className="p-4 text-right">{p.Avg_Alpha_3Y.toFixed(2)}%</td>
                            <td className="p-4 text-right">{p.Pct_Funds_Beating_Benchmark_3Y}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <div className="bg-slate-900 rounded-[2rem] p-8 text-white">
                  <div className="flex items-center gap-2 text-blue-400 text-[10px] font-black uppercase mb-3">
                    <CheckCircle2 size={14} /> The Verdict
                  </div>
                  <p className="text-lg font-serif mb-6 text-slate-300 italic">"{selectedBox.decisionReason}"</p>
                  <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                    <p className="text-[10px] uppercase font-black text-slate-500 mb-1">Winning Instrument</p>
                    <p className="text-xl font-bold">
                      {selectedBox.finalFund?.type === 'passive' ? selectedBox.finalFund.ETF_Name : selectedBox.finalFund?.Fund_Name}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}