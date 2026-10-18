"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Why Mutual Fund", href: "/why-mutual-fund" },
  { label: "Smart Fund Finder", href: "/mutual-fund-match" },
  { label: "MF Industry Analysis", href: "/mutual-fund-analysis" },
  { label: "Active Funds", href: "/active-funds" },
  { label: "Passive Funds", href: "/index-funds" },
];

export default function AnalysisTabs() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-3">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2 rounded-full text-xs md:text-sm font-serif transition-all ${
              isActive
                ? "bg-[#2F5D7C] !text-white ring-2 ring-[#2F5D7C]/60 shadow-[0_10px_25px_-15px_rgba(47,93,124,0.5)]"
                : "bg-white text-[#1F2937] border border-[#4A5D4E]/20"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
