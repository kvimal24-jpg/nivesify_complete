# BUILD THE FUND SELECTION GRID
## Systematic, Data-Driven Fund Recommendation Matrix

---

## 🎯 WHAT WE'RE BUILDING

A 4×4 visual grid showing the single best mutual fund for each combination of:
- **Investment Style** (Value, Growth, Momentum, Active Management)
- **Company Size** (Large Cap, Mid Cap, Small Cap, Flexi/Multi Cap)

This grid is UNIVERSAL - same for all users, based purely on performance data.

---

## 📁 DATA SOURCES (R2 Bucket - MUST USE THESE)

**Folder**: `mf-data-bucket/data/latest/`

**Files to use**:
1. **`amfi_raw.json`** - Complete fund universe with all return data
2. **`fund-analytics.json`** - Active fund performance metrics and composite scores
3. **`etf-analytics.json`** - ETF/Index fund metrics and expense ratios
4. **`industry-and-category-insights.json`** - Category-level alpha, beat rates, AUM
5. **`manifest.json`** - Metadata (optional, for data freshness info)

**CRITICAL**: Use ONLY real data from these files. No placeholders, no made-up fund names, no example numbers.

---

## 📋 STEP 1: LOAD AND GROUP ALL FUNDS
### Scan the entire fund universe

Load `amfi_raw.json` and create groups by Sub_Category:

```javascript
const funds = loadJSON('mf-data-bucket/data/latest/amfi_raw.json');

const subcategoryGroups = {};

funds.forEach(fund => {
  const subcat = fund.Sub_Category;
  if (!subcategoryGroups[subcat]) {
    subcategoryGroups[subcat] = [];
  }
  subcategoryGroups[subcat].push(fund);
});

// Result: Groups like "Large Cap", "Mid Cap", "Value", "Contra", "Index / ETF", etc.
```

**Don't filter anything yet**. Keep all sub-categories for now.

---

## 🎨 STEP 2: CLASSIFY EACH SUB-CATEGORY INTO GRID
### Determine which box each sub-category belongs to

For each sub-category, determine its grid position using a **2-step process**:

### 2A: DETECT INVESTMENT STYLE (Which Column) - DO THIS FIRST

**Column 1: Value/Contra**
- Sub-category name contains: "value", "contra", "dividend"
- Examples:
  - Sub_Category = "Value" → Column 1
  - Sub_Category = "Contra" → Column 1  
  - Sub_Category = "Dividend Yield" → Column 1

**Column 2: Growth/Core (Default for Index Funds)**
- Sub_Category = "Index / ETF" AND no style keywords in benchmark/name
- Examples:
  - Index fund tracking "Nifty 50 TRI" → Column 2
  - Index fund tracking "Nifty Midcap 150 TRI" → Column 2

**Column 3: Momentum**
- Scheme name OR benchmark contains: "momentum", "alpha"
- Examples:
  - schemeName contains "Momentum 50" → Column 3
  - benchmark = "Nifty Midcap150 Momentum 50 TRI" → Column 3

**Column 4: Pure Active**
- Sub_Category is size-based: "Large Cap", "Mid Cap", "Small Cap", "Flexi Cap", "Multi Cap", "Large & Mid Cap"
- AND does NOT have style keywords (value/momentum)
- Examples:
  - Sub_Category = "Large Cap" (plain, no style) → Column 4
  - Sub_Category = "Flexi Cap" (no special strategy) → Column 4

### 2B: DETECT COMPANY SIZE (Which Row) - DO THIS SECOND

**Priority for detection**: Benchmark → Sub_Category → Scheme Name

**Row 1: Large Cap**
- benchmark contains: "Nifty 50", "Sensex", "Nifty 100", "BSE 100"
- OR Sub_Category = "Large Cap"

**Row 2: Mid Cap**
- benchmark contains: "Midcap 150", "Midcap 100", "Nifty Midcap"
- OR Sub_Category = "Mid Cap"

**Row 3: Small Cap**
- benchmark contains: "Smallcap 250", "Smallcap 100", "Nifty Smallcap"
- OR Sub_Category = "Small Cap"

**Row 4: Flexi/Multi Cap**
- benchmark contains: "Nifty 500"
- OR Sub_Category = "Flexi Cap" OR "Multi Cap" OR "ELSS"

