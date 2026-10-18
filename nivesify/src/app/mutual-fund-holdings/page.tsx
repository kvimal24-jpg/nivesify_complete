"use client";

import Link from "next/link";
import { BarChart3, GitCompareArrows, LoaderCircle, Search, ShieldCheck, Star, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AnalysisTabs from "@/components/AnalysisTabs";
import { EmptyState, MetricCard, PageHero, PageShell, PageStack } from "@/components/ui";
import {
  calculateOverlap,
  portfolioAllocation,
  type FundPortfolio,
  type RupeeVestScheme,
} from "@/lib/holdings/rupeevest";
import styles from "./page.module.css";
import { trackUxEvent } from "@/lib/analytics";

type View = "overview" | "holdings" | "overlap";

const fmt = (value: number | null | undefined, digits = 1) =>
  value == null || Number.isNaN(value) ? "—" : new Intl.NumberFormat("en-IN", { maximumFractionDigits: digits }).format(value);

const fmtPct = (value: number | null | undefined) => value == null ? "—" : `${value.toFixed(2)}%`;

export default function MutualFundHoldingsPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RupeeVestScheme[]>([]);
  const [selected, setSelected] = useState<RupeeVestScheme[]>([]);
  const [portfolios, setPortfolios] = useState<Record<number, FundPortfolio>>({});
  const [searching, setSearching] = useState(false);
  const [loadingCodes, setLoadingCodes] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>("overview");
  const [monthIndex, setMonthIndex] = useState(0);
  const [watchlist, setWatchlist] = useState<RupeeVestScheme[]>([]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("nivesify-fund-watchlist");
      if (saved) setWatchlist(JSON.parse(saved) as RupeeVestScheme[]);
    } catch {
      setWatchlist([]);
    }
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(`/api/holdings/search?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal });
        const body = await response.json() as { schemes?: RupeeVestScheme[] };
        setResults((body.schemes ?? []).filter((scheme) => !selected.some((item) => item.schemeCode === scheme.schemeCode)));
      } catch (searchError) {
        if ((searchError as Error).name !== "AbortError") setResults([]);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 250);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, selected]);

  const addScheme = (scheme: RupeeVestScheme) => {
    if (selected.length >= 3 || selected.some((item) => item.schemeCode === scheme.schemeCode)) return;
    setSelected((current) => [...current, scheme]);
    setQuery("");
    setResults([]);
    setError(null);
    trackUxEvent("holdings_search_select", { schemeCode: scheme.schemeCode, comparedFunds: selected.length + 1 });
  };

  const removeScheme = (schemeCode: number) => {
    setSelected((current) => current.filter((scheme) => scheme.schemeCode !== schemeCode));
    setPortfolios((current) => {
      const next = { ...current };
      delete next[schemeCode];
      return next;
    });
  };

  const toggleWatchlist = (scheme: RupeeVestScheme) => {
    setWatchlist((current) => {
      const exists = current.some((item) => item.schemeCode === scheme.schemeCode);
      const next = exists ? current.filter((item) => item.schemeCode !== scheme.schemeCode) : [...current, scheme];
      window.localStorage.setItem("nivesify-fund-watchlist", JSON.stringify(next));
      trackUxEvent("holdings_watchlist_change", { schemeCode: scheme.schemeCode, saved: !exists });
      return next;
    });
  };

  useEffect(() => {
    const missing = selected.filter((scheme) => !portfolios[scheme.schemeCode] && !loadingCodes.includes(scheme.schemeCode));
    if (!missing.length) return;
    const codes = missing.map((scheme) => scheme.schemeCode);
    setLoadingCodes((current) => [...current, ...codes]);
    Promise.all(missing.map(async (scheme) => {
      const response = await fetch(`/api/holdings/portfolio?schemecode=${scheme.schemeCode}`);
      const body = await response.json() as FundPortfolio & { error?: string };
      if (!response.ok) throw new Error(body.error ?? `Could not load ${scheme.displayName}`);
      return body;
    }))
      .then((loaded) => {
        setPortfolios((current) => ({ ...current, ...Object.fromEntries(loaded.map((portfolio) => [portfolio.schemeCode, portfolio])) }));
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Could not load holdings."))
      .finally(() => setLoadingCodes((current) => current.filter((code) => !codes.includes(code))));
  }, [selected, portfolios, loadingCodes]);

  const loadedPortfolios = selected.map((scheme) => portfolios[scheme.schemeCode]).filter(Boolean);
  const activeMonths = loadedPortfolios.map((portfolio) => portfolio.months[Math.min(monthIndex, portfolio.months.length - 1)]);

  const holdingRows = useMemo(() => {
    const rows = new Map<string, { name: string; type: string; weights: Record<number, number> }>();
    loadedPortfolios.forEach((portfolio) => {
      const month = portfolio.months[Math.min(monthIndex, portfolio.months.length - 1)];
      month?.holdings.forEach((holding) => {
        const key = holding.securityName.toLowerCase();
        const row = rows.get(key) ?? { name: holding.securityName, type: holding.assetType, weights: {} };
        row.weights[portfolio.schemeCode] = holding.percentAum;
        rows.set(key, row);
      });
    });
    return [...rows.values()].sort((a, b) => Math.max(...Object.values(b.weights)) - Math.max(...Object.values(a.weights)));
  }, [loadedPortfolios, monthIndex]);

  const overlaps = useMemo(() => {
    const pairs: Array<{ left: FundPortfolio; right: FundPortfolio; overlap: number; commonCount: number }> = [];
    for (let leftIndex = 0; leftIndex < loadedPortfolios.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < loadedPortfolios.length; rightIndex += 1) {
        const left = loadedPortfolios[leftIndex];
        const right = loadedPortfolios[rightIndex];
        const leftMonth = left.months[Math.min(monthIndex, left.months.length - 1)];
        const rightMonth = right.months[Math.min(monthIndex, right.months.length - 1)];
        pairs.push({ left, right, ...calculateOverlap(leftMonth?.holdings ?? [], rightMonth?.holdings ?? []) });
      }
    }
    return pairs;
  }, [loadedPortfolios, monthIndex]);

  const maxMonths = Math.max(0, ...loadedPortfolios.map((portfolio) => portfolio.months.length));

  return (
    <PageShell wide>
      <PageStack>
        <PageHero
          eyebrow="Fund portfolio intelligence"
          title={<>See what your mutual fund <em style={{ color: "var(--accent)", fontStyle: "normal" }}>actually owns.</em></>}
          description="Search any mutual fund, inspect every disclosed company holding, and compare up to three portfolios for overlap and concentration."
          actions={<><a className="button button--primary" href="#fund-search"><Search size={16} />Find a fund</a><Link className="button button--secondary" href="/mutual-fund-health-check">Check my portfolio</Link></>}
          aside={<div className="metric-grid"><MetricCard label="Compare" value="3 funds" hint="Side by side" /><MetricCard label="History" value="4 months" hint="Latest disclosures" /></div>}
        />

        <AnalysisTabs />

        <section className="surface surface--padded section-stack" id="fund-search">
          <div>
            <p className="eyebrow">Build a comparison</p>
            <h2 className="section-title">Add one to three funds</h2>
            <p className="supporting-text">Search by scheme or fund-house name. Regular and direct-plan variants are linked through the provider&apos;s scheme code.</p>
          </div>
          <div className={styles.searchWrap}>
            <div className={styles.searchBox}>
              <Search className={styles.searchIcon} size={19} aria-hidden="true" />
              <input
                className={styles.searchInput}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={selected.length >= 3 ? "Remove a fund to add another" : "Search e.g. Parag Parikh Flexi Cap"}
                aria-label="Search mutual funds"
                disabled={selected.length >= 3}
                autoComplete="off"
              />
              {searching && <LoaderCircle className={styles.searchSpinner} size={20} aria-hidden="true" />}
            </div>
            {results.length > 0 && (
              <div className={styles.results} role="listbox" aria-label="Matching schemes">
                {results.map((scheme) => (
                  <button className={styles.result} key={scheme.schemeCode} type="button" onClick={() => addScheme(scheme)} role="option" aria-selected="false">
                    <span><strong>{scheme.displayName}</strong><small>{scheme.fundHouse}</small></span>
                    <code>#{scheme.schemeCode}</code>
                  </button>
                ))}
              </div>
            )}
          </div>

          {watchlist.length > 0 && (
            <div className={styles.watchlist} aria-label="Saved funds">
              <span>Watchlist</span>
              {watchlist.map((scheme) => (
                <button type="button" key={scheme.schemeCode} onClick={() => addScheme(scheme)} disabled={selected.length >= 3 || selected.some((item) => item.schemeCode === scheme.schemeCode)}>{scheme.displayName}</button>
              ))}
            </div>
          )}

          {selected.length > 0 && (
            <div className={styles.selectionGrid}>
              {selected.map((scheme) => (
                <div className={styles.selection} key={scheme.schemeCode}>
                  <span><strong>{scheme.displayName}</strong><small>{loadingCodes.includes(scheme.schemeCode) ? "Loading disclosed portfolio…" : scheme.fundHouse}</small></span>
                  <span className={styles.selectionActions}>
                    <button className={styles.watchButton} data-saved={watchlist.some((item) => item.schemeCode === scheme.schemeCode)} type="button" onClick={() => toggleWatchlist(scheme)} aria-label={`${watchlist.some((item) => item.schemeCode === scheme.schemeCode) ? "Remove" : "Add"} ${scheme.displayName} ${watchlist.some((item) => item.schemeCode === scheme.schemeCode) ? "from" : "to"} watchlist`}><Star size={15} fill={watchlist.some((item) => item.schemeCode === scheme.schemeCode) ? "currentColor" : "none"} /></button>
                    <button className={styles.remove} type="button" onClick={() => removeScheme(scheme.schemeCode)} aria-label={`Remove ${scheme.displayName}`}><X size={16} /></button>
                  </span>
                </div>
              ))}
            </div>
          )}
          {error && <div className="pill pill--danger" role="alert">{error}</div>}
        </section>

        {loadedPortfolios.length === 0 ? (
          <div className="surface"><EmptyState title="Start with a fund" description="Search above to reveal its latest companies, asset mix, concentration and disclosed AUM." /></div>
        ) : (
          <section className="section-stack">
            <div className="section-heading">
              <div className="section-heading__copy"><p className="eyebrow">Portfolio workspace</p><h2 className="section-title">Inside the funds</h2><p>Compare the same disclosure month wherever it is available.</p></div>
              {maxMonths > 1 && (
                <select className="field" value={monthIndex} onChange={(event) => setMonthIndex(Number(event.target.value))} aria-label="Portfolio month">
                  {Array.from({ length: maxMonths }, (_, index) => <option value={index} key={index}>{loadedPortfolios[0]?.months[index]?.label ?? `Month ${index + 1}`}</option>)}
                </select>
              )}
            </div>

            <div className="segmented-nav" role="tablist" aria-label="Holdings views">
              {[
                { key: "overview", label: "Top holdings", icon: BarChart3 },
                { key: "holdings", label: `All companies (${holdingRows.length})`, icon: ShieldCheck },
                { key: "overlap", label: "Overlap", icon: GitCompareArrows },
              ].map((item) => (
                <button key={item.key} type="button" role="tab" aria-selected={view === item.key} className={view === item.key ? "is-active" : undefined} onClick={() => { setView(item.key as View); trackUxEvent("holdings_view_change", { view: item.key, comparedFunds: loadedPortfolios.length }); }} disabled={item.key === "overlap" && loadedPortfolios.length < 2}>
                  <item.icon size={14} />{item.label}
                </button>
              ))}
            </div>

            {view === "overview" && (
              <div className={styles.fundGrid}>
                {loadedPortfolios.map((portfolio, portfolioIndex) => {
                  const month = activeMonths[portfolioIndex];
                  const allocation = portfolioAllocation(month?.holdings ?? []);
                  return (
                    <article className={styles.fundCard} key={portfolio.schemeCode}>
                      <h3>{portfolio.fundName}</h3>
                      <p>{portfolio.classification ?? "Mutual fund"} · {month?.label ?? "Latest"} · ₹{fmt(month?.aum ?? portfolio.aum)} Cr</p>
                      <div className={styles.allocation}>
                        {(["equity", "debt", "cash", "other"] as const).map((type) => <div key={type}><strong>{fmtPct(allocation[type])}</strong><span>{type}</span></div>)}
                      </div>
                      <div className={styles.holdingList}>
                        {(month?.holdings ?? []).slice(0, 10).map((holding) => (
                          <div key={`${holding.assetType}-${holding.securityCode}`}>
                            <div className={styles.holdingHeader}><span>{holding.securityName}</span><strong>{fmtPct(holding.percentAum)}</strong></div>
                            <div className={styles.bar}><span style={{ width: `${Math.min(100, holding.percentAum * 10)}%` }} /></div>
                          </div>
                        ))}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {view === "holdings" && (
              <div className="table-shell">
                <div className="table-scroll">
                  <table>
                    <thead><tr><th>Company / security</th><th>Type</th>{loadedPortfolios.map((portfolio) => <th key={portfolio.schemeCode}>{portfolio.fundName}</th>)}</tr></thead>
                    <tbody>{holdingRows.map((row) => <tr key={row.name}><td><strong style={{ color: "var(--ink)" }}>{row.name}</strong></td><td><span className="pill">{row.type}</span></td>{loadedPortfolios.map((portfolio) => <td key={portfolio.schemeCode}>{row.weights[portfolio.schemeCode] == null ? "—" : fmtPct(row.weights[portfolio.schemeCode])}</td>)}</tr>)}</tbody>
                  </table>
                </div>
                <div className="table-footer"><span>{holdingRows.length} disclosed securities</span><span>Weights are percentages of each fund&apos;s AUM</span></div>
              </div>
            )}

            {view === "overlap" && (
              overlaps.length ? <div className={styles.overlapGrid}>{overlaps.map((pair) => (
                <article className={styles.overlapCard} key={`${pair.left.schemeCode}-${pair.right.schemeCode}`}>
                  <h3>{pair.left.fundName}<br /><span style={{ color: "var(--muted)", fontWeight: 500 }}>vs {pair.right.fundName}</span></h3>
                  <div className={styles.overlapValue}>{fmtPct(pair.overlap)}</div>
                  <p>{pair.commonCount} shared securities. Weighted overlap sums the smaller portfolio weight for every common holding.</p>
                </article>
              ))}</div> : <div className="surface"><EmptyState title="Add another fund" description="Overlap analysis becomes available when at least two portfolios are loaded." /></div>
            )}
          </section>
        )}

        <div className={styles.source}>
          Holdings are sourced from <a href="https://www.rupeevest.com/Mutual-Fund-Portfolio-Tracker" target="_blank" rel="noreferrer">RupeeVest&apos;s portfolio tracker</a> and may lag the latest AMC disclosure. Scheme codes are preserved end-to-end to avoid name ambiguity. Verify material decisions against the AMC factsheet.
        </div>
      </PageStack>
    </PageShell>
  );
}
