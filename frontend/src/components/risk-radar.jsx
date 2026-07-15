import React, { useState } from "react";
import { 
  AlertOctagon, 
  AlertTriangle, 
  Info, 
  Search, 
  Plus, 
  Check, 
  HelpCircle,
  Copy,
  PlusCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function RiskRadar({
  analysis,
  onHighlightTrigger,
  onApplyBoilerplate
}) {
  const { riskRadar = [], missingClauses = [] } = analysis || {};
  const [copiedIndex, setCopiedIndex] = useState(null);

  const getRiskIcon = (level) => {
    switch (level) {
      case "High":
        return <AlertOctagon className="w-4 h-4 text-rose-500" />;
      case "Medium":
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getRiskBadgeStyles = (level) => {
    switch (level) {
      case "High":
        return "bg-rose-950/40 text-rose-400 border-rose-800/60";
      case "Medium":
        return "bg-amber-950/40 text-amber-400 border-amber-800/60";
      default:
        return "bg-blue-950/40 text-blue-400 border-blue-800/60";
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Flagged Risks Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
          Flagged Clauses ({riskRadar.length})
        </h3>
        
        {riskRadar.length > 0 ? (
          <div className="space-y-3">
            {riskRadar.map((risk, index) => (
              <Card 
                key={index} 
                className="glass-panel border-slate-800/80 hover:border-slate-700/50 transition-all duration-200 overflow-hidden"
              >
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getRiskIcon(risk.riskLevel)}
                      <span className="text-xs font-bold text-slate-200">{risk.category}</span>
                    </div>
                    <Badge variant="outline" className={`${getRiskBadgeStyles(risk.riskLevel)} text-[10px] font-semibold uppercase tracking-wider`}>
                      {risk.riskLevel} Risk
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {risk.riskReason}
                  </p>

                  {/* Trigger Clause Box */}
                  <div className="bg-slate-950/80 border border-slate-900 rounded p-2.5 space-y-1 relative">
                    <span className="text-[9px] font-semibold text-indigo-400 uppercase tracking-widest block">Contract Wording:</span>
                    <p className="text-[11px] text-slate-400 italic leading-normal pr-8">
                      "{risk.triggerText}"
                    </p>
                    <button
                      onClick={() => onHighlightTrigger(risk.triggerText, risk.riskLevel)}
                      className="absolute right-2 top-2 p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30 transition-all"
                      title="Locate and highlight in contract"
                    >
                      <Search className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="glass-panel border-slate-800/80 rounded-xl p-6 text-center text-slate-500 text-xs">
            No risks detected for this persona.
          </div>
        )}
      </div>

      {/* Missing Clauses Section */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
          Missing Critical Clauses ({missingClauses.length})
        </h3>

        {missingClauses.length > 0 ? (
          <div className="space-y-3">
            {missingClauses.map((clause, index) => (
              <Card 
                key={index} 
                className="glass-panel border-slate-800/80 hover:border-slate-700/50 transition-all duration-200"
              >
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{clause.clauseName}</span>
                    <Badge variant="outline" className="bg-indigo-950/20 text-indigo-400 border-indigo-900/40 text-[9px] font-medium uppercase tracking-wider">
                      Omitted
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {clause.explanation}
                  </p>

                  {/* Template Snippet */}
                  <div className="bg-slate-950/80 border border-slate-900 rounded p-2.5 space-y-1 relative group">
                    <span className="text-[9px] font-semibold text-emerald-400 uppercase tracking-widest block">Proposed Template Wording:</span>
                    <p className="text-[11px] text-slate-400 font-mono leading-normal pr-8">
                      {clause.sampleTemplate}
                    </p>
                    <div className="absolute right-2 top-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => copyToClipboard(clause.sampleTemplate, index)}
                        className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all"
                        title="Copy template"
                      >
                        {copiedIndex === index ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        onClick={() => onApplyBoilerplate(clause.sampleTemplate)}
                        className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-indigo-400 transition-all"
                        title="Append to contract draft"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="glass-panel border-slate-800/80 rounded-xl p-6 text-center text-slate-500 text-xs">
            No critical clauses are missing.
          </div>
        )}
      </div>
    </div>
  );
}
