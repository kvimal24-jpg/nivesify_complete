import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Onboarding Journey",
  description: "A guided onboarding to map your cashflow, goals, and protection needs before you invest.",
  alternates: {
    canonical: "https://nivesify.com/dashboard/onboarding",
  },
  openGraph: {
    title: "Onboarding Journey | Nivesify",
    description: "Map your cashflow, goals, and protection needs in a guided onboarding flow.",
    url: "https://nivesify.com/dashboard/onboarding",
    siteName: "Nivesify",
    locale: "en_US",
    type: "website",
  },
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
