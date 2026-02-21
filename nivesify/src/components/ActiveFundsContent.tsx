"use client";

import { useEffect, useMemo, useState } from "react";
import type { FundAnalytics, Manifest } from "@/lib/fund-types";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type CategoryReturnStat = {
  Category: string | null;
  Total_AUM: number;
  Avg_1Y_Return: number | null;
  Avg_3Y_Return: number | null;
  Avg_5Y_Return: number | null;
  Avg_10Y_Return: number | null;
  Avg_Benchmark_Return_1Y: number | null;
  Avg_Benchmark_Return_3Y: number | null;
  Avg_Benchmark_Return_5Y: number | null;
  Avg_Benchmark_Return_10Y: number | null;
};

type SubCategoryReturnStat = CategoryReturnStat & { Sub_Category: string | null };

type ShortlistGroup = {
  category: string;
  subCategory: string;
  aum: number;
  picks: FundAnalytics[];
};

export type ActiveFundsContentProps = {
  funds: FundAnalytics[];
  categoryReturnStats: CategoryReturnStat[];
  subCategoryReturnStats: SubCategoryReturnStat[];
  shortlistGroups: ShortlistGroup[];
  manifest: Manifest | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// FORMATTERS
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
const fmtCompact = (v: number | null | undefined) => {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(v);
};
const fmtAum = (v: number | null | undefined) =>
  v != null ? new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(v) : "—";

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function ReturnPair({ fund, bench }: { fund: number | null | undefined; bench: number | null | undefined }) {
  if (fund == null || bench == null) return <span style={{ color: "#CBD5E1" }}>—</span>;
  const beat = fund >= bench;
  return (
    <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700, fontSize: "12px" }}>
      <span style={{ color: beat ? "#059669" : "#DC2626" }}>{fund.toFixed(1)}</span>
      <span style={{ color: "#CBD5E1", fontWeight: 400 }}>/</span>
      <span style={{ color: "#94A3B8" }}>{bench.toFixed(1)}</span>
    </span>
  );
}

function AlphaCell({ v }: { v: number | null | undefined }) {
  if (v == null || Number.isNaN(v)) return <span style={{ color: "#CBD5E1" }}>—</span>;
  return <span style={{ fontWeight: 700, color: v >= 0 ? "#059669" : "#DC2626" }}>{fmtPct(v)}</span>;
}

