import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Financial Setup Wizard | Nivesify",
  description:
    "A guided 6-step onboarding to map your cashflow, assets, insurance, and life goals — so your personalised financial simulation is as accurate as possible.",
  alternates: {
    canonical: "https://nivesify.com/dashboard/onboarding",
  },
  openGraph: {
    title: "Financial Setup Wizard | Nivesify",
    description:
      "Map your cashflow, protect your family, and define your dreams in a guided 6-step flow. Your wealth simulation starts here.",
    url: "https://nivesify.com/dashboard/onboarding",
    siteName: "Nivesify",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Financial Setup Wizard | Nivesify",
    description:
      "6 steps to your complete financial picture. Start your wealth simulation.",
  },
  robots: { index: false, follow: false },
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}