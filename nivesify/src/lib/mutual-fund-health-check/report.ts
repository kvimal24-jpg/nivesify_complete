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
  const a = Math.abs(n), sg = n < 0 ? "-" : "";
  if (a >= 10_000_000) return `${sg}₹${(a/10_000_000).toFixed(2)} Cr`;
  if (a >= 100_000)    return `${sg}₹${(a/100_000).toFixed(2)} L`;
  if (a >= 1_000)      return `${sg}₹${new Intl.NumberFormat("en-IN",{maximumFractionDigits:0}).format(a)}`;
  return `${sg}₹${a.toFixed(0)}`;
};
const fmtPct  = (v: number|null, d=2) => (!v||!Number.isFinite(v)) ? "N/A" : `${(v*100).toFixed(d)}%`;
const fmtShr  = (v: number) => `${(Math.max(0,v)*100).toFixed(1)}%`;
const catOf   = (c?: string) => { if (!c) return "Other"; const l=c.toLowerCase(); if (l.includes("equity")) return "Equity"; if (l.includes("debt")||l.includes("bond")||l.includes("gilt")) return "Debt"; if (l.includes("hybrid")||l.includes("balanced")) return "Hybrid"; return "Other"; };
const amcOf   = (m?: MatchingScheme, fb?: string) => { if (m?.amc) return m.amc; const n=m?.schemeName||fb||""; return (n.match(/^(.*?Mutual Fund)/i)?.[1]??n.split(" ")[0])||"Other"; };
const mkMeta  = (txns: InvestmentsData["transactions"]=[], lk?: Map<number,MatchingScheme>) => { const m=new Map<number,MatchingScheme>(); txns.forEach(t=>{if(t.matchingScheme?.schemeCode)m.set(t.matchingScheme.schemeCode,t.matchingScheme);}); lk?.forEach((s,c)=>m.set(c,{...(m.get(c)??{}as MatchingScheme),...s})); return m; };

// ─────────────────────────────────────────────────────────────────────────────
// buildReportData
// ─────────────────────────────────────────────────────────────────────────────
export const buildReportData = (data: InvestmentsData, portfolio: Portfolio, totalValue: number, xirrValue: number|null, schemeLookup?: Map<number,MatchingScheme>): ReportData => {
  const nomMap=data.nominees||{};
  const meta=mkMeta(data.transactions||[],schemeLookup);
  const active=portfolio.filter(r=>r.currentValue>0);
  const sorted=[...active].sort((a,b)=>b.currentValue-a.currentValue);
  const holdingsCount=active.length;
  const topOneShare=totalValue?(sorted[0]?.currentValue||0)/totalValue:0;
  const topFiveShare=totalValue?sorted.slice(0,5).reduce((s,f)=>s+f.currentValue,0)/totalValue:0;
  const schemeRoot: SchemeBreakdownNode={name:"All Schemes",children:[]};
  const majMap=new Map<string,SchemeBreakdownNode>();
  active.forEach(row=>{const m2=meta.get(row.schemeCode),maj=catOf(m2?.schemeCategory),sub=m2?.schemeCategory||"Uncategorized";if(!majMap.has(maj)){const nd={name:maj,children:[]as SchemeBreakdownNode[],size:0};majMap.set(maj,nd);schemeRoot.children?.push(nd);}const mn=majMap.get(maj)!;let sn=mn.children?.find(ch=>ch.name===sub);if(!sn){sn={name:sub,children:[],size:0};mn.children?.push(sn);}const v=Math.max(0,row.currentValue);sn.children?.push({name:row.mfName,size:v,value:v});(sn as any).size=(sn.size||0)+v;(mn as any).size=(mn.size||0)+v;});
  const amcMap=new Map<string,number>();
  active.forEach(r=>{const a=amcOf(meta.get(r.schemeCode),r.mfName);amcMap.set(a,(amcMap.get(a)||0)+Math.max(0,r.currentValue));});
  const amcBreakdown=Array.from(amcMap.entries()).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
  const topAmcShare=totalValue?(amcBreakdown[0]?.value||0)/totalValue:0;
  const allocMap=new Map<string,number>();
  active.forEach(r=>{const b=catOf(meta.get(r.schemeCode)?.schemeCategory);allocMap.set(b,(allocMap.get(b)||0)+Math.max(0,r.currentValue));});
  const eq=totalValue?(allocMap.get("Equity")||0)/totalValue:0;
  const insights: ReportInsight[]=[];
  const add=(i: ReportInsight)=>insights.push(i);
  if(holdingsCount>8) add({title:"Too many funds — time to simplify",signal:holdingsCount>10?"Strong":"Watch-worthy",observation:`You hold ${holdingsCount} different funds.`,meaning:"More than 6-8 funds doesn't help. It just spreads your money thin without improving returns.",reassurance:"This is fixable — consolidate similar funds into one.",suggestedCheck:"Pick the best fund in each category and exit the rest.",severity:"warning"});
  if(topOneShare>=0.3) add({title:"Too much riding on one fund",signal:topOneShare>=0.4?"Strong":"Watch-worthy",observation:`${fmtShr(topOneShare)} of your money is in a single fund.`,meaning:"If that one fund has a bad year, your entire portfolio gets hit hard.",reassurance:"Fine if it's intentional. Risky if it grew this large by accident.",suggestedCheck:"Ask yourself: would you invest this much in this fund if starting fresh?",severity:"warning"});
  if(topAmcShare>=0.4) add({title:"One fund company holds too much",signal:"Strong",observation:`${fmtShr(topAmcShare)} managed by a single fund house.`,meaning:"Concentration in one company adds unnecessary operational risk.",reassurance:"Large AMCs are very regulated. Still worth spreading across 3+ companies.",suggestedCheck:"Aim for no single fund house to hold more than 35% of your money.",severity:"warning"});
  const xpct=(xirrValue??0)*100;
  if(xirrValue!==null&&xpct<8&&eq>=0.4) add({title:"Your returns are below what they should be",signal:"Watch-worthy",observation:`Your money is growing at ${xpct.toFixed(1)}% per year.`,meaning:"With so much in equity, a simple index fund would have done better.",reassurance:"Returns can look low in a market downturn. Check the 3-5 year picture.",suggestedCheck:"Page 4 shows which funds are dragging your returns.",severity:"warning"});
  else if(xirrValue!==null&&xpct>=13) add({title:"Excellent — your money is growing really well",signal:"Strong",observation:`Your money grows at ${xpct.toFixed(1)}% per year — beating most investors.`,meaning:"You are earning significantly more than FDs (7%) and the inflation rate (6%).",reassurance:"Your discipline and choice of funds is working. Keep going.",suggestedCheck:"Review once a year. Don't let short-term news disturb your plan.",severity:"positive"});
  if(eq>0.9) add({title:"Very aggressive — high growth, high risk",signal:"Aggressive",observation:`${fmtShr(eq)} of your money is in equity / stock market funds.`,meaning:"This is great for long-term growth, but your portfolio can fall 30-40% in a bad year.",reassurance:"Absolutely right if your goal is 7+ years away and you can stomach volatility.",suggestedCheck:"Keep 6 months of expenses in savings/liquid funds as a safety buffer.",severity:"info"});
  if(!insights.length) add({title:"Your portfolio is well-structured",signal:"Normal",observation:"No major concentration or performance issues found.",meaning:"Good spread of funds, no single big risk, returns are decent.",reassurance:"Keep your SIPs running and review once a year.",suggestedCheck:"You are on track. Small annual tweaks are fine — avoid over-trading.",severity:"positive"});
  const fundDetails=sorted.map(f=>{const m2=meta.get(f.schemeCode);const cf=buildCashflows(f.allTransactions.map(t=>({amount:Math.abs(t.amount),date:new Date(t.date),type:t.type==="Investment"?"buy" as const:"sell" as const})),f.currentValue,new Date(),f.currentValue>0);const fls=Array.from(new Set(f.allTransactions.map(t=>t.folio?.split("/")[0].trim()).filter(Boolean) as string[]));const flags=fls.map(ff=>nomMap[ff]).filter(ff=>ff!==undefined);let ns: "yes"|"no"|"partial"|"unknown"="unknown";if(flags.length){const y=flags.some(ff=>ff===true),n=flags.some(ff=>ff===false);ns=y&&n?"partial":y?"yes":"no";if(flags.length<fls.length)ns="partial";}return{name:f.mfName,invested:f.currentInvested,currentValue:f.currentValue,profit:f.profit,units:f.currentUnits||0,nav:f.latestPrice||0,xirr:xirr(cf),nomineeStatus:ns,amc:amcOf(m2,f.mfName),schemeCategory:m2?.schemeCategory||"Uncategorized",majorCategory:catOf(m2?.schemeCategory)};});
  return{holdingsCount,topOneShare,topFiveShare,topAmcShare,insights,insightSummary:insights.some(i=>i.severity==="warning")?"Some funds need attention — see your action plan.":"Portfolio is on track. Keep investing regularly.",schemeBreakdown:schemeRoot,amcBreakdown,topHoldings:sorted.slice(0,5).map(f=>({name:f.mfName,value:f.currentValue})),fundDetails};
};

