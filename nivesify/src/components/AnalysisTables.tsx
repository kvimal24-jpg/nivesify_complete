"use client";

import FilterableTable from "@/components/FilterableTable";
import type { CategoryInsights } from "@/lib/fund-types";

type EnrichedInsights = CategoryInsights & {
  Avg_10Y_Return?: number | null;
  Avg_Benchmark_Return_1Y?: number | null;
  Avg_Benchmark_Return_5Y?: number | null;
  Avg_Benchmark_Return_10Y?: number | null;
};

type AnalysisInsightsTablesProps = {
  categoryInsights: CategoryInsights[];
  subCategoryInsights: CategoryInsights[];
};

type AnalysisFullTableProps = {
  enrichedInsights: EnrichedInsights[];
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

export function AnalysisInsightsTables({
  categoryInsights,
  subCategoryInsights,
}: AnalysisInsightsTablesProps) {
  return (
    <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white border border-[#E3E7DF] rounded-3xl p-6">
        <h3 className="text-lg font-serif text-[#1F2937] mb-4">Category map</h3>
        <FilterableTable
          data={categoryInsights}
          rowKey={(row) => `category-${row.Category_Name}`}
          defaultSortKey="Total_AUM"
          defaultSortDir="desc"
          columns={[
            { key: "Category_Name", label: "Category", tooltip: "AMFI category name." },
            {
              key: "Number_of_Schemes",
              label: "Funds",
              align: "right",
              tooltip: "Number of schemes in the category.",
            },
            {
              key: "Total_AUM",
              label: "AUM (Cr)",
              align: "right",
              tooltip: "Total assets under management in the category.",
              format: (value) => formatNumber(value as number | null, 0),
            },
            {
              key: "Avg_3Y_Return",
              label: "Avg 3Y",
              align: "right",
              tooltip: "Average 3-year return for funds in this category.",
              format: (value) => tonePct(value as number | null),
            },
            {
              key: "Avg_Alpha_3Y",
              label: "Avg alpha 3Y",
              align: "right",
              tooltip: "Average fund return minus benchmark return over 3 years.",
              format: (value) => tonePct(value as number | null),
            },
            {
              key: "Pct_Funds_Beating_Benchmark_3Y",
              label: "Beat rate",
              align: "right",
              tooltip: "Percent of funds beating their benchmark over 3 years.",
              format: (value) => tonePct(value as number | null, 1, 50),
            },
          ]}
        />
      </div>
      <div className="bg-white border border-[#E3E7DF] rounded-3xl p-6">
        <h3 className="text-lg font-serif text-[#1F2937] mb-4">Sub-category signals</h3>
        <FilterableTable
          data={subCategoryInsights}
          rowKey={(row) => `sub-${row.Category_Name}-${row.Sub_Category_Name}`}
          defaultSortKey="Total_AUM"
          defaultSortDir="desc"
          columns={[
            { key: "Sub_Category_Name", label: "Sub-category", tooltip: "AMFI sub-category name." },
            {
              key: "Number_of_Schemes",
              label: "Funds",
              align: "right",
              tooltip: "Number of schemes in the sub-category.",
            },
            {
              key: "Total_AUM",
              label: "AUM (Cr)",
              align: "right",
              tooltip: "Total assets under management in the sub-category.",
              format: (value) => formatNumber(value as number | null, 0),
            },
            {
              key: "Avg_3Y_Return",
              label: "Avg 3Y",
              align: "right",
              tooltip: "Average 3-year return for funds in this sub-category.",
              format: (value) => tonePct(value as number | null),
            },
            {
              key: "Avg_Alpha_3Y",
              label: "Avg alpha 3Y",
              align: "right",
              tooltip: "Average fund return minus benchmark return over 3 years.",
              format: (value) => tonePct(value as number | null),
            },
            {
              key: "Pct_Funds_Beating_Benchmark_3Y",
              label: "Beat rate",
              align: "right",
              tooltip: "Percent of funds beating their benchmark over 3 years.",
              format: (value) => tonePct(value as number | null, 1, 50),
            },
          ]}
          maxHeightClassName="max-h-[420px] overflow-y-auto"
        />
      </div>
    </div>
  );
}

export function AnalysisFullInsightsTable({ enrichedInsights }: AnalysisFullTableProps) {
  return (
    <details className="mt-12 bg-white border border-[#E3E7DF] rounded-3xl p-6 text-sm font-serif text-[#4A5D4E]">
      <summary className="cursor-pointer">Show full insights dataset</summary>
      <FilterableTable
        data={enrichedInsights}
        dense
        rowKey={(row, index) => `insight-${row.Level}-${index}`}
        maxHeightClassName="max-h-[520px] overflow-y-auto"
        defaultSortKey="Total_AUM"
        defaultSortDir="desc"
        columns={[
          { key: "Level", label: "Level", tooltip: "Industry, Category, or Sub-category." },
          { key: "Category_Name", label: "Category", tooltip: "AMFI category name." },
          { key: "Sub_Category_Name", label: "Sub-category", tooltip: "AMFI sub-category name." },
          {
            key: "Number_of_Schemes",
            label: "Funds",
            align: "right",
            tooltip: "Number of schemes in the row.",
          },
          {
            key: "Total_AUM",
            label: "Total AUM",
            align: "right",
            tooltip: "Total assets under management in crores.",
            format: (value) => formatNumber(value as number | null, 0),
          },
          {
            key: "Median_AUM",
            label: "Median AUM",
            align: "right",
            tooltip: "Median AUM across schemes in the row.",
            format: (value) => formatNumber(value as number | null, 0),
          },
          {
            key: "Avg_1Y_Return",
            label: "Avg 1Y",
            align: "right",
            tooltip: "Average 1-year return.",
            format: (value) => tonePct(value as number | null),
          },
          {
            key: "Avg_3Y_Return",
            label: "Avg 3Y",
            align: "right",
            tooltip: "Average 3-year return.",
            format: (value) => tonePct(value as number | null),
          },
          {
            key: "Avg_5Y_Return",
            label: "Avg 5Y",
            align: "right",
            tooltip: "Average 5-year return.",
            format: (value) => tonePct(value as number | null),
          },
          {
            key: "Avg_10Y_Return",
            label: "Avg 10Y",
            align: "right",
            tooltip: "Average 10-year return.",
            format: (value) => tonePct(value as number | null),
          },
          {
            key: "Avg_Benchmark_Return_1Y",
            label: "Bench 1Y",
            align: "right",
            tooltip: "Average 1-year benchmark return.",
            format: (value) => formatPct(value as number | null),
          },
          {
            key: "Avg_Benchmark_Return_3Y",
            label: "Bench 3Y",
            align: "right",
            tooltip: "Average 3-year benchmark return.",
            format: (value) => formatPct(value as number | null),
          },
          {
            key: "Avg_Benchmark_Return_5Y",
            label: "Bench 5Y",
            align: "right",
            tooltip: "Average 5-year benchmark return.",
            format: (value) => formatPct(value as number | null),
          },
          {
            key: "Avg_Benchmark_Return_10Y",
            label: "Bench 10Y",
            align: "right",
            tooltip: "Average 10-year benchmark return.",
            format: (value) => formatPct(value as number | null),
          },
          {
            key: "Avg_Alpha_3Y",
            label: "Avg alpha 3Y",
            align: "right",
            tooltip: "Average alpha over 3 years.",
            format: (value) => tonePct(value as number | null),
          },
          {
            key: "Avg_IR_3Y",
            label: "Avg IR 3Y",
            align: "right",
            tooltip: "Average information ratio over 3 years.",
            format: (value) => formatNumber(value as number | null, 2),
          },
          {
            key: "Pct_Funds_Beating_Benchmark_3Y",
            label: "Beat rate",
            align: "right",
            tooltip: "Percent of funds beating benchmark over 3 years.",
            format: (value) => tonePct(value as number | null, 1, 50),
          },
        ]}
      />
    </details>
  );
}
