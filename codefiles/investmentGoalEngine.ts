// Investment Goal Planning Engine
// Handles goal categorization, asset allocation, fund selection, and SIP calculation

interface Goal {
  id: string;
  name: string;
  type: 'mandatory' | 'aspirational';
  currentAmount: number;
  targetAmount: number;
  yearsToGoal: number;
  inflationRate: number;
}

interface UserInput {
  goals: Goal[];
  stepUpPercentage: number;
  riskAppetite: 'conservative' | 'moderate' | 'aggressive';
}

interface MatrixAllocation {
  capSize: 'large' | 'mid' | 'small';
  style: 'growth' | 'value' | 'momentum';
  percentage: number;
  amount: number;
}

interface SubCategoryAllocation {
  subCategory: string;
  category: string;
  percentage: number;
  amount: number;
  isPassive: boolean;
  fundSuggestions: FundSuggestion[];
}

interface FundSuggestion {
  name: string;
  returns5Y: number;
  returns10Y: number;
  alpha3Y: number;
  alpha5Y: number;
  compositeScore: number;
  aum: number;
  isETF: boolean;
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
  name: 'short' | 'medium' | 'long';
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
  feasibilityStatus: 'feasible' | 'challenging' | 'not_feasible';
  recommendations: string[];
}

class InvestmentGoalEngine {
  private rawData: any[] = [];
  private fundAnalytics: any[] = [];
  private etfAnalytics: any[] = [];
  private categoryInsights: any[] = [];

  async loadData() {
    try {
      // Load all data files from R2 bucket
      const bucketUrl = 'https://your-bucket-url/mf-data-bucket/data/latest';
      
      const [raw, funds, etfs, insights] = await Promise.all([
        fetch(`${bucketUrl}/amfi_raw_latest.json`).then(r => r.json()),
        fetch(`${bucketUrl}/data_latest_fund-analytics.json`).then(r => r.json()),
        fetch(`${bucketUrl}/data_latest_etf-analytics.json`).then(r => r.json()),
        fetch(`${bucketUrl}/data_latest_industry-and-category-insights.json`).then(r => r.json())
      ]);

      this.rawData = raw;
      this.fundAnalytics = funds;
      this.etfAnalytics = etfs;
      this.categoryInsights = insights;
    } catch (error) {
      console.error('Error loading data:', error);
      throw new Error('Failed to load fund data');
    }
  }

  calculateInflatedAmount(currentAmount: number, years: number, inflationRate: number): number {
    return currentAmount * Math.pow(1 + inflationRate / 100, years);
  }

  categorizeBuckets(goals: Goal[]): { short: Goal[], medium: Goal[], long: Goal[] } {
    return {
      short: goals.filter(g => g.yearsToGoal <= 3),
      medium: goals.filter(g => g.yearsToGoal > 3 && g.yearsToGoal <= 7),
      long: goals.filter(g => g.yearsToGoal > 7)
    };
  }

