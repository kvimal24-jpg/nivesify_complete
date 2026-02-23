import { InvestmentsData, MatchingScheme } from "./types";
import type { Portfolio } from "./portfolio";
import { buildCashflows } from "./cashflows";
import { xirr } from "./xirr";

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type ReportInsight = {
  title: string;
  signal: "Normal" | "Elevated" | "Watch-worthy" | "Strong" | "Aggressive";
  observation: string;
  meaning: string;
  reassurance: string;
  suggestedCheck: string;
  severity: "info" | "warning" | "positive";
};

export type PdfInsightMetric = { title: string; value: string; note: string };
export type PdfAuditRow = { name: string; benchmark?: string; gap?: string; tracking?: string; action: string };
export type PdfInsightCard = { title: string; summary: string; detail: string };
export type PdfInsights = {
  metrics: PdfInsightMetric[];
  executiveSummary: string;
  activeAuditRows: PdfAuditRow[];
  passiveAuditRows: PdfAuditRow[];
  insightCards: PdfInsightCard[];
};
export type SchemeBreakdownNode = { name: string; size?: number; children?: SchemeBreakdownNode[]; value?: number };
export type AmcBreakdown = { name: string; value: number }[];
export type ReportData = {
  holdingsCount: number; topOneShare: number; topFiveShare: number; topAmcShare: number;
  insights: ReportInsight[]; insightSummary: string;
  schemeBreakdown: SchemeBreakdownNode; amcBreakdown: AmcBreakdown;
  topHoldings: Array<{ name: string; value: number }>;
  fundDetails: Array<{
    name: string; invested: number; currentValue: number; profit: number;
    units: number; nav: number; xirr: number | null;
    nomineeStatus: "yes" | "no" | "partial" | "unknown";
    amc: string; schemeCategory: string; majorCategory: string;
  }>;
};

// ─────────────────────────────────────────────────────────────────────────────
// FORMATTERS  — currency always as "₹X.XX Cr / L / plain"
// (canvas can render ₹ perfectly, unlike jsPDF Helvetica)
// ─────────────────────────────────────────────────────────────────────────────

const fmtCur = (v: number): string => {
  const n = Number.isFinite(v) ? v : 0;
  const a = Math.abs(n), s = n < 0 ? "-" : "";
  if (a >= 10_000_000) return `${s}₹${(a / 10_000_000).toFixed(2)} Cr`;
  if (a >= 100_000)    return `${s}₹${(a / 100_000).toFixed(2)} L`;
  if (a >= 1_000)      return `${s}₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(a)}`;
  return `${s}₹${a.toFixed(0)}`;
};
const fmtPct = (v: number | null, d = 2) => v === null || !Number.isFinite(v) ? "N/A" : `${(v * 100).toFixed(d)}%`;
const fmtShare = (v: number) => `${(Math.max(0, v) * 100).toFixed(1)}%`;

const classifyCategory = (c?: string) => {
  if (!c) return "Other";
  const l = c.toLowerCase();
  if (l.includes("equity")) return "Equity";
  if (l.includes("debt") || l.includes("bond") || l.includes("gilt")) return "Debt";
  if (l.includes("hybrid") || l.includes("balanced")) return "Hybrid";
  return "Other";
};
const deriveAmc = (meta?: MatchingScheme, fb?: string) => {
  if (meta?.amc) return meta.amc;
  const n = meta?.schemeName || fb || "";
  return (n.match(/^(.*?Mutual Fund)/i)?.[1] ?? n.split(" ")[0]) || "Other";
};

// ─────────────────────────────────────────────────────────────────────────────
// buildReportData
// ─────────────────────────────────────────────────────────────────────────────

const buildSchemeMetaMap = (txns: InvestmentsData["transactions"] = [], lookup?: Map<number, MatchingScheme>) => {
  const m = new Map<number, MatchingScheme>();
  txns.forEach(t => { if (t.matchingScheme?.schemeCode) m.set(t.matchingScheme.schemeCode, t.matchingScheme); });
  lookup?.forEach((s, c) => m.set(c, { ...(m.get(c) ?? {} as MatchingScheme), ...s }));
  return m;
};

const IT = { modMax:6, advMax:8, upperLimit:10, sfElevated:.2, sfWatch:.3, sfStrong:.4, t5Elevated:.6, t5Watch:.65, t5Strong:.75, amcEl:.3, amcW:.4, amcSt:.45, eqLow:.3, eqVeryLow:.25, eqHigh:.85, eqAgg:.9, debtHi:.7, debtSt:.75, hybHi:.6, hybW:.7, xirrLow:.07, xirrSt:.13 };

