import { Transaction } from "./types";
import { getNavHistoryMap } from "./nav";

export interface LineChartData {
  name: string;
  valueOne: number;
  valueTwo: number;
  dateObj: Date;
}

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" });

const formatNavDate = (date: Date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export function getLastTwelveMonthsData(transactions: Transaction[]): { name: string; value: number }[] {
  const today = new Date();
  const last12Months = Array.from({ length: 12 }, (_value, i) => {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    return {
      month: `${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`,
      timestamp: date.getTime(),
    };
  }).reverse();

  return last12Months.map((monthData) => {
    const nextMonth = new Date(monthData.timestamp);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const monthlyTransactions = transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= new Date(monthData.timestamp) && transactionDate < nextMonth;
    });

    const total = monthlyTransactions.reduce((sum, transaction) => {
      if (transaction.type === "Investment") return sum + transaction.amount;
      return sum - transaction.amount;
    }, 0);

    return { name: monthData.month, value: total };
  });
}

export function getAllMonthsData(transactions: Transaction[]): { name: string; value: number }[] {
  if (transactions.length === 0) return [];
  const dates = transactions.map((t) => new Date(t.date));
  const firstDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const lastDate = new Date();
  const months =
    (lastDate.getFullYear() - firstDate.getFullYear()) * 12 + (lastDate.getMonth() - firstDate.getMonth()) + 1;
  const allMonths = Array.from({ length: months }, (_value, i) => {
    const date = new Date(firstDate.getFullYear(), firstDate.getMonth() + i, 1);
    return {
      month: `${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`,
      timestamp: date.getTime(),
    };
  });

  return allMonths.map((monthData) => {
    const nextMonth = new Date(monthData.timestamp);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const monthlyTransactions = transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= new Date(monthData.timestamp) && transactionDate < nextMonth;
    });

    const total = monthlyTransactions.reduce((sum, transaction) => {
      if (transaction.type === "Investment") return sum + transaction.amount;
      return sum - transaction.amount;
    }, 0);

    return { name: monthData.month, value: total };
  });
}

export function getAnnualData(transactions: Transaction[]): { name: string; value: number }[] {
  if (transactions.length === 0) return [];

  const groupedByYear = transactions.reduce((acc, transaction) => {
    const year = new Date(transaction.date).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(transaction);
    return acc;
  }, {} as Record<string, Transaction[]>);

  return Object.entries(groupedByYear)
    .map(([year, yearTransactions]) => {
      const total = yearTransactions.reduce((sum, transaction) => {
        if (transaction.type === "Investment") return sum + transaction.amount;
        return sum - transaction.amount;
      }, 0);

      return { name: year, value: total };
    })
    .sort((a, b) => Number(a.name) - Number(b.name));
}

const getNavForDate = (navSeries: Record<string, string>, date: Date) => {
  for (let back = 0; back <= 7; back += 1) {
    const probe = new Date(date);
    probe.setDate(probe.getDate() - back);
    const nav = navSeries[formatNavDate(probe)];
    if (nav) return Number(nav);
  }
  return null;
};

export const getAllTimePerformance = async (transactions: Transaction[]): Promise<LineChartData[]> => {
  if (transactions.length === 0) return [];

  const sortedTransactions = transactions
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const firstDate = new Date(sortedTransactions[0].date);
  const lastDate = new Date();

  const currentHoldings: { [key: number]: { price: number; units: number; date: Date }[] } = {};
  const currentHoldingUnits: { [key: number]: number } = {};
  const currentHoldingNav: { [key: number]: number } = {};

  let currentInvested = 0;

  const schemeCodes = Array.from(
    new Set(sortedTransactions.map((t) => t.matchingScheme?.schemeCode).filter(Boolean))
  ) as number[];

  const navMap = await getNavHistoryMap(schemeCodes);

  let transactionIndex = 0;
  const allDatesObjects: LineChartData[] = [];

  for (let d = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1); d <= lastDate; d.setMonth(d.getMonth() + 1)) {
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);

    while (transactionIndex < sortedTransactions.length && new Date(sortedTransactions[transactionIndex].date) <= monthEnd) {
      const transaction = sortedTransactions[transactionIndex];
      const schemeCode = transaction.matchingScheme.schemeCode;

      if (currentHoldings[schemeCode]) {
        if (transaction.type === "Investment") {
          currentHoldings[schemeCode].push({
            price: transaction.price * 10000,
            units: transaction.units * 1000,
            date: new Date(transaction.date),
          });
          currentInvested += transaction.price * transaction.units * 10000 * 1000;
        } else {
          let units = Math.round(transaction.units * 1000);

          while (units > 0) {
            if (currentHoldings[schemeCode][0].units <= units) {
              units -= currentHoldings[schemeCode][0].units;
              currentInvested -= currentHoldings[schemeCode][0].price * currentHoldings[schemeCode][0].units;
              currentHoldings[schemeCode][0].units = 0;
            } else {
              currentHoldings[schemeCode][0].units -= units;
              currentInvested -= units * currentHoldings[schemeCode][0].price;
              units = 0;
            }
            if (currentHoldings[schemeCode][0].units === 0) {
              currentHoldings[schemeCode].shift();
            }
          }
        }
      } else {
        currentHoldings[schemeCode] = [
          {
            price: transaction.price * 10000,
            units: transaction.units * 1000,
            date: new Date(transaction.date),
          },
        ];
        currentInvested += transaction.price * transaction.units * 10000 * 1000;
      }

      transactionIndex++;
    }

    let currentValue = 0;

    Object.keys(currentHoldings).forEach((schemeCode) => {
      const holdingUnits = currentHoldings[Number(schemeCode)].reduce((acc, holding) => acc + holding.units, 0);
      currentHoldingUnits[Number(schemeCode)] = holdingUnits / 1000;
    });

    Object.keys(currentHoldings).forEach((schemeCode) => {
      const navSeries = navMap[Number(schemeCode)];
      if (!navSeries) return;
      const nav = getNavForDate(navSeries, monthEnd);
      if (nav) {
        currentHoldingNav[Number(schemeCode)] = nav;
      }
    });

    Object.keys(currentHoldingUnits).forEach((schemeCode) => {
      const nav = currentHoldingNav[Number(schemeCode)];
      if (nav) {
        currentValue += nav * currentHoldingUnits[Number(schemeCode)];
      }
    });

    allDatesObjects.push({
      dateObj: new Date(monthEnd),
      name: formatDate(monthEnd),
      valueOne: currentInvested / 10000000,
      valueTwo: currentValue,
    });
  }

  return allDatesObjects;
};

export const getOneYearPerformance = async (transactions: Transaction[]): Promise<LineChartData[]> => {
  const allTimePerformance = await getAllTimePerformance(transactions);
  const lastYear = new Date();
  lastYear.setFullYear(lastYear.getFullYear() - 1);
  return allTimePerformance.filter((item) => item.dateObj >= lastYear);
};

export const getOneMonthPerformance = async (transactions: Transaction[]): Promise<LineChartData[]> => {
  const allTimePerformance = await getAllTimePerformance(transactions);
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  return allTimePerformance.filter((item) => item.dateObj >= lastMonth);
};
