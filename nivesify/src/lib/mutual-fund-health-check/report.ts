import { InvestmentsData, MatchingScheme } from "./types";
import type { Portfolio } from "./portfolio";
import { buildCashflows } from "./cashflows";
import { xirr } from "./xirr";

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC TYPES
// ─────────────────────────────────────────────────────────────────────────────
export type ReportInsight = { title: string; signal: "Normal"|"Elevated"|"Watch-worthy"|"Strong"|"Aggressive"; observation: string; meaning: string; reassurance: string; suggestedCheck: string; severity: "info"|"warning"|"positive" };
export type PdfInsightMetric = { title: string; value: string; note: string };
export type PdfAuditRow = { name: string; benchmark?: string; gap?: string; tracking?: string; action: string };
export type PdfInsightCard = { title: string; summary: string; detail: string };
export type PdfInsights = { metrics: PdfInsightMetric[]; executiveSummary: string; activeAuditRows: PdfAuditRow[]; passiveAuditRows: PdfAuditRow[]; insightCards: PdfInsightCard[] };
export type SchemeBreakdownNode = { name: string; size?: number; children?: SchemeBreakdownNode[]; value?: number };
export type AmcBreakdown = { name: string; value: number }[];
export type ReportData = { holdingsCount: number; topOneShare: number; topFiveShare: number; topAmcShare: number; insights: ReportInsight[]; insightSummary: string; schemeBreakdown: SchemeBreakdownNode; amcBreakdown: AmcBreakdown; topHoldings: Array<{ name: string; value: number }>; fundDetails: Array<{ name: string; invested: number; currentValue: number; profit: number; units: number; nav: number; xirr: number|null; nomineeStatus: "yes"|"no"|"partial"|"unknown"; amc: string; schemeCategory: string; majorCategory: string }> };

// ─────────────────────────────────────────────────────────────────────────────
// FORMATTERS
// ─────────────────────────────────────────────────────────────────────────────
const fmtCur = (v: number): string => {
  const n = Number.isFinite(v) ? v : 0;
  const a = Math.abs(n), sign = n < 0 ? "-" : "";
  if (a >= 10_000_000) return `${sign}₹${(a/10_000_000).toFixed(2)} Cr`;
  if (a >= 100_000)    return `${sign}₹${(a/100_000).toFixed(2)} L`;
  if (a >= 1_000)      return `${sign}₹${new Intl.NumberFormat("en-IN",{maximumFractionDigits:0}).format(a)}`;
  return `${sign}₹${a.toFixed(0)}`;
};
const fmtPct = (v: number|null, d = 2) => (v === null || !Number.isFinite(v)) ? "N/A" : `${(v*100).toFixed(d)}%`;
const fmtShare = (v: number) => `${(Math.max(0,v)*100).toFixed(1)}%`;

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
const buildMetaMap = (txns: InvestmentsData["transactions"] = [], lookup?: Map<number,MatchingScheme>) => {
  const m = new Map<number,MatchingScheme>();
  txns.forEach(t => { if (t.matchingScheme?.schemeCode) m.set(t.matchingScheme.schemeCode, t.matchingScheme); });
  lookup?.forEach((s,c) => m.set(c, {...(m.get(c) ?? {} as MatchingScheme), ...s}));
  return m;
};

