import type { Metadata } from "next";

const BASE_URL = "https://www.nivesify.com";

export const metadata: Metadata = {
  title: "Active Funds Explorer India 2025 | Performance, Risk, Insights | Nivesify",
  description: "Explore actively managed mutual funds in India. Analyze performance, risk, and expert insights for informed investing.",
  alternates: {
    canonical: `${BASE_URL}/active-funds`,
  },
  openGraph: {
    type: "website",
    url: `${BASE_URL}/active-funds`,
    siteName: "Nivesify",
    title: "Active Funds Explorer India | Performance, Risk, Insights",
    description: "Explore actively managed mutual funds in India. Analyze performance, risk, and expert insights for informed investing.",
    images: [
      {
        url: `${BASE_URL}/og/active-funds.png`,
        width: 1200,
        height: 630,
        alt: "Nivesify Active Funds — Performance, Risk, Insights India",
      },
    ],
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    site: "@nivesify",
    creator: "@nivesify",
    title: "Active Funds Explorer India | Performance, Risk, Insights",
    description: "Explore actively managed mutual funds in India. Analyze performance, risk, and expert insights for informed investing.",
    images: [`${BASE_URL}/og/active-funds.png`],
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
    "active funds explorer",
    "actively managed mutual funds",
    "mutual fund performance India",
    "mutual fund risk analysis",
    "Nivesify active funds",
    "expert mutual fund insights",
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
      "@id": `${BASE_URL}/active-funds#webpage`,
      url: `${BASE_URL}/active-funds`,
      name: "Active Funds Explorer India | Performance, Risk, Insights | Nivesify",
      description: "Explore actively managed mutual funds in India. Analyze performance, risk, and expert insights for informed investing.",
      inLanguage: "en-IN",
      isPartOf: { "@id": `${BASE_URL}/#website` },
      breadcrumb: { "@id": `${BASE_URL}/active-funds#breadcrumb` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${BASE_URL}/active-funds#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
        { "@type": "ListItem", position: 2, name: "Active Funds", item: `${BASE_URL}/active-funds` },
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