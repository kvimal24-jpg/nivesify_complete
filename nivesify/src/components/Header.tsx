"use client";

import Link from "next/link";
import { useUser } from "@/hooks/useUser";

export default function Header() {
  const { user, loading } = useUser();

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#F6F8F7] border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <img
            src="/logo.png"
            alt="Nivesify"
            className="h-12 w-auto object-contain"
          />
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-10 font-serif text-sm text-gray-700">
          <span className="cursor-default hover:text-gray-900 transition">Philosophy</span>
          <Link href="/dashboard" className="hover:text-gray-900 transition">Dashboard</Link>
          <span className="cursor-default hover:text-gray-900 transition">Fund Analysis</span>
          <span className="cursor-default hover:text-gray-900 transition">Calculators</span>
        </nav>

        {/* Authentication Buttons */}
        <div className="flex items-center gap-4">
          {loading ? (
             // Loading skeleton
             <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
          ) : user ? (
            <>
              {user.picture && (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-gray-300"
                />
              )}
              <span className="font-serif text-sm text-gray-700 hidden sm:block">
                {user.name}
              </span>
              <a
                href="/api/auth/logout"
                className="px-6 py-2 rounded-full bg-[#1F2937] text-white font-serif text-sm hover:shadow-md transition"
              >
                Sign out
              </a>
            </>
          ) : (
            <a
              href="/api/auth/google"
              className="px-6 py-2 rounded-full bg-[#1F2937] text-white font-serif text-sm hover:shadow-md transition"
            >
              Sign in with Google
            </a>
          )}
        </div>
      </div>
    </header>
  );
}