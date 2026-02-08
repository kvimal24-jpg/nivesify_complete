import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolio View",
  description: "Review holdings, allocations, and fund-level details from your mutual fund portfolio.",
  alternates: {
    canonical: "https://nivesify.com/mutual-fund-health-check/portfolio",
  },
  openGraph: {
    title: "Portfolio View | Nivesify",
    description: "Review holdings, allocations, and fund-level details from your mutual fund portfolio.",
    url: "https://nivesify.com/mutual-fund-health-check/portfolio",
    siteName: "Nivesify",
    locale: "en_US",
    type: "website",
  },
};

export default function HealthCheckPortfolioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