export const formatCurrencyPlain = fmtCur;
export const tooltips = {totalValue:"Current market value of all funds.",invested:"Net amount invested.",allTimeReturns:"Total gains (unrealised + realised).",xirr:"True annualised return.",monthlyIncome:"Estimated monthly income using 25x rule.",holdings:"Funds with value > 0.",topFund:"Largest single position.",topFive:"Top 5 combined."};

// ─────────────────────────────────────────────────────────────────────────────
// PDF ENGINE  — Canvas → JPEG (fast!)
//
// KEY DECISIONS:
//   S = 2       → 1190×1684px canvas = sharp but NOT huge
//   JPEG 0.93   → ~120KB per page = 720KB total = instant download
//   No PNG      → PNG at this size would be 3-4MB per page = browser hangs
//   System font → no load delay, guaranteed available
// ─────────────────────────────────────────────────────────────────────────────

const S   = 2;
const PW  = 595 * S;    // 1190px
const PH  = 842 * S;    // 1684px
const ML  = 40  * S;
const MR  = 40  * S;
const CW  = PW - ML - MR;
const FF  = "system-ui,'Segoe UI','Helvetica Neue',Arial,sans-serif";

// ── Colour palette — high contrast everywhere ─────────────────────────────────
// Cover: dark background (#0D1B2A) with light text
// Body pages: white background (#FFFFFF) with dark text
// All text/background combos meet WCAG AA contrast

const COVER_BG   = "#0D1B2A";   // very dark navy
const COVER_BG2  = "#132338";   // slightly lighter navy

const GREEN      = "#10B981";   // emerald
const GREEN_DK   = "#059669";
const GREEN_DKK  = "#065F46";
const GREEN_LT   = "#D1FAE5";
const GREEN_BD   = "#6EE7B7";

const AMBER      = "#F59E0B";
const AMBER_LT   = "#FEF3C7";
const AMBER_BD   = "#FCD34D";
const AMBER_DK   = "#92400E";

const RED        = "#EF4444";
const RED_DK     = "#991B1B";
const RED_LT     = "#FEF2F2";
const RED_BD     = "#FCA5A5";

const BLUE       = "#3B82F6";
const BLUE_LT    = "#EFF6FF";
const BLUE_DK    = "#1E40AF";

const INK        = "#111827";   // near-black — readable on white
const INK2       = "#374151";
const INK3       = "#6B7280";
const INK4       = "#9CA3AF";
const WHITE      = "#FFFFFF";
const SURF       = "#F9FAFB";
const SURF2      = "#F3F4F6";
const BDR        = "#E5E7EB";
const BDR2       = "#D1D5DB";

// Cover text colours — on dark background
const CV_TXT     = "#F9FAFB";   // almost white
const CV_SUB     = "#9CA3AF";   // grey
const CV_DIM     = "#6B7280";   // dimmer grey

const PALETTE = [BLUE, GREEN, AMBER, "#8B5CF6", RED, "#06B6D4", "#EC4899", "#14B8A6"];

type Ctx = CanvasRenderingContext2D;

// ── Primitives ────────────────────────────────────────────────────────────────

function rrPath(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const R=Math.min(r,w/2,h/2);
  ctx.beginPath();
  ctx.moveTo(x+R,y); ctx.lineTo(x+w-R,y); ctx.arcTo(x+w,y,x+w,y+R,R);
  ctx.lineTo(x+w,y+h-R); ctx.arcTo(x+w,y+h,x+w-R,y+h,R);
  ctx.lineTo(x+R,y+h); ctx.arcTo(x,y+h,x,y+h-R,R);
  ctx.lineTo(x,y+R); ctx.arcTo(x,y,x+R,y,R);
  ctx.closePath();
}
const fillR  = (ctx: Ctx, x: number, y: number, w: number, h: number, r: number, c: string) => { rrPath(ctx,x,y,w,h,r); ctx.fillStyle=c; ctx.fill(); };
const strokeR= (ctx: Ctx, x: number, y: number, w: number, h: number, r: number, c: string, lw=0.5) => { rrPath(ctx,x,y,w,h,r); ctx.strokeStyle=c; ctx.lineWidth=lw*S; ctx.stroke(); };

// Set font. Returns approx line height.
const F = (ctx: Ctx, pt: number, bold=false, italic=false) => {
  ctx.font=`${italic?"italic ":""}${bold?700:400} ${pt*S}px ${FF}`;
};

// Truncate text to maxPx. Font must be set.
const clip = (ctx: Ctx, t: string, maxPx: number): string => {
  if (!t) return "";
  if (ctx.measureText(t).width<=maxPx) return t;
  let lo=0,hi=t.length;
  while(lo<hi-1){const mid=(lo+hi)>>1;ctx.measureText(t.slice(0,mid)+"…").width<=maxPx?(lo=mid):(hi=mid);}
  return t.slice(0,lo)+"…";
};

// Word-wrap. Font must be set.
const wrap = (ctx: Ctx, t: string, maxPx: number, maxL=99): string[] => {
  const words=String(t||"").split(/\s+/);
  const lines: string[]=[];
  let cur="";
  for (const w of words) {
    const test=cur?cur+" "+w:w;
    if (ctx.measureText(test).width>maxPx&&cur){lines.push(cur);cur=w;if(lines.length>=maxL-1)break;}
    else cur=test;
  }
  if (cur) lines.length>=maxL?(lines[lines.length-1]=clip(ctx,lines[lines.length-1]+" "+cur,maxPx)):lines.push(cur);
  return lines.slice(0,maxL);
};

