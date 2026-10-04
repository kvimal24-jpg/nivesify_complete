import type { ReactNode } from "react";

export function PageHero({
  eyebrow,
  title,
  description,
  actions,
  aside,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <header className="page-hero">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="page-title">{title}</h1>
        {description && <div className="lede">{description}</div>}
        {actions && <div className="hero-actions">{actions}</div>}
      </div>
      {aside && <aside>{aside}</aside>}
    </header>
  );
}
