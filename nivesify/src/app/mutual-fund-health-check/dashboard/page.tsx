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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useUser } from "@/hooks/useUser";
import { InvestmentsData } from "@/lib/mutual-fund-health-check/types";
import { fetchNavHistoryForSchemes, fetchNavHistory, getNavHistoryMap } from "@/lib/mutual-fund-health-check/nav";
import { getPortfolio, getSummary } from "@/lib/mutual-fund-health-check/portfolio";
import { getPerformanceByYears } from "@/lib/mutual-fund-health-check/chart-data";
import { buildCashflows } from "@/lib/mutual-fund-health-check/cashflows";
import { xirr } from "@/lib/mutual-fund-health-check/xirr";
import { formatCurrency } from "@/lib/mutual-fund-health-check/format";
import { buildManualTransactions } from "@/lib/mutual-fund-health-check/manual";
import { buildReportData, generatePdfReport, tooltips } from "@/lib/mutual-fund-health-check/report";
import type { FundAnalytics, ETFAnalytics, CategoryInsights } from "@/lib/fund-types";

/* ─────────────────────────────────────────────────────────────────
   GLOBAL CSS
───────────────────────────────────────────────────────────────── */
const CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700&display=swap');

  .dash-root { font-family: 'DM Sans', system-ui, -apple-system, sans-serif; }

  /* KPI cards */
  .kpi-primary { grid-column: span 1; }
  @media (max-width: 640px) { .kpi-grid-primary { grid-template-columns: repeat(2, 1fr) !important; } }

  /* Table horizontal scroll on mobile */
  .audit-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }

  /* Insight card hover */
  .insight-card { transition: box-shadow 0.2s ease, transform 0.2s ease; }
  .insight-card:hover { box-shadow: 0 16px 48px rgba(0,0,0,0.10); transform: translateY(-2px); }

  /* Fade-in animation */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade-up { animation: fadeUp 0.5s ease forwards; }
  .fade-up-1 { animation-delay: 60ms; opacity: 0; }
  .fade-up-2 { animation-delay: 120ms; opacity: 0; }
  .fade-up-3 { animation-delay: 180ms; opacity: 0; }
  .fade-up-4 { animation-delay: 240ms; opacity: 0; }

  /* Status badges */
  .badge-hold   { background: #ECFDF5; color: #059669; border: 1px solid #A7F3D0; }
  .badge-review { background: #FFFBEB; color: #D97706; border: 1px solid #FDE68A; }
  .badge-exit   { background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA; }

  /* Scrollbar for overflow tables */
  .audit-table-wrap::-webkit-scrollbar { height: 4px; }
  .audit-table-wrap::-webkit-scrollbar-track { background: #F1F5F9; border-radius: 4px; }
  .audit-table-wrap::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }

  /* Section toggle arrow */
  .section-toggle { cursor: pointer; user-select: none; }
  .section-toggle:hover { opacity: 0.8; }

  /* Chart tooltip */
  .recharts-tooltip-wrapper { font-family: 'DM Sans', system-ui !important; }
`;

/* ─────────────────────────────────────────────────────────────────
   CONSTANTS & HELPERS (unchanged from original — logic preserved)
───────────────────────────────────────────────────────────────── */
const performanceOptions = [
  { label: "1Y", value: "1" },
  { label: "5Y", value: "5" },
  { label: "10Y", value: "10" },
  { label: "Max", value: "max" },
];

const lineChartDataMap: Record<string, (transactions: InvestmentsData["transactions"]) => Promise<{ name: string; valueOne: number; valueTwo: number }[]>> = {
  "1": (t) => getPerformanceByYears(t ?? [], 1),
  "5": (t) => getPerformanceByYears(t ?? [], 5),
  "10": (t) => getPerformanceByYears(t ?? [], 10),
  max: (t) => getPerformanceByYears(t ?? [], "max"),
};

const formatXAxisTick = (value: string, index: number, total: number) => {
  if (total <= 12) return value;
  const step = Math.ceil(total / 8);
  return index % step === 0 ? value : "";
};

const formatPct = (value: number | null | undefined, digits = 1) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `${value.toFixed(digits)}%`;
};

const formatPct2 = (value: number | null | undefined) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `${value.toFixed(2)}%`;
};

const BRAND_COLORS = ["#2563EB", "#059669", "#7C3AED", "#D97706", "#DC2626", "#0891B2", "#BE185D", "#65A30D", "#9333EA"];

const chartMargin = { top: 8, right: 8, left: -8, bottom: 0 };
const axisDefaults = { tickLine: false, axisLine: false, width: 48, tickMargin: 4, tick: { fill: "#94A3B8", fontSize: 9, fontFamily: "DM Sans" } };
const xAxisDefaults = { tickLine: false, axisLine: false, tickMargin: 8, tick: { fill: "#94A3B8", fontSize: 9, fontFamily: "DM Sans" }, minTickGap: 18 };

const normalizeFundName = (value: string) =>
  value.toLowerCase().replace(/direct|growth|regular|plan|option|fund/gi, "").replace(/[^a-z0-9]+/g, " ").trim();

const splitTokens = (value: string) => normalizeFundName(value).split(" ").filter(Boolean);
const matchesTokens = (name: string, tokens: string[]) => tokens.length > 0 && tokens.every((t) => name.includes(t));
const normalizeBenchmark = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const buildFutureGrowth = (currentValue: number, investedBase: number, monthlySip: number, expectedReturn: number, years: number) => {
  const monthlyRate = expectedReturn / 100 / 12;
  let corpus = currentValue;
  let invested = investedBase;
  const data: Array<{ year: number; corpus: number; invested: number }> = [{ year: 0, corpus, invested }];
  for (let year = 1; year <= years; year++) {
    for (let month = 0; month < 12; month++) corpus = (corpus + monthlySip) * (1 + monthlyRate);
    invested += monthlySip * 12;
    data.push({ year, corpus, invested });
  }
  return data;
};

const riskScoreForSubCategory = (subCategory: string, category: string) => {
  const sub = subCategory.toLowerCase(), cat = category.toLowerCase();
  if (cat.includes("equity")) {
    if (sub.includes("small")) return 9.5;
    if (sub.includes("mid")) return 8.5;
    if (sub.includes("large")) return 6.5;
    if (sub.includes("sector") || sub.includes("thematic")) return 9;
    if (sub.includes("index") || sub.includes("etf")) return 6.5;
    return 7.5;
  }
  if (cat.includes("hybrid")) { if (sub.includes("aggressive")) return 6.5; if (sub.includes("conservative")) return 4.5; return 5.5; }
  if (cat.includes("debt")) { if (sub.includes("credit")) return 4.5; if (sub.includes("gilt") || sub.includes("duration")) return 4; return 3.5; }
  if (cat.includes("commodity") || sub.includes("gold")) return 6.5;
  return 5;
};

const classifyFundType = (name: string, analytics?: FundAnalytics, subCategory?: string | null) => {
  const combined = `${name} ${analytics?.Sub_Category ?? ""} ${subCategory ?? ""}`.toLowerCase();
  if (combined.includes("index") || combined.includes("etf") || combined.includes("passive")) return "passive";
  return "active";
};

/* ─────────────────────────────────────────────────────────────────
   SMALL UI ATOMS
───────────────────────────────────────────────────────────────── */

function InfoTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex" onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        style={{ width: 14, height: 14, borderRadius: "50%", border: "1.5px solid #CBD5E1", background: "white", fontSize: 9, color: "#94A3B8", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
        aria-label={text}
      >?</button>
      {open && (
        <span style={{ position: "absolute", left: "50%", top: 20, zIndex: 50, width: 200, transform: "translateX(-50%)", background: "white", border: "1px solid #E2E8F0", borderRadius: 10, padding: "8px 10px", fontSize: 11, color: "#475569", boxShadow: "0 8px 24px rgba(0,0,0,0.10)", lineHeight: 1.5 }}>
          {text}
        </span>
      )}
    </span>
  );
}

function StatusBadge({ status }: { status: "Continue" | "Review" | "Exit" | string }) {
  const cls = status === "Continue" ? "badge-hold" : status === "Exit" ? "badge-exit" : "badge-review";
  const icon = status === "Continue" ? "✓" : status === "Exit" ? "✕" : "!";
  return (
    <span className={cls} style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 100, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 3 }}>
      <span style={{ fontSize: 9 }}>{icon}</span> {status}
    </span>
  );
}

function SectionHeader({ label, title, color = "#059669" }: { label: string; title: string; color?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${color}14`, border: `1px solid ${color}30`, borderRadius: 100, padding: "3px 12px", marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: "0.07em", textTransform: "uppercase" }}>{label}</span>
      </div>
      <h2 style={{ fontSize: "clamp(18px,3vw,24px)", fontWeight: 900, color: "#0F172A", margin: 0, letterSpacing: "-0.02em" }}>{title}</h2>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   INSIGHT CARD — new design with priority colors
───────────────────────────────────────────────────────────────── */
type InsightPriority = "critical" | "warning" | "info" | "positive";

