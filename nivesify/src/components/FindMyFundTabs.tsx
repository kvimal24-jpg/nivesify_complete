"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Smart Fund Engine", href: "/mutual-fund-match" },
  { label: "Quick Fund Picks", href: "/find-my-fund-quick-picks" },
  { label: "Lifetime Wealth Plan", href: "/find-my-fund-lifetime-plan" },
];

export default function FindMyFundTabs() {
  const pathname = usePathname();

  return (
    <div className="flex gap-2 overflow-x-auto border-b border-[#E7EDF7] pb-3 mb-8">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-serif transition-all ${
            pathname === tab.href
              ? "bg-[#2563EB] text-white"
              : "bg-white text-[#2563EB] border border-[#2563EB]/20"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
