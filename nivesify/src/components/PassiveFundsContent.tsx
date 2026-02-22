"use client";

import { useEffect, useMemo, useState } from "react";
import type { ETFAnalytics, Manifest } from "@/lib/fund-types";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type BenchmarkStat = {
  Benchmark: string;
  Tracker_Count: number;
  Total_AUM: number;
  Median_TD_3Y: number | null;
  Best_TD_3Y: number | null;
  Best_Fund: string;
  Avg_Fund_Return_1Y: number | null;
  Avg_Fund_Return_3Y: number | null;
  Avg_Benchmark_Return_1Y: number | null;
  Avg_Benchmark_Return_3Y: number | null;
};

export type ShortlistGroup = {
  benchmark: string;
  totalAum: number;
  picks: ETFAnalytics[];
};

export type PassiveFundsContentProps = {
  etfs: ETFAnalytics[];
  benchmarkStats: BenchmarkStat[];
  benchmarkLeaders: ShortlistGroup[];
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

function TdCell({ v }: { v: number | null | undefined }) {
  if (v == null || Number.isNaN(v)) return <span style={{ color: "#CBD5E1" }}>—</span>;
  const abs = Math.abs(v);
  const color = abs <= 0.5 ? "#059669" : abs <= 1.5 ? "#D97706" : "#DC2626";
  return <span style={{ fontWeight: 700, color }}>{fmtPct(v)}</span>;
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

function StatCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#F8FAFC", borderRadius: "8px", padding: "8px 10px", border: "1px solid #F1F5F9" }}>
      <div style={{ fontSize: "8.5px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>{label}</div>
      <div style={{ fontSize: "12px" }}>{children}</div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", borderRadius: "10px", border: "1.5px solid #E2E8F0",
  background: "white", padding: "8px 12px", fontSize: "12px",
  color: "#1F2937", outline: "none", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  fontSize: "10px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase",
  letterSpacing: "0.07em", display: "block", marginBottom: "5px",
};
const rowBg = (i: number) => i % 2 === 0 ? "white" : "#F8FAFC";

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function PassiveFundsContent({
  etfs,
  benchmarkStats,
  benchmarkLeaders,
  manifest,
}: PassiveFundsContentProps) {

  // ── Screener state ──
  const [query, setQuery] = useState("");
  const [benchmark, setBenchmark] = useState("All");
  const [minAum, setMinAum] = useState("");
  const [maxTd, setMaxTd] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<ETFAnalytics | null>(null);
  const PAGE_SIZE = 20;

  const benchmarks = useMemo(() =>
    Array.from(new Set(etfs.map((e) => e.Benchmark_Name).filter(Boolean))).sort() as string[], [etfs]);

  const filtered = useMemo(() => {
    const aumMin = minAum.trim() === "" ? null : Number(minAum);
    const tdMax = maxTd.trim() === "" ? null : Number(maxTd);
    return [...etfs]
      .filter((e) => {
        if (benchmark !== "All" && e.Benchmark_Name !== benchmark) return false;
        if (aumMin !== null && (e.Fund_AUM ?? 0) < aumMin) return false;
        if (tdMax !== null && Math.abs(e.Tracking_Diff_3Y ?? 999) > tdMax) return false;
        if (query.trim()) {
          const q = query.toLowerCase();
          if (!String(e.ETF_Name ?? "").toLowerCase().includes(q) &&
              !String(e.AMC ?? "").toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => (b.ETF_Score ?? 0) - (a.ETF_Score ?? 0));
  }, [etfs, query, benchmark, minAum, maxTd]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSlice = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  useEffect(() => { setPage(0); }, [query, benchmark, minAum, maxTd]);

  const resetFilters = () => { setQuery(""); setBenchmark("All"); setMinAum(""); setMaxTd(""); };
  const hasFilters = !!(query || benchmark !== "All" || minAum || maxTd);

  // Sorted benchmark table
  const sortedBenchmarks = [...benchmarkStats].sort((a, b) => (b.Total_AUM ?? 0) - (a.Total_AUM ?? 0));

  return (
    <>
      {/* ══════════════════════════════════════
          SECTION 3 — BENCHMARK SCOREBOARD
      ══════════════════════════════════════ */}

      {/* Benchmark discipline table */}
      <div style={{ background: "white", border: "1.5px solid #E2E8F0", borderRadius: "20px", overflow: "hidden", marginBottom: "20px" }}>
        <div style={{ padding: "16px 20px 14px", borderBottom: "1.5px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: "14px", color: "#0F172A" }}>Benchmark discipline table</div>
            <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>
              <span style={{ color: "#059669", fontWeight: 700 }}>Green</span> = tight tracking ·{" "}
              <span style={{ color: "#DC2626", fontWeight: 700 }}>Red</span> = high leakage · Sorted by total AUM
            </div>
          </div>
        </div>

        {/* Desktop */}
        <div className="passive-table-desktop" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <TH>Benchmark / Index</TH>
                <TH right>Trackers</TH>
                <TH right>Total AUM (Cr)</TH>
                <TH right>Median TD 3Y</TH>
                <TH right>Best TD 3Y</TH>
                <TH right>Best Fund</TH>
                <TH right>Avg 1Y Return</TH>
                <TH right>Avg 3Y Return</TH>
              </tr>
            </thead>
            <tbody>
              {sortedBenchmarks.map((row, i) => (
                <tr key={`bm-${row.Benchmark}`} style={{ background: rowBg(i) }}>
                  <TD><span style={{ fontWeight: 600, color: "#0F172A", maxWidth: "200px", display: "block" }}>{row.Benchmark}</span></TD>
                  <TD right muted>{row.Tracker_Count}</TD>
                  <TD right muted>{fmtAum(row.Total_AUM)}</TD>
                  <TD right><TdCell v={row.Median_TD_3Y} /></TD>
                  <TD right><TdCell v={row.Best_TD_3Y} /></TD>
                  <TD right><span style={{ fontSize: "11px", color: "#475569", maxWidth: "160px", display: "block", textAlign: "right" }}>{row.Best_Fund}</span></TD>
                  <TD right><span style={{ fontWeight: 600, color: "#0F172A" }}>{fmtPct(row.Avg_Fund_Return_1Y)}</span></TD>
                  <TD right><span style={{ fontWeight: 600, color: "#0F172A" }}>{fmtPct(row.Avg_Fund_Return_3Y)}</span></TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="passive-table-mobile" style={{ padding: "12px" }}>
          {sortedBenchmarks.map((row, i) => (
            <div key={`mbm-${row.Benchmark}`} style={{ background: rowBg(i), borderRadius: "12px", padding: "12px 14px", marginBottom: "8px", border: "1px solid #F1F5F9" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A", marginBottom: "4px", lineHeight: 1.3 }}>{row.Benchmark}</div>
              <div style={{ fontSize: "10px", color: "#94A3B8", marginBottom: "8px" }}>Best fund: {row.Best_Fund}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                <StatCell label="Total AUM (Cr)"><span style={{ fontWeight: 600, color: "#64748B" }}>{fmtAum(row.Total_AUM)}</span></StatCell>
                <StatCell label="Trackers"><span style={{ fontWeight: 600, color: "#64748B" }}>{row.Tracker_Count}</span></StatCell>
                <StatCell label="Median TD 3Y"><TdCell v={row.Median_TD_3Y} /></StatCell>
                <StatCell label="Best TD 3Y"><TdCell v={row.Best_TD_3Y} /></StatCell>
                <StatCell label="Avg 1Y Return"><span style={{ fontWeight: 600, color: "#0F172A" }}>{fmtPct(row.Avg_Fund_Return_1Y)}</span></StatCell>
                <StatCell label="Avg 3Y Return"><span style={{ fontWeight: 600, color: "#0F172A" }}>{fmtPct(row.Avg_Fund_Return_3Y)}</span></StatCell>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════
          SECTION 4 — TOP PICKS
      ══════════════════════════════════════ */}
      <div id="top-picks" style={{ marginTop: "56px", scrollMarginTop: "80px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(8,145,178,0.08)", border: "1px solid rgba(8,145,178,0.2)", borderRadius: "100px", padding: "4px 13px", marginBottom: "10px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#0891B2", letterSpacing: "0.09em", textTransform: "uppercase" }}>Section 4 · Top Picks</span>
        </div>
        <h2 style={{ fontSize: "clamp(18px,3vw,26px)", fontWeight: 800, color: "#0F172A", margin: "0 0 6px" }}>
          Lowest tracking difference per benchmark
        </h2>
        <p style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.7, maxWidth: "580px", marginBottom: "16px" }}>
          Top 2 trackers per major benchmark by lowest absolute tracking difference. Use as a starting shortlist — confirm expense ratio before investing.
        </p>
        <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: "10px", padding: "10px 14px", fontSize: "11px", color: "#1D4ED8", marginBottom: "24px", display: "inline-block" }}>
          💡 Lower tracking difference = the fund copies the index more precisely = less money lost to fees and inefficiency.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px,1fr))", gap: "14px", marginBottom: "10px" }}>
          {benchmarkLeaders.map((group, gi) => (
            <div key={gi} style={{ background: "white", border: "1.5px solid #E2E8F0", borderRadius: "20px", padding: "18px" }}>
              <div style={{ marginBottom: "14px" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "3px" }}>Benchmark</div>
                <div style={{ fontSize: "14px", fontWeight: 800, color: "#0F172A", lineHeight: 1.3 }}>{group.benchmark}</div>
                <div style={{ fontSize: "10px", color: "#CBD5E1", marginTop: "2px" }}>Total AUM: ₹{fmtCompact(group.totalAum)} Cr</div>
              </div>
              {group.picks.length === 0
                ? <div style={{ fontSize: "11px", color: "#CBD5E1", fontStyle: "italic" }}>No qualifying funds</div>
                : group.picks.map((etf, fi) => (
                  <div key={`${etf.ETF_Name}-${fi}`} style={{ background: fi === 0 ? "#EFF6FF" : "#F8FAFC", border: `1px solid ${fi === 0 ? "#BFDBFE" : "#E2E8F0"}`, borderRadius: "12px", padding: "12px", marginBottom: fi === 0 ? "8px" : 0 }}>
                    {fi === 0 && <div style={{ fontSize: "9px", fontWeight: 700, color: "#0891B2", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>🏆 Tightest tracker</div>}
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#0F172A", lineHeight: 1.35, marginBottom: "2px" }}>{etf.ETF_Name}</div>
                    <div style={{ fontSize: "10.5px", color: "#64748B", marginBottom: "10px" }}>{etf.AMC}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "5px" }}>
                      {[
                        { label: "AUM (Cr)", value: fmtAum(etf.Fund_AUM), color: "#0F172A" },
                        { label: "Score", value: fmt(etf.ETF_Score, 2), color: "#0F172A" },
                        { label: "TD 3Y", value: fmtPct(etf.Tracking_Diff_3Y), color: Math.abs(etf.Tracking_Diff_3Y ?? 999) <= 0.5 ? "#059669" : Math.abs(etf.Tracking_Diff_3Y ?? 999) <= 1.5 ? "#D97706" : "#DC2626" },
                        { label: "TD 1Y", value: fmtPct(etf.Tracking_Diff_1Y), color: Math.abs(etf.Tracking_Diff_1Y ?? 999) <= 0.5 ? "#059669" : Math.abs(etf.Tracking_Diff_1Y ?? 999) <= 1.5 ? "#D97706" : "#DC2626" },
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
          Data as of {manifest?.reportDate ?? "latest"}. Top 2 per benchmark by lowest absolute TD 3Y.
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
          Search &amp; filter every passive fund
        </h2>
        <p style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.7, maxWidth: "560px", marginBottom: "24px" }}>
          Filter by benchmark, AUM, and tracking difference. Ranked by composite ETF score. Click any row for a full snapshot.
        </p>

        {/* Filter panel */}
        <div style={{ background: "white", border: "1.5px solid #E2E8F0", borderRadius: "20px", padding: "clamp(16px,3vw,24px)", marginBottom: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px,1fr))", gap: "12px", marginBottom: "16px" }}>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Search fund or AMC</label>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. Mirae, HDFC Nifty 50…" style={{ ...inputStyle, fontSize: "13px" }} />
            </div>

            <div>
              <label style={labelStyle}>Benchmark / Index</label>
              <select value={benchmark} onChange={(e) => setBenchmark(e.target.value)} style={inputStyle}>
                <option value="All">All benchmarks</option>
                {benchmarks.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Min AUM (Cr)</label>
              <input type="number" value={minAum} onChange={(e) => setMinAum(e.target.value)} placeholder="e.g. 500" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Max tracking diff 3Y (%)</label>
              <input type="number" value={maxTd} onChange={(e) => setMaxTd(e.target.value)} placeholder="e.g. 1" style={inputStyle} />
            </div>
          </div>

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

        {/* Desktop table */}
        <div className="passive-table-desktop" style={{ background: "white", border: "1.5px solid #E2E8F0", borderRadius: "20px", overflow: "hidden", marginBottom: "16px" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <TH>Fund</TH>
                  <TH>Benchmark</TH>
                  <TH right>AUM (Cr)</TH>
                  <TH right>1Y Fund/Idx</TH>
                  <TH right>3Y Fund/Idx</TH>
                  <TH right>TD 1Y</TH>
                  <TH right>TD 3Y</TH>
                  <TH right>Score</TH>
                  <TH right>Rank</TH>
                </tr>
              </thead>
              <tbody>
                {pageSlice.map((etf, i) => (
                  <tr
                    key={`${etf.AMC}-${etf.ETF_Name}-${i}`}
                    style={{ background: rowBg(i), cursor: "pointer" }}
                    onClick={() => setSelected(etf)}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "#EFF6FF"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = rowBg(i); }}
                  >
                    <TD>
                      <div style={{ fontWeight: 700, color: "#0F172A", fontSize: "12px", lineHeight: 1.3, minWidth: "180px", maxWidth: "240px" }}>{etf.ETF_Name}</div>
                      <div style={{ fontSize: "10px", color: "#94A3B8", marginTop: "1px" }}>{etf.AMC}</div>
                    </TD>
                    <TD muted><span style={{ whiteSpace: "nowrap", fontSize: "11px" }}>{etf.Benchmark_Name ?? "—"}</span></TD>
                    <TD right muted>{fmtAum(etf.Fund_AUM)}</TD>
                    <TD right><ReturnPair fund={etf.Fund_Return_1Y} bench={etf.Benchmark_Return_1Y} /></TD>
                    <TD right><ReturnPair fund={etf.Fund_Return_3Y} bench={etf.Benchmark_Return_3Y} /></TD>
                    <TD right><TdCell v={etf.Tracking_Diff_1Y} /></TD>
                    <TD right><TdCell v={etf.Tracking_Diff_3Y} /></TD>
                    <TD right><span style={{ fontWeight: 800, color: "#0F172A" }}>{fmt(etf.ETF_Score, 2)}</span></TD>
                    <TD right muted>{etf.Rank_within_Benchmark ?? "—"}</TD>
                  </tr>
                ))}
                {pageSlice.length === 0 && (
                  <tr><td colSpan={9} style={{ padding: "32px", textAlign: "center", color: "#94A3B8", fontSize: "13px" }}>No funds match your filters. Try relaxing the criteria.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="passive-table-mobile" style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
          {pageSlice.length === 0 && (
            <div style={{ textAlign: "center", padding: "32px 16px", color: "#94A3B8", fontSize: "13px", background: "white", borderRadius: "16px", border: "1.5px solid #E2E8F0" }}>No funds match your filters.</div>
          )}
          {pageSlice.map((etf, i) => (
            <div
              key={`m-${etf.AMC}-${etf.ETF_Name}-${i}`}
              onClick={() => setSelected(etf)}
              style={{ background: "white", border: "1.5px solid #E2E8F0", borderRadius: "16px", padding: "14px", cursor: "pointer" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px", gap: "8px" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A", lineHeight: 1.3 }}>{etf.ETF_Name}</div>
                  <div style={{ fontSize: "10.5px", color: "#94A3B8", marginTop: "2px" }}>{etf.AMC} · {etf.Benchmark_Name}</div>
                </div>
                <div style={{ fontSize: "9px", fontWeight: 700, color: "#0891B2", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: "100px", padding: "3px 8px", whiteSpace: "nowrap", flexShrink: 0 }}>
                  #{etf.Rank_within_Benchmark ?? "—"}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "6px" }}>
                <StatCell label="Score"><span style={{ fontWeight: 800, color: "#0F172A" }}>{fmt(etf.ETF_Score, 2)}</span></StatCell>
                <StatCell label="TD 3Y"><TdCell v={etf.Tracking_Diff_3Y} /></StatCell>
                <StatCell label="TD 1Y"><TdCell v={etf.Tracking_Diff_1Y} /></StatCell>
                <StatCell label="3Y Fund/Idx"><ReturnPair fund={etf.Fund_Return_3Y} bench={etf.Benchmark_Return_3Y} /></StatCell>
                <StatCell label="1Y Fund/Idx"><ReturnPair fund={etf.Fund_Return_1Y} bench={etf.Benchmark_Return_1Y} /></StatCell>
                <StatCell label="AUM (Cr)"><span style={{ fontWeight: 600, color: "#64748B" }}>{fmtAum(etf.Fund_AUM)}</span></StatCell>
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
            style={{ maxWidth: "500px", width: "100%", background: "white", borderRadius: "24px", padding: "24px", boxShadow: "0 24px 60px rgba(15,23,42,0.3)", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", gap: "12px" }}>
              <div>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Tracker snapshot</div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#0F172A", lineHeight: 1.3 }}>{selected.ETF_Name}</div>
                <div style={{ fontSize: "12px", color: "#64748B", marginTop: "3px" }}>{selected.AMC}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ fontSize: "20px", color: "#94A3B8", background: "none", border: "none", cursor: "pointer", padding: "2px 6px", lineHeight: 1, flexShrink: 0 }}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px,1fr))", gap: "10px" }}>
              {[
                { section: "Identity", bg: "#EFF6FF", border: "#BFDBFE", items: [
                  ["Benchmark", selected.Benchmark_Name ?? "—"],
                  ["Rank in benchmark", String(selected.Rank_within_Benchmark ?? "—")],
                ]},
                { section: "Tracking", bg: "#F0FDF4", border: "#A7F3D0", items: [
                  ["TD 1Y", fmtPct(selected.Tracking_Diff_1Y)],
                  ["TD 3Y", fmtPct(selected.Tracking_Diff_3Y)],
                  ["ETF Score", fmt(selected.ETF_Score, 2)],
                ]},
                { section: "Scale & Returns", bg: "#FFFBEB", border: "#FDE68A", items: [
                  ["AUM (Cr)", fmtAum(selected.Fund_AUM)],
                  ["1Y Fund/Index", selected.Fund_Return_1Y != null && selected.Benchmark_Return_1Y != null ? `${selected.Fund_Return_1Y.toFixed(1)} / ${selected.Benchmark_Return_1Y.toFixed(1)}` : "—"],
                  ["3Y Fund/Index", selected.Fund_Return_3Y != null && selected.Benchmark_Return_3Y != null ? `${selected.Fund_Return_3Y.toFixed(1)} / ${selected.Benchmark_Return_3Y.toFixed(1)}` : "—"],
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

      {/* Responsive CSS */}
      <style>{`
        .passive-table-desktop { display: block; }
        .passive-table-mobile  { display: none;  }
        @media (max-width: 767px) {
          .passive-table-desktop { display: none  !important; }
          .passive-table-mobile  { display: block !important; }
        }
      `}</style>
    </>
  );
}