import type { ReactNode } from "react";
import clsx from "clsx";

export function PageShell({ children, wide = false, className }: { children: ReactNode; wide?: boolean; className?: string }) {
  return <div className={clsx("page-shell", wide && "page-shell--wide", className)}>{children}</div>;
}

export function PageStack({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx("page-stack", className)}>{children}</div>;
}
