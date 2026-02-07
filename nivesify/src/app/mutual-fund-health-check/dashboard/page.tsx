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
  BarChart,
  Bar,
  Cell,
  Legend,
} from "recharts";
import { useUser } from "@/hooks/useUser";
import { InvestmentsData } from "@/lib/mutual-fund-health-check/types";
import { fetchNavHistory } from "@/lib/mutual-fund-health-check/nav";
import { getPortfolio, getSummary } from "@/lib/mutual-fund-health-check/portfolio";
import {
  getAllMonthsData,
  getAllTimePerformance,
  getAnnualData,
  getLastTwelveMonthsData,
  getOneMonthPerformance,
  getOneYearPerformance,
} from "@/lib/mutual-fund-health-check/chart-data";
import { buildCashflows } from "@/lib/mutual-fund-health-check/cashflows";
import { xirr } from "@/lib/mutual-fund-health-check/xirr";
import { formatCurrency } from "@/lib/mutual-fund-health-check/format";

const transactionsOptions = [
  { label: "Last 12 Months", value: "last_12_months", type: "monthly" },
  { label: "Annually", value: "annually", type: "yearly" },
  { label: "All Time", value: "all_time", type: "monthly" },
];

const performanceOptions = [
  { label: "1 Month", value: "one_month" },
  { label: "1 Year", value: "one_year" },
  { label: "All Time", value: "all_time" },
];

const barChartDataMap: Record<string, (transactions: InvestmentsData["transactions"]) => { name: string; value: number }[]> = {
  last_12_months: getLastTwelveMonthsData,
  annually: getAnnualData,
  all_time: getAllMonthsData,
};

const lineChartDataMap: Record<
  string,
  (transactions: InvestmentsData["transactions"]) => Promise<{ name: string; valueOne: number; valueTwo: number }[]>
> = {
  one_month: getOneMonthPerformance,
  one_year: getOneYearPerformance,
  all_time: getAllTimePerformance,
};

function ChartCard({
  title,
  footer,
  options,
  value,
  onChange,
  children,
}: {
  title: string;
  footer: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-[#E6E8E1] bg-white p-5 shadow-[0_18px_40px_-30px_rgba(0,0,0,0.35)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-[#1F2937]">{title}</h3>
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
      </div>
      <div className="mt-4 h-64 w-full">{children}</div>
      <div className="mt-4 text-xs text-[#6B7C70]">{footer}</div>
    </div>
  );
}

export default function MutualFundHealthCheckDashboard() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [data, setData] = useState<InvestmentsData | null>(null);
  const [portfolio, setPortfolio] = useState<ReturnType<typeof getPortfolio> extends Promise<infer P> ? P : never>([] as any);
  const [processing, setProcessing] = useState(true);
  const [navReady, setNavReady] = useState(false);
  const [transactionsChart, setTransactionsChart] = useState(transactionsOptions[0].value);
  const [performanceChart, setPerformanceChart] = useState(performanceOptions[0].value);
  const [barData, setBarData] = useState<{ name: string; value: number }[]>([]);
  const [lineData, setLineData] = useState<{ name: string; valueOne: number; valueTwo: number }[]>([]);

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
    setBarData(barChartDataMap[transactionsChart](data.transactions));
  }, [data, transactionsChart]);

  useEffect(() => {
    if (!data?.transactions?.length || !navReady) return;
    const run = async () => {
      const line = await lineChartDataMap[performanceChart](data.transactions);
      setLineData(line);
    };
    run();
  }, [data, performanceChart, navReady]);

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

  if (loading || !user) {
    return <div className="p-12 text-center">Loading...</div>;
  }

  if (processing) {
    return <div className="p-12 text-center">Preparing your dashboard...</div>;
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
              <div className="text-xs uppercase tracking-[0.2em] text-[#6B7C70]">{card.title}</div>
              <div className="mt-2 text-2xl font-semibold text-[#1F2937]">{card.value}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ChartCard
              title="Performance"
              footer="Invested value vs current value over time"
              options={performanceOptions}
              value={performanceChart}
              onChange={setPerformanceChart}
            >
              {lineHasData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={lineData}>
                    <CartesianGrid vertical={false} stroke="#ECEFE7" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={10} />
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
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-[#6B7C70]">
                  NAV data is still loading. Please try again in a moment.
                </div>
              )}
            </ChartCard>
          </div>
          <ChartCard
            title="Transactions"
            footer="Amount invested, net of withdrawals"
            options={transactionsOptions}
            value={transactionsChart}
            onChange={setTransactionsChart}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid vertical={false} stroke="#ECEFE7" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={10} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={64}
                  tickFormatter={(value) => formatCurrency(Number(value))}
                  domain={["auto", "auto"]}
                  tickCount={5}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), "Net flow"]}
                  contentStyle={{ borderRadius: 16, borderColor: "#E6E8E1" }}
                />
                <Legend verticalAlign="top" iconType="circle" formatter={() => "Net flow"} />
                <Bar dataKey="value" radius={8}>
                  {barData.map((item) => (
                    <Cell key={item.name} fill={item.value > 0 ? "#4A5D4E" : "#B35A5A"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
