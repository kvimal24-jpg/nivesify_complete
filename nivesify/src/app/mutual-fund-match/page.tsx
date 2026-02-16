"use client";
// Type guards for fund types
function isFundAnalytics(fund: FundAnalytics | ETFAnalytics | null | undefined): fund is FundAnalytics {
	return !!fund && 'Fund_Name' in fund;
}
function isETFAnalytics(fund: FundAnalytics | ETFAnalytics | null | undefined): fund is ETFAnalytics {
	return !!fund && 'ETF_Name' in fund;
}

import Link from "next/link";
import AnalysisTabs from "@/components/AnalysisTabs";
import { FaRegLightbulb } from "react-icons/fa";
import React, { useState } from "react";

// Types for grid box and fund
type FundAnalytics = {
	Fund_Name: string;
	Sub_Category: string;
	AMC: string;
	Composite_Score?: number;
	Alpha_5Y?: number;
	Fund_AUM?: number;
	Expense_Ratio?: number;
};
type ETFAnalytics = {
	ETF_Name: string;
	Benchmark_Name: string;
	Fund_AUM?: number;
	Expense_Ratio?: number;
};
type BoxResult = {
	empty: boolean;
	candidates: any[];
	winner?: any;
	decision?: string;
	selectedFund?: FundAnalytics | ETFAnalytics | null;
	alternatives?: (FundAnalytics | ETFAnalytics)[];
};

