//DEMO
"use client";

import React, { useState } from "react";
import AnalysisTabs from "@/components/AnalysisTabs";
import {
  InvestmentGoalEngine,
  type UserInput,
  type EngineOutput,
  type Goal,
} from "@/lib/investment-goal-engine";

const GOAL_TEMPLATES = [
  { name: "Emergency Fund", type: "mandatory", targetAmount: 500000, years: 1, inflation: 6 },
  { name: "Andaman Trip", type: "aspirational", targetAmount: 500000, years: 2, inflation: 6 },
  { name: "Child Education", type: "mandatory", targetAmount: 2500000, years: 10, inflation: 8 },
  { name: "Retirement", type: "mandatory", targetAmount: 10000000, years: 25, inflation: 7 },
  { name: "Home Down Payment", type: "mandatory", targetAmount: 3000000, years: 5, inflation: 6 },
  { name: "Car Purchase", type: "aspirational", targetAmount: 800000, years: 3, inflation: 5 },
];

// Role definitions
const ROLE_CONFIG = {
  anchor: { emoji: "🛡️", name: "Anchor", color: "#2F5D7C" },
  pillar: { emoji: "🏛️", name: "Pillar", color: "#2F5D7C" },
  contrarian: { emoji: "🎯", name: "Contrarian", color: "#2F5D7C" },
  speedster: { emoji: "⚡", name: "Speedster", color: "#2F5D7C" },
  compounder: { emoji: "📈", name: "Compounder", color: "#2F5D7C" },
  allrounder: { emoji: "🌐", name: "All-Rounder", color: "#2F5D7C" },
  stabilizer: { emoji: "⚖️", name: "Stabilizer", color: "#2F5D7C" },
};

