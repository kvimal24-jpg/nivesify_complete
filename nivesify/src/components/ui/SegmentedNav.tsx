"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type SegmentedNavItem = { label: string; href: string };

export function SegmentedNav({ items, label = "Section navigation" }: { items: SegmentedNavItem[]; label?: string }) {
  const pathname = usePathname();
  return (
    <nav className="segmented-nav" aria-label={label}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          prefetch={false}
          className={pathname === item.href ? "is-active" : undefined}
          aria-current={pathname === item.href ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