const priorityConfig: Record<InsightPriority, { color: string; bg: string; border: string; icon: string; label: string }> = {
  critical: { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", icon: "🔴", label: "Action needed" },
  warning:  { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", icon: "🟡", label: "Review" },
  info:     { color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", icon: "🔵", label: "Info" },
  positive: { color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", icon: "🟢", label: "Looking good" },
};

function InsightCard({ priority, title, summary, detail, metric, metricLabel }: {
  priority: InsightPriority;
  title: string;
  summary: string;
  detail: string;
  metric?: string;
  metricLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const cfg = priorityConfig[priority];
  return (
    <div className="insight-card" style={{ background: "white", border: `1.5px solid ${cfg.border}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      <div style={{ height: 3, background: cfg.color }} />
      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
          <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
            <span style={{ fontSize: 13 }}>{cfg.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, letterSpacing: "0.06em", textTransform: "uppercase", background: cfg.bg, border: `1px solid ${cfg.border}`, padding: "1px 7px", borderRadius: 100 }}>{cfg.label}</span>
          </div>
          {metric && (
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: cfg.color, lineHeight: 1 }}>{metric}</div>
              {metricLabel && <div style={{ fontSize: 9, color: "#94A3B8", marginTop: 2 }}>{metricLabel}</div>}
            </div>
          )}
        </div>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", marginBottom: 5, lineHeight: 1.3 }}>{title}</div>
        <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.65, marginBottom: open ? 10 : 0 }}>{summary}</div>
        {open && (
          <div style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 10, padding: "10px 12px", fontSize: 12, color: "#374151", lineHeight: 1.65 }}>
            <strong style={{ color: cfg.color }}>Next step: </strong>{detail}
          </div>
        )}
        <button onClick={() => setOpen((p) => !p)} style={{ marginTop: 10, background: "none", border: "none", padding: 0, fontSize: 11, fontWeight: 700, color: cfg.color, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
          {open ? "▲ Less" : "▼ What to do"}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   AUDIT ROW CARD — mobile-friendly fund audit
───────────────────────────────────────────────────────────────── */
function AuditFundRow({ name, benchmark, delta, alpha, ir3y, compositeScore, status, suggestion, extraDetails }: {
  name: string;
  benchmark: string;
  delta: number | null;
  alpha?: number | null;
  ir3y?: number | null;
  compositeScore?: number | null;
  status: string;
  suggestion?: string | null;
  extraDetails?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const deltaColor = delta === null ? "#94A3B8" : delta >= 0 ? "#059669" : "#DC2626";
  return (
    <div style={{ border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden", background: "white", marginBottom: 8 }}>
      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 240 }} title={name}>{name}</div>
            <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 240 }} title={benchmark}>{benchmark}</div>
          </div>
          <StatusBadge status={status} />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "5px 9px", textAlign: "center", minWidth: 60 }}>
            <div style={{ fontSize: 9, color: "#94A3B8", marginBottom: 2 }}>vs Benchmark</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: deltaColor }}>
              {delta === null ? "—" : `${delta >= 0 ? "+" : ""}${delta.toFixed(2)}%`}
            </div>
          </div>
          {alpha !== undefined && (
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "5px 9px", textAlign: "center", minWidth: 60 }}>
              <div style={{ fontSize: 9, color: "#94A3B8", marginBottom: 2 }}>Alpha 3Y</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: (alpha ?? 0) >= 0 ? "#059669" : "#DC2626" }}>{formatPct2(alpha)}</div>
            </div>
          )}
          {compositeScore !== undefined && compositeScore !== null && (
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "5px 9px", textAlign: "center", minWidth: 60 }}>
              <div style={{ fontSize: 9, color: "#94A3B8", marginBottom: 2 }}>Score</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: compositeScore >= 55 ? "#059669" : "#D97706" }}>{compositeScore.toFixed(0)}</div>
            </div>
          )}
          {suggestion && (
            <div style={{ fontSize: 10, color: "#2563EB", fontWeight: 600, background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, padding: "5px 9px" }}>
              💡 Switch → {suggestion.length > 30 ? suggestion.slice(0, 30) + "…" : suggestion}
            </div>
          )}
        </div>
        {extraDetails && open && (
          <div style={{ marginTop: 10, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 12px", fontSize: 11, color: "#475569", lineHeight: 1.7 }}>
            {extraDetails}
          </div>
        )}
        {extraDetails && (
          <button onClick={() => setOpen((p) => !p)} style={{ marginTop: 8, background: "none", border: "none", padding: 0, fontSize: 11, color: "#94A3B8", cursor: "pointer", fontFamily: "inherit" }}>
            {open ? "▲ Less" : "▼ Details"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   MAIN DASHBOARD PAGE
───────────────────────────────────────────────────────────────── */
export default function MutualFundHealthCheckDashboard() {
  const { user, loading } = useUser();
  const router = useRouter();

  // ── State (all preserved from original) ──
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
  const [showAllInsights, setShowAllInsights] = useState(false);
  const [benchmarkMap, setBenchmarkMap] = useState<Map<string, { return1Y?: number; return3Y?: number; return5Y?: number; return10Y?: number }>>(new Map());
  const [fundReturnMap, setFundReturnMap] = useState<Map<string, { benchmarkName?: string | null; return1Y?: number; return3Y?: number; return5Y?: number; return10Y?: number }>>(new Map());
  const [amfiSchemeMap, setAmfiSchemeMap] = useState<Map<string, { category: string; subCategory: string; benchmark: string | null; return10Y?: number; return3Y?: number; aum?: number }>>(new Map());
  const [niftyHurdle, setNiftyHurdle] = useState<number | null>(null);

  const disclaimerText = "All financial decisions involve risk and past performance is no guarantee of future results. Consult a SEBI-registered investment advisor before acting on this information.";

  // ── Auth & data fetch (all logic preserved from original) ──
  useEffect(() => { if (!loading && !user) router.push("/api/auth/google"); }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/mutual-fund-health-check").then((r) => r.json()).then((json) => {
      if (!json.data) { router.push("/mutual-fund-health-check"); return; }
      setData(json.data);
    }).catch(() => router.push("/mutual-fund-health-check"));
  }, [user, router]);

  useEffect(() => {
    if (!data?.transactions?.length) return;
    const run = async () => {
      setProcessing(true);
      const manualInvestments = data.manualInvestments || [];
      const sipPlans = data.sipPlans || [];
      const schemeCodes = new Set<number>();
      data.transactions?.forEach((txn) => { const code = txn.matchingScheme?.schemeCode; if (Number.isFinite(code)) schemeCodes.add(code as number); });
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
    const load = async () => {
      try {
        const res = await fetch("/api/mutual-fund-health-check/mf");
        if (!res.ok) return;
        const json = await res.json();
        setSchemeList(json.data || []);
        const schemeCodes = new Set(data.transactions?.map((t) => t.matchingScheme?.schemeCode).filter((c): c is number => Number.isFinite(c)));
        (data.manualInvestments || []).forEach((i) => schemeCodes.add(i.schemeCode));
        (data.sipPlans || []).forEach((p) => schemeCodes.add(p.schemeCode));
        const map = new Map<number, any>();
        (json.data || []).forEach((s: any) => { if (schemeCodes.has(s.schemeCode)) map.set(s.schemeCode, s); });
        if (!cancelled) setSchemeLookup(map);
      } catch { /* silent */ }
    };
    load();
    return () => { cancelled = true; };
  }, [data]);

  useEffect(() => { fetch("/api/funds").then(r => r.json()).then(j => setFundAnalytics(j || [])).catch(() => setFundAnalytics([])); }, []);
  useEffect(() => { fetch("/api/etfs").then(r => r.json()).then(j => setEtfAnalytics(j || [])).catch(() => setEtfAnalytics([])); }, []);
  useEffect(() => { fetch("/api/insights").then(r => r.json()).then(j => setCategoryInsights(j || [])).catch(() => setCategoryInsights([])); }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/amfi-raw");
        if (!res.ok) return;
        const json = await res.json();
        if (!Array.isArray(json)) return;

        type AumTracked = { return1Y?: number; return3Y?: number; return5Y?: number; return10Y?: number; aum1Y?: number; aum3Y?: number; aum5Y?: number; aum10Y?: number };
        const benchMarkMapNext = new Map<string, AumTracked>();
        const fundMapNext = new Map<string, { benchmarkName?: string | null; return1Y?: number; return3Y?: number; return5Y?: number; return10Y?: number; aum?: number }>();
        const schemeMapNext = new Map<string, { category: string; subCategory: string; benchmark: string | null; return10Y?: number; return3Y?: number; aum?: number }>();
        let niftyCandidate: { return10Y: number; aum: number } | null = null;

        json.forEach((record: any) => {
          const benchmarkName = record?.benchmark ? String(record.benchmark) : "";
          const benchmarkKey = benchmarkName ? normalizeBenchmark(benchmarkName) : "";
          const aum = Number.isFinite(record?.dailyAUM) ? Number(record.dailyAUM) : 0;

          if (benchmarkKey) {
            const existing: AumTracked = benchMarkMapNext.get(benchmarkKey) || {};
            const updatePeriod = (period: "1Y" | "3Y" | "5Y" | "10Y", value: number | null | undefined) => {
              if (!value || !Number.isFinite(value)) return;
              const aumKey = `aum${period}` as keyof AumTracked;
              const returnKey = `return${period}` as keyof AumTracked;
              if (aum > ((existing[aumKey] as number) ?? -1)) {
                (existing as any)[aumKey] = aum;
                (existing as any)[returnKey] = Number(value);
              }
            };
            updatePeriod("1Y", record?.return1YearBenchmark);
            updatePeriod("3Y", record?.return3YearBenchmark);
            updatePeriod("5Y", record?.return5YearBenchmark);
            updatePeriod("10Y", record?.return10YearBenchmark);
            benchMarkMapNext.set(benchmarkKey, existing);
          }

          if (benchmarkKey === normalizeBenchmark("nifty 50 tri") && Number.isFinite(record?.return10YearRegular)) {
            const r10 = Number(record.return10YearRegular);
            if (!niftyCandidate || aum > niftyCandidate.aum) niftyCandidate = { return10Y: r10, aum };
          }

          const schemeName = record?.schemeName ? String(record.schemeName) : "";
          const schemeKey = schemeName ? normalizeFundName(schemeName) : "";
          if (schemeKey) {
            const ef = fundMapNext.get(schemeKey);
            if (!ef || aum > (ef.aum ?? -1)) {
              fundMapNext.set(schemeKey, {
                benchmarkName: benchmarkName || ef?.benchmarkName,
                return1Y: Number.isFinite(record?.return1YearDirect) ? Number(record.return1YearDirect) : ef?.return1Y,
                return3Y: Number.isFinite(record?.return3YearDirect) ? Number(record.return3YearDirect) : ef?.return3Y,
                return5Y: Number.isFinite(record?.return5YearDirect) ? Number(record.return5YearDirect) : ef?.return5Y,
                return10Y: Number.isFinite(record?.return10YearDirect) ? Number(record.return10YearDirect) : ef?.return10Y,
                aum,
              });
            }
            const es = schemeMapNext.get(schemeKey);
            if (!es || aum > (es.aum ?? -1)) {
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
        benchMarkMapNext.forEach((v, k) => compactBenchmarks.set(k, { return1Y: v.return1Y, return3Y: v.return3Y, return5Y: v.return5Y, return10Y: v.return10Y }));
        const compactFunds = new Map<string, { benchmarkName?: string | null; return1Y?: number; return3Y?: number; return5Y?: number; return10Y?: number }>();
        fundMapNext.forEach((v, k) => compactFunds.set(k, { benchmarkName: v.benchmarkName, return1Y: v.return1Y, return3Y: v.return3Y, return5Y: v.return5Y, return10Y: v.return10Y }));

        setBenchmarkMap(compactBenchmarks);
        setFundReturnMap(compactFunds);
        setAmfiSchemeMap(schemeMapNext);
        setNiftyHurdle((niftyCandidate as any)?.return10Y ?? null);
      } catch { /* silent */ }
    };
    load();
  }, []);

  useEffect(() => {
    if (!combinedTransactions?.length || !navReady) return;
    lineChartDataMap[performanceChart](combinedTransactions).then(setLineData);
  }, [combinedTransactions, performanceChart, navReady]);

  useEffect(() => {
    if (!processing) { setElapsedSeconds(0); return; }
    const started = Date.now();
    const timer = setInterval(() => setElapsedSeconds(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [processing]);

  // ── Derived data (all calculations preserved) ──
  const summary = useMemo(() => getSummary(portfolio), [portfolio]);
  const lineHasData = useMemo(() => lineData.some((i) => i.valueOne !== 0 || i.valueTwo !== 0), [lineData]);

  const saveData = async (nextData: InvestmentsData) => {
    setData(nextData);
    await fetch("/api/mutual-fund-health-check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nextData) });
  };

  const handleAddManual = async () => {
    if (!data) return;
    const amount = Number(manualDraft.amount);
    const schemeCode = Number(manualDraft.schemeCode);
    if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(schemeCode)) return;
    const scheme = schemeList.find((i) => i.schemeCode === schemeCode);
    const date = manualDraft.date || new Date().toISOString().slice(0, 10);
    await saveData({ ...data, manualInvestments: [...(data.manualInvestments || []), { id: `m-${Date.now()}`, schemeCode, schemeName: manualDraft.schemeName || scheme?.schemeName || "", date, amount }] });
    setManualDraft({ schemeCode: "", schemeName: "", amount: "", date: "" });
  };

  const handleAddSip = async () => {
    if (!data) return;
    const monthlyAmount = Number(sipDraft.monthlyAmount);
    const schemeCode = Number(sipDraft.schemeCode);
    if (!Number.isFinite(monthlyAmount) || monthlyAmount <= 0 || !Number.isFinite(schemeCode)) return;
    const scheme = schemeList.find((i) => i.schemeCode === schemeCode);
    const startDate = sipDraft.startDate || new Date().toISOString().slice(0, 10);
    await saveData({ ...data, sipPlans: [...(data.sipPlans || []), { id: `s-${Date.now()}`, schemeCode, schemeName: sipDraft.schemeName || scheme?.schemeName || "", startDate, endDate: sipDraft.endDate || undefined, monthlyAmount }] });
    setSipDraft({ schemeCode: "", schemeName: "", monthlyAmount: "", startDate: "", endDate: "" });
  };

  const analyticsMap = useMemo(() => { const m = new Map<string, FundAnalytics>(); fundAnalytics.forEach((f) => { const k = normalizeFundName(f.Fund_Name); if (!m.has(k)) m.set(k, f); }); return m; }, [fundAnalytics]);
  const analyticsByIsin = useMemo(() => { const m = new Map<string, FundAnalytics>(); fundAnalytics.forEach((f) => { const isin = f.ISIN || f.ISIN_Code; if (isin) m.set(isin, f); }); return m; }, [fundAnalytics]);
  const getFundAnalytics = (name: string) => analyticsMap.get(normalizeFundName(name));
  const getFundAnalyticsForHolding = (name: string, isin?: string) => (isin ? analyticsByIsin.get(isin) : undefined) || getFundAnalytics(name);

  const fundNameOptions = useMemo(() => { const u = new Set<string>(); fundAnalytics.forEach((f) => { if (f.Fund_Name) u.add(f.Fund_Name); }); return Array.from(u); }, [fundAnalytics]);
  const schemeNameMap = useMemo(() => { const m = new Map<string, any>(); schemeList.forEach((s) => { const k = normalizeFundName(s.schemeName || ""); if (k && !m.has(k)) m.set(k, s); }); return m; }, [schemeList]);
  const findSchemeForName = (name: string) => { const n = normalizeFundName(name); if (!n) return null; const d = schemeNameMap.get(n); if (d) return d; const t = splitTokens(n); return schemeList.find((s) => matchesTokens(normalizeFundName(s.schemeName || ""), t)) || null; };
  const getFundSuggestions = (query: string) => { const t = query.trim(); if (t.length < 4) return []; const tok = splitTokens(t); return fundNameOptions.filter((n) => matchesTokens(normalizeFundName(n), tok)).slice(0, 8); };
  const manualSuggestions = useMemo(() => getFundSuggestions(manualDraft.schemeName), [manualDraft.schemeName, fundNameOptions]);
  const sipSuggestions = useMemo(() => getFundSuggestions(sipDraft.schemeName), [sipDraft.schemeName, fundNameOptions]);

  const uniquePortfolioFunds = useMemo(() => {
    const map = new Map<string, typeof portfolio[number]>();
    portfolio.filter((r) => (r.currentValue || 0) > 0).forEach((r) => { const k = normalizeFundName(r.mfName); if (!map.has(k)) map.set(k, r); });
    return Array.from(map.values());
  }, [portfolio]);

  const holdings = useMemo(() => uniquePortfolioFunds.map((row) => {
    const isin = row.allTransactions?.[0]?.isin || "";
    const analytics = getFundAnalyticsForHolding(row.mfName, isin);
    const normalized = normalizeFundName(row.mfName);
    const amfi = amfiSchemeMap.get(normalized);
    const benchmarkName = analytics?.Benchmark_Name || amfi?.benchmark || fundReturnMap.get(normalized)?.benchmarkName || "—";
    return { name: row.mfName, value: row.currentValue || 0, analytics, amfi, benchmarkName, isin };
  }), [uniquePortfolioFunds, analyticsByIsin, amfiSchemeMap, fundReturnMap]);

  const subCategoryInsightsMap = useMemo(() => { const m = new Map<string, CategoryInsights>(); categoryInsights.filter((r) => r.Level === "Sub-Category" && r.Sub_Category_Name).forEach((r) => m.set(r.Sub_Category_Name || "", r)); return m; }, [categoryInsights]);
  const categoryInsightsMap = useMemo(() => { const m = new Map<string, CategoryInsights>(); categoryInsights.filter((r) => r.Level === "Category" && r.Category_Name).forEach((r) => m.set(r.Category_Name || "", r)); return m; }, [categoryInsights]);

  const activeHoldings = useMemo(() => holdings.filter((r) => classifyFundType(r.name, r.analytics, r.amfi?.subCategory) === "active"), [holdings]);
  const passiveHoldings = useMemo(() => holdings.filter((r) => classifyFundType(r.name, r.analytics, r.amfi?.subCategory) === "passive"), [holdings]);
  const alphaHurdle = useMemo(() => niftyHurdle, [niftyHurdle]);

  const activeHitRate = useMemo(() => {
    const total = activeHoldings.reduce((s, r) => s + r.value, 0);
    const winners = activeHoldings.filter((r) => (r.analytics?.Alpha_3Y ?? 0) > 0).reduce((s, r) => s + r.value, 0);
    return total > 0 ? winners / total : null;
  }, [activeHoldings]);

  const consistencyScore = useMemo(() => {
    let total = 0, winners = 0;
    holdings.forEach((r) => {
      const ir3y = r.analytics?.IR_3Y;
      const sub = r.analytics?.Sub_Category || r.amfi?.subCategory || "";
      const bench = subCategoryInsightsMap.get(sub);
      if (ir3y === null || ir3y === undefined || !bench?.Avg_IR_3Y) return;
      total++; if (ir3y > (bench.Avg_IR_3Y ?? 0)) winners++;
    });
    return { winners, total };
  }, [holdings, subCategoryInsightsMap]);

  const yieldTrapValue = useMemo(() => holdings.filter((r) => (r.analytics?.Percentile_in_SubCategory ?? 100) < 25).reduce((s, r) => s + r.value, 0), [holdings]);
  const styleTilt = useMemo(() => {
    let eq = 0, tilt = 0;
    holdings.forEach((r) => {
      const cat = r.amfi?.category || r.analytics?.Category || "";
      if (cat.toLowerCase() !== "equity") return;
      eq += r.value;
      const sub = (r.amfi?.subCategory || r.analytics?.Sub_Category || "").toLowerCase();
      if (sub.includes("small") || sub.includes("mid")) tilt += r.value;
    });
    return eq > 0 ? tilt / eq : null;
  }, [holdings]);

  const riskDnaScore = useMemo(() => {
    let w = 0, t = 0;
    holdings.forEach((r) => {
      const cat = r.amfi?.category || r.analytics?.Category || "";
      const sub = r.amfi?.subCategory || r.analytics?.Sub_Category || "";
      w += riskScoreForSubCategory(sub, cat) * r.value; t += r.value;
    });
    return t > 0 ? w / t : null;
  }, [holdings]);

  const expectedPortfolioReturn = useMemo(() => {
    if (!portfolio.length) return 10;
    let t = 0, w = 0;
    portfolio.forEach((r) => {
      const a = getFundAnalytics(r.mfName);
      const v = a?.Fund_Return_5Y ?? a?.Fund_Return_3Y ?? a?.Fund_Return_1Y ?? 10;
      w += v * (r.currentValue || 0); t += r.currentValue || 0;
    });
    return t > 0 ? Number((w / t).toFixed(2)) : 10;
  }, [portfolio, analyticsMap]);

  // ── XIRR (preserved exactly) ──
  const xirrValue = useMemo(() => {
    if (!portfolio.length) return null;
    const allTxns = portfolio.flatMap((f) => f.allTransactions.map((t) => ({ amount: t.amount, date: new Date(t.date), type: t.type === "Investment" ? "buy" as const : "sell" as const })));
    const cashflows = buildCashflows(allTxns, summary.totalValue, new Date(), true);
    if (cashflows.length < 2) return null;
    const days = (cashflows[cashflows.length - 1].date.getTime() - cashflows[0].date.getTime()) / (1000 * 3600 * 24);
    if (days < 365) return null;
    return xirr(cashflows);
  }, [portfolio, summary.totalValue]);

  const projectionReturn = useMemo(() => (xirrValue !== null ? xirrValue * 100 : expectedPortfolioReturn), [xirrValue, expectedPortfolioReturn]);
  const totalMonthlySip = useMemo(() => (data?.sipPlans || []).reduce((s, p) => s + (p.monthlyAmount || 0), 0), [data]);
  const growthProjection = useMemo(() => buildFutureGrowth(summary.totalValue || 0, summary.invested || 0, totalMonthlySip, projectionReturn, 15), [summary.totalValue, summary.invested, totalMonthlySip, projectionReturn]);

  const etfByBenchmark = useMemo(() => { const m = new Map<string, ETFAnalytics[]>(); etfAnalytics.forEach((e) => { const k = normalizeBenchmark(e.Benchmark_Name || ""); if (!k) return; const l = m.get(k) || []; l.push(e); m.set(k, l); }); m.forEach((l, k) => { l.sort((a, b) => (b.ETF_Score ?? 0) - (a.ETF_Score ?? 0)); m.set(k, l); }); return m; }, [etfAnalytics]);
  const etfByName = useMemo(() => { const m = new Map<string, ETFAnalytics>(); etfAnalytics.forEach((e) => { const k = normalizeFundName(e.ETF_Name || ""); if (k) m.set(k, e); }); return m; }, [etfAnalytics]);

  const activeAudit = useMemo(() => activeHoldings.map((row) => {
    const analytics = row.analytics;
    const category = analytics?.Category || "";
    const subCategory = analytics?.Sub_Category || row.amfi?.subCategory || "";
    const categoryAvgIr = subCategory ? subCategoryInsightsMap.get(subCategory)?.Avg_IR_3Y ?? null : null;
    const alpha = analytics?.Alpha_3Y ?? null;
    const ir3y = analytics?.IR_3Y ?? null;
    const compositeScore = analytics?.Composite_Score ?? null;
    const benchmarkName = row.benchmarkName || "—";
    const benchmarkKey = benchmarkName !== "—" ? normalizeBenchmark(benchmarkName) : "";
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
    return { name: row.name, benchmarkName, fundReturn, benchmarkReturn, delta, alpha, ir3y, categoryAvgIr, compositeScore, status, suggestion: status === "Review" && bestEtf ? bestEtf.ETF_Name : null, suggestionScore: bestEtf?.ETF_Score ?? null };
  }), [activeHoldings, benchmarkMap, etfByBenchmark, subCategoryInsightsMap]);

  const passiveAudit = useMemo(() => passiveHoldings.map((row) => {
    const benchmarkName = row.benchmarkName || "—";
    const benchmarkKey = benchmarkName !== "—" ? normalizeBenchmark(benchmarkName) : "";
    const bestEtf = benchmarkKey ? etfByBenchmark.get(benchmarkKey)?.[0] : undefined;
    const currentEtf = etfByName.get(normalizeFundName(row.name));
    const tracking = currentEtf?.Tracking_Diff_3Y ?? null;
    const bestTracking = bestEtf?.Tracking_Diff_3Y ?? null;
    const fundReturn = row.analytics?.Fund_Return_3Y ?? row.amfi?.return3Y ?? null;
    const benchmarkReturn = benchmarkKey ? benchmarkMap.get(benchmarkKey)?.return3Y ?? null : null;
    const delta = fundReturn !== null && benchmarkReturn !== null ? fundReturn - benchmarkReturn : null;
    const needsSwitch = (tracking !== null && bestTracking !== null ? tracking - bestTracking > 0.5 : false) || (delta !== null ? delta < 0 : false);
    const status = needsSwitch ? "Review" : "Continue";
    return { name: row.name, benchmarkName, fundReturn, benchmarkReturn, delta, tracking, bestTracking, status, suggestion: status === "Review" && bestEtf ? bestEtf.ETF_Name : null, bestEtfName: bestEtf?.ETF_Name ?? null };
  }), [passiveHoldings, benchmarkMap, etfByBenchmark, etfByName]);

  const activeReviewCount = useMemo(() => activeAudit.filter((r) => r.status !== "Continue").length, [activeAudit]);
  const passiveSwitchCount = useMemo(() => passiveAudit.filter((r) => r.suggestion).length, [passiveAudit]);

  const lostAlphaAmount = useMemo(() => activeHoldings.filter((r) => (r.analytics?.Alpha_3Y ?? 0) <= 0).reduce((s, r) => { const alpha = r.analytics?.Alpha_3Y ?? 0; if (alpha >= 0) return s; return s + (r.value * Math.abs(alpha)) / 100; }, 0), [activeHoldings]);

  const executivePulse = useMemo(() => {
    const xirrPct = xirrValue !== null ? xirrValue * 100 : null;
    const hurdle = alphaHurdle ?? null;
    const diff = xirrPct !== null && hurdle !== null ? xirrPct - hurdle : null;
    const direction = diff === null ? "matching" : diff >= 0 ? "beating" : "trailing";
    return { xirrPct, hurdle, diff, direction, underperformingCount: activeReviewCount };
  }, [xirrValue, alphaHurdle, activeReviewCount]);

  const report = useMemo(() => { if (!data) return null; return buildReportData(data, portfolio, summary.totalValue, xirrValue, schemeLookup); }, [data, portfolio, summary.totalValue, xirrValue, schemeLookup]);

  // ── Insight cards with priority classification ──
  const insightCards = useMemo(() => {
    const cards: Array<{ priority: InsightPriority; title: string; summary: string; detail: string; metric?: string; metricLabel?: string }> = [];

    // 1. XIRR vs hurdle
    if (executivePulse.diff !== null) {
      const beating = executivePulse.diff >= 0;
      cards.push({
        priority: beating ? "positive" : "warning",
        title: beating ? "Your portfolio is beating the market" : "Your portfolio is trailing the market",
        summary: `Your XIRR of ${formatPct2(executivePulse.xirrPct)} is ${executivePulse.direction} the Nifty 50 TRI 10Y bar of ${formatPct2(executivePulse.hurdle)} by ${formatPct2(Math.abs(executivePulse.diff ?? 0))}.`,
        detail: beating
          ? "Keep the same discipline. Review annually to make sure this gap doesn't narrow from fund drift."
          : "This gap often narrows by replacing underperforming funds. Check the active audit below for specific funds dragging returns.",
        metric: formatPct2(executivePulse.diff),
        metricLabel: "vs Nifty 50 TRI",
      });
    }

    // 2. Active fund drag
    if (activeReviewCount > 0) {
      cards.push({
        priority: lostAlphaAmount > 50000 ? "critical" : "warning",
        title: `${activeReviewCount} active fund${activeReviewCount > 1 ? "s" : ""} need${activeReviewCount === 1 ? "s" : ""} review`,
        summary: `These funds are not beating their benchmarks. Estimated annual drag: ${formatCurrency(lostAlphaAmount)}. Paying for active management that doesn't deliver is the single most common portfolio mistake.`,
        detail: "Start with the worst alpha offenders in the Active Audit section below. Before exiting, check lock-in periods, exit loads, and short-term capital gains tax implications.",
        metric: formatCurrency(lostAlphaAmount),
        metricLabel: "est. annual drag",
      });
    } else if (activeHoldings.length > 0) {
      cards.push({
        priority: "positive",
        title: "All active funds are beating their benchmarks",
        summary: `All ${activeHoldings.length} active fund${activeHoldings.length > 1 ? "s are" : " is"} delivering positive alpha above benchmark. Your fund selection is working.`,
        detail: "Review again in 6–12 months. Alpha persistence is not guaranteed — a fund that beats today may not beat in 3 years.",
      });
    }

    // 3. Passive drift
    if (passiveSwitchCount > 0) {
      cards.push({
        priority: "warning",
        title: `${passiveSwitchCount} passive fund${passiveSwitchCount > 1 ? "s" : ""} show tracking drift`,
        summary: `These index funds or ETFs lag behind a better alternative tracking the same benchmark. Switching to a tighter-tracking ETF costs nothing in terms of risk but improves returns.`,
        detail: "Use the Passive Audit below to see which ETF is the better alternative. Check expense ratios and liquidity before switching.",
        metric: `${passiveSwitchCount}`,
        metricLabel: "to review",
      });
    }

    // 4. Low-ranked funds (yield trap)
    if (yieldTrapValue > 0) {
      cards.push({
        priority: yieldTrapValue > 200000 ? "critical" : "warning",
        title: "Bottom 25% of category — low-ranked exposure",
        summary: `${formatCurrency(yieldTrapValue)} sits in funds ranked in the bottom 25% of their category. Bottom-quartile funds rarely recover to top-quartile. This is a common drag on long-term returns.`,
        detail: "Identify these funds in the Active Audit below. Consider consolidating into top-quartile funds in the same category. Tax impact should be evaluated before exiting.",
        metric: formatCurrency(yieldTrapValue),
        metricLabel: "bottom-quartile",
      });
    }

    // 5. Style concentration
    if (styleTilt !== null && styleTilt > 0.6) {
      cards.push({
        priority: "warning",
        title: "Heavy mid/small-cap concentration",
        summary: `${formatPct2(styleTilt * 100)} of your equity is in mid and small-cap funds. While these can outperform over 10+ years, they can fall 40–60% in bear markets and take 3–4 years to recover.`,
        detail: "If your time horizon is under 5 years, consider rebalancing toward large-cap or flexi-cap funds. If horizon is long, the concentration may be fine — just ensure you won't panic-sell.",
        metric: formatPct2(styleTilt * 100),
        metricLabel: "mid/small weight",
      });
    }

    // 6. Risk DNA
    if (riskDnaScore !== null) {
      const isHigh = riskDnaScore > 7.5;
      const isLow = riskDnaScore < 4;
      if (isHigh || isLow) {
        cards.push({
          priority: "info",
          title: isHigh ? "High-risk portfolio profile" : "Conservative portfolio profile",
          summary: `Your risk DNA score is ${riskDnaScore.toFixed(1)}/10. ${isHigh ? "This is an aggressive portfolio — high growth potential but also high drawdown risk in market corrections." : "This is a conservative portfolio — lower growth ceiling but more stability."}`,
          detail: isHigh ? "Ensure you have an emergency fund and short-term goals covered in debt/liquid funds before running this risk level." : "If your goal is long-term wealth creation (10+ years), a slightly higher equity allocation could meaningfully improve outcomes.",
          metric: `${riskDnaScore.toFixed(1)}/10`,
          metricLabel: "risk score",
        });
      }
    }

    return cards;
  }, [executivePulse, activeReviewCount, lostAlphaAmount, passiveSwitchCount, yieldTrapValue, styleTilt, riskDnaScore, activeHoldings]);

  // ── Scheme donut chart ──
  useEffect(() => { setSchemePath([]); }, [report]);
  const schemeNodes = useMemo(() => {
    if (!report?.fundDetails?.length) return [];
    if (schemePath.length === 0) { const t = new Map<string, number>(); report.fundDetails.forEach((f) => t.set(f.majorCategory, (t.get(f.majorCategory) || 0) + f.currentValue)); return Array.from(t.entries()).map(([name, value]) => ({ name, value })); }
    if (schemePath.length === 1) { const t = new Map<string, number>(); report.fundDetails.filter((f) => f.majorCategory === schemePath[0]).forEach((f) => t.set(f.schemeCategory, (t.get(f.schemeCategory) || 0) + f.currentValue)); return Array.from(t.entries()).map(([name, value]) => ({ name, value })); }
    const t = new Map<string, number>(); report.fundDetails.filter((f) => f.majorCategory === schemePath[0] && f.schemeCategory === schemePath[1]).forEach((f) => t.set(f.name, (t.get(f.name) || 0) + f.currentValue));
    const sorted = Array.from(t.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const top = sorted.slice(0, 10); const rest = sorted.slice(10).reduce((s, i) => s + i.value, 0);
    return rest > 0 ? [...top, { name: "Others", value: rest }] : top;
  }, [report, schemePath]);
  const schemeLevelLabel = useMemo(() => schemePath.length === 0 ? "Major allocation" : schemePath.length === 1 ? "Sub-category split" : "Fund allocation", [schemePath]);
  const schemeTotal = useMemo(() => schemeNodes.reduce((s: number, n: any) => s + (n.value || 0), 0), [schemeNodes]);
  const schemeSegments = useMemo(() => schemeNodes.map((n: any) => ({ name: n.name, value: n.value || 0, percent: schemeTotal > 0 ? n.value / schemeTotal : 0 })), [schemeNodes, schemeTotal]);
  const handleSchemeSelect = (name: string) => { if (!name) return; if (schemePath.length === 0) { setSchemePath([name]); return; } if (schemePath.length === 1) setSchemePath([schemePath[0], name]); };

  const amcDisplayData = useMemo(() => {
    if (!report?.amcBreakdown?.length) return [];
    const top = report.amcBreakdown.slice(0, 8);
    const rest = report.amcBreakdown.slice(8).reduce((s, i) => s + i.value, 0);
    return rest > 0 ? [...top, { name: "Others", value: rest }] : top;
  }, [report]);

  const amcFunds = useMemo(() => {
    if (!report?.fundDetails || !selectedAmc) return [];
    return report.fundDetails.filter((f) => f.amc === selectedAmc).sort((a, b) => b.currentValue - a.currentValue);
  }, [report, selectedAmc]);

  const pdfInsights = useMemo(() => {
    const metrics = [
      { title: "Market hurdle (Nifty 50 TRI 10Y)", value: formatPct2(alphaHurdle), note: "Long-term index reference" },
      { title: "Active winners", value: activeHitRate !== null ? formatPct2(activeHitRate * 100) : "—", note: "Active money beating benchmark" },
      { title: "Consistency check", value: consistencyScore.total ? `${consistencyScore.winners}/${consistencyScore.total}` : "—", note: "Funds above category average" },
      { title: "Low-ranked funds", value: formatCurrency(yieldTrapValue), note: "Bottom 25% of peers" },
      { title: "Style tilt (mid/small)", value: styleTilt !== null ? formatPct2(styleTilt * 100) : "—", note: "Higher swings if >50%" },
      { title: "Risk profile", value: riskDnaScore !== null ? riskDnaScore.toFixed(1) : "—", note: "1 low risk • 10 high risk" },
    ];
    const executiveSummary = `Portfolio XIRR ${formatPct2(executivePulse.xirrPct)} vs Nifty 50 TRI 10Y ${formatPct2(executivePulse.hurdle)} (${executivePulse.direction} by ${formatPct2(executivePulse.diff)}). ${activeReviewCount} active funds need review; potential drag ${formatCurrency(lostAlphaAmount)} per year.`;
    return { metrics, executiveSummary, activeAuditRows: activeAudit.slice(0, 12).map((r) => ({ name: r.name, benchmark: r.benchmarkName, gap: r.delta !== null ? `${r.delta >= 0 ? "+" : ""}${r.delta.toFixed(2)}%` : "—", action: r.suggestion ? `Review → ${r.suggestion}` : r.status })), passiveAuditRows: passiveAudit.slice(0, 12).map((r) => ({ name: r.name, benchmark: r.benchmarkName, gap: r.delta !== null ? `${r.delta >= 0 ? "+" : ""}${r.delta.toFixed(2)}%` : "—", tracking: r.tracking !== null ? `${r.tracking.toFixed(2)}%` : "—", action: r.suggestion ? `Review → ${r.suggestion}` : r.status })), insightCards };
  }, [alphaHurdle, activeHitRate, consistencyScore, yieldTrapValue, styleTilt, riskDnaScore, executivePulse, activeReviewCount, lostAlphaAmount, activeAudit, passiveAudit, insightCards]);

  // ── Health score (simple composite) ──
  const healthScore = useMemo(() => {
    let score = 70; // base
    if (executivePulse.diff !== null) score += executivePulse.diff >= 0 ? 10 : -10;
    if (activeHitRate !== null) score += activeHitRate > 0.6 ? 8 : activeHitRate > 0.3 ? 0 : -8;
    if (consistencyScore.total > 0) score += (consistencyScore.winners / consistencyScore.total) > 0.5 ? 5 : -5;
    if (yieldTrapValue > 200000) score -= 8;
    if (styleTilt !== null && styleTilt > 0.6) score -= 5;
    return Math.max(10, Math.min(100, Math.round(score)));
  }, [executivePulse, activeHitRate, consistencyScore, yieldTrapValue, styleTilt]);

  const healthColor = healthScore >= 75 ? "#059669" : healthScore >= 55 ? "#D97706" : "#DC2626";
  const healthLabel = healthScore >= 75 ? "Strong" : healthScore >= 55 ? "Moderate" : "Needs work";

  // ── Loading states ──
  if (loading || !user) {
    return (
      <div style={{ minHeight: "100vh", background: "#0F172A", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "3px solid rgba(16,185,129,0.2)", borderTop: "3px solid #10B981", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>Authenticating…</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════════ */
  return (
    <div className="dash-root" style={{ minHeight: "100vh", background: "#F8FAFC", position: "relative" }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {processing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 48, height: 48, border: "3px solid #E2E8F0", borderTop: "3px solid #059669", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: 16 }} />
          <div style={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>Recalculating portfolio...</div>
          <div style={{ fontSize: 13, color: "#64748B", marginTop: 6 }}>Merging manual additions</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ── HERO HEADER ── */}
      <section style={{ background: "linear-gradient(155deg, #0F172A 0%, #1E3A5F 55%, #064E3B 100%)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)", backgroundSize: "28px 28px", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: -80, right: -40, width: 400, height: 400, background: "radial-gradient(circle, rgba(16,185,129,0.14) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", maxWidth: 1160, margin: "0 auto", padding: "clamp(28px,5vw,48px) clamp(16px,4vw,32px) clamp(24px,4vw,36px)" }}>
          {/* Breadcrumb */}
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 16, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <a href="/" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>Nivesify</a>
            <span>/</span>
            <span style={{ color: "rgba(255,255,255,0.7)" }}>Fund Health Check</span>
            <span>/</span>
            <span style={{ color: "rgba(255,255,255,0.7)" }}>Dashboard</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "clamp(16px,3vw,32px)", alignItems: "flex-start" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 100, padding: "4px 12px", marginBottom: 12 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#6EE7B7", letterSpacing: "0.07em", textTransform: "uppercase" }}>Portfolio Diagnosis</span>
              </div>
              <h1 style={{ fontSize: "clamp(1.7rem,4.5vw,3rem)", fontWeight: 900, color: "white", lineHeight: 1.05, letterSpacing: "-0.03em", margin: "0 0 8px" }}>
                Fund Health Check
              </h1>
              <p style={{ fontSize: "clamp(12px,1.8vw,14px)", color: "rgba(255,255,255,0.55)", lineHeight: 1.75, maxWidth: 500, marginBottom: 0 }}>
                XIRR, alpha, benchmark comparison, and actionable signals — based on your actual CAS transactions.
              </p>
            </div>

            {/* Health score badge */}
            <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: "clamp(12px,2vw,18px) clamp(14px,2vw,20px)", textAlign: "center", flexShrink: 0 }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Health Score</div>
              <div style={{ fontSize: "clamp(28px,4vw,38px)", fontWeight: 900, color: healthColor, lineHeight: 1 }}>{healthScore}</div>
              <div style={{ fontSize: 11, color: healthColor, fontWeight: 700, marginTop: 4 }}>{healthLabel}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>out of 100</div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 20 }}>
            {[
              { label: "📊 View Portfolio", href: "/mutual-fund-health-check/portfolio", primary: false },
              { label: "📋 Transactions", href: "/mutual-fund-health-check/transactions", primary: false },
              { label: "⬆ Re-upload CAS", href: "/mutual-fund-health-check", primary: false },
            ].map((btn, i) => (
              <button key={i} onClick={() => router.push(btn.href)} style={{ background: btn.primary ? "linear-gradient(90deg,#059669,#2563EB)" : "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 100, padding: "8px 16px", fontSize: 12, fontWeight: 700, color: "white", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
                {btn.label}
              </button>
            ))}
            <button
              onClick={async () => {
                if (!data || !portfolio.length || !report) return;
                await generatePdfReport({ logoUrl: "/logo.png", summary: { totalValue: summary.totalValue, invested: summary.invested, allTimeProfit: summary.allTimeProfit, monthlyIncome: summary.totalValue / 25 / 12 }, xirrValue, report, insights: pdfInsights, holder: { name: data?.holder?.name || "—", pan: data?.holder?.pan, email: data?.holder?.email }, chartIds: { performance: "mfhc-performance-chart", scheme: "mfhc-scheme-chart", amc: "mfhc-amc-pie" } });
              }}
              disabled={!report}
              style={{ background: "linear-gradient(90deg,#059669,#2563EB)", border: "none", borderRadius: 100, padding: "8px 18px", fontSize: 12, fontWeight: 800, color: "white", cursor: report ? "pointer" : "not-allowed", fontFamily: "inherit", opacity: report ? 1 : 0.5 }}
            >
              ⬇ Download Report
            </button>
          </div>

          {/* Stats strip */}
          <div style={{ display: "flex", gap: "clamp(16px,3vw,32px)", flexWrap: "wrap", marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            {[
              { label: "Total Value", value: formatCurrency(summary.totalValue), color: "#34D399" },
              { label: "XIRR", value: xirrValue !== null ? formatPct(xirrValue * 100, 2) : "Calc…", color: (xirrValue ?? 0) > 0 ? "#34D399" : "#F87171" },
              { label: "All-time Gain", value: formatCurrency(summary.allTimeProfit), color: (summary.allTimeProfit || 0) > 0 ? "#34D399" : "#F87171" },
              { label: "Funds Held", value: report ? `${report.holdingsCount}` : "—", color: "#60A5FA" },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: "clamp(16px,2.5vw,22px)", fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 3, fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "clamp(24px,4vw,40px) clamp(16px,4vw,32px)" }}>

        {/* ════════════════════════════════════════════
            KPI GRID — 8 metrics, 4+4 layout
        ════════════════════════════════════════════ */}
        <div style={{ marginBottom: 40 }}>
          <SectionHeader label="At a glance" title="Portfolio metrics" color="#2563EB" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
            {[
              { title: "Total Value", value: formatCurrency(summary.totalValue), note: "Current portfolio worth", tooltip: tooltips.totalValue, accent: "#2563EB", trend: null },
              { title: "Portfolio XIRR", value: xirrValue !== null ? formatPct(xirrValue * 100, 2) : "< 1Y data", note: "Annualized true return", tooltip: tooltips.xirr, accent: (xirrValue ?? 0) * 100 > (alphaHurdle ?? 10) ? "#059669" : "#D97706", trend: xirrValue !== null && alphaHurdle !== null ? (xirrValue * 100 > alphaHurdle ? "↑" : "↓") : null },
              { title: "All-time Gain", value: formatCurrency(summary.allTimeProfit), note: "Total profit so far", tooltip: tooltips.allTimeReturns, accent: (summary.allTimeProfit || 0) > 0 ? "#059669" : "#DC2626", trend: null },
              { title: "Invested", value: formatCurrency(summary.invested), note: "Total capital deployed", tooltip: tooltips.invested, accent: "#475569", trend: null },
              { title: "Funds Held", value: report ? `${report.holdingsCount}` : "—", note: "Active holdings", tooltip: tooltips.holdings, accent: "#7C3AED", trend: null },
              { title: "Top Fund Weight", value: summary.totalValue && report ? `${(report.topOneShare * 100).toFixed(1)}%` : "—", note: "Concentration risk", tooltip: tooltips.topFund, accent: report && report.topOneShare > 0.4 ? "#D97706" : "#059669", trend: null },
              { title: "Top 5 Weight", value: summary.totalValue && report ? `${(report.topFiveShare * 100).toFixed(1)}%` : "—", note: "Core concentration", tooltip: tooltips.topFive, accent: "#475569", trend: null },
              { title: "Monthly Income Est.", value: formatCurrency(summary.totalValue / 25 / 12), note: "25× rule (withdraw rate)", tooltip: tooltips.monthlyIncome, accent: "#059669", trend: null },
            ].map((card) => (
              <div key={card.title} style={{ background: "white", border: `1.5px solid #E2E8F0`, borderRadius: 16, padding: "14px 14px 12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: card.accent, borderRadius: "16px 16px 0 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <span style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", lineHeight: 1.3, maxWidth: "80%" }}>{card.title}</span>
                  <InfoTip text={card.tooltip} />
                </div>
                <div style={{ fontSize: "clamp(16px,2.5vw,20px)", fontWeight: 900, color: card.accent, lineHeight: 1, marginBottom: 4 }}>
                  {card.trend && <span style={{ fontSize: 12, marginRight: 3 }}>{card.trend}</span>}
                  {card.value}
                </div>
                <div style={{ fontSize: 10, color: "#94A3B8", lineHeight: 1.4 }}>{card.note}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════════
            EXECUTIVE PULSE — narrative banner
        ════════════════════════════════════════════ */}
        <div style={{ marginBottom: 40, background: executivePulse.direction === "beating" ? "linear-gradient(135deg,#ECFDF5,#EFF6FF)" : "linear-gradient(135deg,#FFFBEB,#FEF2F2)", border: `1.5px solid ${executivePulse.direction === "beating" ? "#A7F3D0" : "#FDE68A"}`, borderRadius: 20, padding: "clamp(16px,3vw,24px)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Executive summary</div>
          <div style={{ fontSize: "clamp(13px,2vw,15px)", color: "#0F172A", lineHeight: 1.8 }}>
            Your portfolio XIRR is{" "}
            <strong style={{ color: executivePulse.direction === "beating" ? "#059669" : "#D97706" }}>{formatPct2(executivePulse.xirrPct)}</strong>,{" "}
            which is <strong>{executivePulse.direction}</strong> the Nifty 50 TRI 10Y hurdle{" "}
            (<strong>{formatPct2(executivePulse.hurdle)}</strong>) by{" "}
            <strong style={{ color: executivePulse.direction === "beating" ? "#059669" : "#DC2626" }}>{formatPct2(executivePulse.diff)}</strong>.{" "}
            {executivePulse.underperformingCount > 0 ? (
              <>We found <strong style={{ color: "#D97706" }}>{executivePulse.underperformingCount} active fund{executivePulse.underperformingCount > 1 ? "s" : ""}</strong> not beating their benchmarks — estimated annual drag of <strong style={{ color: "#DC2626" }}>{formatCurrency(lostAlphaAmount)}</strong>.</>
            ) : activeHoldings.length > 0 ? (
              <strong style={{ color: "#059669" }}>All active funds are beating their benchmarks. 🎉</strong>
            ) : null}
          </div>
        </div>

        {/* ════════════════════════════════════════════
            CHARTS — Performance + Growth
        ════════════════════════════════════════════ */}
        <div style={{ marginBottom: 40 }}>
          <SectionHeader label="Performance" title="Portfolio growth over time" color="#2563EB" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>

            {/* Performance chart */}
            <div style={{ background: "white", borderRadius: 20, border: "1.5px solid #E2E8F0", padding: "clamp(14px,2vw,20px)", boxShadow: "0 4px 18px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>Invested vs Current Value</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {performanceOptions.map((opt) => (
                    <button key={opt.value} onClick={() => setPerformanceChart(opt.value)} style={{ background: performanceChart === opt.value ? "#2563EB" : "#F1F5F9", color: performanceChart === opt.value ? "white" : "#64748B", border: "none", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {lineHasData ? (
                <div style={{ height: 240, width: "100%" }} id="mfhc-performance-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineData} margin={chartMargin}>
                      <CartesianGrid vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="name" {...xAxisDefaults} interval={0} tickFormatter={(v, i) => formatXAxisTick(v, i, lineData.length)} />
                      <YAxis {...axisDefaults} tickFormatter={(v) => formatCurrency(Number(v))} domain={["auto", "auto"]} tickCount={5} />
                      <Tooltip formatter={(v: any, n: any) => [formatCurrency(Number(v ?? 0)), n === "valueOne" ? "Invested" : "Current Value"]} contentStyle={{ borderRadius: 12, borderColor: "#E2E8F0", fontSize: 12, fontFamily: "DM Sans" }} labelFormatter={(l) => `Date: ${l}`} cursor={{ stroke: "#E2E8F0", strokeWidth: 1 }} />
                      <Line type="monotone" dataKey="valueOne" stroke="#CBD5E1" strokeDasharray="5 4" strokeWidth={2} dot={false} name="Invested" />
                      <Line type="monotone" dataKey="valueTwo" stroke="#2563EB" strokeWidth={3} dot={false} name="Current" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8", fontSize: 13 }}>NAV data still loading…</div>
              )}
              <div style={{ display: "flex", gap: 16, marginTop: 10, paddingTop: 10, borderTop: "1px solid #F1F5F9" }}>
                {[{ color: "#CBD5E1", label: "Invested", dash: true }, { color: "#2563EB", label: "Current Value", dash: false }].map((l, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 14, height: 2, background: l.dash ? "none" : l.color, backgroundImage: l.dash ? `repeating-linear-gradient(90deg,${l.color} 0,${l.color} 4px,transparent 4px,transparent 7px)` : "none" }} />
                    <span style={{ fontSize: 10, color: "#64748B", fontWeight: 600 }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Growth projection */}
            <div style={{ background: "white", borderRadius: 20, border: "1.5px solid #E2E8F0", padding: "clamp(14px,2vw,20px)", boxShadow: "0 4px 18px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>15-Year Growth Projection</div>
              <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 16 }}>Using {formatPct(projectionReturn, 1)} annual return (portfolio XIRR)</div>
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={growthProjection} margin={chartMargin}>
                    <CartesianGrid stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="year" {...xAxisDefaults} tickFormatter={(v) => `Y${v}`} />
                    <YAxis {...axisDefaults} tickFormatter={(v) => formatCurrency(Number(v))} />
                    <Tooltip formatter={(v: any, n: any) => [formatCurrency(Number(v ?? 0)), n === "corpus" ? "Projected Value" : "Invested"]} labelFormatter={(l) => `Year ${l}`} contentStyle={{ borderRadius: 12, borderColor: "#E2E8F0", fontSize: 12, fontFamily: "DM Sans" }} cursor={{ stroke: "#E2E8F0", strokeWidth: 1 }} />
                    <Line type="monotone" dataKey="invested" stroke="#CBD5E1" strokeDasharray="5 4" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="corpus" stroke="#059669" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 10, paddingTop: 10, borderTop: "1px solid #F1F5F9" }}>
                {[{ color: "#CBD5E1", label: "Invested", dash: true }, { color: "#059669", label: "Projected Value", dash: false }].map((l, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 14, height: 2, background: l.dash ? "none" : l.color, backgroundImage: l.dash ? `repeating-linear-gradient(90deg,${l.color} 0,${l.color} 4px,transparent 4px,transparent 7px)` : "none" }} />
                    <span style={{ fontSize: 10, color: "#64748B", fontWeight: 600 }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════
            DIAGNOSTIC METRICS ROW
        ════════════════════════════════════════════ */}
        <div style={{ marginBottom: 40 }}>
          <SectionHeader label="Deep diagnostics" title="Portfolio health metrics" color="#7C3AED" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
            {[
              { label: "Market Hurdle (Nifty 50 TRI 10Y)", value: formatPct2(alphaHurdle), sub: `Your XIRR: ${formatPct2(executivePulse.xirrPct)}`, color: executivePulse.direction === "beating" ? "#059669" : "#D97706" },
              { label: "Active Winners", value: activeHitRate !== null ? formatPct2(activeHitRate * 100) : "—", sub: "Share of active money beating benchmark", color: (activeHitRate ?? 0) > 0.5 ? "#059669" : "#D97706" },
              { label: "Consistency Check", value: consistencyScore.total ? `${consistencyScore.winners}/${consistencyScore.total}` : "—", sub: "Funds above category IR average", color: "#2563EB" },
              { label: "Bottom-Quartile Exposure", value: formatCurrency(yieldTrapValue), sub: "Funds in bottom 25% of peers", color: yieldTrapValue > 100000 ? "#DC2626" : "#059669" },
              { label: "Mid/Small Tilt", value: styleTilt !== null ? formatPct2(styleTilt * 100) : "—", sub: styleTilt !== null && styleTilt > 0.5 ? "High concentration" : "Balanced exposure", color: styleTilt !== null && styleTilt > 0.6 ? "#D97706" : "#059669" },
              { label: "Risk DNA Score", value: riskDnaScore !== null ? riskDnaScore.toFixed(1) : "—", sub: "1 = low risk • 10 = high risk", color: riskDnaScore !== null ? (riskDnaScore > 7.5 ? "#DC2626" : riskDnaScore < 4 ? "#0891B2" : "#059669") : "#94A3B8" },
            ].map((m, i) => (
              <div key={i} style={{ background: "white", border: "1.5px solid #E2E8F0", borderRadius: 14, padding: "14px", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, lineHeight: 1.4 }}>{m.label}</div>
                <div style={{ fontSize: "clamp(18px,3vw,22px)", fontWeight: 900, color: m.color, lineHeight: 1, marginBottom: 5 }}>{m.value}</div>
                <div style={{ fontSize: 10, color: "#94A3B8", lineHeight: 1.4 }}>{m.sub}</div>
              </div>
            ))}
          </div>

          {/* Methodology note */}
          <details style={{ marginTop: 12 }}>
            <summary style={{ fontSize: 11, color: "#94A3B8", cursor: "pointer", userSelect: "none" }}>How are these calculated? ▼</summary>
            <div style={{ marginTop: 8, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: "12px 14px", fontSize: 11, color: "#64748B", lineHeight: 1.8 }}>
              <div><strong>Market hurdle:</strong> 10-year return of a large, long-running Nifty 50 TRI benchmark fund from AMFI data.</div>
              <div><strong>Active winners:</strong> Share of active fund money with positive 3Y alpha above benchmark.</div>
              <div><strong>Consistency check:</strong> Funds whose 3Y Information Ratio exceeds their sub-category average.</div>
              <div><strong>Bottom-quartile:</strong> Funds with Percentile rank below 25 in their sub-category.</div>
              <div><strong>Risk DNA:</strong> Value-weighted average of sub-category risk scores (Small cap = 9.5, Large cap = 6.5, Debt = 3.5).</div>
            </div>
          </details>
        </div>

        {/* ════════════════════════════════════════════
            ACTIONABLE INSIGHTS — priority cards
        ════════════════════════════════════════════ */}
        <div style={{ marginBottom: 40 }} id="nivesify-insights">
          <SectionHeader label="Actionable Insights" title="What to do next" color="#059669" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {(showAllInsights ? insightCards : insightCards.slice(0, 4)).map((card, i) => (
              <InsightCard key={i} {...card} />
            ))}
          </div>
          {insightCards.length > 4 && (
            <button onClick={() => setShowAllInsights((p) => !p)} style={{ marginTop: 12, background: "none", border: "1.5px solid #E2E8F0", borderRadius: 100, padding: "8px 20px", fontSize: 12, fontWeight: 700, color: "#64748B", cursor: "pointer", fontFamily: "inherit" }}>
              {showAllInsights ? "▲ Show less" : `▼ See all ${insightCards.length} insights`}
            </button>
          )}
        </div>

        {/* ════════════════════════════════════════════
            FUND AUDIT — Active & Passive
        ════════════════════════════════════════════ */}
        <div style={{ marginBottom: 40 }}>
          <SectionHeader label="Fund-level audit" title="Active & passive fund review" color="#D97706" />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
            {/* Active Audit */}
            <div style={{ background: "white", borderRadius: 20, border: "1.5px solid #E2E8F0", padding: "clamp(14px,2vw,20px)", boxShadow: "0 4px 18px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>Active Fund Audit</div>
                  <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{activeHoldings.length} funds · {activeReviewCount} need review</div>
                </div>
                {activeReviewCount > 0 && (
                  <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: "#DC2626" }}>{activeReviewCount} to review</div>
                )}
              </div>
              <div style={{ maxHeight: 480, overflowY: "auto" }}>
                {activeAudit.length === 0 ? (
                  <div style={{ padding: "24px 0", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>No active funds found in your portfolio.</div>
                ) : activeAudit.map((row) => (
                  <AuditFundRow
                    key={row.name}
                    name={row.name}
                    benchmark={row.benchmarkName}
                    delta={row.delta}
                    alpha={row.alpha}
                    ir3y={row.ir3y}
                    compositeScore={row.compositeScore}
                    status={row.status}
                    suggestion={row.suggestion}
                    extraDetails={
                      <div>
                        <div>Fund 3Y: {formatPct2(row.fundReturn)} · Benchmark 3Y: {formatPct2(row.benchmarkReturn)}</div>
                        <div>Alpha 3Y: {formatPct2(row.alpha)} · IR 3Y: {formatPct2(row.ir3y)}</div>
                        <div>Category IR avg: {formatPct2(row.categoryAvgIr)} · Composite score: {row.compositeScore !== null ? row.compositeScore.toFixed(0) : "—"}</div>
                      </div>
                    }
                  />
                ))}
              </div>
            </div>

            {/* Passive Audit */}
            <div style={{ background: "white", borderRadius: 20, border: "1.5px solid #E2E8F0", padding: "clamp(14px,2vw,20px)", boxShadow: "0 4px 18px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>Passive Fund Audit</div>
                  <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{passiveHoldings.length} funds · {passiveSwitchCount} show drift</div>
                </div>
                {passiveSwitchCount > 0 && (
                  <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: "#D97706" }}>{passiveSwitchCount} to review</div>
                )}
              </div>
              <div style={{ maxHeight: 480, overflowY: "auto" }}>
                {passiveAudit.length === 0 ? (
                  <div style={{ padding: "24px 0", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>No passive/index funds found in your portfolio.</div>
                ) : passiveAudit.map((row) => (
                  <AuditFundRow
                    key={row.name}
                    name={row.name}
                    benchmark={row.benchmarkName}
                    delta={row.delta}
                    status={row.status}
                    suggestion={row.suggestion}
                    extraDetails={
                      <div>
                        <div>Fund 3Y: {formatPct2(row.fundReturn)} · Benchmark 3Y: {formatPct2(row.benchmarkReturn)}</div>
                        <div>Tracking diff: {formatPct2(row.tracking)} · Best ETF tracking: {formatPct2(row.bestTracking)}</div>
                        <div>Best ETF: {row.bestEtfName || "—"}</div>
                      </div>
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════
            ALLOCATION CHARTS
        ════════════════════════════════════════════ */}
        <div style={{ marginBottom: 40 }}>
          <SectionHeader label="Portfolio composition" title="Allocation breakdown" color="#0891B2" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>

            {/* Scheme donut */}
            <div style={{ background: "white", borderRadius: 20, border: "1.5px solid #E2E8F0", padding: "clamp(14px,2vw,20px)", boxShadow: "0 4px 18px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>Scheme Allocation</div>
              <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 12 }}>{schemeLevelLabel} · tap a slice to drill down</div>
              <div style={{ height: 220 }} id="mfhc-scheme-chart">
                {schemeSegments.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={schemeSegments} dataKey="value" cx="50%" cy="50%" innerRadius={52} outerRadius={88} paddingAngle={2} onClick={(e: any) => handleSchemeSelect(e?.name)}>
                        {schemeSegments.map((_e, i) => <Cell key={i} fill={BRAND_COLORS[i % BRAND_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: any, n: any) => { const pct = schemeTotal ? (Number(v) / schemeTotal) * 100 : 0; return [formatCurrency(Number(v ?? 0)), `${n ?? ""} (${pct.toFixed(1)}%)`]; }} contentStyle={{ borderRadius: 12, borderColor: "#E2E8F0", fontSize: 11, fontFamily: "DM Sans" }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8", fontSize: 13 }}>Waiting for NAV metadata…</div>
                )}
              </div>
              {schemeSegments.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, marginTop: 10 }}>
                  {schemeSegments.slice(0, 8).map((item, i) => (
                    <button key={item.name} onClick={() => handleSchemeSelect(item.name)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: BRAND_COLORS[i % BRAND_COLORS.length], flexShrink: 0 }} />
                      <span style={{ fontSize: 10, color: "#374151", fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
                      <span style={{ fontSize: 10, color: "#64748B", flexShrink: 0 }}>{(item.percent * 100).toFixed(1)}%</span>
                    </button>
                  ))}
                </div>
              )}
              {schemePath.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 10 }}>
                  <span style={{ fontSize: 10, color: "#94A3B8" }}>Path:</span>
                  {schemePath.map((seg, i) => (
                    <button key={i} onClick={() => setSchemePath(schemePath.slice(0, i + 1))} style={{ fontSize: 10, background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#2563EB", borderRadius: 100, padding: "2px 8px", cursor: "pointer", fontFamily: "inherit" }}>{seg}</button>
                  ))}
                  <button onClick={() => setSchemePath([])} style={{ fontSize: 10, background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", borderRadius: 100, padding: "2px 8px", cursor: "pointer", fontFamily: "inherit" }}>Reset</button>
                </div>
              )}
            </div>

            {/* AMC donut */}
            <div style={{ background: "white", borderRadius: 20, border: "1.5px solid #E2E8F0", padding: "clamp(14px,2vw,20px)", boxShadow: "0 4px 18px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>AMC Concentration</div>
              <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 12 }}>Fund house exposure by current value</div>
              <div style={{ height: 220 }} id="mfhc-amc-pie">
                {amcDisplayData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={amcDisplayData} dataKey="value" cx="50%" cy="50%" innerRadius={52} outerRadius={88} paddingAngle={2} onClick={(e: any) => { if (!e?.name) return; setSelectedAmc(e.name === "Others" ? null : e.name); }}>
                        {amcDisplayData.map((_e, i) => <Cell key={i} fill={BRAND_COLORS[i % BRAND_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: any, n: any) => { const pct = summary.totalValue ? (Number(v) / summary.totalValue) * 100 : 0; return [formatCurrency(Number(v ?? 0)), `${n ?? ""} (${pct.toFixed(1)}%)`]; }} contentStyle={{ borderRadius: 12, borderColor: "#E2E8F0", fontSize: 11, fontFamily: "DM Sans" }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8", fontSize: 13 }}>AMC distribution loading…</div>
                )}
              </div>
              {amcDisplayData.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, marginTop: 10 }}>
                  {amcDisplayData.map((item, i) => {
                    const pct = summary.totalValue ? (item.value / summary.totalValue) * 100 : 0;
                    return (
                      <button key={item.name} onClick={() => setSelectedAmc(item.name === "Others" ? null : item.name)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", background: selectedAmc === item.name ? "#EFF6FF" : "#F8FAFC", border: `1px solid ${selectedAmc === item.name ? "#BFDBFE" : "#E2E8F0"}`, borderRadius: 8, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: BRAND_COLORS[i % BRAND_COLORS.length], flexShrink: 0 }} />
                        <span style={{ fontSize: 10, color: "#374151", fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
                        <span style={{ fontSize: 10, color: "#64748B", flexShrink: 0 }}>{pct.toFixed(1)}%</span>
                      </button>
                    );
                  })}
                </div>
              )}
              {selectedAmc && amcFunds.length > 0 && (
                <div style={{ marginTop: 10, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{selectedAmc} holdings</div>
                  {amcFunds.map((f) => (
                    <div key={f.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid #F1F5F9", fontSize: 11, gap: 8 }}>
                      <span style={{ color: "#374151", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                      <span style={{ color: "#2563EB", fontWeight: 700, flexShrink: 0 }}>{formatCurrency(f.currentValue)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════
            MANUAL ADDITIONS
        ════════════════════════════════════════════ */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ background: "white", borderRadius: 20, border: "1.5px solid #E2E8F0", padding: "clamp(14px,2vw,20px)", boxShadow: "0 4px 18px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", marginBottom: 2 }}>Manual Additions</div>
                <div style={{ fontSize: 12, color: "#64748B" }}>Add SIPs or one-time investments not in your CAS. These are merged into your portfolio diagnostics.</div>
              </div>
              <button onClick={() => setShowManualSection((p) => !p)} style={{ background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: 100, padding: "8px 16px", fontSize: 12, fontWeight: 700, color: "#374151", cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
                {showManualSection ? "▲ Collapse" : "＋ Add investments"}
              </button>
            </div>

            {showManualSection && (
              <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
                {/* One-time investment form */}
                {[
                  { title: "One-time Investment", draft: manualDraft, setDraft: setManualDraft, suggestions: manualSuggestions, onAdd: handleAddManual, buttonLabel: "Add Investment", monthlyField: false },
                  { title: "SIP Plan", draft: sipDraft, setDraft: setSipDraft, suggestions: sipSuggestions, onAdd: handleAddSip, buttonLabel: "Add SIP", monthlyField: true },
                ].map(({ title, draft, setDraft, suggestions, onAdd, buttonLabel, monthlyField }) => (
                  <div key={title} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 14, padding: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>{title}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <input
                        value={(draft as any).schemeName}
                        onChange={(e) => { const name = e.target.value; const scheme = findSchemeForName(name); (setDraft as any)((p: any) => ({ ...p, schemeName: name, schemeCode: scheme && normalizeFundName(scheme.schemeName || "") === normalizeFundName(name) ? String(scheme.schemeCode) : "" })); }}
                        placeholder="Search fund name…"
                        style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #E2E8F0", fontSize: 13, color: "#0F172A", outline: "none", fontFamily: "inherit", background: "white" }}
                        onFocus={(e) => (e.target.style.borderColor = "#2563EB")} onBlur={(e) => (e.target.style.borderColor = "#E2E8F0")}
                      />
                      {suggestions.length > 0 && (
                        <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: 10, padding: 8 }}>
                          <div style={{ fontSize: 9, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Suggestions</div>
                          {suggestions.map((name) => (
                            <button key={name} onClick={() => { const scheme = findSchemeForName(name); (setDraft as any)((p: any) => ({ ...p, schemeName: name, schemeCode: scheme ? String(scheme.schemeCode) : "" })); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "6px 8px", borderRadius: 8, border: "none", background: "none", fontSize: 12, color: "#374151", cursor: "pointer", fontFamily: "inherit" }} onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.background = "#F1F5F9")} onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.background = "none")}>
                              {name}
                            </button>
                          ))}
                        </div>
                      )}
                      {(draft as any).schemeName.trim().length > 0 && (draft as any).schemeName.trim().length < 4 && <div style={{ fontSize: 11, color: "#94A3B8" }}>Type at least 4 letters for suggestions.</div>}
                      {(draft as any).schemeName.trim().length >= 4 && !(draft as any).schemeCode && <div style={{ fontSize: 11, color: "#DC2626" }}>No match yet — pick a suggestion above.</div>}

                      {monthlyField ? (
                        <>
                          <input value={(draft as any).monthlyAmount} onChange={(e) => (setDraft as any)((p: any) => ({ ...p, monthlyAmount: e.target.value }))} placeholder="Monthly SIP amount (₹)" type="number" style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #E2E8F0", fontSize: 13, color: "#0F172A", outline: "none", fontFamily: "inherit", background: "white" }} onFocus={(e) => (e.target.style.borderColor = "#2563EB")} onBlur={(e) => (e.target.style.borderColor = "#E2E8F0")} />
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                            <input type="date" value={(draft as any).startDate} onChange={(e) => (setDraft as any)((p: any) => ({ ...p, startDate: e.target.value }))} style={{ padding: "10px 12px", borderRadius: 10, border: "1.5px solid #E2E8F0", fontSize: 12, color: "#0F172A", outline: "none", fontFamily: "inherit", background: "white", width: "100%" }} onFocus={(e) => (e.target.style.borderColor = "#2563EB")} onBlur={(e) => (e.target.style.borderColor = "#E2E8F0")} />
                            <input type="date" value={(draft as any).endDate} onChange={(e) => (setDraft as any)((p: any) => ({ ...p, endDate: e.target.value }))} style={{ padding: "10px 12px", borderRadius: 10, border: "1.5px solid #E2E8F0", fontSize: 12, color: "#0F172A", outline: "none", fontFamily: "inherit", background: "white", width: "100%" }} onFocus={(e) => (e.target.style.borderColor = "#2563EB")} onBlur={(e) => (e.target.style.borderColor = "#E2E8F0")} />
                          </div>
                        </>
                      ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <input value={(draft as any).amount} onChange={(e) => (setDraft as any)((p: any) => ({ ...p, amount: e.target.value }))} placeholder="Amount (₹)" type="number" style={{ padding: "10px 12px", borderRadius: 10, border: "1.5px solid #E2E8F0", fontSize: 13, color: "#0F172A", outline: "none", fontFamily: "inherit", background: "white", width: "100%" }} onFocus={(e) => (e.target.style.borderColor = "#2563EB")} onBlur={(e) => (e.target.style.borderColor = "#E2E8F0")} />
                          <input type="date" value={(draft as any).date} onChange={(e) => (setDraft as any)((p: any) => ({ ...p, date: e.target.value }))} style={{ padding: "10px 12px", borderRadius: 10, border: "1.5px solid #E2E8F0", fontSize: 13, color: "#0F172A", outline: "none", fontFamily: "inherit", background: "white", width: "100%" }} onFocus={(e) => (e.target.style.borderColor = "#2563EB")} onBlur={(e) => (e.target.style.borderColor = "#E2E8F0")} />
                        </div>
                      )}

                      <button onClick={onAdd} style={{ background: "linear-gradient(90deg,#059669,#2563EB)", border: "none", borderRadius: 10, padding: "11px 16px", fontSize: 12, fontWeight: 800, color: "white", cursor: "pointer", fontFamily: "inherit" }}>{buttonLabel}</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(data?.manualInvestments?.length || data?.sipPlans?.length) ? (
              <div style={{ marginTop: 16 }}>
                <button onClick={() => setShowManualList((p) => !p)} style={{ background: "none", border: "1px solid #E2E8F0", borderRadius: 100, padding: "6px 14px", fontSize: 11, fontWeight: 700, color: "#2563EB", cursor: "pointer", fontFamily: "inherit" }}>
                  {showManualList ? "▲ Hide saved additions" : `▼ ${(data?.manualInvestments?.length || 0) + (data?.sipPlans?.length || 0)} saved additions`}
                </button>
                {showManualList && (
                  <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
                    {(data?.manualInvestments || []).map((item) => (
                      <div key={item.id} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 12px" }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>One-time</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", marginBottom: 2, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.schemeName}</div>
                        <div style={{ fontSize: 11, color: "#64748B" }}>{formatCurrency(item.amount)} · {item.date}</div>
                      </div>
                    ))}
                    {(data?.sipPlans || []).map((plan) => (
                      <div key={plan.id} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 12px" }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>SIP Plan</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", marginBottom: 2, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{plan.schemeName}</div>
                        <div style={{ fontSize: 11, color: "#64748B" }}>{formatCurrency(plan.monthlyAmount)}/mo · {plan.startDate}{plan.endDate ? ` → ${plan.endDate}` : ""}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* ── DISCLAIMER ── */}
        <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 14, padding: "12px 16px", fontSize: 11, color: "#94A3B8", lineHeight: 1.7 }}>
          ⚠️ {disclaimerText}
        </div>
      </div>
    </div>
  );
}