// Jargon replacement — applied to ALL text coming from backend
const plain = (t: string): string => t
  .replace(/Market hurdle \(Nifty 50 TRI 10Y\)/gi, "Stock market 10-year avg return")
  .replace(/Nifty 50 TRI 10Y/gi, "Stock market benchmark (10yr)")
  .replace(/Nifty 50 TRI/gi, "Nifty 50")
  .replace(/\bTRI\b/g, "")
  .replace(/\bXIRR\b/g, "Annual Return")
  .replace(/\bxirr\b/g, "annual return")
  .replace(/Active winners/gi, "Funds beating the market")
  .replace(/Consistency check/gi, "Funds above category average")
  .replace(/Low-ranked funds/gi, "Underperforming funds")
  .replace(/Style tilt \(mid\/small\)/gi, "Mid & Small-Cap exposure")
  .replace(/Risk profile/gi, "Risk score (1=safe, 10=aggressive)")
  .replace(/Long-term index reference/gi, "The bar your funds must beat")
  .replace(/Active money beating benchmark/gi, "Funds earning above index (by value)")
  .replace(/Funds above category average/gi, "Funds ranking above average in their group")
  .replace(/Bottom 25% of peers/gi, "In the bottom 25% of similar funds")
  .replace(/Higher swings if >50%/gi, "Above 50% means bigger price swings")
  .replace(/1 low risk • 10 high risk/gi, "Reflects equity & small-cap exposure")
  .replace(/\bbenchmark\b/gi, "market index")
  .replace(/\balpha offenders?\b/gi, "underperforming funds")
  .replace(/bottom.?quartile/gi, "bottom 25% performers")
  .replace(/\bdrag\b/gi, "reduction in your returns")
  .replace(/\btracking drift\b/gi, "index tracking gap")
  .replace(/\btrailing\b/gi, "below")
  .replace(/lock-in periods/gi, "lock-in restrictions")
  .replace(/exit loads/gi, "exit charges")
  .replace(/\s{2,}/g, " ")
  .trim();

// ── Page chrome ───────────────────────────────────────────────────────────────
const HDR  = 54 * S;
const FTR  = 30 * S;
const TOP  = HDR + 16*S;
const BTM  = PH - FTR - 8*S;

const chrome = (ctx: Ctx, pg: number, logo: HTMLImageElement|null) => {
  // White header with green bottom accent
  ctx.fillStyle = WHITE; ctx.fillRect(0,0,PW,HDR);
  ctx.fillStyle = BDR; ctx.fillRect(0,HDR-1*S,PW,1*S);
  ctx.fillStyle = GREEN; ctx.fillRect(0,HDR-3*S,PW,3*S);

  let bx = ML;
  if (logo&&logo.naturalWidth>0) {
    const lh=32*S, lw=Math.round((logo.naturalWidth/logo.naturalHeight)*lh);
    ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality="high";
    ctx.drawImage(logo,ML,(HDR-lh)/2,lw,lh);
    bx=ML+lw+10*S;
  }
  F(ctx,10,true); ctx.fillStyle=INK; ctx.fillText("Nivesify",bx,HDR*0.47);
  F(ctx,7.5); ctx.fillStyle=INK3; ctx.fillText("Thoughtful Money, Better Life",bx,HDR*0.76);

  F(ctx,9,true); ctx.fillStyle=INK;
  const tt="Mutual Fund Health Check";
  ctx.fillText(tt,PW-MR-ctx.measureText(tt).width,HDR*0.44);
  F(ctx,7.5); ctx.fillStyle=INK3;
  const ds=`Page ${pg}  ·  ${new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}`;
  ctx.fillText(ds,PW-MR-ctx.measureText(ds).width,HDR*0.74);

  // Footer
  const fy=PH-FTR;
  ctx.fillStyle=SURF; ctx.fillRect(0,fy,PW,FTR);
  ctx.fillStyle=BDR; ctx.fillRect(0,fy,PW,1*S);
  F(ctx,6.5); ctx.fillStyle=INK4;
  const disc="Past performance is not a guarantee of future results. Consult a SEBI-registered investment advisor before acting on this report.";
  const dl=wrap(ctx,disc,CW-50*S,2);
  dl.forEach((l,i)=>ctx.fillText(l,ML,fy+10*S+i*9*S));
  F(ctx,7.5,true); ctx.fillStyle=WHITE;
  const pg2=String(pg);
  const cw2=ctx.measureText(pg2).width+12*S;
  fillR(ctx,PW-MR-cw2,fy+5*S,cw2,16*S,4*S,GREEN);
  ctx.fillText(pg2,PW-MR-cw2/2-ctx.measureText(pg2).width/2,fy+14.5*S);
};

// ── Section heading — pill ABOVE title, clear gap, ZERO overlap ──────────────
// Returns Y ready for content (after underline + padding)
const H = (ctx: Ctx, tag: string, title: string, y: number, accent=GREEN): number => {
  // 1. Small pill
  F(ctx,7,true); ctx.fillStyle=WHITE;
  const tw=ctx.measureText(tag.toUpperCase()).width;
  fillR(ctx,ML,y,tw+14*S,15*S,4*S,accent);
  ctx.fillText(tag.toUpperCase(),ML+7*S,y+10.5*S);
  // 2. Title — starts 14pt BELOW pill bottom (no overlap possible)
  const ty=y+15*S+14*S;
  F(ctx,19,true); ctx.fillStyle=INK;
  ctx.fillText(title,ML,ty);
  // 3. Underline — 4pt below title baseline
  const uly=ty+5*S;
  const g=ctx.createLinearGradient(ML,0,ML+60*S,0);
  g.addColorStop(0,accent); g.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle=g; ctx.fillRect(ML,uly,60*S,2.5*S);
  return uly+14*S;
};

// ── Light metric card ─────────────────────────────────────────────────────────
// White card, top accent bar, label/value/sub with clear contrast
const MC = (ctx: Ctx, x: number, y: number, w: number, h: number, label: string, value: string, sub: string, accent: string) => {
  // Card shadow
  ctx.shadowColor="rgba(0,0,0,0.07)"; ctx.shadowBlur=6*S; ctx.shadowOffsetY=2*S;
  fillR(ctx,x,y,w,h,6*S,WHITE);
  ctx.shadowColor="transparent"; ctx.shadowBlur=0; ctx.shadowOffsetY=0;
  strokeR(ctx,x,y,w,h,6*S,BDR,0.4);
  // Top accent bar
  fillR(ctx,x,y,w,4*S,6*S,accent);
  ctx.fillStyle=accent; ctx.fillRect(x,y+2*S,w,2*S);
  // Label — dark grey, small
  F(ctx,7.5); ctx.fillStyle=INK3;
  ctx.fillText(clip(ctx,label,w-16*S),x+10*S,y+17*S);
  // Value — near black, large, bold
  F(ctx,14,true); ctx.fillStyle=INK;
  ctx.fillText(clip(ctx,value,w-14*S),x+10*S,y+36*S);
  // Sub — lighter grey
  if(sub){F(ctx,7); ctx.fillStyle=INK4; ctx.fillText(clip(ctx,sub,w-14*S),x+10*S,y+50*S);}
};

// ── Table ─────────────────────────────────────────────────────────────────────
type TC = { h: string; w: number; align?: "L"|"R"|"C"; col?: (v:string)=>string|null };

