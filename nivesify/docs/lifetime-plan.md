
# Lifetime Plan

## Overview
Lifetime Plan helps users project their financial journey over decades, including investments, withdrawals, and goal achievement. It models corpus growth, retirement readiness, and goal funding using user inputs and assumptions.

---

## Deep Dive: Fund Selection Logic (Multi-Goal)

The Lifetime Plan adapts the same robust fund selection engine used in Quick Picks and Smart Fund Finder, but applies it dynamically across multiple life goals and phases.

### How It Works

1. **User Inputs Goals:**
	- Each goal has a target amount, time horizon, risk comfort, and priority.

2. **SIP Calculation:**
	- For each goal, the engine computes the required SIP (with step-up) to reach the target, using expected return bands from the allocation plan.
	- The total SIP is the sum of all goal SIPs, adjusted for step-up.

3. **Phase Construction:**
	- The plan is divided into phases, each representing a period where the set of active goals changes (e.g., after a goal is achieved).
	- For each phase, the engine blends the risk and horizon of all active goals to create a composite allocation plan.

4. **Fund Selection Per Phase:**
	- For each phase's allocation, the engine runs the same selection logic as Quick Picks:
	  - Map funds to grid cells (equity, hybrid, debt) based on the blended plan.
	  - For each cell, group by sub-category/benchmark, compute average alpha and beat rate, and select the winner using the same tiebreakers.
	  - Pick the top-ranked fund in the winning group.

5. **Result Presentation:**
	- For each phase, the UI shows the recommended funds, allocation breakdown, and SIP split by goal.
	- Users can drill down to see why each fund was picked, with full transparency.

---

### Example: Multi-Goal Phase

Suppose a user has two goals:
  - Buy a Car: ₹10L in 3 years, risk 4/10, priority "important"
  - Retirement: ₹1Cr in 25 years, risk 6/10, priority "essential"

**Phase 1 (Years 0–3):**
  - Both goals are active. The engine blends risk and horizon (weighted by priority) to create a plan, e.g., horizon ≈ 5 years, risk ≈ 5/10.
  - The allocation plan might be: 50% Core Equity, 25% Balanced Equity, 25% Stability.
  - For each block, the engine selects funds using the same logic as Quick Picks (see that doc for details).

**Phase 2 (After Year 3):**
  - Car goal is achieved; only Retirement remains. The plan shifts to a longer horizon and higher risk, so the allocation becomes more growth-oriented, and the fund selection is re-run for the new mix.

---

### Nuances & Rationale
- **Dynamic Adaptation:** The fund selection is re-run at every phase, so the portfolio evolves as goals are achieved or priorities change.
- **No Human Bias:** All decisions are data-driven, using the same transparent logic as Quick Picks.
- **Full Transparency:** Users can see the rationale for every fund in every phase, including all sub-categories considered and tiebreakers used.
- **Consistency:** The same engine powers Quick Picks, Lifetime Plan, and Smart Fund Finder, ensuring a unified experience.

---

## User Flow
- User visits the Lifetime Plan page.
- Inputs age, retirement age, corpus, SIPs, and goals.
- Runs simulation to see projected corpus, goal hits, and retirement status.
- Visualizes results with charts and summary cards.

## Data Sources
- Onboarding data from /api/onboarding.
- Simulation logic from src/lib/calculators.
- Fund selection logic from src/app/find-my-fund-lifetime-plan/page.tsx (see also docs/quick-picks.md for engine details).

## Key Files
- UI: src/app/find-my-fund-lifetime-plan/page.tsx
- Simulation: src/lib/calculators/

## Notes
- Assumptions and formulas are documented in docs/life-calculators.md.
- Results are estimates, not predictions.
