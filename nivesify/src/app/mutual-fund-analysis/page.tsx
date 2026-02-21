import type { Metadata } from "next";
import { AnalysisFullInsightsTable, AnalysisInsightsTables } from "@/components/AnalysisTables";
import { getBaseUrl } from "@/lib/base-url";
import { computeAmfiAggregates, type AmfiRawRecord } from "@/lib/amfi-aggregates";
import type { CategoryInsights, Manifest } from "@/lib/fund-types";

export const metadata: Metadata = {
  title: "MF Industry Analysis | Nivesify",
  description: "Industry-wide insights, plain-language methodology, and guided paths for active and passive selection.",
  alternates: { canonical: "https://nivesify.com/mutual-fund-analysis" },
  openGraph: {
    title: "MF Industry Analysis | Nivesify",
    description: "Industry-wide insights, plain-language methodology, and guided paths for active and passive selection.",
    url: "https://nivesify.com/mutual-fund-analysis",
    siteName: "Nivesify",
    locale: "en_US",
    type: "website",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const fetchJson = async <T,>(baseUrl: string, path: string): Promise<T> => {
  const res = await fetch(`${baseUrl}${path}`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json() as Promise<T>;
};

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

const palette = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#0891B2"];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE (server component)
// ─────────────────────────────────────────────────────────────────────────────

export default async function MutualFundAnalysisPage() {
  const baseUrl = getBaseUrl();
  const [insights, manifest, amfiRaw] = await Promise.all([
    fetchJson<CategoryInsights[]>(baseUrl, "/api/insights"),
    fetchJson<Manifest>(baseUrl, "/api/manifest"),
    fetchJson<AmfiRawRecord[]>(baseUrl, "/api/amfi-raw"),
  ]);

  const industryInsight = insights.find((r) => r.Level === "Industry") ?? null;
  const categoryInsights = insights.filter((r) => r.Level === "Category");
  const subCategoryInsights = insights.filter((r) => r.Level === "Sub-Category");

  const amfiAggregates = computeAmfiAggregates(amfiRaw);
  const amfiCategoryMap = new Map(amfiAggregates.categories.map((r) => [r.Category ?? "", r]));
  const amfiSubCategoryMap = new Map(amfiAggregates.subCategories.map((r) => [`${r.Category}|||${r.Sub_Category}`, r]));

  const enrichedInsights = insights.map((row) => {
    const match =
      row.Level === "Industry"
        ? amfiAggregates.industry
        : row.Level === "Category"
        ? amfiCategoryMap.get(row.Category_Name ?? "")
        : amfiSubCategoryMap.get(`${row.Category_Name}|||${row.Sub_Category_Name}`);
    return {
      ...row,
      Avg_10Y_Return: match?.Avg_10Y_Return ?? null,
      Avg_Benchmark_Return_1Y: match?.Avg_Benchmark_Return_1Y ?? null,
      Avg_Benchmark_Return_5Y: match?.Avg_Benchmark_Return_5Y ?? null,
      Avg_Benchmark_Return_10Y: match?.Avg_Benchmark_Return_10Y ?? null,
    };
  });

  // ── Chart data ──
  const categoryChartData = categoryInsights.map((r) => ({
    label: r.Category_Name ?? "Other",
    aum: r.Total_AUM,
    funds: r.Number_of_Schemes,
  }));

  const buildPie = (values: Array<{ label: string; value: number }>) => {
    const total = values.reduce((s, i) => s + i.value, 0) || 1;
    let offset = 0;
    const slices = values.map((item, idx) => {
      const pct = (item.value / total) * 100;
      const slice = `${palette[idx % palette.length]} ${offset}% ${offset + pct}%`;
      offset += pct;
      return slice;
    });
    return `conic-gradient(${slices.join(", ")})`;
  };

  const topCats = [...categoryChartData].sort((a, b) => b.aum - a.aum).slice(0, 5);
  const otherAum = categoryChartData.filter((r) => !topCats.find((t) => t.label === r.label)).reduce((s, i) => s + i.aum, 0);
  const aumChart = otherAum
    ? [...topCats.map((i) => ({ label: i.label, value: i.aum })), { label: "Other", value: otherAum }]
    : topCats.map((i) => ({ label: i.label, value: i.aum }));
  const totalAum = aumChart.reduce((s, i) => s + i.value, 0) || 1;

  const topFundsCats = [...categoryChartData].sort((a, b) => b.funds - a.funds).slice(0, 5);
  const otherFunds = categoryChartData.filter((r) => !topFundsCats.find((t) => t.label === r.label)).reduce((s, i) => s + i.funds, 0);
  const fundsChart = otherFunds
    ? [...topFundsCats.map((i) => ({ label: i.label, value: i.funds })), { label: "Other", value: otherFunds }]
    : topFundsCats.map((i) => ({ label: i.label, value: i.funds }));
  const totalFunds = fundsChart.reduce((s, i) => s + i.value, 0) || 1;

  const chartCategories = [...categoryInsights]
    .filter((r) => r.Category_Name)
    .sort((a, b) => (b.Avg_Alpha_3Y ?? 0) - (a.Avg_Alpha_3Y ?? 0))
    .slice(0, 6);
  const maxAlpha = Math.max(1, ...chartCategories.map((r) => Math.abs(r.Avg_Alpha_3Y ?? 0)));
  const maxBeat = Math.max(1, ...chartCategories.map((r) => r.Pct_Funds_Beating_Benchmark_3Y ?? 0));

  // "Active skill" verdict per category
  const categoryWithVerdict = categoryInsights.map((r) => {
    const alpha = r.Avg_Alpha_3Y ?? 0;
    const beat = r.Pct_Funds_Beating_Benchmark_3Y ?? 0;
    let verdict = "🤔 Mixed";
    let color = "#D97706";
    if (alpha > 1 && beat > 55) { verdict = "✅ Active adds value"; color = "#059669"; }
    else if (alpha < 0 || beat < 40) { verdict = "📊 Index wins"; color = "#2563EB"; }
    return { ...r, verdict, color };
  });

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif", color: "#1F2937" }}>

      {/* ═══════════════════════════════════════════════════════
          HERO — dark, with sub-nav + 4 internal anchor links
      ═══════════════════════════════════════════════════════ */}
      <section style={{ background: "linear-gradient(155deg,#0F172A 0%,#1B3A5C 50%,#0C3320 100%)", position: "relative", overflow: "hidden" }}>
        {/* dot grid */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)", backgroundSize: "28px 28px", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: -80, right: -40, width: "400px", height: "400px", background: "radial-gradient(circle,rgba(59,130,246,0.13) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, left: "8%", width: "320px", height: "320px", background: "radial-gradient(circle,rgba(16,185,129,0.1) 0%,transparent 70%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", maxWidth: "1100px", margin: "0 auto", padding: "clamp(28px,5vw,52px) clamp(16px,4vw,28px) clamp(24px,4vw,40px)" }}>

          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "18px", flexWrap: "wrap" }}>
            <a href="/" style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>Nivesify</a>
            <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "11px" }}>/</span>
            <span style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Mutual Fund World</span>
          </div>

          {/* Headline */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.28)", borderRadius: "100px", padding: "5px 14px", marginBottom: "14px" }}>
            <span style={{ width: "6px", height: "6px", background: "#60A5FA", borderRadius: "50%", display: "inline-block" }} />
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#93C5FD", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>Live Industry Data · Updated Daily</span>
          </div>

          <h1 style={{ fontSize: "clamp(1.6rem,5vw,3rem)", fontWeight: 900, color: "white", lineHeight: 1.1, letterSpacing: "-0.025em", marginBottom: "10px", maxWidth: "700px" }}>
            What is the mutual fund<br />
            <span style={{ background: "linear-gradient(90deg,#60A5FA 0%,#34D399 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              industry actually doing?
            </span>
          </h1>
          <p style={{ fontSize: "clamp(12px,2vw,15px)", color: "rgba(255,255,255,0.6)", lineHeight: 1.75, maxWidth: "560px", marginBottom: "28px" }}>
            Before picking a fund, understand the big picture. Which fund types are beating the market? Where do experts genuinely add value? Where is a simple index fund better? All answered here, in plain English.
          </p>

          {/* ── SECTION SUB-NAV (top-level tabs) ── */}
          <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", padding: "6px 8px", display: "block", width: "100%", maxWidth: "fit-content", boxSizing: "border-box", overflow: "hidden", marginBottom: "28px" }}>
            <div style={{ display: "flex", gap: "4px", overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" as const }}>
              {[
                { label: "Why Mutual Funds",     href: "/why-mutual-fund",       active: false },
                { label: "Smart Fund Finder",    href: "/mutual-fund-match",     active: false },
                { label: "MF Industry Analysis", href: "/mutual-fund-analysis",  active: true  },
                { label: "Active Funds",         href: "/active-funds",          active: false },
                { label: "Passive Funds",        href: "/index-funds",           active: false },
              ].map((tab) => (
                <a key={tab.href} href={tab.href} style={{
                  flexShrink: 0, textDecoration: "none", padding: "6px 14px", borderRadius: "100px",
                  fontSize: "12px", fontWeight: tab.active ? 700 : 500,
                  color: tab.active ? "#60A5FA" : "rgba(255,255,255,0.6)",
                  background: tab.active ? "rgba(255,255,255,0.12)" : "transparent",
                  border: tab.active ? "1px solid rgba(255,255,255,0.25)" : "1px solid transparent",
                  whiteSpace: "nowrap", letterSpacing: "0.01em",
                }}>{tab.label}</a>
              ))}
            </div>
          </div>

          {/* ── 4 INTERNAL SECTION ANCHORS ── */}
          <div>
            <p style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em", textTransform: "uppercase" as const, marginBottom: "10px" }}>
              Jump to a section
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "8px" }}>
              {[
                { label: "📊 Industry Snapshot",  href: "#snapshot",        desc: "Size & health" },
                { label: "🥊 Active vs Index",    href: "#active-vs-index", desc: "Where experts win" },
                { label: "🏆 Category Rankings",  href: "#categories",      desc: "Best fund types" },
                { label: "🔬 Deep Data",           href: "#deep-data",       desc: "Full breakdown" },
              ].map((a) => (
                <a key={a.href} href={a.href} style={{
                  textDecoration: "none", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)",
                  borderRadius: "12px", padding: "10px 12px", display: "flex", flexDirection: "column" as const, gap: "2px",
                  minHeight: "52px", justifyContent: "center",
                }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{a.label}</span>
                  <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>{a.desc}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Live stat strip */}
          <div style={{ display: "flex", gap: "clamp(16px,3vw,36px)", flexWrap: "wrap", marginTop: "28px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            {[
              { v: fmt(industryInsight?.Number_of_Schemes, 0), l: "Funds tracked", c: "#60A5FA" },
              { v: `₹${fmt(industryInsight?.Total_AUM ? industryInsight.Total_AUM / 100000 : null, 1)}L Cr`, l: "Total industry money", c: "#34D399" },
              { v: fmtPctPlain(industryInsight?.Pct_Funds_Beating_Benchmark_3Y), l: "Beat market (3 yrs)", c: "#FBBF24" },
              { v: manifest?.reportDate ?? "Latest", l: "Data as of", c: "#C4B5FD" },
            ].map((m, i) => (
              <div key={i}>
                <div style={{ fontSize: "clamp(15px,2.5vw,20px)", fontWeight: 800, color: m.c, lineHeight: 1 }}>{m.v}</div>
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.45)", marginTop: "3px", fontWeight: 500 }}>{m.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 1 — INDUSTRY SNAPSHOT
      ═══════════════════════════════════════════════════════ */}
      <section id="snapshot" style={{ maxWidth: "1100px", margin: "0 auto", padding: "clamp(32px,5vw,56px) clamp(16px,4vw,28px) 0" }}>

        {/* Section label */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "100px", padding: "4px 13px", marginBottom: "10px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#2563EB", letterSpacing: "0.09em", textTransform: "uppercase" as const }}>Section 1 · Industry Snapshot</span>
        </div>
        <h2 style={{ fontSize: "clamp(18px,3vw,26px)", fontWeight: 800, color: "#0F172A", margin: "0 0 6px" }}>How big is the mutual fund industry — and how healthy?</h2>
        <p style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.7, maxWidth: "620px", marginBottom: "28px" }}>
          Think of this as the "vital signs" of India's mutual fund universe. A healthy industry = more competition, better funds, more investor choices.
        </p>

        {/* 4 stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: "14px", marginBottom: "28px" }}>
          {[
            {
              icon: "🏦", label: "Total money in mutual funds", value: `₹${fmt(industryInsight?.Total_AUM ? industryInsight.Total_AUM / 100000 : null, 1)} Lakh Cr`,
              sub: "That's roughly India's entire annual GDP going into mutual funds.", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE",
            },
            {
              icon: "🗂️", label: "Number of funds available", value: fmt(industryInsight?.Number_of_Schemes, 0),
              sub: "More options than you could ever need — which is why we filter them for you.", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0",
            },
            {
              icon: "📈", label: "Average 3-year return", value: fmtPctPlain(industryInsight?.Avg_3Y_Return),
              sub: "Across all funds. Individual fund results vary a lot — see our rankings below.", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A",
            },
            {
              icon: "🏆", label: "% funds beating the market", value: fmtPctPlain(industryInsight?.Pct_Funds_Beating_Benchmark_3Y),
              sub: "Only this fraction of funds actually outperformed a simple index over 3 years.", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE",
            },
          ].map((c, i) => (
            <div key={i} style={{ background: c.bg, border: `1.5px solid ${c.border}`, borderRadius: "20px", padding: "20px" }}>
              <div style={{ fontSize: "26px", marginBottom: "10px" }}>{c.icon}</div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: c.color, textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: "5px" }}>{c.label}</div>
              <div style={{ fontSize: "clamp(20px,3vw,26px)", fontWeight: 900, color: "#0F172A", marginBottom: "8px", lineHeight: 1 }}>{c.value}</div>
              <div style={{ fontSize: "11px", color: "#64748B", lineHeight: 1.55 }}>{c.sub}</div>
            </div>
          ))}
        </div>

        {/* More stats grid */}
        <div style={{ background: "white", border: "1.5px solid #E2E8F0", borderRadius: "20px", padding: "clamp(16px,3vw,24px)", marginBottom: "32px" }}>
          <div style={{ fontSize: "13px", fontWeight: 800, color: "#0F172A", marginBottom: "16px" }}>📋 More numbers, plain English</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: "16px" }}>
            {[
              { label: "Average 1-year return", value: fmtPctPlain(industryInsight?.Avg_1Y_Return), note: "Short-term snapshot — don't make decisions off this alone" },
              { label: "Average 5-year return", value: fmtPctPlain(industryInsight?.Avg_5Y_Return), note: "5 years is a better lens for equity funds" },
              { label: "What the market returned (3Y)", value: fmtPctPlain(industryInsight?.Avg_Benchmark_Return_3Y), note: "This is what a simple index fund would have given" },
              { label: "Average extra return vs market", value: fmtPct(industryInsight?.Avg_Alpha_3Y), note: "Positive = funds added value on average. Negative = index was better." },
              { label: "Consistency score (IR)", value: fmt(industryInsight?.Avg_IR_3Y), note: "Above 0.5 = consistently good. Below = hit-or-miss performance." },
              { label: "Typical fund size", value: `₹${fmt(industryInsight?.Median_AUM, 0)} Cr`, note: "Median AUM — larger isn't always better" },
            ].map((s, i) => (
              <div key={i} style={{ background: "#F8FAFC", borderRadius: "12px", padding: "14px" }}>
                <div style={{ fontSize: "10px", color: "#94A3B8", fontWeight: 600, marginBottom: "4px", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{s.label}</div>
                <div style={{ fontSize: "clamp(18px,2.5vw,22px)", fontWeight: 800, color: "#0F172A", marginBottom: "5px" }}>{s.value}</div>
                <div style={{ fontSize: "10.5px", color: "#64748B", lineHeight: 1.5 }}>{s.note}</div>
              </div>
            ))}
          </div>
        </div>

        {/* AUM + Funds pie charts */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))", gap: "16px", marginBottom: "32px" }}>
          {[
            { title: "Where is most money concentrated?", sub: "AUM by category — shows where Indian investors are betting the most", data: aumChart, total: totalAum, unit: "of all MF money" },
            { title: "Which category has the most funds?", sub: "Number of funds by category — more funds = more choices to compare", data: fundsChart, total: totalFunds, unit: "of all funds" },
          ].map((chart, ci) => (
            <div key={ci} style={{ background: "white", border: "1.5px solid #E2E8F0", borderRadius: "20px", padding: "clamp(16px,3vw,24px)" }}>
              <div style={{ fontWeight: 800, fontSize: "14px", color: "#0F172A", marginBottom: "4px" }}>{chart.title}</div>
              <div style={{ fontSize: "12px", color: "#64748B", marginBottom: "20px" }}>{chart.sub}</div>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: "16px" }}>
                {/* Donut */}
                <div style={{ position: "relative", width: "90px", height: "90px", flexShrink: 0 }}>
                  {(() => {
                    const total2 = chart.data.reduce((s, i) => s + i.value, 0) || 1;
                    let off = 0;
                    const slices = chart.data.map((item, idx) => {
                      const pct = (item.value / total2) * 100;
                      const slice = `${palette[idx % palette.length]} ${off}% ${off + pct}%`;
                      off += pct;
                      return slice;
                    });
                    const background = `conic-gradient(${slices.join(", ")})`;
                    return <div style={{ width: "90px", height: "90px", borderRadius: "50%", background }} />;
                  })()}
                  <div style={{ position: "absolute", inset: "18px", borderRadius: "50%", background: "white" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: "6px" }}>
                  {chart.data.map((item, idx) => (
                    <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: palette[idx % palette.length], flexShrink: 0 }} />
                      <span style={{ fontSize: "11px", color: "#475569", lineHeight: 1.3 }}>
                        <strong style={{ color: "#1F2937" }}>{item.label}</strong>{" "}
                        <span style={{ color: "#94A3B8" }}>({Math.round((item.value / chart.total) * 100)}% {chart.unit})</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 2 — ACTIVE vs INDEX
      ═══════════════════════════════════════════════════════ */}
      <section id="active-vs-index" style={{ maxWidth: "1100px", margin: "0 auto", padding: "clamp(40px,5vw,64px) clamp(16px,4vw,28px) 0" }}>

        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "100px", padding: "4px 13px", marginBottom: "10px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#059669", letterSpacing: "0.09em", textTransform: "uppercase" as const }}>Section 2 · Active vs Index</span>
        </div>
        <h2 style={{ fontSize: "clamp(18px,3vw,26px)", fontWeight: 800, color: "#0F172A", margin: "0 0 6px" }}>In which fund types do experts actually beat the market?</h2>
        <p style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.7, maxWidth: "620px", marginBottom: "28px" }}>
          "Active" funds are run by experts who pick stocks — but they charge more. "Index" funds just copy the market automatically — cheap and simple. The question is: does paying for expertise actually get you better results? Let the data answer.
        </p>

        {/* Explainer callout */}
        <div style={{ background: "linear-gradient(90deg,#ECFDF5,#EFF6FF)", border: "1.5px solid #A7F3D0", borderRadius: "16px", padding: "16px 20px", marginBottom: "24px", display: "flex", gap: "14px", alignItems: "flex-start" }}>
          <span style={{ fontSize: "22px", flexShrink: 0 }}>💡</span>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#065F46", marginBottom: "6px" }}>How to read the verdict below</div>
            <div style={{ fontSize: "12px", color: "#475569", lineHeight: 1.65 }}>
              <strong>✅ Active adds value</strong> — on average, actively managed funds in this category earn more than a simple index fund. Worth paying for expertise.<br />
              <strong>📊 Index wins</strong> — funds in this category mostly fail to beat the index. Save money with a low-cost index fund.<br />
              <strong>🤔 Mixed</strong> — some do, some don't. Picking carefully matters more here.
            </div>
          </div>
        </div>

        {/* Category verdict cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))", gap: "12px", marginBottom: "32px" }}>
          {categoryWithVerdict.map((cat, i) => (
            <div key={i} style={{ background: "white", border: "1.5px solid #E2E8F0", borderRadius: "18px", padding: "18px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div style={{ fontSize: "14px", fontWeight: 800, color: "#0F172A" }}>{cat.Category_Name}</div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: cat.color, background: `${cat.color}15`, border: `1px solid ${cat.color}40`, borderRadius: "100px", padding: "3px 10px", whiteSpace: "nowrap" as const, flexShrink: 0 }}>
                  {cat.verdict}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {[
                  { label: "Funds in category", value: cat.Number_of_Schemes.toString() },
                  { label: "Avg 3Y return", value: fmtPctPlain(cat.Avg_3Y_Return) },
                  { label: "Extra return vs index", value: fmtPct(cat.Avg_Alpha_3Y), highlight: true, positive: (cat.Avg_Alpha_3Y ?? 0) >= 0 },
                  { label: "% beating market", value: fmtPctPlain(cat.Pct_Funds_Beating_Benchmark_3Y), highlight: true, positive: (cat.Pct_Funds_Beating_Benchmark_3Y ?? 0) >= 50 },
                ].map((s, j) => (
                  <div key={j} style={{ background: "#F8FAFC", borderRadius: "10px", padding: "10px" }}>
                    <div style={{ fontSize: "9.5px", color: "#94A3B8", fontWeight: 600, marginBottom: "3px", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{s.label}</div>
                    <div style={{ fontSize: "15px", fontWeight: 800, color: (s as any).highlight ? ((s as any).positive ? "#059669" : "#DC2626") : "#0F172A" }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Alpha bar chart */}
        <div style={{ background: "white", border: "1.5px solid #E2E8F0", borderRadius: "20px", padding: "clamp(16px,3vw,24px)", marginBottom: "32px" }}>
          <div style={{ fontWeight: 800, fontSize: "15px", color: "#0F172A", marginBottom: "4px" }}>Visual: How much extra return does each category deliver?</div>
          <div style={{ fontSize: "12px", color: "#64748B", marginBottom: "20px" }}>The green bars show how much more (or less) the average active fund earned vs a simple index fund over 3 years.</div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: "16px" }}>
            {chartCategories.map((row) => {
              const alpha = row.Avg_Alpha_3Y ?? 0;
              const beat = row.Pct_Funds_Beating_Benchmark_3Y ?? 0;
              const alphaW = Math.round((Math.abs(alpha) / maxAlpha) * 100);
              const beatW = Math.round((beat / maxBeat) * 100);
              return (
                <div key={row.Category_Name}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px", flexWrap: "wrap", gap: "4px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#374151" }}>{row.Category_Name}</span>
                    <span style={{ fontSize: "11px", color: "#94A3B8" }}>Extra return: <strong style={{ color: alpha >= 0 ? "#059669" : "#DC2626" }}>{fmtPct(alpha)}</strong> · Beat rate: <strong style={{ color: "#374151" }}>{fmtPctPlain(beat)}</strong></span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" as const, gap: "4px" }}>
                    <div>
                      <div style={{ fontSize: "9px", color: "#94A3B8", marginBottom: "3px", fontWeight: 600 }}>EXTRA RETURN VS INDEX (ALPHA)</div>
                      <div style={{ height: "10px", borderRadius: "100px", background: "#F1F5F9", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${alphaW}%`, background: alpha >= 0 ? "linear-gradient(90deg,#10B981,#059669)" : "linear-gradient(90deg,#EF4444,#DC2626)", borderRadius: "100px", transition: "width 0.8s ease" }} />
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "9px", color: "#94A3B8", marginBottom: "3px", fontWeight: 600 }}>% OF FUNDS BEATING THEIR INDEX</div>
                      <div style={{ height: "10px", borderRadius: "100px", background: "#F1F5F9", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${beatW}%`, background: "linear-gradient(90deg,#3B82F6,#2563EB)", borderRadius: "100px" }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: "20px", marginTop: "16px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#64748B" }}>
              <div style={{ width: "16px", height: "8px", background: "linear-gradient(90deg,#10B981,#059669)", borderRadius: "100px" }} />
              Extra return above market
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#64748B" }}>
              <div style={{ width: "16px", height: "8px", background: "linear-gradient(90deg,#3B82F6,#2563EB)", borderRadius: "100px" }} />
              % of funds beating their index
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#64748B" }}>
              <div style={{ width: "16px", height: "8px", background: "linear-gradient(90deg,#EF4444,#DC2626)", borderRadius: "100px" }} />
              Negative alpha (index was better)
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 3 — CATEGORY RANKINGS
      ═══════════════════════════════════════════════════════ */}
      <section id="categories" style={{ maxWidth: "1100px", margin: "0 auto", padding: "clamp(40px,5vw,64px) clamp(16px,4vw,28px) 0" }}>

        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "100px", padding: "4px 13px", marginBottom: "10px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#D97706", letterSpacing: "0.09em", textTransform: "uppercase" as const }}>Section 3 · Category Rankings</span>
        </div>
        <h2 style={{ fontSize: "clamp(18px,3vw,26px)", fontWeight: 800, color: "#0F172A", margin: "0 0 6px" }}>Which fund types have historically performed best?</h2>
        <p style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.7, maxWidth: "620px", marginBottom: "28px" }}>
          Ranked by how much extra return they delivered above the market over 3 years. This isn't a guarantee — but it tells you where skilled fund managers have historically shown up.
        </p>

        {/* Ranked cards — mobile-first, no horizontal scroll needed */}
        <div style={{ display: "flex", flexDirection: "column" as const, gap: "10px", marginBottom: "32px" }}>
          {[...categoryInsights]
            .sort((a, b) => (b.Avg_Alpha_3Y ?? 0) - (a.Avg_Alpha_3Y ?? 0))
            .map((row, idx) => {
              const alpha = row.Avg_Alpha_3Y ?? 0;
              const beat = row.Pct_Funds_Beating_Benchmark_3Y ?? 0;
              let verdict = "🤔 Mixed"; let vc = "#D97706";
              if (alpha > 1 && beat > 55) { verdict = "✅ Active adds value"; vc = "#059669"; }
              else if (alpha < 0 || beat < 40) { verdict = "📊 Index wins"; vc = "#2563EB"; }
              const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : null;
              return (
                <div key={idx} style={{
                  background: idx === 0 ? "#F0FDF4" : "white",
                  border: `1.5px solid ${idx === 0 ? "#A7F3D0" : "#E2E8F0"}`,
                  borderRadius: "16px",
                  padding: "clamp(12px,3vw,18px)",
                  display: "flex",
                  flexDirection: "column" as const,
                  gap: "10px",
                }}>
                  {/* Top row: rank + name + verdict */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" as const }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                      <div style={{ fontSize: "clamp(18px,3vw,22px)", lineHeight: 1, flexShrink: 0 }}>
                        {medal ?? <span style={{ fontSize: "13px", fontWeight: 800, color: "#94A3B8", minWidth: "28px", display: "inline-block", textAlign: "center" }}>{idx + 1}</span>}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: "clamp(12px,2vw,14px)", fontWeight: 800, color: "#0F172A", lineHeight: 1.25 }}>{row.Category_Name}</div>
                        <div style={{ fontSize: "10px", color: "#94A3B8", marginTop: "2px" }}>{row.Number_of_Schemes} funds in this category</div>
                      </div>
                    </div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: vc, background: `${vc}15`, border: `1px solid ${vc}35`, borderRadius: "100px", padding: "5px 11px", whiteSpace: "nowrap" as const, flexShrink: 0 }}>
                      {verdict}
                    </div>
                  </div>
                  {/* Stats row: 4 pills */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "6px" }}>
                    {[
                      { label: "3Y Return", value: fmtPctPlain(row.Avg_3Y_Return), color: "#0F172A" },
                      { label: "5Y Return", value: fmtPctPlain(row.Avg_5Y_Return), color: "#0F172A" },
                      { label: "Extra vs Index", value: fmtPct(alpha), color: alpha >= 0 ? "#059669" : "#DC2626" },
                      { label: "Beat Rate", value: fmtPctPlain(beat), color: beat >= 50 ? "#059669" : "#DC2626" },
                    ].map((s, si) => (
                      <div key={si} style={{ background: "#F8FAFC", borderRadius: "10px", padding: "9px 10px" }}>
                        <div style={{ fontSize: "9px", color: "#94A3B8", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "3px" }}>{s.label}</div>
                        <div style={{ fontSize: "clamp(14px,2.5vw,16px)", fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                  {/* Beat rate bar */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "9px", color: "#94A3B8", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>% of funds beating their benchmark</span>
                      <span style={{ fontSize: "9px", fontWeight: 800, color: beat >= 50 ? "#059669" : "#EF4444" }}>{fmtPctPlain(beat)}</span>
                    </div>
                    <div style={{ height: "6px", borderRadius: "100px", background: "#F1F5F9", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(100, Math.round(beat))}%`, background: beat >= 50 ? "linear-gradient(90deg,#10B981,#059669)" : "linear-gradient(90deg,#EF4444,#DC2626)", borderRadius: "100px" }} />
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Sub-category table from existing component */}
        <AnalysisInsightsTables
          categoryInsights={categoryInsights}
          subCategoryInsights={subCategoryInsights}
        />
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 4 — DEEP DATA
      ═══════════════════════════════════════════════════════ */}
      <section id="deep-data" style={{ maxWidth: "1100px", margin: "0 auto", padding: "clamp(40px,5vw,64px) clamp(16px,4vw,28px) clamp(48px,6vw,80px)" }}>

        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: "100px", padding: "4px 13px", marginBottom: "10px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#7C3AED", letterSpacing: "0.09em", textTransform: "uppercase" as const }}>Section 4 · Full Data</span>
        </div>
        <h2 style={{ fontSize: "clamp(18px,3vw,26px)", fontWeight: 800, color: "#0F172A", margin: "0 0 6px" }}>Full sub-category breakdown — every metric, explained</h2>
        <p style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.7, maxWidth: "620px", marginBottom: "20px" }}>
          For those who want to go deeper. This table shows every sub-category with all performance metrics. Hover over column headers to understand what each number means.
        </p>

        {/* Metric glossary */}
        <div style={{ background: "white", border: "1.5px solid #E2E8F0", borderRadius: "16px", padding: "16px 20px", marginBottom: "24px" }}>
          <div style={{ fontSize: "12px", fontWeight: 800, color: "#374151", marginBottom: "12px" }}>📖 What do these numbers mean?</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: "10px" }}>
            {[
              { term: "Alpha (Extra Return)", def: "How much more (or less) the fund returned vs its benchmark index. Positive = fund added value. Negative = index was better." },
              { term: "Information Ratio (IR)", def: "How consistently a fund beats its benchmark. Above 0.5 = reliably good. Below 0 = inconsistent. Think of it as the quality of alpha." },
              { term: "Beat Rate", def: "What % of funds in this category beat their own benchmark over 3 years. Above 50% = active tilt is worth it." },
              { term: "Benchmark Return", def: "What a simple index fund tracking this category's benchmark would have returned. The bar that active funds need to clear." },
            ].map((g, i) => (
              <div key={i} style={{ background: "#F8FAFC", borderRadius: "10px", padding: "12px" }}>
                <div style={{ fontSize: "11px", fontWeight: 800, color: "#1E40AF", marginBottom: "4px" }}>{g.term}</div>
                <div style={{ fontSize: "11px", color: "#64748B", lineHeight: 1.55 }}>{g.def}</div>
              </div>
            ))}
          </div>
        </div>

        <AnalysisFullInsightsTable enrichedInsights={enrichedInsights} />

        {/* Disclaimer */}
        <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "14px 18px", marginTop: "32px", fontSize: "10.5px", color: "#94A3B8", lineHeight: 1.65, textAlign: "center" as const }}>
          <strong style={{ color: "#64748B" }}>Important Disclaimer:</strong> This data is for informational purposes only and does not constitute investment advice. Past performance is not indicative of future returns. All data is sourced from AMFI and updated daily. Please read all scheme-related documents carefully and consult a SEBI-registered advisor before investing.
        </div>

        {/* CTA strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))", gap: "12px", marginTop: "28px" }}>
          <a href="/mutual-fund-match" style={{ textDecoration: "none", background: "linear-gradient(90deg,#059669,#2563EB)", borderRadius: "18px", padding: "clamp(16px,3vw,22px)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", boxShadow: "0 8px 28px rgba(5,150,105,0.25)" }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.75)", marginBottom: "3px" }}>Ready to find your fund?</div>
              <div style={{ fontSize: "clamp(14px,2.5vw,17px)", fontWeight: 900, color: "white", lineHeight: 1.2 }}>See the Fund Map →</div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", marginTop: "3px" }}>Every category ranked · Tap any cell to see why</div>
            </div>
            <span style={{ fontSize: "30px", flexShrink: 0 }}>🔬</span>
          </a>
          <a href="/active-funds" style={{ textDecoration: "none", background: "white", border: "1.5px solid #A7F3D0", borderRadius: "18px", padding: "clamp(16px,3vw,22px)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px" }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#059669", marginBottom: "3px" }}>Want active funds?</div>
              <div style={{ fontSize: "clamp(14px,2.5vw,17px)", fontWeight: 900, color: "#0F172A", lineHeight: 1.2 }}>Browse Active Funds →</div>
              <div style={{ fontSize: "10px", color: "#64748B", marginTop: "3px" }}>Ranked by skill, not past returns</div>
            </div>
            <span style={{ fontSize: "30px", flexShrink: 0 }}>🏆</span>
          </a>
          <a href="/index-funds" style={{ textDecoration: "none", background: "white", border: "1.5px solid #BFDBFE", borderRadius: "18px", padding: "clamp(16px,3vw,22px)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px" }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#2563EB", marginBottom: "3px" }}>Prefer index funds?</div>
              <div style={{ fontSize: "clamp(14px,2.5vw,17px)", fontWeight: 900, color: "#0F172A", lineHeight: 1.2 }}>Browse Passive Funds →</div>
              <div style={{ fontSize: "10px", color: "#64748B", marginTop: "3px" }}>Lowest cost · Tracks the market</div>
            </div>
            <span style={{ fontSize: "30px", flexShrink: 0 }}>📊</span>
          </a>
        </div>
      </section>

      <style>{`
        /* Hide scrollbars globally */
        * { -ms-overflow-style: none; scrollbar-width: none; box-sizing: border-box; }
        *::-webkit-scrollbar { display: none; }

        /* Anchor jump links hover */
        a[href^="#"] { transition: background 0.18s, border-color 0.18s; }
        a[href^="#"]:hover { background: rgba(255,255,255,0.14) !important; border-color: rgba(255,255,255,0.28) !important; }

        /* Ensure all images/iframes don't overflow */
        img, iframe, table { max-width: 100%; }

        /* Mobile: tighten section padding */
        @media (max-width: 640px) {
          section { padding-left: 14px !important; padding-right: 14px !important; }
        }

        /* Mobile: stat cards single col */
        @media (max-width: 480px) {
          /* AnalysisTables internal — make them scroll nicely */
          table { min-width: 340px; font-size: 10px; }
          th, td { padding: 8px 7px !important; font-size: 10px !important; }

          /* Verdict cards: stack name + badge vertically on tiny screens */
          .verdict-row { flex-direction: column !important; align-items: flex-start !important; }
        }

        /* Tablet tweaks */
        @media (min-width: 481px) and (max-width: 768px) {
          table { font-size: 11px; }
          th, td { padding: 10px 9px !important; }
        }

        /* Smooth scroll for anchor links */
        html { scroll-behavior: smooth; }

        /* Prevent text overflow on fund names */
        .fund-name { word-break: break-word; overflow-wrap: break-word; }
      `}</style>
    </div>
  );
}