# Nivesify

Nivesify is a Next.js app deployed on Cloudflare Workers (via OpenNext). It includes a full onboarding journey, a personal dashboard, a mutual fund health check, and life calculators for long-term planning.

## Features
- Onboarding journey to capture life context, cashflow, assets, and goals.
- My Money Dashboard with simulations, runway analysis, and goal tracking.
- Mutual Fund Health Check (MFHC) with CAS parsing and portfolio analytics.
- Life Calculators for SIPs, lumpsums, withdrawals, and retirement readiness.
- Smart Fund Finder: guided fund selection based on user context.
- Why Mutual Fund: educational hub for mutual fund benefits.
- Quick Picks: curated fund recommendations for easy selection.
- Lifetime Plan: long-term planning and projections.

---

## Architecture at a glance
- **Framework**: Next.js (App Router) compiled for Cloudflare Workers via `@opennextjs/cloudflare`.
- **Hosting**: Cloudflare Workers — production worker `nivesify` (nivesify.com), staging worker `nivesify-staging`.
- **D1 (SQLite)**: database `nivesify-db` (binding `nivesify_db`) — user accounts, onboarding answers, parsed CAS data.
- **R2**: bucket `mf-data-bucket` (binding `MF_DATA_BUCKET`) — prebuilt fund-market datasets served as static JSON.
- **Auth**: Google OAuth (arctic) + JWT session cookie (jose, HS256, 30 days). No Workers KV, no ISR/revalidate, no cron triggers anywhere.

---

# DATA PIPELINE (read this before touching anything)

## 1. Ingestion & artifact build happens OUTSIDE this repo
There are **no ETL scripts in this repository**. Raw AMFI scheme-performance data is processed offline (separate local workflow) into five JSON artifacts, which are then **manually uploaded** to R2 under key prefix `data/latest/`. There are no scheduled jobs — dataset refreshes are manual. Sample copies of every artifact live in `/R2 Data Sample` at the repo root.

| R2 key (`data/latest/…`) | Contents | TS types |
|---|---|---|
| `amfi_raw.json` (~3.9 MB) | Full fund universe (~2,000 schemes): category/sub-category, Regular vs Direct vs Benchmark returns (7D–10Y/SinceLaunch), dailyAUM, information ratios, riskometers, benchmark names | consumed as-is |
| `fund-analytics.json` (~1 MB) | ~1,350 active funds: returns/alpha/IR for 1Y/3Y/5Y, `Composite_Score`, `Rank_in_SubCategory`, `Percentile_in_SubCategory`, top-10% flag | `FundAnalytics` in `src/lib/fund-types.ts` |
| `etf-analytics.json` (~300 KB) | ~650 ETFs/passive funds: tracking difference/score, rank within benchmark | `ETFAnalytics` in `src/lib/fund-types.ts` |
| `industry-and-category-insights.json` (~22 KB) | 46 Industry/Category/Sub-Category aggregates: AUM stats, avg alpha/IR, % funds beating benchmark | `CategoryInsights` in `src/lib/fund-types.ts` |
| `manifest.json` | Freshness metadata: `{dateTag, reportDate, counts:{raw, insights, funds, etfs}}` | — |

To refresh data: regenerate these JSONs offline and upload each to `mf-data-bucket/data/latest/<file>.json` (e.g. `wrangler r2 object put` or the Cloudflare dashboard).

## 2. Runtime consumption — dual path (`src/lib/data-endpoints.ts`)
```
IS_PROD ? https://pub-260c05cf57d44671bf81cc305a2e6856.r2.dev/data/latest/<file>   ← prod: browser fetches R2 directly (CORS-enabled public bucket URL)
        : /api/<name>                                                              ← dev: Worker route proxies the R2 binding
```
- Dev proxy routes: `/api/amfi-raw`, `/api/funds`, `/api/etfs`, `/api/insights`, `/api/manifest` — one-liners calling `getR2JsonResponse("data/latest/…")` from `src/lib/r2.ts` (streams from `env.MF_DATA_BUCKET.get()` with `Cache-Control: public, max-age=3600, s-maxage=86400`).
- Client-side caching: `fetchCachedJson()` in `src/lib/client-data.ts` — module-level Map memoization + browser HTTP cache. Failed promises evict from the map.
- All heavy pages (active-funds, index-funds, mutual-fund-analysis, mutual-fund-match, quick-picks, lifetime-plan, MFHC dashboard) are client components that load these datasets in the browser and compute analytics there. This was deliberate ("Move heavy fund data loading to clients") to keep Worker request counts low.
- `getLatestR2JsonResponse()` in `r2.ts` supports date-tagged keys (`data/YYYY-MM-DD/…`) but is currently dead code — everything pins literal `data/latest/*`.

