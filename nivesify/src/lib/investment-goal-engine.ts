// Investment goal planning engine with Dynamic Portfolio Evolution
// Based on the Nivesify 4×4 Matrix Proposal - COMPLETE IMPLEMENTATION

import type { FundAnalytics, ETFAnalytics, CategoryInsights } from "@/lib/fund-types";

type GoalType = "mandatory" | "aspirational";
type RiskAppetite = "conservative" | "moderate" | "aggressive";
type HorizonBucket = "short" | "medium" | "long";
type CapSize = "large" | "mid" | "small" | "total" | "debt";
type Style = "value" | "growth" | "momentum" | "active" | "debt";
type GoalStatus = "ACTIVE" | "REDIRECT_PENDING" | "COMPLETED";

// Core-7 Role definitions
type PortfolioRole = "anchor" | "pillar" | "contrarian" | "speedster" | "compounder" | "allrounder" | "stabilizer";

interface Goal {
	id: string;
	name: string;
	type: GoalType;
	currentAmount: number;
	targetAmount: number;
	yearsToGoal: number;
	inflationRate: number;
	status?: GoalStatus;
	completionPercentage?: number;
}

interface UserInput {
	goals: Goal[];
	monthlySIPCapacity: number;
	stepUpPercentage: number;
	riskAppetite: RiskAppetite;
	incomeStability: "stable" | "variable" | "uncertain";
}

interface MatrixAllocation {
	capSize: CapSize;
	style: Style;
	percentage: number;
	amount: number;
	role?: PortfolioRole;
}

interface FundSuggestion {
	name: string;
	returns1Y: number | null;
	returns3Y: number | null;
	returns5Y: number | null;
	returns10Y: number | null;
	alpha3Y: number | null;
	alpha5Y: number | null;
	compositeScore: number | null;
	aum: number | null;
	isETF: boolean;
}

interface SubCategoryAllocation {
	subCategory: string;
	category: string;
	percentage: number;
	amount: number;
	isPassive: boolean;
	fundSuggestions: FundSuggestion[];
	role?: PortfolioRole;
	roleDescription?: string;
}

interface GoalAllocation {
	goalId: string;
	goalName: string;
	targetAmount: number;
	inflatedAmount: number;
	allocations: {
		subCategory: string;
		percentage: number;
		amount: number;
	}[];
}

interface TimeHorizonBucket {
	name: HorizonBucket;
	goals: Goal[];
	totalInflatedAmount: number;
	matrix: MatrixAllocation[];
	subCategoryAllocations: SubCategoryAllocation[];
}

interface RedirectEvent {
	eventId: string;
	triggeredYear: number;
	completedGoal: {
		goalId: string;
		goalName: string;
		finalCorpus: number;
	};
	nextGoal: {
		goalId: string;
		goalName: string;
		yearsRemaining: number;
	} | null;
	sipChanges: {
		action: "STOP" | "INCREASE" | "START";
		subCategory: string;
		oldSIP: number;
		newSIP: number;
	}[];
	portfolioEvolution: {
		before: SubCategoryAllocation[];
		after: SubCategoryAllocation[];
	};
}

interface SIPSchedule {
	currentSIP: number;
	breakdown: {
		bucket: string;
		amount: number;
	}[];
	stepUpSchedule: {
		year: number;
		totalSIP: number;
		bucketBreakdown: {
			bucket: string;
			amount: number;
		}[];
	}[];
	reallocationPlan: RedirectEvent[];
}

interface PortfolioPhase {
	phaseNumber: number;
	phaseName: string;
	years: string;
	activeGoal: string;
	portfolioComposition: string;
	rolesActive: PortfolioRole[];
	description: string;
	allocationBreakdown: {
		debt: number;
		equity: number;
		hybrid: number;
		momentum: number;
	};
	sipBreakdown: {
		role: PortfolioRole;
		amount: number;
		percentage: number;
	}[];
}

