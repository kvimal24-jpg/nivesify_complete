# Lifetime Plan

## Overview
Lifetime Plan helps users project their financial journey over decades, including investments, withdrawals, and goal achievement. It models corpus growth, retirement readiness, and goal funding using user inputs and assumptions.

## User Flow
- User visits the Lifetime Plan page.
- Inputs age, retirement age, corpus, SIPs, and goals.
- Runs simulation to see projected corpus, goal hits, and retirement status.
- Visualizes results with charts and summary cards.

## Data Sources
- Onboarding data from /api/onboarding.
- Simulation logic from src/lib/calculators.

## Key Files
- UI: src/app/find-my-fund-lifetime-plan/page.tsx
- Simulation: src/lib/calculators/

## Notes
- Assumptions and formulas are documented in docs/life-calculators.md.
- Results are estimates, not predictions.
