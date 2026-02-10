"use client";

import { useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  type TooltipProps,
  XAxis,
  YAxis,
} from "recharts";

const formatIndianCurrency = (num: number) => {
  if (!Number.isFinite(num)) return "0";
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(num);
};

const formatCompactCurrency = (value: number) => {
  if (!Number.isFinite(value)) return "0";
  const absolute = Math.abs(value);
  if (absolute >= 1e7) return `${(value / 1e7).toFixed(1)}Cr`;
  if (absolute >= 1e5) return `${(value / 1e5).toFixed(1)}L`;
  if (absolute >= 1e3) return `${(value / 1e3).toFixed(0)}k`;
  return Math.round(value).toString();
};

const formatIndianUnitLabel = (value: number) => {
  if (!Number.isFinite(value) || value === 0) return "Enter an amount";
  const absolute = Math.abs(value);
  if (absolute >= 1e7) return `Approx. ${(value / 1e7).toFixed(2)} crore`;
  if (absolute >= 1e5) return `Approx. ${(value / 1e5).toFixed(2)} lakh`;
  if (absolute >= 1e3) return `Approx. ${(value / 1e3).toFixed(1)} thousand`;
  return `Approx. ${value.toFixed(0)}`;
};

const formatIndicatorLabel = (value: number, kind?: "amount" | "years" | "percent") => {
  if (!kind) return "";
  if (!Number.isFinite(value)) return "";
  if (kind === "amount") return formatIndianUnitLabel(value);
  if (kind === "years") return `${value.toFixed(0)} years`;
  return `${value.toFixed(1)}%`;
};

const chartMargin = { top: 10, right: 8, left: -10, bottom: 0 };
const axisDefaults = {
  tickLine: false,
  axisLine: false,
  width: 44,
  tickMargin: 4,
  tick: { fill: "#9AA3AF", fontSize: 9 },
};
const xAxisDefaults = { tickLine: false, axisLine: false, tickMargin: 8, tick: { fill: "#9AA3AF", fontSize: 9 }, minTickGap: 18 };

const parseNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

type ChartPoint = { year: number; invested?: number; corpus?: number; remaining?: number; withdrawal?: number };

type DualChartPoint = {
  year: number;
  sip?: number;
  lumpsum?: number;
  corpus?: number;
  invested?: number;
};

type RetirementCashflowPoint = {
  year: number;
  income: number;
  lumpsum: number;
  totalOutflow: number;
  corpus: number;
};

type WithdrawalRow = { id: string; amount: string; year: string };

const formatWithdrawalSummary = (rows: WithdrawalRow[]) => {
  const cleaned = rows
    .map((row) => ({ amount: parseNumber(row.amount), year: parseNumber(row.year) }))
    .filter((row) => row.amount > 0 && row.year > 0)
    .sort((a, b) => a.year - b.year)
    .map((row) => `INR ${formatIndianCurrency(row.amount)} in year ${row.year}`);
  return cleaned.length > 0 ? cleaned.join("; ") : "No planned lump sums";
};

const getGoalLabelProps = (year: number, retirementYear: number, index: number) => {
  const nearRetirement = Math.abs(year - retirementYear) <= 1;
  if (nearRetirement) {
    return {
      value: "Goal",
      position: year >= retirementYear ? "insideBottomRight" : "insideBottomLeft",
      fill: "#B35A5A",
      offset: 16,
    } as const;
  }
  const isEven = index % 2 === 0;
  return {
    value: "Goal",
    position: isEven ? "insideTopLeft" : "insideBottomLeft",
    fill: "#B35A5A",
    offset: isEven ? 6 : 12,
  } as const;
};

const buildSIPGrowthData = (sipAmount: number, timeYears: number, expectedReturn: number) => {
  const monthlyRate = expectedReturn / 100 / 12;
  let totalInvested = 0;
  let corpus = 0;
  const data: ChartPoint[] = [{ year: 0, invested: 0, corpus: 0 }];
  for (let year = 1; year <= timeYears; year += 1) {
    for (let month = 0; month < 12; month += 1) {
      totalInvested += sipAmount;
      corpus = (corpus + sipAmount) * (1 + monthlyRate);
    }
    data.push({ year, invested: totalInvested, corpus });
  }
  return data;
};

const buildLumpsumGrowthData = (lumpsumAmount: number, timeYears: number, expectedReturn: number) => {
  const annualRate = expectedReturn / 100;
  let corpus = lumpsumAmount;
  const data: ChartPoint[] = [{ year: 0, invested: lumpsumAmount, corpus: lumpsumAmount }];
  for (let year = 1; year <= timeYears; year += 1) {
    corpus *= 1 + annualRate;
    data.push({ year, invested: lumpsumAmount, corpus });
  }
  return data;
};

const buildSWPData = (corpusAmount: number, withdrawalYears: number, expectedReturn: number, monthlySWP: number) => {
  const monthlyRate = expectedReturn / 100 / 12;
  let corpus = corpusAmount;
  const data: ChartPoint[] = [{ year: 0, remaining: corpusAmount }];
  for (let year = 1; year <= withdrawalYears; year += 1) {
    for (let month = 0; month < 12; month += 1) {
      corpus = corpus * (1 + monthlyRate) - monthlySWP;
      if (corpus < 0) corpus = 0;
    }
    data.push({ year, remaining: corpus });
  }
  return data;
};

const buildLimitedSIPData = (
  sipAmount: number,
  sipPeriodYears: number,
  totalGrowthPeriodYears: number,
  expectedReturn: number
) => {
  const monthlyRate = expectedReturn / 100 / 12;
  let totalInvested = 0;
  let corpus = 0;
  const data: ChartPoint[] = [{ year: 0, invested: 0, corpus: 0 }];
  for (let year = 1; year <= totalGrowthPeriodYears; year += 1) {
    if (year <= sipPeriodYears) {
      for (let month = 0; month < 12; month += 1) {
        totalInvested += sipAmount;
        corpus = (corpus + sipAmount) * (1 + monthlyRate);
      }
    } else {
      corpus *= Math.pow(1 + monthlyRate, 12);
    }
    data.push({ year, invested: totalInvested, corpus });
  }
  return data;
};

const buildSipPlusLumpsumData = (
  sipAmount: number,
  lumpsumAmount: number,
  timeYears: number,
  expectedReturn: number
) => {
  const monthlyRate = expectedReturn / 100 / 12;
  let totalInvested = lumpsumAmount;
  let corpus = lumpsumAmount;
  const data: DualChartPoint[] = [{ year: 0, invested: lumpsumAmount, corpus: lumpsumAmount }];
  for (let year = 1; year <= timeYears; year += 1) {
    for (let month = 0; month < 12; month += 1) {
      totalInvested += sipAmount;
      corpus = (corpus + sipAmount) * (1 + monthlyRate);
    }
    data.push({ year, invested: totalInvested, corpus });
  }
  return data;
};

const buildSipAndLumpsumGoalData = (
  sipAmount: number,
  lumpsumAmount: number,
  timeYears: number,
  expectedReturn: number
) => {
  const monthlyRate = expectedReturn / 100 / 12;
  const annualRate = expectedReturn / 100;
  let totalSipInvested = 0;
  let currentSipCorpus = 0;
  let currentLumpsumCorpus = lumpsumAmount;
  const data: DualChartPoint[] = [{ year: 0, sip: 0, lumpsum: lumpsumAmount, corpus: lumpsumAmount }];
  for (let year = 1; year <= timeYears; year += 1) {
    for (let month = 0; month < 12; month += 1) {
      totalSipInvested += sipAmount;
      currentSipCorpus = (currentSipCorpus + sipAmount) * (1 + monthlyRate);
    }
    currentLumpsumCorpus *= 1 + annualRate;
    data.push({
      year,
      sip: totalSipInvested,
      lumpsum: lumpsumAmount,
      corpus: currentSipCorpus + currentLumpsumCorpus,
    });
  }
  return data;
};

const buildInflationAdjustedSWPData = (
  initialCorpus: number,
  withdrawalYears: number,
  expectedReturn: number,
  inflationRate: number,
  initialMonthlySWP: number
) => {
  const monthlyReturnRate = expectedReturn / 100 / 12;
  const monthlyInflationRate = inflationRate / 100 / 12;
  let corpus = initialCorpus;
  let monthlySWP = initialMonthlySWP;
  const data: ChartPoint[] = [{ year: 0, remaining: initialCorpus, withdrawal: 0 }];

  for (let year = 1; year <= withdrawalYears; year += 1) {
    let annualWithdrawal = 0;
    for (let month = 0; month < 12; month += 1) {
      corpus = corpus * (1 + monthlyReturnRate) - monthlySWP;
      annualWithdrawal += monthlySWP;
      if (corpus < 0) corpus = 0;
      if (month < 11) {
        monthlySWP *= 1 + monthlyInflationRate;
      }
    }
    data.push({ year, remaining: corpus, withdrawal: annualWithdrawal });
    monthlySWP = initialMonthlySWP * Math.pow(1 + monthlyInflationRate, year * 12);
  }
  return data;
};

const ChapterHeader = ({
  title,
  headline,
  reflection,
}: {
  title: string;
  headline: string;
  reflection: string;
}) => (
  <div className="space-y-3">
    <div className="flex items-center gap-3">
      <span className="text-xs uppercase tracking-[0.35em] text-[#6B7C70] font-serif">{title}</span>
      <span className="h-px flex-1 bg-[#E6E8E1]" />
    </div>
    <h2 className="text-xl md:text-2xl font-serif text-[#1F2937]">{headline}</h2>
    <p className="text-xs md:text-sm font-serif italic text-[#6B7C70]">{reflection}</p>
  </div>
);

