"use client";

import AnalysisTabs from "@/components/AnalysisTabs";
import React, { useState, useEffect, useMemo } from "react";
import { Info, PieChart, Zap, RotateCcw, Filter, CheckCircle2 } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES — Aligned with your R2 files and fixing Property Access Errors
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
  Benchmark_Name: string;
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
  auditPool: InsightRow[];
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
  const [modal, setModal] = useState<GridCell | null>(null);

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
  // CORE 16-CELL LOGIC ENGINE (Updated as per your requirements)
  // ─────────────────────────────────────────────────────────────────────────────
  const gridData = useMemo(() => {
    if (loading || activeTab !== "Equity") return [];

    return ROWS.map(rowSize => {
      return COLS.map(colStyle => {
        let candidateNames: string[] = [];
        const isMomentum = colStyle === "Momentum";
        const isPureActive = colStyle === "Pure Active";

        // Step 1: Sub-category Clustering
        if (rowSize === "Large Cap") {
          if (colStyle === "Value & Contra") candidateNames = ["Value Fund", "Contra Fund"];
          else if (colStyle === "Growth / Core") candidateNames = ["Large Cap Fund", "Large & Mid Cap Fund"];
          else candidateNames = ["Large Cap Fund"];
        } else if (rowSize === "Mid Cap") {
          candidateNames = ["Mid Cap Fund"];
        } else if (rowSize === "Small Cap") {
          candidateNames = ["Small Cap Fund"];
        } else {
          candidateNames = ["Flexi Cap Fund", "Multi Cap Fund"];
        }

        // Tier 1: Find Leading Sub-Category
        const auditPool = data.insights.filter(i => candidateNames.includes(i.Sub_Category_Name));
        const winnerSubCat = [...auditPool].sort((a, b) => b.Avg_Alpha_3Y - a.Avg_Alpha_3Y)[0] || null;

        // Tier 2: Decision thresholds
        const alphaOk = (winnerSubCat?.Avg_Alpha_3Y || 0) > 0.5;
        const beatOk = (winnerSubCat?.Pct_Funds_Beating_Benchmark_3Y || 0) > 50;
        const useActive = isPureActive || (!isMomentum && alphaOk && beatOk);

        let finalFund: UnifiedFund | null = null;
        let reason = "";

        if (isMomentum) {
          const match = data.etfs.filter(e => 
            e.Benchmark_Name.toLowerCase().includes("momentum") && 
            e.Benchmark_Name.toLowerCase().includes(rowSize.split(' ')[0].toLowerCase())
          ).sort((a, b) => b.ETF_Score - a.ETF_Score)[0];
          if (match) { finalFund = { ...match, type: 'passive' }; reason = "Momentum factor index selection."; }
        } else if (useActive && winnerSubCat) {
          const match = data.active.filter(f => f.Sub_Category === winnerSubCat.Sub_Category_Name)
            .sort((a, b) => b.Composite_Score - a.Composite_Score)[0];
          if (match) { finalFund = { ...match, type: 'active' }; reason = "Active performance thresholds met."; }
        } else if (winnerSubCat) {
          const match = data.etfs.filter(e => e.Benchmark_Name.includes(rowSize.split(' ')[0]))
            .sort((a, b) => b.ETF_Score - a.ETF_Score)[0];
          if (match) { finalFund = { ...match, type: 'passive' }; reason = "Alpha below threshold; using indexed fallback."; }
        }

        return { rowSize, colStyle, winnerSubCat, finalFund, isPassive: !useActive, auditPool, decisionReason: reason } as GridCell;
      });
    });
  }, [data, loading, activeTab]);

  return (
    <div className="min-h-screen bg-[#F5F8FF] pb-20">
      {/* ─────────────────────────────────────────────────────────────────────────────
          ORIGINAL NAVIGATION BAR — PRESERVED FROM YOUR FILE
          ───────────────────────────────────────────────────────────────────────────── */}
      <nav className="bg-white border-b sticky top-0 z-[60] px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">N</div>
          <span className="text-xl font-serif font-bold text-blue-900 tracking-tight uppercase">Nivesify</span>
        </div>
        <AnalysisTabs />
        <div className="w-20" /> 
      </nav>

      <main className="max-w-7xl mx-auto px-8 pt-12">
        {/* ─────────────────────────────────────────────────────────────────────────────
            ORIGINAL HERO SECTION — PRESERVED FROM YOUR FILE
            ───────────────────────────────────────────────────────────────────────────── */}
        <div className="max-w-3xl mb-12">
          <h1 className="text-5xl font-serif font-bold leading-tight mb-4">Find My Fund</h1>
          <p className="text-slate-500 text-lg leading-relaxed">
            We evaluate the entire equity universe (~558 funds) to find the best sub-category winner for each style. 
            Active funds are chosen only when they prove they can beat the index by {">"} 0.5%.
          </p>
        </div>

        {/* THE 16-CELL GRID */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden mb-16">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="p-8 border-b text-[10px] font-black uppercase text-slate-400 tracking-widest w-48">Size ↓ Style →</th>
                {COLS.map(col => (
                  <th key={col} className="p-8 border-b min-w-[240px]">
                    <div className="font-serif text-xl font-bold">{col}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-tighter">Selection Engine</div>
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
                          onClick={() => setModal(cell)}
                          className="p-5 rounded-3xl border border-slate-100 bg-white hover:border-blue-400 hover:shadow-xl transition-all cursor-pointer group"
                        >
                          <div className="flex justify-between mb-4">
                            <span className={`flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${cell.isPassive ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                              {cell.isPassive ? <PieChart size={10} /> : <Zap size={10} />}
                              {cell.isPassive ? '📊 INDEX' : '🎯 ACTIVE'}
                            </span>
                            <Info size={14} className="text-slate-200 group-hover:text-blue-500" />
                          </div>
                          
                          <div className="text-[13px] font-extrabold text-slate-800 line-clamp-2 min-h-[40px] mb-3 leading-snug">
                            {cell.finalFund.type === 'passive' ? cell.finalFund.ETF_Name : cell.finalFund.Fund_Name}
                          </div>

                          <div className="flex justify-between pt-3 border-t border-slate-50">
                            <span className="text-[10px] font-bold text-slate-400">α {cell.winnerSubCat?.Avg_Alpha_3Y.toFixed(1)}%</span>
                            <span className="text-[10px] font-bold text-slate-400">Beat {cell.winnerSubCat?.Pct_Funds_Beating_Benchmark_3Y}%</span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-8 text-center text-[10px] text-slate-300 font-bold uppercase border-2 border-dashed border-slate-50 rounded-3xl">Analyzing Segment...</div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ─────────────────────────────────────────────────────────────────────────────
            ORIGINAL BOTTOM CARDS (GOAL/DURATION) — PRESERVED FROM YOUR FILE
            ───────────────────────────────────────────────────────────────────────────── */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-serif text-2xl font-bold text-slate-900 italic">Matching your duration...</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { id: "Equity",  icon: "📈", title: "Equity Matrix",     detail: "4 sizes × 4 styles",           timeline: "Goals over 5 years", gradient: "from-blue-600 to-indigo-700", live: true },
            { id: "Hybrid",  icon: "⚖️", title: "Hybrid Matrix",     detail: "Conservative to Aggressive", timeline: "Goals 3–5 years",     gradient: "from-emerald-500 to-teal-700",  live: false },
            { id: "Tax",     icon: "🛡️", title: "Tax Saving (ELSS)", detail: "Best Section 80C options",  timeline: "3 year lock-in",      gradient: "from-orange-500 to-red-600",   live: false },
            { id: "Debt",    icon: "🏦", title: "Debt Matrix",       detail: "3 durations × 3 credit types", timeline: "Goals under 3 years", gradient: "from-slate-500 to-slate-700", live: false },
          ].map(card => (
            <button
              key={card.id}
              onClick={() => setActiveTab(card.id as any)}
              className={`relative rounded-xl bg-gradient-to-br ${card.gradient} p-5 text-left text-white transition-all hover:scale-[1.02] hover:shadow-lg ${activeTab === card.id ? "ring-2 ring-white ring-offset-2 ring-offset-[#F5F8FF]" : ""}`}
            >
              <span className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-bold ${card.live ? "bg-green-400/30 text-green-200" : "bg-white/20 text-white/60"}`}>
                {card.live ? "Live" : "Soon"}
              </span>
              <span className="text-2xl">{card.icon}</span>
              <p className="mt-2 font-serif text-base font-bold">{card.title}</p>
              <p className="mt-1 text-[11px] text-white/65">{card.detail}</p>
              <p className="mt-2 text-[11px] font-semibold text-white/85">{card.timeline}</p>
            </button>
          ))}
        </div>
      </main>

      {/* AUDIT MODAL */}
      {modal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in">
            <div className="p-10">
              <div className="flex justify-between items-start mb-8 text-slate-900">
                <div>
                  <h3 className="text-3xl font-serif font-bold">Selection Audit</h3>
                  <div className="flex gap-2 mt-2">
                    <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-0.5 rounded uppercase">{modal.rowSize}</span>
                    <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded uppercase">{modal.colStyle}</span>
                  </div>
                </div>
                <button onClick={() => setModal(null)}><RotateCcw className="text-slate-400" /></button>
              </div>

              <div className="space-y-6">
                <h4 className="text-[11px] font-black uppercase text-blue-600 tracking-widest flex items-center gap-2"><Filter size={14} /> Candidates Leaderboard</h4>
                <div className="border rounded-2xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 font-bold">
                      <tr><th className="p-4 text-left">Sub-Category</th><th className="p-4 text-right">3Y Alpha</th><th className="p-4 text-right">Beat Rate</th></tr>
                    </thead>
                    <tbody>
                      {modal.auditPool.map(p => (
                        <tr key={p.Sub_Category_Name} className={p.Sub_Category_Name === modal.winnerSubCat?.Sub_Category_Name ? "bg-blue-50/50" : ""}>
                          <td className="p-4 font-bold">{p.Sub_Category_Name}</td>
                          <td className="p-4 text-right">{p.Avg_Alpha_3Y.toFixed(2)}%</td>
                          <td className="p-4 text-right">{p.Pct_Funds_Beating_Benchmark_3Y}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="bg-slate-900 rounded-[2rem] p-8 text-white">
                  <div className="text-[10px] font-black uppercase text-blue-400 mb-2 flex items-center gap-2"><CheckCircle2 size={14} /> Final Verdict</div>
                  <p className="text-xl font-bold mb-2">{modal.finalFund?.type === 'passive' ? modal.finalFund.ETF_Name : modal.finalFund?.Fund_Name}</p>
                  <p className="text-slate-400 text-sm italic">"{modal.decisionReason}"</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}