// ─────────────────────────────────────────────────────────────────────────────
// buildReportData
// ─────────────────────────────────────────────────────────────────────────────
export const buildReportData = (data: InvestmentsData, portfolio: Portfolio, totalValue: number, xirrValue: number|null, schemeLookup?: Map<number,MatchingScheme>): ReportData => {
  const nomineeMap = data.nominees || {};
  const meta = buildMetaMap(data.transactions || [], schemeLookup);
  const active = portfolio.filter(r => r.currentValue > 0);
  const sorted = [...active].sort((a,b) => b.currentValue - a.currentValue);
  const holdingsCount = active.length;
  const topOneShare = totalValue ? (sorted[0]?.currentValue||0)/totalValue : 0;
  const topFiveShare = totalValue ? sorted.slice(0,5).reduce((s,f) => s+f.currentValue,0)/totalValue : 0;

  const schemeRoot: SchemeBreakdownNode = {name:"All Schemes",children:[]};
  const majMap = new Map<string,SchemeBreakdownNode>();
  active.forEach(row => {
    const m2 = meta.get(row.schemeCode), maj = classifyCategory(m2?.schemeCategory), sub = m2?.schemeCategory || "Uncategorized";
    if (!majMap.has(maj)) { const node = {name:maj,children:[] as SchemeBreakdownNode[],size:0}; majMap.set(maj,node); schemeRoot.children?.push(node); }
    const majNode = majMap.get(maj)!;
    let subNode = majNode.children?.find(ch => ch.name === sub);
    if (!subNode) { subNode = {name:sub,children:[],size:0}; majNode.children?.push(subNode); }
    const v = Math.max(0, row.currentValue);
    subNode.children?.push({name:row.mfName,size:v,value:v});
    (subNode as any).size = (subNode.size||0)+v; (majNode as any).size = (majNode.size||0)+v;
  });
  const amcMap = new Map<string,number>();
  active.forEach(row => { const amc = deriveAmc(meta.get(row.schemeCode), row.mfName); amcMap.set(amc, (amcMap.get(amc)||0)+Math.max(0,row.currentValue)); });
  const amcBreakdown = Array.from(amcMap.entries()).map(([name,value]) => ({name,value})).sort((a,b) => b.value-a.value);
  const topAmcShare = totalValue ? (amcBreakdown[0]?.value||0)/totalValue : 0;

  const allocMap = new Map<string,number>();
  active.forEach(row => { const b = classifyCategory(meta.get(row.schemeCode)?.schemeCategory); allocMap.set(b,(allocMap.get(b)||0)+Math.max(0,row.currentValue)); });
  const eq   = totalValue ? (allocMap.get("Equity")||0)/totalValue : 0;
  const debt = totalValue ? (allocMap.get("Debt")||0)/totalValue : 0;
  const hyb  = totalValue ? (allocMap.get("Hybrid")||0)/totalValue : 0;

  const insights: ReportInsight[] = [];
  const add = (i: ReportInsight) => insights.push(i);

  if (holdingsCount > 8)
    add({title:"You have too many funds",signal:holdingsCount>10?"Strong":"Watch-worthy",observation:`You hold ${holdingsCount} funds.`,meaning:"More than 6-8 funds rarely improves returns. It just spreads your attention and adds clutter.",reassurance:"This is very common and easy to fix.",suggestedCheck:"Pick the best fund in each category. Let go of the rest.",severity:"warning"});
  else if (holdingsCount > 6)
    add({title:"Slightly too many funds",signal:"Elevated",observation:`You hold ${holdingsCount} funds.`,meaning:"More than 6-7 funds adds complexity without much benefit.",reassurance:"Each fund should have a clear reason to exist in your portfolio.",suggestedCheck:"Check if any two funds do the same job. Keep the better one.",severity:"info"});

  if (topOneShare >= 0.2) {
    const sig = topOneShare >= 0.4 ? "Strong" : topOneShare >= 0.3 ? "Watch-worthy" : "Elevated";
    add({title:"One fund holds a lot of your money",signal:sig,observation:`Your biggest fund is ${fmtShare(topOneShare)} of your portfolio.`,meaning:"If this fund drops, a large chunk of your wealth gets affected.",reassurance:"Fine if you chose it intentionally. Risky if it grew big by accident.",suggestedCheck:"Ask yourself: would you put this much in this one fund today?",severity:sig==="Strong"?"warning":"info"});
  }
  if (topFiveShare >= 0.65) {
    const sig = topFiveShare >= 0.8 ? "Strong" : "Watch-worthy";
    add({title:"5 funds drive most of your returns",signal:sig,observation:`Your top 5 funds hold ${fmtShare(topFiveShare)}.`,meaning:"Your overall returns depend heavily on how these 5 perform.",reassurance:"This is healthy if those 5 funds are from different categories.",suggestedCheck:"Are all 5 from different market segments? If yes, you're fine.",severity:"info"});
  }
  if (topAmcShare >= 0.35) {
    const sig = topAmcShare >= 0.5 ? "Strong" : "Elevated";
    add({title:"One fund house manages too much",signal:sig,observation:`One fund house manages ${fmtShare(topAmcShare)} of your money.`,meaning:"If that company faces problems, a big part of your money is at risk.",reassurance:"Large AMCs are regulated and generally safe. Still worth diversifying.",suggestedCheck:"Try to spread money across at least 2-3 different fund houses.",severity:sig==="Strong"?"warning":"info"});
  }
  const xpct = (xirrValue ?? 0) * 100;
  if (xirrValue !== null && xpct < 7 && eq >= 0.4)
    add({title:"Returns are below expectations",signal:"Watch-worthy",observation:`Your annual return is ${xpct.toFixed(2)}%.`,meaning:"For an equity-heavy portfolio, this is lower than what a simple index fund offers.",reassurance:"Returns can look low in a bad market phase. Check the 3-year picture.",suggestedCheck:"Find which funds are dragging returns. The Fund Report Card on Page 4 shows this.",severity:"warning"});
  else if (xirrValue !== null && xpct >= 13)
    add({title:"Excellent returns!",signal:"Strong",observation:`Your annual return is ${xpct.toFixed(2)}%.`,meaning:"This is better than what most investors earn. Your discipline is paying off.",reassurance:"Keep your SIPs running. Don't let short-term dips shake you.",suggestedCheck:"Review once a year to ensure the same funds are still performing.",severity:"positive"});

  if (eq > 0 && eq < 0.25)
    add({title:"Very little in growth funds",signal:"Watch-worthy",observation:`Only ${fmtShare(eq)} is in equity / growth funds.`,meaning:"With such low equity, your money may not grow faster than inflation.",reassurance:"Right approach if your goal is within 1-3 years.",suggestedCheck:"If investing for 5+ years, consider adding equity (growth) funds.",severity:"info"});
  if (eq > 0.88)
    add({title:"Very high equity — know your risk",signal:eq>0.93?"Aggressive":"Strong",observation:`${fmtShare(eq)} is in equity / growth funds.`,meaning:"High growth potential, but also larger drops during market downturns.",reassurance:"Perfect for long-term goals. Just ensure you can handle a -30% dip without panic.",suggestedCheck:"Keep 6 months of expenses in a safe fund or savings account.",severity:"info"});
  if (!insights.length)
    add({title:"Portfolio looks well-structured",signal:"Normal",observation:"No major issues found.",meaning:"Your portfolio is properly diversified with no obvious red flags.",reassurance:"Keep investing regularly and review once a year.",suggestedCheck:"Stay the course. Small tweaks are fine but avoid over-trading.",severity:"positive"});

  const fundDetails = sorted.map(fund => {
    const m2 = meta.get(fund.schemeCode);
    const cf = buildCashflows(fund.allTransactions.map(t => ({amount:Math.abs(t.amount),date:new Date(t.date),type:t.type==="Investment"?"buy" as const:"sell" as const})), fund.currentValue, new Date(), fund.currentValue>0);
    const folios = Array.from(new Set(fund.allTransactions.map(t => t.folio?.split("/")[0].trim()).filter(Boolean) as string[]));
    const flags = folios.map(f => nomineeMap[f]).filter(f => f !== undefined);
    let ns: "yes"|"no"|"partial"|"unknown" = "unknown";
    if (flags.length) { const y = flags.some(f => f===true), n = flags.some(f => f===false); ns = y&&n?"partial":y?"yes":"no"; if (flags.length<folios.length) ns="partial"; }
    return {name:fund.mfName,invested:fund.currentInvested,currentValue:fund.currentValue,profit:fund.profit,units:fund.currentUnits||0,nav:fund.latestPrice||0,xirr:xirr(cf),nomineeStatus:ns,amc:deriveAmc(m2,fund.mfName),schemeCategory:m2?.schemeCategory||"Uncategorized",majorCategory:classifyCategory(m2?.schemeCategory)};
  });

  const hasWarning = insights.some(i => i.severity === "warning");
  return {holdingsCount,topOneShare,topFiveShare,topAmcShare,insights,insightSummary:hasWarning?"Some funds need attention. Your action plan is on Page 3.":"Your portfolio is on track. Keep investing steadily.",schemeBreakdown:schemeRoot,amcBreakdown,topHoldings:sorted.slice(0,5).map(f => ({name:f.mfName,value:f.currentValue})),fundDetails};
};

export const formatCurrencyPlain = fmtCur;
export const tooltips = {totalValue:"Latest market value of all mutual fund holdings.",invested:"Total amount invested (net of redemptions).",allTimeReturns:"Unrealised + realised gains.",xirr:"Annualised return based on cashflows.",monthlyIncome:"Illustrative income if portfolio is 25x yearly expenses.",holdings:"Funds with value > 0.",topFund:"Share of the largest single fund.",topFive:"Share of the top 5 funds combined."};

// ─────────────────────────────────────────────────────────────────────────────
// PDF ENGINE  —  Canvas → PNG → jsPDF
// Scale 3 = pixel-perfect at any zoom. PNG = no JPEG blur.
// Every bug from all previous versions fixed.
// ─────────────────────────────────────────────────────────────────────────────

// A4 = 595 × 842 pt. Canvas at 3× = 1785 × 2526 px.
const S   = 3;
const PW  = 595 * S;
const PH  = 842 * S;
const ML  = 44  * S;   // left margin (pts × S)
const MR  = 44  * S;
const CW  = PW - ML - MR;

const F   = "'Segoe UI','Helvetica Neue',Arial,sans-serif";

// ── Palette ──
const C = {
  navy:    "#0B1E3D", navyMd:  "#142952", navyLt:  "#1a3a6e",
  green:   "#0D9F6F", greenDk: "#085c40", greenLt: "#E6FAF3", greenBd: "#6EE7B7",
  blue:    "#2563EB", blueLt:  "#EFF6FF",
  amber:   "#D97706", amberLt: "#FFFBEB", amberBd: "#FCD34D",
  red:     "#DC2626", redLt:   "#FEF2F2", redBd:   "#FCA5A5",
  purple:  "#7C3AED", teal:    "#0891B2",
  ink:     "#0F172A", inkMd:   "#334155", inkSoft: "#64748B", inkFaint:"#94A3B8",
  surface: "#F8FAFC", surfMd:  "#F1F5F9", white:   "#FFFFFF",
  border:  "#E2E8F0", borderMd:"#CBD5E1",
};
const PALETTE = ["#2563EB","#0D9F6F","#D97706","#7C3AED","#DC2626","#0891B2","#C2410C","#BE185D"];

