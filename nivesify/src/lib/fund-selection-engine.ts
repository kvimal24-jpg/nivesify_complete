export type AMFIFund = {
  Report_Date: string;
  Category: string;
  Sub_Category: string;
  schemeName: string;
  benchmark: string;
  dailyAUM: number;
};

export type SubCategoryPerformance = {
  subCategoryName: string;
  fundCount: number;
  avgAlpha: number;
  avgBeatRate: number;
  topFundName: string;
  topFundScore: number;
  rank: number;
};

export type FundSelectionResult = {
  empty: boolean;
  leadingSubCategory: string | null;
  allConsideredSubCategories: string[];
  candidateSubCategories: SubCategoryPerformance[];
  decision?: "ACTIVE" | "INDEX";
  selectedFund?: any;
  fundStats?: {
    return1Y: number | null;
    return3Y: number | null;
    return5Y: number | null;
    alpha3Y: number | null;
    rank: number;
    aum: number;
  };
};

export function selectFundsForGoal(
  row: number,
  col: number,
  cellFunds: AMFIFund[],
  fundAnalytics: any[],
  etfAnalytics: any[],
  insights: Array<{
    Sub_Category_Name?: string | null;
    Pct_Funds_Beating_Benchmark_3Y?: number | null;
  }>,
): FundSelectionResult {
  if (cellFunds.length === 0) {
    return { empty: true, leadingSubCategory: null, allConsideredSubCategories: [], candidateSubCategories: [] };
  }

  const allConsideredSubCategories = new Set<string>();
  const subCategoryGroups: Record<string, AMFIFund[]> = {};
  cellFunds.forEach((fund) => {
    const key = fund.Sub_Category.toLowerCase() === "index / etf" ? fund.benchmark : fund.Sub_Category;
    allConsideredSubCategories.add(key);
    (subCategoryGroups[key] ??= []).push(fund);
  });

  const candidateSubCategories: SubCategoryPerformance[] = [];
  Object.entries(subCategoryGroups).forEach(([subCategoryName, funds]) => {
    let totalAlpha = 0;
    let totalBeatRate = 0;
    let fundCount = 0;
    let topFund: any = null;
    let topRank = 999999;

    funds.forEach((amfiFund) => {
      const activeFund = fundAnalytics.find(
        (fund) => fund.Fund_Name.toLowerCase() === amfiFund.schemeName.toLowerCase() && fund.Fund_Return_3Y !== null,
      );
      if (activeFund) {
        totalAlpha += activeFund.Alpha_3Y || 0;
        fundCount += 1;
        const insight = insights.find(
          (item) => item.Sub_Category_Name?.toLowerCase() === activeFund.Sub_Category.toLowerCase(),
        );
        if (insight) totalBeatRate += insight.Pct_Funds_Beating_Benchmark_3Y || 0;
        if (activeFund.Rank_in_SubCategory < topRank) {
          topRank = activeFund.Rank_in_SubCategory;
          topFund = activeFund;
        }
        return;
      }

      const etfFund = etfAnalytics.find(
        (fund) => fund.ETF_Name.toLowerCase() === amfiFund.schemeName.toLowerCase() && fund.Fund_Return_3Y !== null,
      );
      if (etfFund) {
        totalAlpha += -(etfFund.Tracking_Diff_3Y || 0);
        totalBeatRate += 50;
        fundCount += 1;
        if (etfFund.Rank_within_Benchmark < topRank) {
          topRank = etfFund.Rank_within_Benchmark;
          topFund = etfFund;
        }
      }
    });

    if (fundCount > 0 && topFund) {
      candidateSubCategories.push({
        subCategoryName,
        fundCount,
        avgAlpha: totalAlpha / fundCount,
        avgBeatRate: totalBeatRate / fundCount,
        topFundName: "Fund_Name" in topFund ? topFund.Fund_Name : topFund.ETF_Name,
        topFundScore: "Composite_Score" in topFund ? topFund.Composite_Score : topFund.ETF_Score,
        rank: topRank,
      });
    }
  });

  if (candidateSubCategories.length === 0) {
    return {
      empty: true,
      leadingSubCategory: null,
      allConsideredSubCategories: Array.from(allConsideredSubCategories),
      candidateSubCategories: [],
    };
  }

  const leadingSubCategory = [...candidateSubCategories].sort((a, b) =>
    Math.abs(a.avgAlpha - b.avgAlpha) > 0.1 ? b.avgAlpha - a.avgAlpha : b.avgBeatRate - a.avgBeatRate,
  )[0];
  const leadingFunds = subCategoryGroups[leadingSubCategory.subCategoryName];
  let bestFund: any = null;
  let bestRank = 999999;
  let isActive = false;

  leadingFunds.forEach((amfiFund) => {
    const activeFund = fundAnalytics.find(
      (fund) => fund.Fund_Name.toLowerCase() === amfiFund.schemeName.toLowerCase() && fund.Fund_Return_3Y !== null,
    );
    if (activeFund && activeFund.Rank_in_SubCategory < bestRank) {
      bestRank = activeFund.Rank_in_SubCategory;
      bestFund = activeFund;
      isActive = true;
      return;
    }
    const etfFund = etfAnalytics.find(
      (fund) => fund.ETF_Name.toLowerCase() === amfiFund.schemeName.toLowerCase() && fund.Fund_Return_3Y !== null,
    );
    if (etfFund && etfFund.Rank_within_Benchmark < bestRank) {
      bestRank = etfFund.Rank_within_Benchmark;
      bestFund = etfFund;
      isActive = false;
    }
  });

  let decision: "ACTIVE" | "INDEX" = isActive ? "ACTIVE" : "INDEX";
  if (col === 3 && !isActive) {
    const activeFunds = leadingFunds
      .map((fund) => fundAnalytics.find(
        (candidate) => candidate.Fund_Name.toLowerCase() === fund.schemeName.toLowerCase() && candidate.Fund_Return_3Y !== null,
      ))
      .filter(Boolean) as any[];
    if (activeFunds.length > 0) {
      bestFund = [...activeFunds].sort((a, b) => a.Rank_in_SubCategory - b.Rank_in_SubCategory)[0];
      decision = "ACTIVE";
      isActive = true;
      bestRank = bestFund.Rank_in_SubCategory;
    }
  }

  const fundStats = bestFund ? {
    return1Y: bestFund.Fund_Return_1Y,
    return3Y: bestFund.Fund_Return_3Y,
    return5Y: "Fund_Return_5Y" in bestFund ? bestFund.Fund_Return_5Y : null,
    alpha3Y: "Alpha_3Y" in bestFund ? bestFund.Alpha_3Y : -(bestFund.Tracking_Diff_3Y || 0),
    rank: bestRank,
    aum: "Current_AUM" in bestFund ? bestFund.Current_AUM : bestFund.Fund_AUM,
  } : undefined;

  return {
    empty: false,
    leadingSubCategory: leadingSubCategory.subCategoryName,
    allConsideredSubCategories: Array.from(allConsideredSubCategories),
    candidateSubCategories,
    decision,
    selectedFund: bestFund,
    fundStats,
  };
}
