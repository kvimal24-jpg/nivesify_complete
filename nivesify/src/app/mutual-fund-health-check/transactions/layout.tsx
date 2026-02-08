import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transactions",
  description: "Track mutual fund transactions and cashflows derived from your CAS data.",
  alternates: {
    canonical: "https://nivesify.com/mutual-fund-health-check/transactions",
  },
  openGraph: {
    title: "Transactions | Nivesify",
    description: "Track mutual fund transactions and cashflows derived from your CAS data.",
    url: "https://nivesify.com/mutual-fund-health-check/transactions",
    siteName: "Nivesify",
    locale: "en_US",
    type: "website",
  },
};

export default function HealthCheckTransactionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
