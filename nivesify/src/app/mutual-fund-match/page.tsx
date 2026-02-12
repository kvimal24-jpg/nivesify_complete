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
  { name: "Child Education", type: "mandatory", targetAmount: 2000000, years: 15, inflation: 8 },
  { name: "Retirement", type: "mandatory", targetAmount: 10000000, years: 25, inflation: 7 },
  { name: "Home Down Payment", type: "mandatory", targetAmount: 3000000, years: 5, inflation: 6 },
  { name: "Car Purchase", type: "aspirational", targetAmount: 1500000, years: 3, inflation: 5 },
  { name: "Dream Vacation", type: "aspirational", targetAmount: 500000, years: 2, inflation: 6 },
  { name: "Wedding", type: "aspirational", targetAmount: 2000000, years: 4, inflation: 7 },
  { name: "Home Renovation", type: "aspirational", targetAmount: 1000000, years: 3, inflation: 6 },
];

export default function MutualFundMatchPage() {
  const [currentStep, setCurrentStep] = useState<"input" | "processing" | "results">("input");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [riskAppetite, setRiskAppetite] = useState<"conservative" | "moderate" | "aggressive">(
    "moderate"
  );
  const [stepUpPercentage, setStepUpPercentage] = useState(10);
  const [monthlySIPCapacity, setMonthlySIPCapacity] = useState(10000);
  const [incomeStability, setIncomeStability] = useState<"stable" | "variable" | "uncertain">(
    "stable"
  );
  const [results, setResults] = useState<EngineOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);

  const addGoal = (template?: (typeof GOAL_TEMPLATES)[0]) => {
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
    // Keep templates visible so user can add multiple goals
    // User can click "Done selecting" to hide templates
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

      console.log("Input to engine:", input);
      const output = await engine.execute(input);
      console.log("Engine output:", output);
      setResults(output);
      setCurrentStep("results");
    } catch (error) {
      console.error("Calculation error:", error);
      console.error("Error details:", error instanceof Error ? error.message : String(error));
      console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
      alert(`An error occurred while calculating your plan: ${error instanceof Error ? error.message : String(error)}`);
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

  const cardClass =
    "bg-white rounded-[28px] border border-[#E6E8E1] shadow-[0_18px_40px_-30px_rgba(0,0,0,0.35)]";

  return (
    <div className="min-h-screen bg-[#F5F8FF] text-[#1F2937]">
      <section className="relative overflow-hidden px-6 pt-16 pb-10">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-[520px] h-[520px] bg-[#2F5D7C]/10 rounded-full blur-[160px]" />
          <div className="absolute bottom-1/3 right-1/4 w-[420px] h-[420px] bg-[#9BB4D6]/20 rounded-full blur-[140px]" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center space-y-4">
          <p className="text-[11px] uppercase tracking-[0.32em] text-[#6B7C70] font-serif">
            goal-based mutual fund planning
          </p>
          <h1 className="text-3xl md:text-5xl font-serif tracking-tight leading-[1.1]">
            Goal-Based Investment Planner
          </h1>
          <p className="text-sm md:text-lg font-serif italic text-[#6B7C70]">
            Plan your financial goals with precision. Get personalized fund recommendations and SIP strategies.
          </p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-6 pb-16">
        <div className="flex flex-col gap-4 pb-8">
          <AnalysisTabs />
          <div className={`${cardClass} p-6 md:p-8`}>
            <div className="flex flex-col gap-2">
              <h2 className="text-xl md:text-2xl font-serif text-[#1F2937]">
                Start with your goals, not fund names.
              </h2>
              <p className="text-sm text-[#4A5D4E]">
                Add goals, choose your risk comfort, and get a goal-aligned SIP split across active and index funds.
              </p>
            </div>
          </div>
        </div>

        {currentStep === "input" && (
          <div className="space-y-8 animate-fadeIn">
            <div className={`${cardClass} p-6 md:p-8`}>
              <h2 className="text-xl md:text-2xl font-serif text-[#1F2937] mb-6">
                Your investment profile
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-[#4A5D4E] mb-3 uppercase tracking-[0.2em]">
                    Risk appetite
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {["conservative", "moderate", "aggressive"].map((risk) => (
                      <button
                        key={risk}
                        onClick={() => setRiskAppetite(risk as "conservative" | "moderate" | "aggressive")}
                        className={`p-5 rounded-2xl border transition-all duration-300 text-left ${
                          riskAppetite === risk
                            ? "border-[#2F5D7C] bg-[#EEF4FA] shadow-sm"
                            : "border-[#E6E8E1] hover:border-[#9BB4D6]"
                        }`}
                      >
                        <div className="font-serif text-base capitalize mb-1 text-[#1F2937]">
                          {risk}
                        </div>
                        <div className="text-xs text-[#6B7C70]">
                          {risk === "conservative"
                            ? "Lower risk, steadier returns"
                            : risk === "moderate"
                              ? "Balanced risk and reward"
                              : "Higher risk, growth focus"}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4A5D4E] mb-3 uppercase tracking-[0.2em]">
                    Annual SIP step-up: {stepUpPercentage}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={stepUpPercentage}
                    onChange={(e) => setStepUpPercentage(Number(e.target.value))}
                    className="w-full h-2 bg-[#D9E4F2] rounded-full appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-[#6B7C70] mt-2">
                    <span>0%</span>
                    <span>10%</span>
                    <span>20%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4A5D4E] mb-3 uppercase tracking-[0.2em]">
                    Monthly SIP capacity: ₹{monthlySIPCapacity.toLocaleString("en-IN")}
                  </label>
                  <input
                    type="range"
                    min="1000"
                    max="100000"
                    step="1000"
                    value={monthlySIPCapacity}
                    onChange={(e) => setMonthlySIPCapacity(Number(e.target.value))}
                    className="w-full h-2 bg-[#D9E4F2] rounded-full appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-[#6B7C70] mt-2">
                    <span>₹1,000</span>
                    <span>₹50,000</span>
                    <span>₹1,00,000</span>
                  </div>
                  <p className="text-xs text-[#6B7C70] mt-2 italic">How much can you invest monthly?</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4A5D4E] mb-3 uppercase tracking-[0.2em]">
                    Income stability
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { value: "stable", label: "Stable", desc: "Salaried, fixed income" },
                      { value: "variable", label: "Variable", desc: "Commission, bonuses" },
                      { value: "uncertain", label: "Uncertain", desc: "Business, freelance" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() =>
                          setIncomeStability(option.value as "stable" | "variable" | "uncertain")
                        }
                        className={`p-4 rounded-2xl border transition-all duration-300 text-left ${
                          incomeStability === option.value
                            ? "border-[#2F5D7C] bg-[#EEF4FA] shadow-sm"
                            : "border-[#E6E8E1] hover:border-[#9BB4D6]"
                        }`}
                      >
                        <div className="font-serif text-base mb-1 text-[#1F2937]">
                          {option.label}
                        </div>
                        <div className="text-xs text-[#6B7C70]">{option.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {showTemplates && (
              <div className={`${cardClass} p-6 md:p-8`}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <h2 className="text-xl md:text-2xl font-serif text-[#1F2937]">
                    Choose your goals
                  </h2>
                  {goals.length > 0 && (
                    <button
                      onClick={() => setShowTemplates(false)}
                      className="px-4 py-2 bg-white border-2 border-[#2F5D7C] text-[#2F5D7C] rounded-xl hover:bg-[#F5F8FF] transition-colors"
                    >
                      Done selecting
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {GOAL_TEMPLATES.map((template, idx) => (
                    <button
                      key={idx}
                      onClick={() => addGoal(template)}
                      className="p-4 rounded-2xl border border-[#E6E8E1] hover:border-[#9BB4D6] hover:shadow-sm transition-all text-left"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span
                          className={`text-[11px] px-2 py-1 rounded-full uppercase tracking-[0.2em] ${
                            template.type === "mandatory"
                              ? "bg-[#F5ECE6] text-[#8B3A3A]"
                              : "bg-[#EAF1F8] text-[#2F5D7C]"
                          }`}
                        >
                          {template.type}
                        </span>
                      </div>
                      <div className="font-serif text-sm text-[#1F2937] mb-2">
                        {template.name}
                      </div>
                      <div className="text-xs text-[#6B7C70]">
                        {formatCurrency(template.targetAmount)}
                      </div>
                      <div className="text-[11px] text-[#6B7C70] mt-1">
                        {template.years} years
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {goals.length > 0 && (
              <div className={`${cardClass} p-6 md:p-8`}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <h2 className="text-xl md:text-2xl font-serif text-[#1F2937]">
                    Your goals ({goals.length})
                  </h2>
                  <button
                    onClick={() => setShowTemplates(true)}
                    className="px-4 py-2 bg-[#2F5D7C] text-white rounded-xl hover:bg-[#254B66] transition-colors"
                  >
                    Add goal
                  </button>
                </div>

                <div className="space-y-4">
                  {goals.map((goal) => (
                    <div
                      key={goal.id}
                      className="p-4 rounded-2xl border border-[#E6E8E1] hover:border-[#9BB4D6] transition-all"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                        <div className="md:col-span-2">
                          <label className="text-[11px] uppercase tracking-[0.2em] text-[#6B7C70] mb-1 block">
                            Goal name
                          </label>
                          <input
                            type="text"
                            value={goal.name}
                            onChange={(e) => updateGoal(goal.id, "name", e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-[#D9E4F2] focus:border-[#9BB4D6] focus:ring-2 focus:ring-[#EAF1F8] outline-none transition-all"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] uppercase tracking-[0.2em] text-[#6B7C70] mb-1 block">
                            Type
                          </label>
                          <select
                            value={goal.type}
                            onChange={(e) => updateGoal(goal.id, "type", e.target.value as Goal["type"])}
                            className="w-full px-3 py-2 rounded-xl border border-[#D9E4F2] focus:border-[#9BB4D6] focus:ring-2 focus:ring-[#EAF1F8] outline-none transition-all"
                          >
                            <option value="mandatory">Mandatory</option>
                            <option value="aspirational">Aspirational</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] uppercase tracking-[0.2em] text-[#6B7C70] mb-1 block">
                            Current amount
                          </label>
                          <input
                            type="number"
                            value={goal.currentAmount}
                            onChange={(e) => updateGoal(goal.id, "currentAmount", Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-xl border border-[#D9E4F2] focus:border-[#9BB4D6] focus:ring-2 focus:ring-[#EAF1F8] outline-none transition-all"
                            placeholder="0"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] uppercase tracking-[0.2em] text-[#6B7C70] mb-1 block">
                            Target amount
                          </label>
                          <input
                            type="number"
                            value={goal.targetAmount}
                            onChange={(e) => updateGoal(goal.id, "targetAmount", Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-xl border border-[#D9E4F2] focus:border-[#9BB4D6] focus:ring-2 focus:ring-[#EAF1F8] outline-none transition-all"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] uppercase tracking-[0.2em] text-[#6B7C70] mb-1 block">
                            Years
                          </label>
                          <input
                            type="number"
                            value={goal.yearsToGoal}
                            onChange={(e) => updateGoal(goal.id, "yearsToGoal", Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-xl border border-[#D9E4F2] focus:border-[#9BB4D6] focus:ring-2 focus:ring-[#EAF1F8] outline-none transition-all"
                          />
                        </div>

                        <div className="flex items-end">
                          <button
                            onClick={() => removeGoal(goal.id)}
                            className="w-full px-4 py-2 bg-[#F5ECE6] text-[#8B3A3A] rounded-xl hover:bg-[#F2E1D8] transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {goals.length > 0 && (
              <div className="flex justify-center">
                <button
                  onClick={handleCalculate}
                  disabled={loading}
                  className={`px-10 py-4 text-sm md:text-base font-semibold rounded-2xl transition-all shadow-md ${
                    loading
                      ? "bg-[#9BB4D6] text-white cursor-not-allowed"
                      : "bg-[#2F5D7C] text-white hover:bg-[#254B66]"
                  }`}
                >
                  {loading ? "Building your plan..." : "Create my investment plan"}
                </button>
              </div>
            )}
          </div>
        )}

        {currentStep === "processing" && (
          <div className="flex flex-col items-center justify-center py-20 animate-fadeIn">
            <div className="w-16 h-16 border-4 border-[#2F5D7C] border-t-transparent rounded-full animate-spin mb-6" />
            <h2 className="text-xl font-serif text-[#1F2937] mb-2">Analyzing your goals</h2>
            <p className="text-sm text-[#6B7C70]">
              Processing market data and building your allocation map.
            </p>
          </div>
        )}

        {currentStep === "results" && results && (
          <div className="space-y-6 animate-fadeIn">
            {/* Feasibility Status */}
            <div
              className={`rounded-[28px] border p-6 ${
                results.feasibilityStatus === "feasible"
                  ? "bg-[#F2F6F0] border-[#C6D3C0]"
                  : results.feasibilityStatus === "challenging"
                    ? "bg-[#FBF4E8] border-[#E7CBA1]"
                    : "bg-[#F7ECEA] border-[#E2B6AF]"
              }`}
            >
              <h2 className="text-xl font-serif text-[#1F2937] mb-3 capitalize">
                {results.feasibilityStatus.replace("_", " ")} Plan
              </h2>
              <div className="space-y-1.5">
                {results.recommendations.map((rec, idx) => (
                  <div key={idx} className="text-sm text-[#4A5D4E]">
                    • {rec}
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly SIP Requirement */}
            <div className="rounded-[28px] border border-[#2F5D7C]/20 bg-[#2F5D7C] text-white p-6 shadow-xl">
              <div className="text-center">
                <p className="text-xs uppercase tracking-widest text-[#DDE7F2] mb-1">
                  Required Monthly SIP
                </p>
                <h1 className="text-4xl md:text-5xl font-serif font-bold mb-1">
                  {formatCurrency(results.sipSchedule.currentSIP)}
                </h1>
                <p className="text-xs text-[#DDE7F2]">
                  with {stepUpPercentage}% annual step-up
                </p>
              </div>
            </div>

            {/* Portfolio Allocation - ONE Consolidated Matrix */}
            <div className={`${cardClass} p-6`}>
              <h2 className="text-lg font-serif text-[#1F2937] mb-4">Your Portfolio Mix</h2>
              
              {/* Top allocations as simple bars */}
              <div className="space-y-3 mb-6">
                {results.overallAllocation.slice(0, 6).map((alloc, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#1F2937]">{alloc.subCategory}</span>
                        {alloc.isPassive && (
                          <span className="text-[10px] bg-[#EAF1F8] text-[#2F5D7C] px-2 py-0.5 rounded-full">
                            Index
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-[#2F5D7C]">
                        {formatNumber(alloc.percentage)}%
                      </span>
                    </div>
                    <div className="w-full bg-[#EAF1F8] rounded-full h-2">
                      <div
                        className="h-full bg-[#2F5D7C] rounded-full"
                        style={{ width: `${alloc.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Collapsible detailed matrix */}
              <details className="mt-4">
                <summary className="cursor-pointer text-xs text-[#2F5D7C] hover:underline">
                  View detailed allocation matrix
                </summary>
                <div className="mt-4 overflow-x-auto">
                  <div className="grid grid-cols-3 gap-2 min-w-[280px]">
                    {["growth", "value", "momentum"].map((style) => {
                      const styleCells = results.overallAllocation.filter((a) =>
                        a.subCategory.toLowerCase().includes(style === "value" ? "value" : "")
                      );
                      return (
                        <div key={style} className="space-y-2">
                          <div className="text-[10px] font-semibold text-[#6B7C70] text-center capitalize">
                            {style}
                          </div>
                          {["large", "mid", "small"].map((cap) => {
                            const capName = cap === "large" ? "Large Cap" : cap === "mid" ? "Mid Cap" : "Small Cap";
                            const alloc = results.overallAllocation.find((a) => a.subCategory === capName);
                            const percentage = style === "growth" ? (alloc?.percentage || 0) : 0;
                            return (
                              <div
                                key={`${cap}-${style}`}
                                className={`p-2 rounded-lg text-center ${
                                  percentage > 0
                                    ? "bg-[#2F5D7C] text-white"
                                    : "bg-[#EEF4FA] text-[#6B7C70]"
                                }`}
                              >
                                <div className="text-[10px] capitalize">{cap}</div>
                                <div className="text-sm font-semibold">
                                  {percentage > 0 ? `${formatNumber(percentage)}%` : "-"}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </details>
            </div>

            {/* Recommended Funds - Final List */}
            <div className={`${cardClass} p-6`}>
              <h2 className="text-lg font-serif text-[#1F2937] mb-4">Recommended Funds</h2>
              
              <div className="space-y-2">
                {results.overallAllocation.map((alloc, idx) => (
                  <details key={idx} className="bg-[#F5F8FF] rounded-xl overflow-hidden">
                    <summary className="cursor-pointer p-4 hover:bg-[#EEF4FA] transition-colors">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[#1F2937]">
                            {alloc.subCategory}
                          </span>
                          {alloc.isPassive && (
                            <span className="text-[10px] bg-[#EAF1F8] text-[#2F5D7C] px-2 py-0.5 rounded-full">
                              Index
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-[#2F5D7C]">
                            {formatNumber(alloc.percentage)}%
                          </div>
                          <div className="text-[10px] text-[#6B7C70]">
                            {alloc.fundSuggestions.length} {alloc.fundSuggestions.length === 1 ? "fund" : "funds"}
                          </div>
                        </div>
                      </div>
                    </summary>
                    
                    <div className="px-4 pb-4 space-y-2">
                      {alloc.fundSuggestions.map((fund, fIdx) => {
                        // Determine investment duration based on buckets
                        const bucketsWithThisSub = results.buckets.filter((b) =>
                          b.subCategoryAllocations.some((sa) => sa.subCategory === alloc.subCategory)
                        );
                        const maxYears = Math.max(
                          ...bucketsWithThisSub.flatMap((b) => b.goals.map((g) => g.yearsToGoal)),
                          0
                        );

                        return (
                          <div key={fIdx} className="flex justify-between items-start p-3 bg-white rounded-lg">
                            <div className="flex-1 pr-2">
                              <div className="text-sm font-medium text-[#1F2937] leading-tight">
                                {fund.name.length > 50 ? fund.name.substring(0, 47) + "..." : fund.name}
                              </div>
                              {fund.isETF && (
                                <div className="text-[10px] text-[#2F5D7C] mt-0.5">ETF</div>
                              )}
                              {maxYears > 0 && (
                                <div className="text-[10px] text-[#6B7C70] mt-0.5">
                                  Invest for {maxYears} {maxYears === 1 ? "year" : "years"}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              {fund.returns5Y != null && fund.returns5Y > 0 && (
                                <div className="text-xs font-semibold text-[#2F5D7C]">
                                  {formatNumber(fund.returns5Y)}%
                                </div>
                              )}
                              {fund.returns5Y && (
                                <div className="text-[10px] text-[#6B7C70]">5Y return</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </details>
                ))}
              </div>
            </div>

            {/* Goal Summary - Collapsible */}
            <details className={`${cardClass} p-6`}>
              <summary className="cursor-pointer text-lg font-serif text-[#1F2937] hover:text-[#2F5D7C]">
                Your Goals Summary →
              </summary>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {goals.map((goal, idx) => {
                  const goalAlloc = results.goalAllocations.find((ga) => ga.goalId === goal.id);
                  return (
                    <div key={idx} className="p-4 bg-[#F5F8FF] rounded-xl">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-[#1F2937]">{goal.name}</div>
                          <div className="text-xs text-[#6B7C70]">{goal.yearsToGoal} years</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-[#2F5D7C]">
                            {formatCurrency(goalAlloc?.inflatedAmount || 0)}
                          </div>
                          <div className="text-[10px] text-[#6B7C70]">required</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </details>

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
            Data updated regularly from AMFI. Past performance does not indicate future results.
          </p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }

        @media print {
          .no-print {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
