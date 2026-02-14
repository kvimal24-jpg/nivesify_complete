
// DEBUG-MARKER: HELLO-TEST-123
"use client";

import React, { useState } from "react";
import AnalysisTabs from "@/components/AnalysisTabs";
import {
  InvestmentGoalEngine,
  type UserInput,
  type EngineOutput,
  type Goal,
  type PortfolioPhase,
  type SubCategoryAllocation,
} from "@/lib/investment-goal-engine";

const GOAL_TEMPLATES = [
  { name: "Emergency Fund", type: "mandatory", targetAmount: 500000, years: 1, inflation: 6 },
  { name: "Andaman Trip", type: "aspirational", targetAmount: 500000, years: 2, inflation: 6 },
  { name: "Child Education", type: "mandatory", targetAmount: 2500000, years: 10, inflation: 8 },
  { name: "Retirement", type: "mandatory", targetAmount: 10000000, years: 25, inflation: 7 },
  { name: "Home Down Payment", type: "mandatory", targetAmount: 3000000, years: 5, inflation: 6 },
  { name: "Car Purchase", type: "aspirational", targetAmount: 800000, years: 3, inflation: 5 },
];

// Role definitions with emoji and colors
const ROLE_CONFIG = {
  anchor: { emoji: "🛡️", name: "Anchor", color: "#059669", description: "Safety & liquidity" },
  pillar: { emoji: "🏛️", name: "Pillar", color: "#2563eb", description: "Core stability" },
  contrarian: { emoji: "🎯", name: "Contrarian", color: "#dc2626", description: "Value hunter" },
  speedster: { emoji: "⚡", name: "Speedster", color: "#ea580c", description: "Momentum capture" },
  compounder: { emoji: "📈", name: "Compounder", color: "#7c3aed", description: "Growth multiplier" },
  allrounder: { emoji: "🌐", name: "All-Rounder", color: "#0891b2", description: "Broad coverage" },
  stabilizer: { emoji: "⚖️", name: "Stabilizer", color: "#65a30d", description: "Balanced approach" },
};