const TBL = (ctx: Ctx, cols: TC[], rows: string[][], y0: number, maxL=2): number => {
  const PX=8*S, PY=6*S, LH=11*S, RMIN=23*S, HH=21*S;
  const sc=CW/cols.reduce((s,c)=>s+c.w,0);
  const ws=cols.map(c=>c.w*sc);
  const cx=(i: number)=>ML+ws.slice(0,i).reduce((s,w)=>s+w,0);
  let Y=y0;
  // Header
  fillR(ctx,ML,Y,CW,HH,0,INK);
  cols.forEach((col,i)=>{
    F(ctx,7.5,true); ctx.fillStyle=INK4;
    const hd=clip(ctx,col.h,ws[i]-PX*2);
    const tw=ctx.measureText(hd).width;
    const tx=col.align==="R"?cx(i)+ws[i]-PX-tw:col.align==="C"?cx(i)+(ws[i]-tw)/2:cx(i)+PX;
    ctx.fillText(hd,tx,Y+HH*0.67);
    if(i<cols.length-1){ctx.strokeStyle="#374151";ctx.lineWidth=0.4*S;ctx.beginPath();ctx.moveTo(cx(i)+ws[i],Y+3*S);ctx.lineTo(cx(i)+ws[i],Y+HH-3*S);ctx.stroke();}
  });
  Y+=HH;
  rows.forEach((row,ri)=>{
    const cells=cols.map((col,ci)=>{F(ctx,8.5);return{lines:wrap(ctx,String(row[ci]??"—"),ws[ci]-PX*2,maxL),raw:String(row[ci]??""),col};});
    const rowH=Math.max(RMIN,Math.max(...cells.map(c=>c.lines.length))*LH+PY*2);
    ctx.fillStyle=ri%2===0?WHITE:SURF; ctx.fillRect(ML,Y,CW,rowH);
    cells.forEach(({lines,raw,col},ci)=>{
      const aw=ws[ci]-PX*2, tH=lines.length*LH, vO=(rowH-tH)/2;
      lines.forEach((line,li)=>{
        const ty=Y+vO+(li+1)*LH-2*S;
        let color=INK;
        if(col.col){const c2=col.col(raw);if(c2)color=c2;}
        else if(raw.startsWith("+"))color=GREEN_DK;
        else if(raw.startsWith("-"))color=RED_DK;
        F(ctx,8.5); ctx.fillStyle=color;
        const cl=clip(ctx,line,aw), tw=ctx.measureText(cl).width;
        const tx=col.align==="R"?cx(ci)+ws[ci]-PX-tw:col.align==="C"?cx(ci)+(ws[ci]-tw)/2:cx(ci)+PX;
        ctx.fillText(cl,tx,ty);
      });
      if(ci<cols.length-1){ctx.strokeStyle=BDR;ctx.lineWidth=0.3*S;ctx.beginPath();ctx.moveTo(cx(ci)+ws[ci],Y);ctx.lineTo(cx(ci)+ws[ci],Y+rowH);ctx.stroke();}
    });
    ctx.strokeStyle=BDR;ctx.lineWidth=0.25*S;ctx.beginPath();ctx.moveTo(ML,Y+rowH);ctx.lineTo(ML+CW,Y+rowH);ctx.stroke();
    Y+=rowH;
  });
  return Y+6*S;
};

// ── Stacked bar chart ─────────────────────────────────────────────────────────
const BAR = (ctx: Ctx, items: {label:string;value:number;color:string}[], total: number, y: number): number => {
  const BH=14*S;
  fillR(ctx,ML,y,CW,BH,3*S,SURF2);
  let bx=ML;
  items.forEach((it,i)=>{
    const bw=total>0?(it.value/total)*CW:0; if(bw<1) return;
    ctx.fillStyle=it.color;
    if(i===0){rrPath(ctx,bx,y,bw,BH,3*S);ctx.fill();}
    else if(i===items.length-1){ctx.fillRect(bx,y,bw-3*S,BH);rrPath(ctx,bx+bw-3*S,y,3*S,BH,3*S);ctx.fill();}
    else ctx.fillRect(bx,y,bw,BH);
    bx+=bw;
  });
  strokeR(ctx,ML,y,CW,BH,3*S,BDR2,0.4);
  y+=BH+7*S;
  let lx=ML;
  items.forEach(it=>{
    const pct=total>0?(it.value/total)*100:0; if(pct<0.5) return;
    F(ctx,7.5); ctx.fillStyle=INK2;
    const lbl=`${it.label.slice(0,20)}  ${pct.toFixed(1)}%`;
    const lw=ctx.measureText(lbl).width+16*S;
    if(lx+lw>ML+CW-4*S){y+=12*S;lx=ML;}
    fillR(ctx,lx,y-6*S,8*S,8*S,2*S,it.color);
    ctx.fillText(lbl,lx+12*S,y+1*S);
    lx+=lw+7*S;
  });
  return y+13*S;
};

