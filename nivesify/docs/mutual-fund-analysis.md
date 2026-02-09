# Mutual Fund Analysis

## Overview
The Mutual Fund Analysis feature is a guided research hub for investors. It provides industry context, category and sub-category diagnostics, and two dedicated workflows for active and passive fund selection. The experience is designed to be storytelling-first, data-backed, and mobile-friendly.

Primary goals:
- Explain the industry before fund selection.
- Provide clear, investor-friendly signals with benchmark context.
- Allow filtering and comparison without overwhelming the user.
- Offer curated shortlists for both active and passive funds.

## Routes
- /mutual-fund-analysis
- /active-funds
- /index-funds

## Data Sources
All pages rely on the R2 JSON pipeline fetched through server routes.

API endpoints:
- /api/insights: category and sub-category summaries
- /api/funds: active fund analytics dataset
- /api/etfs: passive fund analytics dataset
- /api/manifest: pipeline metadata and counts
- /api/amfi-raw: latest AMFI raw dataset for 1Y/3Y/5Y/10Y returns

Key bindings:
- MF_DATA_BUCKET (R2) for private data access

## User Experience Flow
### Mutual Fund Analysis (Hub)
1. Top cards summarize data vintage, total AUM, and benchmark win rate.
2. Selection Guide provides suitability-first prompts and an interactive mix builder.
3. Category AUM and fund-count pies summarize market concentration.
4. Category and sub-category diagnostics highlight return, alpha, and beat rates.
5. Category momentum section shows where active skill is strongest.
6. Active and Passive cards provide the next step with clear labeling.
7. Full insights dataset remains accessible but collapsible.

### Active Fund Selector
- Insights tab: performance signals, category tables, and skill indicators.
- Shortlisted tab: two funds per top sub-category based on composite score and scale.
- Screener tab: filters by category, benchmark, alpha, IR, and AUM.
- Methodology tab: explains alpha, IR, and composite scoring.

### Index Fund Guide
- Insights tab: passive philosophy + benchmark discipline tables.
- Shortlisted tab: two trackers per top benchmark, sorted by lowest tracking difference.
- Screener tab: filters by benchmark, tracking difference, AUM, and search.
- Methodology tab: explains tracking difference, scale, and benchmark integrity.

## Key Components
- AnalysisTabs
  Shared navigation across Analysis, Active, and Passive pages.

- SelectionGuide
  A storytelling block that frames suitability and generates a category + sub-category mix.
  Includes presets and narrative guidance. Suggested mix is intentionally short.

- FilterableTable
  A reusable table that supports sorting, filtering, sticky headers, and click-to-explain tooltips.

- ActiveFundsExplorer
  Implements the active fund insights, shortlist logic, screener, and fund details modal.

- PassiveFundsExplorer
  Implements passive insights, benchmark discipline, shortlist logic, screener, and tracker details modal.

## Shortlist Methodologies
### Active Shortlist
- Choose the largest sub-categories by AUM.
- Filter funds for a minimum scale (AUM > 50 Cr).
- Rank by Composite Score.
- Pick the top two funds per sub-category.

### Passive Shortlist
- Choose benchmarks with the highest total AUM.
- Rank trackers by lowest absolute tracking difference (3Y).
- Pick the top two trackers per benchmark.

## Mobile and Accessibility Notes
- Cards and typography use smaller defaults on mobile to avoid oversized blocks.
- Tables use sticky headers and the first column to preserve context while scrolling.
- Filters are hidden by default to reduce visual noise.
- Tooltips are accessible via click, not just hover.

## SEO and Metadata
- Global metadata updated to include mutual fund analysis keywords.
- Sitemap lists /mutual-fund-analysis, /active-funds, and /index-funds.
- Robots.txt continues to allow all public pages and disallow /api.

## Disclaimers
All analysis pages include a footer disclaimer:
- Content is informational only.
- Past performance is not indicative of future results.
- Users should consult a licensed advisor.

## Files Added or Updated
- src/app/mutual-fund-analysis/page.tsx
- src/app/active-funds/page.tsx
- src/app/index-funds/page.tsx
- src/components/SelectionGuide.tsx
- src/components/AnalysisTables.tsx
- src/components/FilterableTable.tsx
- src/components/ActiveFundsExplorer.tsx
- src/components/PassiveFundsExplorer.tsx
- src/app/sitemap.ts
- src/app/layout.tsx
- docs/mutual-fund-analysis.md

## How to Verify
1. Visit /mutual-fund-analysis and confirm the page flow and tabs.
2. Open Active and Passive pages; verify Shortlisted and Screener tabs.
3. Use filters and confirm sticky table headers and first column behavior.
4. Open a fund/tracker card and confirm modal layout.
5. Check sitemap.xml contains the new routes.
