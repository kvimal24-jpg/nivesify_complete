"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, Check, Shield, Baby, Briefcase, Users, TrendingUp, Landmark, 
  Stethoscope, Umbrella, AlertCircle, Map, Sparkles, Clock, PieChart, Banknote, Coins, Building2, LineChart, Plus, Wallet
} from "lucide-react";
import { useUser } from "@/hooks/useUser"; 
import { useRouter } from "next/navigation";

const formatIndianCurrency = (num: number, compact = false) => {
  if (num === undefined || num === null) return "₹0";
  if (compact) {
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)} L`;
  }
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
};

export type Goal = { id: string; name: string; age: number; cost: number; icon: string };

type OnboardingData = {
  age: number;
  retirementAge: number;
  maritalStatus: "single" | "married";
  childrenCount: number;
  childAges: number[];
  parentsDependent: boolean;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyEMI: number;
  existingSIP: number; 
  emergencyFund: number;
  insuranceTerm: number;
  insuranceHealth: "corporate" | "personal" | "none";
  assetsEquity: number;
  assetsDebt: number;
  assetsGold: number;
  assetsRealEstate: number; 
  assetsCash: number;
  goals: Goal[];
};

const STEPS = [
  { id: 0, title: "The Protagonist", subtitle: "Your Timeline", icon: <Users className="w-6 h-6"/> },
  { id: 1, title: "The Flow", subtitle: "Cashflow & SIPs", icon: <Briefcase className="w-6 h-6"/> },
  { id: 2, title: "The Shield", subtitle: "Risk Protection", icon: <Shield className="w-6 h-6"/> },
  { id: 3, title: "The Vault", subtitle: "Assets & Net Worth", icon: <Landmark className="w-6 h-6"/> },
  { id: 4, title: "The Dream", subtitle: "Future Goals", icon: <Sparkles className="w-6 h-6"/> },
  { id: 5, title: "The Map", subtitle: "Final Review", icon: <Map className="w-6 h-6"/> },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { user, loading } = useUser(); 
  const router = useRouter();
  
  const [data, setData] = useState<OnboardingData>({
    age: 30,
    retirementAge: 60,
    maritalStatus: "married",
    childrenCount: 0,
    childAges: [],
    parentsDependent: false,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    monthlyEMI: 0,
    existingSIP: 0,
    emergencyFund: 0,
    insuranceTerm: 0,
    insuranceHealth: "corporate",
    assetsEquity: 0,
    assetsDebt: 0,
    assetsGold: 0,
    assetsRealEstate: 0,
    assetsCash: 0,
    goals: [], 
  });

  useEffect(() => {
    if (user) {
      fetch('/api/onboarding')
        .then(res => res.json())
        .then(json => {
          if (json.data && Object.keys(json.data).length > 0) {
            // Merge with defaults to prevent undefined errors
            setData(prev => ({ ...prev, ...json.data }));
          }
        });
    }
  }, [user]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const validateStep = (currentStep: number) => {
    setError(null);
    if (currentStep === 0) {
        // Ensure values exist (not undefined)
        if (!data.age || data.age < 18) return "Please enter a valid age (18+).";
        if (!data.retirementAge || data.retirementAge <= data.age) return "Retirement age must be greater than current age.";
    }
    if (currentStep === 1) {
        // Explicit checks for undefined or null, allowing 0 if logical (though income 0 is odd)
        if (data.monthlyIncome === undefined || data.monthlyIncome <= 0) return "Monthly Income is required.";
        if (data.monthlyExpenses === undefined || data.monthlyExpenses < 0) return "Valid expenses are required.";
    }
    return null;
  };

  const generateDefaultGoals = () => {
    const newGoals: Goal[] = [];
    if(data.childAges && data.childAges.length > 0) {
        data.childAges.forEach((age, idx) => {
            const yearsToCollege = 18 - age;
            if (yearsToCollege > 0) {
                newGoals.push({
                    id: `edu_${idx}`,
                    name: `Child ${idx + 1} Education`,
                    age: data.age + yearsToCollege, 
                    cost: 2500000, 
                    icon: "education"
                });
            }
        });
    }
    const existingIds = new Set(data.goals.map(g => g.id));
    const finalGoals = [...data.goals, ...newGoals.filter(g => !existingIds.has(g.id))];
    setData(prev => ({ ...prev, goals: finalGoals }));
  };

  const handleNext = () => {
    const validationError = validateStep(step);
    if (validationError) {
        setError(validationError);
        return;
    }
    if (step === 0) generateDefaultGoals();
    setStep(prev => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleFinish = async () => {
    await fetch('/api/onboarding', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    router.push("/dashboard"); 
  };

  if (loading || !user) return <div className="p-20 text-center">Loading Wizard...</div>;

  return (
    <div className="min-h-screen bg-[#FDFBF7] pt-10 px-4 pb-12 font-sans flex items-center justify-center">
      <div className="w-full max-w-6xl bg-white rounded-[2rem] shadow-2xl shadow-stone-200/50 overflow-hidden flex flex-col lg:flex-row min-h-[650px] border border-stone-100">
        
        {/* LEFT PANEL */}
        <div className="w-full lg:w-[35%] bg-emerald-900 text-emerald-50 border-r border-emerald-800 p-6 lg:p-12 flex flex-col gap-8 lg:gap-12 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-800/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
             <div className="relative z-10">
                <div className="lg:hidden text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2">Step {step + 1} of {STEPS.length}</div>
                <h1 className="text-2xl lg:text-4xl font-serif text-white mb-2 lg:mb-6 leading-tight">{STEPS[step]?.title || "Review"}</h1>
                <p className="hidden lg:block text-emerald-200/80 text-sm leading-relaxed font-medium">
                    {step === 0 && "Financial planning isn't about money; it's about life. Your age, dependents, and timeline define your strategy."}
                    {step === 1 && "Income builds wealth, but lifestyle expenses define how fast you can run. Existing SIPs are your current speed."}
                    {step === 2 && "A good offense needs a better defense. We ensure a single shock event doesn't derail your journey."}
                    {step === 3 && "Real Estate, Gold, Equity - we map it all. Each asset class plays a different role in your future."}
                    {step === 4 && "Money has no value unless it serves a purpose. Let's define the milestones that matter to you."}
                    {step === 5 && "We have crunched the numbers. Your personalized financial simulation is ready."}
                </p>
             </div>
             <div className="hidden lg:block space-y-5 relative z-10">
                {STEPS.map((s, i) => (
                    <div key={i} className={`flex items-center gap-4 transition-all duration-500 ${i === step ? "opacity-100 translate-x-2" : "opacity-40"}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${i === step ? "bg-emerald-100 text-emerald-800 shadow-lg" : "bg-emerald-950/30 text-emerald-800"}`}>{i < step ? <Check className="w-5 h-5" /> : s.icon}</div>
                        <div><div className={`text-xs uppercase tracking-wider font-bold ${i === step ? "text-white" : "text-emerald-300"}`}>{s.title}</div></div>
                    </div>
                ))}
             </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-full lg:w-[65%] bg-white p-6 lg:p-12 relative flex flex-col">
            <div className="flex-1 py-4 lg:py-0">
                <AnimatePresence mode="wait">
                    <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="h-full flex flex-col justify-center">
                        {step === 0 && <StepLife data={data} setData={setData} />}
                        {step === 1 && <StepCashflow data={data} setData={setData} />}
                        {step === 2 && <StepSafety data={data} setData={setData} />}
                        {step === 3 && <StepAssets data={data} setData={setData} />}
                        {step === 4 && <StepGoals data={data} setData={setData} />}
                        {step === 5 && <StepSummary data={data} />}
                    </motion.div>
                </AnimatePresence>
            </div>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-700 text-sm animate-in slide-in-from-top-2"><AlertCircle className="w-4 h-4" /> {error}</div>}
            <div className="mt-4 pt-6 border-t border-stone-100 flex justify-between items-center">
                <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} className={`text-stone-400 font-bold text-sm hover:text-stone-800 transition-opacity ${step === 0 ? "opacity-0 pointer-events-none" : "opacity-100"}`}>Back</button>
                {step < 5 ? (
                    <button onClick={handleNext} className="bg-stone-900 text-white px-6 py-3 lg:px-8 lg:py-3.5 rounded-xl flex items-center gap-2 hover:bg-stone-800 transition-all shadow-xl shadow-stone-200 font-medium">Continue <ArrowRight className="w-4 h-4" /></button>
                ) : (
                    <button onClick={handleFinish} className="bg-emerald-600 text-white px-6 py-3 lg:px-8 lg:py-3.5 rounded-xl flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 font-bold tracking-wide">Reveal Map <Sparkles className="w-4 h-4" /></button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}

const StepLife = ({ data, setData }: any) => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
        <div className="grid grid-cols-2 gap-6">
            <FriendlyInput label="Current Age" icon={<Clock className="w-4 h-4"/>} value={data.age} onChange={(v:number) => setData({...data, age: v})} />
            <FriendlyInput label="Retirement Age" icon={<Briefcase className="w-4 h-4"/>} value={data.retirementAge} onChange={(v:number) => setData({...data, retirementAge: v})} />
        </div>
        <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
            <label className="text-sm font-bold text-stone-700 flex items-center gap-2 mb-4"><Baby className="w-5 h-5 text-emerald-600" /> Do you have children?</label>
            <div className="flex gap-3 mb-4">{[0, 1, 2, 3].map(num => (<button key={num} onClick={() => { const newAges = Array(num).fill(0).map((_, i) => (data.childAges && data.childAges[i]) || 0); setData({...data, childrenCount: num, childAges: newAges}); }} className={`w-12 h-12 rounded-xl border-2 font-bold text-lg transition-all ${data.childrenCount === num ? "bg-stone-800 text-white border-stone-800" : "bg-white text-stone-400 border-stone-200"}`}>{num}</button>))}</div>
            {data.childrenCount > 0 && (<div className="grid grid-cols-3 gap-4">{data.childAges.map((age: number, idx: number) => (<div key={idx}><div className="text-[10px] uppercase font-bold text-stone-400 mb-1">Child {idx+1} Age</div><input type="number" value={age !== undefined ? age : ''} onChange={(e) => { const newAges = [...data.childAges]; newAges[idx] = Number(e.target.value); setData({...data, childAges: newAges}); }} className="w-full p-3 bg-white border border-stone-200 rounded-lg text-center font-bold text-stone-800 outline-emerald-500" /></div>))}</div>)}
        </div>
        <button onClick={() => setData({...data, parentsDependent: !data.parentsDependent})} className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${data.parentsDependent ? "border-emerald-500 bg-emerald-50/50" : "border-stone-100 bg-stone-50"}`}><div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${data.parentsDependent ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-stone-300"}`}>{data.parentsDependent && <Check className="w-4 h-4" />}</div><div className="text-left"><div className="font-bold text-stone-700">Financial Dependents</div><div className="text-xs text-stone-500">My parents rely on me financially</div></div></button>
    </div>
);

