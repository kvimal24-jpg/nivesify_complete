"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
  ReferenceDot,
} from "recharts";
import { useUser } from "@/hooks/useUser";
import { InvestmentsData } from "@/lib/mutual-fund-health-check/types";
import { fetchNavHistoryForSchemes, fetchNavHistory, getNavHistoryMap } from "@/lib/mutual-fund-health-check/nav";
import { getPortfolio, getSummary } from "@/lib/mutual-fund-health-check/portfolio";
import {
  getPerformanceByYears,
} from "@/lib/mutual-fund-health-check/chart-data";
import { buildCashflows } from "@/lib/mutual-fund-health-check/cashflows";
import { xirr } from "@/lib/mutual-fund-health-check/xirr";
import { formatCurrency } from "@/lib/mutual-fund-health-check/format";
import { buildManualTransactions } from "@/lib/mutual-fund-health-check/manual";
import {
  buildReportData,
  generatePdfReport,
  tooltips,
} from "@/lib/mutual-fund-health-check/report";
import type { FundAnalytics } from "@/lib/fund-types";

const performanceOptions = [
  { label: "1 Year", value: "1" },
  { label: "5 Year", value: "5" },
  { label: "10 Year", value: "10" },
  { label: "Max", value: "max" },
];

const lineChartDataMap: Record<
  string,
  (transactions: InvestmentsData["transactions"]) => Promise<{ name: string; valueOne: number; valueTwo: number }[]>
> = {
  "1": (transactions) => getPerformanceByYears(transactions, 1),
  "5": (transactions) => getPerformanceByYears(transactions, 5),
  "10": (transactions) => getPerformanceByYears(transactions, 10),
  max: (transactions) => getPerformanceByYears(transactions, "max"),
};

