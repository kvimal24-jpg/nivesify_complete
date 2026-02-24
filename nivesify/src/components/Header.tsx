"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/hooks/useUser";

/* ─────────────────────────────────────────────────────────────────────────
   HEADER — Editorial Finance theme
   Light cream (#FAF9F6) background, Fraunces logo, DM Sans nav
   Mega-dropdown for MF World, mobile full-screen drawer
   Matches: dark ink, --green accent, border #E4E0D8
────────────────────────────────────────────────────────────────────────── */

const NAV = [
  {
    label: "Dashboard",
    href: "/dashboard",
    sub: null,
  },
  {
    label: "MF World",
    href: "/mutual-fund-match",
    sub: [
      { icon: "📖", label: "Why Mutual Funds?",    href: "/why-mutual-fund",           desc: "Basics, myths & the Iron-Clad Framework" },
      { icon: "🗺️", label: "Smart Fund Finder",    href: "/mutual-fund-match",         desc: "Match funds to your goals & risk profile" },
      { icon: "📊", label: "MF Industry Analysis", href: "/mutual-fund-analysis",      desc: "Market-wide fund performance & categories" },
      { icon: "⚡", label: "Active Funds",          href: "/active-funds",              desc: "Alpha, IR & composite scoring explorer" },
      { icon: "📈", label: "Index Funds",           href: "/index-funds",               desc: "Tracking difference, benchmark fit & cost" },
      { icon: "🎯", label: "Quick Picks",           href: "/find-my-fund-quick-picks",  desc: "Instant fund picks based on your input" },
      { icon: "🏗️", label: "Lifetime Plan",         href: "/find-my-fund-lifetime-plan",desc: "Multi-phase allocation for long-term goals" },
    ],
  },
  {
    label: "Health Check",
    href: "/mutual-fund-health-check",
    sub: [
      { icon: "🏥", label: "Portfolio Health",  href: "/mutual-fund-health-check/dashboard",    desc: "XIRR, alpha & fund-level signals" },
      { icon: "📋", label: "My Portfolio",       href: "/mutual-fund-health-check/portfolio",    desc: "Holdings, allocations & fund details" },
      { icon: "🔄", label: "Transactions",       href: "/mutual-fund-health-check/transactions", desc: "CAS transaction history & cashflow" },
    ],
  },
  {
    label: "Calculators",
    href: "/dashboard/calculators",
    sub: null,
  },
  {
    label: "About",
    href: "/about",
    sub: null,
  },
];

