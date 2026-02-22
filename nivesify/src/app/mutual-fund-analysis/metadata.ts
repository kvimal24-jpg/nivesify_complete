import type { Metadata } from "next";

const BASE_URL = "https://www.nivesify.com";

export const metadata: Metadata = {
  title: "Mutual Fund Analysis India 2025 | Performance, Risk, Commentary | Nivesify",
  description: "Deep dive into mutual fund analysis in India. Review performance, risk, and expert commentary for better investment decisions.",
  alternates: {
    canonical: `${BASE_URL}/mutual-fund-analysis`,
  },
  openGraph: {
    type: "website",
    url: `${BASE_URL}/mutual-fund-analysis`,
    siteName: "Nivesify",
    title: "Mutual Fund Analysis India | Performance, Risk, Commentary",
    description: "Deep dive into mutual fund analysis in India. Review performance, risk, and expert commentary for better investment decisions.",
    images: [
      {
        url: `${BASE_URL}/og/mutual-fund-analysis.png`,
        width: 1200,
        height: 630,
        alt: "Nivesify Mutual Fund Analysis — Performance, Risk, Commentary India",
      },
    ],
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    site: "@nivesify",
    creator: "@nivesify",
    title: "Mutual Fund Analysis India | Performance, Risk, Commentary",
    description: "Deep dive into mutual fund analysis in India. Review performance, risk, and expert commentary for better investment decisions.",
    images: [`${BASE_URL}/og/mutual-fund-analysis.png`],
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
    "mutual fund analysis",
    "mutual fund performance India",
    "mutual fund risk commentary",
    "Nivesify fund analysis",
    "investment decisions India",
    "expert mutual fund commentary",
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
      "@id": `${BASE_URL}/mutual-fund-analysis#webpage`,
      url: `${BASE_URL}/mutual-fund-analysis`,
      name: "Mutual Fund Analysis India | Performance, Risk, Commentary | Nivesify",
      description: "Deep dive into mutual fund analysis in India. Review performance, risk, and expert commentary for better investment decisions.",
      inLanguage: "en-IN",
      isPartOf: { "@id": `${BASE_URL}/#website` },
      breadcrumb: { "@id": `${BASE_URL}/mutual-fund-analysis#breadcrumb` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${BASE_URL}/mutual-fund-analysis#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
        { "@type": "ListItem", position: 2, name: "Fund Analysis", item: `${BASE_URL}/mutual-fund-analysis` },
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