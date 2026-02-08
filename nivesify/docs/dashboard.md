# My Money Dashboard

## Overview
The dashboard aggregates onboarding data, simulates long-term outcomes, and presents insights about runway, retirement, goals, and risk coverage. It is the central view for a user`s financial direction.

---

## Data sources
- Onboarding data loaded from GET /api/onboarding.
- The dashboard derives the current corpus from the asset totals.

---

## Core calculations

### Blended return
A blended return is derived from the equity ratio:
- Equity assumed return: 12 percent
- Debt assumed return: 7 percent

Formula:
- blendedReturn = equityRatio * 12 + (1 - equityRatio) * 7

### Runway calculation
Estimates how long a corpus can sustain annual draw.
- Uses a real return (return minus inflation).
- Handles the near-zero real return case with a linear approximation.

### Simulation engine
A yearly simulation runs from current age to life expectancy:
- Pre-retirement: corpus grows with blended return and cashflow surplus.
- Post-retirement: corpus grows with a lower blended return and funds annual expenses.
- Goals are applied in specific years, inflated by the user inflation rate.

The output series includes:
- corpus
- growth
- inflow and outflow
- retirement status
- goals hit

### FIRE age
The dashboard estimates FIRE age by checking when:
- corpus > 25 times inflated annual expenses

### Joy money
Calculates a safe monthly discretionary spend that does not cause corpus depletion.
- Uses a binary search over monthly spend
- Evaluates corpus stability over time

---

## Key UI sections
- Summary cards for net worth, runway, and key alerts.
- Timeline chart for corpus over time with retirement and goal markers.
- Risk coverage modules for health and term insurance.
- Action nudges with next steps (calculator links and edits).

---

## Key files
- Dashboard UI: src/app/dashboard/page.tsx
- Onboarding data API: src/app/api/onboarding/route.ts
- Auth utilities: src/lib/auth.ts

---

## How to verify
1. Complete onboarding with sample data.
2. Open /dashboard and confirm charts populate.
3. Change inputs and confirm charts update.
4. Check that goals appear in the correct years.

---

## Notes
- Calculations are illustrative and intended for planning.
- Outcomes depend on the chosen assumptions and actual market performance.