const InputField = ({
  label,
  value,
  onChange,
  suffix,
  placeholder,
  indicator,
  range,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
  placeholder?: string;
  indicator?: "amount" | "years" | "percent";
  range?: {
    min: number;
    max: number;
    step: number;
    formatLabel?: (value: number) => string;
  };
}) => (
  <label className="grid gap-2 text-sm text-[#1F2937]">
    <span className="min-h-[28px] font-serif text-[11px] uppercase tracking-[0.2em] text-[#6B7C70]">{label}</span>
    <div className="space-y-2">
      <div className="relative">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          inputMode="decimal"
          className="w-full rounded-2xl border border-[#D5D9CF] bg-white px-3 py-2.5 text-sm text-[#1F2937]"
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#6B7C70]">
            {suffix}
          </span>
        ) : null}
      </div>
      {range ? (
        <div className="space-y-2">
          <input
            type="range"
            min={range.min}
            max={range.max}
            step={range.step}
            value={Number.isFinite(parseNumber(value)) ? parseNumber(value) : range.min}
            onChange={(event) => onChange(event.target.value)}
            className="w-full accent-[#2F5D7C]"
          />
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-[#8A958C]">
            <span>{range.formatLabel ? range.formatLabel(range.min) : range.min}</span>
            <span className="text-[#2F5D7C]">
              {formatIndicatorLabel(parseNumber(value), indicator)}
            </span>
            <span>{range.formatLabel ? range.formatLabel(range.max) : range.max}</span>
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-[#7A867F]">
          {formatIndicatorLabel(parseNumber(value), indicator)}
        </p>
      )}
    </div>
  </label>
);

const CalculatorCard = ({
  title,
  description,
  children,
  defaultCollapsed = true,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
}) => (
  <CalculatorCardInner
    title={title}
    description={description}
    defaultCollapsed={defaultCollapsed}
  >
    {children}
  </CalculatorCardInner>
);

const CalculatorCardInner = ({
  title,
  description,
  children,
  defaultCollapsed,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  defaultCollapsed: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(!defaultCollapsed);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const handleToggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        requestAnimationFrame(() => {
          cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
      return next;
    });
  };

  return (
    <div
      ref={cardRef}
      className="rounded-3xl border border-[#E6E8E1] bg-white p-4 shadow-[0_18px_40px_-32px_rgba(33,45,31,0.28)] scroll-mt-28"
    >
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full items-start justify-between gap-4 text-left"
        aria-expanded={isOpen}
      >
        <div className="space-y-1">
          <h3 className="text-lg font-serif text-[#1F2937]">{title}</h3>
          <p className="text-xs font-serif text-[#6B7C70]">{description}</p>
        </div>
        <span className="mt-1 whitespace-nowrap rounded-full border border-[#E6E8E1] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#6B7C70]">
          {isOpen ? "Collapse" : "Expand"}
        </span>
      </button>
      {isOpen ? <div className="mt-5 space-y-5">{children}</div> : null}
    </div>
  );
};

const ResultCard = ({
  title,
  value,
  message,
  tone = "neutral",
  emoji,
}: {
  title: string;
  value: string;
  message: string;
  tone?: "positive" | "negative" | "neutral";
  emoji?: string;
}) => {
  const toneClass =
    tone === "positive" ? "text-[#2F5D7C]" : tone === "negative" ? "text-[#B35A5A]" : "text-[#1F2937]";
  return (
    <div className="rounded-2xl border border-[#EEF0E8] bg-[#FBFCFA] p-3">
      <div className="text-xs uppercase tracking-[0.2em] text-[#6B7C70]">
        {emoji ? `${emoji} ` : ""}
        {title}
      </div>
      <div className={`mt-2 text-xl font-semibold ${toneClass}`}>{value}</div>
      <p className="mt-1 text-[11px] text-[#6B7C70]">{message}</p>
    </div>
  );
};

const ChartTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-[#E6E8E1] bg-white px-3 py-2 shadow-lg">
      <div className="text-xs uppercase tracking-[0.2em] text-[#6B7C70]">Year {label}</div>
      <div className="mt-2 space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-xs text-[#1F2937]">
            <span className="font-serif" style={{ color: entry.color }}>
              {entry.name}
            </span>
            <span className="font-semibold">INR {formatIndianCurrency(Number(entry.value))}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const RetirementTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0]?.payload as RetirementCashflowPoint | undefined;
  if (!data) return null;
  const showGoal = data.lumpsum > 0;
  return (
    <div className="rounded-xl border border-[#E6E8E1] bg-white px-3 py-2 shadow-lg">
      <div className="text-xs uppercase tracking-[0.2em] text-[#6B7C70]">Year {label}</div>
      <div className="mt-2 space-y-1 text-xs text-[#1F2937]">
        <div className="flex items-center justify-between gap-4">
          <span className="font-serif" style={{ color: "#2F5D7C" }}>Money left after withdrawals</span>
          <span className="font-semibold">INR {formatIndianCurrency(data.corpus)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="font-serif" style={{ color: "#B35A5A" }}>Money you withdraw this year</span>
          <span className="font-semibold">INR {formatIndianCurrency(data.totalOutflow)}</span>
        </div>
        {showGoal ? (
          <div className="flex items-center justify-between gap-4">
            <span className="font-serif" style={{ color: "#BDA06D" }}>Goal withdrawal</span>
            <span className="font-semibold">INR {formatIndianCurrency(data.lumpsum)}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const InfoToggle = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <details className="group">
    <summary className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#D5D9CF] bg-white px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#2F5D7C]">
      {label}
    </summary>
    <div className="mt-2 text-[11px] font-serif text-[#6B7C70]">{children}</div>
  </details>
);

const NextStep = ({ label, note, onSelect }: { label: string; note?: string; onSelect: () => void }) => (
  <div className="rounded-2xl border border-dashed border-[#D5D9CF] bg-[#FBFCFA] px-4 py-3 shadow-[0_10px_22px_-18px_rgba(31,41,55,0.35)]">
    {note ? <InfoToggle label="Why next?">{note}</InfoToggle> : null}
    <button type="button" onClick={onSelect} className="mt-2 text-xs uppercase tracking-[0.2em] text-[#2F5D7C]">
      Next: {label}
    </button>
  </div>
);

const ExampleNote = ({ text }: { text: string }) => (
  <InfoToggle label="Example">{text}</InfoToggle>
);

const SECTION_TABS = [
  {
    id: "direction",
    label: "Direction",
    subTabs: [
      { id: "sip-goal", label: "SIP goal" },
      { id: "lumpsum-goal", label: "Lumpsum goal" },
    ],
  },
  {
    id: "building",
    label: "Building",
    subTabs: [
      { id: "sip-fv", label: "SIP future value" },
      { id: "lumpsum-fv", label: "Lumpsum future value" },
      { id: "sip-plus-lumpsum", label: "SIP + one-time" },
    ],
  },
  {
    id: "optimising",
    label: "Optimising",
    subTabs: [
      { id: "limited-sip-fv", label: "Limited SIP future value" },
      { id: "limited-sip-goal", label: "Limited SIP goal" },
      { id: "one-time-if-sip", label: "One-time for SIP" },
      { id: "sip-if-one-time", label: "SIP for one-time" },
    ],
  },
  {
    id: "living-off-money",
    label: "Living Off Money",
    subTabs: [
      { id: "swp-corpus", label: "SWP from corpus" },
      { id: "corpus-for-swp", label: "Corpus for SWP" },
      { id: "inflation-swp", label: "Inflation-adjusted SWP" },
    ],
  },
  {
    id: "readiness",
    label: "Readiness",
    subTabs: [{ id: "retirement-analysis", label: "Retirement analysis" }],
  },
];

const SubTabNav = ({
  tabs,
  activeId,
  onSelect,
}: {
  tabs: { id: string; label: string }[];
  activeId: string;
  onSelect: (id: string) => void;
}) => (
  <div className="flex flex-wrap gap-2 rounded-2xl border border-[#E6E8E1] bg-white/80 p-3 backdrop-blur">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onSelect(tab.id)}
        className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] transition ${
          activeId === tab.id
            ? "border-[#2F5D7C] bg-[#EAF1FB] text-[#2F5D7C] shadow-[0_8px_16px_-12px_rgba(31,41,55,0.3)]"
            : "border-[#D5D9CF] bg-white text-[#6B7C70]"
        }`}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

export default function LifeCalculatorsPage() {
  const [activeTab, setActiveTab] = useState(SECTION_TABS[0].id);
  const [activeSubTab, setActiveSubTab] = useState<Record<string, string>>({
    direction: "sip-goal",
    building: "sip-fv",
    optimising: "limited-sip-fv",
    "living-off-money": "swp-corpus",
    readiness: "retirement-analysis",
  });

  const [sipGoalInputs, setSipGoalInputs] = useState({
    goalAmount: "1500000",
    timeYears: "10",
    expectedReturn: "12",
  });
  const [sipGoalResult, setSipGoalResult] = useState<{ sip: number; chart: ChartPoint[] } | null>(null);

  const [sipFVInputs, setSipFVInputs] = useState({
    sipAmount: "15000",
    timeYears: "10",
    expectedReturn: "12",
  });
  const [sipFVResult, setSipFVResult] = useState<{ corpus: number; chart: ChartPoint[] } | null>(null);

  const [lumpsumGoalInputs, setLumpsumGoalInputs] = useState({
    goalAmount: "2500000",
    timeYears: "8",
    expectedReturn: "11",
  });
  const [lumpsumGoalResult, setLumpsumGoalResult] = useState<{ corpus: number; chart: ChartPoint[] } | null>(null);

  const [lumpsumFVInputs, setLumpsumFVInputs] = useState({
    lumpsumAmount: "500000",
    timeYears: "12",
    expectedReturn: "10",
  });
  const [lumpsumFVResult, setLumpsumFVResult] = useState<{ corpus: number; chart: ChartPoint[] } | null>(null);

  const [swpInputs, setSwpInputs] = useState({
    corpusAmount: "5000000",
    withdrawalYears: "25",
    expectedReturn: "8",
  });
  const [swpResult, setSwpResult] = useState<{ monthly: number; chart: ChartPoint[] } | null>(null);

  const [swpCorpusInputs, setSwpCorpusInputs] = useState({
    monthlySWP: "40000",
    withdrawalYears: "25",
    expectedReturn: "8",
  });
  const [swpCorpusResult, setSwpCorpusResult] = useState<{ corpus: number; chart: ChartPoint[] } | null>(null);

  const [limitedSipFVInputs, setLimitedSipFVInputs] = useState({
    monthlySIP: "20000",
    sipPeriodYears: "7",
    totalGrowthYears: "15",
    expectedReturn: "12",
  });
  const [limitedSipFVResult, setLimitedSipFVResult] = useState<{ corpus: number; chart: ChartPoint[] } | null>(null);

  const [limitedSipGoalInputs, setLimitedSipGoalInputs] = useState({
    goalAmount: "3500000",
    sipPeriodYears: "6",
    totalGrowthYears: "15",
    expectedReturn: "12",
  });
  const [limitedSipGoalResult, setLimitedSipGoalResult] = useState<{ sip: number; chart: ChartPoint[] } | null>(null);

  const [sipPlusLumpsumInputs, setSipPlusLumpsumInputs] = useState({
    monthlySIP: "15000",
    lumpsumAmount: "300000",
    timeYears: "12",
    expectedReturn: "12",
  });
  const [sipPlusLumpsumResult, setSipPlusLumpsumResult] = useState<{ corpus: number; chart: DualChartPoint[] } | null>(null);

  const [oneTimeIfSipInputs, setOneTimeIfSipInputs] = useState({
    goalAmount: "2000000",
    monthlySIP: "12000",
    timeYears: "10",
    expectedReturn: "11",
  });
  const [oneTimeIfSipResult, setOneTimeIfSipResult] = useState<{ oneTime: number; chart: DualChartPoint[] } | null>(null);

  const [sipIfOneTimeInputs, setSipIfOneTimeInputs] = useState({
    goalAmount: "2000000",
    lumpsumAmount: "400000",
    timeYears: "10",
    expectedReturn: "11",
  });
  const [sipIfOneTimeResult, setSipIfOneTimeResult] = useState<{ sip: number; chart: DualChartPoint[] } | null>(null);

  const [inflationSwpInputs, setInflationSwpInputs] = useState({
    corpusAmount: "6000000",
    withdrawalYears: "25",
    expectedReturn: "8",
    inflationRate: "6",
  });
  const [inflationSwpResult, setInflationSwpResult] = useState<{ monthly: number; chart: ChartPoint[] } | null>(null);

  const [retirementInputs, setRetirementInputs] = useState({
    currentCorpus: "1200000",
    monthlySIP: "20000",
    yearsToRetirement: "20",
    desiredMonthlyIncome: "75000",
    retirementDuration: "25",
    expectedReturnPre: "11",
    expectedReturnPost: "7",
    inflationRate: "6",
  });
  const [retirementWithdrawals, setRetirementWithdrawals] = useState<WithdrawalRow[]>([
    { id: "w1", amount: "500000", year: "10" },
    { id: "w2", amount: "300000", year: "20" },
  ]);
  const [retirementResult, setRetirementResult] = useState<{
    projected: number;
    required: number;
    shortfall: number;
    desiredIncomeAtRetirement: number;
    cashflow: RetirementCashflowPoint[];
  } | null>(null);

  const scrollToId = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToResult = (id: string) => {
    requestAnimationFrame(() => requestAnimationFrame(() => scrollToId(id)));
  };

  const handleTabSelect = (id: string) => {
    setActiveTab(id);
    scrollToId(id);
  };

  const handleSubTabSelect = (sectionId: string, id: string) => {
    setActiveSubTab((prev) => ({ ...prev, [sectionId]: id }));
    scrollToId(id);
  };

  const addRetirementWithdrawal = () => {
    setRetirementWithdrawals((prev) => [
      ...prev,
      { id: `w-${Date.now()}-${Math.random().toString(16).slice(2)}`, amount: "", year: "" },
    ]);
  };

  const updateRetirementWithdrawal = (id: string, field: "amount" | "year", value: string) => {
    setRetirementWithdrawals((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const removeRetirementWithdrawal = (id: string) => {
    setRetirementWithdrawals((prev) => prev.filter((row) => row.id !== id));
  };

  const sipGoalMessage = useMemo(() => {
    if (!sipGoalResult) return "";
    return `To reach INR ${formatIndianCurrency(parseNumber(sipGoalInputs.goalAmount))} in ${sipGoalInputs.timeYears} years at ${sipGoalInputs.expectedReturn}%, this is the monthly SIP to consider.`;
  }, [sipGoalInputs, sipGoalResult]);

  const sipFVMessage = useMemo(() => {
    if (!sipFVResult) return "";
    return `At INR ${formatIndianCurrency(parseNumber(sipFVInputs.sipAmount))} per month for ${sipFVInputs.timeYears} years at ${sipFVInputs.expectedReturn}%, this is the estimated corpus.`;
  }, [sipFVInputs, sipFVResult]);

  const lumpsumGoalMessage = useMemo(() => {
    if (!lumpsumGoalResult) return "";
    return `To reach INR ${formatIndianCurrency(parseNumber(lumpsumGoalInputs.goalAmount))} in ${lumpsumGoalInputs.timeYears} years at ${lumpsumGoalInputs.expectedReturn}%, this is the one-time amount to consider.`;
  }, [lumpsumGoalInputs, lumpsumGoalResult]);

  const lumpsumFVMessage = useMemo(() => {
    if (!lumpsumFVResult) return "";
    return `With INR ${formatIndianCurrency(parseNumber(lumpsumFVInputs.lumpsumAmount))} invested for ${lumpsumFVInputs.timeYears} years at ${lumpsumFVInputs.expectedReturn}%, this is the estimated corpus.`;
  }, [lumpsumFVInputs, lumpsumFVResult]);

  const swpMessage = useMemo(() => {
    if (!swpResult) return "";
    return `From a corpus of INR ${formatIndianCurrency(parseNumber(swpInputs.corpusAmount))}, this is the sustainable monthly withdrawal.`;
  }, [swpInputs, swpResult]);

  const swpCorpusMessage = useMemo(() => {
    if (!swpCorpusResult) return "";
    return `To receive INR ${formatIndianCurrency(parseNumber(swpCorpusInputs.monthlySWP))} per month for ${swpCorpusInputs.withdrawalYears} years, this is the corpus to consider.`;
  }, [swpCorpusInputs, swpCorpusResult]);

  const limitedSipFVMessage = useMemo(() => {
    if (!limitedSipFVResult) return "";
    return `With INR ${formatIndianCurrency(parseNumber(limitedSipFVInputs.monthlySIP))} per month for ${limitedSipFVInputs.sipPeriodYears} years and ${limitedSipFVInputs.totalGrowthYears} years of growth at ${limitedSipFVInputs.expectedReturn}%, this is the estimated corpus.`;
  }, [limitedSipFVInputs, limitedSipFVResult]);

  const limitedSipGoalMessage = useMemo(() => {
    if (!limitedSipGoalResult) return "";
    return `To reach INR ${formatIndianCurrency(parseNumber(limitedSipGoalInputs.goalAmount))} with ${limitedSipGoalInputs.sipPeriodYears} years of SIPs and ${limitedSipGoalInputs.totalGrowthYears} years of growth at ${limitedSipGoalInputs.expectedReturn}%, this is the SIP to consider.`;
  }, [limitedSipGoalInputs, limitedSipGoalResult]);

  const sipPlusLumpsumMessage = useMemo(() => {
    if (!sipPlusLumpsumResult) return "";
    return `With INR ${formatIndianCurrency(parseNumber(sipPlusLumpsumInputs.monthlySIP))} per month and INR ${formatIndianCurrency(parseNumber(sipPlusLumpsumInputs.lumpsumAmount))} upfront over ${sipPlusLumpsumInputs.timeYears} years at ${sipPlusLumpsumInputs.expectedReturn}%, this is the estimated corpus.`;
  }, [sipPlusLumpsumInputs, sipPlusLumpsumResult]);

  const oneTimeIfSipMessage = useMemo(() => {
    if (!oneTimeIfSipResult) return "";
    return `To reach INR ${formatIndianCurrency(parseNumber(oneTimeIfSipInputs.goalAmount))} with INR ${formatIndianCurrency(parseNumber(oneTimeIfSipInputs.monthlySIP))} per month over ${oneTimeIfSipInputs.timeYears} years at ${oneTimeIfSipInputs.expectedReturn}%, this is the one-time addition to consider.`;
  }, [oneTimeIfSipInputs, oneTimeIfSipResult]);

  const sipIfOneTimeMessage = useMemo(() => {
    if (!sipIfOneTimeResult) return "";
    return `To reach INR ${formatIndianCurrency(parseNumber(sipIfOneTimeInputs.goalAmount))} with INR ${formatIndianCurrency(parseNumber(sipIfOneTimeInputs.lumpsumAmount))} already invested over ${sipIfOneTimeInputs.timeYears} years at ${sipIfOneTimeInputs.expectedReturn}%, this is the SIP to consider.`;
  }, [sipIfOneTimeInputs, sipIfOneTimeResult]);

  const inflationSwpMessage = useMemo(() => {
    if (!inflationSwpResult) return "";
    return `From a corpus of INR ${formatIndianCurrency(parseNumber(inflationSwpInputs.corpusAmount))}, this is the starting monthly withdrawal with inflation adjustments.`;
  }, [inflationSwpInputs, inflationSwpResult]);

  const retirementMessage = useMemo(() => {
    if (!retirementResult) return "";
    const outcome = retirementResult.shortfall >= 0 ? "surplus" : "shortfall";
    const gap = formatIndianCurrency(Math.abs(retirementResult.shortfall));
    const projected = formatIndianCurrency(retirementResult.projected);
    const required = formatIndianCurrency(retirementResult.required);
    const income = formatIndianCurrency(retirementResult.desiredIncomeAtRetirement);
    const yearsToRetirement = parseNumber(retirementInputs.yearsToRetirement);
    const retirementDuration = parseNumber(retirementInputs.retirementDuration);
    const horizon = yearsToRetirement + retirementDuration;
    return `Projected corpus at retirement (year ${yearsToRetirement}) is INR ${projected}. To fund an inflation-adjusted income of INR ${income} per month for ${retirementDuration} years plus planned lump sums, you need INR ${required}. Your plan shows a ${outcome} of INR ${gap} across the ${horizon}-year horizon.`;
  }, [retirementResult]);

  const retirementExplanation = useMemo(() => {
    if (!retirementResult) return { steps: [], example: "" };
    const yearsToRetirement = parseNumber(retirementInputs.yearsToRetirement);
    const retirementDuration = parseNumber(retirementInputs.retirementDuration);
    const currentCorpus = parseNumber(retirementInputs.currentCorpus);
    const monthlySIP = parseNumber(retirementInputs.monthlySIP);
    const desiredMonthlyIncome = parseNumber(retirementInputs.desiredMonthlyIncome);
    const expectedReturnPre = parseNumber(retirementInputs.expectedReturnPre);
    const expectedReturnPost = parseNumber(retirementInputs.expectedReturnPost);
    const inflationRate = parseNumber(retirementInputs.inflationRate);
    const withdrawalSummary = formatWithdrawalSummary(retirementWithdrawals);
    const desiredAtRetirement = formatIndianCurrency(retirementResult.desiredIncomeAtRetirement);

    const steps = [
      `Step 1: We grow your current corpus of INR ${formatIndianCurrency(currentCorpus)} with a monthly SIP of INR ${formatIndianCurrency(monthlySIP)} for ${yearsToRetirement} years at ${expectedReturnPre}% per year.`,
      `Step 2: Any lump sum withdrawals are entered as years from today (${withdrawalSummary}). These are inflation-adjusted to the year they occur and deducted from the corpus.`,
      `Step 3: Your desired income of INR ${formatIndianCurrency(desiredMonthlyIncome)} per month is inflated to INR ${desiredAtRetirement} at retirement, then modeled across ${retirementDuration} years with a ${expectedReturnPost}% post-retirement return and ${inflationRate}% inflation.`,
      `Step 4: We compare your projected corpus with the required corpus to show the surplus or shortfall.`,
      `Step 5: The cashflow chart runs from today through retirement and shows withdrawals and remaining corpus year by year.`,
    ];

    const example = `Example using your inputs: Starting at INR ${formatIndianCurrency(currentCorpus)} with SIP INR ${formatIndianCurrency(monthlySIP)}, you have ${yearsToRetirement} years to grow. At retirement, your monthly income target becomes INR ${desiredAtRetirement}. Over ${retirementDuration} years, plus ${withdrawalSummary}, the model estimates a required corpus of INR ${formatIndianCurrency(retirementResult.required)} against a projected corpus of INR ${formatIndianCurrency(retirementResult.projected)}.`;

    return { steps, example };
  }, [retirementInputs, retirementResult, retirementWithdrawals]);

  const handleSipGoal = () => {
    const goalAmount = parseNumber(sipGoalInputs.goalAmount);
    const timeYears = parseNumber(sipGoalInputs.timeYears);
    const expectedReturn = parseNumber(sipGoalInputs.expectedReturn);
    if (goalAmount <= 0 || timeYears <= 0 || expectedReturn < 0) return;

    const monthlyRate = expectedReturn / 100 / 12;
    const totalMonths = timeYears * 12;
    const sipRequired = monthlyRate === 0
      ? goalAmount / totalMonths
      : goalAmount * (monthlyRate / (Math.pow(1 + monthlyRate, totalMonths) - 1)) / (1 + monthlyRate);

    setSipGoalResult({ sip: sipRequired, chart: buildSIPGrowthData(sipRequired, timeYears, expectedReturn) });
    scrollToResult("sip-goal-result");
  };

  const handleSipFV = () => {
    const sipAmount = parseNumber(sipFVInputs.sipAmount);
    const timeYears = parseNumber(sipFVInputs.timeYears);
    const expectedReturn = parseNumber(sipFVInputs.expectedReturn);
    if (sipAmount <= 0 || timeYears <= 0 || expectedReturn < 0) return;

    const monthlyRate = expectedReturn / 100 / 12;
    const totalMonths = timeYears * 12;
    const futureValue = monthlyRate === 0
      ? sipAmount * totalMonths
      : sipAmount * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate);

    setSipFVResult({ corpus: futureValue, chart: buildSIPGrowthData(sipAmount, timeYears, expectedReturn) });
    scrollToResult("sip-fv-result");
  };

  const handleLumpsumGoal = () => {
    const goalAmount = parseNumber(lumpsumGoalInputs.goalAmount);
    const timeYears = parseNumber(lumpsumGoalInputs.timeYears);
    const expectedReturn = parseNumber(lumpsumGoalInputs.expectedReturn);
    if (goalAmount <= 0 || timeYears <= 0 || expectedReturn < 0) return;

    const annualRate = expectedReturn / 100;
    const lumpsumRequired = annualRate === 0 ? goalAmount : goalAmount / Math.pow(1 + annualRate, timeYears);

    setLumpsumGoalResult({ corpus: lumpsumRequired, chart: buildLumpsumGrowthData(lumpsumRequired, timeYears, expectedReturn) });
    scrollToResult("lumpsum-goal-result");
  };

  const handleLumpsumFV = () => {
    const lumpsumAmount = parseNumber(lumpsumFVInputs.lumpsumAmount);
    const timeYears = parseNumber(lumpsumFVInputs.timeYears);
    const expectedReturn = parseNumber(lumpsumFVInputs.expectedReturn);
    if (lumpsumAmount <= 0 || timeYears <= 0 || expectedReturn < 0) return;

    const annualRate = expectedReturn / 100;
    const futureValue = lumpsumAmount * Math.pow(1 + annualRate, timeYears);

    setLumpsumFVResult({ corpus: futureValue, chart: buildLumpsumGrowthData(lumpsumAmount, timeYears, expectedReturn) });
    scrollToResult("lumpsum-fv-result");
  };

  const handleSwp = () => {
    const corpusAmount = parseNumber(swpInputs.corpusAmount);
    const withdrawalYears = parseNumber(swpInputs.withdrawalYears);
    const expectedReturn = parseNumber(swpInputs.expectedReturn);
    if (corpusAmount <= 0 || withdrawalYears <= 0 || expectedReturn < 0) return;

    const monthlyRate = expectedReturn / 100 / 12;
    const totalMonths = withdrawalYears * 12;
    const monthlySWP = monthlyRate === 0
      ? corpusAmount / totalMonths
      : corpusAmount * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -totalMonths)));

    setSwpResult({ monthly: monthlySWP, chart: buildSWPData(corpusAmount, withdrawalYears, expectedReturn, monthlySWP) });
    scrollToResult("swp-result");
  };

  const handleSwpCorpus = () => {
    const monthlySWP = parseNumber(swpCorpusInputs.monthlySWP);
    const withdrawalYears = parseNumber(swpCorpusInputs.withdrawalYears);
    const expectedReturn = parseNumber(swpCorpusInputs.expectedReturn);
    if (monthlySWP <= 0 || withdrawalYears <= 0 || expectedReturn < 0) return;

    const monthlyRate = expectedReturn / 100 / 12;
    const totalMonths = withdrawalYears * 12;
    const requiredCorpus = monthlyRate === 0
      ? monthlySWP * totalMonths
      : monthlySWP * ((1 - Math.pow(1 + monthlyRate, -totalMonths)) / monthlyRate);

    setSwpCorpusResult({ corpus: requiredCorpus, chart: buildSWPData(requiredCorpus, withdrawalYears, expectedReturn, monthlySWP) });
    scrollToResult("swp-corpus-result");
  };

  const handleLimitedSipFV = () => {
    const monthlySIP = parseNumber(limitedSipFVInputs.monthlySIP);
    const sipPeriodYears = parseNumber(limitedSipFVInputs.sipPeriodYears);
    const totalGrowthYears = parseNumber(limitedSipFVInputs.totalGrowthYears);
    const expectedReturn = parseNumber(limitedSipFVInputs.expectedReturn);
    if (
      monthlySIP <= 0 ||
      sipPeriodYears <= 0 ||
      totalGrowthYears < sipPeriodYears ||
      expectedReturn < 0
    ) {
      return;
    }

    const monthlyRate = expectedReturn / 100 / 12;
    const sipMonths = sipPeriodYears * 12;
    const totalMonths = totalGrowthYears * 12;
    const corpusAtSipEnd = monthlyRate === 0
      ? monthlySIP * sipMonths
      : monthlySIP * ((Math.pow(1 + monthlyRate, sipMonths) - 1) / monthlyRate) * (1 + monthlyRate);
    const remainingMonths = totalMonths - sipMonths;
    const finalCorpus = corpusAtSipEnd * Math.pow(1 + monthlyRate, remainingMonths);

    setLimitedSipFVResult({
      corpus: finalCorpus,
      chart: buildLimitedSIPData(monthlySIP, sipPeriodYears, totalGrowthYears, expectedReturn),
    });
    scrollToResult("limited-sip-fv-result");
  };

  const handleLimitedSipGoal = () => {
    const goalAmount = parseNumber(limitedSipGoalInputs.goalAmount);
    const sipPeriodYears = parseNumber(limitedSipGoalInputs.sipPeriodYears);
    const totalGrowthYears = parseNumber(limitedSipGoalInputs.totalGrowthYears);
    const expectedReturn = parseNumber(limitedSipGoalInputs.expectedReturn);
    if (
      goalAmount <= 0 ||
      sipPeriodYears <= 0 ||
      totalGrowthYears < sipPeriodYears ||
      expectedReturn < 0
    ) {
      return;
    }

    const monthlyRate = expectedReturn / 100 / 12;
    const sipMonths = sipPeriodYears * 12;
    const totalMonths = totalGrowthYears * 12;
    const remainingMonths = totalMonths - sipMonths;
    let sipRequired = 0;

    if (monthlyRate === 0) {
      sipRequired = goalAmount / sipMonths;
    } else {
      const fvOneRupee = ((Math.pow(1 + monthlyRate, sipMonths) - 1) / monthlyRate) * (1 + monthlyRate);
      const compounded = fvOneRupee * Math.pow(1 + monthlyRate, remainingMonths);
      sipRequired = goalAmount / compounded;
    }

    setLimitedSipGoalResult({
      sip: sipRequired,
      chart: buildLimitedSIPData(sipRequired, sipPeriodYears, totalGrowthYears, expectedReturn),
    });
    scrollToResult("limited-sip-goal-result");
  };

  const handleSipPlusLumpsum = () => {
    const monthlySIP = parseNumber(sipPlusLumpsumInputs.monthlySIP);
    const lumpsumAmount = parseNumber(sipPlusLumpsumInputs.lumpsumAmount);
    const timeYears = parseNumber(sipPlusLumpsumInputs.timeYears);
    const expectedReturn = parseNumber(sipPlusLumpsumInputs.expectedReturn);
    if (monthlySIP <= 0 || lumpsumAmount <= 0 || timeYears <= 0 || expectedReturn < 0) return;

    const monthlyRate = expectedReturn / 100 / 12;
    const annualRate = expectedReturn / 100;
    const totalMonths = timeYears * 12;
    const fvSip = monthlyRate === 0
      ? monthlySIP * totalMonths
      : monthlySIP * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate);
    const fvLumpsum = lumpsumAmount * Math.pow(1 + annualRate, timeYears);
    const combined = fvSip + fvLumpsum;

    setSipPlusLumpsumResult({
      corpus: combined,
      chart: buildSipPlusLumpsumData(monthlySIP, lumpsumAmount, timeYears, expectedReturn),
    });
    scrollToResult("sip-plus-lumpsum-result");
  };

  const handleOneTimeIfSip = () => {
    const goalAmount = parseNumber(oneTimeIfSipInputs.goalAmount);
    const monthlySIP = parseNumber(oneTimeIfSipInputs.monthlySIP);
    const timeYears = parseNumber(oneTimeIfSipInputs.timeYears);
    const expectedReturn = parseNumber(oneTimeIfSipInputs.expectedReturn);
    if (goalAmount <= 0 || monthlySIP <= 0 || timeYears <= 0 || expectedReturn < 0) return;

    const monthlyRate = expectedReturn / 100 / 12;
    const annualRate = expectedReturn / 100;
    const totalMonths = timeYears * 12;
    const fvSip = monthlyRate === 0
      ? monthlySIP * totalMonths
      : monthlySIP * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate);

    const remaining = goalAmount - fvSip;
    const requiredOneTime =
      remaining <= 0
        ? 0
        : annualRate === 0
          ? remaining
          : remaining / Math.pow(1 + annualRate, timeYears);

    setOneTimeIfSipResult({
      oneTime: requiredOneTime,
      chart: buildSipAndLumpsumGoalData(monthlySIP, requiredOneTime, timeYears, expectedReturn),
    });
    scrollToResult("one-time-if-sip-result");
  };

  const handleSipIfOneTime = () => {
    const goalAmount = parseNumber(sipIfOneTimeInputs.goalAmount);
    const lumpsumAmount = parseNumber(sipIfOneTimeInputs.lumpsumAmount);
    const timeYears = parseNumber(sipIfOneTimeInputs.timeYears);
    const expectedReturn = parseNumber(sipIfOneTimeInputs.expectedReturn);
    if (goalAmount <= 0 || lumpsumAmount <= 0 || timeYears <= 0 || expectedReturn < 0) return;

    const monthlyRate = expectedReturn / 100 / 12;
    const annualRate = expectedReturn / 100;
    const totalMonths = timeYears * 12;
    const fvLumpsum = lumpsumAmount * Math.pow(1 + annualRate, timeYears);
    const remaining = goalAmount - fvLumpsum;
    let requiredSIP = 0;

    if (remaining <= 0) {
      requiredSIP = 0;
    } else if (monthlyRate === 0) {
      requiredSIP = remaining / totalMonths;
    } else {
      requiredSIP = remaining * (monthlyRate / (Math.pow(1 + monthlyRate, totalMonths) - 1)) / (1 + monthlyRate);
    }

    setSipIfOneTimeResult({
      sip: requiredSIP,
      chart: buildSipAndLumpsumGoalData(requiredSIP, lumpsumAmount, timeYears, expectedReturn),
    });
    scrollToResult("sip-if-one-time-result");
  };

  const handleInflationSwp = () => {
    const corpusAmount = parseNumber(inflationSwpInputs.corpusAmount);
    const withdrawalYears = parseNumber(inflationSwpInputs.withdrawalYears);
    const expectedReturn = parseNumber(inflationSwpInputs.expectedReturn);
    const inflationRate = parseNumber(inflationSwpInputs.inflationRate);
    if (corpusAmount <= 0 || withdrawalYears <= 0 || expectedReturn < 0 || inflationRate < 0) return;

    const totalMonths = withdrawalYears * 12;
    let initialMonthlySWP = 0;
    if (expectedReturn === inflationRate) {
      initialMonthlySWP = corpusAmount / totalMonths;
    } else {
      const realReturnRate = (1 + expectedReturn / 100) / (1 + inflationRate / 100) - 1;
      const realMonthlyRate = Math.pow(1 + realReturnRate, 1 / 12) - 1;
      if (realMonthlyRate === 0) {
        initialMonthlySWP = corpusAmount / totalMonths;
      } else {
        initialMonthlySWP = corpusAmount * (realMonthlyRate / (1 - Math.pow(1 + realMonthlyRate, -totalMonths)));
      }
    }

    setInflationSwpResult({
      monthly: initialMonthlySWP,
      chart: buildInflationAdjustedSWPData(corpusAmount, withdrawalYears, expectedReturn, inflationRate, initialMonthlySWP),
    });
    scrollToResult("inflation-swp-result");
  };

  const handleRetirement = () => {
    const currentCorpus = parseNumber(retirementInputs.currentCorpus);
    const monthlySIP = parseNumber(retirementInputs.monthlySIP);
    const yearsToRetirement = parseNumber(retirementInputs.yearsToRetirement);
    const desiredMonthlyIncome = parseNumber(retirementInputs.desiredMonthlyIncome);
    const retirementDuration = parseNumber(retirementInputs.retirementDuration);
    const expectedReturnPre = parseNumber(retirementInputs.expectedReturnPre);
    const expectedReturnPost = parseNumber(retirementInputs.expectedReturnPost);
    const inflationRate = parseNumber(retirementInputs.inflationRate);
    if (
      currentCorpus < 0 ||
      monthlySIP < 0 ||
      yearsToRetirement < 0 ||
      desiredMonthlyIncome <= 0 ||
      retirementDuration <= 0 ||
      expectedReturnPre < 0 ||
      expectedReturnPost < 0 ||
      inflationRate < 0
    ) {
      return;
    }

    const annualReturnPre = expectedReturnPre / 100;
    const monthlyReturnPre = annualReturnPre / 12;
    const withdrawals = retirementWithdrawals
      .map((row) => ({ amount: parseNumber(row.amount), year: parseNumber(row.year) }))
      .filter((row) => row.amount > 0 && row.year > 0)
      .sort((a, b) => a.year - b.year);

    const withdrawalsByYear = new Map<number, number>();
    withdrawals.forEach((row) => {
      const current = withdrawalsByYear.get(row.year) ?? 0;
      withdrawalsByYear.set(row.year, current + row.amount);
    });

    let projectedCorpus = currentCorpus;
    for (let year = 1; year <= yearsToRetirement; year += 1) {
      for (let month = 0; month < 12; month += 1) {
        projectedCorpus = (projectedCorpus + monthlySIP) * (1 + monthlyReturnPre);
      }
      const baseWithdrawal = withdrawalsByYear.get(year) ?? 0;
      const withdrawalAmount = baseWithdrawal > 0 ? baseWithdrawal * Math.pow(1 + inflationRate / 100, year) : 0;
      projectedCorpus -= withdrawalAmount;
    }

    const annualInflation = inflationRate / 100;
    const totalRetirementMonths = retirementDuration * 12;
    const desiredIncomeAtRetirement = desiredMonthlyIncome * Math.pow(1 + annualInflation, yearsToRetirement);

    let pvIncome = 0;
    if (expectedReturnPost === inflationRate) {
      pvIncome = desiredIncomeAtRetirement * totalRetirementMonths;
    } else {
      const realReturnRatePost = (1 + expectedReturnPost / 100) / (1 + inflationRate / 100) - 1;
      const realMonthlyRatePost = Math.pow(1 + realReturnRatePost, 1 / 12) - 1;
      if (realMonthlyRatePost === 0) {
        pvIncome = desiredIncomeAtRetirement * totalRetirementMonths;
      } else {
        pvIncome = desiredIncomeAtRetirement * ((1 - Math.pow(1 + realMonthlyRatePost, -totalRetirementMonths)) / realMonthlyRatePost);
      }
    }

    let pvLumpsumWithdrawals = 0;
    withdrawals.forEach((row) => {
      if (row.year <= yearsToRetirement) return;
      const yearAfterRetirement = row.year - yearsToRetirement;
      if (yearAfterRetirement > retirementDuration) return;
      const inflationAdjustedAmount = row.amount * Math.pow(1 + annualInflation, row.year);
      pvLumpsumWithdrawals += inflationAdjustedAmount / Math.pow(1 + expectedReturnPost / 100, yearAfterRetirement);
    });

    const requiredCorpus = pvIncome + pvLumpsumWithdrawals;
    const shortfall = projectedCorpus - requiredCorpus;

    const cashflow: RetirementCashflowPoint[] = [];
    const monthlyReturnPost = expectedReturnPost / 100 / 12;
    const monthlyInflationRate = inflationRate / 100 / 12;
    let corpus = currentCorpus;
    let monthlyIncome = desiredIncomeAtRetirement;
    const totalYears = yearsToRetirement + retirementDuration;

    for (let year = 1; year <= totalYears; year += 1) {
      let incomeOutflow = 0;
      if (year <= yearsToRetirement) {
        for (let month = 0; month < 12; month += 1) {
          corpus = (corpus + monthlySIP) * (1 + monthlyReturnPre);
        }
      } else {
        for (let month = 0; month < 12; month += 1) {
          corpus = corpus * (1 + monthlyReturnPost) - monthlyIncome;
          incomeOutflow += monthlyIncome;
          monthlyIncome *= 1 + monthlyInflationRate;
        }
      }

      const baseWithdrawal = withdrawalsByYear.get(year) ?? 0;
      const lumpsumOutflow = baseWithdrawal > 0 ? baseWithdrawal * Math.pow(1 + annualInflation, year) : 0;
      corpus -= lumpsumOutflow;

      cashflow.push({
        year,
        income: incomeOutflow,
        lumpsum: lumpsumOutflow,
        totalOutflow: incomeOutflow + lumpsumOutflow,
        corpus,
      });
    }

    setRetirementResult({
      projected: projectedCorpus,
      required: requiredCorpus,
      shortfall,
      desiredIncomeAtRetirement,
      cashflow,
    });
    scrollToResult("retirement-result");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F5F8FF] px-4 sm:px-6 py-10">
      <div className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-[#DDE6F3]/70 blur-3xl" />
      <div className="pointer-events-none absolute right-10 top-28 h-52 w-52 rounded-full bg-[#B7CCE6]/20 blur-2xl" />
      <div className="pointer-events-none absolute bottom-10 left-1/3 h-72 w-72 rounded-full bg-[#2F5D7C]/10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl space-y-12">
        <div className="grid gap-6 rounded-[32px] border border-[#DDE6F3] bg-white p-6 shadow-[0_24px_52px_-46px_rgba(31,41,55,0.25)] md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <p className="text-xs uppercase tracking-[0.35em] text-[#6B7C70] font-serif">Life calculators</p>
            <h1 className="text-3xl md:text-4xl font-serif text-[#1F2937]">Life Calculators</h1>
            <p className="text-sm md:text-base font-serif text-[#6B7C70]">
              Move through your money story at your own pace, from naming direction to living well on what you have built.
            </p>
            <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.2em] text-[#6B7C70]">
              <span className="rounded-full border border-[#DDE6F3] bg-white px-3 py-1.5">Clarity first</span>
              <span className="rounded-full border border-[#DDE6F3] bg-white px-3 py-1.5">Long-term calm</span>
              <span className="rounded-full border border-[#DDE6F3] bg-white px-3 py-1.5">Enough over excess</span>
            </div>
          </div>
          <div className="rounded-3xl border border-[#DDE6F3] bg-white p-5 shadow-[0_16px_36px_-28px_rgba(31,41,55,0.3)]">
            <div className="rounded-2xl border border-[#DDE6F3] bg-[#EEF4FF] p-4 shadow-[0_14px_28px_-24px_rgba(31,41,55,0.3)]">
              <p className="text-xs uppercase tracking-[0.25em] text-[#6B7C70]">Retirement spotlight</p>
              <p className="mt-2 text-sm font-serif text-[#1F2937]">A single view that combines income, inflation, and lump sums.</p>
              <div className="mt-3">
                <InfoToggle label="Why it matters">
                  The retirement analysis is the heart of this page. It models income, inflation, and lump sum needs with a
                  year-by-year cashflow view.
                </InfoToggle>
              </div>
              <button
                onClick={() => scrollToId("retirement-analysis")}
                className="mt-3 text-xs uppercase tracking-[0.2em] text-[#2F5D7C]"
              >
                Go to retirement analysis
              </button>
            </div>
            <p className="mt-6 text-xs uppercase tracking-[0.25em] text-[#6B7C70]">Journey map</p>
            <div className="mt-4 space-y-3 text-sm font-serif text-[#1F2937]">
              {SECTION_TABS.map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabSelect(tab.id)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                    activeTab === tab.id
                      ? "border-[#2F5D7C] bg-[#EAF1FB] text-[#1F2937] shadow-[0_10px_18px_-14px_rgba(31,41,55,0.3)]"
                      : "border-[#E6E8E1] bg-white text-[#1F2937]"
                  }`}
                >
                  <span>{`${index + 1}. ${tab.label}`}</span>
                  <span className="text-xs uppercase tracking-[0.2em] text-[#6B7C70]">{tab.subTabs.length} tools</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="sticky top-24 z-20 rounded-3xl border border-[#DDE6F3] bg-white p-3 shadow-[0_16px_36px_-26px_rgba(31,41,55,0.3)]">
          <div className="flex flex-wrap gap-2">
            {SECTION_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabSelect(tab.id)}
                className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] transition ${
                  activeTab === tab.id
                    ? "border-[#2F5D7C] bg-[#EAF1FB] text-[#2F5D7C] shadow-[0_10px_18px_-14px_rgba(31,41,55,0.3)]"
                    : "border-[#D5D9CF] bg-white text-[#6B7C70]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <section id="direction" className="scroll-mt-28 space-y-6 rounded-[32px] border border-[#DDE6F3] bg-white p-5 shadow-[0_22px_44px_-40px_rgba(31,41,55,0.25)] md:p-8">
          <ChapterHeader
            title="Direction"
            headline="Name the dream"
            reflection="Clarify what you are moving toward so the numbers serve your story."
          />
          <SubTabNav
            tabs={SECTION_TABS[0].subTabs}
            activeId={activeSubTab["direction"]}
            onSelect={(id) => handleSubTabSelect("direction", id)}
          />

          <div className="grid gap-8">
            <div id="sip-goal" className="scroll-mt-28">
              <CalculatorCard
                title="SIP required for a future goal"
                description="Work backwards from your goal amount and see the monthly SIP you need."
              >
                <div className="grid gap-4 md:grid-cols-3">
                  <InputField
                    label="Goal amount"
                    value={sipGoalInputs.goalAmount}
                    onChange={(value) => setSipGoalInputs((prev) => ({ ...prev, goalAmount: value }))}
                    placeholder="1500000"
                    indicator="amount"
                    range={{ min: 100000, max: 100000000, step: 100000, formatLabel: (value) => formatCompactCurrency(value) }}
                  />
                  <InputField
                    label="Time horizon (years)"
                    value={sipGoalInputs.timeYears}
                    onChange={(value) => setSipGoalInputs((prev) => ({ ...prev, timeYears: value }))}
                    placeholder="10"
                    indicator="years"
                    range={{ min: 1, max: 40, step: 1, formatLabel: (value) => `${value}y` }}
                  />
                  <InputField
                    label="Expected return"
                    value={sipGoalInputs.expectedReturn}
                    onChange={(value) => setSipGoalInputs((prev) => ({ ...prev, expectedReturn: value }))}
                    suffix="%"
                    placeholder="12"
                    indicator="percent"
                    range={{ min: 0, max: 20, step: 0.1, formatLabel: (value) => `${value}%` }}
                  />
                </div>
                <button
                  type="button"
                  className="rounded-full bg-[#2F5D7C] px-5 py-2 text-xs uppercase tracking-[0.2em] text-white"
                  onClick={handleSipGoal}
                >
                  Calculate SIP
                </button>
                <ExampleNote text="Goal 15,00,000 in 10 years at 12% shows the SIP needed each month." />
                {sipGoalResult ? (
                  <div id="sip-goal-result" className="space-y-4 scroll-mt-28">
                    <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
                      <ResultCard
                        title="Monthly SIP required"
                        emoji="🎯"
                        value={`INR ${formatIndianCurrency(sipGoalResult.sip)}`}
                        message={sipGoalMessage}
                      />
                      <div className="h-56 sm:h-64 rounded-2xl border border-[#EEF0E8] bg-white p-3">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={sipGoalResult.chart} margin={chartMargin}>
                            <CartesianGrid stroke="#EEF2F7" vertical={false} />
                            <XAxis dataKey="year" {...xAxisDefaults} />
                            <YAxis {...axisDefaults} tickFormatter={(value) => formatCompactCurrency(value as number)} />
                            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "transparent" }} />
                            <Line type="monotone" dataKey="invested" stroke="#BDA06D" strokeWidth={2} name="Your Investment" />
                            <Line type="monotone" dataKey="corpus" stroke="#2F5D7C" strokeWidth={3} name="Total Corpus" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <NextStep
                      label="Lumpsum goal"
                      note="Prefer a single investment instead of a monthly plan?"
                      onSelect={() => scrollToId("lumpsum-goal")}
                    />
                  </div>
                ) : null}
              </CalculatorCard>
            </div>

            <div id="lumpsum-goal" className="scroll-mt-28">
              <CalculatorCard
                title="Lumpsum required for a future goal"
                description="Work backwards to the one-time amount needed today."
              >
                <div className="grid gap-4 md:grid-cols-3">
                  <InputField
                    label="Goal amount"
                    value={lumpsumGoalInputs.goalAmount}
                    onChange={(value) => setLumpsumGoalInputs((prev) => ({ ...prev, goalAmount: value }))}
                    placeholder="2500000"
                    indicator="amount"
                    range={{ min: 100000, max: 100000000, step: 100000, formatLabel: (value) => formatCompactCurrency(value) }}
                  />
                  <InputField
                    label="Time horizon (years)"
                    value={lumpsumGoalInputs.timeYears}
                    onChange={(value) => setLumpsumGoalInputs((prev) => ({ ...prev, timeYears: value }))}
                    placeholder="8"
                    indicator="years"
                    range={{ min: 1, max: 40, step: 1, formatLabel: (value) => `${value}y` }}
                  />
                  <InputField
                    label="Expected return"
                    value={lumpsumGoalInputs.expectedReturn}
                    onChange={(value) => setLumpsumGoalInputs((prev) => ({ ...prev, expectedReturn: value }))}
                    suffix="%"
                    placeholder="11"
                    indicator="percent"
                    range={{ min: 0, max: 20, step: 0.1, formatLabel: (value) => `${value}%` }}
                  />
                </div>
                <button
                  type="button"
                  className="rounded-full bg-[#2F5D7C] px-5 py-2 text-xs uppercase tracking-[0.2em] text-white"
                  onClick={handleLumpsumGoal}
                >
                  Calculate lumpsum
                </button>
                <ExampleNote text="Goal 25,00,000 in 8 years at 11% shows the one-time amount today." />
                {lumpsumGoalResult ? (
                  <div id="lumpsum-goal-result" className="space-y-4 scroll-mt-28">
                    <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
                      <ResultCard
                        title="Lumpsum required"
                        emoji="🎯"
                        value={`INR ${formatIndianCurrency(lumpsumGoalResult.corpus)}`}
                        message={lumpsumGoalMessage}
                      />
                      <div className="h-56 sm:h-64 rounded-2xl border border-[#EEF0E8] bg-white p-3">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={lumpsumGoalResult.chart} margin={chartMargin}>
                            <CartesianGrid stroke="#EEF2F7" vertical={false} />
                            <XAxis dataKey="year" {...xAxisDefaults} />
                            <YAxis {...axisDefaults} tickFormatter={(value) => formatCompactCurrency(value as number)} />
                            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "transparent" }} />
                            <Line type="monotone" dataKey="invested" stroke="#BDA06D" strokeWidth={2} name="Your Investment" />
                            <Line type="monotone" dataKey="corpus" stroke="#2F5D7C" strokeWidth={3} name="Total Corpus" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <NextStep
                      label="SIP future value"
                      note="Compare with a monthly SIP for the same horizon."
                      onSelect={() => scrollToId("sip-fv")}
                    />
                  </div>
                ) : null}
              </CalculatorCard>
            </div>
          </div>
        </section>

        <section id="building" className="scroll-mt-28 space-y-6 rounded-[32px] border border-[#DDE6F3] bg-white p-5 shadow-[0_22px_44px_-40px_rgba(31,41,55,0.25)] md:p-8">
          <ChapterHeader
            title="Building"
            headline="Let compounding breathe"
            reflection="Small, steady choices add up when you give them time."
          />
          <SubTabNav
            tabs={SECTION_TABS[1].subTabs}
            activeId={activeSubTab["building"]}
            onSelect={(id) => handleSubTabSelect("building", id)}
          />

          <div className="grid gap-8">
            <div id="sip-fv" className="scroll-mt-28">
              <CalculatorCard
                title="Future value of a SIP"
                description="Estimate the corpus your SIP builds over a chosen horizon."
              >
                <div className="grid gap-4 md:grid-cols-3">
                  <InputField
                    label="Monthly SIP"
                    value={sipFVInputs.sipAmount}
                    onChange={(value) => setSipFVInputs((prev) => ({ ...prev, sipAmount: value }))}
                    placeholder="15000"
                    indicator="amount"
                    range={{ min: 1000, max: 200000, step: 500, formatLabel: (value) => formatCompactCurrency(value) }}
                  />
                  <InputField
                    label="Time horizon (years)"
                    value={sipFVInputs.timeYears}
                    onChange={(value) => setSipFVInputs((prev) => ({ ...prev, timeYears: value }))}
                    placeholder="10"
                    indicator="years"
                    range={{ min: 1, max: 40, step: 1, formatLabel: (value) => `${value}y` }}
                  />
                  <InputField
                    label="Expected return"
                    value={sipFVInputs.expectedReturn}
                    onChange={(value) => setSipFVInputs((prev) => ({ ...prev, expectedReturn: value }))}
                    suffix="%"
                    placeholder="12"
                    indicator="percent"
                    range={{ min: 0, max: 20, step: 0.1, formatLabel: (value) => `${value}%` }}
                  />
                </div>
                <button
                  type="button"
                  className="rounded-full bg-[#2F5D7C] px-5 py-2 text-xs uppercase tracking-[0.2em] text-white"
                  onClick={handleSipFV}
                >
                  Calculate future value
                </button>
                <ExampleNote text="SIP 15,000 for 10 years at 12% shows the future corpus." />
                {sipFVResult ? (
                  <div id="sip-fv-result" className="space-y-4 scroll-mt-28">
                    <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
                      <ResultCard
                        title="Estimated future corpus"
                        emoji="🌿"
                        value={`INR ${formatIndianCurrency(sipFVResult.corpus)}`}
                        message={sipFVMessage}
                      />
                      <div className="h-56 sm:h-64 rounded-2xl border border-[#EEF0E8] bg-white p-3">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={sipFVResult.chart} margin={chartMargin}>
                            <CartesianGrid stroke="#EEF2F7" vertical={false} />
                            <XAxis dataKey="year" {...xAxisDefaults} />
                            <YAxis {...axisDefaults} tickFormatter={(value) => formatCompactCurrency(value as number)} />
                            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "transparent" }} />
                            <Line type="monotone" dataKey="invested" stroke="#BDA06D" strokeWidth={2} dot={false} name="Your Investment" />
                            <Line type="monotone" dataKey="corpus" stroke="#2F5D7C" strokeWidth={3} dot={false} name="Total Corpus" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <NextStep
                      label="Lumpsum future value"
                      note="See how a single investment compares for the same period."
                      onSelect={() => scrollToId("lumpsum-fv")}
                    />
                  </div>
                ) : null}
              </CalculatorCard>
            </div>

            <div id="lumpsum-fv" className="scroll-mt-28">
              <CalculatorCard
                title="Future value of a lumpsum"
                description="See how a one-time investment grows with time."
              >
                <div className="grid gap-4 md:grid-cols-3">
                  <InputField
                    label="Lumpsum amount"
                    value={lumpsumFVInputs.lumpsumAmount}
                    onChange={(value) => setLumpsumFVInputs((prev) => ({ ...prev, lumpsumAmount: value }))}
                    placeholder="500000"
                    indicator="amount"
                    range={{ min: 10000, max: 100000000, step: 10000, formatLabel: (value) => formatCompactCurrency(value) }}
                  />
                  <InputField
                    label="Time horizon (years)"
                    value={lumpsumFVInputs.timeYears}
                    onChange={(value) => setLumpsumFVInputs((prev) => ({ ...prev, timeYears: value }))}
                    placeholder="12"
                    indicator="years"
                    range={{ min: 1, max: 40, step: 1, formatLabel: (value) => `${value}y` }}
                  />
                  <InputField
                    label="Expected return"
                    value={lumpsumFVInputs.expectedReturn}
                    onChange={(value) => setLumpsumFVInputs((prev) => ({ ...prev, expectedReturn: value }))}
                    suffix="%"
                    placeholder="10"
                    indicator="percent"
                    range={{ min: 0, max: 20, step: 0.1, formatLabel: (value) => `${value}%` }}
                  />
                </div>
                <button
                  type="button"
                  className="rounded-full bg-[#2F5D7C] px-5 py-2 text-xs uppercase tracking-[0.2em] text-white"
                  onClick={handleLumpsumFV}
                >
                  Calculate future value
                </button>
                <ExampleNote text="Lumpsum 5,00,000 for 12 years at 10% shows how it grows." />
                {lumpsumFVResult ? (
                  <div id="lumpsum-fv-result" className="space-y-4 scroll-mt-28">
                    <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
                      <ResultCard
                        title="Estimated future corpus"
                        emoji="🌿"
                        value={`INR ${formatIndianCurrency(lumpsumFVResult.corpus)}`}
                        message={lumpsumFVMessage}
                      />
                      <div className="h-56 sm:h-64 rounded-2xl border border-[#EEF0E8] bg-white p-3">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={lumpsumFVResult.chart} margin={chartMargin}>
                            <CartesianGrid stroke="#EEF2F7" vertical={false} />
                            <XAxis dataKey="year" {...xAxisDefaults} />
                            <YAxis {...axisDefaults} tickFormatter={(value) => formatCompactCurrency(value as number)} />
                            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "transparent" }} />
                            <Line type="monotone" dataKey="invested" stroke="#BDA06D" strokeWidth={2} dot={false} name="Your Investment" />
                            <Line type="monotone" dataKey="corpus" stroke="#2F5D7C" strokeWidth={3} dot={false} name="Total Corpus" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <NextStep
                      label="SIP + one-time"
                      note="Blend monthly and upfront investments for balance."
                      onSelect={() => scrollToId("sip-plus-lumpsum")}
                    />
                  </div>
                ) : null}
              </CalculatorCard>
            </div>

            <div id="sip-plus-lumpsum" className="scroll-mt-28">
              <CalculatorCard
                title="Future value of SIP + one-time"
                description="Combine a SIP with a lumpsum to see the full outcome."
              >
                <div className="grid gap-4 md:grid-cols-4">
                  <InputField
                    label="Monthly SIP"
                    value={sipPlusLumpsumInputs.monthlySIP}
                    onChange={(value) => setSipPlusLumpsumInputs((prev) => ({ ...prev, monthlySIP: value }))}
                    placeholder="15000"
                    indicator="amount"
                    range={{ min: 1000, max: 200000, step: 500, formatLabel: (value) => formatCompactCurrency(value) }}
                  />
                  <InputField
                    label="One-time investment"
                    value={sipPlusLumpsumInputs.lumpsumAmount}
                    onChange={(value) => setSipPlusLumpsumInputs((prev) => ({ ...prev, lumpsumAmount: value }))}
                    placeholder="300000"
                    indicator="amount"
                    range={{ min: 10000, max: 100000000, step: 10000, formatLabel: (value) => formatCompactCurrency(value) }}
                  />
                  <InputField
                    label="Time horizon (years)"
                    value={sipPlusLumpsumInputs.timeYears}
                    onChange={(value) => setSipPlusLumpsumInputs((prev) => ({ ...prev, timeYears: value }))}
                    placeholder="12"
                    indicator="years"
                    range={{ min: 1, max: 40, step: 1, formatLabel: (value) => `${value}y` }}
                  />
                  <InputField
                    label="Expected return"
                    value={sipPlusLumpsumInputs.expectedReturn}
                    onChange={(value) => setSipPlusLumpsumInputs((prev) => ({ ...prev, expectedReturn: value }))}
                    suffix="%"
                    placeholder="12"
                    indicator="percent"
                    range={{ min: 0, max: 20, step: 0.1, formatLabel: (value) => `${value}%` }}
                  />
                </div>
                <button
                  type="button"
                  className="rounded-full bg-[#2F5D7C] px-5 py-2 text-xs uppercase tracking-[0.2em] text-white"
                  onClick={handleSipPlusLumpsum}
                >
                  Calculate combined corpus
                </button>
                <ExampleNote text="SIP 15,000 plus 3,00,000 upfront for 12 years at 12% shows the combined corpus." />
                {sipPlusLumpsumResult ? (
                  <div id="sip-plus-lumpsum-result" className="space-y-4 scroll-mt-28">
                    <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
                      <ResultCard
                        title="Estimated future corpus"
                        emoji="🌿"
                        value={`INR ${formatIndianCurrency(sipPlusLumpsumResult.corpus)}`}
                        message={sipPlusLumpsumMessage}
                      />
                      <div className="h-56 sm:h-64 rounded-2xl border border-[#EEF0E8] bg-white p-3">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={sipPlusLumpsumResult.chart} margin={chartMargin}>
                            <CartesianGrid stroke="#EEF2F7" vertical={false} />
                            <XAxis dataKey="year" {...xAxisDefaults} />
                            <YAxis {...axisDefaults} tickFormatter={(value) => formatCompactCurrency(value as number)} />
                            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "transparent" }} />
                            <Line type="monotone" dataKey="invested" stroke="#BDA06D" strokeWidth={2} dot={false} name="Total Investment" />
                            <Line type="monotone" dataKey="corpus" stroke="#2F5D7C" strokeWidth={3} dot={false} name="Total Corpus" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <NextStep
                      label="Limited SIP future value"
                      note="See how the corpus grows if you invest only for part of the journey."
                      onSelect={() => scrollToId("limited-sip-fv")}
                    />
                  </div>
                ) : null}
              </CalculatorCard>
            </div>
          </div>
        </section>

        <section id="optimising" className="scroll-mt-28 space-y-6 rounded-[32px] border border-[#DDE6F3] bg-white p-5 shadow-[0_22px_44px_-40px_rgba(31,41,55,0.25)] md:p-8">
          <ChapterHeader
            title="Optimising"
            headline="Refine the mix"
            reflection="Adjust the levers without adding complexity to your plan."
          />
          <SubTabNav
            tabs={SECTION_TABS[2].subTabs}
            activeId={activeSubTab["optimising"]}
            onSelect={(id) => handleSubTabSelect("optimising", id)}
          />

          <div className="grid gap-8">
            <div id="limited-sip-fv" className="scroll-mt-28">
              <CalculatorCard
                title="Future value of limited-period SIP"
                description="Invest for a limited period and allow the corpus to grow further."
              >
                <div className="grid gap-4 md:grid-cols-4">
                  <InputField
                    label="Monthly SIP"
                    value={limitedSipFVInputs.monthlySIP}
                    onChange={(value) => setLimitedSipFVInputs((prev) => ({ ...prev, monthlySIP: value }))}
                    placeholder="20000"
                    indicator="amount"
                    range={{ min: 1000, max: 200000, step: 500, formatLabel: (value) => formatCompactCurrency(value) }}
                  />
                  <InputField
                    label="SIP period (years)"
                    value={limitedSipFVInputs.sipPeriodYears}
                    onChange={(value) => setLimitedSipFVInputs((prev) => ({ ...prev, sipPeriodYears: value }))}
                    placeholder="7"
                    indicator="years"
                    range={{ min: 1, max: 30, step: 1, formatLabel: (value) => `${value}y` }}
                  />
                  <InputField
                    label="Total growth period (years)"
                    value={limitedSipFVInputs.totalGrowthYears}
                    onChange={(value) => setLimitedSipFVInputs((prev) => ({ ...prev, totalGrowthYears: value }))}
                    placeholder="15"
                    indicator="years"
                    range={{ min: 1, max: 40, step: 1, formatLabel: (value) => `${value}y` }}
                  />
                  <InputField
                    label="Expected return"
                    value={limitedSipFVInputs.expectedReturn}
                    onChange={(value) => setLimitedSipFVInputs((prev) => ({ ...prev, expectedReturn: value }))}
                    suffix="%"
                    placeholder="12"
                    indicator="percent"
                    range={{ min: 0, max: 20, step: 0.1, formatLabel: (value) => `${value}%` }}
                  />
                </div>
                <button
                  type="button"
                  className="rounded-full bg-[#2F5D7C] px-5 py-2 text-xs uppercase tracking-[0.2em] text-white"
                  onClick={handleLimitedSipFV}
                >
                  Calculate future value
                </button>
                <ExampleNote text="SIP 20,000 for 7 years, total growth 15 years at 12% shows the final corpus." />
                {limitedSipFVResult ? (
                  <div id="limited-sip-fv-result" className="space-y-4 scroll-mt-28">
                    <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
                      <ResultCard
                        title="Estimated future corpus"
                        emoji="🌿"
                        value={`INR ${formatIndianCurrency(limitedSipFVResult.corpus)}`}
                        message={limitedSipFVMessage}
                      />
                      <div className="h-56 sm:h-64 rounded-2xl border border-[#EEF0E8] bg-white p-3">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={limitedSipFVResult.chart} margin={chartMargin}>
                            <CartesianGrid stroke="#EEF2F7" vertical={false} />
                            <XAxis dataKey="year" {...xAxisDefaults} />
                            <YAxis {...axisDefaults} tickFormatter={(value) => formatCompactCurrency(value as number)} />
                            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "transparent" }} />
                            <Line type="monotone" dataKey="invested" stroke="#BDA06D" strokeWidth={2} name="Your Investment" />
                            <Line type="monotone" dataKey="corpus" stroke="#2F5D7C" strokeWidth={3} name="Total Corpus" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <NextStep
                      label="Limited SIP goal"
                      note="Use a target amount with a shorter SIP window."
                      onSelect={() => scrollToId("limited-sip-goal")}
                    />
                  </div>
                ) : null}
              </CalculatorCard>
            </div>

            <div id="limited-sip-goal" className="scroll-mt-28">
              <CalculatorCard
                title="Limited SIP required for goal"
                description="Plan a shorter SIP period and let the investment grow further."
              >
                <div className="grid gap-4 md:grid-cols-4">
                  <InputField
                    label="Goal amount"
                    value={limitedSipGoalInputs.goalAmount}
                    onChange={(value) => setLimitedSipGoalInputs((prev) => ({ ...prev, goalAmount: value }))}
                    placeholder="3500000"
                    indicator="amount"
                    range={{ min: 100000, max: 100000000, step: 100000, formatLabel: (value) => formatCompactCurrency(value) }}
                  />
                  <InputField
                    label="SIP period (years)"
                    value={limitedSipGoalInputs.sipPeriodYears}
                    onChange={(value) => setLimitedSipGoalInputs((prev) => ({ ...prev, sipPeriodYears: value }))}
                    placeholder="6"
                    indicator="years"
                    range={{ min: 1, max: 30, step: 1, formatLabel: (value) => `${value}y` }}
                  />
                  <InputField
                    label="Total growth period (years)"
                    value={limitedSipGoalInputs.totalGrowthYears}
                    onChange={(value) => setLimitedSipGoalInputs((prev) => ({ ...prev, totalGrowthYears: value }))}
                    placeholder="15"
                    indicator="years"
                    range={{ min: 1, max: 40, step: 1, formatLabel: (value) => `${value}y` }}
                  />
                  <InputField
                    label="Expected return"
                    value={limitedSipGoalInputs.expectedReturn}
                    onChange={(value) => setLimitedSipGoalInputs((prev) => ({ ...prev, expectedReturn: value }))}
                    suffix="%"
                    placeholder="12"
                    indicator="percent"
                    range={{ min: 0, max: 20, step: 0.1, formatLabel: (value) => `${value}%` }}
                  />
                </div>
                <button
                  type="button"
                  className="rounded-full bg-[#2F5D7C] px-5 py-2 text-xs uppercase tracking-[0.2em] text-white"
                  onClick={handleLimitedSipGoal}
                >
                  Calculate SIP
                </button>
                <ExampleNote text="Goal 35,00,000 with SIP for 6 years and total growth 15 years at 12%." />
                {limitedSipGoalResult ? (
                  <div id="limited-sip-goal-result" className="space-y-4 scroll-mt-28">
                    <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
                      <ResultCard
                        title="Monthly SIP required"
                        emoji="🎯"
                        value={`INR ${formatIndianCurrency(limitedSipGoalResult.sip)}`}
                        message={limitedSipGoalMessage}
                      />
                      <div className="h-56 sm:h-64 rounded-2xl border border-[#EEF0E8] bg-white p-3">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={limitedSipGoalResult.chart} margin={chartMargin}>
                            <CartesianGrid stroke="#EEF2F7" vertical={false} />
                            <XAxis dataKey="year" {...xAxisDefaults} />
                            <YAxis {...axisDefaults} tickFormatter={(value) => formatCompactCurrency(value as number)} />
                            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "transparent" }} />
                            <Line type="monotone" dataKey="invested" stroke="#BDA06D" strokeWidth={2} name="Your Investment" />
                            <Line type="monotone" dataKey="corpus" stroke="#2F5D7C" strokeWidth={3} name="Total Corpus" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <NextStep
                      label="One-time for SIP"
                      note="If you already have a SIP, check the top-up required."
                      onSelect={() => scrollToId("one-time-if-sip")}
                    />
                  </div>
                ) : null}
              </CalculatorCard>
            </div>

            <div id="one-time-if-sip" className="scroll-mt-28">
              <CalculatorCard
                title="One-time required if SIP is known"
                description="See the extra lumpsum required alongside your SIP plan."
              >
                <div className="grid gap-4 md:grid-cols-4">
                  <InputField
                    label="Goal amount"
                    value={oneTimeIfSipInputs.goalAmount}
                    onChange={(value) => setOneTimeIfSipInputs((prev) => ({ ...prev, goalAmount: value }))}
                    placeholder="2000000"
                    indicator="amount"
                    range={{ min: 100000, max: 100000000, step: 100000, formatLabel: (value) => formatCompactCurrency(value) }}
                  />
                  <InputField
                    label="Monthly SIP"
                    value={oneTimeIfSipInputs.monthlySIP}
                    onChange={(value) => setOneTimeIfSipInputs((prev) => ({ ...prev, monthlySIP: value }))}
                    placeholder="12000"
                    indicator="amount"
                    range={{ min: 1000, max: 200000, step: 500, formatLabel: (value) => formatCompactCurrency(value) }}
                  />
                  <InputField
                    label="Time horizon (years)"
                    value={oneTimeIfSipInputs.timeYears}
                    onChange={(value) => setOneTimeIfSipInputs((prev) => ({ ...prev, timeYears: value }))}
                    placeholder="10"
                    indicator="years"
                    range={{ min: 1, max: 40, step: 1, formatLabel: (value) => `${value}y` }}
                  />
                  <InputField
                    label="Expected return"
                    value={oneTimeIfSipInputs.expectedReturn}
                    onChange={(value) => setOneTimeIfSipInputs((prev) => ({ ...prev, expectedReturn: value }))}
                    suffix="%"
                    placeholder="11"
                    indicator="percent"
                    range={{ min: 0, max: 20, step: 0.1, formatLabel: (value) => `${value}%` }}
                  />
                </div>
                <button
                  type="button"
                  className="rounded-full bg-[#2F5D7C] px-5 py-2 text-xs uppercase tracking-[0.2em] text-white"
                  onClick={handleOneTimeIfSip}
                >
                  Calculate one-time
                </button>
                <ExampleNote text="Goal 20,00,000 with SIP 12,000 for 10 years at 11% shows extra lumpsum." />
                {oneTimeIfSipResult ? (
                  <div id="one-time-if-sip-result" className="space-y-4 scroll-mt-28">
                    <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
                      <ResultCard
                        title="One-time investment"
                        emoji="💠"
                        value={`INR ${formatIndianCurrency(oneTimeIfSipResult.oneTime)}`}
                        message={oneTimeIfSipMessage}
                      />
                      <div className="h-56 sm:h-64 rounded-2xl border border-[#EEF0E8] bg-white p-3">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={oneTimeIfSipResult.chart} margin={chartMargin}>
                            <CartesianGrid stroke="#EEF2F7" vertical={false} />
                            <XAxis dataKey="year" {...xAxisDefaults} />
                            <YAxis {...axisDefaults} tickFormatter={(value) => formatCompactCurrency(value as number)} />
                            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "transparent" }} />
                            <Line type="monotone" dataKey="sip" stroke="#BDA06D" strokeWidth={2} name="SIP Invested" />
                            <Line type="monotone" dataKey="lumpsum" stroke="#E2C77A" strokeWidth={2} name="Lumpsum Invested" />
                            <Line type="monotone" dataKey="corpus" stroke="#2F5D7C" strokeWidth={3} name="Total Corpus" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <NextStep
                      label="SIP for one-time"
                      note="Flip the problem to see the SIP required for your upfront amount."
                      onSelect={() => scrollToId("sip-if-one-time")}
                    />
                  </div>
                ) : null}
              </CalculatorCard>
            </div>

            <div id="sip-if-one-time" className="scroll-mt-28">
              <CalculatorCard
                title="SIP required if one-time is known"
                description="Use an initial investment and see the SIP needed for the remaining goal."
              >
                <div className="grid gap-4 md:grid-cols-4">
                  <InputField
                    label="Goal amount"
                    value={sipIfOneTimeInputs.goalAmount}
                    onChange={(value) => setSipIfOneTimeInputs((prev) => ({ ...prev, goalAmount: value }))}
                    placeholder="2000000"
                    indicator="amount"
                    range={{ min: 100000, max: 100000000, step: 100000, formatLabel: (value) => formatCompactCurrency(value) }}
                  />
                  <InputField
                    label="One-time investment"
                    value={sipIfOneTimeInputs.lumpsumAmount}
                    onChange={(value) => setSipIfOneTimeInputs((prev) => ({ ...prev, lumpsumAmount: value }))}
                    placeholder="400000"
                    indicator="amount"
                    range={{ min: 10000, max: 100000000, step: 10000, formatLabel: (value) => formatCompactCurrency(value) }}
                  />
                  <InputField
                    label="Time horizon (years)"
                    value={sipIfOneTimeInputs.timeYears}
                    onChange={(value) => setSipIfOneTimeInputs((prev) => ({ ...prev, timeYears: value }))}
                    placeholder="10"
                    indicator="years"
                    range={{ min: 1, max: 40, step: 1, formatLabel: (value) => `${value}y` }}
                  />
                  <InputField
                    label="Expected return"
                    value={sipIfOneTimeInputs.expectedReturn}
                    onChange={(value) => setSipIfOneTimeInputs((prev) => ({ ...prev, expectedReturn: value }))}
                    suffix="%"
                    placeholder="11"
                    indicator="percent"
                    range={{ min: 0, max: 20, step: 0.1, formatLabel: (value) => `${value}%` }}
                  />
                </div>
                <button
                  type="button"
                  className="rounded-full bg-[#2F5D7C] px-5 py-2 text-xs uppercase tracking-[0.2em] text-white"
                  onClick={handleSipIfOneTime}
                >
                  Calculate SIP
                </button>
                <ExampleNote text="Goal 20,00,000 with 4,00,000 upfront over 10 years at 11% shows the SIP needed." />
                {sipIfOneTimeResult ? (
                  <div id="sip-if-one-time-result" className="space-y-4 scroll-mt-28">
                    <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
                      <ResultCard
                        title="Monthly SIP required"
                        emoji="🎯"
                        value={`INR ${formatIndianCurrency(sipIfOneTimeResult.sip)}`}
                        message={sipIfOneTimeMessage}
                      />
                      <div className="h-56 sm:h-64 rounded-2xl border border-[#EEF0E8] bg-white p-3">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={sipIfOneTimeResult.chart} margin={chartMargin}>
                            <CartesianGrid stroke="#EEF2F7" vertical={false} />
                            <XAxis dataKey="year" {...xAxisDefaults} />
                            <YAxis {...axisDefaults} tickFormatter={(value) => formatCompactCurrency(value as number)} />
                            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "transparent" }} />
                            <Line type="monotone" dataKey="lumpsum" stroke="#E2C77A" strokeWidth={2} name="Lumpsum Invested" />
                            <Line type="monotone" dataKey="sip" stroke="#BDA06D" strokeWidth={2} name="SIP Invested" />
                            <Line type="monotone" dataKey="corpus" stroke="#2F5D7C" strokeWidth={3} name="Total Corpus" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <NextStep
                      label="SWP from corpus"
                      note="Shift into withdrawals and see what this corpus could sustain."
                      onSelect={() => scrollToId("swp-corpus")}
                    />
                  </div>
                ) : null}
              </CalculatorCard>
            </div>
          </div>
        </section>

        <section id="living-off-money" className="scroll-mt-28 space-y-6 rounded-[32px] border border-[#DDE6F3] bg-white p-5 shadow-[0_22px_44px_-40px_rgba(31,41,55,0.25)] md:p-8">
          <ChapterHeader
            title="Living Off Money"
            headline="Make the drawdown steady"
            reflection="When growth turns to income, steadiness matters more than speed."
          />
          <SubTabNav
            tabs={SECTION_TABS[3].subTabs}
            activeId={activeSubTab["living-off-money"]}
            onSelect={(id) => handleSubTabSelect("living-off-money", id)}
          />

          <div className="grid gap-8">
            <div id="swp-corpus" className="scroll-mt-28">
              <CalculatorCard
                title="SWP from a retirement corpus"
                description="Estimate the monthly withdrawal a corpus can sustain."
              >
                <div className="grid gap-4 md:grid-cols-3">
                  <InputField
                    label="Retirement corpus"
                    value={swpInputs.corpusAmount}
                    onChange={(value) => setSwpInputs((prev) => ({ ...prev, corpusAmount: value }))}
                    placeholder="5000000"
                    indicator="amount"
                    range={{ min: 100000, max: 200000000, step: 100000, formatLabel: (value) => formatCompactCurrency(value) }}
                  />
                  <InputField
                    label="Withdrawal period (years)"
                    value={swpInputs.withdrawalYears}
                    onChange={(value) => setSwpInputs((prev) => ({ ...prev, withdrawalYears: value }))}
                    placeholder="25"
                    indicator="years"
                    range={{ min: 1, max: 40, step: 1, formatLabel: (value) => `${value}y` }}
                  />
                  <InputField
                    label="Expected return"
                    value={swpInputs.expectedReturn}
                    onChange={(value) => setSwpInputs((prev) => ({ ...prev, expectedReturn: value }))}
                    suffix="%"
                    placeholder="8"
                    indicator="percent"
                    range={{ min: 0, max: 20, step: 0.1, formatLabel: (value) => `${value}%` }}
                  />
                </div>
                <button
                  type="button"
                  className="rounded-full bg-[#2F5D7C] px-5 py-2 text-xs uppercase tracking-[0.2em] text-white"
                  onClick={handleSwp}
                >
                  Calculate SWP
                </button>
                <ExampleNote text="Corpus 50,00,000 with a 25-year drawdown at 8% shows the monthly SWP." />
                {swpResult ? (
                  <div id="swp-result" className="space-y-4 scroll-mt-28">
                    <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
                      <ResultCard
                        title="Monthly SWP"
                        emoji="💸"
                        value={`INR ${formatIndianCurrency(swpResult.monthly)}`}
                        message={swpMessage}
                      />
                      <div className="h-56 sm:h-64 rounded-2xl border border-[#EEF0E8] bg-white p-3">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={swpResult.chart} margin={chartMargin}>
                            <CartesianGrid stroke="#EEF2F7" vertical={false} />
                            <XAxis dataKey="year" {...xAxisDefaults} />
                            <YAxis {...axisDefaults} tickFormatter={(value) => formatCompactCurrency(value as number)} />
                            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "transparent" }} />
                            <Line type="monotone" dataKey="remaining" stroke="#2F5D7C" strokeWidth={3} name="Remaining Corpus" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <NextStep
                      label="Corpus for SWP"
                      note="Start from a target income and work backwards."
                      onSelect={() => scrollToId("corpus-for-swp")}
                    />
                  </div>
                ) : null}
              </CalculatorCard>
            </div>

            <div id="corpus-for-swp" className="scroll-mt-28">
              <CalculatorCard
                title="Corpus required for SWP"
                description="Estimate how much corpus you need to support a monthly withdrawal."
              >
                <div className="grid gap-4 md:grid-cols-3">
                  <InputField
                    label="Desired monthly income"
                    value={swpCorpusInputs.monthlySWP}
                    onChange={(value) => setSwpCorpusInputs((prev) => ({ ...prev, monthlySWP: value }))}
                    placeholder="40000"
                    indicator="amount"
                    range={{ min: 5000, max: 500000, step: 1000, formatLabel: (value) => formatCompactCurrency(value) }}
                  />
                  <InputField
                    label="Withdrawal period (years)"
                    value={swpCorpusInputs.withdrawalYears}
                    onChange={(value) => setSwpCorpusInputs((prev) => ({ ...prev, withdrawalYears: value }))}
                    placeholder="25"
                    indicator="years"
                    range={{ min: 1, max: 40, step: 1, formatLabel: (value) => `${value}y` }}
                  />
                  <InputField
                    label="Expected return"
                    value={swpCorpusInputs.expectedReturn}
                    onChange={(value) => setSwpCorpusInputs((prev) => ({ ...prev, expectedReturn: value }))}
                    suffix="%"
                    placeholder="8"
                    indicator="percent"
                    range={{ min: 0, max: 20, step: 0.1, formatLabel: (value) => `${value}%` }}
                  />
                </div>
                <button
                  type="button"
                  className="rounded-full bg-[#2F5D7C] px-5 py-2 text-xs uppercase tracking-[0.2em] text-white"
                  onClick={handleSwpCorpus}
                >
                  Calculate corpus
                </button>
                <ExampleNote text="Income 40,000 per month for 25 years at 8% shows the corpus needed." />
                {swpCorpusResult ? (
                  <div id="swp-corpus-result" className="space-y-4 scroll-mt-28">
                    <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
                      <ResultCard
                        title="Required corpus"
                        emoji="🏛️"
                        value={`INR ${formatIndianCurrency(swpCorpusResult.corpus)}`}
                        message={swpCorpusMessage}
                      />
                      <div className="h-56 sm:h-64 rounded-2xl border border-[#EEF0E8] bg-white p-3">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={swpCorpusResult.chart} margin={chartMargin}>
                            <CartesianGrid stroke="#EEF2F7" vertical={false} />
                            <XAxis dataKey="year" {...xAxisDefaults} />
                            <YAxis {...axisDefaults} tickFormatter={(value) => formatCompactCurrency(value as number)} />
                            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "transparent" }} />
                            <Line type="monotone" dataKey="remaining" stroke="#BDA06D" strokeWidth={2} name="Corpus Value" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <NextStep
                      label="Inflation-adjusted SWP"
                      note="Add inflation to see how withdrawals change over time."
                      onSelect={() => scrollToId("inflation-swp")}
                    />
                  </div>
                ) : null}
              </CalculatorCard>
            </div>

            <div id="inflation-swp" className="scroll-mt-28">
              <CalculatorCard
                title="Inflation-adjusted SWP"
                description="Find a starting withdrawal that adjusts for inflation annually."
              >
                <div className="grid gap-4 md:grid-cols-4">
                  <InputField
                    label="Retirement corpus"
                    value={inflationSwpInputs.corpusAmount}
                    onChange={(value) => setInflationSwpInputs((prev) => ({ ...prev, corpusAmount: value }))}
                    placeholder="6000000"
                    indicator="amount"
                    range={{ min: 100000, max: 200000000, step: 100000, formatLabel: (value) => formatCompactCurrency(value) }}
                  />
                  <InputField
                    label="Withdrawal period (years)"
                    value={inflationSwpInputs.withdrawalYears}
                    onChange={(value) => setInflationSwpInputs((prev) => ({ ...prev, withdrawalYears: value }))}
                    placeholder="25"
                    indicator="years"
                    range={{ min: 1, max: 40, step: 1, formatLabel: (value) => `${value}y` }}
                  />
                  <InputField
                    label="Expected return"
                    value={inflationSwpInputs.expectedReturn}
                    onChange={(value) => setInflationSwpInputs((prev) => ({ ...prev, expectedReturn: value }))}
                    suffix="%"
                    placeholder="8"
                    indicator="percent"
                    range={{ min: 0, max: 20, step: 0.1, formatLabel: (value) => `${value}%` }}
                  />
                  <InputField
                    label="Inflation rate"
                    value={inflationSwpInputs.inflationRate}
                    onChange={(value) => setInflationSwpInputs((prev) => ({ ...prev, inflationRate: value }))}
                    suffix="%"
                    placeholder="6"
                    indicator="percent"
                    range={{ min: 0, max: 12, step: 0.1, formatLabel: (value) => `${value}%` }}
                  />
                </div>
                <button
                  type="button"
                  className="rounded-full bg-[#2F5D7C] px-5 py-2 text-xs uppercase tracking-[0.2em] text-white"
                  onClick={handleInflationSwp}
                >
                  Calculate inflation-adjusted SWP
                </button>
                <ExampleNote text="Corpus 60,00,000 for 25 years at 8% with 6% inflation shows the starting SWP." />
                {inflationSwpResult ? (
                  <div id="inflation-swp-result" className="space-y-4 scroll-mt-28">
                    <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
                      <ResultCard
                        title="Starting monthly SWP"
                        emoji="💧"
                        value={`INR ${formatIndianCurrency(inflationSwpResult.monthly)}`}
                        message={inflationSwpMessage}
                      />
                      <div className="h-56 sm:h-64 rounded-2xl border border-[#EEF0E8] bg-white p-3">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={inflationSwpResult.chart} margin={chartMargin}>
                            <CartesianGrid stroke="#EEF2F7" vertical={false} />
                            <XAxis dataKey="year" {...xAxisDefaults} />
                            <YAxis {...axisDefaults} tickFormatter={(value) => formatCompactCurrency(value as number)} />
                            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "transparent" }} />
                            <Line type="monotone" dataKey="remaining" stroke="#B35A5A" strokeWidth={2} name="Remaining Corpus" />
                            <Line type="monotone" dataKey="withdrawal" stroke="#2F5D7C" strokeWidth={2} name="Annual Withdrawal" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <NextStep
                      label="Retirement analysis"
                      note="Step back and check overall readiness for the long run."
                      onSelect={() => scrollToId("retirement-analysis")}
                    />
                  </div>
                ) : null}
              </CalculatorCard>
            </div>
          </div>
        </section>

        <section id="readiness" className="scroll-mt-28 space-y-6 rounded-[32px] border border-[#DDE6F3] bg-white p-5 shadow-[0_22px_44px_-40px_rgba(31,41,55,0.25)] md:p-8">
          <ChapterHeader
            title="Readiness"
            headline="Check the runway"
            reflection="Bring it together and see if the plan supports the life you want."
          />
          <SubTabNav
            tabs={SECTION_TABS[4].subTabs}
            activeId={activeSubTab["readiness"]}
            onSelect={(id) => handleSubTabSelect("readiness", id)}
          />

          <div className="grid gap-8">
            <div id="retirement-analysis" className="scroll-mt-28">
              <CalculatorCard
                title="Retirement shortfall or surplus"
                description="Compare projected corpus versus the amount needed to fund retirement income."
              >
                <div className="grid gap-4 md:grid-cols-4">
                  <InputField
                    label="Current corpus"
                    value={retirementInputs.currentCorpus}
                    onChange={(value) => setRetirementInputs((prev) => ({ ...prev, currentCorpus: value }))}
                    placeholder="1200000"
                    indicator="amount"
                    range={{ min: 100000, max: 200000000, step: 100000, formatLabel: (value) => formatCompactCurrency(value) }}
                  />
                  <InputField
                    label="Monthly SIP"
                    value={retirementInputs.monthlySIP}
                    onChange={(value) => setRetirementInputs((prev) => ({ ...prev, monthlySIP: value }))}
                    placeholder="20000"
                    indicator="amount"
                    range={{ min: 1000, max: 200000, step: 500, formatLabel: (value) => formatCompactCurrency(value) }}
                  />
                  <InputField
                    label="Years to retirement"
                    value={retirementInputs.yearsToRetirement}
                    onChange={(value) => setRetirementInputs((prev) => ({ ...prev, yearsToRetirement: value }))}
                    placeholder="20"
                    indicator="years"
                    range={{ min: 1, max: 40, step: 1, formatLabel: (value) => `${value}y` }}
                  />
                  <InputField
                    label="Desired monthly income"
                    value={retirementInputs.desiredMonthlyIncome}
                    onChange={(value) => setRetirementInputs((prev) => ({ ...prev, desiredMonthlyIncome: value }))}
                    placeholder="75000"
                    indicator="amount"
                    range={{ min: 5000, max: 1000000, step: 5000, formatLabel: (value) => formatCompactCurrency(value) }}
                  />
                  <InputField
                    label="Retirement duration (years)"
                    value={retirementInputs.retirementDuration}
                    onChange={(value) => setRetirementInputs((prev) => ({ ...prev, retirementDuration: value }))}
                    placeholder="25"
                    indicator="years"
                    range={{ min: 1, max: 40, step: 1, formatLabel: (value) => `${value}y` }}
                  />
                  <InputField
                    label="Expected return (pre-retirement)"
                    value={retirementInputs.expectedReturnPre}
                    onChange={(value) => setRetirementInputs((prev) => ({ ...prev, expectedReturnPre: value }))}
                    suffix="%"
                    placeholder="11"
                    indicator="percent"
                    range={{ min: 0, max: 20, step: 0.1, formatLabel: (value) => `${value}%` }}
                  />
                  <InputField
                    label="Expected return (post-retirement)"
                    value={retirementInputs.expectedReturnPost}
                    onChange={(value) => setRetirementInputs((prev) => ({ ...prev, expectedReturnPost: value }))}
                    suffix="%"
                    placeholder="7"
                    indicator="percent"
                    range={{ min: 0, max: 20, step: 0.1, formatLabel: (value) => `${value}%` }}
                  />
                  <InputField
                    label="Inflation rate"
                    value={retirementInputs.inflationRate}
                    onChange={(value) => setRetirementInputs((prev) => ({ ...prev, inflationRate: value }))}
                    suffix="%"
                    placeholder="6"
                    indicator="percent"
                    range={{ min: 0, max: 12, step: 0.1, formatLabel: (value) => `${value}%` }}
                  />
                  <div className="md:col-span-4 space-y-3 rounded-2xl border border-[#EEF0E8] bg-[#FBFCFA] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-[#6B7C70]">Planned lump sum withdrawals (years from today)</p>
                        <p className="mt-1 text-xs font-serif text-[#6B7C70]">
                          Add withdrawals as years from today. For example, 15 means 15 years from now.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addRetirementWithdrawal}
                        className="rounded-full border border-[#D5D9CF] bg-white px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#2F5D7C]"
                      >
                        Add withdrawal
                      </button>
                    </div>
                    <div className="grid gap-2">
                      <div className="hidden grid-cols-[1.2fr_0.8fr_auto] gap-3 text-[10px] uppercase tracking-[0.2em] text-[#8A958C] md:grid">
                        <span>Amount</span>
                        <span>Year</span>
                        <span> </span>
                      </div>
                      {retirementWithdrawals.map((row) => (
                        <div key={row.id} className="grid gap-3 md:grid-cols-[1.2fr_0.8fr_auto]">
                          <div className="space-y-1">
                            <input
                              inputMode="decimal"
                              value={row.amount}
                              onChange={(event) => updateRetirementWithdrawal(row.id, "amount", event.target.value)}
                              placeholder="500000"
                              className="w-full rounded-2xl border border-[#E6E8E1] px-4 py-3 text-sm text-[#1F2937] placeholder:text-[#9AA89A]"
                            />
                            <p className="text-[11px] text-[#7A867F]">{formatIndianUnitLabel(parseNumber(row.amount))}</p>
                          </div>
                          <input
                            inputMode="numeric"
                            value={row.year}
                            onChange={(event) => updateRetirementWithdrawal(row.id, "year", event.target.value)}
                            placeholder="10"
                            className="w-full rounded-2xl border border-[#E6E8E1] px-4 py-3 text-sm text-[#1F2937] placeholder:text-[#9AA89A]"
                          />
                          <button
                            type="button"
                            onClick={() => removeRetirementWithdrawal(row.id)}
                            className="rounded-full border border-[#E6E8E1] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[#8A958C]"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs font-serif text-[#6B7C70]">
                      Current plan: {formatWithdrawalSummary(retirementWithdrawals)}.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded-full bg-[#2F5D7C] px-5 py-2 text-xs uppercase tracking-[0.2em] text-white"
                  onClick={handleRetirement}
                >
                  Run retirement analysis
                </button>
                <ExampleNote text="Corpus 12,00,000, SIP 20,000 for 20 years, income 75,000 for 25 years at 11%/7% with 6% inflation. Add lump sums as years from today." />
                <InfoToggle label="Assumptions">
                  SIPs are modeled at the beginning of each month. Withdrawals are modeled at the end of each month.
                  All retirement calculations are inflation-adjusted to reflect real purchasing power.
                </InfoToggle>
                {retirementResult ? (
                  <div id="retirement-result" className="space-y-6 scroll-mt-28">
                    <p className="text-sm font-serif text-[#2F5D7C]">
                      {(() => {
                        const cashflow = retirementResult.cashflow;
                        if (cashflow.length === 0) return "";
                        let peak = cashflow[0];
                        for (const point of cashflow) {
                          if (point.corpus > peak.corpus) peak = point;
                        }
                        const exhaustion = cashflow.find((point) => point.corpus <= 0);
                        if (!exhaustion) {
                          return `Your corpus peaks in year ${peak.year} and does not exhaust within the plan horizon.`;
                        }
                        return `Your corpus peaks in year ${peak.year} and exhausts around year ${exhaustion.year}.`;
                      })()}
                    </p>
                    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
                      <div className="space-y-4">
                        <ResultCard
                          title={retirementResult.shortfall >= 0 ? "Retirement surplus" : "Retirement shortfall"}
                          value={`INR ${formatIndianCurrency(Math.abs(retirementResult.shortfall))}`}
                          message={retirementMessage}
                          tone={retirementResult.shortfall >= 0 ? "positive" : "negative"}
                          emoji={retirementResult.shortfall >= 0 ? "✅" : "⚠️"}
                        />
                      </div>
                      <div className="rounded-2xl border border-[#EEF0E8] bg-white p-3">
                        <div className="text-xs uppercase tracking-[0.2em] text-[#6B7C70]">Lifetime cashflow</div>
                        <div className="mt-2">
                          <InfoToggle label="How to read">
                            Timeline runs from today through retirement. Blue line shows money left after withdrawals, red line
                            shows money withdrawn that year. Vertical markers show retirement start and goal withdrawals.
                          </InfoToggle>
                        </div>
                        <div className="mt-3 h-[240px] sm:h-[280px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={retirementResult.cashflow} margin={chartMargin}>
                              <CartesianGrid stroke="#EEF2F7" vertical={false} />
                              <XAxis dataKey="year" {...xAxisDefaults} />
                              <YAxis {...axisDefaults} tickFormatter={(value) => formatCompactCurrency(value as number)} />
                              <Tooltip content={<RetirementTooltip />} cursor={{ stroke: "transparent" }} />
                              <ReferenceLine
                                x={parseNumber(retirementInputs.yearsToRetirement)}
                                stroke="#2F5D7C"
                                strokeDasharray="4 4"
                              />
                              {Array.from(
                                new Set(
                                  retirementWithdrawals
                                    .map((row) => parseNumber(row.year))
                                    .filter((year) => year > 0)
                                )
                              )
                                .sort((a, b) => a - b)
                                .map((year) => (
                                <ReferenceLine
                                  key={`goal-${year}`}
                                  x={year}
                                  stroke="#BDA06D"
                                  strokeDasharray="2 6"
                                />
                              ))}
                              <Line type="monotone" dataKey="corpus" stroke="#2F5D7C" strokeWidth={3} name="Money left after withdrawals" />
                              <Line type="monotone" dataKey="totalOutflow" stroke="#B35A5A" strokeWidth={2} name="Money you withdraw each year" />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="mt-3 grid gap-2 text-[11px] uppercase tracking-[0.2em] text-[#6B7C70] sm:grid-cols-2">
                          <span className="flex items-center gap-2">
                            <span className="h-0.5 w-6 rounded-full bg-[#2F5D7C]" />
                            Money left after withdrawals
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="h-0.5 w-6 rounded-full bg-[#B35A5A]" />
                            Money you withdraw each year
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="h-0.5 w-6 border-t-2 border-dashed border-[#2F5D7C]" />
                            Retirement marker
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="h-0.5 w-6 border-t-2 border-dashed border-[#BDA06D]" />
                            Goal marker
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-[#EEF0E8] bg-[#FBFCFA] p-4 space-y-3">
                      <InfoToggle label="How this result is built">
                        <div className="space-y-2">
                          {retirementExplanation.steps.map((step, index) => (
                            <p key={`${index}-${step.slice(0, 12)}`}>{step}</p>
                          ))}
                        </div>
                      </InfoToggle>
                      <InfoToggle label="Example using your inputs">{retirementExplanation.example}</InfoToggle>
                    </div>
                    <NextStep
                      label="Set a new goal"
                      note="Adjust your direction and run the numbers again."
                      onSelect={() => scrollToId("sip-goal")}
                    />
                  </div>
                ) : null}
              </CalculatorCard>
            </div>
          </div>
        </section>

        <div className="rounded-2xl border border-[#E6E8E1] bg-white/80 px-4 py-3 text-xs font-serif text-[#6B7C70]">
          These are planning estimates, not predictions. Outcomes will vary.
        </div>
      </div>
    </div>
  );
}
