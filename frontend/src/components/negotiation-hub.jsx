import React, { useState } from "react";
import { Edit3, Check, Copy, ArrowRightLeft, ShieldAlert } from "lucide-react";
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
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400" />
          Negotiation Suggestions ({negotiations.length})
        </h3>
      </div>

      {negotiations.length > 0 ? (
        <div className="space-y-4">
          {negotiations.map((item, index) => {
            const isApplied = appliedIndices.has(index);

            return (
              <Card 
                key={index} 
                className="glass-panel border-slate-800/80 hover:border-slate-700/40 transition-all duration-200 overflow-hidden relative"
              >
                {/* Visual indicator if applied */}
                {isApplied && (
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-emerald-500 shadow-lg shadow-emerald-500/20" />
                )}
                
                <CardContent className="p-4 space-y-4">
                  
                  {/* Explanatory benefit */}
                  <div className="flex gap-2">
                    <Edit3 className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-slate-200 leading-relaxed">
                      {item.explanation}
                    </p>
                  </div>

                  {/* Red/Green side-by-side diff */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    
                    {/* Original Clause */}
                    <div className="bg-rose-950/10 border border-rose-900/30 rounded-lg p-3 space-y-1.5">
                      <span className="text-[9px] font-bold text-rose-400 uppercase tracking-widest block">Original Wording</span>
                      <p className="text-[11px] text-slate-400 leading-relaxed italic">
                        "{item.triggerText}"
                      </p>
                    </div>

                    {/* Proposed Wording */}
                    <div className="bg-emerald-950/15 border border-emerald-900/40 rounded-lg p-3 space-y-1.5 relative group">
                      <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block">Proposed Balanced Wording</span>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {item.proposedWording}
                      </p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex justify-end items-center gap-2 pt-1 border-t border-slate-900/50">
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(item.proposedWording, index)}
                      className="bg-slate-950/60 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900 h-8 text-[11px] rounded"
                    >
                      {copiedIndex === index ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400 mr-1" />
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
                          ? "bg-emerald-950/20 text-emerald-400 border border-emerald-800/20" 
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