const StepCashflow = ({ data, setData }: any) => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
        <FriendlyInput label="Monthly Take Home" icon={<Wallet className="w-4 h-4"/>} value={data.monthlyIncome} onChange={(v:number) => setData({...data, monthlyIncome: v})} isCurrency />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FriendlyInput label="Essential Expenses" icon={<PieChart className="w-4 h-4"/>} sub="(Groceries, Bills, Rent)" value={data.monthlyExpenses} onChange={(v:number) => setData({...data, monthlyExpenses: v})} isCurrency />
            <FriendlyInput label="Total EMIs" icon={<Banknote className="w-4 h-4"/>} sub="(Home, Car, Personal)" value={data.monthlyEMI} onChange={(v:number) => setData({...data, monthlyEMI: v})} isCurrency />
        </div>
        <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
            <FriendlyInput label="Existing SIPs" icon={<LineChart className="w-4 h-4 text-emerald-700"/>} sub="(Total Monthly Investment)" value={data.existingSIP} onChange={(v:number) => setData({...data, existingSIP: v})} isCurrency />
        </div>
    </div>
);

const StepSafety = ({ data, setData }: any) => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <FriendlyInput label="Emergency Fund" icon={<Shield className="w-4 h-4"/>} sub="(Cash in Bank/FD)" value={data.emergencyFund} onChange={(v:number) => setData({...data, emergencyFund: v})} isCurrency />
             <FriendlyInput label="Term Insurance" icon={<Umbrella className="w-4 h-4"/>} sub="(Death Benefit Amount)" value={data.insuranceTerm} onChange={(v:number) => setData({...data, insuranceTerm: v})} isCurrency />
        </div>
        <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
            <label className="text-sm font-bold text-stone-700 flex items-center gap-2 mb-4"><Stethoscope className="w-5 h-5 text-rose-500" /> Health Insurance</label>
            <div className="grid grid-cols-3 gap-3">{['corporate', 'personal', 'none'].map((opt) => (<button key={opt} onClick={() => setData({...data, insuranceHealth: opt})} className={`p-3 rounded-xl border-2 text-sm font-bold capitalize transition-all ${data.insuranceHealth === opt ? "border-stone-800 bg-stone-800 text-white" : "border-stone-200 bg-white text-stone-500 hover:bg-stone-50"}`}>{opt}</button>))}</div>
        </div>
    </div>
);

