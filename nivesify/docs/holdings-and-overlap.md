# Mutual fund holdings and overlap

## Purpose

The holdings workspace lets a user search a mutual fund, inspect its latest disclosed securities, compare up to three funds, and measure weighted portfolio overlap. The authenticated portfolio page also expands the user&apos;s held funds into company-level exposure.

## Data source and routes

Holdings are read from RupeeVest&apos;s public portfolio-tracker endpoints for this personal-use project:

- `GET https://www.rupeevest.com/home/get_search_data`
- `GET https://www.rupeevest.com/home/get_mf_portfolio_tracker?schemecode=<id>`

Nivesify does not call those endpoints directly from the browser. Three server routes validate inputs, normalize upstream responses, and add cache headers:

- `/api/holdings/search?q=<name>` returns at most 24 token-matched schemes.
- `/api/holdings/match?name=<name>&fundHouse=<optional>` returns the best scheme plus a confidence score.
- `/api/holdings/portfolio?schemecode=<id>` returns four normalized monthly disclosures.

The upstream `schemecode` is retained as the canonical identity. Fund names are normalized only when linking an AMFI/CAS name to that provider code. Regular/direct, growth, dividend, and IDCW suffixes are ignored during matching. Low-confidence and unmatched funds remain visible in the confidence table and are excluded from portfolio look-through calculations.

## Normalized model

`src/lib/holdings/rupeevest.ts` merges equity, debt, cash, and miscellaneous payloads into:

- a fund identity and classification;
- disclosure month and AUM;
- security code, security name, asset type, shares, date, and percentage of AUM.

The adapter intentionally tolerates object-indexed and array-indexed upstream structures.

## Calculations

Weighted overlap between two funds is the sum of the smaller positive weight for every shared security. Negative derivative or cash offsets are excluded.

Portfolio company exposure is:

`fund current value / total portfolio value × security weight inside fund`

The displayed disclosure-coverage metric is the percentage of the user&apos;s current portfolio value represented by successfully matched provider portfolios.

## Privacy and persistence

CAS parsing and portfolio calculations remain client-side. The matching endpoint receives a fund name but sends no user identity or portfolio values to RupeeVest; it fetches the generic scheme directory and performs matching inside Nivesify. The optional holdings watchlist is stored only in browser `localStorage` under `nivesify-fund-watchlist`.

## Limitations

- Disclosures can lag an AMC factsheet.
- Renamed or merged schemes may require manual verification.
- Company names may vary after corporate actions.
- This is portfolio transparency, not investment advice.
