import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mutual Fund Health Check",
  description: "Upload your CAS to see XIRR, fund health, and clear actions across your mutual fund portfolio.",
  alternates: {
    canonical: "https://nivesify.com/mutual-fund-health-check",
  },
  openGraph: {
    title: "Mutual Fund Health Check | Nivesify",
    description: "Upload your CAS to see XIRR, fund health, and clear actions across your portfolio.",
    url: "https://nivesify.com/mutual-fund-health-check",
    siteName: "Nivesify",
    locale: "en_US",
    type: "website",
  },
};

export default function MutualFundHealthCheckLayout({ children }: { children: React.ReactNode }) {
  return children;
}