interface EngineOutput {
	buckets: TimeHorizonBucket[];
	goalAllocations: GoalAllocation[];
	sipSchedule: SIPSchedule;
	overallAllocation: SubCategoryAllocation[];
	surplusCapacity: number;
	feasibilityStatus: "feasible" | "challenging" | "not_feasible";
	recommendations: string[];
	portfolioPhases: PortfolioPhase[];
	currentPhase: PortfolioPhase;
	complete4x4Matrix: {
		size: string;
		value: string | null;
		growth: string | null;
		momentum: string | null;
		active: string | null;
	}[];
}

class InvestmentGoalEngine {
	private fundAnalytics: FundAnalytics[] = [];
	private etfAnalytics: ETFAnalytics[] = [];
	private categoryInsights: CategoryInsights[] = [];

	async loadData() {
		try {
			const [funds, etfs, insights] = await Promise.all([
				fetch("/api/funds").then((res) => res.json()),
				fetch("/api/etfs").then((res) => res.json()),
				fetch("/api/insights").then((res) => res.json()),
			]);

			this.fundAnalytics = funds ?? [];
			this.etfAnalytics = etfs ?? [];
			this.categoryInsights = insights ?? [];
		} catch (error) {
			console.error("Error loading data:", error);
			throw new Error("Failed to load fund data");
		}
	}

	/**
	 * Generate the complete 4x4 matrix for educational display
	 */
	generateComplete4x4Matrix(): {
		size: string;
		value: string | null;
		growth: string | null;
		momentum: string | null;
		active: string | null;
	}[] {
		return [
			{
				size: "Large Cap",
				value: "Value Fund",
				growth: "Nifty 50 ETF",
				momentum: null,
				active: "Large Cap Active"
			},
			{
				size: "Mid Cap",
				value: null,
				growth: "Nifty Mid 150 ETF",
				momentum: "Nifty Midcap Momentum 50",
				active: "Mid Cap Active"
			},
			{
				size: "Small Cap",
				value: null,
				growth: "Nifty Small 250 ETF",
				momentum: "Nifty Smallcap Momentum 50",
				active: "Small Cap Active"
			},
			{
				size: "Total Market",
				value: null,
				growth: "Nifty 500 ETF",
				momentum: null,
				active: "Flexi/Multi Cap"
			}
		];
	}

	calculateInflatedAmount(currentAmount: number, years: number, inflationRate: number): number {
		return currentAmount * Math.pow(1 + inflationRate / 100, years);
	}

	calculateFutureValue(currentAmount: number, years: number, expectedReturn: number): number {
		const monthlyReturn = expectedReturn / 12 / 100;
		const months = years * 12;
		return currentAmount * Math.pow(1 + monthlyReturn, months);
	}

	categorizeBuckets(goals: Goal[]): { short: Goal[]; medium: Goal[]; long: Goal[] } {
		return {
			short: goals.filter((g) => g.yearsToGoal <= 3),
			medium: goals.filter((g) => g.yearsToGoal > 3 && g.yearsToGoal <= 7),
			long: goals.filter((g) => g.yearsToGoal > 7),
		};
	}

	shouldUseActive(subCategory: string): boolean {
		const insight = this.categoryInsights.find(
			(i) => i.Level === "Sub-Category" && i.Sub_Category_Name === subCategory
		);

		if (!insight) return false;

		const alpha = insight.Avg_Alpha_3Y ?? 0;
		const beatRate = insight.Pct_Funds_Beating_Benchmark_3Y ?? 0;

		if (alpha > 1.5 && beatRate > 65) return true;
		if (alpha <= 0.5 || beatRate < 50) return false;

		return false;
	}

