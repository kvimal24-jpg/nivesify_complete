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
import type { FundAnalytics, ETFAnalytics, CategoryInsights } from "@/lib/fund-types";

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
  "1": (transactions) => getPerformanceByYears(transactions ?? [], 1),
  "5": (transactions) => getPerformanceByYears(transactions ?? [], 5),
  "10": (transactions) => getPerformanceByYears(transactions ?? [], 10),
  max: (transactions) => getPerformanceByYears(transactions ?? [], "max"),
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

const formatPct2 = (value: number | null | undefined) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return "-";
  return `${value.toFixed(2)}%`;
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
const xAxisDefaults = {
  tickLine: false,
  axisLine: false,
  tickMargin: 8,
  tick: { fill: "#9AA3AF", fontSize: 9 },
  minTickGap: 18,
};
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

const riskScoreForSubCategory = (subCategory: string, category: string) => {
  const sub = subCategory.toLowerCase();
  const cat = category.toLowerCase();
  if (cat.includes("equity")) {
    if (sub.includes("small")) return 9.5;
    if (sub.includes("mid")) return 8.5;
    if (sub.includes("large")) return 6.5;
    if (sub.includes("sector") || sub.includes("thematic")) return 9;
    if (sub.includes("index") || sub.includes("etf")) return 6.5;
    return 7.5;
  }
  if (cat.includes("hybrid")) {
    if (sub.includes("aggressive")) return 6.5;
    if (sub.includes("conservative")) return 4.5;
    return 5.5;
  }
  if (cat.includes("debt")) {
    if (sub.includes("credit")) return 4.5;
    if (sub.includes("gilt") || sub.includes("duration")) return 4;
    return 3.5;
  }
  if (cat.includes("commodity") || sub.includes("gold")) return 6.5;
  return 5;
};

