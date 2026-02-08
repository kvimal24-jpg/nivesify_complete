# Life Calculators

This document describes the Life Calculators page in Nivesify, what it includes, and how each calculator is computed. The page is designed as a guided journey across five chapters with consistent inputs, readable outputs, and charts that mirror the math.

## Page Overview

The Life Calculators page is organized into chapters:

- Direction: goal based planning from a target amount.
- Building: future value growth from ongoing or one time investing.
- Optimising: limited period SIPs and mixed inputs.
- Living Off Money: withdrawals and retirement income planning.
- Readiness: retirement shortfall or surplus.

Each calculator follows a shared structure:

- Inputs with numeric fields, optional sliders, and unit indicators.
- A calculate button that reveals the result section.
- Result cards with a short explanation.
- A chart that visualizes the calculation path.
- A next step link to the next tool in the journey.

## Data and Formatting

- Currency formatting uses the Indian number system (e.g., 12,34,567).
- Charts generally plot values by year using the same color palette:
  - Green for corpus or remaining money.
  - Gold for investment contributions.
  - Red for withdrawals.
- All charts label the X axis as years, and tooltips show formatted values.

## Global Assumptions

- SIPs are modeled at the beginning of each month.
- Withdrawals are modeled at the end of each month.
- Retirement calculations are inflation-adjusted to reflect real purchasing power.

## Disclaimer

These are planning estimates, not predictions. Outcomes will vary.

## Calculators and Formulas

### 1) SIP required for a future goal

Purpose: Find the monthly SIP needed to reach a future goal amount.

Inputs:
- Goal amount
- Time horizon (years)
- Expected return (annual percent)

Calculation:
- Monthly rate r = expectedReturn / 100 / 12
- Total months n = years * 12
- SIP = goalAmount / n if r = 0
- Otherwise SIP = goalAmount * (r / ( (1 + r)^n - 1 )) / (1 + r)

Chart:
- Yearly invested amount vs total corpus using SIP growth data.

### 2) Lumpsum required for a future goal

Purpose: Find the one time amount needed today to reach a future goal.

Inputs:
- Goal amount
- Time horizon (years)
- Expected return (annual percent)

Calculation:
- Annual rate r = expectedReturn / 100
- Lumpsum = goalAmount if r = 0
- Otherwise Lumpsum = goalAmount / (1 + r)^years

Chart:
- Yearly invested amount vs total corpus using lumpsum growth data.

### 3) Future value of a SIP

Purpose: Estimate corpus from a monthly SIP over time.

Inputs:
- Monthly SIP
- Time horizon (years)
- Expected return (annual percent)

Calculation:
- Monthly rate r = expectedReturn / 100 / 12
- Total months n = years * 12
- FV = SIP * n if r = 0
- Otherwise FV = SIP * ( ( (1 + r)^n - 1 ) / r ) * (1 + r)

Chart:
- Yearly invested amount vs total corpus using SIP growth data.

### 4) Future value of a lumpsum

Purpose: Estimate corpus from a one time investment.

Inputs:
- Lumpsum amount
- Time horizon (years)
- Expected return (annual percent)

Calculation:
- Annual rate r = expectedReturn / 100
- FV = lumpsum * (1 + r)^years

Chart:
- Yearly invested amount vs total corpus using lumpsum growth data.

### 5) Future value of SIP + one time

Purpose: Estimate corpus from a monthly SIP plus an upfront amount.

Inputs:
- Monthly SIP
- One time investment
- Time horizon (years)
- Expected return (annual percent)

Calculation:
- SIP FV (as in calculator 3)
- Lumpsum FV (as in calculator 4)
- Combined = SIP FV + Lumpsum FV

Chart:
- Total investment vs total corpus over time.

### 6) Future value of limited period SIP

Purpose: Invest for a limited period, then allow the corpus to grow.

Inputs:
- Monthly SIP
- SIP period (years)
- Total growth period (years)
- Expected return (annual percent)

Calculation:
- Monthly rate r = expectedReturn / 100 / 12
- SIP months = sipPeriodYears * 12
- Total months = totalGrowthYears * 12
- Corpus at SIP end = SIP FV over sip months
- Remaining months = totalMonths - sipMonths
- Final corpus = corpusAtSipEnd * (1 + r)^(remainingMonths)

Chart:
- Invested vs corpus showing SIP phase and growth phase.

### 7) Limited SIP required for goal

Purpose: Find SIP amount if you invest only for a portion of the horizon.

Inputs:
- Goal amount
- SIP period (years)
- Total growth period (years)
- Expected return (annual percent)

Calculation:
- Monthly rate r = expectedReturn / 100 / 12
- SIP months = sipPeriodYears * 12
- Total months = totalGrowthYears * 12
- Remaining months = totalMonths - sipMonths
- FV of one rupee SIP over sip months = ((1 + r)^sipMonths - 1) / r * (1 + r)
- Compounded FV of one rupee SIP to total horizon = fvOneRupee * (1 + r)^remainingMonths
- Required SIP = goalAmount / compoundedFv

