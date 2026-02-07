export const formatCurrency = (value: number) => {
  const safeValue = Number.isFinite(value) ? value : 0;
  if (safeValue >= 1e7) return `₹${(safeValue / 1e7).toFixed(2)} Cr`;
  if (safeValue >= 1e5) return `₹${(safeValue / 1e5).toFixed(2)} L`;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(safeValue);
};
