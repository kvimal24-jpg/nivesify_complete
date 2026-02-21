"use client";

import AnalysisTabs from "@/components/AnalysisTabs";
import React, { useState, useEffect, useRef } from "react";

/* ─────────────────────────────────────────────────────────── */
/* SCROLL REVEAL */
/* ─────────────────────────────────────────────────────────── */
function Reveal({ children, delay = 0 }: any) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: `all 0.6s ease ${delay}ms`
      }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* CARD COMPONENT */
/* ─────────────────────────────────────────────────────────── */
function Card({ title, body, icon, bg }: any) {
  return (
    <div
      style={{
        background: bg || "white",
        border: "1px solid #E2E8F0",
        borderRadius: "20px",
        padding: "22px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.05)"
      }}
    >
      <div style={{ fontSize: "24px" }}>{icon}</div>
      <h3 style={{ fontWeight: 800, marginTop: "10px" }}>{title}</h3>
      <p style={{ marginTop: "8px", lineHeight: 1.7, fontSize: "14px" }}>
        {body}
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* MAIN PAGE */
/* ─────────────────────────────────────────────────────────── */

export default function WhyMutualFundsPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F8FAFC",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        color: "#1F2937"
      }}
    >
      {/* NAV */}
      <div
        style={{
          background: "white",
          borderBottom: "1px solid #E2E8F0",
          position: "sticky",
          top: 0,
          zIndex: 30
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <AnalysisTabs />
        </div>
      </div>

      {/* HERO */}
      <section
        style={{
          background:
            "linear-gradient(160deg,#F0FDF4 0%,#EFF6FF 60%,#FFF7ED 100%)",
          padding: "clamp(60px,8vw,90px) 20px",
          borderBottom: "1px solid #E2E8F0"
        }}
      >
        <Reveal>
          <div style={{ maxWidth: "900px", margin: "0 auto" }}>
            <h1
              style={{
                fontSize: "clamp(2rem,6vw,3.6rem)",
                fontWeight: 900,
                lineHeight: 1.1,
                color: "#0F172A"
              }}
            >
              Why Mutual Funds?
              <br />
              <span
                style={{
                  background:
                    "linear-gradient(90deg,#059669,#2563EB,#7C3AED)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent"
                }}
              >
                Start Simple. Grow Intelligent.
              </span>
            </h1>

            <p
              style={{
                marginTop: "20px",
                fontSize: "16px",
                lineHeight: 1.8,
                maxWidth: "600px"
              }}
            >
              A mutual fund pools money from thousands of investors and
              invests in stocks, bonds or gold on your behalf —
              professionally managed and regulated by SEBI.
              <br />
              You stay the owner. Experts manage the basket.
            </p>
          </div>
        </Reveal>
      </section>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "60px 20px" }}>

        {/* LAYER 1: BEGINNER CLARITY */}
        <Reveal>
          <h2 style={{ fontSize: "26px", fontWeight: 900, marginBottom: "30px" }}>
            First: Why Not Just Keep Money in FD?
          </h2>
        </Reveal>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
            gap: "20px",
            marginBottom: "60px"
          }}
        >
          <Reveal>
            <Card
              icon="🏦"
              title="Safe but Limited Growth"
              body="FDs offer stability. But after tax and inflation, real wealth growth can remain modest over long periods."
              bg="#FFF7ED"
            />
          </Reveal>

          <Reveal delay={100}>
            <Card
              icon="📈"
              title="Equity Participation"
              body="Equity mutual funds allow you to participate in India's economic growth — but with short-term volatility."
              bg="#EFF6FF"
            />
          </Reveal>

          <Reveal delay={200}>
            <Card
              icon="⏳"
              title="Time Is the Multiplier"
              body="Wealth in markets is built through time, not timing. Long holding periods reduce volatility risk."
              bg="#ECFDF5"
            />
          </Reveal>
        </div>

        {/* LAYER 2: STRUCTURAL ADVANTAGES */}
        <Reveal>
          <h2 style={{ fontSize: "26px", fontWeight: 900, marginBottom: "30px" }}>
            Why the Structure Helps Investors
          </h2>
        </Reveal>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
            gap: "20px",
            marginBottom: "60px"
          }}
        >
          <Reveal>
            <Card
              icon="🧺"
              title="Diversification"
              body="Funds typically hold 40–100 companies across sectors. One company failing doesn't destroy your portfolio."
            />
          </Reveal>

          <Reveal delay={100}>
            <Card
              icon="👨‍💼"
              title="Professional Management"
              body="Research teams track balance sheets, earnings and risks so you don't have to."
            />
          </Reveal>

          <Reveal delay={200}>
            <Card
              icon="⚖️"
              title="SEBI Regulation"
              body="Strict portfolio disclosures, cost caps and custodial structure protect investor interests."
            />
          </Reveal>

          <Reveal delay={300}>
            <Card
              icon="🔁"
              title="Tax Efficient Internal Rebalancing"
              body="Managers can rebalance portfolios internally. Investors pay capital gains only when redeeming units."
            />
          </Reveal>
        </div>

        {/* LAYER 3: SMART INVESTOR DEPTH */}
        <Reveal>
          <h2 style={{ fontSize: "26px", fontWeight: 900, marginBottom: "30px" }}>
            How Smart Investors Use Mutual Funds
          </h2>
        </Reveal>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
            gap: "20px",
            marginBottom: "60px"
          }}
        >
          <Reveal>
            <Card
              icon="📊"
              title="Asset Allocation Matters Most"
              body="Your mix of equity vs debt drives the majority of returns and risk — more than fund selection."
              bg="#EFF6FF"
            />
          </Reveal>

          <Reveal delay={120}>
            <Card
              icon="🎯"
              title="Goal-Based Investing"
              body="Match your fund type to your goal timeline. Equity for 7+ years. Debt for near-term goals."
              bg="#F0FDF4"
            />
          </Reveal>

          <Reveal delay={240}>
            <Card
              icon="🧠"
              title="Behavior Beats Intelligence"
              body="SIPs automate discipline. Emotional investing destroys more wealth than wrong fund choice."
              bg="#FFF7ED"
            />
          </Reveal>

          <Reveal delay={360}>
            <Card
              icon="🔍"
              title="Review, Don't React"
              body="Review funds annually. Avoid selling because of news or short-term volatility."
              bg="#F5F3FF"
            />
          </Reveal>
        </div>

        {/* LAYER 4: ADVANCED SIGNAL */}
        <Reveal>
          <div
            style={{
              background: "linear-gradient(135deg,#0F172A,#1E3A8A)",
              borderRadius: "28px",
              padding: "50px",
              color: "white",
              textAlign: "center",
              marginBottom: "40px"
            }}
          >
            <h2 style={{ fontSize: "28px", fontWeight: 900 }}>
              Markets Reward Patience.
            </h2>

            <p style={{ marginTop: "20px", opacity: 0.8, lineHeight: 1.8 }}>
              Mutual funds are not shortcuts to quick wealth.
              They are structured vehicles designed to participate in
              economic growth — responsibly and systematically.
            </p>

            <a
              href="/find-my-fund"
              style={{
                display: "inline-block",
                marginTop: "30px",
                background:
                  "linear-gradient(90deg,#10B981,#3B82F6)",
                padding: "14px 30px",
                borderRadius: "100px",
                color: "white",
                fontWeight: 800,
                textDecoration: "none"
              }}
            >
              Build My Fund Plan →
            </a>
          </div>
        </Reveal>

        <div
          style={{
            fontSize: "12px",
            textAlign: "center",
            color: "#94A3B8"
          }}
        >
          Mutual fund investments are subject to market risks.
          Past performance is not indicative of future returns.
          This content is educational in nature.
        </div>
      </div>
    </div>
  );
}