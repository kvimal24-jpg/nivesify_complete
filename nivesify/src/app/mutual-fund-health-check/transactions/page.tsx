"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { InvestmentsData } from "@/lib/mutual-fund-health-check/types";
import { formatCurrency } from "@/lib/mutual-fund-health-check/format";

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" });

export default function MutualFundTransactionsPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [data, setData] = useState<InvestmentsData | null>(null);
  const [filter, setFilter] = useState("");

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

  const transactions = useMemo(() => {
    const list = data?.transactions ? [...data.transactions] : [];
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (!filter.trim()) return list;
    return list.filter((txn) => txn.mfName?.toLowerCase().includes(filter.toLowerCase()));
  }, [data, filter]);

  if (loading || !user) {
    return <div className="p-12 text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F5F6F3] px-6 py-12">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-[#6B7C70] font-serif">mutual fund health check</p>
          <h1 className="text-3xl md:text-5xl font-serif text-[#1F2937]">Transactions</h1>
          <p className="text-base md:text-lg font-serif text-[#6B7C70]">Every buy and redemption from your CAS.</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by fund name"
            className="w-full max-w-md rounded-full border border-[#D5D9CF] bg-white px-4 py-2 text-sm"
          />
          <button
            onClick={() => router.push("/mutual-fund-health-check/dashboard")}
            className="rounded-full border border-[#D5D9CF] bg-white px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#4A5D4E]"
          >
            Back to dashboard
          </button>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-[#E6E8E1] bg-white shadow-[0_18px_40px_-30px_rgba(0,0,0,0.35)]">
          <table className="min-w-full text-sm">
            <thead className="bg-[#FBFCFA] text-[#6B7C70]">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Date</th>
                <th className="px-4 py-3 text-left font-semibold">Fund Name</th>
                <th className="px-4 py-3 text-left font-semibold">Folio</th>
                <th className="px-4 py-3 text-right font-semibold">Price</th>
                <th className="px-4 py-3 text-right font-semibold">Units</th>
                <th className="px-4 py-3 text-left font-semibold">Type</th>
                <th className="px-4 py-3 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn, index) => (
                <tr key={txn.key ?? `${txn.folio}-${txn.date}-${index}`} className="border-t border-[#EEF0E8]">
                  <td className="px-4 py-3 text-left text-[#1F2937]">{formatDate(new Date(txn.date))}</td>
                  <td className="px-4 py-3 text-left text-[#1F2937]">{txn.mfName || "-"}</td>
                  <td className="px-4 py-3 text-left text-[#6B7C70]">{txn.folio || "-"}</td>
                  <td className="px-4 py-3 text-right text-[#1F2937]">{Number(txn.price || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-[#1F2937]">{Number(txn.units || 0).toFixed(3)}</td>
                  <td className="px-4 py-3 text-left">
                    <span className={txn.type === "Investment" ? "text-green-600" : "text-red-600"}>{txn.type || "-"}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={txn.type === "Investment" ? "text-green-600" : "text-red-600"}>
                      {formatCurrency(Number(txn.amount || 0))}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {transactions.length === 0 && (
          <div className="rounded-2xl border border-[#E6E8E1] bg-white p-6 text-center text-[#6B7C70]">
            No transactions found yet.
          </div>
        )}
      </div>
    </div>
  );
}