const classifyFundType = (name: string, analytics?: FundAnalytics, subCategory?: string | null) => {
  const combined = `${name} ${analytics?.Sub_Category ?? ""} ${subCategory ?? ""}`.toLowerCase();
  if (combined.includes("index") || combined.includes("etf") || combined.includes("passive")) return "passive";
  return "active";
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
  const [performanceChart, setPerformanceChart] = useState("max");
  const [lineData, setLineData] = useState<{ name: string; valueOne: number; valueTwo: number }[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [schemePath, setSchemePath] = useState<string[]>([]);
  const [schemeLookup, setSchemeLookup] = useState<Map<number, any>>(new Map());
  const [schemeList, setSchemeList] = useState<any[]>([]);
  const [selectedAmc, setSelectedAmc] = useState<string | null>(null);
  const [fundAnalytics, setFundAnalytics] = useState<FundAnalytics[]>([]);
  const [etfAnalytics, setEtfAnalytics] = useState<ETFAnalytics[]>([]);
  const [categoryInsights, setCategoryInsights] = useState<CategoryInsights[]>([]);
  const [manualDraft, setManualDraft] = useState({ schemeCode: "", schemeName: "", amount: "", date: "" });
  const [sipDraft, setSipDraft] = useState({ schemeCode: "", schemeName: "", monthlyAmount: "", startDate: "", endDate: "" });
  const [showManualList, setShowManualList] = useState(false);
  const [showManualSection, setShowManualSection] = useState(false);
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
  const [amfiSchemeMap, setAmfiSchemeMap] = useState<
    Map<string, { category: string; subCategory: string; benchmark: string | null; return10Y?: number; return3Y?: number; aum?: number }>
  >(new Map());
  const [niftyHurdle, setNiftyHurdle] = useState<number | null>(null);
  const disclaimerText =
    "All financial decisions involve risk and past performance is no guarantee of future results. You should consult with a qualified advisor and review all relevant disclosure documents before acting on any information provided.";

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
      const navResult = await fetchNavHistory(data.transactions ?? []);
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
    const loadEtfAnalytics = async () => {
      try {
        const res = await fetch("/api/etfs");
        if (!res.ok) return;
        const json = await res.json();
        setEtfAnalytics(json || []);
      } catch {
        setEtfAnalytics([]);
      }
    };
    loadEtfAnalytics();
  }, []);

  useEffect(() => {
    const loadInsights = async () => {
      try {
        const res = await fetch("/api/insights");
        if (!res.ok) return;
        const json = await res.json();
        setCategoryInsights(json || []);
      } catch {
        setCategoryInsights([]);
      }
    };
    loadInsights();
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
        const schemeMapNext = new Map<
          string,
          { category: string; subCategory: string; benchmark: string | null; return10Y?: number; return3Y?: number; aum?: number }
        >();
        let niftyReturnCandidate: { return10Y: number; aum: number } | null = null;

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

          if (benchmarkKey === normalizeBenchmark("nifty 50 tri") && Number.isFinite(record?.return10YearRegular)) {
            const return10Y = Number(record.return10YearRegular);
            if (!niftyReturnCandidate || aum > niftyReturnCandidate.aum) {
              niftyReturnCandidate = { return10Y, aum };
            }
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
            const existingScheme = schemeMapNext.get(schemeKey);
            if (!existingScheme || aum > (existingScheme.aum ?? -1)) {
              schemeMapNext.set(schemeKey, {
                category: record?.Category || "",
                subCategory: record?.Sub_Category || "",
                benchmark: record?.benchmark ? String(record.benchmark) : null,
                return10Y: Number.isFinite(record?.return10YearRegular) ? Number(record.return10YearRegular) : undefined,
                return3Y: Number.isFinite(record?.return3YearRegular) ? Number(record.return3YearRegular) : undefined,
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
        setAmfiSchemeMap(schemeMapNext);
        const niftyHurdleValue = (niftyReturnCandidate as { return10Y: number; aum: number } | null)?.return10Y ?? null;
        setNiftyHurdle(niftyHurdleValue);
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

  const analyticsByIsin = useMemo(() => {
    const map = new Map<string, FundAnalytics>();
    fundAnalytics.forEach((fund) => {
      const isin = fund.ISIN || fund.ISIN_Code;
      if (isin) map.set(isin, fund);
    });
    return map;
  }, [fundAnalytics]);

  const getFundAnalytics = (name: string) => analyticsMap.get(normalizeFundName(name));
  const getFundAnalyticsForHolding = (name: string, isin?: string) =>
    (isin ? analyticsByIsin.get(isin) : undefined) || getFundAnalytics(name);

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

  const holdings = useMemo(() => {
    return uniquePortfolioFunds.map((row) => {
      const isin = row.allTransactions?.[0]?.isin || "";
      const analytics = getFundAnalyticsForHolding(row.mfName, isin);
      const normalized = normalizeFundName(row.mfName);
      const amfi = amfiSchemeMap.get(normalized);
      const benchmarkName = analytics?.Benchmark_Name || amfi?.benchmark || fundReturnMap.get(normalized)?.benchmarkName || "-";
      return {
        name: row.mfName,
        value: row.currentValue || 0,
        analytics,
        amfi,
        benchmarkName,
        isin,
      };
    });
  }, [uniquePortfolioFunds, analyticsByIsin, amfiSchemeMap, fundReturnMap]);

  const subCategoryInsightsMap = useMemo(() => {
    const map = new Map<string, CategoryInsights>();
    categoryInsights
      .filter((row) => row.Level === "Sub-Category" && row.Sub_Category_Name)
      .forEach((row) => map.set(row.Sub_Category_Name || "", row));
    return map;
  }, [categoryInsights]);

  const categoryInsightsMap = useMemo(() => {
    const map = new Map<string, CategoryInsights>();
    categoryInsights
      .filter((row) => row.Level === "Category" && row.Category_Name)
      .forEach((row) => map.set(row.Category_Name || "", row));
    return map;
  }, [categoryInsights]);

  const activeHoldings = useMemo(
    () => holdings.filter((row) => classifyFundType(row.name, row.analytics, row.amfi?.subCategory) === "active"),
    [holdings]
  );

  const passiveHoldings = useMemo(
    () => holdings.filter((row) => classifyFundType(row.name, row.analytics, row.amfi?.subCategory) === "passive"),
    [holdings]
  );

  const alphaHurdle = useMemo(() => niftyHurdle, [niftyHurdle]);

  const activeHitRate = useMemo(() => {
    const total = activeHoldings.reduce((sum, row) => sum + row.value, 0);
    const winners = activeHoldings
      .filter((row) => (row.analytics?.Alpha_3Y ?? 0) > 0)
      .reduce((sum, row) => sum + row.value, 0);
    return total > 0 ? winners / total : null;
  }, [activeHoldings]);

  const consistencyScore = useMemo(() => {
    let total = 0;
    let winners = 0;
    holdings.forEach((row) => {
      const ir3y = row.analytics?.IR_3Y;
      const sub = row.analytics?.Sub_Category || row.amfi?.subCategory || "";
      const benchmark = subCategoryInsightsMap.get(sub);
      if (ir3y === null || ir3y === undefined || !benchmark?.Avg_IR_3Y) return;
      total += 1;
      if (ir3y > (benchmark.Avg_IR_3Y ?? 0)) winners += 1;
    });
    return { winners, total };
  }, [holdings, subCategoryInsightsMap]);

  const yieldTrapValue = useMemo(() => {
    return holdings
      .filter((row) => (row.analytics?.Percentile_in_SubCategory ?? 100) < 25)
      .reduce((sum, row) => sum + row.value, 0);
  }, [holdings]);

  const styleTilt = useMemo(() => {
    let equityTotal = 0;
    let tiltValue = 0;
    holdings.forEach((row) => {
      const category = row.amfi?.category || row.analytics?.Category || "";
      if (category.toLowerCase() !== "equity") return;
      equityTotal += row.value;
      const sub = (row.amfi?.subCategory || row.analytics?.Sub_Category || "").toLowerCase();
      if (sub.includes("small") || sub.includes("mid")) tiltValue += row.value;
    });
    return equityTotal > 0 ? tiltValue / equityTotal : null;
  }, [holdings]);

  const riskDnaScore = useMemo(() => {
    let weighted = 0;
    let total = 0;
    holdings.forEach((row) => {
      const category = row.amfi?.category || row.analytics?.Category || "";
      const sub = row.amfi?.subCategory || row.analytics?.Sub_Category || "";
      const score = riskScoreForSubCategory(sub, category);
      weighted += score * row.value;
      total += row.value;
    });
    return total > 0 ? weighted / total : null;
  }, [holdings]);

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
  }, [portfolio, analyticsMap]);

  const xirrValue = useMemo(() => {
    if (!portfolio.length) return null;
    const allTransactions: Array<{ amount: number; date: Date; type: "buy" | "sell" }> = portfolio.flatMap((fund) =>
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

  const projectionReturn = useMemo(
    () => (xirrValue !== null ? xirrValue * 100 : expectedPortfolioReturn),
    [xirrValue, expectedPortfolioReturn]
  );

  const totalMonthlySip = useMemo(() => {
    if (!data?.sipPlans?.length) return 0;
    return data.sipPlans.reduce((sum, plan) => sum + (plan.monthlyAmount || 0), 0);
  }, [data]);

  const growthProjection = useMemo(() => {
    return buildFutureGrowth(summary.totalValue || 0, summary.invested || 0, totalMonthlySip, projectionReturn, 15);
  }, [summary.totalValue, summary.invested, totalMonthlySip, projectionReturn]);

  const etfByBenchmark = useMemo(() => {
    const map = new Map<string, ETFAnalytics[]>();
    etfAnalytics.forEach((etf) => {
      const key = normalizeBenchmark(etf.Benchmark_Name || "");
      if (!key) return;
      const list = map.get(key) || [];
      list.push(etf);
      map.set(key, list);
    });
    map.forEach((list, key) => {
      list.sort((a, b) => (b.ETF_Score ?? 0) - (a.ETF_Score ?? 0));
      map.set(key, list);
    });
    return map;
  }, [etfAnalytics]);

  const etfByName = useMemo(() => {
    const map = new Map<string, ETFAnalytics>();
    etfAnalytics.forEach((etf) => {
      const key = normalizeFundName(etf.ETF_Name || "");
      if (!key) return;
      map.set(key, etf);
    });
    return map;
  }, [etfAnalytics]);

  const underperformingActive = useMemo(() => {
    return activeHoldings.filter((row) => (row.analytics?.Alpha_3Y ?? 0) <= 0);
  }, [activeHoldings]);

  const lostAlphaAmount = useMemo(() => {
    return underperformingActive.reduce((sum, row) => {
      const alpha = row.analytics?.Alpha_3Y ?? 0;
      if (alpha >= 0) return sum;
      return sum + (row.value * Math.abs(alpha)) / 100;
    }, 0);
  }, [underperformingActive]);

  const activeAudit = useMemo(() => {
    return activeHoldings.map((row) => {
      const analytics = row.analytics;
      const category = analytics?.Category || "";
      const subCategory = analytics?.Sub_Category || row.amfi?.subCategory || "";
      const categoryAvgAlpha = category ? categoryInsightsMap.get(category)?.Avg_Alpha_3Y ?? null : null;
      const categoryAvgIr = subCategory ? subCategoryInsightsMap.get(subCategory)?.Avg_IR_3Y ?? null : null;
      const alpha = analytics?.Alpha_3Y ?? null;
      const ir3y = analytics?.IR_3Y ?? null;
      const compositeScore = analytics?.Composite_Score ?? null;
      const benchmarkName = row.benchmarkName || "-";
      const benchmarkKey = benchmarkName !== "-" ? normalizeBenchmark(benchmarkName) : "";
      const benchmarkReturn = benchmarkKey ? benchmarkMap.get(benchmarkKey)?.return3Y ?? null : null;
      const fundReturn = analytics?.Fund_Return_3Y ?? row.amfi?.return3Y ?? null;
      const delta = fundReturn !== null && benchmarkReturn !== null ? fundReturn - benchmarkReturn : null;
      const scoreOk = compositeScore !== null ? compositeScore >= 55 : true;
      const alphaOk = alpha !== null ? alpha >= 0 : true;
      const irOk = ir3y !== null ? (categoryAvgIr !== null ? ir3y >= categoryAvgIr : ir3y >= 0) : true;
      const performanceOk = delta !== null ? delta >= 0 : true;
      const trigger = !(performanceOk && scoreOk && alphaOk && irOk);
      const status = alpha !== null && alpha >= 0 ? "Continue" : trigger ? "Review" : "Continue";
      const bestEtf = benchmarkKey ? etfByBenchmark.get(benchmarkKey)?.[0] : undefined;
      return {
        name: row.name,
        benchmarkName,
        fundReturn,
        benchmarkReturn,
        delta,
        alpha,
        ir3y,
        categoryAvgIr,
        compositeScore,
        categoryAvgAlpha,
        status,
        suggestion: status === "Review" && bestEtf ? bestEtf.ETF_Name : null,
        suggestionScore: bestEtf?.ETF_Score ?? null,
      };
    });
  }, [activeHoldings, benchmarkMap, etfByBenchmark, categoryInsightsMap, subCategoryInsightsMap]);

  const passiveAudit = useMemo(() => {
    return passiveHoldings.map((row) => {
      const benchmarkName = row.benchmarkName || "-";
      const benchmarkKey = benchmarkName !== "-" ? normalizeBenchmark(benchmarkName) : "";
      const bestEtf = benchmarkKey ? etfByBenchmark.get(benchmarkKey)?.[0] : undefined;
      const currentEtf = etfByName.get(normalizeFundName(row.name));
      const tracking = currentEtf?.Tracking_Diff_3Y ?? null;
      const bestTracking = bestEtf?.Tracking_Diff_3Y ?? null;
      const fundReturn = row.analytics?.Fund_Return_3Y ?? row.amfi?.return3Y ?? null;
      const benchmarkReturn = benchmarkKey ? benchmarkMap.get(benchmarkKey)?.return3Y ?? null : null;
      const delta = fundReturn !== null && benchmarkReturn !== null ? fundReturn - benchmarkReturn : null;
      const needsSwitch =
        (tracking !== null && bestTracking !== null ? tracking - bestTracking > 0.5 : false) ||
        (delta !== null ? delta < 0 : false);
      const status = needsSwitch ? "Review" : "Continue";
      return {
        name: row.name,
        benchmarkName,
        fundReturn,
        benchmarkReturn,
        delta,
        tracking,
        bestTracking,
        status,
        suggestion: status === "Review" && bestEtf ? bestEtf.ETF_Name : null,
        bestEtfName: bestEtf?.ETF_Name ?? null,
      };
    });
  }, [passiveHoldings, benchmarkMap, etfByBenchmark, etfByName]);

  const activeReviewCount = useMemo(() => activeAudit.filter((row) => row.status !== "Continue").length, [activeAudit]);
  const passiveSwitchCount = useMemo(
    () => passiveAudit.filter((row) => row.suggestion).length,
    [passiveAudit]
  );

  const executivePulse = useMemo(() => {
    const xirrPct = xirrValue !== null ? xirrValue * 100 : null;
    const hurdle = alphaHurdle ?? null;
    const diff = xirrPct !== null && hurdle !== null ? xirrPct - hurdle : null;
    const direction = diff === null ? "matching" : diff >= 0 ? "beating" : "trailing";
    const underperformingCount = activeReviewCount;
    return {
      xirrPct,
      hurdle,
      diff,
      direction,
      underperformingCount,
    };
  }, [xirrValue, alphaHurdle, activeReviewCount]);

  const report = useMemo(() => {
    if (!data) return null;
    return buildReportData(data, portfolio, summary.totalValue, xirrValue, schemeLookup);
  }, [data, portfolio, summary.totalValue, xirrValue, schemeLookup]);

  const insightCards = useMemo(() => {
    const cards: Array<{ title: string; summary: string; detail: string }> = [];

    if (executivePulse.diff !== null) {
      cards.push({
        title: "Market hurdle check",
        summary: `Your XIRR is ${executivePulse.direction} the Nifty 50 TRI 10Y bar by ${formatPct2(executivePulse.diff)}.`,
        detail: "Use this as a reality check for long-term performance. If the gap stays negative for long periods, review the core funds.",
      });
    }

    if (activeReviewCount > 0) {
      cards.push({
        title: "Active fund cleanup",
        summary: `${activeReviewCount} active funds need review, with about ${formatCurrency(lostAlphaAmount)} in potential annual drag.`,
        detail: "Prioritize funds with negative 3Y alpha and large benchmark gaps. Replace only after checking tax impact and exit loads.",
      });
    }

    if (passiveSwitchCount > 0) {
      cards.push({
        title: "Passive tracking drift",
        summary: `${passiveSwitchCount} passive funds show tracking drift versus the best ETF.`,
        detail: "Switching to a tighter-tracking ETF can improve returns without changing risk exposure.",
      });
    }

    if (yieldTrapValue > 0) {
      cards.push({
        title: "Low-ranked exposure",
        summary: `${formatCurrency(yieldTrapValue)} sits in the bottom 25% of category peers.`,
        detail: "These are common sources of long-term drag. Check performance persistence and consider consolidation.",
      });
    }

    (report?.insights || []).slice(0, 3).forEach((insight) => {
      cards.push({
        title: insight.title,
        summary: insight.observation,
        detail: insight.suggestedCheck || insight.meaning || "Review this area during your next portfolio check.",
      });
    });

    return cards;
  }, [report, executivePulse, activeReviewCount, passiveSwitchCount, lostAlphaAmount, yieldTrapValue]);

  const pdfInsights = useMemo(() => {
    const metrics = [
      {
        title: "Market hurdle (Nifty 50 TRI 10Y)",
        value: formatPct2(alphaHurdle),
        note: "Long-term index reference",
      },
      {
        title: "Active winners",
        value: activeHitRate !== null ? formatPct2(activeHitRate * 100) : "-",
        note: "Active money beating benchmark",
      },
      {
        title: "Consistency check",
        value: consistencyScore.total ? `${consistencyScore.winners}/${consistencyScore.total}` : "-",
        note: "Funds above category average",
      },
      {
        title: "Low-ranked funds",
        value: formatCurrency(yieldTrapValue),
        note: "Bottom 25% of peers",
      },
      {
        title: "Style tilt (mid/small)",
        value: styleTilt !== null ? formatPct2(styleTilt * 100) : "-",
        note: "Higher swings if >50%",
      },
      {
        title: "Risk profile",
        value: riskDnaScore !== null ? riskDnaScore.toFixed(1) : "-",
        note: "1 low risk • 10 high risk",
      },
    ];

    const executiveSummary =
      `Portfolio XIRR ${formatPct2(executivePulse.xirrPct)} vs Nifty 50 TRI 10Y ${formatPct2(executivePulse.hurdle)} ` +
      `(${executivePulse.direction} by ${formatPct2(executivePulse.diff)}). ` +
      `${activeReviewCount} active funds need review; potential drag ${formatCurrency(lostAlphaAmount)} per year.`;

    const activeAuditRows = activeAudit.slice(0, 12).map((row) => ({
      name: row.name,
      benchmark: row.benchmarkName,
      gap: row.delta !== null ? `${row.delta >= 0 ? "+" : ""}${row.delta.toFixed(2)}%` : "-",
      action: row.suggestion ? `Review → ${row.suggestion}` : row.status,
    }));

    const passiveAuditRows = passiveAudit.slice(0, 12).map((row) => ({
      name: row.name,
      benchmark: row.benchmarkName,
      gap: row.delta !== null ? `${row.delta >= 0 ? "+" : ""}${row.delta.toFixed(2)}%` : "-",
      tracking: row.tracking !== null ? `${row.tracking.toFixed(2)}%` : "-",
      action: row.suggestion ? `Review → ${row.suggestion}` : row.status,
    }));

    return {
      metrics,
      executiveSummary,
      activeAuditRows,
      passiveAuditRows,
      insightCards,
    };
  }, [
    alphaHurdle,
    activeHitRate,
    consistencyScore,
    yieldTrapValue,
    styleTilt,
    riskDnaScore,
    executivePulse,
    activeReviewCount,
    lostAlphaAmount,
    activeAudit,
    passiveAudit,
    insightCards,
  ]);
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
    return <div className="min-h-screen bg-[#F5F8FF] p-12 text-center">Loading...</div>;
  }

  if (processing) {
    return (
      <div className="min-h-screen bg-[#F5F8FF] p-12 text-center">
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
            <a
              href="#nivesify-insights"
              className="rounded-full bg-gradient-to-r from-[#BDA06D] via-[#D2B57E] to-[#E6D4A5] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#1F2937] shadow-[0_12px_28px_-18px_rgba(189,160,109,0.7)]"
            >
              Nivesify Insights
            </a>
            <button
              onClick={() => router.push("/mutual-fund-health-check/portfolio")}
              className="rounded-full border border-[#D5D9CF] bg-white px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#111111]"
            >
              View portfolio
            </button>
            <button
              onClick={() => router.push("/mutual-fund-health-check/transactions")}
              className="rounded-full border border-[#D5D9CF] bg-white px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#111111]"
            >
              View transactions
            </button>
            <button
              onClick={() => router.push("/mutual-fund-health-check")}
              className="rounded-full border border-[#D5D9CF] bg-white px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#111111]"
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
                  insights: pdfInsights,
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
              className="rounded-full border border-[#D5D9CF] bg-white px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#111111] disabled:opacity-50"
            >
              Download report
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-4">
          {[
            {
              title: "Total value",
              value: formatCurrency(summary.totalValue),
              note: "Current portfolio value",
              tooltip: tooltips.totalValue,
            },
            {
              title: "Portfolio XIRR",
              value: xirrValue !== null ? formatPct(xirrValue * 100, 1) : "Unavailable",
              note: "Annualized portfolio return",
              tooltip: tooltips.xirr,
            },
            {
              title: "All-time returns",
              value: formatCurrency(summary.allTimeProfit),
              note: "Overall gain so far",
              tooltip: tooltips.allTimeReturns,
            },
            {
              title: "Invested",
              value: formatCurrency(summary.invested),
              note: "Capital invested",
              tooltip: tooltips.invested,
            },
            {
              title: "Funds in holding",
              value: report ? `${report.holdingsCount}` : "-",
              note: "Active holdings",
              tooltip: tooltips.holdings,
            },
            {
              title: "Top fund share",
              value: summary.totalValue && report ? `${(report.topOneShare * 100).toFixed(1)}%` : "-",
              note: "Largest fund weight",
              tooltip: tooltips.topFund,
            },
            {
              title: "Top 5 share",
              value: summary.totalValue && report ? `${(report.topFiveShare * 100).toFixed(1)}%` : "-",
              note: "Top 5 combined weight",
              tooltip: tooltips.topFive,
            },
            {
              title: "Monthly income",
              value: formatCurrency(summary.totalValue / 25 / 12),
              note: "25x rule estimate",
              tooltip: tooltips.monthlyIncome,
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-3xl border border-[#E6E8E1] bg-white p-4 text-center shadow-[0_18px_40px_-30px_rgba(0,0,0,0.35)]"
            >
              <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#6B7C70]">
                <span>{card.title}</span>
                <InfoTip text={card.tooltip} />
              </div>
              <div className="mt-2 text-xl font-semibold text-[#1F2937]">{card.value}</div>
              <div className="mt-2 text-[11px] text-[#6B7C70]">{card.note}</div>
            </div>
          ))}
        </div>

        <div id="manual-additions" className="rounded-3xl border border-[#DDE6F3] bg-white p-4 shadow-[0_18px_40px_-30px_rgba(31,41,55,0.25)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-[#6B7C70]">Manual additions</div>
              <div className="text-base font-semibold text-[#1F2937]">Add SIPs or one-time investments</div>
              <div className="text-[11px] text-[#6B7C70]">These are merged with CAS holdings for diagnostics.</div>
            </div>
            <button
              type="button"
              onClick={() => setShowManualSection((prev) => !prev)}
              className="rounded-full border border-[#D5D9CF] bg-white px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-[#111111]"
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

        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard
            title="Future growth"
            footer={`Projection uses ${formatPct(projectionReturn, 1)} annual return (portfolio XIRR).`}
            options={[{ label: "15 years", value: "15" }]}
            value="15"
            onChange={() => undefined}
            showSelect={false}
          >
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthProjection} margin={chartMargin}>
                  <CartesianGrid stroke="#EEF2F7" vertical={false} />
                  <XAxis dataKey="year" {...xAxisDefaults} />
                  <YAxis {...axisDefaults} tickFormatter={(value) => formatCurrency(Number(value))} />
                  <Tooltip
                    formatter={(value: number | undefined, name: string | undefined) => [
                      formatCurrency(Number(value ?? 0)),
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
          </ChartCard>

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
                      formatter={(value: number | undefined, name: string | undefined) => [
                        formatCurrency(Number(value ?? 0)),
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

        <section id="nivesify-insights" className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-[#6B7C70] font-serif">Nivesify insights</p>
            <h2 className="text-2xl md:text-3xl font-serif text-[#1F2937]">Portfolio diagnosis</h2>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-[#E6E8E1] bg-white p-3 text-center">
              <div className="text-[11px] uppercase tracking-[0.2em] text-[#6B7C70]">Market hurdle (Nifty 50 TRI 10Y)</div>
              <div className="mt-2 text-lg font-semibold text-[#1F2937]">{formatPct2(alphaHurdle)}</div>
              <div className="text-[11px] text-[#6B7C70]">Your XIRR {formatPct2(executivePulse.xirrPct)}</div>
            </div>
            <div className="rounded-2xl border border-[#E6E8E1] bg-white p-3 text-center">
              <div className="text-[11px] uppercase tracking-[0.2em] text-[#6B7C70]">Active winners</div>
              <div className="mt-2 text-lg font-semibold text-[#1F2937]">
                {activeHitRate !== null ? formatPct2(activeHitRate * 100) : "-"}
              </div>
              <div className="text-[11px] text-[#6B7C70]">Share of active money beating benchmark</div>
            </div>
            <div className="rounded-2xl border border-[#E6E8E1] bg-white p-3 text-center">
              <div className="text-[11px] uppercase tracking-[0.2em] text-[#6B7C70]">Consistency check</div>
              <div className="mt-2 text-lg font-semibold text-[#1F2937]">
                {consistencyScore.total ? `${consistencyScore.winners}/${consistencyScore.total}` : "-"}
              </div>
              <div className="text-[11px] text-[#6B7C70]">Funds above category average</div>
            </div>
            <div className="rounded-2xl border border-[#E6E8E1] bg-white p-3 text-center">
              <div className="text-[11px] uppercase tracking-[0.2em] text-[#6B7C70]">Low-ranked funds</div>
              <div className="mt-2 text-lg font-semibold text-[#1F2937]">{formatCurrency(yieldTrapValue)}</div>
              <div className="text-[11px] text-[#6B7C70]">Money in bottom 25% of category</div>
            </div>
            <div className="rounded-2xl border border-[#E6E8E1] bg-white p-3 text-center">
              <div className="text-[11px] uppercase tracking-[0.2em] text-[#6B7C70]">Style tilt (mid/small)</div>
              <div className="mt-2 text-lg font-semibold text-[#1F2937]">
                {styleTilt !== null ? formatPct2(styleTilt * 100) : "-"}
              </div>
              <div className="text-[11px] text-[#6B7C70]">
                {styleTilt !== null && styleTilt > 0.5 ? "Higher swings than a large-cap index" : "Balanced exposure"}
              </div>
            </div>
            <div className="rounded-2xl border border-[#E6E8E1] bg-white p-3 text-center">
              <div className="text-[11px] uppercase tracking-[0.2em] text-[#6B7C70]">Risk profile</div>
              <div className="mt-2 text-lg font-semibold text-[#1F2937]">
                {riskDnaScore !== null ? riskDnaScore.toFixed(1) : "-"}
              </div>
              <div className="text-[11px] text-[#6B7C70]">1 low risk • 10 high risk</div>
            </div>
          </div>

          <div className="rounded-3xl border border-[#DDE6F3] bg-white p-4 text-sm leading-relaxed text-[#1F2937]">
            Your portfolio XIRR is <span className="font-semibold">{formatPct2(executivePulse.xirrPct)}</span>,
            which is <span className="font-semibold">{executivePulse.direction}</span> the Nifty 50 TRI 10Y bar
            (<span className="font-semibold">{formatPct2(executivePulse.hurdle)}</span>) by
            <span className="font-semibold"> {formatPct2(executivePulse.diff)}</span>.
            <br />
            We also see <span className="font-semibold">{executivePulse.underperformingCount}</span> active funds that are not beating their benchmarks.
            That drag is roughly <span className="font-semibold">{formatCurrency(lostAlphaAmount)}</span> per year in lost alpha.
          </div>

          <details className="rounded-2xl border border-[#E6E8E1] bg-[#FBFCFA] p-4 text-xs text-[#6B7C70]">
            <summary className="cursor-pointer text-[11px] uppercase tracking-[0.2em] text-[#2F5D7C]">
              How these are calculated
            </summary>
            <div className="mt-2 space-y-2">
              <div>Market hurdle: 10-year return of a large, long-running Nifty 50 TRI benchmark fund from AMFI data.</div>
              <div>Active winners: share of active money with positive 3Y alpha.</div>
              <div>Consistency check: funds with 3Y IR above their category average.</div>
              <div>Low-ranked funds: money parked in the bottom 25% of category peers.</div>
            </div>
          </details>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-[#DDE6F3] bg-white p-4">
              <div className="text-center text-[11px] uppercase tracking-[0.2em] text-[#6B7C70]">Active fund audit</div>
              <div className="mt-2 text-center text-sm font-medium text-[#1F2937]">
                {activeReviewCount} active funds need review. Score, gap, and risk-adjusted returns decide the action.
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-[11px] sm:text-xs">
                  <thead className="text-[#6B7C70]">
                    <tr>
                      <th className="px-2 py-2 text-left font-semibold">Fund</th>
                      <th className="px-2 py-2 text-left font-semibold">Benchmark</th>
                      <th className="px-2 py-2 text-right font-semibold">Gap vs benchmark</th>
                      <th className="px-2 py-2 text-left font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeAudit.map((row) => (
                      <tr key={row.name} className="border-t border-[#EEF0E8]">
                        <td className="px-2 py-2 text-left text-[#1F2937]">{row.name}</td>
                        <td className="px-2 py-2 text-left text-[#6B7C70]">{row.benchmarkName}</td>
                        <td className="px-2 py-2 text-right">
                          {row.delta !== null ? (
                            <span className={row.delta >= 0 ? "text-emerald-600" : "text-rose-600"}>
                              {row.delta >= 0 ? "+" : ""}{row.delta.toFixed(2)}%
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-2 py-2 text-left">
                          <span className={row.status === "Continue" ? "text-emerald-600" : "text-rose-600"}>
                            {row.status}
                          </span>
                          {row.suggestion && (
                            <span className="ml-2 text-[11px] text-[#6B7C70]">→ {row.suggestion}</span>
                          )}
                          <details className="mt-2 text-[11px] text-[#6B7C70]">
                            <summary className="cursor-pointer uppercase tracking-[0.18em] text-[#2F5D7C]">Details</summary>
                            <div className="mt-2 space-y-1">
                              <div>Fund 3Y: {formatPct2(row.fundReturn)} · Bench 3Y: {formatPct2(row.benchmarkReturn)}</div>
                              <div>Alpha 3Y: {formatPct2(row.alpha)} · IR 3Y: {formatPct2(row.ir3y)}</div>
                              <div>Category IR avg: {formatPct2(row.categoryAvgIr)}</div>
                              <div>Composite score: {row.compositeScore !== null ? row.compositeScore.toFixed(0) : "-"}</div>
                            </div>
                          </details>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-3xl border border-[#DDE6F3] bg-white p-4">
              <div className="text-center text-[11px] uppercase tracking-[0.2em] text-[#6B7C70]">Passive fund audit</div>
              <div className="mt-2 text-center text-sm font-medium text-[#1F2937]">
                {passiveSwitchCount} passive funds show tracking drift or benchmark lag.
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-[11px] sm:text-xs">
                  <thead className="text-[#6B7C70]">
                    <tr>
                      <th className="px-2 py-2 text-left font-semibold">Fund</th>
                      <th className="px-2 py-2 text-left font-semibold">Benchmark</th>
                      <th className="px-2 py-2 text-right font-semibold">Gap vs benchmark</th>
                      <th className="px-2 py-2 text-right font-semibold">Tracking diff 3Y</th>
                      <th className="px-2 py-2 text-left font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {passiveAudit.map((row) => (
                      <tr key={row.name} className="border-t border-[#EEF0E8]">
                        <td className="px-2 py-2 text-left text-[#1F2937]">{row.name}</td>
                        <td className="px-2 py-2 text-left text-[#6B7C70]">{row.benchmarkName}</td>
                        <td className="px-2 py-2 text-right">
                          {row.delta !== null ? (
                            <span className={row.delta >= 0 ? "text-emerald-600" : "text-rose-600"}>
                              {row.delta >= 0 ? "+" : ""}{row.delta.toFixed(2)}%
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-2 py-2 text-right text-[#1F2937]">{formatPct2(row.tracking)}</td>
                        <td className="px-2 py-2 text-left">
                          <span className={row.status === "Continue" ? "text-emerald-600" : "text-rose-600"}>
                            {row.status}
                          </span>
                          {row.suggestion && (
                            <span className="ml-2 text-[11px] text-[#6B7C70]">→ {row.suggestion}</span>
                          )}
                          <details className="mt-2 text-[11px] text-[#6B7C70]">
                            <summary className="cursor-pointer uppercase tracking-[0.18em] text-[#2F5D7C]">Details</summary>
                            <div className="mt-2 space-y-1">
                              <div>Fund 3Y: {formatPct2(row.fundReturn)} · Bench 3Y: {formatPct2(row.benchmarkReturn)}</div>
                              <div>Tracking diff: {formatPct2(row.tracking)} · Best ETF: {row.bestEtfName || "-"}</div>
                              <div>Best ETF tracking: {formatPct2(row.bestTracking)}</div>
                            </div>
                          </details>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

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
                      formatter={(value: number | undefined, name: string | undefined) => {
                        const safeValue = Number(value ?? 0);
                        const percent = schemeTotal ? (safeValue / schemeTotal) * 100 : 0;
                        return [formatCurrency(safeValue), `${name ?? ""} (${percent.toFixed(1)}%)`];
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
                      formatter={(value: number | undefined, name: string | undefined) => {
                        const safeValue = Number(value ?? 0);
                        const percent = amcTotalValue ? (safeValue / amcTotalValue) * 100 : 0;
                        return [formatCurrency(safeValue), `${name ?? ""} (${percent.toFixed(1)}%)`];
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

        {insightCards.length ? (
          <div className="rounded-3xl border border-[#E6E8E1] bg-white p-6 shadow-[0_18px_40px_-30px_rgba(0,0,0,0.35)]">
            <div className="text-xs uppercase tracking-[0.2em] text-[#6B7C70]">Actionable insights</div>
            <div className="mt-2 text-sm text-[#1F2937]">Priority takeaways. Expand each card for the next step.</div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {insightCards.map((insight) => (
                <details key={insight.title} className="rounded-2xl border border-[#EEF0E8] bg-[#FBFCFA] p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-[#1F2937]">{insight.title}</summary>
                  <div className="mt-2 text-xs text-[#6B7C70]">{insight.summary}</div>
                  <div className="mt-2 text-xs text-[#6B7C70]">Next step: {insight.detail}</div>
                </details>
              ))}
            </div>
          </div>
        ) : null}

        <div className="rounded-2xl border border-[#E6E8E1] bg-[#FBFCFA] p-4 text-xs text-[#6B7C70]">
          {disclaimerText}
        </div>
      </div>
    </div>
  );
}
