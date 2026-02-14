// Investment goal planning engine with Dynamic Portfolio Evolution
// Based on the Nivesify 4x4 Matrix Proposal

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

	/**
	 * NEW: Determine which sub-category should use Active vs ETF
	 * Based on real data: Alpha > 1.5% AND Beat Rate > 65% → Active
	 */
	shouldUseActive(subCategory: string): boolean {
		   const insight = this.categoryInsights.find(
			   (i) => i.Level === "Sub-Category" && i.Sub_Category_Name === subCategory
		   );

		if (!insight) return false;

		const alpha = insight.Avg_Alpha_3Y ?? 0;
		const beatRate = insight.Pct_Funds_Beating_Benchmark_3Y ?? 0;

		// High alpha threshold: Active is better
		if (alpha > 1.5 && beatRate > 65) return true;

		// Low alpha: ETF is better
		if (alpha <= 0.5 || beatRate < 50) return false;

		// Borderline: check expense ratio or default to ETF
		return false;
	}

	/**
	 * NEW: Map portfolio roles to sub-categories based on 4x4 matrix
	 */
	getRoleForSubCategory(
		subCategory: string,
		bucket: HorizonBucket
	): { role: PortfolioRole; description: string } {
		// Debt categories → Anchor role
		if (
			subCategory.includes("Liquid") ||
			subCategory.includes("Money Market") ||
			subCategory.includes("Short Duration")
		) {
			return { role: "anchor", description: "Safety & Liquidity for near-term goals" };
		}

		// Large Cap Core → Pillar role
		if (subCategory === "Large Cap") {
			return { role: "pillar", description: "Core equity exposure with minimal tracking error" };
		}

		// Value/Contra → Contrarian role
		if (subCategory === "Value" || subCategory === "Contra" || subCategory === "Dividend Yield") {
			return { role: "contrarian", description: "Defensive alpha through value/contrarian strategy" };
		}

		// Momentum → Speedster role
		if (subCategory.includes("Momentum") || subCategory.includes("Alpha")) {
			return { role: "speedster", description: "Captures trending strength via momentum/alpha" };
		}

		// Active Mid/Small (only if alpha is positive) → Compounder role
		if ((subCategory === "Mid Cap" || subCategory === "Small Cap") && this.shouldUseActive(subCategory)) {
			return { role: "compounder", description: "Long-term wealth via high-growth segments" };
		}

		// Flexi/Multi Cap → All-Rounder role
		if (subCategory === "Flexi Cap" || subCategory === "Multi Cap") {
			return { role: "allrounder", description: "Broad market coverage across all cap sizes" };
		}

		// Hybrid funds → Stabilizer role
		if (
			subCategory.includes("Balanced") ||
			subCategory.includes("Hybrid") ||
			subCategory.includes("Multi Asset")
		) {
			return { role: "stabilizer", description: "Balanced risk-return for medium-term goals" };
		}

		// Default fallback
		return { role: "allrounder", description: "Diversified exposure" };
	}

	/**
	 * NEW: Generate 4x4 matrix allocation based on active goal
	 * Phase 1 (0-3 years): 70% Debt + 30% Large Cap
	 * Phase 2 (3-7 years): 40% Debt + 60% Balanced
	 * Phase 3 (7+ years): 10% Debt + 90% Equity
	 */
	generate4x4Matrix(
		bucket: HorizonBucket,
		riskAppetite: RiskAppetite,
		totalAmount: number
	): MatrixAllocation[] {
		const matrix: MatrixAllocation[] = [];

		// Define allocation based on active goal timeline
		let baseAllocation: Record<string, number>;

		if (bucket === "short") {
			// Phase 1: Focus on safety
			baseAllocation = {
				debt: 70,
				largeCap: 30,
			};
		} else if (bucket === "medium") {
			// Phase 2: Balanced approach
			baseAllocation = {
				debt: 40,
				largeCap: 20,
				midCap: 20,
				flexi: 20,
			};
		} else {
			// Phase 3: Maximum growth
			const aggressive = riskAppetite === "aggressive";
			const moderate = riskAppetite === "moderate";

			baseAllocation = {
				debt: 10,
				largeCap: aggressive ? 20 : moderate ? 25 : 30,
				midCap: aggressive ? 30 : moderate ? 25 : 20,
				smallCap: aggressive ? 25 : moderate ? 20 : 15,
				flexi: aggressive ? 15 : moderate ? 20 : 25,
			};
		}

		// Build matrix cells
		for (const [cap, percentage] of Object.entries(baseAllocation)) {
			if (percentage === 0) continue;

			const capSize = cap === "flexi" ? "total" : (cap.replace("Cap", "") as CapSize);
			const style: Style = cap === "debt" ? "debt" : "growth";

			matrix.push({
				capSize,
				style,
				percentage,
				amount: (totalAmount * percentage) / 100,
			});
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
				subCategory = "Large Cap";
			} else if (capSize === "mid") {
				subCategory = "Mid Cap";
			} else if (capSize === "small") {
				subCategory = "Small Cap";
			} else if (capSize === "total") {
				subCategory = "Flexi Cap";
			} else {
				subCategory = "Large Cap";
			}

			// Determine if we should use Active or ETF
			const useActive = this.shouldUseActive(subCategory);
			const fundSuggestions = await this.selectTopFunds(subCategory, category, 3, !useActive);

			// Get role assignment
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

		// Fetch ETFs for this subcategory
		   const etfs = this.etfAnalytics.filter((etf) => {
			   const bench = etf.Benchmark_Name?.toLowerCase() || "";
			   const name = etf.ETF_Name?.toLowerCase() || "";

			   if (subCategory === "Liquid") return bench.includes("liquid");
			   if (subCategory === "Short Duration") return bench.includes("short");
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

		   candidates = etfs.map((etf) => ({
			   name: etf.ETF_Name || "Unknown ETF",
			   returns1Y: etf.Fund_Return_1Y ?? null,
			   returns3Y: etf.Fund_Return_3Y ?? null,
			   returns5Y: null,
			   returns10Y: null,
			   alpha3Y: null,
			   alpha5Y: null,
			   compositeScore: etf.ETF_Score ?? 0,
			   aum: etf.Fund_AUM ?? null,
			   isETF: true,
		   }));

		// If we want active funds and they have good alpha
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

		// Sort by composite score and return top N
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

				// Merge fund suggestions without duplicates
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
	 * NEW: Generate portfolio evolution phases
	 */
	generatePortfolioPhases(goals: Goal[]): PortfolioPhase[] {
		const sortedGoals = [...goals].sort((a, b) => a.yearsToGoal - b.yearsToGoal);
		const phases: PortfolioPhase[] = [];

		let cumulativeYears = 0;

		sortedGoals.forEach((goal, index) => {
			const isFirst = index === 0;
			const isLast = index === sortedGoals.length - 1;

			let rolesActive: PortfolioRole[];
			let composition: string;

			if (goal.yearsToGoal <= 3) {
				// Short-term goal
				rolesActive = ["anchor", "pillar"];
				composition = "70% Debt + 30% Large Cap";
			} else if (goal.yearsToGoal <= 7) {
				// Medium-term goal
				rolesActive = ["anchor", "pillar", "stabilizer", "allrounder"];
				composition = "40% Debt + 60% Balanced/Equity";
			} else {
				// Long-term goal
				rolesActive = ["anchor", "pillar", "contrarian", "speedster", "allrounder"];
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
			});

			cumulativeYears += goal.yearsToGoal;
		});

		return phases;
	}

	/**
	 * NEW: Generate redirect events when goals complete
	 */
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

		// Generate redirect events
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
				sipChanges: [
					{
						action: "STOP",
						subCategory: "Liquid/Debt",
						oldSIP: 70,
						newSIP: 0,
					},
					{
						action: "INCREASE",
						subCategory: "Equity",
						oldSIP: 30,
						newSIP: 90,
					},
				],
				portfolioEvolution: {
					before: [],
					after: [],
				},
			};

			schedule.reallocationPlan.push(redirectEvent);
		}

		// Generate step-up schedule
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
		const totalTargetAmount = goals.reduce(
			(sum, g) => sum + this.calculateInflatedAmount(g.targetAmount, g.yearsToGoal, g.inflationRate),
			0
		);

		const sipShortfall = requiredSIP - monthlySIPCapacity;
		const affordabilityRatio = monthlySIPCapacity > 0 ? requiredSIP / monthlySIPCapacity : Infinity;

		const mandatoryGoals = goals.filter((g) => g.type === "mandatory");
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
		recommendations.push("Focus on mandatory goals first. Extend timelines or reduce target amounts.");

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
					const futureValue = this.calculateFutureValue(goal.currentAmount, goal.yearsToGoal, estimatedReturn);
					totalExistingCorpusFutureValue += futureValue;
				}
			}

			const gapAmount = Math.max(0, totalInflatedAmount - totalExistingCorpusFutureValue);

			// Use new 4x4 matrix logic
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

		// Generate portfolio phases
		const portfolioPhases = this.generatePortfolioPhases(input.goals);
		const currentPhase = portfolioPhases[0] || {
			phaseNumber: 1,
			phaseName: "Phase 1",
			years: "Years 0-5",
			activeGoal: "Your Goals",
			portfolioComposition: "Balanced",
			rolesActive: ["pillar", "allrounder"],
			description: "Building your financial future",
		};

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
		};
	}

	consolidateOverallAllocation(buckets: TimeHorizonBucket[]): SubCategoryAllocation[] {
		const consolidated = new Map<string, SubCategoryAllocation>();
		let totalAmount = 0;

		for (const bucket of buckets) {
			totalAmount += bucket.totalInflatedAmount;

			for (const alloc of bucket.subCategoryAllocations) {
				const key = alloc.subCategory;

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

		// Prune allocations < 5% and merge into All-Rounder
		const pruned = allocations.filter((a) => a.percentage >= 5);
		const smallAllocations = allocations.filter((a) => a.percentage < 5);

		if (smallAllocations.length > 0 && pruned.length > 0) {
			// Find or create All-Rounder
			let allRounder = pruned.find((a) => a.role === "allrounder");
			if (!allRounder) {
				allRounder = pruned[0];
			}

			smallAllocations.forEach((small) => {
				allRounder!.percentage += small.percentage;
				allRounder!.amount += small.amount;
			});
		}

		return pruned.sort((a, b) => b.percentage - a.percentage).slice(0, 7);
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