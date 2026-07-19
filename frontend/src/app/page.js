"use client";

import React, { useState, useEffect } from "react";
import {
  Upload,
  FileText,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  AlertCircle,
  FileCheck2,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

// Imports of custom components
import PartySelector from "@/components/persona-selector";
import DocumentViewer from "@/components/document-viewer";
import HealthDashboard from "@/components/health-dashboard";
import RiskRadar from "@/components/risk-radar";
import NegotiationHub from "@/components/negotiation-hub";
import ComplianceGuard from "@/components/compliance-guard";
import ChatAssistant from "@/components/chat-assistant";
import ThemeSelector from "@/components/theme-selector";

// Mock data & API wrappers
import { MOCK_CONTRACTS, MOCK_ANALYSES } from "@/lib/mock-data";
import { api } from "@/lib/api";

const PRELOADED_Demos = [
  {
    id: "employment",
    title: "Software Engineer Agreement",
    desc: "At-will clauses, 5-year non-competes, and code ownership.",
    defaultPersona: "Employee",
    contract: MOCK_CONTRACTS.employment,
  },
  {
    id: "nda",
    title: "Mutual NDA (Confidentiality)",
    desc: "Unilateral disclosure rules and a low $500 liability cap.",
    defaultPersona: "StartupFounder",
    contract: MOCK_CONTRACTS.nda,
  },
  {
    id: "lease",
    title: "Apartment Lease Agreement",
    desc: "Predatory late fees and unannounced landlord entry rights.",
    defaultPersona: "Tenant",
    contract: MOCK_CONTRACTS.lease,
  },
];

const MAX_REANALYSES_PER_SESSION = 5;

export default function Home() {
  // Set this to true to boot directly into the workspace with mock data for UI polishing.
  // Set to false for the production upload flow.
  const DEV_DIRECT_WORKSPACE = false;

  // Navigation Screens: "landing" | "processing" | "workspace"
  const [screen, setScreen] = useState(
    DEV_DIRECT_WORKSPACE ? "workspace" : "landing",
  );
  const [loadingText, setLoadingText] = useState(
    "Reading contract document...",
  );

  // Workspace Session State
  const [activeContract, setActiveContract] = useState(
    DEV_DIRECT_WORKSPACE ? MOCK_CONTRACTS.employment : null,
  );
  const [analysisData, setAnalysisData] = useState(
    DEV_DIRECT_WORKSPACE ? MOCK_ANALYSES.employment : null,
  );
  const [activeParty, setActiveParty] = useState(
    DEV_DIRECT_WORKSPACE ? MOCK_ANALYSES.employment.parties[0] : null,
  );
  const [isDemoMode, setIsDemoMode] = useState(
    DEV_DIRECT_WORKSPACE ? true : false,
  );
  const [activeTab, setActiveTab] = useState("health");
  const [analysisStale, setAnalysisStale] = useState(false);
  const [isAnalyzingDraft, setIsAnalyzingDraft] = useState(false);
  const [remainingReanalyses, setRemainingReanalyses] = useState(
    MAX_REANALYSES_PER_SESSION,
  );
  const [isEditorVisible, setIsEditorVisible] = useState(true);

  // Highlight / Scroll Syncer
  const [highlightText, setHighlightText] = useState("");
  const [highlightSeverity, setHighlightSeverity] = useState("Medium");

  // Upload States
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Quota Status State
  const [quotaStatus, setQuotaStatus] = useState(null);

  const checkQuotaExceeded = async (error) => {
    if (error?.message?.toLowerCase().includes("quota") || error?.message?.toLowerCase().includes("limit")) {
      try {
        const status = await api.getQuotaStatus();
        setQuotaStatus(status);
      } catch (err) {
        console.error("Failed to check quota limit", err);
      }
    }
  };

  // Fetch daily token quota on mount
  useEffect(() => {
    const fetchQuota = async () => {
      try {
        const status = await api.getQuotaStatus();
        setQuotaStatus(status);
      } catch (e) {
        console.error("Failed to fetch daily token quota status", e);
      }
    };
    fetchQuota();
  }, []);

  // Cycle loading messages during processing screen for aesthetic effect
  useEffect(() => {
    if (screen !== "processing") return;

    const messages = [
      "Extracting structure from PDF document...",
      "Analyzing clauses for all contracting parties...",
      "Auditing compliance with local regulations...",
      "Generating negotiation suggestions...",
      "Mapping RAG chat workspace indexes...",
      "Finishing analysis workbook...",
    ];

    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setLoadingText(messages[index]);
    }, 1500);

    return () => clearInterval(interval);
  }, [screen]);

  // Handle sample demo start
  const handleSelectDemo = (demo) => {
    setIsDemoMode(true);
    setActiveContract(demo.contract);
    setScreen("processing");

    // Simulate loading/analysis delay
    setTimeout(() => {
      const mockResult = MOCK_ANALYSES[demo.id];
      setAnalysisData(mockResult);
      if (mockResult?.parties?.length > 0) {
        setActiveParty(mockResult.parties[0]);
      } else {
        setActiveParty(null);
      }
      setScreen("workspace");
      setActiveTab("health");
      setHighlightText("");
      setAnalysisStale(false);
    }, 2000);
  };

  // Switch party lens in workspace
  const handlePartyChange = (party) => {
    setActiveParty(party);
    setHighlightText("");
  };

  // Upload handler for custom file
  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploadError("");
    setScreen("processing");
    setIsDemoMode(false);

    try {
      // 1. Upload to backend (which parses text, saves in DB/S3)
      const contract = await api.uploadContract(file);
      setActiveContract(contract);

      // 2. Fetch analyze API
      const analysis = await api.analyzeContract(contract.id);
      setAnalysisData(analysis);
      if (analysis?.parties?.length > 0) {
        setActiveParty(analysis.parties[0]);
      } else {
        setActiveParty(null);
      }

      setScreen("workspace");
      setActiveTab("health");
      setHighlightText("");
      setAnalysisStale(false);
    } catch (e) {
      console.error(e);
      checkQuotaExceeded(e);
      setUploadError(
        e.message ||
          "Failed to process contract. Make sure backend is running.",
      );
      setScreen("landing");
    }
  };

  // Drag-and-drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Apply suggest rewrite into the local editor text
  const handleApplyRevision = async (originalText, proposedText) => {
    const textIndex = activeContract.raw_text.indexOf(originalText);
    if (textIndex === -1) {
      console.warn(
        "Could not find trigger text in original contract text to replace.",
      );
      return;
    }

    const updatedText = activeContract.raw_text.replace(
      originalText,
      proposedText,
    );
    const updatedContract = { ...activeContract, raw_text: updatedText };
    setActiveContract(updatedContract);
    setAnalysisStale(true);

    if (isDemoMode) {
      // In demo mode, we just update local state
      return;
    }

    try {
      // In live mode, save edit to backend (which clears backend cache)
      await api.editContractText(activeContract.id, updatedText);
    } catch (e) {
      console.error("Failed to sync edited draft to server", e);
    }
  };

  // Apply boilerplate missing clauses to the bottom of draft
  const handleApplyBoilerplate = async (boilerplate) => {
    const updatedText =
      activeContract.raw_text + "\n\n/* Added Clause */\n" + boilerplate;
    const updatedContract = { ...activeContract, raw_text: updatedText };
    setActiveContract(updatedContract);
    setAnalysisStale(true);

    if (!isDemoMode) {
      try {
        await api.editContractText(activeContract.id, updatedText);
      } catch (e) {
        console.error("Failed to append boilerplate to server", e);
      }
    }
  };

  // Navigate Tabs
  const handleNavigateTab = (tabName) => {
    setActiveTab(tabName);
  };

  // Locate and scroll to text
  const handleHighlightTrigger = (text, severity) => {
    setHighlightText(text);
    setHighlightSeverity(severity);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setActiveTab("document");
    }
  };

  const refreshAnalysisForDraft = async (updatedText) => {
    const updatedContract = {
      ...activeContract,
      raw_text: updatedText,
    };
    setActiveContract(updatedContract);
    setIsAnalyzingDraft(true);

    try {
      if (isDemoMode) {
        setAnalysisStale(false);
        return;
      }

      if (!activeContract?.id) return;

      if (remainingReanalyses <= 0) {
        throw new Error("No re-analyses remaining for this session.");
      }

      await api.editContractText(activeContract.id, updatedText);
      const freshAnalysis = await api.analyzeContract(activeContract.id);
      setAnalysisData(freshAnalysis);
      if (freshAnalysis?.parties?.length > 0) {
        const matching = freshAnalysis.parties.find(
          p => p.partyName === activeParty?.partyName
        ) || freshAnalysis.parties[0];
        setActiveParty(matching);
      } else {
        setActiveParty(null);
      }
      setRemainingReanalyses((remaining) => Math.max(remaining - 1, 0));
      setAnalysisStale(false);
      setActiveTab("health");
      setHighlightText("");
    } catch (e) {
      console.error("Failed to refresh analysis after draft edit", e);
      checkQuotaExceeded(e);
      setAnalysisStale(true);
      throw e;
    } finally {
      setIsAnalyzingDraft(false);
    }
  };

  const saveDraftWithoutAnalysis = async (updatedText) => {
    const updatedContract = {
      ...activeContract,
      raw_text: updatedText,
    };
    setActiveContract(updatedContract);
    setAnalysisStale(true);

    if (!isDemoMode && activeContract?.id) {
      await api.editContractText(activeContract.id, updatedText);
    }
  };

  // Generate demo compliance mock data based on region
  const demoComplianceMock = (targetRegion) => {
    const defaultData = {
      report: [
        {
          area: "Employment Code",
          status: "Critical",
          description: `The unilateral termination triggers violate basic statutory codes governing employees in ${targetRegion}.`,
          recommendation:
            "Provide 30 days minimum notice or salary in lieu of notice.",
        },
        {
          area: "Consumer Rights",
          status: "Warning",
          description: `Broad limitations of liability for damages might be declared unconscionable under the consumer statutes of ${targetRegion}.`,
          recommendation:
            "Cap liability to fees paid or insert exclusions for gross negligence.",
        },
      ],
      disclaimer: `Disclaimer: This check audits the text against general codes in ${targetRegion}. It is not official legal counsel.`,
    };

    // Personalize slightly
    if (targetRegion === "Sri Lanka") {
      defaultData.report.push({
        area: "Termination of Employment of Workmen Act",
        status: "Critical",
        description:
          "Workmen cannot have their services terminated at-will without Commissioner approval, unless for disciplinary reasons.",
        recommendation:
          "Ensure terms specify compliance with the TEWA Act for local hires.",
      });
    } else if (targetRegion === "India") {
      defaultData.report.push({
        area: "Industrial Disputes Act / local Shops and Establishment Act",
        status: "Warning",
        description:
          "Severance packages and notice periods are governed by state-specific labor shops regulations.",
        recommendation:
          "Add 1-month notice and check state shops acts compliance.",
      });
    }

    return defaultData;
  };

  // Generate demo chat mock data
  const demoChatMock = (question) => {
    const q = question.toLowerCase();
    const demoId = activeContract.id;

    if (q.includes("terminate") || q.includes("notice")) {
      if (demoId === "employment") {
        return "As an **Employee**, the contract is highly unfair: the company can fire you instantly, but you must give 60 days' notice. Under our proposed wording, both parties get a mutual 30-day notice period.";
      } else if (demoId === "lease") {
        return "Under Section 4, the lease automatically renews for 12 months with a 15% increase unless you send a written non-renewal notice 90 days early. This is an extremely long window.";
      }
      return "The contract specifies unilateral termination rights. Check the **Negotiation Suggestions** tab to view mutual notice wording.";
    }

    if (q.includes("ip") || q.includes("intellectual") || q.includes("owns")) {
      if (demoId === "employment") {
        return "Nexus Tech Solutions claims absolute ownership over all IP you create 'on your own time at home'. This is risky. We suggest carving out pre-existing IP and code created outside of work.";
      } else if (demoId === "nda") {
        return "Section 5 specifies that Venture Capital Partners receives a royalty-free license to use any feedback or product ideas you share. They could implement your ideas in competitor portfolios.";
      }
      return "All intellectual property rights are currently assigned fully to the counterparty. We recommend reserving ownership of pre-existing intellectual assets.";
    }

    if (q.includes("pay") || q.includes("fees") || q.includes("salary")) {
      if (demoId === "employment") {
        return "Your salary is $4,500/month. The contract notes that no overtime compensation will be paid, meaning you will work extra hours for free.";
      } else if (demoId === "lease") {
        return "The rent is $1,800/month. If paid on Day 2, you are fined $250 immediately, plus $50/day. This late penalty is excessively high and likely illegal.";
      }
      return "Payment is scheduled monthly. It lacks provisions protecting you from late payments (like interest fees).";
    }

    return `I am analyzing this ${activeContract.title} on behalf of **${activeParty?.partyName} (${activeParty?.partyRole})**. It contains restrictive clauses regarding covenants, liability, and dispute locations. What specific clause can I explain for you?`;
  };

  return (
    <div className="relative isolate flex-1 flex flex-col min-h-screen bg-transparent text-foreground selection:bg-indigo-600/40 selection:text-white">
      <div className="app-animated-bg" aria-hidden="true" />

      {/* QUOTA LIMIT GUARD OVERLAY */}
      {quotaStatus?.is_blocked && (
        <div className="fixed inset-0 z-50 flex h-dvh w-full flex-col items-center justify-center bg-slate-900/90 dark:bg-slate-950/95 backdrop-blur-md px-6 text-center">
          <div className="max-w-md w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto animate-pulse animate-duration-1000">
              <AlertCircle className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                Daily API Limit Reached
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                The Gemini AI token daily usage limit has been exceeded. To prevent unexpected costs, the application is temporarily disabled.
              </p>
            </div>

            <div className="p-4 bg-slate-100 dark:bg-slate-950/50 rounded-xl border border-slate-200/50 dark:border-slate-800/50 text-left space-y-2.5">
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>Daily Limit:</span>
                <span className="text-slate-800 dark:text-slate-200">{quotaStatus.limit?.toLocaleString()} tokens</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>Today's Usage:</span>
                <span className="text-rose-500">{quotaStatus.used?.toLocaleString()} tokens</span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-800 pt-2.5 flex justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                <span>Next Available Time:</span>
                <span className="text-indigo-500 dark:text-indigo-400">{quotaStatus.next_available}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* LANDING SCREEN */}
      {screen === "landing" && (
        <div className="relative z-10 flex min-h-screen w-full flex-col">
          {/* Landing Header */}
          <header className="w-full flex items-center justify-between px-5 py-3 max-w-6xl mx-auto shrink-0">
            <span className="text-xs sm:text-sm font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
              Contract Guardian{" "}
              <span className="bg-indigo-600 text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                AI
              </span>
            </span>
            <ThemeSelector />
          </header>

          <main className="flex flex-1 flex-col items-center justify-start lg:justify-center max-w-6xl mx-auto px-5 py-6 md:py-12 w-full">
            {/* Header Title */}
            <div className="text-center space-y-3 max-w-2xl mb-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-3.5 h-3.5" />
                Contract Guardian AI Workspace
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl xl:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                Understand, analyze, and{" "}
                <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
                  improve contracts
                </span>{" "}
                with AI.
              </h1>
              <p className="hidden sm:block text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mx-auto">
                An advanced workspace that auto-detects contracting parties, analyzes agreements from
                each party's perspective, audits regional laws, and helps you draft
                fairer terms.
              </p>
            </div>

            {/* Upload Drop Zone */}
            <div className="w-full max-w-2xl mb-5">
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`glass-panel rounded-xl border-2 border-dashed px-8 py-5 text-center flex flex-col items-center justify-center transition-all duration-300 relative ${
                  dragActive
                    ? "border-indigo-500 bg-indigo-950/15 shadow-indigo-950/20 shadow-2xl"
                    : "border-slate-300 dark:border-slate-800 bg-slate-100/10 dark:bg-slate-900/10 hover:border-indigo-500/50"
                }`}
              >
                <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-900/60 flex items-center justify-center mb-3 text-indigo-400">
                  <Upload className="w-5 h-5 stroke-1.5" />
                </div>
                <div className="space-y-1 mb-4 font-sans">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200">
                    Drag & Drop Contract File
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-300 max-w-[280px]">
                    Supports PDF or TXT files. Maximum size 10MB.
                  </p>
                </div>

                <input
                  type="file"
                  id="contract-upload"
                  className="hidden"
                  accept=".pdf,.txt"
                  onChange={(e) => handleFileUpload(e.target.files?.[0])}
                />
                <label
                  htmlFor="contract-upload"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-6 py-2 rounded-lg cursor-pointer shadow-lg shadow-indigo-600/10 h-9 inline-flex items-center justify-center transition-all"
                >
                  Select Document
                </label>

                {uploadError && (
                  <div className="mt-4 flex items-center gap-1.5 text-xs text-rose-500 bg-rose-950/20 border border-rose-900/40 px-3 py-1.5 rounded-lg">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Preset Demos Grid */}
            <div className="w-full space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-900 pb-1.5">
                <FileCheck2 className="w-4 h-4 text-indigo-400" />
                <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Or Start Instantly with a Demo Contract
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4">
                {PRELOADED_Demos.map((demo) => (
                  <Card
                    key={demo.id}
                    onClick={() => handleSelectDemo(demo)}
                    className="glass-panel border-slate-200 dark:border-slate-800/80 hover:border-indigo-500/30 p-3 md:p-4 cursor-pointer group hover:bg-indigo-950/5 hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <CardContent className="p-0 space-y-2">
                      <div className="flex flex-col items-start gap-1 md:flex-row md:items-center md:gap-2">
                        <FileText className="w-4 h-4 shrink-0 text-indigo-400" />
                        <span className="text-[11px] md:text-sm font-bold leading-tight text-slate-800 dark:text-slate-200 group-hover:text-indigo-400 transition-colors">
                          {demo.title}
                        </span>
                      </div>
                      <p className="text-xs leading-snug text-slate-600 dark:text-slate-300">
                        {demo.desc}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] md:text-xs font-bold text-indigo-400 uppercase tracking-wider font-sans">
                        Start Review{" "}
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </main>

          {/* Landing Page Footer */}
          <footer className="w-full bg-card/30 border-t border-border/80 px-5 py-3 shrink-0">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 text-left">
              <div className="space-y-0.5 shrink-0">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1 justify-center md:justify-start">
                  Contract Guardian{" "}
                  <span className="bg-indigo-600 text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                    AI
                  </span>
                </span>
                <p className="text-[10px] text-slate-500 dark:text-slate-500">
                  © 2026 Contract Guardian AI. All rights reserved.
                </p>
              </div>
              <p className="hidden md:block text-[10px] text-slate-500 dark:text-slate-500 max-w-2xl leading-snug text-right">
                Disclaimer: Contract Guardian AI uses artificial intelligence to
                analyze documents and draft suggestions. It is not a law firm
                and does not provide formal legal counsel or represent legal
                representation. Use of this tool is for educational and
                reference purposes only.
              </p>
            </div>
          </footer>
        </div>
      )}

      {/* PROCESSING SCREEN */}
      {screen === "processing" && (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
          <div className="space-y-6 text-center max-w-sm">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-indigo-900" />
              <div className="absolute inset-0 rounded-full border-2 border-t-indigo-400 animate-spin" />
              <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Analyzing Contract
              </h3>
              <p className="text-xs text-slate-400 leading-normal min-h-[40px] px-4">
                {loadingText}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* WORKSPACE VIEW (SPLIT-SCREEN) */}
      {screen === "workspace" && (
        <div className="fixed inset-0 z-50 isolate flex h-dvh flex-col overflow-hidden bg-transparent text-slate-950 dark:text-slate-50">
          <div className="app-animated-bg" aria-hidden="true" />
          {/* Workspace Header */}
          <header className="relative z-20 shrink-0 border-b border-slate-200 bg-white/85 px-4 py-3 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/85 lg:px-6">
            <div className="flex min-h-9 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  onClick={() => setScreen("landing")}
                  className="p-1.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  title="Back to Upload"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>

                <div className="flex min-w-0 items-center gap-2">
                  <span className="shrink-0 text-sm font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
                    Contract Guardian{" "}
                    <span className="bg-indigo-600 text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      AI
                    </span>
                  </span>
                  <span className="shrink-0 text-slate-500">/</span>
                  <span
                    className="min-w-0 truncate text-xs text-slate-700 dark:text-slate-300 sm:max-w-[220px] font-medium"
                    title={activeContract?.title}
                  >
                    {activeContract?.title}
                  </span>
                </div>
              </div>

              {/* Controls: Theme & Persona */}
              <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto sm:justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditorVisible((visible) => !visible)}
                  className="hidden lg:inline-flex h-9 rounded-md border border-slate-200 bg-white/80 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-800"
                  title={
                    isEditorVisible ? "Hide live editor" : "Show live editor"
                  }
                >
                  {isEditorVisible ? (
                    <PanelRightClose className="mr-1.5 h-3.5 w-3.5" />
                  ) : (
                    <PanelRightOpen className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {isEditorVisible ? "Hide Editor" : "Show Editor"}
                </Button>
                <ThemeSelector />
                <PartySelector
                  parties={analysisData?.parties || []}
                  activeParty={activeParty}
                  onChange={handlePartyChange}
                  disabled={false}
                />
              </div>
            </div>
          </header>

          {/* Workspace Layout */}
          <div className="relative z-10 flex-1 min-h-0 overflow-hidden bg-transparent">
            <div
              className={`mx-auto grid h-full min-h-0 gap-4 p-4 transition-[max-width] duration-300 lg:p-6 xl:gap-6 ${
                isEditorVisible
                  ? "w-full max-w-none grid-cols-1 grid-rows-1 lg:grid-cols-[minmax(0,1fr)_minmax(340px,480px)] lg:grid-rows-1 xl:grid-cols-[minmax(0,1fr)_minmax(380px,520px)]"
                  : "w-full max-w-6xl grid-cols-1 grid-rows-1"
              }`}
            >
              {/* Analysis Tabs */}
              <section className="flex min-h-0 min-w-0 flex-col overflow-hidden">
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="min-h-0 flex-1 overflow-hidden"
                >
                  {/* Tabs Headers */}
                  <TabsList className="mb-4 flex h-auto w-full shrink-0 flex-wrap rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-800 dark:bg-slate-800/80 sm:h-10 sm:flex-nowrap">
                    <TabsTrigger
                      value="health"
                      className="min-w-[92px] flex-1 cursor-pointer rounded-md px-2 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 data-active:bg-white data-active:text-slate-900 dark:text-slate-400 dark:data-active:bg-slate-900 dark:data-active:text-slate-100 sm:px-3 sm:py-1.5"
                    >
                      Dashboard
                    </TabsTrigger>
                    <TabsTrigger
                      value="radar"
                      className="min-w-[92px] flex-1 cursor-pointer rounded-md px-2 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 data-active:bg-white data-active:text-slate-900 dark:text-slate-400 dark:data-active:bg-slate-900 dark:data-active:text-slate-100 sm:px-3 sm:py-1.5"
                    >
                      Risks
                    </TabsTrigger>
                    <TabsTrigger
                      value="negotiation"
                      className="min-w-[92px] flex-1 cursor-pointer rounded-md px-2 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 data-active:bg-white data-active:text-slate-900 dark:text-slate-400 dark:data-active:bg-slate-900 dark:data-active:text-slate-100 sm:px-3 sm:py-1.5"
                    >
                      Negotiate
                    </TabsTrigger>
                    <TabsTrigger
                      value="compliance"
                      className="min-w-[92px] flex-1 cursor-pointer rounded-md px-2 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 data-active:bg-white data-active:text-slate-900 dark:text-slate-400 dark:data-active:bg-slate-900 dark:data-active:text-slate-100 sm:px-3 sm:py-1.5"
                    >
                      Compliance
                    </TabsTrigger>
                    <TabsTrigger
                      value="chat"
                      className="min-w-[92px] flex-1 cursor-pointer rounded-md px-2 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 data-active:bg-white data-active:text-slate-900 dark:text-slate-400 dark:data-active:bg-slate-900 dark:data-active:text-slate-100 sm:px-3 sm:py-1.5"
                    >
                      Chat
                    </TabsTrigger>
                    <TabsTrigger
                      value="document"
                      className="lg:hidden min-w-[92px] flex-1 cursor-pointer rounded-md px-2 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 data-active:bg-white data-active:text-slate-900 dark:text-slate-400 dark:data-active:bg-slate-900 dark:data-active:text-slate-100 sm:px-3 sm:py-1.5"
                    >
                      Contract
                    </TabsTrigger>
                  </TabsList>

                  {/* Tabs Body Contents */}
                  <div className="min-h-0 flex-1 flex flex-col min-w-0">
                    {/* Dashboard Tab */}
                    <TabsContent
                      value="health"
                      className="m-0 focus-visible:outline-none flex-1 overflow-y-auto overscroll-contain pr-1 [scrollbar-gutter:stable]"
                    >
                      <HealthDashboard
                        analysis={activeParty}
                        onNavigateTab={handleNavigateTab}
                      />
                    </TabsContent>

                    {/* Risks Tab */}
                    <TabsContent
                      value="radar"
                      className="m-0 focus-visible:outline-none flex-1 overflow-y-auto overscroll-contain pr-1 [scrollbar-gutter:stable]"
                    >
                      <RiskRadar
                        analysis={activeParty}
                        onHighlightTrigger={handleHighlightTrigger}
                        onApplyBoilerplate={handleApplyBoilerplate}
                      />
                    </TabsContent>

                    {/* Negotiation Tab */}
                    <TabsContent
                      value="negotiation"
                      className="m-0 focus-visible:outline-none flex-1 overflow-y-auto overscroll-contain pr-1 [scrollbar-gutter:stable]"
                    >
                      <NegotiationHub
                        analysis={activeParty}
                        onApplyRevision={handleApplyRevision}
                      />
                    </TabsContent>

                    {/* Compliance Tab */}
                    <TabsContent
                      value="compliance"
                      className="m-0 focus-visible:outline-none flex-1 overflow-y-auto overscroll-contain pr-1 [scrollbar-gutter:stable]"
                    >
                      <ComplianceGuard
                        contractId={activeContract?.id}
                        isDemoMode={isDemoMode}
                        demoComplianceData={demoComplianceMock}
                      />
                    </TabsContent>

                    {/* Chat Tab */}
                    <TabsContent
                      value="chat"
                      className="m-0 focus-visible:outline-none flex-1 flex flex-col min-h-0"
                    >
                      <ChatAssistant
                        contractId={activeContract?.id}
                        persona={activeParty ? `${activeParty.partyName} (${activeParty.partyRole})` : ""}
                        isDemoMode={isDemoMode}
                        demoChatMock={demoChatMock}
                        className="flex-1"
                      />
                    </TabsContent>

                    {/* Mobile Document Tab */}
                    <TabsContent
                      value="document"
                      className="m-0 focus-visible:outline-none lg:hidden flex-1 flex flex-col min-h-0"
                    >
                      <DocumentViewer
                        rawText={activeContract?.raw_text || ""}
                        highlightText={highlightText}
                        highlightSeverity={highlightSeverity}
                        onSaveDraft={saveDraftWithoutAnalysis}
                        onSaveEdit={refreshAnalysisForDraft}
                        analysisStale={analysisStale}
                        isAnalyzingDraft={isAnalyzingDraft}
                        remainingReanalyses={remainingReanalyses}
                        className="flex-1"
                      />
                    </TabsContent>
                  </div>
                </Tabs>
              </section>

              {isEditorVisible && (
                <aside className="hidden lg:block min-h-0 min-w-0 overflow-hidden">
                  <DocumentViewer
                    rawText={activeContract?.raw_text || ""}
                    highlightText={highlightText}
                    highlightSeverity={highlightSeverity}
                    onSaveDraft={saveDraftWithoutAnalysis}
                    onSaveEdit={refreshAnalysisForDraft}
                    analysisStale={analysisStale}
                    isAnalyzingDraft={isAnalyzingDraft}
                    remainingReanalyses={remainingReanalyses}
                  />
                </aside>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
