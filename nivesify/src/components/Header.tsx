"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useUser } from "@/hooks/useUser";

type NavItem = { label: string; href: string; description: string };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Plan",
    items: [
      { label: "Money dashboard", href: "/dashboard", description: "See your complete financial picture" },
      { label: "Lifetime plan", href: "/find-my-fund-lifetime-plan", description: "Build a goal-based long-term roadmap" },
      { label: "Quick picks", href: "/find-my-fund-quick-picks", description: "Get a focused starting shortlist" },
      { label: "Calculators", href: "/dashboard/calculators", description: "Model SIPs, goals and retirement" },
    ],
  },
  {
    label: "Explore",
    items: [
      { label: "Smart fund finder", href: "/mutual-fund-match", description: "Match funds to risk and time horizon" },
      { label: "Active funds", href: "/active-funds", description: "Explore consistency, alpha and risk" },
      { label: "Passive funds", href: "/index-funds", description: "Compare tracking and benchmark fit" },
      { label: "Fund holdings", href: "/mutual-fund-holdings", description: "Inspect and compare actual portfolios" },
    ],
  },
  {
    label: "Portfolio",
    items: [
      { label: "Health check", href: "/mutual-fund-health-check", description: "Start with your CAS statement" },
      { label: "Portfolio dashboard", href: "/mutual-fund-health-check/dashboard", description: "Review returns, allocation and signals" },
      { label: "My holdings", href: "/mutual-fund-health-check/portfolio", description: "See funds and current values" },
      { label: "Transactions", href: "/mutual-fund-health-check/transactions", description: "Review investment cashflows" },
    ],
  },
  {
    label: "Learn",
    items: [
      { label: "Why mutual funds?", href: "/why-mutual-fund", description: "Understand the core principles" },
      { label: "Industry analysis", href: "/mutual-fund-analysis", description: "See category-wide evidence" },
      { label: "About Nivesify", href: "/about", description: "Our philosophy and approach" },
    ],
  },
];

function isPathActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Header() {
  const { user, loading } = useUser();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setOpenGroup(null);
  }, [pathname]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) setOpenGroup(null);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        setOpenGroup(null);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className={`site-header${scrolled ? " site-header--scrolled" : ""}`}>
        <div className="site-header__inner">
          <Link href="/" className="site-header__brand" aria-label="Nivesify home" prefetch={false}>
            <Image src="/logo.png" alt="Nivesify" width={154} height={42} priority />
          </Link>

          <nav className="site-nav" aria-label="Primary navigation" ref={navRef}>
            {NAV_GROUPS.map((group) => {
              const active = group.items.some((item) => isPathActive(pathname, item.href));
              const open = openGroup === group.label;
              return (
                <div className="site-nav__group" key={group.label}>
                  <button
                    type="button"
                    className={`site-nav__trigger${active ? " is-active" : ""}`}
                    aria-expanded={open}
                    aria-controls={`nav-${group.label.toLowerCase()}`}
                    onClick={() => setOpenGroup(open ? null : group.label)}
                    onMouseEnter={() => setOpenGroup(group.label)}
                  >
                    {group.label}<ChevronDown size={14} aria-hidden="true" />
                  </button>
                  {open && (
                    <div
                      className="site-nav__menu"
                      id={`nav-${group.label.toLowerCase()}`}
                      onMouseLeave={() => setOpenGroup(null)}
                    >
                      <p className="site-nav__eyebrow">{group.label}</p>
                      {group.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          prefetch={false}
                          className={`site-nav__item${isPathActive(pathname, item.href) ? " is-active" : ""}`}
                        >
                          <span>{item.label}</span>
                          <small>{item.description}</small>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="site-header__actions">
            {!loading && (user ? (
              <div className="site-header__account">
                {user.picture && <Image src={user.picture} alt="" width={32} height={32} unoptimized />}
                <span>{user.name?.split(" ")[0] ?? "Account"}</span>
                <a href="/api/auth/logout">Sign out</a>
              </div>
            ) : (
              <a className="button button--dark button--small" href="/api/auth/google">Sign in</a>
            ))}
            <button
              type="button"
              className="site-header__menu-button"
              onClick={() => setMobileOpen((value) => !value)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
              aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      <div className="site-header__spacer" />
      <div className={`mobile-nav${mobileOpen ? " is-open" : ""}`} id="mobile-navigation" aria-hidden={!mobileOpen}>
        <div className="mobile-nav__inner">
          {NAV_GROUPS.map((group) => (
            <section className="mobile-nav__group" key={group.label}>
              <h2>{group.label}</h2>
              {group.items.map((item) => (
                <Link key={item.href} href={item.href} prefetch={false}>
                  <span>{item.label}</span>
                  <small>{item.description}</small>
                </Link>
              ))}
            </section>
          ))}
          {!loading && !user && <a className="button button--primary mobile-nav__signin" href="/api/auth/google">Sign in with Google</a>}
        </div>
      </div>
    </>
  );
}
