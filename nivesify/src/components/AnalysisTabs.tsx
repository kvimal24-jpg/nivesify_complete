"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Match", href: "/mutual-fund-match" },
  { label: "Analysis", href: "/mutual-fund-analysis" },
  { label: "Active", href: "/active-funds" },
  { label: "Passive", href: "/index-funds" },
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
                ? "bg-[#1F2937] text-white ring-2 ring-[#1F2937]/60 shadow-[0_10px_25px_-15px_rgba(31,41,55,0.5)]"
                : "bg-white text-[#4A5D4E] border border-[#4A5D4E]/20"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
