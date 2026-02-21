
# Quick Picks

## Overview
Quick Picks provides curated fund recommendations for users who want a simple, fast selection process. The page offers a shortlist of funds based on performance, category, and suitability for different investor profiles.

---

## Deep Dive: Fund Selection Logic

### Where is the logic implemented?
The selection engine is implemented directly in:
- `src/app/find-my-fund-quick-picks/page.tsx` (Quick Picks)
- `src/app/find-my-fund-lifetime-plan/page.tsx` (Lifetime Plan)
- `src/app/mutual-fund-match/page.tsx` (Smart Fund Finder)

Each page contains its own copy of the logic, but the algorithms are functionally identical.

---

### Step-by-Step: How a Fund is Selected

#### 1. **Universe Construction**
All available mutual funds are loaded from the latest AMFI and analytics datasets. Funds are filtered to exclude those without a real track record or those not matching the required type (e.g., equity, hybrid, debt).

#### 2. **Grid Mapping**
Funds are mapped into a grid based on:
- **Equity:** Company size (Large, Mid, Small, Any Mix) × Investment style (Value, Growth, Momentum, Manager's Best Bets)
- **Hybrid:** By sub-category (Aggressive Hybrid, Conservative Hybrid, etc.)
- **Debt:** By duration and risk cell (e.g., Short Duration, Corporate Bond, etc.)

#### 3. **Sub-Category Grouping**
Within each cell, funds are grouped by sub-category (for active funds) or by benchmark (for index funds/ETFs).

#### 4. **Performance Aggregation**
For each sub-category/benchmark group:
	- Calculate the average 3Y alpha (excess return over benchmark) for all qualifying funds.
	- Calculate the average "beat rate" (percentage of funds beating the benchmark).
	- Identify the top-ranked fund by composite score within the group.

#### 5. **Category Selection (Tiebreakers)**
The engine sorts all candidate sub-categories for the cell:
	- **Primary:** Highest average 3Y alpha.
	- **Tiebreaker:** If the difference in average alpha between top groups is ≤ 0.1%, the group with the higher beat rate is chosen.

#### 6. **Fund Selection**
Within the winning sub-category/benchmark, the top-ranked fund (by composite score or ETF score) is selected. If the cell is for "Manager's Best Bets" and no active fund qualifies, the best index fund is chosen, but the engine prefers active funds for this slot if available.

#### 7. **Result Presentation**
The selected fund, its stats, and a full explanation (including all sub-categories considered and their metrics) are shown in the UI. Users can tap to see why a fund was picked, with a head-to-head comparison of all candidates.

---

### Example: Why a Lower-Return Category Might Win

Suppose in a debt cell, two sub-categories are compared:

- **Short Duration:**
	- Avg 3Y Alpha: 0.18%
	- Beat Rate: 62%
- **Low Duration:**
	- Avg 3Y Alpha: 0.12%
	- Beat Rate: 78%

Here, the difference in average alpha is only 0.06% (≤ 0.1%). The engine uses the beat rate as a tiebreaker, so "Low Duration" is selected, even though its average return is slightly lower. This ensures the chosen category is not just a statistical outlier but consistently outperforms its benchmark.

---

### Worked Example: Equity Cell

Suppose the cell is "Mid-sized Companies × Steady Growth". The engine:
1. Gathers all funds matching this cell.
2. Groups them by sub-category (e.g., "Mid Cap", "Flexi Cap").
3. Computes average alpha and beat rate for each group.
4. Ranks:
	 - Mid Cap: Avg Alpha 2.1%, Beat Rate 54%
	 - Flexi Cap: Avg Alpha 2.0%, Beat Rate 60%
	 - Since the alpha difference is 0.1%, the higher beat rate (Flexi Cap) would win if the difference were ≤ 0.1%. Otherwise, Mid Cap wins.
5. Picks the top-ranked fund in the winning group.

---

### Nuances & Rationale
- **No human bias:** All decisions are data-driven, based on live analytics.
- **Transparency:** Every step, from grouping to tiebreaker, is shown in the UI.
- **Consistency:** The same logic is used in Quick Picks, Lifetime Plan, and Smart Fund Finder, though each page adapts the UI for its context (single-goal, multi-goal, or full map).
- **Edge Cases:** If no fund in a cell has a real track record, the cell is left empty and the UI explains why.

---

## User Flow
- User visits the Quick Picks page.
- Sees a list of recommended funds with key metrics.
- Can filter by category or risk level.
- Each fund card links to detailed analytics and comparison.

## Data Sources
- Fund analytics from R2 JSON pipeline.
- Category and suitability logic from /api/funds and /api/insights.

## Key Files
- UI: src/app/find-my-fund-quick-picks/page.tsx
- Data: src/lib/fund-types.ts

## Notes
- Designed for mobile and desktop.
- Recommendations are updated periodically based on analytics pipeline.
