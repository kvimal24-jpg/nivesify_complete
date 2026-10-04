import { describe, expect, it } from "vitest";
import { selectFundsForGoal, type AMFIFund } from "./fund-selection-engine";

const activeFund = {
  Fund_Name: "Alpha Flexi Cap Direct Growth",
  Sub_Category: "Flexi Cap Fund",
  Fund_Return_1Y: 14,
  Fund_Return_3Y: 16,
  Fund_Return_5Y: 15,
  Alpha_3Y: 2.5,
  Rank_in_SubCategory: 1,
  Composite_Score: 91,
  Current_AUM: 12_000,
};

const indexFund = {
  ETF_Name: "Market 50 Index Direct Growth",
  Fund_Return_1Y: 11,
  Fund_Return_3Y: 12,
  Tracking_Diff_3Y: 0.2,
  Rank_within_Benchmark: 1,
  ETF_Score: 88,
  Fund_AUM: 8_000,
};

const cellFunds: AMFIFund[] = [
  {
    Report_Date: "2026-09-30",
    Category: "Equity",
    Sub_Category: "Flexi Cap Fund",
    schemeName: activeFund.Fund_Name,
    benchmark: "Nifty 500 TRI",
    dailyAUM: 12_000,
  },
  {
    Report_Date: "2026-09-30",
    Category: "Equity",
    Sub_Category: "Index / ETF",
    schemeName: indexFund.ETF_Name,
    benchmark: "Nifty 50 TRI",
    dailyAUM: 8_000,
  },
];

describe("selectFundsForGoal", () => {
  it("returns a stable empty result for an empty matrix cell", () => {
    expect(selectFundsForGoal(0, 0, [], [], [], [])).toEqual({
      empty: true,
      leadingSubCategory: null,
      allConsideredSubCategories: [],
      candidateSubCategories: [],
    });
  });

  it("selects the leading category and preserves the existing ACTIVE decision", () => {
    const result = selectFundsForGoal(1, 1, cellFunds, [activeFund], [indexFund], [
      { Sub_Category_Name: "Flexi Cap Fund", Pct_Funds_Beating_Benchmark_3Y: 72 },
    ]);

    expect(result.empty).toBe(false);
    expect(result.decision).toBe("ACTIVE");
    expect(result.selectedFund).toBe(activeFund);
    expect(result.fundStats).toMatchObject({ alpha3Y: 2.5, rank: 1, aum: 12_000 });
    expect(result.allConsideredSubCategories).toEqual(
      expect.arrayContaining(["Flexi Cap Fund", "Nifty 50 TRI"]),
    );
  });

  it("keeps the long-horizon column's active-fund preference", () => {
    const sameCategoryFunds: AMFIFund[] = [
      { ...cellFunds[0], Sub_Category: "Index / ETF", benchmark: "Nifty 50 TRI" },
      cellFunds[1],
    ];

    const result = selectFundsForGoal(1, 3, sameCategoryFunds, [activeFund], [indexFund], []);

    expect(result.decision).toBe("ACTIVE");
    expect(result.selectedFund).toBe(activeFund);
  });
});
