import type { Metadata } from "next";
import Link from "next/link";
import AnalysisTabs from "@/components/AnalysisTabs";
import { AnalysisFullInsightsTable, AnalysisInsightsTables } from "@/components/AnalysisTables";
import SelectionGuide from "@/components/SelectionGuide";
import { getBaseUrl } from "@/lib/base-url";
import { computeAmfiAggregates, type AmfiRawRecord } from "@/lib/amfi-aggregates";
import type { CategoryInsights, FundAnalytics, Manifest } from "@/lib/fund-types";

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
  const [insights, manifest, amfiRaw, funds] = await Promise.all([
    fetchJson<CategoryInsights[]>(baseUrl, "/api/insights"),
    fetchJson<Manifest>(baseUrl, "/api/manifest"),
    fetchJson<AmfiRawRecord[]>(baseUrl, "/api/amfi-raw"),
    fetchJson<FundAnalytics[]>(baseUrl, "/api/funds"),
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
    <div className="bg-gradient-to-br from-[#F4F7F2] via-[#F7F2E7] to-[#EDF1F6] text-[#1F2937] min-h-screen">
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-16">
        <AnalysisTabs />
        <p className="text-xs uppercase tracking-[0.35em] text-[#6B7C70] font-serif">Mutual Fund Analysis</p>
        <h1 className="mt-4 text-4xl md:text-5xl font-serif tracking-tight">Understand the industry before you pick funds.</h1>
        <p className="mt-4 max-w-2xl text-base font-serif text-[#4A5D4E] leading-relaxed">
          Imagine opening a map before a journey. This page is that map. It shows how entire categories behave
          against their benchmarks, where skill shows up consistently, and where simplicity wins. Read the
          industry first, then walk into active or passive with clarity.
        </p>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-[#FFFFFF] to-[#F6F8F3] border border-[#E3E7DF] rounded-3xl p-4 md:p-6 shadow-[0_18px_50px_-40px_rgba(31,41,55,0.25)]">
            <p className="text-xs uppercase tracking-[0.3em] text-[#6B7C70] font-serif">Data vintage</p>
            <div className="flex items-start justify-between">
              <p className="mt-3 text-lg md:text-2xl font-serif text-[#1F2937]">{manifest?.reportDate ?? "Latest"}</p>
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
          <div className="bg-gradient-to-br from-[#FFF8EC] to-[#FFF2DA] border border-[#E7DDC7] rounded-3xl p-4 md:p-6 shadow-[0_18px_50px_-40px_rgba(31,41,55,0.25)]">
            <p className="text-xs uppercase tracking-[0.3em] text-[#6B7C70] font-serif">Industry AUM</p>
            <div className="flex items-start justify-between">
              <p className="mt-3 text-lg md:text-2xl font-serif text-[#1F2937]">
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
          <div className="bg-gradient-to-br from-[#EEF4FF] to-[#E6EDF8] border border-[#DDE3EE] rounded-3xl p-4 md:p-6 shadow-[0_18px_50px_-40px_rgba(31,41,55,0.25)]">
            <p className="text-xs uppercase tracking-[0.3em] text-[#6B7C70] font-serif">Benchmark win rate</p>
            <div className="flex items-start justify-between">
              <p className="mt-3 text-lg md:text-2xl font-serif text-[#1F2937]">
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

        <SelectionGuide funds={funds} />

        <div className="mt-12 flex flex-wrap gap-4">
          {[
            {
              title: "How to use this portal",
              body: "Start with industry and category insights, then choose active or passive based on beat rates.",
            },
            {
              title: "What this data means",
              body: "Every number is benchmarked. It isolates skill from market drift so you compare fairly.",
            },
            {
              title: "Trust and transparency",
              body: "Formulas are shown. Data is refreshed daily. You can always inspect the raw tables.",
            },
          ].map((item) => (
            <details
              key={item.title}
              className="group bg-white border border-[#E3E7DF] rounded-2xl px-4 py-3 text-sm font-serif text-[#4A5D4E]"
            >
              <summary className="cursor-pointer flex items-center gap-2 text-[#1F2937]">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#4A5D4E]/10 text-[#4A5D4E]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v20M2 12h20" />
                  </svg>
                </span>
                {item.title}
              </summary>
              <p className="mt-2 text-xs text-[#6B7C70]">{item.body}</p>
            </details>
          ))}
        </div>

        <div className="mt-12 bg-white border border-[#E3E7DF] rounded-3xl p-4 md:p-6">
          <h3 className="text-lg font-serif text-[#1F2937] mb-4">Industry snapshot</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-serif text-[#4A5D4E]">
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

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-[#E3E7DF] rounded-3xl p-4 md:p-6">
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
          <div className="bg-white border border-[#E3E7DF] rounded-3xl p-4 md:p-6">
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

        <div className="mt-12">
          <p className="text-xs uppercase tracking-[0.3em] text-[#6B7C70] font-serif">Category diagnostics</p>
          <h3 className="mt-2 text-2xl font-serif text-[#1F2937]">See where skill shows up consistently.</h3>
        </div>

        <AnalysisInsightsTables
          categoryInsights={categoryInsights}
          subCategoryInsights={subCategoryInsights}
        />

        <div className="mt-12 bg-white border border-[#E3E7DF] rounded-3xl p-4 md:p-6">
          <h3 className="text-lg font-serif text-[#1F2937]">Category momentum</h3>
          <p className="mt-2 text-sm font-serif text-[#4A5D4E]">
            Higher alpha and higher beat rates suggest categories where active selection has a stronger edge.
          </p>
          <div className="mt-6 space-y-4">
            {chartCategories.map((row) => {
              const alphaValue = row.Avg_Alpha_3Y ?? 0;
              const alphaWidth = Math.round((Math.abs(alphaValue) / maxAlpha) * 100);
              const beatValue = row.Pct_Funds_Beating_Benchmark_3Y ?? 0;
              const beatWidth = Math.round((beatValue / maxBeat) * 100);

              return (
                <div key={`chart-${row.Category_Name}`} className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-serif text-[#1F2937]">
                    <span>{row.Category_Name}</span>
                    <span className="text-xs text-[#6B7C70]">Alpha {formatPct(alphaValue)} | Beat {formatPct(beatValue, 1)}</span>
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

        <div className="mt-12">
          <p className="text-xs uppercase tracking-[0.3em] text-[#6B7C70] font-serif">Choose a path</p>
          <h3 className="mt-2 text-2xl font-serif text-[#1F2937]">Active for skill, passive for precision.</h3>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/active-funds"
            className="bg-[#1F2937] text-white rounded-3xl p-4 md:p-6 hover:-translate-y-1 transition"
          >
            <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-white/70">
              Active
            </span>
            <h3 className="mt-2 text-xl md:text-2xl font-serif">Active Fund Selector</h3>
            <p className="mt-2 text-sm text-white/80">
              When skill matters, use alpha, IR, and composite scoring to shortlist active managers.
            </p>
          </Link>
          <Link
            href="/index-funds"
            className="bg-[#4A5D4E] text-white rounded-3xl p-4 md:p-6 hover:-translate-y-1 transition"
          >
            <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-white/70">
              Passive
            </span>
            <h3 className="mt-2 text-xl md:text-2xl font-serif">Index Fund Guide</h3>
            <p className="mt-2 text-sm text-white/80">
              When simplicity wins, compare tracking difference, AUM, and benchmark fit.
            </p>
          </Link>
        </div>

        <AnalysisFullInsightsTable enrichedInsights={enrichedInsights} />

        <div className="mt-12 text-xs font-serif text-[#6B7C70]">
          This content is for informational purposes only and does not constitute investment advice. Past
          performance is not indicative of future results. Please consult a licensed advisor before making
          investment decisions.
        </div>
      </section>
    </div>
  );
}