export default function InvestmentPlannerPage() {
  const [currentStep, setCurrentStep] = useState<"input" | "processing" | "results">("input");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [riskAppetite, setRiskAppetite] = useState<"conservative" | "moderate" | "aggressive">("moderate");
  const [stepUpPercentage, setStepUpPercentage] = useState(10);
  const [monthlySIPCapacity, setMonthlySIPCapacity] = useState(60000);
  const [incomeStability, setIncomeStability] = useState<"stable" | "variable" | "uncertain">("stable");
  const [results, setResults] = useState<EngineOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);
  const [activeResultTab, setActiveResultTab] = useState<"matrix" | "roles" | "evolution">("matrix");

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
      setActiveResultTab("matrix");
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

  // Calculate phase-wise allocation breakdown
  const getPhaseAllocation = (phase: PortfolioPhase, allAllocations: SubCategoryAllocation[]) => {
    const roleAllocations: Record<string, number> = {};
    
    allAllocations.forEach(alloc => {
      if (alloc.role && phase.rolesActive.includes(alloc.role)) {
        const category = alloc.category === "Debt" ? "Debt" : 
                        alloc.subCategory.includes("Momentum") ? "Momentum" :
                        "Equity";
        roleAllocations[category] = (roleAllocations[category] || 0) + alloc.percentage;
      }
    });

    return roleAllocations;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pt-20 pb-16 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="relative max-w-6xl mx-auto text-center space-y-6">
          <div className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-4">
            <span className="text-xs font-semibold text-white/90 tracking-[0.2em] uppercase">
              The 4×4 Matrix Engine
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
            Your Money's Evolution,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-300">
              Visualized & Automated
            </span>
          </h1>

          <p className="text-lg md:text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
            See exactly how your portfolio transforms as each goal completes. 
            One portfolio, automatic redirects, zero complexity.
          </p>

          {currentStep === "results" && (
            <button
              onClick={() => setCurrentStep("input")}
              className="mt-6 px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-xl border border-white/20 hover:bg-white/20 transition-all"
            >
              ← Back to Goals
            </button>
          )}
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <AnalysisTabs />

        {/* INPUT STEP */}
        {currentStep === "input" && (
          <div className="space-y-8 animate-fadeIn">
            {/* Quick Goal Templates */}
            {showTemplates && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">
                    Quick Start: Choose Your Goals
                  </h2>
                  <button
                    onClick={() => setShowTemplates(false)}
                    className="text-sm text-slate-500 hover:text-slate-700"
                  >
                    Hide templates
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {GOAL_TEMPLATES.map((template) => (
                    <button
                      key={template.name}
                      onClick={() => addGoal(template)}
                      className="group p-5 text-left rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all bg-gradient-to-br from-white to-slate-50"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-semibold text-slate-900 group-hover:text-blue-600">
                          {template.name}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          template.type === "mandatory" 
                            ? "bg-red-100 text-red-700" 
                            : "bg-green-100 text-green-700"
                        }`}>
                          {template.type}
                        </div>
                      </div>
                      <div className="text-sm text-slate-600 space-y-1">
                        <div>{formatCurrency(template.targetAmount)}</div>
                        <div className="text-xs">{template.years} years • {template.inflation}% inflation</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Added Goals */}
            {goals.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Your Goals ({goals.length})</h2>

                <div className="space-y-4">
                  {goals.map((goal, idx) => (
                    <div key={goal.id} className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border border-slate-200">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                            {idx + 1}
                          </div>
                          <input
                            type="text"
                            value={goal.name}
                            onChange={(e) => updateGoal(goal.id, "name", e.target.value)}
                            className="text-lg font-semibold bg-transparent border-b-2 border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none px-2 py-1"
                            placeholder="Goal name"
                          />
                        </div>
                        <button
                          onClick={() => removeGoal(goal.id)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-2">Target Amount</label>
                          <input
                            type="number"
                            value={goal.targetAmount}
                            onChange={(e) => updateGoal(goal.id, "targetAmount", Number(e.target.value))}
                            className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-2">Years to Goal</label>
                          <input
                            type="number"
                            value={goal.yearsToGoal}
                            onChange={(e) => updateGoal(goal.id, "yearsToGoal", Number(e.target.value))}
                            className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-2">Inflation %</label>
                          <input
                            type="number"
                            value={goal.inflationRate}
                            onChange={(e) => updateGoal(goal.id, "inflationRate", Number(e.target.value))}
                            className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-2">Type</label>
                          <select
                            value={goal.type}
                            onChange={(e) => updateGoal(goal.id, "type", e.target.value as "mandatory" | "aspirational")}
                            className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          >
                            <option value="mandatory">Mandatory</option>
                            <option value="aspirational">Aspirational</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => addGoal()}
                  className="mt-4 w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all font-medium"
                >
                  + Add Custom Goal
                </button>
              </div>
            )}

            {/* Investment Settings */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Investment Settings</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Monthly SIP Capacity: {formatCurrency(monthlySIPCapacity)}
                  </label>
                  <input
                    type="range"
                    min="5000"
                    max="200000"
                    step="5000"
                    value={monthlySIPCapacity}
                    onChange={(e) => setMonthlySIPCapacity(Number(e.target.value))}
                    className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-2">
                    <span>₹5,000</span>
                    <span>₹2,00,000</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Risk Appetite
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {(["conservative", "moderate", "aggressive"] as const).map((risk) => (
                      <button
                        key={risk}
                        onClick={() => setRiskAppetite(risk)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          riskAppetite === risk
                            ? "border-blue-600 bg-blue-50 shadow-lg"
                            : "border-slate-200 hover:border-blue-300"
                        }`}
                      >
                        <div className="font-semibold capitalize mb-1">{risk}</div>
                        <div className="text-xs text-slate-600">
                          {risk === "conservative" ? "Safety first" : 
                           risk === "moderate" ? "Balanced" : "Max growth"}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Annual Step-up: {stepUpPercentage}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="5"
                    value={stepUpPercentage}
                    onChange={(e) => setStepUpPercentage(Number(e.target.value))}
                    className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex justify-center">
              <button
                onClick={handleCalculate}
                disabled={loading || goals.length === 0}
                className="px-12 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-bold rounded-2xl hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
              >
                {loading ? "Calculating..." : "🚀 Generate My Investment Plan"}
              </button>
            </div>
          </div>
        )}

        {/* PROCESSING STEP */}
        {currentStep === "processing" && (
          <div className="flex flex-col items-center justify-center py-20 animate-fadeIn">
            <div className="relative w-24 h-24 mb-8">
              <div className="absolute inset-0 border-8 border-blue-200 rounded-full animate-ping" />
              <div className="absolute inset-0 border-8 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Analyzing Your Goals...</h2>
            <p className="text-slate-600">Building your personalized 4×4 matrix</p>
          </div>
        )}

        {/* RESULTS STEP */}
        {currentStep === "results" && results && (
          <div className="space-y-8 animate-fadeIn">
            {/* Tab Navigation */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-2">
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setActiveResultTab("matrix")}
                  className={`px-6 py-4 rounded-xl font-semibold transition-all ${
                    activeResultTab === "matrix"
                      ? "bg-blue-600 text-white shadow-lg"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  📊 Step 1: The 4×4 Matrix
                </button>
                <button
                  onClick={() => setActiveResultTab("roles")}
                  className={`px-6 py-4 rounded-xl font-semibold transition-all ${
                    activeResultTab === "roles"
                      ? "bg-blue-600 text-white shadow-lg"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  🎯 Step 2: Core-7 Roles
                </button>
                <button
                  onClick={() => setActiveResultTab("evolution")}
                  className={`px-6 py-4 rounded-xl font-semibold transition-all ${
                    activeResultTab === "evolution"
                      ? "bg-blue-600 text-white shadow-lg"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  🔄 Step 3: Evolution Map
                </button>
              </div>
            </div>

            {/* TAB 1: 4x4 MATRIX */}
            {activeResultTab === "matrix" && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
                  <h2 className="text-3xl font-bold mb-3">Step 1: Understanding the 4×4 Matrix</h2>
                  <p className="text-blue-100 text-lg leading-relaxed">
                    We spread your money across TWO dimensions: <strong>Size</strong> (Large, Mid, Small, Total Market) 
                    and <strong>Style</strong> (Value, Growth, Momentum). This ensures you're diversified against all market conditions.
                  </p>
                </div>

                {/* Matrix Visualization */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                  <h3 className="text-2xl font-bold text-slate-900 mb-6">Your Portfolio Matrix</h3>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-4 mb-6 p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-green-500" />
                      <span className="text-sm">Active Fund (High Alpha)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-blue-500" />
                      <span className="text-sm">ETF / Index (Low Cost)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-slate-200" />
                      <span className="text-sm">Not Used</span>
                    </div>
                  </div>

                  {/* Matrix Grid */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="p-4 text-left font-bold text-slate-700 border border-slate-300">
                            SIZE \ STYLE
                          </th>
                          <th className="p-4 text-center font-bold text-slate-700 border border-slate-300">
                            Value/Contra
                          </th>
                          <th className="p-4 text-center font-bold text-slate-700 border border-slate-300">
                            Core/Growth
                          </th>
                          <th className="p-4 text-center font-bold text-slate-700 border border-slate-300">
                            Momentum
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {["Large Cap", "Mid Cap", "Small Cap", "Total Market"].map((size) => (
                          <tr key={size}>
                            <td className="p-4 font-semibold bg-slate-50 border border-slate-300">
                              {size}
                            </td>
                            {["value", "growth", "momentum"].map((style) => {
                              const alloc = results.buckets
                                .flatMap(b => b.matrix)
                                .find(m => {
                                  const matchSize = 
                                    (size === "Large Cap" && m.capSize === "large") ||
                                    (size === "Mid Cap" && m.capSize === "mid") ||
                                    (size === "Small Cap" && m.capSize === "small") ||
                                    (size === "Total Market" && m.capSize === "total");
                                  const matchStyle = m.style === style;
                                  return matchSize && matchStyle;
                                });

                              const percentage = alloc?.percentage || 0;
                              const isActive = percentage > 0;

                              return (
                                <td
                                  key={`${size}-${style}`}
                                  className={`p-4 border border-slate-300 text-center ${
                                    !isActive
                                      ? "bg-slate-100"
                                      : percentage > 15
                                      ? "bg-green-100 border-green-400"
                                      : "bg-blue-100 border-blue-400"
                                  }`}
                                >
                                  {isActive ? (
                                    <div>
                                      <div className="text-2xl font-bold text-slate-900">
                                        {formatNumber(percentage)}%
                                      </div>
                                      <div className="text-xs text-slate-600 mt-1">
                                        {percentage > 15 ? "Active" : "ETF"}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-slate-400">—</div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">💡</div>
                      <div className="text-sm text-slate-700">
                        <strong>Why this matters:</strong> If "Growth" stocks underperform, your "Value" holdings protect you. 
                        If "Large Caps" lag, your "Mid/Small Caps" pick up the slack. This is true diversification.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Debt Allocation (if any) */}
                {results.buckets.some(b => b.matrix.some(m => m.capSize === "debt")) && (
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">Debt Allocation (Safety Layer)</h3>
                    
                    {results.buckets.filter(b => b.matrix.some(m => m.capSize === "debt")).map(bucket => {
                      const debtAlloc = bucket.matrix.find(m => m.capSize === "debt");
                      return debtAlloc ? (
                        <div key={bucket.name} className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-slate-900">
                                {bucket.name.charAt(0).toUpperCase() + bucket.name.slice(1)} Term Goals
                              </div>
                              <div className="text-sm text-slate-600 mt-1">
                                Protecting your near-term corpus from market volatility
                              </div>
                            </div>
                            <div className="text-3xl font-bold text-emerald-700">
                              {formatNumber(debtAlloc.percentage)}%
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CORE-7 ROLES */}
            {activeResultTab === "roles" && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
                  <h2 className="text-3xl font-bold mb-3">Step 2: The Core-7 Portfolio Roles</h2>
                  <p className="text-indigo-100 text-lg leading-relaxed">
                    Instead of overwhelming you with 16 positions, we consolidate into 7 functional roles. 
                    Each role has a specific job in your portfolio—just like players on a sports team.
                  </p>
                </div>

                {/* Role Cards */}
                <div className="grid grid-cols-1 gap-6">
                  {results.overallAllocation.map((alloc, idx) => {
                    const roleKey = alloc.role || "allrounder";
                    const roleInfo = ROLE_CONFIG[roleKey as keyof typeof ROLE_CONFIG];

                    return (
                      <div key={idx} className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden hover:shadow-2xl transition-all">
                        {/* Role Header */}
                        <div 
                          className="p-6"
                          style={{
                            background: `linear-gradient(135deg, ${roleInfo.color}15 0%, ${roleInfo.color}05 100%)`
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div 
                                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
                                style={{ backgroundColor: `${roleInfo.color}20` }}
                              >
                                {roleInfo.emoji}
                              </div>
                              <div>
                                <h3 className="text-2xl font-bold" style={{ color: roleInfo.color }}>
                                  {roleInfo.name}
                                </h3>
                                <p className="text-slate-600 text-sm mt-1">
                                  {alloc.roleDescription || roleInfo.description}
                                </p>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-4xl font-bold" style={{ color: roleInfo.color }}>
                                {formatNumber(alloc.percentage)}%
                              </div>
                              <div className="text-sm text-slate-600 mt-1">
                                {formatCurrency(alloc.amount)}
                              </div>
                            </div>
                          </div>

                          {/* Active vs ETF Badge */}
                          <div className="mt-4">
                            <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                              alloc.isPassive
                                ? "bg-blue-100 text-blue-700"
                                : "bg-green-100 text-green-700"
                            }`}>
                              {alloc.isPassive 
                                ? "📉 ETF / Index (Low Cost)" 
                                : "📈 Active Fund (High Alpha)"}
                            </div>
                          </div>
                        </div>

                        {/* Fund Recommendations */}
                        <div className="p-6 bg-slate-50">
                          <div className="text-sm font-semibold text-slate-700 mb-4">
                            Top Fund Recommendations:
                          </div>

                          <div className="space-y-3">
                            {alloc.fundSuggestions.slice(0, 3).map((fund, fIdx) => (
                              <div key={fIdx} className="flex items-start justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-400 transition-all">
                                <div className="flex-1">
                                  <div className="font-medium text-slate-900 mb-1">
                                    {fIdx + 1}. {fund.name}
                                  </div>
                                  {fund.isETF && (
                                    <div className="inline-block px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">
                                      ETF
                                    </div>
                                  )}
                                </div>

                                <div className="text-right ml-4">
                                  {fund.returns3Y && (
                                    <>
                                      <div className="text-lg font-bold text-green-600">
                                        {formatNumber(fund.returns3Y)}%
                                      </div>
                                      <div className="text-xs text-slate-500">3Y Returns</div>
                                    </>
                                  )}
                                  {fund.alpha3Y && fund.alpha3Y > 0 && (
                                    <div className="text-xs text-green-600 font-semibold mt-1">
                                      Alpha: +{formatNumber(fund.alpha3Y)}%
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">🎯</div>
                    <div className="text-sm text-slate-700">
                      <strong>Why 7 roles?</strong> Research shows diversification benefits plateau after 6-8 holdings. 
                      These 7 roles give you full market coverage without overwhelming complexity.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: EVOLUTION MAP */}
            {activeResultTab === "evolution" && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-xl p-8 text-white">
                  <h2 className="text-3xl font-bold mb-3">Step 3: Your Portfolio's Evolution</h2>
                  <p className="text-purple-100 text-lg leading-relaxed">
                    Watch how your portfolio automatically transforms as each goal completes. 
                    This is the "relay race" concept—same ₹{(monthlySIPCapacity/1000).toFixed(0)}K/month, different destinations.
                  </p>
                </div>

                {/* Evolution Timeline */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                  <h3 className="text-2xl font-bold text-slate-900 mb-8">The Journey Map</h3>

                  <div className="space-y-12">
                    {results.portfolioPhases.map((phase, idx) => {
                      const allocation = getPhaseAllocation(phase, results.overallAllocation);
                      const isFirst = idx === 0;
                      const isLast = idx === results.portfolioPhases.length - 1;

                      return (
                        <div key={idx} className="relative">
                          {/* Phase Card */}
                          <div className="flex gap-6">
                            {/* Timeline Marker */}
                            <div className="flex flex-col items-center">
                              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-xl ${
                                isFirst ? "bg-blue-600" : 
                                isLast ? "bg-purple-600" : 
                                "bg-indigo-600"
                              }`}>
                                {phase.phaseNumber}
                              </div>

                              {!isLast && (
                                <div className="flex-1 w-1 bg-gradient-to-b from-slate-300 to-slate-100 mt-4" style={{ minHeight: "120px" }} />
                              )}
                            </div>

                            {/* Phase Content */}
                            <div className="flex-1 pb-8">
                              <div className={`p-6 rounded-2xl border-2 ${
                                isFirst ? "border-blue-300 bg-blue-50" :
                                isLast ? "border-purple-300 bg-purple-50" :
                                "border-indigo-300 bg-indigo-50"
                              }`}>
                                <div className="flex items-start justify-between mb-4">
                                  <div>
                                    <h4 className="text-xl font-bold text-slate-900 mb-1">
                                      {phase.activeGoal}
                                    </h4>
                                    <div className="text-sm text-slate-600">
                                      {phase.years}
                                    </div>
                                  </div>

                                  {isFirst && (
                                    <div className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                                      CURRENT
                                    </div>
                                  )}
                                </div>

                                <p className="text-slate-700 mb-4">
                                  {phase.description}
                                </p>

                                {/* Allocation Breakdown */}
                                <div className="space-y-2 mb-4">
                                  <div className="text-sm font-semibold text-slate-700">Portfolio Mix:</div>
                                  <div className="grid grid-cols-3 gap-2">
                                    {Object.entries(allocation).map(([category, pct]) => (
                                      <div key={category} className="p-3 bg-white rounded-lg border border-slate-200">
                                        <div className="text-xs text-slate-600">{category}</div>
                                        <div className="text-lg font-bold text-slate-900">
                                          {formatNumber(pct)}%
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Active Roles */}
                                <div className="flex flex-wrap gap-2">
                                  {phase.rolesActive.map((role) => {
                                    const roleInfo = ROLE_CONFIG[role as keyof typeof ROLE_CONFIG];
                                    return (
                                      <div
                                        key={role}
                                        className="px-3 py-1 rounded-full text-xs font-semibold"
                                        style={{
                                          backgroundColor: `${roleInfo.color}15`,
                                          color: roleInfo.color
                                        }}
                                      >
                                        {roleInfo.emoji} {roleInfo.name}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Redirect Arrow */}
                              {!isLast && (
                                <div className="mt-6 ml-6 p-4 bg-orange-50 border-2 border-orange-300 rounded-xl">
                                  <div className="flex items-center gap-3">
                                    <div className="text-2xl">🔄</div>
                                    <div>
                                      <div className="font-bold text-orange-700">Auto-Redirect Trigger</div>
                                      <div className="text-sm text-orange-600">
                                        When {phase.activeGoal} completes, your ₹{(monthlySIPCapacity/1000).toFixed(0)}K/month 
                                        automatically shifts to {results.portfolioPhases[idx + 1].activeGoal}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Key Insight Box */}
                <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl shadow-xl p-8 text-white">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">✨</div>
                    <div>
                      <h3 className="text-2xl font-bold mb-3">The Magic of Auto-Evolution</h3>
                      <div className="space-y-2 text-green-50">
                        <p>✓ <strong>No manual rebalancing:</strong> Portfolio adjusts automatically</p>
                        <p>✓ <strong>No money sitting idle:</strong> SIP keeps flowing to the next goal</p>
                        <p>✓ <strong>No complexity:</strong> You manage ONE portfolio, not {results.portfolioPhases.length}</p>
                        <p>✓ <strong>30-day notice:</strong> We alert you before each redirect</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Feasibility & Action Buttons */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className={`text-4xl ${
                  results.feasibilityStatus === "feasible" ? "text-green-500" :
                  results.feasibilityStatus === "challenging" ? "text-yellow-500" :
                  "text-red-500"
                }`}>
                  {results.feasibilityStatus === "feasible" ? "✅" :
                   results.feasibilityStatus === "challenging" ? "⚠️" : "❌"}
                </div>

                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">
                    Plan Status: {
                      results.feasibilityStatus === "feasible" ? "Fully Feasible!" :
                      results.feasibilityStatus === "challenging" ? "Challenging but Achievable" :
                      "Needs Adjustment"
                    }
                  </h3>

                  <div className="space-y-2">
                    {results.recommendations.map((rec, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-slate-700">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 justify-center pt-6 border-t border-slate-200">
                <button
                  onClick={() => {
                    setCurrentStep("input");
                    setResults(null);
                  }}
                  className="px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all"
                >
                  ← Modify My Plan
                </button>

                <button
                  onClick={() => window.print()}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-all"
                >
                  📄 Download Report
                </button>

                <button
                  className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-emerald-700 shadow-lg transition-all"
                >
                  🚀 Execute Plan
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out; }

        @media print {
          .no-print { display: none; }
        }
      `}</style>
    </div>
  );
}