  // Dynamic matrix allocation based on time horizon and risk appetite
  generateMatrixAllocation(
    bucket: 'short' | 'medium' | 'long',
    riskAppetite: string,
    totalAmount: number
  ): MatrixAllocation[] {
    const matrices: { [key: string]: { [key: string]: number } } = {
      short: {
        conservative: { largeCap: 40, midCap: 20, smallCap: 10, debt: 30 },
        moderate: { largeCap: 45, midCap: 25, smallCap: 15, debt: 15 },
        aggressive: { largeCap: 50, midCap: 30, smallCap: 20, debt: 0 }
      },
      medium: {
        conservative: { largeCap: 35, midCap: 25, smallCap: 15, debt: 25 },
        moderate: { largeCap: 40, midCap: 30, smallCap: 20, debt: 10 },
        aggressive: { largeCap: 35, midCap: 35, smallCap: 30, debt: 0 }
      },
      long: {
        conservative: { largeCap: 30, midCap: 30, smallCap: 20, debt: 20 },
        moderate: { largeCap: 30, midCap: 35, smallCap: 25, debt: 10 },
        aggressive: { largeCap: 25, midCap: 40, smallCap: 35, debt: 0 }
      }
    };

    const baseAllocation = matrices[bucket][riskAppetite];
    
    // Calculate style split within each cap size (Growth/Value/Momentum)
    const styleDistribution = this.getStyleDistribution(bucket);
    
    const matrix: MatrixAllocation[] = [];
    
    ['largeCap', 'midCap', 'smallCap'].forEach(cap => {
      const capPercentage = baseAllocation[cap] || 0;
      if (capPercentage === 0) return;
      
      const capSize = cap.replace('Cap', '') as 'large' | 'mid' | 'small';
      
      ['growth', 'value', 'momentum'].forEach(style => {
        const stylePerc = styleDistribution[style as keyof typeof styleDistribution];
        const finalPerc = (capPercentage * stylePerc) / 100;
        
        if (finalPerc > 0) {
          matrix.push({
            capSize,
            style: style as 'growth' | 'value' | 'momentum',
            percentage: finalPerc,
            amount: (totalAmount * finalPerc) / 100
          });
        }
      });
    });

    // Add debt allocation if present
    if (baseAllocation.debt > 0) {
      matrix.push({
        capSize: 'large' as any, // Using as placeholder for debt
        style: 'value' as any, // Using as placeholder for debt
        percentage: baseAllocation.debt,
        amount: (totalAmount * baseAllocation.debt) / 100
      });
    }

    return matrix;
  }

  getStyleDistribution(bucket: 'short' | 'medium' | 'long'): { growth: number, value: number, momentum: number } {
    // Dynamic style allocation based on time horizon
    const distributions = {
      short: { growth: 30, value: 40, momentum: 30 }, // More value for stability
      medium: { growth: 40, value: 35, momentum: 25 }, // Balanced
      long: { growth: 50, value: 30, momentum: 20 } // More growth for long term
    };
    return distributions[bucket];
  }

  // Map matrix to sub-categories with passive/active fund selection
  async mapMatrixToSubCategories(
    matrix: MatrixAllocation[],
    bucket: 'short' | 'medium' | 'long'
  ): Promise<SubCategoryAllocation[]> {
    const allocations: SubCategoryAllocation[] = [];
    const passiveThreshold = 0.015; // 1.5% - If active funds don't beat benchmark by this, use passive

    for (const cell of matrix) {
      const { capSize, style, percentage, amount } = cell;
      
      // Determine if we should use passive or active funds
      const categoryPerformance = this.getCategoryPerformance(capSize, style);
      const usePassive = categoryPerformance.activeAlpha < passiveThreshold;

      let subCategory: string;
      let category: string = 'Equity';

      // Map to actual sub-categories
      if (capSize === 'large') {
        if (style === 'growth') subCategory = 'Large Cap';
        else if (style === 'value') subCategory = 'Value';
        else subCategory = 'Large Cap'; // Momentum via index
      } else if (capSize === 'mid') {
        subCategory = 'Mid Cap';
      } else if (capSize === 'small') {
        subCategory = 'Small Cap';
      } else {
        // Debt allocation
        subCategory = this.getDebtSubCategory(bucket);
        category = 'Debt';
      }

      // Get fund suggestions
      const fundSuggestions = await this.selectTopFunds(
        subCategory,
        category,
        usePassive,
        2 // Top 2 funds
      );

      allocations.push({
        subCategory,
        category,
        percentage,
        amount,
        isPassive: usePassive,
        fundSuggestions
      });
    }

    // Consolidate similar sub-categories
    return this.consolidateAllocations(allocations);
  }

  getCategoryPerformance(capSize: string, style: string): { activeAlpha: number } {
    // Calculate average alpha for active funds in this category
    const categoryMap: { [key: string]: string } = {
      'large-growth': 'Large Cap',
      'large-value': 'Value',
      'large-momentum': 'Large Cap',
      'mid-growth': 'Mid Cap',
      'mid-value': 'Mid Cap',
      'mid-momentum': 'Mid Cap',
      'small-growth': 'Small Cap',
      'small-value': 'Small Cap',
      'small-momentum': 'Small Cap'
    };

    const subCategory = categoryMap[`${capSize}-${style}`];
    const categoryFunds = this.fundAnalytics.filter(f => f.Sub_Category === subCategory);
    
    if (categoryFunds.length === 0) return { activeAlpha: 0 };

    const avgAlpha3Y = categoryFunds.reduce((sum, f) => sum + (f.Alpha_3Y || 0), 0) / categoryFunds.length;
    const avgAlpha5Y = categoryFunds.reduce((sum, f) => sum + (f.Alpha_5Y || 0), 0) / categoryFunds.length;
    
    return { activeAlpha: (avgAlpha3Y + avgAlpha5Y) / 2 / 100 };
  }

