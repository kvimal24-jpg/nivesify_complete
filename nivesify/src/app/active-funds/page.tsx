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
    <div className="bg-[#F5F6F3] text-[#1F2937] min-h-screen">
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-10">
        <div className="mb-8">
          <AnalysisTabs />
        </div>
        <p className="text-xs uppercase tracking-[0.35em] text-[#6B7C70] font-serif">Active Fund Selector</p>
        <h1 className="mt-4 text-4xl md:text-5xl font-serif tracking-tight">Find durable skill, not noise.</h1>
        <p className="mt-4 max-w-2xl text-base font-serif text-[#4A5D4E] leading-relaxed">
          This view ranks active funds by repeatable alpha, risk-adjusted efficiency, and category strength.
          Use it to shortlist managers worth deeper due diligence.
        </p>

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
      </section>
    </div>
  );
}
