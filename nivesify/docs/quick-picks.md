# Quick Picks

## Overview
Quick Picks provides curated fund recommendations for users who want a simple, fast selection process. The page offers a shortlist of funds based on performance, category, and suitability for different investor profiles.

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