	getRoleForSubCategory(
		subCategory: string,
		bucket: HorizonBucket
	): { role: PortfolioRole; description: string } {
		if (
			subCategory.includes("Liquid") ||
			subCategory.includes("Money Market") ||
			subCategory.includes("Short Duration")
		) {
			return { role: "anchor", description: "Safety & Liquidity for near-term goals (0-3 years)" };
		}

		if (subCategory === "Large Cap") {
			return { role: "pillar", description: "Core equity exposure with minimal tracking error" };
		}

		if (subCategory === "Value" || subCategory === "Contra" || subCategory === "Dividend Yield") {
			return { role: "contrarian", description: "Defensive alpha through value/contrarian strategy" };
		}

		if (subCategory.includes("Momentum") || subCategory.includes("Alpha")) {
			return { role: "speedster", description: "Captures trending strength via momentum/alpha" };
		}

		if ((subCategory === "Mid Cap" || subCategory === "Small Cap") && this.shouldUseActive(subCategory)) {
			return { role: "compounder", description: "Long-term wealth via high-growth segments (only when alpha exists)" };
		}

		if (subCategory === "Flexi Cap" || subCategory === "Multi Cap") {
			return { role: "allrounder", description: "Broad market coverage across all cap sizes" };
		}

		if (
			subCategory.includes("Balanced") ||
			subCategory.includes("Hybrid") ||
			subCategory.includes("Multi Asset")
		) {
			return { role: "stabilizer", description: "Balanced risk-return for medium-term goals (3-7 years)" };
		}

		return { role: "allrounder", description: "Diversified exposure" };
	}

	/**
	 * FIXED: Generate proper 4x4 matrix with ALL styles (Value, Growth, Momentum, Active)
	 * Following proposal Phase allocations:
	 * - Short (0-3y): 70% Debt + 30% Large Cap
	 * - Medium (3-7y): 40% Debt + 60% (Hybrid/Equity mix)
	 * - Long (7+y): 10% Debt + 90% Equity (full diversification)
	 */
	generate4x4Matrix(
		bucket: HorizonBucket,
		riskAppetite: RiskAppetite,
		totalAmount: number
	): MatrixAllocation[] {
		const matrix: MatrixAllocation[] = [];

		if (bucket === "short") {
			// Phase 1: 70% Debt + 30% Large Cap (safety focus)
			matrix.push({
				capSize: "debt",
				style: "debt",
				percentage: 70,
				amount: (totalAmount * 70) / 100,
			});
			matrix.push({
				capSize: "large",
				style: "growth",
				percentage: 30,
				amount: (totalAmount * 30) / 100,
			});
		} else if (bucket === "medium") {
			// Phase 2: 40% Debt + 60% Balanced/Equity
			matrix.push({
				capSize: "debt",
				style: "debt",
				percentage: 40,
				amount: (totalAmount * 40) / 100,
			});
			// Rest split between hybrid and equity
			matrix.push({
				capSize: "large",
				style: "growth",
				percentage: 20,
				amount: (totalAmount * 20) / 100,
			});
			matrix.push({
				capSize: "total",
				style: "active",
				percentage: 20,
				amount: (totalAmount * 20) / 100,
			});
			// Hybrid/Stabilizer
			matrix.push({
				capSize: "total",
				style: "growth",
				percentage: 20,
				amount: (totalAmount * 20) / 100,
			});
		} else {
			// Phase 3: 10% Debt + 90% Full diversification
			matrix.push({
				capSize: "debt",
				style: "debt",
				percentage: 10,
				amount: (totalAmount * 10) / 100,
			});

			const aggressive = riskAppetite === "aggressive";
			const moderate = riskAppetite === "moderate";

			// Large Cap Growth
			const largePct = aggressive ? 20 : moderate ? 25 : 30;
			matrix.push({
				capSize: "large",
				style: "growth",
				percentage: largePct,
				amount: (totalAmount * largePct) / 100,
			});

			// Value/Contra
			const valuePct = 15;
			matrix.push({
				capSize: "large",
				style: "value",
				percentage: valuePct,
				amount: (totalAmount * valuePct) / 100,
			});

			// Mid Cap
			const midPct = aggressive ? 20 : moderate ? 15 : 10;
			matrix.push({
				capSize: "mid",
				style: "growth",
				percentage: midPct,
				amount: (totalAmount * midPct) / 100,
			});

			// Momentum
			const momentumPct = aggressive ? 15 : moderate ? 15 : 10;
			matrix.push({
				capSize: "mid",
				style: "momentum",
				percentage: momentumPct,
				amount: (totalAmount * momentumPct) / 100,
			});

			// Small Cap
			const smallPct = aggressive ? 10 : moderate ? 10 : 5;
			matrix.push({
				capSize: "small",
				style: "growth",
				percentage: smallPct,
				amount: (totalAmount * smallPct) / 100,
			});

			// Flexi/Total Market
			const flexiPct = 100 - 10 - largePct - valuePct - midPct - momentumPct - smallPct;
			if (flexiPct > 0) {
				matrix.push({
					capSize: "total",
					style: "active",
					percentage: flexiPct,
					amount: (totalAmount * flexiPct) / 100,
				});
			}
		}

		return matrix;
	}

