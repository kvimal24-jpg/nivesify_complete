export interface Cashflow {
  amount: number;
  date: Date;
}

export function buildCashflows(
  transactions: { amount: number; date: Date; type: "buy" | "sell" }[],
  currentValue: number,
  currentDate: Date,
  isComplete: boolean
): Cashflow[] {
  const cashflows: Cashflow[] = transactions.map((txn) => ({
    amount: txn.type === "buy" ? -Math.abs(txn.amount) : Math.abs(txn.amount),
    date: new Date(txn.date),
  }));

  if (isComplete && currentValue !== 0) {
    cashflows.push({ amount: currentValue, date: currentDate });
  }

  return cashflows;
}
