export interface InvestmentsData {
  meta: Meta;
  holder: Holder;
  summary: Summary;
  transactions?: Transaction[];
  transactionsCount?: number;
  nominees?: Record<string, boolean>;
}

export interface Meta {
  exportedAt: string;
  from: string;
  to: string;
}

export interface Holder {
  name: string;
  email: string;
  mobile: string;
  address: string;
  pan?: string;
}

export interface Summary {
  invested: number;
  currentValue: number;
  mutualFunds?: Array<{ fundHouse: string; invested: number; currentValue: number }>;
}

export interface Transaction {
  mfNameFull: string;
  isin: string;
  matchingScheme: MatchingScheme;
  mfName: string;
  folio: string;
  date: string;
  amount: number;
  type: "Investment" | "Redemption";
  price: number;
  units: number;
  content: string;
  key: number;
}

export interface MatchingScheme {
  schemeCode: number;
  schemeName: string;
  isinGrowth: string;
  isinDivReinvestment: unknown;
  schemeType?: string;
  schemeCategory?: string;
  amc?: string;
}