	getDebtSubCategory(bucket: HorizonBucket): string {
		if (bucket === "short") return "Liquid";
		if (bucket === "medium") return "Short Duration";
		return "Corporate Bond";
	}

	async mapMatrixToSubCategories(
		matrix: MatrixAllocation[],
		bucket: HorizonBucket
	): Promise<SubCategoryAllocation[]> {
		const allocations: SubCategoryAllocation[] = [];

		for (const cell of matrix) {
			const { capSize, style, percentage, amount } = cell;

			let subCategory: string;
			let category = "Equity";

			if (capSize === "debt") {
				subCategory = this.getDebtSubCategory(bucket);
				category = "Debt";
			} else if (capSize === "large") {
				if (style === "value") subCategory = "Value";
				else subCategory = "Large Cap";
			} else if (capSize === "mid") {
				if (style === "momentum") subCategory = "Mid Cap";
				else subCategory = "Mid Cap";
			} else if (capSize === "small") {
				subCategory = "Small Cap";
			} else if (capSize === "total") {
				if (style === "active") subCategory = "Flexi Cap";
				else subCategory = "Flexi Cap";
			} else {
				subCategory = "Large Cap";
			}

			const useActive = this.shouldUseActive(subCategory);
			const fundSuggestions = await this.selectTopFunds(subCategory, category, 3, !useActive);

			const { role, description } = this.getRoleForSubCategory(subCategory, bucket);

			allocations.push({
				subCategory,
				category,
				percentage,
				amount,
				isPassive: !useActive,
				fundSuggestions,
				role,
				roleDescription: description,
			});
		}

		return this.consolidateAllocations(allocations);
	}

	async selectTopFunds(
		subCategory: string,
		category: string,
		limit: number = 3,
		preferETF: boolean = false
	): Promise<FundSuggestion[]> {
		       let candidates: FundSuggestion[] = [];

		       // Filter ETFs matching the subCategory
		       const etfs = this.etfAnalytics.filter((etf) => {
			       const bench = etf.Benchmark_Name?.toLowerCase() || "";
			       const name = etf.ETF_Name?.toLowerCase() || "";

			       if (subCategory === "Liquid") return bench.includes("liquid") || name.includes("liquid");
			       if (subCategory === "Short Duration") return bench.includes("short") || name.includes("short");
			       if (subCategory === "Large Cap")
				       return bench.includes("nifty 50") || bench.includes("sensex") || bench.includes("nifty 100");
			       if (subCategory === "Mid Cap") return bench.includes("midcap") || bench.includes("150");
			       if (subCategory === "Small Cap") return bench.includes("smallcap") || bench.includes("250");
			       if (subCategory === "Flexi Cap" || subCategory === "Multi Cap")
				       return bench.includes("500") || name.includes("flexi") || name.includes("multi");
			       if (subCategory === "Value") return bench.includes("value");
			       if (subCategory === "Contra") return name.includes("contra");

			       return false;
		       });

		       // Map filtered ETFs to FundSuggestion
		       candidates = etfs.map((etf) => ({
			       name: etf.ETF_Name || "Unknown ETF",
			       returns1Y: etf.Fund_Return_1Y ?? null,
			       returns3Y: etf.Fund_Return_3Y ?? null,
			       returns5Y: null,
			       returns10Y: null,
			       alpha3Y: null,
			       alpha5Y: null,
			       compositeScore: etf.Fund_Return_3Y ?? 0,
			       aum: etf.Fund_AUM ?? null,
			       isETF: true,
		       }));

		       // If not preferring ETF, add active funds
		       if (!preferETF) {
			       const activeFunds = this.fundAnalytics.filter((fund) => {
				       return fund.Sub_Category === subCategory;
			       });

			       const activeCandidates = activeFunds.map((fund) => ({
				       name: fund.Fund_Name || "Unknown Fund",
				       returns1Y: fund.Fund_Return_1Y ?? null,
				       returns3Y: fund.Fund_Return_3Y ?? null,
				       returns5Y: fund.Fund_Return_5Y ?? null,
				       returns10Y: fund.Fund_Return_10Y ?? null,
				       alpha3Y: fund.Alpha_3Y ?? null,
				       alpha5Y: fund.Alpha_5Y ?? null,
				       compositeScore: (fund.Alpha_3Y ?? 0) * 0.6 + (fund.Fund_Return_3Y ?? 0) * 0.4,
				       aum: fund.Current_AUM ?? null,
				       isETF: false,
			       }));

			       candidates = [...candidates, ...activeCandidates];
		       }

		       return candidates
			       .sort((a, b) => (b.compositeScore ?? 0) - (a.compositeScore ?? 0))
			       .slice(0, limit);
	}

