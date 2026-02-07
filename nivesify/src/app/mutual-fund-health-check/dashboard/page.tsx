"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useUser } from "@/hooks/useUser";
import { InvestmentsData } from "@/lib/mutual-fund-health-check/types";
import { fetchNavHistory } from "@/lib/mutual-fund-health-check/nav";
import { getPortfolio, getSummary } from "@/lib/mutual-fund-health-check/portfolio";
import {
  getPerformanceByYears,
} from "@/lib/mutual-fund-health-check/chart-data";
import { buildCashflows } from "@/lib/mutual-fund-health-check/cashflows";
import { xirr } from "@/lib/mutual-fund-health-check/xirr";
import { formatCurrency } from "@/lib/mutual-fund-health-check/format";
import {
  buildReportData,
  generatePdfReport,
  tooltips,
} from "@/lib/mutual-fund-health-check/report";

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
    <div className="rounded-3xl border border-[#E6E8E1] bg-white p-5 shadow-[0_18px_40px_-30px_rgba(0,0,0,0.35)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-[#1F2937]">{title}</h3>
        {showSelect && (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="rounded-full border border-[#D5D9CF] bg-white px-3 py-1 text-xs uppercase tracking-[0.2em] text-[#4A5D4E]"
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

const amcColors = [
  "#4A5D4E",
  "#BDA06D",
  "#7C8F7A",
  "#C9B07D",
  "#4D6F6B",
  "#D8C7A1",
  "#6B7C70",
  "#C2B59B",
  "#8A9B8B",
];

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
  const [performanceChart, setPerformanceChart] = useState(performanceOptions[0].value);
  const [lineData, setLineData] = useState<{ name: string; valueOne: number; valueTwo: number }[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [schemePath, setSchemePath] = useState<string[]>([]);
  const [schemeLookup, setSchemeLookup] = useState<Map<number, any>>(new Map());
  const [selectedAmc, setSelectedAmc] = useState<string | null>(null);
  const disclaimerText =
    "All financial decisions involve risk and past performance is no guarantee of future results. You should consult with a qualified advisor and review all relevant disclosure documents before acting on any information provided.";
  const signalClass = (signal: string) => {
    switch (signal) {
      case "Normal":
        return "border-[#C8D0C4] bg-[#F3F6F1] text-[#4A5D4E]";
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
      const navResult = await fetchNavHistory(data.transactions);
      setNavReady(navResult.missing.length === 0);
      const portfolioData = await getPortfolio(data.transactions);
      setPortfolio(portfolioData);
      setProcessing(false);
    };
    run();
  }, [data]);

  useEffect(() => {
    if (!data?.transactions?.length) return;
    let cancelled = false;
    const loadSchemeLookup = async () => {
      try {
        const res = await fetch("/api/mutual-fund-health-check/mf");
        if (!res.ok) return;
        const json = await res.json();
        const schemeCodes = new Set(
          data.transactions
            ?.map((txn) => txn.matchingScheme?.schemeCode)
            .filter((code): code is number => Number.isFinite(code))
        );
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
    if (!data?.transactions?.length || !navReady) return;
    const run = async () => {
      const line = await lineChartDataMap[performanceChart](data.transactions);
      setLineData(line);
    };
    run();
  }, [data, performanceChart, navReady]);

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
    <div className="min-h-screen bg-[#F5F6F3] px-6 py-12">
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
              className="rounded-full border border-[#D5D9CF] bg-white px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#4A5D4E]"
            >
              View portfolio
            </button>
            <button
              onClick={() => router.push("/mutual-fund-health-check/transactions")}
              className="rounded-full border border-[#D5D9CF] bg-white px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#4A5D4E]"
            >
              View transactions
            </button>
            <button
              onClick={() => router.push("/mutual-fund-health-check")}
              className="rounded-full border border-[#D5D9CF] bg-white px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#4A5D4E]"
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
              className="rounded-full bg-[#4A5D4E] px-4 py-2 text-xs uppercase tracking-[0.2em] text-white disabled:opacity-50"
            >
              Download report
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
          {[
            { title: "Total Value", value: formatCurrency(summary.totalValue) },
            { title: "Invested", value: formatCurrency(summary.invested) },
            { title: "All Time Returns", value: formatCurrency(summary.allTimeProfit) },
            {
              title: "Portfolio XIRR",
              value: xirrValue !== null ? `${(xirrValue * 100).toFixed(2)}%` : "Unavailable",
            },
            {
              title: "Monthly Income if retired",
              value: formatCurrency(summary.totalValue / 25 / 12),
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-3xl border border-[#E6E8E1] bg-white p-5 shadow-[0_18px_40px_-30px_rgba(0,0,0,0.35)]"
            >
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#6B7C70]">
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
              <div className="mt-2 text-2xl font-semibold text-[#1F2937]">{card.value}</div>
            </div>
          ))}
        </div>

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
                  className="rounded-3xl border border-[#E6E8E1] bg-[#FBFCFA] p-5"
                >
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#6B7C70]">
                    <span>{insight.title}</span>
                    <InfoTip text={insight.tooltip} />
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-[#1F2937]">{insight.value}</div>
                  <div className="mt-2 text-xs text-[#6B7C70]">{insight.note}</div>
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
                    <AreaChart data={lineData}>
                    <CartesianGrid vertical={false} stroke="#ECEFE7" />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      interval={0}
                      tickFormatter={(value, index) => formatXAxisTick(value, index, lineData.length)}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={64}
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
                    />
                    <Legend
                      verticalAlign="top"
                      iconType="circle"
                      formatter={(value) => (value === "valueOne" ? "Invested" : "Current")}
                    />
                    <Area type="monotone" dataKey="valueOne" stroke="#4A5D4E" fill="#4A5D4E" fillOpacity={0.2} name="valueOne" />
                    <Area type="monotone" dataKey="valueTwo" stroke="#BDA06D" fill="#BDA06D" fillOpacity={0.25} name="valueTwo" />
                    </AreaChart>
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
                    className="rounded-full border border-[#D5D9CF] px-2 py-1 text-[11px] uppercase tracking-[0.2em] text-[#4A5D4E]"
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
                            ? "border-[#4A5D4E] bg-[#F1F4EC]"
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
                      <span className="text-[#4A5D4E]">{formatCurrency(fund.currentValue)}</span>
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

        <div className="rounded-2xl border border-[#E6E8E1] bg-[#FBFCFA] p-4 text-xs text-[#6B7C70]">
          {disclaimerText}
        </div>
      </div>
    </div>
  );
}
