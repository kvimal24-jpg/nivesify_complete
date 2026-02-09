"use client";

import { useEffect, useMemo, useState } from "react";
import FilterableTable from "@/components/FilterableTable";
import type { CategoryInsights, FundAnalytics, Manifest } from "@/lib/fund-types";

type TabKey = "insights" | "shortlist" | "methodology" | "data";

type ActiveFundsExplorerProps = {
  funds: FundAnalytics[];
  categoryInsights: CategoryInsights[];
  subCategoryInsights: CategoryInsights[];
  categoryReturnStats: Array<{
    Category: string | null;
    Total_AUM: number;
    Avg_1Y_Return: number | null;
    Avg_3Y_Return: number | null;
    Avg_5Y_Return: number | null;
    Avg_10Y_Return: number | null;
    Avg_Benchmark_Return_1Y: number | null;
    Avg_Benchmark_Return_3Y: number | null;
    Avg_Benchmark_Return_5Y: number | null;
    Avg_Benchmark_Return_10Y: number | null;
  }>;
  subCategoryReturnStats: Array<{
    Category: string | null;
    Sub_Category: string | null;
    Total_AUM: number;
    Avg_1Y_Return: number | null;
    Avg_3Y_Return: number | null;
    Avg_5Y_Return: number | null;
    Avg_10Y_Return: number | null;
    Avg_Benchmark_Return_1Y: number | null;
    Avg_Benchmark_Return_3Y: number | null;
    Avg_Benchmark_Return_5Y: number | null;
    Avg_Benchmark_Return_10Y: number | null;
  }>;
  topReturnInsights: Array<{
    label: string;
    category: string;
    subCategory: string;
    value: number | null;
    aum: number | null;
  }>;
  industryInsight: CategoryInsights | null;
  manifest: Manifest | null;
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

const tonePct = (value: number | null | undefined, digits = 2, threshold = 0) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  const color = value >= threshold ? "text-[#2F6B45]" : "text-[#8B3A3A]";
  return <span className={color}>{formatPct(value, digits)}</span>;
};

const formatCompact = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
};

