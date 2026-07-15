import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  MapPin, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Loader2, 
  RefreshCw 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";

const REGIONS = [
  { id: "USA", label: "🇺🇸 United States (Delaware/Federal)" },
  { id: "UK", label: "🇬🇧 United Kingdom (English Law)" },
  { id: "India", label: "🇮🇳 India (Companies Act / labor codes)" },
  { id: "Sri Lanka", label: "🇱🇰 Sri Lanka (Roman-Dutch / local acts)" }
];

export default function ComplianceGuard({
  contractId,
  isDemoMode,
  demoComplianceData
}) {
  const [region, setRegion] = useState("USA");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const fetchCompliance = async (targetRegion) => {
    setLoading(true);
    setError(null);
    try {
      if (isDemoMode) {
        // Return simulated compliance data
        setTimeout(() => {
          setReport(demoComplianceData(targetRegion));
          setLoading(false);
        }, 600);
        return;
      }

      // Live fetch
      const res = await api.getComplianceReport(contractId, targetRegion);
      setReport(res);
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to audit compliance.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contractId || isDemoMode) {
      fetchCompliance(region);
    }
  }, [contractId, region, isDemoMode]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "Compliant":
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 px-2 py-0.5 rounded-full uppercase tracking-wider">
            <CheckCircle className="w-3 h-3" /> Compliant
          </span>
        );
      case "Warning":
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950/30 border border-amber-800/40 px-2 py-0.5 rounded-full uppercase tracking-wider">
            <AlertTriangle className="w-3 h-3" /> Warning
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-950/30 border border-rose-800/40 px-2 py-0.5 rounded-full uppercase tracking-wider">
            <XCircle className="w-3 h-3" /> Critical
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Control panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/40 border border-slate-900 p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-slate-300">Target Legal Jurisdiction:</span>
        </div>

        <div className="flex gap-2">
          <Select
            value={region}
            onValueChange={(val) => {
              setRegion(val);
              fetchCompliance(val);
            }}
            disabled={loading}
          >
            <SelectTrigger className="w-[220px] bg-slate-900 border-slate-800 text-slate-200 h-8 rounded text-xs">
              <SelectValue placeholder="Select Country" />
            </SelectTrigger>
            <SelectContent className="bg-slate-950 border-slate-800 text-slate-200 text-xs">
              {REGIONS.map((r) => (
                <SelectItem key={r.id} value={r.id} className="cursor-pointer">
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            size="icon"
            variant="outline"
            onClick={() => fetchCompliance(region)}
            disabled={loading}
            className="w-8 h-8 border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Audit content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-xs">Running regional compliance scan...</span>
        </div>
      ) : error ? (
        <div className="glass-panel border-rose-900/50 p-6 text-center text-rose-400 text-xs rounded-xl">
          Error: {error}
        </div>
      ) : report ? (
        <div className="space-y-4">
          <div className="space-y-3">
            {report.report.map((item, index) => (
              <Card key={index} className="glass-panel border-slate-800/80">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-200">{item.area}</span>
                    {getStatusBadge(item.status)}
                  </div>
                  
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="bg-slate-950/60 border border-slate-900/80 p-2.5 rounded text-[11px] text-slate-400">
                    <strong className="text-indigo-400 font-semibold uppercase tracking-wider text-[9px] block mb-0.5">Recommendation:</strong>
                    {item.recommendation}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Legal Disclaimer */}
          <div className="border border-amber-900/30 bg-amber-950/5 rounded-lg p-3 flex gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] leading-relaxed text-amber-400/90 font-medium">
              {report.disclaimer || "Disclaimer: This compliance check is performed by AI for informational purposes only. It does not constitute formal legal counsel. For contract execution, please verify terms with a certified lawyer."}
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 text-slate-500 text-xs">
          Select a jurisdiction to audit this contract.
        </div>
      )}
    </div>
  );
}
