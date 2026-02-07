export function xirr(cashflows: { amount: number; date: Date }[], guess = 0.1): number | null {
  if (cashflows.length < 2) return null;
  const maxIter = 100;
  const tol = 1e-6;
  const days = (d1: Date, d2: Date) => (d1.getTime() - d2.getTime()) / (1000 * 3600 * 24);
  const d0 = cashflows[0].date;

  function f(rate: number) {
    return cashflows.reduce(
      (sum, cf) => sum + cf.amount / Math.pow(1 + rate, days(cf.date, d0) / 365),
      0
    );
  }

  function df(rate: number) {
    return cashflows.reduce(
      (sum, cf) =>
        sum -
        (cf.amount * (days(cf.date, d0) / 365)) /
          Math.pow(1 + rate, days(cf.date, d0) / 365 + 1),
      0
    );
  }

  let rate = guess;
  for (let i = 0; i < maxIter; i++) {
    const y = f(rate);
    const y1 = df(rate);
    if (Math.abs(y1) < 1e-10) break;
    const newRate = rate - y / y1;
    if (Math.abs(newRate - rate) < tol) return newRate;
    rate = newRate;
  }

  return null;
}