export default function ActiveFundsExplorer({
  funds,
  categoryInsights,
  subCategoryInsights,
  categoryReturnStats,
  subCategoryReturnStats,
  topReturnInsights,
  industryInsight,
  manifest,
}: ActiveFundsExplorerProps) {
  const [tab, setTab] = useState<TabKey>("insights");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [subCategory, setSubCategory] = useState("All");
  const [minAlpha3Y, setMinAlpha3Y] = useState("");
  const [minAlpha5Y, setMinAlpha5Y] = useState("");
  const [minIr3Y, setMinIr3Y] = useState("");
  const [minIr5Y, setMinIr5Y] = useState("");
  const [minAum, setMinAum] = useState("");
  const [benchmark, setBenchmark] = useState("All");
  const [topOnly, setTopOnly] = useState(false);
  const [selected, setSelected] = useState<FundAnalytics | null>(null);
  const [rawPage, setRawPage] = useState(0);
  const [shortlistCategory, setShortlistCategory] = useState("All");
  const [shortlistSubCategory, setShortlistSubCategory] = useState("All");

  const categories = useMemo(() => {
    return Array.from(new Set(funds.map((fund) => fund.Category).filter(Boolean))).sort();
  }, [funds]);

  const subCategories = useMemo(() => {
    const pool = category === "All" ? funds : funds.filter((fund) => fund.Category === category);
    return Array.from(new Set(pool.map((fund) => fund.Sub_Category).filter(Boolean))).sort();
  }, [funds, category]);

  const benchmarks = useMemo(() => {
    return Array.from(new Set(funds.map((fund) => fund.Benchmark_Name).filter(Boolean))).sort();
  }, [funds]);

  const shortlistedBySubCategory = useMemo(() => {
    const topGroups = [...subCategoryInsights]
      .filter((row) => row.Sub_Category_Name)
      .sort((a, b) => (b.Total_AUM ?? 0) - (a.Total_AUM ?? 0))
      .slice(0, 6);

    return topGroups.map((group) => {
      const matches = funds.filter(
        (fund) =>
          fund.Sub_Category === group.Sub_Category_Name &&
          fund.Category === group.Category_Name &&
          (fund.Current_AUM ?? 0) > 50
      );

      const picks = [...matches]
        .sort((a, b) => (b.Composite_Score ?? 0) - (a.Composite_Score ?? 0))
        .slice(0, 2);

      return {
        category: group.Category_Name ?? "-",
        subCategory: group.Sub_Category_Name ?? "-",
        aum: group.Total_AUM ?? 0,
        picks,
      };
    });
  }, [subCategoryInsights, funds]);

  const shortlistCategories = useMemo(() => {
    return Array.from(new Set(shortlistedBySubCategory.map((row) => row.category))).sort();
  }, [shortlistedBySubCategory]);

  const shortlistSubCategories = useMemo(() => {
    const pool =
      shortlistCategory === "All"
        ? shortlistedBySubCategory
        : shortlistedBySubCategory.filter((row) => row.category === shortlistCategory);
    return Array.from(new Set(pool.map((row) => row.subCategory))).sort();
  }, [shortlistedBySubCategory, shortlistCategory]);

  const filteredShortlist = useMemo(() => {
    return shortlistedBySubCategory.filter((row) => {
      if (shortlistCategory !== "All" && row.category !== shortlistCategory) return false;
      if (shortlistSubCategory !== "All" && row.subCategory !== shortlistSubCategory) return false;
      return true;
    });
  }, [shortlistedBySubCategory, shortlistCategory, shortlistSubCategory]);

  const filtered = useMemo(() => {
    const alphaMin = minAlpha3Y.trim() === "" ? null : Number(minAlpha3Y);
    const alpha5Min = minAlpha5Y.trim() === "" ? null : Number(minAlpha5Y);
    const irMin = minIr3Y.trim() === "" ? null : Number(minIr3Y);
    const ir5Min = minIr5Y.trim() === "" ? null : Number(minIr5Y);
    const aumMin = minAum.trim() === "" ? null : Number(minAum);

    const result = funds.filter((fund) => {
      if (category !== "All" && fund.Category !== category) return false;
      if (subCategory !== "All" && fund.Sub_Category !== subCategory) return false;
      if (benchmark !== "All" && fund.Benchmark_Name !== benchmark) return false;
      if (topOnly && fund.Flag_Top_10_Percent !== "Yes") return false;
      if (alphaMin !== null && (fund.Alpha_3Y ?? -999) < alphaMin) return false;
      if (alpha5Min !== null && (fund.Alpha_5Y ?? -999) < alpha5Min) return false;
      if (irMin !== null && (fund.IR_3Y ?? -999) < irMin) return false;
      if (ir5Min !== null && (fund.IR_5Y ?? -999) < ir5Min) return false;
      if (aumMin !== null && (fund.Current_AUM ?? 0) < aumMin) return false;
      if (query.trim().length > 0) {
        const q = query.toLowerCase();
        const name = String(fund.Fund_Name ?? "").toLowerCase();
        const amc = String(fund.AMC ?? "").toLowerCase();
        if (!name.includes(q) && !amc.includes(q)) {
          return false;
        }
      }
      return true;
    });

    result.sort((a, b) => (b.Composite_Score ?? 0) - (a.Composite_Score ?? 0));

    return result;
  }, [
    funds,
    category,
    subCategory,
    benchmark,
    topOnly,
    minAlpha3Y,
    minAlpha5Y,
    minIr3Y,
    minIr5Y,
    minAum,
    query,
  ]);

  const rawColumns = useMemo(
    () => Object.keys(funds[0] ?? {}).filter((key) => !["AMC", "Flag_Top_10_Percent"].includes(key)),
    [funds]
  );
  const rawTableColumns = useMemo(() => {
    const sample = funds[0] as unknown as Record<string, unknown> | undefined;
    return rawColumns.map((column) => {
      const value = sample?.[column];
      const align: "left" | "right" = typeof value === "number" ? "right" : "left";
      return {
        key: column,
        label: column,
        align,
        format: (raw: unknown) => (typeof raw === "number" ? formatNumber(raw, 2) : String(raw ?? "-")),
      };
    });
  }, [rawColumns, funds]);
  const pageSize = 50;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rawSlice = filtered.slice(rawPage * pageSize, rawPage * pageSize + pageSize);

  useEffect(() => {
    setRawPage(0);
  }, [query, category, subCategory, benchmark, topOnly, minAlpha3Y, minAlpha5Y, minIr3Y, minIr5Y, minAum]);

  const topCount = useMemo(() => funds.filter((fund) => fund.Flag_Top_10_Percent === "Yes").length, [
    funds,
  ]);

  const avgAlpha3Y = useMemo(() => {
    const values = funds.map((fund) => fund.Alpha_3Y).filter((val): val is number => val !== null);
    if (!values.length) return null;
    return values.reduce((acc, val) => acc + val, 0) / values.length;
  }, [funds]);

  const chartCategories = useMemo(() => {
    return [...categoryInsights]
      .filter((row) => row.Category_Name)
      .sort((a, b) => (b.Avg_Alpha_3Y ?? 0) - (a.Avg_Alpha_3Y ?? 0))
      .slice(0, 6);
  }, [categoryInsights]);

  const maxAlpha = useMemo(() => {
    return Math.max(1, ...chartCategories.map((row) => Math.abs(row.Avg_Alpha_3Y ?? 0)));
  }, [chartCategories]);

  const maxBeat = useMemo(() => {
    return Math.max(1, ...chartCategories.map((row) => row.Pct_Funds_Beating_Benchmark_3Y ?? 0));
  }, [chartCategories]);

  const medianIr3Y = useMemo(() => {
    const values = funds
      .map((fund) => fund.IR_3Y)
      .filter((val): val is number => val !== null)
      .sort((a, b) => a - b);
    if (!values.length) return null;
    return values[Math.floor(values.length / 2)];
  }, [funds]);

  const topBeatCategory = useMemo(() => {
    const pool = categoryInsights.filter((row) => row.Pct_Funds_Beating_Benchmark_3Y !== null);
    if (!pool.length) return null;
    const [top] = [...pool].sort(
      (a, b) => (b.Pct_Funds_Beating_Benchmark_3Y ?? -999) - (a.Pct_Funds_Beating_Benchmark_3Y ?? -999)
    );
    return top;
  }, [categoryInsights]);

  const topIrCategory = useMemo(() => {
    const pool = categoryInsights.filter((row) => row.Avg_IR_3Y !== null);
    if (!pool.length) return null;
    const [top] = [...pool].sort((a, b) => (b.Avg_IR_3Y ?? -999) - (a.Avg_IR_3Y ?? -999));
    return top;
  }, [categoryInsights]);

  const openDetails = (fund: FundAnalytics) => {
    setSelected(fund);
  };

  const formatPair = (fund: number | null | undefined, bench: number | null | undefined) => {
    if (fund === null || fund === undefined || bench === null || bench === undefined) return "-";
    const color = fund >= bench ? "text-[#2F6B45]" : "text-[#8B3A3A]";
    return (
      <span className={color}>
        {fund.toFixed(1)}/{bench.toFixed(1)}
      </span>
    );
  };

  return (
    <section className="mt-12">
      <div className="flex flex-wrap gap-3 border-b border-[#D9DED5] pb-4">
        {[
          { key: "insights", label: "Insights" },
          { key: "shortlist", label: "Shortlisted" },
          { key: "methodology", label: "Methodology" },
          { key: "data", label: "Screener" },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key as TabKey)}
            className={`px-4 py-2 rounded-full text-sm font-serif transition-all ${
              tab === item.key
                ? "bg-[#4A5D4E] text-white"
                : "bg-white text-[#4A5D4E] border border-[#4A5D4E]/20"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "insights" && (
        <div className="mt-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white border border-[#E3E7DF] rounded-3xl p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-[#6B7C70] font-serif">Coverage</p>
              <p className="mt-4 text-3xl font-serif text-[#1F2937]">{manifest?.counts?.funds ?? funds.length}</p>
              <p className="text-sm font-serif text-[#6B7C70]">active funds tracked</p>
            </div>
            <div className="bg-white border border-[#E3E7DF] rounded-3xl p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-[#6B7C70] font-serif">Top 10 percent</p>
              <p className="mt-4 text-3xl font-serif text-[#1F2937]">{topCount}</p>
              <p className="text-sm font-serif text-[#6B7C70]">consistent alpha</p>
            </div>
            <div className="bg-white border border-[#E3E7DF] rounded-3xl p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-[#6B7C70] font-serif">Avg alpha 3Y</p>
              <p className="mt-4 text-3xl font-serif text-[#1F2937]">
                {avgAlpha3Y === null ? "-" : `${avgAlpha3Y.toFixed(2)}%`}
              </p>
              <p className="text-sm font-serif text-[#6B7C70]">across active universe</p>
            </div>
            <div className="bg-white border border-[#E3E7DF] rounded-3xl p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-[#6B7C70] font-serif">Median IR 3Y</p>
              <p className="mt-4 text-3xl font-serif text-[#1F2937]">
                {medianIr3Y === null ? "-" : formatNumber(medianIr3Y, 2)}
              </p>
              <p className="text-sm font-serif text-[#6B7C70]">risk-adjusted skill</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topReturnInsights.map((item) => (
              <div key={item.label} className="bg-[#FFF8EC] border border-[#E7DDC7] rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-[#6B7C70] font-serif">{item.label}</p>
                <p className="mt-3 text-lg font-serif text-[#1F2937]">{item.subCategory}</p>
                <p className="text-xs font-serif text-[#6B7C70]">Category: {item.category}</p>
                <p className="text-xs font-serif text-[#6B7C70]">Avg return: {formatPct(item.value)}</p>
                <p className="text-xs font-serif text-[#6B7C70]">AUM: {formatCompact(item.aum)} Cr</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#EEF4FF] border border-[#DDE3EE] rounded-2xl p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-[#6B7C70] font-serif">Highest beat rate</p>
              <p className="mt-3 text-lg font-serif text-[#1F2937]">{topBeatCategory?.Category_Name ?? "-"}</p>
              <p className="text-xs font-serif text-[#6B7C70]">
                Beat rate: {formatPct(topBeatCategory?.Pct_Funds_Beating_Benchmark_3Y, 1)}
              </p>
            </div>
            <div className="bg-[#EAF1E8] border border-[#DCE7D7] rounded-2xl p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-[#6B7C70] font-serif">Best risk-adjusted</p>
              <p className="mt-3 text-lg font-serif text-[#1F2937]">{topIrCategory?.Category_Name ?? "-"}</p>
              <p className="text-xs font-serif text-[#6B7C70]">Avg IR 3Y: {formatNumber(topIrCategory?.Avg_IR_3Y, 2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-[#EAF1E8] border border-[#DCE7D7] rounded-3xl p-6">
              <h3 className="text-lg font-serif text-[#1F2937]">Industry pulse</h3>
              <p className="mt-3 text-sm font-serif text-[#4A5D4E] leading-relaxed">
                {industryInsight?.Pct_Funds_Beating_Benchmark_3Y === null ||
                industryInsight?.Pct_Funds_Beating_Benchmark_3Y === undefined
                  ? "Benchmark success data is unavailable in this run."
                  : `${industryInsight.Pct_Funds_Beating_Benchmark_3Y.toFixed(1)}% of funds beat their benchmarks over 3Y.`}
              </p>
              <div className="mt-4 text-sm font-serif text-[#4A5D4E] space-y-1">
                <div>Avg 3Y return: {formatPct(industryInsight?.Avg_3Y_Return)}</div>
                <div>Avg alpha 3Y: {formatPct(industryInsight?.Avg_Alpha_3Y)}</div>
                <div>Total AUM: {formatCompact(industryInsight?.Total_AUM)} Cr</div>
              </div>
            </div>
            <div className="bg-[#F7F0E6] border border-[#E8DDC6] rounded-3xl p-6">
              <h3 className="text-lg font-serif text-[#1F2937]">Category advantage</h3>
              <p className="mt-3 text-sm font-serif text-[#4A5D4E] leading-relaxed">
                Use this table to see which categories give active managers the most room to add value.
              </p>
              <div className="mt-4 text-sm font-serif text-[#4A5D4E]">
                Avg IR 3Y: {formatNumber(industryInsight?.Avg_IR_3Y, 2)}
              </div>
            </div>
            <div className="bg-[#EEF1F6] border border-[#DDE3EE] rounded-3xl p-6">
              <h3 className="text-lg font-serif text-[#1F2937]">Data freshness</h3>
              <p className="mt-3 text-sm font-serif text-[#4A5D4E] leading-relaxed">
                Data as of {manifest?.reportDate ?? "latest run"}. Pipeline refreshes daily.
              </p>
              <div className="mt-4 text-sm font-serif text-[#4A5D4E]">
                Total records: {manifest?.counts?.raw ?? "-"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white border border-[#E3E7DF] rounded-3xl p-6">
              <h3 className="text-lg font-serif text-[#1F2937] mb-4">Category scoreboard</h3>
              <FilterableTable
                data={categoryReturnStats}
                rowKey={(row) => `return-${row.Category}`}
                defaultSortKey="Avg_3Y_Return"
                defaultSortDir="desc"
                columns={[
                  { key: "Category", label: "Category", tooltip: "AMFI category name." },
                  {
                    key: "Total_AUM",
                    label: "AUM (Cr)",
                    align: "right",
                    tooltip: "Total AUM in the category.",
                    format: (value) => formatNumber(value as number | null, 0),
                  },
                  {
                    key: "Avg_1Y_Return",
                    label: "1Y Fund/Bench",
                    align: "right",
                    tooltip: "Average 1Y fund return vs benchmark.",
                    format: (_value, row) => formatPair(row.Avg_1Y_Return, row.Avg_Benchmark_Return_1Y),
                  },
                  {
                    key: "Avg_3Y_Return",
                    label: "3Y Fund/Bench",
                    align: "right",
                    tooltip: "Average 3Y fund return vs benchmark.",
                    format: (_value, row) => formatPair(row.Avg_3Y_Return, row.Avg_Benchmark_Return_3Y),
                  },
                  {
                    key: "Avg_5Y_Return",
                    label: "5Y Fund/Bench",
                    align: "right",
                    tooltip: "Average 5Y fund return vs benchmark.",
                    format: (_value, row) => formatPair(row.Avg_5Y_Return, row.Avg_Benchmark_Return_5Y),
                  },
                  {
                    key: "Avg_10Y_Return",
                    label: "10Y Fund/Bench",
                    align: "right",
                    tooltip: "Average 10Y fund return vs benchmark.",
                    format: (_value, row) => formatPair(row.Avg_10Y_Return, row.Avg_Benchmark_Return_10Y),
                  },
                ]}
                maxHeightClassName="max-h-[420px] overflow-y-auto"
              />
            </div>

            <div className="bg-white border border-[#E3E7DF] rounded-3xl p-6">
              <h3 className="text-lg font-serif text-[#1F2937] mb-4">Sub-category signals</h3>
              <FilterableTable
                data={subCategoryReturnStats}
                rowKey={(row) => `sub-${row.Category}-${row.Sub_Category}`}
                defaultSortKey="Avg_3Y_Return"
                defaultSortDir="desc"
                columns={[
                  { key: "Sub_Category", label: "Sub-category", tooltip: "AMFI sub-category name." },
                  {
                    key: "Total_AUM",
                    label: "AUM (Cr)",
                    align: "right",
                    tooltip: "Total AUM in the sub-category.",
                    format: (value) => formatNumber(value as number | null, 0),
                  },
                  {
                    key: "Avg_1Y_Return",
                    label: "1Y Fund/Bench",
                    align: "right",
                    tooltip: "Average 1Y fund return vs benchmark for the sub-category.",
                    format: (_value, row) => formatPair(row.Avg_1Y_Return, row.Avg_Benchmark_Return_1Y),
                  },
                  {
                    key: "Avg_3Y_Return",
                    label: "3Y Fund/Bench",
                    align: "right",
                    tooltip: "Average 3Y fund return vs benchmark for the sub-category.",
                    format: (_value, row) => formatPair(row.Avg_3Y_Return, row.Avg_Benchmark_Return_3Y),
                  },
                  {
                    key: "Avg_5Y_Return",
                    label: "5Y Fund/Bench",
                    align: "right",
                    tooltip: "Average 5Y fund return vs benchmark for the sub-category.",
                    format: (_value, row) => formatPair(row.Avg_5Y_Return, row.Avg_Benchmark_Return_5Y),
                  },
                  {
                    key: "Avg_10Y_Return",
                    label: "10Y Fund/Bench",
                    align: "right",
                    tooltip: "Average 10Y fund return vs benchmark for the sub-category.",
                    format: (_value, row) => formatPair(row.Avg_10Y_Return, row.Avg_Benchmark_Return_10Y),
                  },
                ]}
                maxHeightClassName="max-h-[420px] overflow-y-auto"
              />
            </div>
          </div>

          <div className="bg-white border border-[#E3E7DF] rounded-3xl p-6">
            <h3 className="text-lg font-serif text-[#1F2937]">Category momentum</h3>
            <p className="mt-2 text-sm font-serif text-[#4A5D4E]">
              Alpha shows outperformance; beat rate shows how often managers deliver it.
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
                      <div className="h-full bg-[#4A5D4E]" style={{ width: `${beatWidth}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === "shortlist" && (
        <div className="mt-8 space-y-8">
          <div className="bg-white border border-[#E3E7DF] rounded-3xl p-5 md:p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-[#6B7C70] font-serif">Shortlist logic</p>
            <h3 className="mt-2 text-2xl font-serif text-[#1F2937]">Two leading funds per core sub-category.</h3>
            <p className="mt-2 text-sm font-serif text-[#4A5D4E] max-w-2xl">
              We focus on the largest sub-categories by AUM, then pick funds with the strongest composite
              score, healthy scale, and consistent alpha. Use this as a starting point, not a final decision.
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.2em] text-[#6B7C70]">Category</span>
                <select
                  value={shortlistCategory}
                  onChange={(event) => {
                    setShortlistCategory(event.target.value);
                    setShortlistSubCategory("All");
                  }}
                  className="w-full rounded-2xl border border-[#E3E7DF] bg-white px-4 py-2"
                >
                  <option value="All">All</option>
                  {shortlistCategories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.2em] text-[#6B7C70]">Sub-category</span>
                <select
                  value={shortlistSubCategory}
                  onChange={(event) => setShortlistSubCategory(event.target.value)}
                  className="w-full rounded-2xl border border-[#E3E7DF] bg-white px-4 py-2"
                >
                  <option value="All">All</option>
                  {shortlistSubCategories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredShortlist.map((group) => (
              <div key={`${group.category}-${group.subCategory}`} className="bg-white border border-[#E3E7DF] rounded-3xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-[#6B7C70] font-serif">{group.category}</p>
                    <h4 className="mt-2 text-lg font-serif text-[#1F2937]">{group.subCategory}</h4>
                    <p className="text-xs text-[#6B7C70]">AUM: {formatNumber(group.aum, 0)} Cr</p>
                  </div>
                  <details className="text-xs text-[#6B7C70]">
                    <summary className="cursor-pointer">i</summary>
                    <div className="mt-2">Top 2 by composite score, filtered for AUM &gt; 50 Cr.</div>
                  </details>
                </div>
                <div className="mt-4 space-y-3">
                  {group.picks.map((fund) => (
                    <div key={`${fund.Fund_Name}-${fund.AMC}`} className="border border-[#EDF0EA] rounded-2xl p-4">
                      <div className="text-sm font-serif text-[#1F2937]">{fund.Fund_Name}</div>
                      <div className="text-xs text-[#6B7C70]">{fund.AMC}</div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-[#6B7C70]">
                        <div>AUM: {formatNumber(fund.Current_AUM, 0)} Cr</div>
                        <div>Score: {formatNumber(fund.Composite_Score, 2)}</div>
                        <div>Alpha 3Y: {tonePct(fund.Alpha_3Y)}</div>
                        <div>IR 3Y: {formatNumber(fund.IR_3Y, 2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "methodology" && (
        <div className="mt-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Alpha across cycles",
                desc:
                  "We compare fund returns to benchmarks over 1Y, 3Y, and 5Y windows to isolate true manager skill.",
              },
              {
                title: "Information Ratio",
                desc:
                  "IR shows how much alpha is generated for each unit of extra risk. Higher IR suggests smarter risk-taking.",
              },
              {
                title: "Composite score",
                desc:
                  "Composite Score blends alpha and IR so funds must perform and stay consistent to rank well.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-white border border-[#E3E7DF] rounded-3xl p-6 shadow-[0_24px_60px_-40px_rgba(31,41,55,0.3)]"
              >
                <h3 className="text-lg font-serif text-[#1F2937]">{card.title}</h3>
                <p className="mt-3 text-sm font-serif text-[#4A5D4E] leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-[#F7F4EC] border border-[#E7DDC7] rounded-3xl p-6 text-sm font-serif text-[#5A4B2B]">
            How to use this: first scan categories where the success rate is high, then shortlist funds with
            strong 3Y alpha and IR. Finally, compare costs and your holding horizon before deciding.
          </div>

          <details className="text-sm font-serif text-[#4A5D4E]">
            <summary className="cursor-pointer">Show full field glossary</summary>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-[#E3E7DF] rounded-2xl p-4">Alpha: fund return minus benchmark return.</div>
              <div className="bg-white border border-[#E3E7DF] rounded-2xl p-4">IR: risk-adjusted alpha efficiency score.</div>
              <div className="bg-white border border-[#E3E7DF] rounded-2xl p-4">Composite Score: weighted blend of alpha and IR signals.</div>
              <div className="bg-white border border-[#E3E7DF] rounded-2xl p-4">Top 10 percent: funds in the highest percentile of their sub-category.</div>
            </div>
          </details>
        </div>
      )}

      {tab === "data" && (
        <div className="mt-8 space-y-6">
          <div className="bg-white border border-[#E3E7DF] rounded-3xl p-5 md:p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-[#6B7C70] font-serif">How to use the screener</p>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-serif text-[#4A5D4E]">
              <div className="bg-[#F7F4EC] border border-[#E7DDC7] rounded-2xl p-4">1. Start with a category or benchmark.</div>
              <div className="bg-[#EEF4FF] border border-[#DDE3EE] rounded-2xl p-4">2. Filter by alpha/IR and AUM to keep quality.</div>
              <div className="bg-[#EAF1E8] border border-[#DCE7D7] rounded-2xl p-4">3. Open a fund card to compare details.</div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-8 gap-4">
            <div className="lg:col-span-2">
              <label className="text-xs uppercase tracking-[0.2em] font-serif text-[#6B7C70]">Search</label>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Fund or AMC"
                className="mt-2 w-full rounded-2xl border border-[#E3E7DF] bg-white px-4 py-3 text-sm font-serif"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] font-serif text-[#6B7C70]">Category</label>
              <select
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value);
                  setSubCategory("All");
                }}
                className="mt-2 w-full rounded-2xl border border-[#E3E7DF] bg-white px-4 py-3 text-sm font-serif"
              >
                <option value="All">All</option>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] font-serif text-[#6B7C70]">Sub-category</label>
              <select
                value={subCategory}
                onChange={(event) => setSubCategory(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#E3E7DF] bg-white px-4 py-3 text-sm font-serif"
              >
                <option value="All">All</option>
                {subCategories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] font-serif text-[#6B7C70]">Benchmark</label>
              <select
                value={benchmark}
                onChange={(event) => setBenchmark(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#E3E7DF] bg-white px-4 py-3 text-sm font-serif"
              >
                <option value="All">All</option>
                {benchmarks.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] font-serif text-[#6B7C70]">Min alpha 3Y</label>
              <input
                type="number"
                value={minAlpha3Y}
                onChange={(event) => setMinAlpha3Y(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#E3E7DF] bg-white px-4 py-3 text-sm font-serif"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] font-serif text-[#6B7C70]">Min alpha 5Y</label>
              <input
                type="number"
                value={minAlpha5Y}
                onChange={(event) => setMinAlpha5Y(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#E3E7DF] bg-white px-4 py-3 text-sm font-serif"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] font-serif text-[#6B7C70]">Min IR 3Y</label>
              <input
                type="number"
                value={minIr3Y}
                onChange={(event) => setMinIr3Y(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#E3E7DF] bg-white px-4 py-3 text-sm font-serif"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] font-serif text-[#6B7C70]">Min IR 5Y</label>
              <input
                type="number"
                value={minIr5Y}
                onChange={(event) => setMinIr5Y(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#E3E7DF] bg-white px-4 py-3 text-sm font-serif"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] font-serif text-[#6B7C70]">Min AUM (Cr)</label>
              <input
                type="number"
                value={minAum}
                onChange={(event) => setMinAum(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#E3E7DF] bg-white px-4 py-3 text-sm font-serif"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-3 text-sm font-serif text-[#4A5D4E]">
                <input
                  type="checkbox"
                  checked={topOnly}
                  onChange={(event) => setTopOnly(event.target.checked)}
                  className="h-4 w-4 rounded border-[#C9D2C6]"
                />
                Top 10 percent only
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm font-serif text-[#6B7C70]">{filtered.length} funds matched</p>
            <p className="text-xs font-serif text-[#6B7C70]">Data as of {manifest?.reportDate ?? "latest run"}</p>
          </div>

          <div className="md:hidden space-y-3">
            {filtered.map((fund) => (
              <div key={`card-${fund.AMC}-${fund.Fund_Name}`} className="border border-[#E3E7DF] rounded-2xl p-4 bg-white">
                <div className="text-sm font-serif text-[#1F2937]">{fund.Fund_Name}</div>
                <div className="text-xs text-[#6B7C70]">{fund.AMC}</div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#6B7C70]">
                  <div>Category: {fund.Category}</div>
                  <div>Sub: {fund.Sub_Category}</div>
                  <div>Benchmark: {fund.Benchmark_Name}</div>
                  <div>AUM: {formatNumber(fund.Current_AUM, 0)} Cr</div>
                  <div>1Y: {formatPair(fund.Fund_Return_1Y, fund.Benchmark_Return_1Y)}</div>
                  <div>3Y: {formatPair(fund.Fund_Return_3Y, fund.Benchmark_Return_3Y)}</div>
                  <div>5Y: {formatPair(fund.Fund_Return_5Y, fund.Benchmark_Return_5Y)}</div>
                  <div>IR 3Y: {formatNumber(fund.IR_3Y, 2)}</div>
                  <div>Score: {formatNumber(fund.Composite_Score, 3)}</div>
                  <div>Rank: {fund.Rank_in_SubCategory}</div>
                </div>
                <button
                  type="button"
                  onClick={() => openDetails(fund)}
                  className="mt-3 text-xs text-[#4A5D4E] underline"
                >
                  View details
                </button>
              </div>
            ))}
          </div>

          <div className="hidden md:block">
            <FilterableTable
              data={filtered}
              rowKey={(row) => `${row.AMC}-${row.Fund_Name}`}
              defaultSortKey="Composite_Score"
              defaultSortDir="desc"
              columns={[
                {
                  key: "Fund_Name",
                  label: "Fund",
                  tooltip: "Fund name and AMC.",
                  format: (_value, row) => (
                    <div>
                      <div className="font-serif text-[#1F2937]">{row.Fund_Name}</div>
                      <div className="text-xs text-[#6B7C70]">{row.AMC}</div>
                    </div>
                  ),
                },
                { key: "Category", label: "Category", tooltip: "AMFI category." },
                { key: "Benchmark_Name", label: "Benchmark", tooltip: "Primary benchmark index." },
                {
                  key: "Current_AUM",
                  label: "AUM (Cr)",
                  align: "right",
                  tooltip: "Assets under management in crores.",
                  format: (value) => formatNumber(value as number | null, 0),
                },
                {
                  key: "Fund_Return_1Y",
                  label: "1Y Fund/Bench",
                  align: "right",
                  tooltip: "1Y fund return vs benchmark return.",
                  format: (_value, row) => formatPair(row.Fund_Return_1Y, row.Benchmark_Return_1Y),
                },
                {
                  key: "Fund_Return_3Y",
                  label: "3Y Fund/Bench",
                  align: "right",
                  tooltip: "3Y fund return vs benchmark return.",
                  format: (_value, row) => formatPair(row.Fund_Return_3Y, row.Benchmark_Return_3Y),
                },
                {
                  key: "Fund_Return_5Y",
                  label: "5Y Fund/Bench",
                  align: "right",
                  tooltip: "5Y fund return vs benchmark return.",
                  format: (_value, row) => formatPair(row.Fund_Return_5Y, row.Benchmark_Return_5Y),
                },
                {
                  key: "Alpha_3Y",
                  label: "Alpha 3Y",
                  align: "right",
                  tooltip: "Fund return minus benchmark over 3 years.",
                  format: (value) => tonePct(value as number | null),
                },
                {
                  key: "Alpha_5Y",
                  label: "Alpha 5Y",
                  align: "right",
                  tooltip: "Fund return minus benchmark over 5 years.",
                  format: (value) => tonePct(value as number | null),
                },
                {
                  key: "IR_3Y",
                  label: "IR 3Y",
                  align: "right",
                  tooltip: "Information ratio over 3 years.",
                  format: (value) => formatNumber(value as number | null, 2),
                },
                {
                  key: "IR_5Y",
                  label: "IR 5Y",
                  align: "right",
                  tooltip: "Information ratio over 5 years.",
                  format: (value) => formatNumber(value as number | null, 2),
                },
                {
                  key: "Composite_Score",
                  label: "Score",
                  align: "right",
                  tooltip: "Composite score blending alpha and IR.",
                  format: (value) => formatNumber(value as number | null, 3),
                },
                {
                  key: "Rank_in_SubCategory",
                  label: "Rank",
                  align: "right",
                  tooltip: "Rank within sub-category.",
                },
                {
                  key: "details",
                  label: "Details",
                  align: "right",
                  tooltip: "Open the full fund record.",
                  format: (_value, row) => (
                    <button
                      type="button"
                      onClick={() => openDetails(row as FundAnalytics)}
                      className="text-xs text-[#4A5D4E] underline"
                    >
                      View
                    </button>
                  ),
                },
              ]}
            />
          </div>

          {selected && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/30 px-4">
              <div className="max-w-2xl w-full bg-gradient-to-br from-[#FFFFFF] to-[#F6F8F3] border border-[#E3E7DF] rounded-3xl p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.6)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-[#6B7C70] font-serif">Fund snapshot</p>
                    <h3 className="mt-2 text-xl font-serif text-[#1F2937]">{selected.Fund_Name}</h3>
                    <p className="text-sm font-serif text-[#6B7C70]">{selected.AMC}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="text-xs uppercase tracking-[0.2em] text-[#6B7C70]"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white border border-[#E3E7DF] rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-[#1F2937]">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#EAF1E8]">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                          <circle cx="5" cy="5" r="4" />
                        </svg>
                      </span>
                      <span className="font-serif">Identity</span>
                    </div>
                    <div className="mt-2 text-xs text-[#6B7C70] space-y-1">
                      <div>Category: {selected.Category}</div>
                      <div>Sub-category: {selected.Sub_Category}</div>
                      <div>Benchmark: {selected.Benchmark_Name}</div>
                    </div>
                  </div>
                  <div className="bg-white border border-[#E3E7DF] rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-[#1F2937]">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#EEF4FF]">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                          <circle cx="5" cy="5" r="4" />
                        </svg>
                      </span>
                      <span className="font-serif">Performance</span>
                    </div>
                    <div className="mt-2 text-xs text-[#6B7C70] space-y-1">
                      <div>1Y: {formatPair(selected.Fund_Return_1Y, selected.Benchmark_Return_1Y)}</div>
                      <div>3Y: {formatPair(selected.Fund_Return_3Y, selected.Benchmark_Return_3Y)}</div>
                      <div>5Y: {formatPair(selected.Fund_Return_5Y, selected.Benchmark_Return_5Y)}</div>
                      <div>Alpha 3Y: {tonePct(selected.Alpha_3Y)}</div>
                      <div>IR 3Y: {formatNumber(selected.IR_3Y, 2)}</div>
                    </div>
                  </div>
                  <div className="bg-white border border-[#E3E7DF] rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-[#1F2937]">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#FFF2DA]">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                          <circle cx="5" cy="5" r="4" />
                        </svg>
                      </span>
                      <span className="font-serif">Scale</span>
                    </div>
                    <div className="mt-2 text-xs text-[#6B7C70] space-y-1">
                      <div>AUM: {formatNumber(selected.Current_AUM, 0)} Cr</div>
                      <div>Score: {formatNumber(selected.Composite_Score, 2)}</div>
                      <div>Rank: {selected.Rank_in_SubCategory}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <details className="bg-[#F7F4EC] border border-[#E7DDC7] rounded-3xl p-5 text-sm font-serif text-[#5A4B2B]">
            <summary className="cursor-pointer">Show raw dataset (all fields)</summary>
            <div className="mt-4">
              <FilterableTable
                data={rawSlice}
                rowKey={(row, idx) => `${row.Fund_Name}-${idx}`}
                columns={rawTableColumns}
                dense
                maxHeightClassName="max-h-[420px]"
              />
            </div>
            <div className="mt-4 flex items-center justify-between text-xs">
              <span>
                Page {rawPage + 1} of {totalPages}
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setRawPage((page) => Math.max(0, page - 1))}
                  disabled={rawPage === 0}
                  className="px-3 py-1 rounded-full border border-[#E7DDC7] disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setRawPage((page) => Math.min(totalPages - 1, page + 1))}
                  disabled={rawPage >= totalPages - 1}
                  className="px-3 py-1 rounded-full border border-[#E7DDC7] disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </details>
        </div>
      )}
    </section>
  );
}
