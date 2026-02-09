import "./globals.css";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://nivesify.com"),
  title: {
    template: "%s | Nivesify",
    default: "Nivesify — Thoughtful Money, Better Life",
  },
  description: "A calm financial sanctuary for Indian investors. Analyze mutual funds, compare active and passive funds, track XIRR, and plan your next move with clarity.",
  keywords: [
    "mutual fund",
    "mutual fund analysis",
    "active funds",
    "index funds",
    "portfolio analysis",
    "XIRR",
    "investment tracking",
    "India",
    "retirement planning",
  ],
  alternates: {
    canonical: "https://nivesify.com",
  },
  openGraph: {
    title: "Nivesify — Thoughtful Money, Better Life",
    description: "Analyze mutual funds, compare active and passive funds, track XIRR, and plan your next move with clarity.",
    url: "https://nivesify.com",
    siteName: "Nivesify",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nivesify — Thoughtful Money, Better Life",
    description: "Analyze mutual funds, compare active and passive funds, track XIRR, and plan your next move with clarity.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#FCFDFD] text-[#1F2937] antialiased flex flex-col min-h-screen">
        {/* Global Header */}
        <Header />

        {/* Page Content 
            pt-20: Adds padding so the fixed header doesn't cover content.
            flex-grow: Pushes the footer to the bottom even on short pages.
        */}
        <main className="pt-20 flex-grow">
          {children}
        </main>

        {/* Global Footer */}
        <Footer />
      </body>
    </html>
  );
}