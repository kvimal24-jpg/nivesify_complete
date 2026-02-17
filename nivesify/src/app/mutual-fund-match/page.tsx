"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// ============================================================================
// TYPE DEFINITIONS  
// ============================================================================

type SubCategoryPerformance = {
  subCategory: string;
  avgAlpha: number;
  avgBeatRate: number;
  fundCount: number;
  topFund: string;
  topFundScore: number;
};

type CellResult = {
  fund: any | null;
  type: "Active" | "Index" | null;
  leadingSubCategory: string;
  candidateSubCategories: SubCategoryPerformance[];
  alpha: number;
  beatRate: number;
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function isEquityBenchmark(benchmarkName: string): boolean {
  if (!benchmarkName) return false;
  const lower = benchmarkName.toLowerCase();
  const equityKeywords = [
    'nifty', 'sensex', 'bse', 'midcap', 'smallcap', 'largecap',
    'large cap', 'mid cap', 'small cap', 'flexi', 'multi cap',
    'momentum', 'value', 'alpha', 'quality', 'dividend', 'growth'
  ];
  return equityKeywords.some(kw => lower.includes(kw));
}

function findSize(fund: any): string {
  const subCat = (fund.Sub_Category || '').toLowerCase();
  const benchmark = (fund.Benchmark_Name || '').toLowerCase();
  const fundName = (fund.Fund_Name || '').toLowerCase();
  
  const combined = `${subCat} ${benchmark} ${fundName}`;
  
  if (combined.includes('large cap') || combined.includes('largecap') || 
      combined.includes('nifty 50') || combined.includes('nifty50') || 
      combined.includes('sensex') || combined.includes('nifty next 50')) {
    return 'Large Cap';
  }
  
  if (combined.includes('mid cap') || combined.includes('midcap') || 
      combined.includes('nifty midcap')) {
    return 'Mid Cap';
  }
  
  if (combined.includes('small cap') || combined.includes('smallcap') || 
      combined.includes('nifty smallcap')) {
    return 'Small Cap';
  }
  
  if (combined.includes('flexi') || combined.includes('multi cap') || 
      combined.includes('multicap') || combined.includes('nifty 500') || 
      combined.includes('nifty 200')) {
    return 'Flexi / Multi Cap';
  }
  
  return 'Unknown';
}

function findStyle(fund: any): string {
  const subCat = (fund.Sub_Category || '').toLowerCase();
  const benchmark = (fund.Benchmark_Name || '').toLowerCase();
  const fundName = (fund.Fund_Name || '').toLowerCase();
  
  const combined = `${subCat} ${benchmark} ${fundName}`;
  
  if (combined.includes('value') || combined.includes('contra') || 
      combined.includes('dividend yield')) {
    return 'Value & Contra';
  }
  
  if (combined.includes('momentum')) {
    return 'Momentum';
  }
  
  return 'Growth / Core';
}

function buildExpandedUniverse(
  fundAnalytics: any[],
  etfAnalytics: any[],
  amfiRaw: any[]
): any[] {
  const universe: any[] = [];
  
  fundAnalytics.forEach(f => {
    if (f.Category === 'Equity') {
      universe.push({ ...f, source: 'fund-analytics' });
    }
  });
  
  etfAnalytics.forEach(etf => {
    if (etf.Category === 'Other' && isEquityBenchmark(etf.Benchmark_Name)) {
      universe.push({ ...etf, source: 'etf-analytics' });
    }
  });
  
  return universe;
}

function groupBySubCategory(funds: any[]): SubCategoryPerformance[] {
  const groups: Record<string, any[]> = {};
  
  funds.forEach(fund => {
    let key = fund.Sub_Category || fund.Benchmark_Name || 'Unknown';
    if (!groups[key]) groups[key] = [];
    groups[key].push(fund);
  });
  
  const performances: SubCategoryPerformance[] = [];
  
  Object.keys(groups).forEach(subCat => {
    const fundsInSubCat = groups[subCat];
    
    const avgAlpha = fundsInSubCat.reduce((sum, f) => 
      sum + (f.Rolling_Alpha_1Y || 0), 0) / fundsInSubCat.length;
    
    const avgBeatRate = fundsInSubCat.reduce((sum, f) => 
      sum + (f.Beat_Rate_1Y || 0), 0) / fundsInSubCat.length;
    
    const topFund = fundsInSubCat.reduce((best, curr) => {
      const bestScore = best.Composite_Score || best.ETF_Score || 0;
      const currScore = curr.Composite_Score || curr.ETF_Score || 0;
      return currScore > bestScore ? curr : best;
    });
    
    performances.push({
      subCategory: subCat,
      avgAlpha,
      avgBeatRate,
      fundCount: fundsInSubCat.length,
      topFund: topFund.Fund_Name,
      topFundScore: topFund.Composite_Score || topFund.ETF_Score || 0
    });
  });
  
  return performances;
}

function selectLeadingSubCategory(
  performances: SubCategoryPerformance[]
): SubCategoryPerformance | null {
  if (performances.length === 0) return null;
  
  const sorted = [...performances].sort((a, b) => {
    if (Math.abs(a.avgAlpha - b.avgAlpha) > 0.1) {
      return b.avgAlpha - a.avgAlpha;
    }
    return b.avgBeatRate - a.avgBeatRate;
  });
  
  return sorted[0];
}

function pickBestFundInSubCategory(
  funds: any[],
  leadingSubCat: string
): any | null {
  const fundsInSubCat = funds.filter(f => {
    const key = f.Sub_Category || f.Benchmark_Name || 'Unknown';
    return key === leadingSubCat;
  });
  
  if (fundsInSubCat.length === 0) return null;
  
  const sorted = [...fundsInSubCat].sort((a, b) => {
    const aScore = a.Composite_Score || a.ETF_Score || 0;
    const bScore = b.Composite_Score || b.ETF_Score || 0;
    return bScore - aScore;
  });
  
  return sorted[0];
}

function evaluateCell(
  universe: any[],
  size: string,
  style: string,
  isPureActiveColumn: boolean
): CellResult {
  let cellFunds = universe.filter(fund => {
    const fundSize = findSize(fund);
    const fundStyle = findStyle(fund);
    
    if (fundSize !== size) return false;
    
    if (isPureActiveColumn) {
      if (fundStyle !== 'Growth / Core') return false;
      const isPassive = fund.source === 'etf-analytics' ||
                        fund.Fund_Name.toLowerCase().includes('index') ||
                        fund.Fund_Name.toLowerCase().includes('etf') ||
                        !fund.Composite_Score;
      return !isPassive;
    }
    
    return fundStyle === style;
  });
  
  if (cellFunds.length === 0) {
    return {
      fund: null,
      type: null,
      leadingSubCategory: '',
      candidateSubCategories: [],
      alpha: 0,
      beatRate: 0
    };
  }
  
  const candidatePerformances = groupBySubCategory(cellFunds);
  const leadingPerformance = selectLeadingSubCategory(candidatePerformances);
  
  if (!leadingPerformance) {
    return {
      fund: null,
      type: null,
      leadingSubCategory: '',
      candidateSubCategories: candidatePerformances,
      alpha: 0,
      beatRate: 0
    };
  }
  
  const bestFund = pickBestFundInSubCategory(cellFunds, leadingPerformance.subCategory);
  
  if (!bestFund) {
    return {
      fund: null,
      type: null,
      leadingSubCategory: leadingPerformance.subCategory,
      candidateSubCategories: candidatePerformances,
      alpha: 0,
      beatRate: 0
    };
  }
  
  const isActive = bestFund.Composite_Score !== undefined;
  const type = isActive ? 'Active' : 'Index';
  
  return {
    fund: bestFund,
    type,
    leadingSubCategory: leadingPerformance.subCategory,
    candidateSubCategories: candidatePerformances,
    alpha: bestFund.Rolling_Alpha_1Y || 0,
    beatRate: bestFund.Beat_Rate_1Y || 0
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function FindMyFundPage() {
  const [fundAnalytics, setFundAnalytics] = useState<any[]>([]);
  const [etfAnalytics, setETFAnalytics] = useState<any[]>([]);
  const [amfiRaw, setAmfiRaw] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [matrixData, setMatrixData] = useState<Record<string, CellResult>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<CellResult | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [fundRes, etfRes, amfiRes] = await Promise.all([
          fetch("/api/r2-proxy?key=data_latest_fund-analytics.json"),
          fetch("/api/r2-proxy?key=data_latest_etf-analytics.json"),
          fetch("/api/r2-proxy?key=amfi_raw.json"),
        ]);

        const fundData = await fundRes.json();
        const etfData = await etfRes.json();
        const amfiData = await amfiRes.json();

        setFundAnalytics(fundData);
        setETFAnalytics(etfData);
        setAmfiRaw(amfiData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (loading || fundAnalytics.length === 0) return;

    const universe = buildExpandedUniverse(fundAnalytics, etfAnalytics, amfiRaw);
    
    const sizes = ['Large Cap', 'Mid Cap', 'Small Cap', 'Flexi / Multi Cap'];
    const styles = ['Value & Contra', 'Growth / Core', 'Momentum', 'Pure Active'];
    
    const newMatrix: Record<string, CellResult> = {};
    
    sizes.forEach(size => {
      styles.forEach(style => {
        const isPureActive = style === 'Pure Active';
        const result = evaluateCell(universe, size, style, isPureActive);
        newMatrix[`${size}|${style}`] = result;
      });
    });
    
    setMatrixData(newMatrix);
  }, [loading, fundAnalytics, etfAnalytics, amfiRaw]);

  const handleCellClick = (size: string, style: string) => {
    const key = `${size}|${style}`;
    const data = matrixData[key];
    if (data) {
      setModalContent(data);
      setModalOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-xl text-slate-600">Loading data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Find My Fund
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            Discover the best equity fund strategies across market cap sizes and
            investment styles. We analyze 558+ equity funds and equity-linked
            passive funds to find leading sub-categories and top performers.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-blue-600 to-blue-700">
                  <th className="p-4 text-left text-white font-semibold border-r border-blue-500">
                    Size ↓ Style →
                  </th>
                  <th className="p-4 text-center text-white font-semibold border-r border-blue-500">
                    <div className="font-bold mb-1">Value & Contra</div>
                    <div className="text-xs font-normal opacity-90">Buy quality on discount</div>
                  </th>
                  <th className="p-4 text-center text-white font-semibold border-r border-blue-500">
                    <div className="font-bold mb-1">Growth / Core</div>
                    <div className="text-xs font-normal opacity-90">Steady compounders</div>
                  </th>
                  <th className="p-4 text-center text-white font-semibold border-r border-blue-500">
                    <div className="font-bold mb-1">Momentum</div>
                    <div className="text-xs font-normal opacity-90">Ride what's winning now</div>
                  </th>
                  <th className="p-4 text-center text-white font-semibold">
                    <div className="font-bold mb-1">Pure Active</div>
                    <div className="text-xs font-normal opacity-90">Fund manager's best picks</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {['Large Cap', 'Mid Cap', 'Small Cap', 'Flexi / Multi Cap'].map((size, sizeIdx) => (
                  <tr key={size} className={sizeIdx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                    <td className="p-4 font-semibold text-slate-700 border-r border-slate-200">
                      <div className="font-bold">{size}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {size === 'Large Cap' && "India's biggest & most stable"}
                        {size === 'Mid Cap' && "Fast-growing challengers"}
                        {size === 'Small Cap' && "High-risk, high-reward"}
                        {size === 'Flexi / Multi Cap' && "Manager decides the mix"}
                      </div>
                    </td>
                    {['Value & Contra', 'Growth / Core', 'Momentum', 'Pure Active'].map(style => {
                      const key = `${size}|${style}`;
                      const cell = matrixData[key];
                      return (
                        <td
                          key={style}
                          className="p-4 border-r border-slate-200 cursor-pointer hover:bg-blue-50 transition-colors"
                          onClick={() => handleCellClick(size, style)}
                        >
                          {cell && cell.fund ? (
                            <div className="text-sm">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">{cell.type === 'Active' ? '🎯' : '📊'}</span>
                                <span className={`text-xs font-semibold px-2 py-1 rounded ${
                                  cell.type === 'Active' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {cell.type}
                                </span>
                              </div>
                              <div className="font-bold text-slate-900 mb-1 text-base">
                                {cell.leadingSubCategory}
                              </div>
                              <div className="text-xs text-slate-600 mb-2">
                                {cell.fund.Fund_Name}
                              </div>
                              <div className="text-xs text-slate-500">
                                α {cell.alpha.toFixed(1)}% · Beat {cell.beatRate.toFixed(0)}%
                              </div>
                              <div className="text-xs text-blue-600 mt-2 font-medium">
                                Full analysis →
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-slate-400 text-center py-4">
                              <div className="text-2xl mb-2">📋</div>
                              <div>No funds match</div>
                              <div className="text-xs mt-1">{size} × {style}</div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-100 px-6 py-4 border-t border-slate-200">
            <div className="flex items-center justify-center gap-6 text-sm text-slate-600">
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

        {modalOpen && modalContent && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setModalOpen(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900">Selection Audit Trail</h2>
                  <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl">
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">Selected Fund</h3>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{modalContent.type === 'Active' ? '🎯' : '📊'}</span>
                      <span className="font-bold text-slate-900">{modalContent.fund?.Fund_Name}</span>
                    </div>
                    <div className="text-sm text-slate-600">
                      Sub-Category: <strong>{modalContent.leadingSubCategory}</strong>
                    </div>
                    <div className="text-sm text-slate-600 mt-1">
                      Alpha: <strong>{modalContent.alpha.toFixed(2)}%</strong> | 
                      Beat Rate: <strong>{modalContent.beatRate.toFixed(0)}%</strong>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">All Evaluated Sub-Categories</h3>
                  <div className="space-y-3">
                    {modalContent.candidateSubCategories.map((subCat, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border ${
                          subCat.subCategory === modalContent.leadingSubCategory
                            ? 'bg-green-50 border-green-300'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold text-slate-900">
                            {subCat.subCategory}
                            {subCat.subCategory === modalContent.leadingSubCategory && (
                              <span className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded">WINNER</span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500">{subCat.fundCount} funds</div>
                        </div>
                        <div className="text-sm text-slate-600">
                          Avg Alpha: <strong>{subCat.avgAlpha.toFixed(2)}%</strong> | 
                          Avg Beat Rate: <strong>{subCat.avgBeatRate.toFixed(0)}%</strong>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">Top Fund: {subCat.topFund}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}