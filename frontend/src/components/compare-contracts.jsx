import React, { useState } from "react";
import { UploadCloud, Scale, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";

export default function CompareContracts({
  contractA,
  isDemoMode,
  demoCompareData
}) {
  const [fileB, setFileB] = useState(null);
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState(null);
  const [error, setError] = useState(null);

  const handleUploadB = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileB(file);
    setLoading(true);
    setError(null);

    try {
      if (isDemoMode) {
        // Return simulated comparison matrix
        setTimeout(() => {
          setComparison(demoCompareData);
          setLoading(false);
        }, 800);
        return;
      }

      // 1. Upload Contract B
      const uploadedB = await api.uploadContract(file);
      
      // 2. Perform comparison
      const res = await api.compareContracts(contractA.id, uploadedB.id);
      setComparison(res.comparison);
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to compare contracts.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoTrigger = () => {
    setLoading(true);
    setError(null);
    setFileB({ name: "Revised_Agreement_Draft.pdf" });
    
    setTimeout(() => {
      setComparison(demoCompareData);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="space-y-4">
      {/* Upload zone for Contract B */}
      {!comparison && !loading && (
        <Card className="bg-white dark:bg-slate-900 border-dashed border-slate-200 dark:border-slate-800 p-12 text-center rounded-xl shadow-sm">
          <CardContent className="flex flex-col items-center justify-center space-y-4 p-0">
            <UploadCloud className="w-16 h-16 text-slate-400 stroke-1" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Upload Second Contract (Contract B)</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[280px]">
                Select a revised draft or an alternative vendor agreement to perform a side-by-side matrix audit.
              </p>
            </div>

            <div className="flex gap-2">
              <input
                type="file"
                id="fileB-upload"
                className="hidden"
                accept=".pdf,.txt"
                onChange={handleUploadB}
              />
              <label 
                htmlFor="fileB-upload"
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 px-4 rounded cursor-pointer inline-flex items-center justify-center transition-all font-semibold"
              >
                Browse File
              </label>
              
              {isDemoMode && (
                <Button
                  variant="outline"
                  onClick={handleDemoTrigger}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 h-8 text-xs rounded px-3"
                >
                  Load Demo Compare Draft
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-xs font-semibold">Running side-by-side comparative analysis...</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 p-6 text-center text-rose-600 dark:text-rose-400 text-sm rounded-xl">
          Error: {error}
          <Button
            onClick={() => {
              setComparison(null);
              setFileB(null);
              setError(null);
            }}
            className="mt-3 block mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs h-8 rounded px-3"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Comparison table */}
      {comparison && !loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-lg">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Comparing: {contractA ? contractA.title : "Contract A"} vs {fileB ? fileB.name : "Contract B"}
              </span>
            </div>
            <Button
              variant="link"
              onClick={() => {
                setComparison(null);
                setFileB(null);
              }}
              className="text-[10px] text-indigo-400 p-0 h-auto"
            >
              Reset Comparison
            </Button>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-slate-500 dark:text-slate-400">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 uppercase tracking-widest text-[9px]">
                    <th className="p-3 w-1/4">Key Parameter</th>
                    <th className="p-3 w-1/4 border-l border-slate-200 dark:border-slate-800">Contract A</th>
                    <th className="p-3 w-1/4 border-l border-slate-200 dark:border-slate-800">Contract B</th>
                    <th className="p-3 w-1/4 border-l border-slate-200 dark:border-slate-800">AI Assessment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {comparison.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">{row.parameter}</td>
                      <td className="p-3 border-l border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">{row.contract_a_value}</td>
                      <td className="p-3 border-l border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">{row.contract_b_value}</td>
                      <td className="p-3 border-l border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed bg-indigo-50/30 dark:bg-indigo-950/10">
                        {row.comparison_note}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
