# Onboarding Journey

## Overview
The onboarding journey is a guided, multi-step flow that captures a user`s life context, cashflow, protection, assets, and goals. It saves data to the server and powers downstream pages like the dashboard and calculators.

The flow is designed to be calm and structured while collecting enough inputs to model a realistic financial plan.

---

## User flow
1. User starts onboarding and progresses through six steps.
2. Each step validates key inputs before moving forward.
3. Default goals are generated when possible (for example, child education).
4. Data is saved to the server on completion.
5. The user is redirected to the dashboard.

---

## Steps and data collected

### Step 1: The Protagonist (Timeline)
Captures the user`s personal timeline and dependents.
- Age
- Retirement age
- Marital status
- Children count and ages
- Dependent parents

### Step 2: The Flow (Cashflow and SIPs)
Captures monthly cashflow and current investing.
- Monthly income
- Monthly expenses
- Monthly EMI
- Existing SIP

### Step 3: The Shield (Risk protection)
Captures core protection info.
- Emergency fund
- Term insurance cover
- Health insurance type (corporate, personal, none)

### Step 4: The Vault (Assets and net worth)
Captures asset allocation and current corpus.
- Equity
- Debt
- Gold
- Real estate
- Cash

### Step 5: The Dream (Goals)
Captures or generates goals.
- User-defined goals (name, age, cost)
- Default education goals created from child ages

### Step 6: The Map (Final review)
Summarizes the inputs and prepares for dashboard simulation.

---

## Validation rules
- Age must be at least 18.
- Retirement age must be greater than current age.
- Monthly income must be a positive number.
- Expenses and EMIs must be non-negative.

---

## Default goal logic
When child ages are provided, the system adds education goals if they do not already exist:
- Education age defaults to 18.
- Education cost defaults to 2,500,000.

---

## Data storage
On completion, the onboarding data is stored via the API:
- GET /api/onboarding - returns saved data for the logged-in user.
- POST /api/onboarding - upserts the data for the logged-in user.

The data is stored as a JSON payload in D1 via Drizzle.

---

## Key files
- UI flow: src/app/dashboard/onboarding/page.tsx
- API route: src/app/api/onboarding/route.ts
- Database schema: src/db/schema.ts
- Auth utilities: src/lib/auth.ts

---

## How to verify
1. Log in and complete the onboarding steps.
2. Refresh the page and confirm data is restored from the API.
3. Complete onboarding and confirm redirect to /dashboard.
4. Verify the dashboard loads with the saved inputs.

---

## Notes
- The flow is client-side and uses framer-motion for transitions.
- On each step change, the page scrolls to the top for a focused experience.
