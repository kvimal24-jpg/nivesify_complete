import type { Metadata } from "next";

const BASE_URL = "https://www.nivesify.com";

export const metadata: Metadata = {
  title: "Why Mutual Funds India 2025 | Benefits, Strategies, Insights | Nivesify",
  description: "Learn why mutual funds are a smart choice for Indian investors. Explore benefits, strategies, and expert insights for optimal investing.",
  alternates: {
    canonical: `${BASE_URL}/why-mutual-fund`,
  },
  openGraph: {
    type: "website",
    url: `${BASE_URL}/why-mutual-fund`,
    siteName: "Nivesify",
    title: "Why Mutual Funds India | Benefits, Strategies, Insights",
    description: "Learn why mutual funds are a smart choice for Indian investors. Explore benefits, strategies, and expert insights.",
    images: [
      {
        url: `${BASE_URL}/og/why-mutual-fund.png`,
        width: 1200,
        height: 630,
        alt: "Nivesify Why Mutual Funds — Benefits, Strategies, Insights India",
      },
    ],
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    site: "@nivesify",
    creator: "@nivesify",
    title: "Why Mutual Funds India | Benefits, Strategies, Insights",
    description: "Learn why mutual funds are a smart choice for Indian investors. Explore benefits, strategies, and expert insights.",
    images: [`${BASE_URL}/og/why-mutual-fund.png`],
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
    "why mutual funds",
    "mutual fund benefits",
    "investment strategies India",
    "Nivesify mutual fund insights",
    "mutual fund advantages",
    "expert investment advice",
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
      "@id": `${BASE_URL}/why-mutual-fund#webpage`,
      url: `${BASE_URL}/why-mutual-fund`,
      name: "Why Mutual Funds India | Benefits, Strategies, Insights | Nivesify",
      description: "Learn why mutual funds are a smart choice for Indian investors. Explore benefits, strategies, and expert insights for optimal investing.",
      inLanguage: "en-IN",
      isPartOf: { "@id": `${BASE_URL}/#website` },
      breadcrumb: { "@id": `${BASE_URL}/why-mutual-fund#breadcrumb` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${BASE_URL}/why-mutual-fund#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
        { "@type": "ListItem", position: 2, name: "Why Mutual Fund", item: `${BASE_URL}/why-mutual-fund` },
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