"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ReferenceLine, ReferenceDot 
} from "recharts";
import { 
  ShieldAlert, Edit, Wallet, Leaf, Heart, 
  Flame, Stethoscope, Umbrella, PiggyBank, Info, 
  Calculator, AlertTriangle, CheckCircle2, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/hooks/useUser"; // UPDATED: Using our custom hook
import Link from "next/link";
import { useRouter } from "next/navigation";

// --- UTILS ---
const formatIndianCurrency = (num: number, compact = false) => {
  if (num === undefined || num === null) return "₹0";
  if (compact) {
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)} L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(1)} K`;
  }
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
};

// --- TYPES ---
type Goal = { id: string; name: string; age: number; cost: number };

// --- 1. MATH ENGINE ---
const getBlendedReturn = (equityRatio: number) => {
    return Number(((equityRatio * 12) + ((1 - equityRatio) * 7)).toFixed(1));
};

const calculateRunway = (corpus: number, annualDraw: number, inflation: number, returnRate: number) => {
    if (annualDraw <= 0) return 99;
    if (corpus <= 0) return 0;
    const r = (1 + returnRate/100) / (1 + inflation/100) - 1;
    if (Math.abs(r) < 0.001) return corpus / annualDraw;
    const numerator = 1 - (corpus * r / annualDraw);
    if (numerator <= 0) return 99; 
    const years = -Math.log(numerator) / Math.log(1 + r);
    return parseFloat(years.toFixed(1));
};

const calculateGapSIP = (gap: number, years: number, rate: number) => {
    if (years <= 0 || gap <= 0) return 0;
    const r = rate / 100 / 12;
    const n = years * 12;
    const sip = gap / ( ( (Math.pow(1 + r, n) - 1) / r ) * (1 + r) );
    return Math.round(sip);
};

// --- SIMULATION ENGINE ---
function runSimulation(inputs: any, joyMoneyMonthly: number = 0) {
  const data = [];
  let corpus = inputs.currentCorpus;
  let annualSurplus = (inputs.monthlyIncome - inputs.monthlyExpenses - inputs.monthlyEMIs - joyMoneyMonthly) * 12; 
  let annualExpenses = (inputs.monthlyExpenses + joyMoneyMonthly) * 12;
  const ratePre = getBlendedReturn(inputs.equityRatio) / 100;
  const ratePost = getBlendedReturn(inputs.equityRatio > 0.3 ? 0.3 : inputs.equityRatio) / 100; 

  for (let age = inputs.currentAge; age <= inputs.lifeExpectancy; age++) {
    const isRetired = age >= inputs.retirementAge;
    const yearIndex = age - inputs.currentAge;
    
    // Goals
    const yearGoals = inputs.goals.filter((g: Goal) => g.age === age);
    let goalOutflow = 0;
    const goalsHit: string[] = [];
    yearGoals.forEach((g: Goal) => {
      const cost = g.cost * Math.pow(1 + inputs.inflation/100, yearIndex);
      goalOutflow += cost;
      goalsHit.push(g.name);
    });

    // Growth
    const rate = isRetired ? ratePost : ratePre;
    const growth = corpus * rate;
    corpus += growth;

    // Flows
    let outflowThisYear = 0;
    let inflowThisYear = 0;
    if (!isRetired) {
      const inflatedSurplus = annualSurplus * Math.pow(1 + inputs.inflation/100, yearIndex);
      corpus += inflatedSurplus;
      inflowThisYear = inflatedSurplus;
    } else {
      const inflatedExpenses = annualExpenses * Math.pow(1 + inputs.inflation/100, yearIndex);
      corpus -= inflatedExpenses;
      outflowThisYear = inflatedExpenses;
    }

    corpus -= goalOutflow;
    data.push({ age, corpus: Math.round(corpus), growth: Math.round(growth), inflow: Math.round(inflowThisYear), outflow: Math.round(outflowThisYear + goalOutflow), isRetired, goalsHit });
    if (corpus < -50000000) break;
  }
  return data;
}

const calculateMaxJoyMoney = (baseParams: any) => {
    let low = 0;
    let high = baseParams.monthlyIncome - baseParams.monthlyExpenses - baseParams.monthlyEMIs;
    if (high <= 0) return 0;
    let safeJoy = 0;
    for (let i = 0; i < 12; i++) {
        const mid = (low + high) / 2;
        const res = runSimulation(baseParams, mid);
        if (!res.some(d => d.corpus < 0)) { safeJoy = mid; low = mid; } else { high = mid; }
    }
    return Math.floor(safeJoy / 1000) * 1000;
};

export default function DashboardPage() {
  const [activeMathModal, setActiveMathModal] = useState<string | null>(null);
  const { user, loading } = useUser();
  const router = useRouter();
  
  const [inputs, setInputs] = useState({
    currentAge: 35,
    retirementAge: 60,
    lifeExpectancy: 85,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    monthlyEMIs: 0,
    existingSIP: 0,
    currentCorpus: 0,
    assetsEquity: 0, assetsDebt: 0, assetsRealEstate: 0, assetsGold: 0, assetsCash: 0,
    equityRatio: 0.7, inflation: 6,
    goals: [] as Goal[],
    insuranceHealth: "none", insuranceTerm: 0,
  });

  useEffect(() => {
    if (!loading && !user) {
        router.push('/api/auth/google');
        return;
    }

    if (user) {
        fetch('/api/onboarding')
            .then(res => res.json())
            .then(json => {
                const p = json.data || {};
                const totalAssets = (p.assetsEquity || 0) + (p.assetsDebt || 0) + (p.assetsGold || 0) + (p.assetsRealEstate || 0) + (p.assetsCash || 0);
                setInputs(prev => ({
                    ...prev,
                    currentAge: p.age || 35,
                    retirementAge: p.retirementAge || 60,
                    monthlyIncome: p.monthlyIncome || 0,
                    monthlyExpenses: p.monthlyExpenses || 0,
                    monthlyEMIs: p.monthlyEMI || 0,
                    existingSIP: p.existingSIP || 0,
                    currentCorpus: totalAssets,
                    assetsEquity: p.assetsEquity || 0, assetsDebt: p.assetsDebt || 0, assetsRealEstate: p.assetsRealEstate || 0, assetsGold: p.assetsGold || 0, assetsCash: p.assetsCash || 0,
                    goals: p.goals?.filter((g: any) => g.id !== 'retire') || [],
                    insuranceHealth: p.insuranceHealth || 'none',
                    insuranceTerm: p.insuranceTerm || 0,
                }));
            });
    }
  }, [user, loading, router]);

  // Recalculate Corpus dynamically if inputs change
  useEffect(() => {
      const total = inputs.assetsEquity + inputs.assetsDebt + inputs.assetsRealEstate + inputs.assetsGold + inputs.assetsCash;
      if (total !== inputs.currentCorpus) {
          setInputs(prev => ({ ...prev, currentCorpus: total }));
      }
  }, [inputs.assetsEquity, inputs.assetsDebt, inputs.assetsRealEstate, inputs.assetsGold, inputs.assetsCash]);

  const monthlySurplus = inputs.monthlyIncome - inputs.monthlyExpenses - inputs.monthlyEMIs;
  const blendedReturn = getBlendedReturn(inputs.equityRatio);
  const simData = useMemo(() => runSimulation(inputs, 0), [inputs]);
  const failPoint = simData.find(d => d.corpus < 0);
  const isSafe = !failPoint;
  const corpusAtRetire = simData.find(d => d.age === inputs.retirementAge)?.corpus || 0;
  const joyMoney = useMemo(() => isSafe ? calculateMaxJoyMoney(inputs) : 0, [inputs, isSafe]);
  
  const fireAge = useMemo(() => {
      const fireYear = simData.find(d => {
          const annualExp = (inputs.monthlyExpenses * 12) * Math.pow(1 + inputs.inflation/100, d.age - inputs.currentAge);
          return d.corpus > 25 * annualExp;
      });
      return (fireYear && isSafe) ? fireYear.age : null;
  }, [simData, isSafe, inputs]);

  const familyRunway = useMemo(() => {
      const totalAvailable = inputs.currentCorpus + inputs.insuranceTerm;
      const annualNeed = inputs.monthlyExpenses * 12;
      return calculateRunway(totalAvailable, annualNeed, inputs.inflation, 7); 
  }, [inputs]);

  const goalAnalysis = useMemo(() => {
      const totalGoalCostPV = inputs.goals.reduce((sum, g) => sum + g.cost, 0); 
      const retirePV = inputs.monthlyExpenses * 12 * 25; 
      const totalLiability = totalGoalCostPV + retirePV;

      return inputs.goals.map(g => {
          const years = g.age - inputs.currentAge;
          const fvCost = g.cost * Math.pow(1 + inputs.inflation/100, years);
          const share = g.cost / totalLiability;
          const allocatedNow = inputs.currentCorpus * share;
          const allocatedFuture = allocatedNow * Math.pow(1 + blendedReturn/100, years);
          const gap = fvCost - allocatedFuture;
          const sipNeeded = gap > 0 ? calculateGapSIP(gap, years, blendedReturn) : 0;
          return { ...g, years, fvCost, sipNeeded };
      }).sort((a,b) => a.age - b.age);
  }, [inputs, blendedReturn]);

  if (loading || !user) return <div className="min-h-screen pt-24 flex items-center justify-center bg-[#F9FAFB]">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen pb-12 bg-[#F9FAFB] font-sans text-stone-900 flex flex-col xl:flex-row box-border relative">
      
      {/* LEFT SIDEBAR (Inputs) */}
      <div className="order-last xl:order-first w-full xl:w-[320px] bg-white border-r border-stone-200 flex flex-col h-auto xl:h-[calc(100vh-80px)] xl:sticky xl:top-20 z-10 shadow-sm shrink-0">
        <div className="p-6 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
            <div>
                <h1 className="font-serif text-xl font-bold text-stone-900">Control Panel</h1>
                <p className="text-xs text-stone-500 mt-1">Live Simulation Engine</p>
            </div>
            <Link href="/dashboard/onboarding">
                <button className="p-2 rounded-full bg-stone-200 text-stone-600 hover:bg-stone-300">
                    <Edit className="w-4 h-4"/>
                </button>
            </Link>
        </div>
        <div className="overflow-y-auto flex-1 p-6 space-y-8 pb-20">
            <InputSection title="Profile">
                <InputRow label="Age" val={inputs.currentAge} set={(v: number) => setInputs({...inputs, currentAge: v})} />
                <InputRow label="Retire Age" val={inputs.retirementAge} set={(v: number) => setInputs({...inputs, retirementAge: v})} />
            </InputSection>
            <InputSection title="Cashflow">
                <InputRow label="Income" val={inputs.monthlyIncome} set={(v: number) => setInputs({...inputs, monthlyIncome: v})} />
                <InputRow label="Expenses" val={inputs.monthlyExpenses} set={(v: number) => setInputs({...inputs, monthlyExpenses: v})} />
                <InputRow label="EMIs" val={inputs.monthlyEMIs} set={(v: number) => setInputs({...inputs, monthlyEMIs: v})} />
                <InputRow label="Existing SIP" val={inputs.existingSIP} set={(v: number) => setInputs({...inputs, existingSIP: v})} />
            </InputSection>
            <InputSection title="Assets">
                <InputRow label="Equity" val={inputs.assetsEquity} set={(v: number) => setInputs({...inputs, assetsEquity: v})} />
                <InputRow label="Debt/PF" val={inputs.assetsDebt} set={(v: number) => setInputs({...inputs, assetsDebt: v})} />
                <InputRow label="Real Est." val={inputs.assetsRealEstate} set={(v: number) => setInputs({...inputs, assetsRealEstate: v})} />
                <InputRow label="Gold" val={inputs.assetsGold} set={(v: number) => setInputs({...inputs, assetsGold: v})} />
                <InputRow label="Cash" val={inputs.assetsCash} set={(v: number) => setInputs({...inputs, assetsCash: v})} />
                <div className="mt-2 text-right text-xs font-bold text-stone-500">Total: {formatIndianCurrency(inputs.currentCorpus)}</div>
            </InputSection>
        </div>
      </div>

      {/* CENTER MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8F9FA] h-full overflow-y-auto">
        
        <div className="px-6 py-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4 gap-4">
            <MetricCard label="Net Worth" value={formatIndianCurrency(inputs.currentCorpus, true)} sub="Your Starting Point" icon={<Wallet className="w-5 h-5 text-stone-400"/>} onClick={() => setActiveMathModal('networth')}/>
            <MetricCard label="Retirement Corpus" value={formatIndianCurrency(corpusAtRetire, true)} sub={`Projected at Age ${inputs.retirementAge}`} icon={<Leaf className="w-5 h-5 text-emerald-500"/>} onClick={() => setActiveMathModal('corpus')}/>
            <MetricCard label="Joy Money" value={joyMoney > 0 ? formatIndianCurrency(joyMoney) + "/mo" : "₹0"} sub="Safe Monthly Spend" color="text-purple-700" icon={<Heart className="w-5 h-5 text-purple-400"/>} onClick={() => setActiveMathModal('joy')}/>
            <MetricCard label="Status" value={isSafe ? "Secure" : "At Risk"} sub={isSafe ? "Plan Succeeds" : `Fails at Age ${failPoint?.age}`} color={isSafe ? "text-emerald-700" : "text-red-600"} icon={<ShieldAlert className={`w-5 h-5 ${isSafe ? "text-emerald-500" : "text-red-500"}`}/>} onClick={() => setActiveMathModal('status')}/>
        </div>

        <div className="px-6 pb-8">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 relative">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-stone-800 text-lg">Wealth Forecast</h3>
                </div>
                <div className="w-full h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={simData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                            <defs>
                                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={isSafe ? "#10b981" : "#ef4444"} stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor={isSafe ? "#10b981" : "#ef4444"} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis dataKey="age" tick={{fill: '#9ca3af', fontSize: 11}} tickLine={false} axisLine={false} />
                            <YAxis tickFormatter={(v) => formatIndianCurrency(v, true)} tick={{fill: '#9ca3af', fontSize: 11}} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="corpus" stroke={isSafe ? "#10b981" : "#ef4444"} strokeWidth={3} fill="url(#grad)" animationDuration={1000} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* Goal Planning */}
        <div className="px-6 pb-12">
            <h3 className="font-bold text-stone-800 text-lg mb-2">Goal Planning</h3>
            <div className="grid grid-cols-1 gap-4">
                {goalAnalysis.map((g, i) => (
                    <div key={i} className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-center gap-6">
                        <div className="flex-1 w-full flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center font-bold text-stone-600 text-lg">{i+1}</div>
                            <div>
                                <div className="font-bold text-stone-900 text-lg">{g.name}</div>
                                <div className="text-xs text-stone-500">Due Age {g.age}</div>
                            </div>
                        </div>
                        <div className="flex-1 w-full md:border-l md:pl-6 border-stone-100">
                            <div className="text-xs text-stone-400 font-bold uppercase">Target Value</div>
                            <div className="text-xl font-bold text-stone-800">{formatIndianCurrency(g.fvCost, true)}</div>
                        </div>
                        <div className="flex-1 w-full md:text-right">
                            <div className="text-xs text-stone-400 font-bold uppercase">SIP Required</div>
                            <div className={`text-xl font-bold ${g.sipNeeded === 0 ? "text-emerald-600" : "text-stone-800"}`}>
                                {g.sipNeeded === 0 ? "Funded" : formatIndianCurrency(g.sipNeeded)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* RIGHT PANEL: DIAGNOSIS */}
      <div className="w-full xl:w-[320px] bg-white border-l border-stone-200 overflow-y-auto p-6 shrink-0 order-2 xl:order-last">
         <h2 className="font-serif text-lg font-bold text-stone-900 mb-6 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-emerald-700"/> Diagnosis
         </h2>
         <div className="space-y-6">
            <DiagnosisCard title="Medical Risk" status={inputs.insuranceHealth === 'none' ? "CRITICAL" : "STABLE"} color={inputs.insuranceHealth === 'none' ? "red" : "emerald"} icon={<Heart className="w-4 h-4"/>} text={inputs.insuranceHealth === 'none' ? "Zero health cover. Major risk." : "Health cover active."}/>
            <DiagnosisCard title="Freedom Status" status={fireAge ? `FIRE @ ${fireAge}` : "WORK"} color={fireAge ? "purple" : "stone"} icon={<Flame className="w-4 h-4"/>} text={fireAge ? `You achieve freedom at age ${fireAge}.` : `You must work until ${inputs.retirementAge}.`}/>
         </div>
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {activeMathModal && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setActiveMathModal(null)}>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-stone-100" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg flex items-center gap-2"><Calculator className="w-5 h-5 text-emerald-600"/> Audit</h3>
                        <button onClick={() => setActiveMathModal(null)}><X className="w-6 h-6 text-stone-400 hover:text-stone-800 bg-stone-100 rounded-full p-1"/></button>
                    </div>
                    {/* Simplified for brevity - add logic back if needed */}
                    <p className="text-stone-600">Detailed breakdown logic goes here.</p>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- SUB-COMPONENTS ---
const MetricCard = ({ label, value, sub, color="text-stone-800", icon, onClick }: any) => (
    <div onClick={onClick} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm min-h-[160px] flex flex-col justify-between cursor-pointer hover:shadow-md transition-all group relative overflow-hidden">
        <div className="flex justify-between items-start gap-3">
            <div className="flex flex-col"><div className={`text-2xl lg:text-3xl font-bold ${color} break-words leading-tight`}>{value}</div><div className="text-sm font-medium text-stone-500 mt-2">{label}</div></div>
            <div className="p-2 bg-stone-50 rounded-lg text-stone-400 group-hover:bg-stone-100 group-hover:text-stone-600 transition-colors shrink-0">{icon}</div>
        </div>
        <div className="flex justify-between items-center mt-4 pt-3 border-t border-stone-50"><div className="text-xs text-stone-400 truncate max-w-[75%]">{sub}</div></div>
    </div>
);

const DiagnosisCard = ({ title, status, color, icon, text }: any) => { 
    const c:any={red:"bg-red-50 text-red-700 border-red-100", emerald:"bg-emerald-50 text-emerald-700 border-emerald-100", purple:"bg-purple-50 text-purple-700 border-purple-100", stone:"bg-stone-50 text-stone-700 border-stone-100"};
    return (<div className={`border p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow ${c[color] ? c[color].replace('text-', 'border-').split(' ')[2] : 'border-stone-100'}`}><div className="flex justify-between items-start mb-3"><div className="flex items-center gap-2 font-bold text-sm text-stone-800">{icon} {title}</div><span className={`text-[10px] px-2 py-1 rounded-full font-bold ${c[color]}`}>{status}</span></div><p className="text-xs text-stone-600 leading-relaxed">{text}</p></div>)
};

const InputSection = ({ title, children }: any) => (<div className="border-b border-stone-100 pb-4"><div className="font-bold text-xs uppercase text-stone-400 mb-3 tracking-wider">{title}</div><div className="space-y-3">{children}</div></div>);
const InputRow = ({ label, val, set }: any) => (<div className="flex justify-between items-center"><label className="text-xs font-medium text-stone-600">{label}</label><input type="number" className="w-24 p-1.5 bg-stone-50 border border-stone-200 rounded text-xs text-right font-bold text-stone-800 outline-none focus:border-stone-800 focus:ring-1 focus:ring-stone-200 transition-all" value={val} onChange={(e)=>set(Number(e.target.value))}/></div>);
const CustomTooltip = ({ active, payload, label }: any) => { 
    if (active && payload && payload.length) { 
        const data = payload[0].payload; 
        return (<div className="bg-white p-3 border border-stone-200 shadow-xl rounded-lg text-xs min-w-[200px]"><p className="font-bold text-stone-800 mb-1 border-b pb-1">Age {label}</p><div className="flex justify-between mb-1"><span className="text-stone-500">Corpus</span><span className="text-blue-600 font-bold">{formatIndianCurrency(data.corpus)}</span></div></div>); 
    } 
    return null; 
};