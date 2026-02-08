import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Life Calculators",
  description: "Retirement, FIRE, education, and life-goal calculators with a clear journey map and cashflow view.",
  alternates: {
    canonical: "https://nivesify.com/dashboard/calculators",
  },
  openGraph: {
    title: "Life Calculators | Nivesify",
    description: "Model retirement, FIRE, education, and life goals with clear cashflow visualizations.",
    url: "https://nivesify.com/dashboard/calculators",
    siteName: "Nivesify",
    locale: "en_US",
    type: "website",
  },
};

export default function CalculatorsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