type Ctx = CanvasRenderingContext2D;

// ── Drawing helpers ──────────────────────────────────────────────────────────

/** Draw a rounded rect path (no fill/stroke — caller does that) */
function rrPath(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const R = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+R, y);
  ctx.lineTo(x+w-R, y); ctx.arcTo(x+w, y, x+w, y+R, R);
  ctx.lineTo(x+w, y+h-R); ctx.arcTo(x+w, y+h, x+w-R, y+h, R);
  ctx.lineTo(x+R, y+h); ctx.arcTo(x, y+h, x, y+h-R, R);
  ctx.lineTo(x, y+R); ctx.arcTo(x, y, x+R, y, R);
  ctx.closePath();
}
const fillRR = (ctx: Ctx, x: number, y: number, w: number, h: number, r: number, col: string) => {
  rrPath(ctx,x,y,w,h,r); ctx.fillStyle = col; ctx.fill();
};
const strokeRR = (ctx: Ctx, x: number, y: number, w: number, h: number, r: number, col: string, lw = 0.5) => {
  ctx.save(); rrPath(ctx,x,y,w,h,r); ctx.strokeStyle = col; ctx.lineWidth = lw*S; ctx.stroke(); ctx.restore();
};

/** Set font. Returns approximate line-height in px. */
const font = (ctx: Ctx, pt: number, bold = false, italic = false): number => {
  ctx.font = `${italic?"italic ":""}${bold?700:400} ${pt*S}px ${F}`;
  return pt * S * 1.3;
};

/** Clip text to maxPx; append "…" if too wide. Caller must set font first. */
const clip = (ctx: Ctx, text: string, maxPx: number): string => {
  if (!text) return "";
  if (ctx.measureText(text).width <= maxPx) return text;
  let lo = 0, hi = text.length;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    ctx.measureText(text.slice(0,mid)+"…").width <= maxPx ? (lo = mid) : (hi = mid);
  }
  return text.slice(0, lo) + "…";
};

/** Word-wrap into lines, each ≤ maxPx. Caller must set font first. */
const wrap = (ctx: Ctx, text: string, maxPx: number, maxLines = 99): string[] => {
  const words = String(text||"").split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur+" "+w : w;
    if (ctx.measureText(test).width > maxPx && cur) {
      lines.push(cur);
      cur = w;
      if (lines.length >= maxLines-1) break;
    } else cur = test;
  }
  if (cur) {
    if (lines.length >= maxLines) lines[lines.length-1] = clip(ctx, lines[lines.length-1]+" "+cur, maxPx);
    else lines.push(cur);
  }
  return lines.slice(0, maxLines);
};

// ── Page chrome ───────────────────────────────────────────────────────────────
const HDR = 56 * S;
const FTR = 34 * S;
const BODY_TOP = HDR + 16*S;
const BODY_BTM = PH - FTR - 10*S;

const drawChrome = (ctx: Ctx, pageNum: number, logo: HTMLImageElement|null) => {
  // Header band
  ctx.fillStyle = C.navy; ctx.fillRect(0, 0, PW, HDR);
  ctx.fillStyle = C.green; ctx.fillRect(0, HDR-2*S, PW, 2*S);

  // Logo — proportional, max height 36pt
  let brandX = ML;
  if (logo && logo.naturalWidth > 0) {
    const lh = 36*S;
    const lw = Math.round((logo.naturalWidth/logo.naturalHeight)*lh);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(logo, ML, (HDR-lh)/2, lw, lh);
    brandX = ML + lw + 10*S;
  }
  font(ctx, 10.5, true); ctx.fillStyle = C.white;
  ctx.fillText("Nivesify", brandX, HDR*0.47);
  font(ctx, 8); ctx.fillStyle = C.inkFaint;
  ctx.fillText("Thoughtful Money, Better Life", brandX, HDR*0.76);

  // Right side
  font(ctx, 9, true); ctx.fillStyle = C.white;
  const t = "Mutual Fund Health Check";
  ctx.fillText(t, PW-MR-ctx.measureText(t).width, HDR*0.44);
  font(ctx, 7.5); ctx.fillStyle = C.inkFaint;
  const d = `Page ${pageNum}  ·  ${new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}`;
  ctx.fillText(d, PW-MR-ctx.measureText(d).width, HDR*0.73);

  // Footer
  const fy = PH - FTR;
  ctx.strokeStyle = C.border; ctx.lineWidth = 0.4*S;
  ctx.beginPath(); ctx.moveTo(ML,fy); ctx.lineTo(PW-MR,fy); ctx.stroke();
  font(ctx, 7); ctx.fillStyle = C.inkFaint;
  const disc = "Past performance is not a guarantee of future results. Consult a SEBI-registered investment advisor before acting on any information in this report.";
  const dl = wrap(ctx, disc, CW-50*S, 2);
  dl.forEach((l,i) => ctx.fillText(l, ML, fy+12*S+i*10*S));
  // Page chip
  font(ctx, 8, true); ctx.fillStyle = C.white;
  const pg = String(pageNum);
  const cw2 = ctx.measureText(pg).width + 14*S;
  fillRR(ctx, PW-MR-cw2, fy+5*S, cw2, 17*S, 4*S, C.green);
  ctx.fillText(pg, PW-MR-cw2/2-ctx.measureText(pg).width/2, fy+16*S);
};

// ── Section header — FIXED NO-OVERLAP VERSION ─────────────────────────────────
// Layout: [tag pill] then [big title on next line] then [underline]
// Returns Y after everything including bottom padding.
const sHead = (ctx: Ctx, tag: string, title: string, y: number, accent = C.green): number => {
  const PILL_H  = 16 * S;
  const PILL_PX = 10 * S;
  const GAP     = 12 * S;   // space between pill bottom and title top
  const TITLE_H = 20 * S;   // approximate height of 18pt text

  // Pill
  font(ctx, 7.5, true); ctx.fillStyle = C.white;
  const tagW = ctx.measureText(tag.toUpperCase()).width + PILL_PX*2;
  fillRR(ctx, ML, y, tagW, PILL_H, 4*S, accent);
  ctx.fillText(tag.toUpperCase(), ML+PILL_PX, y+PILL_H*0.69);

  // Title — BELOW pill, with GAP
  const titleY = y + PILL_H + GAP + TITLE_H;  // baseline
  font(ctx, 18, true); ctx.fillStyle = C.ink;
  ctx.fillText(title, ML, titleY);

  // Underline
  const ulY = titleY + 5*S;
  const ulGrad = ctx.createLinearGradient(ML, 0, ML+80*S, 0);
  ulGrad.addColorStop(0, accent); ulGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = ulGrad; ctx.fillRect(ML, ulY, 80*S, 2.5*S);

  return ulY + 14*S;
};