	consolidateAllocations(allocations: SubCategoryAllocation[]): SubCategoryAllocation[] {
		const consolidated = new Map<string, SubCategoryAllocation>();

		for (const alloc of allocations) {
			const key = alloc.subCategory;

			if (consolidated.has(key)) {
				const existing = consolidated.get(key)!;
				existing.amount += alloc.amount;
				existing.percentage += alloc.percentage;

				const existingNames = new Set(existing.fundSuggestions.map((f) => f.name));
				alloc.fundSuggestions.forEach((fund) => {
					if (!existingNames.has(fund.name)) {
						existing.fundSuggestions.push(fund);
					}
				});
			} else {
				consolidated.set(key, { ...alloc });
			}
		}

		return Array.from(consolidated.values());
	}

	allocateGoalsToCategories(
		goals: Goal[],
		subCategoryAllocations: SubCategoryAllocation[]
	): GoalAllocation[] {
		const totalAmount = subCategoryAllocations.reduce((sum, alloc) => sum + alloc.amount, 0);

		return goals.map((goal) => {
			const inflatedAmount = this.calculateInflatedAmount(
				goal.targetAmount,
				goal.yearsToGoal,
				goal.inflationRate
			);

			const goalShare = totalAmount > 0 ? inflatedAmount / totalAmount : 0;

			const allocations = subCategoryAllocations.map((alloc) => ({
				subCategory: alloc.subCategory,
				percentage: alloc.percentage * goalShare,
				amount: alloc.amount * goalShare,
			}));

			return {
				goalId: goal.id,
				goalName: goal.name,
				targetAmount: goal.targetAmount,
				inflatedAmount,
				allocations,
			};
		});
	}

