"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { getFilteredText, getJsonFromTxt, textUtils } from "@/lib/mutual-fund-health-check/cas-parser";

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

async function loadPdfJs() {
  if (typeof window === "undefined") return;
  if (window.pdfjsLib) return;
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf");
  window.pdfjsLib = pdfjsLib;
  if (pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();
  }
}

// ─── SCROLL REVEAL ──────────────────────────────────────────────────────────
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.05 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ─── PROGRESS BAR ────────────────────────────────────────────────────────────
function ProcessingProgress({ progress, label }: { progress: number; label: string }) {
  return (
    <div style={{ marginTop: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
        <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: "11px", color: "#059669", fontWeight: 700 }}>{Math.round(progress)}%</span>
      </div>
      <div style={{ height: "5px", background: "#E2E8F0", borderRadius: "100px", overflow: "hidden" }}>
        <div style={{
          height: "100%", background: "linear-gradient(90deg,#059669,#2563EB)",
          borderRadius: "100px", width: `${progress}%`,
          transition: "width 0.3s ease",
        }} />
      </div>
    </div>
  );
}

// ─── STEP CARD ───────────────────────────────────────────────────────────────
function StepCard({ step, title, children }: { step: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "white", borderRadius: "18px", border: "1.5px solid #E2E8F0",
      padding: "18px 20px", display: "flex", flexDirection: "column", gap: "8px",
    }}>
      <div style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: "26px", height: "26px", borderRadius: "100px",
        background: "rgba(5,150,105,0.1)", border: "1.5px solid rgba(5,150,105,0.25)",
        fontSize: "10px", fontWeight: 800, color: "#059669", flexShrink: 0,
      }}>
        {step}
      </div>
      <div style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A" }}>{title}</div>
      <div style={{ fontSize: "12px", color: "#64748B", lineHeight: 1.65 }}>{children}</div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function MutualFundHealthCheckPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── State ──
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingLabel, setProcessingLabel] = useState("Reading PDF…");
  const [error, setError] = useState<string | null>(null);
  const [existingData, setExistingData] = useState<any | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const disclaimerText =
    "All financial decisions involve risk and past performance is no guarantee of future results. Consult a qualified advisor and review all relevant disclosure documents before acting on any information provided. Your CAS data is processed locally in your browser — we only store the parsed summary with your account.";

  const logDebug = (message: string) => {
    setDebugLogs((prev) => [`${new Date().toISOString()} ${message}`, ...prev].slice(0, 200));
  };

  // ── Auth guard ──
  useEffect(() => {
    if (!loading && !user) router.push("/api/auth/google");
  }, [loading, user, router]);

  // ── Load existing CAS data ──
  useEffect(() => {
    if (!user) return;
    fetch("/api/mutual-fund-health-check")
      .then((res) => res.json())
      .then((json) => setExistingData(json.data || null))
      .catch(() => setExistingData(null));
  }, [user]);

  const summary = useMemo(() => {
    if (!existingData?.meta) return null;
    return {
      from: new Date(existingData.meta.from).toLocaleDateString("en-IN"),
      to: new Date(existingData.meta.to).toLocaleDateString("en-IN"),
      exportedAt: new Date(existingData.meta.exportedAt).toLocaleString("en-IN"),
      transactions: existingData.transactionsCount ?? existingData.transactions?.length ?? 0,
    };
  }, [existingData]);

  // ── Drag and drop ──
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFileSelection(file);
  };

  // ── File selection (shared between input + drag) ──
  const processFileSelection = (file: File) => {
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file. Other file types are not supported.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("File too large. Please upload a PDF under 20 MB.");
      return;
    }
    logDebug(`Selected file: ${file.name} (${Math.round(file.size / 1024)} KB)`);
    setSelectedFile(file);
    setError(null);
    checkIfPasswordProtected(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFileSelection(file);
    e.target.value = "";
  };

  // ── Password-protection check ──
  const checkIfPasswordProtected = async (file: File) => {
    const blobUrl = URL.createObjectURL(file);
    try {
      logDebug("Checking PDF password protection");
      await loadPdfJs();
      const loadingTask = window.pdfjsLib.getDocument({ url: blobUrl });
      await loadingTask.promise;
      setIsPasswordProtected(false);
      setPassword("");
      logDebug("PDF does not require password");
    } catch (err: any) {
      if (err?.name === "PasswordException") {
        setIsPasswordProtected(true);
        setPassword("");
        logDebug("PDF requires password");
      } else {
        logDebug(`PDF check failed: ${err?.message || "unknown"}`);
        setError("Failed to read the PDF. Make sure it is a valid CAS statement and try again.");
      }
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  };

  // ── Delete ──
  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    setIsProcessing(true);
    setError(null);
    try {
      logDebug("Delete started");
      const res = await fetch("/api/mutual-fund-health-check", { method: "DELETE" });
      if (!res.ok) {
        const detail = await res.text();
        logDebug(`Delete failed: ${res.status} ${detail}`);
        throw new Error("Failed to delete existing data.");
      }
      setExistingData(null);
      setSelectedFile(null);
      setPassword("");
      setIsPasswordProtected(false);
      logDebug("Delete completed");
    } catch {
      setError("Failed to delete existing data. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Process & upload ──
  const handleProcess = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingLabel("Loading PDF engine…");
    setError(null);
    const startedAt = Date.now();
    let blobUrl: string | null = null;

    try {
      logDebug("Processing started");
      await loadPdfJs();
      setProcessingProgress(8);
      setProcessingLabel("Opening PDF…");

      blobUrl = URL.createObjectURL(selectedFile);
      const loadingTask = window.pdfjsLib.getDocument({
        url: blobUrl,
        password: password || undefined,
      });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      let text = "";
      logDebug(`PDF loaded (${numPages} pages)`);

      setProcessingProgress(12);
      setProcessingLabel(`Extracting text (0 / ${numPages} pages)…`);

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const pageText = await page.getTextContent();
        pageText.items.forEach((item: any) => {
          const str = item?.str || "";
          if (item?.hasEOL) {
            text += textUtils.isText(str) ? `${str}\n` : "\n";
          } else if (textUtils.isText(str)) {
            text += `${str} `;
          }
        });
        text += "\n";
        const pct = 12 + Math.round((pageNum / numPages) * 40);
        setProcessingProgress(pct);
        setProcessingLabel(`Extracting text (${pageNum} / ${numPages} pages)…`);
      }

      text = text.split("\n").map((l) => l.trim()).join("\n");

      setProcessingProgress(55);
      setProcessingLabel("Parsing CAS transactions…");
      const filteredText = getFilteredText(text);

      setProcessingProgress(65);
      setProcessingLabel("Fetching scheme data from AMFI…");
      const json = await getJsonFromTxt(filteredText, text);

      logDebug(`Parsed transactions: ${json.transactions?.length ?? 0}`);
      logDebug(`CAS summary invested: ${json.summary?.invested ?? 0}`);

      setProcessingProgress(85);
      setProcessingLabel("Uploading to your account…");

      const payload = json;
      logDebug(`Payload size: ${JSON.stringify(payload).length} chars`);

      const res = await fetch("/api/mutual-fund-health-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const detail = await res.text();
        logDebug(`Upload failed: ${res.status} ${detail}`);
        throw new Error("Failed to save CAS data.");
      }

      setProcessingProgress(100);
      setProcessingLabel("Done! Redirecting to dashboard…");
      setExistingData(payload);
      setSelectedFile(null);
      setPassword("");
      setIsPasswordProtected(false);
      logDebug(`Upload completed in ${(Date.now() - startedAt) / 1000}s`);

      // Brief pause so user sees 100%
      await new Promise((r) => setTimeout(r, 600));
      router.push("/mutual-fund-health-check/dashboard");
    } catch (err: any) {
      logDebug(`Processing failed: ${err?.message || "unknown"}`);
      setProcessingProgress(0);
      if (err?.name === "PasswordException") {
        setError("Incorrect PDF password. Please double-check and try again.");
      } else if (err?.message?.includes("Failed to fetch")) {
        setError("Upload failed — please check your internet connection and try again.");
      } else {
        setError(err?.message || "Something went wrong while processing the file. Please try again.");
      }
    } finally {
      setIsProcessing(false);
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    }
  };

  if (loading || !user) {
    return (
      <div style={{
        minHeight: "100vh", background: "#F8FAFC", display: "flex",
        alignItems: "center", justifyContent: "center",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "50%",
            border: "3px solid #E2E8F0", borderTopColor: "#059669",
            animation: "spin 0.7s linear infinite", margin: "0 auto 12px",
          }} />
          <p style={{ fontSize: "13px", color: "#94A3B8", fontWeight: 500 }}>Signing you in…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  const canProcess = !!selectedFile && !isProcessing && (!isPasswordProtected || !!password.trim());

  return (
    <div style={{
      minHeight: "100vh", background: "#F8FAFC",
      fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
      color: "#1F2937",
    }}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{
        background: "linear-gradient(155deg,#0F172A 0%,#1E3A5F 55%,#065F46 100%)",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)",
          backgroundSize: "28px 28px", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", top: -80, right: -60, width: "480px", height: "480px",
          background: "radial-gradient(circle,rgba(16,185,129,0.14) 0%,transparent 65%)", pointerEvents: "none",
        }} />
        <div style={{
          position: "relative", maxWidth: "900px", margin: "0 auto",
          padding: "clamp(32px,5vw,56px) clamp(16px,4vw,32px) clamp(28px,4vw,44px)",
        }}>
          <Reveal>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "20px" }}>
              <a href="/" style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>Nivesify</a>
              <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "11px" }}>/</span>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.45)" }}>MF Health Check</span>
            </div>
          </Reveal>
          <Reveal delay={60}>
            <div style={{
              display: "inline-flex", alignItems: "center",
              background: "rgba(5,150,105,0.15)", border: "1px solid rgba(5,150,105,0.35)",
              borderRadius: "100px", padding: "4px 13px", marginBottom: "14px",
            }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#34D399", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                🔒 100% Browser-side Processing
              </span>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <h1 style={{
              fontSize: "clamp(1.6rem,4.5vw,2.8rem)", fontWeight: 900, color: "white",
              lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: "12px", maxWidth: "640px",
            }}>
              Mutual Fund{" "}
              <span style={{
                background: "linear-gradient(90deg,#34D399 0%,#60A5FA 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                Health Check
              </span>
            </h1>
          </Reveal>
          <Reveal delay={150}>
            <p style={{
              fontSize: "clamp(13px,1.8vw,15px)", color: "rgba(255,255,255,0.65)",
              lineHeight: 1.8, maxWidth: "500px", marginBottom: "24px",
            }}>
              Upload your CAMS CAS statement — your PDF never leaves your browser. We parse it locally, store only the structured summary with your account, and show you a full portfolio health report.
            </p>
          </Reveal>
          <Reveal delay={190}>
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
              {[
                { icon: "🔒", label: "Browser-only parsing" },
                { icon: "📊", label: "Complete portfolio view" },
                { icon: "⚡", label: "Instant analysis" },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                  <span style={{ fontSize: "14px" }}>{item.icon}</span>
                  <span style={{ fontSize: "11.5px", fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>{item.label}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── BODY ─────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "clamp(24px,4vw,48px) clamp(16px,4vw,32px)" }}>

        {/* ── EXISTING DATA BANNER ── */}
        {summary && (
          <Reveal>
            <div style={{
              background: "white", borderRadius: "24px",
              border: "1.5px solid rgba(5,150,105,0.25)",
              boxShadow: "0 4px 20px rgba(5,150,105,0.08)",
              padding: "22px 26px", marginBottom: "28px",
              display: "flex", flexWrap: "wrap", alignItems: "center", gap: "20px",
            }}>
              <div style={{
                width: "44px", height: "44px", borderRadius: "14px",
                background: "rgba(5,150,105,0.1)", border: "1.5px solid rgba(5,150,105,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "20px", flexShrink: 0,
              }}>📂</div>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
                  CAS data already on file
                </div>
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                  {[
                    { label: "Period", value: `${summary.from} → ${summary.to}` },
                    { label: "Transactions", value: summary.transactions.toLocaleString("en-IN") },
                    { label: "Last updated", value: summary.exportedAt },
                  ].map(item => (
                    <div key={item.label}>
                      <div style={{ fontSize: "9.5px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{item.label}</div>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "#0F172A" }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", flexShrink: 0 }}>
                <button
                  onClick={() => router.push("/mutual-fund-health-check/dashboard")}
                  style={{
                    padding: "9px 20px", borderRadius: "100px",
                    background: "linear-gradient(90deg,#059669,#2563EB)",
                    color: "white", fontSize: "11.5px", fontWeight: 700,
                    letterSpacing: "0.05em", border: "none", cursor: "pointer",
                    fontFamily: "inherit", boxShadow: "0 4px 14px rgba(5,150,105,0.3)",
                  }}
                >
                  View Dashboard →
                </button>
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isProcessing}
                    style={{
                      padding: "9px 18px", borderRadius: "100px",
                      background: "white", border: "1.5px solid #FECACA",
                      color: "#DC2626", fontSize: "11.5px", fontWeight: 700,
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    Delete Data
                  </button>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "11px", color: "#DC2626", fontWeight: 600 }}>Sure?</span>
                    <button
                      onClick={handleDelete}
                      disabled={isProcessing}
                      style={{
                        padding: "7px 14px", borderRadius: "100px", background: "#DC2626",
                        border: "none", color: "white", fontSize: "11px", fontWeight: 700,
                        cursor: "pointer", fontFamily: "inherit",
                      }}
                    >Yes, delete</button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      style={{
                        padding: "7px 14px", borderRadius: "100px", background: "#F1F5F9",
                        border: "none", color: "#64748B", fontSize: "11px", fontWeight: 700,
                        cursor: "pointer", fontFamily: "inherit",
                      }}
                    >Cancel</button>
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        )}

        {/* ── UPLOAD CARD ── */}
        <Reveal delay={80}>
          <div style={{
            background: "white", borderRadius: "28px",
            border: "1.5px solid #E2E8F0",
            boxShadow: "0 8px 40px rgba(0,0,0,0.05)",
            overflow: "hidden", marginBottom: "28px",
          }}>
            {/* Card header */}
            <div style={{
              background: "linear-gradient(135deg,rgba(5,150,105,0.07),transparent)",
              borderBottom: "1px solid rgba(5,150,105,0.15)",
              padding: "22px 28px 18px",
            }}>
              <div style={{
                display: "inline-flex", alignItems: "center",
                background: "rgba(5,150,105,0.08)", border: "1px solid rgba(5,150,105,0.2)",
                borderRadius: "100px", padding: "3px 12px", marginBottom: "10px",
              }}>
                <span style={{ fontSize: "10.5px", fontWeight: 700, color: "#059669", letterSpacing: "0.09em", textTransform: "uppercase" }}>
                  📤 Upload CAS Statement
                </span>
              </div>
              <h2 style={{ fontSize: "clamp(16px,2.5vw,20px)", fontWeight: 900, color: "#0F172A", margin: 0, letterSpacing: "-0.02em" }}>
                {summary ? "Upload a new CAS to replace existing data" : "Upload your CAS PDF to get started"}
              </h2>
            </div>

            <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "20px" }}>

              {/* Drop zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isProcessing && fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragging ? "#059669" : selectedFile ? "rgba(5,150,105,0.4)" : "#E2E8F0"}`,
                  borderRadius: "20px",
                  background: isDragging ? "rgba(5,150,105,0.04)" : selectedFile ? "rgba(5,150,105,0.03)" : "#FAFAFA",
                  padding: "clamp(24px,4vw,40px) 24px",
                  textAlign: "center", cursor: isProcessing ? "default" : "pointer",
                  transition: "all 0.2s",
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  disabled={isProcessing}
                />
                {selectedFile ? (
                  <>
                    <div style={{ fontSize: "32px", marginBottom: "8px" }}>📄</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", marginBottom: "4px" }}>{selectedFile.name}</div>
                    <div style={{ fontSize: "12px", color: "#94A3B8" }}>
                      {(selectedFile.size / 1024).toFixed(0)} KB
                      {isPasswordProtected && (
                        <span style={{ marginLeft: "8px", color: "#D97706", fontWeight: 600 }}>🔒 Password protected</span>
                      )}
                    </div>
                    {!isProcessing && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setPassword(""); setIsPasswordProtected(false); setError(null); }}
                        style={{
                          marginTop: "10px", fontSize: "11px", color: "#94A3B8",
                          background: "none", border: "none", cursor: "pointer",
                          fontFamily: "inherit", textDecoration: "underline",
                        }}
                      >Remove file</button>
                    )}
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: "36px", marginBottom: "10px" }}>☁️</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", marginBottom: "4px" }}>
                      Drop your CAS PDF here
                    </div>
                    <div style={{ fontSize: "12px", color: "#94A3B8", marginBottom: "12px" }}>
                      or click to browse — PDF files only, max 20 MB
                    </div>
                    <div style={{
                      display: "inline-block", padding: "8px 18px", borderRadius: "100px",
                      background: "rgba(5,150,105,0.08)", border: "1px solid rgba(5,150,105,0.2)",
                      fontSize: "11.5px", fontWeight: 700, color: "#059669",
                    }}>
                      Choose File
                    </div>
                  </>
                )}
              </div>

              {/* Password field */}
              {selectedFile && (
                <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                  <label style={{ fontSize: "10.5px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    PDF Password {isPasswordProtected ? "(required — your CAS is password protected)" : "(optional)"}
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={passwordVisible ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && canProcess) handleProcess(); }}
                      placeholder={isPasswordProtected ? "Enter your CAS password" : "Leave blank if none"}
                      disabled={isProcessing}
                      style={{
                        width: "100%", padding: "11px 46px 11px 14px", borderRadius: "14px",
                        border: `1.5px solid ${isPasswordProtected && !password ? "#FCA5A5" : "#E2E8F0"}`,
                        background: "white", fontSize: "14px", fontWeight: 600,
                        color: "#0F172A", outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                        transition: "border-color 0.2s",
                      }}
                      onFocus={e => (e.currentTarget.style.borderColor = "#059669")}
                      onBlur={e => (e.currentTarget.style.borderColor = isPasswordProtected && !password ? "#FCA5A5" : "#E2E8F0")}
                    />
                    <button
                      onClick={() => setPasswordVisible(v => !v)}
                      style={{
                        position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                        background: "none", border: "none", cursor: "pointer", fontSize: "16px",
                        color: "#94A3B8", padding: "4px",
                      }}
                      title={passwordVisible ? "Hide password" : "Show password"}
                    >
                      {passwordVisible ? "🙈" : "👁"}
                    </button>
                  </div>
                  {isPasswordProtected && (
                    <p style={{ fontSize: "11px", color: "#D97706", margin: 0 }}>
                      💡 Tip: Your CAS password is usually your PAN number (e.g. ABCDE1234F) or the one you set when requesting the statement.
                    </p>
                  )}
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={{
                  background: "#FEF2F2", border: "1.5px solid #FECACA",
                  borderRadius: "14px", padding: "12px 16px",
                  fontSize: "12.5px", color: "#DC2626", fontWeight: 500, lineHeight: 1.6,
                }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Progress bar while processing */}
              {isProcessing && (
                <ProcessingProgress progress={processingProgress} label={processingLabel} />
              )}

              {/* CTA */}
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                <button
                  onClick={handleProcess}
                  disabled={!canProcess}
                  style={{
                    padding: "12px 28px", borderRadius: "100px",
                    background: canProcess
                      ? "linear-gradient(90deg,#059669,#2563EB)"
                      : "#E2E8F0",
                    color: canProcess ? "white" : "#94A3B8",
                    fontSize: "12.5px", fontWeight: 700, letterSpacing: "0.06em",
                    textTransform: "uppercase", border: "none",
                    cursor: canProcess ? "pointer" : "not-allowed",
                    fontFamily: "inherit",
                    boxShadow: canProcess ? "0 4px 18px rgba(5,150,105,0.35)" : "none",
                    transition: "all 0.2s",
                  }}
                >
                  {isProcessing ? "Processing…" : "Upload & Analyse →"}
                </button>
                {!selectedFile && (
                  <span style={{ fontSize: "11.5px", color: "#94A3B8" }}>
                    Select a CAS PDF file to begin
                  </span>
                )}
                {selectedFile && isPasswordProtected && !password && (
                  <span style={{ fontSize: "11.5px", color: "#D97706", fontWeight: 600 }}>
                    🔒 Password required to continue
                  </span>
                )}
              </div>

            </div>
          </div>
        </Reveal>

        {/* ── HOW TO DOWNLOAD CAS ── */}
        <Reveal delay={120}>
          <div style={{
            background: "white", borderRadius: "28px",
            border: "1.5px solid #E2E8F0",
            boxShadow: "0 8px 40px rgba(0,0,0,0.05)",
            overflow: "hidden", marginBottom: "28px",
          }}>
            <div style={{
              background: "linear-gradient(135deg,rgba(37,99,235,0.07),transparent)",
              borderBottom: "1px solid rgba(37,99,235,0.15)",
              padding: "22px 28px 18px",
            }}>
              <div style={{
                display: "inline-flex", alignItems: "center",
                background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)",
                borderRadius: "100px", padding: "3px 12px", marginBottom: "10px",
              }}>
                <span style={{ fontSize: "10.5px", fontWeight: 700, color: "#2563EB", letterSpacing: "0.09em", textTransform: "uppercase" }}>
                  📋 Step-by-step Guide
                </span>
              </div>
              <h2 style={{ fontSize: "clamp(15px,2.5vw,19px)", fontWeight: 900, color: "#0F172A", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
                How to download your CAS from CAMS
              </h2>
              <p style={{ fontSize: "12px", color: "#64748B", margin: 0, lineHeight: 1.6 }}>
                A CAS (Consolidated Account Statement) contains all your mutual fund investments across all AMCs in one PDF.{" "}
                <a
                  href="https://www.camsonline.com/Investors/Statements/Consolidated-Account-Statement"
                  target="_blank" rel="noopener noreferrer"
                  style={{ color: "#2563EB", fontWeight: 700, textDecoration: "none" }}
                >
                  Open CAMS website ↗
                </a>
              </p>
            </div>

            <div style={{ padding: "24px 28px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "12px", marginBottom: "18px" }}>
                <StepCard step="1" title="Open the CAMS website">
                  Go to{" "}
                  <a href="https://www.camsonline.com/Investors/Statements/Consolidated-Account-Statement" target="_blank" rel="noopener noreferrer" style={{ color: "#2563EB", fontWeight: 600 }}>
                    camsonline.com
                  </a>{" "}
                  → Investors → Statements → Consolidated Account Statement.
                </StepCard>
                <StepCard step="2" title="Select DETAILED statement">
                  Choose <strong style={{ color: "#0F172A" }}>Detailed</strong> — not Summary. Detailed includes every transaction, SIP date, units, and NAV — which we need to analyse your portfolio.
                </StepCard>
                <StepCard step="3" title="Set the full date range">
                  Start: <strong style={{ color: "#0F172A" }}>01-01-2000</strong> (or before your first investment). End: today. This ensures we see your complete history.
                </StepCard>
                <StepCard step="4" title="Include zero-balance & closed folios">
                  Tick the option <strong style={{ color: "#0F172A" }}>"Include Zero Balance / Closed Folios"</strong> so we can analyse old funds, stopped SIPs, and redeemed investments.
                </StepCard>
                <StepCard step="5" title="Enter PAN and registered email">
                  Submit your PAN and the email linked to your mutual fund account. You'll receive the CAS PDF by email — usually within a few minutes.
                </StepCard>
                <StepCard step="6" title="Upload the PDF as received">
                  Download from email and upload here. <strong style={{ color: "#0F172A" }}>Do not unlock, print, or re-save the PDF</strong> — this corrupts the text layer we parse.
                </StepCard>
              </div>

              {/* Warning box */}
              <div style={{
                background: "#FFF7ED", border: "1.5px solid #FED7AA",
                borderRadius: "16px", padding: "14px 18px",
                display: "flex", gap: "12px", alignItems: "flex-start",
              }}>
                <span style={{ fontSize: "18px", flexShrink: 0 }}>⚠️</span>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#92400E", marginBottom: "6px" }}>
                    Common mistakes that cause upload failures
                  </div>
                  <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "11.5px", color: "#78350F", lineHeight: 1.75 }}>
                    <li>Uploading <strong>Summary</strong> instead of Detailed statement — Summary has no transactions</li>
                    <li>Selecting a <strong>short date range</strong> — misses early investments and returns</li>
                    <li>Not ticking <strong>zero-balance folios</strong> — misses old or redeemed funds</li>
                    <li>Re-saving or unlocking the PDF — breaks the text extraction layer</li>
                    <li>Uploading multiple PDFs — only one combined CAS file is supported</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ── PRIVACY NOTE + DISCLAIMER ── */}
        <Reveal delay={160}>
          <div style={{
            background: "white", borderRadius: "20px", border: "1.5px solid #E2E8F0",
            padding: "18px 22px", marginBottom: "20px",
            display: "flex", gap: "12px", alignItems: "flex-start",
          }}>
            <span style={{ fontSize: "18px", flexShrink: 0 }}>🔒</span>
            <div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#0F172A", marginBottom: "5px" }}>
                Your data stays private
              </div>
              <p style={{ fontSize: "11.5px", color: "#64748B", lineHeight: 1.7, margin: 0 }}>
                Your CAS PDF is parsed entirely inside your browser using JavaScript — it is never uploaded to our servers. Only the structured, parsed data (transaction records and portfolio summary) is saved securely with your account so you can return to your dashboard anytime.
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={180}>
          <div style={{
            borderRadius: "16px", border: "1px solid #E2E8F0",
            padding: "14px 18px", marginBottom: "20px",
            fontSize: "10.5px", color: "#94A3B8", lineHeight: 1.75,
          }}>
            <strong style={{ color: "#64748B" }}>Disclaimer · </strong>{disclaimerText}
          </div>
        </Reveal>

        {/* ── DEBUG LOGS (dev helper, collapsible) ── */}
        {debugLogs.length > 0 && (
          <Reveal delay={200}>
            <div style={{ marginBottom: "20px" }}>
              <button
                onClick={() => setShowDebug(v => !v)}
                style={{
                  fontSize: "10.5px", fontWeight: 600, color: "#94A3B8",
                  background: "none", border: "none", cursor: "pointer",
                  fontFamily: "inherit", padding: 0, textDecoration: "underline",
                }}
              >
                {showDebug ? "▲ Hide" : "▼ Show"} debug logs ({debugLogs.length})
              </button>
              {showDebug && (
                <div style={{
                  marginTop: "8px", background: "#0F172A", borderRadius: "14px",
                  padding: "14px 16px", maxHeight: "220px", overflowY: "auto",
                  fontFamily: "monospace", fontSize: "10px", color: "#94A3B8", lineHeight: 1.7,
                }}>
                  {debugLogs.map((log, i) => (
                    <div key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", paddingBottom: "2px", marginBottom: "2px" }}>
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Reveal>
        )}

      </div>

      <style>{`
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        @keyframes spin { to { transform: rotate(360deg); } }
        button:focus-visible { outline: 2px solid #059669; outline-offset: 2px; }
        input:focus-visible { outline: none; }
        a:hover { opacity: 0.8; }
        @media (max-width: 480px) {
          h1, h2 { letter-spacing: -0.02em !important; }
        }
      `}</style>
    </div>
  );
}