// ── Metric card ───────────────────────────────────────────────────────────────
const metricCard = (ctx: Ctx, x: number, y: number, w: number, h: number, label: string, value: string, sub: string, accent: string) => {
  ctx.shadowColor = "rgba(0,0,0,0.07)"; ctx.shadowBlur = 6*S; ctx.shadowOffsetY = 2*S;
  fillRR(ctx, x, y, w, h, 7*S, C.white);
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  strokeRR(ctx, x, y, w, h, 7*S, C.border, 0.4);

  // Accent top bar
  fillRR(ctx, x, y, w, 4*S, 7*S, accent);
  ctx.fillStyle = accent; ctx.fillRect(x, y+2*S, w, 2*S);

  font(ctx, 8); ctx.fillStyle = C.inkFaint;
  ctx.fillText(clip(ctx, label, w-16*S), x+10*S, y+18*S);
  font(ctx, 14, true); ctx.fillStyle = accent;
  ctx.fillText(clip(ctx, value, w-16*S), x+10*S, y+37*S);
  if (sub) { font(ctx, 7.5); ctx.fillStyle = C.inkSoft; ctx.fillText(clip(ctx, sub, w-16*S), x+10*S, y+52*S); }
};

// ── Table ─────────────────────────────────────────────────────────────────────
type Col = { h: string; w: number; align?: "L"|"R"|"C"; colorFn?: (raw: string)=>string|null };

const drawTable = (ctx: Ctx, cols: Col[], rows: string[][], startY: number, opts: {maxLines?: number}={}): number => {
  const {maxLines = 3} = opts;
  const PAD_X = 9*S, PAD_Y = 7*S, LINE_H = 12*S, ROW_MIN = 26*S, HDR_H = 23*S;

  const total = cols.reduce((s,c) => s+c.w, 0);
  const sc = CW / total;
  const ws = cols.map(c => c.w*sc);
  const colX = (i: number) => ML + ws.slice(0,i).reduce((s,w) => s+w, 0);

  let Y = startY;

  const drawHdr = () => {
    fillRR(ctx, ML, Y, CW, HDR_H, 0, C.navyMd);
    cols.forEach((col,i) => {
      font(ctx, 7.5, true); ctx.fillStyle = "#94A3B8";
      const h2 = clip(ctx, col.h, ws[i]-PAD_X*2);
      const hw = ctx.measureText(h2).width;
      const tx = col.align==="R"?colX(i)+ws[i]-PAD_X-hw : col.align==="C"?colX(i)+(ws[i]-hw)/2 : colX(i)+PAD_X;
      ctx.fillText(h2, tx, Y+HDR_H*0.67);
      if (i < cols.length-1) {
        ctx.strokeStyle = C.navyLt; ctx.lineWidth = 0.3*S;
        ctx.beginPath(); ctx.moveTo(colX(i)+ws[i], Y+3*S); ctx.lineTo(colX(i)+ws[i], Y+HDR_H-3*S); ctx.stroke();
      }
    });
    Y += HDR_H;
  };

  drawHdr();

  rows.forEach((row, ri) => {
    const cells = cols.map((col,ci) => {
      const raw = String(row[ci] ?? "—");
      font(ctx, 9);
      return { lines: wrap(ctx, raw, ws[ci]-PAD_X*2, maxLines), raw, col };
    });
    const maxL = Math.max(...cells.map(c => c.lines.length), 1);
    const rowH = Math.max(ROW_MIN, maxL*LINE_H+PAD_Y*2);

    ctx.fillStyle = ri%2===0 ? C.white : C.surface;
    ctx.fillRect(ML, Y, CW, rowH);

    cells.forEach(({lines, raw, col}, ci) => {
      const cx = colX(ci);
      const aw = ws[ci] - PAD_X*2;
      const totalTH = lines.length * LINE_H;
      const vOff = (rowH - totalTH) / 2;

      lines.forEach((line, li) => {
        const ty = Y + vOff + (li+1)*LINE_H - 2*S;
        let color = C.ink;
        if (col.colorFn) { const c2 = col.colorFn(raw); if (c2) color = c2; }
        else if (raw.startsWith("+")) color = C.green;
        else if (raw.startsWith("-")) color = C.red;
        font(ctx, 9); ctx.fillStyle = color;
        const clamped = clip(ctx, line, aw);
        const tw = ctx.measureText(clamped).width;
        const tx = col.align==="R"?cx+ws[ci]-PAD_X-tw : col.align==="C"?cx+(ws[ci]-tw)/2 : cx+PAD_X;
        ctx.fillText(clamped, tx, ty);
      });
      if (ci < cols.length-1) {
        ctx.strokeStyle = C.border; ctx.lineWidth = 0.3*S;
        ctx.beginPath(); ctx.moveTo(cx+ws[ci], Y); ctx.lineTo(cx+ws[ci], Y+rowH); ctx.stroke();
      }
    });
    ctx.strokeStyle = C.border; ctx.lineWidth = 0.25*S;
    ctx.beginPath(); ctx.moveTo(ML, Y+rowH); ctx.lineTo(ML+CW, Y+rowH); ctx.stroke();
    Y += rowH;
  });
  return Y + 8*S;
};

// ── Stacked bar ───────────────────────────────────────────────────────────────
const stackedBar = (ctx: Ctx, items: {label:string;value:number;color:string}[], total: number, y: number): number => {
  const BH = 16*S;
  fillRR(ctx, ML, y, CW, BH, 3*S, C.surfMd);
  let bx = ML;
  items.forEach((item,i) => {
    const bw = total>0?(item.value/total)*CW:0; if (bw<1) return;
    ctx.fillStyle = item.color;
    if (i===0) { rrPath(ctx,bx,y,bw,BH,3*S); ctx.fill(); }
    else if (i===items.length-1) { ctx.fillRect(bx,y,bw-3*S,BH); rrPath(ctx,bx+bw-3*S,y,3*S,BH,3*S); ctx.fill(); }
    else ctx.fillRect(bx, y, bw, BH);
    bx += bw;
  });
  strokeRR(ctx, ML, y, CW, BH, 3*S, C.borderMd, 0.5);
  y += BH + 8*S;
  let lx = ML;
  items.forEach(item => {
    const pct = total>0?(item.value/total)*100:0; if (pct < 0.5) return;
    font(ctx, 7.5); ctx.fillStyle = C.inkMd;
    const lbl = `${item.label.slice(0,18)}  ${pct.toFixed(1)}%`;
    const lw = ctx.measureText(lbl).width + 16*S;
    if (lx+lw > ML+CW-8*S) { y += 13*S; lx = ML; }
    fillRR(ctx, lx, y-6*S, 9*S, 9*S, 2*S, item.color);
    ctx.fillText(lbl, lx+13*S, y+1*S);
    lx += lw + 8*S;
  });
  return y + 14*S;
};