export const buildReportData = (data: InvestmentsData, portfolio: Portfolio, totalValue: number, xirrValue: number | null, schemeLookup?: Map<number, MatchingScheme>): ReportData => {
  const nomineeMap = data.nominees || {};
  const meta = buildSchemeMetaMap(data.transactions || [], schemeLookup);
  const active = portfolio.filter(r => r.currentValue > 0);
  const sorted = [...active].sort((a, b) => b.currentValue - a.currentValue);
  const holdingsCount = active.length;
  const topOneShare = totalValue ? (sorted[0]?.currentValue || 0) / totalValue : 0;
  const topFiveShare = totalValue ? sorted.slice(0, 5).reduce((s, f) => s + f.currentValue, 0) / totalValue : 0;

  const schemeRoot: SchemeBreakdownNode = { name: "All Schemes", children: [] };
  const majMap = new Map<string, SchemeBreakdownNode>();
  active.forEach(row => {
    const m2 = meta.get(row.schemeCode), maj = classifyCategory(m2?.schemeCategory), sub = m2?.schemeCategory || "Uncategorized";
    if (!majMap.has(maj)) { const n = { name: maj, children: [] as SchemeBreakdownNode[], size: 0 }; majMap.set(maj, n); schemeRoot.children?.push(n); }
    const majNode = majMap.get(maj)!;
    let subNode = majNode.children?.find(c => c.name === sub);
    if (!subNode) { subNode = { name: sub, children: [], size: 0 }; majNode.children?.push(subNode); }
    const v = Math.max(0, row.currentValue);
    subNode.children?.push({ name: row.mfName, size: v, value: v });
    (subNode as any).size = (subNode.size || 0) + v;
    (majNode as any).size = (majNode.size || 0) + v;
  });

  const amcMap = new Map<string, number>();
  active.forEach(row => { const amc = deriveAmc(meta.get(row.schemeCode), row.mfName); amcMap.set(amc, (amcMap.get(amc) || 0) + Math.max(0, row.currentValue)); });
  const amcBreakdown = Array.from(amcMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const topAmcShare = totalValue ? (amcBreakdown[0]?.value || 0) / totalValue : 0;

  const allocMap = new Map<string, number>();
  active.forEach(row => { const b = classifyCategory(meta.get(row.schemeCode)?.schemeCategory); allocMap.set(b, (allocMap.get(b) || 0) + Math.max(0, row.currentValue)); });
  const eq = totalValue ? (allocMap.get("Equity") || 0) / totalValue : 0;
  const debt = totalValue ? (allocMap.get("Debt") || 0) / totalValue : 0;
  const hyb = totalValue ? (allocMap.get("Hybrid") || 0) / totalValue : 0;

  const insights: ReportInsight[] = [];
  const p = (i: ReportInsight) => insights.push(i);
  if (holdingsCount > IT.advMax) p({ title: "Over-diversification", signal: holdingsCount > IT.upperLimit ? "Strong" : "Watch-worthy", observation: `You hold ${holdingsCount} active funds.`, meaning: "Most retail portfolios need 3–6 funds. Beyond 8–10, overlap rises and strong performers get diluted.", reassurance: "Common as portfolios grow; correctable without disrupting goals.", suggestedCheck: "Consolidate similar schemes. Target: Equity 3–5, Debt 1–3, Hybrid 1–2, ELSS 1.", severity: holdingsCount > IT.upperLimit ? "warning" : "info" });
  else if (holdingsCount > IT.modMax) p({ title: "Diversification at high end", signal: "Elevated", observation: `You hold ${holdingsCount} active funds.`, meaning: "At the upper end — dilutes strong performers.", reassurance: "Manageable if each fund has a distinct role.", suggestedCheck: "Verify each fund has a unique purpose; prune annually.", severity: "info" });
  if (topOneShare >= IT.sfElevated) { const sig = topOneShare >= IT.sfStrong ? "Strong" : topOneShare >= IT.sfWatch ? "Watch-worthy" : "Elevated"; p({ title: "Single-fund exposure", signal: sig, observation: `Largest fund: ${fmtShare(topOneShare)} of portfolio.`, meaning: "Meaningful concentration — not risky if intentional.", reassurance: "Core holdings naturally grow as they compound.", suggestedCheck: "Confirm alignment with goals; rebalance only if accidental.", severity: sig === "Strong" ? "warning" : "info" }); }
  if (topFiveShare >= IT.t5Elevated) { const sig = topFiveShare >= IT.t5Strong ? "Strong" : topFiveShare >= IT.t5Watch ? "Watch-worthy" : "Elevated"; p({ title: "Top 5 funds dominate", signal: sig, observation: `Top 5: ${fmtShare(topFiveShare)} of portfolio.`, meaning: "Typical of structured portfolios where core funds lead.", reassurance: "Fine if funds are meaningfully different.", suggestedCheck: "Check overlap; consolidate if similar.", severity: sig === "Strong" ? "warning" : "info" }); }
  if (topAmcShare >= IT.amcEl) { const sig = topAmcShare >= IT.amcSt ? "Strong" : topAmcShare >= IT.amcW ? "Watch-worthy" : "Elevated"; p({ title: "AMC concentration", signal: sig, observation: `Top AMC: ${fmtShare(topAmcShare)}.`, meaning: "High AMC share increases operational dependency.", reassurance: "Acceptable when reflecting deliberate philosophy preference.", suggestedCheck: "Would you deliberately choose this AMC today?", severity: sig === "Strong" ? "warning" : "info" }); }
  if (xirrValue !== null && xirrValue < IT.xirrLow && eq >= .4) p({ title: "Performance below expectation", signal: "Watch-worthy", observation: `XIRR: ${(xirrValue * 100).toFixed(2)}%.`, meaning: "Low for an equity-heavy portfolio.", reassurance: "Short windows can temporarily depress XIRR.", suggestedCheck: "Review persistent underperformers; check equity/debt mix.", severity: "warning" });
  else if (xirrValue !== null && xirrValue >= IT.xirrSt) p({ title: "Strong performance signal", signal: "Strong", observation: `XIRR: ${(xirrValue * 100).toFixed(2)}%.`, meaning: "Strong long-term return — sound portfolio structure.", reassurance: "Consistent returns reflect disciplined behaviour.", suggestedCheck: "Maintain discipline; review if any fund mandate changes.", severity: "positive" });
  if (eq > 0 && eq < IT.eqLow) p({ title: "Low equity allocation", signal: eq < IT.eqVeryLow ? "Watch-worthy" : "Elevated", observation: `Equity: ${fmtShare(eq)}.`, meaning: "Low equity limits long-term growth.", reassurance: "Appropriate for near-term goals.", suggestedCheck: "If horizon 7+ years, consider higher equity.", severity: "info" });
  if (eq > IT.eqHigh) p({ title: "High equity allocation", signal: eq > IT.eqAgg ? "Aggressive" : "Strong", observation: `Equity: ${fmtShare(eq)}.`, meaning: "High-growth but high drawdown risk.", reassurance: "Effective for long horizons with volatility tolerance.", suggestedCheck: "Ensure alignment with horizon, liquidity, and tolerance.", severity: "info" });
  if (debt > IT.debtHi) p({ title: "High debt allocation", signal: debt > IT.debtSt ? "Watch-worthy" : "Elevated", observation: `Debt: ${fmtShare(debt)}.`, meaning: "Can underperform inflation long-term.", reassurance: "Right for capital preservation.", suggestedCheck: "Confirm matches risk profile and liquidity timeline.", severity: "info" });
  if (hyb > IT.hybHi) p({ title: "High hybrid allocation", signal: hyb > IT.hybW ? "Watch-worthy" : "Elevated", observation: `Hybrid: ${fmtShare(hyb)}.`, meaning: "Reduces direct control over asset split.", reassurance: "Effective for simplified allocation.", suggestedCheck: "Check desired asset mix and tax preferences.", severity: "info" });
  if (!insights.length) p({ title: "Portfolio structure looks healthy", signal: "Normal", observation: "No major concentration risks detected.", meaning: "Key checks within typical ranges for long-term investors.", reassurance: "Stable, deliberate structure.", suggestedCheck: "Continue periodic reviews; rebalance if goals change.", severity: "positive" });

  const fundDetails = sorted.map(fund => {
    const m2 = meta.get(fund.schemeCode);
    const cf = buildCashflows(fund.allTransactions.map(t => ({ amount: Math.abs(t.amount), date: new Date(t.date), type: t.type === "Investment" ? "buy" as const : "sell" as const })), fund.currentValue, new Date(), fund.currentValue > 0);
    const folios = Array.from(new Set(fund.allTransactions.map(t => t.folio?.split("/")[0].trim()).filter(Boolean) as string[]));
    const flags = folios.map(f => nomineeMap[f]).filter(f => f !== undefined);
    let ns: "yes" | "no" | "partial" | "unknown" = "unknown";
    if (flags.length) { const y = flags.some(f => f === true), n = flags.some(f => f === false); ns = y && n ? "partial" : y ? "yes" : "no"; if (flags.length < folios.length) ns = "partial"; }
    return { name: fund.mfName, invested: fund.currentInvested, currentValue: fund.currentValue, profit: fund.profit, units: fund.currentUnits || 0, nav: fund.latestPrice || 0, xirr: xirr(cf), nomineeStatus: ns, amc: deriveAmc(m2, fund.mfName), schemeCategory: m2?.schemeCategory || "Uncategorized", majorCategory: classifyCategory(m2?.schemeCategory) };
  });

  return { holdingsCount, topOneShare, topFiveShare, topAmcShare, insights, insightSummary: insights.some(i => i.severity === "warning") ? "Your portfolio shows areas to review, but the structure appears intentional." : "Your portfolio reflects deliberate long-term intent.", schemeBreakdown: schemeRoot, amcBreakdown, topHoldings: sorted.slice(0, 5).map(f => ({ name: f.mfName, value: f.currentValue })), fundDetails };
};

export const formatCurrencyPlain = fmtCur;
export const tooltips = { totalValue: "Latest market value of all mutual fund holdings.", invested: "Total amount invested from your transactions (net of redemptions).", allTimeReturns: "Unrealised + realised gains across your portfolio.", xirr: "Annualised return based on your cashflows.", monthlyIncome: "Illustrative monthly income if portfolio is 25x yearly expenses.", holdings: "Funds with current value greater than zero.", topFund: "Share of the single largest fund in your portfolio.", topFive: "Share of top five funds combined in your portfolio." };

// ─────────────────────────────────────────────────────────────────────────────
// CANVAS PDF ENGINE
// Renders each page to an HTML Canvas element, then exports JPEG into jsPDF.
// This gives 100% correct rendering: real fonts, real ₹ symbol, no encoding bugs.
// ─────────────────────────────────────────────────────────────────────────────

const SCALE    = 2;           // retina scale for crispness
const PW_PT    = 595;         // A4 width in points
const PH_PT    = 842;         // A4 height in points
const PW       = PW_PT * SCALE;
const PH       = PH_PT * SCALE;
const ML       = 40 * SCALE;
const MR       = 40 * SCALE;
const CW       = PW - ML - MR;

// Colours
const C = {
  navy:    "#0f172a", navyMd:  "#16244a", navyLt:  "#1e3a5f",
  green:   "#16a34a", greenDk: "#14532d", greenLt: "#dcfce7", greenBd: "#86efac",
  blue:    "#2563eb", blueLt:  "#dbeafe", blueMd:  "#3b82f6",
  teal:    "#0d9488", tealLt:  "#ccfbf1",
  amber:   "#b45309", amberLt: "#fef3c7", amberBd: "#fcd34d",
  red:     "#b91c1c", redLt:   "#fee2e2",  redBd:   "#fca5a5",
  purple:  "#7c3aed", purpleLt:"#f5f3ff",
  orange:  "#c2410c",
  white:   "#ffffff", ink:     "#0f172a",  inkMd:   "#334155",
  inkSoft: "#64748b", inkFaint:"#94a3b8",
  surface: "#f8fafc", surfMd:  "#f1f5f9",
  border:  "#e2e8f0", borderMd:"#cbd5e1",
};
const ACCENTS = [C.blue, C.green, C.amber, C.purple, C.red, C.teal, C.orange, "#0891b2", "#be185d"];

type Ctx = CanvasRenderingContext2D;

// ── Canvas helpers ────────────────────────────────────────────────────────────

const loadFont = async () => {
  // Ensure DM Sans is loaded for canvas
  try {
    await document.fonts.load(`bold ${14 * SCALE}px "DM Sans"`);
    await document.fonts.load(`${12 * SCALE}px "DM Sans"`);
  } catch { /* ignore */ }
};

const newCanvas = (): [HTMLCanvasElement, Ctx] => {
  const c = document.createElement("canvas");
  c.width = PW; c.height = PH;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, PW, PH);
  return [c, ctx];
};