  getDebtSubCategory(bucket: 'short' | 'medium' | 'long'): string {
    const debtMap = {
      short: 'Liquid',
      medium: 'Short Duration',
      long: 'Medium to Long Duration'
    };
    return debtMap[bucket];
  }

  async selectTopFunds(
    subCategory: string,
    category: string,
    preferPassive: boolean,
    count: number
  ): Promise<FundSuggestion[]> {
    let funds: FundSuggestion[] = [];

    if (preferPassive && (subCategory.includes('Cap') || subCategory === 'Value')) {
      // Try to find index funds/ETFs for this category
      const indexFunds = this.rawData.filter(f => 
        f.Sub_Category === 'Index / ETF' &&
        (f.schemeName.toLowerCase().includes(subCategory.toLowerCase().split(' ')[0]) ||
         f.schemeName.toLowerCase().includes('nifty'))
      );

      // Also check ETF analytics
      const relevantETFs = this.etfAnalytics.filter(e => {
        const name = e.ETF_Name.toLowerCase();
        return name.includes(subCategory.toLowerCase().split(' ')[0]) ||
               name.includes('nifty') && subCategory.includes('Cap');
      });

      // Combine and score
      for (const fund of [...indexFunds, ...relevantETFs].slice(0, count)) {
        const returns5Y = fund.Fund_Return_5Y || fund.return5YearDirect || 0;
        const returns10Y = fund.Fund_Return_10Y || fund.return10YearDirect || 0;
        
        funds.push({
          name: fund.schemeName || fund.ETF_Name,
          returns5Y,
          returns10Y,
          alpha3Y: 0,
          alpha5Y: 0,
          compositeScore: fund.ETF_Score || 0,
          aum: fund.Fund_AUM || fund.dailyAUM || 0,
          isETF: true
        });
      }
    }

    // If no passive funds or need active funds
    if (funds.length < count) {
      const activeFunds = this.fundAnalytics
        .filter(f => f.Sub_Category === subCategory && f.Category === category)
        .filter(f => {
          // Ensure funds have required data
          const has5Y = f.Fund_Return_5Y != null && !isNaN(f.Fund_Return_5Y);
          const has10Y = f.Fund_Return_10Y != null && !isNaN(f.Fund_Return_10Y);
          return has5Y || has10Y;
        })
        .map(f => {
          // Calculate blended return score (5Y and 10Y)
          let returnScore = 0;
          let count = 0;
          
          if (f.Fund_Return_5Y != null && !isNaN(f.Fund_Return_5Y)) {
            returnScore += f.Fund_Return_5Y;
            count++;
          }
          if (f.Fund_Return_10Y != null && !isNaN(f.Fund_Return_10Y)) {
            returnScore += f.Fund_Return_10Y;
            count++;
          }
          
          const blendedReturn = count > 0 ? returnScore / count : 0;
          
          return {
            ...f,
            blendedReturn,
            normalizedScore: 0
          };
        })
        .sort((a, b) => b.blendedReturn - a.blendedReturn);

      // Z-score normalization for top 8 funds
      const topFunds = activeFunds.slice(0, 8);
      if (topFunds.length > 0) {
        const returns = topFunds.map(f => f.blendedReturn);
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const stdDev = Math.sqrt(
          returns.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / returns.length
        );

        topFunds.forEach(f => {
          f.normalizedScore = stdDev > 0 ? (f.blendedReturn - mean) / stdDev : 0;
        });

        // Sort by normalized score and take top funds
        const selectedFunds = topFunds
          .sort((a, b) => b.normalizedScore - a.normalizedScore)
          .slice(0, count - funds.length);

        funds.push(...selectedFunds.map(f => ({
          name: f.Fund_Name,
          returns5Y: f.Fund_Return_5Y || 0,
          returns10Y: f.Fund_Return_10Y || 0,
          alpha3Y: f.Alpha_3Y || 0,
          alpha5Y: f.Alpha_5Y || 0,
          compositeScore: f.Composite_Score || 0,
          aum: f.Current_AUM || 0,
          isETF: false
        })));
      }
    }

    return funds.slice(0, count);
  }

