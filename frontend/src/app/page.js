"use client";

import React, { useState, useEffect } from "react";
import { 
  Upload, 
  FileText, 
  HelpCircle, 
  RefreshCw, 
  ChevronRight, 
  Sparkles, 
  ArrowLeft, 
  AlertCircle,
  FileCheck2,
  FileCode
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

// Imports of custom components
import PersonaSelector from "@/components/persona-selector";
import DocumentViewer from "@/components/document-viewer";
import HealthDashboard from "@/components/health-dashboard";
import RiskRadar from "@/components/risk-radar";
import NegotiationHub from "@/components/negotiation-hub";
import ComplianceGuard from "@/components/compliance-guard";
import ChatAssistant from "@/components/chat-assistant";
import CompareContracts from "@/components/compare-contracts";

// Mock data & API wrappers
import { MOCK_CONTRACTS, MOCK_ANALYSES } from "@/lib/mock-data";
import { api } from "@/lib/api";

const PRELOADED_Demos = [
  {
    id: "employment",
    title: "Software Engineer Agreement",
    desc: "At-will clauses, 5-year non-competes, and code ownership.",
    defaultPersona: "Employee",
    contract: MOCK_CONTRACTS.employment
  },
  {
    id: "nda",
    title: "Mutual NDA (Confidentiality)",
    desc: "Unilateral disclosure rules and a low $500 liability cap.",
    defaultPersona: "StartupFounder",
    contract: MOCK_CONTRACTS.nda
  },
  {
    id: "lease",
    title: "Apartment Lease Agreement",
    desc: "Predatory late fees and unannounced landlord entry rights.",
    defaultPersona: "Tenant",
    contract: MOCK_CONTRACTS.lease
  }
];

export default function Home() {
  // Navigation Screens: "landing" | "processing" | "workspace"
  const [screen, setScreen] = useState("landing");
  const [loadingText, setLoadingText] = useState("Reading contract document...");
  
  // Workspace Session State
  const [activeContract, setActiveContract] = useState(null);
  const [currentPersona, setCurrentPersona] = useState("Employee");
  const [analysisData, setAnalysisData] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [activeTab, setActiveTab] = useState("health");
  
  // Highlight / Scroll Syncer
  const [highlightText, setHighlightText] = useState("");
  const [highlightSeverity, setHighlightSeverity] = useState("Medium");
  
  // Upload States
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Cycle loading messages during processing screen for aesthetic effect
  useEffect(() => {
    if (screen !== "processing") return;
    
    const messages = [
      "Extracting structure from PDF document...",
      "Analyzing clauses through the selected persona lens...",
      "Auditing compliance with local regulations...",
      "Generating negotiation suggestions...",
      "Mapping RAG chat workspace indexes...",
      "Finishing review workbook..."
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
    setCurrentPersona(demo.defaultPersona);
    setScreen("processing");
    
    // Simulate loading/analysis delay
    setTimeout(() => {
      const mockResult = MOCK_ANALYSES[demo.id][demo.defaultPersona];
      setAnalysisData(mockResult);
      setScreen("workspace");
      setActiveTab("health");
      setHighlightText("");
    }, 2000);
  };

  // Switch persona lens in workspace
  const handlePersonaChange = async (newPersona) => {
    setCurrentPersona(newPersona);
    setScreen("processing");
    setHighlightText("");

    if (isDemoMode) {
      setTimeout(() => {
        // Look up preset demo data, fallback to generic generator if unavailable
        const demoId = activeContract.id;
        const mockResult = MOCK_ANALYSES[demoId]?.[newPersona] || MOCK_ANALYSES.employment.Employee;
        setAnalysisData(mockResult);
        setScreen("workspace");
      }, 1200);
      return;
    }

    try {
      // Fetch fresh analysis from server with the new persona
      const data = await api.analyzeContract(activeContract.id, newPersona);
      setAnalysisData(data);
      setScreen("workspace");
    } catch (e) {
      console.error(e);
      // Fallback
      setScreen("workspace");
    }
  };

  // Upload handler for custom file
  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploadError("");
    setScreen("processing");
    setIsDemoMode(false);
    
    // Select default persona based on keyword guess
    const name = file.name.toLowerCase();
    let guessedPersona = "Employee";
    if (name.includes("nda") || name.includes("confidential")) {
      guessedPersona = "StartupFounder";
    } else if (name.includes("lease") || name.includes("rental")) {
      guessedPersona = "Tenant";
    } else if (name.includes("freelance") || name.includes("service")) {
      guessedPersona = "Freelancer";
    }
    
    setCurrentPersona(guessedPersona);

    try {
      // 1. Upload to backend (which parses text, saves in DB/S3)
      const contract = await api.uploadContract(file);
      setActiveContract(contract);

      // 2. Fetch analyze API
      const analysis = await api.analyzeContract(contract.id, guessedPersona);
      setAnalysisData(analysis);
      
      setScreen("workspace");
      setActiveTab("health");
      setHighlightText("");
    } catch (e) {
      console.error(e);
      setUploadError(e.message || "Failed to process contract. Make sure backend is running.");
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
      console.warn("Could not find trigger text in original contract text to replace.");
      return;
    }

    const updatedText = activeContract.raw_text.replace(originalText, proposedText);
    const updatedContract = { ...activeContract, raw_text: updatedText };
    setActiveContract(updatedContract);

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
    const updatedText = activeContract.raw_text + "\n\n/* Added Clause */\n" + boilerplate;
    const updatedContract = { ...activeContract, raw_text: updatedText };
    setActiveContract(updatedContract);

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
  };

  // Generate demo compliance mock data based on region
  const demoComplianceMock = (targetRegion) => {
    const defaultData = {
      report: [
        {
          area: "Employment Code",
          status: "Critical",
          description: `The unilateral termination triggers violate basic statutory codes governing employees in ${targetRegion}.`,
          recommendation: "Provide 30 days minimum notice or salary in lieu of notice."
        },
        {
          area: "Consumer Rights",
          status: "Warning",
          description: `Broad limitations of liability for damages might be declared unconscionable under the consumer statutes of ${targetRegion}.`,
          recommendation: "Cap liability to fees paid or insert exclusions for gross negligence."
        }
      ],
      disclaimer: `Disclaimer: This check audits the text against general codes in ${targetRegion}. It is not official legal counsel.`
    };

    // Personalize slightly
    if (targetRegion === "Sri Lanka") {
      defaultData.report.push({
        area: "Termination of Employment of Workmen Act",
        status: "Critical",
        description: "Workmen cannot have their services terminated at-will without Commissioner approval, unless for disciplinary reasons.",
        recommendation: "Ensure terms specify compliance with the TEWA Act for local hires."
      });
    } else if (targetRegion === "India") {
      defaultData.report.push({
        area: "Industrial Disputes Act / local Shops and Establishment Act",
        status: "Warning",
        description: "Severance packages and notice periods are governed by state-specific labor shops regulations.",
        recommendation: "Add 1-month notice and check state shops acts compliance."
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

    return `I am reviewing this ${activeContract.title} under the lens of an active **${currentPersona}**. It contains restrictive clauses regarding covenants, liability, and dispute locations. What specific clause can I explain for you?`;
  };

  // Demo comparison data
  const demoCompareData = [
    {
      parameter: "Termination Period",
      contract_a_value: activeContract?.id === "employment" ? "Immediate by Company / 60 days by Employee" : "Immediate",
      contract_b_value: "30 Days mutual notice",
      comparison_note: "Contract B provides balanced termination protections, avoiding sudden loss of income/tenancy."
    },
    {
      parameter: "IP Ownership",
      contract_a_value: activeContract?.id === "employment" ? "Company owns everything, including home projects" : "Royalty-free license to investor",
      contract_b_value: "Developer retains pre-existing tools; only services deliverables transferred",
      comparison_note: "Contract B secures your proprietary libraries and side projects."
    },
    {
      parameter: "Liability Limit",
      contract_a_value: activeContract?.id === "employment" ? "Employee personally liable for bugs/downtime" : "Capped at $500",
      contract_b_value: "No personal liability for developer; standard insurance coverage",
      comparison_note: "Contract B removes critical personal financial exposure."
    },
    {
      parameter: "Governing Law / Jurisdiction",
      contract_a_value: "State of Delaware",
      contract_b_value: "Mutual local state courts",
      comparison_note: "Contract B avoids expensive interstate litigation costs."
    }
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#080C14] text-[#F3F4F6] selection:bg-indigo-600/40 selection:text-white">
      
      {/* LANDING SCREEN */}
      {screen === "landing" && (
        <div className="flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto px-6 py-12">
          
          {/* Header Title */}
          <div className="text-center space-y-4 max-w-2xl mb-12 mt-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/40 border border-indigo-900/60 text-xs font-semibold text-indigo-400">
              <Sparkles className="w-3.5 h-3.5" />
              Contract Guardian AI Workspace
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Understand, analyze, and <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">improve contracts</span> with AI.
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed max-w-lg mx-auto">
              An advanced workspace that reviews agreements from your specific persona's perspective, audits regional laws, and helps you draft fairer terms.
            </p>
          </div>

          {/* Upload Drop Zone */}
          <div className="w-full max-w-2xl mb-12">
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`glass-panel rounded-2xl border-2 border-dashed p-10 text-center flex flex-col items-center justify-center transition-all duration-300 relative ${
                dragActive 
                  ? "border-indigo-500 bg-indigo-950/15 shadow-indigo-950/20 shadow-2xl" 
                  : "border-slate-800 bg-slate-900/10 hover:border-slate-700/80"
              }`}
            >
              <div className="w-14 h-14 rounded-full bg-slate-950/60 border border-slate-900/60 flex items-center justify-center mb-4 text-indigo-400">
                <Upload className="w-6 h-6 stroke-1.5" />
              </div>
              <div className="space-y-1.5 mb-6">
                <h3 className="text-sm font-bold text-slate-200">Drag & Drop Contract File</h3>
                <p className="text-xs text-slate-400 max-w-[280px]">
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
              <Button
                asChild
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-6 py-2 rounded-lg cursor-pointer shadow-lg shadow-indigo-600/10 h-9"
              >
                <label htmlFor="contract-upload">
                  Select Document
                </label>
              </Button>

              {uploadError && (
                <div className="mt-4 flex items-center gap-1.5 text-xs text-rose-400 bg-rose-950/20 border border-rose-900/40 px-3 py-1.5 rounded-lg">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Preset Demos Grid */}
          <div className="w-full space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
              <FileCheck2 className="w-4 h-4 text-indigo-400" />
              <h2 className="text-xs font-bold text-slate-350 uppercase tracking-wider">
                Or Start Instantly with a Demo Contract
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PRELOADED_Demos.map((demo) => (
                <Card 
                  key={demo.id} 
                  onClick={() => handleSelectDemo(demo)}
                  className="glass-panel border-slate-800/80 hover:border-indigo-500/30 p-5 cursor-pointer group hover:bg-indigo-950/5 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <CardContent className="p-0 space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">
                        {demo.title}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-450">
                      {demo.desc}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 uppercase tracking-wider pt-1">
                      Start Review <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Footer API Key Notice */}
          <div className="mt-16 flex items-center gap-2 text-[10px] text-slate-500 bg-slate-950/20 border border-slate-900 px-4 py-2 rounded-full">
            <FileCode className="w-3.5 h-3.5 text-indigo-400" />
            <span>Secure integration: API Keys are parsed on the server via `.env` file variables.</span>
          </div>

        </div>
      )}

      {/* PROCESSING SCREEN */}
      {screen === "processing" && (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#080C14]">
          <div className="space-y-6 text-center max-w-sm">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-indigo-900" />
              <div className="absolute inset-0 rounded-full border-2 border-t-indigo-400 animate-spin" />
              <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Analyzing Contract</h3>
              <p className="text-xs text-slate-400 leading-normal min-h-[40px] px-4">
                {loadingText}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* WORKSPACE VIEW (SPLIT-SCREEN) */}
      {screen === "workspace" && (
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          
          {/* Workspace Header */}
          <header className="px-6 py-3 bg-slate-950 border-b border-slate-900 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setScreen("landing")}
                className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-450 hover:text-white transition-colors"
                title="Back to Upload"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold tracking-tight text-white flex items-center gap-1">
                  Contract Guardian <span className="bg-indigo-600 text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider">AI</span>
                </span>
                <span className="text-slate-500">/</span>
                <span className="text-xs text-slate-350 max-w-[200px] truncate" title={activeContract?.title}>
                  {activeContract?.title}
                </span>
              </div>
            </div>

            {/* Persona Selector Trigger */}
            <PersonaSelector
              currentPersona={currentPersona}
              onChange={handlePersonaChange}
              disabled={false}
            />
          </header>

          {/* Workspace Layout Workspace grid */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-[#080C14]">
            
            {/* Left Pane: Document Viewer */}
            <div className="lg:col-span-6 p-4 overflow-hidden border-r border-slate-900/60 flex flex-col">
              <DocumentViewer
                rawText={activeContract?.raw_text}
                highlightText={highlightText}
                highlightSeverity={highlightSeverity}
                onSaveEdit={handleApplyRevision}
              />
            </div>

            {/* Right Pane: Analysis Tabs */}
            <div className="lg:col-span-6 p-4 overflow-hidden flex flex-col">
              <Tabs 
                value={activeTab} 
                onValueChange={setActiveTab}
                className="flex-1 flex flex-col overflow-hidden"
              >
                {/* Tabs Headers */}
                <TabsList className="bg-slate-950/60 border border-slate-900 p-0.5 rounded-lg shrink-0 mb-4 grid grid-cols-6 h-9">
                  <TabsTrigger value="health" className="text-[10px] font-semibold uppercase tracking-wider rounded-md py-1.5 cursor-pointer">
                    Dashboard
                  </TabsTrigger>
                  <TabsTrigger value="radar" className="text-[10px] font-semibold uppercase tracking-wider rounded-md py-1.5 cursor-pointer">
                    Risks
                  </TabsTrigger>
                  <TabsTrigger value="negotiation" className="text-[10px] font-semibold uppercase tracking-wider rounded-md py-1.5 cursor-pointer">
                    Negotiate
                  </TabsTrigger>
                  <TabsTrigger value="compliance" className="text-[10px] font-semibold uppercase tracking-wider rounded-md py-1.5 cursor-pointer">
                    Compliance
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="text-[10px] font-semibold uppercase tracking-wider rounded-md py-1.5 cursor-pointer">
                    Chat
                  </TabsTrigger>
                  <TabsTrigger value="compare" className="text-[10px] font-semibold uppercase tracking-wider rounded-md py-1.5 cursor-pointer">
                    Compare
                  </TabsTrigger>
                </TabsList>

                {/* Tabs Body Contents */}
                <div className="flex-1 overflow-y-auto pr-1">
                  
                  {/* Dashboard Tab */}
                  <TabsContent value="health" className="m-0 focus-visible:outline-none">
                    <HealthDashboard
                      analysis={analysisData}
                      onNavigateTab={handleNavigateTab}
                    />
                  </TabsContent>

                  {/* Risks Tab */}
                  <TabsContent value="radar" className="m-0 focus-visible:outline-none">
                    <RiskRadar
                      analysis={analysisData}
                      onHighlightTrigger={handleHighlightTrigger}
                      onApplyBoilerplate={handleApplyBoilerplate}
                    />
                  </TabsContent>

                  {/* Negotiation Tab */}
                  <TabsContent value="negotiation" className="m-0 focus-visible:outline-none">
                    <NegotiationHub
                      analysis={analysisData}
                      onApplyRevision={handleApplyRevision}
                    />
                  </TabsContent>

                  {/* Compliance Tab */}
                  <TabsContent value="compliance" className="m-0 focus-visible:outline-none">
                    <ComplianceGuard
                      contractId={activeContract?.id}
                      isDemoMode={isDemoMode}
                      demoComplianceData={demoComplianceMock}
                    />
                  </TabsContent>

                  {/* Chat Tab */}
                  <TabsContent value="chat" className="m-0 focus-visible:outline-none">
                    <ChatAssistant
                      contractId={activeContract?.id}
                      persona={currentPersona}
                      isDemoMode={isDemoMode}
                      demoChatMock={demoChatMock}
                    />
                  </TabsContent>

                  {/* Compare Tab */}
                  <TabsContent value="compare" className="m-0 focus-visible:outline-none">
                    <CompareContracts
                      contractA={activeContract}
                      isDemoMode={isDemoMode}
                      demoCompareData={demoCompareData}
                    />
                  </TabsContent>

                </div>
              </Tabs>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
