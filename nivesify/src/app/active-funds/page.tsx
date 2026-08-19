"use client";

import { useEffect, useState } from "react";
import ActiveFundsContent from "@/components/ActiveFundsContent";
import { computeAmfiAggregates, type AmfiRawRecord } from "@/lib/amfi-aggregates";
import type { CategoryInsights, FundAnalytics, Manifest } from "@/lib/fund-types";
import { fetchCachedJson } from "@/lib/client-data";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const fmt = (v: number | null | undefined, d = 2) => {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: d, minimumFractionDigits: d }).format(v);
};
const fmtPct = (v: number | null | undefined, d = 2) => {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return `${v > 0 ? "+" : ""}${v.toFixed(d)}%`;
};
const fmtPctPlain = (v: number | null | undefined, d = 1) => {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return `${v.toFixed(d)}%`;
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function ActiveFundsPage() {
  const [funds, setFunds] = useState<FundAnalytics[]>([]);
  const [insights, setInsights] = useState<CategoryInsights[]>([]);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [amfiRaw, setAmfiRaw] = useState<AmfiRawRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchCachedJson<FundAnalytics[]>("/api/funds"),
      fetchCachedJson<CategoryInsights[]>("/api/insights"),
      fetchCachedJson<Manifest>("/api/manifest"),
      fetchCachedJson<AmfiRawRecord[]>("/api/amfi-raw"),
    ]).then(([nextFunds, nextInsights, nextManifest, nextAmfiRaw]) => {
      setFunds(nextFunds);
      setInsights(nextInsights);
      setManifest(nextManifest);
      setAmfiRaw(nextAmfiRaw);
    }).catch((error) => console.error("Failed to load active fund data", error)).finally(() => setLoading(false));
  }, []);

  const industryInsight = insights.find((r) => r.Level === "Industry") ?? null;
  const categoryInsights = insights.filter((r) => r.Level === "Category");
  const subCategoryInsights = insights.filter((r) => r.Level === "Sub-Category");
  const { categories: categoryReturnStats, subCategories: subCategoryReturnStats } =
    computeAmfiAggregates(amfiRaw);

  // ── Derived numbers for static sections ──
  const beatRate = industryInsight?.Pct_Funds_Beating_Benchmark_3Y ?? null;
  const topCount = funds.filter((f) => f.Flag_Top_10_Percent === "Yes").length;
  const avgAlpha3YAll = (() => {
    const vals = funds.map((f) => f.Alpha_3Y).filter((v): v is number => v !== null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  })();

  // ── Where active wins / loses ──
  const clearWinners = categoryInsights.filter(
    (r) => (r.Avg_Alpha_3Y ?? 0) > 1 && (r.Pct_Funds_Beating_Benchmark_3Y ?? 0) > 55
  );
  const clearLosers = categoryInsights.filter(
    (r) => (r.Avg_Alpha_3Y ?? 0) < 0 || (r.Pct_Funds_Beating_Benchmark_3Y ?? 0) < 35
  );

  // ── Beat-rate bar chart data ──
  const beatRateRows = [...categoryInsights]
    .filter((r) => r.Category_Name && r.Pct_Funds_Beating_Benchmark_3Y !== null)
    .sort((a, b) => (b.Pct_Funds_Beating_Benchmark_3Y ?? 0) - (a.Pct_Funds_Beating_Benchmark_3Y ?? 0));

  // ── Alpha momentum bar chart (top 6 by alpha) ──
  const chartCats = [...categoryInsights]
    .filter((r) => r.Category_Name)
    .sort((a, b) => (b.Avg_Alpha_3Y ?? 0) - (a.Avg_Alpha_3Y ?? 0))
    .slice(0, 6);
  const maxAlpha = Math.max(1, ...chartCats.map((r) => Math.abs(r.Avg_Alpha_3Y ?? 0)));
  const maxBeat = Math.max(1, ...chartCats.map((r) => r.Pct_Funds_Beating_Benchmark_3Y ?? 0));

  // ── Highlight stat cards ──
  const topBeatCat = [...categoryInsights]
    .filter((r) => r.Pct_Funds_Beating_Benchmark_3Y !== null)
    .sort((a, b) => (b.Pct_Funds_Beating_Benchmark_3Y ?? 0) - (a.Pct_Funds_Beating_Benchmark_3Y ?? 0))[0] ?? null;
  const topIrCat = [...categoryInsights]
    .filter((r) => r.Avg_IR_3Y !== null)
    .sort((a, b) => (b.Avg_IR_3Y ?? 0) - (a.Avg_IR_3Y ?? 0))[0] ?? null;

  type ReturnField = "Avg_1Y_Return" | "Avg_3Y_Return" | "Avg_5Y_Return";
  const topSubCat = (field: ReturnField) => {
    const pool = subCategoryReturnStats.filter((r) => r[field] !== null);
    if (!pool.length) return null;
    return [...pool].sort((a, b) => (b[field] ?? -999) - (a[field] ?? -999))[0];
  };
  const top1Y = topSubCat("Avg_1Y_Return");
  const top3Y = topSubCat("Avg_3Y_Return");
  const top5Y = topSubCat("Avg_5Y_Return");

  // ── Shortlist groups (pre-computed on server, passed to client) ──
  const shortlistGroups = [...subCategoryInsights]
    .filter((r) => r.Sub_Category_Name)
    .sort((a, b) => (b.Total_AUM ?? 0) - (a.Total_AUM ?? 0))
    .slice(0, 6)
    .map((group) => {
      const matches = funds.filter(
        (f) =>
          f.Sub_Category === group.Sub_Category_Name &&
          f.Category === group.Category_Name &&
          (f.Current_AUM ?? 0) > 50
      );
      const picks = [...matches]
        .sort((a, b) => (b.Composite_Score ?? 0) - (a.Composite_Score ?? 0))
        .slice(0, 2);
      return {
        category: group.Category_Name ?? "—",
        subCategory: group.Sub_Category_Name ?? "—",
        aum: group.Total_AUM ?? 0,
        picks,
      };
    });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F8FAFC",
        fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
        color: "#1F2937",
      }}
    >

      {/* ═══════════════════════════════════════
          HERO
      ═══════════════════════════════════════ */}
      <section
        style={{
          background: "linear-gradient(155deg,#0F172A 0%,#1C2E4A 45%,#18301E 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)", backgroundSize: "28px 28px", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: -80, right: -40, width: "400px", height: "400px", background: "radial-gradient(circle,rgba(16,185,129,0.15) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, left: "8%", width: "320px", height: "320px", background: "radial-gradient(circle,rgba(59,130,246,0.1) 0%,transparent 70%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", maxWidth: "1100px", margin: "0 auto", padding: "clamp(28px,5vw,52px) clamp(16px,4vw,28px) clamp(24px,4vw,40px)" }}>

          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "18px", flexWrap: "wrap" }}>
            <a href="/" style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>Nivesify</a>
            <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "11px" }}>/</span>
            <a href="/mutual-fund-analysis" style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>MF World</a>
            <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "11px" }}>/</span>
            <span style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>Active Funds</span>
          </div>

          {/* Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.28)", borderRadius: "100px", padding: "5px 14px", marginBottom: "14px" }}>
            <span style={{ width: "6px", height: "6px", background: "#34D399", borderRadius: "50%", display: "inline-block" }} />
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#6EE7B7", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
              Active Funds · Updated Daily
            </span>
          </div>

          <h1 style={{ fontSize: "clamp(1.6rem,5vw,3rem)", fontWeight: 900, color: "white", lineHeight: 1.1, letterSpacing: "-0.025em", marginBottom: "10px", maxWidth: "700px" }}>
            Can a fund manager<br />
            <span style={{ background: "linear-gradient(90deg,#34D399 0%,#60A5FA 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              actually beat the market?
            </span>
          </h1>
          <p style={{ fontSize: "clamp(12px,2vw,15px)", color: "rgba(255,255,255,0.6)", lineHeight: 1.75, maxWidth: "560px", marginBottom: "28px" }}>
            Active funds charge more because an expert picks stocks for you. Some consistently beat the market — most don't. This page shows where paying for expertise makes sense, and gives you the tools to find the best ones.
          </p>

          {/* Site-wide nav tabs */}
          <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", padding: "6px 8px", maxWidth: "fit-content", marginBottom: "28px" }}>
            <div style={{ display: "flex", gap: "4px", overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" as const }}>
              {[
                { label: "Why Mutual Funds",     href: "/why-mutual-fund",      active: false },
                { label: "Smart Fund Finder",    href: "/mutual-fund-match",    active: false },
                { label: "MF Industry Analysis", href: "/mutual-fund-analysis", active: false },
                { label: "Active Funds",         href: "/active-funds",         active: true  },
                { label: "Passive Funds",        href: "/index-funds",          active: false },
              ].map((tab) => (
                <a
                  key={tab.href}
                  href={tab.href}
                  style={{
                    flexShrink: 0, textDecoration: "none", padding: "6px 14px", borderRadius: "100px",
                    fontSize: "12px", fontWeight: tab.active ? 700 : 500,
                    color: tab.active ? "#34D399" : "rgba(255,255,255,0.6)",
                    background: tab.active ? "rgba(255,255,255,0.12)" : "transparent",
                    border: tab.active ? "1px solid rgba(255,255,255,0.25)" : "1px solid transparent",
                    whiteSpace: "nowrap" as const, letterSpacing: "0.01em",
                  }}
                >
                  {tab.label}
                </a>
              ))}
            </div>
          </div>

          {/* Section jump links */}
          <div>
            <p style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em", textTransform: "uppercase" as const, marginBottom: "10px" }}>
              Jump to a section
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "8px" }}>
              {[
                { label: "📘 Active vs Index",     href: "#active-vs-index", desc: "What's the difference?" },
                { label: "🏆 Where Active Wins",   href: "#where-wins",      desc: "Categories worth picking" },
                { label: "📊 Category Scoreboard", href: "#scoreboard",      desc: "Returns vs benchmark" },
                { label: "🔍 Top Fund Picks",      href: "#top-picks",       desc: "Best funds by skill" },
                { label: "🧮 Fund Screener",       href: "#screener",        desc: "Filter every active fund" },
              ].map((a) => (
                <a
                  key={a.href}
                  href={a.href}
                  style={{ textDecoration: "none", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: "12px", padding: "10px 12px", display: "flex", flexDirection: "column" as const, gap: "2px", minHeight: "52px", justifyContent: "center" }}
                >
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{a.label}</span>
                  <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>{a.desc}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Live stat strip */}
          <div style={{ display: "flex", gap: "clamp(16px,3vw,36px)", flexWrap: "wrap", marginTop: "28px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            {[
              { v: fmt(funds.length, 0),     l: "Active funds tracked",      c: "#34D399" },
              { v: fmt(topCount, 0),          l: "Top-ranked by skill",       c: "#60A5FA" },
              { v: fmtPctPlain(beatRate),     l: "Beat market (3 yrs)",       c: "#FBBF24" },
              { v: fmtPct(avgAlpha3YAll),     l: "Avg extra return vs index", c: "#C4B5FD" },
            ].map((m, i) => (
              <div key={i}>
                <div style={{ fontSize: "clamp(15px,2.5vw,20px)", fontWeight: 800, color: m.c, lineHeight: 1 }}>{m.v}</div>
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.45)", marginTop: "3px", fontWeight: 500 }}>{m.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 1 — ACTIVE vs INDEX
      ═══════════════════════════════════════ */}
      <section
        id="active-vs-index"
        style={{ maxWidth: "1100px", margin: "0 auto", padding: "clamp(32px,5vw,56px) clamp(16px,4vw,28px) 0" }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "100px", padding: "4px 13px", marginBottom: "10px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#059669", letterSpacing: "0.09em", textTransform: "uppercase" as const }}>Section 1 · Active vs Index</span>
        </div>
        <h2 style={{ fontSize: "clamp(18px,3vw,26px)", fontWeight: 800, color: "#0F172A", margin: "0 0 6px" }}>
          What exactly is an "active" fund — and should you care?
        </h2>
        <p style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.7, maxWidth: "640px", marginBottom: "28px" }}>
          Think of two kinds of chefs. One follows a fixed recipe exactly (index fund). The other improvises based on skill (active fund). The second can be brilliant — or wrong. The extra fee is for that expertise.
        </p>

        {/* Active vs Index side-by-side */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))", gap: "16px", marginBottom: "28px" }}>
          <div style={{ background: "#ECFDF5", border: "1.5px solid #A7F3D0", borderRadius: "20px", padding: "24px" }}>
            <div style={{ fontSize: "28px", marginBottom: "10px" }}>🧠</div>
            <div style={{ fontSize: "16px", fontWeight: 900, color: "#065F46", marginBottom: "12px" }}>Active Fund</div>
            {[
              { icon: "✅", text: "A fund manager handpicks stocks using research and judgment" },
              { icon: "✅", text: "Goal: beat the market and earn you more than a plain index" },
              { icon: "⚠️", text: "Charges higher fees (1–2% per year, called expense ratio)" },
              { icon: "⚠️", text: "Only worth it when the manager consistently beats the index — many can't" },
            ].map((p, i) => (
              <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "8px" }}>
                <span style={{ fontSize: "14px", flexShrink: 0 }}>{p.icon}</span>
                <span style={{ fontSize: "12px", color: "#374151", lineHeight: 1.55 }}>{p.text}</span>
              </div>
            ))}
          </div>
          <div style={{ background: "#EFF6FF", border: "1.5px solid #BFDBFE", borderRadius: "20px", padding: "24px" }}>
            <div style={{ fontSize: "28px", marginBottom: "10px" }}>📊</div>
            <div style={{ fontSize: "16px", fontWeight: 900, color: "#1E3A5F", marginBottom: "12px" }}>Index Fund</div>
            {[
              { icon: "✅", text: "Automatically copies a market index like Nifty 50 — no judgment calls" },
              { icon: "✅", text: "Very low fees (0.1–0.2% per year)" },
              { icon: "✅", text: "Predictable: you get roughly what the market gives" },
              { icon: "💡", text: "No chance of beating the market, but no risk of badly lagging it either" },
            ].map((p, i) => (
              <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "8px" }}>
                <span style={{ fontSize: "14px", flexShrink: 0 }}>{p.icon}</span>
                <span style={{ fontSize: "12px", color: "#374151", lineHeight: 1.55 }}>{p.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3 key metrics */}
        <div style={{ background: "linear-gradient(90deg,#F0FDF4,#EFF6FF)", border: "1.5px solid #A7F3D0", borderRadius: "16px", padding: "20px 24px", marginBottom: "28px" }}>
          <div style={{ fontSize: "13px", fontWeight: 800, color: "#065F46", marginBottom: "14px" }}>
            📖 3 numbers we use to spot real skill vs a lucky streak
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: "12px" }}>
            {[
              {
                term: "Alpha", emoji: "🎯", simple: "Extra return above the market",
                detail: "If the market gave 12% and your fund gave 15%, alpha is +3%. Positive = manager added value. Negative = they didn't.",
              },
              {
                term: "Information Ratio (IR)", emoji: "📐", simple: "How consistent is that extra return?",
                detail: "Anyone can beat the market once. IR above 0.5 means they do it reliably, year after year. Think of it as the 'reliability score' for alpha.",
              },
              {
                term: "Beat Rate", emoji: "🏁", simple: "% of funds in a group beating the index",
                detail: "If 70% of funds in a category beat their benchmark, it's worth exploring. Below 40%? Just buy the index and save on fees.",
              },
            ].map((m, i) => (
              <div key={i} style={{ background: "white", borderRadius: "12px", padding: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <span style={{ fontSize: "18px" }}>{m.emoji}</span>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 800, color: "#2563EB" }}>{m.term}</div>
                    <div style={{ fontSize: "10px", color: "#64748B", fontStyle: "italic" }}>{m.simple}</div>
                  </div>
                </div>
                <div style={{ fontSize: "11px", color: "#475569", lineHeight: 1.6 }}>{m.detail}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Honest truth */}
        <div style={{ background: "#FFFBEB", border: "1.5px solid #FDE68A", borderRadius: "16px", padding: "16px 20px", display: "flex", gap: "14px", alignItems: "flex-start" }}>
          <span style={{ fontSize: "22px", flexShrink: 0 }}>⚠️</span>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#92400E", marginBottom: "5px" }}>The honest truth about active funds</div>
            <div style={{ fontSize: "12px", color: "#78350F", lineHeight: 1.7 }}>
              Industry-wide, only about <strong>{fmtPctPlain(beatRate)}</strong> of active funds beat their benchmark over 3 years.
              That means randomly picking an active fund gives you a better-than-even chance of doing worse than a simple index.
              But in certain categories the odds are much better — that's exactly what Section 2 shows you.
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 2 — WHERE ACTIVE WINS
      ═══════════════════════════════════════ */}
      <section
        id="where-wins"
        style={{ maxWidth: "1100px", margin: "0 auto", padding: "clamp(40px,5vw,64px) clamp(16px,4vw,28px) 0" }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "100px", padding: "4px 13px", marginBottom: "10px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#D97706", letterSpacing: "0.09em", textTransform: "uppercase" as const }}>Section 2 · Where Active Wins</span>
        </div>
        <h2 style={{ fontSize: "clamp(18px,3vw,26px)", fontWeight: 800, color: "#0F172A", margin: "0 0 6px" }}>
          Which categories are worth paying extra for?
        </h2>
        <p style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.7, maxWidth: "620px", marginBottom: "28px" }}>
          In some categories, active managers consistently earn their fees. In others, a low-cost index beats most of them. Here's the honest, data-driven split.
        </p>

        {/* Win / Loss split */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px,1fr))", gap: "16px", marginBottom: "28px" }}>

          {/* Winners */}
          <div style={{ background: "#F0FDF4", border: "1.5px solid #A7F3D0", borderRadius: "20px", padding: "clamp(16px,3vw,22px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div style={{ width: "36px", height: "36px", background: "#059669", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>✅</div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 900, color: "#065F46" }}>Active earns its fees here</div>
                <div style={{ fontSize: "11px", color: "#047857" }}>High alpha + majority of funds beating the market</div>
              </div>
            </div>
            {clearWinners.length > 0 ? (
              clearWinners.map((cat, i) => (
                <div key={i} style={{ background: "white", borderRadius: "12px", padding: "12px 14px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" as const }}>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#0F172A" }}>{cat.Category_Name}</div>
                    <div style={{ fontSize: "10px", color: "#64748B", marginTop: "2px" }}>{cat.Number_of_Schemes} funds</div>
                  </div>
                  <div style={{ display: "flex", gap: "12px", flexShrink: 0 }}>
                    <div style={{ textAlign: "center" as const }}>
                      <div style={{ fontSize: "13px", fontWeight: 800, color: "#059669" }}>{fmtPct(cat.Avg_Alpha_3Y)}</div>
                      <div style={{ fontSize: "9px", color: "#94A3B8" }}>Alpha</div>
                    </div>
                    <div style={{ textAlign: "center" as const }}>
                      <div style={{ fontSize: "13px", fontWeight: 800, color: "#059669" }}>{fmtPctPlain(cat.Pct_Funds_Beating_Benchmark_3Y)}</div>
                      <div style={{ fontSize: "9px", color: "#94A3B8" }}>Beat rate</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: "12px", color: "#64748B", fontStyle: "italic" }}>No category currently shows consistent outperformance — market conditions may be shifting.</div>
            )}
          </div>

          {/* Losers */}
          <div style={{ background: "#EFF6FF", border: "1.5px solid #BFDBFE", borderRadius: "20px", padding: "clamp(16px,3vw,22px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div style={{ width: "36px", height: "36px", background: "#2563EB", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>📊</div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 900, color: "#1E3A5F" }}>Index fund likely better here</div>
                <div style={{ fontSize: "11px", color: "#1D4ED8" }}>Most active funds fail to beat the market in these</div>
              </div>
            </div>
            {clearLosers.length > 0 ? (
              clearLosers.map((cat, i) => (
                <div key={i} style={{ background: "white", borderRadius: "12px", padding: "12px 14px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" as const }}>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#0F172A" }}>{cat.Category_Name}</div>
                    <div style={{ fontSize: "10px", color: "#64748B", marginTop: "2px" }}>Consider a low-cost index fund instead</div>
                  </div>
                  <div style={{ display: "flex", gap: "12px", flexShrink: 0 }}>
                    <div style={{ textAlign: "center" as const }}>
                      <div style={{ fontSize: "13px", fontWeight: 800, color: "#DC2626" }}>{fmtPct(cat.Avg_Alpha_3Y)}</div>
                      <div style={{ fontSize: "9px", color: "#94A3B8" }}>Alpha</div>
                    </div>
                    <div style={{ textAlign: "center" as const }}>
                      <div style={{ fontSize: "13px", fontWeight: 800, color: "#DC2626" }}>{fmtPctPlain(cat.Pct_Funds_Beating_Benchmark_3Y)}</div>
                      <div style={{ fontSize: "9px", color: "#94A3B8" }}>Beat rate</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: "12px", color: "#64748B", fontStyle: "italic" }}>No category is clearly dominated by index funds right now.</div>
            )}
          </div>
        </div>

        {/* Beat-rate bar chart */}
        <div style={{ background: "white", border: "1.5px solid #E2E8F0", borderRadius: "20px", padding: "clamp(16px,3vw,24px)", marginBottom: "28px" }}>
          <div style={{ fontWeight: 800, fontSize: "15px", color: "#0F172A", marginBottom: "4px" }}>
            How often do active funds beat their benchmark — by category?
          </div>
          <div style={{ fontSize: "12px", color: "#64748B", marginBottom: "20px" }}>
            Each bar shows % of funds in that category beating their index over 3 years. The line at 50% is break-even — above it, active generally pays off.
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: "14px" }}>
            {beatRateRows.map((row) => {
              const beat = row.Pct_Funds_Beating_Benchmark_3Y ?? 0;
              const alpha = row.Avg_Alpha_3Y ?? 0;
              const barColor = beat >= 55
                ? "linear-gradient(90deg,#10B981,#059669)"
                : beat >= 40
                ? "linear-gradient(90deg,#F59E0B,#D97706)"
                : "linear-gradient(90deg,#EF4444,#DC2626)";
              return (
                <div key={row.Category_Name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", flexWrap: "wrap", gap: "4px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#374151" }}>{row.Category_Name}</span>
                    <span style={{ fontSize: "11px", color: "#94A3B8" }}>
                      <strong style={{ color: beat >= 50 ? "#059669" : "#DC2626" }}>{fmtPctPlain(beat)}</strong>
                      {" "}beat index · Alpha:{" "}
                      <strong style={{ color: alpha >= 0 ? "#059669" : "#DC2626" }}>{fmtPct(alpha)}</strong>
                    </span>
                  </div>
                  <div style={{ position: "relative", height: "12px", borderRadius: "100px", background: "#F1F5F9" }}>
                    <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: "2px", background: "rgba(0,0,0,0.12)", zIndex: 2 }} />
                    <div style={{ height: "100%", width: `${Math.min(100, Math.round(beat))}%`, background: barColor, borderRadius: "100px" }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: "16px", marginTop: "18px", flexWrap: "wrap" }}>
            {[
              { bg: "linear-gradient(90deg,#10B981,#059669)", label: "Above 55% — Active likely worth it" },
              { bg: "linear-gradient(90deg,#F59E0B,#D97706)", label: "40–55% — Mixed results" },
              { bg: "linear-gradient(90deg,#EF4444,#DC2626)", label: "Below 40% — Index likely better" },
            ].map((l, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "11px", color: "#64748B" }}>
                <div style={{ width: "14px", height: "8px", background: l.bg, borderRadius: "100px" }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* Alpha + beat-rate momentum bars */}
        <div style={{ background: "white", border: "1.5px solid #E2E8F0", borderRadius: "20px", padding: "clamp(16px,3vw,24px)" }}>
          <div style={{ fontWeight: 800, fontSize: "15px", color: "#0F172A", marginBottom: "4px" }}>
            Top 6 categories — extra return delivered vs % beating benchmark
          </div>
          <div style={{ fontSize: "12px", color: "#64748B", marginBottom: "20px" }}>
            Green bar = extra return above market (alpha). Blue bar = how many funds in that group actually beat their index.
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: "18px" }}>
            {chartCats.map((row) => {
              const alpha = row.Avg_Alpha_3Y ?? 0;
              const beat = row.Pct_Funds_Beating_Benchmark_3Y ?? 0;
              const alphaW = Math.round((Math.abs(alpha) / maxAlpha) * 100);
              const beatW = Math.round((beat / maxBeat) * 100);
              return (
                <div key={row.Category_Name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", flexWrap: "wrap", gap: "4px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#374151" }}>{row.Category_Name}</span>
                    <span style={{ fontSize: "10px", color: "#94A3B8" }}>
                      Alpha{" "}<strong style={{ color: alpha >= 0 ? "#059669" : "#DC2626" }}>{fmtPct(alpha)}</strong>
                      {" "}· Beat rate{" "}<strong style={{ color: "#374151" }}>{fmtPctPlain(beat)}</strong>
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" as const, gap: "4px" }}>
                    <div style={{ height: "10px", borderRadius: "100px", background: "#F1F5F9", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${alphaW}%`, background: alpha >= 0 ? "linear-gradient(90deg,#10B981,#059669)" : "linear-gradient(90deg,#EF4444,#DC2626)", borderRadius: "100px" }} />
                    </div>
                    <div style={{ height: "10px", borderRadius: "100px", background: "#F1F5F9", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${beatW}%`, background: "linear-gradient(90deg,#3B82F6,#2563EB)", borderRadius: "100px" }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: "20px", marginTop: "16px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#64748B" }}><div style={{ width: "16px", height: "8px", background: "linear-gradient(90deg,#10B981,#059669)", borderRadius: "100px" }} />Alpha (extra return)</div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#64748B" }}><div style={{ width: "16px", height: "8px", background: "linear-gradient(90deg,#3B82F6,#2563EB)", borderRadius: "100px" }} />Beat rate</div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#64748B" }}><div style={{ width: "16px", height: "8px", background: "linear-gradient(90deg,#EF4444,#DC2626)", borderRadius: "100px" }} />Negative alpha</div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 3 — CATEGORY SCOREBOARD
          (client component handles tables)
      ═══════════════════════════════════════ */}
      <section
        id="scoreboard"
        style={{ maxWidth: "1100px", margin: "0 auto", padding: "clamp(40px,5vw,64px) clamp(16px,4vw,28px) 0" }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "100px", padding: "4px 13px", marginBottom: "10px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#2563EB", letterSpacing: "0.09em", textTransform: "uppercase" as const }}>Section 3 · Category Scoreboard</span>
        </div>
        <h2 style={{ fontSize: "clamp(18px,3vw,26px)", fontWeight: 800, color: "#0F172A", margin: "0 0 6px" }}>
          Average fund return vs benchmark — across all time periods
        </h2>
        <p style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.7, maxWidth: "620px", marginBottom: "24px" }}>
          Average fund return vs benchmark across all time periods. Sort any column to find what matters to you.
        </p>

        {/* Highlight stat cards (static, server-rendered) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: "12px", marginBottom: "24px" }}>
          {[
            { icon: "🏆", label: "Highest beat rate category",  value: topBeatCat?.Category_Name ?? "—",  sub: `${fmtPctPlain(topBeatCat?.Pct_Funds_Beating_Benchmark_3Y)} beat their benchmark` },
            { icon: "🎯", label: "Best risk-adjusted category", value: topIrCat?.Category_Name ?? "—",    sub: `Avg IR 3Y: ${fmt(topIrCat?.Avg_IR_3Y)}` },
            { icon: "📈", label: "Top 1Y sub-category",         value: top1Y?.Sub_Category ?? "—",        sub: `Avg return: ${fmtPctPlain(top1Y?.Avg_1Y_Return)}` },
            { icon: "📊", label: "Top 3Y sub-category",         value: top3Y?.Sub_Category ?? "—",        sub: `Avg return: ${fmtPctPlain(top3Y?.Avg_3Y_Return)}` },
            { icon: "🌱", label: "Top 5Y sub-category",         value: top5Y?.Sub_Category ?? "—",        sub: `Avg return: ${fmtPctPlain(top5Y?.Avg_5Y_Return)}` },
          ].map((c, i) => (
            <div key={i} style={{ background: "white", border: "1.5px solid #E2E8F0", borderRadius: "16px", padding: "16px" }}>
              <div style={{ fontSize: "22px", marginBottom: "8px" }}>{c.icon}</div>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: "4px" }}>{c.label}</div>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "#0F172A", lineHeight: 1.3, marginBottom: "4px" }}>{c.value}</div>
              <div style={{ fontSize: "10.5px", color: "#64748B" }}>{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Interactive tables + shortlist picks — client component */}
        {loading ? <div style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>Loading market data...</div> : (
          <ActiveFundsContent
            funds={funds}
            categoryReturnStats={categoryReturnStats}
            subCategoryReturnStats={subCategoryReturnStats}
            shortlistGroups={shortlistGroups}
            manifest={manifest}
          />
        )}
      </section>

      {/* ═══════════════════════════════════════
          FOOTER — Disclaimer + CTAs
      ═══════════════════════════════════════ */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "clamp(32px,5vw,48px) clamp(16px,4vw,28px) clamp(48px,6vw,80px)" }}>
        <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "14px 18px", marginBottom: "28px", fontSize: "10.5px", color: "#94A3B8", lineHeight: 1.65, textAlign: "center" as const }}>
          <strong style={{ color: "#64748B" }}>Important Disclaimer:</strong> This data is for informational purposes only and does not constitute investment advice. Past performance is not indicative of future returns. All data sourced from AMFI, updated daily. Read all scheme-related documents and consult a SEBI-registered advisor before investing.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))", gap: "12px" }}>
          <a href="/mutual-fund-analysis" style={{ textDecoration: "none", background: "linear-gradient(90deg,#0F172A,#1B3A5C)", borderRadius: "18px", padding: "clamp(16px,3vw,22px)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", boxShadow: "0 8px 28px rgba(15,23,42,0.2)" }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.65)", marginBottom: "3px" }}>Want the big picture first?</div>
              <div style={{ fontSize: "clamp(14px,2.5vw,17px)", fontWeight: 900, color: "white", lineHeight: 1.2 }}>Industry Analysis →</div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", marginTop: "3px" }}>How the whole market is doing</div>
            </div>
            <span style={{ fontSize: "28px", flexShrink: 0 }}>📊</span>
          </a>
          <a href="/index-funds" style={{ textDecoration: "none", background: "white", border: "1.5px solid #BFDBFE", borderRadius: "18px", padding: "clamp(16px,3vw,22px)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px" }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#2563EB", marginBottom: "3px" }}>Prefer keeping it simple?</div>
              <div style={{ fontSize: "clamp(14px,2.5vw,17px)", fontWeight: 900, color: "#0F172A", lineHeight: 1.2 }}>Browse Passive Funds →</div>
              <div style={{ fontSize: "10px", color: "#64748B", marginTop: "3px" }}>Lowest cost · Tracks the market</div>
            </div>
            <span style={{ fontSize: "28px", flexShrink: 0 }}>🏷️</span>
          </a>
          <a href="/mutual-fund-match" style={{ textDecoration: "none", background: "linear-gradient(90deg,#059669,#0891B2)", borderRadius: "18px", padding: "clamp(16px,3vw,22px)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", boxShadow: "0 8px 28px rgba(5,150,105,0.2)" }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.65)", marginBottom: "3px" }}>Not sure where to start?</div>
              <div style={{ fontSize: "clamp(14px,2.5vw,17px)", fontWeight: 900, color: "white", lineHeight: 1.2 }}>Smart Fund Finder →</div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", marginTop: "3px" }}>Answer 3 questions, get matched</div>
            </div>
            <span style={{ fontSize: "28px", flexShrink: 0 }}>🔬</span>
          </a>
        </div>
      </div>

      <style>{`
        * { -ms-overflow-style: none; scrollbar-width: none; box-sizing: border-box; }
        *::-webkit-scrollbar { display: none; }
        a[href^="#"] { transition: background 0.18s, border-color 0.18s; }
        a[href^="#"]:hover { background: rgba(255,255,255,0.14) !important; border-color: rgba(255,255,255,0.28) !important; }
        img, iframe, table { max-width: 100%; }
        html { scroll-behavior: smooth; }
        @media (max-width: 640px) {
          section { padding-left: 14px !important; padding-right: 14px !important; }
          table { min-width: 340px; font-size: 10px; }
          th, td { padding: 8px 7px !important; font-size: 10px !important; }
        }
        @media (min-width: 481px) and (max-width: 768px) {
          table { font-size: 11px; }
          th, td { padding: 10px 9px !important; }
        }
      `}</style>
    </div>
  );
}