  consolidateAllocations(allocations: SubCategoryAllocation[]): SubCategoryAllocation[] {
    const consolidated = new Map<string, SubCategoryAllocation>();

    for (const alloc of allocations) {
      const key = alloc.subCategory;
      
      if (consolidated.has(key)) {
        const existing = consolidated.get(key)!;
        existing.percentage += alloc.percentage;
        existing.amount += alloc.amount;
        
        // Merge fund suggestions (keep unique)
        const existingNames = new Set(existing.fundSuggestions.map(f => f.name));
        alloc.fundSuggestions.forEach(f => {
          if (!existingNames.has(f.name)) {
            existing.fundSuggestions.push(f);
          }
        });
      } else {
        consolidated.set(key, { ...alloc });
      }
    }

    return Array.from(consolidated.values())
      .sort((a, b) => b.percentage - a.percentage);
  }

  // Calculate required SIP with step-up
  calculateSIPWithStepUp(
    targetAmount: number,
    years: number,
    expectedReturn: number,
    stepUpPercentage: number
  ): number {
    // Formula for SIP with annual step-up
    const r = expectedReturn / 12 / 100;
    const n = years * 12;
    const s = stepUpPercentage / 100;
    
    if (s === 0) {
      // Standard SIP formula without step-up
      const numerator = targetAmount * r;
      const denominator = Math.pow(1 + r, n) - 1;
      return numerator / denominator;
    }
    
    // SIP with step-up calculation (iterative approach for accuracy)
    let sip = targetAmount / (n * 1.5); // Initial guess
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
        currentSIP *= (1 + s);
      }
      
      const difference = futureValue - targetAmount;
      if (Math.abs(difference) < 100) break;
      
