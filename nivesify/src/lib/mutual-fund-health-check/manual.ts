import type { MatchingScheme, Transaction } from "./types";

export type ManualInvestment = {
  id: string;
  schemeCode: number;
  schemeName: string;
  date: string;
  amount: number;
};

export type SipPlan = {
  id: string;
  schemeCode: number;
  schemeName: string;
  startDate: string;
  endDate?: string;
  monthlyAmount: number;
};

const formatNavDate = (date: Date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export const getNavForDate = (navSeries: Record<string, string>, date: Date) => {
  for (let back = 0; back <= 7; back += 1) {
    const probe = new Date(date);
    probe.setDate(probe.getDate() - back);
    const nav = navSeries[formatNavDate(probe)];
    if (nav) return Number(nav);
  }
  return null;
};

const buildMatchingScheme = (schemeCode: number, schemeName: string, scheme?: Partial<MatchingScheme>): MatchingScheme => ({
  schemeCode,
  schemeName: schemeName || scheme?.schemeName || "",
  isinGrowth: scheme?.isinGrowth || "",
  isinDivReinvestment: scheme?.isinDivReinvestment ?? null,
  schemeType: scheme?.schemeType,
  schemeCategory: scheme?.schemeCategory,
  amc: scheme?.amc,
});

const buildManualTransaction = (
  base: {
    schemeCode: number;
    schemeName: string;
    amount: number;
    date: Date;
    source: string;
    scheme?: Partial<MatchingScheme>;
  },
  navMap: Record<number, Record<string, string>>
): Transaction | null => {
  const navSeries = navMap[base.schemeCode];
  if (!navSeries) return null;
  const price = getNavForDate(navSeries, base.date);
  if (!price || price <= 0) return null;

  const units = base.amount / price;
  return {
    mfNameFull: base.schemeName,
    isin: base.scheme?.isinGrowth || "",
    matchingScheme: buildMatchingScheme(base.schemeCode, base.schemeName, base.scheme),
    mfName: base.schemeName,
    folio: base.source,
    date: base.date.toISOString(),
    amount: base.amount,
    type: "Investment",
    price,
    units,
    content: base.source,
    key: Number(`${base.schemeCode}${base.date.getTime()}`.slice(0, 12)),
  };
};

export const buildManualTransactions = (
  manualInvestments: ManualInvestment[],
  sipPlans: SipPlan[],
  navMap: Record<number, Record<string, string>>,
  schemeLookup?: Map<number, Partial<MatchingScheme>>
) => {
  const results: Transaction[] = [];
  manualInvestments.forEach((item) => {
    const date = new Date(item.date);
    if (!Number.isFinite(item.amount) || item.amount <= 0 || Number.isNaN(date.getTime())) return;
    const scheme = schemeLookup?.get(item.schemeCode);
    const txn = buildManualTransaction(
      {
        schemeCode: item.schemeCode,
        schemeName: item.schemeName || scheme?.schemeName || "",
        amount: item.amount,
        date,
        source: "Manual",
        scheme,
      },
      navMap
    );
    if (txn) results.push(txn);
  });

  sipPlans.forEach((plan) => {
    const start = new Date(plan.startDate);
    if (!Number.isFinite(plan.monthlyAmount) || plan.monthlyAmount <= 0 || Number.isNaN(start.getTime())) return;
    const end = plan.endDate ? new Date(plan.endDate) : new Date();
    const scheme = schemeLookup?.get(plan.schemeCode);
    const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());

    while (cursor <= end) {
      const txn = buildManualTransaction(
        {
          schemeCode: plan.schemeCode,
          schemeName: plan.schemeName || scheme?.schemeName || "",
          amount: plan.monthlyAmount,
          date: new Date(cursor),
          source: "SIP",
          scheme,
        },
        navMap
      );
      if (txn) results.push(txn);
      cursor.setMonth(cursor.getMonth() + 1);
    }
  });

  return results;
};
