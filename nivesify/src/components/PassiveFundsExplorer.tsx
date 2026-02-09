"use client";

import { useEffect, useMemo, useState } from "react";
import FilterableTable from "@/components/FilterableTable";
import type { ETFAnalytics, Manifest } from "@/lib/fund-types";

type TabKey = "insights" | "shortlist" | "methodology" | "data";

type PassiveFundsExplorerProps = {
  etfs: ETFAnalytics[];
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

const formatPair = (fund: number | null | undefined, bench: number | null | undefined) => {
  if (fund === null || fund === undefined || bench === null || bench === undefined) return "-";
  const color = fund >= bench ? "text-[#2F6B45]" : "text-[#8B3A3A]";
  return (
    <span className={color}>
      {fund.toFixed(1)}/{bench.toFixed(1)}
    </span>
  );
};

export default function PassiveFundsExplorer({
  etfs,
  manifest,
}: PassiveFundsExplorerProps) {
  const [tab, setTab] = useState<TabKey>("insights");
  const [query, setQuery] = useState("");
  const [benchmark, setBenchmark] = useState("All");
  const [minAum, setMinAum] = useState("");
  const [maxTrackingDiff, setMaxTrackingDiff] = useState("");
  const [selected, setSelected] = useState<ETFAnalytics | null>(null);
  const [rawPage, setRawPage] = useState(0);

  const benchmarks = useMemo(() => {
    return Array.from(new Set(etfs.map((etf) => etf.Benchmark_Name).filter(Boolean))).sort();
  }, [etfs]);

  const filtered = useMemo(() => {
    const aumMin = minAum.trim() === "" ? null : Number(minAum);
    const tdMax = maxTrackingDiff.trim() === "" ? null : Number(maxTrackingDiff);

    const result = etfs.filter((etf) => {
      if (benchmark !== "All" && etf.Benchmark_Name !== benchmark) return false;
      if (aumMin !== null && etf.Fund_AUM < aumMin) return false;
      if (tdMax !== null && Math.abs(etf.Tracking_Diff_3Y ?? 999) > tdMax) return false;
      if (query.trim().length > 0) {
        const q = query.toLowerCase();
        const name = String(etf.ETF_Name ?? "").toLowerCase();
        const amc = String(etf.AMC ?? "").toLowerCase();
        if (!name.includes(q) && !amc.includes(q)) {
          return false;
        }
      }
      return true;
    });

    result.sort((a, b) => (b.ETF_Score ?? 0) - (a.ETF_Score ?? 0));

    return result;
  }, [etfs, benchmark, minAum, maxTrackingDiff, query]);

  const rawColumns = useMemo(() => Object.keys(etfs[0] ?? {}), [etfs]);
  const rawTableColumns = useMemo(() => {
    const sample = etfs[0] as unknown as Record<string, unknown> | undefined;
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
  }, [rawColumns, etfs]);
  const pageSize = 50;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rawSlice = filtered.slice(rawPage * pageSize, rawPage * pageSize + pageSize);

  useEffect(() => {
    setRawPage(0);
  }, [query, benchmark, minAum, maxTrackingDiff]);

  const medianTd = useMemo(() => {
    const values = etfs
      .map((etf) => etf.Tracking_Diff_3Y)
      .filter((val): val is number => val !== null && val !== undefined)
      .map((val) => Math.abs(val))
      .sort((a, b) => a - b);
    if (!values.length) return null;
    return values[Math.floor(values.length / 2)];
  }, [etfs]);

  const totalPassiveAum = useMemo(() => {
    return etfs.reduce((sum, etf) => sum + (etf.Fund_AUM ?? 0), 0);
  }, [etfs]);

  const benchmarkStats = useMemo(() => {
    const grouped = new Map<string, ETFAnalytics[]>();
    etfs.forEach((etf) => {
      const key = etf.Benchmark_Name ?? "Unknown";
      const list = grouped.get(key) ?? [];
      list.push(etf);
      grouped.set(key, list);
    });

    const mean = (values: Array<number | null | undefined>) => {
      const cleaned = values.filter((value): value is number => value !== null && value !== undefined);
      if (!cleaned.length) return null;
      const total = cleaned.reduce((sum, value) => sum + value, 0);
      return total / cleaned.length;
    };

    return Array.from(grouped.entries()).map(([name, list]) => {
      const tdValues = list
        .map((item) => item.Tracking_Diff_3Y)
        .filter((val): val is number => val !== null && val !== undefined)
        .map((val) => Math.abs(val))
        .sort((a, b) => a - b);
      const median = tdValues.length ? tdValues[Math.floor(tdValues.length / 2)] : null;
      const best = list
        .filter((item) => item.Tracking_Diff_3Y !== null && item.Tracking_Diff_3Y !== undefined)
        .sort((a, b) => Math.abs(a.Tracking_Diff_3Y ?? 999) - Math.abs(b.Tracking_Diff_3Y ?? 999))[0];
      return {
        Benchmark: name,
        Tracker_Count: list.length,
        Total_AUM: list.reduce((sum, item) => sum + (item.Fund_AUM ?? 0), 0),
        Median_TD_3Y: median,
        Best_TD_3Y: best?.Tracking_Diff_3Y ?? null,
        Best_Fund: best?.ETF_Name ?? "-",
        Avg_Fund_Return_1Y: mean(list.map((item) => item.Fund_Return_1Y)),
        Avg_Fund_Return_3Y: mean(list.map((item) => item.Fund_Return_3Y)),
        Avg_Benchmark_Return_1Y: mean(list.map((item) => item.Benchmark_Return_1Y)),
        Avg_Benchmark_Return_3Y: mean(list.map((item) => item.Benchmark_Return_3Y)),
        Avg_Fund_Return_5Y: null,
        Avg_Benchmark_Return_5Y: null,
      };
    });
  }, [etfs]);

  const benchmarkLeaders = useMemo(() => {
    return [...benchmarkStats]
      .filter((row) => row.Best_TD_3Y !== null)
      .sort((a, b) => (b.Total_AUM ?? 0) - (a.Total_AUM ?? 0))
      .slice(0, 6);
  }, [benchmarkStats]);

  const chartBenchmarks = useMemo(() => {
    const grouped = new Map<string, number[]>();
    etfs.forEach((etf) => {
      const list = grouped.get(etf.Benchmark_Name) ?? [];
      if (etf.Tracking_Diff_3Y !== null) {
        list.push(Math.abs(etf.Tracking_Diff_3Y));
      }
      grouped.set(etf.Benchmark_Name, list);
    });

    const averages = Array.from(grouped.entries())
      .map(([name, list]) => {
        if (!list.length) return { name, avg: null };
        const sum = list.reduce((acc, val) => acc + val, 0);
        return { name, avg: sum / list.length };
      })
      .filter((row) => row.avg !== null)
      .sort((a, b) => (a.avg ?? 0) - (b.avg ?? 0))
      .slice(0, 6);

    return averages as Array<{ name: string; avg: number }>;
  }, [etfs]);

  const maxTracking = useMemo(() => {
    return Math.max(1, ...chartBenchmarks.map((row) => row.avg));
  }, [chartBenchmarks]);

  const openDetails = (etf: ETFAnalytics) => {
    setSelected(etf);
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
          <div className="bg-white border border-[#E3E7DF] rounded-3xl p-5 md:p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-[#6B7C70] font-serif">Passive philosophy</p>
            <h3 className="mt-2 text-2xl font-serif text-[#1F2937]">Own the market, minimize leakage.</h3>
            <p className="mt-3 text-sm font-serif text-[#4A5D4E] max-w-2xl">
              Passive funds are about capturing market returns at the lowest possible cost. The two levers that
              matter most are tracking difference and fund scale. We surface the trackers with tighter replication
              and enough AUM to trade efficiently.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white border border-[#E3E7DF] rounded-3xl p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-[#6B7C70] font-serif">Coverage</p>
              <p className="mt-4 text-3xl font-serif text-[#1F2937]">{manifest?.counts?.etfs ?? etfs.length}</p>
              <p className="text-sm font-serif text-[#6B7C70]">passive funds tracked</p>
            </div>
            <div className="bg-white border border-[#E3E7DF] rounded-3xl p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-[#6B7C70] font-serif">Benchmarks</p>
              <p className="mt-4 text-3xl font-serif text-[#1F2937]">{benchmarks.length}</p>
              <p className="text-sm font-serif text-[#6B7C70]">indices with trackers</p>
            </div>
            <div className="bg-white border border-[#E3E7DF] rounded-3xl p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-[#6B7C70] font-serif">Median TD 3Y</p>
              <p className="mt-4 text-3xl font-serif text-[#1F2937]">
                {medianTd === null ? "-" : `${medianTd.toFixed(2)}%`}
              </p>
              <p className="text-sm font-serif text-[#6B7C70]">lower is tighter tracking</p>
            </div>
            <div className="bg-white border border-[#E3E7DF] rounded-3xl p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-[#6B7C70] font-serif">Total AUM</p>
              <p className="mt-4 text-3xl font-serif text-[#1F2937]">{formatCompact(totalPassiveAum)}</p>
              <p className="text-sm font-serif text-[#6B7C70]">across passive universe</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white border border-[#E3E7DF] rounded-3xl p-6">
              <h3 className="text-lg font-serif text-[#1F2937] mb-4">Benchmark leaders</h3>
              <div className="space-y-4">
                {benchmarkLeaders.map((leader) => {
                  return (
                    <div key={leader.Benchmark} className="border border-[#EDF0EA] rounded-2xl p-4">
                      <div className="text-sm font-serif text-[#6B7C70]">{leader.Benchmark}</div>
                      <div className="mt-2 text-lg font-serif text-[#1F2937]">{leader.Best_Fund}</div>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-[#6B7C70]">
                        <span>Best TD 3Y: {formatPct(leader.Best_TD_3Y)}</span>
                        <span>Total AUM: {formatNumber(leader.Total_AUM, 0)} Cr</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white border border-[#E3E7DF] rounded-3xl p-6">
              <h3 className="text-lg font-serif text-[#1F2937] mb-4">Benchmark discipline</h3>
              <FilterableTable
                data={benchmarkStats}
                rowKey={(row) => `bench-${row.Benchmark}`}
                defaultSortKey="Total_AUM"
                defaultSortDir="desc"
                columns={[
                  { key: "Benchmark", label: "Benchmark" },
                  {
                    key: "Tracker_Count",
                    label: "Trackers",
                    align: "right",
                    tooltip: "Number of trackers for the benchmark.",
                  },
                  {
                    key: "Total_AUM",
                    label: "Total AUM",
                    align: "right",
                    tooltip: "Total AUM tracking this benchmark.",
                    format: (value) => formatNumber(value as number | null | undefined, 0),
                  },
                  {
                    key: "Median_TD_3Y",
                    label: "Median TD 3Y",
                    align: "right",
                    tooltip: "Median tracking difference (3Y).",
                    format: (value) => tonePct(value as number | null | undefined),
                  },
                  {
                    key: "Best_TD_3Y",
                    label: "Best TD 3Y",
                    align: "right",
                    tooltip: "Best (lowest) tracking difference (3Y).",
                    format: (value) => tonePct(value as number | null | undefined),
                  },
                  {
                    key: "Avg_Fund_Return_1Y",
                    label: "Avg 1Y fund",
                    align: "right",
                    tooltip: "Average 1-year fund return for this benchmark.",
                    format: (value) => tonePct(value as number | null | undefined),
                  },
                  {
                    key: "Avg_Benchmark_Return_1Y",
                    label: "Avg 1Y bench",
                    align: "right",
                    tooltip: "Average 1-year benchmark return.",
                    format: (value) => tonePct(value as number | null | undefined),
                  },
                  {
                    key: "Avg_Fund_Return_3Y",
                    label: "Avg 3Y fund",
                    align: "right",
                    tooltip: "Average 3-year fund return for this benchmark.",
                    format: (value) => tonePct(value as number | null | undefined),
                  },
                  {
                    key: "Avg_Benchmark_Return_3Y",
                    label: "Avg 3Y bench",
                    align: "right",
                    tooltip: "Average 3-year benchmark return.",
                    format: (value) => tonePct(value as number | null | undefined),
                  },
                  {
                    key: "Avg_Fund_Return_5Y",
                    label: "Avg 5Y fund",
                    align: "right",
                    tooltip: "5-year data is unavailable in the current dataset.",
                    format: (value) => formatPct(value as number | null | undefined),
                  },
                  {
                    key: "Avg_Benchmark_Return_5Y",
                    label: "Avg 5Y bench",
                    align: "right",
                    tooltip: "5-year data is unavailable in the current dataset.",
                    format: (value) => formatPct(value as number | null | undefined),
                  },
                ]}
                maxHeightClassName="max-h-[420px] overflow-y-auto"
              />
            </div>
          </div>

          <div className="bg-white border border-[#E3E7DF] rounded-3xl p-6">
            <h3 className="text-lg font-serif text-[#1F2937]">Tracking discipline by benchmark</h3>
            <p className="mt-2 text-sm font-serif text-[#4A5D4E]">
              Lower average tracking difference means closer index replication.
            </p>
            <div className="mt-6 space-y-4">
              {chartBenchmarks.map((row) => {
                const width = Math.round((row.avg / maxTracking) * 100);
                return (
                  <div key={`bench-${row.name}`} className="space-y-2">
                    <div className="flex items-center justify-between text-sm font-serif text-[#1F2937]">
                      <span>{row.name}</span>
                      <span className="text-xs text-[#6B7C70]">Avg TD 3Y {row.avg.toFixed(2)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#EEF1E9] overflow-hidden">
                      <div className="h-full bg-[#4A5D4E]" style={{ width: `${width}%` }} />
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
            <h3 className="mt-2 text-2xl font-serif text-[#1F2937]">Low tracking difference, strong scale.</h3>
            <p className="mt-2 text-sm font-serif text-[#4A5D4E] max-w-2xl">
              We focus on the biggest benchmarks by AUM and highlight the two trackers with the lowest tracking
              difference. This keeps cost leakage low while preserving liquidity.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {benchmarkLeaders.map((leader) => {
              const picks = etfs
                .filter((etf) => etf.Benchmark_Name === leader.Benchmark)
                .sort((a, b) => Math.abs(a.Tracking_Diff_3Y ?? 999) - Math.abs(b.Tracking_Diff_3Y ?? 999))
                .slice(0, 2);

              return (
                <div key={`short-${leader.Benchmark}`} className="bg-white border border-[#E3E7DF] rounded-3xl p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-[#6B7C70] font-serif">Benchmark</p>
                      <h4 className="mt-2 text-lg font-serif text-[#1F2937]">{leader.Benchmark}</h4>
                      <p className="text-xs text-[#6B7C70]">Total AUM: {formatNumber(leader.Total_AUM, 0)} Cr</p>
                    </div>
                    <details className="text-xs text-[#6B7C70]">
                      <summary className="cursor-pointer">i</summary>
                      <div className="mt-2">Top 2 by lowest absolute TD 3Y.</div>
                    </details>
                  </div>
                  <div className="mt-4 space-y-3">
                    {picks.map((etf) => (
                      <div key={`${etf.ETF_Name}-${etf.AMC}`} className="border border-[#EDF0EA] rounded-2xl p-4">
                        <div className="text-sm font-serif text-[#1F2937]">{etf.ETF_Name}</div>
                        <div className="text-xs text-[#6B7C70]">{etf.AMC}</div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-[#6B7C70]">
                          <div>TD 3Y: {formatPct(etf.Tracking_Diff_3Y)}</div>
                          <div>AUM: {formatNumber(etf.Fund_AUM, 0)} Cr</div>
                          <div>1Y: {formatPair(etf.Fund_Return_1Y, etf.Benchmark_Return_1Y)}</div>
                          <div>3Y: {formatPair(etf.Fund_Return_3Y, etf.Benchmark_Return_3Y)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "methodology" && (
        <div className="mt-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Benchmark integrity",
                desc:
                  "We keep strict benchmark matching. A tracker must mirror the stated index, not a look-alike.",
              },
              {
                title: "Tracking discipline",
                desc:
                  "Tracking difference close to zero signals tight execution. Lower absolute TD means fewer leaks.",
              },
              {
                title: "Liquidity check",
                desc:
                  "Healthy AUM improves execution and lowers impact costs during rebalancing.",
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
            How to use this: start with the index that matches your risk tolerance, then pick the tracker with
            the lowest tracking difference and a healthy AUM. Confirm expense ratio before switching.
          </div>

          <details className="text-sm font-serif text-[#4A5D4E]">
            <summary className="cursor-pointer">Show tracking terms glossary</summary>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-[#E3E7DF] rounded-2xl p-4">Tracking difference: fund return minus benchmark return.</div>
              <div className="bg-white border border-[#E3E7DF] rounded-2xl p-4">ETF Score: weighted blend of tracking accuracy and AUM.</div>
              <div className="bg-white border border-[#E3E7DF] rounded-2xl p-4">Rank within benchmark: position among funds tracking the same index.</div>
              <div className="bg-white border border-[#E3E7DF] rounded-2xl p-4">AUM: assets under management in crores.</div>
            </div>
          </details>
        </div>
      )}

      {tab === "data" && (
        <div className="mt-8 space-y-6">
          <div className="bg-white border border-[#E3E7DF] rounded-3xl p-5 md:p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-[#6B7C70] font-serif">How to use the screener</p>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-serif text-[#4A5D4E]">
              <div className="bg-[#F7F4EC] border border-[#E7DDC7] rounded-2xl p-4">1. Choose a benchmark.</div>
              <div className="bg-[#EEF4FF] border border-[#DDE3EE] rounded-2xl p-4">2. Filter by TD and AUM.</div>
              <div className="bg-[#EAF1E8] border border-[#DCE7D7] rounded-2xl p-4">3. Open a tracker card to compare.</div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
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
              <label className="text-xs uppercase tracking-[0.2em] font-serif text-[#6B7C70]">Min AUM</label>
              <input
                type="number"
                value={minAum}
                onChange={(event) => setMinAum(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#E3E7DF] bg-white px-4 py-3 text-sm font-serif"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] font-serif text-[#6B7C70]">
                Max tracking diff 3Y
              </label>
              <input
                type="number"
                value={maxTrackingDiff}
                onChange={(event) => setMaxTrackingDiff(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#E3E7DF] bg-white px-4 py-3 text-sm font-serif"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm font-serif text-[#6B7C70]">{filtered.length} funds matched</p>
            <p className="text-xs font-serif text-[#6B7C70]">Data as of {manifest?.reportDate ?? "latest run"}</p>
          </div>

          <div className="md:hidden space-y-3">
            {filtered.map((etf) => (
              <div key={`card-${etf.AMC}-${etf.ETF_Name}`} className="border border-[#E3E7DF] rounded-2xl p-4 bg-white">
                <div className="text-sm font-serif text-[#1F2937]">{etf.ETF_Name}</div>
                <div className="text-xs text-[#6B7C70]">{etf.AMC}</div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#6B7C70]">
                  <div>Benchmark: {etf.Benchmark_Name}</div>
                  <div>AUM: {formatNumber(etf.Fund_AUM, 0)} Cr</div>
                  <div>TD 3Y: {formatPct(etf.Tracking_Diff_3Y)}</div>
                  <div>TD 1Y: {formatPct(etf.Tracking_Diff_1Y)}</div>
                  <div>1Y: {formatPair(etf.Fund_Return_1Y, etf.Benchmark_Return_1Y)}</div>
                  <div>3Y: {formatPair(etf.Fund_Return_3Y, etf.Benchmark_Return_3Y)}</div>
                  <div>Score: {formatNumber(etf.ETF_Score, 2)}</div>
                  <div>Rank: {etf.Rank_within_Benchmark}</div>
                </div>
                <button
                  type="button"
                  onClick={() => openDetails(etf)}
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
              rowKey={(row) => `${row.AMC}-${row.ETF_Name}`}
              defaultSortKey="ETF_Score"
              defaultSortDir="desc"
              columns={[
                {
                  key: "ETF_Name",
                  label: "Fund",
                  tooltip: "Fund name and AMC.",
                  format: (_value, row) => (
                    <div>
                      <div className="font-serif text-[#1F2937]">{row.ETF_Name}</div>
                      <div className="text-xs text-[#6B7C70]">{row.AMC}</div>
                    </div>
                  ),
                },
                { key: "Benchmark_Name", label: "Benchmark", tooltip: "Tracked index benchmark." },
                {
                  key: "Fund_AUM",
                  label: "AUM (Cr)",
                  align: "right",
                  tooltip: "Assets under management in crores.",
                  format: (value) => formatNumber(value as number | null | undefined, 0),
                },
                {
                  key: "Fund_Return_1Y",
                  label: "1Y Fund/Bench",
                  align: "right",
                  tooltip: "1Y fund return vs benchmark return.",
                  format: (_value, row) => formatPair(row.Fund_Return_1Y, row.Benchmark_Return_1Y),
                  sortValue: (row) => row.Fund_Return_1Y ?? null,
                },
                {
                  key: "Fund_Return_3Y",
                  label: "3Y Fund/Bench",
                  align: "right",
                  tooltip: "3Y fund return vs benchmark return.",
                  format: (_value, row) => formatPair(row.Fund_Return_3Y, row.Benchmark_Return_3Y),
                  sortValue: (row) => row.Fund_Return_3Y ?? null,
                },
                {
                  key: "Tracking_Diff_1Y",
                  label: "TD 1Y",
                  align: "right",
                  tooltip: "Tracking difference over 1 year.",
                  format: (value) => formatPct(value as number | null | undefined, 2),
                },
                {
                  key: "Tracking_Diff_3Y",
                  label: "TD 3Y",
                  align: "right",
                  tooltip: "Tracking difference over 3 years.",
                  format: (value) => formatPct(value as number | null | undefined, 2),
                },
                {
                  key: "ETF_Score",
                  label: "Score",
                  align: "right",
                  tooltip: "Composite tracking and liquidity score.",
                  format: (value) => formatNumber(value as number | null | undefined, 2),
                },
                {
                  key: "Rank_within_Benchmark",
                  label: "Rank",
                  align: "right",
                  tooltip: "Rank within the same benchmark.",
                },
                {
                  key: "details",
                  label: "Details",
                  align: "right",
                  tooltip: "Open the full fund record.",
                  format: (_value, row) => (
                    <button
                      type="button"
                      onClick={() => openDetails(row)}
                      className="text-xs text-[#4A5D4E] underline"
                    >
                      View
                    </button>
                  ),
                },
              ]}
              maxHeightClassName="max-h-[520px]"
            />
          </div>

          {selected && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/30 px-4">
              <div className="max-w-2xl w-full bg-gradient-to-br from-[#FFFFFF] to-[#F6F8F3] border border-[#E3E7DF] rounded-3xl p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.6)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-[#6B7C70] font-serif">Tracker snapshot</p>
                    <h3 className="mt-2 text-xl font-serif text-[#1F2937]">{selected.ETF_Name}</h3>
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
                      <div>Benchmark: {selected.Benchmark_Name}</div>
                      <div>Rank: {selected.Rank_within_Benchmark}</div>
                    </div>
                  </div>
                  <div className="bg-white border border-[#E3E7DF] rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-[#1F2937]">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#EEF4FF]">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                          <circle cx="5" cy="5" r="4" />
                        </svg>
                      </span>
                      <span className="font-serif">Tracking</span>
                    </div>
                    <div className="mt-2 text-xs text-[#6B7C70] space-y-1">
                      <div>TD 1Y: {formatPct(selected.Tracking_Diff_1Y)}</div>
                      <div>TD 3Y: {formatPct(selected.Tracking_Diff_3Y)}</div>
                      <div>Score: {formatNumber(selected.ETF_Score, 2)}</div>
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
                      <div>AUM: {formatNumber(selected.Fund_AUM, 0)} Cr</div>
                      <div>1Y: {formatPair(selected.Fund_Return_1Y, selected.Benchmark_Return_1Y)}</div>
                      <div>3Y: {formatPair(selected.Fund_Return_3Y, selected.Benchmark_Return_3Y)}</div>
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
                rowKey={(row, idx) => `${row.ETF_Name}-${idx}`}
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
