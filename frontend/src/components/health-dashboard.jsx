import React from "react";
import { AlertTriangle, ShieldCheck, ListChecks, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HealthDashboard({
  analysis,
  onNavigateTab
}) {
  const {
    fairnessScore = 50,
    riskScore = 50,
    summary = [],
    riskRadar = [],
    negotiations = []
  } = analysis || {};

  // Color logic for scores
  const getFairnessColor = (score) => {
    if (score >= 70) return "stroke-emerald-500 text-emerald-400";
    if (score >= 45) return "stroke-amber-500 text-amber-400";
    return "stroke-rose-500 text-rose-400";
  };

  const getRiskColor = (score) => {
    if (score >= 70) return "stroke-rose-500 text-rose-400";
    if (score >= 40) return "stroke-amber-500 text-amber-400";
    return "stroke-emerald-500 text-emerald-400";
  };

  return (
    <div className="space-y-6">
      {/* Visual Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fairness Score */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
            <span className="text-sm font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase mb-2">Fairness Score</span>
            
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-slate-100 dark:stroke-slate-800 fill-none"
                  strokeWidth="8"
                />
                {/* Progress Circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className={`fill-none transition-all duration-1000 ease-out ${getFairnessColor(fairnessScore)}`}
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - fairnessScore / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{fairnessScore}%</span>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">
                  {fairnessScore >= 70 ? "Balanced" : fairnessScore >= 45 ? "Moderate" : "One-sided"}
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-4 max-w-[240px]">
              Measures how reciprocal and balanced this contract is from your perspective.
            </p>
          </CardContent>
        </Card>

        {/* Risk Score */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl" />
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
            <span className="text-sm font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase mb-2">Overall Risk</span>
            
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-slate-100 dark:stroke-slate-800 fill-none"
                  strokeWidth="8"
                />
                {/* Progress Circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className={`fill-none transition-all duration-1000 ease-out ${getRiskColor(riskScore)}`}
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - riskScore / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{riskScore}%</span>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">
                  {riskScore >= 70 ? "CRITICAL" : riskScore >= 40 ? "WARNING" : "LOW RISK"}
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-4 max-w-[240px]">
              Measures exposure to potential lawsuits, heavy penalties, or lock-in terms.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actionable Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        {/* Missing Clauses Card */}
        <div 
          onClick={() => onNavigateTab("radar")}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 p-5 rounded-xl cursor-pointer transition-all duration-200 group hover:shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Risky Clauses</span>
            <AlertTriangle className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-0.5">{riskRadar.length}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Items flagged for review</div>
        </div>

        {/* Negotiation Card */}
        <div 
          onClick={() => onNavigateTab("negotiation")}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 p-5 rounded-xl cursor-pointer transition-all duration-200 group hover:shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Negotiations</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-0.5">{negotiations.length}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Opportunities to improve</div>
        </div>
      </div>

      {/* 3-Minute Executive Summary */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl">
        <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800">
          <CardTitle className="text-sm font-semibold tracking-wider text-slate-900 dark:text-slate-100 uppercase flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-indigo-400" />
            3-Minute Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {summary.length > 0 ? (
            <ul className="space-y-3">
              {summary.map((point, index) => (
                <li key={index} className="flex gap-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  <span className="text-indigo-500 dark:text-indigo-400 mt-1 select-none font-bold">▪</span>
                  <span dangerouslySetInnerHTML={{ __html: point.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900 dark:text-white font-semibold">$1</strong>') }} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-slate-500">
              <HelpCircle className="w-8 h-8 stroke-1 mb-2" />
              <span className="text-sm">No summary points generated.</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
