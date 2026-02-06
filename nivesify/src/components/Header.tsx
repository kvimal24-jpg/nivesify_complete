"use client";

import { useState } from "react";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { Menu, X } from "lucide-react"; // Make sure to import icons

export default function Header() {
  const { user, loading } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const NAV_LINKS = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Mutual Fund Portfolio", href: "/dashboard/health-check" },
    { name: "Active Funds", href: "/dashboard/active-funds" },
    { name: "Index Funds", href: "/dashboard/index-funds" },
    { name: "Calculators", href: "/dashboard/calculators" },
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#F6F8F7] border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center z-50">
          <img
            src="/logo.png"
            alt="Nivesify"
            className="h-10 w-auto object-contain"
          />
        </Link>

        {/* DESKTOP Navigation (Hidden on Mobile) */}
        <nav className="hidden lg:flex items-center gap-8 font-serif text-sm text-gray-700">
          {NAV_LINKS.map((link) => (
            <Link 
              key={link.name} 
              href={link.href} 
              className="hover:text-emerald-700 hover:underline underline-offset-4 transition-all"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Auth Buttons & Mobile Toggle */}
        <div className="flex items-center gap-4 z-50">
          {/* Auth State */}
          {!loading && (
            user ? (
              <div className="flex items-center gap-3">
                 <img src={user.picture} alt="Avatar" className="w-8 h-8 rounded-full border border-gray-200 hidden sm:block" />
                 <a href="/api/auth/logout" className="text-sm font-medium text-gray-600 hover:text-black">Sign Out</a>
              </div>
            ) : (
              <a href="/api/auth/google" className="px-5 py-2 rounded-full bg-[#1F2937] text-white text-xs font-bold hover:shadow-lg transition">
                Sign In
              </a>
            )
          )}

          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden p-2 text-gray-600"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU OVERLAY */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-[#F6F8F7] z-40 flex flex-col pt-24 px-6 gap-6 lg:hidden animate-in slide-in-from-top-10">
          {NAV_LINKS.map((link) => (
            <Link 
              key={link.name} 
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-2xl font-serif text-gray-800 py-2 border-b border-gray-200"
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}