import React, { useState } from "react";
import { 
  AlertCircle,
  AlertTriangle, 
  Info, 
  Search, 
  Plus, 
  Check, 
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
        return <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case "Medium":
        return <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getRiskBadgeStyles = (level) => {
    switch (level) {
      case "High":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60";
      case "Medium":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60";
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
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          Flagged Clauses ({riskRadar.length})
        </h3>
        
        {riskRadar.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {riskRadar.map((risk, index) => (
              <Card 
                key={index} 
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/20 shadow-sm rounded-xl overflow-hidden transition-all duration-200"
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getRiskIcon(risk.riskLevel)}
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{risk.category}</span>
                    </div>
                    <Badge variant="outline" className={`${getRiskBadgeStyles(risk.riskLevel)} text-[10px] font-semibold uppercase tracking-wider`}>
                      {risk.riskLevel} Risk
                    </Badge>
                  </div>

                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {risk.riskReason}
                  </p>

                  {/* Trigger Clause Box */}
                  <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded p-3 space-y-1 relative">
                    <span className="text-[9px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block font-sans">Contract Wording:</span>
                    <p className="text-sm text-slate-800 dark:text-slate-200 italic leading-normal pr-8">
                      "{risk.triggerText}"
                    </p>
                    <button
                      onClick={() => onHighlightTrigger(risk.triggerText, risk.riskLevel)}
                      className="absolute right-2 top-2 p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 rounded-xl p-6 text-center text-sm">
            No risks detected for this persona.
          </div>
        )}
      </div>

      {/* Missing Clauses Section */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
          Missing Critical Clauses ({missingClauses.length})
        </h3>

        {missingClauses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {missingClauses.map((clause, index) => (
              <Card 
                key={index} 
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/20 shadow-sm rounded-xl overflow-hidden transition-all duration-200"
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{clause.clauseName}</span>
                    <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/60 text-[9px] font-medium uppercase tracking-wider">
                      Omitted
                    </Badge>
                  </div>

                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {clause.explanation}
                  </p>

                  {/* Template Snippet */}
                  <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded p-3 space-y-1 relative group">
                    <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block font-sans">Proposed Template Wording:</span>
                    <p className="text-sm text-slate-800 dark:text-slate-200 font-mono leading-normal pr-16 md:pr-8">
                      {clause.sampleTemplate}
                    </p>
                    <div className="absolute right-2 top-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => copyToClipboard(clause.sampleTemplate, index)}
                        className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                        title="Copy template"
                      >
                        {copiedIndex === index ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        onClick={() => onApplyBoilerplate(clause.sampleTemplate)}
                        className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 rounded-xl p-6 text-center text-sm">
            No critical clauses are missing.
          </div>
        )}
      </div>
    </div>
  );
}
