import type { Metadata } from "next";

const BASE_URL = "https://www.nivesify.com";

export const metadata: Metadata = {
  title: "Index Funds Explorer India 2025 | Passive Investing, Performance | Nivesify",
  description: "Analyze index funds for passive investing in India. Compare performance, fees, and suitability for your portfolio.",
  alternates: {
    canonical: `${BASE_URL}/index-funds`,
  },
  openGraph: {
    type: "website",
    url: `${BASE_URL}/index-funds`,
    siteName: "Nivesify",
    title: "Index Funds Explorer India | Passive Investing, Performance",
    description: "Analyze index funds for passive investing in India. Compare performance, fees, and suitability for your portfolio.",
    images: [
      {
        url: `${BASE_URL}/og/index-funds.png`,
        width: 1200,
        height: 630,
        alt: "Nivesify Index Funds — Passive Investing, Performance India",
      },
    ],
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    site: "@nivesify",
    creator: "@nivesify",
    title: "Index Funds Explorer India | Passive Investing, Performance",
    description: "Analyze index funds for passive investing in India. Compare performance, fees, and suitability for your portfolio.",
    images: [`${BASE_URL}/og/index-funds.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  keywords: [
    "index funds explorer",
    "passive investing India",
    "index fund performance",
    "mutual fund fees India",
    "Nivesify index funds",
    "portfolio suitability",
    "free mutual fund tools",
  ],
  authors: [{ name: "Nivesify", url: BASE_URL }],
  creator: "Nivesify",
  publisher: "Nivesify",
  category: "Finance",
};

export const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${BASE_URL}/index-funds#webpage`,
      url: `${BASE_URL}/index-funds`,
      name: "Index Funds Explorer India | Passive Investing, Performance | Nivesify",
      description: "Analyze index funds for passive investing in India. Compare performance, fees, and suitability for your portfolio.",
      inLanguage: "en-IN",
      isPartOf: { "@id": `${BASE_URL}/#website` },
      breadcrumb: { "@id": `${BASE_URL}/index-funds#breadcrumb` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${BASE_URL}/index-funds#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
        { "@type": "ListItem", position: 2, name: "Index Funds", item: `${BASE_URL}/index-funds` },
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      url: BASE_URL,
      name: "Nivesify",
      description: "India's smart mutual fund research and planning platform for retail investors.",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};