const StepAssets = ({ data, setData }: any) => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-emerald-50/50 border border-emerald-100 rounded-2xl"><div className="flex items-center gap-2 mb-3"><TrendingUp className="w-5 h-5 text-emerald-700" /><span className="font-bold text-stone-800">Equity</span></div><FriendlyInput label="Value" icon={<TrendingUp className="w-4 h-4 hidden"/>} sub="(MFs, Stocks, PMS)" value={data.assetsEquity} onChange={(v:number) => setData({...data, assetsEquity: v})} isCurrency minimal /></div>
            <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl"><div className="flex items-center gap-2 mb-3"><Landmark className="w-5 h-5 text-blue-700" /><span className="font-bold text-stone-800">Fixed Income</span></div><FriendlyInput label="Value" icon={<Landmark className="w-4 h-4 hidden"/>} sub="(EPF, PPF, FD)" value={data.assetsDebt} onChange={(v:number) => setData({...data, assetsDebt: v})} isCurrency minimal /></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-yellow-50/50 border border-yellow-100 rounded-2xl"><div className="flex items-center gap-2 mb-3"><Coins className="w-5 h-5 text-yellow-700" /><span className="font-bold text-stone-800">Gold</span></div><FriendlyInput label="Value" icon={<Coins className="w-4 h-4 hidden"/>} sub="(SGB, Physical)" value={data.assetsGold} onChange={(v:number) => setData({...data, assetsGold: v})} isCurrency minimal /></div>
            <div className="p-5 bg-stone-100/50 border border-stone-200 rounded-2xl"><div className="flex items-center gap-2 mb-3"><Building2 className="w-5 h-5 text-stone-600" /><span className="font-bold text-stone-800">Real Estate</span></div><FriendlyInput label="Value" icon={<Building2 className="w-4 h-4 hidden"/>} sub="(Commercial/Plots)" value={data.assetsRealEstate} onChange={(v:number) => setData({...data, assetsRealEstate: v})} isCurrency minimal /></div>
        </div>
        <div className="p-5 bg-stone-50 border border-stone-200 rounded-2xl"><div className="flex items-center gap-2 mb-3"><Banknote className="w-5 h-5 text-stone-600" /><span className="font-bold text-stone-800">Cash / Bank</span></div><FriendlyInput label="Value" icon={<Banknote className="w-4 h-4 hidden"/>} sub="(Savings Account)" value={data.assetsCash} onChange={(v:number) => setData({...data, assetsCash: v})} isCurrency minimal /></div>
    </div>
);