### Example: "Nifty 500 Value 20" Classification
```
Fund with benchmark = "Nifty 500 Value 20 TRI"

Step 2A (Style):
  - Contains "Value" → Column 1 (Value/Contra)

Step 2B (Size):  
  - Contains "Nifty 500" → Row 4 (Flexi/Multi)

Final Position: Row 4, Column 1
```

### EXCLUSIONS (Remove These Completely)

**Do NOT include**:
- Sub_Category = "Sectoral / Thematic" (too specialized)
- Any "Hybrid", "Balanced", "Debt", "Liquid", "Bond", "Gilt", "FMP" (not equity)
- "FoFs (Overseas)" (international funds)
- "Arbitrage", "Equity Savings" (special strategies)

---

## 🏆 STEP 3: PICK THE WINNER FOR EACH BOX
### When multiple sub-categories compete for same grid position

Some boxes will have multiple sub-categories. Example:

**Box: Large Cap × Value/Contra (Row 1, Column 1)**
- Could have: "Value" sub-category, "Contra" sub-category, "Dividend Yield" sub-category

### 3A: SELECT BEST SUB-CATEGORY (CORRECTED LOGIC)

**Use the longest timeframe where MOST funds have data, then compare average alpha.**

```javascript
function selectBestSubcategory(competingSubcategories) {
  
  // Load category-level insights
  const insights = loadJSON('mf-data-bucket/data/latest/industry-and-category-insights.json');
  
  const results = [];
  
  for (const subcat of competingSubcategories) {
    const insight = insights.find(i => i.sub_category === subcat.name);
    
    if (!insight) continue;
    
    // Find longest timeframe with data
    let alpha = null;
    let timeframe = null;
    let beatRate = null;
    
    // Check in priority order (longest first)
    if (insight.avg_alpha_10y !== null && insight.funds_with_10y_data >= 3) {
      alpha = insight.avg_alpha_10y;
      timeframe = '10-year';
      beatRate = insight.beat_rate_10y;
    } else if (insight.avg_alpha_5y !== null && insight.funds_with_5y_data >= 5) {
      alpha = insight.avg_alpha_5y;
      timeframe = '5-year';
      beatRate = insight.beat_rate_5y;
    } else if (insight.avg_alpha_3y !== null && insight.funds_with_3y_data >= 5) {
      alpha = insight.avg_alpha_3y;
      timeframe = '3-year';
      beatRate = insight.beat_rate_3y;
    } else {
      // Not enough data, skip this sub-category
      continue;
    }
    
    results.push({
      subcategory: subcat.name,
      alpha,
      timeframe,
      beatRate,
      fundCount: subcat.funds.length,
      score: alpha * 0.7 + beatRate * 0.3  // Weighted score
    });
  }
  
  // Pick highest score
  results.sort((a, b) => b.score - a.score);
  return results[0];
}
```

**Key points**:
- Use `industry-and-category-insights.json` for category-level alpha (NOT individual fund alpha)
- Prefer longer timeframes (10Y > 5Y > 3Y)
- Need minimum fund count with data (avoid single-fund categories)
- Weight: 70% alpha + 30% beat rate

**Example**:
```
Large Cap × Value box competitors:

"Value" sub-category:
  - avg_alpha_5y: 3.01%
  - beat_rate_5y: 89.5%
  - funds_with_5y_data: 18
  - Score: (3.01 × 0.7) + (89.5 × 0.3) = 2.11 + 26.85 = 28.96

"Contra" sub-category:
  - avg_alpha_5y: 4.38%
  - beat_rate_5y: 100%
  - funds_with_5y_data: 3
  - Score: (4.38 × 0.7) + (100 × 0.3) = 3.07 + 30 = 33.07 ← WINNER

Winner: "Contra" (higher alpha + perfect beat rate)
```

### 3B: ACTIVE VS INDEX DECISION (FOR WINNING SUB-CATEGORY)

Now that we know which sub-category won, decide: Active fund or Index/ETF?

```javascript
function decideActiveOrIndex(winningSubcategory) {
  const insight = insights.find(i => i.sub_category === winningSubcategory);
  
  // Use the same timeframe we used for selection
  const alpha = insight.avg_alpha_5y; // or whichever timeframe was used
  const beatRate = insight.beat_rate_5y;
  
  // Decision thresholds
  if (alpha > 0.5 && beatRate > 50) {
    return 'ACTIVE';
  } else {
    return 'INDEX';
  }
}
```

