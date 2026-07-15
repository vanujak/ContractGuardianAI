import React, { useEffect, useRef, useState } from "react";
import { Edit2, Download, Check, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DocumentViewer({
  rawText,
  highlightText,
  highlightSeverity,
  onSaveDraft,
  onSaveEdit,
  analysisStale = false,
  isAnalyzingDraft = false,
  remainingReanalyses = 0,
  className
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(rawText);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  
  const highlightedRef = useRef(null);
  const containerRef = useRef(null);

  // Sync state if rawText changes
  useEffect(() => {
    setEditedText(rawText);
  }, [rawText]);

  // Scroll to highlight
  useEffect(() => {
    if (highlightText && highlightedRef.current) {
      setTimeout(() => {
        highlightedRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }, 100);
    }
  }, [highlightText, highlightSeverity]);

  // Handler for saving edits
  const handleSaveDraft = async () => {
    setSaveError("");
    try {
      await onSaveDraft(editedText);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e) {
      console.error("Failed to save draft", e);
      setSaveError("Save failed");
    }
  };

  const handleSaveAndReanalyze = async () => {
    setSaveError("");
    if (remainingReanalyses <= 0) {
      setSaveError("No re-analyses left");
      return;
    }

    try {
      await onSaveEdit(editedText);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e) {
      console.error("Failed to save and refresh draft", e);
      setSaveError("Refresh failed");
    }
  };

  const handleRefreshCurrentDraft = async () => {
    setSaveError("");
    if (remainingReanalyses <= 0) {
      setSaveError("No re-analyses left");
      return;
    }

    try {
      await onSaveEdit(rawText);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e) {
      console.error("Failed to refresh draft analysis", e);
      setSaveError("Refresh failed");
    }
  };

  // Download contract text
  const handleDownload = () => {
    const blob = new Blob([rawText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Negotiated_Contract_Draft.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  // Helper to split text by paragraphs and highlight search terms
  const renderParagraphs = () => {
    if (!rawText) return null;

    const paragraphs = rawText.split("\n\n");
    let globalLineNumber = 1;

    return paragraphs.map((para, pIdx) => {
      const lines = para.split("\n");
      const startLine = globalLineNumber;
      globalLineNumber += lines.length;
      
      const containsTrigger = highlightText && para.toLowerCase().includes(highlightText.toLowerCase());

      // If it contains the trigger text, split and inject the highlight span
      if (containsTrigger) {
        // Find exact start and end in a case-insensitive manner
        const triggerIndex = para.toLowerCase().indexOf(highlightText.toLowerCase());
        const exactTriggerText = para.substring(triggerIndex, triggerIndex + highlightText.length);
        
        const before = para.substring(0, triggerIndex);
        const after = para.substring(triggerIndex + highlightText.length);

        const highlightClass = 
          highlightSeverity === "High" 
            ? "target-highlight-critical font-semibold" 
            : highlightSeverity === "Medium"
            ? "target-highlight-warning font-semibold"
            : "target-highlight-safe font-semibold";

        return (
          <div 
            key={pIdx} 
            ref={highlightedRef} 
            className="flex items-start gap-4 py-1.5 border-l-2 border-indigo-500/80 bg-indigo-950/10 px-2 my-2 transition-all duration-300"
          >
            <div className="text-[10px] font-mono text-slate-400 w-8 select-none pt-0.5 text-right font-semibold">
              L{startLine}
            </div>
            <p className="flex-1 text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
              {before}
              <span className={highlightClass}>
                {exactTriggerText}
              </span>
              {after}
            </p>
          </div>
        );
      }

      // Normal paragraph
      return (
        <div key={pIdx} className="flex items-start gap-4 py-1 border-l-2 border-transparent px-2 hover:bg-slate-900/10 dark:hover:bg-slate-900/20 transition-colors">
          <div className="text-[10px] font-mono text-slate-500 w-8 select-none pt-0.5 text-right">
            L{startLine}
          </div>
          <p className="flex-1 text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
            {para}
          </p>
        </div>
      );
    });
  };

  return (
    <div className={cn("flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900", className)}>
      
      {/* Viewer Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <FileText className="h-4 w-4 shrink-0 text-indigo-500 dark:text-indigo-400" />
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                Live Contract Editor
              </h2>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {isAnalyzingDraft
                  ? "Refreshing analysis"
                  : isEditing
                    ? "Editing draft"
                    : analysisStale
                      ? "Analysis needs refresh"
                      : "Review mode"}
              </p>
            </div>
          </div>
          {saveSuccess && (
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/30 px-2 py-0.5 border border-emerald-800/30 rounded flex items-center gap-1 animate-pulse">
              <Check className="w-3 h-3" /> Draft Updated
            </span>
          )}
          {saveError && (
            <span className="text-[10px] text-rose-500 font-bold bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 border border-rose-200 dark:border-rose-900/50 rounded">
              {saveError}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {isEditing ? (
            <>
              <span
                className={`hidden items-center rounded border px-2 text-[10px] font-semibold uppercase tracking-wider lg:inline-flex ${
                  remainingReanalyses > 0
                    ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-400"
                    : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400"
                }`}
              >
                {remainingReanalyses} left
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditedText(rawText);
                  setIsEditing(false);
                }}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 h-7 text-[11px] rounded px-3"
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                disabled={isAnalyzingDraft}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 h-7 text-[11px] rounded px-3"
              >
                Save Draft
              </Button>
              <Button
                size="sm"
                onClick={handleSaveAndReanalyze}
                disabled={isAnalyzingDraft || remainingReanalyses <= 0}
                className="bg-indigo-600 hover:bg-indigo-700 text-white h-7 text-[11px] rounded px-3 font-semibold disabled:opacity-60"
              >
                {isAnalyzingDraft ? "Refreshing..." : "Save & Re-analyze"}
              </Button>
            </>
          ) : (
            <>
              <span
                className={`hidden items-center rounded border px-2 text-[10px] font-semibold uppercase tracking-wider sm:inline-flex ${
                  remainingReanalyses > 0
                    ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-400"
                    : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400"
                }`}
              >
                {remainingReanalyses} re-analyses left
              </span>
              {analysisStale && (
                <span className="hidden items-center rounded border border-amber-200 bg-amber-50 px-2 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400 sm:inline-flex">
                  Outdated
                </span>
              )}
              {analysisStale && (
                <Button
                  size="sm"
                  onClick={handleRefreshCurrentDraft}
                  disabled={isAnalyzingDraft || remainingReanalyses <= 0}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white h-7 text-[11px] rounded px-3 font-semibold disabled:opacity-60"
                >
                  {isAnalyzingDraft ? "Refreshing..." : "Re-analyze"}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                disabled={isAnalyzingDraft}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 h-7 text-[11px] rounded px-3"
              >
                <Edit2 className="w-3 h-3 mr-1" /> Edit Text
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 h-7 text-[11px] rounded px-3"
              >
                <Download className="w-3 h-3 mr-1" /> Download
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Editor or Viewer Body */}
      <div 
        ref={containerRef} 
        className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white p-4 [scrollbar-gutter:stable] dark:bg-slate-900"
      >
        {/* Glow scan indicator when changing persona */}
        {highlightText && (
          <div className="absolute left-0 w-full h-[1px] bg-indigo-500/25 scan-line select-none pointer-events-none" />
        )}

        {isEditing ? (
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="h-full min-h-0 w-full resize-none rounded border border-slate-200 bg-white p-4 font-mono text-sm leading-relaxed text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          />
        ) : (
          <div className="space-y-1 font-mono">
            {renderParagraphs()}
          </div>
        )}
      </div>
    </div>
  );
}