## 3. Derived computations (client-side)
- `src/lib/amfi-aggregates.ts` — recomputes industry/category rollups from `amfi_raw.json` on the fly (used by active-funds and mutual-fund-analysis pages).
- `src/lib/fund-selection-engine.ts` — the single recommendation engine behind Quick Picks, Lifetime Plan, and Smart Fund Finder. Joins all four datasets, groups funds by Sub_Category (or benchmark for index/ETF), averages Alpha_3Y (+beat rate from insights), picks winning group (tiebreak ≤0.1% alpha → beat rate), then best-ranked fund. Design spec: `/Find my Fund.md` at repo root; docs/quick-picks.md and docs/lifetime-plan.md.

## 4. User data — D1 schema (`src/db/schema.ts`, Drizzle ORM)
| Table | Shape | Purpose |
|---|---|---|
| `users` | Google ID PK, email (unique), name, picture | OAuth identity |
| `onboarding` | user_id FK + `data` (JSON text blob) | Entire onboarding wizard state, one blob per user |
| `mutual_fund_health_check` | user_id FK + `data` (JSON text blob) | Entire parsed CAS payload incl. manual investments / SIP plans added later in UI |
| `mf_scheme_cache` | defined but **unused** in code | Reserved |

Migrations live duplicated in `drizzle/` and `migrations/`; applied manually with `npx wrangler d1 migrations apply nivesify-db --remote`.

## 5. MFHC (Mutual Fund Health Check) end-to-end flow
1. User uploads CAS PDF (≤20 MB, optional password) in `src/app/mutual-fund-health-check/page.tsx`.
2. **The PDF never leaves the browser** — parsed client-side with `pdfjs-dist` (legacy build); text extracted page-by-page.
3. `src/lib/mutual-fund-health-check/cas-parser.ts` cleans text noise and produces `{ meta, holder, summary, transactions, nominees }`; folio ISINs are mapped to schemes/categories using the live AMFI scheme list fetched server-side from `https://portal.amfiindia.com/spages/NAVAll.txt` via `/api/mutual-fund-health-check/mf`.
4. Parsed JSON POSTs to `/api/mutual-fund-health-check` → upserted as one JSON blob per user in D1 table `mutual_fund_health_check`.
5. Dashboard (`mutual-fund-health-check/dashboard/page.tsx`) loads the stored blob + the four R2 datasets + NAV histories from `https://api.mfapi.in/mf/{schemeCode}` (concurrency-limited, once-per-day freshness, cached in browser IndexedDB via `idb`: DB `mfhc`, store `nav-history` — see `src/lib/mutual-fund-health-check/nav.ts` and `nav-db.ts`).
6. Analytics computed fully client-side: FIFO lot matching + realised gains (`portfolio.ts`), XIRR via Newton-Raphson (`xirr.ts`, `cashflows.ts`), charts (`chart-data.ts`), insights (`report.ts`). Manual investments/SIP plans are saved back into the same D1 blob and synthesized as pseudo-transactions (`manual.ts`). PDF report generated in-browser with jsPDF + html2canvas.

## 6. Onboarding flow
Six-step wizard (`dashboard/onboarding/page.tsx`) loads prior state via `GET /api/onboarding` and saves the whole form object via `POST /api/onboarding` (upsert into D1 `onboarding.data`). The dashboard hydrates its simulation inputs from that blob.

