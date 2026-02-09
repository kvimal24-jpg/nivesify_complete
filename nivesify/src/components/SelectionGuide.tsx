"use client";

import { useMemo, useState } from "react";
import type { FundAnalytics } from "@/lib/fund-types";

const horizons = ["<1Y", "1-3Y", "3-5Y", "5-7Y", "7-10Y", "10Y+"] as const;
const risks = ["Conservative", "Moderate", "Aggressive"] as const;
const incomes = ["Stable", "Variable", "Seasonal"] as const;
const withdrawals = ["None", "Occasional", "Regular"] as const;

type Horizon = (typeof horizons)[number];
type Risk = (typeof risks)[number];
type Income = (typeof incomes)[number];
type Withdrawal = (typeof withdrawals)[number];

type Scenario = {
  label: string;
  horizon: Horizon;
  risk: Risk;
  income: Income;
  withdrawal: Withdrawal;
  tagline: string;
};

type BucketMix = {
  equity: number;
  hybrid: number;
  debt: number;
};

type MixRow = {
  category: string;
  subCategory: string;
  weight: number;
  rationale: string;
};

type MixRowDisplay = MixRow & {
  displayPct: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const normalizeMix = (mix: BucketMix): BucketMix => {
  const total = mix.equity + mix.hybrid + mix.debt || 1;
  return {
    equity: mix.equity / total,
    hybrid: mix.hybrid / total,
    debt: mix.debt / total,
  };
};

const baseMixByHorizon: Record<Horizon, BucketMix> = {
  "<1Y": { equity: 0.05, hybrid: 0.15, debt: 0.8 },
  "1-3Y": { equity: 0.2, hybrid: 0.3, debt: 0.5 },
  "3-5Y": { equity: 0.5, hybrid: 0.3, debt: 0.2 },
  "5-7Y": { equity: 0.6, hybrid: 0.25, debt: 0.15 },
  "7-10Y": { equity: 0.7, hybrid: 0.2, debt: 0.1 },
  "10Y+": { equity: 0.8, hybrid: 0.15, debt: 0.05 },
};

const riskAdjustments: Record<Risk, BucketMix> = {
  Conservative: { equity: -0.15, hybrid: 0.05, debt: 0.1 },
  Moderate: { equity: 0, hybrid: 0, debt: 0 },
  Aggressive: { equity: 0.12, hybrid: -0.05, debt: -0.07 },
};

const incomeAdjustments: Record<Income, BucketMix> = {
  Stable: { equity: 0.05, hybrid: 0.0, debt: -0.05 },
  Variable: { equity: -0.05, hybrid: -0.03, debt: 0.08 },
  Seasonal: { equity: -0.03, hybrid: -0.02, debt: 0.05 },
};

const withdrawalAdjustments: Record<Withdrawal, BucketMix> = {
  None: { equity: 0, hybrid: 0, debt: 0 },
  Occasional: { equity: -0.03, hybrid: -0.02, debt: 0.05 },
  Regular: { equity: -0.08, hybrid: -0.04, debt: 0.12 },
};

const scenarios: Scenario[] = [
  {
    label: "Emergency buffer",
    horizon: "<1Y",
    risk: "Conservative",
    income: "Stable",
    withdrawal: "Regular",
    tagline: "Keep volatility low and liquidity high.",
  },
  {
    label: "3Y milestone",
    horizon: "1-3Y",
    risk: "Moderate",
    income: "Stable",
    withdrawal: "Occasional",
    tagline: "Blend debt with hybrids for smoother outcomes.",
  },
  {
    label: "Wealth builder",
    horizon: "7-10Y",
    risk: "Aggressive",
    income: "Stable",
    withdrawal: "None",
    tagline: "Stay equity heavy and ride market cycles.",
  },
  {
    label: "Variable income",
    horizon: "3-5Y",
    risk: "Moderate",
    income: "Variable",
    withdrawal: "Occasional",
    tagline: "Add debt buffers to absorb cash flow swings.",
  },
];

const equitySubMix = [
  { sub: "Large Cap Fund", weight: 0.35, note: "core stability" },
  { sub: "Flexi Cap Fund", weight: 0.25, note: "manager agility" },
  { sub: "Mid Cap Fund", weight: 0.12, note: "growth kicker" },
  { sub: "Small Cap Fund", weight: 0.08, note: "long-run alpha" },
  { sub: "Index Funds/ETFs", weight: 0.2, note: "low-cost anchor" },
];

const hybridSubMix = [
  { sub: "Aggressive Hybrid Fund", weight: 0.5, note: "equity with guardrails" },
  { sub: "Balanced Advantage Fund", weight: 0.3, note: "dynamic risk control" },
  { sub: "Multi Asset Allocation Fund", weight: 0.2, note: "diversified ballast" },
];

const debtSubMixShort = [
  { sub: "Liquid Fund", weight: 0.3, note: "capital parking" },
  { sub: "Overnight Fund", weight: 0.15, note: "instant access" },
  { sub: "Ultra Short Duration Fund", weight: 0.3, note: "low duration" },
  { sub: "Short Duration Fund", weight: 0.15, note: "steady carry" },
  { sub: "Corporate Bond Fund", weight: 0.1, note: "quality yield" },
];

const debtSubMixLong = [
  { sub: "Short Duration Fund", weight: 0.35, note: "rate stability" },
  { sub: "Corporate Bond Fund", weight: 0.25, note: "quality yield" },
  { sub: "Gilt Fund", weight: 0.2, note: "rate cycle hedge" },
  { sub: "Liquid Fund", weight: 0.2, note: "liquidity buffer" },
];

const bucketColors = {
  equity: "bg-[#2F6B45]",
  hybrid: "bg-[#B2874C]",
  debt: "bg-[#3F5E83]",
};

type SelectionGuideProps = {
  funds: FundAnalytics[];
};

export default function SelectionGuide({ funds }: SelectionGuideProps) {
  const [showShortlist, setShowShortlist] = useState<string | null>(null);
  const [showFundDetails, setShowFundDetails] = useState<FundAnalytics | null>(null);
  const [horizon, setHorizon] = useState<Horizon>("3-5Y");
  const [risk, setRisk] = useState<Risk>("Moderate");
  const [income, setIncome] = useState<Income>("Stable");
  const [withdrawal, setWithdrawal] = useState<Withdrawal>("None");
  const [activeScenario, setActiveScenario] = useState<string | null>(null);

  const { mix, rows } = useMemo(() => {
    const base = baseMixByHorizon[horizon];
    const riskAdj = riskAdjustments[risk];
    const incomeAdj = incomeAdjustments[income];
    const withdrawalAdj = withdrawalAdjustments[withdrawal];

    const adjusted: BucketMix = {
      equity: base.equity + riskAdj.equity + incomeAdj.equity + withdrawalAdj.equity,
      hybrid: base.hybrid + riskAdj.hybrid + incomeAdj.hybrid + withdrawalAdj.hybrid,
      debt: base.debt + riskAdj.debt + incomeAdj.debt + withdrawalAdj.debt,
    };

    const bounded: BucketMix = {
      equity: clamp(adjusted.equity, 0.05, 0.9),
      hybrid: clamp(adjusted.hybrid, 0.05, 0.6),
      debt: clamp(adjusted.debt, 0.05, 0.9),
    };

    const normalized = normalizeMix(bounded);
    const debtMix = horizon === "<1Y" || horizon === "1-3Y" ? debtSubMixShort : debtSubMixLong;

    const mixRows: MixRow[] = [
      ...equitySubMix.map((item) => ({
        category: "Equity",
        subCategory: item.sub,
        weight: normalized.equity * item.weight,
        rationale: item.note,
      })),
      ...hybridSubMix.map((item) => ({
        category: "Hybrid",
        subCategory: item.sub,
        weight: normalized.hybrid * item.weight,
        rationale: item.note,
      })),
      ...debtMix.map((item) => ({
        category: "Debt",
        subCategory: item.sub,
        weight: normalized.debt * item.weight,
        rationale: item.note,
      })),
    ];

    mixRows.sort((a, b) => b.weight - a.weight);

    return { mix: normalized, rows: mixRows };
  }, [horizon, risk, income, withdrawal]);

  const topThree: MixRowDisplay[] = useMemo(() => {
    const top = rows.slice(0, 3);
    const total = top.reduce((sum, row) => sum + row.weight, 0) || 1;
    const normalized = top.map((row) => ({ ...row, weight: row.weight / total }));
    const rounded = normalized.map((row) => Math.round(row.weight * 100));
    const diff = 100 - rounded.reduce((sum, value) => sum + value, 0);
    if (diff !== 0) {
      const maxIndex = normalized.reduce(
        (best, row, index) => (row.weight > normalized[best].weight ? index : best),
        0
      );
      rounded[maxIndex] += diff;
    }

    return normalized.map((row, index) => ({ ...row, displayPct: rounded[index] }));
  }, [rows]);

  const shortlistBySubCategory = useMemo(() => {
    const map = new Map<string, FundAnalytics[]>();
    funds.forEach((fund) => {
      const key = fund.Sub_Category ?? "";
      if (!key) return;
      const list = map.get(key) ?? [];
      list.push(fund);
      map.set(key, list);
    });
    return map;
  }, [funds]);

  const narrative = `With a ${horizon} horizon, ${risk.toLowerCase()} temperament, ${income.toLowerCase()} income, and ${withdrawal.toLowerCase()} withdrawals, this mix keeps stability while still aiming for growth.`;

  return (
    <section className="mt-10 space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-[#6B7C70] font-serif">Selection principles</p>
        <h3 className="mt-2 text-xl md:text-2xl font-serif text-[#1F2937]">Start with fit, then refine.</h3>
        <p className="mt-2 text-sm font-serif text-[#4A5D4E] max-w-2xl">
          A simple framework that mirrors how advisors think about suitability. It keeps the story short and
          the decision logical.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          {
            title: "Goal horizon",
            body: "Match equity exposure to time. Longer horizons absorb volatility better.",
          },
          {
            title: "Risk temperament",
            body: "Choose the mix you can hold through drawdowns without exiting early.",
          },
          {
            title: "Liquidity needs",
            body: "Keep short-duration buckets ready if cash flow is unpredictable.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="bg-white border border-[#E3E7DF] rounded-3xl p-4 md:p-5 shadow-[0_18px_50px_-40px_rgba(31,41,55,0.25)]"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-[#EEF1E9] text-[#4A5D4E]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3 7h7l-5.5 4 2 7-6-4.5L6 20l2-7L2 9h7l3-7z" />
                </svg>
              </span>
              <h3 className="text-base font-serif text-[#1F2937]">{item.title}</h3>
            </div>
            <p className="mt-3 text-sm font-serif text-[#4A5D4E] leading-relaxed">{item.body}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-6">
        <div className="bg-gradient-to-br from-[#FFFFFF] to-[#F7F4EC] border border-[#E7DDC7] rounded-3xl p-5 md:p-6">
          <h3 className="text-lg font-serif text-[#1F2937]">Quick selection guide</h3>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-serif text-[#4A5D4E]">
            {[
              {
                title: "Time first",
                body: "Short goals lean debt, longer goals unlock more equity.",
              },
              {
                title: "Know your temperament",
                body: "Pick a mix you can stay invested in for the full horizon.",
              },
              {
                title: "Diversify risk",
                body: "Blend equity, hybrid, and debt so one bucket can cushion the others.",
              },
              {
                title: "Review yearly",
                body: "Rebalance annually or after big life changes.",
              },
            ].map((item) => (
              <div key={item.title} className="bg-white border border-[#E7DDC7] rounded-2xl p-4">
                <div className="flex items-center gap-2 text-[#1F2937]">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#F6EBDD] text-[#8A6C3E]">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                  <span className="font-serif">{item.title}</span>
                </div>
                <p className="mt-2 text-xs text-[#6B7C70]">{item.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs font-serif text-[#6B7C70]">
            Illustrative guidance only. Suitability depends on personal circumstances and should be validated with a
            licensed advisor.
          </p>
        </div>

        <div className="bg-white border border-[#E3E7DF] rounded-3xl p-5 md:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
            <div>
              <h3 className="text-lg font-serif text-[#1F2937]">Build your mix</h3>
              <p className="mt-2 text-sm font-serif text-[#4A5D4E]">
                Answer four quick prompts. We translate them into a category + sub-category allocation.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {scenarios.map((scenario) => (
                  <button
                    key={scenario.label}
                    type="button"
                    onClick={() => {
                      setHorizon(scenario.horizon);
                      setRisk(scenario.risk);
                      setIncome(scenario.income);
                      setWithdrawal(scenario.withdrawal);
                      setActiveScenario(scenario.label);
                    }}
                    className={`px-3 py-2 rounded-full text-xs font-serif border transition-all ${
                      activeScenario === scenario.label
                        ? "bg-[#1F2937] text-white border-[#1F2937]"
                        : "bg-white text-[#4A5D4E] border-[#D9DED5]"
                    }`}
                  >
                    {scenario.label}
                  </button>
                ))}
              </div>
              {activeScenario && (
                <p className="mt-3 text-xs font-serif text-[#6B7C70]">
                  {scenarios.find((item) => item.label === activeScenario)?.tagline}
                </p>
              )}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-serif">
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-[#6B7C70]">Goal horizon</span>
                  <select
                    value={horizon}
                    onChange={(event) => {
                      setHorizon(event.target.value as Horizon);
                      setActiveScenario(null);
                    }}
                    className="w-full rounded-2xl border border-[#E3E7DF] bg-[#F9FAF7] px-4 py-2"
                  >
                    {horizons.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-[#6B7C70]">Risk temperament</span>
                  <select
                    value={risk}
                    onChange={(event) => {
                      setRisk(event.target.value as Risk);
                      setActiveScenario(null);
                    }}
                    className="w-full rounded-2xl border border-[#E3E7DF] bg-[#F9FAF7] px-4 py-2"
                  >
                    {risks.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-[#6B7C70]">Income stability</span>
                  <select
                    value={income}
                    onChange={(event) => {
                      setIncome(event.target.value as Income);
                      setActiveScenario(null);
                    }}
                    className="w-full rounded-2xl border border-[#E3E7DF] bg-[#F9FAF7] px-4 py-2"
                  >
                    {incomes.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-[#6B7C70]">Withdrawal needs</span>
                  <select
                    value={withdrawal}
                    onChange={(event) => {
                      setWithdrawal(event.target.value as Withdrawal);
                      setActiveScenario(null);
                    }}
                    className="w-full rounded-2xl border border-[#E3E7DF] bg-[#F9FAF7] px-4 py-2"
                  >
                    {withdrawals.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="mt-6 space-y-3">
                {[
                  { label: "Equity", value: mix.equity, color: bucketColors.equity },
                  { label: "Hybrid", value: mix.hybrid, color: bucketColors.hybrid },
                  { label: "Debt", value: mix.debt, color: bucketColors.debt },
                ].map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-[#6B7C70]">
                      <span>{item.label}</span>
                      <span>{Math.round(item.value * 100)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#EEF1E9] overflow-hidden">
                      <div className={`h-full ${item.color}`} style={{ width: `${item.value * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs font-serif text-[#6B7C70]">{narrative}</p>
            </div>

            <div className="bg-[#F8F9F6] border border-[#E3E7DF] rounded-2xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-base font-serif text-[#1F2937]">Suggested mix</h4>
                <span className="text-[11px] font-serif text-[#6B7C70]">Top weights</span>
              </div>
              <div className="mt-3 space-y-3">
                {topThree.map((row) => (
                  <div key={`${row.category}-${row.subCategory}`} className="border border-[#EDF0EA] rounded-2xl p-3 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.2em] text-[#6B7C70]">{row.category}</div>
                        <div className="text-sm text-[#1F2937]">{row.subCategory}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setShowShortlist((prev) => (prev === row.subCategory ? null : row.subCategory))
                          }
                          className="text-[11px] uppercase tracking-[0.2em] text-[#4A5D4E]"
                        >
                          i
                        </button>
                        <div className="text-base text-[#1F2937]">{row.displayPct}%</div>
                      </div>
                    </div>
                    <p className="mt-1 text-[11px] text-[#6B7C70]">{row.rationale}</p>
                    {showShortlist === row.subCategory && (
                      <div className="mt-3 grid grid-cols-1 gap-2">
                        {(shortlistBySubCategory.get(row.subCategory) ?? [])
                          .filter((fund: FundAnalytics) => (fund.Current_AUM ?? 0) > 50)
                          .sort(
                            (a: FundAnalytics, b: FundAnalytics) =>
                              (b.Composite_Score ?? 0) - (a.Composite_Score ?? 0)
                          )
                          .slice(0, 2)
                          .map((fund: FundAnalytics) => (
                            <div key={`${fund.Fund_Name}-${fund.AMC}`} className="border border-[#E3E7DF] rounded-2xl p-3">
                              <div className="text-sm text-[#1F2937]">{fund.Fund_Name}</div>
                              <div className="text-xs text-[#6B7C70]">{fund.AMC}</div>
                              <div className="mt-2 flex items-center justify-between text-[11px] text-[#6B7C70]">
                                <span>Score: {fund.Composite_Score?.toFixed(2)}</span>
                                <button
                                  type="button"
                                  onClick={() => setShowFundDetails(fund)}
                                  className="text-[#4A5D4E] underline"
                                >
                                  Details
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-[#6B7C70]">These three sum to 100% for a focused starting mix.</p>
            </div>
          </div>
        </div>
      </div>

      {showFundDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/30 px-4">
          <div className="max-w-lg w-full bg-white border border-[#E3E7DF] rounded-3xl p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.6)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[#6B7C70] font-serif">Shortlisted fund</p>
                <h4 className="mt-2 text-lg font-serif text-[#1F2937]">{showFundDetails.Fund_Name}</h4>
                <p className="text-xs text-[#6B7C70]">{showFundDetails.AMC}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowFundDetails(null)}
                className="text-xs uppercase tracking-[0.2em] text-[#6B7C70]"
              >
                Close
              </button>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-2 text-xs text-[#6B7C70]">
              <div>Category: {showFundDetails.Category}</div>
              <div>Sub-category: {showFundDetails.Sub_Category}</div>
              <div>Benchmark: {showFundDetails.Benchmark_Name}</div>
              <div>AUM: {showFundDetails.Current_AUM?.toFixed(0)} Cr</div>
              <div>Alpha 3Y: {showFundDetails.Alpha_3Y?.toFixed(2)}%</div>
              <div>IR 3Y: {showFundDetails.IR_3Y?.toFixed(2)}</div>
              <div>Composite score: {showFundDetails.Composite_Score?.toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
