import type { Metadata } from "next";
import PassiveFundsContent from "@/components/PassiveFundsContent";
import { getBaseUrl } from "@/lib/base-url";
import type { ETFAnalytics, Manifest } from "@/lib/fund-types";

export const metadata: Metadata = {
  title: "Passive / Index Funds | Nivesify",
  description: "Compare index funds and ETFs by tracking difference, AUM, and benchmark fit. Find the tightest tracker for your index.",
  alternates: { canonical: "https://nivesify.com/index-funds" },
  openGraph: {
    title: "Passive / Index Funds | Nivesify",
    description: "Compare index funds and ETFs by tracking difference, AUM, and benchmark fit.",
    url: "https://nivesify.com/index-funds",
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
  return `${v.toFixed(d)}%`;
};
const fmtPctPlain = fmtPct;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default async function IndexFundsPage() {
  const baseUrl = getBaseUrl();
  const [etfs, manifest] = await Promise.all([
    fetchJson<ETFAnalytics[]>(baseUrl, "/api/etfs"),
    fetchJson<Manifest>(baseUrl, "/api/manifest"),
  ]);

  // ── Derived numbers for static sections ──
  const totalPassiveAum = etfs.reduce((s, e) => s + (e.Fund_AUM ?? 0), 0);
  const benchmarkSet = Array.from(new Set(etfs.map((e) => e.Benchmark_Name).filter(Boolean)));

  const medianTd = (() => {
    const vals = etfs
      .map((e) => e.Tracking_Diff_3Y)
      .filter((v): v is number => v !== null && v !== undefined)
      .map((v) => Math.abs(v))
      .sort((a, b) => a - b);
    return vals.length ? vals[Math.floor(vals.length / 2)] : null;
  })();

  // ── Best tracking difference overall ──
  const bestOverall = [...etfs]
    .filter((e) => e.Tracking_Diff_3Y !== null)
    .sort((a, b) => Math.abs(a.Tracking_Diff_3Y ?? 999) - Math.abs(b.Tracking_Diff_3Y ?? 999))[0] ?? null;

  // ── Bar chart: top 6 benchmarks by average TD (lowest = best) ──
  const tdByBenchmark = (() => {
    const grouped = new Map<string, number[]>();
    etfs.forEach((e) => {
      if (e.Tracking_Diff_3Y == null) return;
      const list = grouped.get(e.Benchmark_Name) ?? [];
      list.push(Math.abs(e.Tracking_Diff_3Y));
      grouped.set(e.Benchmark_Name, list);
    });
    return Array.from(grouped.entries())
      .map(([name, vals]) => ({ name, avg: vals.reduce((a, b) => a + b, 0) / vals.length }))
      .sort((a, b) => a.avg - b.avg)
      .slice(0, 6);
  })();
  const maxTd = Math.max(1, ...tdByBenchmark.map((r) => r.avg));

  // ── Benchmark stats (pre-computed on server, passed to client) ──
  const mean = (vals: Array<number | null | undefined>) => {
    const clean = vals.filter((v): v is number => v !== null && v !== undefined);
    return clean.length ? clean.reduce((a, b) => a + b, 0) / clean.length : null;
  };

  const benchmarkStatsMap = new Map<string, ETFAnalytics[]>();
  etfs.forEach((e) => {
    const key = e.Benchmark_Name ?? "Unknown";
    const list = benchmarkStatsMap.get(key) ?? [];
    list.push(e);
    benchmarkStatsMap.set(key, list);
  });

  const benchmarkStats = Array.from(benchmarkStatsMap.entries()).map(([name, list]) => {
    const tdVals = list
      .map((e) => e.Tracking_Diff_3Y)
      .filter((v): v is number => v !== null && v !== undefined)
      .map((v) => Math.abs(v))
      .sort((a, b) => a - b);
    const median = tdVals.length ? tdVals[Math.floor(tdVals.length / 2)] : null;
    const best = [...list]
      .filter((e) => e.Tracking_Diff_3Y !== null)
      .sort((a, b) => Math.abs(a.Tracking_Diff_3Y ?? 999) - Math.abs(b.Tracking_Diff_3Y ?? 999))[0];
    return {
      Benchmark: name,
      Tracker_Count: list.length,
      Total_AUM: list.reduce((s, e) => s + (e.Fund_AUM ?? 0), 0),
      Median_TD_3Y: median,
      Best_TD_3Y: best?.Tracking_Diff_3Y ?? null,
      Best_Fund: best?.ETF_Name ?? "—",
      Avg_Fund_Return_1Y: mean(list.map((e) => e.Fund_Return_1Y)),
      Avg_Fund_Return_3Y: mean(list.map((e) => e.Fund_Return_3Y)),
      Avg_Benchmark_Return_1Y: mean(list.map((e) => e.Benchmark_Return_1Y)),
      Avg_Benchmark_Return_3Y: mean(list.map((e) => e.Benchmark_Return_3Y)),
    };
  });

  // ── Shortlist groups ──
  const topBenchmarks = [...benchmarkStats]
    .sort((a, b) => (b.Total_AUM ?? 0) - (a.Total_AUM ?? 0))
    .slice(0, 6);

  const benchmarkLeaders = topBenchmarks.map((bm) => {
    const picks = etfs
      .filter((e) => e.Benchmark_Name === bm.Benchmark && e.Tracking_Diff_3Y !== null)
      .sort((a, b) => Math.abs(a.Tracking_Diff_3Y ?? 999) - Math.abs(b.Tracking_Diff_3Y ?? 999))
      .slice(0, 2);
    return { benchmark: bm.Benchmark, totalAum: bm.Total_AUM, picks };
  });

  // ── Highlight stat cards ──
  const lowestTdBenchmark = tdByBenchmark[0] ?? null;
  const biggestBenchmark = [...benchmarkStats].sort((a, b) => b.Total_AUM - a.Total_AUM)[0] ?? null;

  return (
    <div style={{ minHeight: "100vh", background: "#F0F7FF", fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif", color: "#1F2937" }}>

      {/* ═══════════════════════════════════════
          HERO
      ═══════════════════════════════════════ */}
      <section style={{ background: "linear-gradient(155deg,#0F172A 0%,#1A2E4A 40%,#0C2340 100%)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)", backgroundSize: "28px 28px", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: -80, right: -40, width: "400px", height: "400px", background: "radial-gradient(circle,rgba(56,189,248,0.12) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, left: "8%", width: "320px", height: "320px", background: "radial-gradient(circle,rgba(99,102,241,0.1) 0%,transparent 70%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", maxWidth: "1100px", margin: "0 auto", padding: "clamp(28px,5vw,52px) clamp(16px,4vw,28px) clamp(24px,4vw,40px)" }}>

          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "18px", flexWrap: "wrap" }}>
            <a href="/" style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>Nivesify</a>
            <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "11px" }}>/</span>
            <a href="/mutual-fund-analysis" style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>MF World</a>
            <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "11px" }}>/</span>
            <span style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>Passive Funds</span>
          </div>

          {/* Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.28)", borderRadius: "100px", padding: "5px 14px", marginBottom: "14px" }}>
            <span style={{ width: "6px", height: "6px", background: "#38BDF8", borderRadius: "50%", display: "inline-block" }} />
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#7DD3FC", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>Index Funds &amp; ETFs · Updated Daily</span>
          </div>

          <h1 style={{ fontSize: "clamp(1.6rem,5vw,3rem)", fontWeight: 900, color: "white", lineHeight: 1.1, letterSpacing: "-0.025em", marginBottom: "10px", maxWidth: "700px" }}>
            Own the market.<br />
            <span style={{ background: "linear-gradient(90deg,#38BDF8 0%,#818CF8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Minimise what leaks away.
            </span>
          </h1>
          <p style={{ fontSize: "clamp(12px,2vw,15px)", color: "rgba(255,255,255,0.6)", lineHeight: 1.75, maxWidth: "540px", marginBottom: "28px" }}>
            Passive funds copy an index automatically — no fund manager, no big fees, no guesswork. The only thing that matters: how tightly it tracks the index, and how large it is.
          </p>

          {/* Site-wide nav tabs */}
          <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", padding: "6px 8px", maxWidth: "fit-content", marginBottom: "28px" }}>
            <div style={{ display: "flex", gap: "4px", overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" as const }}>
              {[
                { label: "Why Mutual Funds",     href: "/why-mutual-fund",      active: false },
                { label: "Smart Fund Finder",    href: "/mutual-fund-match",    active: false },
                { label: "MF Industry Analysis", href: "/mutual-fund-analysis", active: false },
                { label: "Active Funds",         href: "/active-funds",         active: false },
                { label: "Passive Funds",        href: "/index-funds",          active: true  },
              ].map((tab) => (
                <a key={tab.href} href={tab.href} style={{ flexShrink: 0, textDecoration: "none", padding: "6px 14px", borderRadius: "100px", fontSize: "12px", fontWeight: tab.active ? 700 : 500, color: tab.active ? "#38BDF8" : "rgba(255,255,255,0.6)", background: tab.active ? "rgba(255,255,255,0.12)" : "transparent", border: tab.active ? "1px solid rgba(255,255,255,0.25)" : "1px solid transparent", whiteSpace: "nowrap" as const, letterSpacing: "0.01em" }}>
                  {tab.label}
                </a>
              ))}
            </div>
          </div>

          {/* Jump-to anchors */}
          <div>
            <p style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em", textTransform: "uppercase" as const, marginBottom: "10px" }}>Jump to a section</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "8px" }}>
              {[
                { label: "📘 Passive vs Active", href: "#passive-vs-active", desc: "Why indexing works" },
                { label: "📉 Where to Look",     href: "#where-to-look",    desc: "What makes a good tracker" },
                { label: "📊 Benchmark Table",   href: "#scoreboard",       desc: "All indices compared" },
                { label: "🏆 Top Picks",         href: "#top-picks",        desc: "Tightest trackers" },
                { label: "🧮 Fund Screener",     href: "#screener",         desc: "Filter every fund" },
              ].map((a) => (
                <a key={a.href} href={a.href} style={{ textDecoration: "none", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: "12px", padding: "10px 12px", display: "flex", flexDirection: "column" as const, gap: "2px", minHeight: "52px", justifyContent: "center" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{a.label}</span>
                  <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>{a.desc}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Live stat strip */}
          <div style={{ display: "flex", gap: "clamp(16px,3vw,36px)", flexWrap: "wrap", marginTop: "28px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            {[
              { v: fmt(etfs.length, 0),                 l: "Passive funds tracked",    c: "#38BDF8" },
              { v: fmt(benchmarkSet.length, 0),          l: "Indices with trackers",    c: "#818CF8" },
              { v: medianTd != null ? `${medianTd.toFixed(2)}%` : "—", l: "Median tracking diff 3Y",  c: "#34D399" },
              { v: new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(totalPassiveAum) + " Cr", l: "Total passive AUM",    c: "#FBBF24" },
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
          SECTION 1 — PASSIVE vs ACTIVE
      ═══════════════════════════════════════ */}
      <section id="passive-vs-active" style={{ maxWidth: "1100px", margin: "0 auto", padding: "clamp(32px,5vw,56px) clamp(16px,4vw,28px) 0" }}>

        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: "100px", padding: "4px 13px", marginBottom: "10px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#0891B2", letterSpacing: "0.09em", textTransform: "uppercase" as const }}>Section 1 · Passive vs Active</span>
        </div>
        <h2 style={{ fontSize: "clamp(18px,3vw,26px)", fontWeight: 800, color: "#0F172A", margin: "0 0 6px" }}>Why do passive funds exist?</h2>
        <p style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.7, maxWidth: "640px", marginBottom: "28px" }}>
          Most active fund managers fail to consistently beat the market after fees. Passive funds skip the manager entirely — they just copy an index mechanically, keeping costs near zero.
        </p>

        {/* Passive vs Active side-by-side */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))", gap: "16px", marginBottom: "28px" }}>
          <div style={{ background: "#EFF6FF", border: "1.5px solid #BFDBFE", borderRadius: "20px", padding: "24px" }}>
            <div style={{ fontSize: "28px", marginBottom: "10px" }}>📊</div>
            <div style={{ fontSize: "16px", fontWeight: 900, color: "#1E3A5F", marginBottom: "12px" }}>Passive / Index Fund</div>
            {[
              { icon: "✅", text: "Automatically copies an index — Nifty 50, Sensex, Midcap 150, etc." },
              { icon: "✅", text: "Fees as low as 0.05–0.2% per year" },
              { icon: "✅", text: "You get exactly what the market gives — no more, no less" },
              { icon: "💡", text: "The only skill required: picking the right index for your goal" },
            ].map((p, i) => (
              <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "8px" }}>
                <span style={{ fontSize: "14px", flexShrink: 0 }}>{p.icon}</span>
                <span style={{ fontSize: "12px", color: "#374151", lineHeight: 1.55 }}>{p.text}</span>
              </div>
            ))}
          </div>
          <div style={{ background: "#F0FDF4", border: "1.5px solid #A7F3D0", borderRadius: "20px", padding: "24px" }}>
            <div style={{ fontSize: "28px", marginBottom: "10px" }}>🧠</div>
            <div style={{ fontSize: "16px", fontWeight: 900, color: "#065F46", marginBottom: "12px" }}>Active Fund</div>
            {[
              { icon: "⚠️", text: "Fund manager handpicks stocks — can beat the market, or badly miss it" },
              { icon: "⚠️", text: "Fees of 1–2% per year, whether or not the manager adds value" },
              { icon: "✅", text: "Worth it only in specific categories where skill shows up consistently" },
              { icon: "💡", text: "See the Active Funds page to find which categories are worth paying for" },
            ].map((p, i) => (
              <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "8px" }}>
                <span style={{ fontSize: "14px", flexShrink: 0 }}>{p.icon}</span>
                <span style={{ fontSize: "12px", color: "#374151", lineHeight: 1.55 }}>{p.text}</span>
              </div>
            ))}
            <a href="/active-funds" style={{ display: "inline-block", marginTop: "10px", fontSize: "11px", fontWeight: 700, color: "#059669", textDecoration: "none" }}>View Active Funds →</a>
          </div>
        </div>

        {/* Passive philosophy callout */}
        <div style={{ background: "linear-gradient(90deg,#EFF6FF,#F0FDF4)", border: "1.5px solid #BFDBFE", borderRadius: "16px", padding: "20px 24px" }}>
          <div style={{ fontSize: "13px", fontWeight: 800, color: "#1E3A5F", marginBottom: "14px" }}>📖 The only two things that matter in a passive fund</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: "12px" }}>
            {[
              { term: "Tracking Difference (TD)", emoji: "📐", simple: "How closely it copies the index", detail: "If the Nifty 50 returned 12% and your fund returned 11.4%, tracking difference is -0.6%. Lower absolute TD = better execution. Target funds with TD below 0.5% over 3 years." },
              { term: "AUM (Fund Size)", emoji: "🏦", simple: "How much money is in the fund", detail: "Larger AUM means better liquidity, tighter bid-ask spreads for ETFs, and lower operational costs per unit. Aim for funds with at least ₹500 Cr AUM for ETFs." },
            ].map((m, i) => (
              <div key={i} style={{ background: "white", borderRadius: "12px", padding: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <span style={{ fontSize: "18px" }}>{m.emoji}</span>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 800, color: "#0891B2" }}>{m.term}</div>
                    <div style={{ fontSize: "10px", color: "#64748B", fontStyle: "italic" }}>{m.simple}</div>
                  </div>
                </div>
                <div style={{ fontSize: "11px", color: "#475569", lineHeight: 1.6 }}>{m.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 2 — WHERE TO LOOK
      ═══════════════════════════════════════ */}
      <section id="where-to-look" style={{ maxWidth: "1100px", margin: "0 auto", padding: "clamp(40px,5vw,64px) clamp(16px,4vw,28px) 0" }}>

        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(129,140,248,0.08)", border: "1px solid rgba(129,140,248,0.2)", borderRadius: "100px", padding: "4px 13px", marginBottom: "10px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#6366F1", letterSpacing: "0.09em", textTransform: "uppercase" as const }}>Section 2 · Where to Look</span>
        </div>
        <h2 style={{ fontSize: "clamp(18px,3vw,26px)", fontWeight: 800, color: "#0F172A", margin: "0 0 6px" }}>Which index should I pick?</h2>
        <p style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.7, maxWidth: "620px", marginBottom: "28px" }}>
          Start with what kind of exposure you want — large cap, mid cap, international, sector — then pick the best tracker for that index. Here's a simple framework.
        </p>

        {/* Index type cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px,1fr))", gap: "14px", marginBottom: "28px" }}>
          {[
            { icon: "🏢", title: "Large Cap (Core)", desc: "Nifty 50, Sensex, Nifty 100. Lowest risk, most liquid, great starting point for first-time investors. Match with Nifty 50 index funds.", tag: "✅ Suitable for beginners", tagColor: "#059669" },
            { icon: "🔺", title: "Mid & Small Cap", desc: "Nifty Midcap 150, Smallcap 250. Higher long-term returns historically but more volatile. Good for long horizons (7+ years).", tag: "⚠️ Higher volatility", tagColor: "#D97706" },
            { icon: "🌍", title: "International / Thematic", desc: "US indices (S&P 500, Nasdaq), gold, sectoral. Adds diversification. Use only as a satellite allocation.", tag: "💡 Diversification tool", tagColor: "#6366F1" },
            { icon: "⚡", title: "Factor / Smart Beta", desc: "Momentum, Quality, Value, Low Volatility. More targeted bets. Useful once you understand regular index funds well.", tag: "🧠 Advanced", tagColor: "#7C3AED" },
          ].map((c, i) => (
            <div key={i} style={{ background: "white", border: "1.5px solid #E2E8F0", borderRadius: "18px", padding: "18px" }}>
              <div style={{ fontSize: "24px", marginBottom: "8px" }}>{c.icon}</div>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "#0F172A", marginBottom: "6px" }}>{c.title}</div>
              <div style={{ fontSize: "11.5px", color: "#64748B", lineHeight: 1.6, marginBottom: "10px" }}>{c.desc}</div>
              <div style={{ fontSize: "10px", fontWeight: 700, color: c.tagColor }}>{c.tag}</div>
            </div>
          ))}
        </div>

        {/* Tracking difference bar chart */}
        <div style={{ background: "white", border: "1.5px solid #E2E8F0", borderRadius: "20px", padding: "clamp(16px,3vw,24px)" }}>
          <div style={{ fontWeight: 800, fontSize: "15px", color: "#0F172A", marginBottom: "4px" }}>
            Which benchmarks are tracked most precisely?
          </div>
          <div style={{ fontSize: "12px", color: "#64748B", marginBottom: "20px" }}>
            Average tracking difference (3Y) per benchmark. Shorter bar = tighter tracking = less leakage.
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: "14px" }}>
            {tdByBenchmark.map((row) => {
              const width = Math.round((row.avg / maxTd) * 100);
              const color = row.avg <= 0.5 ? "linear-gradient(90deg,#10B981,#059669)" : row.avg <= 1.5 ? "linear-gradient(90deg,#F59E0B,#D97706)" : "linear-gradient(90deg,#EF4444,#DC2626)";
              return (
                <div key={row.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", flexWrap: "wrap", gap: "4px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#374151" }}>{row.name}</span>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: row.avg <= 0.5 ? "#059669" : row.avg <= 1.5 ? "#D97706" : "#DC2626" }}>Avg TD {row.avg.toFixed(2)}%</span>
                  </div>
                  <div style={{ height: "12px", borderRadius: "100px", background: "#F1F5F9", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${width}%`, background: color, borderRadius: "100px" }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: "16px", marginTop: "18px", flexWrap: "wrap" }}>
            {[
              { bg: "linear-gradient(90deg,#10B981,#059669)", label: "Below 0.5% — Excellent tracking" },
              { bg: "linear-gradient(90deg,#F59E0B,#D97706)", label: "0.5–1.5% — Acceptable" },
              { bg: "linear-gradient(90deg,#EF4444,#DC2626)", label: "Above 1.5% — High leakage" },
            ].map((l, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "11px", color: "#64748B" }}>
                <div style={{ width: "14px", height: "8px", background: l.bg, borderRadius: "100px" }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 3 — BENCHMARK SCOREBOARD
      ═══════════════════════════════════════ */}
      <section id="scoreboard" style={{ maxWidth: "1100px", margin: "0 auto", padding: "clamp(40px,5vw,64px) clamp(16px,4vw,28px) 0" }}>

        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "100px", padding: "4px 13px", marginBottom: "10px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#2563EB", letterSpacing: "0.09em", textTransform: "uppercase" as const }}>Section 3 · Benchmark Scoreboard</span>
        </div>
        <h2 style={{ fontSize: "clamp(18px,3vw,26px)", fontWeight: 800, color: "#0F172A", margin: "0 0 6px" }}>Every index — compared by tracking and scale</h2>
        <p style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.7, maxWidth: "620px", marginBottom: "24px" }}>
          Each row is an index. See how many trackers exist, the best tracking difference achieved, and average returns. Good starting filter: pick rows with low Median TD and high Total AUM.
        </p>

        {/* Highlight stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: "12px", marginBottom: "24px" }}>
          {[
            { icon: "🏆", label: "Tightest tracking (3Y)", value: bestOverall?.ETF_Name ?? "—", sub: `TD: ${fmtPct(bestOverall?.Tracking_Diff_3Y)} · ${bestOverall?.Benchmark_Name ?? ""}` },
            { icon: "📉", label: "Best benchmark avg TD",  value: lowestTdBenchmark?.name ?? "—", sub: `Avg TD: ${lowestTdBenchmark?.avg.toFixed(2) ?? "—"}%` },
            { icon: "💰", label: "Largest index by AUM",   value: biggestBenchmark?.Benchmark ?? "—", sub: `₹${new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(biggestBenchmark?.Total_AUM ?? 0)} Cr total AUM` },
            { icon: "📡", label: "Median tracking diff",   value: medianTd != null ? `${medianTd.toFixed(2)}%` : "—", sub: "Industry-wide median (3Y)" },
            { icon: "🗂️", label: "Indices with trackers",  value: fmt(benchmarkSet.length, 0), sub: `${fmt(etfs.length, 0)} passive funds total` },
          ].map((c, i) => (
            <div key={i} style={{ background: "white", border: "1.5px solid #E2E8F0", borderRadius: "16px", padding: "16px" }}>
              <div style={{ fontSize: "22px", marginBottom: "8px" }}>{c.icon}</div>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: "4px" }}>{c.label}</div>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "#0F172A", lineHeight: 1.3, marginBottom: "4px" }}>{c.value}</div>
              <div style={{ fontSize: "10.5px", color: "#64748B" }}>{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Client component: benchmark table + top picks + screener */}
        <PassiveFundsContent
          etfs={etfs}
          benchmarkStats={benchmarkStats}
          benchmarkLeaders={benchmarkLeaders}
          manifest={manifest}
        />
      </section>

      {/* ═══════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════ */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "clamp(32px,5vw,48px) clamp(16px,4vw,28px) clamp(48px,6vw,80px)" }}>
        <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "14px 18px", marginBottom: "28px", fontSize: "10.5px", color: "#94A3B8", lineHeight: 1.65, textAlign: "center" as const }}>
          <strong style={{ color: "#64748B" }}>Important Disclaimer:</strong> This data is for informational purposes only and does not constitute investment advice. Past performance is not indicative of future returns. All data sourced from AMFI, updated daily. Read all scheme-related documents and consult a SEBI-registered advisor before investing.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))", gap: "12px" }}>
          <a href="/active-funds" style={{ textDecoration: "none", background: "linear-gradient(90deg,#065F46,#0F172A)", borderRadius: "18px", padding: "clamp(16px,3vw,22px)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", boxShadow: "0 8px 28px rgba(15,23,42,0.2)" }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.65)", marginBottom: "3px" }}>Willing to pay more for higher returns?</div>
              <div style={{ fontSize: "clamp(14px,2.5vw,17px)", fontWeight: 900, color: "white", lineHeight: 1.2 }}>Browse Active Funds →</div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", marginTop: "3px" }}>Find skilled fund managers by category</div>
            </div>
            <span style={{ fontSize: "28px", flexShrink: 0 }}>🧠</span>
          </a>
          <a href="/mutual-fund-analysis" style={{ textDecoration: "none", background: "white", border: "1.5px solid #BFDBFE", borderRadius: "18px", padding: "clamp(16px,3vw,22px)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px" }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#2563EB", marginBottom: "3px" }}>Want the big picture?</div>
              <div style={{ fontSize: "clamp(14px,2.5vw,17px)", fontWeight: 900, color: "#0F172A", lineHeight: 1.2 }}>Industry Analysis →</div>
              <div style={{ fontSize: "10px", color: "#64748B", marginTop: "3px" }}>How the whole MF market is doing</div>
            </div>
            <span style={{ fontSize: "28px", flexShrink: 0 }}>📊</span>
          </a>
          <a href="/mutual-fund-match" style={{ textDecoration: "none", background: "linear-gradient(90deg,#0891B2,#6366F1)", borderRadius: "18px", padding: "clamp(16px,3vw,22px)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", boxShadow: "0 8px 28px rgba(8,145,178,0.2)" }}>
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
        html { scroll-behavior: smooth; }
        a[href^="#"] { transition: background 0.18s, border-color 0.18s; }
        a[href^="#"]:hover { background: rgba(255,255,255,0.14) !important; border-color: rgba(255,255,255,0.28) !important; }
        @media (max-width: 640px) {
          section { padding-left: 14px !important; padding-right: 14px !important; }
        }
      `}</style>
    </div>
  );
}