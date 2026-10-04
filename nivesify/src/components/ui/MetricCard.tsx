import type { ReactNode } from "react";
import clsx from "clsx";

export function MetricCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "neutral" | "positive" | "warning";
}) {
  return (
    <div className={clsx("metric-card", tone !== "neutral" && `metric-card--${tone}`)}>
      <span className="metric-card__label">{label}</span>
      <strong className="metric-card__value">{value}</strong>
      {hint && <span className="metric-card__hint">{hint}</span>}
    </div>
  );
}
