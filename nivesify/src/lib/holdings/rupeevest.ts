export type RupeeVestScheme = {
  schemeCode: number;
  name: string;
  displayName: string;
  fundHouse: string;
};

export type HoldingAssetType = "equity" | "debt" | "cash" | "other";

export type FundHolding = {
  securityCode: string;
  securityName: string;
  percentAum: number;
  shares: number | null;
  date: string | null;
  assetType: HoldingAssetType;
};

export type PortfolioMonth = {
  label: string;
  aum: number | null;
  holdings: FundHolding[];
};

export type FundPortfolio = {
  schemeCode: number;
  fundName: string;
  classification: string | null;
  asOf: string | null;
  aum: number | null;
  months: PortfolioMonth[];
  source: "RupeeVest";
};

export type SchemeMatch = {
  scheme: RupeeVestScheme | null;
  confidence: "high" | "medium" | "low" | "none";
  score: number;
};

type UnknownRecord = Record<string, unknown>;

const PLAN_WORDS = new Set([
  "direct", "regular", "reg", "growth", "gr", "idcw", "dividend", "option",
  "bonus", "monthly", "quarterly", "annual", "payout", "reinvestment", "reinvest", "plan",
]);

const asRecord = (value: unknown): UnknownRecord =>
  value && typeof value === "object" && !Array.isArray(value) ? value as UnknownRecord : {};

const asArray = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value;
  const record = asRecord(value);
  return Object.keys(record)
    .sort((a, b) => Number(a) - Number(b))
    .map((key) => record[key]);
};

const toNumber = (value: unknown): number | null => {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
};

const toString = (value: unknown): string => typeof value === "string" ? value.trim() : "";

export function normalizeSchemeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\b(g|d)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((token) => token && !PLAN_WORDS.has(token))
    .join(" ")
    .trim();
}

export function parseSchemeSearch(payload: unknown): RupeeVestScheme[] {
  const root = asRecord(payload);
  const rows = asArray(root.search_data);
  return rows.flatMap((value) => {
    const row = asRecord(value);
    const schemeCode = toNumber(row.schemecode);
    const name = toString(row.s_name);
    if (schemeCode === null || !name) return [];
    return [{
      schemeCode,
      name,
      displayName: toString(row.s_name1) || name,
      fundHouse: toString(row["REPLACE (sr.fund_house,'-',' ')"]) || "Unknown fund house",
    }];
  });
}

function tokenScore(left: string, right: string) {
  const a = new Set(normalizeSchemeName(left).split(" ").filter(Boolean));
  const b = new Set(normalizeSchemeName(right).split(" ").filter(Boolean));
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter((token) => b.has(token)).length;
  const union = new Set([...a, ...b]).size;
  return intersection / union;
}

export function matchSchemeByName(name: string, schemes: RupeeVestScheme[], fundHouse?: string): SchemeMatch {
  const normalized = normalizeSchemeName(name);
  const normalizedHouse = normalizeSchemeName(fundHouse ?? "");
  let best: RupeeVestScheme | null = null;
  let bestScore = 0;

  for (const scheme of schemes) {
    const candidate = normalizeSchemeName(scheme.name);
    let score = candidate === normalized ? 1 : tokenScore(name, scheme.name);
    if (normalizedHouse && normalizeSchemeName(scheme.fundHouse).includes(normalizedHouse)) score += 0.08;
    if (score > bestScore) {
      best = scheme;
      bestScore = score;
    }
  }

  const capped = Math.min(1, bestScore);
  return {
    scheme: best,
    score: capped,
    confidence: !best || capped < 0.45 ? "none" : capped >= 0.88 ? "high" : capped >= 0.68 ? "medium" : "low",
  };
}

const ASSET_SOURCES: Array<{
  type: HoldingAssetType;
  dataKey: string;
  mappingKey: string;
}> = [
  { type: "equity", dataKey: "stock_data", mappingKey: "stock_mapping" },
  { type: "debt", dataKey: "stock_data_debt", mappingKey: "stock_mapping_debt" },
  { type: "cash", dataKey: "stock_data_cash", mappingKey: "stock_mapping_cash" },
  { type: "other", dataKey: "stock_data_misc", mappingKey: "stock_mapping_misc" },
];

export function parsePortfolio(payload: unknown, schemeCode: number): FundPortfolio {
  const root = asRecord(payload);
  const fundInfo = asRecord(asArray(root.fund_info)[0]);
  const labels = asArray(root.month_name).map(toString);
  const monthAum = asArray(root.MonthwiseAUM).map((value) => toNumber(asRecord(value).aum));
  const monthCount = Math.max(labels.length, ...ASSET_SOURCES.map((source) => asArray(root[source.dataKey]).length), 0);

  const months: PortfolioMonth[] = Array.from({ length: monthCount }, (_, monthIndex) => {
    const holdings: FundHolding[] = [];
    for (const source of ASSET_SOURCES) {
      const mapping = asRecord(root[source.mappingKey]);
      const monthRows = asArray(asArray(root[source.dataKey])[monthIndex]);
      for (const value of monthRows) {
        const row = asRecord(value);
        const rawCode = row.fincode ?? row.security_code ?? row.code;
        const securityCode = String(rawCode ?? "").trim();
        const percentAum = toNumber(row.percent_aum);
        if (!securityCode || percentAum === null) continue;
        holdings.push({
          securityCode,
          securityName: toString(mapping[securityCode]) || `Security ${securityCode}`,
          percentAum,
          shares: toNumber(row.noshares),
          date: toString(row.invdate) || null,
          assetType: source.type,
        });
      }
    }
    return {
      label: labels[monthIndex] || `Month ${monthIndex + 1}`,
      aum: monthAum[monthIndex] ?? null,
      holdings: holdings.sort((a, b) => b.percentAum - a.percentAum),
    };
  });

  return {
    schemeCode,
    fundName: toString(fundInfo.s_name) || `Scheme ${schemeCode}`,
    classification: toString(fundInfo.classification) || null,
    asOf: toString(fundInfo.aumdate) || months[0]?.holdings[0]?.date || null,
    aum: toNumber(fundInfo.aumtotal) ?? months[0]?.aum ?? null,
    months,
    source: "RupeeVest",
  };
}

export function portfolioAllocation(holdings: FundHolding[]) {
  return holdings.reduce<Record<HoldingAssetType, number>>(
    (totals, holding) => {
      totals[holding.assetType] += holding.percentAum;
      return totals;
    },
    { equity: 0, debt: 0, cash: 0, other: 0 },
  );
}

export function calculateOverlap(left: FundHolding[], right: FundHolding[]) {
  const rightWeights = new Map(
    right.filter((holding) => holding.percentAum > 0).map((holding) => [holding.securityName.toLowerCase(), holding.percentAum]),
  );
  const common = left.filter(
    (holding) => holding.percentAum > 0 && rightWeights.has(holding.securityName.toLowerCase()),
  );
  const overlap = common.reduce(
    (total, holding) => total + Math.min(holding.percentAum, rightWeights.get(holding.securityName.toLowerCase()) ?? 0),
    0,
  );
  return { overlap, commonCount: common.length };
}
