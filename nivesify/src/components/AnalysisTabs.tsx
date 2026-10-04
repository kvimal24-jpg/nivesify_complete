import { SegmentedNav } from "@/components/ui";

const tabs = [
  { label: "Why Mutual Fund", href: "/why-mutual-fund" },
  { label: "Smart Fund Finder", href: "/mutual-fund-match" },
  { label: "MF Industry Analysis", href: "/mutual-fund-analysis" },
  { label: "Active Funds", href: "/active-funds" },
  { label: "Passive Funds", href: "/index-funds" },
  { label: "Fund Holdings", href: "/mutual-fund-holdings" },
];

export default function AnalysisTabs() {
  return <SegmentedNav items={tabs} label="Mutual fund research" />;
}
