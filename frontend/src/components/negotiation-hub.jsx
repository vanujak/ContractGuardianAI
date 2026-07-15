import React, { useState } from "react";
import { Edit3, Check, Copy, ArrowRightLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NegotiationHub({
  analysis,
  onApplyRevision
}) {
  const { negotiations = [] } = analysis || {};
  const [appliedIndices, setAppliedIndices] = useState(new Set());
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleApply = (original, proposed, index) => {
    onApplyRevision(original, proposed);
    setAppliedIndices(prev => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400" />
          Negotiation Suggestions ({negotiations.length})
        </h3>
      </div>

      {negotiations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {negotiations.map((item, index) => {
            const isApplied = appliedIndices.has(index);

            return (
              <Card 
                key={index} 
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/20 shadow-sm rounded-xl overflow-hidden relative transition-all duration-200"
              >
                {/* Visual indicator if applied */}
                {isApplied && (
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-emerald-500 shadow-lg shadow-emerald-500/20" />
                )}
                
                <CardContent className="p-4 space-y-4">
                  
                  {/* Explanatory benefit */}
                  <div className="flex gap-2">
                    <Edit3 className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-slate-900 dark:text-slate-100 leading-relaxed font-medium">
                      {item.explanation}
                    </p>
                  </div>

                  {/* Red/Green side-by-side diff */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    
                    {/* Original Clause */}
                    <div className="bg-rose-50/50 dark:bg-rose-950/10 border border-rose-200 dark:border-rose-900/30 rounded-lg p-3 space-y-1.5">
                      <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest block font-sans">Original Wording</span>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
                        "{item.triggerText}"
                      </p>
                    </div>

                    {/* Proposed Wording */}
                    <div className="bg-emerald-50/50 dark:bg-emerald-950/15 border border-emerald-200 dark:border-emerald-900/40 rounded-lg p-3 space-y-1.5 relative group">
                      <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block font-sans">Proposed Balanced Wording</span>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {item.proposedWording}
                      </p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex justify-end items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(item.proposedWording, index)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 h-8 text-[11px] rounded px-3"
                    >
                      {copiedIndex === index ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500 mr-1" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                    
                    <Button
                      disabled={isApplied}
                      onClick={() => handleApply(item.triggerText, item.proposedWording, index)}
                      className={`h-8 text-[11px] rounded font-semibold transition-all duration-300 ${
                        isApplied 
                          ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/10"
                      }`}
                    >
                      {isApplied ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Revision Applied
                        </>
                      ) : (
                        <>
                          <Edit3 className="w-3.5 h-3.5 mr-1" />
                          Apply Suggestion
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel border-slate-800/80 rounded-xl p-6 text-center text-slate-500 text-xs">
          No negotiation items proposed for this persona.
        </div>
      )}
    </div>
  );
}
