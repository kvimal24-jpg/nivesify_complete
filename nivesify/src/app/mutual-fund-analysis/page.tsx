import type { Metadata } from "next";
import AnalysisTabs from "@/components/AnalysisTabs";
import { AnalysisFullInsightsTable, AnalysisInsightsTables } from "@/components/AnalysisTables";
import { getBaseUrl } from "@/lib/base-url";
import { computeAmfiAggregates, type AmfiRawRecord } from "@/lib/amfi-aggregates";
import type { CategoryInsights, Manifest } from "@/lib/fund-types";

export const metadata: Metadata = {
  title: "Mutual Fund Analysis",
  description: "Industry-wide insights, plain-language methodology, and guided paths for active and passive selection.",
  alternates: {
    canonical: "https://nivesify.com/mutual-fund-analysis",
  },
  openGraph: {
    title: "Mutual Fund Analysis | Nivesify",
    description: "Industry-wide insights, plain-language methodology, and guided paths for active and passive selection.",
    url: "https://nivesify.com/mutual-fund-analysis",
    siteName: "Nivesify",
    locale: "en_US",
    type: "website",
  },
};

const fetchJson = async <T,>(baseUrl: string, path: string): Promise<T> => {
  const res = await fetch(`${baseUrl}${path}`, { next: { revalidate: 300 } });
  if (!res.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return res.json() as Promise<T>;
};

const formatNumber = (value: number | null | undefined, digits = 2) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
};

const formatPct = (value: number | null | undefined, digits = 2) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return `${value.toFixed(digits)}%`;
};

