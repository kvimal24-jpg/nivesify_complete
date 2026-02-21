# NAVIGATION README

## All UI Pages & Links

Below is a complete list of all UI pages on the Nivesify website. Use these links for navigation tabs, sidebar, or hero section navigation. Each page is explained in detail for context and significance.

---

### Mutual Fund World Section (Main Navigation Links)
- [Why Mutual Fund](nivesify/src/app/why-mutual-fund/page.tsx)
- [Smart Fund Finder](nivesify/src/app/mutual-fund-match/page.tsx)
- [MF Industry Analysis](nivesify/src/app/mutual-fund-analysis/page.tsx)
- [Active Funds](nivesify/src/app/active-funds/page.tsx)
- [Passive Funds](nivesify/src/app/index-funds/page.tsx)
- [Quick Picks](nivesify/src/app/find-my-fund-quick-picks/page.tsx)
- [Lifetime Plan](nivesify/src/app/find-my-fund-lifetime-plan/page.tsx)
- [Mutual Fund Health Check](nivesify/src/app/mutual-fund-health-check/page.tsx)

---

## Detailed Page-by-Page Analysis

### 1. Main Landing Page
- [page.tsx](nivesify/src/app/page.tsx)
- **Purpose:** Entry point for Nivesify. Introduces the platform, its philosophy, and links to major features. Sets the visual tone and design system.

### 2. Dashboard
- [dashboard/page.tsx](nivesify/src/app/dashboard/page.tsx)
- **Purpose:** User's financial overview. Tracks net worth, goals, and runway. Visualizes key metrics and provides links to calculators and onboarding.

#### Dashboard Subpages:
- [dashboard/onboarding/page.tsx](nivesify/src/app/dashboard/onboarding/page.tsx)
  - **Purpose:** Guided onboarding for mapping cashflow, goals, and protection needs. Interactive journey for new users.
- [dashboard/calculators/page.tsx](nivesify/src/app/dashboard/calculators/page.tsx)
  - **Purpose:** Life calculators for retirement, education, FIRE, etc. Visualizes cashflow and goal achievement.

### 3. Mutual Fund World Pages
- [why-mutual-fund/page.tsx](nivesify/src/app/why-mutual-fund/page.tsx)
  - **Purpose:** Explains the benefits, myths, and basics of mutual funds. Educational and persuasive content.
- [mutual-fund-match/page.tsx](nivesify/src/app/mutual-fund-match/page.tsx)
  - **Purpose:** Smart fund finder. Helps users match funds to their needs using analytics and filters.
- [mutual-fund-analysis/page.tsx](nivesify/src/app/mutual-fund-analysis/page.tsx)
  - **Purpose:** Industry-wide insights, tables, and methodology. Deep-dive into fund performance and categories.
- [active-funds/page.tsx](nivesify/src/app/active-funds/page.tsx)
  - **Purpose:** Explorer for active funds. Uses alpha, information ratio, and composite scoring to shortlist funds.
- [index-funds/page.tsx](nivesify/src/app/index-funds/page.tsx)
  - **Purpose:** Explorer for passive/index funds. Compares trackers by benchmark fit, tracking difference, and liquidity.
- [find-my-fund-quick-picks/page.tsx](nivesify/src/app/find-my-fund-quick-picks/page.tsx)
  - **Purpose:** Quick fund recommendations based on user input. Shows allocation, projections, and fund picks.
- [find-my-fund-lifetime-plan/page.tsx](nivesify/src/app/find-my-fund-lifetime-plan/page.tsx)
  - **Purpose:** Lifetime investment planning. Multi-phase allocation, projections, and fund selection for long-term goals.
- [mutual-fund-health-check/page.tsx](nivesify/src/app/mutual-fund-health-check/page.tsx)
  - **Purpose:** Upload CAS, analyze portfolio health, XIRR, and actionable insights. Entry point for portfolio analysis.

#### Mutual Fund Health Check Subpages:
- [mutual-fund-health-check/dashboard/page.tsx](nivesify/src/app/mutual-fund-health-check/dashboard/page.tsx)
  - **Purpose:** Portfolio health dashboard. Visualizes XIRR, performance, and fund-level insights.
- [mutual-fund-health-check/portfolio/page.tsx](nivesify/src/app/mutual-fund-health-check/portfolio/page.tsx)
  - **Purpose:** Detailed portfolio view. Holdings, allocations, and fund details.
- [mutual-fund-health-check/transactions/page.tsx](nivesify/src/app/mutual-fund-health-check/transactions/page.tsx)
  - **Purpose:** Transaction history and cashflow tracking from CAS data.

---

## How to Use This README
- Use the above links for navigation tabs, sidebar, or hero navigation on all relevant pages.
- Refer to the detailed descriptions to understand each page’s role and what links should be present.
- Ensure navigation is consistent and covers all major features and subpages.

---

## For AI Coder
- When updating navigation, always include the full set of links listed above.
- Highlight the current page in navigation.
- Use the page descriptions to add context-aware links and improve user experience.
- Do not miss any page or subpage listed here.

---

This README provides a complete map of the Nivesify website UI for navigation updates and improvements.