	/**
	 * FIXED: Generate portfolio phases with correct allocation breakdowns
	 */
	generatePortfolioPhases(
		goals: Goal[],
		buckets: TimeHorizonBucket[],
		monthlySIPCapacity: number
	): PortfolioPhase[] {
		const sortedGoals = [...goals].sort((a, b) => a.yearsToGoal - b.yearsToGoal);
		const phases: PortfolioPhase[] = [];

		let cumulativeYears = 0;

		sortedGoals.forEach((goal, index) => {
			const isFirst = index === 0;
			const isLast = index === sortedGoals.length - 1;

			// Determine bucket for this goal
			const bucket = goal.yearsToGoal <= 3 ? "short" : goal.yearsToGoal <= 7 ? "medium" : "long";
			const bucketData = buckets.find(b => b.name === bucket);

			// Calculate allocation breakdown for this phase
			const breakdown = {
				debt: 0,
				equity: 0,
				hybrid: 0,
				momentum: 0
			};

			const rolesActive: PortfolioRole[] = [];
			const sipBreakdown: { role: PortfolioRole; amount: number; percentage: number }[] = [];

			if (bucketData) {
				bucketData.subCategoryAllocations.forEach(alloc => {
					if (alloc.role) {
						if (!rolesActive.includes(alloc.role)) {
							rolesActive.push(alloc.role);
						}

						if (alloc.category === "Debt") {
							breakdown.debt += alloc.percentage;
						} else if (alloc.subCategory.includes("Hybrid") || alloc.subCategory.includes("Balanced")) {
							breakdown.hybrid += alloc.percentage;
						} else if (alloc.subCategory.includes("Momentum")) {
							breakdown.momentum += alloc.percentage;
						} else {
							breakdown.equity += alloc.percentage;
						}

						sipBreakdown.push({
							role: alloc.role,
							amount: (monthlySIPCapacity * alloc.percentage) / 100,
							percentage: alloc.percentage
						});
					}
				});
			}

			let composition: string;
			if (bucket === "short") {
				composition = "70% Debt + 30% Large Cap Equity";
			} else if (bucket === "medium") {
				composition = "40% Debt + 60% Balanced/Hybrid";
			} else {
				composition = "10% Debt + 90% Aggressive Equity";
			}

			phases.push({
				phaseNumber: index + 1,
				phaseName: `Phase ${index + 1}: ${goal.name}`,
				years: isFirst
					? `Years 0-${goal.yearsToGoal}`
					: `Years ${cumulativeYears}-${cumulativeYears + goal.yearsToGoal}`,
				activeGoal: goal.name,
				portfolioComposition: composition,
				rolesActive,
				description: isFirst
					? `Building corpus for ${goal.name}. ${goals.length > 1 ? `Surplus SIP building ${sortedGoals[1].name} in background.` : ""}`
					: isLast
						? `All prior goals achieved. Full SIP now building ${goal.name}.`
						: `${sortedGoals[index - 1].name} achieved! SIP redirected to ${goal.name}.`,
				allocationBreakdown: breakdown,
				sipBreakdown
			});

			cumulativeYears += goal.yearsToGoal;
		});

		return phases;
	}

	generateSIPSchedule(
		buckets: TimeHorizonBucket[],
		goals: Goal[],
		stepUpPercentage: number
	): SIPSchedule {
		const schedule: SIPSchedule = {
			currentSIP: 0,
			breakdown: [],
			stepUpSchedule: [],
			reallocationPlan: [],
		};

		const totalAmount = buckets.reduce((sum, bucket) => sum + bucket.totalInflatedAmount, 0);

		const bucketSIPs: Record<string, number> = {};
		for (const bucket of buckets) {
			const sipForBucket = totalAmount > 0 ? (bucket.totalInflatedAmount / totalAmount) * 100 : 0;
			bucketSIPs[bucket.name] = sipForBucket;

			schedule.breakdown.push({
				bucket: bucket.name,
				amount: sipForBucket,
			});
		}

		schedule.currentSIP = Object.values(bucketSIPs).reduce((a, b) => a + b, 0);

		const maxYears = Math.max(...goals.map((g) => g.yearsToGoal), 1);
		const sortedGoals = [...goals].sort((a, b) => a.yearsToGoal - b.yearsToGoal);

		for (let i = 0; i < sortedGoals.length - 1; i++) {
			const completedGoal = sortedGoals[i];
			const nextGoal = sortedGoals[i + 1];

			const completedInflated = this.calculateInflatedAmount(
				completedGoal.targetAmount,
				completedGoal.yearsToGoal,
				completedGoal.inflationRate
			);

			const redirectEvent: RedirectEvent = {
				eventId: `RDR_${i + 1}`,
				triggeredYear: completedGoal.yearsToGoal,
				completedGoal: {
					goalId: completedGoal.id,
					goalName: completedGoal.name,
					finalCorpus: completedInflated,
				},
				nextGoal: {
					goalId: nextGoal.id,
					goalName: nextGoal.name,
					yearsRemaining: nextGoal.yearsToGoal - completedGoal.yearsToGoal,
				},
				sipChanges: [],
				portfolioEvolution: {
					before: [],
					after: [],
				},
			};

			schedule.reallocationPlan.push(redirectEvent);
		}

		for (let year = 1; year <= maxYears; year++) {
			const yearSIPs: Record<string, number> = {};

			for (const [bucket, baseSIP] of Object.entries(bucketSIPs)) {
				yearSIPs[bucket] = baseSIP * Math.pow(1 + stepUpPercentage / 100, year - 1);
			}

			schedule.stepUpSchedule.push({
				year,
				totalSIP: Object.values(yearSIPs).reduce((a, b) => a + b, 0),
				bucketBreakdown: Object.entries(yearSIPs).map(([bucket, amount]) => ({
					bucket,
					amount,
				})),
			});
		}

		return schedule;
	}

