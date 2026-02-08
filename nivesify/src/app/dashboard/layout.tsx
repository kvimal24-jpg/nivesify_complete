import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Money Dashboard",
  description: "View your complete money picture, track net worth, and monitor your financial runway in one place.",
  alternates: {
    canonical: "https://nivesify.com/dashboard",
  },
  openGraph: {
    title: "My Money Dashboard | Nivesify",
    description: "View your complete money picture, track net worth, and monitor your financial runway.",
    url: "https://nivesify.com/dashboard",
    siteName: "Nivesify",
    locale: "en_US",
    type: "website",
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