export default async function MutualFundAnalysisPage() {
  const baseUrl = getBaseUrl();
  const [insights, manifest, amfiRaw] = await Promise.all([
    fetchJson<CategoryInsights[]>(baseUrl, "/api/insights"),
    fetchJson<Manifest>(baseUrl, "/api/manifest"),
    fetchJson<AmfiRawRecord[]>(baseUrl, "/api/amfi-raw"),
  ]);

  const industryInsight = insights.find((row) => row.Level === "Industry") ?? null;
  const categoryInsights = insights.filter((row) => row.Level === "Category");
  const subCategoryInsights = insights.filter((row) => row.Level === "Sub-Category");

  const amfiAggregates = computeAmfiAggregates(amfiRaw);
  const amfiCategoryMap = new Map(
    amfiAggregates.categories.map((row) => [row.Category ?? "", row])
  );
  const amfiSubCategoryMap = new Map(
    amfiAggregates.subCategories.map((row) => [`${row.Category}|||${row.Sub_Category}`, row])
  );

  const enrichedInsights = insights.map((row) => {
    const match =
      row.Level === "Industry"
        ? amfiAggregates.industry
        : row.Level === "Category"
          ? amfiCategoryMap.get(row.Category_Name ?? "")
          : amfiSubCategoryMap.get(`${row.Category_Name}|||${row.Sub_Category_Name}`);

    return {
      ...row,
      Avg_10Y_Return: match?.Avg_10Y_Return ?? null,
      Avg_Benchmark_Return_1Y: match?.Avg_Benchmark_Return_1Y ?? null,
      Avg_Benchmark_Return_5Y: match?.Avg_Benchmark_Return_5Y ?? null,
      Avg_Benchmark_Return_10Y: match?.Avg_Benchmark_Return_10Y ?? null,
    };
  });

  const categoryChartData = categoryInsights.map((row) => ({
    label: row.Category_Name ?? "Other",
    aum: row.Total_AUM,
    funds: row.Number_of_Schemes,
  }));

  const palette = [
    "#2F6B45",
    "#B2874C",
    "#3F5E83",
    "#8B3A3A",
    "#5E4B7A",
    "#6B7C70",
  ];

  const buildPie = (values: Array<{ label: string; value: number }>) => {
    const total = values.reduce((sum, item) => sum + item.value, 0) || 1;
    let offset = 0;
    const slices = values.map((item, index) => {
      const percent = (item.value / total) * 100;
      const color = palette[index % palette.length];
      const slice = `${color} ${offset}% ${offset + percent}%`;
      offset += percent;
      return slice;
    });
    return `conic-gradient(${slices.join(", ")})`;
  };

  const topCategories = [...categoryChartData]
    .sort((a, b) => b.aum - a.aum)
    .slice(0, 5);
  const otherAum = categoryChartData
    .filter((row) => !topCategories.find((top) => top.label === row.label))
    .reduce((sum, item) => sum + item.aum, 0);
  const aumChart = otherAum
    ? [...topCategories.map((item) => ({ label: item.label, value: item.aum })), { label: "Other", value: otherAum }]
    : topCategories.map((item) => ({ label: item.label, value: item.aum }));
  const totalAum = aumChart.reduce((sum, item) => sum + item.value, 0) || 1;

  const topFunds = [...categoryChartData]
    .sort((a, b) => b.funds - a.funds)
    .slice(0, 5);
  const otherFunds = categoryChartData
    .filter((row) => !topFunds.find((top) => top.label === row.label))
    .reduce((sum, item) => sum + item.funds, 0);
  const fundsChart = otherFunds
    ? [...topFunds.map((item) => ({ label: item.label, value: item.funds })), { label: "Other", value: otherFunds }]
    : topFunds.map((item) => ({ label: item.label, value: item.funds }));
  const totalFunds = fundsChart.reduce((sum, item) => sum + item.value, 0) || 1;
  const chartCategories = [...categoryInsights]
    .filter((row) => row.Category_Name)
    .sort((a, b) => (b.Avg_Alpha_3Y ?? 0) - (a.Avg_Alpha_3Y ?? 0))
    .slice(0, 6);
  const maxAlpha = Math.max(
    1,
    ...chartCategories.map((row) => Math.abs(row.Avg_Alpha_3Y ?? 0))
  );
  const maxBeat = Math.max(
    1,
    ...chartCategories.map((row) => row.Pct_Funds_Beating_Benchmark_3Y ?? 0)
  );

  return (
    <div className="min-h-screen bg-[#F5F8FF] text-[#1F2937]">
      <section className="relative overflow-hidden px-5 pt-14 pb-14">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-[520px] h-[520px] bg-[#2F5D7C]/10 rounded-full blur-[160px]" />
          <div className="absolute bottom-1/3 right-1/4 w-[420px] h-[420px] bg-[#9BB4D6]/20 rounded-full blur-[140px]" />
        </div>

        <div className="relative max-w-6xl mx-auto">
        <AnalysisTabs />
        <p className="text-xs uppercase tracking-[0.35em] text-[#6B7C70] font-serif mt-8">Mutual Fund Analysis</p>
        <h1 className="mt-3 text-3xl md:text-5xl font-serif tracking-tight">Understand the industry before you pick funds.</h1>
        <p className="mt-3 max-w-2xl text-sm font-serif text-[#4A5D4E] leading-relaxed">
          The industry map: category skill, benchmark gaps, and where active or passive wins.
        </p>
        <details className="mt-3 max-w-2xl text-sm font-serif text-[#4A5D4E]">
          <summary className="cursor-pointer text-xs uppercase tracking-[0.3em] text-[#6B7C70]">Why this matters</summary>
          <p className="mt-2">
            Start with the industry view to see where skill persists and where simplicity is safer.
            Then walk into active or passive with clarity.
          </p>
        </details>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="rounded-3xl border border-[#E6E8E1] bg-white p-5 shadow-[0_18px_40px_-30px_rgba(0,0,0,0.35)]">
            <p className="text-xs uppercase tracking-[0.3em] text-[#6B7C70] font-serif">Data vintage</p>
            <div className="flex items-start justify-between">
              <p className="mt-2 text-base md:text-xl font-serif text-[#1F2937]">{manifest?.reportDate ?? "Latest"}</p>
              <details className="group">
                <summary className="list-none cursor-pointer inline-flex items-center justify-center w-6 h-6 rounded-full border border-[#C9D2C6] text-xs text-[#6B7C70]">
                  i
                </summary>
                <div className="mt-2 text-xs font-serif text-[#4A5D4E]">
                  Fresh data keeps your decisions anchored to the latest cycle.
                </div>
              </details>
            </div>
            <p className="text-xs font-serif text-[#6B7C70]">Daily pipeline refresh</p>
          </div>
          <div className="rounded-3xl border border-[#E6E8E1] bg-white p-5 shadow-[0_18px_40px_-30px_rgba(0,0,0,0.35)]">
            <p className="text-xs uppercase tracking-[0.3em] text-[#6B7C70] font-serif">Industry AUM</p>
            <div className="flex items-start justify-between">
              <p className="mt-2 text-base md:text-xl font-serif text-[#1F2937]">
                {formatNumber(industryInsight?.Total_AUM, 0)} Cr
              </p>
              <details className="group">
                <summary className="list-none cursor-pointer inline-flex items-center justify-center w-6 h-6 rounded-full border border-[#D8C6A5] text-xs text-[#6B7C70]">
                  i
                </summary>
                <div className="mt-2 text-xs font-serif text-[#4A5D4E]">
                  Capital concentration hints where liquidity and fund scale are strongest.
                </div>
              </details>
            </div>
            <p className="text-xs font-serif text-[#6B7C70]">Total assets tracked</p>
          </div>
          <div className="rounded-3xl border border-[#E6E8E1] bg-white p-5 shadow-[0_18px_40px_-30px_rgba(0,0,0,0.35)]">
            <p className="text-xs uppercase tracking-[0.3em] text-[#6B7C70] font-serif">Benchmark win rate</p>
            <div className="flex items-start justify-between">
              <p className="mt-2 text-base md:text-xl font-serif text-[#1F2937]">
              {formatPct(industryInsight?.Pct_Funds_Beating_Benchmark_3Y, 1)}
              </p>
              <details className="group">
                <summary className="list-none cursor-pointer inline-flex items-center justify-center w-6 h-6 rounded-full border border-[#B8C7E3] text-xs text-[#6B7C70]">
                  i
                </summary>
                <div className="mt-2 text-xs font-serif text-[#4A5D4E]">
                  A higher rate suggests categories where active management has room to add value.
                </div>
              </details>
            </div>
            <p className="text-xs font-serif text-[#6B7C70]">Funds beating benchmark (3Y)</p>
          </div>
        </div>

        <div className="mt-10 bg-white border border-[#E7EDF7] rounded-3xl p-4">
          <h3 className="text-lg font-serif text-[#1F2937] mb-4">Industry snapshot</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs font-serif text-[#4A5D4E]">
            <div>Funds tracked: {industryInsight?.Number_of_Schemes ?? "-"}</div>
            <div>Median AUM: {formatNumber(industryInsight?.Median_AUM, 0)} Cr</div>
            <div>Avg 1Y return: {formatPct(industryInsight?.Avg_1Y_Return)}</div>
            <div>Avg 3Y return: {formatPct(industryInsight?.Avg_3Y_Return)}</div>
            <div>Avg 5Y return: {formatPct(industryInsight?.Avg_5Y_Return)}</div>
            <div>Avg benchmark 3Y: {formatPct(industryInsight?.Avg_Benchmark_Return_3Y)}</div>
            <div>Avg alpha 3Y: {formatPct(industryInsight?.Avg_Alpha_3Y)}</div>
            <div>Avg IR 3Y: {formatNumber(industryInsight?.Avg_IR_3Y, 2)}</div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-[#E7EDF7] rounded-3xl p-4">
            <h3 className="text-lg font-serif text-[#1F2937]">Category AUM mix</h3>
            <div className="mt-4 flex flex-wrap items-center gap-6">
              <div
                className="w-28 h-28 rounded-full"
                style={{ background: buildPie(aumChart) }}
              />
              <div className="space-y-2 text-xs font-serif text-[#6B7C70]">
                {aumChart.map((item, index) => (
                  <div key={`aum-${item.label}`} className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ background: palette[index % palette.length] }}
                    />
                    <span>
                      {item.label} ({Math.round((item.value / totalAum) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-white border border-[#E7EDF7] rounded-3xl p-4">
            <h3 className="text-lg font-serif text-[#1F2937]">Fund count mix</h3>
            <div className="mt-4 flex flex-wrap items-center gap-6">
              <div
                className="w-28 h-28 rounded-full"
                style={{ background: buildPie(fundsChart) }}
              />
              <div className="space-y-2 text-xs font-serif text-[#6B7C70]">
                {fundsChart.map((item, index) => (
                  <div key={`funds-${item.label}`} className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ background: palette[index % palette.length] }}
                    />
                    <span>
                      {item.label} ({Math.round((item.value / totalFunds) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <p className="text-xs uppercase tracking-[0.3em] text-[#6B7C70] font-serif">Category diagnostics</p>
          <h3 className="mt-2 text-xl md:text-2xl font-serif text-[#1F2937]">See where skill shows up consistently.</h3>
        </div>

        <div className="mt-4">
          <p className="text-xs uppercase tracking-[0.3em] text-[#6B7C70] font-serif">Detailed table</p>
          <h4 className="mt-2 text-base font-serif text-[#1F2937]">Full insights dataset with benchmarks.</h4>
        </div>

        <AnalysisFullInsightsTable enrichedInsights={enrichedInsights} />

        <AnalysisInsightsTables
          categoryInsights={categoryInsights}
          subCategoryInsights={subCategoryInsights}
        />

        <div className="mt-10 bg-white border border-[#E7EDF7] rounded-3xl p-4">
          <h3 className="text-lg font-serif text-[#1F2937]">Category momentum</h3>
          <p className="mt-2 text-xs font-serif text-[#4A5D4E]">Alpha + beat rate show where active has room to add value.</p>
          <div className="mt-6 space-y-4">
            {chartCategories.map((row) => {
              const alphaValue = row.Avg_Alpha_3Y ?? 0;
              const alphaWidth = Math.round((Math.abs(alphaValue) / maxAlpha) * 100);
              const beatValue = row.Pct_Funds_Beating_Benchmark_3Y ?? 0;
              const beatWidth = Math.round((beatValue / maxBeat) * 100);

              return (
                <div key={`chart-${row.Category_Name}`} className="space-y-2">
                  <div className="flex items-start justify-between gap-2 text-xs font-serif text-[#1F2937]">
                    <span className="min-w-0 break-words">{row.Category_Name}</span>
                    <span className="shrink-0 text-[10px] text-[#6B7C70]">Alpha {formatPct(alphaValue)} | Beat {formatPct(beatValue, 1)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#EEF1E9] overflow-hidden">
                    <div
                      className={`h-full ${alphaValue >= 0 ? "bg-[#2F6B45]" : "bg-[#8B3A3A]"}`}
                      style={{ width: `${alphaWidth}%` }}
                    />
                  </div>
                  <div className="h-2 rounded-full bg-[#EEF1E9] overflow-hidden">
                    <div
                      className="h-full bg-[#4A5D4E]"
                      style={{ width: `${beatWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>


        <div className="mt-12 text-xs font-serif text-[#6B7C70]">
          This content is for informational purposes only and does not constitute investment advice. Past
          performance is not indicative of future results. Please consult a licensed advisor before making
          investment decisions.
        </div>
        </div>
      </section>
    </div>
  );
}