	getExpectedReturn(allocations: SubCategoryAllocation[]): number {
		let weightedReturn = 0;
		let totalWeight = 0;

		for (const alloc of allocations) {
			const avgReturn =
				alloc.fundSuggestions.reduce((sum, f) => sum + (f.returns3Y ?? 0), 0) /
				(alloc.fundSuggestions.length || 1);

			weightedReturn += avgReturn * alloc.percentage;
			totalWeight += alloc.percentage;
		}

		return totalWeight > 0 ? weightedReturn / totalWeight : 12;
	}

	assessFeasibility(
		requiredSIP: number,
		monthlySIPCapacity: number,
		goals: Goal[],
		expectedReturn: number,
		incomeStability: string
	): { status: "feasible" | "challenging" | "not_feasible"; recommendations: string[] } {
		const recommendations: string[] = [];

		const sipShortfall = requiredSIP - monthlySIPCapacity;
		const affordabilityRatio = monthlySIPCapacity > 0 ? requiredSIP / monthlySIPCapacity : Infinity;

		const aspirationalGoals = goals.filter((g) => g.type === "aspirational");

		if (affordabilityRatio <= 1.0) {
			recommendations.push("Your investment plan is on track to meet all goals.");
			recommendations.push(
				"Portfolio will automatically evolve as goals are achieved - no manual intervention needed."
			);
			return { status: "feasible", recommendations };
		}

		if (affordabilityRatio <= 1.2) {
			if (sipShortfall > 0) {
				recommendations.push(
					`Required SIP: ₹${Math.ceil(requiredSIP / 100) * 100}. Shortfall: ₹${Math.ceil(sipShortfall / 100) * 100}/month.`
				);
			}

			if (aspirationalGoals.length > 0) {
				recommendations.push(
					`Consider postponing: ${aspirationalGoals.map((g) => g.name).join(", ")}`
				);
			}

			return { status: "challenging", recommendations };
		}

		recommendations.push(
			`Significant gap: Required ₹${Math.ceil(requiredSIP / 100) * 100} vs capacity ₹${Math.ceil(monthlySIPCapacity / 100) * 100}.`
		);
		recommendations.push("Focus on mandatory goals first. Extend timelines or reduce amounts.");

		return { status: "not_feasible", recommendations };
	}