/** Truncate text to fit maxWidth. Returns truncated string. */
const trunc = (ctx: Ctx, text: string, maxW: number): string => {
  if (!text) return "";
  if (ctx.measureText(text).width <= maxW) return text;
  let lo = 0, hi = text.length;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    ctx.measureText(text.slice(0, mid) + "…").width <= maxW ? (lo = mid) : (hi = mid);
  }
  return text.slice(0, lo) + "…";
};

/** Word-wrap text into lines fitting maxWidth */
const wrapLines = (ctx: Ctx, text: string, maxW: number, maxLines = 99): string[] => {
  const words = String(text || "").split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxW && current) {
      lines.push(current);
      current = word;
      if (lines.length >= maxLines - 1) { current = word; break; }
    } else {
      current = test;
    }
  }
  if (current) {
    if (lines.length >= maxLines) {
      // truncate last line
      lines[lines.length - 1] = trunc(ctx, lines[lines.length - 1] + " " + current, maxW);
    } else {
      lines.push(current);
    }
  }
  return lines.slice(0, maxLines);
};

/** Rounded rectangle path */
const roundRect = (ctx: Ctx, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

/** Draw header band + footer for each page */
const drawPageChrome = (ctx: Ctx, pageNum: number, logoImg: HTMLImageElement | null) => {
  const HDR = 54 * SCALE;

  // Header background
  ctx.fillStyle = C.navy;
  ctx.fillRect(0, 0, PW, HDR);

  // Green accent line at bottom of header
  ctx.fillStyle = C.green;
  ctx.fillRect(0, HDR - 2 * SCALE, PW, 2 * SCALE);

  // Logo
  if (logoImg) {
    try { ctx.drawImage(logoImg, ML, 13 * SCALE, 24 * SCALE, 24 * SCALE); } catch { /* skip */ }
  }
  const lx = logoImg ? ML + 30 * SCALE : ML;

  ctx.fillStyle = C.white;
  ctx.font = `bold ${10 * SCALE}px "DM Sans", "Inter", sans-serif`;
  ctx.fillText("Nivesify", lx, 27 * SCALE);
  ctx.fillStyle = C.inkFaint;
  ctx.font = `${8 * SCALE}px "DM Sans", "Inter", sans-serif`;
  ctx.fillText("Thoughtful Money, Better Life", lx, 39 * SCALE);

  // Right side: title + page
  ctx.fillStyle = C.white;
  ctx.font = `bold ${9 * SCALE}px "DM Sans", "Inter", sans-serif`;
  const titleStr = "Mutual Fund Health Check";
  const titleW = ctx.measureText(titleStr).width;
  ctx.fillText(titleStr, PW - MR - titleW, 26 * SCALE);

  ctx.fillStyle = C.inkFaint;
  ctx.font = `${7.5 * SCALE}px "DM Sans", "Inter", sans-serif`;
  const dateStr = `Page ${pageNum}  ·  ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`;
  const dateW = ctx.measureText(dateStr).width;
  ctx.fillText(dateStr, PW - MR - dateW, 38 * SCALE);

  // Footer
  const FY = PH - 34 * SCALE;
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 0.5 * SCALE;
  ctx.beginPath(); ctx.moveTo(ML, FY); ctx.lineTo(PW - MR, FY); ctx.stroke();

  ctx.fillStyle = C.inkFaint;
  ctx.font = `${7 * SCALE}px "DM Sans", "Inter", sans-serif`;
  const disc = "Past performance is not a guarantee of future results. Consult a SEBI-registered investment advisor before acting on any information in this report.";
  const discLines = wrapLines(ctx, disc, CW - 50 * SCALE, 2);
  discLines.forEach((l, i) => ctx.fillText(l, ML, FY + 13 * SCALE + i * 10 * SCALE));

  // Page number chip
  ctx.font = `bold ${8 * SCALE}px "DM Sans", "Inter", sans-serif`;
  const pgStr = String(pageNum);
  const pgW = ctx.measureText(pgStr).width + 12 * SCALE;
  roundRect(ctx, PW - MR - pgW, FY + 5 * SCALE, pgW, 15 * SCALE, 4 * SCALE);
  ctx.fillStyle = C.green; ctx.fill();
  ctx.fillStyle = C.white;
  ctx.fillText(pgStr, PW - MR - pgW / 2 - ctx.measureText(pgStr).width / 2, FY + 15.5 * SCALE);
};

/** Draw a section header: coloured pill + large title + accent underline */
const drawSectionHead = (ctx: Ctx, tag: string, title: string, x: number, y: number, accent: string): number => {
  // Pill
  ctx.font = `bold ${7.5 * SCALE}px "DM Sans", "Inter", sans-serif`;
  const pillW = ctx.measureText(tag.toUpperCase()).width + 14 * SCALE;
  roundRect(ctx, x, y, pillW, 15 * SCALE, 3 * SCALE);
  ctx.fillStyle = accent; ctx.fill();
  ctx.fillStyle = C.white;
  ctx.fillText(tag.toUpperCase(), x + 7 * SCALE, y + 10.5 * SCALE);
  y += 20 * SCALE;

  // Title
  ctx.font = `bold ${17 * SCALE}px "DM Sans", "Inter", sans-serif`;
  ctx.fillStyle = C.ink;
  ctx.fillText(title, x, y);
  y += 5 * SCALE;

  // Underline
  ctx.fillStyle = accent;
  ctx.fillRect(x, y, 50 * SCALE, 2.5 * SCALE);
  y += 14 * SCALE;

  return y;
};

/** KPI metric card */
const drawMetricCard = (ctx: Ctx, x: number, y: number, w: number, h: number, label: string, value: string, note: string, accent: string) => {
  // Shadow
  ctx.shadowColor = "rgba(0,0,0,0.06)";
  ctx.shadowBlur = 8 * SCALE;
  ctx.shadowOffsetY = 2 * SCALE;

  roundRect(ctx, x, y, w, h, 6 * SCALE);
  ctx.fillStyle = C.white; ctx.fill();
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

  ctx.strokeStyle = C.border; ctx.lineWidth = 0.5 * SCALE;
  roundRect(ctx, x, y, w, h, 6 * SCALE); ctx.stroke();

  // Left accent bar
  roundRect(ctx, x, y, 4 * SCALE, h, 6 * SCALE);
  ctx.fillStyle = accent; ctx.fill();
  ctx.fillRect(x + 2 * SCALE, y, 2 * SCALE, h);

  // Label
  ctx.font = `${7.5 * SCALE}px "DM Sans", "Inter", sans-serif`;
  ctx.fillStyle = C.inkFaint;
  ctx.fillText(trunc(ctx, label, w - 20 * SCALE), x + 12 * SCALE, y + 16 * SCALE);

  // Value
  ctx.font = `bold ${13 * SCALE}px "DM Sans", "Inter", sans-serif`;
  ctx.fillStyle = accent;
  ctx.fillText(trunc(ctx, value, w - 18 * SCALE), x + 12 * SCALE, y + 34 * SCALE);

  // Note
  if (note) {
    ctx.font = `${7.5 * SCALE}px "DM Sans", "Inter", sans-serif`;
    ctx.fillStyle = C.inkFaint;
    ctx.fillText(trunc(ctx, note, w - 18 * SCALE), x + 12 * SCALE, y + 49 * SCALE);
  }
};

/** 
 * Stacked horizontal bar chart 
 * Returns new Y after rendering 
 */
const drawStackedBar = (ctx: Ctx, items: { label: string; value: number; color: string }[], total: number, x: number, y: number, w: number): number => {
  const barH = 16 * SCALE;

  // Track background
  roundRect(ctx, x, y, w, barH, 3 * SCALE);
  ctx.fillStyle = C.surfMd; ctx.fill();

  let bx = x;
  items.forEach((item, i) => {
    const bw = total > 0 ? (item.value / total) * w : 0;
    if (bw < 1) return;
    if (i === 0) { roundRect(ctx, bx, y, bw, barH, 3 * SCALE); } 
    else if (i === items.length - 1) { ctx.beginPath(); ctx.rect(bx, y, bw - 3 * SCALE, barH); ctx.quadraticCurveTo(bx + bw, y, bx + bw, y + 3 * SCALE); ctx.lineTo(bx + bw, y + barH - 3 * SCALE); ctx.quadraticCurveTo(bx + bw, y + barH, bx + bw - 3 * SCALE, y + barH); ctx.lineTo(bx, y + barH); ctx.closePath(); }
    else { ctx.beginPath(); ctx.rect(bx, y, bw, barH); ctx.closePath(); }
    ctx.fillStyle = item.color; ctx.fill();
    bx += bw;
  });

  // Stroke
  ctx.strokeStyle = C.borderMd; ctx.lineWidth = 0.5 * SCALE;
  roundRect(ctx, x, y, w, barH, 3 * SCALE); ctx.stroke();
  y += barH + 8 * SCALE;

  // Legend
  let lx = x;
  ctx.font = `${7.5 * SCALE}px "DM Sans", "Inter", sans-serif`;
  for (const item of items) {
    const pct = total > 0 ? (item.value / total) * 100 : 0;
    if (pct < 0.3) continue;
    const label = `${item.label.length > 20 ? item.label.slice(0, 19) + "." : item.label}  ${pct.toFixed(1)}%`;
    const lw2 = ctx.measureText(label).width + 18 * SCALE;
    if (lx + lw2 > x + w) { y += 13 * SCALE; lx = x; }
    roundRect(ctx, lx, y - 7 * SCALE, 9 * SCALE, 9 * SCALE, 2 * SCALE);
    ctx.fillStyle = item.color; ctx.fill();
    ctx.fillStyle = C.inkMd; ctx.fillText(label, lx + 13 * SCALE, y + 0.5 * SCALE);
    lx += lw2 + 6 * SCALE;
  }
  y += 14 * SCALE;
  return y;
};

/** Draw a full data table. Returns new Y. */
const drawTable = (
  ctx: Ctx,
  cols: { h: string; w: number; align?: "L" | "R" | "C"; numColor?: boolean }[],
  rows: string[][],
  x: number, startY: number,
  opts: { maxLines?: number } = {}
): number => {
  const { maxLines = 3 } = opts;
  const totalW = cols.reduce((s, c) => s + c.w, 0);
  const scale2 = CW / totalW;
  const ws = cols.map(c => c.w * scale2);
  const colX = (i: number) => x + ws.slice(0, i).reduce((s, w) => s + w, 0);

  const HDR_H = 22 * SCALE;
  const PAD_X = 8 * SCALE;
  const PAD_Y = 7 * SCALE;
  const LINE_H = 11 * SCALE;
  const ROW_MIN = 22 * SCALE;

  let Y2 = startY;

  // Header
  roundRect(ctx, x, Y2, CW, HDR_H, 0);
  ctx.fillStyle = C.navyMd; ctx.fill();
  cols.forEach((col, i) => {
    const cx = colX(i);
    ctx.font = `bold ${7.5 * SCALE}px "DM Sans", "Inter", sans-serif`;
    ctx.fillStyle = C.inkFaint;
    const hdr = trunc(ctx, col.h.toUpperCase(), ws[i] - PAD_X * 2);
    const hw = ctx.measureText(hdr).width;
    const tx = col.align === "R" ? cx + ws[i] - PAD_X - hw : col.align === "C" ? cx + (ws[i] - hw) / 2 : cx + PAD_X;
    ctx.fillText(hdr, tx, Y2 + HDR_H * 0.65);
    if (i < cols.length - 1) {
      ctx.strokeStyle = C.navyLt; ctx.lineWidth = 0.3 * SCALE;
      ctx.beginPath(); ctx.moveTo(cx + ws[i], Y2 + 3 * SCALE); ctx.lineTo(cx + ws[i], Y2 + HDR_H - 3 * SCALE); ctx.stroke();
    }
  });
  Y2 += HDR_H;

  rows.forEach((row, ri) => {
    // Pre-compute cell content
    const cells = cols.map((col, ci) => {
      const raw = String(row[ci] ?? "—");
      ctx.font = `${9 * SCALE}px "DM Sans", "Inter", sans-serif`;
      return { lines: wrapLines(ctx, raw, ws[ci] - PAD_X * 2, maxLines), col, raw };
    });
    const maxL = Math.max(...cells.map(c => c.lines.length), 1);
    const rowH = Math.max(ROW_MIN, maxL * LINE_H + PAD_Y * 2);

    const ry = Y2;
    ctx.fillStyle = ri % 2 === 0 ? C.white : C.surface;
    ctx.fillRect(x, ry, CW, rowH);

    cells.forEach(({ lines, col, raw }, ci) => {
      const cx = colX(ci);
      const aw = ws[ci] - PAD_X * 2;
      const totalTH = lines.length * LINE_H;
      const vOff = (rowH - totalTH) / 2;

      lines.forEach((line, li) => {
        const ty = ry + vOff + (li + 1) * LINE_H - 2 * SCALE;
        ctx.font = `${9 * SCALE}px "DM Sans", "Inter", sans-serif`;

        // Colour for numeric/signal columns
        let color = C.ink;
        if (col.numColor) {
          const n = parseFloat(raw.replace(/[^0-9.-]/g, ""));
          if (raw.includes("+") || (!raw.includes("-") && isFinite(n) && n > 0)) color = C.green;
          else if (raw.includes("-") || (isFinite(n) && n < 0)) color = C.red;
        }
        if (raw.toLowerCase().includes("continue")) color = C.green;
        else if (raw.toLowerCase().includes("review") || raw.toLowerCase().includes("exit")) color = C.amber;

        ctx.fillStyle = color;
        const clamped = trunc(ctx, line, aw);
        const tw = ctx.measureText(clamped).width;
        const tx = col.align === "R" ? cx + ws[ci] - PAD_X - tw : col.align === "C" ? cx + (ws[ci] - tw) / 2 : cx + PAD_X;
        ctx.fillText(clamped, tx, ty);
      });

      if (ci < cols.length - 1) {
        ctx.strokeStyle = C.border; ctx.lineWidth = 0.3 * SCALE;
        ctx.beginPath(); ctx.moveTo(cx + ws[ci], ry); ctx.lineTo(cx + ws[ci], ry + rowH); ctx.stroke();
      }
    });

    ctx.strokeStyle = C.border; ctx.lineWidth = 0.25 * SCALE;
    ctx.beginPath(); ctx.moveTo(x, Y2 + rowH); ctx.lineTo(x + CW, Y2 + rowH); ctx.stroke();
    Y2 += rowH;
  });

  return Y2 + 8 * SCALE;
};

/** Draw an insight card. Returns new Y. */
const drawInsightCard = (ctx: Ctx, card: PdfInsightCard, idx: number, type: "critical" | "warning" | "info" | "ok", x: number, y: number): number => {
  const pal = {
    critical: { bg: C.redLt,    border: C.redBd,   accent: C.red,    tag: "ACTION NEEDED" },
    warning:  { bg: C.amberLt,  border: C.amberBd, accent: C.amber,  tag: "REVIEW"        },
    info:     { bg: C.blueLt,   border: "#93c5fd",  accent: C.blue,   tag: "INFO"          },
    ok:       { bg: C.greenLt,  border: C.greenBd, accent: C.green,  tag: "LOOKING GOOD"  },
  }[type];

  // Pre-measure
  ctx.font = `bold ${10 * SCALE}px "DM Sans", "Inter", sans-serif`;
  const titleLines = wrapLines(ctx, card.title, CW - 40 * SCALE, 2);
  ctx.font = `${9 * SCALE}px "DM Sans", "Inter", sans-serif`;
  const sumLines = wrapLines(ctx, card.summary, CW - 40 * SCALE, 4);
  ctx.font = `${8.5 * SCALE}px "DM Sans", "Inter", sans-serif`;
  const detLines = wrapLines(ctx, `Next step: ${card.detail}`, CW - 40 * SCALE, 3);

  const cardH = (18 + titleLines.length * 13 + sumLines.length * 12 + detLines.length * 11 + 26) * SCALE;

  // Card body
  ctx.shadowColor = "rgba(0,0,0,0.05)"; ctx.shadowBlur = 6 * SCALE; ctx.shadowOffsetY = 2 * SCALE;
  roundRect(ctx, x, y, CW, cardH, 8 * SCALE);
  ctx.fillStyle = pal.bg; ctx.fill();
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

  ctx.strokeStyle = pal.border; ctx.lineWidth = 0.5 * SCALE;
  roundRect(ctx, x, y, CW, cardH, 8 * SCALE); ctx.stroke();

  // Left bar
  roundRect(ctx, x, y, 5 * SCALE, cardH, 5 * SCALE);
  ctx.fillStyle = pal.accent; ctx.fill();
  ctx.fillRect(x + 3 * SCALE, y, 2 * SCALE, cardH);

  let iy = y + 14 * SCALE;

  // Index
  ctx.font = `bold ${9 * SCALE}px "DM Sans", "Inter", sans-serif`;
  ctx.fillStyle = pal.accent;
  ctx.fillText(`${idx + 1}.`, x + 13 * SCALE, iy);

  // Tag pill
  ctx.font = `bold ${7.5 * SCALE}px "DM Sans", "Inter", sans-serif`;
  const tagW2 = ctx.measureText(pal.tag).width + 12 * SCALE;
  roundRect(ctx, x + 26 * SCALE, y + 5 * SCALE, tagW2, 14 * SCALE, 3 * SCALE);
  ctx.fillStyle = pal.accent; ctx.fill();
  ctx.fillStyle = C.white; ctx.fillText(pal.tag, x + 32 * SCALE, y + 14.5 * SCALE);
  iy += 14 * SCALE;

  // Title
  titleLines.forEach(l => {
    ctx.font = `bold ${10 * SCALE}px "DM Sans", "Inter", sans-serif`;
    ctx.fillStyle = C.ink; ctx.fillText(l, x + 13 * SCALE, iy); iy += 13 * SCALE;
  });
  iy += 3 * SCALE;

  // Summary
  sumLines.forEach(l => {
    ctx.font = `${9 * SCALE}px "DM Sans", "Inter", sans-serif`;
    ctx.fillStyle = C.inkMd; ctx.fillText(l, x + 13 * SCALE, iy); iy += 12 * SCALE;
  });
  iy += 5 * SCALE;

  // Detail (italic)
  detLines.forEach(l => {
    ctx.font = `italic ${8.5 * SCALE}px "DM Sans", "Inter", sans-serif`;
    ctx.fillStyle = pal.accent; ctx.fillText(l, x + 13 * SCALE, iy); iy += 11 * SCALE;
  });

  return y + cardH + 10 * SCALE;
};

/** Horizontal bar for Top Holdings */
const drawHorizBar = (ctx: Ctx, label: string, pct: number, value: string, accent: string, rank: number, x: number, y: number): number => {
  const barH = 22 * SCALE;
  const barW = Math.max(pct * CW, 6 * SCALE);

  ctx.fillStyle = C.surfMd; roundRect(ctx, x, y, CW, barH, 3 * SCALE); ctx.fill();
  ctx.fillStyle = accent; roundRect(ctx, x, y, barW, barH, 3 * SCALE); ctx.fill();

  ctx.font = `bold ${9 * SCALE}px "DM Sans", "Inter", sans-serif`;
  ctx.fillStyle = pct > 0.25 ? C.white : C.ink;
  ctx.fillText(`${rank}. ${trunc(ctx, label, Math.max(barW - 12 * SCALE, 100 * SCALE))}`, x + 7 * SCALE, y + 14.5 * SCALE);

  ctx.fillStyle = pct > 0.55 ? C.white : C.inkMd;
  const vs = `${value}  (${(pct * 100).toFixed(1)}%)`;
  ctx.fillText(vs, x + CW - ctx.measureText(vs).width - 7 * SCALE, y + 14.5 * SCALE);

  return y + barH + 5 * SCALE;
};

// ── Multi-page renderer ─────────────────────────────────────────────────────

interface PageSpec {
  render: (ctx: Ctx, logoImg: HTMLImageElement | null, pageNum: number) => void;
}

export const generatePdfReport = async (params: {
  logoUrl: string;
  summary: { totalValue: number; invested: number; allTimeProfit: number; monthlyIncome: number };
  xirrValue: number | null;
  report: ReportData;
  insights: PdfInsights;
  holder: { name: string; pan?: string; email?: string };
  chartIds: { performance: string; scheme: string; amc: string };
}) => {
  const [{ jsPDF }] = await Promise.all([import("jspdf")]);
  await loadFont();

  const { summary, report, xirrValue, logoUrl, holder, insights } = params;

  // Load logo
  let logoImg: HTMLImageElement | null = null;
  try {
    logoImg = await new Promise<HTMLImageElement>((res, rej) => {
      const img = new Image(); img.crossOrigin = "anonymous";
      img.onload = () => res(img); img.onerror = rej;
      img.src = logoUrl;
    });
  } catch { /* skip */ }

  const BODY_TOP = 68 * SCALE;
  const BODY_BTM = PH - 38 * SCALE;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PAGE 1 — COVER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const [cvs1, ctx1] = newCanvas();

  // Background gradient
  const grad = ctx1.createLinearGradient(0, 0, PW * 0.6, PH);
  grad.addColorStop(0, "#0f172a");
  grad.addColorStop(0.55, "#172554");
  grad.addColorStop(1, "#052e16");
  ctx1.fillStyle = grad; ctx1.fillRect(0, 0, PW, PH);

  // Decorative circle (top-right glow)
  const radGrad = ctx1.createRadialGradient(PW, 0, 0, PW, 0, 400 * SCALE);
  radGrad.addColorStop(0, "rgba(22,163,74,0.18)");
  radGrad.addColorStop(1, "rgba(22,163,74,0)");
  ctx1.fillStyle = radGrad; ctx1.fillRect(0, 0, PW, PH);

  // Bottom glow
  const radGrad2 = ctx1.createRadialGradient(0, PH, 0, 0, PH, 380 * SCALE);
  radGrad2.addColorStop(0, "rgba(37,99,235,0.14)");
  radGrad2.addColorStop(1, "rgba(37,99,235,0)");
  ctx1.fillStyle = radGrad2; ctx1.fillRect(0, 0, PW, PH);

  // Green left rail with gradient
  const railGrad = ctx1.createLinearGradient(0, 0, 0, PH);
  railGrad.addColorStop(0, C.green);
  railGrad.addColorStop(1, "#065f46");
  ctx1.fillStyle = railGrad; ctx1.fillRect(0, 0, 6 * SCALE, PH);
  ctx1.fillStyle = C.greenDk; ctx1.fillRect(6 * SCALE, 0, 1 * SCALE, PH);

  // Logo + brand
  if (logoImg) { try { ctx1.drawImage(logoImg, ML + 6 * SCALE, 52 * SCALE, 32 * SCALE, 32 * SCALE); } catch { /* skip */ } }
  const clx = logoImg ? ML + 46 * SCALE : ML + 6 * SCALE;
  ctx1.font = `bold ${14 * SCALE}px "DM Sans", "Inter", sans-serif`;
  ctx1.fillStyle = C.white; ctx1.fillText("Nivesify", clx, 72 * SCALE);
  ctx1.font = `${9 * SCALE}px "DM Sans", "Inter", sans-serif`;
  ctx1.fillStyle = C.inkFaint; ctx1.fillText("Thoughtful Money, Better Life", clx, 86 * SCALE);

  // Report type label
  ctx1.font = `bold ${8.5 * SCALE}px "DM Sans", "Inter", sans-serif`;
  ctx1.fillStyle = C.green; ctx1.fillText("MUTUAL FUND HEALTH CHECK", ML + 6 * SCALE, 152 * SCALE);

  // Title
  ctx1.font = `bold ${36 * SCALE}px "DM Sans", "Inter", sans-serif`;
  ctx1.fillStyle = C.white;
  ctx1.fillText("Portfolio", ML + 6 * SCALE, 192 * SCALE);
  ctx1.fillText("Diagnosis", ML + 6 * SCALE, 234 * SCALE);

  // Underline
  const ulGrad = ctx1.createLinearGradient(ML + 6 * SCALE, 0, ML + 150 * SCALE, 0);
  ulGrad.addColorStop(0, C.green); ulGrad.addColorStop(1, "rgba(22,163,74,0)");
  ctx1.fillStyle = ulGrad;
  ctx1.fillRect(ML + 6 * SCALE, 244 * SCALE, 140 * SCALE, 3 * SCALE);

  ctx1.font = `${9 * SCALE}px "DM Sans", "Inter", sans-serif`;
  ctx1.fillStyle = "rgba(148,163,184,0.8)";
  ctx1.fillText("Benchmarked  ·  Actionable  ·  Evidence-based", ML + 6 * SCALE, 262 * SCALE);

  // ── Holder info panel ──
  const hipX = ML + 6 * SCALE, hipY = 280 * SCALE, hipW = CW - 6 * SCALE, hipH = 70 * SCALE;
  roundRect(ctx1, hipX, hipY, hipW, hipH, 8 * SCALE);
  ctx1.fillStyle = "rgba(30,58,95,0.8)"; ctx1.fill();
  ctx1.strokeStyle = "rgba(37,99,235,0.3)"; ctx1.lineWidth = 0.5 * SCALE;
  roundRect(ctx1, hipX, hipY, hipW, hipH, 8 * SCALE); ctx1.stroke();
  ctx1.fillStyle = C.green;
  roundRect(ctx1, hipX, hipY, 4 * SCALE, hipH, 4 * SCALE); ctx1.fill();
  ctx1.fillRect(hipX + 2 * SCALE, hipY, 2 * SCALE, hipH);

  ctx1.font = `bold ${7.5 * SCALE}px "DM Sans", "Inter", sans-serif`;
  ctx1.fillStyle = "rgba(148,163,184,0.8)"; ctx1.fillText("PREPARED FOR", hipX + 14 * SCALE, hipY + 18 * SCALE);
  ctx1.font = `bold ${13 * SCALE}px "DM Sans", "Inter", sans-serif`;
  ctx1.fillStyle = C.white;
  ctx1.fillText(trunc(ctx1, holder.name || "Investor", hipW - 100 * SCALE), hipX + 14 * SCALE, hipY + 33 * SCALE);
  ctx1.font = `${8 * SCALE}px "DM Sans", "Inter", sans-serif`;
  ctx1.fillStyle = C.inkFaint;
  if (holder.pan) ctx1.fillText(`PAN: ${holder.pan}`, hipX + 14 * SCALE, hipY + 49 * SCALE);
  if (holder.email) ctx1.fillText(trunc(ctx1, holder.email, hipW / 2 - 30 * SCALE), holder.pan ? hipX + hipW / 2 - 10 * SCALE : hipX + 14 * SCALE, hipY + 49 * SCALE);
  const genDate = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  ctx1.fillText(`Generated: ${genDate}`, hipX + 14 * SCALE, hipY + 62 * SCALE);

  // ── 3 big KPI cards ──
  const covCardY = hipY + hipH + 18 * SCALE;
  const covCardW = (hipW - 16 * SCALE) / 3;
  const covCardH = 82 * SCALE;

  const covCards = [
    { l: "Total Portfolio Value", v: fmtCur(summary.totalValue), sub: "Current market value", a: C.green },
    { l: "Portfolio XIRR",        v: fmtPct(xirrValue, 2),        sub: "Annualised true return", a: (xirrValue ?? 0) >= 0.12 ? C.green : C.amber },
    { l: "All-time Returns",      v: fmtCur(summary.allTimeProfit), sub: "Total gain on investment", a: (summary.allTimeProfit || 0) >= 0 ? C.green : C.red },
  ];
  covCards.forEach((c, i) => {
    const cx2 = hipX + i * (covCardW + 8 * SCALE);
    roundRect(ctx1, cx2, covCardY, covCardW, covCardH, 8 * SCALE);
    ctx1.fillStyle = "rgba(22,36,74,0.9)"; ctx1.fill();
    ctx1.strokeStyle = "rgba(255,255,255,0.08)"; ctx1.lineWidth = 0.5 * SCALE;
    roundRect(ctx1, cx2, covCardY, covCardW, covCardH, 8 * SCALE); ctx1.stroke();

    // Top accent bar
    ctx1.fillStyle = c.a;
    roundRect(ctx1, cx2, covCardY, covCardW, 4 * SCALE, 4 * SCALE); ctx1.fill();
    ctx1.fillRect(cx2, covCardY + 2 * SCALE, covCardW, 2 * SCALE);

    ctx1.font = `${8 * SCALE}px "DM Sans", "Inter", sans-serif`;
    ctx1.fillStyle = C.inkFaint; ctx1.fillText(trunc(ctx1, c.l, covCardW - 20 * SCALE), cx2 + 12 * SCALE, covCardY + 22 * SCALE);
    ctx1.font = `bold ${15 * SCALE}px "DM Sans", "Inter", sans-serif`;
    ctx1.fillStyle = c.a; ctx1.fillText(trunc(ctx1, c.v, covCardW - 20 * SCALE), cx2 + 12 * SCALE, covCardY + 46 * SCALE);
    ctx1.font = `${7.5 * SCALE}px "DM Sans", "Inter", sans-serif`;
    ctx1.fillStyle = C.inkFaint; ctx1.fillText(c.sub, cx2 + 12 * SCALE, covCardY + 66 * SCALE);
  });

  // ── 4 secondary stat chips ──
  const secY = covCardY + covCardH + 14 * SCALE;
  const secW = hipW / 4;
  const secH = 56 * SCALE;
  const secs = [
    { l: "Invested",        v: fmtCur(summary.invested) },
    { l: "Active Holdings", v: `${report.holdingsCount} funds` },
    { l: "Top Fund Weight", v: fmtShare(report.topOneShare) },
    { l: "Monthly Income",  v: fmtCur(summary.monthlyIncome) },
  ];
  secs.forEach((s, i) => {
    const sx = hipX + i * secW;
    roundRect(ctx1, sx, secY, secW - 8 * SCALE, secH, 6 * SCALE);
    ctx1.fillStyle = "rgba(22,36,74,0.7)"; ctx1.fill();
    ctx1.font = `${7.5 * SCALE}px "DM Sans", "Inter", sans-serif`;
    ctx1.fillStyle = C.inkFaint; ctx1.fillText(s.l, sx + 10 * SCALE, secY + 18 * SCALE);
    ctx1.font = `bold ${12 * SCALE}px "DM Sans", "Inter", sans-serif`;
    ctx1.fillStyle = C.white; ctx1.fillText(trunc(ctx1, s.v, secW - 26 * SCALE), sx + 10 * SCALE, secY + 40 * SCALE);
  });

  // Cover footer
  const cfY = PH - 40 * SCALE;
  ctx1.strokeStyle = "rgba(30,58,95,0.8)"; ctx1.lineWidth = 0.4 * SCALE;
  ctx1.beginPath(); ctx1.moveTo(hipX, cfY); ctx1.lineTo(hipX + hipW, cfY); ctx1.stroke();
  ctx1.font = `${7 * SCALE}px "DM Sans", "Inter", sans-serif`;
  ctx1.fillStyle = "rgba(100,116,139,0.7)";
  const discL = wrapLines(ctx1, "Past performance is not a guarantee of future results. Consult a SEBI-registered investment advisor before acting on this report.", hipW, 2);
  discL.forEach((l, i) => ctx1.fillText(l, hipX, cfY + 13 * SCALE + i * 10 * SCALE));

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PAGE 2 — PORTFOLIO SUMMARY
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const [cvs2, ctx2] = newCanvas();
  ctx2.fillStyle = C.surface; ctx2.fillRect(0, 0, PW, PH);
  drawPageChrome(ctx2, 2, logoImg);

  let Y2 = BODY_TOP;
  Y2 = drawSectionHead(ctx2, "Overview", "Portfolio at a Glance", ML, Y2, C.blue);

  // Row 1: 4 metric cards
  const cGap = 8 * SCALE, cH = 62 * SCALE, cW = (CW - cGap * 3) / 4;
  const row1 = [
    { l: "Total Value",      v: fmtCur(summary.totalValue),    n: "Current market value",   a: C.blue  },
    { l: "Total Invested",   v: fmtCur(summary.invested),      n: "Net capital deployed",   a: C.inkSoft },
    { l: "All-time Returns", v: fmtCur(summary.allTimeProfit),  n: "Unrealised + realised",  a: (summary.allTimeProfit||0)>=0?C.green:C.red },
    { l: "Portfolio XIRR",   v: fmtPct(xirrValue, 2),          n: "Annualised true return", a: (xirrValue??0)*100>=12?C.green:C.amber },
  ];
  row1.forEach((c, i) => drawMetricCard(ctx2, ML + i * (cW + cGap), Y2, cW, cH, c.l, c.v, c.n, c.a));
  Y2 += cH + 12 * SCALE;

  const row2 = [
    { l: "Active Holdings",  v: `${report.holdingsCount}`,      n: "Funds with value > 0",    a: C.purple },
    { l: "Top Fund Weight",  v: fmtShare(report.topOneShare),   n: "Largest single position", a: report.topOneShare>0.3?C.amber:C.green },
    { l: "Top 5 Combined",   v: fmtShare(report.topFiveShare),  n: "Core concentration",      a: report.topFiveShare>0.65?C.amber:C.green },
    { l: "Monthly Income",   v: fmtCur(summary.monthlyIncome),  n: "25× withdrawal rule",     a: C.teal },
  ];
  row2.forEach((c, i) => drawMetricCard(ctx2, ML + i * (cW + cGap), Y2, cW, cH, c.l, c.v, c.n, c.a));
  Y2 += cH + 16 * SCALE;

  // Divider
  ctx2.strokeStyle = C.border; ctx2.lineWidth = 0.5 * SCALE;
  ctx2.beginPath(); ctx2.moveTo(ML, Y2); ctx2.lineTo(ML + CW, Y2); ctx2.stroke();
  Y2 += 14 * SCALE;

  // Executive summary
  ctx2.font = `${9 * SCALE}px "DM Sans", "Inter", sans-serif`;
  const esLines = wrapLines(ctx2, insights.executiveSummary, CW - 32 * SCALE, 4);
  const esH = (esLines.length * 12 + 34) * SCALE;
  roundRect(ctx2, ML, Y2, CW, esH, 8 * SCALE);
  ctx2.fillStyle = C.greenLt; ctx2.fill();
  ctx2.strokeStyle = C.greenBd; ctx2.lineWidth = 0.5 * SCALE;
  roundRect(ctx2, ML, Y2, CW, esH, 8 * SCALE); ctx2.stroke();
  ctx2.fillStyle = C.green; roundRect(ctx2, ML, Y2, 5 * SCALE, esH, 5 * SCALE); ctx2.fill();
  ctx2.fillRect(ML + 3 * SCALE, Y2, 2 * SCALE, esH);
  ctx2.font = `bold ${7.5 * SCALE}px "DM Sans", "Inter", sans-serif`;
  ctx2.fillStyle = C.green; ctx2.fillText("EXECUTIVE SUMMARY", ML + 14 * SCALE, Y2 + 15 * SCALE);
  esLines.forEach((l, i) => {
    ctx2.font = `${9 * SCALE}px "DM Sans", "Inter", sans-serif`;
    ctx2.fillStyle = C.inkMd; ctx2.fillText(l, ML + 14 * SCALE, Y2 + 27 * SCALE + i * 12 * SCALE);
  });
  Y2 += esH + 16 * SCALE;

  ctx2.strokeStyle = C.border; ctx2.lineWidth = 0.5 * SCALE;
  ctx2.beginPath(); ctx2.moveTo(ML, Y2); ctx2.lineTo(ML + CW, Y2); ctx2.stroke(); Y2 += 14 * SCALE;

  Y2 = drawSectionHead(ctx2, "Diagnostics", "Portfolio Health Metrics", ML, Y2, C.purple);
  Y2 = drawTable(ctx2,
    [{ h: "Metric", w: 175 }, { h: "Value", w: 80, align: "R", numColor: true }, { h: "What It Means", w: 268 }],
    insights.metrics.map(m => [m.title, m.value, m.note]),
    ML, Y2, { maxLines: 2 }
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PAGE 3 — AUDIT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const [cvs3, ctx3] = newCanvas();
  ctx3.fillStyle = C.surface; ctx3.fillRect(0, 0, PW, PH);
  drawPageChrome(ctx3, 3, logoImg);

  let Y3 = BODY_TOP;
  Y3 = drawSectionHead(ctx3, "Active Funds", "Active Fund Audit", ML, Y3, C.amber);
  ctx3.font = `${8.5 * SCALE}px "DM Sans", "Inter", sans-serif`;
  ctx3.fillStyle = C.inkSoft;
  ctx3.fillText(`${insights.activeAuditRows.length} active funds  ·  Signal = alpha + IR + benchmark gap + composite score`, ML, Y3);
  Y3 += 14 * SCALE;

  Y3 = drawTable(ctx3,
    [{ h: "Fund Name", w: 190 }, { h: "Benchmark", w: 135 }, { h: "Gap vs Bench", w: 78, align: "R", numColor: true }, { h: "Action", w: 120, numColor: true }],
    insights.activeAuditRows.map(r => [r.name, r.benchmark || "—", r.gap || "—", r.action]),
    ML, Y3, { maxLines: 2 }
  );

  // Legend
  const legY = Y3;
  roundRect(ctx3, ML, legY, CW, 22 * SCALE, 4 * SCALE);
  ctx3.fillStyle = C.surface; ctx3.fill();
  ctx3.font = `bold ${7.5 * SCALE}px "DM Sans", "Inter", sans-serif`;
  ctx3.fillStyle = C.inkMd; ctx3.fillText("Signal guide:", ML + 8 * SCALE, legY + 14.5 * SCALE);
  const legItems = [{ c: C.green, l: "Continue — beating benchmark" }, { c: C.amber, l: "Review — underperforming" }];
  let llx = ML + 90 * SCALE;
  legItems.forEach(lg => {
    roundRect(ctx3, llx, legY + 6.5 * SCALE, 9 * SCALE, 9 * SCALE, 2 * SCALE);
    ctx3.fillStyle = lg.c; ctx3.fill();
    ctx3.font = `${7.5 * SCALE}px "DM Sans", "Inter", sans-serif`;
    ctx3.fillStyle = C.inkMd; ctx3.fillText(lg.l, llx + 13 * SCALE, legY + 14.5 * SCALE);
    llx += ctx3.measureText(lg.l).width + 28 * SCALE;
  });
  Y3 += 30 * SCALE;

  ctx3.strokeStyle = C.border; ctx3.lineWidth = 0.5 * SCALE;
  ctx3.beginPath(); ctx3.moveTo(ML, Y3); ctx3.lineTo(ML + CW, Y3); ctx3.stroke(); Y3 += 14 * SCALE;

  Y3 = drawSectionHead(ctx3, "Passive Funds", "Passive Fund Audit", ML, Y3, C.blue);
  ctx3.font = `${8.5 * SCALE}px "DM Sans", "Inter", sans-serif`;
  ctx3.fillStyle = C.inkSoft;
  ctx3.fillText(`${insights.passiveAuditRows.length} index / passive funds  ·  Tracking diff vs best ETF on same benchmark`, ML, Y3);
  Y3 += 14 * SCALE;

  Y3 = drawTable(ctx3,
    [{ h: "Fund Name", w: 185 }, { h: "Benchmark", w: 128 }, { h: "Gap (3Y)", w: 65, align: "R", numColor: true }, { h: "Track. Diff", w: 70, align: "R" }, { h: "Action", w: 75, numColor: true }],
    insights.passiveAuditRows.map(r => [r.name, r.benchmark || "—", r.gap || "—", r.tracking || "—", r.action]),
    ML, Y3, { maxLines: 2 }
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PAGE 4 — ALLOCATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const [cvs4, ctx4] = newCanvas();
  ctx4.fillStyle = C.surface; ctx4.fillRect(0, 0, PW, PH);
  drawPageChrome(ctx4, 4, logoImg);

  let Y4 = BODY_TOP;
  Y4 = drawSectionHead(ctx4, "Allocation", "Portfolio Allocation Breakdown", ML, Y4, C.blue);

  const catMapP = new Map<string, { cur: number; inv: number }>();
  report.fundDetails.forEach(f => { const e = catMapP.get(f.majorCategory) || { cur: 0, inv: 0 }; catMapP.set(f.majorCategory, { cur: e.cur + f.currentValue, inv: e.inv + f.invested }); });
  const catItems = Array.from(catMapP.entries()).map(([n, v], i) => ({ label: n, value: v.cur, invested: v.inv, color: ACCENTS[i % ACCENTS.length] })).sort((a, b) => b.value - a.value);

  Y4 = drawStackedBar(ctx4, catItems, summary.totalValue, ML, Y4, CW);

  Y4 = drawTable(ctx4,
    [{ h: "Category", w: 160 }, { h: "Current Value", w: 110, align: "R" }, { h: "Invested", w: 110, align: "R" }, { h: "Weight", w: 75, align: "R" }, { h: "Gain / Loss", w: 68, align: "R", numColor: true }],
    catItems.map(c => { const g = c.value - c.invested; return [c.label, fmtCur(c.value), fmtCur(c.invested), fmtShare(summary.totalValue ? c.value / summary.totalValue : 0), `${g >= 0 ? "+" : ""}${fmtCur(g)}`]; }),
    ML, Y4, { maxLines: 1 }
  );

  Y4 += 8 * SCALE;

  Y4 = drawStackedBar(ctx4,
    report.amcBreakdown.slice(0, 8).map((a, i) => ({ label: a.name, value: a.value, color: ACCENTS[i % ACCENTS.length] })),
    summary.totalValue, ML, Y4, CW
  );

  Y4 = drawTable(ctx4,
    [{ h: "Fund House (AMC)", w: 235 }, { h: "Value", w: 110, align: "R" }, { h: "Weight", w: 80, align: "R" }, { h: "No. of Funds", w: 98, align: "C" }],
    report.amcBreakdown.slice(0, 10).map(a => [a.name, fmtCur(a.value), fmtShare(summary.totalValue ? a.value / summary.totalValue : 0), `${report.fundDetails.filter(f => f.amc === a.name).length}`]),
    ML, Y4, { maxLines: 1 }
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PAGE 5 — INSIGHTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const [cvs5, ctx5] = newCanvas();
  ctx5.fillStyle = C.surface; ctx5.fillRect(0, 0, PW, PH);
  drawPageChrome(ctx5, 5, logoImg);

  let Y5 = BODY_TOP;
  Y5 = drawSectionHead(ctx5, "Insights", "Actionable Insights & Next Steps", ML, Y5, C.green);
  ctx5.font = `${8.5 * SCALE}px "DM Sans", "Inter", sans-serif`;
  ctx5.fillStyle = C.inkSoft;
  ctx5.fillText("Priority-ranked findings. Each card shows the signal and the suggested next action.", ML, Y5);
  Y5 += 14 * SCALE;

  insights.insightCards.forEach((card, i) => {
    const lt = card.title.toLowerCase();
    const type: "critical" | "warning" | "info" | "ok" =
      lt.includes("trailing") || lt.includes("action") || lt.includes("drag") || lt.includes("bottom") ? "critical" :
      lt.includes("review") || lt.includes("drift") || lt.includes("need") || lt.includes("over") || lt.includes("high") ? "warning" :
      lt.includes("beating") || lt.includes("strong") || lt.includes("healthy") ? "ok" : "info";

    // If card would overflow page, start a new page — this is a simplification;
    // for a proper solution track Y and emit new canvas pages
    if (Y5 > BODY_BTM - 60 * SCALE) return; // skip overflow for now

    Y5 = drawInsightCard(ctx5, card, i, type, ML, Y5);
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PAGE 6 — HOLDINGS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const [cvs6, ctx6] = newCanvas();
  ctx6.fillStyle = C.surface; ctx6.fillRect(0, 0, PW, PH);
  drawPageChrome(ctx6, 6, logoImg);

  let Y6 = BODY_TOP;
  Y6 = drawSectionHead(ctx6, "Holdings", "Full Holdings Detail", ML, Y6, C.inkSoft);
  ctx6.font = `${8.5 * SCALE}px "DM Sans", "Inter", sans-serif`;
  ctx6.fillStyle = C.inkSoft;
  ctx6.fillText(`${report.holdingsCount} active holdings  ·  Sorted by current value  ·  XIRR shown where > 1 year data`, ML, Y6);
  Y6 += 14 * SCALE;

  Y6 = drawTable(ctx6,
    [{ h: "Fund Name", w: 182 }, { h: "Category", w: 65 }, { h: "Invested", w: 72, align: "R" }, { h: "Current Value", w: 76, align: "R" }, { h: "Gain / Loss", w: 72, align: "R", numColor: true }, { h: "XIRR", w: 56, align: "R", numColor: true }],
    report.fundDetails.map(f => { const g = f.profit; return [f.name, f.majorCategory, fmtCur(f.invested), fmtCur(f.currentValue), `${g >= 0 ? "+" : ""}${fmtCur(g)}`, fmtPct(f.xirr, 2)]; }),
    ML, Y6, { maxLines: 2 }
  );

  // Top 5 horizontal bars
  ctx6.strokeStyle = C.border; ctx6.lineWidth = 0.5 * SCALE;
  ctx6.beginPath(); ctx6.moveTo(ML, Y6); ctx6.lineTo(ML + CW, Y6); ctx6.stroke(); Y6 += 12 * SCALE;
  ctx6.font = `bold ${13 * SCALE}px "DM Sans", "Inter", sans-serif`;
  ctx6.fillStyle = C.ink; ctx6.fillText("Top 5 Holdings by Value", ML, Y6); Y6 += 16 * SCALE;

  report.topHoldings.forEach((h, i) => {
    if (Y6 > BODY_BTM - 28 * SCALE) return;
    Y6 = drawHorizBar(ctx6, h.name, summary.totalValue ? h.value / summary.totalValue : 0, fmtCur(h.value), ACCENTS[i % ACCENTS.length], i + 1, ML, Y6);
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ASSEMBLE PDF
  // Each canvas → JPEG → jsPDF page
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });

  const canvases = [cvs1, cvs2, cvs3, cvs4, cvs5, cvs6];
  canvases.forEach((c, i) => {
    if (i > 0) doc.addPage();
    const imgData = c.toDataURL("image/jpeg", 0.96);
    doc.addImage(imgData, "JPEG", 0, 0, PW_PT, PH_PT);
  });

  doc.save("nivesify-portfolio-report.pdf");
};