// ── Action card ───────────────────────────────────────────────────────────────
type CType = "urgent"|"review"|"info"|"good";
const CARD = (ctx: Ctx, c2: PdfInsightCard, idx: number, type: CType, y: number): number => {
  const P={
    urgent:{bg:RED_LT,  brd:RED_BD,  acc:RED_DK,   tagBg:RED,  tag:"⚠  ACT NOW"},
    review:{bg:AMBER_LT,brd:AMBER_BD, acc:AMBER_DK,  tagBg:AMBER,tag:"●  REVIEW"},
    info:  {bg:BLUE_LT, brd:"#93C5FD",acc:BLUE_DK,  tagBg:BLUE, tag:"ℹ  GOOD TO KNOW"},
    good:  {bg:GREEN_LT,brd:GREEN_BD, acc:GREEN_DKK, tagBg:GREEN,tag:"✓  ALL GOOD"},
  }[type];

  const title2=plain(c2.title), sum2=plain(c2.summary), det2=plain(c2.detail);
  F(ctx,10.5,true); const tL=wrap(ctx,title2,CW-42*S,2);
  F(ctx,9);         const sL=wrap(ctx,sum2,CW-42*S,4);
  F(ctx,8.5);       const dL=wrap(ctx,"What to do: "+det2,CW-42*S,3);
  const CH=(20+tL.length*13.5+sL.length*12.5+dL.length*11.5+28)*S;

  ctx.shadowColor="rgba(0,0,0,0.06)"; ctx.shadowBlur=6*S; ctx.shadowOffsetY=2*S;
  fillR(ctx,ML,y,CW,CH,8*S,P.bg);
  ctx.shadowColor="transparent"; ctx.shadowBlur=0; ctx.shadowOffsetY=0;
  rrPath(ctx,ML,y,CW,CH,8*S); ctx.strokeStyle=P.brd; ctx.lineWidth=1*S; ctx.stroke();
  fillR(ctx,ML,y,5*S,CH,5*S,P.tagBg);
  ctx.fillStyle=P.tagBg; ctx.fillRect(ML+3*S,y,2*S,CH);

  let iy=y+15*S;
  F(ctx,8.5,true); ctx.fillStyle=P.acc; ctx.fillText(`${idx+1}`,ML+11*S,iy);
  F(ctx,7,true); ctx.fillStyle=WHITE;
  const tgW=ctx.measureText(P.tag).width+12*S;
  fillR(ctx,ML+24*S,y+5*S,tgW,14*S,3*S,P.tagBg);
  ctx.fillText(P.tag,ML+30*S,y+14.5*S);
  iy+=15*S;
  tL.forEach(l=>{F(ctx,10.5,true);ctx.fillStyle=INK;ctx.fillText(l,ML+11*S,iy);iy+=13.5*S;});
  iy+=3*S;
  sL.forEach(l=>{F(ctx,9);ctx.fillStyle=INK2;ctx.fillText(l,ML+11*S,iy);iy+=12.5*S;});
  iy+=5*S;
  dL.forEach(l=>{ctx.font=`italic ${8.5*S}px ${FF}`;ctx.fillStyle=P.acc;ctx.fillText(l,ML+11*S,iy);iy+=11.5*S;});
  return y+CH+9*S;
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

  let logo: HTMLImageElement|null = null;
  try {
    logo = await new Promise<HTMLImageElement>((res,rej)=>{
      const img=new Image(); img.crossOrigin="anonymous";
      img.onload=()=>res(img); img.onerror=rej; img.src=logoUrl;
    });
  } catch { /* skip */ }

  const mk = (): [HTMLCanvasElement, Ctx] => {
    const c=document.createElement("canvas");
    c.width=PW; c.height=PH;
    const ctx=c.getContext("2d",{alpha:false})!;
    ctx.fillStyle=WHITE; ctx.fillRect(0,0,PW,PH);
    ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality="high";
    return [c,ctx];
  };

  const pages: HTMLCanvasElement[]=[];
  const xpct=(xirrValue??0)*100;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PAGE 1 — COVER
  // Dark background. Three KPI stat boxes. Health score with explained breakdown.
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    const [c,ctx]=mk(); pages.push(c);

    // ── Background ──
    const bg=ctx.createLinearGradient(0,0,PW,PH);
    bg.addColorStop(0,COVER_BG); bg.addColorStop(0.6,COVER_BG2); bg.addColorStop(1,"#0A1628");
    ctx.fillStyle=bg; ctx.fillRect(0,0,PW,PH);

    // Subtle decorative glows
    const g1=ctx.createRadialGradient(PW,0,0,PW,0,350*S);
    g1.addColorStop(0,"rgba(16,185,129,0.15)"); g1.addColorStop(1,"rgba(16,185,129,0)");
    ctx.fillStyle=g1; ctx.fillRect(0,0,PW,PH);
    const g2=ctx.createRadialGradient(0,PH,0,0,PH,280*S);
    g2.addColorStop(0,"rgba(59,130,246,0.12)"); g2.addColorStop(1,"rgba(59,130,246,0)");
    ctx.fillStyle=g2; ctx.fillRect(0,0,PW,PH);

    // Green left rail
    const rl=ctx.createLinearGradient(0,0,0,PH);
    rl.addColorStop(0,GREEN); rl.addColorStop(1,GREEN_DKK);
    ctx.fillStyle=rl; ctx.fillRect(0,0,5*S,PH);
    ctx.fillStyle=GREEN_DKK; ctx.fillRect(5*S,0,1*S,PH);

    // ── Logo (top-left) ──
    let bx=ML+8*S;
    if(logo&&logo.naturalWidth>0){
      const lh=38*S, lw=Math.round((logo.naturalWidth/logo.naturalHeight)*lh);
      ctx.drawImage(logo,ML+8*S,44*S,lw,lh); bx=ML+8*S+lw+12*S;
    }
    F(ctx,13,true); ctx.fillStyle=CV_TXT; ctx.fillText("Nivesify",bx,62*S);
    F(ctx,8); ctx.fillStyle=CV_SUB; ctx.fillText("Thoughtful Money, Better Life",bx,77*S);

    // ── Report label ──
    F(ctx,8,true); ctx.fillStyle=GREEN;
    ctx.fillText("MUTUAL FUND HEALTH CHECK  ·  PERSONAL PORTFOLIO REPORT",ML+8*S,128*S);

    // ── Hero headline ──
    const isGood=xpct>=10;
    F(ctx,32,true); ctx.fillStyle=CV_TXT;
    ctx.fillText("Your Portfolio",ML+8*S,172*S);
    ctx.fillStyle=isGood?GREEN:AMBER;
    ctx.fillText(isGood?"is on Track!":"Needs Attention",ML+8*S,210*S);

    const ulg=ctx.createLinearGradient(ML+8*S,0,ML+8*S+150*S,0);
    ulg.addColorStop(0,isGood?GREEN:AMBER); ulg.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=ulg; ctx.fillRect(ML+8*S,218*S,150*S,2.5*S);
    F(ctx,9); ctx.fillStyle=CV_SUB;
    ctx.fillText("Plain English  ·  No Jargon  ·  Clear Actions",ML+8*S,232*S);

    // ── Investor info box ──
    const HX=ML+8*S, HY=246*S, HW=CW-8*S, HH=66*S;
    fillR(ctx,HX,HY,HW,HH,7*S,"rgba(19,35,56,0.9)");
    rrPath(ctx,HX,HY,HW,HH,7*S); ctx.strokeStyle="rgba(16,185,129,0.35)"; ctx.lineWidth=1*S; ctx.stroke();
    fillR(ctx,HX,HY,4*S,HH,4*S,GREEN);
    ctx.fillStyle=GREEN_DKK; ctx.fillRect(HX+3*S,HY,1*S,HH);
    F(ctx,7,true); ctx.fillStyle=CV_DIM; ctx.fillText("REPORT PREPARED FOR",HX+13*S,HY+15*S);
    const dName=holder.name&&!holder.name.includes("@")?holder.name:(holder.email||"Investor");
    F(ctx,13,true); ctx.fillStyle=CV_TXT; ctx.fillText(clip(ctx,dName,HW-120*S),HX+13*S,HY+31*S);
    F(ctx,7.5); ctx.fillStyle=CV_DIM;
    if(holder.pan) ctx.fillText(`PAN: ${holder.pan}`,HX+13*S,HY+46*S);
    if(holder.email) ctx.fillText(clip(ctx,holder.email,HW/2-20*S),holder.pan?HX+HW*0.42:HX+13*S,HY+46*S);
    ctx.fillText(`Generated: ${new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"})}`,HX+13*S,HY+58*S);

    // ── 3 Hero KPI boxes ──
    // These sit side by side. Each box: label (top), big value (middle), sub (bottom).
    // All text drawn with FIXED pt positions relative to box top — no overlap possible.
    const KY=HY+HH+14*S, KH=76*S, KW=(HW-14*S)/3;
    const xirrCol=xpct>=12?GREEN:xpct>=8?AMBER:RED;
    const profCol=(summary.allTimeProfit||0)>=0?GREEN:RED;

    const kpiBox=(kx: number, bg2: string, brd: string, lbl: string, val: string, s1: string, s2: string, vc: string)=>{
      fillR(ctx,kx,KY,KW,KH,7*S,bg2);
      rrPath(ctx,kx,KY,KW,KH,7*S); ctx.strokeStyle=brd; ctx.lineWidth=0.5*S; ctx.stroke();
      // Label at y+14
      F(ctx,7.5); ctx.fillStyle=vc+"99";
      ctx.fillText(clip(ctx,lbl,KW-20*S),kx+12*S,KY+14*S);
      // Value at y+36 (22pt gap from label baseline to value baseline)
      F(ctx,17,true); ctx.fillStyle=vc;
      ctx.fillText(clip(ctx,val,KW-20*S),kx+12*S,KY+37*S);
      // Sub1 at y+51
      F(ctx,7); ctx.fillStyle=vc+"77";
      ctx.fillText(clip(ctx,s1,KW-20*S),kx+12*S,KY+51*S);
      // Sub2 at y+63
      F(ctx,7); ctx.fillStyle=vc+"55";
      ctx.fillText(clip(ctx,s2,KW-20*S),kx+12*S,KY+63*S);
    };

    kpiBox(HX,"rgba(16,185,129,0.12)","rgba(16,185,129,0.3)","Total Portfolio Value",fmtCur(summary.totalValue),"Current market value of all funds",`You invested: ${fmtCur(summary.invested)}`,GREEN);
    kpiBox(HX+KW+7*S,`rgba(${xpct>=10?"16,185,129":"245,158,11"},0.12)`,`rgba(${xpct>=10?"16,185,129":"245,158,11"},0.3)`,"Your Annual Return",fmtPct(xirrValue,2),`Market benchmark: ~14-15% per year`,xpct>=12?"Above average — great job!":xpct>=8?"Close to market — acceptable":"Below market — needs attention",xirrCol);
    kpiBox(HX+KW*2+14*S,`rgba(${(summary.allTimeProfit||0)>=0?"16,185,129":"239,68,68"},0.12)`,`rgba(${(summary.allTimeProfit||0)>=0?"16,185,129":"239,68,68"},0.3)`,"Total Profit Earned",fmtCur(summary.allTimeProfit),`On investment of ${fmtCur(summary.invested)}`,`${fmtShr(summary.totalValue&&summary.invested?summary.allTimeProfit/summary.invested:0)} absolute gain across all funds`,profCol);

    // ── Health Score block ──
    // Layout: [Big score number + label | divider | 3 component bars with explanation]
    const HSY=KY+KH+14*S, HSH=100*S, HSW=HW;
    fillR(ctx,HX,HSY,HSW,HSH,7*S,"rgba(19,35,56,0.85)");
    rrPath(ctx,HX,HSY,HSW,HSH,7*S); ctx.strokeStyle="rgba(255,255,255,0.06)"; ctx.lineWidth=0.5*S; ctx.stroke();

    // Score components
    const sc1=xpct>=15?40:xpct>=12?35:xpct>=9?27:xpct>=6?18:10; // returns 40pt
    const sc2=report.holdingsCount>=3&&report.holdingsCount<=7?30:report.holdingsCount<=10?22:14; // diversification 30pt
    const sc3=report.topOneShare<0.25&&report.topFiveShare<0.65&&report.topAmcShare<0.4?30:report.topOneShare<0.35?22:14; // concentration 30pt
    const total=sc1+sc2+sc3;
    const sLbl=total>=80?"Excellent":total>=65?"Healthy":total>=50?"Fair":"Needs Work";
    const sCol=total>=65?GREEN:total>=50?AMBER:RED;

    // Big score on left side
    const SLX=HX+18*S;
    F(ctx,7,true); ctx.fillStyle=CV_DIM; ctx.fillText("YOUR PORTFOLIO HEALTH SCORE",SLX,HSY+16*S);
    F(ctx,40,true); ctx.fillStyle=sCol; ctx.fillText(String(total),SLX,HSY+62*S);
    F(ctx,8); ctx.fillStyle=CV_SUB; ctx.fillText(`out of 100  ·  ${sLbl}`,SLX,HSY+78*S);
    F(ctx,7); ctx.fillStyle=CV_DIM; ctx.fillText("(see breakdown →)",SLX,HSY+90*S);

    // Divider
    ctx.strokeStyle="rgba(255,255,255,0.08)"; ctx.lineWidth=1*S;
    const divX=HX+110*S;
    ctx.beginPath(); ctx.moveTo(divX,HSY+12*S); ctx.lineTo(divX,HSY+HSH-12*S); ctx.stroke();

    // Score breakdown bars on right side — THIS EXPLAINS THE SCORE
    const BDX=divX+12*S, BDW=HSW-(divX-HX)-20*S;
    F(ctx,7,true); ctx.fillStyle=CV_DIM; ctx.fillText("HOW THE SCORE IS CALCULATED",BDX,HSY+16*S);

    const scoreRow=(lbl: string, pts: number, max: number, col: string, y2: number)=>{
      F(ctx,7.5); ctx.fillStyle=CV_SUB; ctx.fillText(lbl,BDX,y2+8*S);
      F(ctx,7.5,true); ctx.fillStyle=col;
      const ps=`${pts}/${max}`;
      ctx.fillText(ps,BDX+BDW-ctx.measureText(ps).width,y2+8*S);
      fillR(ctx,BDX,y2+11*S,BDW,5*S,2.5*S,"rgba(255,255,255,0.08)");
      fillR(ctx,BDX,y2+11*S,Math.max((pts/max)*BDW,2*S),5*S,2.5*S,col);
      return y2+22*S;
    };

    let by=HSY+22*S;
    by=scoreRow(`Returns (max 40 pts) — your ${xpct.toFixed(1)}% annual return vs 14-15% market`,sc1,40,sc1>=35?GREEN:sc1>=25?AMBER:RED,by);
    by+=3*S;
    by=scoreRow(`Diversification (max 30 pts) — ${report.holdingsCount} funds (ideal: 4-8)`,sc2,30,sc2>=25?GREEN:sc2>=18?AMBER:RED,by);
    by+=3*S;
    scoreRow(`Concentration (max 30 pts) — largest fund is ${fmtShr(report.topOneShare)}`,sc3,30,sc3>=25?GREEN:sc3>=18?AMBER:RED,by);

    // ── 4 stat chips ──
    const SCY=HSY+HSH+12*S, SW=(HW/4), SH=52*S;
    [{l:"Amount Invested",v:fmtCur(summary.invested),s:"Total put in"},{l:"Number of Funds",v:`${report.holdingsCount} funds`,s:"Currently active"},{l:"Biggest Fund Share",v:fmtShr(report.topOneShare),s:"% in one fund"},{l:"Est. Monthly Income",v:fmtCur(summary.monthlyIncome),s:"25× annual estimate"}].forEach((st,i)=>{
      const SX=HX+i*SW;
      fillR(ctx,SX,SCY,SW-6*S,SH,5*S,"rgba(19,35,56,0.75)");
      rrPath(ctx,SX,SCY,SW-6*S,SH,5*S); ctx.strokeStyle="rgba(255,255,255,0.05)"; ctx.lineWidth=0.4*S; ctx.stroke();
      F(ctx,7.5); ctx.fillStyle=CV_DIM; ctx.fillText(st.l,SX+9*S,SCY+16*S);
      F(ctx,12,true); ctx.fillStyle=CV_TXT; ctx.fillText(clip(ctx,st.v,SW-22*S),SX+9*S,SCY+36*S);
      F(ctx,7); ctx.fillStyle=CV_DIM; ctx.fillText(st.s,SX+9*S,SCY+48*S);
    });

    // Cover footer
    const CFY=PH-34*S;
    ctx.strokeStyle="rgba(19,35,56,0.9)"; ctx.lineWidth=0.4*S;
    ctx.beginPath(); ctx.moveTo(HX,CFY); ctx.lineTo(HX+HW,CFY); ctx.stroke();
    F(ctx,6.5); ctx.fillStyle="rgba(107,114,128,0.65)";
    const dl2=wrap(ctx,"Past performance is not a guarantee of future results. Consult a SEBI-registered investment advisor before acting on any information in this report. Nivesify does not provide SEBI-registered investment advice.",HW,2);
    dl2.forEach((l,i)=>ctx.fillText(l,HX,CFY+11*S+i*9*S));
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PAGE 2 — YOUR MONEY AT A GLANCE  (white background, high contrast)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    const [c,ctx]=mk(); pages.push(c);
    chrome(ctx,2,logo); let Y=TOP;

    Y=H(ctx,"Your Money","Your Money at a Glance",Y,BLUE);

    const G=7*S, CW4=(CW-G*3)/4, CH=60*S;
    const xirrAcc=xpct>=12?GREEN:xpct>=8?AMBER:RED;

    const r1=[
      {l:"Total Portfolio Value",  v:fmtCur(summary.totalValue),   s:"What all your funds are worth today",  a:BLUE},
      {l:"Total Invested",         v:fmtCur(summary.invested),      s:"Total money put in over time",         a:INK3},
      {l:"Total Profit Earned",    v:fmtCur(summary.allTimeProfit), s:"Your gains so far (all funds)",        a:(summary.allTimeProfit||0)>=0?GREEN_DK:RED_DK},
      {l:"Annual Return (XIRR)",   v:fmtPct(xirrValue,2),           s:"How fast your money is really growing",a:xirrAcc},
    ];
    r1.forEach((m,i)=>MC(ctx,ML+i*(CW4+G),Y,CW4,CH,m.l,m.v,m.s,m.a));
    Y+=CH+7*S;

    const r2=[
      {l:"Number of Funds",        v:`${report.holdingsCount}`,      s:"Active funds",                         a:"#8B5CF6"},
      {l:"Largest Fund (% share)", v:fmtShr(report.topOneShare),     s:"% in your single biggest fund",        a:report.topOneShare>0.3?AMBER:GREEN_DK},
      {l:"Top 5 Funds Combined",   v:fmtShr(report.topFiveShare),    s:"% held in your 5 largest funds",       a:report.topFiveShare>0.65?AMBER:GREEN_DK},
      {l:"Est. Monthly Income",    v:fmtCur(summary.monthlyIncome),  s:"If you withdraw 4% per year (25x rule)", a:"#0891B2"},
    ];
    r2.forEach((m,i)=>MC(ctx,ML+i*(CW4+G),Y,CW4,CH,m.l,m.v,m.s,m.a));
    Y+=CH+14*S;

    // Summary banner
    ctx.strokeStyle=BDR;ctx.lineWidth=0.5*S;ctx.beginPath();ctx.moveTo(ML,Y);ctx.lineTo(ML+CW,Y);ctx.stroke();Y+=12*S;
    const csum=plain(insights.executiveSummary);
    F(ctx,9); const esL=wrap(ctx,csum,CW-28*S,4);
    const ESH=(esL.length*13+30)*S;
    fillR(ctx,ML,Y,CW,ESH,7*S,GREEN_LT);
    rrPath(ctx,ML,Y,CW,ESH,7*S); ctx.strokeStyle=GREEN_BD; ctx.lineWidth=0.5*S; ctx.stroke();
    fillR(ctx,ML,Y,4*S,ESH,4*S,GREEN); ctx.fillStyle=GREEN_DKK; ctx.fillRect(ML+3*S,Y,1*S,ESH);
    F(ctx,7,true); ctx.fillStyle=GREEN_DKK; ctx.fillText("IN SUMMARY",ML+12*S,Y+13*S);
    esL.forEach((l,i)=>{F(ctx,9);ctx.fillStyle=INK2;ctx.fillText(l,ML+12*S,Y+25*S+i*13*S);});
    Y+=ESH+14*S;

    ctx.strokeStyle=BDR;ctx.lineWidth=0.5*S;ctx.beginPath();ctx.moveTo(ML,Y);ctx.lineTo(ML+CW,Y);ctx.stroke();Y+=12*S;
    Y=H(ctx,"How You Compare","How Your Portfolio Compares to the Market",Y,"#8B5CF6");

    // Plain English metric table
    const mRows=(insights.metrics||[]).map(m=>[plain(m.title),m.value,plain(m.note)]);
    Y=TBL(ctx,
      [{h:"What We Checked",w:185},{h:"Your Result",w:88,align:"R"},{h:"What This Means for You",w:250}],
      mRows,Y,2
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PAGE 3 — YOUR ACTION PLAN
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    const [c,ctx]=mk(); pages.push(c);
    chrome(ctx,3,logo); let Y=TOP;

    Y=H(ctx,"Your Action Plan","What Should You Do Right Now?",Y,GREEN);
    F(ctx,8.5); ctx.fillStyle=INK3;
    ctx.fillText("Listed by priority. Start from #1. Written in plain English — no financial jargon.",ML,Y); Y+=15*S;

    insights.insightCards.forEach((ic,i)=>{
      const lt=plain(ic.title).toLowerCase();
      const type: CType=lt.includes("trailing")||lt.includes("below")||lt.includes("bottom")||lt.includes("returns are below")?"urgent":lt.includes("review")||lt.includes("drift")||lt.includes("too many")||lt.includes("needs review")||lt.includes("passive")||lt.includes("too much")||lt.includes("one fund")||lt.includes("one company")?"review":lt.includes("excellent")||lt.includes("well-structured")||lt.includes("on track")?"good":"info";
      if(Y+55*S>BTM) return;
      Y=CARD(ctx,ic,i,type,Y);
    });
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PAGE 4 — FUND REPORT CARD
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    const [c,ctx]=mk(); pages.push(c);
    chrome(ctx,4,logo); let Y=TOP;

    Y=H(ctx,"Fund Report Card","Which Funds to Keep, Which to Review",Y,AMBER);
    F(ctx,8.5); ctx.fillStyle=INK3;
    ctx.fillText(`${insights.activeAuditRows.length} actively managed funds — judged on whether they earn more than the market index after fees.`,ML,Y); Y+=15*S;

    const gapC=(v: string): string|null=>{if(v==="—"||v==="-")return null;const n=parseFloat(v);return isNaN(n)?null:n>=0?GREEN_DK:RED_DK;};
    const vrdC=(v: string): string|null=>{const r=v.toLowerCase();if(r.startsWith("continue"))return GREEN_DK;if(r.startsWith("review"))return AMBER_DK;return null;};
    const cleanA=(a: string)=>plain(a).replace(/!['']?\s*/g,"").replace(/\s+/g," ").trim();

    Y=TBL(ctx,[
      {h:"Fund Name",w:163},
      {h:"Market Index Tracked",w:142},
      {h:"Beats Market By",w:72,align:"R",col:gapC},
      {h:"Verdict & Suggested Alternative",w:146,col:vrdC},
    ],insights.activeAuditRows.map(r=>[r.name,r.benchmark||"—",r.gap||"—",cleanA(r.action)]),Y,3);

    // Legend chip
    const LY=Y;
    fillR(ctx,ML,LY,CW,22*S,3*S,SURF);
    F(ctx,7.5,true); ctx.fillStyle=INK2; ctx.fillText("How to read:",ML+8*S,LY+14.5*S);
    [{c:GREEN_DK,l:"Continue = earning above the market index after all fees"},{c:AMBER_DK,l:"Review = not worth higher fees vs a simple index fund"}].forEach((lg,i)=>{const lx=ML+82*S+i*220*S;fillR(ctx,lx,LY+7*S,9*S,9*S,2*S,lg.c);F(ctx,7.5);ctx.fillStyle=INK2;ctx.fillText(lg.l,lx+13*S,LY+14.5*S);});
    Y+=30*S;

    ctx.strokeStyle=BDR;ctx.lineWidth=0.5*S;ctx.beginPath();ctx.moveTo(ML,Y);ctx.lineTo(ML+CW,Y);ctx.stroke();Y+=12*S;
    Y=H(ctx,"Index Funds","Your Index & ETF Funds",Y,BLUE);
    F(ctx,8.5); ctx.fillStyle=INK3;
    ctx.fillText(`${insights.passiveAuditRows.length} index/ETF funds — these just need to track their index as closely and cheaply as possible.`,ML,Y); Y+=15*S;

    Y=TBL(ctx,[
      {h:"Fund Name",w:175},
      {h:"Tracks This Index",w:133},
      {h:"Return vs Index",w:68,align:"R",col:gapC},
      {h:"How Closely It Tracks",w:70,align:"R"},
      {h:"Verdict",w:77,col:vrdC},
    ],insights.passiveAuditRows.map(r=>[r.name,r.benchmark||"—",r.gap||"—",r.tracking||"—",cleanA(r.action)]),Y,2);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PAGE 5 — WHERE IS YOUR MONEY?
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    const [c,ctx]=mk(); pages.push(c);
    chrome(ctx,5,logo); let Y=TOP;

    Y=H(ctx,"Where Is Your Money","Where Is Your Money Invested?",Y,BLUE);

    const catMap=new Map<string,{cur:number;inv:number}>();
    report.fundDetails.forEach(f=>{const e=catMap.get(f.majorCategory)||{cur:0,inv:0};catMap.set(f.majorCategory,{cur:e.cur+f.currentValue,inv:e.inv+f.invested});});
    const cats=Array.from(catMap.entries()).map(([n,v],i)=>({label:n,value:v.cur,invested:v.inv,color:PALETTE[i%PALETTE.length]})).sort((a,b)=>b.value-a.value);

    F(ctx,10,true); ctx.fillStyle=INK2; ctx.fillText("By Fund Type (Equity, Debt, Hybrid, etc.)",ML,Y); Y+=12*S;
    Y=BAR(ctx,cats,summary.totalValue,Y);
    Y=TBL(ctx,
      [{h:"Fund Type",w:160},{h:"Worth Today",w:110,align:"R"},{h:"You Invested",w:110,align:"R"},{h:"% of Portfolio",w:75,align:"R"},{h:"Profit / Loss",w:68,align:"R"}],
      cats.map(ci=>{const g=ci.value-ci.invested;return[ci.label,fmtCur(ci.value),fmtCur(ci.invested),fmtShr(summary.totalValue?ci.value/summary.totalValue:0),`${g>=0?"+":""}${fmtCur(g)}`];}),
      Y,1
    );

    Y+=8*S;
    F(ctx,10,true); ctx.fillStyle=INK2; ctx.fillText("By Fund House",ML,Y); Y+=12*S;
    Y=BAR(ctx,report.amcBreakdown.slice(0,8).map((a,i)=>({label:a.name,value:a.value,color:PALETTE[i%PALETTE.length]})),summary.totalValue,Y);
    Y=TBL(ctx,
      [{h:"Fund House",w:232},{h:"Worth Today",w:110,align:"R"},{h:"% of Portfolio",w:85,align:"R"},{h:"No. of Funds",w:96,align:"C"}],
      report.amcBreakdown.slice(0,10).map(a=>[a.name,fmtCur(a.value),fmtShr(summary.totalValue?a.value/summary.totalValue:0),`${report.fundDetails.filter(f=>f.amc===a.name).length}`]),
      Y,1
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PAGE 6 — ALL YOUR FUNDS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    const [c,ctx]=mk(); pages.push(c);
    chrome(ctx,6,logo); let Y=TOP;

    Y=H(ctx,"All Your Funds","Complete Fund Performance List",Y,INK3);
    F(ctx,8.5); ctx.fillStyle=INK3;
    ctx.fillText(`${report.holdingsCount} funds  ·  Sorted by value  ·  "Annual Return" shown where 1+ year of history exists`,ML,Y); Y+=15*S;

    const pC=(v: string): string|null=>v.startsWith("+")?GREEN_DK:v.startsWith("-")?RED_DK:null;
    const rC=(v: string): string|null=>{if(v==="N/A")return INK4;const n=parseFloat(v);return isNaN(n)?null:n<0?RED_DK:n>=12?GREEN_DK:INK2;};

    Y=TBL(ctx,[
      {h:"Fund Name",w:168},
      {h:"Type",w:60},
      {h:"You Invested",w:74,align:"R"},
      {h:"Worth Today",w:76,align:"R"},
      {h:"Profit / Loss",w:76,align:"R",col:pC},
      {h:"Annual Return",col:rC,w:69,align:"R"},
    ],report.fundDetails.map(f=>{const g=f.profit;return[f.name,f.majorCategory,fmtCur(f.invested),fmtCur(f.currentValue),`${g>=0?"+":""}${fmtCur(g)}`,fmtPct(f.xirr,2)];}),Y,2);

    if(Y+28*S<BTM){
      ctx.strokeStyle=BDR;ctx.lineWidth=0.5*S;ctx.beginPath();ctx.moveTo(ML,Y);ctx.lineTo(ML+CW,Y);ctx.stroke();Y+=11*S;
      F(ctx,12,true); ctx.fillStyle=INK; ctx.fillText("Your 5 Largest Holdings",ML,Y); Y+=13*S;
      report.topHoldings.forEach((h,i)=>{
        if(Y+28*S>BTM) return;
        const pct=summary.totalValue?h.value/summary.totalValue:0;
        const BH=24*S;
        fillR(ctx,ML,Y,CW,BH,4*S,SURF2);
        const bw=Math.max(pct*CW,55*S);
        fillR(ctx,ML,Y,bw,BH,4*S,PALETTE[i%PALETTE.length]);
        F(ctx,9,true); ctx.fillStyle=pct>0.14?WHITE:INK;
        ctx.fillText(`${i+1}.  ${clip(ctx,h.name,Math.max(bw-14*S,100*S))}`,ML+8*S,Y+BH*0.61);
        const vs=`${fmtCur(h.value)}  (${(pct*100).toFixed(1)}%)`;
        F(ctx,8.5,true); ctx.fillStyle=pct>0.5?WHITE:INK2;
        ctx.fillText(vs,ML+CW-ctx.measureText(vs).width-8*S,Y+BH*0.61);
        Y+=BH+5*S;
      });
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ASSEMBLE — JPEG 0.93 quality = ~120KB per page = fast download
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const doc=new jsPDF({unit:"pt",format:"a4",compress:true});
  pages.forEach((cv,i)=>{
    if(i>0) doc.addPage();
    const img=cv.toDataURL("image/jpeg",0.93);
    doc.addImage(img,"JPEG",0,0,595,842);
  });
  doc.save("nivesify-portfolio-report.pdf");
};
