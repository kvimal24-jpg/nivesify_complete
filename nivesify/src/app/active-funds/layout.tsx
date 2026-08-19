import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Active Mutual Funds | Nivesify",
  description: "Find active mutual funds that consistently beat the market. Ranked by real skill — not just past returns.",
  alternates: { canonical: "https://nivesify.com/active-funds" },
  openGraph: {
    title: "Active Mutual Funds | Nivesify",
    description: "Find active mutual funds that consistently beat the market. Ranked by real skill — not just past returns.",
    url: "https://nivesify.com/active-funds",
    siteName: "Nivesify",
    locale: "en_US",
    type: "website",
  },
};

export default function ActiveFundsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
