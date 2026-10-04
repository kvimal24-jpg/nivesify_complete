import type { ReactNode } from "react";
import { Database, LoaderCircle } from "lucide-react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div>
        <span className="empty-state__icon"><Database size={22} aria-hidden="true" /></span>
        <h3>{title}</h3>
        <p>{description}</p>
        {action && <div className="button-row" style={{ justifyContent: "center" }}>{action}</div>}
      </div>
    </div>
  );
}

export function LoadingState({ label = "Loading data" }: { label?: string }) {
  return (
    <div className="empty-state" role="status" aria-live="polite">
      <div>
        <span className="empty-state__icon"><LoaderCircle size={22} aria-hidden="true" /></span>
        <h3>{label}</h3>
        <p>The latest dataset is being prepared in your browser.</p>
        <span className="sr-only">Please wait</span>
      </div>
    </div>
  );
}
