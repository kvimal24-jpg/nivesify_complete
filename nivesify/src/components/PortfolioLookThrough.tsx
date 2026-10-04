"use client";

import Link from "next/link";
import { Building2, GitCompareArrows, LoaderCircle, ScanSearch } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Portfolio } from "@/lib/mutual-fund-health-check/portfolio";
import { calculateOverlap, normalizeSecurityName, type FundPortfolio, type SchemeMatch } from "@/lib/holdings/rupeevest";

type LookThroughItem = {
  fundName: string;
  currentValue: number;
  match: SchemeMatch;
  portfolio: FundPortfolio | null;
};

const fmtPct = (value: number) => `${value.toFixed(1)}%`;

export default function PortfolioLookThrough({ portfolio }: { portfolio: Portfolio }) {
  const [items, setItems] = useState<LookThroughItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"companies" | "overlap" | "matches">("companies");

  const activeFunds = useMemo(() => portfolio.filter((row) => row.currentValue > 0).slice(0, 15), [portfolio]);

  useEffect(() => {
    if (!activeFunds.length) {
      setItems([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all(activeFunds.map(async (fund): Promise<LookThroughItem> => {
      try {
        const matchResponse = await fetch(`/api/holdings/match?name=${encodeURIComponent(fund.mfName)}`);
        if (!matchResponse.ok) throw new Error("Fund matching failed");
        const match = await matchResponse.json() as SchemeMatch;
        if (!match.scheme || match.confidence === "none") {
          return { fundName: fund.mfName, currentValue: fund.currentValue, match, portfolio: null };
        }
        const portfolioResponse = await fetch(`/api/holdings/portfolio?schemecode=${match.scheme.schemeCode}`);
        const providerPortfolio = portfolioResponse.ok ? await portfolioResponse.json() as FundPortfolio : null;
        return { fundName: fund.mfName, currentValue: fund.currentValue, match, portfolio: providerPortfolio };
      } catch {
        return {
          fundName: fund.mfName,
          currentValue: fund.currentValue,
          match: { scheme: null, confidence: "none", score: 0 },
          portfolio: null,
        };
      }
    }))
      .then((nextItems) => { if (!cancelled) setItems(nextItems); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [activeFunds]);

  const totalValue = activeFunds.reduce((sum, fund) => sum + fund.currentValue, 0);
  const matchedValue = items.filter((item) => item.portfolio).reduce((sum, item) => sum + item.currentValue, 0);
  const coverage = totalValue > 0 ? matchedValue / totalValue * 100 : 0;

  const companyExposures = useMemo(() => {
    const exposures = new Map<string, { name: string; exposure: number }>();
    if (totalValue <= 0) return [];
    items.forEach((item) => {
      const fundWeight = item.currentValue / totalValue;
      item.portfolio?.months[0]?.holdings.forEach((holding) => {
        if (holding.percentAum <= 0) return;
        const key = normalizeSecurityName(holding.securityName);
        if (!key) return;
        const existing = exposures.get(key);
        exposures.set(key, {
          name: !existing || holding.securityName.length > existing.name.length ? holding.securityName : existing.name,
          exposure: (existing?.exposure ?? 0) + fundWeight * holding.percentAum,
        });
      });
    });
    return [...exposures.values()].sort((a, b) => b.exposure - a.exposure);
  }, [items, totalValue]);

  const overlaps = useMemo(() => {
    const matched = items.filter((item): item is LookThroughItem & { portfolio: FundPortfolio } => Boolean(item.portfolio));
    const pairs: Array<{ left: string; right: string; overlap: number; commonCount: number }> = [];
    for (let leftIndex = 0; leftIndex < matched.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < matched.length; rightIndex += 1) {
        const left = matched[leftIndex];
        const right = matched[rightIndex];
        pairs.push({
          left: left.fundName,
          right: right.fundName,
          ...calculateOverlap(left.portfolio.months[0]?.holdings ?? [], right.portfolio.months[0]?.holdings ?? []),
        });
      }
    }
    return pairs.sort((a, b) => b.overlap - a.overlap);
  }, [items]);

  if (!activeFunds.length) return null;

  return (
    <section className="surface surface--padded section-stack" aria-labelledby="look-through-heading">
      <div className="section-heading">
        <div className="section-heading__copy">
          <p className="eyebrow">Portfolio look-through</p>
          <h2 className="section-title" id="look-through-heading">The companies you actually own</h2>
          <p>Your mutual funds are unpacked into their latest disclosed securities, so hidden concentration is visible.</p>
        </div>
        <Link className="button button--secondary button--small" href="/mutual-fund-holdings">Open fund explorer</Link>
      </div>

      {loading ? (
        <div className="empty-state" role="status"><div><span className="empty-state__icon"><LoaderCircle size={22} /></span><h3>Matching your funds</h3><p>Linking portfolio names to disclosure scheme codes and loading latest holdings.</p></div></div>
      ) : (
        <>
          <div className="metric-grid">
            <div className="metric-card"><span className="metric-card__label">Disclosure coverage</span><strong className="metric-card__value">{fmtPct(coverage)}</strong><span className="metric-card__hint">By current portfolio value</span></div>
            <div className="metric-card"><span className="metric-card__label">Companies & securities</span><strong className="metric-card__value">{companyExposures.length}</strong><span className="metric-card__hint">Across matched funds</span></div>
            <div className="metric-card"><span className="metric-card__label">Highest single exposure</span><strong className="metric-card__value">{companyExposures[0] ? fmtPct(companyExposures[0].exposure) : "—"}</strong><span className="metric-card__hint">{companyExposures[0]?.name ?? "No match"}</span></div>
          </div>

          <div className="segmented-nav" role="tablist" aria-label="Portfolio look-through views">
            <button type="button" role="tab" aria-selected={view === "companies"} className={view === "companies" ? "is-active" : undefined} onClick={() => setView("companies")}><Building2 size={14} />Company exposure</button>
            <button type="button" role="tab" aria-selected={view === "overlap"} className={view === "overlap" ? "is-active" : undefined} onClick={() => setView("overlap")}><GitCompareArrows size={14} />Fund overlap</button>
            <button type="button" role="tab" aria-selected={view === "matches"} className={view === "matches" ? "is-active" : undefined} onClick={() => setView("matches")}><ScanSearch size={14} />Match confidence</button>
          </div>

          {view === "companies" && (
            <div className="table-shell"><div className="table-scroll"><table><thead><tr><th>Company / security</th><th>Effective portfolio exposure</th></tr></thead><tbody>{companyExposures.slice(0, 30).map((company) => <tr key={company.name}><td><strong style={{ color: "var(--ink)" }}>{company.name}</strong></td><td>{fmtPct(company.exposure)}</td></tr>)}</tbody></table></div><div className="table-footer"><span>Top 30 shown</span><span>Fund weight × disclosed security weight</span></div></div>
          )}

          {view === "overlap" && (
            <div className="table-shell"><div className="table-scroll"><table><thead><tr><th>Fund pair</th><th>Weighted overlap</th><th>Common securities</th></tr></thead><tbody>{overlaps.map((pair) => <tr key={`${pair.left}-${pair.right}`}><td><strong style={{ color: "var(--ink)" }}>{pair.left}</strong><br /><span style={{ color: "var(--muted)" }}>vs {pair.right}</span></td><td>{fmtPct(pair.overlap)}</td><td>{pair.commonCount}</td></tr>)}</tbody></table></div>{overlaps.length === 0 && <div className="empty-state"><div><h3>Add at least two matched funds</h3><p>Overlap appears when two holdings disclosures are available.</p></div></div>}</div>
          )}

          {view === "matches" && (
            <div className="table-shell"><div className="table-scroll"><table><thead><tr><th>Your fund</th><th>Matched disclosure</th><th>Confidence</th></tr></thead><tbody>{items.map((item) => <tr key={item.fundName}><td><strong style={{ color: "var(--ink)" }}>{item.fundName}</strong></td><td>{item.match.scheme?.displayName ?? "No reliable match"}</td><td><span className={`pill ${item.match.confidence === "high" ? "pill--positive" : item.match.confidence === "none" ? "pill--danger" : "pill--warning"}`}>{item.match.confidence} · {Math.round(item.match.score * 100)}%</span></td></tr>)}</tbody></table></div></div>
          )}
        </>
      )}
    </section>
  );
}
