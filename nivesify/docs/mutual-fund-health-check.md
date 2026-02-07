# Mutual Fund Health Check (MFHC)

## Overview
MFHC lets a user upload a CAS PDF, parses it in the browser, enriches scheme metadata from AMFI, stores the parsed data per user, and generates portfolio analytics, insights, and a formatted PDF report.

The flow is designed to keep heavy parsing client-side while persisting the structured output to the server for repeat access and reporting.

---

## High-level user flow
1. User opens MFHC upload page and selects a CAS PDF.
2. PDF is parsed in the browser using pdfjs. Text is normalized and filtered.
3. CAS data is converted to structured JSON (transactions, holder, summary).
4. The JSON is POSTed to the MFHC API and stored per user in D1.
5. Dashboard retrieves stored data and computes portfolio analytics.
6. NAV history is fetched and cached in IndexedDB for performance.
7. Insights and report data are computed and shown on dashboard.
8. User can download a PDF report generated in the browser.

---

## Data sources
- CAS PDF uploaded by the user.
- AMFI NAVAll.txt for scheme metadata (scheme type, category, AMC).
- mfapi NAV history for per-scheme time series.

---

## Parsing and normalization
### Client-side parsing
- PDF parsing is handled by pdfjs in the browser.
- Raw text is normalized and filtered to isolate CAS sections and transactions.
- Transactions are extracted, including:
  - date, amount, units, price
  - transaction type (Investment / Redemption)
  - scheme identifiers (ISIN / scheme code)
  - folio and scheme names

### Scheme metadata mapping
- On parse, scheme metadata is merged using AMFI NAVAll.txt via the MFHC scheme endpoint.
- Each transaction is mapped to a scheme with:
  - scheme code
  - scheme name
  - scheme category
  - scheme type
  - AMC name

---

## Data storage
### API storage layer
- MFHC data is stored per user in the D1 database.
- The API stores a single JSON payload per user and updates on every upload.

### Storage schema (logical)
- data.meta: CAS date range and export timestamp
- data.holder: name, email, mobile, address (PAN may be present)
- data.summary: invested and current value from CAS
- data.transactions: full transaction list with mapped scheme metadata

---

## Data retrieval
- The dashboard, portfolio, and transactions pages all fetch the stored JSON using the MFHC API.
- The API also normalizes numeric fields back into numbers on read.

---

## NAV history caching
- NAV history is fetched from mfapi per scheme code.
- NAV history is cached in IndexedDB (client-side) to avoid repeated network calls.
- Cache refresh is controlled by a per-day timestamp rule.

---

## Portfolio computation
Portfolio holdings are computed from transactions:
- Units and invested value are accumulated per fund.
- Latest NAV is used to compute current value and profit.
- XIRR is computed from cashflows where possible.

---

## Insights engine
Insights are generated from portfolio metrics and follow a consistent pattern:
- Signal (Normal, Elevated, Watch-worthy, Strong, Aggressive)
- Observation
- What this indicates
- Reassurance
- Suggested check

Signals are derived from thresholds for:
- Fund count (over-diversification guidance)
- Single fund concentration
- Top 5 fund concentration
- AMC concentration
- Allocation skews (equity, debt, hybrid)
- Portfolio XIRR banding

---

## Report generation
- The PDF report is generated in the browser using jsPDF.
- Report sections include:
  - Cover page with summary cards
  - Portfolio summary cards
  - Performance summary table
  - Allocation summary tables
  - Insights cards with signal tags
  - Holdings detail table
  - Disclaimers and page footers

---

## Security and privacy
- PDF parsing is done in the browser.
- Only the parsed JSON is stored on the server.
- Data is stored per authenticated user via session.

---

## Key files and components
- Upload + parsing UI: src/app/mutual-fund-health-check/page.tsx
- Dashboard + charts: src/app/mutual-fund-health-check/dashboard/page.tsx
- Portfolio list: src/app/mutual-fund-health-check/portfolio/page.tsx
- Transactions list: src/app/mutual-fund-health-check/transactions/page.tsx
- API storage: src/app/api/mutual-fund-health-check/route.ts
- AMFI metadata: src/app/api/mutual-fund-health-check/mf/route.ts
- CAS parsing: src/lib/mutual-fund-health-check/cas-parser.ts
- Portfolio math: src/lib/mutual-fund-health-check/portfolio.ts
- Insights + report: src/lib/mutual-fund-health-check/report.ts
- NAV cache: src/lib/mutual-fund-health-check/nav.ts, nav-db.ts
- XIRR: src/lib/mutual-fund-health-check/xirr.ts

---

## Known limitations
- NAV history depends on mfapi availability.
- CAS formatting differences across RTAs may require parser tweaks.
- PDF report is generated client-side and may vary slightly across browsers.

---

## How to verify
1. Upload a CAS file on the MFHC upload page.
2. Verify dashboard metrics and insights.
3. Open portfolio and transactions pages to confirm computed values.
4. Download the PDF report and verify section layout.

---

## Disclaimers
All financial decisions involve risk and past performance is no guarantee of future results. You should consult with a qualified advisor and review all relevant disclosure documents before acting on any information provided.
