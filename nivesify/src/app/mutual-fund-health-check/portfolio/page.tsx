"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { InvestmentsData } from "@/lib/mutual-fund-health-check/types";
import { fetchNavHistory } from "@/lib/mutual-fund-health-check/nav";
import { getPortfolio, Portfolio } from "@/lib/mutual-fund-health-check/portfolio";
import { buildCashflows } from "@/lib/mutual-fund-health-check/cashflows";
import { xirr } from "@/lib/mutual-fund-health-check/xirr";
import { formatCurrency } from "@/lib/mutual-fund-health-check/format";

const formatUnits = (units: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 3 }).format(units);

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" });

export default function MutualFundPortfolioPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [data, setData] = useState<InvestmentsData | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio>([]);
  const [loadingPortfolio, setLoadingPortfolio] = useState(true);
  const [filter, setFilter] = useState("");
  const [showZeroUnits, setShowZeroUnits] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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
      setLoadingPortfolio(true);
      await fetchNavHistory(data.transactions);
      const portfolioData = await getPortfolio(data.transactions);
      setPortfolio(portfolioData);
      setLoadingPortfolio(false);
    };
    run();
  }, [data]);

  const filteredPortfolio = useMemo(() => {
    return portfolio
      .filter((row) => row.mfName.toLowerCase().includes(filter.toLowerCase()))
      .filter((row) => (showZeroUnits ? true : Math.abs(row.currentUnits) > 0.001));
  }, [portfolio, filter, showZeroUnits]);

  const renderProfit = (value: number) => (
    <span className={value >= 0 ? "text-green-600" : "text-red-600"}>{formatCurrency(value)}</span>
  );

  const renderXirr = (row: Portfolio[number]) => {
    const txns = row.allTransactions.map((txn) => ({
      amount: txn.amount,
      date: new Date(txn.date),
      type: txn.type === "Investment" ? "buy" : "sell",
    }));
    const isComplete = true;
    const cashflows = buildCashflows(txns, row.currentValue, new Date(), isComplete);
    if (cashflows.length < 2) return "Unavailable";
    const days = (cashflows[cashflows.length - 1].date.getTime() - cashflows[0].date.getTime()) / (1000 * 3600 * 24);
    if (days < 365) return "Unavailable";
    const value = xirr(cashflows);
    return value !== null ? `${(value * 100).toFixed(2)}%` : "Unavailable";
  };

  if (loading || !user) {
    return <div className="p-12 text-center">Loading...</div>;
  }

  if (loadingPortfolio) {
    return <div className="p-12 text-center">Preparing portfolio...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F5F6F3] px-6 py-12">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-[#6B7C70] font-serif">mutual fund health check</p>
          <h1 className="text-3xl md:text-5xl font-serif text-[#1F2937]">Portfolio</h1>
          <p className="text-base md:text-lg font-serif text-[#6B7C70]">Fund-level holdings, returns, and XIRR.</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by fund name"
            className="w-full max-w-md rounded-full border border-[#D5D9CF] bg-white px-4 py-2 text-sm"
          />
          <div className="flex items-center gap-3 text-sm text-[#6B7C70]">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showZeroUnits}
                onChange={(e) => setShowZeroUnits(e.target.checked)}
                className="h-4 w-4 rounded border-[#D5D9CF]"
              />
              Show redeemed funds
            </label>
            <button
              onClick={() => router.push("/mutual-fund-health-check/dashboard")}
              className="rounded-full border border-[#D5D9CF] bg-white px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#4A5D4E]"
            >
              Back to dashboard
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-[#E6E8E1] bg-white shadow-[0_18px_40px_-30px_rgba(0,0,0,0.35)]">
          <table className="min-w-full text-sm">
            <thead className="bg-[#FBFCFA] text-[#6B7C70]">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Fund Name</th>
                <th className="px-4 py-3 text-right font-semibold">Units</th>
                <th className="px-4 py-3 text-right font-semibold">Invested</th>
                <th className="px-4 py-3 text-right font-semibold">Current Returns</th>
                <th className="px-4 py-3 text-right font-semibold">XIRR</th>
                <th className="px-4 py-3 text-right font-semibold">Realised Returns</th>
                <th className="px-4 py-3 text-right font-semibold">Current Value</th>
                <th className="px-4 py-3 text-right font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {filteredPortfolio.map((row) => (
                <Fragment key={row.mfName}>
                  <tr className="border-t border-[#EEF0E8]">
                    <td className="px-4 py-3 text-left text-[#1F2937]">{row.mfName}</td>
                    <td className="px-4 py-3 text-right text-[#1F2937]">{formatUnits(row.currentUnits)}</td>
                    <td className="px-4 py-3 text-right text-[#1F2937]">{formatCurrency(row.currentInvested)}</td>
                    <td className="px-4 py-3 text-right">{renderProfit(row.profit)}</td>
                    <td className="px-4 py-3 text-right text-[#1F2937]">{renderXirr(row)}</td>
                    <td className="px-4 py-3 text-right">{renderProfit(row.realisedProfit)}</td>
                    <td className="px-4 py-3 text-right text-[#1F2937]">{formatCurrency(row.currentValue)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setExpanded((prev) => ({ ...prev, [row.mfName]: !prev[row.mfName] }))}
                        className="text-xs uppercase tracking-[0.2em] text-[#4A5D4E]"
                      >
                        {expanded[row.mfName] ? "Hide" : "Details"}
                      </button>
                    </td>
                  </tr>
                  {expanded[row.mfName] && (
                    <tr className="border-t border-[#EEF0E8] bg-[#FBFCFA]">
                      <td colSpan={8} className="px-4 py-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-[#6B7C70]">Current Holdings</div>
                        <div className="mt-3 overflow-x-auto">
                          <table className="min-w-full text-xs">
                            <thead className="text-[#6B7C70]">
                              <tr>
                                <th className="px-2 py-2 text-left font-semibold">Date</th>
                                <th className="px-2 py-2 text-right font-semibold">Units</th>
                                <th className="px-2 py-2 text-right font-semibold">Invested</th>
                                <th className="px-2 py-2 text-right font-semibold">Returns</th>
                                <th className="px-2 py-2 text-right font-semibold">Gain</th>
                                <th className="px-2 py-2 text-right font-semibold">Current Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              {row.existingFunds.map((transaction, index) => (
                                <tr key={index} className="border-t border-[#EEF0E8]">
                                  <td className="px-2 py-2 text-left text-[#1F2937]">
                                    {formatDate(new Date(transaction.date))}
                                  </td>
                                  <td className="px-2 py-2 text-right text-[#1F2937]">
                                    {formatUnits(transaction.units)}
                                  </td>
                                  <td className="px-2 py-2 text-right text-[#1F2937]">
                                    {formatCurrency(transaction.invested)}
                                  </td>
                                  <td className="px-2 py-2 text-right">{renderProfit(transaction.profit)}</td>
                                  <td className="px-2 py-2 text-right text-[#1F2937]">
                                    {transaction.gain.toFixed(2)}%
                                  </td>
                                  <td className="px-2 py-2 text-right text-[#1F2937]">
                                    {formatCurrency(transaction.invested + transaction.profit)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPortfolio.length === 0 && (
          <div className="rounded-2xl border border-[#E6E8E1] bg-white p-6 text-center text-[#6B7C70]">
            No funds found yet.
          </div>
        )}
      </div>
    </div>
  );
}
