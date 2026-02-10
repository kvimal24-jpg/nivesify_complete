export interface FundAnalytics {
  Fund_Name: string;
  AMC: string;
  Category: string;
  Sub_Category: string;
  Benchmark_Name: string;
  Maturity_Type: string;
  Current_AUM: number;
  Fund_Return_1Y: number | null;
  Fund_Return_3Y: number | null;
  Fund_Return_5Y: number | null;
  Fund_Return_10Y?: number | null;
  Benchmark_Return_1Y: number | null;
  Benchmark_Return_3Y: number | null;
  Benchmark_Return_5Y: number | null;
  Benchmark_Return_10Y?: number | null;
  Alpha_1Y: number | null;
  Alpha_3Y: number | null;
  Alpha_5Y: number | null;
  IR_1Y: number | null;
  IR_3Y: number | null;
  IR_5Y: number | null;
  Composite_Score: number;
  Rank_in_SubCategory: number;
  Percentile_in_SubCategory: number;
  Flag_Top_10_Percent: "Yes" | "No";
}

export interface ETFAnalytics {
  ETF_Name: string;
  AMC: string;
  Benchmark_Name: string;
  Fund_AUM: number;
  Fund_Return_1Y: number | null;
  Benchmark_Return_1Y: number | null;
  Tracking_Diff_1Y: number | null;
  Fund_Return_3Y: number | null;
  Benchmark_Return_3Y: number | null;
  Tracking_Diff_3Y: number | null;
  ETF_Score: number;
  Rank_within_Benchmark: number;
  Percentile_within_Benchmark: number;
}

export interface CategoryInsights {
  Level: "Industry" | "Category" | "Sub-Category";
  Category_Name: string | null;
  Sub_Category_Name: string | null;
  Number_of_Schemes: number;
  Total_AUM: number;
  Median_AUM: number | null;
  Avg_1Y_Return: number | null;
  Avg_3Y_Return: number | null;
  Avg_5Y_Return: number | null;
  Avg_Benchmark_Return_3Y: number | null;
  Avg_Alpha_3Y: number | null;
  Avg_IR_3Y: number | null;
  Pct_Funds_Beating_Benchmark_3Y: number | null;
}

export interface Manifest {
  dateTag: string;
  reportDate: string;
  counts: {
    raw: number;
    insights: number;
    funds: number;
    etfs: number;
  };
}
