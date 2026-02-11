'use client';

import React, { useState, useEffect } from 'react';
import { InvestmentGoalEngine, type UserInput, type EngineOutput, type Goal } from './investmentGoalEngine';

// Preset goal templates
const GOAL_TEMPLATES = [
  { name: 'Emergency Fund', type: 'mandatory', targetAmount: 500000, years: 1, inflation: 6 },
  { name: 'Child Education', type: 'mandatory', targetAmount: 2000000, years: 15, inflation: 8 },
  { name: 'Retirement', type: 'mandatory', targetAmount: 10000000, years: 25, inflation: 7 },
  { name: 'Home Down Payment', type: 'mandatory', targetAmount: 3000000, years: 5, inflation: 6 },
  { name: 'Car Purchase', type: 'aspirational', targetAmount: 1500000, years: 3, inflation: 5 },
  { name: 'Dream Vacation', type: 'aspirational', targetAmount: 500000, years: 2, inflation: 6 },
  { name: 'Wedding', type: 'aspirational', targetAmount: 2000000, years: 4, inflation: 7 },
  { name: 'Home Renovation', type: 'aspirational', targetAmount: 1000000, years: 3, inflation: 6 }
];

export default function InvestmentGoalPlanner() {
  const [currentStep, setCurrentStep] = useState<'input' | 'processing' | 'results'>('input');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [riskAppetite, setRiskAppetite] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');
  const [stepUpPercentage, setStepUpPercentage] = useState(10);
  const [results, setResults] = useState<EngineOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);

  const addGoal = (template?: typeof GOAL_TEMPLATES[0]) => {
    const newGoal: Goal = {
      id: `goal-${Date.now()}`,
      name: template?.name || 'New Goal',
      type: template?.type as 'mandatory' | 'aspirational' || 'mandatory',
      currentAmount: 0,
      targetAmount: template?.targetAmount || 100000,
      yearsToGoal: template?.years || 5,
      inflationRate: template?.inflation || 6
    };
    setGoals([...goals, newGoal]);
    setShowTemplates(false);
  };

  const updateGoal = (id: string, field: keyof Goal, value: any) => {
    setGoals(goals.map(g => g.id === id ? { ...g, [field]: value } : g));
  };

  const removeGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  const handleCalculate = async () => {
    if (goals.length === 0) {
      alert('Please add at least one goal');
      return;
    }

    setLoading(true);
    setCurrentStep('processing');

    try {
      const engine = new InvestmentGoalEngine();
      const input: UserInput = {
        goals,
        stepUpPercentage,
        riskAppetite
      };

      const output = await engine.execute(input);
      setResults(output);
      setCurrentStep('results');
    } catch (error) {
      console.error('Calculation error:', error);
      alert('An error occurred while calculating your plan. Please try again.');
      setCurrentStep('input');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number, decimals: number = 1) => {
    return num.toFixed(decimals);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-16 px-4 shadow-2xl">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
            Your Financial Journey
          </h1>
          <p className="text-lg md:text-xl text-indigo-100 max-w-2xl mx-auto">
            Intelligent goal-based investing powered by real-time market data
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {currentStep === 'input' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Risk Appetite Selection */}
            <div className="bg-white rounded-3xl shadow-lg p-6 md:p-8 border border-gray-100">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                Your Investment Profile
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Risk Appetite
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['conservative', 'moderate', 'aggressive'].map((risk) => (
                      <button
                        key={risk}
                        onClick={() => setRiskAppetite(risk as any)}
                        className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                          riskAppetite === risk
                            ? 'border-indigo-600 bg-indigo-50 shadow-md scale-105'
                            : 'border-gray-200 hover:border-indigo-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-3xl mb-2">
                            {risk === 'conservative' ? '🛡️' : risk === 'moderate' ? '⚖️' : '🚀'}
                          </div>
                          <div className="font-bold text-gray-900 capitalize mb-1">
                            {risk}
                          </div>
                          <div className="text-xs text-gray-600">
                            {risk === 'conservative' ? 'Lower risk, stable returns' :
                             risk === 'moderate' ? 'Balanced risk-return' :
                             'Higher risk, growth focus'}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Annual SIP Step-up: {stepUpPercentage}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={stepUpPercentage}
                    onChange={(e) => setStepUpPercentage(Number(e.target.value))}
                    className="w-full h-3 bg-gradient-to-r from-indigo-200 to-indigo-400 rounded-full appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>0%</span>
                    <span>10%</span>
                    <span>20%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Goal Templates */}
            {showTemplates && goals.length === 0 && (
              <div className="bg-white rounded-3xl shadow-lg p-6 md:p-8 border border-gray-100">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                  Choose Your Goals
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {GOAL_TEMPLATES.map((template, idx) => (
                    <button
                      key={idx}
                      onClick={() => addGoal(template)}
                      className="p-5 rounded-2xl border-2 border-gray-200 hover:border-indigo-400 hover:shadow-lg transition-all duration-300 text-left group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-2xl">
                          {template.name.includes('Education') ? '🎓' :
                           template.name.includes('Retirement') ? '🏖️' :
                           template.name.includes('Home') ? '🏠' :
                           template.name.includes('Car') ? '🚗' :
                           template.name.includes('Vacation') ? '✈️' :
                           template.name.includes('Wedding') ? '💒' :
                           template.name.includes('Emergency') ? '🆘' : '🎯'}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          template.type === 'mandatory' 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {template.type}
                        </span>
                      </div>
                      <div className="font-bold text-gray-900 mb-2 group-hover:text-indigo-600">
                        {template.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatCurrency(template.targetAmount)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {template.years} years
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Goals List */}
            {goals.length > 0 && (
              <div className="bg-white rounded-3xl shadow-lg p-6 md:p-8 border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                    Your Goals ({goals.length})
                  </h2>
                  <button
                    onClick={() => setShowTemplates(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-md"
                  >
                    + Add Goal
                  </button>
                </div>

                <div className="space-y-4">
                  {goals.map((goal) => (
                    <div
                      key={goal.id}
                      className="p-5 rounded-2xl border-2 border-gray-100 hover:border-indigo-200 transition-all shadow-sm"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        <div className="md:col-span-2">
                          <label className="text-xs text-gray-500 mb-1 block">Goal Name</label>
                          <input
                            type="text"
                            value={goal.name}
                            onChange={(e) => updateGoal(goal.id, 'name', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Type</label>
                          <select
                            value={goal.type}
                            onChange={(e) => updateGoal(goal.id, 'type', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                          >
                            <option value="mandatory">Mandatory</option>
                            <option value="aspirational">Aspirational</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Target Amount</label>
                          <input
                            type="number"
                            value={goal.targetAmount}
                            onChange={(e) => updateGoal(goal.id, 'targetAmount', Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Years</label>
                          <input
                            type="number"
                            value={goal.yearsToGoal}
                            onChange={(e) => updateGoal(goal.id, 'yearsToGoal', Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                          />
                        </div>

                        <div className="flex items-end">
                          <button
                            onClick={() => removeGoal(goal.id)}
                            className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
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

            {/* Calculate Button */}
            {goals.length > 0 && (
              <div className="flex justify-center">
                <button
                  onClick={handleCalculate}
                  className="px-12 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg font-bold rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
                >
                  Create My Investment Plan →
                </button>
              </div>
            )}
          </div>
        )}

        {currentStep === 'processing' && (
          <div className="flex flex-col items-center justify-center py-20 animate-fadeIn">
            <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Analyzing Your Goals
            </h2>
            <p className="text-gray-600">
              Processing market data and optimizing your portfolio...
            </p>
          </div>
        )}

        {currentStep === 'results' && results && (
          <div className="space-y-8 animate-fadeIn">
            {/* Feasibility Status */}
            <div className={`rounded-3xl shadow-lg p-6 md:p-8 border-2 ${
              results.feasibilityStatus === 'feasible' 
                ? 'bg-green-50 border-green-300' 
                : results.feasibilityStatus === 'challenging'
                ? 'bg-yellow-50 border-yellow-300'
                : 'bg-red-50 border-red-300'
            }`}>
              <div className="flex items-center gap-4 mb-4">
                <div className="text-5xl">
                  {results.feasibilityStatus === 'feasible' ? '✅' : 
                   results.feasibilityStatus === 'challenging' ? '⚠️' : '❌'}
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    Plan Feasibility: {results.feasibilityStatus.replace('_', ' ').toUpperCase()}
                  </h2>
                  {results.surplusCapacity > 0 && (
                    <p className="text-sm text-gray-700">
                      You have {formatNumber(results.surplusCapacity)}% surplus capacity for aspirational goals
                    </p>
                  )}
                </div>
              </div>
              
              {results.recommendations.length > 0 && (
                <div className="space-y-2">
                  {results.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-indigo-600 font-bold">→</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Monthly SIP Summary */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl shadow-2xl p-6 md:p-10 text-white">
              <div className="text-center mb-8">
                <p className="text-indigo-100 mb-2">You Need To Invest</p>
                <h1 className="text-5xl md:text-7xl font-bold mb-4">
                  {formatCurrency(results.sipSchedule.currentSIP)}
                </h1>
                <p className="text-xl text-indigo-100">per month</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {results.sipSchedule.breakdown.map((bucket, idx) => (
                  <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-2xl p-5">
                    <div className="text-sm text-indigo-100 mb-1 capitalize">{bucket.bucket} Term</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(bucket.amount)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
                <p className="text-sm text-indigo-100 mb-1">With {stepUpPercentage}% annual step-up</p>
                <p className="text-xs text-indigo-200">
                  Your SIP will automatically increase each year to match your growing income
                </p>
              </div>
            </div>

            {/* Time Horizon Buckets */}
            {results.buckets.map((bucket, idx) => (
              <div key={idx} className="bg-white rounded-3xl shadow-lg p-6 md:p-8 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 capitalize">
                    {bucket.name} Term Goals
                  </h2>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Target Corpus</div>
                    <div className="text-xl font-bold text-indigo-600">
                      {formatCurrency(bucket.totalInflatedAmount)}
                    </div>
                  </div>
                </div>

                {/* Goals in this bucket */}
                <div className="mb-6 p-4 bg-gray-50 rounded-2xl">
                  <div className="text-sm font-semibold text-gray-700 mb-3">Goals:</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {bucket.goals.map((goal, gIdx) => {
                      const goalAlloc = results.goalAllocations.find(ga => ga.goalId === goal.id);
                      return (
                        <div key={gIdx} className="flex justify-between items-center p-3 bg-white rounded-xl">
                          <div>
                            <div className="font-semibold text-gray-900">{goal.name}</div>
                            <div className="text-xs text-gray-600">{goal.yearsToGoal} years</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-indigo-600">
                              {formatCurrency(goalAlloc?.inflatedAmount || 0)}
                            </div>
                            <div className="text-xs text-gray-500">
                              (from {formatCurrency(goal.targetAmount)})
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Matrix Visualization */}
                <div className="mb-6">
                  <div className="text-sm font-semibold text-gray-700 mb-4">Asset Allocation Matrix</div>
                  <div className="grid grid-cols-3 gap-3">
                    {['growth', 'value', 'momentum'].map((style) => (
                      <div key={style} className="space-y-2">
                        <div className="text-xs font-semibold text-gray-600 text-center capitalize mb-2">
                          {style}
                        </div>
                        {['large', 'mid', 'small'].map((cap) => {
                          const cell = bucket.matrix.find(m => 
                            m.capSize === cap && m.style === style
                          );
                          return (
                            <div
                              key={`${cap}-${style}`}
                              className={`p-3 rounded-xl text-center transition-all ${
                                cell && cell.percentage > 0
                                  ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md'
                                  : 'bg-gray-100 text-gray-400'
                              }`}
                            >
                              <div className="text-xs capitalize mb-1">{cap}</div>
                              <div className="font-bold">
                                {cell ? `${formatNumber(cell.percentage)}%` : '-'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sub-category allocations */}
                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-4">Fund Category Allocation</div>
                  <div className="space-y-3">
                    {bucket.subCategoryAllocations.map((alloc, aIdx) => (
                      <div key={aIdx} className="p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="font-bold text-gray-900 flex items-center gap-2">
                              {alloc.subCategory}
                              {alloc.isPassive && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                  Index/ETF
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">{alloc.category}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-indigo-600 text-lg">
                              {formatNumber(alloc.percentage)}%
                            </div>
                            <div className="text-sm text-gray-600">
                              {formatCurrency(alloc.amount)}
                            </div>
                          </div>
                        </div>

                        {/* Fund Suggestions */}
                        {alloc.fundSuggestions.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="text-xs font-semibold text-gray-600 mb-2">
                              Suggested Funds:
                            </div>
                            <div className="space-y-2">
                              {alloc.fundSuggestions.map((fund, fIdx) => (
                                <div key={fIdx} className="flex justify-between items-center text-sm bg-white p-2 rounded-lg">
                                  <div className="flex-1 pr-2">
                                    <div className="text-gray-900 font-medium leading-tight">
                                      {fund.name}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    {fund.returns10Y > 0 && (
                                      <div className="text-xs text-green-600 font-semibold">
                                        {formatNumber(fund.returns10Y)}% (10Y)
                                      </div>
                                    )}
                                    {fund.returns5Y > 0 && (
                                      <div className="text-xs text-green-600 font-semibold">
                                        {formatNumber(fund.returns5Y)}% (5Y)
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Overall Portfolio Allocation */}
            <div className="bg-white rounded-3xl shadow-lg p-6 md:p-8 border border-gray-100">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                Overall Portfolio Allocation
              </h2>
              
              <div className="space-y-3">
                {results.overallAllocation.map((alloc, idx) => (
                  <div key={idx} className="relative">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-semibold text-gray-900">{alloc.subCategory}</div>
                      <div className="font-bold text-indigo-600">
                        {formatNumber(alloc.percentage)}%
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${alloc.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SIP Step-up Schedule */}
            <div className="bg-white rounded-3xl shadow-lg p-6 md:p-8 border border-gray-100">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                Investment Timeline
              </h2>
              
              <div className="overflow-x-auto">
                <div className="min-w-max space-y-2">
                  {results.sipSchedule.stepUpSchedule.slice(0, 10).map((year, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                      <div className="w-16 text-center">
                        <div className="text-sm text-gray-600">Year</div>
                        <div className="text-xl font-bold text-indigo-600">{year.year}</div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="text-sm text-gray-600 mb-1">Monthly SIP</div>
                        <div className="text-lg font-bold text-gray-900">
                          {formatCurrency(year.totalSIP)}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {year.bucketBreakdown.map((bucket, bIdx) => (
                          <div key={bIdx} className="px-3 py-2 bg-white rounded-xl shadow-sm">
                            <div className="text-xs text-gray-600 capitalize">{bucket.bucket}</div>
                            <div className="text-sm font-semibold text-indigo-600">
                              {formatCurrency(bucket.amount)}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Show reallocation if any */}
                      {results.sipSchedule.reallocationPlan.find(r => r.year === year.year) && (
                        <div className="px-4 py-2 bg-green-100 text-green-800 rounded-xl text-sm font-semibold">
                          🎉 Goal Completed
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Goal-wise Breakdown */}
            <div className="bg-white rounded-3xl shadow-lg p-6 md:p-8 border border-gray-100">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                Goal-wise Fund Allocation
              </h2>
              
              <div className="space-y-6">
                {results.goalAllocations.map((goalAlloc, idx) => (
                  <div key={idx} className="p-5 bg-gradient-to-br from-gray-50 to-indigo-50 rounded-2xl">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{goalAlloc.goalName}</h3>
                        <p className="text-sm text-gray-600">
                          Target: {formatCurrency(goalAlloc.targetAmount)} → 
                          Inflated: {formatCurrency(goalAlloc.inflatedAmount)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {goalAlloc.allocations.map((alloc, aIdx) => (
                        <div key={aIdx} className="flex justify-between items-center p-3 bg-white rounded-xl">
                          <span className="text-sm font-medium text-gray-700">
                            {alloc.subCategory}
                          </span>
                          <div className="text-right">
                            <div className="font-semibold text-indigo-600">
                              {formatNumber(alloc.percentage)}%
                            </div>
                            <div className="text-xs text-gray-600">
                              {formatCurrency(alloc.amount)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  setCurrentStep('input');
                  setResults(null);
                }}
                className="px-8 py-4 bg-white text-indigo-600 border-2 border-indigo-600 font-bold rounded-2xl hover:bg-indigo-50 transition-all shadow-md"
              >
                ← Modify Goals
              </button>
              
              <button
                onClick={() => window.print()}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-xl"
              >
                📄 Download Report
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            Data updated daily from AMFI • Powered by real-time market analytics
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Past performance is not indicative of future results. Please consult a financial advisor.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
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