const StepGoals = ({ data, setData }: any) => {
    const QUICK_GOALS = [
        { name: "Home Purchase", cost: 8000000, ageOffset: 5, icon: "home" },
        { name: "New Car", cost: 1500000, ageOffset: 3, icon: "car" },
        { name: "World Tour", cost: 500000, ageOffset: 2, icon: "plane" },
        { name: "Wedding", cost: 2500000, ageOffset: 7, icon: "heart" },
    ];
    const addGoal = (template: any) => {
        const newGoal: Goal = { id: Math.random().toString(), name: template.name, cost: template.cost, age: data.age + template.ageOffset, icon: template.icon };
        setData({...data, goals: [...data.goals, newGoal]});
    };
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {QUICK_GOALS.map((t, i) => (
                    <button key={i} onClick={() => addGoal(t)} className="flex flex-col items-center justify-center p-4 bg-stone-50 hover:bg-white hover:shadow-md border border-stone-100 rounded-xl transition-all group">
                        <span className="text-xs font-bold text-stone-600 mt-2">{t.name}</span>
                    </button>
                ))}
            </div>
            <div className="space-y-3 mt-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {data.goals.map((goal: Goal, idx: number) => (
                    <div key={idx} className="flex gap-4 p-4 bg-white border border-stone-200 rounded-xl shadow-sm items-center group">
                        <div className="flex-1">
                            <input value={goal.name} onChange={(e) => { const n = [...data.goals]; n[idx].name = e.target.value; setData({...data, goals: n}); }} className="font-bold text-stone-800 w-full outline-none text-lg placeholder-stone-300" placeholder="Goal Name" />
                            <div className="flex gap-6 mt-1 text-sm text-stone-500">
                                <label className="flex items-center gap-2">At Age: <input type="number" value={goal.age} onChange={(e) => { const n = [...data.goals]; n[idx].age = Number(e.target.value); setData({...data, goals: n}); }} className="w-12 bg-stone-50 border border-stone-200 rounded px-1 font-bold text-stone-800"/></label>
                                <label className="flex items-center gap-2">Cost: <input type="number" value={goal.cost} onChange={(e) => { const n = [...data.goals]; n[idx].cost = Number(e.target.value); setData({...data, goals: n}); }} className="w-24 bg-stone-50 border border-stone-200 rounded px-1 font-bold text-stone-800"/></label>
                            </div>
                        </div>
                        <button onClick={() => setData({...data, goals: data.goals.filter((_:any, i:number) => i !== idx)})} className="w-8 h-8 flex items-center justify-center text-stone-300 hover:text-red-500 rounded-full">×</button>
                    </div>
                ))}
            </div>
            <button onClick={() => setData({...data, goals: [...data.goals, { id: Math.random().toString(), name: "", age: data.age+5, cost: 0, icon: 'star' }]})} className="w-full py-3 border-2 border-dashed border-stone-300 rounded-xl text-stone-400 font-bold hover:border-emerald-500 hover:text-emerald-600 transition-all flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add Another Goal</button>
        </div>
    );
};