function ChartCard({
  title,
  footer,
  options,
  value,
  onChange,
  showSelect = true,
  children,
}: {
  title: string;
  footer: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  showSelect?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-[#DDE6F3] bg-white p-5 shadow-[0_18px_40px_-30px_rgba(31,41,55,0.25)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-[#1F2937]">{title}</h3>
        {showSelect && (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="rounded-full border border-[#D5D9CF] bg-white px-3 py-1 text-xs uppercase tracking-[0.2em] text-[#2F5D7C]"
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="mt-4 w-full">{children}</div>
      <div className="mt-4 text-xs text-[#6B7C70]">{footer}</div>
    </div>
  );
}

const formatXAxisTick = (value: string, index: number, total: number) => {
  if (total <= 12) return value;
  const step = Math.ceil(total / 8);
  return index % step === 0 ? value : "";
};

const formatPct = (value: number | null | undefined, digits = 1) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return "-";
  return `${value.toFixed(digits)}%`;
};

const amcColors = [
  "#2F5D7C",
  "#BDA06D",
  "#7C8F7A",
  "#C9B07D",
  "#4D6F6B",
  "#D8C7A1",
  "#6B7C70",
  "#C2B59B",
  "#8A9B8B",
];

const chartMargin = { top: 10, right: 8, left: -10, bottom: 0 };
const axisDefaults = {
  tickLine: false,
  axisLine: false,
  width: 44,
  tickMargin: 4,
  tick: { fill: "#9AA3AF", fontSize: 9 },
};
const xAxisDefaults = { tickLine: false, axisLine: false, tickMargin: 8, tick: { fill: "#9AA3AF", fontSize: 9 }, minTickGap: 18 };

const normalizeFundName = (value: string) =>
  value
    .toLowerCase()
    .replace(/direct|growth|regular|plan|option|fund/gi, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const splitTokens = (value: string) => normalizeFundName(value).split(" ").filter(Boolean);

const matchesTokens = (name: string, tokens: string[]) =>
  tokens.length > 0 && tokens.every((token) => name.includes(token));

const normalizeBenchmark = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const buildFutureGrowth = (
  currentValue: number,
  investedBase: number,
  monthlySip: number,
  expectedReturn: number,
  years: number
) => {
  const monthlyRate = expectedReturn / 100 / 12;
  let corpus = currentValue;
  let invested = investedBase;
  const data: Array<{ year: number; corpus: number; invested: number }> = [{ year: 0, corpus, invested }];
  for (let year = 1; year <= years; year += 1) {
    for (let month = 0; month < 12; month += 1) {
      corpus = (corpus + monthlySip) * (1 + monthlyRate);
    }
    invested += monthlySip * 12;
    data.push({ year, corpus, invested });
  }
  return data;
};

const InfoTip = ({ text }: { text: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex" onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#D5D9CF] text-[10px] text-[#6B7C70]"
        aria-label={text}
      >
        ?
      </button>
      {open && (
        <span className="absolute left-1/2 top-6 z-50 w-52 -translate-x-1/2 rounded-lg border border-[#E6E8E1] bg-white p-2 text-[11px] text-[#6B7C70] shadow-lg">
          {text}
        </span>
      )}
    </span>
  );
};

export default function MutualFundHealthCheckDashboard() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [data, setData] = useState<InvestmentsData | null>(null);
  const [portfolio, setPortfolio] = useState<ReturnType<typeof getPortfolio> extends Promise<infer P> ? P : never>([] as any);
  const [processing, setProcessing] = useState(true);
  const [navReady, setNavReady] = useState(false);
  const [combinedTransactions, setCombinedTransactions] = useState<InvestmentsData["transactions"]>([]);
  const [performanceChart, setPerformanceChart] = useState(performanceOptions[0].value);
  const [lineData, setLineData] = useState<{ name: string; valueOne: number; valueTwo: number }[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [schemePath, setSchemePath] = useState<string[]>([]);
  const [schemeLookup, setSchemeLookup] = useState<Map<number, any>>(new Map());
  const [schemeList, setSchemeList] = useState<any[]>([]);
  const [selectedAmc, setSelectedAmc] = useState<string | null>(null);
  const [fundAnalytics, setFundAnalytics] = useState<FundAnalytics[]>([]);
  const [manualDraft, setManualDraft] = useState({ schemeCode: "", schemeName: "", amount: "", date: "" });
  const [sipDraft, setSipDraft] = useState({ schemeCode: "", schemeName: "", monthlyAmount: "", startDate: "", endDate: "" });
  const [showManualList, setShowManualList] = useState(false);
  const [showManualSection, setShowManualSection] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "benchmark">("overview");
  const [benchmarkMap, setBenchmarkMap] = useState<
    Map<string, { return1Y?: number; return3Y?: number; return5Y?: number; return10Y?: number }>
  >(new Map());
  const [fundReturnMap, setFundReturnMap] = useState<
    Map<
      string,
      {
        benchmarkName?: string | null;
        return1Y?: number;
        return3Y?: number;
        return5Y?: number;
        return10Y?: number;
      }
    >
  >(new Map());
  const disclaimerText =
    "All financial decisions involve risk and past performance is no guarantee of future results. You should consult with a qualified advisor and review all relevant disclosure documents before acting on any information provided.";
  const signalClass = (signal: string) => {
    switch (signal) {
      case "Normal":
        return "border-[#C7D6EA] bg-[#EAF1FB] text-[#2F5D7C]";
      case "Elevated":
        return "border-[#E7D7B5] bg-[#FFF7E6] text-[#8A6D3B]";
      case "Watch-worthy":
        return "border-[#F2D3B7] bg-[#FFF0E5] text-[#9A5A2C]";
      case "Strong":
        return "border-[#E4B6B6] bg-[#FCECEC] text-[#B35A5A]";
      case "Aggressive":
        return "border-[#D5A0A0] bg-[#F8E0E0] text-[#9C3F3F]";
      default:
        return "border-[#D5D9CF] bg-white text-[#6B7C70]";
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/api/auth/google");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/mutual-fund-health-check")
      .then((res) => res.json())
      .then((json) => {
        if (!json.data) {
          router.push("/mutual-fund-health-check");
          return;
        }
        setData(json.data);
      })
      .catch(() => router.push("/mutual-fund-health-check"));
  }, [user, router]);

  useEffect(() => {
    if (!data?.transactions?.length) return;
    const run = async () => {
      setProcessing(true);
      const manualInvestments = data.manualInvestments || [];
      const sipPlans = data.sipPlans || [];
      const schemeCodes = new Set<number>();
      data.transactions?.forEach((txn) => {
        const code = txn.matchingScheme?.schemeCode;
        if (Number.isFinite(code)) schemeCodes.add(code as number);
      });
      manualInvestments.forEach((item) => schemeCodes.add(item.schemeCode));
      sipPlans.forEach((plan) => schemeCodes.add(plan.schemeCode));

      await fetchNavHistoryForSchemes(Array.from(schemeCodes));
      const navResult = await fetchNavHistory(data.transactions);
      setNavReady(navResult.missing.length === 0);

      const navMap = await getNavHistoryMap(Array.from(schemeCodes));
      const manualTransactions = buildManualTransactions(manualInvestments, sipPlans, navMap, schemeLookup);
      const combined = [...(data.transactions || []), ...manualTransactions];
      setCombinedTransactions(combined);

      const portfolioData = await getPortfolio(combined);
      setPortfolio(portfolioData);
      setProcessing(false);
    };
    run();
  }, [data, schemeLookup]);

  useEffect(() => {
    if (!data?.transactions?.length) return;
    let cancelled = false;
    const loadSchemeLookup = async () => {
      try {
        const res = await fetch("/api/mutual-fund-health-check/mf");
        if (!res.ok) return;
        const json = await res.json();
        setSchemeList(json.data || []);
        const schemeCodes = new Set(
          data.transactions
            ?.map((txn) => txn.matchingScheme?.schemeCode)
            .filter((code): code is number => Number.isFinite(code))
        );
        (data.manualInvestments || []).forEach((item) => schemeCodes.add(item.schemeCode));
        (data.sipPlans || []).forEach((plan) => schemeCodes.add(plan.schemeCode));
        const map = new Map<number, any>();
        (json.data || []).forEach((scheme: any) => {
          if (schemeCodes.has(scheme.schemeCode)) {
            map.set(scheme.schemeCode, scheme);
          }
        });
        if (!cancelled) setSchemeLookup(map);
      } catch {
        // Keep existing mapping if lookup fails.
      }
    };
    loadSchemeLookup();
    return () => {
      cancelled = true;
    };
  }, [data]);

  useEffect(() => {
    const loadFundAnalytics = async () => {
      try {
        const res = await fetch("/api/funds");
        if (!res.ok) return;
        const json = await res.json();
        setFundAnalytics(json || []);
      } catch {
        setFundAnalytics([]);
      }
    };
    loadFundAnalytics();
  }, []);

  useEffect(() => {
    const loadAmfiRaw = async () => {
      try {
        const res = await fetch("/api/amfi-raw");
        if (!res.ok) return;
        const json = await res.json();
        if (!Array.isArray(json)) return;
        const benchmarkMapNext = new Map<
          string,
          {
            return1Y?: number;
            return3Y?: number;
            return5Y?: number;
            return10Y?: number;
            aum1Y?: number;
            aum3Y?: number;
            aum5Y?: number;
            aum10Y?: number;
          }
        >();
        const fundMapNext = new Map<
          string,
          {
            benchmarkName?: string | null;
            return1Y?: number;
            return3Y?: number;
            return5Y?: number;
            return10Y?: number;
            aum?: number;
          }
        >();

        json.forEach((record: any) => {
          const benchmarkName = record?.benchmark ? String(record.benchmark) : "";
          const benchmarkKey = benchmarkName ? normalizeBenchmark(benchmarkName) : "";
          const aum = Number.isFinite(record?.dailyAUM) ? Number(record.dailyAUM) : 0;
          if (benchmarkKey) {
            const existing = benchmarkMapNext.get(benchmarkKey) || {};
            const updatePeriod = (
              period: "1Y" | "3Y" | "5Y" | "10Y",
              value: number | null | undefined
            ) => {
              if (value === null || value === undefined || !Number.isFinite(value)) return;
              const aumKey = `aum${period}` as "aum1Y" | "aum3Y" | "aum5Y" | "aum10Y";
              const returnKey = `return${period}` as "return1Y" | "return3Y" | "return5Y" | "return10Y";
              const existingAum = existing[aumKey] ?? -1;
              if (aum > existingAum) {
                existing[aumKey] = aum;
                existing[returnKey] = Number(value);
              }
            };
            updatePeriod("1Y", record?.return1YearBenchmark);
            updatePeriod("3Y", record?.return3YearBenchmark);
            updatePeriod("5Y", record?.return5YearBenchmark);
            updatePeriod("10Y", record?.return10YearBenchmark);
            benchmarkMapNext.set(benchmarkKey, existing);
          }

          const schemeName = record?.schemeName ? String(record.schemeName) : "";
          const schemeKey = schemeName ? normalizeFundName(schemeName) : "";
          if (schemeKey) {
            const existingFund = fundMapNext.get(schemeKey);
            if (!existingFund || aum > (existingFund.aum ?? -1)) {
              fundMapNext.set(schemeKey, {
                benchmarkName: benchmarkName || existingFund?.benchmarkName,
                return1Y: Number.isFinite(record?.return1YearDirect) ? Number(record.return1YearDirect) : existingFund?.return1Y,
                return3Y: Number.isFinite(record?.return3YearDirect) ? Number(record.return3YearDirect) : existingFund?.return3Y,
                return5Y: Number.isFinite(record?.return5YearDirect) ? Number(record.return5YearDirect) : existingFund?.return5Y,
                return10Y: Number.isFinite(record?.return10YearDirect) ? Number(record.return10YearDirect) : existingFund?.return10Y,
                aum,
              });
            }
          }
        });

        const compactBenchmarks = new Map<string, { return1Y?: number; return3Y?: number; return5Y?: number; return10Y?: number }>();
        benchmarkMapNext.forEach((value, key) => {
          compactBenchmarks.set(key, {
            return1Y: value.return1Y,
            return3Y: value.return3Y,
            return5Y: value.return5Y,
            return10Y: value.return10Y,
          });
        });

        const compactFunds = new Map<
          string,
          { benchmarkName?: string | null; return1Y?: number; return3Y?: number; return5Y?: number; return10Y?: number }
        >();
        fundMapNext.forEach((value, key) => {
          compactFunds.set(key, {
            benchmarkName: value.benchmarkName,
            return1Y: value.return1Y,
            return3Y: value.return3Y,
            return5Y: value.return5Y,
            return10Y: value.return10Y,
          });
        });

        setBenchmarkMap(compactBenchmarks);
        setFundReturnMap(compactFunds);
      } catch {
        // ignore
      }
    };
    loadAmfiRaw();
  }, []);

  useEffect(() => {
    if (!combinedTransactions?.length || !navReady) return;
    const run = async () => {
      const line = await lineChartDataMap[performanceChart](combinedTransactions);
      setLineData(line);
    };
    run();
  }, [combinedTransactions, performanceChart, navReady]);

  useEffect(() => {
    if (!processing) {
      setElapsedSeconds(0);
      return;
    }
    const started = Date.now();
    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - started) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [processing]);

  const summary = useMemo(() => getSummary(portfolio), [portfolio]);
  const lineHasData = useMemo(
    () => lineData.some((item) => item.valueOne !== 0 || item.valueTwo !== 0),
    [lineData]
  );

  const saveData = async (nextData: InvestmentsData) => {
    setData(nextData);
    await fetch("/api/mutual-fund-health-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextData),
    });
  };

  const handleAddManual = async () => {
    if (!data) return;
    const amount = Number(manualDraft.amount);
    const schemeCode = Number(manualDraft.schemeCode);
    if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(schemeCode)) return;
    const scheme = schemeList.find((item) => item.schemeCode === schemeCode);
    const date = manualDraft.date || new Date().toISOString().slice(0, 10);
    const next = {
      ...data,
      manualInvestments: [
        ...(data.manualInvestments || []),
        {
          id: `m-${Date.now()}`,
          schemeCode,
          schemeName: manualDraft.schemeName || scheme?.schemeName || "",
          date,
          amount,
        },
      ],
    };
    await saveData(next);
    setManualDraft({ schemeCode: "", schemeName: "", amount: "", date: "" });
  };

  const handleAddSip = async () => {
    if (!data) return;
    const monthlyAmount = Number(sipDraft.monthlyAmount);
    const schemeCode = Number(sipDraft.schemeCode);
    if (!Number.isFinite(monthlyAmount) || monthlyAmount <= 0 || !Number.isFinite(schemeCode)) return;
    const scheme = schemeList.find((item) => item.schemeCode === schemeCode);
    const startDate = sipDraft.startDate || new Date().toISOString().slice(0, 10);
    const next = {
      ...data,
      sipPlans: [
        ...(data.sipPlans || []),
        {
          id: `s-${Date.now()}`,
          schemeCode,
          schemeName: sipDraft.schemeName || scheme?.schemeName || "",
          startDate,
          endDate: sipDraft.endDate || undefined,
          monthlyAmount,
        },
      ],
    };
    await saveData(next);
    setSipDraft({ schemeCode: "", schemeName: "", monthlyAmount: "", startDate: "", endDate: "" });
  };

  const analyticsMap = useMemo(() => {
    const map = new Map<string, FundAnalytics>();
    fundAnalytics.forEach((fund) => {
      const key = normalizeFundName(fund.Fund_Name);
      if (!map.has(key)) map.set(key, fund);
    });
    return map;
  }, [fundAnalytics]);

  const getFundAnalytics = (name: string) => analyticsMap.get(normalizeFundName(name));

  const fundNameOptions = useMemo(() => {
    const unique = new Set<string>();
    fundAnalytics.forEach((fund) => {
      if (fund.Fund_Name) unique.add(fund.Fund_Name);
    });
    return Array.from(unique);
  }, [fundAnalytics]);

  const schemeNameMap = useMemo(() => {
    const map = new Map<string, any>();
    schemeList.forEach((scheme) => {
      const key = normalizeFundName(scheme.schemeName || "");
      if (key && !map.has(key)) map.set(key, scheme);
    });
    return map;
  }, [schemeList]);

  const findSchemeForName = (name: string) => {
    const normalized = normalizeFundName(name);
    if (!normalized) return null;
    const direct = schemeNameMap.get(normalized);
    if (direct) return direct;
    const tokens = splitTokens(normalized);
    const loose = schemeList.find((scheme) => matchesTokens(normalizeFundName(scheme.schemeName || ""), tokens));
    return loose || null;
  };

  const getFundSuggestions = (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < 4) return [];
    const tokens = splitTokens(trimmed);
    return fundNameOptions
      .filter((name) => matchesTokens(normalizeFundName(name), tokens))
      .slice(0, 8);
  };

  const manualSuggestions = useMemo(
    () => getFundSuggestions(manualDraft.schemeName),
    [manualDraft.schemeName, fundNameOptions]
  );
  const sipSuggestions = useMemo(
    () => getFundSuggestions(sipDraft.schemeName),
    [sipDraft.schemeName, fundNameOptions]
  );

  const uniquePortfolioFunds = useMemo(() => {
    const map = new Map<string, typeof portfolio[number]>();
    portfolio
      .filter((row) => (row.currentValue || 0) > 0)
      .forEach((row) => {
        const key = normalizeFundName(row.mfName);
        if (!map.has(key)) map.set(key, row);
      });
    return Array.from(map.values());
  }, [portfolio]);

  const expectedPortfolioReturn = useMemo(() => {
    if (!portfolio.length) return 10;
    let total = 0;
    let weighted = 0;
    portfolio.forEach((row) => {
      const analytics = getFundAnalytics(row.mfName);
      const fallback = 10;
      const candidate = analytics?.Fund_Return_5Y ?? analytics?.Fund_Return_3Y ?? analytics?.Fund_Return_1Y ?? fallback;
      const weight = row.currentValue || 0;
      weighted += candidate * weight;
      total += weight;
    });
    return total > 0 ? Number((weighted / total).toFixed(2)) : 10;
  }, [uniquePortfolioFunds, analyticsMap]);

  const totalMonthlySip = useMemo(() => {
    if (!data?.sipPlans?.length) return 0;
    return data.sipPlans.reduce((sum, plan) => sum + (plan.monthlyAmount || 0), 0);
  }, [data]);

  const growthProjection = useMemo(() => {
    return buildFutureGrowth(summary.totalValue || 0, summary.invested || 0, totalMonthlySip, expectedPortfolioReturn, 15);
  }, [summary.totalValue, summary.invested, totalMonthlySip, expectedPortfolioReturn]);

  const niftyBenchmark = useMemo(() => {
    const niftyKey = normalizeBenchmark("nifty 50 tri");
    const nifty = benchmarkMap.get(niftyKey);
    if (!nifty) return null;
    const period = nifty.return10Y !== undefined ? "10Y" : nifty.return5Y !== undefined ? "5Y" : nifty.return3Y !== undefined ? "3Y" : nifty.return1Y !== undefined ? "1Y" : null;
    if (!period) return null;
    const benchmarkReturn =
      period === "10Y"
        ? nifty.return10Y
        : period === "5Y"
        ? nifty.return5Y
        : period === "3Y"
        ? nifty.return3Y
        : nifty.return1Y;
    if (benchmarkReturn === null || benchmarkReturn === undefined) return null;
    return { benchmarkReturn, period };
  }, [benchmarkMap]);

  const classifyFundType = (name: string, analytics?: FundAnalytics) => {
    const haystack = `${name} ${analytics?.Category || ""} ${analytics?.Sub_Category || ""}`.toLowerCase();
    if (haystack.includes("index") || haystack.includes("etf") || haystack.includes("passive")) return "passive";
    if ((analytics?.Sub_Category || "").toLowerCase().includes("etf")) return "passive";
    return "active";
  };

  const benchmarkComparisons = useMemo(() => {
    const active: Array<{
      name: string;
      delta: number;
      period: string;
      fundReturn: number;
      benchmarkReturn: number;
      weight: number;
      benchmarkName: string;
    }> = [];
    const passive: Array<{
      name: string;
      delta: number;
      period: string;
      fundReturn: number;
      benchmarkReturn: number;
      weight: number;
      benchmarkName: string;
    }> = [];

    uniquePortfolioFunds.forEach((row) => {
      const analytics = getFundAnalytics(row.mfName);
      if (!analytics) return;
      const benchmarkName = analytics.Benchmark_Name || fundReturnMap.get(normalizeFundName(row.mfName))?.benchmarkName;
      const benchmarkKey = benchmarkName ? normalizeBenchmark(benchmarkName) : "";
      const benchmarkReturns = benchmarkKey ? benchmarkMap.get(benchmarkKey) : null;
      const periods: Array<[string, number | null, number | null]> = [
        [
          "5Y",
          analytics.Fund_Return_5Y,
          analytics.Benchmark_Return_5Y ?? benchmarkReturns?.return5Y ?? null,
        ],
        [
          "3Y",
          analytics.Fund_Return_3Y,
          analytics.Benchmark_Return_3Y ?? benchmarkReturns?.return3Y ?? null,
        ],
        [
          "1Y",
          analytics.Fund_Return_1Y,
          analytics.Benchmark_Return_1Y ?? benchmarkReturns?.return1Y ?? null,
        ],
      ];
      const usable = periods.find((entry) => entry[1] !== null && entry[2] !== null);
      if (!usable) return;
      const [period, fundReturn, benchmarkReturn] = usable as [string, number, number];
      const item = {
        name: row.mfName,
        delta: fundReturn - benchmarkReturn,
        period,
        fundReturn,
        benchmarkReturn,
        weight: row.currentValue || 0,
        benchmarkName: benchmarkName || "Benchmark",
      };
      const type = classifyFundType(row.mfName, analytics);
      if (type === "passive") passive.push(item);
      else active.push(item);
    });

    return { active, passive };
  }, [portfolio, analyticsMap]);

  const activeStats = useMemo(() => {
    if (!benchmarkComparisons.active.length) return null;
    const total = benchmarkComparisons.active.length;
    const wins = benchmarkComparisons.active.filter((item) => item.delta >= 0).length;
    const avgDelta =
      benchmarkComparisons.active.reduce((sum, item) => sum + item.delta, 0) / benchmarkComparisons.active.length;
    const laggards = [...benchmarkComparisons.active].sort((a, b) => a.delta - b.delta).slice(0, 3);
    const weightTotal = benchmarkComparisons.active.reduce((sum, item) => sum + item.weight, 0) || 1;
    const underperformingWeight = benchmarkComparisons.active
      .filter((item) => item.delta < 0)
      .reduce((sum, item) => sum + item.weight, 0);
    return {
      total,
      wins,
      avgDelta,
      laggards,
      underperformingShare: underperformingWeight / weightTotal,
    };
  }, [benchmarkComparisons.active]);

  const passiveStats = useMemo(() => {
    if (!benchmarkComparisons.passive.length) return null;
    const avgTracking =
      benchmarkComparisons.passive.reduce((sum, item) => sum + Math.abs(item.delta), 0) /
      benchmarkComparisons.passive.length;
    const worstTracking = [...benchmarkComparisons.passive].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 3);
    return { avgTracking, worstTracking };
  }, [benchmarkComparisons.passive]);

  const benchmarkCoverage = useMemo(() => {
    const totalFunds = uniquePortfolioFunds.length;
    const covered = benchmarkComparisons.active.length + benchmarkComparisons.passive.length;
    return { totalFunds, covered };
  }, [uniquePortfolioFunds, benchmarkComparisons]);

  const benchmarkMovers = useMemo(() => {
    const activeWinners = [...benchmarkComparisons.active].sort((a, b) => b.delta - a.delta).slice(0, 3);
    const activeLaggards = [...benchmarkComparisons.active].sort((a, b) => a.delta - b.delta).slice(0, 3);
    const passiveDrift = [...benchmarkComparisons.passive]
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 3);
    return { activeWinners, activeLaggards, passiveDrift };
  }, [benchmarkComparisons]);

  const benchmarkInsights = useMemo(() => {
    const total = benchmarkComparisons.active.length + benchmarkComparisons.passive.length;
    const winners = [...benchmarkComparisons.active, ...benchmarkComparisons.passive].filter((item) => item.delta >= 0).length;
    const winRate = total ? winners / total : 0;
    const activeAvg = benchmarkComparisons.active.length
      ? benchmarkComparisons.active.reduce((sum, item) => sum + item.delta, 0) / benchmarkComparisons.active.length
      : null;
    const passiveAvg = benchmarkComparisons.passive.length
      ? benchmarkComparisons.passive.reduce((sum, item) => sum + item.delta, 0) / benchmarkComparisons.passive.length
      : null;
    const worst = [...benchmarkComparisons.active, ...benchmarkComparisons.passive].sort((a, b) => a.delta - b.delta).slice(0, 3);
    return { winRate, activeAvg, passiveAvg, worst };
  }, [benchmarkComparisons]);

  const mixShare = useMemo(() => {
    const activeWeight = benchmarkComparisons.active.reduce((sum, item) => sum + item.weight, 0);
    const passiveWeight = benchmarkComparisons.passive.reduce((sum, item) => sum + item.weight, 0);
    const total = activeWeight + passiveWeight || 1;
    return {
      activeWeight,
      passiveWeight,
      activeShare: activeWeight / total,
      passiveShare: passiveWeight / total,
    };
  }, [benchmarkComparisons]);

  const benchmarkTable = useMemo(() => {
    return uniquePortfolioFunds.map((row) => {
      const analytics = getFundAnalytics(row.mfName);
      const normalized = normalizeFundName(row.mfName);
      const fundReturns = fundReturnMap.get(normalized);
      const benchmarkName = analytics?.Benchmark_Name || fundReturns?.benchmarkName || "-";
      const benchmarkKey = benchmarkName && benchmarkName !== "-" ? normalizeBenchmark(benchmarkName) : "";
      const benchmarkReturns = benchmarkKey ? benchmarkMap.get(benchmarkKey) : null;

      const fundReturnCandidates: Array<[string, number | null | undefined]> = [
        ["10Y", fundReturns?.return10Y],
        ["5Y", analytics?.Fund_Return_5Y],
        ["3Y", analytics?.Fund_Return_3Y],
        ["1Y", analytics?.Fund_Return_1Y],
      ];
      const fundReturnPick = fundReturnCandidates.find((entry) => entry[1] !== null && entry[1] !== undefined) || ["-", null];
      const fundPeriod = fundReturnPick[0] as string;
      const fundReturn = fundReturnPick[1] ?? null;

      const benchmarkReturnByPeriod = (period: string) => {
        if (!benchmarkReturns) return null;
        if (period === "10Y") return benchmarkReturns.return10Y ?? null;
        if (period === "5Y") return benchmarkReturns.return5Y ?? null;
        if (period === "3Y") return benchmarkReturns.return3Y ?? null;
        if (period === "1Y") return benchmarkReturns.return1Y ?? null;
        return null;
      };

      const benchmarkReturn = benchmarkReturnByPeriod(fundPeriod) ?? benchmarkReturns?.return10Y ?? null;
      const benchmarkPeriod = benchmarkReturnByPeriod(fundPeriod) ? fundPeriod : benchmarkReturns?.return10Y ? "10Y" : "-";
      const delta = fundReturn !== null && benchmarkReturn !== null ? fundReturn - benchmarkReturn : null;

      return {
        name: row.mfName,
        benchmarkName,
        fundReturn,
        fundPeriod,
        benchmarkReturn,
        benchmarkPeriod,
        delta,
      };
    });
  }, [uniquePortfolioFunds, fundReturnMap, benchmarkMap, analyticsMap]);

  const postureSummary = useMemo(() => {
    const activeShare = mixShare.activeShare;
    const passiveShare = mixShare.passiveShare;
    if (activeShare >= 0.6 && activeStats && activeStats.underperformingShare >= 0.5) {
      return "Active-heavy mix with many lagging funds. Consider shifting part of the core into a low-cost index fund and review underperformers.";
    }
    if (passiveShare >= 0.6 && passiveStats && passiveStats.avgTracking <= 1.2) {
      return "Passive core is steady and tracking well. Keep costs low and review if tracking widens.";
    }
    if (passiveShare >= 0.6 && passiveStats && passiveStats.avgTracking > 1.2) {
      return "Passive allocation is high but tracking differences look wide. Compare expense ratios or similar index alternatives.";
    }
    return "Balanced active/passive mix. Focus on trimming laggards and keep your passive core as the stability anchor.";
  }, [mixShare, activeStats, passiveStats]);

  const xirrValue = useMemo(() => {
    if (!portfolio.length) return null;
    const allTransactions = portfolio.flatMap((fund) =>
      fund.allTransactions.map((txn) => ({
        amount: txn.amount,
        date: new Date(txn.date),
        type: txn.type === "Investment" ? "buy" : "sell",
      }))
    );
    const isComplete = true;
    const cashflows = buildCashflows(allTransactions, summary.totalValue, new Date(), isComplete);
    if (cashflows.length < 2) return null;
    const days = (cashflows[cashflows.length - 1].date.getTime() - cashflows[0].date.getTime()) / (1000 * 3600 * 24);
    if (days < 365) return null;
    return xirr(cashflows);
  }, [portfolio, summary.totalValue]);

  const report = useMemo(() => {
    if (!data) return null;
    return buildReportData(data, portfolio, summary.totalValue, xirrValue, schemeLookup);
  }, [data, portfolio, summary.totalValue, xirrValue, schemeLookup]);
  useEffect(() => {
    setSchemePath([]);
  }, [report]);
  const schemeNodes = useMemo(() => {
    if (!report?.fundDetails?.length) return [];
    if (schemePath.length === 0) {
      const totals = new Map<string, number>();
      report.fundDetails.forEach((fund) => {
        totals.set(fund.majorCategory, (totals.get(fund.majorCategory) || 0) + fund.currentValue);
      });
      return Array.from(totals.entries()).map(([name, value]) => ({ name, value }));
    }
    if (schemePath.length === 1) {
      const totals = new Map<string, number>();
      report.fundDetails
        .filter((fund) => fund.majorCategory === schemePath[0])
        .forEach((fund) => {
          totals.set(fund.schemeCategory, (totals.get(fund.schemeCategory) || 0) + fund.currentValue);
        });
      return Array.from(totals.entries()).map(([name, value]) => ({ name, value }));
    }

    const totals = new Map<string, number>();
    report.fundDetails
      .filter((fund) => fund.majorCategory === schemePath[0] && fund.schemeCategory === schemePath[1])
      .forEach((fund) => {
        totals.set(fund.name, (totals.get(fund.name) || 0) + fund.currentValue);
      });
    const sorted = Array.from(totals.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    const top = sorted.slice(0, 10);
    const restValue = sorted.slice(10).reduce((sum, item) => sum + item.value, 0);
    return restValue > 0 ? [...top, { name: "Others", value: restValue }] : top;
  }, [report, schemePath]);
  const schemeLevelLabel = useMemo(() => {
    if (schemePath.length === 0) return "Major allocation";
    if (schemePath.length === 1) return "Sub-category split";
    return "Fund allocation";
  }, [schemePath]);
  const schemeTotal = useMemo(() => {
    return schemeNodes.reduce((sum: number, node: any) => sum + (node.value || 0), 0);
  }, [schemeNodes]);
  const schemeSegments = useMemo(() => {
    return schemeNodes.map((node: any) => ({
      name: node.name,
      value: node.value || 0,
      percent: schemeTotal > 0 ? node.value / schemeTotal : 0,
    }));
  }, [schemeNodes, schemeTotal]);
  const handleSchemeSelect = (name: string) => {
    if (!name) return;
    if (schemePath.length === 0) {
      setSchemePath([name]);
      return;
    }
    if (schemePath.length === 1) {
      setSchemePath([schemePath[0], name]);
    }
  };
  const amcDisplayData = useMemo(() => {
    if (!report?.amcBreakdown?.length) return [];
    const top = report.amcBreakdown.slice(0, 8);
    const restValue = report.amcBreakdown.slice(8).reduce((sum, item) => sum + item.value, 0);
    if (restValue > 0) return [...top, { name: "Others", value: restValue }];
    return top;
  }, [report]);
  const amcTotalValue = summary.totalValue || 0;
  const amcFunds = useMemo(() => {
    if (!report?.fundDetails || !selectedAmc) return [];
    return report.fundDetails
      .filter((fund) => fund.amc === selectedAmc)
      .sort((a, b) => b.currentValue - a.currentValue);
  }, [report, selectedAmc]);

  if (loading || !user) {
    return <div className="p-12 text-center">Loading...</div>;
  }

  if (processing) {
    return (
      <div className="p-12 text-center">
        <div className="text-lg font-semibold text-[#1F2937] dark:text-[#F5F6F3]">Preparing your dashboard...</div>
        <div className="mt-2 text-sm text-[#6B7C70] dark:text-[#D5D9CF]">
          We are downloading NAV history and rebuilding your portfolio. This can take a few minutes for large CAS files.
        </div>
        {elapsedSeconds >= 30 && (
          <div className="mt-2 text-xs text-[#6B7C70] dark:text-[#D5D9CF]">
            It is safe to keep this tab open. We will finish the analysis soon.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F8FF] px-4 sm:px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-[#6B7C70] font-serif">mutual fund health check</p>
          <h1 className="text-3xl md:text-5xl font-serif text-[#1F2937]">Portfolio diagnosis</h1>
          <p className="text-base md:text-lg font-serif text-[#6B7C70]">
            Here is your portfolio snapshot based on the CAS you uploaded. XIRR, flows, and performance reflect your actual transactions.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => router.push("/mutual-fund-health-check/portfolio")}
              className="rounded-full border border-[#D5D9CF] bg-white px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#2F5D7C]"
            >
              View portfolio
            </button>
            <button
              onClick={() => router.push("/mutual-fund-health-check/transactions")}
              className="rounded-full border border-[#D5D9CF] bg-white px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#2F5D7C]"
            >
              View transactions
            </button>
            <button
              onClick={() => router.push("/mutual-fund-health-check")}
              className="rounded-full border border-[#D5D9CF] bg-white px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#2F5D7C]"
            >
              Re-upload CAS
            </button>
            <button
              onClick={async () => {
                if (!data || !portfolio.length || !report) return;
                await generatePdfReport({
                  logoUrl: "/logo.png",
                  summary: {
                    totalValue: summary.totalValue,
                    invested: summary.invested,
                    allTimeProfit: summary.allTimeProfit,
                    monthlyIncome: summary.totalValue / 25 / 12,
                  },
                  xirrValue,
                  report,
                  holder: {
                    name: data?.holder?.name || "-",
                    pan: data?.holder?.pan,
                    email: data?.holder?.email,
                  },
                  chartIds: {
                    performance: "mfhc-performance-chart",
                    scheme: "mfhc-scheme-chart",
                    amc: "mfhc-amc-pie",
                  },
                });
              }}
              disabled={!report}
              className="rounded-full bg-[#2F5D7C] px-4 py-2 text-xs uppercase tracking-[0.2em] text-white disabled:opacity-50"
            >
              Download report
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {[
            { title: "Total Value", value: formatCurrency(summary.totalValue) },
            { title: "Invested", value: formatCurrency(summary.invested) },
            { title: "All Time Returns", value: formatCurrency(summary.allTimeProfit) },
            {
              title: "Portfolio XIRR",
              value: xirrValue !== null ? formatPct(xirrValue * 100, 1) : "Unavailable",
            },
            {
              title: "Monthly Income if retired",
              value: formatCurrency(summary.totalValue / 25 / 12),
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-3xl border border-[#E6E8E1] bg-white p-3 shadow-[0_18px_40px_-30px_rgba(0,0,0,0.35)]"
            >
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#6B7C70]">
                <span>{card.title}</span>
                <InfoTip
                  text={
                    card.title === "Total Value"
                      ? tooltips.totalValue
                      : card.title === "Invested"
                      ? tooltips.invested
                      : card.title === "All Time Returns"
                      ? tooltips.allTimeReturns
                      : card.title === "Portfolio XIRR"
                      ? tooltips.xirr
                      : tooltips.monthlyIncome
                  }
                />
              </div>
              <div className="mt-2 text-lg font-semibold text-[#1F2937]">{card.value}</div>
            </div>
          ))}
          <div className="rounded-3xl border border-[#E6E8E1] bg-white p-3 shadow-[0_18px_40px_-30px_rgba(0,0,0,0.35)]">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#6B7C70]">Portfolio vs Nifty 50 TRI</div>
            {(() => {
              const portfolioXirr = xirrValue !== null ? xirrValue * 100 : null;
              const benchmark = niftyBenchmark?.benchmarkReturn ?? null;
              const delta = portfolioXirr !== null && benchmark !== null ? portfolioXirr - benchmark : null;
              return (
                <div className="mt-2 space-y-2 text-xs text-[#6B7C70]">
                  <div className="flex items-center justify-between">
                    <span>XIRR</span>
                    <span className="text-[#1F2937]">{formatPct(portfolioXirr, 1)}</span>
                    <span className={`text-[10px] font-semibold ${delta !== null && delta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {delta !== null ? `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%` : "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Nifty 50 TRI</span>
                    <span className="text-[#1F2937]">{formatPct(benchmark, 1)}</span>
                    <span className="text-[10px] text-[#9AA3AF]">{niftyBenchmark?.period || "-"}</span>
                  </div>
                </div>
              );
            })()}
            <div className="mt-2 text-[10px] text-[#9AA3AF]">AMFI benchmark return.</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.2em] ${
              activeTab === "overview"
                ? "border-[#2F5D7C] bg-[#EAF1FB] text-[#2F5D7C]"
                : "border-[#D5D9CF] bg-white text-[#6B7C70]"
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("benchmark")}
            className={`rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.2em] ${
              activeTab === "benchmark"
                ? "border-[#2F5D7C] bg-[#EAF1FB] text-[#2F5D7C]"
                : "border-[#D5D9CF] bg-white text-[#6B7C70]"
            }`}
          >
            Benchmark intelligence
          </button>
        </div>
        {activeTab === "overview" && (
          <>
            <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
              <div className="rounded-3xl border border-[#DDE6F3] bg-white p-4 shadow-[0_18px_40px_-30px_rgba(31,41,55,0.25)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.2em] text-[#6B7C70]">Manual additions</div>
                    <div className="text-base font-semibold text-[#1F2937]">Add SIPs or one-time investments</div>
                    <div className="text-[11px] text-[#6B7C70]">These are merged with CAS holdings for diagnostics.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowManualSection((prev) => !prev)}
                    className="rounded-full border border-[#D5D9CF] bg-white px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-[#2F5D7C]"
                  >
                    {showManualSection ? "Collapse" : "Add investments"}
                  </button>
                </div>

                {showManualSection && (
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-[#EEF0E8] bg-[#FBFCFA] p-4">
                      <div className="text-[11px] uppercase tracking-[0.2em] text-[#6B7C70]">One-time investment</div>
                      <div className="mt-3 grid gap-3">
                        <input
                          value={manualDraft.schemeName}
                          onChange={(e) => {
                            const name = e.target.value;
                            const scheme = findSchemeForName(name);
                            setManualDraft((prev) => ({
                              ...prev,
                              schemeName: name,
                              schemeCode:
                                scheme && normalizeFundName(scheme.schemeName || "") === normalizeFundName(name)
                                  ? String(scheme.schemeCode)
                                  : "",
                            }));
                          }}
                          placeholder="Search fund name"
                          className="w-full rounded-2xl border border-[#D5D9CF] bg-white px-3 py-2 text-sm text-[#1F2937]"
                        />
                        {manualSuggestions.length > 0 && (
                          <div className="rounded-2xl border border-[#E6E8E1] bg-white p-2 text-xs text-[#1F2937]">
                            <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-[#9AA3AF]">Suggestions</div>
                            <div className="grid gap-1">
                              {manualSuggestions.map((name) => (
                                <button
                                  key={name}
                                  type="button"
                                  onClick={() =>
                                    setManualDraft((prev) => {
                                      const scheme = findSchemeForName(name);
                                      return {
                                        ...prev,
                                        schemeName: name,
                                        schemeCode: scheme ? String(scheme.schemeCode) : "",
                                      };
                                    })
                                  }
                                  className="rounded-xl px-2 py-1 text-left text-[12px] text-[#1F2937] hover:bg-[#F5F8FF]"
                                >
                                  {name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {manualDraft.schemeName.trim().length > 0 && manualDraft.schemeName.trim().length < 4 && (
                          <div className="text-[11px] text-[#9AA3AF]">Type at least 4 letters to see fund suggestions.</div>
                        )}
                        {manualDraft.schemeName.trim().length >= 4 && !manualDraft.schemeCode && (
                          <div className="text-[11px] text-[#B35A5A]">No NAV match yet. Pick a suggestion.</div>
                        )}
                        <div className="grid gap-3 sm:grid-cols-2">
                          <input
                            value={manualDraft.amount}
                            onChange={(e) => setManualDraft((prev) => ({ ...prev, amount: e.target.value }))}
                            placeholder="Amount (INR)"
                            className="w-full rounded-2xl border border-[#D5D9CF] bg-white px-3 py-2 text-sm text-[#1F2937]"
                          />
                          <input
                            type="date"
                            value={manualDraft.date}
                            onChange={(e) => setManualDraft((prev) => ({ ...prev, date: e.target.value }))}
                            className="w-full rounded-2xl border border-[#D5D9CF] bg-white px-3 py-2 text-sm text-[#1F2937]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleAddManual}
                          className="rounded-full bg-[#2F5D7C] px-4 py-2 text-xs uppercase tracking-[0.2em] text-white"
                        >
                          Add manual investment
                        </button>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#EEF0E8] bg-[#FBFCFA] p-4">
                      <div className="text-[11px] uppercase tracking-[0.2em] text-[#6B7C70]">SIP plan</div>
                      <div className="mt-3 grid gap-3">
                        <input
                          value={sipDraft.schemeName}
                          onChange={(e) => {
                            const name = e.target.value;
                            const scheme = findSchemeForName(name);
                            setSipDraft((prev) => ({
                              ...prev,
                              schemeName: name,
                              schemeCode:
                                scheme && normalizeFundName(scheme.schemeName || "") === normalizeFundName(name)
                                  ? String(scheme.schemeCode)
                                  : "",
                            }));
                          }}
                          placeholder="Search fund name"
                          className="w-full rounded-2xl border border-[#D5D9CF] bg-white px-3 py-2 text-sm text-[#1F2937]"
                        />
                        {sipSuggestions.length > 0 && (
                          <div className="rounded-2xl border border-[#E6E8E1] bg-white p-2 text-xs text-[#1F2937]">
                            <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-[#9AA3AF]">Suggestions</div>
                            <div className="grid gap-1">
                              {sipSuggestions.map((name) => (
                                <button
                                  key={name}
                                  type="button"
                                  onClick={() =>
                                    setSipDraft((prev) => {
                                      const scheme = findSchemeForName(name);
                                      return {
                                        ...prev,
                                        schemeName: name,
                                        schemeCode: scheme ? String(scheme.schemeCode) : "",
                                      };
                                    })
                                  }
                                  className="rounded-xl px-2 py-1 text-left text-[12px] text-[#1F2937] hover:bg-[#F5F8FF]"
                                >
                                  {name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {sipDraft.schemeName.trim().length > 0 && sipDraft.schemeName.trim().length < 4 && (
                          <div className="text-[11px] text-[#9AA3AF]">Type at least 4 letters to see fund suggestions.</div>
                        )}
                        {sipDraft.schemeName.trim().length >= 4 && !sipDraft.schemeCode && (
                          <div className="text-[11px] text-[#B35A5A]">No NAV match yet. Pick a suggestion.</div>
                        )}
                        <input
                          value={sipDraft.monthlyAmount}
                          onChange={(e) => setSipDraft((prev) => ({ ...prev, monthlyAmount: e.target.value }))}
                          placeholder="Monthly SIP (INR)"
                          className="w-full rounded-2xl border border-[#D5D9CF] bg-white px-3 py-2 text-sm text-[#1F2937]"
                        />
                        <div className="grid gap-3 sm:grid-cols-2">
                          <input
                            type="date"
                            value={sipDraft.startDate}
                            onChange={(e) => setSipDraft((prev) => ({ ...prev, startDate: e.target.value }))}
                            className="w-full rounded-2xl border border-[#D5D9CF] bg-white px-3 py-2 text-sm text-[#1F2937]"
                          />
                          <input
                            type="date"
                            value={sipDraft.endDate}
                            onChange={(e) => setSipDraft((prev) => ({ ...prev, endDate: e.target.value }))}
                            className="w-full rounded-2xl border border-[#D5D9CF] bg-white px-3 py-2 text-sm text-[#1F2937]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleAddSip}
                          className="rounded-full bg-[#2F5D7C] px-4 py-2 text-xs uppercase tracking-[0.2em] text-white"
                        >
                          Add SIP plan
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {(data?.manualInvestments?.length || data?.sipPlans?.length) && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setShowManualList((prev) => !prev)}
                      className="rounded-full border border-[#D5D9CF] bg-white px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-[#2F5D7C]"
                    >
                      {showManualList ? "Hide saved additions" : "Show saved additions"}
                    </button>
                    {showManualList && (
                      <div className="mt-3 grid gap-3 text-xs text-[#6B7C70] md:grid-cols-2">
                        {(data.manualInvestments || []).map((item) => (
                          <div key={item.id} className="rounded-2xl border border-[#EEF0E8] bg-white px-3 py-2">
                            <div className="text-[10px] uppercase tracking-[0.2em]">Manual investment</div>
                            <div className="mt-1 text-sm text-[#1F2937]">{item.schemeName}</div>
                            <div className="text-[11px]">INR {formatCurrency(item.amount)} · {item.date}</div>
                          </div>
                        ))}
                        {(data.sipPlans || []).map((plan) => (
                          <div key={plan.id} className="rounded-2xl border border-[#EEF0E8] bg-white px-3 py-2">
                            <div className="text-[10px] uppercase tracking-[0.2em]">SIP plan</div>
                            <div className="mt-1 text-sm text-[#1F2937]">{plan.schemeName}</div>
                            <div className="text-[11px]">
                              INR {formatCurrency(plan.monthlyAmount)}/mo · {plan.startDate}{plan.endDate ? ` → ${plan.endDate}` : ""}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-[#DDE6F3] bg-white p-4 shadow-[0_18px_40px_-30px_rgba(31,41,55,0.25)]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.2em] text-[#6B7C70]">Future growth</div>
                    <div className="text-base font-semibold text-[#1F2937]">Portfolio projection (15 years)</div>
                    <div className="text-[11px] text-[#6B7C70]">
                      Assumes {formatPct(expectedPortfolioReturn, 1)} annual return from weighted fund history.
                    </div>
                  </div>
                </div>
                <div className="mt-4 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={growthProjection} margin={chartMargin}>
                      <CartesianGrid stroke="#EEF2F7" vertical={false} />
                      <XAxis dataKey="year" {...xAxisDefaults} />
                      <YAxis {...axisDefaults} tickFormatter={(value) => formatCurrency(Number(value))} />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          formatCurrency(Number(value)),
                          name === "corpus" ? "Projected value" : "Invested",
                        ]}
                        labelFormatter={(label) => `Year ${label}`}
                        contentStyle={{ borderRadius: 16, borderColor: "#E6E8E1" }}
                        cursor={{ stroke: "transparent" }}
                      />
                      <Line type="monotone" dataKey="invested" stroke="#BDA06D" strokeDasharray="5 4" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="corpus" stroke="#2F5D7C" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "benchmark" && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-[#DDE6F3] bg-white p-5 shadow-[0_18px_40px_-30px_rgba(31,41,55,0.25)]">
              <div className="text-xs uppercase tracking-[0.2em] text-[#6B7C70]">Benchmark intelligence</div>
              <div className="mt-2 text-lg font-semibold text-[#1F2937]">How your funds behave vs their benchmarks</div>
              <div className="mt-1 text-xs text-[#6B7C70]">
                Fund-level benchmark returns only. Portfolio cashflows are not used here.
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-[#6B7C70]">
                <span className="rounded-full border border-[#E6E8E1] bg-[#FBFCFA] px-2 py-1">
                  Coverage {benchmarkCoverage.covered}/{benchmarkCoverage.totalFunds}
                </span>
                <span className="rounded-full border border-[#E6E8E1] bg-[#FBFCFA] px-2 py-1">
                  Active {formatPct(mixShare.activeShare * 100, 0)} · Passive {formatPct(mixShare.passiveShare * 100, 0)}
                </span>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-[#EEF0E8] bg-[#FBFCFA] p-4">
                <div className="text-[11px] uppercase tracking-[0.2em] text-[#6B7C70]">Portfolio posture</div>
                <div className="mt-2 text-sm text-[#1F2937]">{postureSummary}</div>
              </div>
              <div className="rounded-2xl border border-[#EEF0E8] bg-[#FBFCFA] p-4">
                <div className="text-[11px] uppercase tracking-[0.2em] text-[#6B7C70]">Active alpha check</div>
                {activeStats ? (
                  <div className="mt-2 space-y-2 text-xs text-[#1F2937]">
                    <div>
                      {activeStats.wins}/{activeStats.total} beating benchmark · Avg delta {formatPct(activeStats.avgDelta, 1)}
                    </div>
                    <div className="text-[11px] text-[#6B7C70]">
                      Underperforming value share {formatPct(activeStats.underperformingShare * 100, 0)}
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-[#6B7C70]">Active benchmark data is still sparse. Keep tracking as more funds mature.</div>
                )}
              </div>
              <div className="rounded-2xl border border-[#EEF0E8] bg-[#FBFCFA] p-4">
                <div className="text-[11px] uppercase tracking-[0.2em] text-[#6B7C70]">Passive tracking</div>
                {passiveStats ? (
                  <div className="mt-2 space-y-2 text-xs text-[#1F2937]">
                    <div>Avg tracking difference {formatPct(passiveStats.avgTracking, 1)}</div>
                    <div className="text-[11px] text-[#6B7C70]">
                      Review funds with tracking above 1.5%.
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-[#6B7C70]">Passive funds look thin. Consider adding a low-cost index core.</div>
                )}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-[#EEF0E8] bg-white p-4">
                <div className="text-[11px] uppercase tracking-[0.2em] text-[#6B7C70]">Benchmark win rate</div>
                <div className="mt-2 text-lg font-semibold text-[#1F2937]">{formatPct(benchmarkInsights.winRate * 100, 0)}</div>
                <div className="text-[11px] text-[#6B7C70]">Share of funds beating benchmarks.</div>
              </div>
              <div className="rounded-2xl border border-[#EEF0E8] bg-white p-4">
                <div className="text-[11px] uppercase tracking-[0.2em] text-[#6B7C70]">Active avg alpha</div>
                <div className="mt-2 text-lg font-semibold text-[#1F2937]">{formatPct(benchmarkInsights.activeAvg, 1)}</div>
                <div className="text-[11px] text-[#6B7C70]">Mean spread vs benchmarks.</div>
              </div>
              <div className="rounded-2xl border border-[#EEF0E8] bg-white p-4">
                <div className="text-[11px] uppercase tracking-[0.2em] text-[#6B7C70]">Passive avg drift</div>
                <div className="mt-2 text-lg font-semibold text-[#1F2937]">{formatPct(benchmarkInsights.passiveAvg, 1)}</div>
                <div className="text-[11px] text-[#6B7C70]">Tracking spread vs benchmarks.</div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-[#EEF0E8] bg-white p-4">
                <div className="text-[11px] uppercase tracking-[0.2em] text-[#6B7C70]">Active winners & laggards</div>
                {benchmarkMovers.activeWinners.length > 0 || benchmarkMovers.activeLaggards.length > 0 ? (
                  <div className="mt-3 space-y-2 text-xs text-[#1F2937]">
                    {benchmarkMovers.activeWinners.map((fund) => (
                      <div key={`win-${fund.name}`} className="flex items-center justify-between">
                        <span className="truncate">{fund.name}</span>
                        <span className="text-emerald-600">+{fund.delta.toFixed(1)}% ({fund.period})</span>
                      </div>
                    ))}
                    {benchmarkMovers.activeLaggards.map((fund) => (
                      <div key={`lag-${fund.name}`} className="flex items-center justify-between">
                        <span className="truncate">{fund.name}</span>
                        <span className="text-rose-600">{fund.delta.toFixed(1)}% ({fund.period})</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-[#6B7C70]">Use the table below to spot emerging winners and laggards.</div>
                )}
              </div>
              <div className="rounded-2xl border border-[#EEF0E8] bg-white p-4">
                <div className="text-[11px] uppercase tracking-[0.2em] text-[#6B7C70]">Passive tracking drift</div>
                {benchmarkMovers.passiveDrift.length > 0 ? (
                  <div className="mt-3 space-y-2 text-xs text-[#1F2937]">
                    {benchmarkMovers.passiveDrift.map((fund) => (
                      <div key={`passive-${fund.name}`} className="flex items-center justify-between">
                        <span className="truncate">{fund.name}</span>
                        <span className="text-[#B35A5A]">{Math.abs(fund.delta).toFixed(1)}% ({fund.period})</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-[#6B7C70]">Passive coverage is low. Review passive alternatives with strong tracking.</div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-[#E6E8E1] bg-[#FBFCFA] p-4 text-xs text-[#6B7C70]">
              <span className="text-[#1F2937]">Decision guide:</span> keep winners with consistent alpha, review laggards below benchmark for 3Y+, and build a low-cost passive core if active alpha is weak.
            </div>

            <div className="rounded-3xl border border-[#DDE6F3] bg-white p-4 shadow-[0_18px_40px_-30px_rgba(31,41,55,0.25)]">
              <div className="text-[11px] uppercase tracking-[0.2em] text-[#6B7C70]">Holdings vs benchmarks</div>
              <div className="mt-2 text-sm text-[#1F2937]">Fund returns compared to their stated benchmarks.</div>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="text-[#6B7C70]">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">Fund</th>
                      <th className="px-3 py-2 text-left font-semibold">Benchmark</th>
                      <th className="px-3 py-2 text-right font-semibold">Fund Return</th>
                      <th className="px-3 py-2 text-right font-semibold">Benchmark Return</th>
                      <th className="px-3 py-2 text-right font-semibold">Delta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {benchmarkTable.map((row) => (
                      <tr key={row.name} className="border-t border-[#EEF0E8]">
                        <td className="px-3 py-2 text-left text-[#1F2937]">{row.name}</td>
                        <td className="px-3 py-2 text-left text-[#6B7C70]">{row.benchmarkName}</td>
                        <td className="px-3 py-2 text-right text-[#1F2937]">
                          {row.fundReturn !== null ? `${row.fundReturn.toFixed(1)}% (${row.fundPeriod})` : "-"}
                        </td>
                        <td className="px-3 py-2 text-right text-[#1F2937]">
                          {row.benchmarkReturn !== null ? `${row.benchmarkReturn.toFixed(1)}% (${row.benchmarkPeriod})` : "-"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {row.delta !== null ? (
                            <span className={row.delta >= 0 ? "text-emerald-600" : "text-rose-600"}>
                              {row.delta >= 0 ? "+" : ""}{row.delta.toFixed(1)}%
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-2 text-[10px] text-[#9AA3AF]">Benchmarks come from AMFI raw data. Fund returns use AMFI 10Y when available; otherwise 5Y/3Y/1Y from analysis data.</div>
            </div>
          </div>
        )}

        {activeTab === "overview" && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
          {report
            ? [
                {
                  title: "Funds in holding",
                  value: `${report.holdingsCount}`,
                  note: "Funds with active value",
                  tooltip: tooltips.holdings,
                },
                {
                  title: "Top fund share",
                  value: summary.totalValue ? `${(report.topOneShare * 100).toFixed(1)}%` : "-",
                  note: "Concentration in your largest fund",
                  tooltip: tooltips.topFund,
                },
                {
                  title: "Top 5 share",
                  value: summary.totalValue ? `${(report.topFiveShare * 100).toFixed(1)}%` : "-",
                  note: "Share of top five funds",
                  tooltip: tooltips.topFive,
                },
              ].map((insight) => (
                <div
                  key={insight.title}
                  className="rounded-3xl border border-[#E6E8E1] bg-[#FBFCFA] p-4"
                >
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#6B7C70]">
                    <span>{insight.title}</span>
                    <InfoTip text={insight.tooltip} />
                  </div>
                  <div className="mt-2 text-xl font-semibold text-[#1F2937]">{insight.value}</div>
                  <div className="mt-2 text-[11px] text-[#6B7C70]">{insight.note}</div>
                </div>
              ))
            : null}
            </div>

            <div className="grid gap-6">
          <div>
            <ChartCard
              title="Performance"
              footer="Invested value vs current value over time"
              options={performanceOptions}
              value={performanceChart}
              onChange={setPerformanceChart}
            >
              {lineHasData ? (
                <div className="h-64 w-full" id="mfhc-performance-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineData} margin={chartMargin}>
                      <CartesianGrid vertical={false} stroke="#EEF2F7" />
                      <XAxis
                        dataKey="name"
                        {...xAxisDefaults}
                        interval={0}
                        tickFormatter={(value, index) => formatXAxisTick(value, index, lineData.length)}
                      />
                      <YAxis
                        {...axisDefaults}
                        tickFormatter={(value) => formatCurrency(Number(value))}
                        domain={["auto", "auto"]}
                        tickCount={5}
                      />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          formatCurrency(value),
                          name === "valueOne" ? "Invested" : "Current Value",
                        ]}
                        contentStyle={{ borderRadius: 16, borderColor: "#E6E8E1" }}
                        labelFormatter={(label) => `Date: ${label}`}
                        cursor={{ stroke: "transparent" }}
                      />
                      <Line type="monotone" dataKey="valueOne" stroke="#BDA06D" strokeWidth={2} dot={false} name="Invested" />
                      <Line type="monotone" dataKey="valueTwo" stroke="#2F5D7C" strokeWidth={3} dot={false} name="Current" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center text-sm text-[#6B7C70]">
                  NAV data is still loading. Please try again in a moment.
                </div>
              )}
            </ChartCard>
          </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard
            title="Scheme allocation"
            footer={`${schemeLevelLabel}. Tap a slice to drill down.`}
            options={[{ label: "Allocation", value: "allocation" }]}
            value="allocation"
            onChange={() => undefined}
            showSelect={false}
          >
            <div className="h-64 w-full" id="mfhc-scheme-chart">
              {schemeSegments.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={schemeSegments}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={96}
                      paddingAngle={2}
                      label={false}
                      labelLine={false}
                      onClick={(entry: any) => handleSchemeSelect(entry?.name)}
                    >
                      {schemeSegments.map((_entry, index) => (
                        <Cell key={`scheme-${index}`} fill={amcColors[index % amcColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => {
                        const percent = schemeTotal ? (Number(value) / schemeTotal) * 100 : 0;
                        return [formatCurrency(Number(value)), `${name} (${percent.toFixed(1)}%)`];
                      }}
                      contentStyle={{ borderRadius: 16, borderColor: "#E6E8E1" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-[#6B7C70]">
                  Scheme categorization will appear once NAV metadata is ready.
                </div>
              )}
            </div>
            {schemeSegments.length ? (
              <div className="mt-3 max-h-40 overflow-auto text-xs text-[#6B7C70]">
                <div className="grid gap-2 md:grid-cols-2">
                  {schemeSegments.map((item, index) => (
                    <button
                      key={item.name}
                      className="flex items-center justify-between rounded-2xl border border-[#D5D9CF] bg-white px-3 py-2 text-left"
                      onClick={() => handleSchemeSelect(item.name)}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 flex-none rounded-full"
                          style={{ backgroundColor: amcColors[index % amcColors.length] }}
                        />
                        <span className="truncate text-[12px] font-medium text-[#1F2937]">{item.name}</span>
                      </span>
                      <span className="text-[11px] text-[#6B7C70]">{(item.percent * 100).toFixed(1)}%</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {schemePath.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#6B7C70]">
                <span>Path:</span>
                {schemePath.map((segment, index) => (
                  <button
                    key={`${segment}-${index}`}
                    className="rounded-full border border-[#D5D9CF] px-2 py-1 text-[11px] uppercase tracking-[0.2em] text-[#2F5D7C]"
                    onClick={() => setSchemePath(schemePath.slice(0, index + 1))}
                  >
                    {segment}
                  </button>
                ))}
                <button
                  className="rounded-full border border-[#D5D9CF] px-2 py-1 text-[11px] uppercase tracking-[0.2em] text-[#B35A5A]"
                  onClick={() => setSchemePath([])}
                >
                  Reset
                </button>
              </div>
            )}
          </ChartCard>

          <ChartCard
            title="AMC concentration"
            footer="Fund house exposure based on current value"
            options={[{ label: "AMC", value: "amc" }]}
            value="amc"
            onChange={() => undefined}
            showSelect={false}
          >
            <div className="h-64 w-full" id="mfhc-amc-pie">
              {amcDisplayData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={amcDisplayData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                      label={false}
                      labelLine={false}
                      onClick={(entry: any) => {
                        if (!entry?.name) return;
                        setSelectedAmc(entry.name === "Others" ? null : entry.name);
                      }}
                    >
                      {amcDisplayData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={amcColors[index % amcColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => {
                        const percent = amcTotalValue ? (Number(value) / amcTotalValue) * 100 : 0;
                        return [formatCurrency(Number(value)), `${name} (${percent.toFixed(1)}%)`];
                      }}
                      contentStyle={{ borderRadius: 16, borderColor: "#E6E8E1" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-[#6B7C70]">
                  AMC distribution will appear once data is ready.
                </div>
              )}
            </div>
            {amcDisplayData.length ? (
              <div className="mt-3 max-h-40 overflow-auto text-xs text-[#6B7C70]">
                <div className="grid gap-2 md:grid-cols-2">
                  {amcDisplayData.map((item, index) => {
                    const percent = amcTotalValue ? (item.value / amcTotalValue) * 100 : 0;
                    return (
                      <button
                        key={item.name}
                        className={`flex items-center justify-between rounded-2xl border px-3 py-2 text-left ${
                          selectedAmc === item.name
                            ? "border-[#2F5D7C] bg-[#EAF1FB]"
                            : "border-[#D5D9CF] bg-white"
                        }`}
                        onClick={() => setSelectedAmc(item.name === "Others" ? null : item.name)}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 flex-none rounded-full"
                            style={{ backgroundColor: amcColors[index % amcColors.length] }}
                          />
                          <span className="truncate text-[12px] font-medium text-[#1F2937]">
                            {item.name}
                          </span>
                        </span>
                        <span className="text-[11px] text-[#6B7C70]">{percent.toFixed(1)}%</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
            {selectedAmc && amcFunds.length ? (
              <div className="mt-3 rounded-2xl border border-[#EEF0E8] bg-[#FBFCFA] p-3 text-xs text-[#1F2937]">
                <div className="text-[11px] uppercase tracking-[0.2em] text-[#6B7C70]">
                  {selectedAmc} funds
                </div>
                <div className="mt-2 grid gap-2">
                  {amcFunds.map((fund) => (
                    <div key={fund.name} className="flex items-center justify-between">
                      <span>{fund.name}</span>
                      <span className="text-[#2F5D7C]">{formatCurrency(fund.currentValue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </ChartCard>
            </div>

            {report?.insights?.length ? (
          <div className="rounded-3xl border border-[#E6E8E1] bg-white p-6 shadow-[0_18px_40px_-30px_rgba(0,0,0,0.35)]">
            <div className="text-xs uppercase tracking-[0.2em] text-[#6B7C70]">Actionable insights</div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {report.insights.map((insight) => (
                <div key={insight.title} className="rounded-2xl border border-[#EEF0E8] bg-[#FBFCFA] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-[#1F2937]">{insight.title}</div>
                    <span className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.2em] ${signalClass(insight.signal)}`}>
                      {insight.signal}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2 text-xs text-[#6B7C70]">
                    <div><span className="text-[#1F2937]">Observation:</span> {insight.observation}</div>
                    <div><span className="text-[#1F2937]">What this indicates:</span> {insight.meaning}</div>
                    <div><span className="text-[#1F2937]">Reassurance:</span> {insight.reassurance}</div>
                    <div><span className="text-[#1F2937]">Suggested check:</span> {insight.suggestedCheck}</div>
                  </div>
                </div>
              ))}
            </div>
            {report.insightSummary && (
              <div className="mt-4 rounded-2xl border border-[#EEF0E8] bg-white p-4 text-sm text-[#1F2937]">
                {report.insightSummary}
              </div>
            )}
            <div className="mt-4 rounded-2xl border border-[#EEF0E8] bg-[#FBFCFA] p-4 text-xs text-[#6B7C70]">
              <span className="text-[#1F2937]">Signal guide:</span> Normal = healthy range, Elevated = review soon, Watch-worthy = monitor closely, Strong/Aggressive = high attention area.
            </div>
          </div>
            ) : null}
          </>
        )}

        <div className="rounded-2xl border border-[#E6E8E1] bg-[#FBFCFA] p-4 text-xs text-[#6B7C70]">
          {disclaimerText}
        </div>
      </div>
    </div>
  );
}