export default function Header() {
  const { user, loading } = useUser();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* scroll shadow */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  /* close dropdown on outside click */
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setActiveDropdown(null);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  /* lock body scroll when mobile open */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const openDropdown = (label: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveDropdown(label);
  };
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setActiveDropdown(null), 120);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;0,9..144,900;1,9..144,300&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .hdr-link {
          position: relative; font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 13.5px; font-weight: 600; color: #3D4451;
          text-decoration: none; padding: 6px 2px; transition: color .18s;
          display: flex; align-items: center; gap: 4px; white-space: nowrap;
        }
        .hdr-link::after {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0;
          height: 2px; background: #00C97B; border-radius: 2px;
          transform: scaleX(0); transform-origin: left;
          transition: transform .22s ease;
        }
        .hdr-link:hover { color: #0B0F1A; }
        .hdr-link:hover::after, .hdr-link.active::after { transform: scaleX(1); }
        .hdr-link.active { color: #0B0F1A; font-weight: 700; }

        .drop-item {
          display: flex; align-items: flex-start; gap: 11px;
          padding: 10px 14px; border-radius: 10px; text-decoration: none;
          transition: background .18s;
        }
        .drop-item:hover { background: #F1EFE9; }

        .mob-link {
          display: block; font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 20px; font-weight: 700; color: #0B0F1A;
          text-decoration: none; padding: 14px 0; border-bottom: 1px solid #E4E0D8;
          transition: color .18s;
        }
        .mob-link:hover { color: #00C97B; }
        .mob-sub-link {
          display: flex; align-items: center; gap: 9px;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 14px; font-weight: 600; color: #64748B;
          text-decoration: none; padding: 9px 0 9px 8px;
          border-bottom: 1px solid #F1EFE9; transition: color .18s;
        }
        .mob-sub-link:hover { color: #0B0F1A; }

        .sign-btn {
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 12.5px; font-weight: 700; letter-spacing: .02em;
          padding: 8px 18px; border-radius: 100px;
          border: 1.5px solid #0B0F1A; background: #0B0F1A; color: white;
          cursor: pointer; transition: background .18s, transform .15s, box-shadow .15s;
          text-decoration: none;
        }
        .sign-btn:hover { background: #1C2333; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(0,0,0,.18); }
        .sign-out-btn {
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 12.5px; font-weight: 600; color: #64748B;
          text-decoration: none; transition: color .18s;
        }
        .sign-out-btn:hover { color: #0B0F1A; }
      `}</style>

      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        background: "#FAF9F6",
        borderBottom: "1px solid #E4E0D8",
        boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,.07)" : "none",
        transition: "box-shadow .3s ease",
      }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 clamp(16px,3vw,40px)", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>

          {/* ── LOGO ── */}
          <Link href="/" style={{ display: "flex", alignItems: "center", flexShrink: 0, zIndex: 10 }}>
            <img src="/logo.png" alt="Nivesify" style={{ height: 36, width: "auto", objectFit: "contain" }} />
          </Link>

          {/* ── DESKTOP NAV ── */}
          <nav ref={dropdownRef} style={{ display: "flex", alignItems: "center", gap: 30, position: "relative" }}
            className="hidden-mobile">
            <style>{`
              @media (max-width: 900px) { .hidden-mobile { display: none !important; } }
            `}</style>

            {NAV.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <div key={item.label} style={{ position: "relative" }}
                  onMouseEnter={item.sub ? () => openDropdown(item.label) : undefined}
                  onMouseLeave={item.sub ? () => scheduleClose() : undefined}>

                  {item.sub ? (
                    <button onClick={() => setActiveDropdown(activeDropdown === item.label ? null : item.label)}
                      className={`hdr-link ${isActive ? "active" : ""}`}
                      style={{ background: "none", border: "none", cursor: "pointer" }}>
                      {item.label}
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transition: "transform .2s", transform: activeDropdown === item.label ? "rotate(180deg)" : "none" }}>
                        <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                  ) : (
                    <Link href={item.href} className={`hdr-link ${isActive ? "active" : ""}`}>
                      {item.label}
                    </Link>
                  )}

                  {/* Dropdown */}
                  {item.sub && activeDropdown === item.label && (
                    <div onMouseEnter={() => { if (closeTimer.current) clearTimeout(closeTimer.current); }}
                      onMouseLeave={scheduleClose}
                      style={{
                        position: "absolute", top: "calc(100% + 14px)", left: "50%",
                        transform: "translateX(-50%)",
                        background: "white", borderRadius: 18,
                        border: "1px solid #E4E0D8",
                        boxShadow: "0 20px 60px rgba(0,0,0,.13)",
                        padding: 10, minWidth: 300, zIndex: 100,
                        animation: "dropIn .18s ease both",
                      }}>
                      <style>{`
                        @keyframes dropIn {
                          from { opacity:0; transform:translateX(-50%) translateY(-8px); }
                          to   { opacity:1; transform:translateX(-50%) translateY(0); }
                        }
                        /* Arrow */
                        .drop-arrow::before {
                          content:''; position:absolute; top:-7px; left:50%;
                          transform:translateX(-50%);
                          border:7px solid transparent;
                          border-bottom-color:#E4E0D8;
                          border-top:none;
                        }
                        .drop-arrow::after {
                          content:''; position:absolute; top:-6px; left:50%;
                          transform:translateX(-50%);
                          border:7px solid transparent;
                          border-bottom-color:white;
                          border-top:none;
                        }
                      `}</style>
                      <div className="drop-arrow" style={{ position: "relative" }} />
                      {item.sub.map((s) => (
                        <Link key={s.href} href={s.href} className="drop-item"
                          onClick={() => setActiveDropdown(null)}>
                          <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1 }}>{s.icon}</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#0B0F1A", fontFamily: "'DM Sans',system-ui", marginBottom: 2 }}>{s.label}</div>
                            <div style={{ fontSize: 11.5, color: "#94A3B8", fontFamily: "'DM Sans',system-ui", lineHeight: 1.4 }}>{s.desc}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* ── RIGHT: auth + mobile toggle ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
            {!loading && (
              user ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {user.picture && (
                    <img src={user.picture} alt="avatar"
                      style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid #E4E0D8", display: "block" }} />
                  )}
                  <a href="/api/auth/logout" className="sign-out-btn">Sign out</a>
                </div>
              ) : (
                <a href="/api/auth/google" className="sign-btn"
                  style={{ display: "inline-block" }}>
                  Sign in
                </a>
              )
            )}

            {/* Hamburger — mobile only */}
            <button onClick={() => setMobileOpen(o => !o)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex", alignItems: "center", justifyContent: "center" }}
              className="show-mobile">
              <style>{`
                .show-mobile { display: none !important; }
                @media (max-width: 900px) { .show-mobile { display: flex !important; } }
              `}</style>
              <div style={{ width: 22, height: 16, display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{
                    display: "block", height: 2, background: "#0B0F1A", borderRadius: 2,
                    transition: "transform .25s ease, opacity .25s ease",
                    transformOrigin: "center",
                    transform: mobileOpen
                      ? i === 0 ? "translateY(7px) rotate(45deg)"
                        : i === 2 ? "translateY(-7px) rotate(-45deg)"
                          : "scaleX(0)"
                      : "none",
                    opacity: mobileOpen && i === 1 ? 0 : 1,
                  }} />
                ))}
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* ── MOBILE DRAWER ── */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 999,
        background: "#FAF9F6",
        transform: mobileOpen ? "translateX(0)" : "translateX(100%)",
        transition: "transform .32s cubic-bezier(.4,0,.2,1)",
        overflowY: "auto",
        paddingTop: 80,
      }}>
        <div style={{ padding: "0 24px 60px" }}>
          {NAV.map((item) => (
            <div key={item.label}>
              {item.sub ? (
                <>
                  <div style={{ fontFamily: "'DM Sans',system-ui", fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: ".10em", textTransform: "uppercase", padding: "18px 0 6px", marginTop: 8 }}>
                    {item.label}
                  </div>
                  {item.sub.map((s) => (
                    <Link key={s.href} href={s.href} className="mob-sub-link"
                      onClick={() => setMobileOpen(false)}>
                      <span style={{ fontSize: 16 }}>{s.icon}</span>
                      {s.label}
                    </Link>
                  ))}
                </>
              ) : (
                <Link href={item.href} className="mob-link"
                  onClick={() => setMobileOpen(false)}>
                  {item.label}
                </Link>
              )}
            </div>
          ))}

          {/* Mobile auth */}
          <div style={{ marginTop: 32 }}>
            {!loading && (
              user ? (
                <a href="/api/auth/logout" style={{ display: "block", fontFamily: "'DM Sans',system-ui", fontSize: 15, fontWeight: 600, color: "#64748B", textDecoration: "none", padding: "12px 0" }}>
                  Sign out
                </a>
              ) : (
                <a href="/api/auth/google" style={{ display: "block", background: "#0B0F1A", color: "white", fontFamily: "'DM Sans',system-ui", fontSize: 15, fontWeight: 700, textDecoration: "none", padding: "14px 24px", borderRadius: 14, textAlign: "center" }}>
                  Sign in with Google
                </a>
              )
            )}
          </div>

          {/* Mobile tagline */}
          <p style={{ marginTop: 40, fontFamily: "'Fraunces',Georgia,serif", fontStyle: "italic", fontWeight: 300, fontSize: 16, color: "#94A3B8", lineHeight: 1.6 }}>
            "Thoughtful Money,<br />Better Life."
          </p>
        </div>
      </div>

      {/* Spacer so page content clears the fixed header */}
      <div style={{ height: 64 }} />
    </>
  );
}