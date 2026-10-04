import { SegmentedNav } from "@/components/ui";

const tabs = [
  { label: "Smart Fund Engine", href: "/mutual-fund-match" },
  { label: "Quick Fund Picks", href: "/find-my-fund-quick-picks" },
  { label: "Lifetime Wealth Plan", href: "/find-my-fund-lifetime-plan" },
];

export default function FindMyFundTabs() {
  return <SegmentedNav items={tabs} label="Fund finder modes" />;
}
