import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mutual Fund Holdings & Overlap",
  description: "Inspect the companies held by Indian mutual funds and compare portfolios for concentration and overlap.",
};

export default function HoldingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
