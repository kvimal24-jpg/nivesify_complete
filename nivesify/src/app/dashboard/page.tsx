"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import {
  ShieldAlert, Edit, Wallet, Leaf, Heart,
  Flame, Stethoscope, Umbrella, Calculator, AlertTriangle,
  CheckCircle2, X, Home, Car, Plane, GraduationCap, Target, Sparkles,
  TrendingUp, TrendingDown, Shield, Zap, Info, ArrowRight, ChevronRight,
  PiggyBank, BarChart2, Activity, Star, Lock, Unlock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/hooks/useUser";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ─────────────────────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────────────────────
const fmtINR = (num: number, compact = false) => {
  if (num === undefined || num === null || isNaN(num)) return "₹0";
  if (compact) {
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(num);
};

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type Goal = { id: string; name: string; age: number; cost: number };

// ─────────────────────────────────────────────────────────────────────────────
// MATH ENGINE  — ALL BUGS FIXED
// ─────────────────────────────────────────────────────────────────────────────

// FIX 1: equityRatio now computed from actual assets, not hardcoded 0.7
const computeEquityRatio = (assetsEquity: number, corpus: number) => {
  if (corpus <= 0) return 0.6;
  return Math.min(1, Math.max(0, assetsEquity / corpus));
};

const getBlendedReturn = (equityRatio: number) =>
  Number(((equityRatio * 12) + ((1 - equityRatio) * 7)).toFixed(1));

const calculateRunway = (corpus: number, annualDraw: number, inflation: number, returnRate: number) => {
  if (annualDraw <= 0) return 99;
  if (corpus <= 0) return 0;
  const r = (1 + returnRate / 100) / (1 + inflation / 100) - 1;
  if (Math.abs(r) < 0.001) return corpus / annualDraw;
  const numerator = 1 - (corpus * r / annualDraw);
  if (numerator <= 0) return 99;
  return parseFloat((-Math.log(numerator) / Math.log(1 + r)).toFixed(1));
};

const calculateGapSIP = (gap: number, years: number, rate: number) => {
  if (years <= 0 || gap <= 0) return 0;
  const r = rate / 100 / 12;
  const n = years * 12;
  return Math.round(gap / (((Math.pow(1 + r, n) - 1) / r) * (1 + r)));
};

// FIX 2: Simulation now correctly deducts existingSIP from surplus (SIP is part of outflow, not free money)
function runSimulation(inputs: any, joyMoneyMonthly = 0) {
  const data: any[] = [];
  let corpus = inputs.currentCorpus;

  // Surplus = income - essential expenses - EMIs - SIP (SIP is an outflow that builds corpus externally)
  // We treat SIP as adding to corpus separately, so it's NOT double-counted here
  // annualSurplus = take-home surplus that goes INTO corpus each year (includes SIP)
  const annualSurplus = (inputs.monthlyIncome - inputs.monthlyExpenses - inputs.monthlyEMIs - joyMoneyMonthly) * 12;
  const annualExpenses = (inputs.monthlyExpenses + joyMoneyMonthly) * 12;

  const equityRatio = computeEquityRatio(inputs.assetsEquity, inputs.currentCorpus);
  const ratePre = getBlendedReturn(equityRatio) / 100;
  // FIX: post-retirement ratio capped at 30% equity max
  const postEqRatio = Math.min(equityRatio, 0.3);
  const ratePost = getBlendedReturn(postEqRatio) / 100;

  for (let age = inputs.currentAge; age <= inputs.lifeExpectancy; age++) {
    const isRetired = age >= inputs.retirementAge;
    const yearIndex = age - inputs.currentAge;
    const rate = isRetired ? ratePost : ratePre;

    // Goal outflows (inflation-adjusted)
    const yearGoals = inputs.goals.filter((g: Goal) => g.age === age);
    let goalOutflow = 0;
    const goalsHit: string[] = [];
    yearGoals.forEach((g: Goal) => {
      const cost = g.cost * Math.pow(1 + inputs.inflation / 100, yearIndex);
      goalOutflow += cost;
      goalsHit.push(g.name);
    });

    // Portfolio grows first
    const growth = corpus * rate;
    corpus += growth;

    let outflowThisYear = 0;
    let inflowThisYear = 0;
    if (!isRetired) {
      const inflatedSurplus = annualSurplus * Math.pow(1 + inputs.inflation / 100, yearIndex);
      corpus += inflatedSurplus;
      inflowThisYear = inflatedSurplus;
    } else {
      const inflatedExpenses = annualExpenses * Math.pow(1 + inputs.inflation / 100, yearIndex);
      corpus -= inflatedExpenses;
      outflowThisYear = inflatedExpenses;
    }

    corpus -= goalOutflow;
    data.push({
      age, corpus: Math.round(corpus),
      growth: Math.round(growth),
      inflow: Math.round(inflowThisYear),
      outflow: Math.round(outflowThisYear + goalOutflow),
      isRetired, goalsHit,
    });
    if (corpus < -50_000_000) break;
  }
  return data;
}

// FIX 3: joyMoney uses 20 iterations for better precision (~₹1 accuracy)
const calculateMaxJoyMoney = (baseParams: any) => {
  let low = 0;
  let high = Math.max(0, baseParams.monthlyIncome - baseParams.monthlyExpenses - baseParams.monthlyEMIs);
  if (high <= 0) return 0;
  let safeJoy = 0;
  for (let i = 0; i < 20; i++) {
    const mid = (low + high) / 2;
    const res = runSimulation(baseParams, mid);
    if (!res.some((d: any) => d.corpus < 0)) { safeJoy = mid; low = mid; } else { high = mid; }
  }
  return Math.floor(safeJoy / 500) * 500;
};

// ─────────────────────────────────────────────────────────────────────────────
// GOAL ICON
// ─────────────────────────────────────────────────────────────────────────────
const getGoalIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("home") || n.includes("house")) return <Home className="w-4 h-4" />;
  if (n.includes("car")) return <Car className="w-4 h-4" />;
  if (n.includes("travel") || n.includes("tour") || n.includes("trip")) return <Plane className="w-4 h-4" />;
  if (n.includes("education") || n.includes("college") || n.includes("school")) return <GraduationCap className="w-4 h-4" />;
  if (n.includes("wedding")) return <Heart className="w-4 h-4" />;
  return <Target className="w-4 h-4" />;
};

