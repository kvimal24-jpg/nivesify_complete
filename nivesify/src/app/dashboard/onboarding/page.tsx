"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Check, Shield, Baby, Briefcase, Users, TrendingUp, Landmark,
  Stethoscope, Umbrella, AlertCircle, Map, Sparkles, Clock, PieChart,
  Banknote, Coins, Building2, LineChart, Plus, Wallet, Home, Car, Plane,
  GraduationCap, Target, Heart, X, ChevronRight, Info, Zap
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";

// ─────────────────────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────────────────────
const fmtINR = (num: number, compact = false) => {
  if (!num || isNaN(num)) return "₹0";
  if (compact) {
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(num);
};

const numberToWordsIndian = (num: number): string => {
  if (!num || num === 0) return "zero";
  const ones = ["zero","one","two","three","four","five","six","seven","eight","nine"];
  const teens = ["ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"];
  const tens = ["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"];
  const twoDigits = (n: number): string => {
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    return tens[Math.floor(n/10)] + (n%10 ? " " + ones[n%10] : "");
  };
  const parts: string[] = [];
  let n = Math.floor(Math.abs(num));
  if (n >= 10000000) { parts.push(`${numberToWordsIndian(Math.floor(n/10000000))} crore`); n %= 10000000; }
  if (n >= 100000)   { parts.push(`${numberToWordsIndian(Math.floor(n/100000))} lakh`); n %= 100000; }
  if (n >= 1000)     { parts.push(`${numberToWordsIndian(Math.floor(n/1000))} thousand`); n %= 1000; }
  if (n >= 100)      { parts.push(`${ones[Math.floor(n/100)]} hundred`); n %= 100; }
  if (n > 0)         { parts.push(twoDigits(n)); }
  return parts.join(" ").trim();
};

const inWords = (v?: number) => v && v > 0 ? `₹ ${numberToWordsIndian(v)}` : "";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
export type Goal = { id: string; name: string; age: number; cost: number; icon: string };

type OnboardingData = {
  age: number; retirementAge: number;
  maritalStatus: "single" | "married";
  childrenCount: number; childAges: number[];
  parentsDependent: boolean;
  monthlyIncome: number; monthlyExpenses: number; monthlyEMI: number; existingSIP: number;
  emergencyFund: number; insuranceTerm: number; insuranceHealth: "corporate" | "personal" | "none";
  assetsEquity: number; assetsDebt: number; assetsGold: number; assetsRealEstate: number; assetsCash: number;
  goals: Goal[];
};

// ─────────────────────────────────────────────────────────────────────────────
// STEPS CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 0, title: "The Protagonist", subtitle: "Your Timeline", icon: "👤", desc: "Financial planning isn't about money — it's about life. Your age, dependents, and timeline define every strategy." },
  { id: 1, title: "The Flow",        subtitle: "Cashflow & SIPs", icon: "💸", desc: "Income builds wealth, but how you spend defines how fast you get there. Existing SIPs are your current momentum." },
  { id: 2, title: "The Shield",      subtitle: "Risk Protection", icon: "🛡️", desc: "A great offense needs a better defense. One medical emergency without cover can wipe out years of saving." },
  { id: 3, title: "The Vault",       subtitle: "Assets & Net Worth", icon: "🏦", desc: "Equity, Gold, Real Estate — each asset plays a different role. We map it all so the simulation is accurate." },
  { id: 4, title: "The Dream",       subtitle: "Future Goals", icon: "✨", desc: "Money without purpose is just numbers. Tell us your milestones — we'll turn them into a monthly SIP plan." },
  { id: 5, title: "The Map",         subtitle: "Your Financial Picture", icon: "🗺️", desc: "Your personalised financial simulation is ready. Head to your dashboard to explore it." },
];

