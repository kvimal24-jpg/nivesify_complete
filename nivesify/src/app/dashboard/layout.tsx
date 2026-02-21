import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Money Dashboard | Nivesify",
  description:
    "Your complete financial command centre. Track net worth, simulate wealth growth, analyse FIRE readiness, and monitor every goal — live, in one place.",
  alternates: {
    canonical: "https://nivesify.com/dashboard",
  },
  openGraph: {
    title: "My Money Dashboard | Nivesify",
    description:
      "Live simulation of your wealth journey. Net worth, retirement corpus, FIRE age, goal SIPs — all in one place.",
    url: "https://nivesify.com/dashboard",
    siteName: "Nivesify",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "My Money Dashboard | Nivesify",
    description:
      "Your complete financial picture. Simulate, plan, and achieve freedom.",
  },
  robots: { index: false, follow: false },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}