      sip *= (1 - difference / futureValue / 2);
      iterations++;
    }
    
    return Math.ceil(sip / 100) * 100; // Round to nearest 100
  }

  getExpectedReturn(allocations: SubCategoryAllocation[]): number {
    let totalReturn = 0;
    let totalWeight = 0;

    for (const alloc of allocations) {
      const categoryFunds = this.fundAnalytics.filter(f => f.Sub_Category === alloc.subCategory);
      
      if (categoryFunds.length > 0) {
        const returns = categoryFunds
          .map(f => {
            let ret = 0;
            let count = 0;
            if (f.Fund_Return_5Y) { ret += f.Fund_Return_5Y; count++; }
            if (f.Fund_Return_10Y) { ret += f.Fund_Return_10Y; count++; }
            return count > 0 ? ret / count : 0;
          })
          .filter(r => r > 0);
        
        const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        totalReturn += avgReturn * alloc.percentage;
        totalWeight += alloc.percentage;
      }
    }

    return totalWeight > 0 ? totalReturn / totalWeight : 12; // Default 12% if no data
  }

  // Allocate goals to sub-categories
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

      const allocations = subCategoryAllocations.map(alloc => ({
        subCategory: alloc.subCategory,
        percentage: alloc.percentage,
        amount: (inflatedAmount * alloc.percentage) / 100
      }));

      goalAllocations.push({
        goalId: goal.id,
        goalName: goal.name,
        targetAmount: goal.targetAmount,
        inflatedAmount,
        allocations
      });
    }

    return goalAllocations;
  }

  // Generate complete SIP schedule with reallocation plan
  generateSIPSchedule(
    buckets: TimeHorizonBucket[],
    goals: Goal[],
    stepUpPercentage: number
  ): SIPSchedule {
    const schedule: SIPSchedule = {
      currentSIP: 0,
      breakdown: [],
      stepUpSchedule: [],
      reallocationPlan: []
    };

    // Calculate initial SIP for each bucket
    const bucketSIPs: { [key: string]: number } = {};
    
    for (const bucket of buckets) {
      const expectedReturn = this.getExpectedReturn(bucket.subCategoryAllocations);
      const maxYears = Math.max(...bucket.goals.map(g => g.yearsToGoal), 1);
      
      const sip = this.calculateSIPWithStepUp(
        bucket.totalInflatedAmount,
        maxYears,
        expectedReturn,
        stepUpPercentage
      );
      
      bucketSIPs[bucket.name] = sip;
      schedule.breakdown.push({
        bucket: bucket.name,
        amount: sip
      });
    }

    schedule.currentSIP = Object.values(bucketSIPs).reduce((a, b) => a + b, 0);

    // Generate step-up schedule
    const maxYears = Math.max(...goals.map(g => g.yearsToGoal), 1);
    
    for (let year = 1; year <= maxYears; year++) {
      const yearSIPs: { [key: string]: number } = {};
      
      for (const [bucket, baseSIP] of Object.entries(bucketSIPs)) {
        yearSIPs[bucket] = baseSIP * Math.pow(1 + stepUpPercentage / 100, year - 1);
      }
      
      schedule.stepUpSchedule.push({
        year,
        totalSIP: Object.values(yearSIPs).reduce((a, b) => a + b, 0),
        bucketBreakdown: Object.entries(yearSIPs).map(([bucket, amount]) => ({
          bucket,
          amount
        }))
      });

      // Check for completed goals and plan reallocation
      const completedGoals = goals.filter(g => g.yearsToGoal === year);
      
      if (completedGoals.length > 0) {
        const completedBucket = year <= 3 ? 'short' : year <= 7 ? 'medium' : 'long';
        const remainingBuckets = buckets.filter(b => b.name !== completedBucket);
        
        if (remainingBuckets.length > 0) {
          const totalRemainingAmount = remainingBuckets.reduce((sum, b) => sum + b.totalInflatedAmount, 0);
          
          schedule.reallocationPlan.push({
            year,
            completedGoals: completedGoals.map(g => g.name),
            newAllocations: remainingBuckets.map(b => ({
              bucket: b.name,
              percentage: (b.totalInflatedAmount / totalRemainingAmount) * 100
            }))
          });
        }
      }
    }

    return schedule;
  }

  // Check feasibility and provide recommendations
  assessFeasibility(
    totalSIP: number,
    goals: Goal[],
    expectedReturn: number
  ): { status: 'feasible' | 'challenging' | 'not_feasible', recommendations: string[] } {
    const recommendations: string[] = [];
    const totalTargetAmount = goals.reduce((sum, g) => 
      sum + this.calculateInflatedAmount(g.targetAmount, g.yearsToGoal, g.inflationRate), 0
    );

    const mandatoryGoals = goals.filter(g => g.type === 'mandatory');
    const aspirationalGoals = goals.filter(g => g.type === 'aspirational');

    // Calculate required vs achievable
    const maxYears = Math.max(...goals.map(g => g.yearsToGoal), 1);
    const monthlyReturn = expectedReturn / 12 / 100;
    const totalMonths = maxYears * 12;
    
    // SIP future value calculation
    const achievableAmount = totalSIP * ((Math.pow(1 + monthlyReturn, totalMonths) - 1) / monthlyReturn) * (1 + monthlyReturn);
    
    const shortfall = totalTargetAmount - achievableAmount;
    const shortfallPercentage = (shortfall / totalTargetAmount) * 100;

    if (shortfallPercentage < 5) {
      recommendations.push("Your investment plan is on track to meet all goals.");
      return { status: 'feasible', recommendations };
    } else if (shortfallPercentage < 20) {
      recommendations.push(`You have a ${shortfallPercentage.toFixed(1)}% shortfall. Consider increasing SIP by ₹${Math.ceil(totalSIP * 0.15 / 100) * 100} or reviewing aspirational goals.`);
      
      if (aspirationalGoals.length > 0) {
        recommendations.push(`Consider postponing or reducing: ${aspirationalGoals.map(g => g.name).join(', ')}`);
      }
      
      return { status: 'challenging', recommendations };
    } else {
      recommendations.push(`Significant shortfall of ${shortfallPercentage.toFixed(1)}%. Current plan may not meet all goals.`);
      recommendations.push(`Required SIP: ₹${Math.ceil((totalSIP * (1 + shortfallPercentage / 100)) / 100) * 100}`);
      
      if (mandatoryGoals.length > 0 && aspirationalGoals.length > 0) {
        recommendations.push("Focus on mandatory goals first. Aspirational goals can be pursued later.");
      }
      
      recommendations.push("Consider: 1) Extending timeline for some goals, 2) Reducing target amounts, 3) Increasing income sources");
      
      return { status: 'not_feasible', recommendations };
    }
  }

  // Main engine execution
  async execute(input: UserInput): Promise<EngineOutput> {
    await this.loadData();

    // Categorize goals into time buckets
    const bucketizedGoals = this.categorizeBuckets(input.goals);
    
    const buckets: TimeHorizonBucket[] = [];
    const allGoalAllocations: GoalAllocation[] = [];

    // Process each bucket
    for (const [bucketName, goals] of Object.entries(bucketizedGoals)) {
      if (goals.length === 0) continue;

      const bucket = bucketName as 'short' | 'medium' | 'long';
      const totalInflatedAmount = goals.reduce((sum, g) => 
        sum + this.calculateInflatedAmount(g.targetAmount, g.yearsToGoal, g.inflationRate), 0
      );

      // Generate matrix allocation
      const matrix = this.generateMatrixAllocation(bucket, input.riskAppetite, totalInflatedAmount);

      // Map to sub-categories
      const subCategoryAllocations = await this.mapMatrixToSubCategories(matrix, bucket);

      // Allocate goals to categories
      const goalAllocations = this.allocateGoalsToCategories(goals, subCategoryAllocations);
      allGoalAllocations.push(...goalAllocations);

      buckets.push({
        name: bucket,
        goals,
        totalInflatedAmount,
        matrix,
        subCategoryAllocations
      });
    }

    // Consolidate overall allocation (max 8 categories)
    const overallAllocation = this.consolidateOverallAllocation(buckets);

    // Generate SIP schedule
    const sipSchedule = this.generateSIPSchedule(buckets, input.goals, input.stepUpPercentage);

    // Calculate surplus capacity for aspirational goals
    const mandatoryAmount = input.goals
      .filter(g => g.type === 'mandatory')
      .reduce((sum, g) => sum + this.calculateInflatedAmount(g.targetAmount, g.yearsToGoal, g.inflationRate), 0);
    
    const totalAmount = input.goals
      .reduce((sum, g) => sum + this.calculateInflatedAmount(g.targetAmount, g.yearsToGoal, g.inflationRate), 0);
    
    const surplusCapacity = Math.max(0, 100 - (mandatoryAmount / totalAmount * 100));

    // Assess feasibility
    const expectedReturn = this.getExpectedReturn(overallAllocation);
    const { status, recommendations } = this.assessFeasibility(
      sipSchedule.currentSIP,
      input.goals,
      expectedReturn
    );

    return {
      buckets,
      goalAllocations: allGoalAllocations,
      sipSchedule,
      overallAllocation,
      surplusCapacity,
      feasibilityStatus: status,
      recommendations
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
          const existing = consolidated.get(key)!;
          existing.amount += alloc.amount;
          
          // Merge fund suggestions
          const existingNames = new Set(existing.fundSuggestions.map(f => f.name));
          alloc.fundSuggestions.forEach(f => {
            if (!existingNames.has(f.name)) {
              existing.fundSuggestions.push(f);
            }
          });
        } else {
          consolidated.set(key, { ...alloc });
        }
      }
    }

    // Recalculate percentages based on total amount
    const allocations = Array.from(consolidated.values());
    allocations.forEach(alloc => {
      alloc.percentage = (alloc.amount / totalAmount) * 100;
    });

    // Sort by percentage and limit to top 8
    return allocations
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 8);
  }
}

export { InvestmentGoalEngine };
export type { UserInput, EngineOutput, Goal, TimeHorizonBucket, SubCategoryAllocation, SIPSchedule, GoalAllocation };
