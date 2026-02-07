import { Transaction } from "./types";
import { navHistoryDB } from "./nav-db";

interface NavResponse {
  meta: {
    scheme_code: number;
    scheme_name: string;
  };
  data: Array<{
    date: string;
    nav: string;
  }>;
}

const shouldRefetch = (timestamp: number): boolean => {
  const lastFetchDate = new Date(timestamp);
  const currentDate = new Date();
  if (lastFetchDate.toDateString() === currentDate.toDateString()) return false;
  return currentDate.getHours() >= 1;
};

const fetchNavForScheme = async (schemeCode: number): Promise<NavResponse | null> => {
  try {
    const response = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
    const navData: NavResponse = await response.json();
    await navHistoryDB.set(schemeCode, navData);
    return navData;
  } catch {
    return null;
  }
};

export const fetchNavHistory = async (
  transactions: Transaction[],
  options: { force?: boolean; concurrency?: number } = {}
) => {
  const uniqueSchemeCodes = Array.from(
    new Set(
      transactions
        .map((t) => t.matchingScheme?.schemeCode)
        .filter((code): code is number => Boolean(code))
    )
  );

  const force = options.force ?? false;
  const concurrency = options.concurrency ?? 4;
  const queue = [...uniqueSchemeCodes];
  const missing: number[] = [];

  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length) {
      const schemeCode = queue.shift();
      if (schemeCode === undefined) break;
      const cached = await navHistoryDB.get(schemeCode);
      const shouldUpdate = force || !cached?.timestamp || shouldRefetch(cached.timestamp);
      if (!shouldUpdate) continue;

      const navData = await fetchNavForScheme(schemeCode);
      if (!navData) missing.push(schemeCode);
    }
  });

  await Promise.all(workers);
  return { missing };
};

export const getNavHistoryMap = async (schemeCodes: number[]) => {
  const map: Record<number, Record<string, string>> = {};
  const cachedList = await navHistoryDB.getAll();
  const allow = new Set(schemeCodes);
  cachedList.forEach((cached) => {
    const schemeCode = cached.data.meta.scheme_code;
    if (!allow.has(schemeCode)) return;
    map[schemeCode] = cached.data.data.reduce((acc, nav) => {
      acc[nav.date] = nav.nav;
      return acc;
    }, {} as Record<string, string>);
  });
  return map;
};

export const getLatestNav = async (schemeCode: number): Promise<number | null> => {
  const cached = await navHistoryDB.get(schemeCode);
  if (cached?.data?.data?.length) {
    return Number(cached.data.data[0].nav);
  }
  const fetched = await fetchNavForScheme(schemeCode);
  if (!fetched?.data?.length) return null;
  return Number(fetched.data[0].nav);
};