// ── Insight card ──────────────────────────────────────────────────────────────
type CardType = "action"|"review"|"info"|"good";
const insightCard = (ctx: Ctx, card: PdfInsightCard, idx: number, type: CardType, y: number): number => {
  const pal = {
    action: {bg:C.redLt,    border:C.redBd,   accent:C.red,    tag:"ACTION NEEDED"},
    review: {bg:C.amberLt,  border:C.amberBd, accent:C.amber,  tag:"REVIEW THIS"},
    info:   {bg:C.blueLt,   border:"#93C5FD", accent:C.blue,   tag:"GOOD TO KNOW"},
    good:   {bg:C.greenLt,  border:C.greenBd, accent:C.green,  tag:"ALL GOOD"},
  }[type];

  font(ctx, 10.5, true); const tL = wrap(ctx, card.title,  CW-42*S, 2);
  font(ctx, 9);          const sL = wrap(ctx, card.summary, CW-42*S, 4);
  font(ctx, 8.5);        const dL = wrap(ctx, "What to do: "+card.detail, CW-42*S, 3);
  const CH = (18 + tL.length*13.5 + sL.length*12.5 + dL.length*11.5 + 28) * S;

  ctx.shadowColor = "rgba(0,0,0,0.05)"; ctx.shadowBlur=6*S; ctx.shadowOffsetY=2*S;
  fillRR(ctx, ML, y, CW, CH, 8*S, pal.bg);
  ctx.shadowColor="transparent"; ctx.shadowBlur=0; ctx.shadowOffsetY=0;
  strokeRR(ctx, ML, y, CW, CH, 8*S, pal.border, 0.5);
  fillRR(ctx, ML, y, 5*S, CH, 5*S, pal.accent);
  ctx.fillStyle=pal.accent; ctx.fillRect(ML+3*S, y, 2*S, CH);

  let iy = y + 14*S;
  font(ctx, 8.5, true); ctx.fillStyle = pal.accent; ctx.fillText(`${idx+1}.`, ML+12*S, iy);
  font(ctx, 7.5, true); ctx.fillStyle = C.white;
  const tw2 = ctx.measureText(pal.tag).width + 12*S;
  fillRR(ctx, ML+26*S, y+5*S, tw2, 14*S, 3*S, pal.accent);
  ctx.fillText(pal.tag, ML+32*S, y+14.5*S);
  iy += 15*S;

  tL.forEach(l => { font(ctx,10.5,true); ctx.fillStyle=C.ink; ctx.fillText(l,ML+12*S,iy); iy+=13.5*S; });
  iy += 3*S;
  sL.forEach(l => { font(ctx,9); ctx.fillStyle=C.inkMd; ctx.fillText(l,ML+12*S,iy); iy+=12.5*S; });
  iy += 5*S;
  dL.forEach(l => { ctx.font=`italic ${8.5*S}px ${F}`; ctx.fillStyle=pal.accent; ctx.fillText(l,ML+12*S,iy); iy+=11.5*S; });

  return y + CH + 10*S;
};

