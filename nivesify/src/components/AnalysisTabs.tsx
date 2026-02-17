"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Find Your Fund", href: "/mutual-fund-match" },
  { label: "MF Industry Analysis", href: "/mutual-fund-analysis" },
  { label: "Active Funds", href: "/active-funds" },
  { label: "Passive Funds", href: "/index-funds" },
];

export default function AnalysisTabs({ activeTab, setActiveTab }: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.label;
        return (
          <button
            key={tab.href}
            onClick={() => setActiveTab(tab.label)}
            className={`px-4 py-2 rounded-full text-xs md:text-sm font-serif transition-all ${
              isActive
                ? "bg-[#2F5D7C] !text-white ring-2 ring-[#2F5D7C]/60 shadow-[0_10px_25px_-15px_rgba(47,93,124,0.5)]"
                : "bg-white text-[#1F2937] border border-[#4A5D4E]/20"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