const TH = ({ children, right }: { children: React.ReactNode; right?: boolean }) => (
  <th style={{ padding: "10px 12px", textAlign: right ? "right" : "left", fontWeight: 700, fontSize: "10px", color: "#64748B", letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap", background: "#F8FAFC", borderBottom: "2px solid #E2E8F0" }}>
    {children}
  </th>
);
const TD = ({ children, right, muted }: { children: React.ReactNode; right?: boolean; muted?: boolean }) => (
  <td style={{ padding: "10px 12px", textAlign: right ? "right" : "left", color: muted ? "#94A3B8" : undefined, fontSize: "12px", borderBottom: "1px solid #F1F5F9", verticalAlign: "middle" }}>
    {children}
  </td>
);

const inputStyle: React.CSSProperties = {
  width: "100%", borderRadius: "10px", border: "1.5px solid #E2E8F0",
  background: "white", padding: "8px 12px", fontSize: "12px",
  color: "#1F2937", outline: "none", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  fontSize: "10px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase",
  letterSpacing: "0.07em", display: "block", marginBottom: "5px",
};

// ─────────────────────────────────────────────────────────────────────────────
// STAT MINI-CELL (used in mobile cards)
// ─────────────────────────────────────────────────────────────────────────────

function StatCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#F8FAFC", borderRadius: "8px", padding: "8px 10px", border: "1px solid #F1F5F9" }}>
      <div style={{ fontSize: "8.5px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>{label}</div>
      <div style={{ fontSize: "12px" }}>{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ActiveFundsContent({
  funds,
  categoryReturnStats,
  subCategoryReturnStats,
  shortlistGroups,
  manifest,
}: ActiveFundsContentProps) {

  // ── Screener state ──
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [subCategory, setSubCategory] = useState("All");
  const [benchmark, setBenchmark] = useState("All");
  const [minAlpha3Y, setMinAlpha3Y] = useState("");
  const [minAlpha5Y, setMinAlpha5Y] = useState("");
  const [minIr3Y, setMinIr3Y] = useState("");
  const [minIr5Y, setMinIr5Y] = useState("");
  const [minAum, setMinAum] = useState("");
  const [topOnly, setTopOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<FundAnalytics | null>(null);
  const PAGE_SIZE = 20;

  const categories = useMemo(() =>
    Array.from(new Set(funds.map((f) => f.Category).filter(Boolean))).sort() as string[], [funds]);

  const subCategories = useMemo(() => {
    const pool = category === "All" ? funds : funds.filter((f) => f.Category === category);
    return Array.from(new Set(pool.map((f) => f.Sub_Category).filter(Boolean))).sort() as string[];
  }, [funds, category]);

  const benchmarks = useMemo(() =>
    Array.from(new Set(funds.map((f) => f.Benchmark_Name).filter(Boolean))).sort() as string[], [funds]);

  const filtered = useMemo(() => {
    const a3 = minAlpha3Y.trim() === "" ? null : Number(minAlpha3Y);
    const a5 = minAlpha5Y.trim() === "" ? null : Number(minAlpha5Y);
    const ir3 = minIr3Y.trim() === "" ? null : Number(minIr3Y);
    const ir5 = minIr5Y.trim() === "" ? null : Number(minIr5Y);
    const aum = minAum.trim() === "" ? null : Number(minAum);
    return [...funds]
      .filter((f) => {
        if (category !== "All" && f.Category !== category) return false;
        if (subCategory !== "All" && f.Sub_Category !== subCategory) return false;
        if (benchmark !== "All" && f.Benchmark_Name !== benchmark) return false;
        if (topOnly && f.Flag_Top_10_Percent !== "Yes") return false;
        if (a3 !== null && (f.Alpha_3Y ?? -999) < a3) return false;
        if (a5 !== null && (f.Alpha_5Y ?? -999) < a5) return false;
        if (ir3 !== null && (f.IR_3Y ?? -999) < ir3) return false;
        if (ir5 !== null && (f.IR_5Y ?? -999) < ir5) return false;
        if (aum !== null && (f.Current_AUM ?? 0) < aum) return false;
        if (query.trim()) {
          const q = query.toLowerCase();
          if (!String(f.Fund_Name ?? "").toLowerCase().includes(q) &&
              !String(f.AMC ?? "").toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => (b.Composite_Score ?? 0) - (a.Composite_Score ?? 0));
  }, [funds, query, category, subCategory, benchmark, topOnly, minAlpha3Y, minAlpha5Y, minIr3Y, minIr5Y, minAum]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSlice = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  useEffect(() => { setPage(0); }, [query, category, subCategory, benchmark, topOnly, minAlpha3Y, minAlpha5Y, minIr3Y, minIr5Y, minAum]);

  const resetFilters = () => {
    setQuery(""); setCategory("All"); setSubCategory("All"); setBenchmark("All");
    setMinAlpha3Y(""); setMinAlpha5Y(""); setMinIr3Y(""); setMinIr5Y(""); setMinAum(""); setTopOnly(false);
  };
  const hasFilters = !!(query || category !== "All" || subCategory !== "All" || benchmark !== "All" ||
    minAlpha3Y || minAlpha5Y || minIr3Y || minIr5Y || minAum || topOnly);

  const rowBg = (i: number) => i % 2 === 0 ? "white" : "#F8FAFC";

  // ── Category table sorted ──
  const sortedCats = [...categoryReturnStats].sort((a, b) => (b.Avg_3Y_Return ?? 0) - (a.Avg_3Y_Return ?? 0));
  const sortedSubCats = [...subCategoryReturnStats].sort((a, b) => (b.Avg_3Y_Return ?? 0) - (a.Avg_3Y_Return ?? 0));

  return (
    <>
      {/* ══════════════════════════════════════
          SECTION 3 TABLES
      ══════════════════════════════════════ */}

      {/* — Category returns table — */}
      <div style={{ background: "white", border: "1.5px solid #E2E8F0", borderRadius: "20px", overflow: "hidden", marginBottom: "20px" }}>
        <div style={{ padding: "16px 20px 14px", borderBottom: "1.5px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: "14px", color: "#0F172A" }}>Category returns vs benchmark</div>
            <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>
              <span style={{ color: "#059669", fontWeight: 700 }}>Green</span> = fund beat index ·{" "}
              <span style={{ color: "#DC2626", fontWeight: 700 }}>Red</span> = index was better · Sorted by 3Y return
            </div>
          </div>
        </div>

        {/* Desktop */}
        <div className="active-table-desktop" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><TH>Category</TH><TH right>AUM (Cr)</TH><TH right>1Y Fund/Index</TH><TH right>3Y Fund/Index</TH><TH right>5Y Fund/Index</TH><TH right>10Y Fund/Index</TH></tr></thead>
            <tbody>
              {sortedCats.map((row, i) => (
                <tr key={`cat-${row.Category}`} style={{ background: rowBg(i) }}>
                  <TD><span style={{ fontWeight: 600, color: "#0F172A" }}>{row.Category ?? "—"}</span></TD>
                  <TD right muted>{fmtAum(row.Total_AUM)}</TD>
                  <TD right><ReturnPair fund={row.Avg_1Y_Return} bench={row.Avg_Benchmark_Return_1Y} /></TD>
                  <TD right><ReturnPair fund={row.Avg_3Y_Return} bench={row.Avg_Benchmark_Return_3Y} /></TD>
                  <TD right><ReturnPair fund={row.Avg_5Y_Return} bench={row.Avg_Benchmark_Return_5Y} /></TD>
                  <TD right><ReturnPair fund={row.Avg_10Y_Return} bench={row.Avg_Benchmark_Return_10Y} /></TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="active-table-mobile" style={{ padding: "12px" }}>
          {sortedCats.map((row, i) => (
            <div key={`mcat-${row.Category}`} style={{ background: rowBg(i), borderRadius: "12px", padding: "12px 14px", marginBottom: "8px", border: "1px solid #F1F5F9" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A", marginBottom: "8px" }}>{row.Category ?? "—"}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                <StatCell label="AUM (Cr)"><span style={{ fontWeight: 600, color: "#64748B" }}>{fmtAum(row.Total_AUM)}</span></StatCell>
                <StatCell label="1Y Fund/Index"><ReturnPair fund={row.Avg_1Y_Return} bench={row.Avg_Benchmark_Return_1Y} /></StatCell>
                <StatCell label="3Y Fund/Index"><ReturnPair fund={row.Avg_3Y_Return} bench={row.Avg_Benchmark_Return_3Y} /></StatCell>
                <StatCell label="5Y Fund/Index"><ReturnPair fund={row.Avg_5Y_Return} bench={row.Avg_Benchmark_Return_5Y} /></StatCell>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* — Sub-category returns table — */}
      <div style={{ background: "white", border: "1.5px solid #E2E8F0", borderRadius: "20px", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px 14px", borderBottom: "1.5px solid #F1F5F9" }}>
          <div style={{ fontWeight: 800, fontSize: "14px", color: "#0F172A" }}>Sub-category signals</div>
          <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>More granular — useful when you already know the category you want</div>
        </div>

        <div className="active-table-desktop" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><TH>Sub-category</TH><TH>Category</TH><TH right>AUM (Cr)</TH><TH right>1Y Fund/Index</TH><TH right>3Y Fund/Index</TH><TH right>5Y Fund/Index</TH><TH right>10Y Fund/Index</TH></tr></thead>
            <tbody>
              {sortedSubCats.map((row, i) => (
                <tr key={`sub-${row.Category}-${row.Sub_Category}`} style={{ background: rowBg(i) }}>
                  <TD><span style={{ fontWeight: 600, color: "#0F172A", whiteSpace: "nowrap" }}>{row.Sub_Category ?? "—"}</span></TD>
                  <TD muted><span style={{ whiteSpace: "nowrap" }}>{row.Category ?? "—"}</span></TD>
                  <TD right muted>{fmtAum(row.Total_AUM)}</TD>
                  <TD right><ReturnPair fund={row.Avg_1Y_Return} bench={row.Avg_Benchmark_Return_1Y} /></TD>
                  <TD right><ReturnPair fund={row.Avg_3Y_Return} bench={row.Avg_Benchmark_Return_3Y} /></TD>
                  <TD right><ReturnPair fund={row.Avg_5Y_Return} bench={row.Avg_Benchmark_Return_5Y} /></TD>
                  <TD right><ReturnPair fund={row.Avg_10Y_Return} bench={row.Avg_Benchmark_Return_10Y} /></TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="active-table-mobile" style={{ padding: "12px" }}>
          {sortedSubCats.map((row, i) => (
            <div key={`msub-${row.Category}-${row.Sub_Category}`} style={{ background: rowBg(i), borderRadius: "12px", padding: "12px 14px", marginBottom: "8px", border: "1px solid #F1F5F9" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A" }}>{row.Sub_Category ?? "—"}</div>
              <div style={{ fontSize: "10px", color: "#94A3B8", marginBottom: "8px" }}>{row.Category}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                <StatCell label="1Y Fund/Index"><ReturnPair fund={row.Avg_1Y_Return} bench={row.Avg_Benchmark_Return_1Y} /></StatCell>
                <StatCell label="3Y Fund/Index"><ReturnPair fund={row.Avg_3Y_Return} bench={row.Avg_Benchmark_Return_3Y} /></StatCell>
                <StatCell label="5Y Fund/Index"><ReturnPair fund={row.Avg_5Y_Return} bench={row.Avg_Benchmark_Return_5Y} /></StatCell>
                <StatCell label="10Y Fund/Index"><ReturnPair fund={row.Avg_10Y_Return} bench={row.Avg_Benchmark_Return_10Y} /></StatCell>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════
          SECTION 4 — TOP PICKS
          id here so the hero anchor works
      ══════════════════════════════════════ */}
      <div id="top-picks" style={{ marginTop: "56px", scrollMarginTop: "80px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: "100px", padding: "4px 13px", marginBottom: "10px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#7C3AED", letterSpacing: "0.09em", textTransform: "uppercase" }}>Section 4 · Top Fund Picks</span>
        </div>
        <h2 style={{ fontSize: "clamp(18px,3vw,26px)", fontWeight: 800, color: "#0F172A", margin: "0 0 6px" }}>
          Highest-ranked funds — by skill, not just returns
        </h2>
        <p style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.7, maxWidth: "580px", marginBottom: "16px" }}>
          Top 2 funds per major sub-category by composite skill score. Use as a starting shortlist, not a final buy decision.
        </p>
        <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "10px", padding: "10px 14px", fontSize: "11px", color: "#92400E", marginBottom: "24px", display: "inline-block" }}>
          💡 Pick a fund from your target sub-category, then check its expense ratio and 5-year track record before investing.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px,1fr))", gap: "14px", marginBottom: "10px" }}>
          {shortlistGroups.map((group, gi) => (
            <div key={gi} style={{ background: "white", border: "1.5px solid #E2E8F0", borderRadius: "20px", padding: "18px" }}>
              <div style={{ marginBottom: "14px" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "3px" }}>{group.category}</div>
                <div style={{ fontSize: "14px", fontWeight: 800, color: "#0F172A", lineHeight: 1.3 }}>{group.subCategory}</div>
                <div style={{ fontSize: "10px", color: "#CBD5E1", marginTop: "2px" }}>AUM: ₹{fmtCompact(group.aum)} Cr</div>
              </div>
              {group.picks.length === 0
                ? <div style={{ fontSize: "11px", color: "#CBD5E1", fontStyle: "italic" }}>No qualifying funds (AUM &lt; ₹50 Cr)</div>
                : group.picks.map((fund, fi) => (
                  <div key={`${fund.Fund_Name}-${fi}`} style={{ background: fi === 0 ? "#F0FDF4" : "#F8FAFC", border: `1px solid ${fi === 0 ? "#A7F3D0" : "#E2E8F0"}`, borderRadius: "12px", padding: "12px", marginBottom: fi === 0 ? "8px" : 0 }}>
                    {fi === 0 && <div style={{ fontSize: "9px", fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>🥇 Top pick</div>}
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#0F172A", lineHeight: 1.35, marginBottom: "2px" }}>{fund.Fund_Name}</div>
                    <div style={{ fontSize: "10.5px", color: "#64748B", marginBottom: "10px" }}>{fund.AMC}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "5px" }}>
                      {[
                        { label: "AUM (Cr)", value: fmtAum(fund.Current_AUM), color: "#0F172A" },
                        { label: "Score", value: fmt(fund.Composite_Score, 2), color: "#0F172A" },
                        { label: "Alpha 3Y", value: fmtPct(fund.Alpha_3Y), color: (fund.Alpha_3Y ?? 0) >= 0 ? "#059669" : "#DC2626" },
                        { label: "IR 3Y", value: fmt(fund.IR_3Y, 2), color: (fund.IR_3Y ?? 0) >= 0.3 ? "#2563EB" : "#94A3B8" },
                      ].map((s, si) => (
                        <div key={si} style={{ background: "white", borderRadius: "8px", padding: "6px 7px" }}>
                          <div style={{ fontSize: "7.5px", color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "2px" }}>{s.label}</div>
                          <div style={{ fontSize: "11px", fontWeight: 800, color: s.color }}>{s.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              }
            </div>
          ))}
        </div>
        <div style={{ fontSize: "10px", color: "#CBD5E1" }}>
          Data as of {manifest?.reportDate ?? "latest"}. Top 2 per sub-category by composite score, min AUM ₹50 Cr.
        </div>
      </div>

      {/* ══════════════════════════════════════
          SECTION 5 — FULL SCREENER
      ══════════════════════════════════════ */}
      <div id="screener" style={{ marginTop: "56px", scrollMarginTop: "80px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(15,23,42,0.06)", border: "1px solid rgba(15,23,42,0.12)", borderRadius: "100px", padding: "4px 13px", marginBottom: "10px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#334155", letterSpacing: "0.09em", textTransform: "uppercase" }}>Section 5 · Fund Screener</span>
        </div>
        <h2 style={{ fontSize: "clamp(18px,3vw,26px)", fontWeight: 800, color: "#0F172A", margin: "0 0 6px" }}>
          Search &amp; filter every active fund
        </h2>
        <p style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.7, maxWidth: "560px", marginBottom: "24px" }}>
          Filter by category, alpha, IR, and AUM. All results ranked by composite skill score. Click any row for a full fund snapshot.
        </p>

        {/* ── Filter panel ── */}
        <div style={{ background: "white", border: "1.5px solid #E2E8F0", borderRadius: "20px", padding: "clamp(16px,3vw,24px)", marginBottom: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px,1fr))", gap: "12px", marginBottom: "16px" }}>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Search fund or AMC</label>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. Mirae, HDFC Mid Cap…" style={{ ...inputStyle, fontSize: "13px" }} />
            </div>

            <div>
              <label style={labelStyle}>Category</label>
              <select value={category} onChange={(e) => { setCategory(e.target.value); setSubCategory("All"); }} style={inputStyle}>
                <option value="All">All categories</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Sub-category</label>
              <select value={subCategory} onChange={(e) => setSubCategory(e.target.value)} style={inputStyle}>
                <option value="All">All sub-categories</option>
                {subCategories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Benchmark</label>
              <select value={benchmark} onChange={(e) => setBenchmark(e.target.value)} style={inputStyle}>
                <option value="All">All benchmarks</option>
                {benchmarks.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Min alpha 3Y (%)</label>
              <input type="number" value={minAlpha3Y} onChange={(e) => setMinAlpha3Y(e.target.value)} placeholder="e.g. 1" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Min alpha 5Y (%)</label>
              <input type="number" value={minAlpha5Y} onChange={(e) => setMinAlpha5Y(e.target.value)} placeholder="e.g. 1" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Min IR 3Y</label>
              <input type="number" value={minIr3Y} onChange={(e) => setMinIr3Y(e.target.value)} placeholder="e.g. 0.3" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Min IR 5Y</label>
              <input type="number" value={minIr5Y} onChange={(e) => setMinIr5Y(e.target.value)} placeholder="e.g. 0.3" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Min AUM (Cr)</label>
              <input type="number" value={minAum} onChange={(e) => setMinAum(e.target.value)} placeholder="e.g. 500" style={inputStyle} />
            </div>

            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button
                type="button"
                onClick={() => setTopOnly(!topOnly)}
                style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                <div style={{ width: "36px", height: "20px", borderRadius: "100px", background: topOnly ? "#059669" : "#E2E8F0", position: "relative", flexShrink: 0, transition: "background 0.2s" }}>
                  <div style={{ position: "absolute", top: "2px", left: topOnly ? "18px" : "2px", width: "16px", height: "16px", borderRadius: "50%", background: "white", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                </div>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#374151" }}>Top 10% only</span>
              </button>
            </div>
          </div>

          {/* Results row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap", paddingTop: "12px", borderTop: "1px solid #F1F5F9" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "13px", fontWeight: 800, color: "#0F172A" }}>{filtered.length} funds matched</span>
              <span style={{ fontSize: "11px", color: "#94A3B8" }}>Data as of {manifest?.reportDate ?? "latest"}</span>
            </div>
            {hasFilters && (
              <button onClick={resetFilters} style={{ fontSize: "11px", fontWeight: 700, color: "#DC2626", background: "#FFF1F2", border: "1px solid #FCA5A5", borderRadius: "8px", padding: "5px 12px", cursor: "pointer" }}>
                ✕ Clear filters
              </button>
            )}
          </div>
        </div>

        {/* ── Desktop table ── */}
        <div className="active-table-desktop" style={{ background: "white", border: "1.5px solid #E2E8F0", borderRadius: "20px", overflow: "hidden", marginBottom: "16px" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <TH>Fund</TH>
                  <TH>Sub-category</TH>
                  <TH right>AUM (Cr)</TH>
                  <TH right>1Y Fund/Idx</TH>
                  <TH right>3Y Fund/Idx</TH>
                  <TH right>5Y Fund/Idx</TH>
                  <TH right>Alpha 3Y</TH>
                  <TH right>Alpha 5Y</TH>
                  <TH right>IR 3Y</TH>
                  <TH right>IR 5Y</TH>
                  <TH right>Score</TH>
                  <TH right>Rank</TH>
                </tr>
              </thead>
              <tbody>
                {pageSlice.map((fund, i) => (
                  <tr
                    key={`${fund.AMC}-${fund.Fund_Name}-${i}`}
                    style={{ background: rowBg(i), cursor: "pointer", transition: "background 0.1s" }}
                    onClick={() => setSelected(fund)}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "#F0FDF4"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = rowBg(i); }}
                  >
                    <TD>
                      <div style={{ fontWeight: 700, color: "#0F172A", fontSize: "12px", lineHeight: 1.3, minWidth: "180px", maxWidth: "240px" }}>{fund.Fund_Name}</div>
                      <div style={{ fontSize: "10px", color: "#94A3B8", marginTop: "1px" }}>{fund.AMC}</div>
                    </TD>
                    <TD muted><span style={{ whiteSpace: "nowrap" }}>{fund.Sub_Category ?? fund.Category ?? "—"}</span></TD>
                    <TD right muted>{fmtAum(fund.Current_AUM)}</TD>
                    <TD right><ReturnPair fund={fund.Fund_Return_1Y} bench={fund.Benchmark_Return_1Y} /></TD>
                    <TD right><ReturnPair fund={fund.Fund_Return_3Y} bench={fund.Benchmark_Return_3Y} /></TD>
                    <TD right><ReturnPair fund={fund.Fund_Return_5Y} bench={fund.Benchmark_Return_5Y} /></TD>
                    <TD right><AlphaCell v={fund.Alpha_3Y} /></TD>
                    <TD right><AlphaCell v={fund.Alpha_5Y} /></TD>
                    <TD right><span style={{ fontWeight: 600, color: (fund.IR_3Y ?? 0) >= 0.3 ? "#2563EB" : "#94A3B8" }}>{fmt(fund.IR_3Y, 2)}</span></TD>
                    <TD right><span style={{ fontWeight: 600, color: (fund.IR_5Y ?? 0) >= 0.3 ? "#2563EB" : "#94A3B8" }}>{fmt(fund.IR_5Y, 2)}</span></TD>
                    <TD right><span style={{ fontWeight: 800, color: "#0F172A" }}>{fmt(fund.Composite_Score, 2)}</span></TD>
                    <TD right muted>{fund.Rank_in_SubCategory ?? "—"}</TD>
                  </tr>
                ))}
                {pageSlice.length === 0 && (
                  <tr><td colSpan={12} style={{ padding: "32px", textAlign: "center", color: "#94A3B8", fontSize: "13px" }}>No funds match your filters. Try relaxing the criteria.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Mobile cards for screener ── */}
        <div className="active-table-mobile" style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
          {pageSlice.length === 0 && (
            <div style={{ textAlign: "center", padding: "32px 16px", color: "#94A3B8", fontSize: "13px", background: "white", borderRadius: "16px", border: "1.5px solid #E2E8F0" }}>
              No funds match your filters. Try relaxing the criteria.
            </div>
          )}
          {pageSlice.map((fund, i) => (
            <div
              key={`m-${fund.AMC}-${fund.Fund_Name}-${i}`}
              onClick={() => setSelected(fund)}
              style={{ background: "white", border: "1.5px solid #E2E8F0", borderRadius: "16px", padding: "14px", cursor: "pointer" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px", gap: "8px" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A", lineHeight: 1.3 }}>{fund.Fund_Name}</div>
                  <div style={{ fontSize: "10.5px", color: "#94A3B8", marginTop: "2px" }}>{fund.AMC} · {fund.Sub_Category ?? fund.Category}</div>
                </div>
                {fund.Flag_Top_10_Percent === "Yes" && (
                  <div style={{ fontSize: "9px", fontWeight: 700, color: "#059669", background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: "100px", padding: "3px 8px", whiteSpace: "nowrap", flexShrink: 0 }}>Top 10%</div>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "6px" }}>
                <StatCell label="Score"><span style={{ fontWeight: 800, color: "#0F172A" }}>{fmt(fund.Composite_Score, 2)}</span></StatCell>
                <StatCell label="Alpha 3Y"><AlphaCell v={fund.Alpha_3Y} /></StatCell>
                <StatCell label="IR 3Y"><span style={{ fontWeight: 700, color: (fund.IR_3Y ?? 0) >= 0.3 ? "#2563EB" : "#94A3B8" }}>{fmt(fund.IR_3Y, 2)}</span></StatCell>
                <StatCell label="3Y Fund/Idx"><ReturnPair fund={fund.Fund_Return_3Y} bench={fund.Benchmark_Return_3Y} /></StatCell>
                <StatCell label="5Y Fund/Idx"><ReturnPair fund={fund.Fund_Return_5Y} bench={fund.Benchmark_Return_5Y} /></StatCell>
                <StatCell label="AUM (Cr)"><span style={{ fontWeight: 600, color: "#64748B" }}>{fmtAum(fund.Current_AUM)}</span></StatCell>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
            <span style={{ fontSize: "12px", color: "#64748B" }}>Page {page + 1} of {totalPages} · {filtered.length} funds</span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} style={{ padding: "8px 18px", borderRadius: "10px", border: "1.5px solid #E2E8F0", background: "white", fontSize: "12px", fontWeight: 600, color: page === 0 ? "#CBD5E1" : "#374151", cursor: page === 0 ? "not-allowed" : "pointer" }}>← Prev</button>
              <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} style={{ padding: "8px 18px", borderRadius: "10px", border: "1.5px solid #E2E8F0", background: "white", fontSize: "12px", fontWeight: 600, color: page >= totalPages - 1 ? "#CBD5E1" : "#374151", cursor: page >= totalPages - 1 ? "not-allowed" : "pointer" }}>Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════
          FUND DETAIL MODAL
      ══════════════════════════════════════ */}
      {selected && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.5)", padding: "16px" }}
          onClick={() => setSelected(null)}
        >
          <div
            style={{ maxWidth: "540px", width: "100%", background: "white", borderRadius: "24px", padding: "24px", boxShadow: "0 24px 60px rgba(15,23,42,0.3)", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", gap: "12px" }}>
              <div>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Fund snapshot</div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#0F172A", lineHeight: 1.3 }}>{selected.Fund_Name}</div>
                <div style={{ fontSize: "12px", color: "#64748B", marginTop: "3px" }}>{selected.AMC}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ fontSize: "20px", color: "#94A3B8", background: "none", border: "none", cursor: "pointer", padding: "2px 6px", lineHeight: 1, flexShrink: 0 }}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px,1fr))", gap: "10px" }}>
              {[
                { section: "Identity", bg: "#ECFDF5", border: "#A7F3D0", items: [
                  ["Category", selected.Category ?? "—"],
                  ["Sub-category", selected.Sub_Category ?? "—"],
                  ["Benchmark", selected.Benchmark_Name ?? "—"],
                ]},
                { section: "Performance", bg: "#EFF6FF", border: "#BFDBFE", items: [
                  ["1Y Fund/Index", selected.Fund_Return_1Y != null && selected.Benchmark_Return_1Y != null ? `${selected.Fund_Return_1Y.toFixed(1)} / ${selected.Benchmark_Return_1Y.toFixed(1)}` : "—"],
                  ["3Y Fund/Index", selected.Fund_Return_3Y != null && selected.Benchmark_Return_3Y != null ? `${selected.Fund_Return_3Y.toFixed(1)} / ${selected.Benchmark_Return_3Y.toFixed(1)}` : "—"],
                  ["5Y Fund/Index", selected.Fund_Return_5Y != null && selected.Benchmark_Return_5Y != null ? `${selected.Fund_Return_5Y.toFixed(1)} / ${selected.Benchmark_Return_5Y.toFixed(1)}` : "—"],
                  ["Alpha 3Y", fmtPct(selected.Alpha_3Y)],
                  ["IR 3Y", fmt(selected.IR_3Y, 2)],
                ]},
                { section: "Scale & Rank", bg: "#FFFBEB", border: "#FDE68A", items: [
                  ["AUM (Cr)", fmtAum(selected.Current_AUM)],
                  ["Skill score", fmt(selected.Composite_Score, 2)],
                  ["Rank in sub-cat", String(selected.Rank_in_SubCategory ?? "—")],
                  ["Top 10%?", selected.Flag_Top_10_Percent === "Yes" ? "✅ Yes" : "No"],
                ]},
              ].map((sec) => (
                <div key={sec.section} style={{ background: sec.bg, border: `1px solid ${sec.border}`, borderRadius: "14px", padding: "14px" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "10px" }}>{sec.section}</div>
                  {sec.items.map(([label, value]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px", gap: "8px" }}>
                      <span style={{ fontSize: "11px", color: "#64748B", flexShrink: 0 }}>{label}</span>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#0F172A", textAlign: "right" }}>{value}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          RESPONSIVE CSS
      ══════════════════════════════════════ */}
      <style>{`
        .active-table-desktop { display: block; }
        .active-table-mobile  { display: none;  }
        @media (max-width: 767px) {
          .active-table-desktop { display: none  !important; }
          .active-table-mobile  { display: block !important; }
        }
      `}</style>
    </>
  );
}