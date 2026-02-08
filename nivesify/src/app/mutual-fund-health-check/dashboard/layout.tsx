import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Health Check Dashboard",
  description: "View portfolio health, XIRR, and performance insights from your CAS data.",
  alternates: {
    canonical: "https://nivesify.com/mutual-fund-health-check/dashboard",
  },
  openGraph: {
    title: "Health Check Dashboard | Nivesify",
    description: "View portfolio health, XIRR, and performance insights from your CAS data.",
    url: "https://nivesify.com/mutual-fund-health-check/dashboard",
    siteName: "Nivesify",
    locale: "en_US",
    type: "website",
  },
};

export default function HealthCheckDashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