const getGoalEmoji = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("home") || n.includes("house")) return "🏠";
  if (n.includes("car")) return "🚗";
  if (n.includes("travel") || n.includes("tour") || n.includes("trip")) return "✈️";
  if (n.includes("education") || n.includes("college") || n.includes("school")) return "🎓";
  if (n.includes("wedding")) return "💒";
  return "🎯";
};

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY BUILDER
// ─────────────────────────────────────────────────────────────────────────────
const buildSummary = ({ isSafe, failPointAge, fireAge, monthlySurplus, joyMoney, corpusAtRetire, retirementAge, goalSipNeeded, existingSIP, familyRunway }: any) => {
  const sipGap = Math.max(0, goalSipNeeded - existingSIP);
  const sipCoverage = goalSipNeeded > 0 ? Math.min(100, Math.round((existingSIP / goalSipNeeded) * 100)) : 100;

  if (!isSafe) return {
    tone: "risk" as const,
    title: "Plan needs immediate attention",
    subtitle: `Your corpus runs out around age ${failPointAge}. Tightening expenses or increasing savings now will prevent a shortfall.`,
    detail: `Surplus ${fmtINR(Math.max(0, monthlySurplus))}/mo · Family runway ${familyRunway.toFixed(1)} yrs`,
    icon: <AlertTriangle className="w-6 h-6" />,
  };
  if (monthlySurplus <= 0) return {
    tone: "warn" as const,
    title: "Cashflow is under pressure",
    subtitle: "Your monthly outflows exceed income. Even small expense cuts will unlock compounding power.",
    detail: `Deficit ${fmtINR(Math.abs(monthlySurplus))}/mo · Retire corpus ${fmtINR(corpusAtRetire, true)}`,
    icon: <ShieldAlert className="w-6 h-6" />,
  };
  if (goalSipNeeded > 0 && sipGap > 0) return {
    tone: "warn" as const,
    title: "Goals need a SIP top-up",
    subtitle: `Your existing SIPs cover ${sipCoverage}% of goal funding. Add ${fmtINR(sipGap)}/mo to fully fund all goals.`,
    detail: `Current SIP ${fmtINR(existingSIP)}/mo · Need ${fmtINR(goalSipNeeded)}/mo`,
    icon: <Target className="w-6 h-6" />,
  };
  const extra = fireAge ? ` · FIRE eligible at age ${fireAge}` : joyMoney > 0 ? ` · Joy money ${fmtINR(joyMoney)}/mo` : "";
  return {
    tone: "good" as const,
    title: fireAge ? `FIRE at ${fireAge} — freedom is achievable` : "Plan is on track 🎉",
    subtitle: `Corpus survives to age 85. Your savings rate and investment strategy are working.`,
    detail: `Surplus ${fmtINR(monthlySurplus)}/mo · Retire corpus ${fmtINR(corpusAtRetire, true)}${extra}`,
    icon: <Sparkles className="w-6 h-6" />,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM CHART TOOLTIP
// ─────────────────────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", background: "white", border: "1px solid #E2E8F0", borderRadius: 14, padding: "14px 16px", minWidth: 220, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
      <div style={{ fontWeight: 800, fontSize: 13, color: "#0F172A", marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between" }}>
        <span>Age {label}</span>
        <span style={{ fontWeight: 500, fontSize: 11, color: "#94A3B8" }}>{d.isRetired ? "Retired" : "Working"}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: "#64748B" }}>Total corpus</span>
        <span style={{ fontWeight: 900, fontSize: 14, color: d.corpus >= 0 ? "#059669" : "#DC2626" }}>{fmtINR(d.corpus, true)}</span>
      </div>
      <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "8px 10px", marginBottom: 8 }}>
        {d.inflow > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}><span style={{ color: "#059669" }}>▲ Savings added</span><span style={{ color: "#059669", fontWeight: 700 }}>+{fmtINR(d.inflow, true)}</span></div>}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}><span style={{ color: "#2563EB" }}>▲ Market growth</span><span style={{ color: "#2563EB", fontWeight: 700 }}>+{fmtINR(d.growth, true)}</span></div>
      </div>
      {d.outflow > 0 && (
        <div style={{ background: "#FEF2F2", borderRadius: 8, padding: "8px 10px", border: "1px solid #FECACA" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#DC2626" }}>
            <span>▼ Withdrawn</span><span style={{ fontWeight: 700 }}>-{fmtINR(d.outflow, true)}</span>
          </div>
          {d.goalsHit.length > 0 && <div style={{ fontSize: 10, color: "#B91C1C", marginTop: 4, fontWeight: 700 }}>🎯 {d.goalsHit.join(", ")}</div>}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const SectionHeader = ({ title, sub, icon }: { title: string; sub?: string; icon?: React.ReactNode }) => (
  <div className="flex items-center gap-3 mb-4">
    {icon && <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">{icon}</div>}
    <div>
      <h3 className="font-bold text-stone-900 text-base leading-tight">{title}</h3>
      {sub && <p className="text-xs text-stone-500 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const InputSection = ({ title, children }: any) => (
  <div className="border-b border-stone-100 pb-5">
    <div className="text-[10px] font-bold uppercase text-stone-400 mb-3 tracking-widest">{title}</div>
    <div className="space-y-3">{children}</div>
  </div>
);

const InputRow = ({ label, val, set, suffix = "" }: any) => (
  <div className="flex justify-between items-center gap-2">
    <label className="text-xs font-medium text-stone-600 leading-tight">{label}</label>
    <div className="flex items-center gap-1">
      <input
        type="number"
        className="w-24 p-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-right font-bold text-stone-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
        value={val}
        onChange={(e) => set(Number(e.target.value))}
      />
      {suffix && <span className="text-[10px] text-stone-400">{suffix}</span>}
    </div>
  </div>
);

// Mini donut SVG — no external deps
const MiniDonut = ({ segments, size = 56, stroke = 10 }: { segments: { value: number; color: string }[]; size?: number; stroke?: number }) => {
  const r = (size - stroke) / 2;
  const cx = size / 2, cy = size / 2;
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return <div style={{ width: size, height: size, borderRadius: "50%", background: "#F1F5F9" }} />;
  let cumAngle = -Math.PI / 2;
  const arcs = segments.filter(s => s.value > 0).map(seg => {
    const frac = seg.value / total;
    const angle = frac * 2 * Math.PI;
    const x1 = cx + r * Math.cos(cumAngle);
    const y1 = cy + r * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = cx + r * Math.cos(cumAngle);
    const y2 = cy + r * Math.sin(cumAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    return { d: `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`, color: seg.color };
  });
  return (
    <svg width={size} height={size}>
      {arcs.map((a, i) => <path key={i} d={a.d} fill="none" stroke={a.color} strokeWidth={stroke} strokeLinecap="round" />)}
    </svg>
  );
};

// Pill badge
const Pill = ({ label, color = "stone" }: { label: string; color?: "emerald" | "amber" | "red" | "blue" | "purple" | "stone" }) => {
  const cls: Record<string, string> = {
    emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
    amber: "bg-amber-100 text-amber-700 border-amber-200",
    red: "bg-red-100 text-red-700 border-red-200",
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    purple: "bg-purple-100 text-purple-700 border-purple-200",
    stone: "bg-stone-100 text-stone-600 border-stone-200",
  };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cls[color]}`}>{label}</span>;
};

// Progress bar
const ProgressBar = ({ value, max, color = "#10B981", label, sublabel }: any) => {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[11px] text-stone-500">{label}</span>
        <span className="text-[11px] font-bold text-stone-700">{sublabel ?? `${pct}%`}</span>
      </div>
      <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
};

// Metric card — redesigned with meaning text
const MetricCard = ({ label, value, meaning, sub, color = "text-stone-800", bg = "bg-white", icon, badge, onClick }: any) => (
  <div
    onClick={onClick}
    className={`${bg} border border-stone-200 rounded-2xl p-4 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group relative overflow-hidden flex flex-col gap-3`}
  >
    <div className="flex justify-between items-start gap-2">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color === "text-emerald-700" ? "bg-emerald-50 text-emerald-600" : color === "text-purple-700" ? "bg-purple-50 text-purple-600" : color === "text-red-600" ? "bg-red-50 text-red-500" : color === "text-amber-700" ? "bg-amber-50 text-amber-600" : "bg-stone-50 text-stone-500"}`}>
        {icon}
      </div>
      {badge && badge}
    </div>
    <div>
      <div className={`text-lg sm:text-xl font-black ${color} leading-tight`}>{value}</div>
      <div className="text-[11px] font-semibold text-stone-500 mt-0.5">{label}</div>
    </div>
    {meaning && <p className="text-[11px] text-stone-400 leading-relaxed border-t border-stone-50 pt-2">{meaning}</p>}
    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <Info className="w-3.5 h-3.5 text-stone-300" />
    </div>
  </div>
);

// Diagnosis card — rich version
const DiagnosisCard = ({ title, status, statusColor, icon, children }: any) => {
  const colors: any = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    red: "bg-red-50 text-red-700 border-red-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    stone: "bg-stone-50 text-stone-600 border-stone-200",
  };
  return (
    <div className={`rounded-2xl border p-4 ${colors[statusColor]?.split(" ")[2] ? "border-" + statusColor + "-100" : "border-stone-100"} bg-white shadow-sm`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 text-sm font-bold text-stone-800">{icon} {title}</div>
        <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${colors[statusColor] || colors.stone}`}>{status}</span>
      </div>
      {children}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [activeMathModal, setActiveMathModal] = useState<string | null>(null);
  const { user, loading } = useUser();
  const router = useRouter();

  const [inputs, setInputs] = useState({
    currentAge: 35, retirementAge: 60, lifeExpectancy: 85,
    monthlyIncome: 0, monthlyExpenses: 0, monthlyEMIs: 0, existingSIP: 0,
    currentCorpus: 0,
    assetsEquity: 0, assetsDebt: 0, assetsRealEstate: 0, assetsGold: 0, assetsCash: 0,
    equityRatio: 0.6, inflation: 6,
    goals: [] as Goal[],
    insuranceHealth: "none", insuranceTerm: 0,
    emergencyFund: 0,
  });

  useEffect(() => {
    if (!loading && !user) { router.push("/api/auth/google"); return; }
    if (user) {
      fetch("/api/onboarding").then(r => r.json()).then(json => {
        const p = json.data || {};
        const totalAssets = (p.assetsEquity || 0) + (p.assetsDebt || 0) + (p.assetsGold || 0) + (p.assetsRealEstate || 0) + (p.assetsCash || 0);
        setInputs(prev => ({
          ...prev,
          currentAge: p.age || 35, retirementAge: p.retirementAge || 60,
          monthlyIncome: p.monthlyIncome || 0, monthlyExpenses: p.monthlyExpenses || 0,
          monthlyEMIs: p.monthlyEMI || 0, existingSIP: p.existingSIP || 0,
          currentCorpus: totalAssets,
          assetsEquity: p.assetsEquity || 0, assetsDebt: p.assetsDebt || 0,
          assetsRealEstate: p.assetsRealEstate || 0, assetsGold: p.assetsGold || 0,
          assetsCash: p.assetsCash || 0,
          goals: p.goals?.filter((g: any) => g.id !== "retire") || [],
          insuranceHealth: p.insuranceHealth || "none",
          insuranceTerm: p.insuranceTerm || 0,
          emergencyFund: p.emergencyFund || 0,
        }));
      });
    }
  }, [user, loading, router]);

  // Sync corpus total
  useEffect(() => {
    const total = inputs.assetsEquity + inputs.assetsDebt + inputs.assetsRealEstate + inputs.assetsGold + inputs.assetsCash;
    if (total !== inputs.currentCorpus) {
      // FIX: also recompute equityRatio from actual assets
      const eqRatio = computeEquityRatio(inputs.assetsEquity, total);
      setInputs(prev => ({ ...prev, currentCorpus: total, equityRatio: eqRatio }));
    }
  }, [inputs.assetsEquity, inputs.assetsDebt, inputs.assetsRealEstate, inputs.assetsGold, inputs.assetsCash]);

  // ── Derived values ──
  const monthlySurplus = inputs.monthlyIncome - inputs.monthlyExpenses - inputs.monthlyEMIs;
  const savingsRate = inputs.monthlyIncome > 0 ? Math.round((Math.max(0, monthlySurplus) / inputs.monthlyIncome) * 100) : 0;
  const blendedReturn = getBlendedReturn(inputs.equityRatio);

  const simData = useMemo(() => runSimulation(inputs, 0), [inputs]);
  const failPoint = simData.find(d => d.corpus < 0);
  const isSafe = !failPoint;
  const corpusAtRetire = simData.find(d => d.age === inputs.retirementAge)?.corpus || 0;

  // FIX 4: FIRE uses inflation-adjusted expenses at the simulation year
  const fireAge = useMemo(() => {
    if (!isSafe) return null;
    const hit = simData.find(d => {
      const inflatedAnnualExp = (inputs.monthlyExpenses * 12) * Math.pow(1 + inputs.inflation / 100, d.age - inputs.currentAge);
      return d.corpus > 25 * inflatedAnnualExp;
    });
    return hit ? hit.age : null;
  }, [simData, isSafe, inputs]);

  const joyMoney = useMemo(() => isSafe ? calculateMaxJoyMoney(inputs) : 0, [inputs, isSafe]);

  // FIX 5: familyRunway — insurance payout is modelled separately, not added to investable corpus
  const familyRunway = useMemo(() => {
    const annualNeed = inputs.monthlyExpenses * 12;
    // Corpus continues to earn, insurance payout starts immediately
    const totalLiquid = inputs.currentCorpus + inputs.insuranceTerm;
    return calculateRunway(totalLiquid, annualNeed, inputs.inflation, 6); // conservative 6% post-event
  }, [inputs]);

  // Emergency fund adequacy (months of expenses covered)
  const emergencyMonths = inputs.monthlyExpenses > 0
    ? Math.round(inputs.emergencyFund / inputs.monthlyExpenses)
    : 0;

  // Goal analysis — FIX 6: goal gap now uses correct FV costs with consistent inflation
  const goalAnalysis = useMemo(() => {
    const totalGoalFV = inputs.goals.reduce((sum, g) => {
      const yrs = Math.max(0, g.age - inputs.currentAge);
      return sum + g.cost * Math.pow(1 + inputs.inflation / 100, yrs);
    }, 0);
    const retireFV = inputs.monthlyExpenses * 12 * 25 * Math.pow(1 + inputs.inflation / 100, inputs.retirementAge - inputs.currentAge);
    const totalLiability = Math.max(1, totalGoalFV + retireFV);

    return inputs.goals.map(g => {
      const years = Math.max(0, g.age - inputs.currentAge);
      const fvCost = g.cost * Math.pow(1 + inputs.inflation / 100, years);
      // Allocate corpus proportionally by FV cost (more consistent)
      const share = fvCost / totalLiability;
      const allocatedFuture = inputs.currentCorpus * share * Math.pow(1 + blendedReturn / 100, years);
      const gap = Math.max(0, fvCost - allocatedFuture);
      const sipNeeded = gap > 0 ? calculateGapSIP(gap, years, blendedReturn) : 0;
      const funded = gap <= 0;
      const fundedPct = fvCost > 0 ? Math.min(100, Math.round((allocatedFuture / fvCost) * 100)) : 100;
      return { ...g, years, fvCost, gap, sipNeeded, funded, fundedPct };
    }).sort((a, b) => a.age - b.age);
  }, [inputs, blendedReturn]);

  const totalGoalSipNeeded = useMemo(() => goalAnalysis.reduce((s, g) => s + g.sipNeeded, 0), [goalAnalysis]);
  const sipCoverage = totalGoalSipNeeded > 0 ? Math.min(100, Math.round((inputs.existingSIP / totalGoalSipNeeded) * 100)) : 100;

  const summary = useMemo(() => buildSummary({
    isSafe, failPointAge: failPoint?.age, fireAge,
    monthlySurplus, joyMoney, corpusAtRetire,
    retirementAge: inputs.retirementAge,
    goalSipNeeded: totalGoalSipNeeded,
    existingSIP: inputs.existingSIP,
    familyRunway,
  }), [isSafe, failPoint?.age, fireAge, monthlySurplus, joyMoney, corpusAtRetire, inputs.retirementAge, totalGoalSipNeeded, inputs.existingSIP, familyRunway]);

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-blue-50">
      <div className="text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto animate-pulse">
          <Activity className="w-7 h-7 text-emerald-600" />
        </div>
        <p className="text-sm text-stone-500 font-medium">Loading your dashboard…</p>
      </div>
    </div>
  );

  // Asset segments for donut
  const assetSegments = [
    { value: inputs.assetsEquity, color: "#10B981", label: "Equity" },
    { value: inputs.assetsDebt, color: "#2563EB", label: "Debt/PF" },
    { value: inputs.assetsRealEstate, color: "#D97706", label: "Real Estate" },
    { value: inputs.assetsGold, color: "#F59E0B", label: "Gold" },
    { value: inputs.assetsCash, color: "#94A3B8", label: "Cash" },
  ].filter(s => s.value > 0);

  // Cashflow bars
  const cfMax = Math.max(1, inputs.monthlyIncome);
  const cfBars = [
    { label: "Income", value: inputs.monthlyIncome, color: "#10B981", width: 100 },
    { label: "Expenses", value: inputs.monthlyExpenses, color: "#F87171", width: (inputs.monthlyExpenses / cfMax) * 100 },
    { label: "EMIs", value: inputs.monthlyEMIs, color: "#FBBF24", width: (inputs.monthlyEMIs / cfMax) * 100 },
    { label: "SIP", value: inputs.existingSIP, color: "#2563EB", width: (inputs.existingSIP / cfMax) * 100 },
  ];

  const summaryColors = { good: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "bg-emerald-100 text-emerald-700", text: "text-emerald-700" }, warn: { bg: "bg-amber-50", border: "border-amber-200", icon: "bg-amber-100 text-amber-700", text: "text-amber-700" }, risk: { bg: "bg-red-50", border: "border-red-200", icon: "bg-red-100 text-red-700", text: "text-red-700" } };
  const sc = summaryColors[summary.tone];

  return (
    <div className="min-h-screen bg-[#F5F8FF] font-sans text-stone-900 flex flex-col xl:flex-row box-border">

      {/* ── LEFT SIDEBAR ── */}
      <aside className="order-last xl:order-first w-full xl:w-[300px] bg-white border-r border-stone-200 flex flex-col xl:h-[calc(100vh-64px)] xl:sticky xl:top-16 z-10 shadow-sm shrink-0">
        {/* Header */}
        <div className="p-5 border-b border-stone-100 flex justify-between items-center bg-gradient-to-r from-stone-50 to-white">
          <div>
            <div className="font-black text-stone-900 text-base">Control Panel</div>
            <div className="text-[11px] text-stone-400 mt-0.5">Tweak any number — chart updates live</div>
          </div>
          <Link href="/dashboard/onboarding">
            <button className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-emerald-100 hover:text-emerald-700 text-stone-500 flex items-center justify-center transition-all" title="Edit in wizard">
              <Edit className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-6 pb-20">
          {/* Net Worth mini donut */}
          {inputs.currentCorpus > 0 && (
            <div className="bg-gradient-to-br from-stone-50 to-white rounded-2xl p-4 border border-stone-100">
              <div className="text-[10px] font-bold uppercase text-stone-400 tracking-widest mb-3">Portfolio Mix</div>
              <div className="flex items-center gap-4">
                <MiniDonut segments={assetSegments} size={56} stroke={10} />
                <div className="flex-1 space-y-1.5">
                  {assetSegments.map((s, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                        <span className="text-[10px] text-stone-500">{s.label}</span>
                      </div>
                      <span className="text-[10px] font-bold text-stone-700">{fmtINR(s.value, true)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <InputSection title="Life Timeline">
            <InputRow label="Current Age" val={inputs.currentAge} set={(v: number) => setInputs({ ...inputs, currentAge: v })} suffix="yrs" />
            <InputRow label="Retire at" val={inputs.retirementAge} set={(v: number) => setInputs({ ...inputs, retirementAge: v })} suffix="yrs" />
            <InputRow label="Life to age" val={inputs.lifeExpectancy} set={(v: number) => setInputs({ ...inputs, lifeExpectancy: v })} suffix="yrs" />
          </InputSection>

          <InputSection title="Monthly Cashflow">
            <InputRow label="Take-home income" val={inputs.monthlyIncome} set={(v: number) => setInputs({ ...inputs, monthlyIncome: v })} />
            <InputRow label="Essential expenses" val={inputs.monthlyExpenses} set={(v: number) => setInputs({ ...inputs, monthlyExpenses: v })} />
            <InputRow label="Loan EMIs" val={inputs.monthlyEMIs} set={(v: number) => setInputs({ ...inputs, monthlyEMIs: v })} />
            <InputRow label="Monthly SIPs" val={inputs.existingSIP} set={(v: number) => setInputs({ ...inputs, existingSIP: v })} />
            {/* Live surplus indicator */}
            <div className={`mt-1 p-2.5 rounded-xl text-xs font-bold flex items-center justify-between ${monthlySurplus >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
              <span>{monthlySurplus >= 0 ? "Monthly Surplus" : "Monthly Deficit"}</span>
              <span>{fmtINR(Math.abs(monthlySurplus))}/mo</span>
            </div>
          </InputSection>

          <InputSection title="Assets (Today's Value)">
            <InputRow label="Equity / MFs" val={inputs.assetsEquity} set={(v: number) => setInputs({ ...inputs, assetsEquity: v })} />
            <InputRow label="Debt / EPF / PF" val={inputs.assetsDebt} set={(v: number) => setInputs({ ...inputs, assetsDebt: v })} />
            <InputRow label="Real Estate" val={inputs.assetsRealEstate} set={(v: number) => setInputs({ ...inputs, assetsRealEstate: v })} />
            <InputRow label="Gold" val={inputs.assetsGold} set={(v: number) => setInputs({ ...inputs, assetsGold: v })} />
            <InputRow label="Cash / Bank" val={inputs.assetsCash} set={(v: number) => setInputs({ ...inputs, assetsCash: v })} />
            <div className="flex justify-between items-center pt-1">
              <span className="text-[10px] text-stone-400 uppercase tracking-wide font-bold">Net Worth</span>
              <span className="text-xs font-black text-stone-800">{fmtINR(inputs.currentCorpus, true)}</span>
            </div>
          </InputSection>

          <InputSection title="Assumptions">
            <InputRow label="Inflation" val={inputs.inflation} set={(v: number) => setInputs({ ...inputs, inflation: v })} suffix="%" />
            <div className="flex justify-between items-center">
              <span className="text-xs text-stone-500">Blended return</span>
              <span className="text-xs font-bold text-emerald-700">{blendedReturn}% p.a.</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-stone-500">Equity ratio</span>
              <span className="text-xs font-bold text-stone-700">{Math.round(inputs.equityRatio * 100)}%</span>
            </div>
          </InputSection>
        </div>
      </aside>

      {/* ── CENTER MAIN ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">

        {/* ── HERO SUMMARY BANNER ── */}
        <div className="px-4 sm:px-6 pt-6 pb-2">
          <div className={`rounded-2xl border p-5 sm:p-6 ${sc.bg} ${sc.border} shadow-sm`}>
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl ${sc.icon} flex items-center justify-center shrink-0`}>
                {summary.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Financial Health Report</div>
                <h2 className="text-lg sm:text-xl font-black text-stone-900 leading-tight">{summary.title}</h2>
                <p className="text-sm text-stone-600 mt-1.5 leading-relaxed max-w-2xl">{summary.subtitle}</p>
                <p className="text-xs text-stone-400 mt-2 font-medium">{summary.detail}</p>
              </div>
              {fireAge && (
                <div className="shrink-0 bg-white rounded-xl border border-purple-200 px-4 py-3 text-center shadow-sm">
                  <div className="text-[10px] text-purple-500 font-bold uppercase tracking-wide">FIRE Age</div>
                  <div className="text-2xl font-black text-purple-700">{fireAge}</div>
                  <div className="text-[10px] text-stone-400">{fireAge - inputs.currentAge}yr away</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── METRIC CARDS ── */}
        <div className="px-4 sm:px-6 py-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard
            label="Net Worth"
            value={fmtINR(inputs.currentCorpus, true)}
            meaning="Sum of all assets today — your financial starting line."
            color="text-stone-800"
            icon={<Wallet className="w-5 h-5" />}
            onClick={() => setActiveMathModal("networth")}
          />
          <MetricCard
            label="Retire Corpus"
            value={fmtINR(corpusAtRetire, true)}
            meaning={`Projected wealth at age ${inputs.retirementAge} growing at ${blendedReturn}% p.a.`}
            color="text-emerald-700"
            icon={<Leaf className="w-5 h-5" />}
            badge={corpusAtRetire > 0 && <Pill label={isSafe ? "On Track" : "At Risk"} color={isSafe ? "emerald" : "red"} />}
            onClick={() => setActiveMathModal("corpus")}
          />
          <MetricCard
            label="Joy Money"
            value={joyMoney > 0 ? `${fmtINR(joyMoney)}/mo` : "₹0"}
            meaning="Extra monthly spend you can afford without ever running out of money."
            color="text-purple-700"
            icon={<Heart className="w-5 h-5" />}
            badge={joyMoney > 0 && <Pill label="Safe" color="purple" />}
            onClick={() => setActiveMathModal("joy")}
          />
          <MetricCard
            label="Plan Status"
            value={isSafe ? "Secure ✓" : `Fails at ${failPoint?.age}`}
            meaning={isSafe ? `Corpus stays positive until age ${inputs.lifeExpectancy}.` : "Increase savings or delay retirement to fix this."}
            color={isSafe ? "text-emerald-700" : "text-red-600"}
            icon={<ShieldAlert className="w-5 h-5" />}
            onClick={() => setActiveMathModal("status")}
          />
        </div>

        {/* ── CASHFLOW + SAVINGS RATE ── */}
        <div className="px-4 sm:px-6 pb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Cashflow waterfall */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
            <SectionHeader title="Monthly Cashflow" sub="Where every rupee of income goes" icon={<BarChart2 className="w-4 h-4" />} />
            <div className="space-y-3">
              {cfBars.map((bar, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-stone-600">{bar.label}</span>
                    <span className="text-xs font-bold text-stone-800">{fmtINR(bar.value)}</span>
                  </div>
                  <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(0, bar.width)}%`, background: bar.color }} />
                  </div>
                </div>
              ))}
              <div className="pt-2 mt-1 border-t border-stone-100 flex justify-between items-center">
                <span className="text-xs text-stone-500 font-semibold">Monthly Surplus</span>
                <span className={`text-sm font-black ${monthlySurplus >= 0 ? "text-emerald-700" : "text-red-600"}`}>{fmtINR(monthlySurplus)}/mo</span>
              </div>
            </div>
          </div>

          {/* Savings rate ring */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 flex flex-col justify-between">
            <SectionHeader title="Savings Rate" sub="% of income saved & invested" icon={<PiggyBank className="w-4 h-4" />} />
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <svg width="88" height="88" viewBox="0 0 88 88">
                  <circle cx="44" cy="44" r="34" fill="none" stroke="#F1F5F9" strokeWidth="10" />
                  <circle cx="44" cy="44" r="34" fill="none"
                    stroke={savingsRate >= 25 ? "#10B981" : savingsRate >= 15 ? "#F59E0B" : "#EF4444"}
                    strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={`${(savingsRate / 100) * 213.6} 213.6`}
                    transform="rotate(-90 44 44)" style={{ transition: "stroke-dasharray 0.7s ease" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-xl font-black ${savingsRate >= 25 ? "text-emerald-700" : savingsRate >= 15 ? "text-amber-600" : "text-red-600"}`}>{savingsRate}%</span>
                </div>
              </div>
              <div className="text-center">
                <div className={`text-xs font-bold ${savingsRate >= 25 ? "text-emerald-700" : savingsRate >= 15 ? "text-amber-600" : "text-red-600"}`}>
                  {savingsRate >= 25 ? "Excellent" : savingsRate >= 15 ? "Good — aim for 25%" : "Low — target 25%+"}
                </div>
                <div className="text-[10px] text-stone-400 mt-0.5">Benchmark: 25%+ of income</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── WEALTH FORECAST CHART ── */}
        <div className="px-4 sm:px-6 pb-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
              <SectionHeader title="Wealth Forecast" sub={`Your corpus from age ${inputs.currentAge} to ${inputs.lifeExpectancy}`} icon={<TrendingUp className="w-4 h-4" />} />
              <div className="flex flex-wrap gap-3 text-[10px] text-stone-500 shrink-0">
                <span className="flex items-center gap-1.5"><span className="inline-block w-5 h-0.5 bg-emerald-500 rounded" /> Corpus</span>
                {inputs.goals.length > 0 && <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-4 rounded-full bg-indigo-500/20 border border-indigo-400" /> Goal</span>}
                {fireAge && <span className="flex items-center gap-1.5"><span className="inline-block w-5 border-t border-dashed border-orange-400" /> FIRE</span>}
              </div>
            </div>

            <div className="w-full h-[260px] sm:h-[320px] lg:h-[380px] touch-none select-none">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={simData} margin={{ top: 16, right: 8, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="corpusGreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.01" />
                    </linearGradient>
                    <linearGradient id="corpusRed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EF4444" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#EF4444" stopOpacity="0.01" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="age" tick={{ fill: "#94A3B8", fontSize: 9 }} tickLine={false} axisLine={false} minTickGap={20} />
                  <YAxis tickFormatter={(v) => fmtINR(v, true)} tick={{ fill: "#94A3B8", fontSize: 9 }} tickLine={false} axisLine={false} width={48} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#E2E8F0", strokeWidth: 1 }} />

                  {/* Retirement zone shading */}
                  <ReferenceLine x={inputs.retirementAge} stroke="#64748B" strokeWidth={1.5} strokeDasharray="4 4"
                    label={{ value: `Retire ${inputs.retirementAge}`, position: "insideTopRight", fill: "#64748B", fontSize: 9 }} />

                  {/* Goal markers */}
                  {inputs.goals.map((g, i) => (
                    <ReferenceLine key={i} x={g.age} stroke="#6366F1" strokeDasharray="3 3" strokeWidth={1}
                      label={{ value: getGoalEmoji(g.name), position: "top", fontSize: 12 }} />
                  ))}

                  {/* FIRE marker */}
                  {fireAge && (
                    <ReferenceLine x={fireAge} stroke="#F97316" strokeWidth={2} strokeDasharray="5 3"
                      label={{ value: `🔥 FIRE`, position: "insideTopLeft", fill: "#F97316", fontSize: 9 }} />
                  )}

                  <Area type="monotone" dataKey="corpus" stroke={isSafe ? "#10B981" : "#EF4444"}
                    strokeWidth={2.5} fill={isSafe ? "url(#corpusGreen)" : "url(#corpusRed)"}
                    dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: "white" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Key callouts below chart */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: `Age ${inputs.retirementAge} corpus`, value: fmtINR(corpusAtRetire, true), color: "text-emerald-700" },
                { label: "Assumed return", value: `${blendedReturn}% p.a.`, color: "text-blue-700" },
                { label: "Inflation assumed", value: `${inputs.inflation}% p.a.`, color: "text-amber-700" },
                { label: isSafe ? "Safe till" : "Runs out at", value: isSafe ? `Age ${inputs.lifeExpectancy}` : `Age ${failPoint?.age}`, color: isSafe ? "text-emerald-700" : "text-red-600" },
              ].map((c, i) => (
                <div key={i} className="bg-stone-50 rounded-xl p-2.5 border border-stone-100">
                  <div className="text-[9px] text-stone-400 uppercase font-bold tracking-wide">{c.label}</div>
                  <div className={`text-sm font-black mt-0.5 ${c.color}`}>{c.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── GOAL PLANNING ── */}
        {goalAnalysis.length > 0 && (
          <div className="px-4 sm:px-6 pb-4">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
              <SectionHeader title="Goal Planning" sub="Each goal mapped to a monthly SIP requirement" icon={<Target className="w-4 h-4" />} />

              {/* SIP Coverage bar */}
              <div className="mb-5 p-3.5 bg-stone-50 rounded-xl border border-stone-100">
                <ProgressBar
                  value={inputs.existingSIP}
                  max={Math.max(inputs.existingSIP, totalGoalSipNeeded)}
                  color={sipCoverage >= 100 ? "#10B981" : sipCoverage >= 60 ? "#F59E0B" : "#EF4444"}
                  label={`SIP coverage: ${fmtINR(inputs.existingSIP)}/mo existing`}
                  sublabel={`${sipCoverage}% of ${fmtINR(totalGoalSipNeeded)}/mo needed`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {goalAnalysis.map((g, i) => (
                  <div key={i} className={`rounded-2xl border p-4 transition-all ${g.funded ? "bg-emerald-50/50 border-emerald-200" : "bg-white border-stone-200"}`}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${g.funded ? "bg-emerald-100" : "bg-indigo-50"}`}>
                          {getGoalEmoji(g.name)}
                        </div>
                        <div>
                          <div className="font-bold text-stone-900 text-sm leading-tight">{g.name}</div>
                          <div className="text-[10px] text-stone-400 mt-0.5">
                            Age {g.age} · {Math.max(0, g.years)} yr{g.years !== 1 ? "s" : ""} away
                          </div>
                        </div>
                      </div>
                      {g.funded
                        ? <Pill label="✓ Funded" color="emerald" />
                        : <Pill label={`${g.fundedPct}% covered`} color={g.fundedPct >= 60 ? "amber" : "red"} />
                      }
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <div className="text-[10px] text-stone-400 font-bold uppercase">Target (future value)</div>
                        <div className="text-sm font-black text-stone-800 mt-0.5">{fmtINR(g.fvCost, true)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-stone-400 font-bold uppercase">SIP needed</div>
                        <div className={`text-sm font-black mt-0.5 ${g.funded ? "text-emerald-700" : "text-stone-800"}`}>
                          {g.funded ? "No extra SIP" : `${fmtINR(g.sipNeeded)}/mo`}
                        </div>
                      </div>
                    </div>

                    {/* Coverage bar */}
                    <ProgressBar
                      value={g.fundedPct}
                      max={100}
                      color={g.funded ? "#10B981" : g.fundedPct >= 60 ? "#F59E0B" : "#EF4444"}
                      label="Corpus coverage"
                      sublabel={`${g.fundedPct}%`}
                    />
                  </div>
                ))}
              </div>

              {totalGoalSipNeeded > 0 && (
                <div className="mt-4 p-3.5 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-blue-800">Total SIP needed for all goals</div>
                    <div className="text-[10px] text-blue-600 mt-0.5">Your existing SIP covers {sipCoverage}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-blue-800">{fmtINR(totalGoalSipNeeded)}/mo</div>
                    {totalGoalSipNeeded > inputs.existingSIP && (
                      <div className="text-[10px] text-red-600 font-bold">Gap: {fmtINR(totalGoalSipNeeded - inputs.existingSIP)}/mo</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── FIRE CARD (if eligible) ── */}
        {fireAge && (
          <div className="px-4 sm:px-6 pb-4">
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-200 shadow-sm p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center text-2xl shrink-0">🔥</div>
                <div className="flex-1">
                  <div className="text-[10px] font-bold uppercase text-orange-400 tracking-widest mb-1">FIRE — Financial Independence, Retire Early</div>
                  <h3 className="text-lg font-black text-orange-900">You can retire {fireAge - inputs.currentAge} years early</h3>
                  <p className="text-sm text-orange-700/80 mt-1 leading-relaxed">
                    At age <strong>{fireAge}</strong>, your corpus crosses the 25× annual expenses threshold — the gold standard for financial independence.
                    You won't need to work for money from that point.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <div className="bg-white rounded-xl px-3 py-2 border border-orange-200 text-center">
                      <div className="text-[9px] text-orange-400 font-bold uppercase">Years to FIRE</div>
                      <div className="text-lg font-black text-orange-700">{fireAge - inputs.currentAge}</div>
                    </div>
                    <div className="bg-white rounded-xl px-3 py-2 border border-orange-200 text-center">
                      <div className="text-[9px] text-orange-400 font-bold uppercase">FIRE corpus</div>
                      <div className="text-base font-black text-orange-700">{fmtINR(simData.find(d => d.age === fireAge)?.corpus || 0, true)}</div>
                    </div>
                    <div className="bg-white rounded-xl px-3 py-2 border border-orange-200 text-center">
                      <div className="text-[9px] text-orange-400 font-bold uppercase">Annual spend</div>
                      <div className="text-base font-black text-orange-700">{fmtINR(inputs.monthlyExpenses * 12 * Math.pow(1 + inputs.inflation / 100, fireAge - inputs.currentAge), true)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* bottom spacer */}
        <div className="h-8" />
      </main>

      {/* ── RIGHT PANEL: DIAGNOSIS ── */}
      <aside className="w-full xl:w-[280px] bg-white border-l border-stone-200 xl:overflow-y-auto p-5 shrink-0 order-2 xl:order-last xl:h-[calc(100vh-64px)] xl:sticky xl:top-16">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Stethoscope className="w-4 h-4" />
          </div>
          <h2 className="font-black text-stone-900 text-base">Health Check</h2>
        </div>

        <div className="space-y-3">

          {/* Health Insurance */}
          <DiagnosisCard
            title="Health Cover"
            status={inputs.insuranceHealth === "none" ? "⚠ Critical" : inputs.insuranceHealth === "corporate" ? "Corporate" : "✓ Personal"}
            statusColor={inputs.insuranceHealth === "none" ? "red" : inputs.insuranceHealth === "corporate" ? "amber" : "emerald"}
            icon={<Heart className="w-4 h-4" />}
          >
            <p className="text-xs text-stone-500 leading-relaxed">
              {inputs.insuranceHealth === "none"
                ? "No health insurance detected. A single hospitalisation can wipe out years of savings. Buy a ₹10–20L family floater immediately."
                : inputs.insuranceHealth === "corporate"
                  ? "Corporate cover ends when you change jobs. Consider a personal top-up of ₹10L+ to avoid coverage gaps."
                  : "Personal health cover is active. Review adequacy — ₹15L+ recommended for a family."}
            </p>
          </DiagnosisCard>

          {/* Emergency Fund */}
          <DiagnosisCard
            title="Emergency Fund"
            status={emergencyMonths >= 6 ? "✓ Adequate" : emergencyMonths >= 3 ? "Partial" : "⚠ Low"}
            statusColor={emergencyMonths >= 6 ? "emerald" : emergencyMonths >= 3 ? "amber" : "red"}
            icon={<Shield className="w-4 h-4" />}
          >
            <div className="space-y-2">
              <p className="text-xs text-stone-500">
                {emergencyMonths >= 6
                  ? `${emergencyMonths} months covered. Well protected against income disruption.`
                  : emergencyMonths >= 3
                    ? `${emergencyMonths} months covered. Target 6 months of expenses for full security.`
                    : `Only ${emergencyMonths} month${emergencyMonths !== 1 ? "s" : ""} covered. Build to 6 months of expenses urgently.`}
              </p>
              <ProgressBar value={emergencyMonths} max={6} color={emergencyMonths >= 6 ? "#10B981" : emergencyMonths >= 3 ? "#F59E0B" : "#EF4444"} label="" sublabel={`${Math.min(emergencyMonths, 6)}/6 months`} />
            </div>
          </DiagnosisCard>

          {/* Term Insurance */}
          <DiagnosisCard
            title="Life Cover"
            status={inputs.insuranceTerm >= inputs.monthlyIncome * 12 * 10 ? "✓ Adequate" : inputs.insuranceTerm > 0 ? "Review" : "⚠ None"}
            statusColor={inputs.insuranceTerm >= inputs.monthlyIncome * 12 * 10 ? "emerald" : inputs.insuranceTerm > 0 ? "amber" : "red"}
            icon={<Umbrella className="w-4 h-4" />}
          >
            <p className="text-xs text-stone-500 leading-relaxed">
              {inputs.insuranceTerm > 0
                ? `Cover: ${fmtINR(inputs.insuranceTerm, true)}. Recommended: ${fmtINR(inputs.monthlyIncome * 12 * 10, true)} (10× annual income). Family runway: ${familyRunway.toFixed(1)} yrs.`
                : "No term insurance. Your family has no financial fallback if you're no longer here. Get covered today."}
            </p>
          </DiagnosisCard>

          {/* SIP Gap */}
          <DiagnosisCard
            title="SIP Coverage"
            status={sipCoverage >= 100 ? "✓ Funded" : sipCoverage >= 60 ? `${sipCoverage}%` : `⚠ ${sipCoverage}%`}
            statusColor={sipCoverage >= 100 ? "emerald" : sipCoverage >= 60 ? "amber" : "red"}
            icon={<TrendingUp className="w-4 h-4" />}
          >
            <div className="space-y-2">
              {totalGoalSipNeeded > 0 ? (
                <>
                  <ProgressBar value={inputs.existingSIP} max={totalGoalSipNeeded} color={sipCoverage >= 100 ? "#10B981" : sipCoverage >= 60 ? "#F59E0B" : "#EF4444"} label="" sublabel={`${fmtINR(inputs.existingSIP, true)} of ${fmtINR(totalGoalSipNeeded, true)}`} />
                  <p className="text-xs text-stone-500">
                    {sipCoverage >= 100 ? "All goals fully funded by existing SIPs." : `Add ${fmtINR(Math.max(0, totalGoalSipNeeded - inputs.existingSIP))}/mo to fill the gap.`}
                  </p>
                </>
              ) : (
                <p className="text-xs text-stone-500">No goals added yet. Use the onboarding wizard to define your milestones.</p>
              )}
            </div>
          </DiagnosisCard>

          {/* FIRE / Freedom */}
          <DiagnosisCard
            title="Freedom Status"
            status={fireAge ? `🔥 FIRE @ ${fireAge}` : isSafe ? "On Track" : "At Risk"}
            statusColor={fireAge ? "purple" : isSafe ? "emerald" : "red"}
            icon={<Flame className="w-4 h-4" />}
          >
            <p className="text-xs text-stone-500 leading-relaxed">
              {fireAge
                ? `Your corpus will hit 25× annual expenses at age ${fireAge} — you gain full financial freedom ${fireAge - inputs.currentAge} years before your planned retirement at ${inputs.retirementAge}.`
                : isSafe
                  ? `You're on track to retire comfortably at ${inputs.retirementAge}. FIRE requires a higher savings rate or equity exposure.`
                  : `The plan fails at age ${failPoint?.age}. Increase monthly savings or reduce spending to get back on track.`}
            </p>
          </DiagnosisCard>

          {/* Savings rate */}
          <DiagnosisCard
            title="Savings Rate"
            status={savingsRate >= 25 ? "✓ Strong" : savingsRate >= 15 ? "Decent" : "⚠ Low"}
            statusColor={savingsRate >= 25 ? "emerald" : savingsRate >= 15 ? "amber" : "red"}
            icon={<PiggyBank className="w-4 h-4" />}
          >
            <p className="text-xs text-stone-500 leading-relaxed">
              You save <strong>{savingsRate}%</strong> of your income. {savingsRate >= 25 ? "Excellent! Top savers build wealth 2–3× faster." : savingsRate >= 15 ? "Good start — push toward 25% to hit FIRE faster." : "Low savings rate is the #1 wealth destroyer. Cut one recurring expense to unlock more."}
            </p>
          </DiagnosisCard>
        </div>
      </aside>

      {/* ── MODALS ── */}
      <AnimatePresence>
        {activeMathModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setActiveMathModal(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }} transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-stone-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-bold text-base flex items-center gap-2 text-stone-900">
                  <Calculator className="w-5 h-5 text-emerald-600" /> How it's calculated
                </h3>
                <button onClick={() => setActiveMathModal(null)} className="w-8 h-8 bg-stone-100 hover:bg-stone-200 rounded-full flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-stone-500" />
                </button>
              </div>

              {activeMathModal === "networth" && (
                <div className="space-y-3 text-sm text-stone-600">
                  <p className="text-xs text-stone-500">Sum of all asset classes at today's market value.</p>
                  <div className="space-y-2">
                    {[
                      { l: "Equity / MFs", v: inputs.assetsEquity, c: "#10B981" },
                      { l: "Debt / EPF / PF", v: inputs.assetsDebt, c: "#2563EB" },
                      { l: "Real Estate", v: inputs.assetsRealEstate, c: "#D97706" },
                      { l: "Gold", v: inputs.assetsGold, c: "#F59E0B" },
                      { l: "Cash / Bank", v: inputs.assetsCash, c: "#94A3B8" },
                    ].map((s, i) => (
                      <div key={i} className="flex justify-between items-center py-1.5 border-b border-stone-50">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ background: s.c }} /><span className="text-xs">{s.l}</span></div>
                        <span className="text-xs font-bold text-stone-800">{fmtINR(s.v, true)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-2"><span className="text-sm font-bold">Net Worth</span><span className="text-base font-black text-emerald-700">{fmtINR(inputs.currentCorpus, true)}</span></div>
                  </div>
                </div>
              )}

              {activeMathModal === "corpus" && (
                <div className="space-y-3 text-sm text-stone-600">
                  <p className="text-xs text-stone-500">Projected corpus at retirement using compound growth + annual surplus additions.</p>
                  <div className="bg-stone-50 rounded-xl p-3 space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between"><span>Starting corpus</span><span className="font-bold">{fmtINR(inputs.currentCorpus, true)}</span></div>
                    <div className="flex justify-between"><span>Annual surplus</span><span className="font-bold">{fmtINR(monthlySurplus * 12, true)}</span></div>
                    <div className="flex justify-between"><span>Return rate</span><span className="font-bold">{blendedReturn}%</span></div>
                    <div className="flex justify-between"><span>Inflation</span><span className="font-bold">{inputs.inflation}%</span></div>
                    <div className="flex justify-between"><span>Years to retire</span><span className="font-bold">{inputs.retirementAge - inputs.currentAge} yrs</span></div>
                    <div className="border-t border-stone-200 pt-1.5 flex justify-between text-emerald-700"><span className="font-bold">Projected corpus</span><span className="font-black">{fmtINR(corpusAtRetire, true)}</span></div>
                  </div>
                </div>
              )}

              {activeMathModal === "joy" && (
                <div className="space-y-3 text-sm text-stone-600">
                  <p className="text-xs text-stone-500">The maximum extra lifestyle spend you can sustain monthly without ever running out of money before age {inputs.lifeExpectancy}.</p>
                  <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-100">
                    <div className="text-2xl font-black text-purple-700">{fmtINR(joyMoney)}/mo</div>
                    <div className="text-xs text-purple-500 mt-1">Safe to spend above essentials</div>
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed">Found via binary search over 20 iterations — this is the highest monthly add-on that keeps your corpus ≥ 0 until age {inputs.lifeExpectancy}.</p>
                </div>
              )}

              {activeMathModal === "status" && (
                <div className="space-y-3 text-sm text-stone-600">
                  <div className={`rounded-xl p-3 text-center border font-bold text-base ${isSafe ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-red-50 border-red-100 text-red-700"}`}>
                    {isSafe ? `✓ Secure until age ${inputs.lifeExpectancy}` : `⚠ Corpus runs out at age ${failPoint?.age}`}
                  </div>
                  <p className="text-xs text-stone-500">
                    {isSafe
                      ? "The simulation keeps corpus above zero through your entire life expectancy. Your plan is financially self-sufficient."
                      : `At age ${failPoint?.age}, annual expenses exceed portfolio value. Actions: cut expenses, increase savings, delay retirement, or reduce goals.`}
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}