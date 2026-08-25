/* Shared landing-page types + pure derivation logic.
   Used by the server page (RSC data load) and the client fallback path,
   so both produce byte-identical derived data. No React here. */

export type LiveFund = {
  Fund_Name: string;
  Category: string | null;
  Sub_Category: string | null;
  Fund_Return_3Y: number | null;
  Alpha_3Y: number | null;
  Current_AUM: number | null;
  Percentile_in_SubCategory: number | null;
  Composite_Score: number | null;
};
export type Manifest = { dateTag: string; reportDate: string; counts: { raw: number; funds: number; etfs: number } };
export type InsightRow = {
  Level: string;
  Category_Name: string | null;
  Sub_Category_Name: string | null;
  Number_of_Schemes: number | null;
  Total_AUM: number | null;
  Avg_3Y_Return: number | null;
  Avg_Benchmark_Return_3Y: number | null;
  Avg_Alpha_3Y: number | null;
  Pct_Funds_Beating_Benchmark_3Y: number | null;
};

/* Everything the landing needs, pre-derived — small payload, no raw fund dump. */
export type LandingData = {
  totalSchemes: number;
  reportDate: string;
  industry: InsightRow | null;
  topByCategory: Record<string, LiveFund[]>;
  tickerFunds: { name: string; alpha: number }[];
};

/* Every sub-category any landing widget asks for
   (Hall of Fame tabs + SIP Studio horizons). */
export const LANDING_SUBCATS = [
  "Flexi Cap", "Large Cap", "Mid Cap", "Small Cap", "ELSS", "Aggressive Hybrid",
  "Conservative Hybrid", "Balanced Advantage", "Arbitrage",
];

export const num = (v: number | null | undefined, d = 0): number => typeof v === "number" && Number.isFinite(v) ? v : d;
export const hasNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
export const shortName = (n: string) => n.replace(/ Fund$/g, "").replace(/ Fund /g, " ");

export function buildLandingData(funds: LiveFund[] | null, manifest: Manifest | null, insights: InsightRow[] | null): LandingData {
  const validFunds = funds?.filter(f => !!f.Fund_Name && hasNum(f.Fund_Return_3Y) && hasNum(f.Alpha_3Y)) ?? [];

  const topByCategory: Record<string, LiveFund[]> = {};
  for (const sub of LANDING_SUBCATS) {
    topByCategory[sub] = validFunds
      .filter(f => f.Sub_Category === sub && hasNum(f.Percentile_in_SubCategory))
      .sort((a, b) => num(b.Composite_Score) - num(a.Composite_Score))
      .slice(0, 3);
  }

  const tickerFunds = [...validFunds]
    .sort((a, b) => num(b.Composite_Score) - num(a.Composite_Score))
    .slice(0, 14)
    .map(f => ({ name: shortName(f.Fund_Name), alpha: f.Alpha_3Y as number }));

  return {
    totalSchemes: manifest?.counts.raw ?? 0,
    reportDate: manifest?.reportDate ?? "",
    industry: insights?.find(r => r.Level === "Industry") ?? null,
    topByCategory,
    tickerFunds,
  };
}
