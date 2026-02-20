# Nivesify

Nivesify is a Next.js app deployed on Cloudflare. It includes a full onboarding journey, a personal dashboard, a mutual fund health check, and life calculators for long-term planning.

## Features
- Onboarding journey to capture life context, cashflow, assets, and goals.
- My Money Dashboard with simulations, runway analysis, and goal tracking.
- Mutual Fund Health Check (MFHC) with CAS parsing and portfolio analytics.
- Life Calculators for SIPs, lumpsums, withdrawals, and retirement readiness.
- Smart Fund Finder: guided fund selection based on user context.
- Why Mutual Fund: educational hub for mutual fund benefits.
- Quick Picks: curated fund recommendations for easy selection.
- Lifetime Plan: long-term planning and projections.

## Project structure
- src/app - Next.js App Router pages
- src/app/dashboard - onboarding and dashboard experiences
- src/app/mutual-fund-health-check - MFHC upload and analytics pages
- src/app/dashboard/calculators - Life Calculators page
- src/app/find-my-fund-quick-picks - Quick Picks page
- src/app/find-my-fund-lifetime-plan - Lifetime Plan page
- src/app/why-mutual-fund - Why Mutual Fund page
- src/app/mutual-fund-match - Smart Fund Finder page
- src/app/mutual-fund-analysis - Mutual Fund Analysis hub
- src/app/active-funds - Active Funds selector
- src/app/index-funds - Passive Funds selector
- src/app/api - API routes for onboarding, MFHC, and analytics
- src/lib - shared logic, calculators, MFHC utilities
- docs - product and math documentation

## Local development
```bash
npm install
npm run dev
```

Open http://localhost:3000 to view the app.

## Build and preview
```bash
npm run build
npm run preview
```

## Deploy
Production deploy:
```bash
npm run deploy
```

Staging deploy:
```bash
export CLOUDFLARE_API_TOKEN=your-token
npm run deploy:staging
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
- Uses Cloudflare D1 for onboarding data and MFHC storage.
- Uses Cloudflare R2 for large data artifacts when applicable.
- This repository contains the app at /nivesify within the root workspace.