Chart:
- Invested vs corpus showing SIP phase and growth phase.

### 8) One time required if SIP is known

Purpose: Find the extra lumpsum needed when a SIP is already planned.

Inputs:
- Goal amount
- Monthly SIP
- Time horizon (years)
- Expected return (annual percent)

Calculation:
- FV of SIP over time
- Remaining goal = goalAmount - sipFV
- One time = 0 if remaining <= 0
- Otherwise one time = remaining / (1 + r)^years

Chart:
- SIP invested, lumpsum invested, and total corpus.

### 9) SIP required if one time is known

Purpose: Find SIP required when an upfront amount is invested.

Inputs:
- Goal amount
- One time investment
- Time horizon (years)
- Expected return (annual percent)

Calculation:
- FV of one time investment
- Remaining goal = goalAmount - fvLumpsum
- SIP = 0 if remaining <= 0
- Otherwise SIP = remaining / n if monthly rate is 0
- Else SIP = remaining * (r / ( (1 + r)^n - 1 )) / (1 + r)

Chart:
- Lumpsum invested, SIP invested, and total corpus.

### 10) SWP from retirement corpus

Purpose: Estimate monthly withdrawals supported by a corpus.

Inputs:
- Retirement corpus
- Withdrawal period (years)
- Expected return (annual percent)

Calculation:
- Monthly rate r = expectedReturn / 100 / 12
- Total months n = years * 12
- Monthly SWP = corpus / n if r = 0
- Otherwise Monthly SWP = corpus * ( r / (1 - (1 + r)^(-n)) )

Chart:
- Remaining corpus across years.

### 11) Corpus required for SWP

Purpose: Estimate corpus needed for a desired monthly income.

Inputs:
- Desired monthly income
- Withdrawal period (years)
- Expected return (annual percent)

Calculation:
- Monthly rate r = expectedReturn / 100 / 12
- Total months n = years * 12
- Required corpus = income * n if r = 0
- Otherwise Required corpus = income * ( (1 - (1 + r)^(-n)) / r )

Chart:
- Remaining corpus across years.

### 12) Inflation adjusted SWP

Purpose: Find a starting SWP that grows with inflation.

Inputs:
- Retirement corpus
- Withdrawal period (years)
- Expected return (annual percent)
- Inflation rate (annual percent)

Calculation:
- Real return = (1 + expectedReturn) / (1 + inflationRate) - 1
- Convert to real monthly rate
- If real monthly rate is 0, starting SWP = corpus / totalMonths
- Otherwise starting SWP = corpus * ( realMonthlyRate / (1 - (1 + realMonthlyRate)^(-totalMonths)) )

Chart:
- Remaining corpus and annual withdrawal.

### 13) Retirement shortfall or surplus

Purpose: Compare projected corpus at retirement with corpus required to fund retirement income and planned lump sums.

Inputs:
- Current corpus
- Monthly SIP
- Years to retirement
- Desired monthly income
- Retirement duration (years)
- Expected return pre retirement (annual percent)
- Expected return post retirement (annual percent)
- Inflation rate (annual percent)
- Planned lump sum withdrawals (years from today)

Calculation stages:

1) Project corpus to retirement (pre retirement)
- Monthly rate pre = expectedReturnPre / 100 / 12
- Project corpus month by month with SIP contributions.
- Apply any planned lump sums that occur before retirement (year from today) after inflation adjustment.

2) Required corpus at retirement
- Income at retirement = desiredMonthlyIncome * (1 + inflation)^(yearsToRetirement)
- Real return post = (1 + expectedReturnPost) / (1 + inflation) - 1
- Use real return to compute PV of retirement income stream.
- Add PV of planned lump sums that occur after retirement. Each lump sum is inflated to its target year from today, then discounted back to retirement start using the post retirement return.

3) Shortfall or surplus
- Shortfall = projected corpus - required corpus

4) Cashflow timeline
- Timeline runs from today through retirement duration.
- Pre retirement years: corpus grows with monthly SIP and pre retirement return, then subtracts any planned lump sums for that year.
- Post retirement years: monthly income is withdrawn and inflated each month, corpus grows with post retirement return, then subtracts any planned lump sums for that year.

Chart:
- Remaining corpus line across the entire plan horizon.
- Annual withdrawals line across the same horizon.
- Vertical markers for retirement start and each goal withdrawal.

## Chart and UX Notes

- All charts are styled consistently with the same palette and typography.
- Each calculation reveals results in place, with a result card followed by a chart.
- The retirement chart uses a custom tooltip to highlight goal withdrawals in that year.
- The journey flow links each calculator to the next logical step.

## Data Integrity Notes

- Input values are parsed as numbers; invalid input defaults to 0.
- Calculations expect non negative values and validate basic constraints (time > 0, etc.).
- When returns are 0, formulas fall back to linear math to avoid divide by zero.
