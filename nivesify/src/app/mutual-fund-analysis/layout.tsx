import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MF Industry Analysis | Nivesify",
  description: "Industry-wide insights, plain-language methodology, and guided paths for active and passive selection.",
  alternates: { canonical: "https://nivesify.com/mutual-fund-analysis" },
  openGraph: {
    title: "MF Industry Analysis | Nivesify",
    description: "Industry-wide insights, plain-language methodology, and guided paths for active and passive selection.",
    url: "https://nivesify.com/mutual-fund-analysis",
    siteName: "Nivesify",
    locale: "en_US",
    type: "website",
  },
};

export default function MutualFundAnalysisLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