export default async function MutualFundMatchPage() {
	// Modal state for audit trail
	const [modal, setModal] = useState<{row: number, col: number} | null>(null);
	// Fetch all required R2 data for the grid
	const getBaseUrl = () => {
		if (typeof window !== 'undefined') return '';
		// Use env or fallback to production URL or localhost
		return process.env.NEXT_PUBLIC_BASE_URL || 'https://nivesify.com' || 'http://localhost:3000';
	};
	const baseUrl = getBaseUrl();
	const [amfiRaw, fundAnalytics, etfAnalytics, insights] = await Promise.all([
			fetch(`${baseUrl}/api/amfi-raw`).then(r => r.json()),
			fetch(`${baseUrl}/api/funds`).then(r => r.json()),
			fetch(`${baseUrl}/api/etfs`).then(r => r.json()),
			fetch(`${baseUrl}/api/insights`).then(r => r.json()),
	]);

	// --- CLASSIFICATION LOGIC ---
	// Grid: 4 rows (size) x 4 columns (style)
	const ROWS = [
		{ key: "large", label: "Large Cap" },
		{ key: "mid", label: "Mid Cap" },
		{ key: "small", label: "Small Cap" },
		{ key: "flexi", label: "Flexi/Multi Cap" },
	];
	const COLS = [
		{ key: "value", label: "Value/Contra" },
		{ key: "growth", label: "Growth/Core" },
		{ key: "momentum", label: "Momentum" },
		{ key: "active", label: "Pure Active" },
	];

	// Robust: classify a fund into grid position (style/col and size/row)
	function classifyFund(fund: any) {
		const subcat = (fund.Sub_Category || "").toLowerCase();
		// Use correct field names from data
		const scheme = (fund.schemeName || fund.Fund_Name || "").toLowerCase();
		const bench = (fund.benchmark || fund.Benchmark_Name || "").toLowerCase();

		// Style (column)
		if (subcat.includes("value") || scheme.includes("value") || bench.includes("value") || subcat.includes("contra") || scheme.includes("contra") || bench.includes("contra") || subcat.includes("dividend") || scheme.includes("dividend")) return { col: 0 }; // Value/Contra
		if (subcat.includes("momentum") || scheme.includes("momentum") || bench.includes("momentum") || subcat.includes("alpha") || scheme.includes("alpha") || bench.includes("alpha")) return { col: 2 }; // Momentum
		if (subcat.includes("active") || scheme.includes("active")) return { col: 3 }; // Pure Active
		// Default: Growth/Core for all others
		return { col: 1 };
	}

	function classifySize(fund: any) {
		const subcat = (fund.Sub_Category || "").toLowerCase();
		const scheme = (fund.schemeName || fund.Fund_Name || "").toLowerCase();
		const bench = (fund.benchmark || fund.Benchmark_Name || "").toLowerCase();

		// Large Cap
		if (subcat.includes("large") || scheme.includes("large") || bench.match(/nifty 50|sensex|nifty 100|bse 100/)) return { row: 0 };
		// Mid Cap
		if (subcat.includes("mid") || scheme.includes("mid") || bench.match(/midcap 150|midcap 100|nifty midcap/)) return { row: 1 };
		// Small Cap
		if (subcat.includes("small") || scheme.includes("small") || bench.match(/smallcap 250|smallcap 100|nifty smallcap/)) return { row: 2 };
		// Flexi/Multi Cap
		if (subcat.includes("flexi") || subcat.includes("multi") || scheme.includes("flexi") || scheme.includes("multi") || subcat.includes("elss") || scheme.includes("elss") || bench.includes("nifty 500")) return { row: 3 };
		// fallback: null
		return { row: null };
	}

	// Exclusion logic
	function isExcluded(fund: any) {
		const subcat = (fund.Sub_Category || "").toLowerCase();
		if (subcat.includes("sectoral") || subcat.includes("thematic") || subcat.includes("hybrid") || subcat.includes("balanced") || subcat.includes("debt") || subcat.includes("liquid") || subcat.includes("bond") || subcat.includes("gilt") || subcat.includes("fmp") || subcat.includes("arbitrage") || subcat.includes("equity savings") || subcat.includes("overseas")) return true;
		return false;
	}

	// Group funds by grid position
	const gridMap: any[][] = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => []));
	for (const fund of amfiRaw as any[]) {
		if (isExcluded(fund)) continue;
		const style = classifyFund(fund);
		const size = classifySize(fund);
		if (style.col !== undefined && size.row !== null) {
			gridMap[size.row][style.col].push(fund);
		}
	}

	// For each box, group by sub-category
	function groupBySubCategory(funds: any[]): { [key: string]: any[] } {
		const map: { [key: string]: any[] } = {};
		for (const fund of funds) {
			const subcat = fund.Sub_Category;
			if (!map[subcat]) map[subcat] = [];
			map[subcat].push(fund);
		}
		return map;
	}

	// For each box, select best sub-category and decide active vs index
	function getBoxResult(funds: any[]): any {
		const subcatGroups = groupBySubCategory(funds);
		const candidates: any[] = [];
		for (const [subcat, group] of Object.entries(subcatGroups) as [string, any[]][]) {
			// Fix: match Sub_Category_Name in insights (case-insensitive)
			const insight = insights.find((i: any) => {
				const iSubcat = (i.Sub_Category_Name || i.sub_category || '').toLowerCase();
				return iSubcat === (subcat || '').toLowerCase();
			});
			if (!insight) continue;
			let alpha = null, timeframe = null, beatRate = null;
			if (insight.avg_alpha_10y !== null && insight.funds_with_10y_data >= 3) {
				alpha = insight.avg_alpha_10y;
				timeframe = '10-year';
				beatRate = insight.beat_rate_10y;
			} else if (insight.avg_alpha_5y !== null && insight.funds_with_5y_data >= 5) {
				alpha = insight.avg_alpha_5y;
				timeframe = '5-year';
				beatRate = insight.beat_rate_5y;
			} else if (insight.avg_alpha_3y !== null && insight.funds_with_3y_data >= 5) {
				alpha = insight.avg_alpha_3y;
				timeframe = '3-year';
				beatRate = insight.beat_rate_3y;
			} else {
				continue;
			}
			const score = alpha * 0.7 + beatRate * 0.3;
			candidates.push({
				name: subcat,
				fundCount: group.length,
				timeframeUsed: timeframe,
				avgAlpha: alpha,
				beatRate,
				score,
				winner: false,
				funds: group,
				insight
			});
		}
		if (!candidates.length) return { empty: true, candidates: [] };
		candidates.sort((a, b) => b.score - a.score);
		candidates[0].winner = true;
		const winner = candidates[0];
		// Decide active vs index
		let decision = 'INDEX';
		if (winner.avgAlpha > 0.5 && winner.beatRate > 50) decision = 'ACTIVE';
		return { empty: false, candidates, winner, decision };
	}

	// Build grid results with robust sub-category and name matching
	const gridResults: BoxResult[][] = Array.from({ length: 4 }, (_, row) => Array.from({ length: 4 }, (_, col) => {
		const box = getBoxResult(gridMap[row][col]);
		if (box.empty) return { ...box };
		// Final fund selection
		let selectedFund: FundAnalytics | ETFAnalytics | any | null = null;
		let alternatives: (FundAnalytics | ETFAnalytics | any)[] = [];
		// Normalize sub-category for matching
		const winnerSubcat = (box.winner?.name || '').toLowerCase();
		if (box.decision === 'ACTIVE') {
			// Try fundAnalytics first
			let fundsInAnalytics = fundAnalytics.filter((f: any) => (f.Sub_Category || '').toLowerCase() === winnerSubcat);
			// If not found, fallback to amfiRaw
			if (!fundsInAnalytics.length) {
				fundsInAnalytics = gridMap[row][col].filter((f: any) => (f.Sub_Category || '').toLowerCase() === winnerSubcat);
			}
			// Sort by Composite_Score or Alpha_5Y if available
			const sorted = [...fundsInAnalytics].sort((a, b) => ((b.Composite_Score ?? b.Alpha_5Y ?? 0) - (a.Composite_Score ?? a.Alpha_5Y ?? 0)));
			selectedFund = sorted[0] || null;
			alternatives = sorted.slice(1, 3);
		} else if (box.decision === 'INDEX') {
			// Use ETF analytics, robust benchmark matching
			const etfs = etfAnalytics.filter((e: any) => {
				const bench = (e.Benchmark_Name || e.benchmark || '').toLowerCase();
				if (row === 0 && bench.match(/nifty 50|sensex|nifty 100|bse 100/)) return true;
				if (row === 1 && bench.match(/midcap 150|midcap 100|nifty midcap/)) return true;
				if (row === 2 && bench.match(/smallcap 250|smallcap 100|nifty smallcap/)) return true;
				if (row === 3 && bench.includes('nifty 500')) return true;
				return false;
			});
			// Sort by Expense_Ratio or ETF_Score if available
			const sorted = [...etfs].sort((a, b) => ((a.Expense_Ratio ?? a.ETF_Score ?? 999) - (b.Expense_Ratio ?? b.ETF_Score ?? 999)) || ((b.Fund_AUM ?? 0) - (a.Fund_AUM ?? 0)));
			selectedFund = sorted[0] || null;
			alternatives = sorted.slice(1, 3);
		}
		return { ...box, selectedFund, alternatives };
	}));
	return (
		<div className="bg-[#F5F8FF] text-[#1F2937] min-h-screen">
			<section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden px-6 pt-14 pb-8">
				{/* Fog / Noise */}
				<div className="absolute inset-0 pointer-events-none">
					<div className="absolute top-1/4 left-1/3 w-[520px] h-[520px] bg-[#2F5D7C]/10 rounded-full blur-[160px]" />
					<div className="absolute bottom-1/3 right-1/4 w-[420px] h-[420px] bg-[#9BB4D6]/20 rounded-full blur-[140px]" />
				</div>

				{/* Compass Graphic */}
				<div className="absolute left-1/2 top-1/2 w-[240px] h-[240px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#2F5D7C]/30 pointer-events-none opacity-60">
					<div className="absolute inset-6 rounded-full border border-[#2F5D7C]/20"></div>
					<div className="absolute left-1/2 top-0 h-full w-px bg-[#2F5D7C]/40"></div>
					<div className="absolute top-1/2 left-0 w-full h-px bg-[#2F5D7C]/40"></div>
					<div className="absolute left-1/2 top-1/2 w-3 h-3 bg-[#9BB4D6] rounded-full -translate-x-1/2 -translate-y-1/2"></div>
				</div>

				{/* Hero Copy */}
				<div className="relative max-w-4xl text-center space-y-4 z-10">
					<p className="text-[11px] uppercase tracking-[0.32em] text-[#6B7C70] font-serif">
						your money has dreams. we help them come true.
					</p>
					<h1 className="text-3xl md:text-5xl font-serif tracking-tight leading-[1.05] lowercase text-[#1F2937]">
						find my fund
						<br />
						<span className="text-[#2F5D7C]">stop guessing. start investing smart.</span>
					</h1>
					<p className="text-sm md:text-lg font-serif italic text-[#6B7C70]">
						We analyze thousands of funds and build your plan around your goals.
					</p>
					<div className="max-w-2xl mx-auto">
						<p className="text-xs md:text-sm font-serif leading-relaxed text-[#1F2937]/90">
							Simple, personal, and always in your best interest.
						</p>
					</div>
					<Link href="#get-started" className="inline-block mt-6 px-8 py-4 rounded-full bg-[#2F5D7C] text-white font-bold text-lg shadow-lg hover:bg-[#1F2937] transition-all">
						Get Started
					</Link>
				</div>
				{/* Navigation Tabs */}
				<div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-6xl z-20">
					<AnalysisTabs />
				</div>
			</section>

			{/* Fund Selection Grid Section */}
			<section className="relative max-w-6xl mx-auto px-4 py-12">
				<h2 className="text-2xl md:text-3xl font-serif font-bold mb-2 text-[#2F5D7C]">Systematic, Data-Driven Fund Recommendation Matrix</h2>
				<p className="text-md md:text-lg font-serif text-[#4A5D4E] mb-8 max-w-2xl">
					Discover the single best mutual fund for every investment style and company size. This 4×4 grid is built from real data, not opinions—so you can invest with confidence, knowing every pick is backed by performance, not hype.
				</p>
				{/* Render the 4x4 grid with real data */}
				<div className="grid grid-cols-5 grid-rows-5 gap-4 bg-white rounded-3xl border border-[#DDE6F3] shadow-[0_18px_40px_-30px_rgba(31,41,55,0.10)] p-6">
					{/* Top-left empty cell */}
					<div></div>
					{/* Column headers */}
					{COLS.map(col => (
						<div key={col.key} className="font-bold text-center text-[#2F5D7C]">{col.label}</div>
					))}
					{ROWS.map((row, rowIdx) => [
						<div key={row.key} className="font-bold text-center text-[#2F5D7C]">{row.label}</div>,
						...COLS.map((col, colIdx) => {
							const box = gridResults[rowIdx][colIdx] as BoxResult;
							if (box.empty) {
								return (
									<div key={col.key} className="bg-[#F5F8FF] rounded-2xl min-h-[140px] flex flex-col items-center justify-center text-xs text-[#6B7C70] relative shadow-sm border border-[#E6E8E1]">
										<button className="absolute top-2 right-2 cursor-pointer text-lg" title="Audit trail available" onClick={() => setModal({row: rowIdx, col: colIdx})}>ℹ️</button>
										<div className="font-bold mb-1">No funds match</div>
										<div>{row.label} × {col.label}</div>
										<div className="mt-2">0 funds found in R2 data</div>
									</div>
								);
							}
							const badge = box.decision === 'ACTIVE' ? <span className="inline-block bg-[#2F6B45] text-white text-xs rounded-full px-2 py-0.5 mr-2">🎯 Active Pick</span> : <span className="inline-block bg-[#3F5E83] text-white text-xs rounded-full px-2 py-0.5 mr-2">📊 Index Pick</span>;
							return (
								<div key={col.key} className="bg-[#F5F8FF] rounded-2xl min-h-[140px] flex flex-col items-center justify-between p-4 relative shadow-sm border border-[#E6E8E1]">
									<button className="absolute top-2 right-2 cursor-pointer text-lg" title="Audit trail available" onClick={() => setModal({row: rowIdx, col: colIdx})}>ℹ️</button>
									{/* Fund Card */}
									{box.selectedFund ? (
										<div className="w-full text-center">
											<div className="flex items-center justify-center mb-2">{badge}</div>
											<div className="font-bold text-[#1F2937] text-base mb-1">
												{isFundAnalytics(box.selectedFund) && box.selectedFund.Fund_Name}
												{isETFAnalytics(box.selectedFund) && box.selectedFund.ETF_Name}
											</div>
											<div className="text-xs text-[#6B7C70] mb-1">
												{isFundAnalytics(box.selectedFund) && `${box.selectedFund.Sub_Category} | ${box.selectedFund.AMC}`}
												{isETFAnalytics(box.selectedFund) && box.selectedFund.Benchmark_Name}
											</div>
											<div className="flex flex-wrap justify-center gap-2 text-xs text-[#2F5D7C] mb-1">
												{isFundAnalytics(box.selectedFund) && box.selectedFund.Composite_Score && <span>Composite: <b>{box.selectedFund.Composite_Score}</b></span>}
												{isETFAnalytics(box.selectedFund) && box.selectedFund.Expense_Ratio && <span>Expense: <b>{box.selectedFund.Expense_Ratio}%</b></span>}
												{isFundAnalytics(box.selectedFund) && box.selectedFund.Alpha_5Y && <span>5Y Alpha: <b>{box.selectedFund.Alpha_5Y}%</b></span>}
												{isETFAnalytics(box.selectedFund) && box.selectedFund.Fund_AUM && <span>AUM: <b>₹{box.selectedFund.Fund_AUM}</b></span>}
											</div>
										</div>
									) : (
										<div className="w-full text-center text-[#8B3A3A] font-bold">No fund found</div>
									)}
									<button className="mt-2 text-xs text-[#2F5D7C] underline" onClick={() => setModal({row: rowIdx, col: colIdx})}>Full breakdown →</button>
								</div>
							);
						})
					])}
				</div>

				{/* Audit Modal */}
				{modal && (() => {
					const { row, col } = modal;
					const box = gridResults[row][col] as BoxResult;
					return (
						<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
							<div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative">
								<button className="absolute top-3 right-3 text-2xl text-[#6B7C70] hover:text-[#2F5D7C]" onClick={() => setModal(null)}>&times;</button>
								<h3 className="text-xl font-serif font-bold mb-2 text-[#2F5D7C]">Audit Trail</h3>
								<div className="space-y-4 text-sm">
									<div>
										<div className="font-bold text-[#1F2937] mb-1">1. How we identified this category</div>
										<div className="text-[#4A5D4E]">Style: <b>{COLS[col].label}</b> | Size: <b>{ROWS[row].label}</b></div>
									</div>
									<div>
										<div className="font-bold text-[#1F2937] mb-1">2. Which sub-category won this position</div>
										<div className="text-[#4A5D4E]">Winner: <b>{box.winner?.name}</b> ({box.winner?.fundCount} funds, {box.winner?.timeframeUsed}, Alpha: {box.winner?.avgAlpha}%, Beat Rate: {box.winner?.beatRate}%)</div>
										<details className="mt-1">
											<summary className="cursor-pointer text-xs text-[#6B7C70]">Show all competitors</summary>
											<ul className="list-disc ml-5">
												{box.candidates?.map((c, i) => (
													<li key={i} className={c.winner ? "font-bold text-[#2F6B45]" : undefined}>
														{c.name}: {c.avgAlpha}% alpha, {c.beatRate}% beat, score {c.score.toFixed(2)} {c.winner ? '✓' : ''}
													</li>
												))}
											</ul>
										</details>
									</div>
									<div>
										<div className="font-bold text-[#1F2937] mb-1">3. Active vs Index decision</div>
										<div className="text-[#4A5D4E]">Decision: <b>{box.decision}</b> ({box.winner?.avgAlpha}% alpha, {box.winner?.beatRate}% beat rate)</div>
									</div>
									<details>
										<summary className="cursor-pointer font-bold text-[#1F2937]">4. The winning fund (details)</summary>
										<div className="text-[#4A5D4E] mt-1">
											{box.selectedFund ? (
												<>
													{isFundAnalytics(box.selectedFund) && (
														<>
															<div><b>Name:</b> {box.selectedFund.Fund_Name}</div>
															<div><b>Composite Score:</b> {box.selectedFund.Composite_Score ?? '-'}</div>
															<div><b>5Y Alpha:</b> {box.selectedFund.Alpha_5Y ?? '-'}</div>
															<div><b>AUM:</b> {box.selectedFund.Fund_AUM ?? '-'}</div>
															<div><b>Expense Ratio:</b> {box.selectedFund.Expense_Ratio ?? '-'}</div>
															<div><b>AMC:</b> {box.selectedFund.AMC ?? '-'}</div>
														</>
													)}
													{isETFAnalytics(box.selectedFund) && (
														<>
															<div><b>Name:</b> {box.selectedFund.ETF_Name}</div>
															<div><b>Benchmark:</b> {box.selectedFund.Benchmark_Name}</div>
															<div><b>AUM:</b> {box.selectedFund.Fund_AUM ?? '-'}</div>
															<div><b>Expense Ratio:</b> {box.selectedFund.Expense_Ratio ?? '-'}</div>
														</>
													)}
												</>
											) : 'No fund found'}
										</div>
									</details>
									<details>
										<summary className="cursor-pointer font-bold text-[#1F2937]">5. Data source</summary>
										<div className="text-[#4A5D4E] mt-1">
											<div>Files: industry-and-category-insights.json, fund-analytics.json, amfi_raw.json, etf-analytics.json</div>
											<div>Folder: mf-data-bucket/data/latest/</div>
										</div>
									</details>
								</div>
							</div>
						</div>
					);
				})()}
			</section>
		</div>
	);
}
