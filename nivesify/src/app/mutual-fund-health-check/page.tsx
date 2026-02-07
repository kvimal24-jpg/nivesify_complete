"use client";

import { useEffect, useMemo, useState } from "react";
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

export default function MutualFundHealthCheckPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingData, setExistingData] = useState<any | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [debugOpen, setDebugOpen] = useState(false);

  const logDebug = (message: string) => {
    setDebugLogs((prev) => [`${new Date().toISOString()} ${message}`, ...prev].slice(0, 200));
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/api/auth/google");
    }
  }, [loading, user, router]);

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

  const handleDelete = async () => {
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
        setError("Failed to read the PDF. Please try again.");
      }
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      e.target.value = "";
      return;
    }
    logDebug(`Selected file: ${file.name} (${Math.round(file.size / 1024)} KB)`);
    setSelectedFile(file);
    setError(null);
    checkIfPasswordProtected(file);
  };

  const handleProcess = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setError(null);
    const startedAt = Date.now();
    let blobUrl: string | null = null;

    try {
      logDebug("Processing started");
      await loadPdfJs();
      blobUrl = URL.createObjectURL(selectedFile);
      const loadingTask = window.pdfjsLib.getDocument({
        url: blobUrl,
        password: password || undefined,
      });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      let text = "";
      logDebug(`PDF loaded (${numPages} pages)`);

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const pageText = await page.getTextContent();
        pageText.items.forEach((item: any) => {
          const str = item?.str || "";
          if (item?.hasEOL) {
            if (textUtils.isText(str)) {
              text += `${str}\n`;
            } else {
              text += "\n";
            }
          } else if (textUtils.isText(str)) {
            text += `${str} `;
          }
        });
        text += "\n";
      }

      text = text
        .split("\n")
        .map((line) => line.trim())
        .join("\n");

      const filteredText = getFilteredText(text);
      logDebug("Fetching scheme list");
      const schemeController = new AbortController();
      const schemeTimeoutId = setTimeout(() => schemeController.abort(), 15000);
      const schemeRes = await fetch("/api/mutual-fund-health-check/mf", {
        signal: schemeController.signal,
      });
      clearTimeout(schemeTimeoutId);
      if (!schemeRes.ok) {
        const detail = await schemeRes.text();
        logDebug(`Scheme list fetch failed: ${schemeRes.status} ${detail}`);
        throw new Error("Failed to fetch scheme list.");
      }
      const schemeJson = await schemeRes.json();
      const schemes = schemeJson.data || [];
      logDebug(`Scheme list loaded: ${schemes.length}`);

      const json = await getJsonFromTxt(filteredText, schemes);
      logDebug(`Parsed transactions: ${json.transactions.length}`);
      logDebug(`CAS summary invested: ${json.summary.invested}`);

      const payload = json;
      logDebug(`Payload size: ${JSON.stringify(payload).length} chars`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const res = await fetch("/api/mutual-fund-health-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        const detail = await res.text();
        logDebug(`Upload failed: ${res.status} ${detail}`);
        throw new Error("Failed to save CAS data.");
      }

      setExistingData(payload);
      setSelectedFile(null);
      setPassword("");
      setIsPasswordProtected(false);
      logDebug(`Upload completed in ${(Date.now() - startedAt) / 1000}s`);

      router.push("/mutual-fund-health-check/dashboard");
    } catch (err: any) {
      logDebug(`Processing failed: ${err?.message || "unknown"}`);
      if (err?.name === "PasswordException") {
        setError("Invalid password. Please try again.");
      } else if (err?.name === "AbortError") {
        setError("Upload timed out. Please try again.");
      } else if (err?.message?.includes("scheme list")) {
        setError("Failed to load scheme list. Please try again.");
      } else if (err?.message?.includes("Failed to fetch")) {
        setError("Upload failed. Please check your connection and try again.");
      } else {
        setError(err?.message || "An error occurred while processing the file.");
      }
    } finally {
      setIsProcessing(false);
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    }
  };

  if (loading || !user) {
    return <div className="p-12 text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F5F6F3] px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl bg-white shadow-[0_30px_80px_-40px_rgba(0,0,0,0.35)] p-8 md:p-12">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-[#6B7C70] font-serif">mutual fund health check</p>
            <h1 className="text-3xl md:text-5xl font-serif text-[#1F2937]">Upload your CAS statement</h1>
            <p className="text-base md:text-lg font-serif text-[#6B7C70]">
              Your CAS is processed entirely in your browser. We store the parsed data securely with your account so you can return anytime.
            </p>
          </div>

          {summary && (
            <div className="mt-8 rounded-2xl border border-[#E6E8E1] bg-[#FBFCFA] p-5 text-sm text-[#1F2937]">
              <div className="font-semibold">Existing data on file</div>
              <div className="mt-2 grid gap-1 text-[#6B7C70]">
                <span>Period: {summary.from} to {summary.to}</span>
                <span>Exported: {summary.exportedAt}</span>
                <span>Transactions: {summary.transactions}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  className="inline-flex items-center rounded-full bg-[#1F2937] px-4 py-2 text-xs uppercase tracking-[0.2em] text-white"
                  onClick={() => router.push("/mutual-fund-health-check/dashboard")}
                >
                  Go to Dashboard
                </button>
                <button
                  className="inline-flex items-center rounded-full border border-[#D5D9CF] bg-white px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#B35A5A]"
                  onClick={handleDelete}
                  disabled={isProcessing}
                >
                  Delete CAS Data
                </button>
              </div>
            </div>
          )}

          <div className="mt-10 space-y-6">
            <div className="rounded-2xl border border-[#E6E8E1] p-5">
              <div className="text-sm font-semibold text-[#1F2937]">How to download your CAS PDF</div>
              <ol className="mt-3 list-decimal space-y-1 pl-4 text-sm text-[#6B7C70]">
                <li>Visit CAMS or KFintech consolidated statement page.</li>
                <li>Select detailed statement type.</li>
                <li>Set start date before your first investment.</li>
                <li>Choose "With Zero Balance Folios".</li>
                <li>Download the PDF (it may be password protected).</li>
              </ol>
            </div>

            <div className="space-y-4">
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="block w-full rounded-xl border border-[#D5D9CF] bg-white px-4 py-3 text-sm"
                disabled={isProcessing}
              />

              {selectedFile && (
                <div>
                  <label className="block text-sm font-medium text-[#1F2937]">
                    PDF Password {isPasswordProtected ? "(required)" : "(optional)"}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-2 block w-full rounded-xl border border-[#D5D9CF] bg-white px-4 py-3 text-sm"
                    disabled={isProcessing}
                  />
                </div>
              )}

              {error && <div className="text-sm text-red-600">{error}</div>}

              <button
                onClick={handleProcess}
                disabled={isProcessing || !selectedFile || (isPasswordProtected && !password)}
                className="inline-flex items-center rounded-full bg-[#4A5D4E] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-50"
              >
                {isProcessing ? "Processing..." : "Upload & Analyze"}
              </button>

              <button
                type="button"
                onClick={() => setDebugOpen((prev) => !prev)}
                className="text-xs uppercase tracking-[0.2em] text-[#6B7C70]"
              >
                {debugOpen ? "Hide" : "Show"} debug log
              </button>
            </div>

            {debugOpen && (
              <div className="rounded-2xl border border-[#E6E8E1] bg-[#FBFCFA] p-4 text-xs text-[#1F2937]">
                <div className="font-semibold text-[#1F2937]">Debug log</div>
                <div className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-[#6B7C70]">
                  {debugLogs.length ? debugLogs.join("\n") : "No debug events yet."}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
