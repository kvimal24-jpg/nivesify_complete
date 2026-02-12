// Investment goal planning engine.

import type { FundAnalytics, ETFAnalytics, CategoryInsights } from "@/lib/fund-types";

type GoalType = "mandatory" | "aspirational";

type RiskAppetite = "conservative" | "moderate" | "aggressive";

type HorizonBucket = "short" | "medium" | "long";

type CapSize = "large" | "mid" | "small" | "debt";

type Style = "growth" | "value" | "momentum" | "debt";

interface Goal {
	id: string;
	name: string;
	type: GoalType;
	currentAmount: number;
	targetAmount: number;
	yearsToGoal: number;
	inflationRate: number;
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
	reallocationPlan: {
		year: number;
		completedGoals: string[];
		newAllocations: {
			bucket: string;
			percentage: number;
		}[];
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

	// Calculate future value of existing corpus with expected returns
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

	generateMatrixAllocation(
		bucket: HorizonBucket,
		riskAppetite: RiskAppetite,
		totalAmount: number
	): MatrixAllocation[] {
		const matrices: Record<HorizonBucket, Record<RiskAppetite, Record<string, number>>> = {
			short: {
				conservative: { largeCap: 40, midCap: 20, smallCap: 10, debt: 30 },
				moderate: { largeCap: 45, midCap: 25, smallCap: 15, debt: 15 },
				aggressive: { largeCap: 50, midCap: 30, smallCap: 20, debt: 0 },
			},
			medium: {
				conservative: { largeCap: 35, midCap: 25, smallCap: 15, debt: 25 },
				moderate: { largeCap: 40, midCap: 30, smallCap: 20, debt: 10 },
				aggressive: { largeCap: 35, midCap: 35, smallCap: 30, debt: 0 },
			},
			long: {
				conservative: { largeCap: 30, midCap: 30, smallCap: 20, debt: 20 },
				moderate: { largeCap: 30, midCap: 35, smallCap: 25, debt: 10 },
				aggressive: { largeCap: 25, midCap: 40, smallCap: 35, debt: 0 },
			},
		};

		const baseAllocation = matrices[bucket][riskAppetite];
		const styleDistribution = this.getStyleDistribution(bucket);

		const matrix: MatrixAllocation[] = [];

		["largeCap", "midCap", "smallCap"].forEach((cap) => {
			const capPercentage = baseAllocation[cap] || 0;
			if (capPercentage === 0) return;

			const capSize = cap.replace("Cap", "") as CapSize;

			["growth", "value", "momentum"].forEach((style) => {
				const stylePerc = styleDistribution[style as keyof typeof styleDistribution];
				const finalPerc = (capPercentage * stylePerc) / 100;

				if (finalPerc > 0) {
					matrix.push({
						capSize,
						style: style as Style,
						percentage: finalPerc,
						amount: (totalAmount * finalPerc) / 100,
					});
				}
			});
		});

		if (baseAllocation.debt > 0) {
			matrix.push({
				capSize: "debt",
				style: "debt",
				percentage: baseAllocation.debt,
				amount: (totalAmount * baseAllocation.debt) / 100,
			});
		}

		return matrix;
	}

	getStyleDistribution(bucket: HorizonBucket): { growth: number; value: number; momentum: number } {
		const distributions = {
			short: { growth: 30, value: 40, momentum: 30 },
			medium: { growth: 40, value: 35, momentum: 25 },
			long: { growth: 50, value: 30, momentum: 20 },
		};
		return distributions[bucket];
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
				if (style === "growth") subCategory = "Large Cap";
				else if (style === "value") subCategory = "Value";
				else subCategory = "Large Cap";
			} else if (capSize === "mid") {
				subCategory = "Mid Cap";
			} else {
				subCategory = "Small Cap";
			}

			const fundSuggestions = await this.selectTopFunds(subCategory, category, 3);

			allocations.push({
				subCategory,
				category,
				percentage,
				amount,
				isPassive: fundSuggestions.some((f) => f.isETF),
				fundSuggestions,
			});
		}

