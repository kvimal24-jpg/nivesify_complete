import type { Metadata } from "next";
import ActiveFundsExplorer from "@/components/ActiveFundsExplorer";
import AnalysisTabs from "@/components/AnalysisTabs";
import { getBaseUrl } from "@/lib/base-url";
import { computeAmfiAggregates, type AmfiRawRecord } from "@/lib/amfi-aggregates";
import type { CategoryInsights, FundAnalytics, Manifest } from "@/lib/fund-types";

export const metadata: Metadata = {
  title: "Active Fund Selector",
  description: "Use alpha, information ratio, and composite scoring to shortlist active funds.",
  alternates: {
    canonical: "https://nivesify.com/active-funds",
  },
  openGraph: {
    title: "Active Fund Selector | Nivesify",
    description: "Use alpha, information ratio, and composite scoring to shortlist active funds.",
    url: "https://nivesify.com/active-funds",
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

export default async function ActiveFundsPage() {
  const baseUrl = getBaseUrl();
  const [funds, insights, manifest, amfiRaw] = await Promise.all([
    fetchJson<FundAnalytics[]>(baseUrl, "/api/funds"),
    fetchJson<CategoryInsights[]>(baseUrl, "/api/insights"),
    fetchJson<Manifest>(baseUrl, "/api/manifest"),
    fetchJson<AmfiRawRecord[]>(baseUrl, "/api/amfi-raw"),
  ]);

  const industryInsight = insights.find((row) => row.Level === "Industry") ?? null;
  const categoryInsights = insights.filter((row) => row.Level === "Category");
  const subCategoryInsights = insights.filter((row) => row.Level === "Sub-Category");
  const { categories: categoryReturnStats, subCategories: subCategoryReturnStats } =
    computeAmfiAggregates(amfiRaw);

  type ReturnField = "Avg_1Y_Return" | "Avg_3Y_Return" | "Avg_5Y_Return" | "Avg_10Y_Return";
  const topSubCategoryBy = (label: string, field: ReturnField) => {
    const pool = subCategoryReturnStats.filter((row) => row[field] !== null);
    if (!pool.length) {
      return { label, category: "Unavailable", subCategory: "Unavailable", value: null, aum: null };
    }
    const [top] = [...pool].sort((a, b) => (b[field] ?? -999) - (a[field] ?? -999));
    return {
      label,
      category: top.Category ?? "Unknown",
      subCategory: top.Sub_Category ?? "Unknown",
      value: top[field] ?? null,
      aum: top.Total_AUM ?? null,
    };
  };

  const topReturnInsights = [
    topSubCategoryBy("Top 1Y return", "Avg_1Y_Return"),
    topSubCategoryBy("Top 3Y return", "Avg_3Y_Return"),
    topSubCategoryBy("Top 5Y return", "Avg_5Y_Return"),
  ];

  return (
    <div className="min-h-screen bg-[#F5F8FF] text-[#1F2937]">
      <section className="relative overflow-hidden px-5 pt-14 pb-10">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-[520px] h-[520px] bg-[#2F5D7C]/10 rounded-full blur-[160px]" />
          <div className="absolute bottom-1/3 right-1/4 w-[420px] h-[420px] bg-[#9BB4D6]/20 rounded-full blur-[140px]" />
        </div>

        <div className="relative max-w-6xl mx-auto">
        <div className="mb-8">
          <AnalysisTabs />
        </div>
        <p className="text-xs uppercase tracking-[0.35em] text-[#6B7C70] font-serif">Active Fund Selector</p>
        <h1 className="mt-3 text-3xl md:text-5xl font-serif tracking-tight">Find durable skill, not noise.</h1>
        <p className="mt-3 max-w-2xl text-sm font-serif text-[#4A5D4E] leading-relaxed">
          Rank active funds by repeatable alpha and risk-adjusted skill.
        </p>
        <details className="mt-3 max-w-2xl text-sm font-serif text-[#4A5D4E]">
          <summary className="cursor-pointer text-xs uppercase tracking-[0.3em] text-[#6B7C70]">How to use</summary>
          <p className="mt-2">
            Start with Insights, then Shortlisted for quick picks. Use Screener only when you need
            deeper filtering.
          </p>
        </details>

        <ActiveFundsExplorer
          funds={funds}
          categoryInsights={categoryInsights}
          subCategoryInsights={subCategoryInsights}
          categoryReturnStats={categoryReturnStats}
          subCategoryReturnStats={subCategoryReturnStats}
          topReturnInsights={topReturnInsights}
          industryInsight={industryInsight}
          manifest={manifest}
        />

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
