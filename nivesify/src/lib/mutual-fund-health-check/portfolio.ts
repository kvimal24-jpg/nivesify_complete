import { getLatestNav } from "./nav";
import { Transaction } from "./types";

export interface ExistingFund {
  price: number;
  units: number;
  date: Date;
  invested: number;
  currentValue: number;
  profit: number;
  gain: number;
}

export interface PortfolioRow {
  mfName: string;
  schemeCode: number;
  allTransactions: Transaction[];
  existingFunds: ExistingFund[];
  realisedProfit: number;
  latestPrice: number | null;
  currentInvested: number;
  currentUnits: number;
  currentValue: number;
  profit: number;
  color: string;
  percentage: number;
}

export type Portfolio = PortfolioRow[];

const stringToColour = (input: string) => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 50%)`;
};

const byDateAsc = (a: Transaction, b: Transaction) => new Date(a.date).getTime() - new Date(b.date).getTime();
const byTotalCostDesc = (a: { currentInvested: number }, b: { currentInvested: number }) =>
  b.currentInvested - a.currentInvested;

export const getPortfolio = async (transactions: Transaction[]): Promise<Portfolio> => {
  const ts = transactions.slice().sort(byDateAsc);
  const out: Portfolio = [];

  ts.forEach((transaction) => {
    const i = out.findIndex((o) => o.mfName === transaction.mfName);
    if (i >= 0) {
      out[i].allTransactions.push(transaction);
      if (transaction.type === "Investment") {
        out[i].existingFunds.push({
          price: transaction.price * 10000,
          units: transaction.units * 1000,
          date: new Date(transaction.date),
          invested: 0,
          currentValue: 0,
          profit: 0,
          gain: 0,
        });
      } else {
        let units = Math.round(transaction.units * 1000);

        while (units > 0) {
          if (out[i].existingFunds[0].units <= units) {
            units -= out[i].existingFunds[0].units;
            out[i].realisedProfit +=
              (transaction.price - out[i].existingFunds[0].price / 10000) *
              (out[i].existingFunds[0].units / 1000);
            out[i].existingFunds[0].units = 0;
          } else {
            out[i].existingFunds[0].units -= units;
            out[i].realisedProfit +=
              (transaction.price - out[i].existingFunds[0].price / 10000) * (units / 1000);
            units = 0;
          }
          if (out[i].existingFunds[0].units === 0) {
            out[i].existingFunds.shift();
          }
        }
      }
    } else {
      out.push({
        mfName: transaction.mfName,
        schemeCode: transaction.matchingScheme.schemeCode,
        allTransactions: [transaction],
        existingFunds: [
          {
            price: transaction.price * 10000,
            units: transaction.units * 1000,
            date: new Date(transaction.date),
            invested: 0,
            currentValue: 0,
            profit: 0,
            gain: 0,
          },
        ],
        realisedProfit: 0,
        latestPrice: null,
        currentInvested: 0,
        currentUnits: 0,
        currentValue: 0,
        profit: 0,
        color: stringToColour(transaction.mfName),
        percentage: 0,
      });
    }
  });

  for (const o of out) {
    let invested = 0;
    let units = 0;
    o.latestPrice = await getLatestNav(o.schemeCode);
    for (const ef of o.existingFunds) {
      invested += ef.units * ef.price;
      units += ef.units;
      ef.units /= 1000;
      ef.price /= 10000;
      ef.invested = ef.units * ef.price;
      ef.currentValue = o.latestPrice ? ef.units * o.latestPrice : 0;
      ef.profit = ef.currentValue - ef.invested;
      ef.gain = (ef.profit / ef.invested) * 100;
    }
    o.currentInvested = Math.round(invested / 10000000);
    o.currentUnits = units > 0.00001 ? units / 1000 : 0;
    o.currentValue = o.latestPrice ? o.currentUnits * o.latestPrice : 0;
    o.profit = o.currentValue - o.currentInvested;
  }

  let totalInvested = 0;
  for (const o of out) totalInvested += o.currentInvested;
  for (const o of out) {
    o.percentage = totalInvested > 0 ? (o.currentInvested / totalInvested) * 100 : 0;
  }

  out.sort(byTotalCostDesc);
  return out;
};

export const getSummary = (portfolio: Portfolio) => {
  const totalValue = portfolio.reduce((res, item) => res + item.currentValue, 0);
  const invested = portfolio.reduce((res, item) => res + item.currentInvested, 0);
  const currentProfit = portfolio.reduce((res, item) => res + item.profit, 0);
  const realisedProfit = portfolio.reduce((res, item) => res + item.realisedProfit, 0);
  const allTimeProfit = currentProfit + realisedProfit;
  return { totalValue, invested, allTimeProfit, currentProfit, realisedProfit };
};