		return this.consolidateAllocations(allocations);
	}

	getCategoryPerformance(capSize: CapSize, style: Style): { activeAlpha: number } {
		if (capSize === "debt") return { activeAlpha: 0 };

		const categoryMap: Record<string, string> = {
			"large-growth": "Large Cap",
			"large-value": "Value",
			"large-momentum": "Large Cap",
			"mid-growth": "Mid Cap",
			"mid-value": "Mid Cap",
			"mid-momentum": "Mid Cap",
			"small-growth": "Small Cap",
			"small-value": "Small Cap",
			"small-momentum": "Small Cap",
		};

		const subCategory = categoryMap[`${capSize}-${style}`];
		const categoryFunds = this.fundAnalytics.filter((f) => f.Sub_Category === subCategory);

		if (categoryFunds.length === 0) return { activeAlpha: 0 };

		const avgAlpha3Y =
			categoryFunds.reduce((sum, f) => sum + (f.Alpha_3Y || 0), 0) / categoryFunds.length;
		const avgAlpha5Y =
			categoryFunds.reduce((sum, f) => sum + (f.Alpha_5Y || 0), 0) / categoryFunds.length;

		return { activeAlpha: (avgAlpha3Y + avgAlpha5Y) / 2 / 100 };
	}

	getDebtSubCategory(bucket: HorizonBucket): string {
		const debtMap = {
			short: "Liquid",
			medium: "Short Duration",
			long: "Medium to Long Duration",
		};
		return debtMap[bucket];
	}

	async selectTopFunds(
		subCategory: string,
		category: string,
		count: number
	): Promise<FundSuggestion[]> {
		const suggestions: FundSuggestion[] = [];

		// 1. Get top active funds by Composite_Score
		const activeFunds = this.fundAnalytics
			.filter((f) => f.Sub_Category === subCategory && f.Category === category)
			.filter((f) => f.Composite_Score != null && f.Composite_Score > 0)
			.sort((a, b) => (b.Composite_Score ?? 0) - (a.Composite_Score ?? 0))
			.slice(0, 5);

		// 2. Get relevant passive ETFs/Index funds by ETF_Score
		const keywordMap: Record<string, string[]> = {
			"Large Cap": ["nifty 50", "sensex", "nifty 100", "nifty next 50"],
			"Mid Cap": ["nifty midcap", "nifty mid"],
			"Small Cap": ["nifty smallcap", "nifty small"],
			Value: ["value"],
			Liquid: ["liquid"],
			"Short Duration": ["short duration"],
			"Medium to Long Duration": ["duration", "gilt"],
		};
		const keywords = keywordMap[subCategory] ?? [subCategory.toLowerCase()];

		const relevantETFs = this.etfAnalytics
			.filter((e) => {
				const name = e.ETF_Name.toLowerCase();
				return keywords.some((keyword) => name.includes(keyword));
			})
			.filter((e) => e.ETF_Score != null && e.ETF_Score > 0)
			.sort((a, b) => (b.ETF_Score ?? 0) - (a.ETF_Score ?? 0))
			.slice(0, 2);

		// 3. Decide: For Large Cap, always include best passive option
		//    For Mid/Small Cap, include passive if high quality (score > 75)
		const shouldIncludePassive =
			subCategory === "Large Cap" ||
			subCategory === "Liquid" ||
			(relevantETFs.length > 0 && (relevantETFs[0]?.ETF_Score ?? 0) > 75);

		// 4. Build final suggestions
		if (shouldIncludePassive && relevantETFs.length > 0) {
			// Add best passive option first
			const topETF = relevantETFs[0];
			suggestions.push({
				name: topETF.ETF_Name,
				returns1Y: topETF.Fund_Return_1Y ?? null,
				returns3Y: topETF.Fund_Return_3Y ?? null,
				returns5Y: null,
				returns10Y: null,
				alpha3Y: null,
				alpha5Y: null,
				compositeScore: topETF.ETF_Score ?? null,
				aum: topETF.Fund_AUM ?? null,
				isETF: true,
			});

			// Add remaining as active funds
			const remainingCount = count - 1;
			activeFunds.slice(0, remainingCount).forEach((f) => {
				suggestions.push({
					name: f.Fund_Name,
					returns1Y: f.Fund_Return_1Y ?? null,
					returns3Y: f.Fund_Return_3Y ?? null,
					returns5Y: f.Fund_Return_5Y ?? null,
					returns10Y: f.Fund_Return_10Y ?? null,
					alpha3Y: f.Alpha_3Y ?? null,
					alpha5Y: f.Alpha_5Y ?? null,
					compositeScore: f.Composite_Score ?? null,
					aum: f.Current_AUM ?? null,
					isETF: false,
				});
			});
		} else {
			// Add only active funds
			activeFunds.slice(0, count).forEach((f) => {
				suggestions.push({
					name: f.Fund_Name,
					returns1Y: f.Fund_Return_1Y ?? null,
					returns3Y: f.Fund_Return_3Y ?? null,
					returns5Y: f.Fund_Return_5Y ?? null,
					returns10Y: f.Fund_Return_10Y ?? null,
					alpha3Y: f.Alpha_3Y ?? null,
					alpha5Y: f.Alpha_5Y ?? null,
					compositeScore: f.Composite_Score ?? null,
					aum: f.Current_AUM ?? null,
					isETF: false,
				});
			});
		}

		return suggestions;
	}

	consolidateAllocations(allocations: SubCategoryAllocation[]): SubCategoryAllocation[] {
		const consolidated = new Map<string, SubCategoryAllocation>();

		for (const alloc of allocations) {
			const key = alloc.subCategory;

			if (consolidated.has(key)) {
				const existing = consolidated.get(key);
				if (!existing) continue;
				existing.percentage += alloc.percentage;
				existing.amount += alloc.amount;

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

		return Array.from(consolidated.values()).sort((a, b) => b.percentage - a.percentage);
	}

	calculateSIPWithStepUp(
		targetAmount: number,
		years: number,
		expectedReturn: number,
		stepUpPercentage: number
	): number {
		const r = expectedReturn / 12 / 100;
		const n = years * 12;
		const s = stepUpPercentage / 100;

		if (s === 0) {
			const numerator = targetAmount * r;
			const denominator = Math.pow(1 + r, n) - 1;
			return numerator / denominator;
		}

		let sip = targetAmount / (n * 1.5);
		let iterations = 0;
		const maxIterations = 100;

		while (iterations < maxIterations) {
			let futureValue = 0;
			let currentSIP = sip;

			for (let year = 0; year < years; year++) {
				for (let month = 0; month < 12; month++) {
					const monthsRemaining = (years - year) * 12 - month;
					futureValue += currentSIP * Math.pow(1 + r, monthsRemaining);
				}
				currentSIP *= 1 + s;
			}

			const difference = futureValue - targetAmount;
			if (Math.abs(difference) < 100) break;

			sip *= 1 - difference / futureValue / 2;
			iterations++;
		}

		return Math.ceil(sip / 100) * 100;
	}

	getExpectedReturn(allocations: SubCategoryAllocation[]): number {
		let totalReturn = 0;
		let totalWeight = 0;

		for (const alloc of allocations) {
			const categoryFunds = this.fundAnalytics.filter((f) => f.Sub_Category === alloc.subCategory);

			if (categoryFunds.length > 0) {
				const returns = categoryFunds
					.map((fund) => {
						let ret = 0;
						let count = 0;
						if (fund.Fund_Return_5Y) {
							ret += fund.Fund_Return_5Y;
							count += 1;
						}
						if (fund.Fund_Return_10Y) {
							ret += fund.Fund_Return_10Y;
							count += 1;
						}
						return count > 0 ? ret / count : 0;
					})
					.filter((value) => value > 0);

				const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
				totalReturn += avgReturn * alloc.percentage;
				totalWeight += alloc.percentage;
			}
		}

		return totalWeight > 0 ? totalReturn / totalWeight : 12;
	}

	allocateGoalsToCategories(
		goals: Goal[],
		subCategoryAllocations: SubCategoryAllocation[]
	): GoalAllocation[] {
		const goalAllocations: GoalAllocation[] = [];

		for (const goal of goals) {
			const inflatedAmount = this.calculateInflatedAmount(
				goal.targetAmount,
				goal.yearsToGoal,
				goal.inflationRate
			);

			const allocations = subCategoryAllocations.map((alloc) => ({
				subCategory: alloc.subCategory,
				percentage: alloc.percentage,
				amount: (inflatedAmount * alloc.percentage) / 100,
			}));

			goalAllocations.push({
				goalId: goal.id,
				goalName: goal.name,
				targetAmount: goal.targetAmount,
				inflatedAmount,
				allocations,
			});
		}

		return goalAllocations;
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

		const bucketSIPs: Record<string, number> = {};

		for (const bucket of buckets) {
			const expectedReturn = this.getExpectedReturn(bucket.subCategoryAllocations);
			const maxYears = Math.max(...bucket.goals.map((g) => g.yearsToGoal), 1);

			const sip = this.calculateSIPWithStepUp(
				bucket.totalInflatedAmount,
				maxYears,
				expectedReturn,
				stepUpPercentage
			);

			bucketSIPs[bucket.name] = sip;
			schedule.breakdown.push({
				bucket: bucket.name,
				amount: sip,
			});
		}

		schedule.currentSIP = Object.values(bucketSIPs).reduce((a, b) => a + b, 0);

		const maxYears = Math.max(...goals.map((g) => g.yearsToGoal), 1);

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

			const completedGoals = goals.filter((g) => g.yearsToGoal === year);

			if (completedGoals.length > 0) {
				const completedBucket = year <= 3 ? "short" : year <= 7 ? "medium" : "long";
				const remainingBuckets = buckets.filter((bucket) => bucket.name !== completedBucket);

				if (remainingBuckets.length > 0) {
					const totalRemainingAmount = remainingBuckets.reduce(
						(sum, bucket) => sum + bucket.totalInflatedAmount,
						0
					);

					schedule.reallocationPlan.push({
						year,
						completedGoals: completedGoals.map((goal) => goal.name),
						newAllocations: remainingBuckets.map((bucket) => ({
							bucket: bucket.name,
							percentage: (bucket.totalInflatedAmount / totalRemainingAmount) * 100,
						})),
					});
				}
			}
		}

		return schedule;
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

		// Check if user can afford the required SIP
		const sipShortfall = requiredSIP - monthlySIPCapacity;
		const affordabilityRatio = monthlySIPCapacity > 0 ? requiredSIP / monthlySIPCapacity : Infinity;

		const mandatoryGoals = goals.filter((g) => g.type === "mandatory");
		const aspirationalGoals = goals.filter((g) => g.type === "aspirational");

		const maxYears = Math.max(...goals.map((g) => g.yearsToGoal), 1);
		const monthlyReturn = expectedReturn / 12 / 100;
		const totalMonths = maxYears * 12;

		// Calculate what can be achieved with user's capacity
		const achievableAmount =
			monthlySIPCapacity *
			((Math.pow(1 + monthlyReturn, totalMonths) - 1) / monthlyReturn) *
			(1 + monthlyReturn);

		const goalShortfall = totalTargetAmount - achievableAmount;
		const goalShortfallPercentage = (goalShortfall / totalTargetAmount) * 100;

		// Assess based on affordability and income stability
		if (affordabilityRatio <= 1.0 && goalShortfallPercentage < 5) {
			recommendations.push("Your investment plan is on track to meet all goals.");
			if (incomeStability === "variable" || incomeStability === "uncertain") {
				recommendations.push(
					"Consider building an emergency fund alongside your SIP for income stability."
				);
			}
			return { status: "feasible", recommendations };
		}

		if (affordabilityRatio <= 1.2 && goalShortfallPercentage < 20) {
			if (sipShortfall > 0) {
				recommendations.push(
					`Required SIP: ₹${Math.ceil(requiredSIP / 100) * 100}. You can invest: ₹${Math.ceil(monthlySIPCapacity / 100) * 100}. Shortfall: ₹${Math.ceil(sipShortfall / 100) * 100}/month.`
				);
			}

			if (aspirationalGoals.length > 0) {
				recommendations.push(
					`Consider postponing or reducing: ${aspirationalGoals.map((g) => g.name).join(", ")}`
				);
			}

			if (incomeStability === "stable") {
				recommendations.push("With stable income, consider annual step-ups to bridge the gap.");
			}

			return { status: "challenging", recommendations };
		}

		// Not feasible
		recommendations.push(
			`Significant gap: Required SIP ₹${Math.ceil(requiredSIP / 100) * 100} vs your capacity ₹${Math.ceil(monthlySIPCapacity / 100) * 100}.`
		);

		if (mandatoryGoals.length > 0 && aspirationalGoals.length > 0) {
			recommendations.push("Focus on mandatory goals first. Aspirational goals can be pursued later.");
		}

		recommendations.push(
			"Consider: 1) Extending timelines, 2) Reducing target amounts, 3) Increasing income sources."
		);

		if (incomeStability === "uncertain") {
			recommendations.push(
				"With uncertain income, prioritize building emergency fund before aggressive investing."
			);
		}

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

			// Calculate total inflated target
			let totalInflatedAmount = 0;
			let totalExistingCorpusFutureValue = 0;

			for (const goal of goals) {
				const inflatedTarget = this.calculateInflatedAmount(
					goal.targetAmount,
					goal.yearsToGoal,
					goal.inflationRate
				);
				totalInflatedAmount += inflatedTarget;

				// If user has existing corpus, calculate its future value
				if (goal.currentAmount > 0) {
					// Use a moderate expected return for existing corpus growth
					const estimatedReturn = 12; // Conservative estimate
					const futureValue = this.calculateFutureValue(
						goal.currentAmount,
						goal.yearsToGoal,
						estimatedReturn
					);
					totalExistingCorpusFutureValue += futureValue;
				}
			}

			// Calculate the GAP that needs to be filled via SIP
			const gapAmount = Math.max(0, totalInflatedAmount - totalExistingCorpusFutureValue);

			const matrix = this.generateMatrixAllocation(bucket, input.riskAppetite, gapAmount);

			const subCategoryAllocations = await this.mapMatrixToSubCategories(matrix, bucket);

			const goalAllocations = this.allocateGoalsToCategories(goals, subCategoryAllocations);
			allGoalAllocations.push(...goalAllocations);

			buckets.push({
				name: bucket,
				goals,
				totalInflatedAmount: gapAmount, // Use gap, not full inflated amount
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

		return {
			buckets,
			goalAllocations: allGoalAllocations,
			sipSchedule,
			overallAllocation,
			surplusCapacity,
			feasibilityStatus: status,
			recommendations,
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
};