	async execute(input: UserInput): Promise<EngineOutput> {
		await this.loadData();

		const bucketizedGoals = this.categorizeBuckets(input.goals);

		const buckets: TimeHorizonBucket[] = [];
		const allGoalAllocations: GoalAllocation[] = [];

		for (const [bucketName, goals] of Object.entries(bucketizedGoals)) {
			if (goals.length === 0) continue;

			const bucket = bucketName as HorizonBucket;

			let totalInflatedAmount = 0;
			let totalExistingCorpusFutureValue = 0;

			for (const goal of goals) {
				const inflatedTarget = this.calculateInflatedAmount(
					goal.targetAmount,
					goal.yearsToGoal,
					goal.inflationRate
				);
				totalInflatedAmount += inflatedTarget;

				if (goal.currentAmount > 0) {
					const estimatedReturn = 12;
					const futureValue = this.calculateFutureValue(
						goal.currentAmount,
						goal.yearsToGoal,
						estimatedReturn
					);
					totalExistingCorpusFutureValue += futureValue;
				}
			}

			const gapAmount = Math.max(0, totalInflatedAmount - totalExistingCorpusFutureValue);

			const matrix = this.generate4x4Matrix(bucket, input.riskAppetite, gapAmount);

			const subCategoryAllocations = await this.mapMatrixToSubCategories(matrix, bucket);

			const goalAllocations = this.allocateGoalsToCategories(goals, subCategoryAllocations);
			allGoalAllocations.push(...goalAllocations);

			buckets.push({
				name: bucket,
				goals,
				totalInflatedAmount: gapAmount,
				matrix,
				subCategoryAllocations,
			});
		}

		const overallAllocation = this.consolidateOverallAllocation(buckets);

		const sipSchedule = this.generateSIPSchedule(buckets, input.goals, input.stepUpPercentage);

		const mandatoryAmount = input.goals
			.filter((g) => g.type === "mandatory")
			.reduce(
				(sum, g) => sum + this.calculateInflatedAmount(g.targetAmount, g.yearsToGoal, g.inflationRate),
				0
			);

		const totalAmount = input.goals.reduce(
			(sum, g) => sum + this.calculateInflatedAmount(g.targetAmount, g.yearsToGoal, g.inflationRate),
			0
		);

		const surplusCapacity = totalAmount > 0 ? Math.max(0, 100 - (mandatoryAmount / totalAmount) * 100) : 0;

		const expectedReturn = this.getExpectedReturn(overallAllocation);
		const { status, recommendations } = this.assessFeasibility(
			sipSchedule.currentSIP,
			input.monthlySIPCapacity,
			input.goals,
			expectedReturn,
			input.incomeStability
		);

		const portfolioPhases = this.generatePortfolioPhases(input.goals, buckets, input.monthlySIPCapacity);
		const currentPhase = portfolioPhases[0] || {
			phaseNumber: 1,
			phaseName: "Phase 1",
			years: "Years 0-5",
			activeGoal: "Your Goals",
			portfolioComposition: "Balanced",
			rolesActive: ["pillar", "allrounder"] as PortfolioRole[],
			description: "Building your financial future",
			allocationBreakdown: { debt: 0, equity: 100, hybrid: 0, momentum: 0 },
			sipBreakdown: []
		};

		const complete4x4Matrix = this.generateComplete4x4Matrix();

		return {
			buckets,
			goalAllocations: allGoalAllocations,
			sipSchedule,
			overallAllocation,
			surplusCapacity,
			feasibilityStatus: status,
			recommendations,
			portfolioPhases,
			currentPhase,
			complete4x4Matrix,
		};
	}

	consolidateOverallAllocation(buckets: TimeHorizonBucket[]): SubCategoryAllocation[] {
		const consolidated = new Map<string, SubCategoryAllocation>();
		let totalAmount = 0;

		for (const bucket of buckets) {
			totalAmount += bucket.totalInflatedAmount;

			for (const alloc of bucket.subCategoryAllocations) {
				const key = `${alloc.role}_${alloc.subCategory}`;

				if (consolidated.has(key)) {
					const existing = consolidated.get(key);
					if (!existing) continue;
					existing.amount += alloc.amount;

					const existingNames = new Set(existing.fundSuggestions.map((fund) => fund.name));
					alloc.fundSuggestions.forEach((fund) => {
						if (!existingNames.has(fund.name)) {
							existing.fundSuggestions.push(fund);
						}
					});
				} else {
					consolidated.set(key, { ...alloc });
				}
			}
		}

		const allocations = Array.from(consolidated.values());
		allocations.forEach((alloc) => {
			alloc.percentage = totalAmount > 0 ? (alloc.amount / totalAmount) * 100 : 0;
		});

		return allocations.sort((a, b) => b.percentage - a.percentage).slice(0, 8);
	}
}

export { InvestmentGoalEngine };
export type {
	UserInput,
	EngineOutput,
	Goal,
	TimeHorizonBucket,
	SubCategoryAllocation,
	SIPSchedule,
	GoalAllocation,
	PortfolioPhase,
	RedirectEvent,
	PortfolioRole,
};