// ── Horizontal bar ────────────────────────────────────────────────────────────
const horizBar = (ctx: Ctx, label: string, pct: number, value: string, accent: string, rank: number, y: number): number => {
  const BH = 26*S;
  // Full-width track
  fillRR(ctx, ML, y, CW, BH, 4*S, C.surfMd);
  // Proportional fill — minimum 60px so text is always readable
  const bw = Math.max(pct*CW, 60*S);
  fillRR(ctx, ML, y, bw, BH, 4*S, accent);

  // Rank + fund name inside bar (white if bar is wide enough, dark otherwise)
  font(ctx, 9, true); ctx.fillStyle = pct > 0.15 ? C.white : C.ink;
  ctx.fillText(`${rank}.  ${clip(ctx, label, Math.max(bw-16*S, 120*S))}`, ML+9*S, y+BH*0.615);

  // Value always at far right
  const vs = `${value}  (${(pct*100).toFixed(1)}%)`;
  font(ctx, 9, true); ctx.fillStyle = pct > 0.6 ? C.white : C.inkMd;
  ctx.fillText(vs, ML+CW-ctx.measureText(vs).width-8*S, y+BH*0.615);

  return y + BH + 6*S;
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export const generatePdfReport = async (params: {
  logoUrl: string;
  summary: {totalValue:number;invested:number;allTimeProfit:number;monthlyIncome:number};
  xirrValue: number|null;
  report: ReportData;
  insights: PdfInsights;
  holder: {name:string;pan?:string;email?:string};
  chartIds: {performance:string;scheme:string;amc:string};
}) => {
  const [{jsPDF}] = await Promise.all([import("jspdf")]);
  const {summary, report, xirrValue, logoUrl, holder, insights} = params;

  // Load logo properly
  let logo: HTMLImageElement|null = null;
  try {
    logo = await new Promise<HTMLImageElement>((res,rej) => {
      const img = new Image(); img.crossOrigin = "anonymous";
      img.onload = () => res(img); img.onerror = rej; img.src = logoUrl;
    });
  } catch { /* skip */ }

  const mkCanvas = (): [HTMLCanvasElement, Ctx] => {
    const c = document.createElement("canvas");
    c.width = PW; c.height = PH;
    const ctx = c.getContext("2d", {alpha:false})!;
    ctx.fillStyle = C.surface; ctx.fillRect(0,0,PW,PH);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
    return [c, ctx];
  };

  const pages: HTMLCanvasElement[] = [];

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PAGE 1 — COVER  "Your Portfolio Report Card"
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    const [c, ctx] = mkCanvas(); pages.push(c);

    // Dark gradient background
    const bg = ctx.createLinearGradient(0, 0, PW*0.65, PH);
    bg.addColorStop(0, "#0B1E3D"); bg.addColorStop(0.65, "#122d5a"); bg.addColorStop(1, "#08271a");
    ctx.fillStyle = bg; ctx.fillRect(0,0,PW,PH);

    // Radial glows
    const g1 = ctx.createRadialGradient(PW, 0, 0, PW, 0, 420*S);
    g1.addColorStop(0, "rgba(13,159,111,0.18)"); g1.addColorStop(1, "rgba(13,159,111,0)");
    ctx.fillStyle = g1; ctx.fillRect(0,0,PW,PH);
    const g2 = ctx.createRadialGradient(0, PH, 0, 0, PH, 380*S);
    g2.addColorStop(0, "rgba(37,99,235,0.14)"); g2.addColorStop(1, "rgba(37,99,235,0)");
    ctx.fillStyle = g2; ctx.fillRect(0,0,PW,PH);

    // Green left rail
    const rail = ctx.createLinearGradient(0,0,0,PH);
    rail.addColorStop(0, C.green); rail.addColorStop(1, "#065f46");
    ctx.fillStyle = rail; ctx.fillRect(0,0,6*S,PH);
    ctx.fillStyle = C.greenDk; ctx.fillRect(6*S,0,1*S,PH);

    // Logo top-left
    let brandX = ML + 6*S;
    if (logo && logo.naturalWidth > 0) {
      const lh = 44*S;
      const lw = Math.round((logo.naturalWidth/logo.naturalHeight)*lh);
      ctx.drawImage(logo, ML+6*S, 48*S, lw, lh);
      brandX = ML + 6*S + lw + 14*S;
    }
    font(ctx, 15, true); ctx.fillStyle = C.white; ctx.fillText("Nivesify", brandX, 68*S);
    font(ctx, 9); ctx.fillStyle = C.inkFaint; ctx.fillText("Thoughtful Money, Better Life", brandX, 84*S);

    // Report label
    font(ctx, 8.5, true); ctx.fillStyle = C.green;
    ctx.fillText("MUTUAL FUND HEALTH CHECK  ·  YOUR PERSONAL REPORT", ML+6*S, 140*S);

    // Big title
    font(ctx, 36, true); ctx.fillStyle = C.white;
    ctx.fillText("Your Portfolio", ML+6*S, 185*S);
    ctx.fillText("Report Card", ML+6*S, 230*S);

    // Gradient underline
    const ul = ctx.createLinearGradient(ML+6*S,0,ML+180*S,0);
    ul.addColorStop(0, C.green); ul.addColorStop(1, "rgba(13,159,111,0)");
    ctx.fillStyle = ul; ctx.fillRect(ML+6*S, 240*S, 180*S, 3*S);

    font(ctx, 9.5); ctx.fillStyle = "rgba(148,163,184,0.85)";
    ctx.fillText("Plain English  ·  No Jargon  ·  Clear Action Steps", ML+6*S, 258*S);

    // ── Investor info box ──
    const HX = ML+6*S, HY = 274*S, HW = CW-6*S, HH = 72*S;
    fillRR(ctx, HX, HY, HW, HH, 8*S, "rgba(26,58,110,0.75)");
    strokeRR(ctx, HX, HY, HW, HH, 8*S, "rgba(37,99,235,0.3)", 0.5);
    fillRR(ctx, HX, HY, 5*S, HH, 5*S, C.green);
    ctx.fillStyle = C.green; ctx.fillRect(HX+3*S, HY, 2*S, HH);

    font(ctx, 7.5, true); ctx.fillStyle = "rgba(148,163,184,0.8)";
    ctx.fillText("REPORT PREPARED FOR", HX+14*S, HY+17*S);

    // Holder name — use email as fallback if name looks like email
    const displayName = (holder.name && !holder.name.includes("@")) ? holder.name : (holder.email || "Investor");
    font(ctx, 13, true); ctx.fillStyle = C.white;
    ctx.fillText(clip(ctx, displayName, HW-110*S), HX+14*S, HY+33*S);
    font(ctx, 8); ctx.fillStyle = C.inkFaint;
    const panStr  = holder.pan   ? `PAN: ${holder.pan}`  : "";
    const emlStr  = holder.email ? holder.email           : "";
    if (panStr) ctx.fillText(panStr, HX+14*S, HY+50*S);
    if (emlStr) ctx.fillText(clip(ctx, emlStr, HW/2-20*S), panStr?HX+HW/2:HX+14*S, HY+50*S);
    ctx.fillText(`Generated: ${new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"})}`, HX+14*S, HY+65*S);

    // ── Health score + 3 KPI cards ──
    const CARD_Y = HY + HH + 18*S;
    const RING_R = 52*S;
    const RING_CX = ML + 6*S + RING_R + 8*S;
    const RING_CY = CARD_Y + RING_R + 14*S;
    const RING_BLOCK_H = RING_R*2 + 32*S;

    // Compute health score
    const xpct2 = (xirrValue??0)*100;
    const score = xpct2>=15?90:xpct2>=12?78:xpct2>=9?62:xpct2>=6?48:34;
    const scoreLabel = score>=80?"Excellent":score>=65?"Healthy":score>=50?"Fair":"Needs Work";
    const scoreCol = score>=65?C.green:score>=50?C.amber:C.red;

    // Ring background track
    ctx.beginPath(); ctx.arc(RING_CX, RING_CY, RING_R, 0, Math.PI*2);
    ctx.strokeStyle="rgba(255,255,255,0.1)"; ctx.lineWidth=10*S; ctx.stroke();
    // Ring fill
    ctx.beginPath(); ctx.arc(RING_CX, RING_CY, RING_R, -Math.PI/2, -Math.PI/2+(score/100)*Math.PI*2);
    ctx.strokeStyle=scoreCol; ctx.lineWidth=10*S; ctx.lineCap="round"; ctx.stroke();
    // Score number
    ctx.textAlign = "center";
    font(ctx, 26, true); ctx.fillStyle = C.white; ctx.fillText(String(score), RING_CX, RING_CY+9*S);
    font(ctx, 8); ctx.fillStyle="rgba(255,255,255,0.6)"; ctx.fillText(scoreLabel, RING_CX, RING_CY+24*S);
    ctx.textAlign = "left";
    font(ctx, 7.5); ctx.fillStyle="rgba(255,255,255,0.45)"; ctx.textAlign="center";
    ctx.fillText("Portfolio", RING_CX, CARD_Y+RING_BLOCK_H+2*S);
    ctx.fillText("Health Score", RING_CX, CARD_Y+RING_BLOCK_H+14*S);
    ctx.textAlign="left";

    // 3 KPI cards — to the right of ring
    const KX = RING_CX + RING_R + 22*S;
    const KW = PW - MR - KX;
    const KH = (RING_BLOCK_H - 16*S) / 3;
    const xirrAccent = xpct2>=12?C.green:xpct2>=8?C.amber:C.red;

    const kpis = [
      {l:"Total Portfolio Value",  v:fmtCur(summary.totalValue),   s:"Current market value of all funds",   a:C.green},
      {l:"Your Annual Return",     v:fmtPct(xirrValue,2),          s:`12-14% is a good target to aim for`,  a:xirrAccent},
      {l:"Total Profit Earned",    v:fmtCur(summary.allTimeProfit), s:`On investment of ${fmtCur(summary.invested)}`, a:(summary.allTimeProfit||0)>=0?C.green:C.red},
    ];
    kpis.forEach((kpi,i) => {
      const KY = CARD_Y + i*(KH+8*S);
      fillRR(ctx, KX, KY, KW, KH, 7*S, "rgba(22,36,74,0.85)");
      strokeRR(ctx, KX, KY, KW, KH, 7*S, "rgba(255,255,255,0.06)", 0.5);
      fillRR(ctx, KX, KY, KW, 4*S, 4*S, kpi.a);
      ctx.fillStyle=kpi.a; ctx.fillRect(KX, KY+2*S, KW, 2*S);
      font(ctx,7.5); ctx.fillStyle=C.inkFaint; ctx.fillText(kpi.l, KX+10*S, KY+19*S);
      font(ctx,15,true); ctx.fillStyle=kpi.a; ctx.fillText(clip(ctx,kpi.v,KW-18*S), KX+10*S, KY+KH*0.58);
      font(ctx,7); ctx.fillStyle=C.inkFaint; ctx.fillText(clip(ctx,kpi.s,KW-16*S), KX+10*S, KY+KH-10*S);
    });

    // ── 4 secondary stat chips ──
    const SEC_Y = CARD_Y + RING_BLOCK_H + 30*S;
    const SW    = (HW) / 4;
    const SH    = 58*S;
    const stats = [
      {l:"Amount Invested",    v:fmtCur(summary.invested)},
      {l:"Number of Funds",    v:`${report.holdingsCount} funds`},
      {l:"Biggest Fund Share", v:fmtShare(report.topOneShare)},
      {l:"Est. Monthly Income",v:fmtCur(summary.monthlyIncome)},
    ];
    stats.forEach((st,i) => {
      const SX = HX + i*SW;
      fillRR(ctx, SX, SEC_Y, SW-8*S, SH, 6*S, "rgba(22,36,74,0.7)");
      strokeRR(ctx, SX, SEC_Y, SW-8*S, SH, 6*S, "rgba(255,255,255,0.06)", 0.4);
      font(ctx,7.5); ctx.fillStyle=C.inkFaint; ctx.fillText(st.l, SX+10*S, SEC_Y+18*S);
      font(ctx,13,true); ctx.fillStyle=C.white; ctx.fillText(clip(ctx,st.v,SW-26*S), SX+10*S, SEC_Y+42*S);
    });

    // Cover disclaimer
    const DY = PH - 38*S;
    ctx.strokeStyle="rgba(26,58,110,0.8)"; ctx.lineWidth=0.4*S;
    ctx.beginPath(); ctx.moveTo(HX,DY); ctx.lineTo(HX+HW,DY); ctx.stroke();
    font(ctx,7); ctx.fillStyle="rgba(100,116,139,0.7)";
    const disc2 = "Past performance is not a guarantee of future results. Consult a SEBI-registered investment advisor before acting on any information in this report. Nivesify does not provide SEBI-registered investment advice.";
    const dl2 = wrap(ctx, disc2, HW, 2);
    dl2.forEach((l,i) => ctx.fillText(l, HX, DY+13*S+i*10*S));
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PAGE 2 — YOUR MONEY AT A GLANCE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    const [c, ctx] = mkCanvas(); pages.push(c);
    drawChrome(ctx, 2, logo);
    let Y = BODY_TOP;

    Y = sHead(ctx, "Your Money", "Your Money at a Glance", Y, C.blue);

    const GAP = 8*S;
    const CW4 = (CW - GAP*3) / 4;
    const CH  = 64*S;

    const xirrAcc = (xirrValue??0)*100>=12?C.green:(xirrValue??0)*100>=8?C.amber:C.red;

    const row1 = [
      {l:"Total Portfolio Value",  v:fmtCur(summary.totalValue),   s:"Current value of all funds",   a:C.blue},
      {l:"Total Amount Invested",  v:fmtCur(summary.invested),      s:"Money you've put in over time", a:C.inkSoft},
      {l:"Total Profit Earned",    v:fmtCur(summary.allTimeProfit), s:"Gains so far",                 a:(summary.allTimeProfit||0)>=0?C.green:C.red},
      {l:"Your Annual Return",     v:fmtPct(xirrValue,2),           s:"How fast your money is growing",a:xirrAcc},
    ];
    row1.forEach((m,i) => metricCard(ctx, ML+i*(CW4+GAP), Y, CW4, CH, m.l, m.v, m.s, m.a));
    Y += CH + 10*S;

    const row2 = [
      {l:"Number of Funds",        v:`${report.holdingsCount}`,      s:"Currently active",             a:C.purple},
      {l:"Biggest Fund (% share)", v:fmtShare(report.topOneShare),   s:"% in your single largest fund",a:report.topOneShare>0.3?C.amber:C.green},
      {l:"Top 5 Funds Combined",   v:fmtShare(report.topFiveShare),  s:"% held in your top 5",         a:report.topFiveShare>0.65?C.amber:C.green},
      {l:"Est. Monthly Income",    v:fmtCur(summary.monthlyIncome),  s:"Based on 25× annual expenses",  a:C.teal},
    ];
    row2.forEach((m,i) => metricCard(ctx, ML+i*(CW4+GAP), Y, CW4, CH, m.l, m.v, m.s, m.a));
    Y += CH + 16*S;

    // Divider
    ctx.strokeStyle=C.border; ctx.lineWidth=0.5*S;
    ctx.beginPath(); ctx.moveTo(ML,Y); ctx.lineTo(ML+CW,Y); ctx.stroke(); Y += 14*S;

    // In summary banner
    font(ctx, 9);
    const esLines = wrap(ctx, insights.executiveSummary, CW-30*S, 4);
    const ESH = (esLines.length*13 + 34)*S;
    fillRR(ctx, ML, Y, CW, ESH, 8*S, C.greenLt);
    strokeRR(ctx, ML, Y, CW, ESH, 8*S, C.greenBd, 0.5);
    fillRR(ctx, ML, Y, 5*S, ESH, 5*S, C.green);
    ctx.fillStyle=C.green; ctx.fillRect(ML+3*S, Y, 2*S, ESH);
    font(ctx,7.5,true); ctx.fillStyle=C.green; ctx.fillText("IN SUMMARY", ML+14*S, Y+15*S);
    esLines.forEach((l,i) => { font(ctx,9); ctx.fillStyle=C.inkMd; ctx.fillText(l,ML+14*S,Y+27*S+i*13*S); });
    Y += ESH + 16*S;

    ctx.strokeStyle=C.border; ctx.lineWidth=0.5*S;
    ctx.beginPath(); ctx.moveTo(ML,Y); ctx.lineTo(ML+CW,Y); ctx.stroke(); Y += 14*S;

    Y = sHead(ctx, "How You Compare", "How Your Portfolio Compares to the Market", Y, C.purple);

    // Investor-friendly column names (no "Metric", "Value", "What It Means" jargon)
    Y = drawTable(ctx,
      [
        {h:"What We Checked",     w:185},
        {h:"Your Number",         w:90, align:"R"},
        {h:"What This Means for You", w:248},
      ],
      insights.metrics.map(m => [m.title, m.value, m.note]),
      Y, {maxLines:2}
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PAGE 3 — YOUR ACTION PLAN
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    const [c, ctx] = mkCanvas(); pages.push(c);
    drawChrome(ctx, 3, logo);
    let Y = BODY_TOP;

    Y = sHead(ctx, "Your Action Plan", "What Should You Do Next?", Y, C.green);
    font(ctx,9); ctx.fillStyle=C.inkSoft;
    ctx.fillText("Based on your portfolio — here is what to do, explained simply.", ML, Y); Y += 16*S;

    insights.insightCards.forEach((card, i) => {
      const lt = card.title.toLowerCase();
      const type: CardType =
        lt.includes("returns are below")||lt.includes("trailing")||lt.includes("too many")||lt.includes("bottom") ? "action" :
        lt.includes("review")||lt.includes("drift")||lt.includes("high")||lt.includes("fund house") ? "review" :
        lt.includes("excellent")||lt.includes("healthy")||lt.includes("well-structured") ? "good" : "info";
      if (Y + 60*S > BODY_BTM) return;
      Y = insightCard(ctx, card, i, type, Y);
    });
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PAGE 4 — YOUR FUND REPORT CARD
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    const [c, ctx] = mkCanvas(); pages.push(c);
    drawChrome(ctx, 4, logo);
    let Y = BODY_TOP;

    Y = sHead(ctx, "Fund Report Card", "Which Funds to Keep and Which to Review", Y, C.amber);
    font(ctx,9); ctx.fillStyle=C.inkSoft;
    ctx.fillText(`${insights.activeAuditRows.length} actively managed funds — graded on whether they earn more than the market index, after fees.`, ML, Y); Y += 16*S;

    // Clean up action text: remove "!", "!'", and make suggestions plain English
    const cleanAction = (action: string): string =>
      action.replace(/!'?\s*/g, "Try: ").replace(/→/g, "→").replace(/\s+/g," ").trim();

    const actionColorFn = (raw: string): string|null => {
      const r = raw.toLowerCase();
      if (r.startsWith("continue")) return C.green;
      if (r.startsWith("review")||r.startsWith("try")) return C.amber;
      return null;
    };
    const gapColorFn = (raw: string): string|null => {
      if (raw==="-"||raw==="—") return null;
      const n = parseFloat(raw);
      if (isNaN(n)) return null;
      return n >= 0 ? C.green : C.red;
    };

    Y = drawTable(ctx,
      [
        {h:"Fund Name",         w:175},
        {h:"Market Index Used", w:140},
        {h:"Beats Index By",    w:70, align:"R", colorFn:gapColorFn},
        {h:"Verdict",           w:138, colorFn:actionColorFn},
      ],
      insights.activeAuditRows.map(r => [
        r.name,
        r.benchmark||"—",
        r.gap||"—",
        cleanAction(r.action),
      ]),
      Y, {maxLines:2}
    );

    // Legend
    const LY = Y;
    fillRR(ctx, ML, LY, CW, 24*S, 4*S, C.surface);
    font(ctx,7.5,true); ctx.fillStyle=C.inkMd; ctx.fillText("Verdict guide:", ML+8*S, LY+15.5*S);
    const legItems = [{c:C.green,l:"Continue — this fund beats the market index after fees"},{c:C.amber,l:"Review — costs more than it earns above the index"}];
    let llx = ML+98*S;
    legItems.forEach(lg => {
      fillRR(ctx,llx,LY+7.5*S,9*S,9*S,2*S,lg.c);
      font(ctx,7.5); ctx.fillStyle=C.inkMd; ctx.fillText(lg.l,llx+13*S,LY+15.5*S); llx+=ctx.measureText(lg.l).width+28*S;
    });
    Y += 32*S;

    ctx.strokeStyle=C.border; ctx.lineWidth=0.5*S;
    ctx.beginPath(); ctx.moveTo(ML,Y); ctx.lineTo(ML+CW,Y); ctx.stroke(); Y += 14*S;

    Y = sHead(ctx, "Index Funds", "Your Index & ETF Funds", Y, C.blue);
    font(ctx,9); ctx.fillStyle=C.inkSoft;
    ctx.fillText(`${insights.passiveAuditRows.length} index/ETF funds — these should follow their index as closely and cheaply as possible.`, ML, Y); Y += 16*S;

    Y = drawTable(ctx,
      [
        {h:"Fund Name",             w:178},
        {h:"Tracks This Index",     w:135},
        {h:"Return vs Index",       w:68, align:"R", colorFn:gapColorFn},
        {h:"Tracking Accuracy",     w:72, align:"R"},
        {h:"Verdict",               w:70, colorFn:actionColorFn},
      ],
      insights.passiveAuditRows.map(r => [
        r.name, r.benchmark||"—", r.gap||"—", r.tracking||"—",
        cleanAction(r.action),
      ]),
      Y, {maxLines:2}
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PAGE 5 — WHERE IS YOUR MONEY?
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    const [c, ctx] = mkCanvas(); pages.push(c);
    drawChrome(ctx, 5, logo);
    let Y = BODY_TOP;

    Y = sHead(ctx, "Where Is Your Money", "Where Is Your Money Invested?", Y, C.blue);

    // Category
    const catMap = new Map<string,{cur:number;inv:number}>();
    report.fundDetails.forEach(f => { const e=catMap.get(f.majorCategory)||{cur:0,inv:0}; catMap.set(f.majorCategory,{cur:e.cur+f.currentValue,inv:e.inv+f.invested}); });
    const catItems = Array.from(catMap.entries()).map(([n,v],i) => ({label:n,value:v.cur,invested:v.inv,color:PALETTE[i%PALETTE.length]})).sort((a,b)=>b.value-a.value);

    font(ctx,10.5,true); ctx.fillStyle=C.inkMd; ctx.fillText("By Fund Type (Equity / Debt / Hybrid etc.)", ML, Y); Y+=14*S;
    Y = stackedBar(ctx, catItems, summary.totalValue, Y);
    Y = drawTable(ctx,
      [{h:"Fund Type",w:165},{h:"Worth Today",w:112,align:"R"},{h:"You Invested",w:112,align:"R"},{h:"% of Total",w:75,align:"R"},{h:"Profit/Loss",w:59,align:"R"}],
      catItems.map(c2 => { const g=c2.value-c2.invested; return [c2.label,fmtCur(c2.value),fmtCur(c2.invested),fmtShare(summary.totalValue?c2.value/summary.totalValue:0),`${g>=0?"+":""}${fmtCur(g)}`]; }),
      Y, {maxLines:1}
    );

    Y += 10*S;
    font(ctx,10.5,true); ctx.fillStyle=C.inkMd; ctx.fillText("By Fund House", ML, Y); Y+=14*S;
    Y = stackedBar(ctx, report.amcBreakdown.slice(0,8).map((a,i)=>({label:a.name,value:a.value,color:PALETTE[i%PALETTE.length]})), summary.totalValue, Y);
    Y = drawTable(ctx,
      [{h:"Fund House",w:232},{h:"Worth Today",w:112,align:"R"},{h:"% of Total",w:80,align:"R"},{h:"No. of Funds",w:99,align:"C"}],
      report.amcBreakdown.slice(0,10).map(a => [a.name,fmtCur(a.value),fmtShare(summary.totalValue?a.value/summary.totalValue:0),`${report.fundDetails.filter(f=>f.amc===a.name).length}`]),
      Y, {maxLines:1}
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PAGE 6 — ALL YOUR FUNDS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    const [c, ctx] = mkCanvas(); pages.push(c);
    drawChrome(ctx, 6, logo);
    let Y = BODY_TOP;

    Y = sHead(ctx, "All Your Funds", "Complete Fund List with Performance", Y, C.inkSoft);
    font(ctx,9); ctx.fillStyle=C.inkSoft;
    ctx.fillText(`${report.holdingsCount} funds  ·  Sorted by value  ·  Annual Return shown where more than 1 year of data exists`, ML, Y); Y+=16*S;

    const profitColor = (raw: string): string|null => {
      if (raw.startsWith("+")) return C.green;
      if (raw.startsWith("-")) return C.red;
      return null;
    };
    const xirrColor = (raw: string): string|null => {
      if (raw==="N/A") return C.inkFaint;
      const n = parseFloat(raw);
      if (isNaN(n)) return null;
      return n<0?C.red:n>=12?C.green:C.inkMd;
    };

    Y = drawTable(ctx,
      [
        {h:"Fund Name",     w:175},
        {h:"Type",          w:60},
        {h:"You Invested",  w:72, align:"R"},
        {h:"Worth Today",   w:76, align:"R"},
        {h:"Profit / Loss", w:74, align:"R", colorFn:profitColor},
        {h:"Annual Return", w:66, align:"R", colorFn:xirrColor},
      ],
      report.fundDetails.map(f => {
        const g=f.profit;
        return [f.name, f.majorCategory, fmtCur(f.invested), fmtCur(f.currentValue), `${g>=0?"+":""}${fmtCur(g)}`, fmtPct(f.xirr,2)];
      }),
      Y, {maxLines:2}
    );

    // Top 5 visual — full-width bars with proper scaling
    if (Y + 30*S < BODY_BTM) {
      ctx.strokeStyle=C.border; ctx.lineWidth=0.5*S;
      ctx.beginPath(); ctx.moveTo(ML,Y); ctx.lineTo(ML+CW,Y); ctx.stroke(); Y+=12*S;
      font(ctx,13,true); ctx.fillStyle=C.ink; ctx.fillText("Your 5 Largest Holdings", ML, Y); Y+=16*S;

      report.topHoldings.forEach((h,i) => {
        if (Y+32*S > BODY_BTM) return;
        const pct = summary.totalValue ? h.value/summary.totalValue : 0;
        Y = horizBar(ctx, h.name, pct, fmtCur(h.value), PALETTE[i%PALETTE.length], i+1, Y);
      });
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ASSEMBLE PDF — PNG pages (no JPEG blur)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const doc = new jsPDF({unit:"pt", format:"a4", compress:true});
  pages.forEach((cv, i) => {
    if (i > 0) doc.addPage();
    const img = cv.toDataURL("image/png");
    doc.addImage(img, "PNG", 0, 0, 595, 842);
  });
  doc.save("nivesify-portfolio-report.pdf");
};