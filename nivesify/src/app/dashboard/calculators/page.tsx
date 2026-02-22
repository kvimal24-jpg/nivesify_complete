"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

// ─────────────────────────────────────────────────────────────────────────────
// FORMATTING HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const formatINR = (num: number) => {
  if (!Number.isFinite(num)) return "0";
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(num);
};

const formatCompact = (value: number) => {
  if (!Number.isFinite(value)) return "0";
  const abs = Math.abs(value);
  if (abs >= 1e7) return `${(value / 1e7).toFixed(1)}Cr`;
  if (abs >= 1e5) return `${(value / 1e5).toFixed(1)}L`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(0)}k`;
  return Math.round(value).toString();
};

const formatUnitLabel = (value: number) => {
  if (!Number.isFinite(value) || value === 0) return "Enter an amount";
  const abs = Math.abs(value);
  if (abs >= 1e7) return `≈ ₹${(value / 1e7).toFixed(2)} crore`;
  if (abs >= 1e5) return `≈ ₹${(value / 1e5).toFixed(2)} lakh`;
  if (abs >= 1e3) return `≈ ₹${(value / 1e3).toFixed(1)} thousand`;
  return `≈ ₹${value.toFixed(0)}`;
};

const formatSliderLabel = (value: number, kind?: "amount" | "years" | "percent") => {
  if (!kind || !Number.isFinite(value)) return "";
  if (kind === "amount") return formatUnitLabel(value);
  if (kind === "years") return `${value.toFixed(0)} yrs`;
  return `${value.toFixed(1)}%`;
};

const parseNum = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

// ─────────────────────────────────────────────────────────────────────────────
// DATA TYPES
// ─────────────────────────────────────────────────────────────────────────────
type ChartPoint = { year: number; invested?: number; corpus?: number; remaining?: number; withdrawal?: number };
type DualChartPoint = { year: number; sip?: number; lumpsum?: number; corpus?: number; invested?: number };
type RetirementCashflowPoint = { year: number; income: number; lumpsum: number; totalOutflow: number; corpus: number };
type WithdrawalRow = { id: string; amount: string; year: string };

// ─────────────────────────────────────────────────────────────────────────────
// CALCULATION HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const buildSIPGrowthData = (sipAmount: number, timeYears: number, expectedReturn: number): ChartPoint[] => {
  const monthlyRate = expectedReturn / 100 / 12;
  let totalInvested = 0, corpus = 0;
  const data: ChartPoint[] = [{ year: 0, invested: 0, corpus: 0 }];
  for (let year = 1; year <= timeYears; year++) {
    for (let m = 0; m < 12; m++) { totalInvested += sipAmount; corpus = (corpus + sipAmount) * (1 + monthlyRate); }
    data.push({ year, invested: totalInvested, corpus });
  }
  return data;
};

const buildLumpsumGrowthData = (lumpsumAmount: number, timeYears: number, expectedReturn: number): ChartPoint[] => {
  const annualRate = expectedReturn / 100;
  let corpus = lumpsumAmount;
  const data: ChartPoint[] = [{ year: 0, invested: lumpsumAmount, corpus: lumpsumAmount }];
  for (let year = 1; year <= timeYears; year++) {
    corpus *= 1 + annualRate;
    data.push({ year, invested: lumpsumAmount, corpus });
  }
  return data;
};

const buildSWPData = (corpusAmount: number, withdrawalYears: number, expectedReturn: number, monthlySWP: number): ChartPoint[] => {
  const monthlyRate = expectedReturn / 100 / 12;
  let corpus = corpusAmount;
  const data: ChartPoint[] = [{ year: 0, remaining: corpusAmount }];
  for (let year = 1; year <= withdrawalYears; year++) {
    for (let m = 0; m < 12; m++) { corpus = corpus * (1 + monthlyRate) - monthlySWP; if (corpus < 0) corpus = 0; }
    data.push({ year, remaining: corpus });
  }
  return data;
};

const buildLimitedSIPData = (sipAmount: number, sipPeriodYears: number, totalGrowthPeriodYears: number, expectedReturn: number): ChartPoint[] => {
  const monthlyRate = expectedReturn / 100 / 12;
  let totalInvested = 0, corpus = 0;
  const data: ChartPoint[] = [{ year: 0, invested: 0, corpus: 0 }];
  for (let year = 1; year <= totalGrowthPeriodYears; year++) {
    if (year <= sipPeriodYears) {
      for (let m = 0; m < 12; m++) { totalInvested += sipAmount; corpus = (corpus + sipAmount) * (1 + monthlyRate); }
    } else { corpus *= Math.pow(1 + monthlyRate, 12); }
    data.push({ year, invested: totalInvested, corpus });
  }
  return data;
};

const buildSipPlusLumpsumData = (sipAmount: number, lumpsumAmount: number, timeYears: number, expectedReturn: number): DualChartPoint[] => {
  const monthlyRate = expectedReturn / 100 / 12;
  let totalInvested = lumpsumAmount, corpus = lumpsumAmount;
  const data: DualChartPoint[] = [{ year: 0, invested: lumpsumAmount, corpus: lumpsumAmount }];
  for (let year = 1; year <= timeYears; year++) {
    for (let m = 0; m < 12; m++) { totalInvested += sipAmount; corpus = (corpus + sipAmount) * (1 + monthlyRate); }
    data.push({ year, invested: totalInvested, corpus });
  }
  return data;
};

const buildSipAndLumpsumGoalData = (sipAmount: number, lumpsumAmount: number, timeYears: number, expectedReturn: number): DualChartPoint[] => {
  const monthlyRate = expectedReturn / 100 / 12;
  const annualRate = expectedReturn / 100;
  let totalSipInvested = 0, currentSipCorpus = 0, currentLumpsumCorpus = lumpsumAmount;
  const data: DualChartPoint[] = [{ year: 0, sip: 0, lumpsum: lumpsumAmount, corpus: lumpsumAmount }];
  for (let year = 1; year <= timeYears; year++) {
    for (let m = 0; m < 12; m++) { totalSipInvested += sipAmount; currentSipCorpus = (currentSipCorpus + sipAmount) * (1 + monthlyRate); }
    currentLumpsumCorpus *= 1 + annualRate;
    data.push({ year, sip: totalSipInvested, lumpsum: lumpsumAmount, corpus: currentSipCorpus + currentLumpsumCorpus });
  }
  return data;
};

const buildInflationAdjustedSWPData = (initialCorpus: number, withdrawalYears: number, expectedReturn: number, inflationRate: number, initialMonthlySWP: number): ChartPoint[] => {
  const monthlyReturnRate = expectedReturn / 100 / 12;
  const monthlyInflationRate = inflationRate / 100 / 12;
  let corpus = initialCorpus, monthlySWP = initialMonthlySWP;
  const data: ChartPoint[] = [{ year: 0, remaining: initialCorpus, withdrawal: 0 }];
  for (let year = 1; year <= withdrawalYears; year++) {
    let annualWithdrawal = 0;
    for (let m = 0; m < 12; m++) {
      corpus = corpus * (1 + monthlyReturnRate) - monthlySWP;
      annualWithdrawal += monthlySWP;
      if (corpus < 0) corpus = 0;
      if (m < 11) monthlySWP *= 1 + monthlyInflationRate;
    }
    data.push({ year, remaining: corpus, withdrawal: annualWithdrawal });
    monthlySWP = initialMonthlySWP * Math.pow(1 + monthlyInflationRate, year * 12);
  }
  return data;
};

const formatWithdrawalSummary = (rows: WithdrawalRow[]) => {
  const cleaned = rows.map(r => ({ amount: parseNum(r.amount), year: parseNum(r.year) }))
    .filter(r => r.amount > 0 && r.year > 0).sort((a, b) => a.year - b.year)
    .map(r => `₹${formatINR(r.amount)} in year ${r.year}`);
  return cleaned.length > 0 ? cleaned.join("; ") : "No planned lump sums added";
};

// ─────────────────────────────────────────────────────────────────────────────
// SCROLL REVEAL
// ─────────────────────────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); observer.disconnect(); } }, { threshold: 0.05 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)", transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`, ...style }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION LABEL PILL
// ─────────────────────────────────────────────────────────────────────────────
function SectionLabel({ text, color = "#059669", bg = "rgba(5,150,105,0.08)", border = "rgba(5,150,105,0.2)" }: {
  text: string; color?: string; bg?: string; border?: string;
}) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", background: bg, border: `1px solid ${border}`, borderRadius: "100px", padding: "4px 13px", marginBottom: "10px" }}>
      <span style={{ fontSize: "11px", fontWeight: 700, color, letterSpacing: "0.09em", textTransform: "uppercase" }}>{text}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// JOURNEY NAV
// ─────────────────────────────────────────────────────────────────────────────
const SECTIONS = [
  { id: "direction", label: "Direction", emoji: "🎯", desc: "Name your financial goal", color: "#059669", bg: "rgba(5,150,105,0.08)", border: "rgba(5,150,105,0.2)",
    tools: [{ label: "SIP for Goal", anchor: "calc-sip-goal" }, { label: "Lumpsum for Goal", anchor: "calc-lumpsum-goal" }] },
  { id: "building", label: "Building", emoji: "🌱", desc: "Watch your money grow", color: "#2563EB", bg: "rgba(37,99,235,0.08)", border: "rgba(37,99,235,0.2)",
    tools: [{ label: "SIP Future Value", anchor: "calc-sip-fv" }, { label: "Lumpsum Future Value", anchor: "calc-lumpsum-fv" }, { label: "SIP + One-time", anchor: "calc-sip-plus-lumpsum" }] },
  { id: "optimising", label: "Optimising", emoji: "⚙️", desc: "Fine-tune your plan", color: "#7C3AED", bg: "rgba(124,58,237,0.08)", border: "rgba(124,58,237,0.2)",
    tools: [{ label: "Limited SIP FV", anchor: "calc-limited-sip-fv" }, { label: "Limited SIP Goal", anchor: "calc-limited-sip-goal" }, { label: "One-time + SIP", anchor: "calc-one-time-if-sip" }, { label: "SIP + One-time", anchor: "calc-sip-if-one-time" }] },
  { id: "living-off-money", label: "Withdrawals", emoji: "💸", desc: "Live off what you built", color: "#D97706", bg: "rgba(217,119,6,0.08)", border: "rgba(217,119,6,0.2)",
    tools: [{ label: "SWP from Corpus", anchor: "calc-swp" }, { label: "Corpus for SWP", anchor: "calc-swp-corpus" }, { label: "Inflation SWP", anchor: "calc-inflation-swp" }] },
  { id: "readiness", label: "Retirement", emoji: "🏖️", desc: "Full retirement picture", color: "#DC2626", bg: "rgba(220,38,38,0.08)", border: "rgba(220,38,38,0.2)",
    tools: [{ label: "Retirement Analysis", anchor: "calc-retirement" }] },
];

// ─────────────────────────────────────────────────────────────────────────────
// STICKY SECTION NAV
// ─────────────────────────────────────────────────────────────────────────────
function StickyNav({ activeSection, onSelect }: { activeSection: string; onSelect: (id: string) => void }) {
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(248,250,252,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E2E8F0", padding: "10px 16px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", gap: "6px", overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => onSelect(s.id)} style={{
            flexShrink: 0, display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "100px",
            border: activeSection === s.id ? `1.5px solid ${s.color}` : "1.5px solid #E2E8F0",
            background: activeSection === s.id ? s.bg : "white",
            color: activeSection === s.id ? s.color : "#64748B",
            fontSize: "12px", fontWeight: activeSection === s.id ? 700 : 500,
            cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
            transition: "all 0.2s",
          }}>
            <span>{s.emoji}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INPUT FIELD