**If ACTIVE is selected**:
- Load `fund-analytics.json`
- Filter to funds in winning sub-category
- Pick fund with **highest composite_score**
- Composite score already calculated on Active Funds page

**If INDEX is selected**:
- Load `etf-analytics.json`
- Filter to ETFs matching this box's size benchmark
- Pick ETF with **lowest expense_ratio**
- If tied, pick highest AUM

---

## 📊 STEP 4: BUILD COMPLETE AUDIT TRAIL
### Every decision must be traceable via ℹ️ icon

For each box, store:

```javascript
{
  // Grid position
  position: {
    row: 0,
    col: 0,
    label: "Large Cap × Value/Contra"
  },
  
  // SECTION 1: Classification Process
  classification: {
    heading: "How we identified this category",
    
    styleDetection: {
      result: "Value/Contra",
      reason: "Sub-category name contains 'contra'",
      checkedFields: ["Sub_Category", "schemeName", "benchmark"]
    },
    
    sizeDetection: {
      result: "Large Cap",
      reason: "Benchmark is 'Nifty 100 TRI'",
      priority: "Checked benchmark field first (highest priority)"
    }
  },
  
  // SECTION 2: Sub-category Competition
  subcategorySelection: {
    heading: "Which sub-category won this position",
    
    candidates: [
      {
        name: "Contra",
        fundCount: 3,
        timeframeUsed: "5-year",
        avgAlpha: 4.38,
        beatRate: 100.0,
        score: 33.07,
        winner: true
      },
      {
        name: "Value",
        fundCount: 21,
        timeframeUsed: "5-year",
        avgAlpha: 3.01,
        beatRate: 89.5,
        score: 28.96,
        winner: false
      }
    ],
    
    winnerExplanation: "Contra funds have higher alpha (4.38% vs 3.01%) and perfect beat rate (100%). Score: 33.07 vs 28.96",
    
    scoringFormula: "Score = (Alpha × 70%) + (Beat Rate × 30%)"
  },
  
  // SECTION 3: Active vs Index Decision
  activeVsIndexDecision: {
    heading: "Should we use active funds or index funds?",
    
    metrics: {
      avgAlpha: 4.38,
      beatRate: 100.0,
      fundsAnalyzed: 3,
      timeframe: "5-year"
    },
    
    decision: "ACTIVE",
    reasoning: "Active fund managers are crushing it with 4.4% alpha and 100% beat rate. Well worth the higher fees.",
    
    threshold: "Alpha > 0.5% ✓ | Beat Rate > 50% ✓",
    
    alternativeConsidered: "No matching index fund exists for 'Contra' strategy"
  },
  
  // SECTION 4: Final Fund Selection
  fundSelection: {
    heading: "The winning fund",
    
    selectedFund: {
      name: "SBI Contra Fund - Direct Plan",
      compositeScore: 87.5,
      return5Year: 15.8,
      alpha5Year: 3.2,
      aum: 6500,
      expenseRatio: 0.82
    },
    
    howSelected: "Picked from fund-analytics.json using highest composite_score",
    
    compositeScoreBreakdown: {
      explanation: "Composite score weighs: Returns (40%), Risk-adjusted returns (30%), Consistency (20%), AUM (10%)",
      
      components: {
        returns: "35.0 / 40 (excellent 5Y returns)",
        riskAdjusted: "26.5 / 30 (strong Sharpe ratio)",
        consistency: "18.0 / 20 (beats benchmark 90%+ of time)",
        aum: "8.0 / 10 (₹6,500 Cr - substantial size)"
      }
    },
    
    topAlternatives: [
      {
        name: "Invesco India Contra Fund - Direct",
        compositeScore: 85.2,
        reason: "Also excellent, slightly lower consistency"
      }
    ]
  },
  
  // SECTION 5: Data Transparency
  dataSource: {
    heading: "Where this data comes from",
    
    files: [
      "industry-and-category-insights.json (category alpha & beat rates)",
      "fund-analytics.json (composite scores for active funds)",
      "amfi_raw.json (fund universe and returns)"
    ],
    
    fundsAnalyzed: 3,
    lastUpdated: "Latest data from R2 bucket",
    folder: "mf-data-bucket/data/latest/"
  }
}
```

**Display this in a clean modal when user clicks the ℹ️ icon.**

Use clear section headings so users can understand the process.

---

