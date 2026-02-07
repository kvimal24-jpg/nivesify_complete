import { InvestmentsData, MatchingScheme } from "./types";
import type { Portfolio } from "./portfolio";
import { buildCashflows } from "./cashflows";
import { xirr } from "./xirr";

export type ReportInsight = {
  title: string;
  signal: "Normal" | "Elevated" | "Watch-worthy" | "Strong" | "Aggressive";
  observation: string;
  meaning: string;
  reassurance: string;
  suggestedCheck: string;
  severity: "info" | "warning" | "positive";
};

export type SchemeBreakdownNode = {
  name: string;
  size?: number;
  children?: SchemeBreakdownNode[];
  value?: number;
};

export type AmcBreakdown = { name: string; value: number }[];

export type ReportData = {
  holdingsCount: number;
  topOneShare: number;
  topFiveShare: number;
  topAmcShare: number;
  insights: ReportInsight[];
  insightSummary: string;
  schemeBreakdown: SchemeBreakdownNode;
  amcBreakdown: AmcBreakdown;
  topHoldings: Array<{ name: string; value: number }>;
  fundDetails: Array<{
    name: string;
    invested: number;
    currentValue: number;
    profit: number;
    units: number;
    nav: number;
    xirr: number | null;
    nomineeStatus: "yes" | "no" | "partial" | "unknown";
    amc: string;
    schemeCategory: string;
    majorCategory: string;
  }>;
};

const buildSchemeMetaMap = (
  transactions: InvestmentsData["transactions"] = [],
  schemeLookup?: Map<number, MatchingScheme>
) => {
  const map = new Map<number, MatchingScheme>();
  transactions.forEach((txn) => {
    if (txn.matchingScheme?.schemeCode) {
      map.set(txn.matchingScheme.schemeCode, txn.matchingScheme);
    }
  });
  if (schemeLookup) {
    schemeLookup.forEach((scheme, code) => {
      const existing = map.get(code) || ({} as MatchingScheme);
      map.set(code, { ...existing, ...scheme });
    });
  }
  return map;
};

const toPercent = (value: number) => (Number.isFinite(value) ? value : 0);
const formatPercent = (value: number | null, digits = 1) => {
  if (value === null || !Number.isFinite(value)) return "Unavailable";
  return `${(value * 100).toFixed(digits)}%`;
};
const formatNumberPlain = (value: number, digits = 2) => {
  const safeValue = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: digits }).format(safeValue);
};

const DISCLAIMER_TEXT =
  "All financial decisions involve risk and past performance is no guarantee of future results. You should consult with a qualified advisor and review all relevant disclosure documents before acting on any information provided.";

const INSIGHT_THRESHOLDS = {
  fundsBeginnerMax: 3,
  fundsModerateMax: 6,
  fundsAdvancedMax: 8,
  fundsUpperLimit: 10,
  singleFundElevated: 0.2,
  singleFundWatch: 0.3,
  singleFundStrong: 0.4,
  topFiveElevated: 0.6,
  topFiveWatch: 0.65,
  topFiveStrong: 0.75,
  amcElevated: 0.3,
  amcWatch: 0.4,
  amcStrong: 0.45,
  equityLow: 0.3,
  equityVeryLow: 0.25,
  equityHigh: 0.85,
  equityAggressive: 0.9,
  debtHigh: 0.7,
  debtStrong: 0.75,
  hybridHigh: 0.6,
  hybridWatch: 0.7,
  xirrLow: 0.07,
  xirrStrong: 0.13,
};

const classifyCategory = (category?: string) => {
  if (!category) return "Other";
  const lower = category.toLowerCase();
  if (lower.includes("equity")) return "Equity";
  if (lower.includes("debt") || lower.includes("bond") || lower.includes("gilt")) return "Debt";
  if (lower.includes("hybrid") || lower.includes("balanced") || lower.includes("aggressive")) return "Hybrid";
  if (lower.includes("solution") || lower.includes("retirement") || lower.includes("child")) return "Solution";
  return "Other";
};

const deriveAmcName = (meta?: MatchingScheme, fallbackName?: string) => {
  if (meta?.amc) return meta.amc;
  const schemeName = meta?.schemeName || fallbackName || "";
  const match = schemeName.match(/^(.*?Mutual Fund)/i);
  if (match && match[1]) return match[1].trim();
  const fallback = schemeName.split(" ").filter(Boolean)[0];
  return fallback || "Other";
};