const StepSummary = ({ data }: any) => {
    const totalAssets = (data.assetsEquity || 0) + (data.assetsDebt || 0) + (data.assetsGold || 0) + (data.assetsRealEstate || 0) + (data.assetsCash || 0);
    const surplus = data.monthlyIncome - data.monthlyExpenses - data.monthlyEMI;
    return (
        <div className="text-center space-y-8 py-8 animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-700 shadow-xl shadow-emerald-100 mb-6"><Sparkles className="w-12 h-12" /></div>
            <div><h2 className="text-3xl font-serif text-stone-900 mb-2">The picture is clear.</h2><p className="text-stone-500 max-w-md mx-auto">We have mapped your journey from Age {data.age} to {data.retirementAge}.</p></div>
            <div className="grid grid-cols-3 gap-4 border-t border-b border-stone-100 py-6">
                <div><div className="text-xs text-stone-400 uppercase font-bold mb-1">Net Worth</div><div className="font-bold text-xl text-stone-800">{formatIndianCurrency(totalAssets, true)}</div></div>
                <div><div className="text-xs text-stone-400 uppercase font-bold mb-1">Total Surplus</div><div className="font-bold text-xl text-emerald-600">{formatIndianCurrency(surplus, true)}</div></div>
                <div><div className="text-xs text-stone-400 uppercase font-bold mb-1">Goals</div><div className="font-bold text-xl text-stone-800">{data.goals.length}</div></div>
            </div>
        </div>
    );
};

const FriendlyInput = ({ label, sub, value, onChange, isCurrency, minimal = false, icon }: any) => (
    <div className="flex flex-col gap-2">
        <label className={`text-sm font-bold text-stone-700 flex justify-between items-end ${minimal ? 'hidden' : ''}`}><span className="flex items-center gap-2">{icon && <span className="text-stone-400">{icon}</span>}{label}</span></label>
        {!minimal && sub && <span className="text-xs text-stone-400 -mt-1 ml-1">{sub}</span>}
        <div className="relative group">
            {isCurrency && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-medium z-10">₹</span>}
            <input 
                type="number" 
                value={value !== undefined ? value : ''} 
                onChange={(e) => {
                    const val = e.target.value === '' ? undefined : Number(e.target.value);
                    onChange(val);
                }} 
                className={`w-full ${minimal ? 'p-3 text-lg' : 'p-4 text-xl'} bg-white border-2 border-stone-200 rounded-xl focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none font-bold text-stone-900 transition-all placeholder-stone-300 ${isCurrency ? 'pl-8' : ''}`} 
                placeholder="0" 
            />
        </div>
    </div>
);