// ─────────────────────────────────────────────────────────────────────────────
// SHARED UI ATOMS
// ─────────────────────────────────────────────────────────────────────────────
const FriendlyInput = ({ label, sub, value, onChange, isCurrency = false, placeholder = "0" }: {
  label: string; sub?: string; value: number | undefined; onChange: (v: number) => void;
  isCurrency?: boolean; placeholder?: string;
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-bold text-stone-700">{label}</label>
    {sub && <span className="text-xs text-stone-400">{sub}</span>}
    <div className="relative">
      {isCurrency && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-lg z-10">₹</span>}
      <input
        type="number"
        value={value !== undefined && value !== 0 ? value : ""}
        onChange={e => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
        placeholder={placeholder}
        className={`w-full p-4 ${isCurrency ? "pl-9" : ""} text-xl bg-white border-2 border-stone-200 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none font-bold text-stone-900 transition-all placeholder-stone-300`}
      />
    </div>
    {isCurrency && value && value > 0 && (
      <div className="text-[11px] text-stone-400 ml-1">{inWords(value)}</div>
    )}
  </div>
);

const MinimalInput = ({ label, value, onChange, isCurrency = false }: any) => (
  <div className="flex flex-col gap-1">
    <div className="relative">
      {isCurrency && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold z-10">₹</span>}
      <input
        type="number"
        value={value !== undefined && value !== 0 ? value : ""}
        onChange={e => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
        placeholder="0"
        className={`w-full p-3 ${isCurrency ? "pl-7" : ""} text-base bg-white border-2 border-stone-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none font-bold text-stone-900 transition-all placeholder-stone-300`}
      />
    </div>
    {isCurrency && value > 0 && <div className="text-[10px] text-stone-400">{inWords(value)}</div>}
  </div>
);

const SelectChip = ({ options, value, onChange, label }: { options: { key: string; label: string; icon?: string }[]; value: string; onChange: (v: string) => void; label?: string }) => (
  <div>
    {label && <div className="text-sm font-bold text-stone-700 mb-2">{label}</div>}
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button key={opt.key} onClick={() => onChange(opt.key)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all ${value === opt.key ? "border-stone-900 bg-stone-900 text-white shadow-lg" : "border-stone-200 bg-white text-stone-500 hover:border-stone-300 hover:bg-stone-50"}`}>
          {opt.icon && <span>{opt.icon}</span>}{opt.label}
        </button>
      ))}
    </div>
  </div>
);

// Asset Donut — pure SVG
const AssetDonut = ({ equity, debt, gold, re, cash }: any) => {
  const segs = [
    { v: equity, c: "#10B981", l: "Equity" },
    { v: debt,   c: "#2563EB", l: "Debt/PF" },
    { v: re,     c: "#D97706", l: "Real Estate" },
    { v: gold,   c: "#FBBF24", l: "Gold" },
    { v: cash,   c: "#94A3B8", l: "Cash" },
  ].filter(s => s.v > 0);
  const total = segs.reduce((s, x) => s + x.v, 0);
  if (total === 0) return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-20 h-20 rounded-full border-4 border-dashed border-stone-200 flex items-center justify-center">
        <span className="text-[10px] text-stone-400 font-bold text-center">Enter assets</span>
      </div>
    </div>
  );
  const r = 30, cx = 40, cy = 40, stroke = 12;
  let cum = -Math.PI / 2;
  const arcs = segs.map(s => {
    const angle = (s.v / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(cum), y1 = cy + r * Math.sin(cum);
    cum += angle;
    const x2 = cx + r * Math.cos(cum), y2 = cy + r * Math.sin(cum);
    return { d: `M${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r},0,${angle > Math.PI ? 1 : 0},1,${x2.toFixed(1)},${y2.toFixed(1)}`, c: s.c, l: s.l, v: s.v, pct: Math.round((s.v / total) * 100) };
  });
  return (
    <div className="flex items-center gap-4">
      <svg width="80" height="80" viewBox="0 0 80 80" className="shrink-0">
        {arcs.map((a, i) => <path key={i} d={a.d} fill="none" stroke={a.c} strokeWidth={stroke} strokeLinecap="round" />)}
        <text x="40" y="44" textAnchor="middle" fontSize="9" fontWeight="800" fill="#0F172A" fontFamily="system-ui">{fmtINR(total, true)}</text>
      </svg>
      <div className="flex flex-col gap-1 flex-1">
        {arcs.map((a, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: a.c }} />
              <span className="text-[10px] text-stone-500">{a.l}</span>
            </div>
            <span className="text-[10px] font-bold text-stone-700">{a.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Live cashflow bar
const CashflowBar = ({ income, expenses, emi, sip }: any) => {
  const surplus = income - expenses - emi - sip;
  const pct = (v: number) => income > 0 ? Math.min(100, Math.round((v / income) * 100)) : 0;
  const bars = [
    { label: "Expenses", value: expenses, color: "#F87171", pct: pct(expenses) },
    { label: "EMIs", value: emi, color: "#FBBF24", pct: pct(emi) },
    { label: "SIPs", value: sip, color: "#2563EB", pct: pct(sip) },
  ];
  if (!income) return null;
  return (
    <div className="mt-4 p-4 bg-stone-50 rounded-2xl border border-stone-100 space-y-2">
      <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Live Cashflow Preview</div>
      <div className="flex h-3 rounded-full overflow-hidden bg-stone-200 w-full">
        {bars.map((b, i) => b.value > 0 && (
          <div key={i} className="h-full transition-all duration-500" style={{ width: `${b.pct}%`, background: b.color }} />
        ))}
        {surplus > 0 && <div className="h-full transition-all duration-500" style={{ width: `${pct(surplus)}%`, background: "#10B981" }} />}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {bars.filter(b => b.value > 0).map((b, i) => (
          <span key={i} className="flex items-center gap-1 text-[10px] text-stone-500">
            <span className="w-2 h-2 rounded-full" style={{ background: b.color }} />{b.label}: {fmtINR(b.value, true)}
          </span>
        ))}
        <span className={`flex items-center gap-1 text-[10px] font-bold ${surplus >= 0 ? "text-emerald-700" : "text-red-600"}`}>
          <span className="w-2 h-2 rounded-full" style={{ background: surplus >= 0 ? "#10B981" : "#EF4444" }} />
          {surplus >= 0 ? "Surplus" : "Deficit"}: {fmtINR(Math.abs(surplus), true)}/mo
        </span>
      </div>
    </div>
  );
};

// Insurance gap visualiser
const InsuranceGap = ({ income, insuranceTerm, expenses, lifeYears = 20 }: any) => {
  const recommended = income * 12 * 10;
  const familyNeed = expenses * 12 * lifeYears;
  const gap = Math.max(0, recommended - insuranceTerm);
  const coverage = recommended > 0 ? Math.min(100, Math.round((insuranceTerm / recommended) * 100)) : 0;
  if (!income) return null;
  return (
    <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-3">
      <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Term Cover Analysis</div>
      <div className="flex justify-between text-sm">
        <span className="text-stone-600">Recommended (10× income)</span>
        <span className="font-bold text-stone-800">{fmtINR(recommended, true)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-stone-600">Your cover</span>
        <span className={`font-bold ${insuranceTerm >= recommended ? "text-emerald-700" : "text-amber-600"}`}>{fmtINR(insuranceTerm, true)}</span>
      </div>
      <div className="h-2.5 bg-blue-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${coverage}%`, background: coverage >= 100 ? "#10B981" : coverage >= 50 ? "#F59E0B" : "#EF4444" }} />
      </div>
      {gap > 0 && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-xl p-2.5 border border-amber-100">
          <Info className="w-3.5 h-3.5 shrink-0" />
          Cover gap of <strong>{fmtINR(gap, true)}</strong>. Your family needs {lifeYears} years of support.
        </div>
      )}
      {gap <= 0 && <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 rounded-xl p-2.5 border border-emerald-100"><Check className="w-3.5 h-3.5" /> Excellent — your family is well protected.</div>}
    </div>
  );
};

// Emergency fund meter
const EmergencyMeter = ({ fund, expenses }: any) => {
  const months = expenses > 0 ? Math.round(fund / expenses) : 0;
  const pct = Math.min(100, (months / 6) * 100);
  const color = months >= 6 ? "#10B981" : months >= 3 ? "#F59E0B" : "#EF4444";
  const msg = months >= 6 ? "Well protected against income disruption" : months >= 3 ? "Getting there — target 6 months" : "Aim for 3–6 months of expenses";
  if (!expenses) return null;
  return (
    <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 space-y-2">
      <div className="flex justify-between items-center">
        <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Emergency Cover</div>
        <span className="text-xs font-black" style={{ color }}>{months} / 6 months</span>
      </div>
      <div className="h-2.5 bg-stone-200 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="text-[10px] text-stone-400">{msg}</div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
const StepLife = ({ data, setData }: any) => {
  const workingYears = data.retirementAge - data.age;
  return (
    <div className="space-y-6">
      {/* Timeline visual */}
      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl p-4 border border-emerald-100">
        <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">Your Timeline Preview</div>
        <div className="flex items-center gap-0">
          {/* Now */}
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-md">{data.age}</div>
            <div className="text-[9px] text-stone-500 mt-1 font-bold">Now</div>
          </div>
          {/* Working line */}
          <div className="flex-1 flex flex-col">
            <div className="h-2 bg-gradient-to-r from-emerald-400 to-emerald-300 rounded-full mx-1" />
            <div className="text-[9px] text-emerald-600 font-bold text-center mt-1">{workingYears}yr working</div>
          </div>
          {/* Retire */}
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black shadow-md">{data.retirementAge}</div>
            <div className="text-[9px] text-stone-500 mt-1 font-bold">Retire</div>
          </div>
          {/* Retired line */}
          <div className="flex-1 flex flex-col">
            <div className="h-2 bg-gradient-to-r from-blue-300 to-stone-200 rounded-full mx-1" />
            <div className="text-[9px] text-stone-500 font-bold text-center mt-1">{85 - data.retirementAge}yr retired</div>
          </div>
          {/* 85 */}
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-stone-400 text-white flex items-center justify-center text-xs font-black shadow-md">85</div>
            <div className="text-[9px] text-stone-500 mt-1 font-bold">Age 85</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FriendlyInput label="Current Age" sub="Your starting point" value={data.age} onChange={v => setData({ ...data, age: v })} />
        <FriendlyInput label="Retirement Age" sub="When you stop working" value={data.retirementAge} onChange={v => setData({ ...data, retirementAge: v })} />
      </div>

      {/* Children */}
      <div className="bg-stone-50 rounded-2xl border border-stone-100 p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">👶</span>
          <span className="font-bold text-stone-800 text-sm">Do you have children?</span>
        </div>
        <p className="text-xs text-stone-400 mb-4">We'll auto-create education milestones for each child.</p>
        <div className="flex gap-2 mb-4">
          {[0, 1, 2, 3].map(n => (
            <button key={n} onClick={() => {
              const ages = Array(n).fill(0).map((_: any, i: number) => data.childAges?.[i] ?? 0);
              setData({ ...data, childrenCount: n, childAges: ages });
            }} className={`w-11 h-11 rounded-xl border-2 font-black text-sm transition-all ${data.childrenCount === n ? "bg-stone-900 text-white border-stone-900" : "bg-white text-stone-400 border-stone-200 hover:border-stone-400"}`}>{n}</button>
          ))}
        </div>
        {data.childrenCount > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {data.childAges.map((age: number, idx: number) => (
              <div key={idx}>
                <div className="text-[10px] font-bold text-stone-400 uppercase mb-1">Child {idx + 1} age</div>
                <input type="number" value={age || ""} onChange={e => { const a = [...data.childAges]; a[idx] = Number(e.target.value); setData({ ...data, childAges: a }); }}
                  className="w-full p-3 bg-white border-2 border-stone-200 rounded-xl text-center font-black text-stone-900 outline-none focus:border-emerald-500 transition-all" placeholder="0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Parents */}
      <button onClick={() => setData({ ...data, parentsDependent: !data.parentsDependent })}
        className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${data.parentsDependent ? "border-emerald-500 bg-emerald-50/60" : "border-stone-100 bg-stone-50 hover:border-stone-300"}`}>
        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${data.parentsDependent ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-stone-300"}`}>
          {data.parentsDependent && <Check className="w-4 h-4" />}
        </div>
        <div className="text-left">
          <div className="font-bold text-stone-800 text-sm">Parents are financially dependent on me</div>
          <div className="text-xs text-stone-400 mt-0.5">We'll factor in dependent expenses in your plan</div>
        </div>
        <span className="ml-auto text-2xl">{data.parentsDependent ? "✓" : "👨‍👩‍👦"}</span>
      </button>
    </div>
  );
};

const StepCashflow = ({ data, setData }: any) => {
  const surplus = data.monthlyIncome - data.monthlyExpenses - data.monthlyEMI - data.existingSIP;
  const savingsRate = data.monthlyIncome > 0 ? Math.round(((data.existingSIP + Math.max(0, surplus)) / data.monthlyIncome) * 100) : 0;
  return (
    <div className="space-y-5">
      <FriendlyInput label="Monthly Take-Home Income" sub="After-tax amount credited to your bank" value={data.monthlyIncome} onChange={v => setData({ ...data, monthlyIncome: v })} isCurrency />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FriendlyInput label="Essential Expenses" sub="Groceries, bills, rent, lifestyle" value={data.monthlyExpenses} onChange={v => setData({ ...data, monthlyExpenses: v })} isCurrency />
        <FriendlyInput label="Loan EMIs" sub="All monthly loan repayments" value={data.monthlyEMI} onChange={v => setData({ ...data, monthlyEMI: v })} isCurrency />
      </div>
      <div className="bg-emerald-50/60 rounded-2xl border border-emerald-100 p-5">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-bold text-stone-800">Existing SIPs / Investments</span>
        </div>
        <p className="text-xs text-stone-400 mb-3">Total monthly investments already running</p>
        <FriendlyInput label="" value={data.existingSIP} onChange={v => setData({ ...data, existingSIP: v })} isCurrency />
      </div>
      {/* Live preview */}
      <CashflowBar income={data.monthlyIncome} expenses={data.monthlyExpenses} emi={data.monthlyEMI} sip={data.existingSIP} />
      {/* Savings rate callout */}
      {data.monthlyIncome > 0 && (
        <div className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold ${savingsRate >= 25 ? "bg-emerald-50 border-emerald-100 text-emerald-700" : savingsRate >= 15 ? "bg-amber-50 border-amber-100 text-amber-700" : "bg-red-50 border-red-100 text-red-600"}`}>
          <span>Savings rate</span>
          <span className="text-base font-black">{savingsRate}%
            <span className="text-xs font-normal ml-1">{savingsRate >= 25 ? "🎉 Excellent" : savingsRate >= 15 ? "· aim for 25%" : "· target 25%+"}</span>
          </span>
        </div>
      )}
    </div>
  );
};

const StepSafety = ({ data, setData }: any) => (
  <div className="space-y-5">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <FriendlyInput label="Emergency Fund" sub="Liquid cash / FD set aside" value={data.emergencyFund} onChange={v => setData({ ...data, emergencyFund: v })} isCurrency />
        <div className="mt-2">
          <EmergencyMeter fund={data.emergencyFund} expenses={data.monthlyExpenses} />
        </div>
      </div>
      <div>
        <FriendlyInput label="Term Insurance Cover" sub="Lump-sum your family receives" value={data.insuranceTerm} onChange={v => setData({ ...data, insuranceTerm: v })} isCurrency />
      </div>
    </div>

    {/* Insurance gap */}
    <InsuranceGap income={data.monthlyIncome} insuranceTerm={data.insuranceTerm} expenses={data.monthlyExpenses} />

    {/* Health insurance */}
    <div className="bg-stone-50 rounded-2xl border border-stone-100 p-5">
      <div className="flex items-center gap-2 mb-1">
        <Heart className="w-4 h-4 text-rose-500" />
        <span className="font-bold text-stone-800 text-sm">Health Insurance</span>
      </div>
      <p className="text-xs text-stone-400 mb-4">A single hospitalisation without cover costs ₹3–10L. Don't let it derail your plan.</p>
      <div className="grid grid-cols-3 gap-3">
        {[
          { key: "none",      label: "None",     emoji: "❌", sub: "High risk" },
          { key: "corporate", label: "Corporate", emoji: "🏢", sub: "Job-linked" },
          { key: "personal",  label: "Personal",  emoji: "✅", sub: "Best" },
        ].map(opt => (
          <button key={opt.key} onClick={() => setData({ ...data, insuranceHealth: opt.key })}
            className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all ${data.insuranceHealth === opt.key ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white text-stone-500 hover:bg-stone-50"}`}>
            <span className="text-xl">{opt.emoji}</span>
            <span className="text-xs font-bold">{opt.label}</span>
            <span className={`text-[9px] ${data.insuranceHealth === opt.key ? "text-stone-300" : "text-stone-400"}`}>{opt.sub}</span>
          </button>
        ))}
      </div>
      {data.insuranceHealth === "none" && (
        <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-100 text-xs text-red-700 flex items-center gap-2">
          <span>⚠️</span> Buy a family floater of ₹10–20L. Premiums start from ₹8,000/yr.
        </div>
      )}
      {data.insuranceHealth === "corporate" && (
        <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-700 flex items-center gap-2">
          <Info className="w-3.5 h-3.5 shrink-0" /> Cover ends if you change jobs. Consider a personal top-up plan.
        </div>
      )}
    </div>
  </div>
);

const StepAssets = ({ data, setData }: any) => {
  const total = (data.assetsEquity || 0) + (data.assetsDebt || 0) + (data.assetsGold || 0) + (data.assetsRealEstate || 0) + (data.assetsCash || 0);
  const eqRatio = total > 0 ? Math.round((data.assetsEquity / total) * 100) : 0;
  const assets = [
    { key: "assetsEquity",    label: "Equity / Mutual Funds",  sub: "MFs, stocks, PMS, ESOPs",      emoji: "📈", color: "emerald", field: "assetsEquity" },
    { key: "assetsDebt",      label: "Fixed Income",           sub: "EPF, PPF, FD, debt funds",      emoji: "🏛️", color: "blue",    field: "assetsDebt" },
    { key: "assetsGold",      label: "Gold",                   sub: "SGB, physical gold, ETFs",       emoji: "🥇", color: "yellow",  field: "assetsGold" },
    { key: "assetsRealEstate",label: "Real Estate",            sub: "Resale value of property/land", emoji: "🏠", color: "stone",   field: "assetsRealEstate" },
    { key: "assetsCash",      label: "Cash / Bank Balance",    sub: "Savings account, liquid funds",  emoji: "💵", color: "slate",   field: "assetsCash" },
  ];
  const colorMap: any = {
    emerald: "bg-emerald-50 border-emerald-100",
    blue: "bg-blue-50 border-blue-100",
    yellow: "bg-yellow-50 border-yellow-100",
    stone: "bg-stone-100 border-stone-200",
    slate: "bg-slate-50 border-slate-200",
  };
  return (
    <div className="space-y-4">
      <p className="text-xs text-stone-400">Use today's market/resale value — not purchase price. Accuracy here powers the simulation.</p>

      {/* Live donut preview */}
      {total > 0 && (
        <div className="bg-gradient-to-br from-stone-50 to-white rounded-2xl border border-stone-100 p-4">
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">Portfolio Mix · {fmtINR(total, true)}</div>
          <AssetDonut equity={data.assetsEquity} debt={data.assetsDebt} gold={data.assetsGold} re={data.assetsRealEstate} cash={data.assetsCash} />
          {eqRatio < 40 && total > 0 && (
            <div className="mt-3 text-[10px] text-amber-600 bg-amber-50 rounded-xl p-2 border border-amber-100">
              💡 Equity is {eqRatio}% of portfolio. For long-term wealth, target 50–70% in equity assets.
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {assets.map(a => (
          <div key={a.key} className={`p-4 rounded-2xl border ${colorMap[a.color]} space-y-2`}>
            <div className="flex items-center gap-2">
              <span className="text-xl">{a.emoji}</span>
              <div>
                <div className="font-bold text-stone-800 text-sm">{a.label}</div>
                <div className="text-[10px] text-stone-400">{a.sub}</div>
              </div>
            </div>
            <MinimalInput value={(data as any)[a.field]} onChange={(v: number) => setData({ ...data, [a.field]: v })} isCurrency />
          </div>
        ))}
      </div>
      {total > 0 && (
        <div className="flex justify-between items-center px-1 pt-1">
          <span className="text-xs text-stone-400 font-bold">Total Net Worth</span>
          <span className="text-base font-black text-stone-900">{fmtINR(total, true)}</span>
        </div>
      )}
    </div>
  );
};

const GOAL_TEMPLATES = [
  { name: "Home Purchase",   cost: 8000000, ageOffset: 5, icon: "🏠", iconKey: "home" },
  { name: "New Car",         cost: 1500000, ageOffset: 3, icon: "🚗", iconKey: "car" },
  { name: "World Tour",      cost: 500000,  ageOffset: 2, icon: "✈️", iconKey: "plane" },
  { name: "Wedding",         cost: 2500000, ageOffset: 7, icon: "💒", iconKey: "heart" },
  { name: "Child Education", cost: 3500000, ageOffset: 8, icon: "🎓", iconKey: "education" },
  { name: "Emergency Corpus",cost: 1000000, ageOffset: 1, icon: "🛡️", iconKey: "shield" },
];

const StepGoals = ({ data, setData }: any) => {
  const addGoal = (t: any) => {
    setData({ ...data, goals: [...data.goals, { id: Math.random().toString(36).slice(2), name: t.name, cost: t.cost, age: data.age + t.ageOffset, icon: t.iconKey }] });
  };
  const update = (idx: number, field: string, val: any) => {
    const g = [...data.goals]; (g[idx] as any)[field] = val; setData({ ...data, goals: g });
  };
  return (
    <div className="space-y-5">
      <div className="text-xs text-stone-400 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-emerald-500" /> Click to add a goal, then customise below.</div>
      {/* Quick add */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {GOAL_TEMPLATES.map((t, i) => {
          const already = data.goals.some((g: Goal) => g.name === t.name);
          return (
            <button key={i} onClick={() => !already && addGoal(t)}
              className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all text-center ${already ? "border-emerald-200 bg-emerald-50 opacity-60 cursor-default" : "border-stone-100 bg-white hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-sm"}`}>
              <span className="text-2xl">{t.icon}</span>
              <span className="text-[9px] font-bold text-stone-600 leading-tight">{t.name}</span>
              {already && <span className="text-[9px] text-emerald-600 font-bold">Added ✓</span>}
            </button>
          );
        })}
      </div>

      {/* Goal list */}
      {data.goals.length > 0 && (
        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
          {data.goals.map((g: Goal, idx: number) => {
            const years = Math.max(0, g.age - data.age);
            return (
              <div key={g.id} className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-xl shrink-0">{GOAL_TEMPLATES.find(t => t.iconKey === g.icon)?.icon ?? "🎯"}</div>
                  <div className="flex-1 min-w-0">
                    <input value={g.name} onChange={e => update(idx, "name", e.target.value)}
                      className="font-bold text-stone-900 w-full outline-none text-sm bg-transparent placeholder-stone-300 border-b border-transparent focus:border-emerald-300 pb-0.5 transition-all" placeholder="Goal name" />
                    <div className="flex flex-wrap gap-4 mt-2 text-xs text-stone-500">
                      <label className="flex items-center gap-1.5">
                        At age <input type="number" value={g.age} onChange={e => update(idx, "age", Number(e.target.value))}
                          className="w-12 bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 font-bold text-stone-800 outline-none focus:border-emerald-400 text-center" />
                        <span className="text-stone-400">({years}yr away)</span>
                      </label>
                      <label className="flex items-center gap-1.5">
                        Cost ₹<input type="number" value={g.cost || ""} onChange={e => update(idx, "cost", Number(e.target.value))}
                          className="w-24 bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 font-bold text-stone-800 outline-none focus:border-emerald-400" placeholder="0" />
                      </label>
                    </div>
                    {g.cost > 0 && <div className="text-[10px] text-stone-400 mt-1">{inWords(g.cost)}</div>}
                  </div>
                  <button onClick={() => setData({ ...data, goals: data.goals.filter((_: Goal, i: number) => i !== idx) })}
                    className="w-7 h-7 rounded-full bg-stone-100 hover:bg-red-100 hover:text-red-500 flex items-center justify-center text-stone-400 transition-all shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button onClick={() => setData({ ...data, goals: [...data.goals, { id: Math.random().toString(36).slice(2), name: "", age: data.age + 5, cost: 0, icon: "star" }] })}
        className="w-full py-3 border-2 border-dashed border-stone-200 rounded-2xl text-stone-400 font-bold text-sm hover:border-emerald-400 hover:text-emerald-600 transition-all flex items-center justify-center gap-2">
        <Plus className="w-4 h-4" /> Add Custom Goal
      </button>

      {/* Goal summary */}
      {data.goals.length > 0 && (
        <div className="bg-stone-50 rounded-2xl border border-stone-100 p-3 flex items-center justify-between">
          <span className="text-xs text-stone-500">{data.goals.length} goal{data.goals.length !== 1 ? "s" : ""} · Total today's cost</span>
          <span className="text-sm font-black text-stone-900">{fmtINR(data.goals.reduce((s: number, g: Goal) => s + g.cost, 0), true)}</span>
        </div>
      )}
    </div>
  );
};

const StepSummary = ({ data }: any) => {
  const total = (data.assetsEquity || 0) + (data.assetsDebt || 0) + (data.assetsGold || 0) + (data.assetsRealEstate || 0) + (data.assetsCash || 0);
  const surplus = data.monthlyIncome - data.monthlyExpenses - data.monthlyEMI;
  const workYears = data.retirementAge - data.age;
  const savingsRate = data.monthlyIncome > 0 ? Math.round((data.existingSIP / data.monthlyIncome) * 100) : 0;
  const healthScore = [
    surplus > 0, total > 0, data.emergencyFund >= data.monthlyExpenses * 3,
    data.insuranceHealth !== "none", data.insuranceTerm > 0, data.goals.length > 0,
  ].filter(Boolean).length;

  const cards = [
    { label: "Net Worth",    value: fmtINR(total, true),   color: "text-stone-900",   bg: "bg-white",       icon: "🏦", sub: "Your starting corpus" },
    { label: "Monthly Surplus", value: fmtINR(surplus, true), color: surplus >= 0 ? "text-emerald-700" : "text-red-600", bg: surplus >= 0 ? "bg-emerald-50" : "bg-red-50", icon: surplus >= 0 ? "💰" : "⚠️", sub: surplus >= 0 ? "Available to invest" : "Cashflow deficit" },
    { label: "Goals Mapped", value: `${data.goals.length}`,  color: "text-indigo-700",  bg: "bg-indigo-50",   icon: "🎯", sub: "Milestones defined" },
    { label: "Health Score", value: `${healthScore}/6`,       color: healthScore >= 5 ? "text-emerald-700" : healthScore >= 3 ? "text-amber-600" : "text-red-600", bg: "bg-white", icon: "❤️", sub: "Financial health checks" },
  ];

  const checks = [
    { label: "Positive cashflow",    ok: surplus > 0 },
    { label: "Net worth mapped",      ok: total > 0 },
    { label: "Emergency fund (3mo+)", ok: data.emergencyFund >= data.monthlyExpenses * 3 },
    { label: "Health insurance",      ok: data.insuranceHealth !== "none" },
    { label: "Term life cover",       ok: data.insuranceTerm > 0 },
    { label: "Goals defined",         ok: data.goals.length > 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="text-center py-2">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-200 mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-black text-stone-900">Your picture is clear.</h2>
        <p className="text-sm text-stone-500 mt-1">Age {data.age} → {data.retirementAge} · {workYears} working years ahead</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3">
        {cards.map((c, i) => (
          <div key={i} className={`${c.bg} rounded-2xl border border-stone-100 p-4 shadow-sm`}>
            <div className="text-2xl mb-1">{c.icon}</div>
            <div className={`text-xl font-black ${c.color}`}>{c.value}</div>
            <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wide mt-0.5">{c.label}</div>
            <div className="text-[10px] text-stone-300 mt-0.5">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Health checklist */}
      <div className="bg-stone-50 rounded-2xl border border-stone-100 p-4">
        <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">Financial Health Checklist</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {checks.map((c, i) => (
            <div key={i} className={`flex items-center gap-2 text-xs font-medium rounded-xl p-2 ${c.ok ? "text-emerald-700 bg-emerald-50" : "text-stone-400 bg-white border border-stone-100"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${c.ok ? "bg-emerald-200 text-emerald-700" : "bg-stone-100 text-stone-400"}`}>{c.ok ? "✓" : "○"}</span>
              {c.label}
            </div>
          ))}
        </div>
      </div>

      {/* Goals preview */}
      {data.goals.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Your Goals</div>
          <div className="flex flex-wrap gap-2">
            {data.goals.map((g: Goal, i: number) => (
              <div key={i} className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-xl px-3 py-1.5 shadow-sm">
                <span className="text-sm">{GOAL_TEMPLATES.find(t => t.iconKey === g.icon)?.icon ?? "🎯"}</span>
                <div>
                  <div className="text-xs font-bold text-stone-800">{g.name}</div>
                  <div className="text-[9px] text-stone-400">Age {g.age} · {fmtINR(g.cost, true)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-700">
        <ChevronRight className="w-4 h-4 shrink-0" />
        Click "Build My Dashboard" to run your full financial simulation
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { user, loading } = useUser();
  const router = useRouter();

  const [data, setData] = useState<OnboardingData>({
    age: 30, retirementAge: 60,
    maritalStatus: "married", childrenCount: 0, childAges: [], parentsDependent: false,
    monthlyIncome: 0, monthlyExpenses: 0, monthlyEMI: 0, existingSIP: 0,
    emergencyFund: 0, insuranceTerm: 0, insuranceHealth: "corporate",
    assetsEquity: 0, assetsDebt: 0, assetsGold: 0, assetsRealEstate: 0, assetsCash: 0,
    goals: [],
  });

  useEffect(() => {
    if (user) {
      fetch("/api/onboarding").then(r => r.json()).then(json => {
        if (json.data && Object.keys(json.data).length > 0) setData(prev => ({ ...prev, ...json.data }));
      });
    }
  }, [user]);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [step]);

  const validateStep = (s: number) => {
    setError(null);
    if (s === 0) {
      if (!data.age || data.age < 18) return "Please enter a valid age (18+).";
      if (!data.retirementAge || data.retirementAge <= data.age) return "Retirement age must be greater than current age.";
    }
    if (s === 1) {
      if (!data.monthlyIncome || data.monthlyIncome <= 0) return "Monthly income is required.";
    }
    return null;
  };

  const generateDefaultGoals = () => {
    const newGoals: Goal[] = [];
    data.childAges?.forEach((age, idx) => {
      const yrs = 18 - age;
      if (yrs > 0) newGoals.push({ id: `edu_${idx}`, name: `Child ${idx + 1} Education`, age: data.age + yrs, cost: 2500000, icon: "education" });
    });
    const existing = new Set(data.goals.map(g => g.id));
    setData(prev => ({ ...prev, goals: [...prev.goals, ...newGoals.filter(g => !existing.has(g.id))] }));
  };

  const handleNext = () => {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    if (step === 0) generateDefaultGoals();
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const handleFinish = async () => {
    await fetch("/api/onboarding", { method: "POST", body: JSON.stringify(data), headers: { "Content-Type": "application/json" } });
    router.push("/dashboard");
  };

  if (loading || !user) return (
    <div className="min-h-screen bg-[#F5F8FF] flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto animate-pulse">
          <Sparkles className="w-6 h-6 text-emerald-600" />
        </div>
        <p className="text-sm text-stone-500">Loading wizard…</p>
      </div>
    </div>
  );

  const progressPct = ((step) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-[#F5F8FF] font-sans flex items-start justify-center pt-6 sm:pt-10 px-3 sm:px-4 pb-12">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl shadow-stone-200/60 border border-stone-100 overflow-hidden flex flex-col lg:flex-row min-h-[640px]">

        {/* ── LEFT PANEL ── */}
        <div className="w-full lg:w-[340px] bg-[#0A2118] text-emerald-50 flex flex-col gap-0 relative overflow-hidden shrink-0">
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-800/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-700/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

          {/* Brand header */}
          <div className="px-6 pt-6 pb-4 border-b border-emerald-900/50 relative z-10">
            <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Nivesify</div>
            <div className="text-2xl font-black text-white">Financial Setup</div>
          </div>

          {/* Current step info */}
          <div className="px-6 py-5 relative z-10">
            <div className="text-4xl mb-3">{STEPS[step]?.icon}</div>
            <div className="text-xl font-black text-white mb-1">{STEPS[step]?.title}</div>
            <div className="text-[11px] text-emerald-400 font-bold uppercase tracking-widest mb-3">{STEPS[step]?.subtitle}</div>
            <p className="text-sm text-emerald-200/70 leading-relaxed">{STEPS[step]?.desc}</p>
          </div>

          {/* Step list — desktop only */}
          <div className="hidden lg:flex flex-col gap-1 px-4 py-2 relative z-10 flex-1">
            {STEPS.map((s, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${active ? "bg-emerald-800/60" : done ? "opacity-70" : "opacity-30"}`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 transition-all ${active ? "bg-emerald-400 text-emerald-900 shadow-md" : done ? "bg-emerald-700/60 text-emerald-300" : "bg-emerald-950/40 text-emerald-700"}`}>
                    {done ? <Check className="w-4 h-4" /> : <span>{s.icon}</span>}
                  </div>
                  <div>
                    <div className={`text-xs font-bold ${active ? "text-white" : done ? "text-emerald-400" : "text-emerald-700"}`}>{s.title}</div>
                    <div className={`text-[10px] ${active ? "text-emerald-300" : "text-emerald-800"}`}>{s.subtitle}</div>
                  </div>
                  {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                </div>
              );
            })}
          </div>

          {/* Progress bar — bottom */}
          <div className="px-6 pb-6 pt-4 relative z-10">
            <div className="flex justify-between text-[10px] text-emerald-500 mb-2">
              <span>Progress</span>
              <span className="font-bold">{step + 1} / {STEPS.length}</span>
            </div>
            <div className="h-1.5 bg-emerald-900/50 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Mobile step indicator */}
          <div className="lg:hidden px-5 pt-5 pb-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{STEPS[step]?.icon}</span>
                <div>
                  <div className="font-black text-stone-900 text-sm">{STEPS[step]?.title}</div>
                  <div className="text-[10px] text-stone-400">{STEPS[step]?.subtitle}</div>
                </div>
              </div>
              <div className="text-[10px] font-bold text-stone-400">{step + 1}/{STEPS.length}</div>
            </div>
            <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          {/* Step content */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-4 lg:py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25 }}
              >
                {step === 0 && <StepLife data={data} setData={setData} />}
                {step === 1 && <StepCashflow data={data} setData={setData} />}
                {step === 2 && <StepSafety data={data} setData={setData} />}
                {step === 3 && <StepAssets data={data} setData={setData} />}
                {step === 4 && <StepGoals data={data} setData={setData} />}
                {step === 5 && <StepSummary data={data} />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="mx-5 sm:mx-8 mb-3 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nav footer */}
          <div className="px-5 sm:px-8 py-5 border-t border-stone-100 flex justify-between items-center bg-stone-50/50">
            <button
              onClick={() => { setError(null); setStep(s => Math.max(0, s - 1)); }}
              disabled={step === 0}
              className={`text-stone-400 font-bold text-sm hover:text-stone-800 transition-all px-2 py-1 rounded-lg ${step === 0 ? "opacity-0 pointer-events-none" : ""}`}>
              ← Back
            </button>

            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <div key={i} className={`rounded-full transition-all duration-300 ${i === step ? "w-5 h-2 bg-stone-900" : i < step ? "w-2 h-2 bg-emerald-400" : "w-2 h-2 bg-stone-200"}`} />
              ))}
            </div>

            {step < 5 ? (
              <button onClick={handleNext}
                className="bg-stone-900 text-white px-5 py-2.5 sm:px-7 sm:py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-stone-800 transition-all shadow-lg shadow-stone-900/20 active:scale-95">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleFinish}
                className="bg-emerald-600 text-white px-5 py-2.5 sm:px-7 sm:py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/30 active:scale-95">
                Build My Dashboard <Sparkles className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}