// ─────────────────────────────────────────────────────────────────────────────
function InputField({ label, value, onChange, suffix, placeholder, indicator, range, color = "#059669" }: {
  label: string; value: string; onChange: (v: string) => void;
  suffix?: string; placeholder?: string; indicator?: "amount" | "years" | "percent";
  range?: { min: number; max: number; step: number; formatLabel?: (v: number) => string };
  color?: string;
}) {
  const numVal = parseNum(value);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ fontSize: "10.5px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          inputMode="decimal"
          style={{
            width: "100%", padding: "10px 14px", paddingRight: suffix ? "36px" : "14px",
            borderRadius: "12px", border: "1.5px solid #E2E8F0", background: "white",
            fontSize: "14px", fontWeight: 600, color: "#0F172A", outline: "none",
            fontFamily: "inherit", boxSizing: "border-box",
            transition: "border-color 0.2s",
          }}
          onFocus={e => (e.currentTarget.style.borderColor = color)}
          onBlur={e => (e.currentTarget.style.borderColor = "#E2E8F0")}
        />
        {suffix && <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "12px", color: "#94A3B8", fontWeight: 600 }}>{suffix}</span>}
      </div>
      {range && (
        <>
          <input
            type="range" min={range.min} max={range.max} step={range.step}
            value={Number.isFinite(numVal) ? Math.min(Math.max(numVal, range.min), range.max) : range.min}
            onChange={e => onChange(e.target.value)}
            style={{ width: "100%", accentColor: color, cursor: "pointer" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#94A3B8" }}>
            <span>{range.formatLabel ? range.formatLabel(range.min) : range.min}</span>
            <span style={{ color, fontWeight: 700 }}>{formatSliderLabel(numVal, indicator)}</span>
            <span>{range.formatLabel ? range.formatLabel(range.max) : range.max}</span>
          </div>
        </>
      )}
      {!range && indicator && (
        <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 500 }}>{formatSliderLabel(numVal, indicator)}</span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CALCULATE BUTTON
// ─────────────────────────────────────────────────────────────────────────────
function CalcButton({ label, onClick, color = "#059669" }: { label: string; onClick: () => void; color?: string }) {
  return (
    <button onClick={onClick} style={{
      padding: "11px 24px", borderRadius: "100px",
      background: `linear-gradient(90deg, ${color}, ${color}CC)`,
      color: "white", fontSize: "12px", fontWeight: 700,
      letterSpacing: "0.06em", textTransform: "uppercase",
      border: "none", cursor: "pointer", fontFamily: "inherit",
      boxShadow: `0 4px 16px ${color}40`,
      transition: "transform 0.15s, box-shadow 0.15s",
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 8px 24px ${color}55`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 16px ${color}40`; }}
    >
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RESULT CARD
// ─────────────────────────────────────────────────────────────────────────────
function ResultCard({ title, value, message, emoji, tone = "neutral", color = "#059669", bg = "rgba(5,150,105,0.06)", border = "rgba(5,150,105,0.2)" }: {
  title: string; value: string; message: string; emoji?: string;
  tone?: "positive" | "negative" | "neutral"; color?: string; bg?: string; border?: string;
}) {
  return (
    <div style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: "20px", padding: "20px 22px" }}>
      <div style={{ fontSize: "10px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
        {emoji && <span style={{ marginRight: "5px" }}>{emoji}</span>}{title}
      </div>
      <div style={{ fontSize: "clamp(20px,4vw,28px)", fontWeight: 900, color, lineHeight: 1.1, marginBottom: "8px" }}>{value}</div>
      <p style={{ fontSize: "11.5px", color: "#64748B", lineHeight: 1.65, margin: 0 }}>{message}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHART TOOLTIP
// ─────────────────────────────────────────────────────────────────────────────
// We define a safe, self-contained tooltip prop type instead of relying on
// Recharts internal type paths (which vary across versions and cause TS errors).
type SafePayloadItem = {
  dataKey?: string | number;
  name?: string | number;
  value?: string | number | null;
  color?: string;
  payload?: Record<string, unknown>;
};
type SafeTooltipProps = {
  active?: boolean;
  payload?: SafePayloadItem[];
  label?: string | number;
};

function ChartTooltip({ active, payload, label }: SafeTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div style={{ background: "white", border: "1.5px solid #E2E8F0", borderRadius: "14px", padding: "12px 16px", boxShadow: "0 8px 24px rgba(0,0,0,0.1)", fontFamily: "inherit" }}>
      <div style={{ fontSize: "10px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Year {String(label ?? "")}</div>
      {payload.map((entry, idx) => (
        <div key={`${String(entry.dataKey ?? "entry")}-${idx}`} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: entry.color ?? "#94A3B8", flexShrink: 0 }} />
          <span style={{ fontSize: "11.5px", color: "#475569", flex: 1 }}>{String(entry.name ?? "")}</span>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#0F172A" }}>₹{formatINR(Number(entry.value ?? 0))}</span>
        </div>
      ))}
    </div>
  );
}

function RetirementTooltip({ active, payload, label }: SafeTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0]?.payload as RetirementCashflowPoint | undefined;
  if (!data) return null;
  return (
    <div style={{ background: "white", border: "1.5px solid #E2E8F0", borderRadius: "14px", padding: "12px 16px", boxShadow: "0 8px 24px rgba(0,0,0,0.1)", fontFamily: "inherit" }}>
      <div style={{ fontSize: "10px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Year {String(label ?? "")}</div>
      {[
        { label: "Corpus remaining", value: data.corpus, color: "#059669" },
        { label: "Total withdrawn", value: data.totalOutflow, color: "#DC2626" },
        ...(data.lumpsum > 0 ? [{ label: "Goal withdrawal", value: data.lumpsum, color: "#D97706" }] : []),
      ].map(item => (
        <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: item.color, flexShrink: 0 }} />
          <span style={{ fontSize: "11.5px", color: "#475569", flex: 1 }}>{item.label}</span>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#0F172A" }}>₹{formatINR(item.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHART WRAPPER — styled container for charts
// ─────────────────────────────────────────────────────────────────────────────
function ChartCard({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) {
  return (
    <div style={{ background: "white", border: "1.5px solid #E2E8F0", borderRadius: "20px", padding: "16px 12px 12px", overflow: "hidden" }}>
      <div style={{ fontSize: "10px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px", paddingLeft: "4px" }}>{title}</div>
      <div style={{ height: "200px" }}>{children}</div>
      {note && <div style={{ fontSize: "10px", color: "#CBD5E1", textAlign: "center", marginTop: "8px", fontStyle: "italic" }}>{note}</div>}
    </div>
  );
}

const axisStyle = { tickLine: false, axisLine: false, tick: { fill: "#CBD5E1", fontSize: 9, fontFamily: "inherit" } };
const gridStyle = { stroke: "#F1F5F9", strokeDasharray: "3 3" };

// ─────────────────────────────────────────────────────────────────────────────
// SECTION SHELL
// ─────────────────────────────────────────────────────────────────────────────
function SectionShell({ id, sectionMeta, children }: {
  id: string;
  sectionMeta: typeof SECTIONS[0];
  children: React.ReactNode;
}) {
  return (
    <section id={id} style={{ scrollMarginTop: "60px" }}>
      <Reveal>
        <div style={{ background: "white", borderRadius: "28px", border: "1.5px solid #E2E8F0", overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.05)", marginBottom: "28px" }}>
          {/* Section Header */}
          <div style={{ background: `linear-gradient(135deg, ${sectionMeta.bg.replace("0.08", "0.12")}, transparent)`, borderBottom: `1px solid ${sectionMeta.border}`, padding: "24px 28px 20px" }}>
            <SectionLabel text={`${sectionMeta.emoji} ${sectionMeta.label}`} color={sectionMeta.color} bg={sectionMeta.bg} border={sectionMeta.border} />
            <h2 style={{ fontSize: "clamp(18px,3vw,24px)", fontWeight: 900, color: "#0F172A", margin: "0 0 4px", letterSpacing: "-0.02em" }}>{sectionMeta.desc}</h2>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "10px" }}>
              {sectionMeta.tools.map(t => (
                <button key={t.label} onClick={() => { const el = document.getElementById(t.anchor); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }} style={{ fontSize: "10.5px", fontWeight: 600, color: sectionMeta.color, background: sectionMeta.bg, border: `1px solid ${sectionMeta.border}`, borderRadius: "100px", padding: "4px 12px", cursor: "pointer", fontFamily: "inherit", transition: "opacity 0.15s" }} onMouseEnter={e => (e.currentTarget.style.opacity = "0.75")} onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>{t.label} ↓</button>
              ))}
            </div>
          </div>
          <div style={{ padding: "24px 28px" }}>{children}</div>
        </div>
      </Reveal>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CALCULATOR CARD (collapsible)
// ─────────────────────────────────────────────────────────────────────────────
function CalcCard({ id, title, description, children, color = "#059669", defaultOpen = true }: {
  id?: string; title: string; description: string; children: React.ReactNode; color?: string; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const cardRef = useRef<HTMLDivElement>(null);
  const toggle = () => {
    setOpen(p => { const next = !p; if (next) requestAnimationFrame(() => cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })); return next; });
  };
  return (
    <div id={id} ref={cardRef} style={{ background: "#F8FAFC", borderRadius: "20px", border: "1.5px solid #E2E8F0", overflow: "hidden", scrollMarginTop: "80px", marginBottom: "16px" }}>
      <button onClick={toggle} style={{ width: "100%", padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
        <div>
          <div style={{ fontSize: "clamp(14px,2vw,16px)", fontWeight: 800, color: "#0F172A", marginBottom: "3px" }}>{title}</div>
          <div style={{ fontSize: "11.5px", color: "#64748B", lineHeight: 1.5 }}>{description}</div>
        </div>
        <div style={{ flexShrink: 0, background: open ? color : "#F1F5F9", color: open ? "white" : "#94A3B8", borderRadius: "100px", padding: "4px 12px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: "2px", transition: "all 0.2s" }}>
          {open ? "Collapse" : "Expand"}
        </div>
      </button>
      {open && <div style={{ padding: "4px 22px 22px", borderTop: "1px solid #E2E8F0" }}><div style={{ paddingTop: "18px", display: "flex", flexDirection: "column", gap: "18px" }}>{children}</div></div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INFO BOX
// ─────────────────────────────────────────────────────────────────────────────
function InfoBox({ icon, text, color = "#059669", bg = "rgba(5,150,105,0.06)", border = "rgba(5,150,105,0.15)" }: {
  icon: string; text: string; color?: string; bg?: string; border?: string;
}) {
  return (
    <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", background: bg, border: `1px solid ${border}`, borderRadius: "12px", padding: "11px 14px" }}>
      <span style={{ fontSize: "16px", flexShrink: 0 }}>{icon}</span>
      <p style={{ fontSize: "11.5px", color: "#475569", lineHeight: 1.65, margin: 0 }}>{text}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INSIGHTS ROW — shows stat pills above results
// ─────────────────────────────────────────────────────────────────────────────
function InsightPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "white", border: `1.5px solid ${color}25`, borderRadius: "14px", padding: "10px 14px", flex: 1, minWidth: "80px" }}>
      <div style={{ fontSize: "clamp(13px,2.5vw,17px)", fontWeight: 900, color }}>{value}</div>
      <div style={{ fontSize: "9.5px", fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "2px", textAlign: "center" }}>{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NEXT STEP NUDGE
// ─────────────────────────────────────────────────────────────────────────────
function NextStep({ label, onSelect, color = "#059669" }: { label: string; onSelect: () => void; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", background: `${color}08`, border: `1px dashed ${color}40`, borderRadius: "12px", padding: "12px 16px" }}>
      <span style={{ fontSize: "14px" }}>→</span>
      <span style={{ fontSize: "12px", color: "#64748B" }}>Ready to explore more?</span>
      <button onClick={onSelect} style={{ marginLeft: "auto", fontSize: "11px", fontWeight: 700, color, background: `${color}10`, border: `1px solid ${color}30`, borderRadius: "100px", padding: "5px 13px", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
        {label} →
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function LifeCalculatorsPage() {
  const [activeSection, setActiveSection] = useState("direction");

  // ── State: SIP Goal ──
  const [sipGoalInputs, setSipGoalInputs] = useState({ goalAmount: "1500000", timeYears: "10", expectedReturn: "12" });
  const [sipGoalResult, setSipGoalResult] = useState<{ sip: number; totalInvested: number; gains: number; chart: ChartPoint[] } | null>(null);

  // ── State: Lumpsum Goal ──
  const [lumpsumGoalInputs, setLumpsumGoalInputs] = useState({ goalAmount: "2500000", timeYears: "8", expectedReturn: "11" });
  const [lumpsumGoalResult, setLumpsumGoalResult] = useState<{ corpus: number; chart: ChartPoint[] } | null>(null);

  // ── State: SIP FV ──
  const [sipFVInputs, setSipFVInputs] = useState({ sipAmount: "15000", timeYears: "10", expectedReturn: "12" });
  const [sipFVResult, setSipFVResult] = useState<{ corpus: number; totalInvested: number; gains: number; chart: ChartPoint[] } | null>(null);

  // ── State: Lumpsum FV ──
  const [lumpsumFVInputs, setLumpsumFVInputs] = useState({ lumpsumAmount: "500000", timeYears: "12", expectedReturn: "10" });
  const [lumpsumFVResult, setLumpsumFVResult] = useState<{ corpus: number; gain: number; chart: ChartPoint[] } | null>(null);

  // ── State: SIP + Lumpsum ──
  const [sipPlusLumpsumInputs, setSipPlusLumpsumInputs] = useState({ monthlySIP: "15000", lumpsumAmount: "300000", timeYears: "12", expectedReturn: "12" });
  const [sipPlusLumpsumResult, setSipPlusLumpsumResult] = useState<{ corpus: number; chart: DualChartPoint[] } | null>(null);

  // ── State: Limited SIP FV ──
  const [limitedSipFVInputs, setLimitedSipFVInputs] = useState({ monthlySIP: "20000", sipPeriodYears: "7", totalGrowthYears: "15", expectedReturn: "12" });
  const [limitedSipFVResult, setLimitedSipFVResult] = useState<{ corpus: number; chart: ChartPoint[] } | null>(null);

  // ── State: Limited SIP Goal ──
  const [limitedSipGoalInputs, setLimitedSipGoalInputs] = useState({ goalAmount: "3500000", sipPeriodYears: "6", totalGrowthYears: "15", expectedReturn: "12" });
  const [limitedSipGoalResult, setLimitedSipGoalResult] = useState<{ sip: number; chart: ChartPoint[] } | null>(null);

  // ── State: One-time if SIP ──
  const [oneTimeIfSipInputs, setOneTimeIfSipInputs] = useState({ goalAmount: "2000000", monthlySIP: "12000", timeYears: "10", expectedReturn: "11" });
  const [oneTimeIfSipResult, setOneTimeIfSipResult] = useState<{ oneTime: number; chart: DualChartPoint[] } | null>(null);

  // ── State: SIP if One-time ──
  const [sipIfOneTimeInputs, setSipIfOneTimeInputs] = useState({ goalAmount: "2000000", lumpsumAmount: "400000", timeYears: "10", expectedReturn: "11" });
  const [sipIfOneTimeResult, setSipIfOneTimeResult] = useState<{ sip: number; chart: DualChartPoint[] } | null>(null);

  // ── State: SWP ──
  const [swpInputs, setSwpInputs] = useState({ corpusAmount: "5000000", withdrawalYears: "25", expectedReturn: "8" });
  const [swpResult, setSwpResult] = useState<{ monthly: number; chart: ChartPoint[] } | null>(null);

  // ── State: Corpus for SWP ──
  const [swpCorpusInputs, setSwpCorpusInputs] = useState({ monthlySWP: "40000", withdrawalYears: "25", expectedReturn: "8" });
  const [swpCorpusResult, setSwpCorpusResult] = useState<{ corpus: number; chart: ChartPoint[] } | null>(null);

  // ── State: Inflation SWP ──
  const [inflationSwpInputs, setInflationSwpInputs] = useState({ corpusAmount: "6000000", withdrawalYears: "25", expectedReturn: "8", inflationRate: "6" });
  const [inflationSwpResult, setInflationSwpResult] = useState<{ monthly: number; chart: ChartPoint[] } | null>(null);

  // ── State: Retirement ──
  const [retirementInputs, setRetirementInputs] = useState({
    currentCorpus: "1200000", monthlySIP: "20000", yearsToRetirement: "20",
    desiredMonthlyIncome: "75000", retirementDuration: "25",
    expectedReturnPre: "11", expectedReturnPost: "7", inflationRate: "6",
  });
  const [retirementWithdrawals, setRetirementWithdrawals] = useState<WithdrawalRow[]>([
    { id: "w1", amount: "500000", year: "10" },
    { id: "w2", amount: "300000", year: "20" },
  ]);
  const [retirementResult, setRetirementResult] = useState<{
    projected: number; required: number; shortfall: number;
    desiredIncomeAtRetirement: number; cashflow: RetirementCashflowPoint[];
  } | null>(null);

  const scrollTo = (id: string) => {
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleSectionSelect = (id: string) => {
    setActiveSection(id);
    scrollTo(id);
  };

  // ── Handlers ──
  const handleSipGoal = () => {
    const goalAmount = parseNum(sipGoalInputs.goalAmount);
    const timeYears = parseNum(sipGoalInputs.timeYears);
    const expectedReturn = parseNum(sipGoalInputs.expectedReturn);
    if (goalAmount <= 0 || timeYears <= 0 || expectedReturn < 0) return;
    const monthlyRate = expectedReturn / 100 / 12;
    const totalMonths = timeYears * 12;
    const sipRequired = monthlyRate === 0
      ? goalAmount / totalMonths
      : goalAmount * (monthlyRate / (Math.pow(1 + monthlyRate, totalMonths) - 1)) / (1 + monthlyRate);
    const totalInvested = sipRequired * totalMonths;
    setSipGoalResult({ sip: sipRequired, totalInvested, gains: goalAmount - totalInvested, chart: buildSIPGrowthData(sipRequired, timeYears, expectedReturn) });
    scrollTo("sip-goal-result");
  };

  const handleLumpsumGoal = () => {
    const goalAmount = parseNum(lumpsumGoalInputs.goalAmount);
    const timeYears = parseNum(lumpsumGoalInputs.timeYears);
    const expectedReturn = parseNum(lumpsumGoalInputs.expectedReturn);
    if (goalAmount <= 0 || timeYears <= 0 || expectedReturn < 0) return;
    const annualRate = expectedReturn / 100;
    const lumpsumRequired = annualRate === 0 ? goalAmount : goalAmount / Math.pow(1 + annualRate, timeYears);
    setLumpsumGoalResult({ corpus: lumpsumRequired, chart: buildLumpsumGrowthData(lumpsumRequired, timeYears, expectedReturn) });
    scrollTo("lumpsum-goal-result");
  };

  const handleSipFV = () => {
    const sipAmount = parseNum(sipFVInputs.sipAmount);
    const timeYears = parseNum(sipFVInputs.timeYears);
    const expectedReturn = parseNum(sipFVInputs.expectedReturn);
    if (sipAmount <= 0 || timeYears <= 0 || expectedReturn < 0) return;
    const monthlyRate = expectedReturn / 100 / 12;
    const totalMonths = timeYears * 12;
    const futureValue = monthlyRate === 0 ? sipAmount * totalMonths : sipAmount * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate);
    const totalInvested = sipAmount * totalMonths;
    setSipFVResult({ corpus: futureValue, totalInvested, gains: futureValue - totalInvested, chart: buildSIPGrowthData(sipAmount, timeYears, expectedReturn) });
    scrollTo("sip-fv-result");
  };

  const handleLumpsumFV = () => {
    const lumpsumAmount = parseNum(lumpsumFVInputs.lumpsumAmount);
    const timeYears = parseNum(lumpsumFVInputs.timeYears);
    const expectedReturn = parseNum(lumpsumFVInputs.expectedReturn);
    if (lumpsumAmount <= 0 || timeYears <= 0 || expectedReturn < 0) return;
    const futureValue = lumpsumAmount * Math.pow(1 + expectedReturn / 100, timeYears);
    setLumpsumFVResult({ corpus: futureValue, gain: futureValue - lumpsumAmount, chart: buildLumpsumGrowthData(lumpsumAmount, timeYears, expectedReturn) });
    scrollTo("lumpsum-fv-result");
  };

  const handleSipPlusLumpsum = () => {
    const monthlySIP = parseNum(sipPlusLumpsumInputs.monthlySIP);
    const lumpsumAmount = parseNum(sipPlusLumpsumInputs.lumpsumAmount);
    const timeYears = parseNum(sipPlusLumpsumInputs.timeYears);
    const expectedReturn = parseNum(sipPlusLumpsumInputs.expectedReturn);
    if (monthlySIP <= 0 || lumpsumAmount <= 0 || timeYears <= 0 || expectedReturn < 0) return;
    const monthlyRate = expectedReturn / 100 / 12;
    const totalMonths = timeYears * 12;
    const fvSip = monthlyRate === 0 ? monthlySIP * totalMonths : monthlySIP * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate);
    const fvLumpsum = lumpsumAmount * Math.pow(1 + expectedReturn / 100, timeYears);
    setSipPlusLumpsumResult({ corpus: fvSip + fvLumpsum, chart: buildSipPlusLumpsumData(monthlySIP, lumpsumAmount, timeYears, expectedReturn) });
    scrollTo("sip-plus-lumpsum-result");
  };

  const handleLimitedSipFV = () => {
    const monthlySIP = parseNum(limitedSipFVInputs.monthlySIP);
    const sipPeriodYears = parseNum(limitedSipFVInputs.sipPeriodYears);
    const totalGrowthYears = parseNum(limitedSipFVInputs.totalGrowthYears);
    const expectedReturn = parseNum(limitedSipFVInputs.expectedReturn);
    if (monthlySIP <= 0 || sipPeriodYears <= 0 || totalGrowthYears < sipPeriodYears || expectedReturn < 0) return;
    const monthlyRate = expectedReturn / 100 / 12;
    const sipMonths = sipPeriodYears * 12;
    const corpusAtSipEnd = monthlyRate === 0 ? monthlySIP * sipMonths : monthlySIP * ((Math.pow(1 + monthlyRate, sipMonths) - 1) / monthlyRate) * (1 + monthlyRate);
    const remainingMonths = (totalGrowthYears - sipPeriodYears) * 12;
    const finalCorpus = corpusAtSipEnd * Math.pow(1 + monthlyRate, remainingMonths);
    setLimitedSipFVResult({ corpus: finalCorpus, chart: buildLimitedSIPData(monthlySIP, sipPeriodYears, totalGrowthYears, expectedReturn) });
    scrollTo("limited-sip-fv-result");
  };

  const handleLimitedSipGoal = () => {
    const goalAmount = parseNum(limitedSipGoalInputs.goalAmount);
    const sipPeriodYears = parseNum(limitedSipGoalInputs.sipPeriodYears);
    const totalGrowthYears = parseNum(limitedSipGoalInputs.totalGrowthYears);
    const expectedReturn = parseNum(limitedSipGoalInputs.expectedReturn);
    if (goalAmount <= 0 || sipPeriodYears <= 0 || totalGrowthYears < sipPeriodYears || expectedReturn < 0) return;
    const monthlyRate = expectedReturn / 100 / 12;
    const sipMonths = sipPeriodYears * 12;
    const remainingMonths = (totalGrowthYears - sipPeriodYears) * 12;
    let sipRequired = 0;
    if (monthlyRate === 0) { sipRequired = goalAmount / sipMonths; }
    else {
      const fvOneRupee = ((Math.pow(1 + monthlyRate, sipMonths) - 1) / monthlyRate) * (1 + monthlyRate);
      sipRequired = goalAmount / (fvOneRupee * Math.pow(1 + monthlyRate, remainingMonths));
    }
    setLimitedSipGoalResult({ sip: sipRequired, chart: buildLimitedSIPData(sipRequired, sipPeriodYears, totalGrowthYears, expectedReturn) });
    scrollTo("limited-sip-goal-result");
  };

  const handleOneTimeIfSip = () => {
    const goalAmount = parseNum(oneTimeIfSipInputs.goalAmount);
    const monthlySIP = parseNum(oneTimeIfSipInputs.monthlySIP);
    const timeYears = parseNum(oneTimeIfSipInputs.timeYears);
    const expectedReturn = parseNum(oneTimeIfSipInputs.expectedReturn);
    if (goalAmount <= 0 || monthlySIP <= 0 || timeYears <= 0 || expectedReturn < 0) return;
    const monthlyRate = expectedReturn / 100 / 12;
    const totalMonths = timeYears * 12;
    const fvSip = monthlyRate === 0 ? monthlySIP * totalMonths : monthlySIP * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate);
    const remaining = goalAmount - fvSip;
    const requiredOneTime = remaining <= 0 ? 0 : (expectedReturn / 100 === 0 ? remaining : remaining / Math.pow(1 + expectedReturn / 100, timeYears));
    setOneTimeIfSipResult({ oneTime: requiredOneTime, chart: buildSipAndLumpsumGoalData(monthlySIP, requiredOneTime, timeYears, expectedReturn) });
    scrollTo("one-time-if-sip-result");
  };

  const handleSipIfOneTime = () => {
    const goalAmount = parseNum(sipIfOneTimeInputs.goalAmount);
    const lumpsumAmount = parseNum(sipIfOneTimeInputs.lumpsumAmount);
    const timeYears = parseNum(sipIfOneTimeInputs.timeYears);
    const expectedReturn = parseNum(sipIfOneTimeInputs.expectedReturn);
    if (goalAmount <= 0 || lumpsumAmount <= 0 || timeYears <= 0 || expectedReturn < 0) return;
    const monthlyRate = expectedReturn / 100 / 12;
    const totalMonths = timeYears * 12;
    const fvLumpsum = lumpsumAmount * Math.pow(1 + expectedReturn / 100, timeYears);
    const remaining = goalAmount - fvLumpsum;
    let requiredSIP = 0;
    if (remaining > 0) {
      requiredSIP = monthlyRate === 0 ? remaining / totalMonths : remaining * (monthlyRate / (Math.pow(1 + monthlyRate, totalMonths) - 1)) / (1 + monthlyRate);
    }
    setSipIfOneTimeResult({ sip: requiredSIP, chart: buildSipAndLumpsumGoalData(requiredSIP, lumpsumAmount, timeYears, expectedReturn) });
    scrollTo("sip-if-one-time-result");
  };

  const handleSwp = () => {
    const corpusAmount = parseNum(swpInputs.corpusAmount);
    const withdrawalYears = parseNum(swpInputs.withdrawalYears);
    const expectedReturn = parseNum(swpInputs.expectedReturn);
    if (corpusAmount <= 0 || withdrawalYears <= 0 || expectedReturn < 0) return;
    const monthlyRate = expectedReturn / 100 / 12;
    const totalMonths = withdrawalYears * 12;
    const monthlySWP = monthlyRate === 0 ? corpusAmount / totalMonths : corpusAmount * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -totalMonths)));
    setSwpResult({ monthly: monthlySWP, chart: buildSWPData(corpusAmount, withdrawalYears, expectedReturn, monthlySWP) });
    scrollTo("swp-result");
  };

  const handleSwpCorpus = () => {
    const monthlySWP = parseNum(swpCorpusInputs.monthlySWP);
    const withdrawalYears = parseNum(swpCorpusInputs.withdrawalYears);
    const expectedReturn = parseNum(swpCorpusInputs.expectedReturn);
    if (monthlySWP <= 0 || withdrawalYears <= 0 || expectedReturn < 0) return;
    const monthlyRate = expectedReturn / 100 / 12;
    const totalMonths = withdrawalYears * 12;
    const requiredCorpus = monthlyRate === 0 ? monthlySWP * totalMonths : monthlySWP * ((1 - Math.pow(1 + monthlyRate, -totalMonths)) / monthlyRate);
    setSwpCorpusResult({ corpus: requiredCorpus, chart: buildSWPData(requiredCorpus, withdrawalYears, expectedReturn, monthlySWP) });
    scrollTo("swp-corpus-result");
  };

  const handleInflationSwp = () => {
    const corpusAmount = parseNum(inflationSwpInputs.corpusAmount);
    const withdrawalYears = parseNum(inflationSwpInputs.withdrawalYears);
    const expectedReturn = parseNum(inflationSwpInputs.expectedReturn);
    const inflationRate = parseNum(inflationSwpInputs.inflationRate);
    if (corpusAmount <= 0 || withdrawalYears <= 0 || expectedReturn < 0 || inflationRate < 0) return;
    const totalMonths = withdrawalYears * 12;
    let initialMonthlySWP = 0;
    if (expectedReturn === inflationRate) { initialMonthlySWP = corpusAmount / totalMonths; }
    else {
      const realReturnRate = (1 + expectedReturn / 100) / (1 + inflationRate / 100) - 1;
      const realMonthlyRate = Math.pow(1 + realReturnRate, 1 / 12) - 1;
      initialMonthlySWP = realMonthlyRate === 0 ? corpusAmount / totalMonths : corpusAmount * (realMonthlyRate / (1 - Math.pow(1 + realMonthlyRate, -totalMonths)));
    }
    setInflationSwpResult({ monthly: initialMonthlySWP, chart: buildInflationAdjustedSWPData(corpusAmount, withdrawalYears, expectedReturn, inflationRate, initialMonthlySWP) });
    scrollTo("inflation-swp-result");
  };

  const handleRetirement = () => {
    const currentCorpus = parseNum(retirementInputs.currentCorpus);
    const monthlySIP = parseNum(retirementInputs.monthlySIP);
    const yearsToRetirement = parseNum(retirementInputs.yearsToRetirement);
    const desiredMonthlyIncome = parseNum(retirementInputs.desiredMonthlyIncome);
    const retirementDuration = parseNum(retirementInputs.retirementDuration);
    const expectedReturnPre = parseNum(retirementInputs.expectedReturnPre);
    const expectedReturnPost = parseNum(retirementInputs.expectedReturnPost);
    const inflationRate = parseNum(retirementInputs.inflationRate);
    if (currentCorpus < 0 || desiredMonthlyIncome <= 0 || retirementDuration <= 0 || expectedReturnPre < 0 || expectedReturnPost < 0 || inflationRate < 0) return;

    const monthlyReturnPre = expectedReturnPre / 100 / 12;
    const withdrawals = retirementWithdrawals.map(r => ({ amount: parseNum(r.amount), year: parseNum(r.year) })).filter(r => r.amount > 0 && r.year > 0).sort((a, b) => a.year - b.year);
    const withdrawalsByYear = new Map<number, number>();
    withdrawals.forEach(r => { withdrawalsByYear.set(r.year, (withdrawalsByYear.get(r.year) ?? 0) + r.amount); });

    let projectedCorpus = currentCorpus;
    for (let year = 1; year <= yearsToRetirement; year++) {
      for (let m = 0; m < 12; m++) projectedCorpus = (projectedCorpus + monthlySIP) * (1 + monthlyReturnPre);
      const baseW = withdrawalsByYear.get(year) ?? 0;
      if (baseW > 0) projectedCorpus -= baseW * Math.pow(1 + inflationRate / 100, year);
    }

    const desiredIncomeAtRetirement = desiredMonthlyIncome * Math.pow(1 + inflationRate / 100, yearsToRetirement);
    const totalRetirementMonths = retirementDuration * 12;
    let pvIncome = 0;
    if (expectedReturnPost === inflationRate) { pvIncome = desiredIncomeAtRetirement * totalRetirementMonths; }
    else {
      const realReturnRatePost = (1 + expectedReturnPost / 100) / (1 + inflationRate / 100) - 1;
      const realMonthlyRatePost = Math.pow(1 + realReturnRatePost, 1 / 12) - 1;
      pvIncome = realMonthlyRatePost === 0 ? desiredIncomeAtRetirement * totalRetirementMonths : desiredIncomeAtRetirement * ((1 - Math.pow(1 + realMonthlyRatePost, -totalRetirementMonths)) / realMonthlyRatePost);
    }

    let pvLumpsumWithdrawals = 0;
    withdrawals.forEach(r => {
      if (r.year <= yearsToRetirement || r.year - yearsToRetirement > retirementDuration) return;
      pvLumpsumWithdrawals += (r.amount * Math.pow(1 + inflationRate / 100, r.year)) / Math.pow(1 + expectedReturnPost / 100, r.year - yearsToRetirement);
    });

    const requiredCorpus = pvIncome + pvLumpsumWithdrawals;
    const cashflow: RetirementCashflowPoint[] = [];
    const monthlyReturnPost = expectedReturnPost / 100 / 12;
    const monthlyInflationRate = inflationRate / 100 / 12;
    let corpus = currentCorpus, monthlyIncome = desiredIncomeAtRetirement;

    for (let year = 1; year <= yearsToRetirement + retirementDuration; year++) {
      let incomeOutflow = 0;
      if (year <= yearsToRetirement) {
        for (let m = 0; m < 12; m++) corpus = (corpus + monthlySIP) * (1 + monthlyReturnPre);
      } else {
        for (let m = 0; m < 12; m++) { corpus = corpus * (1 + monthlyReturnPost) - monthlyIncome; incomeOutflow += monthlyIncome; monthlyIncome *= 1 + monthlyInflationRate; }
      }
      const baseW = withdrawalsByYear.get(year) ?? 0;
      const lumpsumOutflow = baseW > 0 ? baseW * Math.pow(1 + inflationRate / 100, year) : 0;
      corpus -= lumpsumOutflow;
      cashflow.push({ year, income: incomeOutflow, lumpsum: lumpsumOutflow, totalOutflow: incomeOutflow + lumpsumOutflow, corpus });
    }

    setRetirementResult({ projected: projectedCorpus, required: requiredCorpus, shortfall: projectedCorpus - requiredCorpus, desiredIncomeAtRetirement, cashflow });
    scrollTo("retirement-result");
  };

  // ── Helper for inputs grid style ──
  const grid2 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" } as const;
  const grid3 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px" } as const;
  const grid4 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "14px" } as const;

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif", color: "#1F2937" }}>

      {/* ── HERO ── */}
      <section style={{ background: "linear-gradient(155deg,#0F172A 0%,#1E3A5F 55%,#065F46 100%)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)", backgroundSize: "28px 28px", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: -80, right: -60, width: "500px", height: "500px", background: "radial-gradient(circle,rgba(16,185,129,0.15) 0%,transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: "1100px", margin: "0 auto", padding: "clamp(32px,5vw,56px) clamp(16px,4vw,32px) clamp(28px,4vw,44px)" }}>
          <Reveal>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "20px", flexWrap: "wrap" }}>
              <a href="/" style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>Nivesify</a>
              <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "11px" }}>/</span>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.45)" }}>Life Calculators</span>
            </div>
          </Reveal>
          <Reveal delay={60}>
            <h1 style={{ fontSize: "clamp(1.75rem,5vw,3.2rem)", fontWeight: 900, color: "white", lineHeight: 1.08, letterSpacing: "-0.03em", marginBottom: "10px", maxWidth: "720px" }}>
              Your Money, Your Goals —{" "}
              <span style={{ background: "linear-gradient(90deg,#34D399 0%,#60A5FA 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Calculated Clearly.
              </span>
            </h1>
          </Reveal>
          <Reveal delay={120}>
            <p style={{ fontSize: "clamp(13px,1.8vw,15px)", color: "rgba(255,255,255,0.62)", lineHeight: 1.75, maxWidth: "500px", marginBottom: "28px" }}>
              From your first SIP to a full retirement plan — understand exactly how much you need, when you'll get there, and how to stay on track. Built for everyday Indian investors.
            </p>
          </Reveal>
          <Reveal delay={180}>
            {/* 5-step journey strip */}
            <div style={{ display: "flex", gap: "8px", overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", marginBottom: "24px", paddingBottom: "4px" }}>
              {SECTIONS.map((s, i) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                  <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "12px", padding: "8px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: "16px", marginBottom: "2px" }}>{s.emoji}</div>
                    <div style={{ fontSize: "9px", fontWeight: 700, color: "rgba(255,255,255,0.7)", whiteSpace: "nowrap" }}>{s.label}</div>
                  </div>
                  {i < SECTIONS.length - 1 && <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "14px", flexShrink: 0 }}>→</span>}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── STICKY SECTION NAV ── */}
      <StickyNav activeSection={activeSection} onSelect={handleSectionSelect} />

      {/* ── BODY ── */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "clamp(24px,4vw,48px) clamp(16px,4vw,32px)" }}>

        {/* ══ DIRECTION ══ */}
        <SectionShell id="direction" sectionMeta={SECTIONS[0]}>

          <CalcCard id="calc-sip-goal" title="₹ SIP Required for Your Goal" description="Tell us your goal, timeline, and expected return — we'll tell you exactly how much to invest every month via SIP." color="#059669">
            <div style={grid3}>
              <InputField label="Goal Amount (₹)" value={sipGoalInputs.goalAmount} onChange={v => setSipGoalInputs(p => ({ ...p, goalAmount: v }))} placeholder="15,00,000" indicator="amount" range={{ min: 100000, max: 100000000, step: 100000, formatLabel: v => formatCompact(v) }} color="#059669" />
              <InputField label="Time Horizon" value={sipGoalInputs.timeYears} onChange={v => setSipGoalInputs(p => ({ ...p, timeYears: v }))} suffix="yrs" placeholder="10" indicator="years" range={{ min: 1, max: 40, step: 1, formatLabel: v => `${v}y` }} color="#059669" />
              <InputField label="Expected Annual Return" value={sipGoalInputs.expectedReturn} onChange={v => setSipGoalInputs(p => ({ ...p, expectedReturn: v }))} suffix="%" placeholder="12" indicator="percent" range={{ min: 1, max: 20, step: 0.5, formatLabel: v => `${v}%` }} color="#059669" />
            </div>
            <InfoBox icon="💡" text="Use 10–12% for equity mutual funds based on long-term Nifty 500 historical returns. Adjust lower for shorter horizons." color="#059669" bg="rgba(5,150,105,0.06)" border="rgba(5,150,105,0.15)" />
            <div><CalcButton label="Calculate My SIP" onClick={handleSipGoal} color="#059669" /></div>

            {sipGoalResult && (
              <div id="sip-goal-result" style={{ display: "flex", flexDirection: "column", gap: "16px", scrollMarginTop: "80px" }}>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <InsightPill label="Monthly SIP" value={`₹${formatCompact(sipGoalResult.sip)}`} color="#059669" />
                  <InsightPill label="Total You Invest" value={`₹${formatCompact(sipGoalResult.totalInvested)}`} color="#2563EB" />
                  <InsightPill label="Market Gains" value={`₹${formatCompact(sipGoalResult.gains)}`} color="#7C3AED" />
                </div>
                <ResultCard title="Monthly SIP Required" emoji="🎯" value={`₹${formatINR(sipGoalResult.sip)}/month`} message={`Invest ₹${formatINR(sipGoalResult.sip)} every month for ${sipGoalInputs.timeYears} years at ${sipGoalInputs.expectedReturn}% return to reach ₹${formatINR(parseNum(sipGoalInputs.goalAmount))}. Out of this, you invest ₹${formatINR(sipGoalResult.totalInvested)} and the market adds ₹${formatINR(sipGoalResult.gains)}.`} color="#059669" bg="rgba(5,150,105,0.06)" border="rgba(5,150,105,0.2)" />
                <ChartCard title="How your corpus builds year by year" note="Green = your SIP corpus  ·  Gold = what you actually put in">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sipGoalResult.chart} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="sipGoalGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#059669" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#059669" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="sipGoalInvGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#D97706" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#D97706" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid {...gridStyle} />
                      <XAxis dataKey="year" {...axisStyle} tickMargin={6} />
                      <YAxis {...axisStyle} tickFormatter={v => formatCompact(v as number)} width={42} />
                      <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#E2E8F0", strokeWidth: 1 }} />
                      <Area type="monotone" dataKey="invested" stroke="#D97706" strokeWidth={2} fill="url(#sipGoalInvGrad)" name="Amount Invested" dot={false} />
                      <Area type="monotone" dataKey="corpus" stroke="#059669" strokeWidth={2.5} fill="url(#sipGoalGrad)" name="Total Corpus" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>
                <NextStep label="See Lumpsum alternative" onSelect={() => scrollTo("calc-lumpsum-goal")} color="#059669" />
              </div>
            )}
          </CalcCard>

          <CalcCard id="calc-lumpsum-goal" title="💰 Lumpsum Required for Your Goal" description="Have a lump sum to invest today? Find out exactly how much to park right now to reach your goal." color="#2563EB" defaultOpen={false}>
            <div style={grid3}>
              <InputField label="Goal Amount (₹)" value={lumpsumGoalInputs.goalAmount} onChange={v => setLumpsumGoalInputs(p => ({ ...p, goalAmount: v }))} placeholder="25,00,000" indicator="amount" range={{ min: 100000, max: 100000000, step: 100000, formatLabel: v => formatCompact(v) }} color="#2563EB" />
              <InputField label="Time Horizon" value={lumpsumGoalInputs.timeYears} onChange={v => setLumpsumGoalInputs(p => ({ ...p, timeYears: v }))} suffix="yrs" indicator="years" range={{ min: 1, max: 40, step: 1, formatLabel: v => `${v}y` }} color="#2563EB" />
              <InputField label="Expected Annual Return" value={lumpsumGoalInputs.expectedReturn} onChange={v => setLumpsumGoalInputs(p => ({ ...p, expectedReturn: v }))} suffix="%" indicator="percent" range={{ min: 1, max: 20, step: 0.5, formatLabel: v => `${v}%` }} color="#2563EB" />
            </div>
            <InfoBox icon="💡" text="Lumpsum works best when you have a windfall — bonus, sale proceeds, or gift money. Give it at least 5+ years to compound meaningfully." color="#2563EB" bg="rgba(37,99,235,0.06)" border="rgba(37,99,235,0.15)" />
            <div><CalcButton label="Calculate Lumpsum" onClick={handleLumpsumGoal} color="#2563EB" /></div>
            {lumpsumGoalResult && (
              <div id="lumpsum-goal-result" style={{ display: "flex", flexDirection: "column", gap: "16px", scrollMarginTop: "80px" }}>
                <ResultCard title="Lumpsum to Invest Today" emoji="💰" value={`₹${formatINR(lumpsumGoalResult.corpus)}`} message={`Invest ₹${formatINR(lumpsumGoalResult.corpus)} today at ${lumpsumGoalInputs.expectedReturn}% p.a. and it will grow to ₹${formatINR(parseNum(lumpsumGoalInputs.goalAmount))} in ${lumpsumGoalInputs.timeYears} years.`} color="#2563EB" bg="rgba(37,99,235,0.06)" border="rgba(37,99,235,0.2)" />
                <ChartCard title="How your lumpsum compounds over time">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={lumpsumGoalResult.chart} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="lsGoalGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563EB" stopOpacity={0.3} /><stop offset="100%" stopColor="#2563EB" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid {...gridStyle} /><XAxis dataKey="year" {...axisStyle} tickMargin={6} /><YAxis {...axisStyle} tickFormatter={v => formatCompact(v as number)} width={42} />
                      <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#E2E8F0", strokeWidth: 1 }} />
                      <Area type="monotone" dataKey="invested" stroke="#D97706" strokeWidth={2} fill="none" strokeDasharray="4 4" name="Amount Invested" dot={false} />
                      <Area type="monotone" dataKey="corpus" stroke="#2563EB" strokeWidth={2.5} fill="url(#lsGoalGrad)" name="Corpus Value" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>
                <NextStep label="Now watch it grow →" onSelect={() => { setActiveSection("building"); scrollTo("building"); }} color="#2563EB" />
              </div>
            )}
          </CalcCard>

        </SectionShell>

        {/* ══ BUILDING ══ */}
        <SectionShell id="building" sectionMeta={SECTIONS[1]}>

          <CalcCard id="calc-sip-fv" title="📈 Future Value of Your SIP" description="Already investing via SIP? See exactly how much your regular investments will grow to." color="#2563EB">
            <div style={grid3}>
              <InputField label="Monthly SIP (₹)" value={sipFVInputs.sipAmount} onChange={v => setSipFVInputs(p => ({ ...p, sipAmount: v }))} indicator="amount" range={{ min: 500, max: 200000, step: 500, formatLabel: v => formatCompact(v) }} color="#2563EB" />
              <InputField label="Investment Period" value={sipFVInputs.timeYears} onChange={v => setSipFVInputs(p => ({ ...p, timeYears: v }))} suffix="yrs" indicator="years" range={{ min: 1, max: 40, step: 1, formatLabel: v => `${v}y` }} color="#2563EB" />
              <InputField label="Expected Annual Return" value={sipFVInputs.expectedReturn} onChange={v => setSipFVInputs(p => ({ ...p, expectedReturn: v }))} suffix="%" indicator="percent" range={{ min: 1, max: 20, step: 0.5, formatLabel: v => `${v}%` }} color="#2563EB" />
            </div>
            <div><CalcButton label="Calculate Future Corpus" onClick={handleSipFV} color="#2563EB" /></div>
            {sipFVResult && (
              <div id="sip-fv-result" style={{ display: "flex", flexDirection: "column", gap: "16px", scrollMarginTop: "80px" }}>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <InsightPill label="Final Corpus" value={`₹${formatCompact(sipFVResult.corpus)}`} color="#2563EB" />
                  <InsightPill label="You Invested" value={`₹${formatCompact(sipFVResult.totalInvested)}`} color="#D97706" />
                  <InsightPill label="Market Added" value={`₹${formatCompact(sipFVResult.gains)}`} color="#059669" />
                </div>
                <ResultCard title="Estimated Corpus at End" emoji="🌱" value={`₹${formatINR(sipFVResult.corpus)}`} message={`Your SIP of ₹${formatINR(parseNum(sipFVInputs.sipAmount))}/month for ${sipFVInputs.timeYears} years grows to ₹${formatINR(sipFVResult.corpus)}. You invest ₹${formatINR(sipFVResult.totalInvested)} and compounding adds ₹${formatINR(sipFVResult.gains)} — that's ${Math.round((sipFVResult.gains / sipFVResult.corpus) * 100)}% coming from growth alone.`} color="#2563EB" bg="rgba(37,99,235,0.06)" border="rgba(37,99,235,0.2)" />
                <ChartCard title="SIP corpus growth — the compounding curve" note="Notice how the gap between corpus and invested widens over time — that's compounding at work">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sipFVResult.chart} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="sipFvGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563EB" stopOpacity={0.3} /><stop offset="100%" stopColor="#2563EB" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid {...gridStyle} /><XAxis dataKey="year" {...axisStyle} tickMargin={6} /><YAxis {...axisStyle} tickFormatter={v => formatCompact(v as number)} width={42} />
                      <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#E2E8F0", strokeWidth: 1 }} />
                      <Area type="monotone" dataKey="invested" stroke="#D97706" strokeWidth={2} fill="none" strokeDasharray="5 5" name="Amount Invested" dot={false} />
                      <Area type="monotone" dataKey="corpus" stroke="#2563EB" strokeWidth={2.5} fill="url(#sipFvGrad)" name="Total Corpus" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>
                <NextStep label="Try Lumpsum FV →" onSelect={() => scrollTo("calc-lumpsum-fv")} color="#2563EB" />
              </div>
            )}
          </CalcCard>

          <CalcCard id="calc-lumpsum-fv" title="🏦 Future Value of a Lumpsum" description="Invested a lump sum in a mutual fund? Watch how it compounds over the years." color="#7C3AED" defaultOpen={false}>
            <div style={grid3}>
              <InputField label="Lumpsum Amount (₹)" value={lumpsumFVInputs.lumpsumAmount} onChange={v => setLumpsumFVInputs(p => ({ ...p, lumpsumAmount: v }))} indicator="amount" range={{ min: 10000, max: 50000000, step: 10000, formatLabel: v => formatCompact(v) }} color="#7C3AED" />
              <InputField label="Investment Period" value={lumpsumFVInputs.timeYears} onChange={v => setLumpsumFVInputs(p => ({ ...p, timeYears: v }))} suffix="yrs" indicator="years" range={{ min: 1, max: 40, step: 1, formatLabel: v => `${v}y` }} color="#7C3AED" />
              <InputField label="Expected Annual Return" value={lumpsumFVInputs.expectedReturn} onChange={v => setLumpsumFVInputs(p => ({ ...p, expectedReturn: v }))} suffix="%" indicator="percent" range={{ min: 1, max: 20, step: 0.5, formatLabel: v => `${v}%` }} color="#7C3AED" />
            </div>
            <div><CalcButton label="Calculate Growth" onClick={handleLumpsumFV} color="#7C3AED" /></div>
            {lumpsumFVResult && (
              <div id="lumpsum-fv-result" style={{ display: "flex", flexDirection: "column", gap: "16px", scrollMarginTop: "80px" }}>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <InsightPill label="Final Value" value={`₹${formatCompact(lumpsumFVResult.corpus)}`} color="#7C3AED" />
                  <InsightPill label="Gain" value={`₹${formatCompact(lumpsumFVResult.gain)}`} color="#059669" />
                  <InsightPill label="Times money" value={`${(lumpsumFVResult.corpus / parseNum(lumpsumFVInputs.lumpsumAmount)).toFixed(1)}x`} color="#D97706" />
                </div>
                <ResultCard title="Your Lumpsum Grows To" emoji="🏦" value={`₹${formatINR(lumpsumFVResult.corpus)}`} message={`₹${formatINR(parseNum(lumpsumFVInputs.lumpsumAmount))} invested today at ${lumpsumFVInputs.expectedReturn}% p.a. becomes ₹${formatINR(lumpsumFVResult.corpus)} in ${lumpsumFVInputs.timeYears} years — a ${(lumpsumFVResult.corpus / parseNum(lumpsumFVInputs.lumpsumAmount)).toFixed(1)}x return.`} color="#7C3AED" bg="rgba(124,58,237,0.06)" border="rgba(124,58,237,0.2)" />
                <ChartCard title="Exponential compounding curve">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={lumpsumFVResult.chart} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="lsFvGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.3} /><stop offset="100%" stopColor="#7C3AED" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid {...gridStyle} /><XAxis dataKey="year" {...axisStyle} tickMargin={6} /><YAxis {...axisStyle} tickFormatter={v => formatCompact(v as number)} width={42} />
                      <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#E2E8F0", strokeWidth: 1 }} />
                      <Area type="monotone" dataKey="invested" stroke="#CBD5E1" strokeWidth={1.5} fill="none" strokeDasharray="4 4" name="Invested" dot={false} />
                      <Area type="monotone" dataKey="corpus" stroke="#7C3AED" strokeWidth={2.5} fill="url(#lsFvGrad)" name="Corpus Value" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>
                <NextStep label="Combine SIP + Lumpsum →" onSelect={() => scrollTo("calc-sip-plus-lumpsum")} color="#7C3AED" />
              </div>
            )}
          </CalcCard>

          <CalcCard id="calc-sip-plus-lumpsum" title="⚡ SIP + One-time Investment" description="Starting with a lumpsum and adding monthly SIPs? This shows your combined wealth." color="#059669" defaultOpen={false}>
            <div style={grid4}>
              <InputField label="Monthly SIP (₹)" value={sipPlusLumpsumInputs.monthlySIP} onChange={v => setSipPlusLumpsumInputs(p => ({ ...p, monthlySIP: v }))} indicator="amount" range={{ min: 500, max: 200000, step: 500, formatLabel: v => formatCompact(v) }} color="#059669" />
              <InputField label="One-time Investment (₹)" value={sipPlusLumpsumInputs.lumpsumAmount} onChange={v => setSipPlusLumpsumInputs(p => ({ ...p, lumpsumAmount: v }))} indicator="amount" range={{ min: 10000, max: 50000000, step: 10000, formatLabel: v => formatCompact(v) }} color="#059669" />
              <InputField label="Period" value={sipPlusLumpsumInputs.timeYears} onChange={v => setSipPlusLumpsumInputs(p => ({ ...p, timeYears: v }))} suffix="yrs" indicator="years" range={{ min: 1, max: 40, step: 1, formatLabel: v => `${v}y` }} color="#059669" />
              <InputField label="Expected Return" value={sipPlusLumpsumInputs.expectedReturn} onChange={v => setSipPlusLumpsumInputs(p => ({ ...p, expectedReturn: v }))} suffix="%" indicator="percent" range={{ min: 1, max: 20, step: 0.5, formatLabel: v => `${v}%` }} color="#059669" />
            </div>
            <div><CalcButton label="Calculate Combined Corpus" onClick={handleSipPlusLumpsum} color="#059669" /></div>
            {sipPlusLumpsumResult && (
              <div id="sip-plus-lumpsum-result" style={{ display: "flex", flexDirection: "column", gap: "16px", scrollMarginTop: "80px" }}>
                <ResultCard title="Combined Future Corpus" emoji="⚡" value={`₹${formatINR(sipPlusLumpsumResult.corpus)}`} message={`Your ₹${formatINR(parseNum(sipPlusLumpsumInputs.lumpsumAmount))} lumpsum + ₹${formatINR(parseNum(sipPlusLumpsumInputs.monthlySIP))}/month SIP grows to ₹${formatINR(sipPlusLumpsumResult.corpus)} in ${sipPlusLumpsumInputs.timeYears} years.`} color="#059669" bg="rgba(5,150,105,0.06)" border="rgba(5,150,105,0.2)" />
                <ChartCard title="Combined investment vs total corpus">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sipPlusLumpsumResult.chart} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="combinedGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#059669" stopOpacity={0.3} /><stop offset="100%" stopColor="#059669" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid {...gridStyle} /><XAxis dataKey="year" {...axisStyle} tickMargin={6} /><YAxis {...axisStyle} tickFormatter={v => formatCompact(v as number)} width={42} />
                      <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#E2E8F0", strokeWidth: 1 }} />
                      <Area type="monotone" dataKey="invested" stroke="#D97706" strokeWidth={2} fill="none" strokeDasharray="5 5" name="Total Invested" dot={false} />
                      <Area type="monotone" dataKey="corpus" stroke="#059669" strokeWidth={2.5} fill="url(#combinedGrad)" name="Total Corpus" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>
                <NextStep label="Fine-tune your plan →" onSelect={() => { setActiveSection("optimising"); scrollTo("optimising"); }} color="#059669" />
              </div>
            )}
          </CalcCard>

        </SectionShell>

        {/* ══ OPTIMISING ══ */}
        <SectionShell id="optimising" sectionMeta={SECTIONS[2]}>

          <CalcCard id="calc-limited-sip-fv" title="⏱️ Invest for Fewer Years, Grow for Longer" description="What if you only invest for 7 years but stay invested for 15? See the power of 'invest early, stop early'." color="#7C3AED">
            <div style={grid4}>
              <InputField label="Monthly SIP (₹)" value={limitedSipFVInputs.monthlySIP} onChange={v => setLimitedSipFVInputs(p => ({ ...p, monthlySIP: v }))} indicator="amount" range={{ min: 500, max: 200000, step: 500, formatLabel: v => formatCompact(v) }} color="#7C3AED" />
              <InputField label="You Invest For" value={limitedSipFVInputs.sipPeriodYears} onChange={v => setLimitedSipFVInputs(p => ({ ...p, sipPeriodYears: v }))} suffix="yrs" indicator="years" range={{ min: 1, max: 30, step: 1, formatLabel: v => `${v}y` }} color="#7C3AED" />
              <InputField label="Money Stays Invested For" value={limitedSipFVInputs.totalGrowthYears} onChange={v => setLimitedSipFVInputs(p => ({ ...p, totalGrowthYears: v }))} suffix="yrs" indicator="years" range={{ min: 1, max: 40, step: 1, formatLabel: v => `${v}y` }} color="#7C3AED" />
              <InputField label="Expected Return" value={limitedSipFVInputs.expectedReturn} onChange={v => setLimitedSipFVInputs(p => ({ ...p, expectedReturn: v }))} suffix="%" indicator="percent" range={{ min: 1, max: 20, step: 0.5, formatLabel: v => `${v}%` }} color="#7C3AED" />
            </div>
            <InfoBox icon="🧠" text="This models the 'invest early, stop early' strategy — you stop SIPs after a few years but let the corpus sit and grow. Often more powerful than investing the full period." color="#7C3AED" bg="rgba(124,58,237,0.06)" border="rgba(124,58,237,0.15)" />
            <div><CalcButton label="Calculate Limited SIP" onClick={handleLimitedSipFV} color="#7C3AED" /></div>
            {limitedSipFVResult && (
              <div id="limited-sip-fv-result" style={{ display: "flex", flexDirection: "column", gap: "16px", scrollMarginTop: "80px" }}>
                <ResultCard title="Final Corpus" emoji="⏱️" value={`₹${formatINR(limitedSipFVResult.corpus)}`} message={`SIP of ₹${formatINR(parseNum(limitedSipFVInputs.monthlySIP))}/month for ${limitedSipFVInputs.sipPeriodYears} years, then left to grow — reaches ₹${formatINR(limitedSipFVResult.corpus)} at the ${limitedSipFVInputs.totalGrowthYears}-year mark.`} color="#7C3AED" bg="rgba(124,58,237,0.06)" border="rgba(124,58,237,0.2)" />
                <ChartCard title="SIP phase vs silent compounding phase">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={limitedSipFVResult.chart} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="lSipGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.3} /><stop offset="100%" stopColor="#7C3AED" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid {...gridStyle} /><XAxis dataKey="year" {...axisStyle} tickMargin={6} /><YAxis {...axisStyle} tickFormatter={v => formatCompact(v as number)} width={42} />
                      <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#E2E8F0", strokeWidth: 1 }} />
                      <ReferenceLine x={parseNum(limitedSipFVInputs.sipPeriodYears)} stroke="#7C3AED" strokeDasharray="4 4" label={{ value: "SIP stops", fill: "#7C3AED", fontSize: 9, position: "top" }} />
                      <Area type="monotone" dataKey="invested" stroke="#D97706" strokeWidth={2} fill="none" strokeDasharray="4 4" name="Amount Invested" dot={false} />
                      <Area type="monotone" dataKey="corpus" stroke="#7C3AED" strokeWidth={2.5} fill="url(#lSipGrad)" name="Total Corpus" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>
                <NextStep label="Work backwards from a goal →" onSelect={() => scrollTo("calc-limited-sip-goal")} color="#7C3AED" />
              </div>
            )}
          </CalcCard>

          <CalcCard id="calc-limited-sip-goal" title="🎯 Limited SIP Required for a Goal" description="Know your goal but can only invest for a limited period? Find the SIP amount." color="#DC2626" defaultOpen={false}>
            <div style={grid4}>
              <InputField label="Goal Amount (₹)" value={limitedSipGoalInputs.goalAmount} onChange={v => setLimitedSipGoalInputs(p => ({ ...p, goalAmount: v }))} indicator="amount" range={{ min: 100000, max: 100000000, step: 100000, formatLabel: v => formatCompact(v) }} color="#DC2626" />
              <InputField label="You'll Invest For" value={limitedSipGoalInputs.sipPeriodYears} onChange={v => setLimitedSipGoalInputs(p => ({ ...p, sipPeriodYears: v }))} suffix="yrs" indicator="years" range={{ min: 1, max: 30, step: 1, formatLabel: v => `${v}y` }} color="#DC2626" />
              <InputField label="Total Horizon" value={limitedSipGoalInputs.totalGrowthYears} onChange={v => setLimitedSipGoalInputs(p => ({ ...p, totalGrowthYears: v }))} suffix="yrs" indicator="years" range={{ min: 1, max: 40, step: 1, formatLabel: v => `${v}y` }} color="#DC2626" />
              <InputField label="Expected Return" value={limitedSipGoalInputs.expectedReturn} onChange={v => setLimitedSipGoalInputs(p => ({ ...p, expectedReturn: v }))} suffix="%" indicator="percent" range={{ min: 1, max: 20, step: 0.5, formatLabel: v => `${v}%` }} color="#DC2626" />
            </div>
            <div><CalcButton label="Find My SIP" onClick={handleLimitedSipGoal} color="#DC2626" /></div>
            {limitedSipGoalResult && (
              <div id="limited-sip-goal-result" style={{ display: "flex", flexDirection: "column", gap: "16px", scrollMarginTop: "80px" }}>
                <ResultCard title="Monthly SIP Required" emoji="🎯" value={`₹${formatINR(limitedSipGoalResult.sip)}/month`} message={`Invest ₹${formatINR(limitedSipGoalResult.sip)}/month for ${limitedSipGoalInputs.sipPeriodYears} years, then let it compound silently until year ${limitedSipGoalInputs.totalGrowthYears} to reach ₹${formatINR(parseNum(limitedSipGoalInputs.goalAmount))}.`} color="#DC2626" bg="rgba(220,38,38,0.06)" border="rgba(220,38,38,0.2)" />
                <ChartCard title="Two phases: active investing then silent compounding">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={limitedSipGoalResult.chart} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="lSipGoalGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#DC2626" stopOpacity={0.25} /><stop offset="100%" stopColor="#DC2626" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid {...gridStyle} /><XAxis dataKey="year" {...axisStyle} tickMargin={6} /><YAxis {...axisStyle} tickFormatter={v => formatCompact(v as number)} width={42} />
                      <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#E2E8F0", strokeWidth: 1 }} />
                      <ReferenceLine x={parseNum(limitedSipGoalInputs.sipPeriodYears)} stroke="#DC2626" strokeDasharray="4 4" label={{ value: "SIP stops", fill: "#DC2626", fontSize: 9, position: "top" }} />
                      <Area type="monotone" dataKey="invested" stroke="#D97706" strokeWidth={2} fill="none" strokeDasharray="4 4" name="Amount Invested" dot={false} />
                      <Area type="monotone" dataKey="corpus" stroke="#DC2626" strokeWidth={2.5} fill="url(#lSipGoalGrad)" name="Total Corpus" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            )}
          </CalcCard>

          <CalcCard id="calc-one-time-if-sip" title="🔀 Gap Filler: One-time Top-up on Existing SIP" description="Running a SIP but worried it won't be enough? Find the one-time top-up needed to close the gap." color="#0891B2" defaultOpen={false}>
            <div style={grid4}>
              <InputField label="Goal Amount (₹)" value={oneTimeIfSipInputs.goalAmount} onChange={v => setOneTimeIfSipInputs(p => ({ ...p, goalAmount: v }))} indicator="amount" range={{ min: 100000, max: 100000000, step: 100000, formatLabel: v => formatCompact(v) }} color="#0891B2" />
              <InputField label="Your Existing SIP (₹/mo)" value={oneTimeIfSipInputs.monthlySIP} onChange={v => setOneTimeIfSipInputs(p => ({ ...p, monthlySIP: v }))} indicator="amount" range={{ min: 500, max: 200000, step: 500, formatLabel: v => formatCompact(v) }} color="#0891B2" />
              <InputField label="Time Left" value={oneTimeIfSipInputs.timeYears} onChange={v => setOneTimeIfSipInputs(p => ({ ...p, timeYears: v }))} suffix="yrs" indicator="years" range={{ min: 1, max: 40, step: 1, formatLabel: v => `${v}y` }} color="#0891B2" />
              <InputField label="Expected Return" value={oneTimeIfSipInputs.expectedReturn} onChange={v => setOneTimeIfSipInputs(p => ({ ...p, expectedReturn: v }))} suffix="%" indicator="percent" range={{ min: 1, max: 20, step: 0.5, formatLabel: v => `${v}%` }} color="#0891B2" />
            </div>
            <div><CalcButton label="Find the Gap" onClick={handleOneTimeIfSip} color="#0891B2" /></div>
            {oneTimeIfSipResult && (
              <div id="one-time-if-sip-result" style={{ display: "flex", flexDirection: "column", gap: "16px", scrollMarginTop: "80px" }}>
                <ResultCard title="One-time Top-up Required" emoji="🔀" value={oneTimeIfSipResult.oneTime <= 0 ? "No top-up needed! 🎉" : `₹${formatINR(oneTimeIfSipResult.oneTime)}`} message={oneTimeIfSipResult.oneTime <= 0 ? `Great news! Your SIP of ₹${formatINR(parseNum(oneTimeIfSipInputs.monthlySIP))}/month alone is enough to reach ₹${formatINR(parseNum(oneTimeIfSipInputs.goalAmount))}.` : `Your existing SIP will fall short. Add a one-time ₹${formatINR(oneTimeIfSipResult.oneTime)} investment today to bridge the gap.`} color="#0891B2" bg="rgba(8,145,178,0.06)" border="rgba(8,145,178,0.2)" />
                <ChartCard title="SIP corpus vs goal — see where the gap is">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={oneTimeIfSipResult.chart} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gapGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0891B2" stopOpacity={0.3} /><stop offset="100%" stopColor="#0891B2" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid {...gridStyle} /><XAxis dataKey="year" {...axisStyle} tickMargin={6} /><YAxis {...axisStyle} tickFormatter={v => formatCompact(v as number)} width={42} />
                      <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#E2E8F0", strokeWidth: 1 }} />
                      <Area type="monotone" dataKey="sip" stroke="#D97706" strokeWidth={1.5} fill="none" strokeDasharray="4 4" name="SIP Invested" dot={false} />
                      <Area type="monotone" dataKey="lumpsum" stroke="#CBD5E1" strokeWidth={1.5} fill="none" strokeDasharray="4 4" name="One-time Invested" dot={false} />
                      <Area type="monotone" dataKey="corpus" stroke="#0891B2" strokeWidth={2.5} fill="url(#gapGrad)" name="Total Corpus" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            )}
          </CalcCard>

          <CalcCard id="calc-sip-if-one-time" title="🔃 Already Have a Lumpsum? Find the Remaining SIP" description="Have some savings ready to invest? Find the smaller monthly SIP needed to hit your goal." color="#D97706" defaultOpen={false}>
            <div style={grid4}>
              <InputField label="Goal Amount (₹)" value={sipIfOneTimeInputs.goalAmount} onChange={v => setSipIfOneTimeInputs(p => ({ ...p, goalAmount: v }))} indicator="amount" range={{ min: 100000, max: 100000000, step: 100000, formatLabel: v => formatCompact(v) }} color="#D97706" />
              <InputField label="One-time Investment (₹)" value={sipIfOneTimeInputs.lumpsumAmount} onChange={v => setSipIfOneTimeInputs(p => ({ ...p, lumpsumAmount: v }))} indicator="amount" range={{ min: 10000, max: 50000000, step: 10000, formatLabel: v => formatCompact(v) }} color="#D97706" />
              <InputField label="Time Horizon" value={sipIfOneTimeInputs.timeYears} onChange={v => setSipIfOneTimeInputs(p => ({ ...p, timeYears: v }))} suffix="yrs" indicator="years" range={{ min: 1, max: 40, step: 1, formatLabel: v => `${v}y` }} color="#D97706" />
              <InputField label="Expected Return" value={sipIfOneTimeInputs.expectedReturn} onChange={v => setSipIfOneTimeInputs(p => ({ ...p, expectedReturn: v }))} suffix="%" indicator="percent" range={{ min: 1, max: 20, step: 0.5, formatLabel: v => `${v}%` }} color="#D97706" />
            </div>
            <div><CalcButton label="Calculate SIP Needed" onClick={handleSipIfOneTime} color="#D97706" /></div>
            {sipIfOneTimeResult && (
              <div id="sip-if-one-time-result" style={{ display: "flex", flexDirection: "column", gap: "16px", scrollMarginTop: "80px" }}>
                <ResultCard title="Monthly SIP Needed" emoji="🔃" value={sipIfOneTimeResult.sip <= 0 ? "Your lumpsum is enough! 🎉" : `₹${formatINR(sipIfOneTimeResult.sip)}/month`} message={sipIfOneTimeResult.sip <= 0 ? `Your one-time investment alone will grow past your goal. No SIP needed.` : `With ₹${formatINR(parseNum(sipIfOneTimeInputs.lumpsumAmount))} invested upfront, you only need ₹${formatINR(sipIfOneTimeResult.sip)}/month SIP to reach ₹${formatINR(parseNum(sipIfOneTimeInputs.goalAmount))}.`} color="#D97706" bg="rgba(217,119,6,0.06)" border="rgba(217,119,6,0.2)" />
                <ChartCard title="Lumpsum head-start + SIP top-up = full goal">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sipIfOneTimeResult.chart} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="sipLsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#D97706" stopOpacity={0.3} /><stop offset="100%" stopColor="#D97706" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid {...gridStyle} /><XAxis dataKey="year" {...axisStyle} tickMargin={6} /><YAxis {...axisStyle} tickFormatter={v => formatCompact(v as number)} width={42} />
                      <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#E2E8F0", strokeWidth: 1 }} />
                      <Area type="monotone" dataKey="lumpsum" stroke="#CBD5E1" strokeWidth={1.5} fill="none" strokeDasharray="4 4" name="One-time Invested" dot={false} />
                      <Area type="monotone" dataKey="sip" stroke="#059669" strokeWidth={1.5} fill="none" strokeDasharray="4 4" name="SIP Invested" dot={false} />
                      <Area type="monotone" dataKey="corpus" stroke="#D97706" strokeWidth={2.5} fill="url(#sipLsGrad)" name="Total Corpus" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>
                <NextStep label="Now plan your withdrawals →" onSelect={() => { setActiveSection("living-off-money"); scrollTo("living-off-money"); }} color="#D97706" />
              </div>
            )}
          </CalcCard>

        </SectionShell>

        {/* ══ LIVING OFF MONEY ══ */}
        <SectionShell id="living-off-money" sectionMeta={SECTIONS[3]}>

          <CalcCard id="calc-swp" title="💸 How Much Can I Withdraw Monthly?" description="Built a corpus? Find out the maximum monthly amount you can withdraw without exhausting your fund." color="#D97706">
            <div style={grid3}>
              <InputField label="Your Corpus (₹)" value={swpInputs.corpusAmount} onChange={v => setSwpInputs(p => ({ ...p, corpusAmount: v }))} indicator="amount" range={{ min: 100000, max: 200000000, step: 100000, formatLabel: v => formatCompact(v) }} color="#D97706" />
              <InputField label="Withdrawal Period" value={swpInputs.withdrawalYears} onChange={v => setSwpInputs(p => ({ ...p, withdrawalYears: v }))} suffix="yrs" indicator="years" range={{ min: 1, max: 40, step: 1, formatLabel: v => `${v}y` }} color="#D97706" />
              <InputField label="Expected Return (post-retirement)" value={swpInputs.expectedReturn} onChange={v => setSwpInputs(p => ({ ...p, expectedReturn: v }))} suffix="%" indicator="percent" range={{ min: 1, max: 15, step: 0.5, formatLabel: v => `${v}%` }} color="#D97706" />
            </div>
            <InfoBox icon="⚠️" text="Use a conservative 7–8% for post-retirement return — your portfolio should be in balanced/debt funds at this stage, not pure equity." color="#D97706" bg="rgba(217,119,6,0.06)" border="rgba(217,119,6,0.15)" />
            <div><CalcButton label="Calculate Monthly SWP" onClick={handleSwp} color="#D97706" /></div>
            {swpResult && (
              <div id="swp-result" style={{ display: "flex", flexDirection: "column", gap: "16px", scrollMarginTop: "80px" }}>
                <ResultCard title="Sustainable Monthly Withdrawal" emoji="💸" value={`₹${formatINR(swpResult.monthly)}/month`} message={`Your corpus of ₹${formatINR(parseNum(swpInputs.corpusAmount))} can sustain ₹${formatINR(swpResult.monthly)}/month for ${swpInputs.withdrawalYears} years at ${swpInputs.expectedReturn}% return, reducing to ₹0 at the end.`} color="#D97706" bg="rgba(217,119,6,0.06)" border="rgba(217,119,6,0.2)" />
                <ChartCard title="Corpus depletes steadily over your withdrawal period" note="This assumes equal withdrawals — add inflation below for a more realistic picture">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={swpResult.chart} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="swpGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#D97706" stopOpacity={0.3} /><stop offset="100%" stopColor="#D97706" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid {...gridStyle} /><XAxis dataKey="year" {...axisStyle} tickMargin={6} /><YAxis {...axisStyle} tickFormatter={v => formatCompact(v as number)} width={42} />
                      <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#E2E8F0", strokeWidth: 1 }} />
                      <Area type="monotone" dataKey="remaining" stroke="#D97706" strokeWidth={2.5} fill="url(#swpGrad)" name="Remaining Corpus" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>
                <NextStep label="How much corpus do I need? →" onSelect={() => scrollTo("calc-swp-corpus")} color="#D97706" />
              </div>
            )}
          </CalcCard>

          <CalcCard id="calc-swp-corpus" title="🏛️ How Much Corpus Do I Need?" description="Know your desired monthly income? Work backwards to find the exact corpus you need to build." color="#0891B2" defaultOpen={false}>
            <div style={grid3}>
              <InputField label="Desired Monthly Income (₹)" value={swpCorpusInputs.monthlySWP} onChange={v => setSwpCorpusInputs(p => ({ ...p, monthlySWP: v }))} indicator="amount" range={{ min: 5000, max: 500000, step: 5000, formatLabel: v => formatCompact(v) }} color="#0891B2" />
              <InputField label="For How Long?" value={swpCorpusInputs.withdrawalYears} onChange={v => setSwpCorpusInputs(p => ({ ...p, withdrawalYears: v }))} suffix="yrs" indicator="years" range={{ min: 1, max: 40, step: 1, formatLabel: v => `${v}y` }} color="#0891B2" />
              <InputField label="Expected Return" value={swpCorpusInputs.expectedReturn} onChange={v => setSwpCorpusInputs(p => ({ ...p, expectedReturn: v }))} suffix="%" indicator="percent" range={{ min: 1, max: 15, step: 0.5, formatLabel: v => `${v}%` }} color="#0891B2" />
            </div>
            <div><CalcButton label="Calculate Required Corpus" onClick={handleSwpCorpus} color="#0891B2" /></div>
            {swpCorpusResult && (
              <div id="swp-corpus-result" style={{ display: "flex", flexDirection: "column", gap: "16px", scrollMarginTop: "80px" }}>
                <ResultCard title="Corpus You Need to Build" emoji="🏛️" value={`₹${formatINR(swpCorpusResult.corpus)}`} message={`To receive ₹${formatINR(parseNum(swpCorpusInputs.monthlySWP))}/month for ${swpCorpusInputs.withdrawalYears} years at ${swpCorpusInputs.expectedReturn}% return, you need ₹${formatINR(swpCorpusResult.corpus)} at retirement.`} color="#0891B2" bg="rgba(8,145,178,0.06)" border="rgba(8,145,178,0.2)" />
                <ChartCard title="Corpus depletion over the withdrawal years">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={swpCorpusResult.chart} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="swpCorpusGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0891B2" stopOpacity={0.3} /><stop offset="100%" stopColor="#0891B2" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid {...gridStyle} /><XAxis dataKey="year" {...axisStyle} tickMargin={6} /><YAxis {...axisStyle} tickFormatter={v => formatCompact(v as number)} width={42} />
                      <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#E2E8F0", strokeWidth: 1 }} />
                      <Area type="monotone" dataKey="remaining" stroke="#0891B2" strokeWidth={2.5} fill="url(#swpCorpusGrad)" name="Remaining Corpus" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>
                <NextStep label="Add inflation to your SWP →" onSelect={() => scrollTo("calc-inflation-swp")} color="#0891B2" />
              </div>
            )}
          </CalcCard>

          <CalcCard id="calc-inflation-swp" title="📊 Inflation-Adjusted Monthly Withdrawal" description="Inflation erodes purchasing power. This calculator increases your withdrawal each year to keep up." color="#DC2626" defaultOpen={false}>
            <div style={grid4}>
              <InputField label="Your Corpus (₹)" value={inflationSwpInputs.corpusAmount} onChange={v => setInflationSwpInputs(p => ({ ...p, corpusAmount: v }))} indicator="amount" range={{ min: 100000, max: 200000000, step: 100000, formatLabel: v => formatCompact(v) }} color="#DC2626" />
              <InputField label="Withdrawal Period" value={inflationSwpInputs.withdrawalYears} onChange={v => setInflationSwpInputs(p => ({ ...p, withdrawalYears: v }))} suffix="yrs" indicator="years" range={{ min: 1, max: 40, step: 1, formatLabel: v => `${v}y` }} color="#DC2626" />
              <InputField label="Expected Return" value={inflationSwpInputs.expectedReturn} onChange={v => setInflationSwpInputs(p => ({ ...p, expectedReturn: v }))} suffix="%" indicator="percent" range={{ min: 1, max: 15, step: 0.5, formatLabel: v => `${v}%` }} color="#DC2626" />
              <InputField label="Inflation Rate" value={inflationSwpInputs.inflationRate} onChange={v => setInflationSwpInputs(p => ({ ...p, inflationRate: v }))} suffix="%" indicator="percent" range={{ min: 0, max: 12, step: 0.5, formatLabel: v => `${v}%` }} color="#DC2626" />
            </div>
            <InfoBox icon="⚠️" text="India's average inflation is 5–7%. Use 6% as a realistic baseline. This calculator ensures your income keeps pace with rising costs." color="#DC2626" bg="rgba(220,38,38,0.06)" border="rgba(220,38,38,0.15)" />
            <div><CalcButton label="Calculate Inflation-Adjusted SWP" onClick={handleInflationSwp} color="#DC2626" /></div>
            {inflationSwpResult && (
              <div id="inflation-swp-result" style={{ display: "flex", flexDirection: "column", gap: "16px", scrollMarginTop: "80px" }}>
                <ResultCard title="Starting Monthly Withdrawal" emoji="📊" value={`₹${formatINR(inflationSwpResult.monthly)}/month`} message={`Start with ₹${formatINR(inflationSwpResult.monthly)}/month. This amount rises by ${inflationSwpInputs.inflationRate}% each year, maintaining your real purchasing power through ${inflationSwpInputs.withdrawalYears} years.`} color="#DC2626" bg="rgba(220,38,38,0.06)" border="rgba(220,38,38,0.2)" />
                <ChartCard title="Corpus vs rising withdrawals — the real retirement picture" note="Blue = corpus remaining  ·  Red = growing annual withdrawal">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={inflationSwpResult.chart} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="infSwpGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#DC2626" stopOpacity={0.2} /><stop offset="100%" stopColor="#DC2626" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid {...gridStyle} /><XAxis dataKey="year" {...axisStyle} tickMargin={6} /><YAxis {...axisStyle} tickFormatter={v => formatCompact(v as number)} width={42} />
                      <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#E2E8F0", strokeWidth: 1 }} />
                      <Area type="monotone" dataKey="remaining" stroke="#2563EB" strokeWidth={2.5} fill="none" name="Corpus Remaining" dot={false} />
                      <Bar dataKey="withdrawal" fill="#DC262620" stroke="#DC2626" strokeWidth={0} name="Annual Withdrawal" radius={[3, 3, 0, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartCard>
                <NextStep label="See the full retirement picture →" onSelect={() => { setActiveSection("readiness"); scrollTo("readiness"); }} color="#DC2626" />
              </div>
            )}
          </CalcCard>

        </SectionShell>

        {/* ══ RETIREMENT ══ */}
        <SectionShell id="readiness" sectionMeta={SECTIONS[4]}>

          <CalcCard id="calc-retirement" title="🏖️ Full Retirement Analysis" description="The most complete calculator on this page. Models your corpus, income, inflation, and big-ticket expenses across your entire lifetime." color="#DC2626">
            {/* 8 inputs */}
            <div style={grid4}>
              <InputField label="Current Savings/Corpus (₹)" value={retirementInputs.currentCorpus} onChange={v => setRetirementInputs(p => ({ ...p, currentCorpus: v }))} indicator="amount" range={{ min: 0, max: 100000000, step: 100000, formatLabel: v => formatCompact(v) }} color="#DC2626" />
              <InputField label="Monthly SIP till Retirement (₹)" value={retirementInputs.monthlySIP} onChange={v => setRetirementInputs(p => ({ ...p, monthlySIP: v }))} indicator="amount" range={{ min: 0, max: 200000, step: 1000, formatLabel: v => formatCompact(v) }} color="#DC2626" />
              <InputField label="Years to Retirement" value={retirementInputs.yearsToRetirement} onChange={v => setRetirementInputs(p => ({ ...p, yearsToRetirement: v }))} suffix="yrs" indicator="years" range={{ min: 1, max: 40, step: 1, formatLabel: v => `${v}y` }} color="#DC2626" />
              <InputField label="Desired Monthly Income at Retirement (today's value)" value={retirementInputs.desiredMonthlyIncome} onChange={v => setRetirementInputs(p => ({ ...p, desiredMonthlyIncome: v }))} indicator="amount" range={{ min: 10000, max: 1000000, step: 5000, formatLabel: v => formatCompact(v) }} color="#DC2626" />
              <InputField label="Retirement Duration" value={retirementInputs.retirementDuration} onChange={v => setRetirementInputs(p => ({ ...p, retirementDuration: v }))} suffix="yrs" indicator="years" range={{ min: 5, max: 40, step: 1, formatLabel: v => `${v}y` }} color="#DC2626" />
              <InputField label="Pre-Retirement Return" value={retirementInputs.expectedReturnPre} onChange={v => setRetirementInputs(p => ({ ...p, expectedReturnPre: v }))} suffix="%" indicator="percent" range={{ min: 1, max: 20, step: 0.5, formatLabel: v => `${v}%` }} color="#DC2626" />
              <InputField label="Post-Retirement Return" value={retirementInputs.expectedReturnPost} onChange={v => setRetirementInputs(p => ({ ...p, expectedReturnPost: v }))} suffix="%" indicator="percent" range={{ min: 1, max: 15, step: 0.5, formatLabel: v => `${v}%` }} color="#DC2626" />
              <InputField label="Inflation Rate" value={retirementInputs.inflationRate} onChange={v => setRetirementInputs(p => ({ ...p, inflationRate: v }))} suffix="%" indicator="percent" range={{ min: 0, max: 12, step: 0.5, formatLabel: v => `${v}%` }} color="#DC2626" />
            </div>

            {/* Lump sum withdrawals */}
            <div style={{ background: "white", border: "1.5px solid #E2E8F0", borderRadius: "16px", padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "3px" }}>🎯 Big-ticket expenses (years from today)</div>
                  <p style={{ fontSize: "11px", color: "#94A3B8", margin: 0 }}>Add any large expenses: child's education, wedding, home purchase, medical, etc. Year 15 = 15 years from now.</p>
                </div>
                <button onClick={() => setRetirementWithdrawals(p => [...p, { id: `w-${Date.now()}`, amount: "", year: "" }])} style={{ padding: "7px 15px", borderRadius: "100px", background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", color: "#DC2626", fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>+ Add Goal</button>
              </div>
              {retirementWithdrawals.length === 0 && <p style={{ fontSize: "11px", color: "#CBD5E1", textAlign: "center", padding: "12px 0" }}>No goals added. Your retirement income will still be modelled below.</p>}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {retirementWithdrawals.map(row => (
                  <div key={row.id} style={{ display: "grid", gridTemplateColumns: "1fr 100px auto", gap: "8px", alignItems: "center" }}>
                    <div>
                      <input inputMode="decimal" value={row.amount} onChange={e => setRetirementWithdrawals(p => p.map(r => r.id === row.id ? { ...r, amount: e.target.value } : r))} placeholder="e.g. 5,00,000 (child's education)" style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1.5px solid #E2E8F0", fontSize: "13px", fontWeight: 500, color: "#0F172A", fontFamily: "inherit", boxSizing: "border-box", outline: "none" }} />
                      <div style={{ fontSize: "10px", color: "#94A3B8", marginTop: "2px", paddingLeft: "2px" }}>{formatUnitLabel(parseNum(row.amount))}</div>
                    </div>
                    <input inputMode="numeric" value={row.year} onChange={e => setRetirementWithdrawals(p => p.map(r => r.id === row.id ? { ...r, year: e.target.value } : r))} placeholder="Year no." style={{ padding: "9px 12px", borderRadius: "10px", border: "1.5px solid #E2E8F0", fontSize: "13px", fontWeight: 500, color: "#0F172A", fontFamily: "inherit", boxSizing: "border-box", outline: "none" }} />
                    <button onClick={() => setRetirementWithdrawals(p => p.filter(r => r.id !== row.id))} style={{ padding: "7px 12px", borderRadius: "8px", border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontSize: "11px", cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>✕</button>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: "10.5px", color: "#94A3B8", marginTop: "10px", marginBottom: 0 }}>Current plan: {formatWithdrawalSummary(retirementWithdrawals)}</p>
            </div>

            <InfoBox icon="📊" text="Your desired income is entered in today's value — we automatically inflate it to retirement date. Pre-retirement return should be higher (equity-heavy). Post-retirement should be conservative (balanced/debt)." color="#DC2626" bg="rgba(220,38,38,0.06)" border="rgba(220,38,38,0.15)" />
            <div><CalcButton label="Run Full Retirement Analysis" onClick={handleRetirement} color="#DC2626" /></div>

            {retirementResult && (
              <div id="retirement-result" style={{ display: "flex", flexDirection: "column", gap: "20px", scrollMarginTop: "80px" }}>
                {/* Status banner */}
                <div style={{ background: retirementResult.shortfall >= 0 ? "rgba(5,150,105,0.08)" : "rgba(220,38,38,0.08)", border: `2px solid ${retirementResult.shortfall >= 0 ? "rgba(5,150,105,0.3)" : "rgba(220,38,38,0.3)"}`, borderRadius: "20px", padding: "20px 24px", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "32px" }}>{retirementResult.shortfall >= 0 ? "✅" : "⚠️"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13px", fontWeight: 800, color: retirementResult.shortfall >= 0 ? "#059669" : "#DC2626", marginBottom: "4px" }}>
                      {retirementResult.shortfall >= 0 ? `You're on track! Surplus of ₹${formatINR(retirementResult.shortfall)}` : `Shortfall of ₹${formatINR(Math.abs(retirementResult.shortfall))}`}
                    </div>
                    <p style={{ fontSize: "11.5px", color: "#475569", margin: 0, lineHeight: 1.6 }}>
                      Projected corpus at retirement: <strong>₹{formatINR(retirementResult.projected)}</strong> · Required corpus: <strong>₹{formatINR(retirementResult.required)}</strong> · Income at retirement: <strong>₹{formatINR(retirementResult.desiredIncomeAtRetirement)}/month</strong>
                    </p>
                  </div>
                </div>

                {/* Insight pills */}
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <InsightPill label="Projected at Retirement" value={`₹${formatCompact(retirementResult.projected)}`} color="#059669" />
                  <InsightPill label="Required Corpus" value={`₹${formatCompact(retirementResult.required)}`} color="#2563EB" />
                  <InsightPill label={retirementResult.shortfall >= 0 ? "Surplus" : "Shortfall"} value={`₹${formatCompact(Math.abs(retirementResult.shortfall))}`} color={retirementResult.shortfall >= 0 ? "#059669" : "#DC2626"} />
                  <InsightPill label="Monthly Income @Retirement" value={`₹${formatCompact(retirementResult.desiredIncomeAtRetirement)}`} color="#7C3AED" />
                </div>

                {/* Lifetime cashflow chart */}
                <div style={{ background: "white", border: "1.5px solid #E2E8F0", borderRadius: "20px", padding: "18px 14px 12px", overflow: "hidden" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px", paddingLeft: "4px" }}>Lifetime Cashflow — Corpus and Withdrawals Year by Year</div>
                  <p style={{ fontSize: "11px", color: "#CBD5E1", paddingLeft: "4px", marginBottom: "12px" }}>
                    Blue = corpus remaining · Red bars = annual withdrawals · Dashed line = retirement year
                  </p>
                  <div style={{ height: "260px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={retirementResult.cashflow} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="retCorpusGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#059669" stopOpacity={0.25} /><stop offset="100%" stopColor="#059669" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid {...gridStyle} />
                        <XAxis dataKey="year" {...axisStyle} tickMargin={6} />
                        <YAxis {...axisStyle} tickFormatter={v => formatCompact(v as number)} width={46} />
                        <Tooltip content={<RetirementTooltip />} cursor={{ stroke: "#E2E8F0", strokeWidth: 1 }} />
                        <ReferenceLine x={parseNum(retirementInputs.yearsToRetirement)} stroke="#2563EB" strokeDasharray="5 5" label={{ value: "Retire", fill: "#2563EB", fontSize: 9 }} />
                        {Array.from(new Set(retirementWithdrawals.map(r => parseNum(r.year)).filter(y => y > 0))).sort().map(year => (
                          <ReferenceLine key={`goal-${year}`} x={year} stroke="#D97706" strokeDasharray="3 6" label={{ value: "Goal", fill: "#D97706", fontSize: 9 }} />
                        ))}
                        <Bar dataKey="totalOutflow" fill="#DC262618" stroke="#DC262650" strokeWidth={0.5} name="Annual Withdrawal" radius={[3, 3, 0, 0]} />
                        <Area type="monotone" dataKey="corpus" stroke="#059669" strokeWidth={2.5} fill="url(#retCorpusGrad)" name="Corpus Remaining" dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend */}
                  <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "10px", paddingLeft: "4px" }}>
                    {[{ color: "#059669", label: "Corpus remaining", type: "line" }, { color: "#DC2626", label: "Annual withdrawal", type: "bar" }, { color: "#2563EB", label: "Retirement year", type: "dash" }, { color: "#D97706", label: "Goal expense", type: "dash" }].map(item => (
                      <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        {item.type === "line" && <div style={{ width: "18px", height: "2.5px", borderRadius: "2px", background: item.color }} />}
                        {item.type === "bar" && <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: `${item.color}30`, border: `1.5px solid ${item.color}80` }} />}
                        {item.type === "dash" && <div style={{ width: "18px", borderTop: `2px dashed ${item.color}` }} />}
                        <span style={{ fontSize: "9.5px", color: "#94A3B8", fontWeight: 600 }}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Disclaimer */}
                <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "12px", padding: "12px 16px", fontSize: "11px", color: "#92400E", lineHeight: 1.65 }}>
                  💡 <strong>How this works:</strong> We grow your current savings + SIP at your pre-retirement return. At retirement, we inflate your desired income to its future value and model withdrawals at your post-retirement return, adjusted for inflation each year. Big-ticket expenses are also inflation-adjusted to their respective years.
                </div>
              </div>
            )}
          </CalcCard>

        </SectionShell>

        {/* ── CTA BANNER ── */}
        <Reveal>
          <div style={{ background: "linear-gradient(135deg,#0F172A 0%,#1E3A8A 60%,#065F46 100%)", borderRadius: "26px", padding: "clamp(24px,5vw,46px)", marginBottom: "22px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -50, right: -50, width: "280px", height: "280px", background: "radial-gradient(circle,rgba(16,185,129,0.15) 0%,transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "relative" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "100px", padding: "4px 13px", marginBottom: "14px" }}>
                <span style={{ fontSize: "10.5px", fontWeight: 700, color: "#A7F3D0", letterSpacing: "0.08em", textTransform: "uppercase" }}>The Bottom Line</span>
              </div>
              <h2 style={{ fontSize: "clamp(18px,4vw,28px)", fontWeight: 900, color: "white", margin: "0 0 10px", lineHeight: 1.15, maxWidth: "560px" }}>You've Run the Numbers. Now Build the Plan.</h2>
              <p style={{ fontSize: "clamp(12px,1.8vw,13.5px)", color: "rgba(255,255,255,0.7)", lineHeight: 1.8, maxWidth: "520px", marginBottom: "20px" }}>
                Use these results to choose the right funds, set up your SIP, and track your goals — all in one place.
              </p>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <a href="/find-my-fund-quick-picks" style={{ textDecoration: "none", background: "linear-gradient(90deg,#059669,#2563EB)", borderRadius: "100px", padding: "11px 22px", fontSize: "12px", fontWeight: 700, color: "white", letterSpacing: "0.05em" }}>Find My Funds →</a>
                <a href="/why-mutual-fund" style={{ textDecoration: "none", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "100px", padding: "11px 22px", fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.85)", letterSpacing: "0.05em" }}>Learn the Basics →</a>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ── DISCLAIMER ── */}
        <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "12px 18px", fontSize: "10.5px", color: "#94A3B8", lineHeight: 1.6, textAlign: "center" }}>
          <strong style={{ color: "#64748B" }}>Disclaimer:</strong> These calculators provide estimates for planning purposes only. Actual returns depend on market conditions and may vary. Mutual fund investments are subject to market risks. Please read all scheme-related documents carefully before investing. Consult a SEBI-registered investment advisor for personalised advice.
        </div>

      </div>

      <style>{`
        * { box-sizing: border-box; -ms-overflow-style: none; scrollbar-width: none; }
        *::-webkit-scrollbar { display: none; }
        html { scroll-behavior: smooth; }
        @media (max-width: 480px) {
          h1 { letter-spacing: -0.02em !important; }
        }
        input[type="range"] { height: 4px; }
        input[type="range"]::-webkit-slider-thumb { height: 16px; width: 16px; }
      `}</style>
    </div>
  );
}