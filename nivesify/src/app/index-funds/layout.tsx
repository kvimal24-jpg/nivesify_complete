import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Passive / Index Funds | Nivesify",
  description: "Compare index funds and ETFs by tracking difference, AUM, and benchmark fit. Find the tightest tracker for your index.",
  alternates: { canonical: "https://nivesify.com/index-funds" },
  openGraph: {
    title: "Passive / Index Funds | Nivesify",
    description: "Compare index funds and ETFs by tracking difference, AUM, and benchmark fit.",
    url: "https://nivesify.com/index-funds",
    siteName: "Nivesify",
    locale: "en_US",
    type: "website",
  },
};

export default function IndexFundsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