export const buildReportData = (
  data: InvestmentsData,
  portfolio: Portfolio,
  totalValue: number,
  xirrValue: number | null,
  schemeLookup?: Map<number, MatchingScheme>
): ReportData => {
  const nomineeMap = data.nominees || {};
  const schemeMeta = buildSchemeMetaMap(data.transactions || [], schemeLookup);
  const activeHoldings = portfolio.filter((row) => row.currentValue > 0);
  const sorted = [...activeHoldings].sort((a, b) => b.currentValue - a.currentValue);
  const topOneValue = sorted[0]?.currentValue || 0;
  const topFiveValue = sorted.slice(0, 5).reduce((sum, fund) => sum + fund.currentValue, 0);
  const holdingsCount = activeHoldings.length;
  const topOneShare = totalValue ? topOneValue / totalValue : 0;
  const topFiveShare = totalValue ? topFiveValue / totalValue : 0;

  const schemeRoot: SchemeBreakdownNode = { name: "All Schemes", children: [] };
  const majorCategoryMap = new Map<string, SchemeBreakdownNode>();

  activeHoldings.forEach((row) => {
    const meta = schemeMeta.get(row.schemeCode);
    const majorCategory = classifyCategory(meta?.schemeCategory);
    const schemeCategory = meta?.schemeCategory || "Uncategorized";

    if (!majorCategoryMap.has(majorCategory)) {
      const node = { name: majorCategory, children: [] as SchemeBreakdownNode[], size: 0 };
      majorCategoryMap.set(majorCategory, node);
      schemeRoot.children?.push(node);
    }

    const majorNode = majorCategoryMap.get(majorCategory) as SchemeBreakdownNode;
    let categoryNode = majorNode.children?.find((child) => child.name === schemeCategory);
    if (!categoryNode) {
      categoryNode = { name: schemeCategory, children: [], size: 0 };
      majorNode.children?.push(categoryNode);
    }

    const fundValue = Math.max(0, row.currentValue);
    categoryNode.children?.push({
      name: row.mfName,
      size: fundValue,
      value: fundValue,
    });
    categoryNode.size = (categoryNode.size || 0) + fundValue;
    majorNode.size = (majorNode.size || 0) + fundValue;
  });

  const amcMap = new Map<string, number>();
  activeHoldings.forEach((row) => {
    const meta = schemeMeta.get(row.schemeCode);
    const amc = deriveAmcName(meta, row.mfName);
    amcMap.set(amc, (amcMap.get(amc) || 0) + Math.max(0, row.currentValue));
  });

  const amcBreakdown = Array.from(amcMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  const topAmcShare = totalValue ? (amcBreakdown[0]?.value || 0) / totalValue : 0;

  const allocationMap = new Map<string, number>();
  activeHoldings.forEach((row) => {
    const meta = schemeMeta.get(row.schemeCode);
    const bucket = classifyCategory(meta?.schemeCategory);
    allocationMap.set(bucket, (allocationMap.get(bucket) || 0) + Math.max(0, row.currentValue));
  });
  const equityShare = totalValue ? (allocationMap.get("Equity") || 0) / totalValue : 0;
  const debtShare = totalValue ? (allocationMap.get("Debt") || 0) / totalValue : 0;
  const hybridShare = totalValue ? (allocationMap.get("Hybrid") || 0) / totalValue : 0;

  const insights: ReportInsight[] = [];
  const pushInsight = (insight: ReportInsight) => insights.push(insight);
  const shareLabel = (value: number) => `${(toPercent(value) * 100).toFixed(1)}%`;

  if (holdingsCount > INSIGHT_THRESHOLDS.fundsAdvancedMax) {
    const signal = holdingsCount > INSIGHT_THRESHOLDS.fundsUpperLimit ? "Strong" : "Watch-worthy";
    pushInsight({
      title: "Over-diversification signal",
      signal,
      observation: `You currently hold ${holdingsCount} active funds.`,
      meaning:
        "Most retail portfolios work best with 3-6 well-chosen funds. Beyond 8-10 funds, diversification benefits taper while overlap and monitoring complexity rise.",
      reassurance:
        "Many investors accumulate funds over time; this is common and can be corrected without disrupting long-term goals.",
      suggestedCheck:
        "Review overlap (aim for <33% overlap), consolidate similar schemes, and target: Equity 3-5, Debt 1-3, Hybrid 1-2, ELSS 1.",
      severity: holdingsCount > INSIGHT_THRESHOLDS.fundsUpperLimit ? "warning" : "info",
    });
  } else if (holdingsCount > INSIGHT_THRESHOLDS.fundsModerateMax) {
    pushInsight({
      title: "Diversification at the high end",
      signal: "Elevated",
      observation: `You hold ${holdingsCount} active funds.`,
      meaning:
        "This is at the upper end of what most retail investors need. It can dilute the impact of strong performers.",
      reassurance:
        "Your portfolio is still within a manageable range if each fund has a clear role.",
      suggestedCheck:
        "Verify each fund has a distinct purpose; prune overlapping schemes during your annual review.",
      severity: "info",
    });
  }

  if (topOneShare >= INSIGHT_THRESHOLDS.singleFundElevated) {
    const signal =
      topOneShare >= INSIGHT_THRESHOLDS.singleFundStrong
        ? "Strong"
        : topOneShare >= INSIGHT_THRESHOLDS.singleFundWatch
          ? "Watch-worthy"
          : "Elevated";
    pushInsight({
      title: "Single-fund exposure",
      signal,
      observation: `Your largest fund accounts for ${shareLabel(topOneShare)} of your portfolio.`,
      meaning:
        "This level of concentration is meaningful but not necessarily risky if it reflects intentional conviction.",
      reassurance:
        "Many well-performing portfolios naturally develop a core holding as it compounds over time.",
      suggestedCheck:
        "Confirm the fund still aligns with your goals and risk comfort; rebalance only if it became an accidental overweight.",
      severity: signal === "Strong" ? "warning" : "info",
    });
  }

  if (topFiveShare >= INSIGHT_THRESHOLDS.topFiveElevated) {
    const signal =
      topFiveShare >= INSIGHT_THRESHOLDS.topFiveStrong
        ? "Strong"
        : topFiveShare >= INSIGHT_THRESHOLDS.topFiveWatch
          ? "Watch-worthy"
          : "Elevated";
    pushInsight({
      title: "Top 5 funds drive outcomes",
      signal,
      observation: `Your top 5 funds together make up ${shareLabel(topFiveShare)} of the portfolio.`,
      meaning:
        "This is typical of a structured portfolio where a few core funds do the heavy lifting.",
      reassurance:
        "Concentration here is not inherently risky if the funds are meaningfully different.",
      suggestedCheck:
        "Review overlap across the top funds. If holdings are similar, consolidation may improve clarity.",
      severity: signal === "Strong" ? "warning" : "info",
    });
  }

  if (topAmcShare >= INSIGHT_THRESHOLDS.amcElevated) {
    const signal =
      topAmcShare >= INSIGHT_THRESHOLDS.amcStrong
        ? "Strong"
        : topAmcShare >= INSIGHT_THRESHOLDS.amcWatch
          ? "Watch-worthy"
          : "Elevated";
    pushInsight({
      title: "AMC exposure concentration",
      signal,
      observation: `Your highest exposure to a single AMC is ${shareLabel(topAmcShare)}.`,
      meaning:
        "AMC-level concentration is often overlooked. It is not inherently risky, but it can increase operational dependency.",
      reassurance:
        "A higher AMC share is acceptable when it is a deliberate preference for a consistent investment philosophy.",
      suggestedCheck:
        "Ask whether you would still choose this AMC intentionally for one-third of your portfolio today.",
      severity: signal === "Strong" ? "warning" : "info",
    });
  }

  if (xirrValue !== null && xirrValue < INSIGHT_THRESHOLDS.xirrLow && equityShare >= 0.4) {
    pushInsight({
      title: "Portfolio performance signal",
      signal: "Watch-worthy",
      observation: `Portfolio XIRR is ${(xirrValue * 100).toFixed(2)}%.`,
      meaning:
        "For a portfolio with meaningful equity exposure, this can be low over long horizons.",
      reassurance:
        "Short windows can temporarily depress XIRR; this does not always indicate poor fund quality.",
      suggestedCheck:
        "Review persistent underperformers and verify your equity/debt mix aligns with your time horizon.",
      severity: "warning",
    });
  } else if (xirrValue !== null && xirrValue >= INSIGHT_THRESHOLDS.xirrStrong) {
    pushInsight({
      title: "Portfolio performance signal",
      signal: "Strong",
      observation: `Portfolio XIRR stands at ${(xirrValue * 100).toFixed(2)}%.`,
      meaning:
        "This is strong for a long-term investment journey and suggests a sound portfolio structure.",
      reassurance:
        "Consistent returns usually reflect disciplined behaviour rather than luck alone.",
      suggestedCheck:
        "Maintain discipline and avoid changes unless a fund's role or mandate changes materially.",
      severity: "positive",
    });
  }

  if (equityShare > 0 && equityShare < INSIGHT_THRESHOLDS.equityLow) {
    const signal = equityShare < INSIGHT_THRESHOLDS.equityVeryLow ? "Watch-worthy" : "Elevated";
    pushInsight({
      title: "Equity allocation signal",
      signal,
      observation: `Equity makes up ${shareLabel(equityShare)} of your portfolio value.`,
      meaning:
        "Very low equity can limit long-term growth for investors with longer time horizons.",
      reassurance:
        "A lower equity mix can be appropriate for near-term goals or higher stability needs.",
      suggestedCheck:
        "If your horizon is 7+ years, review whether a higher equity allocation is appropriate.",
      severity: "info",
    });
  }

  if (equityShare > INSIGHT_THRESHOLDS.equityHigh) {
    const signal = equityShare > INSIGHT_THRESHOLDS.equityAggressive ? "Aggressive" : "Strong";
    pushInsight({
      title: "Equity allocation signal",
      signal,
      observation: `Equity makes up ${shareLabel(equityShare)} of your portfolio value.`,
      meaning:
        "This is a high-growth allocation that can magnify both gains and drawdowns.",
      reassurance:
        "High equity can be effective for long horizons when volatility is acceptable.",
      suggestedCheck:
        "Ensure the allocation matches your time horizon, liquidity needs, and drawdown tolerance.",
      severity: "info",
    });
  }

  if (debtShare > INSIGHT_THRESHOLDS.debtHigh) {
    const signal = debtShare > INSIGHT_THRESHOLDS.debtStrong ? "Watch-worthy" : "Elevated";
    pushInsight({
      title: "Debt allocation signal",
      signal,
      observation: `Debt allocation is ${shareLabel(debtShare)} of portfolio value.`,
      meaning:
        "Debt-heavy portfolios reduce volatility but can underperform inflation over long horizons.",
      reassurance:
        "Higher debt allocation can be appropriate for near-term goals or capital preservation.",
      suggestedCheck:
        "Confirm this matches your risk profile and liquidity timeline.",
      severity: "info",
    });
  }

  if (hybridShare > INSIGHT_THRESHOLDS.hybridHigh) {
    const signal = hybridShare > INSIGHT_THRESHOLDS.hybridWatch ? "Watch-worthy" : "Elevated";
    pushInsight({
      title: "Hybrid allocation signal",
      signal,
      observation: `Hybrid funds are ${shareLabel(hybridShare)} of portfolio value.`,
      meaning:
        "Hybrid funds simplify allocation but can reduce control over equity vs debt splits.",
      reassurance:
        "This can still be effective when you prefer a single-fund allocation approach.",
      suggestedCheck:
        "Ensure hybrid allocation aligns with your desired asset mix and tax preferences.",
      severity: "info",
    });
  }

  const topHoldings = sorted.slice(0, 5).map((fund) => ({
    name: fund.mfName,
    value: fund.currentValue,
  }));

  const fundDetails = sorted.map((fund) => {
    const meta = schemeMeta.get(fund.schemeCode);
    const amc = deriveAmcName(meta, fund.mfName);
    const schemeCategory = meta?.schemeCategory || "Uncategorized";
    const majorCategory = classifyCategory(meta?.schemeCategory);
    const units = fund.currentUnits || 0;
    const nav = fund.latestPrice || 0;
    const fundCashflows = buildCashflows(
      fund.allTransactions.map((txn) => ({
        amount: Math.abs(txn.amount),
        date: new Date(txn.date),
        type: txn.type === "Investment" ? "buy" : "sell",
      })),
      fund.currentValue,
      new Date(),
      fund.currentValue > 0
    );
    const fundXirr = xirr(fundCashflows);
    const folios = Array.from(
      new Set(
        fund.allTransactions
          .map((txn) => txn.folio?.split("/")[0].trim())
          .filter((folio) => Boolean(folio)) as string[]
      )
    );
    const nomineeFlags = folios.map((folio) => nomineeMap[folio]).filter((flag) => flag !== undefined);
    let nomineeStatus: "yes" | "no" | "partial" | "unknown" = "unknown";
    if (nomineeFlags.length) {
      const hasYes = nomineeFlags.some((flag) => flag === true);
      const hasNo = nomineeFlags.some((flag) => flag === false);
      if (hasYes && hasNo) nomineeStatus = "partial";
      else if (hasYes) nomineeStatus = "yes";
      else nomineeStatus = "no";
      if (nomineeFlags.length < folios.length) nomineeStatus = "partial";
    }
    return {
      name: fund.mfName,
      invested: fund.currentInvested,
      currentValue: fund.currentValue,
      profit: fund.profit,
      units,
      nav,
      xirr: fundXirr,
      nomineeStatus,
      amc,
      schemeCategory,
      majorCategory,
    };
  });


  if (!insights.length) {
    pushInsight({
      title: "Portfolio structure signal",
      signal: "Normal",
      observation: "Your portfolio does not show major concentration or diversification risks.",
      meaning: "Key checks are within typical diversification ranges for long-term investors.",
      reassurance: "This suggests a stable structure rather than reactive decision-making.",
      suggestedCheck: "Continue periodic review and rebalance if your goals or risk profile change.",
      severity: "positive",
    });
  }

  const hasWarnings = insights.some((insight) => insight.severity === "warning");
  const insightSummary = hasWarnings
    ? "Overall, your portfolio shows a few areas to review, but the structure appears intentional."
    : "Overall, your portfolio reflects deliberate long-term intent rather than short-term decision-making.";

  return {
    holdingsCount,
    topOneShare,
    topFiveShare,
    topAmcShare,
    insights,
    insightSummary,
    schemeBreakdown: schemeRoot,
    amcBreakdown,
    topHoldings,
    fundDetails,
  };
};

export const formatCurrencyPlain = (value: number) => {
  const safeValue = Number.isFinite(value) ? value : 0;
  const formatted = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(safeValue);
  return `INR ${formatted}`;
};

export const generatePdfReport = async (params: {
  logoUrl: string;
  summary: { totalValue: number; invested: number; allTimeProfit: number; monthlyIncome: number };
  xirrValue: number | null;
  report: ReportData;
  holder: { name: string; pan?: string; email?: string };
  chartIds: { performance: string; scheme: string; amc: string };
}) => {
  const [{ jsPDF }] = await Promise.all([import("jspdf")]);

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const { summary, report, xirrValue, logoUrl, holder } = params;
  void params.chartIds;

  const loadLogo = async () => {
    const res = await fetch(logoUrl);
    const blob = await res.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Logo load failed"));
      reader.readAsDataURL(blob);
    });
  };

  let logoData: string | null = null;
  try {
    logoData = await loadLogo();
  } catch {
    // Logo is optional
  }

  const pageWidth = 595;
  const pageHeight = 842;
  const marginX = 40;
  const contentWidth = pageWidth - marginX * 2;

  const theme = {
    ink: [31, 41, 55] as const,
    muted: [107, 124, 112] as const,
    border: [206, 214, 204] as const,
    surface: [246, 248, 242] as const,
    accent: [74, 93, 78] as const,
    warn: [181, 90, 90] as const,
    line: [225, 230, 221] as const,
    signal: {
      Normal: [74, 93, 78] as const,
      Elevated: [138, 109, 59] as const,
      "Watch-worthy": [154, 90, 44] as const,
      Strong: [181, 90, 90] as const,
      Aggressive: [156, 63, 63] as const,
    },
  };

  const typeScale = {
    title: 22,
    section: 12,
    body: 9,
    small: 8,
  };

  const drawLogo = (x: number, y: number, w: number, h: number) => {
    if (!logoData) return;
    doc.addImage(logoData, "PNG", x, y, w, h);
  };

  const addSectionTitle = (text: string, y: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(typeScale.section);
    doc.setTextColor(...theme.ink);
    doc.text(text, marginX, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(typeScale.body);
  };

  const drawDivider = (y: number) => {
    doc.setDrawColor(...theme.line);
    doc.line(marginX, y, marginX + contentWidth, y);
  };

  const drawPageHeader = () => {
    drawLogo(marginX, 28, 70, 26);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(typeScale.section);
    doc.setTextColor(...theme.ink);
    doc.text("Mutual Fund Health Check Report", marginX + 90, 44);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(typeScale.small);
    doc.setTextColor(...theme.muted);
    doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, pageWidth - marginX - 170, 44);
    drawDivider(56);
  };

  const drawFooter = () => {
    const pageInfo = doc.getCurrentPageInfo();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(typeScale.small);
    doc.setTextColor(...theme.muted);
    const footerLines = doc.splitTextToSize(DISCLAIMER_TEXT, contentWidth - 80);
    const footerY = pageHeight - 36 - (footerLines.length - 1) * 9;
    doc.text(footerLines, marginX, footerY);
    doc.text(`Page ${pageInfo.pageNumber}`, pageWidth - marginX - 50, pageHeight - 24);
  };

  const startNewPage = () => {
    drawFooter();
    doc.addPage();
    drawPageHeader();
    return 76;
  };

  const drawTable = (params: {
    headers: string[];
    rows: string[][];
    colWidths: number[];
    startY: number;
    title?: string;
  }) => {
    const { headers, rows, colWidths, startY, title } = params;
    let y = startY;
    const tableTop = y;
    if (title) {
      addSectionTitle(title, y);
      y += 14;
    }

    const drawHeader = () => {
      doc.setFillColor(...theme.surface);
      doc.setDrawColor(...theme.border);
      doc.rect(marginX, y, contentWidth, 20, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...theme.muted);
      let x = marginX + 8;
      headers.forEach((header, index) => {
        doc.text(header, x, y + 13);
        x += colWidths[index];
      });
      y += 24;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...theme.ink);

      let dividerX = marginX;
      colWidths.forEach((width) => {
        dividerX += width;
        doc.setDrawColor(...theme.line);
        doc.line(dividerX, y - 24, dividerX, y + 4);
      });
    };

    drawHeader();

    rows.forEach((row) => {
      if (y > pageHeight - 70) {
        y = startNewPage();
        drawHeader();
      }

      const cellLines = row.map((cell, index) =>
        doc.splitTextToSize(cell, colWidths[index] - 6)
      );
      const rowHeight = Math.max(...cellLines.map((lines) => lines.length)) * 10 + 8;
      let cellX = marginX + 8;
      cellLines.forEach((lines, index) => {
        doc.text(lines, cellX, y + 10);
        cellX += colWidths[index];
      });
      let dividerX = marginX;
      colWidths.forEach((width) => {
        dividerX += width;
        doc.setDrawColor(...theme.line);
        doc.line(dividerX, y, dividerX, y + rowHeight + 6);
      });
      y += rowHeight;
      doc.setDrawColor(...theme.line);
      doc.line(marginX, y, marginX + contentWidth, y);
      y += 6;
    });

    doc.setDrawColor(...theme.border);
    doc.rect(marginX, tableTop, contentWidth, y - tableTop, "S");

    return y;
  };

  doc.setFillColor(...theme.surface);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
  doc.setFillColor(...theme.accent);
  doc.rect(0, 0, 12, pageHeight, "F");
  drawLogo(marginX, 60, 90, 34);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(...theme.ink);
  doc.text("Mutual Fund Health Check", marginX, 130);
  doc.setFontSize(16);
  doc.setTextColor(...theme.muted);
  doc.text("Portfolio Report", marginX, 154);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(typeScale.body);
  doc.setTextColor(...theme.ink);
  doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, marginX, 180);
  doc.setFontSize(typeScale.body);
  doc.setTextColor(...theme.muted);
  doc.text(`PAN: ${holder.pan || "Unavailable"}`, marginX, 198);
  doc.text(`Email: ${holder.email || "Unavailable"}`, marginX, 214);

  const coverCardWidth = (contentWidth - 24) / 3;
  const coverCardY = 230;
  const coverCards = [
    { title: "Total value", value: formatCurrencyPlain(summary.totalValue) },
    { title: "Invested", value: formatCurrencyPlain(summary.invested) },
    { title: "Portfolio XIRR", value: formatPercent(xirrValue, 2) },
  ];
  coverCards.forEach((card, index) => {
    const x = marginX + index * (coverCardWidth + 12);
    doc.setDrawColor(...theme.border);
    doc.setFillColor(...theme.surface);
    doc.roundedRect(x, coverCardY, coverCardWidth, 60, 10, 10, "FD");
    doc.setFillColor(...theme.accent);
    doc.rect(x, coverCardY, 4, 60, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(typeScale.small);
    doc.setTextColor(...theme.muted);
    doc.text(card.title, x + 12, coverCardY + 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...theme.ink);
    doc.text(card.value, x + 12, coverCardY + 42);
  });

  startNewPage();
  let cursorY = 76;
  addSectionTitle("Portfolio summary", cursorY);
  cursorY += 14;

  cursorY = drawTable({
    headers: ["Investor details", "Value"],
    rows: [
      ["PAN", holder.pan || "Unavailable"],
      ["Email", holder.email || "Unavailable"],
    ],
    colWidths: [180, 260],
    startY: cursorY,
  });

  cursorY += 10;

  const cardWidth = (contentWidth - 16) / 2;
  const cardHeight = 50;
  const cardGap = 16;
  const cards = [
    { title: "Total value", value: formatCurrencyPlain(summary.totalValue) },
    { title: "Invested", value: formatCurrencyPlain(summary.invested) },
    { title: "All-time returns", value: formatCurrencyPlain(summary.allTimeProfit) },
    { title: "Portfolio XIRR", value: formatPercent(xirrValue, 2) },
    { title: "Monthly income (25x)", value: formatCurrencyPlain(summary.monthlyIncome) },
    { title: "Holdings count", value: `${report.holdingsCount}` },
  ];

  cards.forEach((card, index) => {
    const row = Math.floor(index / 2);
    const col = index % 2;
    const x = marginX + col * (cardWidth + cardGap);
    const y = cursorY + row * (cardHeight + 12);
    doc.setDrawColor(...theme.border);
    doc.setFillColor(...theme.surface);
    doc.rect(x, y, cardWidth, cardHeight, "FD");
    doc.setFillColor(...theme.accent);
    doc.rect(x, y, 4, cardHeight, "F");
    doc.setFontSize(typeScale.body);
    doc.setTextColor(...theme.muted);
    doc.text(card.title, x + 12, y + 16);
    doc.setFontSize(12);
    doc.setTextColor(...theme.ink);
    doc.text(card.value, x + 12, y + 36);
  });

  cursorY += Math.ceil(cards.length / 2) * (cardHeight + 12) + 8;

  drawDivider(cursorY);
  cursorY += 16;
  const performanceRows = [
    ["Current value", formatCurrencyPlain(summary.totalValue)],
    ["Invested", formatCurrencyPlain(summary.invested)],
    ["All-time returns", formatCurrencyPlain(summary.allTimeProfit)],
    ["Portfolio XIRR", formatPercent(xirrValue, 2)],
    ["Top fund share", `${(report.topOneShare * 100).toFixed(1)}%`],
    ["Top 5 share", `${(report.topFiveShare * 100).toFixed(1)}%`],
    ["Top AMC share", `${(report.topAmcShare * 100).toFixed(1)}%`],
  ];

  cursorY = drawTable({
    headers: ["Performance summary", "Value"],
    rows: performanceRows,
    colWidths: [260, 200],
    startY: cursorY,
  });

  cursorY += 10;
  drawDivider(cursorY);
  cursorY += 16;
  addSectionTitle("Allocation summary", cursorY);
  cursorY += 14;

  const categoryTotals = new Map<string, number>();
  report.fundDetails.forEach((fund) => {
    categoryTotals.set(fund.majorCategory, (categoryTotals.get(fund.majorCategory) || 0) + fund.currentValue);
  });
  const categoryRows = Array.from(categoryTotals.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .map((item) => [
      item.name,
      formatCurrencyPlain(item.value),
      `${((item.value / Math.max(summary.totalValue, 1)) * 100).toFixed(1)}%`,
    ]);

  cursorY = drawTable({
    headers: ["Category", "Current value", "Share"],
    rows: categoryRows,
    colWidths: [200, 170, 120],
    startY: cursorY,
  });

  const amcRows = report.amcBreakdown.slice(0, 8).map((item) => [
    item.name,
    formatCurrencyPlain(item.value),
    `${((item.value / Math.max(summary.totalValue, 1)) * 100).toFixed(1)}%`,
  ]);

  cursorY += 8;
  cursorY = drawTable({
    headers: ["AMC", "Current value", "Share"],
    rows: amcRows,
    colWidths: [220, 150, 120],
    startY: cursorY,
    title: "AMC concentration",
  });

  cursorY += 10;
  drawDivider(cursorY);
  cursorY += 16;
  addSectionTitle("Actionable insights", cursorY);
  cursorY += 12;

  report.insights.forEach((insight) => {
    const cardHeightBase = 56;
    if (cursorY > pageHeight - 130) {
      cursorY = startNewPage();
    }
    const signalColor = theme.signal[insight.signal] || theme.accent;
    const signalTextColor =
      insight.signal === "Strong" || insight.signal === "Aggressive"
        ? [255, 255, 255]
        : theme.ink;
    const borderColor =
      insight.severity === "warning" ? theme.warn : insight.severity === "positive" ? theme.accent : theme.border;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(typeScale.body);
    doc.setTextColor(...theme.ink);
    const observationLines = doc.splitTextToSize(`Observation: ${insight.observation}`, contentWidth - 24);
    const meaningLines = doc.splitTextToSize(`What this indicates: ${insight.meaning}`, contentWidth - 24);
    const reassuranceLines = doc.splitTextToSize(`Reassurance: ${insight.reassurance}`, contentWidth - 24);
    const actionLines = doc.splitTextToSize(`Suggested check: ${insight.suggestedCheck}`, contentWidth - 24);
    const contentHeight =
      (observationLines.length + meaningLines.length + reassuranceLines.length + actionLines.length) * 10 + 36;
    const boxHeight = Math.max(cardHeightBase, contentHeight + 24);

    doc.setDrawColor(...borderColor);
    doc.setFillColor(...theme.surface);
    doc.roundedRect(marginX, cursorY, contentWidth, boxHeight, 10, 10, "FD");
    doc.setFillColor(...theme.line);
    doc.roundedRect(marginX, cursorY, 6, boxHeight, 8, 8, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...theme.ink);
    doc.text(insight.title, marginX + 14, cursorY + 16);
    const signalText = insight.signal.toUpperCase();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(typeScale.small);
    const signalWidth = doc.getTextWidth(signalText) + 14;
    const signalX = marginX + contentWidth - signalWidth - 10;
    doc.setDrawColor(...theme.border);
    doc.setFillColor(...signalColor);
    doc.roundedRect(signalX, cursorY + 6, signalWidth, 16, 8, 8, "FD");
    doc.setTextColor(...signalTextColor);
    doc.text(signalText, signalX + 7, cursorY + 18);

    doc.setTextColor(...theme.ink);

    let innerY = cursorY + 32;
    doc.text(observationLines, marginX + 12, innerY);
    innerY += observationLines.length * 10;
    doc.text(meaningLines, marginX + 12, innerY);
    innerY += meaningLines.length * 10;
    doc.setTextColor(...theme.muted);
    doc.text(reassuranceLines, marginX + 12, innerY);
    innerY += reassuranceLines.length * 10;
    doc.setTextColor(...theme.ink);
    doc.text(actionLines, marginX + 12, innerY);

    cursorY += boxHeight + 12;
  });

  if (report.insightSummary) {
    if (cursorY > pageHeight - 90) {
      cursorY = startNewPage();
    }
    doc.setDrawColor(...theme.border);
    doc.setFillColor(...theme.surface);
    doc.roundedRect(marginX, cursorY, contentWidth, 44, 8, 8, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(typeScale.body);
    doc.setTextColor(...theme.ink);
    doc.text(doc.splitTextToSize(report.insightSummary, contentWidth - 20), marginX + 10, cursorY + 26);
    cursorY += 56;
  }

  if (cursorY > pageHeight - 90) {
    cursorY = startNewPage();
  }
  doc.setDrawColor(...theme.border);
  doc.setFillColor(...theme.surface);
  doc.roundedRect(marginX, cursorY, contentWidth, 48, 8, 8, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(typeScale.small);
  doc.setTextColor(...theme.muted);
  doc.text(
    "Signal guide: Normal = healthy range, Elevated = review soon, Watch-worthy = monitor closely, Strong/Aggressive = high attention area.",
    marginX + 10,
    cursorY + 28,
    { maxWidth: contentWidth - 20 }
  );
  cursorY += 60;

  cursorY = startNewPage();
  addSectionTitle("Holdings detail", cursorY);
  cursorY += 14;

  const holdingsRows = report.fundDetails.map((fund) => [
    fund.name,
    formatNumberPlain(fund.units, 3),
    formatNumberPlain(fund.nav, 2),
    formatCurrencyPlain(fund.invested),
    formatCurrencyPlain(fund.currentValue),
    formatCurrencyPlain(fund.profit),
    formatPercent(fund.xirr, 2),
  ]);

  drawTable({
    headers: ["Fund", "Units", "NAV", "Invested", "Current", "Gain", "XIRR"],
    rows: holdingsRows,
    colWidths: [170, 55, 55, 70, 70, 55, 40],
    startY: cursorY,
  });

  cursorY += 18;
  drawFooter();

  doc.save("nivesify-mfhc-report.pdf");
};

export const tooltips = {
  totalValue: "Latest market value of all mutual fund holdings.",
  invested: "Total amount invested from your transactions (net of redemptions).",
  allTimeReturns: "Unrealised + realised gains across your portfolio.",
  xirr: "Annualised return based on your cashflows.",
  monthlyIncome: "Illustrative monthly income if portfolio is 25x yearly expenses.",
  holdings: "Funds with current value greater than zero.",
  topFund: "Share of the single largest fund in your portfolio.",
  topFive: "Share of top five funds combined in your portfolio.",
};