## 🎨 STEP 5: VISUAL DISPLAY
### What users see on the grid

**Filled Box**:
```
┌─────────────────────────────┐
│ 🎯 Active Pick        [ℹ️]  │ ← Badge + Audit icon (clickable)
│                             │
│ SBI Contra Fund            │ ← Real fund name from data
│ Direct Plan                │
│                             │
│ 3 funds reviewed           │ ← Actual count from data
│ 5Y Alpha: 4.4%             │ ← Real alpha from insights
│ Beat Rate: 100%            │ ← Real beat rate
│ Composite: 87.5            │ ← Real score from analytics
│                             │
│ 📊 Full breakdown →        │ ← Opens audit modal
└─────────────────────────────┘
```

**Empty Box**:
```
┌─────────────────────────────┐
│                        [ℹ️] │ ← Still has audit (explains why empty)
│                             │
│   No funds match           │
│   this combination         │
│                             │
│ Small Cap × Momentum       │ ← Show which box this is
│                             │
│ 0 funds found in R2 data   │
└─────────────────────────────┘
```

---

## ✅ VALIDATION CHECKLIST
### Verify before showing to users

**Data Integrity**:
- [ ] All fund names exactly from R2 files (no typos, no placeholders)
- [ ] All numbers from R2 files (no hardcoded values)
- [ ] File paths reference: `mf-data-bucket/data/latest/`
- [ ] Using: amfi_raw.json, fund-analytics.json, etf-analytics.json, industry-and-category-insights.json

**Classification Logic**:
- [ ] Style detected BEFORE size (correct order)
- [ ] "Nifty 500 Value 20" goes to Row 4, Column 1 (Flexi × Value)
- [ ] Sectoral/Thematic/Hybrid funds excluded
- [ ] International funds excluded

**Winner Selection**:
- [ ] Using category-level insights (not individual fund alpha)
- [ ] Preferring longest timeframe with sufficient data
- [ ] Score = (Alpha × 70%) + (Beat Rate × 30%)
- [ ] Minimum fund count requirement checked

**Active vs Index**:
- [ ] Decision based on alpha > 0.5% and beat rate > 50%
- [ ] Active funds picked by composite_score from fund-analytics.json
- [ ] Index funds picked by lowest expense_ratio from etf-analytics.json

**Audit Trail**:
- [ ] Every box has ℹ️ icon (even empty boxes)
- [ ] Audit has 5 clear sections with headings
- [ ] Shows all competitors and why winner won
- [ ] Shows composite score breakdown
- [ ] References exact R2 file names

**Visual Quality**:
- [ ] All 16 boxes visible (4 rows × 4 columns)
- [ ] Column headers: Value, Growth, Momentum, Pure Active
- [ ] Row headers: Large Cap, Mid Cap, Small Cap, Flexi/Multi Cap
- [ ] Active funds: Green badge 🎯
- [ ] Index funds: Blue badge 📊
- [ ] Empty boxes: Gray with explanation

---

## 📝 SUCCESS EXAMPLE
### Real-world box using actual R2 data

**Box: Large Cap × Value/Contra (Row 1, Column 1)**

When user clicks ℹ️, they see:

### 1. How we identified this category
- **Style**: Value/Contra (Sub-category = "Contra")
- **Size**: Large Cap (Benchmark = "Nifty 100 TRI")

### 2. Which sub-category won this position
Candidates:
- **Contra**: 5Y alpha 4.38%, beat rate 100%, score 33.07 ✓ WINNER
- Value: 5Y alpha 3.01%, beat rate 89.5%, score 28.96

Winner explanation: Contra funds have superior alpha and perfect beat rate.

### 3. Active vs Index decision
- Alpha: 4.38% (well above 0.5% threshold ✓)
- Beat Rate: 100% (above 50% threshold ✓)
- **Decision: ACTIVE FUND** - Managers adding real value

### 4. The winning fund
**SBI Contra Fund - Direct Plan**
- Composite Score: 87.5 (highest in category)
- 5Y Return: 15.8% | Alpha: 3.2%
- AUM: ₹6,500 Cr | Expense: 0.82%

### 5. Data source
Files: industry-and-category-insights.json, fund-analytics.json, amfi_raw.json
Folder: mf-data-bucket/data/latest/

---

Build this grid following these steps exactly. Use real R2 data. Make every decision auditable. This is people's money - get it right.