export default function MutualFundMatchPage() {
  const [currentStep, setCurrentStep] = useState<"input" | "processing" | "results">("input");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [riskAppetite, setRiskAppetite] = useState<"conservative" | "moderate" | "aggressive">("moderate");
  const [stepUpPercentage, setStepUpPercentage] = useState(10);
  const [monthlySIPCapacity, setMonthlySIPCapacity] = useState(60000);
  const [incomeStability, setIncomeStability] = useState<"stable" | "variable" | "uncertain">("stable");
  const [results, setResults] = useState<EngineOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);

  const addGoal = (template?: typeof GOAL_TEMPLATES[0]) => {
    const newGoal: Goal = {
      id: `goal-${Date.now()}`,
      name: template?.name || "New Goal",
      type: (template?.type as "mandatory" | "aspirational") || "mandatory",
      currentAmount: 0,
      targetAmount: template?.targetAmount || 100000,
      yearsToGoal: template?.years || 5,
      inflationRate: template?.inflation || 6,
    };
    setGoals([...goals, newGoal]);
  };

  const updateGoal = (id: string, field: keyof Goal, value: Goal[keyof Goal]) => {
    setGoals(goals.map((g) => (g.id === id ? { ...g, [field]: value } : g)));
  };

  const removeGoal = (id: string) => {
    setGoals(goals.filter((g) => g.id !== id));
  };

  const handleCalculate = async () => {
    if (goals.length === 0) {
      alert("Please add at least one goal.");
      return;
    }

    setLoading(true);
    setCurrentStep("processing");

    try {
      const engine = new InvestmentGoalEngine();
      const input: UserInput = {
        goals,
        monthlySIPCapacity,
        stepUpPercentage,
        riskAppetite,
        incomeStability,
      };

      const output = await engine.execute(input);
      setResults(output);
      setCurrentStep("results");
    } catch (error) {
      console.error("Calculation error:", error);
      alert(`Error: ${error instanceof Error ? error.message : String(error)}`);
      setCurrentStep("input");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  const formatNumber = (value: number, digits = 1) => value.toFixed(digits);

  const cardClass = "bg-white rounded-3xl border border-[#DDE6F3] shadow-[0_18px_40px_-30px_rgba(31,41,55,0.25)]";

  return (
    <div className="min-h-screen bg-[#F5F8FF] text-[#1F2937]">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pt-16 pb-10">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-[520px] h-[520px] bg-[#2F5D7C]/10 rounded-full blur-[160px]" />
          <div className="absolute bottom-1/3 right-1/4 w-[420px] h-[420px] bg-[#9BB4D6]/20 rounded-full blur-[140px]" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center space-y-4">
          <p className="text-[11px] uppercase tracking-[0.32em] text-[#6B7C70] font-serif">
            The 4×4 Matrix Engine • Dynamic Portfolio Evolution
          </p>
          <h1 className="text-3xl md:text-5xl font-serif tracking-tight leading-[1.1]">
            Goal-Based Investment Planner
          </h1>
          <p className="text-sm md:text-lg font-serif italic text-[#6B7C70]">
            One portfolio that evolves as you achieve goals. See the complete framework first, then your personalized plan.
          </p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-6 pb-16">
        <div className="flex flex-col gap-4 pb-8">
          <AnalysisTabs />
        </div>

        {currentStep === "input" && (
          <div className="space-y-8 animate-fadeIn">
            {/* Goal Templates */}
            {showTemplates && (
              <div className={`${cardClass} p-6 md:p-8`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl md:text-2xl font-serif text-[#1F2937]">Quick Start Templates</h2>
                  <button onClick={() => setShowTemplates(false)} className="text-xs text-[#6B7C70] hover:text-[#2F5D7C]">
                    Hide
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {GOAL_TEMPLATES.map((template) => (
                    <button
                      key={template.name}
                      onClick={() => addGoal(template)}
                      className="p-4 text-left rounded-2xl border border-[#E6E8E1] hover:border-[#2F5D7C] hover:bg-[#EEF4FA] transition-all"
                    >
                      <div className="font-medium text-[#1F2937] mb-1">{template.name}</div>
                      <div className="text-xs text-[#6B7C70]">{formatCurrency(template.targetAmount)} • {template.years}y</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Added Goals */}
            {goals.length > 0 && (
              <div className={`${cardClass} p-6 md:p-8`}>
                <h2 className="text-xl md:text-2xl font-serif text-[#1F2937] mb-4">Your Goals ({goals.length})</h2>
                <div className="space-y-3">
                  {goals.map((goal, idx) => (
                    <div key={goal.id} className="p-4 bg-[#F5F8FF] rounded-2xl">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-[#2F5D7C] text-white flex items-center justify-center text-sm font-bold">
                          {idx + 1}
                        </div>
                        <input
                          type="text"
                          value={goal.name}
                          onChange={(e) => updateGoal(goal.id, "name", e.target.value)}
                          className="flex-1 px-3 py-2 bg-white border border-[#E6E8E1] rounded-lg text-sm"
                        />
                        <button onClick={() => removeGoal(goal.id)} className="text-xs text-red-600 hover:text-red-800">
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <input
                          type="number"
                          value={goal.targetAmount}
                          onChange={(e) => updateGoal(goal.id, "targetAmount", Number(e.target.value))}
                          className="px-3 py-2 bg-white border border-[#E6E8E1] rounded-lg text-sm"
                          placeholder="Amount"
                        />
                        <input
                          type="number"
                          value={goal.yearsToGoal}
                          onChange={(e) => updateGoal(goal.id, "yearsToGoal", Number(e.target.value))}
                          className="px-3 py-2 bg-white border border-[#E6E8E1] rounded-lg text-sm"
                          placeholder="Years"
                        />
                        <input
                          type="number"
                          value={goal.inflationRate}
                          onChange={(e) => updateGoal(goal.id, "inflationRate", Number(e.target.value))}
                          className="px-3 py-2 bg-white border border-[#E6E8E1] rounded-lg text-sm"
                          placeholder="Inflation %"
                        />
                        <select
                          value={goal.type}
                          onChange={(e) => updateGoal(goal.id, "type", e.target.value as "mandatory" | "aspirational")}
                          className="px-3 py-2 bg-white border border-[#E6E8E1] rounded-lg text-sm"
                        >
                          <option value="mandatory">Mandatory</option>
                          <option value="aspirational">Aspirational</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => addGoal()}
                  className="mt-3 w-full py-2 border-2 border-dashed border-[#E6E8E1] rounded-xl text-sm text-[#6B7C70] hover:border-[#2F5D7C] hover:text-[#2F5D7C] transition-all"
                >
                  + Add Custom Goal
                </button>
              </div>
            )}

            {/* Investment Profile */}
            <div className={`${cardClass} p-6 md:p-8`}>
              <h2 className="text-xl md:text-2xl font-serif text-[#1F2937] mb-6">Investment Profile</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-[#4A5D4E] mb-3 uppercase tracking-[0.2em]">
                    Monthly SIP: {formatCurrency(monthlySIPCapacity)}
                  </label>
                  <input
                    type="range"
                    min="5000"
                    max="200000"
                    step="5000"
                    value={monthlySIPCapacity}
                    onChange={(e) => setMonthlySIPCapacity(Number(e.target.value))}
                    className="w-full h-2 bg-[#E6E8E1] rounded-lg appearance-none cursor-pointer accent-[#2F5D7C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4A5D4E] mb-3 uppercase tracking-[0.2em]">
                    Risk Appetite
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {["conservative", "moderate", "aggressive"].map((risk) => (
                      <button
                        key={risk}
                        onClick={() => setRiskAppetite(risk as any)}
                        className={`p-4 rounded-2xl border transition-all ${
                          riskAppetite === risk
                            ? "border-[#2F5D7C] bg-[#EEF4FA]"
                            : "border-[#E6E8E1] hover:border-[#9BB4D6]"
                        }`}
                      >
                        <div className="font-serif text-sm capitalize text-[#1F2937]">{risk}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4A5D4E] mb-3 uppercase tracking-[0.2em]">
                    Annual Step-up: {stepUpPercentage}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="5"
                    value={stepUpPercentage}
                    onChange={(e) => setStepUpPercentage(Number(e.target.value))}
                    className="w-full h-2 bg-[#E6E8E1] rounded-lg appearance-none cursor-pointer accent-[#2F5D7C]"
                  />
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex justify-center">
              <button
                onClick={handleCalculate}
                disabled={loading || goals.length === 0}
                className="px-8 py-4 bg-[#2F5D7C] text-white font-semibold rounded-xl hover:bg-[#254B66] transition-all shadow-lg disabled:opacity-50"
              >
                {loading ? "Calculating..." : "Generate My Plan"}
              </button>
            </div>
          </div>
        )}

        {currentStep === "processing" && (
          <div className="flex flex-col items-center justify-center py-16 animate-fadeIn">
            <div className="w-16 h-16 border-4 border-[#2F5D7C] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-lg font-serif text-[#1F2937]">Building your personalized plan...</p>
          </div>
        )}

        {currentStep === "results" && results && (
          <div className="space-y-6 animate-fadeIn">
            {/* SECTION 1: Understanding the Framework */}
            <details className={`${cardClass} p-6`} open>
              <summary className="cursor-pointer text-xl font-serif text-[#1F2937] mb-4 hover:text-[#2F5D7C]">
                📚 Step 1: Understanding the 4×4 Matrix Framework
              </summary>
              
              <div className="space-y-4 pl-4">
                <p className="text-sm text-[#4A5D4E] leading-relaxed">
                  We diversify portfolios across <strong>TWO dimensions</strong>: Market Size (Large, Mid, Small, Total Market) 
                  and Investment Style (Value, Growth, Momentum). This creates 12 possible combinations, protecting you when any single segment underperforms.
                </p>

                {/* 4x4
                 Matrix Table - Complete Framework */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-[#EEF4FA]">
                        <th className="p-3 text-left border border-[#DDE6F3] font-semibold text-[#1F2937]">Size \ Style</th>
                        <th className="p-3 text-center border border-[#DDE6F3] font-semibold text-[#1F2937]">Value/Contra</th>
                        <th className="p-3 text-center border border-[#DDE6F3] font-semibold text-[#1F2937]">Core/Growth</th>
                        <th className="p-3 text-center border border-[#DDE6F3] font-semibold text-[#1F2937]">Momentum/Alpha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { size: "Large Cap", cells: ["Value Funds", "Large Cap / Nifty 50", "—"] },
                        { size: "Mid Cap", cells: ["—", "Mid Cap 150", "Mid Momentum"] },
                        { size: "Small Cap", cells: ["—", "Small Cap 250", "Small Momentum"] },
                        { size: "Total Market", cells: ["—", "Flexi/Multi Cap", "—"] }
                      ].map((row) => (
                        <tr key={row.size}>
                          <td className="p-3 border border-[#DDE6F3] font-medium bg-[#F5F8FF]">{row.size}</td>
                          {row.cells.map((cell, idx) => (
                            <td
                              key={idx}
                              className={`p-3 border border-[#DDE6F3] text-center text-xs ${
                                cell === "—" ? "bg-white text-[#9BB4D6]" : "bg-[#D5E8F0] text-[#1F2937]"
                              }`}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Active vs ETF Decision Box */}
                <div className="p-3 bg-[#F5F8FF] rounded-xl border border-[#DDE6F3]">
                  <div className="text-xs font-semibold text-[#1F2937] mb-2">How we choose Active vs ETF:</div>
                  <div className="space-y-1 text-xs text-[#4A5D4E]">
                    <div>✅ <strong>Active Fund:</strong> When Alpha &gt; 1.5% AND Beat Rate &gt; 65% (Example: Value/Contra funds)</div>
                    <div>📉 <strong>ETF/Index:</strong> When Alpha &lt; 0.5% OR Beat Rate &lt; 50% (Example: Mid Cap, Small Cap)</div>
                  </div>
                </div>

                <div className="p-3 bg-[#EEF4FA] rounded-xl text-xs text-[#4A5D4E]">
                  💡 <strong>Why this works:</strong> When Growth underperforms, Value protects you. When Large Caps lag, Mid/Small compensate.
                </div>
              </div>
            </details>

            {/* SECTION 2: The Core-7 Roles */}
            <details className={`${cardClass} p-6`} open>
              <summary className="cursor-pointer text-xl font-serif text-[#1F2937] mb-4 hover:text-[#2F5D7C]">
                🎯 Step 2: The Core-7 Portfolio Roles (Complete Framework)
              </summary>

              <div className="space-y-4 pl-4">
                <p className="text-sm text-[#4A5D4E] leading-relaxed">
                  The 16 matrix positions consolidate into <strong>7 functional roles</strong>. Each role has specific sub-categories and top funds.
                </p>

                <div className="space-y-3">
                  {/* Role 1: Anchor */}
                  <details className="bg-[#F5F8FF] rounded-xl border border-[#DDE6F3]">
                    <summary className="cursor-pointer p-4 hover:bg-[#EEF4FA] transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🛡️</span>
                          <div>
                            <div className="font-semibold text-[#1F2937]">Anchor</div>
                            <div className="text-xs text-[#6B7C70]">Safety & liquidity for near-term goals (0-3 years)</div>
                          </div>
                        </div>
                        <div className="text-xs text-[#2F5D7C] font-semibold">Debt Category</div>
                      </div>
                    </summary>
                    <div className="px-4 pb-4 space-y-2">
                      <div className="text-xs text-[#6B7C70] mb-2">
                        <strong>Sub-Categories:</strong> Liquid Fund, Money Market, Short Duration
                      </div>
                      <div className="text-xs text-[#4A5D4E] bg-white p-3 rounded-lg">
                        <strong>Best Funds:</strong> HDFC Liquid Fund, ICICI Pru Liquid Fund, Axis Liquid Fund
                      </div>
                    </div>
                  </details>

                  {/* Role 2: Pillar */}
                  <details className="bg-[#F5F8FF] rounded-xl border border-[#DDE6F3]">
                    <summary className="cursor-pointer p-4 hover:bg-[#EEF4FA] transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🏛️</span>
                          <div>
                            <div className="font-semibold text-[#1F2937]">Pillar</div>
                            <div className="text-xs text-[#6B7C70]">Core large-cap stability with minimal tracking error</div>
                          </div>
                        </div>
                        <div className="text-xs text-blue-600 font-semibold">ETF Recommended</div>
                      </div>
                    </summary>
                    <div className="px-4 pb-4 space-y-2">
                      <div className="text-xs text-[#6B7C70] mb-2">
                        <strong>Sub-Category:</strong> Large Cap / Nifty 50
                      </div>
                      <div className="text-xs text-[#4A5D4E] bg-white p-3 rounded-lg">
                        <strong>Best Funds:</strong> Nifty 50 Index Fund, ICICI Pru Nifty 50 ETF, HDFC Index Nifty 50
                      </div>
                    </div>
                  </details>

                  {/* Role 3: Contrarian */}
                  <details className="bg-[#F5F8FF] rounded-xl border border-[#DDE6F3]">
                    <summary className="cursor-pointer p-4 hover:bg-[#EEF4FA] transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🎯</span>
                          <div>
                            <div className="font-semibold text-[#1F2937]">Contrarian</div>
                            <div className="text-xs text-[#6B7C70]">Value/Contra for defensive alpha (High Alpha: 3-4%)</div>
                          </div>
                        </div>
                        <div className="text-xs text-green-600 font-semibold">Active Recommended</div>
                      </div>
                    </summary>
                    <div className="px-4 pb-4 space-y-2">
                      <div className="text-xs text-[#6B7C70] mb-2">
                        <strong>Sub-Categories:</strong> Value Fund, Contra Fund, Dividend Yield Fund
                      </div>
                      <div className="text-xs text-[#4A5D4E] bg-white p-3 rounded-lg">
                        <strong>Best Funds:</strong> ICICI Pru Value Discovery, Invesco India Contra, UTI Dividend Yield
                      </div>
                      <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                        ✅ <strong>Data says Active:</strong> Avg Alpha 3.5%, Beat Rate 90%
                      </div>
                    </div>
                  </details>

                  {/* Role 4: Speedster */}
                  <details className="bg-[#F5F8FF] rounded-xl border border-[#DDE6F3]">
                    <summary className="cursor-pointer p-4 hover:bg-[#EEF4FA] transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">⚡</span>
                          <div>
                            <div className="font-semibold text-[#1F2937]">Speedster</div>
                            <div className="text-xs text-[#6B7C70]">Momentum to capture trending strength</div>
                          </div>
                        </div>
                        <div className="text-xs text-blue-600 font-semibold">ETF Recommended</div>
                      </div>
                    </summary>
                    <div className="px-4 pb-4 space-y-2">
                      <div className="text-xs text-[#6B7C70] mb-2">
                        <strong>Sub-Categories:</strong> Nifty Midcap Momentum 50, Nifty Smallcap Momentum 50
                      </div>
                      <div className="text-xs text-[#4A5D4E] bg-white p-3 rounded-lg">
                        <strong>Best Funds:</strong> Motilal Oswal Midcap Momentum ETF, ICICI Pru Momentum Index
                      </div>
                    </div>
                  </details>

                  {/* Role 5: Compounder */}
                  <details className="bg-[#F5F8FF] rounded-xl border border-[#DDE6F3]">
                    <summary className="cursor-pointer p-4 hover:bg-[#EEF4FA] transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">📈</span>
                          <div>
                            <div className="font-semibold text-[#1F2937]">Compounder</div>
                            <div className="text-xs text-[#6B7C70]">Active mid/small cap growth (Currently Skipped)</div>
                          </div>
                        </div>
                        <div className="text-xs text-red-600 font-semibold">Skipped</div>
                      </div>
                    </summary>
                    <div className="px-4 pb-4 space-y-2">
                      <div className="text-xs text-[#6B7C70] mb-2">
                        <strong>Sub-Categories:</strong> Mid Cap Active, Small Cap Active
                      </div>
                      <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                        ❌ <strong>Data says ETF:</strong> Mid Cap Alpha -1.17%, Small Cap Alpha -0.25%. Active managers underperforming.
                      </div>
                      <div className="text-xs text-[#4A5D4E] italic">
                        This role activates when active fund managers start beating benchmarks in mid/small cap space.
                      </div>
                    </div>
                  </details>

                  {/* Role 6: All-Rounder */}
                  <details className="bg-[#F5F8FF] rounded-xl border border-[#DDE6F3]">
                    <summary className="cursor-pointer p-4 hover:bg-[#EEF4FA] transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🌐</span>
                          <div>
                            <div className="font-semibold text-[#1F2937]">All-Rounder</div>
                            <div className="text-xs text-[#6B7C70]">Flexi-cap broad market coverage</div>
                          </div>
                        </div>
                        <div className="text-xs text-[#2F5D7C] font-semibold">Active/ETF Mix</div>
                      </div>
                    </summary>
                    <div className="px-4 pb-4 space-y-2">
                      <div className="text-xs text-[#6B7C70] mb-2">
                        <strong>Sub-Categories:</strong> Flexi Cap, Multi Cap, Nifty 500 Index
                      </div>
                      <div className="text-xs text-[#4A5D4E] bg-white p-3 rounded-lg">
                        <strong>Best Funds:</strong> Parag Parikh Flexi Cap, PGIM India Flexi Cap, Nifty 500 Index Fund
                      </div>
                    </div>
                  </details>

                  {/* Role 7: Stabilizer */}
                  <details className="bg-[#F5F8FF] rounded-xl border border-[#DDE6F3]">
                    <summary className="cursor-pointer p-4 hover:bg-[#EEF4FA] transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">⚖️</span>
                          <div>
                            <div className="font-semibold text-[#1F2937]">Stabilizer</div>
                            <div className="text-xs text-[#6B7C70]">Hybrid for medium-term balance (3-7 years)</div>
                          </div>
                        </div>
                        <div className="text-xs text-green-600 font-semibold">Active Recommended</div>
                      </div>
                    </summary>
                    <div className="px-4 pb-4 space-y-2">
                      <div className="text-xs text-[#6B7C70] mb-2">
                        <strong>Sub-Categories:</strong> Balanced Advantage, Multi-Asset Allocation
                      </div>
                      <div className="text-xs text-[#4A5D4E] bg-white p-3 rounded-lg">
                        <strong>Best Funds:</strong> ICICI Pru Balanced Advantage, HDFC Balanced Advantage, Quant Multi Asset
                      </div>
                      <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                        ✅ <strong>Data says Active:</strong> Avg Alpha 1.9%, Beat Rate 70%
                      </div>
                    </div>
                  </details>
                </div>

                <div className="p-3 bg-[#EEF4FA] rounded-xl text-xs text-[#4A5D4E]">
                  💡 <strong>Why 7 roles?</strong> Research shows diversification benefits plateau after 6-8 holdings. These 7 give full coverage without complexity.
                </div>
              </div>
            </details>

            {/* SECTION 3: Your Personalized Portfolio */}
            <details className={`${cardClass} p-6`} open>
              <summary className="cursor-pointer text-xl font-serif text-[#1F2937] mb-4 hover:text-[#2F5D7C]">
                🎨 Step 3: Your Personalized Portfolio (Based on Goals)
              </summary>

              <div className="space-y-4 pl-4">
                {results.overallAllocation.map((alloc, idx) => {
                  const roleKey = alloc.role || "allrounder";
                  const roleInfo = ROLE_CONFIG[roleKey as keyof typeof ROLE_CONFIG];

                  return (
                    <details key={idx} className="bg-[#F5F8FF] rounded-xl overflow-hidden border border-[#DDE6F3]">
                      <summary className="cursor-pointer p-4 hover:bg-[#EEF4FA] transition-colors">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{roleInfo.emoji}</span>
                            <div>
                              <div className="font-semibold text-[#1F2937]">{roleInfo.name}</div>
                              <div className="text-xs text-[#6B7C70]">
                                {alloc.isPassive ? "ETF/Index • Low Cost" : "Active Fund • High Alpha"}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-[#2F5D7C]">{formatNumber(alloc.percentage)}%</div>
                            <div className="text-xs text-[#6B7C70]">{formatCurrency(alloc.amount)}</div>
                          </div>
                        </div>
                      </summary>

                      <div className="px-4 pb-4 space-y-2">
                        {alloc.fundSuggestions.slice(0, 3).map((fund, fIdx) => (
                          <div key={fIdx} className="flex justify-between items-start p-3 bg-white rounded-lg">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-[#1F2937]">
                                {fund.name.length > 50 ? fund.name.substring(0, 47) + "..." : fund.name}
                              </div>
                              {fund.isETF && <span className="text-xs text-[#2F5D7C]">ETF</span>}
                            </div>
                            <div className="text-right ml-3">
                              {fund.returns3Y && (
                                <>
                                  <div className="text-sm font-semibold text-[#2F5D7C]">{formatNumber(fund.returns3Y)}%</div>
                                  <div className="text-xs text-[#6B7C70]">3Y</div>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  );
                })}
              </div>
            </details>

            {/* SECTION 4: Portfolio Evolution Timeline */}
            <details className={`${cardClass} p-6`} open>
              <summary className="cursor-pointer text-xl font-serif text-[#1F2937] mb-4 hover:text-[#2F5D7C]">
                🔄 Step 4: How Your Portfolio Evolves (Goal by Goal)
              </summary>

              <div className="space-y-6 pl-4">
                <p className="text-sm text-[#4A5D4E] leading-relaxed">
                  Your portfolio automatically shifts as each goal completes. Same ₹{(monthlySIPCapacity/1000).toFixed(0)}K/month, 
                  different allocations.
                </p>

                {/* Timeline */}
                <div className="space-y-8">
                  {results.portfolioPhases.map((phase, idx) => {
                    const isFirst = idx === 0;
                    const isLast = idx === results.portfolioPhases.length - 1;

                    // Calculate allocation for this phase
                    const phaseAlloc: Record<string, number> = {};
                    results.overallAllocation.forEach(alloc => {
                      if (alloc.role && phase.rolesActive.includes(alloc.role)) {
                        const cat = alloc.category === "Debt" ? "Debt" : 
                                   alloc.subCategory.includes("Momentum") ? "Momentum" : "Equity";
                        phaseAlloc[cat] = (phaseAlloc[cat] || 0) + alloc.percentage;
                      }
                    });

                    return (
                      <div key={idx} className="relative">
                        <div className="flex gap-4">
                          {/* Phase Number */}
                          <div className="flex-shrink-0">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                              isFirst ? "bg-[#2F5D7C]" : "bg-[#6B7C70]"
                            }`}>
                              {phase.phaseNumber}
                            </div>
                            {!isLast && (
                              <div className="w-0.5 h-16 bg-[#DDE6F3] mx-auto mt-2" />
                            )}
                          </div>

                          {/* Phase Content */}
                          <div className="flex-1 pb-4">
                            <div className={`p-4 rounded-xl border ${
                              isFirst ? "border-[#2F5D7C] bg-[#EEF4FA]" : "border-[#DDE6F3] bg-[#F5F8FF]"
                            }`}>
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <div className="font-semibold text-[#1F2937]">{phase.activeGoal}</div>
                                  <div className="text-xs text-[#6B7C70]">{phase.years}</div>
                                </div>
                                {isFirst && (
                                  <span className="px-2 py-1 bg-[#2F5D7C] text-white text-xs rounded-full font-semibold">
                                    Current
                                  </span>
                                )}
                              </div>

                              <p className="text-sm text-[#4A5D4E] mb-3">{phase.description}</p>

                              {/* Allocation Pills */}
                              <div className="flex flex-wrap gap-2 mb-2">
                                {Object.entries(phaseAlloc).map(([cat, pct]) => (
                                  <div key={cat} className="px-3 py-1 bg-white rounded-full text-xs">
                                    <span className="font-semibold text-[#2F5D7C]">{formatNumber(pct)}%</span>
                                    <span className="text-[#6B7C70] ml-1">{cat}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Active Roles */}
                              <div className="flex flex-wrap gap-1">
                                {phase.rolesActive.map(role => {
                                  const r = ROLE_CONFIG[role as keyof typeof ROLE_CONFIG];
                                  return (
                                    <span key={role} className="text-xs text-[#6B7C70]">
                                      {r.emoji}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Redirect Indicator */}
                            {!isLast && (
                              <div className="mt-3 ml-4 p-2 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-700">
                                → Portfolio shifts to {results.portfolioPhases[idx + 1].activeGoal} when this goal completes
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 bg-[#D5E8F0] rounded-xl text-xs text-[#1F2937]">
                  ✨ <strong>The Magic:</strong> You manage ONE portfolio. We automatically redirect your SIP as each goal completes. 
                  Zero manual work, zero money sitting idle.
                </div>
              </div>
            </details>

            {/* SECTION 5: Feasibility */}
            <div className={`${cardClass} p-6`}>
              <div className="flex items-start gap-3">
                <div className={`text-3xl ${
                  results.feasibilityStatus === "feasible" ? "text-green-600" :
                  results.feasibilityStatus === "challenging" ? "text-yellow-600" : "text-red-600"
                }`}>
                  {results.feasibilityStatus === "feasible" ? "✅" :
                   results.feasibilityStatus === "challenging" ? "⚠️" : "❌"}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-serif text-[#1F2937] mb-2">
                    {results.feasibilityStatus === "feasible" ? "Plan is Feasible!" :
                     results.feasibilityStatus === "challenging" ? "Challenging but Possible" : "Needs Adjustment"}
                  </h3>
                  <div className="space-y-1">
                    {results.recommendations.map((rec, idx) => (
                      <div key={idx} className="text-sm text-[#4A5D4E]">• {rec}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  setCurrentStep("input");
                  setResults(null);
                }}
                className="px-6 py-3 bg-white text-[#2F5D7C] border-2 border-[#2F5D7C] font-medium rounded-xl hover:bg-[#EAF1F8] transition-all"
              >
                Modify Plan
              </button>
              <button
                onClick={() => window.print()}
                className="px-6 py-3 bg-[#2F5D7C] text-white font-medium rounded-xl hover:bg-[#254B66] transition-all shadow-md"
              >
                Download Report
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-[#1F2937] text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[#C8D0D8] text-xs">
            Powered by the 4×4 Matrix Engine • Data from 2,006 schemes • Dynamic Portfolio Evolution
          </p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out; }
        @media print { .no-print { display: none; } }
      `}</style>
    </div>
  );
}