## Pipeline diagram
```
[Offline] AMFI scheme-performance data ──(external build)──▶ 5 JSON artifacts
        ──(manual upload)──▶ R2 "mf-data-bucket" @ data/latest/*
                                   │
             PROD: browser ← pub-….r2.dev direct fetch (Map + HTTP cache)
             DEV : browser ← /api/* route ← MF_DATA_BUCKET binding
                                   ▼
     Research/recommendation pages (fund-selection-engine + amfi-aggregates, client-side)

Google OAuth → users row → JWT cookie ─┬─ Onboarding wizard JSON ──▶ D1 onboarding.data
                                       └─ CAS PDF (parsed in-browser w/ pdfjs + live AMFI list)
                                              ──▶ D1 mutual_fund_health_check.data
Dashboard: D1 blob + R2 datasets + mfapi.in NAVs (IndexedDB cache)
        → FIFO portfolio / XIRR / charts / insights / jsPDF report (all client-side)
```

---

### Fund Selection Engine (Quick Picks, Lifetime Plan, Smart Fund Finder)
All three features use the same robust, transparent selection engine to recommend funds. The engine:
- Maps all available funds into a grid by type, size, and style
- Groups by sub-category or benchmark
- Aggregates performance (alpha, beat rate)
- Applies a tiebreaker (beat rate if alpha difference ≤ 0.1%)
- Picks the top-ranked fund in the winning group

For a full, example-rich explanation, see:
- docs/quick-picks.md (detailed step-by-step logic, examples, and rationale)
- docs/lifetime-plan.md (multi-goal adaptation)

This ensures consistency, transparency, and no human bias across all fund recommendation features.

## Project structure
- src/app - Next.js App Router pages
- src/app/dashboard - onboarding and dashboard experiences
- src/app/mutual-fund-health-check - MFHC upload, dashboard, portfolio and transactions pages
- src/app/dashboard/calculators - Life Calculators page
- src/app/find-my-fund-quick-picks - Quick Picks page
- src/app/find-my-fund-lifetime-plan - Lifetime Plan page
- src/app/why-mutual-fund - Why Mutual Fund page
- src/app/mutual-fund-match - Smart Fund Finder page
- src/app/mutual-fund-analysis - Mutual Fund Analysis hub
- src/app/active-funds - Active Funds selector
- src/app/index-funds - Passive Funds selector
- src/app/api - API routes: auth (Google OAuth), amfi-raw, funds, etfs, insights, manifest (dev-only R2 proxies), me, calculators, mutual-fund-health-check (incl. live AMFI scheme-list endpoint), onboarding
- src/lib - shared logic, calculators, MFHC utilities, data access (r2.ts, client-data.ts, data-endpoints.ts, db.ts, fund-selection-engine.ts, amfi-aggregates.ts, fund-types.ts)
- src/db/schema.ts - Drizzle D1 schema
- docs - product and math documentation
- ../R2 Data Sample - snapshots of the five R2 JSON artifacts
- ../Find my Fund.md - fund selection engine design spec

## Local development
```bash
npm install
npm run dev
```

Open http://localhost:3000 to view the app. In dev mode, market datasets are proxied through `/api/*` routes backed by the real R2 bucket (requires Cloudflare context; use `npm run preview` for a full local Workers simulation).

## Build and deploy
Production deploy:
```bash
npm run deploy
```

Staging deploy:
```bash
export CLOUDFLARE_API_TOKEN=your-token
npm run deploy:staging
```

GitHub Actions auto-deploys staging on push to any branch (`.github/workflows/deploy-staging.yml`); production deploy is manual (`workflow_dispatch`).

## Database operations
```bash
npx wrangler d1 migrations apply nivesify-db --remote          # run migrations
npx wrangler d1 execute nivesify-db --remote --command "..."   # query directly
```

## Documentation
- docs/mutual-fund-health-check.md
- docs/life-calculators.md
- docs/onboarding.md
- docs/dashboard.md
- docs/mutual-fund-analysis.md
- docs/quick-picks.md
- docs/lifetime-plan.md
- docs/why-mutual-fund.md

## Notes
- Uses Cloudflare D1 for auth, onboarding data, and MFHC storage (one JSON blob per user per table).
- Uses Cloudflare R2 (`mf-data-bucket`) for the five prebuilt market datasets under `data/latest/`; refreshed manually outside this repo.
- Staging shares the same D1 database and R2 bucket as production — test carefully.
